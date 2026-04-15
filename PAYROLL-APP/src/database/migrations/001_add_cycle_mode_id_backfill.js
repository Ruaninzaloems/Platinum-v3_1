const XLSX = require('xlsx');
const path = require('path');
const { Pool } = require('pg');

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      ALTER TABLE payroll_periods ADD COLUMN IF NOT EXISTS cycle_mode_id INTEGER DEFAULT 1
    `);

    const excelPath = process.argv[2] || path.resolve(__dirname, '../../../attached_assets/Cycles_1774247754078.xlsx');
    const wb = XLSX.readFile(excelPath);
    const sheet = wb.Sheets['Payroll_CyclePeriodDetails'];
    if (!sheet) throw new Error('Payroll_CyclePeriodDetails sheet not found');

    const data = XLSX.utils.sheet_to_json(sheet);
    let updated = 0;

    for (const r of data) {
      const mode = Number(r.CycleModeID) === 2 ? 2 : 1;
      const result = await client.query(
        'UPDATE payroll_periods SET cycle_mode_id = $1 WHERE id = $2',
        [mode, r.Period_ID]
      );
      if (result.rowCount > 0) updated++;
    }

    await client.query(`UPDATE payroll_periods SET cycle_mode_id = 1 WHERE cycle_mode_id IS NULL`);
    await client.query(`ALTER TABLE payroll_periods ALTER COLUMN cycle_mode_id SET NOT NULL`);
    await client.query(`ALTER TABLE payroll_periods ALTER COLUMN cycle_mode_id SET DEFAULT 1`);

    await client.query('COMMIT');

    const counts = await client.query(
      'SELECT cycle_mode_id, COUNT(*) as cnt FROM payroll_periods GROUP BY cycle_mode_id ORDER BY cycle_mode_id'
    );
    console.log(`Migration complete: updated ${updated} periods`);
    console.log('Counts by cycle_mode_id:', counts.rows);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

if (require.main === module) {
  migrate();
}

module.exports = { migrate };
