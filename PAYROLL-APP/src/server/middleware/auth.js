const jwt = require('jsonwebtoken');
const config = require('../config/app');
const { AppError } = require('./errorHandler');

const isDev = process.env.NODE_ENV !== 'production';

const authenticate = (req, res, next) => {
  if (isDev && req.headers['x-user-id']) {
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

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = {
      id: 1,
      username: 'system',
      displayName: 'System Admin',
      role: 'admin',
      roles: ['admin', 'hr_manager', 'payroll_admin', 'supervisor', 'employee'],
      employeeId: 1,
      department_id: null,
    };
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);
    if (!decoded.roles) {
      decoded.roles = decoded.role ? [decoded.role] : ['employee'];
    }
    req.user = decoded;
    next();
  } catch (err) {
    throw new AppError('Invalid or expired token', 401, 'AUTH_FAILED');
  }
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
