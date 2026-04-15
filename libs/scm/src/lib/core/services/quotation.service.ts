import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import {
  RequestForQuotation, SupplierQuote, ApiListParams, PagedResult,
  RotationalVendor, QuotationConfig, BudgetVote, BudgetValidationResult,
  QuotationRegisterReport, QuotationExceptionReport, ProcessBoundary, ScoringMethod
} from '../models';

@Injectable({ providedIn: 'root' })
export class QuotationService {
  private api = inject(BaseApiService);

  getAll(params?: ApiListParams): Observable<PagedResult<RequestForQuotation>> {
    return this.api.apiGetList<RequestForQuotation>('/quotations', params);
  }

  getById(id: string): Observable<RequestForQuotation> {
    return this.api.apiGet<RequestForQuotation>(`/quotations/${id}`);
  }

  create(data: Partial<RequestForQuotation>): Observable<RequestForQuotation> {
    return this.api.apiPost<RequestForQuotation>('/quotations', data);
  }

  update(id: string, data: Partial<RequestForQuotation>): Observable<RequestForQuotation> {
    return this.api.apiPut<RequestForQuotation>(`/quotations/${id}`, data);
  }

  assignBuyer(id: string, buyerId: string, buyerName: string): Observable<any> {
    return this.api.apiPost<any>(`/quotations/${id}/assign-buyer`, { buyerId, buyerName });
  }

  publish(id: string, vendorIds?: string[]): Observable<any> {
    return this.api.apiPost<any>(`/quotations/${id}/publish`, { vendorIds: vendorIds || [] });
  }

  close(id: string): Observable<any> {
    return this.api.apiPost<any>(`/quotations/${id}/close`, {});
  }

  addQuote(id: string, quote: Partial<SupplierQuote>): Observable<any> {
    return this.api.apiPost<any>(`/quotations/${id}/quotes`, quote);
  }

  updateQuoteStatus(id: string, quoteId: string, data: { status?: string; complianceStatus?: string; nonComplianceReason?: string }): Observable<any> {
    return this.api.apiPut<any>(`/quotations/${id}/quotes/${quoteId}/status`, data);
  }

  evaluateQuotes(id: string): Observable<any> {
    return this.api.apiPost<any>(`/quotations/${id}/evaluate`, {});
  }

  saveAdjudication(id: string, quoteUpdates: any[]): Observable<any> {
    return this.api.apiPost<any>(`/quotations/${id}/save-adjudication`, { quoteUpdates });
  }

  requestFurtherVendor(id: string, vendorIds: string[], reason: string): Observable<any> {
    return this.api.apiPost<any>(`/quotations/${id}/request-further-vendor`, { vendorIds, reason });
  }

  submitThreeQuoteJustification(id: string, justification: string): Observable<any> {
    return this.api.apiPost<any>(`/quotations/${id}/three-quote-justification`, { justification });
  }

  awardQuote(id: string, quoteId: string, overruleReason?: string): Observable<any> {
    return this.api.apiPost<any>(`/quotations/${id}/award`, { quoteId, overruleReason });
  }

  approve(id: string, comments?: string, transactionLimit?: number): Observable<any> {
    return this.api.apiPost<any>(`/quotations/${id}/approve`, { comments, transactionLimit });
  }

  decline(id: string, reason: string): Observable<any> {
    return this.api.apiPost<any>(`/quotations/${id}/decline`, { reason });
  }

  returnToCapturer(id: string): Observable<any> {
    return this.api.apiPost<any>(`/quotations/${id}/return-to-capturer`, {});
  }

  void(id: string, reason: string): Observable<any> {
    return this.api.apiPost<any>(`/quotations/${id}/void`, { reason });
  }

  getAuditTrail(id: string): Observable<any> {
    return this.api.apiGet<any>(`/quotations/${id}/audit-trail`);
  }

  getNotifications(id: string): Observable<any> {
    return this.api.apiGet<any>(`/quotations/${id}/notifications`);
  }

  sendNotification(id: string, supplierId: string, type: string, channel: string): Observable<any> {
    return this.api.apiPost<any>(`/quotations/${id}/send-notification`, { supplierId, type, channel });
  }

  generateDocument(id: string, format?: string): Observable<any> {
    return this.api.apiPost<any>(`/quotations/${id}/generate-document`, { format: format || 'pdf' });
  }

  getRotationalVendors(params?: { businessArea?: string; subSector?: string; province?: string; city?: string; count?: number }): Observable<any> {
    return this.api.apiGet<any>('/quotations/rotational-vendors', params as any);
  }

  getBudgetVotes(): Observable<BudgetVote[]> {
    return this.api.apiGet<BudgetVote[]>('/quotations/budget-votes');
  }

  validateBudget(voteNumber: string, amount: number): Observable<BudgetValidationResult> {
    return this.api.apiPost<BudgetValidationResult>('/quotations/budget-validate', { voteNumber, amount });
  }

  getConfig(): Observable<QuotationConfig> {
    return this.api.apiGet<QuotationConfig>('/quotations/config');
  }

  updateConfig(config: Partial<QuotationConfig>): Observable<any> {
    return this.api.apiPut<any>('/quotations/config', config);
  }

  getScoringMethods(): Observable<ScoringMethod[]> {
    return this.api.apiGet<ScoringMethod[]>('/quotations/config/scoring-methods');
  }

  getServiceTypes(): Observable<string[]> {
    return this.api.apiGet<string[]>('/quotations/config/service-types');
  }

  getBusinessAreas(): Observable<string[]> {
    return this.api.apiGet<string[]>('/quotations/config/business-areas');
  }

  getSubSectors(): Observable<string[]> {
    return this.api.apiGet<string[]>('/quotations/config/sub-sectors');
  }

  getProcessBoundaries(): Observable<ProcessBoundary[]> {
    return this.api.apiGet<ProcessBoundary[]>('/quotations/config/process-boundaries');
  }

  updateProcessBoundary(id: string, data: Partial<ProcessBoundary>): Observable<any> {
    return this.api.apiPut<any>(`/quotations/config/process-boundaries/${id}`, data);
  }

  getApprovalChain(): Observable<any[]> {
    return this.api.apiGet<any[]>('/quotations/config/approval-chain');
  }

  getEmailTemplates(): Observable<any> {
    return this.api.apiGet<any>('/quotations/config/email-templates');
  }

  getRegisterReport(params?: ApiListParams): Observable<QuotationRegisterReport> {
    return this.api.apiGet<QuotationRegisterReport>('/quotations/reports/register', params);
  }

  getExceptionReport(params?: ApiListParams): Observable<QuotationExceptionReport> {
    return this.api.apiGet<QuotationExceptionReport>('/quotations/reports/exceptions', params);
  }

  getVendorResponseRates(): Observable<any> {
    return this.api.apiGet<any>('/quotations/reports/vendor-response-rates');
  }

  getDashboardSummary(): Observable<any> {
    return this.api.apiGet<any>('/quotations/dashboard/summary');
  }
}
