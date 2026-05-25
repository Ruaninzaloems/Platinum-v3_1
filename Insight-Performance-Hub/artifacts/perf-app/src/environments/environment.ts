export const environment = {
  production: false,
  apiBaseUrl: '/api',
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
