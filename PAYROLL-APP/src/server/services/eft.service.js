const { query: dbQuery } = require('../config/database');

async function getMunicipalityBank() {
  try {
    const result = await dbQuery("SELECT key, value FROM system_settings WHERE key LIKE 'municipality_%'");
    const settings = {};
    result.rows.forEach(r => { settings[r.key] = r.value; });
    return {
      bankName: settings.municipality_bank_name || 'STANDARD BANK',
      branchCode: settings.municipality_branch_code || '051001',
      accountNumber: settings.municipality_account_number || '0000012345678',
      accountName: settings.municipality_account_name || 'PLATINUM MUNICIPALITY',
    };
  } catch (e) {
    return { bankName: 'STANDARD BANK', branchCode: '051001', accountNumber: '0000012345678', accountName: 'PLATINUM MUNICIPALITY' };
  }
}

async function generateACBFile(runId) {
  const run = await dbQuery(
    `SELECT pr.*, pp.period_number, pp.tax_year, pc.name AS cycle_name
     FROM payroll_runs pr
     JOIN payroll_periods pp ON pr.period_id = pp.id
     JOIN payroll_cycles pc ON pr.cycle_id = pc.id
     WHERE pr.id = $1`, [runId]
  );
  if (!run.rows.length) throw new Error('Payroll run not found');
  const payRun = run.rows[0];

  const results = await dbQuery(
    `SELECT e.id, e.employee_code, e.first_name, e.surname, e.bank_name, e.bank_branch_code,
            e.bank_account_number, e.bank_account_type,
            SUM(CASE WHEN pr.transaction_type = 'EARNING' THEN pr.amount ELSE 0 END) AS gross,
            SUM(CASE WHEN pr.transaction_type = 'DEDUCTION' THEN pr.amount ELSE 0 END) AS deductions
     FROM payroll_results pr
     JOIN employees e ON pr.employee_id = e.id
     WHERE pr.run_id = $1
     GROUP BY e.id, e.employee_code, e.first_name, e.surname, e.bank_name, e.bank_branch_code, e.bank_account_number, e.bank_account_type
     HAVING (SUM(CASE WHEN pr.transaction_type = 'EARNING' THEN pr.amount ELSE 0 END) - SUM(CASE WHEN pr.transaction_type = 'DEDUCTION' THEN pr.amount ELSE 0 END)) > 0
     ORDER BY e.surname`, [runId]
  );

  const bank = await getMunicipalityBank();
  const paymentDate = payRun.payment_date ? new Date(payRun.payment_date) : new Date();
  const dateStr = paymentDate.toISOString().split('T')[0].replace(/-/g, '');

  let lines = [];
  const header = [
    'H',
    pad(bank.accountName, 30),
    pad(bank.branchCode, 6),
    pad(bank.accountNumber, 13),
    dateStr,
    pad('SALARY', 10),
    pad(String(results.rows.length), 6, '0'),
  ].join('|');
  lines.push(header);

  let totalAmount = 0;
  let hashTotal = 0;
  let seq = 1;

  for (const emp of results.rows) {
    const nett = parseFloat(emp.gross) - parseFloat(emp.deductions);
    if (nett <= 0) continue;
    if (!emp.bank_account_number || !emp.bank_branch_code) continue;

    const amountCents = Math.round(nett * 100);
    totalAmount += amountCents;
    hashTotal += parseInt(emp.bank_account_number.replace(/\D/g, '') || '0', 10);

    const detail = [
      'D',
      pad(String(seq), 6, '0'),
      pad(emp.bank_branch_code || '', 6),
      pad(emp.bank_account_number || '', 13),
      pad(String(amountCents), 12, '0'),
      pad(`${emp.first_name} ${emp.surname}`.substring(0, 30), 30),
      pad('SALARY', 12),
      pad(emp.employee_code || '', 10),
      pad(accountTypeCode(emp.bank_account_type), 1),
    ].join('|');
    lines.push(detail);
    seq++;
  }

  const trailer = [
    'T',
    pad(String(results.rows.length), 6, '0'),
    pad(String(totalAmount), 12, '0'),
    pad(String(hashTotal % 10000000000), 10, '0'),
  ].join('|');
  lines.push(trailer);

  return lines.join('\r\n');
}

function pad(str, len, char = ' ') {
  return (str + char.repeat(len)).substring(0, len);
}

function accountTypeCode(type) {
  const map = { 'CURRENT': '1', 'SAVINGS': '2', 'CHEQUE': '1', 'TRANSMISSION': '3' };
  return map[(type || '').toUpperCase()] || '1';
}

module.exports = { generateACBFile, getMunicipalityBank };
