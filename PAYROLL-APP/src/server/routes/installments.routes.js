const express = require('express');
const router = express.Router();
const { query: dbQuery } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');
const { paginationMiddleware } = require('../middleware/validation');
const { handleApproval, handleRejection, handleReturn, writeHistory, checkAutoApprove, getWorkflowStatusBatch } = require('../services/transaction-approval.service');

// Salary heads available globally for filter dropdowns (DEDUCTION type)
router.get('/salary-heads', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT id, code, name
       FROM salary_heads
       WHERE enabled = TRUE AND transaction_type = 'DEDUCTION'
       ORDER BY name`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

// Employee-specific deduction salary heads (no global fallback — same rule as Overtime)
router.get('/employee-salary-heads/:employeeId', authenticate, async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    if (!employeeId) return res.status(400).json({ success: false, message: 'employeeId is required' });

    const emp = await dbQuery('SELECT id FROM employees WHERE id = $1', [employeeId]);
    if (emp.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } });
    }

    const allowedHeadIds = new Set();

    const estRows = await dbQuery(
      `SELECT DISTINCT est.salary_head_id
       FROM employee_salary_transactions est
       JOIN salary_heads sh ON est.salary_head_id = sh.id
       WHERE est.employee_id = $1
         AND est.enabled = TRUE
         AND (est.start_date IS NULL OR est.start_date <= CURRENT_DATE)
         AND (est.end_date IS NULL OR est.end_date >= CURRENT_DATE)
         AND sh.enabled = TRUE
         AND sh.transaction_type = 'DEDUCTION'`, [employeeId]
    );
    estRows.rows.forEach(r => allowedHeadIds.add(r.salary_head_id));

    const empPos = await dbQuery(
      `SELECT COALESCE(p.salary_transaction_group_id, jp.salary_transaction_group_id) AS stg_id
       FROM employees e
       LEFT JOIN positions p ON e.position_id = p.id
       LEFT JOIN job_profiles jp ON p.job_profile_id = jp.id
       WHERE e.id = $1`, [employeeId]
    );
    const stgId = empPos.rows.length > 0 ? empPos.rows[0].stg_id : null;

    if (stgId) {
      const stgRows = await dbQuery(
        `SELECT stgi.salary_head_id
         FROM salary_transaction_group_items stgi
         JOIN salary_heads sh ON stgi.salary_head_id = sh.id
         WHERE stgi.group_id = $1
           AND sh.enabled = TRUE
           AND sh.transaction_type = 'DEDUCTION'`, [stgId]
      );
      stgRows.rows.forEach(r => allowedHeadIds.add(r.salary_head_id));
    }

    let result;
    if (allowedHeadIds.size > 0) {
      const ids = Array.from(allowedHeadIds);
      const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
      result = await dbQuery(
        `SELECT id, code, name FROM salary_heads WHERE id IN (${placeholders}) ORDER BY code`, ids
      );
    } else {
      result = { rows: [] };
    }

    res.json({ success: true, data: { salaryHeads: result.rows } });
  } catch (err) { next(err); }
});

router.get('/', authenticate, paginationMiddleware, async (req, res, next) => {
  try {
    const { pagination } = req;
    const { employee_id, status, salary_head_id, department_id, division_id, tab } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = [];
    let pi = 1;

    if (tab === 'processed') {
      whereClause += ` AND i.status IN ('COMPLETED','CANCELLED','REJECTED')`;
    } else {
      whereClause += ` AND i.status NOT IN ('COMPLETED','CANCELLED','REJECTED')`;
      if (status) {
        whereClause += ` AND i.status = $${pi}`;
        params.push(status.toUpperCase());
        pi++;
      }
    }

    if (employee_id) {
      whereClause += ` AND i.employee_id = $${pi}`;
      params.push(parseInt(employee_id, 10));
      pi++;
    }
    if (salary_head_id) {
      whereClause += ` AND i.salary_head_id = $${pi}`;
      params.push(parseInt(salary_head_id, 10));
      pi++;
    }
    if (department_id) {
      whereClause += ` AND p.department_id = $${pi}`;
      params.push(parseInt(department_id, 10));
      pi++;
    }
    if (division_id) {
      whereClause += ` AND p.division_id = $${pi}`;
      params.push(parseInt(division_id, 10));
      pi++;
    }

    const joinClause = `FROM instalments i
       JOIN employees e ON i.employee_id = e.id
       LEFT JOIN positions p ON e.position_id = p.id`;

    const countResult = await dbQuery(`SELECT COUNT(*) ${joinClause} ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await dbQuery(
      `SELECT i.*, e.first_name, e.surname, e.employee_code,
              sh.name AS salary_head_name, sh.code AS salary_head_code
       ${joinClause}
       JOIN salary_heads sh ON i.salary_head_id = sh.id
       ${whereClause}
       ORDER BY i.created_at DESC
       LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, pagination.limit, pagination.offset]
    );

    if (tab !== 'processed' && result.rows.length > 0) {
      const pendingIds = result.rows.filter(r => r.status === 'PENDING').map(r => r.id);
      if (pendingIds.length > 0) {
        const wfMap = await getWorkflowStatusBatch('INSTALLMENT', pendingIds);
        for (const row of result.rows) {
          const wf = wfMap[row.id];
          if (wf) {
            row.workflow_level = wf.currentStep;
            row.workflow_total = wf.totalSteps;
          }
        }

        // Per-record can_approve: true when current PENDING workflow step has the calling user
        // assigned directly OR has an assigned_role that the user holds.
        const userId = req.user?.id || 0;
        const stepRows = await dbQuery(
          `SELECT wi.entity_id, ws.assigned_users, ws.assigned_role
             FROM workflow_instances wi
             JOIN workflow_steps ws ON ws.instance_id = wi.id
                  AND ws.step_number = wi.current_step
                  AND ws.status = 'PENDING'
            WHERE wi.entity_type = 'INSTALLMENT' AND wi.entity_id = ANY($1)`,
          [pendingIds]
        );
        // Resolve user's roles once
        let userRoleNames = new Set();
        try {
          const roleRes = await dbQuery(
            `SELECT r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = $1`,
            [userId]
          );
          userRoleNames = new Set(roleRes.rows.map(r => String(r.name || '').toLowerCase()));
        } catch (e) { /* role lookup best-effort */ }
        const norm = (s) => String(s || '').toLowerCase().replace(/[\s_-]+/g, '_');
        (req.user?.roles || []).forEach(r => userRoleNames.add(String(r || '').toLowerCase()));

        const canApproveByEntity = {};
        for (const sr of stepRows.rows) {
          const assignedUsers = Array.isArray(sr.assigned_users) ? sr.assigned_users : [];
          const userMatch = assignedUsers.includes(userId);
          const roleMatch = sr.assigned_role
            ? (userRoleNames.has(String(sr.assigned_role).toLowerCase()) ||
               [...userRoleNames].some(rn => norm(rn) === norm(sr.assigned_role)))
            : false;
          canApproveByEntity[sr.entity_id] = userMatch || roleMatch;
        }
        // No-workflow rows: per the locked rule, canApprove fails open => true
        for (const row of result.rows) {
          if (row.status !== 'PENDING') { row.can_approve = false; continue; }
          row.can_approve = (canApproveByEntity[row.id] !== undefined)
            ? canApproveByEntity[row.id]
            : true;
        }
      }
    }

    res.json({
      success: true,
      data: result.rows,
      meta: { page: pagination.page, limit: pagination.limit, total, totalPages: Math.ceil(total / pagination.limit) }
    });
  } catch (err) { next(err); }
});

router.get('/can-approve', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id || 0;
    const userRoles = req.user?.roles || [];

    const defs = await dbQuery(
      `SELECT steps FROM workflow_definitions WHERE entity_type = 'INSTALLMENT' AND enabled = TRUE`
    );

    if (defs.rows.length === 0) {
      return res.json({ success: true, data: { canApprove: true } });
    }

    for (const def of defs.rows) {
      const steps = def.steps || [];
      for (const step of steps) {
        if (step.assigned_users && step.assigned_users.includes(userId)) {
          return res.json({ success: true, data: { canApprove: true } });
        }
        if (step.assigned_role) {
          const roleCheck = await dbQuery(
            `SELECT 1 FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = $1 AND r.name = $2 LIMIT 1`,
            [userId, step.assigned_role]
          );
          if (roleCheck.rows.length > 0) {
            return res.json({ success: true, data: { canApprove: true } });
          }
          if (userRoles.some(r => String(r).toLowerCase().replace(/[\s_-]+/g, '_') === step.assigned_role.toLowerCase().replace(/[\s_-]+/g, '_'))) {
            return res.json({ success: true, data: { canApprove: true } });
          }
        }
      }
    }
    return res.json({ success: true, data: { canApprove: false } });
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT i.*, e.first_name, e.surname, e.employee_code,
              sh.name AS salary_head_name, sh.code AS salary_head_code
       FROM instalments i
       JOIN employees e ON i.employee_id = e.id
       JOIN salary_heads sh ON i.salary_head_id = sh.id
       WHERE i.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Instalment not found' } });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/:id/history', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT h.*, u.username AS performed_by_name
       FROM instalment_history h
       LEFT JOIN users u ON h.performed_by = u.id
       WHERE h.instalment_id = $1
       ORDER BY h.performed_at ASC`,
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

async function getAllowedHeadIdsForEmployee(employeeId) {
  const allowedHeadIds = new Set();

  const estRows = await dbQuery(
    `SELECT DISTINCT est.salary_head_id
     FROM employee_salary_transactions est
     JOIN salary_heads sh ON est.salary_head_id = sh.id
     WHERE est.employee_id = $1
       AND est.enabled = TRUE
       AND (est.start_date IS NULL OR est.start_date <= CURRENT_DATE)
       AND (est.end_date IS NULL OR est.end_date >= CURRENT_DATE)
       AND sh.enabled = TRUE
       AND sh.transaction_type = 'DEDUCTION'`, [employeeId]
  );
  estRows.rows.forEach(r => allowedHeadIds.add(r.salary_head_id));

  const empPos = await dbQuery(
    `SELECT COALESCE(p.salary_transaction_group_id, jp.salary_transaction_group_id) AS stg_id
     FROM employees e
     LEFT JOIN positions p ON e.position_id = p.id
     LEFT JOIN job_profiles jp ON p.job_profile_id = jp.id
     WHERE e.id = $1`, [employeeId]
  );
  const stgId = empPos.rows.length > 0 ? empPos.rows[0].stg_id : null;
  if (stgId) {
    const stgRows = await dbQuery(
      `SELECT stgi.salary_head_id
       FROM salary_transaction_group_items stgi
       JOIN salary_heads sh ON stgi.salary_head_id = sh.id
       WHERE stgi.group_id = $1
         AND sh.enabled = TRUE
         AND sh.transaction_type = 'DEDUCTION'`, [stgId]
    );
    stgRows.rows.forEach(r => allowedHeadIds.add(r.salary_head_id));
  }
  return allowedHeadIds;
}

function isPrivilegedRole(req) {
  const PRIV = new Set(['admin', 'hr_mgr', 'hr_manager', 'payroll_admin']);
  const norm = (s) => String(s || '').toLowerCase().replace(/[\s_-]+/g, '_');
  if (req.user?.role && PRIV.has(norm(req.user.role))) return true;
  const roles = req.user?.roles || [];
  return roles.some(r => PRIV.has(norm(r)));
}

async function maybeActivate(instalmentId) {
  const r = await dbQuery(
    `UPDATE instalments SET status = 'ACTIVE', updated_at = NOW()
     WHERE id = $1 AND status = 'APPROVED' AND start_date <= CURRENT_DATE
     RETURNING id`,
    [instalmentId]
  );
  if (r.rows.length > 0) {
    await writeHistory('INSTALLMENT', instalmentId, 'ACTIVATED', null, 'Start date reached — activated for payroll deduction', null, 'ACTIVE');
  }
}

router.post('/', authenticate, auditLog('CREATE', 'instalment'), async (req, res, next) => {
  try {
    const { employee_id, salary_head_id, description, total_amount, monthly_instalment, period_months,
            start_date, end_date, vendor_name, reference_number, notes, period_id, cycle_id } = req.body;

    if (!employee_id || !salary_head_id || !total_amount || !period_months || !start_date) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'employee_id, salary_head_id, total_amount, period_months and start_date are required' } });
    }
    const totalNum = parseFloat(total_amount);
    const periodNum = parseInt(period_months, 10);
    if (totalNum <= 0 || periodNum <= 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'Total amount and period months must be greater than zero' } });
    }
    // Default monthly instalment to total / period_months (2dp) when omitted
    const monthlyNum = (monthly_instalment != null && monthly_instalment !== '')
      ? parseFloat(monthly_instalment)
      : parseFloat((totalNum / periodNum).toFixed(2));
    if (monthlyNum <= 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'Monthly instalment must be greater than zero' } });
    }

    // Resolve current period/cycle if not supplied
    let resolvedPeriodId = period_id || null;
    let resolvedCycleId = cycle_id || null;
    if (!resolvedPeriodId) {
      try {
        const cur = await dbQuery(
          `SELECT id, cycle_id FROM payroll_periods WHERE status IN ('OPEN','ACTIVE') ORDER BY end_date DESC LIMIT 1`
        );
        if (cur.rows.length > 0) {
          resolvedPeriodId = cur.rows[0].id;
          if (!resolvedCycleId) resolvedCycleId = cur.rows[0].cycle_id;
        }
      } catch (e) { /* period lookup best-effort */ }
    }

    const headCheck = await dbQuery(
      `SELECT id, transaction_type FROM salary_heads WHERE id = $1`,
      [salary_head_id]
    );
    if (headCheck.rows.length === 0 || headCheck.rows[0].transaction_type !== 'DEDUCTION') {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'Selected salary head must be a DEDUCTION type' } });
    }

    const allowed = await getAllowedHeadIdsForEmployee(employee_id);
    if (!allowed.has(parseInt(salary_head_id, 10))) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'Selected deduction head is not eligible for this employee' } });
    }

    const userId = req.user?.id || 1;
    const result = await dbQuery(
      `INSERT INTO instalments (employee_id, salary_head_id, description, total_amount, monthly_instalment,
                                period_months, balance, start_date, end_date, vendor_name, reference_number,
                                notes, status, created_by, period_id, cycle_id)
       VALUES ($1,$2,$3,$4,$5,$6,$4,$7,$8,$9,$10,$11,'PENDING',$12,$13,$14) RETURNING *`,
      [employee_id, salary_head_id, description || null, totalNum, monthlyNum, periodNum,
       start_date, end_date || null, vendor_name || null, reference_number || null, notes || null, userId,
       resolvedPeriodId, resolvedCycleId]
    );

    const instId = result.rows[0].id;
    await writeHistory('INSTALLMENT', instId, 'SUBMITTED', userId, 'Instalment submitted', null, 'PENDING');

    const autoApproved = await checkAutoApprove('INSTALLMENT', instId, userId, employee_id);
    if (autoApproved) {
      await maybeActivate(instId);
      const updated = await dbQuery('SELECT * FROM instalments WHERE id = $1', [instId]);
      return res.status(201).json({ success: true, data: updated.rows[0], message: 'Instalment auto-approved' });
    }

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const existing = await dbQuery('SELECT * FROM instalments WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Instalment not found' } });
    }
    const userId = req.user?.id || 0;
    const isOwner = existing.rows[0].created_by === userId;
    if (!isOwner && !isPrivilegedRole(req)) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only edit your own instalments' } });
    }
    if (existing.rows[0].status !== 'PENDING' && existing.rows[0].status !== 'RETURNED') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Only pending or returned instalments can be edited' } });
    }

    const cur = existing.rows[0];
    const { salary_head_id, description, total_amount, monthly_instalment, period_months,
            start_date, end_date, vendor_name, reference_number, notes } = req.body;

    const headId = salary_head_id ? parseInt(salary_head_id, 10) : cur.salary_head_id;
    const totalNum = total_amount != null ? parseFloat(total_amount) : parseFloat(cur.total_amount);
    const monthlyNum = monthly_instalment != null ? parseFloat(monthly_instalment) : parseFloat(cur.monthly_instalment);
    const periodNum = period_months != null ? parseInt(period_months, 10) : cur.period_months;
    if (totalNum <= 0 || monthlyNum <= 0 || periodNum <= 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'Amounts and period must be greater than zero' } });
    }

    const headCheck = await dbQuery(`SELECT transaction_type FROM salary_heads WHERE id = $1`, [headId]);
    if (headCheck.rows.length === 0 || headCheck.rows[0].transaction_type !== 'DEDUCTION') {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'Selected salary head must be a DEDUCTION type' } });
    }
    const allowed = await getAllowedHeadIdsForEmployee(cur.employee_id);
    if (!allowed.has(headId)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'Selected deduction head is not eligible for this employee' } });
    }

    const wasReturned = cur.status === 'RETURNED';

    const result = await dbQuery(
      `UPDATE instalments
       SET salary_head_id = $1, description = $2, total_amount = $3, monthly_instalment = $4,
           period_months = $5, balance = $3, start_date = $6, end_date = $7, vendor_name = $8,
           reference_number = $9, notes = $10, status = 'PENDING', updated_at = NOW()
       WHERE id = $11 RETURNING *`,
      [headId, description ?? cur.description, totalNum, monthlyNum, periodNum,
       start_date || cur.start_date, end_date ?? cur.end_date, vendor_name ?? cur.vendor_name,
       reference_number ?? cur.reference_number, notes ?? cur.notes, req.params.id]
    );

    if (wasReturned) {
      await writeHistory('INSTALLMENT', parseInt(req.params.id), 'SUBMITTED', userId, 'Resubmitted after correction', null, 'PENDING');
      const autoApproved = await checkAutoApprove('INSTALLMENT', parseInt(req.params.id), userId, cur.employee_id);
      if (autoApproved) {
        await maybeActivate(parseInt(req.params.id));
        const updated = await dbQuery('SELECT * FROM instalments WHERE id = $1', [req.params.id]);
        return res.json({ success: true, data: updated.rows[0], message: 'Instalment resubmitted and auto-approved' });
      }
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const existing = await dbQuery('SELECT * FROM instalments WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Instalment not found' } });
    }
    const userId = req.user?.id || 0;
    const isOwner = existing.rows[0].created_by === userId;
    if (!isOwner && !isPrivilegedRole(req)) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only delete your own instalments' } });
    }
    if (existing.rows[0].status !== 'PENDING') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Only pending instalments can be deleted' } });
    }
    await dbQuery('DELETE FROM instalment_history WHERE instalment_id = $1', [req.params.id]);
    await dbQuery('DELETE FROM instalments WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Instalment deleted' });
  } catch (err) { next(err); }
});

