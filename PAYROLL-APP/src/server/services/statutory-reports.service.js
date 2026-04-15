const PDFDocument = require('pdfkit');
const { query: dbQuery } = require('../config/database');

const DEFAULT_MUNICIPALITY = {
  name: 'Platinum Municipality',
  sdlNumber: 'L000123456',
  payeRef: '7000123456',
  uifRef: 'U000123456',
};

async function loadMunicipalityDetails() {
  try {
    const result = await dbQuery("SELECT key, value FROM system_settings WHERE category IN ('municipality', 'sars') ORDER BY key");
    const s = {};
    result.rows.forEach(r => { s[r.key] = r.value; });
    return {
      name: s.municipality_name || s.irp5_trading_name || DEFAULT_MUNICIPALITY.name,
      sdlNumber: s.sdl_reference || DEFAULT_MUNICIPALITY.sdlNumber,
      payeRef: s.paye_reference || DEFAULT_MUNICIPALITY.payeRef,
      uifRef: s.uif_reference || DEFAULT_MUNICIPALITY.uifRef,
    };
  } catch (e) {
    return DEFAULT_MUNICIPALITY;
  }
}

async function generateIRP5(taxYear, employeeId) {
  const MUNICIPALITY = await loadMunicipalityDetails();

  const emp = await dbQuery(
    `SELECT e.*, p.title AS position_title
     FROM employees e LEFT JOIN positions p ON e.position_id = p.id
     WHERE e.id = $1`, [employeeId]
  );
  if (!emp.rows.length) throw new Error('Employee not found');
  const { enrichSingle } = require('../routes/department.routes');
  await enrichSingle(emp.rows[0]);
  const employee = emp.rows[0];

  const results = await dbQuery(
    `SELECT pr.irp5_code, pr.transaction_type, sh.name AS head_name, SUM(pr.amount) AS total_amount
     FROM payroll_results pr
     JOIN salary_heads sh ON pr.salary_head_id = sh.id
     WHERE pr.employee_id = $1 AND pr.tax_year = $2 AND pr.irp5_code IS NOT NULL
     GROUP BY pr.irp5_code, pr.transaction_type, sh.name
     ORDER BY pr.irp5_code`, [employeeId, taxYear]
  );

  const totalIncome = results.rows.filter(r => r.transaction_type === 'EARNING').reduce((s, r) => s + parseFloat(r.total_amount), 0);
  const totalDeductions = results.rows.filter(r => r.transaction_type === 'DEDUCTION').reduce((s, r) => s + parseFloat(r.total_amount), 0);
  const totalCompany = results.rows.filter(r => r.transaction_type === 'COMPANY_CONTRIBUTION').reduce((s, r) => s + parseFloat(r.total_amount), 0);

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const buffers = [];
  doc.on('data', b => buffers.push(b));

  doc.fontSize(14).font('Helvetica-Bold').text('IRP5 / IT3(a) EMPLOYEE TAX CERTIFICATE', { align: 'center' });
  doc.fontSize(8).font('Helvetica').text(`Tax Year: 1 March ${taxYear - 1} to 28 February ${taxYear}`, { align: 'center' });
  doc.moveDown(0.5);
  doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
  doc.moveDown(0.5);

  doc.fontSize(9).font('Helvetica-Bold').text('EMPLOYER DETAILS');
  doc.fontSize(8).font('Helvetica');
  doc.text(`Trading Name: ${MUNICIPALITY.name}`);
  doc.text(`PAYE Reference: ${MUNICIPALITY.payeRef}`);
  doc.text(`SDL Number: ${MUNICIPALITY.sdlNumber}`);
  doc.text(`UIF Reference: ${MUNICIPALITY.uifRef}`);
  doc.moveDown(0.5);

  doc.fontSize(9).font('Helvetica-Bold').text('EMPLOYEE DETAILS');
  doc.fontSize(8).font('Helvetica');
  doc.text(`Surname: ${employee.surname}`);
  doc.text(`First Names: ${employee.first_name} ${employee.second_name || ''}`);
  doc.text(`ID Number: ${employee.id_number || 'N/A'}`);
  doc.text(`Tax Reference: ${employee.income_tax_number || 'N/A'}`);
  doc.text(`Date of Birth: ${employee.date_of_birth ? new Date(employee.date_of_birth).toLocaleDateString('en-ZA') : 'N/A'}`);
  doc.text(`Nature of Employment: Code A (Standard)`);
  doc.moveDown(0.5);
  doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
  doc.moveDown(0.3);

  doc.fontSize(9).font('Helvetica-Bold').text('INCOME (Source Codes 3000-3999)');
  let y = doc.y + 4;
  doc.fontSize(7).font('Helvetica-Bold');
  doc.text('IRP5 Code', 40, y); doc.text('Description', 120, y); doc.text('Amount', 430, y, { width: 85, align: 'right' });
  y += 12;
  doc.font('Helvetica');
  results.rows.filter(r => r.transaction_type === 'EARNING' || r.transaction_type === 'FRINGE_BENEFIT').forEach(r => {
    doc.text(r.irp5_code, 40, y); doc.text(r.head_name, 120, y); doc.text(fmt(r.total_amount), 430, y, { width: 85, align: 'right' });
    y += 11;
  });
  doc.font('Helvetica-Bold').fontSize(8);
  doc.text('GROSS REMUNERATION (Code 3696)', 120, y); doc.text(fmt(totalIncome), 430, y, { width: 85, align: 'right' });
  y += 16;

  doc.fontSize(9).font('Helvetica-Bold').text('DEDUCTIONS (Source Codes 4000-4999)', 40, y);
  y += 14;
  doc.fontSize(7).font('Helvetica');
  results.rows.filter(r => r.transaction_type === 'DEDUCTION').forEach(r => {
    doc.text(r.irp5_code, 40, y); doc.text(r.head_name, 120, y); doc.text(fmt(r.total_amount), 430, y, { width: 85, align: 'right' });
    y += 11;
  });
  doc.font('Helvetica-Bold').fontSize(8);
  doc.text('TOTAL DEDUCTIONS', 120, y); doc.text(fmt(totalDeductions), 430, y, { width: 85, align: 'right' });
  y += 16;

  doc.fontSize(9).font('Helvetica-Bold').text('EMPLOYER CONTRIBUTIONS', 40, y);
  y += 14;
  doc.fontSize(7).font('Helvetica');
  results.rows.filter(r => r.transaction_type === 'COMPANY_CONTRIBUTION').forEach(r => {
    doc.text(r.irp5_code, 40, y); doc.text(r.head_name, 120, y); doc.text(fmt(r.total_amount), 430, y, { width: 85, align: 'right' });
    y += 11;
  });

  y += 10;
  doc.moveTo(40, y).lineTo(555, y).stroke();
  y += 6;
  doc.fontSize(6).font('Helvetica').fillColor('#888888');
  doc.text('This certificate is issued in terms of Paragraph 13(1) of the Fourth Schedule to the Income Tax Act, 1962.', 40, y, { align: 'center' });

  doc.end();
  return new Promise((resolve) => { doc.on('end', () => resolve(Buffer.concat(buffers))); });
}

