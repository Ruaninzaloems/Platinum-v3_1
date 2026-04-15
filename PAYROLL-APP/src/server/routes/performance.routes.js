const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { paginationMiddleware } = require('../middleware/validation');
const { auditLog } = require('../middleware/auditLog');
const { query: dbQuery } = require('../config/database');

/**
 * @swagger
 * /api/v1/performance/periods:
 *   get:
 *     summary: List performance assessment periods
 *     tags: [Performance]
 *     responses:
 *       200:
 *         description: List of performance periods
 *
 * /api/v1/performance/indicators:
 *   get:
 *     summary: List performance indicators with filters
 *     tags: [Performance]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - in: query
 *         name: employee_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: period_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of performance indicators
 *   post:
 *     summary: Create performance indicator
 *     tags: [Performance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [period_id, employee_id, kpa, kpi]
 *             properties:
 *               period_id:
 *                 type: integer
 *               employee_id:
 *                 type: integer
 *               kpa:
 *                 type: string
 *               kpi:
 *                 type: string
 *               unit_of_measure:
 *                 type: string
 *               annual_target:
 *                 type: string
 *               weighting:
 *                 type: number
 *     responses:
 *       201:
 *         description: Indicator created
 *
 * /api/v1/performance/indicators/{id}:
 *   get:
 *     summary: Get performance indicator details
 *     tags: [Performance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Indicator details
 *   put:
 *     summary: Update performance indicator (e.g. record actuals)
 *     tags: [Performance]
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
 *         description: Indicator updated
 */

router.get('/periods', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM performance_periods ORDER BY start_date DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/indicators', authenticate, paginationMiddleware, async (req, res, next) => {
  try {
    const { pagination } = req;
    const { employee_id, period_id } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = [];
    let pi = 1;

    if (employee_id) {
      whereClause += ` AND pi.employee_id = $${pi}`;
      params.push(parseInt(employee_id, 10));
      pi++;
    }
    if (period_id) {
      whereClause += ` AND pi.period_id = $${pi}`;
      params.push(parseInt(period_id, 10));
      pi++;
    }

    const countResult = await dbQuery(`SELECT COUNT(*) FROM performance_indicators pi ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await dbQuery(
      `SELECT pi.*, e.first_name, e.surname, e.employee_code, pp.name AS period_name, pp.financial_year
       FROM performance_indicators pi
       JOIN employees e ON pi.employee_id = e.id
       JOIN performance_periods pp ON pi.period_id = pp.id
       ${whereClause}
       ORDER BY pi.created_at DESC
       LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, pagination.limit, pagination.offset]
    );

    res.json({ success: true, data: result.rows, meta: { page: pagination.page, limit: pagination.limit, total, totalPages: Math.ceil(total / pagination.limit) } });
  } catch (err) {
    next(err);
  }
});

