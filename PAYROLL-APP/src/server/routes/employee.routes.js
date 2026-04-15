const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');
const { paginationMiddleware, validateEmployeeMiddleware } = require('../middleware/validation');
const { auditLog } = require('../middleware/auditLog');
const { query: dbQuery } = require('../config/database');
const { trackEmployeeChanges } = require('../middleware/historyTracker');

const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', '..', '..', 'uploads', 'photos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `photo_${req.params.id}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const photoUpload = multer({
  storage: photoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

/**
 * @swagger
 * /api/v1/employees:
 *   get:
 *     summary: List all employees with search, filter and pagination
 *     tags: [Employees]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortByParam'
 *       - $ref: '#/components/parameters/SortOrderParam'
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, employee code, or ID number
 *       - in: query
 *         name: department_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, SUSPENDED, TERMINATED, DECEASED]
 *       - in: query
 *         name: employee_type_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated list of employees
 *   post:
 *     summary: Create a new employee
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [employee_code, id_number, first_name, surname, date_of_birth, gender, joining_date]
 *             properties:
 *               employee_code:
 *                 type: string
 *               id_number:
 *                 type: string
 *                 description: SA ID number (13 digits)
 *               title:
 *                 type: string
 *               first_name:
 *                 type: string
 *               surname:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *               joining_date:
 *                 type: string
 *                 format: date
 *               position_id:
 *                 type: integer
 *               annual_salary:
 *                 type: number
 *     responses:
 *       201:
 *         description: Employee created successfully
 *       422:
 *         description: Validation error
 *
 * /api/v1/employees/{id}:
 *   get:
 *     summary: Get employee by ID with full details
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Full employee record with position, department, salary details
 *       404:
 *         description: Employee not found
 *   put:
 *     summary: Update employee details
 *     tags: [Employees]
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
 *         description: Employee updated
 *
 * /api/v1/employees/{id}/terminate:
 *   post:
 *     summary: Terminate employee with full workflow
 *     tags: [Employees]
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
 *             required: [termination_type, last_date_of_service]
 *             properties:
 *               termination_type:
 *                 type: string
 *                 enum: [RESIGNATION, DISMISSAL, RETIREMENT, DECEASED, END_OF_CONTRACT, INCAPACITY, RETRENCHMENT]
 *               reason:
 *                 type: string
 *               last_date_of_service:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Employee terminated
 *
 * /api/v1/employees/{id}/salary-transactions:
 *   get:
 *     summary: Get employee salary transactions (earnings and deductions)
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Employee salary transaction lines
 *   post:
 *     summary: Add salary transaction to employee
 *     tags: [Employees]
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
 *             required: [salary_head_id, amount, start_date]
 *             properties:
 *               salary_head_id:
 *                 type: integer
 *               amount:
 *                 type: number
 *               percentage:
 *                 type: number
 *               start_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Salary transaction added
 */

const ALLOWED_SORT_COLS = ['id','employee_code','first_name','surname','joining_date','annual_salary','status','created_at'];

router.get('/ee/barrier-analysis', authenticate, async (req, res, next) => {
  try {
    const workforce = await dbQuery(
      `SELECT
         COALESCE(ol.name, CASE
           WHEN tg.grade_code IN ('T15','T16','T17','T18','T19') THEN 'Top Management'
           WHEN tg.grade_code IN ('T12','T13','T14') THEN 'Senior Management'
           WHEN tg.grade_code IN ('T09','T10','T11') THEN 'Professionally Qualified'
           WHEN tg.grade_code IN ('T06','T07','T08') THEN 'Skilled Technical'
           WHEN tg.grade_code IN ('T04','T05') THEN 'Semi-Skilled'
           WHEN tg.grade_code IN ('T01','T02','T03') THEN 'Unskilled'
           ELSE 'Ungraded'
         END) AS occupational_level,
         e.race, e.gender, COUNT(*) AS count
       FROM employees e
       LEFT JOIN task_grades tg ON e.task_grade_id = tg.id
       LEFT JOIN positions p ON e.position_id = p.id
       LEFT JOIN const_ee_occupational_levels ol ON p.occupational_level_id = ol.id
       WHERE e.status = 'ACTIVE' AND e.enabled = TRUE
       GROUP BY occupational_level, e.race, e.gender`
    );

    const recruitment = await dbQuery(
      `SELECT e.race, e.gender, COUNT(*) AS hired,
              EXTRACT(YEAR FROM e.joining_date) AS year
       FROM employees e WHERE e.enabled = TRUE AND e.joining_date >= (CURRENT_DATE - INTERVAL '2 years')
       GROUP BY e.race, e.gender, year ORDER BY year`
    );

    const turnover = await dbQuery(
      `SELECT e.race, e.gender, COUNT(*) AS terminated
       FROM employees e
       JOIN employee_terminations et ON et.employee_id = e.id
       WHERE et.effective_date >= (CURRENT_DATE - INTERVAL '2 years')
       GROUP BY e.race, e.gender`
    );

    const promotions = await dbQuery(
      `SELECT e.race, e.gender, COUNT(*) AS promoted
       FROM employees e
       JOIN employee_history eh ON eh.employee_id = e.id
       WHERE eh.field_name = 'position_id' AND eh.changed_at >= (CURRENT_DATE - INTERVAL '2 years')
       GROUP BY e.race, e.gender`
    );

    const salary = await dbQuery(
      `SELECT
         COALESCE(ol.name, 'Ungraded') AS occupational_level,
         e.race, e.gender,
         ROUND(AVG(e.annual_salary), 2) AS avg_salary,
         COUNT(*) AS count
       FROM employees e
       LEFT JOIN positions p ON e.position_id = p.id
       LEFT JOIN const_ee_occupational_levels ol ON p.occupational_level_id = ol.id
       WHERE e.status = 'ACTIVE' AND e.enabled = TRUE
       GROUP BY ol.name, e.race, e.gender
       ORDER BY ol.name, e.race, e.gender`
    );

    const barriers = [];
    const wfMap = {};
    for (const row of workforce.rows) {
      const key = `${row.occupational_level}`;
      if (!wfMap[key]) wfMap[key] = { total: 0, groups: {} };
      wfMap[key].total += parseInt(row.count);
      wfMap[key].groups[`${row.race}_${row.gender}`] = parseInt(row.count);
    }
    for (const [level, data] of Object.entries(wfMap)) {
      if (level === 'Ungraded') continue;
      for (const [group, count] of Object.entries(data.groups)) {
        const pct = (count / data.total) * 100;
        if (group.startsWith('White') && pct > 50 && ['Top Management', 'Senior Management', 'Professionally Qualified'].includes(level)) {
          barriers.push({ level, group, percentage: parseFloat(pct.toFixed(1)), type: 'OVER_REPRESENTATION', description: `${group.replace('_', ' ')} over-represented at ${level} level (${pct.toFixed(1)}%)` });
        }
        if (!group.startsWith('White') && pct < 10 && ['Top Management', 'Senior Management'].includes(level)) {
          barriers.push({ level, group, percentage: parseFloat(pct.toFixed(1)), type: 'UNDER_REPRESENTATION', description: `${group.replace('_', ' ')} under-represented at ${level} level (${pct.toFixed(1)}%)` });
        }
      }
    }

    res.json({
      success: true,
      data: {
        workforce_profile: workforce.rows,
        recruitment_trends: recruitment.rows,
        turnover_by_group: turnover.rows,
        promotions_by_group: promotions.rows,
        salary_differentials: salary.rows,
        identified_barriers: barriers
      }
    });
  } catch (err) { next(err); }
});

router.get('/', authenticate, paginationMiddleware, async (req, res, next) => {
  try {
    const { pagination } = req;
    const { search, department_id, status, employee_type_id, cycle_id } = req.query;
    const sortCol = ALLOWED_SORT_COLS.includes(pagination.sortBy) ? pagination.sortBy : 'created_at';

    let whereClause = 'WHERE e.enabled = TRUE';
    const params = [];
    let pi = 1;

    let searchOrderClause = '';
    if (search) {
      const isNumeric = /^\d+$/.test(search.trim());
      if (isNumeric) {
        const numVal = parseInt(search.trim(), 10);
        whereClause += ` AND (e.id = $${pi} OR e.employee_code ILIKE $${pi + 1} OR e.id_number ILIKE $${pi + 1} OR e.first_name ILIKE $${pi + 1} OR e.surname ILIKE $${pi + 1})`;
        searchOrderClause = `CASE WHEN e.id = ${numVal} THEN 0 ELSE 1 END, `;
        params.push(numVal);
        params.push(`%${search}%`);
        pi += 2;
      } else {
        whereClause += ` AND (e.first_name ILIKE $${pi} OR e.surname ILIKE $${pi} OR e.employee_code ILIKE $${pi} OR e.id_number ILIKE $${pi} OR CONCAT(e.first_name, ' ', e.surname) ILIKE $${pi})`;
        params.push(`%${search}%`);
        pi++;
      }
    }
    if (department_id) {
      whereClause += ` AND p.department_id = $${pi}`;
      params.push(parseInt(department_id, 10));
      pi++;
    }
    if (status) {
      whereClause += ` AND e.status = $${pi}`;
      params.push(status.toUpperCase());
      pi++;
    }
    if (employee_type_id) {
      whereClause += ` AND e.employee_type_id = $${pi}`;
      params.push(parseInt(employee_type_id, 10));
      pi++;
    }
    if (cycle_id) {
      whereClause += ` AND e.payroll_cycle_id = $${pi}`;
      params.push(parseInt(cycle_id, 10));
      pi++;
    }

    const countResult = await dbQuery(
      `SELECT COUNT(*) AS count,
              COUNT(*) FILTER (WHERE e.status = 'ACTIVE') AS active_count,
              COUNT(*) FILTER (WHERE e.status = 'TERMINATED') AS terminated_count
       FROM employees e LEFT JOIN positions p ON e.position_id = p.id ${whereClause}`, params
    );
    const total = parseInt(countResult.rows[0].count, 10);
    const activeCount = parseInt(countResult.rows[0].active_count, 10);
    const terminatedCount = parseInt(countResult.rows[0].terminated_count, 10);

    const result = await dbQuery(
      `SELECT e.*, p.title AS position_title, p.position_code,
              pcyc.name AS payroll_cycle_name,
              CASE
                WHEN jp.task_grade_id IS NOT NULL THEN 'Task Grade'
                WHEN jp.upper_limit_id IS NOT NULL THEN 'Upper Limit'
                ELSE 'Rate Based'
              END AS salary_type
       FROM employees e
       LEFT JOIN positions p ON e.position_id = p.id
       LEFT JOIN job_profiles jp ON p.job_profile_id = jp.id
       LEFT JOIN payroll_cycles pcyc ON e.payroll_cycle_id = pcyc.id
       ${whereClause}
       ORDER BY ${searchOrderClause}e.${sortCol} ${pagination.sortOrder}
       LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, pagination.limit, pagination.offset]
    );

    const { enrichDeptDiv } = require('./department.routes');
    await enrichDeptDiv(result.rows);
    res.json({
      success: true,
      data: result.rows,
      pagination: { page: pagination.page, limit: pagination.limit, total, pages: Math.ceil(total / pagination.limit) },
      counts: { total, active: activeCount, terminated: terminatedCount },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/export', authenticate, async (req, res, next) => {
  try {
    const { search, status, cycle_id } = req.query;
    let whereClause = 'WHERE e.enabled = TRUE';
    const params = [];
    let pi = 1;
    if (search) {
      whereClause += ` AND (e.first_name ILIKE $${pi} OR e.surname ILIKE $${pi} OR e.employee_code ILIKE $${pi} OR e.id_number ILIKE $${pi} OR CONCAT(e.first_name, ' ', e.surname) ILIKE $${pi})`;
      params.push(`%${search}%`); pi++;
    }
    if (status) {
      whereClause += ` AND e.status = $${pi}`;
      params.push(status.toUpperCase()); pi++;
    }
    if (cycle_id) {
      whereClause += ` AND e.payroll_cycle_id = $${pi}`;
      params.push(parseInt(cycle_id, 10)); pi++;
    }
    const result = await dbQuery(
      `SELECT e.id, e.employee_code, e.title, e.first_name, e.surname, e.id_number,
              p.title AS position_title, pcyc.name AS payroll_cycle_name,
              CASE
                WHEN jp.task_grade_id IS NOT NULL THEN 'Task Grade'
                WHEN jp.upper_limit_id IS NOT NULL THEN 'Upper Limit'
                ELSE 'Rate Based'
              END AS salary_type,
              e.status
       FROM employees e
       LEFT JOIN positions p ON e.position_id = p.id
       LEFT JOIN job_profiles jp ON p.job_profile_id = jp.id
       LEFT JOIN payroll_cycles pcyc ON e.payroll_cycle_id = pcyc.id
       ${whereClause}
       ORDER BY e.id ASC`, params
    );
    const ExcelJS = require('exceljs');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Employees');
    ws.columns = [
      { header: 'Id', key: 'id', width: 8 },
      { header: 'Code', key: 'employee_code', width: 12 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Position', key: 'position_title', width: 35 },
      { header: 'Cycle', key: 'payroll_cycle_name', width: 20 },
      { header: 'Salary Type', key: 'salary_type', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
    ];
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2B46' } };
    result.rows.forEach(r => {
      ws.addRow({
        id: r.id,
        employee_code: r.employee_code,
        name: [r.title, r.first_name, r.surname].filter(Boolean).join(' '),
        position_title: r.position_title || '-',
        payroll_cycle_name: r.payroll_cycle_name || '-',
        salary_type: r.salary_type || '-',
        status: r.status,
      });
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=employees.xlsx');
    await wb.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
});

router.get('/import/template', authenticate, async (req, res, next) => {
  try {
    const headers = [
      'employee_code', 'id_number', 'title', 'first_name', 'surname', 'date_of_birth', 'gender',
      'joining_date', 'email_address', 'cell_number', 'annual_salary', 'race', 'nationality',
      'income_tax_number', 'position_id', 'task_grade_id', 'employee_type_id', 'condition_of_service_id',
      'bank_name', 'bank_branch_code', 'bank_account_number', 'bank_account_type'
    ];
    const csv = headers.join(',') + '\n' +
      'EMP-001,9001015800087,Mr,John,Smith,1990-01-01,Male,2024-01-15,john@example.com,0821234567,350000,African,South African,1234567890,,,,,,250655,123456789,SAVINGS\n';

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="employee_import_template.csv"');
    res.send(csv);
  } catch (err) { next(err); }
});

router.get('/probation-alerts', authenticate, async (req, res, next) => {
  try {
    const alerts = await dbQuery(
      `SELECT e.id, e.employee_code, e.first_name, e.surname, e.joining_date,
              e.probation_end_date, e.probation_status,
              p.title AS position_title,
              CASE
                WHEN e.probation_end_date IS NOT NULL THEN e.probation_end_date
                ELSE e.joining_date + INTERVAL '3 months'
              END AS calculated_probation_end,
              CASE
                WHEN COALESCE(e.probation_end_date, e.joining_date + INTERVAL '3 months') < CURRENT_DATE THEN 'OVERDUE'
                WHEN COALESCE(e.probation_end_date, e.joining_date + INTERVAL '3 months') <= CURRENT_DATE + INTERVAL '14 days' THEN 'DUE_SOON'
                ELSE 'ON_TRACK'
              END AS alert_status
       FROM employees e
       LEFT JOIN positions p ON e.position_id = p.id
       WHERE e.status = 'ACTIVE' AND e.enabled = TRUE
         AND (
           (e.probation_status IN ('IN_PROGRESS', 'PROBATION', 'ON_PROBATION'))
           OR (e.probation_end_date IS NOT NULL AND e.probation_end_date >= CURRENT_DATE - INTERVAL '30 days')
           OR (e.probation_status IS NULL AND e.probation_end_date IS NULL AND e.joining_date >= CURRENT_DATE - INTERVAL '6 months')
         )
         AND COALESCE(e.probation_end_date, e.joining_date + INTERVAL '3 months') <= CURRENT_DATE + INTERVAL '30 days'
       ORDER BY COALESCE(e.probation_end_date, e.joining_date + INTERVAL '3 months') ASC`
    );

    const overdue = alerts.rows.filter(a => a.alert_status === 'OVERDUE');
    const dueSoon = alerts.rows.filter(a => a.alert_status === 'DUE_SOON');

    res.json({
      success: true,
      data: alerts.rows,
      summary: {
        total: alerts.rows.length,
        overdue: overdue.length,
        due_soon: dueSoon.length
      }
    });
  } catch (err) { next(err); }
});

router.get('/lookups/employee-all', authenticate, async (req, res, next) => {
  try {
    const { getDepartments, getDivisions } = require('./department.routes');
    const [departments, divisions, titlesResult, ethnicGroupsResult, gendersResult, payPoints, countries, provinces, towns, suburbs] = await Promise.all([
      getDepartments(),
      getDivisions(),
      dbQuery('SELECT id, name, abbreviation FROM titles WHERE enabled = TRUE ORDER BY sort_order, name'),
      dbQuery('SELECT id, name FROM ethnic_groups WHERE enabled = TRUE ORDER BY sort_order, name'),
      dbQuery('SELECT id, name FROM genders WHERE enabled = TRUE ORDER BY sort_order, name'),
      dbQuery('SELECT id, name FROM pay_points WHERE enabled = TRUE ORDER BY name'),
      dbQuery('SELECT id, name, code FROM countries WHERE enabled = TRUE ORDER BY name'),
      dbQuery('SELECT id, name, code, country_id FROM provinces WHERE enabled = TRUE ORDER BY name'),
      dbQuery('SELECT id, name, province_id, postal_code FROM towns WHERE enabled = TRUE ORDER BY name'),
      dbQuery('SELECT id, name, town_id, postal_code FROM suburbs WHERE enabled = TRUE ORDER BY name'),
    ]);
    res.json({
      success: true, data: {
        departments: departments,
        divisions: divisions,
        pay_points: payPoints.rows,
        countries: countries.rows,
        provinces: provinces.rows,
        towns: towns.rows,
        suburbs: suburbs.rows,
        titles: titlesResult.rows,
        genders: gendersResult.rows,
        nature_of_person_codes: [
          { code: 'A', description: 'Individual with an identity or passport number' },
          { code: 'B', description: 'Individual without an identity or passport number' },
          { code: 'C', description: 'Director of a private company / member of a CC' },
          { code: 'D', description: 'Trust' },
          { code: 'E', description: 'Company / CC' },
          { code: 'F', description: 'Partnership' },
          { code: 'G', description: 'Corporation' },
          { code: 'H', description: 'Personal Service Provider' },
          { code: 'M', description: 'Asylum Seekers' },
          { code: 'N', description: 'Retirement Fund Lump Sum Recipient / Pensioner' },
          { code: 'R', description: 'Refugee' },
        ],
        marital_statuses: ['Single', 'Married', 'Divorced', 'Widowed', 'Separated', 'Life Partner'],
        home_languages: ['English', 'Afrikaans', 'isiZulu', 'isiXhosa', 'Sesotho', 'Setswana', 'Sepedi', 'Xitsonga', 'siSwati', 'Tshivenda', 'isiNdebele'],
        ethnic_groups: ethnicGroupsResult.rows,
      }
    });
  } catch (err) { next(err); }
});

router.get('/vacant-positions', authenticate, async (req, res, next) => {
  try {
    const { department_id, division_id } = req.query;
    let sql = `SELECT p.id, p.title, p.position_code, p.department_id, p.division_id,
               p.job_profile_id, p.employee_type_id, p.employee_subtype_id,
               p.condition_of_service_id, p.task_grade_id, p.non_employee, p.funded,
               p.upper_limit_value_type,
               jp.job_title, jp.upper_limit_id,
               et.name AS employee_type_name, et.working_hours_per_month AS et_working_hours_per_month, et.working_days_per_month AS et_working_days_per_month,
               es.name AS employee_subtype_name, es.exclude_uif AS subtype_exclude_uif, es.exclude_sdl AS subtype_exclude_sdl, es.enable_bonus AS subtype_enable_bonus,
               cos.name AS condition_of_service_name, tg.grade_code, tg.grade_name,
               sul.minimum_value AS upper_limit_minimum, sul.midpoint_value AS upper_limit_midpoint, sul.maximum_value AS upper_limit_maximum,
               (SELECT tgn.min_salary FROM task_grade_notches tgn WHERE tgn.task_grade_id = p.task_grade_id ORDER BY tgn.notch_number ASC LIMIT 1) AS task_grade_min_salary
               FROM positions p
               LEFT JOIN job_profiles jp ON p.job_profile_id = jp.id
               LEFT JOIN employee_types et ON p.employee_type_id = et.id
               LEFT JOIN employee_subtypes es ON p.employee_subtype_id = es.id
               LEFT JOIN conditions_of_service cos ON p.condition_of_service_id = cos.id
               LEFT JOIN task_grades tg ON p.task_grade_id = tg.id
               LEFT JOIN salary_upper_limits sul ON jp.upper_limit_id = sul.id
               WHERE p.status = 'VACANT' AND p.enabled = TRUE`;
    const params = [];
    if (department_id) { params.push(department_id); sql += ` AND p.department_id = $${params.length}`; }
    if (division_id) { params.push(division_id); sql += ` AND p.division_id = $${params.length}`; }
    sql += ' ORDER BY p.position_code';
    const result = await dbQuery(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/validate-id', authenticate, async (req, res, next) => {
  try {
    const { id_number, exclude_id } = req.query;
    let sql = 'SELECT id, employee_code, first_name, surname FROM employees WHERE id_number = $1 AND enabled = TRUE';
    const params = [id_number];
    if (exclude_id) { params.push(exclude_id); sql += ` AND id != $${params.length}`; }
    const result = await dbQuery(sql, params);
    res.json({ success: true, data: { duplicate: result.rows.length > 0, existing: result.rows[0] || null } });
  } catch (err) { next(err); }
});

router.get('/next-employee-number', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery("SELECT employee_code FROM employees ORDER BY id DESC LIMIT 1");
    let nextNum = 1;
    if (result.rows.length > 0) {
      const last = result.rows[0].employee_code;
      const num = parseInt(last.replace(/\D/g, ''), 10);
      if (!isNaN(num)) nextNum = num + 1;
    }
    const nextCode = 'EMP' + String(nextNum).padStart(4, '0');
    res.json({ success: true, data: { employee_number: nextCode } });
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT e.*, p.title AS position_title, p.position_code,
              p.department_id, p.division_id,
              COALESCE(tg.grade_code, tg2.grade_code) AS grade_code,
              COALESCE(tg.grade_name, tg2.grade_name) AS grade_name,
              COALESCE(e.task_grade_id, jp.task_grade_id) AS resolved_task_grade_id,
              et.name AS employee_type_name,
              et.working_hours_per_month AS et_working_hours_per_month, et.working_days_per_month AS et_working_days_per_month,
              es.name AS employee_subtype_name, es.exclude_uif AS subtype_exclude_uif, es.exclude_sdl AS subtype_exclude_sdl, es.enable_bonus AS subtype_enable_bonus,
              cos.name AS condition_of_service_name,
              jp.job_title, jp.id AS job_profile_id_resolved, jp.upper_limit_id,
              sul.minimum_value AS upper_limit_minimum, sul.midpoint_value AS upper_limit_midpoint, sul.maximum_value AS upper_limit_maximum,
              pp.name AS pay_point_name,
              pcyc.name AS payroll_cycle_name, pcyc.cycle_type AS payroll_cycle_type,
              (SELECT euls.amount FROM employee_upper_limit_structure euls WHERE euls.employee_id = e.id AND euls.salary_head_id = 1 LIMIT 1) AS upper_limit_basic_salary
       FROM employees e
       LEFT JOIN positions p ON e.position_id = p.id
       LEFT JOIN task_grades tg ON e.task_grade_id = tg.id
       LEFT JOIN employee_types et ON e.employee_type_id = et.id
       LEFT JOIN employee_subtypes es ON e.employee_subtype_id = es.id
       LEFT JOIN conditions_of_service cos ON e.condition_of_service_id = cos.id
       LEFT JOIN job_profiles jp ON p.job_profile_id = jp.id
       LEFT JOIN task_grades tg2 ON jp.task_grade_id = tg2.id
       LEFT JOIN salary_upper_limits sul ON jp.upper_limit_id = sul.id
       LEFT JOIN pay_points pp ON e.pay_point_id = pp.id
       LEFT JOIN payroll_cycles pcyc ON e.payroll_cycle_id = pcyc.id
       WHERE e.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } });
    }
    const { enrichSingle } = require('./department.routes');
    await enrichSingle(result.rows[0]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, auditLog('CREATE', 'employee'), async (req, res, next) => {
  try {
    const b = req.body;
    const fields = [
      'employee_code','id_number','passport_number','passport_country','title','initials','first_name','full_name','second_name','surname','known_as','nickname',
      'date_of_birth','gender','language','marital_status','marital_date','dependants',
      'nature_of_person_code','home_language','ethnic_group','is_youth','is_foreigner','has_disability',
      'email_address','cell_number','home_number','work_number',
      'joining_date','end_date','income_tax_number','position_id','division_id',
      'job_profile_id','employee_type_id','employee_subtype_id','condition_of_service_id',
      'task_grade_id','current_notch','annual_salary','monthly_salary','race','disability_status','nationality',
      'payroll_cycle','payroll_cycle_id','tax_method','working_hours_per_month','working_days_per_month','allow_overtime','upper_limit_value_type','exclude_sdl','exclude_uif',
      'salary_based_on','wage_rate','working_hours_per_day','working_days_per_week',
      'enable_bonus','bonus_tax_preference','bonus_period','bonus_month','bonus_amount',
      'employee_create_type','pay_point_id','payslip_pref_email','payslip_pref_sms','payslip_pref_print',
      'physical_address_type','physical_country_id','physical_province_id','physical_town_id','physical_suburb_id',
      'physical_postal_code','physical_unit_number','physical_complex','physical_street_number',
      'physical_address_1','physical_address_2','physical_address_3','physical_address_4','physical_address_5',
      'physical_province','physical_city',
      'postal_address_type','postal_same_as_physical','postal_country_id','postal_province_id','postal_town_id','postal_suburb_id',
      'postal_postal_code','postal_unit_number','postal_complex','postal_street_number',
      'postal_address_1','postal_address_2','postal_address_3','postal_address_4','postal_address_5'
    ];

    const dateFields = ['date_of_birth','marital_date','joining_date','end_date'];
    const presentFields = fields.filter(f => b[f] !== undefined && b[f] !== '');
    const cols = [...presentFields, 'created_by', 'updated_by'];
    const vals = presentFields.map(f => dateFields.includes(f) && !b[f] ? null : b[f]);
    vals.push(req.user?.id || 1);
    vals.push(req.user?.id || 1);
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(',');

    const result = await dbQuery(
      `INSERT INTO employees (${cols.join(',')}) VALUES (${placeholders}) RETURNING *`,
      vals
    );

    if (b.position_id) {
      await dbQuery(`UPDATE positions SET status = 'FILLED' WHERE id = $1`, [b.position_id]);
    }

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, auditLog('UPDATE', 'employee'), async (req, res, next) => {
  try {
    const allowedFields = [
      'title','initials','first_name','full_name','second_name','surname','known_as','nickname',
      'id_number','passport_number','passport_country',
      'date_of_birth','gender','marital_status','marital_date','dependants',
      'nature_of_person_code','home_language','ethnic_group','is_youth','is_foreigner','has_disability',
      'email_address','cell_number','home_number','work_number','income_tax_number',
      'employee_type_id','employee_subtype_id','condition_of_service_id',
      'task_grade_id','current_notch','annual_salary','monthly_salary','race','disability_status',
      'payroll_cycle','payroll_cycle_id','tax_method','working_hours_per_month','working_days_per_month','allow_overtime','upper_limit_value_type','exclude_sdl','exclude_uif',
      'salary_based_on','wage_rate','working_hours_per_day','working_days_per_week',
      'enable_bonus','bonus_tax_preference','bonus_period','bonus_month','bonus_amount',
      'employee_create_type','pay_point_id','payslip_pref_email','payslip_pref_sms','payslip_pref_print',
      'bank_name','bank_branch_code','bank_account_number','bank_account_type','bank_account_holder',
      'physical_address_type','physical_country_id','physical_province_id','physical_town_id','physical_suburb_id',
      'physical_postal_code','physical_unit_number','physical_complex','physical_street_number',
      'physical_address_1','physical_address_2','physical_address_3','physical_address_4','physical_address_5',
      'physical_province','physical_city',
      'postal_address_type','postal_same_as_physical','postal_country_id','postal_province_id','postal_town_id','postal_suburb_id',
      'postal_postal_code','postal_unit_number','postal_complex','postal_street_number',
      'postal_address_1','postal_address_2','postal_address_3','postal_address_4','postal_address_5'
    ];

    const dateFields = ['date_of_birth','marital_date','joining_date','end_date'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = (dateFields.includes(field) && req.body[field] === '') ? null : req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: { code: 'NO_FIELDS', message: 'No valid fields to update' } });
    }

    const setClauses = [];
    const values = [];
    let pi = 1;
    for (const [key, value] of Object.entries(updates)) {
      setClauses.push(`${key} = $${pi}`);
      values.push(value);
      pi++;
    }
    setClauses.push(`updated_at = NOW()`);
    setClauses.push(`updated_by = $${pi}`);
    values.push(req.user?.id || 1);
    pi++;
    values.push(req.params.id);

    const result = await dbQuery(
      `UPDATE employees SET ${setClauses.join(', ')} WHERE id = $${pi} AND enabled = TRUE RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/termination/calculate', authenticate, async (req, res, next) => {
  try {
    const terminationService = require('../services/termination.service');
    const { termination_type, last_date_of_service } = req.body;
    const result = await terminationService.calculateFullTermination(req.params.id, last_date_of_service, termination_type);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/termination/finalise', authenticate, auditLog('CREATE', 'employee_termination'), async (req, res, next) => {
  try {
    const terminationService = require('../services/termination.service');
    const result = await terminationService.finaliseTermination(req.params.id, req.body, req.user?.id || 1);
    res.json({ success: true, data: result, message: 'Employee terminated successfully' });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/termination/ui8', authenticate, async (req, res, next) => {
  try {
    const terminationService = require('../services/termination.service');
    const pdf = await terminationService.generateUI8Form(req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=UI8_${req.params.id}.pdf`);
    res.send(pdf);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/terminate', authenticate, auditLog('CREATE', 'employee_termination'), async (req, res, next) => {
  try {
    const { termination_type, reason, last_date_of_service, employed_full_month, position_status } = req.body;
    const employeeId = req.params.id;

    const emp = await dbQuery('SELECT * FROM employees WHERE id = $1 AND status = $2', [employeeId, 'ACTIVE']);
    if (emp.rows.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Employee is not active or does not exist' } });
    }

    const termResult = await dbQuery(
      `INSERT INTO employee_terminations (employee_id, termination_type, reason, last_date_of_service, employed_full_month, position_status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [employeeId, termination_type, reason, last_date_of_service, employed_full_month || false, position_status || 'VACANT', req.user?.id || 1]
    );

    await dbQuery(
      `UPDATE employees SET status = 'TERMINATED', end_date = $1, updated_at = NOW(), updated_by = $2 WHERE id = $3`,
      [last_date_of_service, req.user?.id || 1, employeeId]
    );

    if (emp.rows[0].position_id) {
      await dbQuery(`UPDATE positions SET status = $1 WHERE id = $2`, [position_status || 'VACANT', emp.rows[0].position_id]);
    }

    res.json({ success: true, data: termResult.rows[0], message: 'Employee terminated successfully' });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/inherited-salary-transactions', authenticate, async (req, res, next) => {
  try {
    const chainResult = await dbQuery(
      `SELECT e.id AS employee_id, e.position_id,
              p.job_profile_id,
              jp.salary_transaction_group_id,
              stg.code AS group_code, stg.name AS group_name
       FROM employees e
       LEFT JOIN positions p ON e.position_id = p.id
       LEFT JOIN job_profiles jp ON p.job_profile_id = jp.id
       LEFT JOIN salary_transaction_groups stg ON jp.salary_transaction_group_id = stg.id
       WHERE e.id = $1`,
      [req.params.id]
    );
    if (chainResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Employee not found' } });
    }
    const chain = chainResult.rows[0];
    if (!chain.salary_transaction_group_id) {
      return res.json({
        success: true,
        data: {
          group_id: null, group_code: null, group_name: null,
          position_id: chain.position_id, job_profile_id: chain.job_profile_id,
          items: []
        }
      });
    }
    const itemsResult = await dbQuery(
      `SELECT gi.id AS group_item_id, gi.salary_head_id, gi.sort_order, gi.included_in_package,
              sh.code, sh.name, sh.transaction_type, sh.calculation_method,
              sh.irp5_code, sh.taxable, sh.employer_contribution, sh.employee_contribution,
              sh.is_system, sh.priority,
              ic.description AS irp5_description
       FROM salary_transaction_group_items gi
       JOIN salary_heads sh ON sh.id = gi.salary_head_id
       LEFT JOIN irp5_codes ic ON ic.code = sh.irp5_code
       WHERE gi.group_id = $1 AND sh.enabled = TRUE
       ORDER BY sh.transaction_type, sh.priority, sh.code`,
      [chain.salary_transaction_group_id]
    );
    res.json({
      success: true,
      data: {
        group_id: chain.salary_transaction_group_id,
        group_code: chain.group_code,
        group_name: chain.group_name,
        position_id: chain.position_id,
        job_profile_id: chain.job_profile_id,
        items: itemsResult.rows
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/salary-transactions', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT est.*, sh.code AS salary_head_code, sh.name AS salary_head_name, sh.transaction_type,
              sh.irp5_code, sh.taxable, sh.calculation_method, sh.employer_contribution, sh.employee_contribution
       FROM employee_salary_transactions est
       JOIN salary_heads sh ON est.salary_head_id = sh.id
       WHERE est.employee_id = $1 AND est.enabled = TRUE
       ORDER BY sh.transaction_type, sh.priority`,
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/salary-transactions', authenticate, auditLog('CREATE', 'employee_salary_transaction'), async (req, res, next) => {
  try {
    const { salary_head_id, start_date, end_date } = req.body;
    if (!salary_head_id) return res.status(400).json({ success: false, error: { message: 'Salary head is required' } });

    const headRes = await dbQuery('SELECT * FROM salary_heads WHERE id = $1 AND enabled = TRUE', [salary_head_id]);
    if (headRes.rows.length === 0) return res.status(400).json({ success: false, error: { message: 'Salary head not found or disabled' } });
    const head = headRes.rows[0];

    if (head.calculation_method === 'SYSTEM_CALCULATE') {
      return res.status(400).json({ success: false, error: { message: `${head.name} is system-calculated (PAYE, UIF, SDL) and cannot be manually assigned to employees` } });
    }

    const result = await dbQuery(
      `INSERT INTO employee_salary_transactions (employee_id, salary_head_id, start_date, end_date, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $5) RETURNING *`,
      [req.params.id, salary_head_id, start_date || '1900-01-01', end_date || '9999-12-31', req.user?.id || 1]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.put('/:id/salary-transactions/:txnId', authenticate, auditLog('UPDATE', 'employee_salary_transaction'), async (req, res, next) => {
  try {
    const { start_date, end_date, enabled } = req.body;

    const fields = [];
    const vals = [];
    let idx = 1;
    if (start_date !== undefined) { fields.push(`start_date = $${idx++}`); vals.push(start_date); }
    if (end_date !== undefined) { fields.push(`end_date = $${idx++}`); vals.push(end_date || '9999-12-31'); }
    if (enabled !== undefined) { fields.push(`enabled = $${idx++}`); vals.push(enabled); }
    fields.push(`updated_at = NOW()`);
    fields.push(`updated_by = $${idx++}`); vals.push(req.user?.id || 1);
    vals.push(req.params.txnId);
    vals.push(req.params.id);
    const result = await dbQuery(
      `UPDATE employee_salary_transactions SET ${fields.join(', ')} WHERE id = $${idx++} AND employee_id = $${idx} RETURNING *`,
      vals
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: { message: 'Transaction not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id/salary-transactions/:txnId', authenticate, auditLog('DELETE', 'employee_salary_transaction'), async (req, res, next) => {
  try {
    const result = await dbQuery(
      `UPDATE employee_salary_transactions SET enabled = FALSE, updated_at = NOW(), updated_by = $1 WHERE id = $2 AND employee_id = $3 RETURNING *`,
      [req.user?.id || 1, req.params.txnId, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: { message: 'Transaction not found' } });
    res.json({ success: true, data: { message: 'Transaction removed' } });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/history', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT * FROM employee_history WHERE employee_id = $1 ORDER BY changed_at DESC LIMIT 100`,
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/:id/emergency-contacts', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      'SELECT * FROM employee_emergency_contacts WHERE employee_id = $1 ORDER BY is_primary DESC, contact_name',
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/:id/emergency-contacts', authenticate, async (req, res, next) => {
  try {
    const { contact_name, relationship, phone_primary, phone_secondary, email, address, is_primary } = req.body;
    if (is_primary) {
      await dbQuery('UPDATE employee_emergency_contacts SET is_primary = FALSE WHERE employee_id = $1', [req.params.id]);
    }
    const result = await dbQuery(
      `INSERT INTO employee_emergency_contacts (employee_id, contact_name, relationship, phone_primary, phone_secondary, email, address, is_primary)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.params.id, contact_name, relationship, phone_primary, phone_secondary, email, address, is_primary || false]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/:id/emergency-contacts/:contactId', authenticate, async (req, res, next) => {
  try {
    const { contact_name, relationship, phone_primary, phone_secondary, email, address, is_primary } = req.body;
    if (is_primary) {
      await dbQuery('UPDATE employee_emergency_contacts SET is_primary = FALSE WHERE employee_id = $1', [req.params.id]);
    }
    const result = await dbQuery(
      `UPDATE employee_emergency_contacts SET contact_name=$1, relationship=$2, phone_primary=$3, phone_secondary=$4, email=$5, address=$6, is_primary=$7, updated_at=NOW()
       WHERE id=$8 AND employee_id=$9 RETURNING *`,
      [contact_name, relationship, phone_primary, phone_secondary, email, address, is_primary, req.params.contactId, req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/:id/emergency-contacts/:contactId', authenticate, async (req, res, next) => {
  try {
    await dbQuery('DELETE FROM employee_emergency_contacts WHERE id = $1 AND employee_id = $2', [req.params.contactId, req.params.id]);
    res.json({ success: true, message: 'Emergency contact deleted' });
  } catch (err) { next(err); }
});

router.get('/:id/documents', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM employee_documents WHERE employee_id = $1 ORDER BY uploaded_at DESC', [req.params.id]);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/:id/qualifications', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM employee_qualifications WHERE employee_id = $1 ORDER BY year_obtained DESC', [req.params.id]);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/:id/succession', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT sp.*, p.title AS position_title, p.position_code
       FROM succession_pools sp JOIN positions p ON sp.position_id = p.id
       WHERE sp.employee_id = $1 ORDER BY sp.readiness`, [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/:id/photo', authenticate, photoUpload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: { message: 'No photo uploaded' } });
    const photoUrl = `/uploads/photos/${req.file.filename}`;
    const result = await dbQuery(
      `UPDATE employees SET photo_url = $1, updated_at = NOW(), updated_by = $2 WHERE id = $3 AND enabled = TRUE RETURNING id, photo_url`,
      [photoUrl, req.user?.id || 1, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } });
    }
    res.json({ success: true, data: result.rows[0], message: 'Photo uploaded successfully' });
  } catch (err) { next(err); }
});

router.delete('/:id/photo', authenticate, async (req, res, next) => {
  try {
    const emp = await dbQuery('SELECT photo_url FROM employees WHERE id = $1 AND enabled = TRUE', [req.params.id]);
    if (emp.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } });
    }
    if (emp.rows[0].photo_url) {
      const filePath = path.join(__dirname, '..', '..', '..', 'public', emp.rows[0].photo_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await dbQuery(
      `UPDATE employees SET photo_url = NULL, updated_at = NOW(), updated_by = $1 WHERE id = $2`,
      [req.user?.id || 1, req.params.id]
    );
    res.json({ success: true, message: 'Photo removed successfully' });
  } catch (err) { next(err); }
});

router.get('/:id/dependants', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      'SELECT * FROM employee_dependants WHERE employee_id = $1 ORDER BY date_of_birth',
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/:id/dependants', authenticate, async (req, res, next) => {
  try {
    const { first_name, surname, id_number, date_of_birth, relationship, gender, disability, contact_number, notes } = req.body;
    const result = await dbQuery(
      `INSERT INTO employee_dependants (employee_id, first_name, surname, id_number, date_of_birth, relationship, gender, disability, contact_number, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.params.id, first_name, surname, id_number, date_of_birth, relationship, gender, disability || false, contact_number, notes]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/:id/dependants/:depId', authenticate, async (req, res, next) => {
  try {
    const { first_name, surname, id_number, date_of_birth, relationship, gender, disability, contact_number, notes } = req.body;
    const result = await dbQuery(
      `UPDATE employee_dependants SET first_name=$1, surname=$2, id_number=$3, date_of_birth=$4, relationship=$5, gender=$6, disability=$7, contact_number=$8, notes=$9, updated_at=NOW()
       WHERE id=$10 AND employee_id=$11 RETURNING *`,
      [first_name, surname, id_number, date_of_birth, relationship, gender, disability, contact_number, notes, req.params.depId, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Dependant not found' } });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/:id/dependants/:depId', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('DELETE FROM employee_dependants WHERE id = $1 AND employee_id = $2 RETURNING id', [req.params.depId, req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Dependant not found' } });
    }
    res.json({ success: true, message: 'Dependant deleted' });
  } catch (err) { next(err); }
});

router.post('/import', authenticate, auditLog('CREATE', 'employee_import'), async (req, res, next) => {
  try {
    const { employees: empArray } = req.body;
    if (!empArray || !Array.isArray(empArray) || empArray.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'employees array is required' } });
    }

    const results = { imported: 0, errors: [], total: empArray.length };

    function validateSAID(id) {
      if (!id || id.length !== 13 || !/^\d{13}$/.test(id)) return false;
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        const digit = parseInt(id[i], 10);
        if (i % 2 === 0) {
          sum += digit;
        } else {
          const doubled = digit * 2;
          sum += doubled > 9 ? doubled - 9 : doubled;
        }
      }
      const checkDigit = (10 - (sum % 10)) % 10;
      return checkDigit === parseInt(id[12], 10);
    }

    for (let i = 0; i < empArray.length; i++) {
      const row = empArray[i];
      const rowNum = i + 1;
      const rowErrors = [];

      if (!row.employee_code) rowErrors.push('employee_code is required');
      if (!row.first_name) rowErrors.push('first_name is required');
      if (!row.surname) rowErrors.push('surname is required');
      if (!row.id_number) rowErrors.push('id_number is required');
      if (!row.date_of_birth) rowErrors.push('date_of_birth is required');
      if (!row.gender) rowErrors.push('gender is required');
      if (!row.joining_date) rowErrors.push('joining_date is required');

      if (row.id_number && !validateSAID(row.id_number)) {
        rowErrors.push('Invalid SA ID number (Luhn check failed)');
      }

      if (row.employee_code) {
        const dupCode = await dbQuery('SELECT id FROM employees WHERE employee_code = $1 LIMIT 1', [row.employee_code]);
        if (dupCode.rows.length > 0) rowErrors.push(`Duplicate employee_code: ${row.employee_code}`);
      }
      if (row.id_number) {
        const dupId = await dbQuery('SELECT id FROM employees WHERE id_number = $1 LIMIT 1', [row.id_number]);
        if (dupId.rows.length > 0) rowErrors.push(`Duplicate id_number: ${row.id_number}`);
      }

      if (rowErrors.length > 0) {
        results.errors.push({ row: rowNum, employee_code: row.employee_code, errors: rowErrors });
        continue;
      }

      try {
        await dbQuery(
          `INSERT INTO employees (
            employee_code, id_number, title, first_name, surname, date_of_birth, gender,
            joining_date, email_address, cell_number, annual_salary, race, nationality,
            income_tax_number, position_id, task_grade_id, employee_type_id, condition_of_service_id,
            bank_name, bank_branch_code, bank_account_number, bank_account_type,
            created_by, updated_by
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$23)`,
          [
            row.employee_code, row.id_number, row.title || null, row.first_name, row.surname,
            row.date_of_birth, row.gender, row.joining_date,
            row.email_address || null, row.cell_number || null,
            row.annual_salary ? parseFloat(row.annual_salary) : null,
            row.race || null, row.nationality || 'South African',
            row.income_tax_number || null,
            row.position_id ? parseInt(row.position_id) : null,
            row.task_grade_id ? parseInt(row.task_grade_id) : null,
            row.employee_type_id ? parseInt(row.employee_type_id) : null,
            row.condition_of_service_id ? parseInt(row.condition_of_service_id) : null,
            row.bank_name || null, row.bank_branch_code || null,
            row.bank_account_number || null, row.bank_account_type || null,
            req.user?.id || 1
          ]
        );
        results.imported++;
      } catch (dbErr) {
        results.errors.push({ row: rowNum, employee_code: row.employee_code, errors: [dbErr.message] });
      }
    }

    res.json({
      success: true,
      data: results,
      message: `Imported ${results.imported} of ${results.total} employees. ${results.errors.length} errors.`
    });
  } catch (err) { next(err); }
});

module.exports = router;
