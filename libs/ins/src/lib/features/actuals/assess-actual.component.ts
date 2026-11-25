import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, forkJoin, of, tap } from 'rxjs';
import { ApiService } from '@ins-core/services/api.service';
import { ToastService } from '@ins-core/services/toast.service';
import {
  CaptureContext, CaptureForm, EvidenceDoc, KpiActual, UploadForm,
  UploadEvidenceDialogComponent, emptyCaptureForm,
} from './submit-actuals.component';
import {
  computeAssessment, computeVariance, assessmentBadgeClass,
  RatingThreshold, isQualitativeTarget, computeScorePct, ratingFromScore, assessmentFromScore,
} from './assessment.util';

/**
 * Full-page quarterly assessment. Opened from the Quarterly Actuals table;
 * the KPI id comes from the route and the quarter from the query string.
 */
@Component({
  selector: 'app-assess-actual',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <div class="topbar">
        <button type="button" class="back-link" (click)="goBack()">
          <mat-icon>arrow_back</mat-icon><span>Back to Quarterly Actuals</span>
        </button>
      </div>

      <ng-container *ngIf="captureContext() as ctx; else loadingTpl">
        <div class="hero plat-card">
          <div class="hero-main">
            <p class="crumb">Quarterly Actuals · Assessment</p>
            <h2 class="hero-title">
              <span class="mono" *ngIf="ctx.kpiNumber">{{ ctx.kpiNumber }}</span>
              {{ ctx.kpiDescription }}
            </h2>
            <p class="hero-sub">
              <ng-container *ngIf="ctx.nkpa">{{ ctx.nkpa }} · </ng-container>
              <span class="chip">Q{{ form.quarter }}</span>
              <span class="chip">Target: {{ target() ?? '—' }}<ng-container *ngIf="ctx.uomName"> {{ ctx.uomName }}</ng-container></span>
              <span class="chip" *ngIf="ctx.departmentName">{{ ctx.departmentName }}</span>
              <span class="chip" *ngIf="ctx.responsibleOfficialName">{{ ctx.responsibleOfficialName }}</span>
            </p>
          </div>
          <div class="rating-box" *ngIf="ratingLabel() !== 'Unable to Assess'" [class]="'rate-' + ratingClass()">
            <div class="rating-top">
              <span class="rating-title">{{ ratingLabel() }}</span>
              <span class="rating-pct" *ngIf="ratingPct() as pct">{{ pct }}</span>
            </div>
            <p class="muted xs m0" *ngIf="variance() as v">Variance vs quarter target: {{ v }}</p>
          </div>
        </div>

        <div class="return-banner" *ngIf="returnedActual() as ra">
          <mat-icon>{{ ra.status === 'Rejected' ? 'cancel' : 'undo' }}</mat-icon>
          <div>
            <p class="bold small m0">{{ ra.status === 'Rejected' ? 'Rejected by reviewer' : 'Returned for correction' }}</p>
            <p class="small m0">{{ ra.reviewComments || 'No reason was provided.' }}</p>
            <p class="muted xs m0" *ngIf="ra.status !== 'Rejected'">Update the information below and submit again for review.</p>
            <p class="muted xs m0" *ngIf="ra.status === 'Rejected'">Rejection is final — this actual can no longer be edited or resubmitted.</p>
          </div>
        </div>

        <div class="lock-banner" *ngIf="locked()">
          <mat-icon>lock</mat-icon>
          <div>
            <p class="bold small m0">Assessment locked</p>
            <p class="muted small m0">This assessment has been submitted for review and cannot be edited.
              It will become editable again if returned by Manager Review, PMS Review, or flagged by Internal Audit.</p>
          </div>
        </div>

        <div class="grid">
          <div class="col-main">
            <div class="plat-card">
              <div class="toggle-row">
                <label class="switch">
                  <input type="checkbox" [(ngModel)]="notApplicable" (ngModelChange)="onNaToggle($event)" [disabled]="locked()">
                  <span class="slider"></span>
                </label>
                <span class="toggle-label">Not Applicable for Quarter</span>
                <label class="switch">
                  <input type="checkbox" [(ngModel)]="form.isOnHold" (ngModelChange)="onHoldToggle($event)" [disabled]="locked()">
                  <span class="slider"></span>
                </label>
                <span class="toggle-label">On Hold</span>
              </div>

              <h4 class="assess-section">Performance Data</h4>
              <label class="fld-label">Actual <span class="muted" *ngIf="ctx.uomName">({{ ctx.uomName }})</span></label>
              <input class="f-control" [(ngModel)]="form.actualValue"
                     [disabled]="locked() || flaggedOut()" />

              <label class="fld-label">Actual Comment</label>
              <textarea class="f-area" rows="2" [(ngModel)]="form.commentary"
                        [disabled]="locked() || flaggedOut()"></textarea>

              <h4 class="assess-section">Analysis</h4>
              <div class="score-panel" *ngIf="!notApplicable && !form.isOnHold">
                <div class="score-row" *ngIf="qualitativeTarget()">
                  <label class="fld-label m0">Qualitative achievement (%)
                    <span class="muted xs">— optional; leave blank for AI assessment</span></label>
                  <input class="f-control score-input" type="number" min="0" max="200"
                         [(ngModel)]="qualScorePct" [disabled]="locked()"
                         placeholder="AI" />
                </div>
                <ng-container *ngIf="scorePct() as sp; else noScoreTpl">
                  <div class="score-row">
                    <span class="muted small">KPI Score (Actual ÷ Target × 100)</span>
                    <span class="score-val">{{ sp.value | number: '1.0-2' }}%</span>
                  </div>
                  <div class="score-row" *ngIf="scoreRating() as r">
                    <span class="muted small">Rating</span>
                    <span class="badge" [class]="ratingClass()">Level {{ r.level }} — {{ r.label }}</span>
                  </div>
                  <div class="score-row">
                    <span class="muted small">Target met?</span>
                    <span class="badge" [class]="ratingClass()">{{ ratingLabel() }}</span>
                  </div>
                </ng-container>
                <ng-template #noScoreTpl>
                  <p class="muted xs italic m0" *ngIf="qualitativeTarget()">
                    Enter the achievement % above, or save the draft and the AI assessor will
                    score this qualitative target against the rating thresholds.</p>
                  <p class="muted xs italic m0" *ngIf="!qualitativeTarget()">
                    Capture the actual to compute the KPI score and rating.</p>
                </ng-template>
                <div class="ai-note" *ngIf="aiRationale() as reason">
                  <mat-icon class="inline">auto_awesome</mat-icon>
                  <div>
                    <p class="bold xs m0">AI assessment</p>
                    <p class="muted xs m0">{{ reason }}</p>
                  </div>
                </div>
              </div>
              <div class="ana-grid">
                <div>
                  <label class="fld-label">Challenges</label>
                  <textarea class="f-area" rows="2" placeholder="None" [(ngModel)]="form.challengeNarrative"
                            [disabled]="locked() || flaggedOut()"></textarea>
                </div>
                <div>
                  <label class="fld-label">Corrective Action</label>
                  <textarea class="f-area" rows="2" placeholder="None" [(ngModel)]="form.correctiveAction"
                            [disabled]="locked() || flaggedOut()"></textarea>
                </div>
              </div>

              <h4 class="assess-section">Proof of Evidence (POE)</h4>
              <div class="poe-req">
                <p class="poe-req-label">Required evidence (per locked SDBIP)</p>
                <p class="small m0">{{ flaggedOut() ? 'N/A' : (poe() ?? '—') }}</p>
              </div>
              <ng-container>
                <div class="docs" *ngIf="quarterEvidence().length">
                  <div class="doc" *ngFor="let doc of quarterEvidence()">
                    <div class="doc-info">
                      <mat-icon>insert_drive_file</mat-icon>
                      <div>
                        <p class="bold small m0">{{ doc.fileName }}</p>
                        <p class="muted xs m0">Ref EV-{{ doc.id }}<span *ngIf="doc.documentType"> · {{ doc.documentType }}</span></p>
                      </div>
                    </div>
                    <button mat-icon-button matTooltip="Download" *ngIf="hasFile(doc)" (click)="downloadEvidence(doc)">
                      <mat-icon>download</mat-icon>
                    </button>
                    <button mat-icon-button matTooltip="Delete" color="warn"
                            *ngIf="canUpload() && doc.verificationStatus !== 'Verified'" (click)="deleteEvidence(doc)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </div>
                <button type="button" class="upload-btn" *ngIf="canUpload()" [disabled]="uploading()" (click)="openUpload()">
                  <mat-icon>cloud_upload</mat-icon><span>{{ uploading() ? 'Uploading…' : 'Upload Evidence' }}</span>
                </button>
              </ng-container>

              <div class="assess-footer">
                <ng-container *ngIf="!locked()">
                  <button mat-stroked-button (click)="save()"
                          matTooltip="Saves the assessment as a draft — the KPI is not escalated for review">
                    Save
                  </button>
                  <button mat-stroked-button (click)="submit()"
                          matTooltip="Submits the assessment for review — the KPI is escalated">
                    Submit
                  </button>
                </ng-container>
                <button mat-stroked-button (click)="goBack()">
                  Close
                </button>
              </div>
            </div>
          </div>

          <div class="col-side">
            <div class="plat-card">
              <h4 class="panel-title"><mat-icon class="inline">assignment</mat-icon> Planning Information
                <span class="badge outline tiny"><mat-icon>lock</mat-icon> Read only</span>
              </h4>
              <div class="kv"><span class="muted">Financial Year</span><span class="val">{{ ctx.financialYearLabel ?? '—' }}</span></div>
              <div class="kv"><span class="muted">SDBIP Version</span><span class="val">{{ ctx.scorecardName ?? '—' }}</span></div>
              <div class="kv" *ngIf="ctx.strategicObjective"><span class="muted">Strategic Objective</span><span class="val">{{ ctx.strategicObjective }}</span></div>
              <div class="kv" *ngIf="ctx.technicalIndicator"><span class="muted">Technical Indicator</span><span class="val">{{ ctx.technicalIndicator }}</span></div>
              <div class="kv"><span class="muted">Unit of Measure</span><span class="val">{{ ctx.uomName ?? '—' }}</span></div>
              <div class="kv"><span class="muted">Baseline</span><span class="val">{{ ctx.baseline ?? '—' }}</span></div>
              <div class="kv"><span class="muted">Annual Target</span><span class="val">{{ ctx.annualTarget ?? '—' }}</span></div>
              <div class="kv" *ngIf="ctx.fundingSource"><span class="muted">Funding Source</span><span class="val">{{ ctx.fundingSource }}</span></div>
              <div class="kv"><span class="muted">Responsible Person</span><span class="val">{{ ctx.responsibleOfficialName ?? '—' }}<ng-container *ngIf="ctx.responsibleJobTitle"> — {{ ctx.responsibleJobTitle }}</ng-container></span></div>
              <div class="kv"><span class="muted">Department</span><span class="val">{{ ctx.departmentName ?? '—' }}</span></div>
            </div>

            <div class="plat-card">
              <h4 class="panel-title"><mat-icon class="inline">insights</mat-icon> Quarterly Performance</h4>
              <table class="qtable">
                <thead>
                  <tr><th>Period</th><th>Target</th><th>Actual</th><th>Assessment</th></tr>
                </thead>
                <tbody>
                  <tr *ngFor="let row of quarterRows()" [class.current]="row.quarter === form.quarter">
                    <td class="mono">Q{{ row.quarter }}</td>
                    <td>{{ row.target ?? '—' }}</td>
                    <td>{{ row.actual ?? '—' }}</td>
                    <td><span class="badge" [class]="row.assessClass" *ngIf="row.assessment">{{ row.assessment }}</span><span *ngIf="!row.assessment">—</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ng-container>
      <ng-template #loadingTpl>
        <div class="plat-card empty" *ngIf="loaded(); else spinnerTpl">
          <mat-icon>error_outline</mat-icon>
          <p class="bold">KPI not found</p>
          <p class="muted small">The indicator could not be loaded. It may have been removed.</p>
        </div>
        <ng-template #spinnerTpl>
          <div class="plat-card empty"><p class="muted small m0">Loading assessment…</p></div>
        </ng-template>
      </ng-template>
    </section>
  `,
  styles: [`
    .plat-page { display: flex; flex-direction: column; gap: 14px; }
    .topbar { display: flex; }
    .back-link {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 8px 16px 8px 12px; border-radius: 8px; cursor: pointer;
      background: #fff; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(15, 23, 42, .05);
      color: #334155; font-size: 13px; font-weight: 600; font-family: inherit;
      transition: all .15s ease;
    }
    .back-link mat-icon { font-size: 18px; width: 18px; height: 18px; color: #64748b; transition: all .15s ease; }
    .back-link:hover { border-color: #bfdbfe; background: #eff6ff; color: #1d4ed8; }
    .back-link:hover mat-icon { color: #1d4ed8; transform: translateX(-2px); }
    .upload-btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 6px 13px; border-radius: 7px; cursor: pointer; border: none;
      background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%);
      color: #fff; font-size: 12px; font-weight: 600; font-family: inherit; letter-spacing: .01em;
      box-shadow: 0 1px 2px rgba(29, 78, 216, .3), inset 0 1px 0 rgba(255, 255, 255, .15);
      transition: all .15s ease;
    }
    .upload-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .upload-btn:hover:not(:disabled) { background: linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%); box-shadow: 0 3px 8px rgba(29, 78, 216, .35), inset 0 1px 0 rgba(255, 255, 255, .15); transform: translateY(-1px); }
    .upload-btn:active:not(:disabled) { transform: translateY(0); }
    .upload-btn:disabled { opacity: .6; cursor: default; }
    .plat-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; }
    .hero { display: flex; gap: 18px; align-items: flex-start; justify-content: space-between; }
    .crumb { font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #2563eb; margin: 0 0 5px; }
    .hero-title { margin: 0 0 7px; font-size: 19px; font-weight: 700; color: #0f172a; }
    .hero-title .mono { font-family: monospace; color: #2563eb; margin-right: 8px; }
    .hero-sub { margin: 0; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; color: #64748b; font-size: 13px; }
    .chip { background: #f1f5f9; border-radius: 999px; padding: 3px 10px; font-size: 12px; font-weight: 600; color: #334155; }
    .grid { display: grid; grid-template-columns: minmax(0, 1fr) 370px; gap: 14px; align-items: start; }
    @media (max-width: 1100px) { .grid { grid-template-columns: 1fr; } }
    .col-side { display: flex; flex-direction: column; gap: 14px; }
    .lock-banner { display: flex; gap: 12px; align-items: flex-start; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 14px 18px; }
    .return-banner { display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border: 1px solid #fecaca; background: #fef2f2; border-radius: 10px; margin-bottom: 14px; }
    .return-banner mat-icon { color: #dc2626; }
    .return-banner p { color: #7f1d1d; }
    .return-banner .muted { color: #b91c1c; }
    .lock-banner mat-icon { color: #b45309; }
    .toggle-row { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
    .toggle-label { font-size: 14px; color: #334155; font-weight: 500; margin-right: 18px; }
    .switch { position: relative; display: inline-block; width: 36px; height: 20px; flex: 0 0 auto; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; inset: 0; background: #cbd5e1; border-radius: 999px; transition: .15s; }
    .slider:before { content: ""; position: absolute; height: 14px; width: 14px; left: 3px; top: 3px; background: #fff; border-radius: 50%; transition: .15s; }
    .switch input:checked + .slider { background: #2563eb; }
    .switch input:checked + .slider:before { transform: translateX(16px); }
    .switch input:disabled + .slider { opacity: .5; cursor: default; }
    .assess-section { margin: 15px 0 8px; font-size: 13px; font-weight: 700; color: #1d4ed8; text-transform: uppercase; letter-spacing: .04em; }
    .fld-label { display: block; font-size: 12px; font-weight: 600; color: #475569; margin: 10px 0 4px; }
    .f-control, .f-area { width: 100%; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 10px; font-size: 14px; font-family: inherit; }
    .f-control:disabled, .f-area:disabled { background: #f8fafc; color: #94a3b8; }
    .ana-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .rating-box { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 18px; min-width: 220px; }
    .rating-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .rating-title { font-weight: 700; font-size: 15px; }
    .rating-pct { font-weight: 700; font-size: 15px; }
    .rate-green { background: #f0fdf4; border-color: #bbf7d0; color: #15803d; }
    .rate-blue { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }
    .rate-amber { background: #fffbeb; border-color: #fde68a; color: #b45309; }
    .rate-red { background: #fef2f2; border-color: #fecaca; color: #b91c1c; }
    .rate-purple { background: #faf5ff; border-color: #e9d5ff; color: #7e22ce; }
    .rate-gray { background: #f8fafc; border-color: #e2e8f0; color: #475569; }
    .poe-req { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 10px 14px; margin-bottom: 10px; }
    .poe-req-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .04em; margin: 0 0 4px; }
    .docs { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
    .doc { display: flex; align-items: center; justify-content: space-between; gap: 12px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; }
    .doc-info { display: flex; align-items: center; gap: 10px; }
    .doc-info mat-icon { color: #64748b; }
    .assess-footer { display: flex; gap: 10px; align-items: center; justify-content: flex-end; margin-top: 15px; padding-top: 12px; border-top: 1px solid #e2e8f0; }
    .panel-title { display: flex; align-items: center; gap: 8px; margin: 0 0 9px; font-size: 14px; font-weight: 700; color: #0f172a; }
    .panel-title .inline { font-size: 18px; width: 18px; height: 18px; color: #2563eb; }
    .kv { display: flex; justify-content: space-between; gap: 16px; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    .kv:last-child { border-bottom: 0; }
    .kv .val { text-align: right; font-weight: 500; color: #0f172a; }
    .qtable { width: 100%; border-collapse: collapse; font-size: 13px; }
    .qtable th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #64748b; padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
    .qtable td { padding: 7px 8px; border-bottom: 1px solid #f1f5f9; }
    .qtable tr.current td { background: #eff6ff; }
    .badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge.green { background: #dcfce7; color: #15803d; }
    .badge.blue { background: #dbeafe; color: #1d4ed8; }
    .badge.amber { background: #fef3c7; color: #b45309; }
    .badge.red { background: #fee2e2; color: #b91c1c; }
    .badge.purple { background: #f3e8ff; color: #7e22ce; }
    .badge.gray { background: #f1f5f9; color: #475569; }
    .badge.outline { border: 1px solid #e2e8f0; background: #fff; color: #64748b; }
    .badge.outline mat-icon { font-size: 12px; width: 12px; height: 12px; }
    .badge.tiny { font-size: 10px; }
    .score-panel { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 8px; }
    .score-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .score-val { font-weight: 700; font-size: 15px; }
    .score-input { max-width: 140px; }
    .ai-note { display: flex; gap: 8px; align-items: flex-start; background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 8px 10px; }
    .ai-note mat-icon { font-size: 16px; width: 16px; height: 16px; color: #6366f1; margin-top: 1px; }
    .mono { font-family: monospace; }
    .muted { color: #64748b; } .small { font-size: 13px; } .xs { font-size: 11px; }
    .bold { font-weight: 600; } .italic { font-style: italic; } .m0 { margin: 0; }
    .empty { padding: 40px; text-align: center; color: #64748b; }
    .empty mat-icon { font-size: 40px; width: 40px; height: 40px; color: #cbd5e1; }
  `],
})
export class AssessActualComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private kpiId = 0;
  private quarter = 1;

  captureContext = signal<CaptureContext | null>(null);
  actuals = signal<KpiActual[]>([]);
  quarterEvidence = signal<EvidenceDoc[]>([]);
  uploading = signal(false);
  loaded = signal(false);

  form: CaptureForm = emptyCaptureForm();
  notApplicable = false;
  qualScorePct: number | null = null;
  thresholds = signal<RatingThreshold[]>([]);
  private assessActualId: number | null = null;

  ngOnInit() {
    this.kpiId = Number(this.route.snapshot.paramMap.get('kpiId')) || 0;
    const q = Number(this.route.snapshot.queryParamMap.get('quarter'));
    this.quarter = q >= 1 && q <= 4 ? q : 1;
    this.form.quarter = this.quarter;
    if (!this.kpiId) { this.loaded.set(true); return; }
    forkJoin({
      ctx: this.api.get<CaptureContext>(`/scorecard-kpis/${this.kpiId}/capture-context`).pipe(catchError(() => of(null))),
      actuals: this.api.get<KpiActual[]>(`/scorecard-kpis/${this.kpiId}/actuals`, { periodType: 'quarterly' }).pipe(
        catchError(() => of([] as KpiActual[])),
      ),
      thresholds: this.api.get<RatingThreshold[]>('/kpi-rating-thresholds').pipe(
        catchError(() => of([] as RatingThreshold[])),
      ),
    }).subscribe(({ ctx, actuals, thresholds }) => {
      this.captureContext.set(ctx);
      this.thresholds.set(Array.isArray(thresholds) ? thresholds : []);
      const list = Array.isArray(actuals) ? actuals : [];
      this.actuals.set(list);
      this.loadEvidence();
      this.buildForm(list);
      this.loaded.set(true);
    });
  }

  goBack() {
    this.router.navigate(['/actuals/submit']);
  }

  private buildForm(list: KpiActual[]) {
    const existing = list.find((a) => a.quarter === this.quarter) ?? null;
    if (existing) {
      this.assessActualId = existing.id;
      this.form = {
        quarter: existing.quarter,
        actualValue: existing.actualValue ?? '',
        commentary: existing.commentary ?? '',
        isOnHold: existing.isOnHold ?? false,
        onHoldReason: existing.onHoldReason ?? '',
        challengeNarrative: existing.challengeNarrative ?? '',
        correctiveAction: existing.correctiveAction ?? '',
        underperformanceReason: existing.underperformanceReason ?? '',
        overperformanceReason: existing.overperformanceReason ?? '',
        budgetImplication: existing.budgetImplication ?? '',
        analysisNotes: existing.analysisNotes ?? '',
        lateOverrideReason: existing.lateOverrideReason ?? '',
      };
      this.qualScorePct = existing.qualitativeScorePct ?? null;
      this.notApplicable = (existing.actualValue ?? '').trim().toUpperCase() === 'N/A';
    } else {
      this.assessActualId = null;
      this.form = emptyCaptureForm();
      this.form.quarter = this.quarter;
      this.qualScorePct = null;
      this.notApplicable = false;
    }
  }

  private reload() {
    this.api.get<KpiActual[]>(`/scorecard-kpis/${this.kpiId}/actuals`, { periodType: 'quarterly' }).pipe(
      catchError(() => of([] as KpiActual[])),
    ).subscribe((rows) => {
      const list = Array.isArray(rows) ? rows : [];
      this.actuals.set(list);
      this.loadEvidence();
      this.buildForm(list);
    });
  }

  private loadEvidence() {
    this.api.get<EvidenceDoc[]>(`/scorecard-kpis/${this.kpiId}/evidence`, { quarter: this.quarter, periodType: 'quarterly' }).pipe(
      catchError(() => of([] as EvidenceDoc[])),
    ).subscribe((rows) => {
      this.quarterEvidence.set(Array.isArray(rows) ? rows : []);
    });
  }

  canUpload(): boolean {
    if (!this.cycleOpen()) return false;
    const a = this.assessActual();
    return !a || this.canEdit(a);
  }

  assessActual(): KpiActual | null {
    return this.actuals().find((a) => a.id === this.assessActualId) ?? null;
  }

  returnedActual(): KpiActual | null {
    const a = this.assessActual();
    return a && (a.status === 'Returned' || a.status === 'Rejected') ? a : null;
  }

  cycleOpen(): boolean {
    const s = this.captureContext()?.cycleStatus;
    if (!s) return true;
    return s === 'Open' || s === 'Active';
  }

  canEdit(a: KpiActual): boolean {
    return this.cycleOpen() && (a.status === 'Draft' || a.status === 'Returned');
  }

  locked(): boolean {
    if (!this.cycleOpen()) return true;
    const a = this.assessActual();
    return !!a && !this.canEdit(a);
  }

  target(): string | null {
    const ctx = this.captureContext();
    return ctx?.targets.find((t) => t.quarter === this.form.quarter)?.targetValue ?? null;
  }

  qualitativeTarget(): boolean {
    return isQualitativeTarget(this.target(), this.captureContext()?.uomName ?? null);
  }

  scorePct(): { value: number } | null {
    if (this.notApplicable || this.form.isOnHold) return null;
    const v = computeScorePct(
      this.form.actualValue || '', this.target(),
      this.captureContext()?.uomName ?? null, this.qualScorePct,
    );
    if (v !== null) return { value: v };
    // Qualitative target scored server-side (AI): show the saved score when
    // the on-screen actual still matches what was assessed.
    const saved = this.assessActual();
    if (saved?.scorePct != null && (saved.actualValue ?? '') === this.form.actualValue) {
      return { value: saved.scorePct };
    }
    return null;
  }

  aiRationale(): string | null {
    if (this.notApplicable || this.form.isOnHold) return null;
    const saved = this.assessActual();
    if (!saved?.aiRationale) return null;
    return (saved.actualValue ?? '') === this.form.actualValue ? saved.aiRationale : null;
  }

  scoreRating(): RatingThreshold | null {
    const sp = this.scorePct();
    if (!sp || !this.thresholds().length) return null;
    return ratingFromScore(sp.value, this.thresholds());
  }

  ratingLabel(): string {
    if (this.notApplicable) return 'Not Applicable';
    const sp = this.scorePct();
    if (sp && this.thresholds().length) {
      return assessmentFromScore(sp.value, this.thresholds());
    }
    const ctx = this.captureContext();
    const t = ctx?.targets.find((x) => x.quarter === this.form.quarter);
    return computeAssessment(
      this.form.actualValue || '', t?.targetValue ?? null,
      t?.targetStatus ?? null, ctx?.uomName ?? null, this.form.isOnHold,
    );
  }

  ratingClass(): string {
    return assessmentBadgeClass(this.ratingLabel());
  }

  ratingPct(): string | null {
    const sp = this.scorePct();
    return sp === null ? null : `${sp.value.toFixed(1)}%`;
  }

  variance(): string | null {
    if (this.notApplicable || this.form.isOnHold) return null;
    return computeVariance(this.form.actualValue || null, this.target());
  }

  poe(): string | null {
    const ctx = this.captureContext();
    if (!ctx) return null;
    return ctx.quarterPoe?.[this.form.quarter] ?? ctx.evidencePortfolio ?? ctx.evidenceSource ?? null;
  }

  quarterRows = computed(() => {
    const ctx = this.captureContext();
    if (!ctx) return [];
    return [1, 2, 3, 4].map((q) => {
      const t = ctx.targets.find((x) => x.quarter === q);
      const a = this.actuals().find((x) => x.quarter === q);
      const assessment = a?.assessment ?? null;
      return {
        quarter: q,
        target: t?.targetValue ?? null,
        actual: a?.actualValue ?? null,
        assessment,
        assessClass: assessmentBadgeClass(assessment),
      };
    });
  });

  /** True when the quarter is flagged N/A or On Hold — narrative fields are auto-set to N/A. */
  flaggedOut(): boolean {
    return this.notApplicable || this.form.isOnHold;
  }

  private applyNaFill(on: boolean) {
    const fields = ['actualValue', 'commentary', 'challengeNarrative', 'correctiveAction'] as const;
    for (const k of fields) {
      if (on) {
        this.form[k] = (k === 'actualValue' && this.form.isOnHold) ? 'On hold' : 'N/A';
      } else {
        const v = (this.form[k] ?? '').trim().toUpperCase();
        if (v === 'N/A' || v === 'ON HOLD') this.form[k] = '';
      }
    }
  }

  onNaToggle(on: boolean) {
    if (on && this.form.isOnHold) this.form.isOnHold = false;
    this.applyNaFill(this.flaggedOut());
  }

  onHoldToggle(on: boolean) {
    if (on && this.notApplicable) this.notApplicable = false;
    this.applyNaFill(this.flaggedOut());
  }

  private persistActual(): ReturnType<typeof this.api.patch<KpiActual>> | null {
    const f: CaptureForm = { ...this.form };
    if (this.flaggedOut()) {
      f.actualValue = f.isOnHold ? 'On hold' : 'N/A';
      if (!f.commentary?.trim()) f.commentary = 'N/A';
      if (!f.challengeNarrative?.trim()) f.challengeNarrative = 'N/A';
      if (!f.correctiveAction?.trim()) f.correctiveAction = 'N/A';
    }
    if (!f.actualValue.trim()) {
      this.toast.error('Actual value is required');
      return null;
    }
    const existing = this.assessActual();
    if (existing) {
      return this.api.patch<KpiActual>(`/kpi-actuals/${existing.id}`, {
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
        qualitativeScorePct: this.qualScorePct,
      });
    }
    return this.api.post<KpiActual>(`/scorecard-kpis/${this.kpiId}/actuals`, {
      periodType: 'quarterly',
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
      qualitativeScorePct: this.qualScorePct ?? undefined,
      lateOverrideReason: f.lateOverrideReason || undefined,
    });
  }

  save() {
    const req = this.persistActual();
    if (!req) return;
    const existed = !!this.assessActual();
    req.pipe(
      tap(() => {
        this.toast.success(existed ? 'Actual updated' : 'Actual saved as draft. Add evidence then submit for review.');
        this.reload();
      }),
      catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }

  submit() {
    const req = this.persistActual();
    if (!req) return;
    req.pipe(
      catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe((saved) => {
      if (!saved) return;
      this.api.post(`/kpi-actuals/${saved.id}/transition`, { action: 'submit' }).pipe(
        tap(() => { this.toast.success('Actual submitted for review'); this.reload(); }),
        catchError((e) => { this.toast.error('Failed to submit', e?.error?.error ?? e?.error?.message ?? e?.message); this.reload(); return of(null); }),
      ).subscribe();
    });
  }

  openUpload() {
    this.dialog.open(UploadEvidenceDialogComponent, {
      panelClass: 'plat-dialog', autoFocus: true, data: { quarter: this.quarter, periodType: 'quarterly' },
    }).afterClosed().subscribe((res: UploadForm | undefined) => {
      if (!res?.file) return;
      const file = res.file;
      this.uploading.set(true);
      this.api.post<{ uploadURL: string; objectPath: string }>(`/evidence/upload-url`).subscribe({
        next: async ({ uploadURL, objectPath }) => {
          try {
            const put = await fetch(uploadURL, {
              method: 'PUT',
              headers: { 'Content-Type': file.type || 'application/octet-stream' },
              body: file,
            });
            if (!put.ok) throw new Error(`Upload failed (${put.status})`);
            this.api.post(`/scorecard-kpis/${this.kpiId}/evidence`, {
              periodType: 'quarterly',
              quarter: this.quarter,
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type || 'application/octet-stream',
              documentType: res.documentType || undefined,
              description: res.description || undefined,
              filePath: objectPath,
            }).pipe(
              tap(() => { this.toast.success('Evidence uploaded'); this.uploading.set(false); this.reload(); }),
              catchError((e) => { this.uploading.set(false); this.toast.error('Error saving evidence', e?.error?.error ?? e?.error?.message ?? e?.message); return of(null); }),
            ).subscribe();
          } catch (e: unknown) {
            this.uploading.set(false);
            this.toast.error('Upload failed', e instanceof Error ? e.message : 'Could not upload the file');
          }
        },
        error: (e) => {
          this.uploading.set(false);
          this.toast.error('Upload failed', e?.error?.error ?? e?.error?.message ?? e?.message);
        },
      });
    });
  }

  downloadEvidence(doc: EvidenceDoc) {
    this.api.getBlob(`/evidence/${doc.id}/download`).pipe(
      tap((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName || 'evidence';
        a.click();
        URL.revokeObjectURL(url);
      }),
      catchError(() => { this.toast.error('Download failed', 'No file is stored for this evidence record'); return of(null); }),
    ).subscribe();
  }

  deleteEvidence(doc: EvidenceDoc) {
    if (!confirm(`Delete evidence "${doc.fileName}"?`)) return;
    this.api.delete(`/evidence/${doc.id}`).pipe(
      tap(() => { this.toast.success('Evidence deleted'); this.reload(); }),
      catchError((e) => { this.toast.error('Delete failed', e?.error?.error ?? e?.error?.message ?? e?.message); return of(null); }),
    ).subscribe();
  }

  hasFile(doc: EvidenceDoc): boolean {
    return !!doc.filePath?.startsWith('/objects/');
  }
}
