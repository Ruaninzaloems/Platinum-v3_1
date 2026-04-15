# Mnquma Local Municipality (EC122) — Asset Management System
## Standards, Tech Stack & Architecture Document

---

## 1. Project Overview

**Client:** Mnquma Local Municipality (EC122)
**System:** Asset Management System
**Compliance:** MFMA (Municipal Finance Management Act), GRAP (Generally Recognised Accounting Practice), mSCOA (Municipal Standard Chart of Accounts)
**Purpose:** Full lifecycle management of municipal assets — registration, depreciation, revaluation, impairment, disposal, verification, WIP and SCM integration.

---

## 2. Repository Structure

```
workspace/
├── ASSETS-UI/          # Angular 19 frontend (port 5000)
├── ASSETS-PSQL-API/    # .NET 10 PostgreSQL backend API (port 3000)
├── ASSETS-API/         # .NET 10 SQL Server bridge API (port 3001)
└── STANDARDS.md        # This document
```

---

## 3. Tech Stack

### 3.1 Frontend — ASSETS-UI

| Item | Value |
|---|---|
| Framework | Angular 19.2 |
| Language | TypeScript 5.7 |
| UI Library | Angular Material 19.2 |
| Charts | Chart.js 4.5 + ng2-charts 9.0 |
| Maps | Leaflet 1.9 |
| Excel Export | xlsx 0.18 |
| State | Angular Signals (`signal()`) |
| HTTP | Angular `HttpClient` with `rxjs 7.8` |
| Routing | Angular Router with lazy-loaded components |
| Port | 5000 |
| Proxy | `/api` → port 3000, `/ASSETS-API` → port 3001 |

### 3.2 Backend PostgreSQL API — ASSETS-PSQL-API

| Item | Value |
|---|---|
| Framework | ASP.NET Core (.NET 10) |
| Language | C# |
| ORM | Dapper 2.1 (raw SQL only — no Entity Framework) |
| DB Driver | Npgsql 9.0 |
| SQL Server Driver | Microsoft.Data.SqlClient 5.2 (dual-mode support) |
| Documentation | Swagger / OpenAPI (Swashbuckle 10.1) |
| Excel | ClosedXML 0.105 |
| Port | 3000 |
| Connection | `POSTGRES_URL` env var (Azure PostgreSQL) |

### 3.3 Bridge SQL Server API — ASSETS-API

| Item | Value |
|---|---|
| Framework | ASP.NET Core (.NET 10) |
| Language | C# |
| ORM | Dapper 2.1 (raw SQL only) |
| DB Driver | Microsoft.Data.SqlClient 5.2 |
| Documentation | Swagger / OpenAPI (Swashbuckle 10.1) |
| Excel | ClosedXML 0.105 |
| Port | 3001 |
| Route Prefix | `/mssql-api/` |
| Connection | `ConnectionStrings__SqlServer` env var / secret |

---

## 4. Databases

### 4.1 Primary — Azure PostgreSQL

| Item | Value |
|---|---|
| Server | `platinum-postgre-sql.postgres.database.azure.com` |
| Port | 5432 |
| Database | `Assets` |
| Username | `Admin_Dev` |
| SSL | Required (`SslMode=Require`) |
| Tables | 134 |
| Sequences | 124 |
| Connection Env Var | `POSTGRES_URL` |

**Also available on the same server:**

| Database | Purpose |
|---|---|
| `assets` | Lowercase copy (migration artefact) |
| `CitizenPortal` | Separate citizen portal system |
| `CitizenPortalDev` | Citizen portal dev environment |
| `postgres` | Azure system default |

### 4.2 Secondary — SQL Server (External)

| Item | Value |
|---|---|
| Connection | `ConnectionStrings__SqlServer` secret |
| Used By | ASSETS-API (port 3001) bridge only |
| Note | Legacy system integration |

### 4.3 Local (Replit Development Only)

| Item | Value |
|---|---|
| Host | `helium` (internal Replit host) |
| Database | `heliumdb` |
| Env Var | `DATABASE_URL` (runtime-managed by Replit) |
| Status | Bypassed — `POSTGRES_URL` takes priority |

---

## 5. Environment Variables

