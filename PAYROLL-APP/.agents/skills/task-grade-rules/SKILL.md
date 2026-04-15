---
name: task-grade-rules
description: Authoritative, locked-in business rules for Task Grade employees. Use whenever modifying payroll engine, salary resolution, employee detail, salary increases, or any code that touches task_grade_id, current_notch, monthly_salary for Task Grade employees. These rules MUST NOT be changed without explicit user authorization.
---

# Task Grade Business Rules (LOCKED — Do Not Change)

**These rules are finalized and locked. Any agent or developer modifying Task Grade behavior MUST read and follow these rules exactly. Do NOT change any Task Grade logic without explicit user authorization.**

## 1. Employee Classification

A **Task Grade employee** is identified by having a task grade assignment:
- `employees.task_grade_id IS NOT NULL` (direct assignment), OR
- The employee's job profile has a `task_grade_id` (inherited as `jp_task_grade_id` at query time)

**Interaction with Upper Limit:** In `resolveEmployeeSalaryStructure`, the Upper Limit path is checked FIRST (higher precedence). If the employee matches an Upper Limit, the Task Grade path is skipped entirely. The frontend `isTaskGradeEmployee` getter explicitly excludes Upper Limit employees (`!this.isUpperLimitEmployee`). This is precedence-based, not a definitional exclusion — an employee could have both `task_grade_id` and an Upper Limit assignment, in which case Upper Limit wins.

**Detection (frontend):**
```typescript
get isTaskGradeEmployee(): boolean {
  return !!this.emp.task_grade_id && !this.isUpperLimitEmployee;
}
```
Note: Frontend uses only `emp.task_grade_id` (direct). The `jp_task_grade_id` fallback is backend-only.

**Detection (backend — resolveEmployeeSalaryStructure):**
```javascript
const effectiveTaskGradeId = emp.task_grade_id || emp.jp_task_grade_id || null;
if (resolvedSalary === null && effectiveTaskGradeId && emp.current_notch) {
  // Task Grade path — uses effectiveTaskGradeId which includes jp_task_grade_id fallback
  salarySource = 'TASK_GRADE';
}
```
The backend considers an employee as Task Grade if EITHER `task_grade_id` or `jp_task_grade_id` (from their job profile) is set, combined with a `current_notch` value.

**Detection (resolveMonthlyBasic):**
```javascript
if (emp.task_grade_id && monthlySalary <= 0) {
  throw new Error(...);
}
```
Note: `resolveMonthlyBasic` checks only `emp.task_grade_id` (direct), not `jp_task_grade_id`.

## 2. BASIC Salary Source

**Rule: `employees.monthly_salary` is the SINGLE source of truth for a Task Grade employee's BASIC salary.**

- BASIC = `employees.monthly_salary` (monthly value)
- Annual salary = `monthly_salary * 12` (always derived, never the source)
- `basicAnnual = monthlyBasic * periodsPerYear` (used for tax calculations)

**There is NO fallback for employees with `task_grade_id` set directly.** If `monthly_salary` is 0 or null and `emp.task_grade_id` is set, `resolveMonthlyBasic` MUST throw an error. It must NOT fall back to `annual_salary`, notch values, or any other source at runtime.

**Important nuance on `jp_task_grade_id`:** `resolveMonthlyBasic` only checks `emp.task_grade_id` (direct assignment). Employees classified as Task Grade solely via `jp_task_grade_id` (job profile inheritance) will NOT trigger the Task Grade error in `resolveMonthlyBasic` — they may fall back to `annual_salary / periodsPerYear`. However, `resolveEmployeeSalaryStructure` uses `effectiveTaskGradeId = emp.task_grade_id || emp.jp_task_grade_id` and will error if `monthly_salary <= 0` for either path.

### Shared Helper: `resolveMonthlyBasic(emp, periodsPerYear)`

This is the SINGLE function used across ALL payroll paths:

```javascript
function resolveMonthlyBasic(emp, periodsPerYear) {
  const monthlySalary = parseFloat(emp.monthly_salary) || 0;
  const annualSalary = parseFloat(emp.annual_salary) || 0;
  if (emp.task_grade_id && monthlySalary <= 0) {
    throw new Error(`Basic salary for Task Grade employee ${emp.employee_code || emp.id} is R0.00.`);
  }
  if (monthlySalary <= 0 && annualSalary <= 0) {
    throw new Error(`Basic salary for employee ${emp.employee_code || emp.id} is R0.00.`);
  }
  return monthlySalary > 0 ? monthlySalary : parseFloat((annualSalary / periodsPerYear).toFixed(2));
}
```

**Critical constraint:** For Task Grade employees, the function ALWAYS errors if `monthlySalary <= 0`, regardless of `annualSalary`. For non-Task-Grade employees, it falls back to `annualSalary / periodsPerYear`.

### Paths that call `resolveMonthlyBasic`:

| Path | File | Purpose |
|------|------|---------|
| Payslip calculation | `payroll-engine.js` → `calculatePayslipForEmployee` | Individual payslip |
| Trial run | `payroll.routes.js` → `executeForEmployees` | Bulk trial run |
| Formula test | `payroll-engine.js` → `buildFormulaVariables` | MOC formula testing |

