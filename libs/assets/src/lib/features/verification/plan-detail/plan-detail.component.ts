import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/api.service';
import { HasUnsavedChanges } from '../../../core/unsaved-changes.guard';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-plan-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule, MatButtonModule, MatSnackBarModule, BaseChartDirective],
  template: `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <button mat-icon-button routerLink="/assets/verification/planning"><mat-icon>arrow_back</mat-icon></button>
      <div style="flex:1">
        <h1 style="font-size:20px;font-weight:700;color:#1e293b;margin:0">{{plan?.planName || 'Loading...'}}</h1>
        <p style="font-size:13px;color:#64748b;margin:2px 0 0">
          @if (plan) {
            <span class="status-badge" [class]="getStatusClass(plan.status)">{{plan.status}}</span>
            <span style="margin-left:8px">&middot; Version {{plan.version}}</span>
          }
        </p>
      </div>
      @if (plan && (plan.status === 'Draft' || plan.status === 'Amended')) {
        <button mat-flat-button style="background:#059669;color:white;border-radius:8px" (click)="showApproveDialog = true">
          <mat-icon>check_circle</mat-icon> Approve
        </button>
      }
    </div>

    <div class="tab-bar">
      <button class="tab" [class.active]="activeTab === 'details'" (click)="activeTab = 'details'">
        <mat-icon>description</mat-icon> Details
      </button>
      <button class="tab" [class.active]="activeTab === 'team'" (click)="activeTab = 'team'; loadTeam()">
        <mat-icon>group</mat-icon> Team ({{teamMembers.length}})
      </button>
      <button class="tab" [class.active]="activeTab === 'approvals'" (click)="activeTab = 'approvals'; loadApprovals()">
        <mat-icon>verified</mat-icon> Approvals ({{approvals.length}})
      </button>
      <button class="tab" [class.active]="activeTab === 'attachments'" (click)="activeTab = 'attachments'; loadAttachments()">
        <mat-icon>attach_file</mat-icon> Attachments ({{attachments.length}})
      </button>
      <button class="tab" [class.active]="activeTab === 'dashboard'" (click)="activeTab = 'dashboard'; loadDashboardStats()">
        <mat-icon>bar_chart</mat-icon> Dashboard
      </button>
      <button class="tab" [class.active]="activeTab === 'audit'" (click)="activeTab = 'audit'; loadAudit()">
        <mat-icon>history</mat-icon> Audit Trail
      </button>
    </div>

    @if (loading) {
      <div style="text-align:center;padding:60px;color:#64748b">Loading...</div>
    } @else if (plan) {
      @if (activeTab === 'details') {
        <div class="detail-container">
          <div class="section">
            <div class="section-header">
              <h2 class="section-title"><mat-icon>description</mat-icon> Plan Details</h2>
              @if (!editing) {
                <button mat-stroked-button (click)="startEditing()" style="font-size:13px">
                  <mat-icon>edit</mat-icon> Amend
                </button>
              }
            </div>
            @if (!editing) {
              <div class="detail-grid">
                <div class="detail-item"><label>Plan Name</label><span>{{plan.planName}}</span></div>
                <div class="detail-item"><label>Start Date</label><span>{{formatDate(plan.plannedStartDate)}}</span></div>
                <div class="detail-item"><label>End Date</label><span>{{formatDate(plan.plannedEndDate)}}</span></div>
                <div class="detail-item full"><label>Scope of Work</label><span>{{plan.scopeOfWork || '--'}}</span></div>
                <div class="detail-item full"><label>Asset Types</label><span>{{formatJsonArray(plan.assetTypes, assetTypes, 'assetType_ID', 'assetTypeDesc')}}</span></div>
                <div class="detail-item full"><label>Asset Categories</label><span>{{formatJsonArray(plan.assetCategories, categories, 'assetCategoryID', 'assetCategoryDesc')}}</span></div>
                <div class="detail-item"><label>Town</label><span>{{plan.townDesc || '--'}}</span></div>
                <div class="detail-item"><label>Suburb</label><span>{{plan.suburbDesc || '--'}}</span></div>
                <div class="detail-item"><label>Building</label><span>{{plan.buildingDesc || '--'}}</span></div>
                <div class="detail-item"><label>Linked Register</label><span>{{plan.linkedRegisterName || '--'}}</span></div>
              </div>
            } @else {
              <div class="form-grid">
                <div class="field-group full-width">
                  <label class="field-label">Plan Name *</label>
                  <input class="field-input" [(ngModel)]="editForm.planName" maxlength="300">
                </div>
                <div class="field-group">
                  <label class="field-label">Start Date</label>
                  <input type="date" class="field-input" [(ngModel)]="editForm.plannedStartDate">
                </div>
                <div class="field-group">
                  <label class="field-label">End Date</label>
                  <input type="date" class="field-input" [(ngModel)]="editForm.plannedEndDate">
                </div>
                <div class="field-group full-width">
                  <label class="field-label">Scope of Work</label>
                  <textarea class="field-input" [(ngModel)]="editForm.scopeOfWork" rows="3" maxlength="250" style="height:auto;padding-top:8px"></textarea>
                </div>
                <div class="field-group">
                  <label class="field-label">Asset Types <span style="font-weight:400;color:#94a3b8">(Ctrl+click for multiple)</span>
                    <button type="button" class="toggle-all-btn" (click)="toggleAllTypes()">{{allTypesSelected() ? 'None' : 'All'}}</button>
                  </label>
                  <select multiple class="field-input multi-select" [(ngModel)]="editForm.selectedAssetTypes">
                    @for (t of assetTypes; track t.assetType_ID) {
                      <option [value]="t.assetType_ID">{{t.assetTypeDesc}}</option>
                    }
                  </select>
                </div>
                <div class="field-group">
                  <label class="field-label">Asset Categories <span style="font-weight:400;color:#94a3b8">(Ctrl+click for multiple)</span>
                    <button type="button" class="toggle-all-btn" (click)="toggleAllCategories()">{{allCategoriesSelected() ? 'None' : 'All'}}</button>
                  </label>
                  <select multiple class="field-input multi-select" [(ngModel)]="editForm.selectedCategories">
                    @for (c of editFilteredCategories; track c.assetCategoryID) {
                      <option [value]="c.assetCategoryID">{{c.assetCategoryDesc}}</option>
                    }
                  </select>
                </div>
                <div class="field-group">
                  <label class="field-label">Town</label>
                  <select class="field-input" [(ngModel)]="editForm.townId" (change)="onEditTownChange()">
                    <option [value]="null">-- None --</option>
                    @for (t of towns; track t.id) {
                      <option [value]="t.id">{{t.description}}</option>
                    }
                  </select>
                </div>
                <div class="field-group">
                  <label class="field-label">Suburb</label>
                  <select class="field-input" [(ngModel)]="editForm.suburbId">
                    <option [value]="null">-- None --</option>
                    @for (s of editFilteredSuburbs; track s.id) {
                      <option [value]="s.id">{{s.description}}</option>
                    }
                  </select>
                </div>
                <div class="field-group">
                  <label class="field-label">Building</label>
                  <select class="field-input" [(ngModel)]="editForm.buildingId">
                    <option [value]="null">-- None --</option>
                    @for (b of buildings; track b.id) {
                      <option [value]="b.id">{{b.description}}</option>
                    }
                  </select>
                </div>
                <div class="field-group">
                  <label class="field-label">Linked Register</label>
                  <select class="field-input" [(ngModel)]="editForm.linkedRegisterId">
                    <option [value]="null">-- None --</option>
                    @for (r of registers; track r.verificationRegisterId) {
                      <option [value]="r.verificationRegisterId">{{r.registerName}}</option>
                    }
                  </select>
                </div>
              </div>
              <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px">
                <button mat-stroked-button (click)="editing = false">Cancel</button>
                <button mat-flat-button style="background:#059669;color:white;border-radius:8px" (click)="saveAmend()" [disabled]="saving">
                  @if (saving) { <span>Saving...</span> } @else { <span>Save Changes</span> }
                </button>
              </div>
            }
          </div>

          <div class="section">
            <h2 class="section-title"><mat-icon>print</mat-icon> Export Plan</h2>
            <div style="display:flex;gap:8px">
              <button mat-stroked-button (click)="exportPlan()">
                <mat-icon>print</mat-icon> Print / Export
              </button>
              <button mat-stroked-button (click)="exportTemplate()">
                <mat-icon>file_download</mat-icon> Export Template (CSV)
              </button>
            </div>
          </div>
        </div>
      }

      @if (activeTab === 'team') {
        <div class="detail-container">
          <div class="section">
            <div class="section-header">
              <h2 class="section-title"><mat-icon>group</mat-icon> Team Members</h2>
            </div>
            @if (teamMembers.length === 0) {
              <p style="color:#94a3b8;text-align:center;padding:40px">No team members assigned</p>
            } @else {
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Contact</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (tm of teamMembers; track tm.teamMemberId) {
                    <tr>
                      <td><span class="role-badge" [class]="getRoleClass(tm.role)">{{tm.role}}</span></td>
                      <td>{{tm.employeeFullName || tm.employeeName}}</td>
                      <td>{{tm.isExternal ? 'External' : 'Internal'}}</td>
                      <td>{{tm.contactNumber || '--'}}</td>
                      <td>
                        <button mat-icon-button (click)="removeTeamMember(tm)">
                          <mat-icon style="font-size:18px;color:#ef4444">delete_outline</mat-icon>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
            <div class="add-member-form">
              <h3 style="font-size:14px;font-weight:600;color:#1e293b;margin:16px 0 8px">Add Team Member</h3>
              <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">
                <div class="field-group" style="flex:1;min-width:160px">
                  <label class="field-label">Role</label>
                  <select class="field-input" [(ngModel)]="newMember.role">
                    <option value="Team Leader">Team Leader</option>
                    <option value="Verification Officers">Verification Officers</option>
                    <option value="Support Staff">Support Staff</option>
                    <option value="Administrative Staff">Administrative Staff</option>
                  </select>
                </div>
                <div style="flex:1;min-width:160px">
                  <label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px">
                    <input type="checkbox" [(ngModel)]="newMember.isExternal" (change)="onNewMemberExternalToggle()"> External
                  </label>
                  @if (newMember.isExternal) {
                    <div class="field-group">
                      <label class="field-label">Full Name</label>
                      <input class="field-input" [(ngModel)]="newMember.employeeName">
                    </div>
                  } @else {
                    <div class="field-group">
                      <label class="field-label">Employee</label>
                      <select class="field-input" [(ngModel)]="newMember.employeeId" (change)="onNewMemberEmployeeSelect()">
                        <option [value]="null">-- Select --</option>
                        @for (e of employees; track e.employeeId) {
                          <option [value]="e.employeeId">{{e.surname}}, {{e.firstName}}</option>
                        }
                      </select>
                    </div>
                  }
                </div>
                <div class="field-group" style="flex:1;min-width:140px">
                  <label class="field-label">Contact Number</label>
                  <input class="field-input" [(ngModel)]="newMember.contactNumber">
                </div>
                <button mat-flat-button style="background:#059669;color:white;border-radius:8px;margin-bottom:2px" (click)="addTeamMember()" [disabled]="addingMember">
                  <mat-icon>person_add</mat-icon> Add
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      @if (activeTab === 'approvals') {
        <div class="detail-container">
          <div class="section">
            <h2 class="section-title"><mat-icon>verified</mat-icon> Approval History</h2>
            @if (approvals.length === 0) {
              <p style="color:#94a3b8;text-align:center;padding:40px">No approvals yet</p>
            } @else {
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>Approved By</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Document</th>
                  </tr>
                </thead>
                <tbody>
                  @for (a of approvals; track a.approvalId) {
                    <tr>
                      <td>v{{a.version}}</td>
                      <td>{{a.approvedByName}}</td>
                      <td>{{a.isExternal ? 'External' : 'Internal'}}</td>
                      <td>{{formatDate(a.approvalDate)}}</td>
                      <td>{{a.documentName || '--'}}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </div>
      }

      @if (activeTab === 'attachments') {
        <div class="detail-container">
          <div class="section">
            <div class="section-header">
              <h2 class="section-title"><mat-icon>attach_file</mat-icon> Attachments</h2>
            </div>
            @if (attachments.length === 0) {
              <p style="color:#94a3b8;text-align:center;padding:40px">No attachments uploaded</p>
            } @else {
              <table class="data-table">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Description</th>
                    <th>Uploaded</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (doc of attachments; track doc.id) {
                    <tr>
                      <td>{{doc.file_name}}</td>
                      <td>{{doc.description || '--'}}</td>
                      <td>{{formatDate(doc.created_at)}}</td>
                      <td style="white-space:nowrap">
                        <button mat-icon-button (click)="downloadAttachment(doc)">
                          <mat-icon style="font-size:18px;color:#2563eb">download</mat-icon>
                        </button>
                        <button mat-icon-button (click)="deleteAttachment(doc)">
                          <mat-icon style="font-size:18px;color:#ef4444">delete_outline</mat-icon>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
            <div class="add-member-form">
              <h3 style="font-size:14px;font-weight:600;color:#1e293b;margin:16px 0 8px">Upload Attachment</h3>
              <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">
                <input type="file" #fileInput (change)="onFileSelected($event)" style="display:none">
                <button mat-stroked-button (click)="fileInput.click()">
                  <mat-icon>cloud_upload</mat-icon> {{selectedFile ? selectedFile.name : 'Choose File'}}
                </button>
                <div class="field-group" style="width:250px">
                  <label class="field-label">Description (optional)</label>
                  <input class="field-input" [(ngModel)]="uploadDescription">
                </div>
                <button mat-flat-button style="background:#059669;color:white;border-radius:8px;margin-bottom:2px" (click)="uploadAttachment()" [disabled]="!selectedFile || uploading">
                  @if (uploading) { <span>Uploading...</span> } @else { <span>Upload</span> }
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      @if (activeTab === 'dashboard') {
        <div class="detail-container">
          <div class="section">
            <h2 class="section-title"><mat-icon>bar_chart</mat-icon> Verification Dashboard</h2>
            @if (!plan?.linkedRegisterId) {
              <p style="color:#94a3b8;text-align:center;padding:40px">No linked register — link a register to view dashboard data.</p>
            } @else if (dashboardLoading) {
              <p style="text-align:center;padding:40px;color:#64748b">Loading dashboard data...</p>
            } @else if (!dashboardStats) {
              <p style="color:#94a3b8;text-align:center;padding:40px">No data available.</p>
            } @else {

              <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:20px">
                <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:14px;text-align:center">
                  <div style="font-size:24px;font-weight:700;color:#0369a1">{{dashboardStats.totalAssets}}</div>
                  <div style="font-size:11px;color:#0284c7;font-weight:600;margin-top:4px">Total</div>
                </div>
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;text-align:center">
                  <div style="font-size:24px;font-weight:700;color:#15803d">{{dashboardStats.verified}}</div>
                  <div style="font-size:11px;color:#16a34a;font-weight:600;margin-top:4px">Verified</div>
                </div>
                <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;padding:14px;text-align:center">
                  <div style="font-size:24px;font-weight:700;color:#475569">{{dashboardStats.notStarted}}</div>
                  <div style="font-size:11px;color:#64748b;font-weight:600;margin-top:4px">Not Started</div>
                </div>
                <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:14px;text-align:center">
                  <div style="font-size:24px;font-weight:700;color:#16a34a">{{dashboardStats.keep}}</div>
                  <div style="font-size:11px;color:#22c55e;font-weight:600;margin-top:4px">Keep</div>
                </div>
                <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px;text-align:center">
                  <div style="font-size:24px;font-weight:700;color:#b45309">{{dashboardStats.dispose}}</div>
                  <div style="font-size:11px;color:#d97706;font-weight:600;margin-top:4px">Dispose</div>
                </div>
                <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:10px;padding:14px;text-align:center">
                  <div style="font-size:24px;font-weight:700;color:#be123c">{{dashboardStats.notFound}}</div>
                  <div style="font-size:11px;color:#e11d48;font-weight:600;margin-top:4px">Not Found</div>
                </div>
              </div>

              <div style="display:flex;gap:16px;margin-bottom:24px;align-items:flex-start">
                @if (dashboardStats.userLegend && dashboardStats.userLegend.length > 0) {
                  <div style="flex:1;border:1px solid #e2e8f0;border-radius:8px;padding:14px">
                    <div style="font-size:13px;font-weight:600;color:#1e293b;margin-bottom:10px">Users</div>
                    <div style="display:flex;flex-wrap:wrap;gap:8px 24px">
                      @for (ul of dashboardStats.userLegend; track ul.name) {
                        <div style="display:flex;align-items:center;gap:7px">
                          <span [style.background]="ul.color" style="width:13px;height:13px;border-radius:50%;display:inline-block;flex-shrink:0"></span>
                          <span style="font-size:12px;color:#334155">{{ul.name}}</span>
                        </div>
                      }
                    </div>
                  </div>
                }
                <div style="border:1px solid #e2e8f0;border-radius:8px;padding:14px;white-space:nowrap">
                  <div style="font-size:13px;font-weight:600;color:#1e293b;margin-bottom:10px">Legend</div>
                  <div style="display:flex;flex-direction:column;gap:7px">
                    <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#334155"><span style="width:13px;height:13px;border-radius:50%;background:#22c55e;display:inline-block"></span> Keep</div>
                    <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#334155"><span style="width:13px;height:13px;border-radius:50%;background:#f59e0b;display:inline-block"></span> Dispose</div>
                    <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#334155"><span style="width:13px;height:13px;border-radius:50%;background:#ef4444;display:inline-block"></span> Not Found</div>
                    <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#334155"><span style="width:13px;height:13px;border-radius:50%;background:#e2e8f0;display:inline-block"></span> Other/Pending</div>
                  </div>
                </div>
              </div>

              @if (dashboardStats.assetTypeCharts && dashboardStats.assetTypeCharts.length > 0) {
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;margin-bottom:24px">
                  @for (atc of dashboardStats.assetTypeCharts; track atc.assetTypeId) {
                    <div style="border:1px solid #e2e8f0;border-radius:10px;padding:16px;text-align:center">
                      <div style="font-size:13px;font-weight:600;color:#1e293b;margin-bottom:4px">{{atc.assetTypeDesc}}</div>
                      <div style="font-size:11px;color:#64748b;margin-bottom:8px">{{atc.verifiedItems}} / {{atc.totalItems}} verified ({{atc.pct}}%)</div>
                      <div style="height:120px;display:flex;align-items:center;justify-content:center">
                        <canvas baseChart [data]="atc.chartData" [options]="doughnutOptions" type="doughnut" style="max-height:120px"></canvas>
                      </div>
                    </div>
                  }
                </div>
              }

              @if (cumulativeLineData.datasets && cumulativeLineData.datasets.length > 0) {
                <div style="border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:16px">
                  <div style="font-size:13px;font-weight:600;color:#1e293b;margin-bottom:12px">Daily Verification Activity (by User)</div>
                  <canvas baseChart [data]="cumulativeLineData" [options]="cumulativeLineOptions" type="line" style="max-height:280px"></canvas>
                </div>
              }
            }
          </div>
        </div>
      }

      @if (activeTab === 'audit') {
        <div class="detail-container">
          <div class="section">
            <h2 class="section-title"><mat-icon>history</mat-icon> Audit Trail</h2>
            @if (auditTrail.length === 0) {
              <p style="color:#94a3b8;text-align:center;padding:40px">No audit records</p>
            } @else {
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date/Time</th>
                    <th>Action</th>
                    <th>User</th>
                    <th>Changes</th>
                  </tr>
                </thead>
                <tbody>
                  @for (a of auditTrail; track a.auditId) {
                    <tr>
                      <td style="white-space:nowrap">{{formatDateTime(a.actionDate)}}</td>
                      <td><span class="role-badge officer">{{a.action}}</span></td>
                      <td>{{a.actionByName || '--'}}</td>
                      <td style="font-size:12px;color:#475569">{{formatChanges(a.changeSummary)}}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </div>
      }
    }

    @if (showApproveDialog) {
      <div class="dialog-overlay" (click)="showApproveDialog = false">
        <div class="dialog" (click)="$event.stopPropagation()">
          <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#1e293b">Approve Verification Plan</h2>
          <div style="margin-bottom:12px">
            <label style="font-size:13px;color:#64748b">
              <input type="checkbox" [(ngModel)]="approveForm.isExternal" (change)="onApproverExternalToggle()"> External Approver
            </label>
          </div>
          @if (approveForm.isExternal) {
            <div class="field-group" style="margin-bottom:12px">
              <label class="field-label">Approver Name *</label>
              <input class="field-input" [(ngModel)]="approveForm.approvedByName">
            </div>
          } @else {
            <div class="field-group" style="margin-bottom:12px">
              <label class="field-label">Select Employee *</label>
              <select class="field-input" [(ngModel)]="approveForm.approvedBy" (change)="onApproverEmployeeSelect()">
                <option [value]="null">-- Select --</option>
                @for (e of employees; track e.employeeId) {
                  <option [value]="e.employeeId">{{e.surname}}, {{e.firstName}}</option>
                }
              </select>
            </div>
          }
          <div class="field-group" style="margin-bottom:12px">
            <label class="field-label">Approval Date *</label>
            <input type="date" class="field-input" [(ngModel)]="approveForm.approvalDate">
          </div>
          <div style="margin:12px 0">
            <label style="font-size:13px;font-weight:500;color:#1e293b;display:block;margin-bottom:6px">Signed Approval Document</label>
            <input type="file" #approvalFileInput (change)="onApprovalFileSelected($event)" style="display:none">
            <button mat-stroked-button (click)="approvalFileInput.click()">
              <mat-icon>cloud_upload</mat-icon> {{approvalFile ? approvalFile.name : 'Choose File'}}
            </button>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">
            <button mat-stroked-button (click)="showApproveDialog = false">Cancel</button>
            <button mat-flat-button style="background:#059669;color:white;border-radius:8px" (click)="submitApproval()" [disabled]="approving">
              @if (approving) { <span>Approving...</span> } @else { <span>Confirm Approval</span> }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .tab-bar { display:flex; gap:0; border-bottom:2px solid #e2e8f0; margin-bottom:20px; flex-wrap:wrap; }
    .tab {
      padding:10px 20px; border:none; background:transparent; cursor:pointer;
      font-size:13px; font-weight:500; color:#64748b; display:flex; align-items:center; gap:6px;
      border-bottom:2px solid transparent; margin-bottom:-2px; transition:all 0.15s;
    }
    .tab:hover { color:#1e293b; }
    .tab.active { color:#059669; border-bottom-color:#059669; font-weight:600; }
    .tab mat-icon { font-size:18px; width:18px; height:18px; }
    .detail-container { max-width:900px; }
    .section { background:white; border:1px solid #e2e8f0; border-radius:12px; padding:24px; margin-bottom:16px; }
    .section-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
    .section-title {
      font-size:15px; font-weight:600; color:#1e293b; margin:0;
      display:flex; align-items:center; gap:8px;
    }
    .section-title mat-icon { font-size:20px; width:20px; height:20px; color:#059669; }
    .detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .detail-item { display:flex; flex-direction:column; gap:4px; }
    .detail-item.full { grid-column:1 / -1; }
    .detail-item label { font-size:12px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; }
    .detail-item span, .detail-item a { font-size:14px; color:#1e293b; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px 16px; }
    .full-width { grid-column:1 / -1; }
    .field-group { display:flex; flex-direction:column; gap:4px; }
    .field-label { font-size:12px; font-weight:600; color:#475569; display:flex; align-items:center; gap:8px; }
    .field-input {
      height:38px; border:1px solid #cbd5e1; border-radius:6px; padding:0 10px;
      font-size:13px; color:#1e293b; background:white; width:100%; box-sizing:border-box;
    }
    .field-input:focus { outline:none; border-color:#059669; }
    .multi-select { height:90px; padding:6px 8px; }
    .toggle-all-btn {
      font-size:11px; padding:2px 8px; border:1px solid #cbd5e1; border-radius:4px;
      background:white; color:#475569; cursor:pointer; margin-left:auto;
    }
    .toggle-all-btn:hover { background:#f1f5f9; }
    .status-badge {
      font-size:11px; font-weight:600; padding:3px 8px; border-radius:6px; display:inline-block;
    }
    .status-badge.draft { background:#f1f5f9; color:#64748b; }
    .status-badge.approved { background:#dcfce7; color:#166534; }
    .status-badge.amended { background:#fef3c7; color:#92400e; }
    .status-badge.amended-approved { background:#dbeafe; color:#1d4ed8; }
    .role-badge { font-size:11px; font-weight:600; padding:3px 8px; border-radius:6px; white-space:nowrap; }
    .role-badge.leader { background:#fef3c7; color:#92400e; }
    .role-badge.officer { background:#dbeafe; color:#1d4ed8; }
    .role-badge.support { background:#f1f5f9; color:#64748b; }
    .role-badge.admin { background:#fce7f3; color:#9d174d; }
    .data-table { width:100%; border-collapse:collapse; }
    .data-table th { text-align:left; font-size:12px; font-weight:600; color:#64748b; padding:10px 8px; border-bottom:2px solid #e2e8f0; }
    .data-table td { padding:10px 8px; font-size:13px; color:#1e293b; border-bottom:1px solid #f1f5f9; }
    .add-member-form { border-top:1px solid #e2e8f0; margin-top:16px; padding-top:8px; }
    .dialog-overlay {
      position:fixed; top:0; left:0; right:0; bottom:0;
      background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; z-index:1000;
    }
    .dialog {
      background:white; border-radius:16px; padding:32px; min-width:440px; max-width:560px;
      box-shadow:0 20px 60px rgba(0,0,0,0.2);
    }
  `]
})
export class PlanDetailComponent implements OnInit, HasUnsavedChanges {
  planId = 0;
  plan: any = null;
  loading = true;
  editing = false;
  saving = false;
  activeTab = 'details';

