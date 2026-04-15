const { query: dbQuery } = require('../config/database');

async function trackEmployeeChanges(employeeId, oldData, newData, userId = 1) {
  const tracked = [
    'first_name', 'surname', 'title', 'initials', 'id_number', 'date_of_birth',
    'gender', 'marital_status', 'email_address', 'cell_number', 'annual_salary',
    'position_id', 'task_grade_id', 'current_notch', 'status', 'department_id',
    'bank_name', 'bank_branch_code', 'bank_account_number', 'bank_account_type',
    'nationality', 'language', 'disability_status', 'employee_type_id'
  ];

  for (const field of tracked) {
    const oldVal = oldData[field] !== undefined ? String(oldData[field] || '') : '';
    const newVal = newData[field] !== undefined ? String(newData[field] || '') : oldVal;
    if (newVal !== oldVal && newData[field] !== undefined) {
      await dbQuery(
        `INSERT INTO employee_history (employee_id, field_name, old_value, new_value, changed_by, change_type)
         VALUES ($1, $2, $3, $4, $5, 'UPDATE')`,
        [employeeId, field, oldVal || null, newVal || null, userId]
      );
    }
  }
}

module.exports = { trackEmployeeChanges };
