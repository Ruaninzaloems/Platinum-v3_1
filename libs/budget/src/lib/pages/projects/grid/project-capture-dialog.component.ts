import { Component, EventEmitter, HostListener, Input, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ApiService } from '../../../core/services/api.service';
import { ConstantsApiService } from '../../../core/services/constants-api.service';

interface MemIdpLink {
  idpItemId: number;
  idpItemLabel: string;
  percentage: number;
  longitude: number | null;
  latitude: number | null;
}

@Component({
  selector: 'app-project-capture-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule],
  template: `
<div class="dlg-backdrop" (click)="onBackdropClick($event)">
  <div class="dlg-card" (click)="$event.stopPropagation()">

    <!-- Header -->
    <div class="dlg-header">
      <div>
        <div class="dlg-title">Capture Project</div>
        <div class="dlg-subtitle">Demo Municipality</div>
      </div>
      <button class="dlg-close" (click)="close()"><mat-icon>close</mat-icon></button>
    </div>

    <!-- Scrollable body -->
    <div class="dlg-body">

      <!-- ── Project Identification ── -->
      <div class="sect">
        <div class="sect-heading">Project Identification</div>
        <div class="form-grid">

          <mat-form-field appearance="outline" class="field-full-width">
            <mat-label>Financial Year</mat-label>
            <mat-select [(ngModel)]="form.financialYear" (ngModelChange)="onFyChange($event)" [disabled]="true">
              <mat-option *ngFor="let y of financialYears" [value]="y">{{y}}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="field-full-width">
            <mat-label>Project Status</mat-label>
            <mat-select [(ngModel)]="form.projectStatus" [disabled]="true">
              <mat-option *ngFor="let s of statusOptions" [value]="s.status_ID">{{s.statusDesc}}</mat-option>
            </mat-select>
          </mat-form-field>

          <div class="field-wrap field-wrap--full" [class.field-wrap--error]="errors['projectName'] || errors['projectNameDuplicate']">
            <mat-form-field appearance="outline" class="field-wrap__field">
              <mat-label>Project Name *</mat-label>
              <input matInput [(ngModel)]="form.projectName" (ngModelChange)="onProjectNameChange()" (blur)="checkNameDuplicate()" placeholder="Enter project name" />
            </mat-form-field>
            <div class="field-error-msg" *ngIf="errors['projectName']">Project Name is required</div>
            <div class="field-error-msg" *ngIf="errors['projectNameDuplicate']">A project with this name already exists for this financial year.</div>
          </div>

          <div class="field-wrap field-wrap--full" [class.field-wrap--error]="errors['projectDescription']">
            <mat-form-field appearance="outline" subscriptSizing="dynamic" class="field-wrap__field textarea-field">
              <mat-label>Project Description *</mat-label>
              <textarea matInput [(ngModel)]="form.projectDescription" (ngModelChange)="clearErr('projectDescription')" rows="2" placeholder="Enter project description"></textarea>
            </mat-form-field>
            <div class="field-error-msg" *ngIf="errors['projectDescription']">Project Description is required</div>
          </div>

        </div>
      </div>

      <!-- ── Budget Classification ── -->
      <div class="sect">
        <div class="sect-heading">Budget Classification</div>
        <div class="form-grid">

          <div class="field-wrap" [class.field-wrap--error]="errors['budgetType']">
            <mat-form-field appearance="outline" class="field-wrap__field">
              <mat-label>Budget Type *</mat-label>
              <mat-select [(ngModel)]="form.budgetType" (ngModelChange)="onBudgetTypeChange($event)">
                <mat-option *ngFor="let b of budgetTypes" [value]="b.typeValue">{{b.typeName}}</mat-option>
              </mat-select>
            </mat-form-field>
            <div class="field-error-msg" *ngIf="errors['budgetType']">Budget Type is required</div>
          </div>

          <div class="field-wrap" [class.field-wrap--error]="errors['singleMultiYear']">
            <mat-form-field appearance="outline" class="field-wrap__field">
              <mat-label>Single/Multi-Year *</mat-label>
              <mat-select [(ngModel)]="form.singleMultiYear" (ngModelChange)="clearErr('singleMultiYear')" [disabled]="!isCapitalBudget">
                <mat-option value="Single-Year">Single-Year</mat-option>
                <mat-option value="Multi-Year">Multi-Year</mat-option>
              </mat-select>
            </mat-form-field>
            <div class="field-error-msg" *ngIf="errors['singleMultiYear']">Single/Multi-Year is required</div>
          </div>

          <div class="checkbox-field">
            <mat-checkbox [(ngModel)]="form.costingProject" color="primary">Costing Project</mat-checkbox>
          </div>

        </div>
      </div>

      <!-- ── SCOA Configuration ── -->
      <div class="sect">
        <div class="sect-heading">SCOA Configuration</div>

        <div class="scoa-wrap" (click)="$event.stopPropagation()">
          <div class="scoa-trigger"
               [class.scoa-trigger--open]="scoaDrillOpen"
               [class.scoa-trigger--selected]="scoaDrillSelected"
               [class.scoa-trigger--err]="errors['scoaProjectId']"
               (click)="toggleScoaDrill($event)">
            <span class="scoa-label">SCOA Project *</span>
            <span class="scoa-value">
              <ng-container *ngIf="scoaDrillSelected">
                <span class="scoa-path" *ngIf="scoaPathLabel">{{scoaPathLabel}} › </span>
                <strong>{{scoaDrillSelected.scoaShortDesc || scoaDrillSelected.scoaDesc}}</strong>
                <span class="scoa-code" *ngIf="scoaDrillSelected.scoaCode">({{scoaDrillSelected.scoaCode}})</span>
              </ng-container>
            </span>
            <span class="scoa-icons">
              <mat-icon *ngIf="scoaDrillSelected" class="scoa-clear" (click)="clearScoaDrill($event)">close</mat-icon>
              <mat-icon class="scoa-arrow" [class.scoa-arrow--open]="scoaDrillOpen">arrow_drop_down</mat-icon>
            </span>
          </div>

          <div class="scoa-panel" *ngIf="scoaDrillOpen">
            <div class="scoa-nav" *ngIf="scoaDrillHistory.length > 0">
              <button class="scoa-back" (click)="scoaDrillBack()">
                <mat-icon>arrow_back</mat-icon> Back
              </button>
              <span class="scoa-nav-path" *ngIf="scoaPathLabel">{{scoaPathLabel}}</span>
            </div>
            <div class="scoa-loading" *ngIf="scoaLoading">
              <mat-spinner diameter="18"></mat-spinner><span>Loading…</span>
            </div>
            <div class="scoa-items" *ngIf="!scoaLoading">
              <div *ngFor="let node of displayedScoaItems"
                   class="scoa-item"
                   [class.scoa-item--leaf]="node.postingLevel === 'Yes'"
                   (click)="onScoaSelect(node, $event)">
                <span class="scoa-item-label">
                  {{node.scoaShortDesc || node.scoaDesc}}
                  <span class="scoa-item-code" *ngIf="node.scoaCode">({{node.scoaCode}})</span>
                </span>
                <mat-icon class="scoa-item-icon" [class.scoa-item-icon--leaf]="node.postingLevel === 'Yes'">{{node.postingLevel === 'Yes' ? 'check_circle' : 'chevron_right'}}</mat-icon>
              </div>
              <div class="scoa-empty" *ngIf="displayedScoaItems.length === 0">No items found.</div>
            </div>
          </div>
        </div>
        <div class="err-msg err-msg--outer" *ngIf="errors['scoaProjectId']">A lowest-level SCOA Project must be selected</div>
      </div>

      <!-- ── Add IDP Link ── -->
      <div class="sect">
        <div class="sect-heading">Add IDP Link</div>
        <div class="form-grid">

          <mat-form-field appearance="outline" class="field-full-width field-col-span-2">
            <mat-label>IDP Item *</mat-label>
            <mat-select [(ngModel)]="newIdp.idpItemId">
              <mat-option *ngFor="let item of idpItems" [value]="item.item_ID">{{item.path || item.itemDesc}}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="field-full-width">
            <mat-label>Percentage *</mat-label>
            <input matInput type="number" [(ngModel)]="newIdp.percentage" min="0" max="100" step="0.01" placeholder="0.00" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="field-full-width">
            <mat-label>Longitude (X)</mat-label>
            <input matInput type="number" [(ngModel)]="newIdp.longitude" step="0.00000001" placeholder="0.00000000" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="field-full-width">
            <mat-label>Latitude (Y)</mat-label>
            <input matInput type="number" [(ngModel)]="newIdp.latitude" step="0.00000001" placeholder="0.00000000" />
          </mat-form-field>

          <div class="idp-add-action">
            <button class="btn-add-idp" (click)="addIdpLink()" [disabled]="!newIdp.idpItemId || newIdp.percentage == null">
              <mat-icon>add</mat-icon> Add IDP Link
            </button>
          </div>

        </div>
      </div>

      <!-- ── IDP Links Table ── -->
      <div class="sect">
        <div class="sect-heading" [class.sect-heading--err]="errors['idpRequired'] || errors['idpPercentage']">
          IDP Links
          <span class="sect-err-tag" *ngIf="errors['idpRequired']">At least one IDP link required</span>
          <span class="sect-err-tag" *ngIf="errors['idpPercentage'] && !errors['idpRequired']">Total must equal 100%</span>
        </div>
        <div class="idp-table-wrap">
          <table class="idp-table">
            <thead>
              <tr>
                <th>EDIT</th>
                <th>DELETE</th>
                <th>IDP ITEM</th>
                <th class="right">PERCENTAGE</th>
                <th class="right">LONGITUDE</th>
                <th class="right">LATITUDE</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let lnk of filteredIdpLinks; let i = index" class="idp-row">
                <td class="action-cell">
                  <button class="btn-icon btn-edit" (click)="editIdpLink(i)" title="Edit"><mat-icon>edit</mat-icon></button>
                </td>
                <td class="action-cell">
                  <button class="btn-icon btn-del" (click)="removeIdpLink(i)" title="Delete"><mat-icon>delete</mat-icon></button>
                </td>
                <td>{{lnk.idpItemLabel}}</td>
                <td class="right">{{lnk.percentage | number:'1.2-2'}}</td>
                <td class="right">{{(lnk.longitude ?? 0) | number:'1.8-8'}}</td>
                <td class="right">{{(lnk.latitude ?? 0) | number:'1.8-8'}}</td>
              </tr>
              <tr *ngIf="filteredIdpLinks.length === 0" class="empty-row">
                <td colspan="6" class="empty-cell">No IDP links added yet</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="3" class="total-label">TOTAL:</td>
                <td class="right total-val" [class.total-warn]="idpPctTotal > 0 && Math.abs(idpPctTotal - 100) > 0.001">
                  {{idpPctTotal | number:'1.2-2'}}
                </td>
                <td></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Error banner -->
      <div class="err-banner" *ngIf="bannerError">
        <mat-icon>error_outline</mat-icon> {{bannerError}}
      </div>

    </div><!-- /dlg-body -->

    <!-- Footer -->
    <div class="dlg-footer">
      <button class="btn-cancel" (click)="close()" [disabled]="saving">Cancel</button>
      <button class="btn-save" (click)="save()" [disabled]="saving">
        <mat-spinner *ngIf="saving" diameter="16"></mat-spinner>
        <mat-icon *ngIf="!saving">save</mat-icon>
        {{saving ? 'Saving…' : 'Save Project'}}
      </button>
    </div>

  </div>
</div>
  `,
  styles: [`
    .dlg-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 1000;
      display: flex; align-items: center; justify-content: center; padding: 16px;
    }
    .dlg-card {
      background: #fff; border-radius: 10px; box-shadow: 0 16px 48px rgba(0,0,0,.22);
      width: 100%; max-width: 860px; max-height: 92vh; display: flex; flex-direction: column;
    }
    .dlg-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 18px 10px; border-bottom: 1px solid #e2e8f0;
    }
    .dlg-title { font-size: 16px; font-weight: 700; color: #0f2b46; }
    .dlg-subtitle { font-size: 11px; color: #64748b; margin-top: 1px; }
    .dlg-close { background: none; border: none; cursor: pointer; color: #64748b; padding: 2px; border-radius: 6px; display: flex; }
    .dlg-close:hover { background: #f1f5f9; color: #0f2b46; }
    .dlg-body { overflow-y: auto; padding: 14px 18px; flex: 1; }
    .dlg-footer {
      display: flex; justify-content: flex-end; gap: 8px;
      padding: 10px 18px; border-top: 1px solid #e2e8f0;
    }

    .sect { margin-bottom: 16px; }
    .sect-heading { font-size: 12px; font-weight: 700; color: #0f2b46; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 2px solid #e2e8f0; display: flex; align-items: center; gap: 8px; text-transform: uppercase; letter-spacing: .04em; }
    .sect-heading--err { color: #dc2626; border-bottom-color: #fca5a5; }
    .sect-err-tag { font-size: 11px; font-weight: 500; color: #dc2626; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 4px; padding: 1px 6px; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; align-items: start; }
    .field-full-width { width: 100%; }
    .field-col-span-2 { grid-column: 1 / -1; }

    .field-wrap { display: flex; flex-direction: column; }
    .field-wrap__field { width: 100%; }
    .field-wrap--full { grid-column: 1 / -1; }
    .field-error-msg { font-size: 11px; color: #d32f2f; margin-top: 1px; padding-left: 2px; line-height: 1.3; }
    ::ng-deep .field-wrap--error .mdc-notched-outline__leading,
    ::ng-deep .field-wrap--error .mdc-notched-outline__notch,
    ::ng-deep .field-wrap--error .mdc-notched-outline__trailing {
      border-color: #d32f2f !important; border-width: 2px !important;
    }

    /* Compact Material outline fields — drive height purely via the CSS variable
       so label-float transforms stay in sync (38px matches SCOA trigger) */
    ::ng-deep .dlg-card .mat-mdc-form-field:not(.textarea-field) {
      --mdc-outlined-text-field-container-height: 38px;
      --mat-form-field-container-height: 38px;
    }
    ::ng-deep .dlg-card .mat-mdc-form-field:not(.textarea-field) .mat-mdc-text-field-wrapper { padding-bottom: 0 !important; }
    ::ng-deep .dlg-card .mat-mdc-form-field-subscript-wrapper { display: none !important; }
    ::ng-deep .dlg-card .mat-mdc-select, ::ng-deep .dlg-card .mat-mdc-select .mat-mdc-select-value { font-size: 13px; }
    ::ng-deep .dlg-card input.mat-mdc-input-element { font-size: 13px; line-height: 1.4; vertical-align: middle; }
    ::ng-deep .dlg-card input[type="number"].mat-mdc-input-element { line-height: normal; }
    ::ng-deep .dlg-card textarea.mat-mdc-input-element { font-size: 13px; }
    ::ng-deep .dlg-card .mat-mdc-floating-label { font-size: 13px; }
    ::ng-deep .mat-mdc-select-panel .mat-mdc-option { font-size: 13px; min-height: 36px; display: flex; align-items: center; }
    ::ng-deep .mat-mdc-select-panel .mat-mdc-option .mdc-list-item__primary-text { display: flex; align-items: center; width: 100%; }

    .err-msg { font-size: 11px; color: #ef4444; }
    .err-msg--outer { margin-top: 3px; }

    .checkbox-field { display: flex; align-items: center; padding: 6px 0; }
    .idp-add-action { display: flex; align-items: flex-end; justify-content: flex-end; padding-bottom: 4px; }

    /* SCOA drill */
    .scoa-wrap { position: relative; }
    .scoa-trigger {
      display: flex; align-items: center; gap: 6px; min-height: 38px; padding: 5px 10px;
      border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; background: #fff;
      position: relative; transition: border-color .15s;
    }
    .scoa-trigger:hover { border-color: #94a3b8; }
    .scoa-trigger--open, .scoa-trigger--selected { border-color: #0f2b46; }
    .scoa-trigger--err { border-color: #ef4444; }
    .scoa-label { font-size: 11px; font-weight: 600; color: #374151; white-space: nowrap; }
    .scoa-value { flex: 1; font-size: 12px; color: #1f2937; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .scoa-path { color: #64748b; }
    .scoa-code { color: #94a3b8; margin-left: 4px; font-size: 11px; }
    .scoa-icons { display: flex; align-items: center; gap: 2px; }
    .scoa-clear { font-size: 15px; width: 15px; height: 15px; color: #94a3b8; cursor: pointer; }
    .scoa-clear:hover { color: #ef4444; }
    .scoa-arrow { font-size: 18px; width: 18px; height: 18px; color: #64748b; transition: transform .2s; }
    .scoa-arrow--open { transform: rotate(180deg); }
    .scoa-panel {
      position: absolute; top: calc(100% + 3px); left: 0; right: 0; z-index: 200;
      background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
      box-shadow: 0 6px 20px rgba(0,0,0,.11); max-height: 260px; overflow-y: auto;
    }
    .scoa-nav { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-bottom: 1px solid #f1f5f9; }
    .scoa-back { background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 3px; font-size: 12px; color: #0f2b46; font-weight: 600; }
    .scoa-nav-path { font-size: 11px; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .scoa-loading { display: flex; align-items: center; gap: 8px; padding: 12px; color: #64748b; font-size: 12px; }
    .scoa-items { padding: 3px; }
    .scoa-item { display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; border-radius: 5px; cursor: pointer; font-size: 12px; }
    .scoa-item:hover { background: #f8fafc; }
    .scoa-item--leaf:hover { background: #eff6ff; }
    .scoa-item-label { flex: 1; }
    .scoa-item-code { color: #94a3b8; margin-left: 5px; font-size: 11px; }
    .scoa-item-icon { font-size: 16px; width: 16px; height: 16px; color: #94a3b8; }
    .scoa-item-icon--leaf { color: #16a34a; }
    .scoa-empty { padding: 12px; text-align: center; color: #94a3b8; font-size: 12px; }

    /* IDP */
    .btn-add-idp {
      display: flex; align-items: center; gap: 5px; padding: 6px 12px;
      background: #475569; color: #fff; border: none; border-radius: 6px; cursor: pointer;
      font-size: 12px; font-weight: 600; white-space: nowrap;
    }
    .btn-add-idp:hover:not([disabled]) { background: #334155; }
    .btn-add-idp[disabled] { opacity: .5; cursor: not-allowed; }
    .btn-add-idp mat-icon { font-size: 15px; width: 15px; height: 15px; }

    .idp-table-wrap { overflow-x: auto; border-radius: 6px; border: 1px solid #e2e8f0; }
    .idp-table { width: 100%; border-collapse: collapse; font-size: 11px; }
    .idp-table thead tr:first-child th {
      background: #0f2b46; color: #fff; padding: 6px 8px; font-weight: 700;
      font-size: 10px; letter-spacing: .04em; text-transform: uppercase; white-space: nowrap;
    }
    .idp-table tbody tr { border-bottom: 1px solid #f1f5f9; }
    .idp-table tbody tr:last-child { border-bottom: none; }
    .idp-table tbody td { padding: 5px 8px; color: #374151; }
    .idp-table tbody .empty-cell { text-align: center; color: #94a3b8; padding: 16px; }
    .idp-table tfoot .total-row td { padding: 6px 8px; background: #f0f4f8; font-weight: 700; }
    .idp-table tfoot .total-label { text-align: right; color: #374151; }
    .idp-table tfoot .total-val { color: #16a34a; }
    .idp-table tfoot .total-warn { color: #dc2626; }
    .right { text-align: right; }
    .action-cell { width: 30px; text-align: center; }
    .btn-icon { background: none; border: none; cursor: pointer; padding: 2px; border-radius: 4px; display: inline-flex; }
    .btn-edit mat-icon { font-size: 15px; width: 15px; height: 15px; color: #3b82f6; }
    .btn-del mat-icon { font-size: 15px; width: 15px; height: 15px; color: #ef4444; }
    .btn-icon:hover { background: #f1f5f9; }

    .err-banner { display: flex; align-items: center; gap: 8px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 8px 10px; color: #dc2626; font-size: 12px; margin-top: 6px; }
    .err-banner mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .btn-cancel {
      padding: 6px 16px; border: 1px solid #d1d5db; background: #fff; border-radius: 6px;
      cursor: pointer; font-size: 13px; font-weight: 500; color: #374151;
    }
    .btn-cancel:hover:not([disabled]) { background: #f9fafb; }
    .btn-save {
      display: flex; align-items: center; gap: 5px; padding: 6px 16px;
      background: #16a34a; color: #fff; border: none; border-radius: 6px;
      cursor: pointer; font-size: 13px; font-weight: 600;
    }
    .btn-save:hover:not([disabled]) { background: #15803d; }
    .btn-save[disabled] { opacity: .6; cursor: not-allowed; }
    .btn-save mat-icon { font-size: 16px; width: 16px; height: 16px; }
  `]
})
export class ProjectCaptureDialogComponent implements OnInit {
  @Input() userFinancialYear: string = '';
  @Input() existingProjectNames: string[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  readonly Math = Math;

  form: any = {
    financialYear: '',
    projectStatus: 4,
    projectName: '',
    projectDescription: '',
    budgetType: null,
    singleMultiYear: '',
    costingProject: false,
    scoaProjectId: null
  };

  financialYears: string[] = [];
  statusOptions: any[] = [];
  budgetTypes: any[] = [];
  idpItems: any[] = [];

  scoaDrillItems: any[] = [];
  scoaDrillHistory: any[][] = [];
  scoaDrillPath: any[] = [];
  scoaDrillSelected: any = null;
  scoaDrillOpen = false;
  scoaLoading = false;

  idpLinks: MemIdpLink[] = [];
  newIdp: { idpItemId: number | null; percentage: number | null; longitude: number | null; latitude: number | null } = {
    idpItemId: null, percentage: null, longitude: null, latitude: null
  };

  saving = false;
  errors: Record<string, boolean> = {};
  bannerError: string | null = null;

  constructor(
    private api: ApiService,
    private consts: ConstantsApiService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.api.getFinancialYears().subscribe((years: any[]) => {
      this.financialYears = years.map((y: any) => y.yearCode || y.description || '').filter(Boolean);
      if (this.financialYears.length) {
        if (this.userFinancialYear && this.financialYears.includes(this.userFinancialYear)) {
          this.form.financialYear = this.userFinancialYear;
        } else {
          this.form.financialYear = this.userFinancialYear || this.financialYears.find((y: string) => y.includes('2025')) || this.financialYears[0];
        }
        this.loadScoaRoot();
        this.loadIdpItems();
      }
      this.cdr.markForCheck();
    });

    this.consts.getPlanCapitalOperationalTypes().subscribe((data: any[]) => {
      this.budgetTypes = data.filter(t => t.typeValue != null).sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
      this.cdr.markForCheck();
    });

    this.consts.getStatuses('ProjectRegister').subscribe((data: any[]) => {
      this.statusOptions = data.sort((a, b) => (a.status_ID ?? 99) - (b.status_ID ?? 99));
      const captureStatus = this.statusOptions.find(s =>
        (s.statusDesc || '').toLowerCase().includes('capture')
      );
      if (captureStatus) {
        this.form.projectStatus = captureStatus.status_ID;
      }
      this.cdr.markForCheck();
    });
  }

  onFyChange(fy: string) {
    this.form.scoaProjectId = null;
    this.scoaDrillSelected = null;
    this.scoaDrillHistory = [];
    this.scoaDrillPath = [];
    this.loadScoaRoot();
    this.loadIdpItems();
  }

  get isCapitalBudget(): boolean {
    const selected = this.budgetTypes.find(b => b.typeValue === this.form.budgetType);
    return (selected?.typeName || '').toLowerCase().includes('capital');
  }

  onBudgetTypeChange(typeValue: any) {
    delete this.errors['budgetType'];
    if (!this.isCapitalBudget) {
      this.form.singleMultiYear = 'Single-Year';
      delete this.errors['singleMultiYear'];
    }
    // Reset SCOA — close panel, clear selection, drill state and cached items
    // so the next open re-loads root nodes filtered for the new budget type
    this.scoaDrillOpen = false;
    this.scoaDrillSelected = null;
    this.form.scoaProjectId = null;
    this.scoaDrillHistory = [];
    this.scoaDrillPath = [];
    this.scoaDrillItems = [];
    this.cdr.markForCheck();
  }

  private loadScoaRoot() {
    if (!this.form.financialYear) return;
    this.scoaLoading = true;
    this.consts.getScoaProjectConsolidated(true, undefined, this.form.financialYear, undefined, true).subscribe({
      next: data => { this.scoaDrillItems = data; this.scoaLoading = false; this.cdr.markForCheck(); },
      error: () => { this.scoaLoading = false; this.cdr.markForCheck(); }
    });
  }

  private loadIdpItems() {
    const fy = this.form.financialYear || '2025/2026';
    this.http.get<any[]>(`/api/constants/idp-items/with-path`, { params: { financialYear: fy } }).subscribe({
      next: items => { this.idpItems = items; this.cdr.markForCheck(); },
      error: () => {
        this.consts.getIdpItems(fy, 5).subscribe(items => { this.idpItems = items; this.cdr.markForCheck(); });
      }
    });
  }

  get scoaPathLabel(): string {
    return this.scoaDrillPath.map(n => n.scoaShortDesc || n.scoaDesc).join(' › ');
  }

  get displayedScoaItems(): any[] {
    if (this.scoaDrillHistory.length === 0 && this.form.budgetType != null) {
      const isCapital = this.isCapitalBudget;
      const typeName = (this.budgetTypes.find(b => b.typeValue === this.form.budgetType)?.typeName || '').toLowerCase();
      return this.scoaDrillItems.filter(n => {
        const desc = (n.scoaShortDesc || n.scoaDesc || '').toLowerCase();
        if (isCapital) return desc.includes('capital');
        if (typeName.includes('revenue')) return desc.includes('default transactions');
        if (typeName.includes('operational') || typeName.includes('free basic')) return desc.includes('operational');
        if (typeName.includes('financial position')) return desc.includes('capital') || desc.includes('default transactions');
        return !desc.includes('capital');
      });
    }
    return this.scoaDrillItems;
  }

  toggleScoaDrill(event: MouseEvent) {
    event.stopPropagation();
    this.scoaDrillOpen = !this.scoaDrillOpen;
    if (this.scoaDrillOpen && this.scoaDrillItems.length === 0 && !this.scoaLoading) {
      this.loadScoaRoot();
    }
  }

  onScoaSelect(node: any, event: MouseEvent) {
    event.stopPropagation();
    if (node.postingLevel === 'Yes') {
      this.scoaDrillSelected = node;
      this.form.scoaProjectId = node.scoaID;
      this.scoaDrillOpen = false;
      this.clearErr('scoaProjectId');
      return;
    }
    this.scoaDrillHistory.push([...this.scoaDrillItems]);
    this.scoaDrillPath.push(node);
    this.consts.getScoaProjectConsolidated(true, undefined, this.form.financialYear, node.scoaID).subscribe({
      next: children => {
        if (children.length === 0) {
          this.scoaDrillSelected = node;
          this.form.scoaProjectId = node.scoaID;
          this.scoaDrillHistory.pop();
          this.scoaDrillPath.pop();
          this.scoaDrillOpen = false;
          this.clearErr('scoaProjectId');
        } else {
          this.scoaDrillItems = children;
        }
        this.cdr.markForCheck();
      },
      error: () => { this.scoaDrillHistory.pop(); this.scoaDrillPath.pop(); this.cdr.markForCheck(); }
    });
  }

  scoaDrillBack() {
    if (this.scoaDrillHistory.length > 0) {
      this.scoaDrillItems = this.scoaDrillHistory.pop()!;
      this.scoaDrillPath.pop();
    }
  }

  clearScoaDrill(event: MouseEvent) {
    event.stopPropagation();
    this.scoaDrillSelected = null;
    this.form.scoaProjectId = null;
    this.scoaDrillHistory = [];
    this.scoaDrillPath = [];
    this.loadScoaRoot();
  }

  @HostListener('document:click')
  onDocumentClick() { this.scoaDrillOpen = false; }

  get filteredIdpLinks(): MemIdpLink[] { return this.idpLinks; }

  get idpPctTotal(): number {
    return this.idpLinks.reduce((s, l) => s + (l.percentage || 0), 0);
  }

  addIdpLink() {
    if (!this.newIdp.idpItemId || this.newIdp.percentage == null) return;
    delete this.errors['idpRequired'];
    const item = this.idpItems.find(i => i.item_ID === this.newIdp.idpItemId);
    this.idpLinks.push({
      idpItemId: this.newIdp.idpItemId,
      idpItemLabel: item?.path || item?.itemDesc || String(this.newIdp.idpItemId),
      percentage: this.newIdp.percentage!,
      longitude: this.newIdp.longitude,
      latitude: this.newIdp.latitude
    });
    this.newIdp = { idpItemId: null, percentage: null, longitude: null, latitude: null };
    delete this.errors['idpPercentage'];
  }

  editIdpLink(index: number) {
    const lnk = this.idpLinks[index];
    this.newIdp = { idpItemId: lnk.idpItemId, percentage: lnk.percentage, longitude: lnk.longitude, latitude: lnk.latitude };
    this.idpLinks.splice(index, 1);
    delete this.errors['idpPercentage'];
  }

  removeIdpLink(index: number) {
    this.idpLinks.splice(index, 1);
    delete this.errors['idpPercentage'];
    if (this.idpLinks.length === 0) this.errors['idpRequired'] = true;
  }

  clearErr(field: string) { delete this.errors[field]; }

  onProjectNameChange() {
    delete this.errors['projectName'];
    delete this.errors['projectNameDuplicate'];
  }

  checkNameDuplicate() {
    const name = (this.form.projectName || '').trim().toLowerCase();
    if (!name) return;
    const isDuplicate = this.existingProjectNames.some(n => n.toLowerCase().trim() === name);
    if (isDuplicate) {
      this.errors['projectNameDuplicate'] = true;
      this.cdr.markForCheck();
    }
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('dlg-backdrop')) this.close();
  }

