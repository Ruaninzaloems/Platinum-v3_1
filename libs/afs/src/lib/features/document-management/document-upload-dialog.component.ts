import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DocumentManagementService, DmsClassification, UploadMetadata } from './document-management.service';

export interface UploadDialogData {
  contextType?: string;
  contextId?: string;
  financialYearId?: string;
  preselectedType?: string;
  preselectedClassification?: string;
}

@Component({
  selector: 'app-document-upload-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  templateUrl: './document-upload-dialog.component.html',
})
export class DocumentUploadDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<DocumentUploadDialogComponent>);
  data: UploadDialogData = inject(MAT_DIALOG_DATA, { optional: true }) || {};
  private dms = inject(DocumentManagementService);

  selectedFile = signal<File | null>(null);
  isDragOver = signal(false);
  uploading = signal(false);
  classifications = signal<DmsClassification[]>([]);
  selectedClassification = signal<DmsClassification | null>(null);

  documentType = '';
  accessLevel = 'internal';
  classificationCode = '';
  category = '';
  description = '';
  tagsStr = '';

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

  ngOnInit() {
    if (this.data.preselectedType) this.documentType = this.data.preselectedType;
    this.dms.getClassifications().subscribe({
      next: (c) => this.classifications.set(c || []),
      error: () => {},
    });
  }

  onClassificationChange() {
    const found = this.classifications().find(c => c.code === this.classificationCode);
    this.selectedClassification.set(found || null);
    if (found?.defaultAccessLevel) this.accessLevel = found.defaultAccessLevel;
  }

  formatSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    if (event.dataTransfer?.files?.length) {
      this.selectedFile.set(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile.set(input.files[0]);
      input.value = '';
    }
  }

  upload() {
    const file = this.selectedFile();
    if (!file) return;

    this.uploading.set(true);
    const metadata: UploadMetadata = {
      documentType: this.documentType || undefined,
      accessLevel: this.accessLevel,
      classificationCode: this.classificationCode || undefined,
      classificationLabel: this.selectedClassification()?.label || undefined,
      category: this.category || undefined,
      description: this.description || undefined,
      tags: this.tagsStr || undefined,
      financialYearId: this.data.financialYearId || undefined,
    };

    if (this.data.contextType && this.data.contextId) {
      const contextMap: Record<string, keyof UploadMetadata> = {
        compilation: 'compilationId',
        rfi: 'rfiId',
        finding: 'findingId',
        working_paper: 'workingPaperId',
        adjustment: 'adjustmentId',
      };
      const key = contextMap[this.data.contextType];
      if (key) (metadata as any)[key] = this.data.contextId;
    }

    this.dms.upload(file, metadata).subscribe({
      next: (doc) => {
        this.uploading.set(false);
        this.dialogRef.close(doc);
      },
      error: () => this.uploading.set(false),
    });
  }
}
