import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class ESignatureService {
  private api = inject(BaseApiService);

  getProviders(): Observable<any[]> { return this.api.apiGet('/e-signature/providers'); }
  getStatuses(): Observable<any[]> { return this.api.apiGet('/e-signature/statuses'); }
  getTemplates(): Observable<any[]> { return this.api.apiGet('/e-signature/templates'); }
  getTemplate(id: string): Observable<any> { return this.api.apiGet(`/e-signature/templates/${id}`); }
  createTemplate(data: any): Observable<any> { return this.api.apiPost('/e-signature/templates', data); }
  updateTemplate(id: string, data: any): Observable<any> { return this.api.apiPut(`/e-signature/templates/${id}`, data); }
  deleteTemplate(id: string): Observable<any> { return this.api.apiDelete(`/e-signature/templates/${id}`); }
  getEnvelopes(params?: any): Observable<any> { return this.api.apiGet('/e-signature/envelopes', params); }
  getEnvelope(id: string): Observable<any> { return this.api.apiGet(`/e-signature/envelopes/${id}`); }
  createEnvelope(data: any): Observable<any> { return this.api.apiPost('/e-signature/envelopes', data); }
  sendForSignature(id: string): Observable<any> { return this.api.apiPost(`/e-signature/envelopes/${id}/send`, {}); }
  sign(id: string, signerId: string): Observable<any> { return this.api.apiPost(`/e-signature/envelopes/${id}/sign`, { signerId }); }
  decline(id: string, data: any): Observable<any> { return this.api.apiPost(`/e-signature/envelopes/${id}/decline`, data); }
  void(id: string, reason: string): Observable<any> { return this.api.apiPost(`/e-signature/envelopes/${id}/void`, { reason }); }
  getStatus(id: string): Observable<any> { return this.api.apiGet(`/e-signature/envelopes/${id}/status`); }
  download(id: string): Observable<any> { return this.api.apiGet(`/e-signature/envelopes/${id}/download`); }
  getCertificate(id: string): Observable<any> { return this.api.apiGet(`/e-signature/envelopes/${id}/certificate`); }
  getAuditTrail(id: string): Observable<any[]> { return this.api.apiGet(`/e-signature/envelopes/${id}/audit-trail`); }
  getDashboard(): Observable<any> { return this.api.apiGet('/e-signature/dashboard'); }
  getWebhookConfig(): Observable<any> { return this.api.apiGet('/e-signature/webhook-config'); }
}
