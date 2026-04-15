const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { query: dbQuery } = require('../config/database');
const { getNotifications, markRead, markAllRead, createNotification, sendEmailNotification, getUnreadCount } = require('../services/notification.service');
const { initWorkflow, actionStep, checkEscalations, getMyPendingActions, getDelegations } = require('../services/workflow.service');

router.get('/', authenticate, async (req, res, next) => {
  try {
    const data = await getNotifications(req.user?.id || 1, parseInt(req.query.limit) || 20);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.put('/:id/read', authenticate, async (req, res, next) => {
  try {
    await markRead(parseInt(req.params.id));
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) { next(err); }
});

router.put('/read-all', authenticate, async (req, res, next) => {
  try {
    await markAllRead(req.user?.id || 1);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) { next(err); }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const n = await createNotification(req.body);
    res.status(201).json({ success: true, data: n });
  } catch (err) { next(err); }
});

router.post('/send-email', authenticate, async (req, res, next) => {
  try {
    const { to, subject, body, cc, bcc } = req.body;
    const result = await sendEmailNotification({ to, subject, body, cc, bcc });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.get('/approval-workflows', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT * FROM approval_workflows WHERE is_active = TRUE ORDER BY workflow_name`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    if (err.message && err.message.includes('does not exist')) {
      res.json({ success: true, data: [], message: 'Approval workflows table not yet configured' });
    } else { next(err); }
  }
});

router.post('/approval-workflows', authenticate, async (req, res, next) => {
  try {
    const { workflow_name, entity_type, steps } = req.body;
    const result = await dbQuery(
      `INSERT INTO approval_workflows (workflow_name, entity_type, steps) VALUES ($1,$2,$3) RETURNING *`,
      [workflow_name, entity_type, JSON.stringify(steps)]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.message && err.message.includes('does not exist')) {
      res.status(400).json({ success: false, error: { message: 'Approval workflows table not yet configured' } });
    } else { next(err); }
  }
});

router.put('/approval-workflows/:id', authenticate, async (req, res, next) => {
  try {
    const { workflow_name, entity_type, steps, is_active } = req.body;
    const result = await dbQuery(
      `UPDATE approval_workflows SET workflow_name=$1, entity_type=$2, steps=$3, is_active=$4 WHERE id=$5 RETURNING *`,
      [workflow_name, entity_type, JSON.stringify(steps), is_active !== false, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Workflow not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.message && err.message.includes('does not exist')) {
      res.status(400).json({ success: false, error: { message: 'Approval workflows table not yet configured' } });
    } else { next(err); }
  }
});

router.get('/unread-count', authenticate, async (req, res, next) => {
  try {
    const counts = await getUnreadCount(req.user?.id || 1);
    res.json({ success: true, data: counts });
  } catch (err) { next(err); }
});

router.get('/workflows/definitions', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT * FROM workflow_definitions ORDER BY name`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/workflows/definitions', authenticate, async (req, res, next) => {
  try {
    const { name, entity_type, module, steps, enabled } = req.body;
    const result = await dbQuery(
      `INSERT INTO workflow_definitions (name, entity_type, module, steps, enabled)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, entity_type, module || null, JSON.stringify(steps || []), enabled !== false]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/workflows/definitions/:id', authenticate, async (req, res, next) => {
  try {
    const { name, entity_type, module, steps, enabled } = req.body;
    const result = await dbQuery(
      `UPDATE workflow_definitions SET name=$1, entity_type=$2, module=$3, steps=$4, enabled=$5 WHERE id=$6 RETURNING *`,
      [name, entity_type, module || null, JSON.stringify(steps || []), enabled !== false, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Workflow definition not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/workflows/pending', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id || 1;
    const pending = await getMyPendingActions(userId);
    res.json({ success: true, data: pending });
  } catch (err) { next(err); }
});

router.post('/workflows/init', authenticate, async (req, res, next) => {
  try {
    const { module, entityId } = req.body;
    const userId = req.user?.id || 1;
    const instance = await initWorkflow(module, entityId, userId);
    if (!instance) {
      return res.status(404).json({ success: false, error: { message: 'No workflow definition found for this module' } });
    }
    res.status(201).json({ success: true, data: instance });
  } catch (err) { next(err); }
});

router.post('/workflows/steps/:id/action', authenticate, async (req, res, next) => {
  try {
    const { action, comments } = req.body;
    const userId = req.user?.id || 1;
    const result = await actionStep(parseInt(req.params.id), action, userId, comments);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.post('/workflows/escalations', authenticate, async (req, res, next) => {
  try {
    const escalated = await checkEscalations();
    res.json({ success: true, data: escalated });
  } catch (err) { next(err); }
});

router.get('/delegations', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id || 1;
    const delegations = await getDelegations(userId);
    res.json({ success: true, data: delegations });
  } catch (err) { next(err); }
});

router.post('/delegations', authenticate, async (req, res, next) => {
  try {
    const { to_user, start_date, end_date, module } = req.body;
    const fromUser = req.user?.id || 1;
    const result = await dbQuery(
      `INSERT INTO delegations (from_user, to_user, start_date, end_date, module, active)
       VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING *`,
      [fromUser, to_user, start_date, end_date, module || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/delegations/:id', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `UPDATE delegations SET active = FALSE WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Delegation not found' } });
    res.json({ success: true, message: 'Delegation removed' });
  } catch (err) { next(err); }
});

module.exports = router;
