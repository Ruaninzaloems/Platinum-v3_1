import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
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
    const cycles = await firstValueFrom(this.http.get<IdpCycle[]>(`${this.baseUrl}/cycles`));
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
