const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');
const { query: dbQuery, getClient } = require('../config/database');

/**
 * @swagger
 * /api/v1/benefits/medical-aid-schemes:
 *   get:
 *     summary: List all medical aid schemes
 *     tags: [Benefits]
 *     responses:
 *       200:
 *         description: List of medical aid schemes
 *
 * /api/v1/benefits/retirement-funds:
 *   get:
 *     summary: List retirement fund types
 *     tags: [Benefits]
 *     responses:
 *       200:
 *         description: List of retirement fund types
 *
 * /api/v1/benefits/employee/{employeeId}/medical-aid:
 *   get:
 *     summary: Get employee medical aid membership with dependants
 *     tags: [Benefits]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Employee medical aid details
 *   post:
 *     summary: Enrol employee on medical aid scheme
 *     tags: [Benefits]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [scheme_id, join_date]
 *             properties:
 *               scheme_id:
 *                 type: integer
 *               membership_number:
 *                 type: string
 *               join_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Medical aid enrolment created
 *
 * /api/v1/benefits/employee/{employeeId}/medical-aid/{membershipId}/dependants:
 *   get:
 *     summary: Get medical aid dependants
 *     tags: [Benefits]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: membershipId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of dependants
 *   post:
 *     summary: Add dependant to medical aid
 *     tags: [Benefits]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: membershipId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [first_name, surname, dependant_type, start_date]
 *             properties:
 *               first_name:
 *                 type: string
 *               surname:
 *                 type: string
 *               id_number:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               dependant_type:
 *                 type: string
 *                 enum: [SPOUSE, CHILD, ADULT, STUDENT, DISABLED]
 *               employer_contributes:
 *                 type: boolean
 *               start_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Dependant added
 *
 * /api/v1/benefits/employee/{employeeId}/retirement-funds:
 *   get:
 *     summary: Get employee retirement fund memberships
 *     tags: [Benefits]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Employee retirement fund details
 *   post:
 *     summary: Add employee to retirement fund
 *     tags: [Benefits]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fund_type_id, join_date]
 *             properties:
 *               fund_type_id:
 *                 type: integer
 *               fund_number:
 *                 type: string
 *               join_date:
 *                 type: string
 *                 format: date
 *               employee_amount:
 *                 type: number
 *               employer_amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Retirement fund membership created
 */

router.get('/cons-vendors', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM cons_vendors WHERE active_for_payroll = TRUE AND enabled = TRUE ORDER BY name');
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/ems-vendors', authenticate, async (req, res, next) => {
  try {
    const EMS_API_BASE_URL = process.env.EMS_API_BASE_URL || 'https://nicki-unrecuperated-counteractively.ngrok-free.dev';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(`${EMS_API_BASE_URL}/vendors`, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`EMS API responded with status ${response.status}`);
      const data = await response.json();
      const raw = Array.isArray(data) ? data : (data.data || data.vendors || []);
      const vendors = raw
        .filter(v => (v.vendorId ?? v.VendorId) != null)
        .sort((a, b) => (a.vendorName || a.VendorName || '').localeCompare(b.vendorName || b.VendorName || ''))
        .map(v => ({ id: v.vendorId ?? v.VendorId, name: v.vendorName ?? v.VendorName }));
      return res.json({ success: true, data: vendors });
    } catch (apiErr) {
      clearTimeout(timeout);
      console.error('[EMS Vendors] API unavailable:', apiErr.message);
      return res.status(503).json({ success: false, error: { message: 'EMS vendor API is currently unavailable' } });
    }
  } catch (err) { next(err); }
});

