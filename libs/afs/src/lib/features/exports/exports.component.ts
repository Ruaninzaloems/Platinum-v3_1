import { Component, OnInit, OnDestroy, signal, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatRadioModule } from '@angular/material/radio';
import { ApiService } from '../../core/services/api.service';
import { PeriodFilterService } from '../../core/services/period-filter.service';
import { ExportJob, Compilation } from '../../core/models/interfaces';
import { DocumentManagementService, DmsDocument } from '../document-management/document-management.service';

interface AfsVersionSummary {
  id: string;
  compilationId: string;
  versionNumber: number;
  status: string;
  createdAt: string;
  lockedAt: string | null;
  exportCount: number;
  compilationSummary?: Record<string, unknown>;
}

@Component({
  selector: 'app-exports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatChipsModule,
    MatRadioModule,
    RouterModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './exports.component.html',
  styleUrl: './exports.component.css',
})
export class ExportsComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private router = inject(Router);
  private periodFilter = inject(PeriodFilterService);
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  jobs = signal<ExportJob[]>([]);
  compilations = signal<Compilation[]>([]);
  showCreateForm = signal(false);

  private static readonly REQUIRED_PERIODS = ['current_year', 'prior_year_1'];

  hasCompilationContext = signal(false);
  compilationContextLoading = signal(true);
  integrityPassed = signal(false);
  integrityOverridden = signal(false);
  integrityLoading = signal(true);
  policiesApproved = signal(false);
  policiesLoading = signal(true);
  unapprovedPolicyCount = signal(0);
  allPeriodsReady = signal(false);
  periodsLoading = signal(true);
  hasStaleData = signal(false);
  missingPeriods = signal<string[]>([]);
  gateErrors = signal<string[]>([]);

  openingBalanceStatus = signal<string>('not_established');
  openingBalanceLoading = signal(true);

  lockedVersions = signal<AfsVersionSummary[]>([]);
  versionsLoading = signal(true);
  selectedExportMode = signal<'official' | 'preview'>('official');
  selectedVersionId = signal<string>('');

  selectedCompilationId = signal<string>('');

  lockedVersionsForComp = computed(() => {
    const compId = this.selectedCompilationId();
    const all = this.lockedVersions();
    return all.filter(v => v.compilationId === compId && (v.status === 'locked' || v.status === 'superseded'));
  });

  newExport = { compilationId: '', format: 'pdf' };

  ngOnInit() {
    this.loadJobs();
    this.loadCompilations();
    this.checkCompilationContext();
    this.checkIntegrityStatus();
    this.checkPoliciesStatus();
    this.checkPeriodsAndStaleData();
    this.checkOpeningBalanceStatus();
    this.refreshInterval = setInterval(() => {
      const hasActive = this.jobs().some(j => j.status === 'processing' || j.status === 'queued');
      if (hasActive) {
        this.loadJobs();
      }
    }, 3000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  private checkCompilationContext(): void {
    this.compilationContextLoading.set(true);
    const fyId = this.periodFilter.selectedFyId();
    this.api.get<any[]>('/compilations').subscribe({
      next: (compilations) => {
        const activeForFy = Array.isArray(compilations) && compilations.some(c =>
          (c.financialYearId === fyId || c.financialYear?.id === fyId) && c.status !== 'inactive'
        );
        this.hasCompilationContext.set(activeForFy);
        this.compilationContextLoading.set(false);
        this.updateGateErrors();
      },
      error: () => {
        this.hasCompilationContext.set(false);
        this.compilationContextLoading.set(false);
        this.updateGateErrors();
      }
    });
  }

  private checkIntegrityStatus(): void {
    this.integrityLoading.set(true);
    this.api.get<{ checks: { status: string; overridden?: boolean; override?: boolean }[] }>('/reports/integrity-checks').subscribe({
      next: (result) => {
        const checks = result?.checks || [];
        const failedChecks = checks.filter((c) => c.status === 'fail');
        const allOverridden = failedChecks.length > 0 && failedChecks.every((c) => c.overridden === true || c.override);
        this.integrityPassed.set(failedChecks.length === 0);
        this.integrityOverridden.set(allOverridden);
        this.integrityLoading.set(false);
        this.updateGateErrors();
      },
      error: () => {
        this.integrityPassed.set(false);
        this.integrityOverridden.set(false);
        this.integrityLoading.set(false);
        this.updateGateErrors();
      }
    });
  }

  private checkPeriodsAndStaleData(): void {
    this.periodsLoading.set(true);
    const fyId = this.periodFilter.selectedFyId();
    if (!fyId) {
      this.allPeriodsReady.set(false);
      this.hasStaleData.set(false);
      this.periodsLoading.set(false);
      this.updateGateErrors();
      return;
    }
    this.api.get<any[]>(`/platinum/tb-import-batches/history/${fyId}`).subscribe({
      next: (batches) => {
        const committedPeriods = new Set((batches || []).filter(b => b.status === 'committed').map(b => b.periodType));
        const failedRequired = (batches || []).filter(b => b.status === 'validation_failed' && ExportsComponent.REQUIRED_PERIODS.includes(b.periodType));
        const missing = ExportsComponent.REQUIRED_PERIODS.filter(p => !committedPeriods.has(p));
        this.missingPeriods.set(missing);
        this.allPeriodsReady.set(missing.length === 0 && failedRequired.length === 0);
        this.hasStaleData.set((batches || []).some(b => b.isStale === true));
        this.periodsLoading.set(false);
        this.updateGateErrors();
      },
      error: () => {
        this.allPeriodsReady.set(false);
        this.missingPeriods.set(ExportsComponent.REQUIRED_PERIODS);
        this.hasStaleData.set(false);
        this.periodsLoading.set(false);
        this.updateGateErrors();
      }
    });
  }

  private checkPoliciesStatus(): void {
    this.policiesLoading.set(true);
    const fyId = this.periodFilter.selectedFyId();
    if (!fyId) {
      this.policiesApproved.set(false);
      this.unapprovedPolicyCount.set(0);
      this.policiesLoading.set(false);
      this.updateGateErrors();
      return;
    }
    this.api.get<{ approvalStatus?: string; status?: string }[]>(`/accounting-policies/${fyId}`).subscribe({
      next: (response) => {
        const policies = Array.isArray(response) ? response : (response ? [response] : []);
        const unapproved = policies.filter((p) => {
          const s = p?.approvalStatus || p?.status;
          return s !== 'approved' && s !== 'published';
        });
        this.unapprovedPolicyCount.set(unapproved.length);
        this.policiesApproved.set(policies.length > 0 && unapproved.length === 0);
        this.policiesLoading.set(false);
        this.updateGateErrors();
      },
      error: () => {
        this.policiesApproved.set(false);
        this.unapprovedPolicyCount.set(0);
        this.policiesLoading.set(false);
        this.updateGateErrors();
      }
    });
  }

  private checkOpeningBalanceStatus(): void {
    this.openingBalanceLoading.set(true);
    const fyId = this.periodFilter.selectedFyId();
    this.api.get<any[]>('/compilations').subscribe({
      next: (compilations) => {
        const activeComp = Array.isArray(compilations) && compilations.find(c =>
          (c.financialYearId === fyId || c.financialYear?.id === fyId) && c.status !== 'inactive'
        );
        if (!activeComp) {
          this.openingBalanceStatus.set('not_established');
          this.openingBalanceLoading.set(false);
          this.updateGateErrors();
          return;
        }
        this.api.get<any>(`/opening-balance/${activeComp.id}/status`).subscribe({
          next: (result) => {
            this.openingBalanceStatus.set(result?.status || 'not_established');
            this.openingBalanceLoading.set(false);
            this.updateGateErrors();
          },
          error: () => {
            this.openingBalanceStatus.set('not_established');
            this.openingBalanceLoading.set(false);
            this.updateGateErrors();
          }
        });
      },
      error: () => {
        this.openingBalanceStatus.set('not_established');
        this.openingBalanceLoading.set(false);
        this.updateGateErrors();
      }
    });
  }

  goToOpeningBalanceControl(): void {
    this.router.navigate(['/opening-balance-control']);
  }

  private updateGateErrors(): void {
    const errors: string[] = [];
    if (!this.compilationContextLoading() && !this.hasCompilationContext()) {
      errors.push('No active compilation for the selected financial year (G2)');
    }
    if (!this.periodsLoading() && !this.allPeriodsReady()) {
      const missing = this.missingPeriods();
      const detail = missing.length > 0 ? ` Missing: ${missing.join(', ')}.` : '';
      errors.push(`All required periods must be loaded and committed before export (G4).${detail}`);
    }
    if (!this.periodsLoading() && this.hasStaleData()) {
      errors.push('Stale data detected — reload affected periods before exporting (G5)');
    }
    if (!this.integrityLoading() && !this.integrityPassed() && !this.integrityOverridden()) {
      errors.push('Integrity checks have unresolved failures — resolve or override before exporting (G6)');
    }
    if (!this.policiesLoading() && !this.policiesApproved()) {
      const count = this.unapprovedPolicyCount();
      errors.push(count > 0
        ? `${count} accounting ${count === 1 ? 'policy requires' : 'policies require'} approval before export (G7)`
        : 'Accounting policies must be approved before export (G7)');
    }
    if (!this.openingBalanceLoading()) {
      const obStatus = this.openingBalanceStatus();
      if (obStatus !== 'continuity_matched_confirmed' && obStatus !== 'confirmed_with_exception') {
        const statusLabels: Record<string, string> = {
          'not_established': 'not yet established',
          'baseline_selected': 'pending confirmation',
          'continuity_matched_unconfirmed': 'matched but awaiting explicit confirmation',
          'continuity_exception': 'exceptions acknowledged — awaiting confirmation',
          'superseded': 'stale — re-confirmation required',
        };
        const detail = statusLabels[obStatus] || obStatus;
        errors.push(`Opening balance baseline ${detail} — confirm before export (G8)`);
      }
    }
    this.gateErrors.set(errors);
  }

  get exportBlocked(): boolean {
    if (this.compilationContextLoading() || this.periodsLoading() || this.integrityLoading() || this.policiesLoading() || this.openingBalanceLoading()) {
      return true;
    }
    return this.gateErrors().length > 0;
  }

  goToCompilations(): void {
    this.router.navigate(['/compilations']);
  }

  goToIntegrityChecks(): void {
    this.router.navigate(['/integrity']);
  }

  goToAccountingPolicies(): void {
    this.router.navigate(['/accounting-policies']);
  }

  loadJobs() {
    this.api.get<ExportJob[]>('/exports').subscribe({
      next: (data) => this.jobs.set(data),
    });
  }

  loadCompilations() {
    this.api.get<Compilation[]>('/compilations').subscribe({
      next: (data) => {
        this.compilations.set(data);
        this.loadLockedVersions();
      },
    });
  }

  loadLockedVersions() {
    this.versionsLoading.set(true);
    const comps = this.compilations();
    if (!comps || comps.length === 0) {
      this.lockedVersions.set([]);
      this.versionsLoading.set(false);
      return;
    }
    let pending = comps.length;
    let allVersions: AfsVersionSummary[] = [];
    for (const comp of comps) {
      this.api.get<AfsVersionSummary[]>(`/afs-versions/compilation/${comp.id}`).subscribe({
        next: (versions) => {
          const exportable = (versions || [])
            .filter((v: AfsVersionSummary) => v.status === 'locked' || v.status === 'superseded')
            .map((v: AfsVersionSummary) => ({ ...v, compilationId: comp.id }));
          allVersions = [...allVersions, ...exportable];
          pending--;
          if (pending <= 0) {
            this.lockedVersions.set(allVersions);
            this.versionsLoading.set(false);
            this.preselectVersionForCompilation();
          }
        },
        error: () => {
          pending--;
          if (pending <= 0) {
            this.lockedVersions.set(allVersions);
            this.versionsLoading.set(false);
          }
        },
      });
    }
  }

  onCompilationChange(compilationId: string) {
    this.newExport.compilationId = compilationId;
    this.selectedCompilationId.set(compilationId);
    this.selectedVersionId.set('');
    this.preselectVersionForCompilation();
  }

  private preselectVersionForCompilation() {
    const versions = this.lockedVersionsForComp();
    if (versions.length > 0) {
      const locked = versions.find(v => v.status === 'locked');
      if (locked) {
        this.selectedVersionId.set(locked.id);
      } else {
        this.selectedVersionId.set(versions[0].id);
      }
    }
  }

  onExportModeChange(mode: 'official' | 'preview') {
    this.selectedExportMode.set(mode);
    if (mode === 'official' && (this.newExport.format === 'evidence-zip' || this.newExport.format === 'governance-pack')) {
      this.newExport.format = 'pdf';
    }
  }

  createExport() {
    if (this.exportBlocked) {
      return;
    }
    const mode = this.selectedExportMode();
    const payload: { compilationId: string; format: string; exportMode: string; afsVersionId?: string } = {
      compilationId: this.newExport.compilationId,
      format: this.newExport.format,
      exportMode: mode,
    };
    if (mode === 'official') {
      payload.afsVersionId = this.selectedVersionId();
    }
    this.api.post('/exports', payload).subscribe({
      next: () => {
        this.showCreateForm.set(false);
        this.newExport = { compilationId: '', format: 'pdf' };
        this.loadJobs();
        this.loadLockedVersions();
      },
    });
  }

  downloadExport(job: ExportJob) {
    window.open(`/api/exports/${job.id}`, '_blank');
  }

  viewInDms(job: ExportJob) {
    window.open(`/documents?search=${encodeURIComponent(job.fileName || '')}`, '_self');
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
}
