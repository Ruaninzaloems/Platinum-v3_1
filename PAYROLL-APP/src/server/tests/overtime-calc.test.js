/**
 * Overtime Calculation Tests
 * Calls the actual calculateOvertimeAmount / calculateOvertimeHourlyRate
 * functions exported by overtime-calc.service.js.
 * DB calls are mocked so no real connection is needed.
 */

jest.mock('../config/database', () => ({ query: jest.fn() }));

const db = require('../config/database');
const { calculateOvertimeAmount, calculateOvertimeHourlyRate, resolveOvertimePeriod } = require('../services/overtime-calc.service');

beforeEach(() => db.query.mockReset());

// ---------------------------------------------------------------------------
// calculateOvertimeHourlyRate
// ---------------------------------------------------------------------------
describe('calculateOvertimeHourlyRate()', () => {
  test('returns hourlyRate, annualSalary, workHoursPerDay for valid employee', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ annual_salary: '360000', working_hours_per_day: '8' }],
    });
    const result = await calculateOvertimeHourlyRate(1);
    const expectedMonthlyHours = 8 * (260 / 12);
    const expectedHourlyRate = (360000 / 12) / expectedMonthlyHours;
    expect(result.hourlyRate).toBeCloseTo(expectedHourlyRate, 4);
    expect(result.annualSalary).toBe(360000);
    expect(result.workHoursPerDay).toBe(8);
  });

  test('throws 404 when employee not found', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(calculateOvertimeHourlyRate(9999)).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
  });

  test('throws 400 when annual salary is 0', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ annual_salary: '0', working_hours_per_day: '8' }],
    });
    await expect(calculateOvertimeHourlyRate(1)).rejects.toMatchObject({ status: 400, code: 'VALIDATION' });
  });

  test('working_hours_per_day defaults to 8 when null/missing', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ annual_salary: '240000', working_hours_per_day: null }],
    });
    const result = await calculateOvertimeHourlyRate(1);
    expect(result.workHoursPerDay).toBe(8);
  });
});

// ---------------------------------------------------------------------------
// calculateOvertimeAmount — formula: (annual/12)/(hours×260/12) × multiplier × hours
// ---------------------------------------------------------------------------
describe('calculateOvertimeAmount()', () => {
  function mockEmpAndHead(annualSalary, hoursPerDay, multiplier) {
    db.query
      .mockResolvedValueOnce({
        rows: [{ annual_salary: String(annualSalary), working_hours_per_day: String(hoursPerDay) }],
      })
      .mockResolvedValueOnce({
        rows: [{ overtime_multiplier_rate: String(multiplier) }],
      });
  }

  test('OT_1_5: 1.5× multiplier for 10 hours produces positive amount', async () => {
    mockEmpAndHead(360000, 8, 1.5);
    const result = await calculateOvertimeAmount(1, 10, 10);
    expect(result.amount).toBeGreaterThan(0);
    expect(result.multiplier).toBe(1.5);
  });

  test('OT_2_0 amount is exactly (4/3) × OT_1_5 amount for same hours', async () => {
    mockEmpAndHead(360000, 8, 1.5);
    const r15 = await calculateOvertimeAmount(1, 10, 10);
    mockEmpAndHead(360000, 8, 2.0);
    const r20 = await calculateOvertimeAmount(1, 10, 10);
    expect(r20.amount / r15.amount).toBeCloseTo(2.0 / 1.5, 4);
  });

  test('hourly rate formula: (annual/12) / (hoursPerDay × 260/12)', async () => {
    mockEmpAndHead(360000, 8, 1.0);
    const result = await calculateOvertimeAmount(1, 99, 1);
    const expectedMonthlyHours = 8 * (260 / 12);
    const expectedHourlyRate = (360000 / 12) / expectedMonthlyHours;
    expect(result.hourlyRate).toBeCloseTo(expectedHourlyRate, 4);
  });

  test('fractional hours (0.5h): amount is half of 1h amount', async () => {
    mockEmpAndHead(240000, 8, 1.5);
    const one = await calculateOvertimeAmount(1, 10, 1);
    mockEmpAndHead(240000, 8, 1.5);
    const half = await calculateOvertimeAmount(1, 10, 0.5);
    expect(half.amount).toBeCloseTo(one.amount / 2, 2);
  });

  test('fewer working hours per day → higher hourly rate (same annual)', async () => {
    mockEmpAndHead(240000, 8, 1.5);
    const rate8h = await calculateOvertimeAmount(1, 10, 1);
    mockEmpAndHead(240000, 9, 1.5);
    const rate9h = await calculateOvertimeAmount(1, 10, 1);
    expect(rate8h.hourlyRate).toBeGreaterThan(rate9h.hourlyRate);
  });

  test('throws 400 when salary head is not an overtime head', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [{ annual_salary: '240000', working_hours_per_day: '8' }],
      })
      .mockResolvedValueOnce({ rows: [] }); // head not found / not overtime
    await expect(calculateOvertimeAmount(1, 10, 10)).rejects.toMatchObject({ status: 400, code: 'VALIDATION' });
  });

  test('IRP5 code 3607 requirement: OT_1_5 multiplier is 1.5', async () => {
    mockEmpAndHead(240000, 8, 1.5);
    const result = await calculateOvertimeAmount(1, 10, 8);
    expect(result.multiplier).toBe(1.5);
  });

  test('OT_2_0 multiplier is 2.0 (public holiday/Sunday rate)', async () => {
    mockEmpAndHead(240000, 8, 2.0);
    const result = await calculateOvertimeAmount(1, 10, 8);
    expect(result.multiplier).toBe(2.0);
  });
});

// ---------------------------------------------------------------------------
// resolveOvertimePeriod — maps overtime date to a payroll period
// ---------------------------------------------------------------------------
describe('resolveOvertimePeriod()', () => {
  test('returns period_id and cycle_id when period exists for date', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ period_id: 42, cycle_id: 3 }],
    });
    const result = await resolveOvertimePeriod('2026-05-15');
    expect(result.period_id).toBe(42);
    expect(result.cycle_id).toBe(3);
  });

  test('returns null period_id and cycle_id when no period covers the date', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const result = await resolveOvertimePeriod('2026-05-15');
    expect(result.period_id).toBeNull();
    expect(result.cycle_id).toBeNull();
  });
});
