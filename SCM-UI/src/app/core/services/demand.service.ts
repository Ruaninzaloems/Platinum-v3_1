import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { DemandPlan, NeedsAssessment, AnnualProcurementPlan, DemandAggregation, Specification, MarketAnalysis, CommodityGroup, DemandDashboard, DemandPlanItem } from '../models';
import { ApiListParams, PagedResult } from '../models';

@Injectable({ providedIn: 'root' })
export class DemandService {
  private api = inject(BaseApiService);

  getDashboard(): Observable<DemandDashboard> {
    return this.api.apiGet<DemandDashboard>('/demand/dashboard');
  }

  getPlans(params?: ApiListParams): Observable<PagedResult<DemandPlan>> {
    return this.api.apiGetList<DemandPlan>('/demand/plans', params);
  }

  getPlanById(id: string): Observable<DemandPlan> {
    return this.api.apiGet<DemandPlan>(`/demand/plans/${id}`);
  }

  createPlan(data: Partial<DemandPlan>): Observable<DemandPlan> {
    return this.api.apiPost<DemandPlan>('/demand/plans', data);
  }

  updatePlan(id: string, data: Partial<DemandPlan>): Observable<DemandPlan> {
    return this.api.apiPut<DemandPlan>(`/demand/plans/${id}`, data);
  }

  addItem(planId: string, data: Partial<DemandPlanItem>): Observable<DemandPlanItem> {
    return this.api.apiPost<DemandPlanItem>(`/demand/plans/${planId}/items`, data);
  }

  updateItem(planId: string, itemId: string, data: Partial<DemandPlanItem>): Observable<DemandPlanItem> {
    return this.api.apiPut<DemandPlanItem>(`/demand/plans/${planId}/items/${itemId}`, data);
  }

  deleteItem(planId: string, itemId: string): Observable<any> {
    return this.api.apiDelete(`/demand/plans/${planId}/items/${itemId}`);
  }

  submitPlan(id: string, comments?: string): Observable<any> {
    return this.api.apiPost<any>(`/demand/plans/${id}/submit`, { comments });
  }

  reviewPlan(id: string, comments?: string): Observable<any> {
    return this.api.apiPost<any>(`/demand/plans/${id}/review`, { comments });
  }

  approvePlan(id: string, comments?: string): Observable<any> {
    return this.api.apiPost<any>(`/demand/plans/${id}/approve`, { comments });
  }

  rejectPlan(id: string, reason?: string): Observable<any> {
    return this.api.apiPost<any>(`/demand/plans/${id}/reject`, { reason });
  }

  returnPlan(id: string, reason?: string): Observable<any> {
    return this.api.apiPost<any>(`/demand/plans/${id}/return`, { reason });
  }

  getComplianceCheck(id: string): Observable<any> {
    return this.api.apiGet<any>(`/demand/plans/${id}/compliance-check`);
  }

  getBudgetAnalysis(id: string): Observable<any> {
    return this.api.apiGet<any>(`/demand/plans/${id}/budget-analysis`);
  }

  generateRequisitions(id: string): Observable<any> {
    return this.api.apiPost<any>(`/demand/plans/${id}/generate-requisitions`, {});
  }

  getAuditTrail(id: string): Observable<any> {
    return this.api.apiGet<any>(`/demand/plans/${id}/audit-trail`);
  }

  getNeedsAssessments(params?: ApiListParams): Observable<PagedResult<NeedsAssessment>> {
    return this.api.apiGetList<NeedsAssessment>('/demand/needs-assessments', params);
  }

  getNeedsAssessmentById(id: string): Observable<NeedsAssessment> {
    return this.api.apiGet<NeedsAssessment>(`/demand/needs-assessments/${id}`);
  }

  createNeedsAssessment(data: Partial<NeedsAssessment>): Observable<NeedsAssessment> {
    return this.api.apiPost<NeedsAssessment>('/demand/needs-assessments', data);
  }

  updateNeedsAssessment(id: string, data: Partial<NeedsAssessment>): Observable<NeedsAssessment> {
    return this.api.apiPut<NeedsAssessment>(`/demand/needs-assessments/${id}`, data);
  }

  approveNeedsAssessment(id: string): Observable<any> {
    return this.api.apiPost<any>(`/demand/needs-assessments/${id}/approve`, {});
  }

  getProcurementPlans(params?: any): Observable<any> {
    return this.api.apiGet<any>('/demand/procurement-plans');
  }

  getProcurementPlanById(id: string): Observable<AnnualProcurementPlan> {
    return this.api.apiGet<AnnualProcurementPlan>(`/demand/procurement-plans/${id}`);
  }

  createProcurementPlan(data: Partial<AnnualProcurementPlan>): Observable<AnnualProcurementPlan> {
    return this.api.apiPost<AnnualProcurementPlan>('/demand/procurement-plans', data);
  }

  getAggregations(params?: any): Observable<any> {
    return this.api.apiGet<any>('/demand/aggregations');
  }

