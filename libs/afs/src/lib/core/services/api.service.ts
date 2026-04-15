import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError, timer, Subject } from 'rxjs';
import { timeout, switchMap, catchError, take } from 'rxjs/operators';
import { environment } from '../../environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = (environment.apiPrefix || '') + '/api';
  private defaultTimeout = 45000;
  private backendReady = false;
  private backendPolling = false;
  private backendReady$ = new Subject<boolean>();

  constructor(private http: HttpClient) {}

  waitForBackend(maxWaitMs = 90000): Observable<boolean> {
    if (this.backendReady) return of(true);

    if (this.backendPolling) {
      return this.backendReady$.pipe(take(1));
    }

    this.backendPolling = true;
    const startTime = Date.now();
    const pollInterval = 3000;

    const poll = () => {
      if (Date.now() - startTime > maxWaitMs) {
        this.backendPolling = false;
        this.backendReady$.next(false);
        return;
      }
      this.http.get<any>(`${this.baseUrl}/health`).pipe(
        timeout(5000),
      ).subscribe({
        next: () => {
          this.backendReady = true;
          this.backendPolling = false;
          this.backendReady$.next(true);
        },
        error: () => {
          setTimeout(() => poll(), pollInterval);
        },
      });
    };

    poll();
    return this.backendReady$.pipe(take(1));
  }

  get<T>(path: string, params?: Record<string, any>, options?: { timeout?: number }): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<T>(`${this.baseUrl}${path}`, { params: httpParams }).pipe(
      timeout(options?.timeout ?? this.defaultTimeout)
    );
  }

  post<T>(path: string, body?: any, options?: { timeout?: number }): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body).pipe(
      timeout(options?.timeout ?? this.defaultTimeout)
    );
  }

  put<T>(path: string, body?: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${path}`, body).pipe(
      timeout(this.defaultTimeout)
    );
  }

  patch<T>(path: string, body?: any): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${path}`, body).pipe(
      timeout(this.defaultTimeout)
    );
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${path}`).pipe(
      timeout(this.defaultTimeout)
    );
  }

  getBlob(path: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}${path}`, { responseType: 'blob' }).pipe(
      timeout(120000)
    );
  }

  postFormData<T>(path: string, formData: FormData): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, formData).pipe(
      timeout(120000)
    );
  }

  upload<T>(path: string, file: File, metadata?: Record<string, any>): Observable<T> {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });
    }
    return this.http.post<T>(`${this.baseUrl}${path}`, formData).pipe(
      timeout(120000)
    );
  }
}
