import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./shared/schema";

const dbConnStr = process.env.AZURE_DATABASE_URL || process.env.DATABASE_URL;
if (!dbConnStr) {
  throw new Error("AZURE_DATABASE_URL or DATABASE_URL must be set. Did you forget to provision a database?");
}

export const pool = new pg.Pool({
  connectionString: dbConnStr,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle(pool, { schema });
