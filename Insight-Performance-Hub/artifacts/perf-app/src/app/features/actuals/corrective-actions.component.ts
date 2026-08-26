import { ChangeDetectionStrategy, Component, Inject, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { catchError, of, tap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

interface RemedialAction {
  id: number;
  kpiId: number;
  quarter: number;
  actionDescription: string;
  dueDate: string;
  actionOwnerIds?: string | null;
  status: string;
}

interface NewActionForm {
  kpiId: number;
  quarter: number;
  actionDescription: string;
  dueDate: string;
}

interface EditActionForm {
  actionDescription: string;
  dueDate: string;
  actionOwnerIds: string;
}

// ─── New Action Dialog ─────────────────────────────────────────────────────
@Component({
  selector: 'app-new-corrective-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>New Corrective Action</h2>
    <mat-dialog-content class="content">
      <mat-form-field appearance="outline" class="full">
        <mat-label>KPI ID *</mat-label>
        <input matInput type="number" [(ngModel)]="form.kpiId" name="k" required />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Quarter</mat-label>
        <mat-select [(ngModel)]="form.quarter" name="q">
          <mat-option *ngFor="let q of [1,2,3,4]" [value]="q">Q{{ q }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Action Description *</mat-label>
        <textarea matInput rows="3" [(ngModel)]="form.actionDescription" name="d" required></textarea>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Due Date *</mat-label>
        <input matInput type="date" [(ngModel)]="form.dueDate" name="dd" required />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" type="button"
              [disabled]="!form.kpiId || !form.actionDescription.trim() || !form.dueDate"
              (click)="ref.close(form)">Create</button>
    </mat-dialog-actions>
  `,
  styles: [`.content { min-width: 460px; padding-top: 12px !important; display: flex; flex-direction: column; gap: 4px; } .full { width: 100%; }`],
})
export class NewCorrectiveDialogComponent {
  form: NewActionForm = { kpiId: 0, quarter: 1, actionDescription: '', dueDate: '' };
  constructor(public ref: MatDialogRef<NewCorrectiveDialogComponent, NewActionForm | null>) {}
}

// ─── Edit Action Dialog ────────────────────────────────────────────────────
@Component({
  selector: 'app-edit-corrective-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Edit Corrective Action</h2>
    <mat-dialog-content class="content">
      <mat-form-field appearance="outline" class="full">
        <mat-label>Action Description *</mat-label>
        <textarea matInput rows="3" [(ngModel)]="form.actionDescription" name="d" required></textarea>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Due Date *</mat-label>
        <input matInput type="date" [(ngModel)]="form.dueDate" name="dd" required />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Action Owner IDs</mat-label>
        <input matInput [(ngModel)]="form.actionOwnerIds" name="o" placeholder="Comma-separated IDs" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" type="button"
              [disabled]="!form.actionDescription.trim() || !form.dueDate"
              (click)="ref.close(form)">Save Changes</button>
    </mat-dialog-actions>
  `,
  styles: [`.content { min-width: 460px; padding-top: 12px !important; display: flex; flex-direction: column; gap: 4px; } .full { width: 100%; }`],
})
export class EditCorrectiveDialogComponent {
  form: EditActionForm;
  constructor(
    public ref: MatDialogRef<EditCorrectiveDialogComponent, EditActionForm | null>,
    @Inject(MAT_DIALOG_DATA) data: EditActionForm,
  ) { this.form = { ...data }; }
}

// ─── Main Page ─────────────────────────────────────────────────────────────
@Component({
  selector: 'app-corrective-actions',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatSelectModule,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <app-page-header title="Corrective & Remedial Actions"
                       subtitle="Track corrective actions for underperforming KPIs"
                       icon="build" tone="orange">
        <button mat-flat-button color="primary" (click)="openNew()"><mat-icon>add</mat-icon> New Action</button>
      </app-page-header>

      <div class="plat-card alert" *ngIf="overdueActions().length">
        <mat-icon>warning</mat-icon>
        <div>
          <p class="bold">{{ overdueActions().length }} Overdue Action{{ overdueActions().length > 1 ? 's' : '' }}</p>
          <p class="small">Actions past their due date requiring attention</p>
        </div>
      </div>

      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [ngModel]="statusFilter()" (ngModelChange)="onStatusFilter($event)">
            <mat-option value="all">All Statuses</mat-option>
            <mat-option value="Open">Open</mat-option>
            <mat-option value="In Progress">In Progress</mat-option>
            <mat-option value="Completed">Completed</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="list">
        <div class="plat-card action" *ngFor="let a of actions(); trackBy: trackById"
             [class.overdue-card]="isOverdue(a)">
          <div class="action-info">
            <div class="badges">
              <span class="badge" [class]="isOverdue(a) ? 'red-dark' : statusClass(a.status)">
                {{ isOverdue(a) ? 'Overdue' : a.status }}
              </span>
              <span class="badge outline">KPI #{{ a.kpiId }}</span>
              <span class="badge outline">Q{{ a.quarter }}</span>
            </div>
            <p class="desc">{{ a.actionDescription }}</p>
            <p class="muted xs"><mat-icon>schedule</mat-icon> Due: {{ a.dueDate }}</p>
          </div>
          <div class="action-buttons">
            <button mat-button *ngIf="a.status !== 'Completed'" (click)="openEdit(a)"><mat-icon>edit</mat-icon> Edit</button>
            <button mat-button *ngIf="a.status === 'Open'" (click)="updateStatus(a, 'In Progress')">Start</button>
            <button mat-button class="green" *ngIf="a.status === 'In Progress'" (click)="updateStatus(a, 'Completed')">
              <mat-icon>check_circle</mat-icon> Complete
            </button>
          </div>
        </div>

        <div class="plat-card empty" *ngIf="!actions().length">
          <mat-icon>check_circle</mat-icon>
          <p class="bold">No corrective actions</p>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .alert { display: flex; align-items: center; gap: 12px; padding: 16px; background: #fef2f2; border: 1px solid #fecaca; margin-bottom: 16px; }
    .alert mat-icon { color: #dc2626; font-size: 26px; width: 26px; height: 26px; }
    .alert .bold { color: #b91c1c; margin: 0; } .alert .small { color: #dc2626; margin: 0; font-size: 13px; }
    .filters { margin-bottom: 16px; }
    .filters mat-form-field { width: 220px; }
    .list { display: flex; flex-direction: column; gap: 12px; }
    .action { padding: 16px; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .overdue-card { border: 1px solid #fca5a5; }
    .badges { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 6px; }
    .desc { font-weight: 500; color: #1e293b; margin: 0; }
    .action-buttons { display: flex; gap: 4px; flex-shrink: 0; }
    .badge { display: inline-flex; align-items: center; gap: 2px; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge.outline { background: #fff; border: 1px solid #cbd5e1; color: #475569; }
    .badge.red { background: #fee2e2; color: #b91c1c; }
    .badge.red-dark { background: #fecaca; color: #991b1b; }
    .badge.amber { background: #fef3c7; color: #b45309; }
    .badge.green { background: #dcfce7; color: #15803d; }
    .badge.gray { background: #f1f5f9; color: #475569; }
    .green { color: #16a34a; }
    .muted { color: #64748b; } .xs { font-size: 11px; display: inline-flex; align-items: center; gap: 4px; margin: 6px 0 0; }
    .xs mat-icon { font-size: 13px; width: 13px; height: 13px; }
    .bold { font-weight: 600; }
    .empty { padding: 40px; text-align: center; color: #64748b; }
    .empty mat-icon { font-size: 40px; width: 40px; height: 40px; color: #cbd5e1; }
  `],
})
export class CorrectiveActionsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  actions = signal<RemedialAction[]>([]);
  statusFilter = signal<string>('all');

  overdueActions = computed<RemedialAction[]>(() =>
    this.actions().filter((a) => a.status !== 'Completed' && new Date(a.dueDate) < new Date()),
  );

  ngOnInit() { this.load(); }

  onStatusFilter(status: string) {
    this.statusFilter.set(status);
    this.load();
  }

  load() {
    const filter = this.statusFilter();
    const params = filter !== 'all' ? { status: filter } : undefined;
    this.api.get<RemedialAction[]>('/remedial-actions', params).pipe(
      catchError(() => of([] as RemedialAction[])),
    ).subscribe((rows) => this.actions.set(Array.isArray(rows) ? rows : []));
  }

  isOverdue(a: RemedialAction): boolean {
    return a.status !== 'Completed' && new Date(a.dueDate) < new Date();
  }

  statusClass(status: string): string {
    switch (status) {
      case 'Open': return 'red';
      case 'In Progress': return 'amber';
      case 'Completed': return 'green';
      default: return 'gray';
    }
  }

  openNew() {
    this.dialog.open(NewCorrectiveDialogComponent, { panelClass: 'plat-dialog', autoFocus: true })
      .afterClosed().subscribe((res: NewActionForm | undefined) => {
        if (!res || !res.kpiId || !res.actionDescription.trim() || !res.dueDate) return;
        this.api.post('/remedial-actions', {
          kpiId: res.kpiId,
          quarter: res.quarter,
          actionDescription: res.actionDescription,
          dueDate: res.dueDate,
        }).pipe(
          tap(() => { this.toast.success('Corrective action created'); this.load(); }),
          catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? e?.message); return of(null); }),
        ).subscribe();
      });
  }

  openEdit(action: RemedialAction) {
    const data: EditActionForm = {
      actionDescription: action.actionDescription ?? '',
      dueDate: action.dueDate ?? '',
      actionOwnerIds: action.actionOwnerIds ?? '',
    };
    this.dialog.open(EditCorrectiveDialogComponent, { panelClass: 'plat-dialog', autoFocus: true, data })
      .afterClosed().subscribe((res: EditActionForm | undefined) => {
        if (!res || !res.actionDescription.trim() || !res.dueDate) return;
        this.api.patch(`/remedial-actions/${action.id}`, {
          actionDescription: res.actionDescription,
          dueDate: res.dueDate,
          actionOwnerIds: res.actionOwnerIds || undefined,
        }).pipe(
          tap(() => { this.toast.success('Corrective action updated'); this.load(); }),
          catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? e?.message); return of(null); }),
        ).subscribe();
      });
  }

  updateStatus(action: RemedialAction, status: string) {
    this.api.patch(`/remedial-actions/${action.id}`, { status }).pipe(
      tap(() => { this.toast.success(`Status updated to ${status}`); this.load(); }),
      catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }

  trackById(_: number, x: { id: number }): number { return x.id; }
}
