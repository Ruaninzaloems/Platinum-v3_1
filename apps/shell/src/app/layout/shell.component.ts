import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '@platinumv3/shared/auth';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatSidenavModule, MatListModule, MatIconModule, MatButtonModule, MatTooltipModule
  ],
  template: `
    <div class="shell-container" [class.collapsed]="sidebarCollapsed()">
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="brand">
            <div class="brand-icon">
              <mat-icon>verified_user</mat-icon>
            </div>
            @if (!sidebarCollapsed()) {
              <div class="brand-text">
                <span class="brand-name">PLATINUM</span>
                <span class="brand-sub">ERP</span>
              </div>
            }
          </div>
          <button mat-icon-button class="toggle-btn" (click)="sidebarCollapsed.set(!sidebarCollapsed())">
            <mat-icon>{{ sidebarCollapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
          </button>
        </div>

        <nav class="sidebar-nav">
          <a class="nav-item" routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
            <mat-icon>dashboard</mat-icon>
            @if (!sidebarCollapsed()) { <span>Dashboard</span> }
          </a>
          @for (item of navItems; track item.path) {
            <a class="nav-item" [routerLink]="item.path" routerLinkActive="active" [matTooltip]="sidebarCollapsed() ? item.label : ''">
              <mat-icon [style.color]="item.color">{{ item.icon }}</mat-icon>
              @if (!sidebarCollapsed()) { <span>{{ item.label }}</span> }
            </a>
          }
        </nav>

        <div class="sidebar-footer">
          <a class="nav-item logout" (click)="authService.logout()">
            <mat-icon>logout</mat-icon>
            @if (!sidebarCollapsed()) { <span>Sign Out</span> }
          </a>
        </div>
      </aside>

      <div class="main-area">
        <header class="top-bar">
          <div class="user-info">
            <mat-icon class="user-avatar">account_circle</mat-icon>
            <span>{{ authService.user()?.firstName }} {{ authService.user()?.lastName }}</span>
          </div>
        </header>
        <main class="content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .shell-container { display: flex; height: 100vh; overflow: hidden; }
    .sidebar {
      width: 260px; background: #0f1628; color: #b0bec5;
      display: flex; flex-direction: column; transition: width 0.2s ease;
      flex-shrink: 0;
    }
    .collapsed .sidebar { width: 64px; }
    .sidebar-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .brand { display: flex; align-items: center; gap: 0.75rem; }
    .brand-icon {
      width: 36px; height: 36px; background: #f9a825; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .brand-icon mat-icon { color: white; font-size: 20px; width: 20px; height: 20px; }
    .brand-name { font-size: 1.1rem; font-weight: 700; color: white; display: block; }
    .brand-sub { font-size: 0.7rem; color: #f9a825; text-transform: uppercase; letter-spacing: 1px; }
    .toggle-btn { color: #b0bec5 !important; }
    .collapsed .toggle-btn { display: none; }
    .sidebar-nav {
      flex: 1; overflow-y: auto; padding: 0.5rem;
      display: flex; flex-direction: column; gap: 2px;
    }
    .nav-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.65rem 0.75rem; border-radius: 8px; cursor: pointer;
      transition: all 0.15s; color: #b0bec5; text-decoration: none;
      font-size: 0.875rem; white-space: nowrap;
    }
    .nav-item:hover { background: rgba(255,255,255,0.06); color: white; }
    .nav-item.active { background: #1a237e; color: white; }
    .nav-item.active mat-icon { color: white !important; }
    .nav-item mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .sidebar-footer { padding: 0.5rem; border-top: 1px solid rgba(255,255,255,0.08); }
    .logout:hover { background: rgba(244,67,54,0.15); color: #ef5350; }
    .main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .top-bar {
      height: 56px; background: white; border-bottom: 1px solid #e2e8f0;
      display: flex; align-items: center; justify-content: flex-end; padding: 0 1.5rem;
    }
    .user-info { display: flex; align-items: center; gap: 0.5rem; color: #64748b; font-size: 0.875rem; }
    .user-avatar { font-size: 28px; width: 28px; height: 28px; color: #1a237e; }
    .content { flex: 1; overflow-y: auto; background: #f5f5f5; }
  `]
})
export class ShellComponent {
  sidebarCollapsed = signal(false);

  constructor(public authService: AuthService) {}

  navItems: NavItem[] = [
    { label: 'Assets', path: '/assets', icon: 'inventory_2', color: '#5c6bc0' },
    { label: 'Supply Chain', path: '/scm', icon: 'local_shipping', color: '#42a5f5' },
    { label: 'Point of Sale', path: '/pos', icon: 'point_of_sale', color: '#66bb6a' },
    { label: 'Payroll', path: '/payroll', icon: 'payments', color: '#ffa726' },
    { label: 'IDP', path: '/idp', icon: 'account_tree', color: '#ab47bc' },
    { label: 'Budget', path: '/budget', icon: 'account_balance', color: '#26a69a' },
    { label: 'AFS', path: '/afs', icon: 'description', color: '#ef5350' },
    { label: 'Insights', path: '/ins', icon: 'insights', color: '#7e57c2' }
  ];
}