| Variable | Environment | Purpose |
|---|---|---|
| `POSTGRES_URL` | shared | Azure PostgreSQL connection string (takes priority over `DATABASE_URL`) |
| `SKIP_DB_INIT` | shared | Set to `"true"` — skips seed/schema init on startup (Azure DB is pre-seeded) |
| `DATABASE_URL` | runtime-managed | Replit local PostgreSQL fallback (do not modify) |
| `ConnectionStrings__SqlServer` | secret | SQL Server connection string for ASSETS-API |

**Connection priority in ASSETS-PSQL-API:**
1. `SqlServer` connection string → SQL Server mode
2. `POSTGRES_URL` → Azure PostgreSQL (active)
3. `DATABASE_URL` → Replit local PostgreSQL (fallback only)

---

## 6. Workflows (Running Processes)

| Workflow Name | Command | Port | Output |
|---|---|---|---|
| `Start application` | `cd ASSETS-UI && npx ng serve --host 0.0.0.0 --port 5000 --proxy-config proxy.conf.json` | 5000 | webview |
| `Backend API` | `cd ASSETS-PSQL-API && dotnet run` | 3000 | console |
| `ASSETS-API` | `cd ASSETS-API && dotnet run` | 3001 | console |

---

## 7. Database Schema — Table Groups

All tables use double-quoted Pascal/mixed-case names in PostgreSQL (e.g., `"Asset_Register_Items"`).

### Asset Register (Core)
| Table | Purpose |
|---|---|
| `Asset_Register_Items` | Master asset register — one row per asset |
| `Asset_Register_Transactions` | All financial transactions against assets |
| `Asset_Transaction_Summary` | Pre-computed summary per asset/year/period |
| `Asset_Register_Items_Upload` | Staging table for bulk uploads |

### Financial Transactions
| Table | Purpose |
|---|---|
| `Asset_Depreciation` | Depreciation records |
| `Asset_DepreciationSchedule` | Depreciation run schedule |
| `Asset_DepreciationSchedule_Item` | Line items per schedule |
| `Asset_DepreciationApproval` | Depreciation approval workflow |
| `Asset_Revaluations` | Revaluation records |
| `Asset_Impairment` | Impairment records |
| `Asset_ImpairmentPostings` | Impairment posting lines |
| `Asset_FairValue` | Fair value assessments |
| `Asset_FairValueApproval` | Fair value approval workflow |
| `Asset_Disposal` | Disposal records |
| `Asset_Disposal_Approval` | Disposal approval |
| `Asset_PriorPeriodAdjustment` | Prior period adjustment records |
| `Asset_PriorYearAdjustment` | Prior year adjustment records |
| `Asset_PriorYearAdjustment_Documents` | Supporting documents |
| `Asset_FundingSource` | Asset funding sources |
| `Asset_Insurance` | Insurance records |
| `Asset_MonthlyApproval` | Monthly approval status |

### WIP (Work In Progress)
| Table | Purpose |
|---|---|
| `Asset_WIP_Register` | WIP project register |
| `Asset_WIP_Register_Details` | WIP BOQ line items |
| `Asset_WIP_Register_Items` | WIP linked asset items |
| `Asset_WIP_Register_Funding` | WIP funding sources |
| `Asset_WIP_Documents` | WIP uploaded documents |
| `Asset_WIPApprovalItems` | WIP approval items |

### Bulk Operations
| Table | Purpose |
|---|---|
| `Asset_BulkUploadJobs` | Bulk upload job tracking |
| `Asset_BulkValidation` | Validation results per upload |
| `Asset_BulkTransactionJobs` | Bulk transaction run jobs |
| `Asset_BulkTransactionItems` | Bulk transaction line items |
| `Asset_BulkRefurbJobs` | Bulk refurbishment jobs |
| `Asset_BulkRefurbItems` | Bulk refurbishment line items |

### Verification
| Table | Purpose |
|---|---|
| `Asset_VerificationPlan` | Verification plan header |
| `Asset_VerificationPlanApproval` | Plan approval records |
| `Asset_VerificationPlanTeamMember` | Team members assigned |
| `Asset_VerificationPlanAuditTrail` | Plan audit trail |
| `Asset_VerificationRegister` | Verification register header |
| `Asset_VerificationRegisterItem` | Individual asset verification items |
| `Asset_VerificationRegisterTeamMember` | Team members per register |
| `Asset_VerificationAuditTrail` | Verification audit trail |

