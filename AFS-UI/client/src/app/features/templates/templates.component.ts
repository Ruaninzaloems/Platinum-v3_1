import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AfsTemplate, FinancialYear } from '../../core/models/interfaces';

@Component({
  selector: 'app-apply-template-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDialogModule, MatTooltipModule, MatProgressSpinnerModule,
    MatIconModule, MatChipsModule,
  ],
  templateUrl: './templates.component.html',
  styleUrl: './templates.component.css',
})
export class ApplyTemplateDialogComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private dialogRef = inject(MatDialogRef<ApplyTemplateDialogComponent>);

  data: { template: AfsTemplate } = inject(MAT_DIALOG_DATA);
  financialYears: FinancialYear[] = [];
  selectedFyId = '';
  applying = false;
  errorMessage = '';
  preview: any = null;
  loadingPreview = false;
  previewError = '';
  isAdmin = false;
  tenants: any[] = [];
  selectedTenantId = '';

  ngOnInit() {
    const user = this.auth.user();
    const roles: string[] = (user as any)?.roles || [];
    this.isAdmin = roles.includes('SYSTEM_ADMIN');
    this.selectedTenantId = user?.tenantId || '';

    if (this.isAdmin) {
      this.api.get<any[]>('/admin/tenants').subscribe({
        next: (tenants) => {
          this.tenants = tenants;
          if (!this.selectedTenantId && tenants.length > 0) {
            this.selectedTenantId = tenants[0].id;
          }
          this.loadFinancialYears();
        },
      });
    } else {
      this.loadFinancialYears();
    }
  }

  private loadFinancialYears() {
    const tenantId = this.selectedTenantId || this.auth.user()?.tenantId || '';
    this.api.get<FinancialYear[]>(`/admin/financial-years?tenantId=${tenantId}`).subscribe({
      next: (fys) => {
        this.financialYears = fys;
        const current = fys.find(fy => fy.isCurrent);
        if (current) {
          this.selectedFyId = current.id;
          this.loadPreview();
        }
      },
    });
  }

  onTenantChange() {
    this.selectedFyId = '';
    this.preview = null;
    this.loadFinancialYears();
  }

  onFyChange() {
    if (this.selectedFyId) {
      this.loadPreview();
    }
  }

  loadPreview() {
    this.loadingPreview = true;
    this.previewError = '';
    const tenantParam = this.isAdmin && this.selectedTenantId ? `tenantId=${this.selectedTenantId}&` : '';
    const fyParam = this.selectedFyId ? `financialYearId=${this.selectedFyId}` : '';
    this.api.get<any>(`/templates/${this.data.template.id}/preview-apply?${tenantParam}${fyParam}`).subscribe({
      next: (data) => {
        this.preview = data;
        this.loadingPreview = false;
      },
      error: (err) => {
        this.loadingPreview = false;
        this.previewError = err?.error?.message || 'Failed to load impact preview';
      },
    });
  }

  apply() {
    this.applying = true;
    this.errorMessage = '';
    const tenantId = this.isAdmin && this.selectedTenantId ? this.selectedTenantId : (this.auth.user()?.tenantId || '');
    this.api.post<AfsTemplate>(`/templates/${this.data.template.id}/apply`, {
      tenantId,
      financialYearId: this.selectedFyId,
    }).subscribe({
      next: (result) => {
        this.applying = false;
        this.dialogRef.close(result);
      },
      error: (err) => {
        this.applying = false;
        this.errorMessage = err?.error?.message || 'Failed to apply template';
      },
    });
  }
}

@Component({
  selector: 'app-create-template-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDialogModule, MatTooltipModule],
  template: `
    <h2 mat-dialog-title>Create Template</h2>
    <mat-dialog-content>
      <div class="form-grid">
        <mat-form-field matTooltip="Enter a name for this template">
          <mat-label>Name</mat-label>
          <input matInput [(ngModel)]="data.name" placeholder="e.g. GRAP AFS Template">
        </mat-form-field>
        <mat-form-field matTooltip="Select the template type">
          <mat-label>Type</mat-label>
          <mat-select [(ngModel)]="data.type">
            <mat-option value="Consolidated">Consolidated</mat-option>
            <mat-option value="GRAP">GRAP</mat-option>
            <mat-option value="IFRS">IFRS</mat-option>
            <mat-option value="Custom">Custom</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field matTooltip="Enter a description for this template">
          <mat-label>Description</mat-label>
          <textarea matInput [(ngModel)]="data.description" rows="3" placeholder="Template description..."></textarea>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close matTooltip="Cancel and close this dialog">Cancel</button>
      <button mat-flat-button class="btn-primary" [disabled]="!data.name || !data.type" (click)="save()" matTooltip="Create the new template">Create</button>
    </mat-dialog-actions>
  `
})
export class CreateTemplateDialogComponent {
  private api = inject(ApiService);
  private dialogRef = inject(MatDialogRef<CreateTemplateDialogComponent>);

