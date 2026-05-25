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
import { Cycle, ProgressStatus } from '@core/models/domain.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-progress-status-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ data.entity ? 'Edit' : 'Create' }} Progress Status</h2>
    <form (ngSubmit)="save()" #f="ngForm">
      <mat-dialog-content class="content">
        <div class="grid">
          <mat-form-field appearance="outline"><mat-label>Code</mat-label><input matInput [(ngModel)]="model.code" name="code" required placeholder="e.g. on-track" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput [(ngModel)]="model.name" name="name" required placeholder="e.g. On Track" /></mat-form-field>
        </div>
        <div class="grid">
          <mat-form-field appearance="outline"><mat-label>Color (hex)</mat-label><input matInput [(ngModel)]="model.color" name="color" required placeholder="#16a34a" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Sort Order</mat-label><input matInput type="number" [(ngModel)]="model.sortOrder" name="sort" /></mat-form-field>
        </div>
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="model.isActive" name="active">
            <mat-option [value]="true">Active</mat-option><mat-option [value]="false">Inactive</mat-option>
          </mat-select>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="saving() || f.invalid">{{ saving() ? 'Saving…' : 'Save' }}</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`.content { display:flex; flex-direction: column; gap: 4px; padding-top: 12px !important; min-width: 420px; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; } mat-form-field { width: 100%; }`],
})
export class ProgressStatusDialogComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  saving = signal(false);
  model: { code: string; name: string; color: string; cycleId: number; sortOrder: number; isActive: boolean };
  constructor(
    public ref: MatDialogRef<ProgressStatusDialogComponent, ProgressStatus | null>,
    @Inject(MAT_DIALOG_DATA) public data: { entity: ProgressStatus | null; cycleId: number },
  ) {
    const e = data.entity;
    this.model = { code: e?.code ?? '', name: e?.name ?? '', color: e?.color ?? '#1d4ed8', cycleId: e?.cycleId ?? data.cycleId, sortOrder: e?.sortOrder ?? 0, isActive: e?.isActive ?? true };
  }
  save() {
    this.saving.set(true);
    const id = this.data.entity?.id;
    const payload = id
      ? { name: this.model.name, code: this.model.code, color: this.model.color, sortOrder: this.model.sortOrder, isActive: this.model.isActive }
      : this.model;
    const obs = id ? this.api.patch<ProgressStatus>(`/progress-statuses/${id}`, payload) : this.api.post<ProgressStatus>(`/progress-statuses`, payload);
    obs.pipe(
      tap((r) => { this.toast.success('Saved'); this.ref.close(r); }),
      catchError((e) => { this.toast.error('Save failed', e?.error?.message ?? e?.message); return of(null); }),
      finalize(() => this.saving.set(false)),
    ).subscribe();
  }
}

@Component({
  selector: 'app-progress-statuses',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, PageHeaderComponent, StatusBadgeComponent, LoadingSpinnerComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <app-page-header title="Progress Statuses" subtitle="Configure the achievement statuses applied to KPIs." icon="flag" tone="green">
        <button mat-flat-button color="primary" *ngIf="activeCycle()" (click)="open(null)"><mat-icon>add</mat-icon> Add Status</button>
      </app-page-header>
      <div class="plat-card">
        <app-loading-spinner *ngIf="loading()"></app-loading-spinner>
        <ng-container *ngIf="!loading()">
          <app-empty-state *ngIf="!activeCycle()" icon="event" title="No active cycle" message="Create a performance cycle first."></app-empty-state>
          <table *ngIf="activeCycle()" class="plat-table">
            <thead><tr><th>Code</th><th>Name</th><th>Color</th><th>Sort</th><th>Status</th><th class="actions">Actions</th></tr></thead>
            <tbody>
              <tr *ngIf="rows().length === 0"><td colspan="6" class="empty">No statuses defined.</td></tr>
              <tr *ngFor="let r of rows()">
                <td class="mono">{{ r.code }}</td>
                <td><strong>{{ r.name }}</strong></td>
                <td><span class="swatch" [style.background]="r.color"></span> <span class="muted">{{ r.color }}</span></td>
                <td>{{ r.sortOrder }}</td>
                <td><app-status-badge [status]="r.isActive ? 'Active' : 'Inactive'"></app-status-badge></td>
                <td class="actions"><button mat-button color="primary" (click)="open(r)"><mat-icon>edit</mat-icon> Edit</button></td>
              </tr>
            </tbody>
          </table>
        </ng-container>
      </div>
    </section>
  `,
  styles: [`.swatch { display: inline-block; width: 14px; height: 14px; border-radius: 3px; border: 1px solid #e2e8f0; margin-right: 6px; vertical-align: middle; }`],
})
export class ProgressStatusesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  loading = signal(true); rows = signal<ProgressStatus[]>([]);
  cycles = signal<Cycle[]>([]);
  activeCycle = computed<Cycle | null>(() => this.cycles().find((c) => c.status === 'Open') ?? this.cycles()[0] ?? null);

  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true);
    forkJoin({
      cycles: this.api.get<Cycle[]>('/cycles').pipe(catchError(() => of([] as Cycle[]))),
    }).pipe(
      tap(({ cycles }) => {
        this.cycles.set(Array.isArray(cycles) ? cycles : []);
        const active = this.activeCycle();
        if (!active) { this.rows.set([]); this.loading.set(false); return; }
        this.api.get<ProgressStatus[]>('/progress-statuses', { cycleId: active.id }).pipe(
          tap((r) => this.rows.set(Array.isArray(r) ? r : [])),
          catchError(() => { this.rows.set([]); return of(null); }),
          finalize(() => this.loading.set(false)),
        ).subscribe();
      }),
    ).subscribe();
  }
  open(entity: ProgressStatus | null) {
    const cycle = this.activeCycle(); if (!cycle) return;
    this.dialog.open(ProgressStatusDialogComponent, { data: { entity, cycleId: cycle.id }, panelClass: 'plat-dialog', autoFocus: false })
      .afterClosed().subscribe((r) => { if (r) this.load(); });
  }
}
