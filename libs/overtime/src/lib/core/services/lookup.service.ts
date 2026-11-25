import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environment';
import { ApiResponse } from '../models/api-response.model';
import { DepartmentLookup, EmployeeLookup, PositionLookup } from '../models/position-approval.model';
import {
  ConstCycleLookup,
  ConstDepartmentLookup,
  ConstDivisionLookup,
  PayrollCyclePeriodLookup
} from '../models/payroll-lookup.model';

@Injectable({ providedIn: 'root' })
export class LookupService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  positions(search = ''): Observable<PositionLookup[]> {
    const params = search ? new HttpParams().set('search', search) : undefined;
    return this.http.get<ApiResponse<PositionLookup[]>>(`${this.base}/positions`, { params })
      .pipe(map(r => r.data));
  }

  employees(search = ''): Observable<EmployeeLookup[]> {
    const params = search ? new HttpParams().set('search', search) : undefined;
    return this.http.get<ApiResponse<EmployeeLookup[]>>(`${this.base}/employees`, { params })
      .pipe(map(r => r.data));
  }

  employee(id: string): Observable<EmployeeLookup | null> {
    return this.http.get<ApiResponse<EmployeeLookup>>(`${this.base}/employees/${id}`)
      .pipe(map(r => r?.data ?? null));
  }

  // Departments lookup is exposed for follow-up screens (e.g. Department
  // Excess Overtime Approver picker). Not consumed by the foundation pages
  // yet; the API endpoint is already live behind /api/departments.
  departments(): Observable<DepartmentLookup[]> {
    return this.http.get<ApiResponse<DepartmentLookup[]>>(`${this.base}/departments`)
      .pipe(map(r => r.data));
  }

  // ---------- Payroll master-data lookups (Const_*/Payroll_*) ----------
  // Each method returns enabled rows only — the API filters on the
  // Enabled flag so the UI never has to.

  payrollDepartments(): Observable<ConstDepartmentLookup[]> {
    return this.http.get<ApiResponse<ConstDepartmentLookup[]>>(
      `${this.base}/payroll-lookups/departments`
    ).pipe(map(r => r.data));
  }

  // departmentId narrows divisions to the parent department; omit for
  // the full enabled list.
  payrollDivisions(departmentId?: number | null): Observable<ConstDivisionLookup[]> {
    const params = departmentId != null
      ? new HttpParams().set('departmentId', departmentId)
      : undefined;
    return this.http.get<ApiResponse<ConstDivisionLookup[]>>(
      `${this.base}/payroll-lookups/divisions`, { params }
    ).pipe(map(r => r.data));
  }

  payrollCycles(): Observable<ConstCycleLookup[]> {
    return this.http.get<ApiResponse<ConstCycleLookup[]>>(
      `${this.base}/payroll-lookups/cycles`
    ).pipe(map(r => r.data));
  }

  // cycleId narrows periods to the picked cycle; omit for the full list.
  payrollCyclePeriods(cycleId?: number | null): Observable<PayrollCyclePeriodLookup[]> {
    const params = cycleId != null
      ? new HttpParams().set('cycleId', cycleId)
      : undefined;
    return this.http.get<ApiResponse<PayrollCyclePeriodLookup[]>>(
      `${this.base}/payroll-lookups/cycle-periods`, { params }
    ).pipe(map(r => r.data));
  }
}
