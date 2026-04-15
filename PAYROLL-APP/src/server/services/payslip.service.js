const PDFDocument = require('pdfkit');
const fs = require('fs');
const { query: dbQuery } = require('../config/database');

const DEFAULT_MUNICIPALITY = {
  name: 'George Municipality',
  address: '71 York Street',
  city: 'George, Western Cape, 6530',
  tel: '044 801 9042',
  vatNo: '',
};

function fmt(val) {
  const num = parseFloat(val);
  if (isNaN(num)) return 'R 0.00';
  const n = num.toFixed(2);
  const [whole, dec] = n.split('.');
  const formatted = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `R ${formatted}.${dec}`;
}

async function loadMunicipalityDetails() {
  try {
    const result = await dbQuery("SELECT key, value FROM system_settings WHERE category IN ('municipality', 'sars') ORDER BY key");
    const s = {};
    result.rows.forEach(r => { s[r.key] = r.value; });
    const logoPath = s.municipality_logo || null;
    return {
      name: s.municipality_name || s.irp5_trading_name || DEFAULT_MUNICIPALITY.name,
      address: [s.municipality_address_line1, s.municipality_address_line2].filter(Boolean).join(', ') || DEFAULT_MUNICIPALITY.address,
      city: [s.municipality_city, s.municipality_province, s.municipality_postal_code].filter(Boolean).join(', ') || DEFAULT_MUNICIPALITY.city,
      tel: s.municipality_telephone || DEFAULT_MUNICIPALITY.tel,
      vatNo: s.irp5_employer_tax_number || DEFAULT_MUNICIPALITY.vatNo,
      logoPath: logoPath && fs.existsSync(logoPath) ? logoPath : null,
    };
  } catch (e) {
    return DEFAULT_MUNICIPALITY;
  }
}

async function loadEmployeeData(employeeId) {
  const emp = await dbQuery(
    `SELECT e.*, p.title AS position_title, tg.grade_code,
            pp2.name AS pay_point_name, pp2.code AS pay_point_code
     FROM employees e
     LEFT JOIN positions p ON e.position_id = p.id
     LEFT JOIN task_grades tg ON e.task_grade_id = tg.id
     LEFT JOIN pay_point_departments ppd ON ppd.department_id = e.division_id
     LEFT JOIN pay_points pp2 ON ppd.pay_point_id = pp2.id
     WHERE e.id = $1`, [employeeId]
  );
  if (!emp.rows.length) throw new Error('Employee not found');
  const { enrichSingle } = require('../routes/department.routes');
  try { await enrichSingle(emp.rows[0]); } catch (_) {}
  return emp.rows[0];
}

async function loadRunData(runId) {
  const run = await dbQuery(
    `SELECT pr.*, pp.period_number, pp.tax_year, pp.tax_period, pp.start_date AS period_start, pp.end_date AS period_end,
            pc.name AS cycle_name, pc.periods_per_year
     FROM payroll_runs pr
     JOIN payroll_periods pp ON pr.period_id = pp.id
     JOIN payroll_cycles pc ON pr.cycle_id = pc.id
     WHERE pr.id = $1`, [runId]
  );
  if (!run.rows.length) throw new Error('Payroll run not found');
  return run.rows[0];
}

async function loadResults(runId, employeeId) {
  const results = await dbQuery(
    `SELECT pr.*, sh.code AS head_code, sh.name AS head_name, sh.show_on_payslip
     FROM payroll_results pr
     JOIN salary_heads sh ON pr.salary_head_id = sh.id
     WHERE pr.run_id = $1 AND pr.employee_id = $2
     ORDER BY pr.transaction_type, sh.priority`, [runId, employeeId]
  );
  return results.rows;
}

