import { ChangeDetectionStrategy, Component, Inject, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { catchError, forkJoin, of, tap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import { Cycle, Scorecard, ScorecardKpi } from '@core/models/domain.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import {
  computeAssessment, validateActualFormat, isNonAchievement,
  computeVariance, assessmentBadgeClass, parseNumeric,
} from './assessment.util';

export interface CaptureContext {
  effectiveKpiId: number;
  kpiNumber?: string | null;
  kpiDescription?: string | null;
  uomName: string | null;
  annualTarget: string | null;
  baseline?: string | null;
  strategicObjective?: string | null;
  programme?: string | null;
  idpReference?: string | null;
  evidenceSource?: string | null;
  evidencePortfolio?: string | null;
  technicalIndicator?: string | null;
  risk?: string | null;
  nkpa?: string | null;
  quarterPoe?: Record<number, string | null>;
  weighting?: number | null;
  annualBudgetTarget?: number | null;
  budgetDescription?: string | null;
  fundingSource?: string | null;
  isCumulative?: boolean;
  responsibleOfficialName?: string | null;
  responsibleJobTitle?: string | null;
  departmentName?: string | null;
  divisionName?: string | null;
  scorecardName?: string | null;
  scorecardType?: string | null;
  scorecardStatus?: string | null;
  kpiStatus?: string | null;
  financialYearLabel?: string | null;
  cycleStatus?: string | null;
  targets: { quarter: number; targetValue: string | null; targetStatus: string | null }[];
}

export interface KpiActual {
  id: number;
  kpiId: number;
  periodType?: string;
  quarter: number;
  actualValue: string | null;
  commentary?: string | null;
  status: string;
  reviewLevel?: string | null;
  reviewComments?: string | null;
  isAchieved?: boolean | null;
  assessment?: string | null;
  scorePct?: number | null;
  ratingLevel?: number | null;
  ratingLabel?: string | null;
  qualitativeScorePct?: number | null;
  aiRationale?: string | null;
  isOnHold?: boolean | null;
  onHoldReason?: string | null;
  isLateSubmission?: boolean | null;
  challengeNarrative?: string | null;
  correctiveAction?: string | null;
  underperformanceReason?: string | null;
  overperformanceReason?: string | null;
  budgetImplication?: string | null;
  analysisNotes?: string | null;
  lateOverrideReason?: string | null;
}

export interface EvidenceDoc {
  id: number;
  fileName: string;
  fileSize?: number | null;
  mimeType?: string | null;
  documentType?: string | null;
  description?: string | null;
  verificationStatus: string;
  quarter?: number | null;
  filePath?: string | null;
}

export interface CaptureForm {
  quarter: number;
  actualValue: string;
  commentary: string;
  isOnHold: boolean;
  onHoldReason: string;
  challengeNarrative: string;
  correctiveAction: string;
  underperformanceReason: string;
  overperformanceReason: string;
  budgetImplication: string;
  analysisNotes: string;
  lateOverrideReason: string;
}

interface CaptureKpi extends ScorecardKpi {
  scorecardName?: string | null;
  scorecardType?: string | null;
  responsiblePostName?: string | null;
  responsiblePostJobTitle?: string | null;
  departmentName?: string | null;
  quarterTargets?: { quarter: number; targetValue: string | null }[];
  quarterActuals?: { quarter: number; actualValue: string | null; status: string; reviewLevel?: string | null; reviewComments?: string | null; assessment?: string | null; scorePct?: number | null }[];
}

interface TableColumn {
  key: string;
  label: string;
  wide?: boolean;
}

export interface UploadForm {
  fileName: string;
  documentType: string;
  description: string;
  file: File | null;
}

const REVIEW_LEVEL_LABELS: Record<string, string> = {
  line_manager: 'Line Manager',
  director: 'Director',
  pms_manager: 'PMS Manager',
  pms_director: 'PMS Director',
  internal_audit: 'Internal Audit',
};

const REVIEW_LEVEL_STAGES: Record<string, string> = {
  line_manager: 'Manager Review',
  director: 'Manager Review',
  pms_manager: 'PMS Review',
  pms_director: 'PMS Review',
  internal_audit: 'Internal Audit',
};

export function emptyCaptureForm(): CaptureForm {
  return {
    quarter: 1, actualValue: '', commentary: '', isOnHold: false,
    onHoldReason: '', challengeNarrative: '', correctiveAction: '',
    underperformanceReason: '', overperformanceReason: '',
    budgetImplication: '', analysisNotes: '', lateOverrideReason: '',
  };
}

// ─── Capture Actual Dialog ─────────────────────────────────────────────────
@Component({
  selector: 'app-capture-actual-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule],
  template: `
    <h2 mat-dialog-title>{{ data.editing ? 'Edit Actual' : (data.periodType === 'mid_year' ? 'Capture Mid-Year Actual' : 'Capture Quarterly Actual') }}</h2>
    <mat-dialog-content class="content">
      <div class="grid">
        <mat-form-field appearance="outline" *ngIf="data.periodType !== 'mid_year'">
          <mat-label>Quarter *</mat-label>
          <mat-select [(ngModel)]="form.quarter" name="q" [disabled]="data.editing">
            <mat-option *ngFor="let q of [1,2,3,4]" [value]="q">Q{{ q }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" *ngIf="data.periodType === 'mid_year'">
          <mat-label>Period</mat-label>
          <input matInput value="Mid-Year (Q1–Q2)" disabled />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Actual Value *</mat-label>
          <input matInput [(ngModel)]="form.actualValue" name="av" required />
        </mat-form-field>
      </div>
      <div class="context" *ngIf="data.context as ctx">
        <div class="ctx-item"><span class="ctx-label">Unit of Measure</span><span class="ctx-val">{{ ctx.uomName || '—' }}</span></div>
        <div class="ctx-item"><span class="ctx-label">Quarter Target</span><span class="ctx-val">{{ quarterTarget() || '—' }}</span></div>
        <div class="ctx-item"><span class="ctx-label">Annual Target</span><span class="ctx-val">{{ ctx.annualTarget || '—' }}</span></div>
        <div class="ctx-item"><span class="ctx-label">Prev Quarter Actual</span><span class="ctx-val">{{ prevQuarterActual() || '—' }}</span></div>
        <div class="ctx-item"><span class="ctx-label">YTD</span><span class="ctx-val">{{ ytd() ?? '—' }}</span></div>
        <div class="ctx-item"><span class="ctx-label">Variance</span><span class="ctx-val">{{ variance() || '—' }}</span></div>
      </div>
      <div class="assess-row" *ngIf="data.context">
        <span class="assess-label">Assessment</span>
        <span class="badge" [class]="assessmentClass()">{{ assessment() }}</span>
      </div>
      <p class="error-text" *ngIf="formatError()">{{ formatError() }}</p>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Commentary{{ requiresNarratives() ? ' *' : '' }}</mat-label>
        <textarea matInput rows="2" [(ngModel)]="form.commentary" name="c"></textarea>
      </mat-form-field>
      <div class="checks">
        <mat-checkbox [(ngModel)]="form.isOnHold" name="ih">On Hold</mat-checkbox>
      </div>
      <mat-form-field appearance="outline" class="full" *ngIf="form.isOnHold">
        <mat-label>On Hold Reason</mat-label>
        <textarea matInput rows="2" [(ngModel)]="form.onHoldReason" name="ohr"></textarea>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full" *ngIf="requiresNarratives()">
        <mat-label>Underperformance Reason</mat-label>
        <textarea matInput rows="2" [(ngModel)]="form.underperformanceReason" name="upr"></textarea>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full" *ngIf="assessment() === 'Over Achieved'">
        <mat-label>Overperformance Reason</mat-label>
        <textarea matInput rows="2" [(ngModel)]="form.overperformanceReason" name="opr"></textarea>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Challenge Narrative{{ requiresNarratives() ? ' *' : '' }}</mat-label>
        <textarea matInput rows="2" [(ngModel)]="form.challengeNarrative" name="cn"></textarea>
      </mat-form-field>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Corrective Action{{ requiresNarratives() ? ' *' : '' }}</mat-label>
        <textarea matInput rows="2" [(ngModel)]="form.correctiveAction" name="ca"></textarea>
      </mat-form-field>
      <p class="hint-text" *ngIf="requiresNarratives()">
        Target not achieved: commentary, challenge narrative and corrective action are mandatory.
      </p>
      <div class="grid">
        <mat-form-field appearance="outline">
          <mat-label>Budget Implication</mat-label>
          <input matInput [(ngModel)]="form.budgetImplication" name="bi" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Analysis Notes</mat-label>
          <input matInput [(ngModel)]="form.analysisNotes" name="an" />
        </mat-form-field>
      </div>
      <mat-form-field appearance="outline" class="full" *ngIf="!data.editing">
        <mat-label>Late Override Reason</mat-label>
        <input matInput [(ngModel)]="form.lateOverrideReason" name="lor" placeholder="Required if past deadline" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" type="button"
              [disabled]="!canSave()"
              (click)="ref.close(form)">{{ data.editing ? 'Save Changes' : 'Save Actual' }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .content { min-width: 560px; max-height: 70vh; padding-top: 12px !important; display: flex; flex-direction: column; gap: 4px; }
    .full, mat-form-field { width: 100%; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .checks { display: flex; gap: 24px; padding: 4px 0 12px; }
    .context { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 16px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 8px; }
    .ctx-item { display: flex; flex-direction: column; gap: 2px; }
    .ctx-label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: .02em; }
    .ctx-val { font-size: 13px; color: #1e293b; font-weight: 500; }
    .assess-row { display: flex; align-items: center; gap: 10px; padding: 4px 0 8px; }
    .assess-label { font-size: 12px; color: #64748b; font-weight: 600; }
    .badge { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge.green { background: #dcfce7; color: #15803d; }
    .badge.blue { background: #dbeafe; color: #1d4ed8; }
    .badge.amber { background: #fef3c7; color: #b45309; }
    .badge.red { background: #fee2e2; color: #b91c1c; }
    .badge.purple { background: #f3e8ff; color: #7e22ce; }
    .badge.gray { background: #f1f5f9; color: #475569; }
    .error-text { color: #b91c1c; font-size: 12px; margin: 0 0 8px; }
    .hint-text { color: #b45309; font-size: 12px; margin: 0; }
  `],
})
export class CaptureActualDialogComponent {
  form: CaptureForm;
  constructor(
    public ref: MatDialogRef<CaptureActualDialogComponent, CaptureForm | null>,
    @Inject(MAT_DIALOG_DATA) public data: {
      form: CaptureForm; editing: boolean; periodType?: string;
      context: CaptureContext | null; existingActuals: { quarter: number; actualValue: string | null }[];
    },
  ) { this.form = { ...data.form }; }

