import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../../core/api.service';

@Component({
  selector: 'app-bulk-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="section-card">
      <div class="section-title">Bulk Transactions — Upload &amp; Validate</div>

      <div class="field-grid" style="grid-template-columns: 1fr 1fr; max-width: 700px;">
        <div>
          <label class="field-label">Transaction Type</label>
          <select class="field-input" [(ngModel)]="transactionType">
            <option value="">— Select —</option>
            <option value="Revaluation">Revaluation</option>
            <option value="Impairment">Impairment</option>
            <option value="ImpairmentReversal">Impairment Reversal</option>
            <option value="Disposal">Disposal</option>
            <option value="Refurbishment">Refurbishment</option>
          </select>
        </div>
        <div style="display:flex; align-items:flex-end; gap:10px;">
          <button class="btn btn-outline" (click)="downloadTemplate()" [disabled]="!transactionType">
            <mat-icon>download</mat-icon> Download Template
          </button>
        </div>
      </div>

      @if (transactionType) {
        <div style="margin-top:16px;">
          <label class="field-label">Upload Excel File (.xlsx)</label>
          <input type="file" accept=".xlsx,.xls" (change)="onFileSelected($event)" #fileInput class="field-input" style="padding:6px;" />
        </div>

        <div style="margin-top:12px;">
          <button class="btn btn-primary" (click)="upload()" [disabled]="!selectedFile || uploading()">
            @if (uploading()) {
              <mat-icon class="spin">sync</mat-icon> Uploading...
            } @else {
              <mat-icon>cloud_upload</mat-icon> Upload &amp; Validate
            }
          </button>
        </div>
      }

      @if (uploadError()) {
        <div class="alert alert-danger" style="margin-top:16px;">
          <mat-icon>error</mat-icon> {{ uploadError() }}
        </div>
      }

      @if (validationErrors().length > 0) {
        <div style="margin-top:16px;">
          <div class="alert alert-danger">
            <mat-icon>error</mat-icon> Validation failed — {{ validationErrors().length }} issue(s) found:
          </div>
          <table class="data-table" style="margin-top:8px;">
            <thead>
              <tr><th>Row</th><th>Error(s)</th></tr>
            </thead>
            <tbody>
              @for (ve of validationErrors(); track ve.row) {
                <tr>
                  <td>{{ ve.row === 0 ? 'General' : ve.row }}</td>
                  <td>
                    @for (e of ve.errors; track e) {
                      <div>{{ e }}</div>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (uploadSuccess()) {
        <div class="alert alert-success" style="margin-top:16px;">
          <mat-icon>check_circle</mat-icon> Successfully uploaded {{ uploadResult().totalRows }} {{ uploadResult().transactionType }} records (Job #{{ uploadResult().jobId }}). Go to "Bulk Transaction Approvals" to approve.
        </div>
      }
    </div>

    <div class="section-card" style="margin-top:20px;">
      <div class="section-title">Template Columns by Type</div>
      <table class="data-table">
        <thead>
          <tr><th>Type</th><th>Required Columns</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Revaluation</strong></td>
            <td>AssetRegisterItem_ID, RevaluationDate, MarketValue, ValuationModule (1=Cost,2=Revaluation,3=Fair Value), DepAdjustment</td>
          </tr>
          <tr>
            <td><strong>Impairment</strong></td>
            <td>AssetRegisterItem_ID, TransactionDate, ImpairmentType (cash_generating / non_cash_generating), RecoverableAmount, ValueInUse, Reason</td>
          </tr>
          <tr>
            <td><strong>Impairment Reversal</strong></td>
            <td>AssetRegisterItem_ID, TransactionDate, RecoverableAmount, ValueInUse, Reason</td>
          </tr>
          <tr>
            <td><strong>Disposal</strong></td>
            <td>AssetRegisterItem_ID, DisposalDate, Method, DisposalProceeds, Reason</td>
          </tr>
          <tr>
            <td><strong>Refurbishment</strong></td>
            <td>AssetRegisterItem_ID, RefurbDate, Refurb_DT, Refurb_CT, Refurb_Depreciation, Refurb_Revaluation, Refurb_Impairment, DebitPlanProjectItemId, CreditPlanProjectItemId</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .section-card { background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:20px; }
    .section-title { font-size:16px; font-weight:600; color:#1e293b; margin-bottom:16px; }
    .field-grid { display:grid; gap:16px; }
    .field-label { display:block; font-size:13px; font-weight:500; color:#475569; margin-bottom:4px; }
    .field-input { display:block; width:100%; padding:8px 10px; border:1px solid #cbd5e1; border-radius:6px; font-size:14px; box-sizing:border-box; }
    .field-input:focus { outline:none; border-color:#2563eb; box-shadow:0 0 0 2px rgba(37,99,235,0.15); }
    .btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:6px; font-size:14px; font-weight:500; cursor:pointer; border:none; transition:all 0.15s; }
    .btn mat-icon { font-size:18px; width:18px; height:18px; }
    .btn-primary { background:#2563eb; color:#fff; }
    .btn-primary:hover:not(:disabled) { background:#1d4ed8; }
    .btn-primary:disabled { opacity:0.5; cursor:not-allowed; }
    .btn-outline { background:#fff; color:#2563eb; border:1px solid #2563eb; }
    .btn-outline:hover:not(:disabled) { background:#eff6ff; }
    .btn-outline:disabled { opacity:0.5; cursor:not-allowed; }
    .alert { padding:10px 14px; border-radius:6px; font-size:14px; display:flex; align-items:flex-start; gap:8px; }
    .alert mat-icon { font-size:18px; width:18px; height:18px; flex-shrink:0; margin-top:1px; }
    .alert-danger { background:#fef2f2; color:#991b1b; border:1px solid #fecaca; }
    .alert-success { background:#f0fdf4; color:#166534; border:1px solid #bbf7d0; }
    .data-table { width:100%; border-collapse:collapse; font-size:13px; }
    .data-table th { background:#f8fafc; padding:8px 12px; text-align:left; font-weight:600; color:#334155; border-bottom:2px solid #e2e8f0; }
    .data-table td { padding:8px 12px; border-bottom:1px solid #f1f5f9; color:#475569; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `]
})
export class BulkTransactionsComponent {
  transactionType = '';
  selectedFile: File | null = null;
  uploading = signal(false);
  uploadError = signal('');
  uploadSuccess = signal(false);
  uploadResult = signal<any>({});
  validationErrors = signal<any[]>([]);

  constructor(private api: ApiService) {}

  downloadTemplate() {
    if (!this.transactionType) return;
    this.api.downloadBulkTransactionTemplate(this.transactionType);
  }

  onFileSelected(event: Event) {
    var input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  upload() {
    if (!this.selectedFile || !this.transactionType) return;
    this.uploading.set(true);
    this.uploadError.set('');
    this.uploadSuccess.set(false);
    this.validationErrors.set([]);
    this.uploadResult.set({});

    var self = this;
    this.api.uploadBulkTransactions(this.selectedFile, this.transactionType).subscribe({
      next: function(result: any) {
        self.uploading.set(false);
        self.uploadSuccess.set(true);
        self.uploadResult.set(result);
      },
      error: function(err: any) {
        self.uploading.set(false);
        var errData = err?.error;
        if (errData && errData.validationErrors) {
          self.validationErrors.set(errData.validationErrors);
          self.uploadError.set(errData.error || 'Validation failed');
        } else {
          self.uploadError.set(errData?.error || err?.message || 'Upload failed');
        }
      }
    });
  }
}
