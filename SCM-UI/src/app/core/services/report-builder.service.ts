import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class ReportBuilderService {
  private api = inject(BaseApiService);

  getDataSources(): Observable<any[]> { return this.api.apiGet('/report-builder/data-sources'); }
  getFields(dataSourceId: string): Observable<any[]> { return this.api.apiGet(`/report-builder/data-sources/${dataSourceId}/fields`); }
  getReports(params?: any): Observable<any> { return this.api.apiGet('/report-builder/reports', params); }
  getReport(id: string): Observable<any> { return this.api.apiGet(`/report-builder/reports/${id}`); }
  createReport(data: any): Observable<any> { return this.api.apiPost('/report-builder/reports', data); }
  updateReport(id: string, data: any): Observable<any> { return this.api.apiPut(`/report-builder/reports/${id}`, data); }
  deleteReport(id: string): Observable<any> { return this.api.apiDelete(`/report-builder/reports/${id}`); }
  executeReport(id: string, params?: any): Observable<any> { return this.api.apiPost(`/report-builder/reports/${id}/execute`, params || {}); }
  exportReport(id: string, format: string): Observable<any> { return this.api.apiPost(`/report-builder/reports/${id}/export`, { format }); }
  shareReport(id: string, data: any): Observable<any> { return this.api.apiPost(`/report-builder/reports/${id}/share`, data); }
  scheduleReport(id: string, data: any): Observable<any> { return this.api.apiPost(`/report-builder/reports/${id}/schedule`, data); }
  getSchedules(): Observable<any[]> { return this.api.apiGet('/report-builder/schedules'); }
  deleteSchedule(id: string): Observable<any> { return this.api.apiDelete(`/report-builder/schedules/${id}`); }
  getCalculatedFields(): Observable<any[]> { return this.api.apiGet('/report-builder/calculated-fields'); }
  createCalculatedField(data: any): Observable<any> { return this.api.apiPost('/report-builder/calculated-fields', data); }
  getPowerBiConfig(): Observable<any> { return this.api.apiGet('/report-builder/powerbi/config'); }
  updatePowerBiConfig(data: any): Observable<any> { return this.api.apiPut('/report-builder/powerbi/config', data); }
  getPowerBiDashboards(): Observable<any[]> { return this.api.apiGet('/report-builder/powerbi/dashboards'); }
  embedPowerBi(dashboardId: string): Observable<any> { return this.api.apiPost(`/report-builder/powerbi/embed/${dashboardId}`, {}); }
  getDashboard(): Observable<any> { return this.api.apiGet('/report-builder/dashboard'); }
}