  data = { name: '', type: '', description: '' };

  save() {
    this.api.post<AfsTemplate>('/templates', this.data).subscribe(t => this.dialogRef.close(t));
  }
}

@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Template Library</h1>
          <div class="subtitle">GRAP-compliant AFS templates</div>
        </div>
        <div class="page-actions">
          @if (isSystemAdmin()) {
            <button mat-flat-button class="btn-gold" (click)="seedTemplates()" [disabled]="seeding()" matTooltip="Download and seed National Treasury specimen templates into the library">
              <mat-icon>cloud_download</mat-icon>
              {{ seeding() ? 'Seeding...' : 'Seed NT Specimen' }}
            </button>
            <button mat-flat-button class="btn-gold" (click)="seedGrapTemplates()" [disabled]="seedingGrap()" matTooltip="Seed GRAP-compliant template into the library">
              <mat-icon>cloud_download</mat-icon>
              {{ seedingGrap() ? 'Seeding...' : 'Seed GRAP Template' }}
            </button>
          }
          <button mat-flat-button class="btn-primary" (click)="openCreateDialog()" matTooltip="Create a new custom template">
            <mat-icon>add</mat-icon>
            Create Template
          </button>
        </div>
      </div>

      <div class="filters-bar">
        <mat-button-toggle-group [value]="typeFilter()" (change)="typeFilter.set($event.value)" hideSingleSelectionIndicator>
          <mat-button-toggle value="All" matTooltip="Show all template types">All</mat-button-toggle>
          <mat-button-toggle value="Consolidated" matTooltip="Filter templates by AFS type: Consolidated">Consolidated</mat-button-toggle>
          <mat-button-toggle value="Water" matTooltip="Filter templates by AFS type: Water and Sanitation">Water</mat-button-toggle>
          <mat-button-toggle value="Energy" matTooltip="Filter templates by AFS type: Energy Sources">Energy</mat-button-toggle>
          <mat-button-toggle value="GRAP" matTooltip="Filter templates by AFS type: GRAP">GRAP</mat-button-toggle>
          <mat-button-toggle value="IFRS" matTooltip="Filter templates by AFS type: IFRS">IFRS</mat-button-toggle>
        </mat-button-toggle-group>
        <mat-form-field appearance="outline" subscriptSizing="dynamic" style="flex: 1; min-width: 200px;" matTooltip="Search templates by name">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput placeholder="Search templates..." [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)">
        </mat-form-field>
      </div>

      @if (filteredTemplates().length === 0 && !loading()) {
        <div class="empty-state" matTooltip="No templates match your current filters. Try seeding NT specimens or adjusting filters.">
          <mat-icon>description</mat-icon>
          <h3>No templates found</h3>
          <p>Seed NT specimen templates or adjust your filters.</p>
        </div>
      }

      <div class="templates-grid">
        @for (template of filteredTemplates(); track template.id) {
          <mat-card class="template-card" (click)="openTemplate(template.id)" matTooltip="Click to view template details and sections">
            <mat-card-content>
              <div class="template-card-header">
                <span class="type-badge" [class]="template.type.toLowerCase()" matTooltip="AFS template type: {{ template.type }}">{{ template.type }}</span>
                <div class="header-actions">
                  @if (template.isSystemDefault) {
                    <span class="system-default-chip" matTooltip="System default template — read-only. Clone to customize.">System Default</span>
                  }
                  <span class="status-badge" [class]="template.status.toLowerCase().replace(' ', '_')" matTooltip="Template status: {{ template.status }}">{{ template.status }}</span>
                  @if (!template.tenantId) {
                    <button mat-icon-button class="apply-btn" (click)="openApplyDialog(template, $event)" matTooltip="Apply this template to your municipality">
                      <mat-icon>playlist_add_check</mat-icon>
                    </button>
                  }
                  @if (template.sourceTemplateId) {
                    <mat-icon class="applied-badge" matTooltip="Applied from master template">verified</mat-icon>
                  }
                  @if (isSystemAdmin() && !template.isSystemDefault) {
                    <button mat-icon-button class="delete-btn" (click)="deleteTemplate(template, $event)" matTooltip="Delete this template">
                      <mat-icon>delete</mat-icon>
                    </button>
                  }
                </div>
              </div>
              <h3 class="template-name">{{ template.name }}</h3>
              <div class="template-meta">
                <div class="meta-item" matTooltip="Template version number">
                  <mat-icon>tag</mat-icon>
                  <span>v{{ template.version }}</span>
                  @if (template.isCurrentVersion) {
                    <span class="current-chip" matTooltip="This is the current active version">Current</span>
                  }
                </div>
                <div class="meta-item" matTooltip="Number of AFS sections in this template">
                  <mat-icon>folder</mat-icon>
                  <span>{{ template.sections?.length || 0 }} sections</span>
                </div>
                <div class="meta-item" matTooltip="Total number of line items across all sections">
                  <mat-icon>list</mat-icon>
                  <span>{{ getLineItemCount(template) }} line items</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [`
    .templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }
    .template-card {
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
      }
      &:hover .delete-btn {
        opacity: 1;
      }
    }
    .template-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .delete-btn, .apply-btn {
      opacity: 0;
      transition: opacity 0.2s;
      color: var(--platinum-text-secondary);
      width: 32px;
      height: 32px;
      line-height: 32px;
      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }
    .delete-btn:hover { color: #dc2626; }
    .apply-btn:hover { color: #16a34a; }
    .template-card:hover .apply-btn { opacity: 1; }
    .applied-badge {
      color: #16a34a;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .system-default-chip {
      display: inline-flex;
      align-items: center;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 8px;
      background: #dbeafe;
      color: #1e40af;
      border-radius: 4px;
      white-space: nowrap;
    }
    .type-badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      &.consolidated { background: #ede9fe; color: #7c3aed; }
      &.water { background: #e0f2fe; color: #0284c7; }
      &.energy { background: #fef3c7; color: #d97706; }
      &.grap { background: #dcfce7; color: #16a34a; }
      &.ifrs { background: #fce7f3; color: #db2777; }
      &.custom { background: #f1f5f9; color: #475569; }
    }
    .template-name {
      font-size: 16px;
      font-weight: 600;
      color: var(--platinum-navy);
      margin-bottom: 12px;
    }
    .template-meta {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--platinum-text-secondary);
      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }
    .current-chip {
      font-size: 9px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 8px;
      background: #dcfce7;
      color: #166534;
      text-transform: uppercase;
    }
  `],
})
export class TemplatesComponent implements OnInit {
  templates = signal<AfsTemplate[]>([]);
  loading = signal(false);
  seeding = signal(false);
  seedingGrap = signal(false);
  typeFilter = signal('All');
  searchQuery = signal('');

  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  isSystemAdmin = computed(() => this.auth.hasRole('SYSTEM_ADMIN'));

