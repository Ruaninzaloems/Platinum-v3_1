import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-bank',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './bank.component.html',
  styleUrl: './bank.component.css'
})
export class BankComponent implements OnInit {
  settings: any = {};
  loading = true;

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.api.get<any>('/settings/system').subscribe({
      next: (data) => {
        this.settings = data || {};
        this.settings._auto_gl = this.settings.auto_gl_post === 'true';
        this.settings._auto_batches = this.settings.auto_generate_batches === 'true';
        this.settings._h2h_enabled = this.settings.h2h_enabled === 'true';
        this.loading = false; this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  save(): void {
    const payload = {
      settings: {
        payment_mode: this.settings.payment_mode || 'MANUAL_EFT',
        auto_gl_post: this.settings._auto_gl ? 'true' : 'false',
        auto_generate_batches: this.settings._auto_batches ? 'true' : 'false',
        municipality_bank_name: this.settings.municipality_bank_name || '',
        municipality_branch_code: this.settings.municipality_branch_code || '',
        municipality_account_number: this.settings.municipality_account_number || '',
        municipality_account_name: this.settings.municipality_account_name || '',
        h2h_enabled: this.settings._h2h_enabled ? 'true' : 'false',
        h2h_api_url: this.settings.h2h_api_url || '',
      }
    };
    this.api.put('/settings/system', payload).subscribe({
      next: () => this.ui.toast('success', 'Saved', 'Settings saved successfully'),
      error: () => this.ui.toast('error', 'Error', 'Failed to save settings')
    });
  }
}
