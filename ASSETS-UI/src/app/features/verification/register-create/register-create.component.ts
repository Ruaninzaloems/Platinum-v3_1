import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/api.service';

@Component({
  selector: 'app-register-create',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
      <button mat-icon-button routerLink="/verification/register"><mat-icon>arrow_back</mat-icon></button>
      <div>
        <h1 style="font-size:22px;font-weight:700;color:#1e293b;margin:0">Create Verification Register</h1>
        <p style="font-size:13px;color:#64748b;margin:2px 0 0">Select assets for physical verification</p>
      </div>
    </div>

    @if (step === 1) {
      <div class="form-card">
        <h2 class="section-title">Step 1: Register Type &amp; Details</h2>
        <div class="type-selector">
          @for (t of registerTypes; track t.value) {
            <button class="type-btn" [class.selected]="registerType === t.value" (click)="selectType(t.value)">
              <mat-icon [style.color]="t.color">{{t.icon}}</mat-icon>
              <span class="type-label">{{t.label}}</span>
              <span class="type-desc">{{t.description}}</span>
            </button>
          }
        </div>

        @if (registerType) {
          <div class="form-fields">
            <div class="field-row">
              <div class="field-group" style="flex:1">
                <label class="field-label">Register Name</label>
                <input class="field-input" [(ngModel)]="registerName" readonly>
              </div>
            </div>
            <div class="field-row">
              <div class="field-group" style="flex:1">
                <label class="field-label">Description</label>
                <input class="field-input" [(ngModel)]="description" maxlength="150" placeholder="Optional description">
              </div>
            </div>
            <div class="field-row">
              <div class="field-group" style="flex:1">
                <label class="field-label">Start Date *</label>
                <input type="date" class="field-input" [(ngModel)]="startDate">
                @if (!startDate && datesTouched) {
                  <span class="field-error">Start date is required</span>
                }
              </div>
              <div class="field-group" style="flex:1">
                <label class="field-label">End Date *</label>
                <input type="date" class="field-input" [(ngModel)]="endDate">
                @if (!endDate && datesTouched) {
                  <span class="field-error">End date is required</span>
                }
              </div>
            </div>
            <div style="margin-top:8px">
              <div style="font-size:13px;font-weight:600;color:#475569;margin-bottom:8px">Team Members</div>
              @if (regTeamMembers.length > 0) {
                <table style="width:100%;border-collapse:collapse;margin-bottom:12px;font-size:13px">
                  <thead>
                    <tr style="background:#f8fafc">
                      <th style="text-align:left;padding:6px 10px;border:1px solid #e2e8f0;color:#64748b">Name</th>
                      <th style="text-align:left;padding:6px 10px;border:1px solid #e2e8f0;color:#64748b">Type</th>
                      <th style="padding:6px 10px;border:1px solid #e2e8f0;width:40px"></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (m of regTeamMembers; track $index) {
                      <tr>
                        <td style="padding:6px 10px;border:1px solid #e2e8f0">{{m.displayName}}</td>
                        <td style="padding:6px 10px;border:1px solid #e2e8f0">{{m.isExternal ? 'External' : 'Internal'}}</td>
                        <td style="padding:4px;border:1px solid #e2e8f0;text-align:center">
                          <button mat-icon-button (click)="removeRegMember($index)">
                            <mat-icon style="font-size:16px;color:#ef4444">delete_outline</mat-icon>
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
              <div style="display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap">
                <label style="font-size:13px;color:#475569;display:flex;align-items:center;gap:6px;white-space:nowrap">
                  <input type="checkbox" [(ngModel)]="newRegMember.isExternal" (change)="onRegMemberExternalToggle()"> External
                </label>
                @if (newRegMember.isExternal) {
                  <div class="field-group" style="flex:1;min-width:200px">
                    <label class="field-label">Full Name</label>
                    <input class="field-input" [(ngModel)]="newRegMember.employeeName">
                  </div>
                } @else {
                  <div class="field-group" style="flex:1;min-width:200px">
                    <label class="field-label">Employee</label>
                    <select class="field-input" [(ngModel)]="newRegMember.employeeId">
                      <option [value]="null">-- Select --</option>
                      @for (emp of employees; track emp.employeeId) {
                        <option [value]="emp.employeeId">{{emp.surname}}, {{emp.firstName}}</option>
                      }
                    </select>
                  </div>
                }
                <button mat-stroked-button (click)="addRegMember()" style="gap:6px;white-space:nowrap;margin-bottom:2px">
                  <mat-icon>person_add</mat-icon> Add Member
                </button>
              </div>
            </div>
            <button mat-flat-button class="next-btn" (click)="goToStep2()" [disabled]="!registerName">
              Next: Select Assets <mat-icon>arrow_forward</mat-icon>
            </button>
          </div>
        }
      </div>
    }

    @if (step === 2) {
      <div class="form-card">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <button mat-icon-button (click)="step = 1"><mat-icon>arrow_back</mat-icon></button>
          <h2 class="section-title" style="margin:0">Step 2: Select Assets</h2>
          <span class="type-badge">{{registerType}}</span>
          <div style="flex:1"></div>
          <input type="file" accept=".csv" style="display:none" id="csv-upload-input" (change)="onCsvFileSelected($event)">
          <button mat-stroked-button (click)="triggerCsvUpload()" style="height:40px;gap:6px">
            <mat-icon>upload_file</mat-icon> Import from CSV
          </button>
          <button mat-stroked-button (click)="openMapModal()" style="height:40px;gap:6px">
            <mat-icon>map</mat-icon> Map
          </button>
        </div>

        @if (csvImportMsg) {
          <div class="csv-msg" [class.csv-error]="csvImportError">{{csvImportMsg}}</div>
        }

        <div class="filter-bar">
          <div class="field-group" style="width:200px">
            <label class="field-label">Search</label>
            <input class="field-input" [(ngModel)]="searchTerm" (keyup.enter)="loadPreview()" placeholder="Description, barcode, serial...">
          </div>
          <div class="field-group" style="width:180px">
            <label class="field-label">Asset Type</label>
            <select class="field-input" [(ngModel)]="filterAssetType" (change)="loadPreview()">
              <option [value]="null">All Types</option>
              @for (t of assetTypes; track t.assetTypeId || t.AssetType_ID) {
                <option [value]="t.assetTypeId || t.AssetType_ID">{{t.assetTypeDesc || t.AssetTypeDesc}}</option>
              }
            </select>
          </div>
          <div class="field-group" style="width:180px">
            <label class="field-label">Category</label>
            <select class="field-input" [(ngModel)]="filterCategory" (change)="loadPreview()">
              <option [value]="null">All Categories</option>
              @for (c of categories; track c.assetCategoryId || c.AssetCategoryID) {
                <option [value]="c.assetCategoryId || c.AssetCategoryID">{{c.assetCategoryDesc || c.AssetCategoryDesc}}</option>
              }
            </select>
          </div>
          <div style="display:flex;align-items:flex-end;padding-bottom:2px">
            <button mat-stroked-button (click)="loadPreview()" style="height:38px">
              <mat-icon>search</mat-icon> Filter
            </button>
          </div>
        </div>

        @if (loadingPreview) {
          <div style="text-align:center;padding:40px"><mat-spinner diameter="32"></mat-spinner></div>
        } @else {
          <div class="preview-toolbar">
            <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
              <input type="checkbox" [checked]="allSelected()" (change)="toggleSelectAll($event)">
              Select All ({{selectedIds.size}} of {{previewItems.length}} in view, {{selectedIds.size}} total selected)
            </label>
          </div>
          <div class="preview-table-wrap">
            <table class="preview-table">
              <thead>
                <tr>
                  <th style="width:40px"></th>
                  <th>ID</th>
                  <th>Description</th>
                  <th>Barcode</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th style="text-align:right">Cost</th>
                </tr>
              </thead>
              <tbody>
                @for (item of previewItems; track item.assetRegisterItemId) {
                  <tr (click)="toggleItem(item.assetRegisterItemId)">
                    <td><input type="checkbox" [checked]="selectedIds.has(item.assetRegisterItemId)" (click)="$event.stopPropagation()" (change)="toggleItem(item.assetRegisterItemId)"></td>
                    <td>{{item.assetRegisterItemId}}</td>
                    <td>{{item.description}}</td>
                    <td>{{item.barcode}}</td>
                    <td>{{item.assetTypeDesc}}</td>
                    <td>{{item.assetCategoryDesc}}</td>
                    <td>{{item.statusDesc}}</td>
                    <td style="text-align:right">{{formatCurrency(item.purchaseAmount)}}</td>
                  </tr>
                }
                @if (previewItems.length === 0) {
                  <tr><td colspan="8" style="text-align:center;padding:40px;color:#94a3b8">No matching assets found</td></tr>
                }
              </tbody>
            </table>
          </div>
          <div style="display:flex;justify-content:flex-end;margin-top:16px;gap:12px">
            <button mat-stroked-button (click)="step = 1">Back</button>
            <button mat-flat-button class="create-btn" (click)="createRegister()" [disabled]="selectedIds.size === 0 || creating">
              @if (creating) { <mat-spinner diameter="18"></mat-spinner> }
              Create Register ({{selectedIds.size}} assets)
            </button>
          </div>
        }
      </div>
    }

    @if (showMapModal) {
      <div class="modal-overlay" (click)="closeMapModal()">
        <div class="map-modal" (click)="$event.stopPropagation()">
          <div class="map-modal-header">
            <span style="font-size:15px;font-weight:600;color:#1e293b">Select Assets from Map</span>
            <div style="display:flex;align-items:center;gap:12px">
              <span style="font-size:13px;color:#64748b">{{mapSelectedCount}} selected from map</span>
              <button mat-flat-button style="background:#2563eb;color:white;height:36px" (click)="confirmMapSelection()">
                Add to Selection
              </button>
              <button mat-icon-button (click)="closeMapModal()"><mat-icon>close</mat-icon></button>
            </div>
          </div>
          <div class="map-modal-body">
            @if (mapLoading) {
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10">
                <mat-spinner diameter="40"></mat-spinner>
              </div>
            }
            <div id="verif-create-map" style="width:100%;height:100%"></div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .form-card { background:white; border:1px solid #e2e8f0; border-radius:12px; padding:24px; max-width:1100px; }
    .section-title { font-size:16px; font-weight:600; color:#1e293b; margin:0 0 16px; }
    .type-selector { display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; margin-bottom:24px; }
    .type-btn {
      display:flex; flex-direction:column; align-items:center; gap:8px;
      padding:20px 16px; border:2px solid #e2e8f0; border-radius:12px;
      background:white; cursor:pointer; transition:all 0.15s; text-align:center;
    }
    .type-btn:hover { border-color:#93c5fd; }
    .type-btn.selected { border-color:#2563eb; background:#eff6ff; }
    .type-btn mat-icon { font-size:28px; width:28px; height:28px; }
    .type-label { font-size:14px; font-weight:600; color:#1e293b; }
    .type-desc { font-size:12px; color:#64748b; }
    .form-fields { display:flex; flex-direction:column; gap:12px; }
    .field-row { display:flex; gap:12px; }
    .field-group { display:flex; flex-direction:column; gap:4px; }
    .field-label { font-size:12px; font-weight:600; color:#475569; }
    .field-input {
      height:38px; border:1px solid #cbd5e1; border-radius:6px; padding:0 10px;
      font-size:13px; color:#1e293b; background:white; width:100%; box-sizing:border-box;
    }
    .field-input:focus { outline:none; border-color:#2563eb; }
    .field-error { font-size:12px; color:#dc2626; margin-top:2px; }
    .next-btn {
      background:#2563eb; color:white; border-radius:8px; align-self:flex-end;
      display:flex; align-items:center; gap:6px;
    }
    .next-btn mat-icon { font-size:18px; width:18px; height:18px; }
    .type-badge { font-size:11px; font-weight:600; padding:4px 10px; border-radius:6px; background:#dbeafe; color:#1d4ed8; }
    .filter-bar { display:flex; gap:12px; flex-wrap:wrap; align-items:flex-end; margin-bottom:12px; }
    .preview-toolbar { margin-bottom:8px; }
    .preview-table-wrap { max-height:400px; overflow:auto; border:1px solid #e2e8f0; border-radius:8px; }
    .preview-table { width:100%; border-collapse:collapse; font-size:13px; }
    .preview-table th { background:#f8fafc; padding:10px 12px; text-align:left; font-weight:600; color:#475569; position:sticky; top:0; z-index:1; border-bottom:1px solid #e2e8f0; }
    .preview-table td { padding:8px 12px; border-bottom:1px solid #f1f5f9; }
    .preview-table tr:hover { background:#f8fafc; cursor:pointer; }
    .create-btn { background:#16a34a; color:white; border-radius:8px; display:flex; align-items:center; gap:8px; }
    .csv-msg { padding:8px 12px; border-radius:6px; background:#dcfce7; color:#15803d; font-size:13px; margin-bottom:12px; }
    .csv-msg.csv-error { background:#fee2e2; color:#b91c1c; }
    .modal-overlay {
      position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:1000;
      display:flex; align-items:center; justify-content:center;
    }
    .map-modal {
      background:white; border-radius:12px; width:90vw; max-width:1100px;
      height:80vh; display:flex; flex-direction:column; overflow:hidden;
    }
    .map-modal-header {
      display:flex; align-items:center; justify-content:space-between;
      padding:12px 16px; border-bottom:1px solid #e2e8f0;
    }
    .map-modal-body { flex:1; position:relative; }
  `]
})
export class RegisterCreateComponent implements OnInit, OnDestroy {
  step = 1;
  registerType = '';
  registerName = '';
  description = '';
  startDate: string = '';
  endDate: string = '';
  datesTouched: boolean = false;
  regTeamMembers: any[] = [];
  newRegMember: any = { isExternal: false, employeeId: null, employeeName: '' };

  registerTypes = [
    { value: 'Infrastructure', label: 'Infrastructure', icon: 'domain', color: '#2563eb', description: 'Roads, water, sewer, electricity networks' },
    { value: 'Non-Infrastructure', label: 'Non-Infrastructure', icon: 'devices', color: '#d97706', description: 'Vehicles, equipment, furniture, IT assets' },
    { value: 'Custom', label: 'Custom', icon: 'tune', color: '#7c3aed', description: 'Custom selection of any asset type' }
  ];

  employees: any[] = [];
  previewItems: any[] = [];
  selectedIds = new Set<number>();
  loadingPreview = false;
  creating = false;
  searchTerm = '';
  filterAssetType: number | null = null;
  filterCategory: number | null = null;

  assetTypes: any[] = [];
  categories: any[] = [];

  csvImportMsg = '';
  csvImportError = false;
  csvImporting = false;

  showMapModal = false;
  mapLoading = false;
  mapSelectedCount = 0;
  private pendingMapIds = new Set<number>();
  private leafletMap: any = null;
  private L: any = null;

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.api.getAssetTypes().subscribe({ next: function(this: RegisterCreateComponent, d: any[]) { this.assetTypes = d; }.bind(this) });
    this.api.getAssetCategoriesList().subscribe({ next: function(this: RegisterCreateComponent, d: any[]) { this.categories = d; }.bind(this) });
    this.api.getEmployees().subscribe({ next: function(this: RegisterCreateComponent, d: any[]) { this.employees = d; }.bind(this) });
  }

  ngOnDestroy() {
    this.destroyMap();
  }

  selectType(type: string) {
    this.registerType = type;
    this.api.generateVerificationName(type).subscribe({
      next: function(this: RegisterCreateComponent, res: any) { this.registerName = res.name; }.bind(this)
    });
  }

  goToStep2() {
    this.datesTouched = true;
    if (!this.startDate || !this.endDate) return;
    this.step = 2;
    this.loadPreview();
  }

  loadPreview() {
    this.loadingPreview = true;
    var params: any = { registerType: this.registerType };
    if (this.searchTerm) params.search = this.searchTerm;
    if (this.filterAssetType) params.assetTypeId = this.filterAssetType;
    if (this.filterCategory) params.categoryId = this.filterCategory;
    this.api.getVerificationPreviewItems(params).subscribe({
      next: function(this: RegisterCreateComponent, data: any[]) {
        this.previewItems = data;
        this.selectedIds = new Set(data.map(function(i: any) { return i.assetRegisterItemId; }));
        this.loadingPreview = false;
      }.bind(this),
      error: function(this: RegisterCreateComponent) { this.loadingPreview = false; }.bind(this)
    });
  }

  allSelected(): boolean { return this.previewItems.length > 0 && this.selectedIds.size === this.previewItems.length; }
  someSelected(): boolean { return this.selectedIds.size > 0 && this.selectedIds.size < this.previewItems.length; }

  toggleSelectAll(event: any) {
    if (event.target.checked) {
      this.selectedIds = new Set(this.previewItems.map(function(i: any) { return i.assetRegisterItemId; }));
    } else {
      this.selectedIds.clear();
    }
  }

  toggleItem(id: number) {
    if (this.selectedIds.has(id)) { this.selectedIds.delete(id); } else { this.selectedIds.add(id); }
  }

  triggerCsvUpload() {
    var el = document.getElementById('csv-upload-input') as HTMLInputElement;
    if (el) { el.value = ''; el.click(); }
  }

  onCsvFileSelected(event: Event) {
    var input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    var file = input.files[0];
    var self = this;
    self.csvImporting = true;
    self.csvImportMsg = 'Reading CSV...';
    self.csvImportError = false;
    var reader = new FileReader();
    reader.onload = function(e: any) {
      var content: string = e.target.result;
      var lines = content.split('\n').map(function(l: string) { return l.replace(/\r$/, ''); });
      if (lines.length < 2) {
        self.csvImportMsg = 'CSV must have a header row and at least one data row.';
        self.csvImportError = true;
        self.csvImporting = false;
        return;
      }
      var values: string[] = [];
      for (var i = 1; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line) continue;
        var firstCell = '';
        if (line.startsWith('"')) {
          var end = line.indexOf('"', 1);
          firstCell = end > 0 ? line.substring(1, end) : line.substring(1);
        } else {
          firstCell = line.split(',')[0];
        }
        firstCell = firstCell.trim();
        if (firstCell) values.push(firstCell);
      }
      if (values.length === 0) {
        self.csvImportMsg = 'No asset IDs/barcodes found in the first column.';
        self.csvImportError = true;
        self.csvImporting = false;
        return;
      }
      self.api.matchCsvAssets(values).subscribe({
        next: function(matched: any[]) {
          var added = 0;
          matched.forEach(function(m: any) {
            if (!self.selectedIds.has(m.assetRegisterItemId)) {
              self.selectedIds.add(m.assetRegisterItemId);
              added++;
            }
          });
          self.csvImportMsg = 'CSV matched ' + matched.length + ' asset(s); ' + added + ' newly added to selection. ' + (values.length - matched.length) + ' not found or already in active registers.';
          self.csvImportError = false;
          self.csvImporting = false;
        },
        error: function() {
          self.csvImportMsg = 'Failed to match CSV assets. Please try again.';
          self.csvImportError = true;
          self.csvImporting = false;
        }
      });
    };
    reader.readAsText(file);
  }

  openMapModal() {
    this.showMapModal = true;
    this.pendingMapIds = new Set<number>();
    this.mapSelectedCount = 0;
    this.mapLoading = true;
    var self = this;
    setTimeout(function() { self.initMap(); }, 100);
  }

  closeMapModal() {
    this.showMapModal = false;
    this.destroyMap();
  }

  confirmMapSelection() {
    var added = 0;
    var pendingArr = Array.from(this.pendingMapIds);
    for (var i = 0; i < pendingArr.length; i++) {
      var id = pendingArr[i];
      if (!this.selectedIds.has(id)) { this.selectedIds.add(id); added++; }
    }
    this.closeMapModal();
    if (added > 0) {
      this.csvImportMsg = added + ' asset(s) added from map selection.';
      this.csvImportError = false;
    }
  }

  private initMap() {
    var self = this;
    var mapItems = this.previewItems.filter(function(i: any) {
      return i.latitude != null && i.longitude != null &&
             i.latitude !== '' && i.longitude !== '';
    });

    import('leaflet').then(function(leafletModule: any) {
      self.L = leafletModule.default || leafletModule;
      var L = self.L;
      var container = document.getElementById('verif-create-map');
      if (!container) { self.mapLoading = false; return; }

      self.leafletMap = L.map(container, { preferCanvas: true }).setView([-31.5, 26.0], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 19
      }).addTo(self.leafletMap);

      var bounds: any[] = [];
      mapItems.forEach(function(item: any) {
        var lat = parseFloat(item.latitude);
        var lng = parseFloat(item.longitude);
        if (isNaN(lat) || isNaN(lng)) return;
        bounds.push([lat, lng]);
        var marker = L.circleMarker([lat, lng], {
          radius: 8, fillColor: '#2563eb', color: '#1d4ed8', weight: 1.5,
          opacity: 1, fillOpacity: 0.8
        }).addTo(self.leafletMap);
        var isAlreadySelected = self.selectedIds.has(item.assetRegisterItemId);
        var isPendingSelected = self.pendingMapIds.has(item.assetRegisterItemId);
        var costStr = item.purchaseAmount != null ? 'R ' + parseFloat(item.purchaseAmount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : 'N/A';
        var popupContent = '<div style="font-family:Inter,sans-serif;min-width:220px;padding:4px">' +
          '<div style="font-weight:700;font-size:13px;color:#1e293b;margin-bottom:2px">' + (item.description || 'Asset') + '</div>' +
          '<div style="font-size:11px;color:#64748b;margin-bottom:8px">Asset ID: ' + item.assetRegisterItemId + '</div>' +
          '<div style="display:grid;grid-template-columns:auto 1fr;gap:3px 10px;font-size:12px;margin-bottom:8px">' +
            '<div style="color:#94a3b8">Type:</div><div style="font-weight:500">' + (item.assetTypeDesc || 'N/A') + '</div>' +
            '<div style="color:#94a3b8">Category:</div><div style="font-weight:500">' + (item.assetCategoryDesc || 'N/A') + '</div>' +
            '<div style="color:#94a3b8">Barcode:</div><div style="font-weight:500;font-family:monospace">' + (item.barcode || 'N/A') + '</div>' +
            '<div style="color:#94a3b8">Status:</div><div style="font-weight:500">' + (item.statusDesc || 'N/A') + '</div>' +
            '<div style="color:#94a3b8">Cost:</div><div style="font-weight:500;color:#0f2b46">' + costStr + '</div>' +
          '</div>' +
          (isAlreadySelected ? '<div style="font-size:11px;color:#16a34a;margin-bottom:6px;background:#f0fdf4;padding:3px 8px;border-radius:4px;display:inline-block">&#x2713; Already in selection</div><br>' : '') +
          '<button id="map-sel-' + item.assetRegisterItemId + '" style="margin-top:4px;padding:5px 14px;background:' + (isPendingSelected ? '#16a34a' : '#2563eb') + ';color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:500">' + (isPendingSelected ? '&#x2713; Selected' : 'Select') + '</button>' +
          '</div>';
        marker.bindPopup(popupContent);
        marker.on('popupopen', function() {
          var btn = document.getElementById('map-sel-' + item.assetRegisterItemId) as HTMLButtonElement;
          if (btn) {
            btn.onclick = function() {
              if (self.pendingMapIds.has(item.assetRegisterItemId)) {
                self.pendingMapIds.delete(item.assetRegisterItemId);
                marker.setStyle({ fillColor: '#2563eb' });
                btn.textContent = 'Select';
                btn.style.background = '#2563eb';
              } else {
                self.pendingMapIds.add(item.assetRegisterItemId);
                marker.setStyle({ fillColor: '#16a34a' });
                btn.textContent = '\u2713 Selected';
                btn.style.background = '#16a34a';
              }
              self.mapSelectedCount = self.pendingMapIds.size;
            };
          }
        });
      });

      if (bounds.length > 0) {
        self.leafletMap.fitBounds(bounds, { padding: [30, 30] });
      }
      self.mapLoading = false;
    }).catch(function() { self.mapLoading = false; });
  }

  private destroyMap() {
    if (this.leafletMap) {
      this.leafletMap.remove();
      this.leafletMap = null;
    }
  }

  onRegMemberExternalToggle() {
    this.newRegMember.employeeId = null;
    this.newRegMember.employeeName = '';
  }

  addRegMember() {
    if (this.newRegMember.isExternal) {
      if (!(this.newRegMember.employeeName || '').trim()) return;
      this.regTeamMembers.push({ isExternal: true, employeeId: null, employeeName: this.newRegMember.employeeName.trim(), displayName: this.newRegMember.employeeName.trim() });
    } else {
      if (!this.newRegMember.employeeId) return;
      var emp = null;
      for (var i = 0; i < this.employees.length; i++) {
        if (this.employees[i].employeeId === this.newRegMember.employeeId) { emp = this.employees[i]; break; }
      }
      var already = false;
      for (var j = 0; j < this.regTeamMembers.length; j++) {
        if (!this.regTeamMembers[j].isExternal && this.regTeamMembers[j].employeeId === this.newRegMember.employeeId) { already = true; break; }
      }
      if (already) return;
      var name = emp ? (emp.surname + ', ' + emp.firstName) : String(this.newRegMember.employeeId);
      this.regTeamMembers.push({ isExternal: false, employeeId: this.newRegMember.employeeId, employeeName: name, displayName: name });
    }
    this.newRegMember = { isExternal: false, employeeId: null, employeeName: '' };
  }

  removeRegMember(index: number) {
    this.regTeamMembers.splice(index, 1);
  }

  createRegister() {
    this.datesTouched = true;
    if (!this.startDate || !this.endDate) return;
    this.creating = true;
    var regData: any = {
      registerName: this.registerName,
      registerType: this.registerType,
      description: this.description,
      startDate: this.startDate,
      endDate: this.endDate
    };

    this.api.createVerificationRegister(regData).subscribe({
      next: function(this: RegisterCreateComponent, res: any) {
        var registerId = res.verificationRegisterId;
        var self = this;
        var members = self.regTeamMembers.slice();
        var addNext = function(idx: number) {
          if (idx >= members.length) {
            var ids = Array.from(self.selectedIds);
            self.api.createVerificationItems(registerId, ids).subscribe({
              next: function() {
                self.creating = false;
                self.router.navigate(['/verification/register', registerId]);
              },
              error: function() { self.creating = false; alert('Failed to add items to register'); }
            });
            return;
          }
          var m = members[idx];
          self.api.addRegisterTeamMember(registerId, { employeeId: m.isExternal ? null : m.employeeId, employeeName: m.isExternal ? m.employeeName : null, isExternal: m.isExternal ? 1 : 0 }).subscribe({
            next: function() { addNext(idx + 1); },
            error: function() { addNext(idx + 1); }
          });
        };
        addNext(0);
      }.bind(this),
      error: function(this: RegisterCreateComponent, err: any) {
        this.creating = false;
        alert('Error creating register: ' + (err.error?.error || 'Unknown error'));
      }.bind(this)
    });
  }

  formatCurrency(val: any): string {
    if (val == null || val === '') return '--';
    var n = parseFloat(val);
    if (isNaN(n)) return '--';
    return 'R ' + n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