async function generateEMP201(taxYear, taxPeriod) {
  const MUNICIPALITY = await loadMunicipalityDetails();

  const results = await dbQuery(
    `SELECT 
       COALESCE(SUM(CASE WHEN sh.code = 'PAYE' THEN pr.amount ELSE 0 END), 0) AS total_paye,
       COALESCE(SUM(CASE WHEN sh.code = 'UIF_EE' THEN pr.amount ELSE 0 END), 0) AS total_uif_ee,
       COALESCE(SUM(CASE WHEN sh.code = 'UIF_ER' THEN pr.amount ELSE 0 END), 0) AS total_uif_er,
       COALESCE(SUM(CASE WHEN sh.code = 'SDL' THEN pr.amount ELSE 0 END), 0) AS total_sdl,
       COUNT(DISTINCT pr.employee_id) AS employee_count
     FROM payroll_results pr
     JOIN salary_heads sh ON pr.salary_head_id = sh.id
     WHERE pr.tax_year = $1 AND pr.tax_period = $2
       AND sh.code IN ('PAYE','UIF_EE','UIF_ER','SDL')`,
    [taxYear, taxPeriod]
  );

  const data = results.rows[0];
  const totalUif = parseFloat(data.total_uif_ee) + parseFloat(data.total_uif_er);
  const grandTotal = parseFloat(data.total_paye) + totalUif + parseFloat(data.total_sdl);

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const buffers = [];
  doc.on('data', b => buffers.push(b));

  doc.fontSize(14).font('Helvetica-Bold').text('EMP201 - MONTHLY EMPLOYER DECLARATION', { align: 'center' });
  doc.fontSize(8).font('Helvetica').text(`Tax Period: ${taxPeriod} | Tax Year: ${taxYear}`, { align: 'center' });
  doc.moveDown(1);

  doc.fontSize(9).font('Helvetica-Bold').text('EMPLOYER DETAILS');
  doc.fontSize(8).font('Helvetica');
  doc.text(`Name: ${MUNICIPALITY.name}`);
  doc.text(`PAYE Reference: ${MUNICIPALITY.payeRef}`);
  doc.text(`SDL Number: ${MUNICIPALITY.sdlNumber}`);
  doc.text(`UIF Reference: ${MUNICIPALITY.uifRef}`);
  doc.text(`Number of Employees: ${data.employee_count}`);
  doc.moveDown(1);

  const tableTop = doc.y;
  doc.fontSize(9).font('Helvetica-Bold');
  doc.text('Tax Type', 50, tableTop); doc.text('Amount', 400, tableTop, { width: 115, align: 'right' });
  doc.moveTo(40, tableTop + 14).lineTo(555, tableTop + 14).stroke();

  let y = tableTop + 20;
  doc.fontSize(9).font('Helvetica');
  const rows = [
    ['PAYE (Pay-As-You-Earn)', data.total_paye],
    ['UIF - Employee Contribution', data.total_uif_ee],
    ['UIF - Employer Contribution', data.total_uif_er],
    ['Total UIF', totalUif],
    ['SDL (Skills Development Levy)', data.total_sdl],
  ];
  rows.forEach(r => {
    doc.text(r[0], 50, y); doc.text(fmt(r[1]), 400, y, { width: 115, align: 'right' });
    y += 14;
  });

  doc.moveTo(40, y + 2).lineTo(555, y + 2).lineWidth(1.5).stroke();
  y += 8;
  doc.fontSize(11).font('Helvetica-Bold');
  doc.text('TOTAL PAYABLE TO SARS', 50, y); doc.text(fmt(grandTotal), 400, y, { width: 115, align: 'right' });

  y += 24;
  doc.fontSize(7).font('Helvetica').fillColor('#888888');
  doc.text(`Due by the 7th of the month following the period. Payment via eFiling or SARS branch.`, 40, y, { align: 'center' });
  doc.text(`Generated: ${new Date().toISOString().split('T')[0]}`, 40, y + 10, { align: 'center' });

  doc.end();
  return new Promise((resolve) => { doc.on('end', () => resolve(Buffer.concat(buffers))); });
}

