const { query: dbQuery, getClient } = require('../config/database');
const { initWorkflow, actionStep, resolveWorkflowDefinition, autoAdvanceInitiatorSteps } = require('./workflow.service');

// ENTITY_CONFIG — Registration map for all transaction types that use the unified approval workflow.
//
// Every new transaction type (e.g. OVERTIME, LEAVE, BONUS) MUST be registered here
// so that it gets full approval-history tracking and entity-status updates via
// handleApproval / handleRejection / handleReturn.
//
// Required fields per entry:
//   table          — the main entity table (e.g. 'claims', 'wage_transactions')
//   idColumn       — primary-key column in that table (usually 'id')
//   historyTable   — companion history table for audit trail
//   historyFk      — foreign-key column in the history table pointing back to the entity
//   employeeIdField — column that holds the employee ID on the entity row
//   createdByField  — column that holds the user ID who created the entity
//
// If a type is NOT registered here the generic workflow endpoint will fall back to
// raw actionStep(), which skips history writes and entity-status updates.
// A console warning is emitted when the fallback is used — if you see it, register
// the type in this map.
const ENTITY_CONFIG = {
  CLAIM: {
    table: 'claims',
    idColumn: 'id',
    historyTable: 'claim_history',
    historyFk: 'claim_id',
    employeeIdField: 'employee_id',
    createdByField: 'created_by'
  },
  WAGE: {
    table: 'wage_transactions',
    idColumn: 'id',
    historyTable: 'wage_transaction_history',
    historyFk: 'wage_transaction_id',
    employeeIdField: 'employee_id',
    createdByField: 'created_by'
  },
  OVERTIME: {
    table: 'overtime_transactions',
    idColumn: 'id',
    historyTable: 'overtime_transaction_history',
    historyFk: 'overtime_transaction_id',
    employeeIdField: 'employee_id',
    createdByField: 'created_by'
  },
  INSTALLMENT: {
    table: 'instalments',
    idColumn: 'id',
    historyTable: 'instalment_history',
    historyFk: 'instalment_id',
    employeeIdField: 'employee_id',
    createdByField: 'created_by'
  },
  LEAVE_REQUEST: {
    table: 'leave_transactions',
    idColumn: 'id',
    historyTable: 'leave_transaction_history',
    historyFk: 'leave_transaction_id',
    employeeIdField: 'employee_id',
    createdByField: 'created_by'
  },
  LEAVE_ADJUSTMENT: {
    table: 'leave_adjustments',
    idColumn: 'id',
    historyTable: 'leave_adjustment_history',
    historyFk: 'leave_adjustment_id',
    employeeIdField: 'employee_id',
    createdByField: 'created_by'
  }
};

function getConfig(entityType) {
  const cfg = ENTITY_CONFIG[entityType];
  if (!cfg) throw new Error(`Unknown entity type: ${entityType}`);
  return cfg;
}

