import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { retry, timer } from 'rxjs';
import { environment } from '../../environment';

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
    // Several read stores (e.g. CycleStore) subscribe exactly once via toSignal
    // and cache the result forever, with no way for the user to trigger a
    // manual retry -- a single transient DB blip (Azure Postgres firewall
    // hiccup, cold connection pool) would otherwise leave a section of the UI
    // permanently empty until a full page reload. GET is idempotent, so a
    // couple of short, backed-off retries here is safe and covers every
    // caller at once rather than patching each store individually.
    return this.http.get<T>(this.url(path), { params: this.buildParams(params) }).pipe(
      retry({ count: 2, delay: (_, attempt) => timer(attempt * 500) }),
    );
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
