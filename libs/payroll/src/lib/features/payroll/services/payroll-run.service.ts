import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models';

export interface PayrollRun {
  id: number;
  cycle_id: number;
  period_id: number;
  run_type: 'TRIAL' | 'FINAL' | 'ADHOC_TRIAL' | 'ADHOC_FINAL';
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'LOCKED' | 'APPROVED';
  payment_date: string | null;
  locked_at: string | null;
  approved_at: string | null;
  created_at: string;
  cycle_name?: string;
  period_start?: string;
  period_end?: string;
}

export interface RunResultSummaryRow {
  emp_id: number;
  employee_code: string;
  first_name: string;
  surname: string;
  reason: 'CALCULATED' | 'ERROR';
  salary: number;
  earnings: number;
  deductions: number;
  contributions: number;
  fringe: number;
  nett_salary: number;
}

export interface RunResultsMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface WageTransaction {
  id: number;
  employee_id: number;
  employee_code: string;
  first_name: string;
  surname: string;
  salary_head_id: number;
  head_code: string;
  period_id: number;
  cycle_id: number;
  hours: number | null;
  days: number | null;
  rate: number;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  reference_no: string | null;
  notes: string | null;
  created_at: string;
}

export interface RunResultSummaryParams {
  page?: number;
  limit?: number;
  name?: string;
  surname?: string;
  code?: string;
  reason?: string;
  [key: string]: string | number | undefined;
}

export interface WageTransactionParams {
  period_id?: number;
  cycle_id?: number;
  employee_id?: number;
  status?: string;
  tab?: string;
  page?: number;
  limit?: number;
  [key: string]: string | number | undefined;
}

@Injectable({ providedIn: 'root' })
export class PayrollRunService {
  constructor(private api: ApiService) {}

  /** Find the most recent payroll run for the given cycle + period. Returns null if none exists. */
  findRun(cycleId: number, periodId: number): Observable<PayrollRun | null> {
    return this.api.get<PayrollRun | null>('/payroll/runs/find', { cycle_id: cycleId, period_id: periodId });
  }

  /** Fetch the results summary grid for a completed/locked payroll run. */
  getResultsSummary(
    runId: number,
    params?: RunResultSummaryParams
  ): Observable<{ data: RunResultSummaryRow[]; meta: RunResultsMeta }> {
    return this.api
      .getRaw<RunResultSummaryRow[]>(`/payroll/runs/${runId}/results-summary`, params)
      .pipe(
        map((res: ApiResponse<RunResultSummaryRow[]>) => ({
          data: res.data ?? [],
          meta: res.meta as RunResultsMeta,
        }))
      );
  }

  /** Lock a completed (TRIAL) run — sets status to LOCKED and locks the period. */
  lockRun(runId: number): Observable<PayrollRun> {
    return this.api.post<PayrollRun>(`/payroll/runs/${runId}/lock`, {});
  }

  /** Unlock a locked (TRIAL) run — reverts to COMPLETED and reopens the period. */
  unlockRun(runId: number): Observable<PayrollRun> {
    return this.api.post<PayrollRun>(`/payroll/runs/${runId}/unlock`, {});
  }

  /** Promote a locked TRIAL run to a FINAL run and execute it. */
  promoteRun(runId: number): Observable<PayrollRun> {
    return this.api.post<PayrollRun>(`/payroll/runs/${runId}/promote`, {});
  }

  /** Fetch wage transactions, optionally filtered by period, cycle, employee, or status. */
  getWageTransactions(
    params?: WageTransactionParams
  ): Observable<{ data: WageTransaction[]; meta: RunResultsMeta }> {
    return this.api
      .getRaw<WageTransaction[]>('/payroll/wages/transactions', params)
      .pipe(
        map((res: ApiResponse<WageTransaction[]>) => ({
          data: res.data ?? [],
          meta: res.meta as RunResultsMeta,
        }))
      );
  }
}
