import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, TemplateRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { ApiService } from '../../core/services/api.service';
import { MappingRule, MappingDocument, MappingAuditEntry, DisclosureLineItemNode } from '../../core/models/interfaces';

@Component({
  selector: 'app-mapping-workspace',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDialogModule,
    MatChipsModule, MatProgressSpinnerModule, MatMenuModule, MatExpansionModule, MatSnackBarModule, DragDropModule,
  ],
  templateUrl: './mapping-workspace.component.html',
  styleUrl: './mapping-workspace.component.css',
})
export class MappingWorkspaceComponent implements OnChanges {
  @Input() selectedLineItem: DisclosureLineItemNode | null = null;
  @Input() templateId: string = '';
  @Input() tenantId: string = '';
  @Input() workflowFilter: string = '';
  @Input() isTemplateDraft: boolean = false;
  @Input() compilationId: string = '';
  @Output() mappingChanged = new EventEmitter<void>();
  @Output() defaultMappingRemoved = new EventEmitter<{ scoaAccountNumber: string }>();
  @Output() defaultsLoaded = new EventEmitter<string[]>();
  @Output() requireCloneBeforeEdit = new EventEmitter<void>();

  @ViewChild('createDialogTpl') createDialogTpl!: TemplateRef<any>;

  mappings: MappingRule[] = [];
  defaultMappings: Array<{
    scoaAccountNumber: string;
    scoaDescription: string;
    scoaSegment: string;
    confidence: number;
    reason: string;
    isDefault: boolean;
  }> = [];
  loading = false;
  loadError = '';
  dropActive = false;

  showHistory = false;
  historyLoading = false;
  auditHistory: MappingAuditEntry[] = [];

  showDocuments = false;
  documents: MappingDocument[] = [];
  selectedMappingForDocs: MappingRule | null = null;
  selectedMappingForAction: MappingRule | null = null;

  rejectionReason = '';

  newMapping: any = {
    glAccountCode: '',
    glAccountName: '',
    scoaAccountNumber: '',
    mscoaSegment: '',
    mappingType: 'direct',
    allocationPercentage: 100,
  };

  editData: any = {};
  private editMappingId = '';
  private dialogRef: MatDialogRef<any> | null = null;

