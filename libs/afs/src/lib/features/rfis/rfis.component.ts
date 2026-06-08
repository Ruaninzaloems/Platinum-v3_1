import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, takeUntil, catchError, forkJoin, last, filter } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { Rfi } from '../../core/models/interfaces';
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
  selector: 'app-create-rfi-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDialogModule, MatIconModule, MatDatepickerModule, MatNativeDateModule, MatAutocompleteModule],
  templateUrl: './rfis.component.html',
})
export class CreateRfiDialogComponent implements OnDestroy {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();
  data: any = { subject: '', description: '', priority: 'Medium', assignedTo: '', dueDate: null, externalReference: '' };
  pendingFiles: File[] = [];
  uploading = false;
  saving = false;
  fileProgress: number[] = [];
  uploadedCount = 0;
  assignedToCtrl = new FormControl('');
  userSuggestions: UserSuggestion[] = [];

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
  }

  displayUser(user: any): string {
    if (!user) return '';
    if (typeof user === 'string') return user;
    return user.fullName || `${user.firstName} ${user.lastName}`.trim();
  }

  onUserSelected(event: any) {
    const user = event.option.value;
    this.data.assignedTo = user.id;
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

  save() {
    if (this.saving || this.uploading) return;
    if (!this.data.assignedTo) {
      const ctrlVal = this.assignedToCtrl.value;
      if (ctrlVal && typeof ctrlVal === 'object') {
        this.data.assignedTo = (ctrlVal as UserSuggestion).id;
      }
    }
    this.saving = true;
    this.api.post<Rfi>('/rfis', this.data).subscribe({
      next: (rfi) => {
        if (this.pendingFiles.length > 0) {
          this.uploadFiles(rfi.id);
        } else {
          this.saving = false;
          this.closeDialog(true);
        }
      },
      error: () => { this.saving = false; },
    });
  }

  private uploadFiles(rfiId: string) {
    this.uploading = true;
    this.saving = false;
    this.fileProgress = this.pendingFiles.map(() => 0);
    this.uploadedCount = 0;

    let completed = 0;
    const total = this.pendingFiles.length;

    this.pendingFiles.forEach((file, idx) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('contextType', 'rfi');
      formData.append('contextId', rfiId);
      formData.append('documentType', 'rfi_attachment');

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
    this.closeDialog(true);
  }

  private closeDialog(result: any) {
    const ref = this.dialog.openDialogs.find(d => d.componentInstance === this);
    ref?.close(result);
  }
}

@Component({
  selector: 'app-rfis',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>RFI Management</h1>
          <div class="subtitle">Requests for Information</div>
        </div>
        <div class="page-actions">
          <button mat-flat-button class="btn-primary" (click)="openCreateDialog()" matTooltip="Create a new Request for Information">
            <mat-icon>add</mat-icon>
            New RFI
          </button>
        </div>
      </div>

      <div class="summary-strip">
        <div class="kpi-card" matTooltip="Total number of RFIs in the system">
          <div class="kpi-label">Total</div>
          <div class="kpi-value">{{ rfis().length }}</div>
        </div>
        <div class="kpi-card" matTooltip="RFIs awaiting a response from the assigned party">
          <div class="kpi-label">Open</div>
          <div class="kpi-value">{{ countByStatus('Open') }}</div>
        </div>
        <div class="kpi-card" matTooltip="RFIs that have received a response">
          <div class="kpi-label">Responded</div>
          <div class="kpi-value">{{ countByStatus('Responded') }}</div>
        </div>
        <div class="kpi-card" matTooltip="RFIs that have passed their due date without response">
          <div class="kpi-label">Overdue</div>
          <div class="kpi-value" style="color: var(--platinum-danger);">{{ overdueCount() }}</div>
        </div>
      </div>

      <div class="filters-bar">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" style="width: 180px;" matTooltip="Filter RFIs by status: Open, Responded, Closed, or Escalated">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="statusFilter" (ngModelChange)="statusFilter = $event">
            <mat-option value="All">All Statuses</mat-option>
            <mat-option value="Open">Open</mat-option>
            <mat-option value="Responded">Responded</mat-option>
            <mat-option value="Closed">Closed</mat-option>
            <mat-option value="Escalated">Escalated</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" style="flex: 1; min-width: 200px;" matTooltip="Search RFIs by subject or reference number">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput placeholder="Search RFIs..." [(ngModel)]="searchQuery">
        </mat-form-field>
      </div>

      @if (filteredRfis().length === 0 && !loading()) {
        <div class="empty-state">
          <mat-icon>question_answer</mat-icon>
          <h3>No RFIs found</h3>
          <p>Create a new RFI or adjust your filters.</p>
        </div>
      }

      @if (filteredRfis().length > 0) {
        <div class="detail-card" style="padding: 0; overflow: auto;">
          <table class="data-table rfi-table">
            <thead>
              <tr>
                <th matTooltip="Unique RFI reference number">Reference</th>
                <th matTooltip="AGSA-assigned RFI/COMAF number">AGSA Ref</th>
                <th matTooltip="Subject line of the RFI" class="subject-col">Subject</th>
                <th matTooltip="Priority level: High, Medium, or Low">Priority</th>
                <th matTooltip="Current status in the RFI pipeline">Status</th>
                <th matTooltip="Person responsible for responding">Assigned To</th>
                <th matTooltip="Response deadline for this RFI">Due Date</th>
                <th matTooltip="Escalation level if the RFI has been escalated">Escalation</th>
              </tr>
            </thead>
            <tbody>
              @for (rfi of filteredRfis(); track rfi.id) {
                <tr (click)="toggleExpand(rfi.id)" style="cursor: pointer;" [class.overdue-row]="isOverdue(rfi)" matTooltip="Click to view response thread">
                  <td><span class="mscoa-tag">{{ rfi.reference }}</span></td>
                  <td class="ext-ref-cell">{{ rfi.externalReference || '—' }}</td>
                  <td class="subject-col">{{ rfi.subject }}</td>
                  <td><span class="priority-badge" [class]="rfi.priority.toLowerCase()" [matTooltip]="'Priority: ' + rfi.priority">{{ rfi.priority }}</span></td>
                  <td><span class="status-badge" [class]="getStatusClass(rfi.status)" [matTooltip]="'Status: ' + rfi.status">{{ rfi.status }}</span></td>
                  <td>{{ rfi.assignedTo || '—' }}</td>
                  <td [class.overdue-text]="isOverdue(rfi)" [matTooltip]="isOverdue(rfi) ? 'This RFI is overdue' : 'Due date for response'">{{ rfi.dueDate | date:'mediumDate' }}</td>
                  <td>
                    @if (rfi.escalationLevel > 0) {
                      <span class="status-badge escalated" [matTooltip]="'Escalated to level ' + rfi.escalationLevel">Level {{ rfi.escalationLevel }}</span>
                    } @else {
                      <span style="color: var(--platinum-text-muted);" matTooltip="Not escalated">—</span>
                    }
                  </td>
                </tr>
                @if (expandedId() === rfi.id) {
                  <tr>
                    <td colspan="8" class="expanded-row">
                      <div class="response-thread">
                        <div class="expanded-header">
                          <div class="rfi-description">
                            <h4>Description</h4>
                            <p>{{ rfi.description }}</p>
                          </div>
                          @if (canUpdateRfi(rfi)) {
                          <div class="status-control" (click)="$event.stopPropagation()">
                            <label class="status-control-label">Status</label>
                            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="status-select">
                              <mat-select [value]="rfi.status" (selectionChange)="updateRfiStatus(rfi, $event.value)" [disabled]="rfi.status === 'closed'">
                                <mat-option value="open">Open</mat-option>
                                <mat-option value="responded">Responded</mat-option>
                                <mat-option value="escalated">Escalated</mat-option>
                                @if (rfi.status === 'closed') {
                                  <mat-option value="closed">Closed</mat-option>
                                }
                              </mat-select>
                            </mat-form-field>
                            @if (statusUpdating()) {
                              <span class="status-saving">Saving...</span>
                            }
                          </div>
                          }
                        </div>

                        @if (rfi.responses && rfi.responses.length > 0) {
                          <h4>Response Thread ({{ rfi.responses.length }})</h4>
                          <div class="responses-list">
                            @for (resp of rfi.responses; track resp.id) {
                              <div class="response-item" [matTooltip]="'Response by ' + resp.respondedBy">
                                <div class="response-header">
                                  <span class="response-by">{{ resp.respondedBy }}</span>
                                  <span class="response-type status-badge" [class]="resp.responseType.toLowerCase()" [matTooltip]="'Response type: ' + resp.responseType">{{ resp.responseType }}</span>
                                  @if (resp.reviewStatus === 'pending') {
                                    <span class="review-badge pending" matTooltip="This response is pending supervisor review">Pending Review</span>
                                  } @else if (resp.reviewStatus === 'approved') {
                                    <span class="review-badge approved" matTooltip="This response has been approved">Approved</span>
                                  } @else if (resp.reviewStatus === 'rejected') {
                                    <span class="review-badge rejected" matTooltip="This response has been rejected">Rejected</span>
                                  }
                                  <span class="response-date">{{ resp.createdAt | date:'short' }}</span>
                                </div>
                                <div class="response-content">{{ resp.content }}</div>
                                @if (resp.attachmentIds && resp.attachmentIds.length > 0) {
                                  <div class="response-attachments">
                                    <mat-icon style="font-size: 14px; width: 14px; height: 14px; color: var(--platinum-text-muted);">attach_file</mat-icon>
                                    <span style="font-size: 11px; color: var(--platinum-text-muted);">{{ resp.attachmentIds.length }} attachment(s)</span>
                                  </div>
                                }
                                @if (resp.reviewStatus === 'pending') {
                                  <div class="review-actions">
                                    <button mat-stroked-button color="primary" (click)="reviewResponse(rfi.id, resp.id, 'approved'); $event.stopPropagation()">
                                      <mat-icon>check_circle</mat-icon> Approve
                                    </button>
                                    <button mat-stroked-button color="warn" (click)="reviewResponse(rfi.id, resp.id, 'rejected'); $event.stopPropagation()">
                                      <mat-icon>cancel</mat-icon> Reject
                                    </button>
                                  </div>
                                }
                              </div>
                            }
                          </div>
                        } @else {
                          <div class="empty-detail">No responses yet.</div>
                        }

                        @if (canUpdateRfi(rfi)) {
                        <div class="composer-section" (click)="$event.stopPropagation()">
                          <h4><mat-icon style="vertical-align: middle; margin-right: 4px; font-size: 18px; width: 18px; height: 18px;">reply</mat-icon> Add Response</h4>
                          <div class="composer-form">
                            <textarea
                              class="composer-textarea"
                              [(ngModel)]="responseText"
                              placeholder="Type your response here..."
                              rows="4"
                            ></textarea>

                            <div class="composer-actions">
                              <button
                                mat-flat-button
                                class="btn-primary"
                                [disabled]="!responseText.trim() || responseSubmitting()"
                                (click)="submitResponse(rfi)"
                              >
                                @if (responseSubmitting()) {
                                  <mat-icon class="spin-icon">sync</mat-icon> Submitting...
                                } @else {
                                  <mat-icon>send</mat-icon> Submit Response
                                }
                              </button>
                              <button
                                mat-stroked-button
                                [disabled]="responseSubmitting()"
                                (click)="cancelResponse()"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                        }

                        <div class="attachments-section" (click)="$event.stopPropagation()">
                          <div class="attachments-header">
                            <h4>
                              <mat-icon style="vertical-align: middle; margin-right: 4px; font-size: 18px; width: 18px; height: 18px;">attach_file</mat-icon>
                              Attachments ({{ rfiDocuments().get(rfi.id)?.length || 0 }})
                            </h4>
                            <div style="display: flex; gap: 8px;">
                              <button mat-stroked-button (click)="linkDocToRfi(rfi.id); $event.stopPropagation()" matTooltip="Link an existing document">
                                <mat-icon>link</mat-icon> Link Existing
                              </button>
                            </div>
                          </div>

                          <div
                            class="drop-zone"
                            [class.drop-zone-active]="isDragging()"
                            (dragover)="onDragOver($event)"
                            (dragleave)="onDragLeave($event)"
                            (drop)="onDrop($event, rfi.id)"
                            (click)="attachFileInput.click()"
                          >
                            <input
                              type="file"
                              multiple
                              #attachFileInput
                              style="display: none;"
                              (change)="onAttachFilesSelected($event, rfi.id)"
                            >
                            <mat-icon class="drop-zone-icon">cloud_upload</mat-icon>
                            <div class="drop-zone-text">
                              @if (isDragging()) {
                                Drop files here
                              } @else {
                                Drag & drop emails and documents here, or click to browse
                              }
                            </div>
                            <div class="drop-zone-hint">PDF, Word, Excel, Email (.msg/.eml), Images — up to 100 MB each</div>
                          </div>

                          @if (attachUploadingFiles.length > 0) {
                            <div class="pending-files-list">
                              @for (f of attachUploadingFiles; track f.name; let i = $index) {
                                <div class="pending-file-row">
                                  <mat-icon class="file-type-icon">{{ getFileIcon(f.name) }}</mat-icon>
                                  <span class="pending-file-name">{{ f.name }}</span>
                                  <span class="pending-file-size">{{ formatFileSize(f.size) }}</span>
                                  @if (attachFileProgress[i] >= 100) {
                                    <mat-icon class="file-done-icon">check_circle</mat-icon>
                                  } @else if (attachFileProgress[i] === -1) {
                                    <mat-icon style="color: var(--red-600, #dc2626);">error</mat-icon>
                                  } @else {
                                    <span class="file-progress-pct">{{ attachFileProgress[i] || 0 }}%</span>
                                  }
                                </div>
                                @if (attachFileProgress[i] >= 0 && attachFileProgress[i] < 100) {
                                  <div class="file-progress-bar">
                                    <div class="file-progress-fill" [style.width.%]="attachFileProgress[i]"></div>
                                  </div>
                                }
                              }
                            </div>
                          }

                          @if (rfiDocuments().get(rfi.id)?.length) {
                            <div class="responses-list">
                              @for (doc of rfiDocuments().get(rfi.id)!; track doc.id) {
                                <div class="response-item" style="display: flex; align-items: center; gap: 12px;">
                                  <mat-icon style="color: var(--platinum-text-muted);">{{ getFileIcon(doc.originalName || doc.fileName) }}</mat-icon>
                                  <div style="flex: 1;">
                                    <div style="font-size: 13px; font-weight: 500;">{{ doc.originalName || doc.fileName }}</div>
                                    <div style="font-size: 11px; color: var(--platinum-text-muted);">{{ formatFileSize(doc.fileSize) }} · {{ doc.createdAt | date:'shortDate' }}</div>
                                  </div>
                                  <button mat-icon-button matTooltip="Download" (click)="downloadDoc(doc.id); $event.stopPropagation()">
                                    <mat-icon>download</mat-icon>
                                  </button>
                                </div>
                              }
                            </div>
                          } @else if (attachUploadingFiles.length === 0) {
                            <div class="empty-detail">No attachments yet.</div>
                          }
                        </div>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styleUrl: './rfis.component.css',
})
export class RfisComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private dms = inject(DocumentManagementService);

  rfis = signal<Rfi[]>([]);
  loading = signal(false);
  expandedId = signal<string | null>(null);
  rfiDocuments = signal<Map<string, DmsDocument[]>>(new Map());
  statusFilter = 'All';
  searchQuery = '';

  responseText = '';
  responseSubmitting = signal(false);
  isDragging = signal(false);
  statusUpdating = signal(false);

  attachUploadingFiles: File[] = [];
  attachFileProgress: number[] = [];

  overdueCount = computed(() => this.rfis().filter(r => this.isOverdue(r)).length);

  filteredRfis = computed(() => {
    let list = this.rfis();
    if (this.statusFilter !== 'All') {
      list = list.filter(r => r.status === this.statusFilter);
    }
    const q = this.searchQuery.toLowerCase();
    if (q) {
      list = list.filter(r =>
        r.subject.toLowerCase().includes(q) ||
        r.reference.toLowerCase().includes(q) ||
        (r.externalReference && r.externalReference.toLowerCase().includes(q))
      );
    }
    return list;
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.api.get<Rfi[]>('/rfis').subscribe({
      next: (data) => {
        this.rfis.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  refreshSingleRfi(rfiId: string) {
    this.api.get<any>(`/rfis/${rfiId}`).subscribe({
      next: (updated) => {
        const list = this.rfis().map(r => r.id === rfiId ? updated : r);
        this.rfis.set(list);
        this.loadRfiDocuments(rfiId);
      },
    });
  }

  countByStatus(status: string): number {
    return this.rfis().filter(r => r.status === status).length;
  }

  isOverdue(rfi: Rfi): boolean {
    if (rfi.status === 'Closed' || rfi.status === 'Responded') return false;
    if (!rfi.dueDate) return false;
    return new Date(rfi.dueDate) < new Date();
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '_');
  }

  toggleExpand(id: string) {
    const newId = this.expandedId() === id ? null : id;
    this.expandedId.set(newId);
    if (newId) {
      this.cancelResponse();
      this.loadRfiDocuments(newId);
    }
  }

  openCreateDialog() {
    const ref = this.dialog.open(CreateRfiDialogComponent, {
      width: '560px',
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadData();
    });
  }

  loadRfiDocuments(rfiId: string) {
    this.dms.getByContext('rfi', rfiId).subscribe({
      next: (docs) => {
        const map = new Map(this.rfiDocuments());
        map.set(rfiId, docs);
        this.rfiDocuments.set(map);
      },
      error: () => {},
    });
  }

  uploadDocForRfi(rfiId: string) {
    const ref = this.dialog.open(DocumentUploadDialogComponent, {
      width: '600px',
      data: { contextType: 'rfi', contextId: rfiId, preselectedType: 'rfi_attachment' },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadRfiDocuments(rfiId);
    });
  }

  linkDocToRfi(rfiId: string) {
    const ref = this.dialog.open(DocumentPickerComponent, {
      width: '640px',
      data: { multiple: true, documentType: 'rfi_attachment' },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadRfiDocuments(rfiId);
    });
  }

  downloadDoc(docId: string) {
    window.open(`/api/documents/${docId}/download`, '_blank');
  }

  reviewResponse(rfiId: string, responseId: string, status: 'approved' | 'rejected') {
    this.api.put(`/rfis/${rfiId}/responses/${responseId}/review`, { status, reviewedBy: 'current-user' }).subscribe({
      next: (updatedRfi: any) => {
        const list = this.rfis().map(r => r.id === rfiId ? updatedRfi : r);
        this.rfis.set(list);
      },
    });
  }

  canUpdateRfi(rfi: any): boolean {
    const user = this.auth.user();
    if (!user) return false;
    if (this.auth.hasAnyRole('admin', 'SYSTEM_ADMIN')) return true;
    return rfi.requestedBy === user.id || rfi.assignedTo === user.id;
  }

  updateRfiStatus(rfi: any, newStatus: string) {
    if (rfi.status === newStatus) return;
    this.statusUpdating.set(true);
    this.api.put<any>(`/rfis/${rfi.id}`, { status: newStatus }).subscribe({
      next: () => {
        this.statusUpdating.set(false);
        this.refreshSingleRfi(rfi.id);
      },
      error: () => this.statusUpdating.set(false),
    });
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

  onDrop(event: DragEvent, rfiId: string) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.uploadAttachmentsImmediately(Array.from(event.dataTransfer.files), rfiId);
    }
  }

  onAttachFilesSelected(event: Event, rfiId: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadAttachmentsImmediately(Array.from(input.files), rfiId);
    }
    input.value = '';
  }

  private uploadAttachmentsImmediately(files: File[], rfiId: string) {
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
        this.loadRfiDocuments(rfiId);
      }
    };

    files.forEach((file, i) => {
      const idx = startIdx + i;
      const fd = new FormData();
      fd.append('file', file);
      this.api.uploadWithProgress(`/rfis/${rfiId}/attachments`, fd).subscribe({
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

  cancelResponse() {
    this.responseText = '';
  }

  submitResponse(rfi: any) {
    if (this.responseSubmitting()) return;
    const text = this.responseText.trim();
    if (!text) return;
    this.postResponse(rfi, text, []);
  }

  private postResponse(rfi: any, text: string, attachmentIds: string[]) {
    this.responseSubmitting.set(true);
    const body: any = { content: text };
    if (attachmentIds.length > 0) body.attachmentIds = attachmentIds;

    this.api.post<any>(`/rfis/${rfi.id}/respond`, body).subscribe({
      next: (updated) => {
        const list = this.rfis().map(r => r.id === rfi.id ? updated : r);
        this.rfis.set(list);
        this.cancelResponse();
        this.responseSubmitting.set(false);
        this.loadRfiDocuments(rfi.id);
      },
      error: () => {
        this.responseSubmitting.set(false);
      },
    });
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

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
