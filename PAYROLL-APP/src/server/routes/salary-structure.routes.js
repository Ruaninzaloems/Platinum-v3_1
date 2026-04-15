const express = require('express');
const router = express.Router();
const { query: dbQuery, getClient } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLog');

router.get('/employees', authenticate, async (req, res, next) => {
  try {
    const { department_id, division_id, search } = req.query;
    let sql = `SELECT e.id, e.employee_code, e.first_name, e.surname,
               e.upper_limit_value_type,
               p.title AS position_title, p.position_code, p.department_id, p.division_id,
               jp.id AS job_profile_id, jp.job_title, jp.salary_transaction_group_id,
               jp.upper_limit_type,
               sul.id AS upper_limit_id,
               sul.minimum_value, sul.midpoint_value, sul.maximum_value,
               e.monthly_salary
               FROM employees e
               JOIN positions p ON e.position_id = p.id
               JOIN job_profiles jp ON p.job_profile_id = jp.id
               JOIN salary_upper_limits sul ON jp.upper_limit_id = sul.id
               WHERE e.enabled = TRUE AND jp.upper_limit_id IS NOT NULL`;
    const params = [];
    if (department_id) { params.push(department_id); sql += ` AND p.department_id = $${params.length}`; }
    if (division_id) { params.push(division_id); sql += ` AND e.division_id = $${params.length}`; }
    if (search) {
      const isNumeric = /^\d+$/.test(search.trim());
      if (isNumeric) {
        params.push(parseInt(search.trim(), 10));
        params.push(`%${search}%`);
        sql += ` AND (e.id = $${params.length - 1} OR e.employee_code ILIKE $${params.length} OR e.id_number ILIKE $${params.length} OR e.first_name ILIKE $${params.length} OR e.surname ILIKE $${params.length})`;
      } else {
        params.push(`%${search}%`);
        sql += ` AND (e.employee_code ILIKE $${params.length} OR e.id_number ILIKE $${params.length} OR e.first_name ILIKE $${params.length} OR e.surname ILIKE $${params.length} OR CONCAT(e.first_name, ' ', e.surname) ILIKE $${params.length})`;
      }
    }
    sql += ' ORDER BY e.employee_code';
    const empResult = await dbQuery(sql, params);

    const employees = [];
    for (const emp of empResult.rows) {
      const vt = (emp.upper_limit_value_type || emp.upper_limit_type || '').toUpperCase();
      let targetPackage = 0;
      if (vt === 'MINIMUM') targetPackage = Number(emp.minimum_value) || 0;
      else if (vt === 'MIDPOINT') targetPackage = Number(emp.midpoint_value) || 0;
      else if (vt === 'MAXIMUM') targetPackage = Number(emp.maximum_value) || 0;

      const pkgResult = await calculatePackageTotal(emp.id);

      employees.push({
        ...emp,
        target_package: targetPackage,
        current_package_total: pkgResult.packageTotal,
        variance: targetPackage - pkgResult.packageTotal,
        status: getPackageStatus(targetPackage, pkgResult.packageTotal)
      });
    }
    res.json({ success: true, data: employees });
  } catch (err) {
    next(err);
  }
});

