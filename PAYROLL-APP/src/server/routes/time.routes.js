const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate, authorize } = require('../middleware/auth');
const { paginationMiddleware } = require('../middleware/validation');
const { auditLog } = require('../middleware/auditLog');
const { query: dbQuery, getClient } = require('../config/database');
const ExcelJS = require('exceljs');
const XLSX = require('xlsx');

const claimsUploadDir = path.join(__dirname, '..', '..', '..', 'uploads', 'claims');
if (!fs.existsSync(claimsUploadDir)) fs.mkdirSync(claimsUploadDir, { recursive: true });

/* ─── Bulk import helpers ─── */
const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls'].includes(ext)) cb(null, true);
    else cb(new Error('Only Excel files (.xlsx, .xls) are accepted'));
  }
});

function parseDateCell(val) {
  if (!val && val !== 0) return null;
  if (val instanceof Date) {
    const y = val.getUTCFullYear();
    const m = String(val.getUTCMonth() + 1).padStart(2, '0');
    const d = String(val.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof val === 'number') {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    const y = d.getUTCFullYear();
    const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
    const da = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${mo}-${da}`;
  }
  const s = String(val).trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return null;
}

function parseTimeCell(val, dateStr) {
  if (!val && val !== 0) return null;
  if (val instanceof Date) {
    const hh = String(val.getUTCHours()).padStart(2, '0');
    const mm = String(val.getUTCMinutes()).padStart(2, '0');
    return `${dateStr}T${hh}:${mm}:00`;
  }
  if (typeof val === 'number' && val >= 0 && val < 1) {
    const totalMinutes = Math.round(val * 1440);
    const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const mm = String(totalMinutes % 60).padStart(2, '0');
    return `${dateStr}T${hh}:${mm}:00`;
  }
  const s = String(val).trim();
  if (!s || s === '—' || s === '-') return null;
  const match = s.match(/^(\d{1,2}):(\d{2})$/);
  if (match) return `${dateStr}T${match[1].padStart(2, '0')}:${match[2]}:00`;
  return null;
}

const ESS_ADMIN_ROLES = new Set(['admin', 'hr_manager', 'payroll_admin', 'supervisor', 'manager']);
function isEssScoped(user) {
  const roles = (user && user.roles) ? user.roles : (user && user.role ? [user.role] : []);
  return roles.length > 0 && !roles.some(r => ESS_ADMIN_ROLES.has(r));
}
/* ─────────────────────────── */

const claimStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, claimsUploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const claimUpload = multer({
  storage: claimStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('File type not allowed. Accepted: PDF, JPG, PNG, DOCX'));
  }
});

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

router.get('/attendance/pay-points', authenticate, async (req, res, next) => {
  try {
    const rows = await dbQuery(`
      SELECT DISTINCT pp.id, pp.name, pp.code
      FROM pay_points pp
      JOIN employees e ON e.pay_point_id = pp.id
      JOIN employee_attendance ea ON ea.employee_id = e.id
      ORDER BY pp.name
    `);
    res.json({ success: true, data: rows.rows });
  } catch (err) { next(err); }
});

router.get('/attendance/filter-options', authenticate, async (req, res, next) => {
  try {
    const [deptRes, divRes] = await Promise.all([
      dbQuery(`SELECT DISTINCT pos.department_id FROM positions pos
               JOIN employees e ON e.position_id = pos.id
               JOIN employee_attendance ea ON ea.employee_id = e.id
               WHERE pos.department_id IS NOT NULL ORDER BY pos.department_id`),
      dbQuery(`SELECT DISTINCT pos.division_id FROM positions pos
               JOIN employees e ON e.position_id = pos.id
               JOIN employee_attendance ea ON ea.employee_id = e.id
               WHERE pos.division_id IS NOT NULL ORDER BY pos.division_id`)
    ]);
    res.json({
      success: true,
      data: {
        departments: deptRes.rows.map(r => ({ id: r.department_id, name: `Department ${r.department_id}` })),
        divisions: divRes.rows.map(r => ({ id: r.division_id, name: `Division ${r.division_id}` }))
      }
    });
  } catch (err) { next(err); }
});

router.get('/attendance/template', authenticate, async (req, res, next) => {
  try {
    const { employee_id } = req.query;
    let employeeInfo = null;
    if (employee_id) {
      const requestedId = parseInt(employee_id, 10);
      if (req.user && req.user.employeeId && req.user.employeeId !== requestedId) {
        return res.status(403).json({ success: false, error: { message: 'Access denied: cannot download template for another employee' } });
      }
      const emp = await dbQuery('SELECT id, employee_code, first_name, surname FROM employees WHERE id=$1', [requestedId]);
      if (emp.rows.length) {
        const e = emp.rows[0];
        employeeInfo = { id: e.id, code: e.employee_code, name: `${e.first_name} ${e.surname}` };
      }
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'mSCOA HR & Payroll';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Time Import');
    const NAVY = 'FF0F2B46';
    const GOLD = 'FFC9A84C';
    const WHITE = 'FFFFFFFF';
    const LIGHT = 'FFF1F5F9';
    const INFO_BG = 'FFEFF6FF';
    const INFO_TEXT = 'FF1D4ED8';

    let headerRow = 1;

    if (employeeInfo) {
      sheet.mergeCells('A1:F1');
      const infoCell = sheet.getCell('A1');
      infoCell.value = `Employee: ${employeeInfo.id} | ${employeeInfo.code} — ${employeeInfo.name}   •   Employee ID is pre-filled. Do not change it.`;
      infoCell.font = { bold: true, size: 11, color: { argb: INFO_TEXT } };
      infoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: INFO_BG } };
      infoCell.alignment = { horizontal: 'left', vertical: 'middle' };
      sheet.getRow(1).height = 26;
      headerRow = 2;
    }

    const colDefs = [
      { header: 'Employee ID',          key: 'eid',  width: 16 },
      { header: 'Date (dd/MM/yyyy)',     key: 'date', width: 22 },
      { header: 'Clock In (HH:mm)',      key: 'ci',   width: 20 },
      { header: 'Clock Out (HH:mm)',     key: 'co',   width: 20 },
      { header: 'Hours Worked',          key: 'hrs',  width: 16 },
      { header: 'Comment / Reason *',   key: 'cmt',  width: 44 }
    ];

    const hRow = sheet.getRow(headerRow);
    colDefs.forEach((c, i) => {
      const cell = hRow.getCell(i + 1);
      cell.value = c.header;
      cell.font = { bold: true, color: { argb: WHITE }, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { bottom: { style: 'medium', color: { argb: GOLD } } };
    });
    hRow.height = 22;
    sheet.columns = colDefs.map(c => ({ key: c.key, width: c.width }));

    const today = new Date();
    const todayFmt = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`;
    const exRow = sheet.getRow(headerRow + 1);
    const exData = [employeeInfo ? employeeInfo.id : 1001, todayFmt, '08:00', '17:00', 9.0, 'Biometric scanner offline — entered manually (EXAMPLE — delete this row)'];
    exData.forEach((v, i) => {
      const cell = exRow.getCell(i + 1);
      cell.value = v;
      cell.font = { italic: true, color: { argb: 'FF94A3B8' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT } };
    });

    if (employeeInfo) {
      for (let r = headerRow + 2; r <= headerRow + 11; r++) {
        const c = sheet.getRow(r).getCell(1);
        c.value = employeeInfo.id;
        c.font = { color: { argb: 'FF94A3B8' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C3' } };
        c.protection = { locked: true };
        for (let col = 2; col <= 6; col++) {
          sheet.getRow(r).getCell(col).protection = { locked: false };
        }
      }
      const exRowNum = headerRow + 1;
      sheet.getRow(exRowNum).getCell(1).protection = { locked: true };
      for (let col = 2; col <= 6; col++) {
        sheet.getRow(exRowNum).getCell(col).protection = { locked: true };
      }
      await sheet.protect('', {
        selectLockedCells: true,
        selectUnlockedCells: true,
        insertRows: false,
        deleteRows: false,
        formatCells: false,
        formatColumns: false,
        formatRows: false
      });
    }

    const inst = workbook.addWorksheet('Instructions');
    const instRows = [
      ['Field', 'Format', 'Required', 'Notes'],
      ['Employee ID', 'Number', 'Yes', 'Employee system ID (e.g. 3508). Pre-filled for ESS imports.'],
      ['Date', 'dd/MM/yyyy', 'Yes', 'Date of attendance (e.g. 15/06/2026). Also accepts yyyy-MM-dd.'],
      ['Clock In', 'HH:mm', 'No', '24-hour time (e.g. 08:00). Leave blank if not applicable.'],
      ['Clock Out', 'HH:mm', 'No', '24-hour time (e.g. 17:00). Leave blank if not applicable.'],
      ['Hours Worked', 'Decimal number', 'No*', 'Auto-calculated from Clock In/Out if both provided. * Required only if both times are blank.'],
      ['Comment / Reason', 'Text', 'Yes', 'Reason for manual capture (e.g. biometric scanner offline, remote work).'],
      [],
      ['Rules'],
      ['• Duplicate records (same Employee ID + Date already in the system) are SKIPPED, not overwritten.'],
      ['• Exception detection (Late, Early, Short Time, Missing) runs automatically on import.'],
      ['• All imported records are flagged as Manual source and subject to supervisor review.'],
      ['• Delete the example row before uploading.'],
    ];
    instRows.forEach((row, i) => {
      const r = inst.getRow(i + 1);
      row.forEach((v, j) => { r.getCell(j + 1).value = v; });
      if (i === 0) { r.eachCell(c => { c.font = { bold: true, color: { argb: WHITE } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }; }); }
    });
    inst.columns = [{ width: 22 }, { width: 18 }, { width: 12 }, { width: 72 }];

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="time-import-template.xlsx"`);
    res.end(buffer);
  } catch (err) { next(err); }
});

router.post('/attendance/bulk-import', authenticate, importUpload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: { message: 'No file uploaded' } });

    const queryEmployeeId = req.query.employee_id ? parseInt(req.query.employee_id, 10) : null;
    if (queryEmployeeId && req.user && req.user.employeeId && req.user.employeeId !== queryEmployeeId) {
      return res.status(403).json({ success: false, error: { message: 'Access denied: cannot import attendance for another employee' } });
    }
    const lockedEmployeeId = isEssScoped(req.user) ? req.user.employeeId : (queryEmployeeId || null);

    const wb = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    if (!wb.SheetNames.length) return res.status(400).json({ success: false, error: { message: 'Workbook has no sheets' } });
    const allRows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: null });

    let headerRowIdx = 0;
    for (let i = 0; i < allRows.length; i++) {
      const firstCell = allRows[i][0];
      if (typeof firstCell === 'string' && /employee id/i.test(firstCell)) { headerRowIdx = i; break; }
    }

    const rawRows = [];
    for (let i = headerRowIdx + 1; i < allRows.length; i++) {
      const cells = allRows[i].slice(0, 6);
      if (cells.every(c => c === null || c === undefined || c === '')) continue;
      rawRows.push({ rowNum: i + 1, cells });
    }

    const results = { imported: 0, skipped: 0, errors: [], date_range: null };
    const importedDates = [];

    for (const { rowNum, cells } of rawRows) {
      const [empIdCell, dateCell, ciCell, coCell, hrsCell, cmtCell] = cells;

      const employeeId = lockedEmployeeId || (empIdCell != null ? parseInt(String(empIdCell)) : null);
      if (!employeeId || isNaN(employeeId)) {
        results.errors.push({ row: rowNum, reason: 'Employee ID is required' });
        continue;
      }

      const attendanceDate = parseDateCell(dateCell);
      if (!attendanceDate) {
        results.errors.push({ row: rowNum, reason: 'Valid date is required (dd/MM/yyyy or yyyy-MM-dd)' });
        continue;
      }

      const isExampleRow = String(cmtCell || '').toLowerCase().includes('example') && String(cmtCell || '').toLowerCase().includes('delete');
      if (isExampleRow) { results.skipped++; continue; }

      const clockIn = parseTimeCell(ciCell, attendanceDate);
      const clockOut = parseTimeCell(coCell, attendanceDate);
      let hoursWorked = hrsCell != null ? parseFloat(String(hrsCell)) : null;
      if (isNaN(hoursWorked)) hoursWorked = null;

      if (clockIn && clockOut && !hoursWorked) {
        const diff = (new Date(clockOut) - new Date(clockIn)) / 3600000;
        if (diff > 0) hoursWorked = parseFloat(diff.toFixed(2));
      }

      if (!clockIn && !clockOut && !hoursWorked) {
        results.errors.push({ row: rowNum, reason: 'Provide Clock In, Clock Out, or Hours Worked' });
        continue;
      }

      const comment = cmtCell ? String(cmtCell).trim() : '';
      if (!comment) {
        results.errors.push({ row: rowNum, reason: 'Comment / Reason is required' });
        continue;
      }

      const dup = await dbQuery(
        'SELECT id FROM employee_attendance WHERE employee_id=$1 AND attendance_date=$2::date LIMIT 1',
        [employeeId, attendanceDate]
      );
      if (dup.rows.length) { results.skipped++; continue; }

      try {
        const ctx = await resolveExceptionContext(dbQuery, { employee_id: employeeId, shift_id: null, attendance_date: attendanceDate, input_mode: 'DAILY' });
        const exception_type = detectException({ clock_in: clockIn, clock_out: clockOut, hours_worked: hoursWorked, ...ctx, input_mode: 'DAILY' });
        await dbQuery(
          `INSERT INTO employee_attendance
             (employee_id, attendance_date, clock_in, clock_out, hours_worked, shift_id,
              status, source, comment, manual_input, exception_type, input_mode, period_start_date, period_end_date)
           VALUES ($1,$2,$3,$4,$5,NULL,$6,'MANUAL',$7,TRUE,$8,'DAILY',$9,$10)`,
          [employeeId, attendanceDate, clockIn, clockOut, hoursWorked,
           'PRESENT', comment, exception_type, attendanceDate, attendanceDate]
        );
        results.imported++;
        importedDates.push(attendanceDate);
      } catch (e) {
        results.errors.push({ row: rowNum, reason: e.message || 'Database insert failed' });
      }
    }

    if (importedDates.length > 0) {
      const sorted = importedDates.slice().sort();
      results.date_range = { min: sorted[0], max: sorted[sorted.length - 1] };
    }

    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

router.get('/attendance', authenticate, paginationMiddleware, async (req, res, next) => {
  try {
    const { pagination } = req;
    const { employee_id, date_from, date_to, pay_point_id, exception_filter, exception_type, dept_id, division_id, summary } = req.query;
    const VALID_EX_TYPES = ['COMPLIANT','LATE_ARRIVAL','EARLY_DEPARTURE','SHORT_TIME','MISSING_CLOCKING','ABNORMAL_HOURS'];

    if (summary === 'true') {
      const df = date_from || '2026-06-01';
      const dt = date_to || '2026-06-14';
      let where = 'WHERE ea.attendance_date BETWEEN $1 AND $2';
      const params = [df, dt];
      let pi = 3;
      if (employee_id) { where += ` AND e.id = $${pi}`; params.push(parseInt(employee_id, 10)); pi++; }
      if (pay_point_id) { where += ` AND e.pay_point_id = $${pi}`; params.push(parseInt(pay_point_id, 10)); pi++; }
      if (dept_id) { where += ` AND pos.department_id = $${pi}`; params.push(parseInt(dept_id, 10)); pi++; }
      if (division_id) { where += ` AND pos.division_id = $${pi}`; params.push(parseInt(division_id, 10)); pi++; }
      let havingClause = '';
      if (exception_type && VALID_EX_TYPES.includes(exception_type)) {
        havingClause = `HAVING COUNT(CASE WHEN ea.exception_type = '${exception_type}' THEN 1 END) > 0`;
      } else if (exception_filter === 'exceptions') {
        havingClause = "HAVING COUNT(CASE WHEN ea.exception_type NOT IN ('COMPLIANT') THEN 1 END) > 0";
      } else if (exception_filter === 'compliant') {
        havingClause = "HAVING COUNT(CASE WHEN ea.exception_type NOT IN ('COMPLIANT') THEN 1 END) = 0";
      }
      const sql = `
        SELECT
          e.id AS employee_id, e.employee_code, e.first_name, e.surname,
          COALESCE(e.working_hours_per_day, 8)::numeric AS hours_per_day,
          e.pay_point_id, pos.department_id, pos.division_id,
          MIN(ea.period_start_date)::text AS period_start,
          MAX(ea.period_end_date)::text AS period_end,
          COUNT(ea.id) AS days_recorded,
          COALESCE(SUM(ea.hours_worked), 0)::numeric AS time_worked,
          (COUNT(ea.id) * COALESCE(e.working_hours_per_day, 8))::numeric AS time_due,
          (COALESCE(SUM(ea.hours_worked), 0) - COUNT(ea.id) * COALESCE(e.working_hours_per_day, 8))::numeric AS variance,
          COUNT(CASE WHEN ea.exception_type IS NOT NULL AND ea.exception_type NOT IN ('COMPLIANT') THEN 1 END)::int AS exception_count,
          STRING_AGG(DISTINCT ea.exception_type, ', ') FILTER (WHERE ea.exception_type IS NOT NULL AND ea.exception_type NOT IN ('COMPLIANT')) AS exception_types,
          BOOL_OR(ea.manual_input) AS has_manual,
          COALESCE((SELECT SUM(lt.days * COALESCE(e.working_hours_per_day, 8)) FROM leave_transactions_legacy lt WHERE lt.employee_id = e.id AND lt.status = 'APPROVED' AND lt.start_date <= $2::date AND lt.end_date >= $1::date), 0)::numeric AS leave_approved_hours,
          COALESCE((SELECT SUM(ot.hours) FROM overtime_transactions ot WHERE ot.employee_id = e.id AND ot.status = 'APPROVED' AND ot.overtime_date BETWEEN $1::date AND $2::date), 0)::numeric AS approved_ot_hours
        FROM employee_attendance ea
        JOIN employees e ON ea.employee_id = e.id
        LEFT JOIN positions pos ON e.position_id = pos.id
        ${where}
        GROUP BY e.id, e.employee_code, e.first_name, e.surname, e.working_hours_per_day, e.pay_point_id, pos.department_id, pos.division_id
        ${havingClause}
        ORDER BY e.surname, e.first_name
      `;
      const countSql = `SELECT COUNT(*) FROM (${sql}) AS sub`;
      const [countRes, dataRes] = await Promise.all([
        dbQuery(countSql, params),
        dbQuery(sql + ` LIMIT $${pi} OFFSET $${pi + 1}`, [...params, pagination.limit, pagination.offset])
      ]);
      const total = parseInt(countRes.rows[0].count, 10);
      return res.json({ success: true, data: dataRes.rows, meta: { page: pagination.page, limit: pagination.limit, total, totalPages: Math.ceil(total / pagination.limit) } });
    }

    let whereClause = 'WHERE 1=1';
    const params = [];
    let pi = 1;
    if (employee_id) { whereClause += ` AND ea.employee_id = $${pi}`; params.push(parseInt(employee_id, 10)); pi++; }
    if (date_from) { whereClause += ` AND ea.attendance_date >= $${pi}`; params.push(date_from); pi++; }
    if (date_to) { whereClause += ` AND ea.attendance_date <= $${pi}`; params.push(date_to); pi++; }
    if (pay_point_id) { whereClause += ` AND e.pay_point_id = $${pi}`; params.push(parseInt(pay_point_id, 10)); pi++; }
    if (dept_id) { whereClause += ` AND pos.department_id = $${pi}`; params.push(parseInt(dept_id, 10)); pi++; }
    if (division_id) { whereClause += ` AND pos.division_id = $${pi}`; params.push(parseInt(division_id, 10)); pi++; }
    if (exception_type && VALID_EX_TYPES.includes(exception_type)) {
      whereClause += ` AND ea.exception_type = '${exception_type}'`;
    } else if (exception_filter === 'exceptions') {
      whereClause += ` AND ea.exception_type IS NOT NULL AND ea.exception_type != 'COMPLIANT'`;
    } else if (exception_filter === 'compliant') {
      whereClause += ` AND (ea.exception_type IS NULL OR ea.exception_type = 'COMPLIANT')`;
    }

    const posJoin = `LEFT JOIN positions pos ON e.position_id = pos.id`;
    const countResult = await dbQuery(`SELECT COUNT(*) FROM employee_attendance ea JOIN employees e ON ea.employee_id = e.id ${posJoin} ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);
    const result = await dbQuery(
      `SELECT ea.*, e.first_name, e.surname, e.employee_code, e.pay_point_id, ws.name AS shift_name, pos.department_id, pos.division_id
       FROM employee_attendance ea
       JOIN employees e ON ea.employee_id = e.id
       LEFT JOIN work_shifts ws ON ea.shift_id = ws.id
       ${posJoin}
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

function timeStrToMins(t) {
  if (!t) return null;
  const str = String(t);
  const parts = str.split(':');
  return parseInt(parts[0], 10) * 60 + (parseInt(parts[1], 10) || 0);
}

function detectException({ clock_in, clock_out, hours_worked, shift_start_time, shift_end_time, working_hours_per_day = 8, is_on_leave = false, input_mode = 'DAILY' }) {
  const hw = parseFloat(hours_worked) || 0;
  if (input_mode === 'PERIOD') return 'COMPLIANT';
  if (!clock_out) return 'MISSING_CLOCKING';
  if (hw > 14) return 'ABNORMAL_HOURS';
  if (clock_in) {
    const rawIn = String(clock_in).includes('T') ? String(clock_in).split('T')[1] : String(clock_in);
    const clockInMins = timeStrToMins(rawIn);
    const shiftStartMins = shift_start_time ? timeStrToMins(String(shift_start_time)) : 8 * 60;
    if (clockInMins !== null && clockInMins > shiftStartMins + 5) return 'LATE_ARRIVAL';
  }
  if (clock_out) {
    const rawOut = String(clock_out).includes('T') ? String(clock_out).split('T')[1] : String(clock_out);
    const clockOutMins = timeStrToMins(rawOut);
    const shiftEndMins = shift_end_time ? timeStrToMins(String(shift_end_time)) : 17 * 60;
    if (clockOutMins !== null && clockOutMins < shiftEndMins - 5) return 'EARLY_DEPARTURE';
  }
  const whpd = parseFloat(working_hours_per_day) || 8;
  if (hw > 0 && hw < (whpd - 0.5) && !is_on_leave) return 'SHORT_TIME';
  return 'COMPLIANT';
}

async function resolveExceptionContext(dbQuery, { employee_id, shift_id, attendance_date, input_mode }) {
  let shift_start_time = null, shift_end_time = null, working_hours_per_day = 8, is_on_leave = false;
  if (shift_id) {
    const sr = await dbQuery('SELECT shift_start_time, shift_end_time FROM work_shifts WHERE id=$1', [shift_id]);
    if (sr.rows.length) { shift_start_time = sr.rows[0].shift_start_time; shift_end_time = sr.rows[0].shift_end_time; }
  }
  if (employee_id) {
    const er = await dbQuery('SELECT working_hours_per_day FROM employees WHERE id=$1', [employee_id]);
    if (er.rows.length) working_hours_per_day = parseFloat(er.rows[0].working_hours_per_day) || 8;
    if (attendance_date && input_mode !== 'PERIOD') {
      const lr = await dbQuery(
        `SELECT id FROM leave_transactions_legacy WHERE employee_id=$1 AND status='APPROVED' AND start_date <= $2 AND end_date >= $2 LIMIT 1`,
        [employee_id, attendance_date]
      );
      is_on_leave = lr.rows.length > 0;
    }
  }
  return { shift_start_time, shift_end_time, working_hours_per_day, is_on_leave };
}

router.post('/attendance', authenticate, auditLog('CREATE', 'employee_attendance'), async (req, res, next) => {
  try {
    const { employee_id, attendance_date, clock_in, clock_out, shift_id, status, source,
      comment, input_mode, period_start_date, period_end_date, hours_worked: hwOverride } = req.body;
    let hours_worked = hwOverride || null;
    if (!hours_worked && clock_in && clock_out) {
      hours_worked = ((new Date(clock_out) - new Date(clock_in)) / 3600000).toFixed(2);
    }
    const ctx = await resolveExceptionContext(dbQuery, { employee_id, shift_id, attendance_date, input_mode: input_mode || 'DAILY' });
    const exception_type = detectException({ clock_in, clock_out, hours_worked, ...ctx, input_mode: input_mode || 'DAILY' });
    const result = await dbQuery(
      `INSERT INTO employee_attendance
         (employee_id, attendance_date, clock_in, clock_out, hours_worked, shift_id, status, source,
          comment, manual_input, exception_type, input_mode, period_start_date, period_end_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE,$10,$11,$12,$13) RETURNING *`,
      [employee_id, attendance_date, clock_in || null, clock_out || null, hours_worked,
       shift_id || null, status || 'PRESENT', source || 'MANUAL',
       comment || null, exception_type, input_mode || 'DAILY',
       period_start_date || attendance_date || null, period_end_date || attendance_date || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/attendance/summary', authenticate, paginationMiddleware, async (req, res, next) => {
  try {
    const { pagination } = req;
    const { date_from = '2026-06-01', date_to = '2026-06-14', employee_id, exception_filter, exception_type, pay_point_id, dept_id, division_id } = req.query;
    const VALID_EX_TYPES_S = ['COMPLIANT','LATE_ARRIVAL','EARLY_DEPARTURE','SHORT_TIME','MISSING_CLOCKING','ABNORMAL_HOURS'];
    let where = 'WHERE ea.attendance_date BETWEEN $1 AND $2';
    const params = [date_from, date_to];
    let pi = 3;
    if (employee_id) { where += ` AND e.id = $${pi}`; params.push(parseInt(employee_id, 10)); pi++; }
    if (pay_point_id) { where += ` AND e.pay_point_id = $${pi}`; params.push(parseInt(pay_point_id, 10)); pi++; }
    if (dept_id) { where += ` AND pos.department_id = $${pi}`; params.push(parseInt(dept_id, 10)); pi++; }
    if (division_id) { where += ` AND pos.division_id = $${pi}`; params.push(parseInt(division_id, 10)); pi++; }

    let havingClause = '';
    if (exception_type && VALID_EX_TYPES_S.includes(exception_type)) {
      havingClause = `HAVING COUNT(CASE WHEN ea.exception_type = '${exception_type}' THEN 1 END) > 0`;
    } else if (exception_filter === 'exceptions') {
      havingClause = "HAVING COUNT(CASE WHEN ea.exception_type NOT IN ('COMPLIANT') THEN 1 END) > 0";
    } else if (exception_filter === 'compliant') {
      havingClause = "HAVING COUNT(CASE WHEN ea.exception_type NOT IN ('COMPLIANT') THEN 1 END) = 0";
    }

    const sql = `
      SELECT
        e.id AS employee_id, e.employee_code, e.first_name, e.surname,
        COALESCE(e.working_hours_per_day, 8)::numeric AS hours_per_day,
        e.pay_point_id, pos.department_id, pos.division_id,
        MIN(ea.period_start_date)::text AS period_start,
        MAX(ea.period_end_date)::text AS period_end,
        COUNT(ea.id) AS days_recorded,
        COALESCE(SUM(ea.hours_worked), 0)::numeric AS time_worked,
        (COUNT(ea.id) * COALESCE(e.working_hours_per_day, 8))::numeric AS time_due,
        (COALESCE(SUM(ea.hours_worked), 0) - COUNT(ea.id) * COALESCE(e.working_hours_per_day, 8))::numeric AS variance,
        COUNT(CASE WHEN ea.exception_type IS NOT NULL AND ea.exception_type NOT IN ('COMPLIANT') THEN 1 END)::int AS exception_count,
        STRING_AGG(DISTINCT ea.exception_type, ', ') FILTER (WHERE ea.exception_type IS NOT NULL AND ea.exception_type NOT IN ('COMPLIANT')) AS exception_types,
        BOOL_OR(ea.manual_input) AS has_manual,
        COALESCE((
          SELECT SUM(lt.days * COALESCE(e.working_hours_per_day, 8))
          FROM leave_transactions_legacy lt
          WHERE lt.employee_id = e.id AND lt.status = 'APPROVED'
            AND lt.start_date <= $2::date AND lt.end_date >= $1::date
        ), 0)::numeric AS leave_approved_hours,
        COALESCE((
          SELECT SUM(ot.hours)
          FROM overtime_transactions ot
          WHERE ot.employee_id = e.id AND ot.status = 'APPROVED'
            AND ot.overtime_date BETWEEN $1::date AND $2::date
        ), 0)::numeric AS approved_ot_hours
      FROM employee_attendance ea
      JOIN employees e ON ea.employee_id = e.id
      LEFT JOIN positions pos ON e.position_id = pos.id
      ${where}
      GROUP BY e.id, e.employee_code, e.first_name, e.surname, e.working_hours_per_day, e.pay_point_id, pos.department_id, pos.division_id
      ${havingClause}
      ORDER BY e.surname, e.first_name
    `;

    const countSql = `SELECT COUNT(*) FROM (${sql}) AS sub`;
    const [countRes, dataRes] = await Promise.all([
      dbQuery(countSql, params),
      dbQuery(sql + ` LIMIT $${pi} OFFSET $${pi + 1}`, [...params, pagination.limit, pagination.offset])
    ]);
    const total = parseInt(countRes.rows[0].count, 10);
    res.json({ success: true, data: dataRes.rows, meta: { page: pagination.page, limit: pagination.limit, total, totalPages: Math.ceil(total / pagination.limit) } });
  } catch (err) { next(err); }
});

router.get('/attendance/export', authenticate, async (req, res, next) => {
  try {
    const { date_from = '2026-06-01', date_to = '2026-06-14', employee_id, exception_filter, exception_type, pay_point_id, dept_id, division_id } = req.query;
    const VALID_EX_TYPES_E = ['COMPLIANT','LATE_ARRIVAL','EARLY_DEPARTURE','SHORT_TIME','MISSING_CLOCKING','ABNORMAL_HOURS'];
    let where = 'WHERE ea.attendance_date BETWEEN $1 AND $2';
    const params = [date_from, date_to];
    let pi = 3;
    if (employee_id) { where += ` AND e.id = $${pi}`; params.push(parseInt(employee_id, 10)); pi++; }
    if (pay_point_id) { where += ` AND e.pay_point_id = $${pi}`; params.push(parseInt(pay_point_id, 10)); pi++; }
    if (dept_id) { where += ` AND pos.department_id = $${pi}`; params.push(parseInt(dept_id, 10)); pi++; }
    if (division_id) { where += ` AND pos.division_id = $${pi}`; params.push(parseInt(division_id, 10)); pi++; }
    let havingClause = '';
    if (exception_type && VALID_EX_TYPES_E.includes(exception_type)) {
      havingClause = `HAVING COUNT(CASE WHEN ea.exception_type = '${exception_type}' THEN 1 END) > 0`;
    } else if (exception_filter === 'exceptions') {
      havingClause = "HAVING COUNT(CASE WHEN ea.exception_type NOT IN ('COMPLIANT') THEN 1 END) > 0";
    } else if (exception_filter === 'compliant') {
      havingClause = "HAVING COUNT(CASE WHEN ea.exception_type NOT IN ('COMPLIANT') THEN 1 END) = 0";
    }

    const rows = await dbQuery(`
      SELECT
        e.id AS employee_id, e.employee_code, e.first_name, e.surname,
        pos.department_id, pos.division_id,
        MIN(ea.period_start_date)::text AS period_start, MAX(ea.period_end_date)::text AS period_end,
        COUNT(ea.id) AS days_recorded,
        COALESCE(SUM(ea.hours_worked), 0)::numeric AS time_worked,
        (COUNT(ea.id) * COALESCE(e.working_hours_per_day, 8))::numeric AS time_due,
        (COALESCE(SUM(ea.hours_worked), 0) - COUNT(ea.id) * COALESCE(e.working_hours_per_day, 8))::numeric AS variance,
        COUNT(CASE WHEN ea.exception_type IS NOT NULL AND ea.exception_type NOT IN ('COMPLIANT') THEN 1 END)::int AS exception_count,
        STRING_AGG(DISTINCT ea.exception_type, ' / ') FILTER (WHERE ea.exception_type IS NOT NULL AND ea.exception_type NOT IN ('COMPLIANT')) AS exception_types,
        COALESCE((SELECT SUM(lt.days * COALESCE(e.working_hours_per_day, 8)) FROM leave_transactions_legacy lt WHERE lt.employee_id = e.id AND lt.status = 'APPROVED' AND lt.start_date <= $2::date AND lt.end_date >= $1::date), 0)::numeric AS leave_approved_hours,
        COALESCE((SELECT SUM(ot.hours) FROM overtime_transactions ot WHERE ot.employee_id = e.id AND ot.status = 'APPROVED' AND ot.overtime_date BETWEEN $1::date AND $2::date), 0)::numeric AS approved_ot_hours,
        CASE WHEN BOOL_OR(ea.manual_input) THEN 'MANUAL' ELSE 'BIOMETRIC' END AS source
      FROM employee_attendance ea
      JOIN employees e ON ea.employee_id = e.id
      LEFT JOIN positions pos ON e.position_id = pos.id
      ${where}
      GROUP BY e.id, e.employee_code, e.first_name, e.surname, e.working_hours_per_day, pos.department_id, pos.division_id
      ${havingClause}
      ORDER BY e.surname, e.first_name
    `, params);

    const ExcelJS = require('exceljs');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Attendance Summary');
    ws.columns = [
      { header: 'Emp ID', key: 'employee_id', width: 10 },
      { header: 'Code', key: 'employee_code', width: 12 },
      { header: 'First Name', key: 'first_name', width: 18 },
      { header: 'Surname', key: 'surname', width: 18 },
      { header: 'Period Start', key: 'period_start', width: 14 },
      { header: 'Period End', key: 'period_end', width: 14 },
      { header: 'Days Recorded', key: 'days_recorded', width: 14 },
      { header: 'Time Due (hrs)', key: 'time_due', width: 14 },
      { header: 'Time Worked (hrs)', key: 'time_worked', width: 16 },
      { header: 'Leave Approved (hrs)', key: 'leave_approved_hours', width: 18 },
      { header: 'Approved OT (hrs)', key: 'approved_ot_hours', width: 16 },
      { header: 'Over/Under (hrs)', key: 'variance', width: 16 },
      { header: 'Exceptions', key: 'exception_types', width: 30 },
      { header: 'Exception Count', key: 'exception_count', width: 14 },
      { header: 'Source', key: 'source', width: 12 },
    ];
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2B46' } };
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    for (const r of rows.rows) {
      ws.addRow({
        ...r,
        time_due: r.time_due ? parseFloat(r.time_due).toFixed(1) : '0.0',
        time_worked: r.time_worked ? parseFloat(r.time_worked).toFixed(1) : '0.0',
        variance: r.variance ? parseFloat(r.variance).toFixed(1) : '0.0',
        leave_approved_hours: r.leave_approved_hours ? parseFloat(r.leave_approved_hours).toFixed(1) : '0.0',
        approved_ot_hours: r.approved_ot_hours ? parseFloat(r.approved_ot_hours).toFixed(1) : '0.0',
        exception_types: r.exception_types || 'Compliant',
      });
    }
    ws.columns.forEach(col => { if (col.key !== 'exception_types') col.alignment = { horizontal: 'center' }; });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_summary_${date_from}_${date_to}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
});

router.get('/attendance/:employee_id/daily', authenticate, async (req, res, next) => {
  try {
    const employee_id = parseInt(req.params.employee_id, 10);
    const { date_from = '2026-06-01', date_to = '2026-06-14' } = req.query;
    const result = await dbQuery(
      `SELECT ea.*,
        ws.name AS shift_name, ws.shift_start_time, ws.shift_end_time,
        CASE
          WHEN ws.shift_start_time IS NOT NULL AND ws.shift_end_time IS NOT NULL
          THEN ROUND(EXTRACT(EPOCH FROM (ws.shift_end_time - ws.shift_start_time))/3600, 2)
          ELSE COALESCE(e.working_hours_per_day, 8)
        END AS shift_working_hrs,
        CASE
          WHEN ea.hours_worked IS NOT NULL AND ws.shift_start_time IS NOT NULL AND ws.shift_end_time IS NOT NULL
          THEN ROUND(ea.hours_worked - EXTRACT(EPOCH FROM (ws.shift_end_time - ws.shift_start_time))/3600, 2)
          WHEN ea.hours_worked IS NOT NULL
          THEN ROUND(ea.hours_worked - COALESCE(e.working_hours_per_day, 8), 2)
          ELSE NULL
        END AS hrs_variance,
        CASE WHEN EXISTS (
          SELECT 1 FROM leave_transactions_legacy lt
          WHERE lt.employee_id = ea.employee_id AND lt.status = 'APPROVED'
            AND lt.start_date <= ea.attendance_date AND lt.end_date >= ea.attendance_date
        ) THEN 'APPROVED' ELSE NULL END AS leave_status
       FROM employee_attendance ea
       LEFT JOIN work_shifts ws ON ea.shift_id = ws.id
       JOIN employees e ON ea.employee_id = e.id
       WHERE ea.employee_id = $1 AND ea.attendance_date BETWEEN $2 AND $3
       ORDER BY ea.attendance_date ASC`,
      [employee_id, date_from, date_to]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.put('/attendance/:id', authenticate, auditLog('UPDATE', 'employee_attendance'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await dbQuery('SELECT id, source, manual_input, shift_id, employee_id, input_mode FROM employee_attendance WHERE id=$1', [parseInt(id, 10)]);
    if (!existing.rows.length) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Record not found' } });
    const rec = existing.rows[0];
    const { clock_in, clock_out, hours_worked: hwOverride, comment, shift_id, status } = req.body;

    if (rec.source === 'BIOMETRIC') {
      const result = await dbQuery(`UPDATE employee_attendance SET comment=$1 WHERE id=$2 RETURNING *`, [comment || null, parseInt(id, 10)]);
      return res.json({ success: true, data: result.rows[0] });
    }

    let hours_worked = hwOverride || null;
    if (!hours_worked && clock_in && clock_out) {
      hours_worked = ((new Date(clock_out) - new Date(clock_in)) / 3600000).toFixed(2);
    }
    const usedShiftId = shift_id || rec.shift_id;
    const ctx = await resolveExceptionContext(dbQuery, { employee_id: rec.employee_id, shift_id: usedShiftId, attendance_date: null, input_mode: rec.input_mode || 'DAILY' });
    const exception_type = detectException({ clock_in, clock_out, hours_worked, ...ctx, input_mode: rec.input_mode || 'DAILY' });

    const result = await dbQuery(
      `UPDATE employee_attendance
       SET clock_in=$1, clock_out=$2, hours_worked=$3, comment=$4, shift_id=$5, status=$6, exception_type=$7
       WHERE id=$8 RETURNING *`,
      [clock_in || null, clock_out || null, hours_worked, comment || null,
       usedShiftId || null, status || 'PRESENT', exception_type, parseInt(id, 10)]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/shifts', authenticate, async (req, res, next) => {
  try {
    const { enabled } = req.query;
    let sql = 'SELECT * FROM work_shifts';
    const params = [];
    if (enabled !== undefined) { sql += ' WHERE enabled = $1'; params.push(enabled === 'true'); }
    sql += ' ORDER BY name';
    const result = await dbQuery(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/shifts', authenticate, auditLog('CREATE', 'work_shifts'), async (req, res, next) => {
  try {
    const { name, short_description, shift_start_time, shift_end_time, total_hours,
      night_hours, color, has_break, break_start_time, break_end_time, break_hours,
      break_duration_minutes, is_night_shift, enabled, start_date, end_date } = req.body;
    const errs = [];
    if (!name?.trim()) errs.push('name is required');
    if (!start_date) errs.push('start_date is required');
    if (!shift_start_time) errs.push('shift_start_time is required');
    if (!shift_end_time) errs.push('shift_end_time is required');
    if (has_break && !break_start_time) errs.push('break_start_time required when break is enabled');
    if (has_break && !break_end_time) errs.push('break_end_time required when break is enabled');
    if (errs.length) return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: errs.join('; ') } });
    const userId = req.user?.id || null;
    const result = await dbQuery(
      `INSERT INTO work_shifts (name, short_description, shift_start_time, shift_end_time, total_hours,
         night_hours, color, has_break, break_start_time, break_end_time, break_hours,
         break_duration_minutes, is_night_shift, enabled, start_date, end_date, created_by, updated_at, updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW(),$17) RETURNING *`,
      [name.trim(), short_description || null, shift_start_time, shift_end_time,
       total_hours || null, night_hours || 0, color || '#1976D2',
       has_break ?? false, has_break ? break_start_time : null, has_break ? break_end_time : null,
       has_break ? (break_hours || 0) : 0, has_break ? (break_duration_minutes || 0) : 0,
       is_night_shift ?? false, enabled ?? true, start_date, end_date || null, userId]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/shifts/:id', authenticate, auditLog('UPDATE', 'work_shifts'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, short_description, shift_start_time, shift_end_time, total_hours,
      night_hours, color, has_break, break_start_time, break_end_time, break_hours,
      break_duration_minutes, is_night_shift, enabled, start_date, end_date } = req.body;
    const errs = [];
    if (!name?.trim()) errs.push('name is required');
    if (!start_date) errs.push('start_date is required');
    if (!shift_start_time) errs.push('shift_start_time is required');
    if (!shift_end_time) errs.push('shift_end_time is required');
    if (has_break && !break_start_time) errs.push('break_start_time required when break is enabled');
    if (has_break && !break_end_time) errs.push('break_end_time required when break is enabled');
    if (errs.length) return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: errs.join('; ') } });
    const userId = req.user?.id || null;
    const result = await dbQuery(
      `UPDATE work_shifts SET name=$1, short_description=$2, shift_start_time=$3, shift_end_time=$4, total_hours=$5,
         night_hours=$6, color=$7, has_break=$8, break_start_time=$9, break_end_time=$10, break_hours=$11,
         break_duration_minutes=$12, is_night_shift=$13, enabled=$14, start_date=$15, end_date=$16,
         updated_at=NOW(), updated_by=$17 WHERE id=$18 RETURNING *`,
      [name.trim(), short_description || null, shift_start_time, shift_end_time,
       total_hours || null, night_hours || 0, color || '#1976D2',
       has_break ?? false, has_break ? break_start_time : null, has_break ? break_end_time : null,
       has_break ? (break_hours || 0) : 0, has_break ? (break_duration_minutes || 0) : 0,
       is_night_shift ?? false, enabled ?? true, start_date, end_date || null, userId, parseInt(id, 10)]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Shift not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/shifts/:id', authenticate, auditLog('DELETE', 'work_shifts'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;
    const result = await dbQuery(
      'UPDATE work_shifts SET enabled=FALSE, updated_at=NOW(), updated_by=$1 WHERE id=$2 RETURNING *',
      [userId, parseInt(id, 10)]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Shift not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/overtime', authenticate, (req, res) => {
  res.status(301).json({ success: false, error: { code: 'MOVED', message: 'Overtime management has moved to /api/v1/overtime' } });
});

router.post('/overtime', authenticate, (req, res) => {
  res.status(301).json({ success: false, error: { code: 'MOVED', message: 'Overtime management has moved to /api/v1/overtime' } });
});

router.post('/overtime/:id/approve', authenticate, (req, res) => {
  res.status(301).json({ success: false, error: { code: 'MOVED', message: 'Overtime management has moved to /api/v1/overtime' } });
});

router.get('/claims/can-approve', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id || 0;
    const userRoles = req.user?.roles || [];

    const claimDefinitions = await dbQuery(
      `SELECT steps FROM workflow_definitions WHERE entity_type = 'CLAIM' AND enabled = TRUE`
    );

    if (claimDefinitions.rows.length === 0) {
      return res.json({ success: true, data: { canApprove: true, mode: 'direct' } });
    }

    for (const def of claimDefinitions.rows) {
      const steps = def.steps || [];
      for (const step of steps) {
        const assignedUsers = step.assigned_users || [];
        if (assignedUsers.includes(userId)) {
          return res.json({ success: true, data: { canApprove: true, mode: 'workflow' } });
        }
        if (step.assigned_role) {
          const normalizedStepRole = step.assigned_role.toLowerCase().replace(/[\s_-]+/g, '_');
          const hasRole = userRoles.some(r => {
            const normalizedUserRole = String(r).toLowerCase().replace(/[\s_-]+/g, '_');
            return normalizedUserRole === normalizedStepRole;
          });
          if (hasRole) {
            return res.json({ success: true, data: { canApprove: true, mode: 'workflow' } });
          }
        }
      }
    }

    const delegations = await dbQuery(
      `SELECT from_user FROM delegations WHERE to_user = $1 AND active = TRUE
       AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE
       AND (module = 'CLAIM' OR module IS NULL)`,
      [userId]
    );
    if (delegations.rows.length > 0) {
      for (const def of claimDefinitions.rows) {
        const steps = def.steps || [];
        for (const step of steps) {
          const assignedUsers = step.assigned_users || [];
          for (const del of delegations.rows) {
            if (assignedUsers.includes(del.from_user)) {
              return res.json({ success: true, data: { canApprove: true, mode: 'workflow' } });
            }
          }
        }
      }
    }

    return res.json({ success: true, data: { canApprove: false, mode: 'workflow' } });
  } catch (err) { next(err); }
});

router.get('/claims', authenticate, paginationMiddleware, async (req, res, next) => {
  try {
    const { pagination } = req;
    const { employee_id, status, claim_type, tab, department_id, division_id } = req.query;
    const isProcessed = tab === 'processed';
    let whereClause = 'WHERE 1=1';
    const params = [];
    let pi = 1;

    if (isProcessed) {
      whereClause += ` AND c.status = 'PAID'`;
    } else {
      whereClause += ` AND c.status != 'PAID'`;
    }

    if (employee_id) {
      whereClause += ` AND c.employee_id = $${pi}`;
      params.push(parseInt(employee_id, 10));
      pi++;
    }
    if (status && !(isProcessed)) {
      whereClause += ` AND c.status = $${pi}`;
      params.push(status);
      pi++;
    }
    if (claim_type) {
      whereClause += ` AND c.claim_type = $${pi}`;
      params.push(claim_type);
      pi++;
    }
    if (department_id) {
      const deptId = parseInt(department_id, 10);
      if (isNaN(deptId)) return res.status(400).json({ success: false, error: { code: 'INVALID_PARAM', message: 'department_id must be a number' } });
      whereClause += ` AND pos.department_id = $${pi}`;
      params.push(deptId);
      pi++;
    }
    if (division_id) {
      const divId = parseInt(division_id, 10);
      if (isNaN(divId)) return res.status(400).json({ success: false, error: { code: 'INVALID_PARAM', message: 'division_id must be a number' } });
      whereClause += ` AND pos.division_id = $${pi}`;
      params.push(divId);
      pi++;
    }

    const posJoin = (department_id || division_id) ? `LEFT JOIN positions pos ON e.position_id = pos.id` : '';
    const countResult = await dbQuery(`SELECT COUNT(*) FROM claims c JOIN employees e ON c.employee_id = e.id ${posJoin} ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    let selectFields = `c.*, e.first_name, e.surname, e.employee_code, e.payroll_cycle_id`;
    let joins = `JOIN employees e ON c.employee_id = e.id`;
    if (department_id || division_id) {
      joins += ` LEFT JOIN positions pos ON e.position_id = pos.id`;
    }
    if (isProcessed) {
      selectFields += `, pp.processing_month AS period_name, pc.name AS cycle_name`;
      joins += ` LEFT JOIN payroll_periods pp ON c.period_id = pp.id LEFT JOIN payroll_cycles pc ON pp.cycle_id = pc.id`;
    }

    const result = await dbQuery(
      `SELECT ${selectFields}
       FROM claims c ${joins}
       ${whereClause} ORDER BY c.updated_at DESC LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, pagination.limit, pagination.offset]
    );

    const pendingIds = result.rows.filter(r => r.status === 'PENDING').map(r => r.id);
    if (pendingIds.length > 0) {
      const { getWorkflowStatusBatch } = require('../services/transaction-approval.service');
      const wfMap = await getWorkflowStatusBatch('CLAIM', pendingIds);
      for (const row of result.rows) {
        const wf = wfMap[row.id];
        if (wf) {
          row.workflow_level = wf.currentStep;
          row.workflow_total = wf.totalSteps;
        }
      }
    }

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

async function findDuplicateClaims(employeeId, claimType, startDate, endDate, excludeClaimId) {
  const activeStatuses = "('PENDING','APPROVED','PAID')";
  let sql, params;

  if (claimType === 'S_AND_T') {
    const effectiveEnd = endDate || startDate;
    sql = `SELECT id, claim_type, sub_type, start_date, end_date, amount, status
           FROM claims
           WHERE employee_id = $1 AND claim_type = $2
             AND status IN ${activeStatuses}
             AND start_date <= $4::date
             AND COALESCE(end_date, start_date) >= $3::date
             ${excludeClaimId ? 'AND id != $5' : ''}
           ORDER BY start_date LIMIT 5`;
    params = excludeClaimId
      ? [employeeId, claimType, startDate, effectiveEnd, excludeClaimId]
      : [employeeId, claimType, startDate, effectiveEnd];
  } else {
    sql = `SELECT id, claim_type, sub_type, start_date, end_date, amount, status
           FROM claims
           WHERE employee_id = $1 AND claim_type = $2
             AND status IN ${activeStatuses}
             AND start_date = $3::date
             ${excludeClaimId ? 'AND id != $4' : ''}
           ORDER BY start_date LIMIT 5`;
    params = excludeClaimId
      ? [employeeId, claimType, startDate, excludeClaimId]
      : [employeeId, claimType, startDate];
  }

  const result = await dbQuery(sql, params);
  return result.rows;
}

router.get('/claims/check-duplicate', authenticate, async (req, res, next) => {
  try {
    const { employee_id, claim_type, start_date, end_date, exclude_claim_id } = req.query;
    if (!employee_id || !claim_type || !start_date) {
      return res.status(400).json({ success: false, error: { message: 'employee_id, claim_type, and start_date are required' } });
    }
    const conflicts = await findDuplicateClaims(
      parseInt(employee_id, 10), claim_type, start_date, end_date || null,
      exclude_claim_id ? parseInt(exclude_claim_id, 10) : null
    );
    res.json({ success: true, data: { has_conflict: conflicts.length > 0, conflicts } });
  } catch (err) {
    next(err);
  }
});

async function calculateClaimAmount(claimType, subType, kilometres, startDate, endDate) {
  const typeMap = { TRAVEL: 'Travel', S_AND_T: 'S & T' };
  const mappedType = typeMap[claimType] || claimType;

  const configResult = await dbQuery(
    `SELECT cc.client_policy, spr.rate AS sars_rate
     FROM claim_configurations cc
     LEFT JOIN sars_prescribed_rates spr ON cc.sars_prescribed_rate_id = spr.id
     WHERE cc.claim_type = $1
       AND (cc.end_date IS NULL OR cc.end_date >= CURRENT_DATE)
       AND ($2::text IS NULL OR cc.claim_subtype = $2 OR CONCAT(cc.claim_type, ' - ', cc.claim_subtype) = $2)
     ORDER BY cc.effective_date DESC LIMIT 1`,
    [mappedType, subType || null]
  );

  if (configResult.rows.length === 0) return null;

  const config = configResult.rows[0];
  const rate = config.client_policy ? parseFloat(config.client_policy) : (config.sars_rate ? parseFloat(config.sars_rate) : 0);
  if (rate <= 0) return null;

  if (claimType === 'TRAVEL') {
    const km = parseFloat(kilometres) || 0;
    if (km <= 0) return null;
    return parseFloat((km * rate).toFixed(2));
  }

  if (claimType === 'S_AND_T' && startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return null;
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return parseFloat((days * rate).toFixed(2));
  }

  return null;
}

router.post('/claims', authenticate, claimUpload.single('document'), auditLog('CREATE', 'claim'), async (req, res, next) => {
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

    const serverAmount = await calculateClaimAmount(claim_type, sub_type, kilometres, start_date, end_date);
    const finalAmount = serverAmount || parseFloat(amount);

    const duplicates = await findDuplicateClaims(parseInt(employee_id, 10), claim_type, start_date, end_date || null, null);
    if (duplicates.length > 0) {
      if (req.file) try { fs.unlinkSync(path.join(claimsUploadDir, req.file.filename)); } catch (_) {}
      const conflictIds = duplicates.map(d => '#' + d.id).join(', ');
      return res.status(409).json({ success: false, error: { message: `Duplicate claim detected. Conflicting claim(s): ${conflictIds}. A ${claim_type === 'S_AND_T' ? 'S & T' : 'Travel'} claim with overlapping dates already exists for this employee.`, duplicates } });
    }

    const documentPath = req.file ? `claims/${req.file.filename}` : null;

    const client = await getClient();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `INSERT INTO claims (employee_id, claim_type, sub_type, start_date, end_date, amount, kilometres, reason, reference_no, document_path, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [employee_id, claim_type, sub_type, start_date, end_date || null, finalAmount, kilometres || null, reason, reference_no || null, documentPath, userId]
      );
      await client.query('COMMIT');

      const { checkAutoApprove, writeHistory } = require('../services/transaction-approval.service');
      await writeHistory('CLAIM', result.rows[0].id, 'SUBMITTED', userId, reason || null, null, 'PENDING');
      try {
        const autoApproved = await checkAutoApprove('CLAIM', result.rows[0].id, userId, parseInt(employee_id));
        if (autoApproved) {
          const updated = await dbQuery('SELECT * FROM claims WHERE id = $1', [result.rows[0].id]);
          return res.status(201).json({ success: true, data: updated.rows[0], message: 'Claim auto-approved (no workflow configured).' });
        }
      } catch (wfErr) {
        console.warn('Workflow init warning for CLAIM', result.rows[0].id, ':', wfErr.message);
      }

      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (txErr) {
      await client.query('ROLLBACK');
      if (documentPath) try { fs.unlinkSync(path.join(claimsUploadDir, req.file.filename)); } catch (_) {}
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

router.put('/claims/:id', authenticate, auditLog('UPDATE', 'claim'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: { message: 'Authentication required' } });

    const claim = await dbQuery('SELECT * FROM claims WHERE id = $1', [id]);
    if (!claim.rows.length) return res.status(404).json({ success: false, error: { message: 'Claim not found' } });
    if (claim.rows[0].status !== 'PENDING') return res.status(400).json({ success: false, error: { message: 'Only pending claims can be edited' } });
    if (!claim.rows[0].created_by || claim.rows[0].created_by !== userId) {
      return res.status(403).json({ success: false, error: { message: 'Only the original capturer can edit a pending claim' } });
    }

    const { claim_type, sub_type, start_date, end_date, amount, kilometres, reason, reference_no } = req.body;

    const effectiveType = claim_type || claim.rows[0].claim_type;
    const effectiveStart = start_date || claim.rows[0].start_date;
    const effectiveEnd = end_date || (end_date === null ? null : claim.rows[0].end_date);
    const effectiveEmpId = claim.rows[0].employee_id;

    if (effectiveType === 'TRAVEL' && kilometres && parseFloat(kilometres) <= 0) {
      return res.status(400).json({ success: false, error: { message: 'Kilometres must be greater than 0 for Travel claims' } });
    }
    if (amount && parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, error: { message: 'Amount must be greater than 0' } });
    }

    const duplicates = await findDuplicateClaims(effectiveEmpId, effectiveType, effectiveStart, effectiveEnd, parseInt(id, 10));
    if (duplicates.length > 0) {
      const conflictIds = duplicates.map(d => '#' + d.id).join(', ');
      return res.status(409).json({ success: false, error: { message: `Duplicate claim detected. Conflicting claim(s): ${conflictIds}. A ${effectiveType === 'S_AND_T' ? 'S & T' : 'Travel'} claim with overlapping dates already exists for this employee.`, duplicates } });
    }

    const effectiveKm = kilometres || claim.rows[0].kilometres;
    const effectiveSubType = sub_type || claim.rows[0].sub_type;
    const serverAmount = await calculateClaimAmount(effectiveType, effectiveSubType, effectiveKm, effectiveStart, effectiveEnd);
    const finalAmount = serverAmount || (amount ? parseFloat(amount) : null);

    const client = await getClient();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `UPDATE claims SET claim_type = COALESCE($1, claim_type), sub_type = COALESCE($2, sub_type),
         start_date = COALESCE($3, start_date), end_date = $4, amount = COALESCE($5, amount),
         kilometres = $6, reason = $7, reference_no = $8, updated_at = NOW()
         WHERE id = $9 RETURNING *`,
        [claim_type, sub_type, start_date, end_date || null, finalAmount, kilometres || null, reason || null, reference_no || null, id]
      );
      await client.query(
        `INSERT INTO claim_history (claim_id, action, performed_by, comments) VALUES ($1, 'EDITED', $2, $3)`,
        [id, userId, 'Claim edited while pending']
      );

      const wfInstance = await client.query(
        `SELECT id FROM workflow_instances
         WHERE entity_type = 'CLAIM' AND entity_id = $1 AND status IN ('PENDING','IN_PROGRESS')`, [id]
      );
      if (wfInstance.rows.length > 0) {
        const wiId = wfInstance.rows[0].id;
        await client.query(
          `UPDATE workflow_steps SET status = 'WAITING', actioned_by = NULL, actioned_at = NULL, comments = NULL
           WHERE instance_id = $1 AND step_number > 1`, [wiId]
        );
        await client.query(
          `UPDATE workflow_steps SET status = 'PENDING', actioned_by = NULL, actioned_at = NULL, comments = NULL
           WHERE instance_id = $1 AND step_number = 1`, [wiId]
        );
        await client.query(
          `UPDATE workflow_instances SET current_step = 1, status = 'PENDING' WHERE id = $1`, [wiId]
        );
      }

      await client.query('COMMIT');
      res.json({ success: true, data: result.rows[0] });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

router.patch('/claims/:id/approve', authenticate, auditLog('UPDATE', 'claim'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: { message: 'Authentication required' } });

    const { handleApproval } = require('../services/transaction-approval.service');
    const result = await handleApproval('CLAIM', parseInt(id), userId, req.user?.roles || [], req.body.comments || null);

    if (!result.success) {
      return res.status(result.status || 500).json({ success: false, error: { message: result.error } });
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.patch('/claims/:id/reject', authenticate, auditLog('UPDATE', 'claim'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: { message: 'Authentication required' } });

    const { handleRejection } = require('../services/transaction-approval.service');
    const result = await handleRejection('CLAIM', parseInt(id), userId, req.user?.roles || [], req.body.comments);

    if (!result.success) {
      return res.status(result.status || 500).json({ success: false, error: { message: result.error } });
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/claims/bulk-approve', authenticate, async (req, res, next) => {
  try {
    const { claim_ids } = req.body;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: { message: 'Authentication required' } });
    if (!Array.isArray(claim_ids) || claim_ids.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'claim_ids array is required' } });
    }

    const { handleApproval } = require('../services/transaction-approval.service');
    let approved = 0, stepped = 0, skipped = 0;
    const skipReasons = {};

    for (const claimId of claim_ids) {
      try {
        const result = await handleApproval('CLAIM', claimId, userId, req.user?.roles || [], 'Bulk approved');
        if (!result.success) {
          skipped++;
          const reason = result.error || 'Unknown error';
          skipReasons[reason] = (skipReasons[reason] || 0) + 1;
          continue;
        }
        if (result.finalApproval) { approved++; } else { stepped++; }
      } catch (err) {
        console.warn('Bulk approve error for claim', claimId, err.message);
        skipped++;
        const reason = err.message || 'Unknown error';
        skipReasons[reason] = (skipReasons[reason] || 0) + 1;
      }
    }

    res.json({ success: true, data: { approved, stepped, skipped, total: claim_ids.length, skipReasons } });
  } catch (err) {
    next(err);
  }
});

