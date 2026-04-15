const { query: dbQuery } = require('../config/database');

const BASIC_CODES = new Set(['BASIC', 'BASIC_SALARY']);
function isBasicCode(code) { return BASIC_CODES.has(code); }

function resolveMonthlyBasic(emp, periodsPerYear) {
  const monthlySalary = parseFloat(emp.monthly_salary) || 0;
  const annualSalary = parseFloat(emp.annual_salary) || 0;

  const effectiveTaskGradeId = emp.task_grade_id || emp.jp_task_grade_id;
  if (effectiveTaskGradeId) {
    if (monthlySalary <= 0) {
      throw new Error(`Basic salary for Task Grade employee ${emp.employee_code || emp.id} is R0.00. Please set the monthly salary on the Employee Master File.`);
    }
    return monthlySalary;
  }

  if (emp.salary_based_on === 'RATE_PER_HOUR' || emp.salary_based_on === 'RATE_PER_DAY') {
    return 0;
  }
  if (emp.salary_based_on === 'CAPTURED_VALUE') {
    return 0;
  }
  if (emp.salary_based_on === 'FIXED_RATE') {
    return parseFloat(emp.wage_rate) || 0;
  }

  if (monthlySalary <= 0 && annualSalary <= 0) {
    throw new Error(`Basic salary for employee ${emp.employee_code || emp.id} is R0.00. Please set the monthly salary on the Employee Master File.`);
  }
  return monthlySalary > 0 ? monthlySalary : parseFloat((annualSalary / periodsPerYear).toFixed(2));
}

function resolveTaxYear(periodEndDate) {
  const d = new Date(periodEndDate);
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return month >= 3 ? year + 1 : year;
}

async function resolveEmployeeSalaryStructure(employeeId, periodEndDate) {
  const empResult = await dbQuery(
    `SELECT e.id, e.employee_code, e.annual_salary, e.monthly_salary, e.position_id, e.task_grade_id, e.current_notch,
            e.upper_limit_value_type, e.date_of_birth, e.dependants, e.exclude_uif, e.exclude_sdl,
            e.joining_date AS date_engaged, e.end_date AS termination_date, e.employee_type_id, e.employee_subtype_id, e.condition_of_service_id,
            e.working_hours_per_month, e.working_days_per_month, e.salary_based_on, e.wage_rate,
            p.job_profile_id, p.salary_transaction_group_id AS pos_stg_id, p.upper_limit_value_type AS pos_upper_limit_value_type,
            jp.salary_transaction_group_id AS jp_stg_id, jp.upper_limit_id AS jp_upper_limit_id, jp.task_grade_id AS jp_task_grade_id
     FROM employees e
     LEFT JOIN positions p ON e.position_id = p.id
     LEFT JOIN job_profiles jp ON p.job_profile_id = jp.id
     WHERE e.id = $1`,
    [employeeId]
  );
  if (empResult.rows.length === 0) return null;
  const emp = empResult.rows[0];

  const salaryTransGroupId = emp.pos_stg_id || emp.jp_stg_id || null;
  const upperLimitId = emp.jp_upper_limit_id || null;
  const upperLimitValueType = emp.upper_limit_value_type || emp.pos_upper_limit_value_type || 'MIDPOINT';

  let resolvedSalary = null;
  let salarySource = 'FIXED';
  let groupItems = [];

  if (salaryTransGroupId) {
    const itemsResult = await dbQuery(
      `SELECT stgi.id, stgi.group_id, stgi.salary_head_id, stgi.sort_order, stgi.included_in_package,
              sh.code, sh.name, sh.transaction_type, sh.irp5_code, sh.taxable,
              sh.calculation_method, sh.employee_contribution AS percentage, sh.priority,
              sh.scoa_debit_item, sh.scoa_credit_item, sh.affects_uif, sh.affects_sdl
       FROM salary_transaction_group_items stgi
       JOIN salary_heads sh ON stgi.salary_head_id = sh.id
       WHERE stgi.group_id = $1
       ORDER BY stgi.sort_order, sh.priority`,
      [salaryTransGroupId]
    );
    groupItems = itemsResult.rows;
  }

  let upperLimitStructureRows = [];
  let upperLimitTargetPackage = 0;

  if (upperLimitId) {
    const ulResult = await dbQuery(
      `SELECT * FROM salary_upper_limits WHERE id = $1 AND enabled = TRUE AND start_date <= $2 AND end_date >= $2`,
      [upperLimitId, periodEndDate]
    );
    if (ulResult.rows.length > 0) {
      const ul = ulResult.rows[0];
      const valType = upperLimitValueType.toUpperCase();
      if (valType === 'MINIMUM') resolvedSalary = parseFloat(ul.minimum_value);
      else if (valType === 'MAXIMUM') resolvedSalary = parseFloat(ul.maximum_value);
      else resolvedSalary = parseFloat(ul.midpoint_value);
      upperLimitTargetPackage = resolvedSalary || 0;
      salarySource = 'UPPER_LIMIT';

      const structResult = await dbQuery(
        `SELECT uls.salary_head_id, uls.amount, uls.included_in_package,
                sh.code, sh.name, sh.transaction_type, sh.calculation_method,
                sh.irp5_code, sh.taxable, sh.affects_uif, sh.affects_sdl, sh.priority,
                sh.scoa_debit_item, sh.scoa_credit_item
         FROM employee_upper_limit_structure uls
         JOIN salary_heads sh ON uls.salary_head_id = sh.id
         WHERE uls.employee_id = $1
         ORDER BY sh.priority`,
        [employeeId]
      );
      upperLimitStructureRows = structResult.rows;
    }
  }

  const effectiveTaskGradeId = emp.task_grade_id || emp.jp_task_grade_id || null;
  if (resolvedSalary === null && effectiveTaskGradeId && emp.current_notch) {
    const monthlySal = parseFloat(emp.monthly_salary) || 0;
    if (monthlySal <= 0) {
      throw new Error(`Task Grade employee ${emp.employee_code || employeeId} has no monthly salary set. Please set the monthly salary on the Employee Master File.`);
    }
    resolvedSalary = parseFloat((monthlySal * 12).toFixed(2));
    salarySource = 'TASK_GRADE';
  }

  if (resolvedSalary === null) {
    resolvedSalary = parseFloat(emp.annual_salary) || 0;
    salarySource = 'FIXED';
  }

  return {
    employee: emp,
    annualSalary: resolvedSalary,
    salarySource,
    salaryTransGroupId,
    groupItems,
    upperLimitValueType,
    upperLimitStructureRows,
    upperLimitTargetPackage,
  };
}

async function getEmployeeMedicalAidInfo(employeeId, periodStartDate, periodEndDate) {
  const maResult = await dbQuery(
    `SELECT ema.id, ema.scheme_id, mas.code AS scheme_code, mas.name AS scheme_name,
            mas.main_member_contribution, mas.adult_dependant_contribution, mas.child_dependant_contribution,
            mas.employer_contribution AS employee_percent,
            mas.employer_contribution_percentage AS employer_percent,
            mas.max_employer_contribution, mas.max_dependants,
            mas.max_child_dependants_only, mas.vendor_id
     FROM employee_medical_aid ema
     JOIN medical_aid_schemes mas ON ema.scheme_id = mas.id
     WHERE ema.employee_id = $1 AND ema.is_current = TRUE
       AND ema.join_date <= $2
       AND (ema.termination_date IS NULL OR ema.termination_date >= $3)
     LIMIT 1`,
    [employeeId, periodEndDate || new Date(), periodStartDate || new Date()]
  );
  if (maResult.rows.length === 0) return { hasMedicalAid: false, dependantCount: 0, scheme: null, dependants: { adults: 0, children: 0, employerAdults: 0, employerChildren: 0 } };

  const ma = maResult.rows[0];
  const depResult = await dbQuery(
    `SELECT dependant_type, employer_contributes
     FROM employee_medical_aid_dependants
     WHERE employee_medical_aid_id = $1
       AND (end_date IS NULL OR end_date >= $2)
       AND start_date <= $3`,
    [ma.id, periodStartDate || new Date(), periodEndDate || new Date()]
  );

  let adults = 0, children = 0, employerAdults = 0, employerChildren = 0;
  for (const dep of depResult.rows) {
    const depType = (dep.dependant_type || '').toUpperCase();
    const isAdult = depType === 'ADULT' || depType === 'SPOUSE';
    if (isAdult) {
      adults++;
      if (dep.employer_contributes) employerAdults++;
    } else {
      children++;
      if (dep.employer_contributes) employerChildren++;
    }
  }
  const dependantCount = adults + children;

  return {
    hasMedicalAid: true,
    dependantCount,
    scheme: ma,
    dependants: { adults, children, employerAdults, employerChildren },
  };
}

async function getEmployeeUnionInfo(employeeId, periodStartDate, periodEndDate) {
  const result = await dbQuery(
    `SELECT eu.id, eu.trade_union_id, eu.join_date, eu.termination_date,
            tu.representative AS union_name, tu.contribution_type, tu.contribution_value, tu.maximum_value
     FROM employee_unions eu
     JOIN trade_unions tu ON eu.trade_union_id = tu.id
     WHERE eu.employee_id = $1 AND eu.enabled = TRUE
       AND tu.enabled = TRUE
       AND eu.join_date <= $2
       AND (eu.termination_date IS NULL OR eu.termination_date >= $3)`,
    [employeeId, periodEndDate || new Date(), periodStartDate || new Date()]
  );
  return result.rows;
}

async function getEmployeeRetirementFundInfo(employeeId) {
  const rfResult = await dbQuery(
    `SELECT erf.id, erf.fund_type_id, erf.employee_amount, erf.employer_amount,
            rft.code AS fund_code, rft.name AS fund_name, rft.fund_type,
            rft.employee_contribution_rate, rft.employer_contribution_rate,
            rft.employer_contribution_type, rft.employer_contribution_value,
            rft.employee_contribution_value, rft.employer_max_value, rft.employee_max_value
     FROM employee_retirement_funds erf
     JOIN retirement_fund_types rft ON erf.fund_type_id = rft.id
     WHERE erf.employee_id = $1 AND erf.is_current = TRUE AND (erf.status IS NULL OR erf.status = 'ACTIVE')`,
    [employeeId]
  );
  return rfResult.rows;
}

