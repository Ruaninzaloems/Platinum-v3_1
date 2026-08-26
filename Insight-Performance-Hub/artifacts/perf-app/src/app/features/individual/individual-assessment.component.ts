import { ChangeDetectionStrategy, Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { catchError, of, tap } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { ToastService } from '@core/services/toast.service';
import { Cycle } from '@core/models/domain.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';

interface Agreement {
  id: number;
  employeeName: string;
  postTitle: string;
}

type AssessmentType = 'quarterly' | 'mid-year' | 'annual';

interface AssessmentRecord {
  id: number;
  agreementId: number;
  assessmentType: string;
  quarter: number | null;
  kpiScore: number | null;
  competencyScore: number | null;
  overallScore: number | null;
  status: string;
}

type ModerationOutcome = 'accepted' | 'adjusted' | 'referred';

interface ModerationRecord {
  id: number;
  assessmentId: number;
  agreementId: number;
  outcome: string;
  originalScore: number | null;
  adjustedScore: number | null;
  adjustmentReason: string | null;
}

interface AssessmentForm {
  assessmentType: AssessmentType;
  quarter: number;
  kpiScore: number;
  competencyScore: number;
  comments: string;
  developmentNeeds: string;
}

interface ModerationForm {
  assessmentId: number;
  outcome: ModerationOutcome;
  originalScore: number;
  adjustedScore: number;
  adjustmentReason: string;
}

const TYPE_LABELS: Record<string, string> = {
  quarterly: 'Quarterly Review',
  'mid-year': 'Mid-Year Assessment',
  annual: 'Annual Assessment',
};

// ─── New Assessment Dialog ──────────────────────────────────────────────────
@Component({
  selector: 'app-new-assessment-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>New Assessment</h2>
    <mat-dialog-content class="content">
      <mat-form-field appearance="outline">
        <mat-label>Type</mat-label>
        <mat-select [(ngModel)]="form.assessmentType" name="type">
          <mat-option value="quarterly">Quarterly Review</mat-option>
          <mat-option value="mid-year">Mid-Year Assessment</mat-option>
          <mat-option value="annual">Annual Assessment</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" *ngIf="form.assessmentType === 'quarterly'">
        <mat-label>Quarter</mat-label>
        <mat-select [(ngModel)]="form.quarter" name="q">
          <mat-option *ngFor="let q of [1,2,3,4]" [value]="q">Q{{ q }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline"><mat-label>KPI Score (0-5)</mat-label><input matInput type="number" step="0.1" min="0" max="5" [(ngModel)]="form.kpiScore" name="kpi" /></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Competency Score (0-5)</mat-label><input matInput type="number" step="0.1" min="0" max="5" [(ngModel)]="form.competencyScore" name="comp" /></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Comments</mat-label><textarea matInput rows="3" [(ngModel)]="form.comments" name="c"></textarea></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Development Needs</mat-label><textarea matInput rows="3" [(ngModel)]="form.developmentNeeds" name="d"></textarea></mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" type="button" (click)="ref.close(form)">Create Assessment</button>
    </mat-dialog-actions>
  `,
  styles: [`.content { display:flex; flex-direction: column; gap: 4px; padding-top: 12px !important; min-width: 480px; } mat-form-field { width: 100%; }`],
})
export class NewAssessmentDialogComponent {
  form: AssessmentForm = { assessmentType: 'quarterly', quarter: 1, kpiScore: 0, competencyScore: 0, comments: '', developmentNeeds: '' };
  constructor(public ref: MatDialogRef<NewAssessmentDialogComponent, AssessmentForm | null>) {}
}

// ─── Moderate Dialog ────────────────────────────────────────────────────────
@Component({
  selector: 'app-moderate-assessment-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>Moderate Assessment</h2>
    <mat-dialog-content class="content">
      <mat-form-field appearance="outline">
        <mat-label>Assessment</mat-label>
        <mat-select [(ngModel)]="form.assessmentId" name="a">
          <mat-option *ngFor="let a of data.assessments" [value]="a.id">{{ label(a.assessmentType) }} — Score: {{ a.overallScore?.toFixed(1) }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Outcome</mat-label>
        <mat-select [(ngModel)]="form.outcome" name="o">
          <mat-option value="accepted">Accepted</mat-option>
          <mat-option value="adjusted">Adjusted</mat-option>
          <mat-option value="referred">Referred</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Original Score</mat-label><input matInput type="number" step="0.1" [(ngModel)]="form.originalScore" name="orig" /></mat-form-field>
      <mat-form-field appearance="outline" *ngIf="form.outcome === 'adjusted'"><mat-label>Adjusted Score</mat-label><input matInput type="number" step="0.1" [(ngModel)]="form.adjustedScore" name="adj" /></mat-form-field>
      <mat-form-field appearance="outline"><mat-label>Reason</mat-label><textarea matInput rows="3" [(ngModel)]="form.adjustmentReason" name="r"></textarea></mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" type="button" [disabled]="!form.assessmentId" (click)="ref.close(form)">Submit</button>
    </mat-dialog-actions>
  `,
  styles: [`.content { display:flex; flex-direction: column; gap: 4px; padding-top: 12px !important; min-width: 480px; } mat-form-field { width: 100%; }`],
})
export class ModerateAssessmentDialogComponent {
  form: ModerationForm = { assessmentId: 0, outcome: 'accepted', originalScore: 0, adjustedScore: 0, adjustmentReason: '' };
  constructor(
    public ref: MatDialogRef<ModerateAssessmentDialogComponent, ModerationForm | null>,
    @Inject(MAT_DIALOG_DATA) public data: { assessments: AssessmentRecord[] },
  ) {}
  label(type: string): string { return TYPE_LABELS[type] ?? type; }
}

// ─── Main Page ──────────────────────────────────────────────────────────────
@Component({
  selector: 'app-individual-assessment',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatSelectModule,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="plat-page">
      <app-page-header title="Individual Assessments" subtitle="Quarterly, mid-year, and annual performance assessments" icon="fact_check" tone="indigo">
        <mat-form-field appearance="outline" class="pick">
          <mat-label>Cycle</mat-label>
          <mat-select [ngModel]="cycleId()" (ngModelChange)="onCycle($event)">
            <mat-option [value]="null">All Cycles</mat-option>
            <mat-option *ngFor="let c of cycles()" [value]="c.id">{{ c.financialYearLabel }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="pick wide">
          <mat-label>Agreement</mat-label>
          <mat-select [ngModel]="agreementId()" (ngModelChange)="onAgreement($event)">
            <mat-option [value]="null">All Agreements</mat-option>
            <mat-option *ngFor="let a of agreements()" [value]="a.id">{{ a.employeeName }} — {{ a.postTitle }}</mat-option>
          </mat-select>
        </mat-form-field>
      </app-page-header>

      <div class="toolbar" *ngIf="agreementId()">
        <button mat-flat-button color="primary" (click)="openCreate()"><mat-icon>add</mat-icon> New Assessment</button>
        <button mat-stroked-button (click)="openModerate()"><mat-icon>balance</mat-icon> Moderate</button>
      </div>

      <div class="plat-card">
        <h3 class="title"><mat-icon>fact_check</mat-icon> Assessment Records</h3>
        <p *ngIf="!assessments().length" class="empty">
          {{ agreementId() ? 'No assessments for this agreement' : 'Select an agreement to view assessments' }}
        </p>
        <table class="plat-table" *ngIf="assessments().length">
          <thead><tr><th>Type</th><th>Quarter</th><th class="num">KPI Score</th><th class="num">Competency</th><th class="num">Overall</th><th>Status</th></tr></thead>
          <tbody>
            <tr *ngFor="let a of assessments()">
              <td>{{ label(a.assessmentType) }}</td>
              <td>{{ a.quarter ? 'Q' + a.quarter : '—' }}</td>
              <td class="num bold">{{ a.kpiScore !== null ? a.kpiScore.toFixed(1) : '—' }}</td>
              <td class="num bold">{{ a.competencyScore !== null ? a.competencyScore.toFixed(1) : '—' }}</td>
              <td class="num strong">{{ a.overallScore !== null ? a.overallScore.toFixed(1) : '—' }}</td>
              <td><span class="chip outline">{{ a.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="plat-card" *ngIf="agreementId() && moderations().length">
        <h3 class="title"><mat-icon>balance</mat-icon> Moderation Records</h3>
        <table class="plat-table">
          <thead><tr><th>Assessment</th><th>Outcome</th><th class="num">Original</th><th class="num">Adjusted</th><th>Reason</th></tr></thead>
          <tbody>
            <tr *ngFor="let m of moderations()">
              <td>Assessment #{{ m.assessmentId }}</td>
              <td><span class="chip" [style.background]="outcomeColor(m.outcome).bg" [style.color]="outcomeColor(m.outcome).fg">{{ m.outcome }}</span></td>
              <td class="num">{{ m.originalScore !== null ? m.originalScore.toFixed(1) : '—' }}</td>
              <td class="num bold">{{ m.adjustedScore !== null ? m.adjustedScore.toFixed(1) : '—' }}</td>
              <td class="sub">{{ m.adjustmentReason || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [`
    .pick { width: 200px; margin-right: 8px; }
    .pick.wide { width: 250px; }
    .toolbar { display: flex; gap: 12px; margin-bottom: 16px; }
    .plat-card { padding: 16px; margin-bottom: 16px; }
    .title { display: flex; align-items: center; gap: 8px; margin: 0 0 12px; font-size: 15px; font-weight: 600; }
    .empty { text-align: center; color: #94a3b8; padding: 24px 0; font-size: 13px; }
    .num { text-align: right; }
    .bold { font-weight: 500; }
    .strong { font-weight: 700; }
    .sub { font-size: 13px; color: #64748b; }
    .chip { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; }
    .chip.outline { background: transparent; border: 1px solid var(--plat-border); color: #475569; }
  `],
})
export class IndividualAssessmentComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  cycles = signal<Cycle[]>([]);
  agreements = signal<Agreement[]>([]);
  assessments = signal<AssessmentRecord[]>([]);
  moderations = signal<ModerationRecord[]>([]);
  cycleId = signal<number | null>(null);
  agreementId = signal<number | null>(null);

  label(type: string): string { return TYPE_LABELS[type] ?? type; }

  outcomeColor(outcome: string): { bg: string; fg: string } {
    if (outcome === 'accepted') return { bg: '#dcfce7', fg: '#15803d' };
    if (outcome === 'adjusted') return { bg: '#fef9c3', fg: '#a16207' };
    return { bg: '#fee2e2', fg: '#b91c1c' };
  }

  ngOnInit() {
    this.api.get<Cycle[]>('/cycles').pipe(catchError(() => of([] as Cycle[])))
      .subscribe((cs) => this.cycles.set(Array.isArray(cs) ? cs : []));
    this.loadAgreements();
  }

  onCycle(id: number | null) { this.cycleId.set(id); this.loadAgreements(); }
  onAgreement(id: number | null) { this.agreementId.set(id); this.loadAssessments(); this.loadModerations(); }

  loadAgreements() {
    this.api.get<Agreement[]>('/agreements', { cycleId: this.cycleId() ?? undefined })
      .pipe(catchError(() => of([] as Agreement[])))
      .subscribe((r) => this.agreements.set(Array.isArray(r) ? r : []));
  }

  loadAssessments() {
    const id = this.agreementId();
    if (!id) { this.assessments.set([]); return; }
    this.api.get<AssessmentRecord[]>('/individual-assessments', { agreementId: id })
      .pipe(catchError(() => of([] as AssessmentRecord[])))
      .subscribe((r) => this.assessments.set(Array.isArray(r) ? r : []));
  }

  loadModerations() {
    const id = this.agreementId();
    if (!id) { this.moderations.set([]); return; }
    this.api.get<ModerationRecord[]>('/individual-moderations', { agreementId: id })
      .pipe(catchError(() => of([] as ModerationRecord[])))
      .subscribe((r) => this.moderations.set(Array.isArray(r) ? r : []));
  }

  openCreate() {
    const agreementId = this.agreementId();
    if (!agreementId) return;
    this.dialog.open(NewAssessmentDialogComponent, { panelClass: 'plat-dialog', autoFocus: false })
      .afterClosed().subscribe((res: AssessmentForm | undefined) => {
        if (!res) return;
        this.api.post<AssessmentRecord>('/individual-assessments', {
          agreementId,
          assessmentType: res.assessmentType,
          quarter: res.assessmentType === 'quarterly' ? res.quarter : undefined,
          kpiScore: res.kpiScore,
          competencyScore: res.competencyScore,
          comments: res.comments || undefined,
          developmentNeeds: res.developmentNeeds || undefined,
        }).pipe(
          tap(() => { this.toast.success('Assessment created'); this.loadAssessments(); }),
          catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? e?.message); return of(null); }),
        ).subscribe();
      });
  }

  openModerate() {
    const agreementId = this.agreementId();
    if (!agreementId) return;
    this.dialog.open(ModerateAssessmentDialogComponent, { panelClass: 'plat-dialog', autoFocus: false, data: { assessments: this.assessments() } })
      .afterClosed().subscribe((res: ModerationForm | undefined) => {
        if (!res || !res.assessmentId) return;
        this.api.post<ModerationRecord>('/individual-moderations', {
          assessmentId: res.assessmentId,
          agreementId,
          outcome: res.outcome,
          originalScore: res.originalScore,
          adjustedScore: res.outcome === 'adjusted' ? res.adjustedScore : undefined,
          adjustmentReason: res.adjustmentReason || undefined,
        }).pipe(
          tap(() => { this.toast.success('Moderation recorded'); this.loadModerations(); }),
          catchError((e) => { this.toast.error('Error', e?.error?.error ?? e?.error?.message ?? e?.message); return of(null); }),
        ).subscribe();
      });
  }
}
