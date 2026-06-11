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
            <div class="field"><label>MTSF Alignment</label>
              <select [(ngModel)]="form.mtsfAlignment" data-testid="select-obj-mtsf">
                <option value="">-- Select MTSF Outcome --</option>
                <optgroup label="MTSF 2019-2024 Outcomes">
                  <option value="01 - Quality basic education">01 - Quality basic education</option>
                  <option value="02 - A long and healthy life for all South Africans">02 - A long and healthy life for all South Africans</option>
                  <option value="03 - All people in South Africa are and feel safe">03 - All people in South Africa are and feel safe</option>
                  <option value="04 - Decent employment through inclusive growth">04 - Decent employment through inclusive growth</option>
                  <option value="05 - A skilled and capable workforce to support an inclusive growth path">05 - A skilled and capable workforce to support an inclusive growth path</option>
                  <option value="06 - An efficient, competitive and responsive economic infrastructure network">06 - An efficient, competitive and responsive economic infrastructure network</option>
                  <option value="07 - Vibrant, equitable, sustainable rural communities contributing towards food security for all">07 - Vibrant, equitable, sustainable rural communities contributing towards food security for all</option>
                  <option value="08 - Sustainable human settlements and improved quality of household life">08 - Sustainable human settlements and improved quality of household life</option>
                  <option value="09 - Responsive, accountable, effective and efficient local government">09 - Responsive, accountable, effective and efficient local government</option>
                  <option value="10 - Protect and enhance our environmental assets and natural resources">10 - Protect and enhance our environmental assets and natural resources</option>
                  <option value="11 - Create a better South Africa and contribute to a better Africa and a better world">11 - Create a better South Africa and contribute to a better Africa and a better world</option>
                  <option value="12 - An efficient, effective and development-oriented public service">12 - An efficient, effective and development-oriented public service</option>
                  <option value="13 - A comprehensive, responsive and sustainable social protection system">13 - A comprehensive, responsive and sustainable social protection system</option>
                  <option value="14 - A diverse, socially cohesive society with a common national identity">14 - A diverse, socially cohesive society with a common national identity</option>
                </optgroup>
                <optgroup label="Priority 1: Drive Inclusive Economic Growth and Job Creation">
                  <option value="20 - Increased employment and work opportunities">20 - Increased employment and work opportunities</option>
                  <option value="21 - Accelerated growth of strategic industrial and labour-intensive sectors">21 - Accelerated growth of strategic industrial and labour-intensive sectors</option>
                  <option value="22 - Enabling environment for investment and improved competitiveness">22 - Enabling environment for investment and improved competitiveness</option>
                  <option value="23 - Increased infrastructure investment, access, and efficiency">23 - Increased infrastructure investment, access, and efficiency</option>
                  <option value="24 - Improved energy security and a just energy transition">24 - Improved energy security and a just energy transition</option>
                  <option value="25 - Increased trade and investment">25 - Increased trade and investment</option>
                  <option value="26 - A dynamic science, technology, and innovation ecosystem for growth">26 - A dynamic science, technology, and innovation ecosystem for growth</option>
                  <option value="27 - Supportive and sustainable economic policy environment">27 - Supportive and sustainable economic policy environment</option>
                  <option value="28 - Economic transformation and equitable inclusion of women, youth, and persons with disabilities">28 - Economic transformation and equitable inclusion of women, youth, and persons with disabilities</option>
                </optgroup>
                <optgroup label="Priority 2: Reduce Poverty and Tackle the High Cost of Living">
                  <option value="30 - Reduced poverty and improved livelihoods">30 - Reduced poverty and improved livelihoods</option>
                  <option value="31 - Improved coverage of social protection">31 - Improved coverage of social protection</option>
                  <option value="32 - Improved access to affordable and quality healthcare">32 - Improved access to affordable and quality healthcare</option>
                  <option value="33 - Improved education outcomes and skills">33 - Improved education outcomes and skills</option>
                  <option value="34 - Skills for the economy">34 - Skills for the economy</option>
                  <option value="35 - Social cohesion and nation-building">35 - Social cohesion and nation-building</option>
                </optgroup>
                <optgroup label="Priority 3: Build a Capable, Ethical, and Developmental State">
                  <option value="40 - Improved service delivery in the local government sphere">40 - Improved service delivery in the local government sphere</option>
                  <option value="41 - Improved governance and performance of public entities">41 - Improved governance and performance of public entities</option>
                  <option value="42 - An ethical, capable, and professional public service">42 - An ethical, capable, and professional public service</option>
                  <option value="43 - Digital transformation across the state">43 - Digital transformation across the state</option>
                  <option value="44 - Mainstreaming of gender, youth, and disability empowerment">44 - Mainstreaming of gender, youth, and disability empowerment</option>
                  <option value="45 - A reformed, integrated, and modernised criminal justice system">45 - A reformed, integrated, and modernised criminal justice system</option>
                  <option value="46 - Effective border security">46 - Effective border security</option>
                  <option value="47 - Secured cyber space">47 - Secured cyber space</option>
                  <option value="48 - Increased safety for women and children in communities">48 - Increased safety for women and children in communities</option>
                  <option value="49 - Combatting priority offences (economic, organised crime, and corruption)">49 - Combatting priority offences (economic, organised crime, and corruption)</option>
                  <option value="50 - Advancing South African foreign policy">50 - Advancing South African foreign policy</option>
                  <option value="51 - Enhanced peace and security in Africa">51 - Enhanced peace and security in Africa</option>
                </optgroup>
              </select>
            </div>
            <div class="field"><label>IUDF Alignment</label>
              <select [(ngModel)]="form.iudfAlignment" data-testid="select-obj-iudf">
                <option value="">-- Select IUDF Lever --</option>
                <option value="01 - Spatial integration">01 - Spatial integration</option>
                <option value="02 - Inclusion and access">02 - Inclusion and access</option>
                <option value="03 - Growth">03 - Growth</option>
                <option value="04 - Governance">04 - Governance</option>
              </select>
            </div>
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
            <span class="tag tag-mtsf" *ngIf="o.mtsfAlignment">{{ o.mtsfAlignment }}</span>
            <span class="tag tag-iudf" *ngIf="o.iudfAlignment">{{ o.iudfAlignment }}</span>
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
    .tag-mtsf { background: #e8f5e9; color: #2e7d32; }
    .tag-iudf { background: #fff3e0; color: #e65100; }
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
  form: any = { code: '', description: '', alignmentTags: '', ndpAlignment: '', provincialAlignment: '', mtsfAlignment: '', iudfAlignment: '' };

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
    this.form = { code: o.code, description: o.description, alignmentTags: o.alignmentTags, ndpAlignment: o.ndpAlignment, provincialAlignment: o.provincialAlignment, mtsfAlignment: o.mtsfAlignment || '', iudfAlignment: o.iudfAlignment || '' };
    this.editId = o.id;
    this.editing.set(true);
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.editing.set(false);
    this.form = { code: '', description: '', alignmentTags: '', ndpAlignment: '', provincialAlignment: '', mtsfAlignment: '', iudfAlignment: '' };
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
