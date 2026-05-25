import { ChangeDetectionStrategy, Component, Inject, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { catchError, finalize, forkJoin, of, tap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import { ConfirmService } from '@core/services/confirm.service';
import { Cycle, NkpaScope, NkpaWeighting } from '@core/models/domain.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-nkpa-weighting-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ data.entity ? 'Edit' : 'Create' }} NKPA Weighting</h2>
    <form (ngSubmit)="save()" #f="ngForm">
      <mat-dialog-content class="content">
        <mat-form-field appearance="outline"><mat-label>NKPA Name</mat-label><input matInput [(ngModel)]="model.nkpaName" name="n" required placeholder="e.g. Service Delivery" /></mat-form-field>
        <div class="grid">
          <mat-form-field appearance="outline"><mat-label>Weight (%)</mat-label><input matInput type="number" step="0.1" [(ngModel)]="model.weight" name="w" required /></mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Scope</mat-label>
            <mat-select [(ngModel)]="model.scope" name="s">
              <mat-option value="organisational">Organisational</mat-option>
              <mat-option value="departmental">Departmental</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="saving() || f.invalid">{{ saving() ? 'Saving…' : 'Save' }}</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`.content { display:flex; flex-direction: column; gap: 4px; padding-top: 12px !important; min-width: 460px; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; } mat-form-field { width: 100%; }`],
})
export class NkpaWeightingDialogComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  saving = signal(false);
  model: { nkpaName: string; weight: number; scope: NkpaScope };
  constructor(
    public ref: MatDialogRef<NkpaWeightingDialogComponent, NkpaWeighting | null>,
    @Inject(MAT_DIALOG_DATA) public data: { entity: NkpaWeighting | null; cycleId: number },
  ) {
    const e = data.entity;
    this.model = { nkpaName: e?.nkpaName ?? '', weight: e?.weight ?? 0, scope: e?.scope ?? 'organisational' };
  }
  save() {
    this.saving.set(true);
    const payload = { nkpaName: this.model.nkpaName, weight: Number(this.model.weight), scope: this.model.scope, cycleId: this.data.cycleId, departmentId: null };
    const id = this.data.entity?.id;
    const obs = id ? this.api.patch<NkpaWeighting>(`/nkpa-weightings/${id}`, payload) : this.api.post<NkpaWeighting>('/nkpa-weightings', payload);
    obs.pipe(
      tap((r) => { this.toast.success('Saved'); this.ref.close(r); }),
      catchError((e) => { this.toast.error('Save failed', e?.error?.message ?? e?.message); return of(null); }),
      finalize(() => this.saving.set(false)),
    ).subscribe();
  }
}

