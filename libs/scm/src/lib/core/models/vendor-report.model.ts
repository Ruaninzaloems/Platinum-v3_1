export interface VendorDetailReport {
  id: string;
  name: string;
  tradingName: string;
  csdNumber: string;
  registrationNumber: string;
  status: string;
  bbbeeLevel: number | string;
  performanceScore: number | null;
  commodityCategories: string[];
  physicalAddress: any;
  contactPerson: string;
  email: string;
  phone: string;
  totalContractValue: { amount: number; currency: string };
  activeContracts: number;
  documentStatus: 'complete' | 'incomplete' | 'has_expired';
  mandatoryDocsComplete: boolean;
  expiredDocumentCount: number;
  totalDocuments: number;
  directorsCount: number;
  hdiOwnership: number;
  womenOwnership: number;
  accreditations: string;
}

export interface VendorStatusReport {
  total: number;
  statusBreakdown: Record<string, number>;
  provinceBreakdown: Record<string, number>;
  bbbeeBreakdown: Record<string, number>;
  recentChanges: any[];
  reportDate: string;
}

export interface VendorException {
  supplierId: string;
  supplierName: string;
  exceptionType: string;
  detail: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: string;
}

export interface VendorExceptionReport {
  exceptions: VendorException[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    byType: Record<string, number>;
  };
  reportDate: string;
}

export interface PerformanceTrendSupplier {
  supplierId: string;
  supplierName: string;
  assessments: {
    period: string;
    date: string;
    overallScore: number;
    trend: string;
    issuesCount: number;
  }[];
  currentScore: number;
  scoreChange: number;
  latestTrend: string;
  totalAssessments: number;
}

export interface PerformanceTrendReport {
  suppliers: PerformanceTrendSupplier[];
  total: number;
  reportDate: string;
}

export interface DiversityReportSupplier {
  supplierId: string;
  supplierName: string;
  bbbeeLevel: number | string;
  contractValue: number;
  hdiOwnership: number;
  womenOwnership: number;
  youthOwnership: number;
  disabilityOwnership: number;
  isHdiOwned: boolean;
  isWomenOwned: boolean;
  isYouthOwned: boolean;
  isDisabilityOwned: boolean;
}

export interface DiversityReport {
  totalActiveSuppliers: number;
  totalSpend: { amount: number; currency: string };
  hdiOwned: { count: number; spend: { amount: number; currency: string }; percentage: number };
  womenOwned: { count: number; spend: { amount: number; currency: string }; percentage: number };
  youthOwned: { count: number; spend: { amount: number; currency: string }; percentage: number };
  disabilityOwned: { count: number; spend: { amount: number; currency: string }; percentage: number };
  supplierDetails: DiversityReportSupplier[];
  reportDate: string;
}

export interface VendorReportFilters {
  search?: string;
  status?: string;
  bbbeeLevel?: string;
  province?: string;
  city?: string;
  commodityCategory?: string;
  performanceTierMin?: number;
  performanceTierMax?: number;
  registeredFrom?: string;
  registeredTo?: string;
  hasActiveContracts?: string;
  documentStatus?: string;
  accreditationType?: string;
  hdiOwned?: string;
  womenOwned?: string;
  youthOwned?: string;
  disabilityOwned?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}
