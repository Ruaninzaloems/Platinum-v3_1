const XLSX = require('xlsx');
const path = require('path');
const { getClient } = require('../server/config/database');

function excelDateToISO(serial) {
  if (!serial || serial === 'NULL') return null;
  if (serial === 2958465) return '9999-12-31';
  const utcDays = Math.floor(serial - 25569);
  const d = new Date(utcDays * 86400 * 1000);
  return d.toISOString().split('T')[0];
}

function deriveGradeCode(name) {
  const m = name.match(/Task Grade\s+(\d+)/i);
  if (m) return 'T' + m[1];
  return name.replace(/\s+/g, '').substring(0, 10).toUpperCase();
}

async function migrate() {
  const xlPath = path.join(__dirname, '..', '..', 'attached_assets', 'Task_Grades_and_Notches_1773555681561.xlsx');
  const wb = XLSX.readFile(xlPath);
  const taskGrades = XLSX.utils.sheet_to_json(wb.Sheets['TaskGrade']);
  const notches = XLSX.utils.sheet_to_json(wb.Sheets['Notch']);

  console.log(`Read ${taskGrades.length} task grades and ${notches.length} notches from Excel`);

  const newGradeIds = new Set(taskGrades.map(tg => tg.TaskGrade_ID));

  const client = await getClient();
  try {
    await client.query('BEGIN');

    console.log('Step 1: Snapshot existing FK references...');
    const empSnapshot = await client.query('SELECT id, task_grade_id, current_notch, annual_salary FROM employees WHERE task_grade_id IS NOT NULL');
    const posSnapshot = await client.query('SELECT id, task_grade_id FROM positions WHERE task_grade_id IS NOT NULL');
    const jpSnapshot = await client.query('SELECT id, task_grade_id FROM job_profiles WHERE task_grade_id IS NOT NULL');
    const siSnapshot = await client.query('SELECT id, task_grade_id FROM salary_increases WHERE task_grade_id IS NOT NULL');

    console.log(`  Snapshotted: ${empSnapshot.rows.length} employees, ${posSnapshot.rows.length} positions, ${jpSnapshot.rows.length} job_profiles, ${siSnapshot.rows.length} salary_increases`);

    console.log('Step 2: Null out FK references...');
    await client.query('UPDATE employees SET task_grade_id = NULL WHERE task_grade_id IS NOT NULL');
    await client.query('UPDATE positions SET task_grade_id = NULL WHERE task_grade_id IS NOT NULL');
    await client.query('UPDATE job_profiles SET task_grade_id = NULL WHERE task_grade_id IS NOT NULL');
    await client.query('UPDATE salary_increases SET task_grade_id = NULL WHERE task_grade_id IS NOT NULL');

    console.log('Step 3: Delete existing data...');
    await client.query('DELETE FROM task_grade_notch_history');
    await client.query('DELETE FROM task_grade_history');
    await client.query('DELETE FROM task_grade_notches');
    await client.query('DELETE FROM task_grades');

    console.log('Step 4: Insert task grades...');
    for (const tg of taskGrades) {
      const gradeCode = deriveGradeCode(tg.TaskGradeName);
      const startDate = excelDateToISO(tg.StartDate);
      const endDate = excelDateToISO(tg.EndDate);
      const excludeFromIncrease = tg.ExcludeFromIncrease === 1 ? true : false;
      const notchCount = notches.filter(n => n.TaskGradeId === tg.TaskGrade_ID).length;

      await client.query(
        `INSERT INTO task_grades (id, grade_code, grade_name, min_salary, max_salary, notch_count, enabled,
         start_date, end_date, is_legacy, to_phase_out, task_skill_level_id, exclude_from_yearly_increase,
         created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())`,
        [
          tg.TaskGrade_ID, gradeCode, tg.TaskGradeName,
          tg.MinSalary, tg.MaxSalary, notchCount, true,
          startDate || '2025-07-01', endDate || '9999-12-31',
          tg.IsSalgacompliant === 1 ? false : true,
          tg.ToPhaseOut === 1 ? true : false,
          tg.SkillLevelId || null, excludeFromIncrease
        ]
      );
    }

    console.log('Step 5: Insert notches...');
    for (const n of notches) {
      const startDate = excelDateToISO(n.StartDate);
      const endDate = excelDateToISO(n.EndDate);

      await client.query(
        `INSERT INTO task_grade_notches (id, task_grade_id, notch_number, min_salary, max_salary, start_date, end_date, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          n.Notch_ID, n.TaskGradeId, n.Notch,
          n.MinimumSalary, n.MaximumSalary,
          startDate || '2025-07-01', endDate || '9999-12-31'
        ]
      );
    }

    console.log('Step 6: Reset sequences...');
    const maxTgId = Math.max(...taskGrades.map(t => t.TaskGrade_ID));
    const maxNotchId = Math.max(...notches.map(n => n.Notch_ID));
    await client.query(`SELECT setval('task_grades_id_seq', $1)`, [maxTgId]);
    await client.query(`SELECT setval('task_grade_notches_id_seq', $1)`, [maxNotchId]);

    console.log('Step 7: Restore FK references where grade IDs still exist...');
    let empRestored = 0, empLost = 0;
    let posRestored = 0, posLost = 0;
    let jpRestored = 0, jpLost = 0;
    let siRestored = 0, siLost = 0;

    for (const row of empSnapshot.rows) {
      if (newGradeIds.has(row.task_grade_id)) {
        await client.query('UPDATE employees SET task_grade_id = $1 WHERE id = $2', [row.task_grade_id, row.id]);
        empRestored++;

        if (row.current_notch) {
          const notch = await client.query(
            'SELECT min_salary FROM task_grade_notches WHERE task_grade_id = $1 AND notch_number = $2',
            [row.task_grade_id, row.current_notch]
          );
          if (notch.rows.length > 0) {
            await client.query('UPDATE employees SET annual_salary = $1 WHERE id = $2', [notch.rows[0].min_salary, row.id]);
          } else {
            const n1 = await client.query(
              'SELECT notch_number, min_salary FROM task_grade_notches WHERE task_grade_id = $1 ORDER BY notch_number LIMIT 1',
              [row.task_grade_id]
            );
            if (n1.rows.length > 0) {
              await client.query('UPDATE employees SET annual_salary = $1, current_notch = $2 WHERE id = $3',
                [n1.rows[0].min_salary, n1.rows[0].notch_number, row.id]);
            }
          }
        }
      } else {
        empLost++;
        console.warn(`  WARNING: Employee ${row.id} had task_grade_id=${row.task_grade_id} which no longer exists`);
      }
    }

    for (const row of posSnapshot.rows) {
      if (newGradeIds.has(row.task_grade_id)) {
        await client.query('UPDATE positions SET task_grade_id = $1 WHERE id = $2', [row.task_grade_id, row.id]);
        posRestored++;
      } else {
        posLost++;
        console.warn(`  WARNING: Position ${row.id} had task_grade_id=${row.task_grade_id} which no longer exists`);
      }
    }

    for (const row of jpSnapshot.rows) {
      if (newGradeIds.has(row.task_grade_id)) {
        await client.query('UPDATE job_profiles SET task_grade_id = $1 WHERE id = $2', [row.task_grade_id, row.id]);
        jpRestored++;
      } else {
        jpLost++;
        console.warn(`  WARNING: Job profile ${row.id} had task_grade_id=${row.task_grade_id} which no longer exists`);
      }
    }

    for (const row of siSnapshot.rows) {
      if (newGradeIds.has(row.task_grade_id)) {
        await client.query('UPDATE salary_increases SET task_grade_id = $1 WHERE id = $2', [row.task_grade_id, row.id]);
        siRestored++;
      } else {
        siLost++;
        console.warn(`  WARNING: Salary increase ${row.id} had task_grade_id=${row.task_grade_id} which no longer exists`);
      }
    }

    console.log(`  Employees: ${empRestored} restored, ${empLost} lost (grade removed)`);
    console.log(`  Positions: ${posRestored} restored, ${posLost} lost (grade removed)`);
    console.log(`  Job profiles: ${jpRestored} restored, ${jpLost} lost (grade removed)`);
    console.log(`  Salary increases: ${siRestored} restored, ${siLost} lost (grade removed)`);

    console.log('Step 8: Post-migration verification...');
    const tgCount = await client.query('SELECT COUNT(*) AS c FROM task_grades');
    const nCount = await client.query('SELECT COUNT(*) AS c FROM task_grade_notches');
    const empGradeCount = await client.query('SELECT COUNT(*) AS c FROM employees WHERE task_grade_id IS NOT NULL');
    const posGradeCount = await client.query('SELECT COUNT(*) AS c FROM positions WHERE task_grade_id IS NOT NULL');
    const jpGradeCount = await client.query('SELECT COUNT(*) AS c FROM job_profiles WHERE task_grade_id IS NOT NULL');
    const orphanEmps = await client.query('SELECT COUNT(*) AS c FROM employees e WHERE e.task_grade_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM task_grades tg WHERE tg.id = e.task_grade_id)');
    const orphanPos = await client.query('SELECT COUNT(*) AS c FROM positions p WHERE p.task_grade_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM task_grades tg WHERE tg.id = p.task_grade_id)');
    const orphanJp = await client.query('SELECT COUNT(*) AS c FROM job_profiles jp WHERE jp.task_grade_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM task_grades tg WHERE tg.id = jp.task_grade_id)');

    const tgOk = parseInt(tgCount.rows[0].c) === 148;
    const nOk = parseInt(nCount.rows[0].c) === 361;
    const noOrphanEmps = parseInt(orphanEmps.rows[0].c) === 0;
    const noOrphanPos = parseInt(orphanPos.rows[0].c) === 0;
    const noOrphanJp = parseInt(orphanJp.rows[0].c) === 0;
    const empRestoredOk = empRestored === empSnapshot.rows.length - empLost;

    console.log(`  Task grades: ${tgCount.rows[0].c} (expected 148) ${tgOk ? 'OK' : 'FAIL'}`);
    console.log(`  Notches: ${nCount.rows[0].c} (expected 361) ${nOk ? 'OK' : 'FAIL'}`);
    console.log(`  Employees with grade: ${empGradeCount.rows[0].c} (${empRestored} restored)`);
    console.log(`  Positions with grade: ${posGradeCount.rows[0].c} (${posRestored} restored)`);
    console.log(`  Job profiles with grade: ${jpGradeCount.rows[0].c} (${jpRestored} restored)`);
    console.log(`  Orphan employee refs: ${orphanEmps.rows[0].c} ${noOrphanEmps ? 'OK' : 'FAIL'}`);
    console.log(`  Orphan position refs: ${orphanPos.rows[0].c} ${noOrphanPos ? 'OK' : 'FAIL'}`);
    console.log(`  Orphan job profile refs: ${orphanJp.rows[0].c} ${noOrphanJp ? 'OK' : 'FAIL'}`);
    console.log(`  Restored employees match: ${empRestoredOk ? 'OK' : 'FAIL'}`);

    if (!tgOk || !nOk || !noOrphanEmps || !noOrphanPos || !noOrphanJp) {
      throw new Error('Post-migration verification failed');
    }

    await client.query('COMMIT');
    console.log('\nMigration completed successfully!');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed, rolled back:', err.message);
    throw err;
  } finally {
    client.release();
  }

  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
