const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const svc = require('../services/bank-lookup.service');

function sendUpstreamError(res, err) {
  const status = err.statusCode || 502;
  return res.status(status).json({
    success: false,
    error: {
      code: err.code || 'BANK_LOOKUP_UNAVAILABLE',
      message: 'Bank lookup service is currently unavailable. Please try again.',
    },
  });
}

router.get('/banks', authenticate, async (req, res) => {
  try {
    const list = await svc.getBanks();
    res.json({ success: true, data: list });
  } catch (err) { sendUpstreamError(res, err); }
});

router.get('/bank-branch-codes', authenticate, async (req, res) => {
  try {
    const list = await svc.getBranchCodes();
    const bankId = req.query.bankId ? Number(req.query.bankId) : null;
    const filtered = bankId ? list.filter(b => Number(b.bankId) === bankId) : list;
    res.json({ success: true, data: filtered });
  } catch (err) { sendUpstreamError(res, err); }
});

router.get('/bank-account-types', authenticate, async (req, res) => {
  try {
    const list = await svc.getAccountTypes();
    res.json({ success: true, data: list });
  } catch (err) { sendUpstreamError(res, err); }
});

module.exports = router;
