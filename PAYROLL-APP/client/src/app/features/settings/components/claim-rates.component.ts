import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { DateSaPipe } from '../../../shared/pipes/date-sa.pipe';
import { DateInputComponent } from '../../../shared/components/date-input/date-input.component';

@Component({
  selector: 'app-claim-rates',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, DateSaPipe, DateInputComponent],
  templateUrl: './claim-rates.component.html',
  styleUrl: './claim-rates.component.css'
})
export class ClaimRatesComponent implements OnInit {
  rates: any[] = [];
  filteredRates: any[] = [];
  searchTerm = '';
  loading = true;
  showModal = false;
  editItem: any = {};

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.get<any[]>('/settings/claim-rates').subscribe({
      next: (data) => { this.rates = data || []; this.applyFilter(); this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  applyFilter(): void {
    const s = this.searchTerm.toLowerCase();
    this.filteredRates = s
      ? this.rates.filter(r =>
          (r.claim_type || '').toLowerCase().includes(s) ||
          (r.description || '').toLowerCase().includes(s) ||
          (r.rate_unit || '').toLowerCase().includes(s))
      : [...this.rates];
    this.cdr.detectChanges();
  }

  get claimTypeCount(): number {
    return new Set(this.rates.map(r => r.claim_type).filter(Boolean)).size;
  }

  formatRate(val: any): string {
    return parseFloat(val || 0).toFixed(2);
  }

  openModal(item?: any): void {
    this.editItem = item ? { ...item } : {
      claim_type: '', description: '', rate: 0, rate_unit: '', effective_date: ''
    };
    if (this.editItem.effective_date?.includes('T')) this.editItem.effective_date = this.editItem.effective_date.split('T')[0];
    this.showModal = true;
  }

  save(): void {
    if (!this.editItem.claim_type) {
      this.ui.toast('error', 'Validation', 'Claim type is required');
      return;
    }
    const body = {
      claim_type: this.editItem.claim_type,
      description: this.editItem.description || null,
      rate: parseFloat(this.editItem.rate) || 0,
      rate_unit: this.editItem.rate_unit || null,
      effective_date: this.editItem.effective_date || null,
    };
    const obs = this.editItem.id
      ? this.api.put(`/settings/claim-rates/${this.editItem.id}`, body)
      : this.api.post('/settings/claim-rates', body);
    obs.subscribe({
      next: () => { this.ui.toast('success', this.editItem.id ? 'Updated' : 'Created', `Claim rate ${this.editItem.id ? 'updated' : 'created'} successfully`); this.showModal = false; this.load(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to save')
    });
  }
}