router.patch('/:id/approve', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });
    const result = await handleApproval('INSTALLMENT', parseInt(req.params.id), userId, req.user?.roles || [], req.body.comments || null);
    if (!result.success) {
      return res.status(result.status || 400).json({ success: false, error: { message: result.error } });
    }
    if (result.finalApproval) {
      await maybeActivate(parseInt(req.params.id));
    }
    const fresh = await dbQuery('SELECT * FROM instalments WHERE id = $1', [req.params.id]);
    res.json({
      success: true,
      data: fresh.rows[0] || result.data,
      message: result.message,
      finalApproval: result.finalApproval,
      level: result.level,
      totalLevels: result.totalLevels
    });
  } catch (err) { next(err); }
});

router.patch('/:id/reject', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });
    const result = await handleRejection('INSTALLMENT', parseInt(req.params.id), userId, req.user?.roles || [], req.body.comments);
    if (!result.success) {
      return res.status(result.status || 400).json({ success: false, error: { message: result.error } });
    }
    res.json({ success: true, data: result.data, message: result.message });
  } catch (err) { next(err); }
});

router.patch('/:id/return', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });
    const result = await handleReturn('INSTALLMENT', parseInt(req.params.id), userId, req.user?.roles || [], req.body.comments);
    if (!result.success) {
      return res.status(result.status || 400).json({ success: false, error: { message: result.error } });
    }
    res.json({ success: true, data: result.data, message: result.message });
  } catch (err) { next(err); }
});

