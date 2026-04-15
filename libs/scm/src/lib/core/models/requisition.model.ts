import { Money, MscoaSegment, DocumentStatus, Attachment, WorkflowStatus } from './shared.model';

export interface RequisitionLineItem {
  id: string;
  lineNumber: number;
  description: string;
  unspscCode?: string;
  unspscDescription?: string;
  quantity: number;
  unitOfMeasure: string;
  estimatedUnitPrice: Money;
  estimatedTotal: Money;
  mscoaSegment: MscoaSegment;
  budgetAvailable?: Money;
  deliveryDate?: string;
  specifications?: string;
}

export interface Requisition {
  id: string;
  requisitionNumber: string;
  title: string;
  description: string;
  requestor: { id: string; name: string; department: string; costCentre: string; };
  department: string;
  costCentre: string;
  requisitionType: 'goods' | 'services' | 'works' | 'mixed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: DocumentStatus;
  lineItems: RequisitionLineItem[];
  totalEstimatedValue: Money;
  budgetYear: string;
  demandPlanRef?: string;
  justification: string;
  preferredSupplier?: string;
  deliveryAddress: string;
  requiredByDate: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  workflow?: WorkflowStatus;
  attachments?: Attachment[];
  procurementMethod?: string;
}
