import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';
import { ApiService } from '../core/services/api.service';
import { PeriodFilterService } from '../core/services/period-filter.service';
import { FinancialYear } from '../core/models/interfaces';
import { CopilotPanelComponent } from '../shared/components/copilot-panel.component';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

interface NavGroup {
  label: string;
  icon: string;
  expanded: boolean;
  children: NavItem[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatBadgeModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
    CopilotPanelComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent implements OnInit {
  unreadCount = signal(0);
  currentPageTitle = signal('Dashboard');
  currentPageIcon = signal('dashboard');
  financialYears = signal<FinancialYear[]>([]);
  currentFinancialYear = signal<string>('');
  isEmbedded = signal(false);

  private detectEmbedded(): boolean {
    try { return window.self !== window.top; } catch { return true; }
  }

  topNavItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
  ];

  navGroups: NavGroup[] = [
    {
      label: 'AFS Builder',
      icon: 'description',
      expanded: true,
      children: [
        { label: 'General Information', icon: 'info', route: '/general-information' },
        { label: 'Accounting Policies', icon: 'policy', route: '/accounting-policies' },
        { label: 'Compilations', icon: 'calculate', route: '/compilations' },
        { label: 'Data Sources (TB)', icon: 'table_chart', route: '/tb-import-workbench' },
        { label: 'Opening Balance Control', icon: 'balance', route: '/opening-balance-control' },
        { label: 'Mapping Workbench', icon: 'map', route: '/mapping-workbench' },
        { label: 'Integrity Checks', icon: 'fact_check', route: '/integrity' },
        { label: 'Adjustments', icon: 'tune', route: '/adjustments' },
        { label: 'Versioning & Locking', icon: 'lock', route: '/afs-versions' },
        { label: 'Export Center', icon: 'download', route: '/exports' },
      ]
    },
    {
      label: 'Reference Data',
      icon: 'library_books',
      expanded: false,
      children: [
        { label: 'Template Library', icon: 'library_books', route: '/templates' },
        { label: 'Mapping Studio', icon: 'account_tree', route: '/mappings' },
        { label: 'mSCOA Chart', icon: 'schema', route: '/mscoa' },
        { label: 'Reports & Analytics', icon: 'analytics', route: '/reports' },
      ]
    },
    {
      label: 'Audit Collaboration',
      icon: 'verified_user',
      expanded: false,
      children: [
        { label: 'Working Papers', icon: 'description', route: '/working-papers' },
        { label: 'RFI Management', icon: 'question_answer', route: '/rfis' },
        { label: 'Audit Findings', icon: 'report_problem', route: '/findings' },
        { label: 'Document Management', icon: 'folder_special', route: '/documents' },
      ]
    },
    {
      label: 'System',
      icon: 'settings',
      expanded: false,
      children: [
        { label: 'Administration', icon: 'admin_panel_settings', route: '/admin' },
        { label: 'Rules Engine', icon: 'rule', route: '/admin/validation-rules' },
      ]
    },
  ];

  private routeMap: Record<string, { title: string; icon: string }> = {
    '/dashboard': { title: 'Dashboard', icon: 'dashboard' },
    '/templates': { title: 'Template Library', icon: 'library_books' },
    '/mappings': { title: 'Mapping Studio', icon: 'account_tree' },
    '/compilations': { title: 'Compilations', icon: 'calculate' },
    '/working-papers': { title: 'Working Papers', icon: 'description' },
    '/rfis': { title: 'RFI Management', icon: 'question_answer' },
    '/findings': { title: 'Audit Findings', icon: 'report_problem' },
    '/documents': { title: 'Document Management', icon: 'folder_special' },
    '/evidence': { title: 'Evidence Vault', icon: 'folder_special' },
    '/adjustments': { title: 'Adjustments', icon: 'tune' },
    '/exports': { title: 'Export Center', icon: 'download' },
    '/reports': { title: 'Reports & Analytics', icon: 'analytics' },
    '/mscoa': { title: 'mSCOA Chart of Accounts', icon: 'schema' },
    '/integrity': { title: 'Financial Integrity Checks', icon: 'fact_check' },
    '/abbreviations': { title: 'Abbreviations', icon: 'short_text' },
    '/general-information': { title: 'General Information', icon: 'info' },
    '/accounting-policies': { title: 'Accounting Policies', icon: 'policy' },
    '/admin': { title: 'Administration', icon: 'admin_panel_settings' },
    '/admin/validation-rules': { title: 'Rules Engine', icon: 'rule' },
    '/tb-import-workbench': { title: 'TB Import Workbench', icon: 'table_chart' },
    '/opening-balance-control': { title: 'Opening Balance Control', icon: 'balance' },
    '/mapping-workbench': { title: 'Mapping Workbench', icon: 'map' },
    '/afs-versions': { title: 'Versioning & Locking', icon: 'lock' },
  };

  constructor(
    public auth: AuthService,
    private api: ApiService,
    private router: Router,
    public periodFilter: PeriodFilterService,
  ) {}

  private navTooltips: Record<string, string> = {
    '/dashboard': 'AFS Dashboard — Executive Overview, CFO, Audit, RFI, Findings, and Financial Ratios',
    '/templates': 'Manage AFS templates based on NT specimen formats (Consolidated, Water, Energy)',
    '/mappings': 'Map GL/mSCOA accounts to AFS template line items with AI-assisted suggestions',
    '/compilations': 'Create and manage AFS compilations with drill-through to source data',
    '/mscoa': 'Browse mSCOA v6.9 chart of accounts with 135,870 items across 13 segments',
    '/working-papers': 'Manage audit working papers with tickmarks, cross-references, and sign-off workflow',
    '/rfis': 'Track Requests for Information between auditors and municipality with SLA monitoring',
    '/findings': 'Manage audit findings (Material, Significant, Minor, Observation) with response workflow',
    '/documents': 'Full Document Management System — National Archives Act compliant with classifications, retention, versioning, and integrity verification',
    '/evidence': 'Upload and manage audit evidence documents with SHA-256 integrity verification',
    '/adjustments': 'Create adjustment journals (pre-audit, audit, post-audit) with debit/credit validation',
    '/exports': 'Export AFS to PDF, Excel, or iXBRL format with job queue tracking',
    '/integrity': 'Automated TB/GL integrity validation — balance checks, accounting equation, cross-statement consistency, and data quality with drill-down to source',
    '/reports': 'Financial analytics, trend analysis, budget vs actual, and compliance reporting',
    '/abbreviations': 'Manage abbreviations for the AFS — add, edit, toggle, delete, and seed defaults',
    '/general-information': 'Capture municipality General Information for AFS cover and introductory pages',
    '/accounting-policies': 'Manage GRAP-compliant accounting policies — toggle, edit, approve, and publish for AFS',
    '/admin': 'System administration: users, roles, tenants, financial years, and configuration',
    '/admin/validation-rules': 'Rules Engine — view, edit, and run validation rules for data integrity, NT compliance, and submission readiness',
    '/tb-import-workbench': 'TB Import Workbench — upload, map, validate, and commit Trial Balance data with signed-balance or debit/credit modes',
    '/opening-balance-control': 'Opening Balance Control — verify prior-year closing balances match current-year opening balances, acknowledge exceptions, and confirm the rollforward baseline',
    '/mapping-workbench': 'AFS Mapping & Review Workbench — execute backbone-indexed mapping, reconciliation controls, manual decisions, and reviewer approval',
    '/afs-versions': 'AFS Versioning & Locking — create draft snapshots, freeze compilations, compare versions, and manage the version lifecycle',
  };

  private groupTooltips: Record<string, string> = {
    'AFS Builder': 'AFS compilation workflow — General Information, Accounting Policies, Compilations, Data Sources, Mapping, Integrity, Adjustments, and Export',
    'Reference Data': 'Reference data and analytics — Template Library, Mapping Studio, mSCOA Chart, Reports',
    'Audit Collaboration': 'Audit workflow tools — working papers, RFIs, findings, and document management',
    'System': 'System administration and configuration',
  };

  ngOnInit() {
    this.isEmbedded.set(this.detectEmbedded());
    this.api.waitForBackend().subscribe({
      next: () => {
        this.loadUnreadCount();
        this.loadFinancialYears();
      },
      error: () => {
        this.loadUnreadCount();
        this.loadFinancialYears();
      },
    });
    this.updatePageTitle(this.router.url);

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.updatePageTitle(e.urlAfterRedirects));
  }

