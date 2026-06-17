const express = require('express');
const router = express.Router();
const { query: dbQuery, getClient } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const essAuthorize = (req, res, next) => {
  const requestedId = parseInt(req.params.employeeId, 10);
  const userEmployeeId = Number(req.user?.employeeId);
  const userRoles = req.user?.roles || [];
  const isAdmin = userRoles.includes('admin');
  if (!isAdmin && userEmployeeId !== requestedId) {
    return res.status(403).json({ success: false, error: { message: 'You can only access your own data' } });
  }
  next();
};

function maskAccountNumberSafe(acc) {
  if (acc === null || acc === undefined) return null;
  const s = String(acc).trim();
  if (s.length === 0) return null;
  if (s.length <= 4) return '****';
  return '****' + s.slice(-4);
}

router.get('/me/banking', authenticate, async (req, res, next) => {
  try {
    const employeeId = Number(req.user?.employeeId);
    if (!employeeId) {
      return res.status(401).json({ success: false, error: { message: 'No employee linked to your account' } });
    }
    const result = await dbQuery(`
      SELECT e.id, e.bank_name, e.bank_branch_code, e.bank_account_type,
             e.bank_account_number, e.bank_account_holder, e.account_holder_relationship
      FROM employees e
      WHERE e.id = $1
    `, [employeeId]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Employee not found' } });
    const r = result.rows[0];
    res.json({
      success: true,
      data: {
        bank_name: r.bank_name || null,
        bank_branch_code: r.bank_branch_code || null,
        bank_account_type: r.bank_account_type || null,
        bank_account_number_masked: maskAccountNumberSafe(r.bank_account_number),
        bank_account_holder: r.bank_account_holder || null,
        account_holder_relationship: r.account_holder_relationship || null
      }
    });
  } catch (err) { next(err); }
});

router.post('/me/banking/report-issue', authenticate, async (req, res, next) => {
  try {
    const employeeId = Number(req.user?.employeeId);
    if (!employeeId) {
      return res.status(401).json({ success: false, error: { message: 'No employee linked to your account' } });
    }
    const { notes } = req.body || {};
    const empResult = await dbQuery(
      `SELECT id, employee_code, first_name, surname FROM employees WHERE id = $1`,
      [employeeId]
    );
    if (!empResult.rows.length) {
      return res.status(404).json({ success: false, error: { message: 'Employee not found' } });
    }
    const emp = empResult.rows[0];
    const empName = `${emp.first_name || ''} ${emp.surname || ''}`.trim();

    const recipients = await dbQuery(
      `SELECT DISTINCT u.id
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       JOIN roles r ON ur.role_id = r.id
       WHERE u.is_active = TRUE
         AND r.code IN ('admin','hr_manager','payroll_admin')`
    );

    const title = `Banking details correction request - ${emp.employee_code}`;
    const trimmedNotes = typeof notes === 'string' ? notes.trim().slice(0, 1000) : '';
    const message = `${empName} (${emp.employee_code}) reports their banking details on file are incorrect and need to be reviewed/updated.` +
      (trimmedNotes ? `\n\nEmployee notes: ${trimmedNotes}` : '');

    const notificationSvc = require('../services/notification.service');
    const recipientIds = recipients.rows.map(r => r.id);
    if (recipientIds.length > 0) {
      for (const uid of recipientIds) {
        try {
          await notificationSvc.createNotification({
            title,
            message,
            type: 'WARNING',
            category: 'BANKING',
            referenceType: 'employee',
            referenceId: emp.id,
            userId: uid,
          });
        } catch (e) { /* continue */ }
      }
    }

    await dbQuery(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, created_at)
       VALUES ($1, 'BANKING_ISSUE_REPORTED', 'employees', $2, $3, NOW())`,
      [req.user?.id || null, emp.id, JSON.stringify({ notes: trimmedNotes || null, recipients: recipientIds.length })]
    ).catch(() => {});

    return res.json({
      success: true,
      data: {
        recipients_notified: recipientIds.length,
        message: recipientIds.length > 0
          ? 'Your request has been sent to HR/Payroll.'
          : 'Your request has been logged. No HR/Payroll users are currently configured to receive it — please follow up directly.'
      }
    });
  } catch (err) { next(err); }
});

const ALLOWED_RELATIONSHIPS = ['SELF','SPOUSE','PARENT','SIBLING','CHILD','FRIEND','OTHER'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s]+$/;

function validatePhone(val) {
  if (val === null || val === undefined || val === '') return true;
  const s = String(val);
  if (!PHONE_REGEX.test(s)) return false;
  const digits = s.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

router.patch('/me/contact', authenticate, async (req, res, next) => {
  try {
    const employeeId = Number(req.user?.employeeId);
    if (!employeeId) {
      return res.status(401).json({ success: false, error: { message: 'No employee linked to your account' } });
    }

    const allowed = ['cell_number','home_number','work_number','email_address',
                     'emergency_contact_name','emergency_contact_phone','emergency_contact_relationship'];
    const updates = {};
    for (const k of allowed) {
      if (req.body && Object.prototype.hasOwnProperty.call(req.body, k)) {
        let v = req.body[k];
        if (typeof v === 'string') v = v.trim();
        updates[k] = v === '' ? null : v;
      }
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: { message: 'No editable fields supplied' } });
    }

    if ('email_address' in updates && updates.email_address && !EMAIL_REGEX.test(updates.email_address)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid email address format' } });
    }
    for (const k of ['cell_number','home_number','work_number','emergency_contact_phone']) {
      if (k in updates && !validatePhone(updates[k])) {
        return res.status(400).json({ success: false, error: { message: `Invalid phone number for ${k}: must be 7-15 digits, may include +, -, spaces` } });
      }
    }
    if ('emergency_contact_relationship' in updates && updates.emergency_contact_relationship &&
        !ALLOWED_RELATIONSHIPS.includes(updates.emergency_contact_relationship)) {
      return res.status(400).json({ success: false, error: { message: `Invalid relationship. Must be one of: ${ALLOWED_RELATIONSHIPS.join(', ')}` } });
    }

    const cols = Object.keys(updates);
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const currentRes = await client.query(
        `SELECT ${cols.join(', ')} FROM employees WHERE id = $1 FOR UPDATE`, [employeeId]
      );
      if (!currentRes.rows.length) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: { message: 'Employee not found' } });
      }
      const before = currentRes.rows[0];

      const oldDiff = {};
      const newDiff = {};
      const changedCols = [];
      for (const k of cols) {
        const oldVal = before[k] === undefined ? null : before[k];
        const newVal = updates[k];
        if ((oldVal || '') !== (newVal || '')) {
          oldDiff[k] = oldVal;
          newDiff[k] = newVal;
          changedCols.push(k);
        }
      }

      if (changedCols.length === 0) {
        await client.query('ROLLBACK');
        const safeRes = await dbQuery(
          `SELECT cell_number, home_number, work_number, email_address,
                  emergency_contact_name, emergency_contact_phone, emergency_contact_relationship
           FROM employees WHERE id = $1`, [employeeId]
        );
        return res.json({ success: true, data: safeRes.rows[0], changed: false });
      }

      const setClauses = changedCols.map((k, i) => `${k} = $${i + 2}`).join(', ');
      const values = [employeeId, ...changedCols.map(k => updates[k])];
      const updateRes = await client.query(
        `UPDATE employees SET ${setClauses}, updated_at = NOW() WHERE id = $1
         RETURNING cell_number, home_number, work_number, email_address,
                   emergency_contact_name, emergency_contact_phone, emergency_contact_relationship`,
        values
      );

      await client.query(
        `INSERT INTO audit_log (entity_type, entity_id, action, old_values, new_values,
                                user_id, username, ip_address, user_agent,
                                request_method, request_url, created_at)
         VALUES ('employee', $1, 'ESS_CONTACT_UPDATE', $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          employeeId,
          JSON.stringify(oldDiff),
          JSON.stringify(newDiff),
          req.user?.id || null,
          req.user?.username || null,
          req.ip || null,
          req.headers['user-agent'] || null,
          req.method,
          req.originalUrl,
        ]
      );

      await client.query('COMMIT');
      return res.json({ success: true, data: updateRes.rows[0], changed: true, changed_fields: changedCols });
    } catch (txErr) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) { next(err); }
});

