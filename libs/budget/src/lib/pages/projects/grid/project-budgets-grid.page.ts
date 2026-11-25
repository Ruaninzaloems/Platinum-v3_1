import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../../core/services/api.service';
import { ConstantsApiService } from '../../../core/services/constants-api.service';
import { ActiveYearService } from '../../../core/services/active-year.service';
import { ProjectCaptureDialogComponent } from './project-capture-dialog.component';
import { ProjectItem, Department, FinancialYear } from '../../../core/models/budget.models';

interface EditRow {
  original: ProjectItem;
  projectName: string;
  description: string;
  typeVal: number | null;
  statusVal: number | null;
  departmentId: number | null;
  ward: string;
  gpsCoordinates: string;
  projectManager: string;
  contractorName: string;
  contractNumber: string;
  fundingSource: string;
  startDate: string;
  endDate: string;
  totalProjectCost: number | string;
  isRegistered: boolean;
  financialYear: string;
  singleMultiYear: string;
  projectTypeName: string;
  costingProject: boolean;
  scoaFunctionId: number | null;
  scoaFunctionRecordId: number | null;
  scoaFunctionLabel: string | null;
  scoaFunctionPath: string | null;
  scoaFunctionNtId: string | null;
  scoaFundId: number | null;
  scoaFundRecordId: number | null;
  scoaFundLabel: string | null;
  scoaFundPath: string | null;
  scoaFundNtId: string | null;
  scoaRegionId: number | null;
  scoaRegionRecordId: number | null;
  scoaRegionLabel: string | null;
  scoaRegionPath: string | null;
  scoaRegionNtId: string | null;
  scoaCostingId: number | null;
  scoaCostingRecordId: number | null;
  scoaCostingLabel: string | null;
  scoaCostingPath: string | null;
  scoaCostingNtId: string | null;
  planProjectItemCode: number | null;
  scoaItemId: number | null;
  scoaItemRecordId: number | null;
  scoaItemLabel: string | null;
  scoaItemPath: string | null;
  scoaItemCode: string | null;
  scoaItemNtId: string | null;
  munClassId: number | null;
  munClassLabel: string | null;
  munClassPath: string | null;
  projectItemId: number | null;
  projectItemText: string;
  creditDebit: string | null;
  isActiveForScm: boolean;
  year1: number; year2: number; year3: number;
  budgetSplitId: number | null;
  m01: string; m02: string; m03: string; m04: string;
  m05: string; m06: string; m07: string; m08: string;
  m09: string; m10: string; m11: string; m12: string;
  grapClassification: string;
  grapClassificationNote: string;
  mainSegmentReporting: string;
  subSegmentReporting: string;
  planProjectItemId: number | null;
  saving: boolean;
  saved: boolean;
  error: string | null;
}

// Populated dynamically from Const_PlanCapitalOperationalTypes_sys (TypeValue → CapitalOperation)
interface BudgetTypeOption { label: string; value: number; }  // value = TypeValue

// Status IDs from Const_Status WHERE UsedBy = 'ProjectRegister'
const STATUS_OPTIONS = [
  { label: 'Capture Project', value: 4  },
  { label: 'Delete Project',  value: 5  },
  { label: 'Registered/IDP', value: 23 },
  { label: 'Initiated',       value: 24 },
];

// Reverse map: label returned by API → Status_ID
const STATUS_STR_TO_ID: Record<string, number> = {
  'Capture Project': 4, 'Delete Project': 5,
  'Registered/IDP': 23, 'Initiated': 24
};

const SINGLE_MULTI_OPTIONS = ['Single-Year', 'Multi-Year'];


