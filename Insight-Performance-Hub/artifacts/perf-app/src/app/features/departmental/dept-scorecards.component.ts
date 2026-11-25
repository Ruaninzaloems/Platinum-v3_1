import { ChangeDetectionStrategy, Component, Inject, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { catchError, finalize, forkJoin, of, tap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import { ConfirmService } from '@core/services/confirm.service';
import { SdbipFieldConfigService } from '@core/services/sdbip-field-config.service';
import { Cycle, Scorecard, SdbipFieldConfig, UnitOfMeasure } from '@core/models/domain.model';
import { User } from '@core/models/user.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

export interface DeptScorecard {
  id: number;
  cycleId: number;
  name: string;
  departmentId: number;
  departmentName: string;
  parentScorecardId?: number | null;
  status: string;
}

export interface DeptScorecardKpi {
  id: number;
  deptScorecardId: number;
  kpiNumber: string;
  description: string;
  annualTarget?: string | null;
  weighting: number;
  isInherited?: boolean;
  customFields?: Record<string, string | number | boolean | null> | null;
}

interface CreateForm {
  name: string;
  departmentId: number;
  departmentName: string;
  parentScorecardId: number;
}

// ─── Create Scorecard Dialog ───────────────────────────────────────────────
@Component({
  selector: 'app-create-dept-scorecard-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>New Departmental Scorecard</h2>
    <mat-dialog-content class="content">
      <mat-form-field appearance="outline" class="full">
        <mat-label>Name</mat-label>
        <input matInput [(ngModel)]="form.name" name="name" required />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Department Name</mat-label>
        <input matInput [(ngModel)]="form.departmentName" name="departmentName" required />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Department ID</mat-label>
        <input matInput type="number" [(ngModel)]="form.departmentId" name="departmentId" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Parent Org Scorecard</mat-label>
        <mat-select [(ngModel)]="form.parentScorecardId" name="parentScorecardId">
          <mat-option [value]="0">None</mat-option>
          <mat-option *ngFor="let s of data.orgScorecards" [value]="s.id">{{ s.name }}</mat-option>
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" type="button"
              [disabled]="!form.name.trim() || !form.departmentName.trim()"
              (click)="ref.close(form)">Create</button>
    </mat-dialog-actions>
  `,
  styles: [`.content { display:flex; flex-direction: column; gap: 4px; padding-top: 12px !important; min-width: 460px; } .full, mat-form-field { width: 100%; }`],
})
export class CreateDeptScorecardDialogComponent {
  form: CreateForm = { name: '', departmentId: 1, departmentName: '', parentScorecardId: 0 };
  constructor(
    public ref: MatDialogRef<CreateDeptScorecardDialogComponent, CreateForm | null>,
    @Inject(MAT_DIALOG_DATA) public data: { orgScorecards: Scorecard[] },
  ) {}
}

// ─── Add KPI Dialog (driven by Scorecard Wizard field configuration) ──────
export interface AddDeptKpiDialogData {
  fieldConfig: SdbipFieldConfig[];
  users: User[];
  uoms: UnitOfMeasure[];
  kpi?: DeptScorecardKpi;
}

export interface AddDeptKpiResult {
  values: Record<string, string | number | boolean | null>;
  customFields: Record<string, string | number | boolean | null>;
}

@Component({
  selector: 'app-add-dept-kpi-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit Departmental KPI' : 'Add Departmental KPI' }}</h2>
    <mat-dialog-content class="content">
      <ng-container *ngFor="let f of primaryFields; trackBy: trackByKey">
        <ng-container [ngSwitch]="controlKind(f)">
          <mat-form-field *ngSwitchCase="'kpiNumberAuto'" appearance="outline" class="full">
            <mat-label>{{ f.fieldLabel }}</mat-label>
            <input matInput [ngModel]="values[f.fieldKey]" [name]="f.fieldKey" disabled
                   placeholder="Auto-assigned"
                   title="KPI numbers are assigned automatically to stay sequential" />
          </mat-form-field>
          <mat-form-field *ngSwitchCase="'userSelect'" appearance="outline" class="full">
            <mat-label>{{ f.fieldLabel }}{{ f.isRequired ? ' *' : '' }}</mat-label>
            <mat-select [(ngModel)]="values[f.fieldKey]" [name]="f.fieldKey">
              <mat-option [value]="null">— None —</mat-option>
              <mat-option *ngFor="let u of data.users" [value]="u.id">{{ u.displayName }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field *ngSwitchCase="'uomSelect'" appearance="outline" class="full">
            <mat-label>{{ f.fieldLabel }}{{ f.isRequired ? ' *' : '' }}</mat-label>
            <mat-select [(ngModel)]="values[f.fieldKey]" [name]="f.fieldKey">
              <mat-option [value]="null">— None —</mat-option>
              <mat-option *ngFor="let u of data.uoms" [value]="u.id">{{ u.name }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field *ngSwitchCase="'number'" appearance="outline" class="full">
            <mat-label>{{ f.fieldLabel }}{{ f.isRequired ? ' *' : '' }}</mat-label>
            <input matInput type="number" [(ngModel)]="values[f.fieldKey]" [name]="f.fieldKey" />
          </mat-form-field>
          <mat-form-field *ngSwitchCase="'textarea'" appearance="outline" class="full">
            <mat-label>{{ f.fieldLabel }}{{ f.isRequired ? ' *' : '' }}</mat-label>
            <textarea matInput rows="2" [(ngModel)]="values[f.fieldKey]" [name]="f.fieldKey"></textarea>
          </mat-form-field>
          <div *ngSwitchCase="'checkbox'" class="check-row">
            <mat-checkbox [(ngModel)]="values[f.fieldKey]" [name]="f.fieldKey">{{ f.fieldLabel }}</mat-checkbox>
          </div>
          <mat-form-field *ngSwitchCase="'date'" appearance="outline" class="full">
            <mat-label>{{ f.fieldLabel }}{{ f.isRequired ? ' *' : '' }}</mat-label>
            <input matInput type="date" [(ngModel)]="values[f.fieldKey]" [name]="f.fieldKey" />
          </mat-form-field>
          <mat-form-field *ngSwitchDefault appearance="outline" class="full">
            <mat-label>{{ f.fieldLabel }}{{ f.isRequired ? ' *' : '' }}</mat-label>
            <input matInput [(ngModel)]="values[f.fieldKey]" [name]="f.fieldKey" />
          </mat-form-field>
        </ng-container>
      </ng-container>

      <ng-container *ngFor="let f of customFields; trackBy: trackByKey">
        <ng-container [ngSwitch]="controlKind(f)">
          <mat-form-field *ngSwitchCase="'number'" appearance="outline" class="full">
            <mat-label>{{ f.fieldLabel }}{{ f.isRequired ? ' *' : '' }}</mat-label>
            <input matInput type="number" [(ngModel)]="custom[f.fieldKey]" [name]="'c_' + f.fieldKey" />
          </mat-form-field>
          <mat-form-field *ngSwitchCase="'textarea'" appearance="outline" class="full">
            <mat-label>{{ f.fieldLabel }}{{ f.isRequired ? ' *' : '' }}</mat-label>
            <textarea matInput rows="2" [(ngModel)]="custom[f.fieldKey]" [name]="'c_' + f.fieldKey"></textarea>
          </mat-form-field>
          <mat-form-field *ngSwitchCase="'date'" appearance="outline" class="full">
            <mat-label>{{ f.fieldLabel }}{{ f.isRequired ? ' *' : '' }}</mat-label>
            <input matInput type="date" [(ngModel)]="custom[f.fieldKey]" [name]="'c_' + f.fieldKey" />
          </mat-form-field>
          <div *ngSwitchCase="'checkbox'" class="check-row">
            <mat-checkbox [(ngModel)]="custom[f.fieldKey]" [name]="'c_' + f.fieldKey">{{ f.fieldLabel }}</mat-checkbox>
          </div>
          <mat-form-field *ngSwitchDefault appearance="outline" class="full">
            <mat-label>{{ f.fieldLabel }}{{ f.isRequired ? ' *' : '' }}</mat-label>
            <input matInput [(ngModel)]="custom[f.fieldKey]" [name]="'c_' + f.fieldKey" />
          </mat-form-field>
        </ng-container>
      </ng-container>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" type="button"
              [disabled]="!canSubmit()"
              (click)="submit()">{{ isEdit ? 'Save' : 'Add' }}</button>
    </mat-dialog-actions>
  `,
  styles: [`.content { display:flex; flex-direction: column; gap: 4px; padding-top: 12px !important; min-width: 460px; } .full, mat-form-field { width: 100%; } .check-row { padding: 4px 0 12px; }`],
})
export class AddDeptKpiDialogComponent {
  primaryFields: SdbipFieldConfig[];
  customFields: SdbipFieldConfig[];
  values: Record<string, string | number | boolean | null> = {};
  custom: Record<string, string | number | boolean | null> = {};
  isEdit = false;

  constructor(
    public ref: MatDialogRef<AddDeptKpiDialogComponent, AddDeptKpiResult | null>,
    @Inject(MAT_DIALOG_DATA) public data: AddDeptKpiDialogData,
  ) {
    const cfg = data.fieldConfig ?? [];
    this.primaryFields = SdbipFieldConfigService.visiblePrimary(cfg);
    this.customFields = SdbipFieldConfigService.customFields(cfg);
    if (this.primaryFields.length === 0) {
      this.primaryFields = [
        { id: 0, sdbipType: 'departmental', fieldKind: 'primary', fieldKey: 'kpiNumber', fieldLabel: 'Number', fieldType: 'text', isIncluded: true, isRequired: true, isLocked: true, sortOrder: 0 },
        { id: 0, sdbipType: 'departmental', fieldKind: 'primary', fieldKey: 'description', fieldLabel: 'Description', fieldType: 'textarea', isIncluded: true, isRequired: true, isLocked: true, sortOrder: 1 },
        { id: 0, sdbipType: 'departmental', fieldKind: 'primary', fieldKey: 'annualTarget', fieldLabel: 'Annual Target', fieldType: 'text', isIncluded: true, isRequired: true, isLocked: true, sortOrder: 2 },
        { id: 0, sdbipType: 'departmental', fieldKind: 'primary', fieldKey: 'weighting', fieldLabel: 'Weighting (%)', fieldType: 'number', isIncluded: true, isRequired: false, isLocked: false, sortOrder: 3 },
      ];
    }
    for (const f of this.primaryFields) this.values[f.fieldKey] = f.fieldType === 'boolean' ? false : null;
    for (const f of this.customFields) this.custom[f.fieldKey] = f.fieldType === 'boolean' ? false : null;

    if (data.kpi) {
      this.isEdit = true;
      const kpi = data.kpi as unknown as Record<string, string | number | boolean | null | undefined>;
      for (const f of this.primaryFields) {
        const v = kpi[f.fieldKey];
        if (v !== undefined && v !== null) this.values[f.fieldKey] = v;
      }
      const cf = data.kpi.customFields ?? {};
      for (const f of this.customFields) {
        const v = cf[f.fieldKey];
        if (v !== undefined && v !== null) this.custom[f.fieldKey] = v;
      }
    }
  }

  controlKind(f: SdbipFieldConfig): string {
    // The KPI number is server-assigned (inherited KPIs keep the org number;
    // the department's own KPIs are numbered PREFIX-1..N automatically).
    if (f.fieldKind === 'primary' && f.fieldKey === 'kpiNumber') return 'kpiNumberAuto';
    if (f.fieldKey === 'responsiblePostId') return 'userSelect';
    if (f.fieldKey === 'unitOfMeasureId') return 'uomSelect';
    if (f.fieldType === 'boolean') return 'checkbox';
    if (f.fieldType === 'number') return 'number';
    if (f.fieldType === 'percent') return 'number';
    if (f.fieldType === 'textarea') return 'textarea';
    if (f.fieldType === 'date') return 'date';
    return 'text';
  }

  private isEmpty(v: unknown): boolean {
    return v === null || v === undefined || v === '' || (typeof v === 'number' && Number.isNaN(v));
  }

  canSubmit(): boolean {
    for (const f of this.primaryFields) {
      if (f.fieldKind === 'primary' && f.fieldKey === 'kpiNumber') continue; // auto-assigned by the server
      if (f.isRequired && f.fieldType !== 'boolean' && this.isEmpty(this.values[f.fieldKey])) return false;
    }
    for (const f of this.customFields) {
      if (f.isRequired && f.fieldType !== 'boolean' && this.isEmpty(this.custom[f.fieldKey])) return false;
    }
    return true;
  }

  submit() {
    if (!this.canSubmit()) return;
    this.ref.close({ values: { ...this.values }, customFields: { ...this.custom } });
  }

  trackByKey(_: number, f: SdbipFieldConfig): string { return f.fieldKind + ':' + f.fieldKey; }
}

// ─── Main Page ─────────────────────────────────────────────────────────────
@Component({
  selector: 'app-dept-scorecards',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatSelectModule,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <app-page-header title="Departmental Scorecards" subtitle="Create and manage departmental performance scorecards" icon="grid_view" tone="indigo">
        <mat-form-field appearance="outline" class="cpick">
          <mat-label>Cycle</mat-label>
          <mat-select [ngModel]="selectedCycleId()" (ngModelChange)="onCycle($event)">
            <mat-option *ngFor="let c of cycles()" [value]="c.id">{{ c.financialYearLabel }}</mat-option>
          </mat-select>
        </mat-form-field>
        <button mat-flat-button color="primary"
                *ngIf="selectedCycleId() && !selectedScId()"
                (click)="openCreate()">
          <mat-icon>add</mat-icon> New Scorecard
        </button>
      </app-page-header>

      <!-- List view -->
      <ng-container *ngIf="!selectedScId(); else detail">
        <div class="grid-cards" *ngIf="scorecards().length; else emptyList">
          <button type="button" class="plat-card sc-card" *ngFor="let sc of scorecards()" (click)="selectSc(sc.id)">
            <div class="sc-head">
              <span class="sc-name">{{ sc.name }}</span>
              <span class="badge" [class]="badgeClass(sc.status)">{{ sc.status }}</span>
            </div>
            <p class="muted">{{ sc.departmentName }}</p>
          </button>
        </div>
        <ng-template #emptyList>
          <div class="empty" *ngIf="selectedCycleId()">No departmental scorecards yet. Create one to get started.</div>
          <div class="empty" *ngIf="!selectedCycleId()">Select a cycle to view departmental scorecards.</div>
        </ng-template>
      </ng-container>

      <!-- Detail view -->
      <ng-template #detail>
        <div class="detail">
          <div class="detail-head">
            <button mat-button type="button" (click)="back()"><mat-icon>arrow_back</mat-icon> Back</button>
            <h2>{{ selectedSc()?.name }}</h2>
            <span class="badge" [class]="badgeClass(selectedSc()?.status || '')">{{ selectedSc()?.status }}</span>
            <span class="weight">Total Weighting:
              <strong [class.ok]="weightOk()" [class.bad]="!weightOk()">{{ totalWeight().toFixed(1) }}%</strong>
            </span>
          </div>

          <div class="actions" *ngIf="selectedSc() as sc">
            <ng-container *ngIf="sc.status === 'Draft'">
              <button mat-stroked-button type="button" (click)="inheritKpis()"><mat-icon>download</mat-icon> Inherit Org KPIs</button>
              <button mat-stroked-button type="button" (click)="openAddKpi()"><mat-icon>add</mat-icon> Add KPI</button>
              <button mat-flat-button color="primary" type="button" (click)="transition('submit')"><mat-icon>send</mat-icon> Submit</button>
            </ng-container>
            <ng-container *ngIf="sc.status === 'Submitted'">
              <button mat-flat-button color="primary" type="button" (click)="transition('approve')"><mat-icon>check</mat-icon> Approve</button>
              <button mat-stroked-button type="button" (click)="transition('return')"><mat-icon>arrow_back</mat-icon> Return</button>
            </ng-container>
            <ng-container *ngIf="sc.status === 'Approved'">
              <button mat-flat-button color="primary" type="button" (click)="transition('lock')"><mat-icon>lock</mat-icon> Lock</button>
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
                  <span>Target: {{ kpi.annualTarget }}</span>
                  <span>Weight: {{ kpi.weighting }}%</span>
                  <span *ngFor="let e of customEntries(kpi)">{{ e.label }}: {{ e.value }}</span>
                </div>
              </div>
              <div class="kpi-actions" *ngIf="selectedSc()?.status === 'Draft'">
                <button mat-icon-button type="button" (click)="openEditKpi(kpi)" aria-label="Edit KPI">
                  <mat-icon class="edit">edit</mat-icon>
                </button>
                <button mat-icon-button type="button"
                        *ngIf="!kpi.isInherited"
                        (click)="deleteKpi(kpi)" aria-label="Delete KPI">
                  <mat-icon class="del">delete</mat-icon>
                </button>
              </div>
            </div>
          </div>
          <ng-template #emptyKpis>
            <div class="empty">No KPIs yet. Inherit from organisational scorecard or add manually.</div>
          </ng-template>
        </div>
      </ng-template>
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
    .b-draft { background: #f1f5f9; color: #475569; }
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
    .del { color: #ef4444; }
    .edit { color: #64748b; }
    .kpi-actions { display: flex; gap: 4px; }
  `],
})
export class DeptScorecardsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);
  private readonly confirm = inject(ConfirmService);
  private readonly fieldConfigApi = inject(SdbipFieldConfigService);

  fieldConfig = signal<SdbipFieldConfig[]>([]);
  users = signal<User[]>([]);
  uoms = signal<UnitOfMeasure[]>([]);
  cycles = signal<Cycle[]>([]);
  scorecards = signal<DeptScorecard[]>([]);
  orgScorecards = signal<Scorecard[]>([]);
  kpis = signal<DeptScorecardKpi[]>([]);
  selectedCycleId = signal<number | null>(null);
  selectedScId = signal<number | null>(null);

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
    this.fieldConfigApi.load('departmental').pipe(
      catchError(() => of([] as SdbipFieldConfig[])),
    ).subscribe((rows) => this.fieldConfig.set(rows));
    this.api.get<User[]>('/auth/users').pipe(
      catchError(() => of([] as User[])),
    ).subscribe((u) => this.users.set(Array.isArray(u) ? u : []));
    this.api.get<UnitOfMeasure[]>('/units-of-measure').pipe(
      catchError(() => of([] as UnitOfMeasure[])),
    ).subscribe((u) => this.uoms.set(Array.isArray(u) ? u : []));
  }

  customEntries(kpi: DeptScorecardKpi): { label: string; value: string }[] {
    return SdbipFieldConfigService.customDisplayEntries(this.fieldConfig(), kpi.customFields);
  }

  badgeClass(status: string): string {
    switch (status) {
      case 'Draft': return 'badge b-draft';
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
    if (!cycleId) { this.scorecards.set([]); this.orgScorecards.set([]); return; }
    forkJoin({
      dept: this.api.get<DeptScorecard[]>('/dept-scorecards', { cycleId }).pipe(catchError(() => of([] as DeptScorecard[]))),
      org: this.api.get<Scorecard[]>('/scorecards', { cycleId }).pipe(catchError(() => of([] as Scorecard[]))),
    }).subscribe(({ dept, org }) => {
      this.scorecards.set(Array.isArray(dept) ? dept : []);
      this.orgScorecards.set(Array.isArray(org) ? org : []);
    });
  }

  selectSc(id: number) {
    this.selectedScId.set(id);
    this.loadKpis();
  }

  back() {
    this.selectedScId.set(null);
    this.kpis.set([]);
  }

  loadKpis() {
    const id = this.selectedScId();
    if (!id) { this.kpis.set([]); return; }
    this.api.get<DeptScorecardKpi[]>(`/dept-scorecards/${id}/kpis`).pipe(
      catchError(() => of([] as DeptScorecardKpi[])),
    ).subscribe((rows) => this.kpis.set(Array.isArray(rows) ? rows : []));
  }

  openCreate() {
    const cycleId = this.selectedCycleId();
    if (!cycleId) { this.toast.error('No cycle selected'); return; }
    this.dialog.open(CreateDeptScorecardDialogComponent, {
      panelClass: 'plat-dialog',
      data: { orgScorecards: this.orgScorecards() },
      autoFocus: true,
    }).afterClosed().subscribe((form: CreateForm | undefined) => {
      if (!form || !form.name.trim() || !form.departmentName.trim()) return;
      const payload: Record<string, unknown> = {
        cycleId,
        name: form.name,
        departmentId: form.departmentId,
        departmentName: form.departmentName,
      };
      if (form.parentScorecardId) payload['parentScorecardId'] = form.parentScorecardId;
      this.api.post<DeptScorecard>('/dept-scorecards', payload).pipe(
        tap(() => { this.toast.success('Departmental scorecard created'); this.loadScorecards(); }),
        catchError((e) => { this.toast.error('Error', e?.error?.message ?? e?.message); return of(null); }),
      ).subscribe();
    });
  }

  openAddKpi() {
    const id = this.selectedScId();
    if (!id) return;
    this.dialog.open(AddDeptKpiDialogComponent, {
      panelClass: 'plat-dialog',
      autoFocus: true,
      data: { fieldConfig: this.fieldConfig(), users: this.users(), uoms: this.uoms() } satisfies AddDeptKpiDialogData,
    })
      .afterClosed().subscribe((result: AddDeptKpiResult | undefined) => {
        if (!result) return;
        const v = result.values;
        if (!v['description']) return;
        const payload: Record<string, unknown> = { customFields: result.customFields };
        for (const [key, val] of Object.entries(v)) {
          if (val === null || val === '' || val === undefined) continue;
          payload[key] = key === 'weighting' || key === 'annualBudgetTarget' || key === 'responsiblePostId' || key === 'unitOfMeasureId'
            ? Number(val)
            : val;
        }
        if (payload['weighting'] === undefined) payload['weighting'] = 0;
        if (payload['annualTarget'] === undefined) payload['annualTarget'] = '';
        payload['kpiNumber'] = ''; // assigned by the server (PREFIX-N, kept sequential)
        this.api.post<DeptScorecardKpi>(`/dept-scorecards/${id}/kpis`, payload).pipe(
          tap(() => { this.toast.success('KPI added'); this.loadKpis(); }),
          catchError((e) => { this.toast.error('Error', e?.error?.message ?? e?.message); return of(null); }),
        ).subscribe();
      });
  }

  openEditKpi(kpi: DeptScorecardKpi) {
    this.dialog.open(AddDeptKpiDialogComponent, {
      panelClass: 'plat-dialog',
      autoFocus: true,
      data: { fieldConfig: this.fieldConfig(), users: this.users(), uoms: this.uoms(), kpi } satisfies AddDeptKpiDialogData,
    })
      .afterClosed().subscribe((result: AddDeptKpiResult | undefined) => {
        if (!result) return;
        const v = result.values;
        if (!v['description']) return;
        const payload: Record<string, unknown> = { customFields: result.customFields };
        for (const [key, val] of Object.entries(v)) {
          if (val === null || val === '' || val === undefined) continue;
          if (key === 'kpiNumber') continue; // managed automatically by the server
          payload[key] = key === 'weighting' || key === 'annualBudgetTarget' || key === 'responsiblePostId' || key === 'unitOfMeasureId'
            ? Number(val)
            : val;
        }
        if (payload['weighting'] === undefined) payload['weighting'] = 0;
        if (payload['annualTarget'] === undefined) payload['annualTarget'] = '';
        this.api.patch<DeptScorecardKpi>(`/dept-kpis/${kpi.id}`, payload).pipe(
          tap(() => { this.toast.success('KPI updated'); this.loadKpis(); }),
          catchError((e) => { this.toast.error('Error', e?.error?.message ?? e?.message); return of(null); }),
        ).subscribe();
      });
  }

  inheritKpis() {
    const id = this.selectedScId();
    if (!id) return;
    this.api.post<DeptScorecardKpi[]>(`/dept-scorecards/${id}/inherit-kpis`, {}).pipe(
      tap(() => { this.toast.success('KPIs inherited from organisational scorecard'); this.loadKpis(); }),
      catchError((e) => { this.toast.error('Error', e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }

  transition(action: string) {
    const id = this.selectedScId();
    if (!id) return;
    this.api.post<DeptScorecard>(`/dept-scorecards/${id}/transition`, { action }).pipe(
      tap(() => { this.toast.success(`Scorecard ${action}ed`); this.loadScorecards(); }),
      catchError((e) => { this.toast.error('Error', e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }

  async deleteKpi(kpi: DeptScorecardKpi) {
    const ok = await this.confirm.confirm({
      title: 'Delete KPI',
      message: `Delete KPI "${kpi.kpiNumber}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    this.api.delete(`/dept-kpis/${kpi.id}`).pipe(
      tap(() => { this.toast.success('KPI deleted'); this.loadKpis(); }),
      catchError((e) => { this.toast.error('Error', e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }

  trackById(_: number, x: { id: number }): number { return x.id; }
}
