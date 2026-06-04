import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-maintenance-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <div style="margin-bottom:24px">
      <h1 style="font-size:24px;font-weight:700;color:#1e293b;margin:0 0 4px">Maintenance</h1>
      <p style="font-size:14px;color:#64748b;margin:0">Reactive and planned maintenance management for municipal assets</p>
    </div>
    <div class="tab-cards">
      @for (tab of tabs; track tab.label) {
        <a class="tab-card" [class.disabled]="tab.disabled" [routerLink]="tab.disabled ? null : tab.route">
          <div class="tab-icon" [style.background]="tab.color + '18'" [style.color]="tab.color">
            <mat-icon>{{tab.icon}}</mat-icon>
          </div>
          <div>
            <h3>{{tab.label}}</h3>
            <p>{{tab.description}}</p>
          </div>
          @if (!tab.disabled) {
            <mat-icon class="arrow">chevron_right</mat-icon>
          } @else {
            <span class="coming-soon">Coming Soon</span>
          }
        </a>
      }
    </div>
  `,
  styles: [`
    .tab-cards { display:flex; flex-direction:column; gap:12px; max-width:700px; }
    .tab-card {
      display:flex; align-items:center; gap:16px; padding:20px 24px;
      background:white; border:1px solid #e2e8f0; border-radius:12px;
      text-decoration:none; cursor:pointer; transition:all 0.15s;
    }
    .tab-card:hover:not(.disabled) { border-color:#3b82f6; box-shadow:0 2px 8px rgba(59,130,246,0.1); }
    .tab-card.disabled { opacity:0.5; cursor:default; }
    .tab-icon { width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .tab-icon mat-icon { font-size:24px; width:24px; height:24px; }
    .tab-card h3 { margin:0 0 4px; font-size:16px; font-weight:600; color:#1e293b; }
    .tab-card p { margin:0; font-size:13px; color:#64748b; }
    .arrow { color:#94a3b8; margin-left:auto; }
    .coming-soon {
      margin-left:auto; font-size:11px; font-weight:600; color:#94a3b8;
      background:#f1f5f9; padding:4px 10px; border-radius:12px;
    }
  `]
})
export class MaintenanceLandingComponent {
  tabs = [
    {
      label: 'Reactive Maintenance',
      icon: 'report_problem',
      color: '#dc2626',
      description: 'Log and manage fault reports, work orders and reactive repairs',
      route: '/maintenance/requests',
      disabled: false
    },
    {
      label: 'Planned Maintenance',
      icon: 'event_repeat',
      color: '#2563eb',
      description: 'Schedule and track preventative and routine maintenance plans',
      route: '/maintenance/planned',
      disabled: false
    },
    {
      label: 'Work Orders',
      icon: 'construction',
      color: '#059669',
      description: 'View and manage all maintenance work orders across reactive and planned maintenance',
      route: '/maintenance/work-orders',
      disabled: false
    }
  ];
}
