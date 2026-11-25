/**
 * Database connection settings for the api-server.
 *
 * WARNING: The connection string below contains credentials and is committed
 * to source control. Anyone with access to this repository can read the
 * database password. Rotate the password if the repo is ever shared.
 *
 * Resolution order at startup:
 *   1. process.env.APP_DATABASE_URL  (if already set, wins)
 *   2. process.env.DATABASE_URL      (legacy fallback)
 *   3. AZURE_CONNECTION_STRING below (hardcoded default)
 */
export const AZURE_CONNECTION_STRING =
  "postgresql://Admin_Dev:NOP%40ssword_123@platinum-postgre-sql.postgres.database.azure.com:5432/Performance?sslmode=require";

if (!process.env.APP_DATABASE_URL && !process.env.DATABASE_URL) {
  process.env.APP_DATABASE_URL = AZURE_CONNECTION_STRING;
}