@Component({
  selector: 'app-project-budgets-grid',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatTooltipModule, ProjectCaptureDialogComponent],
  template: `
<div class="page-container">
  <div class="page-header">
    <div>
      <h1>Project Budgets Grid</h1>
      <p class="subtitle">Inline editable grid — all project fields from the Capture / Edit screen</p>
    </div>
    <div class="fy-selector" style="margin-left:auto;margin-right:16px;">
      <label style="font-size:12px;color:#64748b;display:block;margin-bottom:4px;">Financial Year</label>
      <select class="filter-select" [(ngModel)]="selectedFy" (ngModelChange)="onFyChange()" style="min-width:130px;">
        <option *ngFor="let fy of financialYears" [value]="fy.yearCode">{{fy.yearCode}}</option>
      </select>
    </div>
    <div class="header-actions">
      <span class="dirty-badge" *ngIf="dirtyCount > 0">{{dirtyCount}} unsaved row{{dirtyCount > 1 ? 's' : ''}}</span>
      <button class="btn-action save-all" *ngIf="dirtyCount > 0" (click)="saveAll()" [disabled]="anySaving">
        <mat-icon>save</mat-icon> Save All
      </button>
      <button class="btn-action" (click)="exportCsv()">
        <mat-icon>download</mat-icon> Export CSV
      </button>
      <button class="btn-action btn-capture" (click)="captureProject()">
        <mat-icon>add_circle_outline</mat-icon> Capture Project
      </button>
    </div>
  </div>

  <div class="filter-bar">
    <div class="search-wrap">
      <mat-icon class="s-icon">search</mat-icon>
      <input class="filter-input" [(ngModel)]="search" placeholder="Search code, name, plan project item code…" (ngModelChange)="applyFilters()">
    </div>
    <div class="search-wrap">
      <mat-icon class="s-icon">tag</mat-icon>
      <input class="filter-input" [(ngModel)]="filterScoaItem" placeholder="Filter by SCOA Item…" (ngModelChange)="applyFilters()">
      <mat-icon *ngIf="filterScoaItem" class="s-clear" (click)="filterScoaItem=''; applyFilters()">close</mat-icon>
    </div>
    <div class="search-wrap">
      <mat-icon class="s-icon">tag</mat-icon>
      <input class="filter-input" [(ngModel)]="filterScoaProject" placeholder="Filter by SCOA Project…" (ngModelChange)="applyFilters()">
      <mat-icon *ngIf="filterScoaProject" class="s-clear" (click)="filterScoaProject=''; applyFilters()">close</mat-icon>
    </div>
    <div class="search-wrap">
      <mat-icon class="s-icon">tag</mat-icon>
      <input class="filter-input" [(ngModel)]="filterScoaFunction" placeholder="Filter by SCOA Function…" (ngModelChange)="applyFilters()">
      <mat-icon *ngIf="filterScoaFunction" class="s-clear" (click)="filterScoaFunction=''; applyFilters()">close</mat-icon>
    </div>
    <div class="search-wrap">
      <mat-icon class="s-icon">tag</mat-icon>
      <input class="filter-input" [(ngModel)]="filterScoaFund" placeholder="Filter by SCOA Fund…" (ngModelChange)="applyFilters()">
      <mat-icon *ngIf="filterScoaFund" class="s-clear" (click)="filterScoaFund=''; applyFilters()">close</mat-icon>
    </div>
    <div class="search-wrap">
      <mat-icon class="s-icon">tag</mat-icon>
      <input class="filter-input" [(ngModel)]="filterScoaRegion" placeholder="Filter by SCOA Region…" (ngModelChange)="applyFilters()">
      <mat-icon *ngIf="filterScoaRegion" class="s-clear" (click)="filterScoaRegion=''; applyFilters()">close</mat-icon>
    </div>
    <div class="search-wrap">
      <mat-icon class="s-icon">tag</mat-icon>
      <input class="filter-input" [(ngModel)]="filterScoaCosting" placeholder="Filter by SCOA Costing…" (ngModelChange)="applyFilters()">
      <mat-icon *ngIf="filterScoaCosting" class="s-clear" (click)="filterScoaCosting=''; applyFilters()">close</mat-icon>
    </div>
    <select class="filter-select" [(ngModel)]="filterDept" (ngModelChange)="applyFilters()">
      <option [ngValue]="0">All Departments</option>
      <option *ngFor="let d of departments" [ngValue]="d.id">{{d.name}}</option>
    </select>
    <select class="filter-select" [(ngModel)]="filterType" (ngModelChange)="applyFilters()">
      <option value="">All Types</option>
      <option *ngFor="let t of budgetTypes" [value]="t.value">{{t.label}}</option>
    </select>
    <select class="filter-select" [(ngModel)]="filterStatus" (ngModelChange)="applyFilters()">
      <option value="">All Statuses</option>
      <option *ngFor="let s of statusOptions" [value]="s.value">{{s.label}}</option>
    </select>
    <button class="btn-clear" *ngIf="search || filterDept || filterType || filterStatus || filterScoaItem || filterScoaProject || filterScoaFunction || filterScoaFund || filterScoaRegion || filterScoaCosting" (click)="clearFilters()">
      <mat-icon>clear</mat-icon>
    </button>
    <span class="count-badge">
      {{rows.length}} item{{rows.length !== 1 ? 's' : ''}}
      <ng-container *ngIf="bgLoading"> &mdash; loading {{allProjects.length}}/{{totalItems}}…</ng-container>
      <ng-container *ngIf="!bgLoading && totalPages > 1"> &mdash; page {{pageIndex+1}} / {{totalPages}}</ng-container>
    </span>
  </div>

  <div class="grid-scroll" *ngIf="!loading; else loadingTpl">
    <table class="eg" *ngIf="rows.length; else emptyTpl">
      <thead>
        <tr>
          <th class="col-actions sticky-col">Actions</th>
          <th class="col-code sticky-col2">Project Code</th>
          <th class="col-code">Plan Project Item Code</th>

          <!-- ── Project Identification (Tab 1) ── -->
          <th class="col-fy group-id">Financial Year <span class="req">*</span></th>
          <th class="col-status group-id">Project Status <span class="req">*</span></th>
          <th class="col-name group-id">Project Name <span class="req">*</span></th>

          <!-- ── Budget Classification (Tab 1) ── -->
          <th class="col-type group-bc">Budget Type <span class="req">*</span></th>
          <th class="col-costing group-bc">Costing Project</th>

          <!-- ── SCOA Segments (read-only) ── -->
          <th class="col-scoa group-scoa">SCOA Project</th>
          <th class="col-scoa group-scoa">SCOA Function <span class="req">*</span></th>
          <th class="col-scoa group-scoa">Municipal Classification <span class="req">*</span></th>
          <th class="col-scoa group-scoa">SCOA Fund <span class="req">*</span></th>
          <th class="col-scoa group-scoa">SCOA Region <span class="req">*</span></th>
          <th class="col-scoa group-scoa">SCOA Costing <span class="req">*</span></th>
          <th class="col-scoa group-scoa">SCOA Item <span class="req">*</span></th>
          <th class="col-scoa-sm group-scoa">Prefix</th>
          <th class="col-scoa group-scoa">Project Item <span class="req">*</span></th>
          <th class="col-scoa-sm group-scoa">Active For SCM</th>

          <!-- ── Budget Totals ── -->
          <th class="col-amt group-amt">Year 1 <span class="req">*</span></th>
          <th class="col-amt group-amt">Year 2 <span class="req">*</span></th>
          <th class="col-amt group-amt">Year 3 <span class="req">*</span></th>
          <th class="col-scoa-sm group-amt">Budget Split <span class="req">*</span></th>
          <th class="col-month">Jul (M1) <span class="req">*</span></th>
          <th class="col-month">Aug (M2) <span class="req">*</span></th>
          <th class="col-month">Sep (M3) <span class="req">*</span></th>
          <th class="col-month">Oct (M4) <span class="req">*</span></th>
          <th class="col-month">Nov (M5) <span class="req">*</span></th>
          <th class="col-month">Dec (M6) <span class="req">*</span></th>
          <th class="col-month">Jan (M7) <span class="req">*</span></th>
          <th class="col-month">Feb (M8) <span class="req">*</span></th>
          <th class="col-month">Mar (M9) <span class="req">*</span></th>
          <th class="col-month">Apr (M10) <span class="req">*</span></th>
          <th class="col-month">May (M11) <span class="req">*</span></th>
          <th class="col-month">Jun (M12) <span class="req">*</span></th>
          <th class="col-month-total">Month Total</th>
          <th class="col-grap">GRAP Classification</th>
          <th class="col-grap">GRAP Classification Note</th>
          <th class="col-seg">Main Segment Reporting</th>
          <th class="col-seg">Sub Segment Reporting</th>
        </tr>
      </thead>
      <tbody>
        <!-- ── Totals Row ── -->
        <tr class="totals-row" *ngIf="rows.length">
          <td class="col-actions sticky-col totals-label">TOTALS</td>
          <td class="col-code sticky-col2"></td>
          <!-- Plan Project Item Code → Active For SCM (cols 3–18, same classes as data row) -->
          <td class="col-code"></td>
          <td class="col-fy"></td>
          <td class="col-status"></td>
          <td class="col-name"></td>
          <td class="col-type"></td>
          <td class="col-costing"></td>
          <td class="col-scoa"></td>
          <td class="col-scoa"></td>
          <td class="col-scoa"></td>
          <td class="col-scoa"></td>
          <td class="col-scoa"></td>
          <td class="col-scoa"></td>
          <td class="col-scoa"></td>
          <td class="col-scoa-sm"></td>
          <td class="col-proj-item"></td>
          <td class="col-scoa-sm"></td>
          <!-- Year totals -->
          <td class="col-amt tot-num">{{totalsRow.y1 | number:'1.0-0'}}</td>
          <td class="col-amt tot-num">{{totalsRow.y2 | number:'1.0-0'}}</td>
          <td class="col-amt tot-num">{{totalsRow.y3 | number:'1.0-0'}}</td>
          <td class="col-scoa-sm"></td>
          <!-- Month totals -->
          <td class="col-month tot-num">{{totalsRow.m01 | number:'1.0-0'}}</td>
          <td class="col-month tot-num">{{totalsRow.m02 | number:'1.0-0'}}</td>
          <td class="col-month tot-num">{{totalsRow.m03 | number:'1.0-0'}}</td>
          <td class="col-month tot-num">{{totalsRow.m04 | number:'1.0-0'}}</td>
          <td class="col-month tot-num">{{totalsRow.m05 | number:'1.0-0'}}</td>
          <td class="col-month tot-num">{{totalsRow.m06 | number:'1.0-0'}}</td>
          <td class="col-month tot-num">{{totalsRow.m07 | number:'1.0-0'}}</td>
          <td class="col-month tot-num">{{totalsRow.m08 | number:'1.0-0'}}</td>
          <td class="col-month tot-num">{{totalsRow.m09 | number:'1.0-0'}}</td>
          <td class="col-month tot-num">{{totalsRow.m10 | number:'1.0-0'}}</td>
          <td class="col-month tot-num">{{totalsRow.m11 | number:'1.0-0'}}</td>
          <td class="col-month tot-num">{{totalsRow.m12 | number:'1.0-0'}}</td>
          <td class="col-month-total tot-num">{{totalsRow.mTot | number:'1.0-0'}}</td>
          <!-- GRAP / Segment (cols 36–39) -->
          <td class="col-grap"></td>
          <td class="col-grap"></td>
          <td class="col-seg"></td>
          <td class="col-seg"></td>
        </tr>

        <tr *ngFor="let r of pagedRows" [class.dirty-row]="isDirty(r)" [class.saving-row]="r.saving" [class.saved-row]="r.saved">

          <!-- Actions -->
          <td class="col-actions sticky-col">
            <div class="action-cell">
              <button class="btn-save" *ngIf="isDirty(r)" (click)="saveRow(r)" [disabled]="r.saving" matTooltip="Save changes">
                <mat-icon>{{r.saving ? 'hourglass_empty' : 'save'}}</mat-icon>
              </button>
              <button class="btn-revert" *ngIf="isDirty(r)" (click)="revertRow(r)" [disabled]="r.saving" matTooltip="Discard changes">
                <mat-icon>undo</mat-icon>
              </button>
              <mat-icon class="saved-icon" *ngIf="!isDirty(r) && r.saved">check_circle</mat-icon>
              <span class="err-dot" *ngIf="r.error" [matTooltip]="r.error!">!</span>
            </div>
          </td>

          <!-- Code (read-only key) -->
          <td class="col-code sticky-col2 mono ro-cell">{{r.original.projectCode}}</td>
          <td class="col-code mono ro-cell">{{r.planProjectItemCode ?? r.planProjectItemId ?? '—'}}</td>

          <!-- ── Project Identification ── -->
          <!-- Financial Year -->
          <td class="col-fy">
            <select [(ngModel)]="r.financialYear" class="cell-select" disabled>
              <option [ngValue]="null">Select</option>
              <option *ngFor="let fy of financialYears" [ngValue]="fy.yearCode">{{fy.yearCode}}</option>
            </select>
          </td>

          <!-- Project Status (read-only) -->
          <td class="col-status">
            <span class="cell-readonly">{{r.original.status || '—'}}</span>
          </td>

          <!-- Project Name (read-only) -->
          <td class="col-name">
            <span class="cell-readonly">{{r.original.projectName || '—'}}</span>
          </td>

          <!-- ── Budget Classification ── -->
          <!-- Budget Type (read-only) -->
          <td class="col-type">
            <span class="cell-readonly">{{r.original.type || '—'}}</span>
          </td>

          <!-- Costing Project (read-only) -->
          <td class="col-costing">
            <span class="cell-readonly">{{r.original.costingProject ? 'Yes' : 'No'}}</span>
          </td>

          <!-- ── SCOA Segments (read-only) ── -->
          <td class="col-scoa ro-cell">
            <span *ngIf="r.original.scoaProject"
                  [title]="r.original.scoaProjectPath || r.original.scoaProject">
              {{r.original.scoaProject}}
            </span>
            <span *ngIf="!r.original.scoaProject">—</span>
          </td>
          <!-- SCOA Function — inline drill-down picker -->
          <td class="col-scoa fn-cell" (click)="$event.stopPropagation()">
            <div class="fn-trigger" (click)="toggleFnDrill(r, $event)"
                 [class.fn-trigger--active]="r.scoaFunctionId"
                 [matTooltip]="r.scoaFunctionPath || ''"
                 matTooltipShowDelay="400">
              <span class="fn-label">{{r.scoaFunctionLabel || '—'}}</span>
              <mat-icon *ngIf="r.scoaFunctionId && (r.scoaFunctionRecordId || !r.original.scoaFunctionId)" class="fn-clear" (click)="clearFnDrill(r, $event)">close</mat-icon>
              <mat-icon class="fn-arrow" [class.fn-arrow--open]="fnDrillActiveRow === r">arrow_drop_down</mat-icon>
            </div>
            <div class="fn-panel" *ngIf="fnDrillActiveRow === r">
              <div class="it-search-wrap" (click)="$event.stopPropagation()">
                <mat-icon class="it-search-icon">search</mat-icon>
                <input class="it-search-input" [(ngModel)]="fnDrillSearch"
                       placeholder="Search code, description or GUID…"
                       (ngModelChange)="onFnSearchChange(r)"
                       (click)="$event.stopPropagation()" autocomplete="off">
                <mat-icon *ngIf="fnDrillSearch" class="it-search-clear" (click)="clearFnSearch(r, $event)">close</mat-icon>
              </div>
              <div class="fn-nav" *ngIf="fnDrillHistory.length > 0 && !fnDrillSearchMode">
                <button class="fn-back" (click)="fnDrillBack($event)"><mat-icon>arrow_back</mat-icon> Back</button>
                <span class="fn-nav-path">{{fnPathLabel}}</span>
              </div>
              <div *ngIf="fnDrillLoading" class="fn-loading">Loading…</div>
              <div class="fn-items" *ngIf="!fnDrillLoading">
                <div *ngFor="let node of fnDrillItems" class="fn-item"
                     [class.fn-item--leaf]="node.postingLevel === 'Yes' || fnDrillSearchMode"
                     (click)="onFnSelect(r, node, $event)">
                  <span>{{node.scoaShortDesc || node.scoaDesc}}<span class="fn-code" *ngIf="node.scoaCode"> ({{node.scoaCode}})</span></span>
                  <mat-icon>{{(node.postingLevel === 'Yes' || fnDrillSearchMode) ? 'check_circle_outline' : 'chevron_right'}}</mat-icon>
                </div>
                <div *ngIf="fnDrillItems.length === 0 && !fnDrillSearchMode" class="fn-empty">No items found.</div>
                <div *ngIf="fnDrillItems.length === 0 && fnDrillSearchMode" class="fn-empty">No results for "{{fnDrillSearch}}".</div>
              </div>
            </div>
          </td>
          <!-- Municipal Classification drill-down picker -->
          <td class="col-scoa fn-cell" (click)="$event.stopPropagation()">
            <div class="fn-trigger" (click)="toggleMunDrill(r, $event)"
                 [class.fn-trigger--active]="r.munClassId"
                 [matTooltip]="r.munClassPath || ''"
                 matTooltipShowDelay="400">
              <span class="fn-label">{{r.munClassLabel || '—'}}</span>
              <mat-icon *ngIf="r.munClassId" class="fn-clear" (click)="clearMunDrill(r, $event)">close</mat-icon>
              <mat-icon class="fn-arrow" [class.fn-arrow--open]="munDrillActiveRow === r">arrow_drop_down</mat-icon>
            </div>
            <div class="fn-panel" *ngIf="munDrillActiveRow === r">
              <div class="fn-nav" *ngIf="munDrillHistory.length > 0">
                <button class="fn-back" (click)="munDrillBack($event)"><mat-icon>arrow_back</mat-icon></button>
                <span class="fn-nav-path">{{munPathLabel}}</span>
              </div>
              <div *ngIf="munDrillLoading" class="fn-loading">Loading…</div>
              <div class="fn-items" *ngIf="!munDrillLoading">
                <div *ngFor="let node of munDrillItems" class="fn-item"
                     [class.fn-item--leaf]="node.isLeaf"
                     (click)="onMunSelect(r, node, $event)">
                  <span>{{node.label}}<span class="fn-code" *ngIf="node.code"> ({{node.code}})</span></span>
                  <mat-icon>{{node.isLeaf ? 'check_circle_outline' : 'chevron_right'}}</mat-icon>
                </div>
                <div *ngIf="munDrillItems.length === 0" class="fn-empty">No items found.</div>
              </div>
            </div>
          </td>
          <!-- SCOA Fund — inline drill-down picker -->
          <td class="col-scoa fn-cell" (click)="$event.stopPropagation()">
            <div class="fn-trigger" (click)="toggleFdDrill(r, $event)"
                 [class.fn-trigger--active]="r.scoaFundId"
                 [matTooltip]="r.scoaFundPath || ''"
                 matTooltipShowDelay="400">
              <span class="fn-label">{{r.scoaFundLabel || '—'}}</span>
              <mat-icon *ngIf="r.scoaFundId && (r.scoaFundRecordId || !r.original.scoaFundId)" class="fn-clear" (click)="clearFdDrill(r, $event)">close</mat-icon>
              <mat-icon class="fn-arrow" [class.fn-arrow--open]="fdDrillActiveRow === r">arrow_drop_down</mat-icon>
            </div>
            <div class="fn-panel" *ngIf="fdDrillActiveRow === r">
              <div class="it-search-wrap" (click)="$event.stopPropagation()">
                <mat-icon class="it-search-icon">search</mat-icon>
                <input class="it-search-input" [(ngModel)]="fdDrillSearch"
                       placeholder="Search code, description or GUID…"
                       (ngModelChange)="onFdSearchChange(r)"
                       (click)="$event.stopPropagation()" autocomplete="off">
                <mat-icon *ngIf="fdDrillSearch" class="it-search-clear" (click)="clearFdSearch(r, $event)">close</mat-icon>
              </div>
              <div class="fn-nav" *ngIf="fdDrillHistory.length > 0 && !fdDrillSearchMode">
                <button class="fn-back" (click)="fdDrillBack($event)"><mat-icon>arrow_back</mat-icon> Back</button>
                <span class="fn-nav-path">{{fdPathLabel}}</span>
              </div>
              <div *ngIf="fdDrillLoading" class="fn-loading">Loading…</div>
              <div class="fn-items" *ngIf="!fdDrillLoading">
                <div *ngFor="let node of fdDrillItems" class="fn-item"
                     [class.fn-item--leaf]="node.postingLevel === 'Yes' || fdDrillSearchMode"
                     (click)="onFdSelect(r, node, $event)">
                  <span>{{node.scoaShortDesc || node.scoaDesc}}<span class="fn-code" *ngIf="node.scoaCode"> ({{node.scoaCode}})</span></span>
                  <mat-icon>{{(node.postingLevel === 'Yes' || fdDrillSearchMode) ? 'check_circle_outline' : 'chevron_right'}}</mat-icon>
                </div>
                <div *ngIf="fdDrillItems.length === 0 && !fdDrillSearchMode" class="fn-empty">No items found.</div>
                <div *ngIf="fdDrillItems.length === 0 && fdDrillSearchMode" class="fn-empty">No results for "{{fdDrillSearch}}".</div>
              </div>
            </div>
          </td>
          <!-- SCOA Region — inline drill-down picker -->
          <td class="col-scoa fn-cell" (click)="$event.stopPropagation()">
            <div class="fn-trigger" (click)="toggleRgDrill(r, $event)"
                 [class.fn-trigger--active]="r.scoaRegionId"
                 [matTooltip]="r.scoaRegionPath || ''"
                 matTooltipShowDelay="400">
              <span class="fn-label">{{r.scoaRegionLabel || '—'}}</span>
              <mat-icon *ngIf="r.scoaRegionId && (r.scoaRegionRecordId || !r.original.scoaRegionId)" class="fn-clear" (click)="clearRgDrill(r, $event)">close</mat-icon>
              <mat-icon class="fn-arrow" [class.fn-arrow--open]="rgDrillActiveRow === r">arrow_drop_down</mat-icon>
            </div>
            <div class="fn-panel" *ngIf="rgDrillActiveRow === r">
              <div class="it-search-wrap" (click)="$event.stopPropagation()">
                <mat-icon class="it-search-icon">search</mat-icon>
                <input class="it-search-input" [(ngModel)]="rgDrillSearch"
                       placeholder="Search code, description or GUID…"
                       (ngModelChange)="onRgSearchChange(r)"
                       (click)="$event.stopPropagation()" autocomplete="off">
                <mat-icon *ngIf="rgDrillSearch" class="it-search-clear" (click)="clearRgSearch(r, $event)">close</mat-icon>
              </div>
              <div class="fn-nav" *ngIf="rgDrillHistory.length > 0 && !rgDrillSearchMode">
                <button class="fn-back" (click)="rgDrillBack($event)"><mat-icon>arrow_back</mat-icon> Back</button>
                <span class="fn-nav-path">{{rgPathLabel}}</span>
              </div>
              <div *ngIf="rgDrillLoading" class="fn-loading">Loading…</div>
              <div class="fn-items" *ngIf="!rgDrillLoading">
                <div *ngFor="let node of rgDrillItems" class="fn-item"
                     [class.fn-item--leaf]="node.postingLevel === 'Yes' || rgDrillSearchMode"
                     (click)="onRgSelect(r, node, $event)">
                  <span>{{node.scoaShortDesc || node.scoaDesc}}<span class="fn-code" *ngIf="node.scoaCode"> ({{node.scoaCode}})</span></span>
                  <mat-icon>{{(node.postingLevel === 'Yes' || rgDrillSearchMode) ? 'check_circle_outline' : 'chevron_right'}}</mat-icon>
                </div>
                <div *ngIf="rgDrillItems.length === 0 && !rgDrillSearchMode" class="fn-empty">No items found.</div>
                <div *ngIf="rgDrillItems.length === 0 && rgDrillSearchMode" class="fn-empty">No results for "{{rgDrillSearch}}".</div>
              </div>
            </div>
          </td>
          <!-- SCOA Costing drill-down picker -->
          <td class="col-scoa fn-cell" (click)="$event.stopPropagation()">
            <div class="fn-trigger" (click)="toggleCoDrill(r, $event)"
                 [class.fn-trigger--active]="r.scoaCostingId"
                 [matTooltip]="r.scoaCostingPath || ''"
                 matTooltipShowDelay="400">
              <span class="fn-label">{{r.scoaCostingLabel || '—'}}</span>
              <mat-icon *ngIf="r.scoaCostingId" class="fn-clear" (click)="clearCoDrill(r, $event)">close</mat-icon>
              <mat-icon class="fn-arrow" [class.fn-arrow--open]="coDrillActiveRow === r">arrow_drop_down</mat-icon>
            </div>
            <div class="fn-panel" *ngIf="coDrillActiveRow === r">
              <div class="it-search-wrap" (click)="$event.stopPropagation()">
                <mat-icon class="it-search-icon">search</mat-icon>
                <input class="it-search-input" [(ngModel)]="coDrillSearch"
                       placeholder="Search code, description or GUID…"
                       (ngModelChange)="onCoSearchChange(r)"
                       (click)="$event.stopPropagation()" autocomplete="off">
                <mat-icon *ngIf="coDrillSearch" class="it-search-clear" (click)="clearCoSearch(r, $event)">close</mat-icon>
              </div>
              <div class="fn-nav" *ngIf="coDrillHistory.length > 0 && !coDrillSearchMode">
                <button class="fn-back" (click)="coDrillBack($event)"><mat-icon>arrow_back</mat-icon></button>
                <span class="fn-nav-path">{{coPathLabel}}</span>
              </div>
              <div *ngIf="coDrillLoading" class="fn-loading">Loading…</div>
              <div class="fn-items" *ngIf="!coDrillLoading">
                <div *ngFor="let node of coDrillItems" class="fn-item"
                     [class.fn-item--leaf]="node.postingLevel === 'Yes' || coDrillSearchMode"
                     (click)="onCoSelect(r, node, $event)">
                  <span>{{node.scoaShortDesc || node.scoaDesc}}<span class="fn-code" *ngIf="node.scoaCode"> ({{node.scoaCode}})</span></span>
                  <mat-icon>{{(node.postingLevel === 'Yes' || coDrillSearchMode) ? 'check_circle_outline' : 'chevron_right'}}</mat-icon>
                </div>
                <div *ngIf="coDrillItems.length === 0 && !coDrillSearchMode" class="fn-empty">No items found.</div>
                <div *ngIf="coDrillItems.length === 0 && coDrillSearchMode" class="fn-empty">No results for "{{coDrillSearch}}".</div>
              </div>
            </div>
          </td>
          <!-- SCOA Item drill-down picker -->
          <td class="col-scoa fn-cell" (click)="$event.stopPropagation()">
            <div class="fn-trigger" (click)="toggleItDrill(r, $event)"
                 [class.fn-trigger--active]="r.scoaItemId"
                 [matTooltip]="r.scoaItemPath || ''"
                 matTooltipShowDelay="400">
              <span class="fn-label">{{r.scoaItemLabel || '—'}}</span>
              <mat-icon *ngIf="r.scoaItemId" class="fn-clear" (click)="clearItDrill(r, $event)">close</mat-icon>
              <mat-icon class="fn-arrow" [class.fn-arrow--open]="itDrillActiveRow === r">arrow_drop_down</mat-icon>
            </div>
            <div class="fn-panel" *ngIf="itDrillActiveRow === r">
              <div class="it-search-wrap" (click)="$event.stopPropagation()">
                <mat-icon class="it-search-icon">search</mat-icon>
                <input class="it-search-input" [(ngModel)]="itDrillSearch"
                       placeholder="Search code, description or GUID…"
                       (ngModelChange)="onItSearchChange(r)"
                       (click)="$event.stopPropagation()" autocomplete="off">
                <mat-icon *ngIf="itDrillSearch" class="it-search-clear" (click)="clearItSearch(r, $event)">close</mat-icon>
              </div>
              <div class="fn-nav" *ngIf="itDrillHistory.length > 0 && !itDrillSearchMode">
                <button class="fn-back" (click)="itDrillBack($event)"><mat-icon>arrow_back</mat-icon></button>
                <span class="fn-nav-path">{{itPathLabel}}</span>
              </div>
              <div *ngIf="itDrillLoading" class="fn-loading">Loading…</div>
              <div class="fn-items" *ngIf="!itDrillLoading">
                <div *ngFor="let node of itDrillItems" class="fn-item"
                     [class.fn-item--leaf]="node.postingLevel === 'Yes' || itDrillSearchMode"
                     (click)="onItSelect(r, node, $event)">
                  <span>{{node.scoaShortDesc || node.scoaDesc}}<span class="fn-code" *ngIf="node.scoaCode"> ({{node.scoaCode}})</span></span>
                  <mat-icon>{{(node.postingLevel === 'Yes' || itDrillSearchMode) ? 'check_circle_outline' : 'chevron_right'}}</mat-icon>
                </div>
                <div *ngIf="itDrillItems.length === 0 && !itDrillSearchMode" class="fn-empty">No items found.</div>
                <div *ngIf="itDrillItems.length === 0 && itDrillSearchMode" class="fn-empty">No results for "{{itDrillSearch}}".</div>
              </div>
            </div>
          </td>
          <td class="col-scoa-sm ro-cell" style="text-align:center; font-family:'Courier New',monospace; font-weight:600; letter-spacing:.05em;">
            {{r.scoaItemCode ? r.scoaItemCode.substring(0, 2) : '—'}}
          </td>
          <td class="col-proj-item">
            <div class="pi-wrap">
              <input class="pi-input" [(ngModel)]="r.projectItemText"
                     (focus)="onPiFocus(r)" (input)="onPiInput(r)" (blur)="onPiBlur()"
                     placeholder="—" autocomplete="off"
                     [matTooltip]="r.projectItemText || ''"
                     matTooltipShowDelay="400">
              <button *ngIf="r.projectItemText" class="pi-clear"
                      (mousedown)="$event.preventDefault()" (click)="clearPi(r)">×</button>
              <div class="pi-dropdown" *ngIf="piActiveRow === r && piFiltered.length > 0">
                <div *ngFor="let item of piFiltered" class="pi-option"
                     (mousedown)="$event.preventDefault()" (click)="selectPiItem(r, item)">
                  <span class="pi-opt-code" *ngIf="item.code">{{item.code}}</span>
                  <span class="pi-opt-desc">{{item.code && item.description ? ' — ' + item.description : (item.description || item.code || '')}}</span>
                </div>
              </div>
            </div>
          </td>
          <td class="col-scoa-sm" style="text-align:center">
            <input type="checkbox" [(ngModel)]="r.isActiveForScm" (change)="markDirty(r)">
            <span class="chk-label">{{r.isActiveForScm ? 'Yes' : 'No'}}</span>
          </td>

          <!-- Budget amounts (editable) -->
          <td class="col-amt"><input class="cell-input num-input" type="number" step="0.01" [(ngModel)]="r.year1" (ngModelChange)="yr1Changed(r)"></td>
          <td class="col-amt"><input class="cell-input num-input" type="number" step="0.01" [(ngModel)]="r.year2" (ngModelChange)="markDirty(r)"></td>
          <td class="col-amt"><input class="cell-input num-input" type="number" step="0.01" [(ngModel)]="r.year3" (ngModelChange)="markDirty(r)"></td>
          <td class="col-scoa-sm">
            <select class="cell-input" [(ngModel)]="r.budgetSplitId" (ngModelChange)="applyBudgetSplit(r)">
              <option [ngValue]="null">— Select —</option>
              <option *ngFor="let o of budgetSplitOptions" [ngValue]="o.id">{{o.desc}}</option>
            </select>
          </td>
          <td class="col-month"><input class="cell-input num-input" type="number" step="0.01" [(ngModel)]="r.m01" (ngModelChange)="markDirty(r)" [disabled]="r.budgetSplitId !== 1"></td>
          <td class="col-month"><input class="cell-input num-input" type="number" step="0.01" [(ngModel)]="r.m02" (ngModelChange)="markDirty(r)" [disabled]="r.budgetSplitId !== 1"></td>
          <td class="col-month"><input class="cell-input num-input" type="number" step="0.01" [(ngModel)]="r.m03" (ngModelChange)="markDirty(r)" [disabled]="r.budgetSplitId !== 1"></td>
          <td class="col-month"><input class="cell-input num-input" type="number" step="0.01" [(ngModel)]="r.m04" (ngModelChange)="markDirty(r)" [disabled]="r.budgetSplitId !== 1"></td>
          <td class="col-month"><input class="cell-input num-input" type="number" step="0.01" [(ngModel)]="r.m05" (ngModelChange)="markDirty(r)" [disabled]="r.budgetSplitId !== 1"></td>
          <td class="col-month"><input class="cell-input num-input" type="number" step="0.01" [(ngModel)]="r.m06" (ngModelChange)="markDirty(r)" [disabled]="r.budgetSplitId !== 1"></td>
          <td class="col-month"><input class="cell-input num-input" type="number" step="0.01" [(ngModel)]="r.m07" (ngModelChange)="markDirty(r)" [disabled]="r.budgetSplitId !== 1"></td>
          <td class="col-month"><input class="cell-input num-input" type="number" step="0.01" [(ngModel)]="r.m08" (ngModelChange)="markDirty(r)" [disabled]="r.budgetSplitId !== 1"></td>
          <td class="col-month"><input class="cell-input num-input" type="number" step="0.01" [(ngModel)]="r.m09" (ngModelChange)="markDirty(r)" [disabled]="r.budgetSplitId !== 1"></td>
          <td class="col-month"><input class="cell-input num-input" type="number" step="0.01" [(ngModel)]="r.m10" (ngModelChange)="markDirty(r)" [disabled]="r.budgetSplitId !== 1"></td>
          <td class="col-month"><input class="cell-input num-input" type="number" step="0.01" [(ngModel)]="r.m11" (ngModelChange)="markDirty(r)" [disabled]="r.budgetSplitId !== 1"></td>
          <td class="col-month"><input class="cell-input num-input" type="number" step="0.01" [(ngModel)]="r.m12" (ngModelChange)="markDirty(r)" [disabled]="r.budgetSplitId !== 1"></td>
          <td class="col-month-total ro-cell mono"
              [class.mn-ok]="monthSum(r) === (r.year1 ?? 0)"
              [class.mn-bad]="monthSum(r) !== (r.year1 ?? 0)"
              [matTooltip]="monthSum(r) !== (r.year1 ?? 0) ? 'Month total must equal Year 1 (' + (r.year1 ?? 0).toFixed(0) + ')' : 'Month total matches Year 1'">
            {{monthSum(r) | number:'1.0-0'}}
          </td>
          <td class="col-grap"><input class="cell-input" type="text" [(ngModel)]="r.grapClassification" (ngModelChange)="markDirty(r)"></td>
          <td class="col-grap"><input class="cell-input" type="text" [(ngModel)]="r.grapClassificationNote" (ngModelChange)="markDirty(r)"></td>
          <td class="col-seg"><input class="cell-input" type="text" [(ngModel)]="r.mainSegmentReporting" (ngModelChange)="markDirty(r)"></td>
          <td class="col-seg"><input class="cell-input" type="text" [(ngModel)]="r.subSegmentReporting" (ngModelChange)="markDirty(r)"></td>
        </tr>
      </tbody>
    </table>

    <div class="pagination-bar" *ngIf="totalPages > 1">
      <button class="btn-page" [disabled]="pageIndex === 0" (click)="prevPage()">
        <mat-icon>chevron_left</mat-icon> Prev
      </button>
      <span class="page-info">
        Showing {{pageIndex * pageSize + 1}}–{{(pageIndex + 1) * pageSize > rows.length ? rows.length : (pageIndex + 1) * pageSize}} of {{rows.length}} items
      </span>
      <button class="btn-page" [disabled]="pageIndex >= totalPages - 1" (click)="nextPage()">
        Next <mat-icon>chevron_right</mat-icon>
      </button>
    </div>

    <ng-template #emptyTpl>
      <div class="empty-state">
        <mat-icon>folder_off</mat-icon>
        <p>No projects match the current filters.</p>
      </div>
    </ng-template>
  </div>

  <ng-template #loadingTpl>
    <div class="loading-state">
      <mat-icon class="spin">refresh</mat-icon>
      <p>Loading projects…</p>
    </div>
  </ng-template>
</div>

<app-project-capture-dialog
  *ngIf="showCaptureDialog"
  [userFinancialYear]="activeFinancialYear"
  [existingProjectNames]="existingProjectNamesForFY"
  (closed)="showCaptureDialog = false"
  (saved)="onProjectSaved()">
</app-project-capture-dialog>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; }
    h1 { font-size:24px; font-weight:600; color:#0f2b46; margin:0 0 4px; }
    .subtitle { font-size:13px; color:#64748b; margin:0; }
    .header-actions { display:flex; align-items:center; gap:8px; flex-shrink:0; }
    .dirty-badge { background:#fef3c7; color:#92400e; font-size:12px; font-weight:600; padding:4px 10px; border-radius:20px; border:1px solid #fde68a; }
    .btn-action { display:flex; align-items:center; gap:6px; padding:8px 14px; border:1px solid #cbd5e1; background:#fff; border-radius:8px; cursor:pointer; font-size:13px; font-weight:500; color:#374151; }
    .btn-action:hover { background:#f1f5f9; }
    .btn-action mat-icon { font-size:18px; width:18px; height:18px; }
    .save-all { background:#0f2b46; color:#fff; border-color:#0f2b46; }
    .save-all:hover { background:#1e3a5f; }
    .save-all:disabled { opacity:.6; cursor:not-allowed; }
    .btn-capture { background:#16a34a; color:#fff; border-color:#16a34a; }
    .btn-capture:hover { background:#15803d; }

    .filter-bar { display:flex; align-items:center; gap:10px; margin-bottom:14px; flex-wrap:wrap; }
    .search-wrap { display:flex; align-items:center; gap:6px; background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:6px 12px; flex:1; min-width:200px; }
    .s-icon { font-size:18px; width:18px; height:18px; color:#94a3b8; }
    .filter-input { border:none; outline:none; font-size:13px; color:#334155; width:100%; background:transparent; }
    .s-clear { font-size:16px; width:16px; height:16px; color:#94a3b8; cursor:pointer; flex-shrink:0; }
    .s-clear:hover { color:#dc2626; }
    .filter-select { border:1px solid #e2e8f0; border-radius:8px; padding:7px 10px; font-size:13px; color:#334155; background:#fff; cursor:pointer; outline:none; }
    .btn-clear { display:flex; align-items:center; padding:7px; background:#fee2e2; border:1px solid #fecaca; border-radius:8px; color:#dc2626; cursor:pointer; }
    .btn-clear mat-icon { font-size:18px; width:18px; height:18px; }
    .count-badge { font-size:12px; color:#94a3b8; white-space:nowrap; }
    .pagination-bar { display:flex; align-items:center; gap:12px; padding:10px 16px; border-top:1px solid #e2e8f0; background:#f8fafc; }
    .btn-page { display:flex; align-items:center; gap:4px; padding:6px 14px; background:#fff; border:1px solid #cbd5e1; border-radius:8px; cursor:pointer; font-size:13px; color:#334155; }
    .btn-page:disabled { opacity:.4; cursor:default; }
    .page-info { font-size:13px; color:#64748b; flex:1; text-align:center; }

    .grid-scroll { overflow:auto; border:1px solid #e2e8f0; border-radius:12px; max-height:calc(100vh - 220px); min-height:300px; }

    .eg { border-collapse:collapse; font-size:13px; width:max-content; min-width:100%; }
    .eg thead th {
      position:sticky; top:0; z-index:2;
      border-bottom:2px solid #e2e8f0;
      padding:9px 10px; text-align:left;
      font-size:11px; font-weight:700; text-transform:uppercase;
      letter-spacing:.4px; white-space:nowrap;
    }

    /* Column group colour bands */
    .group-id   { background:#eff6ff; color:#1d4ed8; }
    .group-bc   { background:#f0fdf4; color:#15803d; }
    .group-scoa { background:#faf5ff; color:#7c3aed; }
    .group-amt  { background:#fff7ed; color:#c2410c; }
    .eg thead th:not(.group-id):not(.group-bc):not(.group-scoa):not(.group-amt) { background:#f8fafc; color:#64748b; }

    .eg tbody tr td { padding:4px 6px; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
    .eg tbody tr:last-child td { border-bottom:none; }

    .sticky-col  { position:sticky; left:0;    z-index:3; background:#fff !important; border-right:1px solid #e2e8f0; }
    .sticky-col2 { position:sticky; left:82px; z-index:3; background:#fff !important; border-right:1px solid #e2e8f0; }
    thead .sticky-col, thead .sticky-col2 { z-index:4; }

    .totals-row td { background:#0f2b46 !important; color:#e2e8f0; font-weight:600; padding:6px 8px; }
    .totals-row .sticky-col,
    .totals-row .sticky-col2 { background:#0f2b46 !important; }
    .totals-label { color:#c9a84c !important; font-size:11px; text-transform:uppercase; letter-spacing:.06em; }
    .tot-num { text-align:right; font-variant-numeric:tabular-nums; color:#fff !important; }

    .dirty-row  td { background:#fffbeb !important; }
    .saving-row td { background:#f0f9ff !important; opacity:.75; }
    .saved-row  td { background:#f0fdf4 !important; }

    /* Overrides so sticky cols stay visible in coloured rows */
    .dirty-row  .sticky-col, .dirty-row  .sticky-col2 { background:#fef9c3 !important; }
    .saved-row  .sticky-col, .saved-row  .sticky-col2 { background:#dcfce7 !important; }

    .col-actions  { min-width:82px;  width:82px; }
    .col-code     { min-width:90px;  width:90px; }
    .col-fy       { min-width:130px; }
    .col-name     { min-width:200px; }
    .col-desc     { min-width:180px; }
    .col-type     { min-width:120px; }
    .col-status   { min-width:120px; }
    .col-sm       { min-width:140px; }
    .col-pt       { min-width:150px; }
    .col-costing  { min-width:110px; text-align:center; }
    .col-scoa     { min-width:180px; }
    .col-scoa-sm  { min-width:100px; text-align:center; }
    .col-proj-item { min-width:180px; }
    .col-amt      { min-width:110px; text-align:right; }
    .col-month    { min-width:90px; text-align:right; }
    .col-month-total { min-width:100px; text-align:right; font-weight:600; }
    .mn-ok  { color:#16a34a; background:#f0fdf4; }
    .mn-bad { color:#dc2626; background:#fef2f2; }
    .col-grap     { min-width:160px; }
    .col-seg      { min-width:160px; }

    .pi-wrap { position:relative; display:flex; align-items:center; }
    .pi-input {
      flex:1; min-width:0; width:100%; box-sizing:border-box;
      border:1px solid transparent; border-radius:4px;
      padding:5px 24px 5px 7px; font-size:13px; color:#1e293b;
      background:transparent; outline:none; font-family:inherit;
      transition:border-color .15s, background .15s;
    }
    .pi-input:focus { border-color:#3b82f6; background:#fff; box-shadow:0 0 0 2px #bfdbfe; }
    .pi-input:hover { background:#f8fafc; }
    .pi-clear {
      position:absolute; right:4px; top:50%; transform:translateY(-50%);
      background:none; border:none; cursor:pointer; color:#94a3b8;
      font-size:14px; line-height:1; padding:0 2px;
    }
    .pi-clear:hover { color:#ef4444; }
    .pi-dropdown {
      position:absolute; top:100%; left:0; right:0; z-index:200;
      background:#fff; border:1px solid #e2e8f0; border-radius:6px;
      box-shadow:0 4px 12px rgba(0,0,0,.12); max-height:220px;
      overflow-y:auto; margin-top:2px;
    }
    .pi-option {
      padding:6px 10px; cursor:pointer; font-size:12.5px;
      color:#1e293b; border-bottom:1px solid #f1f5f9;
    }
    .pi-option:last-child { border-bottom:none; }
    .pi-option:hover { background:#f5f3ff; }
    .pi-opt-code { font-weight:600; color:#4f46e5; }
    .pi-opt-desc { color:#64748b; }

    .cell-readonly {
      display:block; width:100%; padding:5px 7px;
      font-size:13px; color:#475569; font-family:inherit;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    }
    .cell-input {
      width:100%; box-sizing:border-box;
      border:1px solid transparent; border-radius:4px;
      padding:5px 7px; font-size:13px; color:#1e293b;
      background:transparent; outline:none; font-family:inherit;
      transition:border-color .15s, background .15s;
    }
    .cell-input:focus { border-color:#3b82f6; background:#fff; box-shadow:0 0 0 2px #bfdbfe; }
    .cell-input:hover { background:#f8fafc; }
    .date-input { font-size:12px; }
    .num-input  { text-align:right; }
    .num-input::-webkit-outer-spin-button,
    .num-input::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
    .num-input[type=number] { -moz-appearance:textfield; }

    .cell-select {
      width:100%; box-sizing:border-box;
      border:1px solid transparent; border-radius:4px;
      padding:5px 6px; font-size:13px; color:#1e293b;
      background:transparent; outline:none; cursor:pointer;
      transition:border-color .15s;
    }
    .cell-select:focus { border-color:#3b82f6; background:#fff; }
    .cell-select:hover { background:#f8fafc; }

    .ro-cell { color:#64748b; font-size:12px; padding:4px 8px !important; }

    .action-cell { display:flex; align-items:center; gap:4px; }
    .btn-save, .btn-revert {
      display:flex; align-items:center; justify-content:center;
      width:28px; height:28px; border:none; border-radius:6px; cursor:pointer;
    }
    .btn-save   { background:#0f2b46; color:#fff; }
    .btn-save:hover   { background:#1e3a5f; }
    .btn-save:disabled   { opacity:.5; cursor:not-allowed; }
    .btn-revert { background:#f1f5f9; color:#64748b; }
    .btn-revert:hover   { background:#e2e8f0; }
    .btn-revert:disabled { opacity:.5; cursor:not-allowed; }
    .btn-save mat-icon, .btn-revert mat-icon { font-size:16px; width:16px; height:16px; }
    .saved-icon { color:#22c55e; font-size:20px; width:20px; height:20px; }
    .err-dot {
      display:inline-flex; align-items:center; justify-content:center;
      width:20px; height:20px; border-radius:50%;
      background:#ef4444; color:#fff; font-size:12px; font-weight:700; cursor:help;
    }

    .chk-wrap { display:flex; align-items:center; justify-content:center; gap:4px; cursor:pointer; }
    .chk-wrap input[type=checkbox] { width:15px; height:15px; cursor:pointer; accent-color:#0f2b46; }
    .chk-label  { font-size:12px; color:#64748b; }
    .badge-yes  { font-size:11px; font-weight:600; color:#15803d; background:#dcfce7; border-radius:3px; padding:1px 6px; }
    .badge-no   { font-size:11px; font-weight:600; color:#b91c1c; background:#fee2e2; border-radius:3px; padding:1px 6px; }
    .scoa-leaf  { cursor:default; border-bottom:1px dashed #a78bfa; }
    .scoa-leaf:hover { background:#faf5ff; }

    /* SCOA Function inline picker */
    .fn-cell { padding:0 !important; position:relative; min-width:200px; }
    .fn-trigger { display:flex; align-items:center; gap:4px; padding:5px 7px; cursor:pointer; min-height:30px; }
    .fn-trigger:hover { background:#f5f3ff; }
    .fn-placeholder { color:#a78bfa; font-size:12px; font-style:italic; flex:1; }
    .fn-arrow { font-size:16px; width:16px; height:16px; color:#7c3aed; transition:transform .15s; margin-left:auto; }
    .fn-arrow--open { transform:rotate(180deg); }
    .fn-clear { font-size:14px; width:14px; height:14px; color:#94a3b8; cursor:pointer; }
    .fn-clear:hover { color:#ef4444; }
    .it-search-wrap { display:flex; align-items:center; gap:6px; padding:6px 8px; border-bottom:1px solid #e2e8f0; background:#fff; border-radius:8px 8px 0 0; }
    .it-search-icon { font-size:16px; width:16px; height:16px; color:#94a3b8; flex-shrink:0; }
    .it-search-input { flex:1; border:none; outline:none; font-size:12px; color:#334155; background:transparent; min-width:0; }
    .it-search-clear { font-size:15px; width:15px; height:15px; color:#94a3b8; cursor:pointer; flex-shrink:0; }
    .it-search-clear:hover { color:#64748b; }
    .fn-panel {
      position:absolute; top:100%; left:0; z-index:200;
      width:280px; background:#fff; border:1px solid #e2e8f0;
      border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,.12);
    }
    .fn-nav { display:flex; align-items:center; gap:8px; padding:6px 8px; border-bottom:1px solid #f1f5f9; background:#f8fafc; border-radius:8px 8px 0 0; }
    .fn-back { display:flex; align-items:center; gap:4px; border:none; background:none; color:#7c3aed; cursor:pointer; font-size:12px; padding:0; }
    .fn-back mat-icon { font-size:15px; width:15px; height:15px; }
    .fn-nav-path { font-size:11px; color:#94a3b8; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .fn-loading { padding:12px; text-align:center; color:#94a3b8; font-size:12px; }
    .fn-items { max-height:220px; overflow-y:auto; }
    .fn-item { display:flex; align-items:center; justify-content:space-between; padding:7px 10px; cursor:pointer; font-size:12px; color:#374151; }
    .fn-item:hover { background:#f5f3ff; }
    .fn-item--leaf { color:#7c3aed; font-weight:500; }
    .fn-item--leaf:hover { background:#ede9fe; }
    .fn-item mat-icon { font-size:15px; width:15px; height:15px; color:#a78bfa; flex-shrink:0; }
    .fn-code { color:#94a3b8; font-size:11px; }
    .fn-empty { padding:12px; text-align:center; color:#94a3b8; font-size:12px; }

    .req { color:#ef4444; font-size:10px; }
    .ro-badge { font-size:9px; font-weight:400; text-transform:none; background:rgba(0,0,0,.08); border-radius:3px; padding:1px 4px; letter-spacing:0; }
    .fy-badge { display:inline-block; font-size:12px; font-weight:600; color:#1d4ed8; background:#eff6ff; border:1px solid #bfdbfe; border-radius:5px; padding:3px 8px; white-space:nowrap; }
    .mono { font-family:'Courier New',monospace; }

    .empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px; color:#94a3b8; }
    .empty-state mat-icon { font-size:48px; width:48px; height:48px; margin-bottom:12px; }
    .loading-state { display:flex; align-items:center; justify-content:center; gap:12px; padding:60px; color:#64748b; }
    @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
    .spin { animation:spin 1.2s linear infinite; }
  `]
})
export class ProjectBudgetsGridPage implements OnInit {
  loading = true;
  bgLoading = false;
  totalItems = 0;
  allProjects: ProjectItem[] = [];
  rows: EditRow[] = [];
  departments: Department[] = [];
  financialYears: FinancialYear[] = [];
  activeFinancialYear = '';
  selectedFy = '';
  budgetTypes: BudgetTypeOption[] = [];
  typeStrToVal: Record<string, number> = {};
  budgetSplitOptions: { id: number; desc: string; divideBy: number }[] = [];

