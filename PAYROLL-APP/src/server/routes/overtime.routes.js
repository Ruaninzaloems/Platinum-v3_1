const express = require('express');
const router = express.Router();
const { query: dbQuery, getClient } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');
const { paginationMiddleware } = require('../middleware/validation');
const { handleApproval, handleRejection, handleReturn, writeHistory, checkAutoApprove, getWorkflowStatusBatch } = require('../services/transaction-approval.service');
const { calculateOvertimeAmount, resolveOvertimePeriod } = require('../services/overtime-calc.service');

const EXTERNAL_API_BASE = 'https://nicki-unrecuperated-counteractively.ngrok-free.dev';

// SA municipal financial year runs 1 July - 30 June. Returns "YYYY/YYYY".
// Uses today when no date supplied (or when the supplied date is unparseable).
function getFinYearForDate(dateInput) {
  let d;
  if (dateInput) {
    d = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
    if (isNaN(d.getTime())) d = new Date();
  } else {
    d = new Date();
  }
  const year = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
  return `${year}/${year + 1}`;
}

// Resolve the default debit-side SCOA Item for an overtime line, mirroring the
// trial-balance rules in payroll.routes.js -> allocateDebitScoa:
//   employee_type_id IN (1,2,3,7)  -> payroll_gl_items.scoa_item_id_permanent_staff
//   employee_type_id = 6            -> payroll_gl_items.scoa_item_id_post_retirement
//                                      (skipped when earning_not_applicable_post_retirement = TRUE)
//   anything else                   -> null (unresolved)
// fin_year is derived from the overtime_date (fin year of the overtime event),
// not from the GL row, so cross-year captures filter the picker correctly.
async function resolveOvertimeDebitScoa(employeeId, salaryHeadId, overtimeDate) {
  if (!employeeId || !salaryHeadId) return null;
  const finYear = getFinYearForDate(overtimeDate);

  const empRes = await dbQuery('SELECT employee_type_id FROM employees WHERE id = $1', [employeeId]);
  if (empRes.rows.length === 0) return null;
  const empTypeId = empRes.rows[0].employee_type_id;

  const glRes = await dbQuery(
    `SELECT scoa_item_id_permanent_staff, scoa_item_id_post_retirement,
            earning_not_applicable_post_retirement
     FROM payroll_gl_items
     WHERE salary_head_id = $1
     ORDER BY (CASE WHEN end_date IS NULL THEN 1 ELSE 0 END) DESC, end_date DESC NULLS LAST, id DESC
     LIMIT 1`,
    [salaryHeadId]
  );
  if (glRes.rows.length === 0) return null;
  const gl = glRes.rows[0];

  let scoaItemId = null;
  if ([1, 2, 3, 7].includes(empTypeId)) {
    scoaItemId = gl.scoa_item_id_permanent_staff || null;
  } else if (empTypeId === 6) {
    if (!gl.earning_not_applicable_post_retirement) {
      scoaItemId = gl.scoa_item_id_post_retirement || null;
    }
  }

  if (!scoaItemId) return { scoa_item_id: null, scoa_code: null, scoa_description: null, fin_year: finYear };

  const itemRes = await dbQuery('SELECT id, code, description FROM scoa_items WHERE id = $1', [scoaItemId]);
  if (itemRes.rows.length === 0) {
    return { scoa_item_id: scoaItemId, scoa_code: null, scoa_description: null, fin_year: finYear };
  }
  return {
    scoa_item_id: itemRes.rows[0].id,
    scoa_code: itemRes.rows[0].code,
    scoa_description: itemRes.rows[0].description,
    fin_year: finYear
  };
}

// Strict validation that the chosen Plan Project Item exists in the external
// lookup for the resolved SCOA Item + financial year.
// Returns true only on positive confirmation; false on missing inputs, malformed
// response, or external API unavailability — the task requires that override
// saves be rejected unless the picker entry is confirmed.
async function validatePlanProjectItem(planProjectItemId, scoaItemId, finYear) {
  if (!planProjectItemId || !scoaItemId || !finYear) return false;
  try {
    const url = `${EXTERNAL_API_BASE}/planning/references/scoa-items/${encodeURIComponent(scoaItemId)}/project-items?Finyear=${encodeURIComponent(finYear)}`;
    const resp = await fetch(url, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
      signal: AbortSignal.timeout(5000)
    });
    if (!resp.ok) return false;
    const data = await resp.json();
    if (!Array.isArray(data)) return false;
    const target = Number(planProjectItemId);
    return data.some(item => Number(item.planProjectItemId) === target);
  } catch {
    return false;
  }
}

