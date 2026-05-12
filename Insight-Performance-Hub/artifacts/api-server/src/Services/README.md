# Services

Business logic layer. Services orchestrate repository calls and enforce
domain rules. Controllers (in `../Controllers/`) should call services
rather than accessing the database directly.

**Current contents**
- `seed.ts` / `seed-data.ts` — Database seeding service.

**Planned (refactor in progress)**
- One service per domain (e.g. `ScorecardService.ts`, `ActualsService.ts`,
  `ReportService.ts`).