  pageSize = 500;
  pageIndex = 0;
  get pagedRows(): EditRow[] {
    const start = this.pageIndex * this.pageSize;
    return this.rows.slice(start, start + this.pageSize);
  }
  get totalPages(): number { return Math.ceil(this.rows.length / this.pageSize); }
  prevPage() { if (this.pageIndex > 0) { this.pageIndex--; this.cdr.markForCheck(); } }
  nextPage() { if (this.pageIndex < this.totalPages - 1) { this.pageIndex++; this.cdr.markForCheck(); } }

  search = '';
  filterDept = 0;
  filterType = '';
  filterStatus = '';
  filterScoaItem = '';
  filterScoaProject = '';
  filterScoaFunction = '';
  filterScoaFund = '';
  filterScoaRegion = '';
  filterScoaCosting = '';

  statusOptions    = STATUS_OPTIONS;
  smOptions        = SINGLE_MULTI_OPTIONS;
  showCaptureDialog = false;

  get dirtyCount() { return this.rows.filter(r => this.isDirty(r)).length; }
  get anySaving()  { return this.rows.some(r => r.saving); }
  get existingProjectNamesForFY(): string[] {
    return this.allProjects
      .filter(p => (p.financialYear || this.activeFinancialYear) === this.activeFinancialYear)
      .map(p => (p.projectName || '').trim())
      .filter(Boolean);
  }

