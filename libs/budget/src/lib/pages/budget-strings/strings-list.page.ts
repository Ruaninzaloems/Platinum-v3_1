import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../services/api.service';
import { BudgetStringList, BudgetVersionSummary, ScoaSegment, ValidationRun } from '../../models/budget.models';

@Component({
  selector: 'app-strings-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatSelectModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Budget Strings</h1>
        <div class="header-actions">
          <button mat-stroked-button (click)="validateStrings()" [disabled]="!filterVersionId">
            <mat-icon>verified</mat-icon> Validate
          </button>
          <button mat-raised-button color="primary" (click)="showAddDialog = true">
            <mat-icon>add</mat-icon> Add String
          </button>
        </div>
      </div>

      <div class="filter-bar">
        <mat-form-field appearance="outline">
          <mat-label>Budget Version</mat-label>
          <mat-select [(ngModel)]="filterVersionId" (ngModelChange)="loadStrings()">
            <mat-option [value]="0">All Versions</mat-option>
            <mat-option *ngFor="let v of versions" [value]="v.id">{{ v.versionName }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Source Module</mat-label>
          <mat-select [(ngModel)]="filterModule" (ngModelChange)="loadStrings()">
            <mat-option value="">All</mat-option>
            <mat-option value="Operating">Operating</mat-option>
            <mat-option value="Capital">Capital</mat-option>
            <mat-option value="Revenue">Revenue</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>Segment String</th>
              <th>Item</th>
              <th>Fund</th>
              <th>Function</th>
              <th>Project</th>
              <th class="amount">Year 1</th>
              <th class="amount">Year 2</th>
              <th class="amount">Year 3</th>
              <th>Source Module</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of strings">
              <td>
                <div class="mscoa-segments">
                  <span class="mscoa-tag">{{ s.itemCode }}</span>
                  <span class="mscoa-tag">{{ s.fundCode }}</span>
                  <span class="mscoa-tag">{{ s.functionCode }}</span>
                  <span class="mscoa-tag">{{ s.projectSegCode }}</span>
                  <span class="mscoa-tag">{{ s.regionCode }}</span>
                  <span class="mscoa-tag">{{ s.costingCode }}</span>
                  <span class="mscoa-tag">{{ s.mscCode }}</span>
                </div>
              </td>
              <td>{{ s.itemDescription }}</td>
              <td>{{ s.fundDescription }}</td>
              <td>{{ s.functionDescription }}</td>
              <td>{{ s.projectSegDescription }}</td>
              <td class="amount">{{ formatRand(s.year1Amount) }}</td>
              <td class="amount">{{ formatRand(s.year2Amount) }}</td>
              <td class="amount">{{ formatRand(s.year3Amount) }}</td>
              <td><span class="module-tag">{{ s.sourceModule }}</span></td>
            </tr>
            <tr *ngIf="strings.length === 0">
              <td colspan="9" class="empty">No budget strings found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="dialog-overlay" *ngIf="showValidationResults" (click)="showValidationResults = false">
      <div class="dialog" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <h2>Validation Results</h2>
          <button mat-icon-button (click)="showValidationResults = false"><mat-icon>close</mat-icon></button>
        </div>
        <div class="dialog-body" *ngIf="validationRun">
          <div class="validation-summary">
            <div class="val-stat passed"><span class="val-count">{{ validationRun.passed }}</span><span class="val-label">Passed</span></div>
            <div class="val-stat warnings"><span class="val-count">{{ validationRun.warnings }}</span><span class="val-label">Warnings</span></div>
            <div class="val-stat errors"><span class="val-count">{{ validationRun.errors }}</span><span class="val-label">Errors</span></div>
          </div>
          <div class="validation-results" *ngIf="validationRun.results && validationRun.results.length > 0">
            <div class="val-item" *ngFor="let r of validationRun.results" [ngClass]="'val-' + r.status.toLowerCase()">
              <mat-icon *ngIf="r.status === 'Error'">error</mat-icon>
              <mat-icon *ngIf="r.status === 'Warning'">warning</mat-icon>
              <mat-icon *ngIf="r.status === 'Pass'">check_circle</mat-icon>
              <div class="val-detail">
                <div class="val-rule">{{ r.ruleCode }}</div>
                <div class="val-message">{{ r.message }}</div>
                <div class="val-segment" *ngIf="r.segmentString">{{ r.segmentString }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="dialog-overlay" *ngIf="showAddDialog" (click)="showAddDialog = false">
      <div class="dialog" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <h2>Add Budget String</h2>
          <button mat-icon-button (click)="showAddDialog = false"><mat-icon>close</mat-icon></button>
        </div>
        <div class="dialog-body">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Budget Version</mat-label>
            <mat-select [(ngModel)]="newString.budgetVersionId">
              <mat-option *ngFor="let v of versions" [value]="v.id">{{ v.versionName }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Item</mat-label>
            <mat-select [(ngModel)]="newString.itemSegmentId">
              <mat-option *ngFor="let seg of scoaItems" [value]="seg.id">{{ seg.code }} - {{ seg.description }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Fund</mat-label>
            <mat-select [(ngModel)]="newString.fundSegmentId">
              <mat-option *ngFor="let seg of scoaFunds" [value]="seg.id">{{ seg.code }} - {{ seg.description }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Function</mat-label>
            <mat-select [(ngModel)]="newString.functionSegmentId">
              <mat-option *ngFor="let seg of scoaFunctions" [value]="seg.id">{{ seg.code }} - {{ seg.description }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Project</mat-label>
            <mat-select [(ngModel)]="newString.projectSegmentId">
              <mat-option *ngFor="let seg of scoaProjects" [value]="seg.id">{{ seg.code }} - {{ seg.description }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Region</mat-label>
            <mat-select [(ngModel)]="newString.regionSegmentId">
              <mat-option *ngFor="let seg of scoaRegions" [value]="seg.id">{{ seg.code }} - {{ seg.description }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Costing</mat-label>
            <mat-select [(ngModel)]="newString.costingSegmentId">
              <mat-option *ngFor="let seg of scoaCostings" [value]="seg.id">{{ seg.code }} - {{ seg.description }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>MSC</mat-label>
            <mat-select [(ngModel)]="newString.mscSegmentId">
              <mat-option *ngFor="let seg of scoaMscs" [value]="seg.id">{{ seg.code }} - {{ seg.description }}</mat-option>
            </mat-select>
          </mat-form-field>
          <div class="amount-row">
            <mat-form-field appearance="outline">
              <mat-label>Year 1 Amount</mat-label>
              <input matInput type="number" [(ngModel)]="newString.year1Amount" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Year 2 Amount</mat-label>
              <input matInput type="number" [(ngModel)]="newString.year2Amount" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Year 3 Amount</mat-label>
              <input matInput type="number" [(ngModel)]="newString.year3Amount" />
            </mat-form-field>
          </div>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Source Module</mat-label>
            <mat-select [(ngModel)]="newString.sourceModule">
              <mat-option value="Operating">Operating</mat-option>
              <mat-option value="Capital">Capital</mat-option>
              <mat-option value="Revenue">Revenue</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <div class="dialog-actions">
          <button mat-button (click)="showAddDialog = false">Cancel</button>
          <button mat-raised-button color="primary" (click)="addString()">Add String</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .page-header h1 { font-size: 22px; font-weight: 600; color: #1e293b; margin: 0; }
    .header-actions { display: flex; gap: 8px; }
    .filter-bar { display: flex; gap: 12px; padding: 12px 16px; background: #fff; border: 1px solid #e8ecf1; border-radius: 12px; margin-bottom: 20px; align-items: center; }
    .filter-bar mat-form-field { width: 220px; }
    .table-card { background: #fff; border: 1px solid #e8ecf1; border-radius: 12px; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; padding: 12px 16px; text-align: left; border-bottom: 1px solid #e8ecf1; white-space: nowrap; }
    td { font-size: 13px; color: #1e293b; padding: 12px 16px; border-bottom: 1px solid #f1f5f9; }
    tr:hover td { background: #f8fafc; }
    .amount { text-align: right; font-family: 'Roboto Mono', monospace; }
    .empty { text-align: center; color: #94a3b8; padding: 40px 16px !important; }
    .mscoa-segments { display: flex; gap: 4px; flex-wrap: wrap; }
    .mscoa-tag { display: inline-block; padding: 2px 8px; background: #e3f2fd; color: #1565c0; border-radius: 4px; font-family: 'Roboto Mono', monospace; font-size: 11px; font-weight: 500; }
    .module-tag { display: inline-block; padding: 2px 8px; background: #f1f5f9; color: #475569; border-radius: 4px; font-size: 11px; font-weight: 500; }
    .dialog-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .dialog { background: #fff; border-radius: 16px; width: 560px; max-width: 90vw; max-height: 85vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
    .dialog-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px 0; }
    .dialog-header h2 { margin: 0; font-size: 18px; font-weight: 600; color: #1e293b; }
    .dialog-body { padding: 20px 24px; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 8px; padding: 0 24px 20px; }
    .full-width { width: 100%; }
    .amount-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .validation-summary { display: flex; gap: 16px; margin-bottom: 20px; }
    .val-stat { flex: 1; text-align: center; padding: 16px; border-radius: 8px; }
    .val-stat.passed { background: #ecfdf5; }
    .val-stat.warnings { background: #fff7ed; }
    .val-stat.errors { background: #fef2f2; }
    .val-count { display: block; font-size: 28px; font-weight: 700; }
    .passed .val-count { color: #059669; }
    .warnings .val-count { color: #ea580c; }
    .errors .val-count { color: #dc2626; }
    .val-label { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; }
    .validation-results { display: flex; flex-direction: column; gap: 8px; }
    .val-item { display: flex; gap: 10px; padding: 10px 12px; border-radius: 8px; align-items: flex-start; }
    .val-error { background: #fef2f2; }
    .val-error mat-icon { color: #dc2626; }
    .val-warning { background: #fff7ed; }
    .val-warning mat-icon { color: #ea580c; }
    .val-pass { background: #ecfdf5; }
    .val-pass mat-icon { color: #059669; }
    .val-detail { flex: 1; }
    .val-rule { font-size: 12px; font-weight: 600; color: #1e293b; }
    .val-message { font-size: 13px; color: #475569; }
    .val-segment { font-size: 11px; color: #94a3b8; font-family: 'Roboto Mono', monospace; margin-top: 4px; }
  `]
})
export class StringsListPage implements OnInit {
  strings: BudgetStringList[] = [];
  versions: BudgetVersionSummary[] = [];
  scoaItems: ScoaSegment[] = [];
  scoaFunds: ScoaSegment[] = [];
  scoaFunctions: ScoaSegment[] = [];
  scoaProjects: ScoaSegment[] = [];
  scoaRegions: ScoaSegment[] = [];
  scoaCostings: ScoaSegment[] = [];
  scoaMscs: ScoaSegment[] = [];
  validationRun: ValidationRun | null = null;
  filterVersionId = 0;
  filterModule = '';
  showAddDialog = false;
  showValidationResults = false;
  newString: any = {
    budgetVersionId: 0, itemSegmentId: 0, fundSegmentId: 0, functionSegmentId: 0,
    projectSegmentId: 0, regionSegmentId: 0, costingSegmentId: 0, mscSegmentId: 0,
    year1Amount: 0, year2Amount: 0, year3Amount: 0, sourceModule: ''
  };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadStrings();
    this.api.getBudgetVersions().subscribe(v => this.versions = v);
    this.api.getScoaItems().subscribe(s => this.scoaItems = s);
    this.api.getScoaFunds().subscribe(s => this.scoaFunds = s);
    this.api.getScoaFunctions().subscribe(s => this.scoaFunctions = s);
    this.api.getScoaProjects().subscribe(s => this.scoaProjects = s);
    this.api.getScoaRegions().subscribe(s => this.scoaRegions = s);
    this.api.getScoaCostings().subscribe(s => this.scoaCostings = s);
    this.api.getScoaMscs().subscribe(s => this.scoaMscs = s);
  }

  loadStrings() {
    this.api.getBudgetStrings(
      this.filterVersionId || undefined,
      this.filterModule || undefined
    ).subscribe(s => this.strings = s);
  }

  formatRand(amount: number): string {
    return 'R ' + (amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  validateStrings() {
    if (!this.filterVersionId) return;
    this.api.validateBudgetStrings(this.filterVersionId).subscribe(r => {
      this.validationRun = r;
      this.showValidationResults = true;
    });
  }

  addString() {
    this.api.createBudgetString(this.newString).subscribe(() => {
      this.showAddDialog = false;
      this.newString = {
        budgetVersionId: 0, itemSegmentId: 0, fundSegmentId: 0, functionSegmentId: 0,
        projectSegmentId: 0, regionSegmentId: 0, costingSegmentId: 0, mscSegmentId: 0,
        year1Amount: 0, year2Amount: 0, year3Amount: 0, sourceModule: ''
      };
      this.loadStrings();
    });
  }
}