**All three paths MUST call `resolveMonthlyBasic`. Do NOT inline salary resolution logic.**

### Separate path: `resolveEmployeeSalaryStructure`

`resolveEmployeeSalaryStructure` does NOT call `resolveMonthlyBasic`. It performs its own inline monthly_salary check because it resolves the ANNUAL salary (not the monthly BASIC) and operates in a different resolution chain (Upper Limit → Task Grade → Fixed):

```javascript
const effectiveTaskGradeId = emp.task_grade_id || emp.jp_task_grade_id || null;
if (resolvedSalary === null && effectiveTaskGradeId && emp.current_notch) {
  const monthlySal = parseFloat(emp.monthly_salary) || 0;
  if (monthlySal <= 0) {
    throw new Error(`Task Grade employee ${emp.employee_code || employeeId} has no monthly salary set.`);
  }
  resolvedSalary = parseFloat((monthlySal * 12).toFixed(2));
  salarySource = 'TASK_GRADE';
}
```

This path enforces the same zero-salary error rule but derives `annualSalary = monthly_salary * 12` rather than returning a monthly value. The constraint is identical: Task Grade employees with 0/null `monthly_salary` always error.

## 3. Database Tables

### `task_grades`
- `id`, `grade_code` (unique), `grade_name`
- `min_salary`, `max_salary` — overall grade salary boundaries
- `notch_count` — number of notches in the grade
- `yearly_notch_level_increase` — default annual increase
- `use_employment_date` (BOOLEAN) — increase on employee anniversary?
- `notch_increase_month` (1–12) — specific month for increases if not using employment date
- `is_legacy`, `to_phase_out`, `task_skill_level_id`, `exclude_from_yearly_increase`

### `task_grade_notches`
- `id`, `task_grade_id` (FK → `task_grades`)
- `notch_number` — step position within the grade (1, 2, 3, ...)
- `min_salary`, `max_salary` — salary range for this specific notch
- `start_date`, `end_date` — validity period for notch values

### `employees` (relevant columns)
- `task_grade_id` (FK → `task_grades`) — which grade the employee is directly assigned to
- `current_notch` (INTEGER) — references a `task_grade_notches.id` by convention, but has NO formal FK constraint in the schema
- `monthly_salary` (NUMERIC 18,2) — the BASIC source of truth
- `annual_salary` (NUMERIC 18,2) — always = `monthly_salary * 12`

**Note on `jp_task_grade_id`**: This is not a column on `employees`. It is derived at query time from the employee's job profile/position and used as a fallback in `resolveEmployeeSalaryStructure` only.

## 4. Transaction Data Model

### `employee_salary_transactions` — Pure link table
- Links an employee to allowed salary heads (earnings, deductions, etc.)
- Contains NO amount, percentage, or included_in_package columns
- Columns: `id, employee_id, salary_head_id, start_date, end_date, enabled`

### `employee_payslip_transactions` — Amount storage
- Stores the actual `captured_amount` (monthly value) for non-BASIC transactions
- Has `included_in_package` flag (for salary structure/package calculations)
- Has `period_id`, `every_month`, `processed`, `reference_no`
- FK constraints to: `employee_salary_transactions`, `employees`, `salary_heads`, `payroll_periods`

**Rule: BASIC salary NEVER comes from a transaction table. It ALWAYS comes from `employees.monthly_salary`.**

## 5. Notch Selection & Salary Auto-Population

When a user selects or changes a notch on the Employee Detail screen:

1. `loadNotchesForGrade(gradeId)` fetches all notches for the selected grade
2. `onNotchChange()` fires:
   - Sets `monthly_salary = notch.min_salary` (defaults to the notch minimum)
   - Computes `annual_salary = monthly_salary * 12`
3. The user MAY manually adjust `monthly_salary` within the notch's min/max range
4. `onMonthlySalaryChange()` auto-recomputes `annual_salary = monthly * 12`

**Rule: Changing the notch always resets salary to the notch minimum. The user can then adjust within range.**

## 6. Validation Rules

### Frontend — Notch Range Validation
```typescript
get notchSalaryValid(): boolean {
  const salary = Number(this.emp.monthly_salary);
  const min = Number(this.selectedNotch.min_salary);
  const max = Number(this.selectedNotch.max_salary);
  return salary >= min && salary <= max;
}
```
- Validates `monthly_salary` against the SELECTED NOTCH's min/max
- Displays error hint: "Salary must be between R... and R..."

### Backend — Grade Range Validation (`validateSalaryRange`)
- Checks `annual_salary` against the ENTIRE GRADE's min/max across all notches
- Queries: `SELECT MIN(annual_value) AS min_salary, MAX(annual_value) AS max_salary FROM task_grade_notches WHERE task_grade_id = $1`
- **Note on column naming**: The actual DB columns are `min_salary` and `max_salary` (see schema). The code queries `annual_value` — this is a known mismatch. If `annual_value` does not exist as a column or alias, this query may silently return nulls and skip validation. Any fix to this must preserve the intent: validate against the grade's overall salary boundaries.
- Blocks saving if salary falls outside the grade's overall boundaries
- Called on employee create and update

