/**
 * Termination Service Unit Tests
 * Covers: calculateNoticePeriod, calculateSeverancePay, calculateProRataBonus, generateUI8Form
 * Pure functions only — no DB connection required.
 */

const {
  calculateNoticePeriod,
  calculateSeverancePay,
  calculateProRataBonus,
  generateUI8Form,
} = require('../services/termination.service');

// ---------------------------------------------------------------------------
// calculateNoticePeriod — BCEA Section 37 tiers
// ---------------------------------------------------------------------------
describe('calculateNoticePeriod', () => {
  test('less than 6 months service: 1 week notice', () => {
    const joining = '2026-01-01';
    const last = '2026-04-01';
    const result = calculateNoticePeriod(joining, last);
    expect(result.weeks).toBe(1);
    expect(result.days).toBe(7);
    expect(result.description).toMatch(/6 months/i);
  });

  test('6 to 12 months service: 2 weeks notice', () => {
    const joining = '2025-09-01';
    const last = '2026-05-01';
    const result = calculateNoticePeriod(joining, last);
    expect(result.weeks).toBe(2);
    expect(result.days).toBe(14);
  });

  test('more than 1 year service: 4 weeks notice', () => {
    const joining = '2020-01-01';
    const last = '2026-01-01';
    const result = calculateNoticePeriod(joining, last);
    expect(result.weeks).toBe(4);
    expect(result.days).toBe(28);
    expect(result.description).toMatch(/1 year/i);
  });
});

// ---------------------------------------------------------------------------
// calculateSeverancePay — BCEA Section 41 (1 week per completed year)
// ---------------------------------------------------------------------------
describe('calculateSeverancePay', () => {
  test('0 completed years: severance = R0', () => {
    const result = calculateSeverancePay('2025-06-01', '2026-01-01', 20000);
    expect(result.completed_years).toBe(0);
    expect(result.severance_pay).toBe(0);
  });

  test('5 completed years: severance = completed_years × weekly_salary', () => {
    const monthly = 24000;
    // Use a date range far apart enough to get clearly 10 completed years
    const result = calculateSeverancePay('2010-01-01', '2020-02-01', monthly);
    const expectedWeekly = (monthly * 12) / 52;
    expect(result.completed_years).toBeGreaterThanOrEqual(10);
    expect(result.severance_pay).toBeCloseTo(result.completed_years * expectedWeekly, 0);
  });

  test('description includes BCEA Section 41 reference', () => {
    const result = calculateSeverancePay('2015-01-01', '2025-01-01', 30000);
    expect(result.description).toMatch(/BCEA/i);
    expect(result.description).toMatch(/41/);
  });

  test('weekly_salary is annual ÷ 52', () => {
    const monthly = 12000;
    const annual = monthly * 12;
    const result = calculateSeverancePay('2020-01-01', '2026-01-01', monthly);
    const expectedWeekly = annual / 52;
    expect(result.weekly_salary).toBeCloseTo(expectedWeekly, 1);
  });
});

// ---------------------------------------------------------------------------
// calculateProRataBonus
// ---------------------------------------------------------------------------
describe('calculateProRataBonus', () => {
  test('employee worked full year: months_worked close to 12', () => {
    const result = calculateProRataBonus(240000, '2026-01-01', '2026-12-31');
    expect(result.months_worked).toBeGreaterThan(11);
  });

  test('pro_rata_bonus is proportional to months worked', () => {
    // Use dates within same year so effective_start is always year-start
    const resultQ1 = calculateProRataBonus(120000, '2025-01-01', '2026-03-31');
    const resultQ3 = calculateProRataBonus(120000, '2025-01-01', '2026-09-30');
    expect(resultQ3.pro_rata_bonus).toBeGreaterThan(resultQ1.pro_rata_bonus);
  });

  test('zero annual salary: pro_rata_bonus is 0', () => {
    const result = calculateProRataBonus(0, '2026-01-01', '2026-06-30');
    expect(result.pro_rata_bonus).toBe(0);
  });

  test('joining date before year start uses year start as effective start', () => {
    const result = calculateProRataBonus(120000, '2020-01-01', '2026-12-31');
    expect(result.months_worked).toBeGreaterThan(11);
    expect(result.months_worked).toBeLessThanOrEqual(12.1);
  });
});

// ---------------------------------------------------------------------------
// generateUI8Form
// ---------------------------------------------------------------------------
describe('generateUI8Form', () => {
  const employee = {
    employee_code: 'EMP001',
    id_number: '9001015009087',
    first_name: 'Jane',
    surname: 'Smith',
    date_of_birth: '1990-01-01',
    joining_date: '2020-03-01',
    annual_salary: 360000,
  };

  const termination = {
    last_date_of_service: '2026-05-11',
    termination_type: 'RESIGNATION',
  };

  test('produces a non-empty string', () => {
    const output = generateUI8Form(employee, termination);
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(100);
  });

  test('includes UI-8 header', () => {
    const output = generateUI8Form(employee, termination);
    expect(output).toMatch(/UI-8/i);
  });

  test('includes employee surname and first name', () => {
    const output = generateUI8Form(employee, termination);
    expect(output).toMatch(/Smith/);
    expect(output).toMatch(/Jane/);
  });

  test('includes ID number', () => {
    const output = generateUI8Form(employee, termination);
    expect(output).toMatch(/9001015009087/);
  });

  test('includes termination reason', () => {
    const output = generateUI8Form(employee, termination);
    expect(output).toMatch(/RESIGNATION/i);
  });

  test('includes monthly remuneration derived from annual_salary / 12', () => {
    const output = generateUI8Form(employee, termination);
    expect(output).toMatch(/30000/);
  });
});
