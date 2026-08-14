// ────────────────────────────────────────────────────────────────────────────
// Platinum core financials API proxy (read endpoints).
//
// Faithful port of the source Platinum-AFS NestJS module
//   server/src/modules/platinum-api/{platinum-api.service,controller}.ts
// adapted to the monorepo's simplified Express API. The Angular frontend
// (libs/afs PlatinumApiService) calls `/api/platinum/*`; these handlers proxy
// trial-balance & general-ledger reads to the external Platinum API at
// AFS_PLATINUM_API_URL.
//
// Scope note: only the READ endpoints the frontend service actually calls are
// ported. The source's sync/csv-import/tb-import-batch mutation endpoints depend
// on TypeORM + the source DB schema and are out of scope for this API (the
// existing `/api/platinum/sync/*` stubs in index.ts remain).
//
// Env (read lazily so dotenv — loaded in db.ts — has run first):
//   AFS_PLATINUM_API_URL  e.g. https://platinum-afs.azurewebsites.net
//   (named distinctly from POS-API's PLATINUM_API_URL, which points at a different
//   backend — the George Platinum billing/auth API — to avoid collisions when both
//   services read from the same shared root .env)
// ────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';

// ── Host layout helpers (from server/src/common/constants/platinum-api-hosts.ts)
const FINANCIALS_STYLE_API_HOSTS = new Set<string>(['platinumgeorgeuat-afs-api.azurewebsites.net']);

function normalizeApiBaseUrl(url: string): string {
  if (!url) return url;
  const trimmed = url.trim();
  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed.replace(/\/+$/, '');
  }
}
function isFinancialsStyleHost(baseUrl: string): boolean {
  try {
    return FINANCIALS_STYLE_API_HOSTS.has(new URL(baseUrl).hostname);
  } catch {
    return false;
  }
}
function trialBalancePrefixFor(baseUrl: string): string {
  return isFinancialsStyleHost(baseUrl) ? '/api/financials' : '/api/TrialBalance';
}
function trialBalanceListPathFor(baseUrl: string): string {
  return isFinancialsStyleHost(baseUrl) ? '/api/financials/trial-balance' : '/api/TrialBalance';
}
function trialBalanceHealthPathFor(baseUrl: string): string {
  return `${trialBalancePrefixFor(baseUrl)}/health`;
}

