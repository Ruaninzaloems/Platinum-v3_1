const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { query: dbQuery } = require('../config/database');

router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT tu.*
       FROM trade_unions tu
       ORDER BY tu.representative`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT tu.*
       FROM trade_unions tu
       WHERE tu.id = $1`, [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { representative, vendor_id, contribution_type, contribution_value, maximum_value, enabled } = req.body;
    if (!representative) return res.status(400).json({ success: false, error: 'Representative name is required' });
    const result = await dbQuery(
      `INSERT INTO trade_unions (representative, vendor_id, contribution_type, contribution_value, maximum_value, enabled)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [representative, vendor_id || null, contribution_type || '%', contribution_value || 0, maximum_value || 0, enabled !== false]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { representative, vendor_id, contribution_type, contribution_value, maximum_value, enabled } = req.body;
    if (!representative) return res.status(400).json({ success: false, error: 'Representative name is required' });
    const result = await dbQuery(
      `UPDATE trade_unions SET representative=$1, vendor_id=$2, contribution_type=$3, contribution_value=$4, maximum_value=$5, enabled=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [representative, vendor_id || null, contribution_type || '%', contribution_value || 0, maximum_value || 0, enabled !== false, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery('DELETE FROM trade_unions WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
