import { Money } from './shared.model';

export interface GoodsReturnLineItem {
  id: string;
  description: string;
  grnQuantity: number;
  returnQuantity: number;
  returnReason: string;
  unitPrice?: Money;
  totalValue?: Money;
}

export interface GoodsReturn {
  id: string;
  returnNumber: string;
  grnId: string;
  grnNumber?: string;
  orderId: string;
  orderNumber?: string;
  vendorId: string;
  vendorName: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'declined' | 'gra_created';
  lineItems: GoodsReturnLineItem[];
  returnDate: string;
  returnBy: string;
  approvalDate?: string;
  approvedBy?: string;
  approvalComments?: string;
  financialYear?: string;
  budgetImpact?: Money;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GoodsReturnAdvice {
  id: string;
  graNumber: string;
  returnId: string;
  grnId: string;
  orderId: string;
  vendorId: string;
  vendorName: string;
  debitNoteNumber: string;
  status: 'active' | 'cancelled';
  lineItems: GoodsReturnLineItem[];
  description: string;
  documents?: any[];
  budgetReleased?: Money;
  createdDate: string;
  createdBy: string;
}
