import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import * as XLSX from 'xlsx';
import { ApiService } from '../../../core/api.service';

interface ReportType {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  usesClassFilter: boolean;
}

const REPORT_TYPES: ReportType[] = [
  { id: 'verified',           label: 'Verified Assets',       description: 'Assets where verification has been completed',          icon: 'check_circle',   color: '#16a34a', usesClassFilter: true  },
  { id: 'unverified',         label: 'Unverified Assets',     description: 'Assets that have not yet been verified',                icon: 'pending',        color: '#d97706', usesClassFilter: true  },
  { id: 'newly-added',        label: 'Newly Added Assets',    description: 'Assets identified as newly added during verification',  icon: 'add_circle',     color: '#2563eb', usesClassFilter: false },
  { id: 'not-found',          label: 'Assets Not Found',      description: 'Assets that could not be located during verification',  icon: 'search_off',     color: '#dc2626', usesClassFilter: false },
  { id: 'completed-projects', label: 'Completed Projects',    description: 'Assets identified as completed capital projects',       icon: 'assignment_turned_in', color: '#7c3aed', usesClassFilter: false },
  { id: 'asset-removed',      label: 'Assets Removed',        description: 'Assets identified for removal from the register',      icon: 'remove_circle',  color: '#9f1239', usesClassFilter: false },
  { id: 'flagged-revisit',    label: 'Flagged for Revisit',   description: 'Assets that require a follow-up verification visit',   icon: 'flag',           color: '#b45309', usesClassFilter: false },
];

const REPORT_COLUMNS = [
  { key: 'verificationItemId',         label: 'Verification Item ID' },
  { key: 'verificationRegisterId',     label: 'Register ID' },
  { key: 'assetRegisterItemId',        label: 'Asset Register Item ID' },
  { key: 'municipalAssetId',           label: 'Municipal Asset ID' },
  { key: 'description',                label: 'Description' },
  { key: 'barcode',                    label: 'Barcode' },
  { key: 'oldBarCode',                 label: 'Old Barcode' },
  { key: 'serialNumber',               label: 'Serial No.' },
  { key: 'registrationNumber',         label: 'Reg. Number' },
  { key: 'parentAssetRegisterItemId',  label: 'Parent Asset ID' },
  { key: 'mainAssetId',                label: 'Main Asset ID' },
  { key: 'mainAssetDescription',       label: 'Main Asset Description' },
  { key: 'make',                        label: 'Make' },
  { key: 'model',                       label: 'Model' },
  { key: 'assetTypeDesc',              label: 'Asset Type' },
  { key: 'assetCategoryDesc',          label: 'Category' },
  { key: 'assetSubCategoryDesc',       label: 'Sub-Category' },
  { key: 'assetClassDesc',             label: 'Asset Class' },
  { key: 'infraOrNonInfra',            label: 'Infra / Non-Infra' },
  { key: 'measurementTypeDesc',        label: 'Measurement Type' },
  { key: 'uomDesc',                    label: 'Unit of Measure' },
  { key: 'dim1',                        label: 'Dim 1' },
  { key: 'dim2',                        label: 'Dim 2' },
  { key: 'dim3',                        label: 'Dim 3' },
  { key: 'quantity',                    label: 'Quantity' },
  { key: 'diameter',                    label: 'Diameter' },
  { key: 'capacity',                    label: 'Capacity' },
  { key: 'conditionDesc',              label: 'Condition' },
  { key: 'statusDesc',                 label: 'Status' },
  { key: 'townDesc',                    label: 'Town' },
  { key: 'suburbDesc',                  label: 'Suburb' },
  { key: 'wardDesc',                    label: 'Ward' },
  { key: 'streetDesc',                  label: 'Street' },
  { key: 'buildingDesc',               label: 'Building' },
  { key: 'floorDesc',                   label: 'Floor' },
  { key: 'roomDesc',                    label: 'Room' },
  { key: 'zoningDesc',                  label: 'Zoning' },
  { key: 'erfNumber',                   label: 'Erf Number' },
  { key: 'erfSizeM2',                   label: 'Erf Size (m²)' },
  { key: 'portionNumber',               label: 'Portion Number' },
  { key: 'unitNumber',                  label: 'Unit Number' },
  { key: 'floorArea',                   label: 'Floor Area (m²)' },
  { key: 'latitude',                    label: 'Latitude' },
  { key: 'longitude',                   label: 'Longitude' },
  { key: 'gpsCoordinates',             label: 'GPS Coordinates' },
  { key: 'departmentDesc',             label: 'Department' },
  { key: 'divisionName',               label: 'Division' },
  { key: 'custodianName',              label: 'Custodian' },
  { key: 'custodianIdNumber',          label: 'Custodian ID No.' },
  { key: 'assetOwnershipDesc',         label: 'Ownership' },
  { key: 'basicMunicipalityServiceDesc', label: 'Municipal Service' },
  { key: 'purchaseAmount',             label: 'Purchase Amount' },
  { key: 'carryingAmount',             label: 'Carrying Amount' },
  { key: 'assetFound',                 label: 'Asset Found' },
  { key: 'keepOnRegisterDispose',      label: 'Keep / Dispose' },
  { key: 'revisit',                     label: 'Revisit' },
  { key: 'reasonForRevisit',           label: 'Reason for Revisit' },
  { key: 'verificationFlag',           label: 'Verification Flag' },
  { key: 'verificationDoneByName',     label: 'Verified By' },
  { key: 'verificationDate',           label: 'Verification Date' },
  { key: 'verificationComments',       label: 'Comments' },
];

