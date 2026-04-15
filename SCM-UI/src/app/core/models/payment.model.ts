import { Money, DocumentStatus } from './shared.model';

export interface PaymentItem {
  id?: string;
  invoiceId: string;
  supplierId: string;
  supplierName: string;
  invoiceNumber: string;
  amount: Money;
  fullInvoiceAmount?: Money;
  isPartialPayment?: boolean;
  partialPaymentNumber?: number;
  totalPartialPayments?: number;
  bankAccount: string;
  bankName: string;
  branchCode: string;
  cessionSplit?: CessionSplit | null;
  remittanceRef: string | null;
  remittanceSent: boolean;
  remittanceDate?: string | null;
  invoiceDetails?: {
    status: string;
    invoiceDate: string;
    dueDate: string;
    ageDays: number;
    invoiceType: string;
    department: string;
  } | null;
  mfmaInterest?: MfmaInterestResult | null;
}

export interface CessionSplit {
  cedant: {
    supplierId?: string;
    name: string;
    percentage?: number;
    amount: Money;
    bankAccount: string;
    bankName?: string;
    branchCode: string;
  };
  beneficiary: {
    supplierId?: string;
    name: string;
    percentage?: number;
    amount: Money;
    bankAccount: string;
    bankName?: string;
    branchCode: string;
  };
  documents?: string[];
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedDate?: string;
  createdDate?: string;
}

export interface PaymentBatch {
  id: string;
  referenceNumber: string;
  batchDate: string;
  status: string;
  createdBy: string;
  createdByName: string;
  createdDate: string;
  approvalChain: PaymentApproval[];
  processedDate: string | null;
  eftFileReference: string | null;
  eftGeneratedDate: string | null;
  eftFileName: string | null;
  paymentMethod: string;
  transactionType?: string;
  cashbookAccountId?: string;
  cashbookAccount?: CashbookAccount | null;
  totalAmount: Money;
  itemCount: number;
  items: PaymentItem[];
  notes: string;
  voidComments?: string | null;
  declineReason?: string | null;
  voidedBy?: string;
  voidedDate?: string;
  auditTrail?: PaymentAuditEntry[];
}

export interface PaymentApproval {
  level: number;
  role: string;
  userId: string;
  userName: string;
  status: 'approved' | 'declined';
  date: string;
  comments?: string;
}

export interface PaymentAuditEntry {
  action: string;
  userId: string;
  timestamp: string;
  details?: string;
}

export interface CashbookAccount {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  branchCode: string;
  type: 'primary' | 'capital' | 'grant' | 'trust';
  balance: Money;
  status: 'active' | 'inactive';
}

export interface PaymentTransactionType {
  value: string;
  label: string;
  description: string;
}

export interface MfmaInterestResult {
  amount: number;
  currency: string;
  daysOverdue: number;
  rate?: number;
  breached: boolean;
  rateSource?: string;
  calcMethod?: string;
  formula?: string;
}

export interface MfmaInterestReport {
  reportName: string;
  generatedDate: string;
  currentRate: number;
  rateSource: string;
  data: {
    invoiceId: string;
    invoiceNumber: string;
    supplierName: string;
    invoiceAmount: Money;
    ageDays: number;
    daysOverdue: number;
    interestAmount: Money;
    riskLevel: 'critical' | 'high' | 'medium';
  }[];
  summary: {
    totalOverdueInvoices: number;
    totalInterestLiability: Money;
    criticalCount: number;
    highCount: number;
  };
}

export interface VatValidationResult {
  expectedVat: number;
  actualVat: number;
  difference: number;
  withinTolerance: boolean;
  tolerance: number;
  vatRate: number;
}

export interface InvoiceCloseOut {
  reason: string;
  writeOffAmount: Money;
  closedBy: string;
  closedDate: string;
  requiresCfoApproval: boolean;
  cfoApproved: boolean;
  approvedBy?: string;
  approvedDate?: string;
}

