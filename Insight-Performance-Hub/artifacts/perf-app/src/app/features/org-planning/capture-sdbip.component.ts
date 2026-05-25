import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { catchError, finalize, of, tap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import { ConfirmService } from '@core/services/confirm.service';
import {
  Cycle, Scorecard, ScorecardKpi, KpiQuarterTarget, KpiMonthActivity, UnitOfMeasure,
} from '@core/models/domain.model';
import { User } from '@core/models/user.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';

const MONTH_NAMES: Record<number, string> = {
  1: 'January', 2: 'February', 3: 'March', 4: 'April', 5: 'May', 6: 'June',
  7: 'July', 8: 'August', 9: 'September', 10: 'October', 11: 'November', 12: 'December',
};
const QUARTER_MONTHS: Record<number, number[]> = {
  1: [7, 8, 9], 2: [10, 11, 12], 3: [1, 2, 3], 4: [4, 5, 6],
};

@Component({
  selector: 'app-new-scorecard-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>New Scorecard</h2>
    <form (ngSubmit)="save()" #f="ngForm">
      <mat-dialog-content class="content">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput [(ngModel)]="name" name="n" required placeholder="FY 2024/25 Organisational Scorecard" />
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="!name.trim()">Create</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`.content { min-width: 420px; padding-top: 12px !important; } mat-form-field { width: 100%; }`],
})
export class NewScorecardDialogComponent {
  name = '';
  constructor(public ref: MatDialogRef<NewScorecardDialogComponent, string | null>) {}
  save() { if (this.name.trim()) this.ref.close(this.name.trim()); }
}

