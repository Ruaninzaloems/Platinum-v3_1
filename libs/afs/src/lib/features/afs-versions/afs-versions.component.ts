import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatBadgeModule } from '@angular/material/badge';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../core/services/api.service';
import { PeriodFilterService } from '../../core/services/period-filter.service';
import { AuthService } from '../../core/services/auth.service';

interface ReviewCycleEntry {
  cycle: number;
  submittedAt?: string;
  submittedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  approveComment?: string;
  returnedAt?: string;
  returnedBy?: string;
  returnReason?: string;
  fourEyesBypassed?: boolean;
}

interface AfsVersion {
  id: string;
  compilationId: string;
  versionNumber: number;
  status: string;
  createdAt: string;
  createdBy: string;
  lockedAt: string | null;
  lockedBy: string | null;
  discardedAt: string | null;
  supersededAt: string | null;
  supersededByVersionId: string | null;
  firstExportedAt: string | null;
  lastExportedAt: string | null;
  exportCount: number;
  compilationSummary: { completenessPercentage?: number; totalLineItems?: number; mappedLineItems?: number; unmappedLineItems?: number; [key: string]: unknown };
  gateCheckSnapshot: { G2?: { passed: boolean }; G8?: { passed: boolean }; G9?: { passed: boolean }; [key: string]: unknown };
  reportHeaderMetadata: { municipalityName?: string; financialYearLabel?: string; [key: string]: unknown };
  compilationStatusAtCreation: string;
  compilationDraftVersion: number;
  lockConfirmationAcknowledged: boolean;
  snapshotSchemaVersion: string;
  isPotentiallyStale?: boolean;
  staleReason?: string | null;
  snapshotCapturedAt?: string;
  latestCompilationUpdatedAt?: string | null;
  reviewStatus: string | null;
  submittedForReviewAt: string | null;
  submittedForReviewBy: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewComment: string | null;
  returnReason: string | null;
  reviewCycleHistory: ReviewCycleEntry[];
}

interface GateStatus {
  G2: { passed: boolean; label: string };
  G4: { passed: boolean; label: string; detail?: string };
  G7: { passed: boolean; label: string; detail?: string };
  G8: { passed: boolean; label: string; obStatus?: string };
  G9: { passed: boolean; label: string; compilationStatus?: string };
  G11: { passed: boolean; label: string; reviewStatus?: string };
  canCreateDraft: boolean;
  canSubmitForReview: boolean;
  canLock: boolean;
}

