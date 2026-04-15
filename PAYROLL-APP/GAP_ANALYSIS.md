# Platinum HR & Payroll Module — Comprehensive Gap Analysis
## Comparison Against World-Leading ERPs & Platinum (Sebata EMS) Help Manuals

**Date:** 3 March 2026  
**Prepared By:** Solutions Architect / ERP HR & Payroll SME  
**Benchmarked Against:** SAP SuccessFactors, Oracle HCM Cloud, Sage 300 People/VIP, PaySpace, Xero Payroll, Platinum (Sebata EMS v1.0)  
**Regulatory Framework:** mSCOA v7.1 (NT Jan 2026), MFMA, BCEA, LRA, EEA, SARS, POPIA, GRAP

---

## Executive Summary

The Platinum HR & Payroll module is a substantial build covering **97 database tables**, **252 API endpoints**, **23,000+ lines of code**, and **17 route files** across 14 functional modules. The payroll engine correctly implements SA tax legislation (PAYE brackets/rebates/thresholds, UIF with ceiling, SDL with threshold, medical tax credits). mSCOA v7.1 compliance is strong with full 7-segment classification. However, significant gaps remain when compared to world-class ERPs and even to features documented in the original Platinum (Sebata) help manuals.

### Overall Coverage Score: 62/100

| Category | Score | Status |
|----------|-------|--------|
| Core HR & Employee Master | 75% | Good — missing some fields |
| Payroll Engine & Calculation | 82% | Strong — core calc correct |
| mSCOA & GL Integration | 90% | Excellent |
| Payment Processing | 80% | Good — H2H simulated only |
| Statutory Reporting (SARS) | 70% | Functional but basic PDFs |
| Leave Management | 65% | Functional, gaps vs Platinum manual |
| Benefits Management | 55% | Basic — missing Platinum depth |
| Time & Attendance | 50% | Partial — no biometric integration |
| Claims & Travel | 40% | Schema exists, UI minimal |
| Instalments / Garnishee Orders | 45% | Schema exists, UI minimal |
| Overtime Management | 50% | API exists, approval flow basic |
| Staff Establishment | 70% | Good organogram, missing competency |
| Recruitment & Onboarding | 45% | Basic — no interview workflow |
| Performance Management | 50% | KPI/PIP exists, no 360 UI |
| Skills & Training | 40% | Basic CRUD only |
| Disciplinary & Grievance | 40% | Basic CRUD, no workflow |
| Employment Equity | 35% | Targets exist, no EEA2/EEA4 forms |
| Employee Self-Service | 50% | ESS routes exist, UI basic |
| Reports & Exports | 60% | PDF generation exists, gaps |
| Security & RBAC | 30% | Auth middleware exists, no field-level |
| Audit & Compliance | 55% | Audit log exists, no AG validation |
| Document Management | 40% | Upload exists, no versioning |
| Notifications & Workflows | 35% | Basic bell, no workflow engine |
| Data Quality & Validation | 40% | Some validation, many gaps |

---

## 1. CORE HR & EMPLOYEE MASTER DATA

### What We Have
- 64-column employees table with comprehensive personal data
- Employee types, subtypes, conditions of service
- Bank details (on employee record — name, branch, account, type, holder)
- Position linking, task grade, notch
- Race, disability, nationality for EE reporting
- Photo URL, emergency contacts (inline)
- Employee history tracking table
- Dependants and emergency contacts tables

### Gaps vs Platinum (Sebata) Manual
| Feature | Platinum Manual | Our Status | Gap |
|---------|----------------|------------|-----|
| Step-by-step wizard for new employee | Yes — guided capture with tabs | No wizard — flat form | MEDIUM |
| Employee status workflow (Active/Suspended/Terminated) | Full workflow with reasons | Basic status field only | HIGH |
| Multiple addresses (physical, postal, correspondence) | Yes | Partial (physical + postal) | LOW |
| Tax directive management | Yes — linked to termination | No | HIGH |
| Previous employer details | Yes — for IRP5 carry-over | No | MEDIUM |
| Employee categories (councillor, contract, permanent, temp) | Granular subtypes | Basic employee_types only | MEDIUM |
| Bargaining council membership | Configurable per employee | Table exists, not linked | MEDIUM |
| Date fields (probation end, confirmation date) | Yes | No probation tracking | HIGH |
| Working hours per week/day (configurable) | Yes | Fields exist but not enforced in calc | LOW |
| Employee photo capture | Yes — webcam/upload | Upload URL only, no webcam | LOW |

### Gaps vs World-Class ERPs (SAP/Oracle)
| Feature | SAP/Oracle | Our Status | Gap |
|---------|------------|------------|-----|
| Multi-currency payroll | Yes | ZAR only (correct for SA municipalities) | N/A |
| Organisational Management (OM) | Full OM with org units, jobs, positions hierarchy | Basic dept → position → employee | MEDIUM |
| Competency framework per position | Yes — linked to job profile | No competency model | HIGH |
| Succession planning with pipeline | Yes | Basic succession_pools table only | HIGH |
| Employee lifecycle events (hire/transfer/promote/separate) | Full event-driven | Basic status changes | HIGH |
| Mass data maintenance | Yes — bulk update tools | No bulk operations | MEDIUM |
| Employee data import/export | CSV/API import | No import facility | HIGH |
| Approval workflow engine | Configurable multi-step | Basic approve/reject only | HIGH |

