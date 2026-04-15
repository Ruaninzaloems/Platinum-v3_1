const express = require('express');
const router = express.Router();
const { query: dbQuery } = require('../config/database');

router.get('/profile/:employeeId', async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const result = await dbQuery(`
      SELECT e.id, e.employee_code, e.title, e.first_name, e.surname, e.id_number,
             e.date_of_birth, e.gender, e.race, e.disability_status, e.nationality,
             e.email_address, e.cell_number, e.home_number, e.work_number,
             e.physical_address_1, e.physical_address_2, e.physical_city, e.physical_province, e.physical_postal_code,
             e.postal_address_1, e.postal_address_2, e.postal_city, e.postal_province, e.postal_code,
             e.income_tax_number, e.status, e.joining_date, e.photo_url, e.annual_salary,
             e.marital_status, e.dependants, e.language, e.known_as, e.division_id,
             e.bank_name, e.bank_branch_code, e.bank_account_number, e.bank_account_type,
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

router.get('/payslips/:employeeId', async (req, res, next) => {
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

router.get('/payslip-detail/:employeeId/:runId', async (req, res, next) => {
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

router.get('/leave-balances/:employeeId', async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const result = await dbQuery(`
      SELECT elb.id, elb.balance_days AS balance, elb.accrued_days AS accrued,
             elb.taken_days AS taken, elb.forfeited_days AS forfeited, elb.as_at_date,
             lt.name AS leave_type, lt.code
      FROM employee_leave_balances elb
      JOIN leave_types lt ON elb.leave_type_id = lt.id
      WHERE elb.employee_id = $1
      ORDER BY lt.name
    `, [employeeId]);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/leave-requests/:employeeId', async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const result = await dbQuery(`
      SELECT lt2.id, lt2.start_date, lt2.end_date, lt2.days AS days_requested, lt2.status, lt2.reason,
             lt2.created_at, lty.name AS leave_type, lty.code
      FROM leave_transactions lt2
      JOIN leave_types lty ON lt2.leave_type_id = lty.id
      WHERE lt2.employee_id = $1
      ORDER BY lt2.created_at DESC
      LIMIT 50
    `, [employeeId]);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/leave-request', async (req, res, next) => {
  try {
    const { employee_id, leave_type_id, start_date, end_date, days_requested, reason } = req.body;
    if (!employee_id || !leave_type_id || !start_date || !end_date || !days_requested) {
      return res.status(400).json({ success: false, error: { message: 'Missing required fields' } });
    }
    const result = await dbQuery(`
      INSERT INTO leave_transactions (employee_id, leave_type_id, start_date, end_date, days, reason, status, captured_by)
      VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $1)
      RETURNING *
    `, [employee_id, leave_type_id, start_date, end_date, days_requested, reason || null]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/benefits/:employeeId', async (req, res, next) => {
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

router.get('/documents/:employeeId', async (req, res, next) => {
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

router.get('/performance/:employeeId', async (req, res, next) => {
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

router.get('/dependants/:employeeId', async (req, res, next) => {
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

module.exports = router;
