import { Money, MscoaSegment, DocumentStatus, Attachment, WorkflowStatus } from './shared.model';

export interface InvoiceLineItem {
  id: string;
  lineNumber: number;
  description: string;
  orderLineRef?: string;
  grnLineRef?: string;
  quantity: number;
  unitPrice: Money;
  totalPrice: Money;
  vatRate: number;
  vatAmount: Money;
  vatCategory?: string;
  vatCategoryLabel?: string;
  apportionmentApplied?: boolean;
  apportionmentRatio?: number | null;
  inputVatClaimable?: Money;
  inputVatNonClaimable?: Money;
  mscoaSegment: MscoaSegment;
}

export type MatchStatus = 'matched' | 'price_variance' | 'quantity_variance' | 'unmatched' | 'partial_match';

export interface ThreeWayMatch {
  orderMatch: MatchStatus;
  grnMatch: MatchStatus;
  overallStatus: MatchStatus;
  priceVariance?: Money;
  quantityVariance?: number;
  variancePercentage?: number;
  toleranceExceeded: boolean;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  supplierInvoiceNumber: string;
  orderRef: string;
  orderNumber: string;
  grnRef?: string;
  grnNumber?: string;
  supplier: { id: string; name: string; supplierNumber: string; };
  status: DocumentStatus;
  invoiceDate: string;
  receivedDate: string;
  dueDate: string;
  paymentTerms: string;
  lineItems: InvoiceLineItem[];
  subtotal: Money;
  vatTotal: Money;
  totalAmount: Money;
  threeWayMatch?: ThreeWayMatch;
  paymentBatchRef?: string;
  capturedBy: { id: string; name: string; };
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  paidAt?: string;
  workflow?: WorkflowStatus;
  attachments?: Attachment[];
  ocrProcessed?: boolean;
  ocrConfidence?: number;
}
