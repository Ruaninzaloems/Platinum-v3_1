# Repositories

Data access layer. Repositories wrap Drizzle queries so the rest of the
codebase depends on a stable interface rather than ORM specifics.

**Planned (refactor in progress)**
- One repository per domain (e.g. `ScorecardRepository.ts`,
  `KpiRepository.ts`, `ReportRepository.ts`) with corresponding
  `Interfaces/` entries.
