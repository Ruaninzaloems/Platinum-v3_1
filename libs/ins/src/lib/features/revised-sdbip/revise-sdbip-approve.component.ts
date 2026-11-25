import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { ApiService } from '@ins-core/services/api.service';
import { ToastService } from '@ins-core/services/toast.service';
import { Cycle, KpiQuarterTarget, Scorecard, ScorecardKpi } from '@ins-core/models/domain.model';
import { User } from '@ins-core/models/user.model';
import { PageHeaderComponent } from '@ins-shared/components/page-header/page-header.component';

const STATUS_TONE: Record<string, string> = {
  Draft: 'tone-slate',
  Submitted: 'tone-blue',
  Reviewed: 'tone-amber',
  Approved: 'tone-green',
};

interface QuarterTarget extends KpiQuarterTarget {
  baselineTargetValue?: string | null;
  revisionReason?: string | null;
}

// ─── Return reason dialog ──────────────────────────────────────────────────
@Component({
  selector: 'app-approve-return-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Return Revised Scorecard to Draft</h2>
    <mat-dialog-content class="content">
      <mat-form-field appearance="outline">
        <mat-label>Reason for Return *</mat-label>
        <textarea matInput rows="4" [(ngModel)]="reason" name="r" placeholder="Explain what needs correction..."></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Cancel</button>
      <button mat-flat-button color="warn" type="button" [disabled]="!reason.trim()" (click)="ref.close(reason.trim())">Return to Draft</button>
    </mat-dialog-actions>
  `,
  styles: [`.content { min-width: 480px; padding-top: 12px !important; } mat-form-field { width: 100%; }`],
})
export class ApproveReturnDialogComponent {
  reason = '';
  constructor(public ref: MatDialogRef<ApproveReturnDialogComponent, string | null>) {}
}

// ─── KPI approval card (lazy-loads quarter targets on expand) ───────────────
@Component({
  selector: 'app-revision-kpi-approval-card',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="review-card">
      <div class="rc-head">
        <div class="rc-main">
          <div class="rc-tags">
            <span class="rc-num">{{ kpi().kpiNumber }}</span>
            <span class="badge" [ngClass]="statusTone[kpi().status] || 'tone-slate'">{{ kpi().status }}</span>
          </div>
          <p class="rc-desc">{{ kpi().description }}</p>
          <div class="rc-meta">
            <span>Weight: {{ kpi().weighting }}%</span>
            <span>Annual Target: {{ kpi().annualTarget }}</span>
            <span>Responsible: {{ responsibleName() }}</span>
          </div>
        </div>
        <div class="rc-actions">
          <button mat-flat-button color="primary" type="button" *ngIf="kpi().status === 'Reviewed'" [disabled]="processing()" (click)="approve.emit()">
            <mat-icon>check_circle</mat-icon> Approve
          </button>
          <span class="status-ok green" *ngIf="kpi().status === 'Approved'"><mat-icon>check_circle</mat-icon> Approved</span>
          <button mat-button type="button" (click)="toggle()">{{ expanded() ? 'Collapse' : 'Details' }}</button>
        </div>
      </div>

      <div class="rc-expand" *ngIf="expanded() && targets().length">
        <div class="target-grid">
          <div *ngFor="let q of [1,2,3,4]" class="tg" [class.rev]="hasRevision(q)">
            <div class="q">Q{{ q }}</div>
            <div class="val">{{ targetFor(q)?.targetValue ?? '—' }}</div>
            <ng-container *ngIf="hasRevision(q)">
              <div class="was">Was: {{ targetFor(q)?.baselineTargetValue }}</div>
              <div class="reason" *ngIf="targetFor(q)?.revisionReason">Reason: {{ targetFor(q)?.revisionReason }}</div>
            </ng-container>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./revised-sdbip.shared.scss'],
})
export class RevisionKpiApprovalCardComponent {
  private readonly api = inject(ApiService);
  readonly statusTone = STATUS_TONE;

  kpi = input.required<ScorecardKpi>();
  responsibleName = input<string>('—');
  processing = input<boolean>(false);

  expanded = signal(false);
  targets = signal<QuarterTarget[]>([]);

  approve = output<void>();

  toggle() {
    const next = !this.expanded();
    this.expanded.set(next);
    if (next && !this.targets().length) {
      this.api.get<QuarterTarget[]>(`/scorecard-kpis/${this.kpi().id}/quarter-targets`).pipe(
        catchError(() => of([] as QuarterTarget[])),
      ).subscribe((r) => this.targets.set(Array.isArray(r) ? r : []));
    }
  }

  targetFor(q: number): QuarterTarget | undefined {
    return this.targets().find((t) => t.quarter === q);
  }

  hasRevision(q: number): boolean {
    const t = this.targetFor(q);
    return !!(t?.isApprovedBaseline && t?.baselineTargetValue && t.targetValue !== t.baselineTargetValue);
  }
}

// ─── Main Approve Page ─────────────────────────────────────────────────────
@Component({
  selector: 'app-revise-sdbip-approve',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    PageHeaderComponent, RevisionKpiApprovalCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './revise-sdbip-approve.component.html',
  styleUrls: ['./revised-sdbip.shared.scss'],
})
export class ReviseSdbipApproveComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  readonly statusTone = STATUS_TONE;

  cycles = signal<Cycle[]>([]);
  users = signal<User[]>([]);
  allScorecards = signal<Scorecard[]>([]);
  kpis = signal<ScorecardKpi[]>([]);

  selectedCycleId = signal<number | null>(null);
  selectedScorecardId = signal<number | null>(null);
  approvalComments = signal('');
  processing = signal(false);

  effectiveCycleId = computed<number | null>(() => this.selectedCycleId() ?? this.cycles()[0]?.id ?? null);

  scorecards = computed<Scorecard[]>(() =>
    this.allScorecards().filter((s) => s.scorecardType === 'revised' && s.status === 'Reviewed'));

  selectedScorecard = computed<Scorecard | undefined>(() =>
    this.allScorecards().find((s) => s.id === this.selectedScorecardId()));

  approvedKpis = computed<ScorecardKpi[]>(() => this.kpis().filter((k) => k.status === 'Approved'));
  reviewedKpis = computed<ScorecardKpi[]>(() => this.kpis().filter((k) => k.status === 'Reviewed'));
  allKpisApproved = computed<boolean>(() => this.kpis().length > 0 && this.kpis().every((k) => k.status === 'Approved'));

  ngOnInit() {
    forkJoin({
      cycles: this.api.get<Cycle[]>('/cycles').pipe(catchError(() => of([] as Cycle[]))),
      users: this.api.get<User[]>('/auth/users').pipe(catchError(() => of([] as User[]))),
    }).subscribe(({ cycles, users }) => {
      this.cycles.set(Array.isArray(cycles) ? cycles : []);
      this.users.set(Array.isArray(users) ? users : []);
      this.loadScorecards();
    });
  }

  onCycle(id: number) {
    this.selectedCycleId.set(id);
    this.loadScorecards();
  }

  loadScorecards() {
    const cycleId = this.effectiveCycleId();
    if (!cycleId) { this.allScorecards.set([]); return; }
    this.api.get<Scorecard[]>('/scorecards', { cycleId }).pipe(
      catchError(() => of([] as Scorecard[])),
    ).subscribe((r) => this.allScorecards.set(Array.isArray(r) ? r : []));
  }

  loadKpis(scorecardId: number) {
    this.api.get<ScorecardKpi[]>(`/scorecards/${scorecardId}/kpis`).pipe(
      catchError(() => of([] as ScorecardKpi[])),
    ).subscribe((r) => this.kpis.set(Array.isArray(r) ? r : []));
  }

  getUserName(id: number | null | undefined): string {
    if (!id) return '—';
    const u = this.users().find((x) => x.id === id);
    return u ? u.displayName : `User #${id}`;
  }

  openScorecard(sc: Scorecard) {
    this.selectedScorecardId.set(sc.id);
    this.approvalComments.set('');
    this.loadKpis(sc.id);
  }

  back() {
    this.selectedScorecardId.set(null);
    this.approvalComments.set('');
    this.loadScorecards();
  }

  approveKpi(kpiId: number) {
    this.processing.set(true);
    this.api.post(`/scorecard-kpis/${kpiId}/transition`, { action: 'approve', comments: '' }).pipe(
      catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? 'Failed to approve KPI'); return of(null); }),
      finalize(() => this.processing.set(false)),
    ).subscribe((res) => {
      if (res !== null) {
        this.toast.success('KPI Approved');
        const id = this.selectedScorecardId();
        if (id) this.loadKpis(id);
      }
    });
  }

  approveAllKpis() {
    const unapproved = this.reviewedKpis();
    if (!unapproved.length) return;
    this.processing.set(true);
    forkJoin(unapproved.map((k) => this.api.post(`/scorecard-kpis/${k.id}/transition`, { action: 'approve', comments: '' }))).pipe(
      catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? 'Failed to approve KPIs'); return of(null); }),
      finalize(() => this.processing.set(false)),
    ).subscribe((res) => {
      if (res !== null) {
        this.toast.success(`${unapproved.length} KPI(s) approved`);
        const id = this.selectedScorecardId();
        if (id) this.loadKpis(id);
      }
    });
  }

  approveScorecard() {
    const id = this.selectedScorecardId();
    if (!id) return;
    this.processing.set(true);
    this.api.post(`/scorecards/${id}/transition`, { action: 'approve', comments: this.approvalComments() }).pipe(
      catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? 'Failed to approve'); return of(null); }),
      finalize(() => this.processing.set(false)),
    ).subscribe((res) => {
      if (res !== null) {
        this.toast.success('Revised SDBIP Approved', 'The revised scorecard has been approved. New targets are now baselined.');
        this.back();
      }
    });
  }

  openReturnDialog() {
    this.dialog.open(ApproveReturnDialogComponent, { panelClass: 'plat-dialog', autoFocus: true })
      .afterClosed().subscribe((reason) => { if (reason) this.returnScorecard(reason); });
  }

  private returnScorecard(reason: string) {
    const id = this.selectedScorecardId();
    if (!id) return;
    this.processing.set(true);
    this.api.post(`/scorecards/${id}/transition`, { action: 'return', comments: reason }).pipe(
      catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? 'Failed to return'); return of(null); }),
      finalize(() => this.processing.set(false)),
    ).subscribe((res) => {
      if (res !== null) { this.toast.success('Revised SDBIP returned to Draft'); this.back(); }
    });
  }

  trackById(_: number, x: { id: number }): number { return x.id; }
}
