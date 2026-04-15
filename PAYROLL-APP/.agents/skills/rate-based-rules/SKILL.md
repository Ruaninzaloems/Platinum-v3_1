---
name: rate-based-rules
description: Authoritative, locked-in business rules for Rate Based employees. Use whenever modifying payroll engine, salary resolution, employee detail, wages workflow, or any code that touches salary_based_on, wage_rate, wage_transactions, or rate calculations for Rate Based employees. These rules MUST NOT be changed without explicit user authorization.
---

# Rate Based Business Rules (LOCKED — Do Not Change)

**These rules are finalized and locked. Any agent or developer modifying Rate Based behavior MUST read and follow these rules exactly. Do NOT change any Rate Based logic without explicit user authorization.**

## 1. Employee Classification

A **Rate Based employee** is identified by the ABSENCE of both Task Grade and Upper Limit assignments:
- The employee's job profile has NO `upper_limit_id` (not an Upper Limit employee)
- The employee has NO `task_grade_id` (direct or via job profile — not a Task Grade employee)

**Precedence:** In `resolveEmployeeSalaryStructure`, the resolution order is:
1. Upper Limit (checked first — highest precedence)
2. Task Grade (checked second)
3. Fixed / Rate Based (fallback — `salarySource = 'FIXED'`)

A Rate Based employee always falls through to the FIXED path.

**Detection (frontend):**
```typescript
get payStructureType(): string {
  if (this.isUpperLimitEmployee) return 'Upper Limit';
  if (this.isTaskGradeEmployee) return 'Task Grade';
  return 'Rate Based';
}
```

**Detection (backend — resolveEmployeeSalaryStructure):**
```javascript
if (resolvedSalary === null) {
  resolvedSalary = parseFloat(emp.annual_salary) || 0;
  salarySource = 'FIXED';
}
```

**Detection (employee list query):**
```sql
CASE
  WHEN jp.task_grade_id IS NOT NULL THEN 'Task Grade'
  WHEN jp.upper_limit_id IS NOT NULL THEN 'Upper Limit'
  ELSE 'Rate Based'
END AS salary_type
```

## 2. Salary Based On

The `salary_based_on` field on the `employees` table determines how the employee's rate is configured:

| Value | Label | Meaning |
|-------|-------|---------|
| `CAPTURED_VALUE` | Captured Value | The rate is entered directly as a fixed value; wage_rate field is disabled/greyed out on employee master |
| `RATE_PER_HOUR` | Rate Per Hour | The rate represents an hourly rate; eligible for wages capture |
| `RATE_PER_DAY` | Rate Per Day | The rate represents a daily rate; eligible for wages capture |
| `FIXED_RATE` | Fixed Rate | The rate entered becomes the fixed basic salary on the payslip; wage_rate field is active with "Fixed Rate" label |

Default: `CAPTURED_VALUE`

### Wages Eligibility by Salary Based On
Only employees with `salary_based_on` IN (`RATE_PER_HOUR`, `RATE_PER_DAY`) appear on the Wages page and can have wage transactions captured. Employees with `CAPTURED_VALUE` or `FIXED_RATE` are excluded from the Wages workflow entirely.

### Wage Rate Field Behavior
| salary_based_on | wage_rate Field | Label |
|-----------------|----------------|-------|
| `CAPTURED_VALUE` | Disabled (greyed out, read-only) | "Rate" |
| `RATE_PER_HOUR` | Active, prominent yellow border | "Hourly Rate" |
| `RATE_PER_DAY` | Active, prominent yellow border | "Daily Rate" |
| `FIXED_RATE` | Active, prominent yellow border | "Fixed Rate" |

## 3. BASIC Salary Source

**For Rate Based employees, the BASIC salary depends on `salary_based_on`:**

| `salary_based_on` | `resolveMonthlyBasic` returns | Source |
|-------------------|-------------------------------|--------|
| `RATE_PER_HOUR` | `0` | Earnings come from approved `wage_transactions` only |
| `RATE_PER_DAY` | `0` | Earnings come from approved `wage_transactions` only |
| `CAPTURED_VALUE` | `0` | BASIC comes from `employee_payslip_transactions` (every_month=TRUE); R0.00 if no BASIC entry exists |
| `FIXED_RATE` | `wage_rate` | The `wage_rate` field on the employee master becomes the fixed basic |

