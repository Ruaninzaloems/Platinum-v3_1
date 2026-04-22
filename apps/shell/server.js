/**
 * Production server for the Platinum Angular shell.
 *
 * Serves the built Angular SPA from `dist/shell/browser` (or `./browser`
 * when deployed) and reverse-proxies API requests to the corresponding
 * backend Azure App Service URLs.
 *
 * Backend URLs are read from environment variables. Configure these in
 * the Azure Web App's "Configuration" -> "Application settings":
 *
 *   ASSETS_API_URL    e.g. https://platinum-assets-api.azurewebsites.net
 *   POS_API_URL       e.g. https://platinum-pos-api.azurewebsites.net
 *   AFS_API_URL       e.g. https://platinum-afs-api.azurewebsites.net
 *   PAYROLL_API_URL   e.g. https://platinum-payroll-api.azurewebsites.net
 *   IDP_API_URL       e.g. https://platinum-idp-api.azurewebsites.net
 *   BUDGET_API_URL    e.g. https://platinum-budget-api.azurewebsites.net
 *   SCM_API_URL       e.g. https://platinum-scm-api.azurewebsites.net
 *   INSIGHTS_API_URL  e.g. https://platinum-insights-api.azurewebsites.net
 *
 * Listens on PORT (provided by Azure App Service) or 5000 locally.
 */

const path = require('path');
const fs = require('fs');
const express = require('express');
const compression = require('compression');
const { createProxyMiddleware } = require('http-proxy-middleware');

const PORT = parseInt(process.env.PORT, 10) || 5000;

function findBrowserDir() {
  const candidates = [
    path.join(__dirname, 'browser'),
    path.join(__dirname, '..', '..', 'dist', 'shell', 'browser'),
    path.join(__dirname, 'dist', 'shell', 'browser'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'index.html'))) return c;
  }
  return candidates[0];
}

const browserDir = findBrowserDir();
console.log(`[shell] Serving Angular SPA from: ${browserDir}`);

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(compression());

const targets = {
  assets: process.env.ASSETS_API_URL,
  pos: process.env.POS_API_URL,
  afs: process.env.AFS_API_URL,
  payroll: process.env.PAYROLL_API_URL,
  idp: process.env.IDP_API_URL,
  budget: process.env.BUDGET_API_URL,
  scm: process.env.SCM_API_URL,
  insights: process.env.INSIGHTS_API_URL,
};

function mountProxy(prefix, targetUrl, rewriteTo) {
  if (!targetUrl) {
    console.warn(`[shell] No target configured for ${prefix} (skipping proxy)`);
    return;
  }
  console.log(`[shell] Proxy ${prefix}/* -> ${targetUrl}${rewriteTo}`);
  app.use(
    prefix,
    createProxyMiddleware({
      target: targetUrl,
      changeOrigin: true,
      secure: true,
      xfwd: true,
      pathRewrite: (p) => rewriteTo + p,
      proxyTimeout: 600000,
      timeout: 600000,
    })
  );
}

// Module-prefixed paths used by the Angular libs
mountProxy('/scm-app/api', targets.scm, '/api');
mountProxy('/pos-app/api', targets.pos, '/api');
mountProxy('/afs-app/api', targets.afs, '/api');
mountProxy('/payroll-app/api', targets.payroll, '/api/v1');
mountProxy('/idp-app/api', targets.idp, '/api');
mountProxy('/budget-app/api', targets.budget, '/api');
mountProxy('/insights-app/api', targets.insights, '/api');

// Legacy / direct ASSETS API paths
mountProxy('/ASSETS-API', targets.assets, '/api');
mountProxy('/api', targets.assets, '/api');

// Health endpoint for Azure
app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', service: 'platinum-shell', time: new Date().toISOString() });
});

// Static assets and SPA fallback
app.use(
  express.static(browserDir, {
    index: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  })
);

app.get('*', (_req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(browserDir, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[shell] Listening on port ${PORT}`);
});