### Maintenance
| Table | Purpose |
|---|---|
| `Asset_MaintenanceRequest` | Maintenance requests |
| `Asset_MaintenanceWorkOrder` | Work orders |
| `Asset_MaintenanceWorkOrderDetails` | Work order line items |
| `Asset_Refurb` | Refurbishment records |

### SCM (Supply Chain Management)
| Table | Purpose |
|---|---|
| `SCM_ContractDetails` | Contract headers |
| `SCM_ContractDetailItems` | Contract line items |
| `SCM_Invoice` | Invoices |
| `SCM_InvoiceDetail` | Invoice line items |
| `SCM_AssetUnbundling_Header` | Asset unbundling header |
| `SCM_AssetUnbundling_Detail` | Unbundling detail lines |
| `SCM_RequisitionBillOfQuantity` | Bill of Quantities per requisition/tender |
| `Cons_Vendor` | Vendor register |

### Fleet
| Table | Purpose |
|---|---|
| `fleet_booking_schedule` | Fleet booking calendar |
| `fleet_inspections` | Vehicle inspections |
| `trip_requests` | Trip request records |
| `tracking_alerts` | GPS tracking alerts |
| `tracking_zones` | Defined tracking zones |

### Ledger / Finance
| Table | Purpose |
|---|---|
| `Led_GeneralLedger` | General ledger journal lines |
| `Led_Journal_Asset` | Asset-specific journal entries |
| `Led_Vote` | mSCOA vote codes |
| `Plan_Project` | Capital plan projects |
| `Plan_ProjectItem` | Project line items |

### Lookup / Reference (Const_ prefix)
| Table | Purpose |
|---|---|
| `Const_AssetType_Sys` | Asset types (Biological, Heritage, etc.) |
| `Const_AssetClass_sys` | Asset classification |
| `Const_AssetCategory_sys` | Asset categories |
| `Const_Asset_SubCategory` | Sub-categories |
| `Const_AssetStatus_Sys` | Asset statuses |
| `Const_AssetConditionRating_Sys` | Condition ratings |
| `Const_AssetDepreciationMethod_Sys` | Depreciation methods (SL, DB, Units) |
| `Const_AssetDisposalMethod` | Disposal methods |
| `Const_AssetOwnership` | Ownership types |
| `Const_Asset_CIDMS_Component_Type` | CIDMS component types |
| `Const_Asset_CIDMS_Accounting_Group` | CIDMS accounting groups |
| `Const_Asset_CIDMS_Accounting_Sub_Group` | CIDMS accounting sub-groups |
| `Const_Asset_CIDMS_Class` | CIDMS classes |
| `Const_Asset_CIDMS_Group_Type` | CIDMS group types |
| `Const_Asset_CIDMS_Asset_Type` | CIDMS asset types |
| `Const_Asset_CIDMS_Municipal_Services` | CIDMS municipal services |
| `Const_Asset_CIDMS_SubComponent_Type` | CIDMS sub-component types |
| `Const_Asset_Criticality_Grade` | Criticality grades (1–5) |
| `Const_Asset_Performance_Grade` | Performance grades |
| `Const_Asset_Health_Grade` | Infrastructure health grades |
| `Const_Asset_Utilisation_Grade` | Utilisation grades |
| `Const_Asset_Condition` | Condition states |
| `Const_Asset_ComponentType` | Component types |
| `Const_Asset_Calculation_Type` | Calculation types |
| `Const_Asset_ServiceGroup` | Service groups |
| `Const_Asset_RunStatus` | Run statuses |
| `Const_Asset_Run_Type` | Run types |
| `Const_Asset_WIPFundingSource` | WIP funding sources |
| `Const_Asset_WIPFundingType` | WIP funding types |
| `Const_Asset_WIPProjectStatus` | WIP project statuses |
| `Const_Asset_DepreciationStatus` | Depreciation statuses |
| `Const_Asset_Depreciation_Approval_Type` | Depreciation approval types |
| `Const_AssetProjectStatus` | Project statuses |
| `Const_AssetJournalTransactionType_Sys` | Journal transaction types |
| `Const_AssetInspectionConditions` | Inspection conditions |
| `Const_FundingSource` | Funding sources |
| `Const_UnitOfIssue` | Units of issue (UoM) |
| `Const_Department` | Departments (returns `id`, `description`) |
| `Const_Division` | Divisions (returns `id`, `description`, `departmentId`) |
| `Const_DocumentType` | Document types |
| `Const_PropertyTypeOfUse` | Property use types |
| `Const_MaintenanceLeadTime` | Maintenance lead times |
| `Const_RequestType_sys` | Request types |
| `Const_ReferenceType_sys` | Reference types |
| `Const_ReferenceData_sys` | Reference data |
| `Const_SCOA_Structure` | SCOA structure codes |

