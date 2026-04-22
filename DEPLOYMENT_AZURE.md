# Deploying Platinum to Azure

This document describes how to deploy the Platinum platform to Microsoft
Azure as one frontend Web App plus one Web App per backend service.

## 1. Resource layout

Provision the following Azure App Service (Web App) resources, all on a
**Linux** App Service Plan. The runtime stacks are:

| # | Resource (suggested name)        | Stack            | Source folder                                  | Listens on |
|---|----------------------------------|------------------|------------------------------------------------|------------|
| 1 | `platinum-shell`                 | Node 20 LTS      | `apps/shell/`                                  | `$PORT`    |
| 2 | `platinum-assets-api`            | .NET 8           | `ASSETS-PSQL-API/`                             | `$PORT`    |
| 3 | `platinum-pos-api`               | Node 20 LTS      | `POS-API/`                                     | `$PORT`    |
| 4 | `platinum-afs-api`               | Node 20 LTS      | `AFS-UI/api/`                                  | `$PORT`    |
| 5 | `platinum-insights-api`          | Node 20 LTS      | `Insight-Performance-Hub/artifacts/api-server/`| `$PORT`    |

Optional (only if you also want them in Azure):

| # | Resource                  | Stack         | Source folder              | Listens on |
|---|---------------------------|---------------|----------------------------|------------|
| 6 | `platinum-payroll-api`    | Node 20 LTS   | `PAYROLL-APP/`             | `$PORT`    |
| 7 | `platinum-idp-api`        | .NET 8        | `IDP-UI/PlatinumIDP/`      | `$PORT`    |
| 8 | `platinum-budget-api`     | .NET 8        | `BUDGET-APP/PlatinumBudget.Api/` | `$PORT` |
| 9 | `platinum-scm-api`        | Node 20 LTS   | (SCM backend)              | `$PORT`    |

Also provision **Azure Database for PostgreSQL — Flexible Server** for the
shared database. Note its connection string.

## 2. Frontend Web App: `platinum-shell`

The shell Web App serves the built Angular SPA and reverse-proxies all
`/<module>-app/api/*` and `/api/*` requests to the corresponding backend
Web Apps. This preserves the path contract used by the dev proxy.

### 2.1 Build

From the repository root:

```bash
npm install
npm run build           # runs `nx build shell` -> dist/shell/browser
```

### 2.2 Deployment package

The deployable folder is `apps/shell/`. It must contain:

- `server.js`            (Express server + reverse proxy)
- `package.json`         (declares `express`, `compression`, `http-proxy-middleware`)
- `.deployment`          (tells Oryx to run `npm install`)
- `browser/`             (the contents of `dist/shell/browser` copied here)

A simple packaging script:

```bash
npm run build
cp -r dist/shell/browser apps/shell/browser
cd apps/shell && zip -r ../../platinum-shell.zip . -x "node_modules/*"
```

Then deploy with:

```bash
az webapp deploy \
  --resource-group <rg> \
  --name platinum-shell \
  --src-path platinum-shell.zip \
  --type zip
```

### 2.3 Required app settings

In the Azure portal under **Configuration -> Application settings**:

| Setting              | Example value                                            |
|----------------------|----------------------------------------------------------|
| `WEBSITES_PORT`      | `8080` (Linux App Service uses `PORT`; the server reads it) |
| `ASSETS_API_URL`     | `https://platinum-assets-api.azurewebsites.net`          |
| `POS_API_URL`        | `https://platinum-pos-api.azurewebsites.net`             |
| `AFS_API_URL`        | `https://platinum-afs-api.azurewebsites.net`             |
| `PAYROLL_API_URL`    | `https://platinum-payroll-api.azurewebsites.net`         |
| `IDP_API_URL`        | `https://platinum-idp-api.azurewebsites.net`             |
| `BUDGET_API_URL`     | `https://platinum-budget-api.azurewebsites.net`          |
| `SCM_API_URL`        | `https://platinum-scm-api.azurewebsites.net`             |
| `INSIGHTS_API_URL`   | `https://platinum-insights-api.azurewebsites.net`        |

Set the **Startup Command** to:

```
node server.js
```

## 3. Backend: ASSETS-PSQL-API (.NET 8)

### 3.1 Build & deploy

```bash
cd ASSETS-PSQL-API
dotnet publish -c Release -o ./publish
cd publish && zip -r ../../platinum-assets-api.zip .
az webapp deploy --resource-group <rg> --name platinum-assets-api \
  --src-path platinum-assets-api.zip --type zip
```