@Component({
  selector: 'app-verification-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule],
  template: `
    <div style="margin-bottom:24px">
      <h1 style="font-size:24px;font-weight:700;color:#1e293b;margin:0 0 4px">Verification Reports</h1>
      <p style="font-size:14px;color:#64748b;margin:0">Generate and export reports from asset verification registers</p>
    </div>

    <!-- Filter Panel -->
    <div style="background:white;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px">
      <h2 style="font-size:15px;font-weight:700;color:#1e293b;margin:0 0 16px">Report Filters</h2>

      <!-- Register selector -->
      <div style="margin-bottom:20px">
        <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">
          Verification Register <span style="color:#dc2626">*</span>
        </label>
        @if (loadingRegisters()) {
          <span style="font-size:13px;color:#94a3b8">Loading registers…</span>
        } @else {
          <select [(ngModel)]="selectedRegisterId" (ngModelChange)="onRegisterChange()"
            style="padding:8px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:13px;width:420px;max-width:100%;background:white;color:#1e293b">
            <option [ngValue]="null">-- Select a register --</option>
            @for (reg of registers(); track reg.verificationRegisterId) {
              <option [ngValue]="reg.verificationRegisterId">{{reg.registerName}}</option>
            }
          </select>
        }
      </div>

      <!-- Report type cards -->
      <div style="margin-bottom:20px">
        <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:10px">Report Type</label>
        <div style="display:flex;flex-wrap:wrap;gap:10px">
          @for (rt of reportTypes; track rt.id) {
            <div (click)="selectReportType(rt.id)"
              style="cursor:pointer;border:2px solid;border-radius:10px;padding:10px 14px;min-width:160px;max-width:200px;transition:all .15s"
              [style.border-color]="selectedReportType === rt.id ? rt.color : '#e2e8f0'"
              [style.background]="selectedReportType === rt.id ? rt.color + '18' : '#f8fafc'">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                <mat-icon [style.color]="rt.color" style="font-size:16px;width:16px;height:16px">{{rt.icon}}</mat-icon>
                <span style="font-size:13px;font-weight:700" [style.color]="rt.color">{{rt.label}}</span>
              </div>
              <p style="font-size:11px;color:#64748b;margin:0;line-height:1.4">{{rt.description}}</p>
            </div>
          }
        </div>
      </div>

      <!-- Asset Class filter (Verified / Unverified only) -->
      @if (showClassFilter()) {
        <div style="margin-bottom:20px">
          <label style="font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px">
            Asset Class
            <span style="font-weight:400;color:#94a3b8;margin-left:6px">(optional — leave blank for all classes)</span>
          </label>
          @if (loadingClasses()) {
            <span style="font-size:13px;color:#94a3b8">Loading classes…</span>
          } @else {
            <div style="display:flex;flex-wrap:wrap;gap:8px;max-height:140px;overflow-y:auto;padding:4px 0">
              @for (cls of assetClasses(); track cls.assetClassId) {
                <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:#374151;cursor:pointer;padding:4px 8px;border:1px solid #e2e8f0;border-radius:6px;background:#f8fafc">
                  <input type="checkbox" [checked]="isClassSelected(cls.assetClassId)"
                    (change)="toggleClass(cls.assetClassId)"
                    style="cursor:pointer">
                  {{cls.assetClassDesc}}
                </label>
              }
            </div>
          }
        </div>
      }

      <!-- Generate button -->
      <div style="display:flex;gap:10px;align-items:center">
        <button (click)="generateReport()"
          [disabled]="!selectedRegisterId || !selectedReportType || loading()"
          style="display:flex;align-items:center;gap:6px;padding:9px 20px;background:#2563eb;color:white;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;opacity:1"
          [style.opacity]="(!selectedRegisterId || !selectedReportType || loading()) ? '0.5' : '1'"
          [style.cursor]="(!selectedRegisterId || !selectedReportType || loading()) ? 'not-allowed' : 'pointer'">
          <mat-icon style="font-size:16px;width:16px;height:16px">bar_chart</mat-icon>
          @if (loading()) { Generating… } @else { Generate Report }
        </button>
        @if (errorMsg()) {
          <span style="font-size:13px;color:#dc2626">{{errorMsg()}}</span>
        }
      </div>
    </div>

    <!-- Results -->
    @if (reportGenerated()) {
      <div style="background:white;border:1px solid #e2e8f0;border-radius:12px;padding:0;overflow:hidden">
        <!-- Header bar -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #e2e8f0">
          <div>
            <h3 style="font-size:15px;font-weight:700;color:#1e293b;margin:0 0 2px">{{reportTitle()}}</h3>
            <p style="font-size:13px;color:#64748b;margin:0">{{reportData().length}} record(s) &nbsp;|&nbsp; {{reportRegisterName()}}</p>
          </div>
          <div style="display:flex;gap:8px">
            <button (click)="exportExcel()"
              [disabled]="reportData().length === 0"
              style="display:flex;align-items:center;gap:5px;padding:7px 14px;background:#16a34a;color:white;border:none;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer">
              <mat-icon style="font-size:15px;width:15px;height:15px">table_chart</mat-icon>
              Export Excel
            </button>
            <button (click)="exportCsv()"
              [disabled]="reportData().length === 0"
              style="display:flex;align-items:center;gap:5px;padding:7px 14px;background:#0891b2;color:white;border:none;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer">
              <mat-icon style="font-size:15px;width:15px;height:15px">file_download</mat-icon>
              Export CSV
            </button>
          </div>
        </div>

        <!-- Table -->
        @if (reportData().length === 0) {
          <div style="padding:40px;text-align:center;color:#94a3b8;font-size:14px">
            No records found for the selected filters.
          </div>
        } @else {
          <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;font-size:13px">
              <thead>
                <tr style="background:#f8fafc">
                  <th style="padding:10px 12px;text-align:left;font-weight:700;color:#374151;border-bottom:1px solid #e2e8f0;white-space:nowrap">#</th>
                  @for (col of columns; track col.key) {
                    <th style="padding:10px 12px;text-align:left;font-weight:700;color:#374151;border-bottom:1px solid #e2e8f0;white-space:nowrap">{{col.label}}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (item of reportData(); track item.verificationItemId; let i = $index) {
                  <tr [style.background]="i % 2 === 0 ? 'white' : '#f8fafc'">
                    <td style="padding:8px 12px;color:#94a3b8;white-space:nowrap">{{i + 1}}</td>
                    @for (col of columns; track col.key) {
                      <td style="padding:8px 12px;color:#374151;white-space:nowrap;max-width:200px;overflow:hidden;text-overflow:ellipsis">
                        @if (col.key === 'verificationFlag') {
                          <span [style.color]="getFlagColor(item[col.key])">{{item[col.key] || 'Not Started'}}</span>
                        } @else if (col.key === 'verificationDate') {
                          {{formatDate(item[col.key])}}
                        } @else {
                          {{item[col.key] || '--'}}
                        }
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    }
  `
})
export class VerificationReportsComponent implements OnInit {
  reportTypes = REPORT_TYPES;
  columns = REPORT_COLUMNS;

