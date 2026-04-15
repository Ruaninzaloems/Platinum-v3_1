import { Component, signal, OnInit, OnDestroy, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../core/api.service';
import { DatabaseToggleService } from '../core/database-toggle.service';
import { OrgSettingsService } from '../core/org-settings.service';
import { AuthService } from '../core/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

interface NavGroup {
  title: string;
  icon: string;
  items: { label: string; icon: string; route: string }[];
}

interface BudgetSubGroup {
  label: string;
  icon: string;
  children: { label: string; icon: string; route: string }[];
}

interface BudgetNavGroup {
  title: string;
  icon: string;
  subGroups?: BudgetSubGroup[];
  items?: { label: string; icon: string; route: string }[];
}

type AppModule = 'assets' | 'scm' | 'pos' | 'payroll' | 'idp' | 'insights' | 'budget' | 'afs';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatMenuModule, MatBadgeModule, MatTooltipModule],
  template: `
    <div class="shell">
      <aside class="app-sidenav" [class.collapsed]="sidenavCollapsed() && activeModule() === 'assets'">
        <div class="sidenav-header">
          <div class="brand">
            <div class="brand-icon"><mat-icon>shield</mat-icon></div>
            @if (!sidenavCollapsed() || activeModule() !== 'assets') {
              <div>
                <div class="brand-name">PLATINUM
                  @if (activeModule() === 'scm') {
                    <span class="brand-module">SCM</span>
                  } @else if (activeModule() === 'pos') {
                    <span class="brand-module">POS</span>
                  } @else if (activeModule() === 'payroll') {
                    <span class="brand-module">Payroll</span>
                  } @else if (activeModule() === 'idp') {
                    <span class="brand-module">IDP</span>
                  } @else if (activeModule() === 'insights') {
                    <span class="brand-module">Performance</span>
                  } @else if (activeModule() === 'budget') {
                    <span class="brand-module">Budget</span>
                  } @else if (activeModule() === 'afs') {
                    <span class="brand-module">AFS</span>
                  } @else {
                    <span class="brand-module">Assets</span>
                  }
                </div>
              </div>
            }
          </div>
          @if (!sidenavCollapsed() || activeModule() !== 'assets') {
            <div class="module-grid">
              <button class="module-chip" [class.active]="activeModule() === 'assets'" (click)="setModule('assets')">
                <mat-icon class="chip-icon">inventory_2</mat-icon><span>Assets</span>
              </button>
              <button class="module-chip" [class.active]="activeModule() === 'scm'" (click)="setModule('scm')">
                <mat-icon class="chip-icon">local_shipping</mat-icon><span>SCM</span>
              </button>
              <button class="module-chip" [class.active]="activeModule() === 'pos'" (click)="setModule('pos')">
                <mat-icon class="chip-icon">point_of_sale</mat-icon><span>POS</span>
              </button>
              <button class="module-chip" [class.active]="activeModule() === 'payroll'" (click)="setModule('payroll')">
                <mat-icon class="chip-icon">payments</mat-icon><span>Payroll</span>
              </button>
              <button class="module-chip" [class.active]="activeModule() === 'idp'" (click)="setModule('idp')">
                <mat-icon class="chip-icon">assignment</mat-icon><span>IDP</span>
              </button>
              <button class="module-chip" [class.active]="activeModule() === 'insights'" (click)="setModule('insights')">
                <mat-icon class="chip-icon">insights</mat-icon><span>Performance</span>
              </button>
              <button class="module-chip" [class.active]="activeModule() === 'budget'" (click)="setModule('budget')">
                <mat-icon class="chip-icon">account_balance</mat-icon><span>Budget</span>
              </button>
              <button class="module-chip" [class.active]="activeModule() === 'afs'" (click)="setModule('afs')">
                <mat-icon class="chip-icon">description</mat-icon><span>AFS</span>
              </button>
            </div>
          }
        </div>

        <nav class="nav-list" style="flex:1;overflow-y:auto;padding:8px">
          @if (activeModule() === 'assets') {
            @for (item of assetNavItems; track item.label) {
              <a class="nav-link" [routerLink]="item.route" routerLinkActive="active-link" [routerLinkActiveOptions]="{exact: item.route === '/dashboard'}">
                <mat-icon class="nav-icon">{{item.icon}}</mat-icon>
                @if (!sidenavCollapsed()) { <span>{{item.label}}</span> }
              </a>
            }
          } @else if (activeModule() === 'scm') {
            <a class="nav-link" [class.active-link]="activeIframeRoute() === '/dashboard'" (click)="navigateIframe('scm', '/dashboard')">
              <mat-icon class="nav-icon">dashboard</mat-icon>
              <span>Dashboard</span>
            </a>
            @for (group of scmNavGroups; track group.title) {
              <div class="nav-group">
                <button class="nav-group-header" (click)="toggleGroup(group.title)">
                  <mat-icon class="nav-icon">{{group.icon}}</mat-icon>
                  <span class="nav-group-title">{{group.title}}</span>
                  <mat-icon class="nav-chevron" [class.expanded]="isGroupExpanded(group.title)">chevron_right</mat-icon>
                </button>
                @if (isGroupExpanded(group.title)) {
                  <div class="nav-group-items">
                    @for (item of group.items; track item.label) {
                      <a class="nav-link sub-item" [class.active-link]="activeIframeRoute() === item.route" (click)="navigateIframe('scm', item.route)">
                        <mat-icon class="nav-icon">{{item.icon}}</mat-icon>
                        <span>{{item.label}}</span>
                      </a>
                    }
                  </div>
                }
              </div>
            }
          } @else if (activeModule() === 'pos') {
            <a class="nav-link" [class.active-link]="activeIframeRoute() === '/'" (click)="navigateIframe('pos', '/')">
              <mat-icon class="nav-icon">home</mat-icon>
              <span>Home</span>
            </a>
            @for (group of posNavGroups; track group.title) {
              <div class="nav-group">
                <button class="nav-group-header" (click)="toggleGroup(group.title)">
                  <mat-icon class="nav-icon">{{group.icon}}</mat-icon>
                  <span class="nav-group-title">{{group.title}}</span>
                  <mat-icon class="nav-chevron" [class.expanded]="isGroupExpanded(group.title)">chevron_right</mat-icon>
                </button>
                @if (isGroupExpanded(group.title)) {
                  <div class="nav-group-items">
                    @for (item of group.items; track item.label) {
                      <a class="nav-link sub-item" [class.active-link]="activeIframeRoute() === item.route" (click)="navigateIframe('pos', item.route)">
                        <mat-icon class="nav-icon">{{item.icon}}</mat-icon>
                        <span>{{item.label}}</span>
                      </a>
                    }
                  </div>
                }
              </div>
            }
          } @else if (activeModule() === 'idp') {
            <a class="nav-link" [class.active-link]="activeIframeRoute() === '/dashboard'" (click)="navigateIframe('idp', '/dashboard')">
              <mat-icon class="nav-icon">dashboard</mat-icon>
              <span>Dashboard</span>
            </a>
            <a class="nav-link" [class.active-link]="activeIframeRoute() === '/cycles'" (click)="navigateIframe('idp', '/cycles')">
              <mat-icon class="nav-icon">loop</mat-icon>
              <span>IDP Cycles</span>
            </a>
            @for (group of idpNavGroups; track group.title) {
              <div class="nav-group">
                <button class="nav-group-header" (click)="toggleGroup(group.title)">
                  <mat-icon class="nav-icon">{{group.icon}}</mat-icon>
                  <span class="nav-group-title">{{group.title}}</span>
                  <mat-icon class="nav-chevron" [class.expanded]="isGroupExpanded(group.title)">chevron_right</mat-icon>
                </button>
                @if (isGroupExpanded(group.title)) {
                  <div class="nav-group-items">
                    @for (item of group.items; track item.label) {
                      <a class="nav-link sub-item" [class.active-link]="activeIframeRoute() === item.route" (click)="navigateIframe('idp', item.route)">
                        <mat-icon class="nav-icon">{{item.icon}}</mat-icon>
                        <span>{{item.label}}</span>
                      </a>
                    }
                  </div>
                }
              </div>
            }
          } @else if (activeModule() === 'insights') {
            <a class="nav-link" [class.active-link]="activeIframeRoute() === '/'" (click)="navigateIframe('insights', '/')">
              <mat-icon class="nav-icon">dashboard</mat-icon>
              <span>Dashboard</span>
            </a>
            @for (group of insightsNavGroups; track group.title) {
              <div class="nav-group">
                <button class="nav-group-header" (click)="toggleGroup(group.title)">
                  <mat-icon class="nav-icon">{{group.icon}}</mat-icon>
                  <span class="nav-group-title">{{group.title}}</span>
                  <mat-icon class="nav-chevron" [class.expanded]="isGroupExpanded(group.title)">chevron_right</mat-icon>
                </button>
                @if (isGroupExpanded(group.title)) {
                  <div class="nav-group-items">
                    @for (item of group.items; track item.label) {
                      <a class="nav-link sub-item" [class.active-link]="activeIframeRoute() === item.route" (click)="navigateIframe('insights', item.route)">
                        <mat-icon class="nav-icon">{{item.icon}}</mat-icon>
                        <span>{{item.label}}</span>
                      </a>
                    }
                  </div>
                }
              </div>
            }
            <a class="nav-link" [class.active-link]="activeIframeRoute() === '/ai-insights'" (click)="navigateIframe('insights', '/ai-insights')">
              <mat-icon class="nav-icon">psychology</mat-icon>
              <span>AI Insights</span>
            </a>
            <a class="nav-link" [class.active-link]="activeIframeRoute() === '/integrations'" (click)="navigateIframe('insights', '/integrations')">
              <mat-icon class="nav-icon">hub</mat-icon>
              <span>Integrations</span>
            </a>
            <a class="nav-link" [class.active-link]="activeIframeRoute() === '/audit-trail'" (click)="navigateIframe('insights', '/audit-trail')">
              <mat-icon class="nav-icon">security</mat-icon>
              <span>Audit Trail</span>
            </a>
          } @else if (activeModule() === 'budget') {
            <a class="nav-link" [class.active-link]="activeIframeRoute() === '/dashboard'" (click)="navigateIframe('budget', '/dashboard')">
              <mat-icon class="nav-icon">dashboard</mat-icon>
              <span>Dashboard</span>
            </a>
            @for (group of budgetNavGroups; track group.title) {
              <div class="nav-group">
                <button class="nav-group-header" (click)="toggleGroup(group.title)">
                  <mat-icon class="nav-icon">{{group.icon}}</mat-icon>
                  <span class="nav-group-title">{{group.title}}</span>
                  <mat-icon class="nav-chevron" [class.expanded]="isGroupExpanded(group.title)">chevron_right</mat-icon>
                </button>
                @if (isGroupExpanded(group.title)) {
                  <div class="nav-group-items">
                    @if (group.subGroups) {
                      @for (sub of group.subGroups; track sub.label) {
                        <div class="nav-sub-group">
                          <button class="nav-sub-group-header" (click)="toggleGroup(group.title + '/' + sub.label)">
                            <mat-icon class="nav-icon">{{sub.icon}}</mat-icon>
                            <span class="nav-sub-group-title">{{sub.label}}</span>
                            <mat-icon class="nav-chevron" [class.expanded]="isGroupExpanded(group.title + '/' + sub.label)">chevron_right</mat-icon>
                          </button>
                          @if (isGroupExpanded(group.title + '/' + sub.label)) {
                            <div class="nav-sub-group-items">
                              @for (child of sub.children; track child.label) {
                                <a class="nav-link sub-sub-item" [class.active-link]="activeIframeRoute() === child.route" (click)="navigateIframe('budget', child.route)">
                                  <span>{{child.label}}</span>
                                </a>
                              }
                            </div>
                          }
                        </div>
                      }
                    }
                    @if (group.items) {
                      @for (item of group.items; track item.label) {
                        <a class="nav-link sub-item" [class.active-link]="activeIframeRoute() === item.route" (click)="navigateIframe('budget', item.route)">
                          <mat-icon class="nav-icon">{{item.icon}}</mat-icon>
                          <span>{{item.label}}</span>
                        </a>
                      }
                    }
                  </div>
                }
              </div>
            }
          } @else if (activeModule() === 'afs') {
            <a class="nav-link" [class.active-link]="activeIframeRoute() === '/dashboard'" (click)="navigateIframe('afs', '/dashboard')">
              <mat-icon class="nav-icon">dashboard</mat-icon>
              <span>Dashboard</span>
            </a>
            @for (group of afsNavGroups; track group.title) {
              <div class="nav-group">
                <button class="nav-group-header" (click)="toggleGroup(group.title)">
                  <mat-icon class="nav-icon">{{group.icon}}</mat-icon>
                  <span class="nav-group-title">{{group.title}}</span>
                  <mat-icon class="nav-chevron" [class.expanded]="isGroupExpanded(group.title)">chevron_right</mat-icon>
                </button>
                @if (isGroupExpanded(group.title)) {
                  <div class="nav-group-items">
                    @for (item of group.items; track item.label) {
                      <a class="nav-link sub-item" [class.active-link]="activeIframeRoute() === item.route" (click)="navigateIframe('afs', item.route)">
                        <mat-icon class="nav-icon">{{item.icon}}</mat-icon>
                        <span>{{item.label}}</span>
                      </a>
                    }
                  </div>
                }
              </div>
            }
          } @else {
            <a class="nav-link" [class.active-link]="activeIframeRoute() === '/dashboard'" (click)="navigateIframe('payroll', '/dashboard')">
              <mat-icon class="nav-icon">dashboard</mat-icon>
              <span>Dashboard</span>
            </a>
            @for (group of payrollNavGroups; track group.title) {
              <div class="nav-group">
                <button class="nav-group-header" (click)="toggleGroup(group.title)">
                  <mat-icon class="nav-icon">{{group.icon}}</mat-icon>
                  <span class="nav-group-title">{{group.title}}</span>
                  <mat-icon class="nav-chevron" [class.expanded]="isGroupExpanded(group.title)">chevron_right</mat-icon>
                </button>
                @if (isGroupExpanded(group.title)) {
                  <div class="nav-group-items">
                    @for (item of group.items; track item.label) {
                      <a class="nav-link sub-item" [class.active-link]="activeIframeRoute() === item.route" (click)="navigateIframe('payroll', item.route)">
                        <mat-icon class="nav-icon">{{item.icon}}</mat-icon>
                        <span>{{item.label}}</span>
                      </a>
                    }
                  </div>
                }
              </div>
            }
          }
        </nav>
        <div style="padding:12px 16px;border-top:1px solid #e8ecf1;font-size:11px;color:#94a3b8">
          @if (!sidenavCollapsed() || activeModule() !== 'assets') {
            @if (activeModule() === 'scm') { v2.0 · MFMA Compliant }
            @else if (activeModule() === 'pos') { v1.0 · Municipal POS }
            @else if (activeModule() === 'payroll') { v1.0 · MFMA Compliant }
            @else if (activeModule() === 'idp') { v1.0 · IDP Workflow }
            @else if (activeModule() === 'budget') { v1.0 · MFMA Budget }
            @else if (activeModule() === 'afs') { v4.0 · GRAP/MFMA AFS }
            @else { v1.0 · GRAP Compliant }
          }
        </div>
      </aside>

      @if (activeModule() === 'scm') {
        <div class="iframe-main">
          @if (iframeLoading().has('scm')) {
            <div class="iframe-loader">
              <div class="loader-shield"></div>
              <div class="loader-shimmer"></div>
              <div class="loader-label">Loading Supply Chain Management</div>
            </div>
          }
          <iframe #scmFrame class="app-iframe" [src]="scmUrl" frameborder="0" (load)="onIframeLoad('scm')"></iframe>
        </div>
      } @else if (activeModule() === 'pos') {
        <div class="iframe-main">
          @if (iframeLoading().has('pos')) {
            <div class="iframe-loader">
              <div class="loader-shield"></div>
              <div class="loader-shimmer"></div>
              <div class="loader-label">Loading Point of Sale</div>
            </div>
          }
          <iframe #posFrame class="app-iframe" [src]="posUrl" frameborder="0" (load)="onIframeLoad('pos')"></iframe>
        </div>
      } @else if (activeModule() === 'payroll') {
        <div class="iframe-main">
          @if (iframeLoading().has('payroll')) {
            <div class="iframe-loader">
              <div class="loader-shield"></div>
              <div class="loader-shimmer"></div>
              <div class="loader-label">Loading Payroll</div>
            </div>
          }
          <iframe #payrollFrame class="app-iframe" [src]="payrollUrl" frameborder="0" (load)="onIframeLoad('payroll')"></iframe>
        </div>
      } @else if (activeModule() === 'idp') {
        <div class="iframe-main">
          @if (iframeLoading().has('idp')) {
            <div class="iframe-loader">
              <div class="loader-shield"></div>
              <div class="loader-shimmer"></div>
              <div class="loader-label">Loading IDP</div>
            </div>
          }
          <iframe #idpFrame class="app-iframe" [src]="idpUrl" frameborder="0" (load)="onIframeLoad('idp')"></iframe>
        </div>
      } @else if (activeModule() === 'insights') {
        <div class="iframe-main">
          @if (iframeLoading().has('insights')) {
            <div class="iframe-loader">
              <div class="loader-shield"></div>
              <div class="loader-shimmer"></div>
              <div class="loader-label">Loading Performance Hub</div>
            </div>
          }
          <iframe #insightsFrame class="app-iframe" [src]="insightsUrl" frameborder="0" (load)="onIframeLoad('insights')"></iframe>
        </div>
      } @else if (activeModule() === 'budget') {
        <div class="iframe-main">
          @if (iframeLoading().has('budget')) {
            <div class="iframe-loader">
              <div class="loader-shield"></div>
              <div class="loader-shimmer"></div>
              <div class="loader-label">Loading Budget Management</div>
            </div>
          }
          <iframe #budgetFrame class="app-iframe" [src]="budgetUrl" frameborder="0" (load)="onIframeLoad('budget')"></iframe>
        </div>
      } @else if (activeModule() === 'afs') {
        <div class="iframe-main">
          @if (iframeLoading().has('afs')) {
            <div class="iframe-loader">
              <div class="loader-shield"></div>
              <div class="loader-shimmer"></div>
              <div class="loader-label">Loading Annual Financial Statements</div>
            </div>
          }
          <iframe #afsFrame class="app-iframe" [src]="afsUrl" frameborder="0" (load)="onIframeLoad('afs')"></iframe>
        </div>
      } @else {
        <div class="main-content">
          <header class="app-toolbar">
            <button mat-icon-button (click)="sidenavCollapsed.set(!sidenavCollapsed())">
              <mat-icon>menu</mat-icon>
            </button>
            <div style="display:flex;align-items:center;gap:12px;margin-left:12px">
              <span class="municipality-name">{{municipalityName()}}</span>
              <span class="period-badge">FY {{activeFinYear()}} · P{{activePeriod()}}</span>
            </div>
            <div style="flex:1"></div>
            <button class="db-toggle" [class.sqlserver]="dbToggle.activeBackend() === 'sqlserver'" (click)="toggleDatabase()" [matTooltip]="dbToggle.activeBackend() === 'postgresql' ? 'Using PostgreSQL — click to switch to SQL Server' : 'Using SQL Server — click to switch to PostgreSQL'">
              <mat-icon style="font-size:16px">storage</mat-icon>
              @if (dbToggle.activeBackend() === 'postgresql') { <span>PostgreSQL</span> } @else { <span>SQL Server</span> }
            </button>
            <span class="audit-badge"><mat-icon style="font-size:14px">verified</mat-icon> Clean Audit</span>
            <button mat-icon-button
                    [matBadge]="pendingCount().toString()"
                    matBadgeColor="warn"
                    matBadgeSize="small"
                    [matBadgeHidden]="pendingCount() === 0"
                    matTooltip="Workflow Inbox"
                    style="margin-left:8px"
                    (click)="openWorkflowInbox()">
              <mat-icon>notifications</mat-icon>
            </button>
            <button mat-icon-button [matMenuTriggerFor]="userMenu" style="margin-left:4px">
              <div class="user-avatar">AD</div>
            </button>
            <mat-menu #userMenu="matMenu">
              <div style="padding:12px 16px;border-bottom:1px solid #e2e8f0">
                <div style="font-weight:600;font-size:14px">Administrator</div>
                <div style="font-size:12px;color:#64748b">Admin</div>
              </div>
              <button mat-menu-item><mat-icon>settings</mat-icon>Settings</button>
              <button mat-menu-item (click)="onLogout()"><mat-icon>logout</mat-icon>Sign Out</button>
            </mat-menu>
          </header>
          <main class="content-area">
            <router-outlet />
          </main>
        </div>
      }
    </div>
  `,
  styles: [`
    .shell { display: flex; height: 100vh; overflow: hidden; }
    .app-sidenav {
      width: 240px; background: #ffffff; border-right: 1px solid #e8ecf1; display: flex;
      flex-direction: column; flex-shrink: 0; transition: width 0.2s;
    }
    .app-sidenav.collapsed { width: 64px; }
    .sidenav-header { padding: 20px 16px; border-bottom: 1px solid #e8ecf1; }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand-icon {
      width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(135deg, #c9a84c, #e0c373);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .brand-icon mat-icon { color: #0f2b46; font-size: 20px; }
    .brand-name { font-size: 17px; font-weight: 700; color: #1e293b; letter-spacing: 1.5px; }
    .brand-module { font-size: 12px; font-weight: 500; color: #64748b; letter-spacing: 0.5px; }
    .module-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 14px;
    }
    .module-chip {
      display: flex; align-items: center; gap: 6px; padding: 7px 10px; border: 1px solid #e2e8f0;
      border-radius: 8px; font-size: 12px; font-weight: 500; cursor: pointer;
      transition: all 0.2s; background: #f8fafc; color: #475569;
      white-space: nowrap; min-width: 0;
    }
    .module-chip:hover { background: #eef2ff; border-color: #c7d2fe; color: #3730a3; }
    .module-chip.active {
      background: linear-gradient(135deg, #0f2b46, #1a3a5c); color: #ffffff;
      border-color: #0f2b46; box-shadow: 0 2px 6px rgba(15,43,70,0.25);
    }
    .module-chip.active .chip-icon { color: #c9a84c; }
    .chip-icon { font-size: 16px; width: 16px; height: 16px; color: #94a3b8; }
    .module-chip:last-child:nth-child(odd) { grid-column: 1 / -1; }
    .nav-list { display: flex; flex-direction: column; gap: 2px; }
    .nav-link {
      display: flex; align-items: center; gap: 12px; padding: 10px 16px; color: #334155;
      font-size: 13px; font-weight: 400; border-radius: 6px; transition: all 0.15s;
      border-left: 3px solid transparent; cursor: pointer; text-decoration: none;
    }
    .nav-link:hover { color: #1e293b; background: #f1f5f9; }
    .nav-link.active-link { color: #2563eb; background: #eef6ff; border-left-color: #3b82f6; }
    .nav-link.sub-item { padding-left: 44px; font-size: 12.5px; }
    .nav-icon { font-size: 20px; width: 20px; height: 20px; color: #94a3b8; }
    .nav-link.active-link .nav-icon { color: #2563eb; }
    .nav-group { display: flex; flex-direction: column; }
    .nav-group-header {
      display: flex; align-items: center; gap: 12px; padding: 10px 16px; color: #334155;
      font-size: 13px; font-weight: 500; border-radius: 6px; transition: all 0.15s;
      border: none; background: transparent; cursor: pointer; width: 100%; text-align: left;
    }
    .nav-group-header:hover { color: #1e293b; background: #f1f5f9; }
    .nav-group-title { flex: 1; }
    .nav-chevron {
      font-size: 18px; width: 18px; height: 18px; color: #94a3b8;
      transition: transform 0.2s;
    }
    .nav-chevron.expanded { transform: rotate(90deg); }
    .nav-group-items { display: flex; flex-direction: column; gap: 1px; }
    .nav-sub-group { display: flex; flex-direction: column; }
    .nav-sub-group-header {
      display: flex; align-items: center; gap: 12px; padding: 10px 16px 10px 44px; color: #334155;
      font-size: 13px; font-weight: 500; border-radius: 6px; transition: all 0.15s;
      border: none; background: transparent; cursor: pointer; width: 100%; text-align: left;
    }
    .nav-sub-group-header:hover { color: #1e293b; background: #f1f5f9; }
    .nav-sub-group-title { flex: 1; }
    .nav-sub-group-items { display: flex; flex-direction: column; gap: 1px; }
    .nav-link.sub-sub-item { padding-left: 68px; font-size: 12.5px; }
    .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .iframe-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; min-width: 0; min-height: 0; }
    .app-iframe { width: 100%; flex: 1; border: none; min-height: 0; }
    @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
    @keyframes pulse { 0%,100% { opacity: .6; } 50% { opacity: 1; } }
    .iframe-loader {
      position: absolute; inset: 0; z-index: 10; background: #f8f9fb;
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px;
    }
    .loader-shield {
      width: 56px; height: 56px; border-radius: 14px; background: #0f2b46;
      mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z'/%3E%3C/svg%3E");
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z'/%3E%3C/svg%3E");
      mask-size: contain; -webkit-mask-size: contain;
      mask-repeat: no-repeat; -webkit-mask-repeat: no-repeat;
      animation: pulse 1.8s ease-in-out infinite;
    }
    .loader-shimmer {
      width: 200px; height: 4px; border-radius: 2px; background: linear-gradient(90deg, #e2e8f0 0%, #0f2b46 50%, #e2e8f0 100%);
      background-size: 400px 4px; animation: shimmer 1.5s ease-in-out infinite;
    }
    .loader-label { font-size: 13px; font-weight: 500; color: #64748b; letter-spacing: 0.3px; }
    .app-toolbar {
      background: white; border-bottom: 1px solid #e2e8f0; height: 56px; padding: 0 8px;
      display: flex; align-items: center; flex-shrink: 0;
    }
    .municipality-name { font-size: 14px; font-weight: 600; color: #1e293b; }
    .period-badge {
      display: inline-flex; align-items: center; background: #e8f5e9; color: #2e7d32;
      font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 16px;
    }
    .audit-badge {
      display: inline-flex; align-items: center; gap: 4px; background: #fef3c7; color: #92400e;
      font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 12px;
    }
    .user-avatar {
      width: 32px; height: 32px; border-radius: 50%; background: #0f2b46; color: white;
      display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600;
    }
    .db-toggle {
      display: inline-flex; align-items: center; gap: 6px; background: #e8f5e9; color: #2e7d32;
      font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 16px; border: none;
      cursor: pointer; margin-right: 8px; transition: all 0.2s;
    }
    .db-toggle:hover { background: #c8e6c9; }
    .db-toggle.sqlserver { background: #e3f2fd; color: #1565c0; }
    .db-toggle.sqlserver:hover { background: #bbdefb; }
    .content-area { flex: 1; overflow-y: auto; padding: 24px; background: #f8f9fb; }
    @media (max-width: 768px) {
      .municipality-name, .period-badge, .audit-badge { display: none; }
      .app-sidenav:not(.collapsed) { position: absolute; z-index: 100; height: 100%; box-shadow: 4px 0 12px rgba(0,0,0,0.1); }
    }
  `]
})
export class ShellComponent implements OnInit, OnDestroy {
  @ViewChild('scmFrame') scmFrame!: ElementRef<HTMLIFrameElement>;
  @ViewChild('posFrame') posFrame!: ElementRef<HTMLIFrameElement>;
  @ViewChild('payrollFrame') payrollFrame!: ElementRef<HTMLIFrameElement>;
  @ViewChild('idpFrame') idpFrame!: ElementRef<HTMLIFrameElement>;
  @ViewChild('insightsFrame') insightsFrame!: ElementRef<HTMLIFrameElement>;
  @ViewChild('budgetFrame') budgetFrame!: ElementRef<HTMLIFrameElement>;
  @ViewChild('afsFrame') afsFrame!: ElementRef<HTMLIFrameElement>;

