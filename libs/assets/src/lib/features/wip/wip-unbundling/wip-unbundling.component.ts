import { Component, OnInit, signal } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/api.service';

@Component({
  selector: 'app-wip-unbundling',
  standalone: true,
  imports: [RouterModule, CommonModule, MatIconModule, MatButtonModule, MatTableModule, MatChipsModule, MatProgressSpinnerModule],
  template: `
    <div class="page-tabs">
      <a class="page-tab" routerLink="/assets/wip" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
        <mat-icon>construction</mat-icon> WIP Register
      </a>
      <a class="page-tab active" routerLink="/assets/wip/unbundling" routerLinkActive="active">
        <mat-icon>category</mat-icon> Asset Unbundling
      </a>
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <div>
        <h1 style="font-size:24px;font-weight:700;color:#1e293b;margin:0 0 4px">Asset Unbundling</h1>
        <p style="font-size:14px;color:#64748b;margin:0">Unbundle WIP projects into individual asset register items</p>
      </div>
    </div>

    @if (loading()) {
      <div style="text-align:center;padding:60px">
        <mat-spinner diameter="40" style="margin:0 auto"></mat-spinner>
      </div>
    }

    @if (!loading()) {
      <div class="table-card">
        <table mat-table [dataSource]="projects()" style="width:100%">
          <ng-container matColumnDef="projectName">
            <th mat-header-cell *matHeaderCellDef>Project Name</th>
            <td mat-cell *matCellDef="let row">
              <span style="font-weight:500;color:#1e293b">{{ row.projectName }}</span>
              @if (row.projectNo) {
                <br><span style="font-size:12px;color:#64748b">{{ row.projectNo }}</span>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="contractNumber">
            <th mat-header-cell *matHeaderCellDef>Contract No</th>
            <td mat-cell *matCellDef="let row">{{ row.contractNumber || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="contractValue">
            <th mat-header-cell *matHeaderCellDef style="text-align:right">Contract Value</th>
            <td mat-cell *matCellDef="let row" style="text-align:right">{{ (row.contractValue || 0) | number:'1.2-2' }}</td>
          </ng-container>

          <ng-container matColumnDef="totalExpenditure">
            <th mat-header-cell *matHeaderCellDef style="text-align:right">Actual Expenditure</th>
            <td mat-cell *matCellDef="let row" style="text-align:right">{{ (row.totalExpenditure || 0) | number:'1.2-2' }}</td>
          </ng-container>

          <ng-container matColumnDef="unbundlingStatus">
            <th mat-header-cell *matHeaderCellDef>Unbundling Status</th>
            <td mat-cell *matCellDef="let row">
              <span [class]="'status-chip status-' + (row.unbundlingStatus || 'Draft').toLowerCase()">{{ row.unbundlingStatus || 'Draft' }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="projectComplete">
            <th mat-header-cell *matHeaderCellDef>Complete</th>
            <td mat-cell *matCellDef="let row">
              @if (row.projectComplete) {
                <mat-icon style="color:#16a34a;font-size:20px;width:20px;height:20px">check_circle</mat-icon>
              } @else {
                <span style="color:#94a3b8;font-size:13px">No</span>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row">
              <button mat-stroked-button color="primary" (click)="openProject(row.wipRegisterId)" style="font-size:13px;height:32px;line-height:32px">
                <mat-icon style="font-size:16px;width:16px;height:16px;margin-right:4px">open_in_new</mat-icon>
                Open
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
        </table>

        @if (projects().length === 0) {
          <div style="text-align:center;padding:60px 20px;color:#94a3b8">
            <mat-icon style="font-size:48px;width:48px;height:48px;margin-bottom:12px">category</mat-icon>
            <p style="font-size:15px;margin:0">No WIP projects found</p>
          </div>
        }
      </div>
    }
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
    .table-card { background:white; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; }
    .table-row:hover { background:#f8fafc; }
    th.mat-header-cell { font-size:12px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:.05em; background:#f8fafc; }
    td.mat-cell { font-size:14px; color:#374151; padding:12px 16px; }
    th.mat-header-cell { padding:10px 16px; }
    .status-chip { display:inline-block; padding:2px 10px; border-radius:999px; font-size:12px; font-weight:600; }
    .status-draft { background:#f1f5f9; color:#64748b; }
    .status-submitted { background:#eff6ff; color:#2563eb; }
    .status-approved { background:#f0fdf4; color:#16a34a; }
    .status-declined { background:#fef2f2; color:#dc2626; }
    .status-complete { background:#f0f9ff; color:#0284c7; }
  `]
})
export class WipUnbundlingComponent implements OnInit {
  projects = signal<any[]>([]);
  loading = signal(true);
  displayedColumns = ['projectName', 'contractNumber', 'contractValue', 'totalExpenditure', 'unbundlingStatus', 'projectComplete', 'actions'];

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    var self = this;
    self.api.getWipItems().subscribe({
      next: function(data: any) {
        self.projects.set(Array.isArray(data) ? data : (data.items || []));
        self.loading.set(false);
      },
      error: function() {
        self.loading.set(false);
      }
    });
  }

  openProject(id: number) {
    this.router.navigate(['/assets/wip/unbundling', id]);
  }
}
