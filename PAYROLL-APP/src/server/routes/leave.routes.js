const express = require('express');
const router = express.Router();
const { query: dbQuery, getClient } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');
const fs = require('fs');
const path = require('path');
const { calculateWorkingDays } = require('../services/leave-engine.service');

// === Leave Classifications ===
router.get('/classifications', authenticate, async (req, res, next) => {
  try {
    const r = await dbQuery(`SELECT * FROM leave_classification WHERE enabled = TRUE ORDER BY display_order, name`);
    res.json({ success: true, data: r.rows });
  } catch (err) { next(err); }
});

// === Leave Setup (singleton) ===
router.get('/setup', authenticate, async (req, res, next) => {
  try {
    const r = await dbQuery(`SELECT * FROM leave_setup WHERE id = 1`);
    res.json({ success: true, data: r.rows[0] || null });
  } catch (err) { next(err); }
});

router.put('/setup', authenticate, auditLog('UPDATE', 'leave_setup'), async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const b = req.body || {};
    if (b.enable_leave === true && !b.leave_start_date) {
      return res.status(400).json({ success: false, error: { message: 'Leave Start Date is required when Leave is enabled' } });
    }
    const r = await dbQuery(
      `UPDATE leave_setup SET
        enable_leave = COALESCE($1, enable_leave),
        leave_start_date = $2,
        approval_levels = COALESCE($3, approval_levels),
        reminder_enabled = COALESCE($4, reminder_enabled),
        reminder_days_before = $5,
        reminder_frequency = $6,
        prior_year_processing = $7,
        adjustment_approver_1_id = $8,
        adjustment_approver_2_id = $9,
        adjustment_approver_3_id = $10,
        adjustment_approver_4_id = $11,
        updated_by = $12, updated_at = NOW()
       WHERE id = 1 RETURNING *`,
      [
        b.enable_leave, b.leave_start_date || null, b.approval_levels,
        b.reminder_enabled, b.reminder_days_before || null, b.reminder_frequency || null,
        b.prior_year_processing || null,
        b.adjustment_approver_1_id || null, b.adjustment_approver_2_id || null,
        b.adjustment_approver_3_id || null, b.adjustment_approver_4_id || null,
        userId,
      ]
    );
    res.json({ success: true, data: r.rows[0] });
  } catch (err) { next(err); }
});

// === Leave Types ===
router.get('/types', authenticate, async (req, res, next) => {
  try {
    const r = await dbQuery(
      `SELECT lt.*, lc.name AS classification_name, lc.code AS classification_code
       FROM leave_type lt
       LEFT JOIN leave_classification lc ON lt.classification_id = lc.id
       WHERE lt.deleted_at IS NULL
       ORDER BY lt.name`
    );
    res.json({ success: true, data: r.rows });
  } catch (err) { next(err); }
});

router.get('/types/:id', authenticate, async (req, res, next) => {
  try {
    const r = await dbQuery(
      `SELECT lt.*, lc.name AS classification_name FROM leave_type lt
       LEFT JOIN leave_classification lc ON lt.classification_id = lc.id
       WHERE lt.id = $1 AND lt.deleted_at IS NULL`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ success: false, error: { message: 'Leave type not found' } });
    const rules = await dbQuery(
      `SELECT * FROM leave_type_rule WHERE leave_type_id = $1 ORDER BY deduction_priority`, [req.params.id]);
    res.json({ success: true, data: { ...r.rows[0], rules: rules.rows } });
  } catch (err) { next(err); }
});

router.post('/types', authenticate, auditLog('CREATE', 'leave_type'), async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const userId = req.user?.id || null;
    const b = req.body || {};
    if (!b.name || !b.base_type) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: { message: 'name and base_type required' } });
    }
    if (!Array.isArray(b.rules) || b.rules.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: { message: 'At least one entitlement rule is required' } });
    }
    const priorities = b.rules.map(r => Number(r.deduction_priority));
    if (new Set(priorities).size !== priorities.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: { message: 'Duplicate deduction priorities are not allowed' } });
    }
    const autoCode = b.calendar_abbreviation
      ? String(b.calendar_abbreviation).toUpperCase()
      : String(b.name).split(/\s+/).map((w) => w[0] || '').join('').toUpperCase().slice(0, 10);
    const includePH = b.base_type === 'CALENDAR_DAYS' ? !!b.include_public_holidays : false;
    const t = await client.query(
      `INSERT INTO leave_type (
        code, name, description, classification_id, base_type, include_public_holidays,
        paid, gender_restriction, requires_document, document_required_after_days,
        carry_forward_allowed, carry_forward_max_days, forfeit_excess,
        pro_rata_on_join, pro_rata_on_terminate, max_accumulation, max_negative_balance,
        payroll_linked_accrual, enabled,
        start_date, end_date, calendar_color, calendar_abbreviation,
        created_by, updated_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$24)
      RETURNING *`,
      [
        autoCode, b.name, b.description || null, b.classification_id || null,
        b.base_type, includePH, b.paid !== false, b.gender_restriction || null,
        !!b.requires_document, b.document_required_after_days || null,
        !!b.carry_forward_allowed, b.carry_forward_max_days || null, b.forfeit_excess !== false,
        b.pro_rata_on_join !== false, b.pro_rata_on_terminate !== false,
        b.max_accumulation || null, b.max_negative_balance || 0,
        !!b.payroll_linked_accrual, b.enabled !== false,
        b.start_date || null, b.end_date || '9999-12-31', b.calendar_color || null,
        b.calendar_abbreviation ? String(b.calendar_abbreviation).toUpperCase() : autoCode,
        userId,
      ]
    );
    const newId = t.rows[0].id;
    if (Array.isArray(b.rules)) {
      for (const r of b.rules) {
        await client.query(
          `INSERT INTO leave_type_rule (leave_type_id, deduction_priority, rule_name,
             service_months_from, service_months_to, entitlement_days, accrual_frequency,
             cycle_months, max_accumulation, notes, created_by, updated_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11)`,
          [newId, r.deduction_priority, r.rule_name || null,
            r.service_months_from || 0, r.service_months_to || null,
            r.entitlement_days || 0, r.accrual_frequency || 'MONTHLY',
            r.cycle_months || null, r.max_accumulation || null, r.notes || null, userId]
        );
      }
    }
    await client.query('COMMIT');
    res.json({ success: true, data: t.rows[0] });
  } catch (err) { await client.query('ROLLBACK'); next(err); }
  finally { client.release(); }
});