### Location Hierarchy
| Table | Purpose |
|---|---|
| `Const_Town` | Towns |
| `Const_Suburb` | Suburbs (FK → Town via `Town_ID`) |
| `Const_Ward` | Wards (standalone, not in location chain) |
| `Const_Street` | Streets (FK → Suburb via `SuburbID`) |
| `Const_Building` | Buildings (FK → Street via `Street_ID`) |
| `Const_Floor` | Floors (FK → Building via `Building_ID`) |
| `Const_Room` | Rooms (FK → Floor via `FloorID`) |

**Location cascade:** Town → Suburb → Street → Building → Floor → Room. Ward is standalone.

### Config / Settings
| Table | Purpose |
|---|---|
| `AssetConfig_TransactionType` | Transaction type configuration |
| `AssetConfig_FinancialStatus` | Financial status codes |
| `AssetConfig_MeasurementType` | Measurement model types |
| `AssetConfig_mSCOA` | mSCOA vote/project configuration |
| `AssetConfig_mSCOA_TransactionType` | mSCOA transaction type mapping |
| `organisation_settings` | Global settings (financial year, periods, municipality name) |
| `Const_FinYearWithIndex_sys` | Financial year index table |
| `Const_Month_sys` | Month lookup |

### Users / Workflow
| Table | Purpose |
|---|---|
| `Payroll_Employee` | Employee master (`employeeId`, `firstName`, `surname`, `empCode`, `idNo`) |
| `User_UserProcessingMonth` | Per-user current processing period |
| `workflow_definitions` | Workflow template definitions |
| `workflow_instances` | Active workflow instances |
| `workflow_approvals` | Approval records |
| `audit_trail` | System-wide audit trail |
| `documents` | Uploaded documents |
| `import_batches` | Import batch tracking |
| `ai_insights` | AI-generated insights |

---

## 8. API Reference

### 8.1 ASSETS-PSQL-API (port 3000) — Endpoint Groups

All routes prefixed with `/api/`.

| Group | Key Endpoints |
|---|---|
| Asset Register | `/asset-register-items` (CRUD), `/asset-register-items/:id` |
| Transactions | `/asset-register-transactions`, `/asset-transaction-summary` |
| Depreciation | `/depreciation`, `/depreciation-schedules`, `/depreciation-approval` |
| Revaluation | `/revaluations` |
| Impairment | `/asset-impairment`, `/asset-impairment-postings` |
| Fair Value | `/asset-fair-value`, `/asset-fair-value-approval` |
| Disposal | `/asset-disposal`, `/asset-disposal-approval` |
| Prior Adjustments | `/prior-period-adjustments`, `/prior-year-adjustments` |
| WIP | `/wip-register`, `/wip-register-details`, `/wip-register-funding`, `/wip-documents`, `/wip-transfers` |
| Verification | `/verification-plans`, `/verification-registers` |
| Maintenance | `/maintenance-requests`, `/maintenance-work-orders` |
| Refurbishment | `/refurbishments` |
| Bulk Upload | `/bulk-upload` |
| Bulk Transactions | `/bulk-transactions` |
| SCM | `/scm-contracts`, `/scm-invoices`, `/asset-unbundling` |
| Fleet | `/fleet`, `/tracking` |
| Lookups | `/asset-types`, `/asset-categories`, `/asset-sub-categories`, `/asset-statuses`, `/asset-depreciation-methods`, `/cidms-component-types`, `/cidms-sub-component-types`, `/departments`, `/divisions`, `/verification-registers/employees` |
| Location | `/locations`, `/verification-registers/lookups/towns`, `/suburbs`, `/streets`, `/buildings`, `/floors`, `/rooms`, `/wards` |
| CIDMS Chain | `/cidms-accounting-groups`, `/cidms-accounting-sub-groups`, `/cidms-classes`, `/cidms-group-types`, `/cidms-asset-types` |
| Grades | `/criticality-grades`, `/performance-grades`, `/health-grades`, `/utilisation-grades` |
| Config | `/settings`, `/asset-config-mscoa`, `/asset-config-transaction-types` |
| Admin | `/admin/populate-transaction-summary` |
| Reports | `/reports`, `/reconciliation`, `/analytics/dashboard`, `/analytics/insights` |
| Ledger | `/general-ledger`, `/votes`, `/plan-projects` |
| Month End | `/month-end`, `/monthly-approval` |
| Workflows | `/workflows`, `/workflow-inbox` |

