import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { ApiService } from '../../core/services/api.service';
import { KpiTileComponent } from '../../shared/components/kpi-tile.component';
import { TrafficLightComponent } from '../../shared/components/traffic-light.component';
import { ProgressRingComponent } from '../../shared/components/progress-ring.component';

interface MonthStatus {
  month: number;
  apiEntryCount: number;
  localEntryCount: number;
  status: 'synced' | 'stale' | 'never' | 'syncing' | 'failed';
  lastSyncedAt: string | null;
  syncDurationMs: number | null;
  selected?: boolean;
}

interface LiveMonthProgress {
  month: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  entriesSynced: number;
  totalEntries: number;
  lastPage: number;
  error?: string;
  skippedReason?: string;
}

interface EmsTableStatus {
  table: string;
  count: number;
  syncing?: boolean;
  lastResult?: string;
  lastError?: string;
}

const MONTH_NAMES: Record<number, string> = {
  1: 'Jul', 2: 'Aug', 3: 'Sep', 4: 'Oct', 5: 'Nov', 6: 'Dec',
  7: 'Jan', 8: 'Feb', 9: 'Mar', 10: 'Apr', 11: 'May', 12: 'Jun',
  13: 'Period 13', 14: 'Period 14', 15: 'Period 15'
};

@Component({
  selector: 'app-gl-sync-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatProgressBarModule, MatTooltipModule,
    MatSelectModule, MatFormFieldModule, MatCheckboxModule, MatChipsModule,
    MatBadgeModule, MatMenuModule, MatDividerModule,
    KpiTileComponent, TrafficLightComponent, ProgressRingComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gl-sync-dashboard.component.html',
  styleUrl: './gl-sync-dashboard.component.css'
})
export class GlSyncDashboardComponent implements OnInit, OnDestroy {
  Math = Math;
  loading = true;
  error = '';
  syncing = false;
  syncMessage = '';
  syncSuccess = false;
  apiConnected = false;
  selectedFinYear = '';
  availableFinYears: string[] = [];
  monthStatuses: MonthStatus[] = [];
  totalApiEntries = 0;
  totalLocalEntries = 0;
  tbEntries = 0;
  liveProgress: LiveMonthProgress[] = [];
  syncPhase = '';
  syncModeLive = '';
  tbSyncedLive = 0;
  tbOnlyMode = false;
  private progressTimer: any = null;

  emsStatuses: EmsTableStatus[] = [];
  emsSyncing = false;
  emsSyncMessage = '';
  emsSyncSuccess = false;
  emsSyncPartial = false;
  emsSyncProgressTotal = 0;
  emsSyncProgressDone = 0;
  emsSyncCurrentTable = '';
  private emsPollTimer: any = null;
  private emsPollErrors = 0;

