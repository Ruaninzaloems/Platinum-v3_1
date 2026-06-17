import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models';

export interface PayslipEmployee {
  id: number;
  employee_code: string;
  id_number: string;
  first_name: string;
  surname: string;
  annual_salary: number;
  status: string;
  job_title?: string;
}

export interface PayslipLine {
  salary_head_id: number;
  head_code: string;
  head_name: string;
  amount: number;
  transaction_type: string;
  reference_no?: string | null;
}

export interface PayslipResult {
  employee: {
    id: number;
    employee_code: string;
    first_name: string;
    surname: string;
    annual_salary: number;
    position_title?: string;
  };
  earnings: PayslipLine[];
  deductions: PayslipLine[];
  company_contributions: PayslipLine[];
  fringe_benefits: PayslipLine[];
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  paye: number;
  uif_employee: number;
}

export interface PayeBracketDetail {
  bracket_number: number;
  from_value: number;
  to_value: number | null;
  rate: number;
  tax_on_bracket: number;
}

export interface PayeBreakdown {
  annual_taxable_income: number;
  gross_tax: number;
  primary_rebate: number;
  secondary_rebate: number;
  tertiary_rebate: number;
  medical_credit: number;
  annual_paye: number;
  monthly_paye: number;
  brackets_detail: PayeBracketDetail[];
}

export interface PayslipEmployeeMeta {
  total: number;
  page: number;
  limit: number;
}

export interface PayslipListParams {
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  [key: string]: string | number | undefined;
}

@Injectable({ providedIn: 'root' })
export class PayslipService {
  private readonly base = '/payroll/payslip-view';

  constructor(private api: ApiService) {}

  /** List employees available for individual payslip calculation. cycle_id is required. */
  getEmployees(
    cycleId: number,
    params?: PayslipListParams
  ): Observable<{ data: PayslipEmployee[]; meta: PayslipEmployeeMeta; period: unknown }> {
    return this.api
      .getRaw<PayslipEmployee[]>(`${this.base}/employees`, { cycle_id: cycleId, ...params })
      .pipe(
        map((res: ApiResponse<PayslipEmployee[]>) => ({
          data: res.data ?? [],
          meta: res.meta as PayslipEmployeeMeta,
          period: (res as Record<string, unknown>)['period'] ?? null,
        }))
      );
  }

  /** Calculate the full payslip for a specific employee in a given period and cycle. */
  calculatePayslip(
    employeeId: number,
    periodId: number,
    cycleId: number
  ): Observable<PayslipResult> {
    return this.api.get<PayslipResult>(
      `${this.base}/employee/${employeeId}/calculate`,
      { period_id: periodId, cycle_id: cycleId }
    );
  }

  /** Fetch the PAYE bracket breakdown for an employee's payslip. */
  getPayeBreakdown(
    employeeId: number,
    periodId: number,
    cycleId: number
  ): Observable<PayeBreakdown> {
    return this.api.get<PayeBreakdown>(
      `${this.base}/employee/${employeeId}/paye-breakdown`,
      { period_id: periodId, cycle_id: cycleId }
    );
  }

  /** Add a salary transaction to an employee's payslip for the current period. */
  addTransaction(
    employeeId: number,
    body: { salary_head_id: number; captured_amount: number; every_month?: boolean; period_id?: number }
  ): Observable<PayslipLine> {
    return this.api.post<PayslipLine>(
      `${this.base}/employee/${employeeId}/transactions`,
      body
    );
  }

  /** Remove a salary transaction from an employee's payslip. */
  removeTransaction(
    employeeId: number,
    transactionId: number
  ): Observable<{ message: string }> {
    return this.api.delete(
      `${this.base}/employee/${employeeId}/transactions/${transactionId}`
    );
  }

  /** Lookup employees by name/code for navigation within payslip view. */
  lookupEmployee(
    query: string,
    cycleId: number
  ): Observable<PayslipEmployee[]> {
    return this.api.get<PayslipEmployee[]>(
      `${this.base}/employee-lookup`,
      { q: query, cycle_id: cycleId }
    );
  }
}