  editForm: any = {};
  teamMembers: any[] = [];
  approvals: any[] = [];
  auditTrail: any[] = [];
  attachments: any[] = [];

  assetTypes: any[] = [];
  categories: any[] = [];
  towns: any[] = [];
  suburbs: any[] = [];
  buildings: any[] = [];
  employees: any[] = [];
  registers: any[] = [];

  newMember: any = { role: 'Verification Officers', employeeId: null, employeeName: '', isExternal: false, contactNumber: '' };
  addingMember = false;

  showApproveDialog = false;
  approving = false;
  approveForm: any = { approvedBy: null, approvedByName: '', approvalDate: '', isExternal: false };
  approvalFile: File | null = null;

  selectedFile: File | null = null;
  uploadDescription = '';
  uploading = false;

  dashboardLoading = false;
  dashboardStats: any = null;
  cumulativeLineData: any = { labels: [], datasets: [] };
  doughnutOptions: any = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '38%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            if (ctx.datasetIndex === 0) {
              var innerLabels = ['Keep', 'Dispose', 'Not found', 'Other'];
              return ' ' + (innerLabels[ctx.dataIndex] || '') + ': ' + ctx.parsed;
            }
            return ' ' + (ctx.label || '') + ': ' + ctx.parsed;
          }
        }
      }
    }
  };
  cumulativeLineOptions: any = { responsive: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } };
  USER_COLORS: string[] = ['#a855f7','#22d3ee','#fbbf24','#ec4899','#86efac','#fb923c','#60a5fa','#f87171','#34d399','#a3e635','#818cf8','#fb7185'];

  get editFilteredCategories(): any[] {
    if (!this.editForm.selectedAssetTypes || this.editForm.selectedAssetTypes.length === 0) return this.categories;
    var selected = this.editForm.selectedAssetTypes;
    var result: any[] = [];
    for (var i = 0; i < this.categories.length; i++) {
      if (selected.indexOf(this.categories[i].typeID) !== -1) {
        result.push(this.categories[i]);
      }
    }
    return result.length > 0 ? result : this.categories;
  }

  get editFilteredSuburbs(): any[] {
    if (!this.editForm.townId) return this.suburbs;
    var tid = this.editForm.townId;
    var result: any[] = [];
    for (var i = 0; i < this.suburbs.length; i++) {
      if (this.suburbs[i].townId === tid) result.push(this.suburbs[i]);
    }
    return result;
  }

  allTypesSelected(): boolean {
    return this.assetTypes.length > 0 && (this.editForm.selectedAssetTypes || []).length >= this.assetTypes.length;
  }

  allCategoriesSelected(): boolean {
    var cats = this.editFilteredCategories;
    return cats.length > 0 && (this.editForm.selectedCategories || []).length >= cats.length;
  }

  toggleAllTypes() {
    if (this.allTypesSelected()) {
      this.editForm.selectedAssetTypes = [];
    } else {
      var ids: number[] = [];
      for (var i = 0; i < this.assetTypes.length; i++) ids.push(this.assetTypes[i].assetType_ID);
      this.editForm.selectedAssetTypes = ids;
    }
  }

  toggleAllCategories() {
    var cats = this.editFilteredCategories;
    if (this.allCategoriesSelected()) {
      this.editForm.selectedCategories = [];
    } else {
      var ids: number[] = [];
      for (var i = 0; i < cats.length; i++) ids.push(cats[i].assetCategoryID);
      this.editForm.selectedCategories = ids;
    }
  }

  hasUnsavedChanges(): boolean {
    return this.editing;
  }

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    var self = this;
    this.route.params.subscribe({
      next: function(params: any) {
        self.planId = +params['id'];
        self.loadPlan();
        self.loadTeam();
        self.loadLookups();
      }
    });
  }

  loadPlan() {
    var self = this;
    this.loading = true;
    this.api.getVerificationPlan(this.planId).subscribe({
      next: function(data: any) {
        self.plan = data;
        self.loading = false;
      },
      error: function() { self.loading = false; }
    });
  }

  loadLookups() {
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

  loadTeam() {
    var self = this;
    this.api.getVerificationPlanTeamMembers(this.planId).subscribe({
      next: function(data: any[]) { self.teamMembers = data; }
    });
  }

  loadApprovals() {
    var self = this;
    this.api.getVerificationPlanApprovals(this.planId).subscribe({
      next: function(data: any[]) { self.approvals = data; }
    });
  }

  loadAudit() {
    var self = this;
    this.api.getVerificationPlanAuditTrail(this.planId).subscribe({
      next: function(data: any[]) { self.auditTrail = data; }
    });
  }

  loadAttachments() {
    var self = this;
    this.api.getDocuments('verification_plan', String(this.planId)).subscribe({
      next: function(data: any[]) { self.attachments = data; },
      error: function() { self.attachments = []; }
    });
  }

  loadDashboardStats() {
    if (!this.plan?.linkedRegisterId) return;
    var self = this;
    self.dashboardLoading = true;
    self.dashboardStats = null;
    this.api.getRegisterDashboardStats(this.plan.linkedRegisterId).subscribe({
      next: function(data: any) {
        self.dashboardLoading = false;
        var byType: any[] = data.byType || [];
        var byMemberType: any[] = data.byMemberType || [];
        var dailyRaw: any[] = data.dailyProgress || [];

        var userColorMap: Record<string, string> = {};
        var allUsers: string[] = [];
        for (var i = 0; i < byMemberType.length; i++) {
          var uname = byMemberType[i].memberName || 'Unknown';
          if (!userColorMap[uname]) {
            userColorMap[uname] = self.USER_COLORS[allUsers.length % self.USER_COLORS.length];
            allUsers.push(uname);
          }
        }

        var atMap: Record<string, any> = {};
        for (var j = 0; j < byType.length; j++) {
          var bt = byType[j];
          var atId = String(bt.assetTypeId || 'unknown');
          atMap[atId] = {
            assetTypeId: bt.assetTypeId,
            assetTypeDesc: bt.assetTypeDesc || 'Unknown',
            totalItems: Number(bt.totalItems || 0),
            verifiedItems: Number(bt.verifiedItems || 0),
            keepItems: Number(bt.keepItems || 0),
            disposeItems: Number(bt.disposeItems || 0),
            notFoundItems: Number(bt.notFoundItems || 0),
            pct: bt.totalItems > 0 ? Math.round(Number(bt.verifiedItems) / Number(bt.totalItems) * 100) : 0,
            members: [] as any[]
          };
        }
        for (var k = 0; k < byMemberType.length; k++) {
          var bm = byMemberType[k];
          var bmId = String(bm.assetTypeId || 'unknown');
          if (atMap[bmId]) {
            atMap[bmId].members.push({ name: bm.memberName || 'Unknown', count: Number(bm.verifiedCount || 0), color: userColorMap[bm.memberName || 'Unknown'] });
          }
        }
        var assetTypeCharts: any[] = [];
        for (var atKey in atMap) {
          var at = atMap[atKey];
          var sliceNames: string[] = [];
          var sliceCounts: number[] = [];
          var sliceColors: string[] = [];
          for (var m = 0; m < at.members.length; m++) {
            if (at.members[m].count > 0) {
              sliceNames.push(at.members[m].name);
              sliceCounts.push(at.members[m].count);
              sliceColors.push(at.members[m].color);
            }
          }
          var unverified = at.totalItems - at.verifiedItems;
          if (unverified > 0) {
            sliceNames.push('Not Started');
            sliceCounts.push(unverified);
            sliceColors.push('#e2e8f0');
          }
          if (sliceCounts.length === 0) {
            sliceNames = ['No Items'];
            sliceCounts = [1];
            sliceColors = ['#e2e8f0'];
          }
          var innerOther = Math.max(0, at.totalItems - at.keepItems - at.disposeItems - at.notFoundItems);
          at.chartData = {
            labels: sliceNames,
            datasets: [
              {
                data: [at.keepItems, at.disposeItems, at.notFoundItems, innerOther],
                backgroundColor: ['#22c55e', '#f59e0b', '#ef4444', '#e2e8f0'],
                borderWidth: 1,
                borderColor: '#fff'
              },
              {
                data: sliceCounts,
                backgroundColor: sliceColors,
                borderWidth: 2,
                borderColor: '#fff'
              }
            ]
          };
          assetTypeCharts.push(at);
        }

        var regStart: string = String(data.registerStartDate || '').slice(0, 10);
        var regEnd: string = String(data.registerEndDate || '').slice(0, 10);
        var today: string = new Date().toISOString().slice(0, 10);
        var rawDates: string[] = [];
        for (var d0 = 0; d0 < dailyRaw.length; d0++) { rawDates.push(String(dailyRaw[d0].date || '').slice(0, 10)); }
        rawDates.sort();
        var earliestDaily: string = rawDates[0] || '';
        var latestDaily: string = rawDates[rawDates.length - 1] || '';
        if (!regStart) regStart = earliestDaily || today;
        else if (earliestDaily && earliestDaily < regStart) regStart = earliestDaily;
        if (!regEnd || regEnd === regStart) regEnd = today;
        if (latestDaily && latestDaily > regEnd) regEnd = latestDaily;
        if (today > regEnd) regEnd = today;
        var allDates: string[] = [];
        var cur = new Date(regStart + 'T12:00:00Z');
        var endD = new Date(regEnd + 'T12:00:00Z');
        while (cur <= endD) {
          allDates.push(cur.toISOString().slice(0, 10));
          cur.setUTCDate(cur.getUTCDate() + 1);
        }

        var userDayData: Record<string, Record<string, number>> = {};
        for (var u = 0; u < allUsers.length; u++) { userDayData[allUsers[u]] = {}; }
        for (var r = 0; r < dailyRaw.length; r++) {
          var rname = dailyRaw[r].memberName || 'Unknown';
          var rdate = String(dailyRaw[r].date || '').slice(0, 10);
          if (!userDayData[rname]) userDayData[rname] = {};
          userDayData[rname][rdate] = (userDayData[rname][rdate] || 0) + Number(dailyRaw[r].verifiedCount || 0);
        }
        var stackedDatasets = allUsers.map(function(un: string) {
          var dayData = allDates.map(function(dt: string) { return userDayData[un][dt] || 0; });
          return {
            label: un,
            data: dayData,
            borderColor: userColorMap[un],
            backgroundColor: userColorMap[un] + 'bb',
            fill: true,
            tension: 0.3,
            borderWidth: 1.5,
            pointRadius: allDates.length > 60 ? 0 : 3
          };
        });
        self.cumulativeLineData = { labels: allDates, datasets: stackedDatasets };

        var totalAssets = 0; var totalVerified = 0;
        var totalKeep = 0; var totalDispose = 0; var totalNotFound = 0;
        for (var s = 0; s < byType.length; s++) {
          totalAssets += Number(byType[s].totalItems || 0);
          totalVerified += Number(byType[s].verifiedItems || 0);
          totalKeep += Number(byType[s].keepItems || 0);
          totalDispose += Number(byType[s].disposeItems || 0);
          totalNotFound += Number(byType[s].notFoundItems || 0);
        }
        self.dashboardStats = {
          totalAssets, verified: totalVerified,
          notStarted: totalAssets - totalVerified,
          keep: totalKeep, dispose: totalDispose, notFound: totalNotFound,
          userLegend: allUsers.map(function(un: string) { return { name: un, color: userColorMap[un] }; }),
          assetTypeCharts
        };
      },
      error: function() { self.dashboardLoading = false; }
    });
  }

  getStatusClass(status: string): string {
    if (status === 'Draft') return 'draft';
    if (status === 'Approved') return 'approved';
    if (status === 'Amended') return 'amended';
    if (status === 'Amended (Approved)') return 'amended-approved';
    return 'draft';
  }

  getRoleClass(role: string): string {
    if (role === 'Team Leader') return 'leader';
    if (role === 'Verification Officers') return 'officer';
    if (role === 'Support Staff') return 'support';
    if (role === 'Administrative Staff') return 'admin';
    return 'support';
  }

  startEditing() {
    var parsedTypes: number[] = [];
    var parsedCats: number[] = [];
    try {
      var at = this.plan.assetTypes;
      if (typeof at === 'string') parsedTypes = JSON.parse(at);
      else if (Array.isArray(at)) parsedTypes = at;
    } catch (e) {}
    try {
      var ac = this.plan.assetCategories;
      if (typeof ac === 'string') parsedCats = JSON.parse(ac);
      else if (Array.isArray(ac)) parsedCats = ac;
    } catch (e) {}
    this.editForm = {
      planName: this.plan.planName,
      plannedStartDate: this.plan.plannedStartDate ? String(this.plan.plannedStartDate).slice(0, 10) : '',
      plannedEndDate: this.plan.plannedEndDate ? String(this.plan.plannedEndDate).slice(0, 10) : '',
      scopeOfWork: this.plan.scopeOfWork || '',
      selectedAssetTypes: parsedTypes,
      selectedCategories: parsedCats,
      townId: this.plan.townId,
      suburbId: this.plan.suburbId,
      buildingId: this.plan.buildingId,
      linkedRegisterId: this.plan.linkedRegisterId
    };
    this.editing = true;
  }

  onEditTownChange() {
    this.editForm.suburbId = null;
  }

  saveAmend() {
    var self = this;
    if (!this.editForm.planName.trim()) {
      this.snackBar.open('Plan name is required', 'OK', { duration: 3000 });
      return;
    }
    this.saving = true;
    var newLinkedRegisterId = this.editForm.linkedRegisterId;
    this.api.amendVerificationPlan(this.planId, {
      planName: this.editForm.planName,
      plannedStartDate: this.editForm.plannedStartDate || null,
      plannedEndDate: this.editForm.plannedEndDate || null,
      scopeOfWork: this.editForm.scopeOfWork || null,
      assetTypes: JSON.stringify(this.editForm.selectedAssetTypes || []),
      assetCategories: JSON.stringify(this.editForm.selectedCategories || []),
      townId: this.editForm.townId,
      suburbId: this.editForm.suburbId,
      buildingId: this.editForm.buildingId,
      linkedRegisterId: newLinkedRegisterId
    }).subscribe({
      next: function() {
        self.saving = false;
        self.editing = false;
        self.snackBar.open('Plan amended successfully', 'OK', { duration: 3000 });
        self.loadPlan();
        if (newLinkedRegisterId) {
          self.api.syncPlanTeam(newLinkedRegisterId, self.planId).subscribe({ next: function() {}, error: function() {} });
        }
      },
      error: function(err: any) {
        self.saving = false;
        self.snackBar.open('Error: ' + (err.error?.error || 'Unknown'), 'OK', { duration: 5000 });
      }
    });
  }

  onApproverExternalToggle() {
    if (this.approveForm.isExternal) {
      this.approveForm.approvedBy = null;
    } else {
      this.approveForm.approvedByName = '';
    }
  }

  onApproverEmployeeSelect() {
    if (this.approveForm.approvedBy) {
      for (var i = 0; i < this.employees.length; i++) {
        if (this.employees[i].employeeId === this.approveForm.approvedBy) {
          this.approveForm.approvedByName = this.employees[i].surname + ', ' + this.employees[i].firstName;
          break;
        }
      }
    }
  }

  onApprovalFileSelected(event: any) {
    var files = event.target.files;
    if (files && files.length > 0) {
      this.approvalFile = files[0];
    }
  }

  submitApproval() {
    var self = this;
    if (!this.approveForm.approvedByName.trim()) {
      this.snackBar.open('Approver name is required', 'OK', { duration: 3000 });
      return;
    }
    if (!this.approveForm.approvalDate) {
      this.snackBar.open('Approval date is required', 'OK', { duration: 3000 });
      return;
    }
    this.approving = true;

    if (!this.approvalFile) {
      this.approving = false;
      this.snackBar.open('A signed approval document is required', 'OK', { duration: 4000 });
      return;
    }

    var doApprove = function(documentId: number) {
      self.api.approveVerificationPlan(self.planId, {
        approvedBy: self.approveForm.approvedBy,
        approvedByName: self.approveForm.approvedByName,
        approvalDate: self.approveForm.approvalDate || null,
        isExternal: self.approveForm.isExternal ? 1 : 0,
        documentId: documentId
      }).subscribe({
        next: function() {
          self.approving = false;
          self.showApproveDialog = false;
          self.snackBar.open('Plan approved', 'OK', { duration: 3000 });
          self.approveForm = { approvedBy: null, approvedByName: '', approvalDate: '', isExternal: false };
          self.approvalFile = null;
          self.loadPlan();
          self.loadApprovals();
        },
        error: function(err: any) {
          self.approving = false;
          self.snackBar.open('Error: ' + (err.error?.error || 'Unknown'), 'OK', { duration: 5000 });
        }
      });
    };

    this.api.uploadDocument(this.approvalFile, 'verification_plan', String(this.planId), 'Approval document').subscribe({
      next: function(res: any) {
        doApprove(res.id);
      },
      error: function(err: any) {
        self.approving = false;
        self.snackBar.open('Failed to upload approval document: ' + (err.error?.error || 'Unknown'), 'OK', { duration: 5000 });
      }
    });
  }

  addTeamMember() {
    var self = this;
    var name = this.newMember.employeeName;
    if (!this.newMember.isExternal && this.newMember.employeeId) {
      for (var i = 0; i < this.employees.length; i++) {
        if (this.employees[i].employeeId === this.newMember.employeeId) {
          name = this.employees[i].surname + ', ' + this.employees[i].firstName;
          break;
        }
      }
    }
    if (!name && !this.newMember.employeeId) {
      this.snackBar.open('Select an employee or enter a name', 'OK', { duration: 3000 });
      return;
    }
    this.addingMember = true;
    this.api.addVerificationPlanTeamMember(this.planId, {
      role: this.newMember.role,
      employeeId: this.newMember.isExternal ? null : this.newMember.employeeId,
      employeeName: name,
      isExternal: this.newMember.isExternal ? 1 : 0,
      contactNumber: this.newMember.contactNumber
    }).subscribe({
      next: function() {
        self.addingMember = false;
        self.newMember = { role: 'Verification Officers', employeeId: null, employeeName: '', isExternal: false, contactNumber: '' };
        self.loadTeam();
        self.snackBar.open('Team member added', 'OK', { duration: 2000 });
      },
      error: function(err: any) {
        self.addingMember = false;
        self.snackBar.open('Error: ' + (err.error?.error || 'Unknown'), 'OK', { duration: 5000 });
      }
    });
  }

  removeTeamMember(tm: any) {
    if (!confirm('Remove ' + (tm.employeeFullName || tm.employeeName) + ' from the team?')) return;
    var self = this;
    this.api.removeVerificationPlanTeamMember(this.planId, tm.teamMemberId).subscribe({
      next: function() { self.loadTeam(); }
    });
  }

  onNewMemberExternalToggle() {
    if (this.newMember.isExternal) {
      this.newMember.employeeId = null;
    } else {
      this.newMember.employeeName = '';
    }
  }

  onNewMemberEmployeeSelect() {
    if (this.newMember.employeeId) {
      for (var i = 0; i < this.employees.length; i++) {
        if (this.employees[i].employeeId === this.newMember.employeeId) {
          this.newMember.employeeName = this.employees[i].surname + ', ' + this.employees[i].firstName;
          break;
        }
      }
    }
  }

  onFileSelected(event: any) {
    var files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
    }
  }

  uploadAttachment() {
    if (!this.selectedFile) return;
    var self = this;
    this.uploading = true;
    this.api.uploadDocument(this.selectedFile, 'verification_plan', String(this.planId), this.uploadDescription).subscribe({
      next: function() {
        self.uploading = false;
        self.selectedFile = null;
        self.uploadDescription = '';
        self.snackBar.open('Attachment uploaded', 'OK', { duration: 2000 });
        self.loadAttachments();
      },
      error: function(err: any) {
        self.uploading = false;
        self.snackBar.open('Upload error: ' + (err.error?.error || 'Unknown'), 'OK', { duration: 5000 });
      }
    });
  }

  downloadAttachment(doc: any) {
    this.api.downloadDocument(doc.id);
  }

  deleteAttachment(doc: any) {
    if (!confirm('Delete attachment "' + doc.file_name + '"?')) return;
    var self = this;
    this.api.deleteDocument(doc.id).subscribe({
      next: function() { self.loadAttachments(); }
    });
  }

  exportPlan() {
    var self = this;
    this.api.getVerificationPlanExport(this.planId).subscribe({
      next: function(data: any) {
        self.printExport(data);
      }
    });
  }

  exportTemplate() {
    var self = this;
    this.api.getVerificationPlanExport(this.planId).subscribe({
      next: function(data: any) {
        self.downloadTemplateCsv(data);
      }
    });
  }

  downloadTemplateCsv(data: any) {
    var csv = 'Plan Name,Planned Start Date,Planned End Date,Scope of Work,Asset Types,Asset Categories,Town,Suburb,Building,Linked Register\n';
    csv += '"","","","","","","","","",""\n';
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

  printExport(data: any) {
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
      if (typesArr.length > 0) {
        var typeLabels: string[] = [];
        for (var ti = 0; ti < typesArr.length; ti++) {
          var matchType: any = null;
          for (var tj = 0; tj < this.assetTypes.length; tj++) {
            if (this.assetTypes[tj].assetType_ID === typesArr[ti]) { matchType = this.assetTypes[tj]; break; }
          }
          typeLabels.push(matchType ? matchType.assetTypeDesc : typesArr[ti]);
        }
        typeNames = typeLabels.join(', ');
      }
    } catch(e) { typeNames = '--'; }
    try {
      var catsArr = typeof p.assetCategories === 'string' ? JSON.parse(p.assetCategories) : (p.assetCategories || []);
      if (catsArr.length > 0) {
        var catLabels: string[] = [];
        for (var ci = 0; ci < catsArr.length; ci++) {
          var matchCat: any = null;
          for (var cj = 0; cj < this.categories.length; cj++) {
            if (this.categories[cj].assetCategoryID === catsArr[ci]) { matchCat = this.categories[cj]; break; }
          }
          catLabels.push(matchCat ? matchCat.assetCategoryDesc : catsArr[ci]);
        }
        catNames = catLabels.join(', ');
      }
    } catch(e) { catNames = '--'; }
    html += '<tr><td class="label">Asset Types</td><td>' + typeNames + '</td></tr>';
    html += '<tr><td class="label">Asset Categories</td><td>' + catNames + '</td></tr>';
    html += '<tr><td class="label">Town</td><td>' + (p.townDesc || '--') + '</td></tr>';
    html += '<tr><td class="label">Suburb</td><td>' + (p.suburbDesc || '--') + '</td></tr>';
    html += '<tr><td class="label">Building</td><td>' + (p.buildingDesc || '--') + '</td></tr>';
    html += '<tr><td class="label">Linked Register</td><td>' + (p.linkedRegisterName || '--') + '</td></tr>';
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
    if (!summary) return '--';
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

  formatJsonArray(jsonVal: any, lookupList: any[], idField: string, labelField: string): string {
    var ids: number[] = [];
    if (!jsonVal) return '--';
    if (typeof jsonVal === 'string') {
      try { ids = JSON.parse(jsonVal); } catch (e) { return jsonVal; }
    } else if (Array.isArray(jsonVal)) {
      ids = jsonVal;
    }
    if (!ids || ids.length === 0) return '--';
    var labels: string[] = [];
    for (var i = 0; i < ids.length; i++) {
      var found = false;
      for (var j = 0; j < lookupList.length; j++) {
        if (lookupList[j][idField] === ids[i]) {
          labels.push(lookupList[j][labelField]);
          found = true;
          break;
        }
      }
      if (!found) labels.push(String(ids[i]));
    }
    return labels.join(', ');
  }
}
