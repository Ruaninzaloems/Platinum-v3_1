import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { Tender, BidderSubmission, CommitteeEvaluation, ApiListParams, PagedResult } from '../models';

@Injectable({ providedIn: 'root' })
export class TenderService {
  private api = inject(BaseApiService);

  getAll(params?: ApiListParams): Observable<PagedResult<Tender>> {
    return this.api.apiGetList<Tender>('/tenders', params);
  }

  getById(id: string): Observable<Tender> {
    return this.api.apiGet<Tender>(`/tenders/${id}`);
  }

  create(data: Partial<Tender>): Observable<Tender> {
    return this.api.apiPost<Tender>('/tenders', data);
  }

  update(id: string, data: Partial<Tender>): Observable<Tender> {
    return this.api.apiPut<Tender>(`/tenders/${id}`, data);
  }

  publish(id: string): Observable<Tender> {
    return this.api.apiPost<Tender>(`/tenders/${id}/publish`, {});
  }

  close(id: string): Observable<Tender> {
    return this.api.apiPost<Tender>(`/tenders/${id}/close`, {});
  }

  evaluateBsc(id: string, evaluation: Partial<CommitteeEvaluation>): Observable<Tender> {
    return this.api.apiPost<Tender>(`/tenders/${id}/evaluate/bsc`, evaluation);
  }

  evaluateBec(id: string, evaluation: Partial<CommitteeEvaluation>): Observable<Tender> {
    return this.api.apiPost<Tender>(`/tenders/${id}/evaluate/bec`, evaluation);
  }

  evaluateBac(id: string, evaluation: Partial<CommitteeEvaluation>): Observable<Tender> {
    return this.api.apiPost<Tender>(`/tenders/${id}/evaluate/bac`, evaluation);
  }

  award(id: string, supplierId: string, amount: number): Observable<Tender> {
    return this.api.apiPost<Tender>(`/tenders/${id}/award`, { supplierId, amount });
  }

  cancel(id: string, reason: string): Observable<Tender> {
    return this.api.apiPost<Tender>(`/tenders/${id}/cancel`, { reason });
  }

  getBidders(id: string): Observable<BidderSubmission[]> {
    return this.api.apiGet<BidderSubmission[]>(`/tenders/${id}/bidders`);
  }

  delete(id: string): Observable<void> {
    return this.api.apiDelete<void>(`/tenders/${id}`);
  }

  bscApprove(id: string, recommendation: string): Observable<Tender> {
    return this.api.apiPost<Tender>(`/tenders/${id}/bsc/approve`, { recommendation });
  }

  bscRevise(id: string, comments: string): Observable<Tender> {
    return this.api.apiPost<Tender>(`/tenders/${id}/bsc/revise`, { comments });
  }

  startEvaluation(id: string): Observable<Tender> {
    return this.api.apiPost<Tender>(`/tenders/${id}/bec/start`, {});
  }
}
