import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environment';
import { ApiResponse } from '../models/api-response.model';
import {
  OvertimeTransactionDto,
  WorkflowActionRequest,
  WorkflowEventDto
} from '../models/overtime-workflow.model';

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  submit(id: string, req: WorkflowActionRequest = {}): Observable<OvertimeTransactionDto> {
    return this.http.post<ApiResponse<OvertimeTransactionDto>>(
      `${this.base}/workflow/${id}/submit`, req
    ).pipe(map(r => r.data));
  }

  approve(id: string, req: WorkflowActionRequest = {}): Observable<OvertimeTransactionDto> {
    return this.http.post<ApiResponse<OvertimeTransactionDto>>(
      `${this.base}/workflow/${id}/approve`, req
    ).pipe(map(r => r.data));
  }

  return(id: string, req: WorkflowActionRequest = {}): Observable<OvertimeTransactionDto> {
    return this.http.post<ApiResponse<OvertimeTransactionDto>>(
      `${this.base}/workflow/${id}/return`, req
    ).pipe(map(r => r.data));
  }

  reject(id: string, req: WorkflowActionRequest = {}): Observable<OvertimeTransactionDto> {
    return this.http.post<ApiResponse<OvertimeTransactionDto>>(
      `${this.base}/workflow/${id}/reject`, req
    ).pipe(map(r => r.data));
  }

  history(id: string): Observable<WorkflowEventDto[]> {
    return this.http.get<ApiResponse<WorkflowEventDto[]>>(
      `${this.base}/workflow/${id}/history`
    ).pipe(map(r => r.data));
  }
}
