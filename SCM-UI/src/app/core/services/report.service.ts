import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { ReportDefinition, SpendAnalytics, AnalyticsDashboard, ApiListParams, PagedResult } from '../models';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private api = inject(BaseApiService);

  getReportDefinitions(params?: ApiListParams): Observable<ReportDefinition[]> {
    return this.api.apiGet<ReportDefinition[]>('/reports/definitions', params);
  }

  getReportById(id: string): Observable<ReportDefinition> {
    return this.api.apiGet<ReportDefinition>(`/reports/definitions/${id}`);
  }

  generateReport(id: string, parameters: Record<string, any>, format: string): Observable<{ fileUrl: string; fileName: string }> {
    return this.api.apiPost<{ fileUrl: string; fileName: string }>(`/reports/${id}/generate`, { parameters, format });
  }

  getScheduledReports(): Observable<any[]> {
    return this.api.apiGet<any[]>('/reports/scheduled');
  }

  scheduleReport(data: { reportId: string; schedule: string; parameters: Record<string, any>; format: string; recipients: string[] }): Observable<any> {
    return this.api.apiPost<any>('/reports/scheduled', data);
  }

  getSpendAnalytics(params?: ApiListParams): Observable<SpendAnalytics> {
    return this.api.apiGet<SpendAnalytics>('/reports/spend-analytics', params);
  }

  getDashboards(): Observable<AnalyticsDashboard[]> {
    return this.api.apiGet<AnalyticsDashboard[]>('/reports/dashboards');
  }

  getDashboardById(id: string): Observable<AnalyticsDashboard> {
    return this.api.apiGet<AnalyticsDashboard>(`/reports/dashboards/${id}`);
  }
}