async function writeHistory(entityType, entityId, action, userId, comments, stepNumber, statusAfter) {
  const cfg = getConfig(entityType);
  await dbQuery(
    `INSERT INTO ${cfg.historyTable} (${cfg.historyFk}, action, performed_by, comments, step_number, status_after)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [entityId, action, userId, comments || null, stepNumber || null, statusAfter || null]
  );
}

async function findPendingWorkflowStep(entityType, entityId) {
  const result = await dbQuery(
    `SELECT wi.id AS instance_id, ws.id AS step_id, ws.step_number,
            (SELECT COUNT(*) FROM workflow_steps WHERE instance_id = wi.id) AS total_steps
     FROM workflow_instances wi
     JOIN workflow_steps ws ON ws.instance_id = wi.id AND ws.status = 'PENDING'
     WHERE wi.entity_type = $1 AND wi.entity_id = $2 AND wi.status IN ('PENDING','IN_PROGRESS')
     ORDER BY ws.step_number LIMIT 1`,
    [entityType, entityId]
  );
  return result.rows[0] || null;
}

async function ensureWorkflowInstance(entityType, entityId, initiatorId, employeeId) {
  let step = await findPendingWorkflowStep(entityType, entityId);
  if (step) return step;

  try {
    const instance = await initWorkflow(entityType, entityId, initiatorId, employeeId);
    if (!instance) return null;
    step = await findPendingWorkflowStep(entityType, entityId);
    return step;
  } catch (err) {
    console.warn(`Could not init workflow for ${entityType} ${entityId}:`, err.message);
    return null;
  }
}

async function hasWorkflowDefinition(entityType) {
  const result = await dbQuery(
    `SELECT id FROM workflow_definitions WHERE entity_type = $1 AND enabled = TRUE LIMIT 1`,
    [entityType]
  );
  return result.rows.length > 0;
}

async function checkAutoApprove(entityType, entityId, userId, employeeId) {
  const definition = await resolveWorkflowDefinition(entityType, employeeId);
  if (definition) {
    const instance = await initWorkflow(entityType, entityId, userId, employeeId);
    if (instance) {
      const stepsResult = await dbQuery(
        `SELECT step_number, assigned_users FROM workflow_steps WHERE instance_id = $1 ORDER BY step_number`,
        [instance.id]
      );
      const allSteps = stepsResult.rows;
      const isSingleLevelCapturerOnly = allSteps.length === 1
        && (allSteps[0].assigned_users || []).length > 0
        && (allSteps[0].assigned_users || []).every(u => Number(u) === Number(userId));

      if (!isSingleLevelCapturerOnly) {
        const cascadeResult = await autoAdvanceInitiatorSteps(instance.id, userId);
        if (cascadeResult) {
          for (const step of cascadeResult.autoApprovedSteps) {
            await writeHistory(entityType, entityId, 'APPROVED', userId,
              'Auto-approved (capturer is assigned approver)', step.stepNumber,
              cascadeResult.instanceStatus === 'APPROVED' && step === cascadeResult.autoApprovedSteps[cascadeResult.autoApprovedSteps.length - 1] ? 'APPROVED' : 'PENDING');
          }
          if (cascadeResult.instanceStatus === 'APPROVED') {
            const cfg = getConfig(entityType);
            await dbQuery(
              `UPDATE ${cfg.table} SET status = 'APPROVED', approved_by = $1, approved_at = NOW(), updated_at = NOW() WHERE id = $2`,
              [userId, entityId]
            );
            return true;
          }
        }
      }
    }
    return false;
  }

  const cfg = getConfig(entityType);
  await dbQuery(
    `UPDATE ${cfg.table} SET status = 'APPROVED', approved_by = $1, approved_at = NOW(), updated_at = NOW() WHERE id = $2`,
    [userId, entityId]
  );
  await writeHistory(entityType, entityId, 'APPROVED', userId, 'Auto-approved (no workflow configured)', null, 'APPROVED');
  return true;
}

async function handleApproval(entityType, entityId, userId, userRoles, comments) {
  const cfg = getConfig(entityType);

  const entity = await dbQuery(`SELECT * FROM ${cfg.table} WHERE id = $1`, [entityId]);
  if (!entity.rows.length) {
    return { success: false, status: 404, error: `${entityType} not found` };
  }
  if (entity.rows[0].status !== 'PENDING') {
    return { success: false, status: 400, error: `${entityType} is not pending` };
  }

  const createdBy = entity.rows[0][cfg.createdByField];
  const initiatorId = createdBy || userId;
  const employeeId = entity.rows[0][cfg.employeeIdField];

  // Self-approval guard: block only when the approver IS the employee who
  // benefits from this transaction (not merely the person who captured it on
  // someone else's behalf — e.g. an HR Admin submitting leave for an employee).
  // We look up the approver's linked employee record via users.employee_id.
  // Fallback to the old created_by check only when no employee_id exists on the transaction.
  if (employeeId) {
    const approverRow = await dbQuery(`SELECT employee_id FROM users WHERE id = $1`, [userId]);
    const approverEmpId = approverRow.rows[0]?.employee_id;
    if (approverEmpId && String(approverEmpId) === String(employeeId)) {
      return { success: false, status: 403, error: 'You cannot approve your own transaction. A different authorised user must approve this item.' };
    }
  } else if (createdBy && String(createdBy) === String(userId)) {
    return { success: false, status: 403, error: 'You cannot approve your own transaction. A different authorised user must approve this item.' };
  }

  const step = await ensureWorkflowInstance(entityType, entityId, initiatorId, employeeId);

  if (step) {
    try {
      const stepResult = await actionStep(step.step_id, 'APPROVE', userId, comments || null, userRoles);

      let finalStatus = stepResult.instance_status;
      let cascadeResult = null;

      if (finalStatus !== 'APPROVED' && finalStatus !== 'REJECTED') {
        cascadeResult = await autoAdvanceInitiatorSteps(step.instance_id, initiatorId);
        if (cascadeResult) {
          finalStatus = cascadeResult.instanceStatus;
        }
      }

      if (finalStatus === 'APPROVED' && cascadeResult) {
        await writeHistory(entityType, entityId, 'APPROVED', userId, comments || `Level ${step.step_number} approved`, step.step_number, 'PENDING');
        for (const autoStep of cascadeResult.autoApprovedSteps) {
          const isLast = autoStep === cascadeResult.autoApprovedSteps[cascadeResult.autoApprovedSteps.length - 1];
          await writeHistory(entityType, entityId, 'APPROVED', initiatorId,
            'Auto-approved (capturer is assigned approver)', autoStep.stepNumber,
            isLast ? 'APPROVED' : 'PENDING');
        }
        await dbQuery(
          `UPDATE ${cfg.table} SET status = 'APPROVED', approved_by = $1, approved_at = NOW(), updated_at = NOW() WHERE id = $2`,
          [userId, entityId]
        );
        return {
          success: true,
          data: { ...entity.rows[0], status: 'APPROVED' },
          message: 'Transaction fully approved.',
          level: cascadeResult.autoApprovedSteps[cascadeResult.autoApprovedSteps.length - 1].stepNumber,
          totalLevels: cascadeResult.totalSteps,
          finalApproval: true
        };
      } else if (finalStatus === 'APPROVED') {
        await dbQuery(
          `UPDATE ${cfg.table} SET status = 'APPROVED', approved_by = $1, approved_at = NOW(), updated_at = NOW() WHERE id = $2`,
          [userId, entityId]
        );
        await writeHistory(entityType, entityId, 'APPROVED', userId, comments || 'Final approval', step.step_number, 'APPROVED');
        return {
          success: true,
          data: { ...entity.rows[0], status: 'APPROVED' },
          message: 'Transaction fully approved.',
          level: step.step_number,
          totalLevels: parseInt(step.total_steps),
          finalApproval: true
        };
      } else {
        if (cascadeResult) {
          await writeHistory(entityType, entityId, 'APPROVED', userId, comments || `Level ${step.step_number} approved`, step.step_number, 'PENDING');
          for (const autoStep of cascadeResult.autoApprovedSteps) {
            await writeHistory(entityType, entityId, 'APPROVED', initiatorId,
              'Auto-approved (capturer is assigned approver)', autoStep.stepNumber, 'PENDING');
          }
        } else {
          await writeHistory(entityType, entityId, 'APPROVED', userId, comments || `Level ${step.step_number} approved`, step.step_number, 'PENDING');
        }
        return {
          success: true,
          data: entity.rows[0],
          message: `Approval step ${step.step_number} of ${step.total_steps} completed. Awaiting next approval level.`,
          level: step.step_number,
          totalLevels: parseInt(step.total_steps),
          finalApproval: false
        };
      }
    } catch (wfErr) {
      return { success: false, status: 403, error: wfErr.message };
    }
  } else {
    const hasDef = await hasWorkflowDefinition(entityType);
    if (hasDef) {
      return { success: false, status: 500, error: 'Workflow definition exists but could not initialize workflow instance. Please try again.' };
    }

    await dbQuery(
      `UPDATE ${cfg.table} SET status = 'APPROVED', approved_by = $1, approved_at = NOW(), updated_at = NOW() WHERE id = $2`,
      [userId, entityId]
    );
    await writeHistory(entityType, entityId, 'APPROVED', userId, comments || 'Direct approval (no workflow)', null, 'APPROVED');
    return {
      success: true,
      data: { ...entity.rows[0], status: 'APPROVED' },
      message: 'Transaction fully approved.',
      level: null,
      totalLevels: 0,
      finalApproval: true
    };
  }
}

async function handleRejection(entityType, entityId, userId, userRoles, comments) {
  if (!comments || !comments.trim()) {
    return { success: false, status: 400, error: 'A reason/comment is required when rejecting a transaction' };
  }

  const cfg = getConfig(entityType);

  const entity = await dbQuery(`SELECT * FROM ${cfg.table} WHERE id = $1`, [entityId]);
  if (!entity.rows.length) {
    return { success: false, status: 404, error: `${entityType} not found` };
  }
  if (entity.rows[0].status !== 'PENDING') {
    return { success: false, status: 400, error: `${entityType} is not pending` };
  }

  const initiatorId = entity.rows[0][cfg.createdByField] || userId;
  const employeeId = entity.rows[0][cfg.employeeIdField];
  const step = await ensureWorkflowInstance(entityType, entityId, initiatorId, employeeId);
  let stepNumber = null;

  if (step) {
    try {
      await actionStep(step.step_id, 'REJECT', userId, comments, userRoles);
      stepNumber = step.step_number;
    } catch (wfErr) {
      return { success: false, status: 403, error: wfErr.message };
    }
  } else {
    const hasDef = await hasWorkflowDefinition(entityType);
    if (hasDef) {
      return { success: false, status: 500, error: 'Workflow definition exists but could not initialize workflow instance. Please try again.' };
    }
  }

  await dbQuery(
    `UPDATE ${cfg.table} SET status = 'REJECTED', approved_by = $1, approved_at = NOW(), updated_at = NOW() WHERE id = $2`,
    [userId, entityId]
  );
  await writeHistory(entityType, entityId, 'REJECTED', userId, comments, stepNumber, 'REJECTED');

  return {
    success: true,
    data: { ...entity.rows[0], status: 'REJECTED' },
    message: 'Transaction rejected.',
    level: stepNumber,
    totalLevels: step ? parseInt(step.total_steps) : 0,
    finalApproval: false
  };
}

async function handleReturn(entityType, entityId, userId, userRoles, comments) {
  if (!comments || !comments.trim()) {
    return { success: false, status: 400, error: 'A reason/comment is required when returning a transaction' };
  }

  const cfg = getConfig(entityType);

  const entity = await dbQuery(`SELECT * FROM ${cfg.table} WHERE id = $1`, [entityId]);
  if (!entity.rows.length) {
    return { success: false, status: 404, error: `${entityType} not found` };
  }
  if (entity.rows[0].status !== 'PENDING') {
    return { success: false, status: 400, error: `Only pending transactions can be returned for correction` };
  }

  const initiatorId = entity.rows[0][cfg.createdByField] || userId;
  const employeeId = entity.rows[0][cfg.employeeIdField];
  const step = await ensureWorkflowInstance(entityType, entityId, initiatorId, employeeId);
  let stepNumber = null;
  let returnedToStart = true;

  if (step) {
    try {
      const wfResult = await actionStep(step.step_id, 'RETURN', userId, comments, userRoles);
      stepNumber = step.step_number;
      returnedToStart = wfResult.instance_status === 'RETURNED';
    } catch (wfErr) {
      return { success: false, status: 403, error: wfErr.message };
    }
  } else {
    const hasDef = await hasWorkflowDefinition(entityType);
    if (hasDef) {
      return { success: false, status: 500, error: 'Workflow definition exists but could not initialize workflow instance. Please try again.' };
    }
  }

  if (returnedToStart) {
    await dbQuery(
      `UPDATE ${cfg.table} SET status = 'RETURNED', updated_at = NOW() WHERE id = $1`,
      [entityId]
    );
    await writeHistory(entityType, entityId, 'RETURNED', userId, comments, stepNumber, 'RETURNED');
    return {
      success: true,
      data: { ...entity.rows[0], status: 'RETURNED' },
      message: 'Transaction returned for correction.',
      level: stepNumber,
      totalLevels: step ? parseInt(step.total_steps) : 0,
      finalApproval: false
    };
  } else {
    await writeHistory(entityType, entityId, 'RETURNED', userId, comments, stepNumber, 'PENDING');
    return {
      success: true,
      data: entity.rows[0],
      message: 'Returned to previous approval level.',
      level: stepNumber,
      totalLevels: step ? parseInt(step.total_steps) : 0,
      finalApproval: false
    };
  }
}

async function getWorkflowStatus(entityType, entityId) {
  const result = await dbQuery(
    `SELECT wi.id, wi.status AS instance_status, wi.current_step,
            (SELECT COUNT(*) FROM workflow_steps WHERE instance_id = wi.id) AS total_steps
     FROM workflow_instances wi
     WHERE wi.entity_type = $1 AND wi.entity_id = $2
     ORDER BY wi.id DESC LIMIT 1`,
    [entityType, entityId]
  );
  if (!result.rows.length) return null;
  const row = result.rows[0];
  return {
    currentStep: row.current_step,
    totalSteps: parseInt(row.total_steps),
    instanceStatus: row.instance_status
  };
}

async function getWorkflowStatusBatch(entityType, entityIds) {
  if (!entityIds.length) return {};

  const result = await dbQuery(
    `SELECT DISTINCT ON (wi.entity_id)
            wi.entity_id, wi.status AS instance_status, wi.current_step,
            (SELECT COUNT(*) FROM workflow_steps WHERE instance_id = wi.id) AS total_steps
     FROM workflow_instances wi
     WHERE wi.entity_type = $1 AND wi.entity_id = ANY($2)
     ORDER BY wi.entity_id, wi.id DESC`,
    [entityType, entityIds]
  );

  const map = {};
  for (const row of result.rows) {
    map[row.entity_id] = {
      currentStep: row.current_step,
      totalSteps: parseInt(row.total_steps),
      instanceStatus: row.instance_status
    };
  }
  return map;
}

// ---------------------------------------------------------------------------
// getMyPendingApprovals — unified inbox query across all transaction types
// ---------------------------------------------------------------------------
// Returns the rows currently waiting for THIS user (or anyone they have an
// active delegation from) at the CURRENT pending workflow step. Future steps
// are deliberately excluded so that approvers never see items addressed to
// later levels. The visibility predicate matches workflow.service.actionStep:
//   • assigned_users array contains the user
//   • assigned_to legacy column equals the user
//   • assigned_role equals one of the user's role names (case-insensitive)
// All entity rows whose own status is no longer 'PENDING' are filtered out.
async function getMyPendingApprovals(userId, userRoles = [], opts = {}) {
  if (!userId) return { items: [], counts: { total: 0, CLAIM: 0, WAGE: 0, OVERTIME: 0, INSTALLMENT: 0, LEAVE_REQUEST: 0, LEAVE_ADJUSTMENT: 0 } };

  // Delegations are MODULE-SCOPED. A delegation with module=NULL applies to all
  // entity types; otherwise it only grants visibility into that specific module.
  // This mirrors the canApprove logic in payroll.routes.js (line 5430+) and
  // prevents cross-module leakage of delegated items.
  const delegations = await dbQuery(
    `SELECT from_user, module FROM delegations
     WHERE to_user = $1 AND active = TRUE
       AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE`,
    [userId]
  );
  const delegationsByModule = { CLAIM: [], WAGE: [], OVERTIME: [], INSTALLMENT: [], LEAVE_REQUEST: [], LEAVE_ADJUSTMENT: [] };
  for (const d of delegations.rows) {
    if (!d.module) {
      // Wildcard delegation: applies to every module.
      for (const k of Object.keys(delegationsByModule)) delegationsByModule[k].push(d.from_user);
    } else if (delegationsByModule[d.module]) {
      delegationsByModule[d.module].push(d.from_user);
    }
  }
  const allowedUsersFor = (entityType) => [userId, ...(delegationsByModule[entityType] || [])];

  const dbRoles = await dbQuery(
    `SELECT r.name FROM roles r
     JOIN user_roles ur ON r.id = ur.role_id
     WHERE ur.user_id = $1`,
    [userId]
  );
  // Role tokens are normalised the SAME way as installments.routes.js
  // (lowercase + collapse [\s_-]+ to '_') so role naming differences like
  // "HR Manager" / "hr_manager" / "hr-manager" resolve to one canonical key.
  // The SQL side applies the equivalent regexp_replace to assigned_role.
  const normaliseRole = (s) => String(s || '').toLowerCase().replace(/[\s_-]+/g, '_');
  const roleSet = new Set();
  for (const r of dbRoles.rows) if (r.name) roleSet.add(normaliseRole(r.name));
  for (const r of (userRoles || [])) if (r) roleSet.add(normaliseRole(r));
  const roleNamesNorm = Array.from(roleSet);

  const requestedTypes = Array.isArray(opts.entityTypes) && opts.entityTypes.length
    ? opts.entityTypes.filter(t => ENTITY_CONFIG[t])
    : ['CLAIM', 'WAGE', 'OVERTIME', 'INSTALLMENT', 'LEAVE_REQUEST', 'LEAVE_ADJUSTMENT'];

  // Per-entity SELECT — unified output shape.
  const ENTITY_SELECTS = {
    CLAIM: `
      SELECT 'CLAIM'::text AS entity_type,
             c.id AS entity_id,
             c.employee_id,
             e.employee_code, e.first_name, e.surname,
             c.amount,
             c.start_date AS transaction_date,
             COALESCE(NULLIF(c.sub_type, ''), c.claim_type) AS description,
             c.claim_type AS subtype_code,
             c.reference_no,
             c.created_at, c.created_by,
             cu.username AS created_by_name,
             wi.status AS workflow_status,
             cs.instance_id, cs.current_step, cs.total_steps, cs.sla_deadline
      FROM workflow_instances wi
      JOIN workflow_steps ws ON ws.instance_id = wi.id
        AND ws.step_number = wi.current_step
        AND ws.status = 'PENDING'
      JOIN claims c ON c.id = wi.entity_id AND c.status = 'PENDING'
      JOIN employees e ON c.employee_id = e.id
      LEFT JOIN users cu ON cu.id = c.created_by
      JOIN LATERAL (
        SELECT wi.id AS instance_id, wi.current_step,
               (SELECT COUNT(*)::int FROM workflow_steps WHERE instance_id = wi.id) AS total_steps,
               ws.sla_deadline
      ) cs ON TRUE
      WHERE wi.entity_type = 'CLAIM' AND wi.status IN ('PENDING','IN_PROGRESS')
        AND ( ws.assigned_users && $1::int[]
              OR ws.assigned_to = ANY($1::int[])
              OR ($2::text[] <> '{}' AND regexp_replace(LOWER(ws.assigned_role), '[[:space:]_-]+', '_', 'g') = ANY($2::text[])) )
    `,
    WAGE: `
      SELECT 'WAGE'::text AS entity_type,
             wt.id AS entity_id,
             wt.employee_id,
             e.employee_code, e.first_name, e.surname,
             wt.amount,
             COALESCE(pp.start_date, wt.created_at::date) AS transaction_date,
             sh.name AS description,
             sh.code AS subtype_code,
             wt.reference_no,
             wt.created_at, wt.created_by,
             cu.username AS created_by_name,
             wi.status AS workflow_status,
             cs.instance_id, cs.current_step, cs.total_steps, cs.sla_deadline
      FROM workflow_instances wi
      JOIN workflow_steps ws ON ws.instance_id = wi.id
        AND ws.step_number = wi.current_step
        AND ws.status = 'PENDING'
      JOIN wage_transactions wt ON wt.id = wi.entity_id AND wt.status = 'PENDING'
      JOIN employees e ON wt.employee_id = e.id
      JOIN salary_heads sh ON wt.salary_head_id = sh.id
      LEFT JOIN payroll_periods pp ON wt.period_id = pp.id
      LEFT JOIN users cu ON cu.id = wt.created_by
      JOIN LATERAL (
        SELECT wi.id AS instance_id, wi.current_step,
               (SELECT COUNT(*)::int FROM workflow_steps WHERE instance_id = wi.id) AS total_steps,
               ws.sla_deadline
      ) cs ON TRUE
      WHERE wi.entity_type = 'WAGE' AND wi.status IN ('PENDING','IN_PROGRESS')
        AND ( ws.assigned_users && $1::int[]
              OR ws.assigned_to = ANY($1::int[])
              OR ($2::text[] <> '{}' AND regexp_replace(LOWER(ws.assigned_role), '[[:space:]_-]+', '_', 'g') = ANY($2::text[])) )
    `,
    OVERTIME: `
      SELECT 'OVERTIME'::text AS entity_type,
             ot.id AS entity_id,
             ot.employee_id,
             e.employee_code, e.first_name, e.surname,
             ot.amount,
             ot.overtime_date AS transaction_date,
             COALESCE(sh.name, 'Overtime') || ' (' || ot.hours::text || 'h)' AS description,
             sh.code AS subtype_code,
             ot.reference_no,
             ot.created_at, ot.created_by,
             cu.username AS created_by_name,
             wi.status AS workflow_status,
             cs.instance_id, cs.current_step, cs.total_steps, cs.sla_deadline
      FROM workflow_instances wi
      JOIN workflow_steps ws ON ws.instance_id = wi.id
        AND ws.step_number = wi.current_step
        AND ws.status = 'PENDING'
      JOIN overtime_transactions ot ON ot.id = wi.entity_id AND ot.status = 'PENDING'
      JOIN employees e ON ot.employee_id = e.id
      LEFT JOIN salary_heads sh ON ot.salary_head_id = sh.id
      LEFT JOIN users cu ON cu.id = ot.created_by
      JOIN LATERAL (
        SELECT wi.id AS instance_id, wi.current_step,
               (SELECT COUNT(*)::int FROM workflow_steps WHERE instance_id = wi.id) AS total_steps,
               ws.sla_deadline
      ) cs ON TRUE
      WHERE wi.entity_type = 'OVERTIME' AND wi.status IN ('PENDING','IN_PROGRESS')
        AND ( ws.assigned_users && $1::int[]
              OR ws.assigned_to = ANY($1::int[])
              OR ($2::text[] <> '{}' AND regexp_replace(LOWER(ws.assigned_role), '[[:space:]_-]+', '_', 'g') = ANY($2::text[])) )
    `,
    INSTALLMENT: `
      SELECT 'INSTALLMENT'::text AS entity_type,
             ins.id AS entity_id,
             ins.employee_id,
             e.employee_code, e.first_name, e.surname,
             ins.monthly_instalment AS amount,
             ins.start_date AS transaction_date,
             COALESCE(NULLIF(ins.description, ''), sh.name, 'Installment')
               || COALESCE(' — ' || NULLIF(ins.vendor_name, ''), '') AS description,
             sh.code AS subtype_code,
             ins.reference_number AS reference_no,
             ins.created_at, ins.created_by,
             cu.username AS created_by_name,
             wi.status AS workflow_status,
             cs.instance_id, cs.current_step, cs.total_steps, cs.sla_deadline
      FROM workflow_instances wi
      JOIN workflow_steps ws ON ws.instance_id = wi.id
        AND ws.step_number = wi.current_step
        AND ws.status = 'PENDING'
      JOIN instalments ins ON ins.id = wi.entity_id AND ins.status = 'PENDING'
      JOIN employees e ON ins.employee_id = e.id
      LEFT JOIN salary_heads sh ON ins.salary_head_id = sh.id
      LEFT JOIN users cu ON cu.id = ins.created_by
      JOIN LATERAL (
        SELECT wi.id AS instance_id, wi.current_step,
               (SELECT COUNT(*)::int FROM workflow_steps WHERE instance_id = wi.id) AS total_steps,
               ws.sla_deadline
      ) cs ON TRUE
      WHERE wi.entity_type = 'INSTALLMENT' AND wi.status IN ('PENDING','IN_PROGRESS')
        AND ( ws.assigned_users && $1::int[]
              OR ws.assigned_to = ANY($1::int[])
              OR ($2::text[] <> '{}' AND regexp_replace(LOWER(ws.assigned_role), '[[:space:]_-]+', '_', 'g') = ANY($2::text[])) )
    `,
    LEAVE_REQUEST: `
      SELECT 'LEAVE_REQUEST'::text AS entity_type,
             lt.id AS entity_id,
             lt.employee_id,
             e.employee_code, e.first_name, e.surname,
             lt.days AS amount,
             lt.start_date AS transaction_date,
             ltype.name || ' (' || lt.start_date::text || ' - ' || lt.end_date::text || ')' AS description,
             ltype.code AS subtype_code,
             lt.reference_no,
             lt.created_at, lt.created_by,
             cu.username AS created_by_name,
             wi.status AS workflow_status,
             cs.instance_id, cs.current_step, cs.total_steps, cs.sla_deadline
      FROM workflow_instances wi
      JOIN workflow_steps ws ON ws.instance_id = wi.id
        AND ws.step_number = wi.current_step
        AND ws.status = 'PENDING'
      JOIN leave_transactions lt ON lt.id = wi.entity_id AND lt.status = 'PENDING'
      JOIN employees e ON lt.employee_id = e.id
      JOIN leave_type ltype ON lt.leave_type_id = ltype.id
      LEFT JOIN users cu ON cu.id = lt.created_by
      JOIN LATERAL (
        SELECT wi.id AS instance_id, wi.current_step,
               (SELECT COUNT(*)::int FROM workflow_steps WHERE instance_id = wi.id) AS total_steps,
               ws.sla_deadline
      ) cs ON TRUE
      WHERE wi.entity_type = 'LEAVE_REQUEST' AND wi.status IN ('PENDING','IN_PROGRESS')
        AND ( ws.assigned_users && $1::int[]
              OR ws.assigned_to = ANY($1::int[])
              OR ($2::text[] <> '{}' AND regexp_replace(LOWER(ws.assigned_role), '[[:space:]_-]+', '_', 'g') = ANY($2::text[])) )
    `,
    LEAVE_ADJUSTMENT: `
      SELECT 'LEAVE_ADJUSTMENT'::text AS entity_type,
             la.id AS entity_id,
             la.employee_id,
             e.employee_code, e.first_name, e.surname,
             la.adjustment_days AS amount,
             la.effective_date AS transaction_date,
             ltype.name || ' — ' || la.adjustment_type AS description,
             la.adjustment_type AS subtype_code,
             la.reference_no,
             la.created_at, la.created_by,
             cu.username AS created_by_name,
             wi.status AS workflow_status,
             cs.instance_id, cs.current_step, cs.total_steps, cs.sla_deadline
      FROM workflow_instances wi
      JOIN workflow_steps ws ON ws.instance_id = wi.id
        AND ws.step_number = wi.current_step
        AND ws.status = 'PENDING'
      JOIN leave_adjustments la ON la.id = wi.entity_id AND la.status = 'PENDING'
      JOIN employees e ON la.employee_id = e.id
      JOIN leave_type ltype ON la.leave_type_id = ltype.id
      LEFT JOIN users cu ON cu.id = la.created_by
      JOIN LATERAL (
        SELECT wi.id AS instance_id, wi.current_step,
               (SELECT COUNT(*)::int FROM workflow_steps WHERE instance_id = wi.id) AS total_steps,
               ws.sla_deadline
      ) cs ON TRUE
      WHERE wi.entity_type = 'LEAVE_ADJUSTMENT' AND wi.status IN ('PENDING','IN_PROGRESS')
        AND ( ws.assigned_users && $1::int[]
              OR ws.assigned_to = ANY($1::int[])
              OR ($2::text[] <> '{}' AND regexp_replace(LOWER(ws.assigned_role), '[[:space:]_-]+', '_', 'g') = ANY($2::text[])) )
    `
  };

  const counts = { total: 0, CLAIM: 0, WAGE: 0, OVERTIME: 0, INSTALLMENT: 0, LEAVE_REQUEST: 0, LEAVE_ADJUSTMENT: 0 };
  let items = [];

  for (const type of requestedTypes) {
    const sql = ENTITY_SELECTS[type];
    if (!sql) continue;
    try {
      const r = await dbQuery(sql, [allowedUsersFor(type), roleNamesNorm]);
      counts[type] = r.rows.length;
      counts.total += r.rows.length;
      items = items.concat(r.rows);
    } catch (err) {
      console.warn(`getMyPendingApprovals[${type}] failed:`, err.message);
    }
  }

  // Sort: SLA breached first (oldest deadline), then oldest created.
  items.sort((a, b) => {
    const aSla = a.sla_deadline ? new Date(a.sla_deadline).getTime() : Infinity;
    const bSla = b.sla_deadline ? new Date(b.sla_deadline).getTime() : Infinity;
    if (aSla !== bSla) return aSla - bSla;
    const aC = new Date(a.created_at).getTime();
    const bC = new Date(b.created_at).getTime();
    return aC - bC;
  });

  return { items, counts };
}

// ---------------------------------------------------------------------------
// getInPeriodUnapprovedTransactions — payroll-run pre-flight gate
// ---------------------------------------------------------------------------
// Single source of truth used by BOTH the trial-run and final-run validators
// in `payroll.routes.js`. Given a `cycleId` + `periodId`, returns the set of
// CLAIM, WAGE, OVERTIME and INSTALLMENT rows whose period_id matches the
// payroll period and whose status is not in a "safe to pay or already
// excluded" set.
//
// Statuses considered SAFE / EXCLUDED:
//   APPROVED   — fully approved, eligible for payment
//   ACTIVE     — installments only: approved & past start_date, ready for deduction
//   PROCESSED  — already processed by a prior run
//   PAID       — already paid (claims)
//   COMPLETED  — installments that finished
//   REJECTED   — rejected (engine ignores them)
//   CANCELLED  — cancelled (engine ignores them)
//
// Anything else (PENDING, RETURNED, IN_PROGRESS, NULL, etc.) is BLOCKING.
// This is deliberately strict: per the task spec there is no override.
async function getInPeriodUnapprovedTransactions(cycleId, periodId, opts = {}) {
  const hydrate = !!(opts && opts.hydrate);
  const result = {
    blocking: false,
    total: 0,
    counts: { CLAIM: 0, WAGE: 0, OVERTIME: 0, INSTALLMENT: 0 },
    ids: { CLAIM: [], WAGE: [], OVERTIME: [], INSTALLMENT: [] }
  };
  if (hydrate) {
    result.items = { CLAIM: [], WAGE: [], OVERTIME: [], INSTALLMENT: [] };
  }

  if (!periodId) return result;

  const SAFE = `('APPROVED','ACTIVE','PROCESSED','PAID','COMPLETED','REJECTED','CANCELLED')`;

  // Per-entity probe — table column names confirmed in the schema:
  //   claims.period_id, wage_transactions.period_id,
  //   overtime_transactions.period_id, instalments.period_id
  // When hydrate=true, the SELECT also pulls employee + amount + submitted-by
  // so the payroll-run UI can render an inline "Outstanding approvals" panel
  // without an extra round-trip per row.
  const queries = hydrate ? [
    { type: 'CLAIM', sql: `
      SELECT c.id,
             c.employee_id, e.employee_code, e.first_name, e.surname,
             c.amount,
             c.start_date AS transaction_date,
             COALESCE(NULLIF(c.sub_type, ''), c.claim_type) AS description,
             COALESCE(c.status, 'PENDING') AS status,
             c.created_by, cu.username AS created_by_name
      FROM claims c
      LEFT JOIN employees e ON e.id = c.employee_id
      LEFT JOIN users cu ON cu.id = c.created_by
      WHERE c.period_id = $1 AND COALESCE(c.status,'PENDING') NOT IN ${SAFE}
      ORDER BY c.id` },
    { type: 'WAGE', sql: `
      SELECT wt.id,
             wt.employee_id, e.employee_code, e.first_name, e.surname,
             wt.amount,
             COALESCE(pp.start_date, wt.created_at::date) AS transaction_date,
             sh.name AS description,
             COALESCE(wt.status, 'PENDING') AS status,
             wt.created_by, cu.username AS created_by_name
      FROM wage_transactions wt
      LEFT JOIN employees e ON e.id = wt.employee_id
      LEFT JOIN salary_heads sh ON sh.id = wt.salary_head_id
      LEFT JOIN payroll_periods pp ON pp.id = wt.period_id
      LEFT JOIN users cu ON cu.id = wt.created_by
      WHERE wt.period_id = $1 AND COALESCE(wt.status,'PENDING') NOT IN ${SAFE}
      ORDER BY wt.id` },
    { type: 'OVERTIME', sql: `
      SELECT ot.id,
             ot.employee_id, e.employee_code, e.first_name, e.surname,
             ot.amount,
             ot.overtime_date AS transaction_date,
             COALESCE(sh.name, 'Overtime') || ' (' || ot.hours::text || 'h)' AS description,
             COALESCE(ot.status, 'PENDING') AS status,
             ot.created_by, cu.username AS created_by_name
      FROM overtime_transactions ot
      LEFT JOIN employees e ON e.id = ot.employee_id
      LEFT JOIN salary_heads sh ON sh.id = ot.salary_head_id
      LEFT JOIN users cu ON cu.id = ot.created_by
      WHERE ot.period_id = $1 AND COALESCE(ot.status,'PENDING') NOT IN ${SAFE}
      ORDER BY ot.id` },
    { type: 'INSTALLMENT', sql: `
      SELECT i.id,
             i.employee_id, e.employee_code, e.first_name, e.surname,
             COALESCE(i.monthly_instalment, i.total_amount) AS amount,
             i.start_date AS transaction_date,
             COALESCE(sh.name, i.description, 'Installment') AS description,
             COALESCE(i.status, 'PENDING') AS status,
             i.created_by, cu.username AS created_by_name
      FROM instalments i
      LEFT JOIN employees e ON e.id = i.employee_id
      LEFT JOIN salary_heads sh ON sh.id = i.salary_head_id
      LEFT JOIN users cu ON cu.id = i.created_by
      WHERE i.period_id = $1 AND COALESCE(i.status,'PENDING') NOT IN ${SAFE}
      ORDER BY i.id` }
  ] : [
    { type: 'CLAIM',       sql: `SELECT id FROM claims                WHERE period_id = $1 AND COALESCE(status,'PENDING') NOT IN ${SAFE}` },
    { type: 'WAGE',        sql: `SELECT id FROM wage_transactions     WHERE period_id = $1 AND COALESCE(status,'PENDING') NOT IN ${SAFE}` },
    { type: 'OVERTIME',    sql: `SELECT id FROM overtime_transactions WHERE period_id = $1 AND COALESCE(status,'PENDING') NOT IN ${SAFE}` },
    { type: 'INSTALLMENT', sql: `SELECT id FROM instalments           WHERE period_id = $1 AND COALESCE(status,'PENDING') NOT IN ${SAFE}` }
  ];

  for (const q of queries) {
    try {
      const r = await dbQuery(q.sql, [periodId]);
      const ids = r.rows.map(row => row.id);
      result.counts[q.type] = ids.length;
      result.ids[q.type] = ids;
      result.total += ids.length;
      if (hydrate) {
        result.items[q.type] = r.rows.map(row => ({
          entity_type: q.type,
          entity_id: row.id,
          employee_id: row.employee_id,
          employee_code: row.employee_code,
          first_name: row.first_name,
          surname: row.surname,
          amount: row.amount,
          transaction_date: row.transaction_date,
          description: row.description,
          status: row.status,
          created_by: row.created_by,
          created_by_name: row.created_by_name
        }));
      }
    } catch (err) {
      // Tolerate missing optional transaction tables in partial-schema
      // environments — other payroll code (e.g. overtime/wage updates)
      // already wraps these tables in try/catch with the same rationale.
      // Postgres signals "undefined_table" with code 42P01.
      if (err && (err.code === '42P01' || /relation .* does not exist/i.test(err.message || ''))) {
        result.counts[q.type] = 0;
        result.ids[q.type] = [];
        continue;
      }
      // Real errors (permissions, syntax, connection) must NOT silently
      // let a payroll run proceed.
      throw new Error(`Approval pre-flight check failed for ${q.type}: ${err.message}`);
    }
  }

  result.blocking = result.total > 0;
  return result;
}

module.exports = {
  writeHistory,
  checkAutoApprove,
  handleApproval,
  handleRejection,
  handleReturn,
  getWorkflowStatus,
  getWorkflowStatusBatch,
  getMyPendingApprovals,
  getInPeriodUnapprovedTransactions,
  ENTITY_CONFIG
};
