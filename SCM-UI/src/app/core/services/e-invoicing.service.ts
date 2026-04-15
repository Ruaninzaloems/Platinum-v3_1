import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class EInvoicingService {
  private api = inject(BaseApiService);

  list(params?: any): Observable<any> { return this.api.apiGet('/e-invoicing', params); }
  get(id: string): Observable<any> { return this.api.apiGet(`/e-invoicing/${id}`); }
  generate(data: any): Observable<any> { return this.api.apiPost('/e-invoicing/generate', data); }
  validate(id: string): Observable<any> { return this.api.apiPost(`/e-invoicing/${id}/validate`, {}); }
  generateUbl(id: string): Observable<any> { return this.api.apiPost(`/e-invoicing/${id}/generate-ubl`, {}); }
  send(id: string): Observable<any> { return this.api.apiPost(`/e-invoicing/${id}/send`, {}); }
  receive(data: any): Observable<any> { return this.api.apiPost('/e-invoicing/receive', data); }
  archive(id: string): Observable<any> { return this.api.apiPost(`/e-invoicing/${id}/archive`, {}); }
  convert(id: string, targetFormat: string): Observable<any> { return this.api.apiPost(`/e-invoicing/${id}/convert`, { targetFormat }); }
  complianceCheck(id: string): Observable<any> { return this.api.apiPost(`/e-invoicing/${id}/compliance-check`, {}); }
  getTransmissionLog(id: string): Observable<any[]> { return this.api.apiGet(`/e-invoicing/${id}/transmission-log`); }
  getFormats(): Observable<any[]> { return this.api.apiGet('/e-invoicing/formats'); }
  getStatuses(): Observable<any[]> { return this.api.apiGet('/e-invoicing/statuses'); }
  getPeppolConfig(): Observable<any> { return this.api.apiGet('/e-invoicing/peppol-config'); }
  getComplianceRules(): Observable<any[]> { return this.api.apiGet('/e-invoicing/compliance-rules'); }
  getArchiveConfig(): Observable<any> { return this.api.apiGet('/e-invoicing/archive-config'); }
  getDashboard(): Observable<any> { return this.api.apiGet('/e-invoicing/dashboard'); }
}
