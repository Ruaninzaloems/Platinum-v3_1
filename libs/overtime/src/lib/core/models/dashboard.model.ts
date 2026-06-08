export interface DashboardSummaryDto {
  awaitingMyRecommendation: number;
  awaitingMyApproval: number;
  awaitingPayrollCapture: number;
  awaitingPayrollApproval: number;
  capturedByMeInProgress: number;
  returnedToMe: number;
  totalTransactionsThisTaxYear: number;
  totalHoursThisTaxYear: number;
  totalProcessedThisTaxYear: number;
  totalInProgress: number;
}

export interface PayrollCycleStatusDto {
  payroll: string;
  cycleType: string;
  period: string;
  status: string;
}

export interface PayrollCyclesResponseDto {
  taxYear: string;
  cycles: PayrollCycleStatusDto[];
}
