import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { ApiListParams, PagedResult } from '../models';
import {
  WaterInventoryItem, WaterMeterReading, WaterStocktake, WaterTreated,
  WaterAssetType, WaterRoute, WaterRouteName, WaterRouteNode,
  WaterAcquisition, WaterPurificationCost, WaterDistribution,
  WaterLoss, WaterLossFormula, WaterLossImplementationPlan,
  WaterValuation, WaterNrvFormula, WaterReconciliation,
  WaterQualityCompliance, WaterWorkingPaper, WaterAdjustingEntry,
  WaterConfiguration, WaterPolicyReview, WaterMonthlyReport,
  WaterDashboard, NrwAnalytics, TreatmentSummary
} from '../models/water-inventory.model';

@Injectable({ providedIn: 'root' })
export class WaterInventoryService {
  private api = inject(BaseApiService);
  private base = '/scm/water-inventory';

  getItems(params?: ApiListParams): Observable<PagedResult<WaterInventoryItem>> { return this.api.apiGetList<WaterInventoryItem>(this.base, params); }
  getItem(id: number): Observable<WaterInventoryItem> { return this.api.apiGet<WaterInventoryItem>(`${this.base}/${id}`); }
  createItem(data: any): Observable<any> { return this.api.apiPost(this.base, data); }
  updateItem(id: number, data: any): Observable<any> { return this.api.apiPut(`${this.base}/${id}`, data); }
  getSummary(params?: any): Observable<any> { return this.api.apiGet(`${this.base}/summary`, params); }

  getStocktakes(params?: ApiListParams): Observable<PagedResult<WaterStocktake>> { return this.api.apiGetList<WaterStocktake>(`${this.base}/stocktakes`, params); }
  getStocktake(id: number): Observable<WaterStocktake> { return this.api.apiGet<WaterStocktake>(`${this.base}/stocktakes/${id}`); }
  createStocktake(data: any): Observable<any> { return this.api.apiPost(`${this.base}/stocktakes`, data); }
  updateStocktake(id: number, data: any): Observable<any> { return this.api.apiPut(`${this.base}/stocktakes/${id}`, data); }
  cancelStocktake(id: number): Observable<any> { return this.api.apiPost(`${this.base}/stocktakes/${id}/cancel`, {}); }
  getStocktakeDetails(stocktakeId: number): Observable<any[]> { return this.api.apiGet<any[]>(`${this.base}/stocktakes/${stocktakeId}/details`); }
  addStocktakeDetail(stocktakeId: number, data: any): Observable<any> { return this.api.apiPost(`${this.base}/stocktakes/${stocktakeId}/details`, data); }
  submitStocktakeCount(stocktakeId: number, data: any): Observable<any> { return this.api.apiPost(`${this.base}/stocktakes/${stocktakeId}/count`, data); }
  verifyStocktake(stocktakeId: number, data: any): Observable<any> { return this.api.apiPost(`${this.base}/stocktakes/${stocktakeId}/verify`, data); }
  approveStocktake(stocktakeId: number, data: any): Observable<any> { return this.api.apiPost(`${this.base}/stocktakes/${stocktakeId}/approve`, data); }
  getStocktakeVarianceReport(stocktakeId: number): Observable<any> { return this.api.apiGet(`${this.base}/stocktakes/${stocktakeId}/variance-report`); }

  getTreated(params?: ApiListParams): Observable<PagedResult<WaterTreated>> { return this.api.apiGetList<WaterTreated>(`${this.base}/treated`, params); }
  createTreated(data: any): Observable<any> { return this.api.apiPost(`${this.base}/treated`, data); }
  updateTreated(id: number, data: any): Observable<any> { return this.api.apiPut(`${this.base}/treated/${id}`, data); }
  getTreatedTrends(params?: any): Observable<any> { return this.api.apiGet(`${this.base}/treated/trends`, params); }

  getAssetTypes(params?: ApiListParams): Observable<WaterAssetType[]> { return this.api.apiGet<WaterAssetType[]>(`${this.base}/asset-types`, params); }
  createAssetType(data: any): Observable<any> { return this.api.apiPost(`${this.base}/asset-types`, data); }
  updateAssetType(id: number, data: any): Observable<any> { return this.api.apiPut(`${this.base}/asset-types/${id}`, data); }
  deleteAssetType(id: number): Observable<any> { return this.api.apiDelete(`${this.base}/asset-types/${id}`); }

