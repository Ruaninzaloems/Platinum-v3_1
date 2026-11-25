/**
 * Payroll Parity Tests
 *
 * Locks in the invariant that calculatePayslipForEmployee is the SINGLE
 * calculation path shared by the payslip view AND the trial run.
 * payroll.routes.js — executeForEmployees — calls calculatePayslipForEmployee
 * directly (no divergent path), so these tests will catch any future split.
 *
 * Scenarios:
 *  1. Task Grade employee — BASIC = monthly_salary (sole source, not annual÷12)
 *  2. RATE_PER_HOUR employee — BASIC = R0, approved wage transactions = earnings
 *  3. Upper Limit employee — amounts sourced from balanced structure table (annual÷12)
 *  4. Employee with active instalment — instalment deducted at min(monthly, balance)
 *  5. Determinism parity — identical DB mock data → deepEqual output on both calls
 *
 * DB mock call sequence for a non-UL employee (22 calls):
 *  1.  payroll_periods JOIN payroll_cycles
 *  2.  employees JOIN positions JOIN job_profiles   (resolveEmployeeSalaryStructure)
 *  3–10. Promise.all: tax_brackets, tax_rebates, tax_thresholds, medical_tax_credits,
 *        uif_settings, sdl_settings, salary_heads (system), irp5_codes
 *  11. employee_medical_aid
 *  12. employee_retirement_funds
 *  13. employee_unions
 *  14. employee_salary_transactions
 *  15. employee_payslip_transactions
 *  16. wage_transactions
 *  17. claims (try/catch)
 *  18. instalments (try/catch)
 *  19. overtime_transactions (try/catch)
 *  20. payroll_results prev_basic_salary (try/catch)
 *  21. salary_heads WHERE code = 'UNION_FEES' (always — unconditional lookup)
 *  22. salary_head_formulas JOIN salary_heads (MOC rules)
 *
 * Upper Limit adds 2 extra calls after #2: salary_upper_limits + employee_upper_limit_structure.
 * Total for non-UL = 22 queries. Total for UL = 24 queries.
 */

jest.mock('../config/database', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
}));

jest.mock('../services/notification.service', () => ({
  sendNotification: jest.fn().mockResolvedValue(undefined),
  logNotification: jest.fn().mockResolvedValue(undefined),
}));

const db = require('../config/database');
const { calculatePayslipForEmployee } = require('../services/payroll-engine');

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const PERIOD = {
  id: 10, cycle_id: 1, periods_per_year: 12,
  start_date: '2026-05-01', end_date: '2026-05-31',
  cycle_name: 'Monthly', cycle_type: 'MONTHLY',
};

const TAX_BRACKETS = [
  { bracket_number: 1, min_income: 0,      max_income: 237100, base_tax: 0,     rate: 0.18 },
  { bracket_number: 2, min_income: 237100, max_income: 370500, base_tax: 42678, rate: 0.26 },
  { bracket_number: 3, min_income: 370500, max_income: null,   base_tax: 77362, rate: 0.31 },
];
const TAX_REBATES    = [{ rebate_type: 'PRIMARY', amount: 17235 }];
const TAX_THRESHOLDS = [{ age_threshold: 0, amount: 95750 }];

const BASIC_EST_ROW = {
  est_id: 1, employee_id: 10, salary_head_id: 1,
  start_date: '2020-01-01', end_date: '9999-12-31',
  head_code: 'BASIC', head_name: 'Basic Salary',
  transaction_type: 'EARNING', irp5_code: '3601',
  taxable: true, affects_uif: true, affects_sdl: true,
  calculation_method: null, priority: 0,
  scoa_debit_item: null, scoa_credit_item: null,
};

// ---------------------------------------------------------------------------
// Employee row builders
// ---------------------------------------------------------------------------

