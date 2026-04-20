import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/api.service';

@Component({
  selector: 'app-upload-errors',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './upload-errors.component.html',
  styleUrls: ['./upload-errors.component.css']
})
export class UploadErrorsComponent implements OnInit {
  jobId = 0;
  job = signal<any>(null);
  errors = signal<any[]>([]);
  parsedErrors = signal<any[]>([]);
  loading = signal(true);
  exporting = signal(false);

  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.jobId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.api.getBulkUploadJob(this.jobId).subscribe({
      next: function(this: UploadErrorsComponent, data: any) { this.job.set(data); }.bind(this)
    });
    this.api.getBulkUploadErrors(this.jobId).subscribe({
      next: function(this: UploadErrorsComponent, data: any[]) {
        this.errors.set(data);
        var parsed: any[] = [];
        for (var i = 0; i < data.length; i++) {
          var row = data[i];
          var rowNum = row['RowNumber'] || row['rowNumber'];
          var keys = Object.keys(row);
          for (var k = 0; k < keys.length; k++) {
            var key = keys[k];
            var keyLower = key.toLowerCase();
            if (keyLower === 'asset_bulkvalidation_id' || keyLower === 'upload_jobid' || keyLower === 'rownumber' ||
                keyLower === 'filename' || keyLower === 'assetsetting_id' || keyLower === 'description') continue;
            if (row[key] && typeof row[key] === 'string' && row[key].length > 0) {
              parsed.push({ rowNumber: rowNum, field: key, message: row[key] });
            }
          }
        }
        this.parsedErrors.set(parsed);
        this.loading.set(false);
      }.bind(this),
      error: function(this: UploadErrorsComponent) { this.loading.set(false); }.bind(this)
    });
  }

  exportErrors(): void {
    this.exporting.set(true);
    this.api.exportBulkUploadErrors(this.jobId).subscribe({
      next: function(this: UploadErrorsComponent, blob: Blob) {
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        var j = this.job();
        var baseName = j ? j.filename : 'upload';
        if (baseName.endsWith('.xlsx') || baseName.endsWith('.xls')) baseName = baseName.substring(0, baseName.lastIndexOf('.'));
        a.download = 'ValidationErrors_' + baseName + '.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
        this.exporting.set(false);
      }.bind(this),
      error: function(this: UploadErrorsComponent) {
        this.exporting.set(false);
      }.bind(this)
    });
  }

  goBack(): void {
    this.router.navigate(['/assets/bulk-upload/jobs']);
  }
}
