import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError } from 'rxjs';

export interface ArtApiStatus {
  connected: boolean;
  configured: boolean;
  status?: string;
  error?: string;
}

export interface ArtTableGroup {
  group: string;
  tables: string[];
}

export interface ArtTableSchema {
  table: string;
  columns: { name: string; type: string; nullable: boolean }[];
}

export interface ArtQueryOptions {
  table: string;
  top?: number;
  offset?: number;
  columns?: string;
  orderBy?: string;
  finYear?: string;
}

export interface ScmVendor {
  Vendor_ID: number;
  VendorName: string;
  RegistrationNo?: string;
  VATNo?: string;
  ContactPerson?: string;
  TelephoneNo?: string;
  EmailAddress?: string;
  [key: string]: any;
}

export interface ScmVendorBanking {
  VendorID: number;
  BankName?: string;
  BranchCode?: string;
  BankAccountNo?: string;
  AccountType?: string;
  [key: string]: any;
}

export interface ScmVendorProfile {
  vendor: ScmVendor | null;
  bankingDetails: ScmVendorBanking[];
}

export interface ScmInvoice {
  Invoice_ID: number;
  DocumentNo?: string;
  InvoiceAmount?: number;
  VendorID?: number;
  FinYear?: string;
  [key: string]: any;
}

export interface ScmInvoiceDetail {
  invoice: ScmInvoice | null;
  details: any[];
  fundAllocations: any[];
}

export interface ScmPayment {
  Payment_ID: number;
  PaymentDate?: string;
  Amount?: number;
  DocumentNo?: string;
  AllocatedAmount?: number;
  InvoiceID?: number;
  [key: string]: any;
}

export interface ScmDocumentChainSummary {
  hasRequisition: boolean;
  hasGrn: boolean;
  hasInvoice: boolean;
  hasPayment: boolean;
  hasCreditNote: boolean;
  threeWayMatch: boolean;
}

export interface ScmDocumentChain {
  documentNumber: string;
  finYear: string | null;
  chain: {
    requisitions: any[];
    grns: any[];
    invoices: any[];
    creditNotes: any[];
    sundryPayments: any[];
    payments: any[];
    cashbookEntries: any[];
  };
  vendor: ScmVendorProfile | null;
  summary: ScmDocumentChainSummary;
}

export interface AssetRegisterData {
  register: any[];
  depreciation: any[];
  acquisitions: any[];
  disposals: any[];
  annualValues: any[];
  wipRegister: any[];
}

export interface AssetSummary {
  totalAssets: number;
  totalCost: number;
  totalBookValue: number;
  totalAccDepreciation: number;
}

export interface PayrollData {
  employees: any[];
  transactions: any[];
  salaryHeads: any[];
}

export interface PayrollSummary {
  totalEmployees: number;
  totalPayrollCost: number;
}

export interface BillingData {
  accounts: any[];
  transactions: any[];
  ageing: any[];
}

export interface BillingSummary {
  totalAccounts: number;
  totalBilled: number;
  totalOutstanding: number;
}

export interface CashbookData {
  cashbook: any[];
  cashbookVotes: any[];
  bankRecon: any[];
}

export interface CashbookSummary {
  totalEntries: number;
  reversals: number;
  unauthorisedReversals: number;
}

export interface CashbookReversal {
  Cashbook_ID: number;
  DocumentNo?: string;
  DocumentType?: string;
  TransactionDate?: string;
  Amount?: number;
  IsReversal?: boolean;
  ReversalAuthorised?: boolean;
  ReversalDate?: string;
  Description?: string;
  ReferenceNo?: string;
  [key: string]: any;
}

export interface BankReconData {
  reconciliations: any[];
  statements: any[];
  reconciledItems: any[];
}

export interface BudgetData {
  originalBudget: any[];
  adjustedBudget: any[];
  projectItems: any[];
  projectMonthly: any[];
}

export interface InventoryData {
  inventory: any[];
  commodities: any[];
  stocktakes: any[];
}

export interface VatReconData {
  vatRecon: any[];
  vatReconControl: any[];
  vatRates: any[];
}

export interface DuplicatePaymentCandidate {
  InvoiceID: number;
  PaymentCount: number;
  TotalPaid: number;
  InvoiceAmount: number;
  VendorID: number;
  DocumentNo: string;
}

export interface VendorBankingAnomaly {
  BankAccountNo: string;
  VendorCount: number;
  VendorIDs: string;
}

@Injectable({ providedIn: 'root' })
export class ArtApiService {
  private baseUrl = '/api/art';
  private connectionStatus = new BehaviorSubject<'unknown' | 'connected' | 'disconnected'>('unknown');
  connectionStatus$ = this.connectionStatus.asObservable();

  constructor(private http: HttpClient) {}

  private buildParams(params?: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return httpParams;
  }

  getStatus(): Observable<ArtApiStatus> {
    return this.http.get<ArtApiStatus>(`${this.baseUrl}/status`).pipe(
      tap(status => this.connectionStatus.next(status.connected ? 'connected' : 'disconnected')),
      catchError(err => {
        this.connectionStatus.next('disconnected');
        throw err;
      }),
    );
  }

  getGroups(): Observable<ArtTableGroup[]> {
    return this.http.get<ArtTableGroup[]>(`${this.baseUrl}/groups`);
  }

