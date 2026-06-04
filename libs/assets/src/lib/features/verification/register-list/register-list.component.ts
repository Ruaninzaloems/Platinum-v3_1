import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../../core/api.service';

@Component({
  selector: 'app-register-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  template: `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
      <button mat-icon-button routerLink="/verification" style="margin-right:-4px"><mat-icon>arrow_back</mat-icon></button>
      <div style="flex:1">
        <h1 style="font-size:22px;font-weight:700;color:#1e293b;margin:0">Verification Registers</h1>
        <p style="font-size:13px;color:#64748b;margin:2px 0 0">Manage physical asset verification registers</p>
      </div>
      <button mat-flat-button color="primary" routerLink="/verification/register/create" style="background:#2563eb;color:white;border-radius:8px">
        <mat-icon>add</mat-icon> Create Register
      </button>
    </div>

    <div class="sub-tabs">
      <button class="sub-tab" [class.active]="activeTab === 'active'" (click)="switchTab('active')">
        Active ({{activeRegisters.length}})
      </button>
      <button class="sub-tab" [class.active]="activeTab === 'history'" (click)="switchTab('history')">
        History ({{historyRegisters.length}})
      </button>
    </div>

    @if (loading) {
      <div style="text-align:center;padding:60px;color:#64748b">Loading registers...</div>
    } @else {
      @if (displayedRegisters.length === 0) {
        <div class="empty-state">
          <mat-icon style="font-size:48px;width:48px;height:48px;color:#cbd5e1">fact_check</mat-icon>
          <p style="margin:12px 0 0;color:#64748b">No {{activeTab}} verification registers found</p>
          @if (activeTab === 'active') {
            <button mat-stroked-button routerLink="/verification/register/create" style="margin-top:12px">Create your first register</button>
          }
        </div>
      } @else {
        <div class="register-grid">
          @for (reg of displayedRegisters; track reg.verificationRegisterId) {
            <div class="register-card">
              <div class="card-header">
                <div class="type-badge" [class.infra]="reg.registerType === 'Infrastructure'" [class.non-infra]="reg.registerType === 'Non-Infrastructure'" [class.custom]="reg.registerType === 'Custom'">
                  {{reg.registerType}}
                </div>
                @if (activeTab === 'active') {
                  <button mat-icon-button style="margin-left:auto" (click)="deleteRegister(reg, $event)">
                    <mat-icon style="font-size:18px;color:#94a3b8">delete_outline</mat-icon>
                  </button>
                }
              </div>
              <h3 class="card-title">{{reg.registerName}}</h3>
              @if (reg.description) { <p class="card-desc">{{reg.description}}</p> }
              <div class="card-stats">
                <div class="stat">
                  <span class="stat-val">{{reg.totalItems || 0}}</span>
                  <span class="stat-lbl">Total</span>
                </div>
                <div class="stat">
                  <span class="stat-val approved">{{reg.approvedItems || 0}}</span>
                  <span class="stat-lbl">Approved</span>
                </div>
                <div class="stat">
                  <span class="stat-val pending">{{reg.submittedItems || 0}}</span>
                  <span class="stat-lbl">Pending</span>
                </div>
              </div>
              <div class="card-footer">
                <span class="date-info">Created {{formatDate(reg.dateCaptured)}}</span>
                <button mat-flat-button class="open-btn" (click)="openRegister(reg.verificationRegisterId)">
                  Open <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>
      }
    }
  `,
  styles: [`
    .sub-tabs { display:flex; gap:4px; margin-bottom:20px; background:#f1f5f9; padding:4px; border-radius:10px; width:fit-content; }
    .sub-tab {
      padding:8px 20px; border:none; background:transparent; border-radius:8px;
      font-size:13px; font-weight:500; color:#64748b; cursor:pointer; transition:all 0.15s;
    }
    .sub-tab.active { background:white; color:#1e293b; font-weight:600; box-shadow:0 1px 3px rgba(0,0,0,0.1); }
    .empty-state { text-align:center; padding:80px 20px; background:white; border-radius:12px; border:1px solid #e2e8f0; }
    .register-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(340px, 1fr)); gap:16px; }
    .register-card {
      background:white; border:1px solid #e2e8f0; border-radius:12px; padding:20px;
      transition:border-color 0.15s;
    }
    .register-card:hover { border-color:#93c5fd; }
    .card-header { display:flex; align-items:center; margin-bottom:12px; }
    .type-badge {
      font-size:11px; font-weight:600; padding:4px 10px; border-radius:6px;
    }
    .type-badge.infra { background:#dbeafe; color:#1d4ed8; }
    .type-badge.non-infra { background:#fef3c7; color:#92400e; }
    .type-badge.custom { background:#f3e8ff; color:#7c3aed; }
    .card-title { font-size:15px; font-weight:600; color:#1e293b; margin:0 0 6px; word-break:break-word; }
    .card-desc { font-size:13px; color:#64748b; margin:0 0 16px; }
    .card-stats { display:flex; gap:24px; margin:16px 0; padding:12px 0; border-top:1px solid #f1f5f9; border-bottom:1px solid #f1f5f9; }
    .stat { display:flex; flex-direction:column; align-items:center; }
    .stat-val { font-size:18px; font-weight:700; color:#1e293b; }
    .stat-val.approved { color:#16a34a; }
    .stat-val.pending { color:#d97706; }
    .stat-lbl { font-size:11px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px; }
    .card-footer { display:flex; align-items:center; justify-content:space-between; margin-top:12px; }
    .date-info { font-size:12px; color:#94a3b8; }
    .open-btn {
      background:#2563eb; color:white; border-radius:8px; font-size:13px;
      display:flex; align-items:center; gap:4px; padding:6px 16px;
    }
    .open-btn mat-icon { font-size:16px; width:16px; height:16px; }
  `]
})
export class RegisterListComponent implements OnInit {
  activeTab = 'active';
  loading = true;
  activeRegisters: any[] = [];
  historyRegisters: any[] = [];

  get displayedRegisters(): any[] {
    return this.activeTab === 'active' ? this.activeRegisters : this.historyRegisters;
  }

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.loadRegisters();
  }

  loadRegisters() {
    this.loading = true;
    this.api.getVerificationRegisters({ isHistory: 0 }).subscribe({
      next: function(this: RegisterListComponent, data: any[]) {
        this.activeRegisters = data;
        this.api.getVerificationRegisters({ isHistory: 1 }).subscribe({
          next: function(this: RegisterListComponent, hData: any[]) {
            this.historyRegisters = hData;
            this.loading = false;
          }.bind(this),
          error: function(this: RegisterListComponent) { this.loading = false; }.bind(this)
        });
      }.bind(this),
      error: function(this: RegisterListComponent) { this.loading = false; }.bind(this)
    });
  }

  switchTab(tab: string) {
    this.activeTab = tab;
  }

  openRegister(id: number) {
    this.router.navigate(['/verification/register', id]);
  }

  deleteRegister(reg: any, event: Event) {
    event.stopPropagation();
    if (!confirm('Delete register "' + reg.registerName + '" and all its items? This cannot be undone.')) return;
    this.api.deleteVerificationRegister(reg.verificationRegisterId).subscribe({
      next: function(this: RegisterListComponent) { this.loadRegisters(); }.bind(this)
    });
  }

  formatDate(d: string): string {
    if (!d) return '';
    var date = new Date(d);
    return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