router.put('/types/:id', authenticate, auditLog('UPDATE', 'leave_type'), async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const userId = req.user?.id || null;
    const b = req.body || {};
    const effectiveBaseType = b.base_type || (await client.query(`SELECT base_type FROM leave_type WHERE id = $1`, [req.params.id])).rows[0]?.base_type;
    const includePH = effectiveBaseType === 'CALENDAR_DAYS'
      ? (b.include_public_holidays === undefined ? undefined : !!b.include_public_holidays)
      : false;
    const updAbbrev = b.calendar_abbreviation ? String(b.calendar_abbreviation).toUpperCase() : null;
    const t = await client.query(
      `UPDATE leave_type SET
        name = COALESCE($1, name), description = $2, classification_id = $3,
        base_type = COALESCE($4, base_type), include_public_holidays = COALESCE($5, include_public_holidays),
        paid = COALESCE($6, paid), gender_restriction = $7,
        requires_document = COALESCE($8, requires_document), document_required_after_days = $9,
        carry_forward_allowed = COALESCE($10, carry_forward_allowed), carry_forward_max_days = $11,
        forfeit_excess = COALESCE($12, forfeit_excess),
        pro_rata_on_join = COALESCE($13, pro_rata_on_join),
        pro_rata_on_terminate = COALESCE($14, pro_rata_on_terminate),
        max_accumulation = $15, max_negative_balance = COALESCE($16, max_negative_balance),
        payroll_linked_accrual = COALESCE($17, payroll_linked_accrual),
        enabled = COALESCE($18, enabled),
        start_date = $20, end_date = $21,
        calendar_color = $22, calendar_abbreviation = COALESCE($23, calendar_abbreviation),
        code = COALESCE($23, code),
        updated_by = $19, updated_at = NOW()
       WHERE id = $24 AND deleted_at IS NULL RETURNING *`,
      [
        b.name, b.description || null, b.classification_id || null, b.base_type,
        includePH, b.paid, b.gender_restriction || null,
        b.requires_document, b.document_required_after_days || null,
        b.carry_forward_allowed, b.carry_forward_max_days || null,
        b.forfeit_excess, b.pro_rata_on_join, b.pro_rata_on_terminate,
        b.max_accumulation || null, b.max_negative_balance,
        b.payroll_linked_accrual, b.enabled, userId,
        b.start_date || null, b.end_date || '9999-12-31',
        b.calendar_color || null, updAbbrev, req.params.id,
      ]
    );
    if (!t.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: { message: 'Leave type not found' } });
    }
    if (Array.isArray(b.rules)) {
      if (b.rules.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: { message: 'At least one entitlement rule is required' } });
      }
      const priorities = b.rules.map(r => Number(r.deduction_priority));
      if (new Set(priorities).size !== priorities.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: { message: 'Duplicate deduction priorities are not allowed' } });
      }
      await client.query(`DELETE FROM leave_type_rule WHERE leave_type_id = $1`, [req.params.id]);
      for (const r of b.rules) {
        await client.query(
          `INSERT INTO leave_type_rule (leave_type_id, deduction_priority, rule_name,
             service_months_from, service_months_to, entitlement_days, accrual_frequency,
             cycle_months, max_accumulation, notes, created_by, updated_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11)`,
          [req.params.id, r.deduction_priority, r.rule_name || null,
            r.service_months_from || 0, r.service_months_to || null,
            r.entitlement_days || 0, r.accrual_frequency || 'MONTHLY',
            r.cycle_months || null, r.max_accumulation || null, r.notes || null, userId]
        );
      }
    }
    await client.query('COMMIT');
    res.json({ success: true, data: t.rows[0] });
  } catch (err) { await client.query('ROLLBACK'); next(err); }
  finally { client.release(); }
});

router.delete('/types/:id', authenticate, auditLog('DELETE', 'leave_type'), async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const inUse = await dbQuery(
      `SELECT COUNT(*) AS cnt FROM leave_scheme_leave_type WHERE leave_type_id = $1 AND deleted_at IS NULL`,
      [req.params.id]);
    if (parseInt(inUse.rows[0].cnt) > 0) {
      return res.status(409).json({ success: false, error: { message: 'Leave type is in use by one or more schemes' } });
    }
    await dbQuery(
      `UPDATE leave_type SET deleted_at = NOW(), updated_by = $1, enabled = FALSE WHERE id = $2`,
      [userId, req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// === Leave Schemes ===
router.get('/schemes', authenticate, async (req, res, next) => {
  try {
    const r = await dbQuery(
      `SELECT ls.*, et.name AS employee_type_name, est.name AS employee_subtype_name,
              cos.name AS condition_of_service_name,
              (SELECT COUNT(*) FROM leave_scheme_leave_type lslt
                 WHERE lslt.leave_scheme_id = ls.id AND lslt.deleted_at IS NULL) AS leave_type_count,
              (SELECT COUNT(*) FROM employees e WHERE e.leave_scheme_id = ls.id) AS employee_count
       FROM leave_scheme ls
       LEFT JOIN employee_types et ON ls.employee_type_id = et.id
       LEFT JOIN employee_subtypes est ON ls.employee_subtype_id = est.id
       LEFT JOIN conditions_of_service cos ON ls.condition_of_service_id = cos.id
       WHERE ls.deleted_at IS NULL
       ORDER BY ls.name`
    );
    res.json({ success: true, data: r.rows });
  } catch (err) { next(err); }
});

// === Eligible schemes for a specific employee (must be before /:id) ===
router.get('/schemes/eligible', authenticate, async (req, res, next) => {
  try {
    const { employee_id } = req.query;
    if (!employee_id) return res.status(400).json({ success: false, error: { message: 'employee_id required' } });
    const emp = await dbQuery(`SELECT employee_type_id, employee_subtype_id, condition_of_service_id FROM employees WHERE id = $1`, [employee_id]);
    if (!emp.rows.length) return res.status(404).json({ success: false, error: { message: 'Employee not found' } });
    const { employee_type_id, employee_subtype_id, condition_of_service_id } = emp.rows[0];
    const r = await dbQuery(
      `SELECT ls.*, et.name AS employee_type_name, est.name AS employee_subtype_name,
              cos.name AS condition_of_service_name,
              (SELECT COUNT(*) FROM leave_scheme_leave_type lslt
                 WHERE lslt.leave_scheme_id = ls.id AND lslt.deleted_at IS NULL) AS leave_type_count
       FROM leave_scheme ls
       LEFT JOIN employee_types et ON ls.employee_type_id = et.id
       LEFT JOIN employee_subtypes est ON ls.employee_subtype_id = est.id
       LEFT JOIN conditions_of_service cos ON ls.condition_of_service_id = cos.id
       WHERE ls.deleted_at IS NULL
         AND ls.enabled = TRUE
         AND (ls.employee_type_id IS NULL OR ls.employee_type_id = $1)
         AND (ls.employee_subtype_id IS NULL OR ls.employee_subtype_id = $2)
         AND (ls.condition_of_service_id IS NULL OR ls.condition_of_service_id = $3)
       ORDER BY ls.name`,
      [employee_type_id, employee_subtype_id, condition_of_service_id]
    );
    res.json({ success: true, data: r.rows, has_balances: false });
  } catch (err) { next(err); }
});

// === Leave types in a scheme (for employee leave tab view, must be before /:id) ===
router.get('/schemes/:id/leave-types', authenticate, async (req, res, next) => {
  try {
    const r = await dbQuery(
      `SELECT lt.id, lt.name, lt.code, lt.calendar_color, lt.calendar_abbreviation, lt.base_type, lt.paid
       FROM leave_scheme_leave_type lslt
       JOIN leave_type lt ON lslt.leave_type_id = lt.id
       WHERE lslt.leave_scheme_id = $1 AND lslt.deleted_at IS NULL AND lt.deleted_at IS NULL
       ORDER BY lt.name`, [req.params.id]);
    res.json({ success: true, data: r.rows });
  } catch (err) { next(err); }
});

router.get('/schemes/:id', authenticate, async (req, res, next) => {
  try {
    const r = await dbQuery(
      `SELECT ls.*, et.name AS employee_type_name, est.name AS employee_subtype_name,
              cos.name AS condition_of_service_name
       FROM leave_scheme ls
       LEFT JOIN employee_types et ON ls.employee_type_id = et.id
       LEFT JOIN employee_subtypes est ON ls.employee_subtype_id = est.id
       LEFT JOIN conditions_of_service cos ON ls.condition_of_service_id = cos.id
       WHERE ls.id = $1 AND ls.deleted_at IS NULL`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ success: false, error: { message: 'Leave scheme not found' } });
    const types = await dbQuery(
      `SELECT lslt.id AS link_id, lslt.display_order, lt.*
       FROM leave_scheme_leave_type lslt
       JOIN leave_type lt ON lslt.leave_type_id = lt.id
       WHERE lslt.leave_scheme_id = $1 AND lslt.deleted_at IS NULL
       ORDER BY lslt.display_order, lt.name`, [req.params.id]);
    res.json({ success: true, data: { ...r.rows[0], leave_types: types.rows } });
  } catch (err) { next(err); }
});

router.post('/schemes', authenticate, auditLog('CREATE', 'leave_scheme'), async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const userId = req.user?.id || null;
    const b = req.body || {};
    if (!b.code || !b.name) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: { message: 'code and name required' } });
    }
    if (!Array.isArray(b.leave_type_ids) || b.leave_type_ids.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: { message: 'At least one leave type must be linked to the scheme' } });
    }
    if (new Set(b.leave_type_ids.map(Number)).size !== b.leave_type_ids.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: { message: 'Duplicate leave types are not allowed in a scheme' } });
    }
    const s = await client.query(
      `INSERT INTO leave_scheme (code, name, description, employee_type_id, employee_subtype_id,
         condition_of_service_id, start_date, end_date, enabled, created_by, updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10) RETURNING *`,
      [String(b.code).toUpperCase(), b.name, b.description || null,
       b.employee_type_id || null, b.employee_subtype_id || null, b.condition_of_service_id || null,
       b.start_date || null, b.end_date || null, b.enabled !== false, userId]
    );
    const newId = s.rows[0].id;
    if (Array.isArray(b.leave_type_ids)) {
      for (let i = 0; i < b.leave_type_ids.length; i++) {
        await client.query(
          `INSERT INTO leave_scheme_leave_type (leave_scheme_id, leave_type_id, display_order, created_by, updated_by)
           VALUES ($1,$2,$3,$4,$4)`,
          [newId, b.leave_type_ids[i], i, userId]
        );
      }
    }
    await client.query('COMMIT');
    res.json({ success: true, data: s.rows[0] });
  } catch (err) { await client.query('ROLLBACK'); next(err); }
  finally { client.release(); }
});

