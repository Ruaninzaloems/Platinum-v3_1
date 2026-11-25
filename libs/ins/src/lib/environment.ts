export const environment = {
  production: false,
  apiPrefix: '/insights-app',
  // Every ported service/component calls apiBaseUrl directly (this was perf-app's
  // own environment shape before it was vendored into the shell as native code) --
  // kept as a derived alias rather than rewriting ~30 call sites to apiPrefix + '/api'.
  apiBaseUrl: '/insights-app/api',
  appName: 'Platinum Performance Management',
  version: '1.0.0',
  // Fallback username sent by AuthService if /auth/me fails and allowDevAuthFallback
  // is true. The real per-request identity comes from the shared auth interceptor's
  // x-user bridge (see libs/shared/auth/src/lib/auth.interceptor.ts) -- this is only
  // the last-resort value shown in the UI when that bridge itself can't resolve.
  demoUser: 'admin',
  allowDevAuthFallback: true,
};