---

## 2. PAYROLL ENGINE & CALCULATION

### What We Have (Strong)
- **PAYE calculation**: Correct annualisation method, 7-bracket table, primary/secondary/tertiary rebates, age-based thresholds
- **UIF**: Employee + employer contributions with ceiling cap (R17,712 monthly)
- **SDL**: Rate-based with annual threshold (R500,000)
- **Medical tax credits**: Main member, first dependant, additional dependants
- **Formula engine**: Safe `evaluateFormula()` with variable injection (BasicSalary, AnnualSalary, GrossEarnings, etc.)
- **Calculation methods**: FIXED_AMOUNT, PERCENTAGE_OF_BASIC, SYSTEM_CALCULATE, FORMULA
- **Fringe benefits**: Supported as separate transaction type with tax implications
- **Priority-based processing**: Salary heads processed in priority order
- **Period support**: Configurable periods per year (12 monthly, 52 weekly, etc.)
- **Trial/Final run pattern**: Trial → Promote to Final → Lock → Approve
- **Batch insert optimisation**: Results inserted in batches for performance
- **Error handling**: Per-employee error capture with error logging table
- **Run progress tracking**: Real-time progress with websocket-ready structure

### Gaps vs Platinum (Sebata) Manual
| Feature | Platinum Manual | Our Status | Gap |
|---------|----------------|------------|-----|
| Trial Run approval before Final Run | Yes — separate approval step | Trial auto-promotes, no separate approval | MEDIUM |
| Payroll run reports auto-generated (Employee Summary, Earnings & Deductions, Net Pay List) | Yes — auto-generated on completion | No auto-report generation | MEDIUM |
| Method of Calculation on salary transactions | Rate x Hours, Rate x Days, %-of-Basic, Fixed, Formula | FIXED, %-OF-BASIC, FORMULA — no Rate x Hours/Days | HIGH |
| Payroll cycle management (Monthly, Weekly, Fortnightly, Bi-Annual) | Full multi-cycle | Monthly implemented, schema supports others | LOW |
| Run Type: Normal, Supplementary, Bonus, 13th Cheque | Multiple run types | TRIAL/FINAL/ADHOC only | HIGH |
| Salary increase processing | Mass increase by % or amount | salary_increases table exists, no processing logic | HIGH |
| Back-pay / retro-pay calculation | Yes | retro-calculate endpoint exists but basic | MEDIUM |
| Gross-up calculation | Yes | gross-up endpoint exists but basic | MEDIUM |
| Payroll constants (WHPM, WDPM) | Configurable system-wide | payroll_constants table exists, hardcoded values in engine | MEDIUM |
| Nett-to-gross calculation | Yes — for guaranteed take-home | No | MEDIUM |

### Gaps vs World-Class ERPs
| Feature | SAP/Oracle/Sage | Our Status | Gap |
|---------|----------------|------------|-----|
| Parallel payroll simulation | Yes — what-if scenarios | No | HIGH |
| Retroactive payroll recalculation | Yes — automatic retro with GL adjustments | Basic retro endpoint | HIGH |
| Multi-payroll in same period (supplementary runs) | Yes | Schema supports, no logic | MEDIUM |
| Payroll costing allocation (cost centre split) | Yes — % allocation across cost centres | mSCOA segments on salary heads, no split | MEDIUM |
| Tax directive handling (lump sums, Section 10, Section 11) | Yes | No tax directives | HIGH |
| Leave encashment payroll integration | Yes — auto-calculates and taxes | Leave encash endpoint, not payroll-integrated | MEDIUM |
| Arrear deduction management | Yes — tracks arrears and recovers | No arrear tracking | HIGH |
| Garnishee order prioritisation (court order hierarchy) | Yes | instalments table, no legal hierarchy | HIGH |
| Deceased employee final pay | Yes — special handling | No | MEDIUM |
| Foreign worker tax (Section 10(1)(o)(ii)) | Yes | No | LOW |

---

## 3. mSCOA & GL INTEGRATION

### What We Have (Excellent)
- **7 mSCOA reference tables**: scoa_items (66 codes), scoa_functions (28), scoa_funds (13), scoa_projects (8), scoa_regions (7), scoa_costings (5), scoa_msc (12)
- **Full 7-segment classification** on salary heads (14 columns: debit+credit for item, fund, function, project, region, costing, msc)
- **GL journal creation**: Double-entry postings with all 7 segments
- **Auto GL post on approval**: System setting controlled
- **Sub-ledger with pagination**: Lazy-load employee detail
- **Reconciliation engine**: GL vs payroll results cross-check
- **mSCOA validation endpoint**: Validates mappings
- **NT-aligned codes**: IE001002001=Basic, IE001003001=Pension ER, IA001001001=Nett Pay, IA001001002=PAYE

