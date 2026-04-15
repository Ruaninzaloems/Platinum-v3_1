import { Injectable, inject } from '@angular/core';
import { BaseApiService } from './base-api.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SourcingOptimizationService {
  private api = inject(BaseApiService);

  getScenarios(params?: any): Observable<any> {
    return this.api.apiGet('/sourcing-optimization/scenarios', params);
  }

  getScenario(id: string): Observable<any> {
    return this.api.apiGet(`/sourcing-optimization/scenarios/${id}`);
  }

  createScenario(data: any): Observable<any> {
    return this.api.apiPost('/sourcing-optimization/scenarios', data);
  }

  updateScenario(id: string, data: any): Observable<any> {
    return this.api.apiPut(`/sourcing-optimization/scenarios/${id}`, data);
  }

  deleteScenario(id: string): Observable<any> {
    return this.api.apiDelete(`/sourcing-optimization/scenarios/${id}`);
  }

  addItems(id: string, items: any[]): Observable<any> {
    return this.api.apiPost(`/sourcing-optimization/scenarios/${id}/add-items`, { items });
  }

  addSuppliers(id: string, suppliers: any[]): Observable<any> {
    return this.api.apiPost(`/sourcing-optimization/scenarios/${id}/add-suppliers`, { suppliers });
  }

  setConstraints(id: string, constraints: any[]): Observable<any> {
    return this.api.apiPost(`/sourcing-optimization/scenarios/${id}/set-constraints`, { constraints });
  }

  solve(id: string): Observable<any> {
    return this.api.apiPost(`/sourcing-optimization/scenarios/${id}/solve`, {});
  }

  getSensitivity(id: string): Observable<any> {
    return this.api.apiGet(`/sourcing-optimization/scenarios/${id}/sensitivity`);
  }

  runWhatIf(id: string, changes: any): Observable<any> {
    return this.api.apiPost(`/sourcing-optimization/scenarios/${id}/what-if`, { changes });
  }

  cloneScenario(id: string): Observable<any> {
    return this.api.apiPost(`/sourcing-optimization/scenarios/${id}/clone`, {});
  }

  exportAwards(id: string, format: string = 'json'): Observable<any> {
    return this.api.apiPost(`/sourcing-optimization/scenarios/${id}/export-awards`, { format });
  }

  generatePurchaseOrders(id: string): Observable<any> {
    return this.api.apiPost(`/sourcing-optimization/scenarios/${id}/generate-pos`, {});
  }

  getTemplates(): Observable<any> {
    return this.api.apiGet('/sourcing-optimization/templates');
  }

  getConstraintTypes(): Observable<any> {
    return this.api.apiGet('/sourcing-optimization/constraint-types');
  }

  getDashboard(): Observable<any> {
    return this.api.apiGet('/sourcing-optimization/dashboard');
  }
}
