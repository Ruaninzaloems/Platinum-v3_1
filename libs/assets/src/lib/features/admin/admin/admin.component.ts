import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../../core/api.service';
import { OrgSettingsService } from '../../../core/org-settings.service';
import { DatabaseToggleService, DatabaseBackend, SHARED_TABLES, SharedTable } from '../../../core/database-toggle.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTabsModule, MatProgressSpinnerModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit, OnDestroy {
  users = signal<any[]>([]);
  settings = signal<any>(null);
  loadingUsers = signal(true);

  glUseInbox = signal<boolean>(true);
  savingGlUseInbox = signal(false);
  glUseInboxSaved = signal(false);

  glLedTarget = signal<string>('postgresql');
  savingGlLedTarget = signal(false);
  glLedTargetSaved = signal(false);

  mscoaUseDeptDivision = signal<boolean>(true);
  savingMscoaUseDeptDivision = signal(false);
  mscoaUseDeptDivisionSaved = signal(false);

  measurementModel = signal<string>('Mixed');
  savingMeasurementModel = signal(false);
  measurementModelSaved = signal(false);
  measurementModelError = signal('');
  pendingTargetModel = signal('');

  showBulkFixModal = signal(false);
  bulkFixLoading = signal(false);
  bulkFixConflicts = signal<any[]>([]);
  bulkFixCompatibleTypes = signal<any[]>([]);
  bulkFixSelectedTypeId = signal<number>(0);
  bulkFixApplying = signal(false);
  bulkFixError = signal('');
  bulkFixTargetModel = signal('');

  populatingSummary = signal(false);
  populateSummaryResult = signal<any>(null);
  populateSummaryError = signal('');
  populateProgress = signal<{ done: number; total: number; percent: number } | null>(null);
  populateSummaryAssetId = '';
  private _populatePollTimer: any = null;

  emailSettingsForm: any = { smtp_host: '', smtp_port: 587, from_name: '', from_email: '', smtp_username: '', smtp_password: '', use_tls: 1 };
  savingEmailSettings = signal(false);
  emailSettingsSaved = signal(false);
  emailSettingsError = signal('');
  testEmailAddr = signal('');
  testingEmail = signal(false);
  testEmailResult = signal('');
  testEmailError = signal('');

  sharedTables = SHARED_TABLES;
  tableCategories = [...new Set(SHARED_TABLES.map(function(t) { return t.category; }))];

  private readonly periodMonths = [
    { value: 1, label: 'July' },
    { value: 2, label: 'August' },
    { value: 3, label: 'September' },
    { value: 4, label: 'October' },
    { value: 5, label: 'November' },
    { value: 6, label: 'December' },
    { value: 7, label: 'January' },
    { value: 8, label: 'February' },
    { value: 9, label: 'March' },
    { value: 10, label: 'April' },
    { value: 11, label: 'May' },
    { value: 12, label: 'June' },
  ];

  constructor(
    private api: ApiService,
    private orgSettings: OrgSettingsService,
    public dbToggle: DatabaseToggleService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.api.getUsers().subscribe({ next: u => { this.users.set(u); this.loadingUsers.set(false); }, error: () => this.loadingUsers.set(false) });
    this.loadEmailSettings();
    var cached = this.orgSettings.settings();
    if (cached) {
      this.settings.set(cached);
    }
    var self = this;
    this.orgSettings.load();
    setTimeout(function() {
      var s = self.orgSettings.settings();
      if (s) {
        self.settings.set(s);
        if (!self.savingGlUseInbox() && !self.glUseInboxSaved()) {
          self.glUseInbox.set(s.gl_use_inbox === true);
        }
        if (!self.savingGlLedTarget() && !self.glLedTargetSaved()) {
          self.glLedTarget.set(s.gl_led_target || 'postgresql');
        }
        if (!self.savingMscoaUseDeptDivision() && !self.mscoaUseDeptDivisionSaved()) {
          self.mscoaUseDeptDivision.set(s.mscoa_use_dept_division !== false);
        }
        if (!self.savingMeasurementModel() && !self.measurementModelSaved()) {
          self.measurementModel.set(s.measurement_model || 'Mixed');
        }
      }
    }, 500);
  }

  ngOnDestroy() {
    if (this._populatePollTimer) { clearInterval(this._populatePollTimer); this._populatePollTimer = null; }
  }

  saveGlUseInbox() {
    this.savingGlUseInbox.set(true);
    this.glUseInboxSaved.set(false);
    var self = this;
    this.orgSettings.save({ glUseInbox: this.glUseInbox() }).subscribe({
      next: function(result: any) {
        if (result) {
          self.settings.set(result);
          self.orgSettings.settings.set(result);
          self.glUseInbox.set(result.gl_use_inbox === true);
        }
        self.savingGlUseInbox.set(false);
        self.glUseInboxSaved.set(true);
        setTimeout(function() { self.glUseInboxSaved.set(false); }, 3000);
      },
      error: function() { self.savingGlUseInbox.set(false); }
    });
  }

  saveGlLedTarget() {
    this.savingGlLedTarget.set(true);
    this.glLedTargetSaved.set(false);
    var self = this;
    this.orgSettings.save({ glLedTarget: this.glLedTarget() }).subscribe({
      next: function(result: any) {
        if (result) {
          self.settings.set(result);
          self.orgSettings.settings.set(result);
          self.glLedTarget.set(result.gl_led_target || 'postgresql');
        }
        self.savingGlLedTarget.set(false);
        self.glLedTargetSaved.set(true);
        setTimeout(function() { self.glLedTargetSaved.set(false); }, 3000);
      },
      error: function() { self.savingGlLedTarget.set(false); }
    });
  }

  saveMscoaUseDeptDivision() {
    this.savingMscoaUseDeptDivision.set(true);
    this.mscoaUseDeptDivisionSaved.set(false);
    var self = this;
    this.orgSettings.save({ mscoaUseDeptDivision: this.mscoaUseDeptDivision() }).subscribe({
      next: function(result: any) {
        if (result) {
          self.settings.set(result);
          self.orgSettings.settings.set(result);
          self.mscoaUseDeptDivision.set(result.mscoa_use_dept_division !== false);
        }
        self.savingMscoaUseDeptDivision.set(false);
        self.mscoaUseDeptDivisionSaved.set(true);
        setTimeout(function() { self.mscoaUseDeptDivisionSaved.set(false); }, 3000);
      },
      error: function() { self.savingMscoaUseDeptDivision.set(false); }
    });
  }

  saveMeasurementModel() {
    this.savingMeasurementModel.set(true);
    this.measurementModelSaved.set(false);
    this.measurementModelError.set('');
    this.pendingTargetModel.set('');
    var self = this;
    var targetModel = this.measurementModel();
    this.orgSettings.save({ measurementModel: targetModel }).subscribe({
      next: function(result: any) {
        if (result) {
          self.settings.set(result);
          self.orgSettings.settings.set(result);
          self.measurementModel.set(result.measurement_model || targetModel);
        }
        self.savingMeasurementModel.set(false);
        self.measurementModelSaved.set(true);
        setTimeout(function() { self.measurementModelSaved.set(false); }, 3000);
      },
      error: function(err: any) {
        self.savingMeasurementModel.set(false);
        var msg = err?.error?.error || 'Failed to update Measurement Model.';
        self.measurementModelError.set(msg);
        var isConflict = msg.indexOf('Cannot switch') !== -1;
        if (isConflict && (targetModel === 'Cost' || targetModel === 'Revaluation')) {
          self.pendingTargetModel.set(targetModel);
        }
        setTimeout(function() { self.measurementModelError.set(''); }, 10000);
      }
    });
  }

  openBulkFix() {
    var targetModel = this.pendingTargetModel();
    if (!targetModel) return;
    this.bulkFixTargetModel.set(targetModel);
    this.showBulkFixModal.set(true);
    this.bulkFixLoading.set(true);
    this.bulkFixConflicts.set([]);
    this.bulkFixCompatibleTypes.set([]);
    this.bulkFixSelectedTypeId.set(0);
    this.bulkFixError.set('');
    var self = this;
    this.http.get<any>(`${this.dbToggle.apiPrefix}/settings/measurement-model-conflicts?targetModel=${encodeURIComponent(targetModel)}`).subscribe({
      next: function(data: any) {
        self.bulkFixLoading.set(false);
        self.bulkFixConflicts.set(data.conflicts || []);
        self.bulkFixCompatibleTypes.set(data.compatibleTypes || []);
        if (data.compatibleTypes && data.compatibleTypes.length > 0) {
          self.bulkFixSelectedTypeId.set(data.compatibleTypes[0].measurementTypeId);
        }
      },
      error: function(err: any) {
        self.bulkFixLoading.set(false);
        self.bulkFixError.set(err?.error?.error || 'Failed to load conflict data.');
      }
    });
  }

  closeBulkFix() {
    this.showBulkFixModal.set(false);
    this.bulkFixTargetModel.set('');
    this.bulkFixConflicts.set([]);
    this.bulkFixCompatibleTypes.set([]);
    this.bulkFixSelectedTypeId.set(0);
    this.bulkFixError.set('');
  }

  applyBulkFix() {
    var targetModel = this.bulkFixTargetModel();
    var replacementId = this.bulkFixSelectedTypeId();
    if (!targetModel || !replacementId) return;
    this.bulkFixApplying.set(true);
    this.bulkFixError.set('');
    var self = this;
    this.http.post<any>(`${this.dbToggle.apiPrefix}/settings/bulk-reassign-measurement-type`, {
      targetModel: targetModel,
      replacementMeasurementTypeId: replacementId
    }).subscribe({
      next: function(result: any) {
        self.bulkFixApplying.set(false);
        self.showBulkFixModal.set(false);
        self.bulkFixTargetModel.set('');
        self.measurementModelError.set('');
        self.pendingTargetModel.set('');
        if (result.settings) {
          self.settings.set(result.settings);
          self.orgSettings.settings.set(result.settings);
          self.measurementModel.set(result.settings.measurement_model || 'Mixed');
        }
        self.measurementModelSaved.set(true);
        setTimeout(function() { self.measurementModelSaved.set(false); }, 3000);
      },
      error: function(err: any) {
        self.bulkFixApplying.set(false);
        self.bulkFixError.set(err?.error?.error || 'Failed to apply bulk reassignment.');
      }
    });
  }

  getCurrentPeriodMonth(): number {
    const s = this.settings();
    return s?.settings?.current_period_month || s?.current_period_month || 6;
  }

  getCurrentPeriodMonthName(): string {
    const month = this.getCurrentPeriodMonth();
    const found = this.periodMonths.find(p => p.value === month);
    return found ? found.label : 'Unknown';
  }

  getTablesInCategory(category: string): SharedTable[] {
    return this.sharedTables.filter(function(t) { return t.category === category; });
  }

  getEffectiveBackend(tableKey: string): DatabaseBackend {
    return this.dbToggle.getTableBackend(tableKey);
  }

  hasOverride(tableKey: string): boolean {
    return tableKey in this.dbToggle.tableOverrides();
  }

  setGlobalBackend(backend: DatabaseBackend): void {
    this.dbToggle.setBackend(backend);
  }

  setTableSource(tableKey: string, value: string): void {
    if (value === 'inherit') {
      this.dbToggle.setTableBackend(tableKey, 'inherit');
    } else {
      this.dbToggle.setTableBackend(tableKey, value as DatabaseBackend);
    }
  }

  resetAllTableSources(): void {
    this.dbToggle.resetTableOverrides();
  }

  populateSummary() {
    this.populatingSummary.set(true);
    this.populateSummaryResult.set(null);
    this.populateSummaryError.set('');
    this.populateProgress.set(null);
    if (this._populatePollTimer) { clearInterval(this._populatePollTimer); this._populatePollTimer = null; }
    var self = this;
    var s = this.settings();
    var finYear: string | undefined = s?.financial_year;
    var finPeriod = 1;
    var assetId = this.populateSummaryAssetId ? parseInt(this.populateSummaryAssetId, 10) : null;
    this.api.populateSummaryAll(finYear, finPeriod, assetId).subscribe({
      next: function(res: any) {
        var jobId: string = res?.jobId;
        if (!jobId) {
          self.populatingSummary.set(false);
          self.populateSummaryResult.set(res);
          return;
        }
        var consecutiveErrors = 0;
        self._populatePollTimer = setInterval(function() {
          self.api.getPopulateSummaryProgress(jobId).subscribe({
            next: function(prog: any) {
              consecutiveErrors = 0;
              self.populateProgress.set({ done: prog.done, total: prog.total, percent: prog.percent });
              if (prog.finished) {
                clearInterval(self._populatePollTimer);
                self._populatePollTimer = null;
                self.populatingSummary.set(false);
                self.populateProgress.set(null);
                if (prog.error) {
                  self.populateSummaryError.set(prog.error);
                } else {
                  self.populateSummaryResult.set(prog.result);
                }
              }
            },
            error: function() {
              consecutiveErrors++;
              if (consecutiveErrors >= 5) {
                clearInterval(self._populatePollTimer);
                self._populatePollTimer = null;
                self.populatingSummary.set(false);
                self.populateProgress.set(null);
                self.populateSummaryError.set('Lost contact with the server while tracking progress. The operation may still be running.');
              }
            }
          });
        }, 1000);
      },
      error: function(err: any) {
        self.populatingSummary.set(false);
        self.populateSummaryError.set(err?.error?.error || err?.message || 'Failed to populate summary');
      }
    });
  }

  loadEmailSettings() {
    var self = this;
    this.api.getEmailSettings().subscribe({
      next: function(data: any) {
        if (data) {
          self.emailSettingsForm = { ...data, smtp_password: '' };
        }
      },
      error: function() {}
    });
  }

  saveEmailSettings() {
    this.savingEmailSettings.set(true);
    this.emailSettingsSaved.set(false);
    this.emailSettingsError.set('');
    var self = this;
    this.api.saveEmailSettings(this.emailSettingsForm).subscribe({
      next: function(data: any) {
        if (data) {
          self.emailSettingsForm = { ...data, smtp_password: '' };
        }
        self.savingEmailSettings.set(false);
        self.emailSettingsSaved.set(true);
        setTimeout(function() { self.emailSettingsSaved.set(false); }, 3000);
      },
      error: function(err: any) {
        self.savingEmailSettings.set(false);
        self.emailSettingsError.set(err?.error?.error || 'Failed to save email settings');
        setTimeout(function() { self.emailSettingsError.set(''); }, 5000);
      }
    });
  }

  testEmailSettings() {
    if (!this.testEmailAddr()) return;
    this.testingEmail.set(true);
    this.testEmailResult.set('');
    this.testEmailError.set('');
    var self = this;
    this.api.testEmailSettings(this.testEmailAddr()).subscribe({
      next: function() {
        self.testingEmail.set(false);
        self.testEmailResult.set('Test email sent successfully.');
        setTimeout(function() { self.testEmailResult.set(''); }, 5000);
      },
      error: function(err: any) {
        self.testingEmail.set(false);
        self.testEmailError.set(err?.error?.error || 'Test email failed');
        setTimeout(function() { self.testEmailError.set(''); }, 8000);
      }
    });
  }

}
