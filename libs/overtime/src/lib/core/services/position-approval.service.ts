import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environment';
import { ApiResponse } from '../models/api-response.model';
import {
  ConfirmImportRequest, ImportConfirmResult, ImportValidationResult,
  PaginatedResponse, PositionApprovalConfig, PositionListItem,
  PositionsSummary, PositionStatusFilter
} from '../models/position-approval.model';

@Injectable({ providedIn: 'root' })
export class PositionApprovalService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/positions`;

  get(positionId: string): Observable<PositionApprovalConfig> {
    return this.http.get<ApiResponse<PositionApprovalConfig>>(`${this.base}/${positionId}/approval-config`)
      .pipe(map(r => r.data));
  }

  upsert(positionId: string, config: PositionApprovalConfig): Observable<PositionApprovalConfig> {
    return this.http.put<ApiResponse<PositionApprovalConfig>>(
      `${this.base}/${positionId}/approval-config`, config
    ).pipe(map(r => r.data));
  }

  /**
   * Paginated list of all Platinum positions, enriched with whether each
   * already has an approval config saved. Backs the redesigned setup grid.
   */
  list(opts: {
    search?: string; status?: PositionStatusFilter; page: number; pageSize: number;
    sort?: string; direction?: 'asc' | 'desc' | '';
  }): Observable<PaginatedResponse<PositionListItem>> {
    let params = new HttpParams()
      .set('page', String(opts.page))
      .set('pageSize', String(opts.pageSize));
    if (opts.search) params = params.set('search', opts.search);
    if (opts.status && opts.status !== 'all') params = params.set('status', opts.status);
    if (opts.sort && opts.direction) {
      params = params.set('sort', opts.sort).set('direction', opts.direction);
    }
    return this.http.get<ApiResponse<PaginatedResponse<PositionListItem>>>(
      `${this.base}/list`, { params }
    ).pipe(map(r => r.data));
  }

  /** Counts for the KPI cards (total / configured / not configured). */
  summary(): Observable<PositionsSummary> {
    return this.http.get<ApiResponse<PositionsSummary>>(`${this.base}/summary`)
      .pipe(map(r => r.data));
  }

  /** Download the Excel import template as a blob for browser save. */
  downloadTemplate(): Observable<Blob> {
    return this.http.get(`${this.base}/approval-config/template`, { responseType: 'blob' });
  }

  /** Download the Position Relationships Report as an Excel blob. */
  downloadReport(): Observable<Blob> {
    return this.http.get(`${this.base}/approval-config/report`, { responseType: 'blob' });
  }

  /** Validate an Excel file upload; returns a preview without committing. */
  validateImport(file: File): Observable<ImportValidationResult> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ApiResponse<ImportValidationResult>>(
      `${this.base}/approval-config/import`, form
    ).pipe(map(r => r.data));
  }

  /** Commit the validated import payload. */
  confirmImport(payload: ConfirmImportRequest): Observable<ImportConfirmResult> {
    return this.http.post<ApiResponse<ImportConfirmResult>>(
      `${this.base}/approval-config/import/confirm`, payload
    ).pipe(map(r => r.data));
  }
}
