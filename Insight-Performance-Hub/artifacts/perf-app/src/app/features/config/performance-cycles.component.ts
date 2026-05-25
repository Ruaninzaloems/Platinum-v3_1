import { ChangeDetectionStrategy, Component, Inject, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { catchError, finalize, of, tap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import { ConfirmService } from '@core/services/confirm.service';
import { Cycle, CycleStatus } from '@core/models/domain.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';

interface CycleForm { financialYearLabel: string; startDate: string; endDate: string; status: CycleStatus; }

@Component({
  selector: 'app-cycle-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ data.cycle ? 'Edit Cycle' : 'Create Performance Cycle' }}</h2>
    <form (ngSubmit)="save()" class="plat-form" #f="ngForm">
      <mat-dialog-content class="content">
        <mat-form-field appearance="outline">
          <mat-label>Financial Year Label</mat-label>
          <input matInput [(ngModel)]="model.financialYearLabel" name="label" required placeholder="e.g. 2024/2025" />
        </mat-form-field>
        <div class="grid">
          <mat-form-field appearance="outline">
            <mat-label>Start Date</mat-label>
            <input matInput type="date" [(ngModel)]="model.startDate" name="start" required />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>End Date</mat-label>
            <input matInput type="date" [(ngModel)]="model.endDate" name="end" required />
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="model.status" name="status">
            <mat-option value="Draft">Draft</mat-option>
            <mat-option value="Open">Open</mat-option>
            <mat-option value="Closed">Closed</mat-option>
            <mat-option value="Archived">Archived</mat-option>
          </mat-select>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="saving() || f.invalid">{{ saving() ? 'Saving…' : 'Save Changes' }}</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`.content { display: flex; flex-direction: column; gap: 4px; padding-top: 12px !important; min-width: 380px; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; } mat-form-field { width: 100%; }`],
})
export class CycleDialogComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  saving = signal(false);
  model: CycleForm;
  constructor(
    public ref: MatDialogRef<CycleDialogComponent, Cycle | null>,
    @Inject(MAT_DIALOG_DATA) public data: { cycle: Cycle | null },
  ) {
    const c = data.cycle;
    this.model = {
      financialYearLabel: c?.financialYearLabel ?? '',
      startDate: c?.startDate?.split('T')[0] ?? '',
      endDate: c?.endDate?.split('T')[0] ?? '',
      status: c?.status ?? 'Draft',
    };
  }
  save() {
    this.saving.set(true);
    const id = this.data.cycle?.id;
    const obs = id
      ? this.api.patch<Cycle>(`/cycles/${id}`, this.model)
      : this.api.post<Cycle>(`/cycles`, this.model);
    obs.pipe(
      tap((res) => { this.toast.success(`Cycle ${id ? 'updated' : 'created'} successfully`); this.ref.close(res); }),
      catchError((e) => { this.toast.error('Save failed', e?.error?.message ?? e?.message ?? 'Unknown error'); return of(null); }),
      finalize(() => this.saving.set(false)),
    ).subscribe();
  }
}

@Component({
  selector: 'app-performance-cycles',
  standalone: true,
  imports: [CommonModule, DatePipe, MatButtonModule, MatIconModule, PageHeaderComponent, StatusBadgeComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <app-page-header title="Performance Cycles" subtitle="Manage financial years and performance periods." icon="event" tone="blue">
        <button mat-flat-button color="primary" (click)="openDialog(null)">
          <mat-icon>add</mat-icon> Add Cycle
        </button>
      </app-page-header>

      <div class="plat-card">
        <app-loading-spinner *ngIf="loading()"></app-loading-spinner>
        <table *ngIf="!loading()" class="plat-table">
          <thead><tr><th>Financial Year</th><th>Start Date</th><th>End Date</th><th>Status</th><th class="actions">Actions</th></tr></thead>
          <tbody>
            <tr *ngIf="cycles().length === 0"><td colspan="5" class="empty">No cycles configured yet.</td></tr>
            <tr *ngFor="let c of cycles()">
              <td><strong>{{ c.financialYearLabel }}</strong></td>
              <td>{{ c.startDate | date:'dd MMM yyyy' }}</td>
              <td>{{ c.endDate | date:'dd MMM yyyy' }}</td>
              <td><app-status-badge [status]="c.status"></app-status-badge></td>
              <td class="actions">
                <button mat-button color="primary" (click)="openDialog(c)"><mat-icon>edit</mat-icon> Edit</button>
                <button *ngIf="c.status === 'Draft'" mat-icon-button color="warn" (click)="confirmDelete(c)" aria-label="Delete">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class PerformanceCyclesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  loading = signal(true);
  cycles = signal<Cycle[]>([]);

  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true);
    this.api.get<Cycle[]>('/cycles').pipe(
      tap((rows) => this.cycles.set(Array.isArray(rows) ? rows : [])),
      catchError(() => { this.cycles.set([]); return of(null); }),
      finalize(() => this.loading.set(false)),
    ).subscribe();
  }
  openDialog(cycle: Cycle | null) {
    const ref = this.dialog.open(CycleDialogComponent, { data: { cycle }, panelClass: 'plat-dialog', autoFocus: false });
    ref.afterClosed().subscribe((res) => { if (res) this.load(); });
  }
  async confirmDelete(c: Cycle) {
    const ok = await this.confirm.confirm({
      title: 'Delete Performance Cycle',
      message: `Are you sure you want to delete "${c.financialYearLabel}"? All linked scorecards, KPIs, actuals, and related records will be permanently removed.`,
      destructive: true, confirmLabel: 'Delete',
    });
    if (!ok) return;
    this.api.delete(`/cycles/${c.id}`).pipe(
      tap(() => { this.toast.success('Cycle deleted successfully'); this.load(); }),
      catchError((e) => { this.toast.error('Delete failed', e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }
}
