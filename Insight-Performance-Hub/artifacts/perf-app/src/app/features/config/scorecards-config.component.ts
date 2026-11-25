import { ChangeDetectionStrategy, Component, Inject, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { catchError, finalize, of, tap } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import { ConfirmService } from '@core/services/confirm.service';
import { SdbipFieldConfigService } from '@core/services/sdbip-field-config.service';
import { Cycle, SdbipConfigType, SdbipFieldConfig } from '@core/models/domain.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';

// ─── Custom Field Dialog ───────────────────────────────────────────────────
interface CustomFieldDialogData { entity: SdbipFieldConfig | null; }
interface CustomFieldResult { label: string; fieldType: SdbipFieldConfig['fieldType']; isRequired: boolean; }

@Component({
  selector: 'app-custom-field-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule],
  template: `
    <h2 mat-dialog-title>{{ data.entity ? 'Edit' : 'Add' }} Custom Field</h2>
    <form (ngSubmit)="save()" #f="ngForm">
      <mat-dialog-content class="content">
        <mat-form-field appearance="outline">
          <mat-label>Field Label</mat-label>
          <input matInput [(ngModel)]="model.label" name="label" required placeholder="e.g. Ward Number" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Field Type</mat-label>
          <mat-select [(ngModel)]="model.fieldType" name="fieldType" required>
            <mat-option value="text">Text</mat-option>
            <mat-option value="textarea">Long text</mat-option>
            <mat-option value="alphanumeric">Alpha-numeric</mat-option>
            <mat-option value="number">Number</mat-option>
            <mat-option value="percent">Percentage (%)</mat-option>
            <mat-option value="date">Date</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-slide-toggle [(ngModel)]="model.isRequired" name="isRequired">Mandatory</mat-slide-toggle>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="f.invalid">Save</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`.content { display: flex; flex-direction: column; gap: 8px; padding-top: 12px !important; min-width: 380px; } mat-form-field { width: 100%; }`],
})
export class CustomFieldDialogComponent {
  model: CustomFieldResult;
  constructor(public ref: MatDialogRef<CustomFieldDialogComponent, CustomFieldResult | null>, @Inject(MAT_DIALOG_DATA) public data: CustomFieldDialogData) {
    this.model = {
      label: data.entity?.fieldLabel ?? '',
      fieldType: data.entity?.fieldType ?? 'text',
      isRequired: data.entity?.isRequired ?? false,
    };
  }
  save() {
    if (!this.model.label.trim()) return;
    this.ref.close({ ...this.model });
  }
}

// ─── Scorecard Wizard Dialog (3-step) ──────────────────────────────────────
interface WizardDialogData {
  sdbipType: SdbipConfigType;
  typeLabel: string;
}

@Component({
  selector: 'app-scorecard-wizard-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatSelectModule, MatSlideToggleModule, DragDropModule, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wiz-header">
      <h2><mat-icon class="wiz-icon">auto_fix_high</mat-icon> {{ data.typeLabel }} Scorecard Wizard</h2>
      <button mat-icon-button mat-dialog-close><mat-icon>close</mat-icon></button>
    </div>

    <div class="steps">
      <ng-container *ngFor="let s of stepLabels; let i = index">
        <button type="button" class="step" [class.active]="step() === i" [class.done]="step() > i" (click)="goTo(i)">
          <span class="step-num">{{ i + 1 }}</span>
          <span class="step-label">{{ s }}</span>
        </button>
        <span class="step-line" *ngIf="i < stepLabels.length - 1"></span>
      </ng-container>
    </div>

    <mat-dialog-content class="wiz-content">
      <app-loading-spinner *ngIf="loading()"></app-loading-spinner>

      <ng-container *ngIf="!loading()">
        <!-- Step 1: Primary fields -->
        <ng-container *ngIf="step() === 0">
          <p class="hint">Enable or disable standard KPI fields. Set the <strong>Seq</strong> number to control field order. Locked fields are always included.</p>
          <table class="wiz-table">
            <thead>
              <tr><th>Field</th><th class="c">Include</th><th class="c">Required</th><th class="c">Seq</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let f of primaries(); trackBy: trackByKey" [class.dim]="!f.isIncluded">
                <td>
                  <span class="fname">{{ f.fieldLabel }}</span>
                  <span *ngIf="f.isLocked" class="tag">Mandatory</span>
                </td>
                <td class="c"><mat-slide-toggle [checked]="f.isIncluded" [disabled]="f.isLocked" (change)="setIncluded(f, $event)"></mat-slide-toggle></td>
                <td class="c"><mat-slide-toggle [checked]="f.isRequired" [disabled]="f.isLocked || !f.isIncluded" (change)="setRequired(f, $event.checked)"></mat-slide-toggle></td>
                <td class="c seq">
                  <select *ngIf="f.isIncluded; else noSeq" class="seq-select" [ngModel]="seqOf(f)" (ngModelChange)="setSeq(f, $event)">
                    <option *ngFor="let n of seqOptions()" [ngValue]="n">{{ n }}</option>
                  </select>
                  <ng-template #noSeq><span class="muted">—</span></ng-template>
                </td>
              </tr>
            </tbody>
          </table>
        </ng-container>

        <!-- Step 2: Custom fields -->
        <ng-container *ngIf="step() === 1">
          <p class="hint">Add custom fields for information not covered by the standard KPI columns.</p>
          <div class="custom-empty" *ngIf="customs().length === 0">No custom fields added yet.</div>
          <table class="wiz-table" *ngIf="customs().length > 0">
            <thead>
              <tr><th>Field</th><th>Type</th><th class="c">Required</th><th class="c actions">Actions</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let f of customs(); let i = index; trackBy: trackByKey">
                <td><span class="fname">{{ f.fieldLabel }}</span></td>
                <td class="muted">{{ typeLabel(f.fieldType) }}</td>
                <td class="c"><mat-slide-toggle [checked]="f.isRequired" (change)="setRequired(f, $event.checked)"></mat-slide-toggle></td>
                <td class="c actions">
                  <button mat-icon-button color="primary" (click)="editCustom(i)" title="Edit"><mat-icon>edit</mat-icon></button>
                  <button mat-icon-button color="warn" (click)="removeCustom(i)" title="Delete"><mat-icon>delete</mat-icon></button>
                </td>
              </tr>
            </tbody>
          </table>
          <button mat-stroked-button color="primary" class="add-btn" (click)="addCustom()"><mat-icon>add</mat-icon> Add Custom Field</button>
        </ng-container>

        <!-- Step 3: Review -->
        <ng-container *ngIf="step() === 2">
          <p class="hint">Review the capture form layout before saving. <strong>Drag fields</strong> to set the final order.</p>
          <div class="review-box">
            <h4>Form Layout</h4>
            <p class="review-count">{{ formFields().length }} fields <span class="muted">·</span> {{ requiredCount() }} required</p>
            <div class="order-list" cdkDropList (cdkDropListDropped)="dropField($event)">
              <div class="order-item" *ngFor="let f of formFields(); let i = index; trackBy: trackByKey" cdkDrag cdkDragLockAxis="y">
                <mat-icon class="drag-handle" cdkDragHandle>drag_indicator</mat-icon>
                <span class="order-num">{{ i + 1 }}.</span>
                <span class="order-label">{{ f.fieldLabel }}<span *ngIf="f.isRequired" class="req">*</span></span>
                <span class="tag" *ngIf="f.fieldKind === 'custom'">Custom · {{ typeLabel(f.fieldType) }}</span>
              </div>
            </div>
          </div>
        </ng-container>
      </ng-container>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="wiz-actions">
      <button mat-button type="button" mat-dialog-close>Cancel</button>
      <button mat-stroked-button type="button" *ngIf="step() > 0" (click)="goTo(step() - 1)"><mat-icon>arrow_back</mat-icon> Back</button>
      <button mat-flat-button color="primary" type="button" *ngIf="step() < 2" (click)="goTo(step() + 1)">Next <mat-icon iconPositionEnd>arrow_forward</mat-icon></button>
      <button mat-flat-button color="primary" type="button" *ngIf="step() === 2" [disabled]="saving()" (click)="save()">
        <mat-icon>save</mat-icon> {{ saving() ? 'Saving…' : 'Save Layout' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host { display: block; width: 640px; max-width: 82vw; }
    .wiz-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px 0; }
    .wiz-header h2 { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 18px; font-weight: 600; }
    .wiz-icon { color: #3f51b5; }
    .steps { display: flex; align-items: center; gap: 8px; padding: 14px 20px 4px; }
    .step { display: inline-flex; align-items: center; gap: 8px; border: none; background: transparent; cursor: pointer; padding: 5px 12px; border-radius: 16px; color: #64748b; font-size: 13px; }
    .step.active { background: #2563eb; color: #fff; }
    .step.done { color: #2563eb; }
    .step-num { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; border: 1px solid currentColor; font-size: 11px; font-weight: 600; }
    .step.active .step-num { border-color: rgba(255,255,255,.7); }
    .step-line { flex: 0 0 28px; height: 1px; background: #e2e8f0; }
    .wiz-content { padding: 8px 20px 4px !important; max-height: 58vh; }
    .hint { margin: 4px 0 12px; color: #64748b; font-size: 13px; }
    .wiz-table { width: 100%; border-collapse: collapse; }
    .wiz-table th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #94a3b8; font-weight: 600; padding: 8px 10px; background: #f8fafc; }
    .wiz-table td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .wiz-table .c { text-align: center; }
    .wiz-table tr.dim .fname { color: #94a3b8; }
    .fname { font-weight: 500; }
    .tag { display: inline-block; margin-left: 8px; padding: 1px 8px; border-radius: 10px; background: #eef2ff; color: #4338ca; font-size: 11px; font-weight: 500; vertical-align: middle; }
    .seq-select { padding: 3px 6px; border: 1px solid #e2e8f0; border-radius: 6px; background: #fff; font-size: 13px; min-width: 52px; }
    .muted { color: #94a3b8; }
    .custom-empty { padding: 20px 0; color: #94a3b8; font-size: 14px; }
    .add-btn { margin-top: 14px; }
    .actions { white-space: nowrap; }
    .review-box { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; }
    .order-list { display: flex; flex-direction: column; }
    .order-item { display: flex; align-items: center; gap: 8px; padding: 7px 8px; border-bottom: 1px solid #f1f5f9; background: #fff; font-size: 13px; color: #334155; border-radius: 6px; }
    .order-item:last-child { border-bottom: none; }
    .drag-handle { cursor: grab; color: #94a3b8; font-size: 18px; width: 18px; height: 18px; flex: 0 0 auto; }
    .order-num { color: #94a3b8; min-width: 20px; text-align: right; }
    .order-label { font-weight: 500; }
    .order-item .tag { margin-left: auto; }
    .order-item.cdk-drag-preview { box-shadow: 0 6px 18px rgba(15, 23, 42, .18); border: 1px solid #e2e8f0; }
    .order-item.cdk-drag-placeholder { opacity: .35; }
    .cdk-drop-list-dragging .order-item:not(.cdk-drag-placeholder) { transition: transform 200ms ease; }
    .review-box h4 { margin: 0 0 4px; font-size: 13px; font-weight: 600; }
    .review-count { margin: 0 0 8px; color: #64748b; font-size: 13px; }
    .review-list { margin: 0; padding-left: 18px; font-size: 13px; color: #334155; }
    .review-list li { padding: 2px 0; }
    .req { color: #ef4444; margin-left: 2px; }
    .wiz-actions { padding: 10px 20px 16px !important; gap: 8px; }
  `],
})
export class ScorecardWizardDialogComponent {
  private readonly fieldConfig = inject(SdbipFieldConfigService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly confirmService = inject(ConfirmService);

  readonly stepLabels = ['Primary Fields', 'Custom Fields', 'Review'];
  step = signal(0);
  loading = signal(true);
  saving = signal(false);
  fields = signal<SdbipFieldConfig[]>([]);

  primaries = computed(() => this.fields().filter((f) => f.fieldKind === 'primary'));
  customs = computed(() => this.fields().filter((f) => f.fieldKind === 'custom'));
  includedPrimaries = computed(() => this.primaries().filter((f) => f.isIncluded));
  formFields = computed(() => this.fields().filter((f) => f.isIncluded));
  requiredCount = computed(() => this.formFields().filter((f) => f.isRequired).length);
  seqOptions = computed(() => this.includedPrimaries().map((_, i) => i + 1));

  constructor(
    public ref: MatDialogRef<ScorecardWizardDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: WizardDialogData,
  ) {
    this.fieldConfig.load(data.sdbipType).pipe(
      catchError(() => of([] as SdbipFieldConfig[])),
      finalize(() => this.loading.set(false)),
    ).subscribe((rows) => this.fields.set(rows));
  }

  goTo(i: number) { this.step.set(Math.max(0, Math.min(2, i))); }

  seqOf(f: SdbipFieldConfig): number {
    return this.includedPrimaries().findIndex((x) => x.fieldKey === f.fieldKey) + 1;
  }

  setSeq(f: SdbipFieldConfig, seq: number) {
    const included = this.includedPrimaries();
    const from = included.findIndex((x) => x.fieldKey === f.fieldKey);
    const to = seq - 1;
    if (from < 0 || to < 0 || from === to || to >= included.length) return;
    const reordered = [...included];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    // Rebuild primaries: included fields in new order, excluded fields keep original relative order at the end
    const excluded = this.primaries().filter((x) => !x.isIncluded);
    this.fields.set([...reordered, ...excluded, ...this.customs()]);
  }

  dropField(event: CdkDragDrop<SdbipFieldConfig[]>) {
    if (event.previousIndex === event.currentIndex) return;
    const form = [...this.formFields()];
    moveItemInArray(form, event.previousIndex, event.currentIndex);
    const excluded = this.fields().filter((f) => !f.isIncluded);
    this.fields.set([...form, ...excluded]);
  }

  private replaceField(f: SdbipFieldConfig, patch: Partial<SdbipFieldConfig>) {
    this.fields.set(this.fields().map((x) =>
      x.fieldKind === f.fieldKind && x.fieldKey === f.fieldKey ? { ...x, ...patch } : x,
    ));
  }

  async setIncluded(f: SdbipFieldConfig, event: MatSlideToggleChange) {
    const checked = event.checked;
    if (!checked) {
      const count = await this.fieldUsageCount(f);
      if (count > 0) {
        const ok = await this.confirmService.confirm({
          title: `Hide "${f.fieldLabel}"?`,
          message: `${count} KPI${count === 1 ? ' already holds' : 's already hold'} data for this field. Hiding it will make that data invisible on capture forms (the data itself is kept). Continue?`,
          confirmLabel: 'Hide Field',
          destructive: true,
        });
        if (!ok) {
          event.source.checked = true;
          return;
        }
      }
    }
    this.replaceField(f, { isIncluded: checked, isRequired: checked ? f.isRequired : false });
  }

  private async fieldUsageCount(field: SdbipFieldConfig): Promise<number> {
    try {
      const usage = await firstValueFrom(this.fieldConfig.usage(this.data.sdbipType));
      return usage[`${field.fieldKind}:${field.fieldKey}`] ?? 0;
    } catch {
      return 0;
    }
  }

  setRequired(f: SdbipFieldConfig, checked: boolean) {
    this.replaceField(f, { isRequired: checked });
  }

  typeLabel(t: string): string {
    const map: Record<string, string> = {
      text: 'Text', number: 'Number', date: 'Date', boolean: 'Yes / No',
      textarea: 'Long text', select: 'Selection', alphanumeric: 'Alpha-numeric', percent: 'Percentage (%)',
    };
    return map[t] ?? t;
  }

  addCustom() {
    this.dialog.open(CustomFieldDialogComponent, {
      data: { entity: null } satisfies CustomFieldDialogData,
      panelClass: 'plat-dialog',
      autoFocus: false,
    }).afterClosed().subscribe((r: CustomFieldResult | undefined) => {
      if (!r) return;
      const key = 'cf_' + r.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      if (!key || key === 'cf_') { this.toast.error('Invalid field name'); return; }
      if (this.customs().some((f) => f.fieldKey === key)) {
        this.toast.error('A custom field with this name already exists');
        return;
      }
      const field: SdbipFieldConfig = {
        id: 0, sdbipType: this.data.sdbipType, fieldKind: 'custom', fieldKey: key,
        fieldLabel: r.label.trim(), fieldType: r.fieldType, isIncluded: true,
        isRequired: r.isRequired, isLocked: false, sortOrder: this.fields().length,
      };
      this.fields.set([...this.fields(), field]);
    });
  }

  editCustom(i: number) {
    const f = this.customs()[i];
    if (!f) return;
    this.dialog.open(CustomFieldDialogComponent, {
      data: { entity: f } satisfies CustomFieldDialogData,
      panelClass: 'plat-dialog',
      autoFocus: false,
    }).afterClosed().subscribe((r: CustomFieldResult | undefined) => {
      if (!r) return;
      this.replaceField(f, { fieldLabel: r.label.trim(), fieldType: r.fieldType, isRequired: r.isRequired });
    });
  }

  async removeCustom(i: number) {
    const f = this.customs()[i];
    if (!f) return;
    const count = await this.fieldUsageCount(f);
    if (count > 0) {
      const ok = await this.confirmService.confirm({
        title: `Delete "${f.fieldLabel}"?`,
        message: `${count} KPI${count === 1 ? ' already holds' : 's already hold'} data for this field. Deleting it will make that data invisible everywhere in the app. Continue?`,
        confirmLabel: 'Delete Field',
        destructive: true,
      });
      if (!ok) return;
    }
    this.fields.set(this.fields().filter((x) => !(x.fieldKind === 'custom' && x.fieldKey === f.fieldKey)));
  }

  save() {
    this.saving.set(true);
    const ordered = [...this.formFields(), ...this.fields().filter((f) => !f.isIncluded)];
    const payload = ordered.map((f, i) => ({
      fieldKind: f.fieldKind, fieldKey: f.fieldKey, fieldLabel: f.fieldLabel,
      fieldType: f.fieldType, isIncluded: f.isIncluded, isRequired: f.isRequired,
      isLocked: f.isLocked, sortOrder: i,
    }));
    this.fieldConfig.save(this.data.sdbipType, payload).pipe(
      tap(() => {
        this.toast.success('Scorecard layout saved');
        this.ref.close(true);
      }),
      catchError((e) => {
        this.toast.error('Save failed', e?.error?.error ?? e?.message);
        return of(null);
      }),
      finalize(() => this.saving.set(false)),
    ).subscribe();
  }

  trackByKey(_: number, f: SdbipFieldConfig): string { return f.fieldKind + ':' + f.fieldKey; }
}

// ─── Main Page ─────────────────────────────────────────────────────────────
interface WizardCard {
  type: SdbipConfigType;
  title: string;
  description: string;
}

@Component({
  selector: 'app-scorecards-config',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatSelectModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <app-page-header title="Scorecard Wizard" subtitle="Define scorecards per cycle and configure which fields appear on each SDBIP capture form." icon="list_alt" tone="indigo">
        <mat-form-field *ngIf="cycles().length > 0" appearance="outline" class="cycle-pick" subscriptSizing="dynamic">
          <mat-label>Cycle</mat-label>
          <mat-select [ngModel]="effectiveCycleId()" (ngModelChange)="selectCycle($event)">
            <mat-option *ngFor="let c of cycles(); trackBy: trackById" [value]="c.id">{{ c.financialYearLabel }}</mat-option>
          </mat-select>
        </mat-form-field>
      </app-page-header>

      <ng-container>
        <div class="plat-card layout-card" *ngFor="let card of wizardCards; trackBy: trackByCard">
          <div class="layout-head">
            <div class="layout-title">
              <mat-icon class="layout-icon">grid_view</mat-icon>
              <div>
                <h3>{{ card.title }} KPI Scorecard Layout</h3>
                <p>{{ card.description }}</p>
              </div>
            </div>
            <button mat-flat-button color="primary" (click)="configure(card)">
              <mat-icon>auto_fix_high</mat-icon> Configure
            </button>
          </div>
        </div>
      </ng-container>
    </section>
  `,
  styles: [`
    .cycle-pick { width: 220px; }
    .layout-card { margin-top: 8px; padding: 8px 16px; }
    .layout-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .layout-title { display: flex; align-items: center; gap: 10px; }
    .layout-icon { color: #3f51b5; font-size: 20px; width: 20px; height: 20px; }
    .layout-title h3 { margin: 0; font-size: 14px; font-weight: 600; }
    .layout-title p { margin: 1px 0 0; color: #64748b; font-size: 12px; }
  `],
})
export class ScorecardsConfigComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(MatDialog);

  readonly wizardCards: WizardCard[] = [
    { type: 'original', title: 'Original SDBIP', description: 'Configure which fields appear in the KPI capture form when adding KPIs to an original SDBIP.' },
    { type: 'revised', title: 'Revised SDBIP', description: 'Configure which fields appear in the KPI capture form when adding KPIs to a revised SDBIP.' },
    { type: 'departmental', title: 'Departmental SDBIP', description: 'Configure which fields appear in the KPI capture form when adding KPIs to a departmental SDBIP.' },
    { type: 'quarterly', title: 'Quarterly Progress Report', description: 'Configure which fields appear when capturing KPIs for the quarterly progress report.' },
    { type: 'midyear', title: 'Mid-year Performance Report', description: 'Configure which fields appear when capturing KPIs for the mid-year performance report.' },
    { type: 'annual', title: 'Annual Performance Report', description: 'Configure which fields appear when capturing KPIs for the annual performance report.' },
  ];

  cycles = signal<Cycle[]>([]);
  selectedCycleId = signal<number | null>(null);
  effectiveCycleId = computed<number | null>(() => this.selectedCycleId() ?? this.cycles()[0]?.id ?? null);

  ngOnInit() {
    this.api.get<Cycle[]>('/cycles').pipe(
      catchError(() => of([] as Cycle[])),
      tap((cs) => this.cycles.set(Array.isArray(cs) ? cs : [])),
    ).subscribe();
  }

  selectCycle(id: number) { this.selectedCycleId.set(id); }

  configure(card: WizardCard) {
    this.dialog.open(ScorecardWizardDialogComponent, {
      data: { sdbipType: card.type, typeLabel: card.title } satisfies WizardDialogData,
      panelClass: 'plat-dialog',
      autoFocus: false,
      maxWidth: '90vw',
    }).afterClosed().subscribe();
  }

  trackById(_: number, x: { id: number }): number { return x.id; }
  trackByCard(_: number, c: WizardCard): string { return c.type; }
}