### 8.2 ASSETS-API (port 3001) — Endpoint Groups

All routes prefixed with `/mssql-api/`. Reads/writes SQL Server.

| Group | Key Endpoints |
|---|---|
| Asset Register | `/mssql-api/asset-register-items` |
| Lookups | `/mssql-api/asset-types`, `/mssql-api/asset-categories`, `/mssql-api/asset-statuses` |
| CIDMS | `/mssql-api/cidms-component-types`, `/mssql-api/cidms-accounting-groups` etc. |
| Grades | `/mssql-api/criticality-grades`, `/mssql-api/performance-grades` etc. |
| Depreciation | `/mssql-api/depreciation` |
| Disposal | `/mssql-api/disposal` |
| WIP | `/mssql-api/wip-register` |
| SCM | `/mssql-api/scm-contract-details`, `/mssql-api/scm-invoice` |
| Employees | `/mssql-api/employees` |
| Departments | `/mssql-api/departments`, `/mssql-api/divisions` |

---

## 9. Frontend Structure — ASSETS-UI

```
src/app/
├── app.routes.ts          # Lazy-loaded route definitions
├── app.config.ts          # App-level providers
├── core/
│   ├── api.service.ts     # All HTTP calls — single service for entire app
│   └── unsaved-changes.guard.ts
├── layout/
│   └── shell.component    # Main shell with navigation sidebar
└── features/
    ├── dashboard/         # KPI dashboard
    ├── assets/            # Asset list + create/edit forms
    ├── transactions/      # Transaction FAR view
    ├── wip/               # WIP register management
    ├── verification/      # Asset verification plans & registers
    ├── maintenance/       # Maintenance requests & work orders
    ├── bulk-upload/       # CSV bulk upload
    ├── reconciliation/    # mSCOA reconciliation
    ├── reports/           # FAR and other reports
    ├── workflows/         # Workflow inbox & approval
    ├── prior-period-adjustments/
    ├── prior-year-adjustments/
    ├── assetsfleet/       # Fleet management
    ├── config-landing/    # System configuration
    ├── admindashboard/    # Admin panel
    └── map/               # Asset map view
```

---

## 10. Coding Standards

### 10.1 Angular / TypeScript

- **Angular version:** 19 — use `@if` / `@for` control flow blocks (NOT `*ngIf` / `*ngFor`)
- **State:** Use `signal()` for reactive state — do NOT use `BehaviorSubject` for local component state
- **No arrow functions in templates** — use regular methods or bound functions
- **No `$any()` casts** in templates
- **Callbacks:** Use `var self = this` pattern and `function` (not arrow) inside callbacks that need component context
- **Loops:** Use standard `for` loops — NOT `forEach` in component logic
- **HTTP:** All HTTP calls go through `core/api.service.ts` — no direct `HttpClient` injection in components
- **Lazy loading:** All feature routes are lazy-loaded via `loadComponent()`
- **No authentication:** All endpoints open; `userId` / `CapturerID` hardcoded to `1`

### 10.2 .NET / C# (ASSETS-PSQL-API)

- **Dapper only** — never use Entity Framework or any other ORM
- **Always call `await conn.OpenAsync()`** before any Dapper query
- **PostgreSQL SQL:** Use `NOW()` not `GETDATE()` (a compatibility shim exists but avoid relying on it)
- **Double-quote all column/table names** in SQL: `"Asset_Register_Items"`, `"AssetRegisterItem_ID"`
- **Integer columns:** CIDMS IDs, grade columns (`CriticalityGrade`, `PerformanceGrade`, `UtilisationGrade`, `InfrastructureHealthGrade`), `Risk`, `BasicMunicipalityService`, `UoM` — always send/store as integers, never strings
- **JSON deserialization:** Use `UnwrapJsonElement()` helper to convert `JsonElement` to C# primitives before passing to Dapper
- **Date parsing:** Use `ConvertString()` helper to auto-parse ISO date strings to `DateTime` for timestamp columns
- **No authentication middleware** — all controllers are open

