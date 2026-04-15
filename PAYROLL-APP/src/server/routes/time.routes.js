const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { paginationMiddleware } = require('../middleware/validation');
const { auditLog } = require('../middleware/auditLog');
const { query: dbQuery } = require('../config/database');

/**
 * @swagger
 * /api/v1/time/attendance:
 *   get:
 *     summary: List attendance records
 *     tags: [Time & Attendance]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - in: query
 *         name: employee_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Attendance records
 *   post:
 *     summary: Record attendance entry
 *     tags: [Time & Attendance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employee_id, attendance_date]
 *             properties:
 *               employee_id:
 *                 type: integer
 *               attendance_date:
 *                 type: string
 *                 format: date
 *               clock_in:
 *                 type: string
 *                 format: date-time
 *               clock_out:
 *                 type: string
 *                 format: date-time
 *               shift_id:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [PRESENT, ABSENT, LATE, LEAVE, HOLIDAY]
 *     responses:
 *       201:
 *         description: Attendance recorded
 *
 * /api/v1/time/shifts:
 *   get:
 *     summary: List shift definitions
 *     tags: [Time & Attendance]
 *     responses:
 *       200:
 *         description: List of shifts
 *
 * /api/v1/time/overtime:
 *   get:
 *     summary: List overtime transactions
 *     tags: [Time & Attendance]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - in: query
 *         name: employee_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, PAID]
 *     responses:
 *       200:
 *         description: List of overtime transactions
 *   post:
 *     summary: Create overtime transaction
 *     tags: [Time & Attendance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employee_id, salary_head_id, overtime_date, hours]
 *             properties:
 *               employee_id:
 *                 type: integer
 *               salary_head_id:
 *                 type: integer
 *               overtime_date:
 *                 type: string
 *                 format: date
 *               hours:
 *                 type: number
 *               rate_multiplier:
 *                 type: number
 *                 default: 1.5
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Overtime created
 *
 * /api/v1/time/overtime/{id}/approve:
 *   post:
 *     summary: Approve overtime transaction
 *     tags: [Time & Attendance]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Overtime approved
 *
 * /api/v1/time/claims:
 *   get:
 *     summary: List S&T and travel claims
 *     tags: [Time & Attendance]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - in: query
 *         name: employee_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of claims
 *   post:
 *     summary: Submit a claim
 *     tags: [Time & Attendance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employee_id, claim_type, start_date, amount]
 *             properties:
 *               employee_id:
 *                 type: integer
 *               claim_type:
 *                 type: string
 *                 enum: [S_AND_T, TRAVEL, OTHER]
 *               amount:
 *                 type: number
 *               kilometres:
 *                 type: number
 *               start_date:
 *                 type: string
 *                 format: date
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Claim submitted
 *
 * /api/v1/time/instalments:
 *   get:
 *     summary: List employee instalments
 *     tags: [Time & Attendance]
 *     parameters:
 *       - in: query
 *         name: employee_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, COMPLETED, SUSPENDED, CANCELLED]
 *     responses:
 *       200:
 *         description: List of instalments
 *   post:
 *     summary: Create instalment plan for employee
 *     tags: [Time & Attendance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employee_id, salary_head_id, total_amount, monthly_instalment, period_months, start_date]
 *             properties:
 *               employee_id:
 *                 type: integer
 *               salary_head_id:
 *                 type: integer
 *               description:
 *                 type: string
 *               total_amount:
 *                 type: number
 *               monthly_instalment:
 *                 type: number
 *               period_months:
 *                 type: integer
 *               start_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Instalment plan created
 */

router.get('/attendance', authenticate, paginationMiddleware, async (req, res, next) => {
  try {
    const { pagination } = req;
    const { employee_id, date_from, date_to } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = [];
    let pi = 1;

    if (employee_id) {
      whereClause += ` AND ea.employee_id = $${pi}`;
      params.push(parseInt(employee_id, 10));
      pi++;
    }
    if (date_from) {
      whereClause += ` AND ea.attendance_date >= $${pi}`;
      params.push(date_from);
      pi++;
    }
    if (date_to) {
      whereClause += ` AND ea.attendance_date <= $${pi}`;
      params.push(date_to);
      pi++;
    }

    const countResult = await dbQuery(`SELECT COUNT(*) FROM employee_attendance ea ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await dbQuery(
      `SELECT ea.*, e.first_name, e.surname, e.employee_code, ws.name AS shift_name
       FROM employee_attendance ea
       JOIN employees e ON ea.employee_id = e.id
       LEFT JOIN work_shifts ws ON ea.shift_id = ws.id
       ${whereClause}
       ORDER BY ea.attendance_date DESC
       LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, pagination.limit, pagination.offset]
    );

    res.json({ success: true, data: result.rows, meta: { page: pagination.page, limit: pagination.limit, total, totalPages: Math.ceil(total / pagination.limit) } });
  } catch (err) {
    next(err);
  }
});