  filteredTemplates = computed(() => {
    let list = this.templates();
    const tf = this.typeFilter();
    if (tf !== 'All') {
      list = list.filter(t => t.type.toLowerCase().includes(tf.toLowerCase()));
    }
    const q = this.searchQuery().toLowerCase();
    if (q) {
      list = list.filter(t => t.name.toLowerCase().includes(q));
    }
    return list;
  });

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadTemplates();
  }

  loadTemplates() {
    this.loading.set(true);
    this.api.get<AfsTemplate[]>('/templates').subscribe({
      next: (data) => {
        this.templates.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  seedTemplates() {
    this.seeding.set(true);
    this.api.get('/templates/seed').subscribe({
      next: (res: any) => {
        this.seeding.set(false);
        this.snackBar.open(res?.message || 'NT Specimen template seeded successfully', 'Close', { duration: 5000, panelClass: 'snack-success' });
        this.loadTemplates();
      },
      error: (err: any) => {
        this.seeding.set(false);
        this.snackBar.open(err?.error?.message || 'Failed to seed NT Specimen template', 'Close', { duration: 5000, panelClass: 'snack-error' });
      },
    });
  }

  seedGrapTemplates() {
    this.seedingGrap.set(true);
    this.api.get('/templates/seed-grap').subscribe({
      next: (res: any) => {
        this.seedingGrap.set(false);
        this.snackBar.open(res?.message || 'GRAP template seeded successfully', 'Close', { duration: 5000, panelClass: 'snack-success' });
        this.loadTemplates();
      },
      error: (err: any) => {
        this.seedingGrap.set(false);
        this.snackBar.open(err?.error?.message || 'Failed to seed GRAP template', 'Close', { duration: 5000, panelClass: 'snack-error' });
      },
    });
  }

  openCreateDialog() {
    const ref = this.dialog.open(CreateTemplateDialogComponent, { width: '480px' });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.loadTemplates();
      }
    });
  }

  deleteTemplate(template: AfsTemplate, event: Event) {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete "${template.name}"? This action cannot be undone.`)) {
      this.api.delete(`/templates/${template.id}`).subscribe({
        next: () => this.loadTemplates(),
      });
    }
  }

  openTemplate(id: string) {
    this.router.navigate(['/templates', id]);
  }

  openApplyDialog(template: AfsTemplate, event: Event) {
    event.stopPropagation();
    const ref = this.dialog.open(ApplyTemplateDialogComponent, {
      width: '520px',
      data: { template },
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open(`Template applied successfully as "${result.name}"`, 'Close', { duration: 5000, panelClass: 'snack-success' });
        this.loadTemplates();
      }
    });
  }

  getLineItemCount(template: AfsTemplate): number {
    if (!template.sections) return 0;
    return template.sections.reduce((sum, s) => sum + (s.lineItems?.length || 0), 0);
  }
}