### 10.3 SQL / PostgreSQL

- **PostgreSQL dialect** — primary database is PostgreSQL (Azure)
- **Double-quote identifiers** — all table and column names are case-sensitive and must be double-quoted
- **`NOW()`** for timestamps — `GETDATE()` exists as a compatibility shim only
- **Serial columns** — do NOT change primary key ID column types (serial ↔ varchar) — this breaks existing data
- **Schema init:** Controlled by `SKIP_DB_INIT` env var — set to `"true"` for production/pre-seeded databases

---

## 11. Known Preserved Typos

The following column names contain intentional spelling errors that were inherited from the original system schema. They **must not be corrected** — changing them would break all existing queries and data:

| Column | Location | Correct Spelling |
|---|---|---|
| `UsefullLife` | `Asset_Register_Items`, `Asset_Depreciation` | `UsefulLife` |
| `RemaingUsefulLife` | `Asset_Register_Items`, `Asset_Register_Transactions` | `RemainingUsefulLife` |
| `CommisioningDate` | `Asset_Register_Items` | `CommissioningDate` |
| `RevalautionAmt` | `Asset_Revaluations` | `RevaluationAmt` |
| `CapturerId` | Various audit columns | `CaptureId` |
| `SGNumberChange_ID` | `Asset_Register_Items` | Used for SG Key — varchar, not a true FK |

---

## 12. Key Business Rules

### Financial Year
- Format: `"2025/2026"` — always a string
- Source: `organisation_settings.financial_year`
- Financial period 1 = July (month 7), period 12 = June (month 6)
- Current settings: Financial year `2025/2026`, current period `9` (March)

### Asset Registration
- After creating a new asset, `Asset_Transaction_Summary` must be rebuilt by calling:
  `POST /api/admin/populate-transaction-summary` with `{ AssetIds: [id], FinYear: "2025/2026", FinPeriod: 1 }`
- This is triggered automatically by the frontend after successful asset creation

### CIDMS Chain (Classification)
- Hierarchy: Component Type → Accounting Group → Accounting Sub-Group → Class → Group Type → Asset Type
- All CIDMS IDs stored and transmitted as **integers**
- Sub-Component Types API returns: `{ assetCIDMSSubComponentTypeID, assetCIDMSSubComponentTypeDesc }`

### Location Cascade
- Town → Suburb (`townId`) → Street (`suburbId`) → Building (`streetId`) → Floor (`buildingId`) → Room (`floorId`)
- Ward is **standalone** — not part of the cascade chain
- DB columns: `Town_ID`, `SuburbID`, `Ward_ID`, `Street_ID`, `Building_ID`, `FloorID`, `Room_ID`

### Division Filtering
- Divisions are filtered client-side by `departmentId` — not a separate API call
- Division dropdown is disabled until a Department is selected
- Division dropdown resets when Department changes

### Custodian / Employee
- Employee API: `GET /api/verification-registers/employees`
- Returns: `{ employeeId, firstName, surname, empCode, idNo }`
- Display format: `FirstName Surname` (no empCode shown)
- ID masking: first 6 digits of `idNo` + `xxxxxxx` padding — field is readonly

### Depreciation
- Supported methods: Straight Line (SL), Diminishing Balance (DB), Units of Production
- Depreciation runs follow a schedule-based approval workflow
- `Asset_Transaction_Summary` is rebuilt after each approved depreciation run

---

## 13. Swagger / API Documentation

Both APIs expose Swagger UI at their respective `/swagger` paths:

| API | Swagger URL |
|---|---|
| ASSETS-PSQL-API | `http://localhost:3000/swagger` |
| ASSETS-API | `http://localhost:3001/swagger` |

---

## 14. Compliance References

| Standard | Relevance |
|---|---|
| **MFMA** | Municipal Finance Management Act — governs asset accounting |
| **GRAP 17** | Standard of GRAP for Property, Plant & Equipment |
| **GRAP 16** | Standard of GRAP for Investment Property |
| **GRAP 102** | Standard of GRAP for Intangible Assets |
| **mSCOA** | Municipal Standard Chart of Accounts — all transactions mapped to mSCOA votes/projects |
| **CIDMS** | Construction Industry Development Matrix System — asset classification hierarchy |
