const { Pool } = require('pg');

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const checkTypes = await client.query("SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='salary_transaction_types')");
    if (checkTypes.rows[0].exists) {
      await client.query('ALTER TABLE salary_transaction_types RENAME TO const_salary_transaction_types');
      await client.query('ALTER SEQUENCE salary_transaction_types_id_seq RENAME TO const_salary_transaction_types_id_seq');
      await client.query('ALTER TABLE const_salary_transaction_types RENAME CONSTRAINT salary_transaction_types_pkey TO const_salary_transaction_types_pkey');
      await client.query('ALTER TABLE const_salary_transaction_types RENAME CONSTRAINT salary_transaction_types_code_key TO const_salary_transaction_types_code_key');
      console.log('Renamed salary_transaction_types to const_salary_transaction_types');
    } else {
      console.log('salary_transaction_types already renamed or does not exist, skipping');
    }

    const checkMethods = await client.query("SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='salary_calculation_methods')");
    if (checkMethods.rows[0].exists) {
      await client.query('ALTER TABLE salary_calculation_methods RENAME TO const_salary_calculation_methods');
      await client.query('ALTER SEQUENCE salary_calculation_methods_id_seq RENAME TO const_salary_calculation_methods_id_seq');
      await client.query('ALTER TABLE const_salary_calculation_methods RENAME CONSTRAINT salary_calculation_methods_pkey TO const_salary_calculation_methods_pkey');
      await client.query('ALTER TABLE const_salary_calculation_methods RENAME CONSTRAINT salary_calculation_methods_code_key TO const_salary_calculation_methods_code_key');
      console.log('Renamed salary_calculation_methods to const_salary_calculation_methods');
    } else {
      console.log('salary_calculation_methods already renamed or does not exist, skipping');
    }

    await client.query('COMMIT');
    console.log('Migration 009 complete');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration 009 failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
