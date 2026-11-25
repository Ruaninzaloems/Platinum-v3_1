import { PayrollProcessingRowDto } from '../../../../core/models/overtime-workflow.model';

/** Export exactly the resolved labels used by the payroll review table. */
export function buildPayrollCsv(
  rows: PayrollProcessingRowDto[],
  selectedIds: ReadonlySet<string>
): string {
  const exportRows = selectedIds.size > 0 ? rows.filter(r => selectedIds.has(r.id)) : rows;
  const escape = (val: string | number | null | undefined): string => {
    let s = val == null ? '' : String(val);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const headers = [
    'Employee', 'Employee ID', 'Position', 'Date', 'Start', 'End',
    'OT Type', 'Hours', 'Amount', 'Department', 'Division',
    'Recommender', 'Approver', 'Status', 'Excess'
  ];
  const lines = [headers.join(',')];
  for (const r of exportRows) {
    const date = r.overtimeDate
      ? new Date(r.overtimeDate).toLocaleDateString('en-ZA',
        { day: '2-digit', month: 'short', year: 'numeric' }) : '';
    lines.push([
      r.employeeName, r.employeeId, r.positionDescription || r.positionId || '',
      date, r.startTime || '', r.endTime || '', r.salaryHeadName, r.hours, r.amount,
      r.departmentName || '', r.divisionName || '', r.recommenderEmployeeName || '',
      r.approverEmployeeName || '', r.statusLabel, r.isExcess ? 'Yes' : ''
    ].map(escape).join(','));
  }
  return lines.join('\r\n');
}
