import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { IndigentService } from '../../services/indigent.service';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { formatDate } from '../../services/format.service';
import { getStatusBadgeClass } from './shared/status-badge.util';
import { ApplicationDetailViewComponent } from './shared/application-detail-view.component';
import { DateInputComponent } from '../../shared/components/date-input.component';
import type { IndigentRegisterItem, IndigentType } from '../../models/indigent.models';

@Component({
  selector: 'app-indigent-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ApplicationDetailViewComponent, DateInputComponent],
  templateUrl: './indigent-register.component.html',
  styleUrl: './indigent-register.component.css'
})
export class IndigentRegisterComponent implements OnInit {
  register = signal<IndigentRegisterItem[]>([]);
  totalCount = signal(0);
  loading = signal(true);
  indigentTypes = signal<IndigentType[]>([]);
  towns = signal<{ id: string; name: string }[]>([]);

  page = 1;
  pageSize = 25;
  pageSizeOptions = [25, 50, 100];
  filterStatus = '';
  filterType = '';
  filterTown = '';
  searchText = '';
  exporting = signal(false);
  submitting = signal(false);

  dncModalOpen = false;
  dncItem: IndigentRegisterItem | null = null;
  dncDate = '';
  dncReason = '';

  selectedApplicationId = signal<number | null>(null);

  statusOptions = ['Application', 'Re-Application', 'Awaiting Verification', 'Verification Authorisation', 'Verification Disqualify', 'Awaiting Authorisation', 'Active', 'Application Cancelled', 'Application Declined', 'Disqualified Authorisation', 'Termination Authorisation', 'Termination', 'Re-Application Expiry'];

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  constructor(
    private svc: IndigentService,
    private api: ApiService,
    private auth: AuthService,
    private toast: ToastService,
  ) {}

