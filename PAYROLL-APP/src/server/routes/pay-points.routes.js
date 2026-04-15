const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { query: dbQuery } = require('../config/database');

router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT pp.*,
              (SELECT COUNT(*) FROM pay_point_departments ppd WHERE ppd.pay_point_id = pp.id)::int AS department_count
       FROM pay_points pp
       ORDER BY pp.code, pp.name`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT pp.*,
              (SELECT COUNT(*) FROM pay_point_departments ppd WHERE ppd.pay_point_id = pp.id)::int AS department_count
       FROM pay_points pp
       WHERE pp.id = $1`, [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { code, name, address, location, enabled } = req.body;
    if (!code || !code.trim()) return res.status(400).json({ success: false, error: 'Pay Point Code is required' });
    if (!name || !name.trim()) return res.status(400).json({ success: false, error: 'Description is required' });
    const dup = await dbQuery('SELECT id FROM pay_points WHERE LOWER(code) = LOWER($1)', [code.trim()]);
    if (dup.rows.length > 0) return res.status(409).json({ success: false, error: 'Pay Point Code already exists' });
    const result = await dbQuery(
      `INSERT INTO pay_points (code, name, address, location, enabled)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [code.trim(), name.trim(), address || null, location || null, enabled !== false]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { code, name, address, location, enabled } = req.body;
    if (!code || !code.trim()) return res.status(400).json({ success: false, error: 'Pay Point Code is required' });
    if (!name || !name.trim()) return res.status(400).json({ success: false, error: 'Description is required' });
    const dup = await dbQuery('SELECT id FROM pay_points WHERE LOWER(code) = LOWER($1) AND id != $2', [code.trim(), req.params.id]);
    if (dup.rows.length > 0) return res.status(409).json({ success: false, error: 'Pay Point Code already exists' });
    const result = await dbQuery(
      `UPDATE pay_points SET code=$1, name=$2, address=$3, location=$4, enabled=$5, updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [code.trim(), name.trim(), address || null, location || null, enabled !== false, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('DELETE FROM pay_points WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
});

router.get('/:id/departments', authenticate, async (req, res, next) => {
  try {
    const pp = await dbQuery('SELECT id FROM pay_points WHERE id = $1', [req.params.id]);
    if (pp.rows.length === 0) return res.status(404).json({ success: false, error: 'Pay point not found' });
    const result = await dbQuery(
      `SELECT ppd.id, ppd.pay_point_id, ppd.department_id, ppd.created_at
       FROM pay_point_departments ppd
       WHERE ppd.pay_point_id = $1
       ORDER BY ppd.department_id`, [req.params.id]
    );
    const { enrichDeptDiv } = require('./department.routes');
    await enrichDeptDiv(result.rows);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/:id/departments', authenticate, async (req, res, next) => {
  try {
    const { department_id } = req.body;
    if (!department_id) return res.status(400).json({ success: false, error: 'Department is required' });
    const pp = await dbQuery('SELECT id FROM pay_points WHERE id = $1', [req.params.id]);
    if (pp.rows.length === 0) return res.status(404).json({ success: false, error: 'Pay point not found' });
    const existing = await dbQuery(
      'SELECT id FROM pay_point_departments WHERE pay_point_id = $1 AND department_id = $2',
      [req.params.id, department_id]
    );
    if (existing.rows.length > 0) return res.status(409).json({ success: false, error: 'Department is already linked to this pay point' });
    const result = await dbQuery(
      `INSERT INTO pay_point_departments (pay_point_id, department_id) VALUES ($1, $2) RETURNING *`,
      [req.params.id, department_id]
    );
    const linked = await dbQuery(
      `SELECT ppd.id, ppd.pay_point_id, ppd.department_id, ppd.created_at
       FROM pay_point_departments ppd
       WHERE ppd.id = $1`, [result.rows[0].id]
    );
    res.status(201).json({ success: true, data: linked.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/:id/departments/:deptLinkId', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      'DELETE FROM pay_point_departments WHERE id = $1 AND pay_point_id = $2 RETURNING id',
      [req.params.deptLinkId, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Link not found' });
    res.json({ success: true, message: 'Department unlinked' });
  } catch (err) { next(err); }
});

module.exports = router;
