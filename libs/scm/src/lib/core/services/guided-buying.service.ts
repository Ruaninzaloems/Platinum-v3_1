import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class GuidedBuyingService {
  private api = inject(BaseApiService);

  getCategories(): Observable<any[]> { return this.api.apiGet('/guided-buying/categories'); }
  searchCatalog(params?: any): Observable<any> { return this.api.apiGet('/guided-buying/catalog/search', params); }
  getCatalogItem(id: string): Observable<any> { return this.api.apiGet(`/guided-buying/catalog/${id}`); }
  createCatalogItem(data: any): Observable<any> { return this.api.apiPost('/guided-buying/catalog', data); }
  updateCatalogItem(id: string, data: any): Observable<any> { return this.api.apiPut(`/guided-buying/catalog/${id}`, data); }
  deactivateCatalogItem(id: string): Observable<any> { return this.api.apiDelete(`/guided-buying/catalog/${id}`); }
  getFrequentlyOrdered(): Observable<any[]> { return this.api.apiGet('/guided-buying/frequently-ordered'); }
  getSuggestions(q: string): Observable<any> { return this.api.apiGet('/guided-buying/suggestions', { q }); }
  quickOrder(data: any): Observable<any> { return this.api.apiPost('/guided-buying/quick-order', data); }
  getContractApprovedItems(params?: any): Observable<any> { return this.api.apiGet('/guided-buying/contract-approved', params); }
  getPunchOutConfigs(): Observable<any[]> { return this.api.apiGet('/guided-buying/punchout'); }
  createPunchOutConfig(data: any): Observable<any> { return this.api.apiPost('/guided-buying/punchout', data); }
  updatePunchOutConfig(id: string, data: any): Observable<any> { return this.api.apiPut(`/guided-buying/punchout/${id}`, data); }
  deletePunchOutConfig(id: string): Observable<any> { return this.api.apiDelete(`/guided-buying/punchout/${id}`); }
  syncPunchOut(id: string): Observable<any> { return this.api.apiPost(`/guided-buying/punchout/${id}/sync`, {}); }
  getDashboard(): Observable<any> { return this.api.apiGet('/guided-buying/dashboard'); }
}