router.get('/profile/:employeeId', authenticate, essAuthorize, async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const result = await dbQuery(`
      SELECT e.id, e.employee_code, e.title, e.first_name, e.surname, e.id_number,
             e.date_of_birth, e.gender, e.race, e.disability_status, e.nationality,
             e.email_address, e.cell_number, e.home_number, e.work_number,
             e.physical_address_1, e.physical_address_2, e.physical_city, e.physical_province, e.physical_postal_code,
             e.postal_address_1, e.postal_address_2, e.postal_city, e.postal_province, e.postal_code,
             e.income_tax_number, e.status, e.joining_date, e.photo_url, e.annual_salary,
             e.marital_status, e.dependants, e.language, e.known_as,
             COALESCE(p.division_id, e.division_id) AS division_id,
             p.department_id,
             e.emergency_contact_name, e.emergency_contact_phone, e.emergency_contact_relationship,
             p.title AS position_title, p.position_code,
             tg.grade_code, tg.grade_name,
             et.name AS employee_type_name
      FROM employees e
      LEFT JOIN positions p ON e.position_id = p.id
      LEFT JOIN task_grades tg ON e.task_grade_id = tg.id
      LEFT JOIN employee_types et ON e.employee_type_id = et.id
      WHERE e.id = $1
    `, [employeeId]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Employee not found' } });
    const { enrichSingle } = require('./department.routes');
    await enrichSingle(result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/payslips/:employeeId', authenticate, essAuthorize, async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const result = await dbQuery(`
      SELECT pr.id AS run_id, pr.run_type, pr.status, pr.payment_date,
             pp.period_number, pp.tax_year, pp.tax_period,
             pc.name AS cycle_name,
             COALESCE(SUM(CASE WHEN res.transaction_type = 'EARNING' THEN res.amount ELSE 0 END), 0) AS gross_pay,
             COALESCE(SUM(CASE WHEN res.transaction_type = 'DEDUCTION' THEN res.amount ELSE 0 END), 0) AS total_deductions,
             COALESCE(SUM(CASE WHEN res.transaction_type = 'EARNING' THEN res.amount ELSE 0 END), 0) -
             COALESCE(SUM(CASE WHEN res.transaction_type = 'DEDUCTION' THEN res.amount ELSE 0 END), 0) AS nett_pay
      FROM payroll_results res
      JOIN payroll_runs pr ON res.run_id = pr.id
      JOIN payroll_periods pp ON pr.period_id = pp.id
      JOIN payroll_cycles pc ON pr.cycle_id = pc.id
      WHERE res.employee_id = $1 AND pr.status IN ('COMPLETED','LOCKED','APPROVED')
      GROUP BY pr.id, pr.run_type, pr.status, pr.payment_date, pp.period_number, pp.tax_year, pp.tax_period, pc.name
      ORDER BY pp.tax_year DESC, pp.period_number DESC
      LIMIT 24
    `, [employeeId]);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/payslip-detail/:employeeId/:runId', authenticate, essAuthorize, async (req, res, next) => {
  try {
    const { employeeId, runId } = req.params;
    const result = await dbQuery(`
      SELECT res.id, res.transaction_type, res.amount,
             sh.name AS head_name, sh.code AS head_code
      FROM payroll_results res
      JOIN salary_heads sh ON res.salary_head_id = sh.id
      WHERE res.employee_id = $1 AND res.run_id = $2
      ORDER BY res.transaction_type, sh.name
    `, [employeeId, runId]);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/leave-balances/:employeeId', authenticate, essAuthorize, async (req, res, next) => {
  try {
    const empId = parseInt(req.params.employeeId);
    const emp = await dbQuery(`SELECT leave_scheme_id FROM employees WHERE id = $1`, [empId]);
    if (!emp.rows.length) return res.status(404).json({ success: false, error: { message: 'Employee not found' } });
    const { leave_scheme_id } = emp.rows[0];
    if (!leave_scheme_id) return res.json({ success: true, data: [] });
    const result = await dbQuery(`
      SELECT lt.id AS leave_type_id, lt.id,
             lt.name AS leave_type, lt.code,
             lt.calendar_color,
             COALESCE(adj_ob.days, 0)   AS opening_balance,
             COALESCE(adj_adj.days, 0)  AS adjusted_days,
             COALESCE(adj_enc.days, 0)  AS encashed_days,
             COALESCE(adj_acc.days, 0)  AS accrued,
             COALESCE(adj_forf.days, 0) AS forfeited,
             COALESCE(taken.days, 0)    AS taken,
             COALESCE(adj_ob.days, 0) + COALESCE(adj_adj.days, 0) + COALESCE(adj_acc.days, 0)
               - COALESCE(taken.days, 0) - COALESCE(adj_enc.days, 0) - COALESCE(adj_forf.days, 0) AS balance,
             NULL AS as_at_date
      FROM leave_scheme_leave_type lslt
      JOIN leave_type lt ON lslt.leave_type_id = lt.id
      LEFT JOIN (SELECT leave_type_id, SUM(adjustment_days) AS days FROM leave_adjustments
        WHERE employee_id=$1 AND status='APPROVED' AND adjustment_type='OPENING_BALANCE' GROUP BY leave_type_id
      ) adj_ob   ON adj_ob.leave_type_id   = lt.id
      LEFT JOIN (SELECT leave_type_id, SUM(adjustment_days) AS days FROM leave_adjustments
        WHERE employee_id=$1 AND status='APPROVED' AND adjustment_type='ADJUSTED' GROUP BY leave_type_id
      ) adj_adj  ON adj_adj.leave_type_id  = lt.id
      LEFT JOIN (SELECT leave_type_id, SUM(adjustment_days) AS days FROM leave_adjustments
        WHERE employee_id=$1 AND status='APPROVED' AND adjustment_type='ENCASHED' GROUP BY leave_type_id
      ) adj_enc  ON adj_enc.leave_type_id  = lt.id
      LEFT JOIN (SELECT leave_type_id, SUM(adjustment_days) AS days FROM leave_adjustments
        WHERE employee_id=$1 AND status='APPROVED' AND adjustment_type='ACCRUED' GROUP BY leave_type_id
      ) adj_acc  ON adj_acc.leave_type_id  = lt.id
      LEFT JOIN (SELECT leave_type_id, SUM(adjustment_days) AS days FROM leave_adjustments
        WHERE employee_id=$1 AND status='APPROVED' AND adjustment_type='FORFEITED' GROUP BY leave_type_id
      ) adj_forf ON adj_forf.leave_type_id = lt.id
      LEFT JOIN (SELECT leave_type_id, SUM(days) AS days FROM leave_transactions
        WHERE employee_id=$1 AND status='APPROVED' GROUP BY leave_type_id
      ) taken    ON taken.leave_type_id    = lt.id
      WHERE lslt.leave_scheme_id=$2 AND lslt.deleted_at IS NULL AND lt.deleted_at IS NULL
      ORDER BY lt.name
    `, [empId, leave_scheme_id]);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/leave-types/:employeeId', authenticate, essAuthorize, async (req, res, next) => {
  try {
    const empId = parseInt(req.params.employeeId);
    const emp = await dbQuery(`SELECT leave_scheme_id, gender FROM employees WHERE id = $1`, [empId]);
    if (!emp.rows.length) return res.status(404).json({ success: false, error: { message: 'Employee not found' } });
    const { leave_scheme_id, gender } = emp.rows[0];
    if (!leave_scheme_id) return res.json({ success: true, data: [] });
    const result = await dbQuery(`
      SELECT lt.id, lt.name, lt.code, lt.calendar_color, lt.base_type,
             lt.requires_document, lt.document_required_after_days, lt.max_negative_balance
      FROM leave_scheme_leave_type lslt
      JOIN leave_type lt ON lslt.leave_type_id = lt.id
      WHERE lslt.leave_scheme_id = $1 AND lslt.deleted_at IS NULL AND lt.deleted_at IS NULL
        AND (lt.gender_restriction IS NULL OR lt.gender_restriction = '' OR lt.gender_restriction = $2)
      ORDER BY lt.name
    `, [leave_scheme_id, gender || 'M']);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/leave-requests/:employeeId', authenticate, essAuthorize, async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const result = await dbQuery(`
      SELECT lt.id, lt.start_date, lt.end_date, lt.days AS days_requested, lt.status,
             lt.reason, lt.reference_no, lt.created_at,
             lty.name AS leave_type, lty.code, lty.calendar_color
      FROM leave_transactions lt
      JOIN leave_type lty ON lt.leave_type_id = lty.id
      WHERE lt.employee_id = $1
      ORDER BY lt.created_at DESC
      LIMIT 50
    `, [employeeId]);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/leave-request', authenticate, async (req, res, next) => {
  try {
    const { leave_type_id, start_date, end_date, reason } = req.body;
    const userId = req.user?.id;
    const employee_id = req.user?.employeeId;
    if (!employee_id) return res.status(401).json({ success: false, error: { message: 'No employee linked to your account' } });
    if (!leave_type_id || !start_date || !end_date) return res.status(400).json({ success: false, error: { message: 'Leave type, start date and end date are required' } });

    const emp = await dbQuery(`SELECT leave_scheme_id, gender FROM employees WHERE id = $1`, [employee_id]);
    if (!emp.rows.length) return res.status(404).json({ success: false, error: { message: 'Employee not found' } });
    const { leave_scheme_id, gender } = emp.rows[0];
    if (!leave_scheme_id) return res.status(400).json({ success: false, error: { message: 'Employee has no leave scheme assigned' } });

    const sc = await dbQuery(`
      SELECT lt.id, lt.base_type, lt.include_public_holidays, lt.max_negative_balance,
             lt.gender_restriction, lt.requires_document, lt.document_required_after_days
      FROM leave_scheme_leave_type lslt
      JOIN leave_type lt ON lslt.leave_type_id = lt.id
      WHERE lslt.leave_scheme_id = $1 AND lt.id = $2 AND lslt.deleted_at IS NULL AND lt.deleted_at IS NULL
    `, [leave_scheme_id, leave_type_id]);
    if (!sc.rows.length) return res.status(400).json({ success: false, error: { message: "Selected leave type is not in your leave scheme" } });
    const ltRow = sc.rows[0];
    if (ltRow.gender_restriction && gender && ltRow.gender_restriction !== gender) {
      return res.status(400).json({ success: false, error: { message: `This leave type is restricted to ${ltRow.gender_restriction === 'M' ? 'male' : 'female'} employees` } });
    }

    const { calculateWorkingDays } = require('../services/leave-engine.service');
    let requestDays;
    if (ltRow.base_type === 'WORKING_DAYS') {
      requestDays = await calculateWorkingDays(start_date, end_date, !ltRow.include_public_holidays, true);
    } else {
      requestDays = Math.round((new Date(end_date) - new Date(start_date)) / 86400000) + 1;
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
        message: `Insufficient leave balance. Available: ${available.toFixed(2)} days.`
      }});
    }

    const refNo = 'LR-' + Date.now().toString(36).toUpperCase().slice(-6) + Math.random().toString(36).slice(2,6).toUpperCase();
    const ins = await dbQuery(
      `INSERT INTO leave_transactions (employee_id, leave_type_id, start_date, end_date, days, reason, status, reference_no, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,'PENDING',$7,$8) RETURNING *`,
      [employee_id, leave_type_id, start_date, end_date, requestDays, reason || null, refNo, userId]);

    const { writeHistory, checkAutoApprove } = require('../services/transaction-approval.service');
    await writeHistory('LEAVE_REQUEST', ins.rows[0].id, 'SUBMITTED', userId, null, null, 'PENDING');
    try {
      const auto = await checkAutoApprove('LEAVE_REQUEST', ins.rows[0].id, userId, parseInt(employee_id));
      if (auto) {
        const upd = await dbQuery('SELECT * FROM leave_transactions WHERE id = $1', [ins.rows[0].id]);
        return res.status(201).json({ success: true, data: upd.rows[0], autoApproved: true });
      }
    } catch (wfErr) { console.warn('ESS leave workflow warning:', wfErr.message); }
    res.status(201).json({ success: true, data: ins.rows[0] });
  } catch (err) { next(err); }
});

router.get('/benefits/:employeeId', authenticate, essAuthorize, async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const [medical, retirement] = await Promise.all([
      dbQuery(`
        SELECT ema.id, ema.membership_number, ema.join_date, ema.is_current,
               mas.name AS scheme_name, mas.scheme_type
        FROM employee_medical_aid ema
        JOIN medical_aid_schemes mas ON ema.scheme_id = mas.id
        WHERE ema.employee_id = $1 AND ema.is_current = TRUE
      `, [employeeId]),
      dbQuery(`
        SELECT erf.id, erf.fund_number, erf.employee_amount, erf.employer_amount,
               erf.join_date, erf.is_current,
               rft.name AS fund_name, rft.fund_type, rft.fund_administrator AS administrator
        FROM employee_retirement_funds erf
        JOIN retirement_fund_types rft ON erf.fund_type_id = rft.id
        WHERE erf.employee_id = $1 AND erf.is_current = TRUE
      `, [employeeId]),
    ]);
    res.json({ success: true, data: { medical_aid: medical.rows, retirement_funds: retirement.rows } });
  } catch (err) { next(err); }
});

router.get('/documents/:employeeId', authenticate, essAuthorize, async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const result = await dbQuery(`
      SELECT id, document_name, document_type, file_path, file_size, mime_type, uploaded_at, version_number, notes
      FROM employee_documents
      WHERE employee_id = $1
      ORDER BY uploaded_at DESC
    `, [employeeId]);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/performance/:employeeId', authenticate, essAuthorize, async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const result = await dbQuery(`
      SELECT pi.id, pi.kpa, pi.kpi, pi.weighting, pi.annual_target,
             pi.q1_actual, pi.q2_actual, pi.q3_actual, pi.q4_actual,
             pi.score, pi.status, pi.created_at,
             pp.name AS period_name, pp.financial_year
      FROM performance_indicators pi
      JOIN performance_periods pp ON pi.period_id = pp.id
      WHERE pi.employee_id = $1
      ORDER BY pp.start_date DESC, pi.kpa
      LIMIT 50
    `, [employeeId]);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/dependants/:employeeId', authenticate, essAuthorize, async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const result = await dbQuery(`
      SELECT id, first_name, surname, id_number, date_of_birth, relationship, gender, disability, contact_number
      FROM employee_dependants
      WHERE employee_id = $1
      ORDER BY first_name
    `, [employeeId]);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/claims/:employeeId', authenticate, essAuthorize, async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const result = await dbQuery(`
      SELECT c.id, c.claim_type, c.sub_type, c.start_date, c.end_date,
             c.amount, c.kilometres, c.reason, c.reference_no, c.status,
             c.document_path, c.created_at,
             e.first_name, e.surname, e.employee_code
      FROM claims c
      JOIN employees e ON c.employee_id = e.id
      WHERE c.employee_id = $1
      ORDER BY c.created_at DESC
      LIMIT 100
    `, [employeeId]);

    const claimIds = result.rows.map(c => c.id);
    let returnReasons = {};
    if (claimIds.length > 0) {
      const histResult = await dbQuery(`
        SELECT DISTINCT ON (claim_id) claim_id, comments
        FROM claim_history
        WHERE claim_id = ANY($1) AND action = 'RETURNED'
        ORDER BY claim_id, performed_at DESC
      `, [claimIds]);
      histResult.rows.forEach(r => { returnReasons[r.claim_id] = r.comments; });
    }

    const data = result.rows.map(c => ({
      ...c,
      return_reason: returnReasons[c.id] || null
    }));

    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.post('/claims', authenticate, async (req, res, next) => {
  try {
    const { claim_type, sub_type, start_date, end_date, amount, kilometres, reason, reference_no } = req.body;
    const employee_id = req.user?.employeeId;
    if (!employee_id) {
      return res.status(401).json({ success: false, error: { message: 'Authentication required' } });
    }
    if (!claim_type || !start_date || !amount) {
      return res.status(400).json({ success: false, error: { message: 'claim_type, start_date, and amount are required' } });
    }
    if (claim_type === 'S_AND_T' && end_date && new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ success: false, error: { message: 'End date cannot be before start date' } });
    }
    if (claim_type === 'TRAVEL' && (!kilometres || parseFloat(kilometres) <= 0)) {
      return res.status(400).json({ success: false, error: { message: 'Kilometres must be greater than 0 for Travel claims' } });
    }
    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, error: { message: 'Amount must be greater than 0' } });
    }

    const { findDuplicateClaims } = require('./time.routes');
    if (findDuplicateClaims) {
      const duplicates = await findDuplicateClaims(employee_id, claim_type, start_date, end_date || null, null);
      if (duplicates.length > 0) {
        const conflictIds = duplicates.map(d => '#' + d.id).join(', ');
        return res.status(409).json({ success: false, error: { message: `Duplicate claim detected. Conflicting claim(s): ${conflictIds}.`, duplicates } });
      }
    }

    const userId = req.user?.id || employee_id;

    const client = await getClient();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `INSERT INTO claims (employee_id, claim_type, sub_type, start_date, end_date, amount, kilometres, reason, reference_no, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [employee_id, claim_type, sub_type, start_date, end_date || null, amount, kilometres || null, reason, reference_no || null, userId]
      );
      await client.query(
        `INSERT INTO claim_history (claim_id, action, performed_by, comments) VALUES ($1, 'SUBMITTED', $2, $3)`,
        [result.rows[0].id, userId, reason || null]
      );
      await client.query('COMMIT');
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) { next(err); }
});

