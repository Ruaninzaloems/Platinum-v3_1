import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class DynamicDiscountingService {
  private api = inject(BaseApiService);

  getOffers(params?: any): Observable<any> { return this.api.apiGet('/dynamic-discounting/offers', params); }
  getOffer(id: string): Observable<any> { return this.api.apiGet(`/dynamic-discounting/offers/${id}`); }
  createOffer(data: any): Observable<any> { return this.api.apiPost('/dynamic-discounting/offers', data); }
  acceptOffer(id: string): Observable<any> { return this.api.apiPost(`/dynamic-discounting/offers/${id}/accept`, {}); }
  rejectOffer(id: string): Observable<any> { return this.api.apiPost(`/dynamic-discounting/offers/${id}/reject`, {}); }
  getSlidingScale(): Observable<any> { return this.api.apiGet('/dynamic-discounting/sliding-scale'); }
  updateSlidingScale(data: any): Observable<any> { return this.api.apiPut('/dynamic-discounting/sliding-scale', data); }
  getEnrollments(params?: any): Observable<any> { return this.api.apiGet('/dynamic-discounting/enrollments', params); }
  enrollSupplier(data: any): Observable<any> { return this.api.apiPost('/dynamic-discounting/enrollments', data); }
  unenrollSupplier(id: string): Observable<any> { return this.api.apiDelete(`/dynamic-discounting/enrollments/${id}`); }
  getSavingsDashboard(): Observable<any> { return this.api.apiGet('/dynamic-discounting/savings-dashboard'); }
  getEarlyPaymentConfig(): Observable<any> { return this.api.apiGet('/dynamic-discounting/early-payment/config'); }
  updateEarlyPaymentConfig(data: any): Observable<any> { return this.api.apiPut('/dynamic-discounting/early-payment/config', data); }
  calculateEarlyPayment(data: any): Observable<any> { return this.api.apiPost('/dynamic-discounting/early-payment/calculate', data); }
  getNettingAgreements(params?: any): Observable<any> { return this.api.apiGet('/dynamic-discounting/netting/agreements', params); }
  createNettingAgreement(data: any): Observable<any> { return this.api.apiPost('/dynamic-discounting/netting/agreements', data); }
  approveNettingAgreement(id: string): Observable<any> { return this.api.apiPost(`/dynamic-discounting/netting/agreements/${id}/approve`, {}); }
  getNettingTransactions(params?: any): Observable<any> { return this.api.apiGet('/dynamic-discounting/netting/transactions', params); }
  createNettingTransaction(data: any): Observable<any> { return this.api.apiPost('/dynamic-discounting/netting/transactions', data); }
  processNettingTransaction(id: string): Observable<any> { return this.api.apiPost(`/dynamic-discounting/netting/transactions/${id}/process`, {}); }
}
