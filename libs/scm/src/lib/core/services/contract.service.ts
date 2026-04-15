import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { Contract, ContractVariation, ContractMilestone, ApiListParams, PagedResult } from '../models';

@Injectable({ providedIn: 'root' })
export class ContractService {
  private api = inject(BaseApiService);

  getAll(params?: ApiListParams): Observable<PagedResult<Contract>> {
    return this.api.apiGetList<Contract>('/contracts', params);
  }

  getById(id: string): Observable<Contract> {
    return this.api.apiGet<Contract>(`/contracts/${id}`);
  }

  create(data: Partial<Contract>): Observable<Contract> {
    return this.api.apiPost<Contract>('/contracts', data);
  }

  update(id: string, data: Partial<Contract>): Observable<Contract> {
    return this.api.apiPut<Contract>(`/contracts/${id}`, data);
  }

  activate(id: string): Observable<Contract> {
    return this.api.apiPost<Contract>(`/contracts/${id}/activate`, {});
  }

  terminate(id: string, reason: string): Observable<Contract> {
    return this.api.apiPost<Contract>(`/contracts/${id}/terminate`, { reason });
  }

  addVariation(id: string, variation: Partial<ContractVariation>): Observable<Contract> {
    return this.api.apiPost<Contract>(`/contracts/${id}/variations`, variation);
  }

  updateMilestone(id: string, milestoneId: string, data: Partial<ContractMilestone>): Observable<Contract> {
    return this.api.apiPut<Contract>(`/contracts/${id}/milestones/${milestoneId}`, data);
  }

  getExpiring(daysAhead: number = 90, params?: ApiListParams): Observable<PagedResult<Contract>> {
    return this.api.apiGetList<Contract>('/contracts/expiring', { ...params, daysAhead });
  }

  getClauseLibrary(params?: any): Observable<any> { return this.api.apiGet('/contracts/clm/clause-library', params); }
  getClause(id: string): Observable<any> { return this.api.apiGet(`/contracts/clm/clause-library/${id}`); }
  createClause(data: any): Observable<any> { return this.api.apiPost('/contracts/clm/clause-library', data); }
  updateClause(id: string, data: any): Observable<any> { return this.api.apiPut(`/contracts/clm/clause-library/${id}`, data); }
  deleteClause(id: string): Observable<any> { return this.api.apiDelete(`/contracts/clm/clause-library/${id}`); }
  getObligations(params?: any): Observable<any> { return this.api.apiGet('/contracts/clm/obligations', params); }
  createObligation(data: any): Observable<any> { return this.api.apiPost('/contracts/clm/obligations', data); }
  updateObligation(oblId: string, data: any): Observable<any> { return this.api.apiPut(`/contracts/clm/obligations/${oblId}`, data); }
  getObligationCalendar(params?: any): Observable<any> { return this.api.apiGet('/contracts/clm/obligation-calendar', params); }
  getRiskScoring(contractId: string): Observable<any> { return this.api.apiPost(`/contracts/clm/risk-scoring/${contractId}`, {}); }
  extractClauses(data: any): Observable<any> { return this.api.apiPost('/contracts/clm/nlp-extract', data); }
  compareContracts(data: any): Observable<any> { return this.api.apiPost('/contracts/clm/compare', data); }
  getComplianceAlerts(params?: any): Observable<any> { return this.api.apiGet('/contracts/clm/compliance-alerts', params); }
  getSubcontractors(contractId: string): Observable<any[]> { return this.api.apiGet(`/contracts/${contractId}/subcontractors`); }
  addSubcontractor(contractId: string, data: any): Observable<any> { return this.api.apiPost(`/contracts/${contractId}/subcontractors`, data); }
  updateSubcontractor(contractId: string, subId: string, data: any): Observable<any> { return this.api.apiPut(`/contracts/${contractId}/subcontractors/${subId}`, data); }
  removeSubcontractor(contractId: string, subId: string): Observable<any> { return this.api.apiDelete(`/contracts/${contractId}/subcontractors/${subId}`); }
  getSubcontractorCompliance(contractId: string, subId: string): Observable<any> { return this.api.apiGet(`/contracts/${contractId}/subcontractors/${subId}/compliance`); }
  updateSubcontractorCompliance(contractId: string, subId: string, data: any): Observable<any> { return this.api.apiPut(`/contracts/${contractId}/subcontractors/${subId}/compliance`, data); }
  addSubcontractorPayment(contractId: string, subId: string, data: any): Observable<any> { return this.api.apiPost(`/contracts/${contractId}/subcontractors/${subId}/payment`, data); }
  addSubcontractorPerformance(contractId: string, subId: string, data: any): Observable<any> { return this.api.apiPost(`/contracts/${contractId}/subcontractors/${subId}/performance`, data); }
  getSubcontractorTarget(contractId: string): Observable<any> { return this.api.apiGet(`/contracts/${contractId}/subcontractor-target`); }
}