@Component({
  selector: 'app-afs-versions',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDividerModule,
    MatDialogModule,
    MatTableModule,
    MatBadgeModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './afs-versions.component.html',
  styleUrl: './afs-versions.component.css',
})
export class AfsVersionsComponent implements OnInit {
  private api = inject(ApiService);
  private periodFilter = inject(PeriodFilterService);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);

  loading = signal(true);
  hasCompilationContext = signal(false);
  compilationId = signal<string | null>(null);

  versions = signal<AfsVersion[]>([]);
  gateStatus = signal<GateStatus | null>(null);

  currentDraft = signal<AfsVersion | null>(null);
  currentLocked = signal<AfsVersion | null>(null);

  actionInProgress = signal(false);
  lockConfirmationPending = signal(false);
  returnDialogOpen = signal(false);
  returnReasonText = signal('');
  expandedVersionId = signal<string | null>(null);
  cycleHistoryExpanded = signal(false);

  hasRole(role: string): boolean {
    const roles = this.authService.userRoles();
    return roles.includes(role);
  }

  get canPrepare(): boolean {
    return this.hasRole('AFS_PREPARER') || this.hasRole('SYSTEM_ADMIN') || this.hasRole('MUNI_ADMIN');
  }

  get canReview(): boolean {
    return this.hasRole('AFS_REVIEWER') || this.hasRole('AFS_APPROVER') || this.hasRole('SYSTEM_ADMIN') || this.hasRole('MUNI_ADMIN');
  }

  get canReturnToPrep(): boolean {
    return this.hasRole('AFS_REVIEWER') || this.hasRole('SYSTEM_ADMIN') || this.hasRole('MUNI_ADMIN');
  }

  get canApprove(): boolean {
    return this.hasRole('AFS_APPROVER') || this.hasRole('SYSTEM_ADMIN') || this.hasRole('MUNI_ADMIN');
  }

  ngOnInit() {
    this.loadCompilationContext();
  }

  private loadCompilationContext() {
    this.loading.set(true);
    this.api.get<{ id: string; financialYearId: string; isActive: boolean }[]>('/compilations').subscribe({
      next: (comps) => {
        const fyId = this.periodFilter.selectedFyId();
        const active = comps.find((c: { financialYearId: string; isActive: boolean }) => c.financialYearId === fyId && c.isActive) || comps[0];
        if (active) {
          this.hasCompilationContext.set(true);
          this.compilationId.set(active.id);
          this.loadVersions();
          this.loadGateStatus();
        } else {
          this.hasCompilationContext.set(false);
          this.loading.set(false);
        }
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Failed to load compilations', 'Dismiss', { duration: 5000 });
      },
    });
  }

  private loadVersions() {
    const compId = this.compilationId();
    if (!compId) return;

    this.api.get<AfsVersion[]>(`/afs-versions/compilation/${compId}`).subscribe({
      next: (versions) => {
        this.versions.set(versions);
        this.currentDraft.set(versions.find(v => v.status === 'draft') || null);
        this.currentLocked.set(versions.find(v => v.status === 'locked') || null);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Failed to load versions', 'Dismiss', { duration: 5000 });
      },
    });
  }

  private loadGateStatus() {
    const compId = this.compilationId();
    if (!compId) return;

    this.api.get<GateStatus>(`/afs-versions/compilation/${compId}/gates`).subscribe({
      next: (gates) => this.gateStatus.set(gates),
      error: () => {},
    });
  }

  createDraft() {
    const compId = this.compilationId();
    if (!compId) return;

    this.actionInProgress.set(true);
    this.api.post<AfsVersion>(`/afs-versions/compilation/${compId}/create-draft`, {}).subscribe({
      next: (version) => {
        this.actionInProgress.set(false);
        this.snackBar.open(`Draft v${version.versionNumber} created successfully`, 'OK', { duration: 4000 });
        this.loadVersions();
        this.loadGateStatus();
      },
      error: (err) => {
        this.actionInProgress.set(false);
        this.snackBar.open(err.error?.message || 'Failed to create draft', 'Dismiss', { duration: 5000 });
      },
    });
  }

  submitForReview() {
    const draft = this.currentDraft();
    if (!draft) return;

    this.actionInProgress.set(true);
    this.api.post<AfsVersion>(`/afs-versions/${draft.id}/submit-for-review`, {}).subscribe({
      next: (version) => {
        this.actionInProgress.set(false);
        this.snackBar.open(`Version v${version.versionNumber} submitted for review`, 'OK', { duration: 4000 });
        this.loadVersions();
        this.loadGateStatus();
      },
      error: (err) => {
        this.actionInProgress.set(false);
        this.snackBar.open(err.error?.message || 'Failed to submit for review', 'Dismiss', { duration: 5000 });
      },
    });
  }

  approveReview() {
    const draft = this.currentDraft();
    if (!draft) return;

    this.actionInProgress.set(true);
    this.api.post<AfsVersion>(`/afs-versions/${draft.id}/approve-review`, {}).subscribe({
      next: (version) => {
        this.actionInProgress.set(false);
        this.snackBar.open(`Version v${version.versionNumber} review approved`, 'OK', { duration: 4000 });
        this.loadVersions();
        this.loadGateStatus();
      },
      error: (err) => {
        this.actionInProgress.set(false);
        this.snackBar.open(err.error?.message || 'Failed to approve review', 'Dismiss', { duration: 5000 });
      },
    });
  }

  openReturnDialog() {
    this.returnDialogOpen.set(true);
    this.returnReasonText.set('');
  }

  cancelReturn() {
    this.returnDialogOpen.set(false);
    this.returnReasonText.set('');
  }

  confirmReturn() {
    const draft = this.currentDraft();
    if (!draft) return;
    const reason = this.returnReasonText();
    if (!reason || reason.trim().length === 0) {
      this.snackBar.open('Return reason is required', 'Dismiss', { duration: 3000 });
      return;
    }

    this.actionInProgress.set(true);
    this.returnDialogOpen.set(false);
    this.api.post<AfsVersion>(`/afs-versions/${draft.id}/return-to-prep`, { returnReason: reason }).subscribe({
      next: (version) => {
        this.actionInProgress.set(false);
        this.snackBar.open(`Version v${version.versionNumber} returned to preparer`, 'OK', { duration: 4000 });
        this.returnReasonText.set('');
        this.loadVersions();
        this.loadGateStatus();
      },
      error: (err) => {
        this.actionInProgress.set(false);
        this.snackBar.open(err.error?.message || 'Failed to return version', 'Dismiss', { duration: 5000 });
      },
    });
  }

  startLockConfirmation() {
    this.lockConfirmationPending.set(true);
  }

  cancelLockConfirmation() {
    this.lockConfirmationPending.set(false);
  }

  isSingleUserApproval(draft: AfsVersion): boolean {
    if (!Array.isArray(draft.reviewCycleHistory) || draft.reviewCycleHistory.length === 0) return false;
    const latestCycle = draft.reviewCycleHistory[draft.reviewCycleHistory.length - 1];
    return latestCycle?.fourEyesBypassed === true;
  }

  confirmLock() {
    const draft = this.currentDraft();
    if (!draft) return;

    this.actionInProgress.set(true);
    this.lockConfirmationPending.set(false);
    this.api.post<AfsVersion>(`/afs-versions/${draft.id}/lock`, { lockConfirmationAcknowledged: true }).subscribe({
      next: (version) => {
        this.actionInProgress.set(false);
        this.snackBar.open(`Version v${version.versionNumber} locked successfully`, 'OK', { duration: 4000 });
        this.loadVersions();
        this.loadGateStatus();
      },
      error: (err) => {
        this.actionInProgress.set(false);
        this.snackBar.open(err.error?.message || 'Failed to lock version', 'Dismiss', { duration: 5000 });
      },
    });
  }

  discardDraft() {
    const draft = this.currentDraft();
    if (!draft) return;

    this.actionInProgress.set(true);
    this.api.post<AfsVersion>(`/afs-versions/${draft.id}/discard`, {}).subscribe({
      next: () => {
        this.actionInProgress.set(false);
        this.snackBar.open(`Draft v${draft.versionNumber} discarded`, 'OK', { duration: 4000 });
        this.loadVersions();
        this.loadGateStatus();
      },
      error: (err) => {
        this.actionInProgress.set(false);
        this.snackBar.open(err.error?.message || 'Failed to discard draft', 'Dismiss', { duration: 5000 });
      },
    });
  }

  toggleExpanded(versionId: string) {
    this.expandedVersionId.set(this.expandedVersionId() === versionId ? null : versionId);
  }

  toggleCycleHistory() {
    this.cycleHistoryExpanded.set(!this.cycleHistoryExpanded());
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'draft': return 'accent';
      case 'locked': return 'primary';
      case 'superseded': return 'warn';
      case 'discarded': return '';
      default: return '';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'draft': return 'edit_note';
      case 'locked': return 'lock';
      case 'superseded': return 'history';
      case 'discarded': return 'delete_outline';
      default: return 'help';
    }
  }

  getReviewStatusColor(reviewStatus: string | null): string {
    switch (reviewStatus) {
      case 'SUBMITTED': return 'review-submitted';
      case 'APPROVED': return 'review-approved';
      case 'DRAFT': return 'review-draft';
      default: return '';
    }
  }

  getReviewStatusLabel(reviewStatus: string | null): string {
    switch (reviewStatus) {
      case 'SUBMITTED': return 'Submitted for Review';
      case 'APPROVED': return 'Review Approved';
      case 'DRAFT': return 'Draft';
      default: return '';
    }
  }
}
