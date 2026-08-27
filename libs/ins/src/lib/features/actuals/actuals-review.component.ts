import { ChangeDetectionStrategy, Component, Inject, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, tap } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ApiService } from '@ins-core/services/api.service';
import { ToastService } from '@ins-core/services/toast.service';
import { User } from '@ins-core/models/user.model';
import { PageHeaderComponent } from '@ins-shared/components/page-header/page-header.component';
import { assessmentBadgeClass, computeVariance, parseNumeric } from './assessment.util';

interface Cycle {
  id: number;
  financialYearLabel: string;
  status?: string;
}

interface ReviewKpiMeta {
  id: number;
  kpiNumber?: string | null;
  description?: string | null;
  departmentName?: string | null;
  responsiblePostName?: string | null;
  responsiblePostJobTitle?: string | null;
  scorecardType?: string | null;
  quarterTargets?: { quarter: number; targetValue: string | null }[];
}

type ReviewTabKey = 'awaiting' | 'approved' | 'returned';

interface KpiInfo {
  id: number;
  kpiNumber?: string | null;
  description?: string | null;
  annualTarget?: string | null;
}

interface QuarterTarget {
  id: number;
  kpiId: number;
  quarter: number;
  targetValue: string;
  targetStatus?: string | null;
}

interface CaptureContext {
  effectiveKpiId: number;
  uomName?: string | null;
  annualTarget?: string | null;
  baseline?: string | null;
  strategicObjective?: string | null;
  programme?: string | null;
  idpReference?: string | null;
  evidenceSource?: string | null;
  technicalIndicator?: string | null;
  isCumulative?: boolean;
  responsibleOfficialName?: string | null;
  departmentName?: string | null;
  divisionName?: string | null;
  scorecardName?: string | null;
  scorecardType?: string | null;
  financialYearLabel?: string | null;
  targets: QuarterTarget[];
}

interface ReviewRecord {
  id: number;
  actualId: number;
  reviewerUserId: number;
  action: string;
  comments?: string | null;
  returnReason?: string | null;
  createdAt?: string;
}