async function loadYTDTotals(employeeId, taxYear, upToRunId, cycleId) {
  const ytdResult = await dbQuery(
    `SELECT
       SUM(CASE WHEN pr.transaction_type = 'EARNING' AND sh.taxable = true THEN pr.amount ELSE 0 END) AS taxable_income,
       SUM(CASE WHEN sh.code IN ('PENSION','PENSION_EE','RETIREMENT','RETIREMENT_EE') THEN pr.amount ELSE 0 END) AS pension,
       SUM(CASE WHEN sh.code IN ('PAYE','TAX') THEN pr.amount ELSE 0 END) AS paye,
       SUM(CASE WHEN sh.code IN ('UIF','UIF_EE') THEN pr.amount ELSE 0 END) AS uif_ee,
       SUM(CASE WHEN sh.code IN ('UIF_ER') THEN pr.amount ELSE 0 END) AS uif_er,
       SUM(CASE WHEN sh.code IN ('SDL','SDL_ER') THEN pr.amount ELSE 0 END) AS sdl,
       SUM(CASE WHEN pr.transaction_type = 'FRINGE_BENEFIT' THEN pr.amount ELSE 0 END) AS fringe_benefits,
       SUM(CASE WHEN pr.transaction_type = 'COMPANY_CONTRIBUTION' THEN pr.amount ELSE 0 END) AS company_contributions,
       SUM(CASE WHEN pr.transaction_type = 'EARNING' THEN pr.amount ELSE 0 END) AS total_earnings,
       SUM(CASE WHEN pr.transaction_type = 'DEDUCTION' THEN pr.amount ELSE 0 END) AS total_deductions
     FROM payroll_results pr
     JOIN salary_heads sh ON pr.salary_head_id = sh.id
     JOIN payroll_runs prun ON pr.run_id = prun.id
     JOIN payroll_periods pp ON prun.period_id = pp.id
     WHERE pr.employee_id = $1
       AND pr.tax_year = $2
       AND pr.cycle_id = $3
       AND prun.status IN ('COMPLETED','LOCKED','APPROVED')
       AND pp.period_number <= (SELECT pp2.period_number FROM payroll_runs pr2 JOIN payroll_periods pp2 ON pr2.period_id = pp2.id WHERE pr2.id = $4)`,
    [employeeId, taxYear, cycleId, upToRunId]
  );
  const row = ytdResult.rows[0] || {};
  return {
    taxable_income: parseFloat(row.taxable_income || 0),
    pension: parseFloat(row.pension || 0),
    paye: parseFloat(row.paye || 0),
    uif: parseFloat(row.uif_ee || 0) + parseFloat(row.uif_er || 0),
    sdl: parseFloat(row.sdl || 0),
    fringe_benefits: parseFloat(row.fringe_benefits || 0),
    company_contributions: parseFloat(row.company_contributions || 0),
    total_earnings: parseFloat(row.total_earnings || 0),
    total_deductions: parseFloat(row.total_deductions || 0),
  };
}