@Component({
  selector: 'app-capture-sdbip',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule, MatTabsModule, MatDialogModule,
    PageHeaderComponent, LoadingSpinnerComponent, StatusBadgeComponent, EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './capture-sdbip.component.html',
  styleUrls: ['./capture-sdbip.component.scss'],
})
export class CaptureSdbipComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly dialog = inject(MatDialog);

  // Lookups
  loading = signal(true);
  cycles = signal<Cycle[]>([]);
  uoms = signal<UnitOfMeasure[]>([]);
  users = signal<User[]>([]);
  selectedCycleId = signal<number | null>(null);
  effectiveCycleId = computed<number | null>(() => this.selectedCycleId() ?? this.cycles()[0]?.id ?? null);

  // Data
  scorecards = signal<Scorecard[]>([]);
  kpis = signal<ScorecardKpi[]>([]);
  quarterTargets = signal<KpiQuarterTarget[]>([]);
  activities = signal<KpiMonthActivity[]>([]);
  tasks = signal<KpiMonthActivity[]>([]);

  // Selection
  selectedScorecardId = signal<number | null>(null);
  selectedKpiId = signal<number | null>(null);
  isNewKpi = signal(false);
  selectedQuarter = signal(1);
  activeTabIndex = signal(0);
  saving = signal(false);

  selectedScorecard = computed<Scorecard | null>(() => this.scorecards().find((s) => s.id === this.selectedScorecardId()) ?? null);
  selectedKpi = computed<ScorecardKpi | null>(() => this.kpis().find((k) => k.id === this.selectedKpiId()) ?? null);
  isReadOnly = computed(() => {
    const sc = this.selectedScorecard();
    if (!sc || sc.status !== 'Draft') return true;
    if (this.isNewKpi()) return false;
    return this.selectedKpi()?.status !== 'Draft';
  });

  // Forms
  kpiForm = this.emptyKpiForm();
  targetForm: Record<string, string> = { q1: '', q2: '', q3: '', q4: '' };
  targetBudgetForm: Record<string, string> = { q1: '', q2: '', q3: '', q4: '' };
  targetEvidenceForm: Record<string, string> = { q1: '', q2: '', q3: '', q4: '' };
  activityForm: { month: number; description: string; dueDate: string } = { month: 7, description: '', dueDate: '' };
  taskForm: { taskName: string; ownerId: number | null; quarter: number; financialTarget: string; portfolioOfEvidence: string } =
    { taskName: '', ownerId: null, quarter: 1, financialTarget: '', portfolioOfEvidence: '' };
  showNewActivity = signal(false);
  showNewTask = signal(false);

  ngOnInit() { this.loadAll(); }

  // ── Loading ─────────────────────────────────────────────────────────────
  loadAll() {
    this.loading.set(true);
    this.api.get<Cycle[]>('/cycles').pipe(
      catchError(() => of([] as Cycle[])),
      tap((cs) => this.cycles.set(Array.isArray(cs) ? cs : [])),
    ).subscribe(() => {
      this.loadLookups();
      this.loadScorecards();
    });
  }

  private loadLookups() {
    this.api.get<UnitOfMeasure[]>('/units-of-measure').pipe(
      catchError(() => of([] as UnitOfMeasure[])),
      tap((u) => this.uoms.set(Array.isArray(u) ? u : [])),
    ).subscribe();
    this.api.get<User[]>('/auth/users').pipe(
      catchError(() => of([] as User[])),
      tap((u) => this.users.set(Array.isArray(u) ? u : [])),
    ).subscribe();
  }

  loadScorecards() {
    const cycleId = this.effectiveCycleId();
    if (!cycleId) { this.scorecards.set([]); this.loading.set(false); return; }
    this.api.get<Scorecard[]>('/scorecards', { cycleId }).pipe(
      catchError(() => of([] as Scorecard[])),
      tap((r) => this.scorecards.set(Array.isArray(r) ? r : [])),
      finalize(() => this.loading.set(false)),
    ).subscribe();
  }

  loadKpis(scorecardId: number) {
    this.api.get<ScorecardKpi[]>(`/scorecards/${scorecardId}/kpis`).pipe(
      catchError(() => of([] as ScorecardKpi[])),
      tap((r) => this.kpis.set(Array.isArray(r) ? r : [])),
    ).subscribe();
  }

  loadTargets(kpiId: number) {
    this.api.get<KpiQuarterTarget[]>(`/scorecard-kpis/${kpiId}/quarter-targets`).pipe(
      catchError(() => of([] as KpiQuarterTarget[])),
      tap((r) => {
        const list = Array.isArray(r) ? r : [];
        this.quarterTargets.set(list);
        const byQ: Record<number, KpiQuarterTarget> = {};
        list.forEach((t) => (byQ[t.quarter] = t));
        this.targetForm = {
          q1: byQ[1]?.targetValue ?? '', q2: byQ[2]?.targetValue ?? '',
          q3: byQ[3]?.targetValue ?? '', q4: byQ[4]?.targetValue ?? '',
        };
        this.targetBudgetForm = {
          q1: byQ[1]?.budgetValue != null ? String(byQ[1].budgetValue) : '',
          q2: byQ[2]?.budgetValue != null ? String(byQ[2].budgetValue) : '',
          q3: byQ[3]?.budgetValue != null ? String(byQ[3].budgetValue) : '',
          q4: byQ[4]?.budgetValue != null ? String(byQ[4].budgetValue) : '',
        };
        this.targetEvidenceForm = {
          q1: byQ[1]?.evidenceExpected ?? '', q2: byQ[2]?.evidenceExpected ?? '',
          q3: byQ[3]?.evidenceExpected ?? '', q4: byQ[4]?.evidenceExpected ?? '',
        };
      }),
    ).subscribe();
  }

  loadActivities(kpiId: number, quarter: number) {
    this.api.get<KpiMonthActivity[]>(`/scorecard-kpis/${kpiId}/month-activities`, { quarter }).pipe(
      catchError(() => of([] as KpiMonthActivity[])),
      tap((r) => this.activities.set(Array.isArray(r) ? r : [])),
    ).subscribe();
  }
  loadTasks(kpiId: number) {
    this.api.get<KpiMonthActivity[]>(`/scorecard-kpis/${kpiId}/month-activities`, { quarter: 5 }).pipe(
      catchError(() => of([] as KpiMonthActivity[])),
      tap((r) => this.tasks.set(Array.isArray(r) ? r : [])),
    ).subscribe();
  }

  // ── Navigation ──────────────────────────────────────────────────────────
  selectCycle(id: number) { this.selectedCycleId.set(id); this.loadScorecards(); }

  openScorecard(sc: Scorecard) {
    this.selectedScorecardId.set(sc.id);
    this.kpis.set([]);
    this.loadKpis(sc.id);
  }

  backToScorecards() {
    this.selectedScorecardId.set(null);
    this.selectedKpiId.set(null);
    this.isNewKpi.set(false);
    this.kpis.set([]);
  }

  openKpiDetail(k: ScorecardKpi) {
    this.kpiForm = {
      kpiNumber: k.kpiNumber ?? '', description: k.description ?? '',
      idpReference: k.idpReference ?? '', strategicObjective: k.strategicObjective ?? '',
      programme: k.programme ?? '', baseline: k.baseline ?? '',
      annualTarget: k.annualTarget ?? '', weighting: k.weighting ?? 0,
      evidenceSource: k.evidenceSource ?? '', evidencePortfolio: k.evidencePortfolio ?? '',
      fundingSource: k.fundingSource ?? '', budgetDescription: k.budgetDescription ?? '',
      annualBudgetTarget: k.annualBudgetTarget ?? 0, isCumulative: k.isCumulative ?? false,
      unitOfMeasureId: k.unitOfMeasureId ?? null,
      responsiblePostId: k.responsiblePostId ?? null,
      custodianPostId: k.custodianPostId ?? null,
    };
    this.selectedKpiId.set(k.id);
    this.isNewKpi.set(false);
    this.activeTabIndex.set(0);
    this.loadTargets(k.id);
    this.loadActivities(k.id, this.selectedQuarter());
    this.loadTasks(k.id);
  }

  openNewKpi() {
    this.kpiForm = this.emptyKpiForm();
    this.selectedKpiId.set(null);
    this.isNewKpi.set(true);
    this.activeTabIndex.set(0);
  }

  backToKpiList() {
    this.selectedKpiId.set(null);
    this.isNewKpi.set(false);
  }

  onTabChange(idx: number) {
    this.activeTabIndex.set(idx);
  }

  onQuarterChange(q: number) {
    this.selectedQuarter.set(q);
    this.activityForm = { month: QUARTER_MONTHS[q]?.[0] ?? 7, description: '', dueDate: '' };
    const kpiId = this.selectedKpiId();
    if (kpiId) this.loadActivities(kpiId, q);
  }

  // ── Mutations ───────────────────────────────────────────────────────────
  openNewScorecard() {
    if (!this.effectiveCycleId()) return;
    this.dialog.open(NewScorecardDialogComponent, { panelClass: 'plat-dialog', autoFocus: true })
      .afterClosed().subscribe((name) => {
        if (!name) return;
        const cycleId = this.effectiveCycleId();
        if (!cycleId) return;
        this.api.post<Scorecard>('/scorecards', { name, cycleId }).pipe(
          tap(() => { this.toast.success('Scorecard created'); this.loadScorecards(); }),
          catchError((e) => { this.toast.error('Error creating scorecard', e?.error?.message ?? e?.message); return of(null); }),
        ).subscribe();
      });
  }

  transitionScorecard(action: string) {
    const id = this.selectedScorecardId();
    if (!id) return;
    this.api.post(`/scorecards/${id}/transition`, { action }).pipe(
      tap(() => { this.toast.success(`Scorecard ${action}ed`); this.loadScorecards(); }),
      catchError((e) => { this.toast.error('Error', e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }

  transitionKpi(kpiId: number, action: string) {
    this.api.post(`/scorecard-kpis/${kpiId}/transition`, { action }).pipe(
      tap(() => { this.toast.success(`KPI ${action}ed`); const sc = this.selectedScorecardId(); if (sc) this.loadKpis(sc); }),
      catchError((e) => { this.toast.error('Error', e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }

  async deleteKpi(kpiId: number) {
    if (this.selectedScorecard()?.status !== 'Draft') return;
    const ok = await this.confirm.confirm({ title: 'Delete KPI', message: 'Delete this KPI?', destructive: true, confirmLabel: 'Delete' });
    if (!ok) return;
    this.api.delete(`/scorecard-kpis/${kpiId}`).pipe(
      tap(() => { this.toast.success('KPI deleted'); const sc = this.selectedScorecardId(); if (sc) this.loadKpis(sc); }),
      catchError((e) => { this.toast.error('Delete failed', e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }

  saveKpi() {
    if (this.isReadOnly()) return;
    const f = this.kpiForm;
    if (!f.kpiNumber || !f.description || !f.annualTarget) return;
    this.saving.set(true);
    const payload = {
      kpiNumber: f.kpiNumber, description: f.description, annualTarget: f.annualTarget,
      idpReference: f.idpReference || undefined, strategicObjective: f.strategicObjective || undefined,
      programme: f.programme || undefined, baseline: f.baseline || undefined,
      weighting: Number(f.weighting) || 0,
      evidenceSource: f.evidenceSource || undefined, evidencePortfolio: f.evidencePortfolio || undefined,
      fundingSource: f.fundingSource || undefined, budgetDescription: f.budgetDescription || undefined,
      annualBudgetTarget: f.annualBudgetTarget != null ? Number(f.annualBudgetTarget) : undefined,
      isCumulative: !!f.isCumulative,
      unitOfMeasureId: f.unitOfMeasureId ?? undefined,
      responsiblePostId: f.responsiblePostId ?? undefined,
      custodianPostId: f.custodianPostId ?? undefined,
    };
    if (this.isNewKpi()) {
      const sc = this.selectedScorecardId(); if (!sc) { this.saving.set(false); return; }
      this.api.post<ScorecardKpi>(`/scorecards/${sc}/kpis`, payload).pipe(
        tap((created) => {
          this.toast.success('KPI created — fill in remaining tabs');
          this.selectedKpiId.set(created.id);
          this.isNewKpi.set(false);
          this.loadKpis(sc);
          this.activeTabIndex.set(1);
        }),
        catchError((e) => { this.toast.error('Error saving KPI', e?.error?.message ?? e?.message); return of(null); }),
        finalize(() => this.saving.set(false)),
      ).subscribe();
    } else {
      const id = this.selectedKpiId(); if (!id) { this.saving.set(false); return; }
      this.api.patch<ScorecardKpi>(`/scorecard-kpis/${id}`, payload).pipe(
        tap(() => { this.toast.success('KPI saved'); const sc = this.selectedScorecardId(); if (sc) this.loadKpis(sc); }),
        catchError((e) => { this.toast.error('Error saving KPI', e?.error?.message ?? e?.message); return of(null); }),
        finalize(() => this.saving.set(false)),
      ).subscribe();
    }
  }

  saveTargets() {
    if (this.isReadOnly()) return;
    const id = this.selectedKpiId(); if (!id) return;
    const targets = [1, 2, 3, 4]
      .map((q) => {
        const tv = (this.targetForm as Record<string, string>)[`q${q}`];
        const bv = (this.targetBudgetForm as Record<string, string>)[`q${q}`];
        const ev = (this.targetEvidenceForm as Record<string, string>)[`q${q}`];
        return {
          quarter: q, targetValue: tv,
          budgetValue: bv ? Number(bv) : undefined,
          evidenceExpected: ev || undefined,
        };
      })
      .filter((t) => t.targetValue);
    this.api.put(`/scorecard-kpis/${id}/quarter-targets`, { targets }).pipe(
      tap(() => { this.toast.success('Quarterly targets saved'); this.loadTargets(id); }),
      catchError((e) => { this.toast.error('Save failed', e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }

  addActivity() {
    if (this.isReadOnly()) return;
    const id = this.selectedKpiId(); if (!id || !this.activityForm.description) return;
    this.api.post(`/scorecard-kpis/${id}/month-activities`, {
      quarter: this.selectedQuarter(),
      month: this.activityForm.month,
      description: this.activityForm.description,
      dueDate: this.activityForm.dueDate || new Date().toISOString().split('T')[0],
    }).pipe(
      tap(() => {
        this.toast.success('Activity added');
        this.showNewActivity.set(false);
        this.activityForm = { month: QUARTER_MONTHS[this.selectedQuarter()]?.[0] ?? 7, description: '', dueDate: '' };
        this.loadActivities(id, this.selectedQuarter());
      }),
      catchError((e) => { this.toast.error('Error adding activity', e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }

  toggleActivity(a: KpiMonthActivity) {
    if (this.isReadOnly()) return;
    const next = a.status === 'Completed' ? 'Pending' : 'Completed';
    this.api.patch(`/month-activities/${a.id}`, { status: next }).pipe(
      tap(() => { const id = this.selectedKpiId(); if (id) this.loadActivities(id, this.selectedQuarter()); }),
      catchError(() => { this.toast.error('Error'); return of(null); }),
    ).subscribe();
  }

  async deleteActivity(a: KpiMonthActivity) {
    if (this.isReadOnly()) return;
    const ok = await this.confirm.confirm({ title: 'Remove activity', message: 'Remove this activity?', destructive: true, confirmLabel: 'Remove' });
    if (!ok) return;
    this.api.delete(`/month-activities/${a.id}`).pipe(
      tap(() => { this.toast.success('Activity removed'); const id = this.selectedKpiId(); if (id) this.loadActivities(id, this.selectedQuarter()); }),
      catchError(() => { this.toast.error('Error'); return of(null); }),
    ).subscribe();
  }

  addTask() {
    if (this.isReadOnly()) return;
    const id = this.selectedKpiId(); if (!id || !this.taskForm.taskName) return;
    this.api.post(`/scorecard-kpis/${id}/month-activities`, {
      quarter: 5,
      month: this.taskForm.quarter,
      description: JSON.stringify({
        taskName: this.taskForm.taskName,
        financialTarget: this.taskForm.financialTarget,
        portfolioOfEvidence: this.taskForm.portfolioOfEvidence,
      }),
      ownerId: this.taskForm.ownerId ?? undefined,
      dueDate: 'task',
    }).pipe(
      tap(() => {
        this.toast.success('Task added');
        this.showNewTask.set(false);
        this.taskForm = { taskName: '', ownerId: null, quarter: 1, financialTarget: '', portfolioOfEvidence: '' };
        this.loadTasks(id);
      }),
      catchError((e) => { this.toast.error('Error adding task', e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }

  async deleteTask(t: KpiMonthActivity) {
    if (this.isReadOnly()) return;
    const ok = await this.confirm.confirm({ title: 'Delete task', message: 'Delete this task?', destructive: true, confirmLabel: 'Delete' });
    if (!ok) return;
    this.api.delete(`/month-activities/${t.id}`).pipe(
      tap(() => { this.toast.success('Task deleted'); const id = this.selectedKpiId(); if (id) this.loadTasks(id); }),
      catchError(() => { this.toast.error('Error'); return of(null); }),
    ).subscribe();
  }

  // ── Helpers ─────────────────────────────────────────────────────────────
  parseTask(act: KpiMonthActivity): { taskName: string; financialTarget: string; portfolioOfEvidence: string; quarter: number } {
    try {
      const p = JSON.parse(act.description);
      return {
        taskName: p.taskName ?? act.description,
        financialTarget: p.financialTarget ?? '',
        portfolioOfEvidence: p.portfolioOfEvidence ?? '',
        quarter: act.month,
      };
    } catch {
      return { taskName: act.description, financialTarget: '', portfolioOfEvidence: '', quarter: act.month };
    }
  }

  monthsForQuarter(q: number): number[] { return QUARTER_MONTHS[q] ?? []; }
  monthName(m: number): string { return MONTH_NAMES[m] ?? String(m); }

  trackById(_: number, x: { id: number }): number { return x.id; }

  private emptyKpiForm() {
    return {
      kpiNumber: '', description: '', idpReference: '', strategicObjective: '',
      programme: '', baseline: '', annualTarget: '', weighting: 0,
      evidenceSource: '', evidencePortfolio: '', fundingSource: '',
      budgetDescription: '', annualBudgetTarget: 0 as number, isCumulative: false,
      unitOfMeasureId: null as number | null,
      responsiblePostId: null as number | null,
      custodianPostId: null as number | null,
    };
  }
}