### 3.2 App settings

| Setting               | Value                                              |
|-----------------------|----------------------------------------------------|
| `ASPNETCORE_ENVIRONMENT` | `Production`                                    |
| `ConnectionStrings__Default` | (your Azure Postgres connection string)     |
| `CORS_ORIGINS`        | `https://platinum-shell.azurewebsites.net` (comma-separated for multiple) |
| `MssqlApi__BaseUrl`   | (only if you use the optional MSSQL API target)    |

**Do NOT** set `SPAWN_SIBLING_SERVICES`. It defaults to off; setting it
to `true` will try to spawn other services and fail in App Service.

The app no longer hardcodes port 3000 — it now binds to `$PORT` /
`ASPNETCORE_URLS`, which Azure provides automatically.

## 4. Backend: POS-API (Node 20)

### 4.1 Deploy

```bash
cd POS-API
zip -r ../platinum-pos-api.zip . -x "node_modules/*" "dist/*"
az webapp deploy --resource-group <rg> --name platinum-pos-api \
  --src-path ../platinum-pos-api.zip --type zip
```

Set Startup Command: `npm install && npm start`
(Oryx will normally do `npm install` automatically; the explicit form is
safer.)

### 4.2 App settings

| Setting           | Value                                                        |
|-------------------|--------------------------------------------------------------|
| `NODE_ENV`        | `production`                                                 |
| `DATABASE_URL`    | Azure Postgres connection string                             |
| `SESSION_SECRET`  | A long random string                                         |
| `CORS_ORIGINS`    | `https://platinum-shell.azurewebsites.net`                   |

The sibling-spawn block is now off by default — leave
`SPAWN_SIBLING_SERVICES` **unset** in production.

## 5. Backend: AFS-UI/api (Node 20)

```bash
cd AFS-UI/api
zip -r ../../platinum-afs-api.zip . -x "node_modules/*"
az webapp deploy --resource-group <rg> --name platinum-afs-api \
  --src-path platinum-afs-api.zip --type zip
```

Startup Command: `npm install && npm start`

App settings:

| Setting        | Value                                       |
|----------------|---------------------------------------------|
| `NODE_ENV`     | `production`                                |
| `DATABASE_URL` | Azure Postgres connection string            |
| `CORS_ORIGINS` | `https://platinum-shell.azurewebsites.net`  |

## 6. Backend: Insight-Performance-Hub api-server (Node 20)

```bash
cd Insight-Performance-Hub
zip -r ../platinum-insights-api.zip artifacts/api-server -x "**/node_modules/**"
az webapp deploy --resource-group <rg> --name platinum-insights-api \
  --src-path ../platinum-insights-api.zip --type zip
```

Because this is a pnpm workspace package, the simplest production setup
is to deploy the whole `Insight-Performance-Hub/` folder and set the
Startup Command to:

```
pnpm install --filter @workspace/api-server... && pnpm --filter @workspace/api-server start
```

App settings:

| Setting        | Value                                       |
|----------------|---------------------------------------------|
| `NODE_ENV`     | `production`                                |
| `DATABASE_URL` | Azure Postgres connection string            |
| `CORS_ORIGINS` | `https://platinum-shell.azurewebsites.net`  |

The hardcoded `FIXED_PORT = 6800` was removed — the server now reads
`process.env.PORT` (which Azure provides).

## 7. Verifying the deployment

1. Open `https://platinum-shell.azurewebsites.net/healthz` — should
   return `{"status":"ok",...}`.
2. Open `https://platinum-shell.azurewebsites.net/insights-app/api/cycles`
   — should return JSON from the Insights API via the proxy.
3. Open the shell URL in a browser. The Performance dashboard, POS,
   Assets, AFS, etc. should all load through the same proxy paths used
   in development.

## 8. Going further

- **Custom domain + TLS:** add a custom domain on the `platinum-shell`
  Web App; update `CORS_ORIGINS` on every backend Web App accordingly.
- **Front Door / Application Gateway:** if you prefer a single ingress,
  put Azure Front Door in front of `platinum-shell` and the backends
  can be on private endpoints; the same env-driven URLs still work.
- **CI/CD:** replace the manual `az webapp deploy` calls with GitHub
  Actions (use `azure/webapps-deploy@v3`), one workflow per service.
