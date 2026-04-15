const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { paginationMiddleware } = require('../middleware/validation');
const { auditLog } = require('../middleware/auditLog');
const { query: dbQuery } = require('../config/database');

/**
 * @swagger
 * /api/v1/leave/schemes:
 *   get:
 *     summary: List leave schemes
 *     tags: [Leave]
 *     responses:
 *       200:
 *         description: List of leave schemes
 *
 * /api/v1/leave/types:
 *   get:
 *     summary: List leave types with accrual rules
 *     tags: [Leave]
 *     parameters:
 *       - in: query
 *         name: scheme_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of leave types
 *
 * /api/v1/leave/transactions:
 *   get:
 *     summary: List leave transactions with filters
 *     tags: [Leave]
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
 *           enum: [PENDING, APPROVED, REJECTED, CANCELLED, ESCALATED]
 *       - in: query
 *         name: leave_type_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Leave transactions
 *   post:
 *     summary: Create leave request
 *     tags: [Leave]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employee_id, leave_type_id, start_date, end_date, days]
 *             properties:
 *               employee_id:
 *                 type: integer
 *               leave_type_id:
 *                 type: integer
 *               absence_type_id:
 *                 type: integer
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               days:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Leave request created
 *
 * /api/v1/leave/transactions/{id}:
 *   get:
 *     summary: Get leave transaction details
 *     tags: [Leave]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Leave transaction details
 *   put:
 *     summary: Update leave transaction
 *     tags: [Leave]
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
 *         description: Leave updated
 *
 * /api/v1/leave/transactions/{id}/approve:
 *   post:
 *     summary: Approve leave request
 *     tags: [Leave]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Leave approved
 *
 * /api/v1/leave/transactions/{id}/reject:
 *   post:
 *     summary: Reject leave request
 *     tags: [Leave]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Leave rejected
 *
 * /api/v1/leave/balances/{employeeId}:
 *   get:
 *     summary: Get employee leave balances
 *     tags: [Leave]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Employee leave balances
 *
 * /api/v1/leave/holidays:
 *   get:
 *     summary: List SA public holidays
 *     tags: [Leave]
 *     responses:
 *       200:
 *         description: Public holidays
 */

