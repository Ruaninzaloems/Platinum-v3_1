import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { ApiService } from '../../core/services/api.service';
import { Rfi } from '../../core/models/interfaces';
import { DocumentManagementService, DmsDocument } from '../document-management/document-management.service';
import { DocumentUploadDialogComponent } from '../document-management/document-upload-dialog.component';
import { DocumentPickerComponent } from '../document-management/document-picker.component';

@Component({
  selector: 'app-create-rfi-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDialogModule, MatIconModule, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './rfis.component.html',
})
export class CreateRfiDialogComponent {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private dms = inject(DocumentManagementService);
  data: any = { subject: '', description: '', priority: 'Medium', assignedTo: '', dueDate: null, externalReference: '' };
  pendingFiles: File[] = [];
  uploading = false;

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.pendingFiles.push(...Array.from(input.files));
    }
  }

  removePendingFile(file: File) {
    this.pendingFiles = this.pendingFiles.filter(f => f !== file);
  }

  save() {
    this.uploading = true;
    this.api.post<Rfi>('/rfis', this.data).subscribe({
      next: (rfi) => {
        if (this.pendingFiles.length > 0) {
          let uploaded = 0;
          for (const file of this.pendingFiles) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('contextType', 'rfi');
            formData.append('contextId', rfi.id);
            formData.append('documentType', 'rfi_attachment');
            this.api.post('/documents/upload', formData).subscribe({
              next: () => {
                uploaded++;
                if (uploaded === this.pendingFiles.length) {
                  this.uploading = false;
                  const ref = this.dialog.openDialogs.find(d => d.componentInstance === this);
                  ref?.close(true);
                }
              },
              error: () => {
                uploaded++;
                if (uploaded === this.pendingFiles.length) {
                  this.uploading = false;
                  const ref = this.dialog.openDialogs.find(d => d.componentInstance === this);
                  ref?.close(true);
                }
              },
            });
          }
        } else {
          this.uploading = false;
          const ref = this.dialog.openDialogs.find(d => d.componentInstance === this);
          ref?.close(true);
        }
      },
      error: () => { this.uploading = false; },
    });
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
                        <div class="rfi-description">
                          <h4>Description</h4>
                          <p>{{ rfi.description }}</p>
                        </div>
                        @if (rfi.responses && rfi.responses.length > 0) {
                          <h4>Response Thread</h4>
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

                        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--platinum-border);">
                          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <h4 style="margin: 0;">
                              <mat-icon style="vertical-align: middle; margin-right: 4px; font-size: 18px; width: 18px; height: 18px;">attach_file</mat-icon>
                              Attachments ({{ rfiDocuments().get(rfi.id)?.length || 0 }})
                            </h4>
                            <div style="display: flex; gap: 8px;">
                              <button mat-stroked-button (click)="uploadDocForRfi(rfi.id); $event.stopPropagation()" matTooltip="Upload a new attachment">
                                <mat-icon>cloud_upload</mat-icon> Upload
                              </button>
                              <button mat-stroked-button (click)="linkDocToRfi(rfi.id); $event.stopPropagation()" matTooltip="Link an existing document">
                                <mat-icon>link</mat-icon> Link Existing
                              </button>
                            </div>
                          </div>
                          @if (rfiDocuments().get(rfi.id)?.length) {
                            <div class="responses-list">
                              @for (doc of rfiDocuments().get(rfi.id)!; track doc.id) {
                                <div class="response-item" style="display: flex; align-items: center; gap: 12px;">
                                  <mat-icon style="color: var(--platinum-text-muted);">insert_drive_file</mat-icon>
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
                          } @else {
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
  private dialog = inject(MatDialog);
  private dms = inject(DocumentManagementService);

  rfis = signal<Rfi[]>([]);
  loading = signal(false);
  expandedId = signal<string | null>(null);
  rfiDocuments = signal<Map<string, DmsDocument[]>>(new Map());
  statusFilter = 'All';
  searchQuery = '';

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
    if (newId && !this.rfiDocuments().has(newId)) {
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

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