@Component({
  selector: 'app-nkpa-weightings',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, PageHeaderComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <app-page-header title="NKPA Weightings" subtitle="National Key Performance Area weightings must total 100%." icon="bar_chart" tone="cyan">
        <button mat-flat-button color="primary" (click)="open(null)" [disabled]="!activeCycle()"><mat-icon>add</mat-icon> Add Weighting</button>
      </app-page-header>

      <app-loading-spinner *ngIf="loading()"></app-loading-spinner>

      <ng-container *ngIf="!loading()">
        <div class="plat-card weight-card">
          <div class="weight-card__head">
            <h3>Organisational Scope</h3>
            <span class="total" [class.bad]="!isHundred(orgTotal())">Total: {{ orgTotal().toFixed(1) }}%</span>
          </div>
          <table class="plat-table">
            <thead><tr><th>NKPA Name</th><th>Weight</th><th class="actions">Actions</th></tr></thead>
            <tbody>
              <tr *ngIf="orgRows().length === 0"><td colspan="3" class="empty">No weightings defined.</td></tr>
              <tr *ngFor="let w of orgRows()">
                <td><strong>{{ w.nkpaName }}</strong></td>
                <td><div class="bar"><div class="bar__fill" [style.width.%]="clamp(w.weight)"></div></div><span class="pct">{{ w.weight }}%</span></td>
                <td class="actions">
                  <button mat-icon-button color="primary" (click)="open(w)"><mat-icon>edit</mat-icon></button>
                  <button mat-icon-button color="warn" (click)="remove(w)"><mat-icon>delete</mat-icon></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="plat-card weight-card">
          <div class="weight-card__head">
            <h3>Departmental Scope</h3>
            <span class="total" [class.bad]="!isHundred(deptTotal())">Total: {{ deptTotal().toFixed(1) }}%</span>
          </div>
          <table class="plat-table">
            <thead><tr><th>NKPA Name</th><th>Weight</th><th class="actions">Actions</th></tr></thead>
            <tbody>
              <tr *ngIf="deptRows().length === 0"><td colspan="3" class="empty">No weightings defined.</td></tr>
              <tr *ngFor="let w of deptRows()">
                <td><strong>{{ w.nkpaName }}</strong></td>
                <td><div class="bar"><div class="bar__fill" [style.width.%]="clamp(w.weight)"></div></div><span class="pct">{{ w.weight }}%</span></td>
                <td class="actions">
                  <button mat-icon-button color="primary" (click)="open(w)"><mat-icon>edit</mat-icon></button>
                  <button mat-icon-button color="warn" (click)="remove(w)"><mat-icon>delete</mat-icon></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </ng-container>
    </section>
  `,
  styles: [`
    .weight-card { margin-bottom: 16px; overflow: hidden; }
    .weight-card__head { display: flex; justify-content: space-between; align-items: center; padding: 12px 18px; background: var(--plat-surface-2, #f8fafc); border-bottom: 1px solid var(--plat-border); }
    .weight-card__head h3 { margin: 0; font-size: 14px; font-weight: 700; color: var(--plat-text); }
    .total { font-size: 13px; font-weight: 700; color: #16a34a; }
    .total.bad { color: #ef4444; }
    .bar { display: inline-block; width: 100px; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; vertical-align: middle; margin-right: 10px; }
    .bar__fill { height: 100%; background: var(--plat-primary, #0f2b46); }
    .pct { font-weight: 600; color: #475569; vertical-align: middle; }
  `],
})
export class NkpaWeightingsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  loading = signal(true);
  cycles = signal<Cycle[]>([]);
  rows = signal<NkpaWeighting[]>([]);
  activeCycle = computed<Cycle | null>(() => this.cycles().find((c) => c.status === 'Open') ?? this.cycles()[0] ?? null);
  orgRows = computed(() => this.rows().filter((w) => w.scope === 'organisational'));
  deptRows = computed(() => this.rows().filter((w) => w.scope === 'departmental'));
  orgTotal = computed(() => this.orgRows().reduce((s, w) => s + Number(w.weight), 0));
  deptTotal = computed(() => this.deptRows().reduce((s, w) => s + Number(w.weight), 0));

  ngOnInit() { this.load(); }
  isHundred(t: number) { return Math.abs(t - 100) < 0.01; }
  clamp(v: number) { return Math.max(0, Math.min(100, Number(v) || 0)); }

  load() {
    this.loading.set(true);
    this.api.get<Cycle[]>('/cycles').pipe(
      catchError(() => of([] as Cycle[])),
      tap((cs) => this.cycles.set(Array.isArray(cs) ? cs : [])),
    ).subscribe(() => {
      const cycle = this.activeCycle();
      if (!cycle) { this.rows.set([]); this.loading.set(false); return; }
      this.api.get<NkpaWeighting[]>('/nkpa-weightings', { cycleId: cycle.id }).pipe(
        catchError(() => of([] as NkpaWeighting[])),
        tap((r) => this.rows.set(Array.isArray(r) ? r : [])),
        finalize(() => this.loading.set(false)),
      ).subscribe();
    });
  }

  open(entity: NkpaWeighting | null) {
    const cycle = this.activeCycle();
    if (!cycle) return;
    this.dialog.open(NkpaWeightingDialogComponent, { data: { entity, cycleId: cycle.id }, panelClass: 'plat-dialog', autoFocus: false })
      .afterClosed().subscribe((r) => { if (r) this.load(); });
  }
  async remove(w: NkpaWeighting) {
    const ok = await this.confirm.confirm({ title: 'Delete Weighting', message: `Delete "${w.nkpaName}"?`, destructive: true, confirmLabel: 'Delete' });
    if (!ok) return;
    this.api.delete(`/nkpa-weightings/${w.id}`).pipe(
      tap(() => { this.toast.success('Deleted'); this.load(); }),
      catchError((e) => { this.toast.error('Delete failed', e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }

  // Reserved for future forkJoin multi-load expansion
  private _fj = forkJoin;
}
