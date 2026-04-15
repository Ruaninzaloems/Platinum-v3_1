const { validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');
const { query: dbQuery } = require('../config/database');

const validate = (validations) => {
  return async (req, res, next) => {
    for (const validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));

    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: extractedErrors,
      },
    });
  };
};

const paginationMiddleware = (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(10000, Math.max(1, parseInt(req.query.limit, 10) || 25));
  const offset = (page - 1) * limit;
  const sortBy = req.query.sort_by || 'created_at';
  const sortOrder = req.query.sort_order === 'asc' ? 'ASC' : 'DESC';

  req.pagination = { page, limit, offset, sortBy, sortOrder };
  next();
};

const validateSAID = (idNumber) => {
  if (!idNumber || typeof idNumber !== 'string') {
    return { valid: false, message: 'SA ID number is required' };
  }

  const cleaned = idNumber.replace(/\s/g, '');

  if (!/^\d{13}$/.test(cleaned)) {
    return { valid: false, message: 'SA ID number must be exactly 13 digits' };
  }

  const digits = cleaned.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    let d = digits[i];
    if (i % 2 !== 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  if (checkDigit !== digits[12]) {
    return { valid: false, message: 'SA ID number failed Luhn check - invalid check digit' };
  }

  const year = parseInt(cleaned.substring(0, 2), 10);
  const month = parseInt(cleaned.substring(2, 4), 10);
  const day = parseInt(cleaned.substring(4, 6), 10);

  if (month < 1 || month > 12) {
    return { valid: false, message: 'SA ID number contains invalid month' };
  }
  if (day < 1 || day > 31) {
    return { valid: false, message: 'SA ID number contains invalid day' };
  }

  const citizenDigit = parseInt(cleaned.substring(10, 11), 10);
  if (citizenDigit !== 0 && citizenDigit !== 1) {
    return { valid: false, message: 'SA ID number contains invalid citizenship digit' };
  }

  return { valid: true, message: 'Valid SA ID number' };
};

const validateTaxNumber = (taxNumber) => {
  if (!taxNumber || typeof taxNumber !== 'string') {
    return { valid: false, message: 'Tax number is required' };
  }

  const cleaned = taxNumber.replace(/\s/g, '');

  if (!/^\d{10}$/.test(cleaned)) {
    return { valid: false, message: 'Tax number must be exactly 10 digits' };
  }

  if (!cleaned.startsWith('0') && !cleaned.startsWith('1') && !cleaned.startsWith('2') && !cleaned.startsWith('3') && !cleaned.startsWith('9')) {
    return { valid: false, message: 'Tax number must start with 0, 1, 2, 3, or 9' };
  }

  return { valid: true, message: 'Valid tax number' };
};

const validateBankAccount = (branchCode, accountNumber) => {
  if (!branchCode || !accountNumber) {
    return { valid: false, message: 'Branch code and account number are required' };
  }

  const cleanBranch = String(branchCode).replace(/\s/g, '');
  const cleanAccount = String(accountNumber).replace(/\s/g, '');

  if (!/^\d{6}$/.test(cleanBranch)) {
    return { valid: false, message: 'Branch code must be exactly 6 digits' };
  }

  if (!/^\d{7,16}$/.test(cleanAccount)) {
    return { valid: false, message: 'Account number must be between 7 and 16 digits' };
  }

  const combined = cleanBranch + cleanAccount;
  const digits = combined.split('').map(Number);
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits[i];
    if (alternate) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alternate = !alternate;
  }

  return { valid: true, message: 'Bank account format valid' };
};

const checkDuplicateEmployee = async (employeeCode, idNumber, excludeId) => {
  const errors = [];

  if (employeeCode) {
    let query = 'SELECT id, employee_code FROM employees WHERE employee_code = $1 AND enabled = TRUE';
    const params = [employeeCode];
    if (excludeId) {
      query += ' AND id != $2';
      params.push(excludeId);
    }
    const result = await dbQuery(query, params);
    if (result.rows.length > 0) {
      errors.push({ field: 'employee_code', message: `Employee code '${employeeCode}' already exists (Employee #${result.rows[0].id})` });
    }
  }

  if (idNumber) {
    let query = 'SELECT id, id_number FROM employees WHERE id_number = $1 AND enabled = TRUE';
    const params = [idNumber];
    if (excludeId) {
      query += ' AND id != $2';
      params.push(excludeId);
    }
    const result = await dbQuery(query, params);
    if (result.rows.length > 0) {
      errors.push({ field: 'id_number', message: `ID number '${idNumber}' already exists (Employee #${result.rows[0].id})` });
    }
  }

  return errors;
};

const BCEA_MIN_HOURLY_WAGE = 27.58;
const BCEA_ANNUAL_HOURS = 2100;
const BCEA_MIN_ANNUAL_SALARY = BCEA_MIN_HOURLY_WAGE * BCEA_ANNUAL_HOURS;

