const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { paginationMiddleware } = require('../middleware/validation');
const { auditLog } = require('../middleware/auditLog');
const { query: dbQuery } = require('../config/database');
const { createNotification } = require('../services/notification.service');
const { enrichDeptDiv, enrichSingle } = require('./department.routes');

/**
 * @swagger
 * /api/v1/positions:
 *   get:
 *     summary: List positions with department and grade details
 *     tags: [Positions]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - in: query
 *         name: department_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [VACANT, FILLED, FROZEN, ABOLISHED]
 *     responses:
 *       200:
 *         description: List of positions
 *   post:
 *     summary: Create a position in the staff establishment
 *     tags: [Positions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [position_code, title, department_id]
 *             properties:
 *               position_code:
 *                 type: string
 *               title:
 *                 type: string
 *               department_id:
 *                 type: integer
 *               division_id:
 *                 type: integer
 *               job_profile_id:
 *                 type: integer
 *               task_grade_id:
 *                 type: integer
 *               employee_type_id:
 *                 type: integer
 *               funded:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Position created
 *
 * /api/v1/positions/{id}:
 *   get:
 *     summary: Get position details with incumbent
 *     tags: [Positions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Position details
 *   put:
 *     summary: Update position
 *     tags: [Positions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Position updated
 *
 * /api/v1/positions/job-profiles:
 *   get:
 *     summary: List all job profiles
 *     tags: [Positions]
 *     responses:
 *       200:
 *         description: List of job profiles
 *
 * /api/v1/positions/task-grades:
 *   get:
 *     summary: List TASK grades with notches
 *     tags: [Positions]
 *     responses:
 *       200:
 *         description: List of TASK grades
 *
 * /api/v1/positions/task-grades/{id}/notches:
 *   get:
 *     summary: Get notches for a TASK grade
 *     tags: [Positions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notch values for the grade
 *
 * /api/v1/positions/organogram:
 *   get:
 *     summary: Get organisational structure (organogram) hierarchy
 *     tags: [Positions]
 *     parameters:
 *       - in: query
 *         name: department_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Hierarchical position structure
 */

const JP_SELECT_COLS = `jp.*,
  tg.grade_code, tg.grade_name,
  et.name AS employee_type_name,
  es.name AS employee_subtype_name,
  cos.name AS condition_of_service_name,
  stg.name AS salary_transaction_group_name, stg.code AS salary_transaction_group_code,
  sul.municipal_grading AS upper_limit_grading, sul.minimum_value AS upper_limit_min,
  sul.midpoint_value AS upper_limit_mid, sul.maximum_value AS upper_limit_max,
  sul_es.name AS upper_limit_subtype_name,
  jf.name AS job_family_name,
  wa.name AS work_area_name,
  ec.name AS employment_category_name,
  ecd.name AS employment_code_name,
  ws.name AS shift_name,
  omg.name AS ofo_major_group_name,
  osmg.name AS ofo_sub_major_group_name,
  omig.name AS ofo_minor_group_name,
  oug.name AS ofo_unit_group_name,
  oo.name AS ofo_occupation_name,
  osp.name AS specialist_name`;

const JP_FROM_JOINS = `FROM job_profiles jp
LEFT JOIN task_grades tg ON jp.task_grade_id = tg.id
LEFT JOIN employee_types et ON jp.employee_type_id = et.id
LEFT JOIN employee_subtypes es ON jp.employee_subtype_id = es.id
LEFT JOIN conditions_of_service cos ON jp.condition_of_service_id = cos.id
LEFT JOIN salary_transaction_groups stg ON jp.salary_transaction_group_id = stg.id
LEFT JOIN salary_upper_limits sul ON jp.upper_limit_id = sul.id
LEFT JOIN employee_subtypes sul_es ON sul.employee_subtype_id = sul_es.id
LEFT JOIN job_families jf ON jp.job_family_id = jf.id
LEFT JOIN const_work_areas wa ON jp.work_area_id = wa.id
LEFT JOIN const_employment_categories ec ON jp.employment_category_id = ec.id
LEFT JOIN const_employment_codes ecd ON jp.employment_code_id = ecd.id
LEFT JOIN work_shifts ws ON jp.shift_id = ws.id
LEFT JOIN const_ofo_major_groups omg ON jp.ofo_major_group_id = omg.id
LEFT JOIN const_ofo_sub_major_groups osmg ON jp.ofo_sub_major_group_id = osmg.id
LEFT JOIN const_ofo_minor_groups omig ON jp.ofo_minor_group_id = omig.id
LEFT JOIN const_ofo_unit_groups oug ON jp.ofo_unit_group_id = oug.id
LEFT JOIN const_ofo_occupations oo ON jp.ofo_occupation_id = oo.id
LEFT JOIN const_ofo_specialists osp ON jp.specialist_id = osp.id`;

