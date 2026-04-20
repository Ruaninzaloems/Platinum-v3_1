import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/api.service';

@Component({
  selector: 'app-plan-create',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule, MatButtonModule, MatSnackBarModule],
  template: `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <button mat-icon-button routerLink="/assets/verification/planning"><mat-icon>arrow_back</mat-icon></button>
      <div style="flex:1">
        <h1 style="font-size:22px;font-weight:700;color:#1e293b;margin:0">Create Verification Plan</h1>
        <p style="font-size:13px;color:#64748b;margin:2px 0 0">Define scope, schedule, and team for a verification exercise</p>
      </div>
    </div>

    <div class="form-container">
      <div class="section">
        <h2 class="section-title"><mat-icon>description</mat-icon> Plan Details</h2>
        <div class="form-grid">
          <div class="field-group full-width">
            <label class="field-label">Plan Name *</label>
            <input class="field-input" [(ngModel)]="form.planName" maxlength="300">
          </div>
          <div class="field-group">
            <label class="field-label">Planned Start Date</label>
            <input type="date" class="field-input" [(ngModel)]="form.plannedStartDate">
          </div>
          <div class="field-group">
            <label class="field-label">Planned End Date</label>
            <input type="date" class="field-input" [(ngModel)]="form.plannedEndDate">
          </div>
          <div class="field-group full-width">
            <label class="field-label">Scope of Work</label>
            <textarea class="field-input" [(ngModel)]="form.scopeOfWork" rows="3" maxlength="250" style="height:auto;padding-top:8px"></textarea>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title"><mat-icon>filter_alt</mat-icon> Scope Filters</h2>
        <div class="form-grid">
          <div class="field-group">
            <label class="field-label">Asset Types <span style="font-weight:400;color:#94a3b8">(Ctrl+click for multiple)</span>
              <button type="button" class="toggle-all-btn" (click)="toggleAllTypes()">{{allTypesSelected() ? 'None' : 'All'}}</button>
            </label>
            <select multiple class="field-input multi-select" [(ngModel)]="form.selectedAssetTypes">
              @for (t of assetTypes; track t.assetType_ID) {
                <option [value]="t.assetType_ID">{{t.assetTypeDesc}}</option>
              }
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">Asset Categories <span style="font-weight:400;color:#94a3b8">(Ctrl+click for multiple)</span>
              <button type="button" class="toggle-all-btn" (click)="toggleAllCategories()">{{allCategoriesSelected() ? 'None' : 'All'}}</button>
            </label>
            <select multiple class="field-input multi-select" [(ngModel)]="form.selectedCategories">
              @for (c of filteredCategories; track c.assetCategoryID) {
                <option [value]="c.assetCategoryID">{{c.assetCategoryDesc}}</option>
              }
            </select>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title"><mat-icon>location_on</mat-icon> Location Scope</h2>
        <div class="form-grid three-col">
          <div class="field-group">
            <label class="field-label">Town</label>
            <select class="field-input" [(ngModel)]="form.townId" (change)="onTownChange()">
              <option [value]="null">-- None --</option>
              @for (t of towns; track t.id) {
                <option [value]="t.id">{{t.description}}</option>
              }
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">Suburb</label>
            <select class="field-input" [(ngModel)]="form.suburbId">
              <option [value]="null">-- None --</option>
              @for (s of filteredSuburbs; track s.id) {
                <option [value]="s.id">{{s.description}}</option>
              }
            </select>
          </div>
          <div class="field-group">
            <label class="field-label">Building</label>
            <select class="field-input" [(ngModel)]="form.buildingId">
              <option [value]="null">-- None --</option>
              @for (b of buildings; track b.id) {
                <option [value]="b.id">{{b.description}}</option>
              }
            </select>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title"><mat-icon>link</mat-icon> Linked Register</h2>
        <div class="form-grid">
          <div class="field-group">
            <label class="field-label">Linked Verification Register</label>
            <select class="field-input" [(ngModel)]="form.linkedRegisterId">
              <option [value]="null">-- None --</option>
              @for (r of registers; track r.verificationRegisterId) {
                <option [value]="r.verificationRegisterId">{{r.registerName}}</option>
              }
            </select>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title"><mat-icon>group</mat-icon> Team Members</h2>
        <div class="team-table-wrap">
          <table class="team-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Employee / External Name</th>
                <th>External?</th>
                <th>Contact Number</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (tm of teamMembers; track tm._idx; let idx = $index) {
                <tr>
                  <td>
                    <select class="field-input" style="width:180px" [(ngModel)]="tm.role">
                      <option value="Team Leader">Team Leader</option>
                      <option value="Verification Officers">Verification Officers</option>
                      <option value="Support Staff">Support Staff</option>
                      <option value="Administrative Staff">Administrative Staff</option>
                    </select>
                  </td>
                  <td>
                    @if (tm.isExternal) {
                      <input class="field-input" style="width:200px" [(ngModel)]="tm.employeeName" placeholder="Full name">
                    } @else {
                      <select class="field-input" style="width:200px" [(ngModel)]="tm.employeeId" (change)="onEmployeeSelect(tm)">
                        <option [value]="null">-- Select --</option>
                        @for (e of employees; track e.employeeId) {
                          <option [value]="e.employeeId">{{e.surname}}, {{e.firstName}}</option>
                        }
                      </select>
                    }
                  </td>
                  <td style="text-align:center">
                    <input type="checkbox" [(ngModel)]="tm.isExternal" (change)="onExternalToggle(tm)">
                  </td>
                  <td>
                    <input class="field-input" style="width:150px" [(ngModel)]="tm.contactNumber" placeholder="Phone">
                  </td>
                  <td>
                    <button mat-icon-button (click)="removeTeamMember(idx)">
                      <mat-icon style="font-size:18px;color:#ef4444">close</mat-icon>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <button mat-stroked-button (click)="addTeamMember()" style="margin-top:8px">
            <mat-icon>person_add</mat-icon> Add Team Member
          </button>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:24px">
        <button mat-stroked-button routerLink="/assets/verification/planning">Cancel</button>
        <button mat-flat-button style="background:#059669;color:white;border-radius:8px" (click)="save()" [disabled]="saving">
          @if (saving) { <span>Creating...</span> } @else { <ng-container><mat-icon>save</mat-icon> Create Plan</ng-container> }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .form-container { max-width:900px; }
    .section { background:white; border:1px solid #e2e8f0; border-radius:12px; padding:24px; margin-bottom:16px; }
    .section-title {
      font-size:15px; font-weight:600; color:#1e293b; margin:0 0 16px;
      display:flex; align-items:center; gap:8px;
    }
    .section-title mat-icon { font-size:20px; width:20px; height:20px; color:#059669; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px 16px; }
    .form-grid.three-col { grid-template-columns:1fr 1fr 1fr; }
    .full-width { grid-column:1 / -1; }
    .field-group { display:flex; flex-direction:column; gap:4px; }
    .field-label { font-size:12px; font-weight:600; color:#475569; display:flex; align-items:center; gap:8px; }
    .field-input {
      height:38px; border:1px solid #cbd5e1; border-radius:6px; padding:0 10px;
      font-size:13px; color:#1e293b; background:white; width:100%; box-sizing:border-box;
    }
    .field-input:focus { outline:none; border-color:#059669; }
    .multi-select { height:100px; padding:6px 8px; }
    .toggle-all-btn {
      font-size:11px; padding:2px 8px; border:1px solid #cbd5e1; border-radius:4px;
      background:white; color:#475569; cursor:pointer; margin-left:auto;
    }
    .toggle-all-btn:hover { background:#f1f5f9; }
    .team-table-wrap { overflow-x:auto; }
    .team-table { width:100%; border-collapse:collapse; }
    .team-table th { text-align:left; font-size:12px; font-weight:600; color:#64748b; padding:8px 4px; border-bottom:1px solid #e2e8f0; }
    .team-table td { padding:4px; vertical-align:middle; }
  `]
})
export class PlanCreateComponent implements OnInit {
  form: any = {
    planName: '',
    plannedStartDate: '',
    plannedEndDate: '',
    scopeOfWork: '',
    selectedAssetTypes: [],
    selectedCategories: [],
    townId: null,
    suburbId: null,
    buildingId: null,
    linkedRegisterId: null
  };

