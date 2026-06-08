import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, takeUntil, catchError } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { AuditFinding } from '../../core/models/interfaces';
import { DocumentManagementService, DmsDocument } from '../document-management/document-management.service';
import { DocumentUploadDialogComponent } from '../document-management/document-upload-dialog.component';
import { DocumentPickerComponent } from '../document-management/document-picker.component';

interface UserSuggestion {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  department: string;
}

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
  isDragging = signal(false);
  attachUploadingFiles: File[] = [];
  attachFileProgress: number[] = [];

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
        this.loadFindings();
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

  getFileIcon(filename: string): string {
    if (!filename) return 'insert_drive_file';
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['pdf'].includes(ext)) return 'picture_as_pdf';
    if (['doc', 'docx'].includes(ext)) return 'description';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'table_chart';
    if (['msg', 'eml'].includes(ext)) return 'email';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(ext)) return 'image';
    if (['zip', 'rar', '7z'].includes(ext)) return 'folder_zip';
    if (['ppt', 'pptx'].includes(ext)) return 'slideshow';
    return 'insert_drive_file';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent, findingId: string) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.uploadAttachmentsImmediately(Array.from(event.dataTransfer.files), findingId);
    }
  }

  onAttachFilesSelected(event: Event, findingId: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadAttachmentsImmediately(Array.from(input.files), findingId);
    }
    input.value = '';
  }

  private uploadAttachmentsImmediately(files: File[], findingId: string) {
    const startIdx = this.attachUploadingFiles.length;
    this.attachUploadingFiles.push(...files);
    this.attachFileProgress.push(...files.map(() => 0));

    let completed = 0;
    let failed = 0;
    const failedNames: string[] = [];
    const total = files.length;

    const checkDone = () => {
      if (completed === total) {
        if (failed > 0) {
          alert(`${failed} of ${total} file(s) failed to upload: ${failedNames.join(', ')}`);
        }
        setTimeout(() => {
          this.attachUploadingFiles = [];
          this.attachFileProgress = [];
        }, 2000);
        this.loadFindingDocuments(findingId);
      }
    };

    files.forEach((file, i) => {
      const idx = startIdx + i;
      const fd = new FormData();
      fd.append('file', file);
      this.api.uploadWithProgress(`/findings/${findingId}/attachments`, fd).subscribe({
        next: (progress) => {
          this.attachFileProgress[idx] = progress.progress;
          if (progress.done) {
            this.attachFileProgress[idx] = 100;
            completed++;
            checkDone();
          }
        },
        error: () => {
          this.attachFileProgress[idx] = -1;
          failed++;
          failedNames.push(file.name);
          completed++;
          checkDone();
        },
      });
    });
  }
}

