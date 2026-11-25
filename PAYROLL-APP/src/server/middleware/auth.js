const jwt = require('jsonwebtoken');
const config = require('../config/app');
const { AppError } = require('./errorHandler');

// Explicit, opt-in-only escape hatch for local tooling/Swagger-style testing
// without a real POS-API session. Off unless BOTH conditions are met — never
// active in production regardless of this flag's value, and never active by
// merely being in a non-production NODE_ENV the way the old isDev check was.
const allowLegacyHeaderAuth =
  process.env.NODE_ENV !== 'production' && process.env.PAYROLL_ALLOW_DEV_HEADER_AUTH === 'true';

/**
 * Verifies POS-API's global auth JWT (POS-API/ems-jwt.ts) and translates its
 * claims (sub, name, super_user, ...) into this module's existing internal
 * req.user shape (id, username, displayName, role, roles, employeeId,
 * department_id) so none of the ~28 route files that already read req.user
 * need to change.
 */
function userFromGlobalClaims(claims) {
  const roles = claims.super_user ? ['admin', 'hr_manager', 'payroll_admin', 'supervisor', 'employee'] : ['employee'];
  const userId = parseInt(claims.sub, 10) || 0;
  return {
    id: userId,
    username: claims.name,
    displayName: [claims.given_name, claims.family_name].filter(Boolean).join(' ') || claims.name,
    role: roles[0],
    roles,
    employeeId: userId,
    department_id: null,
  };
}

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwt.secret, {
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
      });
      // POS-API's global token (has a `sub` identity claim) vs. any
      // already-shaped legacy token this module may have issued/verified
      // before this migration (has `roles` already) — support both so an
      // old cached token doesn't hard-fail mid-rollout.
      req.user = decoded.sub ? userFromGlobalClaims(decoded) : decoded;
      if (!req.user.roles) {
        req.user.roles = req.user.role ? [req.user.role] : ['employee'];
      }
      return next();
    } catch (err) {
      throw new AppError('Invalid or expired token', 401, 'AUTH_FAILED');
    }
  }

  if (allowLegacyHeaderAuth && req.headers['x-user-id']) {
    const roles = (req.headers['x-user-roles'] || 'admin').split(',').map(r => r.trim()).filter(Boolean);
    req.user = {
      id: parseInt(req.headers['x-user-id'], 10) || 1,
      username: req.headers['x-user-name'] || 'system',
      displayName: req.headers['x-user-display-name'] || 'System Admin',
      role: roles[0] || 'admin',
      roles: roles,
      employeeId: req.headers['x-employee-id'] ? parseInt(req.headers['x-employee-id'], 10) : (parseInt(req.headers['x-user-id'], 10) || 1),
      department_id: null,
    };
    return next();
  }

  // No valid token and no explicit dev opt-in — previously this silently
  // granted a hardcoded system/admin identity to ANY caller with no
  // Authorization header at all (which is exactly what happened on every
  // real request before the shell started sending the global JWT). Reject
  // instead, as a real auth middleware should.
  throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
};

const authorize = (..._roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
    }
    next();
  };
};

module.exports = { authenticate, authorize };
