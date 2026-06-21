import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./shared/schema";

const dbConnStr = process.env.AZURE_DATABASE_URL || process.env.DATABASE_URL;

// Fail lazily rather than on import: this module is pulled in transitively (e.g.
// by communications.routes), so a hard throw here would crash the whole server
// at boot when Postgres isn't configured. Features that actually touch Postgres
// still get a clear error; Postgres-free paths (e.g. the Azure-AD login) run fine.
function notConfigured(): never {
  throw new Error(
    "Postgres is not configured — set AZURE_DATABASE_URL or DATABASE_URL to use Postgres-backed features.",
  );
}

export const pool: pg.Pool = dbConnStr
  ? new pg.Pool({
      connectionString: dbConnStr,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  : (new Proxy({}, { get: notConfigured }) as unknown as pg.Pool);

export const db = dbConnStr
  ? drizzle(pool, { schema })
  : (new Proxy({}, { get: notConfigured }) as unknown as ReturnType<typeof drizzle>);

if (!dbConnStr) {
  console.warn("[db] Postgres not configured — Postgres-backed features are disabled.");
}
