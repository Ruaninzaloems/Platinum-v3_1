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
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { WorkingPaper, Compilation } from '../../core/models/interfaces';
import { DocumentManagementService, DmsDocument } from '../document-management/document-management.service';
import { DocumentUploadDialogComponent } from '../document-management/document-upload-dialog.component';
import { DocumentPickerComponent } from '../document-management/document-picker.component';

@Component({
  selector: 'app-create-working-paper-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDialogModule, MatIconModule],
  templateUrl: './working-papers.component.html',
})
export class CreateWorkingPaperDialogComponent {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  compilations = signal<Compilation[]>([]);
  data = { title: '', description: '', compilationId: '', section: '' };

  constructor() {
    this.api.get<Compilation[]>('/compilations').subscribe({
      next: (c) => this.compilations.set(c),
    });
  }

  save() {
    this.api.post<WorkingPaper>('/working-papers', this.data).subscribe({
      next: () => {
        const ref = this.dialog.openDialogs.find(d => d.componentInstance === this);
        ref?.close(true);
      },
    });
  }
}

@Component({
  selector: 'app-working-papers',
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
    MatExpansionModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Working Papers</h1>
          <div class="subtitle">Audit working paper management</div>
        </div>
        <div class="page-actions">
          <button mat-flat-button class="btn-primary" (click)="openCreateDialog()" matTooltip="Create a new audit working paper">
            <mat-icon>add</mat-icon>
            New Working Paper
          </button>
        </div>
      </div>

      <div class="summary-strip">
        <div class="kpi-card" matTooltip="Total number of working papers in this engagement">
          <div class="kpi-label">Total</div>
          <div class="kpi-value">{{ workingPapers().length }}</div>
        </div>
        <div class="kpi-card" matTooltip="Working papers that have not been started yet">
          <div class="kpi-label">Not Started</div>
          <div class="kpi-value">{{ countByStatus('Not Started') }}</div>
        </div>
        <div class="kpi-card" matTooltip="Working papers currently being prepared">
          <div class="kpi-label">In Progress</div>
          <div class="kpi-value">{{ countByStatus('In Progress') }}</div>
        </div>
        <div class="kpi-card" matTooltip="Working papers that have been reviewed and signed off">
          <div class="kpi-label">Signed Off</div>
          <div class="kpi-value">{{ countByStatus('Signed Off') }}</div>
        </div>
      </div>

      <div class="filters-bar">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" style="width: 180px;" matTooltip="Filter working papers by status: Not Started, In Progress, Review, or Signed Off">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="statusFilter" (ngModelChange)="statusFilter = $event">
            <mat-option value="All">All Statuses</mat-option>
            <mat-option value="Not Started">Not Started</mat-option>
            <mat-option value="In Progress">In Progress</mat-option>
            <mat-option value="Review">Review</mat-option>
            <mat-option value="Signed Off">Signed Off</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" style="flex: 1; min-width: 200px;" matTooltip="Search by title or reference number">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput placeholder="Search working papers..." [(ngModel)]="searchQuery">
        </mat-form-field>
      </div>

      @if (filteredPapers().length === 0 && !loading()) {
        <div class="empty-state">
          <mat-icon>description</mat-icon>
          <h3>No working papers found</h3>
          <p>Create a new working paper or adjust your filters.</p>
        </div>
      }

      @if (filteredPapers().length > 0) {
        <div class="detail-card" style="padding: 0; overflow: hidden;">
          <table class="data-table">
            <thead>
              <tr>
                <th matTooltip="Unique working paper reference number">Reference</th>
                <th matTooltip="Working paper title and description">Title</th>
                <th matTooltip="Current workflow status of the working paper">Status</th>
                <th matTooltip="Team member assigned to this working paper">Assigned To</th>
                <th matTooltip="Person who prepared the working paper">Prepared By</th>
                <th matTooltip="Reviewer who signed off the working paper">Reviewed By</th>
              </tr>
            </thead>
            <tbody>
              @for (wp of filteredPapers(); track wp.id) {
                <tr (click)="toggleExpand(wp.id)" style="cursor: pointer;" matTooltip="Click to expand tickmarks and entries">
                  <td><span class="mscoa-tag">{{ wp.reference }}</span></td>
                  <td>{{ wp.title }}</td>
                  <td><span class="status-badge" [class]="getStatusClass(wp.status)" [matTooltip]="'Status: ' + wp.status">{{ wp.status }}</span></td>
                  <td>{{ wp.assignedTo || '—' }}</td>
                  <td>{{ wp.preparedBy || '—' }}</td>
                  <td>{{ wp.reviewedBy || '—' }}</td>
                </tr>
                @if (expandedId() === wp.id) {
                  <tr>
                    <td colspan="6" class="expanded-row">
                      <mat-accordion>
                        <mat-expansion-panel [expanded]="true" hideToggle>
                          <mat-expansion-panel-header>
                            <mat-panel-title>Tickmarks & Entries</mat-panel-title>
                          </mat-expansion-panel-header>
                          <div class="detail-sections">
                            @if (wp.tickmarks && wp.tickmarks.length > 0) {
                              <div class="detail-section">
                                <h4>Tickmarks</h4>
                                <div class="tickmarks-list">
                                  @for (tm of wp.tickmarks; track tm.symbol) {
                                    <span class="tickmark-badge" [style.background]="getTickmarkColor(tm.symbol)" [matTooltip]="'Tickmark: ' + tm.symbol + ' — ' + tm.meaning">
                                      <span class="tickmark-symbol">{{ tm.symbol }}</span>
                                      <span class="tickmark-meaning">{{ tm.meaning }}</span>
                                    </span>
                                  }
                                </div>
                              </div>
                            }
                            @if (wp.entries && wp.entries.length > 0) {
                              <div class="detail-section">
                                <h4>Entries</h4>
                                <div class="entries-list">
                                  @for (entry of wp.entries; track entry.id) {
                                    <div class="entry-item" [matTooltip]="'Entry type: ' + entry.entryType">
                                      <div class="entry-header">
                                        <span class="entry-type">{{ entry.entryType }}</span>
                                        @if (entry.tickmark) {
                                          <span class="tickmark-badge small" [style.background]="getTickmarkColor(entry.tickmark)" [matTooltip]="'Applied tickmark: ' + entry.tickmark">{{ entry.tickmark }}</span>
                                        }
                                        @if (entry.reference) {
                                          <span class="mscoa-tag" matTooltip="Cross-reference to source document">{{ entry.reference }}</span>
                                        }
                                        @if (entry.amount !== undefined && entry.amount !== null) {
                                          <span class="amount" matTooltip="Monetary amount for this entry">{{ entry.amount | number:'1.2-2' }}</span>
                                        }
                                      </div>
                                      <div class="entry-content">{{ entry.content }}</div>
                                      <div class="entry-meta">{{ entry.createdBy }} · {{ entry.createdAt | date:'short' }}</div>
                                    </div>
                                  }
                                </div>
                              </div>
                            }
                            @if ((!wp.tickmarks || wp.tickmarks.length === 0) && (!wp.entries || wp.entries.length === 0)) {
                              <div class="empty-detail">No tickmarks or entries yet.</div>
                            }
                          </div>
                        </mat-expansion-panel>
                        <mat-expansion-panel hideToggle>
                          <mat-expansion-panel-header>
                            <mat-panel-title>
                              <mat-icon style="margin-right: 8px; font-size: 18px; width: 18px; height: 18px;">attach_file</mat-icon>
                              Supporting Documents ({{ wpDocuments().get(wp.id)?.length || 0 }})
                            </mat-panel-title>
                          </mat-expansion-panel-header>
                          <div class="detail-sections">
                            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                              <button mat-stroked-button (click)="uploadDocForWp(wp.id); $event.stopPropagation()" matTooltip="Upload a new supporting document">
                                <mat-icon>cloud_upload</mat-icon> Upload
                              </button>
                              <button mat-stroked-button (click)="linkDocToWp(wp.id); $event.stopPropagation()" matTooltip="Link an existing document from the DMS">
                                <mat-icon>link</mat-icon> Link Existing
                              </button>
                            </div>
                            @if (wpDocuments().get(wp.id)?.length) {
                              <div class="entries-list">
                                @for (doc of wpDocuments().get(wp.id)!; track doc.id) {
                                  <div class="entry-item" style="display: flex; align-items: center; gap: 12px;">
                                    <mat-icon style="color: var(--platinum-text-muted);">insert_drive_file</mat-icon>
                                    <div style="flex: 1;">
                                      <div style="font-size: 13px; font-weight: 500;">{{ doc.originalName || doc.fileName }}</div>
                                      <div style="font-size: 11px; color: var(--platinum-text-muted);">{{ doc.documentType || 'working_paper' }} · {{ formatFileSize(doc.fileSize) }} · {{ doc.createdAt | date:'shortDate' }}</div>
                                    </div>
                                    <button mat-icon-button matTooltip="Download document" (click)="downloadDoc(doc.id); $event.stopPropagation()">
                                      <mat-icon>download</mat-icon>
                                    </button>
                                  </div>
                                }
                              </div>
                            } @else {
                              <div class="empty-detail">No supporting documents attached.</div>
                            }
                          </div>
                        </mat-expansion-panel>
                      </mat-accordion>
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
  styleUrl: './working-papers.component.css',
})
export class WorkingPapersComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private dms = inject(DocumentManagementService);

  workingPapers = signal<WorkingPaper[]>([]);
  loading = signal(false);
  expandedId = signal<string | null>(null);
  wpDocuments = signal<Map<string, DmsDocument[]>>(new Map());
  statusFilter = 'All';
  searchQuery = '';

  private tickmarkColors: Record<string, string> = {
    '✓': '#10b981', '✗': '#ef4444', '◆': '#3b82f6', '●': '#8b5cf6',
    '▲': '#f59e0b', '■': '#0d9488', '★': '#c9a84c', '†': '#6366f1',
  };

  filteredPapers = computed(() => {
    let list = this.workingPapers();
    if (this.statusFilter !== 'All') {
      list = list.filter(wp => wp.status === this.statusFilter);
    }
    const q = this.searchQuery.toLowerCase();
    if (q) {
      list = list.filter(wp =>
        wp.title.toLowerCase().includes(q) ||
        wp.reference.toLowerCase().includes(q)
      );
    }
    return list;
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.api.get<WorkingPaper[]>('/working-papers').subscribe({
      next: (data) => {
        this.workingPapers.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  countByStatus(status: string): number {
    return this.workingPapers().filter(wp => wp.status === status).length;
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '_');
  }

  getTickmarkColor(symbol: string): string {
    return this.tickmarkColors[symbol] || '#64748b';
  }

  toggleExpand(id: string) {
    const newId = this.expandedId() === id ? null : id;
    this.expandedId.set(newId);
    if (newId && !this.wpDocuments().has(newId)) {
      this.loadWpDocuments(newId);
    }
  }

  openCreateDialog() {
    const ref = this.dialog.open(CreateWorkingPaperDialogComponent, {
      width: '560px',
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadData();
    });
  }

  loadWpDocuments(wpId: string) {
    this.dms.getByContext('working_paper', wpId).subscribe({
      next: (docs) => {
        const map = new Map(this.wpDocuments());
        map.set(wpId, docs);
        this.wpDocuments.set(map);
      },
      error: () => {},
    });
  }

  uploadDocForWp(wpId: string) {
    const ref = this.dialog.open(DocumentUploadDialogComponent, {
      width: '600px',
      data: { contextType: 'working_paper', contextId: wpId, preselectedType: 'working_paper' },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadWpDocuments(wpId);
    });
  }

  linkDocToWp(wpId: string) {
    const ref = this.dialog.open(DocumentPickerComponent, {
      width: '640px',
      data: { multiple: true, documentType: 'working_paper' },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadWpDocuments(wpId);
    });
  }

  downloadDoc(docId: string) {
    window.open(`/api/documents/${docId}/download`, '_blank');
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
