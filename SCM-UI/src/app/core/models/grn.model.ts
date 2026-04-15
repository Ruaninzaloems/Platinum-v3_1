import { Money, DocumentStatus, Attachment } from './shared.model';

export interface GrnLineItem {
  id: string;
  lineNumber: number;
  orderLineRef: string;
  description: string;
  quantityOrdered: number;
  quantityPreviouslyReceived: number;
  quantityReceived: number;
  quantityRejected: number;
  unitOfMeasure: string;
  unitPrice: Money;
  totalValue: Money;
  reasonForRejection?: string;
  conditionOnReceipt: 'good' | 'damaged' | 'partial_damage';
  batchNumber?: string;
  expiryDate?: string;
  storageLocation?: string;
}

export interface GoodsReceivedNote {
  id: string;
  grnNumber: string;
  orderRef: string;
  orderNumber: string;
  supplier: { id: string; name: string; };
  receivedBy: { id: string; name: string; };
  receivedDate: string;
  deliveryNoteNumber?: string;
  waybillNumber?: string;
  status: DocumentStatus;
  receiptType: 'full' | 'partial' | 'return';
  lineItems: GrnLineItem[];
  totalValue: Money;
  inspectedBy?: { id: string; name: string; };
  inspectionDate?: string;
  inspectionNotes?: string;
  storageLocation: string;
  createdAt: string;
  updatedAt: string;
  attachments?: Attachment[];
}
