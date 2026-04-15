export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  title?: string;
  designation?: string;
  department?: string;
  avatarUrl?: string;
  tenantId: string;
  tenantName?: string;
  roles: string[];
  permissions: string[];
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface FinancialYear {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  status: string;
  isCurrent: boolean;
  tenantId: string;
}

export interface AfsTemplate {
  id: string;
  name: string;
  description?: string;
  type: string;
  version: string;
  status: string;
  specimenYear?: string;
  columnLayout?: ColumnDef[];
  sections?: TemplateSection[];
  isLocked: boolean;
  isSystemDefault?: boolean;
  sourceTemplateId?: string;
  tenantId?: string;
  versionNumber: number;
  versionLabel?: string;
  parentTemplateId?: string;
  isCurrentVersion: boolean;
  createdAt: string;
}

export interface ColumnDef {
  key: string;
  label: string;
  dataType: string;
  width: number;
}

export interface TemplateSection {
  id: string;
  title: string;
  noteNumber?: string;
  grapReference?: string;
  sortOrder: number;
  depth: number;
  sectionType: string;
  isActive?: boolean;
  applicability?: { categories?: string[]; allCategories?: boolean };
  lineItems?: TemplateLineItem[];
  childSections?: TemplateSection[];
}

export interface TemplateLineItem {
  id: string;
  label: string;
  code?: string;
  sortOrder: number;
  lineType: string;
  dataType: string;
  formula?: string;
  grapReference?: string;
  noteReference?: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderlined: boolean;
  isTotal: boolean;
  isSubTotal: boolean;
  indentLevel: number;
  isActive?: boolean;
  defaultValue?: string;
  applicability?: { categories?: string[]; allCategories?: boolean };
}

export interface MappingRule {
  id: string;
  tenantId: string;
  templateId: string;
  glAccountCode: string;
  glAccountName?: string;
  lineItemId?: string;
  scoaAccountNumber?: string;
  scoaDescription?: string;
  mscoaSegment?: string;
  mscoaItemCode?: string;
  mscoaFunctionCode?: string;
  mscoaFundCode?: string;
  mappingType: string;
  allocationPercentage: number;
  status: string;
  workflowStatus: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  changeReason?: string;
  isAutoSuggested: boolean;
  lineItem?: TemplateLineItem;
  createdAt?: string;
  updatedAt?: string;
  currentYearBalance?: number;
  priorYearBalance?: number;
  voteNumber?: string;
  voteDescription?: string;
  scoaLongDescription?: string;
  grapCategory?: string;
  grapReportingItem?: string;
  grapSubClass?: string;
}

export interface MappingDocument {
  id: string;
  mappingRuleId: string;
  tenantId: string;
  fileName: string;
  originalName: string;
  mimeType?: string;
  fileSize: number;
  uploadedBy?: string;
  description?: string;
  createdAt: string;
}

export interface DisclosureTreeNode {
  id: string;
  title: string;
  noteNumber?: string;
  grapReference?: string;
  sectionType: string;
  disclosureType?: string;
  depth: number;
  sortOrder: number;
  mappingStatus: 'mapped' | 'partial' | 'unmapped' | 'system_default' | 'locked';
  mappingCount: number;
  totalLineItems: number;
  mappedLineItems: number;
  isActive?: boolean;
  children: DisclosureTreeNode[];
  lineItems: DisclosureLineItemNode[];
}

export interface DisclosureLineItemNode {
  id: string;
  label: string;
  code?: string;
  lineType: string;
  grapReference?: string;
  noteReference?: string;
  indentLevel: number;
  sortOrder: number;
  mappingStatus: 'mapped' | 'partial' | 'unmapped' | 'system_default' | 'locked';
  mappingCount: number;
  isBold: boolean;
  isTotal: boolean;
  isActive?: boolean;
  sourceType?: 'tb' | 'manual' | 'mixed';
}

export interface MappingCoverageReport {
  totalLineItems: number;
  mappedLineItems: number;
  unmappedLineItems: number;
  coveragePercentage: number;
  totalMappings: number;
  byWorkflowStatus: Record<string, number>;
  unmappedAccounts: Array<{ code: string; name: string }>;
  sectionCoverage: Array<{ sectionId: string; title: string; total: number; mapped: number; percentage: number }>;
}

export interface MappingAuditEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  createdAt: string;
}

