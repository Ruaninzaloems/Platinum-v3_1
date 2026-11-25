import { buildPayrollCsv } from './payroll-csv';
import { PayrollProcessingRowDto } from '../../../../core/models/overtime-workflow.model';

describe('payroll CSV organisational fields', () => {
  const row = (id: string): PayrollProcessingRowDto => ({
    id, employeeId: id, employeeName: 'Test Employee', overtimeDate: '2026-08-01',
    salaryHeadId: 1, salaryHeadName: 'Overtime', hours: 2, amount: 100,
    isExcess: false, status: 3, statusLabel: 'Awaiting Payroll',
    departmentName: 'Community Services', divisionName: 'Fire Services',
    legacyDepartmentName: null, legacyDivisionName: null
  });

  it('exports resolved department and division for all rows with empty legacy fields', () => {
    const csv = buildPayrollCsv([row('1'), row('2')], new Set());
    expect(csv.split('\r\n')).toHaveLength(3);
    expect(csv.match(/Community Services,Fire Services/g)).toHaveLength(2);
  });

  it('exports only selected rows and uses the same resolved labels', () => {
    const csv = buildPayrollCsv([row('1'), row('2')], new Set(['2']));
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('Test Employee,2,');
    expect(lines[1]).toContain('Community Services,Fire Services');
  });

  it('keeps CSV quoting and spreadsheet formula escaping for organisational labels', () => {
    const item = row('1');
    item.departmentName = 'Community, Safety';
    item.divisionName = '=invalid';
    expect(buildPayrollCsv([item], new Set())).toContain('"Community, Safety",\'=invalid');
  });
});