async function generateEMP501(taxYear) {
  const MUNICIPALITY = await loadMunicipalityDetails();

  const results = await dbQuery(
    `SELECT pr.tax_period,
       COALESCE(SUM(CASE WHEN sh.code = 'PAYE' THEN pr.amount ELSE 0 END), 0) AS paye,
       COALESCE(SUM(CASE WHEN sh.code = 'UIF_EE' THEN pr.amount ELSE 0 END), 0) AS uif_ee,
       COALESCE(SUM(CASE WHEN sh.code = 'UIF_ER' THEN pr.amount ELSE 0 END), 0) AS uif_er,
       COALESCE(SUM(CASE WHEN sh.code = 'SDL' THEN pr.amount ELSE 0 END), 0) AS sdl,
       COUNT(DISTINCT pr.employee_id) AS emp_count
     FROM payroll_results pr
     JOIN salary_heads sh ON pr.salary_head_id = sh.id
     WHERE pr.tax_year = $1 AND sh.code IN ('PAYE','UIF_EE','UIF_ER','SDL')
     GROUP BY pr.tax_period ORDER BY pr.tax_period`, [taxYear]
  );

  const totals = { paye: 0, uif_ee: 0, uif_er: 0, sdl: 0 };
  results.rows.forEach(r => {
    totals.paye += parseFloat(r.paye); totals.uif_ee += parseFloat(r.uif_ee);
    totals.uif_er += parseFloat(r.uif_er); totals.sdl += parseFloat(r.sdl);
  });

  const doc = new PDFDocument({ size: 'A4', margin: 40, layout: 'landscape' });
  const buffers = [];
  doc.on('data', b => buffers.push(b));

  doc.fontSize(14).font('Helvetica-Bold').text('EMP501 - EMPLOYER RECONCILIATION DECLARATION', { align: 'center' });
  doc.fontSize(8).font('Helvetica').text(`Tax Year: ${taxYear} (1 March ${taxYear - 1} to 28 February ${taxYear})`, { align: 'center' });
  doc.moveDown(1);

  doc.fontSize(8).font('Helvetica-Bold');
  const cols = [40, 120, 220, 340, 440, 540, 640];
  let y = doc.y;
  doc.text('Period', cols[0], y); doc.text('Employees', cols[1], y); doc.text('PAYE', cols[2], y, { width: 100, align: 'right' });
  doc.text('UIF (EE+ER)', cols[3], y, { width: 80, align: 'right' }); doc.text('SDL', cols[4], y, { width: 80, align: 'right' });
  doc.text('Total', cols[5], y, { width: 100, align: 'right' });
  y += 14;
  doc.moveTo(40, y).lineTo(750, y).stroke();
  y += 4;

  doc.fontSize(7).font('Helvetica');
  results.rows.forEach(r => {
    const uif = parseFloat(r.uif_ee) + parseFloat(r.uif_er);
    const total = parseFloat(r.paye) + uif + parseFloat(r.sdl);
    doc.text(String(r.tax_period), cols[0], y); doc.text(String(r.emp_count), cols[1], y);
    doc.text(fmt(r.paye), cols[2], y, { width: 100, align: 'right' });
    doc.text(fmt(uif), cols[3], y, { width: 80, align: 'right' });
    doc.text(fmt(r.sdl), cols[4], y, { width: 80, align: 'right' });
    doc.text(fmt(total), cols[5], y, { width: 100, align: 'right' });
    y += 12;
  });

  doc.moveTo(40, y + 2).lineTo(750, y + 2).lineWidth(1).stroke();
  y += 8;
  doc.fontSize(8).font('Helvetica-Bold');
  const totalUif = totals.uif_ee + totals.uif_er;
  const grandTotal = totals.paye + totalUif + totals.sdl;
  doc.text('ANNUAL TOTALS', cols[0], y);
  doc.text(fmt(totals.paye), cols[2], y, { width: 100, align: 'right' });
  doc.text(fmt(totalUif), cols[3], y, { width: 80, align: 'right' });
  doc.text(fmt(totals.sdl), cols[4], y, { width: 80, align: 'right' });
  doc.text(fmt(grandTotal), cols[5], y, { width: 100, align: 'right' });

  doc.end();
  return new Promise((resolve) => { doc.on('end', () => resolve(Buffer.concat(buffers))); });
}

async function generateEasyFileCSV(taxYear) {
  const MUNICIPALITY = await loadMunicipalityDetails();

  const results = await dbQuery(
    `SELECT e.employee_code, e.id_number, e.surname, e.first_name, e.date_of_birth, e.income_tax_number,
            pr.irp5_code, SUM(pr.amount) AS total
     FROM payroll_results pr
     JOIN employees e ON pr.employee_id = e.id
     WHERE pr.tax_year = $1 AND pr.irp5_code IS NOT NULL
     GROUP BY e.employee_code, e.id_number, e.surname, e.first_name, e.date_of_birth, e.income_tax_number, pr.irp5_code
     ORDER BY e.surname, e.first_name, pr.irp5_code`, [taxYear]
  );

  let csv = 'EmployeeCode,IDNumber,Surname,FirstName,DateOfBirth,TaxRefNo,IRP5Code,Amount\n';
  results.rows.forEach(r => {
    csv += `${r.employee_code},${r.id_number},${r.surname},${r.first_name},${r.date_of_birth ? new Date(r.date_of_birth).toISOString().split('T')[0] : ''},${r.income_tax_number || ''},${r.irp5_code},${parseFloat(r.total).toFixed(2)}\n`;
  });
  return csv;
}

