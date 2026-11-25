import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../../core/api.service';

@Component({
  selector: 'app-bulk-transaction-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    @if (!selectedJob()) {
      <div class="section-card">
        <div class="section-title">Bulk Transaction Jobs</div>
        <div style="display:flex; gap:12px; align-items:center; margin-bottom:12px;">
          <label class="field-label" style="margin-bottom:0;">Filter by Type:</label>
          <select class="field-input" style="width:200px;" [(ngModel)]="typeFilter" (ngModelChange)="loadJobs()">
            <option value="">All</option>
            <option value="Revaluation">Revaluation</option>
            <option value="Impairment">Impairment</option>
            <option value="ImpairmentReversal">Impairment Reversal</option>
            <option value="Disposal">Disposal</option>
            <option value="Refurbishment">Refurbishment</option>
            <option value="AssetTransfer">Asset Transfer</option>
            <option value="RULAdjustment">RUL Adjustment</option>
          </select>
          <button class="btn btn-outline" (click)="loadJobs()">
            <mat-icon>refresh</mat-icon> Refresh
          </button>
        </div>
        @if (loading()) {
          <div style="padding:20px; text-align:center; color:#64748b;">Loading...</div>
        } @else if (filteredJobs().length === 0) {
          <div style="padding:20px; text-align:center; color:#64748b;">No bulk transaction jobs found.</div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>File</th>
                <th>Type</th>
                <th>Status</th>
                <th>Total</th>
                <th>Posted</th>
                <th>Errors</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (job of filteredJobs(); track job.id) {
                <tr>
                  <td>{{ job.id }}</td>
                  <td>{{ job.filename }}</td>
                  <td>
                    <span class="type-badge" [class]="'type-' + job.transactionType?.toLowerCase()">{{ job.transactionType }}</span>
                  </td>
                  <td>
                    <span class="status-badge" [class]="'status-' + job.status?.toLowerCase()">{{ job.status }}</span>
                  </td>
                  <td>{{ job.totalRecords }}</td>
                  <td>{{ job.postedRecords }}</td>
                  <td>{{ job.errorRecords }}</td>
                  <td>{{ job.uploadedDate | date:'dd MMM yyyy HH:mm' }}</td>
                  <td>
                    <button class="btn btn-sm btn-outline" (click)="viewJob(job)">
                      <mat-icon>visibility</mat-icon> View
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    } @else {
      <div class="section-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <div>
            <button class="btn btn-outline btn-sm" (click)="backToList()" [disabled]="approving()">
              <mat-icon>arrow_back</mat-icon> Back
            </button>
            <span style="margin-left:12px; font-weight:600; font-size:16px;">
              Job #{{ selectedJob()!.id }} — {{ selectedJob()!.transactionType }}
            </span>
            <span class="status-badge" [class]="'status-' + selectedJob()!.status?.toLowerCase()" style="margin-left:8px;">
              {{ selectedJob()!.status }}
            </span>
          </div>
          @if (selectedJob()!.status === 'Pending') {
            <div style="display:flex; gap:8px;">
              <button class="btn btn-primary" (click)="approveJob()" [disabled]="approving()">
                @if (approving()) {
                  <mat-icon class="spin">sync</mat-icon> Processing...
                } @else {
                  <mat-icon>check_circle</mat-icon> Approve &amp; Post
                }
              </button>
              <button class="btn btn-danger" (click)="showRejectDialog.set(true)" [disabled]="approving()">
                <mat-icon>cancel</mat-icon> Reject
              </button>
            </div>
          }
          @if (selectedJob()!.status === 'Approved' && selectedJob()!.errorRecords > 0) {
            <button class="btn btn-warning" (click)="retryErrors()" [disabled]="approving()">
              @if (approving()) {
                <mat-icon class="spin">sync</mat-icon> Retrying...
              } @else {
                <mat-icon>replay</mat-icon> Retry Failed Items ({{ selectedJob()!.errorRecords }})
              }
            </button>
          }
          @if ((selectedJob()!.status === 'Approved' || selectedJob()!.status === 'ReverseFailed') && selectedJob()!.transactionType === 'AssetTransfer') {
            <button class="btn btn-danger"
              (click)="showReverseConfirm.set(true)"
              [disabled]="approving() || reversing() || hasCatchUpDep()"
              [title]="hasCatchUpDep() ? 'Cannot reverse: catch-up depreciation was posted. A manual journal is required.' : selectedJob()!.status === 'ReverseFailed' ? 'Retry reversal (previous attempt failed)' : 'Reverse all GL entries for this transfer batch'">
              @if (reversing()) {
                <mat-icon class="spin">sync</mat-icon> Reversing...
              } @else {
                <mat-icon>undo</mat-icon> Reverse Job
              }
            </button>
          }
          @if (selectedJob()!.transactionType === 'AssetTransfer' && jobItems().length > 0) {
            <button class="btn btn-outline" (click)="exportTransferItemsXlsx()" title="Export items to Excel">
              <mat-icon>download</mat-icon> Export XLSX
            </button>
          }
        </div>

        <div class="field-grid" style="grid-template-columns: repeat(4, 1fr); max-width:600px; margin-bottom:16px;">
          <div>
            <span class="field-label">Filename</span>
            <div>{{ selectedJob()!.filename }}</div>
          </div>
          <div>
            <span class="field-label">Total</span>
            <div>{{ selectedJob()!.totalRecords }}</div>
          </div>
          <div>
            <span class="field-label">Posted</span>
            <div>{{ selectedJob()!.postedRecords }}</div>
          </div>
          <div>
            <span class="field-label">Errors</span>
            <div>{{ selectedJob()!.errorRecords }}</div>
          </div>
        </div>

        @if (approving() || reversing()) {
          <div class="progress-panel">
            <div class="progress-header">
              <mat-icon class="spin" style="font-size:16px; width:16px; height:16px; color:#2563eb;">sync</mat-icon>
              <span>{{ reversing() ? 'Reversing transfers — please wait' : 'Posting in progress — please wait' }}</span>
              @if (approvalProgress()) {
                <span class="progress-counts">
                  {{ reversing() ? 'Reversed' : 'Posted' }}: <strong>{{ itemPostedCount() }}</strong> /
                  {{ itemStatusCounts().total }}
                  @if (itemErroredCount() > 0) {
                    &nbsp;— {{ reversing() ? 'Failed' : 'Errors' }}: <strong style="color:#dc2626;">{{ itemErroredCount() }}</strong>
                  }
                  @if (!reversing() && itemProcessingCount() > 0) {
                    &nbsp;— Processing: <strong>{{ itemProcessingCount() }}</strong>
                  }
                </span>
              }
              @if (itemStatusCounts().total > 0) {
                <span class="completed-pct">{{ completedPct() }}% complete</span>
              }
              @if (progressPollError()) {
                <span class="progress-poll-error"><mat-icon style="font-size:14px;width:14px;height:14px;">wifi_off</mat-icon> Progress updates unavailable</span>
              }
            </div>
            @if (approvalProgress()) {
              <div class="progress-bar-track">
                <div class="progress-bar-posted" [style.width]="progressPostedPct() + '%'"></div>
                <div class="progress-bar-errored" [style.width]="progressErroredPct() + '%'" [style.left]="progressPostedPct() + '%'"></div>
              </div>
              <div class="progress-legend">
                <span class="legend-dot legend-posted"></span><span>{{ reversing() ? 'Reversed' : 'Posted' }}</span>
                <span class="legend-dot legend-errored"></span><span>{{ reversing() ? 'Failed' : 'Error' }}</span>
                <span class="legend-dot legend-pending"></span><span>Pending{{ reversing() ? '' : ' / Processing' }}</span>
              </div>
            }
          </div>
        }

        @if (jobTotals()) {
          <div class="totals-bar">
            <span class="totals-label">Totals ({{ jobTotals().itemCount }} items):</span>
            @if (selectedJob()!.transactionType === 'Revaluation') {
              <span>Market Value: <strong>{{ jobTotals().totalMarketValue | number:'1.2-2' }}</strong></span>
              <span>Dep Adjustment: <strong>{{ jobTotals().totalDepAdjustment | number:'1.2-2' }}</strong></span>
            }
            @if (selectedJob()!.transactionType === 'Impairment' || selectedJob()!.transactionType === 'ImpairmentReversal') {
              <span>Recoverable Amt: <strong>{{ jobTotals().totalRecoverableAmount | number:'1.2-2' }}</strong></span>
              <span>Value In Use: <strong>{{ jobTotals().totalValueInUse | number:'1.2-2' }}</strong></span>
            }
            @if (selectedJob()!.transactionType === 'Disposal') {
              <span>Disposal Proceeds: <strong>{{ jobTotals().totalDisposalProceeds | number:'1.2-2' }}</strong></span>
            }
            @if (selectedJob()!.transactionType === 'Refurbishment') {
              <span>DT: <strong>{{ (jobTotals().totalRefurbDT || 0) | number:'1.2-2' }}</strong></span>
              <span>CT: <strong>{{ (jobTotals().totalRefurbCT || 0) | number:'1.2-2' }}</strong></span>
              <span>Depreciation: <strong>{{ (jobTotals().totalRefurbDepreciation || 0) | number:'1.2-2' }}</strong></span>
            }
            @if (jobTotals().totalCatchUpDep > 0) {
              <span>Catch-up dep: <strong>R {{ formatAmount(jobTotals().totalCatchUpDep) }} across {{ jobTotals().totalCatchUpDays }} days</strong></span>
            }
          </div>
        }

        @if (selectedJob()!.rejectionReason) {
          <div class="alert alert-danger" style="margin-bottom:16px;">
            <mat-icon>block</mat-icon> Rejected: {{ selectedJob()!.rejectionReason }}
          </div>
        }

        @if (approveError()) {
          <div class="alert alert-danger" style="margin-bottom:12px;">
            <mat-icon>error</mat-icon> {{ approveError() }}
          </div>
        }

        @if (approveResult()) {
          <div class="alert alert-success" style="margin-bottom:12px; flex-direction:column; align-items:flex-start; gap:4px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <mat-icon>check_circle</mat-icon>
              <span>Approved: {{ approveResult().posted }} posted, {{ approveResult().errored }} errors out of {{ approveResult().totalItems }} items.</span>
            </div>
            @if (approveResult().totalCatchUpDep > 0) {
              <div style="display:flex; align-items:center; gap:8px; padding-left:26px; font-size:13px; color:#065f46;">
                <mat-icon style="font-size:16px; width:16px; height:16px;">schedule</mat-icon>
                <span>Catch-up dep posted: R {{ formatAmount(approveResult().totalCatchUpDep) }} across {{ approveResult().totalCatchUpDays }} days</span>
              </div>
            }
          </div>
          @if (approveResult().errors?.length > 0) {
            <div class="alert alert-danger" style="margin-bottom:12px; flex-direction:column;">
              <div style="font-weight:600; margin-bottom:8px;">Posting errors:</div>
              @for (e of approveResult().errors; track e.row) {
                <div style="margin-bottom:4px;">
                  @if (isGlBalanceError(e.error)) {
                    <span style="font-weight:500;">Row {{ e.row }} (Asset {{ e.assetId }}):</span>
                    <span class="gl-inline-badge"><mat-icon style="font-size:12px;width:12px;height:12px;vertical-align:middle;">account_balance</mat-icon> GL Balance Error</span>
                    — GL journal does not balance. Fix the PPI configuration at
                    <a href="/config/mscoa" target="_blank" class="gl-config-link">mSCOA Config</a>
                    or
                    <a href="/config/transaction-types" target="_blank" class="gl-config-link">Transaction Types</a>.
                  } @else {
                    Row {{ e.row }} (Asset {{ e.assetId }}): {{ e.error }}
                  }
                </div>
              }
            </div>
          }
        }

        @if (loadingItems()) {
          <div style="padding:20px; text-align:center; color:#64748b;">Loading items...</div>
        } @else {
          <div style="overflow-x:auto; width:100%;">
          <table class="data-table" style="min-width:max-content;">
            <thead>
              <tr>
                <th>Row</th>
                <th>Asset ID</th>
                <th>Date</th>
                @if (selectedJob()!.transactionType === 'Revaluation') {
                  <th>Market Value</th>
                  <th>Val. Module</th>
                  <th>Dep Adj.</th>
                }
                @if (selectedJob()!.transactionType === 'Impairment' || selectedJob()!.transactionType === 'ImpairmentReversal') {
                  <th>Recoverable Amt</th>
                  <th>Value In Use</th>
                  <th>Reason</th>
                }
                @if (selectedJob()!.transactionType === 'Disposal') {
                  <th>Method</th>
                  <th>Proceeds</th>
                  <th>Reason</th>
                }
                @if (selectedJob()!.transactionType === 'Refurbishment') {
                  <th>DT</th>
                  <th>CT</th>
                  <th>Depreciation</th>
                  <th>Revaluation</th>
                  <th>Impairment</th>
                  <th>Debit PPI</th>
                  <th>Credit PPI</th>
                }
                @if (selectedJob()!.transactionType === 'RULAdjustment') {
                  <th>Asset No</th>
                  <th>Description</th>
                  <th>Fin Year</th>
                  <th>Curr. EUL (M)</th>
                  <th>Curr. EUL (Yrs)</th>
                  <th>Curr. RUL (M)</th>
                  <th>Curr. RUL (Yrs)</th>
                  <th>Completed (M)</th>
                  <th>Completed (Yrs)</th>
                  <th>Adj. EUL (M)</th>
                  <th>Adj. EUL (Yrs)</th>
                  <th>Adj. RUL (M)</th>
                  <th>Adj. RUL (Yrs)</th>
                  <th>Catch-up From</th>
                  <th>Catch-up To</th>
                  <th>Catch-up Dep</th>
                  <th>Catch-up Days</th>
                  <th>Indicator</th>
                }
                @if (selectedJob()!.transactionType === 'AssetTransfer') {
                  <th>From Type</th>
                  <th>From Cat.</th>
                  <th>From SubCat.</th>
                  <th>From Class</th>
                  <th>From Infra</th>
                  <th>From Dept</th>
                  <th>From Div</th>
                  <th>From CIDMS SubComp.</th>
                  <th>From CIDMS Comp.</th>
                  <th>From CIDMS Acc. Grp</th>
                  <th>From CIDMS Sub Acc.</th>
                  <th>From CIDMS Class</th>
                  <th>From CIDMS Grp Type</th>
                  <th>From CIDMS Asset Type</th>
                  <th>To Type</th>
                  <th>To Cat.</th>
                  <th>To SubCat.</th>
                  <th>To Class</th>
                  <th>To Meas Type</th>
                  <th>To Status</th>
                  <th>To Infra</th>
                  <th>To Dept</th>
                  <th>To Div</th>
                  <th>To CIDMS SubComp.</th>
                  <th>To CIDMS Comp.</th>
                  <th>To CIDMS Acc. Grp</th>
                  <th>To CIDMS Sub Acc.</th>
                  <th>To CIDMS Class</th>
                  <th>To CIDMS Grp Type</th>
                  <th>To CIDMS Asset Type</th>
                  <th>Est. Cost</th>
                  <th>Est. AccDep</th>
                  <th>Est. AccImp</th>
                  <th>Est. Reval Res.</th>
                  <th>Est. Dep Offset</th>
                  <th>Est. CatchUp</th>
                }
                <th>Catch-up Dep.</th>
                <th>Catch-up Days</th>
                <th>Status</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              @for (item of jobItems(); track item.id) {
                <tr [class.row-error]="item.status === 'Error'" [class.row-posted]="item.status === 'Posted'">
                  <td>{{ item.rowNumber }}</td>
                  <td>{{ item.assetRegisterItemID }}</td>
                  <td>{{ item.transactionDate | date:'dd MMM yyyy' }}</td>
                  @if (selectedJob()!.transactionType === 'Revaluation') {
                    <td>{{ item.marketValue | number:'1.2-2' }}</td>
                    <td>{{ item.valuationModule === 1 ? 'Cost' : item.valuationModule === 2 ? 'Revaluation' : item.valuationModule === 3 ? 'Fair Value' : item.valuationModule }}</td>
                    <td>{{ item.depAdjustment | number:'1.2-2' }}</td>
                  }
                  @if (selectedJob()!.transactionType === 'Impairment' || selectedJob()!.transactionType === 'ImpairmentReversal') {
                    <td>{{ item.recoverableAmount | number:'1.2-2' }}</td>
                    <td>{{ item.valueInUse | number:'1.2-2' }}</td>
                    <td>{{ item.reason }}</td>
                  }
                  @if (selectedJob()!.transactionType === 'Disposal') {
                    <td>{{ item.disposalMethod }}</td>
                    <td>{{ item.disposalProceeds | number:'1.2-2' }}</td>
                    <td>{{ item.reason }}</td>
                  }
                  @if (selectedJob()!.transactionType === 'Refurbishment') {
                    <td>{{ item.refurb_DT | number:'1.2-2' }}</td>
                    <td>{{ item.refurb_CT | number:'1.2-2' }}</td>
                    <td>{{ item.refurb_Depreciation | number:'1.2-2' }}</td>
                    <td>{{ item.refurb_Revaluation | number:'1.2-2' }}</td>
                    <td>{{ item.refurb_Impairment | number:'1.2-2' }}</td>
                    <td>{{ item.debitPlanProjectItemId }}</td>
                    <td>{{ item.creditPlanProjectItemId }}</td>
                  }
                  @if (selectedJob()!.transactionType === 'RULAdjustment') {
                    <td>{{ item.assetNo || '—' }}</td>
                    <td>{{ item.assetDescription || '—' }}</td>
                    <td>{{ item.finYear || '—' }}</td>
                    <td>{{ item.previousEULMonths != null ? item.previousEULMonths : '—' }}</td>
                    <td>{{ item.previousEULYears8dp != null ? item.previousEULYears8dp : '—' }}</td>
                    <td>{{ item.previousRULMonths != null ? item.previousRULMonths : '—' }}</td>
                    <td>{{ item.previousRULYears8dp != null ? item.previousRULYears8dp : '—' }}</td>
                    <td>{{ getRulMonthsCompleted(item) != null ? getRulMonthsCompleted(item) : '—' }}</td>
                    <td>{{ getRulYearsCompleted(item) != null ? getRulYearsCompleted(item) : '—' }}</td>
                    <td>{{ item.adjUsefulLifeMonths != null ? item.adjUsefulLifeMonths : '—' }}</td>
                    <td>{{ item.adjEULYears8dp != null ? item.adjEULYears8dp : '—' }}</td>
                    <td>{{ item.adjRemainingUsefulLifeMonths != null ? item.adjRemainingUsefulLifeMonths : '—' }}</td>
                    <td>{{ item.adjRULYears8dp != null ? item.adjRULYears8dp : '—' }}</td>
                    <td>{{ item.catchUpFromDate != null ? (item.catchUpFromDate | date:'dd MMM yyyy') : '—' }}</td>
                    <td>{{ item.catchUpToDate != null ? (item.catchUpToDate | date:'dd MMM yyyy') : '—' }}</td>
                    <td>{{ item.catchUpDep != null ? (item.catchUpDep | number:'1.8-8') : '—' }}</td>
                    <td>{{ item.catchUpDays != null ? item.catchUpDays : '—' }}</td>
                    <td>{{ item.rulIndicatorDesc || item.rulIndicatorId || '—' }}</td>
                  }
                  @if (selectedJob()!.transactionType === 'AssetTransfer') {
                    <td>{{ item.fromAssetTypeName || item.fromAssetTypeId }}</td>
                    <td>{{ item.fromAssetCategoryName || item.fromAssetCategoryId }}</td>
                    <td>{{ item.fromAssetSubCategoryName || item.fromAssetSubCategoryId }}</td>
                    <td>{{ item.fromAssetClassName || item.fromAssetClassId }}</td>
                    <td>{{ item.fromIsInfrastructure != null ? (item.fromIsInfrastructure ? 'Yes' : 'No') : '' }}</td>
                    <td>{{ item.fromDepartment }}</td>
                    <td>{{ item.fromDivision }}</td>
                    <td>{{ item.fromCIDMSSubComponentTypeName }}</td>
                    <td>{{ item.fromCIDMSComponentTypeName }}</td>
                    <td>{{ item.fromCIDMSAccountingGroupName }}</td>
                    <td>{{ item.fromCIDMSSubAccountingGroupName }}</td>
                    <td>{{ item.fromCIDMSAssetClassName }}</td>
                    <td>{{ item.fromCIDMSAssetGroupTypeName }}</td>
                    <td>{{ item.fromCIDMSAssetTypeName }}</td>
                    <td>{{ item.newAssetTypeName || item.newAssetTypeId }}</td>
                    <td>{{ item.newAssetCategoryName || item.newAssetCategoryId }}</td>
                    <td>{{ item.newAssetSubCategoryName || item.newAssetSubCategoryId }}</td>
                    <td>{{ item.newAssetClassName || item.newAssetClassId }}</td>
                    <td>{{ item.newMeasurementTypeName || item.newMeasurementTypeId }}</td>
                    <td>{{ item.newAssetStatusName || item.newAssetStatusId }}</td>
                    <td>{{ item.isInfrastructure != null ? (item.isInfrastructure ? 'Yes' : 'No') : '' }}</td>
                    <td>{{ item.newDepartment }}</td>
                    <td>{{ item.newDivision }}</td>
                    <td>{{ item.newCIDMSSubComponentTypeName }}</td>
                    <td>{{ item.newCIDMSComponentTypeName }}</td>
                    <td>{{ item.newCIDMSAccountingGroupName }}</td>
                    <td>{{ item.newCIDMSSubAccountingGroupName }}</td>
                    <td>{{ item.newCIDMSAssetClassName }}</td>
                    <td>{{ item.newCIDMSAssetGroupTypeName }}</td>
                    <td>{{ item.newCIDMSAssetTypeName }}</td>
                    <td>{{ item.estCost | number:'1.2-2' }}</td>
                    <td>{{ item.estAccDep | number:'1.2-2' }}</td>
                    <td>{{ item.estAccImp | number:'1.2-2' }}</td>
                    <td>{{ item.estRevalReserve | number:'1.2-2' }}</td>
                    <td>{{ item.estDepOffset | number:'1.2-2' }}</td>
                    <td>{{ item.estCatchUpDep | number:'1.2-2' }}</td>
                  }
                  <td class="catchup-cell">
                    @if (item.catchUpDep) {
                      {{ item.catchUpDep | number:'1.8-8' }}
                    } @else {
                      <span class="none-label">—</span>
                    }
                  </td>
                  <td class="catchup-cell">
                    @if (item.catchUpDays) {
                      {{ item.catchUpDays }}
                    } @else {
                      <span class="none-label">—</span>
                    }
                  </td>
                  <td>
                    <span class="status-badge" [class]="'status-' + item.status?.toLowerCase()">{{ item.status }}</span>
                  </td>
                  <td style="max-width:340px; word-break:break-word;">
                    @if (isGlBalanceError(item.errorMessage)) {
                      <div class="gl-error-cell">
                        <div class="gl-error-badge"><mat-icon style="font-size:14px;width:14px;height:14px;">account_balance</mat-icon> GL Balance Error</div>
                        <div class="gl-error-msg">GL journal does not balance — check your debit/credit PPI configuration for this asset.</div>
                        <div class="gl-error-links">
                          Go to: <a href="/config/mscoa" target="_blank" class="gl-config-link">mSCOA Configuration</a>
                          &nbsp;or&nbsp;
                          <a href="/config/transaction-types" target="_blank" class="gl-config-link">Transaction Types</a>
                        </div>
                        @if (glBalanceErrorDetail(item.errorMessage)) {
                          <details class="gl-error-detail">
                            <summary>Technical detail</summary>
                            <span>{{ glBalanceErrorDetail(item.errorMessage) }}</span>
                          </details>
                        }
                      </div>
                    } @else {
                      {{ item.errorMessage }}
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
          </div>
        }
      </div>

      @if (showRejectDialog()) {
        <div class="modal-overlay" (click)="showRejectDialog.set(false)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="section-title">Reject Job #{{ selectedJob()!.id }}</div>
            <label class="field-label">Reason for rejection</label>
            <textarea class="field-input" rows="3" [(ngModel)]="rejectReason" placeholder="Enter reason..."></textarea>
            <div style="margin-top:12px; display:flex; gap:8px; justify-content:flex-end;">
              <button class="btn btn-outline" (click)="showRejectDialog.set(false)">Cancel</button>
              <button class="btn btn-danger" (click)="rejectJob()">Reject</button>
            </div>
          </div>
        </div>
      }

      @if (showReverseConfirm()) {
        <div class="modal-overlay" (click)="showReverseConfirm.set(false)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="section-title">Reverse Job #{{ selectedJob()!.id }}</div>
            <p style="font-size:14px; color:#475569; margin:0 0 12px;">
              This will post counter GL entries for all {{ selectedJob()!.totalRecords }} asset transfer(s),
              restoring each asset's original classification. This action cannot be undone via the system.
            </p>
            <p style="font-size:13px; color:#92400e; background:#fef3c7; border:1px solid #fde68a; border-radius:6px; padding:8px 12px; margin:0 0 16px;">
              <strong>Note:</strong> Jobs with catch-up depreciation cannot be reversed — the endpoint will return an error if any was posted.
            </p>
            @if (reverseError()) {
              <div class="alert alert-danger" style="margin-bottom:12px;">
                <mat-icon>error_outline</mat-icon>
                <span>{{ reverseError() }}</span>
              </div>
            }
            <div style="display:flex; gap:8px; justify-content:flex-end;">
              <button class="btn btn-outline" (click)="showReverseConfirm.set(false); reverseError.set('')">Cancel</button>
              <button class="btn btn-danger" (click)="reverseJob()" [disabled]="reversing()">
                @if (reversing()) {
                  <mat-icon class="spin">sync</mat-icon> Reversing...
                } @else {
                  <mat-icon>undo</mat-icon> Confirm Reversal
                }
              </button>
            </div>
          </div>
        </div>
      }
    }
  `,
  styles: [`
    .section-card { background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:20px; }
    .section-title { font-size:16px; font-weight:600; color:#1e293b; margin-bottom:16px; }
    .field-grid { display:grid; gap:16px; }
    .field-label { display:block; font-size:13px; font-weight:500; color:#475569; margin-bottom:4px; }
    .field-input { display:block; width:100%; padding:8px 10px; border:1px solid #cbd5e1; border-radius:6px; font-size:14px; box-sizing:border-box; }
    .btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:6px; font-size:14px; font-weight:500; cursor:pointer; border:none; transition:all 0.15s; }
    .btn mat-icon { font-size:18px; width:18px; height:18px; }
    .btn-sm { padding:5px 10px; font-size:13px; }
    .btn-primary { background:#2563eb; color:#fff; }
    .btn-primary:hover:not(:disabled) { background:#1d4ed8; }
    .btn-primary:disabled { opacity:0.5; cursor:not-allowed; }
    .btn-outline { background:#fff; color:#2563eb; border:1px solid #2563eb; }
    .btn-outline:hover:not(:disabled) { background:#eff6ff; }
    .btn-outline:disabled { opacity:0.5; cursor:not-allowed; }
    .btn-danger { background:#dc2626; color:#fff; }
    .btn-danger:hover:not(:disabled) { background:#b91c1c; }
    .btn-warning { background:#d97706; color:#fff; }
    .btn-warning:hover:not(:disabled) { background:#b45309; }
    .btn-warning:disabled { opacity:0.5; cursor:not-allowed; }
    .alert { padding:10px 14px; border-radius:6px; font-size:14px; display:flex; align-items:flex-start; gap:8px; }
    .alert mat-icon { font-size:18px; width:18px; height:18px; flex-shrink:0; margin-top:1px; }
    .alert-danger { background:#fef2f2; color:#991b1b; border:1px solid #fecaca; }
    .alert-success { background:#f0fdf4; color:#166534; border:1px solid #bbf7d0; }
    .data-table { width:100%; border-collapse:collapse; font-size:13px; }
    .data-table th { background:#f8fafc; padding:8px 12px; text-align:left; font-weight:600; color:#334155; border-bottom:2px solid #e2e8f0; white-space:nowrap; }
    .data-table td { padding:8px 12px; border-bottom:1px solid #f1f5f9; color:#475569; }
    .row-error { background:#fef2f2; }
    .row-posted { background:#f0fdf4; }
    .status-badge { display:inline-block; padding:2px 8px; border-radius:10px; font-size:12px; font-weight:600; }
    .status-pending { background:#fef3c7; color:#92400e; }
    .status-approved { background:#d1fae5; color:#065f46; }
    .status-rejected { background:#fecaca; color:#991b1b; }
    .status-reversed { background:#ede9fe; color:#5b21b6; }
    .status-reversefailed { background:#fecaca; color:#991b1b; }
    .status-reversing { background:#ede9fe; color:#5b21b6; }
    .status-posted { background:#d1fae5; color:#065f46; }
    .status-error { background:#fecaca; color:#991b1b; }
    .type-badge { display:inline-block; padding:2px 8px; border-radius:10px; font-size:12px; font-weight:500; background:#e0e7ff; color:#3730a3; }
    .totals-bar { display:flex; gap:20px; align-items:center; padding:10px 14px; background:#f0f9ff; border:1px solid #bae6fd; border-radius:6px; margin-bottom:16px; font-size:13px; color:#0c4a6e; }
    .totals-label { font-weight:600; }
    .modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; z-index:1000; }
    .modal-card { background:#fff; border-radius:10px; padding:24px; width:480px; max-width:90vw; box-shadow:0 20px 60px rgba(0,0,0,0.15); }
    .catchup-cell { color:#0c4a6e; font-size:12px; white-space:nowrap; }
    .none-label { color:#94a3b8; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .progress-panel { background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:14px 16px; margin-bottom:16px; }
    .progress-header { display:flex; align-items:center; gap:8px; font-size:13px; color:#1e3a8a; margin-bottom:10px; font-weight:500; }
    .progress-counts { margin-left:auto; font-size:13px; color:#1e40af; }
    .progress-bar-track { position:relative; height:10px; background:#dbeafe; border-radius:5px; overflow:hidden; margin-bottom:8px; }
    .progress-bar-posted { position:absolute; top:0; left:0; height:100%; background:#22c55e; border-radius:5px; transition:width 0.4s ease; }
    .progress-bar-errored { position:absolute; top:0; height:100%; background:#ef4444; transition:width 0.4s ease, left 0.4s ease; }
    .progress-legend { display:flex; align-items:center; gap:12px; font-size:11px; color:#475569; }
    .legend-dot { display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:3px; }
    .legend-posted { background:#22c55e; }
    .legend-errored { background:#ef4444; }
    .legend-pending { background:#dbeafe; border:1px solid #93c5fd; }
    .progress-poll-error { margin-left:auto; font-size:11px; color:#92400e; background:#fef3c7; border:1px solid #fde68a; border-radius:4px; padding:2px 6px; display:inline-flex; align-items:center; gap:3px; }
    .completed-pct { margin-left:auto; font-size:12px; font-weight:600; color:#1e40af; }
    .gl-error-cell { display:flex; flex-direction:column; gap:4px; }
    .gl-error-badge { display:inline-flex; align-items:center; gap:3px; background:#fef3c7; color:#92400e; border:1px solid #fde68a; border-radius:4px; padding:2px 6px; font-size:11px; font-weight:600; width:fit-content; }
    .gl-error-msg { font-size:12px; color:#991b1b; font-weight:500; }
    .gl-error-links { font-size:11px; color:#64748b; }
    .gl-config-link { color:#2563eb; text-decoration:underline; font-weight:500; }
    .gl-config-link:hover { color:#1d4ed8; }
    .gl-error-detail { font-size:11px; color:#64748b; margin-top:2px; }
    .gl-error-detail summary { cursor:pointer; color:#475569; }
    .gl-inline-badge { display:inline-flex; align-items:center; gap:2px; background:#fef3c7; color:#92400e; border:1px solid #fde68a; border-radius:3px; padding:1px 5px; font-size:11px; font-weight:600; vertical-align:middle; margin:0 4px; }
  `]
})
export class BulkTransactionApprovalsComponent implements OnInit, OnDestroy {
  jobs = signal<any[]>([]);
  filteredJobs = signal<any[]>([]);
  loading = signal(false);
  typeFilter = '';
  selectedJob = signal<any>(null);
  jobItems = signal<any[]>([]);
  jobTotals = signal<any>(null);
  loadingItems = signal(false);
  approving = signal(false);
  approveError = signal('');
  approveResult = signal<any>(null);
  showRejectDialog = signal(false);
  rejectReason = '';
  approvalProgress = signal<any>(null);
  progressPollError = signal(false);
  reversing = signal(false);
  reverseError = signal('');
  showReverseConfirm = signal(false);
  hasCatchUpDep = computed(() => {
    var j = this.selectedJob();
    return !!(j && (j.hasCatchUpDep === true || j.hasCatchUpDep === 1 || j.HasCatchUpDep === true || j.HasCatchUpDep === 1));
  });
  private _statusCounts = signal<{ posted: number; errored: number; processing: number; total: number }>({ posted: 0, errored: 0, processing: 0, total: 0 });


  private _pollActive = false;
  private _pollJobId: number | null = null;
  private _itemRefreshGen = 0;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadJobs();
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  private _computeAndCacheStatusCounts(items: any[]): void {
    var posted = 0; var errored = 0; var processing = 0;
    for (var i = 0; i < items.length; i++) {
      var s = items[i].status;
      if (s === 'Posted') posted++;
      else if (s === 'Error') errored++;
      else if (s === 'Processing') processing++;
    }
    this._statusCounts.set({ posted: posted, errored: errored, processing: processing, total: items.length });
  }

  itemStatusCounts(): { posted: number; errored: number; processing: number; total: number } {
    return this._statusCounts();
  }

  itemPostedCount(): number { return this._statusCounts().posted; }
  itemErroredCount(): number { return this._statusCounts().errored; }
  itemProcessingCount(): number { return this._statusCounts().processing; }

  progressPostedPct(): number {
    var counts = this._statusCounts();
    if (!counts.total) return 0;
    return Math.min(100, Math.round((counts.posted / counts.total) * 100));
  }

  progressErroredPct(): number {
    var counts = this._statusCounts();
    if (!counts.total) return 0;
    return Math.min(100 - this.progressPostedPct(), Math.round((counts.errored / counts.total) * 100));
  }

  completedPct(): number {
    return Math.min(100, this.progressPostedPct() + this.progressErroredPct());
  }

  private startPolling(jobId: number) {
    this._pollActive = true;
    this._pollJobId = jobId;
    this.progressPollError.set(false);
    this.schedulePoll();
  }

  private schedulePoll() {
    var self = this;
    var jobId = self._pollJobId;
    if (!self._pollActive || jobId === null) return;
    self.api.getBulkTransactionJobProgress(jobId).subscribe({
      next: function(data: any) {
        self.progressPollError.set(false);
        self.approvalProgress.set(data);

        var jobStatus: string = (data && data.jobStatus) ? data.jobStatus : '';
        // When a reversal is in-flight, 'Approved' is non-terminal (background worker
        // may not have written 'Reversing' yet at the time of the first poll tick).
        var isSuccess  = (jobStatus === 'Approved' && !self.reversing()) || jobStatus === 'Reversed';
        var isFailure  = jobStatus === 'Failed' || jobStatus === 'Rejected' || jobStatus === 'ReverseFailed';
        var isNonTerminal = jobStatus === 'Approving' || jobStatus === 'Reversing' || jobStatus === 'Uploading' || jobStatus === 'Pending';

        if (isSuccess || isFailure) {
          self.stopPolling();
          self.approving.set(false);
          self.reversing.set(false);
          self.approvalProgress.set(null);
          var total: number   = data.total   || 0;
          var posted: number  = data.posted  || 0;
          var errored: number = data.errored || 0;
          var currentJob = self.selectedJob();
          if (isSuccess) {
            if (jobStatus === 'Reversed') {
              self.showReverseConfirm.set(false);
              self.reverseError.set('');
              if (currentJob) {
                self.selectedJob.set(Object.assign({}, currentJob, { status: 'Reversed' }));
                self.loadJobItems(jobId!);
              }
            } else {
              self.approveResult.set({ posted: posted, errored: errored, totalItems: total, errors: [] });
              if (currentJob) {
                self.selectedJob.set(Object.assign({}, currentJob, { status: 'Approved', postedRecords: posted, errorRecords: errored }));
                if (currentJob.transactionType === 'RULAdjustment') {
                  self.loadRulApprovalItems(jobId!);
                } else {
                  self.loadJobItems(jobId!);
                }
              }
            }
          } else {
            self.approveError.set('Approval ' + (jobStatus === 'Rejected' ? 'was rejected' : 'failed') + '. ' + posted + ' record(s) posted, ' + errored + ' error(s) before stopping.');
            if (currentJob) {
              self.selectedJob.set(Object.assign({}, currentJob, { status: jobStatus, postedRecords: posted, errorRecords: errored }));
              if (currentJob.transactionType === 'RULAdjustment') {
                self.loadRulApprovalItems(jobId!);
              } else {
                self.loadJobItems(jobId!);
              }
            }
          }
          return;
        }

        self.refreshJobItemsSilent(jobId!);
        if (self._pollActive) {
          setTimeout(function() { self.schedulePoll(); }, 3000);
        }
      },
      error: function() {
        self.progressPollError.set(true);
        if (self._pollActive) {
          setTimeout(function() { self.schedulePoll(); }, 3000);
        }
      }
    });
  }

  private refreshJobItemsSilent(jobId: number) {
    var self = this;
    var gen = ++self._itemRefreshGen;
    self.api.getBulkTransactionJobItems(jobId).subscribe({
      next: function(result: any) {
        if (gen !== self._itemRefreshGen) return;
        var items = result.items || [];
        self.jobItems.set(items);
        self.jobTotals.set(result.totals || null);
        self._computeAndCacheStatusCounts(items);
      },
      error: function() {
        console.warn('[BulkTransactionApprovals] Silent item refresh failed for job', jobId);
      }
    });
  }

  private stopPolling() {
    this._pollActive = false;
    this._pollJobId = null;
  }

  loadJobs() {
    this.loading.set(true);
    var self = this;
    this.api.getBulkTransactionJobs().subscribe({
      next: function(data: any[]) {
        self.jobs.set(data);
        self.applyFilter();
        self.loading.set(false);
      },
      error: function() {
        self.loading.set(false);
      }
    });
  }

  applyFilter() {
    var allJobs = this.jobs();
    var filter = this.typeFilter;
    if (!filter) {
      this.filteredJobs.set(allJobs);
    } else {
      var result: any[] = [];
      for (var i = 0; i < allJobs.length; i++) {
        if (allJobs[i].transactionType === filter) {
          result.push(allJobs[i]);
        }
      }
      this.filteredJobs.set(result);
    }
  }

  viewJob(job: any) {
    this.selectedJob.set(job);
    this.approveError.set('');
    this.approveResult.set(null);
    this.approvalProgress.set(null);
    this.progressPollError.set(false);
    this.jobTotals.set(null);
    if (job.transactionType === 'RULAdjustment') {
      this.loadRulApprovalItems(job.id);
    } else {
      this.loadJobItems(job.id);
    }
  }

  backToList() {
    this.stopPolling();
    this.selectedJob.set(null);
    this.jobItems.set([]);
    this.jobTotals.set(null);
    this.approveError.set('');
    this.approveResult.set(null);
    this.approvalProgress.set(null);
    this.progressPollError.set(false);
    this.loadJobs();
  }

  loadJobItems(jobId: number) {
    this.loadingItems.set(true);
    var self = this;
    this.api.getBulkTransactionJobItems(jobId).subscribe({
      next: function(result: any) {
        var items = result.items || [];
        self.jobItems.set(items);
        self.jobTotals.set(result.totals || null);
        self._computeAndCacheStatusCounts(items);
        self.loadingItems.set(false);
      },
      error: function() {
        self.loadingItems.set(false);
      }
    });
  }

  loadRulApprovalItems(jobId: number) {
    this.loadingItems.set(true);
    var self = this;
    this.api.getRulApprovalData(jobId).subscribe({
      next: function(data: any[]) {
        var items = [];
        for (var i = 0; i < data.length; i++) {
          var d = data[i];
          var item: any = {};
          for (var k in d) { item[k] = d[k]; }
          item.id = d.itemId;
          item.assetRegisterItemID = d.assetId;
          items.push(item);
        }
        self.jobItems.set(items);
        self.jobTotals.set(null);
        self._computeAndCacheStatusCounts(items);
        self.loadingItems.set(false);
      },
      error: function() {
        self.loadingItems.set(false);
      }
    });
  }

  approveJob() {
    var job = this.selectedJob();
    if (!job) return;
    this.approving.set(true);
    this.approveError.set('');
    this.approveResult.set(null);
    this.approvalProgress.set(null);
    var self = this;
    this.startPolling(job.id);
    this.api.approveBulkTransactionJob(job.id).subscribe({
      next: function(result: any) {
        // 202 Accepted — background worker started; keep polling until jobStatus is terminal
        if (result && result.status === 'Approving') {
          return;
        }
        // Legacy synchronous response (fallback — should not occur with current APIs)
        self.stopPolling();
        self.approving.set(false);
        self.approvalProgress.set(null);
        self.approveResult.set(result);
        var updatedJob = Object.assign({}, job, { status: 'Approved', postedRecords: result.posted, errorRecords: result.errored });
        self.selectedJob.set(updatedJob);
        if (job.transactionType === 'RULAdjustment') {
          self.loadRulApprovalItems(job.id);
        } else {
          self.loadJobItems(job.id);
        }
      },
      error: function(err: any) {
        self.stopPolling();
        self.approving.set(false);
        self.approvalProgress.set(null);
        var base = err?.error?.error || err?.message || 'Approval failed';
        var detail = err?.error?.detail;
        var inserted = err?.error?.insertedBeforeFailure;
        var msg = base;
        if (detail) msg += ': ' + detail;
        if (inserted != null) msg += ' (' + inserted + ' record(s) inserted before failure)';
        self.approveError.set(msg);
      }
    });
  }

  isGlBalanceError(msg: string): boolean {
    if (!msg) return false;
    return msg.indexOf('GL_BALANCE_ERROR:') === 0;
  }

  glBalanceErrorDetail(msg: string): string {
    if (!msg) return '';
    var idx = msg.indexOf('Detail: ');
    if (idx !== -1) return msg.substring(idx + 8);
    return '';
  }

  formatAmount(value: number): string {
    if (!value && value !== 0) return '0.00';
    var parts = value.toFixed(2).split('.');
    var intPart = parts[0];
    var decPart = parts[1];
    var result = '';
    var count = 0;
    for (var i = intPart.length - 1; i >= 0; i--) {
      if (count > 0 && count % 3 === 0) result = ',' + result;
      result = intPart[i] + result;
      count++;
    }
    return result + '.' + decPart;
  }

  rejectJob() {
    var job = this.selectedJob();
    if (!job) return;
    var self = this;
    this.api.rejectBulkTransactionJob(job.id, this.rejectReason).subscribe({
      next: function() {
        self.showRejectDialog.set(false);
        var updatedJob = Object.assign({}, job, { status: 'Rejected', rejectionReason: self.rejectReason });
        self.selectedJob.set(updatedJob);
        self.rejectReason = '';
      },
      error: function(err: any) {
        self.approveError.set(err?.error?.error || err?.message || 'Rejection failed');
        self.showRejectDialog.set(false);
      }
    });
  }

  exportTransferItemsXlsx() {
    var job = this.selectedJob();
    if (!job) return;
    var a = document.createElement('a');
    a.href = '/api/bulk-transactions/jobs/' + job.id + '/export-transfer';
    a.download = 'Transfer_Job_' + job.id + '_Items.xlsx';
    a.click();
  }

  getRulMonthsCompleted(item: any): number | null {
    var adj = item.adjUsefulLifeMonths;
    var rul = item.adjRemainingUsefulLifeMonths;
    if (adj == null || rul == null) return null;
    return adj - rul;
  }

  getRulYearsCompleted(item: any): number | null {
    var mc = this.getRulMonthsCompleted(item);
    if (mc == null) return null;
    return mc / 12;
  }

  retryErrors() {
    var job = this.selectedJob();
    if (!job) return;
    this.approving.set(true);
    this.approveError.set('');
    this.approveResult.set(null);
    this.approvalProgress.set(null);
    var self = this;
    this.startPolling(job.id);
    this.api.retryBulkTransactionErrors(job.id).subscribe({
      next: function(result: any) {
        // 202 Accepted — background worker started; keep polling until jobStatus is terminal
        if (result && (result.status === 'Retrying' || result.status === 'Approving')) {
          return;
        }
        // Legacy synchronous response (fallback — should not occur with current APIs)
        self.stopPolling();
        self.approving.set(false);
        self.approvalProgress.set(null);
        self.approveResult.set(result);
        var updatedJob = Object.assign({}, job, { status: 'Approved', postedRecords: result.posted, errorRecords: result.errored });
        self.selectedJob.set(updatedJob);
        if (job.transactionType === 'RULAdjustment') {
          self.loadRulApprovalItems(job.id);
        } else {
          self.loadJobItems(job.id);
        }
      },
      error: function(err: any) {
        self.stopPolling();
        self.approving.set(false);
        self.approvalProgress.set(null);
        var base = err?.error?.error || err?.message || 'Retry failed';
        var detail = err?.error?.detail;
        var msg = base;
        if (detail) msg += ': ' + detail;
        self.approveError.set(msg);
      }
    });
  }

  reverseJob() {
    var job = this.selectedJob();
    if (!job) return;
    this.reversing.set(true);
    this.reverseError.set('');
    var self = this;
    this.api.reverseBulkTransactionJob(job.id).subscribe({
      next: function(result: any) {
        // 202 Accepted — background worker started; start polling NOW (not before the
        // HTTP call, which would race against the job still being in 'Approved' status)
        if (result && result.status === 'Reversing') {
          self.startPolling(job.id);
          return;
        }
        // Synchronous success fallback (non-202 path)
        self.stopPolling();
        self.reversing.set(false);
        self.showReverseConfirm.set(false);
        self.selectedJob.set(Object.assign({}, job, { status: 'Reversed' }));
        self.loadJobItems(job.id);
      },
      error: function(err: any) {
        self.stopPolling();
        self.reversing.set(false);
        var msg = err?.error?.error || err?.message || 'Reversal failed';
        self.reverseError.set(msg);
      }
    });
  }
}
