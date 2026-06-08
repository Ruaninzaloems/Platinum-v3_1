import { Pool } from 'pg';
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load the monorepo root .env so AZURE_POSTGRES_URL (the AFS database) is
// available even when this API is started without exported env vars.
// (db.ts lives at AFS-UI/api/, so the root .env is two levels up.)
const __dir = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dir, '../../.env') });

// Accepts either a postgresql:// URL or an ADO-style key=value connection string.
function buildPoolConfig(raw: string): ConstructorParameters<typeof Pool>[0] {
  if (raw.startsWith('postgresql://') || raw.startsWith('postgres://')) {
    // Use the URL directly — the pg driver handles sslmode query params natively.
    return { connectionString: raw, ssl: { rejectUnauthorized: false } };
  }
  // Legacy ADO-style: Host=...;Port=...;Database=...;Username=...;Password=...
  const parts = Object.fromEntries(
    raw
      .split(';')
      .filter(Boolean)
      .map((kv) => {
        const i = kv.indexOf('=');
        return [kv.slice(0, i).trim().toLowerCase(), kv.slice(i + 1).trim()];
      })
  );
  return {
    host: parts.host,
    port: Number(parts.port) || 5432,
    database: parts.database || parts['initial catalog'] || 'AFS',
    user: parts.username || parts.user,
    password: parts.password,
    ssl: { rejectUnauthorized: false },
  };
}

const raw = process.env.AZURE_POSTGRES_URL || process.env.DATABASE_URL || '';
if (!raw) {
  console.warn('[afs-api] AZURE_POSTGRES_URL / DATABASE_URL is not set — DB queries will fail');
}

export const pool = new Pool({
  ...buildPoolConfig(raw),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  statement_timeout: 30000,
});

pool.on('error', (err) => {
  console.error('[afs-api] pg pool error:', err.message);
});

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const res = await pool.query(sql, params);
  return res.rows as T[];
}

export async function pingDb(): Promise<{ ok: boolean; db?: string; error?: string }> {
  try {
    const rows = await query<{ db: string }>('SELECT current_database() AS db');
    return { ok: true, db: rows[0]?.db };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
