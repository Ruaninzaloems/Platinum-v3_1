const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const PAY_POINTS = [
  { id: 2, code: '1', name: 'Wages - Comm - Streetcleansing', address: '71  York Street George', location: 'Streetcleansing' },
  { id: 3, code: '2', name: 'Salary - Environmental Affairs', address: '71  York Street George', location: 'Environmental Affairs' },
  { id: 4, code: '3', name: 'Salary - Civil Engineering', address: '71  York Street George', location: 'Civil Engineering' },
  { id: 5, code: '4', name: 'Salary - Water Pollution Control', address: '71  York Street George', location: 'Water Pollution' },
  { id: 6, code: '5', name: 'Salary - Planning & Housing', address: '71  York Street George', location: 'Planning & Housing' },
  { id: 7, code: '6', name: 'Salary - Electrotechnical', address: '71  York Street George', location: 'Electrotechnical' },
  { id: 8, code: '7', name: 'Wages - DMA - Uniondale', address: '71  York Street George', location: 'DMA Uniondale' },
  { id: 9, code: '8', name: 'Wages - Comm - Parks', address: '71  York Street George', location: 'Comm - Parks' },
  { id: 10, code: '9', name: 'Wages - Elec', address: '71  York Street George', location: 'Wages - Elec' },
  { id: 11, code: '10', name: 'Wages - Civil -Sewage/Riool', address: '71  York Street George', location: 'Civil -Sewage/Riool' },
  { id: 12, code: '11', name: 'Wages - Civil - Water Distribu', address: '71  York Street George', location: 'Wages - Civil - Water Distribu' },
  { id: 13, code: '12', name: 'Civil -Streets & Storm', address: '71  York Street George', location: 'Streets & Storm' },
  { id: 14, code: '13', name: 'Salary - Corporate Services', address: '71  York Street George', location: 'Corporate Services' },
  { id: 15, code: '14', name: 'Salary - Human Resources', address: '71  York Street George', location: 'Human Resources' },
  { id: 16, code: '15', name: 'Salary - Financial Services', address: '71  York Street George', location: 'Salary - Financial Services' },
  { id: 17, code: '16', name: 'Salary - Temporary Employees', address: '71  York Street George', location: 'Salary - Temporary Employees' },
  { id: 18, code: '17', name: 'Salary - Go George', address: '71  York Street George', location: 'Go George' },
  { id: 19, code: '18', name: 'Wages EPWP', address: '71  York Street George', location: 'EPWP' },
  { id: 20, code: '19', name: 'Wages - Social', address: '71  York Street George', location: 'Social' },
  { id: 21, code: '20', name: 'Wages- DMA - Haarlem', address: '71  York Street George', location: 'DMA - Haarlem' },
  { id: 22, code: '21', name: 'Salary - Registration', address: '71  York Street George', location: 'Registration' },
  { id: 23, code: '22', name: 'Salary - Facility Maintenance', address: '71  York Street George', location: 'Salary - Facility Maintenance' },
  { id: 24, code: '23', name: 'Salary - Legal Services', address: '71  York Street George', location: 'Legal Services' },
  { id: 25, code: '24', name: 'Salary - Community Safety', address: '71  York Street George', location: 'Community Safety' },
  { id: 26, code: '25', name: 'Salary-LED', address: '71  York Street George', location: 'Salary-LED' },
  { id: 27, code: '26', name: 'Salary- Community Development', address: '71  York Street George', location: 'Salary- Community Development' },
  { id: 28, code: '27', name: 'Salary - Libraries', address: '71  York Street George', location: 'Libraries' },
  { id: 29, code: '28', name: 'Salary - Law Enforcement', address: '71  York Street George', location: 'Salary - Law Enforcement' },
  { id: 30, code: '29', name: 'Salary - M/M-Municipal Manager', address: '71  York Street George', location: 'M/M-Municipal Manager' },
  { id: 31, code: '30', name: 'Salary - Vehicle Registration', address: '71  York Street George', location: 'Vehicle Registration' },
  { id: 32, code: '31', name: 'Salary - Uniondale', address: '71  York Street George', location: 'Uniondale' },
  { id: 33, code: '32', name: 'Salary - Tourism', address: '71  York Street George', location: 'Salary - Tourism' },
  { id: 34, code: '33', name: 'Salary - Transfer Station', address: '71  York Street George', location: 'Transfer Station' },
  { id: 35, code: '34', name: 'Salary - Elec Workshop/Fleet', address: '71  York Street George', location: 'Salary - Elec Workshop/Fleet' },
  { id: 36, code: '35', name: 'Salary - Water Purification', address: '71  York Street George', location: 'Salary - Water Purification' },
  { id: 37, code: '36', name: 'Salary - Fire Department', address: '71  York Street George', location: 'Fire Department' },
  { id: 38, code: '37', name: 'Salary - Security', address: '71  York Street George', location: 'Security' },
  { id: 39, code: '38', name: 'Salary - CCTV', address: '71  York Street George', location: 'CCTV' },
  { id: 40, code: '39', name: 'Salary - Councillors', address: '71  York Street George', location: 'Councillors' },
  { id: 41, code: '40', name: 'Salary - Pensioenarisse', address: '71  York Street George', location: 'Pensioenarisse' },
  { id: 42, code: '41', name: 'Wages - Civil, Street, Storm', address: '71  York Street George', location: 'Location' },
];

async function up() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM pay_point_departments');
    await client.query('DELETE FROM pay_points');

    for (const pp of PAY_POINTS) {
      await client.query(
        `INSERT INTO pay_points (id, code, name, address, location, enabled)
         VALUES ($1, $2, $3, $4, $5, TRUE)`,
        [pp.id, pp.code, pp.name, pp.address, pp.location]
      );
    }

    await client.query(`SELECT setval('pay_points_id_seq', (SELECT COALESCE(MAX(id), 1) FROM pay_points))`);

    const orphaned = await client.query(`SELECT COUNT(*) FROM employees WHERE pay_point_id IS NOT NULL AND pay_point_id NOT IN (SELECT id FROM pay_points)`);
    if (parseInt(orphaned.rows[0].count) > 0) {
      console.log(`Nulling ${orphaned.rows[0].count} employee(s) with orphaned pay_point_id references`);
      await client.query(`UPDATE employees SET pay_point_id = NULL WHERE pay_point_id IS NOT NULL AND pay_point_id NOT IN (SELECT id FROM pay_points)`);
    }

    await client.query('COMMIT');
    console.log(`Imported ${PAY_POINTS.length} pay points from Platinum (IDs 2-42)`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { up };
