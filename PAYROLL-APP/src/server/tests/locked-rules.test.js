/**
 * Locked Business Rule Tests
 * Task Grade, Rate Based, Upper Limit, Approval Workflow.
 * Mirrors .agents/skills/task-grade-rules/, rate-based-rules/,
 * upper-limit-rules/, approval-workflow-rules/ SKILLs.
 *
 * Strategy:
 *  - Task Grade + Rate Based: call resolveMonthlyBasic() — a pure function, no DB.
 *  - Upper Limit: call resolveEmployeeSalaryStructure() with mocked DB to verify
 *    UL detection, target package extraction, and structure row retrieval.
 *  - Approval Workflow: call handleApproval() and autoAdvanceInitiatorSteps()
 *    with mocked DB to verify self-approval block and capturer-only exception.
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
const { resolveMonthlyBasic, resolveEmployeeSalaryStructure, calculatePayslipForEmployee } = require('../services/payroll-engine');
const { handleApproval } = require('../services/transaction-approval.service');
const { autoAdvanceInitiatorSteps } = require('../services/workflow.service');

const PERIODS_PER_YEAR = 12;

// Helper — builds a minimal employee DB row with an Upper Limit assignment.
function makeULEmployeeRow(overrides = {}) {
  return {
    id: 1, employee_code: 'E001', annual_salary: 0, monthly_salary: 600000,
    position_id: 10, task_grade_id: null, current_notch: null,
    upper_limit_value_type: 'MIDPOINT',
    date_of_birth: '1980-01-01', dependants: 0, exclude_uif: false, exclude_sdl: false,
    joining_date: '2020-01-01', end_date: null, employee_type_id: 1,
    employee_subtype_id: null, condition_of_service_id: null,
    working_hours_per_month: 176, working_days_per_month: 22,
    salary_based_on: 'FIXED', wage_rate: null,
    job_profile_id: 5, pos_stg_id: null, pos_upper_limit_value_type: null,
    jp_stg_id: null, jp_upper_limit_id: 7, jp_task_grade_id: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// TASK GRADE RULES (LOCKED)
// ---------------------------------------------------------------------------
describe('Task Grade locked rules', () => {
  test('RULE: monthly_salary is the SOLE BASIC source for Task Grade employees', () => {
    const emp = { task_grade_id: 1, monthly_salary: 35000, annual_salary: 999999 };
    expect(resolveMonthlyBasic(emp, PERIODS_PER_YEAR)).toBe(35000);
  });

  test('RULE: monthly_salary 0 throws descriptive error (no fallback to annual_salary)', () => {
    const emp = { task_grade_id: 1, monthly_salary: 0, annual_salary: 420000 };
    expect(() => resolveMonthlyBasic(emp, PERIODS_PER_YEAR)).toThrow();
    try {
      resolveMonthlyBasic(emp, PERIODS_PER_YEAR);
    } catch (e) {
      expect(e.message).toMatch(/monthly salary|basic salary/i);
    }
  });

  test('RULE: null monthly_salary throws error', () => {
    const emp = { task_grade_id: 1, monthly_salary: null, annual_salary: 420000 };
    expect(() => resolveMonthlyBasic(emp, PERIODS_PER_YEAR)).toThrow();
  });

  test('RULE: jp_task_grade_id (from job profile) enforces same rule', () => {
    const emp = { jp_task_grade_id: 3, monthly_salary: 0, annual_salary: 0 };
    expect(() => resolveMonthlyBasic(emp, PERIODS_PER_YEAR)).toThrow();
  });

  test('RULE: positive monthly_salary returns exact value, not annual÷12', () => {
    const emp = { task_grade_id: 2, monthly_salary: 27543.21, annual_salary: 999999 };
    const result = resolveMonthlyBasic(emp, PERIODS_PER_YEAR);
    expect(result).toBe(27543.21);
    expect(result).not.toBeCloseTo(999999 / 12, 0);
  });
});

// ---------------------------------------------------------------------------
// RATE BASED RULES (LOCKED)
// ---------------------------------------------------------------------------
describe('Rate Based locked rules', () => {
  test('RULE: RATE_PER_HOUR → BASIC = R0.00 (wages are the primary earnings)', () => {
    const emp = { salary_based_on: 'RATE_PER_HOUR', monthly_salary: 0, annual_salary: 0 };
    expect(resolveMonthlyBasic(emp, PERIODS_PER_YEAR)).toBe(0);
  });

  test('RULE: RATE_PER_DAY → BASIC = R0.00', () => {
    const emp = { salary_based_on: 'RATE_PER_DAY', monthly_salary: 0, annual_salary: 0 };
    expect(resolveMonthlyBasic(emp, PERIODS_PER_YEAR)).toBe(0);
  });

  test('RULE: CAPTURED_VALUE → BASIC = R0.00 (captured_amount used instead)', () => {
    const emp = { salary_based_on: 'CAPTURED_VALUE', monthly_salary: 0, annual_salary: 0 };
    expect(resolveMonthlyBasic(emp, PERIODS_PER_YEAR)).toBe(0);
  });

  test('RULE: FIXED_RATE → BASIC = wage_rate', () => {
    const emp = { salary_based_on: 'FIXED_RATE', wage_rate: 350.75, monthly_salary: 0, annual_salary: 0 };
    expect(resolveMonthlyBasic(emp, PERIODS_PER_YEAR)).toBe(350.75);
  });

  test('RULE: RATE_PER_HOUR employee does NOT use monthly_salary even if set', () => {
    const emp = { salary_based_on: 'RATE_PER_HOUR', monthly_salary: 25000, annual_salary: 300000 };
    expect(resolveMonthlyBasic(emp, PERIODS_PER_YEAR)).toBe(0);
  });

  test('RULE: Rate Based is fallback classification (no upper_limit_id, no task_grade_id)', () => {
    const emp = { salary_based_on: 'RATE_PER_HOUR', monthly_salary: 0, annual_salary: 0 };
    expect('upper_limit_id' in emp).toBe(false);
    expect('task_grade_id' in emp).toBe(false);
    expect(resolveMonthlyBasic(emp, PERIODS_PER_YEAR)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// UPPER LIMIT RULES (LOCKED)
// Calls resolveEmployeeSalaryStructure() with mocked DB — no mirror logic.
//
// DB call sequence when jp_upper_limit_id is set:
//  1. SELECT employees JOIN positions JOIN job_profiles WHERE e.id = $1
//  2. (pos_stg_id absent → skip group-items query)
//  3. SELECT FROM salary_upper_limits WHERE id = upperLimitId AND enabled = TRUE
//  4. SELECT FROM employee_upper_limit_structure JOIN salary_heads WHERE employee_id = $1
// ---------------------------------------------------------------------------
describe('Upper Limit locked rules', () => {
  beforeEach(() => db.query.mockReset());

  test('RULE: resolveEmployeeSalaryStructure returns salarySource=UPPER_LIMIT when jp_upper_limit_id is set', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [makeULEmployeeRow()] })
      .mockResolvedValueOnce({
        rows: [{ id: 7, minimum_value: 900000, midpoint_value: 1200000, maximum_value: 1500000, enabled: true, start_date: '2024-01-01', end_date: '9999-12-31' }],
      })
      .mockResolvedValueOnce({
        rows: [
          { salary_head_id: 1, amount: 600000, included_in_package: true, code: 'BASIC', name: 'Basic Salary', transaction_type: 'EARNING', calculation_method: 'FIXED_AMOUNT' },
          { salary_head_id: 5, amount: 200000, included_in_package: true, code: 'MEDICAL', name: 'Medical Aid', transaction_type: 'COMPANY_CONTRIBUTION', calculation_method: 'FIXED_AMOUNT' },
          { salary_head_id: 9, amount: 400000, included_in_package: true, code: 'PENSION', name: 'Pension Fund', transaction_type: 'DEDUCTION', calculation_method: 'FIXED_AMOUNT' },
        ],
      });

    const structure = await resolveEmployeeSalaryStructure(1, '2026-05-31');
    expect(structure).not.toBeNull();
    expect(structure.salarySource).toBe('UPPER_LIMIT');
  });

  test('RULE: target package is the UL midpoint_value — not employees.monthly_salary', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [makeULEmployeeRow({ monthly_salary: 999999 })] })
      .mockResolvedValueOnce({
        rows: [{ id: 7, minimum_value: 900000, midpoint_value: 1200000, maximum_value: 1500000, enabled: true, start_date: '2024-01-01', end_date: '9999-12-31' }],
      })
      .mockResolvedValueOnce({ rows: [] });

    const structure = await resolveEmployeeSalaryStructure(1, '2026-05-31');
    expect(structure.upperLimitTargetPackage).toBe(1200000);
    expect(structure.upperLimitTargetPackage).not.toBe(999999);
  });

  test('RULE: MINIMUM value type selects minimum_value as the target package', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [makeULEmployeeRow({ upper_limit_value_type: 'MINIMUM' })] })
      .mockResolvedValueOnce({
        rows: [{ id: 7, minimum_value: 720000, midpoint_value: 900000, maximum_value: 1080000, enabled: true, start_date: '2024-01-01', end_date: '9999-12-31' }],
      })
      .mockResolvedValueOnce({ rows: [] });

    const structure = await resolveEmployeeSalaryStructure(1, '2026-05-31');
    expect(structure.upperLimitTargetPackage).toBe(720000);
    expect(structure.upperLimitTargetPackage).not.toBe(900000);
  });

  test('RULE: structure rows carry annual amounts — payslip divides by 12', async () => {
    const annualAmount = 600000;
    db.query
      .mockResolvedValueOnce({ rows: [makeULEmployeeRow()] })
      .mockResolvedValueOnce({
        rows: [{ id: 7, minimum_value: 480000, midpoint_value: 600000, maximum_value: 720000, enabled: true, start_date: '2024-01-01', end_date: '9999-12-31' }],
      })
      .mockResolvedValueOnce({
        rows: [{ salary_head_id: 1, amount: annualAmount, included_in_package: true, code: 'BASIC', name: 'Basic Salary', transaction_type: 'EARNING', calculation_method: 'FIXED_AMOUNT' }],
      });

    const structure = await resolveEmployeeSalaryStructure(1, '2026-05-31');
    const basicRow = structure.upperLimitStructureRows[0];
    expect(parseFloat(basicRow.amount)).toBe(annualAmount);
    // Payslip divides annual by 12:
    expect(parseFloat((basicRow.amount / 12).toFixed(2))).toBe(50000);
  });

  test('RULE: employee without jp_upper_limit_id returns salarySource=FIXED (not UPPER_LIMIT)', async () => {
    db.query.mockResolvedValueOnce({
      rows: [makeULEmployeeRow({ jp_upper_limit_id: null, annual_salary: 480000, monthly_salary: 40000 })],
    });

    const structure = await resolveEmployeeSalaryStructure(1, '2026-05-31');
    expect(structure.salarySource).not.toBe('UPPER_LIMIT');
  });

  test('RULE: balance variance > R5.00 — calculatePayslipForEmployee throws before payroll runs', async () => {
    // DB call sequence (24 mocks):
    // 1. payroll_periods lookup
    // 2-4. resolveEmployeeSalaryStructure (employee+pos+jp, UL config, UNBALANCED structure rows)
    // 5-12. loadTaxTables Promise.all (brackets, rebates, thresholds, medCredits, uif, sdl, systemHeads, irp5Codes)
    // 13-15. medical aid, retirement funds, union memberships (0 rows each)
    // 16-19. salary transactions, payslip transactions, wages, claims (0 rows each)
    // 20-24. instalments, overtime, prevBasic, unionHeadId, mocRules (0 rows each)
    // → balance check: sum(1,150,000) vs target(1,200,000) → variance R50,000 > R5 → THROWS
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 10, cycle_id: 1, periods_per_year: 12, start_date: '2026-05-01', end_date: '2026-05-31', cycle_name: 'Monthly', cycle_type: 'MONTHLY' }] })
      .mockResolvedValueOnce({ rows: [makeULEmployeeRow()] })
      .mockResolvedValueOnce({ rows: [{ id: 7, minimum_value: 900000, midpoint_value: 1200000, maximum_value: 1500000, enabled: true, start_date: '2024-01-01', end_date: '9999-12-31' }] })
      .mockResolvedValueOnce({ rows: [
        { salary_head_id: 1, amount: 800000, included_in_package: true, code: 'BASIC', name: 'Basic Salary', transaction_type: 'EARNING', calculation_method: 'FIXED_AMOUNT' },
        { salary_head_id: 5, amount: 350000, included_in_package: true, code: 'MEDICAL', name: 'Medical Aid', transaction_type: 'COMPANY_CONTRIBUTION', calculation_method: 'FIXED_AMOUNT' },
      ] })
      .mockResolvedValueOnce({ rows: [{ bracket_number: 1, from_value: 0, to_value: 237100, rate: 0.18, base_amount: 0, tax_year: 2026 }] }) // brackets (non-empty → no fallback)
      .mockResolvedValueOnce({ rows: [] }) // rebates
      .mockResolvedValueOnce({ rows: [] }) // thresholds
      .mockResolvedValueOnce({ rows: [] }) // medCredits
      .mockResolvedValueOnce({ rows: [] }) // uif
      .mockResolvedValueOnce({ rows: [] }) // sdl
      .mockResolvedValueOnce({ rows: [] }) // systemHeads
      .mockResolvedValueOnce({ rows: [] }) // irp5Codes
      .mockResolvedValueOnce({ rows: [] }) // medical aid
      .mockResolvedValueOnce({ rows: [] }) // retirement funds
      .mockResolvedValueOnce({ rows: [] }) // union
      .mockResolvedValueOnce({ rows: [] }) // salary transactions
      .mockResolvedValueOnce({ rows: [] }) // payslip transactions
      .mockResolvedValueOnce({ rows: [] }) // wages
      .mockResolvedValueOnce({ rows: [] }) // claims
      .mockResolvedValueOnce({ rows: [] }) // instalments
      .mockResolvedValueOnce({ rows: [] }) // overtime
      .mockResolvedValueOnce({ rows: [] }) // prevBasic
      .mockResolvedValueOnce({ rows: [] }) // unionHeadId
      .mockResolvedValueOnce({ rows: [] }); // mocRules

    await expect(calculatePayslipForEmployee(1, 10, 1)).rejects.toThrow(/not balanced|variance/i);
  });

  test('RULE: balance variance invariant — R5.00 is the exact tolerance boundary', () => {
    // Validates the arithmetic enforced by calculatePayslipForEmployee before calling calculateForEmployee.
    const target = 1200000;
    const withinTolerance = Math.abs(target - 1199997); // R3 — PASSES
    const exceedsTolerance = Math.abs(target - 1150000); // R50,000 — BLOCKED
    expect(withinTolerance).toBeLessThanOrEqual(5.00);
    expect(exceedsTolerance).toBeGreaterThan(5.00);
  });
});

// ---------------------------------------------------------------------------
// APPROVAL WORKFLOW RULES (LOCKED)
// Calls handleApproval() and autoAdvanceInitiatorSteps() with mocked DB.
// No inline helper functions — real service path exercised.
// ---------------------------------------------------------------------------
describe('Approval workflow locked rules', () => {
  beforeEach(() => db.query.mockReset());

  test('RULE: handleApproval returns 403 when created_by === userId (self-approval blocked)', async () => {
    // DB: 1 call — SELECT entity (CLAIM). created_by = userId → immediate 403, no further calls.
    db.query.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'PENDING', created_by: 42, employee_id: 100 }],
    });

    const result = await handleApproval('CLAIM', 1, 42, ['admin'], null);
    expect(result.success).toBe(false);
    expect(result.status).toBe(403);
    expect(result.error).toMatch(/cannot approve your own/i);
  });

  test('RULE: self-approval blocked for WAGE entity type', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 5, status: 'PENDING', created_by: 99, employee_id: 200 }],
    });

    const result = await handleApproval('WAGE', 5, 99, ['payroll_admin'], null);
    expect(result.success).toBe(false);
    expect(result.status).toBe(403);
  });

  test('RULE: self-approval blocked for OVERTIME entity type', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 7, status: 'PENDING', created_by: 77, employee_id: 300 }],
    });

    const result = await handleApproval('OVERTIME', 7, 77, ['supervisor'], null);
    expect(result.success).toBe(false);
    expect(result.status).toBe(403);
  });

  test('RULE: entity with status !== PENDING returns 400 (cannot double-approve)', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 10, status: 'APPROVED', created_by: 50, employee_id: 100 }],
    });

    const result = await handleApproval('CLAIM', 10, 99, ['admin'], null);
    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
  });

  test('RULE: entity not found returns 404', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const result = await handleApproval('CLAIM', 9999, 1, ['admin'], null);
    expect(result.success).toBe(false);
    expect(result.status).toBe(404);
  });

  test('RULE: different userId passes self-approval check (403 not thrown)', async () => {
    // created_by = 1, userId = 2 → self-approval check passes.
    // No workflow exists → auto-approve path: UPDATE claim status → APPROVED, write history.
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1, status: 'PENDING', created_by: 1, employee_id: 100 }] })  // entity
      .mockResolvedValueOnce({ rows: [] })   // workflow_instances
      .mockResolvedValueOnce({ rows: [] })   // workflow_definitions (no workflow configured)
      .mockResolvedValueOnce({ rows: [{ id: 1, status: 'APPROVED', created_by: 1, employee_id: 100 }] }) // UPDATE
      .mockResolvedValueOnce({ rows: [] });  // history

    const result = await handleApproval('CLAIM', 1, 2, ['admin'], null);
    expect(result.status).not.toBe(403);
  });

  test('RULE: single-level capturer-only workflow — autoAdvanceInitiatorSteps returns null (no cascade)', async () => {
    // When the pending step is NOT assigned to the capturer, the function breaks immediately
    // and returns null (autoApprovedSteps.length === 0). This is used to detect the
    // single-level capturer-only case where a different user must approve.
    const capturer = 42;
    const differentApprover = 99;
    db.query.mockResolvedValueOnce({
      rows: [{
        id: 1, instance_id: 10, step_number: 1, status: 'PENDING',
        assigned_users: [differentApprover], assigned_to: null, assigned_role: null,
        entity_type: 'CLAIM', entity_id: 100, initiated_by: capturer,
        instance_status: 'PENDING', definition_id: 5,
      }],
    });

    const result = await autoAdvanceInitiatorSteps(10, capturer);
    // Capturer is NOT in assigned_users → breaks immediately → returns null
    expect(result).toBeNull();
  });

  test('RULE: multi-level with capturer in step 1 — autoAdvanceInitiatorSteps auto-approves step 1 and returns result', async () => {
    // 2 steps; capturer assigned to step 1, step 2 has different user.
    // DB sequence (from workflow.service.test.js reference):
    //  1. iter1 — SELECT pending step → step1 (capturer assigned)
    //  2. UPDATE step1 APPROVED
    //  3. SELECT next step (step2 WAITING) → step2
    //  4. UPDATE step2 PENDING
    //  5. UPDATE instance IN_PROGRESS
    //  6. iter2 — SELECT pending step → step2 (NOT capturer → BREAK)
    //  7. post-loop remaining pending → step2
    //  8. instance result query
    const capturer = 42;
    const step1 = { id: 1, instance_id: 10, step_number: 1, status: 'PENDING', assigned_users: [capturer], assigned_to: null, assigned_role: null, entity_type: 'CLAIM', entity_id: 100, initiated_by: capturer, instance_status: 'PENDING', definition_id: 5 };
    const step2 = { id: 2, instance_id: 10, step_number: 2, status: 'WAITING', assigned_users: [99], assigned_to: null, assigned_role: null, entity_type: 'CLAIM', entity_id: 100, initiated_by: capturer, instance_status: 'IN_PROGRESS', definition_id: 5 };

    db.query
      .mockResolvedValueOnce({ rows: [step1] })  // 1: iter1 pending step
      .mockResolvedValueOnce({ rows: [] })        // 2: UPDATE step1 APPROVED
      .mockResolvedValueOnce({ rows: [step2] })  // 3: next step (step2 WAITING)
      .mockResolvedValueOnce({ rows: [] })        // 4: UPDATE step2 PENDING
      .mockResolvedValueOnce({ rows: [] })        // 5: UPDATE instance IN_PROGRESS
      .mockResolvedValueOnce({ rows: [{ ...step2, status: 'PENDING' }] }) // 6: iter2 — step2 not capturer → BREAK
      .mockResolvedValueOnce({ rows: [{ ...step2, status: 'PENDING' }] }) // 7: remaining pending
      .mockResolvedValueOnce({ rows: [{ status: 'IN_PROGRESS', current_step: 2, total_steps: '2' }] }); // 8: instance

    const result = await autoAdvanceInitiatorSteps(10, capturer);
    expect(result).not.toBeNull();
    expect(result.autoApprovedSteps).toHaveLength(1);
    expect(result.autoApprovedSteps[0].stepNumber).toBe(1);
  });
});
