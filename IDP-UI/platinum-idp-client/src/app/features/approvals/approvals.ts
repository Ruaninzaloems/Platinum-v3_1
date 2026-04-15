import { Component, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { CycleStateService } from '../../core/services/cycle-state.service';
import { IdpDocumentVersion, IdpWorkflowTask } from '../../core/models/idp.models';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 data-testid="text-page-title">Approval Workflows</h1>
          <p class="page-subtitle">Sections 5.6 &amp; 5.8 &mdash; Sequential approval routing for Draft &amp; Final IDP</p>
        </div>
      </div>

      <div class="alert alert-error" *ngIf="error()" data-testid="text-error">
        <span class="material-icon" style="font-size:18px;">error</span> {{ error() }}
      </div>
      <div class="alert alert-success" *ngIf="success()" data-testid="text-success">
        <span class="material-icon" style="font-size:18px;">check_circle</span> {{ success() }}
      </div>

      <div class="document-selector" data-testid="document-selector">
        <div class="doc-chip" *ngFor="let d of documents()"
             [class.selected]="d.id === selectedDocId()"
             (click)="selectDocument(d)"
             [attr.data-testid]="'doc-chip-' + d.id + ''">
          <span class="material-icon" style="font-size:16px;">{{ d.versionType === 'Draft' ? 'description' : 'verified' }}</span>
          <span>{{ d.versionType }} v{{ d.versionNumber }}</span>
          <span class="doc-status" [attr.data-ds]="statusKey(d.status)">{{ d.status }}</span>
        </div>
        <div class="empty-inline" *ngIf="!documents().length">No documents with workflow tasks</div>
      </div>

      <div class="card" *ngIf="tasks().length" data-testid="card-workflow">
        <div class="card-header">
          <h2><span class="material-icon" style="font-size:18px;">account_tree</span> Approval Chain</h2>
          <span class="doc-label" *ngIf="selectedDoc() as d">{{ d.versionType }} IDP v{{ d.versionNumber }} &mdash; {{ d.status }}</span>
        </div>
        <div class="card-body">
          <div class="workflow-stepper">
            <div class="wf-step" *ngFor="let t of tasks(); let i = index" [attr.data-ws]="t.status.toLowerCase()" [attr.data-testid]="'task-' + t.id + ''">
              <div class="wf-connector" *ngIf="i > 0"></div>
              <div class="wf-step-content">
                <div class="wf-dot">
                  <span class="material-icon" *ngIf="t.status === 'Approved'" style="font-size:16px;">check</span>
                  <span class="material-icon" *ngIf="t.status === 'Rejected'" style="font-size:16px;">close</span>
                  <span *ngIf="t.status === 'Pending'">{{ t.sequence }}</span>
                </div>
                <div class="wf-info">
                  <div class="wf-top">
                    <span class="wf-type">{{ t.taskType }}</span>
                    <span class="wf-status-pill" [attr.data-ws]="t.status.toLowerCase()">{{ t.status }}</span>
                  </div>
                  <div class="wf-detail">
                    <span><span class="material-icon" style="font-size:14px;">person</span> {{ t.assignedTo }} ({{ t.assignedRole }})</span>
                    <span *ngIf="t.completedDate"><span class="material-icon" style="font-size:14px;">event</span> {{ t.completedDate | date:'dd MMM yyyy HH:mm' }}</span>
                  </div>
                  <div class="wf-comments" *ngIf="t.comments">
                    <span class="material-icon" style="font-size:14px;">comment</span> {{ t.comments }}
                  </div>

                  <div class="wf-actions" *ngIf="t.status === 'Pending' && canActOnTask(t)">
                    <div class="action-form">
                      <input [(ngModel)]="actionComments" placeholder="Add comments..." class="comment-input" [attr.data-testid]="'input-comments-' + t.id + ''" />
                      <div class="action-btns">
                        <button class="btn btn-approve" (click)="approve(t)" [attr.data-testid]="'button-approve-' + t.id + ''">
                          <span class="material-icon" style="font-size:16px;">check_circle</span> Approve
                        </button>
                        <button class="btn btn-reject" (click)="reject(t)" [attr.data-testid]="'button-reject-' + t.id + ''">
                          <span class="material-icon" style="font-size:16px;">cancel</span> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card" *ngIf="selectedDoc() as d" data-testid="card-doc-info">
        <div class="card-header"><h2>Document Status</h2></div>
        <div class="card-body">
          <div class="detail-grid">
            <div class="detail-item"><label>Type</label><span>{{ d.versionType }} IDP</span></div>
            <div class="detail-item"><label>Version</label><span>v{{ d.versionNumber }}</span></div>
            <div class="detail-item"><label>Status</label><span class="status-pill" [attr.data-ds]="statusKey(d.status)">{{ d.status }}</span></div>
            <div class="detail-item"><label>Locked</label><span>{{ d.isLocked ? 'Yes - Immutable' : 'No' }}</span></div>
            <div class="detail-item" *ngIf="d.lockedDate"><label>Locked Date</label><span>{{ d.lockedDate | date:'dd MMM yyyy HH:mm' }}</span></div>
            <div class="detail-item" *ngIf="d.resolutionNumber"><label>Resolution</label><span>{{ d.resolutionNumber }}</span></div>
          </div>
        </div>
      </div>

      <div class="empty" *ngIf="!documents().length" data-testid="empty-approvals">
        <span class="material-icon" style="font-size:56px;color:#e2e8f0;">approval</span>
        <p>No approval workflows active</p>
        <p class="sub">Submit a Draft or Final IDP for review to start the approval chain</p>
      </div>
    </div>
  `,
  styles: [`
    .document-selector { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
    .doc-chip { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 10px; border: 1px solid var(--platinum-border); background: white; cursor: pointer; font-size: 13px; font-weight: 500; transition: all .15s; }
    .doc-chip:hover { border-color: #3b82f6; }
    .doc-chip.selected { border-color: #3b82f6; background: #f0f7ff; }
    .doc-status { font-size: 10px; padding: 2px 6px; border-radius: 10px; font-weight: 600; text-transform: uppercase; }
    .doc-status[data-ds="draft"] { background: #f1f5f9; color: #64748b; }
    .doc-status[data-ds="in-review"] { background: #fff3e0; color: #ef6c00; }
    .doc-status[data-ds="approved-for-distribution"] { background: #e3f2fd; color: #1565c0; }
    .doc-status[data-ds="generated"] { background: var(--platinum-indigo-light); color: #283593; }
    .doc-status[data-ds="adopted"] { background: var(--platinum-success-light); color: #1b5e20; }
    .empty-inline { color: var(--platinum-text-muted); font-size: 13px; padding: 8px; }
    .doc-label { font-size: 12px; color: var(--platinum-text-muted); }
    .workflow-stepper { display: flex; flex-direction: column; }
    .wf-step { position: relative; }
    .wf-connector { position: absolute; left: 19px; top: -12px; width: 2px; height: 12px; background: #e2e8f0; }
    .wf-step[data-ws="approved"] .wf-connector { background: #10b981; }
    .wf-step-content { display: flex; gap: 16px; padding: 12px 0; }
    .wf-dot { width: 40px; height: 40px; border-radius: 50%; background: #e2e8f0; color: #94a3b8; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; flex-shrink: 0; }
    .wf-step[data-ws="approved"] .wf-dot { background: #10b981; color: white; }
    .wf-step[data-ws="rejected"] .wf-dot { background: var(--platinum-danger); color: white; }
    .wf-step[data-ws="pending"] .wf-dot { background: #f1f5f9; color: #94a3b8; border: 2px solid #e2e8f0; }
    .wf-info { flex: 1; }
    .wf-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .wf-type { font-size: 15px; font-weight: 600; }
    .wf-status-pill { padding: 2px 10px; border-radius: 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .wf-status-pill[data-ws="pending"] { background: #f1f5f9; color: #94a3b8; }
    .wf-status-pill[data-ws="approved"] { background: var(--platinum-success-light); color: #1b5e20; }
    .wf-status-pill[data-ws="rejected"] { background: var(--platinum-danger-light); color: #c62828; }
    .wf-detail { display: flex; gap: 16px; font-size: 13px; color: var(--platinum-text-secondary); margin-bottom: 4px; }
    .wf-detail span { display: flex; align-items: center; gap: 3px; }
    .wf-comments { font-size: 12px; color: var(--platinum-text-muted); display: flex; align-items: center; gap: 4px; font-style: italic; }
    .wf-actions { margin-top: 10px; }
    .action-form { display: flex; flex-direction: column; gap: 8px; }
    .comment-input { padding: 8px 12px; border: 1px solid var(--platinum-border); border-radius: 8px; font-size: 13px; width: 100%; }
    .comment-input:focus { outline: none; border-color: #3b82f6; }
    .btn-approve { background: #10b981; color: white; }
    .btn-approve:hover { background: #059669; }
    .btn-reject { background: var(--platinum-danger); color: white; }
    .btn-reject:hover { background: #d32f2f; }
    app-approvals .detail-grid { grid-template-columns: repeat(3,1fr); gap: 12px; }
    .detail-item label { display: block; }
    .detail-item span { font-size: 14px; }
    .sub { font-size: 13px; margin-top: 4px; }
  `]
})
export class ApprovalsComponent implements OnInit {
  documents = signal<IdpDocumentVersion[]>([]);
  tasks = signal<IdpWorkflowTask[]>([]);
  selectedDocId = signal(0);
  error = signal('');
  success = signal('');
  actionComments = '';

  constructor(private api: ApiService, private cycleState: CycleStateService) {}

  ngOnInit() {
    this.cycleState.ensureActiveCycle().then(c => { if (c) this.loadDocuments(c.id); });
  }

  loadDocuments(cycleId: number) {
    this.api.getDocumentVersions(cycleId).subscribe(docs => {
      this.documents.set(docs);
      const inReview = docs.find(d => d.status === 'In Review');
      if (inReview) this.selectDocument(inReview);
      else if (docs.length) this.selectDocument(docs[0]);
    });
  }

  selectDocument(d: IdpDocumentVersion) {
    this.selectedDocId.set(d.id);
    this.api.getWorkflowTasks(d.id).subscribe(t => this.tasks.set(t));
  }

  selectedDoc() { return this.documents().find(d => d.id === this.selectedDocId()) || null; }
  statusKey(s: string): string { return s.toLowerCase().replace(/\s+/g, '-'); }

  canActOnTask(t: IdpWorkflowTask): boolean {
    const idx = this.tasks().findIndex(x => x.id === t.id);
    if (idx === 0) return true;
    return this.tasks().slice(0, idx).every(x => x.status === 'Approved');
  }

  approve(t: IdpWorkflowTask) {
    this.error.set(''); this.success.set('');
    this.api.approveTask(t.id, this.actionComments, 0).subscribe({
      next: () => {
        this.success.set(`Task "${t.taskType}" approved`);
        this.actionComments = '';
        this.loadDocuments(this.cycleState.activeCycleId());
      },
      error: (err: any) => this.error.set(err.error || 'Approval failed')
    });
  }

  reject(t: IdpWorkflowTask) {
    this.error.set(''); this.success.set('');
    this.api.rejectTask(t.id, this.actionComments, 0).subscribe({
      next: () => {
        this.success.set(`Task "${t.taskType}" rejected — document returned to Draft`);
        this.actionComments = '';
        this.loadDocuments(this.cycleState.activeCycleId());
      },
      error: (err: any) => this.error.set(err.error || 'Rejection failed')
    });
  }
}
