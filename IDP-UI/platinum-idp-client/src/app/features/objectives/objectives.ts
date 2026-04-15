import { Component, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { CycleStateService } from '../../core/services/cycle-state.service';
import { IdpStrategicObjective } from '../../core/models/idp.models';

@Component({
  selector: 'app-objectives',
  standalone: true,
  imports: [CommonModule, FormsModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="page">
      <div class="page-header">
        <h1 data-testid="text-page-title">Strategic Objectives</h1>
        <button class="btn btn-primary" (click)="showForm.set(true)" *ngIf="!showForm()" data-testid="button-add-objective">
          <span class="material-icon" style="font-size:18px;">add</span> Add Objective
        </button>
      </div>

      <div class="card form-card" *ngIf="showForm()" data-testid="form-objective">
        <div class="card-header"><h2>{{ editing() ? 'Edit' : 'New' }} Strategic Objective</h2></div>
        <div class="card-body">
          <div class="form-grid">
            <div class="field"><label>Code</label><input [(ngModel)]="form.code" placeholder="e.g. SO1" data-testid="input-obj-code" /></div>
            <div class="field"><label>NDP Alignment</label><input [(ngModel)]="form.ndpAlignment" placeholder="e.g. NDP Chapter 4" data-testid="input-obj-ndp" /></div>
            <div class="field full"><label>Description</label><textarea [(ngModel)]="form.description" rows="2" data-testid="input-obj-desc"></textarea></div>
            <div class="field"><label>Alignment Tags</label><input [(ngModel)]="form.alignmentTags" placeholder="NDP, PGDS, District" data-testid="input-obj-tags" /></div>
            <div class="field"><label>Provincial Alignment</label><input [(ngModel)]="form.provincialAlignment" placeholder="e.g. PGDS Priority 1" data-testid="input-obj-provincial" /></div>
          </div>
          <div class="form-actions">
            <button class="btn btn-secondary" (click)="cancelForm()" data-testid="button-cancel">Cancel</button>
            <button class="btn btn-primary" (click)="save()" data-testid="button-save">{{ editing() ? 'Update' : 'Create' }}</button>
          </div>
        </div>
      </div>

      <div class="objectives-grid">
        <div class="obj-card" *ngFor="let o of objectives()" [attr.data-testid]="'card-objective-' + o.id + ''">
          <div class="obj-header">
            <div class="obj-code">{{ o.code }}</div>
            <button class="icon-btn" (click)="edit(o)" [attr.data-testid]="'button-edit-' + o.id + ''"><span class="material-icon" style="font-size:16px;">edit</span></button>
          </div>
          <p class="obj-desc">{{ o.description }}</p>
          <div class="obj-tags">
            <span class="tag" *ngIf="o.ndpAlignment">{{ o.ndpAlignment }}</span>
            <span class="tag" *ngIf="o.provincialAlignment">{{ o.provincialAlignment }}</span>
            <span class="tag" *ngFor="let t of splitTags(o.alignmentTags)">{{ t }}</span>
          </div>
          <div class="obj-projects" *ngIf="o.projects?.length">
            <div class="projects-label"><span class="material-icon" style="font-size:14px;">folder_open</span> {{ o.projects!.length }} linked project{{ o.projects!.length > 1 ? 's' : '' }}</div>
            <div class="project-chip" *ngFor="let p of o.projects!.slice(0,3)">{{ p.name }}</div>
            <span class="more" *ngIf="o.projects!.length > 3">+{{ o.projects!.length - 3 }} more</span>
          </div>
          <div class="obj-projects" *ngIf="!o.projects?.length">
            <div class="projects-label empty-label"><span class="material-icon" style="font-size:14px;color:#f59e0b;">warning</span> No projects linked</div>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="!objectives().length" data-testid="empty-objectives">
        <span class="material-icon" style="font-size:48px;color:#e2e8f0;">flag</span>
        <p>No strategic objectives yet</p>
      </div>
    </div>
  `,
  styles: [`
    .objectives-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
    .obj-card { background: white; border: 1px solid var(--platinum-border); border-radius: var(--platinum-card-radius); padding: 20px; transition: box-shadow .15s; box-shadow: var(--platinum-card-shadow); }
    .obj-card:hover { box-shadow: var(--platinum-card-shadow-hover); }
    .obj-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .obj-code { font-size: 18px; font-weight: 700; color: var(--platinum-primary); }
    .obj-desc { font-size: 14px; color: var(--platinum-text); margin-bottom: 12px; line-height: 1.5; }
    .obj-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
    .tag { padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 500; background: var(--platinum-indigo-light); color: #283593; }
    .obj-projects { border-top: 1px solid var(--platinum-border-light); padding-top: 12px; }
    .projects-label { font-size: 12px; color: var(--platinum-text-muted); display: flex; align-items: center; gap: 4px; margin-bottom: 6px; }
    .empty-label { color: var(--platinum-warning); }
    .project-chip { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 11px; background: #f0f7ff; color: #1565c0; margin-right: 4px; margin-bottom: 4px; }
    .more { font-size: 11px; color: var(--platinum-text-muted); }
    .empty-state { text-align: center; padding: 60px; color: var(--platinum-text-muted); }
    .empty-state p { margin-top: 12px; }
  `]
})
export class ObjectivesComponent implements OnInit {
  objectives = signal<IdpStrategicObjective[]>([]);
  showForm = signal(false);
  editing = signal(false);
  editId = 0;
  form: any = { code: '', description: '', alignmentTags: '', ndpAlignment: '', provincialAlignment: '' };

  constructor(private api: ApiService, private cycleState: CycleStateService) {}

  ngOnInit() {
    this.cycleState.ensureActiveCycle().then(c => { if (c) this.load(c.id); });
  }

  load(cycleId: number) {
    this.api.getObjectives(cycleId).subscribe(o => this.objectives.set(o));
  }

  splitTags(tags?: string): string[] {
    return tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [];
  }

  edit(o: IdpStrategicObjective) {
    this.form = { code: o.code, description: o.description, alignmentTags: o.alignmentTags, ndpAlignment: o.ndpAlignment, provincialAlignment: o.provincialAlignment };
    this.editId = o.id;
    this.editing.set(true);
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.editing.set(false);
    this.form = { code: '', description: '', alignmentTags: '', ndpAlignment: '', provincialAlignment: '' };
  }

  save() {
    const cycleId = this.cycleState.activeCycleId();
    if (this.editing()) {
      this.api.updateObjective(this.editId, this.form).subscribe(() => { this.cancelForm(); this.load(cycleId); });
    } else {
      this.api.createObjective({ ...this.form, cycleId }).subscribe(() => { this.cancelForm(); this.load(cycleId); });
    }
  }
}
