const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { query: dbQuery } = require('../config/database');

const TX_ORDER = { EARNING: 1, DEDUCTION: 2, COMPANY_CONTRIBUTION: 3, FRINGE_BENEFIT: 4 };
const TX_LABEL = {
  EARNING: 'Earnings',
  DEDUCTION: 'Deductions',
  COMPANY_CONTRIBUTION: 'Company Contributions',
  FRINGE_BENEFIT: 'Fringe Benefits',
};

async function loadMunicipalityName() {
  try {
    const r = await dbQuery(
      "SELECT value FROM system_settings WHERE key = 'municipality_name' LIMIT 1"
    );
    return r.rows[0]?.value || 'Municipality';
  } catch (e) {
    return 'Municipality';
  }
}

async function getPayrollTotals(params) {
  const {
    period_id,
    cycle_id,
    employee_id = null,
    department_id = null,
    include_trial = false,
    generated_by = null,
  } = params;

  if (!period_id || !cycle_id) {
    throw new Error('period_id and cycle_id are required');
  }

  const period = await dbQuery(
    `SELECT pp.id, pp.cycle_id, pp.tax_year, pp.period_number, pp.processing_month,
            pp.start_date, pp.end_date, pp.status,
            pc.name AS cycle_name, pc.code AS cycle_code
     FROM payroll_periods pp
     JOIN payroll_cycles pc ON pc.id = pp.cycle_id
     WHERE pp.id = $1 AND pp.cycle_id = $2`,
    [period_id, cycle_id]
  );
  if (!period.rows.length) {
    return {
      period: null,
      filters: { employee: null, department: null, include_trial },
      groups: [],
      totals: { earnings: 0, deductions: 0, company_contributions: 0, fringe_benefits: 0, nett_pay: 0, grand_total: 0 },
      empty: true,
      empty_reason: 'PERIOD_NOT_FOUND',
    };
  }

  let employee = null;
  if (employee_id) {
    const e = await dbQuery(
      'SELECT id, employee_code, first_name, surname FROM employees WHERE id = $1',
      [employee_id]
    );
    employee = e.rows[0] || null;
  }

  let department = null;
  if (department_id) {
    try {
      const { getDepartments } = require('../routes/department.routes');
      const depts = await getDepartments();
      department = depts.find(d => Number(d.id) === Number(department_id)) || null;
    } catch (_err) {
      department = null;
    }
    if (!department) {
      department = { id: department_id, name: `Department #${department_id}` };
    }
  }

  const trialFilter = include_trial
    ? "AND pr.run_id IN (SELECT id FROM payroll_runs WHERE run_type IN ('FINAL','ADHOC_FINAL','TRIAL','ADHOC_TRIAL'))"
    : "AND pr.run_id IN (SELECT id FROM payroll_runs WHERE run_type IN ('FINAL','ADHOC_FINAL'))";

  const sql = `
    WITH payroll_per_emp_head AS (
      SELECT pr.employee_id, pr.salary_head_id, SUM(pr.amount) AS amount
      FROM payroll_results pr
      WHERE pr.period_id = $1
        AND pr.cycle_id = $2
        AND ($3::int IS NULL OR pr.employee_id = $3::int)
        AND ($4::int IS NULL OR pr.department_id = $4::int)
        ${trialFilter}
      GROUP BY pr.employee_id, pr.salary_head_id
    ),
    overtime_input AS (
      SELECT employee_id, salary_head_id, SUM(hours) AS qty
      FROM overtime_transactions
      WHERE period_id = $1 AND status = 'APPROVED'
      GROUP BY employee_id, salary_head_id
    ),
    travel_claims AS (
      SELECT c.employee_id, c.claim_type, c.sub_type, SUM(c.kilometres) AS km
      FROM claims c
      WHERE c.period_id = $1 AND c.claim_type = 'TRAVEL' AND c.status = 'APPROVED'
      GROUP BY c.employee_id, c.claim_type, c.sub_type
    ),
    travel_config AS (
      SELECT DISTINCT ON (claim_type, COALESCE(claim_subtype, ''))
             claim_type, COALESCE(claim_subtype, '') AS sub_key, salary_head_id
      FROM claim_configurations
      WHERE salary_head_id IS NOT NULL
      ORDER BY claim_type, COALESCE(claim_subtype, ''), id
    ),
    travel_input AS (
      SELECT tc.employee_id, cfg.salary_head_id, SUM(tc.km) AS qty
      FROM travel_claims tc
      JOIN travel_config cfg
        ON cfg.claim_type = tc.claim_type
       AND cfg.sub_key = COALESCE(tc.sub_type, '')
      GROUP BY tc.employee_id, cfg.salary_head_id
    ),
    input_combined AS (
      SELECT employee_id, salary_head_id, SUM(qty) AS qty FROM (
        SELECT employee_id, salary_head_id, qty FROM overtime_input
        UNION ALL
        SELECT employee_id, salary_head_id, qty FROM travel_input
      ) u
      GROUP BY employee_id, salary_head_id
    )
    SELECT
      sh.transaction_type,
      sh.id AS salary_head_id,
      sh.code AS salary_head_code,
      sh.name AS salary_head_name,
      sh.is_overtime,
      SUM(peh.amount) AS amount,
      COALESCE(SUM(ic.qty), 0) AS input_qty
    FROM payroll_per_emp_head peh
    JOIN salary_heads sh ON sh.id = peh.salary_head_id
    LEFT JOIN input_combined ic
      ON ic.employee_id = peh.employee_id AND ic.salary_head_id = peh.salary_head_id
    GROUP BY sh.transaction_type, sh.id, sh.code, sh.name, sh.is_overtime
    ORDER BY
      CASE sh.transaction_type
        WHEN 'EARNING' THEN 1
        WHEN 'DEDUCTION' THEN 2
        WHEN 'COMPANY_CONTRIBUTION' THEN 3
        WHEN 'FRINGE_BENEFIT' THEN 4
        ELSE 5
      END,
      sh.code`;

  const { rows } = await dbQuery(sql, [period_id, cycle_id, employee_id, department_id]);

  const groupsMap = new Map();
  for (const r of rows) {
    if (!groupsMap.has(r.transaction_type)) {
      groupsMap.set(r.transaction_type, {
        transaction_type: r.transaction_type,
        label: TX_LABEL[r.transaction_type] || r.transaction_type,
        order: TX_ORDER[r.transaction_type] || 99,
        rows: [],
        subtotal: 0,
      });
    }
    const g = groupsMap.get(r.transaction_type);
    g.rows.push({
      salary_head_id: r.salary_head_id,
      code: r.salary_head_code,
      name: r.salary_head_name,
      input: parseFloat(r.input_qty || 0),
      amount: parseFloat(r.amount || 0),
    });
    g.subtotal += parseFloat(r.amount || 0);
  }
  const groups = Array.from(groupsMap.values()).sort((a, b) => a.order - b.order);

  const sum = key => (groupsMap.get(key)?.subtotal || 0);
  const totals = {
    earnings: sum('EARNING'),
    deductions: sum('DEDUCTION'),
    company_contributions: sum('COMPANY_CONTRIBUTION'),
    fringe_benefits: sum('FRINGE_BENEFIT'),
    nett_pay: sum('EARNING') - sum('DEDUCTION'),
    grand_total: groups.reduce((s, g) => s + g.subtotal, 0),
  };

  const muniName = await loadMunicipalityName();
  return {
    municipality_name: muniName,
    generated_by: generated_by || 'System',
    generated_at: new Date().toISOString(),
    period: period.rows[0],
    filters: { employee, department, include_trial: !!include_trial },
    groups,
    totals,
    empty: rows.length === 0,
    empty_reason: rows.length === 0 ? 'NO_RESULTS' : null,
  };
}

