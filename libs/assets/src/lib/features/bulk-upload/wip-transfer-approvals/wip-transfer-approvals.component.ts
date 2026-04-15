import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../../core/api.service';

@Component({
  selector: 'app-wip-transfer-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatProgressBarModule, MatSnackBarModule, MatTooltipModule],
  templateUrl: './wip-transfer-approvals.component.html',
  styleUrls: ['./wip-transfer-approvals.component.css']
})
export class WipTransferApprovalsComponent implements OnInit, OnDestroy {
  jobs = signal<any[]>([]);
  loading = signal(true);
  selectedJob: any = null;
  uploadedRecords = signal<any[]>([]);
  loadingRecords = false;

  financialYears: string[] = [];
  projects: any[] = [];
  scoaItems: any[] = [];

  selectedYear: string = '';
  selectedProjectId: string = '';
  selectedScoaItemId: string = '';
  mainAssetIdInput: string = '';
  mainAssetValid: boolean | null = null;
  mainAssetDescription: string = '';
  mainAssetValidating: boolean = false;
  transferDate: string = '';

  approving = false;
  rejecting = false;
  approvalProgress = signal<any>(null);
  private progressInterval: any = null;
  private currentApproveKey: string = '';

  statusFilter: string = 'pending';

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadJobs();
    this.loadFinancialYears();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  loadJobs(): void {
    this.loading.set(true);
    this.api.getWipJobs().subscribe({
      next: function(this: WipTransferApprovalsComponent, data: any[]) {
        this.jobs.set(data);
        this.loading.set(false);
      }.bind(this),
      error: function(this: WipTransferApprovalsComponent) { this.loading.set(false); }.bind(this)
    });
  }

  get filteredJobs(): any[] {
    var all = this.jobs();
    var result: any[] = [];
    for (var i = 0; i < all.length; i++) {
      var job = all[i];
      if (this.statusFilter === 'pending') {
        if (job.job_Status === 'Completed Successfully!') result.push(job);
      } else if (this.statusFilter === 'approved') {
        if (job.job_Status === 'Approved') result.push(job);
      } else if (this.statusFilter === 'rejected') {
        if (job.job_Status === 'Not Approved') result.push(job);
      } else {
        result.push(job);
      }
    }
    return result;
  }

  loadFinancialYears(): void {
    this.api.getWipTransferFinancialYears().subscribe({
      next: function(this: WipTransferApprovalsComponent, data: string[]) {
        var unique: string[] = [];
        for (var i = 0; i < data.length; i++) {
          if (data[i] && unique.indexOf(data[i]) < 0) unique.push(data[i]);
        }
        this.financialYears = unique;
      }.bind(this)
    });
  }

  selectJob(job: any): void {
    if (this.selectedJob?.id === job.id) return;
    this.selectedJob = job;
    this.resetForm();
    this.uploadedRecords.set([]);
    if (job && job.runID) {
      this.loadingRecords = true;
      this.api.getUploadedItemsByRun(job.runID).subscribe({
        next: function(this: WipTransferApprovalsComponent, data: any[]) {
          this.uploadedRecords.set(data);
          this.loadingRecords = false;
        }.bind(this),
        error: function(this: WipTransferApprovalsComponent) {
          this.loadingRecords = false;
        }.bind(this)
      });
    }
  }

  resetForm(): void {
    this.selectedYear = '';
    this.selectedProjectId = '';
    this.selectedScoaItemId = '';
    this.mainAssetIdInput = '';
    this.mainAssetValid = null;
    this.mainAssetDescription = '';
    this.mainAssetValidating = false;
    this.transferDate = '';
    this.projects = [];
    this.scoaItems = [];
    this.approvalProgress.set(null);
  }

  onYearChange(): void {
    this.selectedProjectId = '';
    this.selectedScoaItemId = '';
    this.projects = [];
    this.scoaItems = [];
    if (this.selectedYear) {
      this.api.getWipTransferProjects(this.selectedYear).subscribe({
        next: function(this: WipTransferApprovalsComponent, data: any[]) { this.projects = data; }.bind(this)
      });
    }
  }

  onProjectChange(): void {
    this.selectedScoaItemId = '';
    this.scoaItems = [];
    if (this.selectedProjectId) {
      this.api.getWipTransferScoaItems(Number(this.selectedProjectId)).subscribe({
        next: function(this: WipTransferApprovalsComponent, data: any[]) { this.scoaItems = data; }.bind(this)
      });
    }
  }

  validateAssetId(): void {
    var val = (this.mainAssetIdInput || '').trim();
    if (!val || isNaN(Number(val))) {
      this.mainAssetValid = false;
      this.mainAssetDescription = '';
      return;
    }
    this.mainAssetValidating = true;
    this.mainAssetValid = null;
    this.mainAssetDescription = '';
    this.api.validateWipTransferAssetId(Number(val)).subscribe({
      next: function(this: WipTransferApprovalsComponent, res: any) {
        this.mainAssetValidating = false;
        this.mainAssetValid = res.valid === true;
        this.mainAssetDescription = res.valid ? (res.description || '') : '';
      }.bind(this),
      error: function(this: WipTransferApprovalsComponent) {
        this.mainAssetValidating = false;
        this.mainAssetValid = false;
        this.mainAssetDescription = '';
      }.bind(this)
    });
  }

