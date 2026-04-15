const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { query: dbQuery } = require('../config/database');
const { generatePayslip, generateEmploymentLetter, generateBatchPayslips } = require('../services/payslip.service');
const { generateIRP5, generateEMP201, generateEMP501, generateEasyFileCSV,
  generateIRP5TextFile, generateEMP201Electronic, generateEMP501Electronic,
  generateAllIRP5sPDF, generateAmendedIRP5, generateROE, generateSDL1
} = require('../services/statutory-reports.service');
const { generateACBFile } = require('../services/eft.service');
const { exportToExcel, exportToCSV } = require('../services/report-export.service');

router.get('/payslip/:runId/:employeeId', authenticate, async (req, res, next) => {
  try {
    const pdf = await generatePayslip(parseInt(req.params.runId), parseInt(req.params.employeeId));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payslip_${req.params.runId}_${req.params.employeeId}.pdf`);
    res.send(pdf);
  } catch (err) { next(err); }
});

router.get('/irp5/:taxYear/:employeeId', authenticate, async (req, res, next) => {
  try {
    const pdf = await generateIRP5(parseInt(req.params.taxYear), parseInt(req.params.employeeId));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=IRP5_${req.params.taxYear}_${req.params.employeeId}.pdf`);
    res.send(pdf);
  } catch (err) { next(err); }
});

router.get('/emp201/:taxYear/:taxPeriod', authenticate, async (req, res, next) => {
  try {
    const pdf = await generateEMP201(parseInt(req.params.taxYear), parseInt(req.params.taxPeriod));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=EMP201_${req.params.taxYear}_P${req.params.taxPeriod}.pdf`);
    res.send(pdf);
  } catch (err) { next(err); }
});

router.get('/emp501/:taxYear', authenticate, async (req, res, next) => {
  try {
    const pdf = await generateEMP501(parseInt(req.params.taxYear));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=EMP501_${req.params.taxYear}.pdf`);
    res.send(pdf);
  } catch (err) { next(err); }
});

router.get('/easyfile/:taxYear', authenticate, async (req, res, next) => {
  try {
    const csv = await generateEasyFileCSV(parseInt(req.params.taxYear));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=easyfile_${req.params.taxYear}.csv`);
    res.send(csv);
  } catch (err) { next(err); }
});

router.get('/eft/:runId', authenticate, async (req, res, next) => {
  try {
    const acb = await generateACBFile(parseInt(req.params.runId));
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=EFT_Run${req.params.runId}.acb`);
    res.send(acb);
  } catch (err) { next(err); }
});