router.post('/attendance', authenticate, auditLog('CREATE', 'employee_attendance'), async (req, res, next) => {
  try {
    const { employee_id, attendance_date, clock_in, clock_out, shift_id, status, source } = req.body;
    let hours_worked = null;
    if (clock_in && clock_out) {
      hours_worked = ((new Date(clock_out) - new Date(clock_in)) / 3600000).toFixed(2);
    }
    const result = await dbQuery(
      `INSERT INTO employee_attendance (employee_id, attendance_date, clock_in, clock_out, hours_worked, shift_id, status, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [employee_id, attendance_date, clock_in, clock_out, hours_worked, shift_id, status || 'PRESENT', source || 'MANUAL']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get('/shifts', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM work_shifts WHERE enabled = TRUE ORDER BY name');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/overtime', authenticate, paginationMiddleware, async (req, res, next) => {
  try {
    const { pagination } = req;
    const { employee_id, status } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = [];
    let pi = 1;

    if (employee_id) {
      whereClause += ` AND ot.employee_id = $${pi}`;
      params.push(parseInt(employee_id, 10));
      pi++;
    }
    if (status) {
      whereClause += ` AND ot.status = $${pi}`;
      params.push(status.toUpperCase());
      pi++;
    }

    const countResult = await dbQuery(`SELECT COUNT(*) FROM overtime_transactions ot ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await dbQuery(
      `SELECT ot.*, e.first_name, e.surname, e.employee_code, sh.name AS salary_head_name
       FROM overtime_transactions ot
       JOIN employees e ON ot.employee_id = e.id
       JOIN salary_heads sh ON ot.salary_head_id = sh.id
       ${whereClause}
       ORDER BY ot.overtime_date DESC
       LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, pagination.limit, pagination.offset]
    );

    res.json({ success: true, data: result.rows, meta: { page: pagination.page, limit: pagination.limit, total, totalPages: Math.ceil(total / pagination.limit) } });
  } catch (err) {
    next(err);
  }
});

router.post('/overtime', authenticate, auditLog('CREATE', 'overtime_transaction'), async (req, res, next) => {
  try {
    const { employee_id, salary_head_id, overtime_date, hours, rate_multiplier, reason } = req.body;
    const emp = await dbQuery('SELECT annual_salary, working_hours_per_day FROM employees WHERE id = $1', [employee_id]);
    if (emp.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } });
    }
    const hourlyRate = emp.rows[0].annual_salary / 12 / (emp.rows[0].working_hours_per_day * (260 / 12));
    const mult = rate_multiplier || 1.5;
    const amount = parseFloat((hourlyRate * mult * hours).toFixed(2));

    const result = await dbQuery(
      `INSERT INTO overtime_transactions (employee_id, salary_head_id, overtime_date, hours, rate_multiplier, amount, reason, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [employee_id, salary_head_id, overtime_date, hours, mult, amount, reason, req.user?.id || 1]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.post('/overtime/:id/approve', authenticate, auditLog('APPROVE', 'overtime_transaction'), async (req, res, next) => {
  try {
    const result = await dbQuery(
      `UPDATE overtime_transactions SET status = 'APPROVED', approved_by = $1, approved_at = NOW(), updated_at = NOW()
       WHERE id = $2 AND status = 'PENDING' RETURNING *`,
      [req.user?.id || 1, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Overtime cannot be approved from current state' } });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get('/claims', authenticate, paginationMiddleware, async (req, res, next) => {
  try {
    const { pagination } = req;
    const { employee_id, status, claim_type } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = [];
    let pi = 1;
    if (employee_id) {
      whereClause += ` AND c.employee_id = $${pi}`;
      params.push(parseInt(employee_id, 10));
      pi++;
    }
    if (status) {
      whereClause += ` AND c.status = $${pi}`;
      params.push(status);
      pi++;
    }
    if (claim_type) {
      whereClause += ` AND c.claim_type = $${pi}`;
      params.push(claim_type);
      pi++;
    }
    const countResult = await dbQuery(`SELECT COUNT(*) FROM claims c ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);
    const result = await dbQuery(
      `SELECT c.*, e.first_name, e.surname, e.employee_code
       FROM claims c JOIN employees e ON c.employee_id = e.id
       ${whereClause} ORDER BY c.created_at DESC LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, pagination.limit, pagination.offset]
    );
    res.json({ success: true, data: result.rows, meta: { page: pagination.page, limit: pagination.limit, total, totalPages: Math.ceil(total / pagination.limit) } });
  } catch (err) {
    next(err);
  }
});

router.get('/claims/configurations-by-type', authenticate, async (req, res, next) => {
  try {
    const { claim_type } = req.query;
    const typeMap = { 'S_AND_T': 'S & T', 'TRAVEL': 'Travel' };
    let whereClause = 'WHERE 1=1';
    const params = [];
    if (claim_type) {
      const mappedType = typeMap[claim_type] || claim_type;
      whereClause += ` AND cc.claim_type = $1`;
      params.push(mappedType);
    }
    const result = await dbQuery(
      `SELECT cc.*, spr.rate AS sars_rate, spr.description AS sars_description, spr.subtype_index
       FROM claim_configurations cc
       LEFT JOIN sars_prescribed_rates spr ON cc.sars_prescribed_rate_id = spr.id
       ${whereClause}
       AND (cc.end_date IS NULL OR cc.end_date >= CURRENT_DATE)
       ORDER BY cc.claim_type, cc.claim_subtype`,
      params
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/claims', authenticate, auditLog('CREATE', 'claim'), async (req, res, next) => {
  try {
    const { employee_id, claim_type, sub_type, start_date, end_date, amount, kilometres, reason, reference_no } = req.body;
    if (!employee_id || !claim_type || !start_date || !amount) {
      return res.status(400).json({ success: false, error: { message: 'employee_id, claim_type, start_date, and amount are required' } });
    }
    if (claim_type === 'S_AND_T' && end_date && new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ success: false, error: { message: 'End date cannot be before start date' } });
    }
    if (claim_type === 'TRAVEL' && (!kilometres || parseFloat(kilometres) <= 0)) {
      return res.status(400).json({ success: false, error: { message: 'Kilometres must be greater than 0 for Travel claims' } });
    }
    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, error: { message: 'Amount must be greater than 0' } });
    }
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: { message: 'Authentication required' } });

    const result = await dbQuery(
      `INSERT INTO claims (employee_id, claim_type, sub_type, start_date, end_date, amount, kilometres, reason, reference_no, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [employee_id, claim_type, sub_type, start_date, end_date || null, amount, kilometres || null, reason, reference_no || null, userId]
    );

    const { initWorkflow } = require('../services/workflow.service');
    try {
      await initWorkflow('CLAIM', result.rows[0].id, userId);
    } catch (wfErr) {
      console.log('No workflow defined for CLAIM, skipping:', wfErr.message);
    }

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.patch('/claims/:id/approve', authenticate, authorize('admin', 'payroll_admin', 'payroll_officer'), auditLog('UPDATE', 'claim'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: { message: 'Authentication required' } });

    const claim = await dbQuery('SELECT * FROM claims WHERE id = $1', [id]);
    if (!claim.rows.length) return res.status(404).json({ success: false, error: { message: 'Claim not found' } });
    if (claim.rows[0].status !== 'PENDING') return res.status(400).json({ success: false, error: { message: 'Claim is not pending' } });

    const wfInstance = await dbQuery(
      `SELECT wi.id, ws.id as step_id FROM workflow_instances wi
       JOIN workflow_steps ws ON ws.instance_id = wi.id AND ws.status = 'PENDING'
       WHERE wi.entity_type = 'CLAIM' AND wi.entity_id = $1 AND wi.status IN ('PENDING','IN_PROGRESS')
       ORDER BY ws.step_number LIMIT 1`, [id]
    );
    if (wfInstance.rows.length > 0) {
      const { actionStep } = require('../services/workflow.service');
      await actionStep(wfInstance.rows[0].step_id, 'APPROVE', userId, req.body.comments || null);
    }

    const result = await dbQuery(
      `UPDATE claims SET status = 'APPROVED', approved_by = $1, approved_at = NOW(), updated_at = NOW() WHERE id = $2 RETURNING *`,
      [userId, id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.patch('/claims/:id/reject', authenticate, authorize('admin', 'payroll_admin', 'payroll_officer'), auditLog('UPDATE', 'claim'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: { message: 'Authentication required' } });

    const claim = await dbQuery('SELECT * FROM claims WHERE id = $1', [id]);
    if (!claim.rows.length) return res.status(404).json({ success: false, error: { message: 'Claim not found' } });
    if (claim.rows[0].status !== 'PENDING') return res.status(400).json({ success: false, error: { message: 'Claim is not pending' } });

    const wfInstance = await dbQuery(
      `SELECT wi.id, ws.id as step_id FROM workflow_instances wi
       JOIN workflow_steps ws ON ws.instance_id = wi.id AND ws.status = 'PENDING'
       WHERE wi.entity_type = 'CLAIM' AND wi.entity_id = $1 AND wi.status IN ('PENDING','IN_PROGRESS')
       ORDER BY ws.step_number LIMIT 1`, [id]
    );
    if (wfInstance.rows.length > 0) {
      const { actionStep } = require('../services/workflow.service');
      await actionStep(wfInstance.rows[0].step_id, 'REJECT', userId, req.body.comments || null);
    }

    const result = await dbQuery(
      `UPDATE claims SET status = 'REJECTED', approved_by = $1, approved_at = NOW(), updated_at = NOW() WHERE id = $2 RETURNING *`,
      [userId, id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get('/instalments', authenticate, async (req, res, next) => {
  try {
    const { employee_id, status } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = [];
    let pi = 1;
    if (employee_id) {
      whereClause += ` AND i.employee_id = $${pi}`;
      params.push(parseInt(employee_id, 10));
      pi++;
    }
    if (status) {
      whereClause += ` AND i.status = $${pi}`;
      params.push(status.toUpperCase());
      pi++;
    }
    const result = await dbQuery(
      `SELECT i.*, e.first_name, e.surname, e.employee_code, sh.name AS salary_head_name
       FROM instalments i
       JOIN employees e ON i.employee_id = e.id
       JOIN salary_heads sh ON i.salary_head_id = sh.id
       ${whereClause} ORDER BY i.created_at DESC`,
      params
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/instalments', authenticate, auditLog('CREATE', 'instalment'), async (req, res, next) => {
  try {
    const { employee_id, salary_head_id, description, total_amount, monthly_instalment, period_months, start_date, vendor_name, reference_number } = req.body;
    const result = await dbQuery(
      `INSERT INTO instalments (employee_id, salary_head_id, description, total_amount, monthly_instalment, period_months, balance, start_date, vendor_name, reference_number, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$4,$7,$8,$9,$10) RETURNING *`,
      [employee_id, salary_head_id, description, total_amount, monthly_instalment, period_months, start_date, vendor_name, reference_number, req.user?.id || 1]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get('/bcea-rate', authenticate, async (req, res, next) => {
  try {
    const { employee_id, overtime_type } = req.query;
    const emp = await dbQuery('SELECT annual_salary FROM employees WHERE id = $1', [employee_id]);
    if (!emp.rows.length) return res.status(404).json({ success: false, error: { message: 'Employee not found' } });

    const annual = parseFloat(emp.rows[0].annual_salary);
    const monthlyHours = 173.33;
    const hourlyRate = annual / 12 / monthlyHours;

    const rates = {
      WEEKDAY: { multiplier: 1.5, label: 'Weekday OT (1.5x)' },
      SUNDAY: { multiplier: 2.0, label: 'Sunday/Public Holiday (2x)' },
      NIGHT: { multiplier: 1.1, label: 'Night Shift (1.1x)' },
    };

    const type = rates[overtime_type] || rates.WEEKDAY;
    res.json({
      success: true,
      data: {
        hourly_rate: Math.round(hourlyRate * 100) / 100,
        overtime_rate: Math.round(hourlyRate * type.multiplier * 100) / 100,
        multiplier: type.multiplier,
        label: type.label,
      }
    });
  } catch (err) { next(err); }
});

router.get('/shift-rosters', authenticate, async (req, res, next) => {
  try {
    const { employee_id, date_from, date_to, shift_id } = req.query;
    let where = 'WHERE 1=1'; const params = []; let pi = 1;
    if (employee_id) { where += ` AND sr.employee_id = $${pi}`; params.push(parseInt(employee_id)); pi++; }
    if (shift_id) { where += ` AND sr.shift_id = $${pi}`; params.push(parseInt(shift_id)); pi++; }
    if (date_from) { where += ` AND sr.roster_date >= $${pi}`; params.push(date_from); pi++; }
    if (date_to) { where += ` AND sr.roster_date <= $${pi}`; params.push(date_to); pi++; }
    const result = await dbQuery(
      `SELECT sr.*, e.first_name, e.surname, e.employee_code, ws.name AS shift_name
       FROM shift_rosters sr
       JOIN employees e ON sr.employee_id = e.id
       LEFT JOIN work_shifts ws ON sr.shift_id = ws.id
       ${where} ORDER BY sr.roster_date, e.surname`, params
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/shift-rosters', authenticate, auditLog('CREATE', 'shift_roster'), async (req, res, next) => {
  try {
    const { employee_id, shift_id, roster_date, start_time, end_time, notes } = req.body;
    const result = await dbQuery(
      `INSERT INTO shift_rosters (employee_id, shift_id, roster_date, start_time, end_time, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [employee_id, shift_id, roster_date, start_time, end_time, notes, req.user?.id || 1]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.post('/shift-rosters/bulk', authenticate, auditLog('CREATE', 'shift_roster_bulk'), async (req, res, next) => {
  try {
    const { entries } = req.body;
    const results = [];
    for (const entry of entries) {
      const r = await dbQuery(
        `INSERT INTO shift_rosters (employee_id, shift_id, roster_date, start_time, end_time, notes, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [entry.employee_id, entry.shift_id, entry.roster_date, entry.start_time, entry.end_time, entry.notes, req.user?.id || 1]
      );
      results.push(r.rows[0]);
    }
    res.status(201).json({ success: true, data: results, message: `${results.length} roster entries created` });
  } catch (err) { next(err); }
});

router.put('/shift-rosters/:id', authenticate, auditLog('UPDATE', 'shift_roster'), async (req, res, next) => {
  try {
    const { shift_id, start_time, end_time, status, notes } = req.body;
    const result = await dbQuery(
      `UPDATE shift_rosters SET shift_id=$1, start_time=$2, end_time=$3, status=$4, notes=$5 WHERE id=$6 RETURNING *`,
      [shift_id, start_time, end_time, status, notes, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Roster entry not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/flexi-time', authenticate, async (req, res, next) => {
  try {
    const { employee_id } = req.query;
    let where = 'WHERE 1=1'; const params = []; let pi = 1;
    if (employee_id) { where += ` AND ftb.employee_id = $${pi}`; params.push(parseInt(employee_id)); pi++; }
    const result = await dbQuery(
      `SELECT ftb.*, e.first_name, e.surname, e.employee_code
       FROM flexi_time_balances ftb
       JOIN employees e ON ftb.employee_id = e.id
       ${where} ORDER BY e.surname`, params
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/flexi-time', authenticate, auditLog('CREATE', 'flexi_time_balance'), async (req, res, next) => {
  try {
    const { employee_id, balance_hours, accrued_hours, used_hours, period_start, period_end } = req.body;
    const result = await dbQuery(
      `INSERT INTO flexi_time_balances (employee_id, balance_hours, accrued_hours, used_hours, period_start, period_end)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [employee_id, balance_hours || 0, accrued_hours || 0, used_hours || 0, period_start, period_end]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/flexi-time/:id', authenticate, auditLog('UPDATE', 'flexi_time_balance'), async (req, res, next) => {
  try {
    const { balance_hours, accrued_hours, used_hours } = req.body;
    const result = await dbQuery(
      `UPDATE flexi_time_balances SET balance_hours=$1, accrued_hours=$2, used_hours=$3, last_updated=NOW() WHERE id=$4 RETURNING *`,
      [balance_hours, accrued_hours, used_hours, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Flexi-time balance not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

// === GHOST EMPLOYEE DETECTION ===
router.get('/ghost-detection', authenticate, async (req, res, next) => {
  try {
    const months = parseInt(req.query.months) || 3;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const result = await dbQuery(
      `SELECT e.id, e.employee_code, e.first_name, e.surname, e.annual_salary,
              p.title AS position_title,
              MAX(ea.clock_in) AS last_clock_in,
              COUNT(ea.id) AS attendance_records
       FROM employees e
       LEFT JOIN positions p ON e.position_id = p.id
       LEFT JOIN employee_attendance ea ON ea.employee_id = e.id AND ea.clock_in >= $1
       WHERE e.status = 'ACTIVE' AND e.enabled = TRUE
       GROUP BY e.id, e.employee_code, e.first_name, e.surname, e.annual_salary, p.title
       HAVING COUNT(ea.id) = 0
       ORDER BY e.annual_salary DESC`,
      [cutoff.toISOString()]
    );
    const totalExposure = result.rows.reduce((s, r) => s + parseFloat(r.annual_salary || 0), 0);
    res.json({
      success: true,
      data: result.rows,
      summary: { flagged_count: result.rows.length, months_checked: months, total_annual_exposure: totalExposure }
    });
  } catch (err) { next(err); }
});

// === AUTO CALCULATE OVERTIME FROM ATTENDANCE ===
router.post('/calculate-overtime/:periodId', authenticate, async (req, res, next) => {
  try {
    const periodId = req.params.periodId;
    const period = await dbQuery(`SELECT * FROM payroll_periods WHERE id = $1`, [periodId]);
    if (!period.rows.length) return res.status(404).json({ success: false, error: { message: 'Period not found' } });
    const { start_date, end_date } = period.rows[0];

    const attendance = await dbQuery(
      `SELECT ea.employee_id, e.annual_salary,
              SUM(ea.hours_worked) AS total_hours,
              sr.shift_id, ws.hours AS shift_hours
       FROM employee_attendance ea
       JOIN employees e ON ea.employee_id = e.id
       LEFT JOIN shift_rosters sr ON sr.employee_id = ea.employee_id
       LEFT JOIN work_shifts ws ON sr.shift_id = ws.id
       WHERE ea.clock_in >= $1 AND ea.clock_in <= $2
       GROUP BY ea.employee_id, e.annual_salary, sr.shift_id, ws.hours`,
      [start_date, end_date]
    );

    let created = 0;
    for (const att of attendance.rows) {
      const normalHours = parseFloat(att.shift_hours || 173.33);
      const totalWorked = parseFloat(att.total_hours || 0);
      const otHours = totalWorked - normalHours;
      if (otHours <= 0) continue;

      const hourlyRate = parseFloat(att.annual_salary || 0) / 2080;
      const weekdayOT = Math.min(otHours, 40);
      const weekendOT = Math.max(0, otHours - 40);

      const existing = await dbQuery(
        `SELECT id FROM overtime_transactions WHERE employee_id = $1 AND period_id = $2 AND status != 'REJECTED'`,
        [att.employee_id, periodId]
      );
      if (existing.rows.length) continue;

      await dbQuery(
        `INSERT INTO overtime_transactions (employee_id, period_id, overtime_date, hours, rate_multiplier, amount, status, created_by)
         VALUES ($1, $2, $3, $4, 1.5, $5, 'PENDING', $6)`,
        [att.employee_id, periodId, end_date, weekdayOT, parseFloat((weekdayOT * hourlyRate * 1.5).toFixed(2)), req.user?.id || 1]
      );
      if (weekendOT > 0) {
        await dbQuery(
          `INSERT INTO overtime_transactions (employee_id, period_id, overtime_date, hours, rate_multiplier, amount, status, created_by)
           VALUES ($1, $2, $3, $4, 2.0, $5, 'PENDING', $6)`,
          [att.employee_id, periodId, end_date, weekendOT, parseFloat((weekendOT * hourlyRate * 2.0).toFixed(2)), req.user?.id || 1]
        );
      }
      created++;
    }
    res.json({ success: true, message: `${created} overtime records created from attendance data`, count: created });
  } catch (err) { next(err); }
});

// === SHIFT SUBSTITUTION ===
router.post('/shift-substitution', authenticate, async (req, res, next) => {
  try {
    const { original_employee_id, substitute_employee_id, shift_id, date, reason } = req.body;
    await dbQuery(
      `UPDATE shift_rosters SET employee_id = $1 WHERE employee_id = $2 AND shift_id = $3`,
      [substitute_employee_id, original_employee_id, shift_id]
    );
    res.json({ success: true, message: 'Shift substitution applied', data: { original_employee_id, substitute_employee_id, shift_id, date, reason } });
  } catch (err) { next(err); }
});

// === CLAIMS REPORTS ===
router.get('/claims/reports', authenticate, async (req, res, next) => {
  try {
    const { type, year, month } = req.query;
    let sql = `SELECT c.*, e.employee_code, e.first_name, e.surname
               FROM claims c JOIN employees e ON c.employee_id = e.id WHERE 1=1`;
    const params = [];
    if (type) { params.push(type); sql += ` AND c.claim_type = $${params.length}`; }
    if (year) { params.push(parseInt(year)); sql += ` AND EXTRACT(YEAR FROM c.created_at) = $${params.length}`; }
    if (month) { params.push(parseInt(month)); sql += ` AND EXTRACT(MONTH FROM c.created_at) = $${params.length}`; }
    sql += ' ORDER BY c.created_at DESC';
    const result = await dbQuery(sql, params);
    const summary = {
      total_claims: result.rows.length,
      total_amount: result.rows.reduce((s, r) => s + parseFloat(r.amount || 0), 0),
      by_type: {},
      by_status: {}
    };
    result.rows.forEach(r => {
      summary.by_type[r.claim_type] = (summary.by_type[r.claim_type] || 0) + parseFloat(r.amount || 0);
      summary.by_status[r.status] = (summary.by_status[r.status] || 0) + 1;
    });
    res.json({ success: true, data: result.rows, summary });
  } catch (err) { next(err); }
});

// === TIME REPORTS ===
router.get('/reports/attendance-summary', authenticate, async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    const sd = start_date || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const ed = end_date || new Date().toISOString().split('T')[0];
    const result = await dbQuery(
      `SELECT e.employee_code, e.first_name, e.surname, p.department_id,
              COUNT(ea.id) AS days_attended, COALESCE(SUM(ea.hours_worked), 0) AS total_hours,
              COUNT(ea.id) FILTER (WHERE ea.status = 'LATE') AS late_days,
              COUNT(ea.id) FILTER (WHERE ea.status = 'ABSENT') AS absent_days
       FROM employees e
       LEFT JOIN positions p ON e.position_id = p.id
       LEFT JOIN employee_attendance ea ON ea.employee_id = e.id AND ea.clock_in BETWEEN $1 AND $2
       WHERE e.status = 'ACTIVE' AND e.enabled = TRUE
       GROUP BY e.employee_code, e.first_name, e.surname, p.department_id
       ORDER BY e.surname`,
      [sd, ed]
    );
    res.json({ success: true, data: result.rows, period: { start_date: sd, end_date: ed } });
  } catch (err) { next(err); }
});

router.get('/reports/overtime-summary', authenticate, async (req, res, next) => {
  try {
    const { period_id } = req.query;
    let sql = `SELECT e.employee_code, e.first_name, e.surname, p.department_id,
               COALESCE(SUM(ot.hours), 0) AS total_hours, COALESCE(SUM(ot.amount), 0) AS total_amount,
               COUNT(ot.id) AS records, ot.status
               FROM overtime_transactions ot
               JOIN employees e ON ot.employee_id = e.id
               LEFT JOIN positions p ON e.position_id = p.id WHERE 1=1`;
    const params = [];
    if (period_id) { params.push(period_id); sql += ` AND ot.period_id = $${params.length}`; }
    sql += ` GROUP BY e.employee_code, e.first_name, e.surname, p.department_id, ot.status ORDER BY total_amount DESC`;
    const result = await dbQuery(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/reports/shift-report', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT ws.name AS shift_name, ws.start_time, ws.end_time, ws.hours,
              COUNT(sr.id) AS assigned_employees
       FROM work_shifts ws
       LEFT JOIN shift_rosters sr ON sr.shift_id = ws.id
       GROUP BY ws.id, ws.name, ws.start_time, ws.end_time, ws.hours
       ORDER BY ws.name`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

module.exports = router;
