import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { DateSaPipe } from '../../../shared/pipes/date-sa.pipe';
import { DateInputComponent } from '../../../shared/components/date-input/date-input.component';

@Component({
  selector: 'app-claim-configurations',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, DateSaPipe, DateInputComponent],
  templateUrl: './claim-configurations.component.html',
  styleUrl: './claim-configurations.component.css'
})
export class ClaimConfigurationsComponent implements OnInit {
  view: 'list' | 'detail' = 'list';
  loading = true;
  configurations: any[] = [];
  filteredConfigurations: any[] = [];
  searchTerm = '';
  filterClaimType = '';

  editItem: any = {};
  isNew = false;

  employeeTypes: any[] = [];
  salaryHeads: any[] = [];
  sarsRates: any[] = [];

  claimTypes = ['Travel', 'S & T'];
  claimSubtypes: Record<string, string[]> = {
    'Travel': ['Local'],
    'S & T': ['Local – Meals and Incidental Costs', 'Local – Incidental Costs', 'Foreign']
  };

  availableSubtypes: string[] = [];

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.load();
    this.loadDropdowns();
  }

  load(): void {
    this.loading = true;
    this.api.get<any[]>('/settings/claim-configurations').subscribe({
      next: (data) => {
        this.configurations = data || [];
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  loadDropdowns(): void {
    this.api.get<any[]>('/settings/employee-types').subscribe({
      next: (data) => { this.employeeTypes = data || []; this.cdr.detectChanges(); }
    });
    this.api.get<any[]>('/salary-transactions').subscribe({
      next: (data) => { this.salaryHeads = data || []; this.cdr.detectChanges(); }
    });
    this.api.get<any[]>('/settings/sars-prescribed-rates').subscribe({
      next: (data) => { this.sarsRates = data || []; this.cdr.detectChanges(); }
    });
  }

  applyFilters(): void {
    let result = [...this.configurations];
    if (this.searchTerm) {
      const s = this.searchTerm.toLowerCase();
      result = result.filter((c: any) =>
        (c.claim_type || '').toLowerCase().includes(s) ||
        (c.claim_subtype || '').toLowerCase().includes(s) ||
        (c.claim_group || '').toLowerCase().includes(s) ||
        (c.employee_type_name || '').toLowerCase().includes(s) ||
        (c.salary_head_name || '').toLowerCase().includes(s)
      );
    }
    if (this.filterClaimType) {
      result = result.filter((c: any) => c.claim_type === this.filterClaimType);
    }
    this.filteredConfigurations = result;
  }

  get travelCount(): number {
    return this.configurations.filter(c => c.claim_type === 'Travel').length;
  }

  get stCount(): number {
    return this.configurations.filter(c => c.claim_type === 'S & T').length;
  }

  openNew(): void {
    this.isNew = true;
    this.editItem = {
      claim_type: '',
      claim_subtype: '',
      claim_group: '',
      employee_type_id: null,
      client_policy: '',
      sars_prescribed_rate_id: null,
      salary_head_id: null,
      effective_date: '',
      end_date: ''
    };
    this.availableSubtypes = [];
    this.view = 'detail';
  }

  openDetail(item: any): void {
    this.isNew = false;
    this.editItem = { ...item };
    if (this.editItem.effective_date?.includes('T')) this.editItem.effective_date = this.editItem.effective_date.split('T')[0];
    if (this.editItem.end_date?.includes('T')) this.editItem.end_date = this.editItem.end_date.split('T')[0];
    this.availableSubtypes = this.claimSubtypes[this.editItem.claim_type] || [];
    this.view = 'detail';
  }

  backToList(): void {
    this.view = 'list';
    this.editItem = {};
    this.load();
  }

  onClaimTypeChange(): void {
    this.availableSubtypes = this.claimSubtypes[this.editItem.claim_type] || [];
    this.editItem.claim_subtype = '';
    this.editItem.sars_prescribed_rate_id = null;
    this.cdr.detectChanges();
  }

  onEffectiveDateChange(): void {
    if (this.editItem.claim_subtype) {
      this.onSubtypeChange();
    }
  }

  onSubtypeChange(): void {
    if (!this.editItem.claim_subtype) {
      this.editItem.sars_prescribed_rate_id = null;
      this.cdr.detectChanges();
      return;
    }
    const lookupDate = this.editItem.effective_date || new Date().toISOString().split('T')[0];
    this.api.get<any>(`/settings/sars-prescribed-rates/lookup?subtype=${encodeURIComponent(this.editItem.claim_subtype)}&date=${lookupDate}`).subscribe({
      next: (data) => {
        if (data) {
          this.editItem.sars_prescribed_rate_id = data.id;
        } else {
          this.editItem.sars_prescribed_rate_id = null;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.editItem.sars_prescribed_rate_id = null;
        this.cdr.detectChanges();
      }
    });
  }

  getSarsRate(): string {
    if (!this.editItem.sars_prescribed_rate_id) return '';
    const rate = this.sarsRates.find((r: any) => r.id === this.editItem.sars_prescribed_rate_id);
    return rate ? 'R' + parseFloat(rate.rate).toFixed(2) : '';
  }

  getSarsRateDisplay(item: any): string {
    if (item.sars_rate) return 'R' + parseFloat(item.sars_rate).toFixed(2);
    return '-';
  }

  save(): void {
    if (!this.editItem.claim_type) {
      this.ui.toast('error', 'Validation', 'Claim Type is required');
      return;
    }
    if (!this.editItem.claim_subtype) {
      this.ui.toast('error', 'Validation', 'Claim Subtype is required');
      return;
    }
    if (!this.editItem.effective_date) {
      this.ui.toast('error', 'Validation', 'Effective Date is required');
      return;
    }

    const body = {
      claim_type: this.editItem.claim_type,
      claim_subtype: this.editItem.claim_subtype,
      claim_group: this.editItem.claim_group || null,
      employee_type_id: this.editItem.employee_type_id || null,
      client_policy: this.editItem.client_policy || null,
      sars_prescribed_rate_id: this.editItem.sars_prescribed_rate_id || null,
      salary_head_id: this.editItem.salary_head_id || null,
      effective_date: this.editItem.effective_date,
      end_date: this.editItem.end_date || null
    };

    const obs = this.editItem.id
      ? this.api.put(`/settings/claim-configurations/${this.editItem.id}`, body)
      : this.api.post('/settings/claim-configurations', body);

    obs.subscribe({
      next: () => {
        this.ui.toast('success', this.editItem.id ? 'Updated' : 'Created', `Claim configuration ${this.editItem.id ? 'updated' : 'created'} successfully`);
        this.backToList();
      },
      error: () => this.ui.toast('error', 'Error', 'Failed to save claim configuration')
    });
  }

  async deleteConfig(): Promise<void> {
    if (!this.editItem.id) return;
    const confirmed = await this.ui.confirm({
      title: 'Delete Configuration',
      message: `Are you sure you want to delete this claim configuration for ${this.editItem.claim_type} - ${this.editItem.claim_subtype}?`,
      danger: true
    });
    if (confirmed) {
      this.api.delete(`/settings/claim-configurations/${this.editItem.id}`).subscribe({
        next: () => {
          this.ui.toast('success', 'Deleted', 'Claim configuration deleted');
          this.backToList();
        },
        error: () => this.ui.toast('error', 'Error', 'Failed to delete')
      });
    }
  }
}