router.get('/employment-letter/:employeeId', authenticate, async (req, res, next) => {
  try {
    const pdf = await generateEmploymentLetter(parseInt(req.params.employeeId));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=employment_letter_${req.params.employeeId}.pdf`);
    res.send(pdf);
  } catch (err) { next(err); }
});

router.get('/export/employees', authenticate, async (req, res, next) => {
  try {
    const { format = 'excel' } = req.query;
    const data = await dbQuery(
      `SELECT e.employee_code, e.title, e.first_name, e.surname, e.id_number, e.gender, e.date_of_birth,
              e.email_address, e.cell_number, e.annual_salary, e.status, e.joining_date, e.nationality,
              p.title AS position_title, tg.grade_code
       FROM employees e
       LEFT JOIN positions p ON e.position_id = p.id
       LEFT JOIN task_grades tg ON e.task_grade_id = tg.id
       WHERE e.enabled = TRUE ORDER BY e.surname`
    );
    const columns = [
      { key: 'employee_code', header: 'Employee Code', width: 15 },
      { key: 'title', header: 'Title', width: 8 },
      { key: 'first_name', header: 'First Name', width: 15 },
      { key: 'surname', header: 'Surname', width: 15 },
      { key: 'id_number', header: 'ID Number', width: 16 },
      { key: 'gender', header: 'Gender', width: 10 },
      { key: 'position_title', header: 'Position', width: 25 },
      { key: 'department_name', header: 'Department', width: 20 },
      { key: 'grade_code', header: 'TASK Grade', width: 12 },
      { key: 'annual_salary', header: 'Annual Salary', width: 15 },
      { key: 'status', header: 'Status', width: 12 },
      { key: 'email_address', header: 'Email', width: 30 },
      { key: 'cell_number', header: 'Cell', width: 15 },
      { key: 'joining_date', header: 'Joining Date', width: 14 },
    ];
    if (format === 'csv') {
      const csv = exportToCSV(columns, data.rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=employees.csv');
      return res.send(csv);
    }
    const buffer = await exportToExcel(columns, data.rows, 'Employees');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=employees.xlsx');
    res.send(Buffer.from(buffer));
  } catch (err) { next(err); }
});

router.get('/export/payroll/:runId', authenticate, async (req, res, next) => {
  try {
    const { format = 'excel' } = req.query;
    const data = await dbQuery(
      `SELECT e.employee_code, e.first_name, e.surname, sh.code AS head_code, sh.name AS head_name,
              pr.transaction_type, pr.amount, pr.irp5_code
       FROM payroll_results pr
       JOIN employees e ON pr.employee_id = e.id
       JOIN salary_heads sh ON pr.salary_head_id = sh.id
       WHERE pr.run_id = $1 ORDER BY e.surname, pr.transaction_type, sh.priority`, [req.params.runId]
    );
    const columns = [
      { key: 'employee_code', header: 'Employee Code', width: 15 },
      { key: 'first_name', header: 'First Name', width: 15 },
      { key: 'surname', header: 'Surname', width: 15 },
      { key: 'head_code', header: 'Head Code', width: 12 },
      { key: 'head_name', header: 'Description', width: 25 },
      { key: 'transaction_type', header: 'Type', width: 15 },
      { key: 'amount', header: 'Amount', width: 15 },
      { key: 'irp5_code', header: 'IRP5 Code', width: 12 },
    ];
    if (format === 'csv') {
      const csv = exportToCSV(columns, data.rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=payroll_run_${req.params.runId}.csv`);
      return res.send(csv);
    }
    const buffer = await exportToExcel(columns, data.rows, 'Payroll Results');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=payroll_run_${req.params.runId}.xlsx`);
    res.send(Buffer.from(buffer));
  } catch (err) { next(err); }
});

router.get('/ee/workforce-profile', authenticate, async (req, res, next) => {
  try {
    const data = await dbQuery(
      `SELECT
         CASE
           WHEN tg.grade_code IN ('T15','T16','T17','T18','T19') THEN 'Top Management'
           WHEN tg.grade_code IN ('T12','T13','T14') THEN 'Senior Management'
           WHEN tg.grade_code IN ('T09','T10','T11') THEN 'Professionally Qualified'
           WHEN tg.grade_code IN ('T06','T07','T08') THEN 'Skilled Technical'
           WHEN tg.grade_code IN ('T04','T05') THEN 'Semi-Skilled'
           WHEN tg.grade_code IN ('T01','T02','T03') THEN 'Unskilled'
           ELSE 'Ungraded'
         END AS occupational_level,
         e.race, e.gender, e.disability_status,
         COUNT(*) AS count
       FROM employees e
       LEFT JOIN task_grades tg ON e.task_grade_id = tg.id
       WHERE e.status = 'ACTIVE' AND e.enabled = TRUE
       GROUP BY occupational_level, e.race, e.gender, e.disability_status
       ORDER BY occupational_level, e.race, e.gender`
    );
    res.json({ success: true, data: data.rows });
  } catch (err) { next(err); }
});

router.get('/ee/summary', authenticate, async (req, res, next) => {
  try {
    const data = await dbQuery(
      `SELECT e.race, e.gender, COUNT(*) AS count,
              ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM employees WHERE status = 'ACTIVE'), 0), 1) AS percentage
       FROM employees e
       WHERE e.status = 'ACTIVE' AND e.enabled = TRUE
       GROUP BY e.race, e.gender
       ORDER BY e.race, e.gender`
    );
    const disability = await dbQuery(
      `SELECT disability_status, COUNT(*) AS count FROM employees WHERE status = 'ACTIVE' AND enabled = TRUE GROUP BY disability_status`
    );
    res.json({ success: true, data: { demographics: data.rows, disability: disability.rows } });
  } catch (err) { next(err); }
});

router.get('/statutory-summary/:taxYear', authenticate, async (req, res, next) => {
  try {
    const taxYear = parseInt(req.params.taxYear);

    const periodData = await dbQuery(
      `SELECT pr.tax_period,
              COALESCE(SUM(CASE WHEN sh.code = 'PAYE' OR sh.irp5_code = '4102' THEN pr.amount ELSE 0 END), 0) AS paye,
              COALESCE(SUM(CASE WHEN sh.code IN ('UIF_EE','UIF_ER') OR sh.affects_uif = TRUE THEN pr.amount ELSE 0 END), 0) AS uif,
              COALESCE(SUM(CASE WHEN sh.code = 'SDL' OR sh.affects_sdl = TRUE THEN pr.amount ELSE 0 END), 0) AS sdl,
              COUNT(DISTINCT pr.employee_id) AS employee_count,
              COUNT(DISTINCT pr.run_id) AS run_count
       FROM payroll_results pr
       JOIN salary_heads sh ON pr.salary_head_id = sh.id
       WHERE pr.tax_year = $1
       GROUP BY pr.tax_period
       ORDER BY pr.tax_period`,
      [taxYear]
    );

    const totals = periodData.rows.reduce((acc, r) => {
      acc.paye += parseFloat(r.paye);
      acc.uif += parseFloat(r.uif);
      acc.sdl += parseFloat(r.sdl);
      acc.employee_count = Math.max(acc.employee_count, parseInt(r.employee_count));
      return acc;
    }, { paye: 0, uif: 0, sdl: 0, employee_count: 0 });

    res.json({
      success: true,
      data: {
        tax_year: taxYear,
        totals,
        periods: periodData.rows,
      }
    });
  } catch (err) { next(err); }
});

router.get('/uif-ui19/:taxYear/:taxPeriod', authenticate, async (req, res, next) => {
  try {
    const taxYear = parseInt(req.params.taxYear);
    const taxPeriod = parseInt(req.params.taxPeriod);

    const results = await dbQuery(
      `SELECT e.employee_code, e.id_number, e.first_name, e.surname, e.date_of_birth, e.gender,
              e.joining_date, e.end_date, e.status,
              COALESCE(SUM(CASE WHEN sh.transaction_type = 'EARNING' THEN pr.amount ELSE 0 END), 0) AS gross_remuneration,
              COALESCE(SUM(CASE WHEN sh.code = 'UIF_EE' THEN pr.amount ELSE 0 END), 0) AS uif_employee,
              COALESCE(SUM(CASE WHEN sh.code = 'UIF_ER' THEN pr.amount ELSE 0 END), 0) AS uif_employer
       FROM payroll_results pr
       JOIN employees e ON pr.employee_id = e.id
       JOIN salary_heads sh ON pr.salary_head_id = sh.id
       WHERE pr.tax_year = $1 AND pr.tax_period = $2
       GROUP BY e.id, e.employee_code, e.id_number, e.first_name, e.surname, e.date_of_birth,
                e.gender, e.joining_date, e.end_date, e.status
       ORDER BY e.surname, e.first_name`,
      [taxYear, taxPeriod]
    );

    const totals = results.rows.reduce((acc, r) => {
      acc.gross += parseFloat(r.gross_remuneration);
      acc.uif_ee += parseFloat(r.uif_employee);
      acc.uif_er += parseFloat(r.uif_employer);
      return acc;
    }, { gross: 0, uif_ee: 0, uif_er: 0 });

    const uifSettings = await dbQuery('SELECT * FROM uif_settings WHERE tax_year = $1', [taxYear]);

    const { format } = req.query;
    if (format === 'pdf') {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers = [];
      doc.on('data', b => buffers.push(b));

      doc.fontSize(14).font('Helvetica-Bold').text('UI-19 - UIF MONTHLY DECLARATION', { align: 'center' });
      doc.fontSize(8).font('Helvetica').text(`Tax Period: ${taxPeriod} | Tax Year: ${taxYear}`, { align: 'center' });
      doc.moveDown(1);

      doc.fontSize(9).font('Helvetica-Bold').text('EMPLOYER DETAILS');
      doc.fontSize(8).font('Helvetica');
      doc.text('Name: Platinum Municipality');
      doc.text('UIF Reference: U000123456');
      doc.text(`Number of Employees: ${results.rows.length}`);
      doc.text(`UIF Ceiling: R ${uifSettings.rows[0]?.ceiling || '17 712.00'} per month`);
      doc.moveDown(1);

      let y = doc.y;
      doc.fontSize(7).font('Helvetica-Bold');
      doc.text('Code', 40, y); doc.text('Name', 90, y); doc.text('ID Number', 220, y);
      doc.text('Gross', 330, y, { width: 70, align: 'right' });
      doc.text('UIF (EE)', 400, y, { width: 70, align: 'right' });
      doc.text('UIF (ER)', 470, y, { width: 70, align: 'right' });
      y += 12;
      doc.moveTo(40, y).lineTo(555, y).stroke();
      y += 4;

      doc.fontSize(6).font('Helvetica');
      results.rows.forEach(r => {
        if (y > 750) { doc.addPage(); y = 40; }
        doc.text(r.employee_code, 40, y); doc.text(`${r.surname}, ${r.first_name}`, 90, y);
        doc.text(r.id_number || '', 220, y);
        doc.text(fmtNum(r.gross_remuneration), 330, y, { width: 70, align: 'right' });
        doc.text(fmtNum(r.uif_employee), 400, y, { width: 70, align: 'right' });
        doc.text(fmtNum(r.uif_employer), 470, y, { width: 70, align: 'right' });
        y += 10;
      });

      y += 4;
      doc.moveTo(40, y).lineTo(555, y).lineWidth(1).stroke();
      y += 6;
      doc.fontSize(8).font('Helvetica-Bold');
      doc.text('TOTALS', 90, y);
      doc.text(fmtNum(totals.gross), 330, y, { width: 70, align: 'right' });
      doc.text(fmtNum(totals.uif_ee), 400, y, { width: 70, align: 'right' });
      doc.text(fmtNum(totals.uif_er), 470, y, { width: 70, align: 'right' });

      y += 16;
      doc.fontSize(8).font('Helvetica-Bold');
      doc.text(`TOTAL UIF PAYABLE: R ${(totals.uif_ee + totals.uif_er).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, 40, y);

      doc.end();
      const pdf = await new Promise((resolve) => { doc.on('end', () => resolve(Buffer.concat(buffers))); });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=UI19_${taxYear}_P${taxPeriod}.pdf`);
      return res.send(pdf);
    }

    res.json({
      success: true,
      data: {
        tax_year: taxYear,
        tax_period: taxPeriod,
        employee_count: results.rows.length,
        uif_settings: uifSettings.rows[0] || null,
        totals: {
          gross_remuneration: totals.gross,
          uif_employee: totals.uif_ee,
          uif_employer: totals.uif_er,
          total_uif: totals.uif_ee + totals.uif_er,
        },
        employees: results.rows,
      }
    });
  } catch (err) { next(err); }
});

router.get('/mfma-s66', authenticate, async (req, res, next) => {
  try {
    const { financial_year } = req.query;

    const establishment = await dbQuery(
      `SELECT p.department_id,
              COUNT(p.id) AS approved_posts,
              COUNT(CASE WHEN p.funded = TRUE THEN 1 END) AS funded_posts,
              COUNT(CASE WHEN p.status = 'FILLED' THEN 1 END) AS filled_posts,
              COUNT(CASE WHEN p.status = 'VACANT' THEN 1 END) AS vacant_posts,
              COALESCE(SUM(CASE WHEN p.funded = TRUE THEN tgn.min_salary ELSE 0 END), 0) AS budgeted_cost
       FROM positions p
       LEFT JOIN task_grades tg ON p.task_grade_id = tg.id
       LEFT JOIN task_grade_notches tgn ON tg.id = tgn.task_grade_id AND tgn.notch_number = 1
       WHERE p.enabled = TRUE AND p.department_id IS NOT NULL
       GROUP BY p.department_id`
    );

    const actuals = await dbQuery(
      `SELECT p.department_id,
              COUNT(e.id) AS actual_headcount,
              COALESCE(SUM(e.annual_salary), 0) AS actual_cost
       FROM positions p
       LEFT JOIN employees e ON e.position_id = p.id AND e.status = 'ACTIVE' AND e.enabled = TRUE
       WHERE p.department_id IS NOT NULL
       GROUP BY p.department_id`
    );

    const actualsMap = {};
    actuals.rows.forEach(a => { actualsMap[a.department_id] = a; });

    const { getDepartments } = require('./department.routes');
    const depts = await getDepartments();
    const deptMap = new Map(depts.map(d => [d.id, d.name]));

    const report = establishment.rows.map(est => {
      const act = actualsMap[est.department_id] || { actual_headcount: 0, actual_cost: 0 };
      const approvedPosts = parseInt(est.approved_posts);
      const filledPosts = parseInt(est.filled_posts);
      const vacantPosts = parseInt(est.vacant_posts);
      const budgetedCost = parseFloat(est.budgeted_cost);
      const actualHeadcount = parseInt(act.actual_headcount);
      const actualCost = parseFloat(act.actual_cost);

      return {
        department: deptMap.get(Number(est.department_id)) || null,
        department_id: est.department_id,
        approved_posts: approvedPosts,
        funded_posts: parseInt(est.funded_posts),
        filled_posts: filledPosts,
        vacant_posts: vacantPosts,
        actual_headcount: actualHeadcount,
        vacancy_rate: approvedPosts > 0 ? parseFloat(((vacantPosts / approvedPosts) * 100).toFixed(1)) : 0,
        budgeted_cost: budgetedCost,
        actual_cost: actualCost,
        variance: parseFloat((budgetedCost - actualCost).toFixed(2)),
        variance_percentage: budgetedCost > 0 ? parseFloat((((budgetedCost - actualCost) / budgetedCost) * 100).toFixed(1)) : 0,
      };
    });

    const summary = report.reduce((acc, r) => {
      acc.total_approved += r.approved_posts;
      acc.total_funded += r.funded_posts;
      acc.total_filled += r.filled_posts;
      acc.total_vacant += r.vacant_posts;
      acc.total_actual += r.actual_headcount;
      acc.total_budgeted += r.budgeted_cost;
      acc.total_actual_cost += r.actual_cost;
      return acc;
    }, { total_approved: 0, total_funded: 0, total_filled: 0, total_vacant: 0, total_actual: 0, total_budgeted: 0, total_actual_cost: 0 });

    summary.total_variance = parseFloat((summary.total_budgeted - summary.total_actual_cost).toFixed(2));
    summary.overall_vacancy_rate = summary.total_approved > 0
      ? parseFloat(((summary.total_vacant / summary.total_approved) * 100).toFixed(1)) : 0;

    res.json({
      success: true,
      data: {
        report_title: 'MFMA Section 66 - Staff Establishment Report',
        financial_year: financial_year || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
        generated_at: new Date().toISOString(),
        summary,
        departments: report,
      }
    });
  } catch (err) { next(err); }
});

router.post('/retro-calculate', authenticate, async (req, res, next) => {
  try {
    const { employee_id, new_salary, new_amount, old_amount, effective_date, salary_head_id } = req.body;
    const emp = await dbQuery('SELECT * FROM employees WHERE id = $1', [employee_id]);
    if (!emp.rows.length) return res.status(404).json({ success: false, error: { message: 'Employee not found' } });

    const oldSalary = old_amount != null ? parseFloat(old_amount) : parseFloat(emp.rows[0].annual_salary);
    const newSalaryAmt = new_amount != null ? parseFloat(new_amount) : parseFloat(new_salary);
    const monthlyDiff = (newSalaryAmt - oldSalary) / 12;

    const affectedPeriods = await dbQuery(
      `SELECT DISTINCT pp.id, pp.period_number, pp.tax_year, pp.tax_period
       FROM payroll_periods pp
       JOIN payroll_runs pr ON pr.period_id = pp.id
       WHERE pp.end_date >= $1 AND pr.status IN ('COMPLETED','LOCKED','APPROVED')
       ORDER BY pp.period_number`, [effective_date]
    );

    const adjustments = affectedPeriods.rows.map(p => ({
      period_id: p.id,
      period_number: p.period_number,
      tax_year: p.tax_year,
      adjustment_amount: monthlyDiff,
    }));

    const totalRetro = monthlyDiff * adjustments.length;

    res.json({
      success: true,
      data: {
        employee_id,
        old_annual_salary: oldSalary,
        new_annual_salary: newSalaryAmt,
        monthly_difference: monthlyDiff,
        affected_periods: adjustments.length,
        total_retroactive_amount: totalRetro,
        adjustments,
      },
      message: `Retroactive calculation: R ${totalRetro.toFixed(2)} for ${adjustments.length} periods`
    });
  } catch (err) { next(err); }
});

router.post('/gross-up', authenticate, async (req, res, next) => {
  try {
    const { desired_nett_monthly, target_nett, tax_year } = req.body;
    const nett = parseFloat(target_nett || desired_nett_monthly);
    const yr = parseInt(tax_year || 2026);
    const brackets = await dbQuery('SELECT * FROM tax_brackets WHERE tax_year = $1 ORDER BY bracket_number', [yr]);

    let gross = nett;
    for (let i = 0; i < 20; i++) {
      const annual = gross * 12;
      let tax = 0;
      for (const b of brackets.rows) {
        const min = parseFloat(b.lower_limit);
        const max = parseFloat(b.upper_limit) || Infinity;
        const rate = parseFloat(b.rate) / 100;
        const base = parseFloat(b.base_amount) || 0;
        if (annual > min) {
          const taxable = Math.min(annual, max) - min;
          tax = base + (taxable * rate);
          if (annual <= max) break;
        }
      }
      const rebate = 17235;
      tax = Math.max(0, tax - rebate);
      const monthlyTax = tax / 12;
      const uif = Math.min(gross * 0.01, 177.12);
      const calculated_nett = gross - monthlyTax - uif;
      const diff = nett - calculated_nett;
      if (Math.abs(diff) < 0.01) break;
      gross += diff * 0.7;
    }

    res.json({
      success: true,
      data: {
        desired_nett_monthly: nett,
        calculated_gross_monthly: Math.round(gross * 100) / 100,
        calculated_gross_annual: Math.round(gross * 12 * 100) / 100,
        estimated_paye_monthly: Math.round((gross - nett) * 100) / 100,
      }
    });
  } catch (err) { next(err); }
});

function fmtNum(val) {
  return parseFloat(val || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

router.get('/ee/targets', authenticate, async (req, res, next) => {
  try {
    const { plan_id } = req.query;
    let where = 'WHERE 1=1'; const params = []; let pi = 1;
    if (plan_id) { where += ` AND et.plan_id = $${pi}`; params.push(parseInt(plan_id)); pi++; }
    const result = await dbQuery(
      `SELECT et.*, ep.plan_name FROM ee_targets et LEFT JOIN ee_plans ep ON et.plan_id = ep.id ${where} ORDER BY et.occupational_level, et.race, et.gender`, params
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/ee/plans', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM ee_plans ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/ee/plans', authenticate, async (req, res, next) => {
  try {
    const { plan_name, start_date, end_date } = req.body;
    const result = await dbQuery(
      `INSERT INTO ee_plans (plan_name, start_date, end_date, created_by) VALUES ($1,$2,$3,$4) RETURNING *`,
      [plan_name, start_date, end_date, req.user?.id || 1]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.post('/ee/targets', authenticate, async (req, res, next) => {
  try {
    const { plan_id, occupational_level, race, gender, target_count, current_count } = req.body;
    const result = await dbQuery(
      `INSERT INTO ee_targets (plan_id, occupational_level, race, gender, target_count, current_count)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [plan_id, occupational_level, race, gender, target_count || 0, current_count || 0]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/ee/targets/:id', authenticate, async (req, res, next) => {
  try {
    const { target_count, current_count } = req.body;
    const result = await dbQuery(
      `UPDATE ee_targets SET target_count=$1, current_count=$2 WHERE id=$3 RETURNING *`,
      [target_count, current_count, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Target not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/ee/targets/vs-actual', authenticate, async (req, res, next) => {
  try {
    const { plan_id } = req.query;
    if (!plan_id) return res.status(400).json({ success: false, error: { message: 'plan_id required' } });
    const targets = await dbQuery(
      `SELECT et.*, ep.plan_name FROM ee_targets et JOIN ee_plans ep ON et.plan_id = ep.id WHERE et.plan_id = $1`, [plan_id]
    );
    const actuals = await dbQuery(
      `SELECT
         CASE
           WHEN tg.grade_code IN ('T15','T16','T17','T18','T19') THEN 'Top Management'
           WHEN tg.grade_code IN ('T12','T13','T14') THEN 'Senior Management'
           WHEN tg.grade_code IN ('T09','T10','T11') THEN 'Professionally Qualified'
           WHEN tg.grade_code IN ('T06','T07','T08') THEN 'Skilled Technical'
           WHEN tg.grade_code IN ('T04','T05') THEN 'Semi-Skilled'
           WHEN tg.grade_code IN ('T01','T02','T03') THEN 'Unskilled'
           ELSE 'Ungraded'
         END AS occupational_level,
         e.race, e.gender, COUNT(*) AS actual_count
       FROM employees e LEFT JOIN task_grades tg ON e.task_grade_id = tg.id
       WHERE e.status = 'ACTIVE' AND e.enabled = TRUE
       GROUP BY occupational_level, e.race, e.gender`
    );
    res.json({ success: true, data: { targets: targets.rows, actuals: actuals.rows } });
  } catch (err) { next(err); }
});

router.get('/eea2/:year', authenticate, async (req, res, next) => {
  try {
    const year = parseInt(req.params.year);
    const data = await dbQuery(
      `SELECT
         COALESCE(ol.name, 'Ungraded') AS occupational_level,
         COALESCE(ol.level_order, 99) AS level_order,
         e.race, e.gender,
         CASE WHEN e.disability_status IS NOT NULL AND e.disability_status != 'None' AND e.disability_status != '' THEN TRUE ELSE FALSE END AS disabled,
         COUNT(*) AS count
       FROM employees e
       LEFT JOIN positions p ON e.position_id = p.id
       LEFT JOIN const_ee_occupational_levels ol ON p.occupational_level_id = ol.id
       LEFT JOIN task_grades tg ON e.task_grade_id = tg.id
       WHERE e.status = 'ACTIVE' AND e.enabled = TRUE
         AND EXTRACT(YEAR FROM e.joining_date) <= $1
       GROUP BY ol.name, ol.level_order, e.race, e.gender, disabled
       ORDER BY COALESCE(ol.level_order, 99), e.race, e.gender`,
      [year]
    );

    const levels = ['Top Management', 'Senior Management', 'Professionally Qualified', 'Skilled Technical', 'Semi-Skilled', 'Unskilled', 'Non-Permanent', 'Ungraded'];
    const races = ['African', 'Coloured', 'Indian', 'White', 'Foreign'];
    const genders = ['Male', 'Female'];

    const matrix = {};
    for (const level of levels) {
      matrix[level] = {};
      for (const race of races) {
        for (const gender of genders) {
          matrix[level][`${race}_${gender}`] = 0;
          matrix[level][`${race}_${gender}_disabled`] = 0;
        }
      }
      matrix[level].total = 0;
    }

    for (const row of data.rows) {
      const level = levels.includes(row.occupational_level) ? row.occupational_level : 'Ungraded';
      const key = `${row.race || 'African'}_${row.gender || 'Male'}`;
      const cnt = parseInt(row.count);
      if (matrix[level][key] !== undefined) {
        matrix[level][key] += cnt;
        if (row.disabled) matrix[level][`${key}_disabled`] += cnt;
      }
      matrix[level].total += cnt;
    }

    res.json({ success: true, data: { year, report_type: 'EEA2', title: 'Workforce Profile', matrix } });
  } catch (err) { next(err); }
});

router.get('/eea4/:year', authenticate, async (req, res, next) => {
  try {
    const year = parseInt(req.params.year);
    const data = await dbQuery(
      `SELECT
         COALESCE(ol.name, 'Ungraded') AS occupational_level,
         COALESCE(ol.level_order, 99) AS level_order,
         e.race, e.gender,
         COUNT(*) AS headcount,
         ROUND(AVG(e.annual_salary), 2) AS avg_salary,
         MIN(e.annual_salary) AS min_salary,
         MAX(e.annual_salary) AS max_salary,
         ROUND(STDDEV(e.annual_salary), 2) AS stddev_salary
       FROM employees e
       LEFT JOIN positions p ON e.position_id = p.id
       LEFT JOIN const_ee_occupational_levels ol ON p.occupational_level_id = ol.id
       WHERE e.status = 'ACTIVE' AND e.enabled = TRUE
         AND EXTRACT(YEAR FROM e.joining_date) <= $1
       GROUP BY ol.name, ol.level_order, e.race, e.gender
       ORDER BY COALESCE(ol.level_order, 99), e.race, e.gender`,
      [year]
    );
    res.json({ success: true, data: { year, report_type: 'EEA4', title: 'Income Differentials', rows: data.rows } });
  } catch (err) { next(err); }
});

router.get('/ee-annual/:year', authenticate, async (req, res, next) => {
  try {
    const year = parseInt(req.params.year);

    const workforce = await dbQuery(
      `SELECT e.race, e.gender,
              CASE WHEN e.disability_status IS NOT NULL AND e.disability_status != 'None' AND e.disability_status != '' THEN TRUE ELSE FALSE END AS disabled,
              COUNT(*) AS count
       FROM employees e
       WHERE e.status = 'ACTIVE' AND e.enabled = TRUE AND EXTRACT(YEAR FROM e.joining_date) <= $1
       GROUP BY e.race, e.gender, disabled`,
      [year]
    );

    const recruitment = await dbQuery(
      `SELECT e.race, e.gender, COUNT(*) AS count
       FROM employees e
       WHERE e.status = 'ACTIVE' AND e.enabled = TRUE AND EXTRACT(YEAR FROM e.joining_date) = $1
       GROUP BY e.race, e.gender`,
      [year]
    );

    const terminations = await dbQuery(
      `SELECT e.race, e.gender, COUNT(*) AS count
       FROM employees e
       LEFT JOIN employee_terminations et ON et.employee_id = e.id
       WHERE EXTRACT(YEAR FROM et.effective_date) = $1
       GROUP BY e.race, e.gender`,
      [year]
    );

    const promotions = await dbQuery(
      `SELECT e.race, e.gender, COUNT(*) AS count
       FROM employees e
       JOIN employee_history eh ON eh.employee_id = e.id
       WHERE eh.field_name = 'position_id' AND EXTRACT(YEAR FROM eh.changed_at) = $1
       GROUP BY e.race, e.gender`,
      [year]
    );

    res.json({
      success: true,
      data: {
        year,
        report_type: 'EE_ANNUAL',
        title: 'Annual Employment Equity Report',
        workforce_profile: workforce.rows,
        recruitment: recruitment.rows,
        terminations: terminations.rows,
        promotions: promotions.rows
      }
    });
  } catch (err) { next(err); }
});

router.get('/wsp/:year', authenticate, async (req, res, next) => {
  try {
    const year = parseInt(req.params.year);

    const planned = await dbQuery(
      `SELECT tc.category, tc.nqf_level, tc.seta, tc.title AS course_title,
              e.race, e.gender,
              CASE WHEN e.disability_status IS NOT NULL AND e.disability_status != 'None' AND e.disability_status != '' THEN TRUE ELSE FALSE END AS disabled,
              COUNT(DISTINCT tr.employee_id) AS beneficiaries,
              COUNT(tr.id) AS interventions,
              COALESCE(SUM(tc.cost), 0) AS planned_cost,
              COALESCE(SUM(tr.cost_actual), 0) AS actual_cost
       FROM training_records tr
       JOIN training_courses tc ON tr.course_id = tc.id
       JOIN employees e ON tr.employee_id = e.id
       WHERE tr.wsp_year = $1
       GROUP BY tc.category, tc.nqf_level, tc.seta, tc.title, e.race, e.gender, disabled
       ORDER BY tc.category, tc.title`,
      [year]
    );

    const summary = await dbQuery(
      `SELECT
         COUNT(DISTINCT tr.employee_id) AS total_beneficiaries,
         COUNT(tr.id) AS total_interventions,
         COALESCE(SUM(tc.cost), 0) AS total_planned_cost,
         COALESCE(SUM(tr.cost_actual), 0) AS total_actual_cost,
         COUNT(CASE WHEN tr.status = 'COMPLETED' THEN 1 END) AS completed,
         COUNT(CASE WHEN tr.status = 'IN_PROGRESS' THEN 1 END) AS in_progress,
         COUNT(CASE WHEN tr.status = 'ENROLLED' THEN 1 END) AS enrolled
       FROM training_records tr
       JOIN training_courses tc ON tr.course_id = tc.id
       WHERE tr.wsp_year = $1`,
      [year]
    );

    const byNqf = await dbQuery(
      `SELECT tc.nqf_level, COUNT(DISTINCT tr.employee_id) AS beneficiaries, COUNT(tr.id) AS interventions
       FROM training_records tr
       JOIN training_courses tc ON tr.course_id = tc.id
       WHERE tr.wsp_year = $1 AND tc.nqf_level IS NOT NULL
       GROUP BY tc.nqf_level ORDER BY tc.nqf_level`,
      [year]
    );

    res.json({
      success: true,
      data: {
        year,
        report_type: 'WSP',
        title: 'Workplace Skills Plan',
        summary: summary.rows[0],
        by_nqf_level: byNqf.rows,
        details: planned.rows
      }
    });
  } catch (err) { next(err); }
});

router.get('/coe-projections', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM coe_projections ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/coe-projections', authenticate, async (req, res, next) => {
  try {
    const { projection_name, financial_year, base_coe, total_coe, department_id, salary_increase_pct, vacancy_fill_rate, new_positions, assumptions, notes } = req.body;
    const increase = parseFloat(salary_increase_pct || 0) / 100;
    const fillRate = parseFloat(vacancy_fill_rate || 100) / 100;
    const newPos = parseInt(new_positions || 0);

    let baseCoeVal = parseFloat(base_coe || total_coe || 0);

    if (!baseCoeVal) {
      let empQuery = `SELECT COALESCE(SUM(e.annual_salary), 0) AS total FROM employees e WHERE e.status = 'ACTIVE' AND e.enabled = TRUE`;
      const empParams = [];
      if (department_id) {
        empQuery += ` AND e.position_id IN (SELECT id FROM positions WHERE department_id = $1)`;
        empParams.push(department_id);
      }
      const empResult = await dbQuery(empQuery, empParams);
      baseCoeVal = parseFloat(empResult.rows[0].total);
    }

    let headcountQuery = `SELECT COUNT(*) FROM employees WHERE status = 'ACTIVE' AND enabled = TRUE`;
    const hcParams = [];
    if (department_id) {
      headcountQuery += ` AND position_id IN (SELECT id FROM positions WHERE department_id = $1)`;
      hcParams.push(department_id);
    }
    const currentHeadcount = await dbQuery(headcountQuery, hcParams);
    const headcount = parseInt(currentHeadcount.rows[0].count);

    let vacantQuery = `SELECT COUNT(*) FROM positions WHERE status = 'VACANT' AND enabled = TRUE`;
    const vParams = [];
    if (department_id) {
      vacantQuery += ` AND department_id = $1`;
      vParams.push(department_id);
    }
    const vacantPositions = await dbQuery(vacantQuery, vParams);
    const vacantCount = parseInt(vacantPositions.rows[0].count);

    const projectedFills = Math.round(vacantCount * fillRate);
    const projectedHeadcount = headcount + projectedFills + newPos;
    const projectedCoe = baseCoeVal * (1 + increase) + (projectedFills + newPos) * (baseCoeVal / Math.max(headcount, 1)) * (1 + increase);

    const combinedNotes = [assumptions, notes].filter(Boolean).join('; ');

    const result = await dbQuery(
      `INSERT INTO coe_projections (projection_name, financial_year, base_coe, salary_increase_pct, vacancy_fill_rate, new_positions, projected_coe, projected_headcount, assumptions, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [projection_name || `CoE Projection ${financial_year}`, financial_year, baseCoeVal, salary_increase_pct, vacancy_fill_rate, newPos, projectedCoe.toFixed(2), projectedHeadcount, combinedNotes || null, req.user?.id || 1]
    );

    const data = result.rows[0];
    data.current_coe = baseCoeVal;
    data.increase_amount = projectedCoe - baseCoeVal;
    data.filled_positions = headcount;

    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});

router.get('/irp5-batch/:taxYear', authenticate, async (req, res, next) => {
  try {
    const pdf = await generateAllIRP5sPDF(parseInt(req.params.taxYear));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=IRP5_Batch_${req.params.taxYear}.pdf`);
    res.send(pdf);
  } catch (err) { next(err); }
});