router.post('/claims/bulk-reject', authenticate, async (req, res, next) => {
  try {
    const { claim_ids, comments } = req.body;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: { message: 'Authentication required' } });
    if (!Array.isArray(claim_ids) || claim_ids.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'claim_ids array is required' } });
    }
    if (!comments || !comments.trim()) {
      return res.status(400).json({ success: false, error: { message: 'Comments are required for rejection' } });
    }

    const { handleRejection } = require('../services/transaction-approval.service');
    let rejected = 0, skipped = 0;

    for (const claimId of claim_ids) {
      try {
        const result = await handleRejection('CLAIM', claimId, userId, req.user?.roles || [], comments.trim());
        if (result.success) { rejected++; } else { skipped++; }
      } catch (err) {
        console.warn('Bulk reject error for claim', claimId, err.message);
        skipped++;
      }
    }

    res.json({ success: true, data: { rejected, skipped, total: claim_ids.length } });
  } catch (err) {
    next(err);
  }
});

router.post('/claims/bulk-return', authenticate, async (req, res, next) => {
  try {
    const { claim_ids, comments } = req.body;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: { message: 'Authentication required' } });
    if (!Array.isArray(claim_ids) || claim_ids.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'claim_ids array is required' } });
    }
    if (!comments || !comments.trim()) {
      return res.status(400).json({ success: false, error: { message: 'Comments are required for return' } });
    }

    const { handleReturn } = require('../services/transaction-approval.service');
    let returned = 0, failed = 0;
    const failedIds = [];

    for (const claimId of claim_ids) {
      try {
        const result = await handleReturn('CLAIM', claimId, userId, req.user?.roles || [], comments.trim());
        if (result.success) { returned++; } else { failed++; failedIds.push(claimId); }
      } catch (err) {
        console.warn('Bulk return error for claim', claimId, err.message);
        failed++;
        failedIds.push(claimId);
      }
    }

    res.json({ success: true, data: { returned, failed, failedIds, total: claim_ids.length } });
  } catch (err) {
    next(err);
  }
});

