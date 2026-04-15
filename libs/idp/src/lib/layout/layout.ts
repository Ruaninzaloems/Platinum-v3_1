import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { CycleStateService } from '../core/services/cycle-state.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  template: `
    <div class="app-shell">
      <nav class="sidebar" [class.collapsed]="sidebarCollapsed()">
        <div class="sidebar-header">
          <div class="brand">
            <div class="brand-icon">
              <span class="material-icon">account_balance</span>
            </div>
            <div class="brand-text" *ngIf="!sidebarCollapsed()">
              <span class="brand-name">PLATINUM</span>
              <span class="brand-sub">IDP</span>
            </div>
          </div>
        </div>

        <div class="sidebar-nav">
          <a class="nav-link" routerLink="/dashboard" routerLinkActive="active-link" data-testid="nav-dashboard">
            <span class="material-icon nav-icon">dashboard</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Dashboard</span>
          </a>

          <a class="nav-link" routerLink="/cycles" routerLinkActive="active-link" data-testid="nav-cycles">
            <span class="material-icon nav-icon">loop</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">IDP Cycles</span>
          </a>

          <div class="nav-group-label" *ngIf="!sidebarCollapsed()">PLANNING</div>

          <a class="nav-link" routerLink="/process-plan" routerLinkActive="active-link" data-testid="nav-process-plan">
            <span class="material-icon nav-icon">timeline</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Process Plan</span>
          </a>

          <a class="nav-link" routerLink="/objectives" routerLinkActive="active-link" data-testid="nav-objectives">
            <span class="material-icon nav-icon">flag</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Strategic Objectives</span>
          </a>

          <a class="nav-link" routerLink="/projects" routerLinkActive="active-link" data-testid="nav-projects">
            <span class="material-icon nav-icon">folder_open</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Projects</span>
          </a>

          <a class="nav-link" routerLink="/spatial-report" routerLinkActive="active-link" data-testid="nav-spatial-report">
            <span class="material-icon nav-icon">map</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Spatial Report</span>
          </a>

          <div class="nav-group-label" *ngIf="!sidebarCollapsed()">PARTICIPATION</div>

          <a class="nav-link" routerLink="/comments" routerLinkActive="active-link" data-testid="nav-comments">
            <span class="material-icon nav-icon">forum</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Public Participation</span>
          </a>

          <div class="nav-group-label" *ngIf="!sidebarCollapsed()">PRIORITISATION</div>

          <a class="nav-link" routerLink="/priority-config" routerLinkActive="active-link" data-testid="nav-priority-config">
            <span class="material-icon nav-icon">tune</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Framework Config</span>
          </a>

          <a class="nav-link" routerLink="/prioritisation" routerLinkActive="active-link" data-testid="nav-prioritisation">
            <span class="material-icon nav-icon">format_list_numbered</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Project Scoring</span>
          </a>

          <div class="nav-group-label" *ngIf="!sidebarCollapsed()">DOCUMENTS</div>

          <a class="nav-link" routerLink="/draft-idp" routerLinkActive="active-link" data-testid="nav-draft-idp">
            <span class="material-icon nav-icon">description</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Draft IDP</span>
          </a>

          <a class="nav-link" routerLink="/final-idp" routerLinkActive="active-link" data-testid="nav-final-idp">
            <span class="material-icon nav-icon">verified</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Final IDP</span>
          </a>

          <div class="nav-group-label" *ngIf="!sidebarCollapsed()">GOVERNANCE</div>

          <a class="nav-link" routerLink="/approvals" routerLinkActive="active-link" data-testid="nav-approvals">
            <span class="material-icon nav-icon">approval</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Approvals</span>
          </a>

          <a class="nav-link" routerLink="/gomuni" routerLinkActive="active-link" data-testid="nav-gomuni">
            <span class="material-icon nav-icon">cloud_upload</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">GoMuni Submission</span>
          </a>
        </div>

        <div class="sidebar-footer" *ngIf="!sidebarCollapsed()">
          <a class="api-doc-link" href="/docs/Platinum_IDP_API_Reference.html" target="_blank" data-testid="link-api-docs">
            <span class="material-icon" style="font-size: 16px;">description</span>
            <span>API Reference</span>
            <span class="material-icon" style="font-size: 14px; margin-left: auto;">open_in_new</span>
          </a>
          <div class="version-info">
            <span class="material-icon" style="font-size: 14px; color: #94a3b8;">info</span>
            <span>v1.0.0 · MSCOA Compliant</span>
          </div>
        </div>
      </nav>

      <div class="main-area">
        <header class="toolbar">
          <div class="toolbar-left">
            <button class="toggle-btn" (click)="toggleSidebar()" data-testid="button-sidebar-toggle">
              <span class="material-icon">menu</span>
            </button>
            <div class="municipality-info" *ngIf="cycleState.activeCycle() as cycle">
              <span class="municipality-name" data-testid="text-municipality">{{ cycle.municipalityName }}</span>
              <span class="period-badge" data-testid="text-period">{{ cycle.startYear }}/{{ cycle.startYear + 1 }} - {{ cycle.endYear - 1 }}/{{ cycle.endYear }}</span>
            </div>
          </div>
          <div class="toolbar-right">
            <div class="cycle-status" *ngIf="cycleState.activeCycle() as cycle">
              <span class="status-badge" [attr.data-status]="statusKey(cycle.status)" data-testid="text-cycle-status">{{ cycle.status }}</span>
              <span class="lock-icon" *ngIf="cycle.isLocked" title="Locked after adoption">
                <span class="material-icon" style="font-size: 18px; color: #ef5350;">lock</span>
              </span>
            </div>
            <div class="revision-badge" *ngIf="cycleState.activeCycle() as cycle" data-testid="text-revision">
              Rev {{ cycle.revisionNumber }}
            </div>
            <div class="user-avatar" data-testid="user-avatar">
              <span>SM</span>
            </div>
          </div>
        </header>

        <main class="content-area">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-shell { display: flex; height: 100vh; overflow: hidden; }

    .sidebar {
      width: 240px; background: #ffffff; border-right: 1px solid #e8ecf1;
      display: flex; flex-direction: column; transition: width 0.2s ease;
      overflow-x: hidden; flex-shrink: 0;
    }
    .sidebar.collapsed { width: 64px; }

    .sidebar-header { padding: 20px 16px; border-bottom: 1px solid #e8ecf1; }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand-icon {
      width: 36px; height: 36px; border-radius: 8px;
      background: linear-gradient(135deg, #0f2b46, #1a3a5c);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .brand-icon .material-icon { color: #c9a84c; font-size: 20px; }
    .brand-text { display: flex; flex-direction: column; }
    .brand-name { font-size: 17px; font-weight: 700; color: #1e293b; letter-spacing: 1.5px; }
    .brand-sub { font-size: 10px; font-weight: 500; color: #64748b; letter-spacing: 0.5px; }

    .sidebar-nav { flex: 1; padding: 12px 8px; overflow-y: auto; }

    .nav-group-label {
      font-size: 10px; font-weight: 600; color: #94a3b8; letter-spacing: 0.8px;
      text-transform: uppercase; padding: 16px 16px 6px;
    }

    .nav-link {
      display: flex; align-items: center; gap: 12px; padding: 10px 16px;
      color: #334155; text-decoration: none; font-size: 13px; font-weight: 400;
      border-radius: 6px; transition: all 0.15s ease;
      border-left: 3px solid transparent; cursor: pointer; margin-bottom: 2px;
    }
    .nav-link:hover { color: #1e293b; background: #f1f5f9; }
    .nav-link.active-link { color: #2563eb; background: #eef6ff; border-left-color: #3b82f6; }
    .nav-icon { font-size: 20px; width: 20px; height: 20px; color: #94a3b8; display: flex; align-items: center; justify-content: center; }
    .nav-link.active-link .nav-icon { color: #2563eb; }

    .sidebar-footer { padding: 12px 16px; border-top: 1px solid #e8ecf1; }
    .api-doc-link {
      display: flex; align-items: center; gap: 8px; padding: 8px 10px; margin-bottom: 8px;
      border-radius: 6px; background: #f0f4ff; color: #2563eb; text-decoration: none;
      font-size: 12px; font-weight: 500; transition: background 0.15s;
    }
    .api-doc-link:hover { background: #dbeafe; }
    .version-info { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #94a3b8; }

    .main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #f8f9fb; min-width: 0; }

    .toolbar {
      background: white; color: #1e293b; border-bottom: 1px solid #e2e8f0;
      height: 56px; padding: 0 16px; display: flex; align-items: center;
      justify-content: space-between; flex-shrink: 0; position: sticky; top: 0; z-index: 10;
    }
    .toolbar-left { display: flex; align-items: center; gap: 16px; }
    .toggle-btn {
      background: none; border: none; cursor: pointer; padding: 6px;
      border-radius: 6px; color: #64748b; display: flex; align-items: center;
    }
    .toggle-btn:hover { background: #f1f5f9; color: #1e293b; }
    .municipality-info { display: flex; align-items: center; gap: 12px; }
    .municipality-name { font-size: 14px; font-weight: 600; color: #1e293b; }
    .period-badge {
      display: inline-flex; align-items: center; background: #e8f5e9;
      color: #2e7d32; font-size: 12px; font-weight: 600; padding: 4px 12px;
      border-radius: 16px; white-space: nowrap;
    }

    .toolbar-right { display: flex; align-items: center; gap: 12px; }
    .status-badge {
      display: inline-flex; padding: 4px 12px; border-radius: 20px;
      font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;
    }
    .status-badge[data-status="draft"] { background: #f1f5f9; color: #64748b; }
    .status-badge[data-status="in-review"] { background: #fff3e0; color: #ef6c00; }
    .status-badge[data-status="approved-for-distribution"] { background: #e3f2fd; color: #1565c0; }
    .status-badge[data-status="adopted"] { background: #e8f5e9; color: #1b5e20; }
    .status-badge[data-status="revised"] { background: #f3e5f5; color: #6a1b9a; }

    .revision-badge {
      display: inline-flex; padding: 3px 10px; border-radius: 20px;
      font-size: 11px; font-weight: 600; background: #e8eaf6; color: #283593;
    }

    .user-avatar {
      width: 32px; height: 32px; border-radius: 50%; background: #0f2b46;
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 600;
    }

    .content-area { flex: 1; overflow-y: auto; padding: 24px; background: #ffffff; }

    @media (max-width: 768px) {
      .municipality-name, .period-badge, .revision-badge { display: none; }
      .content-area { padding: 16px; }
      .sidebar { width: 64px; }
      .sidebar .nav-label, .sidebar .brand-text, .sidebar .nav-group-label, .sidebar .sidebar-footer { display: none; }
    }
  `]
})
export class LayoutComponent {
  sidebarCollapsed = signal(false);

  constructor(public cycleState: CycleStateService) {}

  toggleSidebar() {
    this.sidebarCollapsed.update(v => !v);
  }

  statusKey(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }
}
