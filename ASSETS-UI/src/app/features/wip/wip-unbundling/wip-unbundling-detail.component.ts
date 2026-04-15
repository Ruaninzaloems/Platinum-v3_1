import { Component, OnInit, ViewChild, signal } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '../../../core/api.service';
import { CidmsPickerComponent } from '../../../shared/cidms-picker/cidms-picker.component';
import { CidmsChainResult } from '../../../core/cidms-level-config';

@Component({
  selector: 'app-wip-unbundling-detail',
  standalone: true,
  imports: [
    RouterModule, CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatStepperModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTableModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatDialogModule,
    CidmsPickerComponent
  ],
  template: `
    <div class="page-tabs">
      <a class="page-tab" routerLink="/wip" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
        <mat-icon>construction</mat-icon> WIP Register
      </a>
      <a class="page-tab" routerLink="/wip/unbundling" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
        <mat-icon>category</mat-icon> Asset Unbundling
      </a>
    </div>

    @if (loading()) {
      <div style="text-align:center;padding:80px">
        <mat-spinner diameter="48" style="margin:0 auto 16px"></mat-spinner>
        <p style="color:#64748b">Loading project...</p>
      </div>
    }

    @if (!loading() && !project()) {
      <div style="text-align:center;padding:80px">
        <mat-icon style="font-size:64px;width:64px;height:64px;color:#cbd5e1">error_outline</mat-icon>
        <h2 style="color:#475569">Project not found</h2>
        <a routerLink="/wip/unbundling" mat-stroked-button>Back to List</a>
      </div>
    }

    @if (!loading() && project()) {
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
        <a routerLink="/wip/unbundling" mat-icon-button style="color:#64748b">
          <mat-icon>arrow_back</mat-icon>
        </a>
        <div>
          <h1 style="font-size:22px;font-weight:700;color:#1e293b;margin:0 0 2px">{{ project().projectName }}</h1>
          <p style="font-size:13px;color:#64748b;margin:0">Contract: {{ project().contractNumber || '—' }} &nbsp;|&nbsp; Status: <span [class]="'status-chip status-' + (project().unbundlingStatus || 'draft').toLowerCase()">{{ project().unbundlingStatus || 'Draft' }}</span></p>
        </div>
      </div>

      <div class="wizard-card">
        <mat-stepper orientation="horizontal" #wizardStepper
                     (selectionChange)="onStepSelectionChange($event)">

          <mat-step label="Capital Contract"
                    [completed]="hasCompletionCert() && hasBOQ()"
                    [editable]="true">
            <div class="step-content">
              <h2 class="tab-title">Capital Contract Details</h2>

              <div class="summary-grid">
                <div class="summary-item">
                  <label>Contract Number</label>
                  <span>{{ project().contractNumber || '—' }}</span>
                </div>
                <div class="summary-item">
                  <label>Project Name</label>
                  <span>{{ project().projectName }}</span>
                </div>
                <div class="summary-item">
                  <label>Contract Value</label>
                  <span>R {{ (project().contractValue || 0) | number:'1.2-2' }}</span>
                </div>
                <div class="summary-item">
                  <label>Actual Expenditure</label>
                  <span>R {{ (project().totalExpenditure || 0) | number:'1.2-2' }}</span>
                </div>
                <div class="summary-item">
                  <label>Financial Progress</label>
                  <span>{{ project().financialProgress || 0 }}%</span>
                </div>
                <div class="summary-item">
                  <label>Project Complete</label>
                  <span>{{ project().projectComplete ? 'Yes' : 'No' }}</span>
                </div>
              </div>

              @if (scmContract()) {
                <h3 class="section-title" style="margin-top:28px">SCM Contract Details</h3>
                <div class="summary-grid">
                  <div class="summary-item">
                    <label>Contract Number</label>
                    <span>{{ scmContract().contractNumber || '—' }}</span>
                  </div>
                  <div class="summary-item">
                    <label>Contract Description</label>
                    <span>{{ scmContract().contractDescription || '—' }}</span>
                  </div>
                  <div class="summary-item">
                    <label>Contract Value</label>
                    <span>R {{ (scmContract().contractValue || 0) | number:'1.2-2' }}</span>
                  </div>
                  <div class="summary-item">
                    <label>Vendor</label>
                    <span>{{ scmContract().vendorName || '—' }}</span>
                  </div>
                  <div class="summary-item">
                    <label>Financial Year</label>
                    <span>{{ scmContract().financialYear || '—' }}</span>
                  </div>
                  <div class="summary-item">
                    <label>Planned Start Date</label>
                    <span>{{ scmContract().plannedStartDate ? (scmContract().plannedStartDate | date:'dd MMM yyyy') : '—' }}</span>
                  </div>
                  <div class="summary-item">
                    <label>Planned End Date</label>
                    <span>{{ scmContract().plannedEndDate ? (scmContract().plannedEndDate | date:'dd MMM yyyy') : '—' }}</span>
                  </div>
                </div>
              }

              <h3 class="section-title" style="margin-top:28px">Documents</h3>
              <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px">
                <div class="doc-upload-box" [class.uploaded]="hasCompletionCert()">
                  <mat-icon>{{ hasCompletionCert() ? 'check_circle' : 'upload_file' }}</mat-icon>
                  <span>Completion Certificate (PDF)</span>
                  @if (!hasCompletionCert()) {
                    <label class="file-label">
                      <input type="file" accept=".pdf" (change)="onFileSelected($event, 'CompletionCertificate')" style="display:none">
                      Choose File
                    </label>
                  }
                </div>
                <div class="doc-upload-box" [class.uploaded]="hasBOQ()">
                  <mat-icon>{{ hasBOQ() ? 'check_circle' : 'upload_file' }}</mat-icon>
                  <span>Bill of Quantities (PDF)</span>
                  @if (!hasBOQ()) {
                    <label class="file-label">
                      <input type="file" accept=".pdf" (change)="onFileSelected($event, 'BillOfQuantities')" style="display:none">
                      Choose File
                    </label>
                  }
                </div>
                <div class="doc-upload-box">
                  <mat-icon>attach_file</mat-icon>
                  <span>Additional Document</span>
                  <label class="file-label">
                    <input type="file" (change)="onFileSelected($event, 'Other')" style="display:none">
                    Attach
                  </label>
                </div>
              </div>

              @if (docUploading()) {
                <div style="display:flex;align-items:center;gap:8px;color:#2563eb;margin-bottom:12px">
                  <mat-spinner diameter="20"></mat-spinner> <span>Uploading...</span>
                </div>
              }

              @if (documents().length > 0) {
                <table class="data-table" style="width:100%">
                  <thead>
                    <tr>
                      <th>Document Name</th>
                      <th>Type</th>
                      <th>Size (KB)</th>
                      <th>Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (doc of documents(); track doc.id) {
                      <tr>
                        <td>{{ doc.documentName }}</td>
                        <td>{{ doc.documentType }}</td>
                        <td>{{ doc.fileSizeKB }}</td>
                        <td>{{ doc.dateCaptured | date:'dd MMM yyyy' }}</td>
                        <td>
                          <button mat-icon-button (click)="downloadDocument(doc)" title="Download" style="color:#2563eb">
                            <mat-icon style="font-size:18px;width:18px;height:18px">download</mat-icon>
                          </button>
                          <button mat-icon-button (click)="deleteDocument(doc)" title="Delete" style="color:#dc2626">
                            <mat-icon style="font-size:18px;width:18px;height:18px">delete</mat-icon>
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              }

              @if (!hasCompletionCert() || !hasBOQ()) {
                <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 14px;margin-top:16px;font-size:13px;color:#92400e">
                  <mat-icon style="vertical-align:middle;font-size:16px;width:16px;height:16px;margin-right:4px">info</mat-icon>
                  Upload both mandatory documents (Completion Certificate + Bill of Quantities) before proceeding.
                </div>
              }

              <div style="display:flex;justify-content:flex-end;margin-top:24px">
                <button mat-raised-button color="primary" matStepperNext [disabled]="!hasCompletionCert() || !hasBOQ()">
                  Next: Asset Classification <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </div>
          </mat-step>

          <mat-step label="Asset Classification"
                    [completed]="canAccessCostDistribution()"
                    [editable]="true">
            <div class="step-content">
              <h2 class="tab-title">Asset Classification</h2>

              @if (isApproved()) {
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 16px;margin-bottom:16px;color:#16a34a;font-weight:500;font-size:13px">
                  <mat-icon style="vertical-align:middle;margin-right:6px;font-size:18px;width:18px;height:18px">lock</mat-icon>
                  Asset Classification is locked after approval and cannot be edited.
                </div>
              }

              <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
                <mat-form-field style="flex:1;max-width:500px" appearance="outline">
                  <mat-label>Main Asset Description</mat-label>
                  <input matInput [(ngModel)]="mainAssetDescription" placeholder="Enter main asset description" [readonly]="isApproved()">
                </mat-form-field>
                @if (!isApproved()) {
                  <button mat-stroked-button (click)="saveMainAssetDescription()">Save Description</button>
                }
              </div>

              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                <h3 class="section-title" style="margin:0">BOQ Items</h3>
                @if (!isApproved()) {
                  <div style="display:flex;gap:8px">
                    <button mat-stroked-button (click)="addBOQLine()" style="font-size:13px">
                      <mat-icon style="font-size:18px;width:18px;height:18px">add</mat-icon> Add Line
                    </button>
                    <button mat-stroked-button (click)="saveBOQItems()" style="font-size:13px">
                      <mat-icon style="font-size:18px;width:18px;height:18px">save</mat-icon> Save
                    </button>
                  </div>
                }
              </div>

              @if (boqLoading()) {
                <mat-spinner diameter="32" style="margin:16px auto"></mat-spinner>
              }

              @if (!boqLoading()) {
                <div style="overflow-x:auto">
                  <table class="data-table" style="min-width:900px;width:100%">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>UOM</th>
                        <th style="text-align:right;white-space:nowrap">Qty</th>
                        <th style="text-align:right;white-space:nowrap">Rate (R)</th>
                        <th style="text-align:right">Amount (R)</th>
                        <th>Group</th>
                        <th>Asset Item?</th>
                        <th>Asset Description</th>
                        <th>CIDMS Sub-Component</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of boqItems(); track item._idx) {
                        <tr>
                          <td>
                            <input class="inline-input" [(ngModel)]="item.description" placeholder="Description" [disabled]="isApproved()">
                          </td>
                          <td><input class="inline-input" [(ngModel)]="item.uoM" style="width:60px" placeholder="UOM" [disabled]="isApproved()"></td>
                          <td style="text-align:right"><input class="inline-input num-input" type="number" [(ngModel)]="item.quantity" (ngModelChange)="recalcAmount(item)" style="width:80px;text-align:right" [disabled]="isApproved()"></td>
                          <td style="text-align:right"><input class="inline-input num-input" type="number" [(ngModel)]="item.rate" (ngModelChange)="recalcAmount(item)" style="width:100px;text-align:right" [class.invalid]="item.rate === null || item.rate === undefined" [disabled]="isApproved()"></td>
                          <td style="text-align:right;font-weight:500">{{ (item.amount || 0) | number:'1.2-2' }}</td>
                          <td style="white-space:nowrap">
                            @if (item.boqGroupId != null) {
                              <span [style]="'display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:20px;border-radius:10px;padding:0 6px;background:' + groupColor(item.boqGroupId) + ';color:#fff;font-size:10px;font-weight:700;margin-right:4px'">G{{ item.boqGroupId }}</span>
                            }
                            @if (!isApproved()) {
                              <select class="inline-select" style="width:90px;font-size:11px" (change)="onBoqGroupSelectChange(item, $event)">
                                <option value="" [selected]="item.boqGroupId == null">— None —</option>
                                @for (gid of getExistingGroupIds(); track gid) {
                                  @if (isGroupAvailableForItem(item, gid)) {
                                    <option [value]="'' + gid" [selected]="item.boqGroupId === gid">Group {{ gid }}</option>
                                  }
                                }
                                <option value="new">+ New Group</option>
                              </select>
                            }
                          </td>
                          <td>
                            <select class="inline-select" [(ngModel)]="item.isAssetItem" (ngModelChange)="onIsAssetItemChange(item)" [disabled]="isApproved() || groupAlreadyHasAssetItem(item)">
                              <option [ngValue]="0">No</option>
                              <option [ngValue]="1">Yes</option>
                            </select>
                          </td>
                          <td>
                            @if (item.isAssetItem === 1) {
                              <input class="inline-input" [(ngModel)]="item.assetDescription" style="width:140px" placeholder="Asset Description" [disabled]="isApproved()">
                            }
                          </td>
                          <td>
                            @if (item.isAssetItem === 1) {
                              <div style="display:flex;gap:4px;align-items:center">
                                @if (hasCidmsSelection(item)) {
                                  <span style="font-size:11px;color:#1e293b;padding:3px 8px;background:#f0fdf4;border:1px solid #86efac;border-radius:4px;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-block" [title]="getCidmsDisplayLabel(item)">
                                    {{ getCidmsDisplayLabel(item) }}
                                  </span>
                                  <button type="button" (click)="clearItemCidms(item)" [disabled]="isApproved()" style="flex-shrink:0;padding:2px 6px;border:1px solid #fca5a5;border-radius:4px;background:#fff;color:#dc2626;font-size:11px;cursor:pointer;line-height:1.4">✕</button>
                                }
                                @if (!hasCidmsSelection(item)) {
                                  <button type="button" (click)="openCidmsPickerForItem(item)" [disabled]="isApproved()" style="font-size:11px;padding:3px 8px;border:1px solid #f87171;border-radius:4px;background:#f8fafc;color:#475569;cursor:pointer;white-space:nowrap">
                                    — Select CIDMS —
                                  </button>
                                }
                                @if (hasCidmsSelection(item)) {
                                  <button type="button" (click)="openCidmsPickerForItem(item)" [disabled]="isApproved()" style="flex-shrink:0;padding:2px 6px;border:1px solid #93c5fd;border-radius:4px;background:#eff6ff;color:#2563eb;font-size:11px;cursor:pointer">
                                    <mat-icon style="font-size:12px;width:12px;height:12px;vertical-align:middle">edit</mat-icon>
                                  </button>
                                }
                              </div>
                            }
                          </td>
                          <td>
                            @if (!isApproved()) {
                              <button mat-icon-button (click)="deleteBOQItem(item)" style="color:#dc2626">
                                <mat-icon style="font-size:18px;width:18px;height:18px">delete</mat-icon>
                              </button>
                            }
                          </td>
                        </tr>
                        @if (item.isAssetItem === 1 && item._chain) {
                          <tr class="cidms-chain-row">
                            <td colspan="10">
                              <div class="cidms-chain">
                                <span><strong>Accounting Group:</strong> {{ item._chain?.cidmsAccountingGroupDesc || '—' }}</span>
                                <span><strong>Sub Group:</strong> {{ item._chain?.cidmsAccountingSubGroupDesc || '—' }}</span>
                                <span><strong>Class:</strong> {{ item._chain?.cidmsClassDesc || '—' }}</span>
                                <span><strong>Group Type:</strong> {{ item._chain?.cidmsGroupTypeDesc || '—' }}</span>
                                <span><strong>CIDMS Asset Type:</strong> {{ item._chain?.cidmsAssetTypeDesc || '—' }}</span>
                                <span><strong>Component Type:</strong> {{ item._chain?.cidmsComponentTypeDesc || '—' }}</span>
                              </div>
                            </td>
                          </tr>
                        }
                        @if (item.isAssetItem === 1) {
                          <tr class="cidms-chain-row">
                            <td colspan="10">
                              <div style="display:flex;gap:10px;flex-wrap:wrap;padding:4px 0;align-items:center">
                                <div style="display:flex;flex-direction:column;gap:2px">
                                  <label style="font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase">Asset Type <span style="color:#dc2626">*</span></label>
                                  <select class="inline-select" [(ngModel)]="item.assetTypeId" (ngModelChange)="onAssetTypeChange(item)" style="width:150px" [class.invalid-select]="item.isAssetItem === 1 && !item.assetTypeId" [disabled]="isApproved()">
                                    <option [ngValue]="null">— Select —</option>
                                    @for (t of assetTypes(); track t.assetTypeId) {
                                      <option [ngValue]="t.assetTypeId">{{ t.assetTypeDesc }}</option>
                                    }
                                  </select>
                                </div>
                                <div style="display:flex;flex-direction:column;gap:2px">
                                  <label style="font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase">Category</label>
                                  <select class="inline-select" [(ngModel)]="item.assetCategoryId" (ngModelChange)="onCategoryChange(item)" style="width:150px" [disabled]="isApproved()">
                                    <option [ngValue]="null">— Select —</option>
                                    @for (c of getFilteredCategories(item.assetTypeId); track c.assetCategoryId) {
                                      <option [ngValue]="c.assetCategoryId">{{ c.assetCategoryDesc }}</option>
                                    }
                                  </select>
                                </div>
                                <div style="display:flex;flex-direction:column;gap:2px">
                                  <label style="font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase">Sub-Category</label>
                                  <select class="inline-select" [(ngModel)]="item.assetSubCategoryId" style="width:150px" [disabled]="isApproved()">
                                    <option [ngValue]="null">— Select —</option>
                                    @for (s of getFilteredSubCategories(item.assetCategoryId); track s.assetSubCategoryId) {
                                      <option [ngValue]="s.assetSubCategoryId">{{ s.assetSubCategoryDesc }}</option>
                                    }
                                  </select>
                                </div>
                                <div style="display:flex;flex-direction:column;gap:2px">
                                  <label style="font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase">Measurement Type</label>
                                  <select class="inline-select" [(ngModel)]="item.measurementTypeId" style="width:140px" [disabled]="isApproved()">
                                    <option [ngValue]="null">— Select —</option>
                                    @for (m of measurementTypes(); track m.measurementTypeId) {
                                      <option [ngValue]="m.measurementTypeId">{{ m.measurementTypeDesc }}</option>
                                    }
                                  </select>
                                </div>
                                <div style="display:flex;flex-direction:column;gap:2px">
                                  <label style="font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase">Asset Status</label>
                                  <select class="inline-select" [(ngModel)]="item.assetStatusId" style="width:140px" [disabled]="isApproved()">
                                    <option [ngValue]="null">— Select —</option>
                                    @for (s of assetStatuses(); track s.assetStatusId) {
                                      <option [ngValue]="s.assetStatusId">{{ s.assetStatusDesc }}</option>
                                    }
                                  </select>
                                </div>
                              </div>
                            </td>
                          </tr>
                        }
                      }
                      @if (boqItems().length === 0) {
                        <tr><td colspan="10" style="text-align:center;color:#94a3b8;padding:24px">No items. Click "Add Line" to add BOQ items.</td></tr>
                      }
                    </tbody>
                    @if (boqItems().length > 0) {
                      <tfoot>
                        <tr style="font-weight:700;background:#f8fafc">
                          <td colspan="4" style="text-align:right">Total:</td>
                          <td style="text-align:right">{{ boqTotal() | number:'1.2-2' }}</td>
                          <td colspan="4"></td>
                        </tr>
                      </tfoot>
                    }
                  </table>
                </div>
              }

              @if (getExistingGroupIds().length > 0) {
                <div style="margin-top:16px;padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
                  <div style="font-weight:600;font-size:13px;margin-bottom:8px;color:#374151">BOQ Groups Summary</div>
                  <div style="display:flex;flex-wrap:wrap;gap:10px">
                    @for (gid of getExistingGroupIds(); track gid) {
                      <div style="display:flex;align-items:center;gap:8px;padding:6px 12px;border-radius:6px;border:1px solid #e2e8f0;background:#fff">
                        <span [style.background]="groupColor(gid)" style="color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px">G{{gid}}</span>
                        <span style="font-size:12px;color:#374151">Total: <strong>{{ getGroupTotalAmount(gid) | number:'1.2-2' }}</strong></span>
                      </div>
                    }
                  </div>
                </div>
              }

              <div style="display:flex;justify-content:space-between;margin-top:24px">
                <button mat-stroked-button (click)="goToStep(0)">
                  <mat-icon>arrow_back</mat-icon> Back
                </button>
                <button mat-raised-button color="primary" (click)="calculateProjectCost()" [disabled]="isApproved()">
                  Calculate Project Cost <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </div>
          </mat-step>

          <mat-step label="Cost Distribution"
                    [completed]="canAccessCommissioning()"
                    [editable]="true">
            <div class="step-content">
              <h2 class="tab-title">Cost Distribution</h2>

              @if (costDistLoading()) {
                <mat-spinner diameter="32" style="margin:16px auto"></mat-spinner>
              }

              @if (!costDistLoading() && costDist()) {
                <div style="overflow-x:auto">
                  <table class="data-table" style="width:100%">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th style="text-align:right">Total Cost</th>
                        <th style="text-align:right">General Cost Dist.</th>
                        <th style="text-align:right">Total BOQ</th>
                        <th style="text-align:right">Actual Survey</th>
                        <th style="text-align:right">Unit Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (row of costDist().rows; track row.description) {
                        <tr>
                          <td>{{ row.description }}</td>
                          <td style="text-align:right">{{ (row.totalCost || 0) | number:'1.2-2' }}</td>
                          <td style="text-align:right">{{ (row.generalCostDistribution || 0) | number:'1.2-2' }}</td>
                          <td style="text-align:right">{{ (row.totalBoq || 0) | number:'1.2-2' }}</td>
                          <td style="text-align:right">
                            @if (row.cidmsSubComponentTypeId) {
                              @if (isApproved()) {
                                <span>{{ row.actualSurvey ?? '—' }}</span>
                              } @else {
                                <input class="inline-input num-input" type="number" [ngModel]="getSurveyValue(row.cidmsSubComponentTypeId)" (ngModelChange)="setSurveyValue(row.cidmsSubComponentTypeId, $event)" style="width:90px;text-align:right">
                              }
                            } @else {
                              <span>—</span>
                            }
                          </td>
                          <td style="text-align:right">
                            @if (row.cidmsSubComponentTypeId) {
                              {{ getComputedUnitCost(row) | number:'1.2-2' }}
                            } @else {
                              —
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                    <tfoot>
                      <tr style="font-weight:700;background:#f8fafc">
                        <td colspan="5" style="text-align:right">Total Project Cost:</td>
                        <td style="text-align:right">R {{ (costDist().totalProjectCost || 0) | number:'1.2-2' }}</td>
                      </tr>
                      <tr style="background:#f8fafc">
                        <td colspan="5" style="text-align:right">Actual Expenditure (Invoices):</td>
                        <td style="text-align:right">R {{ (costDist().actualExpenditure || 0) | number:'1.2-2' }}</td>
                      </tr>
                      <tr [style.background]="costDist().difference !== 0 ? '#fef2f2' : '#f0fdf4'">
                        <td colspan="5" style="text-align:right;font-weight:700">Difference:</td>
                        <td style="text-align:right;font-weight:700" [style.color]="costDist().difference !== 0 ? '#dc2626' : '#16a34a'">
                          R {{ (costDist().difference || 0) | number:'1.2-2' }}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                @if (costDist().difference !== 0 && !isApproved()) {
                  <div style="margin-top:16px">
                    <mat-form-field style="width:100%" appearance="outline">
                      <mat-label>Reason for Difference (mandatory)</mat-label>
                      <textarea matInput rows="3" [(ngModel)]="differenceComment" placeholder="Explain the difference between project cost and actual expenditure"></textarea>
                    </mat-form-field>
                  </div>
                }

                @if (isApproved()) {
                  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin-top:16px;color:#16a34a;font-weight:500">
                    <mat-icon style="vertical-align:middle;margin-right:6px">check_circle</mat-icon>
                    Cost Distribution approved on {{ project().unbundlingApprovedDate | date:'dd MMM yyyy' }}
                  </div>
                }

                @if (project().unbundlingStatus === 'Declined') {
                  <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;margin-top:16px;color:#dc2626">
                    <mat-icon style="vertical-align:middle;margin-right:6px">cancel</mat-icon>
                    Declined: {{ project().unbundlingComment }}
                  </div>
                }

                @if (!isApproved()) {
                  <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:20px">
                    @if (project().unbundlingStatus !== 'Submitted') {
                      <button mat-stroked-button (click)="submitForApproval()" [disabled]="actionLoading()">
                        Submit for Approval
                      </button>
                    }
                    <button mat-stroked-button color="warn" (click)="declineCostDist()" [disabled]="actionLoading()">
                      Decline
                    </button>
                    <button mat-raised-button color="primary" (click)="approveCostDist()" [disabled]="actionLoading() || !canApproveCostDist()">
                      @if (actionLoading()) {
                        <mat-spinner diameter="20" style="display:inline-block"></mat-spinner>
                      } @else {
                        Approve
                      }
                    </button>
                  </div>
                }
              }

              <div style="display:flex;justify-content:space-between;margin-top:24px">
                <button mat-stroked-button matStepperPrevious>
                  <mat-icon>arrow_back</mat-icon> Back
                </button>
                @if (isApproved()) {
                  <button mat-raised-button color="primary" matStepperNext>
                    Next: Commissioning <mat-icon>arrow_forward</mat-icon>
                  </button>
                }
              </div>
            </div>
          </mat-step>

          <mat-step label="Commissioning"
                    [completed]="isCommissioned()"
                    [editable]="true">
            <div class="step-content">
              <h2 class="tab-title">Commissioning</h2>

              @if (!canAccessCommissioning()) {
                <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;color:#92400e">
                  <mat-icon style="vertical-align:middle;margin-right:6px">lock</mat-icon>
                  Cost Distribution must be approved before commissioning.
                </div>
              }

              @if (canAccessCommissioning() && costDist()) {
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px;margin-bottom:18px">
                  <h4 style="margin:0 0 10px;font-size:13px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:.04em">mSCOA Configuration</h4>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 24px">
                    <div>
                      <div style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">Planning Project</div>
                      <div style="font-size:14px;color:#1e293b;font-weight:500">{{ project()?.planningProjectName || '—' }}</div>
                    </div>
                    <div>
                      <div style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">SCOA Item</div>
                      <div style="font-size:14px;color:#1e293b;font-weight:500">
                        @if (project()?.scoaCode) {
                          {{ project()?.scoaCode }} — {{ project()?.scoaShortDesc }}
                        } @else {
                          —
                        }
                      </div>
                    </div>
                  </div>
                </div>

                <h3 class="section-title">Asset Commissioning Summary</h3>
                <div style="overflow-x:auto">
                <table class="data-table" style="min-width:900px;width:100%">
                  <thead>
                    <tr>
                      <th>CIDMS Sub-Component Type</th>
                      <th>Asset Type</th>
                      <th>Category / Sub-Category</th>
                      <th style="text-align:right">Asset Count</th>
                      <th style="text-align:right">Unit Cost (R)</th>
                      <th style="text-align:right">Total Asset Cost (R)</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of getCommissioningRows(); track $index) {
                      <tr>
                        <td>{{ row.description }}</td>
                        <td>{{ row.assetTypeDesc || '—' }}</td>
                        <td>{{ row.assetCategoryDesc || '—' }}{{ row.assetSubCategoryDesc ? ' / ' + row.assetSubCategoryDesc : '' }}</td>
                        <td style="text-align:right">{{ row._surveyCount || '—' }}</td>
                        <td style="text-align:right">{{ (row._unitCost || 0) | number:'1.2-2' }}</td>
                        <td style="text-align:right">{{ ((row._surveyCount || 0) * (row._unitCost || 0)) | number:'1.2-2' }}</td>
                      </tr>
                    }
                    @if (getCommissioningRows().length === 0) {
                      <tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:24px">No asset groups found</td></tr>
                    }
                  </tbody>
                  <tfoot>
                    <tr style="font-weight:700;background:#f8fafc">
                      <td colspan="5" style="text-align:right">Total Project Cost:</td>
                      <td style="text-align:right">R {{ (costDist().totalProjectCost || 0) | number:'1.2-2' }}</td>
                    </tr>
                  </tfoot>
                </table>
                </div>

                @if (isCommissioned()) {
                  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin-top:16px;color:#16a34a;font-weight:500">
                    <mat-icon style="vertical-align:middle;margin-right:6px">check_circle</mat-icon>
                    Project has been commissioned. {{ project().projectComplete ? 'Assets have been generated.' : '' }}
                  </div>
                }

                @if (!isCommissioned()) {
                  <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:20px">
                    <button mat-stroked-button color="warn" (click)="declineCommission()" [disabled]="actionLoading()">
                      Decline
                    </button>
                    <button mat-raised-button color="primary" (click)="approveCommission()" [disabled]="actionLoading()">
                      @if (actionLoading()) {
                        <mat-spinner diameter="20" style="display:inline-block"></mat-spinner>
                      }
                      @if (!actionLoading()) {
                        Approve &amp; Commission
                      }
                    </button>
                  </div>
                }

                @if (isCommissioned()) {
                  <div style="display:flex;justify-content:flex-end;margin-top:24px">
                    <button mat-raised-button color="primary" (click)="goToStep(4)">
                      View Managed Assets <mat-icon>arrow_forward</mat-icon>
                    </button>
                  </div>
                }
              }

              <div style="margin-top:24px">
                <button mat-stroked-button matStepperPrevious>
                  <mat-icon>arrow_back</mat-icon> Back
                </button>
              </div>
            </div>
          </mat-step>

          <mat-step label="Manage Assets">
            <div class="step-content">
              <h2 class="tab-title">Manage Assets</h2>

              @if (!canAccessManageAssets()) {
                <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;color:#92400e">
                  <mat-icon style="vertical-align:middle;margin-right:6px">lock</mat-icon>
                  Project must be commissioned before managing assets.
                </div>
              }

              @if (canAccessManageAssets()) {
                <div style="display:flex;gap:8px;margin-bottom:16px">
                  <button mat-stroked-button (click)="downloadAssetsCsv()">
                    <mat-icon style="font-size:18px;width:18px;height:18px">download</mat-icon> Download CSV
                  </button>
                  <label mat-stroked-button style="display:inline-flex;align-items:center;gap:4px;cursor:pointer;border:1px solid rgba(0,0,0,.12);border-radius:4px;padding:0 15px;height:36px;font-size:14px">
                    <mat-icon style="font-size:18px;width:18px;height:18px">upload</mat-icon> Upload CSV
                    <input type="file" accept=".csv" (change)="onCsvSelected($event)" style="display:none">
                  </label>
                </div>

                @if (assetsLoading()) {
                  <mat-spinner diameter="32" style="margin:16px auto"></mat-spinner>
                }

                @if (!assetsLoading()) {
                  <table class="data-table" style="width:100%">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Description</th>
                        <th>Asset Type</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th style="text-align:right">Current Value (R)</th>
                        <th>Date Captured</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (asset of generatedAssets(); track asset.assetRegisterItemId) {
                        <tr (click)="selectAssetForEdit(asset)" style="cursor:pointer"
                            [style.background]="selectedAsset() && selectedAsset().assetRegisterItemId === asset.assetRegisterItemId ? '#eff6ff' : ''">
                          <td>{{ asset.assetRegisterItemId }}</td>
                          <td>{{ asset.description }}</td>
                          <td>{{ asset.assetTypeDesc || '—' }}</td>
                          <td>{{ asset.assetCategoryDesc || '—' }}</td>
                          <td>{{ asset.assetStatusDesc || '—' }}</td>
                          <td style="text-align:right">{{ (asset.currentAmount || 0) | number:'1.2-2' }}</td>
                          <td>{{ asset.dateCaptured | date:'dd MMM yyyy' }}</td>
                        </tr>
                      }
                      @if (generatedAssets().length === 0) {
                        <tr><td colspan="7" style="text-align:center;color:#94a3b8;padding:24px">No assets generated yet.</td></tr>
                      }
                    </tbody>
                  </table>
                }

                @if (uploadErrors().length > 0) {
                  <div style="margin-top:16px">
                    <h4 style="color:#dc2626;margin:0 0 8px">Upload Errors:</h4>
                    @for (err of uploadErrors(); track err) {
                      <div style="color:#dc2626;font-size:13px">{{ err }}</div>
                    }
                  </div>
                }
              }

              @if (selectedAsset()) {
                <div style="margin-top:24px;background:#fff;border:2px solid #3b82f6;border-radius:12px;padding:24px">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                    <h3 style="font-size:15px;font-weight:600;color:#1e293b;margin:0;display:flex;align-items:center;gap:8px">
                      <mat-icon style="color:#3b82f6;font-size:20px">edit</mat-icon>
                      Edit Asset — ID {{ selectedAsset().assetRegisterItemId }}: {{ selectedAsset().description }}
                    </h3>
                    <div style="display:flex;gap:4px;flex-wrap:wrap">
                      @for (s of aEditSteps; track s.key) {
                        <button (click)="aEditStep = s.key"
                          [style.background]="aEditStep === s.key ? '#0f2b46' : '#f1f5f9'"
                          [style.color]="aEditStep === s.key ? 'white' : '#64748b'"
                          style="padding:6px 14px;border-radius:6px;font-size:12px;font-weight:500;border:1px solid #e2e8f0;cursor:pointer">
                          {{s.label}}
                        </button>
                      }
                    </div>
                  </div>
                  @if (selectedAssetLoading()) {
                    <div style="text-align:center;padding:32px"><mat-spinner diameter="32" style="margin:0 auto"></mat-spinner></div>
                  }
                  @if (!selectedAssetLoading()) {
                    @if (aEditStep === 'details') {
                      <div style="margin-bottom:8px;font-size:13px;font-weight:600;color:#0f2b46;border-bottom:2px solid #0f2b46;padding-bottom:6px">Asset Details</div>
                      <div style="margin:10px 0 6px;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.5px">IDs &amp; Reference</div>
                      <div class="edit-grid">
                        <div class="edit-field">
                          <label>Asset Register ID</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;background:#f8fafc;color:#64748b;box-sizing:border-box" [value]="selectedAsset().assetRegisterItemId" readonly />
                        </div>
                        <div class="edit-field">
                          <label>Parent Asset Register ID</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.parentAssetId" />
                        </div>
                        <div class="edit-field">
                          <label>Municipal Asset ID</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;background:#f8fafc;color:#64748b;box-sizing:border-box" [value]="aef.municipalAssetId || ''" readonly />
                        </div>
                        <div class="edit-field">
                          <label>Barcode</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.barcode" />
                        </div>
                        <div class="edit-field">
                          <label>Old Barcode</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;background:#f8fafc;color:#64748b;box-sizing:border-box" [value]="aef.oldBarcode || ''" readonly />
                        </div>
                        <div class="edit-field" style="grid-column:span 3">
                          <label>Asset Description *</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.description" />
                        </div>
                      </div>
                      <div style="margin:10px 0 6px;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.5px">Classification Hierarchy</div>
                      <div class="edit-grid">
                        <div class="edit-field">
                          <label>Asset Type *</label>
                          <select style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [ngModel]="aef.editTypeId" (ngModelChange)="onAEditTypeChange($event)">
                            <option [ngValue]="0">Select type...</option>
                            @for (t of assetTypes(); track t.assetType_ID) { <option [ngValue]="t.assetType_ID">{{t.assetTypeDesc}}</option> }
                          </select>
                        </div>
                        <div class="edit-field">
                          <label>Category *</label>
                          <select style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [ngModel]="aef.editCategoryId" (ngModelChange)="onAEditCategoryChange($event)" [disabled]="!aef.editTypeId">
                            <option [ngValue]="0">Select category...</option>
                            @for (c of aFilteredCategories(); track c.assetCategoryID) { <option [ngValue]="c.assetCategoryID">{{c.assetCategoryDesc}}</option> }
                          </select>
                        </div>
                        <div class="edit-field">
                          <label>Sub-Category</label>
                          <select style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [ngModel]="aef.editSubCategoryId" (ngModelChange)="onAEditSubCategoryChange($event)" [disabled]="!aef.editCategoryId">
                            <option [ngValue]="0">Select sub-category...</option>
                            @for (sc of aFilteredSubCategories(); track sc.asset_SubCategory_ID) { <option [ngValue]="sc.asset_SubCategory_ID">{{sc.asset_SubCategoryDescription}}</option> }
                          </select>
                        </div>
                        <div class="edit-field" style="grid-column:span 3">
                          <label>Asset Class</label>
                          <select style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [ngModel]="aef.editClassId" (ngModelChange)="onAEditClassChange($event)" [disabled]="!aef.editTypeId || !aef.editCategoryId">
                            <option [ngValue]="0">{{getAClassPlaceholder()}}</option>
                            @for (cls of aFilteredClasses(); track cls.assetClass_ID) { <option [ngValue]="cls.assetClass_ID">{{cls.assetClassDesc}} ({{cls.usefulLifeInMonths}} months)</option> }
                          </select>
                        </div>
                      </div>
                      @if (aNoClassMessage()) {
                        <div style="margin:8px 0;padding:10px 14px;background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;font-size:13px;color:#92400e">
                          <mat-icon style="color:#d97706;font-size:18px;vertical-align:middle;margin-right:4px">warning</mat-icon>
                          {{aNoClassMessage()}}
                        </div>
                      }
                      <div style="margin:10px 0 6px;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.5px">Status &amp; Conditions</div>
                      <div class="edit-grid" style="grid-template-columns:1fr 1fr 1fr 1fr">
                        <div class="edit-field">
                          <label>Asset Status</label>
                          <select style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [ngModel]="aef.editStatusId" (ngModelChange)="aef.editStatusId=$event">
                            <option [ngValue]="0">Select...</option>
                            @for (s of assetStatuses(); track s.assetStatus_ID) { <option [ngValue]="s.assetStatus_ID">{{s.assetStatusDesc}}</option> }
                          </select>
                        </div>
                        <div class="edit-field">
                          <label>Measurement Type</label>
                          <select style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [ngModel]="aef.editMeasurementTypeId" (ngModelChange)="aef.editMeasurementTypeId=$event">
                            <option [ngValue]="0">Select...</option>
                            @for (mt of measurementTypes(); track mt.assetConfig_MeasurementType_ID) { <option [ngValue]="mt.assetConfig_MeasurementType_ID">{{mt.name}}</option> }
                          </select>
                        </div>
                        <div class="edit-field">
                          <label>Financial Status</label>
                          <select style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [ngModel]="aef.editFinancialStatusId" (ngModelChange)="aef.editFinancialStatusId=$event">
                            <option [ngValue]="0">Select...</option>
                            @for (fs of aFinancialStatuses(); track fs.id) { <option [ngValue]="fs.id">{{fs.description}}</option> }
                          </select>
                        </div>
                        <div class="edit-field">
                          <label>Asset Condition</label>
                          <select style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [ngModel]="aef.editConditionId" (ngModelChange)="aef.editConditionId=$event">
                            <option [ngValue]="0">Select...</option>
                            @for (c of aAssetConditions(); track c.asset_Condition_ID) { <option [ngValue]="c.asset_Condition_ID">{{c.description}}</option> }
                          </select>
                        </div>
                      </div>
                      <div style="margin:10px 0 6px;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.5px">CIDMS Classification</div>
                      <div class="edit-grid">
                        <div class="edit-field">
                          <label>CIDMS Sub Component Type</label>
                          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
                            @if (aef.editCidmsSubComponentTypeId || aef.cidmsComponentType || aef.cidmsAccountingGroup || aef.cidmsAssetType) {
                              <span style="font-size:12px;color:#1e293b;padding:5px 10px;background:#f0fdf4;border:1px solid #86efac;border-radius:6px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" [title]="aef.editCidmsSubComponentTypeDesc || aef.cidmsComponentType || aef.cidmsAssetType || aef.cidmsAccountingGroup || ''">
                                {{ aef.editCidmsSubComponentTypeDesc || aef.cidmsComponentType || aef.cidmsAssetType || aef.cidmsAssetGroupType || aef.cidmsAssetClass || aef.cidmsSubAccountingGroup || aef.cidmsAccountingGroup || ('ID: ' + aef.editCidmsSubComponentTypeId) }}
                              </span>
                              <button type="button" (click)="aef.editCidmsSubComponentTypeId = 0; aef.editCidmsSubComponentTypeDesc = ''; aef.cidmsComponentTypeId = 0; aef.cidmsAccountingGroupId = 0; aef.cidmsSubAccountingGroupId = 0; aef.cidmsAssetClassId = 0; aef.cidmsAssetGroupTypeId = 0; aef.cidmsAssetTypeId = 0; aef.cidmsComponentType = ''; aef.cidmsAccountingGroup = ''; aef.cidmsSubAccountingGroup = ''; aef.cidmsAssetClass = ''; aef.cidmsAssetGroupType = ''; aef.cidmsAssetType = ''" style="flex-shrink:0;padding:4px 8px;border:1px solid #fca5a5;border-radius:6px;background:#fff;color:#dc2626;font-size:12px;cursor:pointer">Clear</button>
                            }
                            @if (!aef.editCidmsSubComponentTypeId && !aef.cidmsComponentType && !aef.cidmsAccountingGroup && !aef.cidmsAssetType) {
                              <span style="font-size:12px;color:#94a3b8;padding:5px 10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;flex:1">— Not selected —</span>
                            }
                            <button type="button" (click)="openCidmsPickerForAsset()" style="flex-shrink:0;display:inline-flex;align-items:center;gap:4px;padding:5px 12px;border:1px solid #0f2b46;border-radius:6px;background:#0f2b46;color:#fff;font-size:12px;cursor:pointer">
                              <mat-icon style="font-size:14px;width:14px;height:14px">account_tree</mat-icon>
                              Select...
                            </button>
                          </div>
                        </div>
                        <div class="edit-field">
                          <label>CIDMS Component Type</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;background:#f8fafc;color:#64748b;box-sizing:border-box" [value]="aef.cidmsComponentType || ''" readonly />
                        </div>
                        <div class="edit-field">
                          <label>CIDMS Accounting Group</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;background:#f8fafc;color:#64748b;box-sizing:border-box" [value]="aef.cidmsAccountingGroup || ''" readonly />
                        </div>
                        <div class="edit-field">
                          <label>CIDMS Sub Accounting Group</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;background:#f8fafc;color:#64748b;box-sizing:border-box" [value]="aef.cidmsSubAccountingGroup || ''" readonly />
                        </div>
                        <div class="edit-field">
                          <label>CIDMS Asset Class</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;background:#f8fafc;color:#64748b;box-sizing:border-box" [value]="aef.cidmsAssetClass || ''" readonly />
                        </div>
                        <div class="edit-field">
                          <label>CIDMS Group Type</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;background:#f8fafc;color:#64748b;box-sizing:border-box" [value]="aef.cidmsAssetGroupType || ''" readonly />
                        </div>
                        <div class="edit-field">
                          <label>CIDMS Asset Type</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;background:#f8fafc;color:#64748b;box-sizing:border-box" [value]="aef.cidmsAssetType || ''" readonly />
                        </div>
                        <div class="edit-field">
                          <label>Nature of Addition</label>
                          <select style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.natureOfAddition">
                            <option value="">Select...</option>
                            <option value="Purchase">Purchase</option>
                            <option value="Donation">Donation</option>
                            <option value="Transfer from WIP">Transfer from WIP</option>
                            <option value="Construction">Construction</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div class="edit-field">
                          <label>Cash / Non-Cash Generating</label>
                          <select style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.cashGenerating">
                            <option value="">Select...</option>
                            <option value="Yes">Yes - Cash Generating</option>
                            <option value="No">No - Non-Cash Generating</option>
                          </select>
                        </div>
                        <div class="edit-field">
                          <label>Basic Municipal Service</label>
                          <select style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.basicMunicipalityService">
                            <option value="">Select...</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </div>
                      </div>
                      <div style="margin:10px 0 6px;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.5px">Key Dates</div>
                      <div class="edit-grid" style="grid-template-columns:1fr 1fr 1fr 1fr">
                        <div class="edit-field">
                          <label>Acquisition Date</label>
                          <input type="date" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.acquisitionDate" />
                        </div>
                        <div class="edit-field">
                          <label>Commissioning Date</label>
                          <input type="date" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.commissioningDate" />
                        </div>
                        <div class="edit-field">
                          <label>In Service Date</label>
                          <input type="date" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.inServiceDate" />
                        </div>
                        <div class="edit-field">
                          <label>Year Constructed</label>
                          <input type="number" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.yearConstructed" min="1900" max="2030" />
                        </div>
                      </div>
                      <div style="margin:10px 0 6px;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.5px">Useful Life</div>
                      <div class="edit-grid" style="grid-template-columns:1fr 1fr">
                        <div class="edit-field">
                          <label>Useful Life (Total Months)</label>
                          <input type="number" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.usefulLifeTotal" min="0" />
                        </div>
                        <div class="edit-field">
                          <label>Remaining Useful Life (Months)</label>
                          <input type="number" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.remainingUsefulLifeTotal" min="0" />
                        </div>
                      </div>
                      <div style="margin:10px 0 6px;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.5px">Dimensions &amp; Physical</div>
                      <div class="edit-grid" style="grid-template-columns:1fr 1fr 1fr 1fr">
                        <div class="edit-field">
                          <label>UOM</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.uom" />
                        </div>
                        <div class="edit-field">
                          <label>Quantity</label>
                          <input type="number" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.quantity" />
                        </div>
                        <div class="edit-field">
                          <label>Construction Material</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.constructionMaterial" />
                        </div>
                        <div class="edit-field">
                          <label>Capacity</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.capacity" />
                        </div>
                      </div>
                    }
                    @if (aEditStep === 'financial') {
                      <div style="margin-bottom:8px;font-size:13px;font-weight:600;color:#0f2b46;border-bottom:2px solid #0f2b46;padding-bottom:6px">Financial Information</div>
                      <div style="margin:10px 0 6px;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.5px">Cost &amp; Depreciation</div>
                      <div class="edit-grid">
                        <div class="edit-field">
                          <label>Acquisition / Purchase Cost (R)</label>
                          <input type="number" step="0.01" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.acquisitionCost" />
                        </div>
                        <div class="edit-field">
                          <label>Residual Value (R)</label>
                          <input type="number" step="0.01" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.residualValue" />
                        </div>
                        <div class="edit-field">
                          <label>Depreciation - Current Year (R)</label>
                          <input type="number" step="0.01" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.depreciationCurrentYear" />
                        </div>
                        <div class="edit-field">
                          <label>Depreciation Offset (R)</label>
                          <input type="number" step="0.01" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.depreciationOffset" />
                        </div>
                        <div class="edit-field">
                          <label>Deemed Cost (R)</label>
                          <input type="number" step="0.01" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.deemedCost" />
                        </div>
                      </div>
                      <div style="margin:10px 0 6px;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.5px">Impairment</div>
                      <div class="edit-grid" style="grid-template-columns:1fr 1fr 1fr">
                        <div class="edit-field">
                          <label>Impairment - Current Year (R)</label>
                          <input type="number" step="0.01" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.impairmentCurrentYear" />
                        </div>
                        <div class="edit-field">
                          <label>Reversal of Impairment Loss (R)</label>
                          <input type="number" step="0.01" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.impairmentReversalAmount" />
                        </div>
                        <div class="edit-field">
                          <label>Impairment Date</label>
                          <input type="date" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.impairmentDate" />
                        </div>
                      </div>
                      <div style="margin:10px 0 6px;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.5px">Revaluation</div>
                      <div class="edit-grid" style="grid-template-columns:1fr 1fr 1fr">
                        <div class="edit-field">
                          <label>Revaluation Date</label>
                          <input type="date" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.revaluationDate" />
                        </div>
                        <div class="edit-field">
                          <label>Movement in Revaluation Reserve (R)</label>
                          <input type="number" step="0.01" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.movementInRevaluationReserve" />
                        </div>
                        <div class="edit-field">
                          <label>Revaluation Reserve Closing Balance (R)</label>
                          <input type="number" step="0.01" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.revaluationReserveClosingBalance" />
                        </div>
                      </div>
                      <div style="margin:10px 0 6px;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.5px">Replacement Cost</div>
                      <div class="edit-grid" style="grid-template-columns:1fr 1fr 1fr">
                        <div class="edit-field">
                          <label>Current Replacement Cost (CRC) (R)</label>
                          <input type="number" step="0.01" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.currentReplacementCost" />
                        </div>
                        <div class="edit-field">
                          <label>Depreciated Replacement Cost (DRC) (R)</label>
                          <input type="number" step="0.01" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.depreciatedReplacementCost" />
                        </div>
                        <div class="edit-field">
                          <label>Annual Maintenance Budget Need (R)</label>
                          <input type="number" step="0.01" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.annualMaintenanceBudgetNeed" />
                        </div>
                      </div>
                      <div style="margin:10px 0 6px;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.5px">Funding Source</div>
                      <div class="edit-grid" style="grid-template-columns:1fr 1fr 1fr">
                        <div class="edit-field">
                          <label>Funding Source Amount (R)</label>
                          <input type="number" step="0.01" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.fundingSourceAmount" />
                        </div>
                        <div class="edit-field">
                          <label>Funding Source Number</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.fundingSourceNumber" />
                        </div>
                        <div class="edit-field">
                          <label>Funding Source Type</label>
                          <select style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.fundType">
                            <option value="">Select...</option>
                            <option value="CRR">CRR - Capital Replacement Reserve</option>
                            <option value="OWN">Own Funding</option>
                            <option value="GRANT">Government Grant</option>
                            <option value="LOAN">External Loan</option>
                            <option value="MIG">MIG - Municipal Infrastructure Grant</option>
                            <option value="DONOR">Donor Funded</option>
                            <option value="PPP">Public Private Partnership</option>
                          </select>
                        </div>
                      </div>
                      <div style="margin:10px 0 6px;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.5px">Insurance &amp; Warranty</div>
                      <div class="edit-grid" style="grid-template-columns:1fr 1fr 1fr 1fr">
                        <div class="edit-field">
                          <label>Insurance Cover</label>
                          <select style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.insuranceCover">
                            <option value="">Select...</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </div>
                        <div class="edit-field">
                          <label>Insured Amount (R)</label>
                          <input type="number" step="0.01" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.insuredAmount" />
                        </div>
                        <div class="edit-field">
                          <label>Insurance Policy No</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.insurancePolicyNo" />
                        </div>
                        <div class="edit-field">
                          <label>Warranty</label>
                          <select style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.warranty">
                            <option value="">Select...</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </div>
                      </div>
                    }
                    @if (aEditStep === 'ownership') {
                      <div style="margin-bottom:8px;font-size:13px;font-weight:600;color:#0f2b46;border-bottom:2px solid #0f2b46;padding-bottom:6px">Asset Ownership</div>
                      <div style="margin:10px 0 6px;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.5px">Department &amp; Custodian</div>
                      <div class="edit-grid">
                        <div class="edit-field">
                          <label>Department</label>
                          <select style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [ngModel]="aef.editDepartmentId" (ngModelChange)="aef.editDepartmentId=$event">
                            <option [ngValue]="0">Select department...</option>
                            @for (d of aDepartments(); track d.id) { <option [ngValue]="d.id">{{d.description}}</option> }
                          </select>
                        </div>
                        <div class="edit-field">
                          <label>Division</label>
                          <select style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [ngModel]="aef.divisionId" (ngModelChange)="aef.divisionId=$event">
                            <option [ngValue]="0">Select division...</option>
                            @for (dv of aDivisions(); track dv.id) { <option [ngValue]="dv.id">{{dv.description}}</option> }
                          </select>
                        </div>
                        <div class="edit-field">
                          <label>Custodian (Employee)</label>
                          <select style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [ngModel]="aef.editCustodianId" (ngModelChange)="aef.editCustodianId=$event">
                            <option [ngValue]="0">Select custodian...</option>
                            @for (e of aEmployees(); track e.employeeId) { <option [ngValue]="e.employeeId">{{e.firstName}} {{e.surname}} ({{e.empCode}})</option> }
                          </select>
                        </div>
                        <div class="edit-field">
                          <label>Custodian ID Number</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.custodianIdNumber" />
                        </div>
                        <div class="edit-field">
                          <label>Asset Ownership</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.assetOwnership" />
                        </div>
                      </div>
                      <div style="margin:10px 0 6px;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.5px">Identification &amp; Serial Numbers</div>
                      <div class="edit-grid">
                        <div class="edit-field">
                          <label>Serial Number</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.serialNumber" />
                        </div>
                        <div class="edit-field">
                          <label>Registration Number</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.registrationNumber" />
                        </div>
                        <div class="edit-field">
                          <label>Unit Number</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.unitNumber" />
                        </div>
                        <div class="edit-field">
                          <label>Make</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.make" />
                        </div>
                        <div class="edit-field">
                          <label>Model</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.model" />
                        </div>
                      </div>
                      <div style="margin:10px 0 6px;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.5px">Property / Land Details</div>
                      <div class="edit-grid" style="grid-template-columns:1fr 1fr 1fr 1fr">
                        <div class="edit-field">
                          <label>Deed Number</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.deedNumber" />
                        </div>
                        <div class="edit-field">
                          <label>Erf / Farm Number</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.erfNumber" />
                        </div>
                        <div class="edit-field">
                          <label>Portion Number</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.portionNumber" />
                        </div>
                        <div class="edit-field">
                          <label>Erf Size (m²)</label>
                          <input type="number" step="0.01" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.erfSize" />
                        </div>
                      </div>
                      <div style="margin:10px 0 6px;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.5px">Supplier</div>
                      <div class="edit-grid" style="grid-template-columns:1fr 1fr">
                        <div class="edit-field">
                          <label>Supplier Name</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.supplierName" />
                        </div>
                        <div class="edit-field">
                          <label>Supplier Code</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.supplierCode" />
                        </div>
                      </div>
                    }
                    @if (aEditStep === 'location') {
                      <div style="margin-bottom:8px;font-size:13px;font-weight:600;color:#0f2b46;border-bottom:2px solid #0f2b46;padding-bottom:6px">Asset Location</div>
                      <div style="margin:10px 0 6px;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.5px">GIS / Coordinates</div>
                      <div class="edit-grid" style="grid-template-columns:1fr 1fr 1fr 1fr">
                        <div class="edit-field">
                          <label>Latitude</label>
                          <input type="number" step="0.000001" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.latitude" />
                        </div>
                        <div class="edit-field">
                          <label>Longitude</label>
                          <input type="number" step="0.000001" style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.longitude" />
                        </div>
                        <div class="edit-field">
                          <label>GIS Feature</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.gisFeature" />
                        </div>
                        <div class="edit-field">
                          <label>Well Known Text (WKT)</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.wellKnownText" />
                        </div>
                      </div>
                      <div style="margin:10px 0 6px;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.5px">Address</div>
                      <div class="edit-grid">
                        <div class="edit-field">
                          <label>Town</label>
                          <select style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [ngModel]="aef.editTownId" (ngModelChange)="onAEditTownChange($event)">
                            <option [ngValue]="0">Select town...</option>
                            @for (t of aTowns(); track t.id) { <option [ngValue]="t.id">{{t.description}}</option> }
                          </select>
                        </div>
                        <div class="edit-field">
                          <label>Suburb</label>
                          <select style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [ngModel]="aef.editSuburbId" (ngModelChange)="onAEditSuburbChange($event)" [disabled]="!aef.editTownId">
                            <option [ngValue]="0">Select suburb...</option>
                            @for (s of aSuburbs(); track s.id) { <option [ngValue]="s.id">{{s.description}}</option> }
                          </select>
                        </div>
                        <div class="edit-field">
                          <label>Ward</label>
                          <select style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [ngModel]="aef.editWardId" (ngModelChange)="aef.editWardId=$event">
                            <option [ngValue]="0">Select ward...</option>
                            @for (w of aWards(); track w.id) { <option [ngValue]="w.id">{{w.description}}</option> }
                          </select>
                        </div>
                        <div class="edit-field">
                          <label>Street Address</label>
                          <select style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [ngModel]="aef.editStreetId" (ngModelChange)="onAEditStreetChange($event)" [disabled]="!aef.editSuburbId">
                            <option [ngValue]="0">Select street...</option>
                            @for (st of aStreets(); track st.id) { <option [ngValue]="st.id">{{st.description}}</option> }
                          </select>
                        </div>
                        <div class="edit-field">
                          <label>Building</label>
                          <select style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [ngModel]="aef.editBuildingId" (ngModelChange)="onAEditBuildingChange($event)" [disabled]="!aef.editStreetId">
                            <option [ngValue]="0">Select building...</option>
                            @for (b of aBuildings(); track b.id) { <option [ngValue]="b.id">{{b.description}}</option> }
                          </select>
                        </div>
                        <div class="edit-field">
                          <label>Floor Area</label>
                          <select style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [ngModel]="aef.editFloorId" (ngModelChange)="onAEditFloorChange($event)" [disabled]="!aef.editBuildingId">
                            <option [ngValue]="0">Select floor...</option>
                            @for (f of aFloors(); track f.id) { <option [ngValue]="f.id">{{f.description}}</option> }
                          </select>
                        </div>
                        <div class="edit-field">
                          <label>Room</label>
                          <select style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [ngModel]="aef.editRoomId" (ngModelChange)="aef.editRoomId=$event" [disabled]="!aef.editFloorId">
                            <option [ngValue]="0">Select room...</option>
                            @for (r of aRooms(); track r.id) { <option [ngValue]="r.id">{{r.description}}</option> }
                          </select>
                        </div>
                      </div>
                      <div style="margin:10px 0 6px;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.5px">Additional Information</div>
                      <div class="edit-grid">
                        <div class="edit-field">
                          <label>Invoice No</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.invoiceNo" />
                        </div>
                        <div class="edit-field">
                          <label>Location Description</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.locationDescription" />
                        </div>
                        <div class="edit-field">
                          <label>Funding Description</label>
                          <input style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;box-sizing:border-box" [(ngModel)]="aef.fundingDescription" />
                        </div>
                      </div>
                      <div style="margin:10px 0 6px;font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:0.5px">Reason for Change</div>
                      <div>
                        <label style="font-size:12px;font-weight:500;color:#374151;display:block;margin-bottom:4px">
                          Reason for Change * <span style="font-size:11px;color:#ef4444;font-weight:400">(required before saving)</span>
                        </label>
                        <textarea style="width:100%;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;min-height:60px;resize:vertical;box-sizing:border-box" [(ngModel)]="aef.reasonForChange"></textarea>
                      </div>
                    }
                    <div style="display:flex;gap:8px;justify-content:space-between;margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0">
                      <button mat-stroked-button (click)="clearSelectedAsset()">
                        <mat-icon>close</mat-icon> Close
                      </button>
                      <div style="display:flex;gap:8px">
                        @if (aEditStep !== 'details') {
                          <button mat-stroked-button (click)="prevAEditStep()">
                            <mat-icon>arrow_back</mat-icon> Previous
                          </button>
                        }
                        @if (aEditStep !== 'location') {
                          <button mat-flat-button style="background:#3b82f6;color:white" (click)="nextAEditStep()">
                            Next <mat-icon>arrow_forward</mat-icon>
                          </button>
                        }
                        @if (aEditStep === 'location') {
                          <button mat-flat-button style="background:#0f2b46;color:white" [disabled]="aEditSaving()" (click)="saveAssetEdit()">
                            @if (aEditSaving()) { <span>Saving...</span> }
                            @if (!aEditSaving()) { <span><mat-icon style="font-size:18px;width:18px;height:18px;vertical-align:middle">save</mat-icon> Save Asset</span> }
                          </button>
                        }
                      </div>
                    </div>
                  }
                </div>
              }

              <div style="margin-top:24px">
                <button mat-stroked-button matStepperPrevious>
                  <mat-icon>arrow_back</mat-icon> Back
                </button>
              </div>
            </div>
          </mat-step>

        </mat-stepper>
      </div>
    }

    <app-cidms-picker [isOpen]="showCidmsPicker()" (selected)="onCidmsPickerSelected($event)" (closed)="showCidmsPicker.set(false)"></app-cidms-picker>
  `,
  styles: [`
    .page-tabs { display:flex; gap:0; margin-bottom:20px; border-bottom:2px solid #e2e8f0; }
    .page-tab {
      display:inline-flex; align-items:center; gap:6px; padding:10px 20px; font-size:14px;
      font-weight:500; color:#64748b; text-decoration:none; border-bottom:2px solid transparent;
      margin-bottom:-2px; transition:all 0.15s; cursor:pointer; background:none; border-left:none; border-right:none; border-top:none;
    }
    .page-tab mat-icon { font-size:18px; width:18px; height:18px; }
    .page-tab:hover { color:#1e293b; background:#f8fafc; }
    .page-tab.active { color:#2563eb; border-bottom:2px solid #2563eb; margin-bottom:-2px; font-weight:600; }
    .wizard-card { background:white; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; }
    .step-content { padding:24px 28px; }
    .tab-title { font-size:18px; font-weight:700; color:#1e293b; margin:0 0 20px; }
    .section-title { font-size:15px; font-weight:600; color:#374151; margin:0 0 12px; }
    .summary-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:16px; }
    .summary-item { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px 16px; }
    .summary-item label { display:block; font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:.05em; margin-bottom:4px; }
    .summary-item span { font-size:15px; font-weight:600; color:#1e293b; }
    .data-table { border-collapse:collapse; font-size:13px; }
    .data-table th { background:#f8fafc; padding:8px 12px; text-align:left; font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.05em; border-bottom:2px solid #e2e8f0; }
    .data-table td { padding:8px 12px; border-bottom:1px solid #cbd5e1; color:#374151; }
    .data-table tbody tr:hover { background:#f8fafc; }
    .edit-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:4px; }
    .edit-field { display:flex; flex-direction:column; gap:4px; }
    .edit-field label { font-size:12px; font-weight:500; color:#374151; }
    .inline-input { border:1px solid #e2e8f0; border-radius:4px; padding:4px 8px; font-size:13px; width:100%; box-sizing:border-box; }
    .inline-input:focus { outline:none; border-color:#2563eb; }
    .inline-input.invalid { border-color:#dc2626; background:#fef2f2; }
    .inline-select { border:1px solid #e2e8f0; border-radius:4px; padding:4px 8px; font-size:13px; background:white; }
    .invalid-select { border-color:#dc2626 !important; background:#fef2f2 !important; }
    .num-input { text-align:right; }
    .doc-upload-box { display:flex; flex-direction:column; align-items:center; gap:8px; padding:16px 20px; border:2px dashed #e2e8f0; border-radius:8px; min-width:160px; text-align:center; font-size:13px; color:#64748b; background:#fafafa; }
    .doc-upload-box mat-icon { font-size:32px; width:32px; height:32px; color:#94a3b8; }
    .doc-upload-box.uploaded { border-color:#16a34a; background:#f0fdf4; }
    .doc-upload-box.uploaded mat-icon { color:#16a34a; }
    .file-label { display:inline-block; padding:4px 12px; background:#2563eb; color:white; border-radius:4px; cursor:pointer; font-size:12px; font-weight:600; }
    .cidms-chain-row { background:#f8fafc; }
    .cidms-chain { display:flex; gap:16px; flex-wrap:wrap; padding:4px 0; font-size:12px; color:#475569; }
    .status-chip { display:inline-block; padding:2px 8px; border-radius:999px; font-size:12px; font-weight:600; }
    .status-draft { background:#f1f5f9; color:#64748b; }
    .status-submitted { background:#eff6ff; color:#2563eb; }
    .status-approved { background:#f0fdf4; color:#16a34a; }
    .status-declined { background:#fef2f2; color:#dc2626; }
    .status-complete { background:#f0f9ff; color:#0284c7; }
  `]
})
export class WipUnbundlingDetailComponent implements OnInit {
  @ViewChild('wizardStepper') stepper!: MatStepper;
  loading = signal(true);
  project = signal<any>(null);
  activeStep = signal(0);