router.get('/scoa-resolution', authenticate, async (req, res, next) => {
  try {
    const employeeId = parseInt(req.query.employee_id, 10);
    const salaryHeadId = parseInt(req.query.salary_head_id, 10);
    const overtimeDate = req.query.overtime_date || null;
    if (!employeeId || !salaryHeadId) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'employee_id and salary_head_id are required' } });
    }
    const resolved = await resolveOvertimeDebitScoa(employeeId, salaryHeadId, overtimeDate);
    res.json({ success: true, data: resolved });
  } catch (err) { next(err); }
});

router.get('/salary-heads', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT id, code, name, overtime_multiplier_rate
       FROM salary_heads
       WHERE is_overtime = TRUE AND transaction_type = 'EARNING' AND irp5_code = '3607'
       ORDER BY name`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/employee-salary-heads/:employeeId', authenticate, async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    if (!employeeId) return res.status(400).json({ success: false, message: 'employeeId is required' });

    const emp = await dbQuery(
      'SELECT id, allow_overtime, annual_salary, working_hours_per_day FROM employees WHERE id = $1',
      [employeeId]
    );
    if (emp.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } });
    }

    const employee = emp.rows[0];
    const allowOvertime = employee.allow_overtime !== false;
    const annualSalary = parseFloat(employee.annual_salary) || 0;
    const workHoursPerDay = parseFloat(employee.working_hours_per_day) || 8;
    let hourlyRate = 0;
    if (annualSalary > 0 && workHoursPerDay > 0) {
      const monthlyWorkingHours = workHoursPerDay * (260 / 12);
      hourlyRate = parseFloat((annualSalary / 12 / monthlyWorkingHours).toFixed(4));
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
         AND sh.is_overtime = TRUE
         AND sh.transaction_type = 'EARNING'
         AND sh.irp5_code = '3607'`, [employeeId]
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
           AND sh.is_overtime = TRUE
           AND sh.transaction_type = 'EARNING'
           AND sh.irp5_code = '3607'`, [stgId]
      );
      stgRows.rows.forEach(r => allowedHeadIds.add(r.salary_head_id));
    }

    let result;
    if (allowedHeadIds.size > 0) {
      const ids = Array.from(allowedHeadIds);
      const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
      result = await dbQuery(
        `SELECT id, code, name, overtime_multiplier_rate
         FROM salary_heads
         WHERE id IN (${placeholders})
         ORDER BY code`, ids
      );
    } else {
      result = { rows: [] };
    }

    res.json({
      success: true,
      data: {
        allowOvertime,
        annualSalary,
        hourlyRate,
        workHoursPerDay,
        salaryHeads: result.rows
      }
    });
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
      whereClause += ` AND ot.status = 'PROCESSED'`;
    } else {
      whereClause += ` AND ot.status != 'PROCESSED'`;
      if (status) {
        whereClause += ` AND ot.status = $${pi}`;
        params.push(status.toUpperCase());
        pi++;
      }
    }

    if (employee_id) {
      whereClause += ` AND ot.employee_id = $${pi}`;
      params.push(parseInt(employee_id, 10));
      pi++;
    }
    if (salary_head_id) {
      whereClause += ` AND ot.salary_head_id = $${pi}`;
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

    const joinClause = `FROM overtime_transactions ot
       JOIN employees e ON ot.employee_id = e.id
       LEFT JOIN positions p ON e.position_id = p.id`;

    const countResult = await dbQuery(
      `SELECT COUNT(*) ${joinClause} ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await dbQuery(
      `SELECT ot.*, e.first_name, e.surname, e.employee_code,
              sh.name AS salary_head_name, sh.code AS salary_head_code, sh.overtime_multiplier_rate AS head_multiplier,
              pp.period_number AS period_name, pc.name AS cycle_name,
              ot.override_project, ot.plan_project_item_id
       ${joinClause}
       JOIN salary_heads sh ON ot.salary_head_id = sh.id
       LEFT JOIN payroll_periods pp ON ot.period_id = pp.id
       LEFT JOIN payroll_cycles pc ON ot.cycle_id = pc.id
       ${whereClause}
       ORDER BY ot.created_at DESC
       LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, pagination.limit, pagination.offset]
    );

    if (tab !== 'processed' && result.rows.length > 0) {
      const pendingIds = result.rows.filter(r => r.status === 'PENDING').map(r => r.id);
      if (pendingIds.length > 0) {
        const wfMap = await getWorkflowStatusBatch('OVERTIME', pendingIds);
        for (const row of result.rows) {
          const wf = wfMap[row.id];
          if (wf) {
            row.workflow_level = wf.currentStep;
            row.workflow_total = wf.totalSteps;
          }
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

    const otDefinitions = await dbQuery(
      `SELECT steps FROM workflow_definitions WHERE entity_type = 'OVERTIME' AND enabled = TRUE`
    );

    if (otDefinitions.rows.length === 0) {
      return res.json({ success: true, data: { canApprove: true } });
    }

    for (const def of otDefinitions.rows) {
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
      `SELECT ot.*, e.first_name, e.surname, e.employee_code, e.annual_salary,
              sh.name AS salary_head_name, sh.code AS salary_head_code, sh.overtime_multiplier_rate AS head_multiplier,
              pp.period_number AS period_name, pc.name AS cycle_name
       FROM overtime_transactions ot
       JOIN employees e ON ot.employee_id = e.id
       JOIN salary_heads sh ON ot.salary_head_id = sh.id
       LEFT JOIN payroll_periods pp ON ot.period_id = pp.id
       LEFT JOIN payroll_cycles pc ON ot.cycle_id = pc.id
       WHERE ot.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Overtime transaction not found' } });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/:id/history', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT h.*, u.username AS performed_by_name
       FROM overtime_transaction_history h
       LEFT JOIN users u ON h.performed_by = u.id
       WHERE h.overtime_transaction_id = $1
       ORDER BY h.performed_at ASC`,
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/', authenticate, auditLog('CREATE', 'overtime_transaction'), async (req, res, next) => {
  try {
    const { employee_id, salary_head_id, overtime_date, hours, start_time, end_time, reference_no, notes, period_id: bodyPeriodId, cycle_id: bodyCycleId, override_project, plan_project_item_id } = req.body;

    if (!employee_id || !salary_head_id || !overtime_date) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'employee_id, salary_head_id, and overtime_date are required' } });
    }

    const eligCheck = await dbQuery('SELECT allow_overtime FROM employees WHERE id = $1', [employee_id]);
    if (eligCheck.rows.length > 0 && eligCheck.rows[0].allow_overtime === false) {
      return res.status(400).json({ success: false, error: { code: 'NOT_ELIGIBLE', message: 'This employee is not eligible for overtime' } });
    }

    let finalHours = parseFloat(hours) || 0;
    if (!hours && start_time && end_time) {
      const [sh, sm] = start_time.split(':').map(Number);
      const [eh, em] = end_time.split(':').map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60;
      finalHours = parseFloat((diff / 60).toFixed(2));
    }

    if (finalHours <= 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'Hours must be greater than 0' } });
    }

    let calcResult;
    try {
      calcResult = await calculateOvertimeAmount(employee_id, salary_head_id, finalHours);
    } catch (calcErr) {
      return res.status(calcErr.status || 400).json({ success: false, error: { code: calcErr.code, message: calcErr.message } });
    }

    const isOverride = override_project === true || override_project === 'true';
    let ppidToStore = null;
    if (isOverride) {
      const ppid = parseInt(plan_project_item_id, 10);
      if (!ppid || ppid <= 0) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'Plan Project Item is required when Override Project is ticked' } });
      }
      const resolved = await resolveOvertimeDebitScoa(employee_id, salary_head_id, overtime_date);
      if (!resolved || !resolved.scoa_item_id) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'Cannot override project: SCOA Item is not configured for this employee/overtime type combination' } });
      }
      const isValid = await validatePlanProjectItem(ppid, resolved.scoa_item_id, resolved.fin_year);
      if (!isValid) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'Selected Plan Project Item could not be confirmed against the lookup for this SCOA Item / financial year' } });
      }
      ppidToStore = ppid;
    }

    let periodId = bodyPeriodId ? parseInt(bodyPeriodId, 10) : null;
    let cycleId = bodyCycleId ? parseInt(bodyCycleId, 10) : null;
    if (!periodId) {
      const resolved = await resolveOvertimePeriod(overtime_date);
      periodId = resolved.period_id;
      cycleId = resolved.cycle_id;
    }

    const result = await dbQuery(
      `INSERT INTO overtime_transactions (employee_id, salary_head_id, overtime_date, hours, rate_multiplier, amount, start_time, end_time, reference_no, notes, period_id, cycle_id, override_project, plan_project_item_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [employee_id, salary_head_id, overtime_date, finalHours, calcResult.multiplier, calcResult.amount, start_time || null, end_time || null, reference_no || null, notes || null, periodId, cycleId, isOverride, ppidToStore, req.user?.id || 1]
    );

    const txId = result.rows[0].id;
    const userId = req.user?.id || 1;

    await writeHistory('OVERTIME', txId, 'SUBMITTED', userId, 'Overtime submitted', null, 'PENDING');

    const autoApproved = await checkAutoApprove('OVERTIME', txId, userId, employee_id);
    if (autoApproved) {
      const updated = await dbQuery('SELECT * FROM overtime_transactions WHERE id = $1', [txId]);
      return res.status(201).json({ success: true, data: updated.rows[0], message: 'Overtime auto-approved' });
    }

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const existing = await dbQuery('SELECT * FROM overtime_transactions WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Overtime transaction not found' } });
    }
    const userId = req.user?.id || 0;
    const userRole = req.user?.role || '';
    const isOwner = existing.rows[0].created_by === userId;
    const isPrivileged = ['admin', 'hr_mgr', 'payroll_admin'].includes(userRole);
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only edit your own overtime transactions' } });
    }
    if (existing.rows[0].status !== 'PENDING' && existing.rows[0].status !== 'RETURNED') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Only pending or returned overtime can be edited' } });
    }

    const empId = existing.rows[0].employee_id;
    const eligCheck = await dbQuery('SELECT allow_overtime FROM employees WHERE id = $1', [empId]);
    if (eligCheck.rows.length > 0 && eligCheck.rows[0].allow_overtime === false) {
      return res.status(400).json({ success: false, error: { code: 'NOT_ELIGIBLE', message: 'This employee is not eligible for overtime' } });
    }

    const { salary_head_id, overtime_date, hours, start_time, end_time, reference_no, notes, override_project, plan_project_item_id } = req.body;
    const headId = salary_head_id || existing.rows[0].salary_head_id;

    let finalHours = parseFloat(hours) || 0;
    if (!hours && start_time && end_time) {
      const [sh, sm] = start_time.split(':').map(Number);
      const [eh, em] = end_time.split(':').map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60;
      finalHours = parseFloat((diff / 60).toFixed(2));
    }
    if (!finalHours) finalHours = parseFloat(existing.rows[0].hours);

    let calcResult;
    try {
      calcResult = await calculateOvertimeAmount(empId, headId, finalHours);
    } catch (calcErr) {
      return res.status(calcErr.status || 400).json({ success: false, error: { code: calcErr.code, message: calcErr.message } });
    }

    const effectiveDate = overtime_date || existing.rows[0].overtime_date;
    const resolved = await resolveOvertimePeriod(effectiveDate);

    const wasReturned = existing.rows[0].status === 'RETURNED';

    const isOverride = override_project === true || override_project === 'true';
    let ppidToStore = null;
    if (isOverride) {
      const ppid = parseInt(plan_project_item_id, 10);
      if (!ppid || ppid <= 0) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'Plan Project Item is required when Override Project is ticked' } });
      }
      const scoaResolved = await resolveOvertimeDebitScoa(empId, headId, effectiveDate);
      if (!scoaResolved || !scoaResolved.scoa_item_id) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'Cannot override project: SCOA Item is not configured for this employee/overtime type combination' } });
      }
      const isValid = await validatePlanProjectItem(ppid, scoaResolved.scoa_item_id, scoaResolved.fin_year);
      if (!isValid) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'Selected Plan Project Item could not be confirmed against the lookup for this SCOA Item / financial year' } });
      }
      ppidToStore = ppid;
    }

    const result = await dbQuery(
      `UPDATE overtime_transactions
       SET salary_head_id = $1, overtime_date = $2, hours = $3, rate_multiplier = $4, amount = $5,
           start_time = $6, end_time = $7, reference_no = $8, notes = $9,
           period_id = $10, cycle_id = $11,
           override_project = $12, plan_project_item_id = $13,
           status = 'PENDING', updated_at = NOW()
       WHERE id = $14 RETURNING *`,
      [headId, effectiveDate, finalHours, calcResult.multiplier, calcResult.amount,
       start_time || null, end_time || null, reference_no ?? existing.rows[0].reference_no, notes ?? existing.rows[0].notes,
       resolved.period_id, resolved.cycle_id, isOverride, ppidToStore, req.params.id]
    );

    if (wasReturned) {
      await writeHistory('OVERTIME', parseInt(req.params.id), 'SUBMITTED', req.user?.id || 1, 'Resubmitted after correction', null, 'PENDING');
      const autoApproved = await checkAutoApprove('OVERTIME', parseInt(req.params.id), req.user?.id || 1, empId);
      if (autoApproved) {
        const updated = await dbQuery('SELECT * FROM overtime_transactions WHERE id = $1', [req.params.id]);
        return res.json({ success: true, data: updated.rows[0], message: 'Overtime resubmitted and auto-approved' });
      }
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const existing = await dbQuery('SELECT * FROM overtime_transactions WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Overtime transaction not found' } });
    }
    const userId = req.user?.id || 0;
    const userRole = req.user?.role || '';
    const isOwner = existing.rows[0].created_by === userId;
    const isPrivileged = ['admin', 'hr_mgr', 'payroll_admin'].includes(userRole);
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only delete your own overtime transactions' } });
    }
    if (existing.rows[0].status !== 'PENDING') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Only pending overtime can be deleted' } });
    }
    await dbQuery('DELETE FROM overtime_transaction_history WHERE overtime_transaction_id = $1', [req.params.id]);
    await dbQuery('DELETE FROM overtime_transactions WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Overtime transaction deleted' });
  } catch (err) { next(err); }
});