  teamMembers: any[] = [];
  saving = false;
  _nextIdx = 1;

  assetTypes: any[] = [];
  categories: any[] = [];
  towns: any[] = [];
  suburbs: any[] = [];
  buildings: any[] = [];
  employees: any[] = [];
  registers: any[] = [];

  get filteredCategories(): any[] {
    if (!this.form.selectedAssetTypes || this.form.selectedAssetTypes.length === 0) return this.categories;
    var selected = this.form.selectedAssetTypes;
    var result: any[] = [];
    for (var i = 0; i < this.categories.length; i++) {
      if (selected.indexOf(this.categories[i].typeID) !== -1) {
        result.push(this.categories[i]);
      }
    }
    return result.length > 0 ? result : this.categories;
  }

  get filteredSuburbs(): any[] {
    if (!this.form.townId) return this.suburbs;
    var tid = this.form.townId;
    var result: any[] = [];
    for (var i = 0; i < this.suburbs.length; i++) {
      if (this.suburbs[i].townId === tid) result.push(this.suburbs[i]);
    }
    return result;
  }

  allTypesSelected(): boolean {
    return this.assetTypes.length > 0 && (this.form.selectedAssetTypes || []).length >= this.assetTypes.length;
  }

  allCategoriesSelected(): boolean {
    var cats = this.filteredCategories;
    return cats.length > 0 && (this.form.selectedCategories || []).length >= cats.length;
  }

