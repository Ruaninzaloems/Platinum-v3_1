import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class WarehouseService {
  private api = inject(BaseApiService);

  getZones(params?: any): Observable<any[]> { return this.api.apiGet('/warehouse/zones', params); }
  getZone(id: string): Observable<any> { return this.api.apiGet(`/warehouse/zones/${id}`); }
  createZone(data: any): Observable<any> { return this.api.apiPost('/warehouse/zones', data); }
  updateZone(id: string, data: any): Observable<any> { return this.api.apiPut(`/warehouse/zones/${id}`, data); }
  deleteZone(id: string): Observable<any> { return this.api.apiDelete(`/warehouse/zones/${id}`); }
  calculateSlots(warehouseId: string): Observable<any> { return this.api.apiPost('/warehouse/slotting/calculate', { warehouseId }); }
  applySlots(warehouseId: string, slots: any[]): Observable<any> { return this.api.apiPost('/warehouse/slotting/apply', { warehouseId, slots }); }
  getSlotUtilization(params?: any): Observable<any> { return this.api.apiGet('/warehouse/slotting/utilization', params); }
  getSlottingHistory(params?: any): Observable<any> { return this.api.apiGet('/warehouse/slotting/history', params); }
  getWmsConfig(): Observable<any> { return this.api.apiGet('/warehouse/wms/config'); }
  updateWmsConfig(data: any): Observable<any> { return this.api.apiPut('/warehouse/wms/config', data); }
  syncStock(): Observable<any> { return this.api.apiPost('/warehouse/wms/sync-stock', {}); }
  receiveAck(data: any): Observable<any> { return this.api.apiPost('/warehouse/wms/receive-ack', data); }
  shipConfirm(data: any): Observable<any> { return this.api.apiPost('/warehouse/wms/ship-confirm', data); }
  getPickPack(params?: any): Observable<any> { return this.api.apiGet('/warehouse/wms/pick-pack', params); }
  scanReceive(data: any): Observable<any> { return this.api.apiPost('/warehouse/barcode/scan-receive', data); }
  scanIssue(data: any): Observable<any> { return this.api.apiPost('/warehouse/barcode/scan-issue', data); }
  scanTransfer(data: any): Observable<any> { return this.api.apiPost('/warehouse/barcode/scan-transfer', data); }
  scanStocktake(data: any): Observable<any> { return this.api.apiPost('/warehouse/barcode/scan-stocktake', data); }
  barcodeLookup(code: string): Observable<any> { return this.api.apiGet(`/warehouse/barcode/lookup/${code}`); }
  generateLabels(data: any): Observable<any> { return this.api.apiPost('/warehouse/barcode/generate-labels', data); }
  rfidReconcile(data: any): Observable<any> { return this.api.apiPost('/warehouse/rfid/reconcile', data); }
  getRfidReaders(): Observable<any[]> { return this.api.apiGet('/warehouse/rfid/readers'); }
  getScanHistory(params?: any): Observable<any> { return this.api.apiGet('/warehouse/barcode/scan-history', params); }
  getDashboard(): Observable<any> { return this.api.apiGet('/warehouse/dashboard'); }
}
