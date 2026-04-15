const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const OLD_TO_PLATINUM = {
  10: 2,   // 5 Day Permanent
  11: 6,   // 6 Day Permanent
  12: 7,   // Intern
  13: 8,   // EPWP
  14: 9,   // Temporary 5 day
  15: 10,  // Temporary 6 day
  16: 11,  // Half Day (5/8)
  17: 12,  // Casuals
  18: 20,  // Ward Committee Members
  19: 21,  // Soup Kitchen
  20: 22,  // GIPTN
  21: 3,   // Senior Managers (Excl Municipal Manager)
  26: 19,  // Municipal Manager
  27: 4,   // Councillor
  28: 13,  // Executive Mayor
  29: 14,  // Deputy Mayor
  30: 15,  // Speaker
  31: 16,  // Chief Whip
  32: 17,  // EXCO/MAYCOM Members
  33: 18,  // Section 79 Committee Members
  34: 5,   // Continued member (was Contributing Member)
};

const PLATINUM_DATA = {
  2:  { code: '5DAY_PERM',   name: '5 Day Permanent',                          employee_type_id: 1, apply_bonus: true,  exclude_uif: false, uif_reason_id: null, exclude_sdl: false },
  3:  { code: 'SENIOR_MGR',  name: 'Senior Managers (Excl Municipal Manager)',  employee_type_id: 2, apply_bonus: true,  exclude_uif: false, uif_reason_id: null, exclude_sdl: false },
  4:  { code: 'COUNCILLOR',  name: 'Councillor',                               employee_type_id: 3, apply_bonus: false, exclude_uif: true,  uif_reason_id: 3,    exclude_sdl: false },
  5:  { code: 'CONT_MEMBER', name: 'Continued member',                         employee_type_id: 6, apply_bonus: false, exclude_uif: true,  uif_reason_id: 4,    exclude_sdl: true  },
  6:  { code: '6DAY_PERM',   name: '6 Day Permanent',                          employee_type_id: 1, apply_bonus: true,  exclude_uif: false, uif_reason_id: null, exclude_sdl: false },
  7:  { code: 'INTERN',      name: 'Intern',                                   employee_type_id: 1, apply_bonus: false, exclude_uif: false, uif_reason_id: null, exclude_sdl: false },
  8:  { code: 'EPWP',        name: 'EPWP',                                     employee_type_id: 1, apply_bonus: false, exclude_uif: false, uif_reason_id: null, exclude_sdl: false },
  9:  { code: 'TEMP_5DAY',   name: 'Temporary 5 day',                          employee_type_id: 1, apply_bonus: false, exclude_uif: false, uif_reason_id: null, exclude_sdl: false },
  10: { code: 'TEMP_6DAY',   name: 'Temporary 6 day',                          employee_type_id: 1, apply_bonus: false, exclude_uif: false, uif_reason_id: null, exclude_sdl: false },
  11: { code: 'HALF_DAY',    name: 'Half Day (5/8)',                            employee_type_id: 1, apply_bonus: false, exclude_uif: false, uif_reason_id: null, exclude_sdl: false },
  12: { code: 'CASUALS',     name: 'Casuals',                                  employee_type_id: 1, apply_bonus: false, exclude_uif: false, uif_reason_id: null, exclude_sdl: false },
  13: { code: 'EXEC_MAYOR',  name: 'Executive Mayor',                          employee_type_id: 3, apply_bonus: false, exclude_uif: true,  uif_reason_id: 3,    exclude_sdl: false },
  14: { code: 'DEP_MAYOR',   name: 'Deputy Mayor',                             employee_type_id: 3, apply_bonus: false, exclude_uif: true,  uif_reason_id: 3,    exclude_sdl: false },
  15: { code: 'SPEAKER',     name: 'Speaker',                                  employee_type_id: 3, apply_bonus: false, exclude_uif: true,  uif_reason_id: 3,    exclude_sdl: false },
  16: { code: 'CHIEF_WHIP',  name: 'Chief Whip',                               employee_type_id: 3, apply_bonus: false, exclude_uif: true,  uif_reason_id: 3,    exclude_sdl: false },
  17: { code: 'EXCO_MAYCOM', name: 'EXCO/MAYCOM Members',                      employee_type_id: 3, apply_bonus: false, exclude_uif: true,  uif_reason_id: 3,    exclude_sdl: false },
  18: { code: 'S79_COMM',    name: 'Section 79 Committee Members',             employee_type_id: 3, apply_bonus: false, exclude_uif: true,  uif_reason_id: 3,    exclude_sdl: false },
  19: { code: 'MUNI_MGR',    name: 'Municipal Manager',                        employee_type_id: 2, apply_bonus: true,  exclude_uif: false, uif_reason_id: null, exclude_sdl: false },
  20: { code: 'WARD_COMM',   name: 'Ward Committee Members',                   employee_type_id: 1, apply_bonus: false, exclude_uif: true,  uif_reason_id: 1,    exclude_sdl: true  },
  21: { code: 'SOUP_KITCHEN',name: 'Soup Kitchen',                             employee_type_id: 1, apply_bonus: false, exclude_uif: true,  uif_reason_id: 1,    exclude_sdl: true  },
  22: { code: 'GIPTN',       name: 'GIPTN',                                    employee_type_id: 1, apply_bonus: false, exclude_uif: true,  uif_reason_id: 5,    exclude_sdl: true  },
};

