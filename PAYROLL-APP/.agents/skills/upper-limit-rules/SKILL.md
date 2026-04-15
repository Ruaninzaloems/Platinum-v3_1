---
name: upper-limit-rules
description: Authoritative, locked-in business rules for Upper Limit employees. Use whenever modifying payroll engine, salary structure, salary resolution, or any code that touches upper_limit_id, employee_upper_limit_structure, salary structure CRUD, or balance validation for Upper Limit employees. These rules MUST NOT be changed without explicit user authorization.
---

# Upper Limit Business Rules (LOCKED — Do Not Change)

**These rules are finalized and locked. Any agent or developer modifying Upper Limit behavior MUST read and follow these rules exactly. Do NOT change any Upper Limit logic without explicit user authorization.**

## 1. Employee Classification

An **Upper Limit employee** is identified by having an upper limit assignment via their job profile:
- The employee's position → job_profile has `upper_limit_id IS NOT NULL` (referencing `salary_upper_limits` table)

**Interaction with Task Grade:** In `resolveEmployeeSalaryStructure`, the Upper Limit path is checked FIRST (higher precedence). If the employee matches an Upper Limit, the Task Grade path is skipped entirely.

**Detection is by classification, NOT by structure row presence.** An employee with an Upper Limit assignment but no structure rows is still treated as Upper Limit — balance validation will fire (target vs R0 = hard error), forcing the structure to be populated before payroll can run.

**Detection (frontend):**
```typescript
get isUpperLimitEmployee(): boolean {
  return !!this.emp.upper_limit_id;
}
```

**Detection (backend — resolveEmployeeSalaryStructure):**
```javascript
const upperLimitId = emp.jp_upper_limit_id || null;
if (upperLimitId) {
  // Upper Limit path — checked BEFORE Task Grade
  salarySource = 'UPPER_LIMIT';
}
```

## 2. Data Model

### `employee_upper_limit_structure` — The Structure Table

This is the SINGLE source of salary structure data for Upper Limit employees.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL PK | Auto-increment primary key |
| `employee_id` | INTEGER FK → employees(id) | Employee reference, CASCADE delete |
| `salary_head_id` | INTEGER FK → salary_heads(id) | Which salary head this row represents |
| `amount` | NUMERIC(18,2) | **ANNUAL** amount — ALL amounts stored are annual |
| `included_in_package` | BOOLEAN | Whether this row counts toward the package total |
| `captured_by` | INTEGER | User who created the row |
| `captured_at` | TIMESTAMP | When the row was created |
| `modified_by` | INTEGER | User who last modified the row |
| `modified_at` | TIMESTAMP | When the row was last modified |

**UNIQUE constraint:** `(employee_id, salary_head_id)` — one row per salary head per employee.

### Related Tables

- **`employee_salary_transactions`** — Pure link table. EST links are maintained in sync when structure rows are created (so the payroll engine sees the heads).
- **`employee_payslip_transactions`** — Additional one-off/periodic payslip transactions only. NOT used for recurring structure amounts.
- **`salary_upper_limits`** — Defines the target package values (minimum, midpoint, maximum) for each upper limit level.

## 3. Amount Convention

**ALL amounts in `employee_upper_limit_structure` are ANNUAL.**

- Structure table stores annual amounts
- Payslip calculation divides by 12 to get monthly: `monthlyAmount = annualAmount / 12`
- Package totals on the salary structure page are annual
- Target package from `salary_upper_limits` is annual
- Balance validation compares annual totals

## 4. BASIC Salary Source

**For Upper Limit employees, BASIC comes from the structure table at payslip time:**

```javascript
const basicStructRow = upperLimitStructureRows.find(sr => BASIC_CODES.has(sr.code));
if (basicStructRow) {
  monthlyBasic = parseFloat((basicStructRow.amount / 12).toFixed(2));
  basicAnnual = basicStructRow.amount;
}
```

**If no BASIC row exists in the structure table**, the engine throws a HARD ERROR — payslip calculation is blocked. UL employees MUST have a BASIC salary component in the structure table before payroll can run. There is NO fallback to `employees.monthly_salary`.

### BASIC Sync on Save

When a BASIC amount is saved in the structure table, the backend syncs to the employee master:
```javascript
employees.monthly_salary = BASIC_annual / 12
employees.annual_salary = BASIC_annual
```

This ensures `employees.monthly_salary` stays in sync as a denormalized cache, but the structure table is the authoritative source at payslip time.

When a BASIC structure row is **deleted**, the employee master is zeroed out (`monthly_salary = 0, annual_salary = 0`).

## 5. Balance Enforcement

**HARD ERROR — blocks payslip calculation and trial runs.**

The sum of all `included_in_package = TRUE` rows in the structure table must equal the target package within ±R5.00:

```javascript
let includedSum = 0;
for (const sr of upperLimitStructureRows) {
  if (sr.included_in_package) includedSum += parseFloat(sr.amount) || 0;
}
const balanceVariance = Math.abs(targetPackage - includedSum);
if (balanceVariance > 5.00) {
  throw new Error(`Upper Limit salary structure is not balanced...`);
}
```