export interface Compilation {
  id: string;
  name: string;
  tenantId: string;
  templateId: string;
  financialYearId: string;
  status: string;
  completenessPercentage: number;
  periodFrom?: string;
  periodTo?: string;
  lastCalculatedAt?: string;
  preparedBy?: string;
  reviewedBy?: string;
  approvedBy?: string;
  draftVersion?: number;
  finalVersion?: number;
  versionHistory?: Array<{ version: number; type: string; createdAt: string; createdBy: string; status: string }>;
  isActive?: boolean;
  template?: { id: string; name: string; type: string; isSystemDefault?: boolean };
  financialYear?: FinancialYear;
  sections?: CompilationSection[];
  mappingCount?: number;
  calculationSummary?: any;
  parentEntityId?: string;
  isConsolidated?: boolean;
  validationErrors?: any[];
  hasMaterialException?: boolean;
  materialExceptionSource?: string;
}

export interface CompilationSection {
  id: string;
  title: string;
  noteNumber?: string;
  sortOrder: number;
  sectionType: string;
  metadata?: { columnLayout?: string; columns?: Array<{ key: string; label: string; subLabel?: string; group?: string }> };
  lineItems: CompilationSectionLineItem[];
}

export interface CompilationSectionLineItem {
  templateLineItem: TemplateLineItem;
  compilationLineItem: any;
  currentYearAmount: number;
  priorYearAmount: number;
  budgetAmount: number;
  varianceAmount: number;
  variancePercentage: number;
  isMaterialVariance: boolean;
  reviewStatus: string;
  noteText: string;
  narrativeText: string;
  glBreakdown: GlBreakdownEntry[];
  glBreakdownCount?: number;
  overrideAmount?: number | null;
  overrideReason?: string | null;
  overrideBy?: string | null;
  overrideAt?: string | null;
}

export interface GlBreakdownEntry {
  accountCode: string;
  accountName: string;
  amount: number;
  priorYearAmount?: number;
  budgetAmount?: number;
  tbEntryCount?: number;
  mscoaSegments: Record<string, string>;
}

export interface WorkingPaper {
  id: string;
  reference: string;
  title: string;
  description?: string;
  status: string;
  assignedTo?: string;
  preparedBy?: string;
  reviewedBy?: string;
  signedOffBy?: string;
  tickmarks?: Tickmark[];
  entries?: WorkingPaperEntry[];
}

export interface Tickmark {
  symbol: string;
  meaning: string;
  position: string;
  addedBy: string;
  addedAt: string;
}

export interface WorkingPaperEntry {
  id: string;
  entryType: string;
  content: string;
  tickmark?: string;
  amount?: number;
  reference?: string;
  createdBy: string;
  createdAt: string;
}

export interface Rfi {
  id: string;
  reference: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  requestedBy: string;
  assignedTo: string;
  dueDate: string;
  escalationLevel: number;
  externalReference?: string;
  evidenceIds?: string[];
  responses?: RfiResponseItem[];
  createdAt: string;
}

