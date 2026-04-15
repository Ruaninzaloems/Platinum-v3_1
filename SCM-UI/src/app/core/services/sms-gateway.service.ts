import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class SmsGatewayService {
  private api = inject(BaseApiService);

  getConfig(): Observable<any> { return this.api.apiGet('/sms/config'); }
  updateConfig(data: any): Observable<any> { return this.api.apiPut('/sms/config', data); }
  send(data: any): Observable<any> { return this.api.apiPost('/sms/send', data); }
  sendBulk(data: any): Observable<any> { return this.api.apiPost('/sms/bulk', data); }
  getDeliveryStatus(id: string): Observable<any> { return this.api.apiGet(`/sms/status/${id}`); }
  getLogs(params?: any): Observable<any> { return this.api.apiGet('/sms/logs', params); }
  getTemplates(): Observable<any[]> { return this.api.apiGet('/sms/templates'); }
  getTemplate(id: string): Observable<any> { return this.api.apiGet(`/sms/templates/${id}`); }
  createTemplate(data: any): Observable<any> { return this.api.apiPost('/sms/templates', data); }
  updateTemplate(id: string, data: any): Observable<any> { return this.api.apiPut(`/sms/templates/${id}`, data); }
  deleteTemplate(id: string): Observable<any> { return this.api.apiDelete(`/sms/templates/${id}`); }
  optIn(data: any): Observable<any> { return this.api.apiPost('/sms/opt-in', data); }
  optOut(data: any): Observable<any> { return this.api.apiPost('/sms/opt-out', data); }
  getOptStatus(mobile: string): Observable<any> { return this.api.apiGet(`/sms/opt-status/${mobile}`); }
  getUsageReport(params?: any): Observable<any> { return this.api.apiGet('/sms/usage-report', params); }
  getDashboard(): Observable<any> { return this.api.apiGet('/sms/dashboard'); }
}
