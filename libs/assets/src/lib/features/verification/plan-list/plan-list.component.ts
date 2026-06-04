import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { ApiService } from '../../../core/api.service';

@Component({
  selector: 'app-plan-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatMenuModule],
  template: `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <button mat-icon-button routerLink="/assets/verification" style="margin-right:-4px"><mat-icon>arrow_back</mat-icon></button>
      <div style="flex:1">
        <h1 style="font-size:22px;font-weight:700;color:#1e293b;margin:0">Verification Plans</h1>
        <p style="font-size:13px;color:#64748b;margin:2px 0 0">Plan and schedule asset verification activities</p>
      </div>
      <button mat-flat-button color="primary" routerLink="/assets/verification/planning/create" style="background:#059669;color:white;border-radius:8px">
        <mat-icon>add</mat-icon> Create Plan
      </button>
    </div>

    <div class="filter-row">
      <button class="filter-btn" [class.active]="statusFilter === ''" (click)="filterStatus('')">All ({{plans.length}})</button>
      <button class="filter-btn" [class.active]="statusFilter === 'Draft'" (click)="filterStatus('Draft')">Draft ({{countByStatus('Draft')}})</button>
      <button class="filter-btn" [class.active]="statusFilter === 'Approved'" (click)="filterStatus('Approved')">Approved ({{countByStatus('Approved')}})</button>
      <button class="filter-btn" [class.active]="statusFilter === 'Amended'" (click)="filterStatus('Amended')">Amended ({{countByStatus('Amended')}})</button>
      <button class="filter-btn" [class.active]="statusFilter === 'Amended (Approved)'" (click)="filterStatus('Amended (Approved)')">Amended (Approved) ({{countByStatus('Amended (Approved)')}})</button>
    </div>

    @if (loading) {
      <div style="text-align:center;padding:60px;color:#64748b">Loading plans...</div>
    } @else {
      @if (displayPlans.length === 0) {
        <div class="empty-state">
          <mat-icon style="font-size:48px;width:48px;height:48px;color:#cbd5e1">event_note</mat-icon>
          <p style="margin:12px 0 0;color:#64748b">No verification plans found</p>
          <button mat-stroked-button routerLink="/assets/verification/planning/create" style="margin-top:12px">Create your first plan</button>
        </div>
      } @else {
        <div class="table-container">
          <div class="filter-inputs">
            <mat-form-field appearance="outline" class="col-filter">
              <mat-label>Search all columns</mat-label>
              <input matInput [(ngModel)]="globalFilter" (ngModelChange)="applyFilters()">
              <mat-icon matSuffix style="color:#94a3b8">search</mat-icon>
            </mat-form-field>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th></th>
                <th>Plan Name</th>
                <th>Status</th>
                <th>Version</th>
                <th>Period</th>
                <th>Location</th>
                <th>Linked Register</th>
                <th>Team</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (plan of displayPlans; track plan.verificationPlanId) {
                <tr [class.selected]="selectedPlanId === plan.verificationPlanId"
                    (click)="selectedPlanId = plan.verificationPlanId">
                  <td style="width:30px">
                    <input type="radio" name="plan-select" [checked]="selectedPlanId === plan.verificationPlanId"
                           (click)="selectedPlanId = plan.verificationPlanId">
                  </td>
                  <td class="name-cell">{{plan.planName}}</td>
                  <td><span class="status-badge" [class]="getStatusClass(plan.status)">{{plan.status}}</span></td>
                  <td>v{{plan.version}}</td>
                  <td class="date-cell">
                    @if (plan.plannedStartDate || plan.plannedEndDate) {
                      <span>{{formatDate(plan.plannedStartDate)}} — {{formatDate(plan.plannedEndDate)}}</span>
                    } @else {
                      <span class="muted">--</span>
                    }
                  </td>
                  <td>{{getLocationText(plan)}}</td>
                  <td>{{plan.linkedRegisterName || '--'}}</td>
                  <td style="text-align:center">{{plan.teamMemberCount || 0}}</td>
                  <td class="date-cell">{{formatDate(plan.dateCaptured)}}</td>
                  <td>
                    <button mat-icon-button [matMenuTriggerFor]="actionMenu" (click)="$event.stopPropagation()">
                      <mat-icon>more_vert</mat-icon>
                    </button>
                    <mat-menu #actionMenu="matMenu">
                      <button mat-menu-item (click)="openPlan(plan.verificationPlanId)">
                        <mat-icon>visibility</mat-icon> <span>View</span>
                      </button>
                      <button mat-menu-item (click)="exportPlan(plan)">
                        <mat-icon>print</mat-icon> <span>Export</span>
                      </button>
                      <button mat-menu-item (click)="exportTemplate(plan)">
                        <mat-icon>file_download</mat-icon> <span>Export Template</span>
                      </button>
                      @if (plan.dashboardUrl) {
                        <button mat-menu-item (click)="openDashboard(plan)">
                          <mat-icon>open_in_new</mat-icon> <span>Progress Dashboard</span>
                        </button>
                      }
                      @if (plan.status === 'Draft') {
                        <button mat-menu-item (click)="deletePlan(plan)" style="color:#ef4444">
                          <mat-icon style="color:#ef4444">delete</mat-icon> <span>Delete</span>
                        </button>
                      }
                    </mat-menu>
                  </td>
                </tr>
                @if (selectedPlanId === plan.verificationPlanId && planAudit.length > 0) {
                  <tr class="audit-row">
                    <td colspan="10">
                      <div class="audit-accordion">
                        <h4 style="margin:0 0 8px;font-size:12px;font-weight:600;color:#64748b">Recent Audit Trail</h4>
                        @for (a of planAudit; track a.auditTrailId) {
                          <div class="audit-entry">
                            <span class="audit-date">{{formatDateTime(a.changedAt)}}</span>
                            <span class="audit-user">{{a.changedByName}}</span>
                            <span class="audit-summary">v{{a.version}} — {{formatChanges(a.changesSummary)}}</span>
                          </div>
                        }
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      }
    }
  `,
  styles: [`
    .filter-row { display:flex; gap:4px; margin-bottom:16px; background:#f1f5f9; padding:4px; border-radius:10px; width:fit-content; flex-wrap:wrap; }
    .filter-btn {
      padding:8px 16px; border:none; background:transparent; border-radius:8px;
      font-size:13px; font-weight:500; color:#64748b; cursor:pointer; transition:all 0.15s; white-space:nowrap;
    }
    .filter-btn.active { background:white; color:#1e293b; font-weight:600; box-shadow:0 1px 3px rgba(0,0,0,0.1); }
    .empty-state { text-align:center; padding:80px 20px; background:white; border-radius:12px; border:1px solid #e2e8f0; }
    .table-container { background:white; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; }
    .filter-inputs { display:flex; gap:12px; padding:16px 16px 0; }
    .col-filter { width:220px; }
    ::ng-deep .col-filter .mat-mdc-form-field-subscript-wrapper { display:none; }
    .data-table { width:100%; border-collapse:collapse; }
    .data-table th { text-align:left; font-size:12px; font-weight:600; color:#64748b; padding:10px 10px; border-bottom:2px solid #e2e8f0; white-space:nowrap; }
    .data-table td { padding:10px 10px; font-size:13px; color:#1e293b; border-bottom:1px solid #f1f5f9; }
    .data-table tbody tr { cursor:pointer; transition:background 0.1s; }
    .data-table tbody tr:hover { background:#f8fafc; }
    .data-table tbody tr.selected { background:#ecfdf5; }
    .name-cell { font-weight:500; max-width:260px; word-break:break-word; }
    .date-cell { white-space:nowrap; font-size:12px; }
    .muted { color:#94a3b8; }
    .status-badge { font-size:11px; font-weight:600; padding:3px 10px; border-radius:6px; white-space:nowrap; }
    .status-badge.draft { background:#f1f5f9; color:#64748b; }
    .status-badge.approved { background:#dcfce7; color:#166534; }
    .status-badge.amended { background:#fef3c7; color:#92400e; }
    .status-badge.amended-approved { background:#dbeafe; color:#1d4ed8; }
    .audit-row td { padding:0 10px 12px 40px; background:#f8fafc; border-bottom:2px solid #e2e8f0; }
    .audit-accordion { padding:12px 0 0; }
    .audit-entry { display:flex; gap:12px; padding:4px 0; font-size:12px; align-items:baseline; }
    .audit-date { color:#94a3b8; min-width:130px; }
    .audit-user { color:#64748b; min-width:100px; font-weight:500; }
    .audit-summary { color:#1e293b; }
  `]
})
export class PlanListComponent implements OnInit {
  loading = true;
  plans: any[] = [];
  displayPlans: any[] = [];
  statusFilter = '';
  globalFilter = '';
  selectedPlanId: number | null = null;
  planAudit: any[] = [];

