import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '@env/environment';
import { DashboardStats, Scorecard } from '../models/scorecard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  /**
   * Pulls the scorecards list from the backend and folds it into a
   * dashboard summary. The backend returns a raw array (`Scorecard[]`),
   * so we count by `status` rather than inventing fake percentages —
   * if integration is broken the numbers go to zero, making the failure
   * visible instead of hiding it behind hard-coded fallbacks.
   *
   * When the backend exposes a real summary endpoint it should replace
   * this fold one-for-one.
   */
  getDashboardStats(): Observable<DashboardStats> {
    return this.http
      .get<Scorecard[]>(`${this.base}/scorecards`)
      .pipe(
        map((rows) => {
          const list = Array.isArray(rows) ? rows : [];
          const totalKpis = list.length;
          const achieved = list.filter((s) => s.status === 'approved').length;
          const atRisk   = list.filter((s) => s.status === 'rejected').length;
          const pendingEvidence = list.filter(
            (s) => s.status === 'submitted' || s.status === 'draft',
          ).length;
          return {
            totalKpis,
            achieved,
            atRisk,
            pendingEvidence,
            cycleCode: '2025/2026',
            cycleStatus: 'OPEN',
          } satisfies DashboardStats;
        }),
      );
  }
}
