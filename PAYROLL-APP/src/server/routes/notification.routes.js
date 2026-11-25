const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { query: dbQuery } = require('../config/database');
const { getNotifications, markRead, markAllRead, createNotification, sendEmailNotification, getUnreadCount } = require('../services/notification.service');
const { initWorkflow, actionStep, checkEscalations, getMyPendingActions, getDelegations } = require('../services/workflow.service');
const { handleApproval, handleRejection, handleReturn, ENTITY_CONFIG } = require('../services/transaction-approval.service');

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
      `SELECT wd.*, dep.name as department_name, div.name as division_name
       FROM workflow_definitions wd
       LEFT JOIN departments dep ON wd.department_id = dep.id
       LEFT JOIN divisions div ON wd.division_id = div.id
       ORDER BY wd.name`
    );
    const rows = result.rows;
    for (const row of rows) {
      const steps = row.steps || [];
      if (Array.isArray(steps) && steps.length > 0 && !steps[0].assigned_users) {
        const userMap = {};
        const empIds = steps.map(s => s.assigned_to).filter(Boolean);
        if (empIds.length > 0) {
          const userRows = await dbQuery(
            `SELECT id, employee_id FROM users WHERE employee_id = ANY($1)`,
            [empIds]
          );
          for (const u of userRows.rows) { userMap[u.employee_id] = u.id; }
        }
        row.steps = steps.map(s => ({
          assigned_users: s.assigned_to && userMap[s.assigned_to] ? [userMap[s.assigned_to]] : [],
          assigned_role: s.assigned_role || '',
          sla_hours: s.sla_hours || 48,
          escalation_role: s.escalation_role || 'HR_MANAGER'
        }));
      }
    }
    res.json({ success: true, data: rows });
  } catch (err) {
    if (err.message && err.message.includes('does not exist')) {
      const fallback = await dbQuery(`SELECT * FROM workflow_definitions ORDER BY name`);
      res.json({ success: true, data: fallback.rows });
    } else { next(err); }
  }
});

router.get('/workflows/users', authenticate, authorize('admin', 'payroll_admin', 'hr_manager'), async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT id, username, first_name, surname, employee_id, is_active FROM users WHERE is_active = TRUE ORDER BY id`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

router.post('/workflows/definitions', authenticate, async (req, res, next) => {
  try {
    const { name, entity_type, module, steps, enabled, department_id, division_id } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, error: { message: 'Workflow name is required' } });
    if (!entity_type) return res.status(400).json({ success: false, error: { message: 'Entity type is required' } });
    const parsedSteps = Array.isArray(steps) ? steps : [];
    if (parsedSteps.length === 0) return res.status(400).json({ success: false, error: { message: 'At least one approval level is required' } });
    const invalidStep = parsedSteps.findIndex(s => {
      const users = s.assigned_users || (s.assigned_to ? [s.assigned_to] : []);
      return users.length === 0 && !s.assigned_role;
    });
    if (invalidStep >= 0) return res.status(400).json({ success: false, error: { message: `Level ${invalidStep + 1} must have at least one approver or an assigned role` } });
    const result = await dbQuery(
      `INSERT INTO workflow_definitions (name, entity_type, module, steps, enabled, department_id, division_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name.trim(), entity_type, module || entity_type, JSON.stringify(parsedSteps), enabled !== false, department_id || null, division_id || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.put('/workflows/definitions/:id', authenticate, async (req, res, next) => {
  try {
    const { name, entity_type, module, steps, enabled, department_id, division_id } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, error: { message: 'Workflow name is required' } });
    if (!entity_type) return res.status(400).json({ success: false, error: { message: 'Entity type is required' } });
    const parsedSteps = Array.isArray(steps) ? steps : [];
    if (parsedSteps.length === 0) return res.status(400).json({ success: false, error: { message: 'At least one approval level is required' } });
    const invalidStep = parsedSteps.findIndex(s => {
      const users = s.assigned_users || (s.assigned_to ? [s.assigned_to] : []);
      return users.length === 0 && !s.assigned_role;
    });
    if (invalidStep >= 0) return res.status(400).json({ success: false, error: { message: `Level ${invalidStep + 1} must have at least one approver or an assigned role` } });
    const result = await dbQuery(
      `UPDATE workflow_definitions SET name=$1, entity_type=$2, module=$3, steps=$4, enabled=$5, department_id=$6, division_id=$7 WHERE id=$8 RETURNING *`,
      [name.trim(), entity_type, module || entity_type, JSON.stringify(parsedSteps), enabled !== false, department_id || null, division_id || null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Workflow definition not found' } });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/workflows/definitions/:id', authenticate, async (req, res, next) => {
  try {
    const instances = await dbQuery(
      `SELECT COUNT(*) as cnt FROM workflow_instances WHERE definition_id = $1 AND status IN ('PENDING','IN_PROGRESS')`,
      [req.params.id]
    );
    if (parseInt(instances.rows[0].cnt) > 0) {
      return res.status(400).json({ success: false, error: { message: 'Cannot delete: there are active workflow instances using this definition' } });
    }
    const result = await dbQuery(`DELETE FROM workflow_definitions WHERE id = $1 RETURNING id`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: { message: 'Workflow definition not found' } });
    res.json({ success: true, message: 'Workflow definition deleted' });
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
    const userRoles = req.user?.roles || [];
    const stepId = parseInt(req.params.id);

    const stepLookup = await dbQuery(
      `SELECT wi.entity_type, wi.entity_id
       FROM workflow_steps ws
       JOIN workflow_instances wi ON ws.instance_id = wi.id
       WHERE ws.id = $1`,
      [stepId]
    );
    if (!stepLookup.rows.length) {
      return res.status(404).json({ success: false, error: { message: 'Workflow step not found' } });
    }

    const { entity_type, entity_id } = stepLookup.rows[0];
    const upperAction = (action || '').toUpperCase();

    if (ENTITY_CONFIG[entity_type]) {
      let result;
      if (upperAction === 'APPROVE') {
        result = await handleApproval(entity_type, entity_id, userId, userRoles, comments);
      } else if (upperAction === 'REJECT') {
        result = await handleRejection(entity_type, entity_id, userId, userRoles, comments);
      } else if (upperAction === 'RETURN') {
        result = await handleReturn(entity_type, entity_id, userId, userRoles, comments);
      } else {
        return res.status(400).json({ success: false, error: { message: 'Invalid action. Must be APPROVE, REJECT, or RETURN' } });
      }

      if (!result.success) {
        return res.status(result.status || 400).json({ success: false, error: { message: result.error } });
      }
      return res.json({ success: true, data: result.data, message: result.message });
    }

    console.warn(
      `[approval-fallback] Entity type "${entity_type}" is not registered in ENTITY_CONFIG. ` +
      `Falling back to raw actionStep() — history writes and entity-status updates will be skipped. ` +
      `Register this type in src/server/services/transaction-approval.service.js → ENTITY_CONFIG.`
    );
    const result = await actionStep(stepId, action, userId, comments, userRoles);
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
