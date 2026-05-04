import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environment';
import { ApiResponse } from '../models/api-response.model';
import { OvertimeConfig } from '../models/overtime-config.model';

@Injectable({ providedIn: 'root' })
export class OvertimeConfigService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/overtime-config`;

  get(): Observable<OvertimeConfig> {
    return this.http.get<ApiResponse<OvertimeConfig>>(this.base).pipe(map(r => r.data));
  }

  update(config: OvertimeConfig): Observable<OvertimeConfig> {
    return this.http.put<ApiResponse<OvertimeConfig>>(this.base, config).pipe(map(r => r.data));
  }
}
