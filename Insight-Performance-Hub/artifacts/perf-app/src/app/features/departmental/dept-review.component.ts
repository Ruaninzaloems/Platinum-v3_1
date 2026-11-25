import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { catchError, finalize, of, tap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import { Cycle } from '@core/models/domain.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { DeptScorecard, DeptScorecardKpi } from './dept-scorecards.component';

@Component({
  selector: 'app-dept-return-reason-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Return Scorecard to Draft</h2>
    <mat-dialog-content class="content">
      <mat-form-field appearance="outline">
        <mat-label>Reason for Return *</mat-label>
        <textarea matInput rows="4" [(ngModel)]="reason" placeholder="Explain what needs to be corrected..."></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="warn" [disabled]="!reason.trim()" (click)="ref.close(reason.trim())">Return to Draft</button>
    </mat-dialog-actions>
  `,
  styles: [`.content { min-width: 460px; padding-top: 12px !important; } mat-form-field { width: 100%; }`],
})
export class DeptReturnReasonDialogComponent {
  reason = '';
  constructor(public ref: MatDialogRef<DeptReturnReasonDialogComponent, string | null>) {}
}

@Component({
  selector: 'app-dept-review',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatSelectModule, MatDialogModule,
    PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <app-page-header title="Review Departmental Scorecards" subtitle="Review submitted departmental scorecards — approve, return or lock" icon="find_in_page" tone="indigo">
        <mat-form-field appearance="outline" class="cpick">
          <mat-label>Cycle</mat-label>
          <mat-select [ngModel]="selectedCycleId()" (ngModelChange)="onCycle($event)">
            <mat-option *ngFor="let c of cycles()" [value]="c.id">{{ c.financialYearLabel }}</mat-option>
          </mat-select>
        </mat-form-field>
      </app-page-header>

      <app-loading-spinner *ngIf="loading()"></app-loading-spinner>

      <!-- List view -->
      <ng-container *ngIf="!loading() && !selectedScId()">
        <ng-container *ngIf="selectedCycleId(); else pickCycle">
          <div class="grid-cards" *ngIf="reviewable().length; else emptyList">
            <button type="button" class="plat-card sc-card" *ngFor="let sc of reviewable()" (click)="openSc(sc)">
              <div class="sc-head">
                <span class="sc-name">{{ sc.name }}</span>
                <span class="badge" [class]="badgeClass(sc.status)">{{ sc.status }}</span>
              </div>
              <p class="muted">{{ sc.departmentName }}</p>
            </button>
          </div>
          <ng-template #emptyList>
            <app-empty-state icon="find_in_page" title="Nothing to review"
              message="No departmental scorecards are awaiting review in this cycle. Scorecards appear here once they are submitted."></app-empty-state>
          </ng-template>
        </ng-container>
        <ng-template #pickCycle>
          <div class="empty">Select a cycle to view scorecards awaiting review.</div>
        </ng-template>
      </ng-container>

      <!-- Detail view -->
      <div class="detail" *ngIf="!loading() && selectedScId() && selectedSc() as sc">
        <div class="detail-head">
          <button mat-button type="button" (click)="back()"><mat-icon>arrow_back</mat-icon> Back</button>
          <h2>{{ sc.name }}</h2>
          <span class="badge" [class]="badgeClass(sc.status)">{{ sc.status }}</span>
          <span class="weight">Total Weighting:
            <strong [class.ok]="weightOk()" [class.bad]="!weightOk()">{{ totalWeight().toFixed(1) }}%</strong>
          </span>
        </div>

        <div class="actions">
          <ng-container *ngIf="sc.status === 'Submitted'">
            <button mat-flat-button color="primary" type="button" [disabled]="isProcessing()" (click)="transition('approve')">
              <mat-icon>check</mat-icon> Approve
            </button>
            <button mat-stroked-button type="button" [disabled]="isProcessing()" (click)="returnSc()">
              <mat-icon>arrow_back</mat-icon> Return to Draft
            </button>
          </ng-container>
          <ng-container *ngIf="sc.status === 'Approved'">
            <button mat-flat-button color="primary" type="button" [disabled]="isProcessing()" (click)="transition('lock')">
              <mat-icon>lock</mat-icon> Lock
            </button>
          </ng-container>
        </div>

        <div class="kpi-list" *ngIf="kpis().length; else emptyKpis">
          <div class="plat-card kpi-row" *ngFor="let kpi of kpis()">
            <div class="kpi-info">
              <div class="kpi-head">
                <mat-icon class="muted-icon">track_changes</mat-icon>
                <span class="kpi-num">{{ kpi.kpiNumber }}</span>
                <span class="badge inherited" *ngIf="kpi.isInherited">Inherited</span>
              </div>
              <p class="kpi-desc">{{ kpi.description }}</p>
              <div class="kpi-meta">
                <span>Target: {{ kpi.annualTarget || '—' }}</span>
                <span>Weight: {{ kpi.weighting }}%</span>
              </div>
            </div>
          </div>
        </div>
        <ng-template #emptyKpis>
          <div class="empty">This scorecard has no KPIs.</div>
        </ng-template>
      </div>
    </section>
  `,
  styles: [`
    .cpick { width: 200px; margin-right: 8px; }
    .empty { padding: 48px; text-align: center; color: #94a3b8; }
    .grid-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .sc-card { text-align: left; cursor: pointer; padding: 16px; border: 1px solid #e2e8f0; background: #fff; transition: box-shadow .15s; }
    .sc-card:hover { box-shadow: 0 4px 12px rgba(15,23,42,.08); }
    .sc-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .sc-name { font-weight: 600; font-size: 15px; color: #0f172a; }
    .muted { color: #64748b; font-size: 13px; margin: 4px 0 0; }
    .badge { padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; white-space: nowrap; }
    .b-submitted { background: #dbeafe; color: #1d4ed8; }
    .b-approved { background: #dcfce7; color: #15803d; }
    .b-locked { background: #ede9fe; color: #6d28d9; }
    .b-default { background: #f1f5f9; color: #475569; }
    .inherited { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
    .detail { display: flex; flex-direction: column; gap: 16px; }
    .detail-head { display: flex; align-items: center; gap: 12px; }
    .detail-head h2 { font-size: 18px; font-weight: 600; margin: 0; }
    .weight { margin-left: auto; font-size: 13px; color: #64748b; }
    .weight .ok { color: #16a34a; } .weight .bad { color: #dc2626; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .kpi-list { display: flex; flex-direction: column; gap: 10px; }
    .kpi-row { padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .kpi-info { flex: 1; }
    .kpi-head { display: flex; align-items: center; gap: 8px; }
    .muted-icon { color: #94a3b8; font-size: 18px; width: 18px; height: 18px; }
    .kpi-num { font-weight: 600; font-size: 14px; }
    .kpi-desc { color: #475569; font-size: 14px; margin: 4px 0; }
    .kpi-meta { display: flex; gap: 16px; font-size: 12px; color: #94a3b8; }
  `],
})
export class DeptReviewComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  loading = signal(false);
  cycles = signal<Cycle[]>([]);
  scorecards = signal<DeptScorecard[]>([]);
  kpis = signal<DeptScorecardKpi[]>([]);
  selectedCycleId = signal<number | null>(null);
  selectedScId = signal<number | null>(null);
  isProcessing = signal(false);

  reviewable = computed<DeptScorecard[]>(() =>
    this.scorecards().filter((s) => s.status === 'Submitted' || s.status === 'Approved'),
  );

  selectedSc = computed<DeptScorecard | undefined>(() =>
    this.scorecards().find((s) => s.id === this.selectedScId()),
  );

  totalWeight = computed<number>(() =>
    this.kpis().reduce((sum, k) => sum + (k.weighting || 0), 0),
  );

  weightOk = computed<boolean>(() => Math.abs(this.totalWeight() - 100) < 0.01);

  ngOnInit() {
    this.api.get<Cycle[]>('/cycles').pipe(
      catchError(() => of([] as Cycle[])),
      tap((cs) => this.cycles.set(Array.isArray(cs) ? cs : [])),
    ).subscribe();
  }

  badgeClass(status: string): string {
    switch (status) {
      case 'Submitted': return 'badge b-submitted';
      case 'Approved': return 'badge b-approved';
      case 'Locked': return 'badge b-locked';
      default: return 'badge b-default';
    }
  }

  onCycle(id: number) {
    this.selectedCycleId.set(id);
    this.selectedScId.set(null);
    this.kpis.set([]);
    this.loadScorecards();
  }

  loadScorecards() {
    const cycleId = this.selectedCycleId();
    if (!cycleId) { this.scorecards.set([]); return; }
    this.loading.set(true);
    this.api.get<DeptScorecard[]>('/dept-scorecards', { cycleId }).pipe(
      catchError(() => of([] as DeptScorecard[])),
      tap((rows) => this.scorecards.set(Array.isArray(rows) ? rows : [])),
      finalize(() => this.loading.set(false)),
    ).subscribe();
  }

  openSc(sc: DeptScorecard) {
    this.selectedScId.set(sc.id);
    this.kpis.set([]);
    this.api.get<DeptScorecardKpi[]>(`/dept-scorecards/${sc.id}/kpis`).pipe(
      catchError(() => of([] as DeptScorecardKpi[])),
    ).subscribe((rows) => this.kpis.set(Array.isArray(rows) ? rows : []));
  }

  back() {
    this.selectedScId.set(null);
    this.kpis.set([]);
  }

  transition(action: 'approve' | 'lock' | 'return', comments?: string) {
    const id = this.selectedScId();
    if (!id) return;
    this.isProcessing.set(true);
    const payload: Record<string, unknown> = { action };
    if (comments) payload['comments'] = comments;
    this.api.post<DeptScorecard>(`/dept-scorecards/${id}/transition`, payload).pipe(
      tap(() => {
        this.toast.success(
          action === 'approve' ? 'Scorecard approved' : action === 'lock' ? 'Scorecard locked' : 'Scorecard returned to Draft',
        );
        if (action === 'return' || action === 'lock') this.back();
        this.loadScorecards();
      }),
      catchError((e) => { this.toast.error('Error', e?.error?.message ?? e?.message); return of(null); }),
      finalize(() => this.isProcessing.set(false)),
    ).subscribe();
  }

  returnSc() {
    this.dialog.open(DeptReturnReasonDialogComponent, { panelClass: 'plat-dialog' })
      .afterClosed().subscribe((reason: string | undefined) => {
        if (!reason) return;
        this.transition('return', reason);
      });
  }

  trackById(_: number, x: { id: number }): number { return x.id; }
}
