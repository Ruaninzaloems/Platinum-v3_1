const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function up() {
  await pool.query(`ALTER TABLE salary_upper_limits DROP COLUMN IF EXISTS code`);
  console.log('Dropped code column from salary_upper_limits');
}

async function down() {
  await pool.query(`ALTER TABLE salary_upper_limits ADD COLUMN IF NOT EXISTS code VARCHAR(20)`);
  console.log('Re-added code column to salary_upper_limits');
}

module.exports = { up, down };
