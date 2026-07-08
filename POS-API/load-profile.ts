/**
 * EMS config profile loader.
 * ──────────────────────────
 * A single env var — EMS_PROFILE — selects the whole EMS/tenant config set, loaded
 * from ./env/<profile>.env (e.g. "grguat", "localtest"). This works both locally and
 * on Azure App Service: set EMS_PROFILE as an Application Setting and the matching
 * profile file is applied at startup.
 *
 * Precedence: a real environment variable (Azure App Setting, or one exported before
 * launch) ALWAYS wins — a value from the profile file is only applied when that key
 * is not already set. So you can pick a profile and still override individual keys
 * (EMS_TENANT_SERVER, PLATINUM_API_URL, …) directly on the web app.
 *
 * Imported FIRST in index.ts so it runs before ems-db.ts / platinum-auth.ts read
 * process.env at module load.
 */
import { readFileSync, existsSync } from "fs";
import path from "path";

const profile = process.env.EMS_PROFILE || "grguat";
const file = path.resolve(import.meta.dirname, "env", `${profile}.env`);

if (existsSync(file)) {
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
  console.log(`[profile] EMS_PROFILE='${profile}' → loaded ${applied} var(s) from ${file} (existing env wins)`);
} else {
  console.warn(`[profile] EMS_PROFILE='${profile}' but ${file} not found — using process env only`);
}