router.patch('/:id/approve', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });
    const result = await handleApproval('OVERTIME', parseInt(req.params.id), userId, req.user?.roles || [], req.body.comments || null);
    if (!result.success) {
      return res.status(result.status || 400).json({ success: false, error: { message: result.error } });
    }
    res.json({
      success: true,
      data: result.data,
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
    const result = await handleRejection('OVERTIME', parseInt(req.params.id), userId, req.user?.roles || [], req.body.comments);
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
    const result = await handleReturn('OVERTIME', parseInt(req.params.id), userId, req.user?.roles || [], req.body.comments);
    if (!result.success) {
      return res.status(result.status || 400).json({ success: false, error: { message: result.error } });
    }
    res.json({ success: true, data: result.data, message: result.message });
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
        const result = await handleApproval('OVERTIME', txId, userId, req.user?.roles || [], null);
        if (result.success) {
          if (result.finalApproval) { approvedCount++; } else { steppedCount++; }
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
        const result = await handleRejection('OVERTIME', txId, userId, req.user?.roles || [], comments.trim());
        if (result.success) { rejectedCount++; } else { failedCount++; failedIds.push(txId); }
      } catch (err) { failedCount++; failedIds.push(txId); }
    }

    res.json({
      success: failedCount === 0,
      data: { count: rejectedCount, rejected: rejectedCount, failed: failedCount, failedIds, total: ids.length },
      message: `${rejectedCount} transaction(s) rejected${failedCount ? ', ' + failedCount + ' failed' : ''}.`
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
        const result = await handleReturn('OVERTIME', txId, userId, req.user?.roles || [], comments.trim());
        if (result.success) { returnedCount++; } else { failedCount++; failedIds.push(txId); }
      } catch (err) { failedCount++; failedIds.push(txId); }
    }

    res.json({
      success: failedCount === 0,
      data: { count: returnedCount, returned: returnedCount, failed: failedCount, failedIds, total: ids.length },
      message: `${returnedCount} transaction(s) returned for correction${failedCount ? ', ' + failedCount + ' failed' : ''}.`
    });
  } catch (err) { next(err); }
});

module.exports = router;
