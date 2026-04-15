import { Money, DocumentStatus, Attachment, WorkflowStatus } from './shared.model';

export interface RfqLineItem {
  id: string;
  lineNumber: number;
  description: string;
  unspscCode?: string;
  quantity: number;
  unitOfMeasure: string;
  specifications?: string;
  estimatedUnitCost?: Money;
}

export interface SupplierQuote {
  id: string;
  supplierId?: string;
  supplierName: string;
  submittedDate: string;
  status: 'received' | 'evaluated' | 'awarded' | 'unsuccessful' | 'no_response';
  complianceStatus: 'pending' | 'compliant' | 'non_compliant';
  responseStatus: 'responded' | 'no_response';
  nonComplianceReason?: string;
  lineItems: { lineRef: string; description: string; unitPrice: Money; total: Money; }[];
  totalExclVat: Money;
  totalInclVat: Money;
  bbbeeLevel: number | string;
  bbbeePoints: number;
  priceScore: number | null;
  totalScore: number | null;
  deliveryDays: number;
}

export interface BudgetValidationResult {
  validated: boolean;
  date: string;
  available: number;
  required: number;
  passed: boolean;
  voteNumber?: string;
  voteDescription?: string;
  error?: string | null;
}

export interface BudgetValidationChain {
  atCapture: BudgetValidationResult | null;
  atAdjudication: BudgetValidationResult | null;
  atAward: BudgetValidationResult | null;
  atApproval: BudgetValidationResult | null;
}

export interface RfqApproval {
  level: number;
  role: string;
  userId: string;
  userName: string;
  status: 'approved' | 'declined';
  date: string;
  comments: string;
}

export interface VendorNotification {
  supplierId: string;
  type: 'invitation' | 'award' | 'unsuccessful' | 'void';
  channel: 'email' | 'sms';
  sentDate: string;
  status: 'sent' | 'failed' | 'pending';
}

export interface AdjudicationReport {
  recommendedSupplierId: string;
  recommendedSupplierName: string;
  method: string;
  lowestPrice: Money;
  totalResponses: number;
  compliantResponses: number;
  nonCompliant: number;
  noResponse: number;
  adjudicatedBy: string;
  adjudicatedDate: string;
  scores?: { quoteId: string; supplierName: string; priceScore: number; bbbeePoints: number; totalScore: number; totalExclVat: Money; }[];
}

export interface RfqVoidDetails {
  voidedBy: string;
  voidedByName: string;
  voidedDate: string;
  reason: string;
  budgetReleased: boolean;
  budgetReleasedAmount: Money;
}

export interface RfqAuditEntry {
  action: string;
  userId: string;
  timestamp: string;
  details: string;
}

export interface RequestForQuotation {
  id: string;
  referenceNumber: string;
  title: string;
  description?: string;
  requisitionId: string | null;
  status: string;
  scoringMethod: string;
  serviceType: string | null;
  businessArea: string | null;
  subSector: string | null;
  vendorProvince: string | null;
  vendorCity: string | null;
  department: string;
  createdBy: string;
  createdByName: string;
  assignedBuyer: string | null;
  assignedBuyerName: string | null;
  createdDate: string;
  publishedDate: string | null;
  closingDate: string | null;
  closingTime: string | null;
  evaluatedDate: string | null;
  awardedDate: string | null;
  awardedTo: string | null;
  estimatedCost: Money | null;
  contactPerson: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  serviceContractRouting: boolean;
  comments: string;
  voteNumber: string | null;
  budgetValidation: BudgetValidationChain;
  approvalChain: RfqApproval[];
  overruleReason: string | null;
  threeQuoteJustification: string | null;
  vendorNotifications: VendorNotification[];
  lineItems: RfqLineItem[];
  quotes: SupplierQuote[];
  adjudicationReport: AdjudicationReport | null;
  voidDetails?: RfqVoidDetails;
  notes: string;
  auditTrail: RfqAuditEntry[];
  attachments?: Attachment[];
  workflow?: WorkflowStatus;
}

export interface RotationalVendor {
  supplierId: string;
  supplierName: string;
  businessArea: string;
  subSector: string;
  province: string;
  city: string;
  lastInvited: string;
  timesInvited: number;
  timesAwarded: number;
  rotationScore: number;
  bbbeeLevel: number;
  contactPerson: string;
  email: string;
  phone: string;
  status: string;
}

export interface QuotationConfig {
  rotationalDatabase: {
    enabled: boolean;
    excludeInvited: boolean;
    rotateAwarded: boolean;
    defaultVendorCount: number;
    sortBy: string;
    filterByProvince: boolean;
    filterByCity: boolean;
  };
  processBoundaries: ProcessBoundary[];
  approvalChain: { level: number; role: string; label: string; maxAmount: number | null; }[];
  scoringMethods: ScoringMethod[];
  serviceTypes: string[];
  businessAreas: string[];
  subSectors: string[];
  emailTemplates: Record<string, { subject: string; body: string; }>;
}

export interface ProcessBoundary {
  id: string;
  rangeFrom: number;
  rangeTo: number | null;
  method: string;
  label: string;
  enabled: boolean;
  minQuotes: number;
  scoring?: string;
}

export interface ScoringMethod {
  id: string;
  label: string;
  description: string;
  bbbeeApplied: boolean;
  priceWeight?: number;
  bbbeeWeight?: number;
}

export interface BudgetVote {
  voteNumber: string;
  description: string;
  totalBudget: number;
  committed: number;
  spent: number;
  available: number;
}

export interface QuotationRegisterReport {
  reportName: string;
  generatedDate: string;
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: {
    total: number;
    draft: number;
    published: number;
    closed: number;
    evaluated: number;
    awarded: number;
    voided: number;
    totalEstimatedValue: Money;
    totalAwardedValue: Money;
  };
}

export interface QuotationExceptionReport {
  reportName: string;
  generatedDate: string;
  data: { rfqId: string; referenceNumber: string; title: string; type: string; description: string; severity: string; date: string; }[];
  total: number;
  summary: { total: number; critical: number; high: number; medium: number; low: number; };
}