function fmtMoney(v) {
  return parseFloat(v || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function buildPdf(report) {
  const muniName = report.municipality_name || await loadMunicipalityName();
  const doc = new PDFDocument({ size: 'A4', margin: 36 });
  const buffers = [];
  doc.on('data', b => buffers.push(b));

  const NAVY = '#1e3a5f';
  const GOLD = '#b78d2f';
  const TEXT = '#1f2937';
  const MUTED = '#6b7280';
  const LINE = '#e5e7eb';

  const initials = (() => {
    const parts = (muniName || 'Municipality').trim().split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] || 'M') + (parts[1]?.[0] || '')).toUpperCase();
  })();
  const badgeX = 36, badgeY = doc.y, badgeSize = 38;
  doc.save();
  doc.roundedRect(badgeX, badgeY, badgeSize, badgeSize, 8).fill(NAVY);
  doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(15)
    .text(initials, badgeX, badgeY + (badgeSize - 15) / 2, { width: badgeSize, align: 'center' });
  doc.restore();
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(16)
    .text(muniName, badgeX + badgeSize + 10, badgeY + 2, { align: 'left' });
  doc.fillColor(GOLD).fontSize(11)
    .text('PAYROLL TOTALS REPORT', badgeX + badgeSize + 10, badgeY + 22);
  doc.y = badgeY + badgeSize + 4;
  doc.x = 36;
  doc.moveDown(0.5);
  doc.strokeColor(GOLD).lineWidth(1.5).moveTo(36, doc.y).lineTo(559, doc.y).stroke();
  doc.moveDown(0.6);

  const p = report.period;
  doc.fillColor(TEXT).font('Helvetica').fontSize(9);
  const meta = [
    ['Tax Year', p ? p.tax_year : '—'],
    ['Cycle', p ? p.cycle_name : '—'],
    ['Period', p ? `${p.processing_month} (P${p.period_number})` : '—'],
    ['Employee', report.filters.employee ? `${report.filters.employee.employee_code} – ${report.filters.employee.first_name} ${report.filters.employee.surname}` : 'All'],
    ['Department', report.filters.department ? report.filters.department.name : 'All'],
    ['Run Type', report.filters.include_trial ? 'Including Trial Runs' : 'Final Only'],
    ['Generated By', report.generated_by || 'System'],
    ['Generated At', new Date(report.generated_at || Date.now()).toLocaleString('en-ZA')],
  ];
  const colW = (559 - 36) / 2;
  let mx = 36, my = doc.y;
  meta.forEach((m, i) => {
    const x = 36 + (i % 2) * colW;
    const y = my + Math.floor(i / 2) * 14;
    doc.fillColor(MUTED).font('Helvetica').fontSize(8).text(m[0].toUpperCase(), x, y, { width: 100 });
    doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(9).text(String(m[1]), x + 100, y, { width: colW - 100 });
  });
  doc.y = my + Math.ceil(meta.length / 2) * 14 + 6;
  doc.strokeColor(LINE).lineWidth(0.5).moveTo(36, doc.y).lineTo(559, doc.y).stroke();
  doc.moveDown(0.5);

  if (report.empty) {
    doc.fillColor(MUTED).font('Helvetica-Oblique').fontSize(11)
      .text('No payroll results found for the selected parameters.', { align: 'center' });
    doc.end();
    return new Promise(res => doc.on('end', () => res(Buffer.concat(buffers))));
  }

  const drawHeaderRow = () => {
    const y = doc.y;
    doc.rect(36, y, 523, 18).fill(NAVY);
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(8.5);
    doc.text('CODE', 42, y + 5, { width: 60 });
    doc.text('SALARY HEAD', 105, y + 5, { width: 280 });
    doc.text('INPUT', 385, y + 5, { width: 70, align: 'right' });
    doc.text('AMOUNT (R)', 460, y + 5, { width: 95, align: 'right' });
    doc.y = y + 20;
  };

  for (const g of report.groups) {
    if (doc.y > 720) doc.addPage();
    doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(11).text(g.label.toUpperCase(), 36, doc.y);
    doc.moveDown(0.2);
    drawHeaderRow();
    doc.font('Helvetica').fontSize(9).fillColor(TEXT);
    let zebra = false;
    for (const r of g.rows) {
      if (doc.y > 760) { doc.addPage(); drawHeaderRow(); }
      const y = doc.y;
      if (zebra) doc.rect(36, y - 1, 523, 14).fill('#f8fafc').fillColor(TEXT);
      doc.fillColor(TEXT).font('Helvetica').fontSize(9);
      doc.text(r.code, 42, y + 2, { width: 60 });
      doc.text(r.name, 105, y + 2, { width: 280, ellipsis: true });
      doc.text(r.input ? r.input.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00', 385, y + 2, { width: 70, align: 'right' });
      doc.text(fmtMoney(r.amount), 460, y + 2, { width: 95, align: 'right' });
      doc.y = y + 14;
      zebra = !zebra;
    }
    const sy = doc.y;
    doc.rect(36, sy, 523, 16).fill('#f1f5f9');
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9.5);
    doc.text(`Sub-total ${g.label}`, 42, sy + 4, { width: 413 });
    doc.text(`R ${fmtMoney(g.subtotal)}`, 460, sy + 4, { width: 95, align: 'right' });
    doc.y = sy + 22;
  }

  if (doc.y > 700) doc.addPage();
  const ty = doc.y + 6;
  doc.rect(36, ty, 523, 60).fill('#fafafa');
  doc.strokeColor(GOLD).lineWidth(1).rect(36, ty, 523, 60).stroke();
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10);
  doc.text('TOTAL EARNINGS', 48, ty + 8, { width: 200 });
  doc.text(`R ${fmtMoney(report.totals.earnings)}`, 320, ty + 8, { width: 230, align: 'right' });
  doc.text('TOTAL DEDUCTIONS', 48, ty + 24, { width: 200 });
  doc.text(`R ${fmtMoney(report.totals.deductions)}`, 320, ty + 24, { width: 230, align: 'right' });
  doc.fillColor(GOLD).fontSize(11.5);
  doc.text('NETT PAY', 48, ty + 42, { width: 200 });
  doc.text(`R ${fmtMoney(report.totals.nett_pay)}`, 320, ty + 42, { width: 230, align: 'right' });

  const gy = ty + 70;
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10);
  doc.text('GRAND TOTAL (ALL HEADS)', 48, gy, { width: 250 });
  doc.text(`R ${fmtMoney(report.totals.grand_total)}`, 320, gy, { width: 230, align: 'right' });

  doc.end();
  return new Promise(res => doc.on('end', () => res(Buffer.concat(buffers))));
}