router.put('/schemes/:id', authenticate, auditLog('UPDATE', 'leave_scheme'), async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const userId = req.user?.id || null;
    const b = req.body || {};
    const s = await client.query(
      `UPDATE leave_scheme SET
        name = COALESCE($1, name), description = $2,
        employee_type_id = $3, employee_subtype_id = $4, condition_of_service_id = $5,
        start_date = $6, end_date = $7, enabled = COALESCE($8, enabled),
        updated_by = $9, updated_at = NOW()
       WHERE id = $10 AND deleted_at IS NULL RETURNING *`,
      [b.name, b.description || null, b.employee_type_id || null, b.employee_subtype_id || null,
       b.condition_of_service_id || null, b.start_date || null, b.end_date || null,
       b.enabled, userId, req.params.id]
    );
    if (!s.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: { message: 'Leave scheme not found' } });
    }
    if (Array.isArray(b.leave_type_ids)) {
      if (b.leave_type_ids.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: { message: 'At least one leave type must be linked to the scheme' } });
      }
      if (new Set(b.leave_type_ids.map(Number)).size !== b.leave_type_ids.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: { message: 'Duplicate leave types are not allowed in a scheme' } });
      }
      await client.query(
        `UPDATE leave_scheme_leave_type SET deleted_at = NOW(), updated_by = $1
         WHERE leave_scheme_id = $2 AND deleted_at IS NULL`, [userId, req.params.id]);
      for (let i = 0; i < b.leave_type_ids.length; i++) {
        await client.query(
          `INSERT INTO leave_scheme_leave_type (leave_scheme_id, leave_type_id, display_order, created_by, updated_by)
           VALUES ($1,$2,$3,$4,$4)`,
          [req.params.id, b.leave_type_ids[i], i, userId]
        );
      }
    }
    await client.query('COMMIT');
    res.json({ success: true, data: s.rows[0] });
  } catch (err) { await client.query('ROLLBACK'); next(err); }
  finally { client.release(); }
});