```javascript
function resolveMonthlyBasic(emp, periodsPerYear) {
  const monthlySalary = parseFloat(emp.monthly_salary) || 0;
  const annualSalary = parseFloat(emp.annual_salary) || 0;

  // Task Grade employees: always use monthly_salary regardless of salary_based_on
  if (emp.task_grade_id) {
    if (monthlySalary <= 0) throw new Error(`Basic salary for Task Grade employee ... is R0.00.`);
    return monthlySalary;
  }

  // Rate Based salary_based_on logic (only for non-Task-Grade, non-Upper-Limit employees)
  if (emp.salary_based_on === 'RATE_PER_HOUR' || emp.salary_based_on === 'RATE_PER_DAY') {
    return 0;
  }
  if (emp.salary_based_on === 'CAPTURED_VALUE') {
    return 0;
  }
  if (emp.salary_based_on === 'FIXED_RATE') {
    return parseFloat(emp.wage_rate) || 0;
  }
  // Fallback for employees without salary_based_on set
  ...
}
```

**BASIC transaction overwrite guard:** When `monthlyBasic` is resolved, the engine normally overwrites any existing BASIC transaction's amount. For Rate Based employees with `CAPTURED_VALUE`, `RATE_PER_HOUR`, or `RATE_PER_DAY`, the overwrite is SKIPPED — allowing the captured amount from `employee_payslip_transactions` to flow through. This guard is gated on `!emp.task_grade_id` so Task Grade employees with the default CAPTURED_VALUE are NOT affected.

**Key rules:**
- `RATE_PER_HOUR` / `RATE_PER_DAY`: BASIC is always R0.00. All earnings come from approved wage transactions. The payslip engine MUST NOT throw an error for zero basic.
- `CAPTURED_VALUE`: `resolveMonthlyBasic` returns 0. BASIC comes from `employee_payslip_transactions` (every_month=TRUE). If no BASIC entry exists in payslip transactions, BASIC is R0.00. No error thrown.
- `FIXED_RATE`: BASIC equals `wage_rate` from the employee master.
- **salary_based_on only applies to Rate Based employees** (no task_grade_id, no upper_limit). Task Grade and Upper Limit employees are resolved before salary_based_on is checked.

## 4. Database Columns

### `employees` table (rate-related columns)

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `salary_based_on` | VARCHAR(30) | `'CAPTURED_VALUE'` | How the rate is configured |
| `wage_rate` | NUMERIC(12,4) | `0` | The captured rate value (hourly, daily, or fixed) |
| `working_hours_per_day` | NUMERIC(4,2) | `8.00` | Standard working hours per day |
| `working_days_per_week` | NUMERIC(3,1) | `5.0` | Standard working days per week |
| `working_hours_per_month` | NUMERIC(6,2) | varies | Total working hours per month |
| `working_days_per_month` | NUMERIC(5,2) | varies | Total working days per month |
| `allow_overtime` | BOOLEAN | `false` | Whether overtime is allowed |
| `exclude_sdl` | BOOLEAN | `false` | Whether to exclude from SDL |
| `exclude_uif` | BOOLEAN | `false` | Whether to exclude from UIF |
| `tax_method` | VARCHAR(20) | `'TAX_TABLES'` | Method of tax calculation |

### `wage_transactions` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL PK | Auto-increment primary key |
| `employee_id` | INTEGER FK → employees(id) | Employee reference |
| `salary_head_id` | INTEGER FK → salary_heads(id) | Which salary head this wage applies to |
| `period_id` | INTEGER FK → payroll_periods(id) | Payroll period reference |
| `cycle_id` | INTEGER | Payroll cycle reference |
| `hours` | NUMERIC | Hours worked (for hourly rate employees) |
| `days` | NUMERIC | Days worked (for daily rate employees) |
| `rate` | NUMERIC | Rate used for this transaction |
| `amount` | NUMERIC | Calculated amount (hours × rate or days × rate) |
| `status` | VARCHAR | `PENDING`, `APPROVED`, `REJECTED`, `PROCESSED` |
| `approved_by` | INTEGER | User who approved |
| `approved_at` | TIMESTAMP | When approved |

## 5. Computed Rate Formulas

The employee detail page displays three computed rate values:

```typescript
get ratePerDay(): number {
  const days = Number(this.emp.working_days_per_month) || 0;
  return days > 0 ? Math.round((this.monthlyFixedSalary / days) * 100) / 100 : 0;
}

get ratePerHour(): number {
  const hrs = Number(this.emp.working_hours_per_month) || 0;
  return hrs > 0 ? Math.round((this.monthlyFixedSalary / hrs) * 100) / 100 : 0;
}

get ratePerWeek(): number {
  return this.ratePerDay * (Number(this.emp.working_days_per_week) || 0);
}
```

| Field | Formula | Dependencies |
|-------|---------|-------------|
| Rate Per Day | `monthlyFixedSalary / working_days_per_month` | Monthly salary, working days/month |
| Rate Per Hour | `monthlyFixedSalary / working_hours_per_month` | Monthly salary, working hours/month |
| Rate Per Week | `ratePerDay × working_days_per_week` | Rate per day, working days/week |

## 6. Wages Workflow

Rate Based employees use the Wages Workflow to capture hours/days worked per period:

### Eligibility
**ONLY employees with `salary_based_on` IN (`RATE_PER_HOUR`, `RATE_PER_DAY`) are eligible for wages capture.** Employees with `CAPTURED_VALUE` or `FIXED_RATE` are excluded.

### Employee Filtering (Backend)
```sql
WHERE e.status = 'ACTIVE' AND e.enabled = TRUE
  AND e.task_grade_id IS NULL AND jp.task_grade_id IS NULL AND jp.upper_limit_id IS NULL
  AND e.salary_based_on IN ('RATE_PER_HOUR', 'RATE_PER_DAY')
```

### Server-Side Validation
POST and PUT for wage transactions enforce:
1. Employee must be Rate Based (no task_grade_id, no upper_limit_id)
2. Employee's `salary_based_on` must be `RATE_PER_HOUR` or `RATE_PER_DAY`

### Salary Transaction Filtering (IRP5 3601)
On the Wages page, the salary transaction dropdown is filtered per employee:
- Only salary heads linked to the employee via `employee_salary_transactions` table
- Only salary heads with `irp5_code = '3601'`
- Endpoint: `GET /payroll/wages/employee-salary-transactions/:employeeId`

### Flow:
1. **Capture** — User enters hours or days worked for a specific period and salary head
2. **Amount Calculation**:
   - If `RATE_PER_HOUR`: `amount = hours × (wage_rate || entered_rate)`
   - If `RATE_PER_DAY`: `amount = days × (wage_rate || entered_rate)`
3. **Approval** — Wage transactions follow `PENDING → APPROVED / REJECTED` workflow
4. **Payroll Integration** — Only `APPROVED` wage transactions are pulled into payslip calculation

### Payroll Engine Integration:
```javascript
const wageTransResult = await dbQuery(
  `SELECT wt.salary_head_id, wt.hours, wt.days, wt.rate, wt.amount, ...
   FROM wage_transactions wt
   JOIN salary_heads sh ON wt.salary_head_id = sh.id
   WHERE wt.employee_id = $1 AND wt.period_id = $2 AND wt.status = 'APPROVED'`,
  [employeeId, period.id]
);
```

Wage transactions are added to the payslip as additional earnings with `is_wage_transaction: true`. They supplement (not replace) the BASIC salary.

### Wages Form Display Fields
The wages form shows two read-only fields when an employee is selected:
- **Rate** — label is "Rate Per Hour" or "Rate Per Day" based on employee's `salary_based_on`; shows `wage_rate` from employee master
- **Total** — computed as `unit × rate`

The wages data grid includes Rate and Total columns showing `tx.rate` and `tx.amount` for each row.

## 7. UI Display Rules (Employee Detail Component)

### Banner
- Shows "Pay Structure: Rate Based" for employees without Task Grade or Upper Limit

### Hours & Rates Tab Layout
Two-column layout: editable inputs on the left, computed rate cards on the right.

**Left Column (Inputs):**
- Row 1: Salary Based On | Rate (wage_rate — label changes contextually)
- Row 2: Working Hours Per Day | Working Days Per Week
- Row 3: Working Hours Per Month | Working Days Per Month

**Right Column (Computed Rate Cards):**
- Rate Per Day card
- Rate Per Week card
- Rate Per Hour card

