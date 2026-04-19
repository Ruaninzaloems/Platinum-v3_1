import { Component, Input, signal, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { IndigentService } from '../../../services/indigent.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { formatDate } from '../../../services/format.service';
import type { ATTPDocument, ATTPDocumentType, UploadDocumentRequest } from '../../../models/indigent.models';

@Component({
  selector: 'app-document-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="doc-manager">
      <div class="doc-header">
        <h4 class="doc-title">Documents</h4>
        <button class="btn btn-primary btn-sm" (click)="openUpload()" data-testid="button-upload-doc">Upload</button>
      </div>

      @if (loading()) {
        <div class="doc-loading"><span class="spinner"></span></div>
      } @else if (documents().length === 0) {
        <div class="doc-empty">No documents attached.</div>
      } @else {
        <div class="doc-list">
          @for (doc of documents(); track doc.documentId) {
            <div class="doc-item" [attr.data-testid]="'doc-item-' + doc.documentId">
              <div class="doc-icon">📄</div>
              <div class="doc-info">
                <span class="doc-name">{{ doc.fileName }}</span>
                <span class="doc-meta">{{ doc.documentTypeName || 'Document' }} · {{ fmtDate(doc.uploadedDate) }}</span>
              </div>
              <div class="doc-actions">
                <button class="btn btn-ghost btn-sm" (click)="downloadDoc(doc)" title="Download" [attr.data-testid]="'button-download-doc-' + doc.documentId">⬇</button>
                <button class="btn btn-ghost btn-sm" (click)="deleteDoc(doc)" title="Delete" [attr.data-testid]="'button-delete-doc-' + doc.documentId">✕</button>
              </div>
            </div>
          }
        </div>
      }

      @if (effectiveRequiredDocs().length > 0) {
        <div class="doc-checklist">
          <div class="doc-checklist-title">Required Documents</div>
          @for (dt of effectiveRequiredDocs(); track dt.key) {
            <div class="doc-check-item" [class.complete]="dt.uploaded">
              <span class="doc-check-icon">{{ dt.uploaded ? '✓' : '○' }}</span>
              <span>{{ dt.label }}</span>
            </div>
          }
        </div>
      }
    </div>

    @if (uploadOpen) {
      <div class="modal-overlay" (click)="closeUpload()">
        <div class="modal-content" style="max-width:28rem" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">Upload Document</h3>
            <button class="btn btn-ghost btn-icon" (click)="closeUpload()">✕</button>
          </div>
          <div class="modal-body">
            <div class="field-group">
              <span class="field-label">Document Type</span>
              <select class="field-select" [(ngModel)]="uploadForm.documentTypeId" data-testid="select-doc-type">
                <option [value]="0">Select type</option>
                @for (dt of docTypes(); track dt.documentTypeId) {
                  <option [value]="dt.documentTypeId">{{ dt.documentTypeName }}</option>
                }
              </select>
            </div>
            <div class="field-group mt-1">
              <span class="field-label">Document Name</span>
              <input class="field-input" [(ngModel)]="uploadForm.documentName" placeholder="e.g. ID Copy" data-testid="input-doc-name" />
            </div>
            <div class="field-group mt-1">
              <span class="field-label">File</span>
              <input type="file" class="field-input" (change)="onFileSelected($event)" data-testid="input-doc-file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
            </div>
            @if (uploadProgress() > 0 && uploadProgress() < 100) {
              <div class="upload-progress mt-1">
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="uploadProgress()"></div>
                </div>
                <span class="progress-text">{{ uploadProgress() }}%</span>
              </div>
            }
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeUpload()">Cancel</button>
            <button class="btn btn-primary" (click)="submitUpload()" [disabled]="uploading()" data-testid="button-submit-upload">
              @if (uploading()) { <span class="spinner"></span> }
              Upload
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .doc-manager { border: 1px solid var(--platinum-border); border-radius: 12px; background: white; overflow: hidden; }
    .doc-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--platinum-border); background: #f8fafc; }
    .doc-title { font-size: 13px; font-weight: 600; color: var(--platinum-text); margin: 0; }
    .doc-loading { padding: 2rem; text-align: center; }
    .doc-empty { padding: 2rem; text-align: center; font-size: 12px; color: var(--platinum-text-muted); }
    .doc-list { }
    .doc-item { display: flex; align-items: center; gap: 0.75rem; padding: 10px 16px; border-bottom: 1px solid #f1f5f9; }
    .doc-item:last-child { border-bottom: none; }
    .doc-icon { font-size: 20px; }
    .doc-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .doc-name { font-size: 13px; font-weight: 500; color: var(--platinum-text); }
    .doc-meta { font-size: 11px; color: var(--platinum-text-muted); }
    .doc-actions { display: flex; gap: 0.25rem; }
    .doc-checklist { padding: 12px 16px; border-top: 1px solid var(--platinum-border); background: #fffbeb; }
    .doc-checklist-title { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #92400e; letter-spacing: 0.5px; margin-bottom: 6px; }
    .doc-check-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #78350f; padding: 2px 0; }
    .doc-check-item.complete { color: #166534; }
    .doc-check-icon { font-size: 14px; width: 18px; text-align: center; }
    .upload-progress { display: flex; align-items: center; gap: 8px; }
    .progress-bar { flex: 1; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
    .progress-fill { height: 100%; background: var(--platinum-accent); border-radius: 3px; transition: width 0.3s; }
    .progress-text { font-size: 11px; color: var(--platinum-text-muted); min-width: 32px; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); width: 90%; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column; }
    .modal-header { padding: 20px 24px 12px; border-bottom: 1px solid var(--platinum-border); display: flex; align-items: center; justify-content: space-between; }
    .modal-title { font-size: 18px; font-weight: 600; color: var(--platinum-text); margin: 0; }
    .modal-body { padding: 16px 24px; overflow-y: auto; flex: 1; }
    .modal-footer { padding: 12px 24px 20px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 0.5rem; }
    .field-group { display: flex; flex-direction: column; gap: 6px; }
    .field-label { font-size: 11px; font-weight: 500; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .field-select, .field-input { height: 40px; padding: 0 14px; border: 1px solid var(--pos-input-border); border-radius: 8px; background: var(--pos-input-bg); font-size: 13px; color: var(--platinum-text); width: 100%; font-family: inherit; }
    .mt-1 { margin-top: 0.75rem; }
  `]
})
export class DocumentManagerComponent implements OnInit, OnChanges {
  @Input() applicationId!: number;
  @Input() requiredDocsConfig: Array<{ documentKey?: string; key?: string; label?: string; documentTypeName?: string; isRequired?: boolean; required?: boolean }> | null = null;

  documents = signal<ATTPDocument[]>([]);
  docTypes = signal<ATTPDocumentType[]>([]);
  loading = signal(true);
  uploading = signal(false);
  uploadProgress = signal(0);

  uploadOpen = false;
  uploadForm = { documentTypeId: 0, documentName: '', file: null as File | null };

  constructor(private svc: IndigentService, private auth: AuthService, private toast: ToastService) {}

  ngOnInit(): void { this.loadDocs(); }
  ngOnChanges(): void { if (this.applicationId) this.loadDocs(); }

  async loadDocs(): Promise<void> {
    if (!this.applicationId) return;
    this.loading.set(true);
    try {
      const [docs, types] = await Promise.allSettled([
        firstValueFrom(this.svc.getDocuments(this.applicationId)),
        firstValueFrom(this.svc.getDocumentTypes()),
      ]);
      if (docs.status === 'fulfilled') this.documents.set(Array.isArray(docs.value) ? docs.value : []);
      if (types.status === 'fulfilled') this.docTypes.set(Array.isArray(types.value) ? types.value : []);
    } catch { /* silent */ } finally { this.loading.set(false); }
  }

  requiredDocTypes(): ATTPDocumentType[] {
    return this.docTypes().filter(dt => dt.isRequired && dt.isActive);
  }

  effectiveRequiredDocs(): Array<{ key: string; label: string; uploaded: boolean }> {
    const cfg = this.requiredDocsConfig;
    if (Array.isArray(cfg) && cfg.length > 0) {
      return cfg
        .filter(d => (d.isRequired ?? d.required ?? false) === true)
        .map(d => {
          const key = String(d.documentKey ?? d.key ?? d.label ?? d.documentTypeName ?? '').trim();
          const label = String(d.label ?? d.documentTypeName ?? key);
          const uploaded = this.documents().some(doc => {
            const name = (doc.documentTypeName || '').toLowerCase().trim();
            return name === key.toLowerCase() || name === label.toLowerCase();
          });
          return { key, label, uploaded };
        });
    }
    return this.requiredDocTypes().map(dt => ({
      key: String(dt.documentTypeId),
      label: dt.documentTypeName,
      uploaded: this.isDocTypeUploaded(dt.documentTypeId),
    }));
  }

  isDocTypeUploaded(typeId: number): boolean {
    return this.documents().some(d => d.documentTypeId === typeId);
  }

  fmtDate(val: string | null | undefined): string { return formatDate(val); }

  openUpload(): void {
    this.uploadForm = { documentTypeId: 0, documentName: '', file: null };
    this.uploadProgress.set(0);
    this.uploadOpen = true;
  }

  closeUpload(): void { this.uploadOpen = false; }

  private readonly ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  private readonly MAX_FILE_SIZE_MB = 10;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      if (file.type && !this.ALLOWED_TYPES.includes(file.type)) {
        this.toast.show('Unsupported file type. Use PDF, JPEG, PNG, GIF, or DOC files.', 'error');
        input.value = '';
        return;
      }
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > this.MAX_FILE_SIZE_MB) {
        this.toast.show(`File is too large (${sizeMB.toFixed(1)} MB). Maximum allowed: ${this.MAX_FILE_SIZE_MB} MB.`, 'error');
        input.value = '';
        return;
      }
      this.uploadForm.file = file;
      if (!this.uploadForm.documentName) this.uploadForm.documentName = file.name;
    }
  }

  async submitUpload(): Promise<void> {
    if (!this.uploadForm.file) { this.toast.show('Please select a file', 'error'); return; }
    if (!this.uploadForm.documentName) { this.toast.show('Document name is required', 'error'); return; }
    this.uploading.set(true);
    this.uploadProgress.set(30);
    try {
      const now = new Date().toISOString();
      const userId = this.auth.user()?.user_ID || 0;
      this.uploadProgress.set(50);
      const request: UploadDocumentRequest = {
        applicationId: this.applicationId,
        documentTypeId: this.uploadForm.documentTypeId,
        documentName: this.uploadForm.documentName,
        fileData: this.uploadForm.file ? await this.fileToBase64(this.uploadForm.file) : '',
        fileName: this.uploadForm.file?.name || this.uploadForm.documentName,
        capturerId: userId,
        dateCaptured: now,
      };
      this.uploadProgress.set(80);
      await firstValueFrom(this.svc.uploadDocument(request));
      this.uploadProgress.set(100);
      this.toast.show('Document uploaded', 'success');
      this.closeUpload();
      await this.loadDocs();
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.toast.show(err?.error?.message || 'Upload failed', 'error');
    } finally { this.uploading.set(false); this.uploadProgress.set(0); }
  }

  async downloadDoc(doc: ATTPDocument): Promise<void> {
    try {
      const res = await firstValueFrom(this.svc.downloadDocument(doc.documentId));
      if (res?.fileData) {
        const byteChars = atob(res.fileData);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
        const blob = new Blob([new Uint8Array(byteNumbers)], { type: res.contentType || 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.fileName || doc.fileName || 'document';
        a.click();
        URL.revokeObjectURL(url);
      } else {
        this.toast.show('No file data available', 'error');
      }
    } catch {
      this.toast.show('Download failed', 'error');
    }
  }

  async deleteDoc(doc: ATTPDocument): Promise<void> {
    if (!confirm(`Delete document "${doc.fileName}"?`)) return;
    try {
      await firstValueFrom(this.svc.deleteDocument(doc.documentId));
      this.toast.show('Document deleted', 'success');
      await this.loadDocs();
    } catch { this.toast.show('Delete failed', 'error'); }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1] || '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
