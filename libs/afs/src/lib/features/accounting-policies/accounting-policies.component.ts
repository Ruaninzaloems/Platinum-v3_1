import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { QuillModule } from 'ngx-quill';
import { ApiService } from '../../core/services/api.service';
import { PeriodFilterService } from '../../core/services/period-filter.service';
import { AddPolicyDialogComponent } from './add-policy-dialog.component';
import { QUILL_TOOLBAR_MODULES, QUILL_FORMATS, applyQuillTooltips, registerQuillClipboardMatchers, registerQuillSizeWhitelist, setupTableToolbar, restoreTableBorders } from './quill-config';

interface AccountingPolicy {
  id: string;
  policyArea: string;
  paragraphCode: string;
  title: string;
  defaultText: string;
  editedText: string | null;
  isActive: boolean;
  isEditable: boolean;
  isMandatory: boolean;
  isCustom: boolean;
  isArchived: boolean;
  contentFormat: string;
  grapReference: string | null;
  afsSpecimenReference: string | null;
  approvalStatus: string;
  sortOrder: number;
  lastEditedBy: string | null;
  lastEditedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
}

@Component({
  selector: 'app-accounting-policies',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatMenuModule,
    MatDialogModule,
    QuillModule,
  ],
  templateUrl: './accounting-policies.component.html',
  styleUrl: './accounting-policies.component.css',
})
export class AccountingPoliciesComponent implements OnInit {
  private api = inject(ApiService);
  private periodFilter = inject(PeriodFilterService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  policies: AccountingPolicy[] = [];
  filteredPolicies: AccountingPolicy[] = [];
  policyAreas: string[] = [];
  filterArea = '';
  filterStatus = '';
  loading = false;
  expandedIds = new Set<string>();
  editingId: string | null = null;
  editText = '';
  showArchived = false;
  reorderMode = false;

  quillModules = QUILL_TOOLBAR_MODULES;
  quillFormats = QUILL_FORMATS;

  onEditorCreated(quill: any): void {
    registerQuillSizeWhitelist(quill);
    const container = quill.container?.closest('.ql-container')?.parentElement;
    if (container) {
      applyQuillTooltips(container);
      setupTableToolbar(quill, container);
    }
    registerQuillClipboardMatchers(quill);
    restoreTableBorders(quill, this.editText);
  }

  ngOnInit() {
    this.loadPolicies();
  }

  get canReorder(): boolean {
    if (this.filterArea || this.filterStatus) return false;
    if (this.editingId) return false;
    if (this.showArchived) return false;
    const active = this.policies.filter(p => !p.isArchived);
    return active.length > 0 && active.every(p => p.approvalStatus === 'draft');
  }

  loadPolicies() {
    const fyId = this.periodFilter.selectedFyId();
    if (!fyId) return;
    this.loading = true;
    const url = this.showArchived
      ? `/accounting-policies/${fyId}?includeArchived=true`
      : `/accounting-policies/${fyId}`;
    this.api.get<AccountingPolicy[]>(url).subscribe({
      next: (data) => {
        this.policies = data || [];
        this.policyAreas = [...new Set(this.policies.map(p => p.policyArea))].sort();
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.policies = [];
        this.filteredPolicies = [];
        this.loading = false;
      },
    });
  }

  applyFilters() {
    this.filteredPolicies = this.policies.filter(p => {
      if (!this.showArchived && p.isArchived) return false;
      if (this.filterArea && p.policyArea !== this.filterArea) return false;
      if (this.filterStatus && p.approvalStatus !== this.filterStatus) return false;
      return true;
    });
    if (this.reorderMode && !this.canReorder) {
      this.reorderMode = false;
    }
  }

  toggleArchived() {
    this.showArchived = !this.showArchived;
    this.loadPolicies();
  }

  toggleExpand(id: string) {
    if (this.expandedIds.has(id)) {
      this.expandedIds.delete(id);
    } else {
      this.expandedIds.add(id);
    }
  }

  togglePolicy(policy: AccountingPolicy) {
    if (policy.isMandatory) return;
    const newValue = !policy.isActive;
    this.api.put(`/accounting-policies/${policy.id}`, { isActive: newValue }).subscribe({
      next: (updated: any) => {
        Object.assign(policy, updated);
        this.snackBar.open(`Policy ${newValue ? 'activated' : 'deactivated'}`, 'OK', { duration: 2000 });
      },
      error: () => this.snackBar.open('Failed to update policy', 'OK', { duration: 3000 }),
    });
  }

  startEdit(policy: AccountingPolicy) {
    this.editingId = policy.id;
    this.editText = policy.editedText || policy.defaultText;
    if (!this.expandedIds.has(policy.id)) {
      this.expandedIds.add(policy.id);
    }
  }

  cancelEdit() {
    this.editingId = null;
    this.editText = '';
  }

  saveEdit(policy: AccountingPolicy) {
    this.api.put(`/accounting-policies/${policy.id}`, { editedText: this.editText }).subscribe({
      next: (updated: any) => {
        Object.assign(policy, updated);
        this.editingId = null;
        this.editText = '';
        this.snackBar.open('Policy text saved', 'OK', { duration: 2000 });
      },
      error: () => this.snackBar.open('Failed to save changes', 'OK', { duration: 3000 }),
    });
  }

  revertToDefault(policy: AccountingPolicy) {
    this.api.put(`/accounting-policies/${policy.id}`, { editedText: null }).subscribe({
      next: (updated: any) => {
        Object.assign(policy, updated);
        this.editText = policy.defaultText;
        this.snackBar.open('Reverted to default text', 'OK', { duration: 2000 });
      },
      error: () => this.snackBar.open('Failed to revert', 'OK', { duration: 3000 }),
    });
  }

  changeStatus(policy: AccountingPolicy, status: string) {
    this.api.put(`/accounting-policies/${policy.id}`, { approvalStatus: status }).subscribe({
      next: (updated: any) => {
        Object.assign(policy, updated);
        this.snackBar.open(`Status changed to ${this.formatStatus(status)}`, 'OK', { duration: 2000 });
      },
      error: () => this.snackBar.open('Failed to change status', 'OK', { duration: 3000 }),
    });
  }

  seedDefaults() {
    const fyId = this.periodFilter.selectedFyId();
    if (!fyId) {
      this.snackBar.open('Please select a financial year first', 'OK', { duration: 3000 });
      return;
    }
    this.loading = true;
    this.api.post(`/accounting-policies/${fyId}/seed`, {}).subscribe({
      next: (res: any) => {
        this.snackBar.open(res.message || 'Policies seeded', 'OK', { duration: 3000 });
        this.loadPolicies();
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to seed policies', 'OK', { duration: 3000 });
      },
    });
  }

  submitAllForReview() {
    const draftPolicies = this.policies.filter(p => p.approvalStatus === 'draft' && !p.isArchived);
    if (draftPolicies.length === 0) {
      this.snackBar.open('No draft policies to submit', 'OK', { duration: 2000 });
      return;
    }
    let completed = 0;
    for (const policy of draftPolicies) {
      this.api.put(`/accounting-policies/${policy.id}`, { approvalStatus: 'under_review' }).subscribe({
        next: (updated: any) => {
          Object.assign(policy, updated);
          completed++;
          if (completed === draftPolicies.length) {
            this.snackBar.open(`${completed} policies submitted for review`, 'OK', { duration: 3000 });
          }
        },
      });
    }
  }

  openAddPolicyDialog() {
    const fyId = this.periodFilter.selectedFyId();
    if (!fyId) {
      this.snackBar.open('Please select a financial year first', 'OK', { duration: 3000 });
      return;
    }
    const maxCode = this.policies
      .map(p => p.paragraphCode)
      .filter(c => /^AP-\d+$/.test(c))
      .map(c => parseInt(c.replace('AP-', ''), 10))
      .reduce((max, n) => Math.max(max, n), 0);
    const suggestedCode = `AP-${String(maxCode + 1).padStart(3, '0')}`;

    const dialogRef = this.dialog.open(AddPolicyDialogComponent, {
      width: '600px',
      data: { policyAreas: this.policyAreas, suggestedCode },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.api.post(`/accounting-policies/${fyId}`, result).subscribe({
        next: () => {
          this.snackBar.open('Custom policy created', 'OK', { duration: 2000 });
          this.loadPolicies();
        },
        error: (err: any) => {
          const msg = err?.error?.message || 'Failed to create policy';
          this.snackBar.open(msg, 'OK', { duration: 3000 });
        },
      });
    });
  }

  archivePolicy(policy: AccountingPolicy) {
    const confirmed = confirm(`Archive "${policy.title}"? This will remove the policy from active lists and exports.`);
    if (!confirmed) return;
    this.api.put(`/accounting-policies/${policy.id}/archive`, {}).subscribe({
      next: () => {
        this.snackBar.open('Policy archived', 'OK', { duration: 2000 });
        this.loadPolicies();
      },
      error: (err: any) => {
        const msg = err?.error?.message || 'Failed to archive policy';
        this.snackBar.open(msg, 'OK', { duration: 3000 });
      },
    });
  }

  unarchivePolicy(policy: AccountingPolicy) {
    this.api.put(`/accounting-policies/${policy.id}/unarchive`, {}).subscribe({
      next: () => {
        this.snackBar.open('Policy restored', 'OK', { duration: 2000 });
        this.loadPolicies();
      },
      error: (err: any) => {
        const msg = err?.error?.message || 'Failed to restore policy';
        this.snackBar.open(msg, 'OK', { duration: 3000 });
      },
    });
  }

  toggleReorderMode() {
    if (!this.canReorder && !this.reorderMode) {
      if (this.filterArea || this.filterStatus) {
        this.snackBar.open('Clear all filters before reordering', 'OK', { duration: 3000 });
      } else if (this.editingId) {
        this.snackBar.open('Save or cancel your edit before reordering', 'OK', { duration: 3000 });
      } else {
        this.snackBar.open('All policies must be in Draft status to reorder', 'OK', { duration: 3000 });
      }
      return;
    }
    this.reorderMode = !this.reorderMode;
  }

  onDrop(event: CdkDragDrop<AccountingPolicy[]>) {
    if (event.previousIndex === event.currentIndex) return;
    moveItemInArray(this.filteredPolicies, event.previousIndex, event.currentIndex);
    const fyId = this.periodFilter.selectedFyId();
    if (!fyId) return;
    const orderedIds = this.filteredPolicies.map(p => p.id);
    this.api.put(`/accounting-policies/${fyId}/reorder`, { orderedIds }).subscribe({
      next: (data: any) => {
        this.policies = data || [];
        this.applyFilters();
        this.snackBar.open('Policies reordered', 'OK', { duration: 2000 });
      },
      error: (err: any) => {
        const msg = err?.error?.message || 'Failed to reorder';
        this.snackBar.open(msg, 'OK', { duration: 3000 });
        this.loadPolicies();
      },
    });
  }

  formatStatus(status: string): string {
    switch (status) {
      case 'draft': return 'Draft';
      case 'under_review': return 'Under Review';
      case 'approved': return 'Approved';
      case 'published': return 'Published';
      default: return status;
    }
  }

  getPolicyDisplayText(policy: AccountingPolicy): string {
    return policy.editedText || policy.defaultText || '';
  }

  isHtmlContent(policy: AccountingPolicy): boolean {
    return policy.contentFormat === 'html';
  }
}