  registers = signal<any[]>([]);
  assetClasses = signal<any[]>([]);
  reportData = signal<any[]>([]);

  loadingRegisters = signal(false);
  loadingClasses = signal(false);
  loading = signal(false);
  reportGenerated = signal(false);
  errorMsg = signal('');
  showClassFilter = signal(false);

  selectedRegisterId: number | null = null;
  selectedReportType: string = '';
  selectedClassIds: number[] = [];
  reportTitle = signal('');
  reportRegisterName = signal('');

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit() {
    var self = this;
    self.loadingRegisters.set(true);
    self.api.getVerificationRegisters().subscribe({
      next: function(regs) { self.registers.set(regs || []); self.loadingRegisters.set(false); },
      error: function() { self.loadingRegisters.set(false); }
    });
    self.loadingClasses.set(true);
    self.api.getAssetClassesList().subscribe({
      next: function(res) {
        var list = Array.isArray(res) ? res : (res && res.data ? res.data : []);
        self.assetClasses.set(list);
        self.loadingClasses.set(false);
      },
      error: function() { self.loadingClasses.set(false); }
    });
  }

  onRegisterChange() {
    this.reportGenerated.set(false);
    this.reportData.set([]);
    this.errorMsg.set('');
  }

  selectReportType(typeId: string) {
    var self = this;
    self.selectedReportType = typeId;
    var rt = REPORT_TYPES.find(function(r) { return r.id === typeId; });
    self.showClassFilter.set(rt ? rt.usesClassFilter : false);
    if (!rt || !rt.usesClassFilter) { self.selectedClassIds = []; }
    self.reportGenerated.set(false);
    self.reportData.set([]);
    self.errorMsg.set('');
  }