router.get('/indicators/:id', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT pi.*, e.first_name, e.surname, e.employee_code, pp.name AS period_name
       FROM performance_indicators pi
       JOIN employees e ON pi.employee_id = e.id
       JOIN performance_periods pp ON pi.period_id = pp.id
       WHERE pi.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Performance indicator not found' } });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.post('/indicators', authenticate, auditLog('CREATE', 'performance_indicator'), async (req, res, next) => {
  try {
    const { period_id, employee_id, kpa, kpi, unit_of_measure, baseline, annual_target, q1_target, q2_target, q3_target, q4_target, weighting } = req.body;
    const result = await dbQuery(
      `INSERT INTO performance_indicators (period_id, employee_id, kpa, kpi, unit_of_measure, baseline, annual_target, q1_target, q2_target, q3_target, q4_target, weighting)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [period_id, employee_id, kpa, kpi, unit_of_measure, baseline, annual_target, q1_target, q2_target, q3_target, q4_target, weighting || 0]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.put('/indicators/:id', authenticate, auditLog('UPDATE', 'performance_indicator'), async (req, res, next) => {
  try {
    const allowedFields = ['kpa','kpi','unit_of_measure','baseline','annual_target','q1_target','q2_target','q3_target','q4_target','q1_actual','q2_actual','q3_actual','q4_actual','weighting','score','status'];
    const updates = {};
    for (const f of allowedFields) {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: { code: 'NO_FIELDS', message: 'No valid fields to update' } });
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
    values.push(req.params.id);
    const result = await dbQuery(
      `UPDATE performance_indicators SET ${setClauses.join(', ')} WHERE id = $${pi} RETURNING *`,
      values
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Performance indicator not found' } });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get('/feedback-360', authenticate, async (req, res, next) => {
  try {
    const { employee_id, status } = req.query;
    let where = 'WHERE 1=1'; const params = []; let pi = 1;
    if (employee_id) { where += ` AND f.employee_id = $${pi}`; params.push(parseInt(employee_id)); pi++; }
    if (status) { where += ` AND f.status = $${pi}`; params.push(status); pi++; }
    const result = await dbQuery(
      `SELECT f.*, e.first_name, e.surname, e.employee_code
       FROM feedback_360 f
       JOIN employees e ON f.employee_id = e.id
       ${where} ORDER BY f.created_at DESC`, params
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/feedback-360', authenticate, auditLog('CREATE', 'feedback_360'), async (req, res, next) => {
  try {
    const { employee_id, period_id } = req.body;
    const result = await dbQuery(
      `INSERT INTO feedback_360 (employee_id, period_id, initiated_by) VALUES ($1,$2,$3) RETURNING *`,
      [employee_id, period_id, req.user?.id || 1]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/feedback-360/:id', authenticate, async (req, res, next) => {
  try {
    const feedback = await dbQuery(
      `SELECT f.*, e.first_name, e.surname FROM feedback_360 f JOIN employees e ON f.employee_id = e.id WHERE f.id = $1`, [req.params.id]
    );
    if (!feedback.rows.length) return res.status(404).json({ success: false, error: { message: 'Feedback not found' } });
    const responses = await dbQuery(
      `SELECT fr.*, e.first_name AS reviewer_first_name, e.surname AS reviewer_surname
       FROM feedback_360_responses fr LEFT JOIN employees e ON fr.reviewer_id = e.id
       WHERE fr.feedback_id = $1 ORDER BY fr.reviewer_type`, [req.params.id]
    );
    res.json({ success: true, data: { ...feedback.rows[0], responses: responses.rows } });
  } catch (err) { next(err); }
});

router.post('/feedback-360/:id/responses', authenticate, auditLog('CREATE', 'feedback_360_response'), async (req, res, next) => {
  try {
    const { reviewer_id, reviewer_type, rating_leadership, rating_communication, rating_teamwork, rating_technical, rating_initiative, strengths, improvements, comments } = req.body;
    const overall = [rating_leadership, rating_communication, rating_teamwork, rating_technical, rating_initiative]
      .filter(r => r != null);
    const overall_rating = overall.length > 0 ? (overall.reduce((a, b) => a + b, 0) / overall.length).toFixed(1) : null;
    const result = await dbQuery(
      `INSERT INTO feedback_360_responses (feedback_id, reviewer_id, reviewer_type, rating_leadership, rating_communication, rating_teamwork, rating_technical, rating_initiative, overall_rating, strengths, improvements, comments, submitted_at, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),'SUBMITTED') RETURNING *`,
      [req.params.id, reviewer_id, reviewer_type, rating_leadership, rating_communication, rating_teamwork, rating_technical, rating_initiative, overall_rating, strengths, improvements, comments]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/feedback-360/:id/complete', authenticate, auditLog('UPDATE', 'feedback_360'), async (req, res, next) => {
  try {
    const responses = await dbQuery(
      `SELECT overall_rating FROM feedback_360_responses WHERE feedback_id = $1 AND status = 'SUBMITTED'`, [req.params.id]
    );
    const ratings = responses.rows.map(r => parseFloat(r.overall_rating)).filter(r => !isNaN(r));
    const overall = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) : null;
    const result = await dbQuery(
      `UPDATE feedback_360 SET status='COMPLETED', overall_score=$1, completed_at=NOW() WHERE id=$2 RETURNING *`,
      [overall, req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/pip', authenticate, async (req, res, next) => {
  try {
    const { employee_id, status } = req.query;
    let where = 'WHERE 1=1'; const params = []; let pi = 1;
    if (employee_id) { where += ` AND pp.employee_id = $${pi}`; params.push(parseInt(employee_id)); pi++; }
    if (status) { where += ` AND pp.status = $${pi}`; params.push(status); pi++; }
    const result = await dbQuery(
      `SELECT pp.*, e.first_name, e.surname, e.employee_code,
              init.first_name AS initiated_first_name, init.surname AS initiated_surname
       FROM pip_plans pp
       JOIN employees e ON pp.employee_id = e.id
       LEFT JOIN employees init ON pp.initiated_by = init.id
       ${where} ORDER BY pp.created_at DESC`, params
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/pip', authenticate, auditLog('CREATE', 'pip_plan'), async (req, res, next) => {
  try {
    const { employee_id, reason, start_date, end_date, review_date } = req.body;
    const result = await dbQuery(
      `INSERT INTO pip_plans (employee_id, initiated_by, reason, start_date, end_date, review_date)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [employee_id, req.user?.id || 1, reason, start_date, end_date, review_date]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/pip/:id', authenticate, async (req, res, next) => {
  try {
    const pip = await dbQuery(
      `SELECT pp.*, e.first_name, e.surname FROM pip_plans pp JOIN employees e ON pp.employee_id = e.id WHERE pp.id = $1`, [req.params.id]
    );
    if (!pip.rows.length) return res.status(404).json({ success: false, error: { message: 'PIP not found' } });
    const milestones = await dbQuery('SELECT * FROM pip_milestones WHERE pip_id = $1 ORDER BY target_date', [req.params.id]);
    res.json({ success: true, data: { ...pip.rows[0], milestones: milestones.rows } });
  } catch (err) { next(err); }
});

