import express from 'express';
import cors from 'cors';
import { pool, query, pingDb } from './db';
import {
  demoFinancialYears,
  demoDashboard,
  demoCompilations,
  demoFindingsDashboard,
  demoRfiDashboard,
  demoMfmaCommentary,
  demoExceptionRegister,
  demoEvidenceHeatmap,
  demoMappingAudit,
  demoAdjustmentsRegister,
  demoIntegrityChecks,
  demoMfmaSubmissions,
  demoMfmaReport,
} from './demo';

function isDbUnavailable(err: any): boolean {
  const msg = String(err?.message || err || '').toLowerCase();
  return (
    msg.includes('connection terminated') ||
    msg.includes('connection timeout') ||
    msg.includes('econnrefused') ||
    msg.includes('etimedout') ||
    msg.includes('enotfound') ||
    msg.includes('does not exist') ||
    msg.includes('relation') ||
    msg.includes('password authentication') ||
    msg.includes('no pg_hba')
  );
}

let dbKnownDown = false;
let dbLastChecked = 0;
const DB_RECHECK_MS = 60_000;

async function isDbDown(): Promise<boolean> {
  const now = Date.now();
  if (dbKnownDown && now - dbLastChecked < DB_RECHECK_MS) return true;
  if (!dbKnownDown && now - dbLastChecked < DB_RECHECK_MS) return false;
  dbLastChecked = now;
  try {
    await Promise.race([
      query('SELECT 1'),
      new Promise((_r, rej) => setTimeout(() => rej(new Error('timeout')), 2000)),
    ]);
    dbKnownDown = false;
    return false;
  } catch {
    dbKnownDown = true;
    return true;
  }
}

const app = express();
const corsOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
// Fail-safe: when no allowlist is configured we still permit credentialed
// requests in development (NODE_ENV !== 'production'); in production an
// empty allowlist disables cross-origin access entirely.
const isProd = process.env.NODE_ENV === 'production';
app.use(cors({
  origin: corsOrigins.length > 0 ? corsOrigins : (isProd ? false : true),
  credentials: true,
}));
app.use(express.json());
app.use((req, _res, next) => {
  console.log(`[afs-api] ${req.method} ${req.url}`);
  next();
});

// ────────────────────────────────────────────────────────────
// Health
// ────────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  res.json({ status: 'ok', service: 'platinum-afs-api', db: { ok: !(await isDbDown()) } });
});

// ────────────────────────────────────────────────────────────
// Auth (stub — shell auth is the source of truth in this monorepo)
// ────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if ((email === 'admin@platinum.gov.za' || email === 'admin') && password === 'admin123') {
    res.json({
      accessToken: 'afs-local-token-' + Date.now(),
      user: {
        id: 1,
        email: 'admin@platinum.gov.za',
        firstName: 'Admin',
        lastName: 'User',
        roles: ['Administrator'],
        permissions: ['*'],
        designation: 'System Administrator',
        tenantName: 'Mnquma Local Municipality',
        mustResetPassword: false,
      },
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
});

app.post('/api/auth/change-password', (_req, res) => {
  res.json({ message: 'Password changed successfully' });
});

app.get('/api/notifications/unread-count', (_req, res) => {
  res.json({ count: 0 });
});

// ────────────────────────────────────────────────────────────
// Financial Years — real data
// ────────────────────────────────────────────────────────────
app.get('/api/admin/financial-years', async (_req, res, next) => {
  if (await isDbDown()) return res.json(demoFinancialYears);
  try {
    const rows = await query<any>(
      `SELECT id, label, status, "isCurrent", "startDate", "endDate", "isLocked"
         FROM public.financial_years
        ORDER BY "startDate" DESC NULLS LAST`
    );
    res.json(
      rows.map((r) => ({
        id: r.id,
        label: r.label,
        status: r.status,
        isCurrent: r.isCurrent,
        startDate: r.startDate,
        endDate: r.endDate,
        isLocked: r.isLocked,
      }))
    );
  } catch (e) {
    if (isDbUnavailable(e)) {
      console.warn('[afs-api] DB unavailable, returning demo financial years');
      return res.json(demoFinancialYears);
    }
    next(e);
  }
});