async function calculatePayslipForEmployee(employeeId, periodId, cycleId) {
  const periodResult = await dbQuery(
    `SELECT pp.*, pc.name AS cycle_name, pc.cycle_type, pc.periods_per_year
     FROM payroll_periods pp
     JOIN payroll_cycles pc ON pp.cycle_id = pc.id
     WHERE pp.id = $1`,
    [periodId]
  );
  if (periodResult.rows.length === 0) throw new Error('Period not found');
  const period = periodResult.rows[0];
  if (cycleId && period.cycle_id !== cycleId) {
    throw new Error('Period does not belong to the specified cycle');
  }
  const cycle = { periods_per_year: period.periods_per_year || 12 };
  const periodsPerYear = cycle.periods_per_year;

  const salaryStructure = await resolveEmployeeSalaryStructure(employeeId, period.end_date);
  if (!salaryStructure) throw new Error('Employee not found');

  const taxYear = resolveTaxYear(period.end_date);
  let taxTables = await loadTaxTables(taxYear);
  if (taxTables.brackets.length === 0) {
    taxTables = await loadTaxTables(taxYear - 1);
  }

  const medInfo = await getEmployeeMedicalAidInfo(employeeId, period.start_date, period.end_date);
  const retFunds = await getEmployeeRetirementFundInfo(employeeId);
  const unionMemberships = await getEmployeeUnionInfo(employeeId, period.start_date, period.end_date);

  const empTransResult = await dbQuery(
    `SELECT est.id AS est_id, est.employee_id, est.salary_head_id,
            est.start_date, est.end_date,
            sh.code AS head_code, sh.name AS head_name, sh.transaction_type, sh.irp5_code,
            sh.taxable, sh.affects_uif, sh.affects_sdl, sh.calculation_method, sh.priority,
            sh.scoa_debit_item, sh.scoa_credit_item
     FROM employee_salary_transactions est
     JOIN salary_heads sh ON est.salary_head_id = sh.id
     WHERE est.employee_id = $1 AND est.enabled = TRUE
     AND est.start_date <= $2 AND est.end_date >= $2
     ORDER BY sh.priority, est.id`,
    [employeeId, period.end_date]
  );
  const seenHeads = new Set();
  empTransResult.rows = empTransResult.rows.filter(tx => {
    if (seenHeads.has(tx.salary_head_id)) return false;
    seenHeads.add(tx.salary_head_id);
    return true;
  });

  const payslipTxResult = await dbQuery(
    `SELECT ept.id AS ept_id, ept.employee_salary_transaction_id, ept.employee_id,
            ept.salary_head_id, ept.captured_amount, ept.period_id, ept.every_month,
            ept.reference_no,
            sh.code AS head_code, sh.name AS head_name, sh.transaction_type, sh.irp5_code,
            sh.taxable, sh.affects_uif, sh.affects_sdl, sh.calculation_method, sh.priority,
            sh.scoa_debit_item, sh.scoa_credit_item
     FROM employee_payslip_transactions ept
     JOIN salary_heads sh ON ept.salary_head_id = sh.id
     WHERE ept.employee_id = $1 AND ept.enabled = TRUE
     AND (ept.every_month = TRUE OR ept.period_id = $2)
     ORDER BY sh.priority`,
    [employeeId, periodId]
  );

  const wageTransResult = await dbQuery(
    `SELECT wt.salary_head_id, wt.hours, wt.days, wt.rate, wt.amount,
            sh.code AS head_code, sh.name AS head_name, sh.transaction_type, sh.irp5_code,
            sh.taxable, sh.affects_uif, sh.affects_sdl, sh.priority,
            sh.scoa_debit_item, sh.scoa_credit_item
     FROM wage_transactions wt
     JOIN salary_heads sh ON wt.salary_head_id = sh.id
     WHERE wt.employee_id = $1 AND wt.period_id = $2 AND wt.status = 'APPROVED'
     ORDER BY sh.priority`,
    [employeeId, period.id]
  );

  const { annualSalary, salarySource, groupItems, upperLimitStructureRows, upperLimitTargetPackage } = salaryStructure;
  const emp = salaryStructure.employee;

  const isUpperLimit = salarySource === 'UPPER_LIMIT';

  if (isUpperLimit) {
    let includedSum = 0;
    for (const sr of upperLimitStructureRows) {
      if (sr.included_in_package) includedSum += parseFloat(sr.amount) || 0;
    }
    const balanceVariance = Math.abs(upperLimitTargetPackage - includedSum);
    if (balanceVariance > 5.00) {
      throw new Error(
        `Upper Limit salary structure for employee ${emp.employee_code || employeeId} is not balanced. ` +
        `Target package: R${upperLimitTargetPackage.toFixed(2)}, structure total: R${includedSum.toFixed(2)}, ` +
        `variance: R${balanceVariance.toFixed(2)} (exceeds R5.00 tolerance). ` +
        `Please balance the salary structure before running payroll.`
      );
    }
  }

  const ulAmountsByHeadId = {};
  if (isUpperLimit) {
    for (const sr of upperLimitStructureRows) {
      ulAmountsByHeadId[sr.salary_head_id] = {
        annualAmount: parseFloat(sr.amount) || 0,
        monthlyAmount: parseFloat(((parseFloat(sr.amount) || 0) / 12).toFixed(2)),
        code: sr.code,
        name: sr.name,
        transaction_type: sr.transaction_type,
        calculation_method: sr.calculation_method,
        irp5_code: sr.irp5_code,
        taxable: sr.taxable,
        affects_uif: sr.affects_uif,
        affects_sdl: sr.affects_sdl,
        priority: sr.priority,
        scoa_debit_item: sr.scoa_debit_item,
        scoa_credit_item: sr.scoa_credit_item,
      };
    }
  }

  const payslipTxByHead = {};
  for (const pt of payslipTxResult.rows) {
    if (!payslipTxByHead[pt.salary_head_id]) payslipTxByHead[pt.salary_head_id] = [];
    payslipTxByHead[pt.salary_head_id].push(pt);
  }

  const transactions = [];
  for (const est of empTransResult.rows) {
    if (isUpperLimit) {
      if (ulAmountsByHeadId[est.salary_head_id]) {
        const ulRow = ulAmountsByHeadId[est.salary_head_id];
        if (ulRow.calculation_method !== 'SYSTEM_CALCULATE' && ulRow.calculation_method !== 'FORMULA') {
          transactions.push({
            est_id: est.est_id, employee_id: employeeId, salary_head_id: est.salary_head_id,
            amount: ulRow.monthlyAmount,
            start_date: est.start_date, end_date: est.end_date,
            head_code: ulRow.code, head_name: ulRow.name, transaction_type: ulRow.transaction_type,
            irp5_code: ulRow.irp5_code, taxable: ulRow.taxable, affects_uif: ulRow.affects_uif,
            affects_sdl: ulRow.affects_sdl, calculation_method: null, priority: ulRow.priority,
            scoa_debit_item: ulRow.scoa_debit_item, scoa_credit_item: ulRow.scoa_credit_item,
            is_upper_limit_structure: true
          });
          continue;
        }
      }
      const isFormula = est.calculation_method === 'SYSTEM_CALCULATE' || est.calculation_method === 'FORMULA';
      if (isFormula) {
        transactions.push({
          est_id: est.est_id, employee_id: employeeId, salary_head_id: est.salary_head_id,
          amount: 0,
          start_date: est.start_date, end_date: est.end_date,
          head_code: est.head_code, head_name: est.head_name, transaction_type: est.transaction_type,
          irp5_code: est.irp5_code, taxable: est.taxable, affects_uif: est.affects_uif,
          affects_sdl: est.affects_sdl, calculation_method: est.calculation_method, priority: est.priority,
          scoa_debit_item: est.scoa_debit_item, scoa_credit_item: est.scoa_credit_item
        });
      } else {
        transactions.push({
          est_id: est.est_id, employee_id: employeeId, salary_head_id: est.salary_head_id,
          amount: 0,
          start_date: est.start_date, end_date: est.end_date,
          head_code: est.head_code, head_name: est.head_name, transaction_type: est.transaction_type,
          irp5_code: est.irp5_code, taxable: est.taxable, affects_uif: est.affects_uif,
          affects_sdl: est.affects_sdl, calculation_method: null, priority: est.priority,
          scoa_debit_item: est.scoa_debit_item, scoa_credit_item: est.scoa_credit_item
        });
      }
      continue;
    }

    const headPts = payslipTxByHead[est.salary_head_id] || [];
    if (headPts.length > 0) {
      for (const pt of headPts) {
        transactions.push({
          est_id: est.est_id, ept_id: pt.ept_id, employee_id: employeeId, salary_head_id: est.salary_head_id,
          amount: parseFloat(pt.captured_amount) || 0,
          reference_no: pt.reference_no || '',
          start_date: est.start_date, end_date: est.end_date,
          head_code: est.head_code, head_name: est.head_name, transaction_type: est.transaction_type,
          irp5_code: est.irp5_code, taxable: est.taxable, affects_uif: est.affects_uif,
          affects_sdl: est.affects_sdl, calculation_method: est.calculation_method, priority: est.priority,
          scoa_debit_item: est.scoa_debit_item, scoa_credit_item: est.scoa_credit_item,
          is_payslip_transaction: true
        });
      }
    } else {
      transactions.push({
        est_id: est.est_id, employee_id: employeeId, salary_head_id: est.salary_head_id,
        amount: 0,
        start_date: est.start_date, end_date: est.end_date,
        head_code: est.head_code, head_name: est.head_name, transaction_type: est.transaction_type,
        irp5_code: est.irp5_code, taxable: est.taxable, affects_uif: est.affects_uif,
        affects_sdl: est.affects_sdl, calculation_method: est.calculation_method, priority: est.priority,
        scoa_debit_item: est.scoa_debit_item, scoa_credit_item: est.scoa_credit_item
      });
    }
  }

  if (isUpperLimit) {
    const estHeadIds = new Set(empTransResult.rows.map(r => r.salary_head_id));
    for (const sr of upperLimitStructureRows) {
      if (!estHeadIds.has(sr.salary_head_id) && sr.calculation_method !== 'SYSTEM_CALCULATE' && sr.calculation_method !== 'FORMULA') {
        const ulRow = ulAmountsByHeadId[sr.salary_head_id];
        transactions.push({
          est_id: null, employee_id: employeeId, salary_head_id: sr.salary_head_id,
          amount: ulRow.monthlyAmount,
          head_code: ulRow.code, head_name: ulRow.name, transaction_type: ulRow.transaction_type,
          irp5_code: ulRow.irp5_code, taxable: ulRow.taxable, affects_uif: ulRow.affects_uif,
          affects_sdl: ulRow.affects_sdl, calculation_method: null, priority: ulRow.priority,
          scoa_debit_item: ulRow.scoa_debit_item, scoa_credit_item: ulRow.scoa_credit_item,
          is_upper_limit_structure: true
        });
      }
    }
  }

  for (const wt of wageTransResult.rows) {
    transactions.push({
      est_id: null, employee_id: employeeId, salary_head_id: wt.salary_head_id,
      amount: parseFloat(wt.amount) || 0,
      start_date: period.start_date, end_date: period.end_date,
      head_code: wt.head_code, head_name: wt.head_name, transaction_type: wt.transaction_type,
      irp5_code: wt.irp5_code, taxable: wt.taxable, affects_uif: wt.affects_uif,
      affects_sdl: wt.affects_sdl, calculation_method: 'FIXED', priority: wt.priority,
      scoa_debit_item: wt.scoa_debit_item, scoa_credit_item: wt.scoa_credit_item,
      is_wage_transaction: true
    });
  }

  const systemCalcCodes = new Set(['MED_EE', 'MED_ER', 'MED_FRINGE', 'PEN_EE', 'PEN_ER', 'PEN_FRINGE',
    'MED_AID_EE', 'MED_AID_ER', 'PENSION_EE', 'PENSION_ER', 'PENSION_FRINGE',
    'UIF_EE', 'UIF_ER', 'SDL', 'PAYE', 'UNION_FEES',
    'PAYASYOUEARN_PAYE', 'UNEMPLOYMENT_INSURANCE_FUND_UIF_EMPLOYEE', 'UNEMPLOYMENT_INSURANCE_FUND_UIF_EMPLOYER',
    'SKILLS_DEVELOPMENT_LEVY_SDL']);

  let monthlyBasic, basicAnnual;

  if (isUpperLimit) {
    const basicStructRow = upperLimitStructureRows.find(sr => BASIC_CODES.has(sr.code));
    if (!basicStructRow) {
      throw new Error(`Upper Limit employee ${emp.employee_code || employeeId} has no BASIC salary in the salary structure table. Please add a BASIC salary component before running payroll.`);
    }
    const basicAnnualFromStruct = parseFloat(basicStructRow.amount) || 0;
    if (basicAnnualFromStruct <= 0) {
      throw new Error(`Upper Limit employee ${emp.employee_code || employeeId} has R0.00 BASIC in salary structure. Please set the BASIC amount in the salary structure.`);
    }
    monthlyBasic = parseFloat((basicAnnualFromStruct / 12).toFixed(2));
    basicAnnual = basicAnnualFromStruct;
  } else {
    monthlyBasic = resolveMonthlyBasic(emp, periodsPerYear);
    basicAnnual = monthlyBasic * periodsPerYear;
  }

  const isRateBasedZeroBasic = !isUpperLimit && !(emp.task_grade_id || emp.jp_task_grade_id) && (emp.salary_based_on === 'RATE_PER_HOUR' || emp.salary_based_on === 'RATE_PER_DAY' || emp.salary_based_on === 'CAPTURED_VALUE');
  const basicTx = transactions.find(t => isBasicCode(t.head_code));
  if (basicTx) {
    if (!isRateBasedZeroBasic) {
      basicTx.amount = monthlyBasic;
      basicTx.calculation_method = null;
    }
  } else {
    transactions.unshift({
      est_id: null, employee_id: employeeId, salary_head_id: null,
      amount: monthlyBasic,
      head_code: 'BASIC', head_name: 'Basic Salary', transaction_type: 'EARNING',
      irp5_code: '3601', taxable: true, calculation_method: null, priority: 0,
      scoa_debit_item: null, scoa_credit_item: null, formula: null, is_system_generated: true,
    });
  }

  let medEeAmount = 0, medErAmount = 0, medFringeAmount = 0;
  if (medInfo.hasMedicalAid && medInfo.scheme) {
    const s = medInfo.scheme;
    const memberVal = parseFloat(s.main_member_contribution) || 0;
    const adultVal = parseFloat(s.adult_dependant_contribution) || 0;
    const childVal = parseFloat(s.child_dependant_contribution) || 0;
    const eePct = parseFloat(s.employee_percent) || 0;
    const erPct = parseFloat(s.employer_percent) || 0;
    const maxErVal = parseFloat(s.max_employer_contribution) || 0;
    const maxDeps = parseInt(s.max_dependants) || 999;
    const maxChildOnly = s.max_child_dependants_only === true;

    let { adults, children } = medInfo.dependants;

    if (maxChildOnly) {
      if (children > maxDeps) children = maxDeps;
    } else {
      const totalDeps = adults + children;
      if (totalDeps > maxDeps) {
        const cappedAdults = Math.min(adults, maxDeps);
        const remainingSlots = Math.max(0, maxDeps - cappedAdults);
        adults = cappedAdults;
        children = Math.min(children, remainingSlots);
      }
    }

    const totalMedCost = parseFloat((
      memberVal + (adultVal * adults) + (childVal * children)
    ).toFixed(2));

    medErAmount = parseFloat((totalMedCost * (erPct / 100)).toFixed(2));
    medEeAmount = parseFloat((totalMedCost * (eePct / 100)).toFixed(2));

    if (maxErVal > 0 && medErAmount > maxErVal) {
      medEeAmount = parseFloat((medEeAmount + (medErAmount - maxErVal)).toFixed(2));
      medErAmount = maxErVal;
    }

    medFringeAmount = medErAmount;
  }

  let retEeAmount = 0, retErAmount = 0, retFringeAmount = 0;
  for (const rf of retFunds) {
    let ee = 0, er = 0;
    const eeOverride = parseFloat(rf.employee_amount) || 0;
    const erOverride = parseFloat(rf.employer_amount) || 0;
    const contribType = (rf.employer_contribution_type || '').toUpperCase();

    if (eeOverride > 0) {
      ee = eeOverride;
    } else if (contribType === 'PERCENTAGE') {
      const eeVal = parseFloat(rf.employee_contribution_value) || parseFloat(rf.employee_contribution_rate) || 0;
      ee = parseFloat((monthlyBasic * eeVal / 100).toFixed(2));
    } else {
      ee = parseFloat(rf.employee_contribution_value) || 0;
      if (ee === 0 && parseFloat(rf.employee_contribution_rate) > 0) {
        ee = parseFloat((monthlyBasic * parseFloat(rf.employee_contribution_rate) / 100).toFixed(2));
      }
    }

    if (erOverride > 0) {
      er = erOverride;
    } else if (contribType === 'PERCENTAGE') {
      const erVal = parseFloat(rf.employer_contribution_value) || parseFloat(rf.employer_contribution_rate) || 0;
      er = parseFloat((monthlyBasic * erVal / 100).toFixed(2));
    } else {
      er = parseFloat(rf.employer_contribution_value) || 0;
      if (er === 0 && parseFloat(rf.employer_contribution_rate) > 0) {
        er = parseFloat((monthlyBasic * parseFloat(rf.employer_contribution_rate) / 100).toFixed(2));
      }
    }

    const erMax = parseFloat(rf.employer_max_value) || 0;
    if (erMax > 0 && er > erMax) er = erMax;
    const eeMax = parseFloat(rf.employee_max_value) || 0;
    if (eeMax > 0 && ee > eeMax) ee = eeMax;
    retEeAmount += ee;
    retErAmount += er;
    retFringeAmount += er;
  }

  let prevBasicSalary = null;
  try {
    const prevResult = await dbQuery(
      `SELECT pr.amount FROM payroll_results pr
       JOIN payroll_runs prr ON pr.run_id = prr.id
       JOIN payroll_periods pp ON prr.period_id = pp.id
       JOIN salary_heads sh ON pr.salary_head_id = sh.id
       WHERE pr.employee_id = $1 AND sh.code IN ('BASIC','BASIC_SALARY') AND pp.end_date < $2
       ORDER BY pp.end_date DESC LIMIT 1`,
      [employeeId, period.start_date]
    );
    if (prevResult.rows.length > 0) {
      prevBasicSalary = parseFloat(prevResult.rows[0].amount) || null;
    }
  } catch (e) { /* optional */ }

  const employeeData = {
    id: emp.id,
    employee_code: emp.employee_code,
    date_of_birth: emp.date_of_birth,
    date_engaged: emp.date_engaged,
    termination_date: emp.termination_date || null,
    dependants: medInfo.hasMedicalAid ? medInfo.dependantCount : (emp.dependants || 0),
    annual_salary: basicAnnual,
    monthly_salary: emp.monthly_salary,
    salary_based_on: emp.salary_based_on,
    wage_rate: emp.wage_rate,
    task_grade_id: emp.task_grade_id,
    exclude_uif: emp.exclude_uif,
    exclude_sdl: emp.exclude_sdl,
    employee_type_id: emp.employee_type_id || null,
    employee_subtype_id: emp.employee_subtype_id || null,
    condition_of_service_id: emp.condition_of_service_id || null,
    hours_worked: emp.working_hours_per_month || null,
    days_worked: emp.working_days_per_month || null,
    working_hours_per_month: emp.working_hours_per_month,
    working_days_per_month: emp.working_days_per_month,
    working_hours_per_day: emp.working_hours_per_day,
    prev_basic_salary: prevBasicSalary,
    prev_annual_salary: prevBasicSalary ? prevBasicSalary * periodsPerYear : null,
  };

  const filteredTransactions = transactions.filter(tx => !systemCalcCodes.has(tx.head_code) || isBasicCode(tx.head_code));

  if (medInfo.hasMedicalAid && medEeAmount > 0) {
    filteredTransactions.push({
      est_id: null, employee_id: employeeId, salary_head_id: null,
      amount: medEeAmount, percentage: null,
      head_code: 'MED_EE', head_name: 'Medical Aid Employee', transaction_type: 'DEDUCTION',
      irp5_code: '4005', taxable: false, calculation_method: null, priority: 50,
      scoa_debit_item: null, scoa_credit_item: null, formula: null, is_system_generated: true,
    });
  }

  if (medInfo.hasMedicalAid && medErAmount > 0) {
    filteredTransactions.push({
      est_id: null, employee_id: employeeId, salary_head_id: null,
      amount: medErAmount, percentage: null,
      head_code: 'MED_ER', head_name: 'Medical Aid (Employer)', transaction_type: 'COMPANY_CONTRIBUTION',
      irp5_code: null, taxable: false, calculation_method: null, priority: 50,
      scoa_debit_item: null, scoa_credit_item: null, formula: null, is_system_generated: true,
    });
  }

  if (medInfo.hasMedicalAid && medFringeAmount > 0) {
    filteredTransactions.push({
      est_id: null, employee_id: employeeId, salary_head_id: null,
      amount: medFringeAmount, percentage: null,
      head_code: 'MED_FRINGE', head_name: 'Medical Aid (Fringe)', transaction_type: 'FRINGE_BENEFIT',
      irp5_code: '3810', taxable: true, calculation_method: null, priority: 50,
      scoa_debit_item: null, scoa_credit_item: null, formula: null, is_system_generated: true,
    });
  }

  if (retFunds.length > 0 && retEeAmount > 0) {
    filteredTransactions.push({
      est_id: null, employee_id: employeeId, salary_head_id: null,
      amount: retEeAmount, percentage: null,
      head_code: 'PEN_EE', head_name: 'Pension Fund (Employee)', transaction_type: 'DEDUCTION',
      irp5_code: '4001', taxable: false, calculation_method: null, priority: 51,
      scoa_debit_item: null, scoa_credit_item: null, formula: null, is_system_generated: true,
    });
  }

  if (retFunds.length > 0 && retErAmount > 0) {
    filteredTransactions.push({
      est_id: null, employee_id: employeeId, salary_head_id: null,
      amount: retErAmount, percentage: null,
      head_code: 'PEN_ER', head_name: 'Pension Fund (Employer)', transaction_type: 'COMPANY_CONTRIBUTION',
      irp5_code: null, taxable: false, calculation_method: null, priority: 51,
      scoa_debit_item: null, scoa_credit_item: null, formula: null, is_system_generated: true,
    });
  }

  if (retFunds.length > 0 && retFringeAmount > 0) {
    filteredTransactions.push({
      est_id: null, employee_id: employeeId, salary_head_id: null,
      amount: retFringeAmount, percentage: null,
      head_code: 'PEN_FRINGE', head_name: 'Pension Fund (Fringe)', transaction_type: 'FRINGE_BENEFIT',
      irp5_code: '3825', taxable: true, calculation_method: null, priority: 51,
      scoa_debit_item: null, scoa_credit_item: null, formula: null, is_system_generated: true,
    });
  }

  let unionFeeTotal = 0;
  for (const um of unionMemberships) {
    const contribType = (um.contribution_type || '').trim();
    const contribValue = parseFloat(um.contribution_value) || 0;
    const maxValue = parseFloat(um.maximum_value) || 0;
    let fee = 0;
    if (contribType === '%') {
      fee = parseFloat((monthlyBasic * contribValue / 100).toFixed(2));
      if (maxValue > 0 && fee > maxValue) fee = maxValue;
    } else {
      fee = contribValue;
      if (maxValue > 0 && fee > maxValue) fee = maxValue;
    }
    unionFeeTotal += fee;
  }
  if (unionMemberships.length > 0 && unionFeeTotal > 0) {
    const unionHead = await dbQuery(`SELECT id FROM salary_heads WHERE code = 'UNION_FEES' LIMIT 1`);
    const unionHeadId = unionHead.rows.length > 0 ? unionHead.rows[0].id : null;
    filteredTransactions.push({
      est_id: null, employee_id: employeeId, salary_head_id: unionHeadId,
      amount: parseFloat(unionFeeTotal.toFixed(2)), percentage: null,
      head_code: 'UNION_FEES', head_name: 'Union Fees', transaction_type: 'DEDUCTION',
      irp5_code: null, taxable: false, calculation_method: null, priority: 52,
      scoa_debit_item: null, scoa_credit_item: null, formula: null, is_system_generated: true,
    });
  }

  const existingHeadIds = new Set(filteredTransactions.filter(t => t.salary_head_id).map(t => t.salary_head_id));

  const allMocResult = await dbQuery(
    `SELECT shf.*, sh.id AS sh_id, sh.code, sh.name AS head_name, sh.transaction_type,
            sh.irp5_code, sh.taxable, sh.affects_uif, sh.affects_sdl, sh.priority AS head_priority,
            sh.scoa_debit_item, sh.scoa_credit_item
     FROM salary_head_formulas shf
     JOIN salary_heads sh ON shf.salary_head_id = sh.id
     WHERE shf.enabled = TRUE AND sh.calculation_method IN ('SYSTEM_CALCULATE', 'FORMULA')
     AND (shf.start_date IS NULL OR shf.start_date <= $1)
     AND (shf.end_date IS NULL OR shf.end_date >= $1)
     ORDER BY shf.priority DESC`,
    [period.end_date]
  );

  let mocRulesMap = null;
  if (allMocResult.rows.length > 0) {
    mocRulesMap = {};
    for (const rule of allMocResult.rows) {
      if (!mocRulesMap[rule.salary_head_id]) mocRulesMap[rule.salary_head_id] = [];
      mocRulesMap[rule.salary_head_id].push(rule);
    }
  }

  const calcResult = calculateForEmployee(employeeData, filteredTransactions, taxTables, period, cycle, mocRulesMap);

  const age = getAge(emp.date_of_birth, period.end_date);

  const annualGrossTaxable = calcResult.summary.taxable_income * periodsPerYear;
  const pensionDeductionAnnual = calculatePensionDeduction(calcResult.results, annualGrossTaxable, periodsPerYear);
  const annualTaxableIncome = annualGrossTaxable - pensionDeductionAnnual;
  const annualPAYE = calculatePAYE(annualTaxableIncome, age, taxTables);
  const monthlyPAYE = parseFloat((annualPAYE / periodsPerYear).toFixed(2));
  const hasMedAidTx = calcResult.results.some(r =>
    (r.head_code || '').includes('MED') && (r.transaction_type === 'DEDUCTION' || r.transaction_type === 'FRINGE_BENEFIT')
  );
  const medCredits = (medInfo.hasMedicalAid || hasMedAidTx)
    ? calculateMedicalCredits(medInfo.dependantCount || emp.dependants || 0, taxTables, periodsPerYear)
    : 0;
  const finalPAYE = Math.max(0, parseFloat((monthlyPAYE - medCredits).toFixed(2)));

  const payeItem = calcResult.results.find(r => r.head_code === 'PAYE');
  if (payeItem) {
    const payeDiff = payeItem.amount - finalPAYE;
    payeItem.amount = finalPAYE;
    payeItem.calculation_detail = {
      ...payeItem.calculation_detail,
      annual_gross_taxable: annualGrossTaxable,
      annual_pension_deduction: pensionDeductionAnnual,
      annual_taxable: annualTaxableIncome,
      medical_credits: medCredits,
      monthly_tax: monthlyPAYE,
      annual_tax: annualPAYE,
    };
    calcResult.summary.paye = finalPAYE;
    calcResult.summary.total_deductions = parseFloat((calcResult.summary.total_deductions - payeDiff).toFixed(2));
    calcResult.summary.nett_pay = parseFloat((calcResult.summary.nett_pay + payeDiff).toFixed(2));
    calcResult.summary.medical_credits = medCredits;
  }

  let appliedBracket = null;
  for (const bracket of taxTables.brackets) {
    const min = parseFloat(bracket.min_income) || 0;
    const max = parseFloat(bracket.max_income) || Infinity;
    if (annualTaxableIncome > min && annualTaxableIncome <= max) {
      appliedBracket = bracket;
      break;
    }
    if (annualTaxableIncome > min) appliedBracket = bracket;
  }

  let totalRebates = 0;
  const rebatesApplied = [];
  for (const rebate of taxTables.rebates) {
    const rebateAmount = parseFloat(rebate.amount) || 0;
    const rebateType = (rebate.rebate_type || '').toUpperCase();
    if (rebateType === 'PRIMARY') {
      totalRebates += rebateAmount;
      rebatesApplied.push({ type: 'PRIMARY', amount: rebateAmount });
    } else if (rebateType === 'SECONDARY' && age >= 65) {
      totalRebates += rebateAmount;
      rebatesApplied.push({ type: 'SECONDARY', amount: rebateAmount });
    } else if (rebateType === 'TERTIARY' && age >= 75) {
      totalRebates += rebateAmount;
      rebatesApplied.push({ type: 'TERTIARY', amount: rebateAmount });
    }
  }

  const payeBreakdown = {
    tax_year: taxYear,
    age,
    periods_per_year: periodsPerYear,
    monthly_taxable_income: calcResult.summary.taxable_income,
    annual_gross_taxable: annualGrossTaxable,
    annual_pension_deduction: pensionDeductionAnnual,
    annual_taxable_income: annualTaxableIncome,
    applied_bracket: appliedBracket ? {
      bracket_number: appliedBracket.bracket_number,
      min_income: parseFloat(appliedBracket.min_income),
      max_income: parseFloat(appliedBracket.max_income),
      base_tax: parseFloat(appliedBracket.base_tax),
      rate: parseFloat(appliedBracket.rate),
    } : null,
    annual_tax_before_rebates: annualPAYE + totalRebates,
    rebates: rebatesApplied,
    total_rebates: totalRebates,
    annual_tax_after_rebates: annualPAYE,
    monthly_paye_before_credits: monthlyPAYE,
    medical_tax_credits: medCredits,
    dependant_count: medInfo.hasMedicalAid ? medInfo.dependantCount : (emp.dependants || 0),
    final_monthly_paye: finalPAYE,
    salary_source: salarySource,
    total_package: annualSalary,
    basic_annual: basicAnnual,
  };

  return {
    ...calcResult,
    employee_id: employeeId,
    period,
    salaryStructure: {
      source: salarySource,
      annualSalary,
      basicAnnual,
      monthlyBasic,
      groupItems: groupItems,
    },
    medicalAid: medInfo,
    retirementFunds: retFunds,
    unionMemberships,
    payeBreakdown,
    transactions: empTransResult.rows,
  };
}

