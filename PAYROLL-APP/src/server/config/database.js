const { Pool } = require('pg');

const connectionString = process.env.AZURE_DATABASE_URL || process.env.DATABASE_URL;
// Azure PostgreSQL requires SSL; relax cert validation (DigiCert chain not bundled locally).
const isAzure = (connectionString || '').includes('.postgres.database.azure.com');

const pool = new Pool({
  connectionString,
  ssl: isAzure ? { rejectUnauthorized: false } : undefined,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

const query = async (text, params) => {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 1000) {
    console.warn(`Slow query (${duration}ms):`, text.substring(0, 100));
  }
  return result;
};

const getClient = async () => {
  const client = await pool.connect();
  const originalRelease = client.release.bind(client);
  client.release = () => {
    originalRelease();
  };
  return client;
};

const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connected:', result.rows[0].now);
    return true;
  } catch (err) {
    console.error('Database connection failed:', err.message);
    return false;
  }
};

module.exports = { pool, query, getClient, testConnection };
