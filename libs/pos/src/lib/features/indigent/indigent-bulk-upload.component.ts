import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { IndigentService } from '../../services/indigent.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { formatDate } from '../../services/format.service';
import { DateInputComponent } from '../../shared/components/date-input.component';
import type { IndigentType, BulkActivateResponse } from '../../models/indigent.models';

@Component({
  selector: 'app-indigent-bulk-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, DateInputComponent],
  templateUrl: './indigent-bulk-upload.component.html',
  styleUrl: './indigent-bulk-upload.component.css'
})
export class IndigentBulkUploadComponent implements OnInit {
  indigentTypes = signal<IndigentType[]>([]);
  loading = signal(true);
  submitting = signal(false);

  selectedIndigentTypeId = 0;
  selectedFinancialYear = this.currentFY();
  financialYearOptions: string[] = [];

  applicationDate = this.fyStartDate(this.currentFY());
  commencementDate = this.fyStartDate(this.currentFY());
  reApplicationDate = this.fyEndDate30(this.currentFY());
  terminationDate = this.fyEndDate30(this.currentFY());
  remarks = '';

  accountNumbers = signal<string[]>([]);
  csvFileName = signal('');
  pasteText = '';

  results = signal<BulkActivateResponse | null>(null);
  progress = signal(0);

  constructor(
    private svc: IndigentService,
    private auth: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.buildFinancialYears();
    this.loadData();
  }

  private get userId(): number { return this.auth.user()?.user_ID || 0; }

  private buildFinancialYears(): void {
    const now = new Date();
    const baseYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    this.financialYearOptions = [];
    for (let i = -2; i <= 2; i++) {
      const y = baseYear + i;
      this.financialYearOptions.push(`${y}/${y + 1}`);
    }
  }

  private currentFY(): string {
    const now = new Date();
    const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    return `${year}/${year + 1}`;
  }

  private fyStartDate(fy: string): string {
    const startYear = parseInt(fy.split('/')[0]);
    return `${startYear}-07-01T00:00:00`;
  }

  private fyEndDate30(fy: string): string {
    const endYear = parseInt(fy.split('/')[1]);
    const end = new Date(`${endYear}-06-30T00:00:00`);
    end.setDate(end.getDate() + 30);
    return end.toISOString().split('T')[0] + 'T00:00:00';
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      const types = await firstValueFrom(this.svc.getIndigentTypes());
      this.indigentTypes.set(Array.isArray(types) ? types : []);
      if (this.indigentTypes().length > 0 && !this.selectedIndigentTypeId) {
        this.selectedIndigentTypeId = this.indigentTypes()[0].indigentTypeId;
      }
    } catch (err: any) {
      this.toast.show('Failed to load indigent types', 'error');
      console.error('[bulk-upload] loadData error:', err);
    } finally {
      this.loading.set(false);
    }
  }

  onFinancialYearChange(): void {
    this.applicationDate = this.fyStartDate(this.selectedFinancialYear);
    this.commencementDate = this.fyStartDate(this.selectedFinancialYear);
    this.reApplicationDate = this.fyEndDate30(this.selectedFinancialYear);
    this.terminationDate = this.fyEndDate30(this.selectedFinancialYear);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.csvFileName.set(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      this.parseAccountNumbers(text);
    };
    reader.readAsText(file);
  }

  onPasteImport(): void {
    if (!this.pasteText.trim()) return;
    this.parseAccountNumbers(this.pasteText);
    this.csvFileName.set('Manual paste');
  }

  downloadTemplate(): void {
    const typeName = this.indigentTypes().find(t => t.indigentTypeId === this.selectedIndigentTypeId)?.indigentTypeName || 'Domestic';
    const csv = [
      `AccountNumber`,
      `16360`,
      `51107`,
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `indigent-bulk-upload-${typeName.toLowerCase().replace(/\s+/g, '-')}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private parseAccountNumbers(text: string): void {
    const lines = text.split(/[\r\n,;]+/).map(l => l.trim()).filter(l => l.length > 0);
    const numbers: string[] = [];
    for (const line of lines) {
      const cleaned = line.replace(/['"]/g, '').trim();
      if (/^\d+$/.test(cleaned) && cleaned.length >= 3) {
        numbers.push(cleaned);
      }
    }
    const unique = [...new Set(numbers)];
    this.accountNumbers.set(unique);
    if (unique.length === 0) {
      this.toast.show('No valid account numbers found in input', 'error');
    } else {
      this.toast.show(`${unique.length} account number(s) loaded`, 'success');
    }
  }

  removeAccount(accNo: string): void {
    this.accountNumbers.set(this.accountNumbers().filter(a => a !== accNo));
  }

  clearAccounts(): void {
    this.accountNumbers.set([]);
    this.csvFileName.set('');
    this.pasteText = '';
    this.results.set(null);
  }

  async submitBulkUpload(): Promise<void> {
    if (this.submitting()) return;
    if (this.accountNumbers().length === 0) {
      this.toast.show('No account numbers loaded', 'error');
      return;
    }
    if (!this.selectedIndigentTypeId) {
      this.toast.show('Please select an indigent type', 'error');
      return;
    }

    this.submitting.set(true);
    this.progress.set(0);
    this.results.set(null);

    try {
      const now = new Date().toISOString();
      const res = await firstValueFrom(this.svc.bulkActivate({
        accountNumbers: this.accountNumbers(),
        indigentTypeId: this.selectedIndigentTypeId,
        appStatusId: 134,
        applicationDate: this.applicationDate,
        commencementDate: this.commencementDate,
        reApplicationDate: this.reApplicationDate,
        terminationDate: this.terminationDate,
        financialYear: this.selectedFinancialYear,
        remarks: this.remarks || `Bulk import — FY ${this.selectedFinancialYear}`,
        capturerID: this.userId,
        dateCaptured: now,
        modifierID: this.userId,
        dateModified: now,
      }));
      this.results.set(res);
      this.progress.set(100);
      if (res.totalActivated > 0) {
        this.toast.show(`${res.totalActivated} application(s) created — they will appear in the verification/authorization queue for approval`, 'success');
      }
      if (res.totalFailed > 0) {
        this.toast.show(`${res.totalFailed} account(s) failed — see results below`, 'warning');
      }
    } catch (e: any) {
      this.toast.show(e?.error?.message || 'Bulk upload failed', 'error');
    } finally {
      this.submitting.set(false);
    }
  }

  fmtDate(val: string | null | undefined): string { return formatDate(val); }

  fmtDateInput(iso: string): string {
    if (!iso) return '';
    return iso.split('T')[0];
  }

  onDateChange(field: 'applicationDate' | 'commencementDate' | 'reApplicationDate' | 'terminationDate', value: string): void {
    const iso = value ? `${value}T00:00:00` : '';
    switch (field) {
      case 'applicationDate': this.applicationDate = iso; break;
      case 'commencementDate': this.commencementDate = iso; break;
      case 'reApplicationDate': this.reApplicationDate = iso; break;
      case 'terminationDate': this.terminationDate = iso; break;
    }
  }

  goToAuthorization(): void {
    this.router.navigate(['/indigent/authorization']);
  }
}