function tokenizeFormula(input) {
  const tokens = [];
  let i = 0;
  while (i < input.length) {
    if (/\s/.test(input[i])) { i++; continue; }
    if (/[0-9]/.test(input[i]) || (input[i] === '.' && i + 1 < input.length && /[0-9]/.test(input[i + 1]))) {
      let num = '';
      while (i < input.length && /[0-9.]/.test(input[i])) { num += input[i]; i++; }
      tokens.push({ type: 'NUMBER', value: parseFloat(num) });
      continue;
    }
    if (/[a-zA-Z_]/.test(input[i])) {
      let id = '';
      while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) { id += input[i]; i++; }
      tokens.push({ type: 'IDENT', value: id });
      continue;
    }
    if (input[i] === '>' && input[i + 1] === '=') { tokens.push({ type: 'OP', value: '>=' }); i += 2; continue; }
    if (input[i] === '<' && input[i + 1] === '=') { tokens.push({ type: 'OP', value: '<=' }); i += 2; continue; }
    if (input[i] === '!' && input[i + 1] === '=') { tokens.push({ type: 'OP', value: '!=' }); i += 2; continue; }
    if (input[i] === '=' && input[i + 1] === '=') { tokens.push({ type: 'OP', value: '==' }); i += 2; continue; }
    if ('+-*/(),><'.includes(input[i])) { tokens.push({ type: 'OP', value: input[i] }); i++; continue; }
    return { tokens: null, error: `Unexpected character: ${input[i]}` };
  }
  tokens.push({ type: 'EOF' });
  return { tokens, error: null };
}

