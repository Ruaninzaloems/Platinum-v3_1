const { query: dbQuery } = require('../config/database');

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/**
 * Checks whether any payroll period is currently in Trial Lockdown (status = 'LOCKED').
 * While locked, no master data or configuration changes are permitted because any
 * change would silently invalidate the calculations the payroll team is reviewing.
 *
 * @param {number|null} cycleId - restrict the check to one cycle, or null to check all cycles
 * @returns {object|null} error payload to return as HTTP 423, or null if safe to proceed
 */
async function checkPayrollLockdown(cycleId = null) {
  try {
    const sql = cycleId
      ? `SELECT pp.id, pp.period_number, pp.start_date, pp.end_date, pc.name AS cycle_name
         FROM payroll_periods pp
         JOIN payroll_cycles pc ON pp.cycle_id = pc.id
         WHERE pp.status = 'LOCKED' AND pp.cycle_id = $1
         LIMIT 1`
      : `SELECT pp.id, pp.period_number, pp.start_date, pp.end_date, pc.name AS cycle_name
         FROM payroll_periods pp
         JOIN payroll_cycles pc ON pp.cycle_id = pc.id
         WHERE pp.status = 'LOCKED'
         LIMIT 1`;
    const result = await dbQuery(sql, cycleId ? [parseInt(cycleId)] : []);
    if (result.rows.length === 0) return null;

    const p = result.rows[0];
    const d = new Date(p.start_date);
    const label = `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} (Period ${p.period_number})`;
    return {
      status: 423,
      body: {
        success: false,
        error: {
          code: 'PAYROLL_LOCKED',
          message: `The ${p.cycle_name} payroll is currently in Trial Lockdown for ${label}. Unlock the Trial Run before making any master data or configuration changes.`
        }
      }
    };
  } catch (e) {
    console.warn('checkPayrollLockdown query failed:', e.message);
    return null;
  }
}

module.exports = { checkPayrollLockdown };