function renderPayslipPage(doc, employee, payRun, lines, ytd, municipality) {
  const earnings = lines.filter(l => l.transaction_type === 'EARNING');
  const deductions = lines.filter(l => l.transaction_type === 'DEDUCTION');
  const company = lines.filter(l => l.transaction_type === 'COMPANY_CONTRIBUTION');
  const fringe = lines.filter(l => l.transaction_type === 'FRINGE_BENEFIT');

  const totalEarnings = earnings.reduce((s, l) => s + parseFloat(l.amount), 0);
  const totalDeductions = deductions.reduce((s, l) => s + parseFloat(l.amount), 0);
  const nettPay = totalEarnings - totalDeductions;

  const pageW = 515;
  const lm = 40;
  const rm = lm + pageW;

  let headerY = 40;
  const logoW = 60;
  const logoH = 50;
  let textLeft = lm;
  let textWidth = pageW;
  if (municipality.logoPath) {
    try {
      doc.image(municipality.logoPath, lm, headerY, { width: logoW, height: logoH, fit: [logoW, logoH] });
      textLeft = lm + logoW + 10;
      textWidth = pageW - logoW - 10;
    } catch (e) {}
  }
  doc.fontSize(12).font('Helvetica-Bold').text('Salary Advice / Confidential', textLeft, headerY, { align: 'center', width: textWidth });
  doc.moveDown(0.2);
  doc.fontSize(10).font('Helvetica-Bold').text(municipality.name, { align: 'center', width: textWidth });
  doc.fontSize(7).font('Helvetica').text(`${municipality.address}, ${municipality.city}`, { align: 'center', width: textWidth });
  doc.fontSize(7).text(`Tel: ${municipality.tel}`, { align: 'center', width: textWidth });
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  doc.moveDown(0.2);
  const periodLabel = `Period ${payRun.period_number} (${months[(payRun.period_number - 1) % 12]}) - Tax Year ${payRun.tax_year}`;
  doc.fontSize(8).font('Helvetica-Bold').text(periodLabel, lm, doc.y, { align: 'center', width: pageW });
  doc.moveDown(0.1);
  doc.fontSize(7).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString('en-ZA')}`, lm, doc.y, { align: 'right', width: pageW });

  let y = doc.y + 4;
  doc.moveTo(lm, y).lineTo(rm, y).lineWidth(1).stroke();
  y += 6;
  const payDate = payRun.payment_date ? new Date(payRun.payment_date).toLocaleDateString('en-ZA') : '-';
  const engagementDate = employee.joining_date ? new Date(employee.joining_date).toLocaleDateString('en-ZA') : '-';
  const dob = employee.date_of_birth ? new Date(employee.date_of_birth).toLocaleDateString('en-ZA') : '-';
  const annualSalary = parseFloat(employee.annual_salary || 0);

  const col1L = lm;
  const col1V = lm + 80;
  const col2L = lm + 260;
  const col2V = lm + 345;
  const fs = 7;
  const lineH = 11;

  function infoRow(label1, val1, label2, val2, rowY) {
    doc.fontSize(fs).font('Helvetica-Bold').text(label1, col1L, rowY);
    doc.font('Helvetica').text(val1 || '-', col1V, rowY, { width: 170 });
    doc.font('Helvetica-Bold').text(label2, col2L, rowY);
    doc.font('Helvetica').text(val2 || '-', col2V, rowY, { width: 170 });
  }

  const physAddress = [employee.physical_address_1, employee.physical_address_2, employee.physical_city, employee.physical_province, employee.physical_postal_code].filter(Boolean).join(', ');

  infoRow('Name:', `${employee.title || ''} ${employee.first_name} ${employee.surname}`.trim(), 'Employee No:', employee.employee_code, y);
  y += lineH;
  infoRow('ID Number:', employee.id_number || '-', 'Tax Reference:', employee.income_tax_number || '-', y);
  y += lineH;
  infoRow('Date of Birth:', dob, 'Engagement Date:', engagementDate, y);
  y += lineH;
  infoRow('Address:', physAddress || '-', 'Pay Date:', payDate, y);
  y += lineH;
  infoRow('Directorate:', employee.directorate_name || employee.department_name || '-', 'Department:', employee.division_name || employee.department_name || '-', y);
  y += lineH;
  infoRow('Pay Point:', employee.pay_point_name || '-', 'Annual Salary:', fmt(annualSalary), y);
  y += lineH;
  infoRow('Bank:', employee.bank_name || '-', 'Branch Code:', employee.bank_branch_code || '-', y);
  y += lineH;
  infoRow('Account No:', employee.bank_account_number ? '***' + employee.bank_account_number.slice(-4) : '-', 'Account Type:', employee.bank_account_type || '-', y);
  y += lineH + 4;

  doc.moveTo(lm, y).lineTo(rm, y).lineWidth(0.5).stroke();
  y += 6;

  const leftColW = pageW / 2 - 5;
  const rightColX = lm + pageW / 2 + 5;
  const rightColW = pageW / 2 - 5;

  doc.fontSize(8).font('Helvetica-Bold');
  doc.text('EARNINGS', lm, y, { width: leftColW });
  doc.text('DEDUCTIONS', rightColX, y, { width: rightColW });
  y += 12;

  doc.fontSize(6.5).font('Helvetica-Bold');
  doc.text('Description', lm, y, { width: 120 });
  doc.text('Units', lm + 130, y, { width: 40, align: 'center' });
  doc.text('Amount', lm + 170, y, { width: leftColW - 175, align: 'right' });

  doc.text('Description', rightColX, y, { width: 160 });
  doc.text('Amount', rightColX + 160, y, { width: rightColW - 165, align: 'right' });
  y += 9;

  doc.moveTo(lm, y).lineTo(lm + leftColW, y).lineWidth(0.3).stroke();
  doc.moveTo(rightColX, y).lineTo(rightColX + rightColW, y).lineWidth(0.3).stroke();
  y += 3;

  const maxRows = Math.max(earnings.length, deductions.length);
  const rowH = 10;

  doc.font('Helvetica').fontSize(6.5);
  for (let i = 0; i < maxRows; i++) {
    const rowY = y + i * rowH;
    if (i < earnings.length) {
      const e = earnings[i];
      doc.text(e.head_name, lm, rowY, { width: 125 });
      doc.text('', lm + 130, rowY, { width: 40, align: 'center' });
      doc.text(fmt(e.amount), lm + 170, rowY, { width: leftColW - 175, align: 'right' });
    }
    if (i < deductions.length) {
      const d = deductions[i];
      doc.text(d.head_name, rightColX, rowY, { width: 155 });
      doc.text(fmt(d.amount), rightColX + 160, rowY, { width: rightColW - 165, align: 'right' });
    }
  }

  y += maxRows * rowH + 4;
  doc.moveTo(lm, y).lineTo(lm + leftColW, y).lineWidth(0.3).stroke();
  doc.moveTo(rightColX, y).lineTo(rightColX + rightColW, y).lineWidth(0.3).stroke();
  y += 3;

  doc.fontSize(7).font('Helvetica-Bold');
  doc.text('Total Earnings', lm, y, { width: 130 });
  doc.text(fmt(totalEarnings), lm + 170, y, { width: leftColW - 175, align: 'right' });
  doc.text('Total Deductions', rightColX, y, { width: 130 });
  doc.text(fmt(totalDeductions), rightColX + 170, y, { width: rightColW - 175, align: 'right' });
  y += 14;

  if (fringe.length > 0 || company.length > 0) {
    doc.moveTo(lm, y).lineTo(rm, y).lineWidth(0.3).stroke();
    y += 4;
    if (fringe.length > 0) {
      doc.fontSize(7).font('Helvetica-Bold').text('FRINGE BENEFITS', lm, y);
      y += 10;
      doc.font('Helvetica').fontSize(6.5);
      fringe.forEach(f => {
        doc.text(f.head_name, lm + 10, y, { width: 200 });
        doc.text(fmt(f.amount), lm + 220, y, { width: 80, align: 'right' });
        y += 9;
      });
      y += 4;
    }
    if (company.length > 0) {
      doc.fontSize(7).font('Helvetica-Bold').text('COMPANY CONTRIBUTIONS', lm, y);
      y += 10;
      doc.font('Helvetica').fontSize(6.5);
      company.forEach(c => {
        doc.text(c.head_name, lm + 10, y, { width: 200 });
        doc.text(fmt(c.amount), lm + 220, y, { width: 80, align: 'right' });
        y += 9;
      });
      y += 4;
    }
  }

  doc.moveTo(lm, y).lineTo(rm, y).lineWidth(0.5).stroke();
  y += 6;

  doc.fontSize(7).font('Helvetica-Bold').text('YEAR-TO-DATE TOTALS', lm, y);
  y += 12;

  const ytdCol1L = lm;
  const ytdCol1V = lm + 110;
  const ytdCol2L = lm + 260;
  const ytdCol2V = lm + 370;

  doc.fontSize(6.5).font('Helvetica-Bold');
  function ytdRow(l1, v1, l2, v2, ry) {
    doc.font('Helvetica-Bold').text(l1, ytdCol1L, ry);
    doc.font('Helvetica').text(fmt(v1), ytdCol1V, ry, { width: 100, align: 'right' });
    if (l2) {
      doc.font('Helvetica-Bold').text(l2, ytdCol2L, ry);
      doc.font('Helvetica').text(fmt(v2), ytdCol2V, ry, { width: 100, align: 'right' });
    }
  }

  ytdRow('Taxable Income:', ytd.taxable_income, 'Fringe Benefits:', ytd.fringe_benefits, y);
  y += 10;
  ytdRow('Pension:', ytd.pension, 'Company Contributions:', ytd.company_contributions, y);
  y += 10;
  ytdRow('PAYE:', ytd.paye, 'Total Earnings YTD:', ytd.total_earnings, y);
  y += 10;
  ytdRow('UIF:', ytd.uif, 'Total Deductions YTD:', ytd.total_deductions, y);
  y += 10;
  ytdRow('SDL:', ytd.sdl, '', 0, y);
  y += 14;

  doc.moveTo(lm, y).lineTo(rm, y).lineWidth(1.5).stroke();
  y += 8;
  doc.fontSize(11).font('Helvetica-Bold');
  doc.text('NETT PAY', lm, y);
  doc.text(fmt(nettPay), lm + 300, y, { width: 215, align: 'right' });

  y += 22;
  doc.fontSize(6).font('Helvetica').fillColor('#666666');
  doc.text(`Bank: ${employee.bank_name || '-'} | Account: ${employee.bank_account_number ? '***' + employee.bank_account_number.slice(-4) : '-'} | Type: ${employee.bank_account_type || '-'}`, lm, y, { align: 'center', width: pageW });
  y += 10;
  doc.text('This payslip is computer-generated and does not require a signature. Issued in terms of the BCEA Section 33.', lm, y, { align: 'center', width: pageW });
  y += 8;
  doc.text(`Generated: ${new Date().toISOString().split('T')[0]} | ${municipality.name}`, lm, y, { align: 'center', width: pageW });
  doc.fillColor('#000000');

  if (payRun.run_type && !['FINAL', 'ADHOC_FINAL'].includes(payRun.run_type)) {
    doc.save();
    doc.opacity(0.06);
    doc.translate(297, 421);
    doc.rotate(-45, { origin: [0, 0] });
    doc.fontSize(72).font('Helvetica-Bold').fillColor('#000000');
    doc.text('TRIAL PAYSLIP', -250, -30, { align: 'center', width: 500 });
    doc.restore();
  }
}

async function generatePayslip(runId, employeeId) {
  const [municipality, employee, payRun, lines] = await Promise.all([
    loadMunicipalityDetails(),
    loadEmployeeData(employeeId),
    loadRunData(runId),
    loadResults(runId, employeeId)
  ]);

  if (!lines.length) throw new Error(`No payroll results found for employee #${employeeId} in run #${runId}`);

  const ytd = await loadYTDTotals(employeeId, payRun.tax_year, runId, payRun.cycle_id);

  const password = employee.id_number || String(employeeId);
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    userPassword: password,
    ownerPassword: 'superdev',
    permissions: { printing: 'highResolution', copying: false, modifying: false }
  });
  const buffers = [];
  doc.on('data', b => buffers.push(b));

  renderPayslipPage(doc, employee, payRun, lines, ytd, municipality);

  doc.end();
  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
  });
}