  constructor(private api: ApiService, private dialog: MatDialog, private zone: NgZone, private snackBar: MatSnackBar) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedLineItem'] && this.selectedLineItem) {
      this.loadMappings();
      this.showHistory = false;
      this.showDocuments = false;
    }
    if (changes['workflowFilter'] && !changes['selectedLineItem']) {
      this.loadMappings();
    }
  }

  private loadAbortCtrl: AbortController | null = null;
  private loadRequestId = 0;

  loadMappings(): void {
    if (!this.selectedLineItem || !this.templateId) {
      this.loading = false;
      return;
    }

    this.loadAbortCtrl?.abort();
    this.loadAbortCtrl = new AbortController();
    const signal = this.loadAbortCtrl.signal;
    const requestId = ++this.loadRequestId;

    let url = `/api/mappings/by-line-item/${this.templateId}/${this.selectedLineItem.id}`;
    if (this.compilationId) {
      url += `?compilationId=${encodeURIComponent(this.compilationId)}`;
    }
    this.loading = true;
    this.loadError = '';
    this.mappings = [];

    const timeoutId = setTimeout(() => this.loadAbortCtrl?.abort(), 15000);

    const token = localStorage.getItem('token') || '';
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const defaultUrl = `/api/mappings/default-mappings/${this.templateId}/${this.selectedLineItem.id}`;

    const fetchMappings = fetch(url, { headers, signal })
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); });
    const fetchDefaults = fetch(defaultUrl, { headers, signal })
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .catch(() => []);

    Promise.all([fetchMappings, fetchDefaults])
      .then(([data, defaults]: [MappingRule[], any[]]) => {
        if (requestId !== this.loadRequestId) return;
        this.zone.run(() => {
          this.mappings = this.workflowFilter
            ? data.filter(m => m.workflowStatus === this.workflowFilter)
            : data;
          const mappedCodes = new Set(data.map(m => m.scoaAccountNumber || m.glAccountCode));
          this.defaultMappings = (defaults || []).filter(d => !mappedCodes.has(d.scoaAccountNumber));
          this.loading = false;
          const allCodes = [
            ...data.map(m => m.scoaAccountNumber || m.glAccountCode),
            ...this.defaultMappings.map(d => d.scoaAccountNumber),
          ];
          this.defaultsLoaded.emit(allCodes);
        });
      })
      .catch(() => {
        if (requestId !== this.loadRequestId) return;
        this.zone.run(() => {
          this.loading = false;
          this.loadError = signal.aborted
            ? 'Request timed out. Please try again.'
            : 'Failed to load mappings. Please try again.';
          this.snackBar.open('Failed to load mappings', 'OK', { duration: 4000 });
        });
      })
      .finally(() => clearTimeout(timeoutId));
  }

  onDrop(event: CdkDragDrop<any>): void {
    this.dropActive = false;
    const data = event.item.data;
    if (!data) return;

    if (!this.selectedLineItem) {
      this.snackBar.open('Please select a disclosure line item first', 'OK', { duration: 4000 });
      return;
    }

    if (!this.isTemplateDraft) {
      this.snackBar.open("This template is locked. Click 'Customize Template' to create an editable copy.", 'OK', { duration: 5000 });
      this.requireCloneBeforeEdit.emit();
      return;
    }

    if (data.__batch && Array.isArray(data.items)) {
      this.createBatchMappings(data.items);
      return;
    }

    const scoaNode = data;
    const mapping: any = {
      glAccountCode: scoaNode.accountNumber,
      glAccountName: scoaNode.description || scoaNode.shortDescription,
      scoaAccountNumber: scoaNode.accountNumber,
      scoaDescription: scoaNode.shortDescription || scoaNode.description,
      mscoaSegment: scoaNode.segment,
      templateId: this.templateId,
      lineItemId: this.selectedLineItem.id,
      mappingType: 'direct',
      allocationPercentage: 100,
      workflowStatus: 'draft',
      ...(this.compilationId ? { compilationId: this.compilationId } : {}),
    };

    this.api.post<MappingRule>('/mappings', mapping).subscribe({
      next: () => {
        this.loadMappings();
        this.mappingChanged.emit();
      },
      error: (err: any) => {
        this.snackBar.open(err?.error?.message || 'Failed to create mapping', 'OK', { duration: 4000 });
      },
    });
  }

  addBatchMappings(items: any[]): void {
    if (!this.selectedLineItem || items.length === 0) return;

    if (!this.isTemplateDraft) {
      this.requireCloneBeforeEdit.emit();
      return;
    }

    this.createBatchMappings(items);
  }

  private createBatchMappings(items: any[]): void {
    if (!this.selectedLineItem) return;

    const batch = items.map(item => ({
      glAccountCode: item.accountNumber,
      glAccountName: item.description || item.shortDescription,
      scoaAccountNumber: item.accountNumber,
      scoaDescription: item.shortDescription || item.description,
      mscoaSegment: item.segment,
      templateId: this.templateId,
      lineItemId: this.selectedLineItem!.id,
      ...(this.compilationId ? { compilationId: this.compilationId } : {}),
      mappingType: 'direct',
      allocationPercentage: 100,
      workflowStatus: 'draft',
    }));

    this.api.post('/mappings/bulk', batch).subscribe({
      next: () => {
        this.loadMappings();
        this.mappingChanged.emit();
      },
      error: (err: any) => {
        this.snackBar.open(err?.error?.message || 'Failed to create batch mappings', 'OK', { duration: 4000 });
      },
    });
  }

  openCreateDialog(tpl: TemplateRef<any>): void {
    this.newMapping = {
      glAccountCode: '',
      glAccountName: '',
      scoaAccountNumber: '',
      mscoaSegment: '',
      mappingType: 'direct',
      allocationPercentage: 100,
    };
    this.dialogRef = this.dialog.open(tpl, { width: '560px' });
  }

  createMapping(): void {
    if (!this.selectedLineItem) return;
    const data = {
      ...this.newMapping,
      templateId: this.templateId,
      lineItemId: this.selectedLineItem.id,
      workflowStatus: 'draft',
      ...(this.compilationId ? { compilationId: this.compilationId } : {}),
    };
    this.api.post<MappingRule>('/mappings', data).subscribe({
      next: () => {
        if (this.dialogRef) this.dialogRef.close();
        this.loadMappings();
        this.mappingChanged.emit();
      },
      error: (err: any) => {
        this.snackBar.open(err?.error?.message || 'Failed to create mapping', 'OK', { duration: 4000 });
      },
    });
  }

  openEditDialog(tpl: TemplateRef<any>, mapping: MappingRule): void {
    this.editMappingId = mapping.id;
    this.editData = {
      glAccountCode: mapping.glAccountCode,
      glAccountName: mapping.glAccountName,
      mappingType: mapping.mappingType,
      allocationPercentage: mapping.allocationPercentage,
      changeReason: '',
    };
    this.dialogRef = this.dialog.open(tpl, { width: '560px' });
  }

  updateMapping(): void {
    this.api.put<MappingRule>(`/mappings/${this.editMappingId}`, this.editData).subscribe({
      next: () => {
        if (this.dialogRef) this.dialogRef.close();
        this.loadMappings();
        this.mappingChanged.emit();
      },
    });
  }

  removeDefault(def: { scoaAccountNumber: string; scoaDescription: string }): void {
    this.defaultMappings = this.defaultMappings.filter(d => d.scoaAccountNumber !== def.scoaAccountNumber);
    this.defaultMappingRemoved.emit({ scoaAccountNumber: def.scoaAccountNumber });
  }

  deleteMapping(mapping: MappingRule): void {
    if (!confirm(`Delete mapping for ${mapping.glAccountCode}?`)) return;
    this.api.delete(`/mappings/${mapping.id}`).subscribe({
      next: () => {
        this.loadMappings();
        this.mappingChanged.emit();
      },
      error: (err: any) => {
        this.snackBar.open(err?.error?.message || 'Failed to delete mapping', 'OK', { duration: 4000 });
      },
    });
  }

  submitForReview(mapping: MappingRule): void {
    this.api.post(`/mappings/${mapping.id}/submit-review`, {}).subscribe({
      next: () => {
        this.loadMappings();
        this.mappingChanged.emit();
      },
    });
  }

  approveMapping(mapping: MappingRule): void {
    this.api.post(`/mappings/${mapping.id}/approve`, {}).subscribe({
      next: () => {
        this.loadMappings();
        this.mappingChanged.emit();
      },
    });
  }

  openRejectDialog(tpl: TemplateRef<any>, mapping: MappingRule): void {
    this.selectedMappingForAction = mapping;
    this.rejectionReason = '';
    this.dialogRef = this.dialog.open(tpl, { width: '480px' });
  }

  confirmReject(): void {
    if (!this.selectedMappingForAction) return;
    this.api.post(`/mappings/${this.selectedMappingForAction.id}/reject`, { reason: this.rejectionReason }).subscribe({
      next: () => {
        if (this.dialogRef) this.dialogRef.close();
        this.loadMappings();
        this.mappingChanged.emit();
      },
    });
  }

  viewHistory(mapping: MappingRule): void {
    this.showHistory = true;
    this.showDocuments = false;
    this.historyLoading = true;
    this.api.get<MappingAuditEntry[]>(`/mappings/${mapping.id}/history`).subscribe({
      next: (data) => {
        this.auditHistory = data;
        this.historyLoading = false;
      },
      error: () => { this.historyLoading = false; },
    });
  }

  viewDocuments(mapping: MappingRule): void {
    this.showDocuments = true;
    this.showHistory = false;
    this.selectedMappingForDocs = mapping;
    this.api.get<MappingDocument[]>(`/mappings/${mapping.id}/documents`).subscribe({
      next: (data) => { this.documents = data; },
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file || !this.selectedMappingForDocs) return;
    const formData = new FormData();
    formData.append('file', file);
    this.api.postFormData(`/mappings/${this.selectedMappingForDocs.id}/documents`, formData).subscribe({
      next: () => {
        if (this.selectedMappingForDocs) this.viewDocuments(this.selectedMappingForDocs);
      },
    });
  }

  deleteDocument(doc: MappingDocument): void {
    this.api.delete(`/mappings/documents/${doc.id}`).subscribe({
      next: () => {
        if (this.selectedMappingForDocs) this.viewDocuments(this.selectedMappingForDocs);
      },
    });
  }

  formatWorkflowStatus(status: string): string {
    switch (status) {
      case 'draft': return 'Draft';
      case 'pending_review': return 'Pending Review';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  }

  formatRand(value: number): string {
    if (value == null) return '—';
    const abs = Math.abs(value);
    const formatted = abs >= 1_000_000
      ? 'R ' + (abs / 1_000_000).toFixed(2) + 'M'
      : abs >= 1_000
      ? 'R ' + (abs / 1_000).toFixed(1) + 'K'
      : 'R ' + abs.toFixed(2);
    return value < 0 ? '(' + formatted + ')' : formatted;
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'mapped': return 'Fully mapped';
      case 'partial': return 'Partially mapped';
      case 'unmapped': return 'Unmapped';
      case 'locked': return 'Approved / Locked';
      default: return status;
    }
  }

  getAuditIcon(action: string): string {
    switch (action) {
      case 'CREATE': case 'BULK_CREATE': return 'add_circle';
      case 'UPDATE': return 'edit';
      case 'DELETE': return 'delete';
      case 'SUBMIT_REVIEW': return 'send';
      case 'APPROVE': return 'check_circle';
      case 'REJECT': return 'cancel';
      case 'UPLOAD_DOCUMENT': return 'upload_file';
      case 'DELETE_DOCUMENT': return 'delete_sweep';
      default: return 'info';
    }
  }

  getChangedKeys(entry: MappingAuditEntry): string[] {
    const keys = new Set<string>();
    if (entry.oldValues) Object.keys(entry.oldValues).forEach(k => keys.add(k));
    if (entry.newValues) Object.keys(entry.newValues).forEach(k => keys.add(k));
    return Array.from(keys);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
