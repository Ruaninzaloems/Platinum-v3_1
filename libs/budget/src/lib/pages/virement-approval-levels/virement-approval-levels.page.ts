import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';

interface RangeRow {
  rangeId: number;
  minAmount: number;
  maxAmount: number;
  dateCaptured: string;
  approvers: ApproverRow[];
  expanded: boolean;
}

interface ApproverRow {
  approverId: number;
  rangeId: number;
  levelId: number;
  userId: number;
  approverName: string;
}

@Component({
  selector: 'app-virement-approval-levels',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatSelectModule, MatFormFieldModule, MatInputModule, MatIconModule],
  templateUrl: './virement-approval-levels.page.html',
  styleUrls: ['./virement-approval-levels.page.scss']
})
export class VirementApprovalLevelsPage implements OnInit {
  isLocked = false;
  headerId = 0;
  levelCount = 7;
  levels: number[] = [];

  ranges: RangeRow[] = [];
  approverUsers: { userId: number; label: string }[] = [];

  selectedRange: RangeRow | null = null;

  // Add range form
  showAddRange = false;
  newMin: number | null = null;
  newMax: number | null = null;
  rangeFormError = '';
  savingRange = false;

  // Edit range
  editingRangeId: number | null = null;
  editMin: number | null = null;
  editMax: number | null = null;
  editError = '';

  // Add approver form
  newApproverLevelId: number | null = null;
  newApproverUserId: number | null = null;
  approverError = '';
  savingApprover = false;

  loading = false;
  errorMsg = '';
  successMsg = '';

  readonly CURRENT_USER_ID = 2;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.loading = true;
    this.cdr.markForCheck();

    this.api.getVirementApprovalHeader().subscribe({
      next: h => { this.isLocked = h.isLocked; this.headerId = h.id; this.cdr.markForCheck(); },
      error: () => {}
    });

    this.api.getVirementApprovalLevelCount().subscribe({
      next: r => {
        this.levelCount = r.count;
        this.levels = Array.from({ length: this.levelCount }, (_, i) => i + 1);
        this.cdr.markForCheck();
      },
      error: () => {}
    });

    this.api.getVirementApproverUsers().subscribe({
      next: u => { this.approverUsers = u; this.cdr.markForCheck(); },
      error: () => {}
    });