### Gaps
| Feature | Expected | Our Status | Gap |
|---------|----------|------------|-----|
| mSCOA v7.1 vote number integration | Full vote structure | Reference tables only, no budget vote linkage | MEDIUM |
| Budget vs actual comparison per segment | Yes | No budget module integration | HIGH |
| GRAP 25 (Employee Benefits) accrual postings | Yes — leave liability, bonus accrual | No accrual postings | HIGH |
| Reversal journal capability | Yes — formal reversal entries | Basic void only | MEDIUM |
| Multi-year GL comparison | Yes | No | LOW |
| Journal narration/description per entry | Yes | Basic description only | LOW |

---

## 4. PAYMENT PROCESSING

### What We Have (Good)
- **Payment batches**: EMPLOYEE_NETT + THIRD_PARTY batches auto-generated
- **Batch lifecycle**: PENDING_REVIEW → REVIEWED → AUTHORIZED → SUBMITTED → PAID
- **EFT file generation**: Standard Bank ACB format with header/detail/trailer
- **Municipality bank details**: Configurable via system_settings
- **Payment reports**: Nett Pay Register, Deduction Register, Third-Party Summary, Bank Recon, Variance
- **Batch detail drill-through**: Paginated employee list with bank details
- **Manual EFT + Host-to-Host modes**: Configurable
- **System settings**: Auto GL post, auto batch generation, payment mode toggles

### Gaps
| Feature | Expected | Our Status | Gap |
|---------|----------|------------|-----|
| Real H2H bank API integration | Yes — Standard Bank/ABSA/FNB | Simulated only (reference generated, no API call) | HIGH |
| Multi-bank support (different banks for different batches) | Yes | Single municipality bank | MEDIUM |
| NAEDO/DebiCheck support | Yes — for deduction orders | No | LOW |
| Payment reconciliation with bank statement | Yes — auto-match | Manual only | MEDIUM |
| Payment schedule/future-dated payments | Yes | No scheduling | MEDIUM |
| ACB file format variants (Standard Bank, ABSA, FNB, Nedbank) | Bank-specific formats | Standard Bank only | MEDIUM |
| Split payments (employee with multiple bank accounts) | Yes — Sage/VIP supports | No | LOW |
| Cash payment tracking | Yes — for unbanked employees | No | LOW |

---

## 5. STATUTORY REPORTING (SARS)

### What We Have
- **IRP5/IT3(a)**: PDF generation with correct source codes (3000-3999 income, 4000-4999 deductions)
- **EMP201**: Monthly employer declaration with PAYE, UIF, SDL totals
- **EMP501**: Annual reconciliation with period-by-period breakdown
- **e@syFile CSV export**: Employee-level IRP5 data for bulk submission
- **Employment confirmation letter**: PDF generation
- **Payslip PDF**: BCEA Section 33 compliant with earnings, deductions, company contributions, nett pay
- **UI-19 UIF form**: PDF generation
- **MFMA Section 66**: Staff establishment report

### Gaps vs SARS Requirements
| Report/Filing | Required | Our Status | Gap |
|---------------|----------|------------|-----|
| IRP5 electronic submission format (IT3(a)01 text file) | Official SARS format | PDF only, not electronic format | HIGH |
| EMP201 eFiling integration | Auto-submit to SARS | PDF only | HIGH |
| EMP501 electronic reconciliation file | SARS-specified format | PDF only | HIGH |
| e@syFile import-ready format | Specific CSV structure | Basic CSV, may not match exact SARS schema | MEDIUM |
| Tax certificate (Section 18A) | For municipal donations | No | LOW |
| ROE (Return of Earnings) for COIDA | Annual submission | No COIDA/WCA integration | MEDIUM |
| UIF UI-19 electronic submission | Department of Labour format | PDF only | MEDIUM |
| SDL1 Annual SDL report | LGSETA submission | No | MEDIUM |
| ETI (Employment Tax Incentive) | Monthly calculation for qualifying employees | No ETI calculation or reporting | HIGH |

### Gaps vs World-Class ERPs
| Feature | SAP/Oracle/Sage | Our Status | Gap |
|---------|----------------|------------|-----|
| Payslip email distribution | Yes — bulk email/SMS | No — PDF download only | MEDIUM |
| Payslip self-service (employee downloads own) | Yes | ESS payslip endpoint exists, no UI | MEDIUM |
| Year-end tax certificate batch generation | Yes — all employees at once | One-by-one only | HIGH |
| Tax reconciliation dashboard | Yes — eFiling vs payroll comparison | No | MEDIUM |
| Amendment IRP5 (corrected certificates) | Yes | No | MEDIUM |

---

## 6. LEAVE MANAGEMENT

### What We Have
- Leave types, leave schemes, leave transactions
- Leave balance tracking per employee
- Approve/reject workflow
- BCEA Section 20 warning on insufficient balance
- Holiday calendar
- Accrual processing endpoint
- Carry-over and encashment endpoints
- Self-service leave request (ESS)
- Leave configuration in settings

