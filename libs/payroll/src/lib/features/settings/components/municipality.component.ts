import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-municipality',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './municipality.component.html',
  styleUrl: './municipality.component.css'
})
export class MunicipalityComponent implements OnInit {
  municipality: any = {};
  loading = true;
  logoUrl: string | null = null;
  industryGroups: any[] = [];
  activityGroups: any[] = [];
  sezCodes: any[] = [];
  sicSubclasses: any[] = [];
  positions: any[] = [];

  months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
    { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
    { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' }
  ];

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadLogo();
    this.api.get<any>('/settings/municipality').subscribe({
      next: (data) => {
        this.municipality = data || {};
        this.loading = false;
        if (this.municipality.industry_group) {
          this.loadActivityGroups(this.municipality.industry_group);
        }
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
    this.api.get<any>('/settings/trade-classification-groups').subscribe({
      next: (d) => { this.industryGroups = d || []; this.cdr.detectChanges(); },
      error: () => {}
    });
    this.api.get<any>('/settings/sez-codes').subscribe({
      next: (d) => { this.sezCodes = d || []; this.cdr.detectChanges(); },
      error: () => {}
    });
    this.api.get<any>('/settings/sic-subclasses').subscribe({
      next: (d) => { this.sicSubclasses = d || []; this.cdr.detectChanges(); },
      error: () => {}
    });
    this.api.get<any>('/settings/positions-lookup').subscribe({
      next: (d) => { this.positions = d || []; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  onIndustryGroupChange(): void {
    this.municipality.activity_group = '';
    this.activityGroups = [];
    if (this.municipality.industry_group) {
      this.loadActivityGroups(this.municipality.industry_group);
    }
    this.cdr.detectChanges();
  }

  private loadActivityGroups(groupId: string): void {
    this.api.get<any>('/settings/trade-classification-activities', { group_id: groupId }).subscribe({
      next: (d) => { this.activityGroups = d || []; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  loadLogo(): void {
    this.logoUrl = '/api/v1/settings/municipality/logo?t=' + Date.now();
    const img = new Image();
    img.onload = () => { this.logoUrl = img.src; this.cdr.detectChanges(); };
    img.onerror = () => { this.logoUrl = null; this.cdr.detectChanges(); };
    img.src = this.logoUrl;
  }

  uploadLogo(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    if (file.size > 2 * 1024 * 1024) {
      this.ui.toast('error', 'Error', 'File too large. Max 2 MB.');
      input.value = '';
      return;
    }
    const formData = new FormData();
    formData.append('logo', file);
    fetch('/api/v1/settings/municipality/logo', { method: 'POST', body: formData })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          this.ui.toast('success', 'Uploaded', 'Logo uploaded successfully');
          this.loadLogo();
        } else {
          this.ui.toast('error', 'Error', res.error?.message || 'Upload failed');
        }
        input.value = '';
        this.cdr.detectChanges();
      })
      .catch(() => {
        this.ui.toast('error', 'Error', 'Upload failed');
        input.value = '';
        this.cdr.detectChanges();
      });
  }

  removeLogo(): void {
    fetch('/api/v1/settings/municipality/logo', { method: 'DELETE' })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          this.logoUrl = null;
          this.ui.toast('success', 'Removed', 'Logo removed');
        } else {
          this.ui.toast('error', 'Error', res.error?.message || 'Remove failed');
        }
        this.cdr.detectChanges();
      })
      .catch(() => {
        this.ui.toast('error', 'Error', 'Remove failed');
        this.cdr.detectChanges();
      });
  }

  showBonusMonth(): boolean {
    return this.municipality.bonus_payment_timing === 'SPECIFIC_MONTH';
  }

  save(): void {
    this.api.put('/settings/municipality', { settings: this.municipality }).subscribe({
      next: () => {
        this.ui.toast('success', 'Saved', 'Municipality details saved successfully');
      },
      error: () => this.ui.toast('error', 'Error', 'Failed to save')
    });
  }
}