    this.api.getVirementApprovalRanges().subscribe({
      next: rows => {
        const prevExpandedId = this.selectedRange?.rangeId;
        this.ranges = rows.map(r => ({
          rangeId: r.rangeId,
          minAmount: r.minAmount,
          maxAmount: r.maxAmount,
          dateCaptured: r.dateCaptured,
          approvers: (r.approvers || []).map((a: any) => ({
            approverId: a.approverId,
            rangeId: a.rangeId,
            levelId: a.levelId,
            userId: a.userId,
            approverName: a.approverName
          })),
          expanded: r.rangeId === prevExpandedId
        }));
        this.selectedRange = this.ranges.find(r => r.rangeId === prevExpandedId) ?? null;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  // ── Lock / Unlock ─────────────────────────────────────────────────────────
  toggleLock() {
    const next = !this.isLocked;
    this.api.toggleVirementApprovalLock(next, this.CURRENT_USER_ID).subscribe({
      next: () => {
        this.isLocked = next;
        this.flash('success', next ? 'Configuration locked.' : 'Configuration unlocked.');
        this.cdr.markForCheck();
      },
      error: () => this.flash('error', 'Failed to toggle lock.')
    });
  }

  // ── Range CRUD ────────────────────────────────────────────────────────────
  openAddRange() {
    this.showAddRange = true;
    this.newMin = null;
    this.newMax = null;
    this.rangeFormError = '';
  }

  cancelAddRange() {
    this.showAddRange = false;
    this.rangeFormError = '';
  }

  saveRange() {
    if (this.newMin === null || this.newMax === null) {
      this.rangeFormError = 'Both amounts are required.';
      return;
    }
    if (this.newMin >= this.newMax) {
      this.rangeFormError = 'Minimum amount must be less than maximum amount.';
      return;
    }
    this.savingRange = true;
    this.rangeFormError = '';
    this.api.addVirementApprovalRange({ minAmount: this.newMin, maxAmount: this.newMax, userId: this.CURRENT_USER_ID }).subscribe({
      next: () => {
        this.savingRange = false;
        this.showAddRange = false;
        this.flash('success', 'Range added.');
        this.loadAll();
      },
      error: err => {
        this.savingRange = false;
        this.rangeFormError = err?.error || 'Failed to save range.';
        this.cdr.markForCheck();
      }
    });
  }

  startEdit(r: RangeRow) {
    this.editingRangeId = r.rangeId;
    this.editMin = r.minAmount;
    this.editMax = r.maxAmount;
    this.editError = '';
    this.cdr.markForCheck();
  }

  cancelEdit() {
    this.editingRangeId = null;
    this.editError = '';
    this.cdr.markForCheck();
  }

  saveEdit(r: RangeRow) {
    if (this.editMin === null || this.editMax === null) { this.editError = 'Both amounts required.'; return; }
    if (this.editMin >= this.editMax) { this.editError = 'Minimum must be less than maximum.'; return; }
    this.api.updateVirementApprovalRange(r.rangeId, { minAmount: this.editMin, maxAmount: this.editMax, userId: this.CURRENT_USER_ID }).subscribe({
      next: () => {
        this.editingRangeId = null;
        this.flash('success', 'Range updated.');
        this.loadAll();
      },
      error: err => { this.editError = err?.error || 'Failed to update.'; this.cdr.markForCheck(); }
    });
  }

  deleteRange(r: RangeRow) {
    if (!confirm(`Delete range R ${r.minAmount.toFixed(2)} – R ${r.maxAmount.toFixed(2)} and all its approvers?`)) return;
    this.api.deleteVirementApprovalRange(r.rangeId).subscribe({
      next: () => {
        if (this.selectedRange?.rangeId === r.rangeId) this.selectedRange = null;
        this.flash('success', 'Range deleted.');
        this.loadAll();
      },
      error: () => this.flash('error', 'Failed to delete range.')
    });
  }

  // ── Approvers ─────────────────────────────────────────────────────────────
  selectRange(r: RangeRow) {
    if (this.selectedRange?.rangeId === r.rangeId) {
      this.selectedRange = null;
      r.expanded = false;
    } else {
      this.ranges.forEach(x => x.expanded = false);
      r.expanded = true;
      this.selectedRange = r;
      this.newApproverLevelId = null;
      this.newApproverUserId = null;
      this.approverError = '';
    }
    this.cdr.markForCheck();
  }

  addApprover() {
    if (!this.selectedRange) return;
    if (!this.newApproverLevelId) { this.approverError = 'Please select a level.'; return; }
    if (!this.newApproverUserId) { this.approverError = 'Please select an approver.'; return; }
    this.savingApprover = true;
    this.approverError = '';
    this.api.addVirementApprovalApprover(this.selectedRange.rangeId, {
      approverUserId: this.newApproverUserId,
      levelId: this.newApproverLevelId,
      userId: this.CURRENT_USER_ID
    }).subscribe({
      next: () => {
        this.savingApprover = false;
        this.newApproverLevelId = null;
        this.newApproverUserId = null;
        this.flash('success', 'Approver added.');
        this.loadAll();
      },
      error: err => {
        this.savingApprover = false;
        this.approverError = err?.error || 'Failed to add approver.';
        this.cdr.markForCheck();
      }
    });
  }

  removeApprover(a: ApproverRow) {
    if (!confirm(`Remove ${a.approverName} from Level ${a.levelId}?`)) return;
    this.api.deleteVirementApprovalApprover(a.approverId).subscribe({
      next: () => { this.flash('success', 'Approver removed.'); this.loadAll(); },
      error: () => this.flash('error', 'Failed to remove approver.')
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  approversForLevel(r: RangeRow, level: number): ApproverRow[] {
    return r.approvers.filter(a => a.levelId === level);
  }

  flash(type: 'success' | 'error', msg: string) {
    if (type === 'success') { this.successMsg = msg; this.errorMsg = ''; }
    else { this.errorMsg = msg; this.successMsg = ''; }
    this.cdr.markForCheck();
    setTimeout(() => { this.successMsg = ''; this.errorMsg = ''; this.cdr.markForCheck(); }, 4000);
  }

  formatCurrency(v: number): string {
    return 'R ' + v.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
