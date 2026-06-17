const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getMyPendingApprovals } = require('../services/transaction-approval.service');

/**
 * GET /api/v1/approvals
 * Returns the full list of transactions currently waiting on this user.
 * Optional query: types=CLAIM,WAGE  to filter by entity type.
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });
    const userRoles = req.user?.roles || [];

    let entityTypes;
    if (req.query.types) {
      entityTypes = String(req.query.types).split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    }

    const result = await getMyPendingApprovals(userId, userRoles, { entityTypes });
    res.json({ success: true, data: result.items, meta: { counts: result.counts } });
  } catch (err) { next(err); }
});

/**
 * GET /api/v1/approvals/count
 * Lightweight endpoint for badges/widgets — returns counts only.
 */
router.get('/count', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });
    const userRoles = req.user?.roles || [];

    const result = await getMyPendingApprovals(userId, userRoles, {});
    res.json({ success: true, data: result.counts });
  } catch (err) { next(err); }
});

module.exports = router;
