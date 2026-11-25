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
import { ApiService } from '@ins-core/services/api.service';
import { ToastService } from '@ins-core/services/toast.service';
import { Cycle, DataType, UnitOfMeasure } from '@ins-core/models/domain.model';
import { PageHeaderComponent } from '@ins-shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '@ins-shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '@ins-shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '@ins-shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-uom-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ data.entity ? 'Edit' : 'Create' }} Unit of Measure</h2>
    <form (ngSubmit)="save()" #f="ngForm">
      <mat-dialog-content class="content">
        <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput [(ngModel)]="model.name" name="name" required placeholder="e.g. Percentage" /></mat-form-field>
        <div class="grid">
          <mat-form-field appearance="outline">
            <mat-label>Data Type</mat-label>
            <mat-select [(ngModel)]="model.dataTypeId" name="dataType">
              <mat-option [value]="null">None</mat-option>
              <mat-option *ngFor="let dt of data.dataTypes" [value]="dt.id">{{ dt.name }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="model.isActive" name="status">
              <mat-option [value]="true">Active</mat-option><mat-option [value]="false">Inactive</mat-option>
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
  styles: [`.content { display:flex; flex-direction: column; gap: 4px; padding-top: 12px !important; min-width: 380px; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; } mat-form-field { width: 100%; }`],
})
export class UomDialogComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  saving = signal(false);
  model: { name: string; dataTypeId: number | null; cycleId: number; isActive: boolean };
  constructor(
    public ref: MatDialogRef<UomDialogComponent, UnitOfMeasure | null>,
    @Inject(MAT_DIALOG_DATA) public data: { entity: UnitOfMeasure | null; cycleId: number; dataTypes: DataType[] },
  ) {
    const e = data.entity;
    this.model = { name: e?.name ?? '', dataTypeId: e?.dataTypeId ?? null, cycleId: e?.cycleId ?? data.cycleId, isActive: e?.isActive ?? true };
  }
  save() {
    this.saving.set(true);
    const id = this.data.entity?.id;
    const obs = id
      ? this.api.patch<UnitOfMeasure>(`/units-of-measure/${id}`, { name: this.model.name, dataTypeId: this.model.dataTypeId, isActive: this.model.isActive })
      : this.api.post<UnitOfMeasure>(`/units-of-measure`, this.model);
    obs.pipe(
      tap((r) => { this.toast.success('Saved'); this.ref.close(r); }),
      catchError((e) => { this.toast.error('Save failed', e?.error?.message ?? e?.message); return of(null); }),
      finalize(() => this.saving.set(false)),
    ).subscribe();
  }
}

@Component({
  selector: 'app-units-of-measure',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, PageHeaderComponent, StatusBadgeComponent, LoadingSpinnerComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <app-page-header title="Units of Measure" subtitle="Standard units for KPI measurement." icon="bar_chart" tone="cyan">
        <button mat-flat-button color="primary" *ngIf="activeCycle()" (click)="open(null)"><mat-icon>add</mat-icon> Add Unit</button>
      </app-page-header>
      <div class="plat-card">
        <app-loading-spinner *ngIf="loading()"></app-loading-spinner>
        <ng-container *ngIf="!loading()">
          <app-empty-state *ngIf="!activeCycle()" icon="event" title="No active cycle" message="Create a performance cycle first."></app-empty-state>
          <table *ngIf="activeCycle()" class="plat-table uom-table">
            <thead><tr><th class="name-col">Name</th><th class="dt-col">Data Type</th><th class="status-col">Status</th><th class="actions">Actions</th><th class="filler"></th></tr></thead>
            <tbody>
              <tr *ngIf="rows().length === 0"><td colspan="5" class="empty">No units defined.</td></tr>
              <tr *ngFor="let r of rows()">
                <td><strong>{{ r.name }}</strong></td>
                <td class="dt-cell">{{ dataTypeName(r.dataTypeId) }}</td>
                <td><app-status-badge [status]="r.isActive ? 'Active' : 'Inactive'"></app-status-badge></td>
                <td class="actions"><button type="button" class="edit-btn" (click)="open(r)"><mat-icon>edit</mat-icon> Edit</button></td>
                <td class="filler"></td>
              </tr>
            </tbody>
          </table>
        </ng-container>
      </div>
    </section>
  `,
  styles: [`
    app-page-header { display: block; max-width: 640px; }
    app-page-header ::ng-deep .page-header { padding: 10px 16px; border-radius: 12px; }
    app-page-header ::ng-deep .page-header__icon { width: 34px; height: 34px; border-radius: 8px; }
    app-page-header ::ng-deep .page-header__icon mat-icon { font-size: 19px; width: 19px; height: 19px; }
    app-page-header ::ng-deep h1 { font-size: 16px; }
    app-page-header ::ng-deep p { font-size: 12px; margin-top: 2px; }
    .plat-card { padding: 0; overflow: hidden; max-width: 640px; }
    .uom-table {
      th { padding: 6px 12px; font-size: 10px; }
      td { padding: 4px 12px; font-size: 12px; }
      table-layout: fixed;
      .name-col { width: 180px; }
      .dt-col { width: 140px; }
      .status-col { width: 100px; }
      th.actions, td.actions { width: 80px; text-align: left; }
      .filler { width: auto; }
      .dt-cell { color: #475569; }
      td strong { font-weight: 600; }
    }
    .edit-btn {
      display: inline-flex; align-items: center; gap: 4px;
      border: none; background: transparent; color: #1d4ed8; font-size: 12px; font-weight: 600;
      padding: 4px 8px; border-radius: 6px; cursor: pointer;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
      &:hover { background: #eff6ff; }
    }
  `],
})
export class UnitsOfMeasureComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  loading = signal(true); rows = signal<UnitOfMeasure[]>([]);
  cycles = signal<Cycle[]>([]);
  dataTypes = signal<DataType[]>([]);
  activeCycle = computed<Cycle | null>(() => this.cycles().find((c) => c.status === 'Open') ?? this.cycles()[0] ?? null);

  dataTypeName(id: number | null | undefined): string {
    if (id == null) return '—';
    return this.dataTypes().find((d) => d.id === id)?.name ?? '—';
  }

  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true);
    forkJoin({
      cycles: this.api.get<Cycle[]>('/cycles').pipe(catchError(() => of([] as Cycle[]))),
      dataTypes: this.api.get<DataType[]>('/data-types').pipe(catchError(() => of([] as DataType[]))),
    }).pipe(
      tap(({ cycles, dataTypes }) => {
        this.dataTypes.set(Array.isArray(dataTypes) ? dataTypes : []);
        this.cycles.set(Array.isArray(cycles) ? cycles : []);
        const active = this.activeCycle();
        if (!active) { this.rows.set([]); this.loading.set(false); return; }
        this.api.get<UnitOfMeasure[]>('/units-of-measure', { cycleId: active.id }).pipe(
          tap((r) => this.rows.set(Array.isArray(r) ? r : [])),
          catchError(() => { this.rows.set([]); return of(null); }),
          finalize(() => this.loading.set(false)),
        ).subscribe();
      }),
    ).subscribe();
  }
  open(entity: UnitOfMeasure | null) {
    const cycle = this.activeCycle(); if (!cycle) return;
    this.dialog.open(UomDialogComponent, { data: { entity, cycleId: cycle.id, dataTypes: this.dataTypes().filter((d) => d.isActive) }, panelClass: 'plat-dialog', autoFocus: false })
      .afterClosed().subscribe((r) => { if (r) this.load(); });
  }
}
