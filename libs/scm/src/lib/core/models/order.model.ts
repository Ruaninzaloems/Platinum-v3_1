import { Money, MscoaSegment, DocumentStatus, Attachment, WorkflowStatus } from './shared.model';

export interface OrderLineItem {
  id: string;
  lineNumber: number;
  description: string;
  unspscCode?: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: Money;
  totalPrice: Money;
  vatRate: number;
  vatAmount: Money;
  mscoaSegment: MscoaSegment;
  requisitionLineRef?: string;
  quantityReceived: number;
  quantityInvoiced: number;
  deliveryDate: string;
  orderedQuantity?: number;
  remainingQuantity?: number;
}

export interface BudgetState {
  state: 'available' | 'reserved' | 'committed' | 'consumed' | 'released';
  reservedAmount: number;
  committedAmount: number;
  consumedAmount: number;
  availableAmount: number;
}

export interface ApprovalHistoryEntry {
  action: string;
  userId: string;
  userName: string;
  date: string;
  comments?: string;
}

export interface SlaTracking {
  orderToApprovalTarget: number;
  orderToApprovalActual?: number;
  orderToDispatchTarget: number;
  orderToDispatchActual?: number;
  orderToDeliveryTarget?: number;
  orderToDeliveryActual?: number;
}

export interface VoidDetails {
  voidedBy: string;
  voidDate: string;
  voidReason: string;
  voidType: 'complete_receipts' | 'generate_new_later';
  budgetReleased: number;
}

export interface PartialOrder {
  isPartial: boolean;
  originalQuantity: number;
  orderedQuantity: number;
  remainingQuantity: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  requisitionRef: string;
  requisitionNumber?: string;
  rfqRef?: string;
  supplier: { id: string; name: string; supplierNumber: string; };
  department: string;
  costCentre: string;
  status: DocumentStatus;
  orderType: 'standard' | 'blanket' | 'contract' | 'emergency';
  referenceType?: 'quotation' | 'informal_tender' | 'tender' | 'contract' | 'direct';
  referenceNumber?: string;
  contractNumber?: string;
  financialYear?: string;
  contactPerson?: string;
  contactTelephone?: string;
  contactEmail?: string;
  lineItems: OrderLineItem[];
  subtotal: Money;
  vatTotal: Money;
  totalValue: Money;
  budgetCommitment: Money;
  budgetState?: BudgetState;
  paymentTerms: string;
  deliveryTerms: string;
  deliveryAddress: string;
  specialInstructions?: string;
  contractRef?: string;
  createdBy: { id: string; name: string; };
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  dispatchedAt?: string;
  completedAt?: string;
  workflow?: WorkflowStatus;
  attachments?: Attachment[];
  approvalHistory?: ApprovalHistoryEntry[];
  slaTracking?: SlaTracking;
  voidDetails?: VoidDetails;
  partialOrder?: PartialOrder;
}

export interface Cession {
  id: string;
  orderNumber: string;
  cedant: { id: string; name: string; registrationNumber?: string; };
  cedantPercentage: number;
  beneficiary: { id: string; name: string; registrationNumber?: string; };
  beneficiaryPercentage: number;
  cessionDirectiveType: string;
  cessionDate: string;
  totalClaimAmount: Money;
  description: string;
  comments?: string;
  documents?: any[];
  status: string;
  createdBy?: string;
  createdDate?: string;
}

export interface CessionType {
  id: string;
  code: string;
  description: string;
  cessionDocRequired: boolean;
  directiveDocRequired: boolean;
  priority: number;
  enabled: boolean;
}