  // ── SCOA Function shared drill-down state ────────────────────────────
  fnDrillActiveRow: EditRow | null = null;
  fnDrillItems: any[] = [];
  fnDrillHistory: any[][] = [];
  fnDrillPath: any[] = [];
  fnDrillLoading = false;
  fnDrillSearch = '';
  fnDrillSearchMode = false;
  private fnDrillSearchTimer: any = null;

  get fnPathLabel(): string {
    return this.fnDrillPath.map(n => n.scoaShortDesc || n.scoaDesc).join(' › ');
  }

  // ── SCOA Fund shared drill-down state ────────────────────────────────
  fdDrillActiveRow: EditRow | null = null;
  fdDrillItems: any[] = [];
  fdDrillHistory: any[][] = [];
  fdDrillPath: any[] = [];
  fdDrillLoading = false;
  fdDrillSearch = '';
  fdDrillSearchMode = false;
  private fdDrillSearchTimer: any = null;

  get fdPathLabel(): string {
    return this.fdDrillPath.map(n => n.scoaShortDesc || n.scoaDesc).join(' › ');
  }

  // ── SCOA Region shared drill-down state ──────────────────────────────
  rgDrillActiveRow: EditRow | null = null;
  rgDrillItems: any[] = [];
  rgDrillHistory: any[][] = [];
  rgDrillPath: any[] = [];
  rgDrillLoading = false;
  rgDrillSearch = '';
  rgDrillSearchMode = false;
  private rgDrillSearchTimer: any = null;

  get rgPathLabel(): string {
    return this.rgDrillPath.map(n => n.scoaShortDesc || n.scoaDesc).join(' › ');
  }

  // ── SCOA Costing shared drill-down state ─────────────────────────────
  coDrillActiveRow: EditRow | null = null;
  coDrillItems: any[] = [];
  coDrillHistory: any[][] = [];
  coDrillPath: any[] = [];
  coDrillLoading = false;
  coDrillSearch = '';
  coDrillSearchMode = false;
  private coDrillSearchTimer: any = null;

  get coPathLabel(): string {
    return this.coDrillPath.map(n => n.scoaShortDesc || n.scoaDesc).join(' › ');
  }

  // ── SCOA Item shared drill-down state ────────────────────────────────
  itDrillActiveRow: EditRow | null = null;
  itDrillItems: any[] = [];
  itDrillHistory: any[][] = [];
  itDrillPath: any[] = [];
  itDrillLoading = false;
  itDrillSearch = '';
  itDrillSearchMode = false;
  private itDrillSearchTimer: any = null;

  get itPathLabel(): string {
    return this.itDrillPath.map(n => n.scoaShortDesc || n.scoaDesc).join(' › ');
  }

  // ── Municipal Classification drill-down state ─────────────────────────
  munDrillActiveRow: EditRow | null = null;
  munDrillItems: any[] = [];
  munDrillHistory: any[][] = [];
  munDrillPath: any[] = [];
  munDrillLoading = false;

  // ── Project Item autocomplete state ──────────────────────────────────────
  piActiveRow: EditRow | null = null;
  piAllItems: any[] = [];
  piFiltered: any[] = [];
  piLoaded = false;

  get munPathLabel(): string {
    return this.munDrillPath.map(n => n.label || n.code || '').filter(Boolean).join(' › ');
  }

  constructor(private api: ApiService, private consts: ConstantsApiService,
              private http: HttpClient, private cdr: ChangeDetectorRef, private router: Router,
              private activeYearSvc: ActiveYearService) {
    this.activeFinancialYear = this.activeYearSvc.activeYear?.yearCode ?? '';
    this.selectedFy = this.activeFinancialYear;
  }

