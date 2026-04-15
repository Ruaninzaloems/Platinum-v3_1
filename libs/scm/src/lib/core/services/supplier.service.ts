import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { Supplier, SupplierPerformance, ApiListParams, PagedResult } from '../models';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private api = inject(BaseApiService);

  getAll(params?: ApiListParams): Observable<PagedResult<Supplier>> {
    return this.api.apiGetList<Supplier>('/suppliers', params);
  }

  getById(id: string): Observable<Supplier> {
    return this.api.apiGet<Supplier>(`/suppliers/${id}`);
  }

  create(data: Partial<Supplier>): Observable<Supplier> {
    return this.api.apiPost<Supplier>('/suppliers', data);
  }

  update(id: string, data: Partial<Supplier>): Observable<Supplier> {
    return this.api.apiPut<Supplier>(`/suppliers/${id}`, data);
  }

  search(query: string, params?: ApiListParams): Observable<PagedResult<Supplier>> {
    return this.api.apiGetList<Supplier>('/suppliers/search', { ...params, search: query });
  }

  verifyCsd(id: string): Observable<Supplier> {
    return this.api.apiPost<Supplier>(`/suppliers/${id}/verify-csd`, {});
  }

  verifyTax(id: string): Observable<Supplier> {
    return this.api.apiPost<Supplier>(`/suppliers/${id}/verify-tax`, {});
  }

  verifyBbbee(id: string): Observable<Supplier> {
    return this.api.apiPost<Supplier>(`/suppliers/${id}/verify-bbbee`, {});
  }

  getPerformance(id: string): Observable<SupplierPerformance> {
    return this.api.apiGet<SupplierPerformance>(`/suppliers/${id}/performance`);
  }

  updateStatus(id: string, status: string, reason?: string): Observable<Supplier> {
    return this.api.apiPatch<Supplier>(`/suppliers/${id}/status`, { status, reason });
  }

  getCategories(): Observable<string[]> {
    return this.api.apiGet<string[]>('/suppliers/categories');
  }
}
