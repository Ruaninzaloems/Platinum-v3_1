import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResult, ApiListParams } from '../models';

@Injectable({ providedIn: 'root' })
export class BaseApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  apiGet<T>(endpoint: string, params?: ApiListParams): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return this.http.get<any>(`${this.baseUrl}${endpoint}`, { params: httpParams }).pipe(
      retry({ count: 1, delay: (error, retryCount) => {
        if (error.status === 401 || error.status === 403 || error.status === 404) {
          throw error;
        }
        return timer(1000 * retryCount);
      }}),
      map(res => this.unwrap<T>(res)),
      catchError(this.handleError)
    );
  }

  apiPost<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<any>(`${this.baseUrl}${endpoint}`, body).pipe(
      map(res => this.unwrap<T>(res)),
      catchError(this.handleError)
    );
  }

  apiPut<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<any>(`${this.baseUrl}${endpoint}`, body).pipe(
      map(res => this.unwrap<T>(res)),
      catchError(this.handleError)
    );
  }

  apiPatch<T>(endpoint: string, body: any): Observable<T> {
    return this.http.patch<any>(`${this.baseUrl}${endpoint}`, body).pipe(
      map(res => this.unwrap<T>(res)),
      catchError(this.handleError)
    );
  }

  apiDelete<T>(endpoint: string): Observable<T> {
    return this.http.delete<any>(`${this.baseUrl}${endpoint}`).pipe(
      map(res => this.unwrap<T>(res)),
      catchError(this.handleError)
    );
  }

  apiGetList<T>(endpoint: string, params?: ApiListParams): Observable<PagedResult<T>> {
    return this.apiGet<PagedResult<T>>(endpoint, params);
  }

  private unwrap<T>(response: any): T {
    if (response && typeof response === 'object' && 'isSuccess' in response && 'data' in response) {
      if (!response.isSuccess) {
        throw new HttpErrorResponse({
          error: { message: response.errors?.join(', ') || response.message || 'Request failed' },
          status: 400,
          statusText: 'Bad Request'
        });
      }
      return response.data as T;
    }
    return response as T;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'An unexpected error occurred';
    if (error.error instanceof ErrorEvent) {
      message = error.error.message;
    } else {
      switch (error.status) {
        case 400: message = error.error?.message || 'Invalid request'; break;
        case 401: message = 'Authentication required'; break;
        case 403: message = 'Insufficient permissions'; break;
        case 404: message = 'Resource not found'; break;
        case 409: message = error.error?.message || 'Conflict detected'; break;
        case 422: message = error.error?.message || 'Validation failed'; break;
        case 500: message = 'Internal server error'; break;
        default: message = error.error?.message || `Error: ${error.status}`;
      }
    }
    return throwError(() => ({ status: error.status, message, details: error.error }));
  }
}