### Conditional Wage Rate Prominence
When `salary_based_on` is `RATE_PER_HOUR`, `RATE_PER_DAY`, or `FIXED_RATE`, the Rate field:
- Gets a yellow highlight border (`wage-rate-prominent` CSS class)
- Label changes to "Hourly Rate", "Daily Rate", or "Fixed Rate" respectively
- Font weight and size increase for visual emphasis

When `salary_based_on` is `CAPTURED_VALUE`:
- The field is disabled/greyed out (read-only)
- Shows as a standard "Rate" display

### Field Editability
| Field | Editable | Notes |
|-------|----------|-------|
| Salary Based On | Yes | Dropdown with 4 options |
| Rate (wage_rate) | Conditional | Active for RATE_PER_HOUR, RATE_PER_DAY, FIXED_RATE; disabled for CAPTURED_VALUE |
| Working Hours Per Day | Yes | Numeric input, default 8.00 |
| Working Days Per Week | Yes | Numeric input, default 5.0, max 7 |
| Working Hours Per Month | Yes | Numeric input |
| Working Days Per Month | Yes | Numeric input |
| Rate Per Day | No | Computed card: monthlyFixedSalary / working_days_per_month |
| Rate Per Week | No | Computed card: ratePerDay × working_days_per_week |
| Rate Per Hour | No | Computed card: monthlyFixedSalary / working_hours_per_month |

## 8. Key Constraints Summary

1. **Rate Based = no Task Grade + no Upper Limit** — identified by absence of both assignments
2. **BASIC depends on salary_based_on** — RATE_PER_HOUR/DAY → R0.00 (wages provide earnings); CAPTURED_VALUE → R0.00 (basic from employee_payslip_transactions); FIXED_RATE → wage_rate. salary_based_on only applies to Rate Based employees (no task_grade_id)
3. **Wage transactions are supplementary** — for RATE_PER_HOUR/DAY they provide the actual earnings; for others they add variable earnings on top of BASIC
4. **Only APPROVED wages count** — wage transactions must be approved before payroll pickup
5. **Three computed rates displayed** — Rate Per Day, Rate Per Week, Rate Per Hour (all derived from monthly salary and working time fields)
6. **Salary Based On determines wage capture mode** — RATE_PER_HOUR captures hours, RATE_PER_DAY captures days; CAPTURED_VALUE and FIXED_RATE do NOT participate in wages
7. **Four salary_based_on options** — CAPTURED_VALUE (default, rate disabled), RATE_PER_HOUR, RATE_PER_DAY, FIXED_RATE
8. **Wages filtered to IRP5 3601** — Salary transaction dropdown on wages page only shows heads with irp5_code='3601' linked to the employee via employee_salary_transactions
9. **Server-side validation** — POST/PUT wage transactions reject employees with salary_based_on not in (RATE_PER_HOUR, RATE_PER_DAY)
10. **Shift & Rotation** — placeholder fields exist in the UI but are not yet implemented (to be built with HR dev)

## Implementation File References

- `src/server/services/payroll-engine.js` — `resolveMonthlyBasic` (fallback logic), `calculatePayslipForEmployee` (wage transaction injection), `resolveEmployeeSalaryStructure` (FIXED fallback)
- `src/server/routes/payroll.routes.js` — wage employee listing (`/wages/employees`), wage transaction CRUD and approval, employee salary transactions endpoint (`/wages/employee-salary-transactions/:employeeId`)
- `src/server/routes/employee.routes.js` — employee save/update includes `salary_based_on`, `wage_rate`, `working_hours_per_day`, `working_days_per_week`
- `src/database/schema.sql` — `employees` table (rate columns), `wage_transactions` table
- `client/src/app/features/employees/components/employee-detail.component.ts` — `ratePerDay`, `ratePerHour`, `ratePerWeek`, `payStructureType`, `workingHoursPerDay`, `getSalaryBasedOnLabel` getters
- `client/src/app/features/employees/components/employee-detail.component.html` — Hours & Rates tab layout
- `client/src/app/features/payroll/components/wages/wages.component.ts` — Wages workflow UI, employee salary heads loading, rate/total getters
- `client/src/app/features/payroll/components/wages/wages.component.html` — Wages form with Rate/Total fields, filtered salary transaction dropdown
