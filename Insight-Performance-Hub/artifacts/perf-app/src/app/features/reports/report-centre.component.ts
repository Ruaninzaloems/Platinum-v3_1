import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { catchError, of, switchMap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { Cycle } from '@core/models/domain.model';
import { User } from '@core/models/user.model';

interface ReportRow {
  kpi: {
    id: number; kpiNumber: string; description: string; strategicObjective?: string | null;
    baseline?: string | null; annualTarget: string; annualBudgetTarget?: number | null;
    evidencePortfolio?: string | null; evidenceSource?: string | null; responsiblePostId?: number | null;
    custodianPostId?: number | null; status?: string;
    customFields?: Record<string, string | number | boolean | null> | null;
  };
  uomName: string;
  targets: Record<string, string>;
  actuals: Record<string, { value: string; isAchieved: boolean | null; commentary: string | null }>;
}

interface ReportField { fieldKind: string; fieldKey: string; fieldLabel: string; fieldType: string; }

interface ReportRunData {
  run: { id: number; title: string; reportType: string };
  cycle: { financialYearLabel?: string } | null;
  fields?: ReportField[];
  users?: Record<string, { displayName: string; jobTitle: string | null }>;
  rows: ReportRow[];
}

/** A rendered report column derived from the Scorecard Wizard field config. */
interface ReportColumn { label: string; key: string; kind: string; quarter?: number; }

interface ReportTab {
  key: string;
  label: string;
  description: string;
  citation?: string;
  toggleLabel?: string;
  inlineToggleLabel?: string;
  hasQuarter?: boolean;
}

const REPORT_TABS: ReportTab[] = [
  {
    key: 'sdbip',
    label: 'SDBIP Report',
    description: 'Service Delivery and Budget Implementation Plan report — compiled in accordance with s53 of the MFMA, read together with MFMA Circular No. 13.',
    citation: 's53(1) of the MFMA',
  },
  {
    key: 'revised-sdbip',
    label: 'Revised SDBIP',
    description: 'Revised SDBIP reflecting mid-year budget and performance adjustments \u2014 in terms of s54(1)(c) of the MFMA.',
    citation: 's54(1)(c) of the MFMA',
  },
  {
    key: 'departmental-sdbip',
    label: 'Departmental SDBIP Report',
    description: 'Departmental SDBIP report showing each department\u2019s scorecard, KPIs and targets.',
    toggleLabel: 'Include strategic KPIs',
  },
  {
    key: 'quarterly',
    label: 'Quarterly Progress Report',
    description: 'Quarterly performance progress against SDBIP targets \u2014 submitted to Council in terms of s52(d) of the MFMA.',
    inlineToggleLabel: 'Include departmental KPIs',
    hasQuarter: true,
  },
  {
    key: 'mid-year',
    label: 'Mid-year Performance Report',
    description: 'Mid-year performance assessment covering Q1 and Q2 actuals, risks, and recommendations \u2014 prepared in accordance with s72 of the MFMA.',
  },
  {
    key: 'annual',
    label: 'Annual Performance Report',
    description: 'Consolidated annual performance report for the financial year \u2014 prepared in accordance with Section 46 of the MSA.',
  },
];

@Component({
  selector: 'app-report-centre',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <div class="head">
        <h1>OPMS Reports</h1>
        <p>Generate and view organisational performance reports</p>
      </div>

      <div class="tabbar">
        <button *ngFor="let t of tabs" type="button" class="tab" [class.active]="activeTab() === t.key" (click)="selectTab(t.key)">
          {{ t.label }}
        </button>
      </div>

      <div class="plat-card params-card">
        <h3>Report Parameters</h3>
        <p class="desc">{{ activeTabDef().description }}</p>
        <div class="params-row">
          <div class="param">
            <label>Financial Year <span class="req">*</span></label>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-select placeholder="-- Select --" [ngModel]="cycleId" (ngModelChange)="onCycleChange($event)">
                <mat-option [value]="null">-- Select --</mat-option>
                <mat-option *ngFor="let c of cycles()" [value]="c.id">{{ c.financialYearLabel }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div class="param quarter" *ngIf="activeTabDef().hasQuarter">
            <label>Quarter <span class="req">*</span></label>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-select [(ngModel)]="quarter">
                <mat-option *ngFor="let q of [1, 2, 3, 4]" [value]="q">Q{{ q }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div class="param">
            <label>Department</label>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-select placeholder="-- Select --" [(ngModel)]="department">
                <mat-option [value]="null">-- Select --</mat-option>
                <mat-option *ngFor="let d of departments()" [value]="d">{{ d }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div class="param">
            <label>Responsible Person</label>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-select placeholder="-- Select --" [(ngModel)]="responsibleId" panelClass="person-select-panel">
                <mat-select-trigger>{{ selectedPersonLabel() }}</mat-select-trigger>
                <mat-option [value]="null">-- Select --</mat-option>
                <mat-option *ngFor="let u of users()" [value]="u.id">
                  <span class="person-opt">
                    <span class="person-name">{{ u.displayName || u.username }}</span>
                    <span class="person-title" *ngIf="u.jobTitle">{{ u.jobTitle }}</span>
                  </span>
                </mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <div class="param actions">
            <label class="inline-toggle" *ngIf="activeTabDef().inlineToggleLabel">
              <input type="checkbox" [(ngModel)]="includeDepartmental" />
              <span>{{ activeTabDef().inlineToggleLabel }}</span>
            </label>
            <button mat-flat-button color="primary" [disabled]="!cycleId" (click)="search()">Search</button>
            <button mat-stroked-button (click)="clear()">Clear</button>
          </div>
        </div>
        <label class="toggle-row" *ngIf="activeTabDef().toggleLabel">
          <input type="checkbox" [(ngModel)]="includeStrategic" />
          <span>{{ activeTabDef().toggleLabel }}</span>
        </label>
      </div>

      <div class="plat-card result-card" *ngIf="searched()">
        <div class="empty" *ngIf="loading()">
          <mat-icon>hourglass_top</mat-icon>
          <p>Generating report…</p>
        </div>
        <ng-container *ngIf="!loading()">
          <div class="result-head" *ngIf="reportData() as rd">
            <div class="result-title">
              <span class="report-badge"><mat-icon>description</mat-icon></span>
              <div>
                <h3>{{ activeTabDef().label }}</h3>
                <p class="sub-line">{{ rd.cycle?.financialYearLabel }}<span *ngIf="activeTabDef().citation"> · {{ activeTabDef().citation }}</span></p>
              </div>
            </div>
            <div class="export-btns" *ngIf="filteredRows().length > 0">
              <span class="export-label">Export:</span>
              <button type="button" class="export-btn" (click)="exportRun('xlsx')"><span class="fmt-icon excel">X</span> Excel</button>
              <button type="button" class="export-btn" (click)="exportRun('pdf')"><span class="fmt-icon pdf">P</span> PDF</button>
              <button type="button" class="export-btn" (click)="exportRun('docx')"><span class="fmt-icon word">W</span> Word</button>
            </div>
          </div>
          <div class="empty" *ngIf="filteredRows().length === 0">
            <mat-icon>description</mat-icon>
            <p>No report data available for the selected parameters yet.</p>
            <p class="sub">Capture and submit the SDBIP for this financial year to see it here.</p>
          </div>
          <ng-container *ngIf="filteredRows().length > 0">
            <div class="section-head">
              <span></span>
              <span class="kpi-count">{{ filteredRows().length }} KPI{{ filteredRows().length === 1 ? '' : 's' }}</span>
            </div>
            <div class="table-wrap">
              <table class="report-table">
                <thead>
                  <tr>
                    <th *ngFor="let c of columns()" [class.wide]="c.key === 'description' || c.key === 'strategicObjective'">{{ c.label }}</th>
                    <th *ngIf="showActuals()" [attr.colspan]="4">Actuals (Q1–Q4)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let r of filteredRows()">
                    <td *ngFor="let c of columns()" [class.wide]="c.key === 'description' || c.key === 'strategicObjective'">{{ cellValue(c, r) || '—' }}</td>
                    <td *ngIf="showActuals()" [attr.colspan]="4">
                      <span *ngFor="let q of [1, 2, 3, 4]" class="actual-chip">Q{{ q }}: {{ r.actuals[q]?.value || '—' }}</span>
                    </td>
                    <td><span class="status-badge" [class.approved]="r.kpi.status === 'Approved'">{{ r.kpi.status || '—' }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ng-container>
        </ng-container>
      </div>
    </section>
  `,
  styles: [`
    .head h1 { margin: 0 0 4px; font-size: 22px; font-weight: 700; color: #0f172a; }
    .head p { margin: 0 0 16px; font-size: 13px; color: #64748b; }
    .tabbar { display: flex; gap: 4px; border-bottom: 1px solid var(--plat-border); margin-bottom: 16px; flex-wrap: wrap; }
    .tab { background: transparent; border: 0; border-bottom: 2px solid transparent; padding: 10px 14px; font-size: 13px; font-weight: 500; color: #64748b; cursor: pointer; }
    .tab:hover { color: #0f172a; }
    .tab.active { color: #1d4ed8; border-bottom-color: #2563eb; font-weight: 600; }
    .params-card { padding: 16px 18px; }
    .params-card h3 { margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #0f172a; }
    .desc { margin: 0 0 14px; font-size: 12px; color: #64748b; }
    .params-row { display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-end; }
    .param { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 200px; }
    .param label { font-size: 12px; font-weight: 600; color: #334155; }
    .param mat-form-field { width: 100%; }
    .param.actions { flex: 0 0 auto; flex-direction: row; gap: 8px; min-width: 0; }
    .req { color: #dc2626; }
    .toggle-row { display: flex; align-items: center; gap: 8px; margin-top: 12px; font-size: 12px; color: #64748b; cursor: pointer; }
    .toggle-row input { width: 15px; height: 15px; accent-color: #2563eb; }
    .param.quarter { flex: 0 0 110px; min-width: 110px; }
    .inline-toggle { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #64748b; cursor: pointer; white-space: nowrap; }
    .inline-toggle input { width: 15px; height: 15px; accent-color: #2563eb; }
    .result-card { margin-top: 16px; padding: 0; }
    .empty { padding: 48px; text-align: center; color: #94a3b8; }
    .empty mat-icon { font-size: 36px; width: 36px; height: 36px; margin-bottom: 8px; }
    .empty p { margin: 0; font-size: 14px; }
    .empty .sub { margin-top: 4px; font-size: 12px; }
    .result-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--plat-border); }
    .result-head h3 { margin: 0; font-size: 14px; font-weight: 700; color: #0f172a; }
    .result-title { display: flex; align-items: center; gap: 10px; }
    .report-badge { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; background: #eef2ff; color: #4338ca; }
    .report-badge mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .sub-line { margin: 2px 0 0; font-size: 12px; color: #64748b; }
    ::ng-deep .person-select-panel .mat-mdc-option { min-height: 44px; }
    ::ng-deep .person-select-panel .person-opt { display: flex; flex-direction: column; line-height: 1.25; padding: 4px 0; }
    ::ng-deep .person-select-panel .person-name { font-size: 13px; font-weight: 500; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    ::ng-deep .person-select-panel .person-title { font-size: 11px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .export-btns { display: flex; gap: 8px; align-items: center; }
    .export-label { font-size: 12px; color: #64748b; margin-right: 2px; }
    .export-btn { display: inline-flex; align-items: center; gap: 7px; padding: 6px 14px; border: 1px solid var(--plat-border); border-radius: 999px; background: #fff; font-size: 12.5px; font-weight: 600; color: #0f172a; cursor: pointer; }
    .export-btn:hover { background: #f8fafc; }
    .fmt-icon { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 4px; color: #fff; font-size: 10.5px; font-weight: 700; }
    .fmt-icon.excel { background: #16a34a; }
    .fmt-icon.pdf { background: #dc2626; }
    .fmt-icon.word { background: #2563eb; }
    .section-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px 0; }
    .chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border: 1px solid var(--plat-border); border-radius: 999px; font-size: 12px; font-weight: 600; color: #334155; background: #fff; }
    .chip.active { border-color: #2563eb; color: #1d4ed8; background: #eff6ff; }
    .chip-count { background: #1d4ed8; color: #fff; border-radius: 999px; padding: 0 6px; font-size: 10.5px; line-height: 16px; }
    .kpi-count { font-size: 12px; color: #64748b; }
    .status-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; background: #f1f5f9; color: #475569; white-space: nowrap; }
    .status-badge.approved { background: #dcfce7; color: #15803d; }
    .export-btns mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .table-wrap { overflow-x: auto; }
    .report-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    .report-table th { text-align: left; padding: 10px 12px; background: #f8fafc; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; white-space: nowrap; border-bottom: 1px solid var(--plat-border); }
    .report-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #0f172a; vertical-align: top; }
    .report-table .wide { min-width: 260px; }
    .actual-chip { display: inline-block; margin-right: 8px; color: #475569; }
  `],
})
export class ReportCentreComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly tabs = REPORT_TABS;
  activeTab = signal<string>('sdbip');
  activeTabDef = computed(() => this.tabs.find((t) => t.key === this.activeTab()) ?? this.tabs[0]);

  includeStrategic = false;
  includeDepartmental = false;
  quarter = 1;

  cycles = signal<Cycle[]>([]);
  departments = signal<string[]>([]);
  users = signal<User[]>([]);
  searched = signal(false);

  cycleId: number | null = null;
  department: string | null = null;
  responsibleId: number | null = null;

  loading = signal(false);
  reportData = signal<ReportRunData | null>(null);
  filteredRows = computed(() => {
    const rd = this.reportData();
    if (!rd) return [] as ReportRow[];
    const rid = this.responsibleFilter();
    const dept = this.departmentFilter();
    return rd.rows.filter((r) =>
      (!rid || r.kpi.responsiblePostId === rid) &&
      (!dept || String(r.kpi.customFields?.['cf_department'] ?? '').trim() === dept),
    );
  });
  private responsibleFilter = signal<number | null>(null);
  private departmentFilter = signal<string | null>(null);

  /** Progress-style reports show actuals; SDBIP plan reports show targets only. */
  showActuals(): boolean {
    return ['quarterly', 'mid-year', 'annual'].includes(this.activeTab());
  }

  /**
   * Table columns follow the Scorecard Wizard field config (heading + sequence).
   * Quarter target fields render as compact Q1–Q4 columns; POE fields are
   * omitted from the on-screen table (they remain in the exports).
   */
  columns = computed<ReportColumn[]>(() => {
    const fields = this.reportData()?.fields ?? [];
    if (fields.length === 0) {
      return [
        { label: '#', key: 'kpiNumber', kind: 'primary' },
        { label: 'Indicator Description', key: 'description', kind: 'primary' },
        { label: 'Unit of Measure', key: 'unitOfMeasureId', kind: 'primary' },
        { label: 'Baseline', key: 'baseline', kind: 'primary' },
        { label: 'Annual Target', key: 'annualTarget', kind: 'primary' },
        ...[1, 2, 3, 4].map((q) => ({ label: `Q${q}`, key: `cf_quarter_${q}_target`, kind: 'quarter', quarter: q })),
      ];
    }
    const cols: ReportColumn[] = [];
    for (const f of fields) {
      const qt = /^cf_quarter_(\d)_target$/.exec(f.fieldKey);
      if (qt) { cols.push({ label: `Q${qt[1]}`, key: f.fieldKey, kind: 'quarter', quarter: Number(qt[1]) }); continue; }
      if (/^cf_quarter_\d_poe$/.test(f.fieldKey)) continue;
      cols.push({ label: f.fieldKey === 'kpiNumber' ? '#' : f.fieldLabel, key: f.fieldKey, kind: f.fieldKind });
    }
    return cols;
  });

  cellValue(c: ReportColumn, r: ReportRow): string {
    if (c.kind === 'quarter' && c.quarter) return r.targets[c.quarter] || '';
    if (c.kind === 'custom') {
      const v = r.kpi.customFields?.[c.key];
      return v == null ? '' : String(v);
    }
    switch (c.key) {
      case 'unitOfMeasureId': return r.uomName;
      case 'responsiblePostId': return this.personName(r.kpi.responsiblePostId);
      case 'custodianPostId': return this.personName(r.kpi.custodianPostId);
      default: {
        const v = (r.kpi as unknown as Record<string, unknown>)[c.key];
        return v == null ? '' : String(v);
      }
    }
  }

  /** Compact label for the selected responsible person in the closed dropdown. */
  selectedPersonLabel(): string {
    if (this.responsibleId == null) return '-- Select --';
    const u = this.users().find((x) => x.id === this.responsibleId);
    return u ? (u.displayName || u.username) : '';
  }

  /** "Name (Job Title)" for a responsible/custodian post. */
  private personName(postId: number | null | undefined): string {
    if (!postId) return '';
    const u = this.reportData()?.users?.[postId];
    if (!u) return '';
    return u.jobTitle ? `${u.displayName} (${u.jobTitle})` : u.displayName;
  }

  ngOnInit() {
    this.api.get<Cycle[]>('/cycles').pipe(catchError(() => of([] as Cycle[]))).subscribe((cs) => {
      const arr = Array.isArray(cs) ? cs : [];
      this.cycles.set(arr);
      const def = arr.find((c) => c.status === 'Open') ?? arr[0];
      if (def) {
        this.cycleId = def.id;
        this.loadDepartments(def.id);
      }
    });
    this.api.get<User[]>('/users/lookup').pipe(catchError(() => of([] as User[])))
      .subscribe((u) => this.users.set(Array.isArray(u) ? u : []));
  }

  private loadDepartments(cycleId: number) {
    this.api.get<string[]>('/reports/departments', { cycleId }).pipe(catchError(() => of([] as string[])))
      .subscribe((d) => this.departments.set(Array.isArray(d) ? d : []));
  }

  onCycleChange(id: number | null) {
    this.cycleId = id;
    this.department = null;
    this.departments.set([]);
    this.searched.set(false);
    if (id) this.loadDepartments(id);
  }

  selectTab(key: string) {
    this.activeTab.set(key);
    this.includeStrategic = false;
    this.includeDepartmental = false;
    this.quarter = 1;
    this.searched.set(false);
  }

  search() {
    if (!this.cycleId) return;
    this.searched.set(true);
    this.loading.set(true);
    this.reportData.set(null);
    this.responsibleFilter.set(this.responsibleId);
    this.departmentFilter.set(this.department);
    const tab = this.activeTabDef();
    const scorecardType = tab.key === 'sdbip' ? 'organisational' : tab.key === 'revised-sdbip' ? 'revised' : undefined;
    const cycleLabel = this.cycles().find((c) => c.id === this.cycleId)?.financialYearLabel ?? '';
    const body: Record<string, unknown> = {
      cycleId: this.cycleId,
      reportType: tab.key,
      title: `${tab.label} ${cycleLabel}`.trim(),
    };
    if (scorecardType) body['scorecardType'] = scorecardType;
    if (tab.hasQuarter) body['quarter'] = this.quarter;
    this.api.post<{ id: number }>('/reports/generate', body).pipe(
      switchMap((run) => this.api.get<ReportRunData>(`/reports/runs/${run.id}/data`)),
      catchError(() => of(null)),
    ).subscribe((data) => {
      this.reportData.set(data);
      this.loading.set(false);
    });
  }

  clear() {
    this.department = null;
    this.responsibleId = null;
    this.includeStrategic = false;
    this.includeDepartmental = false;
    this.quarter = 1;
    this.searched.set(false);
    this.reportData.set(null);
  }

  exportRun(format: 'xlsx' | 'csv' | 'pdf' | 'docx') {
    const rd = this.reportData();
    if (!rd) return;
    this.api.getBlob(`/reports/runs/${rd.run.id}/export`, { format }).pipe(
      catchError(() => of(null)),
    ).subscribe((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${rd.run.title}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}