router.patch('/claims/:id/return', authenticate, auditLog('UPDATE', 'claim'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: { message: 'Authentication required' } });

    const { handleReturn } = require('../services/transaction-approval.service');
    const result = await handleReturn('CLAIM', parseInt(id), userId, req.user?.roles || [], req.body.comments);

    if (!result.success) {
      return res.status(result.status || 500).json({ success: false, error: { message: result.error } });
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.patch('/claims/:id/pay', authenticate, authorize('admin', 'payroll_admin'), auditLog('UPDATE', 'claim'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: { message: 'Authentication required' } });

    const claim = await dbQuery('SELECT * FROM claims WHERE id = $1', [id]);
    if (!claim.rows.length) return res.status(404).json({ success: false, error: { message: 'Claim not found' } });
    if (claim.rows[0].status !== 'APPROVED') return res.status(400).json({ success: false, error: { message: 'Only approved claims can be marked as paid' } });

    const client = await getClient();
    try {
      await client.query('BEGIN');
      const { payroll_run_id, period_id } = req.body;
      const result = await client.query(
        `UPDATE claims SET status = 'PAID', payroll_run_id = COALESCE($2, payroll_run_id), period_id = COALESCE($3, period_id), updated_at = NOW() WHERE id = $1 RETURNING *`,
        [id, payroll_run_id || null, period_id || null]
      );
      await client.query(
        `INSERT INTO claim_history (claim_id, action, performed_by, comments) VALUES ($1, 'PAID', $2, $3)`,
        [id, userId, req.body.comments || null]
      );
      await client.query('COMMIT');
      res.json({ success: true, data: result.rows[0] });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

router.patch('/claims/:id/resubmit', authenticate, auditLog('UPDATE', 'claim'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: { message: 'Authentication required' } });

    const claim = await dbQuery('SELECT * FROM claims WHERE id = $1', [id]);
    if (!claim.rows.length) return res.status(404).json({ success: false, error: { message: 'Claim not found' } });
    if (claim.rows[0].status !== 'RETURNED') return res.status(400).json({ success: false, error: { message: 'Only returned claims can be resubmitted' } });
    if (!claim.rows[0].created_by || claim.rows[0].created_by !== userId) {
      return res.status(403).json({ success: false, error: { message: 'Only the original submitter can resubmit a returned claim' } });
    }

    const { claim_type, sub_type, start_date, end_date, amount, kilometres, reason, reference_no } = req.body;

    const effectiveType = claim_type || claim.rows[0].claim_type;
    const effectiveStart = start_date || claim.rows[0].start_date;
    const effectiveEnd = end_date || (end_date === null ? null : claim.rows[0].end_date);
    const effectiveEmpId = claim.rows[0].employee_id;

    const duplicates = await findDuplicateClaims(effectiveEmpId, effectiveType, effectiveStart, effectiveEnd, parseInt(id, 10));
    if (duplicates.length > 0) {
      const conflictIds = duplicates.map(d => '#' + d.id).join(', ');
      return res.status(409).json({ success: false, error: { message: `Duplicate claim detected. Conflicting claim(s): ${conflictIds}. A ${effectiveType === 'S_AND_T' ? 'S & T' : 'Travel'} claim with overlapping dates already exists for this employee.`, duplicates } });
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `UPDATE claims SET claim_type = COALESCE($1, claim_type), sub_type = COALESCE($2, sub_type),
         start_date = COALESCE($3, start_date), end_date = $4, amount = COALESCE($5, amount),
         kilometres = $6, reason = $7, reference_no = $8,
         status = 'PENDING', approved_by = NULL, approved_at = NULL, updated_at = NOW()
         WHERE id = $9 RETURNING *`,
        [claim_type, sub_type, start_date, end_date || null, amount, kilometres || null, reason || null, reference_no || null, id]
      );
      await client.query(
        `INSERT INTO claim_history (claim_id, action, performed_by, comments) VALUES ($1, 'SUBMITTED', $2, $3)`,
        [id, userId, 'Resubmitted after correction']
      );
      await client.query('COMMIT');
      res.json({ success: true, data: result.rows[0] });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

function canAccessClaimDoc(claim, userId, userRoles) {
  const roles = userRoles || [];
  if (roles.includes('admin') || roles.includes('payroll_admin') || roles.includes('hr_manager') || roles.includes('payroll_officer')) return true;
  if (claim.created_by === userId) return true;
  return false;
}

router.post('/claims/:id/document', authenticate, claimUpload.single('document'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const claim = await dbQuery('SELECT id, status, created_by, document_path FROM claims WHERE id = $1', [id]);
    if (claim.rows.length === 0) return res.status(404).json({ success: false, error: { message: 'Claim not found' } });
    if (!canAccessClaimDoc(claim.rows[0], userId, req.user?.roles)) {
      if (req.file) fs.unlinkSync(path.join(claimsUploadDir, req.file.filename));
      return res.status(403).json({ success: false, error: { message: 'Not authorized to modify this claim document' } });
    }
    const modifiableStatuses = ['PENDING', 'RETURNED'];
    if (!modifiableStatuses.includes(claim.rows[0].status)) {
      if (req.file) fs.unlinkSync(path.join(claimsUploadDir, req.file.filename));
      return res.status(400).json({ success: false, error: { message: 'Documents can only be modified on pending or returned claims' } });
    }
    if (!req.file) return res.status(400).json({ success: false, error: { message: 'No file provided' } });

    const documentPath = `claims/${req.file.filename}`;
    if (claim.rows[0].document_path) {
      const oldPath = path.join(__dirname, '..', '..', '..', 'uploads', claim.rows[0].document_path);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await dbQuery('UPDATE claims SET document_path = $1, updated_at = NOW() WHERE id = $2', [documentPath, id]);
    res.json({ success: true, data: { document_path: documentPath, original_name: req.file.originalname } });
  } catch (err) {
    if (req.file) try { fs.unlinkSync(path.join(claimsUploadDir, req.file.filename)); } catch (_) {}
    next(err);
  }
});

router.get('/claims/:id/document', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const claim = await dbQuery('SELECT document_path, created_by FROM claims WHERE id = $1', [id]);
    if (claim.rows.length === 0) return res.status(404).json({ success: false, error: { message: 'Claim not found' } });
    if (!canAccessClaimDoc(claim.rows[0], userId, req.user?.roles)) {
      return res.status(403).json({ success: false, error: { message: 'Not authorized to view this document' } });
    }
    if (!claim.rows[0].document_path) return res.status(404).json({ success: false, error: { message: 'No document attached to this claim' } });

    const filePath = path.join(__dirname, '..', '..', '..', 'uploads', claim.rows[0].document_path);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, error: { message: 'Document file not found' } });

    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
});

