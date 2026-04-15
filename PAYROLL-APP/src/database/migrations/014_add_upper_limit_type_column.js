const { Pool } = require('pg');

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      ALTER TABLE job_profiles
        ADD COLUMN IF NOT EXISTS upper_limit_type VARCHAR(10) DEFAULT 'maximum'
    `);

    await client.query(`
      ALTER TABLE job_profile_history
        ADD COLUMN IF NOT EXISTS upper_limit_type VARCHAR(10)
    `);

    await client.query(`
      UPDATE job_profiles SET upper_limit_type = 'maximum' WHERE upper_limit_type IS NULL
    `);

    await client.query(`
      ALTER TABLE job_profiles
        ADD CONSTRAINT chk_upper_limit_type
        CHECK (upper_limit_type IN ('minimum', 'midpoint', 'maximum'))
        NOT VALID
    `);

    await client.query('COMMIT');
    console.log('Migration 014 complete: added upper_limit_type to job_profiles and job_profile_history');
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.message && err.message.includes('already exists')) {
      console.log('Migration 014: columns/constraint already exist, skipping');
    } else {
      throw err;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => { console.error('Migration 014 failed:', err); process.exit(1); });
