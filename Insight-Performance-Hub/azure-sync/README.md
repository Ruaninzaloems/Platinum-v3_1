# Azure sync — Revised SDBIP schema + data

`perf-app-full-sync.sql` brings the Azure database (`Performance` on
`platinum-postgre-sql.postgres.database.azure.com`) fully up to date with the
app's current schema and data, including the `parent_scorecard_id` column and
the KPI-number unique index needed by "Reopen for Revision".

**WARNING: this REPLACES all existing data in the Azure `Performance` database**
with the app's current data (per the decision that the app's data is the real
data).

## How to run (Azure Cloud Shell, or any machine that can reach the server)

```bash
psql "host=platinum-postgre-sql.postgres.database.azure.com dbname=Performance user=<admin-user> sslmode=require" \
  -f perf-app-full-sync.sql
```

## Before running

Regenerate the file first if any time has passed, so no recently entered data
is lost:

```bash
pg_dump "$DATABASE_URL" --clean --if-exists --no-owner --no-privileges \
  -f azure-sync/perf-app-full-sync.sql
```

## After running

1. Flip `USE_REPLIT_BUILTIN_DB` to `false` in `lib/db/src/index.ts`.
2. Restart the API Server workflow.
3. Verify: reopen an approved SDBIP for revision in the app (POST
   `/api/scorecards/:id/revise` should return the new revision, not a 500).