### Engine — Zero Salary Enforcement
- `resolveMonthlyBasic` throws if `task_grade_id` is set and `monthly_salary <= 0`
- This is enforced identically in payslip, trial run, formula test, and structure resolution paths

## 7. Salary Increases

Three increase types are supported:

| Type | Logic | Effect |
|------|-------|--------|
| `PERCENTAGE` | `new = old * (1 + value/100)` | Percentage of current `annual_salary` |
| `AMOUNT` | `new = old + value` | Flat addition to `annual_salary` |
| `NOTCH` | Look up next notch's value | Moves to next notch number |

### NOTCH Increase Flow:
1. The current notch number is derived from `emp.current_notch`. **Important**: `employees.current_notch` stores a `task_grade_notches.id` (not a `notch_number`). The salary increase code uses `(emp.current_notch || 0) + 1` to find the next notch — this works because it treats the stored value as a notch number. This id-vs-number ambiguity is a known implementation detail.
2. Query: `SELECT annual_value FROM task_grade_notches WHERE task_grade_id = $1 AND notch_number = $2` (next notch number). **Note**: Code references `annual_value` but actual DB columns are `min_salary`/`max_salary` — same mismatch noted in validation section.
3. `new_salary = nextNotch.annual_value`
4. Record staged in `salary_increases` table with status `PENDING`

### Apply Flow (all types):
1. Status: `PENDING` → `APPROVED` → `APPLIED`
2. On apply: `UPDATE employees SET annual_salary = $1, monthly_salary = $2` where `monthly_salary = new_salary / 12`
3. History recorded in `employee_history`

**Rule: Both `annual_salary` and `monthly_salary` MUST be updated together on every salary change.**

## 8. Payslip Calculation Flow

For a Task Grade employee payslip:

1. `resolveMonthlyBasic(emp, periodsPerYear)` → returns `monthlyBasic` (errors if 0)
2. `basicAnnual = monthlyBasic * periodsPerYear`
3. BASIC transaction is set/injected with `amount = monthlyBasic`
4. Additional earnings/deductions come from `employee_payslip_transactions.captured_amount`
5. Tax (PAYE) calculated using `basicAnnual` for annualization
6. UIF/SDL calculated on monthly amounts
7. Net pay = gross earnings - deductions

**Rule: Trial run and payslip view MUST produce identical results for the same employee/period.**

## 9. UI Display Rules (Employee Detail Component)

| Field | Behavior |
|-------|----------|
| Task Grade | Typically inherited from the employee's position/job profile. May also be directly assigned via `task_grade_id`. |
| Notch dropdown | Shows notches for the employee's grade (loaded via `loadNotchesForGrade`). Selecting a notch triggers `onNotchChange()` which sets `monthly_salary = notch.min_salary`. |
| Monthly Salary | Editable input; validated against the selected notch's min/max range via `notchSalaryValid` getter. |
| Annual Salary | Read-only; auto-computed as `monthly_salary * 12` via `onMonthlySalaryChange()`. |
| `isTaskGradeEmployee` getter | Returns `true` when `task_grade_id` is set AND not an Upper Limit employee. Used to conditionally show Task Grade specific UI elements. |

## 10. Key Constraints Summary

1. **`monthly_salary` is the source of truth** — never derive BASIC from `annual_salary` or transaction amounts for Task Grade employees
2. **Error, never fallback** — if `monthly_salary` is 0/null for a Task Grade employee, throw an error in ALL code paths
3. **Use `resolveMonthlyBasic` in payslip/trial-run/formula paths** — do NOT inline salary resolution logic in those paths. `resolveEmployeeSalaryStructure` has its own inline check (returns annual, not monthly) but enforces the same zero-salary constraint
4. **Update both fields together** — any salary change MUST update both `monthly_salary` and `annual_salary`
5. **Trial run = payslip** — both paths must use the same shared helper and produce identical results
6. **BASIC is not a transaction** — it comes from `employees.monthly_salary`, not from any row in `employee_salary_transactions` or `employee_payslip_transactions`
7. **Notch selection defaults to minimum** — changing a notch sets `monthly_salary = notch.min_salary`
8. **Salary must be within range** — frontend validates against notch min/max; backend validates against grade min/max

## Implementation File References

- `src/server/services/payroll-engine.js` — `resolveMonthlyBasic`, `calculatePayslipForEmployee`, `resolveEmployeeSalaryStructure`, `buildFormulaVariables`
- `src/server/routes/payroll.routes.js` — trial run employee query (selects `task_grade_id`, `current_notch`), salary increase endpoints
- `src/server/middleware/validation.js` — `validateSalaryRange`
- `client/src/app/features/employees/components/employee-detail.component.ts` — `onNotchChange`, `onMonthlySalaryChange`, `notchSalaryValid`, `isTaskGradeEmployee`
- `src/database/schema.sql` — `task_grades`, `task_grade_notches`, `employees` table definitions