  canApprove(): boolean {
    return !!(this.selectedJob &&
      this.selectedJob.job_Status === 'Completed Successfully!' &&
      this.selectedYear &&
      this.selectedProjectId &&
      this.selectedScoaItemId &&
      this.mainAssetIdInput.trim() &&
      this.mainAssetValid === true &&
      this.transferDate &&
      !this.approving &&
      !this.rejecting);
  }

  canReject(): boolean {
    return !!(this.selectedJob &&
      (this.selectedJob.job_Status === 'Completed Successfully!' || this.selectedJob.job_Status === 'Completed Unsuccessfully! With Validation Error Log') &&
      !this.approving &&
      !this.rejecting);
  }

  approve(): void {
    if (!this.canApprove()) return;
    this.approving = true;
    this.approvalProgress.set({ phase: 'approving', percent: 5, message: 'Initiating WIP transfer...' });
    var jobId = this.selectedJob.id;
    this.currentApproveKey = 'approve_wip_' + jobId;
    this.startProgressPolling(this.currentApproveKey);

    var body = {
      financialYear: this.selectedYear,
      mainAssetId: Number(this.mainAssetIdInput.trim()),
      creditPlanProjectItemId: Number(this.selectedScoaItemId),
      transferDate: this.transferDate
    };
    this.api.approveWipTransfer(jobId, body).subscribe({
      next: function(this: WipTransferApprovalsComponent, res: any) {
        this.stopPolling();
        this.approving = false;
        this.approvalProgress.set({ phase: 'complete', percent: 100, message: 'Transfer complete! ' + (res.approvedRecords || res.assetsCreated || '') + ' records transferred.' });
        this.snackBar.open('WIP transfer approved! ' + (res.approvedRecords || res.assetsCreated || '') + ' assets transferred to register.', 'OK', { duration: 6000 });
        var self = this;
        setTimeout(function() {
          self.selectedJob = null;
          self.resetForm();
          self.loadJobs();
        }, 2000);
      }.bind(this),
      error: function(this: WipTransferApprovalsComponent, err: any) {
        this.stopPolling();
        this.approving = false;
        this.approvalProgress.set(null);
        this.snackBar.open(err.error?.error || err.error?.detail || 'Approval failed', 'OK', { duration: 8000 });
      }.bind(this)
    });
  }

  reject(): void {
    if (!this.canReject()) return;
    if (!confirm('Reject this WIP transfer job? The job status will be set to "Not Approved".')) return;
    this.rejecting = true;
    var jobId = this.selectedJob.id;
    this.api.rejectBulkUpload(jobId).subscribe({
      next: function(this: WipTransferApprovalsComponent) {
        this.rejecting = false;
        this.snackBar.open('WIP job rejected successfully.', 'OK', { duration: 4000 });
        this.selectedJob = null;
        this.resetForm();
        this.loadJobs();
      }.bind(this),
      error: function(this: WipTransferApprovalsComponent, err: any) {
        this.rejecting = false;
        this.snackBar.open(err.error?.error || 'Reject failed', 'OK', { duration: 5000 });
      }.bind(this)
    });
  }

  getStatusClass(status: string): string {
    if (!status) return '';
    if (status === 'Completed Successfully!') return 'status-ready';
    if (status === 'Approved') return 'status-approved';
    if (status === 'Not Approved') return 'status-rejected';
    if (status.indexOf('Failed') >= 0 || status.indexOf('Unsuccessfully') >= 0) return 'status-error';
    return 'status-new';
  }

  getStatusLabel(status: string): string {
    if (!status) return 'Unknown';
    if (status === 'Completed Successfully!') return 'Awaiting Approval';
    if (status === 'Approved') return 'Approved';
    if (status === 'Not Approved') return 'Rejected';
    return status;
  }

  isPending(job: any): boolean {
    return job.job_Status === 'Completed Successfully!';
  }

  totalCarryingAmount(): number {
    var sum = 0;
    var recs = this.uploadedRecords();
    for (var i = 0; i < recs.length; i++) sum += recs[i].carryingAmount || 0;
    return sum;
  }

  totalRecords(): number {
    var sum = 0;
    var recs = this.uploadedRecords();
    for (var i = 0; i < recs.length; i++) sum += recs[i].numberOfRecords || 0;
    return sum;
  }

  private startProgressPolling(key: string): void {
    if (this.progressInterval) return;
    var self = this;
    this.progressInterval = setInterval(function() {
      if (!self.approving) {
        self.stopPolling();
        return;
      }
      self.api.getBulkUploadProgress(key).subscribe({
        next: function(info: any) {
          if (info && info.phase && info.phase !== 'unknown') {
            self.approvalProgress.set(info);
          }
        }
      });
    }, 1200);
  }

  private stopPolling(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }
}
