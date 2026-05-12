import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '@platinumv3/shared/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule],
  template: `
    <div class="dashboard">
      <h2>Welcome, {{ authService.user()?.firstName }} {{ authService.user()?.lastName }}</h2>
      <p class="subtitle">Platinum ERP — Municipal Management System</p>
      <div class="module-grid">
        @for (mod of modules; track mod.path) {
          <a [routerLink]="mod.path" class="module-card">
            <mat-icon class="module-icon" [style.color]="mod.color">{{ mod.icon }}</mat-icon>
            <h3>{{ mod.name }}</h3>
            <p>{{ mod.description }}</p>
          </a>
        }
      </div>
    </div>
  `,
  styles: [`
    .dashboard { padding: 2rem; }
    h2 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; }
    .subtitle { color: #64748b; margin-bottom: 2rem; }
    .module-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
    .module-card {
      display: flex; flex-direction: column; align-items: center; text-align: center;
      padding: 2rem; background: white; border-radius: 12px; border: 1px solid #e2e8f0;
      cursor: pointer; transition: all 0.2s; text-decoration: none; color: inherit;
    }
    .module-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-color: #1a237e; }
    .module-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 1rem; }
    h3 { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; }
    p { font-size: 0.85rem; color: #64748b; line-height: 1.4; }
  `]
})
export class DashboardComponent {
  constructor(public authService: AuthService) {}

  modules = [
    { name: 'Asset Management', path: '/assets', icon: 'inventory_2', color: '#1a237e', description: 'GRAP-compliant asset register, verification, depreciation and disposal management.' },
    { name: 'Supply Chain', path: '/scm', icon: 'local_shipping', color: '#0d47a1', description: 'SCM procurement workflows, supplier management, and bid processes.' },
    { name: 'Point of Sale', path: '/pos', icon: 'point_of_sale', color: '#1b5e20', description: 'Revenue collection, payment processing, debt management and billing.' },
    { name: 'Payroll', path: '/payroll', icon: 'payments', color: '#e65100', description: 'Employee management, salary processing, tax calculations and reporting.' },
    { name: 'IDP', path: '/idp', icon: 'account_tree', color: '#4a148c', description: 'Integrated Development Plan cycles, projects and performance tracking.' },
    { name: 'Budget', path: '/budget', icon: 'account_balance', color: '#006064', description: 'MFMA budget preparation, virements, scenarios and expenditure tracking.' },
    { name: 'AFS', path: '/afs', icon: 'description', color: '#bf360c', description: 'Annual Financial Statements builder, mappings, compilations and audit management.' },
    { name: 'Performance', path: '/ins', icon: 'insights', color: '#311b92', description: 'KPI tracking, SDBIP monitoring, and municipal performance analytics.' }
  ];
}
