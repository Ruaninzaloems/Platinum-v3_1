import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { IfwEntry, ApiListParams, PagedResult } from '../models';

@Injectable({ providedIn: 'root' })
export class IfwService {
  private api = inject(BaseApiService);

  getAll(params?: ApiListParams): Observable<PagedResult<IfwEntry>> {
    return this.api.apiGetList<IfwEntry>('/ifw', params);
  }

  getById(id: string): Observable<IfwEntry> {
    return this.api.apiGet<IfwEntry>(`/ifw/${id}`);
  }

  create(data: Partial<IfwEntry>): Observable<IfwEntry> {
    return this.api.apiPost<IfwEntry>('/ifw', data);
  }

  update(id: string, data: Partial<IfwEntry>): Observable<IfwEntry> {
    return this.api.apiPut<IfwEntry>(`/ifw/${id}`, data);
  }

  updateStatus(id: string, status: string, details?: any): Observable<IfwEntry> {
    return this.api.apiPatch<IfwEntry>(`/ifw/${id}/status`, { status, ...details });
  }

  getSummary(params?: ApiListParams): Observable<any> {
    return this.api.apiGet<any>('/ifw/summary', params);
  }
}
