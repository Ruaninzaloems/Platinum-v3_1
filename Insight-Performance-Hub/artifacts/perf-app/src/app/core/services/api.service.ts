import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

type ParamsLike = Record<string, string | number | boolean | null | undefined>;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  private url(path: string): string {
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${environment.apiBaseUrl}${p}`;
  }

  private buildParams(params?: ParamsLike): HttpParams | undefined {
    if (!params) return undefined;
    let hp = new HttpParams();
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue;
      hp = hp.set(k, String(v));
    }
    return hp;
  }

  get<T>(path: string, params?: ParamsLike): Observable<T> {
    return this.http.get<T>(this.url(path), { params: this.buildParams(params) });
  }
  post<T>(path: string, body?: unknown): Observable<T> {
    return this.http.post<T>(this.url(path), body ?? {});
  }
  patch<T>(path: string, body?: unknown): Observable<T> {
    return this.http.patch<T>(this.url(path), body ?? {});
  }
  put<T>(path: string, body?: unknown): Observable<T> {
    return this.http.put<T>(this.url(path), body ?? {});
  }
  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(this.url(path));
  }
  getBlob(path: string, params?: ParamsLike): Observable<Blob> {
    return this.http.get(this.url(path), { params: this.buildParams(params), responseType: 'blob' });
  }
}