function fmt(val) {
  return `R ${parseFloat(val || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function generateIRP5TextFile(taxYear) {
  const MUNICIPALITY = await loadMunicipalityDetails();

  const employees = await dbQuery(
    `SELECT DISTINCT e.id, e.employee_code, e.id_number, e.surname, e.first_name, e.second_name,
            e.date_of_birth, e.income_tax_number, e.gender, e.joining_date, e.end_date, e.status,
            e.residential_address_1, e.residential_address_2, e.residential_city, e.residential_postal_code
     FROM employees e
     JOIN payroll_results pr ON pr.employee_id = e.id
     WHERE pr.tax_year = $1 AND pr.irp5_code IS NOT NULL AND e.enabled = TRUE
     ORDER BY e.surname, e.first_name`, [taxYear]
  );

  const lines = [];
  const now = new Date();
  const fileDate = now.toISOString().split('T')[0].replace(/-/g, '');

  lines.push(['H', 'IT3A01', fileDate, MUNICIPALITY.payeRef, MUNICIPALITY.name, taxYear, employees.rows.length].join('|'));

  lines.push(['E', MUNICIPALITY.payeRef, MUNICIPALITY.name, MUNICIPALITY.sdlNumber, MUNICIPALITY.uifRef,
    '', '', '', '', ''].join('|'));

  let certNo = 1;
  for (const emp of employees.rows) {
    const results = await dbQuery(
      `SELECT pr.irp5_code, pr.transaction_type, SUM(pr.amount) AS total_amount
       FROM payroll_results pr
       WHERE pr.employee_id = $1 AND pr.tax_year = $2 AND pr.irp5_code IS NOT NULL
       GROUP BY pr.irp5_code, pr.transaction_type
       ORDER BY pr.irp5_code`, [emp.id, taxYear]
    );

    const dob = emp.date_of_birth ? new Date(emp.date_of_birth).toISOString().split('T')[0].replace(/-/g, '') : '';
    const startDate = emp.joining_date ? new Date(emp.joining_date).toISOString().split('T')[0].replace(/-/g, '') : '';
    const endDate = emp.end_date ? new Date(emp.end_date).toISOString().split('T')[0].replace(/-/g, '') : '';
    const natureOfPerson = emp.status === 'TERMINATED' ? 'B' : 'A';

    lines.push(['C', String(certNo).padStart(10, '0'), emp.id_number || '', emp.surname,
      emp.first_name, emp.second_name || '', dob, emp.income_tax_number || '',
      natureOfPerson, startDate, endDate, emp.gender === 'Male' ? 'M' : 'F',
      emp.residential_address_1 || '', emp.residential_city || '', emp.residential_postal_code || ''].join('|'));

    for (const r of results.rows) {
      lines.push(['S', String(certNo).padStart(10, '0'), r.irp5_code,
        parseFloat(r.total_amount).toFixed(2)].join('|'));
    }
    certNo++;
  }

  const totalIncome = await dbQuery(
    `SELECT COALESCE(SUM(pr.amount), 0) AS total
     FROM payroll_results pr
     JOIN salary_heads sh ON pr.salary_head_id = sh.id
     WHERE pr.tax_year = $1 AND sh.transaction_type = 'EARNING'`, [taxYear]
  );
  const totalPaye = await dbQuery(
    `SELECT COALESCE(SUM(pr.amount), 0) AS total
     FROM payroll_results pr
     JOIN salary_heads sh ON pr.salary_head_id = sh.id
     WHERE pr.tax_year = $1 AND sh.code = 'PAYE'`, [taxYear]
  );

  lines.push(['T', employees.rows.length, certNo - 1,
    parseFloat(totalIncome.rows[0].total).toFixed(2),
    parseFloat(totalPaye.rows[0].total).toFixed(2)].join('|'));

  return lines.join('\r\n');
}

async function generateEMP201Electronic(taxYear, taxPeriod) {
  const MUNICIPALITY = await loadMunicipalityDetails();

  const results = await dbQuery(
    `SELECT
       COALESCE(SUM(CASE WHEN sh.code = 'PAYE' THEN pr.amount ELSE 0 END), 0) AS total_paye,
       COALESCE(SUM(CASE WHEN sh.code = 'UIF_EE' THEN pr.amount ELSE 0 END), 0) AS total_uif_ee,
       COALESCE(SUM(CASE WHEN sh.code = 'UIF_ER' THEN pr.amount ELSE 0 END), 0) AS total_uif_er,
       COALESCE(SUM(CASE WHEN sh.code = 'SDL' THEN pr.amount ELSE 0 END), 0) AS total_sdl,
       COUNT(DISTINCT pr.employee_id) AS employee_count
     FROM payroll_results pr
     JOIN salary_heads sh ON pr.salary_head_id = sh.id
     WHERE pr.tax_year = $1 AND pr.tax_period = $2
       AND sh.code IN ('PAYE','UIF_EE','UIF_ER','SDL')`,
    [taxYear, taxPeriod]
  );

  const data = results.rows[0];
  const totalUif = parseFloat(data.total_uif_ee) + parseFloat(data.total_uif_er);
  const grandTotal = parseFloat(data.total_paye) + totalUif + parseFloat(data.total_sdl);
  const now = new Date();
  const fileDate = now.toISOString().split('T')[0].replace(/-/g, '');

  const lines = [];
  lines.push(['H', 'EMP201', fileDate, MUNICIPALITY.payeRef].join('|'));
  lines.push(['D', MUNICIPALITY.payeRef, MUNICIPALITY.name, taxYear, taxPeriod,
    data.employee_count,
    parseFloat(data.total_paye).toFixed(2),
    parseFloat(data.total_uif_ee).toFixed(2),
    parseFloat(data.total_uif_er).toFixed(2),
    totalUif.toFixed(2),
    parseFloat(data.total_sdl).toFixed(2),
    grandTotal.toFixed(2)].join('|'));
  lines.push(['T', 1, grandTotal.toFixed(2)].join('|'));

  return lines.join('\r\n');
}

async function generateEMP501Electronic(taxYear) {
  const MUNICIPALITY = await loadMunicipalityDetails();

  const results = await dbQuery(
    `SELECT pr.tax_period,
       COALESCE(SUM(CASE WHEN sh.code = 'PAYE' THEN pr.amount ELSE 0 END), 0) AS paye,
       COALESCE(SUM(CASE WHEN sh.code = 'UIF_EE' THEN pr.amount ELSE 0 END), 0) AS uif_ee,
       COALESCE(SUM(CASE WHEN sh.code = 'UIF_ER' THEN pr.amount ELSE 0 END), 0) AS uif_er,
       COALESCE(SUM(CASE WHEN sh.code = 'SDL' THEN pr.amount ELSE 0 END), 0) AS sdl,
       COUNT(DISTINCT pr.employee_id) AS emp_count
     FROM payroll_results pr
     JOIN salary_heads sh ON pr.salary_head_id = sh.id
     WHERE pr.tax_year = $1 AND sh.code IN ('PAYE','UIF_EE','UIF_ER','SDL')
     GROUP BY pr.tax_period ORDER BY pr.tax_period`, [taxYear]
  );

  const certCount = await dbQuery(
    `SELECT COUNT(DISTINCT employee_id) AS cnt FROM payroll_results WHERE tax_year = $1 AND irp5_code IS NOT NULL`, [taxYear]
  );

  const now = new Date();
  const fileDate = now.toISOString().split('T')[0].replace(/-/g, '');
  const lines = [];

  lines.push(['H', 'EMP501', fileDate, MUNICIPALITY.payeRef, taxYear].join('|'));
  lines.push(['E', MUNICIPALITY.payeRef, MUNICIPALITY.name, MUNICIPALITY.sdlNumber, MUNICIPALITY.uifRef].join('|'));

  const totals = { paye: 0, uif_ee: 0, uif_er: 0, sdl: 0 };
  for (const r of results.rows) {
    const uif = parseFloat(r.uif_ee) + parseFloat(r.uif_er);
    const periodTotal = parseFloat(r.paye) + uif + parseFloat(r.sdl);
    totals.paye += parseFloat(r.paye);
    totals.uif_ee += parseFloat(r.uif_ee);
    totals.uif_er += parseFloat(r.uif_er);
    totals.sdl += parseFloat(r.sdl);

    lines.push(['P', r.tax_period, r.emp_count,
      parseFloat(r.paye).toFixed(2),
      parseFloat(r.uif_ee).toFixed(2),
      parseFloat(r.uif_er).toFixed(2),
      parseFloat(r.sdl).toFixed(2),
      periodTotal.toFixed(2)].join('|'));
  }

  const totalUif = totals.uif_ee + totals.uif_er;
  const grandTotal = totals.paye + totalUif + totals.sdl;
  lines.push(['T', results.rows.length, certCount.rows[0].cnt,
    totals.paye.toFixed(2), totals.uif_ee.toFixed(2), totals.uif_er.toFixed(2),
    totals.sdl.toFixed(2), grandTotal.toFixed(2)].join('|'));

  return lines.join('\r\n');
}

async function generateAllIRP5sPDF(taxYear) {
  const MUNICIPALITY = await loadMunicipalityDetails();

  const employees = await dbQuery(
    `SELECT DISTINCT e.id
     FROM employees e
     JOIN payroll_results pr ON pr.employee_id = e.id
     WHERE pr.tax_year = $1 AND pr.irp5_code IS NOT NULL AND e.enabled = TRUE
     ORDER BY e.id`, [taxYear]
  );

  if (!employees.rows.length) throw new Error('No IRP5 data found for the specified tax year');

  const allBuffers = [];
  for (const emp of employees.rows) {
    const pdf = await generateIRP5(taxYear, emp.id);
    allBuffers.push(pdf);
  }

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const buffers = [];
  doc.on('data', b => buffers.push(b));

  for (let i = 0; i < employees.rows.length; i++) {
    if (i > 0) doc.addPage();

    const emp = await dbQuery(
      `SELECT e.*, p.title AS position_title
       FROM employees e LEFT JOIN positions p ON e.position_id = p.id
       WHERE e.id = $1`, [employees.rows[i].id]
    );
    const employee = emp.rows[0];

    const results = await dbQuery(
      `SELECT pr.irp5_code, pr.transaction_type, sh.name AS head_name, SUM(pr.amount) AS total_amount
       FROM payroll_results pr
       JOIN salary_heads sh ON pr.salary_head_id = sh.id
       WHERE pr.employee_id = $1 AND pr.tax_year = $2 AND pr.irp5_code IS NOT NULL
       GROUP BY pr.irp5_code, pr.transaction_type, sh.name
       ORDER BY pr.irp5_code`, [employees.rows[i].id, taxYear]
    );

    const totalIncome = results.rows.filter(r => r.transaction_type === 'EARNING').reduce((s, r) => s + parseFloat(r.total_amount), 0);
    const totalDeductions = results.rows.filter(r => r.transaction_type === 'DEDUCTION').reduce((s, r) => s + parseFloat(r.total_amount), 0);

    doc.fontSize(14).font('Helvetica-Bold').text('IRP5 / IT3(a) EMPLOYEE TAX CERTIFICATE', { align: 'center' });
    doc.fontSize(8).font('Helvetica').text(`Tax Year: 1 March ${taxYear - 1} to 28 February ${taxYear}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fontSize(9).font('Helvetica-Bold').text('EMPLOYER DETAILS');
    doc.fontSize(8).font('Helvetica');
    doc.text(`Trading Name: ${MUNICIPALITY.name}`);
    doc.text(`PAYE Reference: ${MUNICIPALITY.payeRef}`);
    doc.moveDown(0.5);

    doc.fontSize(9).font('Helvetica-Bold').text('EMPLOYEE DETAILS');
    doc.fontSize(8).font('Helvetica');
    doc.text(`Surname: ${employee.surname}`);
    doc.text(`First Names: ${employee.first_name} ${employee.second_name || ''}`);
    doc.text(`ID Number: ${employee.id_number || 'N/A'}`);
    doc.text(`Tax Reference: ${employee.income_tax_number || 'N/A'}`);
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);

    doc.fontSize(9).font('Helvetica-Bold').text('INCOME (Source Codes 3000-3999)');
    let y = doc.y + 4;
    doc.fontSize(7).font('Helvetica-Bold');
    doc.text('IRP5 Code', 40, y); doc.text('Description', 120, y); doc.text('Amount', 430, y, { width: 85, align: 'right' });
    y += 12;
    doc.font('Helvetica');
    results.rows.filter(r => r.transaction_type === 'EARNING' || r.transaction_type === 'FRINGE_BENEFIT').forEach(r => {
      doc.text(r.irp5_code, 40, y); doc.text(r.head_name, 120, y); doc.text(fmt(r.total_amount), 430, y, { width: 85, align: 'right' });
      y += 11;
    });
    doc.font('Helvetica-Bold').fontSize(8);
    doc.text('GROSS REMUNERATION (Code 3696)', 120, y); doc.text(fmt(totalIncome), 430, y, { width: 85, align: 'right' });
    y += 16;

    doc.fontSize(9).font('Helvetica-Bold').text('DEDUCTIONS (Source Codes 4000-4999)', 40, y);
    y += 14;
    doc.fontSize(7).font('Helvetica');
    results.rows.filter(r => r.transaction_type === 'DEDUCTION').forEach(r => {
      doc.text(r.irp5_code, 40, y); doc.text(r.head_name, 120, y); doc.text(fmt(r.total_amount), 430, y, { width: 85, align: 'right' });
      y += 11;
    });
    doc.font('Helvetica-Bold').fontSize(8);
    doc.text('TOTAL DEDUCTIONS', 120, y); doc.text(fmt(totalDeductions), 430, y, { width: 85, align: 'right' });
    y += 16;

    doc.fontSize(9).font('Helvetica-Bold').text('EMPLOYER CONTRIBUTIONS', 40, y);
    y += 14;
    doc.fontSize(7).font('Helvetica');
    results.rows.filter(r => r.transaction_type === 'COMPANY_CONTRIBUTION').forEach(r => {
      doc.text(r.irp5_code, 40, y); doc.text(r.head_name, 120, y); doc.text(fmt(r.total_amount), 430, y, { width: 85, align: 'right' });
      y += 11;
    });

    y += 10;
    doc.moveTo(40, y).lineTo(555, y).stroke();
    y += 6;
    doc.fontSize(6).font('Helvetica').fillColor('#888888');
    doc.text('This certificate is issued in terms of Paragraph 13(1) of the Fourth Schedule to the Income Tax Act, 1962.', 40, y, { align: 'center' });
    doc.fillColor('#000000');
  }

  doc.end();
  return new Promise((resolve) => { doc.on('end', () => resolve(Buffer.concat(buffers))); });
}

