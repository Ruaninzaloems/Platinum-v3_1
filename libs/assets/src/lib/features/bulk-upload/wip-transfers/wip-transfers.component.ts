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
  selector: 'app-wip-transfers',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatProgressBarModule, MatSnackBarModule, MatTooltipModule],
  templateUrl: './wip-transfers.component.html',
  styleUrls: ['./wip-transfers.component.css']
})
export class WipTransfersComponent implements OnInit, OnDestroy {
  jobs = signal<any[]>([]);
  filteredJobs = signal<any[]>([]);
  loading = signal(true);
  uploading = signal(false);
  uploadProgress = signal<any>(null);
  filters: any = { filename: '', job_Status: '' };
  private progressInterval: any = null;

  constructor(private api: ApiService, private snackBar: MatSnackBar, private router: Router) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  loadData(): void {
    this.loading.set(true);
    this.api.getWipJobs().subscribe({
      next: function(this: WipTransfersComponent, data: any[]) { this.jobs.set(data); this.applyFilters(); this.loading.set(false); }.bind(this),
      error: function(this: WipTransfersComponent) { this.loading.set(false); }.bind(this)
    });
  }

  applyFilters(): void {
    var result: any[] = [];
    var all = this.jobs();
    for (var i = 0; i < all.length; i++) {
      var item = all[i];
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
    this.uploading.set(true);
    this.uploadProgress.set({ phase: 'uploading', percent: 2, message: 'Uploading WIP file...' });
    this.currentProgressKey = 'upload_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    this.startUploadPolling(this.currentProgressKey);
    this.api.uploadBulkFileWip(file, this.currentProgressKey).subscribe({
      next: function(this: WipTransfersComponent, result: any) {
        this.stopPolling();
        this.uploadProgress.set({ phase: 'complete', percent: 100, message: result.status === 'success' ? 'Completed successfully!' : 'Completed with validation errors' });
        var self = this;
        setTimeout(function() {
          self.uploading.set(false);
          self.uploadProgress.set(null);
        }, 2000);
        if (result.status === 'success') {
          this.snackBar.open('WIP upload completed successfully! ' + result.insertedRows + ' records staged.', 'OK', { duration: 5000 });
        } else {
          this.snackBar.open('Upload completed with ' + result.errorRows + ' validation errors.', 'OK', { duration: 5000 });
        }
        this.loadData();
      }.bind(this),
      error: function(this: WipTransfersComponent, err: any) {
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
      }
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