function parseExpression(tokens, pos, variables, funcs) {
  return parseComparison(tokens, pos, variables, funcs);
}

function parseComparison(tokens, pos, variables, funcs) {
  let result = parseAddSub(tokens, pos, variables, funcs);
  if (result.error) return result;
  pos = result.pos;
  const compOps = ['>=', '<=', '>', '<', '==', '!='];
  while (pos < tokens.length && tokens[pos].type === 'OP' && compOps.includes(tokens[pos].value)) {
    const op = tokens[pos].value;
    pos++;
    const right = parseAddSub(tokens, pos, variables, funcs);
    if (right.error) return right;
    pos = right.pos;
    const l = result.value, r = right.value;
    if (op === '>=') result = { value: l >= r ? 1 : 0, pos, error: null };
    else if (op === '<=') result = { value: l <= r ? 1 : 0, pos, error: null };
    else if (op === '>') result = { value: l > r ? 1 : 0, pos, error: null };
    else if (op === '<') result = { value: l < r ? 1 : 0, pos, error: null };
    else if (op === '==') result = { value: l === r ? 1 : 0, pos, error: null };
    else if (op === '!=') result = { value: l !== r ? 1 : 0, pos, error: null };
  }
  return result;
}

function parseAddSub(tokens, pos, variables, funcs) {
  let result = parseMulDiv(tokens, pos, variables, funcs);
  if (result.error) return result;
  pos = result.pos;
  while (pos < tokens.length && tokens[pos].type === 'OP' && (tokens[pos].value === '+' || tokens[pos].value === '-')) {
    const op = tokens[pos].value;
    pos++;
    const right = parseMulDiv(tokens, pos, variables, funcs);
    if (right.error) return right;
    pos = right.pos;
    result = { value: op === '+' ? result.value + right.value : result.value - right.value, pos, error: null };
  }
  return result;
}