  close() { if (!this.saving) this.closed.emit(); }

  save() {
    this.bannerError = null;
    this.errors = {};

    if (!this.form.projectStatus) this.errors['projectStatus'] = true;
    if (!this.form.projectName?.trim()) {
      this.errors['projectName'] = true;
    } else {
      const name = this.form.projectName.trim().toLowerCase();
      if (this.existingProjectNames.some(n => n.toLowerCase().trim() === name)) {
        this.errors['projectNameDuplicate'] = true;
      }
    }
    if (!this.form.projectDescription?.trim()) this.errors['projectDescription'] = true;
    if (this.form.budgetType == null) this.errors['budgetType'] = true;
    if (!this.form.singleMultiYear) this.errors['singleMultiYear'] = true;
    if (!this.form.scoaProjectId) this.errors['scoaProjectId'] = true;
    if (this.idpLinks.length === 0) this.errors['idpRequired'] = true;
    if (this.idpLinks.length > 0 && Math.abs(this.idpPctTotal - 100) > 0.001) this.errors['idpPercentage'] = true;

    if (Object.keys(this.errors).length > 0) {
      const msgs: string[] = [];
      if (this.errors['idpRequired']) msgs.push('At least one IDP link is required.');
      if (this.errors['idpPercentage']) msgs.push(`IDP percentages must total 100% (currently ${this.idpPctTotal.toFixed(2)}%).`);
      const fieldErrors = Object.keys(this.errors).some(k => !k.startsWith('idp'));
      if (fieldErrors) msgs.unshift('Please fill in all required fields.');
      this.bannerError = msgs.join(' ');
      this.cdr.markForCheck();
      return;
    }

    this.saving = true;
    const planPayload = {
      Project_ID: 0,
      ProjectName: this.form.projectName.trim(),
      ProjectDesc: this.form.projectDescription.trim(),
      CapitalOperation: this.form.budgetType,
      ScoaProjectID: this.form.scoaProjectId,
      ProjectStatus: this.form.projectStatus,
      FinYear: this.form.financialYear,
      SingleMultiYear: this.form.singleMultiYear,
      CostingProject: this.form.costingProject,
      CapturerID: 1,
      DateCaptured: new Date().toISOString()
    };

    this.http.post<any>('/budget-app/api/ems/plan-project/plan-project', planPayload).subscribe({
      next: (planResult: any) => {
        const planId: number = planResult?.Project_ID ?? planResult?.project_ID ?? 0;

        if (this.idpLinks.length === 0) {
          this.saving = false; this.saved.emit();
          return;
        }

        const virtualPayload = {
          projectCode: '',
          projectName: this.form.projectName.trim(),
          description: this.form.projectDescription.trim(),
          type: this.form.budgetType,
          status: this.form.projectStatus,
          isRegistered: false
        };
        this.api.createProject(virtualPayload).subscribe({
          next: (vResult: any) => {
            const virtualId: number = vResult?.id ?? 0;
            if (!virtualId) { this.saving = false; this.saved.emit(); return; }

            const linkSaves = this.idpLinks.map(lnk =>
              this.http.post(`/api/projects/${virtualId}/idp-links`, {
                idpItemId: lnk.idpItemId,
                percentage: lnk.percentage,
                longitude: lnk.longitude,
                latitude: lnk.latitude
              }).toPromise().catch(() => null)
            );
            Promise.all(linkSaves).then(() => {
              this.saving = false;
              this.saved.emit();
            });
          },
          error: () => { this.saving = false; this.saved.emit(); }
        });
      },
      error: (err: any) => {
        this.saving = false;
        if (err.status === 409) {
          this.errors['projectName'] = true;
          this.bannerError = 'A project with this name already exists for the selected financial year.';
        } else {
          this.bannerError = 'Failed to save project. Please try again.';
        }
        this.cdr.markForCheck();
      }
    });
  }
}
