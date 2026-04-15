import { Money, DocumentStatus, Attachment } from './shared.model';

export interface ContractMilestone {
  id: string;
  description: string;
  dueDate: string;
  completedDate?: string;
  value: Money;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  deliverables?: string;
}

export interface ContractVariation {
  id: string;
  variationNumber: string;
  description: string;
  originalValue: Money;
  variationValue: Money;
  newTotalValue: Money;
  reason: string;
  approvedBy?: string;
  approvedDate?: string;
  status: DocumentStatus;
}

export interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  description: string;
  supplier: { id: string; name: string; supplierNumber: string; };
  tenderRef?: string;
  status: 'draft' | 'active' | 'expired' | 'terminated' | 'completed' | 'suspended';
  contractType: 'fixed_price' | 'rate_based' | 'framework' | 'period';
  startDate: string;
  endDate: string;
  originalValue: Money;
  currentValue: Money;
  spentToDate: Money;
  remainingValue: Money;
  paymentTerms: string;
  department: string;
  contractManager: { id: string; name: string; };
  milestones: ContractMilestone[];
  variations: ContractVariation[];
  renewalOption: boolean;
  renewalPeriod?: string;
  performanceGuarantee?: Money;
  retentionPercentage?: number;
  slaTerms?: string;
  createdAt: string;
  updatedAt: string;
  attachments?: Attachment[];
}
