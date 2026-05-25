export type CycleStatus = 'Draft' | 'Open' | 'Closed' | 'Archived';

export interface Cycle {
  id: number;
  financialYearLabel: string;
  startDate: string;
  endDate: string;
  status: CycleStatus;
}

export interface KpiGroup {
  id: number;
  cycleId: number;
  code: string;
  name: string;
  parentId: number | null;
  isActive: boolean;
  sortOrder: number;
}

export interface DataType {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
}

export interface UnitOfMeasure {
  id: number;
  cycleId: number;
  name: string;
  abbreviation: string;
  isActive: boolean;
}

export interface ProgressStatus {
  id: number;
  cycleId: number;
  code: string;
  name: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ScorecardType {
  id: number;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface SubmissionDeadline {
  id: number;
  cycleId: number;
  quarter: number;
  deadlineDate: string;
  reminderDaysBefore?: number;
  isActive: boolean;
}

export type ReportFieldReportType = 'quarterly' | 'midYear' | 'annual';
export type ReportFieldFieldType = 'text' | 'number' | 'date' | 'boolean' | 'textarea';

export interface ReportField {
  id: number;
  cycleId: number;
  reportType: ReportFieldReportType;
  fieldName: string;
  fieldLabel: string;
  fieldType: ReportFieldFieldType;
  isRequired: boolean;
  sortOrder: number;
}

export type AppNotificationType = 'reminder' | 'escalation' | 'info' | 'warning';

export interface AppNotification {
  id: number;
  userId?: number;
  type: AppNotificationType | string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface NotificationConfig {
  id: number;
  cycleId: number;
  eventType: string;
  daysBefore: number;
  isEmail: boolean;
  isInApp: boolean;
  isActive: boolean;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  userId?: number;
  userName: string;
  action: string;
  entityType: string;
  entityId?: number | string;
  oldValue?: string | null;
  newValue?: string | null;
}

export interface AuditLogResponse {
  data: AuditLog[];
  total?: number;
}

export interface WorkflowConfig {
  id: number;
  scorecardTypeId?: number | null;
  stepName: string;
  stepOrder: number;
  requiredRole: string;
  description?: string;
  isActive: boolean;
}

export type NkpaScope = 'organisational' | 'departmental';

export interface NkpaWeighting {
  id: number;
  cycleId: number;
  nkpaName: string;
  weight: number;
  scope: NkpaScope;
  departmentId?: number | null;
}

export interface CompetencyRequirement {
  id: number;
  cycleId: number;
  name: string;
  description?: string;
  weight: number;
  isActive: boolean;
  sortOrder: number;
}

export interface IntegrationSyncLog {
  id: number;
  integrationType: string;
  direction: string;
  entityType: string;
  recordCount: number | null;
  status: string;
  syncedAt: string;
}

export interface IdpObjective {
  id: number;
  code: string;
  description: string;
  chapter?: string | null;
}

export type ReportType = 'quarterly' | 'mid-year' | 'annual' | 'institutional-evaluation';

export interface ReportRun {
  id: number;
  cycleId: number;
  reportType: ReportType | string;
  title: string;
  quarter?: number | null;
  status: string;
  generatedAt?: string | null;
  departmentId?: number | null;
}

export interface AiRiskSummary { high?: number; medium?: number; low?: number; }
export interface AiDashboard {
  riskSummary?: AiRiskSummary;
  topRecommendations?: string[];
}
export interface AtRiskKpi {
  kpiDescription: string;
  department?: string;
  currentScore?: number | null;
  riskLevel?: 'high' | 'medium' | 'low';
  reason?: string;
  recommendation?: string;
}
export interface AtRiskKpisResponse { summary?: string; atRiskKpis?: AtRiskKpi[]; }
export interface NarrativeSummary {
  narrative?: string;
  highlights?: string[];
  concerns?: string[];
  recommendations?: string[];
}
export interface EvidenceGap {
  kpiDescription: string;
  department?: string;
  quarter?: number;
  gapType?: string;
  severity?: 'high' | 'medium' | 'low';
  suggestion?: string;
}
export interface EvidenceGapsResponse { summary?: string; gaps?: EvidenceGap[]; }
export interface AlignmentIssue {
  sourceModule?: string;
  targetModule?: string;
  severity?: 'high' | 'medium' | 'low';
  issue?: string;
  recommendation?: string;
}
export interface AlignmentCheckResponse { summary?: string; overallScore?: number; alignmentIssues?: AlignmentIssue[]; }
export interface AiInsightLog {
  id: number;
  insightType: string;
  summary?: string;
  riskLevel?: 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface ReviewerAssignment {
  id: number;
  cycleId: number;
  employeeId: number;
  primaryReviewerId: number;
  secondaryReviewerId?: number | null;
  changeReason?: string | null;
  version: number;
  isActive: boolean;
}

export type ModerationOutcome = 'Confirmed' | 'Adjusted' | 'Rejected';
export interface Moderation {
  id: number;
  actualId: number;
  kpiId: number;
  quarter: number;
  outcome: ModerationOutcome | string;
  scoreAdjustmentReason?: string;
  adjustedScore?: number | null;
  notes?: string;
  createdAt?: string;
}

export type ScorecardStatus = 'Draft' | 'Submitted' | 'Reviewed' | 'Approved';

export interface Scorecard {
  id: number;
  name: string;
  cycleId: number;
  scorecardType: string;
  departmentId?: number | null;
  status: ScorecardStatus | string;
  approvedById?: number | null;
  approvedAt?: string | null;
  approvalComments?: string | null;
  createdById: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScorecardKpi {
  id: number;
  scorecardId: number;
  kpiNumber: string;
  description: string;
  idpReference?: string | null;
  strategicObjective?: string | null;
  programme?: string | null;
  responsiblePostId?: number | null;
  custodianPostId?: number | null;
  baseline?: string | null;
  annualTarget: string;
  annualBudgetTarget?: number | null;
  evidenceSource?: string | null;
  evidencePortfolio?: string | null;
  weighting: number;
  fundingSource?: string | null;
  budgetDescription?: string | null;
  unitOfMeasureId?: number | null;
  dataTypeId?: number | null;
  kpiGroupId?: number | null;
  status: ScorecardStatus | string;
  isCumulative: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface KpiQuarterTarget {
  id: number;
  kpiId: number;
  quarter: number;
  targetValue: string;
  budgetValue?: number | null;
  evidenceExpected?: string | null;
  isApprovedBaseline: boolean;
}

export interface KpiMonthActivity {
  id: number;
  kpiId: number;
  quarter: number;
  month: number;
  description: string;
  dueDate: string;
  ownerId?: number | null;
  status: string;
  completedAt?: string | null;
}

export type ReviewAction = 'approve' | 'return' | 'comment';
export interface Review {
  id: number;
  actualId: number;
  kpiId: number;
  quarter: number;
  action: ReviewAction | string;
  comments?: string;
  returnReason?: string;
  assessmentRating?: number | null;
  createdAt?: string;
}
