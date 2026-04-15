import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class ReverseAuctionService {
  private api = inject(BaseApiService);

  list(params?: any): Observable<any> { return this.api.apiGet('/reverse-auctions', params); }
  get(id: string): Observable<any> { return this.api.apiGet(`/reverse-auctions/${id}`); }
  create(data: any): Observable<any> { return this.api.apiPost('/reverse-auctions', data); }
  update(id: string, data: any): Observable<any> { return this.api.apiPut(`/reverse-auctions/${id}`, data); }
  publish(id: string): Observable<any> { return this.api.apiPost(`/reverse-auctions/${id}/publish`, {}); }
  start(id: string): Observable<any> { return this.api.apiPost(`/reverse-auctions/${id}/start`, {}); }
  close(id: string): Observable<any> { return this.api.apiPost(`/reverse-auctions/${id}/close`, {}); }
  cancel(id: string, reason: string): Observable<any> { return this.api.apiPost(`/reverse-auctions/${id}/cancel`, { reason }); }
  award(id: string, bidId: string): Observable<any> { return this.api.apiPost(`/reverse-auctions/${id}/award`, { bidId }); }
  invite(id: string, vendorIds: string[]): Observable<any> { return this.api.apiPost(`/reverse-auctions/${id}/invite`, { vendorIds }); }
  placeBid(id: string, data: any): Observable<any> { return this.api.apiPost(`/reverse-auctions/${id}/bid`, data); }
  getBids(id: string): Observable<any[]> { return this.api.apiGet(`/reverse-auctions/${id}/bids`); }
  getLiveStatus(id: string): Observable<any> { return this.api.apiGet(`/reverse-auctions/${id}/live-status`); }
  getDashboard(): Observable<any> { return this.api.apiGet('/reverse-auctions/dashboard'); }
  getConfig(): Observable<any> { return this.api.apiGet('/reverse-auctions/config'); }
  updateConfig(data: any): Observable<any> { return this.api.apiPut('/reverse-auctions/config', data); }
}
