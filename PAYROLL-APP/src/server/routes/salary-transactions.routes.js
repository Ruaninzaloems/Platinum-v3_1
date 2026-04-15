const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');
const { query: dbQuery } = require('../config/database');

router.get('/types', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM const_salary_transaction_types WHERE enabled = true ORDER BY id');
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/calculation-methods', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM const_salary_calculation_methods WHERE enabled = true ORDER BY id');
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/irp5-codes', authenticate, async (req, res, next) => {
  try {
    const all = req.query.all === 'true';
    const q = all
      ? 'SELECT * FROM irp5_codes ORDER BY code'
      : 'SELECT * FROM irp5_codes WHERE enabled = true ORDER BY code';
    const result = await dbQuery(q);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(`
      SELECT sh.*,
        stt.description AS type_description,
        scm.description AS calc_method_description
      FROM salary_heads sh
      LEFT JOIN const_salary_transaction_types stt ON stt.code = sh.transaction_type
      LEFT JOIN const_salary_calculation_methods scm ON scm.code = sh.calculation_method
      ORDER BY sh.id
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(`
      SELECT sh.*,
        stt.description AS type_description,
        scm.description AS calc_method_description
      FROM salary_heads sh
      LEFT JOIN const_salary_transaction_types stt ON stt.code = sh.transaction_type
      LEFT JOIN const_salary_calculation_methods scm ON scm.code = sh.calculation_method
      WHERE sh.id = $1
    `, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Salary transaction not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.post('/', authenticate, auditLog('CREATE', 'salary_heads'), async (req, res, next) => {
  try {
    const {
      code, name, description, transaction_type, calculation_method,
      irp5_code, sars_code, taxable, affects_uif, affects_sdl, show_on_payslip,
      priority, start_date, end_date, pro_rated, retirement_funding_income,
      group_on_payslip_by_irp5, enabled, employer_contribution, employee_contribution
    } = req.body;

    if (!code?.trim() || !name?.trim()) {
      return res.status(400).json({ success: false, error: { message: 'Code and Title are required' } });
    }
    if (!transaction_type) {
      return res.status(400).json({ success: false, error: { message: 'Transaction Type is required' } });
    }

    const result = await dbQuery(`
      INSERT INTO salary_heads (
        code, name, description, transaction_type, calculation_method,
        irp5_code, sars_code, taxable, affects_uif, affects_sdl, show_on_payslip,
        priority, start_date, end_date, pro_rated, retirement_funding_income,
        group_on_payslip_by_irp5, enabled, employer_contribution, employee_contribution,
        created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21
      ) RETURNING *
    `, [
      code.trim(), name.trim(), description || null, transaction_type,
      calculation_method || 'USER_INPUT',
      irp5_code || null, sars_code || null,
      taxable !== false, affects_uif === true, affects_sdl === true,
      show_on_payslip !== false, parseInt(priority) || 0,
      start_date || '1900-01-01', end_date || '9999-12-31',
      pro_rated === true, retirement_funding_income === true,
      group_on_payslip_by_irp5 === true, enabled !== false,
      parseFloat(employer_contribution) || 0, parseFloat(employee_contribution) || 0,
      req.user?.id || null
    ]);

    const row = result.rows[0];
    await dbQuery(`
      INSERT INTO salary_head_history (salary_head_id, change_type, snapshot, changed_by)
      VALUES ($1, 'CREATE', $2, $3)
    `, [row.id, JSON.stringify(row), req.user?.id || null]);

    const full = await dbQuery(`
      SELECT sh.*,
        stt.description AS type_description,
        scm.description AS calc_method_description
      FROM salary_heads sh
      LEFT JOIN const_salary_transaction_types stt ON stt.code = sh.transaction_type
      LEFT JOIN const_salary_calculation_methods scm ON scm.code = sh.calculation_method
      WHERE sh.id = $1
    `, [row.id]);

    res.status(201).json({ success: true, data: full.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ success: false, error: { message: 'A salary transaction with this code already exists' } });
    }
    next(err);
  }
});

router.put('/:id', authenticate, auditLog('UPDATE', 'salary_heads'), async (req, res, next) => {
  try {
    const existing = await dbQuery('SELECT is_system FROM salary_heads WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ success: false, error: { message: 'Salary transaction not found' } });
    if (existing.rows[0].is_system) {
      return res.status(400).json({ success: false, error: { message: 'Cannot edit system salary transactions' } });
    }

    const {
      name, description, transaction_type, calculation_method,
      irp5_code, sars_code, taxable, affects_uif, affects_sdl, show_on_payslip,
      priority, start_date, end_date, pro_rated, retirement_funding_income,
      group_on_payslip_by_irp5, enabled, employer_contribution, employee_contribution
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, error: { message: 'Title is required' } });
    }
    if (!transaction_type) {
      return res.status(400).json({ success: false, error: { message: 'Transaction Type is required' } });
    }

    const result = await dbQuery(`
      UPDATE salary_heads SET
        name = $1, description = $2, transaction_type = $3, calculation_method = $4,
        irp5_code = $5, sars_code = $6, taxable = $7,
        affects_uif = $8, affects_sdl = $9, show_on_payslip = $10,
        priority = $11, start_date = $12, end_date = $13, pro_rated = $14,
        retirement_funding_income = $15, group_on_payslip_by_irp5 = $16,
        enabled = $17, employer_contribution = $18, employee_contribution = $19,
        updated_at = NOW(), updated_by = $20
      WHERE id = $21 RETURNING *
    `, [
      name.trim(), description || null, transaction_type,
      calculation_method || 'USER_INPUT',
      irp5_code || null, sars_code || null,
      taxable !== false, affects_uif === true, affects_sdl === true,
      show_on_payslip !== false, parseInt(priority) || 0,
      start_date || '1900-01-01', end_date || '9999-12-31',
      pro_rated === true, retirement_funding_income === true,
      group_on_payslip_by_irp5 === true, enabled !== false,
      parseFloat(employer_contribution) || 0, parseFloat(employee_contribution) || 0,
      req.user?.id || null, req.params.id
    ]);

    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Salary transaction not found' } });

    const row = result.rows[0];
    await dbQuery(`
      INSERT INTO salary_head_history (salary_head_id, change_type, snapshot, changed_by)
      VALUES ($1, 'UPDATE', $2, $3)
    `, [row.id, JSON.stringify(row), req.user?.id || null]);

    const full = await dbQuery(`
      SELECT sh.*,
        stt.description AS type_description,
        scm.description AS calc_method_description
      FROM salary_heads sh
      LEFT JOIN const_salary_transaction_types stt ON stt.code = sh.transaction_type
      LEFT JOIN const_salary_calculation_methods scm ON scm.code = sh.calculation_method
      WHERE sh.id = $1
    `, [row.id]);

    res.json({ success: true, data: full.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ success: false, error: { message: 'A salary transaction with this code already exists' } });
    }
    next(err);
  }
});

router.delete('/:id', authenticate, auditLog('DELETE', 'salary_heads'), async (req, res, next) => {
  try {
    const existing = await dbQuery('SELECT * FROM salary_heads WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ success: false, error: { message: 'Salary transaction not found' } });

    const row = existing.rows[0];
    if (row.is_system) {
      return res.status(400).json({ success: false, error: { message: 'Cannot delete system salary transactions' } });
    }

    const activeAssignments = await dbQuery(
      'SELECT 1 FROM employee_salary_transactions WHERE salary_head_id = $1 AND enabled = true LIMIT 1',
      [req.params.id]
    );
    if (activeAssignments.rows.length) {
      return res.status(400).json({ success: false, error: { message: 'Cannot delete: this transaction is currently assigned to active employees. Remove employee assignments first.' } });
    }

    const hasPayroll = await dbQuery('SELECT 1 FROM payroll_results WHERE salary_head_id = $1 LIMIT 1', [req.params.id]);
    if (hasPayroll.rows.length) {
      await dbQuery('UPDATE salary_heads SET enabled = false, updated_at = NOW(), updated_by = $1 WHERE id = $2', [req.user?.id || null, req.params.id]);
      await dbQuery(`
        INSERT INTO salary_head_history (salary_head_id, change_type, snapshot, changed_by)
        VALUES ($1, 'DELETE', $2, $3)
      `, [req.params.id, JSON.stringify({ ...row, enabled: false }), req.user?.id || null]);
      res.json({ success: true, message: 'Salary transaction disabled (historical payroll data exists)' });
    } else {
      await dbQuery('DELETE FROM salary_heads WHERE id = $1', [req.params.id]);
      await dbQuery(`
        INSERT INTO salary_head_history (salary_head_id, change_type, snapshot, changed_by)
        VALUES ($1, 'DELETE', $2, $3)
      `, [req.params.id, JSON.stringify(row), req.user?.id || null]);
      res.json({ success: true, message: 'Salary transaction deleted' });
    }
  } catch (err) { next(err); }
});

router.get('/:id/history', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(`
      SELECT * FROM salary_head_history
      WHERE salary_head_id = $1
      ORDER BY changed_at DESC
    `, [req.params.id]);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

module.exports = router;
