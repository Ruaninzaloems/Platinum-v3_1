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
import { Cycle, NotificationConfig } from '@core/models/domain.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-notification-config-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule],
  template: `
    <h2 mat-dialog-title>{{ data.entity ? 'Edit' : 'Create' }} Notification Rule</h2>
    <form (ngSubmit)="save()" #f="ngForm">
      <mat-dialog-content class="content">
        <mat-form-field appearance="outline"><mat-label>Event Type</mat-label><input matInput [(ngModel)]="model.eventType" name="event" required placeholder="e.g. submission.due" /></mat-form-field>
        <div class="grid">
          <mat-form-field appearance="outline"><mat-label>Days Before</mat-label><input matInput type="number" [(ngModel)]="model.daysBefore" name="dbefore" /></mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="model.isActive" name="active">
              <mat-option [value]="true">Active</mat-option><mat-option [value]="false">Inactive</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <div class="toggles">
          <mat-slide-toggle [(ngModel)]="model.isEmail" name="email">Email</mat-slide-toggle>
          <mat-slide-toggle [(ngModel)]="model.isInApp" name="inapp">In-app</mat-slide-toggle>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="saving() || f.invalid">{{ saving() ? 'Saving…' : 'Save' }}</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`.content { display:flex; flex-direction: column; gap: 4px; padding-top: 12px !important; min-width: 460px; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; } mat-form-field { width: 100%; } .toggles { display: flex; gap: 24px; padding: 8px 4px; }`],
})
export class NotificationConfigDialogComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  saving = signal(false);
  model: { cycleId: number; eventType: string; daysBefore: number; isEmail: boolean; isInApp: boolean; isActive: boolean };
  constructor(
    public ref: MatDialogRef<NotificationConfigDialogComponent, NotificationConfig | null>,
    @Inject(MAT_DIALOG_DATA) public data: { entity: NotificationConfig | null; cycleId: number },
  ) {
    const e = data.entity;
    this.model = {
      cycleId: e?.cycleId ?? data.cycleId,
      eventType: e?.eventType ?? '',
      daysBefore: e?.daysBefore ?? 7,
      isEmail: e?.isEmail ?? true,
      isInApp: e?.isInApp ?? true,
      isActive: e?.isActive ?? true,
    };
  }
  save() {
    this.saving.set(true);
    const id = this.data.entity?.id;
    const obs = id ? this.api.patch<NotificationConfig>(`/notification-configs/${id}`, this.model) : this.api.post<NotificationConfig>(`/notification-configs`, this.model);
    obs.pipe(
      tap((r) => { this.toast.success('Saved'); this.ref.close(r); }),
      catchError((e) => { this.toast.error('Save failed', e?.error?.message ?? e?.message); return of(null); }),
      finalize(() => this.saving.set(false)),
    ).subscribe();
  }
}

@Component({
  selector: 'app-notification-config',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, PageHeaderComponent, StatusBadgeComponent, LoadingSpinnerComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <app-page-header title="Notification Settings" subtitle="Configure event-based notifications and reminders." icon="settings" tone="slate">
        <button mat-flat-button color="primary" *ngIf="activeCycle()" (click)="open(null)"><mat-icon>add</mat-icon> Add Rule</button>
      </app-page-header>
      <div class="plat-card">
        <app-loading-spinner *ngIf="loading()"></app-loading-spinner>
        <ng-container *ngIf="!loading()">
          <app-empty-state *ngIf="!activeCycle()" icon="event" title="No active cycle" message="Create a performance cycle first."></app-empty-state>
          <table *ngIf="activeCycle()" class="plat-table">
            <thead><tr><th>Event Type</th><th>Days Before</th><th>Channels</th><th>Status</th><th class="actions">Actions</th></tr></thead>
            <tbody>
              <tr *ngIf="rows().length === 0"><td colspan="5" class="empty">No notification rules configured.</td></tr>
              <tr *ngFor="let r of rows()">
                <td class="mono">{{ r.eventType }}</td>
                <td>{{ r.daysBefore }}</td>
                <td>
                  <span *ngIf="r.isEmail" class="chan">Email</span>
                  <span *ngIf="r.isInApp" class="chan">In-app</span>
                  <span *ngIf="!r.isEmail && !r.isInApp" class="muted">—</span>
                </td>
                <td><app-status-badge [status]="r.isActive ? 'Active' : 'Inactive'"></app-status-badge></td>
                <td class="actions"><button mat-button color="primary" (click)="open(r)"><mat-icon>edit</mat-icon> Edit</button></td>
              </tr>
            </tbody>
          </table>
        </ng-container>
      </div>
    </section>
  `,
  styles: [`.chan { display: inline-block; padding: 2px 8px; margin-right: 4px; background: #eff6ff; color: #1e40af; border-radius: 999px; font-size: 11px; font-weight: 600; }`],
})
export class NotificationConfigComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  loading = signal(true); rows = signal<NotificationConfig[]>([]);
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
        this.api.get<NotificationConfig[]>('/notification-configs', { cycleId: active.id }).pipe(
          tap((r) => this.rows.set(Array.isArray(r) ? r : [])),
          catchError(() => { this.rows.set([]); return of(null); }),
          finalize(() => this.loading.set(false)),
        ).subscribe();
      }),
    ).subscribe();
  }
  open(entity: NotificationConfig | null) {
    const cycle = this.activeCycle(); if (!cycle) return;
    this.dialog.open(NotificationConfigDialogComponent, { data: { entity, cycleId: cycle.id }, panelClass: 'plat-dialog', autoFocus: false })
      .afterClosed().subscribe((r) => { if (r) this.load(); });
  }
}
