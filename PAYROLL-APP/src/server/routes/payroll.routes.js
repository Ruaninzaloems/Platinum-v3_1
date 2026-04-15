const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { paginationMiddleware } = require('../middleware/validation');
const { auditLog } = require('../middleware/auditLog');
const { query: dbQuery, getClient } = require('../config/database');
const { calculateForEmployee, calculateMock, loadTaxTables, calculateETI, getAge, resolveTaxYear, resolveMonthlyBasic, calculatePayslipForEmployee, normalizeTransactionsToMonthly, evaluateFormulaV2, buildFormulaVariables } = require('../services/payroll-engine');

/**
 * @swagger
 * /api/v1/payroll/cycles:
 *   get:
 *     summary: List payroll cycles (monthly, bi-weekly, weekly)
 *     tags: [Payroll]
 *     responses:
 *       200:
 *         description: List of payroll cycles
 *
 * /api/v1/payroll/periods:
 *   get:
 *     summary: List payroll periods with status
 *     tags: [Payroll]
 *     parameters:
 *       - in: query
 *         name: cycle_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: tax_year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, TRIAL, LOCKED, APPROVED, FINALISED, CLOSED]
 *     responses:
 *       200:
 *         description: List of payroll periods
 *
 * /api/v1/payroll/runs:
 *   get:
 *     summary: List payroll runs
 *     tags: [Payroll]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSING, COMPLETED, FAILED, LOCKED, APPROVED]
 *     responses:
 *       200:
 *         description: List of payroll runs
 *   post:
 *     summary: Create new payroll run
 *     tags: [Payroll]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cycle_id, period_id, run_type]
 *             properties:
 *               cycle_id:
 *                 type: integer
 *               period_id:
 *                 type: integer
 *               run_type:
 *                 type: string
 *                 enum: [TRIAL, FINAL, ADHOC_TRIAL, ADHOC_FINAL]
 *               payment_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Payroll run created
 *
 * /api/v1/payroll/runs/{id}:
 *   get:
 *     summary: Get payroll run details with totals
 *     tags: [Payroll]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payroll run details
 *
 * /api/v1/payroll/runs/{id}/execute:
 *   post:
 *     summary: Execute payroll calculation (trial or final)
 *     tags: [Payroll]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payroll executed
 *
 * /api/v1/payroll/runs/{id}/lock:
 *   post:
 *     summary: Lock payroll run (prevent further changes)
 *     tags: [Payroll]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payroll run locked
 *
 * /api/v1/payroll/runs/{id}/approve:
 *   post:
 *     summary: Approve payroll run
 *     tags: [Payroll]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payroll run approved
 *
 * /api/v1/payroll/runs/{id}/results:
 *   get:
 *     summary: Get payroll results for a specific run
 *     tags: [Payroll]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: employee_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payroll results
 *
 * /api/v1/payroll/runs/{id}/errors:
 *   get:
 *     summary: Get payroll run errors and warnings
 *     tags: [Payroll]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payroll run errors
 *
 * /api/v1/payroll/salary-heads:
 *   get:
 *     summary: List salary transaction definitions (earnings, deductions, company contributions)
 *     tags: [Payroll]
 *     parameters:
 *       - in: query
 *         name: transaction_type
 *         schema:
 *           type: string
 *           enum: [EARNING, DEDUCTION, COMPANY_CONTRIBUTION, FRINGE_BENEFIT]
 *     responses:
 *       200:
 *         description: List of salary heads
 *   post:
 *     summary: Create salary head definition
 *     tags: [Payroll]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name, transaction_type, start_date]
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               transaction_type:
 *                 type: string
 *                 enum: [EARNING, DEDUCTION, COMPANY_CONTRIBUTION, FRINGE_BENEFIT]
 *               taxable:
 *                 type: boolean
 *               irp5_code:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Salary head created
 *
 * /api/v1/payroll/tax-tables:
 *   get:
 *     summary: Get current SARS tax brackets, rebates, and thresholds
 *     tags: [Payroll]
 *     parameters:
 *       - in: query
 *         name: tax_year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tax tables
 *
 * /api/v1/payroll/third-party-payments:
 *   get:
 *     summary: List third party payment schedules
 *     tags: [Payroll]
 *     parameters:
 *       - in: query
 *         name: run_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Third party payments
 */

