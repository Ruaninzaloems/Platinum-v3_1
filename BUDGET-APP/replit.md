# Platinum ERP Budget Management Module

## Overview
A comprehensive municipal budget management system for South African local government municipalities. Built with Angular (latest) frontend and .NET Core 10 backend with PostgreSQL database.

## Architecture
- **Frontend**: Angular 21 with Angular Material (M3), SCSS, standalone components
- **Backend**: .NET 10 Web API with Entity Framework Core, Npgsql
- **Database**: PostgreSQL (Replit built-in)
- **Design System**: Platinum SCM Style Guide (navy #0f2b46 / gold #c9a84c branding)

## Angular Build Process
- Build: `cd platinum-budget-ui && npx ng build --configuration=production`
- Output: `platinum-budget-ui/dist/platinum-budget-ui/browser/`
- Deploy: `cp -r dist/platinum-budget-ui/browser/. dist/browser/`
- The .NET server reads from `../platinum-budget-ui/dist/browser` (relative to API project)
- After rebuilding, also copy to `PlatinumBudget.Api/wwwroot/` if needed
- Route ordering matters: more-specific routes (e.g. `projects/capture`) MUST appear BEFORE less-specific ones (`projects`) to prevent prefix-match collisions

## Project Structure

### Backend (`PlatinumBudget.Api/`)
- `Program.cs` — App entry, DI configuration, database initialization
- `Models/` — Domain entities (FinancialYear, BudgetVersion, BudgetString, Project, ScoaSegments, VirementRequest, etc.)
- `Models/Enums.cs` — Enums for version types, statuses, project types
- `Data/BudgetDbContext.cs` — EF Core DbContext with full relationship configuration
- `Data/SeedData.cs` — mSCOA segments, departments, sample financial years, projects, budget versions, budget strings
- `Services/` — Business logic layer:
  - `BudgetVersionService.cs` — Version lifecycle (create/submit/approve/lock/clone/diff)
  - `BudgetStringService.cs` — CRUD, summary, segment string composition
  - `ValidationService.cs` — Rule engine (zero amounts, monthly mismatch, high growth, inactive segments)
  - `VirementService.cs` — Transfer workflow + auto-allocation update
  - `DashboardService.cs` — CFO KPIs, MTREF summary, budget overview, byDepartment/byFunction breakdowns
  - `AuditService.cs` — Audit trail logging
- `Controllers/` — REST API endpoints:
  - `BudgetVersionsController.cs` — Full CRUD + workflow (submit/approve/lock/clone/diff)
  - `BudgetStringsController.cs` — CRUD, validation, summary, bulk operations
  - `ScoaController.cs` — mSCOA segment lookups (items/funds/functions/projects/regions/costings/mscs)
  - `VirementsController.cs` — Virement lifecycle (create/submit/approve/reject)
  - `ProjectsController.cs` — Project CRUD with department/type filters
  - `DashboardController.cs` — CFO dashboard, validation dashboard, budget overview, MTREF summary
  - `ReportsController.cs` — Budget vs Actual, Schedule A (NT format), mSCOA string export, virement register, adjustment register
  - `FinancialYearsController.cs`, `DepartmentsController.cs` — Lookup endpoints
- `DTOs/` — Data transfer objects for dashboard, reports, and API responses

### Frontend (`platinum-budget-ui/`)
- `src/app/app.ts` — Root component with sidenav layout
- `src/app/app.routes.ts` — Lazy-loaded routes
- `src/app/app.config.ts` — App configuration (HttpClient, Router, Animations)
- `src/app/services/api.service.ts` — API client for all backend endpoints (30+ methods)
- `src/app/models/budget.models.ts` — TypeScript interfaces (25+ models)
- `src/app/pages/` — Page components:
  - `dashboard/` — CFO Dashboard with KPIs, version status, budget by function, monthly trend bar chart
  - `budget-versions/` — Version list with filters + version detail with workflow stepper, approval timeline
  - `budget-strings/` — mSCOA string table with 7-segment display, validation dialog, add string with segment pickers
  - `projects/` — Extended project capture workspace: summary KPI cards (Capital/Operational/Revenue/Total Budget), project register with SCOA line counts, tabbed create/edit dialog (Project Details tab with 4 form sections: Basic Info, Organisation & Location, IDP Linkage, Project Management; SCOA Budget Lines tab with multi-line segment pickers for Item/Function/Fund/Region/Costing/Department, MTREF amounts Y1/Y2/Y3, monthly cashflow grid with even-split and mismatch warning, SCOA totals summary), project detail dialog with budget lines table showing segment tags and expandable cashflow rows
  - `virements/` — Full virement workspace: KPI cards (Draft/Pending/Posted/Rejected/Total), status-filtered data table, 4-step create wizard (SCOA Selection → Amount & Motivation → Policy Check → Confirm), side-by-side From/To 7-segment pickers with budget summaries, budget impact preview, policy validation, detail dialog with approval chain timeline, multi-level approval actions (Dept Head → Budget Office → CFO → MM → Council)
  - `validation/` — Validation engine dashboard with pass/warn/error KPIs, top failures list, run results
  - `reports/` — 5 tabs: Budget Overview, MTREF Summary, Schedule A (NT format), Budget vs Actual, Virement Register; CSV export + print
  - `analytics/` — CFO analytics with Chart.js: Budget by Department (bar), Revenue/Expenditure/Capital (doughnut), Budget vs Actual trend (line), MTREF by Function (horizontal bar)

### Billing Budgeting Submodule (`PlatinumBudget.Api/` + `platinum-budget-ui/src/app/pages/billing/`)
- **Backend Services**:
  - `Services/TariffModellingService.cs` — Tariff scenario creation with auto-calculated lines, revenue projections per service/consumer
  - `Services/RevenueProjectionService.cs` — Revenue calculation: consumers x consumption x tariff rate, seasonal monthly split, MTREF Y2/Y3 growth
  - `Services/RebateProjectionService.cs` — Indigent/senior/early-payment rebate projections with uptake rates
  - `Services/BillingBudgetStringService.cs` — mSCOA budget string generation from approved revenue projections
  - `Controllers/BillingBudgetController.cs` — All billing API endpoints (service-categories, tariffs, scenarios, consumers, revenue, rebates, draft-budget, integration-status)
  - `Models/BillingBudget.cs` — ServiceCategory, Tariff, TariffScenario, TariffScenarioLine, ConsumerCategory, ConsumerCategoryService, RevenueProjection, RebateType, RebateProjection, BillingBudgetApproval
  - `DTOs/BillingBudgetDtos.cs` — Request/response DTOs for all billing endpoints
- **Frontend Pages** (all standalone components with OnPush change detection):
  - `billing/tariffs/` — Service categories with expandable tariff tables, create/edit tariff dialog
  - `billing/scenarios/` — Tariff scenario modelling with comparison view, submit/approve workflow
  - `billing/consumers/` — Consumer categories with projected bills panel, impact analysis
  - `billing/revenue/` — Revenue projections with summary table, monthly cashflow, mSCOA tags
  - `billing/rebates/` — Rebate types and projections with calculate/submit/approve actions
  - `billing/draft-budget/` — Consolidated draft revenue budget with mSCOA segment breakdown, integration status bar, budget string generation dialog
- **NT Requirements**: BILB1-BILB38 covered (Functional, Reporting, Integration, Workflow)
- **mSCOA Mappings**: Water=1300, Electricity=1200, Sanitation=1400, Refuse=1500, PropertyRates=1100; Functions: Water/Sanitation=WATER, Electricity=ELEC, Refuse=WASTE, Rates=GOV
- **Seed Data**: 5 service categories, 12 tariffs, 4 consumer categories, 20 consumer-service mappings, 5 rebate types, 2 tariff scenarios with calculated lines

### Creditors Budgeting Submodule (`PlatinumBudget.Api/` + `platinum-budget-ui/src/app/pages/creditors/`)
- **Backend Services**:
  - `Services/ExpenditureModellingService.cs` — Expenditure scenario creation with inflation/demand adjustments, sensitivity analysis, what-if comparisons, variability flagging
  - `Services/ExpenditureProjectionService.cs` — Expenditure projections from cost items: unit rates x quantities, VAT calculation, monthly split, MTREF Y2/Y3 growth projections
  - `Services/CreditorLiabilityService.cs` — Creditor liability data string generation with contra bank accounts, payment rate application, age analysis, prior-year liability carry-forward
  - `Services/CreditorsBudgetStringService.cs` — mSCOA budget string mapping for creditor expenditure integration with core budget management
  - `Controllers/CreditorsBudgetController.cs` — All creditors API endpoints (expenditure-categories, cost-items, scenarios, creditor-categories, projections, liabilities, payment-arrangements, forecast-assumptions, sensitivity-analysis, draft-budget, budget-strings, integration-status)
  - `Models/CreditorsBudget.cs` — ExpenditureCategory, CostItem, ExpenditureScenario, ExpenditureScenarioLine, CreditorCategory, CreditorCategoryItem, ExpenditureProjection, CreditorLiability, CreditorPaymentArrangement, ForecastAssumption, CreditorsBudgetApproval
  - `DTOs/CreditorsBudgetDtos.cs` — Request/response DTOs for all creditor endpoints
- **Frontend Pages** (all standalone components with OnPush change detection):
  - `creditors/expenditure/` — Expenditure categories with expandable cost item tables, supplier linkage, variability flags, create/edit cost item dialog
  - `creditors/scenarios/` — Expenditure scenario modelling (what-if analysis) with inflation adjustments, forecast assumptions table, sensitivity analysis display
  - `creditors/categories/` — Creditor categories with payment rate tables (30/60/90 day), age analysis, payment arrangement display with instalment schedules
  - `creditors/projections/` — Expenditure projections with summary by category, mSCOA tags, calculate/submit/approve actions, bulk operations
  - `creditors/liabilities/` — Creditor liability data strings with contra bank accounts, opening/closing balances, MTREF summary grid, generate liabilities action
  - `creditors/draft-budget/` — Consolidated draft expenditure budget with mSCOA integration, integration status bar, budget totals with navy/gold highlight, generate budget strings action
- **NT Requirements**: CRB1-CRB56 covered (Expenditure Modelling, Scenario Analysis, Creditor Payment Rates, Projections, Liabilities, Approval Workflows, mSCOA Integration)
- **mSCOA Mappings**: EmployeeCosts=2100, BulkPurchases=2200, ContractedServices=2300, GeneralExpenses=2400, R&M=2500, OtherExpenditure=2600; Fund=CF; Functions: EmployeeCosts/ContractedServices/GeneralExpenses/Other=GOV, BulkPurchases=ELEC, R&M=INFRA
- **Seed Data**: 6 expenditure categories, 15 cost items, 4 creditor categories (Current/30-day/60-day/90+-day), 5 forecast assumptions (CPI/PPI/Wage/Electricity/Water), 3 payment arrangements, 2 expenditure scenarios (Baseline CPI/High Inflation), 15 expenditure projections (~R112M total), 6 creditor liabilities
- **Enums**: ExpenditureCategoryType, CostItemType, VatIndicator, CreditorCategoryType, CreditorApprovalStatus, CreditorApprovalType, PaymentArrangementStatus, ForecastAssumptionType (all stored as strings in PostgreSQL via HasConversion<string>())

### HR & Payroll Budgeting Submodule (`PlatinumBudget.Api/` + `platinum-budget-ui/src/app/pages/hr-payroll/`)
- **Backend Services**:
  - `Services/HrPayrollCalculationService.cs` — Personnel cost calculations: salary increases (percentage & notch progression), temporary contract budgets, councillor remuneration, ward committee costs, variable benefits (overtime/standby/shift/acting), travel budgets, performance bonuses, vacant post prorated costs
  - `Services/StatutoryDeductionService.cs` — PAYE (embedded SA tax tables), UIF (1%+1% with threshold), SDL (1%), pension, medical aid, union fees, group life; payroll liability aggregation
  - `Services/DefinedBenefitService.cs` — DBO movement calculations (service cost, interest cost, actuarial gains/losses), current/non-current allocation, long service award milestone projections, estimated benefit payments
  - `Services/PayrollScenarioService.cs` — What-if scenario modelling with salary increase/vacancy filling/benefit adjustment assumptions, baseline vs scenario comparison
  - `Services/HrPayrollBudgetStringService.cs` — mSCOA budget string generation from approved payroll budget lines with segment validation
  - `Controllers/HrPayrollBudgetController.cs` — All HR payroll API endpoints (~45 endpoints covering post establishments, salary structures, councillors, ward committees, variable benefits, travel, statutory deductions, DBOs, long service awards, scenarios, draft budget, amendments, approvals)
  - `Models/HrPayrollBudget.cs` — PostEstablishment, SalaryStructure, SalaryIncrease, TemporaryContract, CouncillorPosition, WardCommitteeBudget, VariableBenefitHours, TravelRequirement, TravelStandardRate, StatutoryDeduction, PayrollLiability, DefinedBenefitObligation, LongServiceAward, PerformanceBonus, PayrollScenario, PayrollBudgetLine, HrPayrollBudgetApproval
  - `DTOs/HrPayrollBudgetDtos.cs` — Request/response DTOs for all HR payroll endpoints
- **Frontend Pages** (all standalone components with OnPush change detection):
  - `hr-payroll/post-establishment/` — Post establishment register with KPIs (21 posts, fill rate, vacancy count), salary structure grade/notch table, vacant posts ranking with priority scores and recruitment strategies, organogram summary by department
  - `hr-payroll/salary-calculations/` — Salary increases by employee category, notch progression, temporary contracts (3 seeded), performance bonuses (3 categories), vacant post budget prorations
  - `hr-payroll/variable-benefits/` — Variable benefit hours by department/type (overtime/standby/shift/acting), hours history with trends, travel requirements with standard rates, travel trends
  - `hr-payroll/statutory-deductions/` — 7 deduction types (PAYE/UIF/SDL/Pension/MedicalAid/UnionFees/GroupLife), payroll liabilities by department, payment phasing
  - `hr-payroll/benefit-obligations/` — DBO movements (3 benefit types: PostRetirementMedical/LongServiceAward/PensionTopUp), current/non-current allocation, long service awards (10/20/30yr milestones), actuarial assumptions
  - `hr-payroll/draft-budget/` — Consolidated payroll budget with councillor positions (5 types), ward committee budgets (30 wards), scenario comparison, mSCOA validation, submit/approve workflow
- **NT Requirements**: HRPB1-HRPB93 covered (Personnel Cost Budgeting, Salary Management, Statutory Deductions, Defined Benefit Obligations, Councillor Remuneration, Ward Committee Meetings, Scenario Modelling, mSCOA Integration, Approval Workflows)
- **mSCOA Mappings**: EmployeeCosts=3000, CouncillorRemuneration=3100; Fund=CF (Consolidated Fund)
- **Seed Data**: 21 post establishments (16 filled, 5 vacant across 5 departments), 50 salary structures (Grade 1-10, Notch 1-5), 3 temporary contracts, 5 councillor positions (Speaker/ExecMayor/Chairperson/MaycoMember/WardCouncillor), 30 ward committee budgets, 8 variable benefit records, 7 statutory deduction types, 3 DBO entries (R71.4M total), 3 long service award milestones, 3 performance bonus categories
- **Enums**: PostEmploymentType, PostStatus, PostPriorityStatus, CouncillorType, VariableBenefitType, TransportMode, TravelClassification, DeductionCalculationMethod, RemunerationType, DboBenefitType, PayrollCostCategory, HrBudgetStatus, ApprovalDecision (all stored as strings in PostgreSQL via HasConversion<string>())

## Key Concepts
- **mSCOA 7-Segment String**: Item/Fund/Function/Project/Region/Costing/MSC
- **Budget Version Types**: TABB (Tabled), ORGB (Original), ADJB (Adjustment)
- **Version Lifecycle**: Draft → Pending → Approved → Locked → ActiveForImplementation
- **Virement Approval Chain**: Draft → Submitted → DeptHeadApproved → BudgetOfficeApproved → CFOApproved → MMApproved → (CouncilApproved if threshold exceeded) → Posted
- **Virement Policy Rules**: 10 seeded rules (threshold %, same-fund, capital-operational restrictions, etc.) configurable per financial year
- **MTREF**: Medium Term Revenue & Expenditure Framework (3-year budgeting)

## Running
- **Single Port Architecture**: Everything runs on port 5000
- **API Server + SPA Host**: Port 5000 (`dotnet run` in PlatinumBudget.Api/) — serves both the API (`/api/*`) and the Angular SPA (static files from `platinum-budget-ui/dist/browser/`)
- **Angular Build Watch**: `ng build --watch` in platinum-budget-ui/ rebuilds on file changes
- **Swagger**: Available at `http://localhost:5000/swagger`
- **SPA Fallback**: All non-API routes fall back to `index.html` for Angular client-side routing

## Database
- Uses Replit's built-in PostgreSQL via `DATABASE_URL` environment variable
- Connection string is auto-converted from PostgreSQL URI to Npgsql format
- Schema created via `EnsureCreatedAsync` (not migrations) — seed only runs when FinancialYears table is empty
- `AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true)` set at startup
- Seed data includes: departments, financial years, mSCOA segments, sample budget version with 8 budget strings, 5 projects
- ProjectBudgetLines table stores multiple SCOA items per project with budget amounts and monthly cashflow (created via ALTER TABLE for existing DBs)
- Project model extended with: Description, IdpPriorityArea, IdpStrategicObjective, GpsCoordinates, ProjectManager, ContractorName, ContractNumber, FundingSource, StartDate, EndDate, TotalProjectCost

## EMS Budget Database Schema (from Budget_DB_Table_Scheme_1772736315958.sql)
The full EMS_GeorgeUAT SQL Server schema has been converted to PostgreSQL and integrated. This adds **144 tables** across two categories:

### EMS Const Tables (54 tables) — `Models/EmsConst.cs`
Reference/configuration lookup data for: Budget adjustment types, consumption processes, layouts, split options, transaction types, validation rules, departments, divisions, funder types, funding sources, grant types, KPI groups, SCOA structures (Costing/Function/Funds/Project/Regional/Structure), PMS fields, virement rules, national KPAs, etc.

### EMS Plan Tables (90 tables) — `Models/EmsPlan.cs`
Planning/budget transaction tables for: Activities, budget versions, budget register, adjustments, projects, funding, virements, MTREF, track changes, etc.

### EMS Controllers (7 controllers)
- `EmsConstController.cs` — `GET/POST/PUT/DELETE` for all 54 Const_* tables at `api/ems/const/{table-name}`
- `EmsPlanBudgetController.cs` — 25 Plan_Budget* tables at `api/ems/plan-budget/{table-name}`
- `EmsPlanAdjustmentController.cs` — 30 Plan_Adjustment*/Plan_Supplementary tables at `api/ems/plan-adjustment/{table-name}`
- `EmsPlanProjectController.cs` — 15 Plan_Project*/Plan_Activity* tables at `api/ems/plan-project/{table-name}`
- `EmsPlanFundingController.cs` — 6 Plan_Funding* tables at `api/ems/plan-funding/{table-name}`
- `EmsPlanVirementController.cs` — 7 Plan_Virement* tables at `api/ems/plan-virement/{table-name}`
- `EmsPlanMtrefController.cs` — 7 Plan_MTREF*/Plan_Track*/Plan_IDP* tables at `api/ems/plan-mtref/{table-name}`

All EMS models use `[Table("TableName")]` and `[Key]` attributes with exact SQL Server column names preserved. All controllers support pagination via `?page=1&pageSize=200`. EF Core `DbContext` has all 144 DbSets registered.

## Dependencies
### Backend (NuGet)
- Microsoft.EntityFrameworkCore (10.0.0)
- Npgsql.EntityFrameworkCore.PostgreSQL (10.0.0)
- Swashbuckle.AspNetCore (7.3.1)

### Frontend (npm)
- @angular/material (M3)
- @angular/animations
- chart.js (Chart.js auto for analytics charts)

## Important Notes
- Angular `allowedHosts` must be boolean `true` (not string `"all"`) in angular.json
- Angular budget sizes set to 2MB/5MB in angular.json to handle large bundles
- DashboardService uses `GroupBy().ToDictionary()` (not `ToDictionary()`) to handle duplicate keys safely
- VirementRequest model uses SCOA segment IDs (not navigation properties); Reports controller loads SCOA lookups separately
- Reports page uses `ChangeDetectionStrategy.OnPush` with explicit `markForCheck()` calls to avoid NG0100 errors
- Schedule A DTO includes full 3-year totals (Year1/Year2/Year3) for revenue, expenditure, and net surplus/deficit
- Budget vs Actual actuals are simulated (monthly split or 42% fallback) — no GL module yet
- VirementRequest table extended with BudgetType, CurrentApprovalLevel, RequiresCouncilApproval, From/To budget summary columns (added via ALTER TABLE for existing DBs)
- VirementPolicy table with 10 seeded rules per financial year; configurable via `/virement-policy` page
- ApprovalDto shared between BudgetVersion and Virement workflows (EntityType, LevelName, Decision fields)
