export interface IdpCycle {
  id: number;
  name: string;
  startYear: number;
  endYear: number;
  status: string;
  revisionNumber: number;
  municipalityName: string;
  description?: string;
  isLocked: boolean;
  createdBy?: number;
  createdDate: string;
  modifiedBy?: number;
  modifiedDate: string;
  versionNo: number;
}

export interface IdpProcessPhase {
  id: number;
  cycleId: number;
  name: string;
  description?: string;
  orderIndex: number;
  owner?: string;
  startDate?: string;
  endDate?: string;
  progress: number;
  status: string;
  milestones?: IdpMilestone[];
  createdBy?: number;
  createdDate: string;
  modifiedBy?: number;
  modifiedDate: string;
  versionNo: number;
}

export interface IdpMilestone {
  id: number;
  phaseId: number;
  cycleId: number;
  title: string;
  description?: string;
  assignedTo?: string;
  dueDate?: string;
  status: string;
  progress: number;
  isMandatory: boolean;
  evidenceUrl?: string;
  createdBy?: number;
  createdDate: string;
  modifiedBy?: number;
  modifiedDate: string;
  versionNo: number;
}

export interface IdpStrategicObjective {
  id: number;
  cycleId: number;
  code: string;
  description: string;
  alignmentTags?: string;
  ndpAlignment?: string;
  provincialAlignment?: string;
  projects?: IdpProject[];
  createdBy?: number;
  createdDate: string;
  modifiedBy?: number;
  modifiedDate: string;
  versionNo: number;
  status: string;
}

export interface IdpProject {
  id: number;
  cycleId: number;
  objectiveId?: number;
  name: string;
  description?: string;
  classification: string;
  department: string;
  ward?: string;
  region?: string;
  priority: string;
  priorityRanking: number;
  overrideRank?: number;
  budgetAmount?: number;
  fundingSource?: string;
  fundingSourceSummary?: string;
  mscoaProjectSegment?: string;
  mscoaFundSegment?: string;
  mscoaRegionSegment?: string;
  startDate?: string;
  endDate?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  indicators?: IdpProjectIndicator[];
  objective?: IdpStrategicObjective;
  objectiveLinks?: ProjectObjectiveLink[];
  createdBy?: number;
  createdDate: string;
  modifiedBy?: number;
  modifiedDate: string;
  versionNo: number;
}

export interface ProjectObjectiveLink {
  id: number;
  projectId: number;
  objectiveId: number;
  percentage: number;
  objective?: IdpStrategicObjective;
  createdBy?: number;
  createdDate: string;
  modifiedBy?: number;
  modifiedDate: string;
  versionNo: number;
}

export interface MscoaSegment {
  id: number;
  segmentType: string;
  code: string;
  description: string;
  level: number;
  parentCode?: string;
  isPostingLevel: boolean;
  status: string;
}

export interface IdpProjectIndicator {
  id: number;
  projectId: number;
  name: string;
  baseline?: string;
  targetY1?: string;
  targetY2?: string;
  targetY3?: string;
  targetY4?: string;
  targetY5?: string;
  responsibleOfficial?: string;
  evidenceLink?: string;
  createdBy?: number;
  createdDate: string;
  modifiedBy?: number;
  modifiedDate: string;
  versionNo: number;
  status: string;
}

export interface IdpPublicComment {
  id: number;
  cycleId: number;
  sourceChannel: string;
  ward?: string;
  region?: string;
  category?: string;
  commentText: string;
  linkedProjectId?: number;
  linkedObjectiveId?: number;
  submitterName?: string;
  submissionDate?: string;
  status: string;
  responses?: IdpCommentResponse[];
  createdBy?: number;
  createdDate: string;
  modifiedBy?: number;
  modifiedDate: string;
  versionNo: number;
}

export interface IdpCommentResponse {
  id: number;
  commentId: number;
  responseText: string;
  responsibleOfficial?: string;
  responseDate?: string;
  createdBy?: number;
  createdDate: string;
  modifiedBy?: number;
  modifiedDate: string;
  versionNo: number;
}

