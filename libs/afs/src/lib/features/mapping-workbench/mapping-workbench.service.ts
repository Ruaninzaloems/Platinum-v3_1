import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MappingWorkbenchService {
  private baseUrl = '/api/mapping-workbench';

  constructor(private http: HttpClient) {}

  createRun(params: {
    tenantId: string;
    financialYearId: string;
    compilationId: string;
    currentYearBatchId: string;
    priorYear1BatchId?: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/runs`, params);
  }

  getEligibleBatches(compilationId: string): Observable<any> {
    const params = new HttpParams().set('compilationId', compilationId);
    return this.http.get(`${this.baseUrl}/eligible-batches`, { params });
  }

  listRuns(tenantId: string, financialYearId: string): Observable<any[]> {
    const params = new HttpParams()
      .set('tenantId', tenantId)
      .set('financialYearId', financialYearId);
    return this.http.get<any[]>(`${this.baseUrl}/runs`, { params });
  }

  getRun(runId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/runs/${runId}`);
  }

  getRunLiveStats(runId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/runs/${runId}/live-stats`);
  }

  executeMapping(runId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/runs/${runId}/execute`, {});
  }

  submitForReview(runId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/runs/${runId}/submit`, {});
  }

  approve(runId: string, acknowledgments?: {
    rc09Acknowledged?: boolean;
    rc09Reason?: string;
    rc11Acknowledged?: boolean;
    rc11Reason?: string;
    sfpHighRiskAcknowledged?: boolean;
    sfpMaterialExceptionAcknowledged?: boolean;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/runs/${runId}/approve`, acknowledgments || {});
  }

  reject(runId: string, reason: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/runs/${runId}/reject`, { reason });
  }

  reopen(runId: string, reason: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/runs/${runId}/reopen`, { reason });
  }

  abandon(runId: string, reason: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/runs/${runId}/abandon`, { reason });
  }

  getRows(runId: string, filters?: {
    matchStatus?: string;
    reviewStatus?: string;
    disclosureId?: string;
    backbone?: string;
    page?: number;
    limit?: number;
  }): Observable<{ items: any[]; total: number; page: number; limit: number }> {
    let params = new HttpParams();
    if (filters?.matchStatus) params = params.set('matchStatus', filters.matchStatus);
    if (filters?.reviewStatus) params = params.set('reviewStatus', filters.reviewStatus);
    if (filters?.disclosureId) params = params.set('disclosureId', filters.disclosureId);
    if (filters?.backbone) params = params.set('backbone', filters.backbone);
    if (filters?.page) params = params.set('page', filters.page.toString());
    if (filters?.limit) params = params.set('limit', filters.limit.toString());
    return this.http.get<any>(`${this.baseUrl}/runs/${runId}/rows`, { params });
  }

  getDisclosureTotals(runId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/runs/${runId}/disclosure-totals`);
  }

  runReconciliation(runId: string): Observable<any[]> {
    return this.http.post<any[]>(`${this.baseUrl}/runs/${runId}/reconciliation`, {});
  }

  getReconciliation(runId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/runs/${runId}/reconciliation`);
  }

  applyDecision(runId: string, decision: {
    mappingRunRowId: string;
    decisionType: string;
    newDisclosureId?: string;
    reason: string;
    unmappedClassification?: string;
    carryForward?: boolean;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/runs/${runId}/decisions`, decision);
  }

  applyBatchDecisions(runId: string, decisions: {
    rowIds: string[];
    decisionType: string;
    newDisclosureId?: string;
    reason: string;
    unmappedClassification?: string;
    carryForward?: boolean;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/runs/${runId}/decisions/batch`, decisions);
  }

  getDecisions(runId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/runs/${runId}/decisions`);
  }

  runPriorYearDiagnostics(runId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/runs/${runId}/prior-year-diagnostics`, {});
  }

  getCarryForwardCandidates(runId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/runs/${runId}/carry-forward-candidates`);
  }

  acceptCarryForward(runId: string, priorDecisionIds: string[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/runs/${runId}/carry-forward/accept`, { priorDecisionIds });
  }

  rejectCarryForward(runId: string, priorDecisionIds: string[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/runs/${runId}/carry-forward/reject`, { priorDecisionIds });
  }

  getApprovedRun(tenantId: string, financialYearId: string): Observable<any> {
    const params = new HttpParams()
      .set('tenantId', tenantId)
      .set('financialYearId', financialYearId);
    return this.http.get(`${this.baseUrl}/approved-run`, { params });
  }

  getSfpValidation(runId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/runs/${runId}/sfp-validation`);
  }

  listSfpOverrides(runId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/runs/${runId}/sfp-validation/overrides`);
  }

  createSfpOverride(runId: string, override: {
    findingCode: string;
    findingTitle: string;
    affectedAmount: number;
    overrideReason: string;
    reasonCategory: string;
    supportingNote?: string;
    supportingReference?: string;
    aggregateConfirmationAcknowledged?: boolean;
    highRiskAcknowledged?: boolean;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/runs/${runId}/sfp-validation/override`, override);
  }

  revokeSfpOverride(runId: string, findingCode: string, revokedReason: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/runs/${runId}/sfp-validation/override/${findingCode}/revoke`, { revokedReason });
  }

  getDiagnostics(runId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/runs/${runId}/diagnostics`);
  }

  getDiagnosticByType(runId: string, diagnosticType: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/runs/${runId}/diagnostics/type/${diagnosticType}`);
  }

  getDiagnosticForFinding(runId: string, findingCode: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/runs/${runId}/diagnostics/finding/${findingCode}`);
  }

  getDiagnosticRows(runId: string, diagnosticType: string, filters?: {
    matchStatus?: string;
    scoaPrefix?: string;
    segment?: string;
    disclosureId?: string;
    unmatchedReasonCode?: string;
    page?: number;
    limit?: number;
  }): Observable<{ items: any[]; total: number; page: number; limit: number; diagnosticType: string }> {
    let params = new HttpParams();
    if (filters?.matchStatus) params = params.set('matchStatus', filters.matchStatus);
    if (filters?.scoaPrefix) params = params.set('scoaPrefix', filters.scoaPrefix);
    if (filters?.segment) params = params.set('segment', filters.segment);
    if (filters?.disclosureId) params = params.set('disclosureId', filters.disclosureId);
    if (filters?.unmatchedReasonCode) params = params.set('unmatchedReasonCode', filters.unmatchedReasonCode);
    if (filters?.page) params = params.set('page', filters.page.toString());
    if (filters?.limit) params = params.set('limit', filters.limit.toString());
    return this.http.get<any>(`${this.baseUrl}/runs/${runId}/diagnostics/${diagnosticType}/rows`, { params });
  }

  getDiagnosticDisclosures(runId: string, diagnosticType: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/runs/${runId}/diagnostics/${diagnosticType}/disclosures`);
  }

  getResolvePreview(runId: string, disclosureId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/runs/${runId}/disclosures/${disclosureId}/resolve-preview`);
  }

  getBulkApplyPreview(runId: string, parentDisclosureId: string, body: {
    targetDisclosureId: string;
    rowIds?: string[];
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/runs/${runId}/disclosures/${parentDisclosureId}/bulk-apply-preview`, body);
  }

  executeBulkApply(runId: string, parentDisclosureId: string, body: {
    targetDisclosureId: string;
    rowIds: string[];
    reason: string;
    confidenceScore?: string;
    confirmLargeBatch?: boolean;
    acknowledgeLowConfidence?: boolean;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/runs/${runId}/disclosures/${parentDisclosureId}/bulk-apply`, body);
  }

  undoLastBulkApply(runId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/runs/${runId}/undo-last-bulk`, {});
  }

  getResolutionProgress(runId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/runs/${runId}/resolution-progress`);
  }

  getUnmappedRows(runId: string, filters?: {
    search?: string;
    page?: number;
    limit?: number;
    hideZeroBalance?: boolean;
  }): Observable<{ items: any[]; total: number; page: number; limit: number }> {
    let params = new HttpParams();
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.page) params = params.set('page', filters.page.toString());
    if (filters?.limit) params = params.set('limit', filters.limit.toString());
    if (filters?.hideZeroBalance) params = params.set('hideZeroBalance', 'true');
    return this.http.get<any>(`${this.baseUrl}/runs/${runId}/unmapped-rows`, { params });
  }

  getDisclosureTree(runId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/runs/${runId}/disclosure-tree`);
  }

  searchMappedRows(runId: string, q: string): Observable<{ disclosureIds: string[] }> {
    let params = new HttpParams().set('q', q);
    return this.http.get<{ disclosureIds: string[] }>(
      `${this.baseUrl}/runs/${runId}/search-mapped-rows`, { params },
    );
  }

  getDisclosureMappedRows(runId: string, disclosureId: string, page?: number, limit?: number, search?: string): Observable<{ items: any[]; total: number; page: number; limit: number }> {
    let params = new HttpParams();
    if (page) params = params.set('page', page.toString());
    if (limit) params = params.set('limit', limit.toString());
    if (search) params = params.set('search', search);
    return this.http.get<{ items: any[]; total: number; page: number; limit: number }>(
      `${this.baseUrl}/runs/${runId}/disclosure-mapped-rows/${disclosureId}`, { params },
    );
  }

  assignMapping(runId: string, body: {
    rowIds: string[];
    targetDisclosureId: string;
    reason?: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/runs/${runId}/assign-mapping`, body);
  }

  unmapRows(runId: string, body: {
    rowIds: string[];
    reason?: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/runs/${runId}/unmap-rows`, body);
  }

  autoMapFromSixNine(runId: string, disclosureId?: string): Observable<{ mapped: number; skipped: number; errors: string[]; scoped: boolean }> {
    const body: any = {};
    if (disclosureId) body.disclosureId = disclosureId;
    return this.http.post<{ mapped: number; skipped: number; errors: string[]; scoped: boolean }>(
      `${this.baseUrl}/runs/${runId}/auto-map-6-9`, body,
    );
  }

  addCustomL3Disclosure(body: {
    parentDisclosureId: string;
    lineLabel: string;
    lineCode?: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/disclosures/custom-l3`, body);
  }

  getNotesDisclosureLevels(maxLevel?: number): Observable<any[]> {
    let params = new HttpParams();
    if (maxLevel) params = params.set('maxLevel', maxLevel.toString());
    return this.http.get<any[]>(`${this.baseUrl}/disclosures/notes-levels`, { params });
  }

  getDisclosureReport(runId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/runs/${runId}/disclosure-report`);
  }

  exportDisclosureReport(runId: string): void {
    const url = `${this.baseUrl}/runs/${runId}/disclosure-report/export`;
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `disclosure-audit-report-${runId.substring(0, 8)}.xlsx`;
        a.click();
        URL.revokeObjectURL(a.href);
      },
    });
  }
}
