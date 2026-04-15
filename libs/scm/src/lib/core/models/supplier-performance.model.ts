export interface IssueCategory {
  code: string;
  name: string;
  description: string;
}

export interface IssueSeverity {
  code: string;
  name: string;
  description: string;
  scorePenalty: number;
}

export interface IssueContactEntry {
  contactNo: number;
  contactDate: string;
  contactType: string;
  contactPerson: string;
  contactBy: string;
  comments: string;
  email: string | null;
  fax: string | null;
}

export interface SupplierIssue {
  id: string;
  supplierId: string;
  supplierName: string;
  category: string;
  severity: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'escalated';
  description: string;
  loggedBy: string;
  loggedByName: string;
  loggedDate: string;
  resolvedDate: string | null;
  resolvedBy: string | null;
  resolvedByName: string | null;
  resolutionNotes: string | null;
  elapsedDays: number | null;
  contactLog: IssueContactEntry[];
  financialYear: string;
  linkedOrderId: string | null;
  impactOnPerformance: boolean;
  scorePenaltyApplied: number;
}

export interface BlacklistEntry {
  id: string;
  supplierId: string;
  supplierName: string;
  registrationNumber: string;
  csdNumber: string;
  reason: string;
  restrictionPeriod: string;
  startDate: string;
  endDate: string | null;
  source: string;
  importDate: string;
  importedBy: string;
  status: 'active' | 'expired' | 'removed';
  caseReference: string | null;
}

export interface WhitelistEntry {
  id: string;
  supplierId: string;
  supplierName: string;
  category: string;
  addedDate: string;
  addedBy: string;
  reason: string;
  status: 'active' | 'removed';
  validUntil: string | null;
}

export interface ScorecardDimension {
  weight: number;
  score: number;
  maxScore: number;
  details: string;
}

export interface PerformanceScorecard {
  id: string;
  supplierId: string;
  supplierName: string;
  assessmentPeriod: string;
  assessmentDate: string;
  assessedBy: string;
  assessedByName: string;
  overallScore: number;
  dimensions: Record<string, ScorecardDimension>;
  issuesCount: number;
  activeIssues: number;
  trend: 'up' | 'down' | 'stable';
  previousScore: number | null;
  recommendations: string;
  status: 'draft' | 'approved' | 'rejected';
}

export interface ScorecardWeightConfig {
  [dimension: string]: {
    weight: number;
    name: string;
  };
}

export interface SupplierPerformanceConfig {
  issueCategories: IssueCategory[];
  issueSeverities: IssueSeverity[];
  issueStatuses: string[];
  scorecardWeights: Record<string, ScorecardWeightConfig>;
}

export interface BlacklistImportResult {
  message: string;
  imported: BlacklistEntry[];
  errors: { row: number; error: string; data: any }[];
  totalProcessed: number;
  matchedInSystem: number;
}

export interface BlacklistCheckResult {
  isBlacklisted: boolean;
  matches: BlacklistEntry[];
  checkedDate: string;
}

export interface DiversityAnalytics {
  totalActiveSuppliers: number;
  bbbeeDistribution: Record<string, number>;
  preferentialProcurement: {
    totalContractValue: { amount: number; currency: string };
    bbbee123Spend: { amount: number; currency: string };
    bbbee123Percentage: number;
  };
  registrationTrends: {
    last30Days: number;
    last90Days: number;
    lastYear: number;
  };
}
