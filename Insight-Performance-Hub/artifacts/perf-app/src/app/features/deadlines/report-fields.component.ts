import { ChangeDetectionStrategy, Component, Inject, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { catchError, finalize, forkJoin, of, tap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import { ConfirmService } from '@core/services/confirm.service';
import { Cycle, ReportField, ReportFieldFieldType, ReportFieldReportType } from '@core/models/domain.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-report-field-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule],
  template: `
    <h2 mat-dialog-title>{{ data.entity ? 'Edit' : 'Create' }} Report Field</h2>
    <form (ngSubmit)="save()" #f="ngForm">
      <mat-dialog-content class="content">
        <div class="grid">
          <mat-form-field appearance="outline">
            <mat-label>Report Type</mat-label>
            <mat-select [(ngModel)]="model.reportType" name="rtype" required>
              <mat-option value="quarterly">Quarterly</mat-option>
              <mat-option value="midYear">Mid-Year</mat-option>
              <mat-option value="annual">Annual</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Field Type</mat-label>
            <mat-select [(ngModel)]="model.fieldType" name="ftype" required>
              <mat-option value="text">Text</mat-option>
              <mat-option value="number">Number</mat-option>
              <mat-option value="date">Date</mat-option>
              <mat-option value="boolean">Yes/No</mat-option>
              <mat-option value="textarea">Textarea</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <div class="grid">
          <mat-form-field appearance="outline"><mat-label>Field Name</mat-label><input matInput [(ngModel)]="model.fieldName" name="fname" required placeholder="e.g. variance_explanation" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Field Label</mat-label><input matInput [(ngModel)]="model.fieldLabel" name="flabel" required placeholder="e.g. Variance Explanation" /></mat-form-field>
        </div>
        <div class="grid">
          <mat-form-field appearance="outline"><mat-label>Sort Order</mat-label><input matInput type="number" [(ngModel)]="model.sortOrder" name="sort" /></mat-form-field>
          <div class="toggle"><mat-slide-toggle [(ngModel)]="model.isRequired" name="req">Required</mat-slide-toggle></div>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="saving() || f.invalid">{{ saving() ? 'Saving…' : 'Save' }}</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`.content { display:flex; flex-direction: column; gap: 4px; padding-top: 12px !important; min-width: 480px; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; } mat-form-field { width: 100%; } .toggle { display: flex; align-items: center; padding: 12px 4px; }`],
})
export class ReportFieldDialogComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  saving = signal(false);
  model: { cycleId: number; reportType: ReportFieldReportType; fieldName: string; fieldLabel: string; fieldType: ReportFieldFieldType; isRequired: boolean; sortOrder: number };
  constructor(
    public ref: MatDialogRef<ReportFieldDialogComponent, ReportField | null>,
    @Inject(MAT_DIALOG_DATA) public data: { entity: ReportField | null; cycleId: number },
  ) {
    const e = data.entity;
    this.model = {
      cycleId: e?.cycleId ?? data.cycleId,
      reportType: e?.reportType ?? 'quarterly',
      fieldName: e?.fieldName ?? '',
      fieldLabel: e?.fieldLabel ?? '',
      fieldType: e?.fieldType ?? 'text',
      isRequired: e?.isRequired ?? false,
      sortOrder: e?.sortOrder ?? 0,
    };
  }
  save() {
    this.saving.set(true);
    const id = this.data.entity?.id;
    const obs = id ? this.api.patch<ReportField>(`/report-fields/${id}`, this.model) : this.api.post<ReportField>(`/report-fields`, this.model);
    obs.pipe(
      tap((r) => { this.toast.success('Saved'); this.ref.close(r); }),
      catchError((e) => { this.toast.error('Save failed', e?.error?.message ?? e?.message); return of(null); }),
      finalize(() => this.saving.set(false)),
    ).subscribe();
  }
}

@Component({
  selector: 'app-report-fields',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <app-page-header title="Report Fields" subtitle="Configurable fields used in performance reports." icon="description" tone="purple">
        <button mat-flat-button color="primary" *ngIf="activeCycle()" (click)="open(null)"><mat-icon>add</mat-icon> Add Field</button>
      </app-page-header>
      <div class="plat-card">
        <app-loading-spinner *ngIf="loading()"></app-loading-spinner>
        <ng-container *ngIf="!loading()">
          <app-empty-state *ngIf="!activeCycle()" icon="event" title="No active cycle" message="Create a performance cycle first."></app-empty-state>
          <table *ngIf="activeCycle()" class="plat-table">
            <thead><tr><th>Report Type</th><th>Field Name</th><th>Label</th><th>Type</th><th>Required</th><th>Order</th><th class="actions">Actions</th></tr></thead>
            <tbody>
              <tr *ngIf="rows().length === 0"><td colspan="7" class="empty">No report fields defined.</td></tr>
              <tr *ngFor="let r of rows()">
                <td class="mono">{{ r.reportType }}</td>
                <td class="mono">{{ r.fieldName }}</td>
                <td><strong>{{ r.fieldLabel }}</strong></td>
                <td>{{ r.fieldType }}</td>
                <td>{{ r.isRequired ? 'Yes' : 'No' }}</td>
                <td>{{ r.sortOrder }}</td>
                <td class="actions">
                  <button mat-button color="primary" (click)="open(r)"><mat-icon>edit</mat-icon> Edit</button>
                  <button mat-icon-button color="warn" (click)="remove(r)"><mat-icon>delete</mat-icon></button>
                </td>
              </tr>
            </tbody>
          </table>
        </ng-container>
      </div>
    </section>
  `,
})
export class ReportFieldsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  loading = signal(true); rows = signal<ReportField[]>([]);
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
        this.api.get<ReportField[]>('/report-fields', { cycleId: active.id }).pipe(
          tap((r) => this.rows.set(Array.isArray(r) ? r : [])),
          catchError(() => { this.rows.set([]); return of(null); }),
          finalize(() => this.loading.set(false)),
        ).subscribe();
      }),
    ).subscribe();
  }
  open(entity: ReportField | null) {
    const cycle = this.activeCycle(); if (!cycle) return;
    this.dialog.open(ReportFieldDialogComponent, { data: { entity, cycleId: cycle.id }, panelClass: 'plat-dialog', autoFocus: false })
      .afterClosed().subscribe((r) => { if (r) this.load(); });
  }
  async remove(r: ReportField) {
    const ok = await this.confirm.confirm({ title: 'Delete Report Field', message: `Delete "${r.fieldLabel}"? This cannot be undone.`, destructive: true, confirmLabel: 'Delete' });
    if (!ok) return;
    this.api.delete(`/report-fields/${r.id}`).pipe(
      tap(() => { this.toast.success('Field deleted'); this.load(); }),
      catchError((e) => { this.toast.error('Delete failed', e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }
}
