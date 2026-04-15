import { Component, ChangeDetectionStrategy, inject, signal, computed, ViewChild } from '@angular/core';
import { RouterModule, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { filter, map } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  area: string;
}

interface NavGroup {
  title: string;
  icon: string;
  items: NavItem[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDividerModule,
    MatChipsModule,
    MatMenuModule
  ],
  template: `
    <mat-sidenav-container class="layout-container">
      <mat-sidenav #sidenav
                   [mode]="sidenavMode()"
                   [opened]="sidenavOpened()"
                   class="app-sidenav">
        <div class="sidenav-header">
          <div class="brand">
            <div class="brand-icon">
              <mat-icon>eco</mat-icon>
            </div>
            <div class="brand-text">
              <span class="brand-name">PLATINUM</span>
              <span class="brand-sub">SCM</span>
            </div>
          </div>
        </div>

        <div class="sidenav-content">
          <div class="nav-item-standalone">
            <a routerLink="/dashboard"
               routerLinkActive="active-link"
               [routerLinkActiveOptions]="{ exact: true }"
               class="nav-link">
              <mat-icon class="nav-icon">dashboard</mat-icon>
              <span class="nav-label">Dashboard</span>
            </a>
          </div>

          @for (group of visibleNavGroups(); track group.title) {
            <div class="nav-group">
              <button class="group-header" (click)="toggleGroup(group.title)">
                <mat-icon class="group-icon">{{ group.icon }}</mat-icon>
                <span class="group-title">{{ group.title }}</span>
                <mat-icon class="group-chevron">{{ isGroupOpen(group.title) ? 'expand_more' : 'chevron_right' }}</mat-icon>
              </button>
              @if (isGroupOpen(group.title)) {
                <div class="group-items">
                  @for (item of group.items; track item.route) {
                    <a [routerLink]="item.route"
                       routerLinkActive="active-link"
                       class="nav-link sub-item">
                      <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
                      <span class="nav-label">{{ item.label }}</span>
                    </a>
                  }
                </div>
              }
            </div>
          }
        </div>

        <div class="sidenav-footer">
          <div class="version-info">v2.0.0</div>
        </div>
      </mat-sidenav>

      <mat-sidenav-content class="main-content">
        <mat-toolbar class="app-toolbar">
          <button mat-icon-button (click)="toggleSidenav()" class="menu-btn">
            <mat-icon>menu</mat-icon>
          </button>

          <div class="toolbar-center">
            <span class="municipality-name">Platinum Municipality</span>
            <span class="period-badge">2025/2026 &bull; Period 8 (Feb)</span>
          </div>

          @if (authService.isAuditor()) {
            <span class="audit-badge">
              <mat-icon>visibility</mat-icon>
              READ-ONLY
            </span>
          }

          <span class="toolbar-spacer"></span>

          <button mat-icon-button matTooltip="Refresh">
            <mat-icon>refresh</mat-icon>
          </button>

          <button mat-icon-button matTooltip="Notifications" [matBadge]="'3'" matBadgeColor="warn" matBadgeSize="small">
            <mat-icon>notifications_none</mat-icon>
          </button>

          <button mat-button [matMenuTriggerFor]="userMenu" class="user-btn">
            <div class="user-avatar">
              {{ userInitials() }}
            </div>
            <span class="user-name-toolbar">{{ userName() }}</span>
          </button>
          <mat-menu #userMenu="matMenu" xPosition="before">
            <div class="user-menu-header">
              <div class="user-menu-avatar">{{ userInitials() }}</div>
              <div class="user-menu-info">
                <span class="user-menu-name">{{ userName() }}</span>
                <span class="user-menu-role">{{ userRole() }}</span>
              </div>
            </div>
            <mat-divider></mat-divider>
            <button mat-menu-item>
              <mat-icon>person</mat-icon>
              <span>Profile</span>
            </button>
            <button mat-menu-item>
              <mat-icon>settings</mat-icon>
              <span>Preferences</span>
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="authService.logout()">
              <mat-icon>logout</mat-icon>
              <span>Sign Out</span>
            </button>
          </mat-menu>
        </mat-toolbar>

        @if (breadcrumbLabel()) {
          <div class="breadcrumb-bar">
            <div class="breadcrumb-content">
              <div class="breadcrumb-trail">
                <a routerLink="/dashboard" class="breadcrumb-home">
                  <mat-icon class="breadcrumb-home-icon">home</mat-icon>
                </a>
                <mat-icon class="breadcrumb-separator">chevron_right</mat-icon>
                @if (breadcrumbGroup() && breadcrumbGroup() !== 'Home') {
                  <span class="breadcrumb-group">{{ breadcrumbGroup() }}</span>
                  <mat-icon class="breadcrumb-separator">chevron_right</mat-icon>
                }
                <span class="breadcrumb-current">
                  <mat-icon class="breadcrumb-current-icon">{{ breadcrumbIcon() }}</mat-icon>
                  {{ breadcrumbLabel() }}
                </span>
              </div>
            </div>
          </div>
        }

        <div class="content-area">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }

    .layout-container {
      height: 100%;
    }

    .app-sidenav {
      width: 240px;
      background: #ffffff;
      border-right: 1px solid #e8ecf1;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
    }

    .sidenav-header {
      padding: 20px 16px;
      border-bottom: 1px solid #e8ecf1;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .brand-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: #2e7d32;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .brand-icon mat-icon {
      color: white;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .brand-text {
      display: flex;
      align-items: baseline;
      gap: 4px;
    }

    .brand-name {
      font-size: 17px;
      font-weight: 700;
      color: #1e293b;
      letter-spacing: 1.5px;
    }

    .brand-sub {
      font-size: 10px;
      font-weight: 500;
      color: #64748b;
      letter-spacing: 0.5px;
    }

    .sidenav-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 8px 0;
    }

    .sidenav-content::-webkit-scrollbar {
      width: 4px;
    }

    .sidenav-content::-webkit-scrollbar-track {
      background: transparent;
    }

    .sidenav-content::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 2px;
    }

    .nav-item-standalone {
      padding: 4px 8px;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      color: #334155;
      text-decoration: none;
      font-size: 13px;
      font-weight: 400;
      border-radius: 6px;
      transition: all 0.15s ease;
      border-left: 3px solid transparent;
      cursor: pointer;
    }

    .nav-link:hover {
      color: #1e293b;
      background: #f1f5f9;
    }

    .nav-link.active-link {
      color: #2563eb;
      background: #eef6ff;
      border-left-color: #3b82f6;
    }

    .nav-link.active-link .nav-icon {
      color: #2563eb;
    }

    .nav-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #94a3b8;
      flex-shrink: 0;
    }

    .nav-label {
      white-space: nowrap;
    }

    .nav-group {
      margin-top: 2px;
    }

    .group-header {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 10px 16px 10px 12px;
      background: none;
      border: none;
      color: #334155;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      gap: 10px;
      text-align: left;
    }

    .group-header:hover {
      color: #1e293b;
      background: #f1f5f9;
    }

    .group-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #94a3b8;
      flex-shrink: 0;
    }

    .group-title {
      flex: 1;
      white-space: nowrap;
    }

    .group-chevron {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #94a3b8;
      flex-shrink: 0;
    }

    .group-items {
      padding: 0 0 4px 0;
    }

    .sub-item {
      padding-left: 48px !important;
      font-size: 13px;
      border-radius: 0;
    }

    .sidenav-footer {
      padding: 12px 16px;
      border-top: 1px solid #e8ecf1;
    }

    .version-info {
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
    }

    .app-toolbar {
      background: white;
      color: #1e293b;
      border-bottom: 1px solid #e2e8f0;
      height: 56px;
      position: sticky;
      top: 0;
      z-index: 10;
      padding: 0 8px;
      display: flex;
      align-items: center;
    }

    .menu-btn {
      color: #64748b;
    }

    .toolbar-center {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-left: 8px;
    }

    .municipality-name {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }

    .period-badge {
      display: inline-flex;
      align-items: center;
      background: #e8f5e9;
      color: #2e7d32;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 16px;
      white-space: nowrap;
    }

    .audit-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #fef3c7;
      color: #92400e;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 12px;
      margin-left: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .audit-badge mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .toolbar-spacer {
      flex: 1;
    }

    .user-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px;
      min-width: auto;
      border-radius: 8px;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #0f2b46;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .user-name-toolbar {
      font-size: 13px;
      font-weight: 500;
      color: #1e293b;
    }

    .user-menu-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
    }

    .user-menu-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #0f2b46;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .user-menu-info {
      display: flex;
      flex-direction: column;
    }

    .user-menu-name {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }

    .user-menu-role {
      font-size: 12px;
      color: #64748b;
    }

    .breadcrumb-bar {
      background: #f8fafc;
      border-bottom: 1px solid #e8ecf1;
      padding: 10px 24px;
    }

    .breadcrumb-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .breadcrumb-trail {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
    }

    .breadcrumb-home {
      display: flex;
      align-items: center;
      text-decoration: none;
      color: #64748b;
      transition: color 0.2s;
    }

    .breadcrumb-home:hover {
      color: #3b82f6;
    }

    .breadcrumb-home-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .breadcrumb-separator {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #cbd5e1;
    }

    .breadcrumb-group {
      color: #64748b;
      font-weight: 500;
    }

    .breadcrumb-current {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #1e293b;
      font-weight: 600;
    }

    .breadcrumb-current-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #3b82f6;
    }

    .content-area {
      padding: 24px;
      background: #ffffff;
      min-height: calc(100vh - 56px);
    }

    .main-content {
      background: #ffffff;
    }

    @media (max-width: 768px) {
      .municipality-name,
      .period-badge,
      .user-name-toolbar {
        display: none;
      }

      .toolbar-center {
        display: none;
      }

      .content-area {
        padding: 16px;
      }
    }
  `]
})
export class LayoutComponent {
  authService = inject(AuthService);
  private breakpointObserver = inject(BreakpointObserver);

