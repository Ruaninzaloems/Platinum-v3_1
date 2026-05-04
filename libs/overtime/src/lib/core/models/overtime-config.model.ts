export interface OvertimeConfig {
  id?: string;
  allowOvertimeMultipleApproval: boolean;
  startDate?: string | null;
  countingPeriodStartDay: number;
  countingPeriodEndDay: number;
  maximumMonthlyOvertimeHours: number;
  exceptionalMaximumOvertimeHours: number;
  updatedAt?: string;
  updatedBy?: string | null;
}
