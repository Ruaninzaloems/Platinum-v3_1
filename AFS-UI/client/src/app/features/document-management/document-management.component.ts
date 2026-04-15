import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DocumentManagementService, DmsDocument, DmsClassification, DmsStats, DmsSearchParams, RetentionItem, SourceDocumentChain } from './document-management.service';
import { DocumentUploadDialogComponent } from './document-upload-dialog.component';

@Component({
  selector: 'app-document-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatMenuModule,
    MatDialogModule,
    MatTabsModule,
    MatProgressBarModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './document-management.component.html',
  styleUrl: './document-management.component.css',
})
export class DocumentManagementComponent implements OnInit {
  private dms = inject(DocumentManagementService);
  private dialog = inject(MatDialog);

  documents = signal<DmsDocument[]>([]);
  stats = signal<DmsStats | null>(null);
  classifications = signal<DmsClassification[]>([]);
  retentionItems = signal<RetentionItem[]>([]);
  selectedDocument = signal<DmsDocument | null>(null);
  versionHistory = signal<DmsDocument[]>([]);
  auditTrail = signal<any[]>([]);
  loading = signal(false);
  activeTab = signal<'registry' | 'classifications' | 'retention' | 'source' | 'detail'>('registry');
  selectedIds = signal<string[]>([]);
  currentPage = signal(1);
  totalDocs = signal(0);
  totalPages = signal(1);

  sourceDocResult = signal<SourceDocumentChain | null>(null);
  sourceDocLoading = signal(false);
  sourceDocNumber = '';
  sourceDocFinYear = '';

  searchQuery = '';
  typeFilter = '';
  accessFilter = '';
  disposalFilter = '';

  documentTypes = [
    { value: 'evidence', label: 'Evidence' },
    { value: 'working_paper', label: 'Working Paper' },
    { value: 'rfi_attachment', label: 'RFI Attachment' },
    { value: 'finding_attachment', label: 'Finding Attachment' },
    { value: 'adjustment_support', label: 'Adjustment Support' },
    { value: 'afs_draft', label: 'AFS Draft' },
    { value: 'afs_final', label: 'AFS Final' },
    { value: 'export', label: 'Export' },
    { value: 'template', label: 'Template' },
    { value: 'mapping_snapshot', label: 'Mapping Snapshot' },
    { value: 'scoa_version', label: 'SCOA Version' },
  ];

  statusEntries = computed(() => {
    const s = this.stats()?.byStatus || {};
    return Object.entries(s).map(([key, value]) => ({ key, value }));
  });

  typeEntries = computed(() => {
    const s = this.stats()?.byType || {};
    return Object.entries(s).map(([key, value]) => ({ key, value }));
  });

  accessEntries = computed(() => {
    const s = this.stats()?.byAccessLevel || {};
    return Object.entries(s).map(([key, value]) => ({ key, value }));
  });

  allSelected = computed(() => {
    const docs = this.documents();
    return docs.length > 0 && this.selectedIds().length === docs.length;
  });

  someSelected = computed(() => this.selectedIds().length > 0);

  ngOnInit() {
    this.doSearch();
    this.loadStats();
  }

  refresh() {
    this.doSearch();
    this.loadStats();
  }

