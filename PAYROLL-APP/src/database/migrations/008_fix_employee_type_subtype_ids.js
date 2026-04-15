const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const FK_TABLES_TYPE = [
  { table: 'employee_subtypes', col: 'employee_type_id' },
  { table: 'employees', col: 'employee_type_id' },
  { table: 'job_profiles', col: 'employee_type_id' },
  { table: 'leave_schemes', col: 'employee_type_id' },
  { table: 'positions', col: 'employee_type_id' },
  { table: 'salary_upper_limits', col: 'employee_type_id' },
  { table: 'upper_limits', col: 'employee_type_id' },
];

const FK_TABLES_SUBTYPE = [
  { table: 'employees', col: 'employee_subtype_id' },
  { table: 'job_profiles', col: 'employee_subtype_id' },
  { table: 'leave_schemes', col: 'employee_subtype_id' },
  { table: 'positions', col: 'employee_subtype_id' },
  { table: 'salary_upper_limits', col: 'employee_subtype_id' },
];

async function remapId(client, tables, col, oldId, tempId) {
  for (const t of tables) {
    await client.query(`UPDATE ${t.table} SET ${col} = $1 WHERE ${col} = $2`, [tempId, oldId]);
  }
}

async function up() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('ALTER TABLE employee_subtypes DROP CONSTRAINT IF EXISTS employee_subtypes_employee_type_id_fkey');
    await client.query('ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_employee_type_id_fkey');
    await client.query('ALTER TABLE job_profiles DROP CONSTRAINT IF EXISTS job_profiles_employee_type_id_fkey');
    await client.query('ALTER TABLE leave_schemes DROP CONSTRAINT IF EXISTS leave_schemes_employee_type_id_fkey');
    await client.query('ALTER TABLE positions DROP CONSTRAINT IF EXISTS positions_employee_type_id_fkey');
    await client.query('ALTER TABLE salary_upper_limits DROP CONSTRAINT IF EXISTS salary_upper_limits_employee_type_id_fkey');
    await client.query('ALTER TABLE upper_limits DROP CONSTRAINT IF EXISTS upper_limits_employee_type_id_fkey');

    await client.query('ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_employee_subtype_id_fkey');
    await client.query('ALTER TABLE job_profiles DROP CONSTRAINT IF EXISTS job_profiles_employee_subtype_id_fkey');
    await client.query('ALTER TABLE leave_schemes DROP CONSTRAINT IF EXISTS leave_schemes_employee_subtype_id_fkey');
    await client.query('ALTER TABLE positions DROP CONSTRAINT IF EXISTS positions_employee_subtype_id_fkey');
    await client.query('ALTER TABLE salary_upper_limits DROP CONSTRAINT IF EXISTS salary_upper_limits_employee_subtype_id_fkey');

    console.log('--- Fixing Employee Types: 5→6, 6→7 ---');
    for (const t of FK_TABLES_TYPE) {
      await client.query(`UPDATE ${t.table} SET ${t.col} = -6 WHERE ${t.col} = 6`);
    }
    await client.query('UPDATE employee_types SET id = -6 WHERE id = 6');

    for (const t of FK_TABLES_TYPE) {
      await client.query(`UPDATE ${t.table} SET ${t.col} = -5 WHERE ${t.col} = 5`);
    }
    await client.query('UPDATE employee_types SET id = -5 WHERE id = 5');

    await client.query('UPDATE employee_types SET id = 6 WHERE id = -5');
    for (const t of FK_TABLES_TYPE) {
      await client.query(`UPDATE ${t.table} SET ${t.col} = 6 WHERE ${t.col} = -5`);
    }

    await client.query('UPDATE employee_types SET id = 7 WHERE id = -6');
    for (const t of FK_TABLES_TYPE) {
      await client.query(`UPDATE ${t.table} SET ${t.col} = 7 WHERE ${t.col} = -6`);
    }

    const typeCheck = await client.query('SELECT id, name FROM employee_types ORDER BY id');
    console.log('Employee types after fix:', typeCheck.rows.map(r => `${r.id}=${r.name}`).join(', '));

    console.log('--- Fixing Employee Subtypes: 12↔19 swap ---');
    for (const t of FK_TABLES_SUBTYPE) {
      await client.query(`UPDATE ${t.table} SET ${t.col} = -12 WHERE ${t.col} = 12`);
    }
    await client.query('UPDATE employee_subtypes SET id = -12 WHERE id = 12');

    for (const t of FK_TABLES_SUBTYPE) {
      await client.query(`UPDATE ${t.table} SET ${t.col} = -19 WHERE ${t.col} = 19`);
    }
    await client.query('UPDATE employee_subtypes SET id = -19 WHERE id = 19');

    await client.query('UPDATE employee_subtypes SET id = 12 WHERE id = -19');
    for (const t of FK_TABLES_SUBTYPE) {
      await client.query(`UPDATE ${t.table} SET ${t.col} = 12 WHERE ${t.col} = -19`);
    }

    await client.query('UPDATE employee_subtypes SET id = 19 WHERE id = -12');
    for (const t of FK_TABLES_SUBTYPE) {
      await client.query(`UPDATE ${t.table} SET ${t.col} = 19 WHERE ${t.col} = -12`);
    }

    const subCheck = await client.query('SELECT id, name, employee_type_id FROM employee_subtypes ORDER BY id');
    console.log('Employee subtypes after fix:');
    subCheck.rows.forEach(r => console.log(`  ${r.id}: ${r.name} (type ${r.employee_type_id})`));

    await client.query(`SELECT setval('employee_types_id_seq', (SELECT COALESCE(MAX(id), 1) FROM employee_types))`);
    await client.query(`SELECT setval('employee_subtypes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM employee_subtypes))`);

    console.log('--- Restoring FK constraints ---');
    await client.query('ALTER TABLE employee_subtypes ADD CONSTRAINT employee_subtypes_employee_type_id_fkey FOREIGN KEY (employee_type_id) REFERENCES employee_types(id)');
    await client.query('ALTER TABLE employees ADD CONSTRAINT employees_employee_type_id_fkey FOREIGN KEY (employee_type_id) REFERENCES employee_types(id)');
    await client.query('ALTER TABLE job_profiles ADD CONSTRAINT job_profiles_employee_type_id_fkey FOREIGN KEY (employee_type_id) REFERENCES employee_types(id)');
    await client.query('ALTER TABLE leave_schemes ADD CONSTRAINT leave_schemes_employee_type_id_fkey FOREIGN KEY (employee_type_id) REFERENCES employee_types(id)');
    await client.query('ALTER TABLE positions ADD CONSTRAINT positions_employee_type_id_fkey FOREIGN KEY (employee_type_id) REFERENCES employee_types(id)');
    await client.query('ALTER TABLE salary_upper_limits ADD CONSTRAINT salary_upper_limits_employee_type_id_fkey FOREIGN KEY (employee_type_id) REFERENCES employee_types(id)');
    await client.query('ALTER TABLE upper_limits ADD CONSTRAINT upper_limits_employee_type_id_fkey FOREIGN KEY (employee_type_id) REFERENCES employee_types(id)');

    await client.query('ALTER TABLE employees ADD CONSTRAINT employees_employee_subtype_id_fkey FOREIGN KEY (employee_subtype_id) REFERENCES employee_subtypes(id)');
    await client.query('ALTER TABLE job_profiles ADD CONSTRAINT job_profiles_employee_subtype_id_fkey FOREIGN KEY (employee_subtype_id) REFERENCES employee_subtypes(id)');
    await client.query('ALTER TABLE leave_schemes ADD CONSTRAINT leave_schemes_employee_subtype_id_fkey FOREIGN KEY (employee_subtype_id) REFERENCES employee_subtypes(id)');
    await client.query('ALTER TABLE positions ADD CONSTRAINT positions_employee_subtype_id_fkey FOREIGN KEY (employee_subtype_id) REFERENCES employee_subtypes(id)');
    await client.query('ALTER TABLE salary_upper_limits ADD CONSTRAINT salary_upper_limits_employee_subtype_id_fkey FOREIGN KEY (employee_subtype_id) REFERENCES employee_subtypes(id)');

    await client.query('COMMIT');
    console.log('Done — Employee type and subtype IDs now match Platinum');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { up };