router.delete('/claims/:id/document', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const claim = await dbQuery('SELECT document_path, created_by, status FROM claims WHERE id = $1', [id]);
    if (claim.rows.length === 0) return res.status(404).json({ success: false, error: { message: 'Claim not found' } });
    if (!canAccessClaimDoc(claim.rows[0], userId, req.user?.roles)) {
      return res.status(403).json({ success: false, error: { message: 'Not authorized to remove this document' } });
    }
    const modifiableStatuses = ['PENDING', 'RETURNED'];
    if (!modifiableStatuses.includes(claim.rows[0].status)) {
      return res.status(400).json({ success: false, error: { message: 'Documents can only be removed from pending or returned claims' } });
    }
    if (!claim.rows[0].document_path) return res.status(404).json({ success: false, error: { message: 'No document to remove' } });

    const filePath = path.join(__dirname, '..', '..', '..', 'uploads', claim.rows[0].document_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await dbQuery('UPDATE claims SET document_path = NULL, updated_at = NOW() WHERE id = $1', [id]);
    res.json({ success: true, data: { message: 'Document removed' } });
  } catch (err) {
    next(err);
  }
});

router.get('/claims/:id/history', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const claimCheck = await dbQuery('SELECT id FROM claims WHERE id = $1', [id]);
    if (claimCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }
    const result = await dbQuery(
      `SELECT ch.*, 
              COALESCE(u.username, 'System') AS performed_by_name
       FROM claim_history ch
       LEFT JOIN users u ON ch.performed_by = u.id
       WHERE ch.claim_id = $1
       ORDER BY ch.performed_at ASC`,
      [id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/instalments', authenticate, (req, res) => {
  res.status(301).json({ success: false, error: { code: 'MOVED', message: 'Installments management has moved to /api/v1/installments' } });
});

router.post('/instalments', authenticate, (req, res) => {
  res.status(301).json({ success: false, error: { code: 'MOVED', message: 'Installments management has moved to /api/v1/installments' } });
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

/* ─────────────────────────────────────────────────────────────────
   SHIFT ROTATIONS  (Configuration → Time → Shift Rotations)
   Routes: /shift-rotations, /:id/weeks, /weeks/:weekId
   ───────────────────────────────────────────────────────────────── */

router.get('/shift-rotations', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT sr.*,
              cos.name AS condition_of_service_name,
              est.name AS employee_subtype_name
       FROM shift_rotations sr
       LEFT JOIN conditions_of_service cos ON sr.condition_of_service_id = cos.id
       LEFT JOIN employee_subtypes est ON sr.employee_subtype_id = est.id
       ORDER BY sr.name`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/shift-rotations', authenticate, auditLog('CREATE', 'shift_rotations'), async (req, res, next) => {
  try {
    const { name, short_description, description, condition_of_service_id, employee_subtype_id, start_date, end_date, no_of_weeks, enabled } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'name is required' } });
    const userId = req.user?.id || null;
    const weeks = parseInt(no_of_weeks, 10) || 1;
    const result = await dbQuery(
      `INSERT INTO shift_rotations (name, short_description, description, condition_of_service_id, employee_subtype_id, start_date, end_date, no_of_weeks, rotation_days, enabled, created_by, updated_at, updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),$11) RETURNING *`,
      [name.trim(), short_description || null, description || null,
       condition_of_service_id || null, employee_subtype_id || null,
       start_date || null, end_date || '9999-12-31',
       weeks, weeks * 7, enabled ?? true, userId]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/shift-rotations/:id', authenticate, auditLog('UPDATE', 'shift_rotations'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, short_description, description, condition_of_service_id, employee_subtype_id, start_date, end_date, no_of_weeks, enabled } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'name is required' } });
    const userId = req.user?.id || null;
    const weeks = parseInt(no_of_weeks, 10) || 1;
    const result = await dbQuery(
      `UPDATE shift_rotations SET name=$1, short_description=$2, description=$3, condition_of_service_id=$4,
         employee_subtype_id=$5, start_date=$6, end_date=$7, no_of_weeks=$8, rotation_days=$9, enabled=$10,
         updated_at=NOW(), updated_by=$11 WHERE id=$12 RETURNING *`,
      [name.trim(), short_description || null, description || null,
       condition_of_service_id || null, employee_subtype_id || null,
       start_date || null, end_date || '9999-12-31',
       weeks, weeks * 7, enabled ?? true, userId, parseInt(id, 10)]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Rotation not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/shift-rotations/:id', authenticate, auditLog('DELETE', 'shift_rotations'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await dbQuery('DELETE FROM shift_rotations WHERE id=$1 RETURNING id', [parseInt(id, 10)]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Rotation not found' } });
    res.json({ success: true, data: { id: result.rows[0].id } });
  } catch (err) { next(err); }
});

/* Rotation Week Lines: /:id/weeks and /weeks/:weekId */

router.get('/shift-rotations/:id/weeks', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await dbQuery(
      `SELECT d.*,
              mon.name AS monday_name, mon.short_description AS monday_short,
              tue.name AS tuesday_name, tue.short_description AS tuesday_short,
              wed.name AS wednesday_name, wed.short_description AS wednesday_short,
              thu.name AS thursday_name, thu.short_description AS thursday_short,
              fri.name AS friday_name, fri.short_description AS friday_short,
              sat.name AS saturday_name, sat.short_description AS saturday_short,
              sun.name AS sunday_name, sun.short_description AS sunday_short
       FROM shift_rotation_details d
       LEFT JOIN work_shifts mon ON d.monday = mon.id
       LEFT JOIN work_shifts tue ON d.tuesday = tue.id
       LEFT JOIN work_shifts wed ON d.wednesday = wed.id
       LEFT JOIN work_shifts thu ON d.thursday = thu.id
       LEFT JOIN work_shifts fri ON d.friday = fri.id
       LEFT JOIN work_shifts sat ON d.saturday = sat.id
       LEFT JOIN work_shifts sun ON d.sunday = sun.id
       WHERE d.shift_rotation_id = $1
       ORDER BY d.week_no, d.id`,
      [parseInt(id, 10)]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/shift-rotations/:id/weeks', authenticate, auditLog('CREATE', 'shift_rotation_details'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description, week_no, monday, tuesday, wednesday, thursday, friday, saturday, sunday, enabled } = req.body;
    if (!description?.trim()) return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'description is required' } });
    const userId = req.user?.id || null;
    const result = await dbQuery(
      `INSERT INTO shift_rotation_details (description, shift_rotation_id, week_no, monday, tuesday, wednesday, thursday, friday, saturday, sunday, enabled, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [description.trim(), parseInt(id, 10), week_no || 1,
       monday || null, tuesday || null, wednesday || null, thursday || null,
       friday || null, saturday || null, sunday || null,
       enabled ?? true, userId]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/shift-rotations/weeks/:weekId', authenticate, auditLog('UPDATE', 'shift_rotation_details'), async (req, res, next) => {
  try {
    const { weekId } = req.params;
    const { description, week_no, monday, tuesday, wednesday, thursday, friday, saturday, sunday, enabled } = req.body;
    if (!description?.trim()) return res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'description is required' } });
    const userId = req.user?.id || null;
    const result = await dbQuery(
      `UPDATE shift_rotation_details SET description=$1, week_no=$2, monday=$3, tuesday=$4, wednesday=$5,
         thursday=$6, friday=$7, saturday=$8, sunday=$9, enabled=$10, updated_at=NOW(), updated_by=$11
       WHERE id=$12 RETURNING *`,
      [description.trim(), week_no || 1,
       monday || null, tuesday || null, wednesday || null, thursday || null,
       friday || null, saturday || null, sunday || null,
       enabled ?? true, userId, parseInt(weekId, 10)]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Week row not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

/**
 * Employee Shift Assignment routes
 * GET  /employees/:id/shift-assignments        - list assignments for employee
 * POST /employees/:id/shift-assignments        - create assignment
 * PUT  /employees/:id/shift-assignments/:aid   - update assignment
 * DELETE /employees/:id/shift-assignments/:aid - remove assignment
 * GET  /employees/:id/shift-roster             - generate expected daily roster from active rotation
 * POST /shift-assignments/bulk                 - bulk assign rotation to multiple employees
 */
router.get('/employees/:id/shift-assignments', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const rows = await dbQuery(
      `SELECT esa.*, sr.name AS rotation_name, sr.short_description AS rotation_short_desc,
              sr.no_of_weeks, sr.enabled AS rotation_enabled
       FROM employee_shift_assignments esa
       LEFT JOIN shift_rotations sr ON sr.id = esa.shift_rotation_id
       WHERE esa.employee_id = $1
       ORDER BY esa.is_active DESC, esa.effective_from DESC`,
      [parseInt(id, 10)]
    );
    res.json({ success: true, data: rows.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/employees/:id/shift-assignments', authenticate, auditLog('CREATE', 'employee_shift_assignments'), async (req, res, next) => {
  try {
    const employee_id = parseInt(req.params.id, 10);
    const { shift_rotation_id, effective_from, effective_to, notes } = req.body;
    if (!shift_rotation_id) return res.status(400).json({ success: false, error: { message: 'shift_rotation_id is required' } });
    if (!effective_from) return res.status(400).json({ success: false, error: { message: 'effective_from is required' } });

    const userId = req.user?.id || 1;
    const toDate = effective_to || '9999-12-31';

    // Compute the day before the new assignment starts, to close any overlapping active assignment.
    // We do NOT set is_active=FALSE immediately — that would strip coverage before the new assignment begins.
    // Instead, trim the existing assignment's effective_to so the date timeline stays continuous.
    const newFrom = new Date(effective_from);
    const prevDay = new Date(newFrom);
    prevDay.setDate(prevDay.getDate() - 1);
    const prevDayStr = prevDay.toISOString().split('T')[0];

    // Close any active assignment whose range would overlap with the new one.
    // Only trim it (set effective_to = newFrom - 1); do NOT deactivate it.
    // Assignments that end before the new one starts are left untouched.
    await dbQuery(
      `UPDATE employee_shift_assignments
       SET effective_to = $1, updated_at = NOW(), updated_by = $2
       WHERE employee_id = $3
         AND is_active = TRUE
         AND effective_from < $4
         AND effective_to >= $4`,
      [prevDayStr, userId, employee_id, effective_from]
    );

    const result = await dbQuery(
      `INSERT INTO employee_shift_assignments
         (employee_id, shift_rotation_id, effective_from, effective_to, notes, is_active, created_by, updated_at, updated_by)
       VALUES ($1,$2,$3,$4,$5,TRUE,$6,NOW(),$6)
       RETURNING *`,
      [employee_id, shift_rotation_id, effective_from, toDate, notes || null, userId]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.put('/employees/:id/shift-assignments/:aid', authenticate, auditLog('UPDATE', 'employee_shift_assignments'), async (req, res, next) => {
  try {
    const employee_id = parseInt(req.params.id, 10);
    const aid = parseInt(req.params.aid, 10);
    const { shift_rotation_id, effective_from, effective_to, notes, is_active } = req.body;
    const userId = req.user?.id || 1;

    const existing = await dbQuery('SELECT id FROM employee_shift_assignments WHERE id=$1 AND employee_id=$2', [aid, employee_id]);
    if (!existing.rows.length) return res.status(404).json({ success: false, error: { message: 'Assignment not found' } });

    const result = await dbQuery(
      `UPDATE employee_shift_assignments
       SET shift_rotation_id = COALESCE($1, shift_rotation_id),
           effective_from = COALESCE($2, effective_from),
           effective_to = COALESCE($3, effective_to),
           notes = $4,
           is_active = COALESCE($5, is_active),
           updated_at = NOW(), updated_by = $6
       WHERE id = $7 RETURNING *`,
      [shift_rotation_id || null, effective_from || null, effective_to || null, notes ?? null, is_active ?? null, userId, aid]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/employees/:id/shift-assignments/:aid', authenticate, auditLog('DELETE', 'employee_shift_assignments'), async (req, res, next) => {
  try {
    const employee_id = parseInt(req.params.id, 10);
    const aid = parseInt(req.params.aid, 10);
    const existing = await dbQuery('SELECT id FROM employee_shift_assignments WHERE id=$1 AND employee_id=$2', [aid, employee_id]);
    if (!existing.rows.length) return res.status(404).json({ success: false, error: { message: 'Assignment not found' } });
    await dbQuery('DELETE FROM employee_shift_assignments WHERE id=$1', [aid]);
    res.json({ success: true, message: 'Assignment deleted' });
  } catch (err) {
    next(err);
  }
});

router.get('/employees/:id/shift-roster', authenticate, async (req, res, next) => {
  try {
    const employee_id = parseInt(req.params.id, 10);
    const { date_from, date_to } = req.query;
    if (!date_from || !date_to) return res.status(400).json({ success: false, error: { message: 'date_from and date_to are required' } });

    // Fetch ALL active assignments that overlap the requested date range, ordered by effective_from.
    // This correctly handles cases where the range spans multiple assignments (e.g. old rotation ends
    // mid-range and a new one starts).
    const assignsRes = await dbQuery(
      `SELECT esa.id, esa.shift_rotation_id, esa.effective_from::date AS effective_from, esa.effective_to::date AS effective_to
       FROM employee_shift_assignments esa
       WHERE esa.employee_id = $1
         AND esa.is_active = TRUE
         AND esa.effective_from <= $2::date
         AND esa.effective_to >= $3::date
       ORDER BY esa.effective_from`,
      [employee_id, date_to, date_from]
    );

    if (!assignsRes.rows.length) {
      return res.json({ success: true, data: [], message: 'No active rotation assigned for this date range' });
    }

    // Pre-load week schedules for every unique rotation referenced by these assignments.
    const rotationIds = [...new Set(assignsRes.rows.map((a) => a.shift_rotation_id))];
    const weeksMap = {};
    for (const rotId of rotationIds) {
      const wr = await dbQuery(
        `SELECT d.week_no,
                d.monday, d.tuesday, d.wednesday, d.thursday, d.friday, d.saturday, d.sunday,
                ws_mon.name AS monday_shift, ws_mon.shift_start_time AS monday_start, ws_mon.shift_end_time AS monday_end,
                ws_tue.name AS tuesday_shift, ws_tue.shift_start_time AS tuesday_start, ws_tue.shift_end_time AS tuesday_end,
                ws_wed.name AS wednesday_shift, ws_wed.shift_start_time AS wednesday_start, ws_wed.shift_end_time AS wednesday_end,
                ws_thu.name AS thursday_shift, ws_thu.shift_start_time AS thursday_start, ws_thu.shift_end_time AS thursday_end,
                ws_fri.name AS friday_shift, ws_fri.shift_start_time AS friday_start, ws_fri.shift_end_time AS friday_end,
                ws_sat.name AS saturday_shift, ws_sat.shift_start_time AS saturday_start, ws_sat.shift_end_time AS saturday_end,
                ws_sun.name AS sunday_shift, ws_sun.shift_start_time AS sunday_start, ws_sun.shift_end_time AS sunday_end
         FROM shift_rotation_details d
         LEFT JOIN work_shifts ws_mon ON ws_mon.id = d.monday
         LEFT JOIN work_shifts ws_tue ON ws_tue.id = d.tuesday
         LEFT JOIN work_shifts ws_wed ON ws_wed.id = d.wednesday
         LEFT JOIN work_shifts ws_thu ON ws_thu.id = d.thursday
         LEFT JOIN work_shifts ws_fri ON ws_fri.id = d.friday
         LEFT JOIN work_shifts ws_sat ON ws_sat.id = d.saturday
         LEFT JOIN work_shifts ws_sun ON ws_sun.id = d.sunday
         WHERE d.shift_rotation_id = $1
         ORDER BY d.week_no`,
        [rotId]
      );
      weeksMap[rotId] = wr.rows;
    }

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    // node-postgres returns DATE columns as JS Date objects. Normalise them to YYYY-MM-DD strings
    // so the string comparison inside the loop (a.effective_from <= curStr) works correctly.
    const assignments = assignsRes.rows.map((a) => ({
      ...a,
      effective_from: a.effective_from instanceof Date ? a.effective_from.toISOString().split('T')[0] : String(a.effective_from).split('T')[0],
      effective_to: a.effective_to instanceof Date ? a.effective_to.toISOString().split('T')[0] : String(a.effective_to).split('T')[0]
    }));
    const roster = [];
    const cur = new Date(date_from + 'T00:00:00Z');
    const end = new Date(date_to + 'T00:00:00Z');

    while (cur <= end) {
      const curStr = cur.toISOString().split('T')[0];
      const dayName = dayNames[cur.getUTCDay()];

      // Find which assignment covers this specific calendar day.
      // effective_from/to are date strings; use UTC comparison to avoid TZ shift artefacts.
      const assign = assignments.find((a) => a.effective_from <= curStr && a.effective_to >= curStr);

      if (!assign) {
        // This day falls between assignments or outside all assignment ranges — no rotation coverage.
        roster.push({ date: curStr, day_of_week: dayName, week_no: null, shift_id: null, shift_name: 'No Rotation', shift_start: null, shift_end: null, is_off: true, no_coverage: true });
      } else {
        const weeks = weeksMap[assign.shift_rotation_id] || [];
        if (weeks.length === 0) {
          roster.push({ date: curStr, day_of_week: dayName, week_no: null, shift_id: null, shift_name: 'No Schedule', shift_start: null, shift_end: null, is_off: true, no_coverage: false });
        } else {
          // Week index is relative to the assignment's effective_from (day 0 = week 1, day 1 of rotation).
          const assignStart = new Date(assign.effective_from + 'T00:00:00Z');
          const daysSinceAssignStart = Math.floor((cur.getTime() - assignStart.getTime()) / 86400000);
          const weekIndex = Math.floor(daysSinceAssignStart / 7) % weeks.length;
          const week = weeks[weekIndex];
          const shiftId = week[dayName];
          const shiftName = week[`${dayName}_shift`];
          const shiftStart = week[`${dayName}_start`];
          const shiftEnd = week[`${dayName}_end`];
          roster.push({
            date: curStr,
            day_of_week: dayName,
            week_no: week.week_no,
            shift_id: shiftId,
            shift_name: shiftName || (shiftId ? `Shift #${shiftId}` : 'Off'),
            shift_start: shiftStart || null,
            shift_end: shiftEnd || null,
            is_off: !shiftId,
            no_coverage: false
          });
        }
      }
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    res.json({ success: true, data: roster });
  } catch (err) {
    next(err);
  }
});

router.post('/shift-assignments/bulk', authenticate, auditLog('CREATE', 'employee_shift_assignments_bulk'), async (req, res, next) => {
  try {
    const { shift_rotation_id, effective_from, effective_to, condition_of_service_id, employee_subtype_id, employee_ids } = req.body;
    if (!shift_rotation_id) return res.status(400).json({ success: false, error: { message: 'shift_rotation_id is required' } });
    if (!effective_from) return res.status(400).json({ success: false, error: { message: 'effective_from is required' } });
    const userId = req.user?.id || 1;
    const toDate = effective_to || '9999-12-31';

    let targetEmployees = [];
    if (Array.isArray(employee_ids) && employee_ids.length > 0) {
      const r = await dbQuery('SELECT id FROM employees WHERE id = ANY($1::int[]) AND (end_date IS NULL OR end_date > NOW())', [employee_ids]);
      targetEmployees = r.rows.map((e) => e.id);
    } else {
      let where = `WHERE (end_date IS NULL OR end_date > NOW() OR end_date >= '9999-01-01')`;
      const params = [];
      let pi = 1;
      if (condition_of_service_id) { where += ` AND condition_of_service_id = $${pi++}`; params.push(condition_of_service_id); }
      if (employee_subtype_id) { where += ` AND employee_subtype_id = $${pi++}`; params.push(employee_subtype_id); }
      const r = await dbQuery(`SELECT id FROM employees ${where}`, params);
      targetEmployees = r.rows.map((e) => e.id);
    }

    if (!targetEmployees.length) return res.json({ success: true, data: { assigned: 0, message: 'No matching employees found' } });

    const prevDay = new Date(new Date(effective_from).getTime() - 86400000).toISOString().split('T')[0];
    let assigned = 0;
    for (const empId of targetEmployees) {
      // Trim any overlapping active assignment's effective_to to the day before the new one starts.
      // This preserves the date timeline for attendance history instead of hard-deactivating.
      await dbQuery(
        `UPDATE employee_shift_assignments
         SET effective_to = $1, updated_at = NOW(), updated_by = $2
         WHERE employee_id = $3 AND is_active = TRUE
           AND effective_from < $4 AND effective_to >= $4`,
        [prevDay, userId, empId, effective_from]
      );
      await dbQuery(
        `INSERT INTO employee_shift_assignments (employee_id, shift_rotation_id, effective_from, effective_to, is_active, created_by, updated_at, updated_by)
         VALUES ($1,$2,$3,$4,TRUE,$5,NOW(),$5)`,
        [empId, shift_rotation_id, effective_from, toDate, userId]
      );
      assigned++;
    }

    res.json({ success: true, data: { assigned, message: `Rotation assigned to ${assigned} employee(s)` } });
  } catch (err) {
    next(err);
  }
});

router.delete('/shift-rotations/weeks/:weekId', authenticate, auditLog('DELETE', 'shift_rotation_details'), async (req, res, next) => {
  try {
    const { weekId } = req.params;
    const result = await dbQuery('DELETE FROM shift_rotation_details WHERE id=$1 RETURNING id', [parseInt(weekId, 10)]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Week row not found' } });
    res.json({ success: true, data: { id: result.rows[0].id } });
  } catch (err) { next(err); }
});

router.get('/claims/:id/pdf', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const claim = await dbQuery('SELECT id, created_by FROM claims WHERE id = $1', [id]);
    if (!claim.rows.length) return res.status(404).json({ success: false, error: { message: 'Claim not found' } });

    if (!canAccessClaimDoc(claim.rows[0], req.user?.id, req.user?.roles)) {
      return res.status(403).json({ success: false, error: { message: 'Not authorized to view this claim PDF' } });
    }

    const { generateClaimPDF } = require('../services/claims-pdf.service');
    const pdfBuffer = await generateClaimPDF(parseInt(id, 10));
    const disposition = req.query.download === 'true' ? 'attachment' : 'inline';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="claim_${id}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.findDuplicateClaims = findDuplicateClaims;
