const { query: dbQuery, getClient } = require('../config/database');

const POSITION_TITLES_BY_GRADE = {
  1: ['General Worker','Cleaner','Messenger','Garden Worker','Labourer','Refuse Collector','Grounds Keeper'],
  2: ['Driver','Operator','Security Guard','Stores Assistant','Registry Clerk','Tea Person'],
  3: ['Admin Assistant','Data Capturer','Cashier','Receptionist','Library Assistant','Handyman'],
  4: ['Admin Clerk','Senior Operator','Artisan Assistant','Lab Assistant','Meter Reader','Parks Attendant'],
  5: ['Senior Clerk','Secretary','Accounts Clerk','Debtors Clerk','Creditors Clerk','Asset Clerk','SCM Clerk'],
  6: ['Chief Clerk','Technician','Inspector','Foreman','Senior Secretary','Community Dev Worker'],
  7: ['Control Technician','Senior Inspector','Superintendent','Assistant Accountant','HR Clerk','IT Technician'],
  8: ['Senior Technician','Control Inspector','Chief Superintendent','Accountant','HR Practitioner','IT Officer'],
  9: ['Principal Technician','Control Room Supervisor','Professional Officer','Senior Accountant','Senior HR Practitioner'],
  10: ['Assistant Manager','Principal Officer','Specialist','Senior Professional Officer','Control Accountant'],
  11: ['Manager','Engineering Technologist','Town Planner','Senior Specialist','Chief Accountant'],
  12: ['Senior Manager','Principal Engineer','Principal Planner','Chief Information Officer'],
  13: ['Deputy Director','Principal Specialist','Chief Engineer','Head: Legal Services'],
  14: ['Director','Executive Manager','Chief Audit Executive','Chief Operations Officer'],
  15: ['Senior Director','Executive Director','Head of Department','General Manager'],
  16: ['Deputy Municipal Manager','Chief Financial Officer','Executive Director: Infrastructure'],
  17: ['Executive Director: Corporate Services','Executive Director: Community Services'],
  18: ['Deputy City Manager','Chief Financial Officer','Group Head'],
  19: ['Municipal Manager','City Manager','Accounting Officer'],
};

const DEPT_DIVISION_MAP = {
  1: { name: 'Office of the Municipal Manager', divs: [1,2,3] },
  2: { name: 'Budget & Treasury Office', divs: [4,5,6,7] },
  3: { name: 'Corporate Services', divs: [8,9,10,11] },
  4: { name: 'Technical Services', divs: [12,13,14] },
  5: { name: 'Community Services', divs: [15,16,17] },
  6: { name: 'Development Planning', divs: [18,19] },
  7: { name: 'Public Health & Safety', divs: [20,21,22] },
  8: { name: 'Electrical Services', divs: [23,24] },
};

const DEPT_WEIGHTS = [5, 18, 15, 20, 15, 8, 12, 7];

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }
function pickWeighted(items, weights) {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}
function padNum(n, len) { return String(n).padStart(len, '0'); }