### Gaps vs Platinum (Sebata) Manual
| Feature | Platinum Manual | Our Status | Gap |
|---------|----------------|------------|-----|
| Absence types (paid, unpaid, study, special) | Full absence type config | absence_types table exists, minimal integration | MEDIUM |
| Leave accrual rules per scheme (pro-rata, anniversary, calendar year) | Configurable per scheme | Basic accrual endpoint, no rule engine | HIGH |
| Leave balance auto-calculation on request | Yes — real-time check | Endpoint exists, balance check in UI | LOW |
| Maternity leave (4 consecutive months BCEA) | Special handling | Leave type exists, no BCEA enforcement | MEDIUM |
| Family responsibility leave (3 days BCEA) | Pro-rata rules | Leave type exists, no auto-limit | MEDIUM |
| Sick leave cycle (36 months / 30 days + 36 days) | BCEA Section 22 cycle tracking | No cycle tracking | HIGH |
| Leave reports (balance report, utilisation report) | Multiple reports | No dedicated leave reports | MEDIUM |
| Leave calendar view | Yes — visual calendar | No calendar view | MEDIUM |
| Manager approval dashboard | Yes — pending requests view | Basic approve endpoint only | MEDIUM |
| Leave cancellation and reversal | Yes | No cancellation workflow | MEDIUM |

### Gaps vs World-Class ERPs
| Feature | SAP/Oracle | Our Status | Gap |
|---------|------------|------------|-----|
| Leave policy engine (rules per bargaining council) | Yes | No rule engine | HIGH |
| Leave liability calculation (GRAP 25) | Yes — annual balance accrual costing | No financial integration | HIGH |
| Shift-aware leave calculation | Yes — considers shift patterns | No shift integration | MEDIUM |
| Public holiday auto-exclusion from leave days | Yes | No auto-exclusion logic | MEDIUM |

---

## 7. BENEFITS MANAGEMENT

### What We Have
- Medical aid schemes, employee enrolments, dependant tracking
- Retirement fund types, employee funds
- Group life insurance
- Cost split (employee/employer portions)
- Benefits CRUD endpoints (13 endpoints)
- Benefits UI module

### Gaps vs Platinum (Sebata) Manual
| Feature | Platinum Manual | Our Status | Gap |
|---------|----------------|------------|-----|
| Step-by-step benefit plan setup wizard | Yes — guided flow | No wizard | MEDIUM |
| Benefit plan termination (when employee leaves) | Yes — auto-terminate linked benefits | No auto-termination | HIGH |
| Benefit plan effective dates (start/end) | Yes | Basic dates only | LOW |
| Dependant eligibility rules (age limits, student status) | Yes | No rule enforcement | MEDIUM |
| Medical aid rate tables (scheme-specific rates) | Yes — per scheme rates | No rate tables | HIGH |
| Retirement fund contribution rate changes | Yes — effective-dated | No rate change history | MEDIUM |
| Benefit cost projection | Yes — what-if for package changes | No | MEDIUM |
| Benefit reports | Yes — per scheme, per employee | No dedicated reports | MEDIUM |

### Gaps vs World-Class ERPs
| Feature | SAP/Oracle/Sage | Our Status | Gap |
|---------|----------------|------------|-----|
| Open enrollment periods | Yes | No | LOW |
| Life event processing (marriage, birth, etc.) | Yes — triggers benefit changes | No | HIGH |
| Flexible benefits / cafeteria plan | Yes | No | MEDIUM |
| Retirement fund actuarial integration | Yes | No | LOW |
| Council for Medical Schemes integration | Yes | No | LOW |

---

## 8. TIME & ATTENDANCE

### What We Have
- Work shifts with start/end times, breaks
- Shift rosters (employee-to-shift assignment)
- Shift rotations
- Employee attendance (clock in/out, hours worked)
- Overtime transactions with approval
- Flexi-time balances
- BCEA overtime rate calculation endpoint
- 18 API endpoints

### Gaps vs Platinum (Sebata) Manual
| Feature | Platinum Manual | Our Status | Gap |
|---------|----------------|------------|-----|
| Shift substitution capture | Yes — key feature | No substitution workflow | HIGH |
| Shift report and shift rotation report | Yes | No reports | MEDIUM |
| Work shift settings (config screen) | Yes — detailed setup | Basic CRUD only | LOW |
| Shift rotation pattern definition (e.g., 4-on-4-off) | Yes | shift_rotations table exists, no rotation logic | MEDIUM |

### Gaps vs World-Class ERPs
| Feature | SAP/Oracle | Our Status | Gap |
|---------|------------|------------|-----|
| Biometric device integration (ZKTeco, Suprema) | Yes — real-time sync | No integration, manual data only | HIGH |
| GPS/geofence clock-in (mobile) | Yes | No | MEDIUM |
| Ghost employee detection algorithm | Expected for municipalities | No detection logic | HIGH |
| Automatic overtime calculation from attendance | Yes | Overtime is manual capture only | HIGH |
| Exception-based time management | Yes — flag anomalies only | No | MEDIUM |
| Working time calendar per location | Yes | holidays table, no location-specific | LOW |
| BCEA Section 9-18 enforcement (max hours, rest periods) | Yes | No enforcement | HIGH |

---

## 9. CLAIMS & TRAVEL

### What We Have
- Claims table (type, sub_type, amount, kilometres, project override)
- Claims API endpoints in time.routes.js
- Approval workflow (status-based)

