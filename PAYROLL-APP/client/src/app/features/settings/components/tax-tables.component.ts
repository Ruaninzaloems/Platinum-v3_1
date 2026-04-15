import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CurrencyZarPipe } from '../../../shared/pipes/currency-zar.pipe';
import { DateSaPipe } from '../../../shared/pipes/date-sa.pipe';
import { DateInputComponent } from '../../../shared/components/date-input/date-input.component';

@Component({
  selector: 'app-tax-tables',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, CurrencyZarPipe, DateSaPipe, DateInputComponent],
  templateUrl: './tax-tables.component.html',
  styleUrl: './tax-tables.component.css'
})
export class TaxTablesComponent implements OnInit {
  taxYears: number[] = [];
  selectedYear: number | null = null;
  taxData: any = null;
  loading = true;
  hasChanges = false;
  showBracketModal = false;
  showCopyModal = false;
  newBracket: any = {};
  copyFrom: number | null = null;
  copyTo: number | null = null;

  sarsRates: any[] = [];
  showSarsModal = false;
  editSarsRate: any = {};
  showSarsCopyModal = false;
  sarsCopyFrom: number | null = null;
  sarsCopyTo: number | null = null;
  hasSarsChanges = false;

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.loadYears(); this.loadSarsRates(); }

  loadYears(): void {
    this.loading = true;
    this.api.get<any[]>('/settings/tax-years').subscribe({
      next: (data) => {
        this.taxYears = data || [];
        if (this.taxYears.length > 0 && !this.selectedYear) {
          this.selectedYear = this.taxYears[0];
         this.cdr.detectChanges(); }
        if (this.selectedYear) {
          this.loadTaxData();
        } else {
          this.loading = false; this.cdr.detectChanges();
        }
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  loadTaxData(): void {
    this.loading = true;
    this.api.get<any>(`/settings/tax-tables/${this.selectedYear}`).subscribe({
      next: (data) => {
        this.taxData = data || {};
        this.hasChanges = false;
        this.loading = false; this.cdr.detectChanges();
      },
      error: () => { this.taxData = {}; this.loading = false; this.cdr.detectChanges(); }
    });
  }

  onYearChange(): void {
    this.loadTaxData();
  }

  markChanged(): void {
    this.hasChanges = true;
  }

  fmtMonthly(annual: any): string {
    const n = parseFloat(annual) || 0;
    return 'R' + (n / 12).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  fmtPercent(val: any): string {
    return parseFloat(val || 0) + '%';
  }

  fmtCurrency(val: any): string {
    const n = parseFloat(val) || 0;
    return 'R' + n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  saveAll(): void {
    const d = this.taxData;
    const requests: Promise<any>[] = [];

    (d.brackets || []).forEach((b: any) => {
      requests.push(
        this.api.put(`/settings/tax-brackets/${b.id}`, {
          min_income: parseFloat(b.min_income),
          max_income: parseFloat(b.max_income),
          base_tax: parseFloat(b.base_tax),
          rate: parseFloat(b.rate)
        }).toPromise()
      );
    });

    (d.rebates || []).forEach((r: any) => {
      requests.push(
        this.api.put(`/settings/tax-rebates/${r.id}`, {
          amount: parseFloat(r.amount),
          age_threshold: r.age_threshold || 0
        }).toPromise()
      );
    });

    (d.thresholds || []).forEach((t: any) => {
      requests.push(
        this.api.put(`/settings/tax-thresholds/${t.id}`, {
          amount: parseFloat(t.amount)
        }).toPromise()
      );
    });

    if (d.medical_tax_credits?.id) {
      requests.push(
        this.api.put(`/settings/medical-credits/${d.medical_tax_credits.id}`, {
          main_member: parseFloat(d.medical_tax_credits.main_member),
          first_dependant: parseFloat(d.medical_tax_credits.first_dependant),
          additional_dependant: parseFloat(d.medical_tax_credits.additional_dependant),
        }).toPromise()
      );
    }

    if (d.uif?.id) {
      requests.push(
        this.api.put(`/settings/uif-settings/${d.uif.id}`, {
          employee_rate: parseFloat(d.uif.employee_rate),
          employer_rate: parseFloat(d.uif.employer_rate),
          ceiling: parseFloat(d.uif.ceiling),
        }).toPromise()
      );
    }

    if (d.sdl?.id) {
      requests.push(
        this.api.put(`/settings/sdl-settings/${d.sdl.id}`, {
          rate: parseFloat(d.sdl.rate),
          threshold: parseFloat(d.sdl.threshold),
        }).toPromise()
      );
    }

    Promise.all(requests).then(() => {
      this.ui.toast('success', 'Tax Tables Saved', 'All changes saved successfully');
      this.hasChanges = false;
      this.loadTaxData();
    }).catch(() => {
      this.ui.toast('error', 'Error', 'Some updates failed');
    });
  }

  async deleteBracket(bracket: any): Promise<void> {
    const confirmed = await this.ui.confirm({ title: 'Delete Bracket', message: 'Are you sure you want to remove this tax bracket?', danger: true });
    if (confirmed) {
      this.api.delete(`/settings/tax-brackets/${bracket.id}`).subscribe({
        next: () => { this.ui.toast('success', 'Deleted', 'Tax bracket removed'); this.loadTaxData(); },
        error: () => this.ui.toast('error', 'Error', 'Failed to delete')
      });
    }
  }

  editBracket(b: any): void {
    this.newBracket = { ...b };
    this.showBracketModal = true;
  }

  editRebate(r: any): void {
    this.ui.toast('info', 'Edit', 'Edit the value inline and click Save All Changes');
  }

  async deleteRebate(r: any): Promise<void> {
    const confirmed = await this.ui.confirm({ title: 'Delete Rebate', message: 'Are you sure you want to remove this tax rebate?', danger: true });
    if (confirmed) {
      this.api.delete(`/settings/tax-rebates/${r.id}`).subscribe({
        next: () => { this.ui.toast('success', 'Deleted', 'Tax rebate removed'); this.loadTaxData(); },
        error: () => this.ui.toast('error', 'Error', 'Failed to delete')
      });
    }
  }

  editThreshold(t: any): void {
    this.ui.toast('info', 'Edit', 'Edit the value inline and click Save All Changes');
  }

  async deleteThreshold(t: any): Promise<void> {
    const confirmed = await this.ui.confirm({ title: 'Delete Threshold', message: 'Are you sure you want to remove this tax threshold?', danger: true });
    if (confirmed) {
      this.api.delete(`/settings/tax-thresholds/${t.id}`).subscribe({
        next: () => { this.ui.toast('success', 'Deleted', 'Tax threshold removed'); this.loadTaxData(); },
        error: () => this.ui.toast('error', 'Error', 'Failed to delete')
      });
    }
  }

  openAddBracketModal(): void {
    const brackets = this.taxData?.brackets || [];
    const nextNum = brackets.length + 1;
    const lastBracket = brackets[brackets.length - 1];
    const nextMin = lastBracket ? parseFloat(lastBracket.max_income) + 1 : 0;
    this.newBracket = { bracket_number: nextNum, min_income: nextMin, max_income: 0, base_tax: 0, rate: 0 };
    this.showBracketModal = true;
  }

  addBracket(): void {
    this.api.post('/settings/tax-brackets', {
      tax_year: this.selectedYear,
      bracket_number: parseInt(this.newBracket.bracket_number),
      min_income: parseFloat(this.newBracket.min_income),
      max_income: parseFloat(this.newBracket.max_income),
      base_tax: parseFloat(this.newBracket.base_tax),
      rate: parseFloat(this.newBracket.rate),
    }).subscribe({
      next: () => { this.ui.toast('success', 'Bracket Added', 'New tax bracket created'); this.showBracketModal = false; this.loadTaxData(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to add bracket')
    });
  }

  openCopyModal(): void {
    this.copyFrom = this.selectedYear;
    this.copyTo = (this.taxYears[0] || 2026) + 1;
    this.showCopyModal = true;
  }

  doCopy(): void {
    this.api.post('/settings/tax-tables/copy', { from_year: this.copyFrom, to_year: this.copyTo }).subscribe({
      next: () => {
        this.ui.toast('success', 'Tables Copied', `Tax tables copied to ${this.copyTo}. Update values as needed.`);
        this.showCopyModal = false;
        this.selectedYear = this.copyTo;
        this.loadYears();
      },
      error: () => this.ui.toast('error', 'Error', 'Failed to copy')
    });
  }

  loadSarsRates(): void {
    this.api.get<any[]>('/settings/sars-prescribed-rates').subscribe({
      next: (data) => {
        this.sarsRates = (data || []).map((r: any) => ({
          ...r,
          effective_date: r.effective_date?.includes('T') ? r.effective_date.split('T')[0] : r.effective_date,
          end_date: r.end_date?.includes('T') ? r.end_date.split('T')[0] : r.end_date
        }));
        this.hasSarsChanges = false;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  markSarsChanged(): void {
    this.hasSarsChanges = true;
  }

  saveSarsRates(): void {
    const requests: Promise<any>[] = [];
    for (const r of this.sarsRates) {
      requests.push(
        this.api.put(`/settings/sars-prescribed-rates/${r.id}`, {
          tax_year: parseInt(r.tax_year),
          description: r.description,
          subtype_index: r.subtype_index,
          irp5_code: r.irp5_code || null,
          rate: parseFloat(r.rate),
          effective_date: r.effective_date || null,
          end_date: r.end_date || null
        }).toPromise()
      );
    }
    Promise.all(requests).then(() => {
      this.ui.toast('success', 'Saved', 'SARS prescribed rates updated');
      this.hasSarsChanges = false;
      this.loadSarsRates();
    }).catch(() => {
      this.ui.toast('error', 'Error', 'Some updates failed');
    });
  }

  openSarsModal(): void {
    this.editSarsRate = {
      tax_year: this.selectedYear || 2027,
      description: '',
      subtype_index: '',
      irp5_code: '',
      rate: 0,
      effective_date: '',
      end_date: ''
    };
    this.showSarsModal = true;
  }

  saveSarsRate(): void {
    if (!this.editSarsRate.description || this.editSarsRate.rate == null || isNaN(parseFloat(this.editSarsRate.rate))) {
      this.ui.toast('error', 'Validation', 'Description and rate are required');
      return;
    }
    if (!this.editSarsRate.effective_date) {
      this.ui.toast('error', 'Validation', 'Effective date is required');
      return;
    }
    if (!this.editSarsRate.subtype_index) {
      this.ui.toast('error', 'Validation', 'Subtype index is required');
      return;
    }
    const body = {
      tax_year: parseInt(this.editSarsRate.tax_year),
      description: this.editSarsRate.description,
      subtype_index: this.editSarsRate.subtype_index,
      irp5_code: this.editSarsRate.irp5_code || null,
      rate: parseFloat(this.editSarsRate.rate),
      effective_date: this.editSarsRate.effective_date || null,
      end_date: this.editSarsRate.end_date || null
    };
    this.api.post('/settings/sars-prescribed-rates', body).subscribe({
      next: () => {
        this.ui.toast('success', 'Created', 'SARS prescribed rate added');
        this.showSarsModal = false;
        this.loadSarsRates();
      },
      error: () => this.ui.toast('error', 'Error', 'Failed to add SARS rate')
    });
  }

  async deleteSarsRate(item: any): Promise<void> {
    const confirmed = await this.ui.confirm({ title: 'Delete SARS Rate', message: `Delete "${item.description}" rate?`, danger: true });
    if (confirmed) {
      this.api.delete(`/settings/sars-prescribed-rates/${item.id}`).subscribe({
        next: () => { this.ui.toast('success', 'Deleted', 'SARS prescribed rate removed'); this.loadSarsRates(); },
        error: () => this.ui.toast('error', 'Error', 'Failed to delete')
      });
    }
  }

  get sarsYears(): number[] {
    const years = new Set(this.sarsRates.map((r: any) => r.tax_year));
    return Array.from(years).sort((a, b) => b - a);
  }

  openSarsCopyModal(): void {
    const years = this.sarsYears;
    this.sarsCopyFrom = years[0] || 2027;
    this.sarsCopyTo = (years[0] || 2027) + 1;
    this.showSarsCopyModal = true;
  }

  doSarsCopy(): void {
    this.api.post('/settings/sars-prescribed-rates/copy', { from_year: this.sarsCopyFrom, to_year: this.sarsCopyTo }).subscribe({
      next: () => {
        this.ui.toast('success', 'Rates Copied', `SARS prescribed rates copied to tax year ${this.sarsCopyTo}. Update values as needed.`);
        this.showSarsCopyModal = false;
        this.loadSarsRates();
      },
      error: (err: any) => this.ui.toast('error', 'Error', err?.error?.error?.message || 'Failed to copy SARS rates')
    });
  }
}
