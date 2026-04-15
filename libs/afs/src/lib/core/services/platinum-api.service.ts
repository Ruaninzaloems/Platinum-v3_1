import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, of } from 'rxjs';

export interface PlatinumHealthStatus {
  connected: boolean;
  baseUrl: string;
  trialBalance: { status: string; database: string; availableYears: number };
  generalLedger: { status: string; database: string; availableYears: number };
  timestamp: string;
}

export interface PlatinumFinancialYears {
  financialYears: string[];
  tbYears: string[];
  glYears: string[];
}

export interface PlatinumTbEntry {
  voteID: number;
  voteNumber: string;
  voteDescription: string;
  finYear: string;
  scoaItemID: number;
  scoaItemCode: string;
  scoaItemShortDesc: string;
  scoaItemDescription: string;
  scoaItemLevelID: number;
  scoaParentID: number;
  postingLevel: string;
  postingLevelParent: string;
  debitCreditID: number;
  level1: string;
  level2: string;
  level3: string;
  level4: string;
  level5: string;
  level6: string;
  level7: string;
  scoaFundsCode: string;
  scoaFundsDescription: string;
  scoaFunctionCode: string;
  scoaFunctionDescription: string;
  scoaProjectCode: string;
  scoaProjectDescription: string;
  scoaCostingCode: string;
  scoaCostingDescription: string;
  scoaRegionCode: string;
  scoaRegionDescription: string;
  sortDesc: string;
  budgetOriginal: number;
  budgetAdjusted: number;
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
  debitCloseBalance: number;
  creditCloseBalance: number;
  priorYear1Balance: number;
  priorYear2Balance: number;
  priorYear3Balance: number;
}

export interface PlatinumTbSummary {
  sortDesc: string;
  entryCount: number;
  totalOpeningBalance: number;
  totalDebit: number;
  totalCredit: number;
  totalClosingBalance: number;
  totalBudgetOriginal: number;
  totalBudgetAdjusted: number;
}

export interface PlatinumGlEntry {
  genLedgerId: number;
  postingDate: string;
  processingMonth: number;
  finYear: string;
  transactionTypeID: number;
  transactionDetails: string;
  documentNumber: string;
  debit: number;
  credit: number;
  balance: number;
  dateCaptured: string;
  capturerID: number;
  divisionID: number;
  projectID: number;
  planProjectItemID: number;
  vatRate: number;
  matchTranGuid: string;
  voteID: number;
  voteNumber: string;
  voteDescription: string;
  accountNo: string;
  scoaItemID: number;
  scoaItemCode: string;
  scoaItemShortDesc: string;
  scoaItemDescription: string;
  scoaFundsID: number;
  scoaFundsCode: string;
  scoaFundsShortDesc: string;
  scoaFunctionID: number;
  scoaFunctionCode: string;
  scoaFunctionShortDesc: string;
  scoaProjectID: number;
  scoaProjectCode: string;
  scoaProjectShortDesc: string;
  scoaCostingID: number;
  scoaCostingCode: string;
  scoaCostingShortDesc: string;
  scoaRegionID: number;
  scoaRegionCode: string;
  scoaRegionShortDesc: string;
}

export interface PlatinumGlSummary {
  processingMonth: number;
  entryCount: number;
  totalDebit: number;
  totalCredit: number;
  totalBalance: number;
}

export interface PlatinumSyncStatus {
  apiConnected: boolean;
  apiFinancialYears: string[];
  localData: {
    trialBalance: { label: string; count: number }[];
    generalLedger: { label: string; count: number }[];
  };
  timestamp: string;
}

export interface PlatinumSyncResult {
  synced: number;
  financialYearId: string;
}

@Injectable({ providedIn: 'root' })
export class PlatinumApiService {
  private baseUrl = '/api/platinum';
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

  checkHealth(): Observable<PlatinumHealthStatus> {
    return this.http.get<PlatinumHealthStatus>(`${this.baseUrl}/health`).pipe(
      tap(() => this.connectionStatus.next('connected')),
      catchError(err => {
        this.connectionStatus.next('disconnected');
        throw err;
      }),
    );
  }

  getFinancialYears(): Observable<PlatinumFinancialYears> {
    return this.http.get<PlatinumFinancialYears>(`${this.baseUrl}/financial-years`);
  }

  getTrialBalance(finYear?: string, page?: number, pageSize?: number): Observable<PlatinumTbEntry[]> {
    return this.http.get<PlatinumTbEntry[]>(`${this.baseUrl}/trial-balance`, {
      params: this.buildParams({ finYear, page, pageSize }),
    });
  }

  getTrialBalanceSummary(finYear?: string): Observable<PlatinumTbSummary[]> {
    return this.http.get<PlatinumTbSummary[]>(`${this.baseUrl}/trial-balance/summary`, {
      params: this.buildParams({ finYear }),
    });
  }

  getTrialBalanceByCategory(sortDesc: string, finYear?: string, page?: number, pageSize?: number): Observable<PlatinumTbEntry[]> {
    return this.http.get<PlatinumTbEntry[]>(`${this.baseUrl}/trial-balance/by-category/${encodeURIComponent(sortDesc)}`, {
      params: this.buildParams({ finYear, page, pageSize }),
    });
  }

