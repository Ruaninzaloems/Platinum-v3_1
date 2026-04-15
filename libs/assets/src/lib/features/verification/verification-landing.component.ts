import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-verification-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <div style="margin-bottom:24px">
      <h1 style="font-size:24px;font-weight:700;color:#1e293b;margin:0 0 4px">Asset Verification</h1>
      <p style="font-size:14px;color:#64748b;margin:0">Physical verification of municipal assets — GRAP 17 compliant</p>
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
export class VerificationLandingComponent {
  tabs = [
    {
      label: 'Verification Register',
      icon: 'fact_check',
      color: '#2563eb',
      description: 'Create and manage asset verification registers for physical counts',
      route: '/verification/register',
      disabled: false
    },
    {
      label: 'Verification Planning',
      icon: 'event',
      color: '#059669',
      description: 'Plan and schedule verification activities across departments',
      route: '/verification/planning',
      disabled: false
    },
    {
      label: 'Verification Reports',
      icon: 'assessment',
      color: '#d97706',
      description: 'Generate compliance and variance reports from verification data',
      route: '/verification/reports',
      disabled: false
    }
  ];
}
