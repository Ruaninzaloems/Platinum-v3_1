import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class AgAuditService {
  private api = inject(BaseApiService);

  getFindings(params?: any): Observable<any> { return this.api.apiGet('/ag-audit/findings', params); }
  getFinding(id: string): Observable<any> { return this.api.apiGet(`/ag-audit/findings/${id}`); }
  createFinding(data: any): Observable<any> { return this.api.apiPost('/ag-audit/findings', data); }
  updateFinding(id: string, data: any): Observable<any> { return this.api.apiPut(`/ag-audit/findings/${id}`, data); }
  deleteFinding(id: string): Observable<any> { return this.api.apiDelete(`/ag-audit/findings/${id}`); }
  getActionPlans(findingId: string): Observable<any[]> { return this.api.apiGet(`/ag-audit/findings/${findingId}/action-plans`); }
  createActionPlan(findingId: string, data: any): Observable<any> { return this.api.apiPost(`/ag-audit/findings/${findingId}/action-plans`, data); }
  updateActionPlan(findingId: string, planId: string, data: any): Observable<any> { return this.api.apiPut(`/ag-audit/findings/${findingId}/action-plans/${planId}`, data); }
  getRemediationStatus(findingId: string): Observable<any> { return this.api.apiGet(`/ag-audit/findings/${findingId}/remediation`); }
  submitManagementResponse(findingId: string, data: any): Observable<any> { return this.api.apiPost(`/ag-audit/findings/${findingId}/management-response`, data); }
  getFollowUps(findingId: string): Observable<any[]> { return this.api.apiGet(`/ag-audit/findings/${findingId}/follow-ups`); }
  addFollowUp(findingId: string, data: any): Observable<any> { return this.api.apiPost(`/ag-audit/findings/${findingId}/follow-ups`, data); }
  getQuarterlyReport(params?: any): Observable<any> { return this.api.apiGet('/ag-audit/quarterly-report', params); }
  getRiskRegister(params?: any): Observable<any> { return this.api.apiGet('/ag-audit/risk-register', params); }
  createRiskEntry(data: any): Observable<any> { return this.api.apiPost('/ag-audit/risk-register', data); }
  updateRiskEntry(id: string, data: any): Observable<any> { return this.api.apiPut(`/ag-audit/risk-register/${id}`, data); }
  getAuditYears(): Observable<string[]> { return this.api.apiGet('/ag-audit/years'); }
  getAuditTypes(): Observable<string[]> { return this.api.apiGet('/ag-audit/types'); }
  getDashboard(): Observable<any> { return this.api.apiGet('/ag-audit/dashboard'); }
}
