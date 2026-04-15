import { Component, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { CycleStateService } from '../../core/services/cycle-state.service';
import { IdpPublicComment } from '../../core/models/idp.models';

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="page">
      <div class="page-header">
        <h1 data-testid="text-page-title">Public Participation</h1>
        <button class="btn btn-primary" (click)="showForm.set(true)" *ngIf="!showForm()" data-testid="button-add-comment">
          <span class="material-icon" style="font-size:18px;">add</span> Capture Comment
        </button>
      </div>

      <div class="status-filters" data-testid="status-filters">
        <button class="filter-chip" [class.active]="statusFilter()===''" (click)="statusFilter.set('')" data-testid="filter-all">All ({{ comments().length }})</button>
        <button class="filter-chip" [class.active]="statusFilter()==='Received'" (click)="statusFilter.set('Received')" data-testid="filter-received">Received</button>
        <button class="filter-chip" [class.active]="statusFilter()==='Under Review'" (click)="statusFilter.set('Under Review')" data-testid="filter-review">Under Review</button>
        <button class="filter-chip" [class.active]="statusFilter()==='Responded'" (click)="statusFilter.set('Responded')" data-testid="filter-responded">Responded</button>
        <button class="filter-chip" [class.active]="statusFilter()==='Closed'" (click)="statusFilter.set('Closed')" data-testid="filter-closed">Closed</button>
        <button class="filter-chip escalated" [class.active]="statusFilter()==='Escalated'" (click)="statusFilter.set('Escalated')" data-testid="filter-escalated">Escalated</button>
      </div>

      <div class="card form-card" *ngIf="showForm()" data-testid="form-comment">
        <div class="card-header"><h2>Capture Public Comment</h2></div>
        <div class="card-body">
          <div class="form-grid">
            <div class="field"><label>Source Channel</label>
              <select [(ngModel)]="cf.sourceChannel" data-testid="select-channel">
                <option value="Public Meeting">Public Meeting</option>
                <option value="Website">Website</option>
                <option value="Ward Committee">Ward Committee</option>
                <option value="Email">Email</option>
                <option value="Walk-in">Walk-in</option>
              </select>
            </div>
            <div class="field"><label>Category</label><input [(ngModel)]="cf.category" placeholder="e.g. Infrastructure, Service Delivery" data-testid="input-category" /></div>
            <div class="field"><label>Ward</label><input [(ngModel)]="cf.ward" data-testid="input-ward" /></div>
            <div class="field"><label>Region</label><input [(ngModel)]="cf.region" data-testid="input-region" /></div>
            <div class="field"><label>Submitter Name</label><input [(ngModel)]="cf.submitterName" data-testid="input-submitter" /></div>
            <div class="field"><label>Submission Date</label><input type="date" [(ngModel)]="cf.submissionDate" data-testid="input-date" /></div>
            <div class="field full"><label>Comment</label><textarea [(ngModel)]="cf.commentText" rows="3" data-testid="input-comment-text"></textarea></div>
          </div>
          <div class="form-actions">
            <button class="btn btn-secondary" (click)="showForm.set(false)" data-testid="button-cancel">Cancel</button>
            <button class="btn btn-primary" (click)="saveComment()" data-testid="button-save">Submit Comment</button>
          </div>
        </div>
      </div>

      <div class="comments-list">
        <div class="comment-card" *ngFor="let c of filteredComments()" [attr.data-testid]="'card-comment-' + c.id + ''">
          <div class="comment-top">
            <div class="comment-meta">
              <span class="channel-badge">{{ c.sourceChannel }}</span>
              <span class="comment-submitter" *ngIf="c.submitterName">{{ c.submitterName }}</span>
              <span class="comment-date">{{ c.submissionDate | date:'dd MMM yyyy' }}</span>
              <span class="ward-tag" *ngIf="c.ward">Ward {{ c.ward }}</span>
            </div>
            <span class="status-pill" [attr.data-cs]="statusKey(c.status)">{{ c.status }}</span>
          </div>
          <p class="comment-text">{{ c.commentText }}</p>
          <div class="comment-category" *ngIf="c.category"><span class="material-icon" style="font-size:14px;">label</span> {{ c.category }}</div>

          <div class="responses" *ngIf="c.responses?.length">
            <div class="response" *ngFor="let r of c.responses">
              <div class="response-header"><span class="material-icon" style="font-size:14px;color:#4caf50;">reply</span> {{ r.responsibleOfficial }} &middot; {{ r.createdDate | date:'dd MMM yyyy' }}</div>
              <p class="response-text">{{ r.responseText }}</p>
            </div>
          </div>

          <div class="comment-actions">
            <select [ngModel]="c.status" (ngModelChange)="changeStatus(c, $event)" [attr.data-testid]="'select-status-' + c.id + ''">
              <option value="Received">Received</option>
              <option value="Under Review">Under Review</option>
              <option value="Responded">Responded</option>
              <option value="Closed">Closed</option>
              <option value="Escalated">Escalated</option>
            </select>
            <button class="btn btn-sm" (click)="openRespond(c)" *ngIf="c.status !== 'Closed'" [attr.data-testid]="'button-respond-' + c.id + ''">
              <span class="material-icon" style="font-size:14px;">reply</span> Respond
            </button>
          </div>

          <div class="respond-form" *ngIf="respondingTo() === c.id" [attr.data-testid]="'form-respond-' + c.id + ''">
            <div class="field"><label>Response</label><textarea [(ngModel)]="rf.responseText" rows="2" data-testid="input-response-text"></textarea></div>
            <div class="field"><label>Responsible Official</label><input [(ngModel)]="rf.responsibleOfficial" data-testid="input-response-official" /></div>
            <div class="form-actions">
              <button class="btn btn-secondary" (click)="respondingTo.set(0)" data-testid="button-cancel-respond">Cancel</button>
              <button class="btn btn-primary" (click)="submitResponse(c)" data-testid="button-submit-response">Submit Response</button>
            </div>
          </div>
        </div>

        <div class="empty" *ngIf="!filteredComments().length" data-testid="empty-comments">
          <span class="material-icon" style="font-size:48px;color:#e2e8f0;">forum</span>
          <p>No comments {{ statusFilter() ? 'with status "' + statusFilter() + '"' : 'recorded yet' }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .status-filters { display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: wrap; }
    .comments-list { display: flex; flex-direction: column; gap: 12px; }
    .comment-card { background: white; border: 1px solid var(--platinum-border); border-radius: var(--platinum-card-radius); padding: 16px 20px; transition: box-shadow .15s; box-shadow: var(--platinum-card-shadow); }
    .comment-card:hover { box-shadow: var(--platinum-card-shadow-hover); }
    .comment-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .comment-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .channel-badge { padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; background: var(--platinum-info-light); color: #1565c0; }
    .comment-submitter { font-size: 13px; font-weight: 600; }
    .comment-date { font-size: 12px; color: var(--platinum-text-muted); }
    .ward-tag { font-size: 11px; padding: 1px 6px; border-radius: 4px; background: var(--platinum-surface-alt); color: #64748b; }
    .comment-text { font-size: 14px; line-height: 1.5; margin-bottom: 8px; }
    .comment-category { font-size: 12px; color: var(--platinum-text-muted); display: flex; align-items: center; gap: 4px; margin-bottom: 10px; }
    .responses { border-top: 1px solid var(--platinum-border-light); padding-top: 10px; margin-bottom: 10px; }
    .response { background: var(--platinum-surface-warm); border-radius: 8px; padding: 10px; margin-bottom: 6px; }
    .response-header { font-size: 12px; font-weight: 600; color: var(--platinum-text-secondary); display: flex; align-items: center; gap: 4px; margin-bottom: 4px; }
    .response-text { font-size: 13px; margin: 0; }
    .comment-actions { display: flex; align-items: center; gap: 8px; border-top: 1px solid var(--platinum-border-light); padding-top: 10px; }
    .comment-actions select { font-size: 11px; padding: 4px 8px; }
    .respond-form { background: var(--platinum-surface); border: 1px solid var(--platinum-border); border-radius: 8px; padding: 14px; margin-top: 10px; }
  `]
})
export class CommentsComponent implements OnInit {
  comments = signal<IdpPublicComment[]>([]);
  statusFilter = signal('');
  showForm = signal(false);
  respondingTo = signal(0);
  cf: any = { sourceChannel: 'Public Meeting', category: '', ward: '', region: '', submitterName: '', submissionDate: '', commentText: '' };
  rf: any = { responseText: '', responsibleOfficial: '' };

  constructor(private api: ApiService, private cycleState: CycleStateService) {}

  ngOnInit() {
    this.cycleState.ensureActiveCycle().then(c => { if (c) this.load(c.id); });
  }

  load(cycleId: number) {
    this.api.getComments(cycleId).subscribe(c => this.comments.set(c));
  }

  filteredComments() {
    const f = this.statusFilter();
    return f ? this.comments().filter(c => c.status === f) : this.comments();
  }

  statusKey(s: string): string { return s.toLowerCase().replace(/\s+/g, '-'); }

  saveComment() {
    const cycleId = this.cycleState.activeCycleId();
    this.api.createComment({ ...this.cf, cycleId }).subscribe(() => {
      this.showForm.set(false);
      this.cf = { sourceChannel: 'Public Meeting', category: '', ward: '', region: '', submitterName: '', submissionDate: '', commentText: '' };
      this.load(cycleId);
    });
  }

  changeStatus(c: IdpPublicComment, status: string) {
    this.api.updateCommentStatus(c.id, status).subscribe(() => this.load(this.cycleState.activeCycleId()));
  }

  openRespond(c: IdpPublicComment) {
    this.respondingTo.set(c.id);
    this.rf = { responseText: '', responsibleOfficial: '' };
  }

  submitResponse(c: IdpPublicComment) {
    this.api.respondToComment(c.id, this.rf).subscribe(() => {
      this.respondingTo.set(0);
      this.load(this.cycleState.activeCycleId());
    });
  }
}