class PlatinumApiClient {
  private cache = new Map<string, { data: any; expiry: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000;

  private get baseUrl(): string {
    return normalizeApiBaseUrl(process.env.AFS_PLATINUM_API_URL || 'https://platinum-afs.azurewebsites.net');
  }
  private get tbPrefix(): string {
    return trialBalancePrefixFor(this.baseUrl);
  }
  private get tbListPath(): string {
    return trialBalanceListPathFor(this.baseUrl);
  }
  private get tbHealthPath(): string {
    return trialBalanceHealthPathFor(this.baseUrl);
  }

  isConfigured(): boolean {
    return !!this.baseUrl;
  }

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() < entry.expiry) return entry.data as T;
    if (entry) this.cache.delete(key);
    return null;
  }
  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, expiry: Date.now() + this.CACHE_TTL });
  }

  private normalizeFinYear(fy: string): string {
    const m = fy.match(/^(\d{4})\/(\d{2})$/);
    if (m) {
      const start = parseInt(m[1], 10);
      return `${start}/${start + 1}`;
    }
    return fy;
  }

  private async request<T>(path: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          const v = key === 'finYear' ? this.normalizeFinYear(String(value)) : String(value);
          url.searchParams.set(key, v);
        }
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000);

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`Platinum API request failed: ${response.status} ${response.statusText}`);
    }

    const totalCount = response.headers.get('X-Total-Count');
    const data = (await response.json()) as T;
    if (totalCount && Array.isArray(data)) {
      (data as any).__totalCount = parseInt(totalCount);
      (data as any).__page = response.headers.get('X-Page');
      (data as any).__pageSize = response.headers.get('X-Page-Size');
    }
    return data;
  }

  async getHealth() {
    const [tbHealth, glHealth] = await Promise.all([
      this.request<any>(this.tbHealthPath),
      this.request<any>('/api/GeneralLedger/health'),
    ]);
    return {
      connected: true,
      baseUrl: this.baseUrl,
      trialBalance: tbHealth,
      generalLedger: glHealth,
      timestamp: new Date().toISOString(),
    };
  }

  async getFinancialYears() {
    const cached = this.getCached<any>('financialYears');
    if (cached) return cached;
    const [tbYears, glYears] = await Promise.all([
      this.request<any[]>(`${this.tbPrefix}/financial-years`),
      this.request<any[]>('/api/GeneralLedger/financial-years'),
    ]);
    const allYears = [...new Set([...(tbYears || []), ...(glYears || [])])];
    const result = { financialYears: allYears, trialBalance: tbYears, generalLedger: glYears };
    this.setCache('financialYears', result);
    return result;
  }

  getTrialBalance(params: { finYear?: string; page?: number; pageSize?: number; sortDesc?: string }) {
    return this.request<any[]>(this.tbListPath, params);
  }
  getTrialBalanceSummary(finYear?: string) {
    return this.request<any[]>(`${this.tbPrefix}/summary`, finYear ? { finYear } : undefined);
  }
  getTrialBalanceByCategory(sortDesc: string, finYear?: string, page?: number, pageSize?: number) {
    return this.request<any[]>(`${this.tbPrefix}/by-category/${encodeURIComponent(sortDesc)}`, { finYear, page, pageSize });
  }
  getTrialBalanceByScoaItem(scoaItemCode: string, finYear?: string, page?: number, pageSize?: number) {
    return this.request<any[]>(`${this.tbPrefix}/by-scoa-item/${encodeURIComponent(scoaItemCode)}`, { finYear, page, pageSize });
  }
  getTrialBalanceByVote(voteId: number, finYear?: string) {
    return this.request<any[]>(`${this.tbPrefix}/by-vote/${voteId}`, finYear ? { finYear } : undefined);
  }

  getGeneralLedger(params: { finYear?: string; processingMonth?: number; page?: number; pageSize?: number }) {
    return this.request<any[]>('/api/GeneralLedger', params);
  }
  async getGeneralLedgerSummary(finYear?: string) {
    const cacheKey = `glSummary:${finYear || 'all'}`;
    const cached = this.getCached<any>(cacheKey);
    if (cached) return cached;
    const result = await this.request<any>('/api/GeneralLedger/summary', finYear ? { finYear } : undefined);
    this.setCache(cacheKey, result);
    return result;
  }
  getGeneralLedgerByAccount(accountNo: string, finYear?: string, page?: number, pageSize?: number) {
    return this.request<any[]>(`/api/GeneralLedger/by-account/${encodeURIComponent(accountNo)}`, { finYear, page, pageSize });
  }
  getGeneralLedgerByDocument(documentNumber: string, finYear?: string, page?: number, pageSize?: number) {
    return this.request<any[]>(`/api/GeneralLedger/by-document/${encodeURIComponent(documentNumber)}`, { finYear, page, pageSize });
  }
  getGeneralLedgerByProcessingMonth(finYear: string, month: number, page?: number, pageSize?: number) {
    return this.request<any[]>(
      `/api/GeneralLedger/by-processing-month/${encodeURIComponent(this.normalizeFinYear(finYear))}/${month}`,
      { page, pageSize },
    );
  }
  getGeneralLedgerByScoaItem(scoaItemCode: string, finYear?: string, page?: number, pageSize?: number) {
    return this.request<any[]>(`/api/GeneralLedger/by-scoa-item/${encodeURIComponent(scoaItemCode)}`, { finYear, page, pageSize });
  }
  getGeneralLedgerByVote(voteId: number, finYear?: string, page?: number, pageSize?: number) {
    return this.request<any[]>(`/api/GeneralLedger/by-vote/${voteId}`, { finYear, page, pageSize });
  }
}

const platinum = new PlatinumApiClient();

const num = (v: any): number | undefined => (v !== undefined && v !== null && v !== '' ? Number(v) : undefined);

export const platinumRouter = Router();