  getNavTooltip(route: string): string {
    return this.navTooltips[route] || '';
  }

  getGroupTooltip(label: string): string {
    return this.groupTooltips[label] || '';
  }

  userInitials(): string {
    const user = this.auth.user();
    if (!user) return '?';
    return (
      (user.firstName?.charAt(0) || '') + (user.lastName?.charAt(0) || '')
    ).toUpperCase();
  }

  userName(): string {
    const user = this.auth.user();
    if (!user) return '';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }

  userRole(): string {
    const user = this.auth.user();
    if (!user) return '';
    return user.roles?.[0] || user.designation || '';
  }

  selectFinancialYear(fy: FinancialYear) {
    this.currentFinancialYear.set(fy.label);
    this.periodFilter.selectedFyId.set(fy.id);
    this.periodFilter.selectedFyLabel.set(fy.label);
  }


  logout() {
    this.auth.logout();
  }

  private loadUnreadCount() {
    this.api
      .get<{ count: number }>('/notifications/unread-count')
      .subscribe({
        next: (res) => this.unreadCount.set(res?.count ?? 0),
        error: () => this.unreadCount.set(0),
      });
  }

  private loadFinancialYears() {
    this.api
      .get<FinancialYear[]>('/admin/financial-years')
      .subscribe({
        next: (years) => {
          this.financialYears.set(years);
          const current = years.find(y => y.isCurrent);
          if (current) {
            this.currentFinancialYear.set(current.label);
            this.periodFilter.selectedFyId.set(current.id);
            this.periodFilter.selectedFyLabel.set(current.label);
          }
        },
        error: () => {},
      });
  }

  private updatePageTitle(url: string) {
    const basePath = '/' + (url.split('/').filter(Boolean)[0] || 'dashboard');
    const entry = this.routeMap[basePath];
    this.currentPageTitle.set(entry?.title || 'Dashboard');
    this.currentPageIcon.set(entry?.icon || 'dashboard');
  }
}