  scmContract = signal<any>(null);

  invoicesLoading = signal(false);
  invoices = signal<any[]>([]);

  documents = signal<any[]>([]);
  docUploading = signal(false);

  boqLoading = signal(false);
  boqItems = signal<any[]>([]);
  mainAssetDescription = '';

  cidmsSubTypes = signal<any[]>([]);
  showCidmsPicker = signal(false);
  cidmsPickerContext: 'boq' | 'asset' = 'boq';
  pickerTargetItem: any = null;
  assetTypes = signal<any[]>([]);
  assetCategories = signal<any[]>([]);
  assetSubCategories = signal<any[]>([]);
  measurementTypes = signal<any[]>([]);
  assetStatuses = signal<any[]>([]);

  costDistLoading = signal(false);
  costDist = signal<any>(null);
  surveyValues: { [key: string]: number } = {};
  differenceComment = '';

  actionLoading = signal(false);

  assetsLoading = signal(false);
  generatedAssets = signal<any[]>([]);
  uploadErrors = signal<string[]>([]);

  selectedAsset = signal<any>(null);
  selectedAssetLoading = signal(false);
  aEditSaving = signal(false);
  aEditStep = 'details';
  aEditSteps = [
    { key: 'details', label: '1. Asset Details' },
    { key: 'financial', label: '2. Financial' },
    { key: 'ownership', label: '3. Ownership' },
    { key: 'location', label: '4. Location' }
  ];
  aef: any = {};
  aFilteredCategories = signal<any[]>([]);
  aFilteredSubCategories = signal<any[]>([]);
  aFilteredClasses = signal<any[]>([]);
  aNoClassMessage = signal('');
  aFinancialStatuses = signal<any[]>([]);
  aAssetConditions = signal<any[]>([]);
  aEmployees = signal<any[]>([]);
  aDepartments = signal<any[]>([]);
  aDivisions = signal<any[]>([]);
  aTowns = signal<any[]>([]);
  aSuburbs = signal<any[]>([]);
  aWards = signal<any[]>([]);
  aStreets = signal<any[]>([]);
  aBuildings = signal<any[]>([]);
  aFloors = signal<any[]>([]);
  aRooms = signal<any[]>([]);

