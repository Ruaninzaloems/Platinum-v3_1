const { query: dbQuery } = require('../config/database');

async function calculateWorkingDays(startDate, endDate, excludeHolidays = true, excludeWeekends = true) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let days = 0;
  const holidays = new Set();

  if (excludeHolidays) {
    const hResult = await dbQuery(
      `SELECT holiday_date FROM holidays WHERE holiday_date BETWEEN $1 AND $2`,
      [startDate, endDate]
    );
    for (const h of hResult.rows) {
      holidays.add(new Date(h.holiday_date).toISOString().split('T')[0]);
    }
  }

  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    const dateStr = current.toISOString().split('T')[0];
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidays.has(dateStr);

    if ((!excludeWeekends || !isWeekend) && (!excludeHolidays || !isHoliday)) {
      days++;
    }
    current.setDate(current.getDate() + 1);
  }
  return days;
}

async function checkSickLeaveCycle(employeeId, requestDate) {
  const emp = await dbQuery('SELECT joining_date FROM employees WHERE id = $1', [employeeId]);
  if (!emp.rows.length) return { error: 'Employee not found' };
  const joiningDate = new Date(emp.rows[0].joining_date);
  const reqDate = new Date(requestDate || new Date());

  const monthsSinceJoin = (reqDate.getFullYear() - joiningDate.getFullYear()) * 12 + (reqDate.getMonth() - joiningDate.getMonth());
  const cycleNumber = Math.floor(monthsSinceJoin / 36);
  const cycleStart = new Date(joiningDate);
  cycleStart.setMonth(cycleStart.getMonth() + cycleNumber * 36);
  const cycleEnd = new Date(cycleStart);
  cycleEnd.setMonth(cycleEnd.getMonth() + 36);
  cycleEnd.setDate(cycleEnd.getDate() - 1);

  const sickType = await dbQuery(`SELECT id FROM leave_types WHERE name ILIKE '%sick%' LIMIT 1`);
  if (!sickType.rows.length) return { error: 'Sick leave type not found' };

  const used = await dbQuery(
    `SELECT COALESCE(SUM(days_taken), 0) AS used FROM leave_transactions
     WHERE employee_id = $1 AND leave_type_id = $2 AND status = 'APPROVED'
     AND start_date >= $3 AND start_date <= $4`,
    [employeeId, sickType.rows[0].id, cycleStart.toISOString(), cycleEnd.toISOString()]
  );

  const entitlement = monthsSinceJoin < 6 ? Math.floor(monthsSinceJoin) : 30;
  const usedDays = parseFloat(used.rows[0].used);

  return {
    cycleNumber: cycleNumber + 1,
    cycleStart: cycleStart.toISOString().split('T')[0],
    cycleEnd: cycleEnd.toISOString().split('T')[0],
    entitlement,
    used: usedDays,
    remaining: Math.max(0, entitlement - usedDays),
    inFirstSixMonths: monthsSinceJoin < 6
  };
}

async function accrueLeave(employeeId, leaveTypeId, periodEndDate) {
  const policy = await dbQuery(
    `SELECT * FROM leave_policies WHERE leave_type_id = $1 LIMIT 1`,
    [leaveTypeId]
  );
  if (!policy.rows.length) return { accrued: 0, message: 'No policy found' };
  const p = policy.rows[0];

  let accrualAmount = 0;
  if (p.accrual_method === 'ANNUAL') {
    accrualAmount = parseFloat(p.accrual_amount) / 12;
  } else if (p.accrual_method === 'MONTHLY') {
    accrualAmount = parseFloat(p.accrual_amount);
  } else if (p.accrual_method === 'CYCLE') {
    accrualAmount = parseFloat(p.cycle_entitlement || p.accrual_amount) / (p.cycle_months || 36);
  }

  const currentBalance = await dbQuery(
    `SELECT balance FROM employee_leave_balances WHERE employee_id = $1 AND leave_type_id = $2`,
    [employeeId, leaveTypeId]
  );

  const current = currentBalance.rows.length ? parseFloat(currentBalance.rows[0].balance) : 0;
  const maxBalance = parseFloat(p.max_balance || 999);
  const newBalance = Math.min(current + accrualAmount, maxBalance);
  const actualAccrual = parseFloat((newBalance - current).toFixed(2));

  if (currentBalance.rows.length) {
    await dbQuery(
      `UPDATE employee_leave_balances SET balance = $3, last_accrual_date = $4 WHERE employee_id = $1 AND leave_type_id = $2`,
      [employeeId, leaveTypeId, newBalance, periodEndDate]
    );
  } else {
    await dbQuery(
      `INSERT INTO employee_leave_balances (employee_id, leave_type_id, balance, last_accrual_date) VALUES ($1, $2, $3, $4)`,
      [employeeId, leaveTypeId, newBalance, periodEndDate]
    );
  }

  return { accrued: actualAccrual, newBalance, maxBalance };
}

async function calculateLeaveBalance(employeeId, leaveTypeId) {
  const bal = await dbQuery(
    `SELECT balance FROM employee_leave_balances WHERE employee_id = $1 AND leave_type_id = $2`,
    [employeeId, leaveTypeId]
  );
  return bal.rows.length ? parseFloat(bal.rows[0].balance) : 0;
}

