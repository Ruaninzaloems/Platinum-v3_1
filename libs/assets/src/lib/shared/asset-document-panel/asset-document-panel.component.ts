import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/api.service';
import { SharePointConfigService } from '../../core/sharepoint-config.service';

@Component({
  selector: 'app-asset-document-panel',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './asset-document-panel.component.html'
})
export class AssetDocumentPanelComponent implements OnInit, OnChanges {
  @Input() assetId: number = 0;
  @Input() assetName: string = '';
  @Input() entityType: string = '';
  @Input() entityId: number | null = null;
  @Output() documentsChanged = new EventEmitter<any[]>();

  docs = signal<any[]>([]);
  loading = signal(false);
  uploading = signal(false);
  pendingDeleteId = signal<number | null>(null);
  pendingDeleteName = signal<string>('');

  /** Per-file upload status shown during multi-file uploads. */
  uploadQueue = signal<{ name: string; status: 'uploading' | 'done' | 'error'; error?: string }[]>([]);

  /** True when the panel is sourcing documents from SharePoint (Admin → Assets toggle). */
  spMode = signal(false);

  private pendingDeleteDoc: any = null;

  constructor(
    private api: ApiService,
    private snackBar: MatSnackBar,
    private spConfig: SharePointConfigService,
  ) {}

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
    if (this.spConfig.isEnabled()) {
      this.spMode.set(true);
      this.loadSharePointDocs();
    } else {
      this.spMode.set(false);
      this.loadLocalDocs();
    }
  }

  /** Existing behaviour — list documents from the asset module's local storage. */
  private loadLocalDocs() {
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

  /**
   * List documents from the configured SharePoint library, filtered to the
   * current asset via the library's AssetsID metadata column — mirrors the
   * UatAssets page (file name, size, modified, description) and keeps the
   * counter accurate.
   */
  private async loadSharePointDocs() {
    this.loading.set(true);
    try {
      const normalized = await this.spConfig.listAssetDocuments(this.assetId);
      this.docs.set(normalized);
      this.loading.set(false);
      this.documentsChanged.emit(normalized);
    } catch (e: any) {
      console.error('[AssetDocumentPanel] SharePoint load error:', e?.message ?? e);
      this.docs.set([]);
      this.loading.set(false);
      this.documentsChanged.emit([]);
    }
  }

  filteredDocs(): any[] {
    var all = this.docs();
    // SharePoint docs are already filtered to this asset by AssetsID.
    if (this.spMode()) {
      return all;
    }
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
    // Route to SharePoint when enabled in Admin → Assets, else use local storage.
    if (this.spConfig.isEnabled()) {
      this.uploadToSharePoint(files);
    } else {
      this.uploadToLocal(files);
    }
  }

  /** Existing behaviour — store documents via the asset module's local file storage. */
  private uploadToLocal(files: File[]) {
    var self = this;
    this.uploading.set(true);
    this.uploadQueue.set(files.map(f => ({ name: f.name, status: 'uploading' as const })));
    var count = 0;
    var total = files.length;
    for (var i = 0; i < files.length; i++) {
      (function(file: File, idx: number) {
        self.api.uploadDocument(
          file,
          self.entityType || 'General',
          self.entityId != null ? String(self.entityId) : null,
          undefined,
          self.assetId,
          self.entityType || 'General'
        ).subscribe({
          next: function() {
            self.setQueueStatus(idx, 'done');
            count++;
            if (count === total) { self.finishUpload(); }
          },
          error: function() {
            self.setQueueStatus(idx, 'error', 'Upload failed');
            count++;
            if (count === total) { self.finishUpload(); }
          }
        });
      })(files[i], i);
    }
  }

  /**
   * Upload documents to the configured SharePoint library (default: UatAssets),
   * tagging each file with the AssetsID (link to this asset) and saving the
   * asset name as the document Description — same metadata model as UatAssets.
   * Shows per-file upload status for multi-file uploads.
   */
  private async uploadToSharePoint(files: File[]) {
    this.uploading.set(true);
    this.uploadQueue.set(files.map(f => ({ name: f.name, status: 'uploading' as const })));

    // Description stored in SharePoint = the asset's name.
    const description = this.assetName || '';

    for (let i = 0; i < files.length; i++) {
      try {
        await this.spConfig.uploadAssetDocument(this.assetId, files[i], description);
        this.setQueueStatus(i, 'done');
      } catch (err: any) {
        this.setQueueStatus(i, 'error', err?.message || 'Upload failed');
      }
    }
    this.finishUpload();
  }

  /** Count of files that finished uploading (for the queue header). */
  uploadDoneCount(): number {
    return this.uploadQueue().filter(q => q.status === 'done').length;
  }

  /** Update a single file's status in the upload queue. */
  private setQueueStatus(idx: number, status: 'uploading' | 'done' | 'error', error?: string) {
    this.uploadQueue.update(q => q.map((item, i) =>
      i === idx ? { ...item, status, error } : item));
  }

  /** Common post-upload cleanup: refresh list, toast summary, clear queue. */
  private finishUpload() {
    this.uploading.set(false);
    this.loadDocs();
    const q = this.uploadQueue();
    const done = q.filter(x => x.status === 'done').length;
    const failed = q.filter(x => x.status === 'error').length;
    if (failed === 0) {
      this.snackBar.open(`${done} document${done === 1 ? '' : 's'} uploaded`, 'OK',
        { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
    } else {
      this.snackBar.open(`${done} uploaded, ${failed} failed`, 'Close',
        { duration: 5000, horizontalPosition: 'end', verticalPosition: 'top' });
    }
    // Clear the queue after a short delay so the user sees the final statuses.
    setTimeout(() => this.uploadQueue.set([]), 4000);
  }

  confirmDelete(doc: any) {
    this.pendingDeleteDoc = doc;
    this.pendingDeleteId.set(doc.__sp ? -1 : this.getDocId(doc)); // -1 sentinel for SP so the banner shows
    this.pendingDeleteName.set(this.getFileName(doc));
  }

  cancelDelete() {
    this.pendingDeleteDoc = null;
    this.pendingDeleteId.set(null);
    this.pendingDeleteName.set('');
  }

  async doDelete() {
    var doc = this.pendingDeleteDoc;
    if (!doc) {
      return;
    }
    var self = this;

    // SharePoint-backed document
    if (doc.__sp) {
      try {
        await this.spConfig.deleteAssetDocument(doc.__item);
        this.snackBar.open('Document deleted from SharePoint', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
      } catch (e: any) {
        this.snackBar.open('Failed to delete: ' + (e?.message ?? e), 'Close', { duration: 4000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
      this.cancelDelete();
      this.loadDocs();
      return;
    }

    // Local document
    var id = this.getDocId(doc);
    if (!id) { return; }
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

  async download(doc: any) {
    if (doc.__sp) {
      try {
        await this.spConfig.downloadAssetDocument(doc.__item);
      } catch (e: any) {
        this.snackBar.open('Download failed: ' + (e?.message ?? e), 'Close', { duration: 4000, horizontalPosition: 'end', verticalPosition: 'top' });
      }
      return;
    }
    this.api.downloadDocument(this.getDocId(doc));
  }

  /** Description shown for a document (SharePoint metadata or local transaction type). */
  getDescription(doc: any): string {
    return doc.description || '';
  }

  /** Open a SharePoint document in the browser. */
  openInBrowser(doc: any) {
    if (doc.__sp && doc.__item?.webUrl) {
      window.open(doc.__item.webUrl, '_blank');
    }
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