async function generateAmendedIRP5(taxYear, employeeId, amendments) {
  const MUNICIPALITY = await loadMunicipalityDetails();

  const emp = await dbQuery(
    `SELECT e.*, p.title AS position_title
     FROM employees e LEFT JOIN positions p ON e.position_id = p.id
     WHERE e.id = $1`, [employeeId]
  );
  if (!emp.rows.length) throw new Error('Employee not found');
  const { enrichSingle } = require('../routes/department.routes');
  await enrichSingle(emp.rows[0]);
  const employee = emp.rows[0];

  const results = await dbQuery(
    `SELECT pr.irp5_code, pr.transaction_type, sh.name AS head_name, SUM(pr.amount) AS total_amount
     FROM payroll_results pr
     JOIN salary_heads sh ON pr.salary_head_id = sh.id
     WHERE pr.employee_id = $1 AND pr.tax_year = $2 AND pr.irp5_code IS NOT NULL
     GROUP BY pr.irp5_code, pr.transaction_type, sh.name
     ORDER BY pr.irp5_code`, [employeeId, taxYear]
  );

  const amendedResults = results.rows.map(r => {
    if (amendments && amendments[r.irp5_code] !== undefined) {
      return { ...r, total_amount: amendments[r.irp5_code], amended: true };
    }
    return r;
  });

  const totalIncome = amendedResults.filter(r => r.transaction_type === 'EARNING').reduce((s, r) => s + parseFloat(r.total_amount), 0);
  const totalDeductions = amendedResults.filter(r => r.transaction_type === 'DEDUCTION').reduce((s, r) => s + parseFloat(r.total_amount), 0);

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const buffers = [];
  doc.on('data', b => buffers.push(b));

  doc.fontSize(14).font('Helvetica-Bold').text('AMENDED IRP5 / IT3(a) EMPLOYEE TAX CERTIFICATE', { align: 'center' });
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#cc0000').text('*** AMENDED CERTIFICATE ***', { align: 'center' });
  doc.fillColor('#000000');
  doc.fontSize(8).font('Helvetica').text(`Tax Year: 1 March ${taxYear - 1} to 28 February ${taxYear}`, { align: 'center' });
  doc.moveDown(0.5);
  doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
  doc.moveDown(0.5);

  doc.fontSize(9).font('Helvetica-Bold').text('EMPLOYER DETAILS');
  doc.fontSize(8).font('Helvetica');
  doc.text(`Trading Name: ${MUNICIPALITY.name}`);
  doc.text(`PAYE Reference: ${MUNICIPALITY.payeRef}`);
  doc.text(`SDL Number: ${MUNICIPALITY.sdlNumber}`);
  doc.text(`UIF Reference: ${MUNICIPALITY.uifRef}`);
  doc.moveDown(0.5);

  doc.fontSize(9).font('Helvetica-Bold').text('EMPLOYEE DETAILS');
  doc.fontSize(8).font('Helvetica');
  doc.text(`Surname: ${employee.surname}`);
  doc.text(`First Names: ${employee.first_name} ${employee.second_name || ''}`);
  doc.text(`ID Number: ${employee.id_number || 'N/A'}`);
  doc.text(`Tax Reference: ${employee.income_tax_number || 'N/A'}`);
  doc.moveDown(0.5);
  doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
  doc.moveDown(0.3);

  doc.fontSize(9).font('Helvetica-Bold').text('INCOME (Source Codes 3000-3999)');
  let y = doc.y + 4;
  doc.fontSize(7).font('Helvetica-Bold');
  doc.text('IRP5 Code', 40, y); doc.text('Description', 120, y); doc.text('Amount', 430, y, { width: 85, align: 'right' });
  y += 12;
  doc.font('Helvetica');
  amendedResults.filter(r => r.transaction_type === 'EARNING' || r.transaction_type === 'FRINGE_BENEFIT').forEach(r => {
    if (r.amended) doc.fillColor('#cc0000');
    doc.text(r.irp5_code, 40, y); doc.text(r.head_name + (r.amended ? ' *' : ''), 120, y); doc.text(fmt(r.total_amount), 430, y, { width: 85, align: 'right' });
    if (r.amended) doc.fillColor('#000000');
    y += 11;
  });
  doc.font('Helvetica-Bold').fontSize(8);
  doc.text('GROSS REMUNERATION (Code 3696)', 120, y); doc.text(fmt(totalIncome), 430, y, { width: 85, align: 'right' });
  y += 16;

  doc.fontSize(9).font('Helvetica-Bold').text('DEDUCTIONS (Source Codes 4000-4999)', 40, y);
  y += 14;
  doc.fontSize(7).font('Helvetica');
  amendedResults.filter(r => r.transaction_type === 'DEDUCTION').forEach(r => {
    if (r.amended) doc.fillColor('#cc0000');
    doc.text(r.irp5_code, 40, y); doc.text(r.head_name + (r.amended ? ' *' : ''), 120, y); doc.text(fmt(r.total_amount), 430, y, { width: 85, align: 'right' });
    if (r.amended) doc.fillColor('#000000');
    y += 11;
  });
  doc.font('Helvetica-Bold').fontSize(8);
  doc.text('TOTAL DEDUCTIONS', 120, y); doc.text(fmt(totalDeductions), 430, y, { width: 85, align: 'right' });
  y += 16;

  doc.fontSize(9).font('Helvetica-Bold').text('EMPLOYER CONTRIBUTIONS', 40, y);
  y += 14;
  doc.fontSize(7).font('Helvetica');
  amendedResults.filter(r => r.transaction_type === 'COMPANY_CONTRIBUTION').forEach(r => {
    if (r.amended) doc.fillColor('#cc0000');
    doc.text(r.irp5_code, 40, y); doc.text(r.head_name + (r.amended ? ' *' : ''), 120, y); doc.text(fmt(r.total_amount), 430, y, { width: 85, align: 'right' });
    if (r.amended) doc.fillColor('#000000');
    y += 11;
  });

  y += 10;
  doc.moveTo(40, y).lineTo(555, y).stroke();
  y += 6;
  doc.fontSize(6).font('Helvetica').fillColor('#888888');
  doc.text('* Amended values. This is a corrected certificate issued in terms of Paragraph 13(1) of the Fourth Schedule to the Income Tax Act, 1962.', 40, y, { align: 'center' });
  doc.text(`Amendment Date: ${new Date().toISOString().split('T')[0]}`, 40, y + 10, { align: 'center' });

  doc.end();
  return new Promise((resolve) => { doc.on('end', () => resolve(Buffer.concat(buffers))); });
}

