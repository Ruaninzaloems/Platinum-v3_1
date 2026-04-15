import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import {
  PaymentBatch, PaymentItem, CreditorAgeAnalysis, ApiListParams, PagedResult,
  CashbookAccount, PaymentTransactionType, MfmaInterestReport, VatValidationResult,
  PaymentConfig, PaymentForecastWeek, VatCategory, VatApportionmentConfig,
  VatApportionmentMethod, VatRatioHistoryEntry, VatDepartmentOverride,
  VatApportionmentResult, VatApportionmentInvoice, VatApportionmentPeriodSummary,
  VatApportionmentCalculateRequest,
  VatAiClassificationResult, VatAiRatioOptimisationResult, VatAiAnomalyResult, VatAiCorrection
} from '../models';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private api = inject(BaseApiService);

  getBatches(params?: ApiListParams): Observable<PagedResult<PaymentBatch>> {
    return this.api.apiGetList<PaymentBatch>('/payments/batches', params);
  }

  getBatchById(id: string): Observable<PaymentBatch> {
    return this.api.apiGet<PaymentBatch>(`/payments/batches/${id}`);
  }

  createBatch(data: { invoiceIds: string[]; paymentMethod?: string; transactionType?: string; cashbookAccountId?: string; payAll?: boolean; partialAmounts?: Record<string, number>; notes?: string; allowEmpty?: boolean }): Observable<PaymentBatch> {
    return this.api.apiPost<PaymentBatch>('/payments/batches', data);
  }

  updateBatch(id: string, data: Partial<PaymentBatch>): Observable<PaymentBatch> {
    return this.api.apiPut<PaymentBatch>(`/payments/batches/${id}`, data);
  }

  addInvoiceToBatch(id: string, invoiceId: string, partialAmount?: number): Observable<any> {
    return this.api.apiPost<any>(`/payments/batches/${id}/add-invoice`, { invoiceId, partialAmount });
  }

  removeInvoiceFromBatch(id: string, invoiceId: string): Observable<any> {
    return this.api.apiPost<any>(`/payments/batches/${id}/remove-invoice`, { invoiceId });
  }

  updatePartialAmount(id: string, invoiceId: string, amount: number): Observable<any> {
    return this.api.apiPost<any>(`/payments/batches/${id}/update-partial-amount`, { invoiceId, amount });
  }

  setCession(id: string, invoiceId: string, cedant: any, beneficiary: any, documents?: string[]): Observable<any> {
    return this.api.apiPost<any>(`/payments/batches/${id}/set-cession`, { invoiceId, cedant, beneficiary, documents });
  }

  approveCession(id: string, invoiceId: string): Observable<any> {
    return this.api.apiPost<any>(`/payments/batches/${id}/approve-cession`, { invoiceId });
  }

  submitBatch(id: string): Observable<any> {
    return this.api.apiPost<any>(`/payments/batches/${id}/submit`, {});
  }

  approveBatch(id: string, comments?: string): Observable<any> {
    return this.api.apiPost<any>(`/payments/batches/${id}/approve`, { comments });
  }

  declineBatch(id: string, reason: string): Observable<any> {
    return this.api.apiPost<any>(`/payments/batches/${id}/decline`, { reason });
  }

  returnBatchToCapturer(id: string): Observable<any> {
    return this.api.apiPost<any>(`/payments/batches/${id}/return-to-capturer`, {});
  }

  processBatch(id: string): Observable<any> {
    return this.api.apiPost<any>(`/payments/batches/${id}/process`, {});
  }

  generateEft(id: string): Observable<any> {
    return this.api.apiPost<any>(`/payments/batches/${id}/generate-eft`, {});
  }

  voidBatch(id: string, reason: string): Observable<any> {
    return this.api.apiPost<any>(`/payments/batches/${id}/void`, { reason });
  }

  closeOutInvoice(invoiceId: string, reason: string, writeOffAmount?: number): Observable<any> {
    return this.api.apiPost<any>('/payments/invoice-close-out', { invoiceId, reason, writeOffAmount });
  }

  approveCloseOut(invoiceId: string): Observable<any> {
    return this.api.apiPost<any>('/payments/invoice-close-out/approve', { invoiceId });
  }

  calculateMfmaInterest(params: { invoiceAmount?: number; ageDays?: number; invoiceId?: string; rate?: number }): Observable<any> {
    return this.api.apiPost<any>('/payments/mfma-interest-calculate', params);
  }

  getMfmaInterestReport(): Observable<MfmaInterestReport> {
    return this.api.apiGet<MfmaInterestReport>('/payments/mfma-interest-report');
  }

  validateVat(params: { invoiceAmountExclVat?: number; vatAmount?: number; invoiceId?: string }): Observable<VatValidationResult> {
    return this.api.apiPost<VatValidationResult>('/payments/vat-validate', params);
  }

  getCorrespondence(id: string): Observable<any> {
    return this.api.apiGet<any>(`/payments/batches/${id}/correspondence`);
  }

  getAuditTrail(id: string): Observable<any> {
    return this.api.apiGet<any>(`/payments/batches/${id}/audit-trail`);
  }

  getRemittanceAdvices(params?: ApiListParams): Observable<any> {
    return this.api.apiGet<any>('/payments/remittance-advices', params);
  }

  getRemittanceAdvice(id: string): Observable<any> {
    return this.api.apiGet<any>(`/payments/remittance-advices/${id}`);
  }

  resendRemittance(id: string): Observable<any> {
    return this.api.apiPost<any>(`/payments/remittance-advices/${id}/resend`, {});
  }

  getCreditorAgeAnalysis(params?: ApiListParams): Observable<any> {
    return this.api.apiGet<any>('/payments/creditor-age-analysis', params);
  }

  getCr01Report(params?: ApiListParams): Observable<any> {
    return this.api.apiGet<any>('/payments/cr01-report', params);
  }

  getDashboardSummary(): Observable<any> {
    return this.api.apiGet<any>('/payments/dashboard/summary');
  }

  getPaymentForecast(): Observable<PaymentForecastWeek[]> {
    return this.api.apiGet<PaymentForecastWeek[]>('/payments/payment-forecast');
  }

  getStatuses(): Observable<any[]> {
    return this.api.apiGet<any[]>('/payments/statuses');
  }

  getMethods(): Observable<any[]> {
    return this.api.apiGet<any[]>('/payments/methods');
  }

  getTransactionTypes(): Observable<PaymentTransactionType[]> {
    return this.api.apiGet<PaymentTransactionType[]>('/payments/transaction-types');
  }

  getEftConfig(): Observable<any> {
    return this.api.apiGet<any>('/payments/eft-config');
  }

  getApprovalChain(): Observable<any> {
    return this.api.apiGet<any>('/payments/approval-chain');
  }

  getConfig(): Observable<PaymentConfig> {
    return this.api.apiGet<PaymentConfig>('/payments/config');
  }

  getCr01Config(): Observable<any> {
    return this.api.apiGet<any>('/payments/cr01-config');
  }

  updateConfig(config: Partial<PaymentConfig>): Observable<any> {
    return this.api.apiPut<any>('/payments/config', config);
  }

  getCashbookAccounts(params?: { type?: string; status?: string }): Observable<CashbookAccount[]> {
    return this.api.apiGet<CashbookAccount[]>('/payments/cashbook-accounts', params as any);
  }

  getCashbookAccount(id: string): Observable<CashbookAccount> {
    return this.api.apiGet<CashbookAccount>(`/payments/cashbook-accounts/${id}`);
  }

  getVatCategories(): Observable<VatCategory[]> {
    return this.api.apiGet<VatCategory[]>('/payments/vat-categories');
  }

  getVatApportionmentConfig(): Observable<VatApportionmentConfig> {
    return this.api.apiGet<VatApportionmentConfig>('/payments/vat-apportionment/config');
  }

  updateVatApportionmentConfig(config: Partial<VatApportionmentConfig>): Observable<any> {
    return this.api.apiPut<any>('/payments/vat-apportionment/config', config);
  }

  getVatApportionmentMethods(): Observable<VatApportionmentMethod[]> {
    return this.api.apiGet<VatApportionmentMethod[]>('/payments/vat-apportionment/methods');
  }

  getVatRatioHistory(): Observable<VatRatioHistoryEntry[]> {
    return this.api.apiGet<VatRatioHistoryEntry[]>('/payments/vat-apportionment/ratio-history');
  }

  recordVatRatio(data: { period: string; ratio: number; method: string; taxableSupplies?: any; totalSupplies?: any }): Observable<any> {
    return this.api.apiPost<any>('/payments/vat-apportionment/ratio', data);
  }

  getVatDepartmentOverrides(): Observable<VatDepartmentOverride[]> {
    return this.api.apiGet<VatDepartmentOverride[]>('/payments/vat-apportionment/department-overrides');
  }

  updateVatDepartmentOverride(departmentId: string, data: Partial<VatDepartmentOverride>): Observable<any> {
    return this.api.apiPut<any>(`/payments/vat-apportionment/department-overrides/${departmentId}`, data);
  }

  calculateVatApportionment(request: VatApportionmentCalculateRequest): Observable<VatApportionmentResult> {
    return this.api.apiPost<VatApportionmentResult>('/payments/vat-apportionment/calculate', request);
  }

  getInvoiceVatApportionment(invoiceId: string): Observable<VatApportionmentInvoice> {
    return this.api.apiGet<VatApportionmentInvoice>(`/payments/vat-apportionment/invoice/${invoiceId}`);
  }

  getVatApportionmentSummary(period?: string): Observable<VatApportionmentPeriodSummary> {
    return this.api.apiGet<VatApportionmentPeriodSummary>('/payments/vat-apportionment/summary', period ? { period } as any : undefined);
  }

  aiClassifyVatCategories(lineItems: any[], context?: { supplierId?: string; supplierName?: string; supplierCategory?: string; departmentId?: string; departmentName?: string; poNumber?: string }): Observable<VatAiClassificationResult> {
    return this.api.apiPost<VatAiClassificationResult>('/payments/vat-apportionment/ai/classify', { lineItems, context });
  }

  aiOptimiseApportionmentRatios(): Observable<VatAiRatioOptimisationResult> {
    return this.api.apiPost<VatAiRatioOptimisationResult>('/payments/vat-apportionment/ai/optimise-ratios', {});
  }

  aiDetectVatAnomalies(): Observable<VatAiAnomalyResult> {
    return this.api.apiPost<VatAiAnomalyResult>('/payments/vat-apportionment/ai/detect-anomalies', {});
  }

  recordVatCorrection(correction: VatAiCorrection): Observable<any> {
    return this.api.apiPost<any>('/payments/vat-apportionment/ai/corrections', correction);
  }

  getVatCorrectionHistory(): Observable<{ corrections: VatAiCorrection[]; totalCorrections: number; categories: Record<string, number> }> {
    return this.api.apiGet<any>('/payments/vat-apportionment/ai/corrections');
  }

  calculateVatApportionmentWithAi(request: VatApportionmentCalculateRequest): Observable<VatApportionmentResult> {
    return this.api.apiPost<VatApportionmentResult>('/payments/vat-apportionment/calculate', { ...request, autoClassify: true });
  }
}
