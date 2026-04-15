import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { DelegationOfAuthority, AuthorityThreshold, ApiListParams, PagedResult } from '../models';

@Injectable({ providedIn: 'root' })
export class DelegationService {
  private api = inject(BaseApiService);

  getAll(params?: ApiListParams): Observable<PagedResult<DelegationOfAuthority>> {
    return this.api.apiGetList<DelegationOfAuthority>('/delegations', params);
  }

  getById(id: string): Observable<DelegationOfAuthority> {
    return this.api.apiGet<DelegationOfAuthority>(`/delegations/${id}`);
  }

  create(data: Partial<DelegationOfAuthority>): Observable<DelegationOfAuthority> {
    return this.api.apiPost<DelegationOfAuthority>('/delegations', data);
  }

  update(id: string, data: Partial<DelegationOfAuthority>): Observable<DelegationOfAuthority> {
    return this.api.apiPut<DelegationOfAuthority>(`/delegations/${id}`, data);
  }

  revoke(id: string, reason: string): Observable<DelegationOfAuthority> {
    return this.api.apiPost<DelegationOfAuthority>(`/delegations/${id}/revoke`, { reason });
  }

  getThresholds(params?: ApiListParams): Observable<AuthorityThreshold[]> {
    return this.api.apiGet<AuthorityThreshold[]>('/delegations/thresholds', params);
  }

  updateThreshold(id: string, data: Partial<AuthorityThreshold>): Observable<AuthorityThreshold> {
    return this.api.apiPut<AuthorityThreshold>(`/delegations/thresholds/${id}`, data);
  }
}
