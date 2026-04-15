# mSCOA HR & Payroll Management System

## Overview
This project aims to develop a world-class HR and Payroll module specifically for South African municipalities, fully compliant with mSCOA (Municipal Standard Chart of Accounts) requirements from National Treasury. It is designed to replace the existing Platinum ERP HR/Payroll module with a modern, compliant, and high-performance solution. The system must meet all South African regulations and laws (tax, labour, employment equity, bargaining councils), ensure 100% accuracy in GRAP and mSCOA treatment, and be 100% Auditor General compliant with full traceability and audit trails. The solution will benchmark against leading global ERP HR & Payroll modules like SAP, Oracle, SAGE/VIP, and Xero.

Key capabilities include:
- **HR & Payroll Budgeting:** Compensation budgeting and CoE projections.
- **HR Management:** Full employee lifecycle management, from recruitment to separation.
- **Leave Management:** Comprehensive leave tracking compliant with BCEA and municipal specifics.
- **Payroll Management:** Full payroll lifecycle, statutory returns, bank integration, flexible salary heads (user-defined earnings/deductions with percentage-of-basic and fixed-amount calculation methods), wage transaction capture (hourly/daily rates with approval workflow).
- **Wages Management:** Capture hourly/daily wage transactions per employee per period. Approval workflow (PENDING→APPROVED/REJECTED→PROCESSED). Approved wages auto-included in payroll engine calculations. Employee `salary_based_on` (CAPTURED_VALUE/RATE_PER_HOUR/RATE_PER_DAY) and `wage_rate` fields on employee detail.
- **Claims Management:** S&T (Subsistence & Travel) and Travel reimbursement claims capture under Payroll > Transactions > Claims. Employee lookup, claim type/sub-type selection from claim_configurations with SARS prescribed rate tariffs, auto-calculated claim values (km × rate for Travel, days × rate for S&T). Approval workflow integration (PENDING→APPROVED/REJECTED). Backend endpoints at `/api/v1/time/claims` with `reference_no` column on claims table.
- **Staff Performance Management:** KPI tracking, performance reviews, and PIP management.
- **Time & Attendance:** Biometric integration, shift management, and ghost employee detection.
- **Reports & Exports:** IRP5, EMP201, EMP501, e@syFile, payslip PDFs, EFT bank files, Excel/CSV exports.
- **Disciplinary & Grievance:** Case management, hearing tracking, CCMA referrals, LRA compliance.
- **Skills & Training:** Course catalogue, qualifications register, training records, WSP/ATR for LGSETA.
- **Recruitment:** Vacancy management, applicant tracking, interview scheduling, onboarding checklists.
- **Employment Equity:** Workforce profile (EEA2/EEA4), demographic analysis, numerical targets.
- **Notifications:** In-app notification bell with real-time unread count + approval workflow configuration.
- **GL Integration:** Configure mSCOA General Ledger mappings for salary transactions. Located under Configuration > Pay Structure > GL Integration. GL config stored in `payroll_gl_items` table (one row per salary head) with full audit trail in `payroll_gl_history`. Column names aligned with Platinum's `Payroll_GLItems` for GL subledger compatibility. Key columns: `scoa_project_id` (Salary Control Project), `suspense_scoa_item_id`/`suspense_scoa_item_credit_id` (Control Debit/Credit), `scoa_item_id_permanent_staff` (Municipal Staff), `scoa_item_id_post_retirement` (Post Retirement), `vendor_id`/`vendor_scoa_project_id`/`vendor_scoa_id` (Creditor Config), `plan_project_item_id` (shared for Override Project on earnings and Journal Entry Only on deductions), `scoa_item_id` (Revenue SCOA item for JE Only), `journal_entry_only`, `override_project`. SCOA reference tables (`scoa_items`, `scoa_funds`, `scoa_functions`, `scoa_projects`, `scoa_regions`, `scoa_costings`, `scoa_msc`) store segment lookup data. Backend route: `/api/v1/gl/`. Frontend route: `/settings/gl-integration`.

## User Preferences
This system must be built by assuming the following roles simultaneously:
- World's best Subject Matter Expert for ERP HR & Payroll modules
- World's best MFMA, mSCOA, Auditor General, Local Government HR & Payroll SME
- World's best Solutions Architect
- World's best Chartered Accountant and Tax Practitioner
Until real APIs are developed, use mock data that makes dashboards meaningful. The Platinum SPs/Functions are reference only — understand the logic, then improve upon it. The Platinum help manuals are reference only — do NOT copy the UI design. The screen design screenshots ARE the UI/UX direction to follow. DO NOT build anything until the user explicitly authorises it.

## System Architecture
The system is built on a modern tech stack:
- **Frontend**: Angular 21 (standalone components, lazy-loaded routes, hash routing)
  - Project location: `client/` directory
  - Build output: `public/dist/browser/` (served by Express)
  - Build command: `cd client && npx ng build --configuration=production`
  - Core structure: `client/src/app/core/` (services, models), `shared/` (components, pipes), `features/` (feature modules), `layout/` (sidebar, topbar)
  - Design system: Platinum SCM style guide ported to Angular global styles (`client/src/styles.css`)
  - Chart.js for dashboard charts
- **Legacy Frontend**: Vanilla JavaScript (SPA with module pattern) — still in `public/js/` and `public/css/` (to be removed after full migration verification)
- **Backend**: Node.js with Express for the API layer
- **Database**: PostgreSQL (97+ tables, including `salary_transaction_group_items` junction table)

**Performance Requirements:**
- Support 500 simultaneous connected users.
- Process 100,000 employees within 1 hour (covering various payroll types and deductions).

**Key Compliance Features:**
- **mSCOA 7-segment classification:** Applied to every transaction (item, fund, function, project, region, costing, MSC).
- Adherence to MFMA, BCEA, Labour Relations Act, Employment Equity Act, Municipal Systems Act, and Municipal Staff Regulations 2021.
- SARS compliance for PAYE, UIF, SDL (EMP201, EMP501, IRP5).
- GRAP accounting standards and Auditor General compliance with full audit trail.
- POPIA-ready Role-Based Access Control (RBAC) with field-level security.

**Cross-Cutting Features:**
- Role-based access control with workflow approvals.
- Full audit trail on every transaction.
- Document management integrated at all process points.
- AI analytics, trend analysis, and interactive dashboards with 9 Chart.js charts.
- Employee self-service portal.
- Configurable policy engine for municipality-specific rules.
- Configuration versioning for tax tables, earnings/deduction rules.
- Evidence vault for documents linked to transactions.
- Automated AG-style validation tests.
- Mock method of calculations and payslip feature.
- Streamlined payroll workflow: Trial Run → Review → Promote to Final (auto-locks) → Approve. Unlock reverts to Trial. No separate FINAL run creation needed.
- Employee Payslip View: Individual payslip calculation per employee within a payroll cycle. Resolves salary via structure chain (Employee→Position→JobProfile→SalaryTransGroup→UpperLimit), calculates PAYE using SARS tax tables (2026/2027), integrates medical aid credits and retirement fund fringe benefits. Supports add/remove transactions, PAYE breakdown viewer with bracket/rebate detail, employee navigation (prev/next/go-to).
- Payroll Run Workflow: Dedicated step-by-step payroll run page at `/payroll/run` with Trial→Approval→Final cycle. Select cycle, auto-loads OPEN period dates, execute Trial Run with progress modal, results summary grid (Emp No, Code, Name, Surname, Salary, Earnings, Deductions, Contributions, Fringe, Nett Salary with column filters and pagination). Lockdown Trial Run locks period, Unlock reverts. Final Run promotes TRIAL→FINAL, re-executes, and auto-locks. Backend filters employees by `payroll_cycle_id`. Endpoints: GET `/payroll/periods/open`, GET `/payroll/runs/find`, GET `/payroll/runs/:id/results-summary`.
- Integration into billing module for employee deductions.