router.get('/medical-aid-schemes', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT mas.*
       FROM medical_aid_schemes mas
       WHERE mas.enabled = TRUE ORDER BY mas.id`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/medical-aid-schemes/:id', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT mas.*
       FROM medical_aid_schemes mas
       WHERE mas.id = $1`, [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Scheme not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

async function snapshotSchemeHistory(client, schemeId, changeType, userId) {
  const scheme = await client.query('SELECT * FROM medical_aid_schemes WHERE id = $1', [schemeId]);
  if (!scheme.rows.length) return;
  const s = scheme.rows[0];
  await client.query(
    `INSERT INTO medical_aid_scheme_history
     (scheme_id, start_date, end_date, vendor_id, contribution_plan,
      max_employer_contribution, employer_contribution_percentage,
      main_member_contribution, adult_dependant_contribution, child_dependant_contribution,
      min_monthly_income, max_monthly_income,
      max_child_dependants_only, student_dependent, disabled_dependent, max_dependants,
      change_type, captured_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
    [schemeId, s.start_date, s.end_date || '9999-12-31', s.vendor_id, s.contribution_plan,
     s.max_employer_contribution || 0, s.employer_contribution_percentage || 0,
     s.main_member_contribution || 0, s.adult_dependant_contribution || 0, s.child_dependant_contribution || 0,
     s.min_monthly_income || 0, s.max_monthly_income || 99999999,
     s.max_child_dependants_only || false, s.student_dependent || false, s.disabled_dependent || false, s.max_dependants || 0,
     changeType, userId || null]
  );
}

router.post('/medical-aid-schemes', authenticate, auditLog('CREATE', 'medical_aid_scheme'), async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { code, name, vendor_id, contribution_plan, start_date, end_date,
            max_employer_contribution, employer_contribution_percentage,
            min_monthly_income, max_monthly_income,
            main_member_contribution, adult_dependant_contribution, child_dependant_contribution,
            max_child_dependants_only, student_dependent, disabled_dependent, max_dependants } = req.body;
    if (!name || !start_date) { await client.query('ROLLBACK'); return res.status(400).json({ success: false, error: { message: 'Name and start date are required' } }); }
    const result = await client.query(
      `INSERT INTO medical_aid_schemes
       (code, name, vendor_id, contribution_plan, start_date, end_date,
        max_employer_contribution, employer_contribution_percentage,
        min_monthly_income, max_monthly_income,
        main_member_contribution, adult_dependant_contribution, child_dependant_contribution,
        max_child_dependants_only, student_dependent, disabled_dependent, max_dependants, employer_contribution)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$7) RETURNING *`,
      [code || name.toUpperCase().replace(/\s+/g, '_').substring(0, 50), name, vendor_id || null, contribution_plan || null,
       start_date, end_date || '9999-12-31',
       max_employer_contribution || 0, employer_contribution_percentage || 0,
       min_monthly_income || 0, max_monthly_income || 99999999,
       main_member_contribution || 0, adult_dependant_contribution || 0, child_dependant_contribution || 0,
       max_child_dependants_only || false, student_dependent || false, disabled_dependent || false, max_dependants || 0]
    );
    await snapshotSchemeHistory(client, result.rows[0].id, 'CREATE', req.user?.id);
    await client.query('COMMIT');
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { await client.query('ROLLBACK'); next(err); }
  finally { client.release(); }
});

router.put('/medical-aid-schemes/:id', authenticate, auditLog('UPDATE', 'medical_aid_scheme'), async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const schemeId = req.params.id;
    const { name, vendor_id, contribution_plan, start_date, end_date,
            max_employer_contribution, employer_contribution_percentage,
            min_monthly_income, max_monthly_income,
            main_member_contribution, adult_dependant_contribution, child_dependant_contribution,
            max_child_dependants_only, student_dependent, disabled_dependent, max_dependants, enabled } = req.body;

    const existing = await client.query('SELECT * FROM medical_aid_schemes WHERE id = $1', [schemeId]);
    if (!existing.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ success: false, error: { message: 'Scheme not found' } }); }
    const oldScheme = existing.rows[0];

    const newStartDate = start_date || oldScheme.start_date;
    const toDateStr = (d) => d instanceof Date ? d.toISOString().split('T')[0] : String(d).split('T')[0];
    const oldStartStr = toDateStr(oldScheme.start_date);
    const newStartStr = toDateStr(newStartDate);
    const startDateChanged = newStartStr !== oldStartStr;

    if (startDateChanged) {
      const newStart = new Date(newStartStr);
      const closingDate = new Date(newStart);
      closingDate.setDate(closingDate.getDate() - 1);
      const closingStr = closingDate.toISOString().split('T')[0];

      await client.query(
        `UPDATE medical_aid_scheme_history SET end_date = $1
         WHERE scheme_id = $2 AND end_date = '9999-12-31'`,
        [closingStr, schemeId]
      );
    }

    const result = await client.query(
      `UPDATE medical_aid_schemes SET
        name = COALESCE($1, name), vendor_id = $2, contribution_plan = $3,
        start_date = COALESCE($4, start_date), end_date = COALESCE($5, end_date),
        max_employer_contribution = COALESCE($6, max_employer_contribution),
        employer_contribution_percentage = COALESCE($7, employer_contribution_percentage),
        employer_contribution = COALESCE($6, employer_contribution),
        min_monthly_income = COALESCE($8, min_monthly_income),
        max_monthly_income = COALESCE($9, max_monthly_income),
        main_member_contribution = COALESCE($10, main_member_contribution),
        adult_dependant_contribution = COALESCE($11, adult_dependant_contribution),
        child_dependant_contribution = COALESCE($12, child_dependant_contribution),
        max_child_dependants_only = COALESCE($13, max_child_dependants_only),
        student_dependent = COALESCE($14, student_dependent),
        disabled_dependent = COALESCE($15, disabled_dependent),
        max_dependants = COALESCE($16, max_dependants),
        enabled = COALESCE($17, enabled)
       WHERE id = $18 RETURNING *`,
      [name, vendor_id || null, contribution_plan || null,
       start_date, end_date,
       max_employer_contribution, employer_contribution_percentage,
       min_monthly_income, max_monthly_income,
       main_member_contribution, adult_dependant_contribution, child_dependant_contribution,
       max_child_dependants_only, student_dependent, disabled_dependent, max_dependants, enabled,
       schemeId]
    );

    if (startDateChanged) {
      await snapshotSchemeHistory(client, schemeId, 'UPDATE', req.user?.id);
    } else {
      const latestHistory = await client.query(
        `SELECT id FROM medical_aid_scheme_history WHERE scheme_id = $1 AND end_date = '9999-12-31' ORDER BY captured_at DESC LIMIT 1`, [schemeId]
      );
      if (latestHistory.rows.length) {
        const s = result.rows[0];
        await client.query(
          `UPDATE medical_aid_scheme_history SET
            vendor_id = $1, contribution_plan = $2,
            max_employer_contribution = $3, employer_contribution_percentage = $4,
            main_member_contribution = $5, adult_dependant_contribution = $6, child_dependant_contribution = $7,
            min_monthly_income = $8, max_monthly_income = $9,
            max_child_dependants_only = $10, student_dependent = $11, disabled_dependent = $12, max_dependants = $13,
            end_date = $14
           WHERE id = $15`,
          [s.vendor_id, s.contribution_plan,
           s.max_employer_contribution, s.employer_contribution_percentage,
           s.main_member_contribution, s.adult_dependant_contribution, s.child_dependant_contribution,
           s.min_monthly_income, s.max_monthly_income,
           s.max_child_dependants_only, s.student_dependent, s.disabled_dependent, s.max_dependants,
           s.end_date || '9999-12-31',
           latestHistory.rows[0].id]
        );
      } else {
        await snapshotSchemeHistory(client, schemeId, 'UPDATE', req.user?.id);
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { await client.query('ROLLBACK'); next(err); }
  finally { client.release(); }
});

router.get('/medical-aid-schemes/:id/history', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT h.*
       FROM medical_aid_scheme_history h
       WHERE h.scheme_id = $1 ORDER BY h.start_date DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.delete('/medical-aid-schemes/:id', authenticate, auditLog('DELETE', 'medical_aid_scheme'), async (req, res, next) => {
  try {
    const inUse = await dbQuery('SELECT COUNT(*) FROM employee_medical_aid WHERE scheme_id = $1', [req.params.id]);
    if (parseInt(inUse.rows[0].count) > 0) {
      return res.status(400).json({ success: false, error: { message: 'Cannot delete - scheme is assigned to employees' } });
    }
    await dbQuery('DELETE FROM medical_aid_schemes WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Scheme deleted' });
  } catch (err) { next(err); }
});

router.get('/retirement-funds', authenticate, async (req, res, next) => {
  try {
    const { fund_type } = req.query;
    let sql = `SELECT rft.*
               FROM retirement_fund_types rft
               WHERE rft.enabled = TRUE`;
    const params = [];
    if (fund_type) {
      params.push(fund_type);
      sql += ` AND rft.fund_type = $${params.length}`;
    }
    sql += ' ORDER BY rft.id';
    const result = await dbQuery(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/retirement-funds/:id', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT rft.*
       FROM retirement_fund_types rft
       WHERE rft.id = $1`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Fund not found' } });
    const salaryHeads = await dbQuery(
      `SELECT rfsh.id, rfsh.salary_head_id, sh.code, sh.name
       FROM retirement_fund_salary_heads rfsh
       JOIN salary_heads sh ON rfsh.salary_head_id = sh.id
       WHERE rfsh.retirement_fund_type_id = $1 ORDER BY sh.name`, [req.params.id]);
    result.rows[0].salary_heads = salaryHeads.rows;
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.post('/retirement-funds', authenticate, auditLog('CREATE', 'retirement_fund_type'), async (req, res, next) => {
  try {
    const { code, name, fund_type, vendor_id, plan_name, clearance_no, fund_sub_type,
            fund_category_factor, employer_contribution_type, employer_contribution_value,
            employer_max_value, employee_contribution_value, employee_max_value,
            employee_pro_rata, start_date, end_date } = req.body;
    if (!name || !fund_type) return res.status(400).json({ success: false, error: { message: 'Name and fund_type are required' } });
    const genCode = code || name.replace(/[^A-Za-z0-9]/g, '_').toUpperCase().substring(0, 30) + '_' + Date.now().toString(36).toUpperCase();
    const result = await dbQuery(
      `INSERT INTO retirement_fund_types (code, name, fund_type, vendor_id, plan_name, clearance_no, fund_sub_type,
        fund_category_factor, employer_contribution_type, employer_contribution_value, employer_max_value,
        employee_contribution_value, employee_max_value, employee_pro_rata, start_date, end_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [genCode, name, fund_type, vendor_id || null, plan_name || null, clearance_no || null,
       fund_sub_type || null, fund_category_factor || null, employer_contribution_type || 'PERCENTAGE',
       employer_contribution_value || 0, employer_max_value || 0, employee_contribution_value || 0,
       employee_max_value || 0, employee_pro_rata || false, start_date || '1900-01-01', end_date || '9999-12-31']);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/retirement-funds/:id', authenticate, auditLog('UPDATE', 'retirement_fund_type'), async (req, res, next) => {
  try {
    const { name, fund_type, vendor_id, plan_name, clearance_no, fund_sub_type,
            fund_category_factor, employer_contribution_type, employer_contribution_value,
            employer_max_value, employee_contribution_value, employee_max_value,
            employee_pro_rata, start_date, end_date, enabled } = req.body;
    const result = await dbQuery(
      `UPDATE retirement_fund_types SET
        name = COALESCE($1, name), fund_type = COALESCE($2, fund_type), vendor_id = $3,
        plan_name = $4, clearance_no = $5, fund_sub_type = $6,
        fund_category_factor = $7, employer_contribution_type = COALESCE($8, employer_contribution_type),
        employer_contribution_value = COALESCE($9, employer_contribution_value),
        employer_max_value = COALESCE($10, employer_max_value),
        employee_contribution_value = COALESCE($11, employee_contribution_value),
        employee_max_value = COALESCE($12, employee_max_value),
        employee_pro_rata = COALESCE($13, employee_pro_rata),
        start_date = COALESCE($14, start_date), end_date = COALESCE($15, end_date),
        enabled = COALESCE($16, enabled)
       WHERE id = $17 RETURNING *`,
      [name, fund_type, vendor_id || null, plan_name || null, clearance_no || null,
       fund_sub_type || null, fund_category_factor || null, employer_contribution_type,
       employer_contribution_value, employer_max_value, employee_contribution_value,
       employee_max_value, employee_pro_rata, start_date, end_date, enabled, req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Fund not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/retirement-funds/:id', authenticate, auditLog('DELETE', 'retirement_fund_type'), async (req, res, next) => {
  try {
    const inUse = await dbQuery('SELECT COUNT(*) FROM employee_retirement_funds WHERE fund_type_id = $1', [req.params.id]);
    if (parseInt(inUse.rows[0].count) > 0) {
      return res.status(400).json({ success: false, error: { message: 'Cannot delete - fund is assigned to employees' } });
    }
    await dbQuery('DELETE FROM retirement_fund_types WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Fund deleted' });
  } catch (err) { next(err); }
});

router.get('/retirement-funds/:id/salary-heads', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT rfsh.id, rfsh.salary_head_id, sh.code, sh.name
       FROM retirement_fund_salary_heads rfsh
       JOIN salary_heads sh ON rfsh.salary_head_id = sh.id
       WHERE rfsh.retirement_fund_type_id = $1 ORDER BY sh.name`, [req.params.id]);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/retirement-funds/:id/salary-heads', authenticate, auditLog('CREATE', 'retirement_fund_salary_head'), async (req, res, next) => {
  try {
    const { salary_head_id } = req.body;
    if (!salary_head_id) return res.status(400).json({ success: false, error: { message: 'salary_head_id is required' } });
    const result = await dbQuery(
      `INSERT INTO retirement_fund_salary_heads (retirement_fund_type_id, salary_head_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *`,
      [req.params.id, salary_head_id]);
    res.status(201).json({ success: true, data: result.rows[0] || {} });
  } catch (err) { next(err); }
});

router.delete('/retirement-funds/:fundId/salary-heads/:shId', authenticate, auditLog('DELETE', 'retirement_fund_salary_head'), async (req, res, next) => {
  try {
    await dbQuery('DELETE FROM retirement_fund_salary_heads WHERE id = $1 AND retirement_fund_type_id = $2',
      [req.params.shId, req.params.fundId]);
    res.json({ success: true, message: 'Salary head removed' });
  } catch (err) { next(err); }
});

router.get('/employee/:employeeId/medical-aid', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT ema.*, mas.name AS scheme_name, mas.code AS scheme_code, mas.scheme_type,
              mas.contribution_plan, mas.main_member_contribution, mas.adult_dependant_contribution, mas.child_dependant_contribution
       FROM employee_medical_aid ema
       JOIN medical_aid_schemes mas ON ema.scheme_id = mas.id
       WHERE ema.employee_id = $1
       ORDER BY ema.is_current DESC, ema.join_date DESC`,
      [req.params.employeeId]
    );
    for (const row of result.rows) {
      const deps = await dbQuery(
        'SELECT * FROM employee_medical_aid_dependants WHERE employee_medical_aid_id = $1 ORDER BY dependant_type, first_name',
        [row.id]
      );
      row.dependants = deps.rows;
      const extras = await dbQuery(
        'SELECT * FROM employee_medical_aid_extra_transactions WHERE employee_medical_aid_id = $1 ORDER BY start_date DESC',
        [row.id]
      );
      row.extra_transactions = extras.rows;
    }
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/employee/:employeeId/medical-aid', authenticate, auditLog('CREATE', 'employee_medical_aid'), async (req, res, next) => {
  try {
    const { scheme_id, membership_number, join_date, termination_date } = req.body;
    await dbQuery('UPDATE employee_medical_aid SET is_current = FALSE WHERE employee_id = $1', [req.params.employeeId]);
    const result = await dbQuery(
      `INSERT INTO employee_medical_aid (employee_id, scheme_id, membership_number, join_date, termination_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.employeeId, scheme_id, membership_number, join_date, termination_date || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.put('/employee/:employeeId/medical-aid/:membershipId', authenticate, auditLog('UPDATE', 'employee_medical_aid'), async (req, res, next) => {
  try {
    const { scheme_id, membership_number, join_date, termination_date } = req.body;
    const result = await dbQuery(
      `UPDATE employee_medical_aid
       SET scheme_id = COALESCE($1, scheme_id),
           membership_number = COALESCE($2, membership_number),
           join_date = COALESCE($3, join_date),
           termination_date = $4,
           updated_at = NOW()
       WHERE id = $5 AND employee_id = $6 RETURNING *`,
      [scheme_id, membership_number, join_date, termination_date || null, req.params.membershipId, req.params.employeeId]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Membership not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

async function verifyMembershipOwnership(membershipId, employeeId) {
  const result = await dbQuery(
    'SELECT id FROM employee_medical_aid WHERE id = $1 AND employee_id = $2',
    [membershipId, employeeId]
  );
  return result.rows.length > 0;
}

router.delete('/employee/:employeeId/medical-aid/:membershipId', authenticate, auditLog('DELETE', 'employee_medical_aid'), async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const owns = await client.query('SELECT id FROM employee_medical_aid WHERE id = $1 AND employee_id = $2', [req.params.membershipId, req.params.employeeId]);
    if (!owns.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: { message: 'Membership not found' } });
    }
    await client.query('DELETE FROM employee_medical_aid_extra_transactions WHERE employee_medical_aid_id = $1', [req.params.membershipId]);
    await client.query('DELETE FROM employee_medical_aid_dependants WHERE employee_medical_aid_id = $1', [req.params.membershipId]);
    await client.query('DELETE FROM employee_medical_aid WHERE id = $1', [req.params.membershipId]);
    await client.query('COMMIT');
    res.json({ success: true, message: 'Membership deleted' });
  } catch (err) { await client.query('ROLLBACK'); next(err); }
  finally { client.release(); }
});

router.get('/employee/:employeeId/medical-aid/:membershipId/dependants', authenticate, async (req, res, next) => {
  try {
    if (!(await verifyMembershipOwnership(req.params.membershipId, req.params.employeeId)))
      return res.status(404).json({ success: false, error: { message: 'Membership not found' } });
    const result = await dbQuery(
      'SELECT * FROM employee_medical_aid_dependants WHERE employee_medical_aid_id = $1 ORDER BY dependant_type, first_name',
      [req.params.membershipId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/employee/:employeeId/medical-aid/:membershipId/dependants', authenticate, auditLog('CREATE', 'medical_aid_dependant'), async (req, res, next) => {
  try {
    if (!(await verifyMembershipOwnership(req.params.membershipId, req.params.employeeId)))
      return res.status(404).json({ success: false, error: { message: 'Membership not found' } });
    const { first_name, surname, id_number, date_of_birth, gender, dependant_type,
            employer_contributes, start_date, end_date, student_dependant, disabled_dependant } = req.body;
    const result = await dbQuery(
      `INSERT INTO employee_medical_aid_dependants
       (employee_medical_aid_id, first_name, surname, id_number, date_of_birth, gender,
        dependant_type, employer_contributes, start_date, end_date, student_dependant, disabled_dependant)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [req.params.membershipId, first_name, surname, id_number || null, date_of_birth || null,
       gender || null, dependant_type, employer_contributes || false, start_date,
       end_date || '9999-12-31', student_dependant || false, disabled_dependant || false]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.put('/employee/:employeeId/medical-aid/:membershipId/dependants/:depId', authenticate, auditLog('UPDATE', 'medical_aid_dependant'), async (req, res, next) => {
  try {
    if (!(await verifyMembershipOwnership(req.params.membershipId, req.params.employeeId)))
      return res.status(404).json({ success: false, error: { message: 'Membership not found' } });
    const { first_name, surname, id_number, date_of_birth, gender, dependant_type,
            employer_contributes, start_date, end_date, student_dependant, disabled_dependant } = req.body;
    const result = await dbQuery(
      `UPDATE employee_medical_aid_dependants SET
        first_name = COALESCE($1, first_name), surname = COALESCE($2, surname),
        id_number = $3, date_of_birth = $4, gender = $5,
        dependant_type = COALESCE($6, dependant_type), employer_contributes = $7,
        start_date = COALESCE($8, start_date), end_date = $9,
        student_dependant = $10, disabled_dependant = $11
       WHERE id = $12 AND employee_medical_aid_id = $13 RETURNING *`,
      [first_name, surname, id_number || null, date_of_birth || null, gender || null,
       dependant_type, employer_contributes || false, start_date, end_date || '9999-12-31',
       student_dependant || false, disabled_dependant || false,
       req.params.depId, req.params.membershipId]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Dependant not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/employee/:employeeId/medical-aid/:membershipId/dependants/:depId', authenticate, auditLog('DELETE', 'medical_aid_dependant'), async (req, res, next) => {
  try {
    if (!(await verifyMembershipOwnership(req.params.membershipId, req.params.employeeId)))
      return res.status(404).json({ success: false, error: { message: 'Membership not found' } });
    await dbQuery('DELETE FROM employee_medical_aid_dependants WHERE id = $1 AND employee_medical_aid_id = $2', [req.params.depId, req.params.membershipId]);
    res.json({ success: true, message: 'Dependant deleted' });
  } catch (err) {
    next(err);
  }
});

router.get('/employee/:employeeId/medical-aid/:membershipId/extra-transactions', authenticate, async (req, res, next) => {
  try {
    if (!(await verifyMembershipOwnership(req.params.membershipId, req.params.employeeId)))
      return res.status(404).json({ success: false, error: { message: 'Membership not found' } });
    const result = await dbQuery(
      'SELECT * FROM employee_medical_aid_extra_transactions WHERE employee_medical_aid_id = $1 ORDER BY start_date DESC',
      [req.params.membershipId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/employee/:employeeId/medical-aid/:membershipId/extra-transactions', authenticate, auditLog('CREATE', 'medical_aid_extra_transaction'), async (req, res, next) => {
  try {
    if (!(await verifyMembershipOwnership(req.params.membershipId, req.params.employeeId)))
      return res.status(404).json({ success: false, error: { message: 'Membership not found' } });
    const { contribution_type, amount, start_date, end_date, employer_contributes } = req.body;
    const result = await dbQuery(
      `INSERT INTO employee_medical_aid_extra_transactions
       (employee_medical_aid_id, contribution_type, amount, start_date, end_date, employer_contributes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.params.membershipId, contribution_type, amount || 0, start_date, end_date || '9999-12-31', employer_contributes || false]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.put('/employee/:employeeId/medical-aid/:membershipId/extra-transactions/:txnId', authenticate, auditLog('UPDATE', 'medical_aid_extra_transaction'), async (req, res, next) => {
  try {
    if (!(await verifyMembershipOwnership(req.params.membershipId, req.params.employeeId)))
      return res.status(404).json({ success: false, error: { message: 'Membership not found' } });
    const { contribution_type, amount, start_date, end_date, employer_contributes } = req.body;
    const result = await dbQuery(
      `UPDATE employee_medical_aid_extra_transactions SET
        contribution_type = COALESCE($1, contribution_type),
        amount = COALESCE($2, amount),
        start_date = COALESCE($3, start_date),
        end_date = $4,
        employer_contributes = $5
       WHERE id = $6 AND employee_medical_aid_id = $7 RETURNING *`,
      [contribution_type, amount, start_date, end_date || '9999-12-31', employer_contributes || false,
       req.params.txnId, req.params.membershipId]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Transaction not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/employee/:employeeId/medical-aid/:membershipId/extra-transactions/:txnId', authenticate, auditLog('DELETE', 'medical_aid_extra_transaction'), async (req, res, next) => {
  try {
    if (!(await verifyMembershipOwnership(req.params.membershipId, req.params.employeeId)))
      return res.status(404).json({ success: false, error: { message: 'Membership not found' } });
    await dbQuery('DELETE FROM employee_medical_aid_extra_transactions WHERE id = $1 AND employee_medical_aid_id = $2', [req.params.txnId, req.params.membershipId]);
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) {
    next(err);
  }
});

router.get('/employee/:employeeId/retirement-funds', authenticate, async (req, res, next) => {
  try {
    const { fund_type } = req.query;
    let sql = `SELECT erf.*, rft.name AS fund_name, rft.fund_type, rft.plan_name AS fund_plan_name,
                      rft.vendor_id
               FROM employee_retirement_funds erf
               JOIN retirement_fund_types rft ON erf.fund_type_id = rft.id
               WHERE erf.employee_id = $1`;
    const params = [req.params.employeeId];
    if (fund_type) {
      params.push(fund_type);
      sql += ` AND rft.fund_type = $${params.length}`;
    }
    sql += ' ORDER BY erf.is_current DESC, erf.join_date DESC';
    const result = await dbQuery(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/employee/:employeeId/retirement-funds', authenticate, auditLog('CREATE', 'employee_retirement_fund'), async (req, res, next) => {
  try {
    const { fund_type_id, fund_number, join_date, termination_date, employee_amount, employer_amount, is_private, plan_name } = req.body;
    const result = await dbQuery(
      `INSERT INTO employee_retirement_funds (employee_id, fund_type_id, fund_number, join_date, termination_date, employee_amount, employer_amount, is_private, plan_name, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'ACTIVE') RETURNING *`,
      [req.params.employeeId, fund_type_id, fund_number || null, join_date, termination_date || '9999-12-31',
       employee_amount || 0, employer_amount || 0, is_private || false, plan_name || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.put('/employee/:employeeId/retirement-funds/:fundId', authenticate, auditLog('UPDATE', 'employee_retirement_fund'), async (req, res, next) => {
  try {
    const { fund_type_id, fund_number, join_date, termination_date, employee_amount, employer_amount, is_private, is_current, plan_name, status } = req.body;
    const result = await dbQuery(
      `UPDATE employee_retirement_funds SET
        fund_type_id = COALESCE($1, fund_type_id), fund_number = $2,
        join_date = COALESCE($3, join_date), termination_date = $4,
        employee_amount = COALESCE($5, employee_amount), employer_amount = COALESCE($6, employer_amount),
        is_private = COALESCE($7, is_private), is_current = COALESCE($8, is_current),
        plan_name = $9, status = COALESCE($10, status), updated_at = NOW()
       WHERE id = $11 AND employee_id = $12 RETURNING *`,
      [fund_type_id, fund_number || null, join_date, termination_date || null,
       employee_amount, employer_amount, is_private, is_current,
       plan_name || null, status, req.params.fundId, req.params.employeeId]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Fund membership not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/employee/:employeeId/retirement-funds/:fundId', authenticate, auditLog('DELETE', 'employee_retirement_fund'), async (req, res, next) => {
  try {
    await dbQuery('DELETE FROM employee_retirement_funds WHERE id = $1 AND employee_id = $2',
      [req.params.fundId, req.params.employeeId]);
    res.json({ success: true, message: 'Fund membership deleted' });
  } catch (err) { next(err); }
});

router.get('/group-life', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM group_life_benefits WHERE is_active = TRUE ORDER BY benefit_name');
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/group-life', authenticate, auditLog('CREATE', 'group_life_benefit'), async (req, res, next) => {
  try {
    const { benefit_name, benefit_type, provider, policy_number, cover_multiple, employer_contribution_pct, employee_contribution_pct } = req.body;
    const result = await dbQuery(
      `INSERT INTO group_life_benefits (benefit_name, benefit_type, provider, policy_number, cover_multiple, employer_contribution_pct, employee_contribution_pct)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [benefit_name, benefit_type, provider, policy_number, cover_multiple, employer_contribution_pct, employee_contribution_pct]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/employee/:employeeId/group-life', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT egl.*, glb.benefit_name, glb.benefit_type, glb.provider
       FROM employee_group_life egl
       JOIN group_life_benefits glb ON egl.benefit_id = glb.id
       WHERE egl.employee_id = $1 ORDER BY egl.start_date DESC`,
      [req.params.employeeId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/employee/:employeeId/group-life', authenticate, auditLog('CREATE', 'employee_group_life'), async (req, res, next) => {
  try {
    const { benefit_id, cover_amount, employer_contribution, employee_contribution, start_date, beneficiary_name, beneficiary_id_number, beneficiary_relationship } = req.body;
    const result = await dbQuery(
      `INSERT INTO employee_group_life (employee_id, benefit_id, cover_amount, employer_contribution, employee_contribution, start_date, beneficiary_name, beneficiary_id_number, beneficiary_relationship)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.params.employeeId, benefit_id, cover_amount, employer_contribution, employee_contribution, start_date, beneficiary_name, beneficiary_id_number, beneficiary_relationship]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/cost-split/:employeeId', authenticate, async (req, res, next) => {
  try {
    const empId = req.params.employeeId;
    const emp = await dbQuery('SELECT annual_salary FROM employees WHERE id = $1', [empId]);
    if (!emp.rows.length) return res.status(404).json({ success: false, error: { message: 'Employee not found' } });

    const medical = await dbQuery(
      `SELECT ema.*, mas.name AS scheme_name FROM employee_medical_aid ema
       JOIN medical_aid_schemes mas ON ema.scheme_id = mas.id
       WHERE ema.employee_id = $1 AND ema.is_current = TRUE`, [empId]
    );
    const retirement = await dbQuery(
      `SELECT erf.*, rft.name AS fund_name FROM employee_retirement_funds erf
       JOIN retirement_fund_types rft ON erf.fund_type_id = rft.id
       WHERE erf.employee_id = $1 AND erf.is_current = TRUE`, [empId]
    );
    const groupLife = await dbQuery(
      `SELECT egl.*, glb.benefit_name FROM employee_group_life egl
       JOIN group_life_benefits glb ON egl.benefit_id = glb.id
       WHERE egl.employee_id = $1 AND egl.status = 'ACTIVE'`, [empId]
    );

    let totalEmployer = 0, totalEmployee = 0;
    for (const r of retirement.rows) {
      totalEmployer += parseFloat(r.employer_amount || 0);
      totalEmployee += parseFloat(r.employee_amount || 0);
    }
    for (const g of groupLife.rows) {
      totalEmployer += parseFloat(g.employer_contribution || 0);
      totalEmployee += parseFloat(g.employee_contribution || 0);
    }

    res.json({
      success: true,
      data: {
        employee_id: parseInt(empId),
        annual_salary: parseFloat(emp.rows[0].annual_salary),
        medical_aid: medical.rows,
        retirement_funds: retirement.rows,
        group_life: groupLife.rows,
        totals: { employer_cost: totalEmployer, employee_cost: totalEmployee, total_cost: totalEmployer + totalEmployee }
      }
    });
  } catch (err) { next(err); }
});

// === BENEFIT RATE TABLES ===
router.get('/rate-tables/:schemeId', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT * FROM benefit_rate_tables WHERE scheme_id = $1 ORDER BY effective_date DESC`,
      [req.params.schemeId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/rate-tables', authenticate, async (req, res, next) => {
  try {
    const { scheme_id, plan_name, member_rate, adult_dependant_rate, child_dependant_rate, effective_date, end_date } = req.body;
    const result = await dbQuery(
      `INSERT INTO benefit_rate_tables (scheme_id, plan_name, member_rate, adult_dependant_rate, child_dependant_rate, effective_date, end_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [scheme_id, plan_name, member_rate, adult_dependant_rate, child_dependant_rate, effective_date, end_date]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

// === LIFE EVENTS ===
router.get('/life-events/:employeeId', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT * FROM life_events WHERE employee_id = $1 ORDER BY event_date DESC`,
      [req.params.employeeId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/life-events', authenticate, async (req, res, next) => {
  try {
    const { employee_id, event_type, event_date, notes } = req.body;
    const result = await dbQuery(
      `INSERT INTO life_events (employee_id, event_type, event_date, notes) VALUES ($1,$2,$3,$4) RETURNING *`,
      [employee_id, event_type, event_date, notes]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

// === COST PROJECTION ===
router.post('/project-cost', authenticate, async (req, res, next) => {
  try {
    const { employee_id, changes } = req.body;
    const emp = await dbQuery(`SELECT annual_salary FROM employees WHERE id = $1`, [employee_id]);
    if (!emp.rows.length) return res.status(404).json({ success: false, error: { message: 'Employee not found' } });

    const currentSalary = parseFloat(emp.rows[0].annual_salary || 0);
    const currentMedical = await dbQuery(
      `SELECT COALESCE(SUM(employee_contribution + employer_contribution), 0) AS total
       FROM employee_medical_aid WHERE employee_id = $1 AND status = 'ACTIVE'`,
      [employee_id]
    );
    const currentRetirement = await dbQuery(
      `SELECT COALESCE(SUM(employee_amount + employer_amount), 0) AS total
       FROM employee_retirement_funds WHERE employee_id = $1 AND status = 'ACTIVE'`,
      [employee_id]
    );

    const currentCost = currentSalary + parseFloat(currentMedical.rows[0].total) * 12 + parseFloat(currentRetirement.rows[0].total) * 12;
    const projectedSalary = changes?.new_salary || currentSalary;
    const projectedMedical = changes?.medical_change || parseFloat(currentMedical.rows[0].total) * 12;
    const projectedRetirement = changes?.retirement_change || parseFloat(currentRetirement.rows[0].total) * 12;
    const projectedCost = projectedSalary + projectedMedical + projectedRetirement;

    res.json({
      success: true,
      data: {
        current: { salary: currentSalary, medical_annual: parseFloat(currentMedical.rows[0].total) * 12, retirement_annual: parseFloat(currentRetirement.rows[0].total) * 12, total: currentCost },
        projected: { salary: projectedSalary, medical_annual: projectedMedical, retirement_annual: projectedRetirement, total: projectedCost },
        difference: { amount: projectedCost - currentCost, percentage: currentCost > 0 ? parseFloat(((projectedCost - currentCost) / currentCost * 100).toFixed(2)) : 0 }
      }
    });
  } catch (err) { next(err); }
});

// === BENEFIT REPORTS ===
router.get('/reports/scheme-summary', authenticate, async (req, res, next) => {
  try {
    const medical = await dbQuery(
      `SELECT mas.name, COUNT(ema.id) AS members,
              COALESCE(SUM(ema.employee_contribution), 0) AS total_ee,
              COALESCE(SUM(ema.employer_contribution), 0) AS total_er
       FROM medical_aid_schemes mas
       LEFT JOIN employee_medical_aid ema ON ema.scheme_id = mas.id AND ema.status = 'ACTIVE'
       GROUP BY mas.name ORDER BY mas.name`
    );
    const retirement = await dbQuery(
      `SELECT rft.name, COUNT(erf.id) AS members,
              COALESCE(SUM(erf.employee_amount), 0) AS total_ee,
              COALESCE(SUM(erf.employer_amount), 0) AS total_er
       FROM retirement_fund_types rft
       LEFT JOIN employee_retirement_funds erf ON erf.fund_type_id = rft.id AND erf.status = 'ACTIVE'
       GROUP BY rft.name ORDER BY rft.name`
    );
    res.json({ success: true, data: { medical_schemes: medical.rows, retirement_funds: retirement.rows } });
  } catch (err) { next(err); }
});

router.get('/reports/employee-summary/:employeeId', authenticate, async (req, res, next) => {
  try {
    const empId = req.params.employeeId;
    const medical = await dbQuery(
      `SELECT ema.*, mas.name AS scheme_name FROM employee_medical_aid ema
       JOIN medical_aid_schemes mas ON ema.scheme_id = mas.id WHERE ema.employee_id = $1`,
      [empId]
    );
    const retirement = await dbQuery(
      `SELECT erf.*, rft.name AS fund_name FROM employee_retirement_funds erf
       JOIN retirement_fund_types rft ON erf.fund_type_id = rft.id WHERE erf.employee_id = $1`,
      [empId]
    );
    const lifeEvents = await dbQuery(
      `SELECT * FROM life_events WHERE employee_id = $1 ORDER BY event_date DESC`, [empId]
    );
    res.json({ success: true, data: { medical: medical.rows, retirement: retirement.rows, life_events: lifeEvents.rows } });
  } catch (err) { next(err); }
});

router.get('/employee/:employeeId/unions', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT eu.*, tu.representative AS union_name, tu.contribution_type, tu.contribution_value, tu.maximum_value
       FROM employee_unions eu
       JOIN trade_unions tu ON eu.trade_union_id = tu.id
       WHERE eu.employee_id = $1
       ORDER BY eu.join_date DESC`,
      [req.params.employeeId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/employee/:employeeId/unions', authenticate, auditLog('CREATE', 'employee_union'), async (req, res, next) => {
  try {
    const { trade_union_id, join_date, termination_date } = req.body;
    if (!trade_union_id || !join_date) return res.status(400).json({ success: false, error: { message: 'Union and join date are required' } });
    const termDate = termination_date || '9999-12-31';
    if (termDate < join_date) return res.status(400).json({ success: false, error: { message: 'Termination date cannot be before join date' } });
    const existing = await dbQuery(
      `SELECT id FROM employee_unions WHERE employee_id = $1 AND trade_union_id = $2 AND enabled = TRUE
       AND termination_date >= $3 AND join_date <= $4`,
      [req.params.employeeId, trade_union_id, join_date, termination_date || '9999-12-31']
    );
    if (existing.rows.length > 0) return res.status(400).json({ success: false, error: { message: 'Employee already has an active membership for this union' } });
    const result = await dbQuery(
      `INSERT INTO employee_unions (employee_id, trade_union_id, join_date, termination_date)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.employeeId, trade_union_id, join_date, termination_date || '9999-12-31']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/employee/:employeeId/unions/:id', authenticate, auditLog('UPDATE', 'employee_union'), async (req, res, next) => {
  try {
    const { trade_union_id, join_date, termination_date, enabled } = req.body;
    if (join_date && termination_date && termination_date < join_date) {
      return res.status(400).json({ success: false, error: { message: 'Termination date cannot be before join date' } });
    }
    const result = await dbQuery(
      `UPDATE employee_unions SET
        trade_union_id = COALESCE($1, trade_union_id),
        join_date = COALESCE($2, join_date),
        termination_date = COALESCE($3, termination_date),
        enabled = COALESCE($4, enabled),
        updated_at = NOW()
       WHERE id = $5 AND employee_id = $6 RETURNING *`,
      [trade_union_id, join_date, termination_date, enabled, req.params.id, req.params.employeeId]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Union membership not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/employee/:employeeId/unions/:id', authenticate, auditLog('DELETE', 'employee_union'), async (req, res, next) => {
  try {
    const result = await dbQuery(
      'DELETE FROM employee_unions WHERE id = $1 AND employee_id = $2 RETURNING id',
      [req.params.id, req.params.employeeId]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Union membership not found' } });
    res.json({ success: true, message: 'Union membership deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
