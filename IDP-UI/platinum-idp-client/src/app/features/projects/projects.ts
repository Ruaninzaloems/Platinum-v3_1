import { Component, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { CycleStateService } from '../../core/services/cycle-state.service';
import { IdpProject, IdpStrategicObjective, IdpProjectIndicator, MscoaSegment, ProjectObjectiveLink } from '../../core/models/idp.models';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="page">
      <div class="page-header">
        <h1 data-testid="text-page-title">Projects</h1>
        <div class="header-actions">
          <div class="kpi-validation" *ngIf="kpiValidation()" data-testid="kpi-validation">
            <span class="material-icon" [style.color]="kpiValidation().canGenerateDraft ? '#4caf50' : '#ef5350'" style="font-size:18px;">{{ kpiValidation().canGenerateDraft ? 'check_circle' : 'error' }}</span>
            <span [class.text-danger]="!kpiValidation().canGenerateDraft">{{ kpiValidation().canGenerateDraft ? 'All KPIs valid' : kpiValidation().projectsMissingKpis.length + ' projects missing KPIs' }}</span>
          </div>
          <button class="btn btn-primary" (click)="showForm.set(true)" *ngIf="!showForm()" data-testid="button-add-project">
            <span class="material-icon" style="font-size:18px;">add</span> Add Project
          </button>
        </div>
      </div>

      <div class="kpi-row" data-testid="kpi-strip">
        <div class="kpi-tile"><div class="kpi-num">{{ projects().length }}</div><div class="kpi-lab">Total</div></div>
        <div class="kpi-tile"><div class="kpi-num">{{ capitalCount() }}</div><div class="kpi-lab">Capital</div></div>
        <div class="kpi-tile"><div class="kpi-num">{{ operationalCount() }}</div><div class="kpi-lab">Operational</div></div>
        <div class="kpi-tile"><div class="kpi-num">R{{ (totalBudget() / 1000000) | number:'1.1-1' }}M</div><div class="kpi-lab">Budget</div></div>
      </div>

      <div class="card form-card" *ngIf="showForm()" data-testid="form-project">
        <div class="card-header"><h2>{{ editingProject() ? 'Edit' : 'New' }} Project</h2></div>
        <div class="card-body">
          <div class="form-grid">
            <div class="field full"><label>Name</label><input [(ngModel)]="pf.name" data-testid="input-project-name" /></div>
            <div class="field"><label>Classification</label>
              <select [(ngModel)]="pf.classification" data-testid="select-classification">
                <option value="Capital">Capital</option>
                <option value="Operational">Operational</option>
              </select>
            </div>
            <div class="field"><label>Department</label><input [(ngModel)]="pf.department" data-testid="input-department" /></div>
            <div class="field"><label>Ward</label><input [(ngModel)]="pf.ward" data-testid="input-ward" /></div>
            <div class="field"><label>Priority</label>
              <select [(ngModel)]="pf.priority" data-testid="select-priority">
                <option value="Critical">Critical</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
              </select>
            </div>
            <div class="field"><label>Priority Ranking</label><input type="number" [(ngModel)]="pf.priorityRanking" data-testid="input-ranking" /></div>

            <div class="field full form-section-title"><span class="material-icon" style="font-size:18px;">account_tree</span> MSCOA Chart Segments</div>
            <div class="field"><label>MSCOA Project Segment</label>
              <select [(ngModel)]="pf.mscoaProjectSegment" data-testid="select-mscoa-project">
                <option value="">-- Select Posting Level --</option>
                <ng-container *ngFor="let s of mscoaProjectSegments()">
                  <option *ngIf="!s.isPostingLevel" disabled [value]="s.code" class="optgroup">{{ s.code }} - {{ s.description }}</option>
                  <option *ngIf="s.isPostingLevel" [value]="s.code">&nbsp;&nbsp;&nbsp;{{ s.code }} - {{ s.description }}</option>
                </ng-container>
              </select>
            </div>
            <div class="field"><label>MSCOA Fund</label>
              <select [(ngModel)]="pf.mscoaFundSegment" data-testid="select-mscoa-fund">
                <option value="">-- Select Posting Level --</option>
                <ng-container *ngFor="let s of mscoaFundSegments()">
                  <option *ngIf="!s.isPostingLevel" disabled [value]="s.code" class="optgroup">{{ s.code }} - {{ s.description }}</option>
                  <option *ngIf="s.isPostingLevel" [value]="s.code">&nbsp;&nbsp;&nbsp;{{ s.code }} - {{ s.description }}</option>
                </ng-container>
              </select>
            </div>
            <div class="field"><label>MSCOA Region</label>
              <select [(ngModel)]="pf.mscoaRegionSegment" data-testid="select-mscoa-region">
                <option value="">-- Select Posting Level --</option>
                <ng-container *ngFor="let s of mscoaRegionSegments()">
                  <option *ngIf="!s.isPostingLevel" disabled [value]="s.code" class="optgroup">{{ s.code }} - {{ s.description }}</option>
                  <option *ngIf="s.isPostingLevel" [value]="s.code">&nbsp;&nbsp;&nbsp;{{ s.code }} - {{ s.description }}</option>
                </ng-container>
              </select>
            </div>

            <div class="field full form-section-title"><span class="material-icon" style="font-size:18px;">payments</span> Financial Details</div>
            <div class="field"><label>Budget (R)</label><input type="number" [(ngModel)]="pf.budgetAmount" data-testid="input-budget" /></div>
            <div class="field"><label>Funding Source</label><input [(ngModel)]="pf.fundingSource" data-testid="input-funding" /></div>
            <div class="field full"><label>Funding Source Summary</label><input [(ngModel)]="pf.fundingSourceSummary" data-testid="input-funding-summary" /></div>

            <div class="field full form-section-title"><span class="material-icon" style="font-size:18px;">calendar_today</span> Timeline & Location</div>
            <div class="field"><label>Start Date</label><input type="date" [(ngModel)]="pf.startDate" data-testid="input-start" /></div>
            <div class="field"><label>End Date</label><input type="date" [(ngModel)]="pf.endDate" data-testid="input-end" /></div>
            <div class="field"><label>Latitude</label><input type="number" step="0.000001" [(ngModel)]="pf.latitude" placeholder="-33.9631" data-testid="input-latitude" /></div>
            <div class="field"><label>Longitude</label><input type="number" step="0.000001" [(ngModel)]="pf.longitude" placeholder="22.4617" data-testid="input-longitude" /></div>

            <div class="field full form-section-title"><span class="material-icon" style="font-size:18px;">flag</span> Strategic Objective Linkage</div>
            <div class="field full objective-links-section">
              <div class="obj-link-row" *ngFor="let link of objectiveLinksForm; let i = index">
                <select [(ngModel)]="link.objectiveId" class="obj-select" [attr.data-testid]="'select-obj-link-' + i">
                  <option value="">-- Select Objective --</option>
                  <option *ngFor="let o of objectives()" [value]="o.id">{{ o.code }} - {{ o.description }}</option>
                </select>
                <div class="pct-input">
                  <input type="number" min="0" max="100" [(ngModel)]="link.percentage" [attr.data-testid]="'input-obj-pct-' + i" />
                  <span>%</span>
                </div>
                <button class="icon-btn danger" (click)="removeObjectiveLink(i)" [attr.data-testid]="'button-remove-obj-' + i"><span class="material-icon" style="font-size:16px;">close</span></button>
              </div>
              <div class="obj-link-footer">
                <button class="btn btn-sm" (click)="addObjectiveLink()" data-testid="button-add-obj-link">
                  <span class="material-icon" style="font-size:16px;">add</span> Link Objective
                </button>
                <span class="obj-total" [class.over-budget]="objectiveLinkTotal() > 100">
                  Total: {{ objectiveLinkTotal() }}%
                  <span *ngIf="objectiveLinkTotal() > 100" class="text-danger"> (exceeds 100%)</span>
                </span>
              </div>
            </div>

            <div class="field full"><label>Description</label><textarea [(ngModel)]="pf.description" rows="2" data-testid="input-project-desc"></textarea></div>
          </div>
          <div class="form-actions">
            <button class="btn btn-secondary" (click)="cancelProject()" data-testid="button-cancel">Cancel</button>
            <button class="btn btn-primary" (click)="saveProject()" [disabled]="objectiveLinkTotal() > 100" data-testid="button-save">{{ editingProject() ? 'Update' : 'Create' }}</button>
          </div>
        </div>
      </div>

      <div class="card" data-testid="table-projects">
        <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th><th>Name</th><th>Class</th><th>Dept</th><th>MSCOA</th><th>Objectives</th><th>Priority</th><th>Budget</th><th>KPIs</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of projects()" [class.selected]="p.id === selectedProjectId()" [attr.data-testid]="'row-project-' + p.id">
              <td>{{ p.priorityRanking }}</td>
              <td><strong class="clickable" (click)="selectProject(p)">{{ p.name }}</strong></td>
              <td><span class="class-badge" [class.capital]="p.classification==='Capital'">{{ p.classification }}</span></td>
              <td>{{ p.department }}</td>
              <td class="mscoa-cell">
                <span class="mscoa-tag" *ngIf="p.mscoaProjectSegment" title="Project Segment">{{ p.mscoaProjectSegment }}</span>
                <span class="mscoa-tag fund" *ngIf="p.mscoaFundSegment" title="Fund Segment">{{ p.mscoaFundSegment }}</span>
                <span class="mscoa-tag region" *ngIf="p.mscoaRegionSegment" title="Region Segment">{{ p.mscoaRegionSegment }}</span>
              </td>
              <td class="obj-cell">
                <div *ngFor="let link of (p.objectiveLinks || [])" class="obj-pct-row">
                  <span class="obj-code">{{ link.objective?.code || '?' }}</span>
                  <div class="obj-bar-wrap">
                    <div class="obj-bar" [style.width.%]="link.percentage"></div>
                  </div>
                  <span class="obj-pct-val">{{ link.percentage }}%</span>
                </div>
                <span *ngIf="!p.objectiveLinks?.length" class="text-muted" style="font-size:11px;">None</span>
              </td>
              <td><span class="priority-dot" [attr.data-p]="p.priority?.toLowerCase()"></span> {{ p.priority }}</td>
              <td>R{{ (p.budgetAmount || 0) | number:'1.0-0' }}</td>
              <td>
                <span class="kpi-count" [class.has-kpi]="p.indicators?.length" [class.no-kpi]="!p.indicators?.length">
                  {{ p.indicators?.length || 0 }}
                </span>
              </td>
              <td><span class="status-pill" [attr.data-status]="p.status?.toLowerCase()">{{ p.status }}</span></td>
              <td>
                <div class="action-btns">
                  <button class="icon-btn" (click)="selectProject(p)" title="KPIs" [attr.data-testid]="'button-kpis-' + p.id"><span class="material-icon" style="font-size:16px;">bar_chart</span></button>
                  <button class="icon-btn" (click)="editProject(p)" title="Edit" [attr.data-testid]="'button-edit-' + p.id"><span class="material-icon" style="font-size:16px;">edit</span></button>
                  <button class="icon-btn" (click)="deleteProject(p)" title="Delete" [attr.data-testid]="'button-delete-' + p.id"><span class="material-icon" style="font-size:16px;">delete</span></button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!projects().length"><td colspan="11" class="empty">No projects yet</td></tr>
          </tbody>
        </table>
        </div>
      </div>

      <div class="card kpi-panel" *ngIf="selectedProject() as sp" data-testid="panel-kpis">
        <div class="card-header">
          <h2>KPIs / Indicators &mdash; {{ sp.name }}</h2>
          <button class="btn btn-sm" (click)="showKpiForm.set(true)" data-testid="button-add-kpi">
            <span class="material-icon" style="font-size:16px;">add</span> Add KPI
          </button>
        </div>
        <div class="card-body">
          <div class="kpi-form" *ngIf="showKpiForm()" data-testid="form-kpi">
            <div class="form-grid">
              <div class="field full"><label>Indicator Name</label><input [(ngModel)]="kf.name" data-testid="input-kpi-name" /></div>
              <div class="field"><label>Baseline</label><input [(ngModel)]="kf.baseline" data-testid="input-kpi-baseline" /></div>
              <div class="field"><label>Target Y1</label><input [(ngModel)]="kf.targetY1" data-testid="input-kpi-y1" /></div>
              <div class="field"><label>Target Y2</label><input [(ngModel)]="kf.targetY2" data-testid="input-kpi-y2" /></div>
              <div class="field"><label>Target Y3</label><input [(ngModel)]="kf.targetY3" data-testid="input-kpi-y3" /></div>
              <div class="field"><label>Target Y4</label><input [(ngModel)]="kf.targetY4" data-testid="input-kpi-y4" /></div>
              <div class="field"><label>Target Y5</label><input [(ngModel)]="kf.targetY5" data-testid="input-kpi-y5" /></div>
              <div class="field"><label>Responsible Official</label><input [(ngModel)]="kf.responsibleOfficial" data-testid="input-kpi-official" /></div>
              <div class="field"><label>Evidence Link</label><input [(ngModel)]="kf.evidenceLink" data-testid="input-kpi-evidence" /></div>
            </div>
            <div class="form-actions">
              <button class="btn btn-secondary" (click)="showKpiForm.set(false)" data-testid="button-cancel-kpi">Cancel</button>
              <button class="btn btn-primary" (click)="saveKpi()" data-testid="button-save-kpi">Save KPI</button>
            </div>
          </div>
          <div class="table-scroll">
          <table class="data-table compact" *ngIf="indicators().length">
            <thead><tr><th>Indicator</th><th>Baseline</th><th>Y1</th><th>Y2</th><th>Y3</th><th>Y4</th><th>Y5</th><th>Official</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let i of indicators()" [attr.data-testid]="'row-kpi-' + i.id">
                <td><strong>{{ i.name }}</strong></td>
                <td>{{ i.baseline }}</td>
                <td>{{ i.targetY1 }}</td><td>{{ i.targetY2 }}</td><td>{{ i.targetY3 }}</td><td>{{ i.targetY4 }}</td><td>{{ i.targetY5 }}</td>
                <td>{{ i.responsibleOfficial }}</td>
                <td><button class="icon-btn" (click)="deleteKpi(i)" [attr.data-testid]="'button-delete-kpi-' + i.id"><span class="material-icon" style="font-size:16px;">delete</span></button></td>
              </tr>
            </tbody>
          </table>
          </div>
          <div class="empty" *ngIf="!indicators().length">
            <span class="material-icon" style="font-size:24px;color:#f59e0b;">warning</span>
            No KPIs — Draft IDP cannot be generated without project KPIs
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .kpi-validation { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; }
    .kpi-row { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
    .kpi-tile { background: white; border: 1px solid var(--platinum-border); border-radius: 10px; padding: 12px 20px; flex: 1; min-width: 100px; text-align: center; }
    .kpi-num { font-size: 20px; font-weight: 700; color: var(--platinum-text); }
    .kpi-lab { font-size: 11px; color: var(--platinum-text-muted); text-transform: uppercase; }
    app-projects .form-grid { grid-template-columns: 1fr 1fr; }
    @media(min-width:900px){ app-projects .form-grid { grid-template-columns: repeat(3,1fr); } }
    @media(max-width:600px){ app-projects .form-grid { grid-template-columns: 1fr; } }
    app-projects .form-card select, app-projects .form-card input { max-width: 100%; min-width: 0; }
    .class-badge { padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; background: #f1f5f9; color: #64748b; display: inline-block; white-space: nowrap; }
    .class-badge.capital { background: #e3f2fd; color: #1565c0; }
    .priority-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; }
    .priority-dot[data-p="critical"] { background: #b71c1c; }
    .priority-dot[data-p="high"] { background: #ef5350; }
    .priority-dot[data-p="medium"] { background: #f59e0b; }
    .priority-dot[data-p="low"] { background: #4caf50; }
    .kpi-count { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; font-size: 11px; font-weight: 700; }
    .has-kpi { background: #e8f5e9; color: #2e7d32; }
    .no-kpi { background: #ffebee; color: #c62828; }
    .kpi-form { background: var(--platinum-surface); border: 1px solid var(--platinum-border); border-radius: 8px; padding: 14px; margin-bottom: 14px; }
    .form-section-title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: var(--platinum-primary); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 8px; padding-top: 12px; border-top: 1px solid var(--platinum-border); }
    .mscoa-cell { white-space: nowrap; }
    .mscoa-tag { display: inline-block; padding: 1px 5px; border-radius: 4px; font-size: 9px; font-weight: 600; font-family: monospace; background: #f0f4ff; color: #3b5998; margin: 1px 1px; white-space: nowrap; }
    .mscoa-tag.fund { background: #f0fdf4; color: #166534; }
    .mscoa-tag.region { background: #fef3c7; color: #92400e; }
    .obj-cell { min-width: 110px; }
    .obj-pct-row { display: flex; align-items: center; gap: 4px; margin-bottom: 3px; }
    .obj-code { font-size: 9px; font-weight: 700; color: var(--platinum-primary); min-width: 34px; }
    .obj-bar-wrap { flex: 1; height: 5px; background: #e2e8f0; border-radius: 3px; overflow: hidden; min-width: 30px; }
    .obj-bar { height: 100%; background: var(--platinum-accent); border-radius: 3px; transition: width 0.3s; }
    .obj-pct-val { font-size: 9px; font-weight: 600; color: var(--platinum-text-muted); min-width: 24px; text-align: right; }
    .objective-links-section { background: var(--platinum-surface); border: 1px solid var(--platinum-border); border-radius: 8px; padding: 12px; }
    .obj-link-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
    .obj-select { flex: 1; min-width: 150px; }
    .pct-input { display: flex; align-items: center; gap: 4px; width: 80px; flex-shrink: 0; }
    .pct-input input { width: 56px; text-align: right; }
    .pct-input span { font-size: 12px; font-weight: 600; color: var(--platinum-text-muted); }
    .obj-link-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; flex-wrap: wrap; gap: 8px; }
    .obj-total { font-size: 12px; font-weight: 600; color: var(--platinum-text); }
    .obj-total.over-budget { color: #ef5350; }
    .icon-btn.danger { color: #ef5350; }
    select option.optgroup { font-weight: 700; color: var(--platinum-primary); }
    select option:disabled { color: #94a3b8; font-weight: 600; }
    app-projects .data-table { min-width: 900px; }
    app-projects .data-table th, app-projects .data-table td { padding: 10px 10px; font-size: 12px; }
    app-projects .data-table td:nth-child(2) { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  `]
})
export class ProjectsComponent implements OnInit {
  projects = signal<IdpProject[]>([]);
  objectives = signal<IdpStrategicObjective[]>([]);
  indicators = signal<IdpProjectIndicator[]>([]);
  mscoaProjectSegments = signal<MscoaSegment[]>([]);
  mscoaFundSegments = signal<MscoaSegment[]>([]);
  mscoaRegionSegments = signal<MscoaSegment[]>([]);
  selectedProjectId = signal(0);
  showForm = signal(false);
  editingProject = signal(false);
  showKpiForm = signal(false);
  kpiValidation = signal<any>(null);
  editProjectId = 0;
  objectiveLinksForm: { objectiveId: number; percentage: number }[] = [];

  pf: any = this.emptyPf();
  kf: any = { name: '', baseline: '', targetY1: '', targetY2: '', targetY3: '', targetY4: '', targetY5: '', responsibleOfficial: '', evidenceLink: '' };

  constructor(private api: ApiService, private cycleState: CycleStateService) {}

  ngOnInit() {
    this.api.getMscoaSegments('Project').subscribe(s => this.mscoaProjectSegments.set(s));
    this.api.getMscoaSegments('Fund').subscribe(s => this.mscoaFundSegments.set(s));
    this.api.getMscoaSegments('Region').subscribe(s => this.mscoaRegionSegments.set(s));
    this.cycleState.ensureActiveCycle().then(c => { if (c) this.load(c.id); });
  }

  emptyPf() {
    return { name: '', classification: 'Capital', department: '', ward: '', region: '', priority: 'High', priorityRanking: 1, budgetAmount: 0, fundingSource: '', fundingSourceSummary: '', mscoaProjectSegment: '', mscoaFundSegment: '', mscoaRegionSegment: '', startDate: '', endDate: '', latitude: null, longitude: null, objectiveId: '', description: '' };
  }

  load(cycleId: number) {
    this.api.getProjects(cycleId).subscribe(p => this.projects.set(p));
    this.api.getObjectives(cycleId).subscribe(o => this.objectives.set(o));
    this.api.validateProjectKpis(cycleId).subscribe(v => this.kpiValidation.set(v));
  }

  capitalCount() { return this.projects().filter(p => p.classification === 'Capital').length; }
  operationalCount() { return this.projects().filter(p => p.classification === 'Operational').length; }
  totalBudget() { return this.projects().reduce((s, p) => s + (p.budgetAmount || 0), 0); }

  selectedProject() { return this.projects().find(p => p.id === this.selectedProjectId()) || null; }

  objectiveLinkTotal() { return this.objectiveLinksForm.reduce((s, l) => s + (l.percentage || 0), 0); }

  addObjectiveLink() { this.objectiveLinksForm.push({ objectiveId: 0, percentage: 0 }); }
  removeObjectiveLink(i: number) { this.objectiveLinksForm.splice(i, 1); }

  selectProject(p: IdpProject) {
    this.selectedProjectId.set(p.id);
    this.api.getIndicators(p.id).subscribe(i => this.indicators.set(i));
  }

  editProject(p: IdpProject) {
    this.pf = { name: p.name, classification: p.classification, department: p.department, ward: p.ward, region: p.region, priority: p.priority, priorityRanking: p.priorityRanking, budgetAmount: p.budgetAmount, fundingSource: p.fundingSource, fundingSourceSummary: p.fundingSourceSummary, mscoaProjectSegment: p.mscoaProjectSegment || '', mscoaFundSegment: p.mscoaFundSegment || '', mscoaRegionSegment: p.mscoaRegionSegment || '', startDate: p.startDate, endDate: p.endDate, latitude: p.latitude, longitude: p.longitude, objectiveId: p.objectiveId || '', description: p.description };
    this.objectiveLinksForm = (p.objectiveLinks || []).map(l => ({ objectiveId: l.objectiveId, percentage: l.percentage }));
    this.editProjectId = p.id;
    this.editingProject.set(true);
    this.showForm.set(true);
  }

  cancelProject() {
    this.showForm.set(false);
    this.editingProject.set(false);
    this.pf = this.emptyPf();
    this.objectiveLinksForm = [];
  }

  saveProject() {
    const cycleId = this.cycleState.activeCycleId();
    const validLinks = this.objectiveLinksForm.filter(l => l.objectiveId && l.percentage > 0);

    const saveLinks = (projectId: number) => {
      this.api.setObjectiveLinks(projectId, validLinks).subscribe({
        next: () => { this.cancelProject(); this.load(cycleId); },
        error: (err: any) => {
          alert('Project saved but objective links failed: ' + (err.error || 'Unknown error'));
          this.load(cycleId);
        }
      });
    };

    if (this.editingProject()) {
      this.api.updateProject(this.editProjectId, { ...this.pf, cycleId }).subscribe({
        next: () => saveLinks(this.editProjectId),
        error: (err: any) => alert('Failed to update project: ' + (err.error || 'Unknown error'))
      });
    } else {
      this.api.createProject({ ...this.pf, cycleId, status: 'Draft' }).subscribe({
        next: (created) => {
          if (created?.id) { saveLinks(created.id); }
          else { this.cancelProject(); this.load(cycleId); }
        },
        error: (err: any) => alert('Failed to create project: ' + (err.error || 'Unknown error'))
      });
    }
  }

  deleteProject(p: IdpProject) {
    if (confirm('Delete project "' + p.name + '"?')) {
      this.api.deleteProject(p.id).subscribe(() => this.load(this.cycleState.activeCycleId()));
    }
  }

  saveKpi() {
    const sp = this.selectedProject();
    if (!sp) return;
    this.api.createIndicator({ ...this.kf, projectId: sp.id }).subscribe(() => {
      this.showKpiForm.set(false);
      this.kf = { name: '', baseline: '', targetY1: '', targetY2: '', targetY3: '', targetY4: '', targetY5: '', responsibleOfficial: '', evidenceLink: '' };
      this.selectProject(sp);
      this.load(this.cycleState.activeCycleId());
    });
  }

  deleteKpi(i: IdpProjectIndicator) {
    this.api.deleteIndicator(i.id).subscribe(() => {
      const sp = this.selectedProject();
      if (sp) this.selectProject(sp);
      this.load(this.cycleState.activeCycleId());
    });
  }
}