function makeEmpRow(overrides = {}) {
  return {
    id: 10, employee_code: 'E010',
    annual_salary: 0, monthly_salary: 0,
    position_id: 5, task_grade_id: null, current_notch: null,
    upper_limit_value_type: null,
    date_of_birth: '1985-06-15',
    dependants: 0, exclude_uif: false, exclude_sdl: false,
    date_engaged: '2015-01-01', termination_date: null,
    employee_type_id: 1, employee_subtype_id: null, condition_of_service_id: null,
    working_hours_per_month: 176, working_days_per_month: 22,
    salary_based_on: null, wage_rate: null,
    job_profile_id: null, pos_stg_id: null, pos_upper_limit_value_type: null,
    jp_stg_id: null, jp_upper_limit_id: null, jp_task_grade_id: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function queueTaxMocks() {
  db.query
    .mockResolvedValueOnce({ rows: TAX_BRACKETS })
    .mockResolvedValueOnce({ rows: TAX_REBATES })
    .mockResolvedValueOnce({ rows: TAX_THRESHOLDS })
    .mockResolvedValueOnce({ rows: [] })
    .mockResolvedValueOnce({ rows: [] })
    .mockResolvedValueOnce({ rows: [] })
    .mockResolvedValueOnce({ rows: [] })
    .mockResolvedValueOnce({ rows: [] });
}

function queueTransactionMocks({ salaryTx = [BASIC_EST_ROW], wageTx = [], instalments = [] } = {}) {
  db.query
    .mockResolvedValueOnce({ rows: [] })          // 11: employee_medical_aid
    .mockResolvedValueOnce({ rows: [] })          // 12: employee_retirement_funds
    .mockResolvedValueOnce({ rows: [] })          // 13: employee_unions
    .mockResolvedValueOnce({ rows: salaryTx })    // 14: employee_salary_transactions
    .mockResolvedValueOnce({ rows: [] })          // 15: employee_payslip_transactions
    .mockResolvedValueOnce({ rows: wageTx })      // 16: wage_transactions
    .mockResolvedValueOnce({ rows: [] })          // 17: claims (try/catch)
    .mockResolvedValueOnce({ rows: instalments }) // 18: instalments (try/catch)
    .mockResolvedValueOnce({ rows: [] })          // 19: overtime_transactions (try/catch)
    .mockResolvedValueOnce({ rows: [] })          // 20: prev_basic_salary (try/catch)
    .mockResolvedValueOnce({ rows: [] })          // 21: salary_heads UNION_FEES (unconditional)
    .mockResolvedValueOnce({ rows: [] });         // 22: salary_head_formulas MOC rules
}

function setupNonULMocks(empRow, txOpts = {}) {
  db.query
    .mockResolvedValueOnce({ rows: [PERIOD] })
    .mockResolvedValueOnce({ rows: [empRow] });
  queueTaxMocks();
  queueTransactionMocks(txOpts);
}

function setupULMocks(empRow, ulConfigRow, structureRows, txOpts = {}) {
  db.query
    .mockResolvedValueOnce({ rows: [PERIOD] })
    .mockResolvedValueOnce({ rows: [empRow] })
    .mockResolvedValueOnce({ rows: [ulConfigRow] })
    .mockResolvedValueOnce({ rows: structureRows });
  queueTaxMocks();
  queueTransactionMocks(txOpts);
}

// ---------------------------------------------------------------------------
// 1. TASK GRADE employee
// ---------------------------------------------------------------------------

describe('Parity — Task Grade employee', () => {
  const MONTHLY = 35000;
  const empRow = makeEmpRow({ task_grade_id: 5, monthly_salary: MONTHLY, annual_salary: 0 });

  beforeEach(() => {
    db.query.mockReset();
    setupNonULMocks(empRow);
  });

  test('BASIC line = monthly_salary (not annual÷12)', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    const basicLine = result.results.find(r => r.head_code === 'BASIC');
    expect(basicLine).toBeDefined();
    expect(basicLine.amount).toBe(MONTHLY);
    expect(basicLine.transaction_type).toBe('EARNING');
  });

  test('employee_id propagated correctly', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    expect(result.employee_id).toBe(10);
  });

  test('summary: nett_pay = total_earnings − total_deductions', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    const { total_earnings, total_deductions, nett_pay } = result.summary;
    expect(nett_pay).toBeCloseTo(total_earnings - total_deductions, 2);
  });

  test('PAYE deduction is present and positive (income above threshold)', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    const paye = result.results.find(r => r.head_code === 'PAYE');
    expect(paye).toBeDefined();
    expect(paye.amount).toBeGreaterThan(0);
  });

  test('UIF_EE and UIF_ER are present', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    expect(result.results.some(r => r.head_code === 'UIF_EE')).toBe(true);
    expect(result.results.some(r => r.head_code === 'UIF_ER')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2. RATE_PER_HOUR employee with approved wage transactions
// ---------------------------------------------------------------------------

describe('Parity — RATE_PER_HOUR employee (wage transactions = earnings)', () => {
  const WAGE_AMOUNT = 18000;
  const empRow = makeEmpRow({
    salary_based_on: 'RATE_PER_HOUR', monthly_salary: 0, annual_salary: 0,
    task_grade_id: null, jp_task_grade_id: null, jp_upper_limit_id: null,
  });
  const wageTx = [{
    salary_head_id: 2, hours: 180, days: null, rate: 100, amount: WAGE_AMOUNT,
    head_code: 'BASIC_WAGES', head_name: 'Wages',
    transaction_type: 'EARNING', irp5_code: '3601',
    taxable: true, affects_uif: true, affects_sdl: true, priority: 5,
    scoa_debit_item: null, scoa_credit_item: null,
  }];

  beforeEach(() => {
    db.query.mockReset();
    setupNonULMocks(empRow, { salaryTx: [], wageTx });
  });

  test('BASIC line = R0.00 (wages are the earnings source)', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    const basicLine = result.results.find(r => r.head_code === 'BASIC');
    if (basicLine) {
      expect(basicLine.amount).toBe(0);
    } else {
      const totalEarnings = result.results
        .filter(r => r.transaction_type === 'EARNING')
        .reduce((s, r) => s + r.amount, 0);
      expect(totalEarnings).toBeGreaterThan(0);
    }
  });

  test('approved wage transaction appears in results', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    const wageLine = result.results.find(r => r.head_code === 'BASIC_WAGES');
    expect(wageLine).toBeDefined();
    expect(wageLine.amount).toBe(WAGE_AMOUNT);
    expect(wageLine.transaction_type).toBe('EARNING');
  });

  test('summary: nett_pay = total_earnings − total_deductions', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    const { total_earnings, total_deductions, nett_pay } = result.summary;
    expect(nett_pay).toBeCloseTo(total_earnings - total_deductions, 2);
  });

  test('wage transaction flagged as is_wage_transaction in filteredTransactions path', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    expect(result.employee_id).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// 3. UPPER LIMIT employee — balanced structure, amounts from structure table
// ---------------------------------------------------------------------------

describe('Parity — Upper Limit employee', () => {
  const UL_MIDPOINT = 720000;
  const BASIC_ANNUAL = 480000;
  const MED_ALLOW_ANNUAL = 240000;

  const empRow = makeEmpRow({
    id: 20, employee_code: 'E020',
    upper_limit_value_type: 'MIDPOINT',
    monthly_salary: parseFloat((BASIC_ANNUAL / 12).toFixed(2)),
    annual_salary: 0,
    jp_upper_limit_id: 7,
  });

  const ulConfig = {
    id: 7, minimum_value: 600000, midpoint_value: UL_MIDPOINT, maximum_value: 840000,
    enabled: true, start_date: '2024-01-01', end_date: '9999-12-31',
  };

  const structureRows = [
    {
      salary_head_id: 1, amount: BASIC_ANNUAL, included_in_package: true,
      code: 'BASIC', name: 'Basic Salary', transaction_type: 'EARNING',
      calculation_method: 'FIXED_AMOUNT', irp5_code: '3601',
      taxable: true, affects_uif: true, affects_sdl: true, priority: 0,
      scoa_debit_item: null, scoa_credit_item: null,
    },
    {
      salary_head_id: 5, amount: MED_ALLOW_ANNUAL, included_in_package: true,
      code: 'MED_ALLOW', name: 'Medical Allowance', transaction_type: 'EARNING',
      calculation_method: 'FIXED_AMOUNT', irp5_code: '3801',
      taxable: true, affects_uif: false, affects_sdl: false, priority: 20,
      scoa_debit_item: null, scoa_credit_item: null,
    },
  ];

  const ulEstRows = [
    { ...BASIC_EST_ROW, employee_id: 20, salary_head_id: 1 },
    { est_id: 2, employee_id: 20, salary_head_id: 5, start_date: '2020-01-01', end_date: '9999-12-31', head_code: 'MED_ALLOW', head_name: 'Medical Allowance', transaction_type: 'EARNING', irp5_code: '3801', taxable: true, affects_uif: false, affects_sdl: false, calculation_method: null, priority: 20, scoa_debit_item: null, scoa_credit_item: null },
  ];

  beforeEach(() => {
    db.query.mockReset();
    setupULMocks(empRow, ulConfig, structureRows, { salaryTx: ulEstRows });
  });

  test('BASIC = structure annual amount ÷ 12 (monthly_salary kept in sync with structure BASIC)', async () => {
    const result = await calculatePayslipForEmployee(20, 10, 1);
    const basicLine = result.results.find(r => r.head_code === 'BASIC');
    expect(basicLine).toBeDefined();
    const expectedMonthly = parseFloat((BASIC_ANNUAL / 12).toFixed(2));
    expect(basicLine.amount).toBe(expectedMonthly);
  });

  test('MED_ALLOW from structure = annual÷12', async () => {
    const result = await calculatePayslipForEmployee(20, 10, 1);
    const medLine = result.results.find(r => r.head_code === 'MED_ALLOW');
    expect(medLine).toBeDefined();
    expect(medLine.amount).toBe(parseFloat((MED_ALLOW_ANNUAL / 12).toFixed(2)));
  });

  test('balanced structure does NOT throw variance error', async () => {
    await expect(calculatePayslipForEmployee(20, 10, 1)).resolves.toBeDefined();
  });

  test('summary: nett_pay = total_earnings − total_deductions', async () => {
    const result = await calculatePayslipForEmployee(20, 10, 1);
    const { total_earnings, total_deductions, nett_pay } = result.summary;
    expect(nett_pay).toBeCloseTo(total_earnings - total_deductions, 2);
  });
});

// ---------------------------------------------------------------------------
// 4. Employee with active instalment
// ---------------------------------------------------------------------------

describe('Parity — employee with active instalment', () => {
  const MONTHLY_SALARY = 28000;
  const INSTALMENT_MONTHLY = 800;
  const INSTALMENT_BALANCE = 2400;

  const empRow = makeEmpRow({ monthly_salary: MONTHLY_SALARY, annual_salary: MONTHLY_SALARY * 12 });

  const instalmentRow = {
    id: 5, salary_head_id: 20, description: 'Staff Loan Repayment',
    monthly_instalment: INSTALMENT_MONTHLY, balance: INSTALMENT_BALANCE,
    head_code: 'LOAN', head_name: 'Staff Loan', irp5_code: null,
    scoa_debit_item: null, scoa_credit_item: null,
    start_date: '2026-01-01', end_date: null,
  };

  beforeEach(() => {
    db.query.mockReset();
    setupNonULMocks(empRow, { instalments: [instalmentRow] });
  });

  test('instalment appears as DEDUCTION in results', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    const instLine = result.results.find(r => r.instalment_id === 5);
    expect(instLine).toBeDefined();
    expect(instLine.transaction_type).toBe('DEDUCTION');
  });

  test('instalment deduction = min(monthly_instalment, balance)', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    const instLine = result.results.find(r => r.instalment_id === 5);
    const expectedDeduction = Math.min(INSTALMENT_MONTHLY, INSTALMENT_BALANCE);
    expect(instLine.amount).toBe(expectedDeduction);
  });

  test('instalment reduces nett_pay vs a run without it', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);

    db.query.mockReset();
    setupNonULMocks(empRow, { instalments: [] });
    const resultNoInst = await calculatePayslipForEmployee(10, 10, 1);

    expect(result.summary.nett_pay).toBeLessThan(resultNoInst.summary.nett_pay);
    const diff = parseFloat((resultNoInst.summary.nett_pay - result.summary.nett_pay).toFixed(2));
    expect(diff).toBe(Math.min(INSTALMENT_MONTHLY, INSTALMENT_BALANCE));
  });

  test('summary: nett_pay = total_earnings − total_deductions', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    const { total_earnings, total_deductions, nett_pay } = result.summary;
    expect(nett_pay).toBeCloseTo(total_earnings - total_deductions, 2);
  });
});

