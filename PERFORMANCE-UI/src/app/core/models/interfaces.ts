export interface PerformanceCycle {
  id: number;
  name: string;
  financialYear: string;
  startDate: string;
  endDate: string;
  status: string;
  isCurrent: boolean;
}

export interface Scorecard {
  id: number;
  name: string;
  cycleId: number;
  departmentId?: number;
  departmentName?: string;
  status: string;
  totalKpis: number;
  achievedKpis: number;
  overallScore?: number;
}

export interface ScorecardKpi {
  id: number;
  scorecardId: number;
  kpiNumber: string;
  indicator: string;
  baseline: string;
  annualTarget: string;
  unitOfMeasure: string;
  weight: number;
  status: string;
  groupName?: string;
  nkpa?: string;
  quarterTargets?: QuarterTarget[];
}

export interface QuarterTarget {
  quarter: number;
  target: string;
  actual?: string;
  status?: string;
  evidence?: string;
  variance?: number;
}

export interface KpiActual {
  id: number;
  kpiId: number;
  quarter: number;
  actualValue: string;
  evidenceUrl?: string;
  comments?: string;
  status: string;
  submittedBy?: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface DashboardSummary {
  totalKpis: number;
  achieved: number;
  atRisk: number;
  missed: number;
  pending: number;
  pendingEvidence: number;
  overallScore: number;
  departmentScores: DepartmentScore[];
  quarterlyTrend: QuarterlyTrend[];
}

export interface DepartmentScore {
  departmentId: number;
  departmentName: string;
  score: number;
  totalKpis: number;
  achieved: number;
  rank: number;
}

export interface QuarterlyTrend {
  quarter: string;
  achieved: number;
  pending: number;
  missed: number;
}

export interface SdbipItem {
  id: number;
  scorecardId: number;
  kpiNumber: string;
  objectiveRef: string;
  indicator: string;
  baseline: string;
  annualTarget: string;
  q1Target: string;
  q2Target: string;
  q3Target: string;
  q4Target: string;
  ward?: string;
  budget?: number;
  status: string;
}

export interface IndividualAgreement {
  id: number;
  employeeId: string;
  employeeName: string;
  designation: string;
  department: string;
  cycleId: number;
  status: string;
  overallScore?: number;
  kpaCount: number;
}

export interface AuditLogEntry {
  id: number;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userName: string;
  details: string;
  timestamp: string;
}

export interface KpiGroup {
  id: number;
  name: string;
  code: string;
  description?: string;
  sortOrder: number;
}

export interface UnitOfMeasure {
  id: number;
  name: string;
  symbol: string;
  description?: string;
}

export interface ProgressStatus {
  id: number;
  name: string;
  color: string;
  icon: string;
  sortOrder: number;
}

export interface NkpaWeighting {
  id: number;
  nkpaName: string;
  weight: number;
  cycleId: number;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}
