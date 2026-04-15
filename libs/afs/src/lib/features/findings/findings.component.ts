import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { AuditFinding } from '../../core/models/interfaces';
import { DocumentManagementService, DmsDocument } from '../document-management/document-management.service';
import { DocumentUploadDialogComponent } from '../document-management/document-upload-dialog.component';
import { DocumentPickerComponent } from '../document-management/document-picker.component';

@Component({
  selector: 'app-findings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule,
    MatSelectModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './findings.component.html',
  styleUrl: './findings.component.css',
})
export class FindingsComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private dms = inject(DocumentManagementService);

  findings = signal<AuditFinding[]>([]);
  loading = signal(false);
  expandedId = signal<string | null>(null);
  findingDocuments = signal<Map<string, DmsDocument[]>>(new Map());

  materialCount = computed(() => this.findings().filter(f => f.severity?.toLowerCase() === 'material').length);
  significantCount = computed(() => this.findings().filter(f => f.severity?.toLowerCase() === 'significant').length);
  unresolvedCount = computed(() => this.findings().filter(f => f.status?.toLowerCase() !== 'resolved' && f.status?.toLowerCase() !== 'closed').length);

  ngOnInit() {
    this.loadFindings();
  }

  loadFindings() {
    this.loading.set(true);
    this.api.get<AuditFinding[]>('/findings').subscribe({
      next: (data) => {
        this.findings.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(FindingCreateDialogComponent, {
      width: '640px',
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.api.post('/findings', result.formData).subscribe({
          next: (finding: any) => {
            if (result.files && result.files.length > 0) {
              let uploaded = 0;
              for (const file of result.files) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('contextType', 'finding');
                formData.append('contextId', finding.id);
                formData.append('documentType', 'finding_attachment');
                this.api.post('/documents/upload', formData).subscribe({
                  next: () => { uploaded++; if (uploaded === result.files.length) this.loadFindings(); },
                  error: () => { uploaded++; if (uploaded === result.files.length) this.loadFindings(); },
                });
              }
            } else {
              this.loadFindings();
            }
          },
        });
      }
    });
  }

  toggleExpand(id: string) {
    const newId = this.expandedId() === id ? null : id;
    this.expandedId.set(newId);
    if (newId && !this.findingDocuments().has(newId)) {
      this.loadFindingDocuments(newId);
    }
  }

  loadFindingDocuments(findingId: string) {
    this.dms.getByContext('finding', findingId).subscribe({
      next: (docs) => {
        const map = new Map(this.findingDocuments());
        map.set(findingId, docs);
        this.findingDocuments.set(map);
      },
      error: () => {},
    });
  }

  uploadDocForFinding(findingId: string) {
    const ref = this.dialog.open(DocumentUploadDialogComponent, {
      width: '600px',
      data: { contextType: 'finding', contextId: findingId, preselectedType: 'finding_attachment' },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadFindingDocuments(findingId);
    });
  }

  linkDocToFinding(findingId: string) {
    const ref = this.dialog.open(DocumentPickerComponent, {
      width: '640px',
      data: { multiple: true, documentType: 'finding_attachment' },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadFindingDocuments(findingId);
    });
  }

  downloadDoc(docId: string) {
    window.open(`/api/documents/${docId}/download`, '_blank');
  }

  reviewResponse(findingId: string, responseId: string, status: 'approved' | 'rejected') {
    this.api.put(`/findings/${findingId}/responses/${responseId}/review`, { status, reviewedBy: 'current-user' }).subscribe({
      next: (updatedFinding: any) => {
        const list = this.findings().map(f => f.id === findingId ? updatedFinding : f);
        this.findings.set(list);
      },
    });
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}

@Component({
  selector: 'app-finding-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>New Audit Finding</h2>
    <mat-dialog-content>
      <div class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Title</mat-label>
          <input matInput [(ngModel)]="form.title" required>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>AGSA Reference</mat-label>
          <input matInput [(ngModel)]="form.externalReference" placeholder="e.g. COMAF-001">
        </mat-form-field>
      </div>
      <div class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Category</mat-label>
          <input matInput [(ngModel)]="form.category">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Severity</mat-label>
          <mat-select [(ngModel)]="form.severity">
            <mat-option value="Material">Material</mat-option>
            <mat-option value="Significant">Significant</mat-option>
            <mat-option value="Minor">Minor</mat-option>
            <mat-option value="Observation">Observation</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
      <mat-form-field appearance="outline">
        <mat-label>Description</mat-label>
        <textarea matInput [(ngModel)]="form.description" rows="3"></textarea>
      </mat-form-field>
      <div class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Financial Impact</mat-label>
          <input matInput type="number" [(ngModel)]="form.financialImpact">
        </mat-form-field>
      </div>
      <mat-form-field appearance="outline">
        <mat-label>Criteria</mat-label>
        <textarea matInput [(ngModel)]="form.criteria" rows="2"></textarea>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Condition</mat-label>
        <textarea matInput [(ngModel)]="form.condition" rows="2"></textarea>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Cause</mat-label>
        <textarea matInput [(ngModel)]="form.cause" rows="2"></textarea>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Effect</mat-label>
        <textarea matInput [(ngModel)]="form.effect" rows="2"></textarea>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Recommendation</mat-label>
        <textarea matInput [(ngModel)]="form.recommendation" rows="2"></textarea>
      </mat-form-field>

      <div style="margin-top: 8px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <mat-icon style="font-size: 18px; width: 18px; height: 18px;">attach_file</mat-icon>
          <span style="font-weight: 500; font-size: 13px;">Evidence Attachments</span>
        </div>
        <div style="margin-bottom: 8px;">
          <input type="file" multiple #fileInput style="display: none;" (change)="onFilesSelected($event)">
          <button mat-stroked-button type="button" (click)="fileInput.click()">
            <mat-icon>cloud_upload</mat-icon> Choose Files
          </button>
        </div>
        @if (pendingFiles.length > 0) {
          <div style="display: flex; flex-direction: column; gap: 4px;">
            @for (f of pendingFiles; track f.name) {
              <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; padding: 4px 8px; background: #f5f5f5; border-radius: 4px;">
                <mat-icon style="font-size: 16px; width: 16px; height: 16px;">insert_drive_file</mat-icon>
                <span style="flex: 1;">{{ f.name }}</span>
                <button mat-icon-button style="width: 24px; height: 24px;" (click)="removePendingFile(f)">
                  <mat-icon style="font-size: 14px; width: 14px; height: 14px;">close</mat-icon>
                </button>
              </div>
            }
          </div>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button class="btn-primary" [disabled]="!form.title" (click)="submit()">Create Finding</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { display: flex; flex-direction: column; gap: 4px; min-width: 500px; }
  `],
})
export class FindingCreateDialogComponent {
  private dialogRef = inject(MatDialogRef<FindingCreateDialogComponent>);

  form: any = {
    title: '',
    description: '',
    severity: 'Minor',
    category: '',
    financialImpact: null,
    externalReference: '',
    criteria: '',
    condition: '',
    cause: '',
    effect: '',
    recommendation: '',
  };

  pendingFiles: File[] = [];

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.pendingFiles.push(...Array.from(input.files));
    }
  }

  removePendingFile(file: File) {
    this.pendingFiles = this.pendingFiles.filter(f => f !== file);
  }

  submit() {
    this.dialogRef.close({ formData: this.form, files: this.pendingFiles });
  }
}
