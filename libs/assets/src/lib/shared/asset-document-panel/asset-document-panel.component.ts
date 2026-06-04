import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-asset-document-panel',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './asset-document-panel.component.html'
})
export class AssetDocumentPanelComponent implements OnInit, OnChanges {
  @Input() assetId: number = 0;
  @Input() entityType: string = '';
  @Input() entityId: number | null = null;
  @Output() documentsChanged = new EventEmitter<any[]>();

  docs = signal<any[]>([]);
  loading = signal(false);
  uploading = signal(false);
  pendingDeleteId = signal<number | null>(null);
  pendingDeleteName = signal<string>('');

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit() {
    if (this.assetId != null && this.assetId >= 0) {
      this.loadDocs();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['assetId'] && this.assetId != null && this.assetId >= 0) {
      this.loadDocs();
    }
  }

  loadDocs() {
    var self = this;
    this.loading.set(true);
    this.api.getDocumentsByAsset(this.assetId).subscribe({
      next: function(rows: any[]) {
        var loaded = rows || [];
        self.docs.set(loaded);
        self.loading.set(false);
        self.documentsChanged.emit(self.filteredDocs());
      },
      error: function() {
        self.docs.set([]);
        self.loading.set(false);
        self.documentsChanged.emit([]);
      }
    });
  }

  filteredDocs(): any[] {
    var all = this.docs();
    if (!this.entityType || this.entityType === 'General') {
      return all;
    }
    var result: any[] = [];
    for (var i = 0; i < all.length; i++) {
      var d = all[i];
      var tt = d.transaction_type || d.TransactionType || '';
      if (tt === this.entityType) {
        result.push(d);
      }
    }
    return result;
  }

  filteredCount(): number {
    return this.filteredDocs().length;
  }

  onFileSelected(event: Event) {
    var input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    var files: File[] = [];
    for (var i = 0; i < input.files.length; i++) {
      files.push(input.files[i]);
    }
    input.value = '';
    this.uploadFiles(files);
  }

  uploadFiles(files: File[]) {
    var self = this;
    this.uploading.set(true);
    var count = 0;
    var total = files.length;
    for (var i = 0; i < files.length; i++) {
      (function(file: File) {
        self.api.uploadDocument(
          file,
          self.entityType || 'General',
          self.entityId != null ? String(self.entityId) : null,
          undefined,
          self.assetId,
          self.entityType || 'General'
        ).subscribe({
          next: function() {
            count++;
            if (count === total) {
              self.uploading.set(false);
              var msg = total === 1 ? 'Document uploaded' : total + ' documents uploaded';
              self.snackBar.open(msg, 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
              self.loadDocs();
            }
          },
          error: function() {
            count++;
            if (count === total) {
              self.uploading.set(false);
              self.snackBar.open('One or more files failed to upload', 'OK', { duration: 4000, horizontalPosition: 'end', verticalPosition: 'top' });
              self.loadDocs();
            }
          }
        });
      })(files[i]);
    }
  }

  confirmDelete(doc: any) {
    this.pendingDeleteId.set(this.getDocId(doc));
    this.pendingDeleteName.set(this.getFileName(doc));
  }

  cancelDelete() {
    this.pendingDeleteId.set(null);
    this.pendingDeleteName.set('');
  }

  doDelete() {
    var id = this.pendingDeleteId();
    if (!id) {
      return;
    }
    var self = this;
    this.api.deleteDocument(id).subscribe({
      next: function() {
        self.snackBar.open('Document deleted', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
        self.cancelDelete();
        self.loadDocs();
      },
      error: function() {
        self.snackBar.open('Failed to delete document', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
        self.cancelDelete();
      }
    });
  }

  download(doc: any) {
    this.api.downloadDocument(this.getDocId(doc));
  }

  getDocId(doc: any): number {
    return Number(doc.id ?? doc.Document_ID ?? doc.document_id) || 0;
  }

  getDocIcon(doc: any): string {
    var mime = doc.mime_type || doc.MimeType || '';
    var name = doc.file_name || doc.FileName || '';
    if (mime && mime.startsWith('image/')) {
      return 'image';
    }
    var ext = name.split('.').pop();
    if (ext) {
      ext = ext.toLowerCase();
      if (ext === 'pdf') {
        return 'picture_as_pdf';
      }
      if (ext === 'xlsx' || ext === 'xls') {
        return 'table_chart';
      }
      if (ext === 'docx' || ext === 'doc') {
        return 'description';
      }
    }
    return 'insert_drive_file';
  }

  formatSize(doc: any): string {
    var bytes = Number(doc.file_size || doc.FileSize) || 0;
    if (!bytes) {
      return '';
    }
    if (bytes < 1024) {
      return bytes + ' B';
    }
    if (bytes < 1048576) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  formatDate(doc: any): string {
    var val = doc.uploaded_at || doc.DateCaptured || doc.dateCaptured || '';
    if (!val) {
      return '';
    }
    return new Date(val).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getTransactionType(doc: any): string {
    return doc.transaction_type || doc.TransactionType || '';
  }

  getFileName(doc: any): string {
    return doc.file_name || doc.FileName || '';
  }
}
