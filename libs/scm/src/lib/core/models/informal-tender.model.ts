import { Money, MscoaSegment } from './shared.model';

export interface InformalTenderConfig {
  processBoundary: { minValue: number; maxValue: number };
  minimumQuotes: number;
  rotationalDbEnabled: boolean;
  autoPoGeneration: boolean;
  requireThreeQuoteReason: boolean;
  defaultClosingDays: number;
  maxClosingDays: number;
}

export interface InformalTenderInvitedVendor {
  supplierId: string;
  supplierName: string;
  invitedDate: string;
  notificationSent: boolean;
  notificationMethod: string | null;
  notificationDate: string | null;
}

export interface InformalTenderVendorResponse {
  supplierId: string;
  supplierName: string;
  responseDate: string | null;
  responseStatus: 'responded' | 'no_response' | 'declined';
  costPerUnit: number | null;
  totalCost: number | null;
  taxAmount: number | null;
  totalIncVat: number | null;
  compliant: boolean;
  nonCompliantReason: string | null;
}

export interface InformalTenderAdjudication {
  adjudicatedBy: string;
  adjudicatedByName: string;
  adjudicatedDate: string;
  recommendedVendor: string;
  recommendedVendorName: string;
  adjudicationNotes: string;
  reasonForNotReceivingThreeQuotes: string | null;
  requestFurtherVendors: boolean;
}

export interface InformalTenderAward {
  awardedTo: string;
  awardedToName: string;
  awardedDate: string;
  awardedBy: string;
  awardedByName: string;
  awardAmount: Money;
  awardAmountIncVat: Money;
  poNumber: string | null;
  poGenerated: boolean;
}

export interface InformalTenderApproval {
  supervisorId: string;
  supervisorName: string;
  action: 'approved' | 'rejected';
  approvalDate: string;
  comments: string;
}

export interface InformalTenderVoidInfo {
  voidedBy: string;
  voidedByName: string;
  voidedDate: string;
  voidReason: string;
  approvedBy: string | null;
  approvedByName: string | null;
  approvedDate: string | null;
}

export interface InformalTenderBudget {
  budgetAvailable: number;
  budgetReserved: number;
  budgetCommitted: number;
  mscoaSegment: MscoaSegment | null;
}

export type InformalTenderStatus = 'draft' | 'saved' | 'published' | 'closed' | 'adjudicated' | 'awarded' | 'pending_approval' | 'approved' | 'completed' | 'voided';

export interface InformalTender {
  id: string;
  informalTenderNumber: string;
  requisitionId: string;
  requisitionNumber: string;
  description: string;
  estimatedValue: Money;
  status: InformalTenderStatus;
  vendorProvince: string;
  vendorCity: string;
  openingDate: string;
  closingDate: string;
  closingTime: string;
  comments: string;
  contactPerson: string;
  contactEmail: string;
  serviceContract: boolean;
  assignedBuyer: { userId: string; name: string; assignedDate: string } | null;
  rotationalVendorsInvited: InformalTenderInvitedVendor[];
  vendorResponses: InformalTenderVendorResponse[];
  adjudication: InformalTenderAdjudication | null;
  award: InformalTenderAward | null;
  approval: InformalTenderApproval | null;
  budgetInfo: InformalTenderBudget;
  voidInfo?: InformalTenderVoidInfo;
  createdBy: string;
  createdByName: string;
  createdDate: string;
  lastModified: string;
}

export interface AdjudicationMatrixEntry {
  supplierId: string;
  supplierName: string;
  totalCost: number | null;
  totalIncVat: number | null;
  compliant: boolean;
  nonCompliantReason: string | null;
  isRecommended: boolean;
  responseStatus: string;
}

export interface InformalTenderException {
  tenderId: string;
  tenderNumber: string;
  description: string;
  exceptionType: string;
  reason: string;
  status: string;
}
