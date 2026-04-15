import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import {
  StockItem, StockMovement, Warehouse, StockCount,
  InventoryDonation, InventoryDisposal, InventoryCorrection,
  InventoryValuation, InventoryTransferItem, ClosurePeriod,
  StoreCommodityLink, ProcurementPipelineItem, InventoryDashboard,
  InventoryRequisitionItem, HighValueAsset,
  ApiListParams, PagedResult
} from '../models';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private api = inject(BaseApiService);

  getDashboard(): Observable<InventoryDashboard> {
    return this.api.apiGet<InventoryDashboard>('/inventory/dashboard');
  }

  getStockItems(params?: ApiListParams): Observable<PagedResult<StockItem>> {
    return this.api.apiGetList<StockItem>('/inventory/items', params);
  }

  getStockItemById(id: string): Observable<StockItem> {
    return this.api.apiGet<StockItem>(`/inventory/items/${id}`);
  }

  createStockItem(data: Partial<StockItem>): Observable<StockItem> {
    return this.api.apiPost<StockItem>('/inventory/items', data);
  }

  updateStockItem(id: string, data: Partial<StockItem>): Observable<StockItem> {
    return this.api.apiPut<StockItem>(`/inventory/items/${id}`, data);
  }

  getLowStockItems(): Observable<any[]> {
    return this.api.apiGet<any[]>('/inventory/items/low-stock');
  }

  getMovements(params?: ApiListParams): Observable<PagedResult<StockMovement>> {
    return this.api.apiGetList<StockMovement>('/inventory/movements', params);
  }

  createMovement(data: Partial<StockMovement>): Observable<StockMovement> {
    return this.api.apiPost<StockMovement>('/inventory/movements', data);
  }

  getWarehouses(params?: ApiListParams): Observable<Warehouse[]> {
    return this.api.apiGet<Warehouse[]>('/inventory/warehouses', params);
  }

  getStores(): Observable<any[]> {
    return this.api.apiGet<any[]>('/inventory/stores');
  }

  getStockCounts(params?: ApiListParams): Observable<PagedResult<StockCount>> {
    return this.api.apiGetList<StockCount>('/inventory/stocktakes', params);
  }

  createStockCount(data: Partial<StockCount>): Observable<StockCount> {
    return this.api.apiPost<StockCount>('/inventory/stocktakes', data);
  }

  updateStockCount(id: string, data: Partial<StockCount>): Observable<StockCount> {
    return this.api.apiPut<StockCount>(`/inventory/stocktakes/${id}`, data);
  }

  verifyStocktake(id: number, data: any): Observable<any> {
    return this.api.apiPut<any>(`/inventory/stocktakes/${id}/verify`, data);
  }

  approveStocktake(id: number, data: any): Observable<any> {
    return this.api.apiPut<any>(`/inventory/stocktakes/${id}/approve`, data);
  }

  deleteStocktake(id: number): Observable<any> {
    return this.api.apiDelete<any>(`/inventory/stocktakes/${id}`);
  }

  getCommodities(params?: ApiListParams): Observable<PagedResult<any>> {
    return this.api.apiGetList<any>('/inventory/commodities', params);
  }

  getCommodityApprovals(params?: ApiListParams): Observable<PagedResult<any>> {
    return this.api.apiGetList<any>('/inventory/commodity-approvals', params);
  }

  createCommodity(data: any): Observable<any> {
    return this.api.apiPost<any>('/inventory/commodity-approvals', data);
  }

  updateCommodity(id: number, data: any): Observable<any> {
    return this.api.apiPut<any>(`/inventory/commodity-approvals/${id}`, data);
  }

  approveCommodity(id: number, data?: any): Observable<any> {
    return this.api.apiPut<any>(`/inventory/commodity-approvals/${id}/approve`, data || {});
  }

  rejectCommodity(id: number, data: any): Observable<any> {
    return this.api.apiPut<any>(`/inventory/commodity-approvals/${id}/reject`, data);
  }

  cancelCommodity(id: number): Observable<any> {
    return this.api.apiPut<any>(`/inventory/commodities/${id}/cancel`, {});
  }

  bulkUploadCommodities(data: any[]): Observable<any> {
    return this.api.apiPost<any>('/inventory/commodities/take-on', data);
  }

  getDonations(params?: ApiListParams): Observable<PagedResult<InventoryDonation>> {
    return this.api.apiGetList<InventoryDonation>('/inventory/donations', params);
  }

  createDonation(data: Partial<InventoryDonation>): Observable<InventoryDonation> {
    return this.api.apiPost<InventoryDonation>('/inventory/donations', data);
  }

  getDisposals(params?: ApiListParams): Observable<PagedResult<InventoryDisposal>> {
    return this.api.apiGetList<InventoryDisposal>('/inventory/disposals', params);
  }

  createDisposal(data: Partial<InventoryDisposal>): Observable<InventoryDisposal> {
    return this.api.apiPost<InventoryDisposal>('/inventory/disposals', data);
  }

  approveDisposal(id: number, data?: any): Observable<any> {
    return this.api.apiPut<any>(`/inventory/disposals/${id}/approve`, data || {});
  }

  rejectDisposal(id: number, data: any): Observable<any> {
    return this.api.apiPut<any>(`/inventory/disposals/${id}/decline`, data);
  }

  approveDisposalWithJournal(id: number, data: any): Observable<any> {
    return this.api.apiPut<any>(`/inventory/disposals/${id}/journal`, data);
  }

  getSupplierReturns(params?: ApiListParams): Observable<PagedResult<any>> {
    return this.api.apiGetList<any>('/inventory/supplier-returns', params);
  }

  createSupplierReturn(data: any): Observable<any> {
    return this.api.apiPost<any>('/inventory/supplier-returns', data);
  }

  getAdjustments(params?: ApiListParams): Observable<PagedResult<InventoryCorrection>> {
    return this.api.apiGetList<InventoryCorrection>('/inventory/adjustments', params);
  }

  createAdjustment(data: Partial<InventoryCorrection>): Observable<InventoryCorrection> {
    return this.api.apiPost<InventoryCorrection>('/inventory/adjustments', data);
  }

  getValuations(params?: ApiListParams): Observable<PagedResult<InventoryValuation>> {
    return this.api.apiGetList<InventoryValuation>('/inventory/valuations', params);
  }

  createValuation(data: Partial<InventoryValuation>): Observable<InventoryValuation> {
    return this.api.apiPost<InventoryValuation>('/inventory/valuations', data);
  }

  updateValuation(id: number, data: Partial<InventoryValuation>): Observable<InventoryValuation> {
    return this.api.apiPut<InventoryValuation>(`/inventory/valuations/${id}`, data);
  }

  rejectValuation(id: number, data: any): Observable<any> {
    return this.api.apiPut<any>(`/inventory/valuations/${id}/reject`, data);
  }

  getIssues(params?: ApiListParams): Observable<PagedResult<any>> {
    return this.api.apiGetList<any>('/inventory/issues', params);
  }

  createIssue(data: any): Observable<any> {
    return this.api.apiPost<any>('/inventory/issues', data);
  }

  approveRecord(type: string, id: number, data?: any): Observable<any> {
    return this.api.apiPut<any>(`/inventory/${type}/${id}/approve`, data || {});
  }

  getTransfers(params?: ApiListParams): Observable<PagedResult<InventoryTransferItem>> {
    return this.api.apiGetList<InventoryTransferItem>('/inventory/transfers', params);
  }

  createTransfer(data: any): Observable<any> {
    return this.api.apiPost<any>('/inventory/transfers', data);
  }

  dispatchTransfer(id: number, data?: any): Observable<any> {
    return this.api.apiPut<any>(`/inventory/transfers/${id}/dispatch`, data || {});
  }

  receiveTransfer(id: number, data?: any): Observable<any> {
    return this.api.apiPut<any>(`/inventory/transfers/${id}/receive`, data || {});
  }

  rejectTransfer(id: number, data: any): Observable<any> {
    return this.api.apiPut<any>(`/inventory/transfers/${id}/reject`, data);
  }

  getStoreCommodityLinks(params?: ApiListParams): Observable<PagedResult<StoreCommodityLink>> {
    return this.api.apiGetList<StoreCommodityLink>('/inventory/store-commodity-links', params);
  }

  createStoreCommodityLink(data: Partial<StoreCommodityLink>): Observable<StoreCommodityLink> {
    return this.api.apiPost<StoreCommodityLink>('/inventory/store-commodity-links', data);
  }

  updateStoreCommodityLink(id: number, data: Partial<StoreCommodityLink>): Observable<StoreCommodityLink> {
    return this.api.apiPut<StoreCommodityLink>(`/inventory/store-commodity-links/${id}`, data);
  }

  getReturnToStore(params?: ApiListParams): Observable<PagedResult<any>> {
    return this.api.apiGetList<any>('/inventory/return-to-store', params);
  }

  createReturnToStore(data: any): Observable<any> {
    return this.api.apiPost<any>('/inventory/return-to-store', data);
  }

  approveReturnToStore(id: number, data?: any): Observable<any> {
    return this.api.apiPut<any>(`/inventory/return-to-store/${id}/approve`, data || {});
  }

  submitReturnForApproval(id: number, data?: any): Observable<any> {
    return this.api.apiPut<any>(`/inventory/return-to-store/${id}/submit`, data || {});
  }

  getClosurePeriods(params?: ApiListParams): Observable<PagedResult<ClosurePeriod>> {
    return this.api.apiGetList<ClosurePeriod>('/inventory/closure/periods', params);
  }

  createClosurePeriod(data: Partial<ClosurePeriod>): Observable<ClosurePeriod> {
    return this.api.apiPost<ClosurePeriod>('/inventory/closure/periods', data);
  }

  updateClosurePeriod(id: number, data: Partial<ClosurePeriod>): Observable<ClosurePeriod> {
    return this.api.apiPut<ClosurePeriod>(`/inventory/closure/periods/${id}`, data);
  }

  getClosureConfig(): Observable<any> {
    return this.api.apiGet<any>('/inventory/closure/config');
  }

  saveClosureConfig(data: any): Observable<any> {
    return this.api.apiPut<any>('/inventory/closure/config', data);
  }

  getClosureExceptions(params?: ApiListParams): Observable<any[]> {
    return this.api.apiGet<any[]>('/inventory/closure/exceptions', params);
  }

  getProcurementPipeline(params?: ApiListParams): Observable<PagedResult<ProcurementPipelineItem>> {
    return this.api.apiGetList<ProcurementPipelineItem>('/inventory/procurement-pipeline', params);
  }

  advancePipelineItem(id: number, data?: any): Observable<any> {
    return this.api.apiPost<any>(`/inventory/procurement-pipeline/${id}/advance`, data || {});
  }

  inspectPipelineItem(id: number, data?: any): Observable<any> {
    return this.api.apiPost<any>(`/inventory/procurement-pipeline/${id}/inspect`, data || {});
  }

  getReplenishmentRules(params?: ApiListParams): Observable<any[]> {
    return this.api.apiGet<any[]>('/inventory/replenishment-rules', params);
  }

  triggerReplenishment(data?: any): Observable<any> {
    return this.api.apiPost<any>('/inventory/trigger-replenishment', data || {});
  }

  getAiInsights(): Observable<any> {
    return this.api.apiGet<any>('/inventory/ai-insights');
  }

  getBinLocations(storeId: number): Observable<any[]> {
    return this.api.apiGet<any[]>(`/inventory/bin-locations/${storeId}`);
  }

  getReportStocklist(params?: ApiListParams): Observable<any> {
    return this.api.apiGet<any>('/inventory/reports/stocklist', params);
  }

  getReportStockMovement(params?: ApiListParams): Observable<any> {
    return this.api.apiGet<any>('/inventory/reports/stock-movement', params);
  }

  countStocktake(id: number, data: any): Observable<any> {
    return this.api.apiPost<any>(`/inventory/stocktakes/${id}/count`, data);
  }

  checkStocktake(id: number, data: any): Observable<any> {
    return this.api.apiPost<any>(`/inventory/stocktakes/${id}/check`, data);
  }

  verifyStocktakeWorkflow(id: number, data: any): Observable<any> {
    return this.api.apiPost<any>(`/inventory/stocktakes/${id}/verify`, data);
  }

  approveStocktakeWorkflow(id: number): Observable<any> {
    return this.api.apiPost<any>(`/inventory/stocktakes/${id}/approve-workflow`, {});
  }

  dispatchTransferWorkflow(id: number): Observable<any> {
    return this.api.apiPost<any>(`/inventory/transfers/${id}/dispatch-workflow`, {});
  }

  receiveTransferWorkflow(id: number): Observable<any> {
    return this.api.apiPost<any>(`/inventory/transfers/${id}/receive-workflow`, {});
  }

  rejectTransferWorkflow(id: number, data: any): Observable<any> {
    return this.api.apiPost<any>(`/inventory/transfers/${id}/reject-workflow`, data);
  }

  approveDisposalWorkflow(id: number): Observable<any> {
    return this.api.apiPost<any>(`/inventory/disposals/${id}/approve-workflow`, {});
  }

  postDisposalJournal(id: number, data: any): Observable<any> {
    return this.api.apiPost<any>(`/inventory/disposals/${id}/journal`, data);
  }

  createValidatedIssue(data: any): Observable<any> {
    return this.api.apiPost<any>('/inventory/issues/validated', data);
  }

  createValidatedCorrection(data: any): Observable<any> {
    return this.api.apiPost<any>('/inventory/corrections/validated', data);
  }

  approveValuationWorkflow(id: number): Observable<any> {
    return this.api.apiPost<any>(`/inventory/valuations/${id}/approve-workflow`, {});
  }

  rejectValuationWorkflow(id: number, data: any): Observable<any> {
    return this.api.apiPost<any>(`/inventory/valuations/${id}/reject-workflow`, data);
  }

  getReplenishmentSuggestions(): Observable<any> {
    return this.api.apiGet<any>('/inventory/replenishment/suggestions');
  }

  getMonthEndStatus(): Observable<any> {
    return this.api.apiGet<any>('/inventory/month-end/status');
  }

  getMonthEndExceptions(): Observable<any> {
    return this.api.apiGet<any>('/inventory/month-end/exceptions');
  }

  checkMonthEndClosed(month: number, finYear: string): Observable<any> {
    return this.api.apiGet<any>('/inventory/month-end/check-closed', { month, finYear });
  }

  closeMonthEnd(data: any): Observable<any> {
    return this.api.apiPost<any>('/inventory/month-end/close', data);
  }

  reopenMonthEnd(data: any): Observable<any> {
    return this.api.apiPost<any>('/inventory/month-end/reopen', data);
  }

  getStorePermissions(params?: ApiListParams): Observable<any[]> {
    return this.api.apiGet<any[]>('/api/inventory-settings/store-permissions', params);
  }

  getHighValueItems(params?: ApiListParams): Observable<PagedResult<HighValueAsset>> {
    return this.api.apiGetList<HighValueAsset>('/inventory/high-value-items', params);
  }

  approveHighValueItem(id: number): Observable<any> {
    return this.api.apiPut<any>(`/inventory/high-value-items/${id}/approve`, {});
  }
}
