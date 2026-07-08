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
 *   OVERTIME_API_URL  e.g. https://platinum-overtime-api.azurewebsites.net
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

// Runtime config exposed to the browser SPA as window.__PLATINUM_ENV__ (injected into index.html
// below). Lets App Settings drive front-end config that isn't served through the shell proxy —
// notably the SCM module, which calls its Azure backend host directly.
//   SCM_API_URL   e.g. https://rep-scm-api.azurewebsites.net   (overridable per environment)
const RUNTIME_ENV = {
  SCM_API_URL: (process.env.SCM_API_URL || 'https://rep-scm-api.azurewebsites.net').trim().replace(/\/+$/, ''),
};
console.log(`[shell] Runtime env → SCM_API_URL=${RUNTIME_ENV.SCM_API_URL}`);

// index.html with the runtime-env snippet injected into <head> (before the app bundle runs).
let indexHtmlCache = null;
function getIndexHtml() {
  if (indexHtmlCache) return indexHtmlCache;
  let html = fs.readFileSync(path.join(browserDir, 'index.html'), 'utf8');
  const snippet = `<script>window.__PLATINUM_ENV__=${JSON.stringify(RUNTIME_ENV)};</script>`;
  indexHtmlCache = html.includes('</head>')
    ? html.replace('</head>', `${snippet}</head>`)
    : `${snippet}${html}`;
  return indexHtmlCache;
}

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
  overtime: process.env.OVERTIME_API_URL,
};

// Azure App Service backends enforce HTTPS: an http:// request is answered with a 301
// redirect to https. http-proxy-middleware passes that 301 back to the browser, which then
// follows it to a mangled "https://host:80" URL → net::ERR_SSL_PROTOCOL_ERROR (HTTPS on the
// plaintext port). Upgrade any http:// Azure target to https:// so the proxy talks HTTPS
// directly and the backend never issues the redirect in the first place.
function normalizeTarget(url) {
  if (!url) return url;
  let t = url.trim().replace(/\/+$/, '');
  if (/^http:\/\//i.test(t) && /\.azurewebsites\.net/i.test(t)) {
    t = t.replace(/^http:\/\//i, 'https://');
    console.warn(`[shell] Upgraded http→https for Azure target: ${t}`);
  }
  return t;
}

function mountProxy(prefix, targetUrl, rewriteTo) {
  if (!targetUrl) {
    console.warn(`[shell] No target configured for ${prefix} (skipping proxy)`);
    return;
  }
  const target = normalizeTarget(targetUrl);
  console.log(`[shell] Proxy ${prefix}/* -> ${target}${rewriteTo}`);
  app.use(
    prefix,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      secure: true,
      xfwd: true,
      // Follow any upstream redirect server-side so a stray http→https 301 can never
      // leak to the browser as a broken https://host:80 URL.
      followRedirects: true,
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
mountProxy('/overtime-app/api', targets.overtime, '/api');

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
  res.type('html').send(getIndexHtml());
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[shell] Listening on port ${PORT}`);
});