  isMobile = signal(false);
  sidenavOpened = signal(true);
  groupOpenState = signal<Record<string, boolean>>({});
  breadcrumbLabel = signal('');
  breadcrumbIcon = signal('');
  breadcrumbGroup = signal('');
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  @ViewChild('sidenav') sidenav!: MatSidenav;

  sidenavMode = computed(() => this.isMobile() ? 'over' as const : 'side' as const);

  userName = computed(() => {
    const user = this.authService.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });

  userRole = computed(() => {
    const user = this.authService.currentUser();
    return user?.roleLabel || '';
  });

  userInitials = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return '';
    return `${(user.firstName || '')[0] || ''}${(user.lastName || '')[0] || ''}`;
  });

  private allNavGroups: NavGroup[] = [
    {
      title: 'Procurement',
      icon: 'shopping_bag',
      items: [
        { label: 'Demand', icon: 'trending_up', route: '/demand', area: 'demand' },
        { label: 'Requisitions', icon: 'description', route: '/requisitions', area: 'requisitions' },
        { label: 'Quotations', icon: 'request_quote', route: '/quotations', area: 'quotations' },
        { label: 'Informal Tenders', icon: 'format_list_numbered', route: '/informal-tenders', area: 'informal-tenders' },
        { label: 'Tenders', icon: 'gavel', route: '/tenders', area: 'tenders' },
        { label: 'Purchase Orders', icon: 'shopping_cart', route: '/orders', area: 'orders' }
      ]
    },
    {
      title: 'Receiving & Payments',
      icon: 'local_shipping',
      items: [
        { label: 'Goods Receipt', icon: 'inventory', route: '/grn', area: 'grn' },
        { label: 'Goods Returns', icon: 'assignment_return', route: '/gra', area: 'gra' },
        { label: 'Invoices', icon: 'receipt_long', route: '/invoices', area: 'invoices' },
        { label: 'Payments', icon: 'payment', route: '/payments', area: 'payments' },
        { label: 'Interest Charges', icon: 'account_balance', route: '/interest-charges', area: 'interest-charges' }
      ]
    },
    {
      title: 'Inventory & Stores',
      icon: 'warehouse',
      items: [
        { label: 'Inventory', icon: 'inventory_2', route: '/inventory', area: 'inventory' },
        { label: 'Water Inventory', icon: 'water_drop', route: '/water-inventory', area: 'water-inventory' },
        { label: 'Land Inventory', icon: 'terrain', route: '/land-inventory', area: 'land-inventory' }
      ]
    },
    {
      title: 'Vendor Management',
      icon: 'business_center',
      items: [
        { label: 'Vendors', icon: 'business', route: '/suppliers', area: 'suppliers' },
        { label: 'Supplier Performance', icon: 'speed', route: '/supplier-performance', area: 'supplier-performance' },
        { label: 'Supplier Portal', icon: 'storefront', route: '/supplier-portal', area: 'supplier-portal' },
        { label: 'Contracts', icon: 'handshake', route: '/contracts', area: 'contracts' }
      ]
    },
    {
      title: 'Compliance',
      icon: 'verified_user',
      items: [
        { label: 'IFW Register', icon: 'warning', route: '/ifw-register', area: 'ifw-register' },
        { label: 'Audit Trail', icon: 'security', route: '/audit-trail', area: 'audit-trail' },
        { label: 'Delegations', icon: 'account_tree', route: '/delegations', area: 'delegations' }
      ]
    },
    {
      title: 'Reports',
      icon: 'bar_chart',
      items: [
        { label: 'Reports', icon: 'assessment', route: '/reports', area: 'reports' },
        { label: 'Analytics', icon: 'analytics', route: '/analytics', area: 'analytics' },
        { label: 'BI Dashboards', icon: 'dashboard', route: '/bi-dashboards', area: 'bi-dashboards' },
        { label: 'Financial Integration', icon: 'account_balance_wallet', route: '/financial-integration', area: 'financial-integration' }
      ]
    },
    {
      title: 'Settings',
      icon: 'settings',
      items: [
        { label: 'Users & Roles', icon: 'admin_panel_settings', route: '/admin/users', area: 'admin' },
        { label: 'SCM Configuration', icon: 'tune', route: '/admin/system-config', area: 'admin' }
      ]
    }
  ];

  visibleNavGroups = computed(() => {
    return this.allNavGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => this.authService.hasPermission(item.area))
      }))
      .filter(group => group.items.length > 0);
  });

  constructor() {
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isMobile.set(result.matches);
      if (result.matches) {
        this.sidenavOpened.set(false);
      } else {
        this.sidenavOpened.set(true);
      }
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        let route = this.activatedRoute;
        while (route.firstChild) route = route.firstChild;
        return route.snapshot.data;
      })
    ).subscribe(data => {
      this.breadcrumbLabel.set(data['breadcrumb'] || '');
      this.breadcrumbIcon.set(data['icon'] || '');
      this.breadcrumbGroup.set(data['group'] || '');
    });
  }

  toggleSidenav(): void {
    this.sidenavOpened.set(!this.sidenavOpened());
  }

  toggleGroup(title: string): void {
    const current = this.groupOpenState();
    this.groupOpenState.set({ ...current, [title]: !current[title] });
  }

  isGroupOpen(title: string): boolean {
    return !!this.groupOpenState()[title];
  }
}
