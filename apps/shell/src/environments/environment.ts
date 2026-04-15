export const environment = {
  production: false,
  apiBaseUrl: '/api',
  modules: {
    assets: { apiUrl: '/api' },
    scm: { apiUrl: '/scm-app/api' },
    pos: { apiUrl: '/pos-app/api' },
    idp: { apiUrl: '/idp-app/api' },
    payroll: { apiUrl: '/payroll-app/api' },
    afs: { apiUrl: '/afs-app/api' },
    budget: { apiUrl: '/budget-app/api' },
    insight: { apiUrl: '/insights-app/api' }
  }
};
