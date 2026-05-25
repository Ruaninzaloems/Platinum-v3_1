import { Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { Cycle } from '@core/models/domain.model';

@Injectable({ providedIn: 'root' })
export class CycleStore {
  private readonly api = inject(ApiService);

  readonly cycles = toSignal(
    this.api.get<Cycle[]>('/cycles').pipe(catchError(() => of<Cycle[]>([]))),
    { initialValue: [] as Cycle[] },
  );

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