async function generateROE(taxYear) {
  const MUNICIPALITY = await loadMunicipalityDetails();

  const results = await dbQuery(
    `SELECT e.id, e.employee_code, e.surname, e.first_name, e.id_number,
            e.joining_date, e.end_date, e.status,
            COALESCE(SUM(CASE WHEN sh.transaction_type = 'EARNING' THEN pr.amount ELSE 0 END), 0) AS gross_earnings
     FROM employees e
     JOIN payroll_results pr ON pr.employee_id = e.id
     JOIN salary_heads sh ON pr.salary_head_id = sh.id
     WHERE pr.tax_year = $1 AND e.enabled = TRUE
     GROUP BY e.id, e.employee_code, e.surname, e.first_name, e.id_number, e.joining_date, e.end_date, e.status
     ORDER BY e.surname, e.first_name`, [taxYear]
  );

  const totalEarnings = results.rows.reduce((s, r) => s + parseFloat(r.gross_earnings), 0);
  const assessmentRate = 0.0134;
  const totalAssessment = totalEarnings * assessmentRate;

  const doc = new PDFDocument({ size: 'A4', margin: 40, layout: 'landscape' });
  const buffers = [];
  doc.on('data', b => buffers.push(b));

  doc.fontSize(14).font('Helvetica-Bold').text('RETURN OF EARNINGS (ROE) - COIDA', { align: 'center' });
  doc.fontSize(8).font('Helvetica').text(`Tax Year: ${taxYear} (1 March ${taxYear - 1} to 28 February ${taxYear})`, { align: 'center' });
  doc.moveDown(0.5);

  doc.fontSize(9).font('Helvetica-Bold').text('EMPLOYER DETAILS');
  doc.fontSize(8).font('Helvetica');
  doc.text(`Name: ${MUNICIPALITY.name}`);
  doc.text(`PAYE Reference: ${MUNICIPALITY.payeRef}`);
  doc.text(`Total Employees: ${results.rows.length}`);
  doc.text(`Assessment Rate: ${(assessmentRate * 100).toFixed(2)}%`);
  doc.moveDown(0.5);

  doc.moveTo(40, doc.y).lineTo(800, doc.y).stroke();
  doc.moveDown(0.3);

  const cols = [40, 110, 220, 340, 440, 560, 660];
  let y = doc.y;
  doc.fontSize(7).font('Helvetica-Bold');
  doc.text('Code', cols[0], y); doc.text('Name', cols[1], y); doc.text('ID Number', cols[2], y);
  doc.text('Start Date', cols[3], y); doc.text('Gross Earnings', cols[4], y, { width: 100, align: 'right' });
  doc.text('Assessment', cols[5], y, { width: 80, align: 'right' });
  doc.text('Status', cols[6], y);
  y += 12;
  doc.moveTo(40, y).lineTo(800, y).stroke();
  y += 4;

  doc.fontSize(6).font('Helvetica');
  for (const r of results.rows) {
    if (y > 520) { doc.addPage(); y = 40; }
    const gross = parseFloat(r.gross_earnings);
    const assessment = gross * assessmentRate;
    doc.text(r.employee_code, cols[0], y);
    doc.text(`${r.surname}, ${r.first_name}`, cols[1], y);
    doc.text(r.id_number || '', cols[2], y);
    doc.text(r.joining_date ? new Date(r.joining_date).toLocaleDateString('en-ZA') : '', cols[3], y);
    doc.text(fmt(gross), cols[4], y, { width: 100, align: 'right' });
    doc.text(fmt(assessment), cols[5], y, { width: 80, align: 'right' });
    doc.text(r.status, cols[6], y);
    y += 10;
  }

  y += 4;
  doc.moveTo(40, y).lineTo(800, y).lineWidth(1).stroke();
  y += 6;
  doc.fontSize(8).font('Helvetica-Bold');
  doc.text('TOTALS', cols[1], y);
  doc.text(fmt(totalEarnings), cols[4], y, { width: 100, align: 'right' });
  doc.text(fmt(totalAssessment), cols[5], y, { width: 80, align: 'right' });

  y += 20;
  doc.fontSize(7).font('Helvetica').fillColor('#888888');
  doc.text('Return of Earnings submitted to the Compensation Commissioner in terms of the COIDA Act 130 of 1993.', 40, y, { align: 'center' });
  doc.text(`Generated: ${new Date().toISOString().split('T')[0]}`, 40, y + 10, { align: 'center' });

  doc.end();
  return new Promise((resolve) => { doc.on('end', () => resolve(Buffer.concat(buffers))); });
}

