import { Money, MscoaSegment, DocumentStatus } from './shared.model';

export interface DemandPlanItem {
  id: string;
  lineNumber: number;
  description: string;
  unspscCode?: string;
  category: 'capital_works' | 'services' | 'goods' | 'maintenance';
  estimatedValue: Money;
  quarterlyTargets: {
    q1: { amount: number };
    q2: { amount: number };
    q3: { amount: number };
    q4: { amount: number };
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
  fundingSource: string;
  mscoaSegment?: MscoaSegment;
  procurementMethod: string;
  status: string;
  needsAssessmentId?: string | null;
  specificationId?: string | null;
  linkedRequisitionId?: string | null;
  marketAnalysisComplete: boolean;
  riskScore: number;
}

export interface DemandPlan {
  id: string;
  referenceNumber: string;
  title: string;
  department: string;
  departmentCode: string;
  vote: string;
  financialYear: string;
  status: string;
  createdBy: string;
  createdByName: string;
  createdDate: string;
  submittedDate?: string | null;
  reviewedBy?: string | null;
  reviewedByName?: string | null;
  reviewedDate?: string | null;
  approvedBy?: string | null;
  approvedByName?: string | null;
  approvedDate?: string | null;
  idpReference: string;
  idpObjective: string;
  sdbipReference: string;
  sdbipIndicator: string;
  totalBudget: Money;
  totalDemand: Money;
  budgetVariance: Money;
  budgetUtilisation: number;
  complianceScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  priorityBreakdown: { critical: number; high: number; medium: number; low: number };
  procurementMethodSummary: Record<string, number>;
  quarterlySpendPlan: Record<string, { planned: number; actual: number; committed: number }>;
  items: DemandPlanItem[];
  notes: string;
  auditTrail: AuditEntry[];
}

export interface AuditEntry {
  action: string;
  by: string;
  date: string;
  notes: string;
}

export interface NeedsAssessment {
  id: string;
  referenceNumber: string;
  demandPlanId: string;
  itemId: string;
  title: string;
  description: string;
  department: string;
  conductedBy: string;
  conductedByName: string;
  conductedDate: string;
  methodology: string;
  findings: string;
  recommendation: string;
  estimatedCost: Money;
  priority: 'low' | 'medium' | 'high' | 'critical';
  approvedBy?: string | null;
  approvedByName?: string | null;
  approvedDate?: string | null;
  status: string;
  attachments: string[];
  legislativeRef: string;
  riskFactors: string[];
}

export interface AnnualProcurementPlan {
  id: string;
  referenceNumber: string;
  title: string;
  financialYear: string;
  status: string;
  version: number;
  publishedDate?: string;
  preparedBy: string;
  preparedByName: string;
  approvedBy?: string;
  approvedByName?: string;
  totalPlannedSpend: Money;
  totalBudgetAvailable: Money;
  sourceDemandPlans: string[];
  items: ProcurementPlanItem[];
  quarterlyPipeline: Record<string, { items: number; value: number; status: string }>;
  methodBreakdown: Record<string, { count: number; value: number; percentage: number }>;
  legislativeCompliance: Record<string, any>;
}

export interface ProcurementPlanItem {
  id: string;
  demandItemId: string;
  description: string;
  procurementMethod: string;
  estimatedValue: number;
  targetQuarter: string;
  category: string;
  status: string;
  biddingDocumentReady: boolean;
}

export interface DemandAggregation {
  id: string;
  title: string;
  commodityGroup: string;
  unspscRange: string;
  departments: string[];
  items: { demandPlanId: string; itemId: string; description: string; value: number }[];
  totalAggregatedValue: Money;
  savingsEstimate: Money;
  savingsPercentage: number;
  recommendedMethod: string;
  status: string;
  aiRecommendation: string;
  legislativeRef: string;
}

export interface Specification {
  id: string;
  demandItemId: string;
  title: string;
  category: string;
  status: string;
  version: number;
  preparedBy: string;
  preparedByName: string;
  preparedDate: string;
  approvedBy?: string | null;
  approvedByName?: string | null;
  approvedDate?: string | null;
  description: string;
  keyRequirements: string[];
  estimatedValue: Money;
  legislativeRef: string;
  aiSuggestions: string[];
}

export interface MarketAnalysis {
  id: string;
  demandItemId: string;
  title: string;
  commodity: string;
  conductedBy: string;
  conductedByName: string;
  conductedDate: string;
  marketConditions: string;
  supplierCount: number;
  priceRange: { min: number; max: number; average: number; currency: string };
  previousContractValue: Money;
  previousContractYear: string;
  priceEscalation: number;
  bbbeeAvailability: { level1to4: number; level5to8: number; nonCompliant: number };
  localContentAvailability: number;
  riskAssessment: string;
  recommendation: string;
  status: string;
  legislativeRef: string;
  aiInsights: string[];
}

export interface CommodityGroup {
  id: string;
  code: string;
  name: string;
  parentGroup: string;
  demandItems: number;
  totalValue: Money;
  departments: string[];
  preferredMethod: string;
  historicalSpend: Record<string, number>;
  priceIndex: number;
  trendDirection: 'increasing' | 'stable' | 'decreasing';
}

export interface DemandDashboard {
  kpis: Record<string, any>;
  statusDistribution: { status: string; count: number; value: number; percentage: number }[];
  departmentBreakdown: { department: string; plans: number; value: number; items: number; complianceScore: number; budgetUtilisation: number }[];
  categoryBreakdown: { category: string; count: number; value: number; percentage: number }[];
  procurementMethodBreakdown: { method: string; count: number; value: number; percentage: number }[];
  quarterlyPipeline: { quarter: string; plannedValue: number; actualValue: number; committed: number; items: number }[];
  riskSummary: Record<string, any>;
  legislativeCompliance: Record<string, any>;
}
