import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../services/api.service';
import { BudgetVersionSummary, FinancialYear } from '../../models/budget.models';

@Component({
  selector: 'app-version-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatIconModule, MatButtonModule, MatSelectModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Budget Versions</h1>
        <button mat-raised-button color="primary" (click)="showCreateDialog = true">
          <mat-icon>add</mat-icon> Create Version
        </button>
      </div>

      <div class="filter-bar">
        <mat-form-field appearance="outline">
          <mat-label>Version Type</mat-label>
          <mat-select [(ngModel)]="filterType" (ngModelChange)="loadVersions()">
            <mat-option value="">All</mat-option>
            <mat-option value="TABB">TABB</mat-option>
            <mat-option value="ORGB">ORGB</mat-option>
            <mat-option value="ADJB">ADJB</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="filterStatus" (ngModelChange)="loadVersions()">
            <mat-option value="">All</mat-option>
            <mat-option value="Draft">Draft</mat-option>
            <mat-option value="Pending">Pending</mat-option>
            <mat-option value="Approved">Approved</mat-option>
            <mat-option value="Locked">Locked</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>Version Name</th>
              <th>Type</th>
              <th>Financial Year</th>
              <th>Status</th>
              <th class="amount">Total Y1</th>
              <th class="amount">Total Y2</th>
              <th class="amount">Total Y3</th>
              <th>Strings</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let v of versions">
              <td><a [routerLink]="['/budget-versions', v.id]" class="link">{{ v.versionName }}</a></td>
              <td><span class="type-badge" [ngClass]="'type-' + v.versionType.toLowerCase()">{{ v.versionType }}</span></td>
              <td>{{ v.financialYear }}</td>
              <td><span class="status-badge" [ngClass]="'status-' + v.status.toLowerCase()">{{ v.status }}</span></td>
              <td class="amount">{{ formatRand(v.totalYear1) }}</td>
              <td class="amount">{{ formatRand(v.totalYear2) }}</td>
              <td class="amount">{{ formatRand(v.totalYear3) }}</td>
              <td>{{ v.totalStrings }}</td>
              <td>{{ v.createdOn | date:'dd MMM yyyy' }}</td>
              <td>
                <a mat-icon-button [routerLink]="['/budget-versions', v.id]"><mat-icon>visibility</mat-icon></a>
              </td>
            </tr>
            <tr *ngIf="versions.length === 0">
              <td colspan="10" class="empty">No budget versions found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="dialog-overlay" *ngIf="showCreateDialog" (click)="showCreateDialog = false">
      <div class="dialog" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <h2>Create Budget Version</h2>
          <button mat-icon-button (click)="showCreateDialog = false"><mat-icon>close</mat-icon></button>
        </div>
        <div class="dialog-body">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Financial Year</mat-label>
            <mat-select [(ngModel)]="newVersion.financialYearId">
              <mat-option *ngFor="let fy of financialYears" [value]="fy.id">{{ fy.yearCode }} - {{ fy.description }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Version Type</mat-label>
            <mat-select [(ngModel)]="newVersion.versionType">
              <mat-option value="TABB">TABB</mat-option>
              <mat-option value="ORGB">ORGB</mat-option>
              <mat-option value="ADJB">ADJB</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Version Name</mat-label>
            <input matInput [(ngModel)]="newVersion.versionName" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Description</mat-label>
            <textarea matInput [(ngModel)]="newVersion.description" rows="3"></textarea>
          </mat-form-field>
        </div>
        <div class="dialog-actions">
          <button mat-button (click)="showCreateDialog = false">Cancel</button>
          <button mat-raised-button color="primary" (click)="createVersion()">Create</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .page-header h1 { font-size: 22px; font-weight: 600; color: #1e293b; margin: 0; }
    .filter-bar { display: flex; gap: 12px; padding: 12px 16px; background: #fff; border: 1px solid #e8ecf1; border-radius: 12px; margin-bottom: 20px; align-items: center; }
    .filter-bar mat-form-field { width: 180px; }
    .table-card { background: #fff; border: 1px solid #e8ecf1; border-radius: 12px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; padding: 12px 16px; text-align: left; border-bottom: 1px solid #e8ecf1; }
    td { font-size: 13px; color: #1e293b; padding: 12px 16px; border-bottom: 1px solid #f1f5f9; }
    tr:hover td { background: #f8fafc; }
    .amount { text-align: right; font-family: 'Roboto Mono', monospace; }
    .link { color: #1565c0; text-decoration: none; font-weight: 500; }
    .link:hover { text-decoration: underline; }
    .empty { text-align: center; color: #94a3b8; padding: 40px 16px !important; }
    .status-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .status-draft { background: #f1f5f9; color: #64748b; }
    .status-pending { background: #fff7ed; color: #ea580c; }
    .status-approved { background: #ecfdf5; color: #059669; }
    .status-locked { background: #eff6ff; color: #2563eb; }
    .type-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .type-tabb { background: #e3f2fd; color: #1565c0; }
    .type-orgb { background: #f3e5f5; color: #7b1fa2; }
    .type-adjb { background: #fff3e0; color: #e65100; }
    .dialog-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .dialog { background: #fff; border-radius: 16px; width: 560px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
    .dialog-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px 0; }
    .dialog-header h2 { margin: 0; font-size: 18px; font-weight: 600; color: #1e293b; }
    .dialog-body { padding: 20px 24px; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 8px; padding: 0 24px 20px; }
    .full-width { width: 100%; }
  `]
})
export class VersionListPage implements OnInit {
  versions: BudgetVersionSummary[] = [];
  financialYears: FinancialYear[] = [];
  filterType = '';
  filterStatus = '';
  showCreateDialog = false;
  newVersion = { financialYearId: 0, versionType: '', versionName: '', description: '' };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadVersions();
    this.api.getFinancialYears().subscribe(fy => this.financialYears = fy);
  }

  loadVersions() {
    this.api.getBudgetVersions(
      undefined,
      this.filterType || undefined,
      this.filterStatus || undefined
    ).subscribe(v => this.versions = v);
  }

  formatRand(amount: number): string {
    return 'R ' + (amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  createVersion() {
    this.api.createBudgetVersion(this.newVersion).subscribe(() => {
      this.showCreateDialog = false;
      this.newVersion = { financialYearId: 0, versionType: '', versionName: '', description: '' };
      this.loadVersions();
    });
  }
}
