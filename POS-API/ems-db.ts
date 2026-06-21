import sql from "mssql";

/**
 * EMS (Azure SQL) connection pool.
 * ─────────────────────────────────
 * Used by the Azure-AD (MSAL) login flow to look up / provision users directly
 * in the EMS database, mirroring the old app's `V2Connection`:
 *
 *   data source=emsfunctions.database.windows.net;initial catalog=ems_v3;
 *   user id=...;password=...
 *
 * Credentials are read from the environment so they never land in source:
 *   EMS_V3_SERVER        (default: emsfunctions.database.windows.net)
 *   EMS_V3_NAME          (default: ems_v3)
 *   EMS_V3_USER          (required)
 *   EMS_V3_PASSWORD      (required)
 *   EMS_V3_PORT          (default: 1433)
 *   EMS_V3_ENCRYPT       ("false" to disable; Azure SQL needs it on — default on)
 *   EMS_V3_TRUST_CERT    ("true" to trust a self-signed cert — on-prem only)
 */
const config: sql.config = {
  server: process.env.EMS_V3_SERVER || "emsfunctions.database.windows.net",
  database: process.env.EMS_V3_NAME || "ems_v3",
  user: process.env.EMS_V3_USER || "",
  password: process.env.EMS_V3_PASSWORD || "",
  port: process.env.EMS_V3_PORT ? parseInt(process.env.EMS_V3_PORT, 10) : 1433,
  options: {
    encrypt: process.env.EMS_V3_ENCRYPT !== "false",
    trustServerCertificate: process.env.EMS_V3_TRUST_CERT === "true",
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  connectionTimeout: 15000,
  requestTimeout: 30000,
};

let poolPromise: Promise<sql.ConnectionPool> | null = null;

/** True once EMS_V3_USER + EMS_V3_PASSWORD are present. */
export function isEmsConfigured(): boolean {
  return !!(config.user && config.password);
}

/**
 * Returns a connected pool, creating it on first use. On connection failure the
 * cached promise is cleared so the next call retries instead of returning a
 * permanently-rejected promise.
 */
export async function getEmsPool(): Promise<sql.ConnectionPool> {
  if (!isEmsConfigured()) {
    throw new Error(
      "EMS database is not configured — set EMS_V3_USER and EMS_V3_PASSWORD.",
    );
  }
  if (!poolPromise) {
    const pool = new sql.ConnectionPool(config);
    poolPromise = pool.connect().catch((err: unknown) => {
      poolPromise = null;
      throw err;
    });
  }
  return poolPromise;
}

/**
 * Tenant (per-database) pools.
 * ────────────────────────────
 * `user_azure_link` lives in ems_v3 (the pool above), but `User_UserDetail`
 * lives in the tenant database named by `user_azure_link.user_db` (e.g. George
 * or Site02), which may be on a completely different SQL server. Configure it
 * independently (all default to the corresponding EMS_V3_* value):
 *   EMS_TENANT_SERVER       host (e.g. 110.238.76.98)
 *   EMS_TENANT_PORT         port (e.g. 3342)
 *   EMS_TENANT_USER         SQL login
 *   EMS_TENANT_PASSWORD     SQL password
 *   EMS_TENANT_ENCRYPT      "false" to disable TLS (System.Data.SqlClient default)
 *   EMS_TENANT_TRUST_CERT   "true" to trust a self-signed cert
 *   EMS_TENANT_NAME         pin a single tenant catalog (e.g. EMS_Training),
 *                           ignoring the user_db label — handy for one-DB testing
 *   EMS_TENANT_DB_MAP       per-tenant catalog map when labels ≠ catalog names,
 *                           e.g. "George=GeorgeDb;Site02=Site02Db"
 */
const tenantPools = new Map<string, Promise<sql.ConnectionPool>>();

function resolveTenantCatalog(userDb: string): string {
  if (process.env.EMS_TENANT_NAME) return process.env.EMS_TENANT_NAME;
  const map = process.env.EMS_TENANT_DB_MAP;
  if (map) {
    for (const pair of map.split(/[;,]/)) {
      const [k, v] = pair.split("=").map((s) => s?.trim());
      if (k && v && k.toLowerCase() === userDb.toLowerCase()) return v;
    }
  }
  return userDb;
}

export async function getTenantPool(userDb: string): Promise<sql.ConnectionPool> {
  const user = process.env.EMS_TENANT_USER || config.user;
  const password = process.env.EMS_TENANT_PASSWORD || config.password;
  if (!user || !password) {
    throw new Error(
      "EMS tenant database is not configured — set EMS_TENANT_USER/EMS_TENANT_PASSWORD (or the EMS_V3_* fallbacks).",
    );
  }

  const database = resolveTenantCatalog(userDb);
  const key = database.toLowerCase();
  let p = tenantPools.get(key);
  if (!p) {
    const tenantConfig: sql.config = {
      ...config,
      database,
      server: process.env.EMS_TENANT_SERVER || config.server,
      port: process.env.EMS_TENANT_PORT
        ? parseInt(process.env.EMS_TENANT_PORT, 10)
        : config.port,
      user,
      password,
      options: {
        ...config.options,
        encrypt: process.env.EMS_TENANT_ENCRYPT
          ? process.env.EMS_TENANT_ENCRYPT !== "false"
          : config.options?.encrypt,
        trustServerCertificate: process.env.EMS_TENANT_TRUST_CERT
          ? process.env.EMS_TENANT_TRUST_CERT === "true"
          : config.options?.trustServerCertificate,
      },
    };
    const pool = new sql.ConnectionPool(tenantConfig);
    p = pool.connect().catch((err: unknown) => {
      tenantPools.delete(key);
      throw err;
    });
    tenantPools.set(key, p);
  }
  return p;
}

export { sql };
