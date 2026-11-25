/**
 * Leave Engine Tests
 * Calls actual exported functions from leave-engine.service.js
 * with the database module mocked to avoid real DB connections.
 */

jest.mock('../config/database', () => ({ query: jest.fn() }));

const db = require('../config/database');
const {
  calculateWorkingDays,
  checkSickLeaveCycle,
  calculateLeaveLiability,
  calculateBonusAccrual,
} = require('../services/leave-engine.service');

beforeEach(() => db.query.mockReset());

// ---------------------------------------------------------------------------
// calculateLeaveLiability — GRAP 25 leave liability
// ---------------------------------------------------------------------------
describe('calculateLeaveLiability()', () => {
  test('single employee: liability = annual/260 × leave days', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{
        id: 1, employee_code: 'E001', first_name: 'Jane', surname: 'Doe',
        annual_salary: '240000', total_leave_days: '10',
      }],
    });
    const result = await calculateLeaveLiability('2026-06-30');
    const expectedDailyRate = 240000 / 260;
    expect(result.total_liability).toBeCloseTo(expectedDailyRate * 10, 2);
    expect(result.details).toHaveLength(1);
    expect(result.details[0].daily_rate).toBeCloseTo(expectedDailyRate, 2);
    expect(result.employee_count).toBe(1);
  });

  test('zero employees: total_liability = 0', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const result = await calculateLeaveLiability('2026-06-30');
    expect(result.total_liability).toBe(0);
    expect(result.employee_count).toBe(0);
  });

  test('multiple employees: total_liability is sum of individual liabilities', async () => {
    db.query.mockResolvedValueOnce({
      rows: [
        { id: 1, employee_code: 'E001', first_name: 'A', surname: 'B', annual_salary: '120000', total_leave_days: '5' },
        { id: 2, employee_code: 'E002', first_name: 'C', surname: 'D', annual_salary: '240000', total_leave_days: '10' },
      ],
    });
    const result = await calculateLeaveLiability('2026-06-30');
    const liab1 = (120000 / 260) * 5;
    const liab2 = (240000 / 260) * 10;
    expect(result.total_liability).toBeCloseTo(liab1 + liab2, 1);
    expect(result.employee_count).toBe(2);
  });

  test('as_at_date is preserved in result', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const result = await calculateLeaveLiability('2026-03-31');
    expect(result.as_at_date).toBe('2026-03-31');
  });

  test('employee with null annual_salary: daily_rate = 0, no crash', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 3, employee_code: 'E003', first_name: 'X', surname: 'Y', annual_salary: null, total_leave_days: '5' }],
    });
    const result = await calculateLeaveLiability('2026-06-30');
    expect(result.details[0].daily_rate).toBe(0);
    expect(result.details[0].liability).toBe(0);
  });

  test('higher salary produces higher daily rate for same leave days', async () => {
    db.query.mockResolvedValueOnce({
      rows: [
        { id: 1, employee_code: 'E001', first_name: 'A', surname: 'B', annual_salary: '120000', total_leave_days: '10' },
        { id: 2, employee_code: 'E002', first_name: 'C', surname: 'D', annual_salary: '360000', total_leave_days: '10' },
      ],
    });
    const result = await calculateLeaveLiability('2026-06-30');
    expect(result.details[1].liability).toBeGreaterThan(result.details[0].liability);
  });
});

