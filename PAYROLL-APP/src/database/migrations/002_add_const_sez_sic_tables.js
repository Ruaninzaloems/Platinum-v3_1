const { Pool } = require('pg');

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS const_sez_codes (
        id INTEGER PRIMARY KEY,
        code VARCHAR(50) NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS const_sic_subclasses (
        id INTEGER PRIMARY KEY,
        description VARCHAR(500) NOT NULL,
        enabled BOOLEAN DEFAULT TRUE,
        class_id INTEGER
      )
    `);

    await client.query(`
      INSERT INTO const_sez_codes (id, code) VALUES (1, 'ZAR')
      ON CONFLICT (id) DO NOTHING
    `);

    await client.query(`
      INSERT INTO const_sic_subclasses (id, description, enabled, class_id) VALUES
        (84111, 'General public administration at National Government level', true, 8411),
        (84112, 'General public administration at Provincial Government level', true, 8411),
        (84113, 'General public administration at Local Government level', true, 8411),
        (84121, 'Regulation of the activities of providing health care, education, cultural services and other social services, excluding social security at National Government level', true, 8412),
        (84122, 'Regulation of the activities of providing health care, education, cultural services and other social services, excluding social security at Provincial Government level', true, 8412),
        (84123, 'Regulation of the activities of providing health care, education, cultural services and other social services, excluding social security at Local Government level', true, 8412),
        (84131, 'Regulation of and contribution to more efficient operation of businesses at National Government level', true, 8413),
        (84132, 'Regulation of and contribution to more efficient operation of businesses at Provincial Government level', true, 8413),
        (84133, 'Regulation of and contribution to more efficient operation of businesses at Local Government level', true, 8413),
        (84140, 'Extra budgetary account n.e.c.', true, 8414),
        (84210, 'Foreign affairs', true, 8421),
        (84220, 'Defence activities', true, 8422),
        (84231, 'Public order and safety activities at National Government level', true, 8423),
        (84232, 'Public order and safety activities at Provincial Government level', true, 8423),
        (84233, 'Public order and safety activities at Local Government level', true, 8423),
        (84300, 'Compulsory social security activities', true, 8430)
      ON CONFLICT (id) DO NOTHING
    `);

    await client.query('COMMIT');
    console.log('Migration 002 complete: const_sez_codes and const_sic_subclasses created and seeded');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration 002 failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
