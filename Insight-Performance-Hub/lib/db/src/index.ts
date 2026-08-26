import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

/**
 * The monorepo (unlike the original Replit environment this was ported from)
 * reaches Azure Postgres directly, same as every other module -- see
 * MASTER.md section 4.2 for the firewall/dynamic-IP caveat that applies here too.
 */
const USE_REPLIT_BUILTIN_DB = false;

const connectionString = USE_REPLIT_BUILTIN_DB
  ? process.env.DATABASE_URL ?? process.env.APP_DATABASE_URL
  : process.env.APP_DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "APP_DATABASE_URL or DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const requiresSsl =
  /[?&]sslmode=require\b/i.test(connectionString) ||
  /\.azure\.com[:/]/i.test(connectionString);

export const pool = new Pool({
  connectionString,
  ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
