const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');
const { query: dbQuery } = require('../config/database');

router.get('/types', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('SELECT * FROM employment_change_types ORDER BY id');
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/reasons', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(`
      SELECT r.*, t.code AS type_code, t.description AS type_description
      FROM employment_change_reasons r
      JOIN employment_change_types t ON t.id = r.employment_change_type_id
      ORDER BY t.description, r.reason_description
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/reasons/:id', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(`
      SELECT r.*, t.code AS type_code, t.description AS type_description
      FROM employment_change_reasons r
      JOIN employment_change_types t ON t.id = r.employment_change_type_id
      WHERE r.id = $1
    `, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Employment change reason not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.post('/reasons', authenticate, auditLog('CREATE', 'employment_change_reasons'), async (req, res, next) => {
  try {
    const { employment_change_type_id, reason_description, enabled } = req.body;
    if (!employment_change_type_id || !reason_description?.trim()) {
      return res.status(400).json({ success: false, error: { message: 'Employment change type and reason description are required' } });
    }
    const typeCheck = await dbQuery('SELECT id FROM employment_change_types WHERE id = $1', [employment_change_type_id]);
    if (!typeCheck.rows.length) {
      return res.status(400).json({ success: false, error: { message: 'Invalid employment change type' } });
    }
    const result = await dbQuery(`
      INSERT INTO employment_change_reasons (employment_change_type_id, reason_description, enabled, created_by)
      VALUES ($1, $2, $3, $4) RETURNING *
    `, [employment_change_type_id, reason_description.trim(), enabled !== false, req.user?.id || null]);
    const row = result.rows[0];
    await dbQuery(`
      INSERT INTO employment_change_reason_history (employment_change_reason_id, change_type, snapshot, changed_by)
      VALUES ($1, 'CREATE', $2, $3)
    `, [row.id, JSON.stringify(row), req.user?.id || null]);
    const full = await dbQuery(`
      SELECT r.*, t.code AS type_code, t.description AS type_description
      FROM employment_change_reasons r
      JOIN employment_change_types t ON t.id = r.employment_change_type_id
      WHERE r.id = $1
    `, [row.id]);
    res.status(201).json({ success: true, data: full.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ success: false, error: { message: 'This reason already exists for the selected employment change type' } });
    }
    next(err);
  }
});

router.put('/reasons/:id', authenticate, auditLog('UPDATE', 'employment_change_reasons'), async (req, res, next) => {
  try {
    const { employment_change_type_id, reason_description, enabled } = req.body;
    if (!employment_change_type_id || !reason_description?.trim()) {
      return res.status(400).json({ success: false, error: { message: 'Employment change type and reason description are required' } });
    }
    const typeCheck = await dbQuery('SELECT id FROM employment_change_types WHERE id = $1', [employment_change_type_id]);
    if (!typeCheck.rows.length) {
      return res.status(400).json({ success: false, error: { message: 'Invalid employment change type' } });
    }
    const result = await dbQuery(`
      UPDATE employment_change_reasons
      SET employment_change_type_id = $1, reason_description = $2, enabled = $3, updated_at = NOW(), updated_by = $4
      WHERE id = $5 RETURNING *
    `, [employment_change_type_id, reason_description.trim(), enabled !== false, req.user?.id || null, req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Employment change reason not found' } });
    const row = result.rows[0];
    await dbQuery(`
      INSERT INTO employment_change_reason_history (employment_change_reason_id, change_type, snapshot, changed_by)
      VALUES ($1, 'UPDATE', $2, $3)
    `, [row.id, JSON.stringify(row), req.user?.id || null]);
    const full = await dbQuery(`
      SELECT r.*, t.code AS type_code, t.description AS type_description
      FROM employment_change_reasons r
      JOIN employment_change_types t ON t.id = r.employment_change_type_id
      WHERE r.id = $1
    `, [row.id]);
    res.json({ success: true, data: full.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ success: false, error: { message: 'This reason already exists for the selected employment change type' } });
    }
    next(err);
  }
});

router.delete('/reasons/:id', authenticate, auditLog('DELETE', 'employment_change_reasons'), async (req, res, next) => {
  try {
    const existing = await dbQuery('SELECT * FROM employment_change_reasons WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ success: false, error: { message: 'Employment change reason not found' } });
    await dbQuery(`
      INSERT INTO employment_change_reason_history (employment_change_reason_id, change_type, snapshot, changed_by)
      VALUES ($1, 'DELETE', $2, $3)
    `, [req.params.id, JSON.stringify(existing.rows[0]), req.user?.id || null]);
    await dbQuery('DELETE FROM employment_change_reasons WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Employment change reason deleted' });
  } catch (err) { next(err); }
});

router.get('/reasons/:id/history', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(`
      SELECT * FROM employment_change_reason_history
      WHERE employment_change_reason_id = $1
      ORDER BY changed_at DESC
    `, [req.params.id]);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

module.exports = router;