export interface RfiResponseItem {
  id: string;
  content: string;
  respondedBy: string;
  responseType: string;
  reviewStatus: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface AuditFinding {
  id: string;
  reference: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  category?: string;
  raisedBy: string;
  assignedTo?: string;
  financialImpact?: number;
  externalReference?: string;
  criteria?: string;
  condition?: string;
  cause?: string;
  effect?: string;
  recommendation?: string;
  evidenceIds?: string[];
  responses?: FindingResponseItem[];
  createdAt: string;
}

export interface FindingResponseItem {
  id: string;
  content: string;
  respondedBy: string;
  responseType: string;
  actionPlan?: string;
  targetDate?: string;
  reviewStatus: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface EvidenceDocument {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  sha256Hash: string;
  category?: string;
  description?: string;
  tags?: string[];
  uploadedBy: string;
  createdAt: string;
}

export interface Adjustment {
  id: string;
  reference: string;
  description: string;
  adjustmentType: string;
  status: string;
  effectiveDate: string;
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  preparedBy: string;
  lines?: AdjustmentLine[];
}

export interface AdjustmentLine {
  id: string;
  glAccountCode: string;
  glAccountName?: string;
  debitAmount: number;
  creditAmount: number;
  description?: string;
  mscoaSegment?: string;
  scoaItemCode?: string;
  scoaFunctionCode?: string;
  scoaFundCode?: string;
  scoaProjectCode?: string;
  scoaRegionCode?: string;
  scoaCostingCode?: string;
  ppid?: string;
}

export interface ScoaLookupItem {
  itemCode: string;
  shortDescription: string;
  segment: string;
  scoaFile: string;
}

export interface PpidLookupItem {
  ppid: string;
  projectName: string;
  description: string;
  budgetAmount: number;
  finYear: string;
}

export interface ExportJob {
  id: string;
  format: string;
  status: string;
  progress: number;
  fileName?: string;
  fileSize?: number;
  createdAt: string;
  exportMode?: 'official' | 'preview';
  versionNumber?: number;
  snapshotSchemaVersion?: string;
  afsVersionId?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  module?: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface MscoaChartVersion {
  id: string;
  version: string;
  label: string;
  description?: string;
  sourceFileName?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  status: string;
  isCurrent: boolean;
  segmentSummary?: Record<string, any>;
  totalAccounts: number;
  postingLevelAccounts: number;
  createdAt: string;
}

export interface MscoaChartItem {
  id: string;
  accountNumber: string;
  segment: string;
  scoaFile: string;
  description: string;
  shortDescription?: string;
  level: number;
  postingLevel: boolean;
  statementType?: string;
  l1?: string;
  l2?: string;
  l3?: string;
  l4?: string;
  l5?: string;
  l6?: string;
}

export interface MscoaGrapMapping {
  id: string;
  accountNumber: string;
  scoaDescription: string;
  prefix?: string;
  postingLevel: boolean;
  statementType?: string;
  category?: string;
  reportingItem?: string;
  subClass?: string;
  subClassBreakdown?: string;
  subClassBreakdownDetail?: string;
}

export interface MscoaSegmentInfo {
  segment: string;
  scoaFile: string;
  rootDescription: string;
  totalAccounts: string;
  postingAccounts: string;
}

export interface MscoaPaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MscoaVersionComparison {
  version1: { id: string; version: string; label: string; totalPostingAccounts: number };
  version2: { id: string; version: string; label: string; totalPostingAccounts: number };
  summary: { added: number; removed: number; changed: number; unchanged: number };
  bySegment: { added: Record<string, number>; removed: Record<string, number>; changed: Record<string, number> };
  added: { accountNumber: string; segment: string; description: string }[];
  removed: { accountNumber: string; segment: string; description: string }[];
  changed: { accountNumber: string; segment: string; oldDescription: string; newDescription: string }[];
  truncated: boolean;
  diffLimit: number;
}

export interface TbCategoryBreakdown {
  category: string;
  entryCount: number;
  totalClosing: number;
  totalBudget: number;
  budgetOriginal?: number;
  budgetAdjusted?: number;
  virementNet?: number;
  totalDebit: number;
  totalCredit: number;
  totalOpening?: number;
}

export interface TbSummary {
  totalEntries: number;
  totalAssets: number;
  totalLiabilities: number;
  netAssets: number;
  totalRevenue: number;
  totalExpenditure: number;
  gainsLosses: number;
  surplus: number;
  totalBudgetRevenue: number;
  totalBudgetExpenditure: number;
  budgetVarianceRevenue: number;
  budgetVarianceExpenditure: number;
  budgetOriginalRevenue?: number;
  budgetOriginalExpenditure?: number;
  budgetAdjustedRevenue?: number;
  budgetAdjustedExpenditure?: number;
  virementNetRevenue?: number;
  virementNetExpenditure?: number;
  budgetSource?: string;
}

export interface BudgetVsActual {
  category: string;
  actual: number;
  budget: number;
  variance: number;
  variancePercent: number;
}

export interface TbLineItem {
  item: string;
  actual: number;
  budget: number;
}

export interface IntegrityCheckDetail {
  accountCode: string;
  description: string;
  expectedValue: number;
  actualValue: number;
  difference: number;
  category?: string;
  itemType?: string;
  sourceFile?: string;
  sourceLineNumber?: number;
}

export interface IntegrityCheck {
  checkId: string;
  checkName: string;
  category: string;
  status: 'pass' | 'fail' | 'warning';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  expectedValue?: number;
  actualValue?: number;
  difference?: number;
  details: IntegrityCheckDetail[];
  columnLabels?: { expected?: string; actual?: string };
}

export interface IntegrityCheckResult {
  overallScore: number;
  totalChecks: number;
  passed: number;
  failed: number;
  warnings: number;
  checks: IntegrityCheck[];
  lastRunAt: string;
  financialYear: { id: string; label: string } | null;
}

export interface ReviewRequest {
  id: string;
  tenantId: string;
  compilationId: string;
  versionId?: string;
  requestedBy: string;
  requestType: string;
  scope: string;
  scopeDetails: Record<string, any>;
  message?: string;
  dueDate?: string;
  status: string;
  sentAt?: string;
  closedAt?: string;
  revokedAt?: string;
  revokedBy?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  recipients?: ReviewRecipient[];
  commentCount?: number;
}

export interface ReviewRecipient {
  id: string;
  recipientType: string;
  email?: string;
  displayName?: string;
  userId?: string;
  status: string;
  viewedAt?: string;
  respondedAt?: string;
  revokedAt?: string;
}

export interface ReviewComment {
  id: string;
  recipientId: string;
  recipientName?: string;
  recipientType?: string;
  isOwnComment?: boolean;
  targetType: string;
  targetId: string;
  commentText: string;
  parentCommentId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ExternalReviewData {
  requestId: string;
  recipientId: string;
  requestType: string;
  scope: string;
  message?: string;
  dueDate?: string;
  expiresAt: string;
  displayName?: string;
  content: {
    scope?: string;
    compilationName?: string;
    municipalityName?: string;
    financialYearLabel?: string;
    financialYearId?: string;
    currentYearLabel?: string;
    priorYearLabel?: string;
    templateName?: string;
    entityType?: string;
    demarcationCode?: string;
    province?: string;
    registrationNumber?: string;
    registeredOffice?: string;
    postalAddress?: string;
    telephone?: string;
    email?: string;
    website?: string;
    reportingPeriodStart?: string;
    reportingPeriodEnd?: string;
    levelOfAssurance?: string;
    auditor?: string;
    cfo?: string;
    accountingOfficer?: string;
    governanceMembers?: Array<{
      id: string;
      tableName: string;
      fullName: string;
      designation: string;
      dateAppointed?: string;
    }>;
    sections?: Array<{
      sectionId: string;
      title: string;
      sortOrder: number;
      sectionType: string;
      noteNumber?: string;
      statementType: string;
      items: Array<{
        label: string;
        lineType: string;
        indentLevel: number;
        isBold: boolean;
        isTotal: boolean;
        isSubTotal: boolean;
        noteReference: string;
        currentYear: number;
        priorYear: number;
      }>;
    }>;
  };
}

export interface GlSummaryCategory {
  itemType: string;
  category: string;
  entryCount: number;
  totalAmount: number;
  rawAmount?: number;
  budgetAmount?: number;
  budgetOriginal?: number;
  budgetAdjusted?: number;
  virementNet?: number;
  budgetVariance?: number;
  budgetVariancePercent?: number;
}

export interface GlSummary {
  categories: GlSummaryCategory[];
  grandTotal: number;
  rawGrandTotal?: number;
  totalEntries: number;
  grandBudget?: number;
  budgetSource?: string;
}

export interface GlDrillThroughEntry {
  id: string;
  genLedgerId: number;
  postingDate: string;
  capturedDate: string;
  processingMonth: number;
  itemType: string;
  scoaItemShortDesc: string;
  scoaItemCode: string;
  amount: number;
  documentNumber: string;
  documentType: string;
  transactionDescription: string;
  supplierName: string;
  department: string;
  sourceFile: string;
  sourceLineNumber: string;
}

export interface GlDrillThroughResult {
  entries: GlDrillThroughEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardData {
  financialYear: { id: string; label: string; status: string } | null;
  kpis: {
    totalCompilations: number;
    inProgress: number;
    approved: number;
    published: number;
    openRfis: number;
    overdueRfis: number;
    unresolvedFindings: number;
    totalFindings: number;
    pendingAdjustments: number;
    evidenceCount: number;
    wpCompletion: number;
    avgCompleteness: number;
    tbEntryCount: number;
  };
  compilationsByStatus: Record<string, number>;
  findingsBySeverity: Record<string, number>;
  complianceScore: number;
  recentActivity: Array<{ type: string; action: string; date: string }>;
  adjustmentSummary: { total: number; posted: number; totalAmount: number };
  tbSummary: TbSummary | null;
  tbCategoryBreakdown: TbCategoryBreakdown[];
  budgetVsActual: BudgetVsActual[];
  topRevenueItems: TbLineItem[];
  topExpenditureItems: TbLineItem[];
  glSummary: GlSummary | null;
}
