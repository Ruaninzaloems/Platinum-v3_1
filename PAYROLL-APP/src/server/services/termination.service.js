const { query: dbQuery } = require('../config/database');

function calculateNoticePeriod(joiningDate, lastDate) {
  const start = new Date(joiningDate);
  const end = new Date(lastDate);
  const diffMs = end - start;
  const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);

  if (diffMonths < 6) {
    return { weeks: 1, days: 7, description: 'Less than 6 months service: 1 week notice (BCEA Section 37)' };
  } else if (diffMonths < 12) {
    return { weeks: 2, days: 14, description: '6-12 months service: 2 weeks notice (BCEA Section 37)' };
  } else {
    return { weeks: 4, days: 28, description: 'More than 1 year service: 4 weeks notice (BCEA Section 37)' };
  }
}

function calculateSeverancePay(joiningDate, lastDate, monthlySalary) {
  const start = new Date(joiningDate);
  const end = new Date(lastDate);
  const diffMs = end - start;
  const completedYears = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
  const weeklySalary = (monthlySalary * 12) / 52;
  const severance = completedYears * weeklySalary;

  return {
    completed_years: completedYears,
    weekly_salary: parseFloat(weeklySalary.toFixed(2)),
    severance_pay: parseFloat(severance.toFixed(2)),
    description: `BCEA Section 41: 1 week per completed year (${completedYears} years x R${weeklySalary.toFixed(2)})`
  };
}

async function calculateLeavePayout(employeeId) {
  const emp = await dbQuery(
    'SELECT annual_salary, working_hours_per_day, working_days_per_week FROM employees WHERE id = $1',
    [employeeId]
  );
  if (emp.rows.length === 0) return { balance_days: 0, daily_rate: 0, payout: 0 };

  const employee = emp.rows[0];
  const annualSalary = parseFloat(employee.annual_salary || 0);
  const workingDaysPerYear = parseFloat(employee.working_days_per_week || 5) * 52;
  const dailyRate = annualSalary / workingDaysPerYear;

  const balances = await dbQuery(
    `SELECT COALESCE(SUM(balance_days), 0) AS total_balance
     FROM employee_leave_balances
     WHERE employee_id = $1 AND balance_days > 0`,
    [employeeId]
  );
  const balanceDays = parseFloat(balances.rows[0]?.total_balance || 0);
  const payout = balanceDays * dailyRate;

  return {
    balance_days: balanceDays,
    daily_rate: parseFloat(dailyRate.toFixed(2)),
    payout: parseFloat(payout.toFixed(2)),
    description: `${balanceDays} days x R${dailyRate.toFixed(2)} daily rate`
  };
}

function calculateProRataBonus(annualSalary, joiningDate, terminationDate) {
  const start = new Date(joiningDate);
  const termDate = new Date(terminationDate);
  const yearStart = new Date(termDate.getFullYear(), 0, 1);
  const effectiveStart = start > yearStart ? start : yearStart;
  const diffMs = termDate - effectiveStart;
  const monthsWorked = Math.max(0, diffMs / (1000 * 60 * 60 * 24 * 30.44));
  const proRata = (annualSalary / 12) * (monthsWorked / 12);

  return {
    months_worked: parseFloat(monthsWorked.toFixed(1)),
    monthly_salary: parseFloat((annualSalary / 12).toFixed(2)),
    pro_rata_bonus: parseFloat(proRata.toFixed(2)),
    description: `13th cheque pro-rata: ${monthsWorked.toFixed(1)} months of current year`
  };
}

function generateUI8Form(employee, termination) {
  const lines = [];
  lines.push('UI-8 NOTIFICATION OF TERMINATION OF SERVICE');
  lines.push('=========================================');
  lines.push('');
  lines.push(`Employer Reference: ${employee.employee_code || ''}`);
  lines.push(`UIF Reference Number: `);
  lines.push('');
  lines.push('EMPLOYEE DETAILS');
  lines.push(`ID Number: ${employee.id_number || ''}`);
  lines.push(`Surname: ${employee.surname || ''}`);
  lines.push(`First Name: ${employee.first_name || ''}`);
  lines.push(`Date of Birth: ${employee.date_of_birth || ''}`);
  lines.push('');
  lines.push('EMPLOYMENT DETAILS');
  lines.push(`Date Employed: ${employee.joining_date || ''}`);
  lines.push(`Last Day of Work: ${termination.last_date_of_service || ''}`);
  lines.push(`Reason for Termination: ${termination.termination_type || ''}`);
  lines.push(`Monthly Remuneration: R${parseFloat(employee.annual_salary / 12).toFixed(2)}`);
  lines.push('');
  lines.push('DECLARATION');
  lines.push('I declare the above information is true and correct.');
  lines.push('');
  lines.push(`Date: ${new Date().toISOString().split('T')[0]}`);

  return lines.join('\n');
}

