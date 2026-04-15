import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { PagedResult, ApiListParams } from '../models';
import {
  InterestCharge, InterestChargeConfig, InterestChargeSummary,
  InvoiceAgeAnalysis, CreditorReconciliation, OutstandingPaymentReport
} from '../models/interest-charge.model';

@Injectable({ providedIn: 'root' })
export class InterestChargeService {
  private api = inject(BaseApiService);

  getConfig(): Observable<InterestChargeConfig> {
    return this.api.apiGet<InterestChargeConfig>('/interest-charges/config');
  }

  getAll(params?: ApiListParams & { supplierId?: string; financialYear?: string; source?: string }): Observable<PagedResult<InterestCharge> & { summary: InterestChargeSummary }> {
    return this.api.apiGet('/interest-charges', params as any);
  }

  getById(id: string): Observable<InterestCharge> {
    return this.api.apiGet<InterestCharge>(`/interest-charges/${id}`);
  }

  create(data: Partial<InterestCharge>): Observable<{ charge: InterestCharge }> {
    return this.api.apiPost('/interest-charges', data);
  }

  submit(id: string): Observable<{ charge: InterestCharge }> {
    return this.api.apiPost(`/interest-charges/${id}/submit`, {});
  }

  approve(id: string, data: { action: 'approve' | 'reject'; rejectionReason?: string }): Observable<{ charge: InterestCharge }> {
    return this.api.apiPost(`/interest-charges/${id}/approve`, data);
  }

  void(id: string, voidReason: string): Observable<{ charge: InterestCharge }> {
    return this.api.apiPost(`/interest-charges/${id}/void`, { voidReason });
  }

  getInvoiceAgeAnalysis(params?: { financialYear?: string; agingAsAt?: string }): Observable<InvoiceAgeAnalysis> {
    return this.api.apiGet<InvoiceAgeAnalysis>('/interest-charges/reports/invoice-age-analysis', params as any);
  }

  getCreditorReconciliation(params?: { supplierId?: string; financialYear?: string; fromDate?: string; toDate?: string }): Observable<{ reconciliations: CreditorReconciliation[]; total: number }> {
    return this.api.apiGet('/interest-charges/reports/creditor-reconciliation', params as any);
  }

  getOutstandingPayments(params?: { financialYear?: string }): Observable<OutstandingPaymentReport> {
    return this.api.apiGet<OutstandingPaymentReport>('/interest-charges/reports/outstanding-payments', params as any);
  }
}
