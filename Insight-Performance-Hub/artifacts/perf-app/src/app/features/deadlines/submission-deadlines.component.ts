import { ChangeDetectionStrategy, Component, Inject, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
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
import { Cycle, SubmissionDeadline } from '@core/models/domain.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-deadline-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ data.entity ? 'Edit' : 'Create' }} Submission Deadline</h2>
    <form (ngSubmit)="save()" #f="ngForm">
      <mat-dialog-content class="content">
        <div class="grid">
          <mat-form-field appearance="outline">
            <mat-label>Quarter</mat-label>
            <mat-select [(ngModel)]="model.quarter" name="quarter" required [disabled]="!!data.entity">
              <mat-option [value]="1">Q1</mat-option><mat-option [value]="2">Q2</mat-option>
              <mat-option [value]="3">Q3</mat-option><mat-option [value]="4">Q4</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Deadline Date</mat-label><input matInput type="date" [(ngModel)]="model.deadlineDate" name="due" required /></mat-form-field>
        </div>
        <div class="grid">
          <mat-form-field appearance="outline"><mat-label>Reminder (days before)</mat-label><input matInput type="number" [(ngModel)]="model.reminderDaysBefore" name="rem" /></mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="model.isActive" name="active">
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
  styles: [`.content { display:flex; flex-direction: column; gap: 4px; padding-top: 12px !important; min-width: 460px; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; } mat-form-field { width: 100%; }`],
})
export class DeadlineDialogComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  saving = signal(false);
  model: { cycleId: number; quarter: number; deadlineDate: string; reminderDaysBefore: number; isActive: boolean };
  constructor(public ref: MatDialogRef<DeadlineDialogComponent, SubmissionDeadline | null>, @Inject(MAT_DIALOG_DATA) public data: { entity: SubmissionDeadline | null; cycleId: number }) {
    const e = data.entity;
    this.model = {
      cycleId: e?.cycleId ?? data.cycleId,
      quarter: e?.quarter ?? 1,
      deadlineDate: (e?.deadlineDate ?? '').toString().split('T')[0] ?? '',
      reminderDaysBefore: e?.reminderDaysBefore ?? 7,
      isActive: e?.isActive ?? true,
    };
  }
  save() {
    this.saving.set(true);
    const id = this.data.entity?.id;
    const payload = id
      ? { deadlineDate: this.model.deadlineDate, reminderDaysBefore: this.model.reminderDaysBefore, isActive: this.model.isActive }
      : this.model;
    const obs = id ? this.api.patch<SubmissionDeadline>(`/submission-deadlines/${id}`, payload) : this.api.post<SubmissionDeadline>(`/submission-deadlines`, payload);
    obs.pipe(
      tap((r) => { this.toast.success('Saved'); this.ref.close(r); }),
      catchError((e) => { this.toast.error('Save failed', e?.error?.message ?? e?.message); return of(null); }),
      finalize(() => this.saving.set(false)),
    ).subscribe();
  }
}

@Component({
  selector: 'app-submission-deadlines',
  standalone: true,
  imports: [CommonModule, DatePipe, MatButtonModule, MatIconModule, PageHeaderComponent, StatusBadgeComponent, LoadingSpinnerComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <app-page-header title="Submission Deadlines" subtitle="Cutoff dates for quarterly performance submissions." icon="event" tone="orange">
        <button mat-flat-button color="primary" *ngIf="activeCycle()" (click)="open(null)"><mat-icon>add</mat-icon> Add Deadline</button>
      </app-page-header>
      <div class="plat-card">
        <app-loading-spinner *ngIf="loading()"></app-loading-spinner>
        <ng-container *ngIf="!loading()">
          <app-empty-state *ngIf="!activeCycle()" icon="event" title="No active cycle" message="Create a performance cycle first."></app-empty-state>
          <table *ngIf="activeCycle()" class="plat-table">
            <thead><tr><th>Quarter</th><th>Deadline Date</th><th>Reminder</th><th>Status</th><th class="actions">Actions</th></tr></thead>
            <tbody>
              <tr *ngIf="rows().length === 0"><td colspan="5" class="empty">No deadlines configured.</td></tr>
              <tr *ngFor="let r of rows()">
                <td class="mono">Q{{ r.quarter }}</td>
                <td>{{ r.deadlineDate | date:'dd MMM yyyy' }}</td>
                <td class="muted">{{ r.reminderDaysBefore || 0 }} days before</td>
                <td><app-status-badge [status]="r.isActive ? 'Active' : 'Inactive'"></app-status-badge></td>
                <td class="actions"><button mat-button color="primary" (click)="open(r)"><mat-icon>edit</mat-icon> Edit</button></td>
              </tr>
            </tbody>
          </table>
        </ng-container>
      </div>
    </section>
  `,
})
export class SubmissionDeadlinesComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  loading = signal(true);
  rows = signal<SubmissionDeadline[]>([]);
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
        this.api.get<SubmissionDeadline[]>('/submission-deadlines', { cycleId: active.id }).pipe(
          tap((r) => this.rows.set((Array.isArray(r) ? r : []).slice().sort((a, b) => a.quarter - b.quarter))),
          catchError(() => { this.rows.set([]); return of(null); }),
          finalize(() => this.loading.set(false)),
        ).subscribe();
      }),
    ).subscribe();
  }
  open(entity: SubmissionDeadline | null) {
    const cycle = this.activeCycle(); if (!cycle) return;
    this.dialog.open(DeadlineDialogComponent, { data: { entity, cycleId: cycle.id }, panelClass: 'plat-dialog', autoFocus: false })
      .afterClosed().subscribe((r) => { if (r) this.load(); });
  }
}
