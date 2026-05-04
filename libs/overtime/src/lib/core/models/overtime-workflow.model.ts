export enum WorkflowStatus {
  Requested = 0,
  Recommended = 1,
  ApprovedForPayment = 2,
  AwaitingPayrollApproval = 3,
  Processed = 4,
  Returned = 5,
  Rejected = 99
}

export interface MeDto {
  userId: string;
  displayName: string;
  employeeId: string;
  employeeName: string;
  positionId: string;
  positionDescription: string;
  isCapturer: boolean;
  isRecommender: boolean;
  isApprover: boolean;
  isExcessApprover: boolean;
  isPayrollCapturer: boolean;
  isPayrollApprover: boolean;
  canAccessConfig: boolean;
  canAccessCapture: boolean;
  canAccessPayroll: boolean;
  canAccessEnquiry: boolean;
  availableUsers?: MeDto[];
}

// -----------------------------------------------------------------------
// Payroll Processing page DTOs
// -----------------------------------------------------------------------

export interface PayrollProcessingRowDto {
  id: string;
  employeeId: string;
  employeeName: string;
  legacyEmployeeId?: number | null;
  legacyDepartmentId?: number | null;
  legacyDepartmentName?: string | null;
  legacyDivisionId?: number | null;
  legacyDivisionName?: string | null;
  positionId?: string | null;
  positionDescription?: string | null;
  overtimeDate: string;
  salaryHeadName: string;
  salaryHeadId: number;
  startTime?: string | null;
  endTime?: string | null;
  hours: number;
  amount: number;
  recommenderEmployeeName?: string | null;
  approverEmployeeName?: string | null;
  capturedByName?: string | null;
  isExcess: boolean;
  periodId?: number | null;
  periodName?: string | null;
  cycleId?: number | null;
  cycleName?: string | null;
  status: number;
  statusLabel: string;
}

export interface PayrollProcessingSummaryDto {
  totalRows: number;
  totalHours: number;
  totalAmount: number;
  rows: PayrollProcessingRowDto[];
}

export interface SendToPayrollRequest {
  selectedIds: string[];
  periodId: number;
}

export interface OvertimeDocumentDto {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedBy?: string | null;
  uploadedAt: string;
}

export interface WorkflowEventDto {
  id: string;
  fromStatus: WorkflowStatus;
  toStatus: WorkflowStatus;
  actionedBy?: string | null;
  comments?: string | null;
  actionedAt: string;
}

export interface OvertimeTransactionDto {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentId: string;
  departmentName: string;
  positionId: string;
  // Legacy payroll classification snapshots picked from the dropdowns.
  // Optional for back-compat with rows captured before the pickers shipped.
  legacyDepartmentId?: number | null;
  legacyDepartmentName?: string | null;
  legacyDivisionId?: number | null;
  legacyDivisionName?: string | null;
  overtimeDate: string;
  startTime?: string | null;
  endTime?: string | null;
  hours: number;
  hoursAlreadyCapturedThisMonth: number;
  isExcess: boolean;
  salaryHeadId: number;
  salaryHeadName: string;
  formulaSnapshot: string;
  amount: number;
  reason?: string | null;
  status: WorkflowStatus;
  statusLabel: string;
  recommenderEmployeeName?: string | null;
  approverEmployeeName?: string | null;
  excessApproverEmployeeName?: string | null;
  payrollCapturerEmployeeName?: string | null;
  payrollApproverEmployeeName?: string | null;
  currentAssigneeUserId?: string | null;
  capturedBy?: string | null;
  capturedByName?: string | null;
  capturedByEmployeeName?: string | null;
  capturedByEmployeeId?: string | null;
  createdAt: string;
  updatedAt: string;
  documents: OvertimeDocumentDto[];
  workflowHistory: WorkflowEventDto[];
}

export interface CreateOvertimeTransactionRequest {
  employeeId: string;
  overtimeDate: string;       // ISO date (yyyy-mm-dd)
  startTime?: string | null;  // "HH:mm"
  endTime?: string | null;
  hours: number;
  salaryHeadId: number;
  reason?: string | null;
  legacyDepartmentId?: number | null;
  legacyDivisionId?: number | null;
}

export interface UpdateOvertimeTransactionRequest {
  overtimeDate: string;       // ISO date (yyyy-mm-dd)
  startTime?: string | null;  // "HH:mm"
  endTime?: string | null;
  hours: number;
  salaryHeadId: number;
  reason?: string | null;
  legacyDepartmentId?: number | null;
  legacyDivisionId?: number | null;
}

export interface AmountPreviewRequest {
  employeeId: string;
  salaryHeadId: number;
  hours: number;
}

export interface AmountPreviewDto {
  amount: number;
  formula: string;
  salaryHeadName: string;
  inputs: Record<string, number>;
}

export interface OvertimeTypeOption {
  salaryHeadId: number;
  salaryHeadName: string;
  salaryHeadTitle: string;
  irp5Code?: number | null;
  irp5CodeDesc?: string | null;
  formula?: string | null;
}

export interface WorkflowActionRequest {
  comments?: string | null;
}

export const WORKFLOW_STATUS_LABEL: Record<WorkflowStatus, string> = {
  [WorkflowStatus.Requested]: 'Requested',
  [WorkflowStatus.Recommended]: 'Recommended',
  [WorkflowStatus.ApprovedForPayment]: 'Approved for Payment',
  [WorkflowStatus.AwaitingPayrollApproval]: 'Awaiting Payroll Approval',
  [WorkflowStatus.Processed]: 'Processed',
  [WorkflowStatus.Returned]: 'Returned',
  [WorkflowStatus.Rejected]: 'Rejected'
};
