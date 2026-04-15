const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');
const { query: dbQuery } = require('../config/database');

router.get('/courses', authenticate, async (req, res, next) => {
  try {
    const { category, active } = req.query;
    let where = 'WHERE 1=1'; const params = []; let pi = 1;
    if (category) { where += ` AND category = $${pi}`; params.push(category); pi++; }
    if (active !== undefined) { where += ` AND active = $${pi}`; params.push(active === 'true'); pi++; }
    const result = await dbQuery(`SELECT * FROM training_courses ${where} ORDER BY title`, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/courses', authenticate, auditLog('CREATE', 'training_course'), async (req, res, next) => {
  try {
    const { course_code, title, provider, duration_days, cost, category, nqf_level, credits, seta } = req.body;
    const result = await dbQuery(
      `INSERT INTO training_courses (course_code, title, provider, duration_days, cost, category, nqf_level, credits, seta)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [course_code, title, provider, duration_days, cost, category, nqf_level, credits, seta || 'LGSETA']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/courses/:id', authenticate, auditLog('UPDATE', 'training_course'), async (req, res, next) => {
  try {
    const { title, provider, duration_days, cost, category, nqf_level, credits, active } = req.body;
    const result = await dbQuery(
      `UPDATE training_courses SET title=$1, provider=$2, duration_days=$3, cost=$4, category=$5, nqf_level=$6, credits=$7, active=$8 WHERE id=$9 RETURNING *`,
      [title, provider, duration_days, cost, category, nqf_level, credits, active, req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/qualifications/:employeeId', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM employee_qualifications WHERE employee_id = $1 ORDER BY year_obtained DESC', [req.params.employeeId]);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/qualifications', authenticate, auditLog('CREATE', 'qualification'), async (req, res, next) => {
  try {
    const { employee_id, qualification_name, institution, year_obtained, nqf_level, qualification_type } = req.body;
    const result = await dbQuery(
      `INSERT INTO employee_qualifications (employee_id, qualification_name, institution, year_obtained, nqf_level, qualification_type)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [employee_id, qualification_name, institution, year_obtained, nqf_level, qualification_type]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/qualifications/:id', authenticate, auditLog('UPDATE', 'qualification'), async (req, res, next) => {
  try {
    const { employee_id, qualification_name, institution, year_obtained, nqf_level, qualification_type, reference_number } = req.body;
    const result = await dbQuery(
      `UPDATE employee_qualifications SET employee_id=$1, qualification_name=$2, institution=$3, year_obtained=$4, nqf_level=$5, qualification_type=$6, reference_number=$7 WHERE id=$8 RETURNING *`,
      [employee_id, qualification_name, institution, year_obtained, nqf_level, qualification_type, reference_number || null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Qualification not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/records', authenticate, async (req, res, next) => {
  try {
    const { employee_id, course_id, wsp_year } = req.query;
    let where = 'WHERE 1=1'; const params = []; let pi = 1;
    if (employee_id) { where += ` AND tr.employee_id = $${pi}`; params.push(parseInt(employee_id)); pi++; }
    if (course_id) { where += ` AND tr.course_id = $${pi}`; params.push(parseInt(course_id)); pi++; }
    if (wsp_year) { where += ` AND tr.wsp_year = $${pi}`; params.push(parseInt(wsp_year)); pi++; }
    const result = await dbQuery(
      `SELECT tr.*, e.employee_code, e.first_name, e.surname, tc.title AS course_title, tc.provider, tc.category
       FROM training_records tr
       JOIN employees e ON tr.employee_id = e.id
       JOIN training_courses tc ON tr.course_id = tc.id
       ${where} ORDER BY tr.start_date DESC`, params
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/records', authenticate, auditLog('CREATE', 'training_record'), async (req, res, next) => {
  try {
    const { employee_id, course_id, start_date, end_date, cost_actual, wsp_year } = req.body;
    const result = await dbQuery(
      `INSERT INTO training_records (employee_id, course_id, start_date, end_date, cost_actual, wsp_year)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [employee_id, course_id, start_date, end_date, cost_actual, wsp_year]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/records/:id', authenticate, async (req, res, next) => {
  try {
    const { status, result: trainResult, score, certificate_number } = req.body;
    const result = await dbQuery(
      `UPDATE training_records SET status=$1, result=$2, score=$3, certificate_number=$4 WHERE id=$5 RETURNING *`,
      [status, trainResult, score, certificate_number, req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/wsp-summary/:year', authenticate, async (req, res, next) => {
  try {
    const year = parseInt(req.params.year);
    const planned = await dbQuery(
      `SELECT tc.category, COUNT(*) AS planned_count, COALESCE(SUM(tc.cost), 0) AS planned_cost
       FROM training_records tr JOIN training_courses tc ON tr.course_id = tc.id
       WHERE tr.wsp_year = $1 GROUP BY tc.category`, [year]
    );
    const completed = await dbQuery(
      `SELECT tc.category, COUNT(*) AS completed_count, COALESCE(SUM(tr.cost_actual), 0) AS actual_cost
       FROM training_records tr JOIN training_courses tc ON tr.course_id = tc.id
       WHERE tr.wsp_year = $1 AND tr.status = 'COMPLETED' GROUP BY tc.category`, [year]
    );
    const totals = await dbQuery(
      `SELECT COUNT(*) AS total_records,
              COUNT(*) FILTER (WHERE tr.status = 'COMPLETED') AS completed_count,
              COUNT(*) FILTER (WHERE tr.status = 'IN_PROGRESS') AS in_progress_count,
              COUNT(*) FILTER (WHERE tr.status = 'ENROLLED') AS enrolled_count,
              COALESCE(SUM(tc.cost), 0) AS budget_allocated,
              COALESCE(SUM(tr.cost_actual), 0) AS budget_spent
       FROM training_records tr JOIN training_courses tc ON tr.course_id = tc.id
       WHERE tr.wsp_year = $1`, [year]
    );
    const nqf = await dbQuery(
      `SELECT tc.nqf_level, COUNT(*) AS count
       FROM training_records tr JOIN training_courses tc ON tr.course_id = tc.id
       WHERE tr.wsp_year = $1 AND tc.nqf_level IS NOT NULL
       GROUP BY tc.nqf_level ORDER BY tc.nqf_level`, [year]
    );
    res.json({ success: true, data: {
      year,
      planned: planned.rows,
      completed: completed.rows,
      totals: totals.rows[0] || { total_records: 0, completed_count: 0, in_progress_count: 0, enrolled_count: 0, budget_allocated: 0, budget_spent: 0 },
      nqf_distribution: nqf.rows
    }});
  } catch (err) { next(err); }
});

router.get('/competencies', authenticate, async (req, res, next) => {
  try {
    const { category } = req.query;
    let where = 'WHERE 1=1'; const params = []; let pi = 1;
    if (category) { where += ` AND c.category = $${pi}`; params.push(category); pi++; }
    const result = await dbQuery(
      `SELECT c.*,
              (SELECT json_agg(json_build_object('id', cl.id, 'level', cl.level, 'description', cl.description) ORDER BY cl.level)
               FROM competency_levels cl WHERE cl.competency_id = c.id) AS levels
       FROM competencies c ${where} ORDER BY c.category, c.name`,
      params
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/competencies', authenticate, auditLog('CREATE', 'competency'), async (req, res, next) => {
  try {
    const { name, category, description, levels } = req.body;
    const result = await dbQuery(
      `INSERT INTO competencies (name, category, description) VALUES ($1,$2,$3) RETURNING *`,
      [name, category, description]
    );
    const competency = result.rows[0];
    if (levels && Array.isArray(levels)) {
      for (const lvl of levels) {
        await dbQuery(
          `INSERT INTO competency_levels (competency_id, level, description) VALUES ($1,$2,$3)`,
          [competency.id, lvl.level, lvl.description]
        );
      }
    }
    const full = await dbQuery(
      `SELECT c.*,
              (SELECT json_agg(json_build_object('id', cl.id, 'level', cl.level, 'description', cl.description) ORDER BY cl.level)
               FROM competency_levels cl WHERE cl.competency_id = c.id) AS levels
       FROM competencies c WHERE c.id = $1`,
      [competency.id]
    );
    res.status(201).json({ success: true, data: full.rows[0] });
  } catch (err) { next(err); }
});

router.put('/competencies/:id', authenticate, auditLog('UPDATE', 'competency'), async (req, res, next) => {
  try {
    const { name, category, description, levels } = req.body;
    const result = await dbQuery(
      `UPDATE competencies SET name=COALESCE($1, name), category=COALESCE($2, category), description=COALESCE($3, description) WHERE id=$4 RETURNING *`,
      [name, category, description, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Competency not found' } });
    if (levels && Array.isArray(levels)) {
      await dbQuery('DELETE FROM competency_levels WHERE competency_id = $1', [req.params.id]);
      for (const lvl of levels) {
        await dbQuery(
          `INSERT INTO competency_levels (competency_id, level, description) VALUES ($1,$2,$3)`,
          [req.params.id, lvl.level, lvl.description]
        );
      }
    }
    const full = await dbQuery(
      `SELECT c.*,
              (SELECT json_agg(json_build_object('id', cl.id, 'level', cl.level, 'description', cl.description) ORDER BY cl.level)
               FROM competency_levels cl WHERE cl.competency_id = c.id) AS levels
       FROM competencies c WHERE c.id = $1`,
      [req.params.id]
    );
    res.json({ success: true, data: full.rows[0] });
  } catch (err) { next(err); }
});

router.post('/employee-competencies', authenticate, auditLog('CREATE', 'employee_competency'), async (req, res, next) => {
  try {
    const { employee_id, competency_id, assessed_level, assessed_date } = req.body;
    const result = await dbQuery(
      `INSERT INTO employee_competencies (employee_id, competency_id, assessed_level, assessed_date, assessed_by)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (employee_id, competency_id) DO UPDATE SET assessed_level=$3, assessed_date=$4, assessed_by=$5
       RETURNING *`,
      [employee_id, competency_id, assessed_level, assessed_date || new Date().toISOString().split('T')[0], req.user?.id || 1]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '42P10' || err.message?.includes('ON CONFLICT')) {
      const existing = await dbQuery(
        `SELECT id FROM employee_competencies WHERE employee_id = $1 AND competency_id = $2`,
        [req.body.employee_id, req.body.competency_id]
      );
      if (existing.rows.length) {
        const result = await dbQuery(
          `UPDATE employee_competencies SET assessed_level=$1, assessed_date=$2, assessed_by=$3 WHERE id=$4 RETURNING *`,
          [req.body.assessed_level, req.body.assessed_date || new Date().toISOString().split('T')[0], req.user?.id || 1, existing.rows[0].id]
        );
        return res.json({ success: true, data: result.rows[0] });
      }
    }
    next(err);
  }
});

router.get('/gap-analysis/:employeeId', authenticate, async (req, res, next) => {
  try {
    const employeeId = parseInt(req.params.employeeId);
    const employee = await dbQuery(
      `SELECT e.id, e.employee_code, e.first_name, e.surname, e.position_id,
              p.title AS position_title
       FROM employees e
       LEFT JOIN positions p ON e.position_id = p.id
       WHERE e.id = $1`,
      [employeeId]
    );
    if (!employee.rows.length) return res.status(404).json({ success: false, error: { message: 'Employee not found' } });

    const positionId = employee.rows[0].position_id;

    const gaps = await dbQuery(
      `SELECT c.id AS competency_id, c.name AS competency_name, c.category,
              pc.required_level,
              COALESCE(ec.assessed_level, 0) AS assessed_level,
              (pc.required_level - COALESCE(ec.assessed_level, 0)) AS gap,
              ec.assessed_date
       FROM position_competencies pc
       JOIN competencies c ON pc.competency_id = c.id
       LEFT JOIN employee_competencies ec ON ec.competency_id = c.id AND ec.employee_id = $1
       WHERE pc.position_id = $2
       ORDER BY (pc.required_level - COALESCE(ec.assessed_level, 0)) DESC, c.category, c.name`,
      [employeeId, positionId]
    );

    const additionalCompetencies = await dbQuery(
      `SELECT c.id AS competency_id, c.name AS competency_name, c.category, ec.assessed_level, ec.assessed_date
       FROM employee_competencies ec
       JOIN competencies c ON ec.competency_id = c.id
       WHERE ec.employee_id = $1
         AND ec.competency_id NOT IN (SELECT competency_id FROM position_competencies WHERE position_id = $2)
       ORDER BY c.category, c.name`,
      [employeeId, positionId]
    );

    const totalRequired = gaps.rows.length;
    const met = gaps.rows.filter(g => parseInt(g.gap) <= 0).length;
    const belowRequired = gaps.rows.filter(g => parseInt(g.gap) > 0).length;

    res.json({
      success: true,
      data: {
        employee: employee.rows[0],
        gaps: gaps.rows,
        additional_competencies: additionalCompetencies.rows,
        summary: {
          total_required: totalRequired,
          met: met,
          below_required: belowRequired,
          readiness_percentage: totalRequired > 0 ? parseFloat(((met / totalRequired) * 100).toFixed(1)) : 100
        }
      }
    });
  } catch (err) { next(err); }
});

router.get('/training-calendar/:year/:month', authenticate, async (req, res, next) => {
  try {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const result = await dbQuery(
      `SELECT tr.id, tr.start_date, tr.end_date, tr.status,
              tc.title AS course_title, tc.provider, tc.category, tc.duration_days,
              e.employee_code, e.first_name, e.surname
       FROM training_records tr
       JOIN training_courses tc ON tr.course_id = tc.id
       JOIN employees e ON tr.employee_id = e.id
       LEFT JOIN positions p ON e.position_id = p.id
       WHERE (tr.start_date <= $2 AND tr.end_date >= $1)
          OR (tr.start_date BETWEEN $1 AND $2)
       ORDER BY tr.start_date, tc.title`,
      [startDate, endDate]
    );

    res.json({ success: true, data: { year, month, events: result.rows } });
  } catch (err) { next(err); }
});

router.delete('/courses/:id', authenticate, auditLog('DELETE', 'training_course'), async (req, res, next) => {
  try {
    const result = await dbQuery('DELETE FROM training_courses WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Course not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/qualifications/:id', authenticate, auditLog('DELETE', 'qualification'), async (req, res, next) => {
  try {
    const result = await dbQuery('DELETE FROM employee_qualifications WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Qualification not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/records/:id', authenticate, auditLog('DELETE', 'training_record'), async (req, res, next) => {
  try {
    const result = await dbQuery('DELETE FROM training_records WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Record not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/competencies/:id', authenticate, auditLog('DELETE', 'competency'), async (req, res, next) => {
  try {
    await dbQuery('DELETE FROM competency_levels WHERE competency_id = $1', [req.params.id]);
    const result = await dbQuery('DELETE FROM competencies WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Competency not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
