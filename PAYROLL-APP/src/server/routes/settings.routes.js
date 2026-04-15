const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');
const { query: dbQuery } = require('../config/database');

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `municipality_logo${ext}`);
  }
});
const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PNG and JPG files are allowed'));
  }
});

router.get('/tax-years', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT DISTINCT tax_year FROM tax_brackets ORDER BY tax_year DESC');
    res.json({ success: true, data: result.rows.map(r => r.tax_year) });
  } catch (err) { next(err); }
});

router.get('/active-tax-year', authenticate, async (req, res, next) => {
  try {
    let result = await dbQuery(
      "SELECT tax_year FROM payroll_periods WHERE status = 'OPEN' ORDER BY tax_year DESC, period_number DESC LIMIT 1"
    );
    if (result.rows.length === 0) {
      result = await dbQuery('SELECT MAX(tax_year) AS tax_year FROM tax_brackets');
    }
    const taxYear = result.rows.length > 0 ? result.rows[0].tax_year : null;
    res.json({ success: true, data: { tax_year: taxYear } });
  } catch (err) { next(err); }
});

router.get('/tax-tables/:taxYear', authenticate, async (req, res, next) => {
  try {
    const taxYear = parseInt(req.params.taxYear);
    const [brackets, rebates, thresholds, medCredits, uif, sdl] = await Promise.all([
      dbQuery('SELECT * FROM tax_brackets WHERE tax_year = $1 ORDER BY bracket_number', [taxYear]),
      dbQuery('SELECT * FROM tax_rebates WHERE tax_year = $1 ORDER BY rebate_type', [taxYear]),
      dbQuery('SELECT * FROM tax_thresholds WHERE tax_year = $1', [taxYear]),
      dbQuery('SELECT * FROM medical_tax_credits WHERE tax_year = $1', [taxYear]),
      dbQuery('SELECT * FROM uif_settings WHERE tax_year = $1', [taxYear]),
      dbQuery('SELECT * FROM sdl_settings WHERE tax_year = $1', [taxYear]),
    ]);
    res.json({
      success: true,
      data: {
        tax_year: taxYear,
        brackets: brackets.rows,
        rebates: rebates.rows,
        thresholds: thresholds.rows,
        medical_tax_credits: medCredits.rows[0] || null,
        uif: uif.rows[0] || null,
        sdl: sdl.rows[0] || null,
      }
    });
  } catch (err) { next(err); }
});

