import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { FinancialYear } from '../../core/models/interfaces';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  users = signal<any[]>([]);
  roles = signal<any[]>([]);
  financialYears = signal<FinancialYear[]>([]);
  configItems = signal<any[]>([]);
  showUserForm = signal(false);
  creatingUser = signal(false);
  seedingFY = signal(false);

  spConfig = signal<any>({ enabled: false, environmentEnabled: false, metadataColumns: [], folderStructure: {} });
  spTestResult = signal<any>(null);
  spMigrationResult = signal<any>(null);
  spTesting = signal(false);
  spSaving = signal(false);
  spMigrating = signal(false);
  spFolderEntries = computed(() => {
    const fs = this.spConfig().folderStructure || {};
    return Object.keys(fs).map(key => ({ key, value: fs[key] }));
  });

  spSiteUrl = '';
  spDocLibrary = '';

  apiSetup = signal<any>({ platinumApiUrl: '', artApiUrl: '', availableApis: [] });
  apiSaving = signal(false);
  apiTestingPlatinum = signal(false);
  apiTestingArt = signal(false);
  apiTestResultPlatinum = signal<any>(null);
  apiTestResultArt = signal<any>(null);
  apiSelectedPreset = '';
  apiPlatinumUrl = '';
  apiArtUrl = '';

  emailConfig = signal<any>({ smtpHost: '', port: 587, encryptionMethod: 'tls', senderAddress: '', hasPassword: false, displayedName: '', enabled: false, lastTestedAt: null, lastTestedBy: null, lastTestStatus: null, lastTestErrorSummary: null });
  emailSaving = signal(false);
  emailTesting = signal(false);
  emailTestResult = signal<any>(null);
  emailShowPassword = signal(false);
  emailDirty = signal(false);

  emailSmtpHost = '';
  emailPort = 587;
  emailEncryptionMethod = 'tls';
  emailSenderAddress = '';
  emailPassword = '';
  emailDisplayedName = '';

  newUser = { firstName: '', lastName: '', email: '', password: '', roles: [] as string[] };
  newConfigKey = '';
  newConfigValue = '';

  ngOnInit() {
    this.loadUsers();
    this.loadRoles();
    this.loadFinancialYears();
    this.loadConfig();
    this.loadSharePointConfig();
    this.loadEmailConfig();
    this.loadApiSetup();
  }

  navigateToRulesEngine() {
    this.router.navigate(['/admin/validation-rules']);
  }

  loadUsers() {
    this.api.get<any[]>('/admin/users').subscribe({
      next: (data) => this.users.set(data),
    });
  }

  loadRoles() {
    this.api.get<any[]>('/admin/roles').subscribe({
      next: (data) => this.roles.set(data),
    });
  }

  loadFinancialYears() {
    this.api.get<FinancialYear[]>('/admin/financial-years').subscribe({
      next: (data) => this.financialYears.set(data),
    });
  }

  loadConfig() {
    this.api.get<any[]>('/admin/config').subscribe({
      next: (data) => this.configItems.set(Array.isArray(data) ? data : []),
    });
  }

  createUser() {
    if (!this.newUser.email || !this.newUser.firstName || !this.newUser.password) {
      this.snackBar.open('Please fill in all required fields (First Name, Email, Password)', 'Close', { duration: 4000 });
      return;
    }

    this.creatingUser.set(true);
    const payload = {
      firstName: this.newUser.firstName,
      lastName: this.newUser.lastName,
      email: this.newUser.email,
      password: this.newUser.password,
      roleNames: this.newUser.roles,
      tenantId: this.auth.user()?.tenantId || '',
    };

    this.api.post('/admin/users', payload).subscribe({
      next: () => {
        this.creatingUser.set(false);
        this.showUserForm.set(false);
        this.newUser = { firstName: '', lastName: '', email: '', password: '', roles: [] };
        this.loadUsers();
        this.snackBar.open('User created successfully. A welcome email has been sent with login details.', 'Close', { duration: 5000 });
      },
      error: (err) => {
        this.creatingUser.set(false);
        const message = err?.error?.message || err?.message || 'Failed to create user. Please try again.';
        this.snackBar.open(Array.isArray(message) ? message.join(', ') : message, 'Close', { duration: 6000 });
      },
    });
  }

  toggleUserActive(userId: string) {
    this.api.post(`/admin/users/${userId}/toggle-active`).subscribe({
      next: () => this.loadUsers(),
    });
  }

  seedFinancialYear() {
    this.seedingFY.set(true);
    this.api.get('/admin/financial-years/seed').subscribe({
      next: () => {
        this.seedingFY.set(false);
        this.loadFinancialYears();
      },
      error: () => this.seedingFY.set(false),
    });
  }

  saveConfig() {
    this.api.post('/admin/config', { key: this.newConfigKey, value: this.newConfigValue }).subscribe({
      next: () => {
        this.newConfigKey = '';
        this.newConfigValue = '';
        this.loadConfig();
      },
    });
  }

  loadSharePointConfig() {
    this.api.get<any>('/admin/sharepoint/config').subscribe({
      next: (data) => {
        this.spConfig.set(data);
        this.spSiteUrl = data.siteUrl || '';
        this.spDocLibrary = data.documentLibrary || '';
      },
      error: () => {},
    });
  }

  saveSharePointConfig() {
    this.spSaving.set(true);
    this.api.post('/admin/sharepoint/config', {
      siteUrl: this.spSiteUrl,
      documentLibrary: this.spDocLibrary,
      folderStructure: this.spConfig().folderStructure,
      enabled: this.spConfig().enabled,
    }).subscribe({
      next: () => {
        this.spSaving.set(false);
        this.loadSharePointConfig();
      },
      error: () => this.spSaving.set(false),
    });
  }

  toggleSharePoint(enabled: boolean) {
    this.spConfig.update(c => ({ ...c, enabled }));
  }

  testSharePointConnection() {
    this.spTesting.set(true);
    this.spTestResult.set(null);
    this.api.post<any>('/admin/sharepoint/test').subscribe({
      next: (result) => {
        this.spTesting.set(false);
        this.spTestResult.set(result);
      },
      error: () => {
        this.spTesting.set(false);
        this.spTestResult.set({ success: false, message: 'Connection test failed. Check your configuration.' });
      },
    });
  }

  migrateToSharePoint() {
    this.spMigrating.set(true);
    this.spMigrationResult.set(null);
    this.api.post<any>('/admin/sharepoint/migrate').subscribe({
      next: (result) => {
        this.spMigrating.set(false);
        this.spMigrationResult.set(result);
      },
      error: () => {
        this.spMigrating.set(false);
        this.spMigrationResult.set({ success: false, message: 'Migration failed. Check configuration and try again.' });
      },
    });
  }

  loadApiSetup() {
    this.api.get<any>('/admin/api-setup').subscribe({
      next: (data) => {
        this.apiSetup.set(data);
        this.apiPlatinumUrl = data.platinumApiUrl || '';
        this.apiArtUrl = data.artApiUrl || '';
        const match = (data.availableApis || []).find((a: any) => a.platinumApiUrl === this.apiPlatinumUrl);
        this.apiSelectedPreset = match ? match.platinumApiUrl : 'custom';
      },
      error: () => {},
    });
  }

  onApiPresetChange() {
    if (this.apiSelectedPreset && this.apiSelectedPreset !== 'custom') {
      this.apiPlatinumUrl = this.apiSelectedPreset;
    }
    this.apiTestResultPlatinum.set(null);
  }

  saveApiSetup() {
    this.apiSaving.set(true);
    this.api.put('/admin/api-setup', {
      platinumApiUrl: this.apiPlatinumUrl,
      artApiUrl: this.apiArtUrl,
    }).subscribe({
      next: () => {
        this.apiSaving.set(false);
        this.snackBar.open('API configuration saved. Restart the backend for changes to take effect.', 'Close', { duration: 5000 });
        this.loadApiSetup();
      },
      error: () => {
        this.apiSaving.set(false);
        this.snackBar.open('Failed to save API configuration', 'Close', { duration: 4000 });
      },
    });
  }

  testApiConnection(url: string, apiType: string) {
    const testing = apiType === 'art' ? this.apiTestingArt : this.apiTestingPlatinum;
    const result = apiType === 'art' ? this.apiTestResultArt : this.apiTestResultPlatinum;
    testing.set(true);
    result.set(null);
    this.api.post<any>('/admin/api-setup/test', { url, apiType }).subscribe({
      next: (r) => {
        testing.set(false);
        result.set(r);
      },
      error: () => {
        testing.set(false);
        result.set({ success: false, message: 'Connection test failed. Check the URL and try again.' });
      },
    });
  }

  loadEmailConfig(preserveTestResult = false) {
    this.api.get<any>('/admin/email-config').subscribe({
      next: (data) => {
        this.emailConfig.set(data);
        this.emailSmtpHost = data.smtpHost || '';
        this.emailPort = data.port || 587;
        this.emailEncryptionMethod = data.encryptionMethod || 'tls';
        this.emailSenderAddress = data.senderAddress || '';
        this.emailDisplayedName = data.displayedName || '';
        this.emailPassword = '';
        this.emailDirty.set(false);
        if (!preserveTestResult) {
          this.emailTestResult.set(null);
        }
      },
      error: () => {},
    });
  }

  markEmailDirty() {
    this.emailDirty.set(true);
  }

  onEmailEncryptionChange() {
    this.markEmailDirty();
    if (this.emailEncryptionMethod === 'ssl' && this.emailPort === 587) {
      this.emailPort = 465;
    } else if (this.emailEncryptionMethod === 'tls' && this.emailPort === 465) {
      this.emailPort = 587;
    }
  }

  toggleEmailEnabled(enabled: boolean) {
    this.emailConfig.update(c => ({ ...c, enabled }));
    this.api.put('/admin/email-config', { enabled }).subscribe({
      next: () => {
        this.snackBar.open(enabled ? 'Tenant email delivery enabled.' : 'Tenant email delivery disabled.', 'Close', { duration: 3000 });
        this.loadEmailConfig();
      },
      error: (err: any) => {
        this.emailConfig.update(c => ({ ...c, enabled: !enabled }));
        this.snackBar.open(err?.error?.message || 'Failed to update email status.', 'Close', { duration: 5000 });
      },
    });
  }

  saveEmailConfig() {
    this.emailSaving.set(true);
    const payload: any = {
      smtpHost: this.emailSmtpHost,
      port: this.emailPort,
      encryptionMethod: this.emailEncryptionMethod,
      senderAddress: this.emailSenderAddress,
      displayedName: this.emailDisplayedName,
      enabled: this.emailConfig().enabled,
    };
    if (this.emailPassword) {
      payload.password = this.emailPassword;
    }
    this.api.put('/admin/email-config', payload).subscribe({
      next: () => {
        this.emailSaving.set(false);
        this.snackBar.open('Email configuration saved successfully.', 'Close', { duration: 4000 });
        this.loadEmailConfig();
      },
      error: (err) => {
        this.emailSaving.set(false);
        this.snackBar.open(err?.error?.message || 'Failed to save email configuration.', 'Close', { duration: 5000 });
      },
    });
  }

  cancelEmailChanges() {
    this.loadEmailConfig();
  }

  testEmailConfig() {
    this.emailTesting.set(true);
    this.emailTestResult.set(null);
    const payload: any = {
      smtpHost: this.emailSmtpHost,
      port: this.emailPort,
      encryptionMethod: this.emailEncryptionMethod,
      senderAddress: this.emailSenderAddress,
      displayedName: this.emailDisplayedName,
    };
    if (this.emailPassword) {
      payload.password = this.emailPassword;
    }
    this.api.post<any>('/admin/email-config/test', payload).subscribe({
      next: (result) => {
        this.emailTesting.set(false);
        this.emailTestResult.set(result);
        this.loadEmailConfig(true);
      },
      error: (err) => {
        this.emailTesting.set(false);
        this.emailTestResult.set({ success: false, message: err?.error?.message || 'Test failed. Check your configuration.' });
      },
    });
  }
}
