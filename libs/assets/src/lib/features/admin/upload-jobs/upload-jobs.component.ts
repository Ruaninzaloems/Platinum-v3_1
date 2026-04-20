import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../../core/api.service';

@Component({
  selector: 'app-upload-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatProgressBarModule, MatSnackBarModule, MatTooltipModule],
  templateUrl: './upload-jobs.component.html',
  styleUrls: ['./upload-jobs.component.css']
})
export class UploadJobsComponent implements OnInit, OnDestroy {
  jobs = signal<any[]>([]);
  filteredJobs = signal<any[]>([]);
  loading = signal(true);
  uploading = signal(false);
  uploadProgress = signal<any>(null);
  uploadTypes = signal<any[]>([]);
  loadingTypes = signal(true);
  selectedUploadType = signal<number | null>(null);
  filters: any = { filename: '', job_Status: '', date_Created: '' };
  private progressInterval: any = null;

  constructor(private api: ApiService, private snackBar: MatSnackBar, private router: Router) {}

  ngOnInit(): void {
    this.loadData();
    this.loadUploadTypes();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  loadUploadTypes(): void {
    this.loadingTypes.set(true);
    this.api.getUploadTypes().subscribe({
      next: function(this: UploadJobsComponent, types: any[]) { this.uploadTypes.set(types); this.loadingTypes.set(false); }.bind(this),
      error: function(this: UploadJobsComponent) { this.loadingTypes.set(false); }.bind(this)
    });
  }

  loadData(): void {
    this.loading.set(true);
    this.api.getBulkUploadJobs().subscribe({
      next: function(this: UploadJobsComponent, data: any[]) { this.jobs.set(data); this.applyFilters(); this.loading.set(false); }.bind(this),
      error: function(this: UploadJobsComponent) { this.loading.set(false); }.bind(this)
    });
  }

  private static readonly normalUploadTypes = new Set([1, 3, 4]);

  applyFilters(): void {
    var result: any[] = [];
    var all = this.jobs();
    for (var i = 0; i < all.length; i++) {
      var item = all[i];
      var typeId = item.uploadType != null ? item.uploadType : 1;
      if (!UploadJobsComponent.normalUploadTypes.has(typeId)) continue;
      var match = true;
      if (this.filters.filename && !(item.filename || '').toLowerCase().includes(this.filters.filename.toLowerCase())) match = false;
      if (this.filters.job_Status && !(item.job_Status || '').toLowerCase().includes(this.filters.job_Status.toLowerCase())) match = false;
      if (match) result.push(item);
    }
    this.filteredJobs.set(result);
  }

  onFileSelected(event: Event): void {
    var input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.uploadFile(input.files[0]);
      input.value = '';
    }
  }

  private currentProgressKey: string = '';

  uploadFile(file: File): void {
    var uploadType = this.selectedUploadType();
    if (uploadType === null) {
      this.snackBar.open('Please select an Upload Type before uploading a file.', 'OK', { duration: 4000 });
      return;
    }
    this.uploading.set(true);
    this.uploadProgress.set({ phase: 'uploading', percent: 2, message: 'Uploading file...' });
    this.currentProgressKey = 'upload_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    this.startUploadPolling(this.currentProgressKey);
    this.api.uploadBulkFile(file, uploadType, this.currentProgressKey).subscribe({
      next: function(this: UploadJobsComponent, result: any) {
        this.stopPolling();
        this.uploadProgress.set({ phase: 'complete', percent: 100, message: result.status === 'success' ? 'Completed successfully!' : 'Completed with validation errors' });
        var self = this;
        setTimeout(function() {
          self.uploading.set(false);
          self.uploadProgress.set(null);
        }, 2000);
        if (result.status === 'success') {
          this.snackBar.open('Upload completed successfully! ' + result.insertedRows + ' records staged.', 'OK', { duration: 5000 });
        } else {
          this.snackBar.open('Upload completed with ' + result.errorRows + ' validation errors.', 'OK', { duration: 5000 });
        }
        this.loadData();
      }.bind(this),
      error: function(this: UploadJobsComponent, err: any) {
        this.stopPolling();
        this.uploading.set(false);
        this.uploadProgress.set(null);
        this.snackBar.open(err.error?.error || 'Upload failed', 'OK', { duration: 5000 });
        this.loadData();
      }.bind(this)
    });
  }

  private startUploadPolling(key: string): void {
    if (this.progressInterval) return;
    var self = this;
    this.progressInterval = setInterval(function() {
      if (!self.uploading()) {
        self.stopPolling();
        return;
      }
      self.api.getBulkUploadProgress(key).subscribe({
        next: function(info: any) {
          if (info && info.phase !== 'unknown') {
            self.uploadProgress.set(info);
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

  viewErrors(job: any): void {
    this.router.navigate(['/assets/bulk-upload/jobs', job.id, 'errors']);
  }

  exportErrors(job: any): void {
    this.api.exportBulkUploadErrors(job.id).subscribe({
      next: function(blob: Blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        var baseName = job.filename || 'upload';
        if (baseName.endsWith('.xlsx') || baseName.endsWith('.xls')) baseName = baseName.substring(0, baseName.lastIndexOf('.'));
        a.download = 'ValidationErrors_' + baseName + '.xlsx';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: function(this: UploadJobsComponent) {
        this.snackBar.open('No error report available for this job. Re-upload the file to regenerate.', 'Close', { duration: 5000 });
      }.bind(this)
    });
  }

  downloadFile(job: any): void {
    this.api.downloadBulkUploadFile(job.id).subscribe({
      next: function(blob: Blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = job.filename || 'download.xlsx';
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }

  getStatusClass(status: string): string {
    if (!status) return '';
    if (status.indexOf('Successfully') >= 0) return 'status-success';
    if (status.indexOf('Unsuccessfully') >= 0) return 'status-error';
    if (status === 'Approved') return 'status-approved';
    if (status === 'Not Approved') return 'status-rejected';
    if (status === 'New') return 'status-new';
    return '';
  }

  hasValidationErrors(job: any): boolean {
    return job.job_Status && job.job_Status.indexOf('Unsuccessfully') >= 0;
  }

  getUploadTypeLabel(uploadType: number | null): string {
    if (uploadType === 1) return 'Normal';
    if (uploadType === 2) return 'WIP';
    if (uploadType === 3) return 'Donated';
    if (uploadType === 4) return 'Initial/Take-On';
    if (uploadType === 5) return 'Unbundling';
    return 'Normal';
  }

  onUploadTypeChange(value: string): void {
    var parsed = parseInt(value, 10);
    this.selectedUploadType.set(isNaN(parsed) ? null : parsed);
  }

  downloadTemplate(): void {
    this.api.downloadBulkUploadTemplate().subscribe({
      next: function(blob: Blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'Asset_Upload_Template.xlsx';
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }
}
