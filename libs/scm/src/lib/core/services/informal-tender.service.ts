import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { PagedResult, ApiListParams } from '../models';
import {
  InformalTender, InformalTenderConfig, AdjudicationMatrixEntry,
  InformalTenderException
} from '../models/informal-tender.model';

@Injectable({ providedIn: 'root' })
export class InformalTenderService {
  private api = inject(BaseApiService);

  getConfig(): Observable<{ statuses: string[]; config: InformalTenderConfig }> {
    return this.api.apiGet('/informal-tenders/config');
  }

  getAll(params?: ApiListParams & { requisitionNumber?: string; closingFromDate?: string; closingToDate?: string; orderNumber?: string }): Observable<PagedResult<InformalTender> & { summary: any }> {
    return this.api.apiGet('/informal-tenders', params as any);
  }

  getById(id: string): Observable<InformalTender> {
    return this.api.apiGet<InformalTender>(`/informal-tenders/${id}`);
  }

  create(data: Partial<InformalTender>): Observable<{ tender: InformalTender }> {
    return this.api.apiPost('/informal-tenders', data);
  }

  update(id: string, data: Partial<InformalTender>): Observable<{ tender: InformalTender }> {
    return this.api.apiPut(`/informal-tenders/${id}`, data);
  }

  assignBuyer(id: string, data: { userId: string; name: string }): Observable<{ tender: InformalTender }> {
    return this.api.apiPost(`/informal-tenders/${id}/assign-buyer`, data);
  }

  selectVendors(id: string, data: { supplierIds?: string[]; autoRotational?: boolean }): Observable<{ tender: InformalTender; vendorsSelected: number }> {
    return this.api.apiPost(`/informal-tenders/${id}/select-vendors`, data);
  }

  publish(id: string): Observable<{ tender: InformalTender; notifications: any[] }> {
    return this.api.apiPost(`/informal-tenders/${id}/publish`, {});
  }

  recordVendorResponse(id: string, data: any): Observable<{ tender: InformalTender }> {
    return this.api.apiPost(`/informal-tenders/${id}/vendor-response`, data);
  }

  adjudicate(id: string, data: { recommendedVendor: string; adjudicationNotes?: string; reasonForNotReceivingThreeQuotes?: string; requestFurtherVendors?: boolean }): Observable<{ tender: InformalTender; adjudicationMatrix: AdjudicationMatrixEntry[] }> {
    return this.api.apiPost(`/informal-tenders/${id}/adjudicate`, data);
  }

  award(id: string): Observable<{ tender: InformalTender }> {
    return this.api.apiPost(`/informal-tenders/${id}/award`, {});
  }

  approve(id: string, data: { action: string; comments?: string }): Observable<{ tender: InformalTender }> {
    return this.api.apiPost(`/informal-tenders/${id}/approve`, data);
  }

  void(id: string, voidReason: string): Observable<{ tender: InformalTender }> {
    return this.api.apiPost(`/informal-tenders/${id}/void`, { voidReason });
  }

  getExceptions(params?: { financialYear?: string; status?: string; closingFromDate?: string; closingToDate?: string }): Observable<{ exceptions: InformalTenderException[]; total: number }> {
    return this.api.apiGet('/informal-tenders/reports/exception', params as any);
  }
}