async function buildExcel(report) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'mSCOA HR & Payroll';
  wb.created = new Date();
  const ws = wb.addWorksheet('Payroll Totals');

  ws.columns = [
    { key: 'code', width: 14 },
    { key: 'name', width: 42 },
    { key: 'input', width: 14 },
    { key: 'amount', width: 18 },
  ];

  const NAVY = 'FF1E3A5F';
  const GOLD = 'FFB78D2F';
  const SOFT = 'FFF1F5F9';

  const muniRow = ws.addRow([report.municipality_name || 'Municipality']);
  ws.mergeCells(muniRow.number, 1, muniRow.number, 4);
  muniRow.getCell(1).font = { bold: true, size: 14, color: { argb: NAVY } };
  muniRow.height = 22;

  const titleRow = ws.addRow(['Payroll Totals Report']);
  ws.mergeCells(titleRow.number, 1, titleRow.number, 4);
  titleRow.getCell(1).font = { bold: true, size: 12, color: { argb: GOLD } };

  const p = report.period;
  const meta = [
    ['Tax Year', p ? String(p.tax_year) : '—'],
    ['Cycle', p ? p.cycle_name : '—'],
    ['Period', p ? `${p.processing_month} (P${p.period_number})` : '—'],
    ['Employee', report.filters.employee ? `${report.filters.employee.employee_code} – ${report.filters.employee.first_name} ${report.filters.employee.surname}` : 'All'],
    ['Department', report.filters.department ? report.filters.department.name : 'All'],
    ['Run Type', report.filters.include_trial ? 'Including Trial Runs' : 'Final Only'],
    ['Generated By', report.generated_by || 'System'],
    ['Generated At', new Date(report.generated_at || Date.now()).toLocaleString('en-ZA')],
  ];
  meta.forEach(m => {
    const r = ws.addRow([m[0], m[1]]);
    r.getCell(1).font = { bold: true, color: { argb: 'FF6B7280' } };
  });
  ws.addRow([]);

  const headerRow = ws.addRow(['Code', 'Salary Head', 'Input', 'Amount (R)']);
  headerRow.eachCell(c => {
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    c.alignment = { horizontal: c.col === 1 || c.col === 2 ? 'left' : 'right' };
  });

  for (const g of report.groups) {
    const gr = ws.addRow([g.label.toUpperCase()]);
    ws.mergeCells(gr.number, 1, gr.number, 4);
    gr.getCell(1).font = { bold: true, color: { argb: GOLD }, size: 11 };
    gr.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SOFT } };

    g.rows.forEach(r => {
      const row = ws.addRow([r.code, r.name, r.input || 0, parseFloat(r.amount)]);
      row.getCell(3).numFmt = '#,##0.00';
      row.getCell(4).numFmt = '#,##0.00';
    });

    const sub = ws.addRow(['', `Sub-total ${g.label}`, null, parseFloat(g.subtotal)]);
    sub.eachCell(c => { c.font = { bold: true, color: { argb: NAVY } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SOFT } }; });
    sub.getCell(4).numFmt = '#,##0.00';
    ws.addRow([]);
  }

  const totEarn = ws.addRow(['', 'TOTAL EARNINGS', null, parseFloat(report.totals.earnings)]);
  totEarn.getCell(2).font = { bold: true }; totEarn.getCell(4).numFmt = '#,##0.00'; totEarn.getCell(4).font = { bold: true };
  const totDed = ws.addRow(['', 'TOTAL DEDUCTIONS', null, parseFloat(report.totals.deductions)]);
  totDed.getCell(2).font = { bold: true }; totDed.getCell(4).numFmt = '#,##0.00'; totDed.getCell(4).font = { bold: true };
  const nett = ws.addRow(['', 'NETT PAY', null, parseFloat(report.totals.nett_pay)]);
  nett.eachCell(c => { c.font = { bold: true, color: { argb: GOLD }, size: 12 }; });
  nett.getCell(4).numFmt = '#,##0.00';

  const grand = ws.addRow(['', 'GRAND TOTAL (ALL HEADS)', null, parseFloat(report.totals.grand_total)]);
  grand.eachCell(c => { c.font = { bold: true, color: { argb: NAVY }, size: 11 }; });
  grand.getCell(4).numFmt = '#,##0.00';

  return wb.xlsx.writeBuffer();
}

