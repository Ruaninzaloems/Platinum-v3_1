export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiListParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  department?: string;
  [key: string]: any;
}

export interface Money {
  amount: number;
  currency: string; // ZAR
}

export interface MscoaSegment {
  fund: string;        // e.g. "FND001"
  function: string;    // e.g. "FUN0410"
  project: string;     // e.g. "PRJ00001"
  costing: string;     // e.g. "CST0001"
  region: string;      // e.g. "REG001"
  muncipalVote: string; // e.g. "VT0020"
  item: string;        // e.g. "ITM4200001"
  fullCode?: string;   // concatenated
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  url?: string;
  category?: string;
}

export interface AuditEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
  performedByName: string;
  performedAt: string;
  details: string;
  ipAddress?: string;
  previousValue?: any;
  newValue?: any;
}

export interface ApprovalAction {
  id: string;
  step: number;
  role: string;
  userId?: string;
  userName?: string;
  action: 'pending' | 'approved' | 'rejected' | 'returned';
  comments?: string;
  actionDate?: string;
  delegatedFrom?: string;
}

export interface WorkflowStatus {
  currentStep: string;
  currentApprover?: string;
  approvalChain: ApprovalAction[];
  history: AuditEntry[];
}

export type DocumentStatus = 'draft' | 'submitted' | 'pending_approval' | 'approved' | 'rejected' | 'returned' | 'cancelled' | 'completed' | 'closed';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface DashboardKpi {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'stable';
  icon?: string;
  color?: string;
}

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  message: string;
  category: string;
  timestamp: string;
  read?: boolean;
  actionUrl?: string;
}