  getRoutes(params?: ApiListParams): Observable<WaterRoute[]> { return this.api.apiGet<WaterRoute[]>(`${this.base}/routes`, params); }
  createRoute(data: any): Observable<any> { return this.api.apiPost(`${this.base}/routes`, data); }
  getRouteNames(): Observable<WaterRouteName[]> { return this.api.apiGet<WaterRouteName[]>(`${this.base}/route-names`); }
  createRouteName(data: any): Observable<any> { return this.api.apiPost(`${this.base}/route-names`, data); }
  getRouteNodes(params?: any): Observable<WaterRouteNode[]> { return this.api.apiGet<WaterRouteNode[]>(`${this.base}/route-nodes`, params); }
  createRouteNode(data: any): Observable<any> { return this.api.apiPost(`${this.base}/route-nodes`, data); }
  updateRouteNode(id: number, data: any): Observable<any> { return this.api.apiPut(`${this.base}/route-nodes/${id}`, data); }
  getNodeNetwork(nodeId: number): Observable<any> { return this.api.apiGet(`${this.base}/route-nodes/${nodeId}/network`); }

  getMeterReadings(params?: ApiListParams): Observable<PagedResult<WaterMeterReading>> { return this.api.apiGetList<WaterMeterReading>(`${this.base}/meter-readings`, params); }
  createMeterReading(data: any): Observable<any> { return this.api.apiPost(`${this.base}/meter-readings`, data); }
  amendMeterReading(id: number, data: any): Observable<any> { return this.api.apiPut(`${this.base}/meter-readings/${id}/amend`, data); }
  approveMeterReading(id: number, data: any): Observable<any> { return this.api.apiPost(`${this.base}/meter-readings/${id}/approve`, data); }
  getMeterReadingHistory(id: number): Observable<any[]> { return this.api.apiGet<any[]>(`${this.base}/meter-readings/${id}/history`); }
  bulkMeterReadings(data: any): Observable<any> { return this.api.apiPost(`${this.base}/meter-readings/bulk`, data); }

  getAcquisitions(params?: ApiListParams): Observable<PagedResult<WaterAcquisition>> { return this.api.apiGetList<WaterAcquisition>(`${this.base}/acquisitions`, params); }
  createAcquisition(data: any): Observable<any> { return this.api.apiPost(`${this.base}/acquisitions`, data); }
  approveAcquisition(id: number, data: any): Observable<any> { return this.api.apiPost(`${this.base}/acquisitions/${id}/approve`, data); }

  getPurificationCosts(params?: ApiListParams): Observable<PagedResult<WaterPurificationCost>> { return this.api.apiGetList<WaterPurificationCost>(`${this.base}/purification-costs`, params); }
  createPurificationCost(data: any): Observable<any> { return this.api.apiPost(`${this.base}/purification-costs`, data); }

  getDistributions(params?: ApiListParams): Observable<PagedResult<WaterDistribution>> { return this.api.apiGetList<WaterDistribution>(`${this.base}/distributions`, params); }
  createDistribution(data: any): Observable<any> { return this.api.apiPost(`${this.base}/distributions`, data); }

  getWaterLosses(params?: ApiListParams): Observable<PagedResult<WaterLoss>> { return this.api.apiGetList<WaterLoss>(`${this.base}/water-losses`, params); }
  createWaterLoss(data: any): Observable<any> { return this.api.apiPost(`${this.base}/water-losses`, data); }
  getWaterLossFormulas(params?: any): Observable<WaterLossFormula[]> { return this.api.apiGet<WaterLossFormula[]>(`${this.base}/water-loss-formulas`, params); }
  createWaterLossFormula(data: any): Observable<any> { return this.api.apiPost(`${this.base}/water-loss-formulas`, data); }
  approveWaterLossFormula(id: number, data: any): Observable<any> { return this.api.apiPost(`${this.base}/water-loss-formulas/${id}/approve`, data); }
  getImplementationPlans(params?: any): Observable<WaterLossImplementationPlan[]> { return this.api.apiGet<WaterLossImplementationPlan[]>(`${this.base}/water-loss-implementation-plans`, params); }
  createImplementationPlan(data: any): Observable<any> { return this.api.apiPost(`${this.base}/water-loss-implementation-plans`, data); }
  updateImplementationPlan(id: number, data: any): Observable<any> { return this.api.apiPut(`${this.base}/water-loss-implementation-plans/${id}`, data); }

  getValuations(params?: ApiListParams): Observable<PagedResult<WaterValuation>> { return this.api.apiGetList<WaterValuation>(`${this.base}/valuations`, params); }
  runValuation(data: any): Observable<any> { return this.api.apiPost(`${this.base}/valuations/run`, data); }
  approveValuation(id: number, data: any): Observable<any> { return this.api.apiPost(`${this.base}/valuations/${id}/approve`, data); }
  getNrvFormulas(params?: any): Observable<WaterNrvFormula[]> { return this.api.apiGet<WaterNrvFormula[]>(`${this.base}/nrv-formulas`, params); }
  createNrvFormula(data: any): Observable<any> { return this.api.apiPost(`${this.base}/nrv-formulas`, data); }
  approveNrvFormula(id: number, data: any): Observable<any> { return this.api.apiPost(`${this.base}/nrv-formulas/${id}/approve`, data); }

