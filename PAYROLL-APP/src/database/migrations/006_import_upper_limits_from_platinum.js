const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const UPPER_LIMITS = [
  { id: 2,  employee_type_id: 2, employee_subtype_id: 12, minimum_value: 2074834, midpoint_value: 2074834, maximum_value: 2074834, start_date: '2026-01-01', end_date: '9999-12-31' },
  { id: 3,  employee_type_id: 2, employee_subtype_id: 3,  minimum_value: 2077380, midpoint_value: 2077380, maximum_value: 2077380, start_date: '2025-08-01', end_date: '9999-12-31' },
  { id: 4,  employee_type_id: 2, employee_subtype_id: 3,  minimum_value: 2077380, midpoint_value: 2077380, maximum_value: 2077380, start_date: '2025-08-01', end_date: '9999-12-31' },
  { id: 5,  employee_type_id: 2, employee_subtype_id: 3,  minimum_value: 2077380, midpoint_value: 2077380, maximum_value: 2077380, start_date: '2025-08-01', end_date: '9999-12-31' },
  { id: 6,  employee_type_id: 2, employee_subtype_id: 3,  minimum_value: 2077380, midpoint_value: 2077380, maximum_value: 2077380, start_date: '2025-08-01', end_date: '9999-12-31' },
  { id: 7,  employee_type_id: 2, employee_subtype_id: 3,  minimum_value: 2077380, midpoint_value: 2077380, maximum_value: 2077380, start_date: '2025-07-01', end_date: '9999-12-31' },
  { id: 8,  employee_type_id: 2, employee_subtype_id: 3,  minimum_value: 1560890, midpoint_value: 1560890, maximum_value: 1560890, start_date: '2026-01-01', end_date: '9999-12-31' },
  { id: 10, employee_type_id: 3, employee_subtype_id: 13, minimum_value: 1230245, midpoint_value: 1230245, maximum_value: 1230245, start_date: '2025-07-01', end_date: '9999-12-31' },
  { id: 11, employee_type_id: 3, employee_subtype_id: 14, minimum_value: 984192,  midpoint_value: 984192,  maximum_value: 984192,  start_date: '2025-07-01', end_date: '9999-12-31' },
  { id: 12, employee_type_id: 3, employee_subtype_id: 15, minimum_value: 984192,  midpoint_value: 984192,  maximum_value: 984192,  start_date: '2025-07-01', end_date: '9999-12-31' },
  { id: 13, employee_type_id: 3, employee_subtype_id: 16, minimum_value: 922683,  midpoint_value: 922683,  maximum_value: 922683,  start_date: '2025-07-01', end_date: '9999-12-31' },
  { id: 14, employee_type_id: 3, employee_subtype_id: 17, minimum_value: 922683,  midpoint_value: 922683,  maximum_value: 922683,  start_date: '2025-07-01', end_date: '9999-12-31' },
  { id: 15, employee_type_id: 3, employee_subtype_id: 17, minimum_value: 895618,  midpoint_value: 895618,  maximum_value: 895618,  start_date: '2025-07-01', end_date: '9999-12-31' },
  { id: 16, employee_type_id: 3, employee_subtype_id: 4,  minimum_value: 388656,  midpoint_value: 388656,  maximum_value: 388656,  start_date: '2025-07-01', end_date: '9999-12-31' },
  { id: 17, employee_type_id: 2, employee_subtype_id: 3,  minimum_value: 1560890, midpoint_value: 1560890, maximum_value: 1560890, start_date: '2026-01-01', end_date: '9999-12-31' },
];

async function up() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const jpRefs = await client.query('SELECT id, upper_limit_id FROM job_profiles WHERE upper_limit_id IS NOT NULL');
    console.log(`Saving ${jpRefs.rows.length} job_profile upper_limit references`);

    await client.query('UPDATE job_profiles SET upper_limit_id = NULL WHERE upper_limit_id IS NOT NULL');

    await client.query('DELETE FROM upper_limit_history');
    await client.query('DELETE FROM salary_upper_limits');

    for (const ul of UPPER_LIMITS) {
      await client.query(
        `INSERT INTO salary_upper_limits (id, employee_type_id, employee_subtype_id, municipal_grading, minimum_value, midpoint_value, maximum_value, start_date, end_date, enabled)
         VALUES ($1, $2, $3, '-', $4, $5, $6, $7, $8, TRUE)`,
        [ul.id, ul.employee_type_id, ul.employee_subtype_id, ul.minimum_value, ul.midpoint_value, ul.maximum_value, ul.start_date, ul.end_date]
      );
    }

    await client.query(`SELECT setval('salary_upper_limits_id_seq', (SELECT COALESCE(MAX(id), 1) FROM salary_upper_limits))`);

    const importedIds = new Set(UPPER_LIMITS.map(u => u.id));
    let restored = 0;
    for (const ref of jpRefs.rows) {
      if (importedIds.has(ref.upper_limit_id)) {
        await client.query('UPDATE job_profiles SET upper_limit_id = $1 WHERE id = $2', [ref.upper_limit_id, ref.id]);
        restored++;
      }
    }
    console.log(`Restored ${restored}/${jpRefs.rows.length} job_profile upper_limit references (orphaned refs nulled)`);

    await client.query('COMMIT');
    console.log(`Imported ${UPPER_LIMITS.length} upper limits from Platinum (IDs 2-17, skipping 9)`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { up };
