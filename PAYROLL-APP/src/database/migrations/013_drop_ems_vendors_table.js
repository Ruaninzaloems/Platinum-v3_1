const { getClient } = require('../../server/config/database');

async function run() {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    console.log('Dropping FK constraints referencing ems_vendors...');
    await client.query('ALTER TABLE medical_aid_schemes DROP CONSTRAINT IF EXISTS medical_aid_schemes_vendor_id_fkey');
    await client.query('ALTER TABLE retirement_fund_types DROP CONSTRAINT IF EXISTS retirement_fund_types_vendor_id_fkey');
    await client.query('ALTER TABLE trade_unions DROP CONSTRAINT IF EXISTS trade_unions_vendor_id_fkey');
    console.log('  3 FK constraints dropped');

    console.log('Dropping ems_vendors table...');
    await client.query('DROP TABLE IF EXISTS ems_vendors');
    console.log('  ems_vendors table dropped');

    await client.query('COMMIT');
    console.log('Migration 013 completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration 013 failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

run().then(() => process.exit(0)).catch(() => process.exit(1));