  sidenavCollapsed = signal(false);
  pendingCount = signal(0);
  activeModule = signal<AppModule>('assets');
  activeIframeRoute = signal('/dashboard');
  iframeLoading = signal<Set<string>>(new Set());
  private expandedGroups = signal<Set<string>>(new Set());
  private iframeObserver: MutationObserver | null = null;
  private pollInterval: any;
  private routeSub!: Subscription;

  assetNavItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Asset Records', icon: 'inventory_2', route: '/assets' },
    { label: 'Acquisitions', icon: 'add_business', route: '/acquisitions' },
    { label: 'Capital Projects (WIP)', icon: 'construction', route: '/wip' },
    { label: 'Transactions', icon: 'swap_horiz', route: '/transactions' },
    { label: 'Maintenance', icon: 'build', route: '/maintenance/requests' },
    { label: 'Asset Verification', icon: 'fact_check', route: '/verification' },
    { label: 'Workflow Inbox', icon: 'task_alt', route: '/workflows' },
    { label: 'Reports', icon: 'summarize', route: '/reports' },
    { label: 'Reconciliation', icon: 'balance', route: '/reconciliation' },
    { label: 'Configuration', icon: 'settings', route: '/config' },
    { label: 'Bulk Upload', icon: 'cloud_upload', route: '/bulk-upload' },
    { label: 'Administration', icon: 'admin_panel_settings', route: '/admin' },
  ];

  scmNavGroups: NavGroup[] = [
    {
      title: 'Procurement',
      icon: 'shopping_bag',
      items: [
        { label: 'Demand', icon: 'trending_up', route: '/demand' },
        { label: 'Requisitions', icon: 'description', route: '/requisitions' },
        { label: 'Quotations', icon: 'request_quote', route: '/quotations' },
        { label: 'Informal Tenders', icon: 'format_list_numbered', route: '/informal-tenders' },
        { label: 'Tenders', icon: 'gavel', route: '/tenders' },
        { label: 'Purchase Orders', icon: 'shopping_cart', route: '/orders' }
      ]
    },
    {
      title: 'Receiving & Payments',
      icon: 'local_shipping',
      items: [
        { label: 'Goods Receipt', icon: 'inventory', route: '/grn' },
        { label: 'Goods Returns', icon: 'assignment_return', route: '/gra' },
        { label: 'Invoices', icon: 'receipt_long', route: '/invoices' },
        { label: 'Payments', icon: 'payment', route: '/payments' },
        { label: 'Interest Charges', icon: 'account_balance', route: '/interest-charges' }
      ]
    },
    {
      title: 'Inventory & Stores',
      icon: 'warehouse',
      items: [
        { label: 'Inventory', icon: 'inventory_2', route: '/inventory' },
        { label: 'Water Inventory', icon: 'water_drop', route: '/water-inventory' },
        { label: 'Land Inventory', icon: 'terrain', route: '/land-inventory' }
      ]
    },
    {
      title: 'Vendor Management',
      icon: 'business_center',
      items: [
        { label: 'Vendors', icon: 'business', route: '/suppliers' },
        { label: 'Supplier Performance', icon: 'speed', route: '/supplier-performance' },
        { label: 'Supplier Portal', icon: 'storefront', route: '/supplier-portal' },
        { label: 'Contracts', icon: 'handshake', route: '/contracts' }
      ]
    },
    {
      title: 'Compliance',
      icon: 'verified_user',
      items: [
        { label: 'IFW Register', icon: 'warning', route: '/ifw-register' },
        { label: 'Audit Trail', icon: 'security', route: '/audit-trail' },
        { label: 'Delegations', icon: 'account_tree', route: '/delegations' }
      ]
    },
    {
      title: 'Reports',
      icon: 'bar_chart',
      items: [
        { label: 'Reports', icon: 'assessment', route: '/reports' },
        { label: 'Analytics', icon: 'analytics', route: '/analytics' },
        { label: 'BI Dashboards', icon: 'dashboard', route: '/bi-dashboards' },
        { label: 'Financial Integration', icon: 'account_balance_wallet', route: '/financial-integration' }
      ]
    },
    {
      title: 'Settings',
      icon: 'settings',
      items: [
        { label: 'Users & Roles', icon: 'admin_panel_settings', route: '/admin/users' },
        { label: 'SCM Configuration', icon: 'tune', route: '/admin/system-config' }
      ]
    }
  ];

  posNavGroups: NavGroup[] = [
    {
      title: 'Point of Sale',
      icon: 'point_of_sale',
      items: [
        { label: 'POS Terminal', icon: 'point_of_sale', route: '/pos' },
        { label: 'Billing Dashboard', icon: 'receipt', route: '/billing-dashboard' },
        { label: 'View Receipts', icon: 'receipt_long', route: '/view-receipts' }
      ]
    },
    {
      title: 'Direct Deposits',
      icon: 'account_balance',
      items: [
        { label: 'Manual Allocation', icon: 'edit_note', route: '/direct-deposits/manual' },
        { label: 'Auto Allocation', icon: 'auto_fix_high', route: '/direct-deposits/auto' },
        { label: 'Allocation History', icon: 'history', route: '/direct-deposits/manual/history' },
        { label: 'Bulk Allocation', icon: 'dynamic_feed', route: '/bulk-allocation' }
      ]
    },
    {
      title: 'Third Party',
      icon: 'groups',
      items: [
        { label: 'Payment Processing', icon: 'payments', route: '/third-party/processing' }
      ]
    },
    {
      title: 'Enquiries',
      icon: 'search',
      items: [
        { label: 'General Enquiries', icon: 'person_search', route: '/enquiries/general' },
        { label: 'Communications', icon: 'mail', route: '/communications' }
      ]
    },
    {
      title: 'Debt Management',
      icon: 'gavel',
      items: [
        { label: 'Section 129 Notices', icon: 'description', route: '/debt/section129' },
        { label: 'Handover', icon: 'forward', route: '/debt/handover' },
        { label: 'Risk Scoring', icon: 'trending_up', route: '/debt/risk-scoring' },
        { label: 'Batch Processing', icon: 'dynamic_feed', route: '/debt/batch-processing' },
        { label: 'Communications', icon: 'forum', route: '/debt/communication-dashboard' },
        { label: 'Process Monitoring', icon: 'monitor', route: '/debt/process-monitoring' }
      ]
    },
    {
      title: 'Legal',
      icon: 'balance',
      items: [
        { label: 'Legal Rules', icon: 'rule', route: '/legal/rules' },
        { label: 'Audit Trail', icon: 'history', route: '/legal/audit-trail' },
        { label: 'Evidence Bundle', icon: 'folder', route: '/legal/evidence-bundle' }
      ]
    },
    {
      title: 'Analytics',
      icon: 'analytics',
      items: [
        { label: 'Executive Dashboard', icon: 'dashboard', route: '/analytics/executive-dashboard' },
        { label: 'Predictive Forecasting', icon: 'trending_up', route: '/analytics/predictive-forecasting' },
        { label: 'Geographic Mapping', icon: 'map', route: '/analytics/geographic-mapping' }
      ]
    },
    {
      title: 'Administration',
      icon: 'settings',
      items: [
        { label: 'Supervisor', icon: 'supervisor_account', route: '/supervisor' },
        { label: 'Settings', icon: 'tune', route: '/settings' }
      ]
    }
  ];

  payrollNavGroups: NavGroup[] = [
    {
      title: 'HR Management',
      icon: 'people',
      items: [
        { label: 'Employees', icon: 'badge', route: '/employees' },
        { label: 'Job Profiles', icon: 'description', route: '/job-profiles' },
        { label: 'Positions', icon: 'work', route: '/positions' },
        { label: 'Organogram', icon: 'account_tree', route: '/organogram' },
        { label: 'Employee Self-Service', icon: 'person', route: '/ess' }
      ]
    },
    {
      title: 'Payroll',
      icon: 'payments',
      items: [
        { label: 'Payroll Overview', icon: 'dashboard', route: '/payroll' },
        { label: 'Payroll Run', icon: 'play_circle', route: '/payroll/run' },
        { label: 'Payslip View', icon: 'receipt_long', route: '/payroll/payslip-view' },
        { label: 'Wages', icon: 'monetization_on', route: '/payroll/wages' },
        { label: 'Claims', icon: 'request_quote', route: '/payroll/claims' },
        { label: 'Salary Structure', icon: 'tune', route: '/salary-structure' }
      ]
    },
    {
      title: 'Benefits & Deductions',
      icon: 'account_balance_wallet',
      items: [
        { label: 'Benefits', icon: 'health_and_safety', route: '/benefits' },
        { label: 'Medical Aid Schemes', icon: 'local_hospital', route: '/medical-aid-schemes' },
        { label: 'Retirement Funds', icon: 'savings', route: '/retirement-funds' },
        { label: 'Trade Unions', icon: 'groups', route: '/trade-unions' },
        { label: 'Pay Points', icon: 'point_of_sale', route: '/pay-points' }
      ]
    },
    {
      title: 'Leave & Time',
      icon: 'event_available',
      items: [
        { label: 'Leave Management', icon: 'event_note', route: '/leave' },
        { label: 'Time & Attendance', icon: 'schedule', route: '/time' }
      ]
    },
    {
      title: 'Performance & Skills',
      icon: 'trending_up',
      items: [
        { label: 'Performance', icon: 'assessment', route: '/performance' },
        { label: 'Skills Audit', icon: 'school', route: '/skills' },
        { label: 'Disciplinary', icon: 'gavel', route: '/disciplinary' },
        { label: 'Recruitment', icon: 'person_search', route: '/recruitment' }
      ]
    },
    {
      title: 'Reports',
      icon: 'bar_chart',
      items: [
        { label: 'Reports Centre', icon: 'summarize', route: '/reports' }
      ]
    },
    {
      title: 'Settings',
      icon: 'settings',
      items: [
        { label: 'Municipality', icon: 'location_city', route: '/settings/municipality' },
        { label: 'Constants', icon: 'numbers', route: '/settings/constants' },
        { label: 'Employee Types', icon: 'category', route: '/settings/employee-types' },
        { label: 'Task Grades', icon: 'grade', route: '/settings/task-grades' },
        { label: 'Conditions', icon: 'rule', route: '/settings/conditions' },
        { label: 'Tax Tables', icon: 'table_chart', route: '/settings/tax' },
        { label: 'IRP5 Source Codes', icon: 'code', route: '/settings/irp5-source-codes' },
        { label: 'Leave Types', icon: 'event', route: '/settings/leave-types' },
        { label: 'Salary Heads', icon: 'payments', route: '/settings/salary-heads' },
        { label: 'Payroll Cycles', icon: 'loop', route: '/settings/payroll-cycles' },
        { label: 'GL Integration', icon: 'sync', route: '/settings/gl-integration' },
        { label: 'Bank Settings', icon: 'account_balance', route: '/settings/bank' },
        { label: 'Security', icon: 'security', route: '/settings/security' },
        { label: 'Workflows', icon: 'linear_scale', route: '/settings/workflows' },
        { label: 'Data Conversion', icon: 'cloud_upload', route: '/settings/data-conversion' }
      ]
    }
  ];

  idpNavGroups: NavGroup[] = [
    {
      title: 'Planning',
      icon: 'timeline',
      items: [
        { label: 'Process Plan', icon: 'timeline', route: '/process-plan' },
        { label: 'Strategic Objectives', icon: 'flag', route: '/objectives' },
        { label: 'Projects', icon: 'folder_open', route: '/projects' },
        { label: 'Spatial Report', icon: 'map', route: '/spatial-report' }
      ]
    },
    {
      title: 'Participation',
      icon: 'forum',
      items: [
        { label: 'Public Participation', icon: 'forum', route: '/comments' }
      ]
    },
    {
      title: 'Prioritisation',
      icon: 'format_list_numbered',
      items: [
        { label: 'Framework Config', icon: 'tune', route: '/priority-config' },
        { label: 'Project Scoring', icon: 'format_list_numbered', route: '/prioritisation' }
      ]
    },
    {
      title: 'Documents',
      icon: 'description',
      items: [
        { label: 'Draft IDP', icon: 'description', route: '/draft-idp' },
        { label: 'Final IDP', icon: 'verified', route: '/final-idp' }
      ]
    },
    {
      title: 'Governance',
      icon: 'approval',
      items: [
        { label: 'Approvals', icon: 'approval', route: '/approvals' },
        { label: 'GoMuni Submission', icon: 'cloud_upload', route: '/gomuni' }
      ]
    }
  ];

  insightsNavGroups: NavGroup[] = [
    { title: 'Configuration', icon: 'settings', items: [
      { label: 'Performance Cycles', icon: 'loop', route: '/config/cycles' },
      { label: 'KPI Groups', icon: 'category', route: '/config/kpi-groups' },
      { label: 'Units of Measure', icon: 'straighten', route: '/config/units' },
      { label: 'Data Types', icon: 'data_object', route: '/config/data-types' },
      { label: 'Progress Statuses', icon: 'pending', route: '/config/statuses' },
      { label: 'Scorecard Types', icon: 'view_list', route: '/config/scorecard-types' }
    ]},
    { title: 'Weightings', icon: 'balance', items: [
      { label: 'NKPA Weightings', icon: 'pie_chart', route: '/weightings/nkpa' },
      { label: 'Competency Req.', icon: 'bar_chart', route: '/weightings/competencies' }
    ]},
    { title: 'Deadlines', icon: 'schedule', items: [
      { label: 'Submission Deadlines', icon: 'event_note', route: '/deadlines/submissions' },
      { label: 'Report Fields', icon: 'event_busy', route: '/deadlines/report-fields' }
    ]},
    { title: 'Notifications', icon: 'notifications', items: [
      { label: 'Notification Centre', icon: 'mail_outline', route: '/notifications' },
      { label: 'Notification Config', icon: 'settings', route: '/notifications/config' }
    ]},
    { title: 'Org Planning', icon: 'corporate_fare', items: [
      { label: 'KPI Scorecards', icon: 'account_tree', route: '/org-planning/scorecards' },
      { label: 'Quarterly Targets', icon: 'calendar_month', route: '/org-planning/quarterly-targets' }
    ]},
    { title: 'SDBIP', icon: 'business', items: [
      { label: 'SDBIP Overview', icon: 'description', route: '/sdbip/overview' },
      { label: 'Strategic Objectives', icon: 'flag', route: '/sdbip/objectives' }
    ]},
    { title: 'Departmental', icon: 'apartment', items: [
      { label: 'Dept Scorecards', icon: 'dashboard', route: '/departmental/scorecards' },
      { label: 'KPI Assignments', icon: 'assignment', route: '/departmental/kpi-assignments' }
    ]},
    { title: 'Individual', icon: 'person', items: [
      { label: 'My Performance', icon: 'trending_up', route: '/individual/my-performance' },
      { label: 'Agreements', icon: 'handshake', route: '/individual/agreements' },
      { label: 'Reviewers', icon: 'supervisor_account', route: '/individual/reviewers' },
      { label: 'Competencies', icon: 'school', route: '/individual/competencies' },
      { label: 'Assessments', icon: 'rate_review', route: '/individual/assessments' }
    ]},
    { title: 'Actuals & Evidence', icon: 'fact_check', items: [
      { label: 'Submit Actuals', icon: 'data_usage', route: '/actuals/submit' },
      { label: 'Evidence Upload', icon: 'upload_file', route: '/actuals/evidence' },
      { label: 'Corrective Actions', icon: 'build', route: '/actuals/corrective-actions' }
    ]},
    { title: 'Moderation', icon: 'gavel', items: [
      { label: 'Review Queue', icon: 'playlist_add_check', route: '/moderation/queue' },
      { label: 'Moderation Panel', icon: 'campaign', route: '/moderation/panel' }
    ]},
    { title: 'Reports', icon: 'assessment', items: [
      { label: 'Report Centre', icon: 'analytics', route: '/reports/centre' },
      { label: 'Standard Reports', icon: 'summarize', route: '/reports/standard' },
      { label: 'Custom Reports', icon: 'tune', route: '/reports/custom' }
    ]},
    { title: 'Admin', icon: 'admin_panel_settings', items: [
      { label: 'User Management', icon: 'manage_accounts', route: '/admin/users' },
      { label: 'Role Permissions', icon: 'settings_applications', route: '/admin/roles' },
      { label: 'Workflows', icon: 'account_tree', route: '/admin/workflows' }
    ]}
  ];

  budgetNavGroups: BudgetNavGroup[] = [
    {
      title: 'Budget Management',
      icon: 'settings',
      subGroups: [
        {
          label: 'Projects',
          icon: 'folder_open',
          children: [
            { label: 'Project Budgets', icon: 'folder', route: '/projects' },
            { label: 'Export Original Budget', icon: 'file_download', route: '/projects/export-original-budget' },
            { label: 'Export Adjustment Budget', icon: 'tune', route: '/projects/export-adjustment-budget' },
            { label: 'Import Projects', icon: 'file_upload', route: '/projects/import' },
            { label: 'Register Projects / Exception List', icon: 'app_registration', route: '/projects/register' },
            { label: 'Add Zero Budget Items to Current Budget', icon: 'exposure_zero', route: '/projects/zero-budget' },
            { label: 'CP3 Project Sync', icon: 'sync', route: '/projects/cp3-sync' }
          ]
        },
        {
          label: 'Budget Approval',
          icon: 'approval',
          children: [
            { label: 'Approve Draft', icon: 'rate_review', route: '/budget-approval/approve-draft' },
            { label: 'Approve Final', icon: 'check_circle', route: '/budget-approval/approve-final' }
          ]
        }
      ],
      items: [
        { label: 'Budget Versions', icon: 'history', route: '/budget-versions' },
        { label: 'mSCOA Strings', icon: 'code', route: '/budget-strings' },
        { label: 'Virements', icon: 'swap_horiz', route: '/virements' },
        { label: 'Virement Policy', icon: 'policy', route: '/virement-policy' }
      ]
    },
    {
      title: 'Billing Budgeting',
      icon: 'receipt_long',
      items: [
        { label: 'Service & Tariffs', icon: 'receipt_long', route: '/billing/tariffs' },
        { label: 'Tariff Scenarios', icon: 'compare_arrows', route: '/billing/scenarios' },
        { label: 'Consumer Categories', icon: 'groups', route: '/billing/consumers' },
        { label: 'Revenue Projections', icon: 'trending_up', route: '/billing/revenue' },
        { label: 'Rebate Management', icon: 'discount', route: '/billing/rebates' },
        { label: 'Draft Revenue Budget', icon: 'summarize', route: '/billing/draft-budget' }
      ]
    },
    {
      title: 'Creditors Budgeting',
      icon: 'account_balance_wallet',
      items: [
        { label: 'Expenditure & Cost Items', icon: 'category', route: '/creditors/expenditure' },
        { label: 'Expenditure Scenarios', icon: 'compare_arrows', route: '/creditors/scenarios' },
        { label: 'Creditor Categories', icon: 'account_balance', route: '/creditors/categories' },
        { label: 'Expenditure Projections', icon: 'analytics', route: '/creditors/projections' },
        { label: 'Creditor Liabilities', icon: 'account_balance_wallet', route: '/creditors/liabilities' },
        { label: 'Draft Expenditure Budget', icon: 'summarize', route: '/creditors/draft-budget' }
      ]
    },
    {
      title: 'HR & Payroll Budgeting',
      icon: 'people',
      items: [
        { label: 'Post Establishment', icon: 'badge', route: '/hr-payroll/post-establishment' },
        { label: 'Salary & Benefits', icon: 'calculate', route: '/hr-payroll/salary-calculations' },
        { label: 'Variable Benefits & Travel', icon: 'schedule', route: '/hr-payroll/variable-benefits' },
        { label: 'Statutory Deductions', icon: 'gavel', route: '/hr-payroll/statutory-deductions' },
        { label: 'Benefit Obligations', icon: 'account_balance', route: '/hr-payroll/benefit-obligations' },
        { label: 'Draft Payroll Budget', icon: 'summarize', route: '/hr-payroll/draft-budget' }
      ]
    },
    {
      title: 'Monitoring',
      icon: 'monitoring',
      items: [
        { label: 'Validation', icon: 'verified', route: '/validation' },
        { label: 'Reports', icon: 'description', route: '/reports' },
        { label: 'Analytics', icon: 'insights', route: '/analytics' }
      ]
    }
  ];

  afsNavGroups: NavGroup[] = [
    {
      title: 'AFS Builder',
      icon: 'description',
      items: [
        { label: 'General Information', icon: 'info', route: '/general-information' },
        { label: 'Accounting Policies', icon: 'policy', route: '/accounting-policies' },
        { label: 'Compilations', icon: 'calculate', route: '/compilations' },
        { label: 'Data Sources (TB)', icon: 'table_chart', route: '/tb-import-workbench' },
        { label: 'Opening Balance Control', icon: 'balance', route: '/opening-balance-control' },
        { label: 'Mapping Workbench', icon: 'map', route: '/mapping-workbench' },
        { label: 'Integrity Checks', icon: 'fact_check', route: '/integrity' },
        { label: 'Adjustments', icon: 'tune', route: '/adjustments' },
        { label: 'Versioning & Locking', icon: 'lock', route: '/afs-versions' },
        { label: 'Export Center', icon: 'download', route: '/exports' }
      ]
    },
    {
      title: 'Reference Data',
      icon: 'library_books',
      items: [
        { label: 'Template Library', icon: 'library_books', route: '/templates' },
        { label: 'Mapping Studio', icon: 'account_tree', route: '/mappings' },
        { label: 'mSCOA Chart', icon: 'schema', route: '/mscoa' },
        { label: 'Reports & Analytics', icon: 'analytics', route: '/reports' }
      ]
    },
    {
      title: 'Audit Collaboration',
      icon: 'verified_user',
      items: [
        { label: 'Working Papers', icon: 'description', route: '/working-papers' },
        { label: 'RFI Management', icon: 'question_answer', route: '/rfis' },
        { label: 'Audit Findings', icon: 'report_problem', route: '/findings' },
        { label: 'Document Management', icon: 'folder_special', route: '/documents' }
      ]
    },
    {
      title: 'System',
      icon: 'settings',
      items: [
        { label: 'Administration', icon: 'admin_panel_settings', route: '/admin' },
        { label: 'Rules Engine', icon: 'rule', route: '/admin/validation-rules' }
      ]
    }
  ];

  municipalityName = computed(() => {
    var s = this.orgSettings.settings();
    return (s && s.municipality_name) ? s.municipality_name : 'Mnquma Local Municipality';
  });

  activeFinYear = computed(() => {
    var s = this.orgSettings.settings();
    if (s && s.financial_year) {
      return s.financial_year;
    }
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    if (month >= 7) {
      return year + '/' + (year + 1);
    }
    return (year - 1) + '/' + year;
  });

  activePeriod = computed(() => {
    var s = this.orgSettings.settings();
    if (s && s.current_period_month) {
      return s.current_period_month;
    }
    if (s && s.current_period) {
      return s.current_period;
    }
    var now = new Date();
    var month = now.getMonth() + 1;
    if (month >= 7) {
      return month - 6;
    }
    return month + 6;
  });

  scmUrl: SafeResourceUrl;
  posUrl: SafeResourceUrl;
  payrollUrl: SafeResourceUrl;
  idpUrl: SafeResourceUrl;
  insightsUrl: SafeResourceUrl;
  budgetUrl: SafeResourceUrl;
  afsUrl: SafeResourceUrl;

  constructor(private api: ApiService, private router: Router, public dbToggle: DatabaseToggleService, private orgSettings: OrgSettingsService, private sanitizer: DomSanitizer, private authService: AuthService) {
    this.scmUrl = this.sanitizer.bypassSecurityTrustResourceUrl('/scm-app/');
    this.posUrl = this.sanitizer.bypassSecurityTrustResourceUrl('/pos-app/');
    this.payrollUrl = this.sanitizer.bypassSecurityTrustResourceUrl('/payroll-app/');
    this.idpUrl = this.sanitizer.bypassSecurityTrustResourceUrl('/idp-app/');
    this.insightsUrl = this.sanitizer.bypassSecurityTrustResourceUrl('/insights-app/');
    this.budgetUrl = this.sanitizer.bypassSecurityTrustResourceUrl('/budget-app/');
    this.afsUrl = this.sanitizer.bypassSecurityTrustResourceUrl('/afs-app/');
  }

  ngOnInit() {
    this.syncModuleFromUrl(this.router.url);
    this.routeSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => this.syncModuleFromUrl(e.urlAfterRedirects));
    this.loadPendingCount();
    this.pollInterval = setInterval(this.loadPendingCount.bind(this), 60000);
  }

  ngOnDestroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.routeSub) this.routeSub.unsubscribe();
    if (this.iframeObserver) { this.iframeObserver.disconnect(); this.iframeObserver = null; }
  }

  private syncModuleFromUrl(url: string) {
    let mod: AppModule = 'assets';
    if (url.startsWith('/scm')) { mod = 'scm'; }
    else if (url.startsWith('/pos')) { mod = 'pos'; }
    else if (url.startsWith('/payroll')) { mod = 'payroll'; }
    else if (url.startsWith('/idp')) { mod = 'idp'; }
    else if (url.startsWith('/insights')) { mod = 'insights'; }
    else if (url.startsWith('/budget')) { mod = 'budget'; }
    else if (url.startsWith('/afs')) { mod = 'afs'; }
    this.activeModule.set(mod);
    if (mod !== 'assets') { this.setIframeLoading(mod); }
  }

  loadPendingCount() {
    this.api.getPendingCount().subscribe({
      next: function(this: ShellComponent, res: any) {
        this.pendingCount.set(res?.total || 0);
      }.bind(this),
      error: function(this: ShellComponent) {
        this.pendingCount.set(0);
      }.bind(this)
    });
  }

  openWorkflowInbox() {
    this.router.navigate(['/workflows']);
  }

  private setIframeLoading(mod: string) {
    const s = new Set(this.iframeLoading());
    s.add(mod);
    this.iframeLoading.set(s);
  }

  private clearIframeLoading(mod: string) {
    const s = new Set(this.iframeLoading());
    s.delete(mod);
    this.iframeLoading.set(s);
  }

  setModule(mod: AppModule) {
    this.activeModule.set(mod);
    if (mod !== 'assets') { this.setIframeLoading(mod); }
    if (mod === 'scm') {
      this.router.navigate(['/scm']);
    } else if (mod === 'pos') {
      this.router.navigate(['/pos-view']);
    } else if (mod === 'payroll') {
      this.router.navigate(['/payroll-view']);
    } else if (mod === 'idp') {
      this.router.navigate(['/idp-view']);
    } else if (mod === 'insights') {
      this.router.navigate(['/insights-view']);
    } else if (mod === 'budget') {
      this.router.navigate(['/budget-view']);
    } else if (mod === 'afs') {
      this.router.navigate(['/afs-view']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  toggleDatabase() {
    if (this.dbToggle.activeBackend() === 'postgresql') {
      this.dbToggle.setBackend('sqlserver');
    } else {
      this.dbToggle.setBackend('postgresql');
    }
  }

  toggleGroup(title: string) {
    const current = new Set(this.expandedGroups());
    if (current.has(title)) {
      current.delete(title);
    } else {
      current.add(title);
    }
    this.expandedGroups.set(current);
  }

  isGroupExpanded(title: string): boolean {
    return this.expandedGroups().has(title);
  }

  navigateIframe(module: 'scm' | 'pos' | 'payroll' | 'idp' | 'insights' | 'budget' | 'afs', route: string) {
    this.activeIframeRoute.set(route);
    const prefixMap: Record<string, string> = { scm: '/scm-app', pos: '/pos-app', payroll: '/payroll-app', idp: '/idp-app', insights: '/insights-app', budget: '/budget-app', afs: '/afs-app' };
    const prefix = prefixMap[module];
    try {
      const iframe = this.getIframeElement(module);
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.location.href = prefix + route;
      }
    } catch (e) {
      const url = this.sanitizer.bypassSecurityTrustResourceUrl(prefix + route);
      if (module === 'scm') { this.scmUrl = url; }
      else if (module === 'pos') { this.posUrl = url; }
      else if (module === 'idp') { this.idpUrl = url; }
      else if (module === 'insights') { this.insightsUrl = url; }
      else if (module === 'budget') { this.budgetUrl = url; }
      else if (module === 'afs') { this.afsUrl = url; }
      else { this.payrollUrl = url; }
    }
  }

  private getIframeElement(module: 'scm' | 'pos' | 'payroll' | 'idp' | 'insights' | 'budget' | 'afs'): HTMLIFrameElement | undefined {
    if (module === 'scm') return this.scmFrame?.nativeElement;
    if (module === 'pos') return this.posFrame?.nativeElement;
    if (module === 'idp') return this.idpFrame?.nativeElement;
    if (module === 'insights') return this.insightsFrame?.nativeElement;
    if (module === 'budget') return this.budgetFrame?.nativeElement;
    if (module === 'afs') return this.afsFrame?.nativeElement;
    return this.payrollFrame?.nativeElement;
  }

  onIframeLoad(module: 'scm' | 'pos' | 'payroll' | 'idp' | 'insights' | 'budget' | 'afs') {
    this.clearIframeLoading(module);
    this.injectEmbedStyles(module);
    this.watchIframeChanges(module);
  }

  private injectEmbedStyles(module: 'scm' | 'pos' | 'payroll' | 'idp' | 'insights' | 'budget' | 'afs') {
    try {
      const iframe = this.getIframeElement(module);
      if (!iframe || !iframe.contentDocument) return;
      const doc = iframe.contentDocument;
      if (doc.getElementById('platinum-embed-style')) return;
      const style = doc.createElement('style');
      style.id = 'platinum-embed-style';
      style.textContent = `
        .app-sidenav,
        aside.app-sidenav,
        mat-sidenav.app-sidenav,
        .mat-drawer.app-sidenav,
        mat-sidenav-container > mat-sidenav,
        .mat-drawer:not(.mat-sidenav-content) {
          display: none !important;
          width: 0 !important;
          min-width: 0 !important;
          max-width: 0 !important;
          overflow: hidden !important;
          flex: 0 0 0px !important;
        }
        .mat-sidenav-content,
        mat-sidenav-content,
        mat-sidenav-content.main-content,
        .mat-drawer-content {
          margin-left: 0 !important;
        }
        .mat-drawer-backdrop,
        .sidebar-overlay {
          display: none !important;
        }
        .app-main {
          flex: 1 !important;
          min-width: 0 !important;
        }
      `;
      doc.head.appendChild(style);
    } catch (e) {}
  }

  private watchIframeChanges(module: 'scm' | 'pos' | 'payroll' | 'idp' | 'insights' | 'budget' | 'afs') {
    if (this.iframeObserver) {
      this.iframeObserver.disconnect();
      this.iframeObserver = null;
    }
    try {
      const iframe = this.getIframeElement(module);
      if (!iframe || !iframe.contentDocument) return;
      this.iframeObserver = new MutationObserver(() => {
        this.injectEmbedStyles(module);
      });
      this.iframeObserver.observe(iframe.contentDocument.body, {
        childList: true,
        subtree: true
      });
    } catch (e) {}
  }

  onLogout() {
    this.authService.logout();
  }
}