  private wipId = 0;
  private boqCounter = 0;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    var self = this;
    self.wipId = Number(self.route.snapshot.paramMap.get('id'));
    self.api.getWipItem(self.wipId).subscribe({
      next: function(data: any) {
        self.project.set(data);
        self.mainAssetDescription = data.mainAssetDescription || data.projectName || '';
        self.loading.set(false);
        self.loadInvoices();
        self.loadDocuments();
        self.loadBOQItems();
        self.loadCidmsSubTypes();
        self.loadAssetTypes();
        self.loadAssetCategories();
        self.loadAssetSubCategories();
        self.loadMeasurementTypes();
        self.loadAssetStatuses();
        if (data.scmContractId) { self.loadScmContract(data.scmContractId); }
      },
      error: function() {
        self.loading.set(false);
      }
    });
  }

  loadInvoices() {
    var self = this;
    self.invoicesLoading.set(true);
    self.api.getWipDetails(self.wipId).subscribe({
      next: function(data: any) {
        self.invoices.set(Array.isArray(data) ? data : []);
        self.invoicesLoading.set(false);
      },
      error: function() { self.invoicesLoading.set(false); }
    });
  }

  loadDocuments() {
    var self = this;
    self.api.getWipDocuments(self.wipId).subscribe({
      next: function(data: any[]) { self.documents.set(data || []); },
      error: function() {}
    });
  }

  loadBOQItems() {
    var self = this;
    self.boqLoading.set(true);
    self.api.getWipRegisterItems(self.wipId).subscribe({
      next: function(data: any) {
        var items = Array.isArray(data) ? data : [];
        for (var i = 0; i < items.length; i++) {
          items[i]._idx = ++self.boqCounter;
          items[i]._chain = null;
          if (items[i].isAssetItem === 1 && !items[i].assetDescription) {
            items[i].assetDescription = items[i].description || '';
          }
          if (items[i].cidmsSubComponentTypeId) {
            self.loadCidmsChain(items[i]);
          } else {
            var hasCidms = items[i].cidmsComponentTypeId || items[i].cidmsAccountingGroupId
              || items[i].cidmsSubAccountingGroupId || items[i].cidmsClassId
              || items[i].cidmsGroupTypeId || items[i].cidmsAssetTypeId;
            if (hasCidms) {
              items[i]._chain = {
                cidmsAccountingGroupDesc: '',
                cidmsAccountingSubGroupDesc: '',
                cidmsClassDesc: '',
                cidmsGroupTypeDesc: '',
                cidmsAssetTypeDesc: '',
                cidmsComponentTypeDesc: '',
                cidmsSubComponentTypeDesc: ''
              };
            }
          }
        }
        if (items.length === 0) {
          var proj = self.project();
          if (proj && proj.scmContractId) {
            self.api.getWipScmBoqSeed(self.wipId).subscribe({
              next: function(details: any) {
                var detailList = Array.isArray(details) ? details : [];
                var seeded: any[] = [];
                for (var j = 0; j < detailList.length; j++) {
                  var d = detailList[j];
                  var qty = d.quantity || 1;
                  var rate = d.rate || 0;
                  var amt = d.amount || (qty * rate);
                  seeded.push({
                    _idx: ++self.boqCounter,
                    _chain: null,
                    description: d.goodsServiceDescription || '',
                    uoM: d.uom != null ? String(d.uom) : '',
                    quantity: qty,
                    rate: rate,
                    amount: amt,
                    isAssetItem: 0,
                    assetDescription: '',
                    cidmsSubComponentTypeId: null,
                    assetTypeId: null,
                    assetCategoryId: null,
                    assetSubCategoryId: null,
                    measurementTypeId: null,
                    assetStatusId: null,
                    boqGroupId: null
                  });
                }
                self.boqItems.set(seeded);
                self.boqLoading.set(false);
              },
              error: function() {
                self.boqItems.set([]);
                self.boqLoading.set(false);
              }
            });
          } else {
            self.boqItems.set([]);
            self.boqLoading.set(false);
          }
        } else {
          self.boqItems.set(items);
          self.boqLoading.set(false);
        }
      },
      error: function() { self.boqLoading.set(false); }
    });
  }

  loadCidmsSubTypes() {
    var self = this;
    self.api.getCidmsSubComponentTypes().subscribe({
      next: function(data: any[]) { self.cidmsSubTypes.set(data || []); },
      error: function() {}
    });
  }

  loadAssetTypes() {
    var self = this;
    self.api.getAssetTypes().subscribe({
      next: function(data: any[]) { self.assetTypes.set(data || []); },
      error: function() {}
    });
  }

  loadAssetCategories() {
    var self = this;
    self.api.getAssetCategoriesList().subscribe({
      next: function(data: any[]) { self.assetCategories.set(data || []); },
      error: function() {}
    });
  }

  loadAssetSubCategories() {
    var self = this;
    self.api.getAssetSubCategoriesList().subscribe({
      next: function(data: any[]) { self.assetSubCategories.set(data || []); },
      error: function() {}
    });
  }

  loadMeasurementTypes() {
    var self = this;
    self.api.getMeasurementTypes().subscribe({
      next: function(data: any[]) { self.measurementTypes.set(data || []); },
      error: function() {}
    });
  }

  loadAssetStatuses() {
    var self = this;
    self.api.getAssetStatuses().subscribe({
      next: function(data: any[]) { self.assetStatuses.set(data || []); },
      error: function() {}
    });
  }

  loadScmContract(contractId: number) {
    var self = this;
    self.api.getScmContract(contractId).subscribe({
      next: function(data: any) { self.scmContract.set(data); },
      error: function() {}
    });
  }

  getFilteredCategories(assetTypeId: any): any[] {
    if (!assetTypeId) return this.assetCategories();
    var cats = this.assetCategories();
    var result: any[] = [];
    for (var i = 0; i < cats.length; i++) {
      if (!cats[i].assetTypeId || cats[i].assetTypeId === assetTypeId) {
        result.push(cats[i]);
      }
    }
    return result.length > 0 ? result : cats;
  }

  getFilteredSubCategories(assetCategoryId: any): any[] {
    if (!assetCategoryId) return this.assetSubCategories();
    var subs = this.assetSubCategories();
    var result: any[] = [];
    for (var i = 0; i < subs.length; i++) {
      if (subs[i].assetCategoryId === assetCategoryId) {
        result.push(subs[i]);
      }
    }
    return result.length > 0 ? result : this.assetSubCategories();
  }

  onIsAssetItemChange(item: any) {
    if (item.isAssetItem === 1 && item.boqGroupId != null) {
      var items = this.boqItems().slice();
      for (var i = 0; i < items.length; i++) {
        if (items[i]._idx !== item._idx && items[i].boqGroupId === item.boqGroupId && items[i].isAssetItem === 1) {
          items[i].isAssetItem = 0;
          items[i].cidmsSubComponentTypeId = null;
          items[i].assetDescription = '';
          items[i]._chain = null;
        }
      }
      this.boqItems.set(items);
      this.snackBar.open('Only one Asset Item per group is allowed. Previous Asset Item in this group was cleared.', 'OK', { duration: 3500 });
    }
    if (item.isAssetItem === 1 && !item.assetDescription) {
      item.assetDescription = item.description || '';
    }
  }

  onAssetTypeChange(item: any) {
    item.assetCategoryId = null;
    item.assetSubCategoryId = null;
  }

  onCategoryChange(item: any) {
    item.assetSubCategoryId = null;
  }

  loadCostDistribution() {
    var self = this;
    self.costDistLoading.set(true);
    self.api.getWipCostDistribution(self.wipId).subscribe({
      next: function(data: any) {
        self.costDist.set(data);
        var rows = data.rows || [];
        self.surveyValues = {};
        for (var i = 0; i < rows.length; i++) {
          var row = rows[i];
          if (row.cidmsSubComponentTypeId && row.actualSurvey !== null && row.actualSurvey !== undefined) {
            self.surveyValues[row.cidmsSubComponentTypeId] = row.actualSurvey;
          }
        }
        self.costDistLoading.set(false);
      },
      error: function() { self.costDistLoading.set(false); }
    });
  }

  loadGeneratedAssets() {
    var self = this;
    self.assetsLoading.set(true);
    self.api.getWipGeneratedAssets(self.wipId).subscribe({
      next: function(data: any[]) {
        self.generatedAssets.set(data || []);
        self.assetsLoading.set(false);
      },
      error: function() { self.assetsLoading.set(false); }
    });
  }

  onStepSelectionChange(event: any) {
    var self = this;
    var idx = event.selectedIndex;
    if (idx === 2 && !self.canAccessCostDistribution()) {
      setTimeout(function() { if (self.stepper) { self.stepper.selectedIndex = 1; } }, 0);
      self.snackBar.open('Submit BOQ items first to access Cost Distribution.', '', { duration: 3000 });
      return;
    }
    if (idx === 3 && !self.canAccessCommissioning()) {
      setTimeout(function() { if (self.stepper) { self.stepper.selectedIndex = 2; } }, 0);
      self.snackBar.open('Cost Distribution must be approved before Commissioning.', '', { duration: 3000 });
      return;
    }
    if (idx === 4 && !self.canAccessManageAssets()) {
      setTimeout(function() { if (self.stepper) { self.stepper.selectedIndex = 3; } }, 0);
      self.snackBar.open('Project must be commissioned before managing assets.', '', { duration: 3000 });
      return;
    }
    self.activeStep.set(idx);
    if ((idx === 2 || idx === 3) && !self.costDist()) { self.loadCostDistribution(); }
    if (idx === 4) { self.loadGeneratedAssets(); }
  }

  goToStep(step: number) {
    var self = this;
    self.activeStep.set(step);
    if (self.stepper) { self.stepper.selectedIndex = step; }
    if ((step === 2 || step === 3) && !self.costDist()) { self.loadCostDistribution(); }
    if (step === 4) { self.loadGeneratedAssets(); }
  }

  canAccessCostDistribution() {
    var p = this.project();
    if (!p) return false;
    var status = (p.unbundlingStatus || 'Draft').toLowerCase();
    if (status === 'submitted' || status === 'approved' || status === 'complete' || status === 'declined') return true;
    var items = this.boqItems();
    for (var i = 0; i < items.length; i++) {
      if (items[i].isAssetItem === 1) return true;
    }
    return false;
  }

  canAccessCommissioning() {
    var p = this.project();
    if (!p) return false;
    return (p.unbundlingStatus || '') === 'Approved' || (p.unbundlingStatus || '') === 'Complete';
  }

  canAccessManageAssets() {
    var p = this.project();
    if (!p) return false;
    return p.projectComplete === 1 || p.projectComplete === true;
  }

  isApproved() {
    var p = this.project();
    if (!p) return false;
    var s = p.unbundlingStatus || '';
    return s === 'Approved' || s === 'Complete';
  }

  isCommissioned() {
    var p = this.project();
    if (!p) return false;
    return p.unbundlingStatus === 'Complete' || p.projectComplete === 1 || p.projectComplete === true;
  }

  hasCompletionCert() {
    var docs = this.documents();
    for (var i = 0; i < docs.length; i++) {
      if (docs[i].documentType === 'CompletionCertificate') return true;
    }
    return false;
  }

  hasBOQ() {
    var docs = this.documents();
    for (var i = 0; i < docs.length; i++) {
      if (docs[i].documentType === 'BillOfQuantities') return true;
    }
    return false;
  }

  onFileSelected(event: Event, docType: string) {
    var self = this;
    var input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    var file = input.files[0];
    var reader = new FileReader();
    reader.onload = function(e: ProgressEvent<FileReader>) {
      var result = e.target?.result as string;
      var base64 = result.split(',')[1];
      self.docUploading.set(true);
      self.api.uploadWipDocument(self.wipId, {
        documentType: docType,
        documentName: file.name,
        fileDataBase64: base64,
        mimeType: file.type || 'application/octet-stream',
        fileSizeKB: Math.round(file.size / 1024)
      }).subscribe({
        next: function(doc: any) {
          var docs = self.documents().slice();
          docs.push(doc);
          self.documents.set(docs);
          self.docUploading.set(false);
          self.snackBar.open('Document uploaded', 'OK', { duration: 2500 });
        },
        error: function() {
          self.docUploading.set(false);
          self.snackBar.open('Upload failed', 'OK', { duration: 3000 });
        }
      });
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  downloadDocument(doc: any) {
    var self = this;
    self.api.downloadWipDocument(self.wipId, doc.id).subscribe({
      next: function(blob: Blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = doc.documentName;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: function() {
        self.snackBar.open('Download failed', 'OK', { duration: 3000 });
      }
    });
  }

  deleteDocument(doc: any) {
    var self = this;
    if (!confirm('Delete document "' + doc.documentName + '"?')) return;
    self.api.deleteWipDocument(self.wipId, doc.id).subscribe({
      next: function() {
        var docs = self.documents().filter(function(d: any) { return d.id !== doc.id; });
        self.documents.set(docs);
        self.snackBar.open('Document deleted', 'OK', { duration: 2000 });
      },
      error: function() {
        self.snackBar.open('Delete failed', 'OK', { duration: 3000 });
      }
    });
  }

  addBOQLine() {
    var items = this.boqItems().slice();
    items.push({ _idx: ++this.boqCounter, isAssetItem: 0, quantity: 1, rate: null, amount: 0, description: '', uoM: '', assetDescription: '', cidmsSubComponentTypeId: null, _chain: null, boqGroupId: null });
    this.boqItems.set(items);
  }

  recalcAmount(item: any) {
    var qty = parseFloat(item.quantity) || 0;
    var rate = parseFloat(item.rate) || 0;
    item.amount = qty * rate;
  }

  openCidmsPickerForItem(item: any) {
    this.pickerTargetItem = item;
    this.cidmsPickerContext = 'boq';
    this.showCidmsPicker.set(true);
  }

  openCidmsPickerForAsset() {
    this.cidmsPickerContext = 'asset';
    this.pickerTargetItem = null;
    this.showCidmsPicker.set(true);
  }

  clearItemCidms(item: any) {
    var self = this;
    var items = self.boqItems().slice();
    for (var i = 0; i < items.length; i++) {
      if (items[i]._idx === item._idx) {
        items[i].cidmsSubComponentTypeId = null;
        items[i]._chain = null;
        items[i].cidmsAccountingGroupId = null;
        items[i].cidmsAccountingSubGroupId = null;
        items[i].cidmsClassId = null;
        items[i].cidmsGroupTypeId = null;
        items[i].cidmsAssetTypeId = null;
        items[i].cidmsComponentTypeId = null;
        break;
      }
    }
    self.boqItems.set(items);
  }

  onCidmsPickerSelected(chain: CidmsChainResult) {
    var self = this;
    if (self.cidmsPickerContext === 'boq' && self.pickerTargetItem) {
      var items = self.boqItems().slice();
      for (var i = 0; i < items.length; i++) {
        if (items[i]._idx === self.pickerTargetItem._idx) {
          items[i].cidmsSubComponentTypeId = chain.cidmsSubComponentTypeId;
          items[i].cidmsAccountingGroupId = chain.cidmsAccountingGroupId;
          items[i].cidmsAccountingSubGroupId = chain.cidmsAccountingSubGroupId;
          items[i].cidmsClassId = chain.cidmsClassId;
          items[i].cidmsGroupTypeId = chain.cidmsGroupTypeId;
          items[i].cidmsAssetTypeId = chain.cidmsAssetTypeId;
          items[i].cidmsComponentTypeId = chain.cidmsComponentTypeId;
          items[i]._chain = {
            cidmsAccountingGroupDesc: chain.cidmsAccountingGroupDesc,
            cidmsAccountingSubGroupDesc: chain.cidmsAccountingSubGroupDesc,
            cidmsClassDesc: chain.cidmsClassDesc,
            cidmsGroupTypeDesc: chain.cidmsGroupTypeDesc,
            cidmsAssetTypeDesc: chain.cidmsAssetTypeDesc,
            cidmsComponentTypeDesc: chain.cidmsComponentTypeDesc,
            cidmsSubComponentTypeDesc: chain.cidmsSubComponentTypeDesc
          };
          break;
        }
      }
      self.boqItems.set(items);
    } else if (self.cidmsPickerContext === 'asset') {
      self.aef.editCidmsSubComponentTypeId = chain.cidmsSubComponentTypeId || 0;
      self.aef.editCidmsSubComponentTypeDesc = chain.cidmsSubComponentTypeDesc || '';
      self.aef.cidmsComponentTypeId = chain.cidmsComponentTypeId || 0;
      self.aef.cidmsAccountingGroupId = chain.cidmsAccountingGroupId || 0;
      self.aef.cidmsSubAccountingGroupId = chain.cidmsAccountingSubGroupId || 0;
      self.aef.cidmsAssetClassId = chain.cidmsClassId || 0;
      self.aef.cidmsAssetGroupTypeId = chain.cidmsGroupTypeId || 0;
      self.aef.cidmsAssetTypeId = chain.cidmsAssetTypeId || 0;
      self.aef.cidmsComponentType = chain.cidmsComponentTypeDesc || '';
      self.aef.cidmsAccountingGroup = chain.cidmsAccountingGroupDesc || '';
      self.aef.cidmsSubAccountingGroup = chain.cidmsAccountingSubGroupDesc || '';
      self.aef.cidmsAssetClass = chain.cidmsClassDesc || '';
      self.aef.cidmsAssetGroupType = chain.cidmsGroupTypeDesc || '';
      self.aef.cidmsAssetType = chain.cidmsAssetTypeDesc || '';
    }
    self.showCidmsPicker.set(false);
    self.pickerTargetItem = null;
  }

  onCidmsChange(item: any) {
    if (item.cidmsSubComponentTypeId) {
      this.loadCidmsChain(item);
    } else {
      item._chain = null;
    }
  }

  loadCidmsChain(item: any) {
    var self = this;
    self.api.getCidmsSubComponentTypeChain(item.cidmsSubComponentTypeId).subscribe({
      next: function(chain: any) {
        var items = self.boqItems().slice();
        for (var i = 0; i < items.length; i++) {
          if (items[i]._idx === item._idx) {
            items[i]._chain = chain;
            items[i].cidmsAccountingGroupId = chain.cidmsAccountingGroupId;
            items[i].cidmsAccountingSubGroupId = chain.cidmsAccountingSubGroupId;
            items[i].cidmsClassId = chain.cidmsClassId;
            items[i].cidmsGroupTypeId = chain.cidmsGroupTypeId;
            items[i].cidmsAssetTypeId = chain.cidmsAssetTypeId;
            items[i].cidmsComponentTypeId = chain.cidmsComponentTypeId;
            break;
          }
        }
        self.boqItems.set(items);
      },
      error: function() {}
    });
  }

  deleteBOQItem(item: any) {
    var self = this;
    if (item.wipRegisterItemId) {
      if (!confirm('Delete this item?')) return;
      self.api.deleteWipRegisterItem(item.wipRegisterItemId).subscribe({
        next: function() {
          self.boqItems.set(self.boqItems().filter(function(i: any) { return i._idx !== item._idx; }));
        },
        error: function() { self.snackBar.open('Delete failed', 'OK', { duration: 3000 }); }
      });
    } else {
      self.boqItems.set(self.boqItems().filter(function(i: any) { return i._idx !== item._idx; }));
    }
  }

  saveBOQItems() {
    var self = this;
    var items = self.boqItems();
    var pending: any[] = [];
    for (var i = 0; i < items.length; i++) {
      pending.push(items[i]);
    }
    self.saveNextBOQItem(pending, 0, function() {
      self.snackBar.open('Items saved', 'OK', { duration: 2000 });
    });
  }

  saveNextBOQItem(items: any[], idx: number, done: () => void) {
    var self = this;
    if (idx >= items.length) { done(); return; }
    var item = items[idx];
    var payload = {
      wipRegisterId: self.wipId,
      description: item.description,
      uoM: item.uoM,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.amount,
      isAssetItem: item.isAssetItem,
      assetDescription: item.assetDescription,
      cidmsSubComponentTypeId: item.cidmsSubComponentTypeId,
      cidmsAccountingGroupId: item.cidmsAccountingGroupId,
      cidmsAccountingSubGroupId: item.cidmsAccountingSubGroupId,
      cidmsClassId: item.cidmsClassId,
      cidmsGroupTypeId: item.cidmsGroupTypeId,
      cidmsAssetTypeId: item.cidmsAssetTypeId,
      cidmsComponentTypeId: item.cidmsComponentTypeId,
      assetTypeId: item.assetTypeId,
      assetCategoryId: item.assetCategoryId,
      assetSubCategoryId: item.assetSubCategoryId,
      measurementTypeId: item.measurementTypeId,
      assetStatusId: item.assetStatusId,
      boqGroupId: item.boqGroupId != null ? item.boqGroupId : null
    };
    if (item.wipRegisterItemId) {
      self.api.updateWipRegisterItem(item.wipRegisterItemId, payload).subscribe({
        next: function() { self.saveNextBOQItem(items, idx + 1, done); },
        error: function() { self.saveNextBOQItem(items, idx + 1, done); }
      });
    } else {
      self.api.createWipRegisterItem(payload).subscribe({
        next: function(created: any) {
          var all = self.boqItems().slice();
          for (var j = 0; j < all.length; j++) {
            if (all[j]._idx === item._idx) {
              all[j].wipRegisterItemId = created.wipRegisterItemId;
              break;
            }
          }
          self.boqItems.set(all);
          self.saveNextBOQItem(items, idx + 1, done);
        },
        error: function() { self.saveNextBOQItem(items, idx + 1, done); }
      });
    }
  }

  saveMainAssetDescription() {
    var self = this;
    self.api.patchWipMainDescription(self.wipId, self.mainAssetDescription).subscribe({
      next: function() { self.snackBar.open('Description saved', 'OK', { duration: 2000 }); },
      error: function() { self.snackBar.open('Save failed', 'OK', { duration: 3000 }); }
    });
  }

  calculateProjectCost() {
    var self = this;
    var items = self.boqItems();
    var valid = true;
    var errorMsg = '';
    for (var i = 0; i < items.length; i++) {
      if (items[i].rate === null || items[i].rate === undefined || items[i].rate === '') {
        valid = false;
        errorMsg = 'Rate is required for all rows.';
        break;
      }
      if (items[i].isAssetItem === 1) {
        if (!items[i].assetDescription) {
          valid = false;
          errorMsg = 'Asset Description is required for all asset items.';
          break;
        }
        if (!items[i].cidmsSubComponentTypeId && !items[i]._chain) {
          valid = false;
          errorMsg = 'CIDMS classification is required for all asset items.';
          break;
        }
        if (!items[i].assetTypeId) {
          valid = false;
          errorMsg = 'Asset Type is required for all asset items.';
          break;
        }
      }
    }
    if (valid) {
      var groupIds = self.getExistingGroupIds();
      for (var g = 0; g < groupIds.length; g++) {
        var gid = groupIds[g];
        var hasAssetItem = false;
        for (var k = 0; k < items.length; k++) {
          if (items[k].boqGroupId === gid && items[k].isAssetItem === 1) { hasAssetItem = true; break; }
        }
        if (!hasAssetItem) {
          valid = false;
          errorMsg = 'Group ' + gid + ' has no Asset Item line. Each group must have exactly one line with Asset Item = Yes.';
          break;
        }
      }
    }
    if (!valid) {
      self.snackBar.open(errorMsg, 'OK', { duration: 4000 });
      return;
    }
    var pending: any[] = [];
    var allItems = self.boqItems();
    for (var k = 0; k < allItems.length; k++) { pending.push(allItems[k]); }
    self.saveNextBOQItem(pending, 0, function() {
      self.snackBar.open('Items saved', 'OK', { duration: 2000 });
      self.goToStep(2);
    });
  }

  boqTotal(): number {
    var total = 0;
    var items = this.boqItems();
    for (var i = 0; i < items.length; i++) {
      total += parseFloat(items[i].amount) || 0;
    }
    return total;
  }

  getSurveyValue(cidmsId: number | string): number {
    return this.surveyValues[String(cidmsId)] || 0;
  }

  setSurveyValue(cidmsId: number | string, val: number) {
    this.surveyValues[String(cidmsId)] = val || 0;
  }

  getComputedUnitCost(row: any): number {
    if (!row.cidmsSubComponentTypeId) return 0;
    var survey = this.surveyValues[String(row.cidmsSubComponentTypeId)] || row.actualSurvey || 0;
    if (!survey) return 0;
    return (row.totalBoq || 0) / survey;
  }

  hasCidmsSelection(item: any): boolean {
    return !!(item.cidmsSubComponentTypeId || item._chain
      || item.cidmsComponentTypeId || item.cidmsAccountingGroupId
      || item.cidmsSubAccountingGroupId || item.cidmsClassId
      || item.cidmsGroupTypeId || item.cidmsAssetTypeId);
  }

  getCidmsDisplayLabel(item: any): string {
    if (item._chain) {
      return item._chain.cidmsSubComponentTypeDesc
        || item._chain.cidmsComponentTypeDesc
        || item._chain.cidmsAssetTypeDesc
        || item._chain.cidmsGroupTypeDesc
        || item._chain.cidmsClassDesc
        || item._chain.cidmsAccountingSubGroupDesc
        || item._chain.cidmsAccountingGroupDesc
        || 'CIDMS classified';
    }
    if (item.cidmsSubComponentTypeId) { return 'ID: ' + item.cidmsSubComponentTypeId; }
    if (item.cidmsComponentTypeId) { return 'Component ID: ' + item.cidmsComponentTypeId; }
    if (item.cidmsAssetTypeId) { return 'Asset Type ID: ' + item.cidmsAssetTypeId; }
    if (item.cidmsGroupTypeId) { return 'Group Type ID: ' + item.cidmsGroupTypeId; }
    if (item.cidmsClassId) { return 'Class ID: ' + item.cidmsClassId; }
    if (item.cidmsSubAccountingGroupId) { return 'Sub-Group ID: ' + item.cidmsSubAccountingGroupId; }
    if (item.cidmsAccountingGroupId) { return 'Group ID: ' + item.cidmsAccountingGroupId; }
    return 'CIDMS classified';
  }

  getCidmsRows(): any[] {
    if (!this.costDist()) return [];
    var rows = this.costDist().rows || [];
    var result: any[] = [];
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].cidmsSubComponentTypeId) result.push(rows[i]);
    }
    return result;
  }

  getCommissioningRows(): any[] {
    var cd = this.costDist();
    if (!cd) return [];
    var cdRows = cd.rows || [];
    var boqItems = this.boqItems();
    var result: any[] = [];
    for (var i = 0; i < cdRows.length; i++) {
      var cdRow = cdRows[i];
      if (!cdRow.cidmsSubComponentTypeId) continue;
      var cid = cdRow.cidmsSubComponentTypeId;
      var unitCost = this.getComputedUnitCost(cdRow);
      var totalSurvey = this.surveyValues[String(cid)] || cdRow.actualSurvey || 0;
      var assetItems: any[] = [];
      for (var j = 0; j < boqItems.length; j++) {
        if (boqItems[j].cidmsSubComponentTypeId === cid && boqItems[j].isAssetItem === 1) {
          assetItems.push(boqItems[j]);
        }
      }
      if (assetItems.length === 0) {
        result.push(Object.assign({}, cdRow, { assetTypeDesc: '—', assetCategoryDesc: '', assetSubCategoryDesc: '', _surveyCount: totalSurvey, _unitCost: unitCost }));
        continue;
      }
      var groups: { [key: string]: { assetTypeId: any; assetCategoryId: any; assetSubCategoryId: any; totalBOQ: number } } = {};
      var totalBOQForCidms = 0;
      for (var j = 0; j < assetItems.length; j++) {
        var it = assetItems[j];
        var key = (it.assetTypeId || 0) + '_' + (it.assetCategoryId || 0) + '_' + (it.assetSubCategoryId || 0);
        if (!groups[key]) {
          groups[key] = { assetTypeId: it.assetTypeId, assetCategoryId: it.assetCategoryId, assetSubCategoryId: it.assetSubCategoryId, totalBOQ: 0 };
        }
        groups[key].totalBOQ += parseFloat(it.amount) || 0;
        totalBOQForCidms += parseFloat(it.amount) || 0;
      }
      var groupKeys = Object.keys(groups);
      for (var k = 0; k < groupKeys.length; k++) {
        var g = groups[groupKeys[k]];
        var proportion = totalBOQForCidms > 0 ? g.totalBOQ / totalBOQForCidms : 1 / groupKeys.length;
        var surveyCount = groupKeys.length === 1 ? totalSurvey : Math.round(totalSurvey * proportion);
        var atDesc = '';
        var acDesc = '';
        var asDesc = '';
        if (g.assetTypeId) {
          var types = this.assetTypes();
          for (var m = 0; m < types.length; m++) {
            if (types[m].assetTypeId === g.assetTypeId) { atDesc = types[m].assetTypeDesc || ''; break; }
          }
        }
        if (g.assetCategoryId) {
          var cats = this.assetCategories();
          for (var m = 0; m < cats.length; m++) {
            if (cats[m].assetCategoryId === g.assetCategoryId) { acDesc = cats[m].assetCategoryDesc || ''; break; }
          }
        }
        if (g.assetSubCategoryId) {
          var subs = this.assetSubCategories();
          for (var m = 0; m < subs.length; m++) {
            if (subs[m].assetSubCategoryId === g.assetSubCategoryId) { asDesc = subs[m].assetSubCategoryDesc || ''; break; }
          }
        }
        result.push(Object.assign({}, cdRow, { assetTypeDesc: atDesc || '—', assetCategoryDesc: acDesc, assetSubCategoryDesc: asDesc, _surveyCount: surveyCount, _unitCost: unitCost }));
      }
    }
    return result;
  }

  getExistingGroupIds(): number[] {
    var items = this.boqItems();
    var ids: number[] = [];
    var seen: {[k: number]: boolean} = {};
    for (var i = 0; i < items.length; i++) {
      var gid = items[i].boqGroupId;
      if (gid != null && !seen[gid]) {
        seen[gid] = true;
        ids.push(gid);
      }
    }
    ids.sort(function(a: number, b: number) { return a - b; });
    return ids;
  }

  getNextGroupId(): number {
    var items = this.boqItems();
    var maxId = 0;
    for (var i = 0; i < items.length; i++) {
      var gid = items[i].boqGroupId;
      if (gid != null && gid > maxId) maxId = gid;
    }
    return maxId + 1;
  }

  groupColor(groupId: number): string {
    var colors = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d', '#0f766e'];
    return colors[(groupId - 1) % colors.length];
  }

  isGroupAssetLine(item: any): boolean {
    if (item.boqGroupId == null) return false;
    return item.isAssetItem === 1;
  }

  groupAlreadyHasAssetItem(item: any): boolean {
    if (item.boqGroupId == null) return false;
    var items = this.boqItems();
    for (var i = 0; i < items.length; i++) {
      if (items[i]._idx !== item._idx && items[i].boqGroupId === item.boqGroupId && items[i].isAssetItem === 1) {
        return true;
      }
    }
    return false;
  }

  isGroupAvailableForItem(item: any, gid: number): boolean {
    if (item.boqGroupId === gid) return true;
    if (item.isAssetItem !== 1) return true;
    var items = this.boqItems();
    for (var i = 0; i < items.length; i++) {
      if (items[i]._idx !== item._idx && items[i].boqGroupId === gid && items[i].isAssetItem === 1) {
        return false;
      }
    }
    return true;
  }

  onBoqGroupSelectChange(item: any, event: any) {
    var val = event.target.value;
    var items = this.boqItems().slice();
    for (var i = 0; i < items.length; i++) {
      if (items[i]._idx === item._idx) {
        if (val === 'new') {
          items[i].boqGroupId = this.getNextGroupId();
        } else if (val === '') {
          items[i].boqGroupId = null;
        } else {
          items[i].boqGroupId = parseInt(val, 10);
        }
        break;
      }
    }
    this.boqItems.set(items);
  }

  getGroupTotalAmount(groupId: number): number {
    var items = this.boqItems();
    var total = 0;
    for (var i = 0; i < items.length; i++) {
      if (items[i].boqGroupId === groupId) total += parseFloat(items[i].amount) || 0;
    }
    return total;
  }

  canApproveCostDist(): boolean {
    var d = this.costDist();
    if (!d) return false;
    if (d.difference !== 0 && !this.differenceComment.trim()) return false;
    return true;
  }

  submitForApproval() {
    var self = this;
    self.actionLoading.set(true);
    self.api.submitWipForApproval(self.wipId).subscribe({
      next: function(data: any) {
        self.project.set(data);
        self.actionLoading.set(false);
        self.snackBar.open('Submitted for approval', 'OK', { duration: 2500 });
      },
      error: function() {
        self.actionLoading.set(false);
        self.snackBar.open('Submit failed', 'OK', { duration: 3000 });
      }
    });
  }

  approveCostDist() {
    var self = this;
    if (!self.canApproveCostDist()) {
      self.snackBar.open('Please enter a reason for the difference before approving', 'OK', { duration: 3000 });
      return;
    }
    if (!confirm('Approve cost distribution? This will lock the cost distribution tab.')) return;
    var surveyData: { [key: string]: number } = {};
    var keys = Object.keys(self.surveyValues);
    for (var i = 0; i < keys.length; i++) {
      surveyData[keys[i]] = self.surveyValues[keys[i]];
    }
    self.actionLoading.set(true);
    self.api.saveWipActualSurvey(self.wipId, surveyData).subscribe({
      next: function() {
        self.api.approveWipUnbundling(self.wipId, { comment: self.differenceComment, approverId: 1 }).subscribe({
          next: function(data: any) {
            self.project.set(data);
            self.actionLoading.set(false);
            self.snackBar.open('Cost Distribution approved', 'OK', { duration: 2500 });
            self.loadCostDistribution();
          },
          error: function() {
            self.actionLoading.set(false);
            self.snackBar.open('Approval failed', 'OK', { duration: 3000 });
          }
        });
      },
      error: function() {
        self.actionLoading.set(false);
        self.snackBar.open('Failed to save survey data', 'OK', { duration: 3000 });
      }
    });
  }

  declineCostDist() {
    var self = this;
    var comment = prompt('Enter reason for declining:');
    if (!comment) return;
    self.actionLoading.set(true);
    self.api.declineWipUnbundling(self.wipId, comment).subscribe({
      next: function(data: any) {
        self.project.set(data);
        self.actionLoading.set(false);
        self.snackBar.open('Declined', 'OK', { duration: 2500 });
      },
      error: function() {
        self.actionLoading.set(false);
        self.snackBar.open('Decline failed', 'OK', { duration: 3000 });
      }
    });
  }

  approveCommission() {
    var self = this;
    if (!confirm('Commission this project? This will generate asset register items and cannot be undone.')) return;
    self.actionLoading.set(true);
    self.api.commissionWip(self.wipId).subscribe({
      next: function(result: any) {
        self.actionLoading.set(false);
        self.snackBar.open(result.message || 'Commissioned successfully', 'OK', { duration: 4000 });
        self.api.getWipItem(self.wipId).subscribe({
          next: function(data: any) {
            self.project.set(data);
          },
          error: function() {}
        });
      },
      error: function() {
        self.actionLoading.set(false);
        self.snackBar.open('Commission failed', 'OK', { duration: 3000 });
      }
    });
  }

  declineCommission() {
    var self = this;
    var comment = prompt('Enter reason for declining commission:');
    if (!comment) return;
    self.actionLoading.set(true);
    self.api.declineWipCommission(self.wipId, comment).subscribe({
      next: function(data: any) {
        self.project.set(data);
        self.actionLoading.set(false);
        self.snackBar.open('Commission declined', 'OK', { duration: 2500 });
      },
      error: function() {
        self.actionLoading.set(false);
        self.snackBar.open('Decline failed', 'OK', { duration: 3000 });
      }
    });
  }

  downloadAssetsCsv() {
    var self = this;
    var assets = self.generatedAssets();
    if (assets.length === 0) {
      self.snackBar.open('No assets to download', 'OK', { duration: 2000 });
      return;
    }
    var headers = [
      'assetRegisterItemId', 'description',
      'assetTypeId', 'assetTypeDesc',
      'assetCategoryId', 'assetCategoryDesc',
      'assetSubCategoryId',
      'assetStatusId', 'assetStatusDesc',
      'measurementTypeId',
      'currentAmount', 'dateCaptured'
    ];
    var csvRows = [headers.join(',')];
    for (var i = 0; i < assets.length; i++) {
      var a = assets[i];
      var row = [
        a.assetRegisterItemId,
        '"' + (a.description || '').replace(/"/g, '""') + '"',
        a.assetTypeId || '',
        '"' + (a.assetTypeDesc || '') + '"',
        a.assetCategoryId || '',
        '"' + (a.assetCategoryDesc || '') + '"',
        a.assetSubCategoryId || '',
        a.assetStatusId || '',
        '"' + (a.assetStatusDesc || '') + '"',
        a.measurementTypeId || '',
        a.currentAmount || 0,
        a.dateCaptured ? new Date(a.dateCaptured).toLocaleDateString('en-ZA') : ''
      ];
      csvRows.push(row.join(','));
    }
    var csv = csvRows.join('\n');
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'wip_' + self.wipId + '_assets.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  onCsvSelected(event: Event) {
    var self = this;
    var input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    var file = input.files[0];
    var reader = new FileReader();
    reader.onload = function(e: ProgressEvent<FileReader>) {
      var text = e.target?.result as string;
      var lines = text.split('\n');
      if (lines.length < 2) {
        self.snackBar.open('Empty CSV', 'OK', { duration: 2000 });
        return;
      }
      var headers = lines[0].split(',').map(function(h: string) { return h.trim().replace(/^"|"$/g, ''); });
      var rows: any[] = [];
      for (var i = 1; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line) continue;
        var cols = line.split(',');
        var row: any = {};
        for (var j = 0; j < headers.length; j++) {
          row[headers[j]] = (cols[j] || '').replace(/^"|"$/g, '').trim();
        }
        rows.push(row);
      }
      self.api.uploadWipAssetList(self.wipId, rows).subscribe({
        next: function(result: any) {
          self.uploadErrors.set(result.errors || []);
          self.snackBar.open('CSV uploaded: ' + result.updated + ' record(s) updated', 'OK', { duration: 3000 });
          self.loadGeneratedAssets();
        },
        error: function() {
          self.snackBar.open('Upload failed', 'OK', { duration: 3000 });
        }
      });
    };
    reader.readAsText(file);
    input.value = '';
  }

  selectAssetForEdit(asset: any) {
    var self = this;
    var assetId = asset.assetRegisterItemId;
    var cur = self.selectedAsset();
    if (cur && cur.assetRegisterItemId === assetId) {
      self.clearSelectedAsset();
      return;
    }
    self.selectedAsset.set(asset);
    self.selectedAssetLoading.set(true);
    self.aEditStep = 'details';
    self.api.getAsset(assetId).subscribe({
      next: function(a: any) {
        self.selectedAsset.set(a);
        self.populateAssetEditForm(a);
        self.selectedAssetLoading.set(false);
        self.loadAEditLookups(a);
      },
      error: function() {
        self.selectedAssetLoading.set(false);
        self.snackBar.open('Failed to load asset details', 'OK', { duration: 3000 });
      }
    });
  }

  clearSelectedAsset() {
    this.selectedAsset.set(null);
    this.aef = {};
    this.aEditStep = 'details';
  }

  aToDateInput(val: any): string {
    if (!val) return '';
    return String(val).split('T')[0];
  }

  populateAssetEditForm(a: any) {
    var usefulLifeMonths = Number(a.usefulLifeMonths) || 0;
    var usefulLifeYears = Number(a.usefulLife) || 0;
    var usefulLifeTotal = usefulLifeMonths > 0 ? usefulLifeMonths : usefulLifeYears * 12;
    var remainingMonths = Number(a.remainingUsefulLifeMonths) || 0;
    var remainingYears = Number(a.remainingUsefulLife) || 0;
    var remainingTotal = remainingMonths > 0 ? remainingMonths : remainingYears * 12;
    this.aef = {
      description: a.description || '',
      barcode: a.barcode || '',
      oldBarcode: a.oldBarcode || '',
      parentAssetId: a.parentAssetId || '',
      municipalAssetId: a.municipalAssetId || '',
      mainAssetId: a.mainAssetId || '',
      mainAssetDescription: a.mainAssetDescription || '',
      assetTypeName: a.assetTypeName || '',
      categoryName: a.categoryName || '',
      subCategoryName: a.subCategoryName || '',
      assetClassName: a.assetClassName || '',
      editTypeId: 0,
      editCategoryId: 0,
      editSubCategoryId: 0,
      editClassId: 0,
      editStatusId: 0,
      editMeasurementTypeId: 0,
      editFinancialStatusId: 0,
      editConditionId: 0,
      editCidmsSubComponentTypeId: Number(a.cidmsSubComponentTypeId) || 0,
      editCidmsSubComponentTypeDesc: '',
      cidmsComponentTypeId: 0,
      cidmsAccountingGroupId: 0,
      cidmsSubAccountingGroupId: 0,
      cidmsAssetClassId: 0,
      cidmsAssetGroupTypeId: 0,
      cidmsAssetTypeId: 0,
      cidmsComponentType: a.cidmsComponentType || '',
      cidmsAccountingGroup: a.cidmsAccountingGroup || '',
      cidmsSubAccountingGroup: a.cidmsSubAccountingGroup || '',
      cidmsAssetClass: a.cidmsAssetClass || '',
      cidmsAssetGroupType: a.cidmsAssetGroupType || '',
      cidmsAssetType: a.cidmsAssetType || '',
      natureOfAddition: a.natureOfAddition || '',
      cashGenerating: a.cashGenerating || '',
      basicMunicipalityService: a.basicMunicipalityService || '',
      acquisitionDate: this.aToDateInput(a.acquisitionDate),
      commissioningDate: this.aToDateInput(a.commissioningDate),
      inServiceDate: this.aToDateInput(a.inServiceDate),
      yearConstructed: a.yearConstructed || null,
      usefulLifeTotal: usefulLifeTotal,
      remainingUsefulLifeTotal: remainingTotal,
      uom: a.uom || '',
      quantity: Number(a.quantity) || 1,
      constructionMaterial: a.constructionMaterial || '',
      capacity: a.capacity || '',
      acquisitionCost: Number(a.acquisitionCost) || Number(a.costOpeningBalance) || 0,
      residualValue: Number(a.residualValue) || 0,
      fundingSourceAmount: Number(a.fundingSourceAmount) || 0,
      fundingSourceNumber: a.fundingSourceNumber || '',
      fundType: a.fundType || '',
      currentReplacementCost: Number(a.currentReplacementCost) || 0,
      annualMaintenanceBudgetNeed: Number(a.annualMaintenanceBudgetNeed) || 0,
      insuranceCover: a.insuranceCover || '',
      insurancePolicyNo: a.insurancePolicyNo || '',
      insuredAmount: Number(a.insuredAmount) || 0,
      warranty: a.warranty || '',
      impairmentDate: this.aToDateInput(a.impairmentDate),
      revaluationDate: this.aToDateInput(a.revaluationDate),
      movementInRevaluationReserve: Number(a.movementInRevaluationReserve) || 0,
      depreciationOffset: Number(a.depreciationOffset) || 0,
      deemedCost: Number(a.deemedCost) || 0,
      revaluationReserveClosingBalance: Number(a.revaluationReserveClosingBalance) || 0,
      depreciationCurrentYear: Number(a.depreciationCurrentYear) || 0,
      impairmentCurrentYear: Number(a.impairmentCurrentYear) || 0,
      impairmentReversalAmount: Number(a.impairmentReversalAmount) || 0,
      depreciatedReplacementCost: Number(a.depreciatedReplacementCost) || 0,
      editDepartmentId: Number(a.municipalDepartmentId) || Number(a.departmentId) || 0,
      editCustodianId: Number(a.custodian) || Number(a.custodianId) || 0,
      custodianIdNumber: a.custodianIdNumber || '',
      assetOwnership: a.assetOwnership || '',
      make: a.make || '',
      model: a.model || '',
      unitNumber: a.unitNumber || '',
      registrationNumber: a.registrationNumber || '',
      serialNumber: a.serialNumber || '',
      deedNumber: a.deedNumber || '',
      erfNumber: a.erfNumber || '',
      portionNumber: a.portionNumber || '',
      erfSize: a.erfSize || null,
      supplierName: a.supplierName || '',
      supplierCode: a.supplierCode || '',
      editTownId: Number(a.townId) || 0,
      editSuburbId: Number(a.suburbId) || 0,
      editWardId: Number(a.wardId) || 0,
      editStreetId: Number(a.streetId) || 0,
      editBuildingId: Number(a.buildingId) || 0,
      editFloorId: Number(a.floorId) || 0,
      editRoomId: Number(a.roomId) || 0,
      latitude: a.latitude || null,
      longitude: a.longitude || null,
      gisFeature: a.gisFeature || '',
      wellKnownText: a.wellKnownText || '',
      invoiceNo: a.invoiceNo || '',
      locationDescription: a.locationDescription || '',
      fundingDescription: a.fundingDescription || '',
      divisionId: Number(a.divisionId) || 0,
      reasonForChange: ''
    };
  }

  loadAEditLookups(a: any) {
    var self = this;
    var types = self.assetTypes();
    var typeName = a.assetTypeName || '';
    if (typeName) {
      for (var i = 0; i < types.length; i++) {
        if (types[i].assetTypeDesc === typeName) { self.aef.editTypeId = types[i].assetType_ID; break; }
      }
    }
    if (self.aef.editTypeId) {
      self.api.getAssetCategoriesList({ typeId: self.aef.editTypeId }).subscribe({
        next: function(cats: any[]) {
          self.aFilteredCategories.set(cats);
          var catName = a.categoryName || '';
          if (catName) {
            for (var j = 0; j < cats.length; j++) {
              if (cats[j].assetCategoryDesc === catName) { self.aef.editCategoryId = cats[j].assetCategoryID; break; }
            }
          }
          if (self.aef.editCategoryId) {
            self.api.getAssetSubCategoriesList({ typeId: self.aef.editTypeId, categoryId: self.aef.editCategoryId }).subscribe({
              next: function(subs: any[]) {
                self.aFilteredSubCategories.set(subs);
                var subName = a.subCategoryName || '';
                if (subName) {
                  for (var k = 0; k < subs.length; k++) {
                    if (subs[k].asset_SubCategoryDescription === subName) { self.aef.editSubCategoryId = subs[k].asset_SubCategory_ID; break; }
                  }
                }
                self.loadAFilteredClasses();
              },
              error: function() {}
            });
          } else {
            self.loadAFilteredClasses();
          }
        },
        error: function() {}
      });
    }
    var statuses = self.assetStatuses();
    var statusName = a.status || '';
    if (statusName) {
      for (var si = 0; si < statuses.length; si++) {
        if (statuses[si].assetStatusDesc === statusName) { self.aef.editStatusId = statuses[si].assetStatus_ID; break; }
      }
    }
    var mTypes = self.measurementTypes();
    var mtName = a.measurementType || '';
    if (mtName) {
      for (var mi = 0; mi < mTypes.length; mi++) {
        if (mTypes[mi].name === mtName) { self.aef.editMeasurementTypeId = mTypes[mi].assetConfig_MeasurementType_ID; break; }
      }
    }
    self.api.getFinancialStatuses().subscribe({
      next: function(fs: any[]) {
        self.aFinancialStatuses.set(fs);
        var fsName = a.financialStatus || '';
        if (fsName) {
          for (var fi = 0; fi < fs.length; fi++) {
            if (fs[fi].description === fsName) { self.aef.editFinancialStatusId = fs[fi].id; break; }
          }
        }
      }, error: function() {}
    });
    self.api.getAssetConditions().subscribe({
      next: function(conds: any[]) {
        self.aAssetConditions.set(conds);
        var condName = a.condition || '';
        if (condName) {
          for (var ci = 0; ci < conds.length; ci++) {
            if (conds[ci].description === condName) { self.aef.editConditionId = conds[ci].asset_Condition_ID; break; }
          }
        }
      }, error: function() {}
    });
    if (self.aDepartments().length === 0) {
      self.api.getDepartments().subscribe({
        next: function(d: any) { self.aDepartments.set(Array.isArray(d) ? d : []); },
        error: function() {}
      });
    }
    if (self.aDivisions().length === 0) {
      self.api.getVerificationLookupDivisions().subscribe({
        next: function(divs: any[]) { self.aDivisions.set(divs); },
        error: function() {}
      });
    }
    if (self.aEmployees().length === 0) {
      self.api.getEmployees().subscribe({
        next: function(emps: any[]) { self.aEmployees.set(emps); },
        error: function() {}
      });
    }
    if (self.aTowns().length === 0) {
      self.api.getVerificationLookupTowns().subscribe({
        next: function(towns: any[]) { self.aTowns.set(towns); },
        error: function() {}
      });
    }
    if (self.aWards().length === 0) {
      self.api.getVerificationLookupWards().subscribe({
        next: function(wards: any[]) { self.aWards.set(wards); },
        error: function() {}
      });
    }
    if (self.aef.editTownId) {
      self.api.getVerificationLookupSuburbs(self.aef.editTownId).subscribe({
        next: function(suburbs: any[]) { self.aSuburbs.set(suburbs); },
        error: function() {}
      });
    }
    if (self.aef.editSuburbId) {
      self.api.getVerificationLookupStreets(self.aef.editSuburbId).subscribe({
        next: function(streets: any[]) { self.aStreets.set(streets); },
        error: function() {}
      });
    }
    if (self.aef.editStreetId) {
      self.api.getVerificationLookupBuildings(self.aef.editStreetId).subscribe({
        next: function(buildings: any[]) { self.aBuildings.set(buildings); },
        error: function() {}
      });
    }
    if (self.aef.editBuildingId) {
      self.api.getVerificationLookupFloors(self.aef.editBuildingId).subscribe({
        next: function(floors: any[]) { self.aFloors.set(floors); },
        error: function() {}
      });
    }
    if (self.aef.editFloorId) {
      self.api.getVerificationLookupRooms(self.aef.editFloorId).subscribe({
        next: function(rooms: any[]) { self.aRooms.set(rooms); },
        error: function() {}
      });
    }
    if (self.aef.editCidmsSubComponentTypeId) {
      self.api.getCidmsSubComponentTypeChain(self.aef.editCidmsSubComponentTypeId).subscribe({
        next: function(chain: any) { if (chain) { self.applyACidmsChain(chain); } },
        error: function() {}
      });
    }
  }

  loadAFilteredClasses() {
    var self = this;
    if (!self.aef.editTypeId || !self.aef.editCategoryId) {
      self.aFilteredClasses.set([]);
      self.aNoClassMessage.set('');
      return;
    }
    var params: any = { typeId: self.aef.editTypeId, categoryId: self.aef.editCategoryId };
    if (self.aef.editSubCategoryId) { params.subCategoryId = self.aef.editSubCategoryId; }
    self.api.getAssetClassesList(params).subscribe({
      next: function(res: any) {
        var list = Array.isArray(res) ? res : (res.data || []);
        self.aFilteredClasses.set(list);
        if (list.length === 0) {
          self.aNoClassMessage.set('No Asset Class exists for the selected hierarchy. Please create one in Configuration > Asset Classes first.');
        } else {
          self.aNoClassMessage.set('');
          var className = self.aef.assetClassName;
          if (className) {
            for (var i = 0; i < list.length; i++) {
              if (list[i].assetClassDesc === className) { self.aef.editClassId = list[i].assetClass_ID; break; }
            }
          }
        }
      },
      error: function() {}
    });
  }

  onAEditTypeChange(typeId: any) {
    this.aef.editTypeId = typeId;
    this.aef.editCategoryId = 0;
    this.aef.editSubCategoryId = 0;
    this.aef.editClassId = 0;
    this.aFilteredSubCategories.set([]);
    this.aFilteredClasses.set([]);
    this.aNoClassMessage.set('');
    if (!typeId) { this.aFilteredCategories.set([]); return; }
    var self = this;
    self.api.getAssetCategoriesList({ typeId: typeId }).subscribe({
      next: function(cats: any[]) { self.aFilteredCategories.set(cats); },
      error: function() {}
    });
  }

  onAEditCategoryChange(catId: any) {
    this.aef.editCategoryId = catId;
    this.aef.editSubCategoryId = 0;
    this.aef.editClassId = 0;
    this.aFilteredClasses.set([]);
    this.aNoClassMessage.set('');
    if (!catId || !this.aef.editTypeId) { this.aFilteredSubCategories.set([]); return; }
    var self = this;
    self.api.getAssetSubCategoriesList({ typeId: self.aef.editTypeId, categoryId: catId }).subscribe({
      next: function(subs: any[]) {
        self.aFilteredSubCategories.set(subs);
        self.loadAFilteredClasses();
      },
      error: function() {}
    });
  }

  onAEditSubCategoryChange(subId: any) {
    this.aef.editSubCategoryId = subId;
    this.aef.editClassId = 0;
    this.aNoClassMessage.set('');
    this.loadAFilteredClasses();
  }

  onAEditClassChange(classId: any) {
    var self = this;
    self.aef.editClassId = classId;
    self.aNoClassMessage.set('');
    if (!classId) { self.aef.assetClassName = ''; return; }
    var list = self.aFilteredClasses();
    for (var i = 0; i < list.length; i++) {
      if (list[i].assetClass_ID === classId) {
        self.aef.assetClassName = list[i].assetClassDesc;
        if (list[i].usefulLifeInMonths) { self.aef.usefulLifeTotal = list[i].usefulLifeInMonths; }
        if (list[i].assetStatus_ID) {
          var sts = self.assetStatuses();
          for (var j = 0; j < sts.length; j++) {
            if (sts[j].assetStatus_ID === list[i].assetStatus_ID) { self.aef.editStatusId = sts[j].assetStatus_ID; break; }
          }
        }
        break;
      }
    }
  }

  onACidmsChange(id: any) {
    var self = this;
    self.aef.editCidmsSubComponentTypeId = id;
    if (!id) { self.aef.cidmsComponentType = ''; self.aef.cidmsAccountingGroup = ''; self.aef.cidmsSubAccountingGroup = ''; self.aef.cidmsAssetClass = ''; self.aef.cidmsAssetGroupType = ''; self.aef.cidmsAssetType = ''; return; }
    self.api.getCidmsSubComponentTypeChain(id).subscribe({
      next: function(chain: any) { if (chain) { self.applyACidmsChain(chain); } },
      error: function() {}
    });
  }

  applyACidmsChain(chain: any) {
    this.aef.cidmsComponentType = chain.cidmsComponentTypeDesc || '';
    this.aef.cidmsAccountingGroup = chain.cidmsAccountingGroupDesc || '';
    this.aef.cidmsSubAccountingGroup = chain.cidmsAccountingSubGroupDesc || '';
    this.aef.cidmsAssetClass = chain.cidmsClassDesc || '';
    this.aef.cidmsAssetGroupType = chain.cidmsGroupTypeDesc || '';
    this.aef.cidmsAssetType = chain.cidmsAssetTypeDesc || '';
  }

  onAEditTownChange(townId: any) {
    var self = this;
    self.aef.editTownId = townId;
    self.aef.editSuburbId = 0; self.aef.editStreetId = 0; self.aef.editBuildingId = 0; self.aef.editFloorId = 0; self.aef.editRoomId = 0;
    self.aSuburbs.set([]); self.aStreets.set([]); self.aBuildings.set([]); self.aFloors.set([]); self.aRooms.set([]);
    if (!townId) return;
    self.api.getVerificationLookupSuburbs(townId).subscribe({
      next: function(suburbs: any[]) { self.aSuburbs.set(suburbs); }, error: function() {}
    });
  }

  onAEditSuburbChange(suburbId: any) {
    var self = this;
    self.aef.editSuburbId = suburbId;
    self.aef.editStreetId = 0; self.aef.editBuildingId = 0; self.aef.editFloorId = 0; self.aef.editRoomId = 0;
    self.aStreets.set([]); self.aBuildings.set([]); self.aFloors.set([]); self.aRooms.set([]);
    if (!suburbId) return;
    self.api.getVerificationLookupStreets(suburbId).subscribe({
      next: function(streets: any[]) { self.aStreets.set(streets); }, error: function() {}
    });
  }

  onAEditStreetChange(streetId: any) {
    var self = this;
    self.aef.editStreetId = streetId;
    self.aef.editBuildingId = 0; self.aef.editFloorId = 0; self.aef.editRoomId = 0;
    self.aBuildings.set([]); self.aFloors.set([]); self.aRooms.set([]);
    if (!streetId) return;
    self.api.getVerificationLookupBuildings(streetId).subscribe({
      next: function(buildings: any[]) { self.aBuildings.set(buildings); }, error: function() {}
    });
  }

  onAEditBuildingChange(buildingId: any) {
    var self = this;
    self.aef.editBuildingId = buildingId;
    self.aef.editFloorId = 0; self.aef.editRoomId = 0;
    self.aFloors.set([]); self.aRooms.set([]);
    if (!buildingId) return;
    self.api.getVerificationLookupFloors(buildingId).subscribe({
      next: function(floors: any[]) { self.aFloors.set(floors); }, error: function() {}
    });
  }

  onAEditFloorChange(floorId: any) {
    var self = this;
    self.aef.editFloorId = floorId;
    self.aef.editRoomId = 0;
    self.aRooms.set([]);
    if (!floorId) return;
    self.api.getVerificationLookupRooms(floorId).subscribe({
      next: function(rooms: any[]) { self.aRooms.set(rooms); }, error: function() {}
    });
  }

  getAClassPlaceholder(): string {
    if (!this.aef.editTypeId || !this.aef.editCategoryId) return 'Select type and category first...';
    if (this.aFilteredClasses().length === 0) return 'No asset classes available';
    return 'Select asset class...';
  }

  nextAEditStep() {
    var steps = ['details', 'financial', 'ownership', 'location'];
    var idx = steps.indexOf(this.aEditStep);
    if (idx < steps.length - 1) { this.aEditStep = steps[idx + 1]; }
  }

  prevAEditStep() {
    var steps = ['details', 'financial', 'ownership', 'location'];
    var idx = steps.indexOf(this.aEditStep);
    if (idx > 0) { this.aEditStep = steps[idx - 1]; }
  }

  saveAssetEdit() {
    var self = this;
    var a = self.selectedAsset();
    if (!a) return;
    if (!self.aef.description) {
      self.snackBar.open('Description is required', 'OK', { duration: 3000 });
      self.aEditStep = 'details';
      return;
    }
    if (!self.aef.reasonForChange) {
      self.snackBar.open('Reason for Change is required on the Location tab', 'OK', { duration: 4000 });
      return;
    }
    self.aEditSaving.set(true);
    var payload: any = {};
    function setVal(col: string, val: any) {
      if (val !== null && val !== undefined && val !== '' && val !== 0) { payload[col] = val; }
    }
    setVal('Description', self.aef.description);
    setVal('Barcode', self.aef.barcode);
    setVal('OldBarCode', self.aef.oldBarcode);
    setVal('ParentAssetRegisterItem_ID', self.aef.parentAssetId);
    setVal('MunicipalAssetID', self.aef.municipalAssetId);
    setVal('MainAssetID', self.aef.mainAssetId);
    setVal('MainAssetDescription', self.aef.mainAssetDescription);
    setVal('AssetType_ID', self.aef.editTypeId);
    setVal('AssetCategory_ID', self.aef.editCategoryId);
    setVal('Asset_SubCategory_ID', self.aef.editSubCategoryId);
    setVal('AssetClass_ID', self.aef.editClassId);
    setVal('AssetStatus_ID', self.aef.editStatusId);
    setVal('MeasurementType_ID', self.aef.editMeasurementTypeId);
    setVal('Financial_Status_ID', self.aef.editFinancialStatusId);
    setVal('AssetCondition_ID', self.aef.editConditionId);
    payload['CIDMSSubComponentTypeID'] = self.aef.editCidmsSubComponentTypeId || null;
    payload['CIDMSComponentType'] = self.aef.cidmsComponentTypeId || null;
    payload['CIDMSAccountingGroup'] = self.aef.cidmsAccountingGroupId || null;
    payload['CIDMSSubAccountingGroup'] = self.aef.cidmsSubAccountingGroupId || null;
    payload['CIDMSAssetClass'] = self.aef.cidmsAssetClassId || null;
    payload['CIDMSAssetGroupType'] = self.aef.cidmsAssetGroupTypeId || null;
    payload['CIDMSAssetType'] = self.aef.cidmsAssetTypeId || null;
    setVal('NatureOfAddition', self.aef.natureOfAddition);
    setVal('CashOrNoncashgeneratingunit', self.aef.cashGenerating);
    setVal('BasicMunicipalityService', self.aef.basicMunicipalityService);
    setVal('AcquisitionDate', self.aef.acquisitionDate);
    setVal('CommisioningDate', self.aef.commissioningDate);
    setVal('InserviceDate', self.aef.inServiceDate);
    setVal('YearConstructed', self.aef.yearConstructed);
    if (self.aef.usefulLifeTotal) {
      payload['UsefulLifeMonthComponent'] = self.aef.usefulLifeTotal;
      payload['UsefulLifeYearComponent'] = Math.floor(self.aef.usefulLifeTotal / 12);
    }
    if (self.aef.remainingUsefulLifeTotal) {
      payload['RemaingUsefulLife'] = self.aef.remainingUsefulLifeTotal;
      payload['Remaining_Useful_Life_Year'] = Math.floor(self.aef.remainingUsefulLifeTotal / 12);
    }
    setVal('UoM', self.aef.uom);
    setVal('Quantity', self.aef.quantity);
    setVal('ConstructionMaterial', self.aef.constructionMaterial);
    setVal('Capacity', self.aef.capacity);
    setVal('PurchaseAmount', self.aef.acquisitionCost);
    setVal('ResidualValue', self.aef.residualValue);
    setVal('FundingSourceAmount', self.aef.fundingSourceAmount);
    setVal('FundingSourceNumber', self.aef.fundingSourceNumber);
    setVal('FundType', self.aef.fundType);
    setVal('CurrentReplacementCostCRC', self.aef.currentReplacementCost);
    setVal('AnnualMaintenanceBudgetNeed', self.aef.annualMaintenanceBudgetNeed);
    setVal('InsuranceCover', self.aef.insuranceCover);
    setVal('InsurancePolicyNo', self.aef.insurancePolicyNo);
    setVal('InsuredAmountInsuredBy', self.aef.insuredAmount);
    setVal('Warranty', self.aef.warranty);
    setVal('Impairment_Date', self.aef.impairmentDate);
    setVal('RevaluationDate', self.aef.revaluationDate);
    setVal('MovementInRevaluationReserve', self.aef.movementInRevaluationReserve);
    setVal('DepreciationOffset', self.aef.depreciationOffset);
    setVal('DeemedCost', self.aef.deemedCost);
    setVal('RevaluationReserveClosingBalance', self.aef.revaluationReserveClosingBalance);
    setVal('AccumulatedDepreciationCurrentYear', self.aef.depreciationCurrentYear);
    setVal('ImpairmentAmountCurrentYear', self.aef.impairmentCurrentYear);
    setVal('ReversalOfImpairmentAmount', self.aef.impairmentReversalAmount);
    setVal('DepreciatedReplacementCostDRC', self.aef.depreciatedReplacementCost);
    setVal('MunicipalDepartment_ID', self.aef.editDepartmentId);
    setVal('Custodian_ID', self.aef.editCustodianId);
    setVal('CustodianIdNumber', self.aef.custodianIdNumber);
    setVal('AssetOwnershipName', self.aef.assetOwnership);
    setVal('Make', self.aef.make);
    setVal('Model', self.aef.model);
    setVal('UnitNumber', self.aef.unitNumber);
    setVal('RegistrationNumber', self.aef.registrationNumber);
    setVal('SerialNumber', self.aef.serialNumber);
    setVal('DeedNumber', self.aef.deedNumber);
    setVal('ErfNumber', self.aef.erfNumber);
    setVal('PortionNumber', self.aef.portionNumber);
    setVal('ErfSizeM2', self.aef.erfSize);
    setVal('SupplierName', self.aef.supplierName);
    setVal('SupplierCode', self.aef.supplierCode);
    setVal('Town_ID', self.aef.editTownId);
    setVal('SuburbID', self.aef.editSuburbId);
    setVal('Ward_ID', self.aef.editWardId);
    setVal('Street_ID', self.aef.editStreetId);
    setVal('Building_ID', self.aef.editBuildingId);
    setVal('FloorID', self.aef.editFloorId);
    setVal('Room_ID', self.aef.editRoomId);
    setVal('latitude', self.aef.latitude);
    setVal('longitude', self.aef.longitude);
    setVal('GisFeature', self.aef.gisFeature);
    setVal('WellKnownTextWKT', self.aef.wellKnownText);
    setVal('InvoiceNo', self.aef.invoiceNo);
    setVal('FundingDescription', self.aef.fundingDescription);
    setVal('LocationDescription', self.aef.locationDescription);
    setVal('DivisionID', self.aef.divisionId);
    setVal('ReasonForChange', self.aef.reasonForChange);
    payload['ModifierID'] = 1;
    self.api.updateAsset(a.assetRegisterItemId, payload).subscribe({
      next: function() {
        self.aEditSaving.set(false);
        self.snackBar.open('Asset saved successfully', 'OK', { duration: 3000 });
        self.loadGeneratedAssets();
      },
      error: function() {
        self.aEditSaving.set(false);
        self.snackBar.open('Save failed', 'OK', { duration: 3000 });
      }
    });
  }
}
