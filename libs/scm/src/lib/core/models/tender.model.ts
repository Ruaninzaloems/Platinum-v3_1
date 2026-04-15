import { Money, DocumentStatus, Attachment, WorkflowStatus } from './shared.model';

export interface TenderLineItem {
  id: string;
  lineNumber: number;
  description: string;
  unspscCode?: string;
  quantity: number;
  unitOfMeasure: string;
  estimatedValue: Money;
}

export interface BidderSubmission {
  id: string;
  supplierRef: string;
  supplierName: string;
  submissionDate: string;
  totalPrice: Money;
  bbbeeLevel: string;
  bbbeePoints: number;
  pricePoints: number;
  functionalityPoints?: number;
  totalPoints: number;
  responsive: boolean;
  disqualificationReason?: string;
}

export interface CommitteeEvaluation {
  committeeType: 'BSC' | 'BEC' | 'BAC';
  chairperson: { id: string; name: string; };
  members: { id: string; name: string; role: string; }[];
  meetingDate: string;
  recommendation: string;
  minutesRef?: string;
  status: 'pending' | 'completed' | 'deferred';
}

export interface Tender {
  id: string;
  tenderNumber: string;
  title: string;
  description: string;
  status: DocumentStatus;
  tenderType: 'competitive_bidding' | 'rfq_three_quotes' | 'rfp' | 'limited_bidding' | 'sole_source' | 'emergency';
  procurementMethod: string;
  estimatedValue: Money;
  scoringMethod: '80_20' | '90_10' | 'functionality_price';
  functionalityThreshold?: number;
  lineItems: TenderLineItem[];
  department: string;
  closingDate: string;
  closingTime: string;
  briefingDate?: string;
  briefingVenue?: string;
  compulsoryBriefing: boolean;
  publishedDate?: string;
  awardedDate?: string;
  awardedTo?: { id: string; name: string; amount: Money; };
  bidders: BidderSubmission[];
  bscEvaluation?: CommitteeEvaluation;
  becEvaluation?: CommitteeEvaluation;
  bacEvaluation?: CommitteeEvaluation;
  createdBy: { id: string; name: string; };
  createdAt: string;
  updatedAt: string;
  workflow?: WorkflowStatus;
  attachments?: Attachment[];
}