  private targetFor(quarter: number) {
    return this.data.context?.targets.find((t) => t.quarter === quarter) ?? null;
  }

  quarterTarget(): string | null {
    return this.targetFor(this.form.quarter)?.targetValue ?? null;
  }

  prevQuarterActual(): string | null {
    if (this.form.quarter <= 1) return null;
    const prev = this.data.existingActuals.find((a) => a.quarter === this.form.quarter - 1);
    return prev?.actualValue ?? null;
  }

  ytd(): string | null {
    let sum = 0;
    let any = false;
    for (const a of this.data.existingActuals) {
      if (a.quarter >= this.form.quarter || !a.actualValue) continue;
      const n = parseNumeric(a.actualValue);
      if (n !== null) { sum += n; any = true; }
    }
    const cur = parseNumeric(this.form.actualValue || '');
    if (cur !== null) { sum += cur; any = true; }
    if (!any) return null;
    return `${Math.round(sum * 100) / 100}`;
  }

  variance(): string | null {
    return computeVariance(this.form.actualValue || null, this.quarterTarget());
  }

  assessment(): string {
    const t = this.targetFor(this.form.quarter);
    return computeAssessment(
      this.form.actualValue || '', t?.targetValue ?? null, t?.targetStatus ?? null,
      this.data.context?.uomName ?? null, this.form.isOnHold,
    );
  }

  assessmentClass(): string {
    return assessmentBadgeClass(this.assessment());
  }

  formatError(): string | null {
    if (!this.form.actualValue.trim()) return null;
    return validateActualFormat(this.form.actualValue, this.data.context?.uomName ?? null);
  }

  requiresNarratives(): boolean {
    return isNonAchievement(this.assessment() as any);
  }

  canSave(): boolean {
    if (!this.form.actualValue.trim()) return false;
    if (this.data.context) {
      if (this.formatError()) return false;
      if (this.requiresNarratives() && (
        !this.form.commentary.trim() || !this.form.challengeNarrative.trim() || !this.form.correctiveAction.trim()
      )) return false;
    }
    return true;
  }
}

