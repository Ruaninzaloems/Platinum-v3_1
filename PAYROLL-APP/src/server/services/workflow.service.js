const { query: dbQuery } = require('../config/database');
const { sendNotification } = require('./notification.service');

async function resolveWorkflowDefinition(module, employeeId) {
  if (!employeeId) {
    const defResult = await dbQuery(
      `SELECT * FROM workflow_definitions WHERE module = $1 AND enabled = TRUE ORDER BY id DESC LIMIT 1`,
      [module]
    );
    return defResult.rows[0] || null;
  }

  let divisionId = null;
  let departmentId = null;
  try {
    const empResult = await dbQuery(
      `SELECT e.division_id, e.department_id FROM employees e WHERE e.id = $1`,
      [employeeId]
    );
    const emp = empResult.rows[0];
    divisionId = emp?.division_id || null;
    departmentId = emp?.department_id || null;
  } catch (empErr) {
    console.warn('Could not resolve employee scope:', empErr.message);
  }

  if (divisionId) {
    try {
      const divMatch = await dbQuery(
        `SELECT * FROM workflow_definitions
         WHERE module = $1 AND enabled = TRUE AND division_id = $2
         ORDER BY id DESC LIMIT 1`,
        [module, divisionId]
      );
      if (divMatch.rows.length > 0) return divMatch.rows[0];
    } catch (_) {}
  }

  if (departmentId) {
    try {
      const deptMatch = await dbQuery(
        `SELECT * FROM workflow_definitions
         WHERE module = $1 AND enabled = TRUE AND department_id = $2 AND division_id IS NULL
         ORDER BY id DESC LIMIT 1`,
        [module, departmentId]
      );
      if (deptMatch.rows.length > 0) return deptMatch.rows[0];
    } catch (_) {}
  }

  const defaultMatch = await dbQuery(
    `SELECT * FROM workflow_definitions
     WHERE module = $1 AND enabled = TRUE AND department_id IS NULL AND division_id IS NULL
     ORDER BY id DESC LIMIT 1`,
    [module]
  );
  return defaultMatch.rows[0] || null;
}

async function resolveAssignedUserId(employeeApproverId) {
  if (!employeeApproverId) return null;
  const userResult = await dbQuery(
    `SELECT id FROM users WHERE employee_id = $1 LIMIT 1`,
    [employeeApproverId]
  );
  if (!userResult.rows[0]?.id) {
    console.warn(`No user found linked to employee_id ${employeeApproverId} — step may not appear in pending actions`);
    return null;
  }
  return userResult.rows[0].id;
}

async function parseLevels(definition) {
  const steps = definition.steps || [];
  if (!Array.isArray(steps) || steps.length === 0) return [];
  if (steps[0].assigned_users && Array.isArray(steps[0].assigned_users)) {
    return steps;
  }
  const levels = [];
  for (const s of steps) {
    let userIds = [];
    if (s.assigned_to) {
      const resolvedUserId = await resolveAssignedUserId(s.assigned_to);
      if (resolvedUserId) userIds.push(resolvedUserId);
    }
    levels.push({
      assigned_users: userIds,
      assigned_role: s.assigned_role || null,
      sla_hours: s.sla_hours || 48,
      escalation_role: s.escalation_role || 'HR_MANAGER'
    });
  }
  return levels;
}

async function notifyLevelUsers(userIds, entityType, instanceId, levelNumber) {
  for (const uid of userIds) {
    try {
      await sendNotification(
        uid,
        'WORKFLOW',
        `Approval Required: ${entityType}`,
        `A ${entityType} item requires your approval (Level ${levelNumber}).`,
        `/workflows/${instanceId}`,
        'HIGH'
      );
    } catch (err) {
      console.warn(`Failed to notify user ${uid}:`, err.message);
    }
  }
}

