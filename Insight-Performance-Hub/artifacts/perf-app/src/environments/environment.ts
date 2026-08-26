export const environment = {
  production: false,
  // Root-relative '/api' resolves against the shell's own origin (the iframe's
  // proxy-through to :8080 is invisible to the browser) and would hit the
  // shell's default /api rule (Assets, :3000) instead of this module's own
  // api-server. Must stay '/insights-app/api' -- see PerformanceSync.md.
  apiBaseUrl: '/insights-app/api',
  appName: 'Platinum Performance Management',
  version: '1.0.0',
  /**
   * Header value sent on every API call until JWT auth ships.
   * Backend middleware looks up the user by username from `x-user`.
   */
  demoUser: 'admin',
  /**
   * When true, the auth guard hydrates a synthetic admin if `/auth/me`
   * fails so the migration shell stays usable without a real session.
   * Must be `false` in production to keep the guard fail-closed.
   */
  allowDevAuthFallback: true,
};