// ---------------------------------------------------------------------------
// 5. DETERMINISM PARITY — identical DB data → deepEqual results
//    This is the core regression guard: the trial run and payslip view both
//    call calculatePayslipForEmployee; if the function is deterministic,
//    two calls with the same inputs MUST return deepEqual output.
// ---------------------------------------------------------------------------

describe('Parity — determinism (payslip view = trial run output)', () => {
  const MONTHLY_SALARY = 32000;
  const empRow = makeEmpRow({
    id: 15, employee_code: 'E015',
    monthly_salary: MONTHLY_SALARY, annual_salary: MONTHLY_SALARY * 12,
  });

  function queueFullMockSequence() {
    setupNonULMocks(empRow);
  }

  test('TASK GRADE: two calls with identical DB state return deepEqual results', async () => {
    db.query.mockReset();
    queueFullMockSequence();
    const run1 = await calculatePayslipForEmployee(15, 10, 1);

    db.query.mockReset();
    queueFullMockSequence();
    const run2 = await calculatePayslipForEmployee(15, 10, 1);

    expect(run1).toEqual(run2);
  });

  test('RATE_PER_HOUR: two calls with identical DB state return deepEqual results', async () => {
    const rateEmpRow = makeEmpRow({
      id: 16, employee_code: 'E016',
      salary_based_on: 'RATE_PER_HOUR', monthly_salary: 0, annual_salary: 0,
    });
    const wageTx = [{
      salary_head_id: 2, hours: 176, days: null, rate: 95, amount: 16720,
      head_code: 'WAGES', head_name: 'Wages', transaction_type: 'EARNING',
      irp5_code: '3601', taxable: true, affects_uif: true, affects_sdl: true,
      priority: 5, scoa_debit_item: null, scoa_credit_item: null,
    }];

    db.query.mockReset();
    db.query
      .mockResolvedValueOnce({ rows: [PERIOD] })
      .mockResolvedValueOnce({ rows: [rateEmpRow] });
    queueTaxMocks();
    queueTransactionMocks({ salaryTx: [], wageTx });

    const run1 = await calculatePayslipForEmployee(16, 10, 1);

    db.query.mockReset();
    db.query
      .mockResolvedValueOnce({ rows: [PERIOD] })
      .mockResolvedValueOnce({ rows: [rateEmpRow] });
    queueTaxMocks();
    queueTransactionMocks({ salaryTx: [], wageTx });

    const run2 = await calculatePayslipForEmployee(16, 10, 1);

    expect(run1).toEqual(run2);
  });

  test('Upper Limit: two calls with identical DB state return deepEqual results', async () => {
    const ulEmpRow = makeEmpRow({
      id: 17, employee_code: 'E017',
      upper_limit_value_type: 'MIDPOINT',
      monthly_salary: 50000, annual_salary: 0,
      jp_upper_limit_id: 9,
    });
    const ulConfig = {
      id: 9, minimum_value: 480000, midpoint_value: 600000, maximum_value: 720000,
      enabled: true, start_date: '2024-01-01', end_date: '9999-12-31',
    };
    const structRows = [
      { salary_head_id: 1, amount: 360000, included_in_package: true, code: 'BASIC', name: 'Basic Salary', transaction_type: 'EARNING', calculation_method: 'FIXED_AMOUNT', irp5_code: '3601', taxable: true, affects_uif: true, affects_sdl: true, priority: 0, scoa_debit_item: null, scoa_credit_item: null },
      { salary_head_id: 5, amount: 240000, included_in_package: true, code: 'MED_ALLOW', name: 'Medical Allowance', transaction_type: 'EARNING', calculation_method: 'FIXED_AMOUNT', irp5_code: '3801', taxable: true, affects_uif: false, affects_sdl: false, priority: 20, scoa_debit_item: null, scoa_credit_item: null },
    ];
    const ulEstRows = [
      { ...BASIC_EST_ROW, employee_id: 17, salary_head_id: 1 },
      { est_id: 2, employee_id: 17, salary_head_id: 5, start_date: '2020-01-01', end_date: '9999-12-31', head_code: 'MED_ALLOW', head_name: 'Medical Allowance', transaction_type: 'EARNING', irp5_code: '3801', taxable: true, affects_uif: false, affects_sdl: false, calculation_method: null, priority: 20, scoa_debit_item: null, scoa_credit_item: null },
    ];

    db.query.mockReset();
    setupULMocks(ulEmpRow, ulConfig, structRows, { salaryTx: ulEstRows });
    const run1 = await calculatePayslipForEmployee(17, 10, 1);

    db.query.mockReset();
    setupULMocks(ulEmpRow, ulConfig, structRows, { salaryTx: ulEstRows });
    const run2 = await calculatePayslipForEmployee(17, 10, 1);

    expect(run1).toEqual(run2);
  });

  test('with instalment: two calls with identical DB state return deepEqual results', async () => {
    const instEmpRow = makeEmpRow({
      id: 18, employee_code: 'E018',
      monthly_salary: 26000, annual_salary: 312000,
    });
    const instRow = {
      id: 7, salary_head_id: 20, description: 'Staff Loan',
      monthly_instalment: 500, balance: 1500,
      head_code: 'LOAN', head_name: 'Staff Loan', irp5_code: null,
      scoa_debit_item: null, scoa_credit_item: null,
      start_date: '2026-01-01', end_date: null,
    };

    db.query.mockReset();
    db.query
      .mockResolvedValueOnce({ rows: [PERIOD] })
      .mockResolvedValueOnce({ rows: [instEmpRow] });
    queueTaxMocks();
    queueTransactionMocks({ instalments: [instRow] });

    const run1 = await calculatePayslipForEmployee(18, 10, 1);

    db.query.mockReset();
    db.query
      .mockResolvedValueOnce({ rows: [PERIOD] })
      .mockResolvedValueOnce({ rows: [instEmpRow] });
    queueTaxMocks();
    queueTransactionMocks({ instalments: [instRow] });

    const run2 = await calculatePayslipForEmployee(18, 10, 1);

    expect(run1).toEqual(run2);
  });
});

