import { Money } from './shared.model';

export type InterestChargeStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'voided' | 'paid';

export interface InterestCharge {
  id: string;
  referenceNumber: string;
  supplierId: string;
  supplierName: string;
  invoiceId: string | null;
  invoiceNumber: string;
  invoiceAmount: Money;
  invoiceDate: string;
  dueDate: string;
  paymentDate: string | null;
  daysOverdue: number;
  interestRate: number;
  interestAmount: Money;
  calculationMethod: 'simple' | 'compound';
  calculationFormula: string;
  calculationDetails: string;
  status: InterestChargeStatus;
  capturedBy: string;
  capturedByName: string;
  capturedDate: string;
  submittedDate: string | null;
  approvedBy: string | null;
  approvedByName: string | null;
  approvedDate: string | null;
  rejectedBy: string | null;
  rejectedByName: string | null;
  rejectedDate: string | null;
  rejectionReason: string | null;
  voidedBy: string | null;
  voidedByName: string | null;
  voidedDate: string | null;
  voidReason: string | null;
  paidDate: string | null;
  paymentBatchId: string | null;
  comments: string;
  financialYear: string;
  source: 'manual' | 'auto_calculated';
  linkedSection65: boolean;
}

export interface InterestChargeConfig {
  statuses: string[];
  currentRate: number;
  rateSource: string;
  calculationMethod: string;
  formula: string;
}

export interface InterestChargeSummary {
  totalCharges: number;
  totalAmount: Money;
  byStatus: Record<string, number>;
  approvedUnpaid: { count: number; amount: Money };
}

export interface AgingBucketSummary {
  count: number;
  amount: Money;
}

export interface InvoiceAgeAnalysis {
  asAtDate: string;
  financialYear: string;
  aging: {
    current: AgingBucketSummary;
    '31-60': AgingBucketSummary;
    '61-90': AgingBucketSummary;
    '91-120': AgingBucketSummary;
    '120+': AgingBucketSummary;
  };
  total: AgingBucketSummary;
  details: InterestCharge[];
}

export interface CreditorTransaction {
  date: string;
  type: 'invoice' | 'payment' | 'credit_note' | 'interest';
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface CreditorReconciliation {
  supplierId: string;
  supplierName: string;
  financialYear: string;
  openingBalance: Money;
  totalInvoices: Money;
  invoiceCount: number;
  totalPayments: Money;
  paymentCount: number;
  totalCreditNotes: Money;
  creditNoteCount: number;
  totalInterestCharges: Money;
  interestChargeCount: number;
  closingBalance: Money;
  transactions: CreditorTransaction[];
}

export interface OutstandingPaymentCreditor {
  supplierId: string;
  supplierName: string;
  charges: InterestCharge[];
  totalInterest: number;
  totalInvoiceAmount: number;
  count: number;
}

export interface OutstandingPaymentReport {
  creditors: OutstandingPaymentCreditor[];
  totalCreditors: number;
  grandTotalInterest: Money;
  financialYear: string;
}
