const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { query: dbQuery } = require('../config/database');

/**
 * @swagger
 * /api/v1/dashboard/summary:
 *   get:
 *     summary: Executive dashboard KPIs and summary metrics
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Dashboard KPIs
 *
 * /api/v1/dashboard/payroll-summary:
 *   get:
 *     summary: Payroll cost summary for dashboard
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Payroll cost breakdown
 *
 * /api/v1/dashboard/leave-summary:
 *   get:
 *     summary: Leave status summary for dashboard
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Leave statistics
 *
 * /api/v1/dashboard/department-headcount:
 *   get:
 *     summary: Headcount by department
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Department headcount breakdown
 *
 * /api/v1/dashboard/compliance:
 *   get:
 *     summary: Compliance and audit status
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Compliance metrics
 */

router.get('/summary', authenticate, async (req, res, next) => {
  try {
    const [empStats, posStats, leaveStats, payrollStats, currentPeriodResult, deptStats] = await Promise.all([
      dbQuery(`SELECT
        COUNT(*) AS total_employees,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_employees,
        COUNT(*) FILTER (WHERE status = 'SUSPENDED') AS suspended_employees,
        COUNT(*) FILTER (WHERE status = 'TERMINATED') AS terminated_employees,
        COUNT(*) FILTER (WHERE joining_date >= CURRENT_DATE - INTERVAL '30 days') AS new_hires_30d,
        COALESCE(SUM(annual_salary) FILTER (WHERE status = 'ACTIVE'), 0) AS total_annual_salary
       FROM employees WHERE enabled = TRUE`),

      dbQuery(`SELECT
        COUNT(*) AS total_positions,
        COUNT(*) FILTER (WHERE status = 'FILLED') AS filled_positions,
        COUNT(*) FILTER (WHERE status = 'VACANT') AS vacant_positions,
        COUNT(*) FILTER (WHERE status = 'FROZEN') AS frozen_positions
       FROM positions WHERE enabled = TRUE`),

      dbQuery(`SELECT
        COUNT(*) AS total_requests,
        COUNT(*) FILTER (WHERE status = 'PENDING') AS pending_requests,
        COUNT(*) FILTER (WHERE status = 'APPROVED') AS approved_requests,
        COUNT(*) FILTER (WHERE status = 'REJECTED') AS rejected_requests
       FROM leave_transactions`),

      dbQuery(`SELECT
        COUNT(*) AS total_runs,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed_runs,
        COUNT(*) FILTER (WHERE status = 'PENDING') AS pending_runs,
        COUNT(*) FILTER (WHERE status = 'PROCESSING') AS processing_runs,
        COUNT(*) FILTER (WHERE status = 'LOCKED') AS locked_runs,
        COUNT(*) FILTER (WHERE status = 'APPROVED') AS approved_runs,
        COALESCE(SUM(total_nett) FILTER (WHERE status IN ('COMPLETED','LOCKED','APPROVED')), 0) AS total_nett_paid,
        COALESCE(SUM(total_paye) FILTER (WHERE status IN ('COMPLETED','LOCKED','APPROVED')), 0) AS total_paye,
        COALESCE(SUM(total_uif) FILTER (WHERE status IN ('COMPLETED','LOCKED','APPROVED')), 0) AS total_uif,
        COALESCE(SUM(total_sdl) FILTER (WHERE status IN ('COMPLETED','LOCKED','APPROVED')), 0) AS total_sdl
       FROM payroll_runs`),

      dbQuery(`SELECT pp.period_number, pp.tax_year, pp.start_date, pp.end_date, pp.status, pc.name AS cycle_name
       FROM payroll_periods pp
       JOIN payroll_cycles pc ON pp.cycle_id = pc.id
       WHERE pp.status = 'OPEN' AND pp.cycle_mode_id = 1
       ORDER BY pp.start_date ASC LIMIT 1`),

      (async () => {
        const { getDepartments } = require('./department.routes');
        const depts = await getDepartments();
        return { rows: [{ total_departments: depts.filter(d => d.enabled !== false).length }] };
      })()
    ]);

    res.json({
      success: true,
      data: {
        employees: empStats.rows[0],
        positions: posStats.rows[0],
        leave: leaveStats.rows[0],
        payroll: payrollStats.rows[0],
        departments: deptStats.rows[0],
        current_period: currentPeriodResult.rows[0] || null,
        generated_at: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/payroll-summary', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT pr.id, pr.run_type, pr.status, pr.payment_date, pr.employee_count,
              pr.total_earnings, pr.total_deductions, pr.total_company_contributions,
              pr.total_nett, pr.total_paye, pr.total_uif, pr.total_sdl,
              pp.period_number, pp.tax_year, pp.tax_period,
              pc.name AS cycle_name
       FROM payroll_runs pr
       JOIN payroll_periods pp ON pr.period_id = pp.id
       JOIN payroll_cycles pc ON pr.cycle_id = pc.id
       ORDER BY pr.run_date DESC
       LIMIT 12`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/leave-summary', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT lt.name AS leave_type, lt.code,
              COUNT(ltr.id) AS total_requests,
              COUNT(ltr.id) FILTER (WHERE ltr.status = 'PENDING') AS pending,
              COUNT(ltr.id) FILTER (WHERE ltr.status = 'APPROVED') AS approved,
              COUNT(ltr.id) FILTER (WHERE ltr.status = 'REJECTED') AS rejected,
              COALESCE(SUM(ltr.days) FILTER (WHERE ltr.status = 'APPROVED'), 0) AS total_days_taken
       FROM leave_types lt
       LEFT JOIN leave_transactions ltr ON ltr.leave_type_id = lt.id
       GROUP BY lt.id, lt.name, lt.code
       ORDER BY lt.name`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/department-headcount', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT p.department_id,
              COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'ACTIVE') AS active_employees,
              COUNT(DISTINCT p.id) AS total_positions,
              COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'VACANT') AS vacant_positions,
              COALESCE(SUM(e.annual_salary) FILTER (WHERE e.status = 'ACTIVE'), 0) AS total_salary_cost
       FROM positions p
       LEFT JOIN employees e ON e.position_id = p.id AND e.status = 'ACTIVE'
       WHERE p.department_id IS NOT NULL
       GROUP BY p.department_id`
    );
    const { getDepartments } = require('./department.routes');
    const depts = await getDepartments();
    const deptMap = new Map(depts.map(d => [d.id, d]));
    const data = result.rows.map(r => {
      const dept = deptMap.get(Number(r.department_id)) || {};
      return { id: Number(r.department_id), code: dept.code || null, name: dept.name || null, ...r, department_id: undefined };
    }).filter(r => r.name).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/compliance', authenticate, async (req, res, next) => {
  try {
    const [empMissing, taxSetup, recentAudit] = await Promise.all([
      dbQuery(`SELECT
        COUNT(*) FILTER (WHERE income_tax_number IS NULL AND status = 'ACTIVE') AS missing_tax_numbers,
        COUNT(*) FILTER (WHERE bank_account_number IS NULL AND status = 'ACTIVE') AS missing_bank_details,
        COUNT(*) FILTER (WHERE position_id IS NULL AND status = 'ACTIVE') AS unlinked_positions,
        COUNT(*) FILTER (WHERE id_number IS NULL AND status = 'ACTIVE') AS missing_id_numbers
       FROM employees`),
      dbQuery(`SELECT COUNT(*) AS tax_brackets FROM tax_brackets WHERE tax_year = EXTRACT(YEAR FROM CURRENT_DATE)`),
      dbQuery(`SELECT COUNT(*) AS recent_entries FROM audit_log WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`)
    ]);

    res.json({
      success: true,
      data: {
        data_quality: empMissing.rows[0],
        tax_configuration: taxSetup.rows[0],
        audit: recentAudit.rows[0],
        generated_at: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/current-cycles', authenticate, async (req, res, next) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const systemTaxYear = month >= 3 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
    const systemFinYear = month >= 7 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
    const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const systemMonth = monthNames[month];

    const result = await dbQuery(
      `SELECT DISTINCT ON (pc.id)
              pc.id AS cycle_id, pc.name AS payroll, pc.cycle_type,
              pp.id AS period_id, pp.period_number, pp.tax_year, pp.financial_year,
              pp.start_date, pp.end_date, pp.status, pp.tax_period
       FROM payroll_cycles pc
       JOIN payroll_periods pp ON pc.id = pp.cycle_id
         AND pp.cycle_mode_id = 1
         AND pp.status = 'OPEN'
       WHERE pc.enabled = TRUE
       ORDER BY pc.id, pp.period_number ASC`
    );

    const cycles = result.rows.map(row => {
      let periodLabel = '-';
      if (row.start_date) {
        const startMonth = new Date(row.start_date).getMonth() + 1;
        periodLabel = monthNames[startMonth];
        if (row.cycle_type === 'WEEKLY') {
          periodLabel = `Week ${row.period_number}`;
        } else if (row.cycle_type === 'FORTNIGHTLY' || row.cycle_type === 'BI-WEEKLY') {
          periodLabel = `Fortnight ${row.period_number}`;
        }
      }
      return {
        payroll: row.payroll,
        cycle_type: row.cycle_type === 'MONTHLY' ? 'Normal' : 'Special',
        period: periodLabel,
        status: row.status || 'No Period',
        period_number: row.period_number,
        tax_year: row.tax_year,
        period_id: row.period_id
      };
    });

    res.json({
      success: true,
      data: {
        system_tax_year: systemTaxYear,
        system_financial_year: systemFinYear,
        system_month: systemMonth,
        cycles
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/demographics', authenticate, async (req, res, next) => {
  try {
    const [
      genderResult,
      raceResult,
      raceGenderResult,
      disabilityResult,
      ageResult,
      tenureResult,
      deptGenderResult,
      gradeResult,
      monthlyHiresResult,
      monthlyTermsResult
    ] = await Promise.all([
      dbQuery(`SELECT gender, COUNT(*) AS count FROM employees WHERE status = 'ACTIVE' AND enabled = TRUE GROUP BY gender ORDER BY gender`),
      dbQuery(`SELECT race, COUNT(*) AS count FROM employees WHERE status = 'ACTIVE' AND enabled = TRUE GROUP BY race ORDER BY race`),
      dbQuery(`SELECT race, gender, COUNT(*) AS count FROM employees WHERE status = 'ACTIVE' AND enabled = TRUE GROUP BY race, gender ORDER BY race, gender`),
      dbQuery(`SELECT disability_status, gender, COUNT(*) AS count FROM employees WHERE status = 'ACTIVE' AND enabled = TRUE GROUP BY disability_status, gender ORDER BY disability_status, gender`),
      dbQuery(`SELECT
        CASE
          WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) < 25 THEN '18-24'
          WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) < 35 THEN '25-34'
          WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) < 45 THEN '35-44'
          WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) < 55 THEN '45-54'
          ELSE '55+'
        END AS age_band,
        gender,
        COUNT(*) AS count
       FROM employees
       WHERE status = 'ACTIVE' AND enabled = TRUE AND date_of_birth IS NOT NULL
       GROUP BY age_band, gender
       ORDER BY age_band`),
      dbQuery(`SELECT
        CASE
          WHEN EXTRACT(YEAR FROM AGE(joining_date)) < 1 THEN '< 1 year'
          WHEN EXTRACT(YEAR FROM AGE(joining_date)) < 3 THEN '1-2 years'
          WHEN EXTRACT(YEAR FROM AGE(joining_date)) < 5 THEN '3-5 years'
          WHEN EXTRACT(YEAR FROM AGE(joining_date)) < 10 THEN '5-10 years'
          ELSE '10+ years'
        END AS tenure_band,
        COUNT(*) AS count
       FROM employees
       WHERE status = 'ACTIVE' AND enabled = TRUE AND joining_date IS NOT NULL
       GROUP BY tenure_band
       ORDER BY tenure_band`),
      (async () => {
        const r = await dbQuery(`SELECT p.department_id, e.gender, COUNT(*) AS count
         FROM employees e
         JOIN positions p ON e.position_id = p.id
         WHERE e.status = 'ACTIVE' AND e.enabled = TRUE
         GROUP BY p.department_id, e.gender
         ORDER BY p.department_id, e.gender`);
        const { getDepartments } = require('./department.routes');
        const depts = await getDepartments();
        const deptMap = new Map(depts.map(d => [d.id, d.name]));
        for (const row of r.rows) { row.department_name = deptMap.get(Number(row.department_id)) || null; }
        return r;
      })(),
      dbQuery(`SELECT tg.grade_code, tg.grade_name, e.race, e.gender, COUNT(*) AS count
       FROM employees e
       JOIN task_grades tg ON e.task_grade_id = tg.id
       WHERE e.status = 'ACTIVE' AND e.enabled = TRUE
       GROUP BY tg.grade_code, tg.grade_name, e.race, e.gender
       ORDER BY tg.grade_code`),
      dbQuery(`SELECT
        TO_CHAR(joining_date, 'YYYY-MM') AS month,
        COUNT(*) AS hires
       FROM employees
       WHERE enabled = TRUE AND joining_date >= CURRENT_DATE - INTERVAL '12 months'
       GROUP BY month ORDER BY month`),
      dbQuery(`SELECT
        TO_CHAR(end_date, 'YYYY-MM') AS month,
        COUNT(*) AS terminations
       FROM employees
       WHERE enabled = TRUE AND status = 'TERMINATED' AND end_date >= CURRENT_DATE - INTERVAL '12 months'
       GROUP BY month ORDER BY month`)
    ]);

    const eeTargets = {
      african_male: 45, african_female: 30,
      coloured_male: 5, coloured_female: 5,
      indian_male: 3, indian_female: 2,
      white_male: 5, white_female: 5,
      disability: 2
    };

    res.json({
      success: true,
      data: {
        gender: genderResult.rows,
        race: raceResult.rows,
        race_gender: raceGenderResult.rows,
        disability: disabilityResult.rows,
        age_distribution: ageResult.rows,
        tenure_distribution: tenureResult.rows,
        department_gender: deptGenderResult.rows,
        grade_demographics: gradeResult.rows,
        monthly_hires: monthlyHiresResult.rows,
        monthly_terminations: monthlyTermsResult.rows,
        ee_targets: eeTargets,
        generated_at: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
