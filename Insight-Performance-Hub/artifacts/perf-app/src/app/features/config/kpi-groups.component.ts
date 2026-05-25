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
import { Cycle, KpiGroup } from '@core/models/domain.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-kpi-group-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ data.entity ? 'Edit Group' : 'Create KPI Group' }}</h2>
    <form (ngSubmit)="save()" #f="ngForm">
      <mat-dialog-content class="content">
        <div class="grid">
          <mat-form-field appearance="outline"><mat-label>Code</mat-label><input matInput [(ngModel)]="model.code" name="code" required placeholder="e.g. GRP-01" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput [(ngModel)]="model.name" name="name" required placeholder="e.g. Service Delivery" /></mat-form-field>
        </div>
        <mat-form-field appearance="outline">
          <mat-label>Parent Group</mat-label>
          <mat-select [(ngModel)]="model.parentId" name="parent">
            <mat-option [value]="null">— No Parent (Root Level) —</mat-option>
            <mat-option *ngFor="let g of data.parents" [value]="g.id">{{ g.name }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="model.isActive" name="active">
            <mat-option [value]="true">Active</mat-option><mat-option [value]="false">Archived</mat-option>
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
export class KpiGroupDialogComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  saving = signal(false);
  model: { code: string; name: string; parentId: number | null; isActive: boolean; cycleId: number };
  constructor(public ref: MatDialogRef<KpiGroupDialogComponent, KpiGroup | null>, @Inject(MAT_DIALOG_DATA) public data: { entity: KpiGroup | null; cycleId: number; parents: KpiGroup[] }) {
    const e = data.entity;
    this.model = { code: e?.code ?? '', name: e?.name ?? '', parentId: e?.parentId ?? null, isActive: e?.isActive ?? true, cycleId: data.cycleId };
  }
  save() {
    this.saving.set(true);
    const id = this.data.entity?.id;
    const obs = id ? this.api.patch<KpiGroup>(`/kpi-groups/${id}`, this.model) : this.api.post<KpiGroup>(`/kpi-groups`, this.model);
    obs.pipe(
      tap((r) => { this.toast.success('Saved successfully'); this.ref.close(r); }),
      catchError((e) => { this.toast.error('Save failed', e?.error?.message ?? e?.message); return of(null); }),
      finalize(() => this.saving.set(false)),
    ).subscribe();
  }
}

@Component({
  selector: 'app-kpi-groups',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, PageHeaderComponent, StatusBadgeComponent, LoadingSpinnerComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <app-page-header title="KPI Groups" subtitle="Hierarchical grouping for performance indicators." icon="layers" tone="indigo">
        <button mat-flat-button color="primary" *ngIf="activeCycle()" (click)="open(null)">
          <mat-icon>add</mat-icon> Add Group
        </button>
      </app-page-header>
      <div class="plat-card">
        <app-loading-spinner *ngIf="loading()"></app-loading-spinner>
        <ng-container *ngIf="!loading()">
          <app-empty-state *ngIf="!activeCycle()" icon="event" title="No active cycle" message="Create a performance cycle first to manage KPI groups."></app-empty-state>
          <table *ngIf="activeCycle()" class="plat-table">
            <thead><tr><th>Code</th><th>Group Name</th><th>Parent Group</th><th>Status</th><th class="actions">Actions</th></tr></thead>
            <tbody>
              <tr *ngIf="rows().length === 0"><td colspan="5" class="empty">No groups defined.</td></tr>
              <tr *ngFor="let g of rows()">
                <td class="mono">{{ g.code }}</td>
                <td><strong>{{ g.name }}</strong></td>
                <td class="muted">{{ parentName(g.parentId) }}</td>
                <td><app-status-badge [status]="g.isActive ? 'Active' : 'Archived'"></app-status-badge></td>
                <td class="actions"><button mat-button color="primary" (click)="open(g)"><mat-icon>edit</mat-icon> Edit</button></td>
              </tr>
            </tbody>
          </table>
        </ng-container>
      </div>
    </section>
  `,
})
export class KpiGroupsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  loading = signal(true);
  rows = signal<KpiGroup[]>([]);
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
        this.api.get<KpiGroup[]>('/kpi-groups', { cycleId: active.id }).pipe(
          tap((r) => this.rows.set(Array.isArray(r) ? r : [])),
          catchError(() => { this.rows.set([]); return of(null); }),
          finalize(() => this.loading.set(false)),
        ).subscribe();
      }),
    ).subscribe();
  }
  parentName(parentId: number | null): string {
    if (!parentId) return '—';
    return this.rows().find((g) => g.id === parentId)?.name ?? '—';
  }
  open(entity: KpiGroup | null) {
    const cycle = this.activeCycle(); if (!cycle) return;
    const parents = this.rows().filter((g) => g.id !== entity?.id);
    this.dialog.open(KpiGroupDialogComponent, { data: { entity, cycleId: cycle.id, parents }, panelClass: 'plat-dialog', autoFocus: false })
      .afterClosed().subscribe((r) => { if (r) this.load(); });
  }
}
