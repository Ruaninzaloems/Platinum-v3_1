import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../environment';

export interface ChainPreviewPersonDto {
  employeeId: string | null;
  employeeName: string | null;
  positionId: string | null;
  positionName: string | null;
  isActing: boolean;
}

export interface ChainPreviewDto {
  recommender: ChainPreviewPersonDto | null;
  approver: ChainPreviewPersonDto | null;
  excessApproverConfigured: boolean;
  /** Non-null when the chain could not be resolved for the position. Display to user; block submission. */
  chainError: string | null;
}
import { ApiResponse } from '../models/api-response.model';
import { PaginatedResponse } from '../models/position-approval.model';

export const DUPLICATE_DATE_WARNING_PREFIX = 'DUPLICATE_DATE_WARNING:';

import {
  AmountPreviewDto,
  AmountPreviewRequest,
  CreateOvertimeTransactionRequest,
  OvertimeDocumentDto,
  OvertimeTransactionDto,
  OvertimeTypeOption,
  UpdateOvertimeTransactionRequest
} from '../models/overtime-workflow.model';

@Injectable({ providedIn: 'root' })
export class OvertimeTransactionsService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  listCurrent(page = 1, pageSize = 25): Observable<PaginatedResponse<OvertimeTransactionDto>> {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return this.http.get<ApiResponse<PaginatedResponse<OvertimeTransactionDto>>>(
      `${this.base}/overtime-transactions/current`, { params }
    ).pipe(map(r => r.data));
  }

  listProcessed(page = 1, pageSize = 25): Observable<PaginatedResponse<OvertimeTransactionDto>> {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return this.http.get<ApiResponse<PaginatedResponse<OvertimeTransactionDto>>>(
      `${this.base}/overtime-transactions/processed`, { params }
    ).pipe(map(r => r.data));
  }

  listEnquiry(filters: {
    status?: number | null;
    departmentId?: string | null;
    employeeSearch?: string | null;
    salaryHeadName?: string | null;
    fromDate?: string | null;
    toDate?: string | null;
    page?: number;
    pageSize?: number;
  } = {}): Observable<PaginatedResponse<OvertimeTransactionDto>> {
    let params = new HttpParams()
      .set('page',     filters.page     ?? 1)
      .set('pageSize', filters.pageSize ?? 25);
    if (filters.status      != null) params = params.set('status',         filters.status);
    if (filters.departmentId)        params = params.set('departmentId',   filters.departmentId);
    if (filters.employeeSearch)      params = params.set('employeeSearch', filters.employeeSearch);
    if (filters.salaryHeadName)      params = params.set('salaryHeadName', filters.salaryHeadName);
    if (filters.fromDate)            params = params.set('fromDate',       filters.fromDate);
    if (filters.toDate)              params = params.set('toDate',         filters.toDate);
    return this.http.get<ApiResponse<PaginatedResponse<OvertimeTransactionDto>>>(
      `${this.base}/overtime-transactions/enquiry`, { params }
    ).pipe(map(r => r.data));
  }

  listForEmployee(employeeId: string): Observable<OvertimeTransactionDto[]> {
    return this.http.get<ApiResponse<OvertimeTransactionDto[]>>(
      `${this.base}/overtime-transactions/by-employee/${employeeId}`
    ).pipe(map(r => r.data));
  }

  get(id: string): Observable<OvertimeTransactionDto> {
    return this.http.get<ApiResponse<OvertimeTransactionDto>>(
      `${this.base}/overtime-transactions/${id}`
    ).pipe(map(r => r.data));
  }

  create(req: CreateOvertimeTransactionRequest): Observable<OvertimeTransactionDto> {
    return this.http.post<ApiResponse<OvertimeTransactionDto>>(
      `${this.base}/overtime-transactions`, req
    ).pipe(map(r => {
      if (!r.isSuccess) throw { isDuplicateDateWarning: r.message?.startsWith(DUPLICATE_DATE_WARNING_PREFIX), message: r.message };
      return r.data;
    }));
  }

  update(id: string, req: UpdateOvertimeTransactionRequest): Observable<OvertimeTransactionDto> {
    return this.http.put<ApiResponse<OvertimeTransactionDto>>(
      `${this.base}/overtime-transactions/${id}`, req
    ).pipe(map(r => {
      if (!r.isSuccess) throw { isDuplicateDateWarning: r.message?.startsWith(DUPLICATE_DATE_WARNING_PREFIX), message: r.message };
      return r.data;
    }));
  }

  delete(id: string): Observable<boolean> {
    return this.http.delete<ApiResponse<boolean>>(
      `${this.base}/overtime-transactions/${id}`
    ).pipe(map(r => r.data));
  }

  previewAmount(req: AmountPreviewRequest): Observable<AmountPreviewDto> {
    return this.http.post<ApiResponse<AmountPreviewDto>>(
      `${this.base}/overtime-transactions/preview-amount`, req
    ).pipe(map(r => r.data));
  }

  overtimeTypesForEmployee(employeeId: string): Observable<OvertimeTypeOption[]> {
    return this.http.get<ApiResponse<OvertimeTypeOption[]>>(
      `${this.base}/employees/${employeeId}/overtime-types`
    ).pipe(map(r => r.data));
  }

  uploadDocument(id: string, file: File): Observable<OvertimeDocumentDto> {
    const fd = new FormData();
    fd.append('file', file, file.name);
    return this.http.post<ApiResponse<OvertimeDocumentDto>>(
      `${this.base}/overtime-transactions/${id}/documents`, fd
    ).pipe(map(r => r.data));
  }

  deleteDocument(transactionId: string, documentId: string): Observable<boolean> {
    return this.http.delete<ApiResponse<boolean>>(
      `${this.base}/overtime-transactions/${transactionId}/documents/${documentId}`
    ).pipe(map(r => r.data));
  }

  documentDownloadUrl(transactionId: string, documentId: string): string {
    return `${this.base}/overtime-transactions/${transactionId}/documents/${documentId}`;
  }

  chainPreview(positionId: string, overtimeDate: string): Observable<ChainPreviewDto | null> {
    const params = new HttpParams()
      .set('positionId', positionId)
      .set('overtimeDate', overtimeDate);
    return this.http.get<{ isSuccess: boolean; data: ChainPreviewDto }>(
      `${this.base}/overtime-transactions/chain-preview`, { params }
    ).pipe(
      map(r => r.isSuccess ? r.data : null),
      catchError(() => of(null))
    );
  }
}
