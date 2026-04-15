const { Pool } = require('pg');

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const check = await client.query("SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='trade_classification_groups')");
    if (check.rows[0].exists) {
      await client.query('ALTER TABLE trade_classification_groups RENAME TO const_trade_classification_groups');
      await client.query('ALTER TABLE trade_classification_activities RENAME TO const_trade_classification_activities');
      await client.query('ALTER SEQUENCE trade_classification_groups_id_seq RENAME TO const_trade_classification_groups_id_seq');
      await client.query('ALTER SEQUENCE trade_classification_activities_id_seq RENAME TO const_trade_classification_activities_id_seq');
      console.log('Renamed trade_classification_* tables to const_trade_classification_*');
    } else {
      console.log('Tables already renamed or do not exist, skipping');
    }

    await client.query('COMMIT');
    console.log('Migration 003 complete');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration 003 failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
