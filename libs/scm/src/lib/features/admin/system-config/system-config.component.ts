import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { environment } from '../../../environment';

interface ProcessBoundary {
  id: string;
  method: string;
  label: string;
  rangeFrom: number;
  rangeTo: number | null;
  minQuotes: number;
  scoring: string | null;
  advertDays: number;
  committees: boolean;
  enabled: boolean;
  description: string;
  vatInclusive: boolean;
  categoryOverrides: any;
}

interface PreferencePoint {
  id: string;
  maxValue: number | null;
  system: string;
  priceWeight: number;
  bbbeeWeight: number;
  description: string;
}

interface SpecialMethod {
  id: string;
  method: string;
  label: string;
  enabled: boolean;
  requiresMotivation: boolean;
  requiresAOApproval: boolean;
  requiresCouncilReport: boolean;
  reasons?: string[];
  description: string;
}

interface AntiSplitSettings {
  enabled: boolean;
  lookbackDays: number;
  maxTransactionsPerSupplier: number;
  cumulativeThresholdMultiplier: number;
  flagSameCostCentre: boolean;
  flagSameSupplier: boolean;
  description: string;
}

interface ProcurementCategory {
  id: string;
  label: string;
  description: string;
}

@Component({
  selector: 'app-system-config',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatTabsModule, MatSlideToggleModule, MatTooltipModule, MatChipsModule],
  templateUrl: './system-config.component.html',
  styleUrl: './system-config.component.scss'
})
export class SystemConfigComponent implements OnInit {
  private http = inject(HttpClient);

  notification = signal<string>('');
  notificationType = signal<'success' | 'error'>('success');
  saving = signal(false);

  configVersion = signal('');
  lastModified = signal('');
  applicableTo = signal('');

  boundaries = signal<ProcessBoundary[]>([]);
  preferencePoints = signal<PreferencePoint[]>([]);
  specialMethods = signal<SpecialMethod[]>([]);
  antiSplit = signal<AntiSplitSettings | null>(null);
  categories = signal<ProcurementCategory[]>([]);
  legislativeRef = signal<any>({});

  enabledBoundaries = computed(() => this.boundaries().filter(b => b.enabled));

  ngOnInit() {
    this.loadConfig();
  }

  loadConfig() {
    this.http.get<any>(`${environment.apiUrl}/scm-config`).subscribe({
      next: (res) => {
        const data = res.data || res;
        this.configVersion.set(data.version || '');
        this.lastModified.set(data.lastModified || '');
        this.applicableTo.set(data.applicableTo || '');
        this.boundaries.set(data.processBoundaries || []);
        this.preferencePoints.set(data.preferencePointThresholds || []);
        this.specialMethods.set(data.specialMethods || []);
        this.antiSplit.set(data.antiSplitDetection || null);
        this.categories.set(data.categories || []);
        this.legislativeRef.set(data.legislativeReference || {});
      },
      error: () => this.showNotification('Failed to load configuration', 'error')
    });
  }

  addBoundary() {
    const current = this.boundaries();
    const lastBoundary = current[current.length - 1];
    const newFrom = lastBoundary && lastBoundary.rangeTo !== null ? lastBoundary.rangeTo + 1 : 0;
    const newBoundary: ProcessBoundary = {
      id: `PB${String(current.length + 1).padStart(3, '0')}`,
      method: '',
      label: '',
      rangeFrom: newFrom,
      rangeTo: null,
      minQuotes: 0,
      scoring: null,
      advertDays: 0,
      committees: false,
      enabled: true,
      description: '',
      vatInclusive: true,
      categoryOverrides: {}
    };
    this.boundaries.set([...current, newBoundary]);
  }

  deleteBoundary(index: number) {
    const current = [...this.boundaries()];
    current.splice(index, 1);
    this.boundaries.set(current);
  }

  saveThresholds() {
    this.saving.set(true);
    this.http.put<any>(`${environment.apiUrl}/scm-config/thresholds`, { boundaries: this.boundaries() }).subscribe({
      next: (res) => {
        const data = res.data || res;
        this.boundaries.set(data.boundaries || this.boundaries());
        this.showNotification('Process boundaries saved successfully', 'success');
        this.saving.set(false);
      },
      error: (err) => {
        this.showNotification(err.error?.error || 'Failed to save thresholds', 'error');
        this.saving.set(false);
      }
    });
  }

