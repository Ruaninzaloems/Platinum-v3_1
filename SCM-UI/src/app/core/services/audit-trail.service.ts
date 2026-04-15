import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { AuditEntry, ApiListParams, PagedResult } from '../models';

@Injectable({ providedIn: 'root' })
export class AuditTrailService {
  private api = inject(BaseApiService);

  getAll(params?: ApiListParams): Observable<PagedResult<AuditEntry>> {
    return this.api.apiGetList<AuditEntry>('/audit-trail', params);
  }

  getByEntity(entityType: string, entityId: string, params?: ApiListParams): Observable<PagedResult<AuditEntry>> {
    return this.api.apiGetList<AuditEntry>(`/audit-trail/entity/${entityType}/${entityId}`, params);
  }

  getByUser(userId: string, params?: ApiListParams): Observable<PagedResult<AuditEntry>> {
    return this.api.apiGetList<AuditEntry>(`/audit-trail/user/${userId}`, params);
  }

  getSummary(): Observable<any> {
    return this.api.apiGet<any>('/audit-trail/summary');
  }

  getModules(): Observable<any[]> {
    return this.api.apiGet<any[]>('/audit-trail/modules');
  }

  getActions(): Observable<any[]> {
    return this.api.apiGet<any[]>('/audit-trail/actions');
  }

  exportAuditLog(params?: any): Observable<any> {
    const queryParts: string[] = [];
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v) queryParts.push(`${k}=${encodeURIComponent(v as string)}`);
      });
    }
    const qs = queryParts.length ? `?${queryParts.join('&')}` : '';
    return this.api.apiGet<any>(`/audit-trail/export${qs}`);
  }
}