function parseMulDiv(tokens, pos, variables, funcs) {
  let result = parseUnary(tokens, pos, variables, funcs);
  if (result.error) return result;
  pos = result.pos;
  while (pos < tokens.length && tokens[pos].type === 'OP' && (tokens[pos].value === '*' || tokens[pos].value === '/')) {
    const op = tokens[pos].value;
    pos++;
    const right = parseUnary(tokens, pos, variables, funcs);
    if (right.error) return right;
    pos = right.pos;
    if (op === '/') {
      result = { value: right.value === 0 ? 0 : result.value / right.value, pos, error: null };
    } else {
      result = { value: result.value * right.value, pos, error: null };
    }
  }
  return result;
}

function parseUnary(tokens, pos, variables, funcs) {
  if (pos < tokens.length && tokens[pos].type === 'OP' && tokens[pos].value === '-') {
    pos++;
    const r = parsePrimary(tokens, pos, variables, funcs);
    if (r.error) return r;
    return { value: -r.value, pos: r.pos, error: null };
  }
  if (pos < tokens.length && tokens[pos].type === 'OP' && tokens[pos].value === '+') {
    pos++;
  }
  return parsePrimary(tokens, pos, variables, funcs);
}

function parsePrimary(tokens, pos, variables, funcs) {
  if (pos >= tokens.length || tokens[pos].type === 'EOF') {
    return { value: 0, pos, error: 'Unexpected end of formula' };
  }
  const tok = tokens[pos];
  if (tok.type === 'NUMBER') {
    return { value: tok.value, pos: pos + 1, error: null };
  }
  if (tok.type === 'IDENT') {
    const name = tok.value;
    if (funcs[name] !== undefined) {
      pos++;
      if (pos >= tokens.length || tokens[pos].value !== '(') {
        return { value: 0, pos, error: `Expected '(' after function ${name}` };
      }
      pos++;
      const args = [];
      if (pos < tokens.length && tokens[pos].value !== ')') {
        const first = parseExpression(tokens, pos, variables, funcs);
        if (first.error) return first;
        args.push(first.value);
        pos = first.pos;
        while (pos < tokens.length && tokens[pos].value === ',') {
          pos++;
          const arg = parseExpression(tokens, pos, variables, funcs);
          if (arg.error) return arg;
          args.push(arg.value);
          pos = arg.pos;
        }
      }
      if (pos >= tokens.length || tokens[pos].value !== ')') {
        return { value: 0, pos, error: `Expected ')' after function arguments for ${name}` };
      }
      pos++;
      const val = funcs[name](...args);
      return { value: typeof val === 'number' && isFinite(val) ? val : 0, pos, error: null };
    }
    if (variables.hasOwnProperty(name)) {
      return { value: parseFloat(variables[name]) || 0, pos: pos + 1, error: null };
    }
    return { value: 0, pos: pos + 1, error: `Unknown variable: ${name}` };
  }
  if (tok.type === 'OP' && tok.value === '(') {
    pos++;
    const inner = parseExpression(tokens, pos, variables, funcs);
    if (inner.error) return inner;
    pos = inner.pos;
    if (pos >= tokens.length || tokens[pos].value !== ')') {
      return { value: 0, pos, error: 'Unbalanced parentheses' };
    }
    return { value: inner.value, pos: pos + 1, error: null };
  }
  return { value: 0, pos, error: `Unexpected token: ${tok.value}` };
}

function evaluateFormulaV2(formula, variables, codeResults) {
  if (!formula || typeof formula !== 'string' || formula.length > 2000) {
    return { value: 0, error: 'Invalid or empty formula' };
  }

  let processed = formula;
  if (codeResults && typeof codeResults === 'object') {
    processed = processed.replace(/\[([A-Z0-9_]+)\]/g, (match, code) => {
      const val = codeResults[code];
      if (val !== undefined && val !== null) return String(parseFloat(val) || 0);
      return '0';
    });
  }

  const funcs = {
    IF: (cond, trueVal, falseVal) => cond ? (typeof trueVal === 'number' ? trueVal : 0) : (typeof falseVal === 'number' ? falseVal : 0),
    MIN: (...args) => Math.min(...args.map(a => a || 0)),
    MAX: (...args) => Math.max(...args.map(a => a || 0)),
    ROUND: (val, digits) => {
      const d = Math.max(0, Math.min(10, parseInt(digits) || 0));
      return parseFloat((val || 0).toFixed(d));
    },
    ABS: (val) => Math.abs(val || 0),
  };

  const { tokens, error: tokenError } = tokenizeFormula(processed);
  if (tokenError) return { value: 0, error: tokenError };

  const result = parseExpression(tokens, 0, variables, funcs);
  if (result.error) return { value: 0, error: result.error };

  if (result.pos < tokens.length && tokens[result.pos].type !== 'EOF') {
    return { value: 0, error: `Unexpected token after expression: ${tokens[result.pos].value}` };
  }

  if (typeof result.value !== 'number' || !isFinite(result.value)) {
    return { value: 0, error: 'Formula did not produce a valid number' };
  }
  return { value: parseFloat(result.value.toFixed(6)) };
}

function resolveMOCRule(formulaRules, employee, periodEndDate) {
  if (!formulaRules || formulaRules.length === 0) return null;

  const empCosId = employee.condition_of_service_id || null;
  const empTypeId = employee.employee_type_id || null;
  const empSubtypeId = employee.employee_subtype_id || null;

  const refDate = periodEndDate ? new Date(periodEndDate) : new Date();
  const enabledRules = formulaRules.filter(r => {
    if (r.enabled === false) return false;
    if (r.start_date && new Date(r.start_date) > refDate) return false;
    if (r.end_date && new Date(r.end_date) < refDate) return false;
    return true;
  });

  let bestMatch = null;
  let bestScore = -1;

  for (const rule of enabledRules) {
    const ruleCos = rule.condition_of_service_id || null;
    const ruleType = rule.employee_type_id || null;
    const ruleSubtype = rule.employee_subtype_id || null;

    if (ruleCos && ruleCos !== empCosId) continue;
    if (ruleType && ruleType !== empTypeId) continue;
    if (ruleSubtype && ruleSubtype !== empSubtypeId) continue;

    let specificity = 0;
    if (ruleSubtype && ruleSubtype === empSubtypeId) specificity += 100;
    if (ruleType && ruleType === empTypeId) specificity += 10;
    if (ruleCos && ruleCos === empCosId) specificity += 1;
    const score = specificity * 10000 + (rule.priority || 0);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = rule;
    }
  }

  return bestMatch;
}

async function loadMOCRules(salaryHeadId) {
  const result = await dbQuery(
    `SELECT * FROM salary_head_formulas WHERE salary_head_id = $1 AND enabled = TRUE ORDER BY priority DESC`,
    [salaryHeadId]
  );
  return result.rows;
}

async function buildFormulaVariables(employeeId, periodId, cycleId) {
  const periodResult = await dbQuery(
    `SELECT pp.*, pc.periods_per_year FROM payroll_periods pp
     JOIN payroll_cycles pc ON pp.cycle_id = pc.id WHERE pp.id = $1`, [periodId]
  );
  if (periodResult.rows.length === 0) throw new Error('Period not found');
  const period = periodResult.rows[0];
  const periodsPerYear = period.periods_per_year || 12;

  const empResult = await dbQuery(
    `SELECT e.id, e.employee_code, e.annual_salary, e.monthly_salary, e.task_grade_id, e.date_of_birth, e.dependants, e.joining_date AS date_engaged,
            e.employee_type_id, e.employee_subtype_id, e.condition_of_service_id,
            e.working_hours_per_month, e.working_days_per_month, e.working_hours_per_day,
            e.salary_based_on, e.wage_rate,
            jp.task_grade_id AS jp_task_grade_id
     FROM employees e
     LEFT JOIN positions p ON e.position_id = p.id
     LEFT JOIN job_profiles jp ON p.job_profile_id = jp.id
     WHERE e.id = $1`, [employeeId]
  );
  if (empResult.rows.length === 0) throw new Error('Employee not found');
  const emp = empResult.rows[0];

  const basicSalary = resolveMonthlyBasic(emp, periodsPerYear);
  const annualSalary = parseFloat(emp.annual_salary) || 0;
  const age = getAge(emp.date_of_birth, period.end_date);
  const whpm = parseFloat(emp.working_hours_per_month) || 173.33;
  const wdpm = parseFloat(emp.working_days_per_month) || 21.75;

  let serviceYears = 0;
  if (emp.date_engaged) {
    const engaged = new Date(emp.date_engaged);
    const periodEnd = new Date(period.end_date);
    serviceYears = Math.max(0, parseFloat(((periodEnd - engaged) / (365.25 * 24 * 60 * 60 * 1000)).toFixed(1)));
  }

  let prevBasic = basicSalary;
  let prevAnnual = annualSalary;
  try {
    const prevResult = await dbQuery(
      `SELECT pr.amount FROM payroll_results pr
       JOIN payroll_runs prr ON pr.run_id = prr.id
       JOIN payroll_periods pp ON prr.period_id = pp.id
       JOIN salary_heads sh ON pr.salary_head_id = sh.id
       WHERE pr.employee_id = $1 AND sh.code IN ('BASIC','BASIC_SALARY') AND pp.end_date < $2
       ORDER BY pp.end_date DESC LIMIT 1`,
      [employeeId, period.start_date]
    );
    if (prevResult.rows.length > 0) {
      prevBasic = parseFloat(prevResult.rows[0].amount) || basicSalary;
      prevAnnual = prevBasic * periodsPerYear;
    }
  } catch (e) { /* use defaults */ }

  const medInfo = await getEmployeeMedicalAidInfo(employeeId, period.start_date, period.end_date);
  const medDeps = medInfo.hasMedicalAid ? (medInfo.dependantCount || 0) : (parseInt(emp.dependants) || 0);

  return {
    BasicSalary: basicSalary,
    AnnualSalary: annualSalary,
    PrevBasicSalary: prevBasic,
    PrevAnnualSalary: prevAnnual,
    captured_amount: 0,
    GrossEarnings: basicSalary,
    TotalDeductions: 0,
    NetPay: basicSalary,
    HoursWorked: whpm,
    DaysWorked: wdpm,
    WHPM_Monthly: whpm,
    WHPD_Other: parseFloat(emp.working_hours_per_day) || 8,
    RPD_Other: basicSalary / wdpm,
    RPH_Monthly: basicSalary / whpm,
    RPD: basicSalary / wdpm,
    ServiceYears: serviceYears,
    Age: age,
    MedicalDependants: medDeps,
    PeriodsPerYear: periodsPerYear,
    FixedSalary: basicSalary,
    PrevSalary: prevBasic,
    input: 0,
  };
}

function applyMOCRounding(value, rule) {
  const method = (rule && rule.round_method) || 'ROUND';
  if (method === 'NONE') return value;
  const digits = (rule && rule.round_digits != null) ? rule.round_digits : 2;
  if (method === 'FLOOR') return parseFloat(Math.floor(value * Math.pow(10, digits)) / Math.pow(10, digits));
  if (method === 'CEIL') return parseFloat(Math.ceil(value * Math.pow(10, digits)) / Math.pow(10, digits));
  return parseFloat(value.toFixed(digits));
}

