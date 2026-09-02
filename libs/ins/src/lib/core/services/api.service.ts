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
    // manual retry -- a transient DB blip (Azure Postgres firewall hiccup,
    // cold connection pool) would otherwise leave a section of the UI
    // permanently empty until a full page reload. GET is idempotent, so
    // backed-off retries here are safe and cover every caller at once rather
    // than patching each store individually.
    //
    // Widened 2026-09-02 (recurrence of the original FIN YEAR bug, see
    // PerformanceSync.md Pass 4 and Pass 7): the original count:2/500ms-1000ms
    // window (~1.5s total) was too short for a blip that outlasts it -- once
    // exhausted, the store settles into catchError's empty fallback forever,
    // same as having no retry at all. 5 attempts with exponential-ish backoff
    // (500ms/1s/2s/4s, ~7.5s total) covers a much wider range of transient
    // outages while staying bounded -- this does not paper over a genuinely
    // down backend, it only buys time for a real transient blip to clear.
    return this.http.get<T>(this.url(path), { params: this.buildParams(params) }).pipe(
      retry({ count: 4, delay: (_, attempt) => timer(500 * 2 ** (attempt - 1)) }),
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
