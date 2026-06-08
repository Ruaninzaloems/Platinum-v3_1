import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environment';
import { ApiResponse } from '../models/api-response.model';
import { DashboardSummaryDto, PayrollCyclesResponseDto } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  getSummary(): Observable<DashboardSummaryDto> {
    return this.http
      .get<ApiResponse<DashboardSummaryDto>>(`${this.base}/dashboard/summary`)
      .pipe(map(r => r.data));
  }

  getPayrollCycles(): Observable<PayrollCyclesResponseDto> {
    return this.http
      .get<ApiResponse<PayrollCyclesResponseDto>>(`${this.base}/dashboard/payroll-cycles`)
      .pipe(map(r => r.data));
  }
}
