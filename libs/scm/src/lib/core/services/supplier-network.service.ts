import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class SupplierNetworkService {
  private api = inject(BaseApiService);

  getDirectory(params?: any): Observable<any> { return this.api.apiGet('/supplier-network/directory', params); }
  getVendor(id: string): Observable<any> { return this.api.apiGet(`/supplier-network/directory/${id}`); }
  search(params: any): Observable<any> { return this.api.apiGet('/supplier-network/search', params); }
  inviteToRegister(data: any): Observable<any> { return this.api.apiPost('/supplier-network/invite', data); }
  getInvitations(params?: any): Observable<any> { return this.api.apiGet('/supplier-network/invitations', params); }
  getBenchmarks(): Observable<any> { return this.api.apiGet('/supplier-network/benchmarks'); }
  getSpendComparison(): Observable<any> { return this.api.apiGet('/supplier-network/benchmarks/spend-comparison'); }
  getPriceIndices(): Observable<any> { return this.api.apiGet('/supplier-network/benchmarks/price-indices'); }
  getCategoryAverages(): Observable<any> { return this.api.apiGet('/supplier-network/benchmarks/category-averages'); }
  getMessages(params?: any): Observable<any> { return this.api.apiGet('/supplier-network/collaboration/messages', params); }
  sendMessage(data: any): Observable<any> { return this.api.apiPost('/supplier-network/collaboration/messages', data); }
  getSharedDocs(params?: any): Observable<any> { return this.api.apiGet('/supplier-network/collaboration/shared-docs', params); }
  shareDocument(data: any): Observable<any> { return this.api.apiPost('/supplier-network/collaboration/shared-docs', data); }
  getActionItems(params?: any): Observable<any> { return this.api.apiGet('/supplier-network/collaboration/action-items', params); }
  createActionItem(data: any): Observable<any> { return this.api.apiPost('/supplier-network/collaboration/action-items', data); }
  updateActionItem(id: string, data: any): Observable<any> { return this.api.apiPut(`/supplier-network/collaboration/action-items/${id}`, data); }
  getMeetings(params?: any): Observable<any> { return this.api.apiGet('/supplier-network/collaboration/meetings', params); }
  scheduleMeeting(data: any): Observable<any> { return this.api.apiPost('/supplier-network/collaboration/meetings', data); }
  getDashboard(): Observable<any> { return this.api.apiGet('/supplier-network/dashboard'); }
}