  getTrialBalanceByScoaItem(scoaItemCode: string, finYear?: string, page?: number, pageSize?: number): Observable<PlatinumTbEntry[]> {
    return this.http.get<PlatinumTbEntry[]>(`${this.baseUrl}/trial-balance/by-scoa-item/${encodeURIComponent(scoaItemCode)}`, {
      params: this.buildParams({ finYear, page, pageSize }),
    });
  }

  getTrialBalanceByVote(voteId: number, finYear?: string): Observable<PlatinumTbEntry> {
    return this.http.get<PlatinumTbEntry>(`${this.baseUrl}/trial-balance/by-vote/${voteId}`, {
      params: this.buildParams({ finYear }),
    });
  }

  getGeneralLedger(finYear?: string, processingMonth?: number, page?: number, pageSize?: number): Observable<PlatinumGlEntry[]> {
    return this.http.get<PlatinumGlEntry[]>(`${this.baseUrl}/general-ledger`, {
      params: this.buildParams({ finYear, processingMonth, page, pageSize }),
    });
  }

  getGeneralLedgerSummary(finYear?: string): Observable<PlatinumGlSummary[]> {
    return this.http.get<PlatinumGlSummary[]>(`${this.baseUrl}/general-ledger/summary`, {
      params: this.buildParams({ finYear }),
    });
  }

  getGeneralLedgerByVote(voteId: number, finYear?: string, page?: number, pageSize?: number): Observable<PlatinumGlEntry[]> {
    return this.http.get<PlatinumGlEntry[]>(`${this.baseUrl}/general-ledger/by-vote/${voteId}`, {
      params: this.buildParams({ finYear, page, pageSize }),
    });
  }

  getGeneralLedgerByAccount(accountNo: string, finYear?: string, page?: number, pageSize?: number): Observable<PlatinumGlEntry[]> {
    return this.http.get<PlatinumGlEntry[]>(`${this.baseUrl}/general-ledger/by-account/${encodeURIComponent(accountNo)}`, {
      params: this.buildParams({ finYear, page, pageSize }),
    });
  }

  getGeneralLedgerByDocument(documentNumber: string, finYear?: string, page?: number, pageSize?: number): Observable<PlatinumGlEntry[]> {
    return this.http.get<PlatinumGlEntry[]>(`${this.baseUrl}/general-ledger/by-document/${encodeURIComponent(documentNumber)}`, {
      params: this.buildParams({ finYear, page, pageSize }),
    });
  }

  getGeneralLedgerByScoaItem(scoaItemCode: string, finYear?: string, page?: number, pageSize?: number): Observable<PlatinumGlEntry[]> {
    return this.http.get<PlatinumGlEntry[]>(`${this.baseUrl}/general-ledger/by-scoa-item/${encodeURIComponent(scoaItemCode)}`, {
      params: this.buildParams({ finYear, page, pageSize }),
    });
  }

  getGeneralLedgerByProcessingMonth(finYear: string, month: number, page?: number, pageSize?: number): Observable<PlatinumGlEntry[]> {
    return this.http.get<PlatinumGlEntry[]>(`${this.baseUrl}/general-ledger/by-processing-month/${encodeURIComponent(finYear)}/${month}`, {
      params: this.buildParams({ page, pageSize }),
    });
  }

  getSyncStatus(): Observable<PlatinumSyncStatus> {
    return this.http.get<PlatinumSyncStatus>(`${this.baseUrl}/sync/status`);
  }

  syncTrialBalance(finYear: string): Observable<PlatinumSyncResult> {
    return this.http.post<PlatinumSyncResult>(`${this.baseUrl}/sync/trial-balance`, { finYear });
  }

  syncGeneralLedger(finYear: string): Observable<PlatinumSyncResult> {
    return this.http.post<PlatinumSyncResult>(`${this.baseUrl}/sync/general-ledger`, { finYear });
  }

  syncAll(finYear: string): Observable<{ trialBalance: PlatinumSyncResult; generalLedger: PlatinumSyncResult; timestamp: string }> {
    return this.http.post<{ trialBalance: PlatinumSyncResult; generalLedger: PlatinumSyncResult; timestamp: string }>(
      `${this.baseUrl}/sync/all`, { finYear },
    );
  }

  getEmsDataStatus(): Observable<Array<{ table: string; count: number }>> {
    return this.http.get<Array<{ table: string; count: number }>>('/api/ems-data/status');
  }

  syncEmsTable(tableName: string): Observable<{ table: string; fetched: number; inserted: number; error?: string }> {
    return this.http.post<{ table: string; fetched: number; inserted: number; error?: string }>(
      `/api/ems-data/sync/${encodeURIComponent(tableName)}`, {},
    );
  }

  syncAllEmsTables(): Observable<{ results: Array<{ table: string; fetched: number; inserted: number; error?: string }>; totalFetched: number; totalInserted: number }> {
    return this.http.post<any>('/api/ems-data/sync', {});
  }
}
