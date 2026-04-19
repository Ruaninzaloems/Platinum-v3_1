import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  get<T = any>(url: string, params?: Record<string, string>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<T>(url, { params: httpParams, withCredentials: true });
  }

  post<T = any>(url: string, body?: any): Observable<T> {
    return this.http.post<T>(url, body || {}, { withCredentials: true });
  }

  postWithIdempotency<T = any>(url: string, body?: any, idempotencyToken?: string): Observable<T> {
    const headers = new HttpHeaders().set('X-Idempotency-Token', idempotencyToken || this.generateToken());
    return this.http.post<T>(url, body || {}, { withCredentials: true, headers });
  }

  postBlob(url: string, body?: any): Observable<Blob> {
    return this.http.post(url, body || {}, { withCredentials: true, responseType: 'blob' });
  }

  getBlob(url: string, params?: Record<string, string>): Observable<{ blob: Blob; filename: string }> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return new Observable(observer => {
      this.http.get(url, { params: httpParams, withCredentials: true, responseType: 'blob', observe: 'response' }).subscribe({
        next: (response) => {
          const disposition = response.headers.get('content-disposition') || '';
          const match = disposition.match(/filename[^;=\n]*=(['"]?)([^'"\n]+)\1/);
          const filename = match?.[2]?.trim() || 'download';
          observer.next({ blob: response.body!, filename });
          observer.complete();
        },
        error: (err) => observer.error(err),
      });
    });
  }

  put<T = any>(url: string, body?: any): Observable<T> {
    return this.http.put<T>(url, body || {}, { withCredentials: true });
  }

  delete<T = any>(url: string, params?: Record<string, string>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.delete<T>(url, { params: httpParams, withCredentials: true });
  }

  private generateToken(): string {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
  }
}
