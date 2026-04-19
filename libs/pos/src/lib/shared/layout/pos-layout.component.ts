import { Component, signal, computed, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { filter } from 'rxjs/operators';

interface NavChild {
  label: string;
  href: string;
  icon: string;
}

interface NavGroup {
  label: string;
  icon: string;
  children: NavChild[];
}

type NavItem = NavChild | NavGroup;

function isGroup(item: NavItem): item is NavGroup {
  return 'children' in item;
}

@Component({
  selector: 'app-pos-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './pos-layout.component.html',
  styleUrl: './pos-layout.component.css'
})
export class PosLayoutComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  sidebarCollapsed = signal(false);
  mobileSidebarOpen = signal(false);
  expandedGroups = signal<Set<string>>(new Set(['Billing & Payments']));

  isSite02 = this.auth.isSite02;
  user = this.auth.user;
  site = this.auth.site;

  isGroup = isGroup;

  currentUrl = signal(this.router.url);

  breadcrumbs = computed(() => {
    const url = this.currentUrl();
    const segments = url.split('/').filter(s => s);
    const crumbs: { label: string; href?: string }[] = [];
    for (const nav of this.navItems) {
      if (isGroup(nav)) {
        for (const child of nav.children) {
          if (this.matchesUrl(child.href, url)) {
            crumbs.push({ label: nav.label });
            crumbs.push({ label: child.label });
            return crumbs;
          }
        }
      } else {
        if (this.matchesUrl(nav.href, url)) {
          crumbs.push({ label: nav.label });
          return crumbs;
        }
      }
    }
    if (segments.length > 0) {
      crumbs.push({ label: segments[segments.length - 1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) });
    }
    return crumbs;
  });

  navItems: NavItem[] = [
    { label: 'Dashboard', href: '/pos', icon: 'dashboard' },
    {
      label: 'Billing & Payments', icon: 'payments',
      children: [
        { label: 'POS Receipting', href: '/pos/pos', icon: 'point_of_sale' },
        { label: 'Supervisor', href: '/pos/supervisor', icon: 'admin_panel_settings' },
        { label: 'Billing Dashboard', href: '/pos/billing-dashboard', icon: 'bar_chart' },
        { label: 'Direct Deposits', href: '/pos/direct-deposits/manual', icon: 'account_balance' },
        { label: 'Auto Allocation', href: '/pos/direct-deposits/auto', icon: 'auto_fix_high' },
        { label: 'Third Party Payments', href: '/pos/third-party/processing', icon: 'groups' },
        { label: 'Bulk Allocation', href: '/pos/bulk-allocation', icon: 'upload_file' },
      ]
    },
    {
      label: 'Enquiries & Receipts', icon: 'search',
      children: [
        { label: 'General Enquiries', href: '/pos/enquiries/general', icon: 'manage_search' },
        { label: 'View Receipts', href: '/pos/view-receipts', icon: 'description' },
      ]
    },
    {
      label: 'Consumer Management', icon: 'person_add',
      children: [
        { label: 'Property Onboarding', href: '/pos/consumer/onboarding', icon: 'add_home_work' },
        { label: 'Entity Management', href: '/pos/consumer/entities', icon: 'manage_accounts' },
        { label: 'Bulk Import', href: '/pos/consumer/bulk-import', icon: 'upload_file' },
      ]
    },
    {
      label: 'Indigent Management', icon: 'volunteer_activism',
      children: [
        { label: 'Dashboard', href: '/pos/indigent/dashboard', icon: 'dashboard' },
        { label: 'Applications', href: '/pos/indigent/application', icon: 'assignment' },
        { label: 'Site Verification', href: '/pos/indigent/verification', icon: 'fact_check' },
        { label: 'Document Verification', href: '/pos/indigent/doc-verification', icon: 'verified_user' },
        { label: 'Authorization', href: '/pos/indigent/authorization', icon: 'verified' },
        { label: 'Indigent Register', href: '/pos/indigent/register', icon: 'list_alt' },
        { label: 'Reapplication', href: '/pos/indigent/reapplication', icon: 'refresh' },
        { label: 'Termination', href: '/pos/indigent/termination', icon: 'cancel' },
        { label: 'Bulk Upload', href: '/pos/indigent/bulk-upload', icon: 'upload_file' },
        { label: 'Configuration', href: '/pos/indigent/config', icon: 'settings' },
        { label: 'Reports', href: '/pos/indigent/reports', icon: 'assessment' },
      ]
    },
    {
      label: 'Communications', icon: 'forum',
      children: [
        { label: 'Client Messaging', href: '/pos/communications', icon: 'mail' },
        { label: 'Post-Billing SMS', href: '/pos/communications/post-billing-sms', icon: 'sms' },
      ]
    },
    {
      label: 'Debt Management', icon: 'gavel',
      children: [
        { label: 'Section 129 Notices', href: '/pos/debt/section129', icon: 'warning' },
        { label: 'Authorization', href: '/pos/debt/section129/authorize', icon: 'verified' },
        { label: 'Configuration', href: '/pos/debt/section129/config', icon: 'settings' },
        { label: 'Handover Management', href: '/pos/debt/handover', icon: 'assignment_ind' },
        { label: 'Handover Authorization', href: '/pos/debt/handover/authorize', icon: 'verified' },
        { label: 'Handover Termination', href: '/pos/debt/handover/terminate', icon: 'cancel' },
        { label: 'Batch Processing', href: '/pos/debt/batch-processing', icon: 'batch_prediction' },
        { label: 'Process Monitoring', href: '/pos/debt/process-monitoring', icon: 'monitor_heart' },
        { label: 'Document Templates', href: '/pos/debt/document-templates', icon: 'article' },
        { label: 'Digital Signatures', href: '/pos/debt/digital-signatures', icon: 'draw' },
        { label: 'Process Engine', href: '/pos/debt/process-engine', icon: 'engineering' },
      ]
    },
    {
      label: 'Reports', icon: 'assessment',
      children: [
        { label: 'Section 129 Report', href: '/pos/debt/section129-report', icon: 'summarize' },
        { label: 'Handover Report', href: '/pos/debt/handover-report', icon: 'summarize' },
        { label: 'SMS Log Report', href: '/pos/debt/sms-log-report', icon: 'sms' },
        { label: 'Risk Scoring', href: '/pos/debt/risk-scoring', icon: 'trending_up' },
        { label: 'Qualification Rules', href: '/pos/debt/qualification-rules', icon: 'rule' },
        { label: 'Communication Timeline', href: '/pos/debt/communication-timelines', icon: 'timeline' },
        { label: 'Comms Dashboard', href: '/pos/debt/communication-dashboard', icon: 'dashboard' },
      ]
    },
    {
      label: 'Legal Compliance', icon: 'policy',
      children: [
        { label: 'Legal Rules', href: '/pos/legal/rules', icon: 'gavel' },
        { label: 'Audit Trail', href: '/pos/legal/audit-trail', icon: 'history' },
        { label: 'Evidence Bundle', href: '/pos/legal/evidence-bundle', icon: 'folder_special' },
      ]
    },
    {
      label: 'Analytics', icon: 'insights',
      children: [
        { label: 'Executive Dashboard', href: '/pos/analytics/executive-dashboard', icon: 'leaderboard' },
        { label: 'Predictive Forecasting', href: '/pos/analytics/predictive-forecasting', icon: 'auto_graph' },
        { label: 'Geographic Mapping', href: '/pos/analytics/geographic-mapping', icon: 'map' },
        { label: 'Account Ageing Summary', href: '/pos/analytics/ageing-summary', icon: 'table_chart' },
      ]
    },
  ];

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(e => {
      this.currentUrl.set(e.urlAfterRedirects || e.url);
      this.mobileSidebarOpen.set(false);
    });
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen.update(v => !v);
  }

  toggleGroup(label: string): void {
    this.expandedGroups.update(groups => {
      const next = new Set(groups);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  onGroupClick(label: string): void {
    if (this.sidebarCollapsed()) {
      this.sidebarCollapsed.set(false);
      this.expandedGroups.update(groups => {
        const next = new Set(groups);
        next.add(label);
        return next;
      });
    } else {
      this.toggleGroup(label);
    }
  }

  isGroupExpanded(label: string): boolean {
    return this.expandedGroups().has(label);
  }

  navigateTo(href: string): void {
    this.router.navigate([href]);
  }

  matchesUrl(href: string, url?: string): boolean {
    const current = url || this.currentUrl();
    if (href === '/') return current === '/' || current === '';
    return current === href;
  }

  isActive(href: string): boolean {
    return this.matchesUrl(href);
  }

  isGroupActive(group: NavGroup): boolean {
    return group.children.some(c => this.matchesUrl(c.href));
  }

  async signOut(): Promise<void> {
    await this.auth.logout();
  }

  getUserInitial(): string {
    const u = this.user();
    return u?.firstName?.charAt(0)?.toUpperCase() || u?.userName?.charAt(0)?.toUpperCase() || 'U';
  }

  getUserDisplayName(): string {
    const u = this.user();
    if (u?.firstName && u?.lastName) return `${u.firstName} ${u.lastName}`;
    return u?.userName || 'User';
  }

  getMunicipalityName(): string {
    return this.isSite02() ? 'Inzalo EMS Site02' : 'George Municipality';
  }

  getFinancialPeriod(): string {
    const u = this.user();
    return u?.finYear || '2025/2026';
  }
}
