import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/api.service';

@Component({
  selector: 'app-uploaded-items',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatProgressBarModule, MatSnackBarModule],
  templateUrl: './uploaded-items.component.html',
  styleUrls: ['./uploaded-items.component.css']
})
export class UploadedItemsComponent implements OnInit, OnDestroy {
  items = signal<any[]>([]);
  loading = signal(true);
  financialYear = '';
  financialYears: string[] = [];
  totals = signal<any>({
    numberOfRecords: 0,
    openingBalanceCost: 0,
    accumulatedDepreciation: 0,
    accumulatedImpairment: 0,
    carryingAmount: 0,
    revaluationOpeningBalance: 0
  });
  jobs = signal<any[]>([]);
  approvingJobId = signal<number | null>(null);
  approveProgress = signal<any>(null);
  jobFinancialYears: { [jobId: number]: string } = {};
  private progressInterval: any = null;

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.buildFinancialYears();
    this.loadData();
    this.loadJobs();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  buildFinancialYears(): void {
    var currentYear = new Date().getFullYear();
    this.financialYears = [];
    for (var y = currentYear + 1; y >= currentYear - 5; y--) {
      this.financialYears.push((y - 1) + '/' + y);
    }
  }

  loadData(): void {
    this.loading.set(true);
    this.api.getUploadedItems(this.financialYear || undefined).subscribe({
      next: function(this: UploadedItemsComponent, data: any[]) {
        this.items.set(data);
        var t = { numberOfRecords: 0, openingBalanceCost: 0, accumulatedDepreciation: 0, accumulatedImpairment: 0, carryingAmount: 0, revaluationOpeningBalance: 0 };
        for (var i = 0; i < data.length; i++) {
          t.numberOfRecords += data[i].numberOfRecords || 0;
          t.openingBalanceCost += data[i].openingBalanceCost || 0;
          t.accumulatedDepreciation += data[i].accumulatedDepreciation || 0;
          t.accumulatedImpairment += data[i].accumulatedImpairment || 0;
          t.carryingAmount += data[i].carryingAmount || 0;
          t.revaluationOpeningBalance += data[i].revaluationOpeningBalance || 0;
        }
        this.totals.set(t);
        this.loading.set(false);
      }.bind(this),
      error: function(this: UploadedItemsComponent) { this.loading.set(false); }.bind(this)
    });
  }

  loadJobs(): void {
    this.api.getBulkUploadJobs().subscribe({
      next: function(this: UploadedItemsComponent, data: any[]) {
        var pending: any[] = [];
        for (var i = 0; i < data.length; i++) {
          if (data[i].runID && data[i].job_Status === 'Completed Successfully!') {
            pending.push(data[i]);
          }
        }
        this.jobs.set(pending);
      }.bind(this)
    });
  }

  onFinancialYearChange(): void {
    this.loadData();
  }

  getJobFinancialYear(jobId: number): string {
    return this.jobFinancialYears[jobId] || '';
  }

  setJobFinancialYear(jobId: number, fy: string): void {
    this.jobFinancialYears[jobId] = fy;
  }

  canApprove(jobId: number): boolean {
    return !!this.jobFinancialYears[jobId] && this.approvingJobId() === null;
  }

  approveJob(job: any): void {
    var fy = this.jobFinancialYears[job.id];
    if (!fy) {
      this.snackBar.open('Please select a Financial Year before approving.', 'OK', { duration: 4000 });
      return;
    }
    if (!confirm('Are you sure you want to approve job "' + job.filename + '" for financial year ' + fy + '? This will copy ' + job.no_RecordsInserted + ' records to the asset register.')) return;
    this.approvingJobId.set(job.id);
    this.approveProgress.set({ phase: 'starting', percent: 2, message: 'Starting approval...' });
    this.startApprovePolling(job.id);
    this.api.approveBulkUpload(job.id, fy).subscribe({
      next: function(this: UploadedItemsComponent, result: any) {
        this.stopPolling();
        this.approveProgress.set({ phase: 'complete', percent: 100, message: 'Approved! ' + result.approvedRecords + ' records added.' });
        var self = this;
        setTimeout(function() {
          self.approvingJobId.set(null);
          self.approveProgress.set(null);
        }, 2000);
        this.snackBar.open('Approved! ' + result.approvedRecords + ' records added to asset register.', 'OK', { duration: 5000 });
        this.loadData();
        this.loadJobs();
      }.bind(this),
      error: function(this: UploadedItemsComponent, err: any) {
        this.stopPolling();
        this.approvingJobId.set(null);
        this.approveProgress.set(null);
        this.snackBar.open(err.error?.error || 'Approval failed', 'OK', { duration: 5000 });
      }.bind(this)
    });
  }

  private startApprovePolling(jobId: number): void {
    if (this.progressInterval) return;
    var self = this;
    var key = 'approve_' + jobId;
    this.progressInterval = setInterval(function() {
      if (!self.approvingJobId()) {
        self.stopPolling();
        return;
      }
      self.api.getBulkUploadProgress(key).subscribe({
        next: function(info: any) {
          if (info && info.phase !== 'unknown') {
            self.approveProgress.set(info);
          }
        }
      });
    }, 1000);
  }

  private stopPolling(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  rejectJob(job: any): void {
    if (!confirm('Are you sure you want to reject job "' + job.filename + '"?')) return;
    this.api.rejectBulkUpload(job.id).subscribe({
      next: function(this: UploadedItemsComponent) {
        this.snackBar.open('Job rejected.', 'OK', { duration: 3000 });
        this.loadJobs();
      }.bind(this),
      error: function(this: UploadedItemsComponent, err: any) {
        this.snackBar.open(err.error?.error || 'Rejection failed', 'OK', { duration: 5000 });
      }.bind(this)
    });
  }

  isApproving(jobId: number): boolean {
    return this.approvingJobId() === jobId;
  }

  formatCurrency(value: number): string {
    if (value == null) return '0.00';
    var parts = value.toFixed(2).split('.');
    var intPart = parts[0];
    var result = '';
    var count = 0;
    for (var i = intPart.length - 1; i >= 0; i--) {
      if (count > 0 && count % 3 === 0) result = ' ' + result;
      result = intPart[i] + result;
      count++;
    }
    return result + '.' + parts[1];
  }
}