const validateBCEAMinWage = (annualSalary) => {
  if (annualSalary === undefined || annualSalary === null) {
    return { valid: true, message: 'No salary to validate' };
  }

  const salary = parseFloat(annualSalary);
  if (isNaN(salary)) {
    return { valid: false, message: 'Annual salary must be a valid number' };
  }

  if (salary > 0 && salary < BCEA_MIN_ANNUAL_SALARY) {
    return {
      valid: false,
      message: `Annual salary R${salary.toFixed(2)} is below BCEA minimum wage of R${BCEA_MIN_ANNUAL_SALARY.toFixed(2)}/year (R${BCEA_MIN_HOURLY_WAGE}/hour)`
    };
  }

  return { valid: true, message: 'Salary meets BCEA minimum wage requirement' };
};

const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return { valid: true, message: 'Date range validation skipped - missing dates' };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    return { valid: false, message: 'Start date is not a valid date' };
  }
  if (isNaN(end.getTime())) {
    return { valid: false, message: 'End date is not a valid date' };
  }

  if (end <= start) {
    return { valid: false, message: 'End date must be after start date' };
  }

  return { valid: true, message: 'Date range is valid' };
};

const validateSalaryRange = async (salary, gradeId) => {
  if (!salary || !gradeId) {
    return { valid: true, message: 'Salary range validation skipped - missing salary or grade' };
  }

  const parsedSalary = parseFloat(salary);
  if (isNaN(parsedSalary)) {
    return { valid: false, message: 'Salary must be a valid number' };
  }

  const result = await dbQuery(
    `SELECT MIN(annual_value) AS min_salary, MAX(annual_value) AS max_salary
     FROM task_grade_notches WHERE task_grade_id = $1`,
    [gradeId]
  );

  if (result.rows.length === 0 || result.rows[0].min_salary === null) {
    return { valid: true, message: 'No notch data found for grade - skipping range check' };
  }

  const { min_salary, max_salary } = result.rows[0];
  const minVal = parseFloat(min_salary);
  const maxVal = parseFloat(max_salary);

  if (parsedSalary < minVal || parsedSalary > maxVal) {
    return {
      valid: false,
      message: `Salary R${parsedSalary.toFixed(2)} is outside the grade range of R${minVal.toFixed(2)} - R${maxVal.toFixed(2)}`
    };
  }

  return { valid: true, message: 'Salary is within grade range' };
};

const validateEmployeeMiddleware = async (req, res, next) => {
  const errors = [];
  const body = req.body;
  const isUpdate = req.method === 'PUT';
  const excludeId = isUpdate ? parseInt(req.params.id, 10) : null;

  if (body.id_number) {
    const idResult = validateSAID(body.id_number);
    if (!idResult.valid) {
      errors.push({ field: 'id_number', message: idResult.message });
    }
  } else if (!isUpdate && !body.passport_number) {
    errors.push({ field: 'id_number', message: 'SA ID number or Passport number is required' });
  }

  if (body.income_tax_number) {
    const taxResult = validateTaxNumber(body.income_tax_number);
    if (!taxResult.valid) {
      errors.push({ field: 'income_tax_number', message: taxResult.message });
    }
  }

  if (body.bank_branch_code && body.bank_account_number) {
    const bankResult = validateBankAccount(body.bank_branch_code, body.bank_account_number);
    if (!bankResult.valid) {
      errors.push({ field: 'bank_account', message: bankResult.message });
    }
  }

  if (body.annual_salary) {
    const wageResult = validateBCEAMinWage(body.annual_salary);
    if (!wageResult.valid) {
      errors.push({ field: 'annual_salary', message: wageResult.message });
    }
  }

  if (body.annual_salary && body.task_grade_id) {
    const rangeResult = await validateSalaryRange(body.annual_salary, body.task_grade_id);
    if (!rangeResult.valid) {
      errors.push({ field: 'annual_salary', message: rangeResult.message });
    }
  }

  if (body.joining_date && body.end_date) {
    const dateResult = validateDateRange(body.joining_date, body.end_date);
    if (!dateResult.valid) {
      errors.push({ field: 'date_range', message: dateResult.message });
    }
  }

  try {
    const dupErrors = await checkDuplicateEmployee(body.employee_code, body.id_number, excludeId);
    errors.push(...dupErrors);
  } catch (err) {
    console.error('Duplicate check error:', err.message);
  }

  if (errors.length > 0) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Employee validation failed',
        details: errors,
      },
    });
  }

  next();
};

module.exports = {
  validate,
  paginationMiddleware,
  validateSAID,
  validateTaxNumber,
  validateBankAccount,
  checkDuplicateEmployee,
  validateBCEAMinWage,
  validateDateRange,
  validateSalaryRange,
  validateEmployeeMiddleware,
};
