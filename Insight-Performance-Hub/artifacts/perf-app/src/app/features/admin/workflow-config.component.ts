import { ChangeDetectionStrategy, Component, Inject, OnInit, inject, signal } from '@angular/core';
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
import { ScorecardType, WorkflowConfig } from '@core/models/domain.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-workflow-step-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ data.entity ? 'Edit' : 'Add' }} Workflow Step</h2>
    <form (ngSubmit)="save()" #f="ngForm">
      <mat-dialog-content class="content">
        <mat-form-field appearance="outline">
          <mat-label>Scorecard Type</mat-label>
          <mat-select [(ngModel)]="model.scorecardTypeId" name="stype">
            <mat-option [value]="null">— Applies to all scorecard types —</mat-option>
            <mat-option *ngFor="let s of data.scorecardTypes" [value]="s.id">{{ s.name }}</mat-option>
          </mat-select>
        </mat-form-field>
        <div class="grid">
          <mat-form-field appearance="outline"><mat-label>Step Name</mat-label><input matInput [(ngModel)]="model.stepName" name="sname" required placeholder="e.g. Line Manager Review" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Step Order</mat-label><input matInput type="number" [(ngModel)]="model.stepOrder" name="ord" required /></mat-form-field>
        </div>
        <mat-form-field appearance="outline"><mat-label>Required Role</mat-label><input matInput [(ngModel)]="model.requiredRole" name="role" required placeholder="e.g. line_manager" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Description</mat-label><textarea matInput [(ngModel)]="model.description" name="desc" rows="2"></textarea></mat-form-field>
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
  styles: [`.content { display:flex; flex-direction: column; gap: 4px; padding-top: 12px !important; min-width: 460px; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; } mat-form-field { width: 100%; }`],
})
export class WorkflowStepDialogComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  saving = signal(false);
  model: { scorecardTypeId: number | null; stepName: string; stepOrder: number; requiredRole: string; description: string; isActive: boolean };
  constructor(
    public ref: MatDialogRef<WorkflowStepDialogComponent, WorkflowConfig | null>,
    @Inject(MAT_DIALOG_DATA) public data: { entity: WorkflowConfig | null; scorecardTypes: ScorecardType[] },
  ) {
    const e = data.entity;
    this.model = {
      scorecardTypeId: e?.scorecardTypeId ?? null,
      stepName: e?.stepName ?? '',
      stepOrder: e?.stepOrder ?? 1,
      requiredRole: e?.requiredRole ?? '',
      description: e?.description ?? '',
      isActive: e?.isActive ?? true,
    };
  }
  save() {
    this.saving.set(true);
    const id = this.data.entity?.id;
    const payload = {
      scorecardTypeId: this.model.scorecardTypeId ?? undefined,
      stepName: this.model.stepName,
      stepOrder: this.model.stepOrder,
      requiredRole: this.model.requiredRole,
      description: this.model.description || undefined,
      isActive: this.model.isActive,
    };
    const obs = id ? this.api.put<WorkflowConfig>(`/workflow-configs/${id}`, payload) : this.api.post<WorkflowConfig>(`/workflow-configs`, payload);
    obs.pipe(
      tap((r) => { this.toast.success('Saved'); this.ref.close(r); }),
      catchError((e) => { this.toast.error('Save failed', e?.error?.message ?? e?.message); return of(null); }),
      finalize(() => this.saving.set(false)),
    ).subscribe();
  }
}

@Component({
  selector: 'app-workflow-config',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, PageHeaderComponent, StatusBadgeComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <app-page-header title="Workflow Configuration" subtitle="Define approval steps for performance workflows." icon="tune" tone="indigo">
        <button mat-flat-button color="primary" (click)="open(null)"><mat-icon>add</mat-icon> Add Step</button>
      </app-page-header>
      <div class="plat-card">
        <app-loading-spinner *ngIf="loading()"></app-loading-spinner>
        <table *ngIf="!loading()" class="plat-table">
          <thead><tr><th>Scorecard Type</th><th>#</th><th>Step Name</th><th>Required Role</th><th>Description</th><th>Status</th><th class="actions">Actions</th></tr></thead>
          <tbody>
            <tr *ngIf="rows().length === 0"><td colspan="7" class="empty">No workflow steps configured.</td></tr>
            <tr *ngFor="let r of rows()">
              <td>{{ scorecardTypeName(r.scorecardTypeId) }}</td>
              <td>{{ r.stepOrder }}</td>
              <td><strong>{{ r.stepName }}</strong></td>
              <td class="mono">{{ r.requiredRole }}</td>
              <td class="muted">{{ r.description || '—' }}</td>
              <td><app-status-badge [status]="r.isActive ? 'Active' : 'Inactive'"></app-status-badge></td>
              <td class="actions">
                <button mat-button color="primary" (click)="open(r)"><mat-icon>edit</mat-icon> Edit</button>
                <button mat-icon-button color="warn" (click)="remove(r)"><mat-icon>delete</mat-icon></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class WorkflowConfigComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  loading = signal(true);
  rows = signal<WorkflowConfig[]>([]);
  scorecardTypes = signal<ScorecardType[]>([]);

  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true);
    forkJoin({
      rows: this.api.get<WorkflowConfig[]>('/workflow-configs').pipe(catchError(() => of([] as WorkflowConfig[]))),
      stypes: this.api.get<ScorecardType[]>('/scorecard-types').pipe(catchError(() => of([] as ScorecardType[]))),
    }).pipe(
      tap(({ rows, stypes }) => {
        this.scorecardTypes.set(Array.isArray(stypes) ? stypes : []);
        const list = (Array.isArray(rows) ? rows : []).slice().sort((a, b) =>
          (a.scorecardTypeId ?? 0) - (b.scorecardTypeId ?? 0) || a.stepOrder - b.stepOrder,
        );
        this.rows.set(list);
      }),
      finalize(() => this.loading.set(false)),
    ).subscribe();
  }
  scorecardTypeName(id: number | null | undefined): string {
    if (!id) return 'All';
    return this.scorecardTypes().find((s) => s.id === id)?.name ?? `#${id}`;
  }
  open(entity: WorkflowConfig | null) {
    this.dialog.open(WorkflowStepDialogComponent, { data: { entity, scorecardTypes: this.scorecardTypes() }, panelClass: 'plat-dialog', autoFocus: false })
      .afterClosed().subscribe((r) => { if (r) this.load(); });
  }
  async remove(r: WorkflowConfig) {
    const ok = await this.confirm.confirm({ title: 'Delete Workflow Step', message: `Delete step "${r.stepName}"? It will be marked inactive.`, destructive: true, confirmLabel: 'Delete' });
    if (!ok) return;
    this.api.delete(`/workflow-configs/${r.id}`).pipe(
      tap(() => { this.toast.success('Step deleted'); this.load(); }),
      catchError((e) => { this.toast.error('Delete failed', e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }
}
