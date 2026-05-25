import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { catchError, of, tap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import { Cycle, IdpObjective, IntegrationSyncLog } from '@core/models/domain.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

@Component({
  selector: 'app-integration-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <app-page-header title="Integration Hub" subtitle="Manage external system integrations and data synchronisation." icon="sync_alt" tone="indigo"></app-page-header>

      <div class="cards">
        <div class="plat-card tile">
          <h3><mat-icon>group</mat-icon> HR System</h3>
          <p>Sync employee data, post details, and organisational structure from your HR system.</p>
          <button mat-flat-button color="primary" (click)="hrSync()" [disabled]="busy().hr">
            <mat-icon [class.spin]="busy().hr">refresh</mat-icon> Sync Now
          </button>
        </div>

        <div class="plat-card tile">
          <h3><mat-icon>storage</mat-icon> mSCOA Budget</h3>
          <p>Pull budget values for budget-linked KPIs from the mSCOA system.</p>
          <div class="row">
            <mat-form-field appearance="outline" class="cycle">
              <mat-label>Cycle</mat-label>
              <mat-select [(ngModel)]="budgetCycleId">
                <mat-option *ngFor="let c of cycles()" [value]="c.id">{{ c.financialYearLabel }}</mat-option>
              </mat-select>
            </mat-form-field>
            <button mat-flat-button color="primary" (click)="budgetPull()" [disabled]="!budgetCycleId || busy().budget">
              <mat-icon [class.spin]="busy().budget">refresh</mat-icon> Pull
            </button>
          </div>
        </div>

        <div class="plat-card tile">
          <h3><mat-icon>link</mat-icon> Project Module</h3>
          <p>Sync project KPIs and link project milestones to performance agreements.</p>
          <button mat-flat-button color="primary" (click)="projectSync()" [disabled]="busy().proj">
            <mat-icon [class.spin]="busy().proj">refresh</mat-icon> Sync Projects
          </button>
        </div>

        <div class="plat-card tile">
          <h3><mat-icon>search</mat-icon> IDP Objectives</h3>
          <p>Search IDP objectives for KPI alignment and linkage.</p>
          <mat-form-field appearance="outline"><mat-label>Search objectives</mat-label><input matInput [ngModel]="idpSearch()" (ngModelChange)="onIdpSearch($event)" /></mat-form-field>
          <div class="idp-list" *ngIf="idpResults().length">
            <div class="idp-item" *ngFor="let o of idpResults()">
              <strong>{{ o.code }}</strong> <span class="muted">{{ o.description }}</span>
              <span class="chip" *ngIf="o.chapter">{{ o.chapter }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="plat-card log-card">
        <div class="log-head">
          <h3>Sync Log</h3>
          <mat-form-field appearance="outline" class="filter">
            <mat-label>Filter type</mat-label>
            <mat-select [ngModel]="syncFilter()" (ngModelChange)="onFilter($event)">
              <mat-option [value]="null">All Types</mat-option>
              <mat-option value="hr">HR</mat-option>
              <mat-option value="budget">Budget</mat-option>
              <mat-option value="project">Project</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <table class="plat-table">
          <thead><tr><th>Type</th><th>Direction</th><th>Entity</th><th class="num">Records</th><th>Status</th><th>Time</th></tr></thead>
          <tbody>
            <tr *ngIf="logs().length === 0"><td colspan="6" class="empty">No sync history.</td></tr>
            <tr *ngFor="let l of logs()">
              <td><strong>{{ l.integrationType }}</strong></td>
              <td>{{ l.direction }}</td>
              <td>{{ l.entityType }}</td>
              <td class="num">{{ l.recordCount ?? '—' }}</td>
              <td><span class="badge" [class]="'b-' + (l.status || '').toLowerCase()">{{ l.status }}</span></td>
              <td class="muted">{{ l.syncedAt }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [`
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 16px; }
    .tile { padding: 16px; }
    .tile h3 { margin: 0 0 8px; display:flex; align-items:center; gap:8px; font-size: 15px; }
    .tile p { margin: 0 0 12px; color: #64748b; font-size: 13px; }
    .row { display: flex; gap: 8px; align-items: center; }
    .cycle { flex: 1; }
    .filter { width: 180px; }
    .log-card { padding: 16px; }
    .log-head { display:flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .log-head h3 { margin: 0; }
    .num { text-align: right; }
    .idp-list { max-height: 160px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
    .idp-item { padding: 6px 8px; background: #f8fafc; border-radius: 6px; font-size: 13px; }
    .chip { display: inline-block; margin-left: 6px; padding: 1px 8px; border: 1px solid var(--plat-border); border-radius: 999px; font-size: 11px; }
    .badge { padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; background:#e2e8f0; color:#475569; }
    .b-completed { background:#dcfce7; color:#15803d; }
    .b-pending { background:#fef9c3; color:#a16207; }
    .b-failed { background:#fee2e2; color:#b91c1c; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    mat-form-field { width: 100%; }
  `],
})
export class IntegrationHubComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  cycles = signal<Cycle[]>([]);
  logs = signal<IntegrationSyncLog[]>([]);
  idpResults = signal<IdpObjective[]>([]);
  idpSearch = signal('');
  syncFilter = signal<string | null>(null);
  budgetCycleId: number | null = null;
  busy = signal({ hr: false, budget: false, proj: false });
  private idpDebounce: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    this.api.get<Cycle[]>('/cycles').pipe(catchError(() => of([] as Cycle[]))).subscribe((cs) => this.cycles.set(Array.isArray(cs) ? cs : []));
    this.refreshLog();
    this.loadIdp('');
  }
  ngOnDestroy() {
    if (this.idpDebounce) { clearTimeout(this.idpDebounce); this.idpDebounce = null; }
  }

  refreshLog() {
    this.api.get<IntegrationSyncLog[]>('/integrations/sync-log', { integrationType: this.syncFilter() ?? undefined })
      .pipe(catchError(() => of([] as IntegrationSyncLog[])))
      .subscribe((r) => this.logs.set(Array.isArray(r) ? r : []));
  }

  onFilter(v: string | null) { this.syncFilter.set(v); this.refreshLog(); }

  onIdpSearch(v: string) {
    this.idpSearch.set(v);
    if (this.idpDebounce) clearTimeout(this.idpDebounce);
    this.idpDebounce = setTimeout(() => this.loadIdp(v), 300);
  }
  loadIdp(search: string) {
    this.api.get<IdpObjective[]>('/integrations/idp-objectives', { search })
      .pipe(catchError(() => of([] as IdpObjective[])))
      .subscribe((r) => this.idpResults.set(Array.isArray(r) ? r : []));
  }

  hrSync() {
    this.busy.update((b) => ({ ...b, hr: true }));
    this.api.post<{ message?: string }>('/integrations/hr-sync', {}).pipe(
      tap((r) => { this.toast.success('HR Sync', r?.message ?? 'Sync completed'); this.refreshLog(); }),
      catchError((e) => { this.toast.error('HR sync failed', e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe(() => this.busy.update((b) => ({ ...b, hr: false })));
  }
  projectSync() {
    this.busy.update((b) => ({ ...b, proj: true }));
    this.api.post<{ message?: string }>('/integrations/project-sync', {}).pipe(
      tap((r) => { this.toast.success('Project Sync', r?.message ?? 'Sync completed'); this.refreshLog(); }),
      catchError((e) => { this.toast.error('Project sync failed', e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe(() => this.busy.update((b) => ({ ...b, proj: false })));
  }
  budgetPull() {
    if (!this.budgetCycleId) return;
    this.busy.update((b) => ({ ...b, budget: true }));
    this.api.post<{ message?: string }>('/integrations/budget-pull', { cycleId: this.budgetCycleId }).pipe(
      tap((r) => { this.toast.success('Budget Pull', r?.message ?? 'Pull completed'); this.refreshLog(); }),
      catchError((e) => { this.toast.error('Budget pull failed', e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe(() => this.busy.update((b) => ({ ...b, budget: false })));
  }
}
