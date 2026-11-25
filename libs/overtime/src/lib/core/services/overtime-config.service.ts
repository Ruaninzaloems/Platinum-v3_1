import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay, tap } from 'rxjs';
import { environment } from '../../environment';
import { ApiResponse } from '../models/api-response.model';
import { OvertimeConfig } from '../models/overtime-config.model';

@Injectable({ providedIn: 'root' })
export class OvertimeConfigService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/overtime-config`;

  private cache$: Observable<OvertimeConfig> | null = null;

  get(): Observable<OvertimeConfig> {
    if (!this.cache$) {
      this.cache$ = this.http.get<ApiResponse<OvertimeConfig>>(this.base)
        .pipe(map(r => r.data), shareReplay(1));
    }
    return this.cache$;
  }

  invalidateCache(): void {
    this.cache$ = null;
  }

  update(config: OvertimeConfig): Observable<OvertimeConfig> {
    return this.http.put<ApiResponse<OvertimeConfig>>(this.base, config).pipe(
      map(r => r.data),
      tap(() => this.invalidateCache())
    );
  }
}