  isClassSelected(classId: number): boolean {
    return this.selectedClassIds.indexOf(classId) >= 0;
  }

  toggleClass(classId: number) {
    var idx = this.selectedClassIds.indexOf(classId);
    if (idx >= 0) {
      this.selectedClassIds.splice(idx, 1);
    } else {
      this.selectedClassIds.push(classId);
    }
  }

  generateReport() {
    var self = this;
    if (!self.selectedRegisterId || !self.selectedReportType) return;
    self.loading.set(true);
    self.errorMsg.set('');
    self.reportGenerated.set(false);
    var params: any = {
      registerId: self.selectedRegisterId,
      reportType: self.selectedReportType,
    };
    var rt = REPORT_TYPES.find(function(r) { return r.id === self.selectedReportType; });
    if (rt && rt.usesClassFilter && self.selectedClassIds.length > 0) {
      params.assetClassIds = self.selectedClassIds;
    }
    var reg = self.registers().find(function(r: any) { return r.verificationRegisterId === self.selectedRegisterId; });
    self.reportRegisterName.set(reg ? reg.registerName : '');
    self.reportTitle.set(rt ? rt.label : self.selectedReportType);
    self.api.getVerificationReport(params).subscribe({
      next: function(data) {
        self.reportData.set(data || []);
        self.reportGenerated.set(true);
        self.loading.set(false);
      },
      error: function(err) {
        self.loading.set(false);
        self.errorMsg.set('Failed to generate report. Please try again.');
        console.error('Verification report error', err);
      }
    });
  }

  getFlagColor(flag: string): string {
    if (!flag || flag === 'Not Started') return '#94a3b8';
    if (flag === 'In Progress') return '#d97706';
    if (flag === 'Completed') return '#16a34a';
    if (flag === 'Queried') return '#dc2626';
    if (flag === 'Approved') return '#2563eb';
    return '#374151';
  }

  formatDate(val: any): string {
    if (!val) return '--';
    var d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  exportExcel() {
    var self = this;
    var data = self.reportData();
    if (!data || data.length === 0) return;
    var headers = self.columns.map(function(c) { return c.label; });
    var wsData: any[][] = [headers];
    for (var ri = 0; ri < data.length; ri++) {
      var row: any[] = [];
      for (var ci = 0; ci < self.columns.length; ci++) {
        var key = self.columns[ci].key;
        var val = data[ri][key];
        if (key === 'verificationDate') {
          row.push(val ? self.formatDate(val) : '');
        } else {
          row.push(val !== null && val !== undefined ? val : '');
        }
      }
      wsData.push(row);
    }
    var ws = XLSX.utils.aoa_to_sheet(wsData);
    var colWidths: any[] = [];
    for (var wi = 0; wi < self.columns.length; wi++) { colWidths.push({ wch: 20 }); }
    ws['!cols'] = colWidths;
    var wb = XLSX.utils.book_new();
    var rt = REPORT_TYPES.find(function(r) { return r.id === self.selectedReportType; });
    var sheetName = rt ? rt.label.substring(0, 31) : 'Verification Report';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    var fileName = 'verification_' + (self.selectedReportType || 'report') + '_' + new Date().toISOString().split('T')[0] + '.xlsx';
    XLSX.writeFile(wb, fileName);
    self.snackBar.open('Exported ' + data.length + ' records to Excel', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }

  exportCsv() {
    var self = this;
    var data = self.reportData();
    if (!data || data.length === 0) return;
    var lines: string[] = [];
    lines.push(self.columns.map(function(c) { return '"' + c.label.replace(/"/g, '""') + '"'; }).join(','));
    for (var ri = 0; ri < data.length; ri++) {
      var cells: string[] = [];
      for (var ci = 0; ci < self.columns.length; ci++) {
        var key = self.columns[ci].key;
        var val = data[ri][key];
        if (key === 'verificationDate') { val = val ? self.formatDate(val) : ''; }
        if (val === null || val === undefined || val === '') { cells.push(''); }
        else { cells.push('"' + String(val).replace(/"/g, '""') + '"'); }
      }
      lines.push(cells.join(','));
    }
    var csv = lines.join('\r\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'verification_' + (self.selectedReportType || 'report') + '_' + new Date().toISOString().split('T')[0] + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    self.snackBar.open('Exported ' + data.length + ' records to CSV', 'OK', { duration: 3000, horizontalPosition: 'end', verticalPosition: 'top' });
  }
}
