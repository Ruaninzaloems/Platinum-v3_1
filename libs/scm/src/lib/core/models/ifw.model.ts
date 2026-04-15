import { Money, DocumentStatus, Attachment } from './shared.model';

export type IfwType = 'irregular' | 'fruitless_wasteful' | 'unauthorized';

export interface IfwEntry {
  id: string;
  entryNumber: string;
  type: IfwType;
  description: string;
  amount: Money;
  department: string;
  discoveredDate: string;
  reportedDate: string;
  reportedBy: { id: string; name: string; };
  transactionRef?: string;
  transactionType?: string;
  rootCause: string;
  responsiblePerson?: { id: string; name: string; };
  status: 'identified' | 'under_investigation' | 'condoned' | 'not_condoned' | 'recovered' | 'written_off' | 'pending_council';
  investigationFindings?: string;
  disciplinaryAction?: string;
  recoveryAction?: string;
  recoveredAmount?: Money;
  councilResolution?: string;
  councilResolutionDate?: string;
  auditorGeneralRef?: string;
  createdAt: string;
  updatedAt: string;
  attachments?: Attachment[];
}