const JPH_SNAPSHOT_COLS = [
  'job_title','ofo_code','occupation','job_family_id','job_purpose','job_responsibility',
  'reports_to_description','who_reports_to_position','who_are_peers',
  'qualifications_required','experience_required','knowledge','skills',
  'liaison_internal','internal_communication_purpose','liaison_external','external_communication_purpose',
  'own_decision_making','superior_decision_making',
  'can_draft_policies','can_escalate','can_approve','description','contractual_agreements','expenditure',
  'preceding_questions','problem_solving','financial','planning','short_term','med_term','long_term',
  'amount','ofo_major_group_id','ofo_sub_major_group_id','ofo_minor_group_id','ofo_unit_group_id',
  'ofo_occupation_id','specialist_id','core_function','employment_category_id','employment_code_id',
  'work_area_id','no_of_positions','office_bound','employee_type_id','employee_subtype_id',
  'task_grade_id','salary_transaction_group_id','shift_id','allow_overtime','department_id','division_id',
  'recommended_contractor_rate','scoa_costing_percentage','start_date','end_date',
  'parent_id','reports_to_job_profile_id','status','job_description_code','upper_limit_id',
  'performance_assessment','is_active','enabled','condition_of_service_id','upper_limit_type'
];

async function snapshotJobProfileHistory(profileId, changeType, userId) {
  const current = await dbQuery('SELECT * FROM job_profiles WHERE id = $1', [profileId]);
  if (!current.rows.length) return;
  const row = current.rows[0];
  const cols = ['job_profile_id', ...JPH_SNAPSHOT_COLS, 'captured_at', 'captured_by', 'change_type'];
  const vals = [profileId, ...JPH_SNAPSHOT_COLS.map(c => row[c] ?? null), new Date(), userId || null, changeType];
  const placeholders = vals.map((_, i) => `$${i + 1}`).join(',');
  await dbQuery(`INSERT INTO job_profile_history (${cols.join(',')}) VALUES (${placeholders})`, vals);
}

const JP_FIELDS = [
  'job_title','ofo_code','occupation','job_family_id','job_purpose','job_responsibility',
  'reports_to_job_profile_id','reports_to_description','who_reports_to_position','who_are_peers',
  'qualifications_required','experience_required','knowledge','skills',
  'liaison_internal','internal_communication_purpose','liaison_external','external_communication_purpose',
  'own_decision_making','superior_decision_making',
  'can_draft_policies','can_escalate','can_approve','description','contractual_agreements','expenditure',
  'preceding_questions','problem_solving','financial','planning','short_term','med_term','long_term',
  'amount','task_grade_id','employee_type_id','employee_subtype_id','condition_of_service_id',
  'salary_transaction_group_id','allow_overtime','performance_assessment',
  'start_date','end_date','job_description_code',
  'ofo_major_group_id','ofo_sub_major_group_id','ofo_minor_group_id','ofo_unit_group_id',
  'ofo_occupation_id','specialist_id',
  'employment_category_id','employment_code_id','work_area_id',
  'core_function','no_of_positions','office_bound',
  'shift_id','department_id','division_id',
  'recommended_contractor_rate','scoa_costing_percentage',
  'parent_id','status','upper_limit_id','upper_limit_type','is_active'
];

function extractJPValues(body, userId) {
  const b = body;
  return JP_FIELDS.map(f => {
    const v = b[f];
    if (f === 'can_draft_policies' || f === 'can_escalate' || f === 'can_approve' ||
        f === 'contractual_agreements' || f === 'expenditure' || f === 'core_function' ||
        f === 'office_bound' || f === 'allow_overtime' || f === 'performance_assessment' ||
        f === 'is_active') return v === true || v === 'true' || v === 1;
    if (v === '' || v === undefined) return null;
    return v;
  }).concat([userId || null]);
}

