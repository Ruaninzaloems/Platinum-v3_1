import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { GoodsReturn, GoodsReturnAdvice, ApiListParams, PagedResult } from '../models';

@Injectable({ providedIn: 'root' })
export class GraService {
  private api = inject(BaseApiService);

  getReturns(params?: ApiListParams): Observable<PagedResult<GoodsReturn>> {
    return this.api.apiGetList<GoodsReturn>('/gra/returns', params);
  }

  getReturnById(id: string): Observable<GoodsReturn> {
    return this.api.apiGet<GoodsReturn>(`/gra/returns/${id}`);
  }

  createReturn(data: Partial<GoodsReturn>): Observable<GoodsReturn> {
    return this.api.apiPost<GoodsReturn>('/gra/returns', data);
  }

  submitReturn(id: string): Observable<any> {
    return this.api.apiPost<any>(`/gra/returns/${id}/submit`, {});
  }

  approveReturn(id: string, comments?: string): Observable<any> {
    return this.api.apiPost<any>(`/gra/returns/${id}/approve`, { comments });
  }

  declineReturn(id: string, comment: string): Observable<any> {
    return this.api.apiPost<any>(`/gra/returns/${id}/decline`, { comment });
  }

  getGras(params?: ApiListParams): Observable<PagedResult<GoodsReturnAdvice>> {
    return this.api.apiGetList<GoodsReturnAdvice>('/gra', params);
  }

  getGraById(id: string): Observable<GoodsReturnAdvice> {
    return this.api.apiGet<GoodsReturnAdvice>(`/gra/${id}`);
  }

  createGra(data: { returnId: string; description: string }): Observable<GoodsReturnAdvice> {
    return this.api.apiPost<GoodsReturnAdvice>('/gra', data);
  }

  uploadDocument(id: string, data: any): Observable<any> {
    return this.api.apiPost<any>(`/gra/${id}/documents`, data);
  }

  getPdf(id: string): Observable<any> {
    return this.api.apiGet<any>(`/gra/${id}/pdf`);
  }

  getDebitNote(id: string): Observable<any> {
    return this.api.apiGet<any>(`/gra/${id}/debit-note`);
  }

  getDashboardSummary(): Observable<any> {
    return this.api.apiGet<any>('/gra/dashboard/summary');
  }
}
