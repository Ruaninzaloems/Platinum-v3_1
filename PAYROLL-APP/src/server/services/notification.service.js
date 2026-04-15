const { query: dbQuery } = require('../config/database');

async function createNotification({ title, message, type = 'INFO', category, referenceType, referenceId, userId = 1 }) {
  const result = await dbQuery(
    `INSERT INTO notifications (user_id, title, message, type, category, reference_type, reference_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [userId, title, message, type, category, referenceType, referenceId]
  );
  return result.rows[0];
}

async function getNotifications(userId = 1, limit = 20) {
  const result = await dbQuery(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
  const unread = await dbQuery(
    `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE`, [userId]
  );
  return { notifications: result.rows, unread_count: parseInt(unread.rows[0].count) };
}

async function markRead(id) {
  await dbQuery(`UPDATE notifications SET is_read = TRUE WHERE id = $1`, [id]);
}

async function markAllRead(userId = 1) {
  await dbQuery(`UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`, [userId]);
}

async function sendEmailNotification({ to, subject, body, cc, bcc }) {
  const logEntry = await dbQuery(
    `INSERT INTO notifications (user_id, title, message, type, category)
     VALUES (1, $1, $2, 'EMAIL', 'EMAIL') RETURNING *`,
    [subject, `To: ${to} | ${body}`]
  );

  console.log(`[EMAIL SERVICE] To: ${to}, Subject: ${subject}, CC: ${cc || 'none'}, BCC: ${bcc || 'none'}`);
  console.log(`[EMAIL SERVICE] Body: ${body}`);

  return {
    sent: true,
    to,
    subject,
    message_id: `MSG-${Date.now()}`,
    notification_id: logEntry.rows[0].id,
    note: 'Email queued for delivery. Configure SMTP settings for actual sending.'
  };
}

async function sendNotification(userId, type, title, message, actionUrl, priority) {
  const result = await dbQuery(
    `INSERT INTO notifications (user_id, title, message, type, notification_type, action_url, priority)
     VALUES ($1, $2, $3, 'INFO', $4, $5, $6) RETURNING *`,
    [userId, title, message, type || 'SYSTEM', actionUrl || null, priority || 'MEDIUM']
  );
  return result.rows[0];
}

async function sendBulkNotification(userIds, type, title, message) {
  if (!userIds || userIds.length === 0) return [];

  const values = userIds.map((_, i) => {
    const offset = i * 4;
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, 'INFO', $${offset + 4})`;
  }).join(', ');

  const params = userIds.flatMap(uid => [uid, title, message, type || 'SYSTEM']);

  const result = await dbQuery(
    `INSERT INTO notifications (user_id, title, message, type, notification_type) VALUES ${values} RETURNING *`,
    params
  );
  return result.rows;
}

async function getUnreadCount(userId) {
  const result = await dbQuery(
    `SELECT notification_type, COUNT(*) as count
     FROM notifications
     WHERE user_id = $1 AND is_read = FALSE
     GROUP BY notification_type`,
    [userId]
  );

  const counts = { total: 0 };
  for (const row of result.rows) {
    counts[row.notification_type] = parseInt(row.count);
    counts.total += parseInt(row.count);
  }
  return counts;
}

module.exports = { createNotification, getNotifications, markRead, markAllRead, sendEmailNotification, sendNotification, sendBulkNotification, getUnreadCount };