router.put('/pip/:id', authenticate, auditLog('UPDATE', 'pip_plan'), async (req, res, next) => {
  try {
    const { status, outcome, outcome_notes, review_date } = req.body;
    const result = await dbQuery(
      `UPDATE pip_plans SET status=$1, outcome=$2, outcome_notes=$3, review_date=$4, updated_at=NOW() WHERE id=$5 RETURNING *`,
      [status, outcome, outcome_notes, review_date, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'PIP not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.post('/pip/:id/milestones', authenticate, auditLog('CREATE', 'pip_milestone'), async (req, res, next) => {
  try {
    const { description, target_date } = req.body;
    const result = await dbQuery(
      `INSERT INTO pip_milestones (pip_id, description, target_date) VALUES ($1,$2,$3) RETURNING *`,
      [req.params.id, description, target_date]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/pip/:pipId/milestones/:id', authenticate, auditLog('UPDATE', 'pip_milestone'), async (req, res, next) => {
  try {
    const { status, progress_notes } = req.body;
    const completedAt = status === 'COMPLETED' ? 'NOW()' : 'NULL';
    const result = await dbQuery(
      `UPDATE pip_milestones SET status=$1, progress_notes=$2, completed_at=${completedAt} WHERE id=$3 AND pip_id=$4 RETURNING *`,
      [status, progress_notes, req.params.id, req.params.pipId]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Milestone not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.post('/reviews', authenticate, auditLog('CREATE', 'performance_review'), async (req, res, next) => {
  try {
    const { employee_id, period_id, reviewer_id, comments } = req.body;
    const result = await dbQuery(
      `INSERT INTO performance_reviews (employee_id, period_id, reviewer_id, comments)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [employee_id, period_id, reviewer_id || req.user?.id || 1, comments]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/reviews/:employeeId', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT pr.*, pp.name AS period_name, pp.financial_year,
              rev.first_name AS reviewer_first_name, rev.surname AS reviewer_surname
       FROM performance_reviews pr
       JOIN performance_periods pp ON pr.period_id = pp.id
       LEFT JOIN employees rev ON pr.reviewer_id = rev.id
       WHERE pr.employee_id = $1
       ORDER BY pr.created_at DESC`,
      [req.params.employeeId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.put('/reviews/:id/submit', authenticate, auditLog('UPDATE', 'performance_review'), async (req, res, next) => {
  try {
    const { items } = req.body;
    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (item.id) {
          await dbQuery(
            `UPDATE performance_review_items SET score=$1, actual=$2, comments=$3 WHERE id=$4 AND review_id=$5`,
            [item.score, item.actual, item.comments, item.id, req.params.id]
          );
        } else {
          await dbQuery(
            `INSERT INTO performance_review_items (review_id, indicator_id, weight, target, actual, score, comments)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [req.params.id, item.indicator_id, item.weight, item.target, item.actual, item.score, item.comments]
          );
        }
      }
    }

    const scores = await dbQuery(
      `SELECT COALESCE(SUM(weight * score) / NULLIF(SUM(weight), 0), 0) AS weighted_score
       FROM performance_review_items WHERE review_id = $1`,
      [req.params.id]
    );
    const overallScore = parseFloat(scores.rows[0].weighted_score || 0).toFixed(2);

    let rating = 'UNRATED';
    if (overallScore >= 4.5) rating = 'OUTSTANDING';
    else if (overallScore >= 3.5) rating = 'EXCEEDS';
    else if (overallScore >= 2.5) rating = 'MEETS';
    else if (overallScore >= 1.5) rating = 'BELOW';
    else if (overallScore > 0) rating = 'UNSATISFACTORY';

    const result = await dbQuery(
      `UPDATE performance_reviews SET status='SUBMITTED', overall_score=$1, rating=$2, reviewed_at=NOW() WHERE id=$3 RETURNING *`,
      [overallScore, rating, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Review not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/reviews/:id/approve', authenticate, auditLog('UPDATE', 'performance_review'), async (req, res, next) => {
  try {
    const { comments } = req.body;
    const existing = await dbQuery('SELECT * FROM performance_reviews WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ success: false, error: { message: 'Review not found' } });
    if (existing.rows[0].status !== 'SUBMITTED') {
      return res.status(400).json({ success: false, error: { message: 'Review must be in SUBMITTED status to approve' } });
    }
    const updateComments = comments ? `${existing.rows[0].comments || ''}\n[Approval]: ${comments}` : existing.rows[0].comments;
    const result = await dbQuery(
      `UPDATE performance_reviews SET status='APPROVED', comments=$1 WHERE id=$2 RETURNING *`,
      [updateComments, req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/scorecard/:employeeId/:periodId', authenticate, async (req, res, next) => {
  try {
    const { employeeId, periodId } = req.params;

    const employee = await dbQuery(
      `SELECT e.id, e.employee_code, e.first_name, e.surname, e.annual_salary,
              p.title AS position_title
       FROM employees e
       LEFT JOIN positions p ON e.position_id = p.id
       WHERE e.id = $1`,
      [employeeId]
    );
    if (!employee.rows.length) return res.status(404).json({ success: false, error: { message: 'Employee not found' } });

    const review = await dbQuery(
      `SELECT pr.*, pp.name AS period_name, pp.financial_year
       FROM performance_reviews pr
       JOIN performance_periods pp ON pr.period_id = pp.id
       WHERE pr.employee_id = $1 AND pr.period_id = $2
       ORDER BY pr.created_at DESC LIMIT 1`,
      [employeeId, periodId]
    );

    const indicators = await dbQuery(
      `SELECT pi.id, pi.kpa, pi.kpi, pi.unit_of_measure, pi.weighting, pi.annual_target,
              pi.q1_target, pi.q2_target, pi.q3_target, pi.q4_target,
              pi.q1_actual, pi.q2_actual, pi.q3_actual, pi.q4_actual,
              pi.score, pi.status
       FROM performance_indicators pi
       WHERE pi.employee_id = $1 AND pi.period_id = $2
       ORDER BY pi.kpa, pi.kpi`,
      [employeeId, periodId]
    );

    let reviewItems = [];
    if (review.rows.length) {
      const items = await dbQuery(
        `SELECT pri.*, pi.kpa, pi.kpi
         FROM performance_review_items pri
         LEFT JOIN performance_indicators pi ON pri.indicator_id = pi.id
         WHERE pri.review_id = $1 ORDER BY pri.id`,
        [review.rows[0].id]
      );
      reviewItems = items.rows;
    }

    const totalWeight = indicators.rows.reduce((sum, i) => sum + parseFloat(i.weighting || 0), 0);
    const weightedScore = indicators.rows.reduce((sum, i) => {
      return sum + (parseFloat(i.weighting || 0) * parseFloat(i.score || 0));
    }, 0);
    const overallScore = totalWeight > 0 ? (weightedScore / totalWeight).toFixed(2) : '0.00';

    res.json({
      success: true,
      data: {
        employee: employee.rows[0],
        review: review.rows[0] || null,
        indicators: indicators.rows,
        review_items: reviewItems,
        summary: {
          total_indicators: indicators.rows.length,
          total_weight: totalWeight,
          overall_score: parseFloat(overallScore),
          completed: indicators.rows.filter(i => i.status === 'COMPLETED').length,
          pending: indicators.rows.filter(i => i.status !== 'COMPLETED').length
        }
      }
    });
  } catch (err) { next(err); }
});

router.get('/goals', authenticate, async (req, res, next) => {
  try {
    const { financial_year, department_id, parent_goal_id } = req.query;
    let where = 'WHERE 1=1'; const params = []; let pi = 1;
    if (financial_year) { where += ` AND pg.financial_year = $${pi}`; params.push(financial_year); pi++; }
    if (department_id) { where += ` AND pg.department_id = $${pi}`; params.push(parseInt(department_id)); pi++; }
    if (parent_goal_id === 'null') { where += ` AND pg.parent_goal_id IS NULL`; }
    else if (parent_goal_id) { where += ` AND pg.parent_goal_id = $${pi}`; params.push(parseInt(parent_goal_id)); pi++; }
    const result = await dbQuery(
      `SELECT pg.*,
              (SELECT COUNT(*) FROM performance_goals c WHERE c.parent_goal_id = pg.id) AS child_count
       FROM performance_goals pg
       ${where} ORDER BY pg.goal_name`,
      params
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/goals', authenticate, auditLog('CREATE', 'performance_goal'), async (req, res, next) => {
  try {
    const { goal_name, description, financial_year, department_id, weight, target_value, parent_goal_id } = req.body;
    const result = await dbQuery(
      `INSERT INTO performance_goals (goal_name, description, financial_year, department_id, weight, target_value, parent_goal_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [goal_name, description, financial_year, department_id, weight, target_value, parent_goal_id]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/goals/:id', authenticate, auditLog('UPDATE', 'performance_goal'), async (req, res, next) => {
  try {
    const { goal_name, description, weight, target_value, status, parent_goal_id } = req.body;
    const result = await dbQuery(
      `UPDATE performance_goals SET goal_name=COALESCE($1, goal_name), description=COALESCE($2, description),
       weight=COALESCE($3, weight), target_value=COALESCE($4, target_value), status=COALESCE($5, status),
       parent_goal_id=COALESCE($6, parent_goal_id) WHERE id=$7 RETURNING *`,
      [goal_name, description, weight, target_value, status, parent_goal_id, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Goal not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/goals/:id/tree', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `WITH RECURSIVE goal_tree AS (
         SELECT id, goal_name, description, financial_year, department_id, weight, target_value, status, parent_goal_id, 0 AS depth
         FROM performance_goals WHERE id = $1
         UNION ALL
         SELECT pg.id, pg.goal_name, pg.description, pg.financial_year, pg.department_id, pg.weight, pg.target_value, pg.status, pg.parent_goal_id, gt.depth + 1
         FROM performance_goals pg
         JOIN goal_tree gt ON pg.parent_goal_id = gt.id
       )
       SELECT gt.*
       FROM goal_tree gt
       ORDER BY gt.depth, gt.goal_name`,
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/goal-alignment', authenticate, async (req, res, next) => {
  try {
    const { period_id } = req.query;
    let periodFilter = '';
    const params = [];
    if (period_id) { periodFilter = 'AND pi.period_id = $1'; params.push(parseInt(period_id)); }
    const result = await dbQuery(
      `SELECT pos.department_id,
              COUNT(pi.id) AS total_indicators,
              COUNT(CASE WHEN pi.status = 'COMPLETED' THEN 1 END) AS completed,
              ROUND(AVG(pi.score) FILTER (WHERE pi.score IS NOT NULL), 2) AS avg_score,
              ROUND(COUNT(CASE WHEN pi.status = 'COMPLETED' THEN 1 END) * 100.0 / NULLIF(COUNT(pi.id), 0), 1) AS completion_rate
       FROM positions pos
       LEFT JOIN employees e ON e.position_id = pos.id AND e.status = 'ACTIVE'
       LEFT JOIN performance_indicators pi ON pi.employee_id = e.id ${periodFilter}
       WHERE pos.department_id IS NOT NULL
       GROUP BY pos.department_id`, params
    );
    const { getDepartments } = require('./department.routes');
    const depts = await getDepartments();
    const deptMap = new Map(depts.map(d => [d.id, d.name]));
    for (const row of result.rows) { row.department_name = deptMap.get(Number(row.department_id)) || null; }
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

module.exports = router;
