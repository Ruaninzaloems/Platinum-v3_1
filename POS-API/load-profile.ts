/**
 * EMS config profile loader + global App Settings loader.
 * ──────────────────────────────────────────────────────
 * A single env var — EMS_PROFILE — selects the whole EMS/tenant config set, loaded
 * from ./env/<profile>.env (e.g. "grguat", "localtest"). This works both locally and
 * on Azure App Service: set EMS_PROFILE as an Application Setting and the matching
 * profile file is applied at startup.
 *
 * After the profile, this also loads the monorepo-root .env (see .env.example) — the
 * shared PLATINUM_JWT_SECRET and SESSION_SECRET in particular live there, same as
 * every other module. Layering order: real process env (Azure App Setting, or an
 * exported var) > profile file > root .env — each layer only fills keys the one
 * before it didn't set. This order is deliberate: POS-API's own PLATINUM_API_URL
 * (George's billing/auth API) must never be shadowed by a same-named root .env key —
 * that's exactly the bug that happened once before (the root .env's AFS integration
 * URL was originally also just called PLATINUM_API_URL; it's now AFS_PLATINUM_API_URL
 * specifically so this is safe) — loading the profile file FIRST means a profile's own
 * value always wins over anything generic in the root file, not just over env vars.
 *
 * Imported FIRST in index.ts so both run before ems-db.ts / platinum-auth.ts read
 * process.env at module load.
 */
import { readFileSync, existsSync } from "fs";
import path from "path";

function applyEnvFile(file: string, label: string): void {
  if (!existsSync(file)) {
    console.warn(`[${label}] ${file} not found — skipping`);
    return;
  }
  let applied = 0;
  for (const raw of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = val;
      applied++;
    }
  }
  console.log(`[${label}] loaded ${applied} var(s) from ${file} (existing env wins)`);
}

const profile = process.env.EMS_PROFILE || "grguat";
applyEnvFile(path.resolve(import.meta.dirname, "env", `${profile}.env`), `profile:${profile}`);
applyEnvFile(path.resolve(import.meta.dirname, "..", ".env"), "global-env");