async function initWorkflow(module, entityId, initiatorId, employeeId) {
  const definition = await resolveWorkflowDefinition(module, employeeId || null);

  if (!definition) {
    return null;
  }

  const levels = await parseLevels(definition);
  if (levels.length === 0) return null;

  const instanceResult = await dbQuery(
    `INSERT INTO workflow_instances (definition_id, entity_type, entity_id, current_step, status, initiated_by)
     VALUES ($1, $2, $3, 1, 'PENDING', $4) RETURNING *`,
    [definition.id, definition.entity_type, entityId, initiatorId]
  );

  const instance = instanceResult.rows[0];

  for (let i = 0; i < levels.length; i++) {
    const level = levels[i];
    const slaHours = level.sla_hours || 48;
    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);
    const assignedUsers = level.assigned_users || [];

    await dbQuery(
      `INSERT INTO workflow_steps (instance_id, step_number, assigned_to, assigned_users, assigned_role, action, status, sla_deadline)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        instance.id,
        i + 1,
        assignedUsers[0] || null,
        assignedUsers,
        level.assigned_role || null,
        'APPROVE',
        i === 0 ? 'PENDING' : 'WAITING',
        slaDeadline
      ]
    );
  }

  const firstLevel = levels[0];
  const firstUsers = firstLevel.assigned_users || [];
  if (firstUsers.length > 0) {
    await notifyLevelUsers(firstUsers, definition.entity_type, instance.id, 1);
  }

  return instance;
}

async function actionStep(stepId, action, userId, comments, userRoles) {
  const stepResult = await dbQuery(
    `SELECT ws.*, wi.definition_id, wi.entity_type, wi.entity_id, wi.initiated_by, wi.status as instance_status
     FROM workflow_steps ws
     JOIN workflow_instances wi ON ws.instance_id = wi.id
     WHERE ws.id = $1`,
    [stepId]
  );

  if (!stepResult.rows.length) {
    throw new Error('Workflow step not found');
  }

  const step = stepResult.rows[0];

  if (step.status !== 'PENDING') {
    throw new Error('Step is not pending');
  }

  const assignedUsers = step.assigned_users || [];
  const numUserId = Number(userId);
  const isInLevelList = assignedUsers.some(u => Number(u) === numUserId);

  const delegationCheck = await dbQuery(
    `SELECT * FROM delegations
     WHERE to_user = $1 AND active = TRUE
     AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE
     AND (module = $2 OR module IS NULL)`,
    [userId, step.entity_type]
  );

  const isDelegated = delegationCheck.rows.length > 0;
  const isLegacyAssigned = Number(step.assigned_to) === numUserId;

  let hasRoleAccess = false;
  if (step.assigned_role) {
    const roleCheck = await dbQuery(
      `SELECT 1 FROM roles r JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = $1 AND r.name = $2 LIMIT 1`,
      [userId, step.assigned_role]
    );
    hasRoleAccess = roleCheck.rows.length > 0;
    if (!hasRoleAccess && Array.isArray(userRoles) && userRoles.length > 0) {
      const normalizedAssignedRole = step.assigned_role.toLowerCase().replace(/[\s_-]+/g, '_');
      hasRoleAccess = userRoles.some(r => {
        const normalizedUserRole = String(r).toLowerCase().replace(/[\s_-]+/g, '_');
        return normalizedUserRole === normalizedAssignedRole;
      });
    }
  }

  const isAuthorized = isInLevelList || isLegacyAssigned || isDelegated || hasRoleAccess;
  const hasAssignment = assignedUsers.length > 0 || step.assigned_to || step.assigned_role;

  if (hasAssignment && !isAuthorized) {
    throw new Error('You are not assigned to this step');
  }

  const validActions = ['APPROVE', 'REJECT', 'RETURN'];
  if (!validActions.includes(action.toUpperCase())) {
    throw new Error('Invalid action. Must be APPROVE, REJECT, or RETURN');
  }

  const statusMap = { APPROVE: 'APPROVED', REJECT: 'REJECTED', RETURN: 'RETURNED' };
  const upperAction = action.toUpperCase();
  if (upperAction !== 'RETURN') {
    await dbQuery(
      `UPDATE workflow_steps SET status = $1, actioned_by = $2, actioned_at = NOW(), comments = $3
       WHERE id = $4`,
      [statusMap[upperAction], userId, comments || null, stepId]
    );
  }

  if (upperAction === 'APPROVE') {
    const nextStep = await dbQuery(
      `SELECT * FROM workflow_steps
       WHERE instance_id = $1 AND step_number = $2 AND status = 'WAITING'`,
      [step.instance_id, step.step_number + 1]
    );

    if (nextStep.rows.length > 0) {
      await dbQuery(
        `UPDATE workflow_steps SET status = 'PENDING' WHERE id = $1`,
        [nextStep.rows[0].id]
      );
      await dbQuery(
        `UPDATE workflow_instances SET current_step = $1, status = 'IN_PROGRESS' WHERE id = $2`,
        [step.step_number + 1, step.instance_id]
      );

      const nextAssignedUsers = nextStep.rows[0].assigned_users || [];
      if (nextAssignedUsers.length > 0) {
        await notifyLevelUsers(nextAssignedUsers, step.entity_type, step.instance_id, step.step_number + 1);
      } else if (nextStep.rows[0].assigned_to) {
        await sendNotification(
          nextStep.rows[0].assigned_to,
          'WORKFLOW',
          `Approval Required: ${step.entity_type}`,
          `A ${step.entity_type} item requires your approval (Level ${step.step_number + 1}).`,
          `/workflows/${step.instance_id}`,
          'HIGH'
        );
      }
    } else {
      await dbQuery(
        `UPDATE workflow_instances SET status = 'APPROVED', completed_at = NOW() WHERE id = $1`,
        [step.instance_id]
      );

      if (step.initiated_by) {
        await sendNotification(
          step.initiated_by,
          'WORKFLOW',
          `Workflow Approved: ${step.entity_type}`,
          `Your ${step.entity_type} request has been fully approved.`,
          `/workflows/${step.instance_id}`,
          'MEDIUM'
        );
      }
    }
  } else if (action.toUpperCase() === 'REJECT') {
    await dbQuery(
      `UPDATE workflow_instances SET status = 'REJECTED', completed_at = NOW() WHERE id = $1`,
      [step.instance_id]
    );

    if (step.initiated_by) {
      await sendNotification(
        step.initiated_by,
        'WORKFLOW',
        `Workflow Rejected: ${step.entity_type}`,
        `Your ${step.entity_type} request has been rejected. Reason: ${comments || 'No reason provided'}`,
        `/workflows/${step.instance_id}`,
        'HIGH'
      );
    }
  } else if (action.toUpperCase() === 'RETURN') {
    const prevStep = await dbQuery(
      `SELECT * FROM workflow_steps
       WHERE instance_id = $1 AND step_number = $2`,
      [step.instance_id, step.step_number - 1]
    );

    if (prevStep.rows.length > 0) {
      await dbQuery(
        `UPDATE workflow_steps SET status = 'WAITING', actioned_by = NULL, actioned_at = NULL, comments = $2 WHERE id = $1`,
        [stepId, comments || null]
      );
      await dbQuery(
        `UPDATE workflow_steps SET status = 'PENDING', actioned_by = NULL, actioned_at = NULL WHERE id = $1`,
        [prevStep.rows[0].id]
      );
      await dbQuery(
        `UPDATE workflow_instances SET current_step = $1 WHERE id = $2`,
        [step.step_number - 1, step.instance_id]
      );

      const prevAssignedUsers = prevStep.rows[0].assigned_users || [];
      if (prevAssignedUsers.length > 0) {
        await notifyLevelUsers(prevAssignedUsers, step.entity_type, step.instance_id, step.step_number - 1);
      }
    } else {
      await dbQuery(
        `UPDATE workflow_steps SET status = 'RETURNED', actioned_by = $2, actioned_at = NOW(), comments = $3 WHERE id = $1`,
        [stepId, userId, comments || null]
      );
      await dbQuery(
        `UPDATE workflow_instances SET status = 'RETURNED', current_step = 0 WHERE id = $1`,
        [step.instance_id]
      );

      if (step.initiated_by) {
        await sendNotification(
          step.initiated_by,
          'WORKFLOW',
          `Returned for Correction: ${step.entity_type}`,
          `Your ${step.entity_type} request has been returned for correction. Reason: ${comments || 'No reason provided'}`,
          `/workflows/${step.instance_id}`,
          'HIGH'
        );
      }
    }
  }

  const updated = await dbQuery(
    `SELECT ws.*, wi.status as instance_status, wi.entity_type, wi.entity_id
     FROM workflow_steps ws
     JOIN workflow_instances wi ON ws.instance_id = wi.id
     WHERE ws.id = $1`,
    [stepId]
  );

  return updated.rows[0];
}

async function checkEscalations() {
  const overdueSteps = await dbQuery(
    `SELECT ws.*, wi.entity_type, wi.entity_id, wi.initiated_by, wd.steps as definition_steps
     FROM workflow_steps ws
     JOIN workflow_instances wi ON ws.instance_id = wi.id
     JOIN workflow_definitions wd ON wi.definition_id = wd.id
     WHERE ws.status = 'PENDING'
     AND ws.escalated = FALSE
     AND ws.sla_deadline < NOW()`
  );

  const escalated = [];

  for (const step of overdueSteps.rows) {
    await dbQuery(
      `UPDATE workflow_steps SET escalated = TRUE WHERE id = $1`,
      [step.id]
    );

    const defSteps = step.definition_steps || [];
    const currentDef = defSteps[step.step_number - 1];
    const escalationRole = currentDef?.escalation_role || 'HR_MANAGER';

    const usersToNotify = step.assigned_users || (step.assigned_to ? [step.assigned_to] : []);
    for (const uid of usersToNotify) {
      await sendNotification(
        uid,
        'ESCALATION',
        `Overdue Approval: ${step.entity_type}`,
        `Your approval for ${step.entity_type} is overdue. This item has been escalated.`,
        `/workflows/${step.instance_id}`,
        'URGENT'
      );
    }

    escalated.push({
      step_id: step.id,
      instance_id: step.instance_id,
      entity_type: step.entity_type,
      escalation_role: escalationRole,
      sla_deadline: step.sla_deadline
    });
  }

  return escalated;
}

async function getMyPendingActions(userId) {
  const delegations = await dbQuery(
    `SELECT from_user, module FROM delegations
     WHERE to_user = $1 AND active = TRUE
     AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE`,
    [userId]
  );

  const delegatedUsers = delegations.rows.map(d => d.from_user);
  const allUserIds = [userId, ...delegatedUsers];

  const result = await dbQuery(
    `SELECT ws.*, wi.entity_type, wi.entity_id, wi.initiated_by, wi.initiated_at,
            wd.name as workflow_name, wd.module
     FROM workflow_steps ws
     JOIN workflow_instances wi ON ws.instance_id = wi.id
     JOIN workflow_definitions wd ON wi.definition_id = wd.id
     WHERE ws.status = 'PENDING'
     AND (
       ws.assigned_users && $1::int[]
       OR ws.assigned_to = ANY($1)
       OR ws.assigned_role IN (
         SELECT r.name FROM roles r
         JOIN user_roles ur ON r.id = ur.role_id
         WHERE ur.user_id = $2
       )
     )
     ORDER BY ws.sla_deadline ASC NULLS LAST`,
    [allUserIds, userId]
  );

  return result.rows;
}

async function getDelegations(userId) {
  const result = await dbQuery(
    `SELECT d.*,
            fu.username as from_username,
            tu.username as to_username
     FROM delegations d
     LEFT JOIN users fu ON d.from_user = fu.id
     LEFT JOIN users tu ON d.to_user = tu.id
     WHERE (d.from_user = $1 OR d.to_user = $1)
     ORDER BY d.created_at DESC`,
    [userId]
  );

  return result.rows;
}

async function autoAdvanceInitiatorSteps(instanceId, initiatorId) {
  const autoApprovedSteps = [];

  while (true) {
    const pendingStep = await dbQuery(
      `SELECT ws.*, wi.entity_type, wi.entity_id, wi.initiated_by, wi.status as instance_status
       FROM workflow_steps ws
       JOIN workflow_instances wi ON ws.instance_id = wi.id
       WHERE ws.instance_id = $1 AND ws.status = 'PENDING'
       ORDER BY ws.step_number LIMIT 1`,
      [instanceId]
    );

    if (!pendingStep.rows.length) break;

    const step = pendingStep.rows[0];
    const assignedUsers = step.assigned_users || [];
    const isInitiatorAssigned = assignedUsers.some(u => Number(u) === Number(initiatorId));

    if (!isInitiatorAssigned) break;

    await dbQuery(
      `UPDATE workflow_steps SET status = 'APPROVED', actioned_by = $1, actioned_at = NOW(), comments = $2
       WHERE id = $3`,
      [initiatorId, 'Auto-approved (capturer is assigned approver)', step.id]
    );

    const nextStep = await dbQuery(
      `SELECT * FROM workflow_steps
       WHERE instance_id = $1 AND step_number = $2 AND status = 'WAITING'`,
      [instanceId, step.step_number + 1]
    );

    if (nextStep.rows.length > 0) {
      await dbQuery(
        `UPDATE workflow_steps SET status = 'PENDING' WHERE id = $1`,
        [nextStep.rows[0].id]
      );
      await dbQuery(
        `UPDATE workflow_instances SET current_step = $1, status = 'IN_PROGRESS' WHERE id = $2`,
        [step.step_number + 1, instanceId]
      );
    } else {
      await dbQuery(
        `UPDATE workflow_instances SET status = 'APPROVED', completed_at = NOW() WHERE id = $1`,
        [instanceId]
      );
    }

    autoApprovedSteps.push({ stepNumber: step.step_number, stepId: step.id });
  }

  if (autoApprovedSteps.length === 0) return null;

  const remainingPending = await dbQuery(
    `SELECT ws.*, wi.entity_type FROM workflow_steps ws
     JOIN workflow_instances wi ON ws.instance_id = wi.id
     WHERE ws.instance_id = $1 AND ws.status = 'PENDING'
     ORDER BY ws.step_number LIMIT 1`,
    [instanceId]
  );
  if (remainingPending.rows.length > 0) {
    const nextPending = remainingPending.rows[0];
    const nextAssignedUsers = nextPending.assigned_users || [];
    if (nextAssignedUsers.length > 0) {
      await notifyLevelUsers(nextAssignedUsers, nextPending.entity_type, instanceId, nextPending.step_number);
    }
  }

  const instanceResult = await dbQuery(
    `SELECT wi.status, wi.current_step,
            (SELECT COUNT(*) FROM workflow_steps WHERE instance_id = wi.id) AS total_steps
     FROM workflow_instances wi WHERE wi.id = $1`,
    [instanceId]
  );
  const inst = instanceResult.rows[0];

  return {
    autoApprovedSteps,
    instanceStatus: inst.status,
    currentStep: inst.current_step,
    totalSteps: parseInt(inst.total_steps)
  };
}

module.exports = {
  initWorkflow,
  resolveWorkflowDefinition,
  actionStep,
  autoAdvanceInitiatorSteps,
  checkEscalations,
  getMyPendingActions,
  getDelegations
};
