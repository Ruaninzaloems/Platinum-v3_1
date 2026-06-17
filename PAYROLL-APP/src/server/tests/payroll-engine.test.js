/**
 * Payroll Engine Unit Tests
 * Covers: evaluateFormulaV2, resolveMOCRule, applyMOCRounding, resolveMonthlyBasic,
 *         calculatePAYE, calculateUIF, calculateSDL, calculateETI
 *
 * These functions are pure / near-pure and do NOT require a database connection.
 */

const {
  evaluateFormulaV2,
  resolveMOCRule,
  applyMOCRounding,
  resolveMonthlyBasic,
  calculatePAYE,
  calculateUIF,
  calculateSDL,
  calculateETI,
  getAge,
} = require('../services/payroll-engine');

// ---------------------------------------------------------------------------
// evaluateFormulaV2
// ---------------------------------------------------------------------------
describe('evaluateFormulaV2', () => {
  const vars = {
    BasicSalary: 30000,
    AnnualSalary: 360000,
    captured_amount: 500,
  };

  test('returns 0 and error for empty/null formula', () => {
    expect(evaluateFormulaV2('', vars, {}).error).toBeDefined();
    expect(evaluateFormulaV2(null, vars, {}).error).toBeDefined();
  });

  test('basic arithmetic — addition', () => {
    const r = evaluateFormulaV2('1000 + 500', vars, {});
    expect(r.error).toBeUndefined();
    expect(r.value).toBe(1500);
  });

  test('basic arithmetic — multiplication and division', () => {
    const r = evaluateFormulaV2('BasicSalary * 0.05', vars, {});
    expect(r.error).toBeUndefined();
    expect(r.value).toBeCloseTo(1500);
  });

  test('IF function — true branch', () => {
    const r = evaluateFormulaV2('IF(BasicSalary > 10000, 1000, 200)', vars, {});
    expect(r.error).toBeUndefined();
    expect(r.value).toBe(1000);
  });

  test('IF function — false branch', () => {
    const r = evaluateFormulaV2('IF(BasicSalary > 100000, 1000, 200)', vars, {});
    expect(r.error).toBeUndefined();
    expect(r.value).toBe(200);
  });

  test('MIN function', () => {
    const r = evaluateFormulaV2('MIN(BasicSalary, 10000)', vars, {});
    expect(r.value).toBe(10000);
  });

  test('MAX function', () => {
    const r = evaluateFormulaV2('MAX(BasicSalary, 10000)', vars, {});
    expect(r.value).toBe(30000);
  });

  test('ROUND function to 2 decimal places', () => {
    const r = evaluateFormulaV2('ROUND(1234.5678, 2)', vars, {});
    expect(r.value).toBe(1234.57);
  });

  test('ABS function returns absolute value', () => {
    const r = evaluateFormulaV2('ABS(0 - BasicSalary)', vars, {});
    expect(r.value).toBe(30000);
  });

  test('[CODE] cross-reference resolves from codeResults', () => {
    const codeResults = { BONUS: 5000 };
    const r = evaluateFormulaV2('[BONUS] * 0.1', vars, codeResults);
    expect(r.error).toBeUndefined();
    expect(r.value).toBeCloseTo(500);
  });

  test('[CODE] resolves to 0 when code not in codeResults', () => {
    const r = evaluateFormulaV2('[MISSING_CODE] + 100', vars, {});
    expect(r.value).toBeCloseTo(100);
  });

  test('nested IF with comparison operators', () => {
    const r = evaluateFormulaV2('IF(BasicSalary >= 30000, IF(AnnualSalary > 400000, 9999, 500), 0)', vars, {});
    expect(r.value).toBe(500);
  });

  test('captured_amount variable is accessible', () => {
    const r = evaluateFormulaV2('captured_amount * 2', vars, {});
    expect(r.value).toBe(1000);
  });

  test('formula exceeding 2000 chars returns error', () => {
    const longFormula = 'BasicSalary + '.repeat(200);
    const r = evaluateFormulaV2(longFormula, vars, {});
    expect(r.error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// resolveMOCRule — specificity scoring
// ---------------------------------------------------------------------------
describe('resolveMOCRule', () => {
  const employee = {
    condition_of_service_id: 1,
    employee_type_id: 2,
    employee_subtype_id: 3,
  };

  const today = new Date().toISOString().split('T')[0];

  const wildcardRule = {
    id: 1,
    condition_of_service_id: null,
    employee_type_id: null,
    employee_subtype_id: null,
    priority: 0,
    formula: 'BasicSalary * 0.01',
    enabled: true,
    start_date: null,
    end_date: null,
  };

  const typeRule = {
    id: 2,
    condition_of_service_id: null,
    employee_type_id: 2,
    employee_subtype_id: null,
    priority: 10,
    formula: 'BasicSalary * 0.02',
    enabled: true,
    start_date: null,
    end_date: null,
  };

  const subtypeRule = {
    id: 3,
    condition_of_service_id: null,
    employee_type_id: 2,
    employee_subtype_id: 3,
    priority: 20,
    formula: 'BasicSalary * 0.03',
    enabled: true,
    start_date: null,
    end_date: null,
  };

  const cosRule = {
    id: 4,
    condition_of_service_id: 1,
    employee_type_id: null,
    employee_subtype_id: null,
    priority: 5,
    formula: 'BasicSalary * 0.04',
    enabled: true,
    start_date: null,
    end_date: null,
  };

  test('returns null for empty rules array', () => {
    expect(resolveMOCRule([], employee, today)).toBeNull();
  });

  test('wildcard rule matches any employee', () => {
    const r = resolveMOCRule([wildcardRule], employee, today);
    expect(r).not.toBeNull();
    expect(r.id).toBe(1);
  });

  test('type-specific rule wins over wildcard', () => {
    const r = resolveMOCRule([wildcardRule, typeRule], employee, today);
    expect(r.id).toBe(2);
  });

  test('subtype rule wins over type rule (highest specificity)', () => {
    const r = resolveMOCRule([wildcardRule, typeRule, subtypeRule], employee, today);
    expect(r.id).toBe(3);
  });

  test('CoS-only rule beats wildcard', () => {
    const r = resolveMOCRule([wildcardRule, cosRule], employee, today);
    expect(r.id).toBe(4);
  });

  test('rule with wrong type_id is excluded', () => {
    const wrongTypeRule = { ...typeRule, employee_type_id: 99 };
    const r = resolveMOCRule([wildcardRule, wrongTypeRule], employee, today);
    expect(r.id).toBe(1);
  });

  test('disabled rule is excluded', () => {
    const disabledRule = { ...subtypeRule, enabled: false };
    const r = resolveMOCRule([wildcardRule, disabledRule], employee, today);
    expect(r.id).toBe(1);
  });

  test('future start_date rule is excluded', () => {
    const futureRule = { ...subtypeRule, start_date: '2099-01-01' };
    const r = resolveMOCRule([wildcardRule, futureRule], employee, today);
    expect(r.id).toBe(1);
  });

  test('expired end_date rule is excluded', () => {
    const expiredRule = { ...subtypeRule, end_date: '2000-01-01' };
    const r = resolveMOCRule([wildcardRule, expiredRule], employee, today);
    expect(r.id).toBe(1);
  });

  test('priority tie-breaking: higher priority wins', () => {
    const lowPriority = { ...wildcardRule, id: 10, priority: 1 };
    const highPriority = { ...wildcardRule, id: 11, priority: 999 };
    const r = resolveMOCRule([lowPriority, highPriority], employee, today);
    expect(r.id).toBe(11);
  });
});

// ---------------------------------------------------------------------------
// applyMOCRounding
// ---------------------------------------------------------------------------
describe('applyMOCRounding', () => {
  test('default ROUND method rounds to 2 decimal places', () => {
    const rule = { round_method: 'ROUND', round_digits: 2 };
    expect(applyMOCRounding(1234.5678, rule)).toBe(1234.57);
  });

  test('FLOOR truncates downward', () => {
    const rule = { round_method: 'FLOOR', round_digits: 2 };
    expect(applyMOCRounding(1234.5699, rule)).toBe(1234.56);
  });

  test('CEIL rounds upward', () => {
    const rule = { round_method: 'CEIL', round_digits: 2 };
    expect(applyMOCRounding(1234.5601, rule)).toBe(1234.57);
  });

  test('NONE method returns value unchanged', () => {
    const rule = { round_method: 'NONE', round_digits: 2 };
    const v = 1234.56789;
    expect(applyMOCRounding(v, rule)).toBe(v);
  });

  test('null rule defaults to ROUND 2dp', () => {
    expect(applyMOCRounding(100.555, null)).toBe(100.56);
  });

  test('rounding to 0 digits gives whole number', () => {
    const rule = { round_method: 'ROUND', round_digits: 0 };
    expect(applyMOCRounding(123.7, rule)).toBe(124);
  });
});

// ---------------------------------------------------------------------------
// resolveMonthlyBasic — locked business rules
// ---------------------------------------------------------------------------
describe('resolveMonthlyBasic — Task Grade, Rate Based, Upper Limit paths', () => {
  const periodsPerYear = 12;

  test('Task Grade: returns monthly_salary when > 0', () => {
    const emp = { task_grade_id: 5, monthly_salary: 25000, annual_salary: 300000 };
    expect(resolveMonthlyBasic(emp, periodsPerYear)).toBe(25000);
  });

  test('Task Grade: throws error when monthly_salary is 0', () => {
    const emp = { task_grade_id: 5, monthly_salary: 0, annual_salary: 300000 };
    expect(() => resolveMonthlyBasic(emp, periodsPerYear)).toThrow();
  });

  test('Task Grade: throws error when monthly_salary is null/undefined', () => {
    const emp = { task_grade_id: 5, monthly_salary: null, annual_salary: 300000 };
    expect(() => resolveMonthlyBasic(emp, periodsPerYear)).toThrow();
  });

  test('Task Grade via jp_task_grade_id: same enforcement', () => {
    const emp = { jp_task_grade_id: 7, monthly_salary: 0, annual_salary: 0 };
    expect(() => resolveMonthlyBasic(emp, periodsPerYear)).toThrow();
  });

  test('Rate Based RATE_PER_HOUR: returns 0', () => {
    const emp = { salary_based_on: 'RATE_PER_HOUR', monthly_salary: 0, annual_salary: 0 };
    expect(resolveMonthlyBasic(emp, periodsPerYear)).toBe(0);
  });

  test('Rate Based RATE_PER_DAY: returns 0', () => {
    const emp = { salary_based_on: 'RATE_PER_DAY', monthly_salary: 0, annual_salary: 0 };
    expect(resolveMonthlyBasic(emp, periodsPerYear)).toBe(0);
  });

  test('Rate Based CAPTURED_VALUE: returns 0', () => {
    const emp = { salary_based_on: 'CAPTURED_VALUE', monthly_salary: 0, annual_salary: 0 };
    expect(resolveMonthlyBasic(emp, periodsPerYear)).toBe(0);
  });

  test('Rate Based FIXED_RATE: returns wage_rate', () => {
    const emp = { salary_based_on: 'FIXED_RATE', wage_rate: 150, monthly_salary: 0, annual_salary: 0 };
    expect(resolveMonthlyBasic(emp, periodsPerYear)).toBe(150);
  });

  test('Standard employee: returns monthly_salary when set', () => {
    const emp = { monthly_salary: 20000, annual_salary: 240000 };
    expect(resolveMonthlyBasic(emp, periodsPerYear)).toBe(20000);
  });

  test('Standard employee: falls back to annual_salary / periodsPerYear', () => {
    const emp = { monthly_salary: 0, annual_salary: 120000 };
    expect(resolveMonthlyBasic(emp, periodsPerYear)).toBeCloseTo(10000, 1);
  });

  test('Standard employee: throws when both monthly and annual salary are 0', () => {
    const emp = { monthly_salary: 0, annual_salary: 0 };
    expect(() => resolveMonthlyBasic(emp, periodsPerYear)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// calculatePAYE — 2026/2027 SARS tax table simulation
// ---------------------------------------------------------------------------
describe('calculatePAYE', () => {
  const TAX_TABLES_2027 = {
    brackets: [
      { min_income: 0, max_income: 237100, base_tax: 0, rate: 18 },
      { min_income: 237100, max_income: 370500, base_tax: 42678, rate: 26 },
      { min_income: 370500, max_income: 512800, base_tax: 77362, rate: 31 },
      { min_income: 512800, max_income: 673000, base_tax: 121475, rate: 36 },
      { min_income: 673000, max_income: 857900, base_tax: 179147, rate: 39 },
      { min_income: 857900, max_income: 1817000, base_tax: 251258, rate: 41 },
      { min_income: 1817000, max_income: Infinity, base_tax: 644489, rate: 45 },
    ],
    rebates: [
      { rebate_type: 'PRIMARY', amount: 17235, age_threshold: 0 },
      { rebate_type: 'SECONDARY', amount: 9444, age_threshold: 65 },
      { rebate_type: 'TERTIARY', amount: 3145, age_threshold: 75 },
    ],
    thresholds: [
      { amount: 95750, age_threshold: 0, threshold_type: 'PRIMARY' },
      { amount: 148217, age_threshold: 65, threshold_type: 'SECONDARY' },
      { amount: 165689, age_threshold: 75, threshold_type: 'TERTIARY' },
    ],
    medicalCredits: { main_member: 364, first_dependant: 364, additional_dependant: 246 },
  };

  test('income below threshold: PAYE = 0 (under 65)', () => {
    const paye = calculatePAYE(90000, 30, TAX_TABLES_2027);
    expect(paye).toBe(0);
  });

  test('income above threshold: PAYE > 0', () => {
    const paye = calculatePAYE(300000, 30, TAX_TABLES_2027);
    expect(paye).toBeGreaterThan(0);
  });

  test('primary rebate applied to reduce PAYE', () => {
    const payeWithRebate = calculatePAYE(200000, 30, TAX_TABLES_2027);
    const tablesNoRebate = { ...TAX_TABLES_2027, rebates: [] };
    const payeNoRebate = calculatePAYE(200000, 30, tablesNoRebate);
    expect(payeWithRebate).toBeLessThan(payeNoRebate);
  });

  test('secondary rebate applies for age >= 65', () => {
    const payeYoung = calculatePAYE(300000, 30, TAX_TABLES_2027);
    const payeOld = calculatePAYE(300000, 70, TAX_TABLES_2027);
    expect(payeOld).toBeLessThan(payeYoung);
  });

  test('tertiary rebate applies for age >= 75', () => {
    const paye65 = calculatePAYE(300000, 65, TAX_TABLES_2027);
    const paye75 = calculatePAYE(300000, 75, TAX_TABLES_2027);
    expect(paye75).toBeLessThan(paye65);
  });

  test('PAYE is never negative', () => {
    expect(calculatePAYE(50000, 30, TAX_TABLES_2027)).toBeGreaterThanOrEqual(0);
    expect(calculatePAYE(0, 30, TAX_TABLES_2027)).toBeGreaterThanOrEqual(0);
  });

  test('higher income bracket produces higher PAYE', () => {
    const low = calculatePAYE(400000, 30, TAX_TABLES_2027);
    const high = calculatePAYE(800000, 30, TAX_TABLES_2027);
    expect(high).toBeGreaterThan(low);
  });

  test('age 75+ with low income: threshold allows zero PAYE', () => {
    const paye = calculatePAYE(160000, 75, TAX_TABLES_2027);
    expect(paye).toBe(0);
  });

  test('no brackets falls back to 18% flat rate', () => {
    const flatTables = { ...TAX_TABLES_2027, brackets: [], thresholds: [] };
    const paye = calculatePAYE(200000, 30, flatTables);
    expect(paye).toBeCloseTo(200000 * 0.18 / 12, 0);
  });
});

// ---------------------------------------------------------------------------
// calculateUIF
// ---------------------------------------------------------------------------
describe('calculateUIF', () => {
  const TAX_TABLES = {
    uif: { employee_rate: 0.01, employer_rate: 0.01, ceiling: 17712 },
  };

  test('UIF below ceiling: 1% employee + 1% employer', () => {
    const { employee, employer } = calculateUIF(10000, TAX_TABLES, false);
    expect(employee).toBeCloseTo(100, 2);
    expect(employer).toBeCloseTo(100, 2);
  });

  test('UIF is capped at ceiling (R17 712/month)', () => {
    const { employee } = calculateUIF(50000, TAX_TABLES, false);
    expect(employee).toBeCloseTo(177.12, 1);
  });

  test('exclude_uif flag returns zeros', () => {
    const { employee, employer } = calculateUIF(10000, TAX_TABLES, true);
    expect(employee).toBe(0);
    expect(employer).toBe(0);
  });

  test('rate stored as percentage (>0.5) is divided by 100', () => {
    const tablesWithPct = { uif: { employee_rate: 1, employer_rate: 1, ceiling: 17712 } };
    const { employee } = calculateUIF(10000, tablesWithPct, false);
    expect(employee).toBeCloseTo(100, 2);
  });
});

// ---------------------------------------------------------------------------
// calculateETI
// ---------------------------------------------------------------------------
describe('calculateETI', () => {
  test('age below 18: no ETI', () => {
    expect(calculateETI(17, 3000, 6)).toBe(0);
  });

  test('age above 29: no ETI', () => {
    expect(calculateETI(30, 3000, 6)).toBe(0);
  });

  test('remuneration above R6 500: no ETI', () => {
    expect(calculateETI(25, 7000, 6)).toBe(0);
  });

  test('first year (months <= 12), wage >= R2 000: ETI = max R1 000', () => {
    const eti = calculateETI(25, 2000, 1);
    expect(eti).toBe(1000);
  });

  test('first year wage above R2 000 tapers down (R3 000 = R500 ETI)', () => {
    const eti = calculateETI(25, 3000, 6);
    expect(eti).toBeGreaterThan(0);
    expect(eti).toBeLessThanOrEqual(1000);
    // Formula: MAX(0, 1000 - 0.5 × (3000 - 2000)) = MAX(0, 500) = 500
    expect(eti).toBeCloseTo(500, 2);
  });

  test('second year (months 13-24): ETI max R500', () => {
    const eti = calculateETI(25, 2000, 13);
    expect(eti).toBeLessThanOrEqual(500);
  });

  test('after 24 months: no ETI', () => {
    expect(calculateETI(25, 3000, 25)).toBe(0);
  });

  test('zero remuneration: no ETI', () => {
    expect(calculateETI(25, 0, 6)).toBe(0);
  });

  test('wage below minimum wage in first year: ETI = wage * 0.5', () => {
    const eti = calculateETI(22, 1000, 6);
    expect(eti).toBeCloseTo(500, 2);
  });
});

// ---------------------------------------------------------------------------
// getAge helper
// ---------------------------------------------------------------------------
describe('getAge', () => {
  test('returns correct age based on reference date', () => {
    const age = getAge('1990-06-15', '2026-06-15');
    expect(age).toBe(36);
  });

  test('birthday not yet reached in reference year', () => {
    const age = getAge('1990-12-31', '2026-06-15');
    expect(age).toBe(35);
  });

  test('returns 30 when dob is null/undefined', () => {
    expect(getAge(null, '2026-01-01')).toBe(30);
    expect(getAge(undefined, '2026-01-01')).toBe(30);
  });
});