// ────────────────────────────────────────────────────────────
// Period filter helper — translates UI period token to a date range
// inside a financial year.
// ────────────────────────────────────────────────────────────
function periodToMonths(period?: string): number | null {
  switch (period) {
    case 'q1': return 3;
    case 'h1': return 6;
    case 'q3': return 9;
    case 'full_year':
    default: return null; // null = full year
  }
}

// ────────────────────────────────────────────────────────────
// Dashboard aggregation
// ────────────────────────────────────────────────────────────
app.get('/api/reports/dashboard', async (req, res, next) => {
  if (await isDbDown()) return res.json(demoDashboard);
  try {
    const period = String(req.query.period || 'full_year');
    void periodToMonths(period); // reserved for GL period filtering

    // Resolve the financial year — explicit ?fyId= overrides
    const fyParam = req.query.fyId ? String(req.query.fyId) : null;
    let fy: any = null;
    if (fyParam) {
      const r = await query<any>(
        `SELECT id, label, status FROM public.financial_years WHERE id::text = $1 LIMIT 1`,
        [fyParam]
      );
      fy = r[0] || null;
    }
    if (!fy) {
      const r = await query<any>(
        `SELECT id, label, status FROM public.financial_years
          WHERE "isCurrent" = TRUE
          ORDER BY "startDate" DESC NULLS LAST LIMIT 1`
      );
      fy = r[0] || null;
    }
    if (!fy) {
      const r = await query<any>(
        `SELECT id, label, status FROM public.financial_years
          ORDER BY "startDate" DESC NULLS LAST LIMIT 1`
      );
      fy = r[0] || null;
    }

    const fyId = fy?.id ?? null;

    const fyIdText = fyId ? String(fyId) : null;

    // Run all independent aggregations in parallel for speed
    const [
      compRows,
      verRows,
      rfiRows,
      findRows,
      adjRows,
      evRows,
      wpRows,
      tbRows,
      tbSumRows,
      tbCatRows,
      topItemRows,
      bvaRows,
      glRowsRes,
      actRows,
    ] = await Promise.all([
      query<{ status: string; n: number; avgc: number | null }>(
      `SELECT COALESCE(LOWER(status), 'unknown') AS status,
              COUNT(*)::int AS n,
              AVG(COALESCE("completenessPercentage", 0))::numeric AS avgc
         FROM public.compilations
        WHERE $1::uuid IS NULL OR "financialYearId" = $1::uuid
        GROUP BY COALESCE(LOWER(status), 'unknown')`,
      [fyId]
      ),
      query<{ n: number }>(
        `SELECT COUNT(*)::int AS n
           FROM public.afs_versions
          WHERE LOWER(status) IN ('published','locked','approved')
            AND ($1::uuid IS NULL OR "financialYearId" = $1::uuid)`,
        [fyId]
      ),
      query<{ n: number; overdue: number }>(
        `SELECT
            COUNT(*) FILTER (WHERE LOWER(COALESCE(status,'open')) IN ('open','in_progress','responded'))::int AS n,
            COUNT(*) FILTER (
              WHERE LOWER(COALESCE(status,'open')) IN ('open','in_progress')
                AND "dueDate" IS NOT NULL AND "dueDate" < NOW()
            )::int AS overdue
           FROM public.rfi_requests`
      ),
      query<{ severity: string; n: number; resolved: number }>(
        `SELECT COALESCE(LOWER(severity),'unknown') AS severity,
                COUNT(*)::int AS n,
                COUNT(*) FILTER (WHERE LOWER(COALESCE(status,'')) IN ('resolved','closed'))::int AS resolved
           FROM public.audit_findings
          GROUP BY COALESCE(LOWER(severity),'unknown')`
      ),
      query<{ total: number; posted: number; sum: number | null }>(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE LOWER(COALESCE(status,'')) IN ('posted','approved'))::int AS posted,
                0::numeric AS sum
           FROM public.adjustments`
      ),
      query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM public.evidence_documents`),
      query<{ total: number; complete: number }>(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE LOWER(COALESCE(status,'')) IN ('signed_off','complete','reviewed'))::int AS complete
           FROM public.working_papers`
      ).catch(() => [{ total: 0, complete: 0 }]),
      query<{ n: number }>(
        `SELECT COUNT(*)::int AS n FROM public.trial_balance_entries
          WHERE $1::text IS NULL OR "financialYearId" = $1::text`,
        [fyIdText]
      ),
      query<{ debit: string; credit: string }>(
        `SELECT COALESCE(SUM(COALESCE(debit,0)), 0)::text AS debit,
                COALESCE(SUM(COALESCE(credit,0)), 0)::text AS credit
           FROM public.trial_balance_entries
          WHERE $1::text IS NULL OR "financialYearId" = $1::text`,
        [fyIdText]
      ),
      query<any>(
        `SELECT COALESCE("scoaItemShortDesc", 'Unclassified') AS category,
                COALESCE(SUM(COALESCE("debitCloseBalance",0) - COALESCE("creditCloseBalance",0)), 0)::text AS amount,
                COUNT(*)::int AS items
           FROM public.trial_balance_entries
          WHERE $1::text IS NULL OR "financialYearId" = $1::text
          GROUP BY COALESCE("scoaItemShortDesc", 'Unclassified')
          ORDER BY ABS(SUM(COALESCE("debitCloseBalance",0) - COALESCE("creditCloseBalance",0))) DESC
          LIMIT 10`,
        [fyIdText]
      ),
      query<any>(
        `SELECT "scoaItemCode" AS code,
                COALESCE("scoaItemShortDesc",'(no description)') AS description,
                (COALESCE("creditCloseBalance",0) - COALESCE("debitCloseBalance",0))::text AS net
           FROM public.trial_balance_entries
          WHERE ($1::text IS NULL OR "financialYearId" = $1::text)
            AND "scoaItemCode" IS NOT NULL`,
        [fyIdText]
      ),
      query<any>(
        `SELECT
            COALESCE(tb."scoaItemShortDesc", 'Unclassified') AS category,
            COALESCE(SUM(tb."budgetOriginal"), 0)::text   AS budget,
            COALESCE(SUM(tb."debitCloseBalance" - tb."creditCloseBalance"), 0)::text AS actual
          FROM public.trial_balance_entries tb
         WHERE $1::text IS NULL OR tb."financialYearId" = $1::text
         GROUP BY COALESCE(tb."scoaItemShortDesc", 'Unclassified')
         ORDER BY ABS(SUM(tb."budgetOriginal")) DESC
         LIMIT 6`,
        [fyIdText]
      ),
      query<any>(
        `SELECT COUNT(*)::int AS n,
                COALESCE(SUM(COALESCE(debit,0)), 0)::text AS debit,
                COALESCE(SUM(COALESCE(credit,0)), 0)::text AS credit
           FROM public.general_ledger_entries
          WHERE $1::text IS NULL OR "financialYearId" = $1::text`,
        [fyIdText]
      ).catch(() => null),
      query<any>(
        `SELECT 'compilation' AS type, 'updated' AS action, COALESCE("updatedAt","createdAt") AS date FROM public.compilations
         UNION ALL
         SELECT 'afs_version', 'updated', COALESCE("updatedAt","createdAt") FROM public.afs_versions
         UNION ALL
         SELECT 'rfi', 'updated', COALESCE("updatedAt","createdAt") FROM public.rfi_requests
         UNION ALL
         SELECT 'finding', 'updated', COALESCE("updatedAt","createdAt") FROM public.audit_findings
         ORDER BY date DESC NULLS LAST
         LIMIT 10`
      ).catch(() => []),
    ]);

    const compilationsByStatus: Record<string, number> = {};
    let totalCompilations = 0;
    let avgCompletenessSum = 0;
    let avgCompletenessCount = 0;
    for (const r of compRows) {
      compilationsByStatus[r.status] = r.n;
      totalCompilations += r.n;
      if (r.avgc != null) {
        avgCompletenessSum += Number(r.avgc) * r.n;
        avgCompletenessCount += r.n;
      }
    }
    const inProgress =
      (compilationsByStatus['draft'] || 0) +
      (compilationsByStatus['in_progress'] || 0) +
      (compilationsByStatus['review'] || 0) +
      (compilationsByStatus['in_review'] || 0);
    const approved = compilationsByStatus['approved'] || 0;

    // ── Post-process parallel results into the response shape ─────────
    const published = verRows[0]?.n || 0;

    const openRfis = rfiRows[0]?.n || 0;
    const overdueRfis = rfiRows[0]?.overdue || 0;

    const findingsBySeverity: Record<string, number> = {};
    let totalFindings = 0;
    let resolvedFindings = 0;
    for (const r of findRows) {
      findingsBySeverity[r.severity] = r.n;
      totalFindings += r.n;
      resolvedFindings += r.resolved;
    }
    const unresolvedFindings = totalFindings - resolvedFindings;

    const adjTotal = adjRows[0]?.total || 0;
    const adjPosted = adjRows[0]?.posted || 0;
    const adjSum = Number(adjRows[0]?.sum || 0);
    const pendingAdjustments = adjTotal - adjPosted;

    const evidenceCount = evRows[0]?.n || 0;

    const wpTotal = wpRows[0]?.total || 0;
    const wpComplete = wpRows[0]?.complete || 0;
    const wpCompletion = wpTotal > 0 ? Math.round((wpComplete / wpTotal) * 100) : 0;

    const tbEntryCount = tbRows[0]?.n || 0;

    const tbDebit = Number(tbSumRows[0]?.debit || 0);
    const tbCredit = Number(tbSumRows[0]?.credit || 0);

    const tbCategoryBreakdown = tbCatRows.map((r: any) => ({
      category: r.category,
      amount: Number(r.amount),
      items: r.items,
    }));

    const topRevenueItems = topItemRows
      .map((r: any) => ({ code: r.code, description: r.description, amount: Number(r.net) }))
      .filter((r: any) => r.amount > 0)
      .sort((a: any, b: any) => b.amount - a.amount)
      .slice(0, 5);
    const topExpenditureItems = topItemRows
      .map((r: any) => ({ code: r.code, description: r.description, amount: -Number(r.net) }))
      .filter((r: any) => r.amount > 0)
      .sort((a: any, b: any) => b.amount - a.amount)
      .slice(0, 5);

    const budgetVsActual = bvaRows.map((r: any) => ({
      category: r.category,
      budget: Number(r.budget),
      actual: Number(r.actual),
      variance: Number(r.actual) - Number(r.budget),
    }));

    const glSummary = glRowsRes
      ? {
          entries: glRowsRes[0]?.n || 0,
          debit: Number(glRowsRes[0]?.debit || 0),
          credit: Number(glRowsRes[0]?.credit || 0),
        }
      : null;

    // ── Compliance score (simple weighted blend) ───────────────────────
    const avgCompleteness = avgCompletenessCount > 0 ? avgCompletenessSum / avgCompletenessCount : 0;
    const complianceScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          0.4 * avgCompleteness +
            0.3 * wpCompletion +
            0.2 * (totalFindings === 0 ? 100 : (resolvedFindings / Math.max(1, totalFindings)) * 100) +
            0.1 * (openRfis === 0 ? 100 : Math.max(0, 100 - overdueRfis * 10))
        )
      )
    );

    res.json({
      financialYear: fy ? { id: fy.id, label: fy.label, status: fy.status } : null,
      kpis: {
        totalCompilations,
        inProgress,
        approved,
        published,
        openRfis,
        overdueRfis,
        unresolvedFindings,
        totalFindings,
        pendingAdjustments,
        evidenceCount,
        wpCompletion,
        avgCompleteness: Math.round(avgCompleteness),
        tbEntryCount,
      },
      compilationsByStatus,
      findingsBySeverity,
      complianceScore,
      recentActivity: actRows.map((r) => ({
        type: r.type,
        action: r.action,
        date: r.date,
      })),
      adjustmentSummary: { total: adjTotal, posted: adjPosted, totalAmount: adjSum },
      tbSummary: {
        debit: tbDebit,
        credit: tbCredit,
        net: tbDebit - tbCredit,
        rows: tbEntryCount,
      },
      tbCategoryBreakdown,
      budgetVsActual,
      topRevenueItems,
      topExpenditureItems,
      glSummary,
    });
  } catch (e) {
    if (isDbUnavailable(e)) {
      console.warn('[afs-api] DB unavailable, returning demo dashboard');
      return res.json(demoDashboard);
    }
    next(e);
  }
});

// ────────────────────────────────────────────────────────────
// Compilations list (used by several screens)
// ────────────────────────────────────────────────────────────
app.get('/api/compilations', async (_req, res, next) => {
  if (await isDbDown()) return res.json(demoCompilations);
  try {
    const rows = await query<any>(
      `SELECT id, name, status, "financialYearId", "completenessPercentage",
              "preparedAt", "reviewedAt", "approvedAt", "isActive",
              "createdAt", "updatedAt"
         FROM public.compilations
        ORDER BY "updatedAt" DESC NULLS LAST`
    );
    res.json(rows);
  } catch (e) {
    if (isDbUnavailable(e)) {
      console.warn('[afs-api] DB unavailable, returning demo compilations');
      return res.json(demoCompilations);
    }
    next(e);
  }
});

// ────────────────────────────────────────────────────────────
// Demo-only sub-dashboard endpoints (returned when DB is unreachable)
// ────────────────────────────────────────────────────────────
app.get('/api/reports/findings-dashboard', (_req, res) => res.json(demoFindingsDashboard));
app.get('/api/reports/findings-extended', (_req, res) => res.json(demoFindingsDashboard));
app.get('/api/reports/rfi-dashboard', (_req, res) => res.json(demoRfiDashboard));
app.get('/api/reports/rfi-register', (_req, res) => res.json(demoRfiDashboard));
app.get('/api/reports/mfma-commentary', (_req, res) => res.json(demoMfmaCommentary));
app.get('/api/reports/mfma-commentary/:fyId', (_req, res) => res.json(demoMfmaCommentary));
app.get('/api/reports/mfma-submissions', (_req, res) => res.json(demoMfmaSubmissions));
app.get('/api/reports/mfma-submissions/:fyId', (_req, res) => res.json(demoMfmaSubmissions));
app.get('/api/reports/mfma-report/:fyId', (_req, res) => res.json(demoMfmaReport));
app.get('/api/reports/exception-register', (_req, res) => res.json(demoExceptionRegister));
app.get('/api/reports/evidence-heatmap', (_req, res) => res.json(demoEvidenceHeatmap));
app.get('/api/reports/mapping-audit', (_req, res) => res.json(demoMappingAudit));
app.get('/api/reports/adjustments-register', (_req, res) => res.json(demoAdjustmentsRegister));
app.get('/api/reports/integrity-checks', (_req, res) => res.json(demoIntegrityChecks));
app.get('/api/working-papers', (_req, res) => res.json([]));
app.get('/api/validation-rules/results', (_req, res) => res.json({ results: [], total: 0 }));
app.post('/api/validation-rules/run', (_req, res) => res.json({ status: 'ok', runId: 'demo-' + Date.now() }));
app.get('/api/ems-data/status', (_req, res) => res.json({ status: 'idle', lastSync: null }));
app.post('/api/ems-data/sync', (_req, res) => res.json({ status: 'started', jobId: 'demo-' + Date.now() }));
app.get('/api/ems-data/sync/progress', (_req, res) => res.json({ status: 'idle', progress: 0 }));
app.get('/api/platinum/sync/status', (_req, res) => res.json({ status: 'idle', lastSync: null }));
app.post('/api/platinum/sync/general-ledger', (_req, res) => res.json({ status: 'started' }));
app.post('/api/platinum/sync/trial-balance', (_req, res) => res.json({ status: 'started' }));
app.post('/api/platinum/sync/cancel', (_req, res) => res.json({ status: 'cancelled' }));

// ────────────────────────────────────────────────────────────
// Centralised error handler
// ────────────────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[afs-api] error:', err?.message || err);
  res.status(500).json({ message: err?.message || 'Internal error' });
});

const port = Number(process.env.PORT) || 9000;
app.listen(port, '0.0.0.0', () => {
  console.log(`[afs-api] listening on :${port}`);
});

// Process-level safety nets — log instead of crashing on stray promise errors
process.on('unhandledRejection', (reason) => {
  console.error('[afs-api] unhandledRejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[afs-api] uncaughtException:', err?.message || err);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  pool.end().finally(() => process.exit(0));
});
process.on('SIGINT', () => {
  pool.end().finally(() => process.exit(0));
});
