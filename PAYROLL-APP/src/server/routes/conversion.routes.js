const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const { authenticate } = require('../middleware/auth');
const { query: dbQuery, getClient } = require('../config/database');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

function excelDateToISO(serial) {
  if (!serial || serial === 'NULL') return null;
  if (typeof serial === 'string') return serial;
  if (serial === 2958465) return '9999-12-31';
  if (serial <= 365) return null;
  const utcDays = Math.floor(serial - 25569);
  const d = new Date(utcDays * 86400 * 1000);
  return d.toISOString().split('T')[0];
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function parseProcessingMonth(val) {
  if (val == null || val === '' || val === 'NULL') return null;
  if (typeof val === 'number' && val > 100) {
    const utcDays = Math.floor(val - 25569);
    const d = new Date(utcDays * 86400 * 1000);
    return MONTH_NAMES[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
  }
  return String(val);
}

const converters = {
  'medical-aid-schemes': {
    name: 'Medical Aid Schemes',
    description: 'Medical aid scheme plans with contribution details (header + detail merge)',
    targetTable: 'medical_aid_schemes',
    requiredTabs: ['Const_MedicalAidScheme', 'Const_MedicalAidSchemeDetail'],
    category: 'config',

    async preview(workbook) {
      const headerSheet = workbook.Sheets['Const_MedicalAidScheme'];
      const detailSheet = workbook.Sheets['Const_MedicalAidSchemeDetail'];
      if (!headerSheet || !detailSheet) {
        return { valid: false, error: 'Excel must contain tabs: Const_MedicalAidScheme and Const_MedicalAidSchemeDetail' };
      }
      const headers = XLSX.utils.sheet_to_json(headerSheet);
      const details = XLSX.utils.sheet_to_json(detailSheet);
      const detailMap = {};
      for (const d of details) { detailMap[d.MedicalSchemeID] = d; }

      const warnings = [];
      const rows = [];
      for (const h of headers) {
        const detail = detailMap[h.MedicalScheme_ID];
        if (!detail) {
          warnings.push(`Scheme ID ${h.MedicalScheme_ID} (${h.FundName}) has no detail row — will import with default values`);
        }
        rows.push({
          id: h.MedicalScheme_ID,
          code: h.MedicalSchemeDesc,
          name: h.MedicalSchemeDesc,
          scheme_type: h.FundName,
          employer_contribution_percentage: h.EmployerContributionValue || 0,
          employee_contribution_percentage: h.EmployeeContributionValue || 0,
          max_employer_contribution: h.EmployerMaxContributorValue || 0,
          vendor_id: h.VendorID,
          start_date: excelDateToISO(h.StartDate),
          end_date: excelDateToISO(h.EndDate),
          enabled: h.Enabled === 1,
          main_member_contribution: detail ? detail.MemberAmount : 0,
          adult_dependant_contribution: detail ? detail.AdultAmount : 0,
          child_dependant_contribution: detail ? detail.ChildAmount : 0,
          max_dependants: detail ? detail.MaxDependantCount : 0,
          min_monthly_income: detail ? detail.MonthlyMinAmount : 0,
          max_monthly_income: detail ? detail.MonthlyMaxAmount : 99999999,
          max_child_dependants_only: detail ? detail.IsMaxDependantChildEnabled === 1 : false,
          student_dependent: detail ? detail.Student === 1 : false,
          disabled_dependent: detail ? detail.Disabled === 1 : false,
        });
      }

      return {
        valid: true,
        totalRows: rows.length,
        tabs: { Const_MedicalAidScheme: headers.length, Const_MedicalAidSchemeDetail: details.length },
        warnings,
        sampleRows: rows.slice(0, 5),
        columnMapping: {
          'MedicalScheme_ID → id': 'Preserves original SQL Server ID',
          'MedicalSchemeDesc → code, name': 'Scheme name (e.g. Bonitas)',
          'FundName → scheme_type': 'Plan name (e.g. BonStart)',
          'EmployerContributionValue → employer_contribution_percentage': 'Employer % share',
          'EmployeeContributionValue → employer_contribution': 'Employee contribution percentage value',
          'EmployerMaxContributorValue → max_employer_contribution': 'Max employer contribution amount',
          'VendorID → vendor_id': 'EMS vendor reference',
          'Detail.MemberAmount → main_member_contribution': 'Monthly member amount',
          'Detail.AdultAmount → adult_dependant_contribution': 'Monthly adult dependant amount',
          'Detail.ChildAmount → child_dependant_contribution': 'Monthly child dependant amount',
          'Detail.MaxDependantCount → max_dependants': 'Max dependants allowed',
          'Detail.MonthlyMinAmount → min_monthly_income': 'Min income for this plan',
          'Detail.MonthlyMaxAmount → max_monthly_income': 'Max income for this plan',
        },
        _rows: rows
      };
    },

    async execute(workbook, userId, fileName) {
      const previewResult = await this.preview(workbook);
      if (!previewResult.valid) throw new Error(previewResult.error);

      const rows = previewResult._rows;
      const client = await getClient();
      let inserted = 0;
      const skipped = [];

      try {
        await client.query('BEGIN');
        await client.query('DELETE FROM medical_aid_scheme_history');
        await client.query('DELETE FROM employee_medical_aid_dependants');
        await client.query('DELETE FROM employee_medical_aid_extra_transactions');
        await client.query('DELETE FROM employee_medical_aid');
        await client.query('DELETE FROM medical_aid_schemes');

        for (const r of rows) {
          await client.query('SAVEPOINT row_sp');
          try {
            await client.query(
              `INSERT INTO medical_aid_schemes (id, code, name, scheme_type, contribution_plan, employer_contribution, employer_contribution_percentage,
                max_employer_contribution, vendor_id, main_member_contribution, adult_dependant_contribution,
                child_dependant_contribution, max_dependants, min_monthly_income, max_monthly_income,
                max_child_dependants_only, student_dependent, disabled_dependent, enabled, start_date, end_date, created_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,NOW())`,
              [
                r.id, r.code, r.name, r.scheme_type, r.scheme_type, r.employee_contribution_percentage,
                r.employer_contribution_percentage, r.max_employer_contribution, r.vendor_id,
                r.main_member_contribution, r.adult_dependant_contribution, r.child_dependant_contribution,
                r.max_dependants, r.min_monthly_income, r.max_monthly_income,
                r.max_child_dependants_only, r.student_dependent, r.disabled_dependent,
                r.enabled, r.start_date || '2025-07-01', r.end_date || '9999-12-31'
              ]
            );
            await client.query('RELEASE SAVEPOINT row_sp');
            inserted++;
          } catch (err) {
            await client.query('ROLLBACK TO SAVEPOINT row_sp');
            skipped.push({ id: r.id, name: `${r.code} - ${r.scheme_type}`, reason: err.message });
          }
        }

        if (inserted > 0) {
          await client.query(`SELECT setval('medical_aid_schemes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM medical_aid_schemes))`);
        }

        await client.query(
          `INSERT INTO conversion_logs (conversion_type, file_name, status, total_rows, inserted_rows, skipped_rows, error_message, details, created_by, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
          ['medical-aid-schemes', fileName || 'upload', inserted > 0 ? 'success' : 'failed', rows.length, inserted, skipped.length,
           skipped.length > 0 ? JSON.stringify(skipped) : null, JSON.stringify({ warnings: previewResult.warnings }), userId]
        );

        await client.query('COMMIT');
        return { success: inserted > 0, inserted, skipped, total: rows.length, warnings: previewResult.warnings };
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }
  },

  'trade-unions': {
    name: 'Trade Unions',
    description: 'Trade union representatives with contribution rules',
    targetTable: 'trade_unions',
    requiredTabs: null,
    category: 'config',

    async preview(workbook) {
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);
      if (!data.length || !data[0].UnionRepresentatives_ID) {
        return { valid: false, error: 'Expected column: UnionRepresentatives_ID' };
      }
      const rows = data.map(r => ({
        id: r.UnionRepresentatives_ID,
        representative: r.UnionRepresentatives,
        vendor_id: r.VendorID,
        contribution_type: r.ContributionType === 1 ? '%' : 'Fixed',
        contribution_value: r.ContributionValue,
        maximum_value: r.ContributionMaxValue,
        enabled: r.Enabled === 1
      }));
      return {
        valid: true, totalRows: rows.length,
        tabs: { [workbook.SheetNames[0]]: data.length },
        warnings: [],
        sampleRows: rows.slice(0, 5),
        columnMapping: {
          'UnionRepresentatives_ID → id': 'Original ID',
          'UnionRepresentatives → representative': 'Name',
          'VendorID → vendor_id': 'EMS vendor reference',
          'ContributionType → contribution_type': '1=%, 0=Fixed',
          'ContributionValue → contribution_value': 'Amount or percentage',
          'ContributionMaxValue → maximum_value': 'Maximum cap'
        },
        _rows: rows
      };
    },

    async execute(workbook, userId, fileName) {
      const previewResult = await this.preview(workbook);
      if (!previewResult.valid) throw new Error(previewResult.error);
      const rows = previewResult._rows;
      const client = await getClient();
      let inserted = 0;
      const skipped = [];
      try {
        await client.query('BEGIN');
        await client.query('DELETE FROM trade_unions');
        for (const r of rows) {
          await client.query('SAVEPOINT row_sp');
          try {
            await client.query(
              `INSERT INTO trade_unions (id, representative, vendor_id, contribution_type, contribution_value, maximum_value, enabled, created_at, updated_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())`,
              [r.id, r.representative, r.vendor_id, r.contribution_type, r.contribution_value, r.maximum_value, r.enabled]
            );
            await client.query('RELEASE SAVEPOINT row_sp');
            inserted++;
          } catch (err) { await client.query('ROLLBACK TO SAVEPOINT row_sp'); skipped.push({ id: r.id, name: r.representative, reason: err.message }); }
        }
        if (inserted > 0) await client.query(`SELECT setval('trade_unions_id_seq', (SELECT COALESCE(MAX(id), 1) FROM trade_unions))`);
        await client.query(
          `INSERT INTO conversion_logs (conversion_type, file_name, status, total_rows, inserted_rows, skipped_rows, error_message, created_by, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
          ['trade-unions', fileName || 'upload', inserted > 0 ? 'success' : 'failed', rows.length, inserted, skipped.length,
           skipped.length > 0 ? JSON.stringify(skipped) : null, userId]
        );
        await client.query('COMMIT');
        return { success: inserted > 0, inserted, skipped, total: rows.length, warnings: [] };
      } catch (err) { await client.query('ROLLBACK'); throw err; } finally { client.release(); }
    }
  },

  'task-grades': {
    name: 'Task Grades & Notches',
    description: 'SALGA task grades with salary notches',
    targetTable: 'task_grades',
    requiredTabs: ['TaskGrade', 'Notch'],
    category: 'config',

    async preview(workbook) {
      const gradeSheet = workbook.Sheets['TaskGrade'];
      const notchSheet = workbook.Sheets['Notch'];
      if (!gradeSheet || !notchSheet) {
        return { valid: false, error: 'Excel must contain tabs: TaskGrade and Notch' };
      }
      const grades = XLSX.utils.sheet_to_json(gradeSheet);
      const notches = XLSX.utils.sheet_to_json(notchSheet);
      return {
        valid: true, totalRows: grades.length + notches.length,
        tabs: { TaskGrade: grades.length, Notch: notches.length },
        warnings: [],
        sampleRows: grades.slice(0, 3).map(g => ({ id: g.TaskGrade_ID, name: g.TaskGradeName, min: g.MinSalary, max: g.MaxSalary })),
        columnMapping: {
          'TaskGrade_ID → id': 'Original grade ID',
          'TaskGradeName → grade_name': 'Grade name',
          'Notch_ID → id (notches)': 'Original notch ID',
          'Notch → notch_number': 'Notch number within grade'
        },
        _grades: grades,
        _notches: notches
      };
    },

    async execute(workbook, userId, fileName) {
      const previewResult = await this.preview(workbook);
      if (!previewResult.valid) throw new Error(previewResult.error);
      const grades = previewResult._grades;
      const notches = previewResult._notches;
      const newGradeIds = new Set(grades.map(g => g.TaskGrade_ID));

      const client = await getClient();
      let inserted = 0;
      const skipped = [];
      try {
        await client.query('BEGIN');

        const empSnap = await client.query('SELECT id, task_grade_id, current_notch FROM employees WHERE task_grade_id IS NOT NULL');
        const posSnap = await client.query('SELECT id, task_grade_id FROM positions WHERE task_grade_id IS NOT NULL');
        const jpSnap = await client.query('SELECT id, task_grade_id FROM job_profiles WHERE task_grade_id IS NOT NULL');
        const siSnap = await client.query('SELECT id, task_grade_id FROM salary_increases WHERE task_grade_id IS NOT NULL');

        await client.query('UPDATE employees SET task_grade_id = NULL WHERE task_grade_id IS NOT NULL');
        await client.query('UPDATE positions SET task_grade_id = NULL WHERE task_grade_id IS NOT NULL');
        await client.query('UPDATE job_profiles SET task_grade_id = NULL WHERE task_grade_id IS NOT NULL');
        await client.query('UPDATE salary_increases SET task_grade_id = NULL WHERE task_grade_id IS NOT NULL');

        await client.query('DELETE FROM task_grade_notch_history');
        await client.query('DELETE FROM task_grade_history');
        await client.query('DELETE FROM task_grade_notches');
        await client.query('DELETE FROM task_grades');

        for (const tg of grades) {
          const m = (tg.TaskGradeName || '').match(/Task Grade\s+(\d+)/i);
          const gradeCode = m ? 'T' + m[1] : (tg.TaskGradeName || '').replace(/\s+/g, '').substring(0, 10).toUpperCase();
          const notchCount = notches.filter(n => n.TaskGradeId === tg.TaskGrade_ID).length;
          await client.query('SAVEPOINT row_sp');
          try {
            await client.query(
              `INSERT INTO task_grades (id, grade_code, grade_name, min_salary, max_salary, notch_count, enabled,
               start_date, end_date, is_legacy, to_phase_out, task_skill_level_id, exclude_from_yearly_increase, created_at, updated_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW(),NOW())`,
              [tg.TaskGrade_ID, gradeCode, tg.TaskGradeName, tg.MinSalary, tg.MaxSalary, notchCount, true,
               excelDateToISO(tg.StartDate) || '2025-07-01', excelDateToISO(tg.EndDate) || '9999-12-31',
               tg.IsSalgacompliant === 1 ? false : true, tg.ToPhaseOut === 1, tg.SkillLevelId || null, tg.ExcludeFromIncrease === 1]
            );
            await client.query('RELEASE SAVEPOINT row_sp');
            inserted++;
          } catch (err) { await client.query('ROLLBACK TO SAVEPOINT row_sp'); skipped.push({ id: tg.TaskGrade_ID, name: tg.TaskGradeName, reason: err.message }); }
        }

        let notchInserted = 0;
        for (const n of notches) {
          await client.query('SAVEPOINT row_sp');
          try {
            await client.query(
              `INSERT INTO task_grade_notches (id, task_grade_id, notch_number, min_salary, max_salary, start_date, end_date, created_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
              [n.Notch_ID, n.TaskGradeId, n.Notch, n.MinimumSalary, n.MaximumSalary,
               excelDateToISO(n.StartDate) || '2025-07-01', excelDateToISO(n.EndDate) || '9999-12-31']
            );
            await client.query('RELEASE SAVEPOINT row_sp');
            notchInserted++;
          } catch (err) { await client.query('ROLLBACK TO SAVEPOINT row_sp'); skipped.push({ id: n.Notch_ID, name: `Notch ${n.Notch} (Grade ${n.TaskGradeId})`, reason: err.message }); }
        }

        if (grades.length > 0) await client.query(`SELECT setval('task_grades_id_seq', $1)`, [Math.max(...grades.map(t => t.TaskGrade_ID))]);
        if (notches.length > 0) await client.query(`SELECT setval('task_grade_notches_id_seq', $1)`, [Math.max(...notches.map(n => n.Notch_ID))]);

        for (const row of empSnap.rows) {
          if (newGradeIds.has(row.task_grade_id)) {
            await client.query('UPDATE employees SET task_grade_id = $1 WHERE id = $2', [row.task_grade_id, row.id]);
          }
        }
        for (const row of posSnap.rows) {
          if (newGradeIds.has(row.task_grade_id)) {
            await client.query('UPDATE positions SET task_grade_id = $1 WHERE id = $2', [row.task_grade_id, row.id]);
          }
        }
        for (const row of jpSnap.rows) {
          if (newGradeIds.has(row.task_grade_id)) {
            await client.query('UPDATE job_profiles SET task_grade_id = $1 WHERE id = $2', [row.task_grade_id, row.id]);
          }
        }
        for (const row of siSnap.rows) {
          if (newGradeIds.has(row.task_grade_id)) {
            await client.query('UPDATE salary_increases SET task_grade_id = $1 WHERE id = $2', [row.task_grade_id, row.id]);
          }
        }

        await client.query(
          `INSERT INTO conversion_logs (conversion_type, file_name, status, total_rows, inserted_rows, skipped_rows, error_message, details, created_by, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
          ['task-grades', fileName || 'upload', inserted > 0 ? 'success' : 'failed', grades.length + notches.length, inserted + notchInserted, skipped.length,
           skipped.length > 0 ? JSON.stringify(skipped) : null,
           JSON.stringify({ grades: inserted, notches: notchInserted }), userId]
        );

        await client.query('COMMIT');
        return { success: inserted > 0, inserted: inserted + notchInserted, skipped, total: grades.length + notches.length, warnings: [`${inserted} grades, ${notchInserted} notches imported`] };
      } catch (err) { await client.query('ROLLBACK'); throw err; } finally { client.release(); }
    }
  },

  'benefit-funds': {
    name: 'Benefit Funds (Retirement)',
    description: 'Pension, provident and retirement annuity fund configurations',
    targetTable: 'retirement_fund_types',
    requiredTabs: ['Sheet1'],
    category: 'config',

    async preview(workbook) {
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) return { valid: false, error: 'No sheet found in workbook' };
      const data = XLSX.utils.sheet_to_json(sheet);
      if (!data.length || !data[0].Benefit_ID) {
        return { valid: false, error: 'Sheet must contain Benefit_ID column. Expected columns: Benefit_ID, BenefitTypeID, VendorID, FundName, ContributionType, etc.' };
      }

      const benefitTypeMap = { 3: 'PENSION', 4: 'PROVIDENT', 5: 'RETIREMENT_ANNUITY' };
      const contributionTypeMap = { 1: 'PERCENTAGE', 0: 'FIXED' };
      const fundSubTypeMap = { 1: 'Defined Contribution Fund', 2: 'Defined Benefit Fund', 3: 'Hybrid Fund' };
      const warnings = [];

      const rows = data.map(r => {
        const fundType = benefitTypeMap[r.BenefitTypeID];
        if (!fundType) warnings.push(`Benefit_ID ${r.Benefit_ID} (${r.FundName}): unknown BenefitTypeID ${r.BenefitTypeID}, defaulting to PENSION`);
        const contribType = contributionTypeMap[r.ContributionType];
        if (contribType === undefined) warnings.push(`Benefit_ID ${r.Benefit_ID} (${r.FundName}): unknown ContributionType ${r.ContributionType}, defaulting to PERCENTAGE`);
        const fundSubType = fundSubTypeMap[r.RetirementFundTypeID] || null;

        const code = (r.FundName || '').replace(/\s+/g, '_').substring(0, 50).toUpperCase();
        return {
          id: r.Benefit_ID,
          code,
          name: r.FundName,
          plan_name: r.FundName,
          fund_type: fundType || 'PENSION',
          fund_sub_type: fundSubType,
          vendor_id: r.VendorID,
          clearance_no: r.ClearanceNo ? String(r.ClearanceNo) : null,
          employer_contribution_type: contribType || 'PERCENTAGE',
          employee_contribution_value: r.EmpContributionValue || 0,
          employee_max_value: r.EmpContributionMaxValue || 0,
          employer_contribution_value: r.EmplrContributionValue || 0,
          employer_max_value: r.EmplrContributionMaxValue || 0,
          employee_contribution_rate: contribType === 'PERCENTAGE' ? (r.EmpContributionValue || 0) : 0,
          employer_contribution_rate: contribType === 'PERCENTAGE' ? (r.EmplrContributionValue || 0) : 0,
          fund_category_factor: r.FundMemberCategoryFactors || 0,
          employee_pro_rata: r.ProRata === 1,
          enabled: r.Enabled === 1,
          start_date: excelDateToISO(r.StartDate),
          end_date: excelDateToISO(r.EndDate),
        };
      });

      return {
        valid: true,
        totalRows: rows.length,
        tabs: { [workbook.SheetNames[0]]: data.length },
        warnings,
        sampleRows: rows.slice(0, 5),
        columnMapping: {
          'Benefit_ID → id': 'Preserves original SQL Server ID',
          'FundName → name, plan_name, code': 'Fund name and generated code',
          'BenefitTypeID → fund_type': '3=PENSION, 4=PROVIDENT, 5=RETIREMENT_ANNUITY',
          'RetirementFundTypeID → fund_sub_type': '1=Defined Contribution Fund, 2=Defined Benefit Fund, 3=Hybrid Fund',
          'VendorID → vendor_id': 'EMS vendor reference',
          'ClearanceNo → clearance_no': 'Fund clearance number',
          'ContributionType → employer_contribution_type': '1=PERCENTAGE, 0=FIXED',
          'EmpContributionValue → employee_contribution_value/rate': 'Employee contribution (% or fixed amount)',
          'EmpContributionMaxValue → employee_max_value': 'Employee max contribution cap',
          'EmplrContributionValue → employer_contribution_value/rate': 'Employer contribution (% or fixed amount)',
          'EmplrContributionMaxValue → employer_max_value': 'Employer max contribution cap',
          'FundMemberCategoryFactors → fund_category_factor': 'Member category factor',
          'ProRata → employee_pro_rata': 'Pro-rata calculation flag',
        },
        _rows: rows
      };
    },

    async execute(workbook, userId, fileName) {
      const previewResult = await this.preview(workbook);
      if (!previewResult.valid) throw new Error(previewResult.error);
      const rows = previewResult._rows;
      const client = await getClient();
      let inserted = 0;
      const skipped = [];
      try {
        await client.query('BEGIN');
        const empSnap = await client.query('SELECT id, fund_type_id FROM employee_retirement_funds');
        const salaryHeadSnap = await client.query('SELECT retirement_fund_type_id FROM retirement_fund_salary_heads');
        const newIds = new Set(rows.map(r => r.id));
        await client.query('DELETE FROM retirement_fund_salary_heads');
        await client.query('DELETE FROM employee_retirement_funds');
        await client.query('DELETE FROM retirement_fund_types');

        for (const r of rows) {
          await client.query('SAVEPOINT row_sp');
          try {
            await client.query(
              `INSERT INTO retirement_fund_types (id, code, name, plan_name, fund_type, fund_sub_type, vendor_id, clearance_no,
                employer_contribution_type, employee_contribution_value, employee_max_value,
                employer_contribution_value, employer_max_value, employee_contribution_rate, employer_contribution_rate,
                fund_category_factor, employee_pro_rata, enabled, start_date, end_date, created_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,NOW())`,
              [
                r.id, r.code, r.name, r.plan_name, r.fund_type, r.fund_sub_type, r.vendor_id, r.clearance_no,
                r.employer_contribution_type, r.employee_contribution_value, r.employee_max_value,
                r.employer_contribution_value, r.employer_max_value, r.employee_contribution_rate, r.employer_contribution_rate,
                r.fund_category_factor, r.employee_pro_rata, r.enabled,
                r.start_date || '2025-07-01', r.end_date || '9999-12-31'
              ]
            );
            await client.query('RELEASE SAVEPOINT row_sp');
            inserted++;
          } catch (err) { await client.query('ROLLBACK TO SAVEPOINT row_sp'); skipped.push({ id: r.id, name: r.name, reason: err.message }); }
        }

        for (const row of empSnap.rows) {
          if (newIds.has(row.fund_type_id)) {
            await client.query('UPDATE employee_retirement_funds SET fund_type_id = $1 WHERE id = $2', [row.fund_type_id, row.id]);
          }
        }

        if (inserted > 0) await client.query(`SELECT setval('retirement_fund_types_id_seq', (SELECT COALESCE(MAX(id), 1) FROM retirement_fund_types))`);
        await client.query(
          `INSERT INTO conversion_logs (conversion_type, file_name, status, total_rows, inserted_rows, skipped_rows, error_message, created_by, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
          ['benefit-funds', fileName || 'upload', inserted > 0 ? 'success' : 'failed', rows.length, inserted, skipped.length,
           skipped.length > 0 ? JSON.stringify(skipped) : null, userId]
        );
        await client.query('COMMIT');
        return { success: inserted > 0, inserted, skipped, total: rows.length, warnings: previewResult.warnings };
      } catch (err) { await client.query('ROLLBACK'); throw err; } finally { client.release(); }
    }
  },

  'departments': {
    name: 'Departments',
    description: 'Departments are now managed via the external SCOA API and cannot be imported locally.',
    targetTable: null,
    requiredTabs: ['Department'],
    category: 'config',

    async preview() {
      return { valid: false, error: 'Departments are now managed via the external SCOA API. Local import is no longer supported.' };
    },
    async execute() {
      return { success: false, inserted: 0, skipped: [], total: 0, warnings: ['Departments are managed externally — import not supported.'] };
    }
  },

  'departments_LEGACY': {
    name: 'Departments (Legacy)',
    description: 'Legacy — no longer used.',
    targetTable: null,
    requiredTabs: ['Department'],
    category: 'config',

    async preview(workbook) {
      const sheet = workbook.Sheets['Department'];
      if (!sheet) return { valid: false, error: 'Excel must contain a tab named "Department"' };
      const data = XLSX.utils.sheet_to_json(sheet);
      if (!data.length || !data[0].Department_ID) return { valid: false, error: 'Department tab must contain Department_ID column' };

      const rows = data.map(r => ({
        id: r.Department_ID, code: r.DepartmentCode || null, name: r.DepartmentDesc, enabled: r.Enabled === 1,
        start_date: excelDateToISO(r.StartDate), end_date: excelDateToISO(r.EndDate)
      }));

      return {
        valid: true,
        totalRows: rows.length,
        warnings: [],
        sampleRows: rows.slice(0, 5),
        columnMapping: {
          'Department_ID → departments.id': 'Department ID',
          'DepartmentDesc → departments.name': 'Department name',
          'DepartmentCode → departments.code': 'Short code (e.g. PD01)',
          'Enabled → departments.enabled': 'Active flag'
        },
        _rows: rows
      };
    },

    async execute(workbook, userId, fileName) {
      const previewResult = await this.preview(workbook);
      if (!previewResult.valid) throw new Error(previewResult.error);
      const rows = previewResult._rows;
      const client = await getClient();
      let inserted = 0, updated = 0;
      const skipped = [];

      try {
        await client.query('BEGIN');

        for (const r of rows) {
          await client.query('SAVEPOINT row_sp');
          try {
            const res = await client.query(
              `INSERT INTO departments (id, code, name, enabled, created_at, updated_at)
               VALUES ($1,$2,$3,$4,NOW(),NOW())
               ON CONFLICT (id) DO UPDATE SET code=EXCLUDED.code, name=EXCLUDED.name, enabled=EXCLUDED.enabled, updated_at=NOW()
               RETURNING (xmax = 0) AS is_insert`, [r.id, r.code, r.name, r.enabled]);
            await client.query('RELEASE SAVEPOINT row_sp');
            if (res.rows[0].is_insert) inserted++; else updated++;
          } catch (err) { await client.query('ROLLBACK TO SAVEPOINT row_sp'); skipped.push({ id: r.id, name: r.name, reason: err.message }); }
        }

        if ((inserted + updated) > 0) await client.query(`SELECT setval('departments_id_seq', (SELECT COALESCE(MAX(id), 1) FROM departments))`);

        await client.query(
          `INSERT INTO conversion_logs (conversion_type, file_name, status, total_rows, inserted_rows, skipped_rows, error_message, details, created_by, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
          ['departments', fileName || 'upload', (inserted + updated) > 0 ? 'success' : 'failed',
           rows.length, inserted + updated, skipped.length,
           skipped.length > 0 ? JSON.stringify(skipped) : null,
           JSON.stringify({ inserted, updated }), userId]
        );
        await client.query('COMMIT');
        return { success: (inserted + updated) > 0, inserted: inserted + updated, skipped, total: rows.length,
          warnings: [`${inserted} departments inserted, ${updated} updated`, ...previewResult.warnings] };
      } catch (err) { await client.query('ROLLBACK'); throw err; } finally { client.release(); }
    }
  },

  'divisions': {
    name: 'Divisions',
    description: 'Divisions are now managed via the external SCOA API and cannot be imported locally.',
    targetTable: null,
    requiredTabs: ['Division'],
    category: 'config',

    async preview() {
      return { valid: false, error: 'Divisions are now managed via the external SCOA API. Local import is no longer supported.' };
    },
    async execute() {
      return { success: false, inserted: 0, skipped: [], total: 0, warnings: ['Divisions are managed externally — import not supported.'] };
    }
  },

  'divisions_LEGACY': {
    name: 'Divisions (Legacy)',
    description: 'Legacy — no longer used.',
    targetTable: 'divisions',
    requiredTabs: ['Division'],
    category: 'config',

    async preview(workbook) {
      const sheet = workbook.Sheets['Division'];
      if (!sheet) return { valid: false, error: 'Excel must contain a tab named "Division"' };
      const data = XLSX.utils.sheet_to_json(sheet);
      if (!data.length || !data[0].Division_ID) return { valid: false, error: 'Division tab must contain Division_ID column' };

      const rows = data.map(r => ({
        id: r.Division_ID, code: r.DivisionCode || null, name: r.DivisionDesc,
        department_id: r.DepartmentID,
        parent_id: r.DivisionParentID && r.DivisionParentID !== 'NULL' ? r.DivisionParentID : null,
        scoa_function_id: r.SCOAFunctionID && r.SCOAFunctionID !== 'NULL' ? String(r.SCOAFunctionID) : null,
        enabled: r.Enabled === 1
      }));

      const warnings = [];
      const divIds = new Set(rows.map(r => r.id));
      for (const r of rows) {
        if (r.parent_id && !divIds.has(r.parent_id)) warnings.push(`Division ${r.id} (${r.name}) references parent ${r.parent_id} not in file — parent will be NULL`);
      }

      return {
        valid: true,
        totalRows: rows.length,
        warnings,
        sampleRows: rows.slice(0, 5),
        columnMapping: {
          'Division_ID → divisions.id': 'Division ID',
          'DivisionDesc → divisions.name': 'Division name',
          'DivisionCode → divisions.code': 'mSCOA coding',
          'DepartmentID → divisions.department_id': 'FK to departments',
          'DivisionParentID → divisions.parent_id': 'Self-referencing parent',
          'SCOAFunctionID → divisions.scoa_function_id': 'mSCOA function reference'
        },
        _rows: rows
      };
    },

    async execute(workbook, userId, fileName) {
      const previewResult = await this.preview(workbook);
      if (!previewResult.valid) throw new Error(previewResult.error);
      const rows = previewResult._rows;
      const client = await getClient();
      let inserted = 0, updated = 0;
      const skipped = [];

      try {
        await client.query('BEGIN');

        const deptCheck = await client.query('SELECT count(*) FROM departments');
        if (parseInt(deptCheck.rows[0].count) === 0) throw new Error('No departments found — import departments first');

        for (const r of rows) {
          await client.query('SAVEPOINT row_sp');
          try {
            const res = await client.query(
              `INSERT INTO divisions (id, department_id, code, name, parent_id, scoa_function_id, enabled, created_at, updated_at)
               VALUES ($1,$2,$3,$4,NULL,$5,$6,NOW(),NOW())
               ON CONFLICT (id) DO UPDATE SET department_id=EXCLUDED.department_id, code=EXCLUDED.code, name=EXCLUDED.name, parent_id=NULL, scoa_function_id=EXCLUDED.scoa_function_id, enabled=EXCLUDED.enabled, updated_at=NOW()
               RETURNING (xmax = 0) AS is_insert`, [r.id, r.department_id, r.code, r.name, r.scoa_function_id, r.enabled]);
            await client.query('RELEASE SAVEPOINT row_sp');
            if (res.rows[0].is_insert) inserted++; else updated++;
          } catch (err) { await client.query('ROLLBACK TO SAVEPOINT row_sp'); skipped.push({ id: r.id, name: r.name, reason: err.message }); }
        }

        const processedDivIds = new Set();
        for (const r of rows) {
          if (!skipped.find(s => s.id === r.id)) processedDivIds.add(r.id);
        }
        let parentSet = 0;
        for (const r of rows) {
          if (r.parent_id && processedDivIds.has(r.parent_id)) {
            await client.query('SAVEPOINT parent_sp');
            try { await client.query('UPDATE divisions SET parent_id = $1 WHERE id = $2', [r.parent_id, r.id]); await client.query('RELEASE SAVEPOINT parent_sp'); parentSet++; }
            catch (e) { await client.query('ROLLBACK TO SAVEPOINT parent_sp'); }
          }
        }

        if ((inserted + updated) > 0) await client.query(`SELECT setval('divisions_id_seq', (SELECT COALESCE(MAX(id), 1) FROM divisions))`);

        await client.query(
          `INSERT INTO conversion_logs (conversion_type, file_name, status, total_rows, inserted_rows, skipped_rows, error_message, details, created_by, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
          ['divisions', fileName || 'upload', (inserted + updated) > 0 ? 'success' : 'failed',
           rows.length, inserted + updated, skipped.length,
           skipped.length > 0 ? JSON.stringify(skipped) : null,
           JSON.stringify({ inserted, updated, parentRelationships: parentSet }), userId]
        );
        await client.query('COMMIT');
        return { success: (inserted + updated) > 0, inserted: inserted + updated, skipped, total: rows.length,
          warnings: [`${inserted} divisions inserted, ${updated} updated, ${parentSet} parent relationships set`, ...previewResult.warnings] };
      } catch (err) { await client.query('ROLLBACK'); throw err; } finally { client.release(); }
    }
  },

  'conditions-of-service': {
    name: 'Conditions of Service',
    description: 'Employment conditions (bargaining councils, collective agreements)',
    targetTable: 'conditions_of_service',
    requiredTabs: null,
    category: 'config',

    async preview(workbook) {
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);
      if (!data.length || !data[0].ConditionOfService_ID) {
        return { valid: false, error: 'Expected column: ConditionOfService_ID' };
      }
      const rows = data.map(r => ({
        id: r.ConditionOfService_ID,
        code: r.Code || r.ConditionOfServiceDesc,
        name: r.ConditionOfServiceDesc,
        description: r.Description || null,
        enabled: r.Enabled === 1
      }));
      return {
        valid: true, totalRows: rows.length,
        tabs: { [workbook.SheetNames[0]]: data.length },
        warnings: [],
        sampleRows: rows.slice(0, 5),
        columnMapping: {
          'ConditionOfService_ID → id': 'Original ID',
          'ConditionOfServiceDesc → name': 'Condition name',
          'Code → code': 'Short code'
        },
        _rows: rows
      };
    },

    async execute(workbook, userId, fileName) {
      const previewResult = await this.preview(workbook);
      if (!previewResult.valid) throw new Error(previewResult.error);
      const rows = previewResult._rows;
      const client = await getClient();
      let inserted = 0;
      const skipped = [];
      try {
        await client.query('BEGIN');
        const empSnap = await client.query('SELECT id, condition_of_service_id FROM employees WHERE condition_of_service_id IS NOT NULL');
        const newIds = new Set(rows.map(r => r.id));
        await client.query('UPDATE employees SET condition_of_service_id = NULL WHERE condition_of_service_id IS NOT NULL');
        await client.query('DELETE FROM conditions_of_service');
        for (const r of rows) {
          await client.query('SAVEPOINT row_sp');
          try {
            await client.query(
              `INSERT INTO conditions_of_service (id, code, name, description, enabled, start_date, end_date, created_at)
               VALUES ($1,$2,$3,$4,$5,'2025-07-01','9999-12-31',NOW())`,
              [r.id, r.code, r.name, r.description, r.enabled]
            );
            await client.query('RELEASE SAVEPOINT row_sp');
            inserted++;
          } catch (err) { await client.query('ROLLBACK TO SAVEPOINT row_sp'); skipped.push({ id: r.id, name: r.name, reason: err.message }); }
        }
        for (const row of empSnap.rows) {
          if (newIds.has(row.condition_of_service_id)) {
            await client.query('UPDATE employees SET condition_of_service_id = $1 WHERE id = $2', [row.condition_of_service_id, row.id]);
          }
        }
        if (inserted > 0) await client.query(`SELECT setval('conditions_of_service_id_seq', (SELECT COALESCE(MAX(id), 1) FROM conditions_of_service))`);
        await client.query(
          `INSERT INTO conversion_logs (conversion_type, file_name, status, total_rows, inserted_rows, skipped_rows, error_message, created_by, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
          ['conditions-of-service', fileName || 'upload', inserted > 0 ? 'success' : 'failed', rows.length, inserted, skipped.length,
           skipped.length > 0 ? JSON.stringify(skipped) : null, userId]
        );
        await client.query('COMMIT');
        return { success: inserted > 0, inserted, skipped, total: rows.length, warnings: [] };
      } catch (err) { await client.query('ROLLBACK'); throw err; } finally { client.release(); }
    }
  },

  'job-profiles': {
    name: 'Job Profiles',
    description: 'Job profiles with OFO codes, task grade links, and job descriptions. Upload the JobProfiles_Positions_Employees Excel file — reads the Payroll_JobProfile tab.',
    targetTable: 'job_profiles',
    requiredTabs: ['Payroll_JobProfile'],
    category: 'hr',

    async preview(workbook) {
      const sheet = workbook.Sheets['Payroll_JobProfile'];
      if (!sheet) return { valid: false, error: 'Excel must contain a tab named "Payroll_JobProfile"' };
      const data = XLSX.utils.sheet_to_json(sheet);
      if (!data.length || !data[0].JobProfile_ID) return { valid: false, error: 'Payroll_JobProfile tab must contain JobProfile_ID column' };

      const n = v => (v === 'NULL' || v === null || v === undefined || v === 0) ? null : v;
      const rows = data.map(r => ({
        id: r.JobProfile_ID,
        job_title: r.JobTitle || r.Occupation || 'Untitled',
        ofo_code: n(r.OccupationOFOCODE) ? String(r.OccupationOFOCODE) : null,
        occupation: n(r.Occupation),
        task_grade_id: n(r.TaskGradeId),
        employee_type_id: n(r.EmployeeTypeID),
        employee_subtype_id: n(r.EmployeeSubtypeID),
        department_id: n(r.DepartmentID),
        division_id: n(r.DivisionID),
        job_purpose: n(r.JobPurpose),
        job_responsibility: n(r.JobResponsibility),
        reports_to_description: n(r.ToWomDoesThisPositionReport),
        who_reports_to_position: n(r.WhoReportsToThisPosition),
        who_are_peers: n(r.WhoArePeersInThisUnit),
        qualifications_required: n(r.QualificationsRequiedForThisPosition),
        experience_required: n(r.ExperienceRequiredForThisPosition),
        knowledge: n(r.Knowledge),
        skills: n(r.Skills),
        liaison_internal: n(r.LiaiseWithInternal),
        internal_communication_purpose: n(r.InternalCommunicationPurpose),
        liaison_external: n(r.LiaiseWithExternal),
        external_communication_purpose: n(r.ExternalCommunicationPurpose),
        can_draft_policies: r.CanThisPositionDraftChangePolicies === 1,
        description: n(r.Description),
        contractual_agreements: r.ContractualAgreements === 1,
        expenditure: r.Expenditure === 1,
        problem_solving: n(r.ProblemSolvingJobThinkingChallanges),
        financial: n(r.Financial),
        planning: n(r.Planning),
        short_term: n(r.ShortTerm),
        med_term: n(r.MedTerm),
        long_term: n(r.LongTerm),
        amount: n(r.Amount),
        can_escalate: r.CanEscalate === 1,
        can_approve: r.CanApprove === 1,
        core_function: r.CoreFunction === 1,
        no_of_positions: n(r.NoOfPosition),
        office_bound: r.OfficeBound === 1,
        shift_id: n(r.ShiftID),
        allow_overtime: r.AllowOverTime === 1,
        recommended_contractor_rate: n(r.RecommendedContractorRate),
        scoa_costing_percentage: n(r.PercentageForCostingAllocationToSCOAFunction),
        start_date: excelDateToISO(r.StartDate),
        end_date: excelDateToISO(r.EndDate),
        parent_id: n(r.ParentID),
        status: n(r.Status),
        job_description_code: n(r.JobDescriptionCode),
        upper_limit_id: n(r.LimitID),
        upper_limit_type: 'maximum',
        performance_assessment: r.IsPerformanceAssessement === 1,
        is_active: r.ISActive === 1,
        enabled: r.Enabled === 1,
        ofo_major_group_id: n(r.MajorGroupID),
        ofo_sub_major_group_id: n(r.SubMajorGroupID),
        ofo_minor_group_id: n(r.MinorGroupID),
        ofo_unit_group_id: n(r.UnitGroupID),
        ofo_occupation_id: n(r.OccupationsID),
        specialist_id: n(r.SpecialistID),
        employment_category_id: n(r.EmploymentCategoryID),
        employment_code_id: n(r.EmploymentCodeID),
        work_area_id: n(r.WorkAreaID),
        salary_transaction_group_id: n(r.PayrollDefinitionGroupID),
        job_family_id: null
      }));

      return {
        valid: true,
        totalRows: rows.length,
        warnings: [],
        sampleRows: rows.slice(0, 5).map(r => ({ id: r.id, job_title: r.job_title, ofo_code: r.ofo_code, task_grade_id: r.task_grade_id, enabled: r.enabled })),
        columnMapping: {
          'JobProfile_ID → job_profiles.id': 'Job Profile ID',
          'JobTitle → job_title': 'Job title',
          'OccupationOFOCODE → ofo_code': 'OFO code',
          'Occupation → occupation': 'Occupation description',
          'TaskGradeId → task_grade_id': 'FK to task_grades',
          'EmployeeTypeID → employee_type_id': 'Employee type',
          'JobPurpose → job_purpose': 'Job purpose text',
          'JobResponsibility → job_responsibility': 'Responsibilities text'
        },
        _rows: rows
      };
    },

    async execute(workbook, userId, fileName) {
      const previewResult = await this.preview(workbook);
      if (!previewResult.valid) throw new Error(previewResult.error);
      const rows = previewResult._rows;
      const client = await getClient();
      let inserted = 0, updated = 0;
      const skipped = [];

      try {
        await client.query('BEGIN');

        const validEmpTypes = new Set((await client.query('SELECT id FROM employee_types')).rows.map(r => r.id));
        const validEmpSubTypes = new Set((await client.query('SELECT id FROM employee_subtypes')).rows.map(r => r.id));
        const validStgs = new Set((await client.query('SELECT id FROM salary_transaction_groups')).rows.map(r => r.id));
        const validULs = new Set((await client.query('SELECT id FROM salary_upper_limits')).rows.map(r => r.id));
        const { getDepartments, getDivisions } = require('./department.routes');
        const validDepts = new Set((await getDepartments()).map(r => r.id));
        const validDivs = new Set((await getDivisions()).map(r => r.id));
        const validTGs = new Set((await client.query('SELECT id FROM task_grades')).rows.map(r => r.id));

        for (const r of rows) {
          if (r.employee_type_id && !validEmpTypes.has(r.employee_type_id)) r.employee_type_id = null;
          if (r.employee_subtype_id && !validEmpSubTypes.has(r.employee_subtype_id)) r.employee_subtype_id = null;
          if (r.salary_transaction_group_id && !validStgs.has(r.salary_transaction_group_id)) r.salary_transaction_group_id = null;
          if (r.upper_limit_id && !validULs.has(r.upper_limit_id)) r.upper_limit_id = null;
          if (r.department_id && !validDepts.has(r.department_id)) r.department_id = null;
          if (r.division_id && !validDivs.has(r.division_id)) r.division_id = null;
          if (r.task_grade_id && !validTGs.has(r.task_grade_id)) r.task_grade_id = null;
        }

        for (const r of rows) {
          await client.query('SAVEPOINT row_sp');
          try {
            const res = await client.query(
              `INSERT INTO job_profiles (id, job_title, ofo_code, occupation, task_grade_id, employee_type_id, employee_subtype_id,
                department_id, division_id, job_purpose, job_responsibility, reports_to_description, who_reports_to_position,
                who_are_peers, qualifications_required, experience_required, knowledge, skills, liaison_internal,
                internal_communication_purpose, liaison_external, external_communication_purpose, can_draft_policies,
                description, contractual_agreements, expenditure, problem_solving, financial, planning, short_term, med_term,
                long_term, amount, can_escalate, can_approve, core_function, no_of_positions, office_bound, shift_id,
                allow_overtime, recommended_contractor_rate, scoa_costing_percentage, start_date, end_date, parent_id,
                status, job_description_code, upper_limit_id, upper_limit_type, performance_assessment, is_active, enabled,
                ofo_major_group_id, ofo_sub_major_group_id, ofo_minor_group_id, ofo_unit_group_id, ofo_occupation_id,
                specialist_id, employment_category_id, employment_code_id, work_area_id, salary_transaction_group_id,
                created_at, updated_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,$46,$47,$48,$49,$50,$51,$52,$53,$54,$55,$56,$57,$58,$59,$60,$61,$62,NOW(),NOW())
               ON CONFLICT (id) DO UPDATE SET
                job_title=EXCLUDED.job_title, ofo_code=EXCLUDED.ofo_code, occupation=EXCLUDED.occupation,
                task_grade_id=EXCLUDED.task_grade_id, employee_type_id=EXCLUDED.employee_type_id,
                employee_subtype_id=EXCLUDED.employee_subtype_id, department_id=EXCLUDED.department_id,
                division_id=EXCLUDED.division_id, job_purpose=EXCLUDED.job_purpose, job_responsibility=EXCLUDED.job_responsibility,
                reports_to_description=EXCLUDED.reports_to_description, who_reports_to_position=EXCLUDED.who_reports_to_position,
                who_are_peers=EXCLUDED.who_are_peers, qualifications_required=EXCLUDED.qualifications_required,
                experience_required=EXCLUDED.experience_required, knowledge=EXCLUDED.knowledge, skills=EXCLUDED.skills,
                liaison_internal=EXCLUDED.liaison_internal, internal_communication_purpose=EXCLUDED.internal_communication_purpose,
                liaison_external=EXCLUDED.liaison_external, external_communication_purpose=EXCLUDED.external_communication_purpose,
                can_draft_policies=EXCLUDED.can_draft_policies, description=EXCLUDED.description,
                contractual_agreements=EXCLUDED.contractual_agreements, expenditure=EXCLUDED.expenditure,
                problem_solving=EXCLUDED.problem_solving, financial=EXCLUDED.financial, planning=EXCLUDED.planning,
                short_term=EXCLUDED.short_term, med_term=EXCLUDED.med_term, long_term=EXCLUDED.long_term,
                amount=EXCLUDED.amount, can_escalate=EXCLUDED.can_escalate, can_approve=EXCLUDED.can_approve,
                core_function=EXCLUDED.core_function, no_of_positions=EXCLUDED.no_of_positions, office_bound=EXCLUDED.office_bound,
                shift_id=EXCLUDED.shift_id, allow_overtime=EXCLUDED.allow_overtime,
                recommended_contractor_rate=EXCLUDED.recommended_contractor_rate,
                scoa_costing_percentage=EXCLUDED.scoa_costing_percentage, start_date=EXCLUDED.start_date,
                end_date=EXCLUDED.end_date, parent_id=EXCLUDED.parent_id, status=EXCLUDED.status,
                job_description_code=EXCLUDED.job_description_code, upper_limit_id=EXCLUDED.upper_limit_id,
                upper_limit_type=EXCLUDED.upper_limit_type,
                performance_assessment=EXCLUDED.performance_assessment, is_active=EXCLUDED.is_active, enabled=EXCLUDED.enabled,
                ofo_major_group_id=EXCLUDED.ofo_major_group_id, ofo_sub_major_group_id=EXCLUDED.ofo_sub_major_group_id,
                ofo_minor_group_id=EXCLUDED.ofo_minor_group_id, ofo_unit_group_id=EXCLUDED.ofo_unit_group_id,
                ofo_occupation_id=EXCLUDED.ofo_occupation_id, specialist_id=EXCLUDED.specialist_id,
                employment_category_id=EXCLUDED.employment_category_id, employment_code_id=EXCLUDED.employment_code_id,
                work_area_id=EXCLUDED.work_area_id, salary_transaction_group_id=EXCLUDED.salary_transaction_group_id,
                updated_at=NOW()
               RETURNING (xmax = 0) AS is_insert`,
              [r.id, r.job_title, r.ofo_code, r.occupation, r.task_grade_id, r.employee_type_id, r.employee_subtype_id,
               r.department_id, r.division_id, r.job_purpose, r.job_responsibility, r.reports_to_description,
               r.who_reports_to_position, r.who_are_peers, r.qualifications_required, r.experience_required,
               r.knowledge, r.skills, r.liaison_internal, r.internal_communication_purpose, r.liaison_external,
               r.external_communication_purpose, r.can_draft_policies, r.description, r.contractual_agreements,
               r.expenditure, r.problem_solving, r.financial, r.planning, r.short_term, r.med_term, r.long_term,
               r.amount, r.can_escalate, r.can_approve, r.core_function, r.no_of_positions, r.office_bound,
               r.shift_id, r.allow_overtime, r.recommended_contractor_rate, r.scoa_costing_percentage,
               r.start_date, r.end_date, r.parent_id, r.status, r.job_description_code, r.upper_limit_id,
               r.upper_limit_type,
               r.performance_assessment, r.is_active, r.enabled, r.ofo_major_group_id, r.ofo_sub_major_group_id,
               r.ofo_minor_group_id, r.ofo_unit_group_id, r.ofo_occupation_id, r.specialist_id,
               r.employment_category_id, r.employment_code_id, r.work_area_id, r.salary_transaction_group_id]
            );
            await client.query('RELEASE SAVEPOINT row_sp');
            if (res.rows[0].is_insert) inserted++; else updated++;
          } catch (err) { await client.query('ROLLBACK TO SAVEPOINT row_sp'); skipped.push({ id: r.id, name: r.job_title, reason: err.message }); }
        }

        if ((inserted + updated) > 0) await client.query(`SELECT setval('job_profiles_id_seq', (SELECT COALESCE(MAX(id), 1) FROM job_profiles))`);

        await client.query(
          `INSERT INTO conversion_logs (conversion_type, file_name, status, total_rows, inserted_rows, skipped_rows, error_message, details, created_by, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
          ['job-profiles', fileName || 'upload', (inserted + updated) > 0 ? 'success' : 'failed',
           rows.length, inserted + updated, skipped.length,
           skipped.length > 0 ? JSON.stringify(skipped) : null,
           JSON.stringify({ inserted, updated }), userId]
        );
        await client.query('COMMIT');
        return { success: (inserted + updated) > 0, inserted: inserted + updated, skipped, total: rows.length,
          warnings: [`${inserted} job profiles inserted, ${updated} updated`] };
      } catch (err) { await client.query('ROLLBACK'); throw err; } finally { client.release(); }
    }
  },

  'positions': {
    name: 'Positions',
    description: 'Organisational positions with mSCOA coding. Import job profiles and departments first. Upload the JobProfiles_Positions_Employees Excel file — reads the Payroll_Position tab.',
    targetTable: 'positions',
    requiredTabs: ['Payroll_Position'],
    category: 'hr',

    async preview(workbook) {
      const sheet = workbook.Sheets['Payroll_Position'];
      if (!sheet) return { valid: false, error: 'Excel must contain a tab named "Payroll_Position"' };
      const data = XLSX.utils.sheet_to_json(sheet);
      if (!data.length || !data[0].Position_ID) return { valid: false, error: 'Payroll_Position tab must contain Position_ID column' };

      const n = v => (v === 'NULL' || v === null || v === undefined || v === 0) ? null : v;
      const rows = data.map(r => ({
        id: r.Position_ID,
        title: r.PositionDesc || 'Untitled',
        position_code: n(r.UniqueId) || ('POS-' + r.Position_ID),
        department_id: r.DepartmentID,
        division_id: n(r.DivisionID),
        job_profile_id: n(r.JobProfileID),
        parent_position_id: n(r.ParentID),
        task_grade_id: null,
        employee_type_id: n(r.EmployeeTypeID),
        employee_subtype_id: n(r.EmployeeSubtypeID),
        condition_of_service_id: n(r.ConditionOfServiceID),
        is_hod: r.HOD === 1,
        funded: r.Funds === 1,
        capacity: n(r.Capacity) || 1,
        scoa_costing_id: n(r.ScoaCostingID) ? String(r.ScoaCostingID) : null,
        scoa_fund_id: n(r.ScoaFundID) ? String(r.ScoaFundID) : null,
        scoa_function_id: n(r.FunctionID) ? String(r.FunctionID) : null,
        scoa_project_id: n(r.ProjectID) ? String(r.ProjectID) : null,
        scoa_region_id: n(r.RegionID) ? String(r.RegionID) : null,
        scoa_item_id: n(r.ScoaExpenseID) ? String(r.ScoaExpenseID) : null,
        start_date: excelDateToISO(r.StartDate),
        end_date: excelDateToISO(r.EndDate),
        enabled: r.Enabled === 1,
        status: n(r.EmployeeID) ? 'FILLED' : 'VACANT',
        unique_identifier: n(r.UniqueId),
        hierarchy_code: n(r.HierarchyNo) ? String(r.HierarchyNo) : null,
        salary_transaction_group_id: n(r.PayrollDefinitionGroupID),
        non_employee: r.IsNonEmployee === 1,
        performance_assessment: r.IsPerformanceAssessement === 1,
        lock_fields: r.LockFields === 1
      }));

      const warnings = [];
      const posIds = new Set(rows.map(r => r.id));
      for (const r of rows) {
        if (r.parent_position_id && !posIds.has(r.parent_position_id)) {
          warnings.push(`Position ${r.id} (${r.title}) references parent ${r.parent_position_id} not in file — will be NULL`);
        }
      }

      return {
        valid: true,
        totalRows: rows.length,
        warnings: warnings.length > 20 ? warnings.slice(0, 20).concat([`...and ${warnings.length - 20} more`]) : warnings,
        sampleRows: rows.slice(0, 5).map(r => ({ id: r.id, title: r.title, position_code: r.position_code, department_id: r.department_id, job_profile_id: r.job_profile_id })),
        columnMapping: {
          'Position_ID → positions.id': 'Position ID',
          'PositionDesc → title': 'Position title',
          'UniqueId → position_code': 'Unique position code',
          'DepartmentID → department_id': 'FK to departments',
          'DivisionID → division_id': 'FK to divisions',
          'JobProfileID → job_profile_id': 'FK to job_profiles',
          'ParentID → parent_position_id': 'Hierarchy parent',
          'ScoaCostingID/ScoaFundID/FunctionID → mSCOA': 'mSCOA segment codes'
        },
        _rows: rows
      };
    },

    async execute(workbook, userId, fileName) {
      const previewResult = await this.preview(workbook);
      if (!previewResult.valid) throw new Error(previewResult.error);
      const rows = previewResult._rows;
      const client = await getClient();
      let inserted = 0, updated = 0;
      const skipped = [];

      try {
        await client.query('BEGIN');

        const validJPs = new Set((await client.query('SELECT id FROM job_profiles')).rows.map(r => r.id));
        const { getDepartments, getDivisions } = require('./department.routes');
        const validDepts = new Set((await getDepartments()).map(r => r.id));
        const validDivs = new Set((await getDivisions()).map(r => r.id));
        const validEmpTypes = new Set((await client.query('SELECT id FROM employee_types')).rows.map(r => r.id));
        const validEmpSubTypes = new Set((await client.query('SELECT id FROM employee_subtypes')).rows.map(r => r.id));
        const validCOS = new Set((await client.query('SELECT id FROM conditions_of_service')).rows.map(r => r.id));
        const validStgs = new Set((await client.query('SELECT id FROM salary_transaction_groups')).rows.map(r => r.id));

        for (const r of rows) {
          if (r.job_profile_id && !validJPs.has(r.job_profile_id)) r.job_profile_id = null;
          if (r.division_id && !validDivs.has(r.division_id)) r.division_id = null;
          if (r.employee_type_id && !validEmpTypes.has(r.employee_type_id)) r.employee_type_id = null;
          if (r.employee_subtype_id && !validEmpSubTypes.has(r.employee_subtype_id)) r.employee_subtype_id = null;
          if (r.condition_of_service_id && !validCOS.has(r.condition_of_service_id)) r.condition_of_service_id = null;
          if (r.salary_transaction_group_id && !validStgs.has(r.salary_transaction_group_id)) r.salary_transaction_group_id = null;
        }

        for (const r of rows) {
          await client.query('SAVEPOINT row_sp');
          try {
            const res = await client.query(
              `INSERT INTO positions (id, position_code, title, department_id, division_id, job_profile_id,
                parent_position_id, employee_type_id, employee_subtype_id, condition_of_service_id,
                is_hod, funded, capacity, scoa_costing_id, scoa_fund_id, scoa_function_id, scoa_project_id,
                scoa_region_id, scoa_item_id, start_date, end_date, enabled, status, unique_identifier,
                hierarchy_code, salary_transaction_group_id, non_employee, performance_assessment,
                lock_fields, created_at, updated_at)
               VALUES ($1,$2,$3,$4,$5,$6,NULL,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,NOW(),NOW())
               ON CONFLICT (id) DO UPDATE SET
                position_code=EXCLUDED.position_code, title=EXCLUDED.title, department_id=EXCLUDED.department_id,
                division_id=EXCLUDED.division_id, job_profile_id=EXCLUDED.job_profile_id,
                employee_type_id=EXCLUDED.employee_type_id,
                employee_subtype_id=EXCLUDED.employee_subtype_id, condition_of_service_id=EXCLUDED.condition_of_service_id,
                is_hod=EXCLUDED.is_hod, funded=EXCLUDED.funded, capacity=EXCLUDED.capacity,
                scoa_costing_id=EXCLUDED.scoa_costing_id, scoa_fund_id=EXCLUDED.scoa_fund_id,
                scoa_function_id=EXCLUDED.scoa_function_id, scoa_project_id=EXCLUDED.scoa_project_id,
                scoa_region_id=EXCLUDED.scoa_region_id, scoa_item_id=EXCLUDED.scoa_item_id,
                start_date=EXCLUDED.start_date, end_date=EXCLUDED.end_date, enabled=EXCLUDED.enabled,
                status=EXCLUDED.status, unique_identifier=EXCLUDED.unique_identifier,
                hierarchy_code=EXCLUDED.hierarchy_code, salary_transaction_group_id=EXCLUDED.salary_transaction_group_id,
                non_employee=EXCLUDED.non_employee, performance_assessment=EXCLUDED.performance_assessment,
                lock_fields=EXCLUDED.lock_fields, updated_at=NOW()
               RETURNING (xmax = 0) AS is_insert`,
              [r.id, r.position_code, r.title, r.department_id, r.division_id, r.job_profile_id,
               r.employee_type_id, r.employee_subtype_id, r.condition_of_service_id,
               r.is_hod, r.funded, r.capacity, r.scoa_costing_id, r.scoa_fund_id, r.scoa_function_id,
               r.scoa_project_id, r.scoa_region_id, r.scoa_item_id, r.start_date, r.end_date,
               r.enabled, r.status, r.unique_identifier, r.hierarchy_code, r.salary_transaction_group_id,
               r.non_employee, r.performance_assessment, r.lock_fields]
            );
            await client.query('RELEASE SAVEPOINT row_sp');
            if (res.rows[0].is_insert) inserted++; else updated++;
          } catch (err) { await client.query('ROLLBACK TO SAVEPOINT row_sp'); skipped.push({ id: r.id, name: r.title, reason: err.message }); }
        }

        const processedIds = new Set();
        for (const r of rows) { if (!skipped.find(s => s.id === r.id)) processedIds.add(r.id); }
        const existingPosIds = new Set((await client.query('SELECT id FROM positions')).rows.map(r => r.id));
        let parentSet = 0;
        const parentSkipped = [];
        for (const r of rows) {
          if (r.parent_position_id && processedIds.has(r.id) && existingPosIds.has(r.parent_position_id)) {
            await client.query('SAVEPOINT parent_sp');
            try { await client.query('UPDATE positions SET parent_position_id = $1 WHERE id = $2', [r.parent_position_id, r.id]); await client.query('RELEASE SAVEPOINT parent_sp'); parentSet++; }
            catch (e) { await client.query('ROLLBACK TO SAVEPOINT parent_sp'); parentSkipped.push({ id: r.id, parent: r.parent_position_id, reason: e.message }); }
          }
        }

        if ((inserted + updated) > 0) await client.query(`SELECT setval('positions_id_seq', (SELECT COALESCE(MAX(id), 1) FROM positions))`);

        await client.query(
          `INSERT INTO conversion_logs (conversion_type, file_name, status, total_rows, inserted_rows, skipped_rows, error_message, details, created_by, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
          ['positions', fileName || 'upload', (inserted + updated) > 0 ? 'success' : 'failed',
           rows.length, inserted + updated, skipped.length,
           skipped.length > 0 ? JSON.stringify(skipped.slice(0, 50)) : null,
           JSON.stringify({ inserted, updated, parentRelationships: parentSet }), userId]
        );
        await client.query('COMMIT');
        return { success: (inserted + updated) > 0, inserted: inserted + updated, skipped, total: rows.length,
          warnings: [`${inserted} positions inserted, ${updated} updated, ${parentSet} parent relationships set`] };
      } catch (err) { await client.query('ROLLBACK'); throw err; } finally { client.release(); }
    }
  },

  'employees': {
    name: 'Employees',
    description: 'Employee master data with personal details, banking, and position links. Import job profiles and positions first. Upload the JobProfiles_Positions_Employees Excel file — reads the Payroll_employee tab.',
    targetTable: 'employees',
    requiredTabs: ['Payroll_employee'],
    category: 'hr',

    async preview(workbook) {
      const sheet = workbook.Sheets['Payroll_employee'];
      if (!sheet) return { valid: false, error: 'Excel must contain a tab named "Payroll_employee"' };
      const data = XLSX.utils.sheet_to_json(sheet);
      if (!data.length || !data[0].Employee_ID) return { valid: false, error: 'Payroll_employee tab must contain Employee_ID column' };

      const titlesRows = (await dbQuery('SELECT id, abbreviation FROM titles')).rows;
      const titleMap = {};
      titlesRows.forEach(r => { titleMap[r.id] = r.abbreviation; });
      const gendersRows = (await dbQuery('SELECT id, name FROM genders')).rows;
      const genderMap = {};
      gendersRows.forEach(r => { genderMap[r.id] = r.name; });
      const maritalMap = { 1: 'Single', 2: 'Married', 4: 'Divorced', 5: 'Widowed' };
      const accountTypeMap = { 1: 'Current', 2: 'Savings', 3: 'Transmission', 8: 'Other' };
      const ethnicRows = (await dbQuery('SELECT id, name FROM ethnic_groups')).rows;
      const ethnicMap = {};
      ethnicRows.forEach(r => { ethnicMap[r.id] = r.name; });

      const n = v => (v === 'NULL' || v === null || v === undefined) ? null : v;
      const nz = v => (v === 'NULL' || v === null || v === undefined || v === 0) ? null : v;

      const rows = data.map(r => ({
        id: r.Employee_ID,
        employee_code: String(r.EmpCode),
        id_number: String(n(r.IdNo) || '0000000000000'),
        title: titleMap[r.TitleID] || null,
        initials: n(r.Initials),
        first_name: r.FirstName || 'Unknown',
        second_name: n(r.SecondName),
        surname: r.Surname || 'Unknown',
        known_as: n(r.KnownAsName),
        date_of_birth: excelDateToISO(r.DateOfBirth) || '1900-01-01',
        gender: genderMap[r.GenderID] || null,
        home_language: null,
        marital_status: maritalMap[r.MarriedID] || null,
        dependants: nz(r.Dependants),
        passport_number: n(r.PassportNumber),
        passport_country: nz(r.PassportCountryID) ? String(r.PassportCountryID) : null,
        email_address: n(r.EmailAddress),
        home_number: n(r.HomeNumber),
        work_number: n(r.WorkNumber),
        cell_number: n(r.CellNumber),
        joining_date: excelDateToISO(r.JoiningDate) || '2000-01-01',
        end_date: excelDateToISO(r.EndDate),
        income_tax_number: n(r.IncomeTaxNumber),
        exclude_uif: r.ExcludeUIF === 1,
        exclude_sdl: r.ExcludeSDL === 1,
        physical_address_1: n(r.PhysicalAddress1),
        physical_address_2: n(r.PhysicalAddress2),
        physical_postal_code: n(r.PhysicalPostalCode) ? String(r.PhysicalPostalCode) : null,
        physical_province_id: nz(r.PhysicalProvinceID),
        physical_town_id: nz(r.PhysicalTownID),
        physical_country_id: nz(r.PhysicalCountryID),
        postal_same_as_physical: r.PostalSameAsPhysical === 1,
        postal_address_1: n(r.PostalAddress1),
        postal_address_2: n(r.PostalAddress2),
        postal_postal_code: n(r.PostalPostalCode) ? String(r.PostalPostalCode) : null,
        payment_type: 'EFT',
        bank_account_type: accountTypeMap[r.AccountTypeID] || null,
        bank_account_holder: n(r.AccountHolderName),
        bank_account_number: n(r.AccountNumber) ? String(r.AccountNumber) : null,
        bank_name: nz(r.BankID) ? String(r.BankID) : null,
        bank_branch_code: nz(r.BranchID) ? String(r.BranchID) : null,
        working_hours_per_day: nz(r.WHPD_Monthly) || nz(r.WHPD_Other),
        working_days_per_week: nz(r.WDPW_Other) || 5,
        working_hours_per_month: nz(r.WHPM_Monthly),
        working_days_per_month: nz(r.WDPM_Monthly),
        annual_salary: nz(r.AnnualSalary),
        position_id: nz(r.PositionID),
        job_profile_id: nz(r.JobProfileID),
        employee_type_id: nz(r.EmployeeTypeID),
        employee_subtype_id: nz(r.EmployeeSubtypeID),
        condition_of_service_id: nz(r.ConditionOfServiceID),
        task_grade_id: null,
        current_notch: nz(r.NotchId),
        enabled: r.Enabled === 1,
        race: ethnicMap[r.EthnicGroupID] || null,
        ethnic_group: ethnicMap[r.EthnicGroupID] || null,
        is_youth: r.IsYough === 1,
        is_foreigner: r.Isforeigner === 1,
        has_disability: r.EquityDisabled === 1,
        tax_method: nz(r.TaxCalculationType) ? String(r.TaxCalculationType) : null,
        allow_overtime: r.AllowOverTime === 1,
        shift_id: nz(r.ShiftID),
        pay_point_id: nz(r.PayPointID),
        nature_of_person_code: nz(r.NatureOfPersonID) ? String(r.NatureOfPersonID) : null,
        is_councillor: r.EmployeeTypeID === 6,
        status: r.Enabled === 1 ? 'ACTIVE' : 'TERMINATED',
        full_name: [r.FirstName, r.SecondName, r.Surname].filter(x => x && x !== 'NULL').join(' '),
        physical_address_3: n(r.PhysicalAddress3),
        physical_address_4: n(r.PhysicalAddress4),
        postal_address_3: n(r.PostalAddress3),
        postal_address_4: n(r.PostalAddress4),
        marital_date: excelDateToISO(r.MarritalStatusDate),
        emergency_contact_name: n(r.KinContactFullName) || n(r.KinContactName),
        emergency_contact_phone: n(r.KinContactNo)
      }));

      return {
        valid: true,
        totalRows: rows.length,
        warnings: [],
        sampleRows: rows.slice(0, 5).map(r => ({ id: r.id, employee_code: r.employee_code, first_name: r.first_name, surname: r.surname, position_id: r.position_id })),
        columnMapping: {
          'Employee_ID → employees.id': 'Employee ID',
          'EmpCode → employee_code': 'Employee number',
          'IdNo → id_number': 'SA ID number',
          'FirstName/Surname → first_name/surname': 'Full name',
          'PositionID → position_id': 'FK to positions',
          'JobProfileID → job_profile_id': 'FK to job_profiles',
          'AnnualSalary → annual_salary': 'Annual salary',
          'GenderID → gender': '1=Female, 2=Male (from genders table)',
          'TitleID → title': 'Mapped from titles table (None/Brig/Dr/Ds/Miss/Mr/Mrs/Ms/Me/Prof/Rev)',
          'MarriedID → marital_status': 'Single/Married/Divorced/Widowed'
        },
        _rows: rows
      };
    },

    async execute(workbook, userId, fileName) {
      const previewResult = await this.preview(workbook);
      if (!previewResult.valid) throw new Error(previewResult.error);
      const rows = previewResult._rows;
      const client = await getClient();
      let inserted = 0, updated = 0;
      const skipped = [];

      try {
        await client.query('BEGIN');

        const validPositions = new Set((await client.query('SELECT id FROM positions')).rows.map(r => r.id));
        const validJPs = new Set((await client.query('SELECT id FROM job_profiles')).rows.map(r => r.id));
        const validEmpTypes = new Set((await client.query('SELECT id FROM employee_types')).rows.map(r => r.id));
        const validEmpSubTypes = new Set((await client.query('SELECT id FROM employee_subtypes')).rows.map(r => r.id));
        const validCOS = new Set((await client.query('SELECT id FROM conditions_of_service')).rows.map(r => r.id));
        const validTG = new Set((await client.query('SELECT id FROM task_grades')).rows.map(r => r.id));

        for (const r of rows) {
          if (r.position_id && !validPositions.has(r.position_id)) r.position_id = null;
          if (r.job_profile_id && !validJPs.has(r.job_profile_id)) r.job_profile_id = null;
          if (r.employee_type_id && !validEmpTypes.has(r.employee_type_id)) r.employee_type_id = null;
          if (r.employee_subtype_id && !validEmpSubTypes.has(r.employee_subtype_id)) r.employee_subtype_id = null;
          if (r.condition_of_service_id && !validCOS.has(r.condition_of_service_id)) r.condition_of_service_id = null;
          if (r.task_grade_id && !validTG.has(r.task_grade_id)) r.task_grade_id = null;
        }

        for (const r of rows) {
          await client.query('SAVEPOINT row_sp');
          try {
            const res = await client.query(
              `INSERT INTO employees (id, employee_code, id_number, title, initials, first_name, second_name, surname,
                known_as, date_of_birth, gender, marital_status, dependants, passport_number, passport_country,
                email_address, home_number, work_number, cell_number, joining_date, end_date, income_tax_number,
                exclude_uif, exclude_sdl, physical_address_1, physical_address_2, physical_postal_code,
                physical_province_id, physical_town_id, physical_country_id, postal_same_as_physical,
                postal_address_1, postal_address_2, postal_postal_code, payment_type, bank_account_type,
                bank_account_holder, bank_account_number, bank_name, bank_branch_code,
                working_hours_per_day, working_days_per_week, working_hours_per_month, working_days_per_month,
                annual_salary, position_id, job_profile_id, employee_type_id, employee_subtype_id,
                condition_of_service_id, current_notch, enabled, race, ethnic_group, is_youth, is_foreigner, has_disability,
                tax_method, allow_overtime, pay_point_id, nature_of_person_code, is_councillor, status,
                full_name, physical_address_3, physical_address_4, postal_address_3, postal_address_4,
                marital_date, emergency_contact_name, emergency_contact_phone, created_at, updated_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,$46,$47,$48,$49,$50,$51,$52,$53,$54,$55,$56,$57,$58,$59,$60,$61,$62,$63,$64,$65,$66,$67,$68,$69,$70,$71,NOW(),NOW())
               ON CONFLICT (id) DO UPDATE SET
                employee_code=EXCLUDED.employee_code, id_number=EXCLUDED.id_number, title=EXCLUDED.title,
                initials=EXCLUDED.initials, first_name=EXCLUDED.first_name, second_name=EXCLUDED.second_name,
                surname=EXCLUDED.surname, known_as=EXCLUDED.known_as, date_of_birth=EXCLUDED.date_of_birth,
                gender=EXCLUDED.gender, marital_status=EXCLUDED.marital_status, dependants=EXCLUDED.dependants,
                passport_number=EXCLUDED.passport_number, passport_country=EXCLUDED.passport_country,
                email_address=EXCLUDED.email_address, home_number=EXCLUDED.home_number,
                work_number=EXCLUDED.work_number, cell_number=EXCLUDED.cell_number,
                joining_date=EXCLUDED.joining_date, end_date=EXCLUDED.end_date,
                income_tax_number=EXCLUDED.income_tax_number, exclude_uif=EXCLUDED.exclude_uif,
                exclude_sdl=EXCLUDED.exclude_sdl, physical_address_1=EXCLUDED.physical_address_1,
                physical_address_2=EXCLUDED.physical_address_2, physical_postal_code=EXCLUDED.physical_postal_code,
                physical_province_id=EXCLUDED.physical_province_id, physical_town_id=EXCLUDED.physical_town_id,
                physical_country_id=EXCLUDED.physical_country_id,
                postal_same_as_physical=EXCLUDED.postal_same_as_physical,
                postal_address_1=EXCLUDED.postal_address_1, postal_address_2=EXCLUDED.postal_address_2,
                postal_postal_code=EXCLUDED.postal_postal_code, payment_type=EXCLUDED.payment_type,
                bank_account_type=EXCLUDED.bank_account_type, bank_account_holder=EXCLUDED.bank_account_holder,
                bank_account_number=EXCLUDED.bank_account_number, bank_name=EXCLUDED.bank_name,
                bank_branch_code=EXCLUDED.bank_branch_code,
                working_hours_per_day=EXCLUDED.working_hours_per_day,
                working_days_per_week=EXCLUDED.working_days_per_week,
                working_hours_per_month=EXCLUDED.working_hours_per_month,
                working_days_per_month=EXCLUDED.working_days_per_month,
                annual_salary=EXCLUDED.annual_salary, position_id=EXCLUDED.position_id,
                job_profile_id=EXCLUDED.job_profile_id, employee_type_id=EXCLUDED.employee_type_id,
                employee_subtype_id=EXCLUDED.employee_subtype_id,
                condition_of_service_id=EXCLUDED.condition_of_service_id, current_notch=EXCLUDED.current_notch,
                enabled=EXCLUDED.enabled, race=EXCLUDED.race, ethnic_group=EXCLUDED.ethnic_group, is_youth=EXCLUDED.is_youth,
                is_foreigner=EXCLUDED.is_foreigner, has_disability=EXCLUDED.has_disability,
                tax_method=EXCLUDED.tax_method, allow_overtime=EXCLUDED.allow_overtime,
                pay_point_id=EXCLUDED.pay_point_id, nature_of_person_code=EXCLUDED.nature_of_person_code,
                is_councillor=EXCLUDED.is_councillor, status=EXCLUDED.status, full_name=EXCLUDED.full_name,
                physical_address_3=EXCLUDED.physical_address_3, physical_address_4=EXCLUDED.physical_address_4,
                postal_address_3=EXCLUDED.postal_address_3, postal_address_4=EXCLUDED.postal_address_4,
                marital_date=EXCLUDED.marital_date, emergency_contact_name=EXCLUDED.emergency_contact_name,
                emergency_contact_phone=EXCLUDED.emergency_contact_phone, updated_at=NOW()
               RETURNING (xmax = 0) AS is_insert`,
              [r.id, r.employee_code, r.id_number, r.title, r.initials, r.first_name, r.second_name, r.surname,
               r.known_as, r.date_of_birth, r.gender, r.marital_status, r.dependants, r.passport_number,
               r.passport_country, r.email_address, r.home_number, r.work_number, r.cell_number,
               r.joining_date, r.end_date, r.income_tax_number, r.exclude_uif, r.exclude_sdl,
               r.physical_address_1, r.physical_address_2, r.physical_postal_code,
               r.physical_province_id, r.physical_town_id, r.physical_country_id,
               r.postal_same_as_physical, r.postal_address_1, r.postal_address_2, r.postal_postal_code,
               r.payment_type, r.bank_account_type, r.bank_account_holder, r.bank_account_number,
               r.bank_name, r.bank_branch_code, r.working_hours_per_day, r.working_days_per_week,
               r.working_hours_per_month, r.working_days_per_month, r.annual_salary, r.position_id,
               r.job_profile_id, r.employee_type_id, r.employee_subtype_id, r.condition_of_service_id,
               r.current_notch, r.enabled, r.race, r.ethnic_group, r.is_youth, r.is_foreigner, r.has_disability,
               r.tax_method, r.allow_overtime, r.pay_point_id, r.nature_of_person_code,
               r.is_councillor, r.status, r.full_name, r.physical_address_3, r.physical_address_4,
               r.postal_address_3, r.postal_address_4, r.marital_date,
               r.emergency_contact_name, r.emergency_contact_phone]
            );
            await client.query('RELEASE SAVEPOINT row_sp');
            if (res.rows[0].is_insert) inserted++; else updated++;
          } catch (err) { await client.query('ROLLBACK TO SAVEPOINT row_sp'); skipped.push({ id: r.id, name: r.employee_code + ' ' + r.first_name + ' ' + r.surname, reason: err.message }); }
        }

        if ((inserted + updated) > 0) await client.query(`SELECT setval('employees_id_seq', (SELECT COALESCE(MAX(id), 1) FROM employees))`);

        await client.query(
          `INSERT INTO conversion_logs (conversion_type, file_name, status, total_rows, inserted_rows, skipped_rows, error_message, details, created_by, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
          ['employees', fileName || 'upload', (inserted + updated) > 0 ? 'success' : 'failed',
           rows.length, inserted + updated, skipped.length,
           skipped.length > 0 ? JSON.stringify(skipped.slice(0, 50)) : null,
           JSON.stringify({ inserted, updated }), userId]
        );
        await client.query('COMMIT');
        return { success: (inserted + updated) > 0, inserted: inserted + updated, skipped, total: rows.length,
          warnings: [`${inserted} employees inserted, ${updated} updated`] };
      } catch (err) { await client.query('ROLLBACK'); throw err; } finally { client.release(); }
    }
  },

  'employee-medical-aid': {
    name: 'Employee Medical Aid',
    description: 'Employee medical aid enrolments linking employees to schemes',
    targetTable: 'employee_medical_aid',
    requiredTabs: ['Payroll_EmployeeMedicalAIDDetai'],
    category: 'benefits',

    async preview(workbook) {
      const sheet = workbook.Sheets['Payroll_EmployeeMedicalAIDDetai'];
      if (!sheet) return { valid: false, error: 'Excel must contain tab: Payroll_EmployeeMedicalAIDDetai' };
      const data = XLSX.utils.sheet_to_json(sheet);
      if (!data.length || !data[0].EmployeeMedicalAID_ID) return { valid: false, error: 'Expected column: EmployeeMedicalAID_ID' };

      const n = v => (v === 'NULL' || v === null || v === undefined) ? null : v;
      const rows = data.map(r => ({
        id: r.EmployeeMedicalAID_ID,
        employee_id: r.EmployeeID,
        scheme_id: r.MedicalAidSchmeID,
        join_date: excelDateToISO(r.JoinDate) || '2025-01-01',
        termination_date: excelDateToISO(r.TerminationDate),
        membership_number: n(r.Reference) ? String(r.Reference) : null,
        is_current: r.Enable === 1
      }));

      return {
        valid: true, totalRows: rows.length,
        tabs: { Payroll_EmployeeMedicalAIDDetai: data.length },
        warnings: [],
        sampleRows: rows.slice(0, 5),
        columnMapping: {
          'EmployeeMedicalAID_ID → id': 'Original ID',
          'EmployeeID → employee_id': 'FK to employees',
          'MedicalAidSchmeID → scheme_id': 'FK to medical_aid_schemes',
          'JoinDate → join_date': 'Enrolment date',
          'TerminationDate → termination_date': 'Termination date',
          'Reference → membership_number': 'Membership/reference number'
        },
        _rows: rows
      };
    },

    async execute(workbook, userId, fileName) {
      const previewResult = await this.preview(workbook);
      if (!previewResult.valid) throw new Error(previewResult.error);
      const rows = previewResult._rows;
      const client = await getClient();
      let inserted = 0, updated = 0;
      const skipped = [];

      try {
        await client.query('BEGIN');

        const validEmps = new Set((await client.query('SELECT id FROM employees')).rows.map(r => r.id));
        const validSchemes = new Set((await client.query('SELECT id FROM medical_aid_schemes')).rows.map(r => r.id));

        for (const r of rows) {
          if (!validEmps.has(r.employee_id)) { skipped.push({ id: r.id, name: 'EmpID ' + r.employee_id, reason: 'Employee not found' }); continue; }
          if (!validSchemes.has(r.scheme_id)) { skipped.push({ id: r.id, name: 'SchemeID ' + r.scheme_id, reason: 'Medical aid scheme not found' }); continue; }

          await client.query('SAVEPOINT row_sp');
          try {
            const res = await client.query(
              `INSERT INTO employee_medical_aid (id, employee_id, scheme_id, membership_number, join_date, termination_date, is_current, created_at, updated_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
               ON CONFLICT (id) DO UPDATE SET
                employee_id=EXCLUDED.employee_id, scheme_id=EXCLUDED.scheme_id, membership_number=EXCLUDED.membership_number,
                join_date=EXCLUDED.join_date, termination_date=EXCLUDED.termination_date, is_current=EXCLUDED.is_current, updated_at=NOW()
               RETURNING (xmax = 0) AS is_insert`,
              [r.id, r.employee_id, r.scheme_id, r.membership_number, r.join_date, r.termination_date, r.is_current]
            );
            await client.query('RELEASE SAVEPOINT row_sp');
            if (res.rows[0].is_insert) inserted++; else updated++;
          } catch (err) { await client.query('ROLLBACK TO SAVEPOINT row_sp'); skipped.push({ id: r.id, name: 'EmpID ' + r.employee_id, reason: err.message }); }
        }

        if ((inserted + updated) > 0) await client.query(`SELECT setval('employee_medical_aid_id_seq', (SELECT COALESCE(MAX(id), 1) FROM employee_medical_aid))`);

        await client.query(
          `INSERT INTO conversion_logs (conversion_type, file_name, status, total_rows, inserted_rows, skipped_rows, error_message, details, created_by, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
          ['employee-medical-aid', fileName || 'upload', (inserted + updated) > 0 ? 'success' : 'failed',
           rows.length, inserted + updated, skipped.length,
           skipped.length > 0 ? JSON.stringify(skipped.slice(0, 50)) : null,
           JSON.stringify({ inserted, updated }), userId]
        );
        await client.query('COMMIT');
        return { success: (inserted + updated) > 0, inserted: inserted + updated, skipped, total: rows.length,
          warnings: [`${inserted} enrolments inserted, ${updated} updated`] };
      } catch (err) { await client.query('ROLLBACK'); throw err; } finally { client.release(); }
    }
  },

  'employee-medical-aid-dependants': {
    name: 'Employee Medical Aid Dependants',
    description: 'Medical aid dependants linked to employee enrolments',
    targetTable: 'employee_medical_aid_dependants',
    requiredTabs: ['EmployeeMedicalAIDDependants'],
    category: 'benefits',

    async preview(workbook) {
      const sheet = workbook.Sheets['EmployeeMedicalAIDDependants'];
      if (!sheet) return { valid: false, error: 'Excel must contain tab: EmployeeMedicalAIDDependants' };
      const data = XLSX.utils.sheet_to_json(sheet);
      if (!data.length || !data[0].EmployeeDependant_ID) return { valid: false, error: 'Expected column: EmployeeDependant_ID' };

      const n = v => (v === 'NULL' || v === null || v === undefined) ? null : v;
      const gendersRows = (await dbQuery('SELECT id, name FROM genders')).rows;
      const genderMap = {};
      gendersRows.forEach(r => { genderMap[r.id] = r.name; });

      const rows = data.map(r => {
        let dependantType = 'ADULT';
        if (r.Student === 1) dependantType = 'STUDENT';
        else if (r.Disabled === 1) dependantType = 'DISABLED';
        else if (r.DependantType === 1) dependantType = 'CHILD';
        else if (r.DependantType === 0) dependantType = 'ADULT';

        return {
          id: r.EmployeeDependant_ID,
          employee_medical_aid_id: r.EmployeeMedicalAIDID,
          first_name: n(r.Name) || 'Unknown',
          surname: n(r.Surname) || 'Unknown',
          id_number: n(r.IDNumber),
          date_of_birth: excelDateToISO(r.DateOfBirth),
          gender: genderMap[r.GenderID] || null,
          dependant_type: dependantType,
          employer_contributes: r.EmployerContribute === 1,
          start_date: excelDateToISO(r.StartDate) || '2025-01-01',
          end_date: excelDateToISO(r.EndDate),
          student_dependant: r.Student === 1,
          disabled_dependant: r.Disabled === 1
        };
      });

      return {
        valid: true, totalRows: rows.length,
        tabs: { EmployeeMedicalAIDDependants: data.length },
        warnings: [],
        sampleRows: rows.slice(0, 5),
        columnMapping: {
          'EmployeeDependant_ID → id': 'Original ID',
          'EmployeeMedicalAIDID → employee_medical_aid_id': 'FK to employee_medical_aid',
          'Name → first_name': 'Dependant first name',
          'Surname → surname': 'Dependant surname',
          'IDNumber → id_number': 'SA ID number',
          'DateOfBirth → date_of_birth': 'Date of birth',
          'GenderID → gender': '1=Female, 2=Male (from genders table)',
          'DependantType → dependant_type': '0=ADULT, 1=CHILD (+ Student/Disabled flags)',
          'Student → student_dependant': 'Student flag',
          'Disabled → disabled_dependant': 'Disabled flag'
        },
        _rows: rows
      };
    },

    async execute(workbook, userId, fileName) {
      const previewResult = await this.preview(workbook);
      if (!previewResult.valid) throw new Error(previewResult.error);
      const rows = previewResult._rows;
      const client = await getClient();
      let inserted = 0, updated = 0;
      const skipped = [];

      try {
        await client.query('BEGIN');

        const validMAs = new Set((await client.query('SELECT id FROM employee_medical_aid')).rows.map(r => r.id));

        for (const r of rows) {
          if (!validMAs.has(r.employee_medical_aid_id)) { skipped.push({ id: r.id, name: r.first_name + ' ' + r.surname, reason: 'Medical aid enrolment not found (ID ' + r.employee_medical_aid_id + ')' }); continue; }

          await client.query('SAVEPOINT row_sp');
          try {
            const res = await client.query(
              `INSERT INTO employee_medical_aid_dependants (id, employee_medical_aid_id, first_name, surname, id_number, date_of_birth, gender, dependant_type, employer_contributes, start_date, end_date, student_dependant, disabled_dependant, created_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())
               ON CONFLICT (id) DO UPDATE SET
                employee_medical_aid_id=EXCLUDED.employee_medical_aid_id, first_name=EXCLUDED.first_name, surname=EXCLUDED.surname,
                id_number=EXCLUDED.id_number, date_of_birth=EXCLUDED.date_of_birth, gender=EXCLUDED.gender,
                dependant_type=EXCLUDED.dependant_type, employer_contributes=EXCLUDED.employer_contributes,
                start_date=EXCLUDED.start_date, end_date=EXCLUDED.end_date,
                student_dependant=EXCLUDED.student_dependant, disabled_dependant=EXCLUDED.disabled_dependant
               RETURNING (xmax = 0) AS is_insert`,
              [r.id, r.employee_medical_aid_id, r.first_name, r.surname, r.id_number, r.date_of_birth,
               r.gender, r.dependant_type, r.employer_contributes, r.start_date, r.end_date,
               r.student_dependant, r.disabled_dependant]
            );
            await client.query('RELEASE SAVEPOINT row_sp');
            if (res.rows[0].is_insert) inserted++; else updated++;
          } catch (err) { await client.query('ROLLBACK TO SAVEPOINT row_sp'); skipped.push({ id: r.id, name: r.first_name + ' ' + r.surname, reason: err.message }); }
        }

        if ((inserted + updated) > 0) await client.query(`SELECT setval('employee_medical_aid_dependants_id_seq', (SELECT COALESCE(MAX(id), 1) FROM employee_medical_aid_dependants))`);

        await client.query(
          `INSERT INTO conversion_logs (conversion_type, file_name, status, total_rows, inserted_rows, skipped_rows, error_message, details, created_by, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
          ['employee-medical-aid-dependants', fileName || 'upload', (inserted + updated) > 0 ? 'success' : 'failed',
           rows.length, inserted + updated, skipped.length,
           skipped.length > 0 ? JSON.stringify(skipped.slice(0, 50)) : null,
           JSON.stringify({ inserted, updated }), userId]
        );
        await client.query('COMMIT');
        return { success: (inserted + updated) > 0, inserted: inserted + updated, skipped, total: rows.length,
          warnings: [`${inserted} dependants inserted, ${updated} updated`] };
      } catch (err) { await client.query('ROLLBACK'); throw err; } finally { client.release(); }
    }
  },

  'payroll-cycles-periods': {
    name: 'Payroll Cycles & Periods',
    description: 'Payroll cycles (Monthly, Fortnightly, Weekly, Ad Hoc) and their period definitions. Upload the Cycles Excel file with Const_cycle and Payroll_CyclePeriodDetails tabs.',
    targetTable: 'payroll_cycles',
    requiredTabs: ['Const_cycle', 'Payroll_CyclePeriodDetails'],
    category: 'payroll',

    async preview(workbook) {
      const cycleSheet = workbook.Sheets['Const_cycle'];
      const periodSheet = workbook.Sheets['Payroll_CyclePeriodDetails'];
      if (!cycleSheet) return { valid: false, error: 'Excel must contain a tab named "Const_cycle"' };
      if (!periodSheet) return { valid: false, error: 'Excel must contain a tab named "Payroll_CyclePeriodDetails"' };

      const cycleData = XLSX.utils.sheet_to_json(cycleSheet);
      const periodData = XLSX.utils.sheet_to_json(periodSheet);
      if (!cycleData.length || !cycleData[0].Cycle_ID) return { valid: false, error: 'Const_cycle tab must contain Cycle_ID column' };
      if (!periodData.length || !periodData[0].Period_ID) return { valid: false, error: 'Payroll_CyclePeriodDetails tab must contain Period_ID column' };

      const cycleTypeMap = { 1: 'MONTHLY', 2: 'WEEKLY', 3: 'FORTNIGHTLY' };
      const periodsPerYearMap = { 1: 12, 2: 52, 3: 26 };
      const n = v => (v === 'NULL' || v === null || v === undefined) ? null : v;

      const cycles = cycleData.map(r => ({
        id: r.Cycle_ID,
        name: r.CycleDesc,
        code: r.CycleDesc.replace(/\s+/g, '_').toUpperCase().substring(0, 50),
        cycle_type: cycleTypeMap[r.CycleTypeID] || 'MONTHLY',
        periods_per_year: periodsPerYearMap[r.CycleTypeID] || 12,
        enabled: r.Enabled === 1
      }));

      const warnings = [];
      const cycleIds = new Set(cycles.map(c => c.id));

      const periodRows = periodData.map(r => {
        if (!cycleIds.has(r.CycleID)) warnings.push(`Period ${r.Period_ID} references CycleID ${r.CycleID} not in cycles tab`);
        const startDate = excelDateToISO(r.PeriodStartDate);
        const endDate = excelDateToISO(r.PeriodEndDate);
        const taxYearStr = n(r.TaxYear);
        let taxYear = null;
        if (taxYearStr && typeof taxYearStr === 'string') {
          const m = taxYearStr.match(/(\d{4})\/(\d{4})/);
          if (m) taxYear = parseInt(m[2]);
          else {
            const m2 = taxYearStr.match(/(\d{4})/);
            if (m2) taxYear = parseInt(m2[1]);
          }
        } else if (typeof taxYearStr === 'number') {
          taxYear = taxYearStr;
        }

        return {
          id: r.Period_ID,
          cycle_id: r.CycleID,
          period_number: r.PeriodInTaxYear,
          tax_year: taxYear,
          tax_period: r.PeriodInTaxYear,
          financial_year: n(r.FinancialYear),
          start_date: startDate,
          end_date: endDate,
          payment_date: endDate,
          status: r.Processed === 1 ? 'CLOSED' : 'OPEN',
          processing_month: parseProcessingMonth(r.ProcessingMonth),
          cycle_mode_id: Number(r.CycleModeID) === 2 ? 2 : 1
        };
      });

      const finPeriodCounters = {};
      const sortedPeriods = [...periodRows].sort((a, b) => {
        if (a.cycle_id !== b.cycle_id) return a.cycle_id - b.cycle_id;
        if (a.financial_year !== b.financial_year) return (a.financial_year || '').localeCompare(b.financial_year || '');
        return (a.start_date || '').localeCompare(b.start_date || '');
      });
      for (const p of sortedPeriods) {
        const key = `${p.cycle_id}_${p.financial_year || 'null'}`;
        finPeriodCounters[key] = (finPeriodCounters[key] || 0) + 1;
        p.financial_period = finPeriodCounters[key];
      }

      const periods = periodRows;

      return {
        valid: true,
        totalRows: cycles.length + periods.length,
        tabs: { Const_cycle: cycleData.length, Payroll_CyclePeriodDetails: periodData.length },
        warnings,
        sampleRows: [
          ...cycles.slice(0, 3).map(c => ({ type: 'CYCLE', id: c.id, name: c.name, cycle_type: c.cycle_type })),
          ...periods.slice(0, 3).map(p => ({ type: 'PERIOD', id: p.id, cycle_id: p.cycle_id, period_number: p.period_number, start_date: p.start_date, end_date: p.end_date }))
        ],
        columnMapping: {
          'Cycle_ID → payroll_cycles.id': 'Cycle ID',
          'CycleDesc → payroll_cycles.name': 'Cycle name (e.g. Monthly Salary)',
          'CycleTypeID → cycle_type': '1=MONTHLY, 2=WEEKLY, 3=FORTNIGHTLY',
          'Period_ID → payroll_periods.id': 'Period ID',
          'CycleID → payroll_periods.cycle_id': 'FK to payroll_cycles',
          'PeriodInTaxYear → period_number': 'Period sequence in tax year',
          'PeriodStartDate → start_date': 'Period start date',
          'PeriodEndDate → end_date': 'Period end date',
          'TaxYear → tax_year': 'Tax year (e.g. 2026)',
          'FinancialYear → financial_year': 'Financial year (e.g. 2025/2026)',
          'ProcessingMonth → label': 'Month label (e.g. March, Bi-Week1, Week1)'
        },
        _cycles: cycles,
        _periods: periods
      };
    },

    async execute(workbook, userId, fileName) {
      const previewResult = await this.preview(workbook);
      if (!previewResult.valid) throw new Error(previewResult.error);
      const cycles = previewResult._cycles;
      const periods = previewResult._periods;
      const client = await getClient();
      let cyclesInserted = 0, periodsInserted = 0;
      const skipped = [];

      try {
        await client.query('BEGIN');

        const oldPeriodIds = await client.query('SELECT id FROM payroll_periods');
        const oldPIds = oldPeriodIds.rows.map(r => r.id);
        const oldCycleIds = await client.query('SELECT id FROM payroll_cycles');
        const oldCIds = oldCycleIds.rows.map(r => r.id);

        if (oldPIds.length > 0) {
          await client.query('DELETE FROM payroll_results WHERE period_id = ANY($1)', [oldPIds]);
          await client.query('DELETE FROM payroll_run_errors WHERE run_id IN (SELECT id FROM payroll_runs WHERE period_id = ANY($1))', [oldPIds]);
          await client.query('DELETE FROM payroll_gl_journals WHERE run_id IN (SELECT id FROM payroll_runs WHERE period_id = ANY($1))', [oldPIds]);
          await client.query('DELETE FROM third_party_payments WHERE period_id = ANY($1)', [oldPIds]);
          await client.query('DELETE FROM eft_batches WHERE run_id IN (SELECT id FROM payroll_runs WHERE period_id = ANY($1))', [oldPIds]);
          await client.query('DELETE FROM payment_batches WHERE period_id = ANY($1)', [oldPIds]);
          await client.query('DELETE FROM payroll_runs WHERE period_id = ANY($1)', [oldPIds]);
          await client.query('DELETE FROM wage_transactions WHERE period_id = ANY($1)', [oldPIds]);
          await client.query('DELETE FROM overtime_transactions WHERE period_id = ANY($1)', [oldPIds]);
          await client.query('UPDATE claims SET period_id = NULL WHERE period_id = ANY($1)', [oldPIds]);
        }
        if (oldCIds.length > 0) {
          await client.query('DELETE FROM wage_transactions WHERE cycle_id = ANY($1)', [oldCIds]);
          await client.query('DELETE FROM arrears WHERE run_id IN (SELECT id FROM payroll_runs WHERE cycle_id = ANY($1))', [oldCIds]);
          await client.query('UPDATE employees SET payroll_cycle_id = NULL WHERE payroll_cycle_id = ANY($1)', [oldCIds]);
        }
        await client.query('DELETE FROM payroll_periods WHERE id = ANY($1)', [oldPIds.length > 0 ? oldPIds : [0]]);
        await client.query('DELETE FROM payroll_cycles WHERE id = ANY($1)', [oldCIds.length > 0 ? oldCIds : [0]]);

        const cycleStartDates = {};
        for (const p of periods) {
          if (p.start_date && (!cycleStartDates[p.cycle_id] || p.start_date < cycleStartDates[p.cycle_id])) {
            cycleStartDates[p.cycle_id] = p.start_date;
          }
        }

        for (const c of cycles) {
          await client.query(
            `INSERT INTO payroll_cycles (id, code, name, cycle_type, periods_per_year, enabled, created_at, start_date)
             VALUES ($1,$2,$3,$4,$5,$6,NOW(),$7)`,
            [c.id, c.code, c.name, c.cycle_type, c.periods_per_year, c.enabled, cycleStartDates[c.id] || null]
          );
          cyclesInserted++;
        }

        for (const p of periods) {
          await client.query(
            `INSERT INTO payroll_periods (id, cycle_id, period_number, tax_year, tax_period, financial_year, financial_period, start_date, end_date, payment_date, processing_month, cycle_mode_id, status, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())`,
            [p.id, p.cycle_id, p.period_number, p.tax_year, p.tax_period, p.financial_year, p.financial_period, p.start_date, p.end_date, p.payment_date, p.processing_month, p.cycle_mode_id, p.status]
          );
          periodsInserted++;
        }

        if (cyclesInserted > 0) await client.query(`SELECT setval('payroll_cycles_id_seq', (SELECT COALESCE(MAX(id), 1) FROM payroll_cycles))`);
        if (periodsInserted > 0) await client.query(`SELECT setval('payroll_periods_id_seq', (SELECT COALESCE(MAX(id), 1) FROM payroll_periods))`);

        if (cyclesInserted !== cycles.length || periodsInserted !== periods.length) {
          throw new Error(`Incomplete import: expected ${cycles.length} cycles and ${periods.length} periods, got ${cyclesInserted} and ${periodsInserted}`);
        }

        await client.query(
          `INSERT INTO conversion_logs (conversion_type, file_name, status, total_rows, inserted_rows, skipped_rows, error_message, details, created_by, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
          ['payroll-cycles-periods', fileName || 'upload', 'success',
           cycles.length + periods.length, cyclesInserted + periodsInserted, 0,
           null,
           JSON.stringify({ cycles: cyclesInserted, periods: periodsInserted }), userId]
        );
        await client.query('COMMIT');
        return { success: true, inserted: cyclesInserted + periodsInserted, skipped: [], total: cycles.length + periods.length,
          warnings: [`${cyclesInserted} cycles inserted, ${periodsInserted} periods inserted`, ...previewResult.warnings] };
      } catch (err) { await client.query('ROLLBACK'); throw err; } finally { client.release(); }
    }
  },

  'employee-retirement-funds': {
    name: 'Employee Retirement Funds',
    description: 'Employee retirement fund enrolments (pension, provident, retirement annuity)',
    targetTable: 'employee_retirement_funds',
    requiredTabs: ['EmpBenefitdetail'],
    category: 'benefits',

    async preview(workbook) {
      const sheet = workbook.Sheets['EmpBenefitdetail'];
      if (!sheet) return { valid: false, error: 'Excel must contain tab: EmpBenefitdetail' };
      const data = XLSX.utils.sheet_to_json(sheet);
      if (!data.length || !data[0].EmployeeBenefit_ID) return { valid: false, error: 'Expected column: EmployeeBenefit_ID' };

      const rows = data.map(r => ({
        id: r.EmployeeBenefit_ID,
        employee_id: r.EmployeeId,
        fund_type_id: r.BenefitSchemeID,
        fund_number: r.ReferenceNo ? String(r.ReferenceNo) : null,
        join_date: excelDateToISO(r.JoinDate) || '2025-01-01',
        termination_date: excelDateToISO(r.TerminationDate),
        employer_amount: r.EmployerContribution || 0,
        employee_amount: r.EmployeeContribution || 0,
        is_private: r.IsPrivate === 1,
        is_current: r.IsCurrent === 1
      }));

      return {
        valid: true, totalRows: rows.length,
        tabs: { EmpBenefitdetail: data.length },
        warnings: [],
        sampleRows: rows.slice(0, 5),
        columnMapping: {
          'EmployeeBenefit_ID → id': 'Original ID',
          'EmployeeId → employee_id': 'FK to employees',
          'BenefitSchemeID → fund_type_id': 'FK to retirement_fund_types',
          'ReferenceNo → fund_number': 'Fund membership number',
          'JoinDate → join_date': 'Enrolment date',
          'TerminationDate → termination_date': 'Termination date',
          'EmployerContribution → employer_amount': 'Employer contribution amount',
          'EmployeeContribution → employee_amount': 'Employee contribution amount',
          'IsPrivate → is_private': 'Private fund flag',
          'IsCurrent → is_current': 'Current enrolment flag'
        },
        _rows: rows
      };
    },

    async execute(workbook, userId, fileName) {
      const previewResult = await this.preview(workbook);
      if (!previewResult.valid) throw new Error(previewResult.error);
      const rows = previewResult._rows;
      const client = await getClient();
      let inserted = 0, updated = 0;
      const skipped = [];

      try {
        await client.query('BEGIN');

        const validEmps = new Set((await client.query('SELECT id FROM employees')).rows.map(r => r.id));
        const validFunds = new Set((await client.query('SELECT id FROM retirement_fund_types')).rows.map(r => r.id));

        for (const r of rows) {
          if (!validEmps.has(r.employee_id)) { skipped.push({ id: r.id, name: 'EmpID ' + r.employee_id, reason: 'Employee not found' }); continue; }
          if (!validFunds.has(r.fund_type_id)) { skipped.push({ id: r.id, name: 'FundID ' + r.fund_type_id, reason: 'Retirement fund type not found' }); continue; }

          await client.query('SAVEPOINT row_sp');
          try {
            const res = await client.query(
              `INSERT INTO employee_retirement_funds (id, employee_id, fund_type_id, fund_number, join_date, termination_date, employee_amount, employer_amount, is_private, is_current, created_at, updated_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())
               ON CONFLICT (id) DO UPDATE SET
                employee_id=EXCLUDED.employee_id, fund_type_id=EXCLUDED.fund_type_id, fund_number=EXCLUDED.fund_number,
                join_date=EXCLUDED.join_date, termination_date=EXCLUDED.termination_date,
                employee_amount=EXCLUDED.employee_amount, employer_amount=EXCLUDED.employer_amount,
                is_private=EXCLUDED.is_private, is_current=EXCLUDED.is_current, updated_at=NOW()
               RETURNING (xmax = 0) AS is_insert`,
              [r.id, r.employee_id, r.fund_type_id, r.fund_number, r.join_date, r.termination_date,
               r.employee_amount, r.employer_amount, r.is_private, r.is_current]
            );
            await client.query('RELEASE SAVEPOINT row_sp');
            if (res.rows[0].is_insert) inserted++; else updated++;
          } catch (err) { await client.query('ROLLBACK TO SAVEPOINT row_sp'); skipped.push({ id: r.id, name: 'EmpID ' + r.employee_id, reason: err.message }); }
        }

        if ((inserted + updated) > 0) await client.query(`SELECT setval('employee_retirement_funds_id_seq', (SELECT COALESCE(MAX(id), 1) FROM employee_retirement_funds))`);

        await client.query(
          `INSERT INTO conversion_logs (conversion_type, file_name, status, total_rows, inserted_rows, skipped_rows, error_message, details, created_by, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
          ['employee-retirement-funds', fileName || 'upload', (inserted + updated) > 0 ? 'success' : 'failed',
           rows.length, inserted + updated, skipped.length,
           skipped.length > 0 ? JSON.stringify(skipped.slice(0, 50)) : null,
           JSON.stringify({ inserted, updated }), userId]
        );
        await client.query('COMMIT');
        return { success: (inserted + updated) > 0, inserted: inserted + updated, skipped, total: rows.length,
          warnings: [`${inserted} enrolments inserted, ${updated} updated`] };
      } catch (err) { await client.query('ROLLBACK'); throw err; } finally { client.release(); }
    }
  }
};

router.get('/types', authenticate, async (req, res, next) => {
  try {
    const types = [];
    for (const [key, conv] of Object.entries(converters)) {
      if (key.endsWith('_LEGACY')) continue;
      let currentCount = 0;
      if (conv.targetTable) {
        const countResult = await dbQuery(`SELECT COUNT(*) AS c FROM ${conv.targetTable}`);
        currentCount = parseInt(countResult.rows[0].c);
      }
      const lastLog = await dbQuery(
        `SELECT created_at, status, inserted_rows, total_rows FROM conversion_logs WHERE conversion_type = $1 ORDER BY created_at DESC LIMIT 1`, [key]
      );
      types.push({
        key, name: conv.name, description: conv.description, category: conv.category,
        targetTable: conv.targetTable,
        requiredTabs: conv.requiredTabs,
        currentCount,
        lastImport: lastLog.rows[0] || null
      });
    }
    res.json({ success: true, data: types });
  } catch (err) { next(err); }
});

router.post('/preview', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    const { type } = req.body;
    if (!type || !converters[type]) return res.status(400).json({ success: false, error: 'Invalid conversion type' });
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const result = await converters[type].preview(workbook);
    if (result._rows) delete result._rows;
    if (result._grades) { delete result._grades; delete result._notches; }
    if (result._cycles) { delete result._cycles; delete result._periods; }
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.post('/execute', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    const { type } = req.body;
    if (!type || !converters[type]) return res.status(400).json({ success: false, error: 'Invalid conversion type' });
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const fileName = req.file.originalname || 'upload';
    const result = await converters[type].execute(workbook, req.user?.id || null, fileName);
    const isSuccess = result.inserted > 0;
    res.json({ success: isSuccess, data: result });
  } catch (err) {
    console.error('Conversion execution error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/history', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT * FROM conversion_logs ORDER BY created_at DESC LIMIT 50`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
});

module.exports = router;
