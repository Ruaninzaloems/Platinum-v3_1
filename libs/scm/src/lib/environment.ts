// SCM backend base URL.
// Overridable at runtime via the SCM_API_URL App Setting, which server.js injects into the
// page as `window.__PLATINUM_ENV__.SCM_API_URL`. Falls back to the Azure default in local dev
// (ng serve, where server.js isn't in the loop) or when the setting is unset. Must match the
// same host production actually uses (platinum-scm-api) -- confirmed 2026-09-01 that the old
// rep-scm-api fallback here is a different, stale deployment that rejects the shared
// dev-fallback credentials platinum-scm-api accepts, breaking every local SCM session.
const scmApiUrl: string =
  (typeof globalThis !== 'undefined' && (globalThis as any).__PLATINUM_ENV__?.SCM_API_URL) ||
  'https://platinum-scm-api.azurewebsites.net';

export const environment = {
  production: false,
  apiPrefix: scmApiUrl.replace(/\/$/, ''),
  apiUrl: `${scmApiUrl.replace(/\/$/, '')}/api`,
};
