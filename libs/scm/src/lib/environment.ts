// SCM backend base URL.
// Overridable at runtime via the SCM_API_URL App Setting, which server.js injects into the
// page as `window.__PLATINUM_ENV__.SCM_API_URL`. Falls back to the Azure default in local dev
// (ng serve, where server.js isn't in the loop) or when the setting is unset.
const scmApiUrl: string =
  (typeof globalThis !== 'undefined' && (globalThis as any).__PLATINUM_ENV__?.SCM_API_URL) ||
  'https://rep-scm-api.azurewebsites.net';

export const environment = {
  production: false,
  apiPrefix: scmApiUrl.replace(/\/$/, ''),
  apiUrl: `${scmApiUrl.replace(/\/$/, '')}/api`,
};