async function generateSDL1(taxYear) {
  const MUNICIPALITY = await loadMunicipalityDetails();

  const results = await dbQuery(
    `SELECT pr.tax_period,
       COUNT(DISTINCT pr.employee_id) AS emp_count,
       COALESCE(SUM(CASE WHEN sh.transaction_type = 'EARNING' THEN pr.amount ELSE 0 END), 0) AS gross_remuneration,
       COALESCE(SUM(CASE WHEN sh.code = 'SDL' THEN pr.amount ELSE 0 END), 0) AS sdl_paid
     FROM payroll_results pr
     JOIN salary_heads sh ON pr.salary_head_id = sh.id
     WHERE pr.tax_year = $1
     GROUP BY pr.tax_period ORDER BY pr.tax_period`, [taxYear]
  );

  const trainingSpend = await dbQuery(
    `SELECT COALESCE(SUM(cost), 0) AS total_cost, COUNT(*) AS training_count
     FROM training_records
     WHERE EXTRACT(YEAR FROM start_date) >= $1 - 1 AND EXTRACT(YEAR FROM end_date) <= $1`,
    [taxYear]
  );

  const totals = results.rows.reduce((acc, r) => {
    acc.gross += parseFloat(r.gross_remuneration);
    acc.sdl += parseFloat(r.sdl_paid);
    acc.employees = Math.max(acc.employees, parseInt(r.emp_count));
    return acc;
  }, { gross: 0, sdl: 0, employees: 0 });

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const buffers = [];
  doc.on('data', b => buffers.push(b));

  doc.fontSize(14).font('Helvetica-Bold').text('SDL1 - ANNUAL SKILLS DEVELOPMENT LEVY REPORT', { align: 'center' });
  doc.fontSize(8).font('Helvetica').text(`Tax Year: ${taxYear} (1 March ${taxYear - 1} to 28 February ${taxYear})`, { align: 'center' });
  doc.moveDown(0.5);

  doc.fontSize(9).font('Helvetica-Bold').text('EMPLOYER DETAILS');
  doc.fontSize(8).font('Helvetica');
  doc.text(`Name: ${MUNICIPALITY.name}`);
  doc.text(`SDL Number: ${MUNICIPALITY.sdlNumber}`);
  doc.text(`SETA: LGSETA (Local Government Sector Education and Training Authority)`);
  doc.text(`Total Employees: ${totals.employees}`);
  doc.moveDown(0.5);

  doc.fontSize(9).font('Helvetica-Bold').text('MONTHLY SDL SUMMARY');
  doc.moveDown(0.3);
  let y = doc.y;
  doc.fontSize(7).font('Helvetica-Bold');
  doc.text('Period', 40, y); doc.text('Employees', 100, y);
  doc.text('Gross Remuneration', 200, y, { width: 120, align: 'right' });
  doc.text('SDL Paid (1%)', 350, y, { width: 100, align: 'right' });
  y += 12;
  doc.moveTo(40, y).lineTo(555, y).stroke();
  y += 4;

  doc.fontSize(7).font('Helvetica');
  for (const r of results.rows) {
    doc.text(String(r.tax_period), 40, y);
    doc.text(String(r.emp_count), 100, y);
    doc.text(fmt(r.gross_remuneration), 200, y, { width: 120, align: 'right' });
    doc.text(fmt(r.sdl_paid), 350, y, { width: 100, align: 'right' });
    y += 11;
  }

  doc.moveTo(40, y + 2).lineTo(555, y + 2).lineWidth(1).stroke();
  y += 8;
  doc.fontSize(8).font('Helvetica-Bold');
  doc.text('ANNUAL TOTALS', 40, y);
  doc.text(fmt(totals.gross), 200, y, { width: 120, align: 'right' });
  doc.text(fmt(totals.sdl), 350, y, { width: 100, align: 'right' });

  y += 24;
  doc.fontSize(9).font('Helvetica-Bold').text('TRAINING EXPENDITURE SUMMARY', 40, y);
  y += 16;
  doc.fontSize(8).font('Helvetica');
  doc.text(`Total Training Spend: ${fmt(trainingSpend.rows[0].total_cost)}`, 40, y);
  doc.text(`Number of Training Interventions: ${trainingSpend.rows[0].training_count}`, 40, y + 12);
  doc.text(`SDL Paid: ${fmt(totals.sdl)}`, 40, y + 24);
  const sdlRecoverable = totals.sdl * 0.8;
  doc.text(`Maximum Recoverable (80%): ${fmt(sdlRecoverable)}`, 40, y + 36);

  y += 60;
  doc.fontSize(6).font('Helvetica').fillColor('#888888');
  doc.text('Annual SDL Report for submission to LGSETA. SDL is levied at 1% of total remuneration in terms of the Skills Development Levies Act 9 of 1999.', 40, y, { align: 'center' });
  doc.text(`Generated: ${new Date().toISOString().split('T')[0]}`, 40, y + 10, { align: 'center' });

  doc.end();
  return new Promise((resolve) => { doc.on('end', () => resolve(Buffer.concat(buffers))); });
}

module.exports = {
  generateIRP5, generateEMP201, generateEMP501, generateEasyFileCSV,
  generateIRP5TextFile, generateEMP201Electronic, generateEMP501Electronic,
  generateAllIRP5sPDF, generateAmendedIRP5, generateROE, generateSDL1
};