async function loadTaxTables(taxYear) {
  const [brackets, rebates, thresholds, medCredits, uif, sdl, systemHeads, irp5Codes] = await Promise.all([
    dbQuery('SELECT * FROM tax_brackets WHERE tax_year = $1 ORDER BY bracket_number', [taxYear]),
    dbQuery('SELECT * FROM tax_rebates WHERE tax_year = $1', [taxYear]),
    dbQuery('SELECT * FROM tax_thresholds WHERE tax_year = $1', [taxYear]),
    dbQuery('SELECT * FROM medical_tax_credits WHERE tax_year = $1', [taxYear]),
    dbQuery('SELECT * FROM uif_settings WHERE tax_year = $1', [taxYear]),
    dbQuery('SELECT * FROM sdl_settings WHERE tax_year = $1', [taxYear]),
    dbQuery("SELECT id, code, scoa_debit_item, scoa_credit_item FROM salary_heads WHERE code IN ('PAYE','UIF_EE','UIF_ER','SDL','BASIC','BASIC_SALARY','PAYASYOUEARN_PAYE','UNEMPLOYMENT_INSURANCE_FUND_UIF_EMPLOYEE','UNEMPLOYMENT_INSURANCE_FUND_UIF_EMPLOYER','SKILLS_DEVELOPMENT_LEVY_SDL','MEDICAL_AID_EMPLOYEE','MEDICAL_AID_EMPLOYER','MEDICAL_AID_FRINGE','PENSION_FUND_EMPLOYEE','PENSION_FUND_EMPLOYER','PENSION_FUND_FRINGE','UNION_FEES','MED_EE','MED_ER','MED_FRINGE','PEN_EE','PEN_ER','PEN_FRINGE','MED_AID_EE','MED_AID_ER','PENSION_EE','PENSION_ER','PENSION_FRINGE')"),
    dbQuery("SELECT code, type, taxable_percentage, start_date, end_date FROM irp5_codes WHERE enabled = true"),
  ]);

  const codeAliases = {
    'PAYASYOUEARN_PAYE': 'PAYE',
    'UNEMPLOYMENT_INSURANCE_FUND_UIF_EMPLOYEE': 'UIF_EE',
    'UNEMPLOYMENT_INSURANCE_FUND_UIF_EMPLOYER': 'UIF_ER',
    'SKILLS_DEVELOPMENT_LEVY_SDL': 'SDL',
    'BASIC_SALARY': 'BASIC',
    'MEDICAL_AID_EMPLOYEE': 'MED_EE',
    'MEDICAL_AID_EMPLOYER': 'MED_ER',
    'MEDICAL_AID_FRINGE': 'MED_FRINGE',
    'PENSION_FUND_EMPLOYEE': 'PEN_EE',
    'PENSION_FUND_EMPLOYER': 'PEN_ER',
    'PENSION_FUND_FRINGE': 'PEN_FRINGE',
    'MED_AID_EE': 'MED_EE',
    'MED_AID_ER': 'MED_ER',
    'PENSION_EE': 'PEN_EE',
    'PENSION_ER': 'PEN_ER',
    'PENSION_FRINGE': 'PEN_FRINGE',
  };
  const sysHeadMap = {};
  for (const h of systemHeads.rows) {
    sysHeadMap[h.code] = h;
    const alias = codeAliases[h.code];
    if (alias && !sysHeadMap[alias]) sysHeadMap[alias] = h;
  }

  const irp5Map = {};
  for (const c of irp5Codes.rows) {
    irp5Map[c.code] = { type: c.type, taxable_percentage: c.taxable_percentage, start_date: c.start_date, end_date: c.end_date };
  }

  return {
    brackets: brackets.rows,
    rebates: rebates.rows,
    thresholds: thresholds.rows,
    medicalCredits: medCredits.rows[0] || { main_member: 364, first_dependant: 364, additional_dependant: 246 },
    uif: uif.rows[0] || { employee_rate: 0.01, employer_rate: 0.01, ceiling: 17712 },
    sdl: sdl.rows[0] || { rate: 0.01, threshold: 500000 },
    systemHeads: sysHeadMap,
    irp5Map,
  };
}

function getAge(dob, referenceDate) {
  if (!dob) return 30;
  const d = new Date(dob);
  const ref = referenceDate ? new Date(referenceDate) : new Date();
  let age = ref.getFullYear() - d.getFullYear();
  const m = ref.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < d.getDate())) age--;
  return age;
}

function calculatePAYE(annualTaxableIncome, age, taxTables) {
  const { brackets, rebates, thresholds } = taxTables;

  function getAgeThresholdFromType(t) {
    const at = parseInt(t.age_threshold);
    if (!isNaN(at)) return at;
    const tt = (t.threshold_type || '').toUpperCase();
    if (tt.includes('75')) return 75;
    if (tt.includes('65')) return 65;
    return 0;
  }

  if (thresholds.length > 0) {
    const sortedThresholds = [...thresholds]
      .map(t => ({ ...t, _ageThresh: getAgeThresholdFromType(t) }))
      .sort((a, b) => a._ageThresh - b._ageThresh);
    let applicableThreshold = sortedThresholds[0];
    for (const t of sortedThresholds) {
      if (age >= t._ageThresh) applicableThreshold = t;
    }
    if (annualTaxableIncome <= parseFloat(applicableThreshold.amount)) {
      return 0;
    }
  }

  if (brackets.length === 0) {
    return Math.max(0, annualTaxableIncome * 0.18 / 12);
  }

  let annualTax = 0;
  for (const bracket of brackets) {
    const min = parseFloat(bracket.min_income) || 0;
    const max = parseFloat(bracket.max_income) || Infinity;
    const baseTax = parseFloat(bracket.base_tax) || 0;
    const rate = parseFloat(bracket.rate) || 0;

    if (annualTaxableIncome > min) {
      annualTax = baseTax + (Math.min(annualTaxableIncome, max) - min) * (rate / 100);
      if (annualTaxableIncome <= max) break;
    }
  }

  let totalRebates = 0;
  for (const rebate of rebates) {
    const rebateAmount = parseFloat(rebate.amount) || 0;
    const ageThresh = parseInt(rebate.age_threshold) || 0;
    const rebateType = (rebate.rebate_type || '').toUpperCase();

    if (rebateType === 'PRIMARY') {
      totalRebates += rebateAmount;
    } else if (rebateType === 'SECONDARY' && age >= 65) {
      totalRebates += rebateAmount;
    } else if (rebateType === 'TERTIARY' && age >= 75) {
      totalRebates += rebateAmount;
    } else if (ageThresh > 0 && age >= ageThresh && rebateType !== 'PRIMARY') {
      totalRebates += rebateAmount;
    }
  }

  return Math.max(0, annualTax - totalRebates);
}

function calculateMedicalCredits(dependants, taxTables, periodsPerYear) {
  const mc = taxTables.medicalCredits;
  if (!mc) return 0;

  const mainMember = parseFloat(mc.main_member) || 364;
  const firstDep = parseFloat(mc.first_dependant) || 364;
  const additionalDep = parseFloat(mc.additional_dependant) || 246;

  let monthlyCredit = mainMember;
  const totalDeps = parseInt(dependants) || 0;
  if (totalDeps >= 1) monthlyCredit += firstDep;
  if (totalDeps >= 2) monthlyCredit += (totalDeps - 1) * additionalDep;

  return monthlyCredit;
}

function calculateUIF(monthlyRemuneration, taxTables, excludeUif) {
  if (excludeUif) return { employee: 0, employer: 0 };

  const uif = taxTables.uif;
  let rate_ee = parseFloat(uif.employee_rate) || 1;
  let rate_er = parseFloat(uif.employer_rate) || 1;
  const ceiling = parseFloat(uif.ceiling) || 17712;

  if (rate_ee > 0.5) rate_ee = rate_ee / 100;
  if (rate_er > 0.5) rate_er = rate_er / 100;

  const cappedRemuneration = Math.min(monthlyRemuneration, ceiling);
  return {
    employee: parseFloat((cappedRemuneration * rate_ee).toFixed(2)),
    employer: parseFloat((cappedRemuneration * rate_er).toFixed(2)),
  };
}

const PENSION_IRP5_CODES = ['4001','4002','4003','4004','4006','4007','4026','3817','3867','3825','3875','3828','3878'];

function calculatePensionDeduction(payslipResults, annualTaxableIncome, periodsPerYear) {
  let monthlyPension = 0;
  for (const item of payslipResults) {
    const irp5Code = String(item.irp5_code || '');
    if (PENSION_IRP5_CODES.includes(irp5Code)) {
      monthlyPension += Math.abs(item.amount);
    }
  }

  if (monthlyPension <= 0) return 0;

  let annualPension = monthlyPension * periodsPerYear;
  const pensionPctCap = annualTaxableIncome * 0.275;
  const pensionValCap = 350000;
  if (annualPension > pensionPctCap) annualPension = pensionPctCap;
  if (annualPension > pensionValCap) annualPension = pensionValCap;
  return annualPension;
}

function calculateSDL(payslipResults, pensionContributions, taxTables, periodsPerYear, excludeSdl) {
  if (excludeSdl) return 0;

  const sdl = taxTables.sdl;
  let rate = parseFloat(sdl.rate) || 1;
  if (rate > 0.5) rate = rate / 100;

  const irp5Map = taxTables.irp5Map || {};

  let monthlyTaxableIncome = 0;
  for (const item of payslipResults) {
    const txType = item.transaction_type;
    if (txType !== 'EARNING' && txType !== 'FRINGE_BENEFIT') continue;
    const irp5Code = item.irp5_code;
    if (!irp5Code) continue;
    const irp5Info = irp5Map[String(irp5Code)];
    if (!irp5Info) continue;
    if (irp5Info.type >= 1 && irp5Info.type <= 3) {
      const taxablePct = (irp5Info.taxable_percentage || 0) / 100;
      if (taxablePct > 0) {
        monthlyTaxableIncome += Math.abs(item.amount) * taxablePct;
      }
    }
  }

  let annualIncome = monthlyTaxableIncome * periodsPerYear;

  const allItems = [...payslipResults, ...pensionContributions];
  const pensionDeduction = calculatePensionDeduction(allItems, annualIncome, periodsPerYear);
  annualIncome = annualIncome - pensionDeduction;

  if (annualIncome <= 0) return 0;
  return parseFloat((annualIncome * rate / periodsPerYear).toFixed(2));
}