router.patch('/claims/:id/resubmit', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const claim = await dbQuery('SELECT * FROM claims WHERE id = $1', [id]);
    if (!claim.rows.length) return res.status(404).json({ success: false, error: { message: 'Claim not found' } });
    if (claim.rows[0].status !== 'RETURNED') return res.status(400).json({ success: false, error: { message: 'Only returned claims can be resubmitted' } });

    const userEmployeeId = req.user?.employeeId;
    if (claim.rows[0].employee_id !== userEmployeeId) {
      return res.status(403).json({ success: false, error: { message: 'You can only resubmit your own claims' } });
    }

    const { claim_type, sub_type, start_date, end_date, amount, kilometres, reason, reference_no } = req.body;
    const userId = req.user?.id || userEmployeeId;

    const effectiveType = claim_type || claim.rows[0].claim_type;
    const effectiveStart = start_date || claim.rows[0].start_date;
    const effectiveEnd = end_date || (end_date === null ? null : claim.rows[0].end_date);
    const effectiveEmpId = claim.rows[0].employee_id;

    const { findDuplicateClaims } = require('./time.routes');
    if (findDuplicateClaims) {
      const duplicates = await findDuplicateClaims(effectiveEmpId, effectiveType, effectiveStart, effectiveEnd, parseInt(id, 10));
      if (duplicates.length > 0) {
        const conflictIds = duplicates.map(d => '#' + d.id).join(', ');
        return res.status(409).json({ success: false, error: { message: `Duplicate claim detected. Conflicting claim(s): ${conflictIds}.`, duplicates } });
      }
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `UPDATE claims SET claim_type = COALESCE($1, claim_type), sub_type = COALESCE($2, sub_type),
         start_date = COALESCE($3, start_date), end_date = $4, amount = COALESCE($5, amount),
         kilometres = $6, reason = $7, reference_no = $8,
         status = 'PENDING', approved_by = NULL, approved_at = NULL, updated_at = NOW()
         WHERE id = $9 RETURNING *`,
        [claim_type, sub_type, start_date, end_date || null, amount, kilometres || null, reason || null, reference_no || null, id]
      );
      await client.query(
        `INSERT INTO claim_history (claim_id, action, performed_by, comments) VALUES ($1, 'SUBMITTED', $2, $3)`,
        [id, userId, 'Resubmitted after correction']
      );
      await client.query('COMMIT');
      res.json({ success: true, data: result.rows[0] });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) { next(err); }
});

module.exports = router;