  addPreferencePoint() {
    const current = this.preferencePoints();
    const newPoint: PreferencePoint = {
      id: `PPT${String(current.length + 1).padStart(3, '0')}`,
      maxValue: null,
      system: '80/20',
      priceWeight: 80,
      bbbeeWeight: 20,
      description: ''
    };
    this.preferencePoints.set([...current, newPoint]);
  }

  deletePreferencePoint(index: number) {
    const current = [...this.preferencePoints()];
    current.splice(index, 1);
    this.preferencePoints.set(current);
  }

  savePreferencePoints() {
    this.saving.set(true);
    this.http.put<any>(`${environment.apiUrl}/scm-config/preference-points`, { thresholds: this.preferencePoints() }).subscribe({
      next: (res) => {
        const data = res.data || res;
        this.preferencePoints.set(data.thresholds || this.preferencePoints());
        this.showNotification('Preference point thresholds saved successfully', 'success');
        this.saving.set(false);
      },
      error: (err) => {
        this.showNotification(err.error?.error || 'Failed to save preference points', 'error');
        this.saving.set(false);
      }
    });
  }

  saveSpecialMethods() {
    this.saving.set(true);
    this.http.put<any>(`${environment.apiUrl}/scm-config/special-methods`, { methods: this.specialMethods() }).subscribe({
      next: (res) => {
        const data = res.data || res;
        this.specialMethods.set(data.methods || this.specialMethods());
        this.showNotification('Special procurement methods saved successfully', 'success');
        this.saving.set(false);
      },
      error: (err) => {
        this.showNotification(err.error?.error || 'Failed to save special methods', 'error');
        this.saving.set(false);
      }
    });
  }

  saveAntiSplit() {
    this.saving.set(true);
    const settings = this.antiSplit();
    if (!settings) return;
    this.http.put<any>(`${environment.apiUrl}/scm-config/anti-split`, settings).subscribe({
      next: (res) => {
        const data = res.data || res;
        this.antiSplit.set(data.settings || this.antiSplit());
        this.showNotification('Anti-split detection settings saved successfully', 'success');
        this.saving.set(false);
      },
      error: (err) => {
        this.showNotification(err.error?.error || 'Failed to save anti-split settings', 'error');
        this.saving.set(false);
      }
    });
  }

  formatCurrency(value: number): string {
    return 'R ' + value.toLocaleString('en-ZA');
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
           d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  }

  formatReason(reason: string): string {
    return reason.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  getBoundaryIcon(method: string): string {
    const icons: Record<string, string> = {
      'petty_cash': 'account_balance_wallet',
      'informal_quotation': 'request_quote',
      'formal_quotation': 'description',
      'competitive_bid': 'gavel'
    };
    return icons[method] || 'attach_money';
  }

  getSpecialMethodIcon(method: string): string {
    const icons: Record<string, string> = {
      'deviation': 'swap_horiz',
      'transversal_contract': 'handshake',
      'emergency': 'emergency',
      'sole_supplier': 'person',
      'framework_agreement': 'dashboard_customize'
    };
    return icons[method] || 'gavel';
  }

  getCategoryIcon(id: string): string {
    const icons: Record<string, string> = {
      'goods': 'inventory_2',
      'services': 'miscellaneous_services',
      'construction': 'construction',
      'consulting': 'support_agent'
    };
    return icons[id] || 'category';
  }

  getCategoryOverrides(categoryId: string): { boundaryLabel: string; details: string[] }[] {
    const result: { boundaryLabel: string; details: string[] }[] = [];
    for (const b of this.boundaries()) {
      const overrides = b.categoryOverrides?.[categoryId];
      if (overrides) {
        const details: string[] = [];
        if (overrides.cidbRequired) details.push('CIDB Grading Required');
        if (overrides.advertDays) details.push(`Advert Days: ${overrides.advertDays}`);
        if (overrides.description) details.push(overrides.description);
        if (details.length > 0) {
          result.push({ boundaryLabel: b.label, details });
        }
      }
    }
    return result;
  }

  showNotification(message: string, type: 'success' | 'error') {
    this.notification.set(message);
    this.notificationType.set(type);
    setTimeout(() => this.clearNotification(), 5000);
  }

  clearNotification() {
    this.notification.set('');
  }
}
