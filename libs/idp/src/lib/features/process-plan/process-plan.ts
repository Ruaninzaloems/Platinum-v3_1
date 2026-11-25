import { Component, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { CycleStateService } from '../../core/services/cycle-state.service';
import { IdpProcessPhase, IdpMilestone } from '../../core/models/idp.models';
import { environment } from '../../environment';

@Component({
  selector: 'app-process-plan',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="page">
      <div class="page-header">
        <h1 data-testid="text-page-title">IDP Process Plan</h1>
        <p class="page-subtitle">Section 5.2 &mdash; Phase Management &amp; Milestones</p>
      </div>

      <div class="phase-stepper" data-testid="phase-stepper">
        <div class="stepper-track">
          <div class="step" *ngFor="let p of phases(); let i = index"
               [class.completed]="p.progress===100"
               [class.active]="p.id === selectedPhaseId()"
               [class.in-progress]="p.progress > 0 && p.progress < 100"
               (click)="selectPhase(p)"
               [attr.data-testid]="'step-' + i + ''">
            <div class="step-dot">
              <span class="material-icon" *ngIf="p.progress===100" style="font-size:16px;">check</span>
              <span *ngIf="p.progress<100">{{ i + 1 }}</span>
            </div>
            <div class="step-label">{{ p.name }}</div>
            <div class="step-pct">{{ p.progress }}%</div>
          </div>
        </div>
      </div>

      <div class="grid-main" *ngIf="selectedPhase() as phase">
        <div class="card phase-detail" data-testid="card-phase-detail">
          <div class="card-header">
            <h2>{{ phase.name }}</h2>
            <span class="status-pill" [attr.data-status]="phase.status.toLowerCase().replace(' ','-')">{{ phase.status }}</span>
          </div>
          <div class="card-body">
            <div class="detail-grid">
              <div class="detail-item"><label>Owner</label><span>{{ phase.owner || 'Not assigned' }}</span></div>
              <div class="detail-item"><label>Start Date</label><span>{{ phase.startDate | date:'dd MMM yyyy' }}</span></div>
              <div class="detail-item"><label>End Date</label><span>{{ phase.endDate | date:'dd MMM yyyy' }}</span></div>
              <div class="detail-item"><label>Progress</label>
                <div class="progress-bar-wrap">
                  <div class="progress-track"><div class="progress-fill" [style.width.%]="phase.progress"></div></div>
                  <span class="pct">{{ phase.progress }}%</span>
                </div>
              </div>
            </div>

            <div class="validation-box" *ngIf="progressCheck()" data-testid="validation-box">
              <div class="validation-pass" *ngIf="progressCheck().canProgress">
                <span class="material-icon" style="color:#4caf50;">check_circle</span> All mandatory milestones completed
              </div>
              <div class="validation-fail" *ngIf="!progressCheck().canProgress">
                <span class="material-icon" style="color:#ef5350;">error</span> Cannot progress &mdash; mandatory milestones incomplete:
                <ul><li *ngFor="let m of progressCheck().mandatoryIncomplete">{{ m }}</li></ul>
              </div>
              <div class="validation-fail" *ngIf="progressCheck().missingEvidence?.length">
                <span class="material-icon" style="color:#f59e0b;">warning</span> Missing evidence:
                <ul><li *ngFor="let m of progressCheck().missingEvidence">{{ m }}</li></ul>
              </div>
            </div>
          </div>
        </div>

        <div class="card milestones-card" data-testid="card-milestones">
          <div class="card-header">
            <h2>Milestones</h2>
            <button class="btn btn-sm" (click)="startAddMilestone()" data-testid="button-add-milestone">
              <span class="material-icon" style="font-size:16px;">add</span> Add
            </button>
          </div>
          <div class="card-body">
            <div class="milestone-form" *ngIf="showMilestoneForm()" data-testid="form-milestone">
              <div class="form-grid-3">
                <div class="field"><label>Title</label><input [(ngModel)]="mf.title" data-testid="input-milestone-title" /></div>
                <div class="field"><label>Assigned To</label><input [(ngModel)]="mf.assignedTo" data-testid="input-milestone-assigned" /></div>
                <div class="field"><label>Due Date</label><input type="date" [(ngModel)]="mf.dueDate" data-testid="input-milestone-due" /></div>
              </div>
              <div class="form-row">
                <label class="checkbox-label"><input type="checkbox" [(ngModel)]="mf.isMandatory" data-testid="input-milestone-mandatory" /> Mandatory</label>
              </div>
              <div class="form-actions">
                <button class="btn btn-secondary" (click)="cancelMilestoneForm()" data-testid="button-cancel-milestone">Cancel</button>
                <button class="btn btn-primary" (click)="saveMilestone()" data-testid="button-save-milestone">{{ editingMilestoneId ? 'Update' : 'Save' }}</button>
              </div>
            </div>

            <div class="milestone-list">
              <div class="milestone-item" *ngFor="let m of phaseMilestones()" [class.overdue]="isOverdue(m)" [class.mandatory]="m.isMandatory" [attr.data-testid]="'milestone-' + m.id + ''">
                <div class="milestone-status-dot" [attr.data-ms]="m.status.toLowerCase().replace(' ','-')"></div>
                <div class="milestone-body">
                  <div class="milestone-top">
                    <span class="milestone-title">{{ m.title }} <span class="mandatory-badge" *ngIf="m.isMandatory">MANDATORY</span></span>
                    <span class="milestone-status-label" [attr.data-ms]="m.status.toLowerCase().replace(' ','-')">{{ m.status }}</span>
                  </div>
                  <div class="milestone-meta">
                    <span *ngIf="m.assignedTo"><span class="material-icon" style="font-size:14px;">person</span> {{ m.assignedTo }}</span>
                    <span *ngIf="m.dueDate"><span class="material-icon" style="font-size:14px;">event</span> {{ m.dueDate | date:'dd MMM yyyy' }}</span>
                  </div>
                  <div class="milestone-evidence" *ngIf="m.evidenceUrl">
                    <div class="evidence-attached-row">
                      <span class="material-icon" style="font-size:16px; color:#2e7d32;">check_circle</span>
                      <span class="evidence-filename">{{ getEvidenceFilename(m.evidenceUrl) }}</span>
                      <a class="evidence-action-btn view-btn" [href]="getEvidenceViewUrl(m.evidenceUrl)" target="_blank" [attr.data-testid]="'link-view-evidence-' + m.id">
                        <span class="material-icon" style="font-size:14px;">visibility</span> View
                      </a>
                      <a class="evidence-action-btn download-btn" [href]="getEvidenceDownloadUrl(m.evidenceUrl)" target="_blank" [attr.data-testid]="'link-download-evidence-' + m.id">
                        <span class="material-icon" style="font-size:14px;">download</span> Download
                      </a>
                      <label class="evidence-action-btn replace-btn" [attr.data-testid]="'button-reupload-' + m.id">
                        <span class="material-icon" style="font-size:14px;">cloud_upload</span> Replace
                        <input type="file" (change)="onUploadEvidence(m, $event)" style="display:none;" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" />
                      </label>
                    </div>
                  </div>
                  <div class="milestone-evidence" *ngIf="!m.evidenceUrl">
                    <label class="upload-evidence-btn" [attr.data-testid]="'button-upload-' + m.id">
                      <span class="material-icon" style="font-size:16px;">cloud_upload</span>
                      {{ uploadingMilestoneId === m.id ? 'Uploading...' : 'Upload evidence' }}
                      <input type="file" (change)="onUploadEvidence(m, $event)" style="display:none;" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" />
                    </label>
                    <span *ngIf="m.isMandatory" class="no-evidence"><span class="material-icon" style="font-size:14px;">warning</span> Required</span>
                  </div>
                </div>
                <div class="milestone-actions">
                  <button class="icon-btn edit-btn" (click)="startEditMilestone(m)" [attr.data-testid]="'button-edit-' + m.id" title="Edit milestone">
                    <span class="material-icon" style="font-size:16px;">edit</span>
                  </button>
                  <select [ngModel]="m.status" (ngModelChange)="updateMilestoneStatus(m, $event)" [attr.data-testid]="'select-status-' + m.id + ''">
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div class="empty" *ngIf="!phaseMilestones().length">No milestones for this phase</div>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-full" *ngIf="!phases().length" data-testid="empty-phases">
        <span class="material-icon" style="font-size:48px;color:#e2e8f0;">timeline</span>
        <p>No process phases found for the active cycle</p>
      </div>
    </div>
  `,
  styles: [`
    .phase-stepper { margin-bottom: 24px; }
    .stepper-track { display: flex; gap: 0; background: white; border: 1px solid var(--platinum-border); border-radius: var(--platinum-card-radius); overflow: hidden; }
    .step { flex: 1; padding: 16px; cursor: pointer; border-right: 1px solid var(--platinum-border); display: flex; flex-direction: column; align-items: center; gap: 6px; transition: background .15s; position: relative; }
    .step:last-child { border-right: none; }
    .step:hover { background: var(--platinum-surface-warm); }
    .step.active { background: #f0f7ff; }
    .step.active::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: #3b82f6; }
    .step-dot { width: 32px; height: 32px; border-radius: 50%; background: #e2e8f0; color: #94a3b8; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; }
    .step.completed .step-dot { background: #10b981; color: white; }
    .step.active .step-dot { background: #3b82f6; color: white; box-shadow: 0 0 0 3px rgba(59,130,246,.2); }
    .step.in-progress .step-dot { background: var(--platinum-warning); color: white; }
    .step-label { font-size: 12px; font-weight: 600; color: var(--platinum-text); text-align: center; }
    .step-pct { font-size: 11px; color: var(--platinum-text-muted); }
    app-process-plan .grid-main { grid-template-columns: 1fr 1.5fr; }
    @media(max-width:900px){ app-process-plan .grid-main { grid-template-columns: 1fr; } }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .detail-item { display: flex; flex-direction: column; gap: 2px; }
    .detail-item label { font-size: 11px; }
    .detail-item span { font-size: 14px; color: var(--platinum-text); }
    .progress-bar-wrap { display: flex; align-items: center; gap: 8px; }
    .pct { font-size: 13px; font-weight: 600; }
    .validation-box { margin-top: 12px; padding: 12px; border-radius: 8px; background: var(--platinum-surface); }
    .validation-pass { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #2e7d32; }
    .validation-fail { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: #c62828; margin-bottom: 8px; }
    .validation-fail ul { margin: 4px 0 0 0; padding-left: 16px; }
    .validation-fail li { font-size: 12px; }
    .form-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .checkbox-label { display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; white-space: nowrap; }
    .milestone-list { display: flex; flex-direction: column; gap: 6px; }
    .milestone-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px; border-radius: 8px; border: 1px solid var(--platinum-border); transition: all .15s; }
    .milestone-item:hover { border-color: #cbd5e1; }
    .milestone-item.overdue { border-left: 3px solid var(--platinum-danger); }
    .milestone-item.mandatory { background: #fffbeb; }
    .milestone-status-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
    .milestone-status-dot[data-ms="not-started"] { background: #cbd5e1; }
    .milestone-status-dot[data-ms="in-progress"] { background: var(--platinum-warning); }
    .milestone-status-dot[data-ms="completed"] { background: #10b981; }
    .milestone-body { flex: 1; }
    .milestone-top { display: flex; justify-content: space-between; align-items: center; }
    .milestone-title { font-size: 13px; font-weight: 600; }
    .mandatory-badge { font-size: 9px; padding: 1px 6px; border-radius: 4px; background: #fef3c7; color: #92400e; font-weight: 700; margin-left: 6px; vertical-align: middle; }
    .milestone-status-label { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 12px; }
    .milestone-status-label[data-ms="not-started"] { background: #f1f5f9; color: #64748b; }
    .milestone-status-label[data-ms="in-progress"] { background: #fff3e0; color: #ef6c00; }
    .milestone-status-label[data-ms="completed"] { background: #e8f5e9; color: #1b5e20; }
    .milestone-meta { display: flex; gap: 12px; margin-top: 4px; font-size: 12px; color: var(--platinum-text-muted); }
    .milestone-meta span { display: flex; align-items: center; gap: 3px; }
    .milestone-evidence { margin-top: 8px; }
    .evidence-attached-row { display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: #e8f5e9; border-radius: 6px; font-size: 12px; }
    .evidence-filename { color: #1b5e20; font-weight: 500; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .evidence-action-btn { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; padding: 3px 8px; border-radius: 4px; cursor: pointer; text-decoration: none; border: 1px solid transparent; transition: all .15s; }
    .view-btn { color: #1565c0; background: #e3f2fd; border-color: #90caf9; }
    .view-btn:hover { background: #bbdefb; }
    .download-btn { color: #2e7d32; background: #f1f8e9; border-color: #a5d6a7; }
    .download-btn:hover { background: #c8e6c9; }
    .replace-btn { color: #e65100; background: #fff3e0; border-color: #ffcc80; }
    .replace-btn:hover { background: #ffe0b2; }
    .upload-evidence-btn { display: inline-flex; align-items: center; gap: 4px; color: var(--platinum-primary); cursor: pointer; font-size: 12px; padding: 6px 14px; border: 1px dashed var(--platinum-primary); border-radius: 6px; transition: all .15s; }
    .upload-evidence-btn:hover { background: rgba(0,90,150,.06); }
    .no-evidence { color: #ef6c00; display: inline-flex; align-items: center; gap: 3px; margin-left: 8px; font-size: 12px; }
    .milestone-actions { display: flex; align-items: center; gap: 6px; }
    .milestone-actions select { font-size: 11px; padding: 3px 6px; }
    .edit-btn { background: none; border: 1px solid var(--platinum-border); border-radius: 6px; padding: 4px; cursor: pointer; color: var(--platinum-text-muted); transition: all .15s; }
    .edit-btn:hover { background: var(--platinum-surface-alt); color: var(--platinum-primary); border-color: var(--platinum-primary); }
    .milestone-form { background: var(--platinum-surface); border: 1px solid var(--platinum-border); border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .empty-full { text-align: center; padding: 60px; color: var(--platinum-text-muted); }
    .empty-full p { margin-top: 12px; }
  `]
})
export class ProcessPlanComponent implements OnInit {
  phases = signal<IdpProcessPhase[]>([]);
  milestones = signal<IdpMilestone[]>([]);
  selectedPhaseId = signal(0);
  showMilestoneForm = signal(false);
  editingMilestoneId: number | null = null;
  uploadingMilestoneId: number | null = null;
  mf: any = { title: '', assignedTo: '', dueDate: '', isMandatory: false };
  private _progressCheck = signal<any>(null);

  constructor(private api: ApiService, private cycleState: CycleStateService) {}

  ngOnInit() {
    this.cycleState.ensureActiveCycle().then(c => { if (c) this.load(c.id); });
  }

  load(cycleId: number) {
    this.api.getPhases(cycleId).subscribe(p => {
      this.phases.set(p);
      if (p.length && !this.selectedPhaseId()) this.selectPhase(p[0]);
    });
    this.api.getMilestones(cycleId).subscribe(m => this.milestones.set(m));
  }

  selectPhase(p: IdpProcessPhase) {
    this.selectedPhaseId.set(p.id);
    this.api.checkPhaseProgress(p.id).subscribe(r => this._progressCheck.set(r));
  }

  selectedPhase() { return this.phases().find(p => p.id === this.selectedPhaseId()) || null; }
  phaseMilestones() { return this.milestones().filter(m => m.phaseId === this.selectedPhaseId()); }
  progressCheck() { return this._progressCheck(); }

  isOverdue(m: IdpMilestone): boolean {
    return !!m.dueDate && new Date(m.dueDate) < new Date() && m.status !== 'Completed';
  }

  startAddMilestone() {
    this.editingMilestoneId = null;
    this.mf = { title: '', assignedTo: '', dueDate: '', isMandatory: false };
    this.showMilestoneForm.set(true);
  }

  startEditMilestone(m: IdpMilestone) {
    this.editingMilestoneId = m.id;
    this.mf = {
      title: m.title,
      assignedTo: m.assignedTo || '',
      dueDate: m.dueDate ? new Date(m.dueDate).toISOString().split('T')[0] : '',
      isMandatory: m.isMandatory,
    };
    this.showMilestoneForm.set(true);
  }

  cancelMilestoneForm() {
    this.showMilestoneForm.set(false);
    this.editingMilestoneId = null;
    this.mf = { title: '', assignedTo: '', dueDate: '', isMandatory: false };
  }

  onUploadEvidence(m: IdpMilestone, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadingMilestoneId = m.id;
    this.api.uploadMilestoneEvidence(m.id, file).subscribe({
      next: () => {
        this.uploadingMilestoneId = null;
        this.load(this.cycleState.activeCycleId());
      },
      error: (err: any) => {
        this.uploadingMilestoneId = null;
        alert(typeof err.error === 'string' ? err.error : 'Upload failed');
      }
    });
  }

  getEvidenceViewUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    // Monorepo adaptation: prefix with apiPrefix so the direct [href] routes through
    // the shell proxy (/idp-app/api/* → IDP backend), matching ApiService.
    return `${environment.apiPrefix}/api/milestones/evidence-file?path=${encodeURIComponent(url)}`;
  }

  getEvidenceDownloadUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${environment.apiPrefix}/api/milestones/evidence-file?path=${encodeURIComponent(url)}&download=true`;
  }

  getEvidenceFilename(url: string): string {
    if (!url) return '';
    const parts = url.split('/');
    return parts[parts.length - 1] || 'evidence';
  }

  saveMilestone() {
    const phase = this.selectedPhase();
    if (!phase) return;
    const cycleId = this.cycleState.activeCycleId();

    if (this.editingMilestoneId) {
      this.api.updateMilestone(this.editingMilestoneId, {
        title: this.mf.title,
        assignedTo: this.mf.assignedTo,
        dueDate: this.mf.dueDate,
        isMandatory: this.mf.isMandatory,
      }).subscribe({
        next: () => {
          this.cancelMilestoneForm();
          this.load(cycleId);
        },
        error: (err: any) => alert(typeof err.error === 'string' ? err.error : 'Failed to update milestone')
      });
    } else {
      this.api.createMilestone({ ...this.mf, phaseId: phase.id, cycleId, status: 'Not Started', progress: 0 }).subscribe(() => {
        this.cancelMilestoneForm();
        this.load(cycleId);
      });
    }
  }

  updateMilestoneStatus(m: IdpMilestone, status: string) {
    this.api.updateMilestoneStatus(m.id, status).subscribe({
      next: () => this.load(this.cycleState.activeCycleId()),
      error: (err: any) => alert(typeof err.error === 'string' ? err.error : 'Cannot update status')
    });
  }
}
