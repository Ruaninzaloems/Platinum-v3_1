import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { PagedResult, ApiListParams } from '../models';
import {
  SupplierPerformanceConfig, SupplierIssue, BlacklistEntry,
  WhitelistEntry, PerformanceScorecard, BlacklistImportResult,
  BlacklistCheckResult, DiversityAnalytics
} from '../models/supplier-performance.model';

@Injectable({ providedIn: 'root' })
export class SupplierPerformanceService {
  private api = inject(BaseApiService);

  getConfig(): Observable<SupplierPerformanceConfig> {
    return this.api.apiGet<SupplierPerformanceConfig>('/supplier-performance/config');
  }

  getIssues(params?: ApiListParams & { supplierId?: string; category?: string; severity?: string; financialYear?: string }): Observable<PagedResult<SupplierIssue> & { summary: any }> {
    return this.api.apiGet('/supplier-performance/issues', params as any);
  }

  getIssue(id: string): Observable<SupplierIssue> {
    return this.api.apiGet<SupplierIssue>(`/supplier-performance/issues/${id}`);
  }

  createIssue(data: { supplierId: string; category: string; severity: string; description: string; linkedOrderId?: string }): Observable<{ issue: SupplierIssue }> {
    return this.api.apiPost('/supplier-performance/issues', data);
  }

  updateIssue(id: string, data: { status?: string; resolutionNotes?: string; contactEntry?: any }): Observable<{ issue: SupplierIssue }> {
    return this.api.apiPut(`/supplier-performance/issues/${id}`, data);
  }

  deleteIssue(id: string): Observable<{ issue: SupplierIssue }> {
    return this.api.apiDelete(`/supplier-performance/issues/${id}`);
  }

  getBlacklist(params?: ApiListParams & { source?: string }): Observable<PagedResult<BlacklistEntry>> {
    return this.api.apiGetList<BlacklistEntry>('/supplier-performance/blacklist', params as any);
  }

  importBlacklist(entries: any[]): Observable<BlacklistImportResult> {
    return this.api.apiPost<BlacklistImportResult>('/supplier-performance/blacklist/import', { entries });
  }

  checkBlacklist(data: { registrationNumber?: string; csdNumber?: string; supplierName?: string }): Observable<BlacklistCheckResult> {
    return this.api.apiPost<BlacklistCheckResult>('/supplier-performance/blacklist/check', data);
  }

  getWhitelist(params?: ApiListParams & { category?: string }): Observable<PagedResult<WhitelistEntry>> {
    return this.api.apiGetList<WhitelistEntry>('/supplier-performance/whitelist', params as any);
  }

  addToWhitelist(data: { supplierId: string; category: string; reason: string; validUntil?: string }): Observable<{ entry: WhitelistEntry }> {
    return this.api.apiPost('/supplier-performance/whitelist', data);
  }

  removeFromWhitelist(id: string): Observable<{ entry: WhitelistEntry }> {
    return this.api.apiDelete(`/supplier-performance/whitelist/${id}`);
  }

  getScorecards(params?: ApiListParams & { supplierId?: string; assessmentPeriod?: string }): Observable<PagedResult<PerformanceScorecard>> {
    return this.api.apiGetList<PerformanceScorecard>('/supplier-performance/scorecards', params as any);
  }

  getScorecard(id: string): Observable<PerformanceScorecard> {
    return this.api.apiGet<PerformanceScorecard>(`/supplier-performance/scorecards/${id}`);
  }

  createScorecard(data: { supplierId: string; assessmentPeriod: string; dimensions: any; recommendations?: string }): Observable<{ scorecard: PerformanceScorecard }> {
    return this.api.apiPost('/supplier-performance/scorecards', data);
  }

  getScorecardWeights(): Observable<any> {
    return this.api.apiGet('/supplier-performance/scorecard-weights');
  }

  getDiversityAnalytics(): Observable<DiversityAnalytics> {
    return this.api.apiGet<DiversityAnalytics>('/supplier-performance/diversity');
  }
}