**UI/UX Design Direction (Platinum SCM Style Guide):**
The UI follows the Platinum SCM Design System documented in `attached_assets/PLATINUM-SCM-STYLE-GUIDE_1772472187858.md`.
- **Brand Colors:** Primary navy `#0f2b46`, gold accent `#c9a84c`, surface `#f8f9fb`
- **Design Tokens:** All CSS variables defined as `--platinum-*` tokens in `:root` (dashboard.css). Includes pastel, gradient, and functional color variants.
- **Sidebar:** 240px, white background, green brand icon (#2e7d32), "PLATINUM" 17px/700/1.5px letter-spacing. Flat section-based navigation with uppercase green section headers (e.g. "HR MANAGEMENT", "PAYROLL", "CONFIGURATION · COMPANY"), subtle divider lines between sections, flat item list with icon + label (no accordion/chevron toggles). Active nav = blue text + light blue bg. Collapsed mode shows icon-only view.
- **Topbar:** 56px sticky, municipality name, breadcrumb, green period badge, gold "AG READY" audit badge, notification bell, workflow config gear, dark navy API button, user avatar circle.
- **KPI Cards:** Row layout with icon-wrap (48px rounded square, pastel bg) + colored left border. Hover = translateY(-2px) + shadow upgrade.
- **Data Tables:** 11px uppercase headers, #f8fafc bg, 2px bottom border, row hover #f8fafc.
- **Status Badges:** Pill-shaped (border-radius: 20px), 11px uppercase, pastel bg + dark text. 18+ status variants.
- **Tabs:** Underline style, 13px, blue active (#3b82f6) with 2px bottom border.
- **Modals:** 16px radius, 0 20px 60px shadow, structured header/body/footer.
- **Forms:** 11px uppercase labels, 8px radius inputs, blue focus ring.
- **Workflow Steppers:** Circle indicators, green=completed, blue=active, connector lines.
- Status workflow counters (DRAFT → SAVED → SUBMITTED → SUPERVISOR → HOD REVIEW → APPROVED → ROUTED → COMPLETED → REJECTED → VOIDED).
- WHITE background ONLY (#FFFFFF). Soft milky pastel palette. KPI cards use colored LEFT BORDER.
- NO emoji — inline SVG only via icon() helper.

**Technical Implementations:**
- PostgreSQL database schema includes mSCOA 7-segment columns, audit columns, indexes, and foreign keys.
- Express MVC backend features a full middleware stack (auth, audit, error handling, validation, rate limiting).
- All API routes implemented for key modules (employees, departments, payroll, leave, benefits, etc.), documented with Swagger UI.
- Mock data seeding for development and testing (5,025 employees with 42,786 salary transactions via seed-5000.js).

**New Tables Added (Gap Remediation):**
permissions, user_roles, workflow_steps, delegations, leave_policies, claim_rates, benefit_rate_tables, life_events, arrears, ee_occupational_levels, competencies, competency_levels, position_competencies, employee_competencies, performance_reviews, performance_review_items, applicant_scores, councillor_upper_limits, salary_increases, sars_prescribed_rates, claim_configurations

**New Backend Services:**
- rbac.js (role-based access control with field-level security)
- validation.js (SA ID Luhn, tax number CDV, bank CDV, duplicate detection, BCEA minimum wage)
- workflow.service.js (multi-step workflow engine with escalation)
- termination.service.js (BCEA notice/severance/leave payout/pro-rata bonus/UI-8 PDF)
- leave-engine.service.js (BCEA sick leave cycle, working day calc, GRAP 25 leave liability + bonus accrual)
- payroll-engine.js enhanced with ETI calculation
- payroll-engine.js enhanced with MOC (Method of Calculation) formula engine: evaluateFormulaV2 (IF/MIN/MAX/ROUND/ABS, [CODE] cross-reference, comparison operators), resolveMOCRule (specificity scoring by CoS/type/subtype), buildFormulaVariables, applyMOCRounding
- salary_head_formulas table: per-salary-head formula rules with condition_of_service_id, employee_type_id, employee_subtype_id targeting, priority, rounding, pro-rata support
- MOC formula CRUD API at /api/v1/payroll/salary-heads/:id/formulas with test endpoint
- Salary Heads Angular component: MOC tab for SYSTEM_CALCULATE heads with formula rules CRUD, test panel, variable reference guide

### Task Grade Business Rules (LOCKED — Do Not Change)
- **Authoritative skill**: `.agents/skills/task-grade-rules/SKILL.md` — read this skill BEFORE modifying ANY code that touches `task_grade_id`, `current_notch`, or `monthly_salary` for Task Grade employees. The skill is the single source of truth for all Task Grade rules; do not rely on this summary alone.
- **Core rule**: `employees.monthly_salary` is the SINGLE source of BASIC for Task Grade employees. Error if 0/null — NO fallback to annual_salary.
- **Salary resolution paths**: `resolveMonthlyBasic()` is used in payslip, trial run, and formula test paths. `resolveEmployeeSalaryStructure` has its own inline check (returns annual, not monthly) but enforces the same zero-salary constraint.
- **These rules are locked and must NOT be changed without explicit user authorization.**

### Rate Based Business Rules (LOCKED — Do Not Change)
- **Authoritative skill**: `.agents/skills/rate-based-rules/SKILL.md` — read this skill BEFORE modifying ANY code that touches `salary_based_on`, `wage_rate`, `wage_transactions`, or rate calculations for Rate Based employees. The skill is the single source of truth for all Rate Based rules; do not rely on this summary alone.
- **Classification**: Rate Based = employee with NO `upper_limit_id` AND NO `task_grade_id` (fallback classification)
- **BASIC source depends on `salary_based_on`**: RATE_PER_HOUR/DAY → R0.00 (earnings come from approved wage transactions); CAPTURED_VALUE → R0.00 (BASIC from `employee_payslip_transactions` every_month=TRUE); FIXED_RATE → `wage_rate` from employee master. The BASIC overwrite guard (`isRateBasedZeroBasic`) prevents the engine from overwriting captured amounts for RATE_PER_HOUR, RATE_PER_DAY, and CAPTURED_VALUE employees.
- **Wage transactions**: For RATE_PER_HOUR/DAY employees, wages ARE the primary earnings (BASIC is R0.00). For others, wages are supplementary. Only APPROVED status picked up by payroll engine. Only employees with salary_based_on IN (RATE_PER_HOUR, RATE_PER_DAY) appear on the Wages page.
- **Working time fields**: `working_hours_per_day`, `working_days_per_week`, `working_hours_per_month`, `working_days_per_month` — all editable
- **Computed rates**: Rate Per Day (monthly ÷ days/month), Rate Per Hour (monthly ÷ hours/month), Rate Per Week (ratePerDay × days/week)
- **Hours & Rates layout**: Two-column — left: editable inputs (Salary Based On, Rate, Hours/Day, Days/Week, Hours/Month, Days/Month); right: computed rate cards (Rate Per Day, Rate Per Week, Rate Per Hour). Wage Rate gets yellow prominence when salary_based_on is RATE_PER_HOUR or RATE_PER_DAY
- **These rules are locked and must NOT be changed without explicit user authorization.**

### Upper Limit Business Rules (LOCKED — Do Not Change)
- **Authoritative skill**: `.agents/skills/upper-limit-rules/SKILL.md` — read this skill BEFORE modifying ANY code that touches `upper_limit_id`, `employee_upper_limit_structure`, salary structure CRUD, or balance validation for Upper Limit employees. The skill is the single source of truth for all Upper Limit rules; do not rely on this summary alone.
- **Data table**: `employee_upper_limit_structure` — stores annual amounts per salary head per employee. UNIQUE on (employee_id, salary_head_id).
- **Core rules**:
  - ALL amounts stored are ANNUAL — payslip divides by 12
  - BASIC comes from structure table at payslip time (annual BASIC ÷ 12), NOT from `employees.monthly_salary`
  - Balance enforcement: sum of `included_in_package=TRUE` items must equal target package ±R5.00 — HARD ERROR blocks payslip/trial run
  - BASIC syncs to `employees.monthly_salary` and `employees.annual_salary` on save (denormalized cache)
  - Formula-based heads (SYSTEM_CALCULATE, FORMULA) still evaluated by formula engine
  - Upper Limit has higher precedence than Task Grade in salary resolution
- **These rules are locked and must NOT be changed without explicit user authorization.**

### Payroll Formula Architecture (CRITICAL — Single Source of Truth)
- **Formula storage**: `salary_head_formulas` table is the ONLY source for payroll formulas. The `salary_heads.formula` column is DEPRECATED and cleared — NEVER use or populate it.
- **Formula engine**: `evaluateFormulaV2` (with `resolveMOCRule` + `applyMOCRounding`) in `payroll-engine.js` is the ONLY formula evaluator. Do NOT create duplicate evaluators.
- **Salary data model (Task #76 restructure)**:
  - `employee_salary_transactions` is a **pure link table** (employee↔salary_head). No amount, percentage, or included_in_package columns.
  - `employee_payslip_transactions` stores actual amounts via `captured_amount` (monthly value). Has `period_id`, `every_month`, `processed`, `reference_no`, etc.
  - `employees.monthly_salary` column: Source of BASIC for Task Grade employees. Error if 0/null — no fallback.
  - BASIC salary comes from `employees.monthly_salary`, NOT from any transaction amount.
- **captured_amount variable**: The user-entered monthly amount from `employee_payslip_transactions.captured_amount`. Replaces old CostAmount.
- **Transaction injection**: Do NOT inject formula-based transactions for salary heads that the employee doesn't have. Only evaluate formulas for heads already in the employee's `employee_salary_transactions` or inherited from their salary transaction group.
- **MOC variables available**: BasicSalary, AnnualSalary, PrevBasicSalary, PrevAnnualSalary, PrevSalary, captured_amount, GrossEarnings, TotalDeductions, NetPay, HoursWorked, DaysWorked, WHPM_Monthly, WHPD_Other, RPD_Other, RPH_Monthly, RPD, FixedSalary, PeriodsPerYear, ServiceYears, Age, MedicalDependants, input, plus [CODE] cross-references to other salary head results.
- **"Every Month" transactions**: `end_date = 9999-12-31` means permanent/carries forward each month.
- **Formula flow in calculateForEmployee**: normalizeTransactionsToMonthly skips SYSTEM_CALCULATE → loadMocRules builds mocRulesMap → calculateForEmployee loops sorted transactions → for SYSTEM_CALCULATE: resolveMOCRule → evaluateFormulaV2 → applyMOCRounding.
- **Default Formula UI**: MOC tab shows the highest-priority formula from `mocRules[0]` (loaded from `salary_head_formulas`), NOT from `salary_heads.formula`.

**New API Endpoints:**
- RBAC: permissions CRUD, user-roles CRUD
- Workflow: definitions, pending items, step actions, delegations
- Termination: calculate, finalise, UI-8 download
- Salary Increases: mass create, approve, apply, apply-all
- Leave: policies CRUD, sick cycle, calendar, balance/utilisation reports
- GRAP 25: leave liability GL posting, bonus accrual GL posting
- Time: ghost detection, auto-OT from attendance, shift substitution, time reports
- Benefits: rate tables, life events, cost projection, scheme/employee reports
- Reports: IRP5 batch/text, EMP201/501 electronic, ROE, SDL1, WSP, EEA2/EEA4, payslip batch
- Settings: municipality details (name, code, address, SARS refs, IRP5 info), employee types/subtypes CRUD, task grades & notches CRUD with min/max salary ranges and history, conditions of service CRUD with history, claim rates CRUD, permissions CRUD, user-roles CRUD
- Payroll Cycles: full CRUD (`/payroll/cycles`) with enable/disable toggle, cycle type (Monthly/Weekly/Bi-Weekly), employee type linkage
- Tax Year Setup: POST `/payroll/periods/generate` auto-creates pay periods for a tax year+cycle+date range (transactional insert); DELETE `/payroll/periods/tax-year` removes periods (with payroll run safety check)
- Employee: import (JSON/CSV), import template
- Councillor: register with upper limits
- Performance: reviews CRUD, scorecard
- Skills: competencies CRUD, gap analysis, training calendar
- Disciplinary: progression, compliance check, document generation
- Recruitment: scoring, pipeline, offer letter, probation alerts
- Job Profiles: full CRUD with classification (TASK grade, employee type, subtype, conditions of service), linked positions view, OFO codes, job descriptions, requirements, authority flags

**Job Profiles Module (Platinum-aligned, expanded from source SQL Server schema):**
- Frontend: Angular component at `client/src/app/features/jobprofiles/` — tabbed CRUD form (Basic Info, Classification, Requirements, Communication, Decision Making, Job Evaluation, Operational)
- Backend: CRUD + bulk import + lookups in `src/server/routes/position.routes.js` under `/job-profiles`
- DB: `job_profiles` table with 65+ columns matching source `Payroll_JobProfile` structure
- History: `job_profile_history` table for audit trail
- Integer FK columns: `job_family_id`, `employment_category_id`, `employment_code_id`, `work_area_id`, `ofo_major_group_id`, `ofo_sub_major_group_id`, `ofo_minor_group_id`, `ofo_unit_group_id`, `ofo_occupation_id`, `specialist_id`, `department_id`, `division_id`, `shift_id`
- Dropped unused columns: `occupational_level`, `grading_type`, `link_task_grade` (not in source, not used)
- Converted text→integer FK: `job_family`, `employment_category`, `employment_code`, `work_area`, `specialist_title`, `ofo_major_group`, `ofo_sub_major_group`, `ofo_minor_group`, `ofo_unit_group`
- Added columns: `reports_to_description`, `who_reports_to_position`, `who_are_peers`, `liaison_internal/external`, `internal/external_communication_purpose`, `own_decision_making`, `superior_decision_making`, `can_escalate`, `can_approve`, `description`, `expenditure`, `preceding_questions`, `problem_solving`, `financial`, `planning`, `short_term`, `med_term`, `long_term`, `amount`, `core_function`, `no_of_positions`, `office_bound`, `recommended_contractor_rate`, `scoa_costing_percentage`, `parent_id`, `status`, `is_active`
- Lookup tables created: `ofo_major_groups`, `ofo_sub_major_groups`, `ofo_minor_groups`, `ofo_unit_groups`, `ofo_occupations`, `ofo_specialists`, `job_families`, `employment_categories`, `employment_codes`, `work_areas`
- Import endpoint: `POST /positions/job-profiles/import` accepts `{profiles: [...]}` array
- Lookups endpoint: `GET /positions/job-profiles/lookups/all` returns all OFO/classification lookup data

**Salary Transaction Groups:**
- DB table: `salary_transaction_groups` (code, name, description, enabled)
- Backend: CRUD endpoints in `src/server/routes/settings.routes.js` under `/salary-transaction-groups`
- Frontend: Angular component `client/src/app/features/settings/components/salary-trans-groups.component.*` with summary stats, search, card table (jp-table pattern matching rest of app)
- Group items managed via modal (layers icon) — links salary heads to groups
- Seeded with: Employees, Councillors, Contractors, Temporary, Interns

**Salary Upper Limits:**
- DB table: `salary_upper_limits` (code, employee_type_id, employee_subtype_id, start_date, end_date, minimum_value, midpoint_value, maximum_value, enabled). Job profile and municipal grading fields removed from UI/backend (columns still exist in DB but are not used).
- History: `upper_limit_history` table with JSON snapshots (change_type CREATE/UPDATE/DELETE), tracked on every create/update/delete operation
- Backend: Full CRUD + history endpoint in `src/server/routes/settings.routes.js` under `/upper-limits`
- Frontend: Angular component `client/src/app/features/settings/components/upper-limits.component.ts` with list/detail pattern, 2-tab modal (Upper Limit Details, History). Dates at top of form, cascading Employee Type → Subtype filter.
- Job profiles support `grading_type` column: `TASK_GRADE` (default) or `UPPER_LIMIT`
- Job profiles have `upper_limit_id` FK to `salary_upper_limits` — when grading_type is UPPER_LIMIT, task_grade_id is cleared and vice versa

**Positions — Business Rules:**
- Condition of Service is always editable (not locked when job profile is selected)
- When job profile has `upper_limit_id`, Task Grade is hidden and replaced with Upper Limit display (code + min/mid/max values) and a Value Type selector (MINIMUM/MIDPOINT/MAXIMUM)
- `positions.upper_limit_value_type` column (VARCHAR(10), nullable) stores selected value type
- Job profiles lookup returns `upper_limit_id`, `upper_limit_code`, `upper_limit_minimum`, `upper_limit_midpoint`, `upper_limit_maximum` from joined `salary_upper_limits`
- Backend enforces mutual exclusivity: only the active grading type's FK is saved
- History view groups records by employee_type + subtype + job_profile + municipal_grading

**Employee Types & Sub Types Configuration:**
- Employee Types page allows editing `working_hours_per_month` and `working_days_per_month` (read-only name, editable hours/days)
- DB columns added: `employee_types.working_hours_per_month` (NUMERIC(6,2), default 166.00), `employee_types.working_days_per_month` (NUMERIC(5,2), default 20.75)
- Employee Sub Types support config flags: `exclude_uif`, `exclude_sdl`, `enable_bonus` (BOOLEAN columns)
- Backend: `PUT /settings/employee-types/:id` for hours/days; POST/PUT subtypes include config flags
- Frontend: `client/src/app/features/settings/components/employee-types.component.ts` — type edit modal + subtype flags in modal + grid badges

**Employee Hours & Rates Tab:**
- 5th sub-tab on Employee Detail (between Address Details and Salary Transactions)
- Displays: Payroll Cycle, Task Grade OR Upper Limit (dynamic), Working Hours/Days Per Month, Monthly Fixed Salary, Tax Method, Annual Salary, Working Hours/Day, Rate/Day, Rate/Hour, Shift (placeholder), Rotation (placeholder), Allow Overtime, Exclude SDL
- For Upper Limit employees: labels show "Total Package Target" and "Monthly Package Target" instead of "Annual Salary" / "Monthly Fixed Salary"
- Salary source determined by Position -> Job Profile chain: if job profile has `upper_limit_id`, uses Upper Limit values; otherwise uses Task Grade
- For task grade employees, `annual_salary` is pre-populated from `task_grade_notches` (notch 1 min_salary) on position selection
- For upper limit employees, the upper limit value represents the TOTAL PACKAGE target (not basic salary)
- Working hours/days default from Employee Type on position change; existing employees fall back to Employee Type defaults if null
- DB columns added to employees: `payroll_cycle`, `tax_method`, `working_hours_per_month`, `working_days_per_month`, `allow_overtime`, `upper_limit_value_type`
- Computed getters: `monthlyFixedSalary`, `annualSalary`, `workingHoursPerDay`, `ratePerDay`, `ratePerHour`

**Salary Structure Page (Upper Limit Package Management):**
- Dedicated page at `/salary-structure` under HR Management sidebar (separate from Employee master — HR users shouldn't see salary data)
- Purpose: Structure an Upper Limit employee's remuneration package against their total package target
- **Upper Limit is NOT basic salary** — it's the total package target that must be met by summing all included components
- DB column added: `included_in_package BOOLEAN DEFAULT TRUE` on both `employee_salary_transactions` and `salary_transaction_group_items`
- **List View**: Shows all Upper Limit employees with: code, name, position, department, upper limit code/value type, target package, current package total, variance, status (Balanced/Over/Under)
- **Detail View**: Full salary structure for one employee:
  - Summary panel: target, current total, variance, % of target, status
  - Transactions grid grouped by type (Earnings, Deductions, Company Contributions)
  - Merged view: inherited transactions (from Salary Transaction Group via Job Profile) + employee-specific transactions
  - Each component has editable `included_in_package` checkbox
  - Employee-specific transactions support inline amount/percentage editing
  - Add/Delete transaction support
  - Running totals per group (included items only)
- Backend: `src/server/routes/salary-structure.routes.js` — GET /employees, GET /employees/:id, POST/PUT/DELETE transactions, toggle-package endpoint
- Frontend: `client/src/app/features/salary-structure/components/salary-structure.component.ts/html/css`
- Inheritance chain: Employee → Position → Job Profile → Salary Transaction Group → Group Items (inherited) + Employee Salary Transactions (overrides)
- Salary Transactions tab on Employee Detail also shows `included_in_package` column

**Task Grades (Full List/Detail Page — Platinum pattern):**
- DB: `task_grades` table with extended Platinum fields: `is_legacy`, `to_phase_out`, `task_skill_level_id` (FK → `task_skill_levels`), `yearly_notch_level_increase`, `use_employment_date`, `use_specific_notch_increase_date`, `notch_increase_month` (1–12), `exclude_from_yearly_increase`
- DB: `task_skill_levels` lookup table (26 rows: 01–03 Basic, 04–08 Discretionary, 09–13 Specialised, 14–17 Tactical, 18–21 Managerial, 22–26 Strategic). Follows plural noun naming like `ofo_major_groups`, `employment_categories`
- DB: `task_grade_history` table tracks CREATE/UPDATE snapshots for grades
- DB: `task_grade_notch_history` table tracks CREATE/UPDATE snapshots for notches
- Frontend: Full list/detail page at `client/src/app/features/settings/components/task-grades.component.ts`
  - List view: summary cards (Total/Active/Inactive), search, paginated table with edit+trash actions
  - Detail view: 3 tabs — Task Grade Details (all fields incl. Platinum), Notches (grid with modal add/edit), History (combined grade+notch change log)
  - Modes: create / view / edit, prev/next navigation
- Backend: GET/POST/PUT/DELETE task-grades, GET task-grades/:id, GET task-grades/:id/history
- Business rule: Employee → Job Profile → Task Grade → Notch (min/max salary range)
- Employee subtypes have `exclude_uif`, `exclude_sdl`, `enable_bonus` flags

**Task Grade Notches:**
- DB: `task_grade_notches` table has `min_salary` and `max_salary` columns (not `annual_salary`)
- Each notch defines a salary range — employee salary defaults to minimum but can be any value within min–max
- Frontend table shows: Notch, Min Salary (Annual), Max Salary (Annual), Min Monthly, Max Monthly, Start Date, End Date, Actions
- Production data: 148 task grades (IDs 1–160 with gaps) and 361 notches (IDs 1–385 with gaps) imported from Excel
- Real SA SALGA salary ranges: T1~R11K, T19~R99K annual at notch 5
- Migration script: `src/database/migrate-task-grades.js` — idempotent, atomic (single-client transaction), snapshot-based FK restoration

**Conditions of Service (Production Data):**
- 4 production records: SALGB (ID 2), BCoEA (ID 3), CLRS (ID 4), SRMG (ID 5)
- Seed script handles legacy cleanup (migrates old FK refs to SALGB before deleting old records)
- All employees default to condition_of_service_id=2 (SALGB)

**EMS Vendors (External API — Single Source of Truth):**
- The `ems_vendors` database table has been dropped (migration 013). All vendor data now comes exclusively from the external EMS API.
- Backend: `GET /benefits/ems-vendors` and `GET /settings/ems-vendors` fetch directly from the EMS API (no DB fallback). Returns 503 if API is unavailable.
- Frontend: Medical Aid Schemes, Retirement Funds, Trade Unions, Benefits, and Employee Detail components resolve vendor names from the EMS API vendor list using a `vendorName(vendor_id)` helper. Falls back to "Vendor #[id]" if the API call fails.
- The `vendor_id` integer column remains on `medical_aid_schemes`, `retirement_fund_types`, and `trade_unions` as a plain reference (no FK constraint).
- Removed: `ems-vendor-sync.service.js`, `migrate-ems-vendors.js`, vendor sync startup in `index.js`, disabled ems-vendors converter in conversion routes.

**Data Conversion Tool (SQL Server → PostgreSQL):**
- Purpose: Import configuration/master data from existing SQL Server Excel exports into PostgreSQL
- Backend: `src/server/routes/conversion.routes.js` mounted at `/api/v1/conversion`
- DB: `conversion_logs` table tracks all import operations (type, file, status, row counts, timestamps)
- 13 converters registered: `medical-aid-schemes`, `trade-unions`, `task-grades`, `benefit-funds`, `conditions-of-service`, `departments`, `divisions`, `job-profiles`, `positions`, `employees`, `employee-medical-aid`, `employee-medical-aid-dependants`, `employee-retirement-funds`
- Departments converter: reads Department tab, upserts via INSERT ON CONFLICT (id) DO UPDATE — no destructive deletes, preserves all FK references from positions/divisions/employees
- Divisions converter: reads Division tab, requires departments to exist first, upserts via INSERT ON CONFLICT (id) DO UPDATE with two-pass parent_id handling (insert/update with parent_id=NULL, then set parents using successfully-processed IDs) — preserves all FK references from positions/employees
- Endpoints: GET `/types` (list converters + record counts + last import), POST `/preview` (parse Excel, return preview data), POST `/execute` (run import), GET `/history` (import logs)
- All converters use PostgreSQL SAVEPOINTs for per-row error handling (row failure doesn't abort transaction)
- Replace-import pattern: DELETE existing → INSERT rows → reset sequences → COMMIT
- Medical aid schemes converter merges header tab (`Const_MedicalAidScheme`) + detail tab (`Const_MedicalAidSchemeDetail`) by `MedicalAidSchemeId`
- Frontend: `client/src/app/features/settings/components/data-conversion.component.ts` — 3-step flow (select type → upload+preview → execute+results)
- Route: `/#/settings/data-conversion`, sidebar under Configuration > Other
- ApiService: `postFormData()` method for multipart file uploads
- Medical aid: `medical_aid_schemes.vendor_id` is an integer reference to EMS API vendors (no FK constraint)
- Benefit funds converter: maps BenefitTypeID (3=PENSION, 4=PROVIDENT, 5=RETIREMENT_ANNUITY), ContributionType (1=PERCENTAGE, 0=FIXED), employee/employer contribution values+rates, max values, pro-rata flag, clearance number, vendor_id (EMS API reference)
- Retirement fund: `retirement_fund_types.vendor_id` is an integer reference to EMS API vendors (no FK constraint)
- Titles table: `titles` (id, name, abbreviation, enabled, sort_order, created_at) — CRUD at `/api/v1/settings/titles`, used by employee add/edit forms. Seeded with 15 titles matching legacy TitleID mappings. Employee lookups API (`/employees/lookups/employee-all`) returns titles from DB instead of hardcoded array.

**Post-Merge Setup:**
- Script: `scripts/post-merge.sh` — runs `npm install` + Angular client build
- Configured in `.replit` with 180s timeout
- Ensures dependencies and frontend are rebuilt after task agent merges

**Database Tables (97+):**
Core HR: employees, employee_types, employee_subtypes, departments, divisions, positions, position_history, job_profiles, conditions_of_service, roles
mSCOA Reference: scoa_items (66 rows, IE expenditure + IA balance sheet), scoa_functions (28 rows), scoa_funds (13 rows), scoa_projects (8 rows), scoa_regions (7 rows), scoa_costings (5 rows), scoa_msc (12 rows) - all based on National Treasury mSCOA v7.1 (January 2026)
Payroll: salary_heads (all 7 segment debit/credit mappings), employee_salary_transactions, payroll_cycles, payroll_periods, payroll_runs, payroll_results (7 segment + contra columns), payroll_gl_journals (7 segments: item, fund, function, project, region, costing, msc), payroll_run_errors, coe_projections, third_party_payments, payment_batches, system_settings
Reference/Lookups: const_trade_classification_groups (34 SARS industry groups), const_trade_classification_activities (390 activity groups linked to industry groups), const_sez_codes (SEZ codes for ETI), const_sic_subclasses (SIC7 sub-class codes)
Leave/Time: leave_schemes, leave_types, leave_transactions, employee_leave_balances, holidays, work_shifts, shift_rosters, employee_attendance, overtime_transactions, flexi_time_balances
Benefits: medical_aid_schemes (extended with vendor_id, contribution_plan, employer contribution fields, income thresholds, dependent flags), medical_aid_scheme_history (effective-dated snapshots with non-overlapping date ranges; end_date='9999-12-31' = current/open), cons_vendors (8 SA medical aid vendors), employee_medical_aid, employee_medical_aid_dependants (with student_dependant, disabled_dependant columns), employee_medical_aid_extra_transactions (contribution_type: LATE_JOINER_FEE, ARREAR_CONTRIBUTION, OTHER; with employer_contributes flag), retirement_fund_types, employee_retirement_funds, group_life_benefits, employee_group_life, tax_brackets, tax_rebates, tax_thresholds, medical_tax_credits, uif_settings, sdl_settings
Records: employee_documents, employee_qualifications, employee_dependants, employee_emergency_contacts, employee_history, claims, instalments, notifications
Recruitment: recruitment_vacancies, recruitment_applicants, interview_slots, onboarding_checklists, onboarding_items
Performance: performance_periods, performance_indicators, feedback_360, feedback_360_responses, pip_plans, pip_milestones, training_courses, training_records, succession_pools
Compliance: ee_plans, ee_targets, disciplinary_cases, grievances, employee_terminations, audit_log

**Backend Route Files (17):**
- employee.routes.js (22 endpoints: CRUD, photo, dependants, emergency contacts, qualifications, succession, history, documents, salary transactions, termination)
- payroll.routes.js (50+ endpoints: cycles, periods, runs lifecycle, execute, execute-single, mock-payslip, payslip-preview, lock, unlock, promote-to-final, approve (auto GL post + auto batch generation), results, errors, salary heads CRUD, tax tables, void, reverse, variance, prorate, GL post with 3-layer guardrails, GL journals, sub-ledger (paginated with lazy-load employee detail), sub-ledger/employee/:empId, reconcile, mSCOA validate, third-party, payment-batches CRUD, batch detail (paginated employee list), batch review/authorize/mark-paid, EFT file download per batch, generate-batches, payment-reports: nett-pay-register, deduction-register, third-party-summary, bank-recon, variance, payslip-view: employees, calculate, paye-breakdown, transactions add/remove, available-transactions)
- leave.routes.js (13 endpoints: schemes, types, transactions CRUD, approve/reject, balances, holidays, accrue, carry-over, encash)
- benefits.routes.js (30+ endpoints: medical aid schemes CRUD+history, retirement funds CRUD with fund_type filter + salary-heads junction endpoints, group life, employee medical aid memberships CRUD, dependants CRUD, extra transactions CRUD with ownership verification, cost split, employee retirement funds CRUD with fund_type filter + PUT/:fundId + DELETE/:fundId)
- time.routes.js (17 endpoints: attendance, shifts, overtime, claims, instalments, BCEA rate, shift rosters, flexi-time)
- performance.routes.js (17 endpoints: periods, indicators CRUD, feedback-360, PIP with milestones, goal alignment)
- report.routes.js (23 endpoints: payslip, IRP5, EMP201, EMP501, easyFile, EFT, employment letter, exports, EE profile/summary/targets/plans, UIF UI-19, MFMA S66, retro-calculate, gross-up, CoE projections)
- recruitment.routes.js (14 endpoints: vacancies, applicants, interview slots, onboarding CRUD)
- department.routes.js (6 endpoints: CRUD, divisions)
- position.routes.js (9 endpoints: CRUD, job profiles, task grades/notches, organogram, history)
- ess.routes.js (9 endpoints: profile, payslips, leave balances/requests/apply, benefits, documents, performance, dependants)
- notification.routes.js (8 endpoints: CRUD, mark-read, send-email, approval workflows CRUD)
- dashboard.routes.js (6 endpoints: summary, payroll, leave, headcount, compliance, demographics)
- document.routes.js (6 endpoints: upload, upload-version, versions, employee docs, download, delete)
- skills.routes.js (9 endpoints: courses, qualifications, records, WSP summary)
- disciplinary.routes.js (7 endpoints: cases CRUD, grievances CRUD)
- settings.routes.js (20 endpoints: tax years, tax tables per year, tax brackets CRUD, rebates update, thresholds update, UIF/SDL settings update, medical credits update, copy tax year, leave types CRUD, leave schemes, salary heads list, conditions-of-service, employee types/subtypes, system settings GET/PUT)
- health.routes.js (1 endpoint: health check)

**Backend Service Files:**
- payroll-engine.js (SA tax calculation engine: PAYE with progressive brackets/rebates/thresholds, UIF with ceiling, SDL data-driven via IRP5 income classification, medical tax credits; supports calculateForEmployee, calculateMock, loadTaxTables, evaluateFormula, calculatePayslipForEmployee, resolveEmployeeSalaryStructure; FORMULA calculation method with safe expression evaluator for custom salary head formulas; links system heads PAYE/UIF/SDL to salary_heads table for GL posting; salary structure chain: Employee→Position→JobProfile→SalaryTransGroup→UpperLimit; medical aid/retirement fund integration; PAYE breakdown with full bracket/rebate detail; **SDL**: uses data-driven IRP5 income classification (types 1-3: income+allowances+fringe benefits, weighted by irp5_codes.taxable_percentage), annualizes, deducts capped pension (27.5%/R350k), applies SDL rate, de-annualizes — pension IRP5 codes: 4001,4002,4003,4004,4006,4007,4026,3817,3867,3825,3875,3828,3878; **Salary Structure**: employee_salary_transactions store ANNUAL amounts, converted to monthly by dividing by periodsPerYear; **Medical Aid**: calculated from scheme rates (member/adult/child amounts × employee/employer percentage split), with max dependant rules and employer contribution cap — employer_contribution column = EMPLOYEE percentage, employer_contribution_percentage = EMPLOYER percentage (confusing naming from import); **Pension**: uses retirement_fund_types.employee_contribution_value/employer_contribution_value (fixed monthly amounts) with rate fallback)
- payslip.service.js (PDF payslip + employment letter generation using pdfkit)
- statutory-reports.service.js (IRP5, EMP201, EMP501 PDF, e@syFile CSV)
- eft.service.js (ACB bank file generation, getMunicipalityBank() reads from system_settings)
- report-export.service.js (Excel via exceljs, CSV export)
- notification.service.js (create/get/mark-read notifications)

**Backend Middleware:**
- historyTracker.js (tracks employee field changes to employee_history table)

**Frontend Module Files (public/js/modules/) — 18,000+ lines total:**
- **employees.js** (2,000+ lines) - Full CRUD with multi-step termination wizard (4 steps: type/amounts/checklist/confirm), employee import (JSON/CSV), probation badges, inline SA ID/tax/bank validation, photo upload/delete
- **payroll.js** (3,000+ lines) - Full payroll lifecycle with run types (Normal/Supplementary/Bonus/Leave Encashment), ETI display, salary increases (mass/approve/apply), GRAP 25 (leave liability/bonus accrual GL posting), councillor register, variance, GL/sub-ledger, payments
- **leave.js** (1,400+ lines) - Leave requests/approvals, calendar view (month grid), sick leave cycle tracking, leave policies configuration, balance/utilisation reports, leave liability
- **organogram.js** (1,165 lines) - Visual org chart with pan/zoom, CRUD, CSV export, fill rate analytics
- **performance.js** (1,200+ lines) - KPA/KPI, performance reviews with weighted scorecards, goal cascading, 360 feedback, PIP
- **positions.js** (834 lines) - Staff establishment, TASK grades, job profiles
- **reports.js** (1,200+ lines) - IRP5 batch/text, EMP201/501 electronic, e@syFile CSV, ROE, SDL1, WSP, EEA2/EEA4, payslip batch, UIF UI-19, MFMA S66
- **time.js** (1,100+ lines) - Overtime, attendance, ghost detection, auto-OT from attendance, shift substitution, time/claims/OT reports
- **benefits.js** (900+ lines) - Medical/retirement enrollment, rate tables, life events, cost projection, scheme/employee reports
- **recruitment.js** (900+ lines) - Vacancy management, applicant scoring matrix, pipeline dashboard, offer letter, probation alerts
- **skills.js** (700+ lines) - Competency framework CRUD, gap analysis (color-coded), training calendar, NQF/CPD fields
- **ess.js** (375 lines) - Employee Self-Service portal
- **disciplinary.js** (500+ lines) - Progressive discipline timeline, document generation, LRA compliance check, CCMA workflow, grievance SLA
- **settings.js** (1,900+ lines) - Tax tables, leave types, salary heads, bank/payments, RBAC security (permissions/user-roles), leave policies, claim rates, workflow definitions; Municipality tab includes: industry/activity group, payslip template (plain/secure/custom), company contributions toggle, bonus payment timing (employment date/birthday/specific month)

**Dashboard (public/js/dashboard.js — 1,562 lines):**
- Executive Overview with KPI cards, compliance alerts, payroll pipeline, leave summary, department headcount
- Employee List tab with search/pagination
- AI Analytics tab with 9 Chart.js charts (demographics, department distribution, age distribution, payroll trends, leave utilisation, turnover, gender pay gap, CoE breakdown, skills matrix)
- Reports quick-access tab
- Notification bell dropdown with unread count, mark-read, auto-refresh
- Approval workflow configuration (gear icon) with CRUD for workflow definitions and approval levels
- Sidebar navigation with 14 modules (including Settings)

**Reusable UI Components (public/js/components.js):**
- Modal dialogs (with multi-button close support), form builder (text/select/date/number/textarea/checkbox/readonly/section types), toast notifications (with SVG icons per type), confirmation dialogs (with SVG warning icon), search/filter toolbar, pagination, workflow step visualizer, stat cards, detail tabs (with SVG icons), empty states (with SVG icons)

**Icon System (public/js/dashboard.js):**
- `icon(name, size)` helper returns inline SVG. 33+ icons available: user, users, dollar, clipboard, calendar, file, settings, check, alertTriangle, link, briefcase, fileText, arrowRight, shield, activity, lightbulb, lock, home, award, barChart, creditCard, clock, heart, grid, chevronRight, search, plus, edit, trash, eye, download, refresh, trendingUp, phone
- All form section headers, detail tabs, empty states, toasts, and confirm dialogs use SVG icons. Zero emoji throughout entire codebase.

**Script Load Order (public/index.html):**
- components.js → module files (employees, payroll, positions, leave, benefits, time, performance, reports, disciplinary, skills, recruitment, ess, organogram, settings) → dashboard.js
- icon() is globally available at runtime when module functions execute

**Column Conventions:**
- `surname` NOT `last_name`; `employee_code` NOT `employee_number`; `work_shifts` NOT `shifts`; status values UPPERCASE
- `email_address` NOT `email`; `joining_date` NOT `hire_date`; `income_tax_number` NOT `tax_number`
- `department_id` lives on `positions` table NOT on `employees` — must join through positions
- `leave_balances`: `balance_days`, `accrued_days`, `taken_days`, `forfeited_days`, `as_at_date`
- `leave_transactions`: `days` (NOT `days_requested`); `captured_by` (NOT `created_by`)
- `medical_aid_schemes`: NO `administrator` column; has `scheme_type`, `main_member_contribution`
- `retirement_fund_types`: `fund_administrator` (NOT `administrator`); `employee_contribution_rate`/`employer_contribution_rate`; extended with `vendor_id` FK to `cons_vendors`, `plan_name`, `clearance_no`, `fund_sub_type`, `employer_contribution_type` (PERCENTAGE/FIXED), `employer_contribution_value`, `employer_max_value`, `employee_contribution_value`, `employee_max_value`, `employee_pro_rata`
- `retirement_fund_salary_heads`: junction table linking `retirement_fund_type_id` → `salary_head_id` (unique constraint on pair)
- `employee_retirement_funds`: `fund_number` (NOT `membership_number`); `employee_amount`, `employer_amount`, `is_current`; extended with `plan_name`, `status` (ACTIVE/TERMINATED)
- `employee_medical_aid`: `is_current` (NOT `status = 'ACTIVE'`); NO `plan_type` or `monthly_contribution`

**API Helpers:**
- `api(path)` for GET requests
- `apiPost(path, body)` for POST requests
- For PUT/DELETE: use direct `fetch(API_BASE + path, {method:'PUT/DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)})` with `res.ok` check
- `API_BASE` is a global constant

**Notification System:**
- Bell icon in topbar with unread count badge
- Dropdown list with mark-read functionality
- Auto-refresh every 60 seconds
- System events create notifications (e.g., applicant appointed)
- Approval workflow configuration via gear icon in header

## GitHub Repository
- **Repo:** https://github.com/DylanStrydom/Platinum-HR-Payroll
- **Visibility:** Private
- **Branch:** main
- **Integration:** Connected via Replit GitHub connector (OAuth)
- **Sync utility:** `src/server/utils/github.js` (Octokit client with token refresh)

## Angular Frontend Architecture
- **Framework:** Angular 21 (standalone components, lazy-loaded routes, hash routing)
- **Change Detection:** Zoneless (`provideZonelessChangeDetection()`) - requires `ChangeDetectorRef.detectChanges()` in all components after HTTP subscription callbacks
- **Build:** `cd client && npx ng build --configuration=production` → output at `public/dist/browser/`
- **Serving:** Express serves Angular build from `public/dist/browser/` with SPA fallback; `public/` as secondary static root for legacy assets
- **API Service Pattern:** `api.get()` auto-extracts `.data` from `{success, data}`; `api.getRaw()` returns full response; `api.getPaginated()` returns full paginated response
- **Module Structure:** 31 standalone components under `client/src/app/features/` - all fully implemented with CDR change detection
- **CSS:** Original vanilla JS CSS ported to Angular global styles (`client/src/styles.css`, 3351 lines) - all original class names preserved

## Recent Changes
- **Employee Master V1**: Complete rebuild of employee creation/detail experience
  - Employee detail page: 3 modes (Create/View/Edit), header section with position cascade (Dept→Division→Vacant Position→auto-populate), 3 sub-tabs (Personal Details, Contact Details, Address Details)
  - Position-driven creation: selecting a vacant position auto-populates Job Profile, Employee Type, Employee Subtype, Condition of Service, Task Grade (all read-only/derived)
  - SA ID validation: 13-digit ID → auto-derive DOB (YYMMDD, ≤30→2000s), Gender (digits 7-10 ≥5000 = Male), DOB field locked when valid ID
  - Address support: Standard (Country→Province→Town→Suburb cascade with auto postal code) and Non-Standard (5 free-text address lines)
  - "Same as Physical" postal address option copies all physical address fields
  - Employee number auto-generated (EMP0001 pattern) on create
  - Photo upload on detail page (view/edit modes)
  - **Salary Transactions tab** on Employee Detail: 5th sub-tab. Loads inherited transactions from chain (Employee → Position → Job Profile → Salary Transaction Group → Items → Salary Heads) via `GET /employees/:id/inherited-salary-transactions`, plus employee-specific transactions via `GET /employees/:id/salary-transactions`. Merged view grouped by type (Earnings, Deductions, Company Contributions). Inherited items show "Inherited" badge (read-only), employee items show "Employee" badge (editable/deletable). Users can add employee-level overrides that supersede inherited defaults. Modal for add/edit with salary head dropdown, amount, percentage, start/end date. Delete with confirmation. Tab disabled during create mode.
  - **Medical Aid tab** on Employee Detail: 6th sub-tab with 3 inner tabs (Scheme, Extra Transactions, Dependants). Scheme tab: link employee to medical aid scheme from config, displays Fund, Plan, Reference Number, Join/Termination dates, membership history table with contribution amounts. Dependants tab: add/edit/delete dependants with Name, Surname, ID, DOB, Gender, Start/End date, Employer Contribute, Student/Disabled checkboxes, Dependant Type (Adult/Child). Extra Transactions tab: add/edit/delete with Contribution Type (Late Joiner Fee, Arrear Contribution, Other), Amount, Start/End date, Employer Contribute. All nested routes verify membership ownership via `verifyMembershipOwnership()`. DB tables: `employee_medical_aid`, `employee_medical_aid_dependants`, `employee_medical_aid_extra_transactions`.
  - New backend endpoints: `/employees/lookups/employee-all`, `/employees/vacant-positions`, `/employees/validate-id`, `/employees/next-employee-number`, `/employees/:id/inherited-salary-transactions`
  - Address config pages: Countries, Provinces, Towns/Cities, Suburbs — full CRUD under Configuration → Company sidebar
  - Configuration sidebar reorganized into 6 subgroups: Company, HR Structure, Payroll Setup, Benefits, Pay Structure, Other (was: Company, Staff Establishment, Payroll, Other)
- **Employment Change Reasons** page at `/settings/employment-changes` under Configuration > HR Structure. Two DB tables: `employment_change_types` (fixed lookup: Take-on, Employment Changes, Termination, Recruitment) and `employment_change_reasons` (user-managed, FK to types, unique constraint per type). History via `employment_change_reason_history` (JSON snapshots). API: `src/server/routes/employment-changes.routes.js` with `/types` (lookup), `/reasons` (CRUD), `/reasons/:id/history`. Component: `client/src/app/features/employment-changes/components/`. List/detail pattern with 2 tabs (Reason Details, History).
- **Salary Transactions** page rebuilt at `/settings/salary-heads` under Configuration > Pay Structure. Full list/detail pattern with summary cards (Total/Active/Inactive/Earnings/Deductions), search, paginated table (Code, Title, Type, Calc Method, Status, Actions). Detail view with 2 tabs (Salary Transaction Details, History). Details tab fields: Start Date, End Date, Transaction Type (dropdown from API), Title, Code (create only), Description, IRP5 Code (dropdown from 202 codes), Calculation Method (dropdown from API), Group On Payslip By IRP5 Code, Retirement Funding Income, Pro-rated Transaction, Enabled.
  - New lookup tables: `const_salary_transaction_types` (4 rows: Earnings, Deductions, Company Contributions, Fringe Benefits), `const_salary_calculation_methods` (2 rows: User Input Value Required, System Calculate), `irp5_codes` (202 rows from Platinum with code, description, taxable_percentage, type [1=income,2=allowance,3=fringe,4=lump sum,5=gross,6=deduction,7=tax deduction], start_date, end_date)
  - New columns on `salary_heads`: `description`, `retirement_funding_income`, `group_on_payslip_by_irp5`, `is_system`
  - 47 system salary transactions seeded by default (flagged `is_system = true`), covering: Basic Salary, Bonus, PAYE variants, SDL, UIF (Employee/Employer), Medical Aid/Pension/Provident/Retirement Fund (Employee/Employer/Fringe), Overtime, Allowances, Bargaining Council, Backpay, etc. System transactions cannot be edited or deleted.
  - History: `salary_head_history` table (JSON snapshots, change_type CREATE/UPDATE/DELETE)
  - API: `src/server/routes/salary-transactions.routes.js` with `/types`, `/calculation-methods`, `/irp5-codes` (lookups), CRUD, `/:id/history`
  - Component: `client/src/app/features/settings/components/salary-heads.component.ts` (rebuilt from modal-based to full list/detail)
  - New DB tables: `countries`, `provinces`, `towns`, `suburbs` with hierarchical FKs, seeded with South Africa + 9 provinces
  - 40+ new columns on employees table for personal/contact/address data
  - Backend routes: `src/server/routes/address-config.routes.js` with full CRUD for all address entities
- Angular 21 frontend fully rebuilt from vanilla JS - all 14 sidebar modules ported as standalone components
- Dashboard with live data (KPI cards, compliance alerts, payroll pipeline, charts, AI insights tabs)
- Organogram component with tree hierarchy view and list view
- All settings components (15) with full CRUD functionality
- ChangeDetectorRef added to all 30 feature components for zoneless change detection compatibility
- Job Profiles classification tab: all raw number inputs replaced with proper select dropdowns for job family, employment category, employment code, work area, and full OFO hierarchy (major/sub-major/minor/unit groups, occupations, specialists)
- Job Profiles loadLookups() now fetches from `/positions/job-profiles/lookups/all` to populate OFO and classification dropdowns
- OFO hierarchy dropdowns cascade: selecting a major group filters sub-major groups, which filters minor groups, etc.
- System-wide date format changed to dd/MM/yyyy: DateInputComponent (shared, ControlValueAccessor) replaces all native date inputs; dateSa pipe outputs dd/MM/yyyy
- Job Profiles page rebuilt as full detail page: list view + detail view (no modal), 3 modes (Create/View/Edit), 3 tabs (Job Details, Duties & Responsibilities, History)
- Job Profile salary structure: Task Grade shown for Municipal Staff/Post Retirement, Upper Limit for other employee types, with Link checkbox + dropdown
- Post Retirement rules: OFO, WSP, Job Family sections hidden when Employee Type = Post-Retirement
- Job Profile duties: CRUD via `job_profile_duties` table, endpoints at `/positions/job-profiles/:id/duties`
- Job Profile history: from `job_profile_history` table (uses `captured_at` column), linked positions from positions table
- **Medical Aid Schemes** extracted to standalone dedicated page at `/medical-aid-schemes` route with own sidebar menu item under Configuration > Benefits. Full list/detail pattern matching Job Profiles/Positions (summary stats, search, list view, detail view with 2 tabs: Scheme Details + Effective Date History, create/view/edit modes, prev/next navigation). Component at `client/src/app/features/medical-aid-schemes/components/`. Removed from Benefits page.
- **Trade Unions** page at `/trade-unions` route with sidebar menu item under Configuration > Benefits. Full list/detail CRUD. Fields: Trade Union Representative, Creditors (dropdown from cons_vendors), Contribution Type (% or Fixed radio), Contribution Value, Maximum Value R, Enabled. DB table: `trade_unions`. API: `src/server/routes/trade-unions.routes.js`. Component at `client/src/app/features/trade-unions/components/`.
- **Pay Points** page at `/pay-points` route with sidebar menu item under Configuration > Pay Structure. List/detail CRUD with 2 tabs: Pay Point Details + Linked Departments. Fields: Code (unique, required), Description (required), Address, Location, Enabled. Junction table `pay_point_departments` links departments to pay points (unique constraint prevents duplicates). API: `src/server/routes/pay-points.routes.js` with CRUD + department link/unlink endpoints. Component at `client/src/app/features/pay-points/components/`.
- Positions (Staff Establishment) page fully rebuilt: list view + detail view (no modal), 3 modes (Create/View/Edit), 2 tabs (Position, Position History)
- Positions list: summary stats bar (Total/Funded/Vacant/Filled), search, table with Code/Title/Department/Job Profile/Grade/Status/Incumbent/Actions
- Positions detail: 3 sections (Position Details with manager type radios + funding radios, SCOA Setup with department/division/project/region/expense item, Business Rules with job profile auto-populate + employee type/subtype/condition of service/task grade/lock fields)
- Position history: `position_history_snapshots` table (full row snapshot on CREATE/UPDATE, with incumbent + grade + job profile title)
- New DB columns on positions: unique_identifier, hierarchy_code, advert_ref, circular_number, non_employee, performance_assessment, lock_fields, salary_transaction_group_id, manager_type
- Lookups endpoint: `GET /positions/lookups/positions-all` returns divisions, job_profiles, task_grades, employee_types, employee_subtypes, conditions_of_service, salary_transaction_groups, scoa_items/functions/projects/regions

## External Dependencies
- **Platinum ERP (SQL Server):** Integration via REST APIs for existing data and functionalities. The Platinum SQL Schema (`docs/platinum-schema/ems_schema.sql`) and stored procedures/functions (`docs/Platinum SPs/HR_Payroll_SPs.sql`, `docs/Platinum Functions/HR_Payroll_Functions.sql`) serve as reference for understanding business logic and data structures, not for direct replication.
- **Banking Systems:** Integration for EFT file processing for payroll.
- **SARS e@syFile:** CSV export format for tax submissions.
- **LGSETA:** WSP/ATR reporting for skills development compliance.

## NPM Packages
- express, pg, cors, helmet, compression, morgan, express-rate-limit, swagger-jsdoc, swagger-ui-express, dotenv
- pdfkit (PDF generation for payslips, IRP5, employment letters)
- exceljs (Excel export for data grids)
- multer (file upload for document management)
- archiver (ZIP file generation for bulk exports)
- @octokit/rest (GitHub integration)

## AI Development Rules

When generating code:

1. When unsure, ask before implementing.
2. Do not generate large modules unless specifically requested.
3. Do not redesign the UI unless explicitly instructed. Follow the Platinum SCM design direction.
4. Do not copy the Platinum legacy UI exactly; modernise it while preserving the intended workflow and layout direction.
5. Do not build new features unless the user explicitly authorises them.
6. Treat Platinum SQL stored procedures, functions, and manuals as reference for business logic only — improve where needed, do not blindly replicate.
7. When implementing Angular components, follow the existing standalone component architecture, lazy loading, and zoneless change detection requirements.
8. When using API responses, follow the existing API helper conventions and response structure.
9. Preserve auditability, traceability, and compliance in all solutions.
10. Prefer maintainable, production-quality code over quick mock implementations.
11. For mock data, make dashboards and reports realistic and meaningful for a South African municipal payroll environment.
12. Never use emoji in the UI. Use inline SVG icons only via the existing icon system or Angular equivalent.
13. Use existing CSS classes, design tokens, and layout patterns before introducing new ones.
14. Do not change database schema or core workflow logic without explicit approval.
15. If a requirement is unclear, do not guess blindly — use the documented conventions and existing patterns in the project.
16. Before writing backend or SQL code, verify table names, column names, and relationships against the documented schema and existing code.
    
## Angular Coding Rules

All new frontend work must follow these Angular rules:

1. Use Angular 21 standalone components only.
2. Use lazy-loaded routes for feature modules/pages.
3. Use hash routing as per current application setup.
4. Use the established folder structure under `client/src/app/features/`, `core/`, `shared/`, and `layout/`.
5. After async HTTP subscriptions or manual state updates, trigger change detection where required for zoneless mode using `ChangeDetectorRef.detectChanges()`.
6. Prefer reusable shared components before creating new duplicated UI patterns.
7. Preserve the list/detail page pattern already used in Employees, Positions, Job Profiles, Medical Aid Schemes, and Trade Unions.
8. Forms must follow the project’s styling conventions:
   - uppercase labels
   - 8px radius inputs
   - blue focus ring
   - white backgrounds
   - Platinum token colours
9. Date inputs must use the shared SA date approach (`dd/MM/yyyy`) and not raw browser date inputs unless already approved.
10. All tables must support search and align visually with the Platinum table style.
11. New pages must support Create / View / Edit modes where applicable.
12. Prefer explicit typed models/interfaces for API data.
13. Do not introduce a new component library or CSS framework.
14. Use Chart.js for charts where charts are needed.
15. Keep pages performant for large data volumes — use pagination, lazy loading, and avoid rendering excessive DOM rows.
    
## Payroll and Business Logic Guardrails

This is a high-compliance South African municipal payroll system. All payroll-related code must respect these rules:

1. Payroll calculations must support South African statutory requirements including PAYE, UIF, SDL, medical tax credits, and municipality-specific payroll rules.
2. All payroll processing must be auditable, traceable, and reversible where applicable.
3. Payroll operates in this hierarchy:
   Tax Year → Payroll Cycle → Payroll Period → Payroll Run
4. Payroll workflow is:
   Trial Run → Review → Promote to Final → Approve
   - Promote to Final auto-locks the run
   - Unlock reverts the run back to Trial
   - No separate second Final run is created
5. Closed or approved periods must not allow further transactional changes unless explicitly unlocked through controlled workflow.
6. Employee financial results must always support proper mSCOA and GL treatment.
7. Every financial transaction must preserve correct debit/credit and segment relationships.
8. Do not simplify or bypass compliance logic for EMP201, EMP501, IRP5, UIF, SDL, leave liability, bonus accrual, or termination calculations.
9. Job Profile, Employee Type, Employee Subtype, Condition of Service, Task Grade, and Upper Limit rules must follow the documented business relationships.
10. Date-effective history tables must be respected when determining current records.
11. Do not assume one-size-fits-all payroll rules; municipality-specific configuration and policy-driven behaviour must be supported.
12. Mock payroll calculations must still look realistic and follow South African payroll conventions.
13. Any implementation affecting payslips, statutory reporting, payment batches, or GL posting must prioritise correctness over UI speed.
14. When referencing Platinum logic, understand the business purpose first, then design an improved implementation for the new architecture.
15. Never hardcode tax tables, contribution values, or statutory thresholds unless explicitly instructed for seeded demo data or controlled configuration.

## Reference UI Patterns

The following pages define the standard UI pattern for the system.
When creating new pages, follow these patterns exactly.

Reference Pages:

Positions
client/src/app/features/positions/

Job Profiles
client/src/app/features/jobprofiles/

Medical Aid Schemes
client/src/app/features/medical-aid-schemes/

Trade Unions
client/src/app/features/trade-unions/

These pages define the official UI layout patterns used throughout the application.

Standard Page Pattern:

LIST PAGE
- Summary KPI bar
- Search/filter toolbar
- Paginated table
- Actions column

DETAIL PAGE
- Header section
- Tabs
- Card sections within tabs
- Create / View / Edit modes
- Previous / Next navigation

FORM STYLE
- Uppercase labels
- White background cards
- 8px input radius
- Platinum color tokens
- Inline validation

Do not invent new layout styles.
Always follow the structure used in the reference pages above.

## Development Approach

When creating a new page:

1. First inspect an existing feature page that is most similar.
2. Reuse its layout, component structure, and coding pattern.
3. Only modify fields and business logic specific to the new feature.
4. Do not generate pages from generic Angular CRUD assumptions when a similar project page already exists.
   
Example:
If creating a configuration page → use Medical Aid Schemes as template.
If creating HR master data → use Employees page as template.
If creating establishment structures → use Positions or Job Profiles as template.

## Implementation Guardrails

Before making significant changes, always:

1. Identify the closest existing feature/module to use as a reference.
2. List the files that should be changed.
3. Keep changes small and targeted unless the user explicitly requests a full rebuild.
4. Reuse existing services, components, styles, and patterns before creating new ones.
5. Do not refactor unrelated code while implementing the requested change.
6. For database-related work, verify schema and naming conventions first.
7. For UI work, preserve the existing Platinum page layout and styling patterns.