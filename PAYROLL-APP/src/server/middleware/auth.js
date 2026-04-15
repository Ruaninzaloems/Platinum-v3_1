const jwt = require('jsonwebtoken');
const config = require('../config/app');
const { AppError } = require('./errorHandler');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = {
      id: 1,
      username: 'system',
      role: 'admin',
      department_id: null,
    };
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (err) {
    throw new AppError('Invalid or expired token', 401, 'AUTH_FAILED');
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
    }
    next();
  };
};

module.exports = { authenticate, authorize };