### Gaps vs Platinum (Sebata) Manual
| Feature | Platinum Manual | Our Status | Gap |
|---------|----------------|------------|-----|
| Claim types configuration (travel, S&T, cell phone, etc.) | Yes — configurable claim types | Hardcoded types only | MEDIUM |
| Kilometre rate configuration per claim type | Yes | No rate configuration | HIGH |
| S&T (Subsistence & Travel) daily rates | Yes — per location | No S&T rates | HIGH |
| Claims approval workflow with limits | Yes — approval chains | Basic approve/reject | MEDIUM |
| Claims reports | Yes — per employee, per type, per period | No claims reports | MEDIUM |
| Claims settings configuration screen | Yes | No settings UI | MEDIUM |
| Receipt/supporting document attachment | Yes | No document attachment | HIGH |

---

## 10. INSTALMENTS / GARNISHEE ORDERS

### What We Have
- Instalments table (salary_head, total_amount, monthly_instalment, period_months, balance, vendor)
- API endpoints for CRUD
- Basic UI in payroll module

### Gaps vs Platinum (Sebata) Manual
| Feature | Platinum Manual | Our Status | Gap |
|---------|----------------|------------|-----|
| Instalment balance tracking and auto-reduction | Yes — decrements per payroll run | No auto-deduction from payroll | HIGH |
| Instalment completion detection (balance = 0) | Yes — auto-end | No auto-end | HIGH |
| Garnishee order court compliance (Magistrate's Court Act) | Yes | No legal compliance checks | HIGH |
| Instalment linked to salary transaction | Yes — auto-creates payroll deduction | No payroll integration | HIGH |
| Instalment reports | Yes | No reports | MEDIUM |
| Maximum garnishee deduction limit (25% of remuneration) | Yes — BCEA enforcement | No limit check | HIGH |

---

## 11. OVERTIME MANAGEMENT

### What We Have
- Overtime transactions (hours, rate_multiplier, amount)
- Approval workflow
- BCEA rate calculation endpoint

### Gaps vs Platinum (Sebata) Manual
| Feature | Platinum Manual | Our Status | Gap |
|---------|----------------|------------|-----|
| Overtime approval workflow (submit → manager → approve) | Yes — multi-step | Basic status change | MEDIUM |
| BCEA overtime rate calculation (1.5x weekday, 2x Sunday/PH) | Yes — auto-calc | Endpoint exists, not auto in payroll | HIGH |
| Overtime linked to attendance data | Yes | No attendance linkage | HIGH |
| Overtime reports (per employee, per department, per period) | Yes | No overtime reports | MEDIUM |
| Maximum overtime limit enforcement (BCEA 10hrs/week) | Yes | No enforcement | HIGH |
| Pre-authorised overtime (before the event) | Yes | No pre-authorisation flow | MEDIUM |
| Overtime integration with payroll run (auto-include) | Yes — auto-picks up approved OT | No payroll integration | HIGH |

---

## 12. EMPLOYEE TERMINATION

### What We Have
- employee_terminations table (type, reason, last_date, assets_returned, outstanding_transactions, tax_directive)
- Termination endpoint in employee.routes.js

### Gaps vs Platinum (Sebata) Manual
| Feature | Platinum Manual | Our Status | Gap |
|---------|----------------|------------|-----|
| Step-by-step termination wizard | Yes — 10+ step guided process | Simple form | HIGH |
| Leave payout calculation on termination | Yes — auto-calculates outstanding leave value | No leave payout calc | HIGH |
| Pro-rata bonus calculation | Yes — 13th cheque pro-rata | No | HIGH |
| Final payroll run for terminated employee | Yes — special run type | No special handling | HIGH |
| Tax directive application (lump sums, Section 10) | Yes — SARS directive workflow | No directive handling | HIGH |
| Notice period calculation (BCEA Section 37) | Yes — auto-calculates based on service length | No calculation | HIGH |
| Severance pay calculation (BCEA Section 41) | Yes — 1 week per completed year | No calculation | HIGH |
| Contract expiry report | Yes | No contract expiry tracking | MEDIUM |
| Termination report (per reason, per period) | Yes | No reports | MEDIUM |
| Asset return checklist | Yes — IT equipment, keys, etc. | Boolean field only, no checklist | MEDIUM |
| Exit interview recording | Yes | No | LOW |
| UIF UI-8 form (termination notification) | Yes | No | MEDIUM |
| Re-employment eligibility flag | Yes | No | LOW |

---

## 13. STAFF ESTABLISHMENT (Positions & Job Profiles)

### What We Have (Good)
- Positions with department, division, grade, reporting structure
- Job profiles with requirements
- Task grades and notches
- Position history
- Organogram display (tree view)
- Position CRUD (10 endpoints)

### Gaps vs Platinum (Sebata) Manual (85 pages)
| Feature | Platinum Manual | Our Status | Gap |
|---------|----------------|------------|-----|
| Job Profile tabs: Profile, Competency, Authority, History | Yes — 4 tabs | Basic profile only, no competency/authority tabs | HIGH |
| Competency framework (core, leadership, functional) | Yes — rated 1-5 | No competency model | HIGH |
| Authority levels per job profile | Yes — financial/administrative delegations | No | HIGH |
| Position tabs: Position, Qualification, Skills, Competency | Yes — 4 tabs | Basic position only | HIGH |
| Position costing (budget allocation per position) | Yes | No budget/costing | HIGH |
| Organogram report (printable, exportable) | Yes — PDF/print | View only, no export | MEDIUM |
| Task grade report | Yes | No | MEDIUM |
| Staff establishment report (filled vs vacant) | Yes | Dashboard stat only | MEDIUM |
| Position approval workflow | Yes | No approval | MEDIUM |
| Job evaluation integration (Hay, Patterson, TASK) | Yes — TASK system | Task grades exist, no evaluation process | MEDIUM |

---

## 14. RECRUITMENT & ONBOARDING

### What We Have
- Recruitment vacancies (position, requisition, salary range, requirements, duties)
- Applicants (name, contact, CV, status, rating)
- Interview slots
- Onboarding checklists and items
- 15 API endpoints

### Gaps vs World-Class ERPs
| Feature | SAP/Oracle/Sage | Our Status | Gap |
|---------|----------------|------------|-----|
| Job posting to external portals | Yes | No | MEDIUM |
| Applicant scoring/ranking matrix | Yes | Basic rating field | MEDIUM |
| Interview scheduling with calendar | Yes | interview_slots table, no calendar UI | MEDIUM |
| Automated offer letter generation | Yes | No | MEDIUM |
| Background check integration | Yes | No | LOW |
| Onboarding workflow with task assignment | Yes | Checklist exists, no workflow | MEDIUM |
| Probation period management | Yes — alerts on expiry | No probation tracking | HIGH |
| Recruitment pipeline dashboard | Yes | No | MEDIUM |

---

## 15. PERFORMANCE MANAGEMENT

### What We Have
- Performance periods, indicators (KPIs with quarterly targets/actuals)
- 360-degree feedback (questions, respondents, responses)
- PIP plans with milestones
- Performance goals
- 17 API endpoints

### Gaps
| Feature | Expected | Our Status | Gap |
|---------|----------|------------|-----|
| Performance review forms (scorecards) | Yes | No form/scorecard UI | HIGH |
| Goal cascading (org → dept → individual) | Yes | No cascading | MEDIUM |
| Rating calibration sessions | Yes | No | LOW |
| Performance-linked pay increases | Yes | No integration | HIGH |
| Balanced Scorecard methodology | Yes — for municipalities | No | MEDIUM |
| SDBIP integration (Service Delivery & Budget Implementation Plan) | Yes — municipal requirement | No | HIGH |
| Competency assessment integration | Yes | No | MEDIUM |

---

## 16. SKILLS & TRAINING

### What We Have
- Training courses, qualifications, training records
- WSP (Workplace Skills Plan) summary endpoint
- 9 API endpoints

### Gaps
| Feature | Expected | Our Status | Gap |
|---------|----------|------------|-----|
| WSP/ATR submission format (LGSETA) | Yes — specific format | Summary only, no export format | HIGH |
| Training budget tracking | Yes | No | MEDIUM |
| CPD (Continuing Professional Development) tracking | Yes | No | LOW |
| Skills gap analysis (required vs actual) | Yes | No analysis | HIGH |
| Training calendar | Yes | No | MEDIUM |
| NQF level tracking | Yes | qualification table has no NQF field | MEDIUM |
| SAQA verification integration | Yes | No | LOW |

---

## 17. DISCIPLINARY & GRIEVANCE

### What We Have
- Disciplinary cases (charge, hearing, outcome, sanction, appeal, CCMA)
- Grievances (description, category, investigator, resolution)
- 7 API endpoints

### Gaps
| Feature | Expected | Our Status | Gap |
|---------|----------|------------|-----|
| LRA Schedule 8 compliance (Code of Good Practice) | Required | No compliance checks | HIGH |
| Progressive discipline tracking (verbal → written → final → dismissal) | Yes | No progression tracking | HIGH |
| Notice to attend hearing template | Yes | No document generation | MEDIUM |
| Hearing minutes recording | Yes | No | MEDIUM |
| Outcome letter generation | Yes | No | MEDIUM |
| CCMA case management workflow | Yes | Basic fields only | MEDIUM |
| Arbitration tracking | Yes | ccma_outcome field only | LOW |
| Grievance SLA tracking (21 days per collective agreement) | Yes | No SLA tracking | MEDIUM |

---

## 18. EMPLOYMENT EQUITY

### What We Have
- EE plans and targets tables
- Workforce profile endpoint (demographics by race, gender, disability)
- EE summary and target tracking endpoints

### Gaps
| Feature | Expected | Our Status | Gap |
|---------|----------|------------|-----|
| EEA2 form generation (Workforce Profile) | Yes — DoL format | No form generation | HIGH |
| EEA4 form generation (Income Differentials) | Yes — DoL format | No | HIGH |
| Numerical targets by occupational level | Yes — OL1-OL8 | Targets table, no OL classification | HIGH |
| EE barrier analysis | Yes | No | MEDIUM |
| Affirmative action measures | Yes | No | MEDIUM |
| EE committee management | Yes | No | LOW |
| Annual EE report submission | Yes — electronic format | No | HIGH |
| Designated employer threshold check | Yes | No | LOW |

---

## 19. SECURITY & ACCESS CONTROL

### What We Have
- Basic authentication middleware
- Audit log table with user tracking
- Role-based route protection
- API rate limiting

### Gaps
| Feature | Expected | Our Status | Gap |
|---------|----------|------------|-----|
| RBAC with permissions matrix | Yes — granular per module | Basic auth only, no permissions | HIGH |
| Field-level security (hide salary from non-payroll users) | Yes — POPIA requirement | No | HIGH |
| Multi-factor authentication | Yes | No | MEDIUM |
| Password policy enforcement | Yes | No | MEDIUM |
| Session management and timeout | Yes | No explicit session management | MEDIUM |
| User activity logging | Yes | audit_log captures some actions | LOW |
| Data masking (ID numbers, bank details) | Yes — POPIA | Partial (bank account last 4 digits in UI) | MEDIUM |
| Delegation of authority (acting capacity) | Yes — municipal requirement | No | HIGH |
| IP restriction / geo-fencing | Yes | No | LOW |

---

## 20. AUDIT & COMPLIANCE

### What We Have
- Audit log table (action, entity, user, timestamp)
- AG READY badge on dashboard
- Audit entries count (7-day window)
- mSCOA validation
- Reconciliation engine (GL vs payroll)

### Gaps
| Feature | Expected | Our Status | Gap |
|---------|----------|------------|-----|
| AG-style automated validation tests | Comprehensive test suite | Badge only, no real tests | HIGH |
| MFMA Section 65/66 compliance dashboard | Yes | Basic S66 report only | HIGH |
| Segregation of duties enforcement | Yes — capture ≠ approve ≠ authorize | No enforcement | HIGH |
| Evidence vault (documents linked to transactions) | Yes | Basic document upload | HIGH |
| Configuration change audit trail | Yes — track setting changes | No | MEDIUM |
| Data retention policy (POPIA) | Yes — auto-archive after prescribed period | No | MEDIUM |
| Internal control framework integration | Yes | No | HIGH |

---

## 21. NOTIFICATIONS & WORKFLOW ENGINE

### What We Have
- Notifications table with mark-read
- Notification bell in topbar
- Basic approval workflows table
- Email notification endpoint (basic)

### Gaps
| Feature | Expected | Our Status | Gap |
|---------|----------|------------|-----|
| Configurable workflow engine (n-step approval chains) | Yes | Basic approve/reject only | HIGH |
| Email/SMS notification delivery | Yes | Endpoint exists, no actual email sending | HIGH |
| In-app notifications for pending actions | Yes | Bell count exists, no action-specific | MEDIUM |
| Escalation rules (if not actioned within X days) | Yes | No | HIGH |
| Delegation during absence (out-of-office routing) | Yes | No | HIGH |
| Batch notification for payroll events | Yes | No | MEDIUM |

---

## 22. DATA QUALITY & VALIDATION GAPS

| Validation | Expected | Status |
|-----------|----------|--------|
| SA ID number validation (Luhn check) | Yes | No validation |
| Tax number format validation | Yes | No validation |
| Bank account verification (CDV check) | Yes | No validation |
| Duplicate employee detection | Yes | No duplicate check |
| Mandatory field enforcement (server-side) | Yes | Minimal validation |
| Date logic (end date > start date) | Yes | Minimal validation |
| Salary range validation per grade/notch | Yes | No validation |
| BCEA minimum wage enforcement | Yes | No enforcement |

---

## 23. MISSING MODULES (Not Built At All)

| Module | SAP/Oracle | Platinum Manual | Priority |
|--------|-----------|----------------|----------|
| Budgeting & CoE Projections | Yes | Expected | HIGH |
| Salary Increase Processing (Annual) | Yes | Expected | HIGH |
| COIDA / Workmen's Compensation | Yes | Yes | MEDIUM |
| Employee Import/Migration Tool | Yes | Expected | HIGH |
| Councillor Payroll (upper limits, no benefits) | Municipal-specific | Expected | HIGH |
| Multi-municipality/entity support | Yes | Expected for metros | MEDIUM |
| Mobile App / Progressive Web App | Yes | Expected | MEDIUM |
| Business Intelligence / Data Warehouse | Yes | Expected | LOW |
| API integration layer (third-party systems) | Yes | Expected | MEDIUM |

---

## COMPARISON MATRIX: Platinum New vs Leading ERPs

| Capability | SAP SF | Oracle HCM | Sage/VIP | PaySpace | Platinum New |
|-----------|--------|------------|----------|----------|-------------|
| Core HR | 98% | 97% | 90% | 85% | 75% |
| Payroll Engine | 95% | 95% | 92% | 90% | 82% |
| mSCOA Compliance | 40% | 30% | 70% | 60% | 90% |
| SA Tax (PAYE/UIF/SDL) | 95% | 90% | 95% | 95% | 82% |
| SARS Reporting | 90% | 85% | 95% | 92% | 70% |
| Leave Management | 95% | 95% | 90% | 88% | 65% |
| Benefits | 95% | 95% | 85% | 75% | 55% |
| Time & Attendance | 90% | 92% | 80% | 70% | 50% |
| Recruitment | 95% | 98% | 60% | 50% | 45% |
| Performance | 95% | 95% | 50% | 40% | 50% |
| Employee Self-Service | 95% | 95% | 85% | 90% | 50% |
| Reporting/Analytics | 98% | 98% | 85% | 80% | 60% |
| Workflow Engine | 98% | 98% | 75% | 70% | 35% |
| Security/RBAC | 98% | 98% | 85% | 80% | 30% |
| Municipal-Specific | 20% | 15% | 45% | 35% | 90% |
| **Overall** | **89%** | **88%** | **79%** | **75%** | **62%** |

**Key Takeaway:** Platinum New's strongest differentiator is **mSCOA compliance (90%)** and **municipal-specific features (90%)**. No other ERP on the market matches this. The weakest areas are **security/RBAC (30%)**, **workflow engine (35%)**, and **recruitment (45%)**.

---

## PRIORITY REMEDIATION ROADMAP

### Phase 1: Critical (Must-Have for Production)
1. **RBAC & Field-Level Security** — POPIA compliance, segregation of duties
2. **Workflow Engine** — Configurable n-step approval chains
3. **Employee Termination Wizard** — Leave payout, pro-rata, tax directive, final pay
4. **Salary Increase Processing** — Annual increases, arrear calculations
5. **Overtime → Payroll Integration** — Auto-include approved overtime
6. **Instalment → Payroll Integration** — Auto-deduct, balance tracking, garnishee limits
7. **SARS Electronic Filing Formats** — IRP5 text file, EMP201/501 eFiling format
8. **ETI (Employment Tax Incentive)** — Monthly calculation for eligible employees
9. **Data Validation Layer** — ID number, tax number, bank account, duplicates

### Phase 2: Important (Required for Go-Live)
10. **Leave Policy Engine** — BCEA sick leave cycle, accrual rules, auto-exclusion of holidays
11. **Claims Management** — Rate configuration, S&T, receipt attachment
12. **Benefits Plan Termination** — Auto-terminate on employee exit
13. **Biometric Integration** — ZKTeco/Suprema API for attendance
14. **Ghost Employee Detection** — Cross-reference attendance vs payroll
15. **Employee Import Tool** — CSV/Excel data migration
16. **Payslip Email Distribution** — Bulk email payslips
17. **Budget vs Actual** — mSCOA segment-level budget comparison

### Phase 3: Enhancement (Value-Add)
18. **EE Reporting** — EEA2/EEA4 form generation
19. **Performance Scorecards** — Review forms, goal cascading
20. **Competency Framework** — Job profile competencies
21. **Councillor Payroll** — Upper limits, special rules
22. **Mobile/PWA** — Employee self-service mobile
23. **H2H Bank Integration** — Real API for Standard Bank/ABSA
24. **GRAP 25 Accruals** — Leave liability, bonus provision postings

---

## APPENDIX A: Module-by-Module Line Count

| Component | Lines | Status |
|-----------|-------|--------|
| payroll.routes.js | 2,385 | Production-quality |
| payroll.js (frontend) | 2,965 | Production-quality |
| dashboard.js | 1,682 | Production-quality |
| employees.js (frontend) | 1,634 | Good |
| organogram.js | 1,165 | Good |
| leave.js (frontend) | 1,080 | Good |
| reports.js (frontend) | 1,046 | Good |
| performance.js | 909 | Good |
| settings.js | 823 | Good |
| positions.js | 834 | Good |
| employee.routes.js | 698 | Good |
| time.routes.js | 585 | Good |
| report.routes.js | 664 | Good |
| benefits.routes.js | 375 | Functional |
| recruitment.js | 662 | Functional |
| benefits.js | 578 | Functional |
| leave.routes.js | 485 | Functional |
| payroll-engine.js | 524 | Core — production-quality |
| statutory-reports.service.js | 262 | Functional |
| payslip.service.js | 209 | Good |
| eft.service.js | 107 | Good |
| **Total** | **23,183** | — |

## APPENDIX B: Database Table Count

- **Total Tables:** 97
- **With Data:** employees (5,025), salary_heads (36), payroll_runs (12), payroll_results (296,881), GL journals (192), payment_batches (7), salary_transactions (42,786), leave_transactions (16)
- **Empty/Stub:** claims (0), disciplinary_cases (0), training_records (0), recruitment_vacancies (0), overtime (1)

## APPENDIX C: API Endpoint Count

| Route File | Endpoints |
|-----------|-----------|
| payroll.routes.js | 45 |
| report.routes.js | 24 |
| employee.routes.js | 23 |
| settings.routes.js | 22 |
| time.routes.js | 18 |
| performance.routes.js | 17 |
| recruitment.routes.js | 15 |
| benefits.routes.js | 13 |
| leave.routes.js | 13 |
| position.routes.js | 10 |
| ess.routes.js | 9 |
| skills.routes.js | 9 |
| notification.routes.js | 8 |
| disciplinary.routes.js | 7 |
| dashboard.routes.js | 6 |
| document.routes.js | 6 |
| department.routes.js | 6 |
| health.routes.js | 1 |
| **Total** | **252** |

---

*End of Gap Analysis*