router.delete('/schemes/:id', authenticate, auditLog('DELETE', 'leave_scheme'), async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const inUse = await dbQuery(
      `SELECT COUNT(*) AS cnt FROM employees WHERE leave_scheme_id = $1`, [req.params.id]);
    if (parseInt(inUse.rows[0].cnt) > 0) {
      return res.status(409).json({ success: false,
        error: { message: `Leave scheme is assigned to ${inUse.rows[0].cnt} employee(s)` } });
    }
    await dbQuery(
      `UPDATE leave_scheme SET deleted_at = NOW(), updated_by = $1, enabled = FALSE WHERE id = $2`,
      [userId, req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// === Validation: employee ↔ leave-scheme classifier mismatches ===
// Returns employees whose current leave_scheme_id no longer matches the scheme's
// employee_type_id / employee_subtype_id / condition_of_service_id constraints.
router.get('/validation/invalid-employee-schemes', authenticate, async (req, res, next) => {
  try {
    const setup = await dbQuery(`SELECT enable_leave FROM leave_setup WHERE id = 1`);
    const leaveEnabled = !!(setup.rows[0] && setup.rows[0].enable_leave);
    if (!leaveEnabled) {
      return res.json({ success: true, data: [] });
    }

    const missing = leaveEnabled ? await dbQuery(
      `SELECT e.id, e.employee_code, e.first_name, e.surname AS last_name,
              e.employee_type_id, e.employee_subtype_id, e.condition_of_service_id,
              NULL::INTEGER AS leave_scheme_id, NULL::TEXT AS leave_scheme_name,
              NULL::INTEGER AS scheme_employee_type_id,
              NULL::INTEGER AS scheme_employee_subtype_id,
              NULL::INTEGER AS scheme_condition_of_service_id,
              'MISSING' AS reason
       FROM employees e
       WHERE e.leave_scheme_id IS NULL
         AND e.status = 'ACTIVE'
       ORDER BY e.employee_code`
    ) : { rows: [] };

    const mismatch = await dbQuery(
      `SELECT e.id, e.employee_code, e.first_name, e.surname AS last_name,
              e.employee_type_id, e.employee_subtype_id, e.condition_of_service_id,
              ls.id AS leave_scheme_id, ls.name AS leave_scheme_name,
              ls.employee_type_id AS scheme_employee_type_id,
              ls.employee_subtype_id AS scheme_employee_subtype_id,
              ls.condition_of_service_id AS scheme_condition_of_service_id,
              'MISMATCH' AS reason
       FROM employees e
       JOIN leave_scheme ls ON e.leave_scheme_id = ls.id
       WHERE ls.deleted_at IS NULL
         AND (
           (ls.employee_type_id IS NOT NULL AND ls.employee_type_id <> e.employee_type_id)
           OR (ls.employee_subtype_id IS NOT NULL AND ls.employee_subtype_id <> e.employee_subtype_id)
           OR (ls.condition_of_service_id IS NOT NULL AND ls.condition_of_service_id <> e.condition_of_service_id)
         )
       ORDER BY e.employee_code`
    );
    res.json({ success: true, data: [...missing.rows, ...mismatch.rows] });
  } catch (err) { next(err); }
});

// ============================================================
// LEAVE MODULE PHASE 2 — HELPER
// ============================================================
async function canApproveForModule(entityType, userId, userRoles) {
  const defResult = await dbQuery(
    `SELECT id, steps FROM workflow_definitions WHERE entity_type = $1 AND enabled = TRUE`,
    [entityType]
  );
  if (defResult.rows.length === 0) return { canApprove: true, mode: 'direct' };
  for (const def of defResult.rows) {
    const steps = def.steps || [];
    for (const step of steps) {
      const assignedUsers = step.assigned_users || [];
      if (assignedUsers.includes(userId)) return { canApprove: true, mode: 'workflow' };
      if (step.assigned_role) {
        const norm = step.assigned_role.toLowerCase().replace(/[\s_-]+/g, '_');
        if ((userRoles || []).some(r => String(r).toLowerCase().replace(/[\s_-]+/g, '_') === norm)) {
          return { canApprove: true, mode: 'workflow' };
        }
      }
    }
  }
  const delegations = await dbQuery(
    `SELECT from_user FROM delegations WHERE to_user = $1 AND active = TRUE
     AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE
     AND (module = $2 OR module IS NULL)`,
    [userId, entityType]
  );
  if (delegations.rows.length > 0) {
    for (const def of defResult.rows) {
      const steps = def.steps || [];
      for (const step of steps) {
        const assignedUsers = step.assigned_users || [];
        for (const del of delegations.rows) {
          if (assignedUsers.includes(del.from_user)) return { canApprove: true, mode: 'workflow' };
        }
      }
    }
  }
  return { canApprove: false, mode: 'workflow' };
}

// ============================================================
// SCHEME TYPES & BALANCE
// ============================================================

router.get('/scheme-types/:employee_id', authenticate, async (req, res, next) => {
  try {
    const empId = parseInt(req.params.employee_id);
    const emp = await dbQuery(`SELECT leave_scheme_id, gender FROM employees WHERE id = $1`, [empId]);
    if (!emp.rows.length) return res.status(404).json({ success: false, error: { message: 'Employee not found' } });
    const { leave_scheme_id, gender } = emp.rows[0];
    if (!leave_scheme_id) return res.json({ success: true, data: [] });
    const params = [leave_scheme_id];
    let gf = '';
    if (gender) { gf = ` AND (lt.gender_restriction IS NULL OR lt.gender_restriction = $2)`; params.push(gender); }
    const r = await dbQuery(
      `SELECT lt.id, lt.name, lt.code, lt.base_type, lt.paid, lt.calendar_color, lt.calendar_abbreviation,
              lt.max_accumulation, lt.max_negative_balance, lt.requires_document, lt.document_required_after_days,
              lt.include_public_holidays, lt.gender_restriction, lt.carry_forward_allowed, lt.carry_forward_max_days
       FROM leave_scheme_leave_type lslt
       JOIN leave_type lt ON lslt.leave_type_id = lt.id
       WHERE lslt.leave_scheme_id = $1 AND lslt.deleted_at IS NULL AND lt.deleted_at IS NULL AND lt.enabled = TRUE
       ${gf} ORDER BY lt.name`, params);
    res.json({ success: true, data: r.rows });
  } catch (err) { next(err); }
});

router.get('/balance/:employee_id', authenticate, async (req, res, next) => {
  try {
    const empId = parseInt(req.params.employee_id);
    const emp = await dbQuery(`SELECT leave_scheme_id FROM employees WHERE id = $1`, [empId]);
    if (!emp.rows.length) return res.status(404).json({ success: false, error: { message: 'Employee not found' } });
    const { leave_scheme_id } = emp.rows[0];
    if (!leave_scheme_id) return res.json({ success: true, data: [] });
    const r = await dbQuery(`
      SELECT lt.id AS leave_type_id, lt.name AS leave_type_name, lt.code AS leave_type_code,
             lt.max_accumulation, lt.max_negative_balance, lt.base_type, lt.calendar_color,
             COALESCE(adj_ob.days, 0) AS opening_balance,
             COALESCE(adj_adj.days, 0) AS adjusted_days,
             COALESCE(adj_enc.days, 0) AS encashed_days,
             COALESCE(adj_acc.days, 0) AS accrued_days,
             COALESCE(adj_forf.days, 0) AS forfeited_days,
             COALESCE(taken.days, 0) AS taken_days,
             COALESCE(pending.days, 0) AS pending_days,
             COALESCE(adj_ob.days,0) + COALESCE(adj_adj.days,0) + COALESCE(adj_acc.days,0)
               - COALESCE(taken.days,0) - COALESCE(adj_enc.days,0) - COALESCE(adj_forf.days,0) AS available_days
      FROM leave_scheme_leave_type lslt
      JOIN leave_type lt ON lslt.leave_type_id = lt.id
      LEFT JOIN (SELECT leave_type_id, SUM(adjustment_days) AS days FROM leave_adjustments
        WHERE employee_id=$1 AND status='APPROVED' AND adjustment_type='OPENING_BALANCE' GROUP BY leave_type_id
      ) adj_ob ON adj_ob.leave_type_id = lt.id
      LEFT JOIN (SELECT leave_type_id, SUM(adjustment_days) AS days FROM leave_adjustments
        WHERE employee_id=$1 AND status='APPROVED' AND adjustment_type='ADJUSTED' GROUP BY leave_type_id
      ) adj_adj ON adj_adj.leave_type_id = lt.id
      LEFT JOIN (SELECT leave_type_id, SUM(adjustment_days) AS days FROM leave_adjustments
        WHERE employee_id=$1 AND status='APPROVED' AND adjustment_type='ENCASHED' GROUP BY leave_type_id
      ) adj_enc ON adj_enc.leave_type_id = lt.id
      LEFT JOIN (SELECT leave_type_id, SUM(adjustment_days) AS days FROM leave_adjustments
        WHERE employee_id=$1 AND status='APPROVED' AND adjustment_type='ACCRUED' GROUP BY leave_type_id
      ) adj_acc ON adj_acc.leave_type_id = lt.id
      LEFT JOIN (SELECT leave_type_id, SUM(adjustment_days) AS days FROM leave_adjustments
        WHERE employee_id=$1 AND status='APPROVED' AND adjustment_type='FORFEITED' GROUP BY leave_type_id
      ) adj_forf ON adj_forf.leave_type_id = lt.id
      LEFT JOIN (SELECT leave_type_id, SUM(days) AS days FROM leave_transactions
        WHERE employee_id=$1 AND status='APPROVED' GROUP BY leave_type_id
      ) taken ON taken.leave_type_id = lt.id
      LEFT JOIN (SELECT leave_type_id, SUM(days) AS days FROM leave_transactions
        WHERE employee_id=$1 AND status='PENDING' GROUP BY leave_type_id
      ) pending ON pending.leave_type_id = lt.id
      WHERE lslt.leave_scheme_id=$2 AND lslt.deleted_at IS NULL AND lt.deleted_at IS NULL
      ORDER BY lt.name
    `, [empId, leave_scheme_id]);
    res.json({ success: true, data: r.rows });
  } catch (err) { next(err); }
});

// ============================================================
// LEAVE TRANSACTIONS (Requests) — can-approve BEFORE /:id
// ============================================================

router.get('/transactions/can-approve', authenticate, async (req, res, next) => {
  try {
    const result = await canApproveForModule('LEAVE_REQUEST', req.user?.id, req.user?.roles || []);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.get('/transactions', authenticate, async (req, res, next) => {
  try {
    const { employee_id, status, leave_type_id, date_from, date_to } = req.query;
    const conds = ['1=1']; const params = [];
    if (employee_id) { params.push(employee_id); conds.push(`lt.employee_id = $${params.length}`); }
    if (status) { params.push(status); conds.push(`lt.status = $${params.length}`); }
    if (leave_type_id) { params.push(leave_type_id); conds.push(`lt.leave_type_id = $${params.length}`); }
    if (date_from) { params.push(date_from); conds.push(`lt.start_date >= $${params.length}`); }
    if (date_to) { params.push(date_to); conds.push(`lt.end_date <= $${params.length}`); }
    const r = await dbQuery(`
      SELECT lt.id, lt.employee_id, lt.leave_type_id, lt.start_date, lt.end_date, lt.days,
             lt.reason, lt.status, lt.reference_no, lt.manual_doc_number, lt.document_path, lt.created_at,
             e.id AS emp_id, e.employee_code, e.first_name, e.surname,
             ltype.name AS leave_type_name, ltype.code AS leave_type_code, ltype.calendar_color,
             u.username AS created_by_name, lt.created_by
      FROM leave_transactions lt
      JOIN employees e ON lt.employee_id = e.id
      JOIN leave_type ltype ON lt.leave_type_id = ltype.id
      LEFT JOIN users u ON lt.created_by = u.id
      WHERE ${conds.join(' AND ')} ORDER BY lt.created_at DESC LIMIT 500
    `, params);
    res.json({ success: true, data: r.rows });
  } catch (err) { next(err); }
});

router.post('/transactions', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const { employee_id, leave_type_id, start_date, end_date, days, reason, manual_doc_number } = req.body || {};
    if (!employee_id || !leave_type_id || !start_date || !end_date) {
      return res.status(400).json({ success: false, error: { message: 'employee_id, leave_type_id, start_date and end_date are required' } });
    }
    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ success: false, error: { message: 'start_date cannot be after end_date' } });
    }
    const emp = await dbQuery(`SELECT leave_scheme_id, gender FROM employees WHERE id = $1`, [employee_id]);
    if (!emp.rows.length) return res.status(404).json({ success: false, error: { message: 'Employee not found' } });
    const { leave_scheme_id, gender } = emp.rows[0];
    if (!leave_scheme_id) {
      return res.status(400).json({ success: false, error: { message: 'Employee has no leave scheme assigned' } });
    }
    const sc = await dbQuery(`
      SELECT lt.id, lt.gender_restriction, lt.max_negative_balance, lt.base_type,
             lt.include_public_holidays, lt.requires_document, lt.document_required_after_days
      FROM leave_scheme_leave_type lslt JOIN leave_type lt ON lslt.leave_type_id = lt.id
      WHERE lslt.leave_scheme_id = $1 AND lt.id = $2 AND lslt.deleted_at IS NULL AND lt.deleted_at IS NULL
    `, [leave_scheme_id, leave_type_id]);
    if (!sc.rows.length) {
      return res.status(400).json({ success: false, error: { message: "Selected leave type is not in employee's leave scheme" } });
    }
    const ltRow = sc.rows[0];
    if (ltRow.gender_restriction && gender && ltRow.gender_restriction !== gender) {
      return res.status(400).json({ success: false, error: { message: `This leave type is restricted to ${ltRow.gender_restriction === 'M' ? 'male' : 'female'} employees` } });
    }
    let requestDays;
    if (ltRow.base_type === 'WORKING_DAYS') {
      requestDays = await calculateWorkingDays(start_date, end_date, !ltRow.include_public_holidays, true);
    } else {
      requestDays = parseFloat(days) || (Math.round((new Date(end_date) - new Date(start_date)) / 86400000) + 1);
    }
    const { document_base64, document_filename } = req.body || {};
    if (ltRow.requires_document) {
      const reqAfterDays = ltRow.document_required_after_days ? parseFloat(ltRow.document_required_after_days) : null;
      const needsDoc = !reqAfterDays || requestDays > reqAfterDays;
      if (needsDoc && !document_base64) {
        return res.status(400).json({ success: false, error: {
          message: `This leave type requires supporting documentation${reqAfterDays ? ` for requests exceeding ${reqAfterDays} days` : ''}.`
        }});
      }
    }
    let document_path = null;
    if (document_base64 && document_filename) {
      try {
        const uploadsDir = path.join(__dirname, '../../public/uploads/leave');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        const safeFilename = `${Date.now()}-${path.basename(String(document_filename)).replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        fs.writeFileSync(path.join(uploadsDir, safeFilename), Buffer.from(document_base64, 'base64'));
        document_path = `uploads/leave/${safeFilename}`;
      } catch (fileErr) { console.warn('Leave tx file save error:', fileErr.message); }
    }
    const maxNeg = parseFloat(ltRow.max_negative_balance) || 0;
    const [adjRow, takenRow] = await Promise.all([
      dbQuery(`SELECT COALESCE(SUM(CASE WHEN adjustment_type IN ('OPENING_BALANCE','ADJUSTED','ACCRUED') THEN adjustment_days ELSE -adjustment_days END),0) AS bal
               FROM leave_adjustments WHERE employee_id=$1 AND leave_type_id=$2 AND status='APPROVED'`, [employee_id, leave_type_id]),
      dbQuery(`SELECT COALESCE(SUM(days),0) AS taken FROM leave_transactions WHERE employee_id=$1 AND leave_type_id=$2 AND status='APPROVED'`, [employee_id, leave_type_id])
    ]);
    const available = parseFloat(adjRow.rows[0].bal || 0) - parseFloat(takenRow.rows[0].taken || 0);
    if (available - requestDays < -maxNeg) {
      return res.status(400).json({ success: false, error: {
        message: `Insufficient leave balance. Available: ${available.toFixed(2)} days. Max negative allowed: ${maxNeg.toFixed(2)} days.`
      }});
    }
    const refNo = 'LR-' + Date.now().toString(36).toUpperCase().slice(-6) + Math.random().toString(36).slice(2,6).toUpperCase();
    const ins = await dbQuery(
      `INSERT INTO leave_transactions (employee_id, leave_type_id, start_date, end_date, days, reason, status, reference_no, manual_doc_number, document_path, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,'PENDING',$7,$8,$9,$10) RETURNING *`,
      [employee_id, leave_type_id, start_date, end_date, requestDays, reason || null, refNo, manual_doc_number || null, document_path, userId]);
    const { writeHistory, checkAutoApprove } = require('../services/transaction-approval.service');
    await writeHistory('LEAVE_REQUEST', ins.rows[0].id, 'SUBMITTED', userId, null, null, 'PENDING');
    try {
      const auto = await checkAutoApprove('LEAVE_REQUEST', ins.rows[0].id, userId, parseInt(employee_id));
      if (auto) {
        const upd = await dbQuery('SELECT * FROM leave_transactions WHERE id = $1', [ins.rows[0].id]);
        return res.status(201).json({ success: true, data: upd.rows[0], message: 'Leave request auto-approved.' });
      }
    } catch (wfErr) { console.warn('Workflow init warning LEAVE_REQUEST', ins.rows[0].id, ':', wfErr.message); }
    res.status(201).json({ success: true, data: ins.rows[0] });
  } catch (err) { next(err); }
});

router.post('/transactions/bulk-approve', authenticate, async (req, res, next) => {
  try {
    const { ids, comments } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, error: { message: 'ids array is required' } });
    const { handleApproval } = require('../services/transaction-approval.service');
    const results = [];
    for (const id of ids) {
      try {
        const r = await handleApproval('LEAVE_REQUEST', parseInt(id), req.user?.id, req.user?.roles || [], comments || null);
        results.push({ id, success: r.success });
      } catch (e) { results.push({ id, success: false, error: e.message }); }
    }
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

router.post('/transactions/bulk-reject', authenticate, async (req, res, next) => {
  try {
    const { ids, comments } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, error: { message: 'ids array is required' } });
    if (!comments?.trim()) return res.status(400).json({ success: false, error: { message: 'comments required for bulk rejection' } });
    const { handleRejection } = require('../services/transaction-approval.service');
    const results = [];
    for (const id of ids) {
      try {
        const r = await handleRejection('LEAVE_REQUEST', parseInt(id), req.user?.id, req.user?.roles || [], comments);
        results.push({ id, success: r.success });
      } catch (e) { results.push({ id, success: false, error: e.message }); }
    }
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

router.get('/transactions/:id', authenticate, async (req, res, next) => {
  try {
    const r = await dbQuery(`
      SELECT lt.*, e.employee_code, e.first_name, e.surname, e.id_number,
             ltype.name AS leave_type_name, ltype.code AS leave_type_code, u.username AS created_by_name
      FROM leave_transactions lt
      JOIN employees e ON lt.employee_id = e.id
      JOIN leave_type ltype ON lt.leave_type_id = ltype.id
      LEFT JOIN users u ON lt.created_by = u.id
      WHERE lt.id = $1`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ success: false, error: { message: 'Leave request not found' } });
    res.json({ success: true, data: r.rows[0] });
  } catch (err) { next(err); }
});

router.get('/transactions/:id/can-approve', authenticate, async (req, res, next) => {
  try {
    const tx = await dbQuery(`SELECT status, created_by FROM leave_transactions WHERE id = $1`, [req.params.id]);
    if (!tx.rows.length) return res.status(404).json({ success: false, error: { message: 'Leave request not found' } });
    if (tx.rows[0].status !== 'PENDING') return res.json({ success: true, data: { canApprove: false, reason: 'Not pending' } });
    const result = await canApproveForModule('LEAVE_REQUEST', req.user?.id, req.user?.roles || []);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.patch('/transactions/:id/approve', authenticate, async (req, res, next) => {
  try {
    const { handleApproval } = require('../services/transaction-approval.service');
    const result = await handleApproval('LEAVE_REQUEST', parseInt(req.params.id), req.user?.id, req.user?.roles || [], req.body?.comments || null);
    if (!result.success) return res.status(result.status || 400).json(result);
    res.json(result);
  } catch (err) { next(err); }
});

router.patch('/transactions/:id/reject', authenticate, async (req, res, next) => {
  try {
    const { handleRejection } = require('../services/transaction-approval.service');
    const result = await handleRejection('LEAVE_REQUEST', parseInt(req.params.id), req.user?.id, req.user?.roles || [], req.body?.comments || null);
    if (!result.success) return res.status(result.status || 400).json(result);
    res.json(result);
  } catch (err) { next(err); }
});

router.patch('/transactions/:id/return', authenticate, async (req, res, next) => {
  try {
    const { handleReturn } = require('../services/transaction-approval.service');
    const result = await handleReturn('LEAVE_REQUEST', parseInt(req.params.id), req.user?.id, req.user?.roles || [], req.body?.comments || null);
    if (!result.success) return res.status(result.status || 400).json(result);
    res.json(result);
  } catch (err) { next(err); }
});

router.patch('/transactions/:id/resubmit', authenticate, async (req, res, next) => {
  try {
    const txId = parseInt(req.params.id);
    const userId = req.user?.id || null;
    const { leave_type_id, start_date, end_date, days, reason, manual_doc_number, document_base64, document_filename } = req.body || {};
    const existing = await dbQuery('SELECT * FROM leave_transactions WHERE id = $1', [txId]);
    if (!existing.rows.length) return res.status(404).json({ success: false, error: { message: 'Leave request not found' } });
    if (existing.rows[0].status !== 'RETURNED') return res.status(400).json({ success: false, error: { message: 'Only RETURNED requests can be resubmitted' } });
    if (!leave_type_id || !start_date || !end_date || days == null) {
      return res.status(400).json({ success: false, error: { message: 'leave_type_id, start_date, end_date and days are required' } });
    }
    const requestDays = parseFloat(days);
    if (isNaN(requestDays) || requestDays <= 0) return res.status(400).json({ success: false, error: { message: 'days must be greater than zero' } });
    let document_path = existing.rows[0].document_path;
    if (document_base64 && document_filename) {
      const buf = Buffer.from(document_base64, 'base64');
      if (buf.length > 5 * 1024 * 1024) return res.status(400).json({ success: false, error: { message: 'Document must be smaller than 5 MB' } });
      const path = require('path');
      const fs = require('fs');
      const uploadsDir = path.join(__dirname, '../../..', 'uploads', 'leave');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      const ext = path.extname(document_filename) || '';
      const fname = `leave_${txId}_${Date.now()}${ext}`;
      fs.writeFileSync(path.join(uploadsDir, fname), buf);
      document_path = `/uploads/leave/${fname}`;
    }
    await dbQuery(
      `UPDATE leave_transactions SET leave_type_id=$1, start_date=$2, end_date=$3, days=$4, reason=$5,
       manual_doc_number=$6, document_path=$7, status='PENDING', updated_at=NOW() WHERE id=$8`,
      [leave_type_id, start_date, end_date, requestDays, reason || null, manual_doc_number || null, document_path, txId]);
    const { writeHistory, checkAutoApprove } = require('../services/transaction-approval.service');
    await writeHistory('LEAVE_REQUEST', txId, 'RESUBMITTED', userId, null, null, 'PENDING');
    try {
      await checkAutoApprove('LEAVE_REQUEST', txId, userId, existing.rows[0].employee_id);
    } catch (wfErr) { console.warn('Workflow init warning LEAVE_REQUEST resubmit', txId, ':', wfErr.message); }
    const upd = await dbQuery(`
      SELECT lt.*, e.employee_code, e.first_name, e.surname, ltype.name AS leave_type_name
      FROM leave_transactions lt
      JOIN employees e ON lt.employee_id = e.id
      JOIN leave_type ltype ON lt.leave_type_id = ltype.id
      WHERE lt.id = $1`, [txId]);
    res.json({ success: true, data: upd.rows[0] });
  } catch (err) { next(err); }
});

router.get('/transactions/:id/history', authenticate, async (req, res, next) => {
  try {
    const r = await dbQuery(`
      SELECT h.*, u.username AS performed_by_name FROM leave_transaction_history h
      LEFT JOIN users u ON h.performed_by = u.id
      WHERE h.leave_transaction_id = $1 ORDER BY h.performed_at ASC`, [req.params.id]);
    res.json({ success: true, data: r.rows });
  } catch (err) { next(err); }
});

// ============================================================
// LEAVE ADJUSTMENTS — can-approve BEFORE /:id
// ============================================================

router.get('/adjustments/can-approve', authenticate, async (req, res, next) => {
  try {
    const result = await canApproveForModule('LEAVE_ADJUSTMENT', req.user?.id, req.user?.roles || []);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.get('/adjustments', authenticate, async (req, res, next) => {
  try {
    const { employee_id, status, leave_type_id, adjustment_type } = req.query;
    const conds = ['1=1']; const params = [];
    if (employee_id) { params.push(employee_id); conds.push(`la.employee_id = $${params.length}`); }
    if (status) { params.push(status); conds.push(`la.status = $${params.length}`); }
    if (leave_type_id) { params.push(leave_type_id); conds.push(`la.leave_type_id = $${params.length}`); }
    if (adjustment_type) { params.push(adjustment_type); conds.push(`la.adjustment_type = $${params.length}`); }
    const r = await dbQuery(`
      SELECT la.id, la.employee_id, la.leave_type_id, la.adjustment_type, la.adjustment_days,
             la.effective_date, la.reason, la.status, la.reference_no, la.created_at, la.created_by,
             e.id AS emp_id, e.employee_code, e.first_name, e.surname, e.id_number,
             ltype.name AS leave_type_name, ltype.code AS leave_type_code, ltype.calendar_color,
             u.username AS created_by_name
      FROM leave_adjustments la
      JOIN employees e ON la.employee_id = e.id
      JOIN leave_type ltype ON la.leave_type_id = ltype.id
      LEFT JOIN users u ON la.created_by = u.id
      WHERE ${conds.join(' AND ')} ORDER BY la.created_at DESC LIMIT 500
    `, params);
    res.json({ success: true, data: r.rows });
  } catch (err) { next(err); }
});

router.post('/adjustments', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const { employee_id, leave_type_id, adjustment_type, adjustment_days, effective_date, reason } = req.body || {};
    if (!employee_id || !leave_type_id || !adjustment_type || adjustment_days == null || !effective_date) {
      return res.status(400).json({ success: false, error: { message: 'employee_id, leave_type_id, adjustment_type, adjustment_days and effective_date are required' } });
    }
    if (!['OPENING_BALANCE','ADJUSTED','ENCASHED','ACCRUED','FORFEITED'].includes(adjustment_type)) {
      return res.status(400).json({ success: false, error: { message: 'adjustment_type must be OPENING_BALANCE, ADJUSTED, ENCASHED, ACCRUED or FORFEITED' } });
    }
    const emp = await dbQuery(`SELECT leave_scheme_id, gender FROM employees WHERE id = $1`, [employee_id]);
    if (!emp.rows.length) return res.status(404).json({ success: false, error: { message: 'Employee not found' } });
    const { leave_scheme_id, gender: adjEmpGender } = emp.rows[0];
    if (!leave_scheme_id) {
      return res.status(400).json({ success: false, error: { message: 'Employee has no leave scheme assigned' } });
    }
    const sc = await dbQuery(`
      SELECT lt.id, lt.max_accumulation, lt.gender_restriction, lt.requires_document, lt.document_required_after_days
      FROM leave_scheme_leave_type lslt JOIN leave_type lt ON lslt.leave_type_id = lt.id
      WHERE lslt.leave_scheme_id = $1 AND lt.id = $2 AND lslt.deleted_at IS NULL AND lt.deleted_at IS NULL
    `, [leave_scheme_id, leave_type_id]);
    if (!sc.rows.length) {
      return res.status(400).json({ success: false, error: { message: "Selected leave type is not in employee's leave scheme" } });
    }
    const adjLtRow = sc.rows[0];
    if (adjLtRow.gender_restriction && adjEmpGender && adjLtRow.gender_restriction !== adjEmpGender) {
      return res.status(400).json({ success: false, error: { message: `This leave type is restricted to ${adjLtRow.gender_restriction === 'M' ? 'male' : 'female'} employees` } });
    }
    const { document_base64: adj_doc_base64, document_filename: adj_doc_filename } = req.body || {};
    if (adjLtRow.requires_document && !adjLtRow.document_required_after_days) {
      if (!adj_doc_base64) {
        return res.status(400).json({ success: false, error: { message: 'This leave type requires supporting documentation for all adjustments.' } });
      }
    }
    let obWarning = null;
    if (adjustment_type === 'OPENING_BALANCE') {
      const priorOb = await dbQuery(
        `SELECT COUNT(*) AS cnt FROM leave_adjustments WHERE employee_id=$1 AND leave_type_id=$2 AND adjustment_type='OPENING_BALANCE' AND status='APPROVED'`,
        [employee_id, leave_type_id]
      );
      if (parseInt(priorOb.rows[0].cnt) > 0) {
        obWarning = `An approved opening balance already exists for this leave type. This new adjustment will be recorded in addition to the existing balance.`;
      }
    }
    if (adjLtRow.max_accumulation && parseFloat(adjustment_days) > 0 && ['OPENING_BALANCE', 'ADJUSTED', 'ACCRUED'].includes(adjustment_type)) {
      const [curAdjRow, curTakenRow] = await Promise.all([
        dbQuery(`SELECT COALESCE(SUM(CASE WHEN adjustment_type IN ('OPENING_BALANCE','ADJUSTED','ACCRUED') THEN adjustment_days ELSE -adjustment_days END),0) AS bal
                 FROM leave_adjustments WHERE employee_id=$1 AND leave_type_id=$2 AND status='APPROVED'`, [employee_id, leave_type_id]),
        dbQuery(`SELECT COALESCE(SUM(days),0) AS taken FROM leave_transactions WHERE employee_id=$1 AND leave_type_id=$2 AND status='APPROVED'`, [employee_id, leave_type_id])
      ]);
      const currentBalance = parseFloat(curAdjRow.rows[0].bal || 0) - parseFloat(curTakenRow.rows[0].taken || 0);
      const newBalance = currentBalance + parseFloat(adjustment_days);
      if (newBalance > parseFloat(adjLtRow.max_accumulation)) {
        return res.status(400).json({ success: false, error: {
          message: `Adjustment would exceed the maximum accumulation of ${parseFloat(adjLtRow.max_accumulation).toFixed(2)} days for this leave type. Current balance: ${currentBalance.toFixed(2)} days, proposed adjustment: +${parseFloat(adjustment_days).toFixed(2)} days.`
        }});
      }
    }
    let adj_document_path = null;
    if (adj_doc_base64 && adj_doc_filename) {
      try {
        const uploadsDir = path.join(__dirname, '../../public/uploads/leave');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        const safeFilename = `${Date.now()}-${path.basename(String(adj_doc_filename)).replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        fs.writeFileSync(path.join(uploadsDir, safeFilename), Buffer.from(adj_doc_base64, 'base64'));
        adj_document_path = `uploads/leave/${safeFilename}`;
      } catch (fileErr) { console.warn('Leave adj file save error:', fileErr.message); }
    }
    const refNo = 'LA-' + Date.now().toString(36).toUpperCase().slice(-6) + Math.random().toString(36).slice(2,6).toUpperCase();
    const ins = await dbQuery(
      `INSERT INTO leave_adjustments (employee_id, leave_type_id, adjustment_type, adjustment_days, effective_date, reason, status, reference_no, document_path, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,'PENDING',$7,$8,$9) RETURNING *`,
      [employee_id, leave_type_id, adjustment_type, parseFloat(adjustment_days), effective_date, reason || null, refNo, adj_document_path, userId]);
    const { writeHistory, checkAutoApprove } = require('../services/transaction-approval.service');
    await writeHistory('LEAVE_ADJUSTMENT', ins.rows[0].id, 'SUBMITTED', userId, null, null, 'PENDING');
    try {
      const auto = await checkAutoApprove('LEAVE_ADJUSTMENT', ins.rows[0].id, userId, parseInt(employee_id));
      if (auto) {
        const upd = await dbQuery('SELECT * FROM leave_adjustments WHERE id = $1', [ins.rows[0].id]);
        return res.status(201).json({ success: true, data: upd.rows[0], message: 'Leave adjustment auto-approved.', ...(obWarning ? { warning: obWarning } : {}) });
      }
    } catch (wfErr) { console.warn('Workflow init warning LEAVE_ADJUSTMENT', ins.rows[0].id, ':', wfErr.message); }
    res.status(201).json({ success: true, data: ins.rows[0], ...(obWarning ? { warning: obWarning } : {}) });
  } catch (err) { next(err); }
});

router.post('/adjustments/bulk-approve', authenticate, async (req, res, next) => {
  try {
    const { ids, comments } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, error: { message: 'ids array is required' } });
    const { handleApproval } = require('../services/transaction-approval.service');
    const results = [];
    for (const id of ids) {
      try {
        const r = await handleApproval('LEAVE_ADJUSTMENT', parseInt(id), req.user?.id, req.user?.roles || [], comments || null);
        results.push({ id, success: r.success });
      } catch (e) { results.push({ id, success: false, error: e.message }); }
    }
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

router.post('/adjustments/bulk-reject', authenticate, async (req, res, next) => {
  try {
    const { ids, comments } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, error: { message: 'ids array is required' } });
    if (!comments?.trim()) return res.status(400).json({ success: false, error: { message: 'comments required for bulk rejection' } });
    const { handleRejection } = require('../services/transaction-approval.service');
    const results = [];
    for (const id of ids) {
      try {
        const r = await handleRejection('LEAVE_ADJUSTMENT', parseInt(id), req.user?.id, req.user?.roles || [], comments);
        results.push({ id, success: r.success });
      } catch (e) { results.push({ id, success: false, error: e.message }); }
    }
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

router.get('/adjustments/:id', authenticate, async (req, res, next) => {
  try {
    const r = await dbQuery(`
      SELECT la.*, e.employee_code, e.first_name, e.surname, e.id_number,
             ltype.name AS leave_type_name, ltype.code AS leave_type_code, u.username AS created_by_name
      FROM leave_adjustments la
      JOIN employees e ON la.employee_id = e.id
      JOIN leave_type ltype ON la.leave_type_id = ltype.id
      LEFT JOIN users u ON la.created_by = u.id
      WHERE la.id = $1`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ success: false, error: { message: 'Leave adjustment not found' } });
    res.json({ success: true, data: r.rows[0] });
  } catch (err) { next(err); }
});

router.get('/adjustments/:id/can-approve', authenticate, async (req, res, next) => {
  try {
    const adj = await dbQuery(`SELECT status, created_by FROM leave_adjustments WHERE id = $1`, [req.params.id]);
    if (!adj.rows.length) return res.status(404).json({ success: false, error: { message: 'Leave adjustment not found' } });
    if (adj.rows[0].status !== 'PENDING') return res.json({ success: true, data: { canApprove: false, reason: 'Not pending' } });
    const result = await canApproveForModule('LEAVE_ADJUSTMENT', req.user?.id, req.user?.roles || []);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.patch('/adjustments/:id/approve', authenticate, async (req, res, next) => {
  try {
    const { handleApproval } = require('../services/transaction-approval.service');
    const result = await handleApproval('LEAVE_ADJUSTMENT', parseInt(req.params.id), req.user?.id, req.user?.roles || [], req.body?.comments || null);
    if (!result.success) return res.status(result.status || 400).json(result);
    res.json(result);
  } catch (err) { next(err); }
});

router.patch('/adjustments/:id/reject', authenticate, async (req, res, next) => {
  try {
    const { handleRejection } = require('../services/transaction-approval.service');
    const result = await handleRejection('LEAVE_ADJUSTMENT', parseInt(req.params.id), req.user?.id, req.user?.roles || [], req.body?.comments || null);
    if (!result.success) return res.status(result.status || 400).json(result);
    res.json(result);
  } catch (err) { next(err); }
});

router.patch('/adjustments/:id/return', authenticate, async (req, res, next) => {
  try {
    const { handleReturn } = require('../services/transaction-approval.service');
    const result = await handleReturn('LEAVE_ADJUSTMENT', parseInt(req.params.id), req.user?.id, req.user?.roles || [], req.body?.comments || null);
    if (!result.success) return res.status(result.status || 400).json(result);
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/adjustments/:id/history', authenticate, async (req, res, next) => {
  try {
    const r = await dbQuery(`
      SELECT h.*, u.username AS performed_by_name FROM leave_adjustment_history h
      LEFT JOIN users u ON h.performed_by = u.id
      WHERE h.leave_adjustment_id = $1 ORDER BY h.performed_at ASC`, [req.params.id]);
    res.json({ success: true, data: r.rows });
  } catch (err) { next(err); }
});

// === Public Holidays ===

// Helper: generate statutory instances for a given year
async function generateHolidaysForYear(year, userId) {
  const yr = parseInt(year);
  const templates = await dbQuery(
    `SELECT * FROM holidays WHERE holiday_type = 'STATUTORY_FIXED' AND year IS NULL ORDER BY statutory_month, statutory_day`
  );
  const existing = await dbQuery(
    `SELECT name FROM holidays WHERE holiday_type = 'STATUTORY_FIXED' AND year = $1`, [yr]
  );
  const existSet = new Set(existing.rows.map(r => r.name));
  let inserted = 0;
  for (const t of templates.rows) {
    if (existSet.has(t.name)) continue;
    const pad = (n) => String(n).padStart(2, '0');
    const statutory = new Date(yr, t.statutory_month - 1, t.statutory_day);
    const isShifted = statutory.getDay() === 0;
    const observed = isShifted ? new Date(yr, t.statutory_month - 1, t.statutory_day + 1) : statutory;
    const observedStr = `${yr}-${pad(observed.getMonth() + 1)}-${pad(observed.getDate())}`;
    await dbQuery(
      `INSERT INTO holidays (name, holiday_date, recurring, enabled, holiday_type, auto_shift_sunday,
         statutory_month, statutory_day, year, is_observed, notes, created_at, updated_at)
       VALUES ($1,$2,TRUE,TRUE,'STATUTORY_FIXED',TRUE,$3,$4,$5,$6,$7,NOW(),NOW())`,
      [t.name, observedStr, t.statutory_month, t.statutory_day, yr, isShifted, t.notes || null]
    );
    inserted++;
  }
  return inserted;
}

router.get('/public-holidays', authenticate, async (req, res, next) => {
  try {
    const year = req.query.year ? parseInt(req.query.year) : null;
    if (year) {
      const r = await dbQuery(
        `SELECT id, name, holiday_date, recurring, enabled, holiday_type, auto_shift_sunday,
                year, is_observed, statutory_month, statutory_day, notes, created_at, updated_at
         FROM holidays
         WHERE year = $1
         ORDER BY holiday_date ASC, name ASC`,
        [year]
      );
      res.json({ success: true, data: r.rows });
    } else {
      // Return templates
      const r = await dbQuery(
        `SELECT id, name, holiday_date, recurring, enabled, holiday_type, auto_shift_sunday,
                year, is_observed, statutory_month, statutory_day, notes, created_at, updated_at
         FROM holidays
         WHERE year IS NULL AND holiday_type = 'STATUTORY_FIXED'
         ORDER BY statutory_month, statutory_day`
      );
      res.json({ success: true, data: r.rows });
    }
  } catch (err) { next(err); }
});

router.get('/public-holidays/years', authenticate, async (req, res, next) => {
  try {
    const r = await dbQuery(`SELECT DISTINCT year FROM holidays WHERE year IS NOT NULL ORDER BY year ASC`);
    res.json({ success: true, data: r.rows.map(row => row.year) });
  } catch (err) { next(err); }
});

router.post('/public-holidays/generate/:year', authenticate, async (req, res, next) => {
  try {
    const yr = parseInt(req.params.year);
    if (!yr || yr < 2000 || yr > 2100) return res.status(400).json({ success: false, error: { message: 'Invalid year' } });
    const inserted = await generateHolidaysForYear(yr, req.user?.id);
    res.json({ success: true, data: { year: yr, inserted } });
  } catch (err) { next(err); }
});

router.post('/public-holidays', authenticate, auditLog('CREATE', 'holidays'), async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const b = req.body || {};
    if (!b.name || !b.holiday_date) {
      return res.status(400).json({ success: false, error: { message: 'name and holiday_date required' } });
    }
    const dt = new Date(b.holiday_date);
    if (isNaN(dt.getTime())) return res.status(400).json({ success: false, error: { message: 'Invalid holiday_date' } });
    const year = dt.getFullYear();
    const r = await dbQuery(
      `INSERT INTO holidays (name, holiday_date, recurring, enabled, holiday_type, auto_shift_sunday,
         statutory_month, statutory_day, year, is_observed, notes, created_at, updated_at)
       VALUES ($1,$2,FALSE,TRUE,'AD_HOC',FALSE,$3,$4,$5,FALSE,$6,NOW(),NOW()) RETURNING *`,
      [b.name.trim(), b.holiday_date, dt.getMonth() + 1, dt.getDate(), year, b.notes || null]
    );
    res.json({ success: true, data: r.rows[0] });
  } catch (err) { next(err); }
});

router.put('/public-holidays/:id', authenticate, auditLog('UPDATE', 'holidays'), async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const b = req.body || {};
    const existing = await dbQuery(`SELECT * FROM holidays WHERE id = $1`, [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ success: false, error: { message: 'Holiday not found' } });
    const row = existing.rows[0];
    let newDate = row.holiday_date;
    let newYear = row.year;
    let newMonth = row.statutory_month;
    let newDay = row.statutory_day;
    if (b.holiday_date !== undefined && row.holiday_type === 'AD_HOC') {
      const dt = new Date(b.holiday_date);
      if (isNaN(dt.getTime())) return res.status(400).json({ success: false, error: { message: 'Invalid holiday_date' } });
      newDate = b.holiday_date;
      newYear = dt.getFullYear();
      newMonth = dt.getMonth() + 1;
      newDay = dt.getDate();
    }
    const r = await dbQuery(
      `UPDATE holidays SET
         name = COALESCE($1, name),
         enabled = COALESCE($2, enabled),
         holiday_date = $3,
         year = $4,
         statutory_month = $5,
         statutory_day = $6,
         notes = $7,
         updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [
        b.name ? b.name.trim() : row.name,
        b.enabled !== undefined ? b.enabled : row.enabled,
        newDate, newYear, newMonth, newDay,
        b.notes !== undefined ? b.notes : row.notes,
        req.params.id
      ]
    );
    res.json({ success: true, data: r.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/public-holidays/:id', authenticate, auditLog('DELETE', 'holidays'), async (req, res, next) => {
  try {
    const existing = await dbQuery(`SELECT holiday_type, year FROM holidays WHERE id = $1`, [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ success: false, error: { message: 'Holiday not found' } });
    if (existing.rows[0].holiday_type !== 'AD_HOC') {
      return res.status(409).json({ success: false, error: { message: 'Cannot delete a statutory holiday. Only ad-hoc holidays may be deleted.' } });
    }
    await dbQuery(`DELETE FROM holidays WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// === Leave Calendar ===
router.get('/calendar', authenticate, async (req, res, next) => {
  try {
    const { date_from, date_to, department_id, division_id } = req.query;
    if (!date_from || !date_to) {
      return res.status(400).json({ success: false, error: { message: 'date_from and date_to are required' } });
    }
    const conds = [`lt.status = 'APPROVED'`, `lt.start_date <= $1`, `lt.end_date >= $2`];
    const params = [date_to, date_from];
    if (department_id) {
      params.push(department_id);
      conds.push(`p.department_id = $${params.length}`);
    }
    if (division_id) {
      params.push(division_id);
      conds.push(`p.division_id = $${params.length}`);
    }
    const joinClause = (department_id || division_id)
      ? `LEFT JOIN positions p ON e.position_id = p.id`
      : '';
    const r = await dbQuery(`
      SELECT lt.id, lt.employee_id, lt.leave_type_id, lt.start_date, lt.end_date, lt.days,
             lt.reference_no, lt.status,
             e.id AS emp_id, e.employee_code, e.first_name, e.surname,
             ltype.name AS leave_type_name, ltype.code AS leave_type_code,
             ltype.calendar_color
      FROM leave_transactions lt
      JOIN employees e ON lt.employee_id = e.id
      JOIN leave_type ltype ON lt.leave_type_id = ltype.id
      ${joinClause}
      WHERE ${conds.join(' AND ')}
      ORDER BY lt.start_date ASC, e.surname ASC, e.first_name ASC
    `, params);
    res.json({ success: true, data: r.rows });
  } catch (err) { next(err); }
});

module.exports = router;