router.get('/employees/:id', authenticate, async (req, res, next) => {
  try {
    const empResult = await dbQuery(
      `SELECT e.id, e.employee_code, e.first_name, e.surname, e.monthly_salary,
              e.upper_limit_value_type, e.position_id,
              p.title AS position_title, p.position_code,
              jp.id AS job_profile_id, jp.job_title, jp.salary_transaction_group_id,
              jp.upper_limit_type,
              sul.id AS upper_limit_id,
              sul.minimum_value, sul.midpoint_value, sul.maximum_value,
              stg.code AS group_code, stg.name AS group_name
              FROM employees e
              JOIN positions p ON e.position_id = p.id
              JOIN job_profiles jp ON p.job_profile_id = jp.id
              JOIN salary_upper_limits sul ON jp.upper_limit_id = sul.id
              LEFT JOIN salary_transaction_groups stg ON jp.salary_transaction_group_id = stg.id
              WHERE e.id = $1`,
      [req.params.id]
    );
    if (empResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Employee not found or not an Upper Limit employee' } });
    }
    const emp = empResult.rows[0];

    const vt = (emp.upper_limit_value_type || emp.upper_limit_type || '').toUpperCase();
    let targetPackage = 0;
    if (vt === 'MINIMUM') targetPackage = Number(emp.minimum_value) || 0;
    else if (vt === 'MIDPOINT') targetPackage = Number(emp.midpoint_value) || 0;
    else if (vt === 'MAXIMUM') targetPackage = Number(emp.maximum_value) || 0;

    const mergedTransactions = await getMergedTransactions(emp.id, emp.salary_transaction_group_id);

    const { includedEarnings, includedCompanyContributions, packageTotal } = await calculatePackageTotal(emp.id);

    res.json({
      success: true,
      data: {
        employee: emp,
        target_package: targetPackage,
        upper_limit: {
          id: emp.upper_limit_id,
          value_type: emp.upper_limit_value_type,
          minimum: emp.minimum_value,
          midpoint: emp.midpoint_value,
          maximum: emp.maximum_value
        },
        transactions: mergedTransactions,
        summary: {
          included_earnings: includedEarnings,
          included_company_contributions: includedCompanyContributions,
          current_package_total: packageTotal,
          target_package: targetPackage,
          variance: targetPackage - packageTotal,
          percentage_of_target: targetPackage > 0 ? Math.round((packageTotal / targetPackage) * 10000) / 100 : 0,
          status: getPackageStatus(targetPackage, packageTotal)
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/employees/:id/transactions', authenticate, auditLog('CREATE', 'salary_structure_transaction'), async (req, res, next) => {
  try {
    const { salary_head_id, amount, included_in_package } = req.body;
    if (!salary_head_id) return res.status(400).json({ success: false, error: { message: 'Salary head is required' } });

    const employeeId = parseInt(req.params.id, 10);
    const annualAmount = Number(amount) || 0;
    const inPkg = included_in_package !== false;
    const userId = req.user?.id || 1;

    const existing = await dbQuery(
      'SELECT id FROM employee_upper_limit_structure WHERE employee_id = $1 AND salary_head_id = $2',
      [employeeId, salary_head_id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, error: { message: 'Transaction already exists for this salary head' } });
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO employee_upper_limit_structure (employee_id, salary_head_id, amount, included_in_package, captured_by, captured_at)
         VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
        [employeeId, salary_head_id, annualAmount, inPkg, userId]
      );

      const estExisting = await client.query(
        'SELECT id FROM employee_salary_transactions WHERE employee_id = $1 AND salary_head_id = $2 AND enabled = TRUE',
        [employeeId, salary_head_id]
      );
      if (estExisting.rows.length === 0) {
        await client.query(
          `INSERT INTO employee_salary_transactions (employee_id, salary_head_id, start_date, end_date, created_by, updated_by)
           VALUES ($1, $2, '1900-01-01', '9999-12-31', $3, $3)`,
          [employeeId, salary_head_id, userId]
        );
      }

      await syncBasicIfNeeded(employeeId, salary_head_id, annualAmount, client);

      await client.query('COMMIT');
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

router.put('/employees/:id/transactions/:txnId', authenticate, auditLog('UPDATE', 'salary_structure_transaction'), async (req, res, next) => {
  try {
    const { amount } = req.body;
    const annualAmount = Number(amount) || 0;
    const structureId = parseInt(req.params.txnId, 10);
    const employeeId = parseInt(req.params.id, 10);
    const userId = req.user?.id || 1;

    const existing = await dbQuery(
      'SELECT id, salary_head_id FROM employee_upper_limit_structure WHERE id = $1 AND employee_id = $2',
      [structureId, employeeId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Structure row not found' } });
    }

    await dbQuery(
      'UPDATE employee_upper_limit_structure SET amount = $1, modified_by = $2, modified_at = NOW() WHERE id = $3',
      [annualAmount, userId, structureId]
    );

    await syncBasicIfNeeded(employeeId, existing.rows[0].salary_head_id, annualAmount);

    res.json({ success: true, data: { id: structureId, amount: annualAmount } });
  } catch (err) {
    next(err);
  }
});

router.put('/employees/:id/transactions/:txnId/toggle-package', authenticate, auditLog('UPDATE', 'salary_structure_transaction'), async (req, res, next) => {
  try {
    const structureId = parseInt(req.params.txnId, 10);
    const employeeId = parseInt(req.params.id, 10);
    const userId = req.user?.id || 1;

    const existing = await dbQuery(
      'SELECT id, included_in_package FROM employee_upper_limit_structure WHERE id = $1 AND employee_id = $2',
      [structureId, employeeId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Structure row not found' } });
    }

    const newValue = !existing.rows[0].included_in_package;
    await dbQuery(
      'UPDATE employee_upper_limit_structure SET included_in_package = $1, modified_by = $2, modified_at = NOW() WHERE id = $3',
      [newValue, userId, structureId]
    );

    res.json({ success: true, data: { id: structureId, included_in_package: newValue } });
  } catch (err) {
    next(err);
  }
});

router.delete('/employees/:id/transactions/:txnId', authenticate, auditLog('DELETE', 'salary_structure_transaction'), async (req, res, next) => {
  try {
    const structureId = parseInt(req.params.txnId, 10);
    const employeeId = parseInt(req.params.id, 10);

    const existing = await dbQuery(
      `SELECT uls.id, uls.salary_head_id, sh.code
       FROM employee_upper_limit_structure uls
       JOIN salary_heads sh ON sh.id = uls.salary_head_id
       WHERE uls.id = $1 AND uls.employee_id = $2`,
      [structureId, employeeId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Structure row not found' } });
    }

    await dbQuery(
      'DELETE FROM employee_upper_limit_structure WHERE id = $1 AND employee_id = $2',
      [structureId, employeeId]
    );

    if (BASIC_CODES.has(existing.rows[0].code)) {
      await dbQuery(
        'UPDATE employees SET monthly_salary = 0, annual_salary = 0 WHERE id = $1',
        [employeeId]
      );
    }

    res.json({ success: true, data: { id: structureId } });
  } catch (err) {
    next(err);
  }
});

async function getMergedTransactions(employeeId, groupId) {
  const structureRows = await dbQuery(
    `SELECT uls.id, uls.salary_head_id, uls.amount, uls.included_in_package,
            sh.code, sh.name, sh.transaction_type, sh.calculation_method,
            sh.irp5_code, sh.taxable, sh.is_system, sh.priority,
            'EMPLOYEE' AS source
     FROM employee_upper_limit_structure uls
     JOIN salary_heads sh ON uls.salary_head_id = sh.id
     WHERE uls.employee_id = $1
     ORDER BY sh.transaction_type, sh.priority, sh.code`,
    [employeeId]
  );

  const empHeadIds = new Set(structureRows.rows.map(r => r.salary_head_id));

  let inheritedTxns = [];
  if (groupId) {
    const groupResult = await dbQuery(
      `SELECT gi.id AS group_item_id, gi.salary_head_id, gi.sort_order,
              sh.code, sh.name, sh.transaction_type, sh.calculation_method,
              sh.irp5_code, sh.taxable, sh.is_system, sh.priority,
              'INHERITED' AS source
       FROM salary_transaction_group_items gi
       JOIN salary_heads sh ON sh.id = gi.salary_head_id
       WHERE gi.group_id = $1 AND sh.enabled = TRUE
       ORDER BY sh.transaction_type, sh.priority, sh.code`,
      [groupId]
    );
    inheritedTxns = groupResult.rows.filter(r => !empHeadIds.has(r.salary_head_id));
  }

  const merged = [...structureRows.rows, ...inheritedTxns];
  merged.sort((a, b) => {
    const typeOrder = { EARNING: 1, FRINGE_BENEFIT: 2, DEDUCTION: 3, COMPANY_CONTRIBUTION: 4 };
    const ta = typeOrder[a.transaction_type] || 5;
    const tb = typeOrder[b.transaction_type] || 5;
    if (ta !== tb) return ta - tb;
    return (a.priority || 0) - (b.priority || 0);
  });
  return merged;
}

async function calculatePackageTotal(employeeId) {
  let includedEarnings = 0;
  let includedCompanyContributions = 0;

  const structResult = await dbQuery(
    `SELECT uls.amount, sh.transaction_type
     FROM employee_upper_limit_structure uls
     JOIN salary_heads sh ON uls.salary_head_id = sh.id
     WHERE uls.employee_id = $1 AND uls.included_in_package = TRUE`,
    [employeeId]
  );
  for (const row of structResult.rows) {
    const amt = Number(row.amount) || 0;
    if (row.transaction_type === 'EARNING' || row.transaction_type === 'FRINGE_BENEFIT') includedEarnings += amt;
    else if (row.transaction_type === 'COMPANY_CONTRIBUTION') includedCompanyContributions += amt;
  }
  const packageTotal = includedEarnings + includedCompanyContributions;
  return { includedEarnings, includedCompanyContributions, packageTotal };
}

function getPackageStatus(target, current) {
  if (target === 0) return 'NO_TARGET';
  const variance = target - current;
  if (Math.abs(variance) <= 5.00) return 'BALANCED';
  if (current > target) return 'OVER';
  return 'UNDER';
}

const BASIC_CODES = new Set(['BASIC', 'BASIC_SALARY']);

async function syncBasicIfNeeded(employeeId, salaryHeadId, annualAmount, txClient) {
  const q = txClient || { query: (sql, params) => dbQuery(sql, params) };
  const headResult = await q.query('SELECT code FROM salary_heads WHERE id = $1', [salaryHeadId]);
  if (headResult.rows.length === 0) return;
  const code = headResult.rows[0].code;
  if (!BASIC_CODES.has(code)) return;

  const monthly = parseFloat((annualAmount / 12).toFixed(2));
  await q.query(
    'UPDATE employees SET monthly_salary = $1, annual_salary = $2 WHERE id = $3',
    [monthly, annualAmount, employeeId]
  );
}

module.exports = router;
