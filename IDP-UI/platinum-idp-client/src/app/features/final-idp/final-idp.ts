import { Component, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { CycleStateService } from '../../core/services/cycle-state.service';
import { IdpDocumentVersion } from '../../core/models/idp.models';

@Component({
  selector: 'app-final-idp',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 data-testid="text-page-title">Final IDP</h1>
          <p class="page-subtitle">Section 5.7 &mdash; Consolidate approved content with resolution metadata</p>
        </div>
      </div>

      <div class="alert alert-error" *ngIf="error()" data-testid="text-error">
        <span class="material-icon" style="font-size:18px;">error</span> {{ error() }}
      </div>
      <div class="alert alert-success" *ngIf="success()" data-testid="text-success">
        <span class="material-icon" style="font-size:18px;">check_circle</span> {{ success() }}
      </div>

      <div class="grid-2">
        <div class="card" data-testid="card-generate">
          <div class="card-header"><h2><span class="material-icon" style="font-size:18px;">auto_awesome</span> Generate Final IDP</h2></div>
          <div class="card-body">
            <p class="instruction">Select an approved Draft IDP to generate the Final IDP document.</p>

            <div class="field">
              <label>Approved Draft</label>
              <select [(ngModel)]="selectedDraftId" data-testid="select-draft">
                <option [ngValue]="0">Select a draft...</option>
                <option *ngFor="let d of approvedDrafts()" [ngValue]="d.id">Draft v{{ d.versionNumber }} ({{ d.status }})</option>
              </select>
            </div>

            <div class="divider"></div>

            <div class="form-grid">
              <div class="field"><label>Resolution Number</label><input [(ngModel)]="resolutionNumber" placeholder="e.g. RES/2024/001" data-testid="input-resolution-number" /></div>
              <div class="field"><label>Resolution Date</label><input type="date" [(ngModel)]="resolutionDate" data-testid="input-resolution-date" /></div>
              <div class="field full"><label>Council Meeting Reference</label><input [(ngModel)]="councilMeetingRef" placeholder="e.g. Ordinary Council Meeting 28 May 2024" data-testid="input-council-ref" /></div>
            </div>

            <div class="form-actions">
              <button class="btn btn-primary" (click)="generateFinal()" [disabled]="!selectedDraftId || generating()" data-testid="button-generate-final">
                <span class="material-icon" style="font-size:18px;">verified</span>
                {{ generating() ? 'Generating...' : 'Generate Final IDP' }}
              </button>
            </div>
          </div>
        </div>

        <div class="card" data-testid="card-finals">
          <div class="card-header"><h2><span class="material-icon" style="font-size:18px;">verified</span> Final IDP Versions</h2></div>
          <div class="card-body">
            <div class="version-list">
              <div class="version-item" *ngFor="let f of finalVersions()" [attr.data-testid]="'final-version-' + f.id + ''">
                <div class="version-main">
                  <span class="material-icon" style="font-size:20px;color:#10b981;">verified</span>
                  <div>
                    <strong>Final IDP v{{ f.versionNumber }}</strong>
                    <span class="version-meta">{{ f.createdDate | date:'dd MMM yyyy' }}</span>
                  </div>
                </div>
                <div class="version-right">
                  <span class="status-pill" [attr.data-ds]="statusKey(f.status)">{{ f.status }}</span>
                  <span class="lock-icon" *ngIf="f.isLocked"><span class="material-icon" style="font-size:16px;color:#ef5350;">lock</span></span>
                </div>
                <div class="version-detail" *ngIf="f.resolutionNumber">
                  <span class="detail-tag"><span class="material-icon" style="font-size:12px;">gavel</span> {{ f.resolutionNumber }}</span>
                  <span class="detail-tag" *ngIf="f.resolutionDate"><span class="material-icon" style="font-size:12px;">event</span> {{ f.resolutionDate | date:'dd MMM yyyy' }}</span>
                  <span class="detail-tag" *ngIf="f.councilMeetingRef"><span class="material-icon" style="font-size:12px;">groups</span> {{ f.councilMeetingRef }}</span>
                </div>
                <div class="version-actions-row" *ngIf="!f.isLocked">
                  <button class="btn btn-sm" (click)="submitFinalForReview(f)" *ngIf="f.status === 'Generated'" [attr.data-testid]="'button-submit-final-' + f.id + ''">
                    <span class="material-icon" style="font-size:14px;">send</span> Submit for Adoption
                  </button>
                  <button class="btn btn-sm btn-outline" (click)="lockFinal(f)" [attr.data-testid]="'button-lock-final-' + f.id + ''">
                    <span class="material-icon" style="font-size:14px;">lock</span> Lock
                  </button>
                </div>
              </div>
              <div class="empty" *ngIf="!finalVersions().length">No Final IDP versions generated yet</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .version-list { display: flex; flex-direction: column; gap: 12px; }
    .version-item { border: 1px solid var(--platinum-border); border-radius: 10px; padding: 14px; }
    .version-main { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
    .version-main strong { font-size: 14px; display: block; }
    .version-meta { font-size: 12px; color: var(--platinum-text-muted); display: block; }
    .version-right { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
    .version-detail { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
    .detail-tag { display: inline-flex; align-items: center; gap: 3px; padding: 2px 8px; border-radius: 6px; font-size: 11px; background: var(--platinum-surface-alt); color: var(--platinum-text-secondary); }
    .version-actions-row { display: flex; gap: 6px; }
  `]
})
export class FinalIdpComponent implements OnInit {
  versions = signal<IdpDocumentVersion[]>([]);
  selectedDraftId = 0;
  resolutionNumber = '';
  resolutionDate = '';
  councilMeetingRef = '';
  generating = signal(false);
  error = signal('');
  success = signal('');

  constructor(private api: ApiService, private cycleState: CycleStateService) {}

  ngOnInit() {
    this.cycleState.ensureActiveCycle().then(c => { if (c) this.loadVersions(c.id); });
  }

  loadVersions(cycleId: number) {
    this.api.getDocumentVersions(cycleId).subscribe(v => this.versions.set(v));
  }

  approvedDrafts() { return this.versions().filter(v => v.versionType === 'Draft' && v.status === 'Approved for Distribution'); }
  finalVersions() { return this.versions().filter(v => v.versionType === 'Final'); }
  statusKey(s: string): string { return s.toLowerCase().replace(/\s+/g, '-'); }

  generateFinal() {
    if (!this.selectedDraftId) return;
    this.generating.set(true);
    this.error.set(''); this.success.set('');
    this.api.generateFinalIdp(this.selectedDraftId, {
      resolutionNumber: this.resolutionNumber,
      resolutionDate: this.resolutionDate || null,
      councilMeetingRef: this.councilMeetingRef
    }).subscribe({
      next: doc => {
        this.generating.set(false);
        this.success.set(`Final IDP v${doc.versionNumber} generated successfully`);
        this.loadVersions(this.cycleState.activeCycleId());
      },
      error: (err: any) => {
        this.generating.set(false);
        this.error.set(typeof err.error === 'string' ? err.error : 'Failed to generate Final IDP');
      }
    });
  }

  submitFinalForReview(f: IdpDocumentVersion) {
    this.api.submitForReview(f.id).subscribe({
      next: () => { this.success.set('Final IDP submitted for adoption review'); this.loadVersions(this.cycleState.activeCycleId()); },
      error: (err: any) => this.error.set(err.error || 'Failed to submit')
    });
  }

  lockFinal(f: IdpDocumentVersion) {
    this.api.lockDocument(f.id).subscribe(() => this.loadVersions(this.cycleState.activeCycleId()));
  }
}