async function seedPositions() {
  console.log('Seeding positions for unlinked employees...');
  const startTime = Date.now();

  const emps = await dbQuery(`
    SELECT id, task_grade_id, employee_type_id, employee_subtype_id, condition_of_service_id 
    FROM employees 
    WHERE position_id IS NULL 
    ORDER BY id
  `);

  if (emps.rows.length === 0) {
    console.log('All employees already have positions assigned.');
    process.exit(0);
  }

  console.log(`Found ${emps.rows.length} employees without positions`);

  const maxPosRes = await dbQuery('SELECT COALESCE(MAX(id),0) as m FROM positions');
  let posCounter = parseInt(maxPosRes.rows[0].m);

  const client = await getClient();
  const BATCH_SIZE = 200;

  try {
    await client.query('BEGIN');

    const positionInserts = [];
    const employeeUpdates = [];

    for (const emp of emps.rows) {
      posCounter++;
      const gradeId = emp.task_grade_id || rand(1, 19);
      const titles = POSITION_TITLES_BY_GRADE[gradeId] || POSITION_TITLES_BY_GRADE[5];
      const title = pick(titles);

      const deptId = pickWeighted([1,2,3,4,5,6,7,8], DEPT_WEIGHTS);
      const deptInfo = DEPT_DIVISION_MAP[deptId];
      const divId = deptInfo.divs.length > 0 ? pick(deptInfo.divs) : null;

      const posCode = 'POS' + padNum(posCounter, 5);
      const isHod = gradeId >= 14;

      positionInserts.push([
        posCode, title, deptId, divId, null, null,
        gradeId, emp.employee_type_id, emp.employee_subtype_id, emp.condition_of_service_id,
        'FILLED', isHod, true, 1.00, '2024-01-01'
      ]);

      employeeUpdates.push({ empId: emp.id, posIdx: posCounter });
    }

    console.log(`Inserting ${positionInserts.length} positions...`);

    const allPosIds = [];
    for (let b = 0; b < positionInserts.length; b += BATCH_SIZE) {
      const batch = positionInserts.slice(b, b + BATCH_SIZE);
      const placeholders = [];
      const params = [];
      let pIdx = 1;
      for (const row of batch) {
        const ph = row.map(() => `$${pIdx++}`);
        placeholders.push(`(${ph.join(',')})`);
        params.push(...row);
      }
      const res = await client.query(
        `INSERT INTO positions (
          position_code, title, department_id, division_id, job_profile_id, parent_position_id,
          task_grade_id, employee_type_id, employee_subtype_id, condition_of_service_id,
          status, is_hod, funded, capacity, start_date
        ) VALUES ${placeholders.join(',')} RETURNING id`,
        params
      );
      for (const r of res.rows) allPosIds.push(r.id);

      if ((b + BATCH_SIZE) % 1000 === 0 || b + BATCH_SIZE >= positionInserts.length) {
        console.log(`  Positions: ${Math.min(b + BATCH_SIZE, positionInserts.length)} / ${positionInserts.length}`);
      }
    }

    console.log(`Linking ${emps.rows.length} employees to positions...`);

    for (let b = 0; b < emps.rows.length; b += BATCH_SIZE) {
      const batchEnd = Math.min(b + BATCH_SIZE, emps.rows.length);
      for (let i = b; i < batchEnd; i++) {
        await client.query(
          'UPDATE employees SET position_id = $1 WHERE id = $2',
          [allPosIds[i], emps.rows[i].id]
        );
      }
      if ((b + BATCH_SIZE) % 1000 === 0 || b + BATCH_SIZE >= emps.rows.length) {
        console.log(`  Linked: ${Math.min(b + BATCH_SIZE, emps.rows.length)} / ${emps.rows.length}`);
      }
    }

    await client.query('COMMIT');

    const stats = await dbQuery(`
      SELECT d.name, COUNT(p.id) as pos_count
      FROM positions p 
      JOIN departments d ON p.department_id = d.id
      WHERE p.id > 28
      GROUP BY d.name ORDER BY pos_count DESC
    `);
    const unlinked = await dbQuery('SELECT COUNT(*) as c FROM employees WHERE position_id IS NULL');

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n=== POSITION SEED COMPLETE ===');
    console.log(`Positions created: ${allPosIds.length}`);
    console.log(`Employees still unlinked: ${unlinked.rows[0].c}`);
    console.log(`Time: ${elapsed}s`);
    console.log('\nDepartment distribution:');
    for (const s of stats.rows) {
      console.log(`  ${s.name.padEnd(40)} ${s.pos_count} positions`);
    }

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('SEED FAILED:', err.message);
    throw err;
  } finally {
    client.release();
  }

  process.exit(0);
}

seedPositions().catch(err => {
  console.error(err);
  process.exit(1);
});