@Component({
  selector: 'app-finding-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
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
        <mat-label>Assigned To</mat-label>
        <input matInput
               [formControl]="assignedToCtrl"
               [matAutocomplete]="userAuto"
               placeholder="Start typing a name or email...">
        <mat-autocomplete #userAuto="matAutocomplete"
                          (optionSelected)="onUserSelected($event)"
                          [displayWith]="displayUser">
          @for (user of userSuggestions; track user.id) {
            <mat-option [value]="user">
              <div style="line-height: 1.3;">
                <span style="font-weight: 500;">{{ user.fullName }}</span>
                <span style="color: #666; font-size: 12px; margin-left: 8px;">{{ user.email }}</span>
                @if (user.department) {
                  <span style="color: #999; font-size: 11px; margin-left: 6px;">· {{ user.department }}</span>
                }
              </div>
            </mat-option>
          }
        </mat-autocomplete>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Link to RFI (optional)</mat-label>
        <input matInput
               [formControl]="rfiSearchCtrl"
               [matAutocomplete]="rfiAuto"
               placeholder="Search by RFI reference or subject...">
        <mat-autocomplete #rfiAuto="matAutocomplete"
                          (optionSelected)="onRfiSelected($event)"
                          [displayWith]="displayRfi">
          @for (rfi of rfiSuggestions; track rfi.id) {
            <mat-option [value]="rfi">
              <div style="line-height: 1.3;">
                <span style="font-weight: 600; color: var(--platinum-primary, #1976d2);">{{ rfi.reference }}</span>
                <span style="margin-left: 8px;">{{ rfi.subject }}</span>
                <span style="color: #999; font-size: 11px; margin-left: 8px;">{{ rfi.status }}</span>
              </div>
            </mat-option>
          }
        </mat-autocomplete>
        @if (form.rfiId) {
          <button matSuffix mat-icon-button style="width: 24px; height: 24px;" (click)="clearRfi()">
            <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
          </button>
        }
      </mat-form-field>
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
          <button mat-stroked-button type="button" (click)="fileInput.click()" [disabled]="uploading">
            <mat-icon>cloud_upload</mat-icon> Choose Files
          </button>
        </div>
        @if (pendingFiles.length > 0) {
          <div style="display: flex; flex-direction: column; gap: 4px;">
            @for (f of pendingFiles; track f.name; let i = $index) {
              <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; padding: 4px 8px; background: #f5f5f5; border-radius: 4px;">
                <mat-icon style="font-size: 16px; width: 16px; height: 16px;">insert_drive_file</mat-icon>
                <span style="flex: 1;">{{ f.name }}</span>
                <span style="color: #999; font-size: 11px;">{{ formatSize(f.size) }}</span>
                @if (!uploading) {
                  <button mat-icon-button style="width: 24px; height: 24px;" (click)="removePendingFile(f)">
                    <mat-icon style="font-size: 14px; width: 14px; height: 14px;">close</mat-icon>
                  </button>
                }
                @if (uploading && fileProgress[i] !== undefined) {
                  @if (fileProgress[i] >= 100) {
                    <mat-icon style="font-size: 16px; width: 16px; height: 16px; color: #4caf50;">check_circle</mat-icon>
                  } @else {
                    <span style="color: var(--platinum-primary); font-size: 11px; font-weight: 500;">{{ fileProgress[i] }}%</span>
                  }
                }
              </div>
              @if (uploading && fileProgress[i] !== undefined && fileProgress[i] < 100) {
                <div style="height: 3px; background: #e0e0e0; border-radius: 2px; overflow: hidden;">
                  <div [style.width.%]="fileProgress[i]" style="height: 100%; background: var(--platinum-primary, #1976d2); transition: width 0.2s;"></div>
                </div>
              }
            }
          </div>
        }
        @if (uploading) {
          <div style="font-size: 12px; color: var(--platinum-primary, #1976d2); margin-top: 6px; font-weight: 500;">
            Uploading {{ uploadedCount }}/{{ pendingFiles.length }} files...
          </div>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="uploading">Cancel</button>
      <button mat-flat-button class="btn-primary" [disabled]="!form.title || saving || uploading" (click)="submit()">
        @if (saving) { Creating... } @else { Create Finding }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { display: flex; flex-direction: column; gap: 4px; min-width: 500px; }
  `],
})
export class FindingCreateDialogComponent implements OnDestroy {
  private dialogRef = inject(MatDialogRef<FindingCreateDialogComponent>);
  private api = inject(ApiService);
  private destroy$ = new Subject<void>();

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
    assignedTo: '',
    rfiId: '',
  };

  pendingFiles: File[] = [];
  uploading = false;
  saving = false;
  fileProgress: number[] = [];
  uploadedCount = 0;
  assignedToCtrl = new FormControl('');
  userSuggestions: UserSuggestion[] = [];
  selectedUserName = '';
  rfiSearchCtrl = new FormControl('');
  rfiSuggestions: any[] = [];
  allRfis: any[] = [];

  constructor() {
    this.assignedToCtrl.valueChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(val => {
        const term = typeof val === 'string' ? val : '';
        if (term.length < 1) return of([]);
        return this.api.get<UserSuggestion[]>(`/auth/users/search?q=${encodeURIComponent(term)}`).pipe(
          catchError(() => of([]))
        );
      }),
      takeUntil(this.destroy$),
    ).subscribe(users => {
      this.userSuggestions = users;
    });

    this.api.get<any[]>('/rfis').pipe(
      catchError(() => of([])),
      takeUntil(this.destroy$),
    ).subscribe(rfis => {
      this.allRfis = rfis;
    });

    this.rfiSearchCtrl.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(val => {
      const term = (typeof val === 'string' ? val : '').toLowerCase();
      if (term.length < 1) {
        this.rfiSuggestions = this.allRfis.slice(0, 10);
      } else {
        this.rfiSuggestions = this.allRfis.filter(r =>
          (r.reference || '').toLowerCase().includes(term) ||
          (r.subject || '').toLowerCase().includes(term) ||
          (r.externalReference || '').toLowerCase().includes(term)
        ).slice(0, 10);
      }
    });
  }

  displayUser(user: any): string {
    if (!user) return '';
    if (typeof user === 'string') return user;
    return user.fullName || `${user.firstName} ${user.lastName}`.trim();
  }

  onUserSelected(event: any) {
    const user = event.option.value;
    this.form.assignedTo = user.id;
    this.selectedUserName = this.displayUser(user);
  }

  displayRfi(rfi: any): string {
    if (!rfi) return '';
    if (typeof rfi === 'string') return rfi;
    return `${rfi.reference} — ${rfi.subject}`;
  }

  onRfiSelected(event: any) {
    const rfi = event.option.value;
    this.form.rfiId = rfi.id;
    this.rfiSearchCtrl.setValue(rfi, { emitEvent: false });
  }

  clearRfi() {
    this.form.rfiId = '';
    this.rfiSearchCtrl.setValue('', { emitEvent: false });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.pendingFiles.push(...Array.from(input.files));
    }
    input.value = '';
  }

  removePendingFile(file: File) {
    this.pendingFiles = this.pendingFiles.filter(f => f !== file);
  }

  formatSize(bytes: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  submit() {
    if (this.saving || this.uploading) return;
    if (!this.form.assignedTo) {
      const ctrlVal = this.assignedToCtrl.value;
      if (ctrlVal && typeof ctrlVal === 'object') {
        this.form.assignedTo = (ctrlVal as UserSuggestion).id;
      }
    }
    this.saving = true;
    this.api.post('/findings', this.form).subscribe({
      next: (finding: any) => {
        if (this.pendingFiles.length > 0) {
          this.uploadFiles(finding.id);
        } else {
          this.saving = false;
          this.dialogRef.close(true);
        }
      },
      error: () => { this.saving = false; },
    });
  }

  private uploadFiles(findingId: string) {
    this.uploading = true;
    this.saving = false;
    this.fileProgress = this.pendingFiles.map(() => 0);
    this.uploadedCount = 0;

    let completed = 0;
    const total = this.pendingFiles.length;

    this.pendingFiles.forEach((file, idx) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('contextType', 'finding');
      formData.append('contextId', findingId);
      formData.append('documentType', 'finding_attachment');

      this.api.uploadWithProgress('/documents/upload', formData).pipe(
        takeUntil(this.destroy$),
      ).subscribe({
        next: (progress) => {
          this.fileProgress[idx] = progress.progress;
          if (progress.done) {
            this.uploadedCount++;
          }
        },
        error: () => {
          this.fileProgress[idx] = 100;
          completed++;
          this.uploadedCount++;
          if (completed === total) this.finishUpload();
        },
        complete: () => {
          completed++;
          if (completed === total) this.finishUpload();
        },
      });
    });
  }

  private finishUpload() {
    this.uploading = false;
    this.dialogRef.close(true);
  }
}