router.get('/schemes', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM leave_schemes WHERE enabled = TRUE ORDER BY name');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/types', authenticate, async (req, res, next) => {
  try {
    const { scheme_id } = req.query;
    let whereClause = 'WHERE lt.enabled = TRUE';
    const params = [];
    if (scheme_id) {
      whereClause += ' AND lt.leave_scheme_id = $1';
      params.push(parseInt(scheme_id, 10));
    }
    const result = await dbQuery(
      `SELECT lt.*, ls.name AS scheme_name
       FROM leave_types lt
       LEFT JOIN leave_schemes ls ON lt.leave_scheme_id = ls.id
       ${whereClause}
       ORDER BY lt.name`,
      params
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/transactions', authenticate, paginationMiddleware, async (req, res, next) => {
  try {
    const { pagination } = req;
    const { employee_id, status, leave_type_id } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = [];
    let pi = 1;

    if (employee_id) { whereClause += ` AND lt.employee_id = $${pi}`; params.push(parseInt(employee_id, 10)); pi++; }
    if (status) { whereClause += ` AND lt.status = $${pi}`; params.push(status.toUpperCase()); pi++; }
    if (leave_type_id) { whereClause += ` AND lt.leave_type_id = $${pi}`; params.push(parseInt(leave_type_id, 10)); pi++; }

    const countResult = await dbQuery(`SELECT COUNT(*) FROM leave_transactions lt ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await dbQuery(
      `SELECT lt.*, e.first_name, e.surname, e.employee_code, ltp.name AS leave_type_name, ltp.code AS leave_type_code
       FROM leave_transactions lt
       JOIN employees e ON lt.employee_id = e.id
       JOIN leave_types ltp ON lt.leave_type_id = ltp.id
       ${whereClause}
       ORDER BY lt.created_at DESC
       LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, pagination.limit, pagination.offset]
    );

    res.json({ success: true, data: result.rows, meta: { page: pagination.page, limit: pagination.limit, total, totalPages: Math.ceil(total / pagination.limit) } });
  } catch (err) {
    next(err);
  }
});

router.get('/transactions/:id', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT lt.*, e.first_name, e.surname, e.employee_code, ltp.name AS leave_type_name
       FROM leave_transactions lt
       JOIN employees e ON lt.employee_id = e.id
       JOIN leave_types ltp ON lt.leave_type_id = ltp.id
       WHERE lt.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Leave transaction not found' } });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.post('/transactions', authenticate, auditLog('CREATE', 'leave_transaction'), async (req, res, next) => {
  try {
    const { employee_id, leave_type_id, absence_type_id, start_date, end_date, days, reason } = req.body;

    const emp = await dbQuery('SELECT id, status FROM employees WHERE id = $1 AND status = $2', [employee_id, 'ACTIVE']);
    if (emp.rows.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_EMPLOYEE', message: 'Employee not found or not active' } });
    }

    const result = await dbQuery(
      `INSERT INTO leave_transactions (employee_id, leave_type_id, absence_type_id, start_date, end_date, days, reason, captured_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [employee_id, leave_type_id, absence_type_id, start_date, end_date, days, reason, req.user?.id || 1]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.put('/transactions/:id', authenticate, auditLog('UPDATE', 'leave_transaction'), async (req, res, next) => {
  try {
    const existing = await dbQuery('SELECT * FROM leave_transactions WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Leave transaction not found' } });
    }
    if (existing.rows[0].status !== 'PENDING') {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Can only edit PENDING leave requests' } });
    }

    const { start_date, end_date, days, reason, leave_type_id } = req.body;
    const result = await dbQuery(
      `UPDATE leave_transactions SET
        start_date = COALESCE($1, start_date), end_date = COALESCE($2, end_date),
        days = COALESCE($3, days), reason = COALESCE($4, reason),
        leave_type_id = COALESCE($5, leave_type_id), updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [start_date, end_date, days, reason, leave_type_id, req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.post('/transactions/:id/approve', authenticate, auditLog('APPROVE', 'leave_transaction'), async (req, res, next) => {
  try {
    const result = await dbQuery(
      `UPDATE leave_transactions SET status = 'APPROVED', approved_by = $1, approved_at = NOW(), updated_at = NOW()
       WHERE id = $2 AND status = 'PENDING' RETURNING *`,
      [req.user?.id || 1, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Leave request cannot be approved from current state' } });
    }

    const tx = result.rows[0];
    await dbQuery(
      `INSERT INTO employee_leave_balances (employee_id, leave_type_id, taken_days, as_at_date)
       VALUES ($1, $2, $3, CURRENT_DATE)
       ON CONFLICT (employee_id, leave_type_id, as_at_date)
       DO UPDATE SET taken_days = employee_leave_balances.taken_days + $3`,
      [tx.employee_id, tx.leave_type_id, tx.days]
    );

    res.json({ success: true, data: result.rows[0], message: 'Leave approved' });
  } catch (err) {
    next(err);
  }
});

router.post('/transactions/:id/reject', authenticate, auditLog('REJECT', 'leave_transaction'), async (req, res, next) => {
  try {
    const result = await dbQuery(
      `UPDATE leave_transactions SET status = 'REJECTED', approved_by = $1, approved_at = NOW(), updated_at = NOW(),
       reason = CASE WHEN $3 IS NOT NULL THEN reason || ' [Rejected: ' || $3 || ']' ELSE reason END
       WHERE id = $2 AND status = 'PENDING' RETURNING *`,
      [req.user?.id || 1, req.params.id, req.body.reason || null]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Leave request cannot be rejected from current state' } });
    }
    res.json({ success: true, data: result.rows[0], message: 'Leave rejected' });
  } catch (err) {
    next(err);
  }
});

router.get('/balances/:employeeId', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT lt.name AS leave_type, lt.code,
              COALESCE(elb.balance_days, 0) AS balance_days,
              COALESCE(elb.accrued_days, 0) AS accrued_days,
              COALESCE(elb.taken_days, 0) AS taken_days,
              COALESCE(elb.forfeited_days, 0) AS forfeited_days,
              lt.accrual_days AS annual_entitlement, lt.max_accumulation
       FROM leave_types lt
       LEFT JOIN employee_leave_balances elb ON elb.leave_type_id = lt.id AND elb.employee_id = $1
       WHERE lt.enabled = TRUE
       ORDER BY lt.name`,
      [req.params.employeeId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/holidays', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM holidays WHERE enabled = TRUE ORDER BY holiday_date');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/accrue', authenticate, async (req, res, next) => {
  try {
    const employees = await dbQuery("SELECT id FROM employees WHERE status = 'ACTIVE' AND enabled = TRUE");
    const leaveTypes = await dbQuery("SELECT * FROM leave_types WHERE enabled = TRUE AND accrual_frequency = 'ANNUAL'");

    let accrued = 0;
    for (const emp of employees.rows) {
      for (const lt of leaveTypes.rows) {
        const monthlyAccrual = parseFloat(lt.accrual_days) / 12;
        const existing = await dbQuery(
          'SELECT id FROM employee_leave_balances WHERE employee_id = $1 AND leave_type_id = $2',
          [emp.id, lt.id]
        );
        if (existing.rows.length) {
          await dbQuery(
            `UPDATE employee_leave_balances SET accrued_days = accrued_days + $1, balance_days = balance_days + $1, last_accrual_date = CURRENT_DATE
             WHERE employee_id = $2 AND leave_type_id = $3`,
            [monthlyAccrual, emp.id, lt.id]
          );
        } else {
          await dbQuery(
            `INSERT INTO employee_leave_balances (employee_id, leave_type_id, accrued_days, balance_days, last_accrual_date)
             VALUES ($1, $2, $3, $3, CURRENT_DATE)`,
            [emp.id, lt.id, monthlyAccrual]
          );
        }
        accrued++;
      }
    }
    res.json({ success: true, message: `Accrued leave for ${employees.rows.length} employees across ${leaveTypes.rows.length} types`, data: { accrued_count: accrued } });
  } catch (err) { next(err); }
});

router.post('/carry-over', authenticate, async (req, res, next) => {
  try {
    const { employee_id, leave_type_id, days } = req.body;

    if (employee_id && leave_type_id && days) {
      const balance = await dbQuery(
        'SELECT * FROM employee_leave_balances WHERE employee_id = $1 AND leave_type_id = $2',
        [employee_id, leave_type_id]
      );
      if (!balance.rows.length || parseFloat(balance.rows[0].balance_days) < days) {
        return res.status(400).json({ success: false, error: { message: 'Insufficient leave balance for carry over' } });
      }
      const lt = await dbQuery('SELECT * FROM leave_types WHERE id = $1', [leave_type_id]);
      const maxAcc = lt.rows.length && lt.rows[0].max_accumulation ? parseFloat(lt.rows[0].max_accumulation) : null;
      const currentBalance = parseFloat(balance.rows[0].balance_days);
      if (maxAcc && currentBalance > maxAcc) {
        const excess = currentBalance - maxAcc;
        await dbQuery(
          'UPDATE employee_leave_balances SET forfeited_days = forfeited_days + $1, balance_days = $2 WHERE employee_id = $3 AND leave_type_id = $4',
          [excess, maxAcc, employee_id, leave_type_id]
        );
        return res.json({ success: true, message: `Carry over processed. ${excess.toFixed(1)} excess days forfeited, ${maxAcc} days carried over.` });
      }
      return res.json({ success: true, message: `${days} days carried over successfully. No excess to forfeit.` });
    }

    const leaveTypes = await dbQuery("SELECT * FROM leave_types WHERE enabled = TRUE AND carry_over_days > 0");
    let processed = 0;
    for (const lt of leaveTypes.rows) {
      const balances = await dbQuery(
        'SELECT * FROM employee_leave_balances WHERE leave_type_id = $1 AND balance_days > $2',
        [lt.id, lt.carry_over_days]
      );
      for (const bal of balances.rows) {
        const excess = parseFloat(bal.balance_days) - parseFloat(lt.carry_over_days);
        if (excess > 0) {
          await dbQuery(
            `UPDATE employee_leave_balances SET forfeited_days = forfeited_days + $1, balance_days = $2 WHERE id = $3`,
            [excess, lt.carry_over_days, bal.id]
          );
          processed++;
        }
      }
    }
    res.json({ success: true, message: `Year-end carry-over processed. ${processed} balances adjusted.` });
  } catch (err) { next(err); }
});

router.post('/encash', authenticate, async (req, res, next) => {
  try {
    const { employee_id, leave_type_id, days } = req.body;
    const balance = await dbQuery(
      'SELECT * FROM employee_leave_balances WHERE employee_id = $1 AND leave_type_id = $2',
      [employee_id, leave_type_id]
    );
    if (!balance.rows.length || parseFloat(balance.rows[0].balance_days) < days) {
      return res.status(400).json({ success: false, error: { message: 'Insufficient leave balance for encashment' } });
    }
    const emp = await dbQuery('SELECT annual_salary FROM employees WHERE id = $1', [employee_id]);
    const dailyRate = parseFloat(emp.rows[0].annual_salary) / 260;
    const encashmentAmount = dailyRate * days;

    await dbQuery(
      'UPDATE employee_leave_balances SET balance_days = balance_days - $1, taken_days = taken_days + $1 WHERE employee_id = $2 AND leave_type_id = $3',
      [days, employee_id, leave_type_id]
    );

    res.json({
      success: true,
      data: { employee_id, days_encashed: days, daily_rate: dailyRate, encashment_amount: encashmentAmount },
      message: `Leave encashment: ${days} days = R ${encashmentAmount.toFixed(2)}`
    });
  } catch (err) { next(err); }
});

// === LEAVE POLICIES ===
router.get('/policies', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT lp.*, lt.name AS leave_type_name FROM leave_policies lp
       JOIN leave_types lt ON lp.leave_type_id = lt.id ORDER BY lt.name`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.put('/policies/:id', authenticate, async (req, res, next) => {
  try {
    const { accrual_method, accrual_amount, max_balance, carry_over_limit, cycle_months, cycle_entitlement,
      exclude_holidays, exclude_weekends, min_service_months, requires_medical_cert_after_days,
      consecutive_only, max_consecutive_months, gender_restriction } = req.body;
    const result = await dbQuery(
      `UPDATE leave_policies SET accrual_method=$1, accrual_amount=$2, max_balance=$3, carry_over_limit=$4,
       cycle_months=$5, cycle_entitlement=$6, exclude_holidays=$7, exclude_weekends=$8, min_service_months=$9,
       requires_medical_cert_after_days=$10, consecutive_only=$11, max_consecutive_months=$12, gender_restriction=$13
       WHERE id=$14 RETURNING *`,
      [accrual_method, accrual_amount, max_balance, carry_over_limit, cycle_months, cycle_entitlement,
       exclude_holidays, exclude_weekends, min_service_months, requires_medical_cert_after_days,
       consecutive_only, max_consecutive_months, gender_restriction, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Policy not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

// === SICK LEAVE CYCLE ===
router.get('/sick-cycle/:employeeId', authenticate, async (req, res, next) => {
  try {
    const leaveEngine = require('../services/leave-engine.service');
    const cycle = await leaveEngine.checkSickLeaveCycle(parseInt(req.params.employeeId), new Date().toISOString());
    res.json({ success: true, data: cycle });
  } catch (err) { next(err); }
});

// === LEAVE CALENDAR ===
router.get('/calendar/:year/:month', authenticate, async (req, res, next) => {
  try {
    const { year, month } = req.params;
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
    const result = await dbQuery(
      `SELECT lt.employee_id, e.first_name, e.surname, e.employee_code,
              ltype.name AS leave_type, lt.start_date, lt.end_date, lt.days_taken, lt.status
       FROM leave_transactions lt
       JOIN employees e ON lt.employee_id = e.id
       JOIN leave_types ltype ON lt.leave_type_id = ltype.id
       WHERE lt.status = 'APPROVED'
         AND lt.start_date <= $2 AND lt.end_date >= $1
       ORDER BY lt.start_date`,
      [startDate, endDate]
    );
    const holidays = await dbQuery(
      `SELECT * FROM holidays WHERE holiday_date BETWEEN $1 AND $2 ORDER BY holiday_date`,
      [startDate, endDate]
    );
    res.json({ success: true, data: { leave: result.rows, holidays: holidays.rows, month: parseInt(month), year: parseInt(year) } });
  } catch (err) { next(err); }
});

// === LEAVE REPORTS ===
router.get('/reports/balance', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT e.id, e.employee_code, e.first_name, e.surname,
              lt.name AS leave_type, COALESCE(lb.balance, 0) AS balance
       FROM employees e
       CROSS JOIN leave_types lt
       LEFT JOIN employee_leave_balances lb ON lb.employee_id = e.id AND lb.leave_type_id = lt.id
       WHERE e.status = 'ACTIVE' AND e.enabled = TRUE
       ORDER BY e.surname, e.first_name, lt.name`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/reports/utilisation', authenticate, async (req, res, next) => {
  try {
    const { year } = req.query;
    const yr = year || new Date().getFullYear();
    const result = await dbQuery(
      `SELECT lt_type.name AS leave_type,
              COUNT(*) AS total_requests,
              COALESCE(SUM(lt.days_taken), 0) AS total_days,
              COUNT(DISTINCT lt.employee_id) AS unique_employees,
              COUNT(*) FILTER (WHERE lt.status = 'APPROVED') AS approved,
              COUNT(*) FILTER (WHERE lt.status = 'REJECTED') AS rejected,
              COUNT(*) FILTER (WHERE lt.status = 'PENDING') AS pending
       FROM leave_transactions lt
       JOIN leave_types lt_type ON lt.leave_type_id = lt_type.id
       WHERE EXTRACT(YEAR FROM lt.start_date) = $1
       GROUP BY lt_type.name ORDER BY total_days DESC`,
      [yr]
    );
    res.json({ success: true, data: result.rows, year: parseInt(yr) });
  } catch (err) { next(err); }
});

module.exports = router;