  private _prevSelectedId: number | null = null;

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.loadPlans();
  }

  ngDoCheck() {
    if (this.selectedPlanId !== this._prevSelectedId) {
      this._prevSelectedId = this.selectedPlanId;
      if (this.selectedPlanId) {
        this.loadPlanAudit(this.selectedPlanId);
      } else {
        this.planAudit = [];
      }
    }
  }

  loadPlanAudit(planId: number) {
    var self = this;
    this.api.getVerificationPlanAuditTrail(planId).subscribe({
      next: function(data: any[]) { self.planAudit = data; },
      error: function() { self.planAudit = []; }
    });
  }

  loadPlans() {
    this.loading = true;
    this.api.getVerificationPlans().subscribe({
      next: function(this: PlanListComponent, data: any[]) {
        this.plans = data;
        this.applyFilters();
        this.loading = false;
      }.bind(this),
      error: function(this: PlanListComponent) { this.loading = false; }.bind(this)
    });
  }

  filterStatus(s: string) {
    this.statusFilter = s;
    this.applyFilters();
  }

  applyFilters() {
    var result: any[] = [];
    var searchLower = (this.globalFilter || '').toLowerCase();
    for (var i = 0; i < this.plans.length; i++) {
      var p = this.plans[i];
      if (this.statusFilter && p.status !== this.statusFilter) continue;
      if (searchLower) {
        var searchable = [
          p.planName || '',
          p.status || '',
          'v' + (p.version || ''),
          this.formatDate(p.plannedStartDate),
          this.formatDate(p.plannedEndDate),
          this.getLocationText(p),
          p.linkedRegisterName || '',
          this.formatDate(p.dateCaptured)
        ].join(' ').toLowerCase();
        if (searchable.indexOf(searchLower) === -1) continue;
      }
      result.push(p);
    }
    this.displayPlans = result;
  }

  countByStatus(s: string): number {
    var c = 0;
    for (var i = 0; i < this.plans.length; i++) { if (this.plans[i].status === s) c++; }
    return c;
  }

  getStatusClass(status: string): string {
    if (status === 'Draft') return 'draft';
    if (status === 'Approved') return 'approved';
    if (status === 'Amended') return 'amended';
    if (status === 'Amended (Approved)') return 'amended-approved';
    return 'draft';
  }

  getLocationText(plan: any): string {
    var parts: string[] = [];
    if (plan.townDesc) parts.push(plan.townDesc);
    if (plan.suburbDesc) parts.push(plan.suburbDesc);
    if (plan.buildingDesc) parts.push(plan.buildingDesc);
    return parts.length > 0 ? parts.join(', ') : '--';
  }

  openPlan(id: number) {
    this.router.navigate(['/assets/verification/planning', id]);
  }

  exportPlan(plan: any) {
    var self = this;
    this.api.getVerificationPlanExport(plan.verificationPlanId).subscribe({
      next: function(data: any) {
        self.printExportHtml(data);
      }
    });
  }

  exportTemplate(plan: any) {
    var self = this;
    this.api.getVerificationPlanExport(plan.verificationPlanId).subscribe({
      next: function(data: any) {
        self.downloadTemplateCsv(data);
      }
    });
  }

  downloadTemplateCsv(data: any) {
    var csv = 'Plan Name,Planned Start Date,Planned End Date,Scope of Work,Asset Types,Asset Categories,Town,Suburb,Building,Linked Register,Dashboard URL\n';
    csv += '"","","","","","","","","","",""\n';
    csv += '\nTeam Members\nRole,Name,Type (Internal/External),Contact Number\n';
    csv += '"Team Leader","","Internal",""\n';
    csv += '"Verification Officers","","Internal",""\n';
    csv += '"Support Staff","","Internal",""\n';
    csv += '"Administrative Staff","","Internal",""\n';
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'VerificationPlan_Template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  openDashboard(plan: any) {
    if (plan.dashboardUrl) {
      window.open(plan.dashboardUrl, '_blank');
    }
  }

  deletePlan(plan: any) {
    if (!confirm('Delete plan "' + plan.planName + '"? This cannot be undone.')) return;
    this.api.deleteVerificationPlan(plan.verificationPlanId).subscribe({
      next: function(this: PlanListComponent) { this.loadPlans(); }.bind(this)
    });
  }

  printExportHtml(data: any) {
    var p = data.plan;
    var team = data.teamMembers || [];
    var approvals = data.approvals || [];
    var html = '<html><head><title>Verification Plan - ' + p.planName + '</title>';
    html += '<style>body{font-family:Arial,sans-serif;padding:40px;color:#333}h1{font-size:22px}h2{font-size:16px;border-bottom:1px solid #ccc;padding-bottom:4px;margin-top:24px}';
    html += 'table{width:100%;border-collapse:collapse;margin:12px 0}th,td{text-align:left;padding:6px 10px;border:1px solid #ddd;font-size:13px}th{background:#f5f5f5;font-weight:600}';
    html += '.label{font-weight:600;color:#555;width:180px}</style></head><body>';
    html += '<h1>Verification Plan: ' + p.planName + '</h1>';
    html += '<p>Status: <b>' + p.status + '</b> &middot; Version ' + p.version + ' &middot; Created: ' + this.formatDate(p.dateCaptured) + '</p>';
    html += '<h2>Plan Details</h2><table>';
    html += '<tr><td class="label">Start Date</td><td>' + this.formatDate(p.plannedStartDate) + '</td></tr>';
    html += '<tr><td class="label">End Date</td><td>' + this.formatDate(p.plannedEndDate) + '</td></tr>';
    html += '<tr><td class="label">Scope of Work</td><td>' + (p.scopeOfWork || '--') + '</td></tr>';
    var typeNames = '--';
    var catNames = '--';
    try {
      var typesArr = typeof p.assetTypes === 'string' ? JSON.parse(p.assetTypes) : (p.assetTypes || []);
      if (typesArr.length > 0) typeNames = typesArr.join(', ');
    } catch(e) { typeNames = '--'; }
    try {
      var catsArr = typeof p.assetCategories === 'string' ? JSON.parse(p.assetCategories) : (p.assetCategories || []);
      if (catsArr.length > 0) catNames = catsArr.join(', ');
    } catch(e) { catNames = '--'; }
    html += '<tr><td class="label">Asset Types</td><td>' + typeNames + '</td></tr>';
    html += '<tr><td class="label">Asset Categories</td><td>' + catNames + '</td></tr>';
    html += '<tr><td class="label">Town</td><td>' + (p.townDesc || '--') + '</td></tr>';
    html += '<tr><td class="label">Suburb</td><td>' + (p.suburbDesc || '--') + '</td></tr>';
    html += '<tr><td class="label">Building</td><td>' + (p.buildingDesc || '--') + '</td></tr>';
    html += '<tr><td class="label">Linked Register</td><td>' + (p.linkedRegisterName || '--') + '</td></tr>';
    html += '<tr><td class="label">Dashboard URL</td><td>' + (p.dashboardUrl || '--') + '</td></tr>';
    html += '</table>';
    html += '<h2>Team Members</h2>';
    if (team.length > 0) {
      html += '<table><tr><th>Role</th><th>Name</th><th>Type</th><th>Contact</th></tr>';
      for (var i = 0; i < team.length; i++) {
        var t = team[i];
        html += '<tr><td>' + (t.Role || '') + '</td><td>' + (t.FullName || t.EmployeeName || '') + '</td><td>' + (t.IsExternal ? 'External' : 'Internal') + '</td><td>' + (t.ContactNumber || '--') + '</td></tr>';
      }
      html += '</table>';
    } else {
      html += '<p>No team members assigned</p>';
    }
    html += '<h2>Approvals</h2>';
    if (approvals.length > 0) {
      html += '<table><tr><th>Version</th><th>Approved By</th><th>Date</th><th>Type</th></tr>';
      for (var j = 0; j < approvals.length; j++) {
        var a = approvals[j];
        html += '<tr><td>v' + (a.Version || '') + '</td><td>' + (a.ApprovedByName || '') + '</td><td>' + this.formatDate(a.ApprovalDate) + '</td><td>' + (a.IsExternal ? 'External' : 'Internal') + '</td></tr>';
      }
      html += '</table>';
    } else {
      html += '<p>No approvals yet</p>';
    }
    html += '</body></html>';
    var w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.print();
    }
  }

  formatDate(d: string): string {
    if (!d) return '--';
    var date = new Date(d);
    return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  formatDateTime(d: string): string {
    if (!d) return '--';
    var date = new Date(d);
    return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' }) + ' ' +
           date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  }

  formatChanges(summary: any): string {
    if (!summary) return 'Plan updated';
    if (typeof summary === 'string') {
      try { summary = JSON.parse(summary); } catch (e) { return summary; }
    }
    var parts: string[] = [];
    var keys = Object.keys(summary);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var v = summary[k];
      if (v && typeof v === 'object' && v.from !== undefined) {
        parts.push(k + ': ' + v.from + ' \u2192 ' + v.to);
      } else {
        parts.push(k + ': ' + JSON.stringify(v));
      }
    }
    return parts.join('; ') || 'Plan updated';
  }
}
