import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, retry, timer } from 'rxjs';
import { IdpCycle } from '../models/idp.models';
import { environment } from '../../environment';

@Injectable({ providedIn: 'root' })
export class CycleStateService {
  private http = inject(HttpClient);
  private _cycles = signal<IdpCycle[]>([]);
  private _activeCycle = signal<IdpCycle | null>(null);
  private _initialized = false;
  private baseUrl = `${environment.apiPrefix}/api`;

  cycles = this._cycles.asReadonly();
  activeCycle = this._activeCycle.asReadonly();
  activeCycleId = computed(() => this._activeCycle()?.id ?? 0);

  setActiveCycle(cycle: IdpCycle) {
    this._activeCycle.set(cycle);
  }

  async loadCycles(): Promise<IdpCycle[]> {
    // The IDP backend is on Azure App Service: when idle it cold-starts and the
    // first request can fail with a network-level error (status 0) or a 5xx before
    // the app is warm. Without a retry that transient blip leaves a permanent
    // "0 Unknown Error" on the dashboard until the user manually refreshes. Retry a
    // few times with backoff so the page self-recovers once the backend is up.
    const cycles = await firstValueFrom(
      this.http.get<IdpCycle[]>(`${this.baseUrl}/cycles`).pipe(
        retry({
          count: 4,
          delay: (err, attempt) => {
            const status = err?.status ?? 0;
            // Only retry transient failures (cold start / network), not real 4xx.
            if (status !== 0 && status < 500) throw err;
            return timer(Math.min(1500 * attempt, 5000));
          },
        }),
      ),
    );
    this._cycles.set(cycles);
    if (!this._activeCycle() && cycles.length > 0) {
      this._activeCycle.set(cycles[0]);
    }
    this._initialized = true;
    return cycles;
  }

  async ensureActiveCycle(): Promise<IdpCycle | null> {
    if (this._activeCycle()) return this._activeCycle();
    if (this._initialized) return null;
    await this.loadCycles();
    return this._activeCycle();
  }
}
