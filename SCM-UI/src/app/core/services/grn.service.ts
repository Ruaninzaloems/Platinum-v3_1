import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { GoodsReceivedNote, ApiListParams, PagedResult } from '../models';

@Injectable({ providedIn: 'root' })
export class GrnService {
  private api = inject(BaseApiService);

  getAll(params?: ApiListParams): Observable<PagedResult<GoodsReceivedNote>> {
    return this.api.apiGetList<GoodsReceivedNote>('/grn', params);
  }

  getById(id: string): Observable<GoodsReceivedNote> {
    return this.api.apiGet<GoodsReceivedNote>(`/grn/${id}`);
  }

  create(data: Partial<GoodsReceivedNote>): Observable<GoodsReceivedNote> {
    return this.api.apiPost<GoodsReceivedNote>('/grn', data);
  }

  update(id: string, data: Partial<GoodsReceivedNote>): Observable<GoodsReceivedNote> {
    return this.api.apiPut<GoodsReceivedNote>(`/grn/${id}`, data);
  }

  submit(id: string): Observable<any> {
    return this.api.apiPost<any>(`/grn/${id}/submit`, {});
  }

  approve(id: string, comments?: string): Observable<any> {
    return this.api.apiPost<any>(`/grn/${id}/approve`, { comments });
  }

  voidGrn(id: string, data: { voidBy: string; voidDate: string; comment: string }): Observable<any> {
    return this.api.apiPost<any>(`/grn/${id}/void`, data);
  }

  getByOrder(orderId: string): Observable<GoodsReceivedNote[]> {
    return this.api.apiGet<GoodsReceivedNote[]>(`/grn/by-order/${orderId}`);
  }

  getDashboardSummary(): Observable<any> {
    return this.api.apiGet<any>('/grn/dashboard/summary');
  }

  getStores(): Observable<any[]> {
    return this.api.apiGet<any[]>('/grn/stores');
  }

  getPdf(id: string): Observable<any> {
    return this.api.apiGet<any>(`/grn/${id}/pdf`);
  }

  getBudgetImpact(id: string): Observable<any> {
    return this.api.apiGet<any>(`/grn/${id}/budget-impact`);
  }

  uploadDocument(id: string, data: any): Observable<any> {
    return this.api.apiPost<any>(`/grn/${id}/documents`, data);
  }

  notifyInventory(id: string): Observable<any> {
    return this.api.apiPost<any>(`/grn/${id}/inventory-notify`, {});
  }

  notifyAsset(id: string): Observable<any> {
    return this.api.apiPost<any>(`/grn/${id}/asset-notify`, {});
  }

  getPhotos(id: string): Observable<any[]> { return this.api.apiGet(`/grn/${id}/photos`); }
  uploadPhoto(id: string, data: any): Observable<any> { return this.api.apiPost(`/grn/${id}/photos`, data); }
  deletePhoto(id: string, photoId: string): Observable<any> { return this.api.apiDelete(`/grn/${id}/photos/${photoId}`); }
  annotatePhoto(id: string, photoId: string, data: any): Observable<any> { return this.api.apiPost(`/grn/${id}/photos/${photoId}/annotate`, data); }
  scanBarcodeReceive(data: any): Observable<any> { return this.api.apiPost('/grn/scan/barcode-receive', data); }
  cameraCapture(data: any): Observable<any> { return this.api.apiPost('/grn/scan/camera-capture', data); }
}
