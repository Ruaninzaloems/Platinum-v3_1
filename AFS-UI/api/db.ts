import { Pool } from 'pg';

function parseAdoConnString(raw: string): Record<string, string> {
  return Object.fromEntries(
    raw
      .split(';')
      .filter(Boolean)
      .map((kv) => {
        const i = kv.indexOf('=');
        return [kv.slice(0, i).trim().toLowerCase(), kv.slice(i + 1).trim()];
      })
  );
}

const raw = process.env.AZURE_POSTGRES_URL || '';
if (!raw) {
  console.warn('[afs-api] AZURE_POSTGRES_URL is not set — DB queries will fail');
}

const parts = parseAdoConnString(raw);

export const pool = new Pool({
  host: parts.host,
  port: Number(parts.port) || 5432,
  database: process.env.AFS_DB_NAME || 'AFS',
  user: parts.username || parts.user,
  password: parts.password,
  ssl: { rejectUnauthorized: false },
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