interface KpiQuarterActual {
  id: number;
  kpiId: number;
  periodType?: string;
  quarter: number;
  actualValue: string;
  commentary?: string | null;
  isAchieved?: boolean | null;
  assessment?: string | null;
  scorePct?: number | null;
  poeCount?: number;
  progressStatusId?: number | null;
  isOnHold: boolean;
  onHoldReason?: string | null;
  challengeNarrative?: string | null;
  correctiveAction?: string | null;
  underperformanceReason?: string | null;
  overperformanceReason?: string | null;
  budgetImplication?: string | null;
  analysisNotes?: string | null;
  submittedById: number;
  submittedAt?: string;
  isLateSubmission: boolean;
  lateOverrideReason?: string | null;
  status: string;
  reviewLevel?: string | null;
  reviewStatus?: string | null;
  reviewComments?: string | null;
  reviewedById?: number | null;
  reviewedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface KpiEvidenceDocument {
  id: number;
  kpiId: number;
  quarter: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
  documentType?: string | null;
  description?: string | null;
  uploadedById: number;
  uploadedAt?: string;
  verificationStatus: string;
  verifiedById?: number | null;
  verifiedAt?: string | null;
  rejectionReason?: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  Draft: 's-gray',
  Submitted: 's-blue',
  'In Review': 's-amber',
  Returned: 's-red',
  Rejected: 's-red',
  Approved: 's-green',
};

const ASSESSMENT_COLORS: Record<string, string> = {
  green: 's-green', blue: 's-blue', amber: 's-amber', red: 's-red', purple: 's-purple', gray: 's-gray',
};

const VERIFICATION_COLORS: Record<string, string> = {
  Pending: 's-amber',
  Verified: 's-green',
  Rejected: 's-red',
};

const REVIEW_LEVEL_LABELS: Record<string, string> = {
  line_manager: 'Manager Review',
  director: 'Manager Review',
  pms_manager: 'PMS Review',
  pms_director: 'PMS Review',
  internal_audit: 'Internal Audit',
};

const REVIEW_LEVEL_NEXT: Record<string, string> = {
  line_manager: 'PMS Review',
  director: 'PMS Review',
  pms_manager: 'Internal Audit',
  pms_director: 'Internal Audit',
  internal_audit: 'Final Approval',
};

const REVIEW_LEVELS = ['line_manager', 'pms_manager', 'internal_audit'];

interface WorkflowStage { name: string; levels: string[]; }

const WORKFLOW_STAGES: WorkflowStage[] = [
  { name: 'Manager Review', levels: ['line_manager'] },
  { name: 'PMS Review', levels: ['pms_manager'] },
  { name: 'Internal Audit', levels: ['internal_audit'] },
];

const LEGACY_LEVEL_MAP: Record<string, string> = { director: 'line_manager', pms_director: 'pms_manager' };

function normalizeLevel(level: string | null | undefined): string {
  if (!level) return '';
  return LEGACY_LEVEL_MAP[level] ?? level;
}

function stageForLevel(level: string | null | undefined): string {
  const l = normalizeLevel(level);
  if (!l) return '';
  return WORKFLOW_STAGES.find((s) => s.levels.includes(l))?.name ?? '';
}

@Component({
  selector: 'app-actuals-return-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'reject' ? 'Reject Actual' : 'Return Actual for Correction' }}</h2>
    <mat-dialog-content class="content">
      <p class="hint" *ngIf="data.mode === 'reject'">Rejection is final — the submitter will not be able to edit and resubmit this actual.</p>
      <mat-form-field appearance="outline">
        <mat-label>Reason for {{ data.mode === 'reject' ? 'Rejection' : 'Return' }} (Required)</mat-label>
        <textarea matInput rows="3" [(ngModel)]="reason" name="reason"
                  [placeholder]="data.mode === 'reject' ? 'Explain why this actual is being rejected...' : 'Explain why this actual is being returned...'"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Cancel</button>
      <button mat-flat-button color="warn" type="button"
              [disabled]="!reason.trim()"
              (click)="submit()">
        <mat-icon>{{ data.mode === 'reject' ? 'block' : 'cancel' }}</mat-icon> {{ data.mode === 'reject' ? 'Reject' : 'Return' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .content { display:flex; flex-direction: column; padding-top: 12px !important; min-width: 420px; }
    mat-form-field { width: 100%; }
    .hint { margin: 0 0 10px; font-size: 13px; color: #b91c1c; }
    .fields { margin-top: 4px; }
    .fields-label { margin: 0 0 6px; font-size: 13px; font-weight: 600; color: #475569; }
    .chk { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #334155; padding: 3px 0; cursor: pointer; }
  `],
})
export class ActualsReturnDialogComponent {
  reason = '';
  constructor(public ref: MatDialogRef<ActualsReturnDialogComponent, string | undefined>, @Inject(MAT_DIALOG_DATA) public data: { id: number; mode?: 'return' | 'reject' }) {}
  submit() {
    const reason = this.reason.trim();
    if (!reason) return;
    this.ref.close(reason);
  }
}

@Component({
  selector: 'app-actuals-review',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatDialogModule, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <ng-container *ngIf="!selectedActual() as none">
        <app-page-header [title]="title()" [subtitle]="description()" icon="rule" tone="indigo"></app-page-header>

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
            <input class="f-control" [(ngModel)]="pendingIndicator" placeholder="Search indicator..." />

            <label class="f-label">KPI Source</label>
            <select class="f-control" [(ngModel)]="pendingSource">
              <option [ngValue]="''">Original / Revised SDBIP</option>
              <option [ngValue]="'departmental'">Departmental SDBIP</option>
            </select>

            <span></span>
            <div class="f-search-row">
              <button mat-flat-button class="search-btn" (click)="applyFilters()">Search</button>
            </div>

            <label class="f-label">Department</label>
            <select class="f-control" [(ngModel)]="pendingDept">
              <option [ngValue]="''">All Departments</option>
              <option *ngFor="let d of departmentOptions()" [ngValue]="d">{{ d }}</option>
            </select>

            <span></span>
            <span></span>
          </div>
        </div>

        <p class="pre-search muted" *ngIf="!isMidYear() && !searched()">
          Set your filters above and click <strong>Search</strong> to load results.
        </p>

        <ng-container *ngIf="!isMidYear() && searched()">
          <div class="stat-grid">
            <div class="stat-card green"><div class="stat-num g"><span class="dot dg"></span>{{ targetStats().on }}</div><div class="stat-label g">On Target (&ge;100%)</div></div>
            <div class="stat-card amber"><div class="stat-num a"><span class="dot da"></span>{{ targetStats().at }}</div><div class="stat-label a">At Risk (50–99%)</div></div>
            <div class="stat-card red"><div class="stat-num r"><span class="dot dr"></span>{{ targetStats().off }}</div><div class="stat-label r">Off Target (&lt;50%)</div></div>
          </div>

          <div class="tab-bar">
            <button type="button" class="tab" *ngFor="let t of tabs"
                    [class.active]="activeTab() === t.key" (click)="activeTab.set(t.key)">{{ t.label }}</button>
          </div>

          <div class="plat-card table-card" *ngIf="tabItems().length; else tabEmpty">
            <div class="table-wrap">
              <table class="kpi-table">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th class="col-desc">KPI Description</th>
                    <th>Target</th>
                    <th>Actual</th>
                    <th class="col-narr">Challenges</th>
                    <th class="col-narr">Corrective Action</th>
                    <th>Assessment</th>
                    <th>POE</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let a of tabItems()">
                    <td class="nowrap">{{ rowNumber(a) }}</td>
                    <td class="col-desc"><span class="desc">{{ rowDescription(a) }}</span></td>
                    <td class="wrap-col">{{ rowTarget(a) ?? '—' }}</td>
                    <td class="wrap-col">{{ a.actualValue }}</td>
                    <td class="col-narr muted-cell">{{ a.challengeNarrative || a.underperformanceReason || 'None' }}</td>
                    <td class="col-narr muted-cell">{{ a.correctiveAction || 'None' }}</td>
                    <td class="nowrap">
                      <span class="badge" *ngIf="scoreFor(a) !== null; else noScore" [class]="scoreClass(a)">{{ scoreFor(a) }}%</span>
                      <ng-template #noScore><span class="muted">—</span></ng-template>
                    </td>
                    <td class="nowrap">
                      <button class="poe-chip" type="button" [class.no-poe]="!(a.poeCount ?? 0)" [disabled]="!(a.poeCount ?? 0)"
                              title="Download proof of evidence" (click)="downloadPoe(a)">
                        <mat-icon>download</mat-icon>{{ a.poeCount ?? 0 }}
                      </button>
                    </td>
                    <td class="nowrap">
                      <div class="row-actions">
                        <button class="drill-btn icon-only" type="button" title="View detail" (click)="select(a.id)">
                          <mat-icon>visibility</mat-icon>
                        </button>
                        <ng-container *ngIf="canAct(a)">
                          <button class="mini-btn mini-approve icon-only" type="button" title="Approve" [disabled]="processing()" (click)="approve(a.id)">
                            <mat-icon>check_circle</mat-icon>
                          </button>
                          <button class="mini-btn mini-reject icon-only" type="button" title="Return for correction" [disabled]="processing()" (click)="openReturn(a.id, 'return')">
                            <mat-icon>undo</mat-icon>
                          </button>
                        </ng-container>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <ng-template #tabEmpty>
            <div class="empty plat-card">
              <mat-icon>{{ tabEmptyIcon() }}</mat-icon>
              <h3>{{ tabEmptyTitle() }}</h3>
              <p>{{ tabEmptyHint() }}</p>
            </div>
          </ng-template>
        </ng-container>

        <div *ngIf="isMidYear() && !filteredActuals().length" class="empty plat-card">
          <mat-icon>check_circle</mat-icon>
          <h3>No Actuals Pending Review</h3>
          <p>Items requiring your review will appear here.</p>
        </div>

        <div *ngIf="isMidYear() && filteredActuals().length" class="list">
          <div class="count-row">
            <span class="badge s-amber">{{ filteredActuals().length }} pending</span>
            <span class="muted">at {{ title() }} stage ({{ levelLabel() }})</span>
          </div>
          <div class="plat-card item" *ngFor="let a of filteredActuals()" (click)="select(a.id)">
            <div>
              <div class="head">
                <span class="badge outline">{{ isMidYear() ? 'Mid-Year' : 'Q' + a.quarter }}</span>
                <span class="badge" [class]="statusColor(a.status)">{{ a.status }}</span>
                <span class="badge" [class]="assessmentColor(a)">
                  <mat-icon>{{ assessmentIcon(a) }}</mat-icon>
                  {{ assessmentLabel(a) }}
                </span>
                <span class="badge s-amber" *ngIf="a.isLateSubmission">Late</span>
                <span class="badge s-blue" *ngIf="a.reviewLevel">
                  <mat-icon>schedule</mat-icon>{{ levelLabelFor(a.reviewLevel) }}
                </span>
              </div>
              <p class="value">Actual: {{ a.actualValue }}</p>
              <p class="muted small">{{ kpiLabel(a.kpiId) }} · Submitted by {{ userName(a.submittedById) }}</p>
              <p class="muted small clamp" *ngIf="a.commentary">{{ a.commentary }}</p>
            </div>
            <button mat-stroked-button type="button" (click)="$event.stopPropagation(); select(a.id)">
              <mat-icon>visibility</mat-icon> Review
            </button>
          </div>
        </div>
      </ng-container>

      <ng-container *ngIf="selectedActual() as actual">
        <div class="detail-head">
          <div class="left">
            <button mat-button type="button" (click)="back()"><mat-icon>arrow_back</mat-icon> Back to Queue</button>
            <div>
              <h2>{{ title() }} — {{ isMidYear() ? 'Mid-Year' : 'Q' + actual.quarter }}</h2>
              <p class="muted small">
                {{ kpiLabel(actual.kpiId) }} · Submitted by {{ userName(actual.submittedById) }}
                <span class="badge s-blue" *ngIf="actual.reviewLevel">{{ levelLabelFor(actual.reviewLevel) }} sub-stage</span>
              </p>
            </div>
          </div>
          <div class="actions" *ngIf="canAct(actual)">
            <button class="act-btn act-return" type="button" [disabled]="processing()" (click)="openReturn(actual.id, 'return')">
              <mat-icon>undo</mat-icon> Return
            </button>
            <button class="act-btn act-approve" type="button"
                    [disabled]="processing()"
                    (click)="approve(actual.id)">
              <mat-icon>check_circle</mat-icon>
              Approve {{ nextLevel() !== 'Final Approval' ? '→ ' + nextLevel() : '(Final)' }}
            </button>
          </div>
        </div>

        <div class="grid2">
          <div class="plat-card">
            <h4><mat-icon class="inline">info</mat-icon> KPI Information <span class="badge outline tiny">Read only</span></h4>
            <div class="kv"><span class="muted">Financial Year</span><span class="value">{{ captureContext()?.financialYearLabel ?? '—' }}</span></div>
            <div class="kv"><span class="muted">Period</span><span class="value">{{ isMidYear() ? 'Mid-Year' : 'Quarter ' + actual.quarter }}</span></div>
            <div class="kv" *ngIf="kpiInfo(actual.kpiId) as kpi">
              <span class="muted">KPI</span><span class="value">{{ kpi.kpiNumber }} — {{ kpi.description }}</span>
            </div>
            <div class="kv"><span class="muted">Directorate / Department</span><span class="value">{{ captureContext()?.departmentName ?? '—' }}</span></div>
            <div class="kv" *ngIf="captureContext()?.divisionName"><span class="muted">Division</span><span class="value">{{ captureContext()?.divisionName }}</span></div>
            <div class="kv" *ngIf="captureContext()?.strategicObjective"><span class="muted">Strategic Objective</span><span class="value">{{ captureContext()?.strategicObjective }}</span></div>
            <div class="kv" *ngIf="captureContext()?.technicalIndicator"><span class="muted">Technical Indicator</span><span class="value">{{ captureContext()?.technicalIndicator }}</span></div>
            <div class="kv"><span class="muted">Unit of Measure</span><span class="value">{{ captureContext()?.uomName ?? '—' }}</span></div>
            <div class="kv"><span class="muted">Baseline</span><span class="value">{{ captureContext()?.baseline ?? '—' }}</span></div>
            <div class="kv"><span class="muted">Annual Target</span><span class="value">{{ captureContext()?.annualTarget ?? kpiInfo(actual.kpiId)?.annualTarget ?? '—' }}</span></div>
            <div class="kv"><span class="muted">{{ isMidYear() ? 'Mid-Year' : 'Quarterly' }} Target</span><span class="value">{{ quarterTargetFor(actual) ?? '—' }}</span></div>
            <div class="kv"><span class="muted">SDBIP Version</span><span class="value">{{ captureContext()?.scorecardName ?? '—' }}</span></div>
            <div class="kv"><span class="muted">Responsible Official</span><span class="value">{{ captureContext()?.responsibleOfficialName ?? '—' }}</span></div>
          </div>

          <div class="plat-card">
            <h4><mat-icon class="inline">insights</mat-icon> Performance Information <span class="badge outline tiny">Read only</span></h4>
            <div class="kv"><span class="muted">Actual</span><span class="value">{{ actual.actualValue }}</span></div>
            <div class="kv"><span class="muted">Achievement %</span><span class="value">{{ achievementPctFor(actual) ?? '—' }}</span></div>
            <div class="kv"><span class="muted">Assessment</span>
              <span class="badge" [class]="assessmentColor(actual)">{{ assessmentLabel(actual) }}</span>
            </div>
            <div class="kv"><span class="muted">Variance</span><span class="value">{{ varianceFor(actual) ?? '—' }}</span></div>
            <div class="kv"><span class="muted">Prev Quarter Actual</span><span class="value">{{ prevQuarterActualFor(actual) ?? '—' }}</span></div>
            <div class="kv"><span class="muted">Year-to-Date Actual</span><span class="value">{{ ytdFor(actual) ?? '—' }}</span></div>
            <div class="kv" *ngIf="actual.isOnHold"><span class="muted">On Hold</span><span class="value purple">Yes</span></div>
            <div class="kv" *ngIf="actual.isLateSubmission"><span class="muted">Late Submission</span><span class="value amber">Yes</span></div>

            <h4 class="sub"><mat-icon class="inline">badge</mat-icon> System Information</h4>
            <div class="kv"><span class="muted">Submitted By</span><span class="value">{{ userName(actual.submittedById) }}</span></div>
            <div class="kv"><span class="muted">Submission Date</span><span class="value">{{ actual.submittedAt ? (actual.submittedAt | date:'medium') : '—' }}</span></div>
            <div class="kv"><span class="muted">Workflow Status</span>
              <span class="badge" [class]="statusColor(actual.status)">{{ actual.status }}</span>
            </div>
            <div class="kv" *ngIf="actual.reviewLevel"><span class="muted">Review Sub-stage</span><span class="value">{{ levelLabelFor(actual.reviewLevel) }}</span></div>
          </div>
        </div>

        <div class="plat-card return-reason-card" *ngIf="(actual.status === 'Returned' || actual.status === 'Rejected') && actual.reviewComments">
          <h4 class="rr-title"><mat-icon class="inline">undo</mat-icon> {{ actual.status === 'Rejected' ? 'Rejection' : 'Return' }} Reason</h4>
          <p class="rr-text">{{ actual.reviewComments }}</p>
        </div>

        <div class="plat-card" *ngIf="actual.commentary">
          <h4>Actual Comment</h4>
          <p class="muted">{{ actual.commentary }}</p>
        </div>

        <div class="plat-card" *ngIf="hasAnalysis(actual)">
          <h4>Analysis &amp; Narrative</h4>
          <div class="narrative" *ngIf="actual.challengeNarrative"><span class="muted small">Challenge Narrative</span><p>{{ actual.challengeNarrative }}</p></div>
          <div class="narrative" *ngIf="actual.underperformanceReason"><span class="muted small">Underperformance Reason</span><p>{{ actual.underperformanceReason }}</p></div>
          <div class="narrative" *ngIf="actual.overperformanceReason"><span class="muted small">Overperformance Reason</span><p>{{ actual.overperformanceReason }}</p></div>
          <div class="narrative" *ngIf="actual.correctiveAction"><span class="muted small">Corrective Action</span><p>{{ actual.correctiveAction }}</p></div>
          <div class="narrative" *ngIf="actual.budgetImplication"><span class="muted small">Budget Implication</span><p>{{ actual.budgetImplication }}</p></div>
        </div>

        <div class="plat-card">
          <h4><mat-icon class="inline">description</mat-icon> Evidence Documents</h4>
          <div class="kv" *ngIf="captureContext()?.evidenceSource"><span class="muted">Means of Verification</span><span class="value">{{ captureContext()?.evidenceSource }}</span></div>
          <p class="muted small">{{ evidence().length }} document(s) attached for {{ isMidYear() ? 'Mid-Year' : 'Q' + actual.quarter }}</p>
          <div *ngIf="evidence().length; else noEvidence" class="evidence-list">
            <div class="evidence-row" *ngFor="let doc of evidence()">
              <div class="left">
                <mat-icon class="muted">description</mat-icon>
                <div>
                  <p class="value small">{{ doc.fileName }}</p>
                  <p class="muted tiny">
                    Ref EV-{{ doc.id }} · <span *ngIf="doc.documentType">{{ doc.documentType }} · </span>{{ doc.description }}
                  </p>
                </div>
              </div>
              <span class="right-actions">
                <a class="rd-download" (click)="downloadEvidence(doc)"><mat-icon>download</mat-icon>Download</a>
              </span>
            </div>
          </div>
          <ng-template #noEvidence><p class="muted small italic center">No evidence documents uploaded</p></ng-template>
        </div>

        <div class="plat-card" *ngIf="reviews().length">
          <h4><mat-icon class="inline">history</mat-icon> Previous Reviews</h4>
          <div class="review-row" *ngFor="let r of reviews()">
            <span class="badge" [class]="reviewActionColor(r.action)">{{ r.action | titlecase }}</span>
            <div class="review-body">
              <p class="value small">{{ userName(r.reviewerUserId) }} <span class="muted tiny" *ngIf="r.createdAt">· {{ r.createdAt | date:'medium' }}</span></p>
              <p class="muted small pre" *ngIf="r.comments">{{ r.comments }}</p>
            </div>
          </div>
        </div>

        <div class="plat-card tinted purple" *ngIf="actual.onHoldReason">
          <p><strong class="purple">On Hold Reason:</strong> {{ actual.onHoldReason }}</p>
        </div>
        <div class="plat-card tinted amber" *ngIf="actual.lateOverrideReason">
          <p><strong class="amber">Late Override Reason:</strong> {{ actual.lateOverrideReason }}</p>
        </div>
      </ng-container>
    </section>
  `,
  styles: [`
    :host .plat-page { gap: 13px; }
    :host .plat-card { padding: 12px 16px; }
    .filter-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 15px; margin-bottom: 4px; }
    .filter-grid { display: grid; grid-template-columns: 140px 1fr 170px 1fr; gap: 7px 12px; align-items: center; }
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
    .f-dd-opt .opt-title { font-size: 11px; color: #64748b; }
    .f-search-row { display: flex; }
    .search-btn { --mdc-filled-button-container-color: #2563eb; --mdc-filled-button-label-text-color: #fff; --mdc-filled-button-container-height: 32px; background: #2563eb !important; color: #fff !important; border-radius: 6px; font-size: 13px; }
    .pre-search { text-align: center; padding: 32px 0; font-size: 13px; }
    .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 0; }
    .stat-card { border-radius: 9px; padding: 10px 14px; text-align: center; border: 1px solid; }
    .stat-card.blue { background: #eff6ff; border-color: #bfdbfe; }
    .stat-card.green { background: #f0fdf4; border-color: #bbf7d0; }
    .stat-card.amber { background: #fffbeb; border-color: #fde68a; }
    .stat-card.red { background: #fef2f2; border-color: #fecaca; }
    .stat-num { font-size: 19px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 7px; }
    .stat-label { font-size: 11.5px; font-weight: 600; margin-top: 1px; }
    .b { color: #2563eb; } .g { color: #16a34a; } .a { color: #d97706; } .r { color: #dc2626; }
    .dot { width: 8px; height: 8px; border-radius: 999px; display: inline-block; }
    .dg { background: #16a34a; } .da { background: #d97706; } .dr { background: #dc2626; }
    .tab-bar { display: inline-flex; align-self: flex-start; gap: 2px; background: #f1f5f9; border-radius: 8px; padding: 3px; margin-bottom: 0; }
    .tab { border: none; background: transparent; padding: 5px 13px; border-radius: 6px; font-size: 12.5px; font-weight: 600; color: #64748b; cursor: pointer; font-family: inherit; }
    .tab:hover { color: #334155; }
    .tab.active { background: #fff; color: #0f172a; box-shadow: 0 1px 3px rgba(15,23,42,.12); }
    .row-list { display: flex; flex-direction: column; gap: 8px; }
    .row { display: flex; align-items: center; gap: 9px; padding: 11px 14px; }
    .row.clickable { cursor: pointer; transition: box-shadow .15s; }
    .row.clickable:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); }
    .row .chev { color: #94a3b8; font-size: 20px; width: 20px; height: 20px; }
    .row-main { flex: 1; min-width: 0; }
    .row-title { margin: 0; font-weight: 600; color: #1e293b; font-size: 13.5px; }
    .row-sub { margin: 2px 0 0; font-size: 12px; }
    .row-card { padding: 0; overflow: hidden; }
    .row-card .row { border: none; border-radius: 0; }
    .chev { transition: transform 0.15s ease; color: #94a3b8; }
    .chev.open { transform: rotate(90deg); }
    .row-detail { border-top: 1px solid #e2e8f0; padding: 12px 16px 14px 44px; background: #fff; }
    .rd-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 4px 24px; }
    .rd-label { margin: 10px 0 2px; font-size: 10.5px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #94a3b8; }
    .rd-grid .rd-label { margin-top: 0; }
    .rd-text { margin: 0; font-size: 12.5px; color: #334155; line-height: 1.5; }
    .rd-files { display: flex; flex-direction: column; gap: 6px; }
    .rd-file { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 12.5px; color: #334155; }
    .rd-file .left { display: flex; align-items: center; gap: 8px; }
    .rd-file .left mat-icon { font-size: 16px; width: 16px; height: 16px; color: #64748b; }
    .rd-file .right { display: flex; align-items: center; gap: 12px; }
    .rd-download { display: inline-flex; align-items: center; gap: 3px; color: #2563eb; font-weight: 600; cursor: pointer; font-size: 12px; }
    .rd-download mat-icon { font-size: 15px; width: 15px; height: 15px; }
    .rd-actions { margin-top: 12px; }
    .return-reason-card { border: 1px solid #fecaca; background: #fef2f2; }
    .return-reason-card .rr-title { color: #b91c1c; display: flex; align-items: center; gap: 6px; }
    .return-reason-card .rr-text { margin: 6px 0 0; color: #7f1d1d; }
    .table-card { padding: 0; overflow: hidden; }
    .table-wrap { overflow-x: auto; overflow-y: auto; max-height: 62vh; }
    .table-wrap::-webkit-scrollbar { height: 10px; width: 10px; }
    .table-wrap::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 6px; }
    .table-wrap::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    .table-wrap::-webkit-scrollbar-track { background: #f1f5f9; }
    .row-actions { display: flex; flex-direction: row; gap: 6px; align-items: center; flex-wrap: nowrap; }
    .drill-btn { display: inline-flex; align-items: center; justify-content: center; gap: 4px; border: 1px solid #bfdbfe; background: #eff6ff; color: #1d4ed8; border-radius: 6px; padding: 3px 8px; font-size: 11px; font-weight: 600; font-family: inherit; cursor: pointer; }
    .drill-btn:hover { background: #dbeafe; }
    .drill-btn mat-icon { font-size: 15px; width: 15px; height: 15px; }
    .mini-btn { display: inline-flex; align-items: center; justify-content: center; gap: 4px; border-radius: 6px; padding: 3px 8px; font-size: 11px; font-weight: 600; font-family: inherit; cursor: pointer; border: 1px solid transparent; }
    .mini-btn mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .mini-btn:disabled { opacity: 0.6; cursor: default; }
    .mini-approve { background: #f0fdf4; border-color: #bbf7d0; color: #15803d; }
    .mini-approve:hover:not(:disabled) { background: #dcfce7; }
    .mini-reject { background: #fef2f2; border-color: #fecaca; color: #b91c1c; }
    .mini-reject:hover:not(:disabled) { background: #fee2e2; }
    .icon-only { padding: 4px 6px; }
    .icon-only mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .kpi-table { width: 100%; min-width: 980px; border-collapse: collapse; font-size: 11.5px; }
    .kpi-table th { position: sticky; top: 0; z-index: 1; text-align: left; padding: 6px 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; background: #f8fafc; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
    .kpi-table td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: top; line-height: 1.35; }
    .kpi-table tbody tr:last-child td { border-bottom: none; }
    .kpi-table tbody tr:hover { background: #f8fafc; }
    .kpi-table .desc { font-weight: 600; color: #1e293b; }
    .kpi-table .col-desc { min-width: 180px; max-width: 260px; }
    .kpi-table .col-narr { min-width: 120px; max-width: 190px; }
    .kpi-table .muted-cell { color: #64748b; }
    .kpi-table .nowrap { white-space: nowrap; }
    .kpi-table .wrap-col { min-width: 90px; max-width: 170px; overflow-wrap: break-word; }
    .row-badges { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .s-teal { background: #ccfbf1; color: #0f766e; }
    .poe-chip { display: inline-flex; align-items: center; gap: 4px; border: 1px solid #bfdbfe; background: #eff6ff; color: #1d4ed8; border-radius: 6px; padding: 3px 8px; font-size: 11px; font-weight: 600; font-family: inherit; cursor: pointer; }
    .poe-chip:hover:not(:disabled) { background: #dbeafe; }
    .poe-chip.no-poe { border-color: #e2e8f0; background: #f8fafc; color: #94a3b8; cursor: default; }
    .poe-chip mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .poe-chip mat-icon { font-size: 13px; width: 13px; height: 13px; }
    .empty { padding: 48px; text-align: center; color: #94a3b8; }
    .empty mat-icon { font-size: 48px; width: 48px; height: 48px; color: #cbd5e1; }
    .empty h3 { margin: 8px 0 4px; color: #475569; }
    .list { display: flex; flex-direction: column; gap: 12px; }
    .count-row { display: flex; align-items: center; gap: 10px; font-size: 13px; }
    .item { padding: 16px; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; cursor: pointer; transition: box-shadow .15s; }
    .item:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); }
    .head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; }
    .value { font-weight: 600; color: #1e293b; margin: 2px 0; }
    .muted { color: #64748b; }
    .small { font-size: 13px; }
    .tiny { font-size: 11px; }
    .italic { font-style: italic; }
    .center { text-align: center; padding: 16px 0; }
    .clamp { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge mat-icon { font-size: 13px; width: 13px; height: 13px; }
    .badge.outline { background: transparent; border: 1px solid #cbd5e1; color: #475569; }
    .s-gray { background:#f1f5f9; color:#475569; }
    .s-blue { background:#dbeafe; color:#1d4ed8; }
    .s-amber { background:#fef3c7; color:#b45309; }
    .s-red { background:#fee2e2; color:#b91c1c; }
    .s-green { background:#dcfce7; color:#15803d; }
    .s-purple { background:#f3e8ff; color:#7e22ce; }
    .detail-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0; margin-bottom: 12px; }
    .detail-head .left { display: flex; align-items: center; gap: 10px; }
    .detail-head h2 { margin: 0; font-size: 17px; }
    .detail-head .actions { display: flex; gap: 8px; }
    .act-btn { display: inline-flex; align-items: center; gap: 6px; border-radius: 8px; padding: 0 16px; height: 36px; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; border: 1px solid transparent; transition: background 0.15s ease, box-shadow 0.15s ease; white-space: nowrap; }
    .act-btn mat-icon { font-size: 17px; width: 17px; height: 17px; }
    .act-btn:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
    .act-reject { background: #fff; color: #b91c1c; border-color: #fecaca; }
    .act-reject:hover:not(:disabled) { background: #fef2f2; border-color: #fca5a5; }
    .act-return { background: #fff; color: #b45309; border-color: #fde68a; }
    .act-return:hover:not(:disabled) { background: #fffbeb; border-color: #fcd34d; }
    .act-approve { background: #16a34a; color: #fff; border-color: #16a34a; box-shadow: 0 1px 2px rgba(22, 163, 74, 0.35); }
    .act-approve:hover:not(:disabled) { background: #15803d; }
    .act-approve:disabled { background: #16a34a; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
    .plat-card h4 { margin: 0 0 8px; font-size: 14px; }
    .kv { display: flex; justify-content: space-between; padding: 2px 0; font-size: 13px; }
    .purple { color: #7c3aed; } .amber { color: #b45309; } .green { color: #16a34a; }
    .tracker { display: flex; flex-direction: column; gap: 5px; }
    .stage-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #94a3b8; margin-top: 6px; }
    .stage-label.stage-current { color: #b45309; }
    .step { display: flex; align-items: center; gap: 8px; padding: 5px 8px; border-radius: 8px; background: #f8fafc; font-size: 12.5px; }
    .step.current { background: #fffbeb; border: 1px solid #fde68a; }
    .step.past { background: #f0fdf4; }
    .step .step-label { color: #94a3b8; }
    .step.current .step-label { color: #92400e; font-weight: 600; }
    .step.past .step-label { color: #15803d; }
    .step mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .step .dot { width: 16px; height: 16px; border-radius: 999px; border: 2px solid #cbd5e1; }
    .step .tiny { margin-left: auto; }
    .chk { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #334155; padding: 2px 0; margin: 0; }
    .chk-icon { font-size: 15px; width: 15px; height: 15px; color: #16a34a; }
    .sub { margin-top: 10px !important; padding-top: 8px; border-top: 1px solid #e2e8f0; }
    .review-row { display: flex; align-items: flex-start; gap: 10px; padding: 7px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 6px; }
    .review-body p { margin: 0; }
    .pre { white-space: pre-line; }
    .narrative { margin-bottom: 8px; }
    .narrative p { margin: 2px 0 0; color: #334155; font-size: 13px; }
    .inline { vertical-align: middle; font-size: 18px; width: 18px; height: 18px; }
    .evidence-list { display: flex; flex-direction: column; gap: 8px; }
    .evidence-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
    .evidence-row .left { display: flex; align-items: center; gap: 10px; }
    .evidence-row .right-actions { display: flex; align-items: center; gap: 12px; }
    .evidence-row p { margin: 0; }
    .tinted { margin-top: 12px; }
    .tinted.purple { background: #faf5ff; border-color: #e9d5ff; }
    .tinted.amber { background: #fffbeb; border-color: #fde68a; }
    .tinted p { margin: 0; font-size: 14px; }
  `],
})
export class ActualsReviewComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);

  readonly levels = REVIEW_LEVELS;
  readonly stages = WORKFLOW_STAGES;

  readonly reviewLevels = toSignal(
    this.route.data.pipe(map((d) => {
      const levels = d['reviewLevels'] as string[] | undefined;
      if (levels?.length) return levels;
      const single = d['reviewLevel'] as string | undefined;
      return single ? [single] : ['line_manager'];
    })),
    { initialValue: ['line_manager'] as string[] },
  );
  readonly title = toSignal(
    this.route.data.pipe(map((d) => (d['title'] as string | undefined) ?? 'Actuals Review')),
    { initialValue: 'Actuals Review' },
  );
  readonly description = toSignal(
    this.route.data.pipe(map((d) => (d['description'] as string | undefined) ?? '')),
    { initialValue: '' },
  );
  readonly periodType = toSignal(
    this.route.data.pipe(map((d) => (d['periodType'] as string | undefined) ?? 'quarterly')),
    { initialValue: 'quarterly' },
  );
  readonly isMidYear = computed(() => this.periodType() === 'mid_year');

  readonly actuals = signal<KpiQuarterActual[]>([]);
  readonly cycles = signal<Cycle[]>([]);
  readonly selectedCycleId = signal<number | null>(null);
  readonly effectiveCycleId = computed<number | null>(() => this.selectedCycleId() ?? this.cycles()[0]?.id ?? null);
  readonly captureKpis = signal<ReviewKpiMeta[]>([]);
  readonly searched = signal(false);

  pendingSource = '';
  pendingDept = '';
  pendingPerson = '';
  pendingIndicator = '';
  pendingQuarter = 1;
  personOpen = false;
  private readonly applied = signal<{ source: string; dept: string; person: string; indicator: string; quarter: number }>(
    { source: '', dept: '', person: '', indicator: '', quarter: 1 });

  applyFilters() {
    this.applied.set({
      source: this.pendingSource,
      dept: this.pendingDept,
      person: this.pendingPerson,
      indicator: this.pendingIndicator.trim().toLowerCase(),
      quarter: this.pendingQuarter,
    });
    this.searched.set(true);
  }

  pickPerson(name: string) {
    this.pendingPerson = name;
    this.personOpen = false;
  }

  onCycle(id: number) {
    this.selectedCycleId.set(id);
    this.searched.set(false);
  }

  readonly captureKpiMap = computed<Record<number, ReviewKpiMeta>>(() => {
    const m: Record<number, ReviewKpiMeta> = {};
    for (const k of this.captureKpis()) m[k.id] = k;
    return m;
  });

  readonly departmentOptions = computed<string[]>(() =>
    [...new Set(this.captureKpis().map((k) => k.departmentName).filter((d): d is string => !!d))].sort());

  readonly personOptions = computed<{ name: string; jobTitle: string | null }[]>(() => {
    const byName = new Map<string, string | null>();
    for (const k of this.captureKpis()) {
      if (!k.responsiblePostName) continue;
      if (!byName.has(k.responsiblePostName)) byName.set(k.responsiblePostName, k.responsiblePostJobTitle ?? null);
    }
    return [...byName.entries()].map(([name, jobTitle]) => ({ name, jobTitle }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly tabs: { key: ReviewTabKey; label: string }[] = [
    { key: 'awaiting', label: 'Awaiting Review' },
    { key: 'approved', label: 'Approved' },
    { key: 'returned', label: 'Returned' },
  ];
  readonly activeTab = signal<ReviewTabKey>('awaiting');

  readonly awaitingItems = computed<KpiQuarterActual[]>(() =>
    this.filteredActuals().filter((a) => a.status === 'In Review' && !!a.reviewLevel && this.reviewLevels().includes(normalizeLevel(a.reviewLevel))));

  readonly approvedItems = computed<KpiQuarterActual[]>(() =>
    this.filteredActuals().filter((a) =>
      a.status === 'Approved'
      || (a.status === 'In Review' && !!a.reviewLevel && ['pms_manager', 'internal_audit'].includes(normalizeLevel(a.reviewLevel)))));

  readonly returnedItems = computed<KpiQuarterActual[]>(() =>
    this.filteredActuals().filter((a) => a.status === 'Returned' || a.status === 'Rejected'));

  readonly tabItems = computed<KpiQuarterActual[]>(() => {
    switch (this.activeTab()) {
      case 'awaiting': return this.awaitingItems();
      case 'approved': return this.approvedItems();
      default: return this.returnedItems();
    }
  });

  tabEmptyIcon(): string {
    return this.activeTab() === 'awaiting' ? 'check_circle' : 'inbox';
  }
  tabEmptyTitle(): string {
    switch (this.activeTab()) {
      case 'awaiting': return 'No Actuals Awaiting Review';
      case 'approved': return 'No Approved Actuals';
      default: return 'No Returned Actuals';
    }
  }
  tabEmptyHint(): string {
    switch (this.activeTab()) {
      case 'awaiting': return 'Items requiring your review will appear here.';
      case 'approved': return 'Actuals that have progressed past this stage will appear here.';
      default: return 'Actuals returned or rejected for revision will appear here.';
    }
  }

  readonly targetStats = computed<{ on: number; at: number; off: number }>(() => {
    let on = 0, at = 0, off = 0;
    for (const a of this.filteredActuals()) {
      const pct = this.scoreFor(a);
      if (pct === null) continue;
      if (pct >= 100) on++;
      else if (pct >= 50) at++;
      else off++;
    }
    return { on, at, off };
  });

  scoreFor(a: KpiQuarterActual): number | null {
    if (a.scorePct != null) return Math.round(a.scorePct * 10) / 10;
    const target = parseNumeric(this.rowTarget(a) ?? '');
    const actual = parseNumeric(a.actualValue ?? '');
    if (target === null || actual === null || target === 0) return null;
    return Math.round((actual / target) * 1000) / 10;
  }

  scoreClass(a: KpiQuarterActual): string {
    const pct = this.scoreFor(a);
    if (pct === null) return 's-gray';
    if (pct >= 100) return 's-green';
    if (pct >= 50) return 's-amber';
    return 's-red';
  }

  rowDescription(a: KpiQuarterActual): string {
    return this.captureKpiMap()[a.kpiId]?.description ?? this.kpiMap()[a.kpiId]?.description ?? `KPI #${a.kpiId}`;
  }
  canAct(a: KpiQuarterActual): boolean {
    return a.status === 'In Review' && !!a.reviewLevel && this.reviewLevels().includes(normalizeLevel(a.reviewLevel));
  }
  rowNumber(a: KpiQuarterActual): string {
    return this.captureKpiMap()[a.kpiId]?.kpiNumber ?? this.kpiMap()[a.kpiId]?.kpiNumber ?? String(a.kpiId);
  }
  rowTarget(a: KpiQuarterActual): string | null {
    const t = this.captureKpiMap()[a.kpiId]?.quarterTargets?.find((x) => x.quarter === a.quarter);
    return t?.targetValue ?? null;
  }
  rowStageBadge(a: KpiQuarterActual): string {
    if (a.status === 'Approved') return 'Audited';
    if (a.status === 'Returned') return 'Returned';
    if (a.status === 'Rejected') return 'Rejected';
    if (a.reviewLevel === 'internal_audit') return 'Internal Audit';
    return 'PMS Review';
  }

  readonly filteredActuals = computed<KpiQuarterActual[]>(() => {
    const list = this.actuals();
    if (this.isMidYear()) return list;
    if (!this.searched()) return [];
    const f = this.applied();
    const metaMap = this.captureKpiMap();
    return list.filter((a) => {
      if (a.quarter !== f.quarter) return false;
      const m = metaMap[a.kpiId];
      // Only show actuals for KPIs belonging to the selected financial year's cycle.
      if (!m) return false;
      if (f.source === 'departmental' ? m.scorecardType !== 'departmental' : m.scorecardType === 'departmental') return false;
      if (f.dept && m.departmentName !== f.dept) return false;
      if (f.person && m.responsiblePostName !== f.person) return false;
      if (f.indicator) {
        const info = this.kpiMap()[a.kpiId];
        const hay = `${m?.kpiNumber ?? info?.kpiNumber ?? ''} ${m?.description ?? info?.description ?? ''}`.toLowerCase();
        if (!hay.includes(f.indicator)) return false;
      }
      return true;
    });
  });

  readonly users = signal<User[]>([]);
  readonly evidence = signal<KpiEvidenceDocument[]>([]);
  downloadEvidence(doc: KpiEvidenceDocument) {
    this.api.getBlob(`/evidence/${doc.id}/download`).pipe(
      tap((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.fileName || 'evidence';
        link.click();
        URL.revokeObjectURL(url);
      }),
      catchError(() => { this.toast.error('Download failed', 'No file is stored for this evidence record'); return of(null); }),
    ).subscribe();
  }


  readonly kpiMap = signal<Record<number, KpiInfo>>({});
  readonly quarterTargets = signal<QuarterTarget[]>([]);
  readonly captureContext = signal<CaptureContext | null>(null);
  readonly reviews = signal<ReviewRecord[]>([]);
  readonly selectedActualId = signal<number | null>(null);
  readonly processing = signal(false);


  readonly selectedActual = computed(() => {
    const id = this.selectedActualId();
    if (id == null) return null;
    return this.actuals().find((a) => a.id === id) ?? null;
  });

  readonly levelLabel = computed(() =>
    this.reviewLevels().map((l) => REVIEW_LEVEL_LABELS[l] ?? l).join(' / '));
  readonly nextLevel = computed(() => {
    const actual = this.selectedActual();
    const level = actual?.reviewLevel ?? this.reviewLevels()[0];
    return REVIEW_LEVEL_NEXT[level] ?? 'Final Approval';
  });

  constructor() {
    effect(() => {
      const actual = this.selectedActual();
      if (actual) {
        this.loadEvidence(actual.kpiId, actual.quarter);
        this.loadQuarterTargets(actual.kpiId);
        this.loadKpiActualHistory(actual.kpiId);
        this.loadReviews(actual.id);
      } else {
        this.evidence.set([]);
        this.quarterTargets.set([]);
        this.captureContext.set(null);
        this.reviews.set([]);
        this.kpiActualHistory.set([]);
      }
    });
    effect(() => {
      this.reviewLevels();
      this.loadActuals();
    });
    effect(() => {
      const cycleId = this.effectiveCycleId();
      if (cycleId != null && !this.isMidYear()) this.loadCaptureKpis(cycleId);
    });
  }

  ngOnInit() {
    this.loadUsers();
    if (!this.isMidYear()) this.loadCycles();
  }

  private loadCycles() {
    this.api.get<Cycle[]>('/cycles')
      .pipe(catchError(() => of([] as Cycle[])))
      .subscribe((rows) => this.cycles.set(Array.isArray(rows) ? rows : []));
  }

  private loadCaptureKpis(cycleId: number) {
    this.api.get<ReviewKpiMeta[]>(`/cycles/${cycleId}/capture-kpis`)
      .pipe(catchError(() => of([] as ReviewKpiMeta[])))
      .subscribe((rows) => this.captureKpis.set(Array.isArray(rows) ? rows : []));
  }

  private loadActuals() {
    const params = this.isMidYear()
      ? { status: 'In Review', reviewLevel: this.reviewLevels().join(','), periodType: this.periodType() }
      : { periodType: this.periodType() };
    this.api.get<KpiQuarterActual[]>('/kpi-actuals', params)
      .pipe(catchError(() => of([] as KpiQuarterActual[])))
      .subscribe((rows) => {
        const list = Array.isArray(rows) ? rows : [];
        this.actuals.set(list);
        this.loadKpiInfos(list);
      });
  }

  private loadKpiInfos(list: KpiQuarterActual[]) {
    const known = this.kpiMap();
    const ids = [...new Set(list.map((a) => a.kpiId))].filter((id) => !known[id]);
    ids.forEach((id) => {
      this.api.get<KpiInfo>(`/scorecard-kpis/${id}`)
        .pipe(catchError(() => of(null)))
        .subscribe((kpi) => {
          if (kpi) this.kpiMap.update((m) => ({ ...m, [id]: kpi }));
        });
    });
  }

  readonly kpiActualHistory = signal<{ id: number; quarter: number; actualValue: string | null }[]>([]);

  private loadKpiActualHistory(kpiId: number) {
    this.api.get<{ id: number; quarter: number; actualValue: string | null }[]>(`/scorecard-kpis/${kpiId}/actuals`, { periodType: this.periodType() })
      .pipe(catchError(() => of([])))
      .subscribe((rows) => this.kpiActualHistory.set(Array.isArray(rows) ? rows : []));
  }

  private loadQuarterTargets(kpiId: number) {
    // Use capture-context so the displayed target matches the effective
    // (possibly revised) target the stored assessment was computed against.
    this.api.get<CaptureContext>(`/scorecard-kpis/${kpiId}/capture-context`)
      .pipe(catchError(() => of(null)))
      .subscribe((ctx) => {
        this.captureContext.set(ctx);
        this.quarterTargets.set(Array.isArray(ctx?.targets) ? ctx!.targets : []);
      });
  }

  private loadReviews(actualId: number) {
    this.api.get<ReviewRecord[]>(`/kpi-actuals/${actualId}/reviews`)
      .pipe(catchError(() => of([] as ReviewRecord[])))
      .subscribe((rows) => this.reviews.set(Array.isArray(rows) ? rows : []));
  }

  reviewActionColor(action: string): string {
    if (action === 'approve') return 's-green';
    if (action === 'return') return 's-amber';
    if (action === 'reject') return 's-red';
    return 's-gray';
  }

  achievementPctFor(a: KpiQuarterActual): string | null {
    if (a.scorePct != null) return `${Math.round(a.scorePct * 10) / 10}%`;
    const target = parseNumeric(this.quarterTargetFor(a) ?? '');
    const actual = parseNumeric(a.actualValue ?? '');
    if (target === null || actual === null || target === 0) return null;
    return `${Math.round((actual / target) * 1000) / 10}%`;
  }

  private loadUsers() {
    this.api.get<User[]>('/auth/users')
      .pipe(catchError(() => of([] as User[])))
      .subscribe((rows) => this.users.set(Array.isArray(rows) ? rows : []));
  }

  downloadPoe(a: KpiQuarterActual) {
    this.api.get<KpiEvidenceDocument[]>(`/scorecard-kpis/${a.kpiId}/evidence`, { quarter: a.quarter, periodType: this.periodType() })
      .pipe(catchError(() => of([] as KpiEvidenceDocument[])))
      .subscribe((rows) => {
        const docs = Array.isArray(rows) ? rows : [];
        if (!docs.length) { this.toast.error('No evidence', 'No evidence documents found for this KPI'); return; }
        docs.forEach((doc, i) => setTimeout(() => this.downloadEvidence(doc), i * 400));
      });
  }

  private loadEvidence(kpiId: number, quarter: number) {
    this.api.get<KpiEvidenceDocument[]>(`/scorecard-kpis/${kpiId}/evidence`, { quarter, periodType: this.periodType() })
      .pipe(catchError(() => of([] as KpiEvidenceDocument[])))
      .subscribe((rows) => this.evidence.set(Array.isArray(rows) ? rows : []));
  }

  userName(id: number | null | undefined): string {
    if (!id) return '—';
    const u = this.users().find((x) => x.id === id);
    return u ? u.displayName : `User #${id}`;
  }

  kpiInfo(kpiId: number): KpiInfo | null { return this.kpiMap()[kpiId] ?? null; }

  kpiLabel(kpiId: number): string {
    const kpi = this.kpiInfo(kpiId);
    if (!kpi) return `KPI #${kpiId}`;
    return kpi.kpiNumber ? `KPI ${kpi.kpiNumber}` : `KPI #${kpiId}`;
  }

  quarterTargetFor(a: KpiQuarterActual): string | null {
    const t = this.quarterTargets().find((x) => x.quarter === a.quarter);
    return t?.targetValue ?? null;
  }

  varianceFor(a: KpiQuarterActual): string | null {
    return computeVariance(a.actualValue, this.quarterTargetFor(a));
  }

  prevQuarterActualFor(a: KpiQuarterActual): string | null {
    if (a.quarter <= 1) return null;
    const prev = this.kpiActualHistory().find((h) => h.quarter === a.quarter - 1);
    return prev?.actualValue ?? null;
  }

  ytdFor(a: KpiQuarterActual): string | null {
    let sum = 0;
    let any = false;
    for (const h of this.kpiActualHistory()) {
      if (h.quarter > a.quarter || h.id === a.id || !h.actualValue) continue;
      const n = parseNumeric(h.actualValue);
      if (n !== null) { sum += n; any = true; }
    }
    const cur = a.actualValue ? parseNumeric(a.actualValue) : null;
    if (cur !== null) { sum += cur; any = true; }
    if (!any) return null;
    return `${Math.round(sum * 100) / 100}`;
  }

  assessmentLabel(a: KpiQuarterActual): string {
    if (a.assessment) return a.assessment;
    if (a.isAchieved === true) return 'Achieved';
    if (a.isAchieved === false) return 'Not Achieved';
    return 'Unable to Assess';
  }

  assessmentColor(a: KpiQuarterActual): string {
    return ASSESSMENT_COLORS[assessmentBadgeClass(this.assessmentLabel(a))] ?? 's-gray';
  }

  assessmentIcon(a: KpiQuarterActual): string {
    const label = this.assessmentLabel(a);
    if (label === 'Achieved' || label === 'Over Achieved') return 'check_circle';
    if (label === 'On Hold') return 'pause_circle';
    if (label === 'Not Applicable' || label === 'Unable to Assess') return 'help';
    return 'warning';
  }

  statusColor(status: string): string { return STATUS_COLORS[status] ?? 's-gray'; }
  verificationColor(status: string): string { return VERIFICATION_COLORS[status] ?? 's-gray'; }
  levelLabelFor(level: string): string { return REVIEW_LEVEL_LABELS[level] ?? level; }
  stageFor(level: string | null | undefined): string { return stageForLevel(level); }
  levelIndex(level: string): number { return REVIEW_LEVELS.indexOf(normalizeLevel(level)); }

  isPast(currentLevel: string | null | undefined, idx: number): boolean {
    if (!currentLevel) return false;
    return REVIEW_LEVELS.indexOf(normalizeLevel(currentLevel)) > idx;
  }

  hasAnalysis(a: KpiQuarterActual): boolean {
    return !!(a.challengeNarrative || a.underperformanceReason || a.overperformanceReason || a.correctiveAction || a.budgetImplication);
  }

  select(id: number) { this.selectedActualId.set(id); }
  back() { this.selectedActualId.set(null); }

  approve(actualId: number) {
    this.processing.set(true);
    const actual = this.actuals().find((a) => a.id === actualId);
    const levelName = actual?.reviewLevel ? (REVIEW_LEVEL_LABELS[actual.reviewLevel] ?? actual.reviewLevel) : this.title();
    this.api.post(`/kpi-actuals/${actualId}/transition`, {
      action: 'approve',
      comments: `Approved at ${levelName} level`,
      reviewLevel: actual?.reviewLevel ?? undefined,
    })
      .pipe(catchError((e) => { this.toast.error('Error', e?.error?.error || e?.error?.message || 'Failed to approve'); return of(null); }))
      .subscribe((res) => {
        this.processing.set(false);
        if (res) {
          const level = actual?.reviewLevel ? normalizeLevel(actual.reviewLevel) : this.reviewLevels()[0];
          const next = REVIEW_LEVEL_NEXT[level] ?? 'Final Approval';
          this.toast.success('Actual approved', next === 'Final Approval'
            ? 'All review levels complete — actual is now approved.'
            : `Forwarded to ${next} for review.`);
          this.selectedActualId.set(null);
          this.loadActuals();
        }
      });
  }

  openReturn(actualId: number, mode: 'return' | 'reject' = 'return') {
    this.dialog.open(ActualsReturnDialogComponent, { data: { id: actualId, mode }, panelClass: 'plat-dialog', autoFocus: false })
      .afterClosed().subscribe((reason) => { if (reason) this.doReturn(actualId, reason, mode); });
  }

  private doReturn(actualId: number, comments: string, mode: 'return' | 'reject' = 'return') {
    this.processing.set(true);
    this.api.post(`/kpi-actuals/${actualId}/transition`, { action: mode, comments })
      .pipe(catchError((e) => { this.toast.error('Error', e?.error?.error || e?.error?.message || `Failed to ${mode}`); return of(null); }))
      .subscribe((res) => {
        this.processing.set(false);
        if (res) {
          this.toast.success(mode === 'reject' ? 'Actual rejected' : 'Actual returned to submitter');
          this.selectedActualId.set(null);
          this.loadActuals();
        }
      });
  }
}