router.get('/job-profiles', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT ${JP_SELECT_COLS},
       (SELECT COUNT(*) FROM positions p WHERE p.job_profile_id = jp.id AND p.enabled = TRUE) AS position_count
       ${JP_FROM_JOINS}
       WHERE jp.enabled = TRUE
       ORDER BY jp.job_title`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/job-profiles/:id', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT ${JP_SELECT_COLS} ${JP_FROM_JOINS} WHERE jp.id = $1`, [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Job profile not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.post('/job-profiles', authenticate, async (req, res, next) => {
  try {
    if (!req.body.job_title) return res.status(400).json({ success: false, error: { message: 'Job title is required' } });
    const placeholders = JP_FIELDS.map((_, i) => `$${i+1}`).join(',');
    const createdByIdx = JP_FIELDS.length + 1;
    const result = await dbQuery(
      `INSERT INTO job_profiles (${JP_FIELDS.join(',')}, created_by)
       VALUES (${placeholders}, $${createdByIdx}) RETURNING *`,
      extractJPValues(req.body, req.user?.id)
    );
    await snapshotJobProfileHistory(result.rows[0].id, 'CREATE', req.user?.id);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/job-profiles/:id', authenticate, async (req, res, next) => {
  try {
    if (!req.body.job_title) return res.status(400).json({ success: false, error: { message: 'Job title is required' } });
    const profileId = parseInt(req.params.id);
    const newStartDate = req.body.start_date || null;

    const hasHistory = await dbQuery('SELECT COUNT(*) FROM job_profile_history WHERE job_profile_id = $1', [profileId]);
    if (parseInt(hasHistory.rows[0].count) === 0) {
      await snapshotJobProfileHistory(profileId, 'CREATE', req.user?.id);
    }

    if (newStartDate) {
      const prev = new Date(newStartDate);
      prev.setDate(prev.getDate() - 1);
      const prevEndDate = prev.toISOString().slice(0, 10);
      await dbQuery(
        `UPDATE job_profile_history SET end_date = $1
         WHERE job_profile_id = $2 AND id = (
           SELECT id FROM job_profile_history WHERE job_profile_id = $2 ORDER BY captured_at DESC LIMIT 1
         )`,
        [prevEndDate, profileId]
      );
    }

    const sets = JP_FIELDS.map((f, i) => `${f}=$${i+1}`).join(',');
    const enabledIdx = JP_FIELDS.length + 1;
    const userIdx = JP_FIELDS.length + 2;
    const idIdx = JP_FIELDS.length + 3;
    const vals = extractJPValues(req.body, null);
    vals.pop();
    const enabledVal = typeof req.body.enabled === 'boolean' ? req.body.enabled : null;
    vals.push(enabledVal, req.user?.id || null, profileId);
    const result = await dbQuery(
      `UPDATE job_profiles SET ${sets},
        enabled=COALESCE($${enabledIdx}, enabled), updated_at=NOW(), updated_by=$${userIdx}
       WHERE id=$${idIdx} RETURNING *`,
      vals
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Job profile not found' } });

    await snapshotJobProfileHistory(profileId, 'UPDATE', req.user?.id);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/job-profiles/:id', authenticate, async (req, res, next) => {
  try {
    const linked = await dbQuery('SELECT COUNT(*) FROM positions WHERE job_profile_id = $1 AND enabled = TRUE', [req.params.id]);
    if (parseInt(linked.rows[0].count) > 0) {
      return res.status(400).json({ success: false, error: { message: `Cannot delete: ${linked.rows[0].count} active position(s) are linked to this job profile` } });
    }
    await dbQuery('UPDATE job_profiles SET enabled = FALSE, is_active = FALSE, updated_at = NOW() WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Job profile disabled' });
  } catch (err) { next(err); }
});

router.get('/job-profiles/:id/duties', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      'SELECT * FROM job_profile_duties WHERE job_profile_id = $1 ORDER BY sequence, id',
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/job-profiles/:id/duties', authenticate, async (req, res, next) => {
  try {
    const { duty_description, sequence, is_active } = req.body;
    if (!duty_description) return res.status(400).json({ success: false, error: { message: 'Duty description is required' } });
    const result = await dbQuery(
      'INSERT INTO job_profile_duties (job_profile_id, duty_description, sequence, is_active) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.params.id, duty_description, sequence || 0, is_active !== false]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/job-profiles/:profileId/duties/:dutyId', authenticate, async (req, res, next) => {
  try {
    const { duty_description, sequence, is_active } = req.body;
    const result = await dbQuery(
      'UPDATE job_profile_duties SET duty_description = COALESCE($1, duty_description), sequence = COALESCE($2, sequence), is_active = COALESCE($3, is_active), updated_at = NOW() WHERE id = $4 AND job_profile_id = $5 RETURNING *',
      [duty_description, sequence, is_active, req.params.dutyId, req.params.profileId]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Duty not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/job-profiles/:profileId/duties/:dutyId', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      'DELETE FROM job_profile_duties WHERE id = $1 AND job_profile_id = $2 RETURNING id',
      [req.params.dutyId, req.params.profileId]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Duty not found' } });
    res.json({ success: true, message: 'Duty deleted' });
  } catch (err) { next(err); }
});

router.get('/job-profiles/:id/history', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT jph.*, et.name AS employee_type_name, es.name AS employee_subtype_name, tg.grade_name
       FROM job_profile_history jph
       LEFT JOIN employee_types et ON jph.employee_type_id = et.id
       LEFT JOIN employee_subtypes es ON jph.employee_subtype_id = es.id
       LEFT JOIN task_grades tg ON jph.task_grade_id = tg.id
       WHERE jph.job_profile_id = $1
       ORDER BY jph.captured_at DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/job-profiles/:id/linked-positions', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT p.id, p.position_code, p.title, p.status, p.funded, p.capacity,
              tg.grade_code, tg.grade_name,
              e.id AS employee_id, e.first_name, e.surname, e.employee_code
       FROM positions p
      
       LEFT JOIN task_grades tg ON p.task_grade_id = tg.id
       LEFT JOIN employees e ON e.position_id = p.id AND e.status = 'ACTIVE'
       WHERE p.job_profile_id = $1 AND p.enabled = TRUE
       ORDER BY p.position_code`,
      [req.params.id]
    );
    await enrichDeptDiv(result.rows);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/job-profiles/import', authenticate, async (req, res, next) => {
  try {
    const { profiles } = req.body;
    if (!Array.isArray(profiles) || profiles.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'profiles array is required' } });
    }
    const results = { imported: 0, errors: [] };
    for (const p of profiles) {
      try {
        if (!p.job_title) { results.errors.push({ id: p.source_id, error: 'Missing job_title' }); continue; }
        const placeholders = JP_FIELDS.map((_, i) => `$${i+1}`).join(',');
        const createdByIdx = JP_FIELDS.length + 1;
        await dbQuery(
          `INSERT INTO job_profiles (${JP_FIELDS.join(',')}, created_by)
           VALUES (${placeholders}, $${createdByIdx})`,
          extractJPValues(p, req.user?.id)
        );
        results.imported++;
      } catch (e) {
        results.errors.push({ id: p.source_id || p.job_title, error: e.message });
      }
    }
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

router.get('/job-profiles/lookups/all', authenticate, async (req, res, next) => {
  try {
    const [jf, ec, ecd, wa, omg, osmg, omig, oug, oo, osp] = await Promise.all([
      dbQuery('SELECT id, code, name FROM job_families WHERE enabled = TRUE ORDER BY name'),
      dbQuery('SELECT id, code, name FROM const_employment_categories WHERE enabled = TRUE ORDER BY name'),
      dbQuery('SELECT id, code, name FROM const_employment_codes WHERE enabled = TRUE ORDER BY name'),
      dbQuery('SELECT id, code, name FROM const_work_areas WHERE enabled = TRUE ORDER BY name'),
      dbQuery('SELECT id, code, name FROM const_ofo_major_groups WHERE enabled = TRUE ORDER BY id'),
      dbQuery('SELECT id, code, name, major_group_id FROM const_ofo_sub_major_groups WHERE enabled = TRUE ORDER BY id'),
      dbQuery('SELECT id, code, name, sub_major_group_id FROM const_ofo_minor_groups WHERE enabled = TRUE ORDER BY id'),
      dbQuery('SELECT id, code, name, minor_group_id FROM const_ofo_unit_groups WHERE enabled = TRUE ORDER BY id'),
      dbQuery('SELECT id, code, name, unit_group_id FROM const_ofo_occupations WHERE enabled = TRUE ORDER BY id'),
      dbQuery('SELECT id, code, name, occupation_id FROM const_ofo_specialists WHERE enabled = TRUE ORDER BY id'),
    ]);
    res.json({
      success: true,
      data: {
        job_families: jf.rows,
        employment_categories: ec.rows,
        employment_codes: ecd.rows,
        work_areas: wa.rows,
        ofo_major_groups: omg.rows,
        ofo_sub_major_groups: osmg.rows,
        ofo_minor_groups: omig.rows,
        ofo_unit_groups: oug.rows,
        ofo_occupations: oo.rows,
        ofo_specialists: osp.rows,
      }
    });
  } catch (err) { next(err); }
});

router.get('/task-grades', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT tg.*, COUNT(tgn.id) AS notch_count_actual
       FROM task_grades tg
       LEFT JOIN task_grade_notches tgn ON tgn.task_grade_id = tg.id
       WHERE tg.enabled = TRUE AND tg.end_date >= CURRENT_DATE
       GROUP BY tg.id
       ORDER BY tg.grade_code`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/task-grades/:id/notches', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      'SELECT * FROM task_grade_notches WHERE task_grade_id = $1 AND end_date >= CURRENT_DATE ORDER BY notch_number',
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/organogram', authenticate, async (req, res, next) => {
  try {
    const { department_id } = req.query;
    let whereClause = 'WHERE p.enabled = TRUE';
    const params = [];
    if (department_id) {
      whereClause += ' AND p.department_id = $1';
      params.push(parseInt(department_id, 10));
    }
    const result = await dbQuery(
      `SELECT p.id, p.position_code, p.title, p.status, p.parent_position_id,
              p.department_id,
              p.division_id,
              p.is_hod, p.funded, p.capacity,
              tg.grade_code, tg.grade_name,
              jp.job_title AS profile_title,
              e.id AS employee_id, e.first_name, e.surname, e.employee_code,
              e.email_address, e.cell_number, e.photo_url, e.joining_date,
              e.annual_salary, e.gender, e.race
       FROM positions p
      
       LEFT JOIN task_grades tg ON p.task_grade_id = tg.id
       LEFT JOIN job_profiles jp ON p.job_profile_id = jp.id
       LEFT JOIN employees e ON e.position_id = p.id AND e.status = 'ACTIVE'
       ${whereClause}
       ORDER BY p.parent_position_id NULLS FIRST, p.title`,
      params
    );

    await enrichDeptDiv(result.rows);
    const data = result.rows;
    const stats = {
      total: data.length,
      filled: data.filter(p => p.status === 'FILLED').length,
      vacant: data.filter(p => p.status === 'VACANT').length,
      frozen: data.filter(p => p.status === 'FROZEN').length,
      abolished: data.filter(p => p.status === 'ABOLISHED').length,
      funded: data.filter(p => p.funded).length,
      unfunded: data.filter(p => !p.funded).length,
      hod_count: data.filter(p => p.is_hod).length,
      departments: [...new Set(data.map(p => p.department_name).filter(Boolean))].length,
    };

    res.json({ success: true, data, stats });
  } catch (err) {
    next(err);
  }
});

router.get('/vacant', authenticate, async (req, res, next) => {
  try {
    const { department_id } = req.query;
    let where = 'WHERE p.status = \'VACANT\' AND p.enabled = TRUE';
    const params = [];
    let pi = 1;
    if (department_id) {
      where += ` AND p.department_id = $${pi}`;
      params.push(parseInt(department_id, 10));
      pi++;
    }
    const result = await dbQuery(
      `SELECT p.id, p.position_code, p.title, p.status, p.funded, p.capacity, p.is_hod,
              p.department_id,
              p.division_id,
              tg.grade_code, tg.grade_name,
              jp.job_title AS profile_title,
              rv.id AS vacancy_id, rv.requisition_number, rv.status AS recruitment_status
       FROM positions p
      
       LEFT JOIN task_grades tg ON p.task_grade_id = tg.id
       LEFT JOIN job_profiles jp ON p.job_profile_id = jp.id
       LEFT JOIN recruitment_vacancies rv ON rv.position_id = p.id AND rv.status NOT IN ('CANCELLED', 'CLOSED')
       ${where}
       ORDER BY p.position_code`,
      params
    );
    await enrichDeptDiv(result.rows);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

const POS_SNAPSHOT_COLS = [
  'position_code','title','department_id','division_id','job_profile_id','parent_position_id',
  'task_grade_id','employee_type_id','employee_subtype_id','condition_of_service_id',
  'status','is_hod','funded','capacity',
  'scoa_item_id','scoa_fund_id','scoa_function_id','scoa_project_id','scoa_region_id','scoa_costing_id',
  'start_date','end_date','enabled','unique_identifier','hierarchy_code','advert_ref','circular_number',
  'non_employee','performance_assessment','lock_fields','salary_transaction_group_id','manager_type','occupational_level_id'
];

async function snapshotPositionHistory(positionId, changeType, userId) {
  const current = await dbQuery(
    `SELECT p.*, e.id AS incumbent_employee_id, 
            CASE WHEN e.id IS NOT NULL THEN e.first_name || ' ' || e.surname ELSE NULL END AS incumbent_name,
            e.employee_code AS incumbent_code,
            tg.grade_name, jp.job_title AS job_profile_title
     FROM positions p
     LEFT JOIN employees e ON e.position_id = p.id AND e.status = 'ACTIVE'
     LEFT JOIN task_grades tg ON p.task_grade_id = tg.id
     LEFT JOIN job_profiles jp ON p.job_profile_id = jp.id
     WHERE p.id = $1`, [positionId]);
  if (!current.rows.length) return;
  const row = current.rows[0];
  const extraCols = ['incumbent_employee_id','incumbent_name','incumbent_code','grade_name','job_profile_title'];
  const allCols = ['position_id', ...POS_SNAPSHOT_COLS, ...extraCols, 'captured_at', 'captured_by', 'change_type'];
  const vals = [positionId, ...POS_SNAPSHOT_COLS.map(c => row[c] ?? null), ...extraCols.map(c => row[c] ?? null), new Date(), userId || null, changeType];
  const ph = vals.map((_, i) => `$${i + 1}`).join(',');
  await dbQuery(`INSERT INTO position_history_snapshots (${allCols.join(',')}) VALUES (${ph})`, vals);
}

router.get('/lookups/positions-all', authenticate, async (req, res, next) => {
  try {
    const { getDivisions } = require('./department.routes');
    const [divisions, jobProfiles, taskGrades, empTypes, empSubtypes, cosItems, salTxnGroups, condService, scoaItems, scoaFunctions] = await Promise.all([
      getDivisions(),
      dbQuery(`SELECT jp.id, jp.job_title, jp.job_description_code, jp.start_date, jp.end_date, jp.employee_type_id, jp.employee_subtype_id, jp.salary_transaction_group_id, jp.condition_of_service_id, jp.task_grade_id, jp.upper_limit_id, jp.performance_assessment,
        sul.minimum_value AS upper_limit_minimum, sul.midpoint_value AS upper_limit_midpoint, sul.maximum_value AS upper_limit_maximum
        FROM job_profiles jp LEFT JOIN salary_upper_limits sul ON jp.upper_limit_id = sul.id WHERE jp.enabled = TRUE ORDER BY jp.job_title`),
      dbQuery('SELECT id, grade_code, grade_name FROM task_grades WHERE enabled = TRUE ORDER BY grade_code'),
      dbQuery('SELECT id, code, name FROM employee_types WHERE enabled = TRUE ORDER BY name'),
      dbQuery('SELECT id, code, name, employee_type_id FROM employee_subtypes WHERE enabled = TRUE ORDER BY name'),
      dbQuery('SELECT id, code, name FROM conditions_of_service WHERE enabled = TRUE ORDER BY name'),
      dbQuery('SELECT id, code, name FROM salary_transaction_groups WHERE enabled = TRUE ORDER BY name'),
      dbQuery('SELECT id, code, name FROM conditions_of_service WHERE enabled = TRUE ORDER BY name'),
      dbQuery("SELECT id, code, description AS name FROM scoa_items WHERE enabled = TRUE ORDER BY code"),
      dbQuery("SELECT id, code, description AS name, parent_code FROM scoa_functions WHERE enabled = TRUE ORDER BY code"),
    ]);
    res.json({
      success: true, data: {
        divisions: divisions, job_profiles: jobProfiles.rows, task_grades: taskGrades.rows,
        employee_types: empTypes.rows, employee_subtypes: empSubtypes.rows,
        conditions_of_service: cosItems.rows, salary_transaction_groups: salTxnGroups.rows,
        scoa_items: scoaItems.rows, scoa_functions: scoaFunctions.rows,
      }
    });
  } catch (err) { next(err); }
});

router.get('/', authenticate, paginationMiddleware, async (req, res, next) => {
  try {
    const { pagination } = req;
    const { department_id, status } = req.query;
    let whereClause = 'WHERE p.enabled = TRUE';
    const params = [];
    let pi = 1;

    if (department_id) {
      whereClause += ` AND p.department_id = $${pi}`;
      params.push(parseInt(department_id, 10));
      pi++;
    }
    if (status) {
      whereClause += ` AND p.status = $${pi}`;
      params.push(status.toUpperCase());
      pi++;
    }

    const countResult = await dbQuery(`SELECT COUNT(*) FROM positions p ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await dbQuery(
      `SELECT p.*, tg.grade_code, tg.grade_name,
              jp.job_title, et.name AS employee_type_name,
              e.id AS incumbent_id, e.first_name AS incumbent_first_name, e.surname AS incumbent_surname
       FROM positions p
       LEFT JOIN task_grades tg ON p.task_grade_id = tg.id
       LEFT JOIN job_profiles jp ON p.job_profile_id = jp.id
       LEFT JOIN employee_types et ON p.employee_type_id = et.id
       LEFT JOIN employees e ON e.position_id = p.id AND e.status = 'ACTIVE'
       ${whereClause}
       ORDER BY p.position_code
       LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, pagination.limit, pagination.offset]
    );

    await enrichDeptDiv(result.rows);
    res.json({
      success: true,
      data: result.rows,
      meta: { page: pagination.page, limit: pagination.limit, total, totalPages: Math.ceil(total / pagination.limit) },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT p.*,
              tg.grade_code, tg.grade_name,
              jp.job_title, jp.job_purpose, jp.qualifications_required, jp.experience_required,
              jp.start_date AS jp_start_date, jp.end_date AS jp_end_date,
              et.name AS employee_type_name, es.name AS employee_subtype_name,
              cos.name AS condition_of_service_name,
              stg.name AS salary_transaction_group_name, stg.code AS salary_transaction_group_code,
              e.id AS incumbent_id, e.first_name AS incumbent_first_name, e.surname AS incumbent_surname, e.employee_code AS incumbent_code
       FROM positions p
       LEFT JOIN task_grades tg ON p.task_grade_id = tg.id
       LEFT JOIN job_profiles jp ON p.job_profile_id = jp.id
       LEFT JOIN employee_types et ON p.employee_type_id = et.id
       LEFT JOIN employee_subtypes es ON p.employee_subtype_id = es.id
       LEFT JOIN conditions_of_service cos ON p.condition_of_service_id = cos.id
       LEFT JOIN salary_transaction_groups stg ON p.salary_transaction_group_id = stg.id
       LEFT JOIN employees e ON e.position_id = p.id AND e.status = 'ACTIVE'
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Position not found' } });
    }
    await enrichSingle(result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, auditLog('CREATE', 'position'), async (req, res, next) => {
  try {
    const {
      position_code, title, department_id, division_id, job_profile_id,
      parent_position_id, task_grade_id, employee_type_id, employee_subtype_id,
      condition_of_service_id, is_hod, funded, capacity,
      scoa_item_id, scoa_fund_id, scoa_function_id, scoa_function_meta, scoa_project_id,
      scoa_region_id, scoa_costing_id, start_date, end_date,
      unique_identifier, hierarchy_code, advert_ref, circular_number,
      non_employee, performance_assessment, lock_fields, salary_transaction_group_id, manager_type,
      upper_limit_value_type
    } = req.body;
    const result = await dbQuery(
      `INSERT INTO positions (
        position_code, title, department_id, division_id, job_profile_id,
        parent_position_id, task_grade_id, employee_type_id, employee_subtype_id,
        condition_of_service_id, is_hod, funded, capacity,
        scoa_item_id, scoa_fund_id, scoa_function_id, scoa_function_meta, scoa_project_id,
        scoa_region_id, scoa_costing_id, start_date, end_date,
        unique_identifier, hierarchy_code, advert_ref, circular_number,
        non_employee, performance_assessment, lock_fields, salary_transaction_group_id, manager_type,
        upper_limit_value_type, created_by, updated_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$33) RETURNING *`,
      [
        position_code, title, department_id, division_id, job_profile_id,
        parent_position_id, task_grade_id, employee_type_id, employee_subtype_id,
        condition_of_service_id, is_hod || false, funded !== false, capacity || 1.00,
        scoa_item_id, scoa_fund_id, scoa_function_id,
        scoa_function_meta ? JSON.stringify(scoa_function_meta) : null, scoa_project_id,
        scoa_region_id, scoa_costing_id, start_date || '1900-01-01', end_date || '9999-12-31',
        unique_identifier || null, hierarchy_code || null, advert_ref || null, circular_number || null,
        non_employee || false, performance_assessment || false, lock_fields || false,
        salary_transaction_group_id || null, manager_type || 0,
        upper_limit_value_type || null,
        req.user?.id || 1
      ]
    );
    await snapshotPositionHistory(result.rows[0].id, 'CREATE', req.user?.id || 1);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, auditLog('UPDATE', 'position'), async (req, res, next) => {
  try {
    const allowedFields = [
      'position_code','title','department_id','division_id','job_profile_id','parent_position_id',
      'task_grade_id','employee_type_id','employee_subtype_id','condition_of_service_id',
      'status','is_hod','funded','capacity',
      'scoa_item_id','scoa_fund_id','scoa_function_id','scoa_function_meta','scoa_project_id','scoa_region_id','scoa_costing_id',
      'start_date','end_date','unique_identifier','hierarchy_code','advert_ref','circular_number',
      'non_employee','performance_assessment','lock_fields','salary_transaction_group_id','manager_type',
      'upper_limit_value_type'
    ];

    const existing = await dbQuery('SELECT * FROM positions WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Position not found' } });
    }
    const oldPos = existing.rows[0];

    const updates = {};
    for (const f of allowedFields) {
      if (req.body[f] !== undefined) {
        if (f === 'scoa_function_meta') {
          updates[f] = req.body[f] ? JSON.stringify(req.body[f]) : null;
        } else {
          updates[f] = req.body[f];
        }
      }
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: { code: 'NO_FIELDS', message: 'No valid fields to update' } });
    }

    const historyInserts = [];
    for (const [field, newVal] of Object.entries(updates)) {
      const oldVal = oldPos[field];
      if (String(oldVal ?? '') !== String(newVal ?? '')) {
        historyInserts.push(
          dbQuery(
            `INSERT INTO position_history (position_id, field_name, old_value, new_value, changed_by, change_reason)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [req.params.id, field, String(oldVal ?? ''), String(newVal ?? ''), req.user?.id || 1, req.body.change_reason || null]
          )
        );
      }
    }

    const setClauses = [];
    const values = [];
    let pi = 1;
    for (const [k, v] of Object.entries(updates)) {
      setClauses.push(`${k} = $${pi}`);
      values.push(v);
      pi++;
    }
    setClauses.push('updated_at = NOW()');
    setClauses.push(`updated_by = $${pi}`);
    values.push(req.user?.id || 1);
    pi++;
    values.push(req.params.id);

    const result = await dbQuery(
      `UPDATE positions SET ${setClauses.join(', ')} WHERE id = $${pi} RETURNING *`,
      values
    );

    await Promise.all(historyInserts);
    await snapshotPositionHistory(req.params.id, 'UPDATE', req.user?.id || 1);

    const updatedPosition = result.rows[0];

    let recruitmentVacancy = null;
    if (updates.status === 'VACANT' && oldPos.status !== 'VACANT') {
      const existingVacancy = await dbQuery(
        `SELECT id, requisition_number, status FROM recruitment_vacancies
         WHERE position_id = $1 AND status NOT IN ('CANCELLED', 'CLOSED')
         LIMIT 1`,
        [req.params.id]
      );
      if (existingVacancy.rows.length > 0) {
        recruitmentVacancy = existingVacancy.rows[0];
      } else {
        const reqNum = `REQ-${Date.now().toString().slice(-6)}`;
        const newVacancy = await dbQuery(
          `INSERT INTO recruitment_vacancies (position_id, requisition_number, title, department_id, created_by)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [req.params.id, reqNum, updatedPosition.title, updatedPosition.department_id, req.user?.id || 1]
        );
        recruitmentVacancy = newVacancy.rows[0];
        await createNotification({
          title: 'Vacancy Created from Organogram',
          message: `Position "${updatedPosition.title}" (${updatedPosition.position_code || req.params.id}) is now vacant. Recruitment vacancy ${reqNum} has been created.`,
          type: 'INFO',
          category: 'RECRUITMENT'
        });
      }
    }

    res.json({ success: true, data: updatedPosition, recruitment_vacancy: recruitmentVacancy });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/competencies', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT pc.id, pc.position_id, pc.competency_id, pc.required_level,
              c.name AS competency_name, c.category, c.description AS competency_description
       FROM position_competencies pc
       JOIN competencies c ON pc.competency_id = c.id
       WHERE pc.position_id = $1
       ORDER BY c.category, c.name`,
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/:id/competencies', authenticate, auditLog('CREATE', 'position_competency'), async (req, res, next) => {
  try {
    const { competency_id, required_level } = req.body;
    const existing = await dbQuery(
      'SELECT id FROM position_competencies WHERE position_id = $1 AND competency_id = $2',
      [req.params.id, competency_id]
    );
    let result;
    if (existing.rows.length) {
      result = await dbQuery(
        'UPDATE position_competencies SET required_level = $1 WHERE id = $2 RETURNING *',
        [required_level, existing.rows[0].id]
      );
    } else {
      result = await dbQuery(
        'INSERT INTO position_competencies (position_id, competency_id, required_level) VALUES ($1,$2,$3) RETURNING *',
        [req.params.id, competency_id, required_level]
      );
    }
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/:id/competencies/:compId', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      'DELETE FROM position_competencies WHERE id = $1 AND position_id = $2 RETURNING id',
      [req.params.compId, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Position competency not found' } });
    res.json({ success: true, message: 'Position competency removed' });
  } catch (err) { next(err); }
});

router.get('/:id/history', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      'SELECT * FROM position_history_snapshots WHERE position_id = $1 ORDER BY captured_at DESC LIMIT 200',
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

module.exports = router;
