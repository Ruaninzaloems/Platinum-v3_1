import { Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, EMPTY, expand, map, switchMap, timer } from 'rxjs';
import { ApiService } from '@ins-core/services/api.service';
import { Cycle } from '@ins-core/models/domain.model';

// ApiService.get() already retries the first request a few times over ~7.5s. If a cold-start /
// DB blip outlasts that window, the request settles as a failure and - without this - the
// dropdown would stay empty until the user manually reloads the page. These retries pick the
// fetch back up in the background every 5s (up to 6 times, ~30s) so it self-heals instead.
const CYCLES_RETRY_DELAY_MS = 5000;
const CYCLES_MAX_BACKGROUND_RETRIES = 6;

type CyclesFetchResult = { cycles: Cycle[]; failed: boolean };

@Injectable({ providedIn: 'root' })
export class CycleStore {
  private readonly api = inject(ApiService);

  private fetchCyclesOnce() {
    return this.api.get<Cycle[]>('/cycles').pipe(
      map((cycles): CyclesFetchResult => ({ cycles, failed: false })),
      catchError(() => of<CyclesFetchResult>({ cycles: [], failed: true })),
    );
  }

  private readonly result = toSignal(
    this.fetchCyclesOnce().pipe(
      expand((result, attempt) =>
        result.failed && attempt < CYCLES_MAX_BACKGROUND_RETRIES
          ? timer(CYCLES_RETRY_DELAY_MS).pipe(switchMap(() => this.fetchCyclesOnce()))
          : EMPTY,
      ),
    ),
    { initialValue: { cycles: [] as Cycle[], failed: false } as CyclesFetchResult },
  );

  readonly cycles = computed(() => this.result().cycles);

  // `null` selection + auto=true means "use the first/open cycle by default".
  // Once the user picks anything (a real id or explicitly "Select Cycle"),
  // auto switches off so a null choice is honoured as no-cycle state.
  private readonly selected = signal<number | null>(null);
  private readonly auto = signal<boolean>(true);

  readonly cycleId = computed<number | null>(() => {
    if (!this.auto()) return this.selected();
    const list = this.cycles();
    const open = list.find((c) => c.status === 'Open');
    if (open) return open.id;
    const first = list[0];
    return first ? first.id : null;
  });

  setCycle(id: number | null) {
    this.selected.set(id);
    this.auto.set(false);
  }
}

export type DashboardPeriod = 'q1' | 'q2' | 'q3' | 'q4' | 'mid_year' | 'annual';

export const PERIOD_OPTIONS: ReadonlyArray<{ value: DashboardPeriod; label: string }> = [
  { value: 'q1', label: 'Q1 (Jul–Sep)' },
  { value: 'q2', label: 'Q2 (Oct–Dec)' },
  { value: 'q3', label: 'Q3 (Jan–Mar)' },
  { value: 'q4', label: 'Q4 (Apr–Jun)' },
  { value: 'mid_year', label: 'Mid-Year' },
  { value: 'annual', label: 'Annual' },
];

// Global dashboard period selection. Defaults to Q1 — the dashboard always
// starts from Quarter 1, and the user can then filter to Q2/Q3/Q4, Mid-Year
// or Annual. Drives every dashboard tab's data fetches.
@Injectable({ providedIn: 'root' })
export class PeriodStore {
  readonly period = signal<DashboardPeriod>('q1');

  setPeriod(p: DashboardPeriod) {
    this.period.set(p);
  }
}
