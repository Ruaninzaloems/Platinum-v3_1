import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  total?: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  get<T>(url: string, params?: Record<string, string | number | boolean>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          httpParams = httpParams.set(key, String(val));
        }
      });
    }
    return this.http.get<T>(url, { params: httpParams }).pipe(catchError(this.handleError));
  }

  post<T>(url: string, body: unknown): Observable<T> {
    return this.http.post<T>(url, body).pipe(catchError(this.handleError));
  }

  put<T>(url: string, body: unknown): Observable<T> {
    return this.http.put<T>(url, body).pipe(catchError(this.handleError));
  }

  patch<T>(url: string, body: unknown): Observable<T> {
    return this.http.patch<T>(url, body).pipe(catchError(this.handleError));
  }

  delete<T>(url: string): Observable<T> {
    return this.http.delete<T>(url).pipe(catchError(this.handleError));
  }

  getPaginated<T>(url: string, pagination: PaginationParams): Observable<ApiResponse<T[]>> {
    const params: Record<string, string | number> = {};
    if (pagination.page) params['page'] = pagination.page;
    if (pagination.pageSize) params['pageSize'] = pagination.pageSize;
    if (pagination.sortBy) params['sortBy'] = pagination.sortBy;
    if (pagination.sortOrder) params['sortOrder'] = pagination.sortOrder;
    if (pagination.search) params['search'] = pagination.search;
    return this.get<ApiResponse<T[]>>(url, params);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'An unexpected error occurred';
    if (error.status === 0) {
      message = 'Unable to connect to the server';
    } else if (error.error?.message) {
      message = error.error.message;
    } else if (error.status === 401) {
      message = 'Session expired. Please log in again.';
    } else if (error.status === 403) {
      message = 'You do not have permission to perform this action';
    } else if (error.status === 404) {
      message = 'Resource not found';
    }
    return throwError(() => ({ status: error.status, message, details: error.error }));
  }
}