  doSearch() {
    this.loading.set(true);
    const params: DmsSearchParams = {
      search: this.searchQuery || undefined,
      documentType: this.typeFilter || undefined,
      accessLevel: this.accessFilter || undefined,
      disposalStatus: this.disposalFilter || undefined,
      page: this.currentPage(),
      limit: 25,
    };
    this.dms.search(params).subscribe({
      next: (res) => {
        this.documents.set(res.items || []);
        this.totalDocs.set(res.total || 0);
        this.totalPages.set(res.totalPages || 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadStats() {
    this.dms.getStats().subscribe({
      next: (s) => this.stats.set(s),
      error: () => {},
    });
  }

  loadClassifications() {
    this.dms.getClassifications().subscribe({
      next: (c) => this.classifications.set(c || []),
      error: () => {},
    });
  }

  loadRetention() {
    this.dms.getRetentionSchedule().subscribe({
      next: (items) => this.retentionItems.set(items || []),
      error: () => {},
    });
  }

  selectDocument(doc: DmsDocument) {
    this.selectedDocument.set(doc);
    this.activeTab.set('detail');
    this.loadVersionHistory(doc.id);
    this.loadAuditTrail(doc.id);
  }

  loadVersionHistory(id: string) {
    this.dms.getVersionHistory(id).subscribe({
      next: (v) => this.versionHistory.set(v || []),
      error: () => this.versionHistory.set([]),
    });
  }

  loadAuditTrail(id: string) {
    this.dms.getAuditTrail(id).subscribe({
      next: (a) => this.auditTrail.set(a || []),
      error: () => this.auditTrail.set([]),
    });
  }

  openUploadDialog() {
    const ref = this.dialog.open(DocumentUploadDialogComponent, {
      width: '600px',
      data: {},
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.refresh();
    });
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    this.doSearch();
  }

  isSelectedId(id: string): boolean {
    return this.selectedIds().includes(id);
  }

  toggleSelection(id: string) {
    const current = this.selectedIds();
    if (current.includes(id)) {
      this.selectedIds.set(current.filter(i => i !== id));
    } else {
      this.selectedIds.set([...current, id]);
    }
  }

  toggleAllSelection() {
    if (this.allSelected()) {
      this.selectedIds.set([]);
    } else {
      this.selectedIds.set(this.documents().map(d => d.id));
    }
  }

  clearSelection() {
    this.selectedIds.set([]);
  }

  lookupSourceDocuments() {
    if (!this.sourceDocNumber) return;
    this.sourceDocLoading.set(true);
    this.sourceDocResult.set(null);
    this.dms.getSourceDocuments(this.sourceDocNumber, this.sourceDocFinYear || undefined).subscribe({
      next: (result) => {
        this.sourceDocResult.set(result);
        this.sourceDocLoading.set(false);
      },
      error: () => {
        this.sourceDocResult.set({
          available: false,
          message: 'Failed to connect to source document service',
          documentNumber: this.sourceDocNumber,
          finYear: this.sourceDocFinYear || null,
        });
        this.sourceDocLoading.set(false);
      },
    });
  }

  bulkClassify() {
    // placeholder
  }

  bulkDisposal() {
    const ids = this.selectedIds();
    if (ids.length === 0) return;
    this.dms.requestDisposal(ids, 'Bulk disposal request').subscribe({
      next: () => {
        this.clearSelection();
        this.refresh();
      },
      error: () => {},
    });
  }

  downloadDoc(id: string) {
    window.open(`/api/documents/${id}/download`, '_blank');
  }

  verifyDoc(id: string) {
    this.dms.verifyIntegrity(id).subscribe({
      next: () => this.refresh(),
      error: () => {},
    });
  }

  checkoutDoc(id: string) {
    this.dms.checkOut(id).subscribe({
      next: () => this.refresh(),
      error: () => {},
    });
  }

  checkinDoc(id: string) {
    this.dms.checkIn(id).subscribe({
      next: () => this.refresh(),
      error: () => {},
    });
  }

  lockDoc(id: string) {
    this.dms.lock(id).subscribe({
      next: () => this.refresh(),
      error: () => {},
    });
  }

  formatSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }

  formatDocType(type?: string): string {
    if (!type) return 'evidence';
    return type.replace(/_/g, ' ');
  }

  getFileIcon(mimeType: string): string {
    if (!mimeType) return 'insert_drive_file';
    if (mimeType.includes('pdf')) return 'picture_as_pdf';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'table_chart';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'article';
    return 'insert_drive_file';
  }

  getAccessChipClass(level?: string): string {
    switch (level) {
      case 'public': return 'chip-green';
      case 'internal': return 'chip-blue';
      case 'confidential': return 'chip-amber';
      case 'restricted': return 'chip-red';
      default: return 'chip-blue';
    }
  }

  getStatusBarClass(status: string): string {
    switch (status) {
      case 'active': return 'comp-green';
      case 'pending_disposal': return 'comp-amber';
      case 'disposed': return 'comp-red';
      case 'archived': return 'comp-green';
      default: return 'comp-green';
    }
  }

  getStatusPercent(value: number): number {
    const total = this.stats()?.totalDocuments || 1;
    return Math.min((value / total) * 100, 100);
  }

  getTypePercent(value: number): number {
    const total = this.stats()?.totalDocuments || 1;
    return Math.min((value / total) * 100, 100);
  }

  getAccessPercent(value: number): number {
    const total = this.stats()?.totalDocuments || 1;
    return Math.min((value / total) * 100, 100);
  }
}
