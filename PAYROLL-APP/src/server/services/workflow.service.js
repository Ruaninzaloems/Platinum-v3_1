const { query: dbQuery } = require('../config/database');
const { sendNotification } = require('./notification.service');

async function initWorkflow(module, entityId, initiatorId) {
  const defResult = await dbQuery(
    `SELECT * FROM workflow_definitions WHERE module = $1 AND enabled = TRUE ORDER BY id DESC LIMIT 1`,
    [module]
  );

  if (!defResult.rows.length) {
    return null;
  }

  const definition = defResult.rows[0];
  const steps = definition.steps || [];

  const instanceResult = await dbQuery(
    `INSERT INTO workflow_instances (definition_id, entity_type, entity_id, current_step, status, initiated_by)
     VALUES ($1, $2, $3, 1, 'PENDING', $4) RETURNING *`,
    [definition.id, definition.entity_type, entityId, initiatorId]
  );

  const instance = instanceResult.rows[0];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const slaHours = step.sla_hours || 48;
    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

    await dbQuery(
      `INSERT INTO workflow_steps (instance_id, step_number, assigned_to, assigned_role, action, status, sla_deadline)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        instance.id,
        i + 1,
        step.assigned_to || null,
        step.assigned_role || null,
        step.action || 'APPROVE',
        i === 0 ? 'PENDING' : 'WAITING',
        slaDeadline
      ]
    );
  }

  if (steps.length > 0 && steps[0].assigned_to) {
    await sendNotification(
      steps[0].assigned_to,
      'WORKFLOW',
      `Approval Required: ${module}`,
      `A new ${module} item requires your approval.`,
      `/workflows/${instance.id}`,
      'HIGH'
    );
  }

  return instance;
}

async function actionStep(stepId, action, userId, comments) {
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

  const delegationCheck = await dbQuery(
    `SELECT * FROM delegations
     WHERE to_user = $1 AND active = TRUE
     AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE
     AND (module = $2 OR module IS NULL)`,
    [userId, step.entity_type]
  );

  const isAssigned = step.assigned_to === userId || delegationCheck.rows.length > 0;
  if (step.assigned_to && !isAssigned) {
    throw new Error('You are not assigned to this step');
  }

  const validActions = ['APPROVE', 'REJECT', 'RETURN'];
  if (!validActions.includes(action.toUpperCase())) {
    throw new Error('Invalid action. Must be APPROVE, REJECT, or RETURN');
  }

  await dbQuery(
    `UPDATE workflow_steps SET status = $1, actioned_by = $2, actioned_at = NOW(), comments = $3
     WHERE id = $4`,
    [action.toUpperCase() === 'APPROVE' ? 'APPROVED' : action.toUpperCase() === 'REJECT' ? 'REJECTED' : 'RETURNED',
     userId, comments || null, stepId]
  );

  if (action.toUpperCase() === 'APPROVE') {
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

      if (nextStep.rows[0].assigned_to) {
        await sendNotification(
          nextStep.rows[0].assigned_to,
          'WORKFLOW',
          `Approval Required: ${step.entity_type}`,
          `A ${step.entity_type} item requires your approval (Step ${step.step_number + 1}).`,
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
        `UPDATE workflow_steps SET status = 'PENDING', actioned_by = NULL, actioned_at = NULL WHERE id = $1`,
        [prevStep.rows[0].id]
      );
      await dbQuery(
        `UPDATE workflow_instances SET current_step = $1 WHERE id = $2`,
        [step.step_number - 1, step.instance_id]
      );
    } else {
      await dbQuery(
        `UPDATE workflow_instances SET status = 'REJECTED', completed_at = NOW() WHERE id = $1`,
        [step.instance_id]
      );
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

    if (step.assigned_to) {
      await sendNotification(
        step.assigned_to,
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
     AND (ws.assigned_to = ANY($1) OR ws.assigned_role IN (
       SELECT r.name FROM roles r
       JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = $2
     ))
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

module.exports = {
  initWorkflow,
  actionStep,
  checkEscalations,
  getMyPendingActions,
  getDelegations
};