function calculateForEmployee(employee, transactions, taxTables, period, cycle, mocRulesMap) {
  const periodsPerYear = cycle.periods_per_year || 12;
  const age = getAge(employee.date_of_birth, period.end_date);
  const results = [];
  const codeResults = {};

  const sorted = [...transactions].sort((a, b) => (a.priority || 0) - (b.priority || 0));

  let totalTaxableEarnings = 0;
  let totalGrossEarnings = 0;
  let totalNonTaxableEarnings = 0;
  let totalFringeBenefits = 0;
  const userDeductions = [];
  const userCompanyContribs = [];

  const basicTx = sorted.find(t => isBasicCode(t.head_code || t.code) && t.transaction_type === 'EARNING');
  const monthlyBasic = resolveMonthlyBasic(employee, periodsPerYear);
  const annualSalary = parseFloat(employee.annual_salary) || (monthlyBasic * periodsPerYear);
  const isRateBasedZeroBasic2 = !(employee.task_grade_id || employee.jp_task_grade_id) && (employee.salary_based_on === 'RATE_PER_HOUR' || employee.salary_based_on === 'RATE_PER_DAY' || employee.salary_based_on === 'CAPTURED_VALUE');

  if (basicTx) {
    if (!isRateBasedZeroBasic2) {
      basicTx.amount = monthlyBasic;
      basicTx.calculation_method = null;
    }
  } else {
    sorted.unshift({
      est_id: null, employee_id: employee.id, salary_head_id: null,
      amount: monthlyBasic,
      head_code: 'BASIC', head_name: 'Basic Salary', transaction_type: 'EARNING',
      irp5_code: '3601', taxable: true, calculation_method: null, priority: 0,
      scoa_debit_item: null, scoa_credit_item: null, formula: null, is_system_generated: true,
    });
  }

  let serviceYears = 0;
  if (employee.date_engaged) {
    const engaged = new Date(employee.date_engaged);
    const periodEnd = new Date(period.end_date);
    serviceYears = Math.max(0, parseFloat(((periodEnd - engaged) / (365.25 * 24 * 60 * 60 * 1000)).toFixed(1)));
  }

  const whpm = parseFloat(employee.working_hours_per_month || employee.hours_worked) || 173.33;
  const wdpm = parseFloat(employee.working_days_per_month || employee.days_worked) || 21.75;
  const prevBasic = parseFloat(employee.prev_basic_salary) || monthlyBasic;

  const mocVars = {
    BasicSalary: monthlyBasic,
    AnnualSalary: annualSalary,
    PrevBasicSalary: prevBasic,
    PrevAnnualSalary: parseFloat(employee.prev_annual_salary) || annualSalary,
    PrevSalary: prevBasic,
    captured_amount: 0,
    GrossEarnings: 0,
    TotalDeductions: 0,
    NetPay: 0,
    HoursWorked: whpm,
    DaysWorked: wdpm,
    WHPM_Monthly: whpm,
    WHPD_Other: parseFloat(employee.working_hours_per_day) || 8,
    RPD_Other: monthlyBasic / wdpm,
    RPH_Monthly: monthlyBasic / whpm,
    RPD: monthlyBasic / wdpm,
    ServiceYears: serviceYears,
    Age: age,
    MedicalDependants: parseInt(employee.dependants) || 0,
    PeriodsPerYear: periodsPerYear,
    FixedSalary: monthlyBasic,
    input: 0,
  };

  for (const tx of sorted) {
    let amount = parseFloat(tx.amount) || 0;
    const pct = parseFloat(tx.percentage) || 0;
    const headCode = tx.head_code || tx.code;

    if (tx.calculation_method === 'PERCENTAGE_OF_BASIC' && pct > 0) {
      amount = parseFloat((monthlyBasic * pct / 100).toFixed(2));
    } else if (tx.calculation_method === 'SYSTEM_CALCULATE') {
      const headMocRules = mocRulesMap ? mocRulesMap[tx.salary_head_id] : null;
      const matchedRule = headMocRules ? resolveMOCRule(headMocRules, employee, period.end_date) : null;

      if (matchedRule) {
        mocVars.captured_amount = amount;
        mocVars.GrossEarnings = totalGrossEarnings;
        const runningDeductions = userDeductions.reduce((s, d) => s + (d.amount || 0), 0);
        mocVars.TotalDeductions = runningDeductions;
        mocVars.NetPay = totalGrossEarnings - runningDeductions;
        const evalResult = evaluateFormulaV2(matchedRule.formula, mocVars, codeResults);
        amount = evalResult.value || 0;
        if (matchedRule.pro_rata) {
          const periodStart = new Date(period.start_date);
          const periodEnd = new Date(period.end_date);
          const totalPeriodDays = Math.max(1, Math.round((periodEnd - periodStart) / (24 * 60 * 60 * 1000)) + 1);
          let activeDays = totalPeriodDays;
          if (employee.date_engaged) {
            const engaged = new Date(employee.date_engaged);
            if (engaged > periodStart && engaged <= periodEnd) {
              activeDays = Math.round((periodEnd - engaged) / (24 * 60 * 60 * 1000)) + 1;
            }
          }
          if (employee.termination_date) {
            const term = new Date(employee.termination_date);
            if (term >= periodStart && term < periodEnd) {
              activeDays = Math.min(activeDays, Math.round((term - periodStart) / (24 * 60 * 60 * 1000)) + 1);
            }
          }
          if (activeDays < totalPeriodDays) {
            amount = amount * (activeDays / totalPeriodDays);
          }
        }
        amount = applyMOCRounding(amount, matchedRule);
      } else if (pct > 0) {
        amount = (annualSalary / periodsPerYear) * (pct / 100);
      } else if (amount !== 0 && !tx.is_payslip_transaction) {
        amount = parseFloat((amount / periodsPerYear).toFixed(2));
      }
    } else if (tx.calculation_method === 'FORMULA') {
      const headMocRules = mocRulesMap ? mocRulesMap[tx.salary_head_id] : null;
      const matchedRule = headMocRules ? resolveMOCRule(headMocRules, employee, period.end_date) : null;
      if (matchedRule) {
        mocVars.captured_amount = amount;
        mocVars.GrossEarnings = totalGrossEarnings;
        const runningDeductions = userDeductions.reduce((s, d) => s + (d.amount || 0), 0);
        mocVars.TotalDeductions = runningDeductions;
        mocVars.NetPay = totalGrossEarnings - runningDeductions;
        const evalResult = evaluateFormulaV2(matchedRule.formula, mocVars, codeResults);
        amount = applyMOCRounding(evalResult.value || 0, matchedRule);
      }
    }
    amount = parseFloat(amount.toFixed(2));
    codeResults[headCode] = amount;

    if (tx.transaction_type === 'EARNING') {
      if (amount === 0) continue;
      totalGrossEarnings += amount;
      if (tx.taxable) totalTaxableEarnings += amount;
      else totalNonTaxableEarnings += amount;
      mocVars.GrossEarnings = totalGrossEarnings;

      results.push({
        est_id: tx.est_id || null,
        ept_id: tx.ept_id || null,
        salary_head_id: tx.salary_head_id,
        head_code: tx.head_code || tx.code,
        head_name: tx.head_name || tx.name,
        reference_no: tx.reference_no || '',
        transaction_type: 'EARNING',
        irp5_code: tx.irp5_code,
        amount: amount,
        is_system: !!tx.is_system_generated,
        scoa_item_id: tx.scoa_debit_item,
        contra_scoa_item_id: tx.scoa_credit_item,
      });
    } else if (tx.transaction_type === 'FRINGE_BENEFIT') {
      if (amount === 0) continue;
      totalFringeBenefits += amount;
      totalTaxableEarnings += amount;
      results.push({
        est_id: tx.est_id || null,
        ept_id: tx.ept_id || null,
        salary_head_id: tx.salary_head_id,
        head_code: tx.head_code || tx.code,
        head_name: tx.head_name || tx.name,
        reference_no: tx.reference_no || '',
        transaction_type: 'FRINGE_BENEFIT',
        irp5_code: tx.irp5_code,
        amount: amount,
        is_system: !!tx.is_system_generated,
        scoa_item_id: tx.scoa_debit_item,
        contra_scoa_item_id: tx.scoa_credit_item,
      });
    } else if (tx.transaction_type === 'DEDUCTION') {
      if (tx.head_code !== 'PAYE' && tx.head_code !== 'UIF_EE') {
        if (amount === 0) continue;
        userDeductions.push({ ...tx, amount });
      }
    } else if (tx.transaction_type === 'COMPANY_CONTRIBUTION') {
      if (tx.head_code !== 'UIF_ER' && tx.head_code !== 'SDL') {
        if (amount === 0) continue;
        userCompanyContribs.push({ ...tx, amount });
      }
    }
  }

  const annualGrossTaxable = totalTaxableEarnings * periodsPerYear;

  const allResultsSoFarForPension = [...results, ...userDeductions.map(d => ({ ...d, transaction_type: 'DEDUCTION' })), ...userCompanyContribs.map(c => ({ ...c, transaction_type: 'COMPANY_CONTRIBUTION' }))];
  const annualPensionDeduction = calculatePensionDeduction(allResultsSoFarForPension, annualGrossTaxable, periodsPerYear);
  const annualTaxableIncome = annualGrossTaxable - annualPensionDeduction;

  const annualPAYE = calculatePAYE(annualTaxableIncome, age, taxTables);
  const monthlyPAYE = parseFloat((annualPAYE / periodsPerYear).toFixed(2));

  const hasMedicalAid = transactions.some(t =>
    t.head_code === 'MED_EE' || t.head_code === 'MED_AID_EE' || t.head_code === 'MEDICAL_AID' ||
    (t.head_code || '').includes('MED') && t.transaction_type === 'DEDUCTION'
  );
  const medCredits = hasMedicalAid
    ? calculateMedicalCredits(employee.dependants || 0, taxTables, periodsPerYear)
    : 0;

  const finalPAYE = Math.max(0, parseFloat((monthlyPAYE - medCredits).toFixed(2)));

  const sysHeads = taxTables.systemHeads || {};
  const payeHead = sysHeads['PAYE'] || {};
  const uifEeHead = sysHeads['UIF_EE'] || {};
  const uifErHead = sysHeads['UIF_ER'] || {};
  const sdlHead = sysHeads['SDL'] || {};

  results.push({
    salary_head_id: payeHead.id || null,
    head_code: 'PAYE',
    head_name: 'Pay As You Earn',
    transaction_type: 'DEDUCTION',
    irp5_code: '4102',
    amount: finalPAYE,
    is_system: true,
    scoa_item_id: payeHead.scoa_debit_item || null,
    contra_scoa_item_id: payeHead.scoa_credit_item || null,
    calculation_detail: {
      annual_gross_taxable: annualGrossTaxable,
      annual_pension_deduction: annualPensionDeduction,
      annual_taxable: annualTaxableIncome,
      annual_tax: annualPAYE,
      monthly_tax: monthlyPAYE,
      medical_credits: medCredits,
      age: age,
      rebates_applied: true,
    },
  });

  const uifResult = calculateUIF(totalGrossEarnings, taxTables, employee.exclude_uif);

  results.push({
    salary_head_id: uifEeHead.id || null,
    head_code: 'UIF_EE',
    head_name: 'UIF Employee',
    transaction_type: 'DEDUCTION',
    irp5_code: '4141',
    amount: uifResult.employee,
    is_system: true,
    scoa_item_id: uifEeHead.scoa_debit_item || null,
    contra_scoa_item_id: uifEeHead.scoa_credit_item || null,
  });

  results.push({
    salary_head_id: uifErHead.id || null,
    head_code: 'UIF_ER',
    head_name: 'UIF Employer',
    transaction_type: 'COMPANY_CONTRIBUTION',
    irp5_code: '4142',
    amount: uifResult.employer,
    is_system: true,
    scoa_item_id: uifErHead.scoa_debit_item || null,
    contra_scoa_item_id: uifErHead.scoa_credit_item || null,
  });

  const allResultsSoFar = [...results, ...userDeductions.map(d => ({ ...d, transaction_type: 'DEDUCTION' })), ...userCompanyContribs.map(c => ({ ...c, transaction_type: 'COMPANY_CONTRIBUTION' }))];
  const sdlAmount = calculateSDL(allResultsSoFar, [], taxTables, periodsPerYear, employee.exclude_sdl);

  results.push({
    salary_head_id: sdlHead.id || null,
    head_code: 'SDL',
    head_name: 'Skills Development Levy',
    transaction_type: 'COMPANY_CONTRIBUTION',
    irp5_code: null,
    amount: sdlAmount,
    is_system: true,
    scoa_item_id: sdlHead.scoa_debit_item || null,
    contra_scoa_item_id: sdlHead.scoa_credit_item || null,
  });

  for (const ded of userDeductions) {
    results.push({
      est_id: ded.est_id || null,
      ept_id: ded.ept_id || null,
      salary_head_id: ded.salary_head_id,
      head_code: ded.head_code || ded.code,
      head_name: ded.head_name || ded.name,
      reference_no: ded.reference_no || '',
      transaction_type: 'DEDUCTION',
      irp5_code: ded.irp5_code,
      amount: ded.amount,
      is_system: !!ded.is_system_generated,
      scoa_item_id: ded.scoa_debit_item,
      contra_scoa_item_id: ded.scoa_credit_item,
    });
  }

  for (const cc of userCompanyContribs) {
    results.push({
      est_id: cc.est_id || null,
      ept_id: cc.ept_id || null,
      salary_head_id: cc.salary_head_id,
      head_code: cc.head_code || cc.code,
      head_name: cc.head_name || cc.name,
      reference_no: cc.reference_no || '',
      transaction_type: 'COMPANY_CONTRIBUTION',
      irp5_code: cc.irp5_code,
      amount: cc.amount,
      is_system: !!cc.is_system_generated,
      scoa_item_id: cc.scoa_debit_item,
      contra_scoa_item_id: cc.scoa_credit_item,
    });
  }

  const earningsOnly = results.filter(r => r.transaction_type === 'EARNING')
    .reduce((s, r) => s + r.amount, 0);
  const fringeBenefits = results.filter(r => r.transaction_type === 'FRINGE_BENEFIT')
    .reduce((s, r) => s + r.amount, 0);
  const earnings = earningsOnly + fringeBenefits;
  const deductions = results.filter(r => r.transaction_type === 'DEDUCTION')
    .reduce((s, r) => s + r.amount, 0);
  const companyContribs = results.filter(r => r.transaction_type === 'COMPANY_CONTRIBUTION')
    .reduce((s, r) => s + r.amount, 0);

  return {
    employee_id: employee.id,
    results,
    summary: {
      gross_earnings: parseFloat(earnings.toFixed(2)),
      total_earnings: parseFloat(earningsOnly.toFixed(2)),
      total_fringe_benefits: parseFloat(fringeBenefits.toFixed(2)),
      total_deductions: parseFloat(deductions.toFixed(2)),
      nett_pay: parseFloat((earningsOnly - deductions).toFixed(2)),
      company_contributions: parseFloat(companyContribs.toFixed(2)),
      total_cost_to_company: parseFloat((earningsOnly + companyContribs).toFixed(2)),
      paye: finalPAYE,
      uif_employee: uifResult.employee,
      uif_employer: uifResult.employer,
      sdl: sdlAmount,
      medical_credits: medCredits,
      taxable_income: totalTaxableEarnings,
      non_taxable_income: totalNonTaxableEarnings,
    },
  };
}

