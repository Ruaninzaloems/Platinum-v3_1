import { Component, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { CycleStateService } from '../../core/services/cycle-state.service';
import { IdpDocumentVersion } from '../../core/models/idp.models';

@Component({
  selector: 'app-draft-idp',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 data-testid="text-page-title">Draft IDP Compilation</h1>
          <p class="page-subtitle">Section 5.5 &mdash; Generate, review and distribute the Draft IDP document</p>
        </div>
        <button class="btn btn-primary" (click)="generateDraft()" [disabled]="generating()" data-testid="button-generate-draft">
          <span class="material-icon" style="font-size:18px;">auto_awesome</span>
          {{ generating() ? 'Generating...' : 'Generate Draft IDP' }}
        </button>
      </div>

      <div class="alert alert-error" *ngIf="error()" data-testid="text-error">
        <span class="material-icon" style="font-size:18px;">error</span> {{ error() }}
      </div>

      <div class="alert alert-success" *ngIf="success()" data-testid="text-success">
        <span class="material-icon" style="font-size:18px;">check_circle</span> {{ success() }}
      </div>

      <div class="versions-list" *ngIf="versions().length" data-testid="versions-list">
        <div class="card version-card" *ngFor="let v of draftVersions()"
             [class.selected]="v.id === selectedVersionId()"
             (click)="selectVersion(v)"
             [attr.data-testid]="'card-version-' + v.id + ''">
          <div class="version-header">
            <div class="version-title">
              <span class="material-icon" style="font-size:20px;color:#3b82f6;">description</span>
              <div>
                <strong>Draft IDP v{{ v.versionNumber }}</strong>
                <span class="version-date">{{ v.createdDate | date:'dd MMM yyyy HH:mm' }}</span>
              </div>
            </div>
            <div class="version-badges">
              <span class="status-pill" [attr.data-ds]="statusKey(v.status)">{{ v.status }}</span>
              <span class="lock-badge" *ngIf="v.isLocked"><span class="material-icon" style="font-size:14px;">lock</span></span>
            </div>
          </div>
          <div class="version-actions" *ngIf="v.id === selectedVersionId()">
            <button class="btn btn-sm" (click)="submitForReview(v)" *ngIf="v.status === 'Draft' && !v.isLocked" [attr.data-testid]="'button-submit-review-' + v.id + ''">
              <span class="material-icon" style="font-size:14px;">send</span> Submit for Review
            </button>
            <button class="btn btn-sm btn-outline" (click)="lockDocument(v)" *ngIf="!v.isLocked" [attr.data-testid]="'button-lock-' + v.id + ''">
              <span class="material-icon" style="font-size:14px;">lock</span> Lock Document
            </button>
          </div>
        </div>
      </div>

      <div class="card content-viewer" *ngIf="selectedContent()" data-testid="content-viewer">
        <div class="card-header">
          <h2><span class="material-icon" style="font-size:18px;">article</span> Document Content Preview</h2>
        </div>
        <div class="card-body">
          <div class="section" *ngIf="selectedContent().cycle">
            <h3 class="section-title">Municipality Overview</h3>
            <div class="detail-grid">
              <div class="detail-item"><label>Municipality</label><span>{{ selectedContent().cycle.municipalityName }}</span></div>
              <div class="detail-item"><label>Cycle</label><span>{{ selectedContent().cycle.name }}</span></div>
              <div class="detail-item"><label>Period</label><span>{{ selectedContent().cycle.startYear }} &ndash; {{ selectedContent().cycle.endYear }}</span></div>
              <div class="detail-item"><label>Revision</label><span>{{ selectedContent().cycle.revisionNumber }}</span></div>
            </div>
          </div>

          <div class="section" *ngIf="selectedContent().processPlan">
            <h3 class="section-title">Process Plan</h3>
            <table class="data-table compact">
              <thead><tr><th>Phase</th><th>Status</th><th>Progress</th></tr></thead>
              <tbody>
                <tr *ngFor="let p of selectedContent().processPlan">
                  <td>{{ p.name }}</td>
                  <td><span class="status-pill sm" [attr.data-ds]="p.status?.toLowerCase()?.replace(' ','-')">{{ p.status }}</span></td>
                  <td>{{ p.progress }}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="section" *ngIf="selectedContent().strategicObjectives">
            <h3 class="section-title">Strategic Objectives &amp; Projects</h3>
            <div class="objective-block" *ngFor="let o of selectedContent().strategicObjectives">
              <h4>{{ o.code }}: {{ o.description }}</h4>
              <div class="tags" *ngIf="o.alignmentTags"><span class="tag">{{ o.alignmentTags }}</span></div>
              <table class="data-table compact" *ngIf="o.projects?.length">
                <thead><tr><th>Project</th><th>Class</th><th>Dept</th><th>Budget</th><th>KPIs</th></tr></thead>
                <tbody>
                  <tr *ngFor="let p of o.projects">
                    <td>{{ p.name }}</td><td>{{ p.classification }}</td><td>{{ p.department }}</td>
                    <td>R{{ p.budgetAmount | number:'1.0-0' }}</td><td>{{ p.indicators?.length || 0 }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="section" *ngIf="selectedContent().publicParticipation">
            <h3 class="section-title">Public Participation Summary</h3>
            <div class="participation-stats">
              <span>Total: {{ selectedContent().publicParticipation.totalComments }}</span>
              <span>Responded: {{ selectedContent().publicParticipation.responded }}</span>
              <span>Pending: {{ selectedContent().publicParticipation.pending }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="empty" *ngIf="!versions().length && !generating()" data-testid="empty-drafts">
        <span class="material-icon" style="font-size:56px;color:#e2e8f0;">description</span>
        <p>No draft IDP documents generated yet</p>
        <p class="sub">Click "Generate Draft IDP" to compile the document from current cycle data</p>
      </div>
    </div>
  `,
  styles: [`
    .versions-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
    .version-card { padding: 16px 20px; cursor: pointer; transition: all .15s; }
    .version-card:hover { border-color: #3b82f6; }
    .version-card.selected { border-color: #3b82f6; background: #f0f7ff; }
    .version-header { display: flex; justify-content: space-between; align-items: center; }
    .version-title { display: flex; align-items: center; gap: 10px; }
    .version-title strong { font-size: 14px; display: block; }
    .version-date { font-size: 12px; color: var(--platinum-text-muted); display: block; }
    .version-badges { display: flex; align-items: center; gap: 8px; }
    .lock-badge { color: var(--platinum-danger); }
    .version-actions { display: flex; gap: 8px; margin-top: 12px; border-top: 1px solid var(--platinum-border-light); padding-top: 10px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 16px; font-weight: 700; color: var(--platinum-primary); margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid var(--platinum-accent); }
    app-draft-idp .detail-grid { grid-template-columns: repeat(4,1fr); gap: 12px; }
    .detail-item label { display: block; }
    .detail-item span { font-size: 14px; }
    .objective-block { margin-bottom: 16px; }
    .objective-block h4 { font-size: 14px; font-weight: 600; color: var(--platinum-text); margin-bottom: 6px; }
    .tags { margin-bottom: 8px; }
    .tag { padding: 2px 8px; border-radius: 12px; font-size: 11px; background: var(--platinum-indigo-light); color: #283593; }
    .participation-stats { display: flex; gap: 20px; font-size: 14px; font-weight: 500; }
    .sub { font-size: 13px; margin-top: 4px; }
  `]
})
export class DraftIdpComponent implements OnInit {
  versions = signal<IdpDocumentVersion[]>([]);
  selectedVersionId = signal(0);
  generating = signal(false);
  error = signal('');
  success = signal('');
  private _parsedContent = signal<any>(null);

  constructor(private api: ApiService, private cycleState: CycleStateService) {}

  ngOnInit() {
    this.cycleState.ensureActiveCycle().then(c => { if (c) this.loadVersions(c.id); });
  }

  loadVersions(cycleId: number) {
    this.api.getDocumentVersions(cycleId).subscribe(v => this.versions.set(v));
  }

  draftVersions() { return this.versions().filter(v => v.versionType === 'Draft'); }

  selectVersion(v: IdpDocumentVersion) {
    this.selectedVersionId.set(v.id);
    try {
      this._parsedContent.set(v.contentJson ? JSON.parse(v.contentJson) : null);
    } catch { this._parsedContent.set(null); }
  }

  selectedContent() { return this._parsedContent(); }

  statusKey(s: string): string { return s.toLowerCase().replace(/\s+/g, '-'); }

  generateDraft() {
    const cycleId = this.cycleState.activeCycleId();
    if (!cycleId) return;
    this.generating.set(true);
    this.error.set('');
    this.success.set('');
    this.api.generateDraftIdp(cycleId).subscribe({
      next: doc => {
        this.generating.set(false);
        this.success.set(`Draft IDP v${doc.versionNumber} generated successfully`);
        this.loadVersions(cycleId);
        this.selectVersion(doc);
      },
      error: (err: any) => {
        this.generating.set(false);
        this.error.set(typeof err.error === 'string' ? err.error : err.error?.title || 'Failed to generate Draft IDP');
      }
    });
  }

  submitForReview(v: IdpDocumentVersion) {
    this.api.submitForReview(v.id).subscribe({
      next: () => { this.success.set('Draft submitted for review'); this.loadVersions(this.cycleState.activeCycleId()); },
      error: (err: any) => this.error.set(err.error || 'Failed to submit')
    });
  }

  lockDocument(v: IdpDocumentVersion) {
    this.api.lockDocument(v.id).subscribe(() => this.loadVersions(this.cycleState.activeCycleId()));
  }
}
