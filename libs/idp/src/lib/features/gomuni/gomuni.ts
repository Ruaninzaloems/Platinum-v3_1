import { Component, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { CycleStateService } from '../../core/services/cycle-state.service';
import { IdpSubmissionLog, IdpCycle } from '../../core/models/idp.models';

@Component({
  selector: 'app-gomuni',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 data-testid="text-page-title">GoMuni Submission Pack</h1>
          <p class="page-subtitle">Section 5.9 &mdash; Upload adopted IDP, council resolution and minutes for GoMuni submission</p>
        </div>
      </div>

      <div class="alert alert-error" *ngIf="error()" data-testid="text-error">
        <span class="material-icon" style="font-size:18px;">error</span> {{ error() }}
      </div>
      <div class="alert alert-success" *ngIf="success()" data-testid="text-success">
        <span class="material-icon" style="font-size:18px;">check_circle</span> {{ success() }}
      </div>

      <div class="grid-main">
        <div class="card" data-testid="card-submission-form">
          <div class="card-header">
            <h2><span class="material-icon" style="font-size:18px;">cloud_upload</span> New Submission</h2>
          </div>
          <div class="card-body">
            <div class="checklist" data-testid="checklist">
              <h3>Pre-Upload Validation Checklist</h3>
              <div class="check-item" [class.valid]="sf.adoptedIdpFileName">
                <span class="material-icon" style="font-size:18px;" [style.color]="sf.adoptedIdpFileName ? '#4caf50' : '#e0e0e0'">{{ sf.adoptedIdpFileName ? 'check_circle' : 'radio_button_unchecked' }}</span>
                Adopted IDP Document
              </div>
              <div class="check-item" [class.valid]="sf.councilResolutionFileName">
                <span class="material-icon" style="font-size:18px;" [style.color]="sf.councilResolutionFileName ? '#4caf50' : '#e0e0e0'">{{ sf.councilResolutionFileName ? 'check_circle' : 'radio_button_unchecked' }}</span>
                Council Resolution
              </div>
              <div class="check-item" [class.valid]="sf.minutesFileName">
                <span class="material-icon" style="font-size:18px;" [style.color]="sf.minutesFileName ? '#4caf50' : '#e0e0e0'">{{ sf.minutesFileName ? 'check_circle' : 'radio_button_unchecked' }}</span>
                Council Minutes
              </div>
            </div>

            <div class="upload-section">
              <div class="field">
                <label>Adopted IDP Document</label>
                <div class="file-input">
                  <input [(ngModel)]="sf.adoptedIdpFileName" placeholder="IDP_Final_Adopted_2024.pdf" data-testid="input-idp-file" />
                  <span class="material-icon" style="font-size:18px;color:#94a3b8;">attach_file</span>
                </div>
              </div>
              <div class="field">
                <label>Council Resolution</label>
                <div class="file-input">
                  <input [(ngModel)]="sf.councilResolutionFileName" placeholder="Council_Resolution_RES2024001.pdf" data-testid="input-resolution-file" />
                  <span class="material-icon" style="font-size:18px;color:#94a3b8;">attach_file</span>
                </div>
              </div>
              <div class="field">
                <label>Council Minutes</label>
                <div class="file-input">
                  <input [(ngModel)]="sf.minutesFileName" placeholder="Council_Minutes_May2024.pdf" data-testid="input-minutes-file" />
                  <span class="material-icon" style="font-size:18px;color:#94a3b8;">attach_file</span>
                </div>
              </div>
              <div class="field">
                <label>Submission Type</label>
                <select [(ngModel)]="sf.submissionType" data-testid="select-type">
                  <option value="Initial">Initial Submission</option>
                  <option value="Revision">Revision Submission</option>
                  <option value="Amended">Amended Submission</option>
                </select>
              </div>
            </div>

            <div class="form-actions">
              <button class="btn btn-primary" (click)="submitPack()"
                      [disabled]="!sf.adoptedIdpFileName || !sf.councilResolutionFileName || !sf.minutesFileName"
                      data-testid="button-submit">
                <span class="material-icon" style="font-size:18px;">cloud_upload</span> Submit to GoMuni
              </button>
            </div>
          </div>
        </div>

        <div class="card" data-testid="card-submissions">
          <div class="card-header"><h2><span class="material-icon" style="font-size:18px;">history</span> Submission History</h2></div>
          <div class="card-body">
            <div class="submission-list">
              <div class="submission-item" *ngFor="let s of submissions()" [attr.data-testid]="'submission-' + s.id + ''">
                <div class="sub-header">
                  <span class="sub-type">{{ s.submissionType }}</span>
                  <span class="status-pill" [attr.data-ss]="statusKey(s.status)">{{ s.status }}</span>
                </div>
                <div class="sub-detail">
                  <span><span class="material-icon" style="font-size:14px;">event</span> {{ s.submissionDate | date:'dd MMM yyyy HH:mm' }}</span>
                  <span *ngIf="s.referenceNumber"><span class="material-icon" style="font-size:14px;">tag</span> {{ s.referenceNumber }}</span>
                </div>
                <div class="sub-files">
                  <span class="file-tag" *ngIf="s.adoptedIdpFileName"><span class="material-icon" style="font-size:12px;">description</span> {{ s.adoptedIdpFileName }}</span>
                  <span class="file-tag" *ngIf="s.councilResolutionFileName"><span class="material-icon" style="font-size:12px;">gavel</span> {{ s.councilResolutionFileName }}</span>
                  <span class="file-tag" *ngIf="s.minutesFileName"><span class="material-icon" style="font-size:12px;">notes</span> {{ s.minutesFileName }}</span>
                </div>
                <div class="sub-validation" *ngIf="s.validationStatus">
                  <span class="validation-badge" [attr.data-vs]="s.validationStatus.toLowerCase()">{{ s.validationStatus }}</span>
                  <span class="validation-feedback" *ngIf="s.validationFeedback">{{ s.validationFeedback }}</span>
                </div>

                <div class="sub-ref-form" *ngIf="!s.referenceNumber">
                  <input [(ngModel)]="refInput" placeholder="Enter reference number..." [attr.data-testid]="'input-ref-' + s.id + ''" />
                  <button class="btn btn-sm" (click)="updateRef(s)" [attr.data-testid]="'button-update-ref-' + s.id + ''">Save Ref</button>
                </div>
              </div>
              <div class="empty" *ngIf="!submissions().length">No submissions yet</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    app-gomuni .grid-main { grid-template-columns: 1fr 1fr; }
    @media(max-width:900px){ app-gomuni .grid-main { grid-template-columns: 1fr; } }
    .checklist { margin-bottom: 20px; padding: 14px; background: var(--platinum-surface); border-radius: 10px; }
    .checklist h3 { font-size: 13px; font-weight: 600; margin-bottom: 10px; }
    .check-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; font-size: 13px; color: var(--platinum-text-secondary); }
    .check-item.valid { color: var(--platinum-text); font-weight: 500; }
    .upload-section { display: flex; flex-direction: column; gap: 14px; }
    .file-input { display: flex; align-items: center; border: 1px solid var(--platinum-border); border-radius: 8px; overflow: hidden; }
    .file-input input { border: none; flex: 1; }
    .file-input input:focus { box-shadow: none; }
    .submission-list { display: flex; flex-direction: column; gap: 12px; }
    .submission-item { border: 1px solid var(--platinum-border); border-radius: 10px; padding: 14px; }
    .sub-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .sub-type { font-size: 14px; font-weight: 600; }
    .sub-detail { display: flex; gap: 16px; font-size: 12px; color: var(--platinum-text-muted); margin-bottom: 8px; }
    .sub-detail span { display: flex; align-items: center; gap: 3px; }
    .sub-files { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
    .file-tag { display: inline-flex; align-items: center; gap: 3px; padding: 2px 8px; border-radius: 6px; font-size: 11px; background: var(--platinum-surface-alt); color: var(--platinum-text-secondary); }
    .sub-validation { display: flex; align-items: center; gap: 8px; }
    .validation-badge { padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .validation-badge[data-vs="pending"] { background: #fff3e0; color: #ef6c00; }
    .validation-badge[data-vs="valid"] { background: var(--platinum-success-light); color: #1b5e20; }
    .validation-badge[data-vs="invalid"] { background: var(--platinum-danger-light); color: #c62828; }
    .validation-feedback { font-size: 12px; color: var(--platinum-text-secondary); }
    .sub-ref-form { display: flex; gap: 6px; margin-top: 8px; }
    .sub-ref-form input { flex: 1; padding: 5px 8px; font-size: 12px; }
    .status-pill[data-ss="submitted"] { background: var(--platinum-info-light); color: #1565c0; }
    .status-pill[data-ss="validated"] { background: var(--platinum-success-light); color: #1b5e20; }
    .status-pill[data-ss="rejected"] { background: var(--platinum-danger-light); color: #c62828; }
  `]
})
export class GoMuniComponent implements OnInit {
  submissions = signal<IdpSubmissionLog[]>([]);
  error = signal('');
  success = signal('');
  refInput = '';

  sf: any = { adoptedIdpFileName: '', councilResolutionFileName: '', minutesFileName: '', submissionType: 'Initial' };

  constructor(private api: ApiService, private cycleState: CycleStateService) {}

  ngOnInit() {
    this.cycleState.ensureActiveCycle().then(c => { if (c) this.load(c.id); });
  }

  load(cycleId: number) {
    this.api.getSubmissions(cycleId).subscribe(s => this.submissions.set(s));
  }

  statusKey(s: string): string { return s.toLowerCase().replace(/\s+/g, '-'); }

  submitPack() {
    const cycleId = this.cycleState.activeCycleId();
    this.error.set(''); this.success.set('');
    this.api.createSubmission({ ...this.sf, cycleId }).subscribe({
      next: () => {
        this.success.set('Submission pack uploaded successfully');
        this.sf = { adoptedIdpFileName: '', councilResolutionFileName: '', minutesFileName: '', submissionType: 'Initial' };
        this.load(cycleId);
      },
      error: (err: any) => this.error.set(typeof err.error === 'string' ? err.error : 'Submission failed')
    });
  }

  updateRef(s: IdpSubmissionLog) {
    this.api.updateSubmission(s.id, { referenceNumber: this.refInput }).subscribe(() => {
      this.refInput = '';
      this.load(this.cycleState.activeCycleId());
    });
  }
}