export interface IdpDocumentVersion {
  id: number;
  cycleId: number;
  versionNumber: number;
  versionType: string;
  status: string;
  contentJson?: string;
  resolutionNumber?: string;
  resolutionDate?: string;
  councilMeetingRef?: string;
  isLocked: boolean;
  lockedDate?: string;
  lockedBy?: number;
  createdBy?: number;
  createdDate: string;
  modifiedBy?: number;
  modifiedDate: string;
  versionNo: number;
  workflowTasks?: IdpWorkflowTask[];
}

export interface IdpWorkflowTask {
  id: number;
  cycleId: number;
  documentVersionId?: number;
  taskType: string;
  assignedRole?: string;
  assignedTo?: string;
  status: string;
  comments?: string;
  sequence: number;
  createdBy?: number;
  createdDate: string;
  completedBy?: number;
  completedDate?: string;
  modifiedBy?: number;
  modifiedDate: string;
  versionNo: number;
}

export interface IdpSubmissionLog {
  id: number;
  cycleId: number;
  documentVersionId?: number;
  submissionType: string;
  referenceNumber?: string;
  submissionDate?: string;
  validationStatus: string;
  validationFeedback?: string;
  adoptedIdpFileName?: string;
  councilResolutionFileName?: string;
  minutesFileName?: string;
  createdBy?: number;
  createdDate: string;
  modifiedBy?: number;
  modifiedDate: string;
  versionNo: number;
  status: string;
}

export interface IdpAuditLog {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  oldValue?: string;
  newValue?: string;
  performedBy?: number;
  performedDate: string;
  ipAddress?: string;
  createdBy?: number;
  createdDate: string;
  modifiedBy?: number;
  modifiedDate: string;
  versionNo: number;
  status: string;
}

export interface PriorityFramework {
  id: number;
  name: string;
  version: number;
  cycleId?: number;
  status: string;
  humanWeight: number;
  aiWeight: number;
  aiMode: string;
  scaleMin: number;
  scaleMax: number;
  criteria?: PriorityCriteria[];
  scoringScales?: PriorityScoringScale[];
  createdBy?: number;
  createdDate: string;
  modifiedBy?: number;
  modifiedDate: string;
  versionNo: number;
}

export interface PriorityCriteria {
  id: number;
  frameworkId: number;
  code: string;
  name: string;
  description?: string;
  category: string;
  weight: number;
  isActive: boolean;
  sortOrder: number;
  createdBy?: number;
  createdDate: string;
  modifiedBy?: number;
  modifiedDate: string;
  versionNo: number;
}

export interface PriorityScoringScale {
  id: number;
  frameworkId: number;
  scoreValue: number;
  label: string;
  createdBy?: number;
  createdDate: string;
  modifiedBy?: number;
  modifiedDate: string;
  versionNo: number;
}

export interface PriorityProjectScore {
  id: number;
  frameworkId: number;
  projectId: number;
  criteriaId: number;
  humanScore?: number;
  aiScore?: number;
  blendedScore: number;
  comments?: string;
  scoredBy?: number;
  scoredDate?: string;
  criteria?: PriorityCriteria;
  createdBy?: number;
  createdDate: string;
  modifiedBy?: number;
  modifiedDate: string;
  versionNo: number;
}

export interface PriorityFrameworkAudit {
  id: number;
  frameworkId: number;
  changeType: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  changedBy?: number;
  changedDate: string;
  createdBy?: number;
  createdDate: string;
  modifiedBy?: number;
  modifiedDate: string;
  versionNo: number;
}

export interface ProjectRanking {
  projectId: number;
  projectName: string;
  classification: string;
  department: string;
  compositeScore: number;
  rank: number;
  overrideRank?: number;
  budgetAmount?: number;
  priority: string;
  scores: PriorityProjectScore[];
}

export interface BudgetSimulationResult {
  projects: ProjectRanking[];
  totalBudget: number;
  selectedBudget: number;
  excludedBudget: number;
  selectedCount: number;
  excludedCount: number;
}

export interface DashboardData {
  cycle: IdpCycle;
  totalProjects: number;
  capitalProjects: number;
  operationalProjects: number;
  totalComments: number;
  pendingComments: number;
  respondedComments: number;
  closedComments: number;
  escalatedComments: number;
  totalObjectives: number;
  totalMilestones: number;
  completedMilestones: number;
  overdueMilestones: number;
  totalBudget: number;
  phases: IdpProcessPhase[];
  documentVersions: number;
  submissions: number;
  recentAuditLogs: IdpAuditLog[];
}
