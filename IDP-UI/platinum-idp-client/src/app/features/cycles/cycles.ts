import { Component, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { CycleStateService } from '../../core/services/cycle-state.service';
import { IdpCycle } from '../../core/models/idp.models';

@Component({
  selector: 'app-cycles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="page">
      <div class="page-header">
        <h1 data-testid="text-page-title">IDP Cycles</h1>
        <button class="btn btn-primary" (click)="showForm.set(true)" data-testid="button-add-cycle" *ngIf="!showForm()">
          <span class="material-icon" style="font-size:18px;">add</span> New Cycle
        </button>
      </div>

      <div class="card form-card" *ngIf="showForm()" data-testid="form-cycle">
        <div class="card-header"><h2>{{ editing() ? 'Edit' : 'New' }} IDP Cycle</h2></div>
        <div class="card-body">
          <div class="form-grid">
            <div class="field"><label>Cycle Name</label><input [(ngModel)]="form.name" placeholder="e.g. 2024/25 - 2028/29 IDP" data-testid="input-cycle-name" /></div>
            <div class="field"><label>Municipality</label><input [(ngModel)]="form.municipalityName" placeholder="Municipality name" data-testid="input-municipality" /></div>
            <div class="field"><label>Start Year</label><input type="number" [(ngModel)]="form.startYear" data-testid="input-start-year" /></div>
            <div class="field"><label>End Year</label><input type="number" [(ngModel)]="form.endYear" data-testid="input-end-year" /></div>
            <div class="field full"><label>Description</label><textarea [(ngModel)]="form.description" rows="2" data-testid="input-description"></textarea></div>
          </div>
          <div class="form-actions">
            <button class="btn btn-secondary" (click)="cancelForm()" data-testid="button-cancel">Cancel</button>
            <button class="btn btn-primary" (click)="saveCycle()" data-testid="button-save">{{ editing() ? 'Update' : 'Create' }} Cycle</button>
          </div>
        </div>
      </div>

      <div class="card" data-testid="table-cycles">
        <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Municipality</th>
              <th>Period</th>
              <th>Status</th>
              <th>Rev</th>
              <th>Locked</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of cycles()" [class.active-row]="c.id === cycleState.activeCycleId()" [attr.data-testid]="'row-cycle-' + c.id + ''">
              <td><strong>{{ c.name }}</strong></td>
              <td>{{ c.municipalityName }}</td>
              <td>{{ c.startYear }}/{{ c.startYear + 1 }} &ndash; {{ c.endYear - 1 }}/{{ c.endYear }}</td>
              <td><span class="status-pill" [attr.data-status]="statusKey(c.status)">{{ c.status }}</span></td>
              <td class="center">{{ c.revisionNumber }}</td>
              <td class="center"><span class="material-icon" [style.color]="c.isLocked ? '#ef5350' : '#e0e0e0'" style="font-size:18px;">{{ c.isLocked ? 'lock' : 'lock_open' }}</span></td>
              <td>
                <div class="action-btns">
                  <button class="icon-btn" title="Set Active" (click)="setActive(c)" [attr.data-testid]="'button-activate-' + c.id + ''"><span class="material-icon">radio_button_checked</span></button>
                  <button class="icon-btn" title="Edit" (click)="editCycle(c)" *ngIf="!c.isLocked" [attr.data-testid]="'button-edit-' + c.id + ''"><span class="material-icon">edit</span></button>
                  <button class="icon-btn" *ngIf="c.status === 'Draft'" (click)="changeStatus(c, 'In Review')" title="Submit for Review" [attr.data-testid]="'button-review-' + c.id + ''"><span class="material-icon">send</span></button>
                  <button class="icon-btn" *ngIf="c.status === 'In Review'" (click)="changeStatus(c, 'Approved for Distribution')" title="Approve for Distribution" [attr.data-testid]="'button-approve-dist-' + c.id + ''"><span class="material-icon">check_circle</span></button>
                  <button class="icon-btn" *ngIf="c.status === 'Approved for Distribution'" (click)="changeStatus(c, 'Adopted')" title="Adopt IDP" [attr.data-testid]="'button-adopt-' + c.id + ''"><span class="material-icon">verified</span></button>
                  <button class="icon-btn" *ngIf="c.status === 'Adopted'" (click)="changeStatus(c, 'Revised')" title="Start Revision" [attr.data-testid]="'button-revise-' + c.id + ''"><span class="material-icon">replay</span></button>
                </div>
              </td>
            </tr>
            <tr *ngIf="!cycles().length"><td colspan="7" class="empty">No IDP cycles found. Create one to begin.</td></tr>
          </tbody>
        </table>
        </div>
      </div>
    </div>
  `,
  styles: [``]
})
export class CyclesComponent implements OnInit {
  cycles = signal<IdpCycle[]>([]);
  showForm = signal(false);
  editing = signal(false);
  editId = 0;
  form: any = { name: '', municipalityName: '', startYear: 2024, endYear: 2029, description: '' };

  constructor(private api: ApiService, public cycleState: CycleStateService) {}

  ngOnInit() { this.load(); }

  load() {
    this.api.getCycles().subscribe(c => this.cycles.set(c));
  }

  setActive(c: IdpCycle) {
    this.cycleState.setActiveCycle(c);
  }

  editCycle(c: IdpCycle) {
    this.form = { name: c.name, municipalityName: c.municipalityName, startYear: c.startYear, endYear: c.endYear, description: c.description };
    this.editId = c.id;
    this.editing.set(true);
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.editing.set(false);
    this.form = { name: '', municipalityName: '', startYear: 2024, endYear: 2029, description: '' };
  }

  saveCycle() {
    if (this.editing()) {
      this.api.updateCycle(this.editId, this.form).subscribe(() => { this.cancelForm(); this.load(); });
    } else {
      this.api.createCycle(this.form).subscribe(() => { this.cancelForm(); this.load(); });
    }
  }

  changeStatus(c: IdpCycle, status: string) {
    this.api.updateCycleStatus(c.id, status).subscribe(() => this.load());
  }

  statusKey(s: string): string { return s.toLowerCase().replace(/\s+/g, '-'); }
}