  postSyncValidation: { ruleId: string; ruleName: string; status: string; message: string }[] = [];
  postSyncPassCount = 0;
  postSyncFailCount = 0;
  postSyncWarnCount = 0;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.loadData(); this.loadEmsStatus(); }
  ngOnDestroy() { this.stopProgressPolling(); this._stopEmsSyncPolling(); }

  private refreshDataAfterSync(preserveMessage: string) {
    const savedSuccess = this.syncSuccess;
    this.api.get<any>('/platinum/sync/status').subscribe({
      next: (syncStatus) => {
        this.apiConnected = !!syncStatus?.apiConnected;
        const localTb = syncStatus?.localData?.trialBalance || [];
        this.tbEntries = localTb.reduce((s: number, i: any) => s + (i.count || 0), 0);
        this.syncMessage = preserveMessage;
        this.syncSuccess = savedSuccess;
        if (this.selectedFinYear) this.loadMonthlyStatus();
        this.cdr.markForCheck();
      },
      error: () => {
        this.syncMessage = preserveMessage;
        this.syncSuccess = savedSuccess;
        this.cdr.markForCheck();
      }
    });
  }

  loadData() {
    this.loading = true;
    this.error = '';
    this.syncMessage = '';
    this.cdr.markForCheck();

    this.api.get<any>('/platinum/sync/status').subscribe({
      next: (syncStatus) => {
        this.apiConnected = !!syncStatus?.apiConnected;
        this.availableFinYears = syncStatus?.apiFinancialYears || [];
        if (!this.selectedFinYear && this.availableFinYears.length > 0) {
          this.selectedFinYear = this.availableFinYears[0];
        }

        const localTb = syncStatus?.localData?.trialBalance || [];
        this.tbEntries = localTb.reduce((s: number, i: any) => s + (i.count || 0), 0);

        if (this.selectedFinYear) {
          this.loadMonthlyStatus();
        } else {
          this.loading = false;
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load sync status';
        this.cdr.markForCheck();
      }
    });
  }

  private loadMonthlyStatus() {
    const fy = encodeURIComponent(this.selectedFinYear);
    this.api.get<any>(`/platinum/sync/monthly-status?finYear=${fy}`).subscribe({
      next: (res) => {
        this.monthStatuses = (res?.months || []).map((m: any) => ({ ...m, selected: false }));
        this.totalApiEntries = res?.totalApiEntries || 0;
        this.totalLocalEntries = res?.totalLocalEntries || 0;
        this.loading = false;
        this.checkForActiveSync();
        this.cdr.markForCheck();
      },
      error: () => {
        this.monthStatuses = [];
        this.loading = false;
        this.checkForActiveSync();
        this.cdr.markForCheck();
      }
    });
  }

  private checkForActiveSync() {
    if (!this.selectedFinYear) return;
    const fy = encodeURIComponent(this.selectedFinYear);
    this.api.get<any>(`/platinum/sync/progress?finYear=${fy}`).subscribe({
      next: (res) => {
        if (res?.active) {
          this.syncing = true;
          this.syncPhase = res.phase || 'general_ledger';
          this.tbSyncedLive = res.tbSynced || 0;
          this.syncModeLive = res.syncMode || '';
          this.liveProgress = res.progress || [];
          this.startProgressPolling();
          this.cdr.markForCheck();
        }
      },
      error: () => {}
    });
  }

  onFinYearChange() {
    this.stopProgressPolling();
    this.syncing = false;
    this.syncPhase = '';
    this.liveProgress = [];
    this.tbSyncedLive = 0;
    this.syncMessage = '';
    this.monthStatuses = [];
    this.loading = true;
    this.cdr.markForCheck();
    this.loadMonthlyStatus();
  }

  doSync(mode: 'incremental' | 'full' | 'selected' | 'selected-incremental' | 'gl-only-incremental') {
    if (!this.selectedFinYear) return;

    const selectedMonths = this.getSelectedMonths();
    let label = '';
    let body: any = { finYear: this.selectedFinYear };
    let endpoint = '/platinum/sync/all';

    switch (mode) {
      case 'incremental':
        label = `Incremental sync for ${this.selectedFinYear} — only changed months will be synced`;
        body.incremental = true;
        break;
      case 'full':
        label = `Full sync for ${this.selectedFinYear} — ALL months will be re-synced`;
        break;
      case 'selected':
        label = `Sync ${selectedMonths.length} selected months for ${this.selectedFinYear}`;
        body.months = selectedMonths;
        endpoint = '/platinum/sync/general-ledger';
        break;
      case 'selected-incremental':
        label = `Incremental sync for ${selectedMonths.length} selected months`;
        body.months = selectedMonths;
        body.incremental = true;
        endpoint = '/platinum/sync/general-ledger';
        break;
      case 'gl-only-incremental':
        label = `GL-only incremental sync (skipping TB) for ${this.selectedFinYear}`;
        body.incremental = true;
        endpoint = '/platinum/sync/general-ledger';
        break;
    }

    if (!confirm(`${label}\n\nProceed?`)) return;

    this.syncing = true;
    this.syncMessage = '';
    this.syncPhase = endpoint.includes('general-ledger') ? 'general_ledger' : 'trial_balance';
    this.tbOnlyMode = false;
    this.tbSyncedLive = 0;
    this.liveProgress = [];
    this.cdr.markForCheck();

    this.api.post<any>(endpoint, body).subscribe({
      next: (res) => {
        if (res?.started) {
          this.syncMessage = res.message;
          this.syncSuccess = true;
          this.startProgressPolling();
        } else {
          this.syncMessage = res?.message || 'Sync already running';
          this.syncSuccess = false;
          this.syncing = false;
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.syncing = false;
        const status = err?.status;
        const msg = err?.error?.message;
        if (status === 401 || status === 403) {
          this.syncMessage = 'Session expired — please log in again to sync';
        } else if (status === 0 || status === 502 || status === 504) {
          this.syncMessage = 'Server unavailable — please wait a moment and try again';
        } else {
          this.syncMessage = msg || `Sync request failed (HTTP ${status || 'unknown'})`;
        }
        this.syncSuccess = false;
        this.cdr.markForCheck();
      }
    });
  }

  doTbOnlySync() {
    if (!this.selectedFinYear) return;
    if (!confirm(`Trial Balance only sync for ${this.selectedFinYear}\n\nThis will re-download the Trial Balance without syncing the General Ledger.\n\nProceed?`)) return;

    this.syncing = true;
    this.syncMessage = '';
    this.syncPhase = 'trial_balance';
    this.tbOnlyMode = true;
    this.tbSyncedLive = 0;
    this.liveProgress = [];
    this.cdr.markForCheck();

    this.api.post<any>('/platinum/sync/trial-balance', { finYear: this.selectedFinYear }, { timeout: 120000 }).subscribe({
      next: (res) => {
        this.syncing = false;
        this.syncPhase = 'complete';
        this.tbSyncedLive = res?.synced || 0;
        const msg = `Trial Balance sync complete — ${(res?.synced || 0).toLocaleString()} entries synced`;
        this.syncMessage = msg;
        this.syncSuccess = true;
        this.cdr.markForCheck();
        this.refreshDataAfterSync(msg);
      },
      error: (err) => {
        this.syncing = false;
        this.syncPhase = '';
        const status = err?.status;
        const msg = err?.error?.message;
        if (status === 401 || status === 403) {
          this.syncMessage = 'Session expired — please log in again to sync';
        } else if (err?.name === 'TimeoutError') {
          this.syncMessage = 'TB sync is still running on the server — refresh the page in a minute to check results';
        } else if (status === 0 || status === 502 || status === 504) {
          this.syncMessage = 'Server unavailable — please wait a moment and try again';
        } else {
          this.syncMessage = msg || `TB sync failed (HTTP ${status || 'unknown'})`;
        }
        this.syncSuccess = false;
        this.cdr.markForCheck();
      }
    });
  }

  cancelSync() {
    if (!this.selectedFinYear) return;
    this.api.post<any>('/platinum/sync/cancel', { finYear: this.selectedFinYear }).subscribe({
      next: (res) => {
        this.syncMessage = res?.message || 'Cancel requested';
        this.syncSuccess = false;
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  private startProgressPolling() {
    this.stopProgressPolling();
    if (!this.selectedFinYear) return;
    const fy = encodeURIComponent(this.selectedFinYear);

    const poll = () => {
      this.api.get<any>(`/platinum/sync/progress?finYear=${fy}`).subscribe({
        next: (res) => {
          if (res?.active) {
            this.syncPhase = res.phase || 'general_ledger';
            this.tbSyncedLive = res.tbSynced || 0;
            this.syncModeLive = res.syncMode || '';
            if (res.progress?.length > 0) this.liveProgress = res.progress;
            this.cdr.markForCheck();
          } else {
            this.stopProgressPolling();
            this.syncing = false;
            this.syncPhase = '';
            if (this.liveProgress.length > 0) {
              const synced = this.liveProgress.filter(m => m.status === 'completed').reduce((s, m) => s + m.entriesSynced, 0);
              const skipped = this.liveProgress.filter(m => m.status === 'skipped').length;
              this.syncMessage = `Sync complete: ${synced.toLocaleString()} entries synced` +
                (skipped > 0 ? `, ${skipped} months skipped (already up to date)` : '');
              this.syncSuccess = true;
            }
            this.loadPostSyncValidation();
            this.cdr.markForCheck();
            setTimeout(() => {
              this.liveProgress = [];
              this.loadMonthlyStatus();
            }, 3000);
          }
        },
        error: () => {}
      });
    };

    poll();
    this.progressTimer = setInterval(poll, 2000);
  }

  private stopProgressPolling() {
    if (this.progressTimer) { clearInterval(this.progressTimer); this.progressTimer = null; }
  }

  getSelectedMonths(): number[] {
    return this.monthStatuses.filter(m => m.selected).map(m => m.month);
  }

  selectAll() { this.monthStatuses.forEach(m => m.selected = true); this.cdr.markForCheck(); }
  deselectAll() { this.monthStatuses.forEach(m => m.selected = false); this.cdr.markForCheck(); }
  selectStale() {
    this.monthStatuses.forEach(m => m.selected = (m.status === 'stale' || m.status === 'never' || m.status === 'failed'));
    this.cdr.markForCheck();
  }
  toggleMonth(ms: MonthStatus) { ms.selected = !ms.selected; this.cdr.markForCheck(); }

  syncSingleMonth(ms: MonthStatus) {
    if (!this.selectedFinYear || this.syncing) return;
    const monthName = this.getMonthName(ms.month);
    if (!confirm(`Sync ${monthName} (Period ${ms.month}) for ${this.selectedFinYear}?\n\nThis will download GL data for this month only.`)) return;

    this.syncing = true;
    this.syncMessage = '';
    this.syncPhase = 'general_ledger';
    this.tbSyncedLive = 0;
    this.liveProgress = [];
    this.cdr.markForCheck();

    this.api.post<any>('/platinum/sync/general-ledger', {
      finYear: this.selectedFinYear,
      months: [ms.month]
    }).subscribe({
      next: (res) => {
        if (res?.started) {
          this.syncMessage = res.message;
          this.syncSuccess = true;
          this.startProgressPolling();
        } else {
          this.syncMessage = res?.message || 'Sync already running';
          this.syncSuccess = false;
          this.syncing = false;
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.syncing = false;
        const status = err?.status;
        const msg = err?.error?.message;
        if (status === 401 || status === 403) {
          this.syncMessage = 'Session expired — please log in again to sync';
        } else if (status === 0 || status === 502 || status === 504) {
          this.syncMessage = 'Server unavailable — please wait a moment and try again';
        } else {
          this.syncMessage = msg || `Sync request failed (HTTP ${status || 'unknown'})`;
        }
        this.syncSuccess = false;
        this.cdr.markForCheck();
      }
    });
  }

  getMonthName(month: number): string { return MONTH_NAMES[month] || `Period ${month}`; }
  getSyncedMonthCount(): number { return this.monthStatuses.filter(m => m.status === 'synced').length; }
  getStaleCount(): number { return this.monthStatuses.filter(m => m.status === 'stale' || m.status === 'never').length; }

  getCompletedCount(): number { return this.liveProgress.filter(m => m.status === 'completed').length; }
  getLiveTotal(): number { return this.liveProgress.length; }
  getLiveSyncedEntries(): number { return this.liveProgress.filter(m => m.status !== 'skipped').reduce((s, m) => s + m.entriesSynced, 0); }
  getLiveSkippedCount(): number { return this.liveProgress.filter(m => m.status === 'skipped').length; }

  getOverallPercent(): number {
    if (this.liveProgress.length === 0) return 0;
    const totalExpected = this.liveProgress.reduce((s, m) => s + (m.totalEntries || 0), 0);
    if (totalExpected === 0) return 0;
    const totalSynced = this.liveProgress.reduce((s, m) => s + (m.entriesSynced || 0), 0);
    return Math.min(100, Math.round((totalSynced / totalExpected) * 100));
  }

  getTotalExpectedEntries(): number {
    return this.liveProgress.reduce((s, m) => s + (m.totalEntries || 0), 0);
  }

  getTotalSyncedEntries(): number {
    return this.liveProgress.reduce((s, m) => s + (m.entriesSynced || 0), 0);
  }

  getMonthPercent(mp: LiveMonthProgress): number {
    if (!mp.totalEntries || mp.totalEntries === 0) return 0;
    return Math.min(100, Math.round((mp.entriesSynced / mp.totalEntries) * 100));
  }

  getLiveStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      completed: 'Done', in_progress: 'Syncing', failed: 'Failed', skipped: 'Skipped', pending: 'Waiting'
    };
    return labels[status] || status;
  }

  getDiffLabel(ms: MonthStatus): string {
    const diff = ms.apiEntryCount - ms.localEntryCount;
    if (diff > 0) return `+${diff.toLocaleString()} in API`;
    return `${Math.abs(diff).toLocaleString()} fewer in API`;
  }

  formatTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    const secs = Math.round(ms / 1000);
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  }

  loadEmsStatus() {
    this.api.get<Array<{ table: string; count: number }>>('/ems-data/status').subscribe({
      next: (statuses) => {
        if (this.emsStatuses.length === 0) {
          this.emsStatuses = (statuses || []).map(s => ({
            ...s,
            syncing: false,
            lastResult: undefined,
            lastError: undefined,
          }));
        } else {
          for (const s of (statuses || [])) {
            const existing = this.emsStatuses.find(e => e.table === s.table);
            if (existing) {
              existing.count = s.count;
            } else {
              this.emsStatuses.push({ ...s, syncing: false, lastResult: undefined, lastError: undefined });
            }
          }
        }
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  getEmsLoadedCount(): number {
    return this.emsStatuses.filter(e => e.count > 0).length;
  }

  getTotalEmsRows(): number {
    return this.emsStatuses.reduce((s, e) => s + e.count, 0);
  }

  syncOneEms(ems: EmsTableStatus) {
    ems.syncing = true;
    ems.lastResult = undefined;
    ems.lastError = undefined;
    this.cdr.markForCheck();

    this.api.post<any>(`/ems-data/sync/${ems.table}`, {}).subscribe({
      next: (res) => {
        ems.syncing = false;
        ems.count = res?.inserted || res?.fetched || ems.count;
        ems.lastResult = `${res?.fetched || 0} rows`;
        ems.lastError = res?.error || undefined;
        this.cdr.markForCheck();
        this.loadEmsStatus();
      },
      error: (err) => {
        ems.syncing = false;
        ems.lastError = err?.error?.message || 'Sync failed';
        this.cdr.markForCheck();
      }
    });
  }

  private loadPostSyncValidation() {
    this.api.get<any[]>('/validation-rules/results?context=gl_sync&limit=50').subscribe({
      next: (results) => {
        this.postSyncValidation = (results || []).map((r: any) => ({
          ruleId: r.ruleId || r.id || '',
          ruleName: r.ruleName || r.rule?.name || r.rule?.code || 'Rule',
          status: r.status || 'pass',
          message: r.message || '',
        }));
        this.postSyncPassCount = this.postSyncValidation.filter(r => r.status === 'pass').length;
        this.postSyncFailCount = this.postSyncValidation.filter(r => r.status === 'fail').length;
        this.postSyncWarnCount = this.postSyncValidation.filter(r => r.status === 'warning').length;
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  syncAllEms() {
    if (!confirm('Sync all Platinum mirror tables from the ART API?\n\nThis may take several minutes. Progress will be shown live.')) return;

    this.emsSyncing = true;
    this.emsSyncMessage = '';
    this.emsSyncPartial = false;
    this.emsSyncProgressTotal = 0;
    this.emsSyncProgressDone = 0;
    this.emsSyncCurrentTable = '';
    this.emsStatuses.forEach(e => { e.syncing = true; e.lastResult = undefined; e.lastError = undefined; });
    this.cdr.markForCheck();

    this.api.post<any>('/ems-data/sync', {}).subscribe({
      next: (progress) => {
        this.emsSyncProgressTotal = progress?.totalTables || 0;
        this.emsSyncProgressDone = progress?.completedTables || 0;
        this.emsSyncCurrentTable = progress?.currentTable || '';
        this.cdr.markForCheck();
        this._startEmsSyncPolling();
      },
      error: (err) => {
        this.emsSyncing = false;
        this.emsStatuses.forEach(e => e.syncing = false);
        this.emsSyncMessage = err?.error?.message || 'Failed to start Platinum sync';
        this.emsSyncSuccess = false;
        this.emsSyncPartial = false;
        this.cdr.markForCheck();
      }
    });
  }

  private _startEmsSyncPolling() {
    if (this.emsPollTimer) clearInterval(this.emsPollTimer);
    this.emsPollErrors = 0;
    this.emsPollTimer = setInterval(() => {
      this.api.get<any>('/ems-data/sync/progress').subscribe({
        next: (progress) => {
          this.emsPollErrors = 0;
          this.emsSyncProgressTotal = progress?.totalTables || 0;
          this.emsSyncProgressDone = progress?.completedTables || 0;
          this.emsSyncCurrentTable = progress?.currentTable || '';

          const results = progress?.results || [];
          for (const r of results) {
            const ems = this.emsStatuses.find(e => e.table === r.table);
            if (ems) {
              ems.syncing = false;
              ems.count = r.inserted || r.fetched || 0;
              ems.lastResult = `${r.fetched || 0} rows`;
              ems.lastError = r.error || undefined;
            }
          }

          if (!progress?.running) {
            this._stopEmsSyncPolling();
            this.emsSyncing = false;
            this.emsStatuses.forEach(e => e.syncing = false);
            const succeeded = results.filter((r: any) => !r.error).length;
            const errors = results.filter((r: any) => r.error).length;
            const totalInserted = results.reduce((s: number, r: any) => s + (r.inserted || 0), 0);

            if (errors === 0) {
              this.emsSyncMessage = `Platinum sync complete: ${totalInserted.toLocaleString()} rows inserted across ${results.length} tables`;
              this.emsSyncSuccess = true;
              this.emsSyncPartial = false;
            } else if (succeeded > 0) {
              this.emsSyncMessage = `Platinum sync complete: ${succeeded} tables synced (${totalInserted.toLocaleString()} rows), ${errors} tables had errors`;
              this.emsSyncSuccess = false;
              this.emsSyncPartial = true;
            } else {
              this.emsSyncMessage = `Platinum sync failed: all ${errors} tables had errors (ART API may be down)`;
              this.emsSyncSuccess = false;
              this.emsSyncPartial = false;
            }
            this.loadEmsStatus();
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.emsPollErrors++;
          if (this.emsPollErrors >= 5) {
            this._stopEmsSyncPolling();
            this.emsSyncing = false;
            this.emsStatuses.forEach(e => e.syncing = false);
            this.emsSyncMessage = 'Lost connection to server while syncing. Sync may still be running in the background — refresh the page to check.';
            this.emsSyncSuccess = false;
            this.emsSyncPartial = false;
            this.cdr.markForCheck();
          }
        }
      });
    }, 3000);
  }

  private _stopEmsSyncPolling() {
    if (this.emsPollTimer) {
      clearInterval(this.emsPollTimer);
      this.emsPollTimer = null;
    }
  }
}