// Mirrors the read endpoints of server/src/modules/platinum-api/platinum-api.controller.ts
platinumRouter.get('/health', async (_req, res) => {
  try {
    const health = await platinum.getHealth();
    res.json(health);
  } catch (err: any) {
    res.json({ connected: false, configured: platinum.isConfigured(), error: err.message });
  }
});

platinumRouter.get('/financial-years', (_req, res, next) =>
  platinum.getFinancialYears().then((d) => res.json(d)).catch(next));

platinumRouter.get('/trial-balance', (req, res, next) => {
  const { finYear, page, pageSize, sortDesc } = req.query as Record<string, string>;
  platinum
    .getTrialBalance({ finYear, page: num(page), pageSize: num(pageSize), sortDesc })
    .then((d) => res.json(d))
    .catch(next);
});
platinumRouter.get('/trial-balance/summary', (req, res, next) =>
  platinum.getTrialBalanceSummary(req.query.finYear as string | undefined).then((d) => res.json(d)).catch(next));
platinumRouter.get('/trial-balance/by-category/:sortDesc', (req, res, next) =>
  platinum
    .getTrialBalanceByCategory(
      req.params.sortDesc,
      req.query.finYear as string | undefined,
      num(req.query.page),
      num(req.query.pageSize),
    )
    .then((d) => res.json(d))
    .catch(next));
platinumRouter.get('/trial-balance/by-scoa-item/:scoaItemCode', (req, res, next) =>
  platinum
    .getTrialBalanceByScoaItem(
      req.params.scoaItemCode,
      req.query.finYear as string | undefined,
      num(req.query.page),
      num(req.query.pageSize),
    )
    .then((d) => res.json(d))
    .catch(next));
platinumRouter.get('/trial-balance/by-vote/:voteId', (req, res, next) =>
  platinum
    .getTrialBalanceByVote(Number(req.params.voteId), req.query.finYear as string | undefined)
    .then((d) => res.json(d))
    .catch(next));

platinumRouter.get('/general-ledger', (req, res, next) => {
  const { finYear, processingMonth, page, pageSize } = req.query as Record<string, string>;
  platinum
    .getGeneralLedger({ finYear, processingMonth: num(processingMonth), page: num(page), pageSize: num(pageSize) })
    .then((d) => res.json(d))
    .catch(next);
});
platinumRouter.get('/general-ledger/summary', (req, res, next) =>
  platinum.getGeneralLedgerSummary(req.query.finYear as string | undefined).then((d) => res.json(d)).catch(next));
platinumRouter.get('/general-ledger/by-account/:accountNo', (req, res, next) =>
  platinum
    .getGeneralLedgerByAccount(
      req.params.accountNo,
      req.query.finYear as string | undefined,
      num(req.query.page),
      num(req.query.pageSize),
    )
    .then((d) => res.json(d))
    .catch(next));
platinumRouter.get('/general-ledger/by-document/:documentNumber', (req, res, next) =>
  platinum
    .getGeneralLedgerByDocument(
      req.params.documentNumber,
      req.query.finYear as string | undefined,
      num(req.query.page),
      num(req.query.pageSize),
    )
    .then((d) => res.json(d))
    .catch(next));
platinumRouter.get('/general-ledger/by-processing-month/:finYear/:month', (req, res, next) =>
  platinum
    .getGeneralLedgerByProcessingMonth(
      req.params.finYear,
      Number(req.params.month),
      num(req.query.page),
      num(req.query.pageSize),
    )
    .then((d) => res.json(d))
    .catch(next));
platinumRouter.get('/general-ledger/by-scoa-item/:scoaItemCode', (req, res, next) =>
  platinum
    .getGeneralLedgerByScoaItem(
      req.params.scoaItemCode,
      req.query.finYear as string | undefined,
      num(req.query.page),
      num(req.query.pageSize),
    )
    .then((d) => res.json(d))
    .catch(next));
platinumRouter.get('/general-ledger/by-vote/:voteId', (req, res, next) =>
  platinum
    .getGeneralLedgerByVote(
      Number(req.params.voteId),
      req.query.finYear as string | undefined,
      num(req.query.page),
      num(req.query.pageSize),
    )
    .then((d) => res.json(d))
    .catch(next));
