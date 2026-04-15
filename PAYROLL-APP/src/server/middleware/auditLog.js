const { query } = require('../config/database');

const auditLog = (action, entity) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      const logEntry = {
        action,
        entity,
        entity_id: req.params.id || data?.data?.id || null,
        user_id: req.user?.id || null,
        username: req.user?.username || 'system',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        request_method: req.method,
        request_url: req.originalUrl,
        request_body: req.method !== 'GET' ? JSON.stringify(req.body) : null,
        response_status: res.statusCode,
        timestamp: new Date().toISOString(),
      };

      query(
        `INSERT INTO audit_log (action, entity_type, entity, entity_id, user_id, username, ip_address, user_agent, request_method, request_url, request_body, response_status, created_at)
         VALUES ($1, $2, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
        [
          logEntry.action,
          logEntry.entity,
          logEntry.entity_id,
          logEntry.user_id,
          logEntry.username,
          logEntry.ip_address,
          logEntry.user_agent,
          logEntry.request_method,
          logEntry.request_url,
          logEntry.request_body,
          logEntry.response_status,
        ]
      ).catch((err) => {
        console.error('Audit log write failed:', err.message);
      });

      return originalJson(data);
    };

    next();
  };
};

module.exports = { auditLog };