async function generateBatchPayslips(runId, employeeIds) {
  const municipality = await loadMunicipalityDetails();
  const payRun = await loadRunData(runId);

  let empQuery = `SELECT DISTINCT pr.employee_id
     FROM payroll_results pr
     WHERE pr.run_id = $1`;
  const empParams = [runId];
  if (employeeIds && employeeIds.length > 0) {
    empQuery += ` AND pr.employee_id = ANY($2)`;
    empParams.push(employeeIds);
  }
  empQuery += ` ORDER BY pr.employee_id`;
  const employees = await dbQuery(empQuery, empParams);

  if (!employees.rows.length) throw new Error('No payroll results found for this run');

  const doc = new PDFDocument({
    size: 'A4',
    margin: 40
  });
  const buffers = [];
  doc.on('data', b => buffers.push(b));

  for (let i = 0; i < employees.rows.length; i++) {
    if (i > 0) doc.addPage();

    const employeeId = employees.rows[i].employee_id;

    try {
      const [employee, lines] = await Promise.all([
        loadEmployeeData(employeeId),
        loadResults(runId, employeeId)
      ]);

      const ytd = await loadYTDTotals(employeeId, payRun.tax_year, runId, payRun.cycle_id);
      renderPayslipPage(doc, employee, payRun, lines, ytd, municipality);
    } catch (e) {
      doc.fontSize(10).font('Helvetica').text(`Error generating payslip for employee #${employeeId}: ${e.message}`, 40, 100);
    }
  }

  doc.end();
  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
  });
}

