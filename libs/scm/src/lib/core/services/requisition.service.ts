import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { Requisition, ApiListParams, PagedResult } from '../models';

@Injectable({ providedIn: 'root' })
export class RequisitionService {
  private api = inject(BaseApiService);

  getAll(params?: ApiListParams): Observable<PagedResult<Requisition>> {
    return this.api.apiGetList<Requisition>('/requisitions', params);
  }

  getById(id: string): Observable<Requisition> {
    return this.api.apiGet<Requisition>(`/requisitions/${id}`);
  }

  create(data: Partial<Requisition>): Observable<Requisition> {
    return this.api.apiPost<Requisition>('/requisitions', data);
  }

  update(id: string, data: Partial<Requisition>): Observable<Requisition> {
    return this.api.apiPut<Requisition>(`/requisitions/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.api.apiDelete<void>(`/requisitions/${id}`);
  }

  submit(id: string): Observable<Requisition> {
    return this.api.apiPost<Requisition>(`/requisitions/${id}/submit`, {});
  }

  approve(id: string, comments?: string): Observable<Requisition> {
    return this.api.apiPost<Requisition>(`/requisitions/${id}/approve`, { comments });
  }

  reject(id: string, reason: string): Observable<Requisition> {
    return this.api.apiPost<Requisition>(`/requisitions/${id}/reject`, { reason });
  }

  returnForRevision(id: string, reason: string): Observable<Requisition> {
    return this.api.apiPost<Requisition>(`/requisitions/${id}/return`, { reason });
  }

  void(id: string, reason: string): Observable<Requisition> {
    return this.api.apiPost<Requisition>(`/requisitions/${id}/void`, { reason });
  }

  recall(id: string): Observable<Requisition> {
    return this.api.apiPost<Requisition>(`/requisitions/${id}/void`, { reason: 'Recalled by requestor' });
  }

  supervisorApprove(id: string, comments?: string): Observable<any> {
    return this.api.apiPost<any>(`/requisitions/${id}/supervisor-approve`, { comments });
  }

  supervisorReject(id: string, reason: string): Observable<any> {
    return this.api.apiPost<any>(`/requisitions/${id}/supervisor-reject`, { reason });
  }

  hodApprove(id: string, comments?: string): Observable<any> {
    return this.api.apiPost<any>(`/requisitions/${id}/hod-approve`, { comments });
  }

  hodReject(id: string, reason: string): Observable<any> {
    return this.api.apiPost<any>(`/requisitions/${id}/hod-reject`, { reason });
  }
}
