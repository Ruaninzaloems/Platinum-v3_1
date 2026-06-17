import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';

@Injectable({ providedIn: 'root' })
export class LeaveManagementService {
  constructor(private api: ApiService) {}

  lookupEmployee(search: string): Observable<any[]> {
    return this.api.getRaw<any[]>('/employees', { search, limit: '20' }).pipe(
      map((res: any) => Array.isArray(res?.data) ? res.data : [])
    );
  }

  getSchemeTypes(employeeId: number): Observable<any[]> {
    return this.api.getRaw<any[]>(`/leave/scheme-types/${employeeId}`).pipe(
      map((res: any) => res?.data || [])
    );
  }

  getBalance(employeeId: number): Observable<any[]> {
    return this.api.getRaw<any[]>(`/leave/balance/${employeeId}`).pipe(
      map((res: any) => res?.data || [])
    );
  }

  getTransactions(filters: Record<string, any> = {}): Observable<any[]> {
    return this.api.getRaw<any[]>('/leave/transactions', filters).pipe(
      map((res: any) => res?.data || [])
    );
  }

  createTransaction(data: any): Observable<any> {
    return this.api.postRaw<any>('/leave/transactions', data);
  }

  resubmitTransaction(id: number, data: any): Observable<any> {
    return this.api.patchRaw<any>(`/leave/transactions/${id}/resubmit`, data);
  }

  approveTransaction(id: number, comments?: string): Observable<any> {
    return this.api.patchRaw<any>(`/leave/transactions/${id}/approve`, { comments: comments || null });
  }

  rejectTransaction(id: number, comments?: string): Observable<any> {
    return this.api.patchRaw<any>(`/leave/transactions/${id}/reject`, { comments: comments || null });
  }

  returnTransaction(id: number, comments?: string): Observable<any> {
    return this.api.patchRaw<any>(`/leave/transactions/${id}/return`, { comments: comments || null });
  }

  canApproveTransaction(): Observable<any> {
    return this.api.getRaw<any>('/leave/transactions/can-approve');
  }

  getTransactionHistory(id: number): Observable<any[]> {
    return this.api.getRaw<any[]>(`/leave/transactions/${id}/history`).pipe(
      map((res: any) => res?.data || [])
    );
  }

  getAdjustments(filters: Record<string, any> = {}): Observable<any[]> {
    return this.api.getRaw<any[]>('/leave/adjustments', filters).pipe(
      map((res: any) => res?.data || [])
    );
  }

  createAdjustment(data: any): Observable<any> {
    return this.api.postRaw<any>('/leave/adjustments', data);
  }

  approveAdjustment(id: number, comments?: string): Observable<any> {
    return this.api.patchRaw<any>(`/leave/adjustments/${id}/approve`, { comments: comments || null });
  }

  rejectAdjustment(id: number, comments?: string): Observable<any> {
    return this.api.patchRaw<any>(`/leave/adjustments/${id}/reject`, { comments: comments || null });
  }

  returnAdjustment(id: number, comments?: string): Observable<any> {
    return this.api.patchRaw<any>(`/leave/adjustments/${id}/return`, { comments: comments || null });
  }

  canApproveAdjustment(): Observable<any> {
    return this.api.getRaw<any>('/leave/adjustments/can-approve');
  }

  getAdjustmentHistory(id: number): Observable<any[]> {
    return this.api.getRaw<any[]>(`/leave/adjustments/${id}/history`).pipe(
      map((res: any) => res?.data || [])
    );
  }

  getCalendarEvents(params: Record<string, any> = {}): Observable<any[]> {
    return this.api.getRaw<any[]>('/leave/calendar', params).pipe(
      map((res: any) => res?.data || [])
    );
  }

  bulkApproveTransactions(ids: number[], comments?: string): Observable<any> {
    return this.api.postRaw<any>('/leave/transactions/bulk-approve', { ids, comments: comments || null });
  }

  bulkRejectTransactions(ids: number[], comments?: string): Observable<any> {
    return this.api.postRaw<any>('/leave/transactions/bulk-reject', { ids, comments: comments || null });
  }

  bulkApproveAdjustments(ids: number[], comments?: string): Observable<any> {
    return this.api.postRaw<any>('/leave/adjustments/bulk-approve', { ids, comments: comments || null });
  }

  bulkRejectAdjustments(ids: number[], comments?: string): Observable<any> {
    return this.api.postRaw<any>('/leave/adjustments/bulk-reject', { ids, comments: comments || null });
  }
}