router.get('/cycles', authenticate, async (req, res, next) => {
  try {
    const { all } = req.query;
    const where = all === 'true' ? '' : 'WHERE pc.enabled = TRUE';
    const result = await dbQuery(`SELECT pc.* FROM payroll_cycles pc ${where} ORDER BY pc.id`);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/cycles', authenticate, async (req, res, next) => {
  try {
    const { code, name, description, cycle_type, start_date } = req.body;
    if (!name || !cycle_type) return res.status(400).json({ success: false, message: 'Name and cycle type are required' });
    const periodsMap = { 'MONTHLY': 12, 'WEEKLY': 52, 'BI-WEEKLY': 26, 'FORTNIGHTLY': 26 };
    const periods_per_year = periodsMap[cycle_type] || 12;
    const result = await dbQuery(
      `INSERT INTO payroll_cycles (code, name, description, cycle_type, periods_per_year, start_date, enabled) VALUES ($1,$2,$3,$4,$5,$6,TRUE) RETURNING *`,
      [code || name.toUpperCase().replace(/\s+/g, '_'), name, description || null, cycle_type, periods_per_year, start_date || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.put('/cycles/:id', authenticate, async (req, res, next) => {
  try {
    const { name, description, code, cycle_type, start_date, enabled } = req.body;
    const periodsMap = { 'MONTHLY': 12, 'WEEKLY': 52, 'BI-WEEKLY': 26, 'FORTNIGHTLY': 26 };
    const periods_per_year = cycle_type ? (periodsMap[cycle_type] || 12) : undefined;
    const result = await dbQuery(
      `UPDATE payroll_cycles SET name=COALESCE($1,name), description=COALESCE($2,description), code=COALESCE($3,code), cycle_type=COALESCE($4,cycle_type), start_date=$5, periods_per_year=COALESCE($6,periods_per_year), enabled=COALESCE($7,enabled) WHERE id=$8 RETURNING *`,
      [name, description, code, cycle_type, start_date || null, periods_per_year, enabled, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Cycle not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/cycles/:id', authenticate, async (req, res, next) => {
  try {
    const periodsCheck = await dbQuery('SELECT COUNT(*) FROM payroll_periods WHERE cycle_id = $1', [req.params.id]);
    if (parseInt(periodsCheck.rows[0].count) > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete cycle with existing periods. Disable it instead.' });
    }
    await dbQuery('DELETE FROM payroll_cycles WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    next(err);
  }
});

router.get('/periods', authenticate, async (req, res, next) => {
  try {
    const { cycle_id, tax_year, status, available_for_run, include_adhoc, cycle_mode_id } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = [];
    let pi = 1;
    if (cycle_id) { whereClause += ` AND pp.cycle_id = $${pi}`; params.push(parseInt(cycle_id, 10)); pi++; }
    if (tax_year) { whereClause += ` AND pp.tax_year = $${pi}`; params.push(parseInt(tax_year, 10)); pi++; }
    if (status) { whereClause += ` AND pp.status = $${pi}`; params.push(status.toUpperCase()); pi++; }
    if (cycle_mode_id) {
      whereClause += ` AND pp.cycle_mode_id = $${pi}`; params.push(parseInt(cycle_mode_id, 10)); pi++;
    } else if (include_adhoc !== 'true') {
      whereClause += ` AND COALESCE(pp.cycle_mode_id, 1) = 1`;
    }

    if (available_for_run === 'true' && cycle_id) {
      whereClause += ` AND pp.id NOT IN (
        SELECT DISTINCT pr.period_id FROM payroll_runs pr
        WHERE pr.cycle_id = $${pi}
          AND pr.run_type IN ('FINAL','ADHOC_FINAL')
          AND pr.status = 'APPROVED'
      )`;
      params.push(parseInt(cycle_id, 10));
      pi++;
    }

    const result = await dbQuery(
      `SELECT pp.*, pc.name AS cycle_name, pc.cycle_type
       FROM payroll_periods pp
       JOIN payroll_cycles pc ON pp.cycle_id = pc.id
       ${whereClause}
       ORDER BY pp.tax_year ASC, pp.period_number ASC`,
      params
    );

    let data = result.rows;
    if (available_for_run === 'true') {
      data = data.length > 0 ? [data[0]] : [];
    }

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/periods/open', authenticate, async (req, res, next) => {
  try {
    const { cycle_id } = req.query;
    if (!cycle_id) {
      return res.status(400).json({ success: false, error: { message: 'cycle_id is required' } });
    }
    const result = await dbQuery(
      `SELECT pp.*, pc.name AS cycle_name, pc.cycle_type
       FROM payroll_periods pp
       JOIN payroll_cycles pc ON pp.cycle_id = pc.id
       WHERE pp.cycle_id = $1 AND pp.status IN ('OPEN', 'TRIAL', 'LOCKED')
         AND COALESCE(pp.cycle_mode_id, 1) = 1
       ORDER BY CASE pp.status WHEN 'OPEN' THEN 0 WHEN 'TRIAL' THEN 1 WHEN 'LOCKED' THEN 2 END, pp.tax_year ASC, pp.period_number ASC
       LIMIT 1`,
      [parseInt(cycle_id, 10)]
    );
    if (result.rows.length === 0) {
      return res.json({ success: true, data: null });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get('/runs/find', authenticate, async (req, res, next) => {
  try {
    const { cycle_id, period_id } = req.query;
    if (!cycle_id || !period_id) {
      return res.status(400).json({ success: false, error: { message: 'cycle_id and period_id are required' } });
    }
    const result = await dbQuery(
      `SELECT pr.*, pp.period_number, pp.tax_year, pp.start_date AS period_start, pp.end_date AS period_end,
              pc.name AS cycle_name
       FROM payroll_runs pr
       JOIN payroll_periods pp ON pr.period_id = pp.id
       JOIN payroll_cycles pc ON pr.cycle_id = pc.id
       WHERE pr.cycle_id = $1 AND pr.period_id = $2
       ORDER BY pr.id DESC
       LIMIT 1`,
      [parseInt(cycle_id, 10), parseInt(period_id, 10)]
    );
    if (result.rows.length === 0) {
      return res.json({ success: true, data: null });
    }
    const run = result.rows[0];
    if (run.status === 'PROCESSING') {
      const staleMinutes = 5;
      const refTime = run.started_at || run.created_at;
      const elapsed = (Date.now() - new Date(refTime).getTime()) / 60000;
      if (elapsed > staleMinutes) {
        console.log(`[Payroll] Auto-resetting stale PROCESSING run #${run.id} (stuck for ${Math.round(elapsed)} min)`);
        await dbQuery(`UPDATE payroll_runs SET status = 'FAILED' WHERE id = $1`, [run.id]);
        run.status = 'FAILED';
      }
    }
    res.json({ success: true, data: run });
  } catch (err) {
    next(err);
  }
});

router.get('/runs/:id/employees', authenticate, async (req, res, next) => {
  try {
    const runId = parseInt(req.params.id, 10);
    const result = await dbQuery(`
      SELECT DISTINCT e.id, e.employee_code, e.first_name, e.surname, e.id_number,
             e.division_id, e.pay_point_id, pp.name AS pay_point_name
      FROM payroll_results pr
      JOIN employees e ON pr.employee_id = e.id
      LEFT JOIN pay_points pp ON e.pay_point_id = pp.id
      WHERE pr.run_id = $1
      ORDER BY e.surname, e.first_name
    `, [runId]);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/runs/:id/results-summary', authenticate, async (req, res, next) => {
  try {
    const { page, limit, reason, id, emp_no, code, name, surname } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const pageLimit = parseInt(limit, 10) || 50;
    const offset = (pageNum - 1) * pageLimit;

    let whereClause = 'WHERE pr.run_id = $1';
    const params = [req.params.id];
    let pi = 2;

    if (id) { whereClause += ` AND CAST(e.id AS TEXT) LIKE $${pi}`; params.push(`%${id}%`); pi++; }
    if (emp_no) { whereClause += ` AND CAST(e.id AS TEXT) LIKE $${pi}`; params.push(`%${emp_no}%`); pi++; }
    if (code) { whereClause += ` AND LOWER(e.employee_code) LIKE LOWER($${pi})`; params.push(`%${code}%`); pi++; }
    if (name) { whereClause += ` AND LOWER(e.first_name) LIKE LOWER($${pi})`; params.push(`%${name}%`); pi++; }
    if (surname) { whereClause += ` AND LOWER(e.surname) LIKE LOWER($${pi})`; params.push(`%${surname}%`); pi++; }

    const errJoin = `LEFT JOIN (
      SELECT DISTINCT employee_id FROM payroll_run_errors WHERE run_id = $1
    ) pre ON pre.employee_id = e.id`;

    let havingClause = '';
    if (reason) {
      const reasonUpper = reason.trim().toUpperCase();
      if (reasonUpper.length >= 2 && 'CALCULATED'.startsWith(reasonUpper)) {
        havingClause = ' HAVING COUNT(CASE WHEN pre.employee_id IS NOT NULL THEN 1 END) = 0';
      } else if (reasonUpper.length >= 2 && 'ERROR'.startsWith(reasonUpper)) {
        havingClause = ' HAVING COUNT(CASE WHEN pre.employee_id IS NOT NULL THEN 1 END) > 0';
      } else if (reasonUpper.length < 2) {
        // too short to filter meaningfully
      } else {
        havingClause = ' HAVING 1 = 0';
      }
    }

    const countResult = await dbQuery(
      `SELECT COUNT(*) FROM (
        SELECT pr.employee_id
        FROM payroll_results pr
        JOIN employees e ON pr.employee_id = e.id
        ${errJoin}
        ${whereClause}
        GROUP BY pr.employee_id, e.id
        ${havingClause}
      ) sub`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await dbQuery(
      `SELECT e.id AS emp_id, e.employee_code, e.first_name, e.surname,
              CASE WHEN COUNT(CASE WHEN pre.employee_id IS NOT NULL THEN 1 END) > 0 THEN 'ERROR' ELSE 'CALCULATED' END AS reason,
              SUM(CASE WHEN pr.transaction_type = 'EARNING' AND COALESCE(sh.code, pr.head_code, '') IN ('BASIC','BASIC_SALARY') THEN pr.amount ELSE 0 END) AS salary,
              SUM(CASE WHEN pr.transaction_type = 'EARNING' THEN pr.amount ELSE 0 END) AS earnings,
              SUM(CASE WHEN pr.transaction_type = 'DEDUCTION' THEN pr.amount ELSE 0 END) AS deductions,
              SUM(CASE WHEN pr.transaction_type = 'COMPANY_CONTRIBUTION' THEN pr.amount ELSE 0 END) AS contributions,
              SUM(CASE WHEN pr.transaction_type = 'FRINGE_BENEFIT' THEN pr.amount ELSE 0 END) AS fringe,
              SUM(CASE WHEN pr.transaction_type = 'EARNING' THEN pr.amount ELSE 0 END) -
              SUM(CASE WHEN pr.transaction_type = 'DEDUCTION' THEN pr.amount ELSE 0 END) AS nett_salary
       FROM payroll_results pr
       JOIN employees e ON pr.employee_id = e.id
       LEFT JOIN salary_heads sh ON pr.salary_head_id = sh.id
       ${errJoin}
       ${whereClause}
       GROUP BY e.id, e.employee_code, e.first_name, e.surname
       ${havingClause}
       ORDER BY e.id
       LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, pageLimit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      meta: { page: pageNum, limit: pageLimit, total, totalPages: Math.ceil(total / pageLimit) }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/runs/:id/gl-ledger', authenticate, async (req, res, next) => {
  try {
    const runId = req.params.id;
    const { page, limit, employee_code, head_code, transaction_type } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * pageLimit;

    let whereClause = `WHERE pr.run_id = $1 AND pr.transaction_type != 'FRINGE_BENEFIT'`;
    const params = [runId];
    let pi = 2;

    if (employee_code) {
      whereClause += ` AND LOWER(e.employee_code) LIKE LOWER($${pi})`;
      params.push(`%${employee_code}%`);
      pi++;
    }
    if (head_code) {
      whereClause += ` AND LOWER(COALESCE(sh.code, pr.head_code, '')) LIKE LOWER($${pi})`;
      params.push(`%${head_code}%`);
      pi++;
    }
    if (transaction_type) {
      whereClause += ` AND pr.transaction_type = $${pi}`;
      params.push(transaction_type.toUpperCase());
      pi++;
    }

    const countResult = await dbQuery(
      `SELECT COUNT(*) FROM payroll_results pr
       JOIN employees e ON pr.employee_id = e.id
       LEFT JOIN salary_heads sh ON pr.salary_head_id = sh.id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await dbQuery(
      `SELECT pr.employee_id, e.employee_code, e.first_name, e.surname,
              e.employee_type_id,
              pr.salary_head_id, COALESCE(sh.code, pr.head_code) AS head_code, sh.name AS head_name,
              pr.transaction_type, pr.amount,
              pr.division_id, pr.scoa_item_id, pr.scoa_project_id, pr.scoa_function_id, pr.scoa_region_id, pr.scoa_fund_id,
              pr.contra_division_id, pr.contra_scoa_item_id, pr.contra_scoa_project_id, pr.contra_scoa_function_id, pr.contra_scoa_region_id, pr.contra_scoa_fund_id,
              pr.debit_plan_project_item_id, pr.credit_plan_project_item_id,
              COALESCE(pgl.journal_entry_only, false) AS journal_entry_only
       FROM payroll_results pr
       JOIN employees e ON pr.employee_id = e.id
       LEFT JOIN salary_heads sh ON pr.salary_head_id = sh.id
       LEFT JOIN LATERAL (
         SELECT journal_entry_only FROM payroll_gl_items
         WHERE salary_head_id = pr.salary_head_id
         ORDER BY start_date DESC LIMIT 1
       ) pgl ON true
       ${whereClause}
       ORDER BY pr.employee_id, pr.transaction_type
       LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, pageLimit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      meta: { page: pageNum, limit: pageLimit, total, totalPages: Math.ceil(total / pageLimit) }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/runs/:id/results-summary/export', authenticate, async (req, res, next) => {
  try {
    const runId = req.params.id;
    const run = await dbQuery('SELECT * FROM payroll_runs WHERE id = $1', [runId]);
    if (run.rows.length === 0) return res.status(404).json({ success: false, error: { message: 'Run not found' } });

    const errJoin = `LEFT JOIN (
      SELECT DISTINCT employee_id FROM payroll_run_errors WHERE run_id = $1
    ) pre ON pre.employee_id = e.id`;

    const result = await dbQuery(
      `SELECT e.id AS emp_id, e.employee_code, e.first_name, e.surname,
              CASE WHEN COUNT(CASE WHEN pre.employee_id IS NOT NULL THEN 1 END) > 0 THEN 'ERROR' ELSE 'CALCULATED' END AS reason,
              SUM(CASE WHEN pr.transaction_type = 'EARNING' AND COALESCE(sh.code, pr.head_code, '') IN ('BASIC','BASIC_SALARY') THEN pr.amount ELSE 0 END) AS salary,
              SUM(CASE WHEN pr.transaction_type = 'EARNING' THEN pr.amount ELSE 0 END) AS earnings,
              SUM(CASE WHEN pr.transaction_type = 'DEDUCTION' THEN pr.amount ELSE 0 END) AS deductions,
              SUM(CASE WHEN pr.transaction_type = 'COMPANY_CONTRIBUTION' THEN pr.amount ELSE 0 END) AS contributions,
              SUM(CASE WHEN pr.transaction_type = 'FRINGE_BENEFIT' THEN pr.amount ELSE 0 END) AS fringe,
              SUM(CASE WHEN pr.transaction_type = 'EARNING' THEN pr.amount ELSE 0 END) -
              SUM(CASE WHEN pr.transaction_type = 'DEDUCTION' THEN pr.amount ELSE 0 END) AS nett_salary
       FROM payroll_results pr
       JOIN employees e ON pr.employee_id = e.id
       LEFT JOIN salary_heads sh ON pr.salary_head_id = sh.id
       ${errJoin}
       WHERE pr.run_id = $1
       GROUP BY e.id, e.employee_code, e.first_name, e.surname
       ORDER BY e.id`,
      [runId]
    );

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Trial Run Results');

    sheet.columns = [
      { header: 'Reason', key: 'reason', width: 14 },
      { header: 'Employee ID', key: 'emp_id', width: 12 },
      { header: 'Employee Code', key: 'employee_code', width: 16 },
      { header: 'First Name', key: 'first_name', width: 18 },
      { header: 'Surname', key: 'surname', width: 18 },
      { header: 'Salary', key: 'salary', width: 16 },
      { header: 'Earnings', key: 'earnings', width: 16 },
      { header: 'Deductions', key: 'deductions', width: 16 },
      { header: 'Contributions', key: 'contributions', width: 16 },
      { header: 'Fringe', key: 'fringe', width: 16 },
      { header: 'Nett Salary', key: 'nett_salary', width: 16 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };

    const sanitize = (val) => {
      if (typeof val !== 'string') return val;
      if (/^[=+\-@\t\r]/.test(val)) return "'" + val;
      return val;
    };

    for (const row of result.rows) {
      sheet.addRow({
        reason: sanitize(row.reason),
        emp_id: row.emp_id,
        employee_code: sanitize(row.employee_code),
        first_name: sanitize(row.first_name),
        surname: sanitize(row.surname),
        salary: parseFloat(row.salary) || 0,
        earnings: parseFloat(row.earnings) || 0,
        deductions: parseFloat(row.deductions) || 0,
        contributions: parseFloat(row.contributions) || 0,
        fringe: parseFloat(row.fringe) || 0,
        nett_salary: parseFloat(row.nett_salary) || 0,
      });
    }

    ['F', 'G', 'H', 'I', 'J', 'K'].forEach(col => {
      sheet.getColumn(col).numFmt = '#,##0.00';
    });

    const errResult = await dbQuery(
      `SELECT pre.employee_id, e.employee_code, e.first_name, e.surname,
              pre.error_type, pre.error_message
       FROM payroll_run_errors pre
       JOIN employees e ON pre.employee_id = e.id
       WHERE pre.run_id = $1
       ORDER BY e.id`,
      [runId]
    );

    if (errResult.rows.length > 0) {
      const errSheet = workbook.addWorksheet('Errors');
      errSheet.columns = [
        { header: 'Employee ID', key: 'employee_id', width: 14 },
        { header: 'Employee Code', key: 'employee_code', width: 16 },
        { header: 'First Name', key: 'first_name', width: 18 },
        { header: 'Surname', key: 'surname', width: 18 },
        { header: 'Error Type', key: 'error_type', width: 20 },
        { header: 'Error Message', key: 'error_message', width: 60 },
      ];
      const errHeaderRow = errSheet.getRow(1);
      errHeaderRow.font = { bold: true };
      errHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFECACA' } };
      for (const err of errResult.rows) {
        errSheet.addRow({
          employee_id: err.employee_id,
          employee_code: sanitize(err.employee_code),
          first_name: sanitize(err.first_name),
          surname: sanitize(err.surname),
          error_type: sanitize(err.error_type),
          error_message: sanitize(err.error_message),
        });
      }
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="trial_run_${runId}_results.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
});

router.get('/runs/:id/gl-ledger/export', authenticate, async (req, res, next) => {
  try {
    const runId = req.params.id;
    const run = await dbQuery('SELECT * FROM payroll_runs WHERE id = $1', [runId]);
    if (run.rows.length === 0) return res.status(404).json({ success: false, error: { message: 'Run not found' } });

    const result = await dbQuery(
      `SELECT pr.employee_id, e.employee_code, e.first_name, e.surname,
              e.employee_type_id,
              pr.salary_head_id, COALESCE(sh.code, pr.head_code) AS head_code, sh.name AS head_name,
              pr.transaction_type, pr.amount,
              pr.division_id, pr.scoa_item_id, pr.scoa_project_id, pr.scoa_function_id, pr.scoa_region_id, pr.scoa_fund_id,
              pr.contra_division_id, pr.contra_scoa_item_id, pr.contra_scoa_project_id, pr.contra_scoa_function_id, pr.contra_scoa_region_id, pr.contra_scoa_fund_id,
              pr.debit_plan_project_item_id, pr.credit_plan_project_item_id,
              COALESCE(pgl.journal_entry_only, false) AS journal_entry_only
       FROM payroll_results pr
       JOIN employees e ON pr.employee_id = e.id
       LEFT JOIN salary_heads sh ON pr.salary_head_id = sh.id
       LEFT JOIN LATERAL (
         SELECT journal_entry_only FROM payroll_gl_items
         WHERE salary_head_id = pr.salary_head_id
         ORDER BY start_date DESC LIMIT 1
       ) pgl ON true
       WHERE pr.run_id = $1
       ORDER BY pr.employee_id, pr.salary_head_id`,
      [runId]
    );

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('GL Ledger');

    sheet.columns = [
      { header: 'Employee ID', key: 'employee_id', width: 12 },
      { header: 'Employee Code', key: 'employee_code', width: 16 },
      { header: 'First Name', key: 'first_name', width: 18 },
      { header: 'Surname', key: 'surname', width: 18 },
      { header: 'Emp Type', key: 'employee_type_id', width: 10 },
      { header: 'Salary Head ID', key: 'salary_head_id', width: 14 },
      { header: 'Head Code', key: 'head_code', width: 14 },
      { header: 'Head Name', key: 'head_name', width: 30 },
      { header: 'JE Only', key: 'journal_entry_only', width: 8 },
      { header: 'Tx Type', key: 'transaction_type', width: 22 },
      { header: 'Amount', key: 'amount', width: 16 },
      { header: 'Debit Division', key: 'division_id', width: 14 },
      { header: 'Debit Item', key: 'scoa_item_id', width: 12 },
      { header: 'Debit Project', key: 'scoa_project_id', width: 14 },
      { header: 'Debit Function', key: 'scoa_function_id', width: 14 },
      { header: 'Debit Region', key: 'scoa_region_id', width: 12 },
      { header: 'Debit Fund', key: 'scoa_fund_id', width: 12 },
      { header: 'Credit Division', key: 'contra_division_id', width: 14 },
      { header: 'Credit Item', key: 'contra_scoa_item_id', width: 12 },
      { header: 'Credit Project', key: 'contra_scoa_project_id', width: 14 },
      { header: 'Credit Function', key: 'contra_scoa_function_id', width: 14 },
      { header: 'Credit Region', key: 'contra_scoa_region_id', width: 14 },
      { header: 'Credit Fund', key: 'contra_scoa_fund_id', width: 12 },
      { header: 'Debit PlanProjItem', key: 'debit_plan_project_item_id', width: 18 },
      { header: 'Credit PlanProjItem', key: 'credit_plan_project_item_id', width: 18 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };

    const sanitize = (val) => {
      if (typeof val !== 'string') return val;
      if (/^[=+\-@\t\r]/.test(val)) return "'" + val;
      return val;
    };

    for (const row of result.rows) {
      sheet.addRow({
        employee_id: row.employee_id,
        employee_code: sanitize(row.employee_code),
        first_name: sanitize(row.first_name),
        surname: sanitize(row.surname),
        employee_type_id: row.employee_type_id,
        salary_head_id: row.salary_head_id,
        head_code: sanitize(row.head_code),
        head_name: sanitize(row.head_name),
        journal_entry_only: row.journal_entry_only ? 'Y' : 'N',
        transaction_type: sanitize(row.transaction_type),
        amount: parseFloat(row.amount) || 0,
        division_id: row.division_id || '',
        scoa_item_id: row.scoa_item_id || '',
        scoa_project_id: row.scoa_project_id || '',
        scoa_function_id: row.scoa_function_id || '',
        scoa_region_id: row.scoa_region_id || '',
        scoa_fund_id: row.scoa_fund_id || '',
        contra_division_id: row.contra_division_id || '',
        contra_scoa_item_id: row.contra_scoa_item_id || '',
        contra_scoa_project_id: row.contra_scoa_project_id || '',
        contra_scoa_function_id: row.contra_scoa_function_id || '',
        contra_scoa_region_id: row.contra_scoa_region_id || '',
        contra_scoa_fund_id: row.contra_scoa_fund_id || '',
        debit_plan_project_item_id: row.debit_plan_project_item_id || '',
        credit_plan_project_item_id: row.credit_plan_project_item_id || '',
      });
    }

    sheet.getColumn('K').numFmt = '#,##0.00';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="gl_ledger_run_${runId}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
});

router.post('/runs/:id/post-to-ledger', authenticate, async (req, res, next) => {
  try {
    const runId = req.params.id;
    const run = await dbQuery('SELECT * FROM payroll_runs WHERE id = $1', [runId]);
    if (run.rows.length === 0) return res.status(404).json({ success: false, error: { message: 'Run not found' } });

    const result = await dbQuery(
      `SELECT pr.id, pr.amount, pr.debit_plan_project_item_id, pr.credit_plan_project_item_id,
              sh.name AS head_name
       FROM payroll_results pr
       LEFT JOIN salary_heads sh ON pr.salary_head_id = sh.id
       WHERE pr.run_id = $1
         AND pr.debit_plan_project_item_id IS NOT NULL
         AND pr.credit_plan_project_item_id IS NOT NULL
       ORDER BY pr.id`,
      [runId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'No GL transactions with both debit and credit PlanProjectItemIds found' } });
    }

    const lines = [];
    for (const row of result.rows) {
      const amt = parseFloat(row.amount) || 0;
      const txDetail = row.head_name || 'Unknown';
      lines.push({
        processingMonth: 8,
        finYear: '2025/2026',
        transactionDetails: txDetail,
        sourceModuleId: row.id,
        debit: amt,
        credit: 0,
        capturerId: 1,
        planProjectItemId: parseInt(row.debit_plan_project_item_id),
        vatRate: 0.00,
        vatRateId: 1
      });
      lines.push({
        processingMonth: 8,
        finYear: '2025/2026',
        transactionDetails: txDetail,
        sourceModuleId: row.id,
        debit: 0,
        credit: amt,
        capturerId: 1,
        planProjectItemId: parseInt(row.credit_plan_project_item_id),
        vatRate: 0.00,
        vatRateId: 1
      });
    }

    const payload = {
      submoduleId: 3,
      eventType: 'PAYROLL_POSTING',
      documentNumber: '131/001',
      isCashflow: false,
      lines
    };

    const EXTERNAL_API_BASE = 'https://nicki-unrecuperated-counteractively.ngrok-free.dev';
    const extRes = await globalThis.fetch(`${EXTERNAL_API_BASE}/gl-outbox`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(payload)
    });

    if (!extRes.ok) {
      const errText = await extRes.text();
      return res.status(extRes.status).json({ success: false, error: { message: `External API error: ${extRes.status}`, details: errText } });
    }

    const extData = await extRes.json();
    const outboxId = extData.id || extData.outboxId || JSON.stringify(extData);
    res.json({ success: true, data: { outboxId, linesPosted: lines.length } });
  } catch (err) {
    next(err);
  }
});

router.post('/periods/generate', authenticate, async (req, res, next) => {
  try {
    const { tax_year, cycle_id, start_date, end_date, tax_year_open } = req.body;
    if (!tax_year || !cycle_id || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'Tax year, cycle, start date and end date are required' });
    }

    const startDt = new Date(start_date);
    const endDt = new Date(end_date);
    if (isNaN(startDt.getTime()) || isNaN(endDt.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid start or end date' });
    }
    if (startDt >= endDt) {
      return res.status(400).json({ success: false, message: 'Start date must be before end date' });
    }

    const cycleResult = await dbQuery('SELECT * FROM payroll_cycles WHERE id = $1', [cycle_id]);
    if (cycleResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Cycle not found' });
    const cycle = cycleResult.rows[0];

    const existing = await dbQuery('SELECT COUNT(*) FROM payroll_periods WHERE cycle_id = $1 AND tax_year = $2', [cycle_id, tax_year]);
    if (parseInt(existing.rows[0].count) > 0) {
      return res.status(400).json({ success: false, message: `Periods already exist for tax year ${tax_year} on this cycle. Delete them first if you want to regenerate.` });
    }

    const periodsCount = cycle.periods_per_year;
    const taxYearInt = parseInt(tax_year);
    const financialYear = `${taxYearInt - 1}/${taxYearInt}`;
    const periodStatus = tax_year_open !== false ? 'OPEN' : 'CLOSED';

    function calcTaxPeriod(month) { return month >= 3 ? month - 2 : month + 10; }
    function fmtDate(d) { return d.toISOString().split('T')[0]; }

    const periods = [];
    if (cycle.cycle_type === 'MONTHLY') {
      let current = new Date(startDt);
      for (let i = 1; i <= periodsCount; i++) {
        const periodStart = new Date(current);
        const periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        if (periodEnd > endDt) periodEnd.setTime(endDt.getTime());
        const payDay = Math.min(25, periodEnd.getDate());
        const paymentDate = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), payDay);

        periods.push({
          cycle_id, period_number: i, tax_year: taxYearInt,
          tax_period: calcTaxPeriod(periodStart.getMonth() + 1),
          financial_year: financialYear, financial_period: i,
          start_date: fmtDate(periodStart), end_date: fmtDate(periodEnd),
          payment_date: fmtDate(paymentDate), status: periodStatus
        });
        current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      }
    } else if (cycle.cycle_type === 'WEEKLY') {
      let current = new Date(startDt);
      for (let i = 1; i <= periodsCount; i++) {
        const periodStart = new Date(current);
        const periodEnd = new Date(current);
        periodEnd.setDate(periodEnd.getDate() + 6);
        if (periodEnd > endDt) periodEnd.setTime(endDt.getTime());

        periods.push({
          cycle_id, period_number: i, tax_year: taxYearInt,
          tax_period: calcTaxPeriod(periodStart.getMonth() + 1),
          financial_year: financialYear, financial_period: i,
          start_date: fmtDate(periodStart), end_date: fmtDate(periodEnd),
          payment_date: fmtDate(periodEnd), status: periodStatus
        });
        current = new Date(periodEnd);
        current.setDate(current.getDate() + 1);
        if (current > endDt) break;
      }
    } else if (cycle.cycle_type === 'BI-WEEKLY') {
      let current = new Date(startDt);
      for (let i = 1; i <= periodsCount; i++) {
        const periodStart = new Date(current);
        const periodEnd = new Date(current);
        periodEnd.setDate(periodEnd.getDate() + 13);
        if (periodEnd > endDt) periodEnd.setTime(endDt.getTime());

        periods.push({
          cycle_id, period_number: i, tax_year: taxYearInt,
          tax_period: calcTaxPeriod(periodStart.getMonth() + 1),
          financial_year: financialYear, financial_period: i,
          start_date: fmtDate(periodStart), end_date: fmtDate(periodEnd),
          payment_date: fmtDate(periodEnd), status: periodStatus
        });
        current = new Date(periodEnd);
        current.setDate(current.getDate() + 1);
        if (current > endDt) break;
      }
    }

    if (periods.length === 0) {
      return res.status(400).json({ success: false, message: 'No periods could be generated for the given date range' });
    }

    const { getClient } = require('../config/database');
    const client = await getClient();
    try {
      await client.query('BEGIN');
      for (const p of periods) {
        await client.query(
          `INSERT INTO payroll_periods (cycle_id, period_number, tax_year, tax_period, financial_year, financial_period, start_date, end_date, payment_date, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [p.cycle_id, p.period_number, p.tax_year, p.tax_period, p.financial_year, p.financial_period, p.start_date, p.end_date, p.payment_date, p.status]
        );
      }
      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    res.status(201).json({ success: true, data: { periods_created: periods.length, periods }, message: `${periods.length} periods created for tax year ${tax_year}` });
  } catch (err) {
    next(err);
  }
});

router.delete('/periods/tax-year', authenticate, async (req, res, next) => {
  try {
    const { tax_year, cycle_id } = req.query;
    if (!tax_year || !cycle_id) return res.status(400).json({ success: false, message: 'Tax year and cycle_id required' });

    const closedCheck = await dbQuery(
      "SELECT COUNT(*) FROM payroll_periods WHERE cycle_id = $1 AND tax_year = $2 AND status = 'CLOSED'",
      [cycle_id, tax_year]
    );
    if (parseInt(closedCheck.rows[0].count) > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete periods once processing has started. Processed periods exist for this cycle and tax year.' });
    }

    const runsCheck = await dbQuery(
      "SELECT COUNT(*) FROM payroll_runs WHERE cycle_id = $1 AND period_id IN (SELECT id FROM payroll_periods WHERE cycle_id = $1 AND tax_year = $2) AND status IN ('APPROVED','PROCESSING')",
      [cycle_id, tax_year]
    );
    if (parseInt(runsCheck.rows[0].count) > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete periods with approved payroll runs' });
    }

    const result = await dbQuery('DELETE FROM payroll_periods WHERE cycle_id = $1 AND tax_year = $2', [cycle_id, tax_year]);
    res.json({ success: true, message: `${result.rowCount} periods deleted` });
  } catch (err) {
    next(err);
  }
});

router.get('/runs', authenticate, paginationMiddleware, async (req, res, next) => {
  try {
    const { pagination } = req;
    const { status, cycle_id } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = [];
    let pi = 1;
    if (status) { whereClause += ` AND pr.status = $${pi}`; params.push(status.toUpperCase()); pi++; }
    if (cycle_id) { whereClause += ` AND pr.cycle_id = $${pi}`; params.push(parseInt(cycle_id, 10)); pi++; }

    const countResult = await dbQuery(`SELECT COUNT(*) FROM payroll_runs pr ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await dbQuery(
      `SELECT pr.*, pp.period_number, pp.tax_year, pp.tax_period, pc.name AS cycle_name, pc.cycle_type
       FROM payroll_runs pr
       JOIN payroll_periods pp ON pr.period_id = pp.id
       JOIN payroll_cycles pc ON pr.cycle_id = pc.id
       ${whereClause}
       ORDER BY pr.run_date DESC
       LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, pagination.limit, pagination.offset]
    );

    res.json({ success: true, data: result.rows, meta: { page: pagination.page, limit: pagination.limit, total, totalPages: Math.ceil(total / pagination.limit) } });
  } catch (err) {
    next(err);
  }
});

router.post('/runs', authenticate, auditLog('CREATE', 'payroll_run'), async (req, res, next) => {
  try {
    let { cycle_id, period_id, run_type, payment_date } = req.body;

    if (['FINAL', 'ADHOC_FINAL'].includes(run_type)) {
      run_type = run_type === 'ADHOC_FINAL' ? 'ADHOC_TRIAL' : 'TRIAL';
    }

    const period = await dbQuery('SELECT * FROM payroll_periods WHERE id = $1', [period_id]);
    if (period.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payroll period not found' } });
    }

    const approvedCheck = await dbQuery(
      `SELECT id FROM payroll_runs
       WHERE cycle_id = $1 AND period_id = $2
         AND run_type IN ('FINAL','ADHOC_FINAL')
         AND status = 'APPROVED'
       LIMIT 1`,
      [cycle_id, period_id]
    );
    if (approvedCheck.rows.length > 0) {
      return res.status(400).json({ success: false, error: { code: 'PERIOD_CLOSED', message: 'This period already has an approved final run. Select the next available period.' } });
    }

    const result = await dbQuery(
      `INSERT INTO payroll_runs (cycle_id, period_id, run_type, payment_date, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [cycle_id, period_id, run_type, payment_date || period.rows[0].payment_date, req.user?.id || 1]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get('/runs/:id', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT pr.*, pp.period_number, pp.tax_year, pp.tax_period, pp.start_date AS period_start, pp.end_date AS period_end,
              pc.name AS cycle_name, pc.cycle_type, pc.periods_per_year
       FROM payroll_runs pr
       JOIN payroll_periods pp ON pr.period_id = pp.id
       JOIN payroll_cycles pc ON pr.cycle_id = pc.id
       WHERE pr.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payroll run not found' } });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.post('/runs/mock-payslip', authenticate, async (req, res, next) => {
  try {
    const {
      annual_salary, date_of_birth, dependants, medical_aid_members,
      tax_year, period_type, additional_earnings, additional_deductions
    } = req.body;

    if (!annual_salary || annual_salary <= 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'annual_salary is required and must be positive' } });
    }

    const effectiveTaxYear = tax_year || new Date().getFullYear();
    const periodsMap = { MONTHLY: 12, BI_WEEKLY: 26, WEEKLY: 52 };
    const periodsPerYear = periodsMap[(period_type || 'MONTHLY').toUpperCase()] || 12;

    const taxTables = await loadTaxTables(effectiveTaxYear);

    const result = calculateMock({
      annual_salary: parseFloat(annual_salary),
      date_of_birth: date_of_birth || '1990-01-01',
      dependants: parseInt(dependants) || 0,
      medical_aid_members: parseInt(medical_aid_members) || 0,
      additional_earnings: additional_earnings || [],
      additional_deductions: additional_deductions || [],
      periods_per_year: periodsPerYear,
    }, taxTables);

    res.json({
      success: true,
      data: {
        tax_year: effectiveTaxYear,
        period_type: period_type || 'MONTHLY',
        periods_per_year: periodsPerYear,
        ...result,
      },
    });
  } catch (err) {
    next(err);
  }
});

const runProgress = {};

const BATCH_INSERT_SIZE = 200;

const SALARY_CONTROL_ID = '79954';
const SALARY_PROJECT_ID = '26733';

function allocateDebitScoa(txType, empTypeId, gl, pos, amount) {
  const isEarningOrCC = txType === 'EARNING' || txType === 'COMPANY_CONTRIBUTION';
  const isDeduction = txType === 'DEDUCTION';
  const isMunicipal = empTypeId === 1;
  const journalEntry = gl && gl.journal_entry_only === true;
  const overrideProject = gl && gl.override_project === true;

  let division = pos.division_id || null;
  let projectId = pos.pos_scoa_project_id || null;
  let scoaItemId = null;
  let functionId = pos.pos_scoa_function_id || null;
  let regionId = pos.pos_scoa_region_id || null;
  let fundId = null;
  let planProjectItemId = null;

  if (isEarningOrCC) {
    if (isMunicipal && overrideProject && gl) {
      planProjectItemId = gl.plan_project_item_id || null;
      projectId = null;
      scoaItemId = null;
      functionId = null;
      regionId = null;
      fundId = null;
      division = null;
    } else {
      projectId = pos.pos_scoa_project_id || null;
      if ([1, 2, 3, 7].includes(empTypeId) && gl) {
        scoaItemId = gl.scoa_item_id_permanent_staff || null;
      } else if (empTypeId === 6 && gl) {
        scoaItemId = gl.scoa_item_id_post_retirement || null;
      }
      if (isMunicipal && gl && gl.scoa_fund_id) {
        fundId = gl.scoa_fund_id;
      }
    }
  } else if (isDeduction) {
    if (journalEntry && gl) {
      planProjectItemId = gl.plan_project_item_id || null;
      projectId = gl.scoa_project_id || null;
      scoaItemId = gl.suspense_scoa_item_id || null;
    } else {
      projectId = SALARY_PROJECT_ID;
      scoaItemId = SALARY_CONTROL_ID;
    }
  }

  return { division, projectId, scoaItemId, functionId, regionId, fundId, planProjectItemId };
}

function allocateCreditScoa(txType, gl, pos, amount, debitFundId) {
  const isDeduction = txType === 'DEDUCTION';
  const journalEntry = gl && gl.journal_entry_only === true;
  const overrideProject = gl && gl.override_project === true;

  let division = pos.division_id || null;
  let projectId = (gl && gl.scoa_project_id) || null;
  let scoaItemId = null;
  let functionId = pos.pos_scoa_function_id || null;
  let regionId = pos.pos_scoa_region_id || null;
  let fundId = debitFundId;
  let planProjectItemId = null;

  if (overrideProject || journalEntry) {
    planProjectItemId = (gl && gl.plan_project_item_id) || null;
  }

  if (journalEntry && gl) {
    functionId = gl.scoa_function_id || pos.pos_scoa_function_id || null;
    regionId = gl.scoa_region_id || pos.pos_scoa_region_id || null;
  }

  if (isDeduction && journalEntry && gl) {
    division = pos.division_id || null;
    projectId = gl.scoa_project_id || null;
    scoaItemId = gl.scoa_item_id || null;
  } else {
    if (amount > 0) {
      scoaItemId = (gl && gl.suspense_scoa_item_credit_id) || null;
    } else {
      scoaItemId = (gl && gl.suspense_scoa_item_id) || null;
    }
  }

  return { division, projectId, scoaItemId, functionId, regionId, fundId, planProjectItemId };
}

const PLAN_PROJECT_ITEMS_BY_YEAR_API = 'https://nicki-unrecuperated-counteractively.ngrok-free.dev/planning/references/project-items-by-year';

async function loadPlanProjectItems(finYear) {
  try {
    console.log(`[PPID] Loading all plan project items for ${finYear}...`);
    const startTime = Date.now();
    const resp = await globalThis.fetch(`${PLAN_PROJECT_ITEMS_BY_YEAR_API}?finyear=${encodeURIComponent(finYear)}`, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
      signal: AbortSignal.timeout(30000)
    });
    if (!resp.ok) {
      console.error(`[PPID] Failed to load plan project items: HTTP ${resp.status}`);
      return new Map();
    }
    const items = await resp.json();
    if (!Array.isArray(items)) return new Map();

    const lookup = new Map();
    for (const item of items) {
      const key = `${item.scoaItemId}|${item.projectId}|${item.scoaFunctionId || ''}|${item.scoaRegionId || ''}|${item.divisionId || ''}`;
      if (!lookup.has(key)) lookup.set(key, []);
      lookup.get(key).push(item);
    }
    console.log(`[PPID] Loaded ${items.length} items into ${lookup.size} lookup keys in ${Date.now() - startTime}ms`);
    return lookup;
  } catch (err) {
    console.error(`[PPID] Error loading plan project items:`, err.message);
    return new Map();
  }
}

function createPlanProjectItemResolver(lookup) {
  return function resolvePlanProjectItemId(finYear, scoaItemId, projectId, scoaFunctionId, scoaRegionId, divisionId, fundId) {
    if (!scoaItemId || !projectId) return null;

    const key = `${scoaItemId}|${projectId}|${scoaFunctionId || ''}|${scoaRegionId || ''}|${divisionId || ''}`;
    const rows = lookup.get(key);
    if (!rows || rows.length === 0) return null;

    if (fundId != null) {
      const match = rows.find(r => String(r.scoaFundId) === String(fundId));
      return match ? match.planProjectItemId : null;
    }

    return rows[0].planProjectItemId || null;
  };
}

async function executeForEmployees(runId, employeeFilter, userId) {
  const run = await dbQuery('SELECT * FROM payroll_runs WHERE id = $1', [runId]);
  if (run.rows.length === 0) {
    throw Object.assign(new Error('Payroll run not found'), { statusCode: 404, code: 'NOT_FOUND' });
  }
  if (!['PENDING', 'COMPLETED', 'PROCESSING', 'FAILED'].includes(run.rows[0].status)) {
    throw Object.assign(new Error(`Cannot execute from status ${run.rows[0].status}`), { statusCode: 400, code: 'INVALID_STATE' });
  }

  const [periodRes, cycleRes] = await Promise.all([
    dbQuery('SELECT * FROM payroll_periods WHERE id = $1', [run.rows[0].period_id]),
    dbQuery('SELECT * FROM payroll_cycles WHERE id = $1', [run.rows[0].cycle_id]),
  ]);
  const period = periodRes.rows[0];
  const cycle = cycleRes.rows[0];
  const taxTablesData = await loadTaxTables(period.tax_year);
  const finYear = period.financial_year || `${period.tax_year - 1}/${period.tax_year}`;
  const ppidLookup = await loadPlanProjectItems(finYear);
  const resolvePlanProjectItemId = createPlanProjectItemResolver(ppidLookup);

  let mocRulesMap = null;
  try {
    const mocResult = await dbQuery(
      `SELECT * FROM salary_head_formulas WHERE enabled = TRUE
       AND (start_date IS NULL OR start_date <= $1)
       AND (end_date IS NULL OR end_date >= $1)`,
      [period.end_date]
    );
    if (mocResult.rows.length > 0) {
      mocRulesMap = {};
      for (const rule of mocResult.rows) {
        if (!mocRulesMap[rule.salary_head_id]) mocRulesMap[rule.salary_head_id] = [];
        mocRulesMap[rule.salary_head_id].push(rule);
      }
    }
  } catch (e) { /* table may not exist yet */ }

  const runData = run.rows[0];
  const runType = runData.run_type || 'NORMAL';

  let employeeQuery = `SELECT e.id, e.employee_code, e.first_name, e.surname, e.annual_salary, e.monthly_salary,
      e.position_id, e.date_of_birth, e.dependants, e.exclude_uif, e.exclude_sdl,
      e.joining_date, e.is_councillor, e.joining_date AS date_engaged, e.end_date AS termination_date,
      e.employee_type_id, e.employee_subtype_id, e.condition_of_service_id,
      e.working_hours_per_month AS hours_worked, e.working_days_per_month AS days_worked,
      e.working_hours_per_day, e.salary_based_on, e.wage_rate,
      e.task_grade_id, e.current_notch,
      p.department_id, p.division_id,
      p.scoa_project_id AS pos_scoa_project_id, p.scoa_function_id AS pos_scoa_function_id,
      p.scoa_region_id AS pos_scoa_region_id, p.scoa_fund_id AS pos_scoa_fund_id,
      jp.task_grade_id AS jp_task_grade_id, jp.upper_limit_id AS jp_upper_limit_id
    FROM employees e
    LEFT JOIN positions p ON e.position_id = p.id
    LEFT JOIN job_profiles jp ON p.job_profile_id = jp.id
    WHERE e.status = 'ACTIVE' AND e.enabled = TRUE`;
  const empParams = [];
  let empParamIdx = 1;

  if (runData.cycle_id) {
    employeeQuery += ` AND (e.payroll_cycle_id = $${empParamIdx} OR e.payroll_cycle_id IS NULL)`;
    empParams.push(runData.cycle_id);
    empParamIdx++;
  }

  if (employeeFilter) {
    employeeQuery += ` AND e.id = $${empParamIdx}`;
    empParams.push(parseInt(employeeFilter, 10));
    empParamIdx++;
  }

  employeeQuery += ' ORDER BY e.id';

  const employees = await dbQuery(employeeQuery, empParams);

  if (employeeFilter && employees.rows.length === 0) {
    throw Object.assign(new Error('Employee not found or not active'), { statusCode: 404, code: 'NOT_FOUND' });
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    if (!employeeFilter) {
      await client.query(`UPDATE payroll_runs SET status = 'PROCESSING', started_at = NOW() WHERE id = $1`, [runId]);
      await client.query('DELETE FROM payroll_results WHERE run_id = $1', [runId]);
      await client.query('DELETE FROM payroll_run_errors WHERE run_id = $1', [runId]);
      runProgress[runId] = { total: employees.rows.length, processed: 0, errors: 0, currentEmployee: '', status: 'PROCESSING', startedAt: Date.now() };
    } else {
      await client.query('DELETE FROM payroll_results WHERE run_id = $1 AND employee_id = $2', [runId, parseInt(employeeFilter, 10)]);
      await client.query('DELETE FROM payroll_run_errors WHERE run_id = $1 AND employee_id = $2', [runId, parseInt(employeeFilter, 10)]);
    }

    await client.query('COMMIT');

    const employeeIds = employees.rows.map(e => e.id);

    let allTransactions;
    if (!employeeFilter && employeeIds.length > 0) {
      allTransactions = await dbQuery(
        `SELECT est.id AS est_id, est.employee_id, est.salary_head_id,
                sh.code AS head_code, sh.name AS head_name, sh.transaction_type, sh.irp5_code,
                sh.taxable, sh.affects_uif, sh.affects_sdl, sh.calculation_method, sh.priority,
                sh.scoa_debit_item, sh.scoa_credit_item
         FROM employee_salary_transactions est
         JOIN salary_heads sh ON est.salary_head_id = sh.id
         WHERE est.enabled = TRUE
         AND est.start_date <= $1 AND est.end_date >= $1
         ORDER BY est.employee_id, sh.priority, est.id`,
        [period.end_date]
      );
    } else if (employeeFilter) {
      allTransactions = await dbQuery(
        `SELECT est.id AS est_id, est.employee_id, est.salary_head_id,
                sh.code AS head_code, sh.name AS head_name, sh.transaction_type, sh.irp5_code,
                sh.taxable, sh.affects_uif, sh.affects_sdl, sh.calculation_method, sh.priority,
                sh.scoa_debit_item, sh.scoa_credit_item
         FROM employee_salary_transactions est
         JOIN salary_heads sh ON est.salary_head_id = sh.id
         WHERE est.employee_id = $1 AND est.enabled = TRUE
         AND est.start_date <= $2 AND est.end_date >= $2
         ORDER BY sh.priority, est.id`,
        [parseInt(employeeFilter, 10), period.end_date]
      );
    } else {
      allTransactions = { rows: [] };
    }

    const txByEmployee = {};
    for (const tx of allTransactions.rows) {
      tx.amount = 0;
      if (!txByEmployee[tx.employee_id]) txByEmployee[tx.employee_id] = [];
      txByEmployee[tx.employee_id].push(tx);
    }
    for (const empId of Object.keys(txByEmployee)) {
      const seen = new Set();
      txByEmployee[empId] = txByEmployee[empId].filter(tx => {
        if (seen.has(tx.salary_head_id)) return false;
        seen.add(tx.salary_head_id);
        return true;
      });
    }

    let allPayslipTransactions = { rows: [] };
    if (employeeIds.length > 0) {
      try {
        allPayslipTransactions = await dbQuery(
          `SELECT ept.id AS ept_id, ept.employee_salary_transaction_id, ept.employee_id,
                  ept.salary_head_id, ept.captured_amount, ept.period_id, ept.every_month,
                  ept.reference_no,
                  sh.code AS head_code, sh.name AS head_name, sh.transaction_type, sh.irp5_code,
                  sh.taxable, sh.affects_uif, sh.affects_sdl, sh.calculation_method, sh.priority,
                  sh.scoa_debit_item, sh.scoa_credit_item
           FROM employee_payslip_transactions ept
           JOIN salary_heads sh ON ept.salary_head_id = sh.id
           WHERE ept.enabled = TRUE
           AND (ept.every_month = TRUE OR ept.period_id = $1)
           ORDER BY ept.employee_id, sh.priority`,
          [period.id]
        );
      } catch (e) { console.warn('Could not load payslip transactions for trial run:', e.message); }
    }
    const payslipTxByEmployee = {};
    for (const pt of allPayslipTransactions.rows) {
      if (!payslipTxByEmployee[pt.employee_id]) payslipTxByEmployee[pt.employee_id] = [];
      payslipTxByEmployee[pt.employee_id].push(pt);
    }

    let allApprovedOT = { rows: [] };
    if (employeeIds.length > 0) {
      try {
        allApprovedOT = await dbQuery(
          `SELECT ot.employee_id, ot.salary_head_id, ot.hours, ot.rate_multiplier, ot.amount,
                  sh.code AS head_code, sh.name AS head_name, sh.irp5_code, sh.taxable,
                  sh.scoa_debit_item, sh.scoa_credit_item
           FROM overtime_transactions ot
           LEFT JOIN salary_heads sh ON ot.salary_head_id = sh.id
           WHERE ot.status = 'APPROVED' AND ot.period_id = $1`,
          [period.id]
        );
      } catch (e) { /* overtime table may not have matching data */ }
    }
    const otByEmployee = {};
    for (const ot of allApprovedOT.rows) {
      if (!otByEmployee[ot.employee_id]) otByEmployee[ot.employee_id] = [];
      otByEmployee[ot.employee_id].push(ot);
    }

    let allActiveInstalments = { rows: [] };
    if (employeeIds.length > 0) {
      try {
        allActiveInstalments = await dbQuery(
          `SELECT i.id, i.employee_id, i.salary_head_id, i.description, i.monthly_instalment, i.balance,
                  sh.code AS head_code, sh.name AS head_name, sh.irp5_code,
                  sh.scoa_debit_item, sh.scoa_credit_item
           FROM instalments i
           LEFT JOIN salary_heads sh ON i.salary_head_id = sh.id
           WHERE i.status = 'ACTIVE' AND i.balance > 0
             AND i.start_date <= $1
             AND (i.end_date IS NULL OR i.end_date >= $1)`,
          [period.end_date]
        );
      } catch (e) { /* instalments table may not have matching data */ }
    }
    const instByEmployee = {};
    for (const inst of allActiveInstalments.rows) {
      if (!instByEmployee[inst.employee_id]) instByEmployee[inst.employee_id] = [];
      instByEmployee[inst.employee_id].push(inst);
    }

    let allOutstandingArrears = { rows: [] };
    if (employeeIds.length > 0) {
      try {
        allOutstandingArrears = await dbQuery(
          `SELECT a.id, a.employee_id, a.salary_head_id, a.amount, a.reason,
                  sh.code AS head_code, sh.name AS head_name, sh.irp5_code,
                  sh.scoa_debit_item, sh.scoa_credit_item
           FROM arrears a
           LEFT JOIN salary_heads sh ON a.salary_head_id = sh.id
           WHERE a.recovered = FALSE`,
          []
        );
      } catch (e) { /* arrears table may not have data */ }
    }
    const arrearsByEmployee = {};
    for (const arr of allOutstandingArrears.rows) {
      if (!arrearsByEmployee[arr.employee_id]) arrearsByEmployee[arr.employee_id] = [];
      arrearsByEmployee[arr.employee_id].push(arr);
    }

    let allApprovedWages = { rows: [] };
    if (employeeIds.length > 0) {
      try {
        allApprovedWages = await dbQuery(
          `SELECT wt.employee_id, wt.id AS wt_id, wt.salary_head_id, wt.hours, wt.days, wt.rate, wt.amount,
                  sh.code AS head_code, sh.name AS head_name, sh.irp5_code, sh.taxable,
                  sh.affects_uif, sh.affects_sdl, sh.transaction_type,
                  sh.scoa_debit_item, sh.scoa_credit_item
           FROM wage_transactions wt
           LEFT JOIN salary_heads sh ON wt.salary_head_id = sh.id
           WHERE wt.status = 'APPROVED' AND wt.period_id = $1`,
          [period.id]
        );
      } catch (e) { /* wage_transactions table may not exist yet */ }
    }
    const wagesByEmployee = {};
    for (const wt of allApprovedWages.rows) {
      if (!wagesByEmployee[wt.employee_id]) wagesByEmployee[wt.employee_id] = [];
      wagesByEmployee[wt.employee_id].push(wt);
    }

    let allMedicalAids = { rows: [] };
    try {
      allMedicalAids = await dbQuery(
        `SELECT ema.employee_id, ema.id AS membership_id,
                ms.main_member_contribution, ms.adult_dependant_contribution, ms.child_dependant_contribution,
                ms.employer_contribution AS employee_percent, ms.employer_contribution_percentage AS employer_percent,
                ms.max_employer_contribution, ms.max_dependants, ms.max_child_dependants_only
         FROM employee_medical_aid ema
         JOIN medical_aid_schemes ms ON ema.scheme_id = ms.id
         WHERE ema.is_current = TRUE AND ema.join_date <= $1
           AND (ema.termination_date IS NULL OR ema.termination_date >= $2)`,
        [period.end_date, period.start_date]
      );
    } catch (e) { console.warn('Could not load medical aids for trial run:', e.message); }
    const medByEmployee = {};
    for (const m of allMedicalAids.rows) {
      medByEmployee[m.employee_id] = m;
    }

    let allMedDependants = { rows: [] };
    if (allMedicalAids.rows.length > 0) {
      const medMemberIds = allMedicalAids.rows.map(m => m.membership_id);
      try {
        allMedDependants = await dbQuery(
          `SELECT emd.employee_medical_aid_id, emd.dependant_type, emd.employer_contributes,
                  ema.employee_id
           FROM employee_medical_aid_dependants emd
           JOIN employee_medical_aid ema ON emd.employee_medical_aid_id = ema.id
           WHERE emd.employee_medical_aid_id = ANY($1)
             AND (emd.end_date IS NULL OR emd.end_date >= $2)
             AND emd.start_date <= $3`,
          [medMemberIds, period.start_date, period.end_date]
        );
      } catch (e) { console.warn('Could not load medical dependants for trial run:', e.message); }
    }
    const medDepsByEmployee = {};
    for (const d of allMedDependants.rows) {
      if (!medDepsByEmployee[d.employee_id]) medDepsByEmployee[d.employee_id] = [];
      medDepsByEmployee[d.employee_id].push(d);
    }

    let allRetirementFunds = { rows: [] };
    try {
      allRetirementFunds = await dbQuery(
        `SELECT erf.employee_id, erf.id, erf.fund_type_id, erf.employee_amount, erf.employer_amount,
                rft.code AS fund_code, rft.name AS fund_name, rft.fund_type,
                rft.employee_contribution_rate, rft.employer_contribution_rate,
                rft.employer_contribution_type, rft.employer_contribution_value,
                rft.employee_contribution_value, rft.employer_max_value, rft.employee_max_value
         FROM employee_retirement_funds erf
         JOIN retirement_fund_types rft ON erf.fund_type_id = rft.id
         WHERE erf.is_current = TRUE AND (erf.status IS NULL OR erf.status = 'ACTIVE')`,
        []
      );
    } catch (e) { console.warn('Could not load retirement funds for trial run:', e.message); }
    const retByEmployee = {};
    for (const rf of allRetirementFunds.rows) {
      if (!retByEmployee[rf.employee_id]) retByEmployee[rf.employee_id] = [];
      retByEmployee[rf.employee_id].push(rf);
    }

    let allUnionMemberships = { rows: [] };
    try {
      allUnionMemberships = await dbQuery(
        `SELECT eu.employee_id, eu.id, eu.trade_union_id, eu.join_date, eu.termination_date,
                tu.representative AS union_name, tu.contribution_type, tu.contribution_value, tu.maximum_value
         FROM employee_unions eu
         JOIN trade_unions tu ON eu.trade_union_id = tu.id
         WHERE eu.enabled = TRUE AND tu.enabled = TRUE
           AND eu.join_date <= $1 AND (eu.termination_date IS NULL OR eu.termination_date >= $2)`,
        [period.end_date, period.start_date]
      );
    } catch (e) { console.warn('Could not load union memberships for trial run:', e.message); }
    const unionByEmployee = {};
    for (const u of allUnionMemberships.rows) {
      if (!unionByEmployee[u.employee_id]) unionByEmployee[u.employee_id] = [];
      unionByEmployee[u.employee_id].push(u);
    }

    let allUpperLimitStructure = { rows: [] };
    if (employeeIds.length > 0) {
      try {
        allUpperLimitStructure = await dbQuery(
          `SELECT uls.employee_id, uls.salary_head_id, uls.amount, uls.included_in_package,
                  sh.code, sh.name, sh.transaction_type, sh.calculation_method,
                  sh.irp5_code, sh.taxable, sh.affects_uif, sh.affects_sdl, sh.priority,
                  sh.scoa_debit_item, sh.scoa_credit_item
           FROM employee_upper_limit_structure uls
           JOIN salary_heads sh ON uls.salary_head_id = sh.id
           WHERE uls.employee_id = ANY($1)
           ORDER BY uls.employee_id, sh.priority`,
          [employeeIds]
        );
      } catch (e) { /* table may not have data */ }
    }
    const ulStructByEmployee = {};
    for (const row of allUpperLimitStructure.rows) {
      if (!ulStructByEmployee[row.employee_id]) ulStructByEmployee[row.employee_id] = [];
      ulStructByEmployee[row.employee_id].push(row);
    }

    let allUpperLimitTargets = {};
    const upperLimitEmployeeIds = new Set();
    if (employeeIds.length > 0) {
      try {
        const ulTargetResult = await dbQuery(
          `SELECT e.id AS employee_id, e.upper_limit_value_type,
                  p.upper_limit_value_type AS pos_upper_limit_value_type,
                  sul.minimum_value, sul.midpoint_value, sul.maximum_value
           FROM employees e
           JOIN positions p ON e.position_id = p.id
           JOIN job_profiles jp ON p.job_profile_id = jp.id
           JOIN salary_upper_limits sul ON jp.upper_limit_id = sul.id
           WHERE jp.upper_limit_id IS NOT NULL
             AND sul.enabled = TRUE AND sul.start_date <= $1 AND sul.end_date >= $1`,
          [period.end_date]
        );
        for (const row of ulTargetResult.rows) {
          upperLimitEmployeeIds.add(row.employee_id);
          const vt = (row.upper_limit_value_type || row.pos_upper_limit_value_type || 'MIDPOINT').toUpperCase();
          let target = 0;
          if (vt === 'MINIMUM') target = parseFloat(row.minimum_value) || 0;
          else if (vt === 'MAXIMUM') target = parseFloat(row.maximum_value) || 0;
          else target = parseFloat(row.midpoint_value) || 0;
          allUpperLimitTargets[row.employee_id] = target;
        }
      } catch (e) { /* optional */ }
    }

    const prevPeriodBasics = {};
    try {
      const prevResults = await dbQuery(
        `SELECT DISTINCT ON (pr.employee_id) pr.employee_id, pr.amount
         FROM payroll_results pr
         JOIN payroll_runs prr ON pr.run_id = prr.id
         JOIN payroll_periods pp ON prr.period_id = pp.id
         LEFT JOIN salary_heads sh ON pr.salary_head_id = sh.id
         WHERE COALESCE(sh.code, pr.head_code, '') IN ('BASIC','BASIC_SALARY') AND pp.end_date < $1
         AND pp.cycle_id = $2
         ORDER BY pr.employee_id, pp.end_date DESC`,
        [period.start_date, cycle.id]
      );
      for (const row of prevResults.rows) {
        prevPeriodBasics[row.employee_id] = parseFloat(row.amount) || 0;
      }
    } catch (e) { /* prev period data optional */ }

    const glConfigByHeadId = {};
    try {
      const glResult = await dbQuery('SELECT * FROM payroll_gl_items');
      for (const g of glResult.rows) {
        glConfigByHeadId[g.salary_head_id] = g;
      }
    } catch (e) { /* GL config optional */ }

    let totalEarnings = 0, totalDeductions = 0, totalCompany = 0, totalNett = 0;
    let totalPaye = 0, totalUif = 0, totalSdl = 0, totalETI = 0, errorCount = 0;

    let resultsBatch = [];
    let errorsBatch = [];
    const instalmentUpdates = [];
    const arrearRecoveries = [];
    const newArrears = [];

    async function flushResults() {
      if (resultsBatch.length === 0) return;
      const cols = 27;
      const values = [];
      const placeholders = [];
      for (let i = 0; i < resultsBatch.length; i++) {
        const r = resultsBatch[i];
        const offset = i * cols;
        const ph = [];
        for (let c = 1; c <= cols; c++) ph.push(`$${offset + c}`);
        placeholders.push(`(${ph.join(',')})`);
        values.push(r.run_id, r.period_id, r.cycle_id, r.employee_id, r.salary_head_id,
          r.department_id, r.division_id, r.transaction_type, r.irp5_code,
          r.amount, r.calculation_detail, r.tax_period, r.tax_year,
          r.scoa_item_id, r.contra_scoa_item_id, r.head_code,
          r.scoa_project_id, r.scoa_function_id, r.scoa_region_id, r.scoa_fund_id,
          r.contra_scoa_project_id, r.contra_scoa_function_id, r.contra_scoa_region_id, r.contra_scoa_fund_id,
          r.contra_division_id, r.debit_plan_project_item_id, r.credit_plan_project_item_id);
      }
      await dbQuery(
        `INSERT INTO payroll_results (run_id, period_id, cycle_id, employee_id, salary_head_id, department_id, division_id,
         transaction_type, irp5_code, amount, calculation_detail, tax_period, tax_year, scoa_item_id, contra_scoa_item_id, head_code,
         scoa_project_id, scoa_function_id, scoa_region_id, scoa_fund_id,
         contra_scoa_project_id, contra_scoa_function_id, contra_scoa_region_id, contra_scoa_fund_id,
         contra_division_id, debit_plan_project_item_id, credit_plan_project_item_id)
         VALUES ${placeholders.join(',')}`,
        values
      );
      resultsBatch = [];
    }

    async function flushErrors() {
      if (errorsBatch.length === 0) return;
      const cols = 5;
      const values = [];
      const placeholders = [];
      for (let i = 0; i < errorsBatch.length; i++) {
        const e = errorsBatch[i];
        const offset = i * cols;
        placeholders.push(`($${offset+1},$${offset+2},$${offset+3},$${offset+4},$${offset+5})`);
        values.push(e.run_id, e.employee_id, e.error_type, e.error_message, e.severity);
      }
      await dbQuery(
        `INSERT INTO payroll_run_errors (run_id, employee_id, error_type, error_message, severity)
         VALUES ${placeholders.join(',')}`,
        values
      );
      errorsBatch = [];
    }

    for (let ei = 0; ei < employees.rows.length; ei++) {
      const emp = employees.rows[ei];
      if (!employeeFilter && runProgress[runId]) {
        runProgress[runId].processed = ei;
        if (ei % 50 === 0) {
          runProgress[runId].currentEmployee = `${emp.employee_code} - ${emp.first_name} ${emp.surname}`;
        }
      }
      try {
        if (prevPeriodBasics[emp.id]) {
          emp.prev_basic_salary = prevPeriodBasics[emp.id];
          emp.prev_annual_salary = prevPeriodBasics[emp.id] * (cycle.periods_per_year || 12);
        }

        const empUlStruct = ulStructByEmployee[emp.id] || [];
        const empUlTarget = allUpperLimitTargets[emp.id] || 0;
        const isUpperLimitEmp = upperLimitEmployeeIds.has(emp.id);

        if (isUpperLimitEmp) {
          let includedSum = 0;
          for (const sr of empUlStruct) {
            if (sr.included_in_package) includedSum += parseFloat(sr.amount) || 0;
          }
          const balanceVariance = Math.abs(empUlTarget - includedSum);
          if (balanceVariance > 5.00) {
            throw new Error(
              `Upper Limit salary structure for employee ${emp.employee_code || emp.id} is not balanced. ` +
              `Target: R${empUlTarget.toFixed(2)}, structure: R${includedSum.toFixed(2)}, ` +
              `variance: R${balanceVariance.toFixed(2)} (exceeds R5.00 tolerance).`
            );
          }
        }

        const ulAmountsByHeadId = {};
        if (isUpperLimitEmp) {
          for (const sr of empUlStruct) {
            ulAmountsByHeadId[sr.salary_head_id] = {
              annualAmount: parseFloat(sr.amount) || 0,
              monthlyAmount: parseFloat(((parseFloat(sr.amount) || 0) / 12).toFixed(2)),
              code: sr.code,
              name: sr.name,
              transaction_type: sr.transaction_type,
              calculation_method: sr.calculation_method,
              irp5_code: sr.irp5_code,
              taxable: sr.taxable,
              affects_uif: sr.affects_uif,
              affects_sdl: sr.affects_sdl,
              priority: sr.priority,
              scoa_debit_item: sr.scoa_debit_item,
              scoa_credit_item: sr.scoa_credit_item,
            };
          }
        }

        const estLinks = txByEmployee[emp.id] || [];
        const empPayslipTxs = payslipTxByEmployee[emp.id] || [];
        const payslipTxByHead = {};
        for (const pt of empPayslipTxs) {
          if (!payslipTxByHead[pt.salary_head_id]) payslipTxByHead[pt.salary_head_id] = [];
          payslipTxByHead[pt.salary_head_id].push(pt);
        }
        const empTransactions = [];
        if (isUpperLimitEmp) {
          for (const est of estLinks) {
            if (ulAmountsByHeadId[est.salary_head_id]) {
              const ulRow = ulAmountsByHeadId[est.salary_head_id];
              if (ulRow.calculation_method !== 'SYSTEM_CALCULATE' && ulRow.calculation_method !== 'FORMULA') {
                empTransactions.push({
                  est_id: est.est_id, employee_id: emp.id, salary_head_id: est.salary_head_id,
                  amount: ulRow.monthlyAmount,
                  head_code: ulRow.code, head_name: ulRow.name, transaction_type: ulRow.transaction_type,
                  irp5_code: ulRow.irp5_code, taxable: ulRow.taxable, affects_uif: ulRow.affects_uif,
                  affects_sdl: ulRow.affects_sdl, calculation_method: null, priority: ulRow.priority,
                  scoa_debit_item: ulRow.scoa_debit_item, scoa_credit_item: ulRow.scoa_credit_item,
                  is_upper_limit_structure: true
                });
                continue;
              }
            }
            const isFormula = est.calculation_method === 'SYSTEM_CALCULATE' || est.calculation_method === 'FORMULA';
            empTransactions.push({
              est_id: est.est_id, employee_id: emp.id, salary_head_id: est.salary_head_id,
              amount: 0,
              head_code: est.head_code, head_name: est.head_name, transaction_type: est.transaction_type,
              irp5_code: est.irp5_code, taxable: est.taxable, affects_uif: est.affects_uif,
              affects_sdl: est.affects_sdl, calculation_method: isFormula ? est.calculation_method : null, priority: est.priority,
              scoa_debit_item: est.scoa_debit_item, scoa_credit_item: est.scoa_credit_item
            });
          }
          const estHeadIds = new Set(estLinks.map(r => r.salary_head_id));
          for (const sr of empUlStruct) {
            if (!estHeadIds.has(sr.salary_head_id) && sr.calculation_method !== 'SYSTEM_CALCULATE' && sr.calculation_method !== 'FORMULA') {
              const ulRow = ulAmountsByHeadId[sr.salary_head_id];
              empTransactions.push({
                est_id: null, employee_id: emp.id, salary_head_id: sr.salary_head_id,
                amount: ulRow.monthlyAmount,
                head_code: ulRow.code, head_name: ulRow.name, transaction_type: ulRow.transaction_type,
                irp5_code: ulRow.irp5_code, taxable: ulRow.taxable, affects_uif: ulRow.affects_uif,
                affects_sdl: ulRow.affects_sdl, calculation_method: null, priority: ulRow.priority,
                scoa_debit_item: ulRow.scoa_debit_item, scoa_credit_item: ulRow.scoa_credit_item,
                is_upper_limit_structure: true
              });
            }
          }
        } else {
          for (const est of estLinks) {
            const headPts = payslipTxByHead[est.salary_head_id] || [];
            if (headPts.length > 0) {
              for (const pt of headPts) {
                empTransactions.push({
                  est_id: est.est_id, ept_id: pt.ept_id, employee_id: emp.id, salary_head_id: est.salary_head_id,
                  amount: parseFloat(pt.captured_amount) || 0,
                  reference_no: pt.reference_no || '',
                  head_code: est.head_code, head_name: est.head_name, transaction_type: est.transaction_type,
                  irp5_code: est.irp5_code, taxable: est.taxable, affects_uif: est.affects_uif,
                  affects_sdl: est.affects_sdl, calculation_method: est.calculation_method, priority: est.priority,
                  scoa_debit_item: est.scoa_debit_item, scoa_credit_item: est.scoa_credit_item,
                  is_payslip_transaction: true
                });
              }
            } else {
              empTransactions.push({
                est_id: est.est_id, employee_id: emp.id, salary_head_id: est.salary_head_id,
                amount: 0,
                head_code: est.head_code, head_name: est.head_name, transaction_type: est.transaction_type,
                irp5_code: est.irp5_code, taxable: est.taxable, affects_uif: est.affects_uif,
                affects_sdl: est.affects_sdl, calculation_method: est.calculation_method, priority: est.priority,
                scoa_debit_item: est.scoa_debit_item, scoa_credit_item: est.scoa_credit_item
              });
            }
          }
        }

        const empWages = wagesByEmployee[emp.id] || [];
        for (const wt of empWages) {
          empTransactions.push({
            employee_id: emp.id, salary_head_id: wt.salary_head_id,
            amount: parseFloat(wt.amount) || 0,
            head_code: wt.head_code, head_name: wt.head_name, transaction_type: wt.transaction_type,
            irp5_code: wt.irp5_code, taxable: wt.taxable, affects_uif: wt.affects_uif,
            affects_sdl: wt.affects_sdl, calculation_method: 'FIXED',
            scoa_debit_item: wt.scoa_debit_item, scoa_credit_item: wt.scoa_credit_item,
            formula: null, is_wage_transaction: true
          });
        }
        normalizeTransactionsToMonthly(empTransactions, cycle.periods_per_year || 12, emp);

        const ppy = cycle.periods_per_year || 12;
        const BASIC_CODES_SET = new Set(['BASIC', 'BASIC_SALARY']);
        let empMonthlyBasic;
        if (isUpperLimitEmp) {
          const basicStructRow = empUlStruct.find(sr => BASIC_CODES_SET.has(sr.code));
          if (!basicStructRow) {
            throw new Error(`Upper Limit employee ${emp.employee_code || emp.id} has no BASIC salary in the salary structure table. Please add a BASIC salary component before running payroll.`);
          }
          const basicAnnual = parseFloat(basicStructRow.amount) || 0;
          if (basicAnnual <= 0) {
            throw new Error(`Upper Limit employee ${emp.employee_code || emp.id} has R0.00 BASIC in salary structure.`);
          }
          empMonthlyBasic = parseFloat((basicAnnual / 12).toFixed(2));
          emp.monthly_salary = empMonthlyBasic;
          emp.annual_salary = basicAnnual;
        } else {
          empMonthlyBasic = resolveMonthlyBasic(emp, ppy);
        }

        const empMedDeps = medDepsByEmployee[emp.id] || [];
        if (empMedDeps.length > 0 || medByEmployee[emp.id]) {
          emp.dependants = empMedDeps.length;
        }

        const empMed = medByEmployee[emp.id];
        if (empMed) {
          const s = empMed;
          const memberVal = parseFloat(s.main_member_contribution) || 0;
          const adultVal = parseFloat(s.adult_dependant_contribution) || 0;
          const childVal = parseFloat(s.child_dependant_contribution) || 0;
          const eePct = parseFloat(s.employee_percent) || 0;
          const erPct = parseFloat(s.employer_percent) || 0;
          const maxErVal = parseFloat(s.max_employer_contribution) || 0;
          const maxDeps = parseInt(s.max_dependants) || 999;
          const maxChildOnly = s.max_child_dependants_only === true;
          const deps = medDepsByEmployee[emp.id] || [];
          let adults = 0, children = 0;
          for (const d of deps) {
            const rt = (d.dependant_type || '').toUpperCase();
            if (['CHILD','MINOR','DEPENDANT_CHILD'].includes(rt)) children++;
            else adults++;
          }
          if (maxChildOnly) {
            if (children > maxDeps) children = maxDeps;
          } else {
            const totalDeps = adults + children;
            if (totalDeps > maxDeps) {
              const cappedAdults = Math.min(adults, maxDeps);
              adults = cappedAdults;
              children = Math.min(children, Math.max(0, maxDeps - cappedAdults));
            }
          }
          const totalMedCost = parseFloat((memberVal + (adultVal * adults) + (childVal * children)).toFixed(2));
          let medErAmount = parseFloat((totalMedCost * (erPct / 100)).toFixed(2));
          let medEeAmount = parseFloat((totalMedCost * (eePct / 100)).toFixed(2));
          if (maxErVal > 0 && medErAmount > maxErVal) {
            medEeAmount = parseFloat((medEeAmount + (medErAmount - maxErVal)).toFixed(2));
            medErAmount = maxErVal;
          }
          if (medEeAmount > 0) {
            empTransactions.push({ est_id: null, employee_id: emp.id, salary_head_id: null, amount: medEeAmount, percentage: null, head_code: 'MED_EE', head_name: 'Medical Aid Employee', transaction_type: 'DEDUCTION', irp5_code: '4005', taxable: false, calculation_method: null, priority: 50, scoa_debit_item: null, scoa_credit_item: null, formula: null, is_system_generated: true });
          }
          if (medErAmount > 0) {
            empTransactions.push({ est_id: null, employee_id: emp.id, salary_head_id: null, amount: medErAmount, percentage: null, head_code: 'MED_ER', head_name: 'Medical Aid Employer', transaction_type: 'COMPANY_CONTRIBUTION', irp5_code: null, taxable: false, calculation_method: null, priority: 50, scoa_debit_item: null, scoa_credit_item: null, formula: null, is_system_generated: true });
          }
          if (medErAmount > 0) {
            empTransactions.push({ est_id: null, employee_id: emp.id, salary_head_id: null, amount: medErAmount, percentage: null, head_code: 'MED_FRINGE', head_name: 'Medical Aid Fringe', transaction_type: 'FRINGE_BENEFIT', irp5_code: '3810', taxable: true, calculation_method: null, priority: 50, scoa_debit_item: null, scoa_credit_item: null, formula: null, is_system_generated: true });
          }
        }

        const empRetFunds = retByEmployee[emp.id] || [];
        if (empRetFunds.length > 0) {
          let retEeAmount = 0, retErAmount = 0;
          for (const rf of empRetFunds) {
            let ee = 0, er = 0;
            const eeOverride = parseFloat(rf.employee_amount) || 0;
            const erOverride = parseFloat(rf.employer_amount) || 0;
            const contribType = (rf.employer_contribution_type || '').toUpperCase();
            if (eeOverride > 0) { ee = eeOverride; }
            else if (contribType === 'PERCENTAGE') { const eeVal = parseFloat(rf.employee_contribution_value) || parseFloat(rf.employee_contribution_rate) || 0; ee = parseFloat((empMonthlyBasic * eeVal / 100).toFixed(2)); }
            else { ee = parseFloat(rf.employee_contribution_value) || 0; if (ee === 0 && parseFloat(rf.employee_contribution_rate) > 0) ee = parseFloat((empMonthlyBasic * parseFloat(rf.employee_contribution_rate) / 100).toFixed(2)); }
            if (erOverride > 0) { er = erOverride; }
            else if (contribType === 'PERCENTAGE') { const erVal = parseFloat(rf.employer_contribution_value) || parseFloat(rf.employer_contribution_rate) || 0; er = parseFloat((empMonthlyBasic * erVal / 100).toFixed(2)); }
            else { er = parseFloat(rf.employer_contribution_value) || 0; if (er === 0 && parseFloat(rf.employer_contribution_rate) > 0) er = parseFloat((empMonthlyBasic * parseFloat(rf.employer_contribution_rate) / 100).toFixed(2)); }
            const erMax = parseFloat(rf.employer_max_value) || 0;
            if (erMax > 0 && er > erMax) er = erMax;
            const eeMax = parseFloat(rf.employee_max_value) || 0;
            if (eeMax > 0 && ee > eeMax) ee = eeMax;
            retEeAmount += ee;
            retErAmount += er;
          }
          if (retEeAmount > 0) {
            empTransactions.push({ est_id: null, employee_id: emp.id, salary_head_id: null, amount: retEeAmount, percentage: null, head_code: 'PEN_EE', head_name: 'Pension Fund (Employee)', transaction_type: 'DEDUCTION', irp5_code: '4001', taxable: false, calculation_method: null, priority: 51, scoa_debit_item: null, scoa_credit_item: null, formula: null, is_system_generated: true });
          }
          if (retErAmount > 0) {
            empTransactions.push({ est_id: null, employee_id: emp.id, salary_head_id: null, amount: retErAmount, percentage: null, head_code: 'PEN_ER', head_name: 'Pension Fund (Employer)', transaction_type: 'COMPANY_CONTRIBUTION', irp5_code: null, taxable: false, calculation_method: null, priority: 51, scoa_debit_item: null, scoa_credit_item: null, formula: null, is_system_generated: true });
          }
          if (retErAmount > 0) {
            empTransactions.push({ est_id: null, employee_id: emp.id, salary_head_id: null, amount: retErAmount, percentage: null, head_code: 'PEN_FRINGE', head_name: 'Pension Fund (Fringe)', transaction_type: 'FRINGE_BENEFIT', irp5_code: '3825', taxable: true, calculation_method: null, priority: 51, scoa_debit_item: null, scoa_credit_item: null, formula: null, is_system_generated: true });
          }
        }

        const empUnions = unionByEmployee[emp.id] || [];
        if (empUnions.length > 0) {
          let unionFeeTotal = 0;
          for (const um of empUnions) {
            const contribType = (um.contribution_type || '').trim();
            const contribValue = parseFloat(um.contribution_value) || 0;
            const maxValue = parseFloat(um.maximum_value) || 0;
            let fee = 0;
            if (contribType === '%') { fee = parseFloat((empMonthlyBasic * contribValue / 100).toFixed(2)); if (maxValue > 0 && fee > maxValue) fee = maxValue; }
            else { fee = contribValue; if (maxValue > 0 && fee > maxValue) fee = maxValue; }
            unionFeeTotal += fee;
          }
          if (unionFeeTotal > 0) {
            empTransactions.push({ est_id: null, employee_id: emp.id, salary_head_id: null, amount: parseFloat(unionFeeTotal.toFixed(2)), percentage: null, head_code: 'UNION_FEES', head_name: 'Union Fees', transaction_type: 'DEDUCTION', irp5_code: null, taxable: false, calculation_method: null, priority: 52, scoa_debit_item: null, scoa_credit_item: null, formula: null, is_system_generated: true });
          }
        }

        const calcResult = calculateForEmployee(emp, empTransactions, taxTablesData, period, cycle, mocRulesMap);

        const posScoa = {
          division_id: emp.division_id,
          pos_scoa_project_id: emp.pos_scoa_project_id || null,
          pos_scoa_function_id: emp.pos_scoa_function_id || null,
          pos_scoa_region_id: emp.pos_scoa_region_id || null,
          pos_scoa_fund_id: emp.pos_scoa_fund_id || null,
        };
        const empTypeId = emp.employee_type_id || null;

        for (const row of calcResult.results) {
          let resolvedHeadId = row.salary_head_id;
          if (!resolvedHeadId && row.head_code && taxTablesData.systemHeads) {
            const sysHead = taxTablesData.systemHeads[row.head_code];
            if (sysHead) resolvedHeadId = sysHead.id;
          }

          const isFringe = row.transaction_type === 'FRINGE_BENEFIT';
          const gl = resolvedHeadId ? (glConfigByHeadId[resolvedHeadId] || null) : null;

          let debit = { division: emp.division_id, projectId: null, scoaItemId: null, functionId: null, regionId: null, fundId: null, planProjectItemId: null };
          let credit = { division: emp.division_id, projectId: null, scoaItemId: null, functionId: null, regionId: null, fundId: null, planProjectItemId: null };

          if (!isFringe) {
            debit = allocateDebitScoa(row.transaction_type, empTypeId, gl, posScoa, row.amount);
            credit = allocateCreditScoa(row.transaction_type, gl, posScoa, row.amount, debit.fundId);

            if (!debit.planProjectItemId && debit.scoaItemId && debit.projectId) {
              debit.planProjectItemId = resolvePlanProjectItemId(
                finYear, debit.scoaItemId, debit.projectId, debit.functionId, debit.regionId, debit.division, debit.fundId
              );
            }
            if (!credit.planProjectItemId && credit.scoaItemId && credit.projectId) {
              credit.planProjectItemId = resolvePlanProjectItemId(
                finYear, credit.scoaItemId, credit.projectId, credit.functionId, credit.regionId, credit.division, credit.fundId
              );
            }
          }

          resultsBatch.push({
            run_id: runId, period_id: run.rows[0].period_id, cycle_id: run.rows[0].cycle_id,
            employee_id: emp.id, salary_head_id: resolvedHeadId,
            department_id: emp.department_id, division_id: debit.division,
            transaction_type: row.transaction_type, irp5_code: row.irp5_code,
            amount: row.amount,
            calculation_detail: row.calculation_detail ? JSON.stringify(row.calculation_detail) : null,
            tax_period: period.tax_period, tax_year: period.tax_year,
            scoa_item_id: isFringe ? (row.scoa_item_id || null) : (debit.scoaItemId || row.scoa_item_id || null),
            contra_scoa_item_id: isFringe ? (row.contra_scoa_item_id || null) : (credit.scoaItemId || row.contra_scoa_item_id || null),
            head_code: row.head_code || null,
            scoa_project_id: debit.projectId,
            scoa_function_id: debit.functionId,
            scoa_region_id: debit.regionId,
            scoa_fund_id: debit.fundId,
            contra_scoa_project_id: credit.projectId,
            contra_scoa_function_id: credit.functionId,
            contra_scoa_region_id: credit.regionId,
            contra_scoa_fund_id: credit.fundId,
            contra_division_id: credit.division,
            debit_plan_project_item_id: debit.planProjectItemId,
            credit_plan_project_item_id: credit.planProjectItemId,
          });
        }

        if (resultsBatch.length >= BATCH_INSERT_SIZE) {
          await flushResults();
        }

        totalEarnings += calcResult.summary.gross_earnings;
        totalDeductions += calcResult.summary.total_deductions;
        totalCompany += calcResult.summary.company_contributions;
        totalNett += calcResult.summary.nett_pay;
        totalPaye += calcResult.summary.paye;
        totalUif += calcResult.summary.uif_employee;
        totalSdl += calcResult.summary.sdl;
      } catch (empErr) {
        errorCount++;
        if (!employeeFilter && runProgress[runId]) runProgress[runId].errors++;
        errorsBatch.push({
          run_id: runId, employee_id: emp.id, error_type: 'PROCESSING_ERROR',
          error_message: empErr.message, severity: 'ERROR'
        });
        if (errorsBatch.length >= BATCH_INSERT_SIZE) {
          await flushErrors();
        }
      }
    }

    await flushResults();
    await flushErrors();

    let updatedRun;
    if (employeeFilter) {
      const runTotals = await dbQuery(
        `SELECT COUNT(DISTINCT employee_id) AS emp_count,
                COALESCE(SUM(CASE WHEN transaction_type='EARNING' THEN amount ELSE 0 END),0) AS tot_earn,
                COALESCE(SUM(CASE WHEN transaction_type='DEDUCTION' THEN amount ELSE 0 END),0) AS tot_ded,
                COALESCE(SUM(CASE WHEN transaction_type='COMPANY_CONTRIBUTION' THEN amount ELSE 0 END),0) AS tot_co,
                COALESCE(SUM(CASE WHEN transaction_type='EARNING' THEN amount ELSE 0 END),0) -
                COALESCE(SUM(CASE WHEN transaction_type='DEDUCTION' THEN amount ELSE 0 END),0) AS tot_nett
         FROM payroll_results WHERE run_id = $1`, [runId]
      );
      const t = runTotals.rows[0];
      const errTotals = await dbQuery('SELECT COUNT(*) AS cnt FROM payroll_run_errors WHERE run_id = $1', [runId]);
      const statTotals = await dbQuery(
        `SELECT COALESCE(SUM(pr.amount) FILTER (WHERE sh.code = 'PAYE'), 0) AS tot_paye,
                COALESCE(SUM(pr.amount) FILTER (WHERE sh.code = 'UIF_EE'), 0) AS tot_uif,
                COALESCE(SUM(pr.amount) FILTER (WHERE sh.code = 'SDL'), 0) AS tot_sdl
         FROM payroll_results pr LEFT JOIN salary_heads sh ON pr.salary_head_id = sh.id WHERE pr.run_id = $1`, [runId]
      );
      const st = statTotals.rows[0];
      updatedRun = await dbQuery(
        `UPDATE payroll_runs SET
          employee_count = $1, total_earnings = $2, total_deductions = $3,
          total_company_contributions = $4, total_nett = $5, total_paye = $6, total_uif = $7, total_sdl = $8,
          errors_count = $9, run_by = $10
         WHERE id = $11 RETURNING *`,
        [parseInt(t.emp_count), parseFloat(t.tot_earn).toFixed(2), parseFloat(t.tot_ded).toFixed(2),
         parseFloat(t.tot_co).toFixed(2), parseFloat(t.tot_nett).toFixed(2),
         parseFloat(st.tot_paye).toFixed(2), parseFloat(st.tot_uif).toFixed(2), parseFloat(st.tot_sdl).toFixed(2),
         parseInt(errTotals.rows[0].cnt), userId, runId]
      );
    } else {
      const isFinalType = ['FINAL', 'ADHOC_FINAL'].includes(runType);
      const finalStatus = isFinalType ? 'LOCKED' : 'COMPLETED';
      updatedRun = await dbQuery(
        `UPDATE payroll_runs SET
          status = $1, employee_count = $2, total_earnings = $3, total_deductions = $4,
          total_company_contributions = $5, total_nett = $6, total_paye = $7, total_uif = $8, total_sdl = $9,
          errors_count = $10, run_by = $11, completed_at = NOW()${isFinalType ? ', locked_at = NOW(), locked_by = $12' : ''}
         WHERE id = $${isFinalType ? 13 : 12} RETURNING *`,
        isFinalType
          ? [finalStatus, employees.rows.length, totalEarnings.toFixed(2), totalDeductions.toFixed(2),
             totalCompany.toFixed(2), totalNett.toFixed(2), totalPaye.toFixed(2), totalUif.toFixed(2), totalSdl.toFixed(2),
             errorCount, userId, userId, runId]
          : [finalStatus, employees.rows.length, totalEarnings.toFixed(2), totalDeductions.toFixed(2),
             totalCompany.toFixed(2), totalNett.toFixed(2), totalPaye.toFixed(2), totalUif.toFixed(2), totalSdl.toFixed(2),
             errorCount, userId, runId]
      );
      if (isFinalType) {
        try {
          await dbQuery(`UPDATE payroll_periods SET status = 'LOCKED' WHERE id = $1`, [period.id]);
        } catch (e) {}
      }
    }

    if (runProgress[runId]) {
      runProgress[runId].processed = employees.rows.length;
      runProgress[runId].status = 'COMPLETED';
      runProgress[runId].currentEmployee = '';
      setTimeout(() => { delete runProgress[runId]; }, 120000);
    }

    return {
      run: updatedRun.rows[0],
      employeeCount: employees.rows.length,
      errorCount,
      totals: { paye: totalPaye, uif: totalUif, sdl: totalSdl },
    };
  } catch (outerErr) {
    if (runProgress[runId]) { runProgress[runId].status = 'FAILED'; runProgress[runId].error_message = outerErr.message; setTimeout(() => delete runProgress[runId], 60000); }
    throw outerErr;
  } finally {
    client.release();
  }
}

router.get('/runs/:id/progress', authenticate, async (req, res) => {
  const runId = parseInt(req.params.id, 10);
  const progress = runProgress[runId];
  if (progress) {
    const elapsed = Date.now() - progress.startedAt;
    const rate = progress.processed > 0 ? elapsed / progress.processed : 0;
    const remaining = progress.total - progress.processed;
    const eta = rate > 0 ? Math.round((remaining * rate) / 1000) : null;
    return res.json({
      success: true,
      data: {
        total: progress.total,
        processed: progress.processed,
        errors: progress.errors,
        percent: progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0,
        currentEmployee: progress.currentEmployee,
        status: progress.status,
        error_message: progress.error_message || null,
        eta_seconds: eta,
        elapsed_ms: elapsed
      }
    });
  }
  const run = await dbQuery('SELECT id, status, employee_count, errors_count FROM payroll_runs WHERE id = $1', [runId]);
  if (run.rows.length === 0) return res.status(404).json({ success: false });
  const r = run.rows[0];
  res.json({
    success: true,
    data: {
      total: r.employee_count || 0,
      processed: r.employee_count || 0,
      errors: r.errors_count || 0,
      percent: r.status === 'COMPLETED' ? 100 : 0,
      currentEmployee: '',
      status: r.status,
      eta_seconds: null,
      elapsed_ms: null
    }
  });
});

router.post('/runs/:id/execute', authenticate, auditLog('CREATE', 'payroll_execution'), async (req, res, next) => {
  const runId = req.params.id;
  const { employee_id } = req.query;
  const { async: runAsync } = req.body || {};

  if (runAsync && !employee_id) {
    try {
      const run = await dbQuery('SELECT status FROM payroll_runs WHERE id = $1', [runId]);
      if (run.rows.length === 0) return res.status(404).json({ success: false, error: { message: 'Run not found' } });
      if (!['PENDING', 'COMPLETED', 'PROCESSING', 'FAILED'].includes(run.rows[0].status)) {
        return res.status(400).json({ success: false, error: { message: `Cannot execute from status ${run.rows[0].status}` } });
      }
      res.json({ success: true, message: 'Payroll execution started', async: true });
      executeForEmployees(runId, null, req.user?.id || 1).catch(async (err) => {
        console.error(`Async payroll run ${runId} failed:`, err.message);
        if (runProgress[runId]) { runProgress[runId].status = 'FAILED'; setTimeout(() => delete runProgress[runId], 60000); }
        await dbQuery(`UPDATE payroll_runs SET status = 'FAILED', completed_at = NOW() WHERE id = $1`, [runId]);
      });
      return;
    } catch (err) {
      return next(err);
    }
  }

  try {
    const result = await executeForEmployees(runId, employee_id, req.user?.id || 1);

    res.json({
      success: true,
      data: result.run,
      totals: result.totals,
      message: `Payroll executed for ${result.employeeCount} employee(s) with ${result.errorCount} error(s)`
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: { code: err.code, message: err.message } });
    }
    if (runProgress[runId]) { runProgress[runId].status = 'FAILED'; setTimeout(() => delete runProgress[runId], 60000); }
    await dbQuery(`UPDATE payroll_runs SET status = 'FAILED', completed_at = NOW() WHERE id = $1`, [runId]);
    next(err);
  }
});

router.post('/runs/:id/execute-single', authenticate, auditLog('CREATE', 'payroll_execution_single'), async (req, res, next) => {
  try {
    const { employee_id } = req.body;
    if (!employee_id) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'employee_id is required' } });
    }

    const result = await executeForEmployees(req.params.id, employee_id, req.user?.id || 1);

    const empResults = await dbQuery(
      `SELECT pr.*, sh.code AS salary_head_code, sh.name AS salary_head_name
       FROM payroll_results pr
       LEFT JOIN salary_heads sh ON pr.salary_head_id = sh.id
       WHERE pr.run_id = $1 AND pr.employee_id = $2
       ORDER BY pr.transaction_type, sh.priority`,
      [req.params.id, parseInt(employee_id, 10)]
    );

    res.json({
      success: true,
      data: {
        run: result.run,
        employee_results: empResults.rows,
        totals: result.totals,
      },
      message: `Single employee payroll executed with ${result.errorCount} error(s)`
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: { code: err.code, message: err.message } });
    }
    next(err);
  }
});

router.post('/runs/:id/lock', authenticate, auditLog('UPDATE', 'payroll_run'), async (req, res, next) => {
  try {
    const run = await dbQuery('SELECT run_type, status, cycle_id, period_id FROM payroll_runs WHERE id = $1', [req.params.id]);
    if (run.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payroll run not found' } });
    }
    if (run.rows[0].status !== 'COMPLETED') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Run must be COMPLETED to lock' } });
    }
    const result = await dbQuery(
      `UPDATE payroll_runs SET status = 'LOCKED', locked_at = NOW(), locked_by = $1 WHERE id = $2 AND status = 'COMPLETED' RETURNING *`,
      [req.user?.id || 1, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Run must be COMPLETED to lock' } });
    }
    try {
      await dbQuery(`UPDATE payroll_periods SET status = 'LOCKED' WHERE id = $1`, [run.rows[0].period_id]);
    } catch (e) {}
    res.json({ success: true, data: result.rows[0], message: 'Payroll run locked' });
  } catch (err) {
    next(err);
  }
});

router.post('/runs/:id/approve', authenticate, auditLog('APPROVE', 'payroll_run'), async (req, res, next) => {
  try {
    const runCheck = await dbQuery('SELECT run_type FROM payroll_runs WHERE id = $1', [req.params.id]);
    if (runCheck.rows.length > 0 && ['TRIAL', 'ADHOC_TRIAL'].includes(runCheck.rows[0].run_type)) {
      return res.status(400).json({ success: false, error: { code: 'TRIAL_RUN', message: 'Trial runs cannot be approved. Create a FINAL run to proceed.' } });
    }
    const result = await dbQuery(
      `UPDATE payroll_runs SET status = 'APPROVED', approved_at = NOW(), approved_by = $1 WHERE id = $2 AND status = 'LOCKED' RETURNING *`,
      [req.user?.id || 1, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Run must be LOCKED to approve' } });
    }

    const runId = parseInt(req.params.id);
    const userId = req.user?.id || 1;
    const postApproval = { gl_post: null, payment_batches: null };

    const autoGL = await getSystemSetting('auto_gl_post');
    if (autoGL !== 'false') {
      try { postApproval.gl_post = await performGLPost(runId, userId, true); }
      catch (e) { postApproval.gl_post = { error: e.message }; }
    }

    const autoBatches = await getSystemSetting('auto_generate_batches');
    if (autoBatches !== 'false') {
      try { postApproval.payment_batches = await generatePaymentBatches(runId); }
      catch (e) { postApproval.payment_batches = { error: e.message }; }
    }

    res.json({ success: true, data: result.rows[0], post_approval: postApproval, message: 'Payroll run approved' });
  } catch (err) {
    next(err);
  }
});

router.post('/runs/:id/promote', authenticate, auditLog('UPDATE', 'payroll_run'), async (req, res, next) => {
  try {
    const { re_execute } = req.body || {};
    const run = await dbQuery('SELECT id, run_type, status FROM payroll_runs WHERE id = $1', [req.params.id]);
    if (run.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payroll run not found' } });
    }
    const r = run.rows[0];
    if (!['TRIAL', 'ADHOC_TRIAL'].includes(r.run_type)) {
      return res.status(400).json({ success: false, error: { code: 'ALREADY_FINAL', message: 'This run is already a FINAL run' } });
    }
    if (!['COMPLETED', 'LOCKED'].includes(r.status)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Run must be COMPLETED or LOCKED before promoting to final.' } });
    }
    const newType = r.run_type === 'ADHOC_TRIAL' ? 'ADHOC_FINAL' : 'FINAL';
    const newStatus = re_execute ? 'COMPLETED' : 'LOCKED';
    const result = await dbQuery(
      `UPDATE payroll_runs SET run_type = $1, status = $2, locked_at = ${re_execute ? 'NULL' : 'NOW()'}, locked_by = ${re_execute ? 'NULL' : '$3'} WHERE id = $${re_execute ? 3 : 4} RETURNING *`,
      re_execute ? [newType, newStatus, req.params.id] : [newType, newStatus, req.user?.id || 1, req.params.id]
    );
    try {
      const runDetails = result.rows[0];
      const processedEmpIds = await dbQuery(
        'SELECT DISTINCT employee_id FROM payroll_results WHERE run_id = $1', [req.params.id]
      );
      const empIds = processedEmpIds.rows.map(r => r.employee_id);
      if (empIds.length > 0) {
        await dbQuery(
          `UPDATE wage_transactions SET status = 'PROCESSED', processed_at = NOW(), updated_at = NOW()
           WHERE period_id = $1 AND status = 'APPROVED' AND employee_id = ANY($2)`,
          [runDetails.period_id, empIds]
        );
      }
    } catch (e) { /* wage_transactions may not exist yet */ }
    res.json({ success: true, data: result.rows[0], message: `Run promoted to ${newType} and locked` });
  } catch (err) {
    next(err);
  }
});

router.post('/runs/:id/unlock', authenticate, auditLog('UPDATE', 'payroll_run'), async (req, res, next) => {
  try {
    const run = await dbQuery('SELECT id, run_type, status, period_id FROM payroll_runs WHERE id = $1', [req.params.id]);
    if (run.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payroll run not found' } });
    }
    const r = run.rows[0];
    if (r.status === 'APPROVED') {
      return res.status(400).json({ success: false, error: { code: 'ALREADY_APPROVED', message: 'Cannot unlock an approved run. The run has been finalised.' } });
    }
    if (r.status !== 'LOCKED') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Only LOCKED runs can be unlocked' } });
    }
    if (['FINAL', 'ADHOC_FINAL'].includes(r.run_type)) {
      return res.status(400).json({ success: false, error: { code: 'FINAL_LOCKED', message: 'Cannot unlock a FINAL run. Only locked trial runs can be unlocked.' } });
    }
    const result = await dbQuery(
      `UPDATE payroll_runs SET status = 'COMPLETED', locked_at = NULL, locked_by = NULL WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    try {
      await dbQuery(`UPDATE payroll_periods SET status = 'OPEN' WHERE id = $1`, [r.period_id]);
    } catch (e) {}
    res.json({ success: true, data: result.rows[0], message: 'Run unlocked and reverted to trial' });
  } catch (err) {
    next(err);
  }
});

router.get('/runs/:id/results', authenticate, paginationMiddleware, async (req, res, next) => {
  try {
    const { pagination } = req;
    const { employee_id } = req.query;
    let whereClause = 'WHERE pr.run_id = $1';
    const params = [req.params.id];
    let pi = 2;

    if (employee_id) {
      whereClause += ` AND pr.employee_id = $${pi}`;
      params.push(parseInt(employee_id, 10));
      pi++;
    }

    const countResult = await dbQuery(`SELECT COUNT(*) FROM payroll_results pr ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await dbQuery(
      `SELECT pr.*, e.first_name, e.surname, e.employee_code, sh.code AS salary_head_code, sh.name AS salary_head_name
       FROM payroll_results pr
       JOIN employees e ON pr.employee_id = e.id
       JOIN salary_heads sh ON pr.salary_head_id = sh.id
       ${whereClause}
       ORDER BY e.surname, e.first_name, pr.transaction_type
       LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, pagination.limit, pagination.offset]
    );

    res.json({ success: true, data: result.rows, meta: { page: pagination.page, limit: pagination.limit, total, totalPages: Math.ceil(total / pagination.limit) } });
  } catch (err) {
    next(err);
  }
});

router.get('/runs/:id/errors', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT pre.*, e.first_name, e.surname, e.employee_code
       FROM payroll_run_errors pre
       LEFT JOIN employees e ON pre.employee_id = e.id
       WHERE pre.run_id = $1
       ORDER BY pre.severity DESC, pre.created_at`,
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/mscoa-items', authenticate, async (req, res, next) => {
  try {
    const { category, balance_sheet, item_type } = req.query;
    let whereClause = 'WHERE enabled = TRUE';
    const params = [];
    let pi = 1;
    if (category) { whereClause += ` AND category = $${pi++}`; params.push(category.toUpperCase()); }
    if (balance_sheet !== undefined) { whereClause += ` AND balance_sheet = $${pi++}`; params.push(balance_sheet === 'true'); }
    if (item_type) { whereClause += ` AND item_type = $${pi++}`; params.push(item_type.toUpperCase()); }
    const result = await dbQuery(`SELECT * FROM mscoa_items ${whereClause} ORDER BY item_code`, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/salary-heads', authenticate, async (req, res, next) => {
  try {
    const { transaction_type } = req.query;
    let whereClause = 'WHERE enabled = TRUE';
    const params = [];
    if (transaction_type) {
      whereClause += ' AND transaction_type = $1';
      params.push(transaction_type.toUpperCase());
    }
    const result = await dbQuery(`SELECT * FROM salary_heads ${whereClause} ORDER BY id`, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/salary-heads', authenticate, auditLog('CREATE', 'salary_head'), async (req, res, next) => {
  try {
    const { code, name, transaction_type, calculation_method, irp5_code, sars_code, taxable, affects_uif, affects_sdl, show_on_payslip, priority, scoa_debit_item, scoa_credit_item, start_date, employee_contribution, employer_contribution, condition_of_service_id, employee_type_filter, employee_subtype_filter, pro_rated, round_calculation, round_digits } = req.body;
    const result = await dbQuery(
      `INSERT INTO salary_heads (code, name, transaction_type, calculation_method, irp5_code, sars_code, taxable, affects_uif, affects_sdl, show_on_payslip, priority, scoa_debit_item, scoa_credit_item, start_date, employee_contribution, employer_contribution, condition_of_service_id, employee_type_filter, employee_subtype_filter, pro_rated, round_calculation, round_digits, created_by, updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$23) RETURNING *`,
      [code, name, transaction_type, calculation_method || 'USER_INPUT', irp5_code, sars_code, taxable !== false, affects_uif || false, affects_sdl || false, show_on_payslip !== false, priority || 0, scoa_debit_item, scoa_credit_item, start_date, employee_contribution || 0, employer_contribution || 0, condition_of_service_id || null, employee_type_filter || null, employee_subtype_filter || null, pro_rated || false, round_calculation || null, round_digits ?? 2, req.user?.id || 1]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.put('/salary-heads/:id', authenticate, auditLog('UPDATE', 'salary_head'), async (req, res, next) => {
  try {
    const { name, transaction_type, calculation_method, irp5_code, sars_code, taxable, affects_uif, affects_sdl, show_on_payslip, priority, scoa_debit_item, scoa_credit_item, employee_contribution, employer_contribution, condition_of_service_id, employee_type_filter, employee_subtype_filter, pro_rated, round_calculation, round_digits } = req.body;
    const result = await dbQuery(
      `UPDATE salary_heads SET name = COALESCE($1, name), transaction_type = COALESCE($2, transaction_type),
       calculation_method = COALESCE($3, calculation_method), irp5_code = $4, sars_code = $5,
       taxable = $6, affects_uif = $7, affects_sdl = $8, show_on_payslip = COALESCE($9, show_on_payslip),
       priority = COALESCE($10, priority), scoa_debit_item = $11, scoa_credit_item = $12,
       employee_contribution = COALESCE($13, employee_contribution),
       employer_contribution = COALESCE($14, employer_contribution),
       condition_of_service_id = $15, employee_type_filter = $16, employee_subtype_filter = $17,
       pro_rated = $18, round_calculation = $19, round_digits = $20,
       updated_by = $21, updated_at = NOW()
       WHERE id = $22 RETURNING *`,
      [name, transaction_type, calculation_method, irp5_code || null, sars_code || null,
       taxable !== undefined ? taxable : true, affects_uif || false, affects_sdl || false,
       show_on_payslip, priority, scoa_debit_item || null, scoa_credit_item || null,
       employee_contribution !== undefined ? employee_contribution : null,
       employer_contribution !== undefined ? employer_contribution : null,
       condition_of_service_id || null, employee_type_filter || null, employee_subtype_filter || null,
       pro_rated || false, round_calculation || null, round_digits ?? 2,
       req.user?.id || 1, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Salary head not found' } });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/salary-heads/:id', authenticate, auditLog('DELETE', 'salary_head'), async (req, res, next) => {
  try {
    const head = await dbQuery('SELECT * FROM salary_heads WHERE id = $1', [req.params.id]);
    if (head.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Salary head not found' } });
    }
    if (head.rows[0].calculation_method === 'SYSTEM_CALCULATE') {
      return res.status(400).json({ success: false, error: { code: 'SYSTEM_HEAD', message: 'System-calculated salary heads (PAYE, UIF, SDL) cannot be deleted' } });
    }
    const inUse = await dbQuery('SELECT COUNT(*) AS cnt FROM employee_salary_transactions WHERE salary_head_id = $1 AND enabled = TRUE', [req.params.id]);
    if (parseInt(inUse.rows[0].cnt) > 0) {
      return res.status(400).json({ success: false, error: { code: 'IN_USE', message: `This salary head is assigned to ${inUse.rows[0].cnt} active employee transaction(s). Remove those assignments first, or disable the head instead.` } });
    }
    const resultCheck = await dbQuery('SELECT COUNT(*) AS cnt FROM payroll_results WHERE salary_head_id = $1', [req.params.id]);
    if (parseInt(resultCheck.rows[0].cnt) > 0) {
      await dbQuery('UPDATE salary_heads SET enabled = FALSE, updated_by = $1, updated_at = NOW() WHERE id = $2', [req.user?.id || 1, req.params.id]);
      return res.json({ success: true, data: { message: 'Salary head has been disabled (historical payroll data exists)' } });
    }
    await dbQuery('DELETE FROM salary_heads WHERE id = $1', [req.params.id]);
    res.json({ success: true, data: { message: 'Salary head deleted' } });
  } catch (err) {
    next(err);
  }
});

router.get('/salary-heads/:id/formulas', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT shf.*, cos.name AS cos_name, et.name AS employee_type_name, es.name AS employee_subtype_name
       FROM salary_head_formulas shf
       LEFT JOIN conditions_of_service cos ON shf.condition_of_service_id = cos.id
       LEFT JOIN employee_types et ON shf.employee_type_id = et.id
       LEFT JOIN employee_subtypes es ON shf.employee_subtype_id = es.id
       WHERE shf.salary_head_id = $1
       ORDER BY shf.priority DESC, shf.id`,
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/salary-heads/:id/formulas', authenticate, async (req, res, next) => {
  try {
    const { rule_name, formula, condition_of_service_id, employee_type_id, employee_subtype_id, priority, round_method, round_digits, pro_rata, enabled, start_date, end_date, notes } = req.body;
    if (!rule_name?.trim()) return res.status(400).json({ success: false, error: { message: 'Rule name is required' } });
    if (!formula?.trim()) return res.status(400).json({ success: false, error: { message: 'Formula is required' } });
    const result = await dbQuery(
      `INSERT INTO salary_head_formulas (salary_head_id, rule_name, formula, condition_of_service_id, employee_type_id, employee_subtype_id, priority, round_method, round_digits, pro_rata, enabled, start_date, end_date, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [req.params.id, rule_name.trim(), formula.trim(), condition_of_service_id || null, employee_type_id || null, employee_subtype_id || null, priority || 0, round_method || 'ROUND', round_digits ?? 2, pro_rata || false, enabled !== false, start_date || null, end_date || null, notes || null, req.user?.id || 1]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.put('/salary-heads/:headId/formulas/:id', authenticate, async (req, res, next) => {
  try {
    const { rule_name, formula, condition_of_service_id, employee_type_id, employee_subtype_id, priority, round_method, round_digits, pro_rata, enabled, start_date, end_date, notes } = req.body;
    const result = await dbQuery(
      `UPDATE salary_head_formulas SET
       rule_name = COALESCE($1, rule_name), formula = COALESCE($2, formula),
       condition_of_service_id = $3, employee_type_id = $4, employee_subtype_id = $5,
       priority = COALESCE($6, priority), round_method = COALESCE($7, round_method),
       round_digits = COALESCE($8, round_digits), pro_rata = $9, enabled = $10,
       start_date = $11, end_date = $12,
       notes = $13, updated_by = $14, updated_at = NOW()
       WHERE id = $15 AND salary_head_id = $16 RETURNING *`,
      [rule_name, formula, condition_of_service_id || null, employee_type_id || null, employee_subtype_id || null, priority, round_method, round_digits, pro_rata || false, enabled !== false, start_date || null, end_date || null, notes || null, req.user?.id || 1, req.params.id, req.params.headId]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: { message: 'Formula rule not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/salary-heads/:headId/formulas/:id', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('DELETE FROM salary_head_formulas WHERE id = $1 AND salary_head_id = $2 RETURNING id', [req.params.id, req.params.headId]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: { message: 'Formula rule not found' } });
    res.json({ success: true, message: 'Formula rule deleted' });
  } catch (err) {
    next(err);
  }
});

router.post('/salary-heads/:id/formulas/test', authenticate, async (req, res, next) => {
  try {
    const { formula, employee_id, period_id, cycle_id } = req.body;
    if (!formula?.trim()) return res.status(400).json({ success: false, error: { message: 'Formula is required' } });

    const { evaluateFormulaV2, buildFormulaVariables } = require('../services/payroll-engine');

    let variables = {
      BasicSalary: 10000, AnnualSalary: 120000, PrevBasicSalary: 10000, PrevAnnualSalary: 120000,
      captured_amount: 0, GrossEarnings: 10000, TotalDeductions: 0, NetPay: 10000,
      HoursWorked: 173.33, DaysWorked: 21.67, WHPM_Monthly: 173.33,
      ServiceYears: 5, Age: 35, MedicalDependants: 2, PeriodsPerYear: 12
    };

    if (employee_id) {
      try {
        let resolvedPeriodId = period_id ? parseInt(period_id) : null;
        let resolvedCycleId = cycle_id ? parseInt(cycle_id) : null;
        if (!resolvedPeriodId) {
          const currentPeriod = await dbQuery(
            `SELECT pp.id, pp.cycle_id FROM payroll_periods pp
             WHERE pp.start_date <= CURRENT_DATE AND pp.end_date >= CURRENT_DATE
             ORDER BY pp.end_date LIMIT 1`
          );
          if (currentPeriod.rows.length > 0) {
            resolvedPeriodId = currentPeriod.rows[0].id;
            resolvedCycleId = resolvedCycleId || currentPeriod.rows[0].cycle_id;
          }
        }
        if (resolvedPeriodId) {
          variables = await buildFormulaVariables(parseInt(employee_id), resolvedPeriodId, resolvedCycleId);
        }
      } catch (e) {
        // fall back to defaults
      }
    }

    const result = evaluateFormulaV2(formula.trim(), variables);
    res.json({ success: true, data: { result: result.value, error: result.error || null, variables } });
  } catch (err) {
    next(err);
  }
});

router.get('/tax-tables', authenticate, async (req, res, next) => {
  try {
    const taxYear = req.query.tax_year || new Date().getFullYear();
    const [brackets, rebates, thresholds, medCredits, uif, sdl] = await Promise.all([
      dbQuery('SELECT * FROM tax_brackets WHERE tax_year = $1 ORDER BY bracket_number', [taxYear]),
      dbQuery('SELECT * FROM tax_rebates WHERE tax_year = $1 ORDER BY rebate_type', [taxYear]),
      dbQuery('SELECT * FROM tax_thresholds WHERE tax_year = $1', [taxYear]),
      dbQuery('SELECT * FROM medical_tax_credits WHERE tax_year = $1', [taxYear]),
      dbQuery('SELECT * FROM uif_settings WHERE tax_year = $1', [taxYear]),
      dbQuery('SELECT * FROM sdl_settings WHERE tax_year = $1', [taxYear]),
    ]);
    res.json({
      success: true,
      data: {
        tax_year: taxYear,
        brackets: brackets.rows,
        rebates: rebates.rows,
        thresholds: thresholds.rows,
        medical_tax_credits: medCredits.rows[0] || null,
        uif: uif.rows[0] || null,
        sdl: sdl.rows[0] || null,
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/runs/:id/void', authenticate, auditLog('VOID', 'payroll_run'), async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'Void reason is required' } });
    }
    const run = await dbQuery('SELECT * FROM payroll_runs WHERE id = $1', [req.params.id]);
    if (run.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payroll run not found' } });
    }
    if (!['COMPLETED', 'LOCKED', 'APPROVED'].includes(run.rows[0].status)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: `Cannot void from status ${run.rows[0].status}` } });
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE payroll_runs SET status = 'VOIDED', locked_at = NOW(), locked_by = $1 WHERE id = $2`,
        [req.user?.id || 1, req.params.id]
      );
      await client.query(
        `INSERT INTO payroll_run_errors (run_id, error_type, error_message, severity)
         VALUES ($1, 'VOID', $2, 'INFO')`,
        [req.params.id, `Run voided by user. Reason: ${reason}`]
      );
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    const updated = await dbQuery('SELECT * FROM payroll_runs WHERE id = $1', [req.params.id]);
    res.json({ success: true, data: updated.rows[0], message: 'Payroll run voided successfully' });
  } catch (err) {
    next(err);
  }
});

router.post('/runs/:id/reverse', authenticate, auditLog('REVERSE', 'payroll_run'), async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'Reversal reason is required' } });
    }
    const run = await dbQuery(
      `SELECT pr.*, pp.period_number, pp.tax_year, pp.tax_period
       FROM payroll_runs pr
       JOIN payroll_periods pp ON pr.period_id = pp.id
       WHERE pr.id = $1`, [req.params.id]
    );
    if (run.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payroll run not found' } });
    }
    if (!['COMPLETED', 'LOCKED', 'APPROVED'].includes(run.rows[0].status)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: `Cannot reverse from status ${run.rows[0].status}` } });
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const reversalRun = await client.query(
        `INSERT INTO payroll_runs (cycle_id, period_id, run_type, payment_date, status, created_by)
         VALUES ($1, $2, 'FINAL', $3, 'COMPLETED', $4) RETURNING *`,
        [run.rows[0].cycle_id, run.rows[0].period_id, run.rows[0].payment_date, req.user?.id || 1]
      );
      const reversalId = reversalRun.rows[0].id;

      const originalResults = await client.query(
        'SELECT * FROM payroll_results WHERE run_id = $1', [req.params.id]
      );

      let totalEarnings = 0, totalDeductions = 0, totalCompany = 0;
      for (const r of originalResults.rows) {
        const negAmount = -parseFloat(r.amount);
        await client.query(
          `INSERT INTO payroll_results (run_id, period_id, cycle_id, employee_id, salary_head_id, department_id, division_id,
           transaction_type, irp5_code, amount, calculation_detail, tax_period, tax_year,
           scoa_item_id, scoa_fund_id, scoa_function_id, scoa_project_id, scoa_region_id,
           contra_scoa_item_id, contra_scoa_fund_id, contra_scoa_function_id, contra_scoa_project_id, contra_scoa_region_id,
           contra_division_id, debit_plan_project_item_id, credit_plan_project_item_id, head_code)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)`,
          [reversalId, r.period_id, r.cycle_id, r.employee_id, r.salary_head_id, r.department_id, r.division_id,
           r.transaction_type, r.irp5_code, negAmount, `Reversal of run ${req.params.id}: ${reason}`,
           r.tax_period, r.tax_year, r.scoa_item_id, r.scoa_fund_id, r.scoa_function_id, r.scoa_project_id, r.scoa_region_id,
           r.contra_scoa_item_id, r.contra_scoa_fund_id, r.contra_scoa_function_id, r.contra_scoa_project_id, r.contra_scoa_region_id,
           r.contra_division_id, r.debit_plan_project_item_id, r.credit_plan_project_item_id, r.head_code]
        );
        if (r.transaction_type === 'EARNING') totalEarnings += negAmount;
        else if (r.transaction_type === 'DEDUCTION') totalDeductions += negAmount;
        else if (r.transaction_type === 'COMPANY_CONTRIBUTION') totalCompany += negAmount;
      }

      await client.query(
        `UPDATE payroll_runs SET employee_count = $1, total_earnings = $2, total_deductions = $3,
         total_company_contributions = $4, total_nett = $5 WHERE id = $6`,
        [run.rows[0].employee_count, totalEarnings.toFixed(2), totalDeductions.toFixed(2),
         totalCompany.toFixed(2), (totalEarnings - totalDeductions).toFixed(2), reversalId]
      );

      await client.query(
        `UPDATE payroll_runs SET status = 'REVERSED', locked_at = NOW(), locked_by = $1 WHERE id = $2`,
        [req.user?.id || 1, req.params.id]
      );

      await client.query(
        `INSERT INTO payroll_run_errors (run_id, error_type, error_message, severity)
         VALUES ($1, 'REVERSAL', $2, 'INFO')`,
        [req.params.id, `Run reversed. Reversal run ID: ${reversalId}. Reason: ${reason}`]
      );

      await client.query('COMMIT');

      const reversalResult = await dbQuery('SELECT * FROM payroll_runs WHERE id = $1', [reversalId]);
      res.json({
        success: true,
        data: {
          original_run_id: parseInt(req.params.id),
          reversal_run: reversalResult.rows[0],
        },
        message: `Payroll run reversed. Reversal run ID: ${reversalId}`
      });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

router.get('/runs/:id/payslip-preview/:employeeId', authenticate, async (req, res, next) => {
  try {
    const { id, employeeId } = req.params;

    const run = await dbQuery(
      `SELECT pr.*, pp.period_number, pp.tax_year, pp.tax_period, pp.start_date AS period_start, pp.end_date AS period_end,
              pc.name AS cycle_name, pc.cycle_type, pc.periods_per_year
       FROM payroll_runs pr
       JOIN payroll_periods pp ON pr.period_id = pp.id
       JOIN payroll_cycles pc ON pr.cycle_id = pc.id
       WHERE pr.id = $1`, [id]
    );
    if (run.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payroll run not found' } });
    }

    const employee = await dbQuery(
      `SELECT e.*, p.title AS position_title
       FROM employees e
       LEFT JOIN positions p ON e.position_id = p.id
       WHERE e.id = $1`, [employeeId]
    );
    if (employee.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } });
    }

    const results = await dbQuery(
      `SELECT pr.*, sh.code AS salary_head_code, sh.name AS salary_head_name, sh.show_on_payslip
       FROM payroll_results pr
       LEFT JOIN salary_heads sh ON pr.salary_head_id = sh.id
       WHERE pr.run_id = $1 AND pr.employee_id = $2
       ORDER BY pr.transaction_type, sh.priority`,
      [id, employeeId]
    );

    if (results.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No results found for this employee in this run' } });
    }

    const earningsOnly = results.rows.filter(r => r.transaction_type === 'EARNING');
    const fringeBenefits = results.rows.filter(r => r.transaction_type === 'FRINGE_BENEFIT');
    const earnings = [...earningsOnly, ...fringeBenefits];
    const deductions = results.rows.filter(r => r.transaction_type === 'DEDUCTION');
    const companyContribs = results.rows.filter(r => r.transaction_type === 'COMPANY_CONTRIBUTION');

    const totalEarningsOnly = earningsOnly.reduce((s, r) => s + parseFloat(r.amount), 0);
    const totalEarnings = earnings.reduce((s, r) => s + parseFloat(r.amount), 0);
    const totalDeductions = deductions.reduce((s, r) => s + parseFloat(r.amount), 0);
    const totalCompany = companyContribs.reduce((s, r) => s + parseFloat(r.amount), 0);
    const nettPay = totalEarningsOnly - totalDeductions;

    const payeRow = deductions.find(r => r.salary_head_code === 'PAYE' || (r.salary_head_name || '').includes('PAYE'));
    const uifRow = deductions.find(r => r.salary_head_code === 'UIF_EE' || (r.salary_head_name || '').includes('UIF'));
    const sdlRow = companyContribs.find(r => r.salary_head_code === 'SDL' || (r.salary_head_name || '').includes('SDL'));

    res.json({
      success: true,
      data: {
        employee: {
          id: employee.rows[0].id,
          employee_code: employee.rows[0].employee_code,
          name: `${employee.rows[0].first_name} ${employee.rows[0].surname}`,
          position: employee.rows[0].position_title,
          department: employee.rows[0].department_name,
          date_of_birth: employee.rows[0].date_of_birth,
          tax_number: employee.rows[0].tax_number,
        },
        run: {
          id: run.rows[0].id,
          period_number: run.rows[0].period_number,
          tax_year: run.rows[0].tax_year,
          tax_period: run.rows[0].tax_period,
          cycle_name: run.rows[0].cycle_name,
          run_type: run.rows[0].run_type,
          payment_date: run.rows[0].payment_date,
          period_start: run.rows[0].period_start,
          period_end: run.rows[0].period_end,
        },
        earnings,
        deductions,
        company_contributions: companyContribs,
        summary: {
          gross_earnings: parseFloat(totalEarnings.toFixed(2)),
          total_deductions: parseFloat(totalDeductions.toFixed(2)),
          nett_pay: parseFloat(nettPay.toFixed(2)),
          company_contributions: parseFloat(totalCompany.toFixed(2)),
          total_cost_to_company: parseFloat((totalEarningsOnly + totalCompany).toFixed(2)),
          paye: payeRow ? parseFloat(payeRow.amount) : 0,
          uif_employee: uifRow ? parseFloat(uifRow.amount) : 0,
          sdl: sdlRow ? parseFloat(sdlRow.amount) : 0,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/runs/:id/variance', authenticate, async (req, res, next) => {
  try {
    const { compare_run_id, compare_type } = req.query;
    const currentRun = await dbQuery(
      `SELECT pr.*, pp.period_number, pp.tax_year
       FROM payroll_runs pr
       JOIN payroll_periods pp ON pr.period_id = pp.id
       WHERE pr.id = $1`, [req.params.id]
    );
    if (currentRun.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Current payroll run not found' } });
    }

    let previousRunId = compare_run_id;
    if (!previousRunId) {
      if (compare_type === 'TRIAL_VS_FINAL') {
        const counterType = currentRun.rows[0].run_type === 'FINAL' ? 'TRIAL' : 'FINAL';
        const match = await dbQuery(
          `SELECT pr.id FROM payroll_runs pr
           WHERE pr.period_id = $1 AND pr.cycle_id = $2 AND pr.run_type = $3
           AND pr.status IN ('COMPLETED','LOCKED','APPROVED')
           ORDER BY pr.id DESC LIMIT 1`,
          [currentRun.rows[0].period_id, currentRun.rows[0].cycle_id, counterType]
        );
        if (match.rows.length > 0) {
          previousRunId = match.rows[0].id;
        }
      }

      if (!previousRunId) {
        const prev = await dbQuery(
          `SELECT pr.id FROM payroll_runs pr
           WHERE pr.cycle_id = $1 AND pr.id < $2 AND pr.status IN ('COMPLETED','LOCKED','APPROVED')
           ORDER BY pr.id DESC LIMIT 1`,
          [currentRun.rows[0].cycle_id, req.params.id]
        );
        if (prev.rows.length === 0) {
          return res.json({ success: true, data: { message: 'No previous run found for comparison', current: currentRun.rows[0], previous: null, variance: null } });
        }
        previousRunId = prev.rows[0].id;
      }
    }

    const previousRun = await dbQuery(
      `SELECT pr.*, pp.period_number, pp.tax_year
       FROM payroll_runs pr
       JOIN payroll_periods pp ON pr.period_id = pp.id
       WHERE pr.id = $1`, [previousRunId]
    );
    if (previousRun.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Comparison payroll run not found' } });
    }

    const [currentSummary, previousSummary] = await Promise.all([
      dbQuery(
        `SELECT sh.code, sh.name, pr.transaction_type, COUNT(DISTINCT pr.employee_id) AS emp_count, SUM(pr.amount) AS total
         FROM payroll_results pr JOIN salary_heads sh ON pr.salary_head_id = sh.id
         WHERE pr.run_id = $1
         GROUP BY sh.code, sh.name, pr.transaction_type ORDER BY sh.code`, [req.params.id]
      ),
      dbQuery(
        `SELECT sh.code, sh.name, pr.transaction_type, COUNT(DISTINCT pr.employee_id) AS emp_count, SUM(pr.amount) AS total
         FROM payroll_results pr JOIN salary_heads sh ON pr.salary_head_id = sh.id
         WHERE pr.run_id = $1
         GROUP BY sh.code, sh.name, pr.transaction_type ORDER BY sh.code`, [previousRunId]
      ),
    ]);

    const prevMap = {};
    previousSummary.rows.forEach(r => { prevMap[r.code] = r; });

    const varianceLines = currentSummary.rows.map(curr => {
      const prev = prevMap[curr.code] || { total: 0, emp_count: 0 };
      const currTotal = parseFloat(curr.total);
      const prevTotal = parseFloat(prev.total || 0);
      const diff = currTotal - prevTotal;
      const pctChange = prevTotal !== 0 ? ((diff / prevTotal) * 100) : (currTotal !== 0 ? 100 : 0);
      return {
        code: curr.code,
        name: curr.name,
        transaction_type: curr.transaction_type,
        current_total: currTotal,
        previous_total: prevTotal,
        variance_amount: parseFloat(diff.toFixed(2)),
        variance_percentage: parseFloat(pctChange.toFixed(2)),
        current_emp_count: parseInt(curr.emp_count),
        previous_emp_count: parseInt(prev.emp_count || 0),
      };
    });

    const [currentEmpTotals, previousEmpTotals] = await Promise.all([
      dbQuery(
        `SELECT pr.employee_id, e.employee_code, e.first_name, e.surname,
                SUM(CASE WHEN pr.transaction_type IN ('EARNING','FRINGE_BENEFIT') THEN pr.amount ELSE 0 END) AS earnings,
                SUM(CASE WHEN pr.transaction_type = 'DEDUCTION' THEN pr.amount ELSE 0 END) AS deductions,
                SUM(CASE WHEN pr.transaction_type IN ('EARNING','FRINGE_BENEFIT') THEN pr.amount ELSE 0 END) -
                SUM(CASE WHEN pr.transaction_type = 'DEDUCTION' THEN pr.amount ELSE 0 END) AS nett
         FROM payroll_results pr
         JOIN employees e ON pr.employee_id = e.id
         WHERE pr.run_id = $1
         GROUP BY pr.employee_id, e.employee_code, e.first_name, e.surname
         ORDER BY e.surname, e.first_name`, [req.params.id]
      ),
      dbQuery(
        `SELECT pr.employee_id,
                SUM(CASE WHEN pr.transaction_type IN ('EARNING','FRINGE_BENEFIT') THEN pr.amount ELSE 0 END) AS earnings,
                SUM(CASE WHEN pr.transaction_type = 'DEDUCTION' THEN pr.amount ELSE 0 END) AS deductions,
                SUM(CASE WHEN pr.transaction_type IN ('EARNING','FRINGE_BENEFIT') THEN pr.amount ELSE 0 END) -
                SUM(CASE WHEN pr.transaction_type = 'DEDUCTION' THEN pr.amount ELSE 0 END) AS nett
         FROM payroll_results pr
         WHERE pr.run_id = $1
         GROUP BY pr.employee_id`, [previousRunId]
      ),
    ]);

    const prevEmpMap = {};
    previousEmpTotals.rows.forEach(r => { prevEmpMap[r.employee_id] = r; });

    const employeeVariance = currentEmpTotals.rows.map(curr => {
      const prev = prevEmpMap[curr.employee_id] || { earnings: 0, deductions: 0, nett: 0 };
      const earningsDiff = parseFloat(curr.earnings) - parseFloat(prev.earnings || 0);
      const deductionsDiff = parseFloat(curr.deductions) - parseFloat(prev.deductions || 0);
      const nettDiff = parseFloat(curr.nett) - parseFloat(prev.nett || 0);
      return {
        employee_id: curr.employee_id,
        employee_code: curr.employee_code,
        name: `${curr.first_name} ${curr.surname}`,
        current_earnings: parseFloat(curr.earnings),
        previous_earnings: parseFloat(prev.earnings || 0),
        earnings_variance: parseFloat(earningsDiff.toFixed(2)),
        current_deductions: parseFloat(curr.deductions),
        previous_deductions: parseFloat(prev.deductions || 0),
        deductions_variance: parseFloat(deductionsDiff.toFixed(2)),
        current_nett: parseFloat(curr.nett),
        previous_nett: parseFloat(prev.nett || 0),
        nett_variance: parseFloat(nettDiff.toFixed(2)),
        has_change: Math.abs(nettDiff) > 0.01,
      };
    });

    const employeesWithChanges = employeeVariance.filter(e => e.has_change).length;
    const totalVarianceAmount = employeeVariance.reduce((s, e) => s + Math.abs(e.nett_variance), 0);

    const runVariance = {
      current_earnings: parseFloat(currentRun.rows[0].total_earnings || 0),
      previous_earnings: parseFloat(previousRun.rows[0].total_earnings || 0),
      earnings_variance: parseFloat((parseFloat(currentRun.rows[0].total_earnings || 0) - parseFloat(previousRun.rows[0].total_earnings || 0)).toFixed(2)),
      current_deductions: parseFloat(currentRun.rows[0].total_deductions || 0),
      previous_deductions: parseFloat(previousRun.rows[0].total_deductions || 0),
      deductions_variance: parseFloat((parseFloat(currentRun.rows[0].total_deductions || 0) - parseFloat(previousRun.rows[0].total_deductions || 0)).toFixed(2)),
      current_nett: parseFloat(currentRun.rows[0].total_nett || 0),
      previous_nett: parseFloat(previousRun.rows[0].total_nett || 0),
      nett_variance: parseFloat((parseFloat(currentRun.rows[0].total_nett || 0) - parseFloat(previousRun.rows[0].total_nett || 0)).toFixed(2)),
      current_employee_count: currentRun.rows[0].employee_count,
      previous_employee_count: previousRun.rows[0].employee_count,
      employees_with_changes: employeesWithChanges,
      total_variance_amount: parseFloat(totalVarianceAmount.toFixed(2)),
    };

    res.json({
      success: true,
      data: {
        compare_type: compare_type || (currentRun.rows[0].run_type !== previousRun.rows[0].run_type ? 'TRIAL_VS_FINAL' : 'PERIOD_COMPARISON'),
        current_run: currentRun.rows[0],
        previous_run: previousRun.rows[0],
        summary_variance: runVariance,
        detail_variance: varianceLines,
        employee_variance: employeeVariance,
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/runs/:id/prorate', authenticate, async (req, res, next) => {
  try {
    const run = await dbQuery(
      `SELECT pr.*, pp.start_date AS period_start, pp.end_date AS period_end
       FROM payroll_runs pr
       JOIN payroll_periods pp ON pr.period_id = pp.id
       WHERE pr.id = $1`, [req.params.id]
    );
    if (run.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payroll run not found' } });
    }

    const periodStart = new Date(run.rows[0].period_start);
    const periodEnd = new Date(run.rows[0].period_end);
    const totalDays = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24)) + 1;

    const midPeriodEmployees = await dbQuery(
      `SELECT e.id, e.employee_code, e.first_name, e.surname, e.joining_date, e.end_date, e.annual_salary, e.status
       FROM employees e
       WHERE e.enabled = TRUE
       AND (
         (e.joining_date > $1 AND e.joining_date <= $2)
         OR (e.end_date >= $1 AND e.end_date < $2 AND e.status IN ('TERMINATED','SUSPENDED'))
       )`, [periodStart, periodEnd]
    );

    const prorations = midPeriodEmployees.rows.map(emp => {
      let workingDays;
      let prorationType;
      if (emp.joining_date && new Date(emp.joining_date) > periodStart && new Date(emp.joining_date) <= periodEnd) {
        workingDays = Math.ceil((periodEnd - new Date(emp.joining_date)) / (1000 * 60 * 60 * 24)) + 1;
        prorationType = 'MID_PERIOD_JOIN';
      } else {
        workingDays = Math.ceil((new Date(emp.end_date) - periodStart) / (1000 * 60 * 60 * 24)) + 1;
        prorationType = 'MID_PERIOD_EXIT';
      }
      const prorationFactor = Math.min(workingDays / totalDays, 1);
      const monthlySalary = parseFloat(emp.annual_salary || 0) / 12;
      const proratedSalary = parseFloat((monthlySalary * prorationFactor).toFixed(2));

      return {
        employee_id: emp.id,
        employee_code: emp.employee_code,
        name: `${emp.first_name} ${emp.surname}`,
        proration_type: prorationType,
        joining_date: emp.joining_date,
        end_date: emp.end_date,
        total_period_days: totalDays,
        working_days: workingDays,
        proration_factor: parseFloat(prorationFactor.toFixed(4)),
        full_monthly_salary: monthlySalary,
        prorated_salary: proratedSalary,
      };
    });

    res.json({
      success: true,
      data: {
        run_id: parseInt(req.params.id),
        period_start: periodStart,
        period_end: periodEnd,
        total_period_days: totalDays,
        prorated_employees: prorations.length,
        prorations,
      },
      message: `Found ${prorations.length} employees requiring mid-period proration`
    });
  } catch (err) {
    next(err);
  }
});

async function performGLPost(runId, userId, force = false) {
  const run = await dbQuery(
    `SELECT pr.*, pp.start_date AS period_start, pp.end_date AS period_end, pp.period_number, pp.tax_year
     FROM payroll_runs pr JOIN payroll_periods pp ON pr.period_id = pp.id WHERE pr.id = $1`, [runId]
  );
  if (run.rows.length === 0) throw Object.assign(new Error('Payroll run not found'), { code: 'NOT_FOUND' });
  if (!['COMPLETED', 'LOCKED', 'APPROVED'].includes(run.rows[0].status)) throw Object.assign(new Error('Run must be COMPLETED, LOCKED or APPROVED'), { code: 'INVALID_STATE' });
  if (['TRIAL', 'ADHOC_TRIAL'].includes(run.rows[0].run_type)) throw Object.assign(new Error('Trial runs cannot be posted to GL'), { code: 'TRIAL_RUN' });

  const existing = await dbQuery('SELECT COUNT(*) FROM payroll_gl_journals WHERE payroll_run_id = $1', [runId]);
  if (parseInt(existing.rows[0].count) > 0) return { skipped: true, reason: 'ALREADY_POSTED', message: 'GL journals already posted for this run' };

  const results = await dbQuery(
    `SELECT pr.transaction_type, pr.scoa_item_id, pr.scoa_fund_id, pr.scoa_function_id, pr.scoa_project_id,
            pr.contra_scoa_item_id, pr.contra_scoa_fund_id, pr.contra_scoa_function_id, pr.contra_scoa_project_id,
            COALESCE(sh.code, pr.transaction_type) AS head_code, COALESCE(sh.name, pr.transaction_type) AS head_name,
            SUM(pr.amount) AS total_amount
     FROM payroll_results pr LEFT JOIN salary_heads sh ON pr.salary_head_id = sh.id
     WHERE pr.run_id = $1
     GROUP BY pr.transaction_type, pr.scoa_item_id, pr.scoa_fund_id, pr.scoa_function_id, pr.scoa_project_id,
              pr.contra_scoa_item_id, pr.contra_scoa_fund_id, pr.contra_scoa_function_id, pr.contra_scoa_project_id, sh.code, sh.name
     ORDER BY pr.transaction_type, sh.code`, [runId]
  );

  const missingScoa = results.rows.filter(r => !r.scoa_item_id && parseFloat(r.total_amount) !== 0);
  const missingScoaContra = results.rows.filter(r => !r.contra_scoa_item_id && parseFloat(r.total_amount) !== 0);
  let pendingDebits = 0, pendingCredits = 0;
  const journalRows = [];
  const journalDate = run.rows[0].payment_date || run.rows[0].period_end;
  const reference = `PAY-${run.rows[0].tax_year}-P${run.rows[0].period_number}-R${runId}`;

  for (const r of results.rows) {
    const amount = parseFloat(r.total_amount);
    if (amount === 0) continue;
    const absAmount = Math.abs(amount);
    journalRows.push({ scoa_item_id: r.scoa_item_id, scoa_fund_id: r.scoa_fund_id, scoa_function_id: r.scoa_function_id, scoa_project_id: r.scoa_project_id, debit_amount: absAmount, credit_amount: 0, description: `${r.head_name} - ${r.transaction_type}` });
    pendingDebits += absAmount;
    if (r.contra_scoa_item_id) {
      journalRows.push({ scoa_item_id: r.contra_scoa_item_id, scoa_fund_id: r.contra_scoa_fund_id, scoa_function_id: r.contra_scoa_function_id, scoa_project_id: r.contra_scoa_project_id, debit_amount: 0, credit_amount: absAmount, description: `${r.head_name} - ${r.transaction_type} (contra)` });
      pendingCredits += absAmount;
    }
  }

  const prePostBalanced = Math.abs(pendingDebits - pendingCredits) < 0.01;
  const client = await getClient();
  let journalCount = 0;
  try {
    await client.query('BEGIN');
    for (const j of journalRows) {
      await client.query(
        `INSERT INTO payroll_gl_journals (payroll_run_id, journal_date, scoa_item_id, scoa_fund_id, scoa_function_id, scoa_project_id, debit_amount, credit_amount, description, reference, posted_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [runId, journalDate, j.scoa_item_id, j.scoa_fund_id, j.scoa_function_id, j.scoa_project_id, j.debit_amount, j.credit_amount, j.description, reference, userId]
      );
      journalCount++;
    }
    const postCheck = await client.query(`SELECT COALESCE(SUM(debit_amount),0) AS total_dr, COALESCE(SUM(credit_amount),0) AS total_cr FROM payroll_gl_journals WHERE payroll_run_id = $1`, [runId]);
    const postedDr = parseFloat(postCheck.rows[0].total_dr), postedCr = parseFloat(postCheck.rows[0].total_cr);
    if (Math.abs(postedDr - postedCr) >= 0.01 && !force) { await client.query('ROLLBACK'); throw Object.assign(new Error(`GL imbalance: DR=${postedDr.toFixed(2)} CR=${postedCr.toFixed(2)}`), { code: 'GL_IMBALANCE' }); }
    await client.query('COMMIT');
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }

  return { success: true, journal_count: journalCount, total_debits: parseFloat(pendingDebits.toFixed(2)), total_credits: parseFloat(pendingCredits.toFixed(2)), balanced: prePostBalanced, force_used: !!force };
}

async function generatePaymentBatches(runId) {
  const run = await dbQuery('SELECT * FROM payroll_runs WHERE id = $1', [runId]);
  if (run.rows.length === 0) return { batches: [] };
  const payRun = run.rows[0];

  const paymentModeSetting = await dbQuery("SELECT value FROM system_settings WHERE key = 'payment_mode'");
  const paymentMethod = paymentModeSetting.rows[0]?.value || 'MANUAL_EFT';

  const existingBatches = await dbQuery('SELECT COUNT(*) AS cnt FROM payment_batches WHERE run_id = $1', [runId]);
  if (parseInt(existingBatches.rows[0].cnt) > 0) return { skipped: true, reason: 'BATCHES_EXIST', message: 'Payment batches already exist for this run' };

  const nettBatch = await dbQuery(
    `INSERT INTO payment_batches (run_id, batch_type, vendor_name, total_amount, employee_count, payment_method)
     VALUES ($1, 'EMPLOYEE_NETT', 'Employee Nett Pay', $2, $3, $4) RETURNING *`,
    [runId, parseFloat(payRun.total_nett) || 0, parseInt(payRun.employee_count) || 0, paymentMethod]
  );

  const thirdPartyAgg = await dbQuery(
    `SELECT pr.salary_head_id, sh.code, sh.name, sh.transaction_type,
            SUM(pr.amount) AS total_amount, COUNT(DISTINCT pr.employee_id) AS emp_count
     FROM payroll_results pr JOIN salary_heads sh ON pr.salary_head_id = sh.id
     WHERE pr.run_id = $1 AND sh.transaction_type IN ('DEDUCTION', 'COMPANY_CONTRIBUTION') AND sh.code NOT IN ('PAYE','UIF_EE','UIF_ER','SDL')
     GROUP BY pr.salary_head_id, sh.code, sh.name, sh.transaction_type
     HAVING SUM(pr.amount) <> 0 ORDER BY sh.name`, [runId]
  );

  const sarsBatch = await dbQuery(
    `SELECT SUM(CASE WHEN sh.code = 'PAYE' THEN pr.amount ELSE 0 END) AS paye,
            SUM(CASE WHEN sh.code IN ('UIF_EE','UIF_ER') THEN pr.amount ELSE 0 END) AS uif,
            SUM(CASE WHEN sh.code = 'SDL' THEN pr.amount ELSE 0 END) AS sdl,
            COUNT(DISTINCT pr.employee_id) AS emp_count
     FROM payroll_results pr JOIN salary_heads sh ON pr.salary_head_id = sh.id
     WHERE pr.run_id = $1 AND sh.code IN ('PAYE','UIF_EE','UIF_ER','SDL')`, [runId]
  );
  const sars = sarsBatch.rows[0];
  const sarsTotal = Math.abs(parseFloat(sars?.paye || 0)) + Math.abs(parseFloat(sars?.uif || 0)) + Math.abs(parseFloat(sars?.sdl || 0));

  const batches = [nettBatch.rows[0]];

  if (sarsTotal > 0) {
    const r = await dbQuery(
      `INSERT INTO payment_batches (run_id, batch_type, vendor_name, total_amount, employee_count, payment_method)
       VALUES ($1, 'THIRD_PARTY', 'SARS (PAYE + UIF + SDL)', $2, $3, $4) RETURNING *`,
      [runId, sarsTotal.toFixed(2), parseInt(sars.emp_count) || 0, paymentMethod]
    );
    batches.push(r.rows[0]);
  }

  for (const tp of thirdPartyAgg.rows) {
    const r = await dbQuery(
      `INSERT INTO payment_batches (run_id, batch_type, vendor_name, salary_head_id, total_amount, employee_count, payment_method)
       VALUES ($1, 'THIRD_PARTY', $2, $3, $4, $5, $6) RETURNING *`,
      [runId, tp.name, tp.salary_head_id, Math.abs(parseFloat(tp.total_amount)).toFixed(2), parseInt(tp.emp_count), paymentMethod]
    );
    batches.push(r.rows[0]);
  }

  return { success: true, batches };
}

async function getSystemSetting(key) {
  const r = await dbQuery('SELECT value FROM system_settings WHERE key = $1', [key]);
  return r.rows[0]?.value || null;
}

router.post('/runs/:id/gl-post', authenticate, auditLog('CREATE', 'payroll_gl_journal'), async (req, res, next) => {
  try {
    const result = await performGLPost(parseInt(req.params.id), req.user?.id || 1, req.body?.force || false);
    if (result.skipped) return res.json({ success: true, message: result.message, skipped: true });
    const journals = await dbQuery('SELECT * FROM payroll_gl_journals WHERE payroll_run_id = $1 ORDER BY id', [req.params.id]);
    res.json({ success: true, data: journals.rows, summary: result, message: `${result.journal_count} GL journal entries posted` });
  } catch (err) {
    if (err.code === 'NOT_FOUND') return res.status(404).json({ success: false, error: { code: err.code, message: err.message } });
    if (['INVALID_STATE', 'TRIAL_RUN', 'GL_IMBALANCE', 'MISSING_SCOA_MAPPING'].includes(err.code)) return res.status(400).json({ success: false, error: { code: err.code, message: err.message } });
    next(err);
  }
});

router.get('/runs/:id/gl-journals', authenticate, async (req, res, next) => {
  try {
    const journals = await dbQuery(
      'SELECT * FROM payroll_gl_journals WHERE payroll_run_id = $1 ORDER BY id',
      [req.params.id]
    );

    const glRollup = {};
    for (const j of journals.rows) {
      const key = j.scoa_item_id || 'UNMAPPED';
      if (!glRollup[key]) {
        glRollup[key] = { scoa_item_id: j.scoa_item_id, scoa_fund_id: j.scoa_fund_id, scoa_function_id: j.scoa_function_id, total_debit: 0, total_credit: 0, descriptions: new Set(), entry_count: 0 };
      }
      glRollup[key].total_debit += parseFloat(j.debit_amount || 0);
      glRollup[key].total_credit += parseFloat(j.credit_amount || 0);
      glRollup[key].descriptions.add(j.description);
      glRollup[key].entry_count++;
    }
    const glSummary = Object.values(glRollup).map(r => ({
      ...r, descriptions: Array.from(r.descriptions).join('; '),
      total_debit: parseFloat(r.total_debit.toFixed(2)),
      total_credit: parseFloat(r.total_credit.toFixed(2))
    })).sort((a, b) => (b.total_debit + b.total_credit) - (a.total_debit + a.total_credit));

    const totalDebits = journals.rows.reduce((s, j) => s + parseFloat(j.debit_amount || 0), 0);
    const totalCredits = journals.rows.reduce((s, j) => s + parseFloat(j.credit_amount || 0), 0);

    res.json({
      success: true,
      data: journals.rows,
      gl_summary: glSummary,
      totals: {
        total_debits: parseFloat(totalDebits.toFixed(2)),
        total_credits: parseFloat(totalCredits.toFixed(2)),
        balanced: Math.abs(totalDebits - totalCredits) < 0.01,
        journal_count: journals.rows.length
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/runs/:id/sub-ledger', authenticate, async (req, res, next) => {
  try {
    const runId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const [accountSummary, totalsResult, employeeSummary, employeeCount] = await Promise.all([
      dbQuery(
        `SELECT pr.scoa_item_id, pr.contra_scoa_item_id,
                COALESCE(sh.name, pr.transaction_type) AS head_name,
                SUM(ABS(pr.amount)) AS total_amount
         FROM payroll_results pr
         LEFT JOIN salary_heads sh ON pr.salary_head_id = sh.id
         WHERE pr.run_id = $1
         GROUP BY pr.scoa_item_id, pr.contra_scoa_item_id, head_name
         ORDER BY pr.scoa_item_id`, [runId]
      ),
      dbQuery(
        `SELECT COUNT(DISTINCT employee_id) AS total_employees,
                COALESCE(SUM(CASE WHEN transaction_type='EARNING' THEN amount ELSE 0 END),0) AS total_earnings,
                COALESCE(SUM(CASE WHEN transaction_type='DEDUCTION' THEN amount ELSE 0 END),0) AS total_deductions,
                COALESCE(SUM(CASE WHEN transaction_type='COMPANY_CONTRIBUTION' THEN amount ELSE 0 END),0) AS total_company,
                COUNT(*) AS total_lines
         FROM payroll_results WHERE run_id = $1`, [runId]
      ),
      dbQuery(
        `SELECT pr.employee_id,
                e.first_name || ' ' || e.surname AS employee_name,
                e.employee_code AS employee_number,
                COALESCE(SUM(CASE WHEN pr.transaction_type='EARNING' THEN pr.amount ELSE 0 END),0) AS total_earnings,
                COALESCE(SUM(CASE WHEN pr.transaction_type='DEDUCTION' THEN pr.amount ELSE 0 END),0) AS total_deductions,
                COALESCE(SUM(CASE WHEN pr.transaction_type='COMPANY_CONTRIBUTION' THEN pr.amount ELSE 0 END),0) AS total_company
         FROM payroll_results pr
         LEFT JOIN employees e ON pr.employee_id = e.id
         WHERE pr.run_id = $1
         GROUP BY pr.employee_id, e.first_name, e.surname, e.employee_code
         ORDER BY e.surname, e.first_name
         LIMIT $2 OFFSET $3`, [runId, limit, offset]
      ),
      dbQuery('SELECT COUNT(DISTINCT employee_id) AS cnt FROM payroll_results WHERE run_id = $1', [runId])
    ]);

    const byAccount = {};
    for (const r of accountSummary.rows) {
      const amt = parseFloat(r.total_amount || 0);
      const debitKey = r.scoa_item_id || 'UNMAPPED';
      if (!byAccount[debitKey]) byAccount[debitKey] = { scoa_item_id: r.scoa_item_id, total_debit: 0, total_credit: 0, line_count: 0, heads: new Set() };
      byAccount[debitKey].total_debit += amt;
      byAccount[debitKey].line_count++;
      byAccount[debitKey].heads.add(r.head_name);
      if (r.contra_scoa_item_id) {
        const creditKey = r.contra_scoa_item_id;
        if (!byAccount[creditKey]) byAccount[creditKey] = { scoa_item_id: r.contra_scoa_item_id, total_debit: 0, total_credit: 0, line_count: 0, heads: new Set() };
        byAccount[creditKey].total_credit += amt;
        byAccount[creditKey].line_count++;
        byAccount[creditKey].heads.add(r.head_name + ' (contra)');
      }
    }
    const accounts = Object.values(byAccount).map(a => ({
      ...a, heads: Array.from(a.heads).join(', '),
      total_debit: parseFloat(a.total_debit.toFixed(2)),
      total_credit: parseFloat(a.total_credit.toFixed(2))
    })).sort((a, b) => (a.scoa_item_id || '').localeCompare(b.scoa_item_id || ''));

    const t = totalsResult.rows[0];
    const totalEmpCount = parseInt(employeeCount.rows[0].cnt);

    res.json({
      success: true,
      by_employee: employeeSummary.rows.map(e => ({
        ...e,
        total_earnings: parseFloat(e.total_earnings),
        total_deductions: parseFloat(e.total_deductions),
        total_company: parseFloat(e.total_company)
      })),
      by_account: accounts,
      totals: {
        total_lines: parseInt(t.total_lines),
        total_employees: parseInt(t.total_employees),
        total_earnings: parseFloat(parseFloat(t.total_earnings).toFixed(2)),
        total_deductions: parseFloat(parseFloat(t.total_deductions).toFixed(2)),
        total_company: parseFloat(parseFloat(t.total_company).toFixed(2))
      },
      pagination: { page, limit, total: totalEmpCount, pages: Math.ceil(totalEmpCount / limit) }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/runs/:id/sub-ledger/employee/:empId', authenticate, async (req, res, next) => {
  try {
    const results = await dbQuery(
      `SELECT pr.transaction_type, pr.amount, pr.scoa_item_id, pr.contra_scoa_item_id,
              COALESCE(sh.code, pr.transaction_type) AS head_code,
              COALESCE(sh.name, pr.transaction_type) AS head_name
       FROM payroll_results pr
       LEFT JOIN salary_heads sh ON pr.salary_head_id = sh.id
       WHERE pr.run_id = $1 AND pr.employee_id = $2
       ORDER BY pr.transaction_type, sh.code`,
      [req.params.id, req.params.empId]
    );
    res.json({ success: true, entries: results.rows });
  } catch (err) { next(err); }
});

router.get('/runs/:id/reconcile', authenticate, async (req, res, next) => {
  try {
    const [glResult, slResult] = await Promise.all([
      dbQuery(
        `SELECT COALESCE(SUM(debit_amount),0) AS gl_debits, COALESCE(SUM(credit_amount),0) AS gl_credits, COUNT(*) AS gl_count
         FROM payroll_gl_journals WHERE payroll_run_id = $1`, [req.params.id]
      ),
      dbQuery(
        `SELECT
           COALESCE(SUM(CASE WHEN transaction_type = 'EARNING' OR transaction_type = 'FRINGE_BENEFIT' THEN ABS(amount) ELSE 0 END), 0) AS sl_earnings,
           COALESCE(SUM(CASE WHEN transaction_type = 'DEDUCTION' THEN ABS(amount) ELSE 0 END), 0) AS sl_deductions,
           COALESCE(SUM(CASE WHEN transaction_type = 'COMPANY_CONTRIBUTION' THEN ABS(amount) ELSE 0 END), 0) AS sl_company,
           COALESCE(SUM(ABS(amount)), 0) AS sl_total,
           COUNT(*) AS sl_count,
           COUNT(DISTINCT employee_id) AS sl_employees,
           SUM(CASE WHEN scoa_item_id IS NULL AND ABS(amount) > 0 THEN 1 ELSE 0 END) AS sl_missing_debit_scoa,
           SUM(CASE WHEN contra_scoa_item_id IS NULL AND ABS(amount) > 0 THEN 1 ELSE 0 END) AS sl_missing_credit_scoa
         FROM payroll_results WHERE run_id = $1`, [req.params.id]
      ),
    ]);

    const gl = glResult.rows[0];
    const sl = slResult.rows[0];

    const glDebits = parseFloat(gl.gl_debits);
    const glCredits = parseFloat(gl.gl_credits);
    const glBalanced = Math.abs(glDebits - glCredits) < 0.01;
    const glPosted = parseInt(gl.gl_count) > 0;

    const slTotal = parseFloat(sl.sl_total);
    const slEarnings = parseFloat(sl.sl_earnings);
    const slDeductions = parseFloat(sl.sl_deductions);
    const slCompany = parseFloat(sl.sl_company);

    let slToGlReconciled = false;
    let slToGlVariance = 0;
    if (glPosted) {
      slToGlVariance = parseFloat(Math.abs(glDebits - slTotal).toFixed(2));
      slToGlReconciled = slToGlVariance < 0.01;
    }

    const checks = [];

    checks.push({
      check: 'GL_BALANCE',
      description: 'GL debits must equal credits (double-entry integrity)',
      status: !glPosted ? 'NOT_APPLICABLE' : glBalanced ? 'PASS' : 'FAIL',
      detail: glPosted ? `DR R ${glDebits.toFixed(2)} | CR R ${glCredits.toFixed(2)} | Variance R ${Math.abs(glDebits - glCredits).toFixed(2)}` : 'GL not yet posted',
      severity: 'CRITICAL',
    });

    checks.push({
      check: 'SUB_LEDGER_TO_GL',
      description: 'Sub-ledger total must reconcile to GL debit total',
      status: !glPosted ? 'NOT_APPLICABLE' : slToGlReconciled ? 'PASS' : 'FAIL',
      detail: glPosted ? `SL Total R ${slTotal.toFixed(2)} | GL Debits R ${glDebits.toFixed(2)} | Variance R ${slToGlVariance.toFixed(2)}` : 'GL not yet posted',
      severity: 'CRITICAL',
    });

    checks.push({
      check: 'SCOA_DEBIT_MAPPING',
      description: 'All payroll result lines must have mSCOA debit account codes',
      status: parseInt(sl.sl_missing_debit_scoa) === 0 ? 'PASS' : 'FAIL',
      detail: `${sl.sl_missing_debit_scoa} lines missing debit mSCOA codes out of ${sl.sl_count}`,
      severity: 'HIGH',
    });

    checks.push({
      check: 'SCOA_CREDIT_MAPPING',
      description: 'All payroll result lines must have mSCOA contra (credit) account codes',
      status: parseInt(sl.sl_missing_credit_scoa) === 0 ? 'PASS' : 'FAIL',
      detail: `${sl.sl_missing_credit_scoa} lines missing credit mSCOA codes out of ${sl.sl_count}`,
      severity: 'HIGH',
    });

    checks.push({
      check: 'NETT_PAY_INTEGRITY',
      description: 'Sub-ledger earnings minus deductions must produce valid nett pay',
      status: slEarnings >= slDeductions ? 'PASS' : 'WARNING',
      detail: `Earnings R ${slEarnings.toFixed(2)} - Deductions R ${slDeductions.toFixed(2)} = Nett R ${(slEarnings - slDeductions).toFixed(2)}`,
      severity: 'MEDIUM',
    });

    const overallStatus = checks.some(c => c.status === 'FAIL' && c.severity === 'CRITICAL') ? 'FAIL'
      : checks.some(c => c.status === 'FAIL') ? 'WARNING' : 'PASS';

    res.json({
      success: true,
      reconciliation: {
        overall_status: overallStatus,
        gl_posted: glPosted,
        checks,
        gl_summary: {
          total_debits: parseFloat(glDebits.toFixed(2)),
          total_credits: parseFloat(glCredits.toFixed(2)),
          journal_count: parseInt(gl.gl_count),
          balanced: glBalanced,
        },
        sub_ledger_summary: {
          total_earnings: parseFloat(slEarnings.toFixed(2)),
          total_deductions: parseFloat(slDeductions.toFixed(2)),
          total_company_contributions: parseFloat(slCompany.toFixed(2)),
          total_amount: parseFloat(slTotal.toFixed(2)),
          line_count: parseInt(sl.sl_count),
          employee_count: parseInt(sl.sl_employees),
        },
        sl_to_gl_variance: slToGlVariance,
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/scoa/validate', authenticate, async (req, res, next) => {
  try {
    const { scoa_item_id, scoa_fund_id, scoa_function_id, scoa_project_id, scoa_region_id, scoa_costing_id } = req.body;

    const segments = {
      item: { value: scoa_item_id, pattern: /^[0-9]{4}$/, description: 'Item (4 digits)' },
      fund: { value: scoa_fund_id, pattern: /^[0-9]{4}$/, description: 'Fund (4 digits)' },
      function: { value: scoa_function_id, pattern: /^[0-9]{4}$/, description: 'Function (4 digits)' },
      project: { value: scoa_project_id, pattern: /^[A-Z0-9]{1,10}$/i, description: 'Project (alphanumeric, up to 10 chars)' },
      region: { value: scoa_region_id, pattern: /^[0-9]{4}$/, description: 'Region (4 digits)' },
      costing: { value: scoa_costing_id, pattern: /^[0-9]{4}$/, description: 'Costing (4 digits)' },
    };

    const errors = [];
    const validated = {};

    for (const [key, seg] of Object.entries(segments)) {
      if (seg.value) {
        if (!seg.pattern.test(seg.value)) {
          errors.push({ segment: key, value: seg.value, message: `Invalid format for ${seg.description}` });
        } else {
          validated[key] = seg.value;
        }
      }
    }

    if (scoa_item_id && scoa_fund_id && scoa_function_id) {
      const fullString = `${scoa_item_id}.${scoa_fund_id}.${scoa_function_id}`;
      validated.full_segment = fullString;
      if (scoa_project_id) validated.full_segment += `.${scoa_project_id}`;
      if (scoa_region_id) validated.full_segment += `.${scoa_region_id}`;
      if (scoa_costing_id) validated.full_segment += `.${scoa_costing_id}`;
    }

    res.json({
      success: true,
      data: {
        valid: errors.length === 0,
        errors,
        validated_segments: validated,
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/third-party-payments', authenticate, async (req, res, next) => {
  try {
    const { run_id } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = [];
    if (run_id) {
      whereClause += ' AND tpp.run_id = $1';
      params.push(parseInt(run_id, 10));
    }
    const result = await dbQuery(
      `SELECT tpp.*, sh.name AS salary_head_name
       FROM third_party_payments tpp
       LEFT JOIN salary_heads sh ON tpp.salary_head_id = sh.id
       ${whereClause}
       ORDER BY tpp.vendor_name`,
      params
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/third-party-payments', authenticate, auditLog('CREATE', 'third_party_payment'), async (req, res, next) => {
  try {
    const { vendor_name, vendor_reference, salary_head_id, total_amount, employee_count, status, payment_date, run_id, period_id } = req.body;
    if (!vendor_name) return res.status(400).json({ success: false, error: { message: 'Vendor name is required' } });
    if (total_amount === undefined || total_amount === null) return res.status(400).json({ success: false, error: { message: 'Total amount is required' } });
    const result = await dbQuery(
      `INSERT INTO third_party_payments (vendor_name, vendor_reference, salary_head_id, total_amount, employee_count, status, payment_date, run_id, period_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [vendor_name, vendor_reference || null, salary_head_id || null, parseFloat(total_amount), parseInt(employee_count) || 0, status || 'PENDING', payment_date || null, run_id || null, period_id || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.put('/third-party-payments/:id', authenticate, auditLog('UPDATE', 'third_party_payment'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { vendor_name, vendor_reference, salary_head_id, total_amount, employee_count, status, payment_date } = req.body;
    const result = await dbQuery(
      `UPDATE third_party_payments SET vendor_name = COALESCE($1, vendor_name), vendor_reference = $2, salary_head_id = $3,
       total_amount = COALESCE($4, total_amount), employee_count = COALESCE($5, employee_count), status = COALESCE($6, status),
       payment_date = $7 WHERE id = $8 RETURNING *`,
      [vendor_name, vendor_reference || null, salary_head_id || null, total_amount !== undefined && total_amount !== null ? parseFloat(total_amount) : null, employee_count !== undefined && employee_count !== null ? parseInt(employee_count) : null, status, payment_date || null, parseInt(id)]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: { message: 'Third party payment not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/third-party-payments/:id', authenticate, auditLog('DELETE', 'third_party_payment'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const check = await dbQuery('SELECT * FROM third_party_payments WHERE id = $1', [parseInt(id)]);
    if (check.rows.length === 0) return res.status(404).json({ success: false, error: { message: 'Third party payment not found' } });
    if (check.rows[0].status === 'PAID') return res.status(400).json({ success: false, error: { message: 'Cannot delete a payment that has already been paid' } });
    await dbQuery('DELETE FROM third_party_payments WHERE id = $1', [parseInt(id)]);
    res.json({ success: true, data: { message: `Third party payment #${id} deleted` } });
  } catch (err) {
    next(err);
  }
});

router.put('/third-party-payments/:id/status', authenticate, auditLog('UPDATE', 'third_party_payment'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['PENDING', 'APPROVED', 'PAID', 'CANCELLED'];
    if (!validStatuses.includes(status)) return res.status(400).json({ success: false, error: { message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` } });
    const result = await dbQuery('UPDATE third_party_payments SET status = $1 WHERE id = $2 RETURNING *', [status, parseInt(id)]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: { message: 'Third party payment not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get('/runs/:id/payment-batches', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT pb.*, sh.name AS salary_head_name, sh.code AS salary_head_code
       FROM payment_batches pb LEFT JOIN salary_heads sh ON pb.salary_head_id = sh.id
       WHERE pb.run_id = $1 ORDER BY pb.batch_type, pb.vendor_name`, [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/payment-batches/:id/detail', authenticate, async (req, res, next) => {
  try {
    const batch = await dbQuery(
      `SELECT pb.*, sh.name AS salary_head_name, sh.code AS salary_head_code
       FROM payment_batches pb LEFT JOIN salary_heads sh ON pb.salary_head_id = sh.id
       WHERE pb.id = $1`, [req.params.id]
    );
    if (batch.rows.length === 0) return res.status(404).json({ success: false, error: { message: 'Batch not found' } });
    const b = batch.rows[0];
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    let employees = { rows: [] };
    let totalCount = 0;
    if (b.batch_type === 'EMPLOYEE_NETT') {
      const countRes = await dbQuery(
        `SELECT COUNT(DISTINCT pr.employee_id) AS cnt FROM payroll_results pr WHERE pr.run_id = $1 AND pr.transaction_type = 'EARNING'`, [b.run_id]
      );
      totalCount = parseInt(countRes.rows[0].cnt);
      employees = await dbQuery(
        `SELECT e.employee_code, e.first_name, e.surname, e.id_number,
                COALESCE(SUM(CASE WHEN pr.transaction_type = 'EARNING' THEN pr.amount ELSE 0 END), 0) AS total_earnings,
                COALESCE(SUM(CASE WHEN pr.transaction_type = 'DEDUCTION' THEN pr.amount ELSE 0 END), 0) AS total_deductions,
                COALESCE(SUM(CASE WHEN pr.transaction_type = 'EARNING' THEN pr.amount ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN pr.transaction_type = 'DEDUCTION' THEN pr.amount ELSE 0 END), 0) AS nett_pay,
                e.bank_name, e.bank_account_number AS account_number
         FROM payroll_results pr
         JOIN employees e ON pr.employee_id = e.id
         WHERE pr.run_id = $1
         GROUP BY e.id, e.employee_code, e.first_name, e.surname, e.id_number, e.bank_name, e.bank_account_number
         ORDER BY e.surname, e.first_name
         LIMIT $2 OFFSET $3`,
        [b.run_id, limit, offset]
      );
    } else if (b.salary_head_id) {
      const countRes = await dbQuery(
        `SELECT COUNT(*) AS cnt FROM payroll_results WHERE run_id = $1 AND salary_head_id = $2`, [b.run_id, b.salary_head_id]
      );
      totalCount = parseInt(countRes.rows[0].cnt);
      employees = await dbQuery(
        `SELECT e.employee_code, e.first_name, e.surname, pr.amount, sh.name AS head_name
         FROM payroll_results pr
         JOIN employees e ON pr.employee_id = e.id
         LEFT JOIN salary_heads sh ON pr.salary_head_id = sh.id
         WHERE pr.run_id = $1 AND pr.salary_head_id = $2
         ORDER BY e.surname, e.first_name
         LIMIT $3 OFFSET $4`,
        [b.run_id, b.salary_head_id, limit, offset]
      );
    } else if (b.batch_type === 'THIRD_PARTY') {
      const countRes = await dbQuery(
        `SELECT COUNT(DISTINCT pr.employee_id) AS cnt
         FROM payroll_results pr
         JOIN salary_heads sh ON pr.salary_head_id = sh.id
         WHERE pr.run_id = $1 AND sh.code IN ('PAYE','UIF_EE','UIF_ER','SDL')`, [b.run_id]
      );
      totalCount = parseInt(countRes.rows[0].cnt);
      employees = await dbQuery(
        `SELECT e.employee_code, e.first_name, e.surname,
                COALESCE(SUM(pr.amount), 0) AS amount,
                STRING_AGG(DISTINCT sh.name, ', ') AS head_name
         FROM payroll_results pr
         JOIN employees e ON pr.employee_id = e.id
         JOIN salary_heads sh ON pr.salary_head_id = sh.id
         WHERE pr.run_id = $1 AND sh.code IN ('PAYE','UIF_EE','UIF_ER','SDL')
         GROUP BY e.id, e.employee_code, e.first_name, e.surname
         ORDER BY e.surname, e.first_name
         LIMIT $2 OFFSET $3`,
        [b.run_id, limit, offset]
      );
    }

    res.json({
      success: true,
      batch: b,
      employees: employees.rows,
      pagination: { page, limit, total: totalCount, pages: Math.ceil(totalCount / limit) }
    });
  } catch (err) { next(err); }
});

router.put('/payment-batches/:id/review', authenticate, auditLog('UPDATE', 'payment_batch'), async (req, res, next) => {
  try {
    const result = await dbQuery(
      `UPDATE payment_batches SET status = 'REVIEWED', reviewed_by = $1, reviewed_at = NOW() WHERE id = $2 AND status = 'PENDING_REVIEW' RETURNING *`,
      [req.user?.id || 1, req.params.id]
    );
    if (result.rows.length === 0) return res.status(400).json({ success: false, error: { message: 'Batch must be in PENDING_REVIEW status' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/payment-batches/:id/authorize', authenticate, auditLog('UPDATE', 'payment_batch'), async (req, res, next) => {
  try {
    const batch = await dbQuery('SELECT * FROM payment_batches WHERE id = $1', [req.params.id]);
    if (batch.rows.length === 0) return res.status(404).json({ success: false, error: { message: 'Batch not found' } });
    if (batch.rows[0].status !== 'REVIEWED') return res.status(400).json({ success: false, error: { message: 'Batch must be REVIEWED before authorizing' } });

    const h2hEnabled = await getSystemSetting('h2h_enabled');
    let newStatus = 'AUTHORIZED';
    let h2hRef = null;

    if (h2hEnabled === 'true' && batch.rows[0].payment_method === 'HOST_TO_HOST') {
      h2hRef = `H2H-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      newStatus = 'SUBMITTED';
    }

    const result = await dbQuery(
      `UPDATE payment_batches SET status = $1, authorized_by = $2, authorized_at = NOW(),
       h2h_reference = COALESCE($3, h2h_reference), h2h_submitted_at = CASE WHEN $3 IS NOT NULL THEN NOW() ELSE h2h_submitted_at END
       WHERE id = $4 RETURNING *`,
      [newStatus, req.user?.id || 1, h2hRef, req.params.id]
    );
    res.json({ success: true, data: result.rows[0], message: h2hRef ? `Submitted to bank. Reference: ${h2hRef}` : 'Batch authorized for payment' });
  } catch (err) { next(err); }
});

router.put('/payment-batches/:id/mark-paid', authenticate, auditLog('UPDATE', 'payment_batch'), async (req, res, next) => {
  try {
    const result = await dbQuery(
      `UPDATE payment_batches SET status = 'PAID' WHERE id = $1 AND status IN ('AUTHORIZED', 'SUBMITTED') RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(400).json({ success: false, error: { message: 'Batch must be AUTHORIZED or SUBMITTED to mark paid' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/payment-batches/:id/eft-file', authenticate, async (req, res, next) => {
  try {
    const batch = await dbQuery('SELECT * FROM payment_batches WHERE id = $1', [req.params.id]);
    if (batch.rows.length === 0) return res.status(404).json({ success: false, error: { message: 'Batch not found' } });
    if (!['REVIEWED', 'AUTHORIZED', 'SUBMITTED', 'PAID'].includes(batch.rows[0].status)) return res.status(400).json({ success: false, error: { message: 'Batch must be at least REVIEWED to generate EFT file' } });

    const { generateACBFile } = require('../services/eft.service');
    if (batch.rows[0].batch_type === 'EMPLOYEE_NETT') {
      const content = await generateACBFile(batch.rows[0].run_id);
      await dbQuery('UPDATE payment_batches SET eft_file_generated = TRUE WHERE id = $1', [req.params.id]);
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="EFT-Batch-${req.params.id}.acb"`);
      return res.send(content);
    }

    const batchData = batch.rows[0];
    const run = await dbQuery(
      `SELECT pr.*, pp.period_number, pp.tax_year FROM payroll_runs pr JOIN payroll_periods pp ON pr.period_id = pp.id WHERE pr.id = $1`, [batchData.run_id]
    );
    const payRun = run.rows[0];
    const lines = [`THIRD PARTY PAYMENT INSTRUCTION`, `Run: ${payRun?.id || batchData.run_id} | Period: ${payRun?.period_number || ''} | Tax Year: ${payRun?.tax_year || ''}`,
      `Vendor: ${batchData.vendor_name}`, `Total Amount: R ${parseFloat(batchData.total_amount).toFixed(2)}`, `Employees: ${batchData.employee_count}`, `Date: ${new Date().toISOString().split('T')[0]}`, ''];

    if (batchData.salary_head_id) {
      const details = await dbQuery(
        `SELECT e.employee_code, e.first_name, e.surname, pr.amount FROM payroll_results pr JOIN employees e ON pr.employee_id = e.id WHERE pr.run_id = $1 AND pr.salary_head_id = $2 ORDER BY e.surname`,
        [batchData.run_id, batchData.salary_head_id]
      );
      lines.push('Employee Code|Name|Amount');
      for (const d of details.rows) lines.push(`${d.employee_code}|${d.first_name} ${d.surname}|${parseFloat(d.amount).toFixed(2)}`);
    }

    await dbQuery('UPDATE payment_batches SET eft_file_generated = TRUE WHERE id = $1', [req.params.id]);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="ThirdParty-Batch-${req.params.id}.txt"`);
    res.send(lines.join('\r\n'));
  } catch (err) { next(err); }
});

router.get('/runs/:id/download-all-eft', authenticate, async (req, res, next) => {
  try {
    const runId = parseInt(req.params.id);
    const batches = await dbQuery(
      `SELECT * FROM payment_batches WHERE run_id = $1 AND status IN ('REVIEWED','AUTHORIZED','SUBMITTED','PAID') ORDER BY id`,
      [runId]
    );
    if (batches.rows.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'No eligible batches to download' } });
    }

    const archiver = require('archiver');
    const { generateACBFile } = require('../services/eft.service');

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="EFT-All-Run-${runId}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    const run = await dbQuery(
      `SELECT pr.*, pp.period_number, pp.tax_year FROM payroll_runs pr JOIN payroll_periods pp ON pr.period_id = pp.id WHERE pr.id = $1`, [runId]
    );
    const payRun = run.rows[0];

    for (const batch of batches.rows) {
      if (batch.batch_type === 'EMPLOYEE_NETT') {
        const content = await generateACBFile(batch.run_id);
        archive.append(content, { name: `EFT-Batch-${batch.id}-EmployeeNett.acb` });
      } else {
        const lines = [`THIRD PARTY PAYMENT INSTRUCTION`,
          `Run: ${payRun?.id || batch.run_id} | Period: ${payRun?.period_number || ''} | Tax Year: ${payRun?.tax_year || ''}`,
          `Vendor: ${batch.vendor_name}`, `Total Amount: R ${parseFloat(batch.total_amount).toFixed(2)}`,
          `Employees: ${batch.employee_count}`, `Date: ${new Date().toISOString().split('T')[0]}`, ''];

        if (batch.salary_head_id) {
          const details = await dbQuery(
            `SELECT e.employee_code, e.first_name, e.surname, pr.amount FROM payroll_results pr JOIN employees e ON pr.employee_id = e.id WHERE pr.run_id = $1 AND pr.salary_head_id = $2 ORDER BY e.surname`,
            [batch.run_id, batch.salary_head_id]
          );
          lines.push('Employee Code|Name|Amount');
          for (const d of details.rows) lines.push(`${d.employee_code}|${d.first_name} ${d.surname}|${parseFloat(d.amount).toFixed(2)}`);
        }
        const safeName = (batch.vendor_name || 'ThirdParty').replace(/[^a-zA-Z0-9]/g, '_');
        archive.append(lines.join('\r\n'), { name: `ThirdParty-Batch-${batch.id}-${safeName}.txt` });
      }
      await dbQuery('UPDATE payment_batches SET eft_file_generated = TRUE WHERE id = $1', [batch.id]);
    }

    await archive.finalize();
  } catch (err) { next(err); }
});

router.get('/runs/:id/payment-reports/:reportType', authenticate, async (req, res, next) => {
  try {
    const runId = parseInt(req.params.id);
    const { reportType } = req.params;

    switch (reportType) {
      case 'nett-pay-register': {
        const result = await dbQuery(
          `SELECT e.employee_code, e.first_name, e.surname, e.bank_name, e.bank_account_number,
                  SUM(CASE WHEN pr.transaction_type='EARNING' THEN pr.amount ELSE 0 END) AS gross,
                  SUM(CASE WHEN pr.transaction_type='DEDUCTION' THEN pr.amount ELSE 0 END) AS deductions,
                  SUM(CASE WHEN pr.transaction_type='EARNING' THEN pr.amount ELSE 0 END) -
                  SUM(CASE WHEN pr.transaction_type='DEDUCTION' THEN pr.amount ELSE 0 END) AS nett_pay
           FROM payroll_results pr JOIN employees e ON pr.employee_id = e.id
           WHERE pr.run_id = $1 GROUP BY e.id, e.employee_code, e.first_name, e.surname, e.bank_name, e.bank_account_number
           ORDER BY e.surname`, [runId]
        );
        return res.json({ success: true, data: result.rows, report_type: 'nett-pay-register', title: 'Nett Pay Register' });
      }
      case 'deduction-register': {
        const result = await dbQuery(
          `SELECT sh.code, sh.name AS head_name, COUNT(DISTINCT pr.employee_id) AS emp_count, SUM(pr.amount) AS total_amount
           FROM payroll_results pr JOIN salary_heads sh ON pr.salary_head_id = sh.id
           WHERE pr.run_id = $1 AND pr.transaction_type = 'DEDUCTION'
           GROUP BY sh.id, sh.code, sh.name ORDER BY sh.name`, [runId]
        );
        return res.json({ success: true, data: result.rows, report_type: 'deduction-register', title: 'Deduction Register' });
      }
      case 'third-party-summary': {
        const result = await dbQuery(
          `SELECT sh.name AS vendor, sh.code, sh.transaction_type,
                  COUNT(DISTINCT pr.employee_id) AS emp_count, SUM(pr.amount) AS total_amount
           FROM payroll_results pr JOIN salary_heads sh ON pr.salary_head_id = sh.id
           WHERE pr.run_id = $1 AND sh.transaction_type IN ('DEDUCTION', 'COMPANY_CONTRIBUTION')
           GROUP BY sh.id, sh.name, sh.code, sh.transaction_type ORDER BY sh.name`, [runId]
        );
        return res.json({ success: true, data: result.rows, report_type: 'third-party-summary', title: 'Third-Party Payment Summary' });
      }
      case 'bank-recon': {
        const run = await dbQuery('SELECT * FROM payroll_runs WHERE id = $1', [runId]);
        const empResult = await dbQuery(
          `SELECT COUNT(DISTINCT e.id) AS total_emps,
                  COUNT(DISTINCT e.id) FILTER (WHERE e.bank_account_number IS NOT NULL AND e.bank_account_number != '') AS with_bank,
                  COUNT(DISTINCT e.id) FILTER (WHERE e.bank_account_number IS NULL OR e.bank_account_number = '') AS without_bank,
                  SUM(CASE WHEN pr.transaction_type='EARNING' THEN pr.amount ELSE 0 END) -
                  SUM(CASE WHEN pr.transaction_type='DEDUCTION' THEN pr.amount ELSE 0 END) AS total_nett_from_results
           FROM payroll_results pr JOIN employees e ON pr.employee_id = e.id WHERE pr.run_id = $1`, [runId]
        );
        const batchTotal = await dbQuery(
          `SELECT COALESCE(SUM(total_amount),0) AS batch_total FROM payment_batches WHERE run_id = $1 AND batch_type = 'EMPLOYEE_NETT'`, [runId]
        );
        const r = run.rows[0] || {};
        const emp = empResult.rows[0] || {};
        return res.json({
          success: true, data: {
            run_nett_total: parseFloat(r.total_nett || 0),
            results_nett_total: parseFloat(emp.total_nett_from_results || 0),
            eft_batch_total: parseFloat(batchTotal.rows[0]?.batch_total || 0),
            employees_total: parseInt(emp.total_emps || 0),
            employees_with_bank: parseInt(emp.with_bank || 0),
            employees_without_bank: parseInt(emp.without_bank || 0),
            variance: parseFloat((parseFloat(r.total_nett || 0) - parseFloat(batchTotal.rows[0]?.batch_total || 0)).toFixed(2)),
          },
          report_type: 'bank-recon', title: 'Bank File Reconciliation'
        });
      }
      case 'variance': {
        const run = await dbQuery('SELECT *, cycle_id, period_id FROM payroll_runs WHERE id = $1', [runId]);
        if (run.rows.length === 0) return res.status(404).json({ success: false, error: { message: 'Run not found' } });
        const currentRun = run.rows[0];
        const prevRun = await dbQuery(
          `SELECT pr.* FROM payroll_runs pr
           JOIN payroll_periods pp ON pr.period_id = pp.id
           JOIN payroll_periods cpp ON cpp.id = $2
           WHERE pr.cycle_id = $1 AND pr.id != $3 AND pr.run_type IN ('FINAL','ADHOC_FINAL')
           AND pp.period_number < cpp.period_number AND pp.tax_year = cpp.tax_year
           ORDER BY pp.period_number DESC LIMIT 1`,
          [currentRun.cycle_id, currentRun.period_id, runId]
        );
        const prev = prevRun.rows[0] || {};
        const fields = ['total_earnings', 'total_deductions', 'total_company_contributions', 'total_nett', 'total_paye', 'total_uif', 'total_sdl', 'employee_count'];
        const comparison = fields.map(f => ({
          field: f.replace(/total_/g, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          current: parseFloat(currentRun[f] || 0),
          previous: parseFloat(prev[f] || 0),
          variance: parseFloat((parseFloat(currentRun[f] || 0) - parseFloat(prev[f] || 0)).toFixed(2)),
          variance_pct: prev[f] && parseFloat(prev[f]) !== 0 ? parseFloat((((parseFloat(currentRun[f] || 0) - parseFloat(prev[f] || 0)) / parseFloat(prev[f])) * 100).toFixed(2)) : null,
        }));
        return res.json({ success: true, data: comparison, has_previous: prevRun.rows.length > 0, report_type: 'variance', title: 'Period Variance Report' });
      }
      default:
        return res.status(400).json({ success: false, error: { message: `Unknown report type: ${reportType}` } });
    }
  } catch (err) { next(err); }
});

router.post('/runs/:id/generate-batches', authenticate, auditLog('CREATE', 'payment_batch'), async (req, res, next) => {
  try {
    const result = await generatePaymentBatches(parseInt(req.params.id));
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

router.get('/councillor-register', authenticate, async (req, res, next) => {
  try {
    const councillors = await dbQuery(
      `SELECT e.id, e.employee_code, e.first_name, e.surname, e.annual_salary,
              e.joining_date, e.status,
              p.title AS position_title, p.position_code
       FROM employees e
       LEFT JOIN positions p ON e.position_id = p.id
       WHERE e.is_councillor = TRUE AND e.enabled = TRUE
       ORDER BY e.surname, e.first_name`
    );

    let upperLimits = { rows: [] };
    try {
      upperLimits = await dbQuery(
        `SELECT * FROM councillor_upper_limits WHERE effective_date <= CURRENT_DATE ORDER BY council_category, position_type`
      );
    } catch (e) {}

    const limitsMap = {};
    for (const ul of upperLimits.rows) {
      const key = `${ul.council_category}_${ul.position_type}`;
      if (!limitsMap[key] || new Date(ul.effective_date) > new Date(limitsMap[key].effective_date)) {
        limitsMap[key] = ul;
      }
    }

    const register = councillors.rows.map(c => {
      const annual = parseFloat(c.annual_salary || 0);
      let applicableLimit = null;
      let overLimit = false;
      for (const [key, limit] of Object.entries(limitsMap)) {
        if (!applicableLimit || parseFloat(limit.annual_limit) > parseFloat(applicableLimit.annual_limit)) {
          applicableLimit = limit;
        }
      }
      if (applicableLimit) {
        overLimit = annual > parseFloat(applicableLimit.annual_limit);
      }
      return {
        ...c,
        annual_salary: annual,
        applicable_limit: applicableLimit ? parseFloat(applicableLimit.annual_limit) : null,
        over_limit: overLimit,
        gazette_reference: applicableLimit?.gazette_reference || null
      };
    });

    res.json({
      success: true,
      data: register,
      summary: {
        total_councillors: register.length,
        over_limit: register.filter(r => r.over_limit).length,
        total_annual_cost: register.reduce((sum, r) => sum + r.annual_salary, 0)
      }
    });
  } catch (err) { next(err); }
});

// === GRAP 25 LEAVE LIABILITY ===
router.post('/leave-liability', authenticate, async (req, res, next) => {
  try {
    const leaveEngine = require('../services/leave-engine.service');
    const asAtDate = req.body.as_at_date || new Date().toISOString().split('T')[0];
    const liability = await leaveEngine.calculateLeaveLiability(asAtDate);

    const leaveProvisionItem = await dbQuery(`SELECT id FROM scoa_items WHERE code = 'IA001001009' LIMIT 1`);
    const leaveCostItem = await dbQuery(`SELECT id FROM scoa_items WHERE code = 'IE001002015' LIMIT 1`);

    if (req.body.post_journal) {
      await dbQuery(
        `INSERT INTO payroll_gl_journals (run_id, scoa_item_id, debit_amount, credit_amount, description, posted_by, posted_at)
         VALUES (NULL, $1, $2, 0, $3, $4, NOW()), (NULL, $5, 0, $2, $3, $4, NOW())`,
        [leaveCostItem.rows[0]?.id || null, liability.total_liability, `GRAP 25 Leave Liability Provision as at ${asAtDate}`,
         req.user?.id || 1, leaveProvisionItem.rows[0]?.id || null]
      );
    }

    res.json({ success: true, data: liability, message: req.body.post_journal ? 'Leave liability calculated and GL journal posted' : 'Leave liability calculated' });
  } catch (err) { next(err); }
});

// === GRAP 25 BONUS ACCRUAL ===
router.post('/bonus-accrual', authenticate, async (req, res, next) => {
  try {
    const leaveEngine = require('../services/leave-engine.service');
    const asAtDate = req.body.as_at_date || new Date().toISOString().split('T')[0];
    const accrual = await leaveEngine.calculateBonusAccrual(asAtDate);

    if (req.body.post_journal) {
      await dbQuery(
        `INSERT INTO payroll_gl_journals (run_id, scoa_item_id, debit_amount, credit_amount, description, posted_by, posted_at)
         VALUES (NULL, NULL, $1, 0, $2, $3, NOW()), (NULL, NULL, 0, $1, $2, $3, NOW())`,
        [accrual.accrual_amount, `GRAP 25 13th Cheque Provision as at ${asAtDate}`, req.user?.id || 1]
      );
    }

    res.json({ success: true, data: accrual, message: req.body.post_journal ? 'Bonus accrual calculated and GL journal posted' : 'Bonus accrual calculated' });
  } catch (err) { next(err); }
});

// === SALARY INCREASES ===
router.get('/salary-increases', authenticate, async (req, res, next) => {
  try {
    const { status, department_id } = req.query;
    let sql = `SELECT si.*, e.employee_code, e.first_name, e.surname, e.annual_salary AS current_salary
               FROM salary_increases si JOIN employees e ON si.employee_id = e.id WHERE 1=1`;
    const params = [];
    if (status) { params.push(status); sql += ` AND si.status = $${params.length}`; }
    sql += ' ORDER BY si.created_at DESC LIMIT 500';
    const result = await dbQuery(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/salary-increases/mass', authenticate, async (req, res, next) => {
  try {
    const { increase_type, increase_value, effective_date, department_id, employee_type_id } = req.body;
    let empSql = `SELECT e.id, e.annual_salary, e.current_notch, e.task_grade_id FROM employees e
                  LEFT JOIN positions p ON e.position_id = p.id WHERE e.status = 'ACTIVE' AND e.enabled = TRUE`;
    const params = [];
    if (department_id) { params.push(department_id); empSql += ` AND p.department_id = $${params.length}`; }
    if (employee_type_id) { params.push(employee_type_id); empSql += ` AND e.employee_type_id = $${params.length}`; }

    const employees = await dbQuery(empSql, params);
    let created = 0;
    for (const emp of employees.rows) {
      const oldSalary = parseFloat(emp.annual_salary || 0);
      let newSalary = oldSalary;
      if (increase_type === 'PERCENTAGE') {
        newSalary = parseFloat((oldSalary * (1 + parseFloat(increase_value) / 100)).toFixed(2));
      } else if (increase_type === 'AMOUNT') {
        newSalary = parseFloat((oldSalary + parseFloat(increase_value)).toFixed(2));
      } else if (increase_type === 'NOTCH') {
        const nextNotch = await dbQuery(
          `SELECT annual_value FROM task_grade_notches WHERE task_grade_id = $1 AND notch_number = $2`,
          [emp.task_grade_id, (emp.current_notch || 0) + 1]
        );
        if (nextNotch.rows.length) newSalary = parseFloat(nextNotch.rows[0].annual_value);
      }

      await dbQuery(
        `INSERT INTO salary_increases (employee_id, increase_type, increase_value, effective_date, old_salary, new_salary, old_notch, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')`,
        [emp.id, increase_type, increase_value, effective_date, oldSalary, newSalary, emp.current_notch]
      );
      created++;
    }
    res.json({ success: true, message: `${created} salary increase records created`, count: created });
  } catch (err) { next(err); }
});

router.post('/salary-increases/:id/approve', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `UPDATE salary_increases SET status = 'APPROVED', approved_by = $2 WHERE id = $1 AND status = 'PENDING' RETURNING *`,
      [req.params.id, req.user?.id || 1]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Increase not found or not pending' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.post('/salary-increases/:id/apply', authenticate, async (req, res, next) => {
  try {
    const inc = await dbQuery(`SELECT * FROM salary_increases WHERE id = $1 AND status = 'APPROVED'`, [req.params.id]);
    if (!inc.rows.length) return res.status(404).json({ success: false, error: { message: 'Approved increase not found' } });
    const increase = inc.rows[0];

    const newMonthly = parseFloat((increase.new_salary / 12).toFixed(2));
    await dbQuery(`UPDATE employees SET annual_salary = $1, monthly_salary = $2 WHERE id = $3`, [increase.new_salary, newMonthly, increase.employee_id]);
    await dbQuery(
      `INSERT INTO employee_history (employee_id, field_name, old_value, new_value, changed_by, changed_at)
       VALUES ($1, 'annual_salary', $2, $3, $4, NOW())`,
      [increase.employee_id, String(increase.old_salary), String(increase.new_salary), req.user?.id || 1]
    );

    await dbQuery(`UPDATE salary_increases SET status = 'APPLIED' WHERE id = $1`, [req.params.id]);
    res.json({ success: true, message: 'Salary increase applied', data: increase });
  } catch (err) { next(err); }
});

router.get('/payslip-view/employees', authenticate, authorize('admin', 'payroll_admin', 'payroll_officer'), async (req, res, next) => {
  try {
    const { cycle_id, search, page = 1, limit = 50, sort_by = 'surname', sort_order = 'asc' } = req.query;
    if (!cycle_id) return res.status(400).json({ success: false, message: 'cycle_id is required' });

    const periodResult = await dbQuery(
      `SELECT pp.*, pc.name AS cycle_name, pc.cycle_type, pc.periods_per_year
       FROM payroll_periods pp
       JOIN payroll_cycles pc ON pp.cycle_id = pc.id
       WHERE pp.cycle_id = $1 AND pp.status IN ('OPEN', 'TRIAL')
       ORDER BY pp.tax_year DESC, pp.period_number ASC LIMIT 1`,
      [cycle_id]
    );

    if (periodResult.rows.length === 0) {
      return res.json({ success: true, data: [], period: null, meta: { total: 0, page: 1, limit: parseInt(limit) } });
    }
    const period = periodResult.rows[0];

    let whereClause = `WHERE e.status = 'ACTIVE' AND e.payroll_cycle_id = $1`;
    const params = [cycle_id];
    let pi = 2;

    if (search) {
      const isNumeric = /^\d+$/.test(search.trim());
      if (isNumeric) {
        whereClause += ` AND (CAST(e.id AS TEXT) ILIKE $${pi} OR e.employee_code ILIKE $${pi} OR e.id_number ILIKE $${pi})`;
        params.push(`%${search.trim()}%`);
        pi++;
      } else {
        whereClause += ` AND (
          e.employee_code ILIKE $${pi} OR
          e.id_number ILIKE $${pi} OR
          e.first_name ILIKE $${pi} OR
          e.surname ILIKE $${pi} OR
          CONCAT(e.first_name, ' ', e.surname) ILIKE $${pi}
        )`;
        params.push(`%${search}%`);
        pi++;
      }
    }

    const countResult = await dbQuery(`SELECT COUNT(*) FROM employees e ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit));
    params.push(offset);

    const empResult = await dbQuery(
      `SELECT e.id, e.employee_code, e.id_number, e.first_name, e.surname,
              e.date_of_birth, e.annual_salary, e.status,
              p.title AS job_title
       FROM employees e
       LEFT JOIN positions p ON e.position_id = p.id
       ${whereClause}
       ORDER BY ${(() => {
         const allowed = { id: 'e.id', employee_code: 'e.employee_code', id_number: 'e.id_number', surname: 'e.surname', first_name: 'e.first_name', job_title: 'p.title' };
         const col = allowed[sort_by] || 'e.surname';
         const dir = sort_order === 'desc' ? 'DESC' : 'ASC';
         return col === 'e.surname' ? `${col} ${dir}, e.first_name ${dir}` : `${col} ${dir}`;
       })()}
       LIMIT $${pi} OFFSET $${pi + 1}`,
      params
    );

    res.json({
      success: true,
      data: empResult.rows,
      period: {
        id: period.id,
        period_number: period.period_number,
        tax_year: period.tax_year,
        start_date: period.start_date,
        end_date: period.end_date,
        payment_date: period.payment_date,
        status: period.status,
        cycle_name: period.cycle_name,
        cycle_type: period.cycle_type,
      },
      meta: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) { next(err); }
});

router.get('/payslip-view/employee/:employeeId/calculate', authenticate, authorize('admin', 'payroll_admin', 'payroll_officer'), async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { period_id, cycle_id } = req.query;
    if (!period_id || !cycle_id) return res.status(400).json({ success: false, message: 'period_id and cycle_id are required' });

    const empDetail = await dbQuery(
      `SELECT e.*, p.title AS position_title, p.position_code,
              jp.job_title AS job_profile_title
       FROM employees e
       LEFT JOIN positions p ON e.position_id = p.id
       LEFT JOIN job_profiles jp ON p.job_profile_id = jp.id
       WHERE e.id = $1`,
      [employeeId]
    );
    if (empDetail.rows.length === 0) return res.status(404).json({ success: false, message: 'Employee not found' });

    let result;
    try {
      result = await calculatePayslipForEmployee(parseInt(employeeId), parseInt(period_id), parseInt(cycle_id));
    } catch (calcErr) {
      const msg = calcErr.message || 'Calculation failed';
      if (msg.includes('not found')) return res.status(404).json({ success: false, message: msg });
      if (msg.includes('does not belong')) return res.status(400).json({ success: false, message: msg });
      throw calcErr;
    }

    const emp = empDetail.rows[0];
    const sortById = (a, b) => (a.salary_head_id || 0) - (b.salary_head_id || 0);

    function groupByHeadAndRef(items) {
      const grouped = {};
      for (const item of items) {
        const ref = (item.reference_no || '').trim();
        const key = `${item.salary_head_id}::${ref}`;
        if (!grouped[key]) {
          grouped[key] = { ...item };
          if (ref) {
            grouped[key].head_name = `${item.head_name} (${ref})`;
          }
        } else {
          grouped[key].amount = parseFloat((grouped[key].amount + item.amount).toFixed(2));
        }
      }
      return Object.values(grouped);
    }

    const earnings = groupByHeadAndRef(result.results.filter(r => r.transaction_type === 'EARNING')).sort(sortById);
    const deductions = groupByHeadAndRef(result.results.filter(r => r.transaction_type === 'DEDUCTION')).sort(sortById);
    const companyContribs = groupByHeadAndRef(result.results.filter(r => r.transaction_type === 'COMPANY_CONTRIBUTION')).sort(sortById);
    const fringeBenefits = groupByHeadAndRef(result.results.filter(r => r.transaction_type === 'FRINGE_BENEFIT')).sort(sortById);

    res.json({
      success: true,
      data: {
        employee: {
          id: emp.id,
          employee_code: emp.employee_code,
          id_number: emp.id_number,
          first_name: emp.first_name,
          surname: emp.surname,
          date_of_birth: emp.date_of_birth,
          position_title: emp.position_title || emp.job_profile_title || '',
          department_name: emp.department_name || '',
          division_name: emp.division_name || '',
          income_tax_number: emp.income_tax_number,
        },
        earnings,
        deductions,
        company_contributions: companyContribs,
        fringe_benefits: fringeBenefits,
        summary: result.summary,
        salaryStructure: result.salaryStructure,
        payeBreakdown: result.payeBreakdown,
        medicalAid: result.medicalAid,
        retirementFunds: result.retirementFunds,
        period: result.period,
        transactions: result.transactions,
      }
    });
  } catch (err) { next(err); }
});

router.get('/payslip-view/employee/:employeeId/paye-breakdown', authenticate, authorize('admin', 'payroll_admin', 'payroll_officer'), async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { period_id, cycle_id } = req.query;
    if (!period_id || !cycle_id) return res.status(400).json({ success: false, message: 'period_id and cycle_id are required' });

    let result;
    try {
      result = await calculatePayslipForEmployee(parseInt(employeeId), parseInt(period_id), parseInt(cycle_id));
    } catch (calcErr) {
      const msg = calcErr.message || 'Calculation failed';
      if (msg.includes('not found')) return res.status(404).json({ success: false, message: msg });
      if (msg.includes('does not belong')) return res.status(400).json({ success: false, message: msg });
      throw calcErr;
    }

    res.json({
      success: true,
      data: result.payeBreakdown,
    });
  } catch (err) { next(err); }
});

router.post('/payslip-view/employee/:employeeId/transactions', authenticate, authorize('admin', 'payroll_admin'), async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { salary_head_id, amount, entry_date, reference_no, every_month, period_end_date, cycle_id } = req.body;
    if (!salary_head_id || amount === undefined) return res.status(400).json({ success: false, message: 'salary_head_id and amount are required' });

    const headResult = await dbQuery('SELECT * FROM salary_heads WHERE id = $1', [salary_head_id]);
    if (headResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Salary head not found' });
    const head = headResult.rows[0];

    const systemCodes = ['PAYE', 'UIF_EE', 'UIF_ER', 'SDL'];
    if (systemCodes.includes(head.code)) {
      return res.status(400).json({ success: false, message: 'System-calculated transactions cannot be added manually' });
    }

    const checkDate = period_end_date || entry_date || new Date().toISOString().split('T')[0];
    const alreadyAssigned = await dbQuery(
      `SELECT 1 FROM employee_salary_transactions
       WHERE employee_id = $1 AND salary_head_id = $2 AND enabled = TRUE
       AND start_date <= $3 AND end_date >= $3 LIMIT 1`,
      [employeeId, salary_head_id, checkDate]
    );
    let isAllowed = alreadyAssigned.rows.length > 0;

    if (!isAllowed) {
      const empStg = await dbQuery(
        `SELECT COALESCE(p.salary_transaction_group_id, jp.salary_transaction_group_id) AS stg_id
         FROM employees e
         LEFT JOIN positions p ON e.position_id = p.id
         LEFT JOIN job_profiles jp ON p.job_profile_id = jp.id
         WHERE e.id = $1`,
        [employeeId]
      );
      if (empStg.rows.length > 0 && empStg.rows[0].stg_id) {
        const inGroup = await dbQuery(
          'SELECT 1 FROM salary_transaction_group_items WHERE group_id = $1 AND salary_head_id = $2',
          [empStg.rows[0].stg_id, salary_head_id]
        );
        isAllowed = inGroup.rows.length > 0;
      }
    }

    if (!isAllowed) {
      return res.status(400).json({ success: false, message: 'This salary head is not in the employee\'s allowed transaction list' });
    }

    const entryDate = entry_date || period_end_date || new Date().toISOString().split('T')[0];
    const capturedAmount = parseFloat(parseFloat(amount).toFixed(2));

    let estId = null;
    const estLookup = await dbQuery(
      `SELECT id FROM employee_salary_transactions
       WHERE employee_id = $1 AND salary_head_id = $2 AND enabled = TRUE LIMIT 1`,
      [employeeId, salary_head_id]
    );
    if (estLookup.rows.length > 0) {
      estId = estLookup.rows[0].id;
    } else {
      const newEst = await dbQuery(
        `INSERT INTO employee_salary_transactions (employee_id, salary_head_id, start_date, end_date, enabled, created_at)
         VALUES ($1, $2, '1900-01-01', '9999-12-31', TRUE, NOW()) RETURNING id`,
        [employeeId, salary_head_id]
      );
      estId = newEst.rows[0].id;
    }

    let periodIdVal = null;
    if (!every_month && period_end_date) {
      const periodLookup = await dbQuery(
        `SELECT id FROM payroll_periods WHERE end_date = $1 LIMIT 1`,
        [period_end_date]
      );
      if (periodLookup.rows.length > 0) periodIdVal = periodLookup.rows[0].id;
    }

    const insertResult = await dbQuery(
      `INSERT INTO employee_payslip_transactions (employee_salary_transaction_id, employee_id, salary_head_id, captured_amount, entry_date, enabled, period_id, every_month, reference_no, created_at, created_by)
       VALUES ($1, $2, $3, $4, $5, TRUE, $6, $7, $8, NOW(), $9) RETURNING *`,
      [estId, employeeId, salary_head_id, capturedAmount, entryDate, periodIdVal, every_month || false, reference_no || '', req.user?.id || 1]
    );

    res.status(201).json({ success: true, data: insertResult.rows[0], message: 'Transaction added successfully' });
  } catch (err) { next(err); }
});

router.get('/payslip-view/employee/:employeeId/transactions-by-head/:salaryHeadId', authenticate, authorize('admin', 'payroll_admin', 'payroll_officer'), async (req, res, next) => {
  try {
    const { employeeId, salaryHeadId } = req.params;
    const result = await dbQuery(
      `SELECT ept.id, ept.captured_amount, ept.entry_date, ept.reference_no, ept.every_month,
              ept.period_id,
              CASE WHEN pp.id IS NOT NULL
                THEN 'Period ' || pp.period_number || ' (' || TO_CHAR(pp.start_date, 'DD/MM/YYYY') || ' - ' || TO_CHAR(pp.end_date, 'DD/MM/YYYY') || ')'
                ELSE NULL END AS period_name
       FROM employee_payslip_transactions ept
       LEFT JOIN payroll_periods pp ON ept.period_id = pp.id
       WHERE ept.employee_id = $1 AND ept.salary_head_id = $2 AND ept.enabled = TRUE
       ORDER BY ept.created_at DESC`,
      [employeeId, salaryHeadId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.put('/payslip-view/employee/:employeeId/transactions/:transactionId', authenticate, authorize('admin', 'payroll_admin'), async (req, res, next) => {
  try {
    const { employeeId, transactionId } = req.params;
    const { amount, entry_date, reference_no, every_month, period_end_date } = req.body;
    if (amount === undefined) return res.status(400).json({ success: false, message: 'amount is required' });

    const capturedAmount = parseFloat(parseFloat(amount).toFixed(2));

    const existing = await dbQuery(
      'SELECT period_id FROM employee_payslip_transactions WHERE id = $1 AND employee_id = $2 AND enabled = TRUE',
      [transactionId, employeeId]
    );
    if (existing.rows.length === 0) return res.status(404).json({ success: false, message: 'Payslip transaction not found' });

    let periodIdVal = existing.rows[0].period_id;
    if (every_month) {
      periodIdVal = null;
    } else if (period_end_date) {
      const periodLookup = await dbQuery(
        `SELECT id FROM payroll_periods WHERE end_date = $1 LIMIT 1`,
        [period_end_date]
      );
      if (periodLookup.rows.length > 0) periodIdVal = periodLookup.rows[0].id;
    }

    const result = await dbQuery(
      `UPDATE employee_payslip_transactions
       SET captured_amount = $1, entry_date = COALESCE($2, entry_date), reference_no = COALESCE($3, reference_no),
           every_month = $4, period_id = $5, updated_at = NOW(), updated_by = $6
       WHERE id = $7 AND employee_id = $8 AND enabled = TRUE RETURNING *`,
      [capturedAmount, entry_date || null, reference_no !== undefined ? reference_no : null, every_month || false, periodIdVal, req.user?.id || 1, transactionId, employeeId]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Payslip transaction not found' });
    res.json({ success: true, data: result.rows[0], message: 'Transaction updated successfully' });
  } catch (err) { next(err); }
});

router.delete('/payslip-view/employee/:employeeId/transactions/:transactionId', authenticate, authorize('admin', 'payroll_admin'), async (req, res, next) => {
  try {
    const { employeeId, transactionId } = req.params;

    const result = await dbQuery(
      `UPDATE employee_payslip_transactions SET enabled = FALSE, updated_at = NOW(), updated_by = $3
       WHERE id = $1 AND employee_id = $2 RETURNING *`,
      [transactionId, employeeId, req.user?.id || 1]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Payslip transaction not found' });
    res.json({ success: true, message: 'Transaction removed', data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/payslip-view/employee/:employeeId/available-transactions', authenticate, authorize('admin', 'payroll_admin', 'payroll_officer'), async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { period_end_date, on_payslip, transaction_type } = req.query;

    const empResult = await dbQuery(
      `SELECT e.position_id, p.salary_transaction_group_id AS pos_stg_id, p.job_profile_id,
              jp.salary_transaction_group_id AS jp_stg_id
       FROM employees e
       LEFT JOIN positions p ON e.position_id = p.id
       LEFT JOIN job_profiles jp ON p.job_profile_id = jp.id
       WHERE e.id = $1`,
      [employeeId]
    );

    if (empResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Employee not found' });
    const emp = empResult.rows[0];
    const stgId = emp.pos_stg_id || emp.jp_stg_id;

    const allowedHeadIds = new Set();

    let estQuery = `SELECT DISTINCT salary_head_id FROM employee_salary_transactions
       WHERE employee_id = $1 AND enabled = TRUE`;
    const estParams = [employeeId];
    if (period_end_date) {
      estQuery += ` AND start_date <= $2 AND end_date >= $2`;
      estParams.push(period_end_date);
    }
    const estRows = await dbQuery(estQuery, estParams);
    estRows.rows.forEach(r => allowedHeadIds.add(r.salary_head_id));

    if (stgId) {
      const stgRows = await dbQuery(
        `SELECT salary_head_id FROM salary_transaction_group_items WHERE group_id = $1`,
        [stgId]
      );
      stgRows.rows.forEach(r => allowedHeadIds.add(r.salary_head_id));
    }

    if (allowedHeadIds.size === 0) {
      return res.json({ success: true, data: [] });
    }

    const allowedArr = Array.from(allowedHeadIds);
    const placeholders = allowedArr.map((_, i) => `$${i + 1}`).join(',');
    const allowedHeads = await dbQuery(
      `SELECT id, code, name, transaction_type, irp5_code
       FROM salary_heads WHERE enabled = TRUE AND id IN (${placeholders})
       ORDER BY transaction_type, name`,
      allowedArr
    );

    let filtered = allowedHeads.rows;
    if (transaction_type) {
      filtered = filtered.filter(h => h.transaction_type === transaction_type);
    }
    res.json({ success: true, data: filtered });
  } catch (err) { next(err); }
});

router.get('/payslip-view/employee-lookup', authenticate, authorize('admin', 'payroll_admin', 'payroll_officer'), async (req, res, next) => {
  try {
    const { cycle_id, code } = req.query;
    if (!cycle_id || !code) return res.status(400).json({ success: false, message: 'cycle_id and code are required' });

    const cycleResult = await dbQuery('SELECT * FROM payroll_cycles WHERE id = $1', [cycle_id]);
    if (cycleResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Cycle not found' });
    const cycle = cycleResult.rows[0];

    const result = await dbQuery(
      `SELECT e.id, e.employee_code, e.first_name, e.surname
       FROM employees e
       WHERE e.status = 'ACTIVE'
       AND e.payroll_cycle_id = $1
       AND (e.employee_code = $2 OR CAST(e.id AS TEXT) = $2)
       LIMIT 1`,
      [cycle_id, code.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Employee not found in this payroll cycle' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/wages/employees', authenticate, async (req, res, next) => {
  try {
    const { cycle_id, period_id, search } = req.query;
    if (!cycle_id) return res.status(400).json({ success: false, message: 'cycle_id is required' });

    const cycle = (await dbQuery('SELECT * FROM payroll_cycles WHERE id = $1', [cycle_id])).rows[0];
    if (!cycle) return res.status(404).json({ success: false, message: 'Cycle not found' });

    let period = null;
    if (period_id) {
      period = (await dbQuery('SELECT * FROM payroll_periods WHERE id = $1 AND cycle_id = $2', [period_id, cycle_id])).rows[0];
    } else {
      period = (await dbQuery(
        `SELECT * FROM payroll_periods WHERE cycle_id = $1 AND status IN ('OPEN','TRIAL')
         ORDER BY period_number ASC LIMIT 1`, [cycle_id]
      )).rows[0];
    }

    let where = `WHERE e.status = 'ACTIVE' AND e.enabled = TRUE
       AND e.task_grade_id IS NULL AND jp.task_grade_id IS NULL AND jp.upper_limit_id IS NULL
       AND e.salary_based_on IN ('RATE_PER_HOUR', 'RATE_PER_DAY')
       AND e.payroll_cycle_id = $1`;
    const params = [cycle_id];
    let pi = 2;
    if (search) {
      where += ` AND (e.first_name ILIKE $${pi} OR e.surname ILIKE $${pi} OR e.employee_code ILIKE $${pi} OR CONCAT(e.first_name,' ',e.surname) ILIKE $${pi})`;
      params.push(`%${search}%`); pi++;
    }

    const result = await dbQuery(
      `SELECT e.id, e.employee_code, e.first_name, e.surname, e.id_number,
              e.annual_salary, e.salary_based_on, e.wage_rate,
              e.working_hours_per_month, e.working_days_per_month,
              p.title AS position_title
       FROM employees e
       LEFT JOIN positions p ON e.position_id = p.id
       LEFT JOIN job_profiles jp ON p.job_profile_id = jp.id
       ${where}
       ORDER BY e.surname, e.first_name`, params
    );

    res.json({ success: true, data: result.rows, period, cycle });
  } catch (err) { next(err); }
});

router.get('/wages/transactions', authenticate, async (req, res, next) => {
  try {
    const { period_id, cycle_id, employee_id, status } = req.query;
    if (!period_id || !cycle_id) return res.status(400).json({ success: false, message: 'period_id and cycle_id required' });

    let where = 'WHERE wt.period_id = $1 AND wt.cycle_id = $2';
    const params = [period_id, cycle_id];
    let pi = 3;
    if (employee_id) { where += ` AND wt.employee_id = $${pi}`; params.push(employee_id); pi++; }
    if (status) { where += ` AND wt.status = $${pi}`; params.push(status.toUpperCase()); pi++; }

    const result = await dbQuery(
      `SELECT wt.*, e.employee_code, e.first_name, e.surname,
              sh.code AS head_code, sh.name AS head_name, sh.transaction_type
       FROM wage_transactions wt
       JOIN employees e ON wt.employee_id = e.id
       JOIN salary_heads sh ON wt.salary_head_id = sh.id
       ${where}
       ORDER BY e.surname, e.first_name, sh.code`, params
    );

    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/wages/transactions', authenticate, async (req, res, next) => {
  try {
    const { employee_id, salary_head_id, period_id, cycle_id, hours, days, rate, amount, reference_no, notes } = req.body;
    if (!employee_id || !salary_head_id || !period_id || !cycle_id) {
      return res.status(400).json({ success: false, message: 'employee_id, salary_head_id, period_id, cycle_id required' });
    }
    const empCheck = await dbQuery(
      `SELECT e.salary_based_on, e.wage_rate, e.working_hours_per_month, e.working_days_per_month,
              e.task_grade_id, jp.task_grade_id AS jp_task_grade_id, jp.upper_limit_id
       FROM employees e
       LEFT JOIN positions p ON e.position_id = p.id
       LEFT JOIN job_profiles jp ON p.job_profile_id = jp.id
       WHERE e.id = $1`, [employee_id]
    );
    const emp = empCheck.rows[0];
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });
    if (emp.task_grade_id || emp.jp_task_grade_id || emp.upper_limit_id) {
      return res.status(400).json({ success: false, message: 'Wages can only be captured for Rate Based employees. This employee has a Task Grade or Upper Limit assignment.' });
    }
    const salaryBasedOn = emp?.salary_based_on || 'CAPTURED_VALUE';
    if (salaryBasedOn !== 'RATE_PER_HOUR' && salaryBasedOn !== 'RATE_PER_DAY') {
      return res.status(400).json({ success: false, message: 'Wages can only be captured for employees with salary based on Rate Per Hour or Rate Per Day.' });
    }
    const configuredRate = parseFloat(emp?.wage_rate) || 0;
    let effectiveRate = configuredRate > 0 ? configuredRate : (parseFloat(rate) || 0);
    const h = parseFloat(hours || 0);
    const d = parseFloat(days || 0);
    let finalAmount;
    if (salaryBasedOn === 'RATE_PER_HOUR' && h > 0 && effectiveRate > 0) {
      finalAmount = parseFloat((h * effectiveRate).toFixed(2));
    } else if (salaryBasedOn === 'RATE_PER_DAY' && d > 0 && effectiveRate > 0) {
      finalAmount = parseFloat((d * effectiveRate).toFixed(2));
    } else if (amount && parseFloat(amount) > 0) {
      finalAmount = parseFloat(amount);
    } else if (h > 0 && effectiveRate > 0) {
      finalAmount = parseFloat((h * effectiveRate).toFixed(2));
    } else if (d > 0 && effectiveRate > 0) {
      finalAmount = parseFloat((d * effectiveRate).toFixed(2));
    } else {
      finalAmount = parseFloat(amount) || 0;
    }
    const result = await dbQuery(
      `INSERT INTO wage_transactions (employee_id, salary_head_id, period_id, cycle_id, hours, days, rate, amount, reference_no, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [employee_id, salary_head_id, period_id, cycle_id, h, d, effectiveRate, finalAmount, reference_no || null, notes || null, req.user?.id || 1]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/wages/transactions/:id', authenticate, async (req, res, next) => {
  try {
    const { hours, days, rate, amount, reference_no, notes, salary_head_id } = req.body;
    const existing = (await dbQuery('SELECT * FROM wage_transactions WHERE id = $1', [req.params.id])).rows[0];
    if (!existing) return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (existing.status !== 'PENDING') return res.status(400).json({ success: false, message: 'Can only edit pending transactions' });

    const empRbCheck = await dbQuery(
      `SELECT e.task_grade_id, jp.task_grade_id AS jp_task_grade_id, jp.upper_limit_id
       FROM employees e
       LEFT JOIN positions p ON e.position_id = p.id
       LEFT JOIN job_profiles jp ON p.job_profile_id = jp.id
       WHERE e.id = $1`, [existing.employee_id]
    );
    const rbEmp = empRbCheck.rows[0];
    if (rbEmp && (rbEmp.task_grade_id || rbEmp.jp_task_grade_id || rbEmp.upper_limit_id)) {
      return res.status(400).json({ success: false, message: 'Wages can only be edited for Rate Based employees.' });
    }
    const rbSboCheck = await dbQuery('SELECT salary_based_on FROM employees WHERE id = $1', [existing.employee_id]);
    const rbSbo = rbSboCheck.rows[0]?.salary_based_on || 'CAPTURED_VALUE';
    if (rbSbo !== 'RATE_PER_HOUR' && rbSbo !== 'RATE_PER_DAY') {
      return res.status(400).json({ success: false, message: 'Wages can only be edited for employees with salary based on Rate Per Hour or Rate Per Day.' });
    }

    const h = parseFloat(hours !== undefined ? hours : existing.hours) || 0;
    const d = parseFloat(days !== undefined ? days : existing.days) || 0;
    const r = parseFloat(rate !== undefined ? rate : existing.rate) || 0;
    let finalAmount;
    if (amount !== undefined) {
      finalAmount = parseFloat(amount);
    } else if (h > 0 && r > 0) {
      finalAmount = parseFloat((h * r).toFixed(2));
    } else if (d > 0 && r > 0) {
      finalAmount = parseFloat((d * r).toFixed(2));
    } else {
      finalAmount = parseFloat(existing.amount);
    }
    const result = await dbQuery(
      `UPDATE wage_transactions SET salary_head_id=COALESCE($1,salary_head_id), hours=COALESCE($2,hours), days=COALESCE($3,days),
       rate=COALESCE($4,rate), amount=$5, reference_no=COALESCE($6,reference_no), notes=COALESCE($7,notes), updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [salary_head_id || null, hours, days, rate, finalAmount, reference_no, notes, req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/wages/transactions/:id', authenticate, async (req, res, next) => {
  try {
    const existing = (await dbQuery('SELECT * FROM wage_transactions WHERE id = $1', [req.params.id])).rows[0];
    if (!existing) return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (existing.status !== 'PENDING') return res.status(400).json({ success: false, message: 'Can only delete pending transactions' });
    await dbQuery('DELETE FROM wage_transactions WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
});

router.post('/wages/transactions/approve', authenticate, authorize('admin', 'payroll_admin'), async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, message: 'ids array required' });
    const result = await dbQuery(
      `UPDATE wage_transactions SET status='APPROVED', approved_by=$1, approved_at=NOW(), updated_at=NOW()
       WHERE id = ANY($2) AND status='PENDING' RETURNING id`,
      [req.user?.id || 1, ids]
    );
    res.json({ success: true, data: { count: result.rowCount }, message: `${result.rowCount} transactions approved` });
  } catch (err) { next(err); }
});

router.post('/wages/transactions/reject', authenticate, authorize('admin', 'payroll_admin'), async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, message: 'ids array required' });
    const result = await dbQuery(
      `UPDATE wage_transactions SET status='REJECTED', updated_at=NOW()
       WHERE id = ANY($1) AND status='PENDING' RETURNING id`, [ids]
    );
    res.json({ success: true, data: { count: result.rowCount }, message: `${result.rowCount} transactions rejected` });
  } catch (err) { next(err); }
});

router.get('/wages/salary-heads', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT id, code, name, transaction_type FROM salary_heads
       WHERE enabled = TRUE AND (start_date IS NULL OR start_date <= CURRENT_DATE)
       AND (end_date IS NULL OR end_date >= CURRENT_DATE)
       ORDER BY transaction_type, code`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/wages/employee-salary-transactions/:employeeId', authenticate, async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    if (!employeeId) return res.status(400).json({ success: false, message: 'employeeId is required' });
    let result = await dbQuery(
      `SELECT sh.id, sh.code, sh.name, sh.transaction_type
       FROM employee_salary_transactions est
       JOIN salary_heads sh ON est.salary_head_id = sh.id
       WHERE est.employee_id = $1
         AND est.enabled = TRUE
         AND (est.start_date IS NULL OR est.start_date <= CURRENT_DATE)
         AND (est.end_date IS NULL OR est.end_date >= CURRENT_DATE)
         AND sh.enabled = TRUE
         AND sh.irp5_code = '3601'
       ORDER BY sh.code`, [employeeId]
    );
    if (result.rows.length === 0) {
      result = await dbQuery(
        `SELECT sh.id, sh.code, sh.name, sh.transaction_type
         FROM employee_salary_transactions est
         JOIN salary_heads sh ON est.salary_head_id = sh.id
         WHERE est.employee_id = $1
           AND est.enabled = TRUE
           AND (est.start_date IS NULL OR est.start_date <= CURRENT_DATE)
           AND (est.end_date IS NULL OR est.end_date >= CURRENT_DATE)
           AND sh.enabled = TRUE
           AND sh.transaction_type = 'EARNING'
         ORDER BY sh.code`, [employeeId]
      );
    }
    if (result.rows.length === 0) {
      result = await dbQuery(
        `SELECT id, code, name, transaction_type FROM salary_heads
         WHERE enabled = TRUE AND irp5_code = '3601'
           AND (start_date IS NULL OR start_date <= CURRENT_DATE)
           AND (end_date IS NULL OR end_date >= CURRENT_DATE)
         ORDER BY code`
      );
    }
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/salary-increases/apply-all', authenticate, async (req, res, next) => {
  try {
    const approved = await dbQuery(`SELECT id FROM salary_increases WHERE status = 'APPROVED'`);
    let applied = 0, errors = 0;
    for (const inc of approved.rows) {
      try {
        const i = await dbQuery(`SELECT * FROM salary_increases WHERE id = $1`, [inc.id]);
        const increase = i.rows[0];
        await dbQuery(`UPDATE employees SET annual_salary = $1 WHERE id = $2`, [increase.new_salary, increase.employee_id]);
        await dbQuery(`UPDATE salary_increases SET status = 'APPLIED' WHERE id = $1`, [inc.id]);
        applied++;
      } catch (e) { errors++; }
    }
    res.json({ success: true, message: `Applied ${applied} increases (${errors} errors)`, applied, errors });
  } catch (err) { next(err); }
});

module.exports = router;
