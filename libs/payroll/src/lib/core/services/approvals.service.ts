import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface ApprovalCounts {
  total: number;
  CLAIM: number;
  WAGE: number;
  OVERTIME: number;
  INSTALLMENT: number;
  LEAVE_REQUEST: number;
  LEAVE_ADJUSTMENT: number;
}

export type ApprovalEntityType = 'CLAIM' | 'WAGE' | 'OVERTIME' | 'INSTALLMENT' | 'LEAVE_REQUEST' | 'LEAVE_ADJUSTMENT';
export type ApprovalAction = 'approve' | 'reject' | 'return';

export interface PendingApprovalItem {
  entity_type: ApprovalEntityType;
  entity_id: number;
  employee_id: number;
  employee_code: string;
  first_name: string;
  surname: string;
  amount: number | string;
  transaction_date: string;
  description: string;
  subtype_code: string | null;
  reference_no: string | null;
  created_at: string;
  created_by: number | null;
  created_by_name: string | null;
  workflow_status: 'PENDING' | 'IN_PROGRESS';
  current_step: number;
  total_steps: number;
  sla_deadline: string | null;
}

interface ApprovalsListEnvelope {
  success?: boolean;
  data: PendingApprovalItem[];
  meta?: { counts?: ApprovalCounts };
}

interface ActionResponse {
  success?: boolean;
  message?: string;
  data?: unknown;
}

const EMPTY_COUNTS: ApprovalCounts = { total: 0, CLAIM: 0, WAGE: 0, OVERTIME: 0, INSTALLMENT: 0, LEAVE_REQUEST: 0, LEAVE_ADJUSTMENT: 0 };

@Injectable({ providedIn: 'root' })
export class ApprovalsService {
  private countsSubject = new BehaviorSubject<ApprovalCounts>(EMPTY_COUNTS);
  counts$ = this.countsSubject.asObservable();

  constructor(private api: ApiService) {}

  refreshCounts(): void {
    this.api.get<ApprovalCounts>('/approvals/count')
      .pipe(catchError(() => of(EMPTY_COUNTS)))
      .subscribe(counts => this.countsSubject.next(counts || EMPTY_COUNTS));
  }

  getCurrentCounts(): ApprovalCounts {
    return this.countsSubject.value;
  }

  list(types?: ApprovalEntityType[]): Observable<{ items: PendingApprovalItem[]; counts: ApprovalCounts }> {
    const params: Record<string, string> = {};
    if (types && types.length) params['types'] = types.join(',');
    return this.api.getRaw<PendingApprovalItem[]>('/approvals', params).pipe(
      map((res) => {
        const env = res as unknown as ApprovalsListEnvelope;
        const counts: ApprovalCounts = env.meta?.counts ?? EMPTY_COUNTS;
        this.countsSubject.next(counts);
        return { items: env.data || [], counts };
      })
    );
  }

  /** Endpoint dispatcher used to perform an action on a single item. */
  action(
    entityType: ApprovalEntityType,
    entityId: number,
    action: ApprovalAction,
    comments?: string
  ): Observable<ActionResponse> {
    const body: { comments?: string } = comments ? { comments } : {};

    if (entityType === 'CLAIM') {
      return this.api.patchRaw<ActionResponse>(`/time/claims/${entityId}/${action}`, body)
        .pipe(tap(() => this.refreshCounts()));
    }
    if (entityType === 'WAGE') {
      return this.api.postRaw<ActionResponse>(`/payroll/wages/transactions/${action}`, { ids: [entityId], comments })
        .pipe(tap(() => this.refreshCounts()));
    }
    if (entityType === 'OVERTIME') {
      return this.api.patchRaw<ActionResponse>(`/overtime/${entityId}/${action}`, body)
        .pipe(tap(() => this.refreshCounts()));
    }
    if (entityType === 'INSTALLMENT') {
      return this.api.patchRaw<ActionResponse>(`/installments/${entityId}/${action}`, body)
        .pipe(tap(() => this.refreshCounts()));
    }
    if (entityType === 'LEAVE_REQUEST') {
      return this.api.patchRaw<ActionResponse>(`/leave/transactions/${entityId}/${action}`, body)
        .pipe(tap(() => this.refreshCounts()));
    }
    if (entityType === 'LEAVE_ADJUSTMENT') {
      return this.api.patchRaw<ActionResponse>(`/leave/adjustments/${entityId}/${action}`, body)
        .pipe(tap(() => this.refreshCounts()));
    }
    throw new Error(`Unknown entity type: ${entityType}`);
  }

  /** Existing list page that shows the full transaction record for the given
   * entity type. The page accepts a `?focus=<id>` query param so the inbox
   * can hand off context. We deliberately do NOT render a duplicate detail
   * UI inside My Approvals — there is one source of truth per entity. */
  routeFor(entityType: ApprovalEntityType): string {
    switch (entityType) {
      case 'CLAIM': return '/payroll/claims';
      case 'WAGE': return '/payroll/wages';
      case 'OVERTIME': return '/payroll/overtime';
      case 'INSTALLMENT': return '/payroll/installments';
      case 'LEAVE_REQUEST': return '/leave/requests';
      case 'LEAVE_ADJUSTMENT': return '/leave/adjustments';
      default: return '/dashboard';
    }
  }

  labelFor(entityType: ApprovalEntityType): string {
    switch (entityType) {
      case 'CLAIM': return 'Claim';
      case 'WAGE': return 'Wage';
      case 'OVERTIME': return 'Overtime';
      case 'INSTALLMENT': return 'Installment';
      case 'LEAVE_REQUEST': return 'Leave Request';
      case 'LEAVE_ADJUSTMENT': return 'Leave Adjustment';
      default: return entityType;
    }
  }
}