// ─── Upload Evidence Dialog ────────────────────────────────────────────────
@Component({
  selector: 'app-upload-evidence-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <div class="dlg-head">
      <div class="dlg-head-icon"><mat-icon>cloud_upload</mat-icon></div>
      <div>
        <h2 class="dlg-title">Upload Evidence</h2>
        <p class="dlg-sub">Proof of evidence for {{ data.periodType === 'mid_year' ? 'Mid-Year' : 'Quarter ' + data.quarter }} · Max 25 MB</p>
      </div>
    </div>
    <mat-dialog-content class="content">
      <input type="file" #fileInput hidden (change)="onFileSelected($event)" />
      <div class="dropzone" [class.has-file]="form.file" [class.dragging]="dragging"
           (click)="!form.file && fileInput.click()"
           (dragover)="$event.preventDefault(); dragging = true"
           (dragleave)="dragging = false"
           (drop)="onDrop($event)">
        <ng-container *ngIf="!form.file; else fileChip">
          <mat-icon class="dz-icon">upload_file</mat-icon>
          <p class="dz-title">Click to browse or drag a file here</p>
          <p class="dz-hint">PDF, Word, Excel or images</p>
        </ng-container>
        <ng-template #fileChip>
          <div class="file-row">
            <mat-icon class="file-icon">description</mat-icon>
            <div class="file-info">
              <span class="file-name">{{ form.file!.name }}</span>
              <span class="file-meta">{{ formatSize(form.file!.size) }} · {{ form.file!.type || 'unknown type' }}</span>
            </div>
            <button type="button" class="file-remove" (click)="clearFile($event)" title="Remove file">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </ng-template>
      </div>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Description</mat-label>
        <input matInput [(ngModel)]="form.description" name="d" placeholder="Brief description of the evidence" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="dlg-actions">
      <button mat-stroked-button type="button" mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" type="button"
              [disabled]="!form.file"
              (click)="ref.close(form)">
        <mat-icon>cloud_upload</mat-icon> Upload
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dlg-head { display: flex; align-items: center; gap: 14px; padding: 20px 24px 4px; }
    .dlg-head-icon {
      width: 42px; height: 42px; border-radius: 10px; flex: none;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%);
      box-shadow: 0 2px 6px rgba(29, 78, 216, .3);
    }
    .dlg-head-icon mat-icon { color: #fff; }
    .dlg-title { margin: 0; font-size: 17px; font-weight: 700; color: #0f172a; }
    .dlg-sub { margin: 2px 0 0; font-size: 12.5px; color: #64748b; }
    .content { min-width: 460px; padding-top: 16px !important; }
    .dropzone {
      border: 2px dashed #cbd5e1; border-radius: 10px; padding: 22px 16px;
      text-align: center; cursor: pointer; margin-bottom: 16px;
      background: #f8fafc; transition: all .15s ease;
    }
    .dropzone:hover, .dropzone.dragging { border-color: #2563eb; background: #eff6ff; }
    .dropzone.has-file { border-style: solid; border-color: #bfdbfe; background: #f8fafc; text-align: left; padding: 12px 14px; cursor: default; }
    .dz-icon { font-size: 32px; width: 32px; height: 32px; color: #2563eb; }
    .dz-title { margin: 6px 0 2px; font-size: 13.5px; font-weight: 600; color: #0f172a; }
    .dz-hint { margin: 0; font-size: 12px; color: #94a3b8; }
    .file-row { display: flex; align-items: center; gap: 12px; }
    .file-icon { color: #2563eb; flex: none; }
    .file-info { display: flex; flex-direction: column; min-width: 0; flex: 1; }
    .file-name { font-size: 13.5px; font-weight: 600; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .file-meta { font-size: 12px; color: #64748b; }
    .file-remove {
      border: none; background: none; cursor: pointer; padding: 4px; border-radius: 6px;
      display: flex; align-items: center; color: #64748b;
    }
    .file-remove:hover { background: #fee2e2; color: #dc2626; }
    .file-remove mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .full { width: 100%; }
    .dlg-actions { padding: 8px 24px 20px; gap: 8px; }
  `],
})
export class UploadEvidenceDialogComponent {
  form: UploadForm = { fileName: '', documentType: '', description: '', file: null };
  dragging = false;
  constructor(
    public ref: MatDialogRef<UploadEvidenceDialogComponent, UploadForm | null>,
    @Inject(MAT_DIALOG_DATA) public data: { quarter: number; periodType?: string },
  ) {}

  onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.setFile(input.files?.[0] ?? null);
    input.value = '';
  }

  onDrop(ev: DragEvent) {
    ev.preventDefault();
    this.dragging = false;
    this.setFile(ev.dataTransfer?.files?.[0] ?? null);
  }

  private setFile(file: File | null) {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      alert('File is too large (max 25 MB)');
      return;
    }
    this.form.file = file;
    this.form.fileName = file.name;
  }

  clearFile(ev: Event) {
    ev.stopPropagation();
    this.form.file = null;
    this.form.fileName = '';
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

// ─── Main Page ─────────────────────────────────────────────────────────────
@Component({
  selector: 'app-submit-actuals',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatSelectModule,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <app-page-header [title]="pageTitle()"
                       [subtitle]="pageSubtitle()"
                       icon="send" tone="blue"></app-page-header>

      <div class="filter-card" *ngIf="!isMidYear()">
        <div class="filter-grid">
          <label class="f-label">Financial Year <span class="req">*</span></label>
          <select class="f-control" [ngModel]="effectiveCycleId()" (ngModelChange)="onCycle($event)">
            <option *ngFor="let c of cycles()" [ngValue]="c.id">{{ c.financialYearLabel }}</option>
          </select>

          <label class="f-label">Responsible Post</label>
          <div class="f-dd">
            <button type="button" class="f-control f-dd-btn" (click)="personOpen = !personOpen">
              <span [class.f-placeholder]="!pendingPerson">{{ pendingPerson || '-- Select --' }}</span>
              <mat-icon class="f-dd-arrow">{{ personOpen ? 'arrow_drop_up' : 'arrow_drop_down' }}</mat-icon>
            </button>
            <div class="f-dd-backdrop" *ngIf="personOpen" (click)="personOpen = false"></div>
            <div class="f-dd-panel" *ngIf="personOpen">
              <div class="f-dd-opt" [class.active]="!pendingPerson" (click)="pickPerson('')">-- Select --</div>
              <div class="f-dd-opt" *ngFor="let p of personOptions()"
                   [class.active]="pendingPerson === p.name" (click)="pickPerson(p.name)">
                <span class="opt-name">{{ p.name }}</span>
                <span class="opt-title" *ngIf="p.jobTitle">{{ p.jobTitle }}</span>
              </div>
            </div>
          </div>

          <label class="f-label">Quarter <span class="req">*</span></label>
          <select class="f-control" [(ngModel)]="pendingQuarter">
            <option [ngValue]="1">Q1</option>
            <option [ngValue]="2">Q2</option>
            <option [ngValue]="3">Q3</option>
            <option [ngValue]="4">Q4</option>
          </select>

          <label class="f-label">Indicator Number</label>
          <input class="f-control" [(ngModel)]="pendingIndicator" />

          <label class="f-label">KPI Source</label>
          <select class="f-control" [(ngModel)]="pendingSource">
            <option [ngValue]="''">Original / Revised SDBIP</option>
            <option [ngValue]="'departmental'">Departmental SDBIP</option>
          </select>

          <span></span>
          <span></span>

          <label class="f-label">Department</label>
          <select class="f-control" [(ngModel)]="pendingDept">
            <option [ngValue]="''">All Departments</option>
            <option *ngFor="let d of departmentOptions()" [ngValue]="d">{{ d }}</option>
          </select>

          <span></span>
          <div class="f-search-row">
            <button mat-flat-button class="search-btn" (click)="applyFilters()">Search</button>
          </div>
        </div>
      </div>

      <div class="filters" *ngIf="isMidYear()">
        <mat-form-field appearance="outline" *ngIf="cycles().length">
          <mat-label>Cycle</mat-label>
          <mat-select [ngModel]="effectiveCycleId()" (ngModelChange)="onCycle($event)">
            <mat-option *ngFor="let c of cycles()" [value]="c.id">{{ c.financialYearLabel }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="stat-cards" *ngIf="!isMidYear() && approvedKpis().length">
        <div class="stat-card green">
          <div class="stat-num"><span class="dot"></span>{{ stats().onTarget }}</div>
          <div class="stat-label">On Target (&ge;100%)</div>
        </div>
        <div class="stat-card amber">
          <div class="stat-num"><span class="dot"></span>{{ stats().atRisk }}</div>
          <div class="stat-label">At Risk (50–99%)</div>
        </div>
        <div class="stat-card red">
          <div class="stat-num"><span class="dot"></span>{{ stats().offTarget }}</div>
          <div class="stat-label">Off Target (&lt;50%)</div>
        </div>
      </div>

      <div class="plat-card empty" *ngIf="!cycleOpen()">
        <mat-icon>lock</mat-icon>
        <p class="bold">Performance cycle is not open</p>
        <p class="muted small">Quarterly actual capture is only available while the performance cycle is open.</p>
      </div>

      <div class="plat-card empty" *ngIf="cycleOpen() && scorecardsLoaded() && !approvedKpis().length">
        <mat-icon>lock</mat-icon>
        <p class="bold">SDBIP not approved</p>
        <p class="muted small" *ngFor="let m of blockedMessages()">{{ m }}</p>
      </div>

      <p class="muted small result-count" *ngIf="!isMidYear() && approvedKpis().length">
        {{ filteredKpis().length }} of {{ approvedKpis().length }} KPIs shown
      </p>

      <div class="plat-card table-card" *ngIf="!isMidYear() && filteredKpis().length">
        <div class="table-scroll">
          <table class="kpi-table">
            <thead>
              <tr>
                <th *ngFor="let col of tableColumns" [class.wide]="col.wide">{{ col.label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let kpi of filteredKpis(); trackBy: trackById"
                  [class.selected]="selectedKpiId() === kpi.id" (click)="openAssessRow(kpi)">
                <td *ngFor="let col of tableColumns" [class.wide]="col.wide"
                    [class.mono]="col.key === 'kpiNumber'">{{ cellValue(kpi, col) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="list" *ngIf="isMidYear() && filteredKpis().length">
        <div class="plat-card kpi" *ngFor="let kpi of filteredKpis(); trackBy: trackById"
             [class.selected]="selectedKpiId() === kpi.id" (click)="selectKpi(kpi.id)">
          <div class="kpi-info">
            <div class="kpi-head">
              <span class="mono">{{ kpi.kpiNumber }}</span>
            </div>
            <p class="kpi-desc">{{ kpi.description }}</p>
            <p class="muted small">Target: {{ kpi.annualTarget }}</p>
          </div>
          <button *ngIf="selectedKpiId() === kpi.id && cycleOpen()" mat-flat-button color="primary"
                  (click)="$event.stopPropagation(); openCapture()">
            <mat-icon>send</mat-icon> Capture Actual
          </button>
        </div>
      </div>

      <div class="grid2" *ngIf="isMidYear() && selectedKpiId() && captureContext() as ctx">
        <div class="plat-card">
          <h4 class="panel-title"><mat-icon class="inline">assignment</mat-icon> Planning Information
            <span class="badge outline tiny"><mat-icon>lock</mat-icon> Read only</span>
          </h4>
          <div class="kv"><span class="muted">Financial Year</span><span class="val">{{ ctx.financialYearLabel ?? '—' }}</span></div>
          <div class="kv"><span class="muted">SDBIP Version</span><span class="val">{{ ctx.scorecardName ?? '—' }}</span></div>
          <div class="kv"><span class="muted">KPI</span><span class="val">{{ ctx.kpiNumber }} — {{ ctx.kpiDescription }}</span></div>
          <div class="kv" *ngIf="ctx.strategicObjective"><span class="muted">Strategic Objective</span><span class="val">{{ ctx.strategicObjective }}</span></div>
          <div class="kv" *ngIf="ctx.technicalIndicator"><span class="muted">Technical Indicator</span><span class="val">{{ ctx.technicalIndicator }}</span></div>
          <div class="kv"><span class="muted">Unit of Measure</span><span class="val">{{ ctx.uomName ?? '—' }}</span></div>
          <div class="kv"><span class="muted">Baseline</span><span class="val">{{ ctx.baseline ?? '—' }}</span></div>
          <div class="kv"><span class="muted">Annual Target</span><span class="val">{{ ctx.annualTarget ?? '—' }}</span></div>
          <div class="kv"><span class="muted">Budget</span><span class="val">{{ budgetLabel(ctx) }}</span></div>
          <div class="kv" *ngIf="ctx.fundingSource"><span class="muted">Funding Source</span><span class="val">{{ ctx.fundingSource }}</span></div>
          <div class="kv"><span class="muted">Means of Verification</span><span class="val">{{ ctx.evidencePortfolio ?? ctx.evidenceSource ?? '—' }}</span></div>
          <div class="kv"><span class="muted">Source of Evidence</span><span class="val">{{ ctx.evidenceSource ?? '—' }}</span></div>
          <div class="kv" *ngIf="ctx.risk"><span class="muted">Risk</span><span class="val">{{ ctx.risk }}</span></div>
          <div class="kv"><span class="muted">Responsible Person</span><span class="val">{{ ctx.responsibleOfficialName ?? '—' }}<ng-container *ngIf="ctx.responsibleJobTitle"> — {{ ctx.responsibleJobTitle }}</ng-container></span></div>
          <div class="kv"><span class="muted">Directorate / Department</span><span class="val">{{ ctx.departmentName ?? '—' }}</span></div>
          <div class="kv" *ngIf="ctx.divisionName"><span class="muted">Division</span><span class="val">{{ ctx.divisionName }}</span></div>
        </div>

        <div class="plat-card">
          <h4 class="panel-title"><mat-icon class="inline">insights</mat-icon> Performance Context</h4>
          <table class="qtable">
            <thead>
              <tr><th>Period</th><th>Target</th><th>Actual</th><th>Assessment</th><th>Variance</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of quarterRows()">
                <td class="mono">{{ row.label }}</td>
                <td>{{ row.target ?? '—' }}</td>
                <td>{{ row.actual ?? '—' }}</td>
                <td><span *ngIf="row.assessment" class="badge" [class]="row.assessClass">{{ row.assessment }}</span><span *ngIf="!row.assessment">—</span></td>
                <td>{{ row.variance ?? '—' }}</td>
              </tr>
            </tbody>
          </table>
          <div class="kv"><span class="muted">Annual Target</span><span class="val">{{ ctx.annualTarget ?? '—' }}</span></div>
          <div class="kv"><span class="muted">Previous Quarter Actual</span><span class="val">{{ prevQuarterActual() ?? '—' }}</span></div>
          <div class="kv"><span class="muted">Year-to-Date Actual</span><span class="val">{{ ytdActual() ?? '—' }}</span></div>
          <div class="kv" *ngIf="quarterPoeFor(ctx) as poe"><span class="muted">Means of Verification (this quarter)</span><span class="val">{{ poe }}</span></div>
        </div>
      </div>

      <div class="actuals" *ngIf="isMidYear() && selectedKpiId() && actuals().length">
        <h3 class="section-title">Actuals & Evidence</h3>
        <div class="plat-card actual" *ngFor="let a of actuals(); trackBy: trackById">
          <div class="actual-top">
            <div>
              <div class="badges">
                <span class="badge outline">{{ isMidYear() ? 'Mid-Year' : 'Q' + a.quarter }}</span>
                <span class="badge" [class]="statusClass(a.status)">{{ a.status }}</span>
                <span class="badge" [class]="assessBadge(a)">
                  {{ a.assessment || (a.isAchieved ? 'Achieved' : 'Not Achieved') }}
                </span>
                <span class="badge amber" *ngIf="a.isLateSubmission">Late</span>
                <span class="badge purple" *ngIf="a.isOnHold">On Hold</span>
                <span class="badge blue" *ngIf="a.reviewLevel && a.status === 'In Review'">
                  <mat-icon>schedule</mat-icon>{{ levelLabel(a.reviewLevel) }}
                </span>
              </div>
              <p class="actual-val">Actual: {{ a.actualValue }}</p>
              <p class="muted small" *ngIf="a.commentary">{{ a.commentary }}</p>
              <div class="return-box" *ngIf="(a.status === 'Returned' || a.status === 'Rejected') && a.reviewComments">
                <span class="bold">{{ a.status === 'Rejected' ? 'Rejection reason:' : 'Return reason:' }}</span> {{ a.reviewComments }}
              </div>
            </div>
            <div class="actions">
              <button mat-button *ngIf="canEdit(a)" (click)="openCapture(a)"><mat-icon>edit</mat-icon> Edit</button>
              <button mat-flat-button color="primary" *ngIf="canEdit(a)" (click)="submitForReview(a)">
                <mat-icon>send</mat-icon> Submit for Review
              </button>
            </div>
          </div>

          <div class="evidence">
            <div class="evidence-head">
              <h4><mat-icon>description</mat-icon> Evidence Documents</h4>
              <button mat-stroked-button *ngIf="canEdit(a)" (click)="openUpload(a)">
                <mat-icon>upload</mat-icon> Upload Evidence
              </button>
            </div>
            <div class="docs" *ngIf="evidenceFor(a.id).length; else noDocs">
              <div class="doc" *ngFor="let doc of evidenceFor(a.id)">
                <div class="doc-info">
                  <mat-icon>insert_drive_file</mat-icon>
                  <div>
                    <p class="bold small">{{ doc.fileName }}</p>
                    <p class="muted xs">
                      Ref EV-{{ doc.id }} · <span *ngIf="doc.documentType">{{ doc.documentType }} · </span>{{ doc.description }}
                    </p>
                  </div>
                </div>
                <div class="doc-actions">
                  <span class="badge" [class]="verifyClass(doc.verificationStatus)">{{ doc.verificationStatus }}</span>
                  <ng-container *ngIf="doc.verificationStatus === 'Pending'">
                    <button mat-icon-button class="green" (click)="verify(doc, 'Verified')"><mat-icon>check_circle</mat-icon></button>
                    <button mat-icon-button class="red" (click)="verify(doc, 'Rejected')"><mat-icon>cancel</mat-icon></button>
                  </ng-container>
                </div>
              </div>
            </div>
            <ng-template #noDocs><p class="muted xs italic">No evidence uploaded yet</p></ng-template>
          </div>
        </div>
      </div>

      <div class="plat-card empty" *ngIf="isMidYear() && selectedKpiId() && !actuals().length">
        <mat-icon>send</mat-icon>
        <p class="bold">No actuals captured yet for this KPI</p>
        <p class="muted small">Click "Capture Actual" above to get started</p>
      </div>
    </section>
  `,
  styles: [`
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0 8px; align-items: start; }
    @media (max-width: 960px) { .grid2 { grid-template-columns: 1fr; } }
    .panel-title { display: flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 600; color: #334155; margin: 0 0 12px; }
    .panel-title .inline { font-size: 18px; width: 18px; height: 18px; color: #64748b; }
    .kv { display: flex; justify-content: space-between; gap: 16px; padding: 5px 0; border-bottom: 1px dashed #f1f5f9; font-size: 13px; }
    .kv:last-child { border-bottom: none; }
    .kv .muted { flex-shrink: 0; }
    .kv .val { color: #1e293b; font-weight: 500; text-align: right; }
    .badge.tiny { font-size: 10px; padding: 1px 8px; }
    .qtable { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 13px; }
    .qtable th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .03em; color: #64748b; padding: 4px 8px; border-bottom: 1px solid #e2e8f0; }
    .qtable td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
    .filter-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; margin-bottom: 10px; }
    .filter-grid { display: grid; grid-template-columns: 140px 1fr 170px 1fr; gap: 8px 12px; align-items: center; }
    @media (max-width: 900px) { .filter-grid { grid-template-columns: 130px 1fr; } }
    .f-label { font-size: 12px; font-weight: 600; color: #475569; text-align: right; white-space: nowrap; }
    .f-label .req { color: #dc2626; }
    .f-control { width: 100%; height: 32px; padding: 0 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; color: #1e293b; background: #fff; box-sizing: border-box; }
    .f-control:focus { outline: 2px solid #3b82f6; outline-offset: -1px; }
    .f-dd { position: relative; }
    .f-dd-btn { display: flex; align-items: center; justify-content: space-between; gap: 8px; cursor: pointer; text-align: left; font-family: inherit; }
    .f-dd-arrow { color: #64748b; font-size: 20px; width: 20px; height: 20px; }
    .f-placeholder { color: #94a3b8; }
    .f-dd-backdrop { position: fixed; inset: 0; z-index: 40; }
    .f-dd-panel { position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 50; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 8px 24px rgba(15,23,42,.12); max-height: 280px; overflow-y: auto; padding: 4px 0; }
    .f-dd-opt { padding: 8px 14px; cursor: pointer; display: flex; flex-direction: column; gap: 1px; font-size: 13px; color: #1e293b; }
    .f-dd-opt:hover { background: #f1f5f9; }
    .f-dd-opt.active { background: #e2e8f0; }
    .opt-name { font-weight: 500; }
    .opt-title { font-size: 11px; color: #64748b; }
    .f-search-row { display: flex; justify-content: flex-start; }
    .search-btn { --mdc-filled-button-container-color: #38bdf8; --mdc-filled-button-label-text-color: #fff; --mdc-filled-button-container-height: 32px; background: #38bdf8 !important; color: #fff !important; border-radius: 6px; font-size: 13px; }
    .table-card { padding: 0; overflow: hidden; margin-bottom: 10px; }
    .table-scroll { overflow-x: auto; overflow-y: auto; max-height: 420px; scrollbar-width: thin; scrollbar-gutter: stable; }
    .table-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
    .table-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    .table-scroll::-webkit-scrollbar-track { background: #f8fafc; }
    .kpi-table thead th { position: sticky; top: 0; z-index: 1; }
    .kpi-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .kpi-table th { text-align: left; font-size: 10.5px; text-transform: uppercase; letter-spacing: .04em; color: #94a3b8; font-weight: 600; padding: 7px 10px; background: #f8fafc; white-space: nowrap; border-bottom: 1px solid #e2e8f0; }
    .kpi-table td { padding: 5px 10px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }
    .kpi-table th.wide, .kpi-table td.wide { min-width: 220px; white-space: normal; }
    .kpi-table td { white-space: nowrap; max-width: 260px; overflow: hidden; text-overflow: ellipsis; }
    .kpi-table td.wide { white-space: normal; overflow: visible; }
    .kpi-table tbody tr { cursor: pointer; }
    .kpi-table tbody tr:hover { background: #f8fafc; }
    .kpi-table tbody tr.selected { background: #eff6ff; }
    .kpi-table .actions-col { text-align: right; white-space: nowrap; }
    .m0 { margin: 0; }
    .assess-card { padding: 14px 18px; margin-bottom: 12px; border-radius: 14px; box-shadow: 0 4px 16px rgba(15,23,42,.06); border: 1px solid #e2e8f0; }
    .assess-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .assess-title { margin: 0 0 2px; font-size: 15px; font-weight: 700; color: #0f172a; letter-spacing: -.01em; }
    .assess-sub { margin: 0; font-size: 12px; color: #64748b; }
    .ana-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 900px) { .ana-grid { grid-template-columns: 1fr; } }
    .lock-banner { display: flex; gap: 10px; align-items: flex-start; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 8px 12px; margin: 10px 0 0; color: #1e40af; }
    .lock-banner mat-icon { font-size: 18px; width: 18px; height: 18px; margin-top: 1px; }
    .lock-banner .muted { color: #3b5bdb; }
    .toggle-row { display: flex; align-items: center; gap: 8px; margin: 10px 0 2px; flex-wrap: wrap; }
    .toggle-label { font-size: 12.5px; color: #475569; margin-right: 18px; }
    .switch { position: relative; display: inline-block; width: 34px; height: 18px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .switch .slider { position: absolute; inset: 0; background: #cbd5e1; border-radius: 999px; transition: .15s; cursor: pointer; }
    .switch .slider::before { content: ''; position: absolute; width: 14px; height: 14px; left: 2px; top: 2px; background: #fff; border-radius: 50%; transition: .15s; box-shadow: 0 1px 2px rgba(0,0,0,.2); }
    .switch input:checked + .slider { background: #3b82f6; }
    .switch input:checked + .slider::before { transform: translateX(16px); }
    .switch input:disabled + .slider { opacity: .5; cursor: default; }
    .assess-section { display: flex; align-items: center; gap: 8px; font-size: 10.5px; text-transform: uppercase; letter-spacing: .06em; color: #3b82f6; font-weight: 700; margin: 14px 0 6px; padding-top: 10px; border-top: 1px solid #f1f5f9; }
    .assess-section::after { content: ''; flex: 1; height: 1px; background: transparent; }
    .fld-label { display: block; font-size: 12px; font-weight: 600; color: #475569; margin: 6px 0 3px; }
    .perf-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 14px; align-items: start; }
    @media (max-width: 900px) { .perf-grid { grid-template-columns: 1fr; } }
    .f-area { width: 100%; padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; color: #1e293b; font-family: inherit; box-sizing: border-box; resize: vertical; transition: border-color .12s, box-shadow .12s; }
    .f-area:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.15); }
    .f-area:disabled, .f-control:disabled { background: #f8fafc; color: #94a3b8; }
    .rating-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; background: #f8fafc; }
    .rating-box.rate-green { background: #f0fdf4; border-color: #bbf7d0; }
    .rating-box.rate-blue { background: #eff6ff; border-color: #bfdbfe; }
    .rating-box.rate-amber { background: #fffbeb; border-color: #fde68a; }
    .rating-box.rate-red { background: #fef2f2; border-color: #fecaca; }
    .rating-box.rate-purple { background: #faf5ff; border-color: #e9d5ff; }
    .rating-top { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 4px; }
    .rating-title { font-size: 13px; font-weight: 700; color: #166534; }
    .rating-box.rate-red .rating-title { color: #b91c1c; }
    .rating-box.rate-amber .rating-title { color: #b45309; }
    .rating-box.rate-blue .rating-title { color: #1d4ed8; }
    .rating-box.rate-purple .rating-title { color: #7e22ce; }
    .rating-box.rate-gray .rating-title { color: #475569; }
    .rating-pct { font-size: 15px; font-weight: 700; color: #0f172a; }
    .poe-req { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 8px 12px; margin-bottom: 10px; }
    .poe-req-label { margin: 0 0 2px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #1e40af; }
    .assess-footer { display: flex; align-items: center; gap: 10px; margin-top: 12px; padding-top: 10px; border-top: 1px solid #f1f5f9; }
    .assess-footer .spacer { flex: 1; }
    .stat-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 10px; }
    @media (max-width: 900px) { .stat-cards { grid-template-columns: 1fr; } }
    .stat-card { border-radius: 10px; padding: 8px 16px; border: 1px solid; display: flex; align-items: center; gap: 10px; }
    .stat-card.green { background: #f0fdf4; border-color: #bbf7d0; }
    .stat-card.amber { background: #fffbeb; border-color: #fde68a; }
    .stat-card.red { background: #fef2f2; border-color: #fecaca; }
    .stat-num { display: flex; align-items: center; gap: 8px; font-size: 20px; font-weight: 700; }
    .stat-card.green .stat-num { color: #16a34a; }
    .stat-card.amber .stat-num { color: #d97706; }
    .stat-card.red .stat-num { color: #dc2626; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
    .stat-label { font-size: 12px; font-weight: 600; margin-top: 0; }
    .stat-card.green .stat-label { color: #15803d; }
    .stat-card.amber .stat-label { color: #b45309; }
    .stat-card.red .stat-label { color: #b91c1c; }
    .result-count { margin: 0 0 4px; font-size: 12px; }
    .filters { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
    .filters mat-form-field { width: 240px; }
    .list { display: flex; flex-direction: column; gap: 12px; }
    .kpi { padding: 16px; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; cursor: pointer; transition: box-shadow .15s; }
    .kpi.selected { outline: 2px solid #3b82f6; }
    .kpi-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .kpi-desc { font-weight: 500; color: #1e293b; margin: 0; }
    .mono { font-family: monospace; font-size: 13px; color: #64748b; }
    .section-title { font-size: 16px; font-weight: 600; color: #334155; margin: 20px 0 8px; }
    .actuals { display: flex; flex-direction: column; gap: 4px; }
    .actual { padding: 18px; margin-bottom: 12px; }
    .actual-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
    .badges { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 8px; }
    .actual-val { font-weight: 500; color: #1e293b; margin: 0; }
    .actions { display: flex; gap: 8px; flex-shrink: 0; }
    .return-box { margin-top: 8px; padding: 8px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; font-size: 13px; color: #b91c1c; }
    .evidence { border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 12px; }
    .evidence-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .evidence-head h4 { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; color: #334155; margin: 0; }
    .docs { display: flex; flex-direction: column; gap: 8px; }
    .doc { display: flex; justify-content: space-between; align-items: center; padding: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; }
    .doc-info { display: flex; align-items: center; gap: 8px; }
    .doc-info mat-icon { color: #94a3b8; }
    .doc-actions { display: flex; align-items: center; gap: 4px; }
    .badge { display: inline-flex; align-items: center; gap: 2px; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge mat-icon { font-size: 13px; width: 13px; height: 13px; }
    .badge.outline { background: #fff; border: 1px solid #cbd5e1; color: #475569; }
    .badge.green { background: #dcfce7; color: #15803d; }
    .badge.red { background: #fee2e2; color: #b91c1c; }
    .badge.amber { background: #fef3c7; color: #b45309; }
    .badge.purple { background: #f3e8ff; color: #7e22ce; }
    .badge.blue { background: #dbeafe; color: #1d4ed8; }
    .badge.gray { background: #f1f5f9; color: #475569; }
    .green { color: #16a34a; } .red { color: #dc2626; }
    .muted { color: #64748b; } .small { font-size: 13px; } .xs { font-size: 11px; }
    .bold { font-weight: 600; } .italic { font-style: italic; }
    .empty { padding: 40px; text-align: center; color: #64748b; }
    .empty mat-icon { font-size: 40px; width: 40px; height: 40px; color: #cbd5e1; }
  `],
})
export class SubmitActualsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly periodType = toSignal(
    this.route.data.pipe(map((d) => (d['periodType'] as string | undefined) ?? 'quarterly')),
    { initialValue: 'quarterly' },
  );
  readonly isMidYear = computed(() => this.periodType() === 'mid_year');
  readonly pageTitle = computed(() =>
    this.isMidYear() ? 'Mid-Year — Capture' : 'Quarterly Actuals');
  readonly pageSubtitle = computed(() =>
    this.isMidYear()
      ? 'Capture mid-year actuals covering Q1–Q2 performance, upload supporting evidence, and submit for review'
      : 'Track performance against quarterly targets across all KPIs');

  cycles = signal<Cycle[]>([]);
  scorecards = signal<Scorecard[]>([]);
  scorecardsLoaded = signal(false);
  captureContext = signal<CaptureContext | null>(null);
  kpis = signal<ScorecardKpi[]>([]);
  actuals = signal<KpiActual[]>([]);
  evidence = signal<Record<number, EvidenceDoc[]>>({});

  selectedCycleId = signal<number | null>(null);
  selectedKpiId = signal<number | null>(null);

  effectiveCycleId = computed<number | null>(() => this.selectedCycleId() ?? this.cycles()[0]?.id ?? null);
  approvedKpis = computed<CaptureKpi[]>(() => (this.kpis() as CaptureKpi[]).filter((k) => k.status === 'Approved'));

  // Filter panel: pending values are edited in the form; applied on Search.
  pendingSource = '';
  pendingDept = '';
  pendingPerson = '';
  pendingIndicator = '';
  pendingQuarter = 1;
  private readonly applied = signal<{
    source: string; dept: string;
    person: string; indicator: string;
    quarter: number;
  }>({ source: '', dept: '', person: '', indicator: '', quarter: 1 });

  applyFilters() {
    this.applied.set({
      source: this.pendingSource,
      dept: this.pendingDept,
      person: this.pendingPerson,
      indicator: this.pendingIndicator.trim().toLowerCase(),
      quarter: this.pendingQuarter,
    });
  }

  // Fixed embedded table columns (de-linked from the OPMS Scorecard Wizard config).
  readonly tableColumns: TableColumn[] = [
    { key: 'kpiNumber', label: 'Number' },
    { key: 'description', label: 'Indicator Description', wide: true },
    { key: 'departmentName', label: 'Department' },
    { key: 'responsiblePostId', label: 'Responsible Person' },
    { key: 'captureStatus', label: 'Status' },
  ];

  cellValue(kpi: CaptureKpi, col: TableColumn): string {
    switch (col.key) {
      case 'responsiblePostId':
        return kpi.responsiblePostName
          ? kpi.responsiblePostJobTitle ? `${kpi.responsiblePostName} — ${kpi.responsiblePostJobTitle}` : kpi.responsiblePostName
          : '—';
      case 'captureStatus': {
        const a = this.relevantActual(kpi);
        if (!a) return 'Not Captured';
        if (a.status === 'In Review') return `In Review — ${this.stageLabel(a.reviewLevel)}`;
        return a.status;
      }
      default: {
        const v = (kpi as unknown as Record<string, unknown>)[col.key];
        return v === null || v === undefined || v === '' ? '—' : String(v);
      }
    }
  }

  departmentOptions = computed<string[]>(() =>
    [...new Set(this.approvedKpis().map((k) => k.departmentName).filter((d): d is string => !!d))].sort());
  personOpen = false;

  pickPerson(name: string) {
    this.pendingPerson = name;
    this.personOpen = false;
  }

  personOptions = computed<{ name: string; jobTitle: string | null }[]>(() => {
    const byName = new Map<string, string | null>();
    for (const k of this.approvedKpis()) {
      if (!k.responsiblePostName) continue;
      if (!byName.has(k.responsiblePostName)) {
        byName.set(k.responsiblePostName, k.responsiblePostJobTitle ?? null);
      }
    }
    return [...byName.entries()].map(([name, jobTitle]) => ({ name, jobTitle }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  /** The actual relevant for status display/stats: the one for the applied quarter. */
  stageLabel(level?: string | null): string {
    switch (level) {
      case 'pms_manager':
      case 'pms_director': return 'PMS Review';
      case 'internal_audit': return 'Internal Audit';
      default: return 'Manager Review';
    }
  }

  private relevantActual(k: CaptureKpi) {
    const q = this.applied().quarter;
    return (k.quarterActuals ?? []).find((a) => a.quarter === q) ?? null;
  }

  filteredKpis = computed<CaptureKpi[]>(() => {
    // The filter panel only exists in quarterly mode; mid-year shows all KPIs.
    if (this.isMidYear()) return this.approvedKpis();
    const f = this.applied();
    return this.approvedKpis().filter((k) => {
      if (f.source === 'departmental' ? k.scorecardType !== 'departmental' : k.scorecardType === 'departmental') return false;
      if (f.dept && k.departmentName !== f.dept) return false;
      if (f.person && k.responsiblePostName !== f.person) return false;
      if (f.indicator && !`${k.kpiNumber ?? ''} ${k.description ?? ''}`.toLowerCase().includes(f.indicator)) return false;
      return true;
    });
  });

  stats = computed<{ onTarget: number; atRisk: number; offTarget: number }>(() => {
    let onTarget = 0, atRisk = 0, offTarget = 0;
    for (const k of this.filteredKpis()) {
      const a = this.relevantActual(k);
      if (!a || !a.actualValue) continue;
      // Prefer the stored score (formula/manual/AI) so qualitative KPIs
      // are counted too; fall back to the numeric actual/target ratio.
      let pct: number | null = a.scorePct ?? null;
      if (pct === null) {
        const t = (k.quarterTargets ?? []).find((x) => x.quarter === a.quarter);
        const actual = parseNumeric(a.actualValue);
        const target = t ? parseNumeric(t.targetValue ?? '') : null;
        if (actual === null || target === null || target === 0) continue;
        pct = (actual / target) * 100;
      }
      if (pct >= 100) onTarget++;
      else if (pct >= 50) atRisk++;
      else offTarget++;
    }
    return { onTarget, atRisk, offTarget };
  });

  cycleOpen = computed<boolean>(() => {
    const cycle = this.cycles().find((c) => c.id === this.effectiveCycleId());
    if (!cycle) return true;
    const s = cycle.status as string;
    return s === 'Open' || s === 'Active';
  });

  blockedMessages = computed<string[]>(() => {
    const unapproved = this.scorecards().filter((s) => s.status !== 'Approved');
    const types = [...new Set(unapproved.map((s) => s.scorecardType))];
    if (!types.length) return ['Actual performance can only be captured against an approved SDBIP.'];
    return types.map((t) =>
      t === 'departmental'
        ? 'Departmental SDBIP must be approved before quarterly actual performance can be captured.'
        : t === 'revised'
          ? 'Revised SDBIP must be approved before quarterly actual performance can be captured.'
          : 'Original SDBIP must be approved before quarterly actual performance can be captured.');
  });

  budgetLabel(ctx: CaptureContext): string {
    const parts: string[] = [];
    if (ctx.annualBudgetTarget != null) parts.push(`R ${ctx.annualBudgetTarget.toLocaleString()}`);
    if (ctx.budgetDescription) parts.push(ctx.budgetDescription);
    return parts.length ? parts.join(' — ') : '—';
  }

  quarterRows = computed(() => {
    const ctx = this.captureContext();
    if (!ctx) return [];
    const quarters = this.isMidYear() ? [2] : [1, 2, 3, 4];
    return quarters.map((q) => {
      const t = ctx.targets.find((x) => x.quarter === q);
      const a = this.actuals().find((x) => x.quarter === q);
      const assessment = a?.assessment ?? null;
      return {
        label: this.isMidYear() ? 'Mid-Year' : `Q${q}`,
        target: t?.targetValue ?? null,
        actual: a?.actualValue ?? null,
        assessment,
        assessClass: assessmentBadgeClass(assessment),
        variance: a?.actualValue ? computeVariance(a.actualValue, t?.targetValue ?? null) : null,
      };
    });
  });

  /** The quarter about to be captured: first quarter without a captured actual. */
  captureQuarter = computed<number>(() => {
    if (this.isMidYear()) return 2;
    const captured = new Set(this.actuals().map((a) => a.quarter));
    for (const q of [1, 2, 3, 4]) {
      if (!captured.has(q)) return q;
    }
    return 4;
  });

  prevQuarterActual(): string | null {
    const q = this.captureQuarter();
    if (q <= 1) return null;
    return this.actuals().find((a) => a.quarter === q - 1)?.actualValue ?? null;
  }

  ytdActual(): string | null {
    const q = this.captureQuarter();
    let sum = 0;
    let any = false;
    for (const a of this.actuals()) {
      if (a.quarter >= q || !a.actualValue) continue;
      const n = parseNumeric(a.actualValue);
      if (n !== null) { sum += n; any = true; }
    }
    return any ? `${Math.round(sum * 100) / 100}` : null;
  }

  quarterPoeFor(ctx: CaptureContext): string | null {
    return ctx.quarterPoe?.[this.captureQuarter()] ?? null;
  }

  ngOnInit() {
    this.api.get<Cycle[]>('/cycles').pipe(
      catchError(() => of([] as Cycle[])),
      tap((cs) => this.cycles.set(Array.isArray(cs) ? cs : [])),
    ).subscribe(() => this.loadScorecards());
  }

  onCycle(id: number) {
    this.selectedCycleId.set(id);
    this.selectedKpiId.set(null);
    this.kpis.set([]);
    this.actuals.set([]);
    this.evidence.set({});
    this.captureContext.set(null);
    this.pendingSource = '';
    this.pendingDept = '';
    this.pendingPerson = '';
    this.pendingIndicator = '';
    this.pendingQuarter = 1;
    this.applied.set({ source: '', dept: '', person: '', indicator: '', quarter: 1 });
    this.loadScorecards();
  }

  selectKpi(id: number) {
    this.selectedKpiId.set(id);
    this.actuals.set([]);
    this.evidence.set({});
    this.loadActuals();
    this.captureContext.set(null);
    this.api.get<CaptureContext>(`/scorecard-kpis/${id}/capture-context`).pipe(
      catchError(() => of(null)),
    ).subscribe((ctx) => {
      if (this.selectedKpiId() === id) this.captureContext.set(ctx);
    });
  }

  /** Row click (quarterly mode): open the full assessment page for this KPI. */
  openAssessRow(kpi: CaptureKpi) {
    this.router.navigate(['/actuals/assess', kpi.id], {
      queryParams: { quarter: this.applied().quarter },
    });
  }

  loadScorecards() {
    const cycleId = this.effectiveCycleId();
    if (!cycleId) { this.scorecards.set([]); this.kpis.set([]); return; }
    this.api.get<Scorecard[]>('/scorecards', { cycleId }).pipe(
      catchError(() => of([] as Scorecard[])),
    ).subscribe((s) => { this.scorecards.set(Array.isArray(s) ? s : []); this.scorecardsLoaded.set(true); });
    // §6 Version selection: the server resolves the in-force planning version
    // (Approved Revised supersedes Original; departmental KPIs included).
    this.api.get<ScorecardKpi[]>(`/cycles/${cycleId}/capture-kpis`).pipe(
      catchError(() => of([] as ScorecardKpi[])),
    ).subscribe((k) => this.kpis.set(Array.isArray(k) ? k : []));
  }

  loadActuals() {
    const kpiId = this.selectedKpiId();
    if (!kpiId) { this.actuals.set([]); this.evidence.set({}); return; }
    this.api.get<KpiActual[]>(`/scorecard-kpis/${kpiId}/actuals`, { periodType: this.periodType() }).pipe(
      catchError(() => of([] as KpiActual[])),
    ).subscribe((rows) => {
      const list = Array.isArray(rows) ? rows : [];
      this.actuals.set(list);
      this.loadEvidence(kpiId, list);
    });
  }

  loadEvidence(kpiId: number, list: KpiActual[]) {
    if (!list.length) { this.evidence.set({}); return; }
    const requests = list.map((a) =>
      this.api.get<EvidenceDoc[]>(`/scorecard-kpis/${kpiId}/evidence`, { quarter: a.quarter, periodType: this.periodType() }).pipe(
        catchError(() => of([] as EvidenceDoc[])),
      ),
    );
    forkJoin(requests).subscribe((results) => {
      const map: Record<number, EvidenceDoc[]> = {};
      list.forEach((a, i) => { map[a.id] = Array.isArray(results[i]) ? results[i] : []; });
      this.evidence.set(map);
    });
  }

  evidenceFor(actualId: number): EvidenceDoc[] {
    return this.evidence()[actualId] ?? [];
  }

  canEdit(a: KpiActual): boolean {
    return this.cycleOpen() && (a.status === 'Draft' || a.status === 'Returned');
  }

  assessBadge(a: KpiActual): string {
    if (a.assessment) return assessmentBadgeClass(a.assessment);
    return a.isAchieved ? 'green' : 'red';
  }

  levelLabel(level: string): string {
    const stage = REVIEW_LEVEL_STAGES[level];
    const label = REVIEW_LEVEL_LABELS[level] ?? level;
    return stage && stage !== label ? `${stage} — ${label}` : label;
  }

  statusClass(status: string): string {
    switch (status) {
      case 'Submitted': return 'blue';
      case 'In Review': return 'amber';
      case 'Returned': return 'red';
      case 'Rejected': return 'red';
      case 'Approved': return 'green';
      default: return 'gray';
    }
  }

  verifyClass(status: string): string {
    switch (status) {
      case 'Verified': return 'green';
      case 'Rejected': return 'red';
      default: return 'amber';
    }
  }

  openCapture(actual?: KpiActual) {
    const editing = !!actual;
    const form: CaptureForm = actual ? {
      quarter: actual.quarter ?? 1,
      actualValue: actual.actualValue ?? '',
      commentary: actual.commentary ?? '',
      isOnHold: actual.isOnHold ?? false,
      onHoldReason: actual.onHoldReason ?? '',
      challengeNarrative: actual.challengeNarrative ?? '',
      correctiveAction: actual.correctiveAction ?? '',
      underperformanceReason: actual.underperformanceReason ?? '',
      overperformanceReason: actual.overperformanceReason ?? '',
      budgetImplication: actual.budgetImplication ?? '',
      analysisNotes: actual.analysisNotes ?? '',
      lateOverrideReason: actual.lateOverrideReason ?? '',
    } : emptyCaptureForm();
    if (!editing && this.isMidYear()) form.quarter = 2;

    this.dialog.open(CaptureActualDialogComponent, {
      panelClass: 'plat-dialog', autoFocus: false,
      data: {
        form, editing, periodType: this.periodType(),
        context: this.captureContext(),
        existingActuals: this.actuals()
          .filter((a) => !actual || a.id !== actual.id)
          .map((a) => ({ quarter: a.quarter, actualValue: a.actualValue })),
      },
    }).afterClosed().subscribe((res: CaptureForm | undefined) => {
      if (!res || !res.actualValue.trim()) return;
      if (editing && actual) {
        this.updateActual(actual.id, res);
      } else {
        this.createActual(res);
      }
    });
  }

  private createActual(f: CaptureForm) {
    const kpiId = this.selectedKpiId();
    if (!kpiId) return;
    this.api.post(`/scorecard-kpis/${kpiId}/actuals`, {
      periodType: this.periodType(),
      quarter: f.quarter,
      actualValue: f.actualValue,
      commentary: f.commentary || undefined,
      isOnHold: f.isOnHold,
      onHoldReason: f.onHoldReason || undefined,
      challengeNarrative: f.challengeNarrative || undefined,
      correctiveAction: f.correctiveAction || undefined,
      underperformanceReason: f.underperformanceReason || undefined,
      overperformanceReason: f.overperformanceReason || undefined,
      budgetImplication: f.budgetImplication || undefined,
      analysisNotes: f.analysisNotes || undefined,
      lateOverrideReason: f.lateOverrideReason || undefined,
    }).pipe(
      tap(() => { this.toast.success('Actual saved as draft. Add evidence then submit for review.'); this.loadActuals(); }),
      catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }

  private updateActual(id: number, f: CaptureForm) {
    this.api.patch(`/kpi-actuals/${id}`, {
      actualValue: f.actualValue,
      commentary: f.commentary || undefined,
      isOnHold: f.isOnHold,
      onHoldReason: f.onHoldReason || undefined,
      challengeNarrative: f.challengeNarrative || undefined,
      correctiveAction: f.correctiveAction || undefined,
      underperformanceReason: f.underperformanceReason || undefined,
      overperformanceReason: f.overperformanceReason || undefined,
      budgetImplication: f.budgetImplication || undefined,
      analysisNotes: f.analysisNotes || undefined,
    }).pipe(
      tap(() => { this.toast.success('Actual updated'); this.loadActuals(); }),
      catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }

  submitForReview(actual: KpiActual) {
    this.api.post(`/kpi-actuals/${actual.id}/transition`, { action: 'submit' }).pipe(
      tap(() => { this.toast.success('Actual submitted for review'); this.loadActuals(); }),
      catchError((e) => { this.toast.error('Failed to submit', e?.error?.error ?? e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }

  openUpload(actual: KpiActual) {
    this.dialog.open(UploadEvidenceDialogComponent, {
      panelClass: 'plat-dialog', autoFocus: true, data: { quarter: actual.quarter, periodType: this.periodType() },
    }).afterClosed().subscribe((res: UploadForm | undefined) => {
      if (!res?.file) return;
      const kpiId = this.selectedKpiId();
      if (!kpiId) return;
      const file = res.file;
      this.api.post<{ uploadURL: string; objectPath: string }>(`/evidence/upload-url`).subscribe({
        next: async ({ uploadURL, objectPath }) => {
          try {
            const put = await fetch(uploadURL, {
              method: 'PUT',
              headers: { 'Content-Type': file.type || 'application/octet-stream' },
              body: file,
            });
            if (!put.ok) throw new Error(`Upload failed (${put.status})`);
            this.api.post(`/scorecard-kpis/${kpiId}/evidence`, {
              periodType: this.periodType(),
              quarter: actual.quarter,
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type || 'application/octet-stream',
              documentType: res.documentType || undefined,
              description: res.description || undefined,
              filePath: objectPath,
            }).pipe(
              tap(() => { this.toast.success('Evidence uploaded'); this.loadActuals(); }),
              catchError((e) => { this.toast.error('Error saving evidence', e?.error?.error ?? e?.error?.message ?? e?.message); return of(null); }),
            ).subscribe();
          } catch (e: unknown) {
            this.toast.error('Upload failed', e instanceof Error ? e.message : 'Could not upload the file');
          }
        },
        error: (e) => this.toast.error('Upload failed', e?.error?.error ?? e?.error?.message ?? e?.message),
      });
    });
  }

  verify(doc: EvidenceDoc, status: 'Verified' | 'Rejected') {
    this.api.post(`/evidence/${doc.id}/verify`, { status }).pipe(
      tap(() => { this.toast.success(`Evidence ${status.toLowerCase()}`); this.loadActuals(); }),
      catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }

  trackById(_: number, x: { id: number }): number { return x.id; }
}