router.put('/tax-brackets/:id', authenticate, auditLog('UPDATE', 'tax_brackets'), async (req, res, next) => {
  try {
    const { min_income, max_income, base_tax, rate } = req.body;
    const result = await dbQuery(
      `UPDATE tax_brackets SET min_income = $1, max_income = $2, base_tax = $3, rate = $4 WHERE id = $5 RETURNING *`,
      [min_income, max_income, base_tax, rate, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: { message: 'Bracket not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.post('/tax-brackets', authenticate, auditLog('CREATE', 'tax_brackets'), async (req, res, next) => {
  try {
    const { tax_year, bracket_number, min_income, max_income, base_tax, rate } = req.body;
    const result = await dbQuery(
      `INSERT INTO tax_brackets (tax_year, bracket_number, min_income, max_income, base_tax, rate, start_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [tax_year, bracket_number, min_income, max_income, base_tax, rate, `${tax_year - 1}-03-01`]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/tax-brackets/:id', authenticate, auditLog('DELETE', 'tax_brackets'), async (req, res, next) => {
  try {
    await dbQuery('DELETE FROM tax_brackets WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Bracket deleted' });
  } catch (err) { next(err); }
});

router.put('/tax-rebates/:id', authenticate, auditLog('UPDATE', 'tax_rebates'), async (req, res, next) => {
  try {
    const { amount, age_threshold } = req.body;
    const result = await dbQuery(
      `UPDATE tax_rebates SET amount = $1, age_threshold = $2 WHERE id = $3 RETURNING *`,
      [amount, age_threshold, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: { message: 'Rebate not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/tax-thresholds/:id', authenticate, auditLog('UPDATE', 'tax_thresholds'), async (req, res, next) => {
  try {
    const { amount } = req.body;
    const result = await dbQuery(
      `UPDATE tax_thresholds SET amount = $1 WHERE id = $2 RETURNING *`,
      [amount, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: { message: 'Threshold not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/uif-settings/:id', authenticate, auditLog('UPDATE', 'uif_settings'), async (req, res, next) => {
  try {
    const { employee_rate, employer_rate, ceiling } = req.body;
    const result = await dbQuery(
      `UPDATE uif_settings SET employee_rate = $1, employer_rate = $2, ceiling = $3 WHERE id = $4 RETURNING *`,
      [employee_rate, employer_rate, ceiling, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: { message: 'UIF settings not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/sdl-settings/:id', authenticate, auditLog('UPDATE', 'sdl_settings'), async (req, res, next) => {
  try {
    const { rate, threshold } = req.body;
    const result = await dbQuery(
      `UPDATE sdl_settings SET rate = $1, threshold = $2 WHERE id = $3 RETURNING *`,
      [rate, threshold, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: { message: 'SDL settings not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/medical-credits/:id', authenticate, auditLog('UPDATE', 'medical_tax_credits'), async (req, res, next) => {
  try {
    const { main_member, first_dependant, additional_dependant } = req.body;
    const result = await dbQuery(
      `UPDATE medical_tax_credits SET main_member = $1, first_dependant = $2, additional_dependant = $3 WHERE id = $4 RETURNING *`,
      [main_member, first_dependant, additional_dependant, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: { message: 'Medical credits not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.post('/tax-tables/copy', authenticate, auditLog('CREATE', 'tax_tables_copy'), async (req, res, next) => {
  try {
    const { from_year, to_year } = req.body;
    if (!from_year || !to_year) return res.status(400).json({ success: false, error: { message: 'from_year and to_year are required' } });

    const existing = await dbQuery('SELECT COUNT(*) AS cnt FROM tax_brackets WHERE tax_year = $1', [to_year]);
    if (parseInt(existing.rows[0].cnt) > 0) {
      return res.status(400).json({ success: false, error: { message: `Tax year ${to_year} already has data. Delete existing data first.` } });
    }

    const startDate = `${to_year - 1}-03-01`;
    const endDate = `${to_year}-02-28`;
    await dbQuery(
      `INSERT INTO tax_brackets (tax_year, bracket_number, min_income, max_income, base_tax, rate, start_date, end_date)
       SELECT $2, bracket_number, min_income, max_income, base_tax, rate, $3::date, $4::date
       FROM tax_brackets WHERE tax_year = $1 ORDER BY bracket_number`,
      [from_year, to_year, startDate, endDate]
    );
    await dbQuery(
      `INSERT INTO tax_rebates (tax_year, rebate_type, amount, age_threshold, start_date, end_date)
       SELECT $2, rebate_type, amount, age_threshold, $3::date, $4::date
       FROM tax_rebates WHERE tax_year = $1`,
      [from_year, to_year, startDate, endDate]
    );
    await dbQuery(
      `INSERT INTO tax_thresholds (tax_year, threshold_type, age_group, amount, start_date, end_date)
       SELECT $2, threshold_type, age_group, amount, $3::date, $4::date
       FROM tax_thresholds WHERE tax_year = $1`,
      [from_year, to_year, startDate, endDate]
    );
    await dbQuery(
      `INSERT INTO medical_tax_credits (tax_year, main_member, first_dependant, additional_dependant, start_date, end_date)
       SELECT $2, main_member, first_dependant, additional_dependant, $3::date, $4::date
       FROM medical_tax_credits WHERE tax_year = $1`,
      [from_year, to_year, startDate, endDate]
    );
    await dbQuery(
      `INSERT INTO uif_settings (tax_year, employee_rate, employer_rate, ceiling, start_date, end_date)
       SELECT $2, employee_rate, employer_rate, ceiling, $3::date, $4::date
       FROM uif_settings WHERE tax_year = $1`,
      [from_year, to_year, startDate, endDate]
    );
    await dbQuery(
      `INSERT INTO sdl_settings (tax_year, rate, threshold, start_date, end_date)
       SELECT $2, rate, threshold, $3::date, $4::date
       FROM sdl_settings WHERE tax_year = $1`,
      [from_year, to_year, startDate, endDate]
    );

    res.json({ success: true, message: `Tax tables copied from ${from_year} to ${to_year}. Update values for the new year.` });
  } catch (err) { next(err); }
});

router.get('/leave-types', authenticate, async (req, res, next) => {
  try {
    const { scheme_id } = req.query;
    let q = `SELECT lt.*, ls.name AS scheme_name FROM leave_types lt
             LEFT JOIN leave_schemes ls ON lt.leave_scheme_id = ls.id
             WHERE lt.enabled = TRUE`;
    const params = [];
    if (scheme_id) { q += ' AND lt.leave_scheme_id = $1'; params.push(scheme_id); }
    q += ' ORDER BY lt.code';
    const result = await dbQuery(q, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/leave-schemes', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM leave_schemes WHERE enabled = TRUE ORDER BY name');
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/leave-types', authenticate, auditLog('CREATE', 'leave_types'), async (req, res, next) => {
  try {
    const { code, name, leave_scheme_id, accrual_days, max_accumulation, accrual_frequency, requires_document, paid, carry_over_days, negative_balance_allowed } = req.body;
    if (!code || !name) return res.status(400).json({ success: false, error: { message: 'Code and name are required' } });
    const result = await dbQuery(
      `INSERT INTO leave_types (code, name, leave_scheme_id, accrual_days, max_accumulation, accrual_frequency, requires_document, paid, carry_over_days, negative_balance_allowed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [code.toUpperCase(), name, leave_scheme_id || null, accrual_days || 0, max_accumulation || 0, accrual_frequency || 'ANNUAL', requires_document || false, paid !== false, carry_over_days || 0, negative_balance_allowed || false]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/leave-types/:id', authenticate, auditLog('UPDATE', 'leave_types'), async (req, res, next) => {
  try {
    const { name, leave_scheme_id, accrual_days, max_accumulation, accrual_frequency, requires_document, paid, carry_over_days, negative_balance_allowed } = req.body;
    const result = await dbQuery(
      `UPDATE leave_types SET name = $1, leave_scheme_id = $2, accrual_days = $3, max_accumulation = $4,
       accrual_frequency = $5, requires_document = $6, paid = $7, carry_over_days = $8, negative_balance_allowed = $9
       WHERE id = $10 RETURNING *`,
      [name, leave_scheme_id, accrual_days, max_accumulation, accrual_frequency, requires_document, paid, carry_over_days, negative_balance_allowed, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: { message: 'Leave type not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/leave-types/:id', authenticate, auditLog('DELETE', 'leave_types'), async (req, res, next) => {
  try {
    const inUse = await dbQuery('SELECT COUNT(*) AS cnt FROM leave_transactions WHERE leave_type_id = $1', [req.params.id]);
    if (parseInt(inUse.rows[0].cnt) > 0) {
      await dbQuery('UPDATE leave_types SET enabled = FALSE WHERE id = $1', [req.params.id]);
      return res.json({ success: true, message: 'Leave type disabled (has historical data)' });
    }
    await dbQuery('DELETE FROM leave_types WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Leave type deleted' });
  } catch (err) { next(err); }
});

router.get('/salary-heads', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT * FROM salary_heads WHERE enabled = TRUE ORDER BY id`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/titles', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM titles WHERE enabled = TRUE ORDER BY sort_order, name');
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/titles/all', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM titles ORDER BY sort_order, name');
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/titles', authenticate, auditLog('CREATE', 'titles'), async (req, res, next) => {
  try {
    const { name, abbreviation, sort_order } = req.body;
    if (!name || !abbreviation) {
      return res.status(400).json({ success: false, error: { message: 'Name and abbreviation are required' } });
    }
    const result = await dbQuery(
      `INSERT INTO titles (name, abbreviation, sort_order) VALUES ($1, $2, $3) RETURNING *`,
      [name, abbreviation, sort_order || 0]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/titles/:id', authenticate, auditLog('UPDATE', 'titles'), async (req, res, next) => {
  try {
    const { name, abbreviation, enabled, sort_order } = req.body;
    const result = await dbQuery(
      `UPDATE titles SET name = COALESCE($1, name), abbreviation = COALESCE($2, abbreviation),
       enabled = COALESCE($3, enabled), sort_order = COALESCE($4, sort_order) WHERE id = $5 RETURNING *`,
      [name, abbreviation, enabled, sort_order, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Title not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/titles/:id', authenticate, auditLog('DELETE', 'titles'), async (req, res, next) => {
  try {
    await dbQuery('UPDATE titles SET enabled = FALSE WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Title disabled' });
  } catch (err) { next(err); }
});

router.get('/ethnic-groups', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM ethnic_groups WHERE enabled = TRUE ORDER BY sort_order, name');
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/ethnic-groups/all', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM ethnic_groups ORDER BY sort_order, name');
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/ethnic-groups', authenticate, auditLog('CREATE', 'ethnic_groups'), async (req, res, next) => {
  try {
    const { name, sort_order } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: { message: 'Name is required' } });
    }
    const result = await dbQuery(
      `INSERT INTO ethnic_groups (name, sort_order) VALUES ($1, $2) RETURNING *`,
      [name, sort_order || 0]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/ethnic-groups/:id', authenticate, auditLog('UPDATE', 'ethnic_groups'), async (req, res, next) => {
  try {
    const { name, enabled, sort_order } = req.body;
    const result = await dbQuery(
      `UPDATE ethnic_groups SET name = COALESCE($1, name),
       enabled = COALESCE($2, enabled), sort_order = COALESCE($3, sort_order) WHERE id = $4 RETURNING *`,
      [name, enabled, sort_order, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Ethnic group not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/ethnic-groups/:id', authenticate, auditLog('DELETE', 'ethnic_groups'), async (req, res, next) => {
  try {
    await dbQuery('UPDATE ethnic_groups SET enabled = FALSE WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Ethnic group disabled' });
  } catch (err) { next(err); }
});

router.get('/genders', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM genders WHERE enabled = TRUE ORDER BY sort_order, name');
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/genders/all', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM genders ORDER BY sort_order, name');
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/genders', authenticate, auditLog('CREATE', 'genders'), async (req, res, next) => {
  try {
    const { name, sort_order } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: { message: 'Name is required' } });
    }
    const result = await dbQuery(
      `INSERT INTO genders (name, sort_order) VALUES ($1, $2) RETURNING *`,
      [name, sort_order || 0]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/genders/:id', authenticate, auditLog('UPDATE', 'genders'), async (req, res, next) => {
  try {
    const { name, enabled, sort_order } = req.body;
    const result = await dbQuery(
      `UPDATE genders SET name = COALESCE($1, name),
       enabled = COALESCE($2, enabled), sort_order = COALESCE($3, sort_order) WHERE id = $4 RETURNING *`,
      [name, enabled, sort_order, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Gender not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/genders/:id', authenticate, auditLog('DELETE', 'genders'), async (req, res, next) => {
  try {
    await dbQuery('UPDATE genders SET enabled = FALSE WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Gender disabled' });
  } catch (err) { next(err); }
});

router.get('/employee-types', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM employee_types ORDER BY id');
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.put('/employee-types/:id', authenticate, auditLog('UPDATE', 'employee_types'), async (req, res, next) => {
  try {
    const { working_hours_per_month, working_days_per_month } = req.body;
    if (working_hours_per_month != null && (isNaN(working_hours_per_month) || Number(working_hours_per_month) <= 0)) {
      return res.status(400).json({ success: false, error: { message: 'Working Hours Per Month must be a positive number' } });
    }
    if (working_days_per_month != null && (isNaN(working_days_per_month) || Number(working_days_per_month) <= 0)) {
      return res.status(400).json({ success: false, error: { message: 'Working Days Per Month must be a positive number' } });
    }
    const result = await dbQuery(
      `UPDATE employee_types SET working_hours_per_month = $1, working_days_per_month = $2 WHERE id = $3 RETURNING *`,
      [working_hours_per_month || 166.00, working_days_per_month || 20.75, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Employee type not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/employee-subtypes', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT s.*, t.name AS employee_type_name, t.code AS employee_type_code
       FROM employee_subtypes s
       LEFT JOIN employee_types t ON s.employee_type_id = t.id
       ORDER BY t.name, s.name`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/employee-subtypes', authenticate, auditLog('CREATE', 'employee_subtypes'), async (req, res, next) => {
  try {
    const { employee_type_id, code, name, description, enabled, exclude_uif, exclude_sdl, enable_bonus } = req.body;
    if (!employee_type_id || !code || !name) return res.status(400).json({ success: false, error: { message: 'Employee type, code and name are required' } });
    const result = await dbQuery(
      `INSERT INTO employee_subtypes (employee_type_id, code, name, description, enabled, exclude_uif, exclude_sdl, enable_bonus) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [employee_type_id, code.toUpperCase().replace(/\s+/g, '_'), name, description || null, enabled !== false, exclude_uif || false, exclude_sdl || false, enable_bonus || false]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ success: false, error: { message: 'Subtype code already exists' } });
    next(err);
  }
});

router.put('/employee-subtypes/:id', authenticate, auditLog('UPDATE', 'employee_subtypes'), async (req, res, next) => {
  try {
    const { employee_type_id, code, name, description, enabled, exclude_uif, exclude_sdl, enable_bonus } = req.body;
    const result = await dbQuery(
      `UPDATE employee_subtypes SET employee_type_id=$1, code=$2, name=$3, description=$4, enabled=$5, exclude_uif=$6, exclude_sdl=$7, enable_bonus=$8 WHERE id=$9 RETURNING *`,
      [employee_type_id, code, name, description || null, enabled !== false, exclude_uif || false, exclude_sdl || false, enable_bonus || false, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Subtype not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ success: false, error: { message: 'Subtype code already exists' } });
    next(err);
  }
});

router.delete('/employee-subtypes/:id', authenticate, auditLog('DELETE', 'employee_subtypes'), async (req, res, next) => {
  try {
    const inUse = await dbQuery('SELECT COUNT(*) AS cnt FROM employees WHERE employee_subtype_id = $1', [req.params.id]);
    if (parseInt(inUse.rows[0].cnt) > 0) return res.status(400).json({ success: false, error: { message: `Cannot delete: ${inUse.rows[0].cnt} employee(s) linked to this subtype` } });
    await dbQuery('DELETE FROM employee_subtypes WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Subtype deleted' });
  } catch (err) { next(err); }
});

// === SALARY TRANSACTION GROUPS ===
router.get('/salary-transaction-groups', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(`
      SELECT g.*, 
        (SELECT COUNT(*) FROM salary_transaction_group_items gi WHERE gi.group_id = g.id) AS item_count
      FROM salary_transaction_groups g 
      WHERE g.enabled = TRUE ORDER BY g.id`);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/salary-transaction-groups', authenticate, auditLog('CREATE', 'salary_transaction_groups'), async (req, res, next) => {
  try {
    const { code, name, description } = req.body;
    if (!code || !name) return res.status(400).json({ success: false, error: { message: 'Code and name are required' } });
    const result = await dbQuery(
      'INSERT INTO salary_transaction_groups (code, name, description, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [code, name, description || null, req.user?.id || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/salary-transaction-groups/:id', authenticate, auditLog('UPDATE', 'salary_transaction_groups'), async (req, res, next) => {
  try {
    const { code, name, description } = req.body;
    if (!code || !name) return res.status(400).json({ success: false, error: { message: 'Code and name are required' } });
    const result = await dbQuery(
      'UPDATE salary_transaction_groups SET code=$1, name=$2, description=$3, updated_at=NOW(), updated_by=$4 WHERE id=$5 RETURNING *',
      [code, name, description || null, req.user?.id || null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/salary-transaction-groups/:id', authenticate, auditLog('DELETE', 'salary_transaction_groups'), async (req, res, next) => {
  try {
    const inUse = await dbQuery('SELECT COUNT(*) AS cnt FROM job_profiles WHERE salary_transaction_group_id = $1 AND enabled = TRUE', [req.params.id]);
    if (parseInt(inUse.rows[0].cnt) > 0) return res.status(400).json({ success: false, error: { message: `Cannot delete: ${inUse.rows[0].cnt} job profile(s) linked to this group` } });
    await dbQuery('UPDATE salary_transaction_groups SET enabled = FALSE, updated_at = NOW() WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Salary transaction group disabled' });
  } catch (err) { next(err); }
});

router.get('/salary-transaction-groups/:id/items', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(`
      SELECT gi.id, gi.group_id, gi.salary_head_id, gi.sort_order,
             sh.code AS salary_head_code, sh.name AS salary_head_name, sh.transaction_type, sh.calculation_method
      FROM salary_transaction_group_items gi
      JOIN salary_heads sh ON sh.id = gi.salary_head_id
      WHERE gi.group_id = $1
      ORDER BY sh.transaction_type, gi.salary_head_id`, [req.params.id]);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/salary-transaction-groups/:id/items', authenticate, auditLog('CREATE', 'salary_transaction_group_items'), async (req, res, next) => {
  try {
    const { salary_head_ids } = req.body;
    if (!Array.isArray(salary_head_ids) || salary_head_ids.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'salary_head_ids array is required' } });
    }
    const groupId = req.params.id;
    const existing = await dbQuery('SELECT salary_head_id FROM salary_transaction_group_items WHERE group_id = $1', [groupId]);
    const existingIds = new Set(existing.rows.map(r => r.salary_head_id));
    const newIds = salary_head_ids.filter(id => !existingIds.has(id));
    const maxSort = await dbQuery('SELECT COALESCE(MAX(sort_order), 0) AS max_sort FROM salary_transaction_group_items WHERE group_id = $1', [groupId]);
    let sortOrder = parseInt(maxSort.rows[0].max_sort) + 1;
    for (const shId of newIds) {
      await dbQuery('INSERT INTO salary_transaction_group_items (group_id, salary_head_id, sort_order) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [groupId, shId, sortOrder++]);
    }
    res.status(201).json({ success: true, message: `${newIds.length} salary head(s) added` });
  } catch (err) { next(err); }
});

router.delete('/salary-transaction-groups/:groupId/items/:itemId', authenticate, auditLog('DELETE', 'salary_transaction_group_items'), async (req, res, next) => {
  try {
    await dbQuery('DELETE FROM salary_transaction_group_items WHERE id = $1 AND group_id = $2', [req.params.itemId, req.params.groupId]);
    res.json({ success: true, message: 'Salary head removed from group' });
  } catch (err) { next(err); }
});

// === SALARY UPPER LIMITS ===
router.get('/upper-limits', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT ul.*,
              et.name AS employee_type_name,
              es.name AS employee_subtype_name
       FROM salary_upper_limits ul
       LEFT JOIN employee_types et ON ul.employee_type_id = et.id
       LEFT JOIN employee_subtypes es ON ul.employee_subtype_id = es.id
       WHERE ul.enabled = TRUE
       ORDER BY ul.id`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/upper-limits/:id', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT ul.*,
              et.name AS employee_type_name,
              es.name AS employee_subtype_name
       FROM salary_upper_limits ul
       LEFT JOIN employee_types et ON ul.employee_type_id = et.id
       LEFT JOIN employee_subtypes es ON ul.employee_subtype_id = es.id
       WHERE ul.id = $1`, [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Upper limit not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/upper-limits/:id/history', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT * FROM upper_limit_history WHERE upper_limit_id = $1 ORDER BY changed_at DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/upper-limits', authenticate, auditLog('CREATE', 'salary_upper_limits'), async (req, res, next) => {
  try {
    const { employee_type_id, employee_subtype_id,
            start_date, end_date, minimum_value, midpoint_value, maximum_value } = req.body;
    if (!start_date) return res.status(400).json({ success: false, error: { message: 'Start date is required' } });
    const result = await dbQuery(
      `INSERT INTO salary_upper_limits (employee_type_id, employee_subtype_id, municipal_grading,
        start_date, end_date, minimum_value, midpoint_value, maximum_value, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [employee_type_id||null, employee_subtype_id||null, '-',
       start_date, end_date||'9999-12-31',
       minimum_value||0, midpoint_value||0, maximum_value||0,
       req.user?.id||null]
    );
    const row = result.rows[0];
    await dbQuery(
      `INSERT INTO upper_limit_history (upper_limit_id, change_type, snapshot, changed_by) VALUES ($1, 'CREATE', $2, $3)`,
      [row.id, JSON.stringify(row), req.user?.id||null]
    );
    res.status(201).json({ success: true, data: row });
  } catch (err) { next(err); }
});

router.put('/upper-limits/:id', authenticate, auditLog('UPDATE', 'salary_upper_limits'), async (req, res, next) => {
  try {
    const { employee_type_id, employee_subtype_id,
            start_date, end_date, minimum_value, midpoint_value, maximum_value } = req.body;
    if (!start_date) return res.status(400).json({ success: false, error: { message: 'Start date is required' } });
    const result = await dbQuery(
      `UPDATE salary_upper_limits SET employee_type_id=$1, employee_subtype_id=$2,
        start_date=$3, end_date=$4, minimum_value=$5, midpoint_value=$6, maximum_value=$7,
        updated_at=NOW(), updated_by=$8
       WHERE id=$9 RETURNING *`,
      [employee_type_id||null, employee_subtype_id||null,
       start_date, end_date||'9999-12-31',
       minimum_value||0, midpoint_value||0, maximum_value||0,
       req.user?.id||null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Not found' } });
    const row = result.rows[0];
    await dbQuery(
      `INSERT INTO upper_limit_history (upper_limit_id, change_type, snapshot, changed_by) VALUES ($1, 'UPDATE', $2, $3)`,
      [row.id, JSON.stringify(row), req.user?.id||null]
    );
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});

router.delete('/upper-limits/:id', authenticate, auditLog('DELETE', 'salary_upper_limits'), async (req, res, next) => {
  try {
    const inUse = await dbQuery('SELECT COUNT(*) AS cnt FROM job_profiles WHERE upper_limit_id = $1 AND enabled = TRUE', [req.params.id]);
    if (parseInt(inUse.rows[0].cnt) > 0) return res.status(400).json({ success: false, error: { message: `Cannot delete: ${inUse.rows[0].cnt} job profile(s) linked` } });
    const current = await dbQuery('SELECT * FROM salary_upper_limits WHERE id = $1', [req.params.id]);
    if (current.rows.length) {
      await dbQuery(
        `INSERT INTO upper_limit_history (upper_limit_id, change_type, snapshot, changed_by) VALUES ($1, 'DELETE', $2, $3)`,
        [req.params.id, JSON.stringify(current.rows[0]), req.user?.id||null]
      );
    }
    await dbQuery('UPDATE salary_upper_limits SET enabled = FALSE, updated_at = NOW() WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Upper limit disabled' });
  } catch (err) { next(err); }
});

// === CONDITIONS OF SERVICE ===
router.get('/conditions-of-service', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM conditions_of_service ORDER BY name');
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/conditions-of-service', authenticate, auditLog('CREATE', 'conditions_of_service'), async (req, res, next) => {
  try {
    const { code, name, description, working_hours_per_day, working_days_per_week, start_date, end_date } = req.body;
    if (!code || !name || !start_date) return res.status(400).json({ success: false, error: { message: 'Code, name and start date are required' } });
    const result = await dbQuery(
      `INSERT INTO conditions_of_service (code, name, description, working_hours_per_day, working_days_per_week, start_date, end_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [code.toUpperCase().replace(/\s+/g, '_'), name, description || null, working_hours_per_day || 8, working_days_per_week || 5, start_date, end_date || '9999-12-31']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ success: false, error: { message: 'Condition code already exists' } });
    next(err);
  }
});

router.put('/conditions-of-service/:id', authenticate, auditLog('UPDATE', 'conditions_of_service'), async (req, res, next) => {
  try {
    const { code, name, description, working_hours_per_day, working_days_per_week, enabled, start_date, end_date } = req.body;
    const result = await dbQuery(
      `UPDATE conditions_of_service SET code=$1, name=$2, description=$3, working_hours_per_day=$4, working_days_per_week=$5, enabled=$6, start_date=$7, end_date=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [code, name, description || null, working_hours_per_day || 8, working_days_per_week || 5, enabled !== false, start_date, end_date || '9999-12-31', req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Condition not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ success: false, error: { message: 'Condition code already exists' } });
    next(err);
  }
});

router.delete('/conditions-of-service/:id', authenticate, auditLog('DELETE', 'conditions_of_service'), async (req, res, next) => {
  try {
    const inUse = await dbQuery('SELECT COUNT(*) AS cnt FROM employees WHERE condition_of_service_id = $1', [req.params.id]);
    if (parseInt(inUse.rows[0].cnt) > 0) return res.status(400).json({ success: false, error: { message: `Cannot delete: ${inUse.rows[0].cnt} employee(s) linked to this condition of service` } });
    await dbQuery('DELETE FROM conditions_of_service WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Condition of service deleted' });
  } catch (err) { next(err); }
});

// === TASK SKILL LEVELS (lookup) ===
router.get('/task-skill-levels', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM const_task_skill_levels WHERE enabled = TRUE ORDER BY id');
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

// === TASK GRADES ===
router.get('/task-grades', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT tg.*,
              tsl.description AS task_skill_level_description,
              (SELECT COUNT(*) FROM task_grade_notches n WHERE n.task_grade_id = tg.id)::int AS actual_notch_count
       FROM task_grades tg
       LEFT JOIN const_task_skill_levels tsl ON tsl.id = tg.task_skill_level_id
       ORDER BY tg.id`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/task-grades/:id', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT tg.*, tsl.description AS task_skill_level_description,
              (SELECT COUNT(*) FROM task_grade_notches n WHERE n.task_grade_id = tg.id)::int AS actual_notch_count
       FROM task_grades tg
       LEFT JOIN const_task_skill_levels tsl ON tsl.id = tg.task_skill_level_id
       WHERE tg.id = $1`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Task grade not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.post('/task-grades', authenticate, auditLog('CREATE', 'task_grades'), async (req, res, next) => {
  try {
    const { grade_code, grade_name, min_salary, max_salary, notch_count, start_date, end_date,
            is_legacy, to_phase_out, task_skill_level_id, yearly_notch_level_increase,
            use_employment_date, use_specific_notch_increase_date, notch_increase_month, exclude_from_yearly_increase } = req.body;
    if (!grade_code || !grade_name || !start_date) return res.status(400).json({ success: false, error: { message: 'Grade code, name and start date are required' } });
    const useSpecific = use_specific_notch_increase_date === true;
    const useEmployment = !useSpecific;
    const month = useSpecific ? (notch_increase_month && notch_increase_month >= 1 && notch_increase_month <= 12 ? notch_increase_month : null) : null;
    const result = await dbQuery(
      `INSERT INTO task_grades (grade_code, grade_name, min_salary, max_salary, notch_count, start_date, end_date,
        is_legacy, to_phase_out, task_skill_level_id, yearly_notch_level_increase,
        use_employment_date, use_specific_notch_increase_date, notch_increase_month, exclude_from_yearly_increase, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [grade_code, grade_name, min_salary || 0, max_salary || 0, notch_count || 0,
       start_date, end_date || '9999-12-31',
       is_legacy === true, to_phase_out === true,
       task_skill_level_id || null, yearly_notch_level_increase || 0,
       useEmployment, useSpecific, month,
       exclude_from_yearly_increase === true, req.user?.id || null]
    );
    const row = result.rows[0];
    await dbQuery(
      `INSERT INTO task_grade_history (task_grade_id, change_type, snapshot, changed_by)
       VALUES ($1, 'CREATE', $2, $3)`,
      [row.id, JSON.stringify(row), req.user?.id || null]
    );
    res.status(201).json({ success: true, data: row });
  } catch (err) { next(err); }
});

router.put('/task-grades/:id', authenticate, auditLog('UPDATE', 'task_grades'), async (req, res, next) => {
  try {
    const { grade_code, grade_name, min_salary, max_salary, notch_count, enabled, start_date, end_date,
            is_legacy, to_phase_out, task_skill_level_id, yearly_notch_level_increase,
            use_employment_date, use_specific_notch_increase_date, notch_increase_month, exclude_from_yearly_increase } = req.body;
    if (!grade_code || !grade_name || !start_date) return res.status(400).json({ success: false, error: { message: 'Grade code, name and start date are required' } });
    const useSpecific = use_specific_notch_increase_date === true;
    const useEmployment = !useSpecific;
    const month = useSpecific ? (notch_increase_month && notch_increase_month >= 1 && notch_increase_month <= 12 ? notch_increase_month : null) : null;
    const result = await dbQuery(
      `UPDATE task_grades SET grade_code=$1, grade_name=$2, min_salary=$3, max_salary=$4, notch_count=$5,
        enabled=$6, start_date=$7, end_date=$8, is_legacy=$9, to_phase_out=$10,
        task_skill_level_id=$11, yearly_notch_level_increase=$12, use_employment_date=$13,
        use_specific_notch_increase_date=$14, notch_increase_month=$15, exclude_from_yearly_increase=$16,
        updated_at=NOW(), updated_by=$17
       WHERE id=$18 RETURNING *`,
      [grade_code, grade_name, min_salary || 0, max_salary || 0, notch_count || 0,
       enabled !== false, start_date, end_date || '9999-12-31',
       is_legacy === true, to_phase_out === true,
       task_skill_level_id || null, yearly_notch_level_increase || 0,
       useEmployment, useSpecific, month,
       exclude_from_yearly_increase === true, req.user?.id || null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Task grade not found' } });
    const row = result.rows[0];
    await dbQuery(
      `INSERT INTO task_grade_history (task_grade_id, change_type, snapshot, changed_by)
       VALUES ($1, 'UPDATE', $2, $3)`,
      [row.id, JSON.stringify(row), req.user?.id || null]
    );
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});

router.delete('/task-grades/:id', authenticate, auditLog('DELETE', 'task_grades'), async (req, res, next) => {
  try {
    const inUse = await dbQuery('SELECT COUNT(*) AS cnt FROM employees WHERE task_grade_id = $1', [req.params.id]);
    if (parseInt(inUse.rows[0].cnt) > 0) return res.status(400).json({ success: false, error: { message: `Cannot delete: ${inUse.rows[0].cnt} employee(s) linked to this grade` } });
    const gradeSnap = await dbQuery('SELECT * FROM task_grades WHERE id = $1', [req.params.id]);
    if (gradeSnap.rows.length) {
      await dbQuery(
        `INSERT INTO task_grade_history (task_grade_id, change_type, snapshot, changed_by) VALUES ($1, 'DELETE', $2, $3)`,
        [req.params.id, JSON.stringify(gradeSnap.rows[0]), req.user?.id || null]
      );
    }
    const notchSnaps = await dbQuery('SELECT * FROM task_grade_notches WHERE task_grade_id = $1', [req.params.id]);
    for (const n of notchSnaps.rows) {
      await dbQuery(
        `INSERT INTO task_grade_notch_history (notch_id, task_grade_id, change_type, snapshot, changed_by) VALUES ($1, $2, 'DELETE', $3, $4)`,
        [n.id, req.params.id, JSON.stringify(n), req.user?.id || null]
      );
    }
    await dbQuery('UPDATE task_grade_notch_history SET notch_id = NULL WHERE task_grade_id = $1', [req.params.id]);
    await dbQuery('DELETE FROM task_grade_notches WHERE task_grade_id = $1', [req.params.id]);
    await dbQuery('UPDATE task_grade_history SET task_grade_id = NULL WHERE task_grade_id = $1', [req.params.id]);
    await dbQuery('UPDATE task_grade_notch_history SET task_grade_id = NULL WHERE task_grade_id = $1', [req.params.id]);
    await dbQuery('DELETE FROM task_grades WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Task grade deleted' });
  } catch (err) { next(err); }
});

router.get('/task-grades/:id/history', authenticate, async (req, res, next) => {
  try {
    const gradeHistory = await dbQuery(
      `SELECT *, 'grade' AS record_type FROM task_grade_history WHERE task_grade_id = $1 ORDER BY changed_at DESC`, [req.params.id]
    );
    const notchHistory = await dbQuery(
      `SELECT *, 'notch' AS record_type FROM task_grade_notch_history WHERE task_grade_id = $1 ORDER BY changed_at DESC`, [req.params.id]
    );
    const combined = [...gradeHistory.rows, ...notchHistory.rows].sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at));
    res.json({ success: true, data: combined });
  } catch (err) { next(err); }
});

// === TASK GRADE NOTCHES ===
router.get('/task-grades/:gradeId/notches', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM task_grade_notches WHERE task_grade_id = $1 ORDER BY notch_number, start_date DESC', [req.params.gradeId]);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/task-grades/:gradeId/notches', authenticate, auditLog('CREATE', 'task_grade_notches'), async (req, res, next) => {
  try {
    const { notch_number, min_salary, max_salary, start_date, end_date } = req.body;
    if (!notch_number || min_salary == null || max_salary == null || !start_date) return res.status(400).json({ success: false, error: { message: 'Notch number, min salary, max salary and start date are required' } });
    if (parseFloat(max_salary) < parseFloat(min_salary)) return res.status(400).json({ success: false, error: { message: 'Max salary must be greater than or equal to min salary' } });
    const existing = await dbQuery(
      'SELECT id FROM task_grade_notches WHERE task_grade_id = $1 AND notch_number = $2',
      [req.params.gradeId, notch_number]
    );
    if (existing.rows.length > 0) return res.status(400).json({ success: false, error: { message: `Notch ${notch_number} already exists for this grade` } });
    const result = await dbQuery(
      `INSERT INTO task_grade_notches (task_grade_id, notch_number, min_salary, max_salary, start_date, end_date)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.gradeId, notch_number, min_salary, max_salary, start_date, end_date || '9999-12-31']
    );
    const row = result.rows[0];
    await dbQuery(
      `INSERT INTO task_grade_notch_history (notch_id, task_grade_id, change_type, snapshot, changed_by)
       VALUES ($1, $2, 'CREATE', $3, $4)`,
      [row.id, req.params.gradeId, JSON.stringify(row), req.user?.id || null]
    );
    res.status(201).json({ success: true, data: row });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ success: false, error: { message: 'This notch already exists for this grade' } });
    next(err);
  }
});

router.put('/task-grade-notches/:id', authenticate, auditLog('UPDATE', 'task_grade_notches'), async (req, res, next) => {
  try {
    const { notch_number, min_salary, max_salary, start_date, end_date } = req.body;
    if (parseFloat(max_salary) < parseFloat(min_salary)) return res.status(400).json({ success: false, error: { message: 'Max salary must be greater than or equal to min salary' } });
    const result = await dbQuery(
      `UPDATE task_grade_notches SET notch_number=$1, min_salary=$2, max_salary=$3, start_date=$4, end_date=$5 WHERE id=$6 RETURNING *`,
      [notch_number, min_salary, max_salary, start_date, end_date || '9999-12-31', req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Notch not found' } });
    const row = result.rows[0];
    await dbQuery(
      `INSERT INTO task_grade_notch_history (notch_id, task_grade_id, change_type, snapshot, changed_by)
       VALUES ($1, $2, 'UPDATE', $3, $4)`,
      [row.id, row.task_grade_id, JSON.stringify(row), req.user?.id || null]
    );
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});

router.delete('/task-grade-notches/:id', authenticate, auditLog('DELETE', 'task_grade_notches'), async (req, res, next) => {
  try {
    const snap = await dbQuery('SELECT * FROM task_grade_notches WHERE id = $1', [req.params.id]);
    if (snap.rows.length) {
      await dbQuery(
        `INSERT INTO task_grade_notch_history (notch_id, task_grade_id, change_type, snapshot, changed_by) VALUES ($1, $2, 'DELETE', $3, $4)`,
        [snap.rows[0].id, snap.rows[0].task_grade_id, JSON.stringify(snap.rows[0]), req.user?.id || null]
      );
    }
    await dbQuery('UPDATE task_grade_notch_history SET notch_id = NULL WHERE notch_id = $1', [req.params.id]);
    await dbQuery('DELETE FROM task_grade_notches WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Notch deleted' });
  } catch (err) { next(err); }
});

// === MUNICIPALITY DETAILS ===
router.get('/municipality', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery("SELECT key, value FROM system_settings WHERE category IN ('municipality', 'sars') ORDER BY category, key");
    const settings = {};
    result.rows.forEach(r => { settings[r.key] = r.value; });
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
});

router.put('/municipality', authenticate, auditLog('UPDATE', 'system_settings'), async (req, res, next) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') return res.status(400).json({ success: false, error: { message: 'Settings object required' } });
    const validKeys = [
      'paye_reference', 'sdl_reference', 'uif_reference',
      'sars_contact_first_name', 'sars_contact_surname',
      'sars_contact_position_id', 'sars_contact_phone', 'sars_contact_email',
      'sez_code_id', 'sic_subclass_id',
      'industry_group', 'activity_group',
      'payslip_template', 'payslip_show_company_contributions', 'payslip_group_transactions',
      'bonus_payment_timing', 'bonus_payment_month'
    ];
    for (const [key, value] of Object.entries(settings)) {
      if (!validKeys.includes(key)) continue;
      const category = key.startsWith('municipality_') ? 'municipality' : 'sars';
      await dbQuery(
        `INSERT INTO system_settings (key, value, category, updated_at) VALUES ($1, $2, $3, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, category = $3, updated_at = NOW()`,
        [key, String(value), category]
      );
    }
    res.json({ success: true, message: 'Municipality details updated' });
  } catch (err) { next(err); }
});

router.post('/municipality/logo', authenticate, (req, res, next) => {
  logoUpload.single('logo')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ success: false, error: { message: 'File too large. Maximum size is 2 MB.' } });
      return res.status(400).json({ success: false, error: { message: err.message || 'Upload failed' } });
    }
    next();
  });
}, async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
    const oldResult = await dbQuery("SELECT value FROM system_settings WHERE key = 'municipality_logo'");
    if (oldResult.rows.length && oldResult.rows[0].value) {
      const oldPath = oldResult.rows[0].value;
      if (oldPath !== req.file.path && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    const filePath = req.file.path;
    await dbQuery(
      `INSERT INTO system_settings (key, value, category, updated_at) VALUES ('municipality_logo', $1, 'municipality', NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [filePath]
    );
    res.json({ success: true, data: { path: filePath } });
  } catch (err) { next(err); }
});

router.get('/municipality/logo', async (req, res, next) => {
  try {
    const result = await dbQuery("SELECT value FROM system_settings WHERE key = 'municipality_logo'");
    if (!result.rows.length || !result.rows[0].value) return res.status(404).json({ success: false, error: { message: 'No logo found' } });
    const filePath = result.rows[0].value;
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, error: { message: 'Logo file not found' } });
    res.sendFile(path.resolve(filePath));
  } catch (err) { next(err); }
});

router.delete('/municipality/logo', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery("SELECT value FROM system_settings WHERE key = 'municipality_logo'");
    if (result.rows.length && result.rows[0].value) {
      const filePath = result.rows[0].value;
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await dbQuery("DELETE FROM system_settings WHERE key = 'municipality_logo'");
    res.json({ success: true, message: 'Logo removed' });
  } catch (err) { next(err); }
});

router.get('/sez-codes', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT id, code FROM const_sez_codes ORDER BY id');
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/sic-subclasses', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT id, description, class_id FROM const_sic_subclasses WHERE enabled = TRUE ORDER BY id');
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/trade-classification-groups', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT id, code, description FROM const_trade_classification_groups WHERE enabled = TRUE ORDER BY code');
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/trade-classification-activities', authenticate, async (req, res, next) => {
  try {
    const { group_id } = req.query;
    let sql = 'SELECT id, group_id, code, description FROM const_trade_classification_activities WHERE enabled = TRUE';
    const params = [];
    if (group_id) { sql += ' AND group_id = $1'; params.push(group_id); }
    sql += ' ORDER BY code';
    const result = await dbQuery(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/positions-lookup', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery("SELECT id, position_code, title FROM positions WHERE enabled = TRUE ORDER BY title");
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/system', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT key, value, category FROM system_settings ORDER BY category, key');
    const settings = {};
    result.rows.forEach(r => { settings[r.key] = r.value; });
    res.json({ success: true, data: settings, rows: result.rows });
  } catch (err) { next(err); }
});

router.put('/system', authenticate, auditLog('UPDATE', 'system_settings'), async (req, res, next) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') return res.status(400).json({ success: false, error: { message: 'Settings object required' } });
    for (const [key, value] of Object.entries(settings)) {
      await dbQuery(
        `INSERT INTO system_settings (key, value, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, String(value)]
      );
    }
    res.json({ success: true, message: 'Settings updated' });
  } catch (err) { next(err); }
});

// === CLAIM RATES ===
router.get('/claim-rates', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM claim_rates ORDER BY claim_type, effective_date DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/claim-rates', authenticate, auditLog('CREATE', 'claim_rates'), async (req, res, next) => {
  try {
    const { claim_type, description, rate, rate_unit, effective_date, end_date } = req.body;
    const result = await dbQuery(
      `INSERT INTO claim_rates (claim_type, description, rate, rate_unit, effective_date, end_date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [claim_type, description, rate, rate_unit, effective_date, end_date]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/claim-rates/:id', authenticate, auditLog('UPDATE', 'claim_rates'), async (req, res, next) => {
  try {
    const { claim_type, description, rate, rate_unit, effective_date, end_date } = req.body;
    const result = await dbQuery(
      `UPDATE claim_rates SET claim_type=$1, description=$2, rate=$3, rate_unit=$4, effective_date=$5, end_date=$6 WHERE id=$7 RETURNING *`,
      [claim_type, description, rate, rate_unit, effective_date, end_date, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Claim rate not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

// === PERMISSIONS MANAGEMENT ===
router.get('/permissions', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT p.*, r.name AS role_name, r.code AS role_code
       FROM permissions p JOIN roles r ON p.role_id = r.id ORDER BY r.name, p.module, p.action`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/permissions', authenticate, auditLog('CREATE', 'permissions'), async (req, res, next) => {
  try {
    const { role_id, module, action, field_restrictions } = req.body;
    const result = await dbQuery(
      `INSERT INTO permissions (role_id, module, action, field_restrictions) VALUES ($1,$2,$3,$4) RETURNING *`,
      [role_id, module, action, field_restrictions || '{}']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/permissions/:id', authenticate, auditLog('DELETE', 'permissions'), async (req, res, next) => {
  try {
    await dbQuery('DELETE FROM permissions WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Permission removed' });
  } catch (err) { next(err); }
});

// === USER ROLE MANAGEMENT ===
router.get('/user-roles', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT ur.*, u.username, r.name AS role_name, r.code AS role_code
       FROM user_roles ur JOIN users u ON ur.user_id = u.id JOIN roles r ON ur.role_id = r.id ORDER BY u.username`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/user-roles', authenticate, auditLog('CREATE', 'user_roles'), async (req, res, next) => {
  try {
    const { user_id, role_id } = req.body;
    const result = await dbQuery(
      `INSERT INTO user_roles (user_id, role_id) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING *`,
      [user_id, role_id]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/user-roles/:id', authenticate, auditLog('DELETE', 'user_roles'), async (req, res, next) => {
  try {
    await dbQuery('DELETE FROM user_roles WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'User role removed' });
  } catch (err) { next(err); }
});

router.get('/departments', authenticate, async (req, res, next) => {
  try {
    const { getDepartments } = require('./department.routes');
    const departments = await getDepartments();
    res.json({ success: true, data: departments });
  } catch (err) { next(err); }
});

router.get('/divisions', authenticate, async (req, res, next) => {
  try {
    const { getDepartments, getDivisions } = require('./department.routes');
    const [divisions, departments] = await Promise.all([getDivisions(), getDepartments()]);
    const deptMap = new Map(departments.map(d => [d.id, d]));
    const enriched = divisions.map(div => ({
      ...div,
      department_name: deptMap.get(div.department_id)?.name || null,
      department_code: deptMap.get(div.department_id)?.code || null
    }));
    res.json({ success: true, data: enriched });
  } catch (err) { next(err); }
});

router.get('/shifts', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM work_shifts WHERE enabled = TRUE ORDER BY name');
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/ems-vendors', authenticate, async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const EMS_API_BASE_URL = process.env.EMS_API_BASE_URL || 'https://nicki-unrecuperated-counteractively.ngrok-free.dev';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(`${EMS_API_BASE_URL}/vendors`, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`EMS API responded with status ${response.status}`);
      const data = await response.json();
      const raw = Array.isArray(data) ? data : (data.data || data.vendors || []);
      let vendors = raw.filter(v => (v.vendorId ?? v.VendorId) != null).map(v => ({
        vendor_id: v.vendorId ?? v.VendorId,
        vendor_name: v.vendorName ?? v.VendorName,
        my_reference_number: v.myReferenceNumber ?? v.MyReferenceNumber ?? null,
        vat_registered: (v.vatRegistered ?? v.VatRegistered) != null ? Boolean(v.vatRegistered ?? v.VatRegistered) : null,
        commission_percentage: (v.commissionPercentage ?? v.CommissionPercentage) != null ? Number(v.commissionPercentage ?? v.CommissionPercentage) : null,
        active_for_payroll: (v.activeForPayroll ?? v.ActiveForPayroll) != null ? Boolean(v.activeForPayroll ?? v.ActiveForPayroll) : null
      }));

      if (search) {
        const s = search.toLowerCase();
        vendors = vendors.filter(v => (v.vendor_name || '').toLowerCase().includes(s));
      }
      vendors.sort((a, b) => (a.vendor_name || '').localeCompare(b.vendor_name || ''));
      const total = vendors.length;
      const paged = vendors.slice(offset, offset + limitNum);
      return res.json({
        success: true,
        data: paged,
        pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
      });
    } catch (apiErr) {
      clearTimeout(timeout);
      console.error('[EMS Vendors] API unavailable:', apiErr.message);
      return res.status(503).json({ success: false, error: { message: 'EMS vendor API is currently unavailable' } });
    }
  } catch (err) { next(err); }
});

// === SARS PRESCRIBED RATES ===
router.get('/sars-prescribed-rates', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM sars_prescribed_rates ORDER BY tax_year DESC, description');
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/sars-prescribed-rates/lookup', authenticate, async (req, res, next) => {
  try {
    const { subtype, date } = req.query;
    const lookupDate = date || new Date().toISOString().split('T')[0];
    const result = await dbQuery(
      `SELECT * FROM sars_prescribed_rates WHERE subtype_index = $1 AND effective_date <= $2 AND (end_date IS NULL OR end_date >= $2) ORDER BY effective_date DESC LIMIT 1`,
      [subtype, lookupDate]
    );
    res.json({ success: true, data: result.rows[0] || null });
  } catch (err) { next(err); }
});

router.post('/sars-prescribed-rates', authenticate, auditLog('CREATE', 'sars_prescribed_rates'), async (req, res, next) => {
  try {
    const { tax_year, description, subtype_index, irp5_code, rate, effective_date, end_date } = req.body;
    const result = await dbQuery(
      `INSERT INTO sars_prescribed_rates (tax_year, description, subtype_index, irp5_code, rate, effective_date, end_date) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [tax_year, description, subtype_index, irp5_code, rate, effective_date, end_date]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/sars-prescribed-rates/:id', authenticate, auditLog('UPDATE', 'sars_prescribed_rates'), async (req, res, next) => {
  try {
    const { tax_year, description, subtype_index, irp5_code, rate, effective_date, end_date } = req.body;
    const result = await dbQuery(
      `UPDATE sars_prescribed_rates SET tax_year=$1, description=$2, subtype_index=$3, irp5_code=$4, rate=$5, effective_date=$6, end_date=$7, updated_at=NOW() WHERE id=$8 RETURNING *`,
      [tax_year, description, subtype_index, irp5_code, rate, effective_date, end_date, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'SARS rate not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/sars-prescribed-rates/:id', authenticate, auditLog('DELETE', 'sars_prescribed_rates'), async (req, res, next) => {
  try {
    await dbQuery('DELETE FROM sars_prescribed_rates WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'SARS prescribed rate deleted' });
  } catch (err) { next(err); }
});

router.post('/sars-prescribed-rates/copy', authenticate, auditLog('CREATE', 'sars_prescribed_rates'), async (req, res, next) => {
  try {
    const { from_year, to_year } = req.body;
    if (!from_year || !to_year) return res.status(400).json({ success: false, error: { message: 'from_year and to_year are required' } });
    const existing = await dbQuery('SELECT COUNT(*) AS cnt FROM sars_prescribed_rates WHERE tax_year = $1', [to_year]);
    if (parseInt(existing.rows[0].cnt) > 0) return res.status(400).json({ success: false, error: { message: `SARS rates already exist for tax year ${to_year}` } });
    const newEffective = `${to_year - 1}-03-01`;
    await dbQuery(
      `INSERT INTO sars_prescribed_rates (tax_year, description, subtype_index, irp5_code, rate, effective_date, end_date)
       SELECT $1, description, subtype_index, irp5_code, rate, $2::date, '9999-12-31'::date
       FROM sars_prescribed_rates WHERE tax_year = $3`,
      [to_year, newEffective, from_year]
    );
    const result = await dbQuery('SELECT * FROM sars_prescribed_rates WHERE tax_year = $1 ORDER BY description', [to_year]);
    res.status(201).json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

// === CLAIM CONFIGURATIONS ===
router.get('/claim-configurations', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT cc.*, et.name AS employee_type_name, sh.name AS salary_head_name, spr.rate AS sars_rate, spr.description AS sars_description
       FROM claim_configurations cc
       LEFT JOIN employee_types et ON cc.employee_type_id = et.id
       LEFT JOIN salary_heads sh ON cc.salary_head_id = sh.id
       LEFT JOIN sars_prescribed_rates spr ON cc.sars_prescribed_rate_id = spr.id
       ORDER BY cc.claim_type, cc.claim_subtype, cc.effective_date DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/claim-configurations/:id', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT cc.*, et.name AS employee_type_name, sh.name AS salary_head_name, spr.rate AS sars_rate, spr.description AS sars_description
       FROM claim_configurations cc
       LEFT JOIN employee_types et ON cc.employee_type_id = et.id
       LEFT JOIN salary_heads sh ON cc.salary_head_id = sh.id
       LEFT JOIN sars_prescribed_rates spr ON cc.sars_prescribed_rate_id = spr.id
       WHERE cc.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Claim configuration not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.post('/claim-configurations', authenticate, auditLog('CREATE', 'claim_configurations'), async (req, res, next) => {
  try {
    const { claim_type, claim_subtype, claim_group, employee_type_id, client_policy, sars_prescribed_rate_id, salary_head_id, effective_date, end_date } = req.body;
    const result = await dbQuery(
      `INSERT INTO claim_configurations (claim_type, claim_subtype, claim_group, employee_type_id, client_policy, sars_prescribed_rate_id, salary_head_id, effective_date, end_date, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [claim_type, claim_subtype, claim_group, employee_type_id || null, client_policy || null, sars_prescribed_rate_id || null, salary_head_id || null, effective_date, end_date || null, req.user?.id || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/claim-configurations/:id', authenticate, auditLog('UPDATE', 'claim_configurations'), async (req, res, next) => {
  try {
    const { claim_type, claim_subtype, claim_group, employee_type_id, client_policy, sars_prescribed_rate_id, salary_head_id, effective_date, end_date } = req.body;
    const result = await dbQuery(
      `UPDATE claim_configurations SET claim_type=$1, claim_subtype=$2, claim_group=$3, employee_type_id=$4, client_policy=$5, sars_prescribed_rate_id=$6, salary_head_id=$7, effective_date=$8, end_date=$9, updated_at=NOW(), updated_by=$10 WHERE id=$11 RETURNING *`,
      [claim_type, claim_subtype, claim_group, employee_type_id || null, client_policy || null, sars_prescribed_rate_id || null, salary_head_id || null, effective_date, end_date || null, req.user?.id || null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Claim configuration not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/claim-configurations/:id', authenticate, auditLog('DELETE', 'claim_configurations'), async (req, res, next) => {
  try {
    await dbQuery('DELETE FROM claim_configurations WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Claim configuration deleted' });
  } catch (err) { next(err); }
});

// === CONSTANTS LOOKUP ===
const CONST_TABLES = {
  'irp5_codes': 'IRP5 Source Codes',
  'const_salary_calculation_methods': 'Salary Calculation Methods',
  'const_salary_transaction_types': 'Salary Transaction Types',
  'const_sez_codes': 'SEZ Codes',
  'const_sic_subclasses': 'SIC Subclasses',
  'const_task_skill_levels': 'Task Skill Levels',
  'const_trade_classification_activities': 'Trade Classification Activities',
  'const_trade_classification_groups': 'Trade Classification Groups'
};

router.get('/constants', authenticate, async (req, res, next) => {
  try {
    const tables = Object.entries(CONST_TABLES).map(([table, label]) => ({ table, label }));
    res.json({ success: true, data: tables });
  } catch (err) { next(err); }
});

router.get('/constants/:tableName', authenticate, async (req, res, next) => {
  try {
    const { tableName } = req.params;
    if (!CONST_TABLES[tableName]) {
      return res.status(400).json({ success: false, error: { message: 'Invalid table name' } });
    }
    const result = await dbQuery(`SELECT * FROM ${tableName} ORDER BY id`);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

module.exports = router;
