const { query: dbQuery } = require('../config/database');

async function calculateOvertimeHourlyRate(employeeId) {
  const emp = await dbQuery('SELECT annual_salary, working_hours_per_day FROM employees WHERE id = $1', [employeeId]);
  if (emp.rows.length === 0) throw { status: 404, code: 'NOT_FOUND', message: 'Employee not found' };

  const workHoursPerDay = parseFloat(emp.rows[0].working_hours_per_day) || 8;
  const annualSalary = parseFloat(emp.rows[0].annual_salary) || 0;
  if (workHoursPerDay <= 0) throw { status: 400, code: 'VALIDATION', message: 'Employee working hours per day must be greater than 0' };
  if (annualSalary <= 0) throw { status: 400, code: 'VALIDATION', message: 'Employee annual salary must be greater than 0 to calculate overtime' };
  const monthlyWorkingHours = workHoursPerDay * (260 / 12);
  const hourlyRate = annualSalary / 12 / monthlyWorkingHours;

  return { hourlyRate, annualSalary, workHoursPerDay };
}

async function calculateOvertimeAmount(employeeId, salaryHeadId, hours) {
  const { hourlyRate } = await calculateOvertimeHourlyRate(employeeId);

  const sh = await dbQuery('SELECT overtime_multiplier_rate FROM salary_heads WHERE id = $1 AND is_overtime = TRUE', [salaryHeadId]);
  if (sh.rows.length === 0) throw { status: 400, code: 'VALIDATION', message: 'Invalid salary head - must be an overtime-enabled salary transaction' };

  const multiplier = parseFloat(sh.rows[0].overtime_multiplier_rate) || 1.5;
  const amount = parseFloat((hourlyRate * multiplier * hours).toFixed(2));

  return { multiplier, amount, hourlyRate };
}

async function resolveOvertimePeriod(overtimeDate) {
  const periodResult = await dbQuery(
    `SELECT pp.id AS period_id, pp.cycle_id
     FROM payroll_periods pp
     WHERE pp.start_date <= $1 AND pp.end_date >= $1
     ORDER BY pp.id LIMIT 1`,
    [overtimeDate]
  );
  if (periodResult.rows.length > 0) {
    return { period_id: periodResult.rows[0].period_id, cycle_id: periodResult.rows[0].cycle_id };
  }
  return { period_id: null, cycle_id: null };
}

module.exports = { calculateOvertimeHourlyRate, calculateOvertimeAmount, resolveOvertimePeriod };