function buildCsv(report) {
  const lines = [];
  lines.push(`${report.municipality_name || 'Municipality'}`);
  lines.push('Payroll Totals Report');
  lines.push(`Generated By,${report.generated_by || 'System'}`);
  lines.push(`Generated At,${new Date(report.generated_at || Date.now()).toISOString()}`);
  const p = report.period;
  if (p) {
    lines.push(`Tax Year,${p.tax_year}`);
    lines.push(`Cycle,${p.cycle_name}`);
    lines.push(`Period,${p.processing_month} (P${p.period_number})`);
  }
  lines.push(`Employee,${report.filters.employee ? `${report.filters.employee.employee_code} ${report.filters.employee.first_name} ${report.filters.employee.surname}` : 'All'}`);
  lines.push(`Department,${report.filters.department ? report.filters.department.name : 'All'}`);
  lines.push(`Run Type,${report.filters.include_trial ? 'Including Trial' : 'Final Only'}`);
  lines.push('');
  lines.push('Group,Code,Salary Head,Input,Amount');
  for (const g of report.groups) {
    for (const r of g.rows) {
      const name = String(r.name).replace(/"/g, '""');
      lines.push(`${g.label},${r.code},"${name}",${(r.input || 0).toFixed(2)},${parseFloat(r.amount).toFixed(2)}`);
    }
    lines.push(`${g.label},,Sub-total,,${g.subtotal.toFixed(2)}`);
  }
  lines.push('');
  lines.push(`,,Total Earnings,,${report.totals.earnings.toFixed(2)}`);
  lines.push(`,,Total Deductions,,${report.totals.deductions.toFixed(2)}`);
  lines.push(`,,Nett Pay,,${report.totals.nett_pay.toFixed(2)}`);
  lines.push(`,,Grand Total (All Heads),,${report.totals.grand_total.toFixed(2)}`);
  return lines.join('\n');
}

module.exports = { getPayrollTotals, buildPdf, buildExcel, buildCsv };