  getCatalog(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/catalog`);
  }

  getTableSchema(table: string): Observable<ArtTableSchema> {
    return this.http.get<ArtTableSchema>(`${this.baseUrl}/catalog/${encodeURIComponent(table)}`);
  }

  query(options: ArtQueryOptions): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/query`, {
      params: this.buildParams({
        table: options.table,
        top: options.top,
        offset: options.offset,
        columns: options.columns,
        orderBy: options.orderBy,
        finYear: options.finYear,
      }),
    });
  }

  getScmDocumentChain(documentNumber: string, finYear?: string): Observable<ScmDocumentChain> {
    return this.http.get<ScmDocumentChain>(`${this.baseUrl}/scm/document-chain`, {
      params: this.buildParams({ documentNumber, finYear }),
    });
  }

  getVendor(id: string | number): Observable<ScmVendorProfile> {
    return this.http.get<ScmVendorProfile>(`${this.baseUrl}/scm/vendor/${id}`);
  }

  getInvoice(id: string | number): Observable<ScmInvoiceDetail> {
    return this.http.get<ScmInvoiceDetail>(`${this.baseUrl}/scm/invoice/${id}`);
  }

  getPayments(invoiceId: string | number): Observable<ScmPayment[]> {
    return this.http.get<ScmPayment[]>(`${this.baseUrl}/scm/payments`, {
      params: this.buildParams({ invoiceId }),
    });
  }

  getDuplicatePayments(finYear?: string): Observable<DuplicatePaymentCandidate[]> {
    return this.http.get<DuplicatePaymentCandidate[]>(`${this.baseUrl}/scm/duplicate-payments`, {
      params: this.buildParams({ finYear }),
    });
  }

  getVendorBankingAnomalies(finYear?: string): Observable<VendorBankingAnomaly[]> {
    return this.http.get<VendorBankingAnomaly[]>(`${this.baseUrl}/scm/vendor-banking-anomalies`, {
      params: this.buildParams({ finYear }),
    });
  }

  getAssetRegister(finYear?: string): Observable<AssetRegisterData> {
    return this.http.get<AssetRegisterData>(`${this.baseUrl}/assets/register`, {
      params: this.buildParams({ finYear }),
    });
  }

  getAssetSummary(finYear?: string): Observable<AssetSummary> {
    return this.http.get<AssetSummary>(`${this.baseUrl}/assets/summary`, {
      params: this.buildParams({ finYear }),
    });
  }

  getPayrollTransactions(finYear?: string): Observable<PayrollData> {
    return this.http.get<PayrollData>(`${this.baseUrl}/payroll/transactions`, {
      params: this.buildParams({ finYear }),
    });
  }

  getPayrollSummary(finYear?: string): Observable<PayrollSummary> {
    return this.http.get<PayrollSummary>(`${this.baseUrl}/payroll/summary`, {
      params: this.buildParams({ finYear }),
    });
  }

  getBillingTransactions(finYear?: string): Observable<BillingData> {
    return this.http.get<BillingData>(`${this.baseUrl}/billing/transactions`, {
      params: this.buildParams({ finYear }),
    });
  }

  getBillingSummary(finYear?: string): Observable<BillingSummary> {
    return this.http.get<BillingSummary>(`${this.baseUrl}/billing/summary`, {
      params: this.buildParams({ finYear }),
    });
  }

  getCashbookEntries(finYear?: string): Observable<CashbookData> {
    return this.http.get<CashbookData>(`${this.baseUrl}/cashbook/entries`, {
      params: this.buildParams({ finYear }),
    });
  }

  getCashbookSummary(finYear?: string): Observable<CashbookSummary> {
    return this.http.get<CashbookSummary>(`${this.baseUrl}/cashbook/summary`, {
      params: this.buildParams({ finYear }),
    });
  }

  getCashbookReversals(finYear?: string): Observable<CashbookReversal[]> {
    return this.http.get<CashbookReversal[]>(`${this.baseUrl}/cashbook/reversals`, {
      params: this.buildParams({ finYear }),
    });
  }

  getVendorsByBankAccount(bankAccount: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/scm/vendors-by-bank-account`, {
      params: this.buildParams({ bankAccount }),
    });
  }

  getDuplicatePaymentDetails(invoiceId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/scm/duplicate-payment-details`, {
      params: this.buildParams({ invoiceId }),
    });
  }

  getBankRecon(finYear?: string): Observable<BankReconData> {
    return this.http.get<BankReconData>(`${this.baseUrl}/bank-recon`, {
      params: this.buildParams({ finYear }),
    });
  }

  getBudgetDetail(finYear?: string): Observable<BudgetData> {
    return this.http.get<BudgetData>(`${this.baseUrl}/budget/detail`, {
      params: this.buildParams({ finYear }),
    });
  }

  getInventory(finYear?: string): Observable<InventoryData> {
    return this.http.get<InventoryData>(`${this.baseUrl}/inventory`, {
      params: this.buildParams({ finYear }),
    });
  }

  getVatRecon(finYear?: string): Observable<VatReconData> {
    return this.http.get<VatReconData>(`${this.baseUrl}/vat/recon`, {
      params: this.buildParams({ finYear }),
    });
  }

  getSummary(finYear?: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/summary`, {
      params: this.buildParams({ finYear }),
    });
  }

  getFinYears(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/fin-years`);
  }
}
