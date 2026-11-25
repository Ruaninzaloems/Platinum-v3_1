import { ChangeDetectionStrategy, Component, Inject, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { catchError, finalize, forkJoin, of, tap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import { Cycle, Scorecard } from '@core/models/domain.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

export interface SdbipItem {
  id: number;
  cycleId: number;
  kpiId?: number | null;
  description: string;
  status: string;
  q1Target?: string | null;
  q2Target?: string | null;
  q3Target?: string | null;
  q4Target?: string | null;
}

export interface SdbipRevision {
  id: number;
  sdbipItemId: number;
  revisionNumber: number;
  status: string;
  reason: string;
  previousQ1Target?: string | null; newQ1Target?: string | null;
  previousQ2Target?: string | null; newQ2Target?: string | null;
  previousQ3Target?: string | null; newQ3Target?: string | null;
  previousQ4Target?: string | null; newQ4Target?: string | null;
}

interface QuarterForm { q1Target: string; q2Target: string; q3Target: string; q4Target: string; }
interface EditFormData { description: string; q1Target: string; q2Target: string; q3Target: string; q4Target: string; }
interface ReviseFormData extends QuarterForm { reason: string; }

// ─── New Item Dialog ───────────────────────────────────────────────────────
@Component({
  selector: 'app-new-sdbip-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>New SDBIP Item</h2>
    <mat-dialog-content class="content">
      <mat-form-field appearance="outline">
        <mat-label>Description</mat-label>
        <textarea matInput rows="4" [(ngModel)]="description" name="d" required></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" type="button"
              [disabled]="!description.trim()"
              (click)="ref.close(description.trim())">Create</button>
    </mat-dialog-actions>
  `,
  styles: [`.content { min-width: 460px; padding-top: 12px !important; } mat-form-field { width: 100%; }`],
})
export class NewSdbipDialogComponent {
  description = '';
  constructor(public ref: MatDialogRef<NewSdbipDialogComponent, string | null>) {}
}

// ─── Edit Item Dialog ──────────────────────────────────────────────────────
@Component({
  selector: 'app-edit-sdbip-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Edit SDBIP Item</h2>
    <mat-dialog-content class="content">
      <mat-form-field appearance="outline" class="full">
        <mat-label>Description *</mat-label>
        <textarea matInput rows="3" [(ngModel)]="form.description" name="desc" required></textarea>
      </mat-form-field>
      <div class="grid">
        <mat-form-field appearance="outline"><mat-label>Q1 Target</mat-label><input matInput [(ngModel)]="form.q1Target" name="q1" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Q2 Target</mat-label><input matInput [(ngModel)]="form.q2Target" name="q2" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Q3 Target</mat-label><input matInput [(ngModel)]="form.q3Target" name="q3" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Q4 Target</mat-label><input matInput [(ngModel)]="form.q4Target" name="q4" /></mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" type="button"
              [disabled]="!form.description.trim()"
              (click)="ref.close(form)">Save Changes</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .content { min-width: 520px; padding-top: 12px !important; }
    .full, mat-form-field { width: 100%; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  `],
})
export class EditSdbipDialogComponent {
  form: EditFormData;
  constructor(
    public ref: MatDialogRef<EditSdbipDialogComponent, EditFormData | null>,
    @Inject(MAT_DIALOG_DATA) data: EditFormData,
  ) { this.form = { ...data }; }
}

// ─── Revise Item Dialog ────────────────────────────────────────────────────
@Component({
  selector: 'app-revise-sdbip-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Revise SDBIP Item</h2>
    <mat-dialog-content class="content">
      <mat-form-field appearance="outline" class="full">
        <mat-label>Reason for revision *</mat-label>
        <textarea matInput rows="3" [(ngModel)]="form.reason" name="reason" required></textarea>
      </mat-form-field>
      <div class="grid">
        <mat-form-field appearance="outline"><mat-label>Q1 Target</mat-label><input matInput [(ngModel)]="form.q1Target" name="q1" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Q2 Target</mat-label><input matInput [(ngModel)]="form.q2Target" name="q2" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Q3 Target</mat-label><input matInput [(ngModel)]="form.q3Target" name="q3" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Q4 Target</mat-label><input matInput [(ngModel)]="form.q4Target" name="q4" /></mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" type="button"
              [disabled]="!form.reason.trim()"
              (click)="ref.close(form)">Submit Revision</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .content { min-width: 520px; padding-top: 12px !important; }
    .full, mat-form-field { width: 100%; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  `],
})
export class ReviseSdbipDialogComponent {
  form: ReviseFormData = { reason: '', q1Target: '', q2Target: '', q3Target: '', q4Target: '' };
  constructor(public ref: MatDialogRef<ReviseSdbipDialogComponent, ReviseFormData | null>) {}
}

// ─── Revisions History Dialog ──────────────────────────────────────────────
@Component({
  selector: 'app-sdbip-revisions-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, StatusBadgeComponent],
  template: `
    <h2 mat-dialog-title>Revision History</h2>
    <mat-dialog-content class="content">
      <ng-container *ngIf="data.revisions.length > 0; else empty">
        <div *ngFor="let rev of data.revisions" class="rev">
          <div class="rev-head">
            <span class="rev-num">Revision #{{ rev.revisionNumber }}</span>
            <app-status-badge [status]="rev.status"></app-status-badge>
          </div>
          <p class="reason">{{ rev.reason }}</p>
          <div class="grid">
            <span>Q1: {{ rev.previousQ1Target || '—' }} <mat-icon class="arr">arrow_forward</mat-icon> {{ rev.newQ1Target || '—' }}</span>
            <span>Q2: {{ rev.previousQ2Target || '—' }} <mat-icon class="arr">arrow_forward</mat-icon> {{ rev.newQ2Target || '—' }}</span>
            <span>Q3: {{ rev.previousQ3Target || '—' }} <mat-icon class="arr">arrow_forward</mat-icon> {{ rev.newQ3Target || '—' }}</span>
            <span>Q4: {{ rev.previousQ4Target || '—' }} <mat-icon class="arr">arrow_forward</mat-icon> {{ rev.newQ4Target || '—' }}</span>
          </div>
        </div>
      </ng-container>
      <ng-template #empty>
        <p class="empty-msg">No revisions recorded</p>
      </ng-template>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .content { min-width: 520px; max-height: 60vh; }
    .rev { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
    .rev-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .rev-num { font-size: 12px; font-weight: 700; color: #475569; letter-spacing: .03em; text-transform: uppercase; }
    .reason { margin: 4px 0 8px; color: #334155; font-size: 13px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; font-size: 12px; color: #64748b; }
    .arr { font-size: 12px; width: 12px; height: 12px; vertical-align: middle; }
    .empty-msg { text-align: center; color: #64748b; padding: 24px 0; }
  `],
})
export class SdbipRevisionsDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { revisions: SdbipRevision[] }) {}
}

// ─── Main Page ─────────────────────────────────────────────────────────────
@Component({
  selector: 'app-sdbip-overview',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatSelectModule, MatTooltipModule,
    PageHeaderComponent, LoadingSpinnerComponent, StatusBadgeComponent, EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sdbip-overview.component.html',
  styleUrls: ['./sdbip-overview.component.scss'],
})
export class SdbipOverviewComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  loading = signal(true);
  cycles = signal<Cycle[]>([]);
  items = signal<SdbipItem[]>([]);
  scorecards = signal<Scorecard[]>([]);
  selectedCycleId = signal<number | null>(null);

  effectiveCycleId = computed<number | null>(() => this.selectedCycleId() ?? this.cycles()[0]?.id ?? null);

  approvedScorecards = computed<Scorecard[]>(() =>
    this.scorecards().filter((s) => s.status === 'Approved'),
  );

  readonly statusCards: { key: string; label: string }[] = [
    { key: 'Draft', label: 'Draft' },
    { key: 'Approved Baseline', label: 'Approved Baseline' },
    { key: 'In-Year Monitoring', label: 'In-Year Monitoring' },
    { key: 'Final Approved Revision', label: 'Final Approved Revision' },
  ];

  countByStatus(status: string): number {
    return this.items().filter((i) => i.status === status).length;
  }

  ngOnInit() {
    this.api.get<Cycle[]>('/cycles').pipe(
      catchError(() => of([] as Cycle[])),
      tap((cs) => this.cycles.set(Array.isArray(cs) ? cs : [])),
    ).subscribe(() => this.loadForCycle());
  }

  selectCycle(id: number) {
    this.selectedCycleId.set(id);
    this.loadForCycle();
  }

  loadForCycle() {
    const cycleId = this.effectiveCycleId();
    if (!cycleId) {
      this.items.set([]); this.scorecards.set([]); this.loading.set(false);
      return;
    }
    this.loading.set(true);
    forkJoin({
      items: this.api.get<SdbipItem[]>('/sdbip-items', { cycleId }).pipe(catchError(() => of([] as SdbipItem[]))),
      scorecards: this.api.get<Scorecard[]>('/scorecards', { cycleId }).pipe(catchError(() => of([] as Scorecard[]))),
    }).pipe(
      finalize(() => this.loading.set(false)),
    ).subscribe(({ items, scorecards }) => {
      this.items.set(Array.isArray(items) ? items : []);
      this.scorecards.set(Array.isArray(scorecards) ? scorecards : []);
    });
  }

  refreshItems() {
    const cycleId = this.effectiveCycleId();
    if (!cycleId) return;
    this.api.get<SdbipItem[]>('/sdbip-items', { cycleId }).pipe(
      catchError(() => of([] as SdbipItem[])),
      tap((r) => this.items.set(Array.isArray(r) ? r : [])),
    ).subscribe();
  }

  // ── Actions ─────────────────────────────────────────────────────────────
  openNew() {
    const cycleId = this.effectiveCycleId();
    if (!cycleId) { this.toast.error('No cycle available'); return; }
    this.dialog.open(NewSdbipDialogComponent, { panelClass: 'plat-dialog', autoFocus: true })
      .afterClosed().subscribe((description) => {
        if (!description) return;
        this.api.post<SdbipItem>('/sdbip-items', { cycleId, description }).pipe(
          tap(() => { this.toast.success('SDBIP item created'); this.refreshItems(); }),
          catchError((e) => { this.toast.error('Error creating item', e?.error?.message ?? e?.message); return of(null); }),
        ).subscribe();
      });
  }

  openEdit(item: SdbipItem) {
    const data: EditFormData = {
      description: item.description ?? '',
      q1Target: item.q1Target ?? '',
      q2Target: item.q2Target ?? '',
      q3Target: item.q3Target ?? '',
      q4Target: item.q4Target ?? '',
    };
    this.dialog.open(EditSdbipDialogComponent, { panelClass: 'plat-dialog', data, autoFocus: true })
      .afterClosed().subscribe((res) => {
        if (!res || !res.description.trim()) return;
        const payload: Partial<SdbipItem> = {
          description: res.description,
          q1Target: res.q1Target || undefined,
          q2Target: res.q2Target || undefined,
          q3Target: res.q3Target || undefined,
          q4Target: res.q4Target || undefined,
        };
        this.api.patch<SdbipItem>(`/sdbip-items/${item.id}`, payload).pipe(
          tap(() => { this.toast.success('SDBIP item updated'); this.refreshItems(); }),
          catchError((e) => { this.toast.error('Error updating', e?.error?.message ?? e?.message); return of(null); }),
        ).subscribe();
      });
  }

  openRevise(item: SdbipItem) {
    this.dialog.open(ReviseSdbipDialogComponent, { panelClass: 'plat-dialog', autoFocus: true })
      .afterClosed().subscribe((res) => {
        if (!res || !res.reason.trim()) return;
        const payload = {
          reason: res.reason,
          q1Target: res.q1Target || undefined,
          q2Target: res.q2Target || undefined,
          q3Target: res.q3Target || undefined,
          q4Target: res.q4Target || undefined,
        };
        this.api.post<SdbipItem>(`/sdbip-items/${item.id}/revise`, payload).pipe(
          tap(() => { this.toast.success('SDBIP item revised'); this.refreshItems(); }),
          catchError((e) => { this.toast.error('Error', e?.error?.message ?? e?.message); return of(null); }),
        ).subscribe();
      });
  }

  openRevisions(item: SdbipItem) {
    this.api.get<SdbipRevision[]>(`/sdbip-items/${item.id}/revisions`).pipe(
      catchError(() => of([] as SdbipRevision[])),
    ).subscribe((revs) => {
      const revisions = Array.isArray(revs) ? revs : [];
      this.dialog.open(SdbipRevisionsDialogComponent, {
        panelClass: 'plat-dialog',
        data: { revisions },
      });
    });
  }

  transition(item: SdbipItem, action: string) {
    this.api.post(`/sdbip-items/${item.id}/transition`, { action }).pipe(
      tap(() => { this.toast.success(`SDBIP ${action}`); this.refreshItems(); }),
      catchError((e) => { this.toast.error('Transition failed', e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }

  generateFromScorecard(scorecardId: number) {
    this.api.post<SdbipItem[]>('/sdbip/generate', { scorecardId }).pipe(
      tap((result) => {
        const count = Array.isArray(result) ? result.length : 0;
        this.toast.success(`${count} SDBIP items generated`);
        this.refreshItems();
      }),
      catchError((e) => { this.toast.error('Generate failed', e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }

  trackById(_: number, x: { id: number }): number { return x.id; }
}