**Tolerance:** R5.00 (to accommodate rounding differences)
**Enforcement points:**
- `calculatePayslipForEmployee` in payroll-engine.js
- `executeForEmployees` trial run loop in payroll.routes.js

## 6. Salary Structure Routes

The salary structure page operates entirely on the `employee_upper_limit_structure` table.

### `getMergedTransactions(employeeId, groupId)`
- Loads structure rows (source = 'EMPLOYEE') with annual amounts
- Loads inherited salary transaction group items (source = 'INHERITED') without amounts
- Merges and sorts by transaction type then priority

### `calculatePackageTotal(employeeId)`
- Sums annual amounts from structure table where `included_in_package = TRUE`
- Groups into `includedEarnings` (EARNING + FRINGE_BENEFIT) and `includedCompanyContributions`
- No longer takes `monthlySalary` parameter — BASIC is in the structure table

### CRUD Endpoints

| Endpoint | Operation | Table |
|----------|-----------|-------|
| `POST /employees/:id/transactions` | Create structure row + EST link | `employee_upper_limit_structure` + `employee_salary_transactions` |
| `PUT /employees/:id/transactions/:txnId` | Update amount | `employee_upper_limit_structure` |
| `PUT /employees/:id/transactions/:txnId/toggle-package` | Toggle included_in_package | `employee_upper_limit_structure` |
| `DELETE /employees/:id/transactions/:txnId` | Delete structure row | `employee_upper_limit_structure` |

**Note:** `txnId` in these endpoints refers to `employee_upper_limit_structure.id`, NOT `employee_salary_transactions.id`.

## 7. Payroll Engine Integration

### `resolveEmployeeSalaryStructure`
Returns additional fields for Upper Limit employees:
- `upperLimitStructureRows` — array of structure rows with salary head info
- `upperLimitTargetPackage` — the target package amount (based on value type)

### `calculatePayslipForEmployee`
For Upper Limit employees:
1. **Balance validation** — throws HARD ERROR if not balanced within ±R5.00
2. **BASIC resolution** — uses structure table BASIC row (annual ÷ 12); throws hard error if BASIC row is missing or R0
3. **Non-formula amounts** — structure table amounts (annual ÷ 12) override EST+EPT amounts
4. **Formula-based heads** (SYSTEM_CALCULATE, FORMULA) — still evaluated by formula engine
5. **Structure rows without EST links** — injected into transactions array directly

### Trial Run (`executeForEmployees`)
Bulk-loads all structure data upfront:
- `allUpperLimitStructure` — all structure rows
- `allUpperLimitTargets` — target packages for all UL employees
Then applies the same balance validation and amount resolution per employee.

**BASIC parity:** Before calling `calculateForEmployee`, the trial run overrides `emp.monthly_salary` and `emp.annual_salary` with the UL structure BASIC values. This ensures `resolveMonthlyBasic()` inside `calculateForEmployee` returns the correct structure-sourced BASIC, not a stale employee master value.

## 8. Formula-Based Transactions

Salary heads with `calculation_method = 'SYSTEM_CALCULATE'` or `'FORMULA'` are NOT overridden by structure table amounts, even if a structure row exists for them. The formula engine still evaluates them normally.

Examples: SDL, UIF employee/employer, PAYE — these are always calculated by the formula engine.

## 9. Salary Transaction Groups

Salary transaction groups still determine which heads apply to an employee. The structure table provides the amounts, but the group defines the available heads. Inherited group items (not yet in the structure table) appear as 'INHERITED' with no amount in the merged transaction list.

## 10. Key Constraints Summary

1. **ALL amounts are ANNUAL** — structure table stores annual, payslip divides by 12
2. **Balance must be within ±R5.00** — HARD ERROR blocks payslip/trial run
3. **BASIC comes from structure table** — not from `employees.monthly_salary` at payslip time
4. **BASIC syncs to employee master on save** — `monthly_salary = annual / 12`
5. **Formula heads are NOT overridden** — SYSTEM_CALCULATE and FORMULA heads use the formula engine
6. **EST links are maintained** — created alongside structure rows for payroll engine compatibility
7. **Upper Limit has higher precedence than Task Grade** — checked first in salary resolution

## Implementation File References

- `src/server/routes/salary-structure.routes.js` — getMergedTransactions, calculatePackageTotal, CRUD endpoints, syncBasicIfNeeded
- `src/server/services/payroll-engine.js` — resolveEmployeeSalaryStructure (loads structure rows), calculatePayslipForEmployee (balance validation, BASIC from structure, amount overrides)
- `src/server/routes/payroll.routes.js` — trial run bulk loading of structure data, per-employee balance validation
- `src/database/schema.sql` — `employee_upper_limit_structure` table definition
- `src/database/migrations/015_create_upper_limit_structure.sql` — migration script
- `client/src/app/features/salary-structure/components/salary-structure.component.ts` — frontend salary structure page