router.get('/irp5-text/:taxYear', authenticate, async (req, res, next) => {
  try {
    const text = await generateIRP5TextFile(parseInt(req.params.taxYear));
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=IRP5_Electronic_${req.params.taxYear}.txt`);
    res.send(text);
  } catch (err) { next(err); }
});

router.get('/emp201-electronic/:taxYear/:period', authenticate, async (req, res, next) => {
  try {
    const data = await generateEMP201Electronic(parseInt(req.params.taxYear), parseInt(req.params.period));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=EMP201_Electronic_${req.params.taxYear}_P${req.params.period}.csv`);
    res.send(data);
  } catch (err) { next(err); }
});

router.get('/emp501-electronic/:taxYear', authenticate, async (req, res, next) => {
  try {
    const data = await generateEMP501Electronic(parseInt(req.params.taxYear));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=EMP501_Electronic_${req.params.taxYear}.csv`);
    res.send(data);
  } catch (err) { next(err); }
});

router.get('/roe/:taxYear', authenticate, async (req, res, next) => {
  try {
    const data = await generateROE(parseInt(req.params.taxYear));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ROE_${req.params.taxYear}.pdf`);
    res.send(data);
  } catch (err) { next(err); }
});

router.get('/sdl1/:taxYear', authenticate, async (req, res, next) => {
  try {
    const data = await generateSDL1(parseInt(req.params.taxYear));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=SDL1_${req.params.taxYear}.pdf`);
    res.send(data);
  } catch (err) { next(err); }
});

router.get('/payslips-batch/:runId', authenticate, async (req, res, next) => {
  try {
    const employeeIds = req.query.employees ? req.query.employees.split(',').map(Number).filter(n => !isNaN(n)) : null;
    const pdf = await generateBatchPayslips(parseInt(req.params.runId), employeeIds);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Payslips_Batch_Run${req.params.runId}.pdf`);
    res.send(pdf);
  } catch (err) { next(err); }
});

router.get('/irp5-amended/:taxYear/:employeeId', authenticate, async (req, res, next) => {
  try {
    const pdf = await generateAmendedIRP5(parseInt(req.params.taxYear), parseInt(req.params.employeeId));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=IRP5_Amended_${req.params.taxYear}_${req.params.employeeId}.pdf`);
    res.send(pdf);
  } catch (err) { next(err); }
});

module.exports = router;