const FK_TABLES = [
  'employees',
  'positions',
  'job_profiles',
  'leave_schemes',
  'salary_upper_limits',
  'job_profile_history',
  'position_history_snapshots',
  'salary_head_formulas',
];

const FK_CONSTRAINTS = [
  { table: 'employees',           constraint: 'employees_employee_subtype_id_fkey' },
  { table: 'job_profiles',        constraint: 'job_profiles_employee_subtype_id_fkey' },
  { table: 'leave_schemes',       constraint: 'leave_schemes_employee_subtype_id_fkey' },
  { table: 'positions',           constraint: 'positions_employee_subtype_id_fkey' },
  { table: 'salary_upper_limits', constraint: 'salary_upper_limits_employee_subtype_id_fkey' },
];

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Step 1: Checking for required columns (apply_bonus, exclude_uif, uif_reason_id, exclude_sdl)...');
    const colCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'employee_subtypes' AND column_name IN ('apply_bonus', 'exclude_uif', 'uif_reason_id', 'exclude_sdl')
    `);
    const existingCols = colCheck.rows.map(r => r.column_name);
    if (!existingCols.includes('apply_bonus')) {
      await client.query(`ALTER TABLE employee_subtypes ADD COLUMN apply_bonus BOOLEAN DEFAULT FALSE`);
      console.log('  Added apply_bonus column');
    }
    if (!existingCols.includes('exclude_uif')) {
      await client.query(`ALTER TABLE employee_subtypes ADD COLUMN exclude_uif BOOLEAN DEFAULT FALSE`);
      console.log('  Added exclude_uif column');
    }
    if (!existingCols.includes('uif_reason_id')) {
      await client.query(`ALTER TABLE employee_subtypes ADD COLUMN uif_reason_id INTEGER`);
      console.log('  Added uif_reason_id column');
    }
    if (!existingCols.includes('exclude_sdl')) {
      await client.query(`ALTER TABLE employee_subtypes ADD COLUMN exclude_sdl BOOLEAN DEFAULT FALSE`);
      console.log('  Added exclude_sdl column');
    }

    console.log('Step 2: Dropping FK constraints...');
    for (const fk of FK_CONSTRAINTS) {
      await client.query(`ALTER TABLE ${fk.table} DROP CONSTRAINT IF EXISTS ${fk.constraint}`);
      console.log(`  Dropped ${fk.constraint}`);
    }

    console.log('Step 3: Removing unique constraint on code temporarily...');
    await client.query(`ALTER TABLE employee_subtypes DROP CONSTRAINT IF EXISTS employee_subtypes_code_key`);

    console.log('Step 4: Pass 1 — Remap old IDs to temp IDs (old + 1000)...');
    const oldIds = Object.keys(OLD_TO_PLATINUM).map(Number);
    for (const oldId of oldIds) {
      const tempId = oldId + 1000;
      await client.query(`UPDATE employee_subtypes SET id = $1 WHERE id = $2`, [tempId, oldId]);
      for (const table of FK_TABLES) {
        await client.query(`UPDATE ${table} SET employee_subtype_id = $1 WHERE employee_subtype_id = $2`, [tempId, oldId]);
      }
    }

    console.log('Step 5: Pass 2 — Remap temp IDs to Platinum IDs...');
    for (const [oldId, platId] of Object.entries(OLD_TO_PLATINUM)) {
      const tempId = Number(oldId) + 1000;
      await client.query(`UPDATE employee_subtypes SET id = $1 WHERE id = $2`, [platId, tempId]);
      for (const table of FK_TABLES) {
        await client.query(`UPDATE ${table} SET employee_subtype_id = $1 WHERE employee_subtype_id = $2`, [platId, tempId]);
      }
    }

    console.log('Step 6: Updating names, codes, employee_type_id, and config flags...');
    for (const [platId, data] of Object.entries(PLATINUM_DATA)) {
      await client.query(
        `UPDATE employee_subtypes SET code = $1, name = $2, employee_type_id = $3, 
         apply_bonus = $4, exclude_uif = $5, uif_reason_id = $6, exclude_sdl = $7
         WHERE id = $8`,
        [data.code, data.name, data.employee_type_id, data.apply_bonus, data.exclude_uif, data.uif_reason_id, data.exclude_sdl, platId]
      );
    }

    console.log('Step 7: Re-adding unique constraint on code...');
    await client.query(`ALTER TABLE employee_subtypes ADD CONSTRAINT employee_subtypes_code_key UNIQUE (code)`);

    console.log('Step 8: Re-adding FK constraints...');
    for (const fk of FK_CONSTRAINTS) {
      await client.query(`ALTER TABLE ${fk.table} ADD CONSTRAINT ${fk.constraint} FOREIGN KEY (employee_subtype_id) REFERENCES employee_subtypes(id)`);
      console.log(`  Added ${fk.constraint}`);
    }

    console.log('Step 9: Resetting sequence...');
    await client.query(`SELECT setval('employee_subtypes_id_seq', (SELECT MAX(id) FROM employee_subtypes))`);

    await client.query('COMMIT');
    console.log('\nMigration complete! Employee subtypes now match Platinum IDs.');

    const verify = await client.query(`SELECT id, code, name, employee_type_id, apply_bonus, exclude_uif, uif_reason_id, exclude_sdl FROM employee_subtypes ORDER BY id`);
    console.log('\nFinal state:');
    console.table(verify.rows);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed, rolled back:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
