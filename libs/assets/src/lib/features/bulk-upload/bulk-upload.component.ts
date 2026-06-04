import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-bulk-upload',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <div class="page-tabs">
      <a class="page-tab" routerLink="/bulk-upload/jobs" routerLinkActive="active">
        <mat-icon>upload_file</mat-icon> Upload Jobs
      </a>
      <a class="page-tab" routerLink="/bulk-upload/items" routerLinkActive="active">
        <mat-icon>fact_check</mat-icon> Upload Approvals
      </a>
      <a class="page-tab" routerLink="/bulk-upload/wip-transfers" routerLinkActive="active">
        <mat-icon>swap_horiz</mat-icon> WIP Transfers
      </a>
      <a class="page-tab" routerLink="/bulk-upload/wip-approvals" routerLinkActive="active">
        <mat-icon>assignment_turned_in</mat-icon> WIP Transfer Approvals
      </a>
      <a class="page-tab" routerLink="/bulk-upload/bulk-transactions" routerLinkActive="active">
        <mat-icon>post_add</mat-icon> Bulk Transactions
      </a>
      <a class="page-tab" routerLink="/bulk-upload/bulk-transaction-approvals" routerLinkActive="active">
        <mat-icon>rule</mat-icon> Bulk Transaction Approvals
      </a>
    </div>
    <router-outlet></router-outlet>
  `,
  styles: [`
    .page-tabs { display:flex; gap:0; margin-bottom:20px; border-bottom:2px solid #e2e8f0; }
    .page-tab {
      display:inline-flex; align-items:center; gap:6px; padding:10px 20px; font-size:14px;
      font-weight:500; color:#64748b; text-decoration:none; border-bottom:2px solid transparent;
      margin-bottom:-2px; transition:all 0.15s; cursor:pointer;
    }
    .page-tab mat-icon { font-size:18px; width:18px; height:18px; }
    .page-tab:hover { color:#1e293b; background:#f8fafc; }
    .page-tab.active { color:#2563eb; border-bottom-color:#2563eb; font-weight:600; }
  `]
})
export class BulkUploadComponent {}
