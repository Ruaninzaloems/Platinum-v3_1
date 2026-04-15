import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, PaginatedResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = '/payroll-app/api';

  constructor(private http: HttpClient) {}

  private buildParams(params?: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return httpParams;
  }

  get<T>(endpoint: string, params?: Record<string, any>): Observable<T> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, { params: this.buildParams(params) })
      .pipe(map(res => res.data));
  }

  getRaw<T>(endpoint: string, params?: Record<string, any>): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, { params: this.buildParams(params) });
  }

  getPaginated<T>(endpoint: string, params?: Record<string, any>): Observable<PaginatedResponse<T>> {
    return this.http.get<PaginatedResponse<T>>(`${this.baseUrl}${endpoint}`, { params: this.buildParams(params) });
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body)
      .pipe(map(res => res.data));
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body)
      .pipe(map(res => res.data));
  }

  patch<T>(endpoint: string, body: any): Observable<T> {
    return this.http.patch<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body)
      .pipe(map(res => res.data));
  }

  postFormData<T>(endpoint: string, formData: FormData): Observable<T> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, formData)
      .pipe(map(res => res.data));
  }

  delete(endpoint: string): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}${endpoint}`);
  }
}