async function calculateFullTermination(employeeId, terminationDate, terminationType) {
  const emp = await dbQuery(
    `SELECT e.*, p.title AS position_title
     FROM employees e
     LEFT JOIN positions p ON e.position_id = p.id
     WHERE e.id = $1`,
    [employeeId]
  );
  if (emp.rows.length === 0) {
    throw Object.assign(new Error('Employee not found'), { statusCode: 404 });
  }
  const employee = emp.rows[0];
  const annualSalary = parseFloat(employee.annual_salary || 0);
  const monthlySalary = annualSalary / 12;

  const noticePeriod = calculateNoticePeriod(employee.joining_date, terminationDate);

  const noticePay = ['RETRENCHMENT', 'DISMISSAL', 'INCAPACITY'].includes(terminationType)
    ? parseFloat((monthlySalary / 4.33 * noticePeriod.weeks).toFixed(2))
    : 0;

  const severance = ['RETRENCHMENT', 'INCAPACITY'].includes(terminationType)
    ? calculateSeverancePay(employee.joining_date, terminationDate, monthlySalary)
    : { completed_years: 0, weekly_salary: 0, severance_pay: 0, description: 'Not applicable for this termination type' };

  const leavePayout = await calculateLeavePayout(employeeId);

  const proRataBonus = calculateProRataBonus(annualSalary, employee.joining_date, terminationDate);

  const totalPayout = noticePay + severance.severance_pay + leavePayout.payout + proRataBonus.pro_rata_bonus;

  return {
    employee: {
      id: employee.id,
      employee_code: employee.employee_code,
      name: `${employee.first_name} ${employee.surname}`,
      position: employee.position_title,
      department: employee.department_name,
      joining_date: employee.joining_date,
      annual_salary: annualSalary,
      monthly_salary: monthlySalary,
    },
    termination_type: terminationType,
    termination_date: terminationDate,
    notice_period: noticePeriod,
    notice_pay: noticePay,
    severance: severance,
    leave_payout: leavePayout,
    pro_rata_bonus: proRataBonus,
    total_payout: parseFloat(totalPayout.toFixed(2)),
  };
}

async function finaliseTermination(employeeId, terminationData, userId) {
  const emp = await dbQuery('SELECT * FROM employees WHERE id = $1 AND status = $2', [employeeId, 'ACTIVE']);
  if (emp.rows.length === 0) {
    throw Object.assign(new Error('Employee is not active or does not exist'), { statusCode: 400 });
  }
  const employee = emp.rows[0];

  const {
    termination_type, reason, last_date_of_service, position_status,
    notice_period_days, notice_pay, severance_pay, leave_payout, pro_rata_bonus,
    tax_directive_number, tax_directive_amount, lump_sum_amount,
    exit_interview_notes, re_employable, checklist
  } = terminationData;

  const termResult = await dbQuery(
    `INSERT INTO employee_terminations (
      employee_id, termination_type, reason, last_date_of_service, position_status, created_by,
      notice_period_days, notice_pay, severance_pay, leave_payout, pro_rata_bonus,
      tax_directive_number, tax_directive_amount, lump_sum_amount,
      exit_interview_notes, re_employable, checklist, finalised, finalised_by, finalised_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,TRUE,$6,NOW()) RETURNING *`,
    [
      employeeId, termination_type, reason, last_date_of_service,
      position_status || 'VACANT', userId,
      notice_period_days || 0, notice_pay || 0, severance_pay || 0,
      leave_payout || 0, pro_rata_bonus || 0,
      tax_directive_number || null, tax_directive_amount || 0,
      lump_sum_amount || 0, exit_interview_notes || null,
      re_employable !== false, JSON.stringify(checklist || [])
    ]
  );

  await dbQuery(
    `UPDATE employees SET status = 'TERMINATED', end_date = $1, updated_at = NOW(), updated_by = $2 WHERE id = $3`,
    [last_date_of_service, userId, employeeId]
  );

  if (employee.position_id) {
    await dbQuery(`UPDATE positions SET status = $1 WHERE id = $2`, [position_status || 'VACANT', employee.position_id]);
  }

  try {
    await dbQuery(
      `UPDATE employee_salary_transactions SET end_date = $1, updated_at = NOW(), updated_by = $2
       WHERE employee_id = $3 AND enabled = TRUE AND end_date > $1`,
      [last_date_of_service, userId, employeeId]
    );
  } catch (e) {
  }

  return termResult.rows[0];
}

module.exports = {
  calculateNoticePeriod,
  calculateSeverancePay,
  calculateLeavePayout,
  calculateProRataBonus,
  generateUI8Form,
  calculateFullTermination,
  finaliseTermination,
};
