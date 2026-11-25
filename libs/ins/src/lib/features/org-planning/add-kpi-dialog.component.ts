import { ChangeDetectionStrategy, Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { catchError, finalize, of, switchMap, tap } from 'rxjs';
import { ApiService } from '@ins-core/services/api.service';
import { ToastService } from '@ins-core/services/toast.service';
import { NationalKpa, ScorecardKpi, SdbipFieldConfig, UnitOfMeasure } from '@ins-core/models/domain.model';
import { User } from '@ins-core/models/user.model';

export interface AddKpiDialogData {
  scorecardId: number;
  fieldConfig: SdbipFieldConfig[];
  uoms: UnitOfMeasure[];
  users: User[];
  /** When set, the dialog edits this existing KPI instead of creating a new one. */
  kpi?: ScorecardKpi;
  /** When true, the dialog shows the KPI in view-only mode (no editing or saving). */
  readOnly?: boolean;
  /** Revision mode (revised SDBIP): shows original baselines next to quarterly
   *  targets, allows an optional reason note per baselined target change, and
   *  records revision audit-log entries on save. */
  revision?: boolean;
}

@Component({
  selector: 'app-add-kpi-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatSlideToggleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dlg-head">
      <h2>{{ ro ? 'View KPI' : (isEdit ? 'Edit KPI' : 'Add KPI to SDBIP') }}</h2>
      <button mat-icon-button class="close" (click)="ref.close(null)" aria-label="Close"><mat-icon>close</mat-icon></button>
    </div>
    <p class="dlg-note" *ngIf="!ro">Fields shown are configured by the Scorecard Wizard. <span class="req">*</span> = required.</p>
    <p class="dlg-note" *ngIf="ro">This KPI is view-only while the SDBIP is pending review.</p>

    <div class="dlg-body">
      <div class="fields-grid">
        <ng-container *ngFor="let f of gridFields(); trackBy: trackByFieldKey">
          <div class="field" [class.span-2]="kind(f) === 'textarea'">
            <label>{{ f.fieldLabel }}<span class="req" *ngIf="f.isRequired"> *</span></label>
            <ng-container [ngSwitch]="kind(f)">
              <textarea *ngSwitchCase="'textarea'" rows="2" [ngModel]="value(f)" (ngModelChange)="setValue(f, $event)"
                        [disabled]="ro" [placeholder]="placeholderFor(f)"></textarea>
              <select *ngSwitchCase="'userSelect'" [ngModel]="value(f)" (ngModelChange)="setValue(f, $event)" [disabled]="ro">
                <option [ngValue]="null">Select...</option>
                <option *ngFor="let u of userOptions(f.fieldKey); trackBy: trackById" [ngValue]="u.id">{{ userLabel(u) }}</option>
              </select>
              <select *ngSwitchCase="'uomSelect'" [ngModel]="value(f)" (ngModelChange)="setValue(f, $event)" [disabled]="ro">
                <option [ngValue]="null">Select...</option>
                <option *ngFor="let u of data.uoms; trackBy: trackById" [ngValue]="u.id">{{ u.name }}</option>
              </select>
              <select *ngSwitchCase="'nkpaSelect'" [ngModel]="value(f)" (ngModelChange)="setValue(f, $event)" [disabled]="ro">
                <option [ngValue]="null">Select...</option>
                <option *ngFor="let k of nkpas(); trackBy: trackById" [ngValue]="k.name">{{ k.name }}</option>
              </select>
              <select *ngSwitchCase="'deptSelect'" [ngModel]="value(f)" (ngModelChange)="setValue(f, $event)" [disabled]="ro">
                <option [ngValue]="null">Select...</option>
                <option *ngFor="let d of departments(); trackBy: trackById" [ngValue]="d.name">{{ d.name }}</option>
              </select>
              <input *ngSwitchCase="'kpiNumberAuto'" type="text" [ngModel]="value(f)" disabled
                     placeholder="Auto-assigned" title="KPI numbers are assigned automatically to stay sequential" />
              <input *ngSwitchCase="'number'" type="number" [ngModel]="value(f)" (ngModelChange)="setValue(f, $event)"
                     [disabled]="ro" [placeholder]="placeholderFor(f)" />
              <input *ngSwitchCase="'date'" type="date" [ngModel]="value(f)" (ngModelChange)="setValue(f, $event)" [disabled]="ro" />
              <label *ngSwitchCase="'checkbox'" class="chk-line">
                <input type="checkbox" [ngModel]="value(f)" (ngModelChange)="setValue(f, $event)" [disabled]="ro" /> {{ f.fieldLabel }}
              </label>
              <input *ngSwitchDefault type="text" [ngModel]="value(f)" (ngModelChange)="setValue(f, $event)"
                     [disabled]="ro" [placeholder]="placeholderFor(f)" />
            </ng-container>
          </div>
        </ng-container>
      </div>

      <div class="toggle-card">
        <mat-slide-toggle [(ngModel)]="isCumulative" color="primary" [disabled]="ro"></mat-slide-toggle>
        <div>
          <div class="tc-title">Cumulative Target</div>
          <div class="tc-hint">Quarterly actuals are added together for mid-year and annual reporting (e.g. Q1+Q2 for mid-year)</div>
        </div>
      </div>

      <div class="section-label">Quarterly Targets</div>
      <div class="q-grid">
        <div class="field" *ngFor="let q of quarters">
          <label>Q{{ q }} Target<span class="req" *ngIf="qTargetRequired(q)"> *</span>
            <span class="rev-chip" *ngIf="isRevisedQuarter(q)">Revised</span>
          </label>
          <input type="text" [(ngModel)]="qTargets[q]" [disabled]="ro" placeholder="—" />
          <span class="baseline-note" *ngIf="revisionMode && baselineFor(q) !== null">Original: {{ baselineFor(q) || '—' }}</span>
        </div>
        <div class="field" *ngFor="let q of quarters">
          <label>Q{{ q }} Portfolio of Evidence<span class="req" *ngIf="qPoeRequired(q)"> *</span></label>
          <input type="text" [(ngModel)]="qEvidence[q]" [disabled]="ro" placeholder="Evidence description" />
        </div>
      </div>

      <ng-container *ngIf="revisionMode && !ro">
        <ng-container *ngIf="reasonQuarters() as rq">
          <div *ngIf="rq.length > 0">
            <div class="section-label">Revision Reasons</div>
            <p class="dlg-note reason-note">Optional: note why a baselined quarterly target changed. The overall revision reason is captured when the revised SDBIP is submitted.</p>
            <div class="reason-grid">
              <div class="field" *ngFor="let q of rq">
                <label>Q{{ q }} Revision Reason</label>
                <textarea rows="2" [(ngModel)]="qReasons[q]" placeholder="Why is the Q{{ q }} target being revised?"></textarea>
              </div>
            </div>
          </div>
        </ng-container>
      </ng-container>

      <div class="fields-grid" *ngIf="responsibleField() as rf">
        <div class="field">
          <label>Responsible Person<span class="req" *ngIf="rf.isRequired"> *</span></label>
          <select [ngModel]="value(rf)" (ngModelChange)="setValue(rf, $event)" [disabled]="ro">
            <option [ngValue]="null">Name or role</option>
            <option *ngFor="let u of userOptions('responsiblePostId'); trackBy: trackById" [ngValue]="u.id">{{ userLabel(u) }}</option>
          </select>
        </div>
      </div>
    </div>

    <div class="dlg-actions">
      <button mat-stroked-button (click)="ref.close(null)">{{ ro ? 'Close' : 'Cancel' }}</button>
      <button *ngIf="!ro" mat-flat-button color="primary" [disabled]="saving() || !targetsReady()" (click)="save()">
        {{ saving() ? 'Saving…' : (targetsReady() ? 'Save' : 'Loading targets…') }}
      </button>
      <button *ngIf="!ro && isRejected" mat-flat-button class="submit-btn" [disabled]="saving() || !targetsReady()" (click)="save(true)">
        {{ saving() ? 'Submitting…' : 'Submit' }}
      </button>
    </div>
  `,
  styles: [`
    :host { display: block; width: 640px; max-width: 100%; }
    .dlg-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px 0; }
    .dlg-head h2 { margin: 0; font-size: 17px; font-weight: 700; color: #0f172a; }
    .dlg-head .close { color: #94a3b8; }
    .dlg-note { margin: 4px 0 0; padding: 0 20px; font-size: 12px; color: #64748b; }
    .req { color: #dc2626; }
    .dlg-body { padding: 14px 20px 4px; max-height: 65vh; overflow-y: auto; }
    .fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 14px; margin-bottom: 12px; }
    .field { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
    .field.span-2 { grid-column: 1 / -1; }
    .field label { font-size: 12.5px; font-weight: 600; color: #334155; }
    .field input, .field select, .field textarea {
      font: inherit; font-size: 13px; color: #0f172a;
      border: 1px solid #e2e8f0; border-radius: 8px; background: #fff;
      padding: 9px 10px; outline: none; width: 100%; box-sizing: border-box;
    }
    .field textarea { resize: vertical; }
    .field input::placeholder, .field textarea::placeholder { color: #94a3b8; }
    .field input:focus, .field select:focus, .field textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.12); }
    .field select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 28px; }
    .chk-line { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #0f172a; padding: 8px 0; }
    .toggle-card {
      display: flex; align-items: flex-start; gap: 12px;
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
      padding: 12px 14px; margin-bottom: 16px;
    }
    .tc-title { font-size: 13px; font-weight: 600; color: #0f172a; }
    .tc-hint { font-size: 12px; color: #64748b; margin-top: 2px; }
    .section-label { font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #64748b; margin: 4px 0 10px; }
    .rev-chip { display: inline-block; margin-left: 6px; padding: 1px 7px; border-radius: 999px; background: #fef3c7; color: #b45309; font-size: 10.5px; font-weight: 700; }
    .baseline-note { font-size: 11.5px; color: #94a3b8; }
    .reason-note { padding: 0; margin: -4px 0 8px; }
    .reason-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 12px; margin-bottom: 6px; }
    @media (max-width: 640px) { .reason-grid { grid-template-columns: 1fr; } }
    .q-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px 12px; margin-bottom: 6px; }
    .dlg-actions { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 20px 18px; border-top: 1px solid #f1f5f9; margin-top: 8px; }
    .submit-btn { background: #16a34a; color: #fff; }
    .submit-btn:hover { background: #15803d; }
    .submit-btn[disabled] { background: #e2e8f0; color: #94a3b8; }
    @media (max-width: 640px) { .q-grid { grid-template-columns: 1fr 1fr; } .fields-grid { grid-template-columns: 1fr; } }
  `],
})
export class AddKpiDialogComponent {
  readonly quarters = [1, 2, 3, 4];
  saving = signal(false);
  isEdit = false;
  /** Editing a KPI that was returned by the reviewer: offer Save (keep draft) and Submit (re-escalate). */
  isRejected = false;
  /** View-only mode: all fields disabled, no saving. */
  ro = false;
  /** In edit mode, saving is blocked until existing quarterly targets have loaded,
   *  otherwise a failed preload could silently wipe saved targets. */
  targetsReady = signal(true);

  form: Record<string, string | number | boolean | null> = {};
  /** National KPAs from OPMS Configuration; loaded here so the list is always fresh. */
  nkpas = signal<NationalKpa[]>([]);
  /** Departments from Administration > Departments; loaded here so the list is always fresh. */
  departments = signal<{ id: number; name: string }[]>([]);
  customForm: Record<string, string | number | boolean | null> = {};
  isCumulative = false;
  qTargets: Record<number, string> = { 1: '', 2: '', 3: '', 4: '' };
  qEvidence: Record<number, string> = { 1: '', 2: '', 3: '', 4: '' };

  /** Revision mode (revised SDBIP). */
  revisionMode = false;
  /** Per-quarter revision reasons (revision mode, optional notes on baselined changes). */
  qReasons: Record<number, string> = { 1: '', 2: '', 3: '', 4: '' };
  /** Approved-baseline values per quarter (revision mode; null = quarter not baselined). */
  private readonly qBaselines: Record<number, string | null> = { 1: null, 2: null, 3: null, 4: null };
  /** Target values as loaded, per quarter — a reason is only required when the saved value changes. */
  private readonly qLoadedValues: Record<number, string | null> = { 1: null, 2: null, 3: null, 4: null };
  /** Quarters with an approved-baseline row (revision-reason enforcement matches the API). */
  private readonly baselinedQuarters = new Set<number>();
  /** Annual target as loaded, for annual_target_revised audit logging. */
  private loadedAnnualTarget: string | null = null;

  private readonly visibleFields: SdbipFieldConfig[];
  private readonly customFields: SdbipFieldConfig[];
  /** Custom wizard fields that represent quarterly targets/POE, keyed by quarter. */
  private readonly qTargetFields: Record<number, SdbipFieldConfig> = {};
  private readonly qPoeFields: Record<number, SdbipFieldConfig> = {};
  /** Quarters that already have a saved target row (edit mode) — included on save so clears persist. */
  private readonly existingTargetQuarters = new Set<number>();

  constructor(
    public ref: MatDialogRef<AddKpiDialogComponent, ScorecardKpi | null>,
    @Inject(MAT_DIALOG_DATA) public data: AddKpiDialogData,
    private readonly api: ApiService,
    private readonly toast: ToastService,
  ) {
    this.visibleFields = data.fieldConfig.filter((f) => f.fieldKind === 'primary' && f.isIncluded);
    this.customFields = data.fieldConfig.filter((f) => f.fieldKind === 'custom' && f.isIncluded);
    for (const f of this.customFields) {
      const m = /quarter[\s_]*([1-4])[\s_]*(target|poe)/i.exec(f.fieldKey) ?? /quarter[\s_]*([1-4])[\s_]*(target|poe)/i.exec(f.fieldLabel);
      if (!m) continue;
      const q = Number(m[1]);
      if (m[2].toLowerCase() === 'target') this.qTargetFields[q] = f;
      else this.qPoeFields[q] = f;
    }
    this.api.get<NationalKpa[]>('/national-kpas').pipe(
      catchError(() => of([] as NationalKpa[])),
      tap((k) => this.nkpas.set(
        (Array.isArray(k) ? k : [])
          .filter((x) => x.isActive !== false)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
      )),
    ).subscribe();
    this.api.get<{ id: number; name: string }[]>('/departments').pipe(
      catchError(() => of([] as { id: number; name: string }[])),
      tap((d) => this.departments.set(Array.isArray(d) ? d : [])),
    ).subscribe();

    this.ro = data.readOnly ?? false;
    this.revisionMode = data.revision ?? false;
    const k = data.kpi;
    if (k) {
      this.isEdit = true;
      this.isRejected = k.status === 'Draft' && !!k.returnComments;
      this.loadedAnnualTarget = k.annualTarget ?? null;
      this.form = {
        kpiNumber: k.kpiNumber ?? '', description: k.description ?? '',
        idpReference: k.idpReference ?? '', strategicObjective: k.strategicObjective ?? '',
        programme: k.programme ?? '', baseline: k.baseline ?? '',
        annualTarget: k.annualTarget ?? '', weighting: k.weighting ?? 0,
        evidenceSource: k.evidenceSource ?? '', evidencePortfolio: k.evidencePortfolio ?? '',
        fundingSource: k.fundingSource ?? '', budgetDescription: k.budgetDescription ?? '',
        annualBudgetTarget: k.annualBudgetTarget ?? null,
        unitOfMeasureId: k.unitOfMeasureId ?? null,
        responsiblePostId: k.responsiblePostId ?? null,
        custodianPostId: k.custodianPostId ?? null,
      };
      this.customForm = { ...(k.customFields ?? {}) };
      this.isCumulative = k.isCumulative ?? false;
      this.targetsReady.set(false);
      this.api.get<{ quarter: number; targetValue: string; evidenceExpected?: string | null; isApprovedBaseline?: boolean; baselineTargetValue?: string | null }[]>(`/scorecard-kpis/${k.id}/quarter-targets`).pipe(
        tap((rows) => {
          for (const t of (Array.isArray(rows) ? rows : [])) {
            this.qTargets[t.quarter] = t.targetValue ?? '';
            this.qEvidence[t.quarter] = t.evidenceExpected ?? '';
            this.existingTargetQuarters.add(t.quarter);
            this.qLoadedValues[t.quarter] = t.targetValue ?? '';
            if (t.isApprovedBaseline) {
              this.baselinedQuarters.add(t.quarter);
              this.qBaselines[t.quarter] = t.baselineTargetValue ?? t.targetValue ?? '';
            }
          }
          this.targetsReady.set(true);
        }),
        catchError(() => {
          this.toast.error('Could not load quarterly targets', 'Close and reopen the KPI to edit. Saving is disabled to protect existing targets.');
          return of(null);
        }),
      ).subscribe();
    }
  }

  /** Show the person's job profile in brackets after their name, when captured. */
  userLabel(u: User): string {
    return u.jobTitle ? `${u.displayName} (${u.jobTitle})` : u.displayName;
  }

  /** Dropdown choices per user field: active employees sorted by name, plus the
   *  person already assigned on this KPI even if they have since been terminated
   *  (so existing assignments still display; inactive users are never new choices). */
  private readonly userOptsCache = new Map<string, User[]>();
  userOptions(fieldKey: string): User[] {
    const cached = this.userOptsCache.get(fieldKey);
    if (cached) return cached;
    const assigned = this.data.kpi
      ? ((this.data.kpi as unknown as Record<string, unknown>)[fieldKey] as number | null | undefined) ?? null
      : null;
    const opts = (this.data.users ?? [])
      .filter((u) => u.isActive !== false || u.id === assigned)
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
    this.userOptsCache.set(fieldKey, opts);
    return opts;
  }

  /** NKPA custom/wizard fields become a dropdown fed by the OPMS-configured National KPAs. */
  isNkpaField(f: SdbipFieldConfig): boolean {
    return /(^|[^a-z])n?kpa([^a-z]|$)/i.test(f.fieldKey) || /(^|[^a-z])n?kpa([^a-z]|$)/i.test(f.fieldLabel);
  }

  /** Department wizard fields become a dropdown fed by Administration > Departments. */
  isDeptField(f: SdbipFieldConfig): boolean {
    return /department/i.test(f.fieldKey) || /department/i.test(f.fieldLabel);
  }

  private isQuarterField(f: SdbipFieldConfig): boolean {
    return Object.values(this.qTargetFields).includes(f) || Object.values(this.qPoeFields).includes(f);
  }

  qTargetRequired(q: number): boolean { return this.qTargetFields[q]?.isRequired ?? false; }
  qPoeRequired(q: number): boolean { return this.qPoeFields[q]?.isRequired ?? false; }

  // ── Revision mode helpers ──────────────────────────────────────────────
  /** Original approved baseline for a quarter (revision mode), or null if not baselined. */
  baselineFor(q: number): string | null { return this.qBaselines[q]; }

  /** The entered value differs from the approved baseline (drives the "Revised" chip). */
  isRevisedQuarter(q: number): boolean {
    if (!this.revisionMode || !this.baselinedQuarters.has(q)) return false;
    return (this.qTargets[q]?.trim() ?? '') !== (this.qBaselines[q] ?? '').trim();
  }

  /** The saved value would change — an optional per-quarter reason can be noted for these. */
  private isChangedBaselinedQuarter(q: number): boolean {
    if (!this.revisionMode || !this.baselinedQuarters.has(q)) return false;
    return (this.qTargets[q]?.trim() ?? '') !== (this.qLoadedValues[q] ?? '');
  }

  /** Quarters with a changed baselined target (shown with optional reason inputs). */
  reasonQuarters(): number[] {
    return this.quarters.filter((q) => this.isChangedBaselinedQuarter(q));
  }

  /** All wizard fields except the responsible-person select (rendered last, like the mockup)
   *  and quarterly target/POE custom fields (rendered in the dedicated Quarterly Targets section). */
  gridFields(): SdbipFieldConfig[] {
    return [...this.visibleFields, ...this.customFields]
      .filter((f) => f.fieldKey !== 'responsiblePostId' && !this.isQuarterField(f));
  }

  responsibleField(): SdbipFieldConfig | null {
    return this.visibleFields.find((f) => f.fieldKey === 'responsiblePostId') ?? null;
  }

  kind(f: SdbipFieldConfig): string {
    // The KPI number is server-assigned (kept sequential on add/delete/reorder).
    if (f.fieldKind === 'primary' && f.fieldKey === 'kpiNumber') return 'kpiNumberAuto';
    if (f.fieldKey === 'responsiblePostId' || f.fieldKey === 'custodianPostId') return 'userSelect';
    if (f.fieldKey === 'unitOfMeasureId') return 'uomSelect';
    if (this.isNkpaField(f)) return 'nkpaSelect';
    if (this.isDeptField(f)) return 'deptSelect';
    if (f.fieldType === 'boolean') return 'checkbox';
    if (f.fieldType === 'number' || f.fieldType === 'percent') return 'number';
    if (f.fieldType === 'textarea') return 'textarea';
    if (f.fieldType === 'date') return 'date';
    return 'text';
  }

  placeholderFor(f: SdbipFieldConfig): string {
    switch (f.fieldKey) {
      case 'description': return 'e.g. Percentage of roads maintained to acceptable standard';
      case 'baseline': return 'Prior year actual';
      case 'annualTarget': return 'e.g. 100%';
      default: return '';
    }
  }

  private store(f: SdbipFieldConfig): Record<string, string | number | boolean | null> {
    return f.fieldKind === 'custom' ? this.customForm : this.form;
  }
  value(f: SdbipFieldConfig): string | number | boolean | null {
    return this.store(f)[f.fieldKey] ?? null;
  }
  setValue(f: SdbipFieldConfig, v: string | number | boolean | null) {
    this.store(f)[f.fieldKey] = v;
  }

  private isEmpty(v: unknown): boolean {
    return v === null || v === undefined || v === '' || (typeof v === 'number' && Number.isNaN(v));
  }

  missingRequired(): string[] {
    const out: string[] = [];
    for (const f of [...this.visibleFields, ...this.customFields]) {
      if (!f.isRequired || f.fieldType === 'boolean' || this.isQuarterField(f)) continue;
      if (f.fieldKind === 'primary' && f.fieldKey === 'kpiNumber') continue; // auto-assigned by the server
      if (this.isEmpty(this.value(f))) out.push(f.fieldLabel);
    }
    for (const q of this.quarters) {
      if (this.qTargetRequired(q) && !this.qTargets[q]?.trim()) out.push(`Q${q} Target`);
      if (this.qPoeRequired(q) && !this.qEvidence[q]?.trim()) out.push(`Q${q} Portfolio of Evidence`);
    }
    return out;
  }

  save(andSubmit = false) {
    if (this.ro || !this.targetsReady()) return;
    const missing = this.missingRequired();
    if (missing.length > 0) {
      this.toast.error('Missing required fields', missing.join(', '));
      return;
    }
    this.saving.set(true);
    // Mirror the quarterly section into any wizard-configured quarter custom fields
    // so list columns driven by the wizard config still show these values.
    for (const q of this.quarters) {
      const tf = this.qTargetFields[q];
      if (tf) this.customForm[tf.fieldKey] = this.qTargets[q]?.trim() || null;
      const pf = this.qPoeFields[q];
      if (pf) this.customForm[pf.fieldKey] = this.qEvidence[q]?.trim() || null;
    }
    const f = this.form;
    const num = (v: unknown): number | undefined => (this.isEmpty(v) ? undefined : Number(v));
    const str = (v: unknown): string | undefined => (this.isEmpty(v) ? undefined : String(v));
    const payload = {
      kpiNumber: str(f['kpiNumber']) ?? '',
      description: str(f['description']) ?? '',
      annualTarget: str(f['annualTarget']) ?? '',
      idpReference: str(f['idpReference']),
      strategicObjective: str(f['strategicObjective']),
      programme: str(f['programme']),
      baseline: str(f['baseline']),
      weighting: num(f['weighting']) ?? 0,
      evidenceSource: str(f['evidenceSource']),
      evidencePortfolio: str(f['evidencePortfolio']),
      fundingSource: str(f['fundingSource']),
      budgetDescription: str(f['budgetDescription']),
      annualBudgetTarget: num(f['annualBudgetTarget']),
      isCumulative: this.isCumulative,
      unitOfMeasureId: (f['unitOfMeasureId'] as number | null) ?? undefined,
      responsiblePostId: (f['responsiblePostId'] as number | null) ?? undefined,
      custodianPostId: (f['custodianPostId'] as number | null) ?? undefined,
      customFields: this.buildCustomPayload(),
    };
    const targets = this.quarters
      .map((q) => ({
        quarter: q,
        targetValue: this.qTargets[q]?.trim() ?? '',
        targetStatus: 'active' as const,
        evidenceExpected: this.qEvidence[q]?.trim() || undefined,
        revisionReason: this.isChangedBaselinedQuarter(q) ? (this.qReasons[q]?.trim() || undefined) : undefined,
      }))
      // Include quarters that have values, plus (in edit mode) quarters that
      // already have a saved row so clearing a value persists as an overwrite.
      .filter((t) => t.targetValue || t.evidenceExpected || this.existingTargetQuarters.has(t.quarter));
    // Snapshot revision-log entries before the save mutates any state.
    const revisionEntries = this.revisionMode ? this.buildRevisionEntries() : [];

    const kpi$ = this.isEdit && this.data.kpi
      ? this.api.patch<ScorecardKpi>(`/scorecard-kpis/${this.data.kpi.id}`, payload)
      : this.api.post<ScorecardKpi>(`/scorecards/${this.data.scorecardId}/kpis`, payload);

    kpi$.pipe(
      switchMap((saved) => {
        const id = saved?.id ?? (this.isEdit ? this.data.kpi?.id : undefined);
        if (!id || targets.length === 0) return of({ saved, targetsSaved: true });
        return this.api.put(`/scorecard-kpis/${id}/quarter-targets`, { targets }).pipe(
          switchMap(() => of({ saved, targetsSaved: true })),
          catchError((e) => {
            this.toast.error(
              this.isEdit
                ? 'KPI saved, but quarterly targets failed to save. Re-open the KPI to retry.'
                : 'KPI created, but quarterly targets failed to save. Open the KPI to add them.',
              e?.error?.error ?? e?.error?.message ?? e?.message,
            );
            return of({ saved, targetsSaved: false });
          }),
        );
      }),
      switchMap(({ saved, targetsSaved }) => {
        // Record the revision audit trail once the KPI (and its targets) saved.
        // Logging is best-effort: a failed log never blocks the save itself.
        if (!saved?.id || !this.revisionMode || !targetsSaved || revisionEntries.length === 0) {
          return of({ saved, targetsSaved });
        }
        const entries = revisionEntries.map((e) => ({ ...e, kpiId: saved.id }));
        return this.api.post(`/scorecards/${this.data.scorecardId}/revision-logs`, { entries }).pipe(
          switchMap(() => of({ saved, targetsSaved })),
          catchError(() => {
            this.toast.error('KPI saved, but the revision audit trail could not be recorded');
            return of({ saved, targetsSaved });
          }),
        );
      }),
      switchMap(({ saved, targetsSaved }) => {
        if (!saved) return of(null);
        if (andSubmit && targetsSaved && saved.id) {
          return this.api.post<ScorecardKpi>(`/scorecard-kpis/${saved.id}/transition`, { action: 'submit' }).pipe(
            tap(() => { this.toast.success('KPI submitted for review'); this.ref.close(saved); }),
            catchError((e) => {
              this.toast.error('KPI saved, but submitting for review failed', e?.error?.error ?? e?.error?.message ?? e?.message);
              this.ref.close(saved);
              return of(null);
            }),
          );
        }
        if (targetsSaved) this.toast.success(this.isEdit ? 'KPI saved' : 'KPI added');
        // The KPI itself exists either way; close so the list refreshes and the
        // user can open it to retry the quarterly targets (avoids duplicate creation).
        this.ref.close(saved);
        return of(saved);
      }),
      catchError((e) => {
        this.toast.error(this.isEdit ? 'Error saving KPI' : 'Error adding KPI', e?.error?.error ?? e?.error?.message ?? e?.message);
        return of(null);
      }),
      finalize(() => this.saving.set(false)),
    ).subscribe();
  }

  /** Revision audit-trail entries for this save (kpiId is attached after the save). */
  private buildRevisionEntries(): {
    revisionType: string; fieldName?: string; oldValue?: string; newValue?: string;
    revisionReason?: string; quarter?: number;
  }[] {
    const entries: ReturnType<AddKpiDialogComponent['buildRevisionEntries']> = [];
    if (!this.isEdit) {
      entries.push({
        revisionType: 'kpi_added',
        newValue: String(this.form['description'] ?? '').trim() || 'New KPI',
      });
      return entries;
    }
    const newAnnual = String(this.form['annualTarget'] ?? '').trim();
    if (this.loadedAnnualTarget !== null && newAnnual !== (this.loadedAnnualTarget ?? '').trim()) {
      entries.push({
        revisionType: 'annual_target_revised',
        fieldName: 'Annual Target',
        oldValue: this.loadedAnnualTarget ?? undefined,
        newValue: newAnnual || undefined,
      });
    }
    for (const q of this.reasonQuarters()) {
      entries.push({
        revisionType: 'target_revised',
        fieldName: `Q${q} Target`,
        oldValue: this.qLoadedValues[q] ?? undefined,
        newValue: this.qTargets[q]?.trim() || undefined,
        revisionReason: this.qReasons[q]?.trim() || undefined,
        quarter: q,
      });
    }
    return entries;
  }

  private buildCustomPayload(): Record<string, string | number | boolean | null> {
    // Start from everything already stored on the KPI so custom values captured
    // under an older wizard config are preserved on edit (Task #18 behavior).
    const out: Record<string, string | number | boolean | null> = { ...this.customForm };
    for (const def of this.customFields) {
      const v = this.customForm[def.fieldKey];
      out[def.fieldKey] = v === undefined || v === '' ? null : v;
    }
    return out;
  }

  trackById(_: number, x: { id: number }): number { return x.id; }
  trackByFieldKey(_: number, f: SdbipFieldConfig): string { return f.fieldKind + ':' + f.fieldKey; }
}
