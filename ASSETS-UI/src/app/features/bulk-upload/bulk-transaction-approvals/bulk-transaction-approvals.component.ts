import { Component, signal, OnInit } from '@angular/core';
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
            <button class="btn btn-outline btn-sm" (click)="backToList()">
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
          <div class="alert alert-success" style="margin-bottom:12px;">
            <mat-icon>check_circle</mat-icon>
            Approved: {{ approveResult().posted }} posted, {{ approveResult().errored }} errors out of {{ approveResult().totalItems }} items.
          </div>
          @if (approveResult().errors?.length > 0) {
            <div class="alert alert-danger" style="margin-bottom:12px; flex-direction:column;">
              <div style="font-weight:600; margin-bottom:8px;">Posting errors:</div>
              @for (e of approveResult().errors; track e.row) {
                <div>Row {{ e.row }} (Asset {{ e.assetId }}): {{ e.error }}</div>
              }
            </div>
          }
        }

        @if (loadingItems()) {
          <div style="padding:20px; text-align:center; color:#64748b;">Loading items...</div>
        } @else {
          <table class="data-table">
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
                  <td>
                    <span class="status-badge" [class]="'status-' + item.status?.toLowerCase()">{{ item.status }}</span>
                  </td>
                  <td style="max-width:300px; word-break:break-word;">{{ item.errorMessage }}</td>
                </tr>
              }
            </tbody>
          </table>
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
    .btn-danger { background:#dc2626; color:#fff; }
    .btn-danger:hover:not(:disabled) { background:#b91c1c; }
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
    .status-posted { background:#d1fae5; color:#065f46; }
    .status-error { background:#fecaca; color:#991b1b; }
    .type-badge { display:inline-block; padding:2px 8px; border-radius:10px; font-size:12px; font-weight:500; background:#e0e7ff; color:#3730a3; }
    .totals-bar { display:flex; gap:20px; align-items:center; padding:10px 14px; background:#f0f9ff; border:1px solid #bae6fd; border-radius:6px; margin-bottom:16px; font-size:13px; color:#0c4a6e; }
    .totals-label { font-weight:600; }
    .modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; z-index:1000; }
    .modal-card { background:#fff; border-radius:10px; padding:24px; width:480px; max-width:90vw; box-shadow:0 20px 60px rgba(0,0,0,0.15); }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `]
})
export class BulkTransactionApprovalsComponent implements OnInit {
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

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadJobs();
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
    this.jobTotals.set(null);
    this.loadJobItems(job.id);
  }

  backToList() {
    this.selectedJob.set(null);
    this.jobItems.set([]);
    this.jobTotals.set(null);
    this.approveError.set('');
    this.approveResult.set(null);
    this.loadJobs();
  }

  loadJobItems(jobId: number) {
    this.loadingItems.set(true);
    var self = this;
    this.api.getBulkTransactionJobItems(jobId).subscribe({
      next: function(result: any) {
        self.jobItems.set(result.items || []);
        self.jobTotals.set(result.totals || null);
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
    var self = this;
    this.api.approveBulkTransactionJob(job.id).subscribe({
      next: function(result: any) {
        self.approving.set(false);
        self.approveResult.set(result);
        var updatedJob = Object.assign({}, job, { status: 'Approved', postedRecords: result.posted, errorRecords: result.errored });
        self.selectedJob.set(updatedJob);
        self.loadJobItems(job.id);
      },
      error: function(err: any) {
        self.approving.set(false);
        self.approveError.set(err?.error?.error || err?.message || 'Approval failed');
      }
    });
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
}