// ---------------------------------------------------------------------------
// calculateBonusAccrual — pro-rata bonus accrual (GRAP 25)
// ---------------------------------------------------------------------------
describe('calculateBonusAccrual()', () => {
  test('end of June (month 6): months_elapsed = 6, accrual = monthlyBonus × 6/12', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total_annual: '12000000' }] });
    const result = await calculateBonusAccrual('2026-06-30');
    expect(result.months_elapsed).toBe(6);
    const monthlyBonus = 12000000 / 12;
    const expected = monthlyBonus * (6 / 12);
    expect(result.accrual_amount).toBeCloseTo(expected, 0);
  });

  test('end of December (month 12): accrual equals full monthly bonus provision', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total_annual: '12000000' }] });
    const result = await calculateBonusAccrual('2026-12-31');
    expect(result.months_elapsed).toBe(12);
    const monthlyBonus = 12000000 / 12;
    expect(result.accrual_amount).toBeCloseTo(monthlyBonus, 0);
  });

  test('zero total annual salary (null): accrual = 0', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total_annual: null }] });
    const result = await calculateBonusAccrual('2026-06-30');
    expect(result.total_annual_salary).toBe(0);
    expect(result.accrual_amount).toBe(0);
  });

  test('September (month 9) has higher accrual than March (month 3)', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total_annual: '24000000' }] })
      .mockResolvedValueOnce({ rows: [{ total_annual: '24000000' }] });
    const march = await calculateBonusAccrual('2026-03-31');
    const sept = await calculateBonusAccrual('2026-09-30');
    expect(sept.accrual_amount).toBeGreaterThan(march.accrual_amount);
  });

  test('result contains all required GRAP 25 fields', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total_annual: '6000000' }] });
    const result = await calculateBonusAccrual('2026-06-30');
    expect(result).toHaveProperty('as_at_date');
    expect(result).toHaveProperty('total_annual_salary');
    expect(result).toHaveProperty('monthly_bonus_provision');
    expect(result).toHaveProperty('months_elapsed');
    expect(result).toHaveProperty('accrual_amount');
  });
});

// ---------------------------------------------------------------------------
// checkSickLeaveCycle — BCEA 36-month sick leave cycle
// ---------------------------------------------------------------------------
describe('checkSickLeaveCycle()', () => {
  function mockCycle(joiningDateStr, usedDays = 5) {
    db.query
      .mockResolvedValueOnce({ rows: [{ joining_date: joiningDateStr }] })
      .mockResolvedValueOnce({ rows: [{ id: 10 }] })
      .mockResolvedValueOnce({ rows: [{ used: String(usedDays) }] });
  }

  test('employee within first 36 months: cycleNumber = 1', async () => {
    mockCycle('2023-01-01');
    const result = await checkSickLeaveCycle(1, '2025-06-01');
    expect(result.cycleNumber).toBe(1);
  });

  test('employee more than 36 months since joining: cycleNumber = 2', async () => {
    mockCycle('2020-01-01');
    const result = await checkSickLeaveCycle(1, '2023-06-01');
    expect(result.cycleNumber).toBe(2);
  });

  test('after 6 months of employment: entitlement = 30 days (BCEA cap)', async () => {
    mockCycle('2023-01-01', 0);
    const result = await checkSickLeaveCycle(1, '2025-01-01');
    expect(result.entitlement).toBe(30);
    expect(result.inFirstSixMonths).toBe(false);
  });

  test('remaining = entitlement minus used days', async () => {
    mockCycle('2023-01-01', 12);
    const result = await checkSickLeaveCycle(1, '2025-06-01');
    expect(result.remaining).toBe(result.entitlement - 12);
  });

  test('remaining never goes below 0', async () => {
    mockCycle('2023-01-01', 35);
    const result = await checkSickLeaveCycle(1, '2025-06-01');
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  test('employee not found: returns error object', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const result = await checkSickLeaveCycle(9999, '2025-06-01');
    expect(result.error).toBeDefined();
  });

  test('sick leave type not found: returns error object', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ joining_date: '2023-01-01' }] })
      .mockResolvedValueOnce({ rows: [] });
    const result = await checkSickLeaveCycle(1, '2025-06-01');
    expect(result.error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// calculateWorkingDays — BCEA working day counting
// ---------------------------------------------------------------------------
describe('calculateWorkingDays()', () => {
  test('Mon–Fri with no holidays = 5 working days', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const result = await calculateWorkingDays('2026-05-04', '2026-05-08');
    expect(result).toBe(5);
  });

  test('Mon–Sun with no holidays = 5 working days (weekends excluded)', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const result = await calculateWorkingDays('2026-05-04', '2026-05-10');
    expect(result).toBe(5);
  });

  test('single Saturday = 0 working days', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const result = await calculateWorkingDays('2026-05-09', '2026-05-09');
    expect(result).toBe(0);
  });

  test('public holiday on Monday reduces count by 1', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ holiday_date: '2026-05-04' }] });
    const result = await calculateWorkingDays('2026-05-04', '2026-05-08');
    expect(result).toBe(4);
  });

  test('two-week Mon–Fri range with no holidays = 10 working days', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const result = await calculateWorkingDays('2026-05-04', '2026-05-17');
    expect(result).toBe(10);
  });
});
