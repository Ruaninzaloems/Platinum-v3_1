export interface ReportingRelationship {
  id?: string;
  reportsToPositionId: string;
  reportsToPositionDescription: string;
  startDate: string;
  endDate?: string | null;
}

export interface ActingAppointment {
  id?: string;
  actingEmployeeId: string;
  actingEmployeeName: string;
  actingInPositionId: string;
  actingInPositionDescription: string;
  startDate: string;
  endDate: string;
}

export interface PositionApprovalConfig {
  id?: string;
  positionId: string;
  positionDescription: string;
  isOvertimeRecommender: boolean;
  isOvertimeApprover: boolean;
  isDepartmentExcessOvertimeApprover: boolean;
  reportingRelationships: ReportingRelationship[];
  actingAppointments: ActingAppointment[];
  updatedAt?: string;
  updatedBy?: string | null;
}

export interface PositionLookup {
  id: string;
  positionCode: string;
  description: string;
  departmentId: string;
  departmentName: string;
  employeeId: string;
  employeeCode: string;
  employeeFirstName: string;
  employeeSurname: string;
}

export interface EmployeeLookup {
  id: string;
  employeeNumber: string;
  fullName: string;
  empCode: string;
  idNo: string;
  departmentId: string;
  departmentName: string;
  divisionId: string;
  divisionName: string;
  positionId: string;
  positionDescription: string;
}

export interface DepartmentLookup {
  id: string;
  departmentCode: string;
  description: string;
}

export interface PositionListItem {
  id: string;
  positionCode: string;
  description: string;
  departmentId: string;
  departmentName: string;
  divisionId: string;
  divisionCode: string;
  divisionName: string;
  isConfigured: boolean;
  employeeId: string;
  employeeCode: string;
  employeeFirstName: string;
  employeeSurname: string;
  reportsToPositionDescription: string;
}

export interface PositionsSummary {
  total: number;
  configured: number;
  notConfigured: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type PositionStatusFilter = 'all' | 'configured' | 'notconfigured';

// ── Import / bulk-upload types ────────────────────────────────────────────────

export interface PositionConfigChange {
  positionId: string;
  description: string;
  isRecommender: boolean;
  isApprover: boolean;
  isDeptExcessApprover: boolean;
}

export interface ReportingRelationshipChange {
  positionId: string;
  reportsToPositionId: string;
  startDate: string;
  endDate?: string | null;
}

export interface ActingAppointmentChange {
  actingEmployeeId: string;
  actingInPositionId: string;
  startDate: string;
  endDate: string;
}

export interface ImportRowError {
  sheet: string;
  row: number;
  error: string;
}

export interface ImportValidationResult {
  positionConfigChanges: PositionConfigChange[];
  reportingRelationshipChanges: ReportingRelationshipChange[];
  actingAppointmentChanges: ActingAppointmentChange[];
  errors: ImportRowError[];
  acceptedRows: number;
  errorRows: number;
}

export interface ImportConfirmResult {
  positionsUpdated: number;
  reportingRelationshipsApplied: number;
  actingAppointmentsApplied: number;
}

export interface ConfirmImportRequest {
  positionConfigChanges: PositionConfigChange[];
  reportingRelationshipChanges: ReportingRelationshipChange[];
  actingAppointmentChanges: ActingAppointmentChange[];
}
