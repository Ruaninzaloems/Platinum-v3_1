import type { Express, Request, Response } from "express";
import type { Server } from "http";
import { pool } from "../db";
import { getSession } from "./middleware";
import { isSessionAuthenticated } from "../platinum-auth";
import { verifyGlobalToken } from "../ems-jwt";

/**
 * Platform-wide settings stored on the server (table `platform_settings`), so a setting an
 * administrator saves applies to every user instead of living in one browser's localStorage.
 *
 * Today this carries the module SharePoint configuration (Assets / AFS / Overtime document
 * libraries). Only keys that belong to a SharePoint setting are accepted: the browser-side
 * module config also holds database credentials, and those must never be written here.
 */

const SETTINGS_KEY = "module-config";
const MAX_VALUE_LENGTH = 500;
const MAX_KEYS = 100;

/** e.g. assetsSharePointEnabled, afsCompilationsSharePointSiteUrl, overtimeSharePointLibrary */
const ALLOWED_KEY = /^[a-z][A-Za-z0-9]*SharePoint[A-Za-z0-9]*$/;

let tableReady: Promise<void> | null = null;

function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = pool
      .query(
        `CREATE TABLE IF NOT EXISTS platform_settings (
           key         text        PRIMARY KEY,
           value       jsonb       NOT NULL DEFAULT '{}'::jsonb,
           updated_by  text,
           updated_at  timestamptz NOT NULL DEFAULT now()
         )`,
      )
      .then(() => undefined)
      .catch((e) => {
        tableReady = null; // allow a retry on the next request
        throw e;
      });
  }
  return tableReady;
}

/** The caller's user name, from the global bearer token or the POS session; null when unauthenticated. */
function callerName(req: Request): string | null {
  const header = req.headers.authorization || "";
  if (header.toLowerCase().startsWith("bearer ")) {
    try {
      const claims = verifyGlobalToken(header.slice(7).trim());
      return claims.name || claims.sub || "unknown";
    } catch {
      /* fall through to the session check */
    }
  }
  const session = getSession(req);
  if (isSessionAuthenticated(session)) {
    return session.userData?.userName || String(session.userData?.user_ID ?? "unknown");
  }
  return null;
}

function validate(values: unknown): Record<string, boolean | string> | string {
  if (!values || typeof values !== "object" || Array.isArray(values)) return "values must be an object";
  const entries = Object.entries(values as Record<string, unknown>);
  if (entries.length > MAX_KEYS) return "too many settings";
  const out: Record<string, boolean | string> = {};
  for (const [k, v] of entries) {
    if (!ALLOWED_KEY.test(k)) return `setting "${k}" is not a SharePoint setting`;
    if (typeof v === "boolean") out[k] = v;
    else if (typeof v === "string" && v.length <= MAX_VALUE_LENGTH) out[k] = v;
    else return `setting "${k}" must be a boolean or a short string`;
  }
  return out;
}

export function registerPlatformSettingsRoutes(app: Express, _httpServer: Server): void {
  const respondError = (res: Response, e: any) =>
    res.status(502).json({ message: "Platform settings are unavailable", detail: e?.message });

  // Read the shared module (SharePoint) settings. Any signed-in user may read them: every
  // module needs the library names to upload and list documents.
  app.get("/api/platform-settings/module-config", async (req, res) => {
    if (!callerName(req)) return res.status(401).json({ message: "Not authenticated" });
    try {
      await ensureTable();
      const r = await pool.query(
        "SELECT value, updated_by, updated_at FROM platform_settings WHERE key = $1",
        [SETTINGS_KEY],
      );
      const row = r.rows[0];
      res.json({
        values: row?.value ?? {},
        updatedBy: row?.updated_by ?? null,
        updatedAt: row?.updated_at ?? null,
      });
    } catch (e) {
      respondError(res, e);
    }
  });

  // Save (merge) SharePoint settings. Requires a signed-in user; only SharePoint keys are accepted.
  app.put("/api/platform-settings/module-config", async (req, res) => {
    const who = callerName(req);
    if (!who) return res.status(401).json({ message: "Not authenticated" });
    const values = validate(req.body?.values);
    if (typeof values === "string") return res.status(400).json({ message: values });
    try {
      await ensureTable();
      const r = await pool.query(
        `INSERT INTO platform_settings (key, value, updated_by, updated_at)
         VALUES ($1, $2::jsonb, $3, now())
         ON CONFLICT (key) DO UPDATE
           SET value = platform_settings.value || EXCLUDED.value,
               updated_by = EXCLUDED.updated_by,
               updated_at = now()
         RETURNING value, updated_by, updated_at`,
        [SETTINGS_KEY, JSON.stringify(values), who],
      );
      const row = r.rows[0];
      console.log(`[platform-settings] module-config updated by ${who} (${Object.keys(values).length} keys)`);
      res.json({ values: row.value, updatedBy: row.updated_by, updatedAt: row.updated_at });
    } catch (e) {
      respondError(res, e);
    }
  });
}
