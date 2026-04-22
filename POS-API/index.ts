import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import compression from "compression";
import pgSessionStore from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import path from "path";
import { existsSync } from "fs";
import crypto from "crypto";
import { spawn } from "child_process";
import type { UserSession } from "./platinum-auth";

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err.message, err.stack?.substring(0, 500));
});
process.on('unhandledRejection', (reason: any) => {
  console.error('[FATAL] Unhandled rejection:', reason?.message || reason, reason?.stack?.substring(0, 500));
});
process.on('SIGTERM', () => { console.log('[PROCESS] Received SIGTERM'); process.exit(0); });
process.on('SIGINT', () => { console.log('[PROCESS] Received SIGINT'); process.exit(0); });

const app = express();
const httpServer = createServer(app);

httpServer.keepAliveTimeout = 65000;
httpServer.headersTimeout = 66000;

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

declare module "express-session" {
  interface SessionData {
    platinumAuth: UserSession;
  }
}

const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

app.set('trust proxy', 1);

app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
}));

const PgStore = pgSessionStore(session);

app.use(
  session({
    store: new PgStore({
      conString: process.env.DATABASE_URL,
      tableName: 'user_sessions',
      createTableIfMissing: true,
      pruneSessionInterval: 300,
    }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: 'pos.sid',
    cookie: {
      maxAge: 12 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  })
);

app.use(
  express.json({
    limit: '10mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: '10mb' }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      log(`${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

(async () => {
  app.get("/dist/bundle.js", (req: Request, res: Response) => {
    res.set({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    });
    const bundlePath = path.resolve(import.meta.dirname, "..", "dist", "bundle.js");
    if (!existsSync(bundlePath)) {
      return res.status(404).json({ message: "Bundle not built. Run: npm run build:lib" });
    }
    return res.sendFile(bundlePath);
  });

  app.options("/dist/bundle.js", (_req: Request, res: Response) => {
    res.set({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    return res.sendStatus(204);
  });

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  serveStatic(app);

  const port = parseInt(process.env.PORT || '5000', 10);
  const spawnSiblings = process.env.SPAWN_SIBLING_SERVICES === 'true';
  httpServer.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);

    if (port !== 5000 && spawnSiblings) {
      // NOTE: We deliberately do NOT spawn an Angular dev server here.
      // The new Nx shell at apps/shell is owned by the dedicated
      // "Platinum Shell" workflow on port 5000. Spawning the legacy
      // ASSETS-UI app from this process used to win the port race and
      // serve a stale, broken login screen (calls /api/auth/login on
      // port 3000 → ECONNREFUSED → "Invalid username or password").

      const budgetApiDir = path.resolve(process.cwd(), '..', 'BUDGET-APP', 'PlatinumBudget.Api');
      if (existsSync(budgetApiDir)) {
        log(`Starting Budget API on port 3001...`);
        const budgetApi = spawn('dotnet', ['run'], {
          cwd: budgetApiDir,
          env: { ...process.env },
          stdio: ['ignore', 'pipe', 'pipe']
        });
        budgetApi.stdout?.on('data', (d: Buffer) => {
          const line = d.toString().trim();
          if (line) console.log(`[budget-api] ${line}`);
        });
        budgetApi.stderr?.on('data', (d: Buffer) => {
          const line = d.toString().trim();
          if (line) console.error(`[budget-api] ${line}`);
        });
        budgetApi.on('exit', (code: number | null) => console.log(`[budget-api] exited with code ${code}`));
      }

      const budgetUiDir = path.resolve(process.cwd(), '..', 'BUDGET-APP', 'platinum-budget-ui');
      if (existsSync(budgetUiDir)) {
        log(`Starting Budget UI on port 4201...`);
        const budgetUi = spawn('npx', ['ng', 'serve', '--host', '0.0.0.0', '--port', '4201', '--proxy-config', 'proxy.conf.json', '--serve-path', '/budget-app/'], {
          cwd: budgetUiDir,
          env: { ...process.env, NG_CLI_ANALYTICS: 'false' },
          stdio: ['ignore', 'pipe', 'pipe']
        });
        budgetUi.stdout?.on('data', (d: Buffer) => {
          const line = d.toString().trim();
          if (line) console.log(`[budget-ui] ${line}`);
        });
        budgetUi.stderr?.on('data', (d: Buffer) => {
          const line = d.toString().trim();
          if (line) console.error(`[budget-ui] ${line}`);
        });
        budgetUi.on('exit', (code: number | null) => console.log(`[budget-ui] exited with code ${code}`));
      }

      const perfHubDir = path.resolve(process.cwd(), '..', 'Insight-Performance-Hub');
      if (existsSync(perfHubDir)) {
        log(`Starting Performance Hub API on port 8080...`);
        const perfApi = spawn('pnpm', ['--filter', '@workspace/api-server', 'run', 'dev'], {
          cwd: perfHubDir,
          env: { ...process.env, PORT: '8080', NODE_ENV: 'development' },
          stdio: ['ignore', 'pipe', 'pipe']
        });
        perfApi.stdout?.on('data', (d: Buffer) => {
          const line = d.toString().trim();
          if (line) console.log(`[perf-api] ${line}`);
        });
        perfApi.stderr?.on('data', (d: Buffer) => {
          const line = d.toString().trim();
          if (line) console.error(`[perf-api] ${line}`);
        });
        perfApi.on('exit', (code: number | null) => console.log(`[perf-api] exited with code ${code}`));

      }
    }
  });
})();