function calculateMock(packageDetails, taxTables) {
  const {
    annual_salary = 0,
    date_of_birth = '1990-01-01',
    dependants = 0,
    medical_aid_members = 0,
    additional_earnings = [],
    additional_deductions = [],
    periods_per_year = 12,
  } = packageDetails;

  const periodsPerYear = periods_per_year;
  const monthlySalary = parseFloat((annual_salary / periodsPerYear).toFixed(2));
  const age = getAge(date_of_birth);

  const results = [];

  results.push({
    head_code: 'BASIC',
    head_name: 'Basic Salary',
    transaction_type: 'EARNING',
    irp5_code: '3601',
    amount: monthlySalary,
    is_system: false,
  });

  let totalGross = monthlySalary;
  let totalTaxable = monthlySalary;

  for (const earning of additional_earnings) {
    let amt = parseFloat(earning.amount) || 0;
    const pct = parseFloat(earning.percentage) || 0;
    if (pct > 0) amt = parseFloat((monthlySalary * pct / 100).toFixed(2));
    results.push({
      head_code: earning.code || 'ADD_EARN',
      head_name: earning.name || 'Additional Earning',
      transaction_type: 'EARNING',
      irp5_code: earning.irp5_code || '3601',
      amount: amt,
      is_system: false,
    });
    totalGross += amt;
    if (earning.taxable !== false) totalTaxable += amt;
  }

  const additionalDedResults = [];
  for (const ded of additional_deductions) {
    const amt = parseFloat(ded.amount) || 0;
    additionalDedResults.push({
      head_code: ded.code || 'ADD_DED',
      head_name: ded.name || 'Additional Deduction',
      transaction_type: 'DEDUCTION',
      irp5_code: ded.irp5_code || null,
      amount: amt,
      is_system: false,
    });
  }

  const annualGrossTaxable = totalTaxable * periodsPerYear;
  const allMockItems = [...results, ...additionalDedResults];
  const pensionDeductionForPAYE = calculatePensionDeduction(allMockItems, annualGrossTaxable, periodsPerYear);
  const annualTaxable = annualGrossTaxable - pensionDeductionForPAYE;
  const annualPAYE = calculatePAYE(annualTaxable, age, taxTables);
  const monthlyPAYE = parseFloat((annualPAYE / periodsPerYear).toFixed(2));

  const hasMedAid = medical_aid_members > 0;
  const medCredits = hasMedAid
    ? calculateMedicalCredits(medical_aid_members, taxTables, periodsPerYear)
    : 0;
  const finalPAYE = Math.max(0, parseFloat((monthlyPAYE - medCredits).toFixed(2)));

  results.push({
    head_code: 'PAYE',
    head_name: 'Pay As You Earn',
    transaction_type: 'DEDUCTION',
    irp5_code: '4101',
    amount: finalPAYE,
    is_system: true,
    detail: { annual_gross_taxable: annualGrossTaxable, annual_pension_deduction: pensionDeductionForPAYE, annual_taxable: annualTaxable, annual_paye: annualPAYE, monthly_paye: monthlyPAYE, medical_credits: medCredits },
  });

  const uif = calculateUIF(totalGross, taxTables, false);
  results.push({
    head_code: 'UIF_EE',
    head_name: 'UIF Employee',
    transaction_type: 'DEDUCTION',
    irp5_code: '4141',
    amount: uif.employee,
    is_system: true,
  });
  results.push({
    head_code: 'UIF_ER',
    head_name: 'UIF Employer',
    transaction_type: 'COMPANY_CONTRIBUTION',
    amount: uif.employer,
    is_system: true,
  });

  const sdlAmt = calculateSDL([...results, ...additionalDedResults], [], taxTables, periodsPerYear, false);
  results.push({
    head_code: 'SDL',
    head_name: 'Skills Development Levy',
    transaction_type: 'COMPANY_CONTRIBUTION',
    amount: sdlAmt,
    is_system: true,
  });

  results.push(...additionalDedResults);

  const earnings = results.filter(r => r.transaction_type === 'EARNING').reduce((s, r) => s + r.amount, 0);
  const deductions = results.filter(r => r.transaction_type === 'DEDUCTION').reduce((s, r) => s + r.amount, 0);
  const company = results.filter(r => r.transaction_type === 'COMPANY_CONTRIBUTION').reduce((s, r) => s + r.amount, 0);

  return {
    results,
    summary: {
      gross_earnings: parseFloat(earnings.toFixed(2)),
      total_deductions: parseFloat(deductions.toFixed(2)),
      nett_pay: parseFloat((earnings - deductions).toFixed(2)),
      company_contributions: parseFloat(company.toFixed(2)),
      total_cost_to_company: parseFloat((earnings + company).toFixed(2)),
      paye: finalPAYE,
      uif_employee: uif.employee,
      uif_employer: uif.employer,
      sdl: sdlAmt,
      medical_credits: medCredits,
      taxable_income: totalTaxable,
      annual_taxable: annualTaxable,
    },
  };
}

function calculateETI(age, monthlyRemuneration, monthsEmployed) {
  if (age < 18 || age > 29) return 0;
  if (monthlyRemuneration > 6500) return 0;
  if (monthlyRemuneration <= 0) return 0;
  if (monthsEmployed < 0) return 0;

  const minWage = 2000;
  let eti = 0;

  if (monthsEmployed <= 12) {
    if (monthlyRemuneration < minWage) {
      eti = monthlyRemuneration * 0.5;
    } else {
      eti = Math.max(0, 1000 - (0.5 * (monthlyRemuneration - minWage)));
    }
    eti = Math.min(eti, 1000);
  } else if (monthsEmployed <= 24) {
    if (monthlyRemuneration < minWage) {
      eti = monthlyRemuneration * 0.25;
    } else {
      eti = Math.max(0, 500 - (0.25 * (monthlyRemuneration - minWage)));
    }
    eti = Math.min(eti, 500);
  } else {
    return 0;
  }

  return parseFloat(Math.max(0, eti).toFixed(2));
}

function normalizeTransactionsToMonthly(transactions, periodsPerYear, employee) {
  const systemCalcCodes = new Set(['MED_EE', 'MED_ER', 'MED_FRINGE', 'PEN_EE', 'PEN_ER', 'PEN_FRINGE',
    'MED_AID_EE', 'MED_AID_ER', 'PENSION_EE', 'PENSION_ER', 'PENSION_FRINGE',
    'UIF_EE', 'UIF_ER', 'SDL', 'PAYE', 'UNION_FEES']);

  const basicTx = transactions.find(t => isBasicCode(t.head_code || t.code));
  if (basicTx) {
    const monthlySal = employee ? (parseFloat(employee.monthly_salary) || 0) : 0;
    const annualSal = employee ? (parseFloat(employee.annual_salary) || 0) : 0;
    basicTx.amount = monthlySal > 0 ? monthlySal : parseFloat((annualSal / periodsPerYear).toFixed(2));
    basicTx.calculation_method = null;
  }

  for (const tx of transactions) {
    if (systemCalcCodes.has(tx.head_code || tx.code) || isBasicCode(tx.head_code || tx.code)) continue;
    if (tx.is_wage_transaction) continue;
    if (tx.is_payslip_transaction) continue;
    const method = (tx.calculation_method || '').toUpperCase();
    if (method === 'FORMULA' || method === 'PERCENTAGE_OF_BASIC' || method === 'SYSTEM_CALCULATE') continue;
    tx.calculation_method = null;
  }

  return transactions;
}

module.exports = { calculateForEmployee, calculateMock, loadTaxTables, calculatePAYE, calculateUIF, calculateSDL, calculateMedicalCredits, getAge, calculateETI, resolveTaxYear, resolveMonthlyBasic, resolveEmployeeSalaryStructure, getEmployeeMedicalAidInfo, getEmployeeRetirementFundInfo, getEmployeeUnionInfo, calculatePayslipForEmployee, normalizeTransactionsToMonthly, evaluateFormulaV2, buildFormulaVariables, resolveMOCRule, loadMOCRules, applyMOCRounding };