export interface PaymentConfig {
  vatRate: number;
  vatRoundingTolerance: Money & { description: string };
  mfmaSection65: {
    maxPaymentDays: number;
    interestRateSource: string;
    currentRate: number;
    interestCalcMethod: string;
    penaltyNotificationDays: number[];
    autoEscalateOnBreach: boolean;
    escalateTo: string;
  };
  cashbookAccounts: CashbookAccount[];
  partialPayments: {
    enabled: boolean;
    minPartialPercentage: number;
    maxPartsPerInvoice: number;
    requiresApproval: boolean;
    approvalRole: string;
  };
  cessionWorkflow: {
    enabled: boolean;
    requiresDocumentation: boolean;
    requiredDocuments: string[];
    approvalRequired: boolean;
    approvalRole: string;
  };
  invoiceCloseOut: {
    enabled: boolean;
    writeOffThreshold: Money & { description: string };
    writeOffApprovalRole: string;
    closeOutReasons: string[];
  };
}

export interface VatCategory {
  code: string;
  label: string;
  rate: number;
  description: string;
  glAccountSuffix: string;
}

export interface VatApportionmentMethod {
  code: string;
  label: string;
  description: string;
  formula: string;
}

export interface VatRatioHistoryEntry {
  period: string;
  ratio: number;
  method: string;
  approvedBy: string;
  approvedDate: string;
  taxableSupplies: Money | null;
  totalSupplies: Money | null;
}

export interface VatDepartmentOverride {
  departmentId: string;
  departmentName: string;
  customRatio: number;
  reason: string;
}

export interface VatApportionmentConfig {
  enabled: boolean;
  municipalityVatNumber: string;
  vatVendorStatus: string;
  currentApportionmentRatio: number;
  apportionmentMethod: string;
  apportionmentPeriod: string;
  lastAdjustmentDate: string;
  nextAdjustmentDate: string;
  methods: VatApportionmentMethod[];
  ratioHistory: VatRatioHistoryEntry[];
  capitalGoodsScheme: {
    enabled: boolean;
    adjustmentPeriod: number;
    thresholdAmount: Money;
    description: string;
  };
  deMinimisRule: {
    enabled: boolean;
    thresholdPercentage: number;
    description: string;
  };
  departmentOverrides: VatDepartmentOverride[];
}

export interface VatApportionmentLineItem {
  lineNumber: number;
  description: string;
  quantity: number;
  unitPriceExclVat: number;
  lineTotal: number;
  vatCategory: string;
  vatCategoryLabel: string;
  vatRate: number;
  vatAmount: Money;
  totalInclVat: Money;
  apportionmentApplied: boolean;
  apportionmentRatio: number | null;
  inputVatClaimable: Money;
  inputVatNonClaimable: Money;
  glAccountSuffix: string;
}

export interface VatCategorySummary {
  categoryCode: string;
  categoryLabel: string;
  lineCount: number;
  subtotal: Money;
  vatAmount: Money;
}

export interface VatApportionmentSummary {
  totalExclVat: Money;
  totalVat: Money;
  totalInclVat: Money;
  claimableInputVat: Money;
  nonClaimableInputVat: Money;
  apportionedVat: Money;
  apportionmentRatioApplied?: number;
  departmentOverride?: { departmentId: string; departmentName: string; customRatio: number } | null;
  deMinimis?: {
    applied: boolean;
    note: string | null;
    exemptPercentage: number;
    threshold: number;
  };
  capitalGoodsFlags?: {
    lineNumber: number;
    description: string;
    amount: number;
    adjustmentPeriod: number;
  }[] | null;
  byCategory: VatCategorySummary[];
}

export interface VatAiClassificationItem {
  lineNumber: number;
  vatCategoryCode: string;
  vatCategoryName: string;
  confidence: number;
  reasoning: string;
  alternativeCategory: string | null;
  alternativeConfidence: number;
  isCapitalAsset: boolean;
  capitalAssetValue: number | null;
  requiresReview: boolean;
  reviewReason: string | null;
  keywords: string[];
  aiGenerated: boolean;
  autoApply: boolean;
  timestamp: string;
}

