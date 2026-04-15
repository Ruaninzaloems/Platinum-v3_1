import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { Invoice, ThreeWayMatch, ApiListParams, PagedResult } from '../models';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private api = inject(BaseApiService);

  getAll(params?: ApiListParams): Observable<PagedResult<Invoice>> {
    return this.api.apiGetList<Invoice>('/invoices', params);
  }

  getById(id: string): Observable<any> {
    return this.api.apiGet<any>(`/invoices/${id}`);
  }

  create(data: Partial<Invoice>): Observable<any> {
    return this.api.apiPost<any>('/invoices', data);
  }

  update(id: string, data: Partial<Invoice>): Observable<any> {
    return this.api.apiPut<any>(`/invoices/${id}`, data);
  }

  submit(id: string): Observable<any> {
    return this.api.apiPost<any>(`/invoices/${id}/submit`, {});
  }

  approve(id: string, comments?: string): Observable<any> {
    return this.api.apiPost<any>(`/invoices/${id}/approve`, { comments });
  }

  reject(id: string, reason: string): Observable<any> {
    return this.api.apiPost<any>(`/invoices/${id}/reject`, { reason });
  }

  voidInvoice(id: string, reason?: string): Observable<any> {
    return this.api.apiPost<any>(`/invoices/${id}/void`, { reason });
  }

  hold(id: string, reason?: string): Observable<any> {
    return this.api.apiPost<any>(`/invoices/${id}/hold`, { reason });
  }

  releaseHold(id: string): Observable<any> {
    return this.api.apiPost<any>(`/invoices/${id}/release-hold`, {});
  }

  dispute(id: string, reason?: string): Observable<any> {
    return this.api.apiPost<any>(`/invoices/${id}/dispute`, { reason });
  }

  matchInvoice(id: string): Observable<any> {
    return this.api.apiPost<any>(`/invoices/${id}/match`, {});
  }

  resolveException(id: string, resolution: string, comments?: string): Observable<any> {
    return this.api.apiPost<any>(`/invoices/${id}/resolve-exception`, { resolution, comments });
  }

  getMatchDetails(id: string): Observable<any> {
    return this.api.apiGet<any>(`/invoices/${id}/match-details`);
  }

  getDocuments(id: string): Observable<any> {
    return this.api.apiGet<any>(`/invoices/${id}/documents`);
  }

  uploadDocument(id: string, doc: any): Observable<any> {
    return this.api.apiPost<any>(`/invoices/${id}/documents`, doc);
  }

  deleteDocument(id: string, docId: string): Observable<any> {
    return this.api.apiDelete<any>(`/invoices/${id}/documents/${docId}`);
  }

  getAuditTrail(id: string): Observable<any> {
    return this.api.apiGet<any>(`/invoices/${id}/audit-trail`);
  }

  getCorrespondence(id: string): Observable<any> {
    return this.api.apiGet<any>(`/invoices/${id}/correspondence`);
  }

  addCession(id: string, cession: any): Observable<any> {
    return this.api.apiPost<any>(`/invoices/${id}/cessions`, cession);
  }

  getCessions(id: string): Observable<any> {
    return this.api.apiGet<any>(`/invoices/${id}/cessions`);
  }

  addDebitCreditNote(id: string, note: any): Observable<any> {
    return this.api.apiPost<any>(`/invoices/${id}/debit-credit-notes`, note);
  }

  getDebitCreditNotes(id: string): Observable<any> {
    return this.api.apiGet<any>(`/invoices/${id}/debit-credit-notes`);
  }

  ocrExtract(data: any): Observable<any> {
    return this.api.apiPost<any>('/invoices/ocr-extract', data);
  }

  getOcrExtractions(params?: ApiListParams): Observable<any> {
    return this.api.apiGet<any>('/invoices/ocr-extractions', params);
  }

  getOcrExtraction(id: string): Observable<any> {
    return this.api.apiGet<any>(`/invoices/ocr-extractions/${id}`);
  }

  verifyOcrExtraction(id: string, corrections: any): Observable<any> {
    return this.api.apiPost<any>(`/invoices/ocr-extractions/${id}/verify`, { corrections });
  }

  createFromOcr(id: string, data: any): Observable<any> {
    return this.api.apiPost<any>(`/invoices/ocr-extractions/${id}/create-invoice`, data);
  }

  getTypes(): Observable<any[]> {
    return this.api.apiGet<any[]>('/invoices/types');
  }

  getStatuses(): Observable<any[]> {
    return this.api.apiGet<any[]>('/invoices/statuses');
  }

  getSundryCategories(): Observable<any[]> {
    return this.api.apiGet<any[]>('/invoices/sundry-categories');
  }

  getMatchConfig(): Observable<any> {
    return this.api.apiGet<any>('/invoices/match-config');
  }

  getApprovalChain(): Observable<any> {
    return this.api.apiGet<any>('/invoices/approval-chain');
  }

  getVarianceLimits(): Observable<any> {
    return this.api.apiGet<any>('/invoices/variance-limits');
  }

  getMfmaConfig(): Observable<any> {
    return this.api.apiGet<any>('/invoices/mfma-config');
  }

  getDocumentCategories(): Observable<any[]> {
    return this.api.apiGet<any[]>('/invoices/document-categories');
  }

  getDocumentRequirements(): Observable<any> {
    return this.api.apiGet<any>('/invoices/document-requirements');
  }

  getDebitCreditTypes(): Observable<any[]> {
    return this.api.apiGet<any[]>('/invoices/debit-credit-types');
  }

  getPendingApproval(): Observable<any> {
    return this.api.apiGet<any>('/invoices/pending-approval');
  }

  getMatchExceptions(): Observable<any> {
    return this.api.apiGet<any>('/invoices/match-exceptions');
  }

  getOverdue(): Observable<any> {
    return this.api.apiGet<any>('/invoices/overdue');
  }

  getMfmaCompliance(): Observable<any> {
    return this.api.apiGet<any>('/invoices/mfma-compliance');
  }

  getAgeAnalysis(): Observable<any> {
    return this.api.apiGet<any>('/invoices/age-analysis');
  }

  getTouchlessRate(): Observable<any> {
    return this.api.apiGet<any>('/invoices/touchless-rate');
  }

  getPipeline(): Observable<any[]> {
    return this.api.apiGet<any[]>('/invoices/pipeline');
  }

  getDashboardSummary(): Observable<any> {
    return this.api.apiGet<any>('/invoices/dashboard/summary');
  }

  getSupplierAnalysis(): Observable<any[]> {
    return this.api.apiGet<any[]>('/invoices/dashboard/supplier-analysis');
  }
}