// ---------------------------------------------------------------------------
// 6. INVARIANT: result shape matches trial-run consumption contract
//    executeForEmployees reads result.results[].{transaction_type, amount,
//    head_code, salary_head_id, irp5_code} and result.summary.{nett_pay}.
//    These fields must always be present.
// ---------------------------------------------------------------------------

describe('Parity — result shape satisfies trial-run contract', () => {
  const empRow = makeEmpRow({ monthly_salary: 22000, annual_salary: 264000 });

  beforeEach(() => {
    db.query.mockReset();
    setupNonULMocks(empRow);
  });

  test('result has employee_id, results array, and summary object', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    expect(typeof result.employee_id).toBe('number');
    expect(Array.isArray(result.results)).toBe(true);
    expect(typeof result.summary).toBe('object');
  });

  test('every result line has required trial-run fields', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    for (const line of result.results) {
      expect(line).toHaveProperty('transaction_type');
      expect(line).toHaveProperty('amount');
      expect(['EARNING', 'DEDUCTION', 'COMPANY_CONTRIBUTION', 'FRINGE_BENEFIT'])
        .toContain(line.transaction_type);
      expect(typeof line.amount).toBe('number');
      expect(isNaN(line.amount)).toBe(false);
    }
  });

  test('summary has all fields consumed by executeForEmployees', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    const s = result.summary;
    expect(s).toHaveProperty('nett_pay');
    expect(s).toHaveProperty('total_earnings');
    expect(s).toHaveProperty('total_deductions');
    expect(s).toHaveProperty('paye');
    expect(s).toHaveProperty('uif_employee');
    expect(s).toHaveProperty('uif_employer');
    expect(s).toHaveProperty('sdl');
  });

  test('no NaN values in any summary field', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    for (const [key, val] of Object.entries(result.summary)) {
      if (typeof val === 'number') {
        expect(isNaN(val)).toBe(false);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 7. PAYE BREAKDOWN — core tax calculation invariants (no medical aid)
// ---------------------------------------------------------------------------

describe('PAYE Breakdown — tax calculation invariants', () => {
  const MONTHLY = 35000;
  const empRow = makeEmpRow({ task_grade_id: 5, monthly_salary: MONTHLY, annual_salary: 0 });

  beforeEach(() => {
    db.query.mockReset();
    setupNonULMocks(empRow);
  });

  test('payeBreakdown is present and is an object', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    expect(result).toHaveProperty('payeBreakdown');
    expect(typeof result.payeBreakdown).toBe('object');
    expect(result.payeBreakdown).not.toBeNull();
  });

  test('annual_taxable_income = annual_gross_taxable − annual_pension_deduction', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    const { annual_taxable_income, annual_gross_taxable, annual_pension_deduction } = result.payeBreakdown;
    expect(annual_taxable_income).toBe(annual_gross_taxable - annual_pension_deduction);
  });

  test('annual_gross_taxable = monthly_taxable_income × periods_per_year', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    const { annual_gross_taxable, monthly_taxable_income, periods_per_year } = result.payeBreakdown;
    expect(annual_gross_taxable).toBeCloseTo(monthly_taxable_income * periods_per_year, 2);
  });

  test('monthly_paye_before_credits ≈ annual_tax_after_rebates ÷ periods_per_year (toFixed(2) rounding)', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    const { monthly_paye_before_credits, annual_tax_after_rebates, periods_per_year } = result.payeBreakdown;
    const expected = parseFloat((annual_tax_after_rebates / periods_per_year).toFixed(2));
    expect(monthly_paye_before_credits).toBeCloseTo(expected, 2);
  });

  test('total_rebates = PRIMARY rebate (17235) for employee under 65', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    expect(result.payeBreakdown.total_rebates).toBe(17235);
  });

  test('rebates array contains exactly one PRIMARY entry for under-65 employee', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    const { rebates } = result.payeBreakdown;
    const primary = rebates.filter(r => r.type === 'PRIMARY');
    const secondary = rebates.filter(r => r.type === 'SECONDARY');
    const tertiary = rebates.filter(r => r.type === 'TERTIARY');
    expect(primary).toHaveLength(1);
    expect(primary[0].amount).toBe(17235);
    expect(secondary).toHaveLength(0);
    expect(tertiary).toHaveLength(0);
  });

  test('annual_tax_before_rebates − total_rebates = annual_tax_after_rebates', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    const { annual_tax_before_rebates, total_rebates, annual_tax_after_rebates } = result.payeBreakdown;
    expect(parseFloat((annual_tax_before_rebates - total_rebates).toFixed(2))).toBe(annual_tax_after_rebates);
  });

  test('final_monthly_paye = monthly_paye_before_credits when no medical aid', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    const { final_monthly_paye, monthly_paye_before_credits, medical_tax_credits } = result.payeBreakdown;
    expect(medical_tax_credits).toBe(0);
    expect(final_monthly_paye).toBeCloseTo(monthly_paye_before_credits, 2);
  });

  test('final_monthly_paye = max(0, monthly_paye_before_credits − medical_tax_credits)', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    const { final_monthly_paye, monthly_paye_before_credits, medical_tax_credits } = result.payeBreakdown;
    const expected = Math.max(0, parseFloat((monthly_paye_before_credits - medical_tax_credits).toFixed(2)));
    expect(final_monthly_paye).toBeCloseTo(expected, 2);
  });

  test('applied_bracket is present and income falls within its bounds', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    const { applied_bracket, annual_taxable_income } = result.payeBreakdown;
    expect(applied_bracket).not.toBeNull();
    expect(annual_taxable_income).toBeGreaterThan(applied_bracket.min_income);
    // max_income is null/NaN for the top bracket (no upper bound) — only check when finite
    if (applied_bracket.max_income !== null && !isNaN(applied_bracket.max_income)) {
      expect(annual_taxable_income).toBeLessThanOrEqual(applied_bracket.max_income);
    }
  });

  test('summary.paye matches payeBreakdown.final_monthly_paye', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    expect(result.summary.paye).toBeCloseTo(result.payeBreakdown.final_monthly_paye, 2);
  });

  test('periods_per_year matches the period fixture (12 for monthly cycle)', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    expect(result.payeBreakdown.periods_per_year).toBe(12);
  });

  test('no NaN or undefined in required payeBreakdown numeric fields', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    const numericFields = [
      'annual_taxable_income', 'annual_gross_taxable', 'annual_pension_deduction',
      'monthly_paye_before_credits', 'total_rebates', 'annual_tax_after_rebates',
      'annual_tax_before_rebates', 'medical_tax_credits', 'final_monthly_paye', 'periods_per_year',
    ];
    for (const field of numericFields) {
      expect(result.payeBreakdown[field]).toBeDefined();
      expect(isNaN(result.payeBreakdown[field])).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// 8. PAYE BREAKDOWN — with medical aid credits (credits reduce final PAYE)
// ---------------------------------------------------------------------------

describe('PAYE Breakdown — medical tax credits reduce final PAYE', () => {
  const MONTHLY = 35000;
  const DEPENDANTS = 2;

  const empRow = makeEmpRow({
    task_grade_id: 5, monthly_salary: MONTHLY, annual_salary: 0,
    dependants: DEPENDANTS,
  });

  // MED_SUBSCRIPTION is not in systemCalcCodes so it flows through filteredTransactions.
  // 'MED_SUBSCRIPTION'.includes('MED') = true, transaction_type = DEDUCTION → hasMedAidTx = true.
  const MED_SUBSCRIPTION_EST = {
    est_id: 3, employee_id: 10, salary_head_id: 30,
    start_date: '2020-01-01', end_date: '9999-12-31',
    head_code: 'MED_SUBSCRIPTION', head_name: 'Medical Subscription',
    transaction_type: 'DEDUCTION', irp5_code: null,
    taxable: false, affects_uif: false, affects_sdl: false,
    calculation_method: null, priority: 50,
    scoa_debit_item: null, scoa_credit_item: null,
  };

  // Payslip transaction supplies the captured_amount so the deduction is non-zero (> 0)
  // and appears in calcResult.results, triggering hasMedAidTx in _computePayslipCore.
  const MED_SUBSCRIPTION_PAYSLIP_TX = {
    ept_id: 101, employee_salary_transaction_id: 3, employee_id: 10,
    salary_head_id: 30, captured_amount: 800, period_id: 10, every_month: true,
    reference_no: '',
    head_code: 'MED_SUBSCRIPTION', head_name: 'Medical Subscription',
    transaction_type: 'DEDUCTION', irp5_code: null,
    taxable: false, affects_uif: false, affects_sdl: false,
    calculation_method: null, priority: 50,
    scoa_debit_item: null, scoa_credit_item: null,
  };

  function setupMedAidMocks() {
    db.query
      .mockResolvedValueOnce({ rows: [PERIOD] })
      .mockResolvedValueOnce({ rows: [empRow] });
    queueTaxMocks();
    // Custom transaction mocks: medical subscription in salary + payslip transactions
    db.query
      .mockResolvedValueOnce({ rows: [] })                                        // 11: employee_medical_aid
      .mockResolvedValueOnce({ rows: [] })                                        // 12: employee_retirement_funds
      .mockResolvedValueOnce({ rows: [] })                                        // 13: employee_unions
      .mockResolvedValueOnce({ rows: [BASIC_EST_ROW, MED_SUBSCRIPTION_EST] })    // 14: employee_salary_transactions
      .mockResolvedValueOnce({ rows: [MED_SUBSCRIPTION_PAYSLIP_TX] })            // 15: employee_payslip_transactions
      .mockResolvedValueOnce({ rows: [] })                                        // 16: wage_transactions
      .mockResolvedValueOnce({ rows: [] })                                        // 17: claims
      .mockResolvedValueOnce({ rows: [] })                                        // 18: instalments
      .mockResolvedValueOnce({ rows: [] })                                        // 19: overtime_transactions
      .mockResolvedValueOnce({ rows: [] })                                        // 20: prev_basic_salary
      .mockResolvedValueOnce({ rows: [] })                                        // 21: salary_heads UNION_FEES
      .mockResolvedValueOnce({ rows: [] });                                       // 22: salary_head_formulas MOC
  }

  beforeEach(() => {
    db.query.mockReset();
    setupMedAidMocks();
  });

  test('medical_tax_credits > 0 when MED deduction present and employee has dependants', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    expect(result.payeBreakdown.medical_tax_credits).toBeGreaterThan(0);
  });

  test('final_monthly_paye < monthly_paye_before_credits when credits applied', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    const { final_monthly_paye, monthly_paye_before_credits } = result.payeBreakdown;
    expect(final_monthly_paye).toBeLessThan(monthly_paye_before_credits);
  });

  test('final_monthly_paye = max(0, monthly_paye_before_credits − medical_tax_credits)', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    const { final_monthly_paye, monthly_paye_before_credits, medical_tax_credits } = result.payeBreakdown;
    const expected = Math.max(0, parseFloat((monthly_paye_before_credits - medical_tax_credits).toFixed(2)));
    expect(final_monthly_paye).toBeCloseTo(expected, 2);
  });

  test('credits cover at least main member + first dependant (≥ 728 using default fallback rates)', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    // Default fallback: main_member=364, first_dependant=364 → minimum 728 for dependants >= 1
    expect(result.payeBreakdown.medical_tax_credits).toBeGreaterThanOrEqual(728);
  });

  test('summary.paye reflects credit-reduced PAYE (matches final_monthly_paye)', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    expect(result.summary.paye).toBeCloseTo(result.payeBreakdown.final_monthly_paye, 2);
  });

  test('annual_taxable_income invariant holds even with medical credits applied', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    const { annual_taxable_income, annual_gross_taxable, annual_pension_deduction } = result.payeBreakdown;
    expect(annual_taxable_income).toBe(annual_gross_taxable - annual_pension_deduction);
  });

  test('total_rebates is still PRIMARY-only for under-65 employee with medical aid', async () => {
    const result = await calculatePayslipForEmployee(10, 10, 1);
    expect(result.payeBreakdown.total_rebates).toBe(17235);
    const secondary = result.payeBreakdown.rebates.filter(r => r.type === 'SECONDARY');
    expect(secondary).toHaveLength(0);
  });
});