async function validateLeaveRequest(employeeId, leaveTypeId, startDate, endDate) {
  const errors = [];
  const policy = await dbQuery(`SELECT * FROM leave_policies WHERE leave_type_id = $1 LIMIT 1`, [leaveTypeId]);
  const leaveType = await dbQuery(`SELECT * FROM leave_types WHERE id = $1`, [leaveTypeId]);
  const emp = await dbQuery(`SELECT * FROM employees WHERE id = $1`, [employeeId]);

  if (!emp.rows.length) return { valid: false, errors: ['Employee not found'] };
  if (!leaveType.rows.length) return { valid: false, errors: ['Leave type not found'] };

  const p = policy.rows.length ? policy.rows[0] : null;
  const employee = emp.rows[0];
  const typeName = leaveType.rows[0].name;

  if (p && p.gender_restriction && employee.gender !== p.gender_restriction) {
    errors.push(`${typeName} is restricted to ${p.gender_restriction} employees`);
  }

  if (p && p.min_service_months > 0) {
    const joinDate = new Date(employee.joining_date);
    const months = (new Date().getFullYear() - joinDate.getFullYear()) * 12 + (new Date().getMonth() - joinDate.getMonth());
    if (months < p.min_service_months) {
      errors.push(`Minimum ${p.min_service_months} months service required for ${typeName}`);
    }
  }

  const excludeH = p ? p.exclude_holidays : true;
  const excludeW = p ? p.exclude_weekends : true;
  const requestedDays = await calculateWorkingDays(startDate, endDate, excludeH, excludeW);

  if (p && p.consecutive_only) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const maxDays = (p.max_consecutive_months || 4) * 30;
    if (totalDays > maxDays) {
      errors.push(`${typeName} maximum is ${p.max_consecutive_months} consecutive months (${maxDays} days)`);
    }
  }

  const balance = await calculateLeaveBalance(employeeId, leaveTypeId);
  if (balance < requestedDays && typeName.toLowerCase().indexOf('unpaid') === -1) {
    errors.push(`Insufficient balance: ${balance} days available, ${requestedDays} days requested`);
  }

  if (typeName.toLowerCase().includes('sick')) {
    const cycle = await checkSickLeaveCycle(employeeId, startDate);
    if (cycle.remaining < requestedDays) {
      errors.push(`Sick leave cycle: ${cycle.remaining} days remaining in current 36-month cycle`);
    }
    if (p && p.requires_medical_cert_after_days && requestedDays > p.requires_medical_cert_after_days) {
      errors.push(`Medical certificate required for sick leave exceeding ${p.requires_medical_cert_after_days} days`);
    }
  }

  return { valid: errors.length === 0, errors, requestedDays, balance };
}

async function calculateLeaveLiability(asAtDate) {
  const result = await dbQuery(
    `SELECT e.id, e.employee_code, e.first_name, e.surname, e.annual_salary,
            COALESCE(SUM(lb.balance), 0) AS total_leave_days
     FROM employees e
     LEFT JOIN employee_leave_balances lb ON lb.employee_id = e.id
     WHERE e.status = 'ACTIVE' AND e.enabled = TRUE
     GROUP BY e.id, e.employee_code, e.first_name, e.surname, e.annual_salary
     HAVING COALESCE(SUM(lb.balance), 0) > 0`
  );

  let totalLiability = 0;
  const details = [];
  for (const emp of result.rows) {
    const dailyRate = parseFloat(emp.annual_salary || 0) / 260;
    const days = parseFloat(emp.total_leave_days);
    const liability = parseFloat((dailyRate * days).toFixed(2));
    totalLiability += liability;
    details.push({
      employee_id: emp.id,
      employee_code: emp.employee_code,
      name: `${emp.first_name} ${emp.surname}`,
      leave_days: days,
      daily_rate: parseFloat(dailyRate.toFixed(2)),
      liability
    });
  }

  return {
    as_at_date: asAtDate,
    total_liability: parseFloat(totalLiability.toFixed(2)),
    employee_count: details.length,
    details
  };
}

async function calculateBonusAccrual(asAtDate) {
  const date = new Date(asAtDate);
  const yearStart = new Date(date.getFullYear(), 0, 1);
  const monthsElapsed = (date.getFullYear() - yearStart.getFullYear()) * 12 + (date.getMonth() - yearStart.getMonth()) + 1;
  const fraction = monthsElapsed / 12;

  const result = await dbQuery(
    `SELECT SUM(annual_salary) AS total_annual FROM employees WHERE status = 'ACTIVE' AND enabled = TRUE`
  );
  const totalAnnual = parseFloat(result.rows[0]?.total_annual || 0);
  const totalBonus = totalAnnual / 12;
  const accrual = parseFloat((totalBonus * fraction).toFixed(2));

  return {
    as_at_date: asAtDate,
    total_annual_salary: totalAnnual,
    monthly_bonus_provision: parseFloat((totalBonus / 12).toFixed(2)),
    months_elapsed: monthsElapsed,
    accrual_amount: accrual
  };
}

module.exports = {
  calculateWorkingDays,
  checkSickLeaveCycle,
  accrueLeave,
  calculateLeaveBalance,
  validateLeaveRequest,
  calculateLeaveLiability,
  calculateBonusAccrual
};
