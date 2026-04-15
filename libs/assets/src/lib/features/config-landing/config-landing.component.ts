import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface ConfigGroup {
  title: string;
  icon: string;
  color: string;
  items: { label: string; route: string; icon: string }[];
}

@Component({
  selector: 'app-config-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <div style="margin-bottom:24px">
      <h1 style="font-size:24px;font-weight:700;color:#1e293b;margin:0 0 4px">Configuration</h1>
      <p style="font-size:14px;color:#64748b;margin:0">Manage system reference data and lookup tables</p>
    </div>
    <div class="config-grid">
      @for (group of configGroups; track group.title) {
        <div class="config-group-card">
          <div class="group-header">
            <div class="group-icon" [style.background]="group.color + '20'" [style.color]="group.color">
              <mat-icon>{{group.icon}}</mat-icon>
            </div>
            <h3>{{group.title}}</h3>
          </div>
          <div class="group-items">
            @for (item of group.items; track item.route) {
              <a class="config-item" [routerLink]="item.route">
                <mat-icon class="item-icon">{{item.icon}}</mat-icon>
                <span>{{item.label}}</span>
                <mat-icon class="arrow-icon">chevron_right</mat-icon>
              </a>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .config-grid {
      display:grid; grid-template-columns:repeat(2, 1fr); gap:20px;
    }
    .config-group-card {
      background:white; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;
    }
    .group-header {
      display:flex; align-items:center; gap:12px; padding:16px 20px; border-bottom:1px solid #f1f5f9;
    }
    .group-header h3 {
      font-size:15px; font-weight:600; color:#1e293b; margin:0;
    }
    .group-icon {
      width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center;
    }
    .group-icon mat-icon { font-size:20px; width:20px; height:20px; }
    .group-items { padding:4px 0; }
    .config-item {
      display:flex; align-items:center; gap:10px; padding:10px 20px; color:#334155;
      font-size:13px; text-decoration:none; transition:background 0.15s; cursor:pointer;
    }
    .config-item:hover { background:#f8fafc; }
    .item-icon { font-size:18px; width:18px; height:18px; color:#94a3b8; }
    .arrow-icon { font-size:16px; width:16px; height:16px; color:#cbd5e1; margin-left:auto; }
    @media (max-width: 900px) {
      .config-grid { grid-template-columns:1fr; }
    }
  `]
})
export class ConfigLandingComponent {
  configGroups: ConfigGroup[] = [
    {
      title: 'Asset Classification',
      icon: 'category',
      color: '#2563eb',
      items: [
        { label: 'Asset Types', route: '/config/asset-types', icon: 'label' },
        { label: 'Asset Categories', route: '/config/asset-categories', icon: 'folder' },
        { label: 'Asset Sub-Categories', route: '/config/asset-sub-categories', icon: 'folder_open' },
        { label: 'Asset Classes', route: '/config/asset-classes', icon: 'class' },
        { label: 'Asset Statuses', route: '/config/asset-statuses', icon: 'toggle_on' },
        { label: 'Asset Project Statuses', route: '/config/asset-project-statuses', icon: 'assignment_turned_in' },
        { label: 'Asset Conditions', route: '/config/asset-conditions', icon: 'thermostat' },
        { label: 'Component Types', route: '/config/component-types', icon: 'build' },
        { label: 'Measurement Types', route: '/config/measurement-types', icon: 'straighten' },
        { label: 'Municipal Services', route: '/config/cidms-municipal-services', icon: 'location_city' },
      ]
    },
    {
      title: 'Transaction Config',
      icon: 'swap_horiz',
      color: '#059669',
      items: [
        { label: 'Transaction Types', route: '/config/transaction-types', icon: 'receipt_long' },
        { label: 'mSCOA Settings', route: '/config/mscoa', icon: 'account_tree' },
      ]
    },
    {
      title: 'Grading Scales',
      icon: 'star_rate',
      color: '#d97706',
      items: [
        { label: 'Criticality Grades', route: '/config/criticality-grades', icon: 'warning' },
        { label: 'Health Grades', route: '/config/health-grades', icon: 'favorite' },
        { label: 'Performance Grades', route: '/config/performance-grades', icon: 'speed' },
        { label: 'Utilisation Grades', route: '/config/utilisation-grades', icon: 'pie_chart' },
      ]
    },
    {
      title: 'Maintenance Config',
      icon: 'build',
      color: '#0891b2',
      items: [
        { label: 'Service Groups', route: '/config/service-groups', icon: 'groups' },
        { label: 'Lead Times', route: '/config/lead-times', icon: 'schedule' },
      ]
    },
    {
      title: 'CIDMS Hierarchy',
      icon: 'account_tree',
      color: '#7c3aed',
      items: [
        { label: 'Tree View (All Levels)', route: '/config/cidms-hierarchy', icon: 'account_tree' },
      ]
    }
  ];
}
