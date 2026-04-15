const { query: dbQuery } = require('../config/database');
const { AppError } = require('./errorHandler');

const SENSITIVE_FIELDS = ['annual_salary', 'bank_account_number', 'bank_branch_code', 'bank_name', 'bank_account_type', 'bank_account_holder', 'id_number', 'income_tax_number'];

const checkPermission = (module, action) => {
  return async (req, res, next) => {
    try {
      const userRole = req.user?.role;
      if (!userRole) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      if (userRole === 'admin' || userRole === 'ADMIN') {
        req.fieldRestrictions = {};
        return next();
      }

      const result = await dbQuery(
        `SELECT p.field_restrictions FROM permissions p
         JOIN roles r ON p.role_id = r.id
         WHERE r.name = $1 AND p.module = $2 AND p.action = $3`,
        [userRole, module, action]
      );

      if (result.rows.length === 0) {
        throw new AppError('Insufficient permissions for this action', 403, 'PERMISSION_DENIED');
      }

      req.fieldRestrictions = result.rows[0].field_restrictions || {};
      next();
    } catch (err) {
      if (err instanceof AppError) {
        return next(err);
      }
      next(err);
    }
  };
};

const checkSegregation = (entityType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Authentication required', 401, 'AUTH_REQUIRED');
      }

      const entityId = req.params.id || req.body.entity_id;
      if (!entityId) {
        return next();
      }

      let tableName;
      switch (entityType) {
        case 'payroll_run':
          tableName = 'payroll_runs';
          break;
        case 'leave_transaction':
          tableName = 'leave_transactions';
          break;
        case 'overtime':
          tableName = 'overtime_transactions';
          break;
        case 'termination':
          tableName = 'employee_terminations';
          break;
        default:
          tableName = entityType;
      }

      const result = await dbQuery(
        `SELECT created_by FROM ${tableName} WHERE id = $1`,
        [entityId]
      );

      if (result.rows.length > 0 && result.rows[0].created_by === userId) {
        throw new AppError(
          'Segregation of duties violation: capturer cannot approve their own entries',
          403,
          'SEGREGATION_VIOLATION'
        );
      }

      next();
    } catch (err) {
      if (err instanceof AppError) {
        return next(err);
      }
      next(err);
    }
  };
};

const maskSensitiveFields = (data, restrictions) => {
  if (!restrictions || Object.keys(restrictions).length === 0) {
    return data;
  }

  const maskedFields = restrictions.masked || [];
  const hiddenFields = restrictions.hidden || [];

  const maskValue = (value) => {
    if (!value) return value;
    const str = String(value);
    if (str.length <= 4) return '****';
    return '*'.repeat(str.length - 4) + str.slice(-4);
  };

  const processRecord = (record) => {
    if (!record) return record;
    const masked = { ...record };

    for (const field of hiddenFields) {
      if (field in masked) {
        delete masked[field];
      }
    }

    for (const field of maskedFields) {
      if (field in masked && masked[field] != null) {
        masked[field] = maskValue(masked[field]);
      }
    }

    return masked;
  };

  if (Array.isArray(data)) {
    return data.map(processRecord);
  }
  return processRecord(data);
};

module.exports = { checkPermission, checkSegregation, maskSensitiveFields, SENSITIVE_FIELDS };