  getAggregationById(id: string): Observable<DemandAggregation> {
    return this.api.apiGet<DemandAggregation>(`/demand/aggregations/${id}`);
  }

  createAggregation(data: Partial<DemandAggregation>): Observable<DemandAggregation> {
    return this.api.apiPost<DemandAggregation>('/demand/aggregations', data);
  }

  getSpecifications(params?: any): Observable<any> {
    return this.api.apiGet<any>('/demand/specifications');
  }

  getSpecificationById(id: string): Observable<Specification> {
    return this.api.apiGet<Specification>(`/demand/specifications/${id}`);
  }

  createSpecification(data: Partial<Specification>): Observable<Specification> {
    return this.api.apiPost<Specification>('/demand/specifications', data);
  }

  updateSpecification(id: string, data: Partial<Specification>): Observable<Specification> {
    return this.api.apiPut<Specification>(`/demand/specifications/${id}`, data);
  }

  approveSpecification(id: string): Observable<any> {
    return this.api.apiPost<any>(`/demand/specifications/${id}/approve`, {});
  }

  getMarketAnalyses(params?: any): Observable<any> {
    return this.api.apiGet<any>('/demand/market-analyses');
  }

  getMarketAnalysisById(id: string): Observable<MarketAnalysis> {
    return this.api.apiGet<MarketAnalysis>(`/demand/market-analyses/${id}`);
  }

  createMarketAnalysis(data: Partial<MarketAnalysis>): Observable<MarketAnalysis> {
    return this.api.apiPost<MarketAnalysis>('/demand/market-analyses', data);
  }

  getCommodityGroups(): Observable<any> {
    return this.api.apiGet<any>('/demand/commodity-groups');
  }

  getCommodityGroupById(id: string): Observable<CommodityGroup> {
    return this.api.apiGet<CommodityGroup>(`/demand/commodity-groups/${id}`);
  }

  submitNeedsAssessment(id: string): Observable<any> {
    return this.api.apiPost<any>(`/demand/needs-assessments/${id}/submit`, {});
  }

  rejectNeedsAssessment(id: string, reason?: string): Observable<any> {
    return this.api.apiPost<any>(`/demand/needs-assessments/${id}/reject`, { reason });
  }

  deleteNeedsAssessment(id: string): Observable<any> {
    return this.api.apiDelete(`/demand/needs-assessments/${id}`);
  }

  submitSpecification(id: string): Observable<any> {
    return this.api.apiPost<any>(`/demand/specifications/${id}/submit`, {});
  }

  rejectSpecification(id: string, reason?: string): Observable<any> {
    return this.api.apiPost<any>(`/demand/specifications/${id}/reject`, { reason });
  }

  deleteSpecification(id: string): Observable<any> {
    return this.api.apiDelete(`/demand/specifications/${id}`);
  }

  updateMarketAnalysis(id: string, data: Partial<MarketAnalysis>): Observable<MarketAnalysis> {
    return this.api.apiPut<MarketAnalysis>(`/demand/market-analyses/${id}`, data);
  }

  completeMarketAnalysis(id: string): Observable<any> {
    return this.api.apiPost<any>(`/demand/market-analyses/${id}/complete`, {});
  }

  updateAggregation(id: string, data: Partial<DemandAggregation>): Observable<DemandAggregation> {
    return this.api.apiPut<DemandAggregation>(`/demand/aggregations/${id}`, data);
  }

  approveAggregation(id: string): Observable<any> {
    return this.api.apiPost<any>(`/demand/aggregations/${id}/approve`, {});
  }

  rejectAggregation(id: string, reason?: string): Observable<any> {
    return this.api.apiPost<any>(`/demand/aggregations/${id}/reject`, { reason });
  }

  updateProcurementPlan(id: string, data: Partial<AnnualProcurementPlan>): Observable<AnnualProcurementPlan> {
    return this.api.apiPut<AnnualProcurementPlan>(`/demand/procurement-plans/${id}`, data);
  }

  approveProcurementPlan(id: string): Observable<any> {
    return this.api.apiPost<any>(`/demand/procurement-plans/${id}/approve`, {});
  }

  publishProcurementPlan(id: string): Observable<any> {
    return this.api.apiPost<any>(`/demand/procurement-plans/${id}/publish`, {});
  }

  addProcurementPlanItem(planId: string, data: any): Observable<any> {
    return this.api.apiPost<any>(`/demand/procurement-plans/${planId}/items`, data);
  }

  getDepartmentSummary(): Observable<any> {
    return this.api.apiGet<any>('/demand/summary/departments');
  }

  getMethodSummary(): Observable<any> {
    return this.api.apiGet<any>('/demand/summary/methods');
  }

  getRiskSummary(): Observable<any> {
    return this.api.apiGet<any>('/demand/summary/risk');
  }

  getComplianceSummary(): Observable<any> {
    return this.api.apiGet<any>('/demand/summary/compliance');
  }
}