// Cancel an active or approved instalment — stops future payroll deductions
router.patch('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: { message: 'Authentication required' } });
    const existing = await dbQuery('SELECT * FROM instalments WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Instalment not found' } });
    }
    const cur = existing.rows[0];
    const isOwner = cur.created_by === userId;
    if (!isOwner && !isPrivilegedRole(req)) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You are not authorised to cancel this instalment' } });
    }
    if (!['ACTIVE', 'APPROVED'].includes(cur.status)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: `Only ACTIVE or APPROVED instalments can be cancelled (current: ${cur.status})` } });
    }
    const updated = await dbQuery(
      `UPDATE instalments SET status = 'CANCELLED', end_date = COALESCE(end_date, CURRENT_DATE), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    await writeHistory('INSTALLMENT', parseInt(req.params.id), 'CANCELLED', userId, req.body?.comments || 'Instalment cancelled — future deductions stopped', null, 'CANCELLED');
    res.json({ success: true, data: updated.rows[0], message: 'Instalment cancelled' });
  } catch (err) { next(err); }
});

router.post('/bulk-approve', authenticate, async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, message: 'ids array required' });
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });

    let approvedCount = 0, steppedCount = 0, failedCount = 0;
    const failedIds = [];
    const skipReasons = {};
    for (const txId of ids) {
      try {
        const result = await handleApproval('INSTALLMENT', txId, userId, req.user?.roles || [], null);
        if (result.success) {
          if (result.finalApproval) { approvedCount++; await maybeActivate(txId); } else { steppedCount++; }
        } else {
          failedCount++;
          failedIds.push(txId);
          const reason = result.error || 'Unknown error';
          skipReasons[reason] = (skipReasons[reason] || 0) + 1;
        }
      } catch (err) {
        failedCount++;
        failedIds.push(txId);
        const reason = err.message || 'Unknown error';
        skipReasons[reason] = (skipReasons[reason] || 0) + 1;
      }
    }

    res.json({
      success: failedCount === 0,
      data: { count: approvedCount + steppedCount, approved: approvedCount, stepped: steppedCount, failed: failedCount, failedIds, total: ids.length, skipReasons },
      message: `${approvedCount} fully approved, ${steppedCount} step(s) advanced${failedCount ? ', ' + failedCount + ' failed' : ''}`,
      finalApproval: approvedCount > 0
    });
  } catch (err) { next(err); }
});

router.post('/bulk-reject', authenticate, async (req, res, next) => {
  try {
    const { ids, comments } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, message: 'ids array required' });
    if (!comments || !comments.trim()) return res.status(400).json({ success: false, message: 'A reason/comment is required when rejecting' });
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });

    let rejectedCount = 0, failedCount = 0;
    const failedIds = [];
    for (const txId of ids) {
      try {
        const result = await handleRejection('INSTALLMENT', txId, userId, req.user?.roles || [], comments.trim());
        if (result.success) { rejectedCount++; } else { failedCount++; failedIds.push(txId); }
      } catch (err) { failedCount++; failedIds.push(txId); }
    }

    res.json({
      success: failedCount === 0,
      data: { count: rejectedCount, rejected: rejectedCount, failed: failedCount, failedIds, total: ids.length },
      message: `${rejectedCount} instalment(s) rejected${failedCount ? ', ' + failedCount + ' failed' : ''}.`
    });
  } catch (err) { next(err); }
});

router.post('/bulk-return', authenticate, async (req, res, next) => {
  try {
    const { ids, comments } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, message: 'ids array required' });
    if (!comments || !comments.trim()) return res.status(400).json({ success: false, message: 'A reason/comment is required when returning' });
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });

    let returnedCount = 0, failedCount = 0;
    const failedIds = [];
    for (const txId of ids) {
      try {
        const result = await handleReturn('INSTALLMENT', txId, userId, req.user?.roles || [], comments.trim());
        if (result.success) { returnedCount++; } else { failedCount++; failedIds.push(txId); }
      } catch (err) { failedCount++; failedIds.push(txId); }
    }

    res.json({
      success: failedCount === 0,
      data: { count: returnedCount, returned: returnedCount, failed: failedCount, failedIds, total: ids.length },
      message: `${returnedCount} instalment(s) returned for correction${failedCount ? ', ' + failedCount + ' failed' : ''}.`
    });
  } catch (err) { next(err); }
});

module.exports = router;