  toggleAllTypes() {
    if (this.allTypesSelected()) {
      this.form.selectedAssetTypes = [];
    } else {
      var ids: number[] = [];
      for (var i = 0; i < this.assetTypes.length; i++) ids.push(this.assetTypes[i].assetType_ID);
      this.form.selectedAssetTypes = ids;
    }
  }

  toggleAllCategories() {
    var cats = this.filteredCategories;
    if (this.allCategoriesSelected()) {
      this.form.selectedCategories = [];
    } else {
      var ids: number[] = [];
      for (var i = 0; i < cats.length; i++) ids.push(cats[i].assetCategoryID);
      this.form.selectedCategories = ids;
    }
  }

  constructor(private api: ApiService, private router: Router, private snackBar: MatSnackBar) {}

  ngOnInit() {
    var self = this;
    forkJoin({
      assetTypes: this.api.getAssetTypes(),
      categories: this.api.getAssetCategoriesList(),
      towns: this.api.getVerificationLookupTowns(),
      suburbs: this.api.getVerificationLookupSuburbs(),
      buildings: this.api.getVerificationLookupBuildings(),
      employees: this.api.getEmployees(),
      registers: this.api.getVerificationRegisters({ isHistory: 0 })
    }).subscribe({
      next: function(data: any) {
        self.assetTypes = data.assetTypes || [];
        self.categories = data.categories || [];
        self.towns = data.towns || [];
        self.suburbs = data.suburbs || [];
        self.buildings = data.buildings || [];
        self.employees = data.employees || [];
        self.registers = data.registers || [];
      }
    });
  }

  onTownChange() {
    this.form.suburbId = null;
  }

  addTeamMember() {
    this.teamMembers.push({
      _idx: this._nextIdx++,
      role: 'Verification Officers',
      employeeId: null,
      employeeName: '',
      isExternal: false,
      contactNumber: ''
    });
  }

  removeTeamMember(idx: number) {
    this.teamMembers.splice(idx, 1);
  }

  onEmployeeSelect(tm: any) {
    if (tm.employeeId) {
      for (var i = 0; i < this.employees.length; i++) {
        if (this.employees[i].employeeId === tm.employeeId) {
          tm.employeeName = this.employees[i].surname + ', ' + this.employees[i].firstName;
          break;
        }
      }
    }
  }

  onExternalToggle(tm: any) {
    if (tm.isExternal) {
      tm.employeeId = null;
    } else {
      tm.employeeName = '';
    }
  }

  save() {
    if (!this.form.planName.trim()) {
      this.snackBar.open('Plan name is required', 'OK', { duration: 3000 });
      return;
    }
    this.saving = true;
    var self = this;
    var payload: any = {
      planName: this.form.planName,
      plannedStartDate: this.form.plannedStartDate || null,
      plannedEndDate: this.form.plannedEndDate || null,
      scopeOfWork: this.form.scopeOfWork || null,
      assetTypes: JSON.stringify(this.form.selectedAssetTypes || []),
      assetCategories: JSON.stringify(this.form.selectedCategories || []),
      townId: this.form.townId || null,
      suburbId: this.form.suburbId || null,
      buildingId: this.form.buildingId || null,
      linkedRegisterId: this.form.linkedRegisterId || null,
      teamMembers: this.teamMembers.map(function(tm: any) {
        return {
          role: tm.role,
          employeeId: tm.isExternal ? null : tm.employeeId,
          employeeName: tm.employeeName,
          isExternal: tm.isExternal ? 1 : 0,
          contactNumber: tm.contactNumber
        };
      })
    };

    this.api.createVerificationPlan(payload).subscribe({
      next: function(res: any) {
        var planId = res.verificationPlanId;
        var linkedReg = self.form.linkedRegisterId;
        if (linkedReg) {
          self.api.syncPlanTeam(linkedReg, planId).subscribe({
            next: function() { self.snackBar.open('Plan created successfully', 'OK', { duration: 3000 }); self.router.navigate(['/assets/verification/planning', planId]); },
            error: function() { self.snackBar.open('Plan created successfully', 'OK', { duration: 3000 }); self.router.navigate(['/assets/verification/planning', planId]); }
          });
        } else {
          self.snackBar.open('Plan created successfully', 'OK', { duration: 3000 });
          self.router.navigate(['/assets/verification/planning', planId]);
        }
      },
      error: function(err: any) {
        self.saving = false;
        self.snackBar.open('Error creating plan: ' + (err.error?.error || 'Unknown'), 'OK', { duration: 5000 });
      }
    });
  }
}