export interface VatAiClassificationResult {
  classifications: VatAiClassificationItem[];
  overallConfidence: number;
  autoApplyCount: number;
  reviewRequiredCount: number;
  notes: string;
  generatedAt: string;
  aiGenerated: boolean;
  source: string;
}

export interface VatAiRatioRecommendation {
  departmentId: string;
  departmentName: string;
  currentRatio: number;
  recommendedRatio: number;
  confidence: number;
  recommendedMethod?: string;
  methodReasoning?: string;
  adjustment: 'increase' | 'decrease' | 'maintain';
  adjustmentAmount?: number;
  riskFlags?: string[];
  reasoning: string;
  estimatedImpact?: { annualVatDifference: number; direction: string };
}

export interface VatAiRatioOptimisationResult {
  recommendations: VatAiRatioRecommendation[];
  portfolioSummary?: {
    weightedAverageRatio: number;
    totalEstimatedImpact: number;
    highRiskDepartments: string[];
    complianceNotes: string[];
  };
  generatedAt: string;
  aiGenerated: boolean;
  source: string;
}

export interface VatAiAnomaly {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  affectedItems: string[];
  currentCategory?: string;
  suggestedCategory?: string;
  estimatedVatImpact?: Money;
  recommendation: string;
  regulatoryReference?: string;
}

export interface VatAiAnomalyResult {
  anomalies: VatAiAnomaly[];
  complianceScore: number;
  estimatedOverclaim?: Money;
  estimatedUnderclaim?: Money;
  summary: string;
  generatedAt: string;
  aiGenerated: boolean;
  source: string;
}

export interface VatAiCorrection {
  invoiceId: string;
  lineNumber: number;
  originalCategory: string;
  correctedCategory: string;
  correctedBy: string;
  reason: string;
  timestamp?: string;
}

export interface VatApportionmentResult {
  lineItems: VatApportionmentLineItem[];
  vatSummary: VatApportionmentSummary;
  aiClassification?: {
    applied: boolean;
    autoClassifiedCount: number;
    reviewRequiredCount: number;
    overallConfidence: number;
    classifications: VatAiClassificationItem[];
    source: string;
    notes?: string;
  } | null;
}

export interface VatApportionmentInvoice {
  invoiceId: string;
  invoiceNumber: string;
  supplierName: string;
  lineItems: VatApportionmentLineItem[];
  vatSummary: VatApportionmentSummary;
}

export interface VatApportionmentPeriodSummary {
  period: string;
  apportionmentRatio: number;
  method: string;
  totalInputVat: Money;
  claimableInputVat: Money;
  nonClaimableInputVat: Money;
  vatSavings: Money;
  byCategory: {
    categoryCode: string;
    categoryLabel: string;
    invoiceCount: number;
    totalExclVat: Money;
    vatAmount: Money;
    claimableVat: Money;
  }[];
  byDepartment: {
    departmentId: string;
    departmentName: string;
    ratio: number;
    invoiceCount: number;
    totalInputVat: Money;
    claimableVat: Money;
  }[];
  capitalGoodsAdjustments: {
    assetsTracked: number;
    totalOriginalVat: Money;
    adjustmentsDue: Money;
    nextAdjustmentDate: string | null;
  };
}

export interface VatApportionmentCalculateRequest {
  lineItems: {
    lineNumber?: number;
    description?: string;
    quantity?: number;
    unitPriceExclVat: number;
    vatCategory?: string;
    apportionmentApplied?: boolean;
    mixedUse?: boolean;
    customRatio?: number;
    supplierId?: string;
    supplierName?: string;
    unspscCode?: string;
    glAccount?: string;
  }[];
  departmentId?: string;
  autoClassify?: boolean;
}

export interface CreditorAgeAnalysis {
  supplierId: string;
  supplierName: string;
  current: Money;
  days30: Money;
  days60: Money;
  days90: Money;
  days120Plus: Money;
  total: Money;
  invoiceCount?: number;
  oldestInvoiceDays?: number;
}

export interface PaymentForecastWeek {
  label: string;
  min: number;
  max: number;
  count: number;
  amount: Money;
  interestAtRisk?: Money;
}
