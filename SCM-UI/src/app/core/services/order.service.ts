import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { PurchaseOrder, Cession, CessionType, ApiListParams, PagedResult } from '../models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private api = inject(BaseApiService);

  getAll(params?: ApiListParams): Observable<PagedResult<PurchaseOrder>> {
    return this.api.apiGetList<PurchaseOrder>('/orders', params);
  }

  getById(id: string): Observable<PurchaseOrder> {
    return this.api.apiGet<PurchaseOrder>(`/orders/${id}`);
  }

  create(data: Partial<PurchaseOrder>): Observable<PurchaseOrder> {
    return this.api.apiPost<PurchaseOrder>('/orders', data);
  }

  update(id: string, data: Partial<PurchaseOrder>): Observable<PurchaseOrder> {
    return this.api.apiPut<PurchaseOrder>(`/orders/${id}`, data);
  }

  submit(id: string): Observable<any> {
    return this.api.apiPost<any>(`/orders/${id}/submit`, {});
  }

  approve(id: string, comments?: string): Observable<any> {
    return this.api.apiPost<any>(`/orders/${id}/approve`, { comments });
  }

  decline(id: string, comment: string): Observable<any> {
    return this.api.apiPost<any>(`/orders/${id}/decline`, { comment });
  }

  dispatch(id: string): Observable<any> {
    return this.api.apiPost<any>(`/orders/${id}/dispatch`, {});
  }

  voidOrder(id: string, data: { voidType: string; voidBy: string; comments: string }): Observable<any> {
    return this.api.apiPost<any>(`/orders/${id}/void`, data);
  }

  voidPartial(id: string, data: { quantityToVoid: number; voidBy: string; comments: string }): Observable<any> {
    return this.api.apiPost<any>(`/orders/${id}/void-partial`, data);
  }

  bulkVoid(data: { orderIds: string[]; voidBy: string; comments: string; cascadeToRequisitions?: boolean }): Observable<any> {
    return this.api.apiPost<any>('/orders/bulk-void', data);
  }

  resend(id: string): Observable<any> {
    return this.api.apiPost<any>(`/orders/${id}/resend`, {});
  }

  getBudgetHistory(id: string): Observable<any> {
    return this.api.apiGet<any>(`/orders/${id}/budget-history`);
  }

  getCorrespondence(id: string): Observable<any> {
    return this.api.apiGet<any>(`/orders/${id}/correspondence`);
  }

  getStatuses(): Observable<any[]> {
    return this.api.apiGet<any[]>('/orders/statuses');
  }

  getFinancialYears(): Observable<string[]> {
    return this.api.apiGet<string[]>('/orders/financial-years');
  }

  getCessions(params?: ApiListParams): Observable<PagedResult<Cession>> {
    return this.api.apiGetList<Cession>('/orders/cessions', params);
  }

  getCessionById(id: string): Observable<Cession> {
    return this.api.apiGet<Cession>(`/orders/cessions/${id}`);
  }

  createCession(data: Partial<Cession>): Observable<Cession> {
    return this.api.apiPost<Cession>('/orders/cessions', data);
  }

  updateCession(id: string, data: Partial<Cession>): Observable<Cession> {
    return this.api.apiPut<Cession>(`/orders/cessions/${id}`, data);
  }

  deleteCession(id: string): Observable<any> {
    return this.api.apiDelete<any>(`/orders/cessions/${id}`);
  }

  getCessionTypes(): Observable<CessionType[]> {
    return this.api.apiGet<CessionType[]>('/orders/cession-types');
  }

  getDashboardSummary(): Observable<any> {
    return this.api.apiGet<any>('/orders/dashboard/summary');
  }

  getDashboardPipeline(): Observable<any> {
    return this.api.apiGet<any>('/orders/dashboard/pipeline');
  }

  getDashboardBudgetOverview(): Observable<any> {
    return this.api.apiGet<any>('/orders/dashboard/budget-overview');
  }

  getDashboardSlaPerformance(): Observable<any> {
    return this.api.apiGet<any>('/orders/dashboard/sla-performance');
  }

  getDashboardAging(): Observable<any> {
    return this.api.apiGet<any>('/orders/dashboard/aging');
  }

  getDashboardTopSuppliers(): Observable<any> {
    return this.api.apiGet<any>('/orders/dashboard/top-suppliers');
  }

  getDashboardDepartmentSpend(): Observable<any> {
    return this.api.apiGet<any>('/orders/dashboard/department-spend');
  }

  getDashboardMonthlyTrend(): Observable<any> {
    return this.api.apiGet<any>('/orders/dashboard/monthly-trend');
  }

  getAiInsights(): Observable<any> {
    return this.api.apiGet<any>('/orders/dashboard/ai-insights');
  }

  getReportOrderList(params?: any): Observable<any> {
    return this.api.apiGet<any>('/orders/reports/order-list', params);
  }

  getReportOutstandingPayments(params?: any): Observable<any> {
    return this.api.apiGet<any>('/orders/reports/outstanding-payments', params);
  }

  deleteOrder(id: string): Observable<any> {
    return this.api.apiDelete<any>(`/orders/${id}`);
  }

  getByRequisition(requisitionId: string, params?: ApiListParams): Observable<PagedResult<PurchaseOrder>> {
    return this.api.apiGetList<PurchaseOrder>(`/requisitions/${requisitionId}/orders`, params);
  }

  getBlanketOrders(params?: any): Observable<any> { return this.api.apiGet('/orders/blanket', params); }
  createBlanketOrder(data: any): Observable<any> { return this.api.apiPost('/orders/blanket/create', data); }
  releaseAgainstBlanket(id: string, data: any): Observable<any> { return this.api.apiPost(`/orders/blanket/${id}/release`, data); }
  getBlanketUtilization(id: string): Observable<any> { return this.api.apiGet(`/orders/blanket/${id}/utilization`); }
  getBlanketExpiry(id: string): Observable<any> { return this.api.apiGet(`/orders/blanket/${id}/expiry`); }
  convertToBlanket(id: string, data?: any): Observable<any> { return this.api.apiPost(`/orders/blanket/${id}/convert`, data || {}); }
  vendorAcknowledge(id: string, data: any): Observable<any> { return this.api.apiPost(`/orders/${id}/vendor-acknowledge`, data); }
  vendorReject(id: string, data: any): Observable<any> { return this.api.apiPost(`/orders/${id}/vendor-reject`, data); }
  vendorChangeRequest(id: string, data: any): Observable<any> { return this.api.apiPost(`/orders/${id}/vendor-change-request`, data); }
  getCollaborationThread(id: string): Observable<any[]> { return this.api.apiGet(`/orders/${id}/collaboration-thread`); }
  addCollaborationMessage(id: string, data: any): Observable<any> { return this.api.apiPost(`/orders/${id}/collaboration-thread`, data); }
}
