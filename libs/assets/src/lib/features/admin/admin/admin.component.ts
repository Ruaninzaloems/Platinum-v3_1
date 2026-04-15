import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/api.service';
import { OrgSettingsService } from '../../../core/org-settings.service';
import { DatabaseToggleService, DatabaseBackend, SHARED_TABLES, SharedTable } from '../../../core/database-toggle.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTabsModule, MatProgressSpinnerModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  users = signal<any[]>([]);
  settings = signal<any>(null);
  loadingUsers = signal(true);
  editingSettings = signal(false);
  savingSettings = signal(false);
  settingsSaved = signal(false);

  sharedTables = SHARED_TABLES;
  tableCategories = [...new Set(SHARED_TABLES.map(function(t) { return t.category; }))];

  settingsForm: any = {};

  financialYearOptions = [
    '2022/2023', '2023/2024', '2024/2025', '2025/2026', '2026/2027', '2027/2028'
  ];

  periodMonths = [
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
    public dbToggle: DatabaseToggleService
  ) {}

  ngOnInit() {
    this.api.getUsers().subscribe({ next: u => { this.users.set(u); this.loadingUsers.set(false); }, error: () => this.loadingUsers.set(false) });
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
      }
    }, 500);
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

  startEditSettings() {
    const s = this.settings();
    this.settingsForm = {
      municipality_name: s.municipality_name || '',
      financial_year: s.financial_year || '2025/2026',
      current_period: s.current_period || 9,
      current_period_month: s.current_period_month || s.current_period || 9,
      mscoa_enabled: s.mscoa_enabled !== false,
      measurement_model: s.measurement_model || 'Cost',
      approval_method: s.approval_method || 'Manual',
    };
    this.editingSettings.set(true);
    this.settingsSaved.set(false);
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

  saveSettings() {
    this.savingSettings.set(true);
    const payload = {
      municipalityName: this.settingsForm.municipality_name,
      financialYear: this.settingsForm.financial_year,
      financialYearStartMonth: 7,
      currentPeriod: Number(this.settingsForm.current_period_month),
      currentPeriodMonth: Number(this.settingsForm.current_period_month),
      mscoaEnabled: this.settingsForm.mscoa_enabled,
      measurementModel: this.settingsForm.measurement_model,
      approvalMethod: this.settingsForm.approval_method,
    };
    var self = this;
    this.orgSettings.save(payload).subscribe({
      next: function(result: any) {
        self.settings.set(result);
        if (result) {
          self.orgSettings.settings.set(result);
        }
        self.savingSettings.set(false);
        self.settingsSaved.set(true);
        self.editingSettings.set(false);
      },
      error: function() { self.savingSettings.set(false); }
    });
  }
}