  private get userId(): number { return this.auth.user()?.user_ID || 0; }

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    if (params['status']) {
      this.filterStatus = params['status'];
    }
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      const [regRes, typesRes, townsRes] = await Promise.allSettled([
        firstValueFrom(this.svc.getIndigentRegister({
          status: this.filterStatus || undefined,
          indigentTypeId: this.filterType ? Number(this.filterType) : undefined,
          town: this.filterTown || undefined,
          page: this.page,
          pageSize: this.pageSize,
          search: this.searchText || undefined,
        })),
        firstValueFrom(this.svc.getIndigentTypes()),
        firstValueFrom(this.api.get<{ id: string; name: string }[]>('/api/platinum/billing-debt/towns')),
      ]);
      if (regRes.status === 'fulfilled') {
        const res = regRes.value;
        this.register.set(Array.isArray(res) ? res : (res?.items || res?.data || []));
        this.totalCount.set(Array.isArray(res) ? res.length : (res?.totalCount || 0));
      } else {
        this.toast.show('Failed to load indigent register', 'error');
        console.error('[indigent-register] register fetch failed:', (regRes as PromiseRejectedResult).reason);
      }
      if (typesRes.status === 'fulfilled') this.indigentTypes.set(Array.isArray(typesRes.value) ? typesRes.value : []);
      else console.warn('[indigent-register] types fetch failed:', (typesRes as PromiseRejectedResult).reason);
      if (townsRes.status === 'fulfilled') this.towns.set(Array.isArray(townsRes.value) ? townsRes.value : []);
      else console.warn('[indigent-register] towns fetch failed:', (townsRes as PromiseRejectedResult).reason);
    } catch (err: any) {
      this.toast.show('Failed to load indigent register data', 'error');
      console.error('[indigent-register] loadData error:', err);
    } finally {
      this.loading.set(false);
    }
  }

  get totalPages(): number { return Math.max(1, Math.ceil(this.totalCount() / this.pageSize)); }
  fmtDate(val: string | null | undefined): string { return formatDate(val); }
  fmtCurrency(val: number): string { return 'R ' + (val ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  onFilterChange(): void { this.page = 1; this.loadData(); }
  onSearch(): void { this.page = 1; this.loadData(); }
  onPageSizeChange(): void { this.page = 1; this.loadData(); }
  clearFilters(): void { this.filterStatus = ''; this.filterType = ''; this.filterTown = ''; this.searchText = ''; this.page = 1; this.loadData(); }
  prevPage(): void { if (this.page > 1) { this.page--; this.loadData(); } }
  nextPage(): void { if (this.page < this.totalPages) { this.page++; this.loadData(); } }

  getStatusBadge(item: IndigentRegisterItem): string {
    return getStatusBadgeClass(item.appStatusId);
  }

  getStatusRoute(item: IndigentRegisterItem): string | null {
    const s = (item.appStatusName || '').toLowerCase();
    if (s === 'awaiting verification' || s === 'verification authorisation' || s === 'verification disqualify') return '/indigent/verification';
    if (s === 'awaiting authorisation' || s === 'disqualified authorisation' || s === 'termination authorisation') return '/indigent/authorization';
    if (s === 'application' || s === 're-application') return '/indigent/application';
    if (s === 're-application expiry') return '/indigent/reapplication';
    if (s === 'pending termination' || s === 'termination') return '/indigent/termination';
    return null;
  }

  navigateToProcess(item: IndigentRegisterItem, event: Event): void {
    event.stopPropagation();
    const route = this.getStatusRoute(item);
    if (route) {
      const s = (item.appStatusName || '').toLowerCase();
      if (s === 'application' || s === 're-application') {
        this.router.navigate([route], { queryParams: { appId: item.applicationId } });
      } else {
        this.router.navigate([route]);
      }
    }
  }

  viewApplication(item: IndigentRegisterItem): void {
    this.selectedApplicationId.set(item.applicationId);
  }

  closeDetail(): void {
    this.selectedApplicationId.set(null);
  }

  async exportCsv(): Promise<void> {
    if (this.exporting()) return;
    this.exporting.set(true);
    try {
      const allRes = await firstValueFrom(this.svc.getIndigentRegister({
        status: this.filterStatus || undefined,
        indigentTypeId: this.filterType ? Number(this.filterType) : undefined,
        town: this.filterTown || undefined,
        search: this.searchText || undefined,
        page: 1,
        pageSize: 10000,
      }));
      const items: IndigentRegisterItem[] = Array.isArray(allRes) ? allRes : (allRes?.items || allRes?.data || []);
      if (items.length === 0) { this.toast.show('No data to export', 'error'); return; }

      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Platinum Municipal POS';
      workbook.created = new Date();

      const ws = workbook.addWorksheet('Indigent Register', {
        views: [{ state: 'frozen', ySplit: 3 }],
      });

      const navyFill: any = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2B46' } };
      const goldFill: any = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC9A84C' } };
      const lightGrayFill: any = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
      const titleFont: any = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      const headerFont: any = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      const bodyFont: any = { name: 'Calibri', size: 10 };
      const currencyFmt = '#,##0.00';
      const thinBorder: any = {
        top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      };

      const colCount = 18;

      const titleRow = ws.addRow(['']);
      ws.mergeCells(1, 1, 1, colCount);
      const titleCell = titleRow.getCell(1);
      titleCell.value = 'INDIGENT REGISTER';
      titleCell.font = titleFont;
      titleCell.fill = navyFill;
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleRow.height = 32;

      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      const filterDesc = [
        this.filterStatus ? `Status: ${this.filterStatus}` : null,
        this.filterType ? `Type: ${this.indigentTypes().find(t => String(t.indigentTypeId) === this.filterType)?.indigentTypeName || this.filterType}` : null,
        this.searchText ? `Search: "${this.searchText}"` : null,
      ].filter(Boolean).join(' | ') || 'All Records';

      const subRow = ws.addRow(['']);
      ws.mergeCells(2, 1, 2, colCount);
      const subCell = subRow.getCell(1);
      subCell.value = `Generated: ${dd}/${mm}/${yyyy}  |  ${filterDesc}  |  ${items.length} records`;
      subCell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF333333' } };
      subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAEAEA' } } as any;
      subCell.alignment = { horizontal: 'center', vertical: 'middle' };
      subRow.height = 22;

      const headers = ['App ID', 'Account Number', 'Account Holder', 'ID Number', 'Indigent Type', 'Status', 'Application Date', 'Reapplication Date', 'Do-Not-Cut Date', 'Household Income', 'Subsidy %', 'Monthly Subsidy', 'Total Write-Off', 'Property Address', 'Town', 'Email', 'Cell Phone', 'Last Verification', 'Occupiers'];
      const headerRow = ws.addRow(headers);
      headerRow.height = 24;
      headerRow.eachCell((cell, colNumber) => {
        cell.font = headerFont;
        cell.fill = goldFill;
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = thinBorder;
      });

      ws.columns = [
        { width: 9 },
        { width: 18 },
        { width: 32 },
        { width: 16 },
        { width: 14 },
        { width: 22 },
        { width: 16 },
        { width: 16 },
        { width: 16 },
        { width: 16 },
        { width: 12 },
        { width: 16 },
        { width: 16 },
        { width: 34 },
        { width: 16 },
        { width: 28 },
        { width: 16 },
        { width: 16 },
        { width: 10 },
      ];

      const toExcelDate = (val: string | null | undefined): Date | string => {
        if (!val) return '';
        const d = new Date(val);
        return isNaN(d.getTime()) ? '' : d;
      };
      const dateFmt = 'DD/MM/YYYY';

      items.forEach((item, idx) => {
        const row = ws.addRow([
          item.applicationId,
          item.accountNumber || '',
          item.accountHolderName || '',
          item.idNumber || '',
          item.indigentTypeName || '',
          item.appStatusName || '',
          toExcelDate(item.applicationDate),
          toExcelDate(item.reApplicationDate),
          toExcelDate(item.doNotCutDate),
          item.householdIncome ?? 0,
          item.qualifiedSubsidyPercentage != null ? `${item.qualifiedSubsidyPercentage}%` : '',
          item.monthlySubsidy ?? 0,
          item.totalWriteOff ?? 0,
          item.propertyAddress || '',
          item.town || '',
          item.email || '',
          item.cellPhone || '',
          toExcelDate(item.lastVerificationDate),
          item.occupierCount ?? 0,
        ]);

        const isAlt = idx % 2 === 1;
        row.eachCell((cell, colNumber) => {
          cell.font = bodyFont;
          cell.border = thinBorder;
          cell.alignment = { vertical: 'middle' };
          if (isAlt) cell.fill = lightGrayFill;

          if (colNumber >= 10 && colNumber <= 12) {
            cell.numFmt = currencyFmt;
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          }
          if (colNumber === 1 || colNumber === 18) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
          if (colNumber >= 7 && colNumber <= 9 || colNumber === 17) {
            if (cell.value instanceof Date) cell.numFmt = dateFmt;
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
        });
      });

      const totalRowNum = items.length + 4;
      const totRow = ws.addRow([]);
      ws.mergeCells(totalRowNum, 1, totalRowNum, 9);

      totRow.getCell(1).value = `TOTALS (${items.length} records)`;
      totRow.getCell(1).font = { name: 'Calibri', size: 10, bold: true };
      totRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };

      [10, 11, 12].forEach(col => {
        const startRow = 4;
        const endRow = totalRowNum - 1;
        const colLetter = String.fromCharCode(64 + col);
        totRow.getCell(col).value = { formula: `SUM(${colLetter}${startRow}:${colLetter}${endRow})` } as any;
        totRow.getCell(col).numFmt = currencyFmt;
        totRow.getCell(col).font = { name: 'Calibri', size: 10, bold: true };
        totRow.getCell(col).alignment = { horizontal: 'right', vertical: 'middle' };
      });
      totRow.eachCell(cell => { cell.border = thinBorder; });
      totRow.height = 22;

      ws.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: colCount } };

      const buf = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `indigent-register-${yyyy}${mm}${dd}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      this.toast.show(`Exported ${items.length} records to Excel`, 'success');
    } catch (e) {
      console.error('[export-excel]', e);
      this.toast.show('Failed to export data', 'error');
    } finally {
      this.exporting.set(false);
    }
  }

  openDncModal(item: IndigentRegisterItem, event: Event): void {
    event.stopPropagation();
    this.dncItem = item;
    this.dncDate = item.doNotCutDate ? item.doNotCutDate.split('T')[0] : '';
    this.dncReason = '';
    this.dncModalOpen = true;
  }

  closeDncModal(): void { this.dncModalOpen = false; this.dncItem = null; }
  clearDncDate(): void { this.dncDate = ''; }

  async submitDncUpdate(): Promise<void> {
    if (!this.dncItem) return;
    if (!this.dncReason) { this.toast.show('Reason is required', 'error'); return; }
    this.submitting.set(true);
    try {
      const now = new Date().toISOString();
      await firstValueFrom(this.svc.doNotCutUpdate({
        applicationId: this.dncItem.applicationId,
        doNotCutDate: this.dncDate || null,
        doNotCutExtReason: this.dncReason,
        modifierID: this.userId,
        dateModified: now,
      }));
      this.toast.show(this.dncDate ? 'Do-not-cut date updated' : 'Do-not-cut protection removed', 'success');
      this.closeDncModal();
      await this.loadData();
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.toast.show(err?.error?.message || 'Do-not-cut update failed', 'error');
    } finally {
      this.submitting.set(false);
    }
  }
}