async function generateEmploymentLetter(employeeId) {
  const MUNICIPALITY = await loadMunicipalityDetails();
  const employee = await loadEmployeeData(employeeId);

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const buffers = [];
  doc.on('data', b => buffers.push(b));

  doc.fontSize(16).font('Helvetica-Bold').text(MUNICIPALITY.name, { align: 'center' });
  doc.fontSize(9).font('Helvetica').text(`${MUNICIPALITY.address} | ${MUNICIPALITY.city}`, { align: 'center' });
  doc.moveDown(2);

  doc.fontSize(9).text(`Date: ${new Date().toLocaleDateString('en-ZA')}`, { align: 'right' });
  doc.moveDown(1);
  doc.fontSize(12).font('Helvetica-Bold').text('TO WHOM IT MAY CONCERN', { align: 'center' });
  doc.moveDown(1);
  doc.fontSize(12).font('Helvetica-Bold').text('CONFIRMATION OF EMPLOYMENT');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');

  const joinDate = employee.joining_date ? new Date(employee.joining_date).toLocaleDateString('en-ZA') : 'N/A';
  const salary = parseFloat(employee.annual_salary || 0);

  doc.text(`This letter serves to confirm that ${employee.title || ''} ${employee.first_name} ${employee.surname} (ID: ${employee.id_number || 'N/A'}) has been employed by ${MUNICIPALITY.name} since ${joinDate}.`);
  doc.moveDown(0.5);
  doc.text(`Position: ${employee.position_title || 'N/A'}`);
  doc.text(`Department: ${employee.department_name || 'N/A'}`);
  doc.text(`TASK Grade: ${employee.grade_code || 'N/A'}`);
  doc.text(`Employment Type: ${employee.status || 'ACTIVE'}`);
  doc.text(`Annual Remuneration: ${fmt(salary)}`);
  doc.moveDown(1);
  doc.text('This letter is issued at the request of the employee and does not constitute a guarantee of continued employment.');
  doc.moveDown(2);
  doc.text('_____________________________');
  doc.text('Municipal Manager');
  doc.text(MUNICIPALITY.name);

  doc.end();
  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
  });
}

module.exports = { generatePayslip, generateEmploymentLetter, generateBatchPayslips };