  ngOnInit() {
    this.api.getDepartments().subscribe(d => { this.departments = d; this.cdr.markForCheck(); });
    this.api.getFinancialYears().subscribe(fys => { this.financialYears = fys; this.cdr.markForCheck(); });
    // Load budget types from Const_PlanCapitalOperationalTypes_sys (TypeValue = CapitalOperation)
    this.consts.getPlanCapitalOperationalTypes().subscribe((types: any[]) => {
      this.budgetTypes = types
        .filter((t: any) => t.enabled !== false)
        .sort((a: any, b: any) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99))
        .map((t: any) => ({ label: t.typeName, value: t.typeValue }));
      // Build reverse map: TypeName → TypeValue
      this.typeStrToVal = {};
      for (const bt of this.budgetTypes) this.typeStrToVal[bt.label] = bt.value;
      // Re-run filters, clearing cached rows so toRow() is called fresh with new typeStrToVal
      if (this.allProjects.length) { this.rows = []; this.applyFilters(); }
      this.cdr.markForCheck();
    });
    this.consts.getBudgetSplitOptions().subscribe((opts: any[]) => {
      this.budgetSplitOptions = opts.map((o: any) => ({
        id: o.divideBy_ID, desc: o.budgetSplitDesc, divideBy: o.divideBy_ID
      }));
      this.cdr.markForCheck();
    });
    this.loadProjectsProgressively(this.selectedFy);
  }

  private loadProjectsProgressively(finYear: string): void {
    this.allProjects = [];
    this.totalItems = 0;
    this.loading = true;
    this.bgLoading = false;
    this.pageIndex = 0;
    this.fetchPage(finYear, 0);
  }

  private fetchPage(finYear: string, skip: number): void {
    const take = 500;
    this.api.getProjects(undefined, undefined, finYear, skip, take).subscribe(resp => {
      this.allProjects = [...this.allProjects, ...resp.items];
      this.totalItems = resp.total;
      if (this.loading) {
        this.loading = false;
      }
      this.applyFilters();
      this.cdr.markForCheck();
      const nextSkip = skip + take;
      if (nextSkip < resp.total) {
        this.bgLoading = true;
        this.fetchPage(finYear, nextSkip);
      } else {
        this.bgLoading = false;
        this.cdr.markForCheck();
      }
    }, () => {
      // On any HTTP error stop background loading gracefully; grid keeps data already loaded
      this.loading = false;
      this.bgLoading = false;
      this.cdr.markForCheck();
    });
  }

  private toRow(p: ProjectItem): EditRow {
    return {
      original: p,
      projectName:       p.projectName || '',
      description:       p.description || '',
      typeVal:           this.typeStrToVal[p.type] ?? null,
      statusVal:         STATUS_STR_TO_ID[p.status] ?? null,
      departmentId:      p.departmentId ?? null,
      ward:              p.ward || '',
      gpsCoordinates:    p.gpsCoordinates || '',
      projectManager:    p.projectManager || '',
      contractorName:    p.contractorName || '',
      contractNumber:    p.contractNumber || '',
      fundingSource:     p.fundingSource || '',
      startDate:         p.startDate ? p.startDate.split('T')[0] : '',
      endDate:           p.endDate   ? p.endDate.split('T')[0]   : '',
      totalProjectCost:  p.totalProjectCost ?? '',
      isRegistered:      p.isRegistered ?? false,
      financialYear:     p.financialYear || this.activeFinancialYear,
      singleMultiYear:   p.singleMultiYear || '',
      projectTypeName:   p.projectTypeName || '',
      costingProject:    p.costingProject ?? false,
      scoaFunctionId:       p.scoaFunctionId ?? null,
      scoaFunctionRecordId: p.scoaFunctionRecordId ?? null,
      scoaFunctionLabel:    p.scoaFunction ?? null,
      scoaFunctionPath:     p.scoaFunctionPath ?? null,
      scoaFunctionNtId:     p.scoaFunctionNtId ?? null,
      scoaFundId:           p.scoaFundId ?? null,
      scoaFundRecordId:     p.scoaFundRecordId ?? null,
      scoaFundLabel:        p.scoaFund ?? null,
      scoaFundPath:         p.scoaFundPath ?? null,
      scoaFundNtId:         p.scoaFundNtId ?? null,
      scoaRegionId:         p.scoaRegionId ?? null,
      scoaRegionRecordId:   p.scoaRegionRecordId ?? null,
      scoaRegionLabel:      p.scoaRegion ?? null,
      scoaRegionPath:       p.scoaRegionPath ?? null,
      scoaRegionNtId:       p.scoaRegionNtId ?? null,
      scoaCostingId:        p.scoaCostingId ?? null,
      scoaCostingRecordId:  p.scoaCostingRecordId ?? null,
      scoaCostingLabel:     p.scoaCosting ?? null,
      scoaCostingPath:      p.scoaCostingPath ?? null,
      scoaCostingNtId:      p.scoaCostingNtId ?? null,
      planProjectItemCode:  p.planProjectItemCode ?? null,
      scoaItemId:           p.scoaItemId ?? null,
      scoaItemRecordId:     p.scoaItemRecordId ?? null,
      scoaItemLabel:        p.scoaItem ?? null,
      scoaItemPath:         p.scoaItemPath ?? null,
      scoaItemCode:         p.scoaItemCode ?? null,
      scoaItemNtId:         p.scoaItemNtId ?? null,
      munClassId:           p.municipalClassificationId ?? null,
      munClassLabel:        p.municipalClassification ?? null,
      munClassPath:         p.municipalClassificationPath ?? null,
      projectItemId:        p.projectItemId ?? null,
      projectItemText:      p.projectItem ?? '',
      creditDebit:          p.creditDebit ?? null,
      isActiveForScm:       p.isActiveForScm ?? false,
      year1: p.totalBudgetYear1 ?? 0,
      year2: p.totalBudgetYear2 ?? 0,
      year3: p.totalBudgetYear3 ?? 0,
      budgetSplitId: p.budgetSplitId ?? 12,
      m01: p.month01 != null ? String(p.month01) : '',
      m02: p.month02 != null ? String(p.month02) : '',
      m03: p.month03 != null ? String(p.month03) : '',
      m04: p.month04 != null ? String(p.month04) : '',
      m05: p.month05 != null ? String(p.month05) : '',
      m06: p.month06 != null ? String(p.month06) : '',
      m07: p.month07 != null ? String(p.month07) : '',
      m08: p.month08 != null ? String(p.month08) : '',
      m09: p.month09 != null ? String(p.month09) : '',
      m10: p.month10 != null ? String(p.month10) : '',
      m11: p.month11 != null ? String(p.month11) : '',
      m12: p.month12 != null ? String(p.month12) : '',
      grapClassification:     p.grapClassification     ?? '',
      grapClassificationNote: p.grapClassificationNote ?? '',
      mainSegmentReporting:   p.mainSegmentReporting   ?? '',
      subSegmentReporting:    p.subSegmentReporting    ?? '',
      planProjectItemId:      p.planProjectItemId      ?? null,
      saving: false,
      saved:  false,
      error:  null
    };
  }

  applyFilters() {
    const q = this.search.toLowerCase();
    const qs   = this.filterScoaItem.toLowerCase();
    const qsPr = this.filterScoaProject.toLowerCase();
    const qsFn = this.filterScoaFunction.toLowerCase();
    const qsFd = this.filterScoaFund.toLowerCase();
    const qsRg = this.filterScoaRegion.toLowerCase();
    const qsCo = this.filterScoaCosting.toLowerCase();
    const fType   = this.filterType   ? Number(this.filterType)   : null;
    const fStatus = this.filterStatus ? Number(this.filterStatus) : null;

    const filtered = this.allProjects.filter(p => {
      if (this.selectedFy && p.financialYear !== this.selectedFy) return false;
      if (this.filterDept && p.departmentId !== this.filterDept) return false;
      if (fType   !== null && (this.typeStrToVal[p.type] ?? null) !== fType) return false;
      if (fStatus !== null && STATUS_STR_TO_ID[p.status] !== fStatus) return false;
      if (q && !p.projectCode.toLowerCase().includes(q) &&
          !p.projectName.toLowerCase().includes(q) &&
          !(p.planProjectItemCode != null ? String(p.planProjectItemCode) : '').includes(q)) return false;
      if (qs && !(p.scoaItemCode ?? '').toLowerCase().includes(qs) &&
                !(p.scoaItemDesc ?? '').toLowerCase().includes(qs) &&
                !(p.scoaItemNtId ?? '').toLowerCase().includes(qs)) return false;
      if (qsPr && !(p.scoaProject ?? '').toLowerCase().includes(qsPr) &&
                  !(p.scoaProjectDesc ?? '').toLowerCase().includes(qsPr) &&
                  !(p.scoaProjectNtId ?? '').toLowerCase().includes(qsPr)) return false;
      if (qsFn && !(p.scoaFunction ?? '').toLowerCase().includes(qsFn) &&
                  !(p.scoaFunctionDesc ?? '').toLowerCase().includes(qsFn) &&
                  !(p.scoaFunctionNtId ?? '').toLowerCase().includes(qsFn)) return false;
      if (qsFd && !(p.scoaFund ?? '').toLowerCase().includes(qsFd) &&
                  !(p.scoaFundDesc ?? '').toLowerCase().includes(qsFd) &&
                  !(p.scoaFundNtId ?? '').toLowerCase().includes(qsFd)) return false;
      if (qsRg && !(p.scoaRegion ?? '').toLowerCase().includes(qsRg) &&
                  !(p.scoaRegionDesc ?? '').toLowerCase().includes(qsRg) &&
                  !(p.scoaRegionNtId ?? '').toLowerCase().includes(qsRg)) return false;
      if (qsCo && !(p.scoaCosting ?? '').toLowerCase().includes(qsCo) &&
                  !(p.scoaCostingDesc ?? '').toLowerCase().includes(qsCo) &&
                  !(p.scoaCostingNtId ?? '').toLowerCase().includes(qsCo)) return false;
      return true;
    });

    const existingMap = new Map(this.rows.map(r => [r.original.id, r]));
    this.rows = filtered.map(p => existingMap.get(p.id) ?? this.toRow(p));
    this.pageIndex = 0;
  }

  clearFilters() {
    this.search = ''; this.filterDept = 0; this.filterType = ''; this.filterStatus = '';
    this.filterScoaItem = ''; this.filterScoaProject = ''; this.filterScoaFunction = '';
    this.filterScoaFund = ''; this.filterScoaRegion = ''; this.filterScoaCosting = '';
    this.applyFilters();
  }

  onFyChange() {
    this.rows = [];
    this.cdr.markForCheck();
    this.loadProjectsProgressively(this.selectedFy);
  }

  monthSum(r: EditRow): number {
    return [r.m01, r.m02, r.m03, r.m04, r.m05, r.m06,
            r.m07, r.m08, r.m09, r.m10, r.m11, r.m12]
      .reduce((s, v) => s + (v !== '' && v != null ? parseFloat(v) : 0), 0);
  }

  get totalsRow() {
    const pm = (v: string | number | null | undefined) =>
      v !== '' && v != null ? parseFloat(v as any) : 0;
    const sum = (vals: number[]) => vals.reduce((a, b) => a + b, 0);
    return {
      y1:   sum(this.rows.map(r => r.year1  ?? 0)),
      y2:   sum(this.rows.map(r => r.year2  ?? 0)),
      y3:   sum(this.rows.map(r => r.year3  ?? 0)),
      m01:  sum(this.rows.map(r => pm(r.m01))),
      m02:  sum(this.rows.map(r => pm(r.m02))),
      m03:  sum(this.rows.map(r => pm(r.m03))),
      m04:  sum(this.rows.map(r => pm(r.m04))),
      m05:  sum(this.rows.map(r => pm(r.m05))),
      m06:  sum(this.rows.map(r => pm(r.m06))),
      m07:  sum(this.rows.map(r => pm(r.m07))),
      m08:  sum(this.rows.map(r => pm(r.m08))),
      m09:  sum(this.rows.map(r => pm(r.m09))),
      m10:  sum(this.rows.map(r => pm(r.m10))),
      m11:  sum(this.rows.map(r => pm(r.m11))),
      m12:  sum(this.rows.map(r => pm(r.m12))),
      mTot: sum(this.rows.map(r => this.monthSum(r))),
    };
  }

  markDirty(_r: EditRow) { this.cdr.markForCheck(); }

  yr1Changed(r: EditRow) {
    if (r.budgetSplitId != null) this.applyBudgetSplit(r);
    else this.cdr.markForCheck();
  }

  private signError(r: EditRow): string | null {
    const vals = [
      r.year1 ?? 0, r.year2 ?? 0, r.year3 ?? 0,
      ...[r.m01,r.m02,r.m03,r.m04,r.m05,r.m06,r.m07,r.m08,r.m09,r.m10,r.m11,r.m12]
        .map(v => parseFloat(v as any) || 0)
    ].filter(v => v !== 0);
    if (vals.length === 0) return null;
    const hasPos = vals.some(v => v > 0);
    const hasNeg = vals.some(v => v < 0);
    return (hasPos && hasNeg)
      ? 'Mixed signs: year and month amounts must all be positive or all be negative.'
      : null;
  }

  applyBudgetSplit(r: EditRow) {
    const opt = this.budgetSplitOptions.find(o => o.id === r.budgetSplitId);
    if (!opt || opt.divideBy === 1) { this.cdr.markForCheck(); return; } // Manually — no auto-fill
    const total = Math.floor(r.year1 ?? 0); // whole numbers only
    const base  = Math.floor(total / opt.divideBy);
    const last  = total - base * (opt.divideBy - 1); // absorbs remainder
    if (opt.divideBy === 12) {
      // Monthly: equal whole amounts, last month absorbs remainder
      const months = Array(12).fill(String(base));
      months[11] = String(last);
      [r.m01,r.m02,r.m03,r.m04,r.m05,r.m06,r.m07,r.m08,r.m09,r.m10,r.m11,r.m12] = months;
    } else if (opt.divideBy === 4) {
      // Quarterly: end of each quarter (M03, M06, M09, M12)
      const q = Array(12).fill('0');
      q[2] = String(base); q[5] = String(base); q[8] = String(base); q[11] = String(last);
      [r.m01,r.m02,r.m03,r.m04,r.m05,r.m06,r.m07,r.m08,r.m09,r.m10,r.m11,r.m12] = q;
    } else if (opt.divideBy === 2) {
      // Bi-Annually: end of each half (M06, M12)
      const h = Array(12).fill('0');
      h[5] = String(base); h[11] = String(last);
      [r.m01,r.m02,r.m03,r.m04,r.m05,r.m06,r.m07,r.m08,r.m09,r.m10,r.m11,r.m12] = h;
    }
    this.cdr.markForCheck();
  }

  isDirty(r: EditRow): boolean {
    const p = r.original;
    return r.projectName     !== (p.projectName     || '')  ||
           r.description     !== (p.description     || '')  ||
           r.typeVal         !== (this.typeStrToVal[p.type] ?? null) ||
           r.statusVal       !== (STATUS_STR_TO_ID[p.status] ?? null) ||
           r.departmentId    !== (p.departmentId ?? null)  ||
           r.ward            !== (p.ward            || '')  ||
           r.gpsCoordinates  !== (p.gpsCoordinates  || '')  ||
           r.projectManager  !== (p.projectManager  || '')  ||
           r.contractorName  !== (p.contractorName  || '')  ||
           r.contractNumber  !== (p.contractNumber  || '')  ||
           r.fundingSource   !== (p.fundingSource   || '')  ||
           r.startDate       !== (p.startDate ? p.startDate.split('T')[0] : '') ||
           r.endDate         !== (p.endDate   ? p.endDate.split('T')[0]   : '') ||
           String(r.totalProjectCost) !== String(p.totalProjectCost ?? '') ||
           r.isRegistered    !== (p.isRegistered  ?? false) ||
           r.singleMultiYear !== (p.singleMultiYear || '')  ||
           r.projectTypeName !== (p.projectTypeName || '')  ||
           r.costingProject  !== (p.costingProject  ?? false) ||
           r.scoaFunctionId  !== (p.scoaFunctionId  ?? null) ||
           r.scoaFundId      !== (p.scoaFundId      ?? null) ||
           r.scoaRegionId    !== (p.scoaRegionId    ?? null) ||
           r.scoaCostingId   !== (p.scoaCostingId   ?? null) ||
           r.scoaItemId      !== (p.scoaItemId      ?? null) ||
           r.munClassId      !== (p.municipalClassificationId ?? null) ||
           r.projectItemId   !== (p.projectItemId   ?? null) ||
           r.projectItemText !== (p.projectItem     ?? '')   ||
           r.isActiveForScm  !== (p.isActiveForScm  ?? false) ||
           r.year1 !== (p.totalBudgetYear1 ?? 0) ||
           r.year2 !== (p.totalBudgetYear2 ?? 0) ||
           r.year3 !== (p.totalBudgetYear3 ?? 0) ||
           r.budgetSplitId !== (p.budgetSplitId ?? null) ||
           r.m01 !== (p.month01 != null ? String(p.month01) : '') ||
           r.m02 !== (p.month02 != null ? String(p.month02) : '') ||
           r.m03 !== (p.month03 != null ? String(p.month03) : '') ||
           r.m04 !== (p.month04 != null ? String(p.month04) : '') ||
           r.m05 !== (p.month05 != null ? String(p.month05) : '') ||
           r.m06 !== (p.month06 != null ? String(p.month06) : '') ||
           r.m07 !== (p.month07 != null ? String(p.month07) : '') ||
           r.m08 !== (p.month08 != null ? String(p.month08) : '') ||
           r.m09 !== (p.month09 != null ? String(p.month09) : '') ||
           r.m10 !== (p.month10 != null ? String(p.month10) : '') ||
           r.m11 !== (p.month11 != null ? String(p.month11) : '') ||
           r.m12 !== (p.month12 != null ? String(p.month12) : '') ||
           r.grapClassification     !== (p.grapClassification     ?? '') ||
           r.grapClassificationNote !== (p.grapClassificationNote ?? '') ||
           r.mainSegmentReporting   !== (p.mainSegmentReporting   ?? '') ||
           r.subSegmentReporting    !== (p.subSegmentReporting    ?? '');
  }

  revertRow(r: EditRow) {
    const fresh = this.toRow(r.original);
    Object.assign(r, fresh);
    r.error = null;
    this.cdr.markForCheck();
  }

  saveRow(r: EditRow) {
    r.saving = true; r.error = null;
    // Derive Credit/Debit from sign of Year 1 amount — no longer user-editable
    r.creditDebit = (r.year1 ?? 0) < 0 ? 'C' : 'D';
    // Sign consistency check — all non-zero amounts must share the same sign
    const signErr = this.signError(r);
    if (signErr) { r.saving = false; r.error = signErr; this.cdr.markForCheck(); return; }
    const payload: any = {
      ProjectName:      r.projectName     || null,
      Description:      r.description     || null,
      Type:             r.typeVal,
      Status:           r.statusVal,
      DepartmentId:     r.departmentId    ?? null,
      Ward:             r.ward            || null,
      GpsCoordinates:   r.gpsCoordinates  || null,
      ProjectManager:   r.projectManager  || null,
      ContractorName:   r.contractorName  || null,
      ContractNumber:   r.contractNumber  || null,
      FundingSource:    r.fundingSource   || null,
      StartDate:        r.startDate       || null,
      EndDate:          r.endDate         || null,
      TotalProjectCost: r.totalProjectCost !== '' ? Number(r.totalProjectCost) : null,
      IsRegistered:     r.isRegistered,
      FinancialYear:    r.financialYear    || null,
      SingleMultiYear:  r.singleMultiYear  || null,
      ProjectTypeName:  r.projectTypeName  || null,
      CostingProject:   r.costingProject,
      IsActiveForScm:   r.isActiveForScm
    };
    this.api.updateProject(r.original.id, payload).subscribe({
      next: () => {
        const typeLabel   = this.budgetTypes.find(t => t.value === r.typeVal)?.label ?? r.original.type;
        const statusLabel = STATUS_OPTIONS.find(s => s.value === r.statusVal)?.label ?? r.original.status;

        const fnChanged = r.scoaFunctionId  !== (r.original.scoaFunctionId  ?? null);
        const fdChanged = r.scoaFundId      !== (r.original.scoaFundId      ?? null);
        const rgChanged = r.scoaRegionId    !== (r.original.scoaRegionId    ?? null);
        const coChanged = r.scoaCostingId   !== (r.original.scoaCostingId   ?? null);
        const itChanged = r.scoaItemId      !== (r.original.scoaItemId      ?? null);
        const cdChanged  = r.creditDebit     !== (r.original.creditDebit     ?? null);
        const mcChanged  = r.munClassId      !== (r.original.municipalClassificationId ?? null);
        const piChanged  = r.projectItemId   !== (r.original.projectItemId   ?? null) ||
                           r.projectItemText !== (r.original.projectItem      ?? '');
        const gsChanged  = r.grapClassification     !== (r.original.grapClassification     ?? '') ||
                           r.grapClassificationNote !== (r.original.grapClassificationNote ?? '') ||
                           r.mainSegmentReporting   !== (r.original.mainSegmentReporting   ?? '') ||
                           r.subSegmentReporting    !== (r.original.subSegmentReporting    ?? '');
        const mnChanged  = r.m01 !== (r.original.month01 != null ? String(r.original.month01) : '') ||
                           r.m02 !== (r.original.month02 != null ? String(r.original.month02) : '') ||
                           r.m03 !== (r.original.month03 != null ? String(r.original.month03) : '') ||
                           r.m04 !== (r.original.month04 != null ? String(r.original.month04) : '') ||
                           r.m05 !== (r.original.month05 != null ? String(r.original.month05) : '') ||
                           r.m06 !== (r.original.month06 != null ? String(r.original.month06) : '') ||
                           r.m07 !== (r.original.month07 != null ? String(r.original.month07) : '') ||
                           r.m08 !== (r.original.month08 != null ? String(r.original.month08) : '') ||
                           r.m09 !== (r.original.month09 != null ? String(r.original.month09) : '') ||
                           r.m10 !== (r.original.month10 != null ? String(r.original.month10) : '') ||
                           r.m11 !== (r.original.month11 != null ? String(r.original.month11) : '') ||
                           r.m12 !== (r.original.month12 != null ? String(r.original.month12) : '');
        const yrChanged  = r.year1 !== (r.original.totalBudgetYear1 ?? 0) ||
                           r.year2 !== (r.original.totalBudgetYear2 ?? 0) ||
                           r.year3 !== (r.original.totalBudgetYear3 ?? 0) ||
                           r.budgetSplitId !== (r.original.budgetSplitId ?? null);

        const commitRow = () => {
          r.saving = false; r.saved = true; r.error = null;
          r.original = {
            ...r.original,
            projectName:    r.projectName,
            description:    r.description,
            type:           typeLabel,
            status:         statusLabel,
            departmentId:   r.departmentId,
            ward:           r.ward            || null,
            gpsCoordinates: r.gpsCoordinates  || null,
            projectManager: r.projectManager  || null,
            contractorName: r.contractorName  || null,
            contractNumber: r.contractNumber  || null,
            fundingSource:  r.fundingSource   || null,
            startDate:      r.startDate       || null,
            endDate:        r.endDate         || null,
            totalProjectCost: r.totalProjectCost !== '' ? Number(r.totalProjectCost) : null,
            isRegistered:   r.isRegistered,
            financialYear:  r.financialYear   || null,
            singleMultiYear: r.singleMultiYear || null,
            projectTypeName: r.projectTypeName || null,
            costingProject: r.costingProject,
            scoaFunctionId: r.scoaFunctionId,
            scoaFunctionRecordId: r.scoaFunctionRecordId,
            scoaFunction:   r.scoaFunctionLabel,
            scoaFunctionPath: r.scoaFunctionPath,
            scoaFundId:     r.scoaFundId,
            scoaFundRecordId: r.scoaFundRecordId,
            scoaFund:       r.scoaFundLabel,
            scoaFundPath:   r.scoaFundPath,
            scoaRegionId:   r.scoaRegionId,
            scoaRegionRecordId: r.scoaRegionRecordId,
            scoaRegion:     r.scoaRegionLabel,
            scoaRegionPath: r.scoaRegionPath,
            scoaCostingId:  r.scoaCostingId,
            scoaCostingRecordId: r.scoaCostingRecordId,
            scoaCosting:    r.scoaCostingLabel,
            scoaCostingPath: r.scoaCostingPath,
            scoaItemId:     r.scoaItemId,
            scoaItemRecordId: r.scoaItemRecordId,
            scoaItem:       r.scoaItemLabel,
            scoaItemPath:   r.scoaItemPath,
            scoaItemCode:   r.scoaItemCode,
            municipalClassificationId: r.munClassId,
            municipalClassification:   r.munClassLabel,
            municipalClassificationPath: r.munClassPath,
            projectItem:    r.projectItemText || null,
            projectItemId:  r.projectItemId,
            creditDebit:    r.creditDebit,
            isActiveForScm: r.isActiveForScm,
            totalBudgetYear1: r.year1,
            totalBudgetYear2: r.year2,
            totalBudgetYear3: r.year3,
            budgetSplitId: r.budgetSplitId,
            month01: r.m01 !== '' ? parseFloat(r.m01 as any) : null,
            month02: r.m02 !== '' ? parseFloat(r.m02 as any) : null,
            month03: r.m03 !== '' ? parseFloat(r.m03 as any) : null,
            month04: r.m04 !== '' ? parseFloat(r.m04 as any) : null,
            month05: r.m05 !== '' ? parseFloat(r.m05 as any) : null,
            month06: r.m06 !== '' ? parseFloat(r.m06 as any) : null,
            month07: r.m07 !== '' ? parseFloat(r.m07 as any) : null,
            month08: r.m08 !== '' ? parseFloat(r.m08 as any) : null,
            month09: r.m09 !== '' ? parseFloat(r.m09 as any) : null,
            month10: r.m10 !== '' ? parseFloat(r.m10 as any) : null,
            month11: r.m11 !== '' ? parseFloat(r.m11 as any) : null,
            month12: r.m12 !== '' ? parseFloat(r.m12 as any) : null,
            grapClassification:     r.grapClassification     || null,
            grapClassificationNote: r.grapClassificationNote || null,
            mainSegmentReporting:   r.mainSegmentReporting   || null,
            subSegmentReporting:    r.subSegmentReporting    || null
          } as any;
          // Re-normalise month values back to strings so isDirty comparison works
          // (type="number" inputs coerce bound values to numbers; isDirty uses String() comparison)
          r.m01 = r.original.month01 != null ? String(r.original.month01) : '';
          r.m02 = r.original.month02 != null ? String(r.original.month02) : '';
          r.m03 = r.original.month03 != null ? String(r.original.month03) : '';
          r.m04 = r.original.month04 != null ? String(r.original.month04) : '';
          r.m05 = r.original.month05 != null ? String(r.original.month05) : '';
          r.m06 = r.original.month06 != null ? String(r.original.month06) : '';
          r.m07 = r.original.month07 != null ? String(r.original.month07) : '';
          r.m08 = r.original.month08 != null ? String(r.original.month08) : '';
          r.m09 = r.original.month09 != null ? String(r.original.month09) : '';
          r.m10 = r.original.month10 != null ? String(r.original.month10) : '';
          r.m11 = r.original.month11 != null ? String(r.original.month11) : '';
          r.m12 = r.original.month12 != null ? String(r.original.month12) : '';
          setTimeout(() => { r.saved = false; this.cdr.markForCheck(); }, 2500);
          this.cdr.markForCheck();
        };
        const failRow = (msg: string) => {
          r.saving = false;
          r.error = msg;
          this.cdr.markForCheck();
        };

        // Save Project Item if changed
        const saveProjectItem = () => {
          if (!piChanged) { saveBudgetAmounts(); return; }
          this.http.patch<any>(`/budget-app/api/projects/${r.original.id}/project-item`, {
            constProjectItemId: r.projectItemId ?? null,
            text: r.projectItemText || null,
            finYear: r.financialYear || null
          }).subscribe({
            next: (res: any) => {
              r.projectItemId = res?.constProjectItemId ?? r.projectItemId;
              saveBudgetAmounts();
            },
            error: (e: any) => failRow(e?.error?.message || 'Failed to save Project Item')
          });
        };

        // Save Year 1/2/3 budget amounts if changed (step before saveMonths)
        const saveBudgetAmounts = () => {
          if (!yrChanged) { saveMonths(); return; }
          this.http.patch(`/budget-app/api/projects/items/${r.original.planProjectItemId}/budget-amounts`, {
            year1: r.year1,
            year2: r.year2,
            year3: r.year3,
            budgetSplitId: r.budgetSplitId ?? null
          }).subscribe({
            next: () => saveMonths(),
            error: (e: any) => failRow(e?.error?.message || 'Failed to save budget amounts')
          });
        };

        // Save GRAP / segment if changed (last step before commitRow)
        const saveGrapSegment = () => {
          if (!gsChanged) { commitRow(); return; }
          this.http.patch(`/budget-app/api/projects/items/${r.original.planProjectItemId}/grap-segment`, {
            grapClassification:     r.grapClassification     || null,
            grapClassificationNote: r.grapClassificationNote || null,
            mainSegmentReporting:   r.mainSegmentReporting   || null,
            subSegmentReporting:    r.subSegmentReporting    || null
          }).subscribe({
            next: () => commitRow(),
            error: (e: any) => failRow(e?.error?.message || 'Failed to save GRAP / Segment fields')
          });
        };

        // Save monthly phasing if changed (step before saveGrapSegment)
        const saveMonths = () => {
          if (!mnChanged) { saveGrapSegment(); return; }
          const mnSum  = this.monthSum(r);
          const year1  = r.year1 ?? 0;
          if (Math.abs(mnSum - year1) > 0.005) {
            failRow(`Month total (${mnSum.toLocaleString()}) must equal Year 1 (${year1.toLocaleString()})`);
            return;
          }
          this.http.patch(`/budget-app/api/projects/items/${r.original.planProjectItemId}/months`, {
            month01: r.m01 !== '' ? parseFloat(r.m01) : null,
            month02: r.m02 !== '' ? parseFloat(r.m02) : null,
            month03: r.m03 !== '' ? parseFloat(r.m03) : null,
            month04: r.m04 !== '' ? parseFloat(r.m04) : null,
            month05: r.m05 !== '' ? parseFloat(r.m05) : null,
            month06: r.m06 !== '' ? parseFloat(r.m06) : null,
            month07: r.m07 !== '' ? parseFloat(r.m07) : null,
            month08: r.m08 !== '' ? parseFloat(r.m08) : null,
            month09: r.m09 !== '' ? parseFloat(r.m09) : null,
            month10: r.m10 !== '' ? parseFloat(r.m10) : null,
            month11: r.m11 !== '' ? parseFloat(r.m11) : null,
            month12: r.m12 !== '' ? parseFloat(r.m12) : null
          }).subscribe({
            next: () => saveGrapSegment(),
            error: (e: any) => failRow(e?.error?.message || 'Failed to save monthly phasing')
          });
        };

        // Save Municipal Classification if changed (step before saveProjectItem)
        const saveMunClass = () => {
          if (!mcChanged) { saveProjectItem(); return; }
          this.http.patch(`/budget-app/api/projects/items/${r.original.planProjectItemId}/municipal-classification`,
            { divisionId: r.munClassId, label: r.munClassLabel })
            .subscribe({
              next: () => saveProjectItem(),
              error: (e: any) => failRow(e?.error?.message || 'Failed to save Municipal Classification')
            });
        };

        // Save Credit/Debit if changed (called before saveMunClass)
        const saveCreditDebit = () => {
          if (!cdChanged) { saveMunClass(); return; }
          this.http.patch(`/budget-app/api/projects/items/${r.original.planProjectItemId}/credit-debit`, { creditDebit: r.creditDebit })
            .subscribe({
              next: () => saveMunClass(),
              error: (e: any) => failRow(e?.error?.message || 'Failed to save Credit/Debit')
            });
        };

        // Save SCOA Item if changed (called after Costing is done)
        const saveItem = () => {
          if (!itChanged) { ensureProjectItem(); return; }
          if (r.scoaItemId === null) {
            if (r.scoaItemRecordId) {
              this.http.delete(`/budget-app/api/ems/plan-project/plan-project-scoa-item/${r.scoaItemRecordId}`)
                .subscribe({
                  next: () => { r.scoaItemRecordId = null; ensureProjectItem(); },
                  error: (e: any) => failRow(e?.error?.message || 'Failed to clear SCOA Item')
                });
            } else {
              ensureProjectItem();
            }
            return;
          }
          if (r.scoaItemRecordId) {
            this.http.put(`/budget-app/api/ems/plan-project/plan-project-scoa-item/${r.scoaItemRecordId}`, {
              ProjectScoaItem_ID: r.scoaItemRecordId,
              ProjectID: r.original.id,
              ScoaItemID: r.scoaItemId,
              CapturerID: 1,
              DateCaptured: new Date().toISOString()
            }).subscribe({
              next: () => ensureProjectItem(),
              error: (e: any) => failRow(e?.error?.message || 'Failed to update SCOA Item')
            });
          } else {
            this.http.post<any>('/budget-app/api/ems/plan-project/plan-project-scoa-item', {
              ProjectScoaItem_ID: 0,
              ProjectID: r.original.id,
              ScoaItemID: r.scoaItemId,
              CapturerID: 1,
              DateCaptured: new Date().toISOString()
            }).subscribe({
              next: (res: any) => {
                r.scoaItemRecordId = res?.ProjectScoaItem_ID ?? res?.projectScoaItem_ID ?? null;
                ensureProjectItem();
              },
              error: (e: any) => failRow(e?.error?.message || 'Failed to save SCOA Item')
            });
          }
        };

        // Ensure Plan_ProjectItem row exists before any item-level PATCH.
        // If the project has no rows yet, POST to create a stub row first.
        const needsItemRow = cdChanged || mcChanged || piChanged || yrChanged || mnChanged || gsChanged;
        const ensureProjectItem = () => {
          if (!needsItemRow || (r.original.budgetLineCount ?? 0) > 0) { saveCreditDebit(); return; }
          this.http.post(`/budget-app/api/projects/${r.original.id}/ensure-project-item`, {})
            .subscribe({
              next: () => {
                r.original = { ...r.original, budgetLineCount: 1 } as any;
                saveCreditDebit();
              },
              error: (e: any) => failRow(e?.error?.message || 'Failed to initialise project item row')
            });
        };

        // Save SCOA Costing if changed (called after Region is done)
        const saveCosting = () => {
          if (!coChanged) { saveItem(); return; }
          if (r.scoaCostingId === null) {
            if (r.scoaCostingRecordId) {
              this.http.delete(`/budget-app/api/ems/plan-project/plan-project-scoa-costing/${r.scoaCostingRecordId}`)
                .subscribe({
                  next: () => { r.scoaCostingRecordId = null; saveItem(); },
                  error: (e: any) => failRow(e?.error?.message || 'Failed to clear SCOA Costing')
                });
            } else {
              saveItem();
            }
            return;
          }
          if (r.scoaCostingRecordId) {
            this.http.put(`/budget-app/api/ems/plan-project/plan-project-scoa-costing/${r.scoaCostingRecordId}`, {
              ProjectScoaCosting_ID: r.scoaCostingRecordId,
              ProjectID: r.original.id,
              ScoaCostingID: r.scoaCostingId,
              CapturerID: 1,
              DateCaptured: new Date().toISOString()
            }).subscribe({
              next: () => saveItem(),
              error: (e: any) => failRow(e?.error?.message || 'Failed to update SCOA Costing')
            });
          } else {
            this.http.post<any>('/budget-app/api/ems/plan-project/plan-project-scoa-costing', {
              ProjectScoaCosting_ID: 0,
              ProjectID: r.original.id,
              ScoaCostingID: r.scoaCostingId,
              CapturerID: 1,
              DateCaptured: new Date().toISOString()
            }).subscribe({
              next: (res: any) => {
                r.scoaCostingRecordId = res?.ProjectScoaCosting_ID ?? res?.projectScoaCosting_ID ?? null;
                saveItem();
              },
              error: (e: any) => failRow(e?.error?.message || 'Failed to save SCOA Costing')
            });
          }
        };

        // Save SCOA Region if changed (called after Fund is done)
        const saveRegion = () => {
          if (!rgChanged) { saveCosting(); return; }
          if (r.scoaRegionId === null) {
            if (r.scoaRegionRecordId) {
              this.http.delete(`/budget-app/api/ems/plan-project/plan-project-scoa-regions/${r.scoaRegionRecordId}`)
                .subscribe({
                  next: () => { r.scoaRegionRecordId = null; saveCosting(); },
                  error: (e: any) => failRow(e?.error?.message || 'Failed to clear SCOA Region')
                });
            } else {
              saveCosting();
            }
            return;
          }
          if (r.scoaRegionRecordId) {
            this.http.put(`/budget-app/api/ems/plan-project/plan-project-scoa-regions/${r.scoaRegionRecordId}`, {
              ProjectScoaRegion_ID: r.scoaRegionRecordId,
              ProjectID: r.original.id,
              ScoaRegionID: r.scoaRegionId,
              CapturerID: 1,
              DateCaptured: new Date().toISOString()
            }).subscribe({
              next: () => saveCosting(),
              error: (e: any) => failRow(e?.error?.message || 'Failed to update SCOA Region')
            });
          } else {
            this.http.post<any>('/budget-app/api/ems/plan-project/plan-project-scoa-regions', {
              ProjectScoaRegion_ID: 0,
              ProjectID: r.original.id,
              ScoaRegionID: r.scoaRegionId,
              CapturerID: 1,
              DateCaptured: new Date().toISOString()
            }).subscribe({
              next: (res: any) => {
                r.scoaRegionRecordId = res?.ProjectScoaRegion_ID ?? res?.projectScoaRegion_ID ?? null;
                saveCosting();
              },
              error: (e: any) => failRow(e?.error?.message || 'Failed to save SCOA Region')
            });
          }
        };

        // Save SCOA Fund if changed (called after Function is done)
        const saveFund = () => {
          if (!fdChanged) { saveRegion(); return; }
          if (r.scoaFundId === null) {
            if (r.scoaFundRecordId) {
              this.http.delete(`/budget-app/api/ems/plan-project/plan-project-scoa-funds/${r.scoaFundRecordId}`)
                .subscribe({
                  next: () => { r.scoaFundRecordId = null; saveRegion(); },
                  error: (e: any) => failRow(e?.error?.message || 'Failed to clear SCOA Fund')
                });
            } else {
              saveRegion();
            }
            return;
          }
          if (r.scoaFundRecordId) {
            this.http.put(`/budget-app/api/ems/plan-project/plan-project-scoa-funds/${r.scoaFundRecordId}`, {
              ProjectScoaFund_ID: r.scoaFundRecordId,
              ProjectID: r.original.id,
              ScoaFundID: r.scoaFundId,
              CapturerID: 1,
              DateCaptured: new Date().toISOString()
            }).subscribe({
              next: () => saveRegion(),
              error: (e: any) => failRow(e?.error?.message || 'Failed to update SCOA Fund')
            });
          } else {
            this.http.post<any>('/budget-app/api/ems/plan-project/plan-project-scoa-funds', {
              ProjectScoaFund_ID: 0,
              ProjectID: r.original.id,
              ScoaFundID: r.scoaFundId,
              CapturerID: 1,
              DateCaptured: new Date().toISOString()
            }).subscribe({
              next: (res: any) => {
                r.scoaFundRecordId = res?.ProjectScoaFund_ID ?? res?.projectScoaFund_ID ?? null;
                saveRegion();
              },
              error: (e: any) => failRow(e?.error?.message || 'Failed to save SCOA Fund')
            });
          }
        };

        // Save SCOA Function to Plan_ProjectFunctions if changed
        if (!fnChanged) { saveFund(); return; }

        // Null = clear: DELETE existing record if one exists; otherwise no-op
        if (r.scoaFunctionId === null) {
          if (r.scoaFunctionRecordId) {
            this.http.delete(`/budget-app/api/ems/plan-project/plan-projectfunctions/${r.scoaFunctionRecordId}`)
              .subscribe({
                next: () => { r.scoaFunctionRecordId = null; saveFund(); },
                error: (e: any) => failRow(e?.error?.message || 'Failed to clear SCOA Function')
              });
          } else {
            // Function came from Plan_ProjectItem — cannot delete from here; accept as-is
            saveFund();
          }
          return;
        }

        // Set/update: PUT existing record or POST new one
        if (r.scoaFunctionRecordId) {
          this.http.put(`/budget-app/api/ems/plan-project/plan-projectfunctions/${r.scoaFunctionRecordId}`, {
            ProjectFunction_ID: r.scoaFunctionRecordId,
            ProjectID: r.original.id,
            ScoaFunctionID: r.scoaFunctionId,
            CapturerID: 1,
            DateCaptured: new Date().toISOString()
          }).subscribe({
            next: () => saveFund(),
            error: (e: any) => failRow(e?.error?.message || 'Failed to update SCOA Function')
          });
        } else {
          this.http.post<any>('/budget-app/api/ems/plan-project/plan-projectfunctions', {
            ProjectFunction_ID: 0,
            ProjectID: r.original.id,
            ScoaFunctionID: r.scoaFunctionId,
            CapturerID: 1,
            DateCaptured: new Date().toISOString()
          }).subscribe({
            next: (res: any) => {
              r.scoaFunctionRecordId = res?.ProjectFunction_ID ?? res?.projectFunction_ID ?? null;
              saveFund();
            },
            error: (e: any) => failRow(e?.error?.message || 'Failed to save SCOA Function')
          });
        }
      },
      error: (err: any) => {
        r.saving = false;
        r.error = err?.error?.message || err?.message || 'Save failed';
        this.cdr.markForCheck();
      }
    });
  }

  saveAll() {
    this.rows.filter(r => this.isDirty(r)).forEach(r => this.saveRow(r));
  }

  // ── SCOA Function drill-down methods ────────────────────────────────

  @HostListener('document:click')
  closeFnDrill() {
    this.fnDrillActiveRow = null;
    this.fdDrillActiveRow = null;
    this.rgDrillActiveRow = null;
    this.coDrillActiveRow = null;
    this.itDrillActiveRow = null;
    this.cdr.markForCheck();
  }

  private loadFnRoot(r: EditRow) {
    this.fnDrillLoading = true;
    this.fnDrillItems = [];
    this.fnDrillHistory = [];
    this.fnDrillPath = [];
    const fy = r.financialYear || this.activeFinancialYear;
    this.consts.getScoaFunctionConsolidated(true, fy, undefined, true).subscribe({
      next: data => { this.fnDrillItems = data; this.fnDrillLoading = false; this.cdr.markForCheck(); },
      error: () => { this.fnDrillLoading = false; this.cdr.markForCheck(); }
    });
  }

  toggleFnDrill(r: EditRow, event: MouseEvent) {
    event.stopPropagation();
    if (this.fnDrillActiveRow === r) {
      this.fnDrillActiveRow = null;
      this.fnDrillSearch = '';
      this.fnDrillSearchMode = false;
    } else {
      this.fnDrillActiveRow = r;
      this.fnDrillSearch = '';
      this.fnDrillSearchMode = false;
      this.loadFnRoot(r);
    }
    this.cdr.markForCheck();
  }

  onFnSearchChange(r: EditRow) {
    clearTimeout(this.fnDrillSearchTimer);
    const q = this.fnDrillSearch.trim();
    if (!q) { this.fnDrillSearchMode = false; this.loadFnRoot(r); return; }
    this.fnDrillSearchTimer = setTimeout(() => {
      this.fnDrillLoading = true; this.fnDrillSearchMode = true; this.cdr.markForCheck();
      this.consts.searchScoaFunctionConsolidated(q, 80).subscribe({
        next: data => { this.fnDrillItems = data; this.fnDrillLoading = false; this.cdr.markForCheck(); },
        error: () => { this.fnDrillLoading = false; this.cdr.markForCheck(); }
      });
    }, 300);
  }

  clearFnSearch(r: EditRow, event: MouseEvent) {
    event.stopPropagation();
    this.fnDrillSearch = ''; this.fnDrillSearchMode = false; this.loadFnRoot(r); this.cdr.markForCheck();
  }

  private buildFnPath(leafNode: any): string {
    const ancestors = this.fnDrillPath.map(n => n.scoaShortDesc || n.scoaDesc || '').filter(Boolean);
    const leafName = leafNode.scoaShortDesc || leafNode.scoaDesc || '';
    const leaf = leafName && leafNode.scoaCode
      ? `${leafName} (${leafNode.scoaCode})`
      : leafName || leafNode.scoaCode || '';
    return [...ancestors, leaf].filter(Boolean).join(' › ');
  }

  onFnSelect(r: EditRow, node: any, event: MouseEvent) {
    event.stopPropagation();
    if (node.postingLevel === 'Yes') {
      r.scoaFunctionId = node.scoaID;
      r.scoaFunctionLabel = node.scoaShortDesc || node.scoaDesc || node.scoaCode;
      r.scoaFunctionPath = this.buildFnPath(node);
      this.fnDrillActiveRow = null;
      this.cdr.markForCheck();
      return;
    }
    this.fnDrillHistory.push([...this.fnDrillItems]);
    this.fnDrillPath.push(node);
    const fy = r.financialYear || this.activeFinancialYear;
    this.consts.getScoaFunctionConsolidated(true, fy, node.scoaID).subscribe({
      next: children => {
        if (children.length === 0) {
          r.scoaFunctionId = node.scoaID;
          r.scoaFunctionLabel = node.scoaShortDesc || node.scoaDesc || node.scoaCode;
          r.scoaFunctionPath = this.buildFnPath(node);
          this.fnDrillHistory.pop();
          this.fnDrillPath.pop();
          this.fnDrillActiveRow = null;
        } else {
          this.fnDrillItems = children;
        }
        this.cdr.markForCheck();
      },
      error: () => { this.fnDrillHistory.pop(); this.fnDrillPath.pop(); this.cdr.markForCheck(); }
    });
  }

  fnDrillBack(event: MouseEvent) {
    event.stopPropagation();
    if (this.fnDrillHistory.length > 0) {
      this.fnDrillItems = this.fnDrillHistory.pop()!;
      this.fnDrillPath.pop();
      this.cdr.markForCheck();
    }
  }

  clearFnDrill(r: EditRow, event: MouseEvent) {
    event.stopPropagation();
    r.scoaFunctionId = null;
    r.scoaFunctionLabel = null;
    r.scoaFunctionPath = null;
    this.fnDrillActiveRow = null;
    this.fnDrillSearch = '';
    this.fnDrillSearchMode = false;
    this.cdr.markForCheck();
  }

  // ── SCOA Fund drill-down methods ─────────────────────────────────────

  private loadFdRoot(r: EditRow) {
    this.fdDrillLoading = true;
    this.fdDrillItems = [];
    this.fdDrillHistory = [];
    this.fdDrillPath = [];
    const fy = r.financialYear || this.activeFinancialYear;
    this.consts.getScoaFundsConsolidated(true, fy, undefined, undefined, true).subscribe({
      next: data => { this.fdDrillItems = data; this.fdDrillLoading = false; this.cdr.markForCheck(); },
      error: () => { this.fdDrillLoading = false; this.cdr.markForCheck(); }
    });
  }

  toggleFdDrill(r: EditRow, event: MouseEvent) {
    event.stopPropagation();
    if (this.fdDrillActiveRow === r) {
      this.fdDrillActiveRow = null;
      this.fdDrillSearch = '';
      this.fdDrillSearchMode = false;
    } else {
      this.fdDrillActiveRow = r;
      this.fdDrillSearch = '';
      this.fdDrillSearchMode = false;
      this.fnDrillActiveRow = null;
      this.loadFdRoot(r);
    }
    this.cdr.markForCheck();
  }

  onFdSearchChange(r: EditRow) {
    clearTimeout(this.fdDrillSearchTimer);
    const q = this.fdDrillSearch.trim();
    if (!q) { this.fdDrillSearchMode = false; this.loadFdRoot(r); return; }
    this.fdDrillSearchTimer = setTimeout(() => {
      this.fdDrillLoading = true; this.fdDrillSearchMode = true; this.cdr.markForCheck();
      this.consts.searchScoaFundsConsolidated(q, 80).subscribe({
        next: data => { this.fdDrillItems = data; this.fdDrillLoading = false; this.cdr.markForCheck(); },
        error: () => { this.fdDrillLoading = false; this.cdr.markForCheck(); }
      });
    }, 300);
  }

  clearFdSearch(r: EditRow, event: MouseEvent) {
    event.stopPropagation();
    this.fdDrillSearch = ''; this.fdDrillSearchMode = false; this.loadFdRoot(r); this.cdr.markForCheck();
  }

  private buildFdPath(leafNode: any): string {
    const ancestors = this.fdDrillPath.map(n => n.scoaShortDesc || n.scoaDesc || '').filter(Boolean);
    const leafName = leafNode.scoaShortDesc || leafNode.scoaDesc || '';
    const leaf = leafName && leafNode.scoaCode
      ? `${leafName} (${leafNode.scoaCode})`
      : leafName || leafNode.scoaCode || '';
    return [...ancestors, leaf].filter(Boolean).join(' › ');
  }

  onFdSelect(r: EditRow, node: any, event: MouseEvent) {
    event.stopPropagation();
    if (node.postingLevel === 'Yes') {
      r.scoaFundId = node.scoaID;
      r.scoaFundLabel = node.scoaShortDesc || node.scoaDesc || node.scoaCode;
      r.scoaFundPath = this.buildFdPath(node);
      this.fdDrillActiveRow = null;
      this.cdr.markForCheck();
      return;
    }
    this.fdDrillHistory.push([...this.fdDrillItems]);
    this.fdDrillPath.push(node);
    const fy = r.financialYear || this.activeFinancialYear;
    this.consts.getScoaFundsConsolidated(true, fy, undefined, node.scoaID).subscribe({
      next: children => {
        if (children.length === 0) {
          r.scoaFundId = node.scoaID;
          r.scoaFundLabel = node.scoaShortDesc || node.scoaDesc || node.scoaCode;
          r.scoaFundPath = this.buildFdPath(node);
          this.fdDrillHistory.pop();
          this.fdDrillPath.pop();
          this.fdDrillActiveRow = null;
        } else {
          this.fdDrillItems = children;
        }
        this.cdr.markForCheck();
      },
      error: () => { this.fdDrillHistory.pop(); this.fdDrillPath.pop(); this.cdr.markForCheck(); }
    });
  }

  fdDrillBack(event: MouseEvent) {
    event.stopPropagation();
    if (this.fdDrillHistory.length > 0) {
      this.fdDrillItems = this.fdDrillHistory.pop()!;
      this.fdDrillPath.pop();
      this.cdr.markForCheck();
    }
  }

  clearFdDrill(r: EditRow, event: MouseEvent) {
    event.stopPropagation();
    r.scoaFundId = null;
    r.scoaFundLabel = null;
    r.scoaFundPath = null;
    this.fdDrillActiveRow = null;
    this.fdDrillSearch = '';
    this.fdDrillSearchMode = false;
    this.cdr.markForCheck();
  }

  // ── SCOA Region drill-down methods ───────────────────────────────────

  private loadRgRoot(r: EditRow) {
    this.rgDrillLoading = true;
    this.rgDrillItems = [];
    this.rgDrillHistory = [];
    this.rgDrillPath = [];
    const fy = r.financialYear || this.activeFinancialYear;
    this.consts.getScoaRegionalConsolidated(true, fy, undefined, true).subscribe({
      next: data => { this.rgDrillItems = data; this.rgDrillLoading = false; this.cdr.markForCheck(); },
      error: () => { this.rgDrillLoading = false; this.cdr.markForCheck(); }
    });
  }

  toggleRgDrill(r: EditRow, event: MouseEvent) {
    event.stopPropagation();
    if (this.rgDrillActiveRow === r) {
      this.rgDrillActiveRow = null;
      this.rgDrillSearch = '';
      this.rgDrillSearchMode = false;
    } else {
      this.rgDrillActiveRow = r;
      this.rgDrillSearch = '';
      this.rgDrillSearchMode = false;
      this.fnDrillActiveRow = null;
      this.fdDrillActiveRow = null;
      this.loadRgRoot(r);
    }
    this.cdr.markForCheck();
  }

  onRgSearchChange(r: EditRow) {
    clearTimeout(this.rgDrillSearchTimer);
    const q = this.rgDrillSearch.trim();
    if (!q) { this.rgDrillSearchMode = false; this.loadRgRoot(r); return; }
    this.rgDrillSearchTimer = setTimeout(() => {
      this.rgDrillLoading = true; this.rgDrillSearchMode = true; this.cdr.markForCheck();
      this.consts.searchScoaRegionalConsolidated(q, 80).subscribe({
        next: data => { this.rgDrillItems = data; this.rgDrillLoading = false; this.cdr.markForCheck(); },
        error: () => { this.rgDrillLoading = false; this.cdr.markForCheck(); }
      });
    }, 300);
  }

  clearRgSearch(r: EditRow, event: MouseEvent) {
    event.stopPropagation();
    this.rgDrillSearch = ''; this.rgDrillSearchMode = false; this.loadRgRoot(r); this.cdr.markForCheck();
  }

  private buildRgPath(leafNode: any): string {
    const ancestors = this.rgDrillPath.map(n => n.scoaShortDesc || n.scoaDesc || '').filter(Boolean);
    const leafName = leafNode.scoaShortDesc || leafNode.scoaDesc || '';
    const leaf = leafName && leafNode.scoaCode
      ? `${leafName} (${leafNode.scoaCode})`
      : leafName || leafNode.scoaCode || '';
    return [...ancestors, leaf].filter(Boolean).join(' › ');
  }

  onRgSelect(r: EditRow, node: any, event: MouseEvent) {
    event.stopPropagation();
    if (node.postingLevel === 'Yes') {
      r.scoaRegionId = node.scoaID;
      r.scoaRegionLabel = node.scoaShortDesc || node.scoaDesc || node.scoaCode;
      r.scoaRegionPath = this.buildRgPath(node);
      this.rgDrillActiveRow = null;
      this.cdr.markForCheck();
      return;
    }
    this.rgDrillHistory.push([...this.rgDrillItems]);
    this.rgDrillPath.push(node);
    const fy = r.financialYear || this.activeFinancialYear;
    this.consts.getScoaRegionalConsolidated(true, fy, node.scoaID).subscribe({
      next: children => {
        if (children.length === 0) {
          r.scoaRegionId = node.scoaID;
          r.scoaRegionLabel = node.scoaShortDesc || node.scoaDesc || node.scoaCode;
          r.scoaRegionPath = this.buildRgPath(node);
          this.rgDrillHistory.pop();
          this.rgDrillPath.pop();
          this.rgDrillActiveRow = null;
        } else {
          this.rgDrillItems = children;
        }
        this.cdr.markForCheck();
      },
      error: () => { this.rgDrillHistory.pop(); this.rgDrillPath.pop(); this.cdr.markForCheck(); }
    });
  }

  rgDrillBack(event: MouseEvent) {
    event.stopPropagation();
    if (this.rgDrillHistory.length > 0) {
      this.rgDrillItems = this.rgDrillHistory.pop()!;
      this.rgDrillPath.pop();
      this.cdr.markForCheck();
    }
  }

  clearRgDrill(r: EditRow, event: MouseEvent) {
    event.stopPropagation();
    r.scoaRegionId = null;
    r.scoaRegionLabel = null;
    r.scoaRegionPath = null;
    this.rgDrillActiveRow = null;
    this.rgDrillSearch = '';
    this.rgDrillSearchMode = false;
    this.cdr.markForCheck();
  }

  // ── SCOA Costing drill-down methods ──────────────────────────────────

  private loadCoRoot(r: EditRow) {
    this.coDrillLoading = true;
    this.coDrillItems = [];
    this.coDrillHistory = [];
    this.coDrillPath = [];
    const fy = r.financialYear || this.activeFinancialYear;
    this.consts.getScoaCostingConsolidated(true, fy, undefined, true).subscribe({
      next: data => { this.coDrillItems = data; this.coDrillLoading = false; this.cdr.markForCheck(); },
      error: () => { this.coDrillLoading = false; this.cdr.markForCheck(); }
    });
  }

  toggleCoDrill(r: EditRow, event: MouseEvent) {
    event.stopPropagation();
    if (this.coDrillActiveRow === r) {
      this.coDrillActiveRow = null;
      this.coDrillSearch = '';
      this.coDrillSearchMode = false;
    } else {
      this.coDrillActiveRow = r;
      this.coDrillSearch = '';
      this.coDrillSearchMode = false;
      this.fnDrillActiveRow = null;
      this.fdDrillActiveRow = null;
      this.rgDrillActiveRow = null;
      this.loadCoRoot(r);
    }
    this.cdr.markForCheck();
  }

  onCoSearchChange(r: EditRow) {
    clearTimeout(this.coDrillSearchTimer);
    const q = this.coDrillSearch.trim();
    if (!q) { this.coDrillSearchMode = false; this.loadCoRoot(r); return; }
    this.coDrillSearchTimer = setTimeout(() => {
      this.coDrillLoading = true; this.coDrillSearchMode = true; this.cdr.markForCheck();
      this.consts.searchScoaCostingConsolidated(q, 80).subscribe({
        next: data => { this.coDrillItems = data; this.coDrillLoading = false; this.cdr.markForCheck(); },
        error: () => { this.coDrillLoading = false; this.cdr.markForCheck(); }
      });
    }, 300);
  }

  clearCoSearch(r: EditRow, event: MouseEvent) {
    event.stopPropagation();
    this.coDrillSearch = ''; this.coDrillSearchMode = false; this.loadCoRoot(r); this.cdr.markForCheck();
  }

  private buildCoPath(leafNode: any): string {
    const ancestors = this.coDrillPath.map(n => n.scoaShortDesc || n.scoaDesc || '').filter(Boolean);
    const leafName = leafNode.scoaShortDesc || leafNode.scoaDesc || '';
    const leaf = leafName && leafNode.scoaCode
      ? `${leafName} (${leafNode.scoaCode})`
      : leafName || leafNode.scoaCode || '';
    return [...ancestors, leaf].filter(Boolean).join(' › ');
  }

  onCoSelect(r: EditRow, node: any, event: MouseEvent) {
    event.stopPropagation();
    if (node.postingLevel === 'Yes') {
      r.scoaCostingId = node.scoaID;
      r.scoaCostingLabel = node.scoaShortDesc || node.scoaDesc || node.scoaCode;
      r.scoaCostingPath = this.buildCoPath(node);
      this.coDrillActiveRow = null;
      this.cdr.markForCheck();
      return;
    }
    this.coDrillHistory.push([...this.coDrillItems]);
    this.coDrillPath.push(node);
    const fy = r.financialYear || this.activeFinancialYear;
    this.consts.getScoaCostingConsolidated(true, fy, node.scoaID).subscribe({
      next: children => {
        if (children.length === 0) {
          r.scoaCostingId = node.scoaID;
          r.scoaCostingLabel = node.scoaShortDesc || node.scoaDesc || node.scoaCode;
          r.scoaCostingPath = this.buildCoPath(node);
          this.coDrillHistory.pop();
          this.coDrillPath.pop();
          this.coDrillActiveRow = null;
        } else {
          this.coDrillItems = children;
        }
        this.cdr.markForCheck();
      },
      error: () => { this.coDrillHistory.pop(); this.coDrillPath.pop(); this.cdr.markForCheck(); }
    });
  }

  coDrillBack(event: MouseEvent) {
    event.stopPropagation();
    if (this.coDrillHistory.length > 0) {
      this.coDrillItems = this.coDrillHistory.pop()!;
      this.coDrillPath.pop();
      this.cdr.markForCheck();
    }
  }

  clearCoDrill(r: EditRow, event: MouseEvent) {
    event.stopPropagation();
    r.scoaCostingId = null;
    r.scoaCostingLabel = null;
    r.scoaCostingPath = null;
    this.coDrillActiveRow = null;
    this.coDrillSearch = '';
    this.coDrillSearchMode = false;
    this.cdr.markForCheck();
  }

  // ── SCOA Item drill-down methods ─────────────────────────────────────

  private loadItRoot(r: EditRow) {
    this.itDrillLoading = true;
    this.itDrillItems = [];
    this.itDrillHistory = [];
    this.itDrillPath = [];
    const fy = r.financialYear || this.activeFinancialYear;
    this.consts.getScoaStructureConsolidated(true, fy, undefined, undefined, undefined, true).subscribe({
      next: data => { this.itDrillItems = data; this.itDrillLoading = false; this.cdr.markForCheck(); },
      error: () => { this.itDrillLoading = false; this.cdr.markForCheck(); }
    });
  }

  toggleItDrill(r: EditRow, event: MouseEvent) {
    event.stopPropagation();
    if (this.itDrillActiveRow === r) {
      this.itDrillActiveRow = null;
      this.itDrillSearch = '';
      this.itDrillSearchMode = false;
    } else {
      this.itDrillActiveRow = r;
      this.itDrillSearch = '';
      this.itDrillSearchMode = false;
      this.fnDrillActiveRow = null;
      this.fdDrillActiveRow = null;
      this.rgDrillActiveRow = null;
      this.coDrillActiveRow = null;
      this.loadItRoot(r);
    }
    this.cdr.markForCheck();
  }

  onItSearchChange(r: EditRow) {
    clearTimeout(this.itDrillSearchTimer);
    const q = this.itDrillSearch.trim();
    if (!q) {
      this.itDrillSearchMode = false;
      this.loadItRoot(r);
      return;
    }
    this.itDrillSearchTimer = setTimeout(() => {
      this.itDrillLoading = true;
      this.itDrillSearchMode = true;
      this.cdr.markForCheck();
      this.consts.searchScoaStructureConsolidated(q, 'Yes', 80).subscribe({
        next: data => { this.itDrillItems = data; this.itDrillLoading = false; this.cdr.markForCheck(); },
        error: () => { this.itDrillLoading = false; this.cdr.markForCheck(); }
      });
    }, 300);
  }

  clearItSearch(r: EditRow, event: MouseEvent) {
    event.stopPropagation();
    this.itDrillSearch = '';
    this.itDrillSearchMode = false;
    this.loadItRoot(r);
    this.cdr.markForCheck();
  }

  private buildItPath(leafNode: any): string {
    const ancestors = this.itDrillPath.map(n => n.scoaShortDesc || n.scoaDesc || '').filter(Boolean);
    const leafName = leafNode.scoaShortDesc || leafNode.scoaDesc || '';
    const leaf = leafName && leafNode.scoaCode
      ? `${leafName} (${leafNode.scoaCode})`
      : leafName || leafNode.scoaCode || '';
    return [...ancestors, leaf].filter(Boolean).join(' › ');
  }

  onItSelect(r: EditRow, node: any, event: MouseEvent) {
    event.stopPropagation();
    if (node.postingLevel === 'Yes') {
      r.scoaItemId = node.scoaID;
      r.scoaItemLabel = node.scoaShortDesc || node.scoaDesc || node.scoaCode;
      r.scoaItemPath = this.buildItPath(node);
      r.scoaItemCode = node.scoaCode ?? null;
      this.itDrillActiveRow = null;
      this.cdr.markForCheck();
      return;
    }
    this.itDrillHistory.push([...this.itDrillItems]);
    this.itDrillPath.push(node);
    const fy = r.financialYear || this.activeFinancialYear;
    this.consts.getScoaStructureConsolidated(true, fy, undefined, undefined, node.scoaID).subscribe({
      next: children => {
        if (children.length === 0) {
          r.scoaItemId = node.scoaID;
          r.scoaItemLabel = node.scoaShortDesc || node.scoaDesc || node.scoaCode;
          r.scoaItemPath = this.buildItPath(node);
          r.scoaItemCode = node.scoaCode ?? null;
          this.itDrillHistory.pop();
          this.itDrillPath.pop();
          this.itDrillActiveRow = null;
        } else {
          this.itDrillItems = children;
        }
        this.cdr.markForCheck();
      },
      error: () => { this.itDrillHistory.pop(); this.itDrillPath.pop(); this.cdr.markForCheck(); }
    });
  }

  itDrillBack(event: MouseEvent) {
    event.stopPropagation();
    if (this.itDrillHistory.length > 0) {
      this.itDrillItems = this.itDrillHistory.pop()!;
      this.itDrillPath.pop();
      this.cdr.markForCheck();
    }
  }

  clearItDrill(r: EditRow, event: MouseEvent) {
    event.stopPropagation();
    r.scoaItemId = null;
    r.scoaItemLabel = null;
    r.scoaItemPath = null;
    r.scoaItemCode = null;
    this.itDrillActiveRow = null;
    this.itDrillSearch = '';
    this.itDrillSearchMode = false;
    this.cdr.markForCheck();
  }

  // ── Municipal Classification drill-down methods ──────────────────────

  private loadMunRoot(_r: EditRow) {
    this.munDrillLoading = true;
    this.munDrillItems = [];
    this.munDrillHistory = [];
    this.munDrillPath = [];
    this.consts.getMunicipalClassificationTree(true).subscribe({
      next: data => { this.munDrillItems = data; this.munDrillLoading = false; this.cdr.markForCheck(); },
      error: () => { this.munDrillLoading = false; this.cdr.markForCheck(); }
    });
  }

  toggleMunDrill(r: EditRow, event: MouseEvent) {
    event.stopPropagation();
    if (this.munDrillActiveRow === r) {
      this.munDrillActiveRow = null;
    } else {
      this.munDrillActiveRow = r;
      this.fnDrillActiveRow  = null;
      this.fdDrillActiveRow  = null;
      this.rgDrillActiveRow  = null;
      this.coDrillActiveRow  = null;
      this.itDrillActiveRow  = null;
      this.loadMunRoot(r);
    }
    this.cdr.markForCheck();
  }

  private buildMunPath(node: any): string {
    const ancestors = this.munDrillPath.map(n => n.label || n.code || '').filter(Boolean);
    const leafLabel = node.label || node.code || '';
    return [...ancestors, leafLabel].filter(Boolean).join(' › ');
  }

  private buildMunLabel(leafNode: any, pathIncludesLeaf = false): string {
    const effectivePath = pathIncludesLeaf ? this.munDrillPath.slice(0, -1) : this.munDrillPath;
    const deptCode = effectivePath.find((n: any) => n.nodeType === 'dept')?.code ?? '';
    const divCodes = [
      ...effectivePath.filter((n: any) => n.nodeType === 'div').map((n: any) => n.code),
      leafNode.code
    ];
    const rawLabel: string = leafNode.label ?? leafNode.code ?? '';
    const divDesc = rawLabel.includes(' - ') ? rawLabel.split(' - ').slice(1).join(' - ') : rawLabel;
    return `${deptCode}-${divCodes.join('-')} / ${divDesc}`;
  }

  onMunSelect(r: EditRow, node: any, event: MouseEvent) {
    event.stopPropagation();
    if (node.nodeType === 'div') {
      if (node.isLeaf) {
        r.munClassId    = node.id;
        r.munClassLabel = this.buildMunLabel(node, false);
        r.munClassPath  = this.buildMunPath(node);
        this.munDrillActiveRow = null;
        this.cdr.markForCheck();
        return;
      }
      this.munDrillHistory.push([...this.munDrillItems]);
      this.munDrillPath.push(node);
      this.munDrillLoading = true;
      this.consts.getMunicipalClassificationTree(undefined, undefined, node.id).subscribe({
        next: children => {
          if (children.length === 0) {
            r.munClassId    = node.id;
            r.munClassLabel = this.buildMunLabel(node, true);
            r.munClassPath  = this.buildMunPath(node);
            this.munDrillHistory.pop();
            this.munDrillPath.pop();
            this.munDrillActiveRow = null;
          } else {
            this.munDrillItems = children;
          }
          this.munDrillLoading = false;
          this.cdr.markForCheck();
        },
        error: () => { this.munDrillHistory.pop(); this.munDrillPath.pop(); this.munDrillLoading = false; this.cdr.markForCheck(); }
      });
    } else {
      // Dept node — navigate into its root divisions
      this.munDrillHistory.push([...this.munDrillItems]);
      this.munDrillPath.push(node);
      this.munDrillLoading = true;
      this.consts.getMunicipalClassificationTree(undefined, node.id).subscribe({
        next: children => {
          this.munDrillItems = children;
          this.munDrillLoading = false;
          this.cdr.markForCheck();
        },
        error: () => { this.munDrillHistory.pop(); this.munDrillPath.pop(); this.munDrillLoading = false; this.cdr.markForCheck(); }
      });
    }
  }

  munDrillBack(event: MouseEvent) {
    event.stopPropagation();
    if (this.munDrillHistory.length > 0) {
      this.munDrillItems = this.munDrillHistory.pop()!;
      this.munDrillPath.pop();
      this.cdr.markForCheck();
    }
  }

  clearMunDrill(r: EditRow, event: MouseEvent) {
    event.stopPropagation();
    r.munClassId    = null;
    r.munClassLabel = null;
    r.munClassPath  = null;
    this.munDrillActiveRow = null;
    this.cdr.markForCheck();
  }

  exportCsv() {
    const header = 'Code,Financial Year,Project Name,Description,Budget Type,Single/Multi-Year,Project Type,Costing Project,Status,Department,Ward,Project Manager,Contractor,Contract No.,Funding Source,Start Date,End Date,Total Cost,GPS,Registered,Year 1,Year 2,Year 3\n';
    const body = this.rows.map(r => [
      r.original.projectCode,
      r.financialYear,
      r.projectName,
      r.description,
      this.budgetTypes.find(t => t.value === r.typeVal)?.label ?? '',
      r.singleMultiYear,
      r.projectTypeName,
      r.costingProject ? 'Yes' : 'No',
      STATUS_OPTIONS.find(s => s.value === r.statusVal)?.label ?? '',
      this.departments.find(d => d.id === r.departmentId)?.name ?? '',
      r.ward, r.projectManager, r.contractorName, r.contractNumber,
      r.fundingSource, r.startDate, r.endDate,
      r.totalProjectCost, r.gpsCoordinates,
      r.isRegistered ? 'Yes' : 'No',
      r.year1, r.year2, r.year3
    ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `project-budgets-grid-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  captureProject() {
    this.showCaptureDialog = true;
  }

  onProjectSaved() {
    this.showCaptureDialog = false;
    this.loadProjectsProgressively(this.selectedFy);
  }

  // ── Project Item autocomplete methods ────────────────────────────────────
  private loadPiItems() {
    if (this.piLoaded) return;
    this.consts.getProjectItems().subscribe(items => {
      this.piAllItems = items;
      this.piLoaded = true;
    });
  }

  onPiFocus(r: EditRow) {
    this.loadPiItems();
    this.piActiveRow = r;
    this.filterPi(r);
    this.cdr.markForCheck();
  }

  onPiInput(r: EditRow) {
    r.projectItemId = null;
    this.piActiveRow = r;
    this.filterPi(r);
    this.cdr.markForCheck();
  }

  private filterPi(r: EditRow) {
    const q = (r.projectItemText || '').toLowerCase();
    const fy = r.financialYear || this.activeFinancialYear;
    this.piFiltered = this.piAllItems
      .filter(i => (!i.finYear || i.finYear === fy) &&
                   (!q || (i.code || '').toLowerCase().includes(q) ||
                          (i.description || '').toLowerCase().includes(q)))
      .slice(0, 20);
  }

  selectPiItem(r: EditRow, item: any) {
    r.projectItemId   = item.id;
    r.projectItemText = item.code || item.description || '';
    this.piActiveRow  = null;
    this.piFiltered   = [];
    this.cdr.markForCheck();
  }

  onPiBlur() {
    setTimeout(() => {
      this.piActiveRow = null;
      this.cdr.markForCheck();
    }, 150);
  }

  clearPi(r: EditRow) {
    r.projectItemId   = null;
    r.projectItemText = '';
    this.piActiveRow  = null;
    this.piFiltered   = [];
    this.cdr.markForCheck();
  }
}