  getReconciliations(params?: ApiListParams): Observable<PagedResult<WaterReconciliation>> { return this.api.apiGetList<WaterReconciliation>(`${this.base}/reconciliations`, params); }
  runReconciliation(data: any): Observable<any> { return this.api.apiPost(`${this.base}/reconciliations/run`, data); }
  approveReconciliation(id: number, data: any): Observable<any> { return this.api.apiPost(`${this.base}/reconciliations/${id}/approve`, data); }

  getQualityCompliance(params?: ApiListParams): Observable<PagedResult<WaterQualityCompliance>> { return this.api.apiGetList<WaterQualityCompliance>(`${this.base}/quality-compliance`, params); }
  createQualityCompliance(data: any): Observable<any> { return this.api.apiPost(`${this.base}/quality-compliance`, data); }

  getWorkingPapers(params?: ApiListParams): Observable<PagedResult<WaterWorkingPaper>> { return this.api.apiGetList<WaterWorkingPaper>(`${this.base}/working-papers`, params); }
  createWorkingPaper(data: any): Observable<any> { return this.api.apiPost(`${this.base}/working-papers`, data); }
  updateWorkingPaper(id: number, data: any): Observable<any> { return this.api.apiPut(`${this.base}/working-papers/${id}`, data); }

  getAdjustingEntries(params?: ApiListParams): Observable<PagedResult<WaterAdjustingEntry>> { return this.api.apiGetList<WaterAdjustingEntry>(`${this.base}/adjusting-entries`, params); }
  createAdjustingEntry(data: any): Observable<any> { return this.api.apiPost(`${this.base}/adjusting-entries`, data); }
  approveAdjustingEntry(id: number, data: any): Observable<any> { return this.api.apiPost(`${this.base}/adjusting-entries/${id}/approve`, data); }

  getConfiguration(params?: any): Observable<WaterConfiguration[]> { return this.api.apiGet<WaterConfiguration[]>(`${this.base}/configuration`, params); }
  createConfiguration(data: any): Observable<any> { return this.api.apiPost(`${this.base}/configuration`, data); }
  approveConfiguration(id: number, data: any): Observable<any> { return this.api.apiPost(`${this.base}/configuration/${id}/approve`, data); }

  getPolicyReviews(params?: ApiListParams): Observable<PagedResult<WaterPolicyReview>> { return this.api.apiGetList<WaterPolicyReview>(`${this.base}/policy-reviews`, params); }
  createPolicyReview(data: any): Observable<any> { return this.api.apiPost(`${this.base}/policy-reviews`, data); }
  approvePolicyReview(id: number, data: any): Observable<any> { return this.api.apiPost(`${this.base}/policy-reviews/${id}/approve`, data); }

  getMonthlyReports(params?: ApiListParams): Observable<PagedResult<WaterMonthlyReport>> { return this.api.apiGetList<WaterMonthlyReport>(`${this.base}/monthly-reports`, params); }
  generateMonthlyReport(data: any): Observable<any> { return this.api.apiPost(`${this.base}/monthly-reports/generate`, data); }
  approveMonthlyReport(id: number, data: any): Observable<any> { return this.api.apiPost(`${this.base}/monthly-reports/${id}/approve`, data); }
  submitMonthlyReport(id: number, data: any): Observable<any> { return this.api.apiPost(`${this.base}/monthly-reports/${id}/submit`, data); }

  approveInvoice(invoiceId: number, data: any): Observable<any> { return this.api.apiPost(`${this.base}/invoices/${invoiceId}/approve`, data); }
  getWac(params?: any): Observable<any> { return this.api.apiGet(`${this.base}/weighted-average-cost`, params); }

  getDashboard(params?: any): Observable<WaterDashboard> { return this.api.apiGet<WaterDashboard>(`${this.base}/dashboard`, params); }
  getNrwAnalytics(params?: any): Observable<NrwAnalytics> { return this.api.apiGet<NrwAnalytics>(`${this.base}/dashboard/nrw-analytics`, params); }
  getTreatmentSummary(params?: any): Observable<TreatmentSummary> { return this.api.apiGet<TreatmentSummary>(`${this.base}/dashboard/treatment-summary`, params); }
  getStocktakeStatus(params?: any): Observable<any> { return this.api.apiGet(`${this.base}/dashboard/stocktake-status`, params); }
}
