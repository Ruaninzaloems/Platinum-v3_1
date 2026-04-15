import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-scm-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="scm-dashboard">
      <h1>Supply Chain Management</h1>
      <p class="subtitle">SCM module coming soon. The SCM repository will be integrated here.</p>

      <div class="cards">
        <div class="card">
          <mat-icon class="card-icon">description</mat-icon>
          <div class="card-title">Contracts</div>
          <div class="card-value">—</div>
        </div>
        <div class="card">
          <mat-icon class="card-icon">store</mat-icon>
          <div class="card-title">Vendors</div>
          <div class="card-value">—</div>
        </div>
        <div class="card">
          <mat-icon class="card-icon">shopping_cart</mat-icon>
          <div class="card-title">Purchase Orders</div>
          <div class="card-value">—</div>
        </div>
        <div class="card">
          <mat-icon class="card-icon">receipt</mat-icon>
          <div class="card-title">Invoices</div>
          <div class="card-value">—</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .scm-dashboard { max-width: 1200px; }
    h1 { font-size: 24px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
    .subtitle { font-size: 14px; color: #64748b; margin-bottom: 32px; }
    .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; }
    .card {
      background: white; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
    }
    .card-icon { font-size: 36px; width: 36px; height: 36px; color: #3b82f6; }
    .card-title { font-size: 14px; font-weight: 600; color: #334155; }
    .card-value { font-size: 24px; font-weight: 700; color: #94a3b8; }
  `]
})
export class ScmDashboardComponent {}
