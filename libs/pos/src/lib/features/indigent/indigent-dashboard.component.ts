import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { IndigentService } from '../../services/indigent.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { StatCardComponent } from '../../shared/components/stat-card.component';
import { SpinnerComponent } from '../../shared/components/spinner.component';
import type { DashboardSummary, SubsidyItemCounts, IndigentType, WriteOffNotification } from '../../models/indigent.models';
import { getFinancialYearList } from '../../services/format.service';

@Component({
  selector: 'app-indigent-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, StatCardComponent, SpinnerComponent],
  templateUrl: './indigent-dashboard.component.html',
  styleUrl: './indigent-dashboard.component.css'
})
export class IndigentDashboardComponent implements OnInit {
  private router = inject(Router);
  summary = signal<DashboardSummary | null>(null);
  subsidyCounts = signal<SubsidyItemCounts | null>(null);
  indigentTypes = signal<IndigentType[]>([]);
  writeOffNotifications = signal<WriteOffNotification[]>([]);
  writeOffLoading = signal(false);
  loading = signal(true);
  error = signal<string | null>(null);
  writeOffDismissed = false;

  finYear: string;
  finYears: string[] = [];

  constructor(private indigentService: IndigentService) {
    const now = new Date();
    const year = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
    this.finYear = `${year - 1}/${year}`;
    this.finYears = getFinancialYearList(5);
  }

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [summaryResult, countsResult, typesResult] = await Promise.allSettled([
        firstValueFrom(this.indigentService.getDashboardSummary(this.finYear)),
        firstValueFrom(this.indigentService.getSubsidyItemCounts()),
        firstValueFrom(this.indigentService.getIndigentTypes()),
      ]);

      if (summaryResult.status === 'fulfilled') {
        this.summary.set(summaryResult.value);
      } else {
        this.summary.set(null);
      }

      if (countsResult.status === 'fulfilled') {
        this.subsidyCounts.set(countsResult.value);
      }

      if (typesResult.status === 'fulfilled') {
        this.indigentTypes.set(Array.isArray(typesResult.value) ? typesResult.value : []);
      }

      this.computeWriteOffAlerts();
    } catch (err: any) {
      this.summary.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  async onFinYearChange(): Promise<void> {
    await this.loadData();
  }

  formatCurrency(value: number | undefined | null): string {
    if (value == null) return 'R 0.00';
    return 'R ' + value.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatNumber(value: number | undefined | null): string {
    if (value == null) return '0';
    return value.toLocaleString('en-ZA');
  }

  getTotalActive(): number {
    return this.summary()?.byIndigentType?.reduce((sum, t) => sum + (t.activeCount || 0), 0) ?? 0;
  }

  getTotalPending(): number {
    return this.summary()?.byIndigentType?.reduce((sum, t) => sum + (t.pendingCount || 0), 0) ?? 0;
  }

  getTotalSubsidyCost(): number {
    return this.summary()?.byIndigentType?.reduce((sum, t) => sum + (t.subsidyCost || 0), 0) ?? 0;
  }

  computeWriteOffAlerts(): void {
    const types = this.indigentTypes();
    const summary = this.summary();
    if (!types.length || !summary?.byIndigentType?.length) {
      this.writeOffNotifications.set([]);
      return;
    }

    const alerts: WriteOffNotification[] = [];
    const now = new Date();

    for (const typeConfig of types) {
      if (!typeConfig.enableContinuousWriteOff || !typeConfig.isActive) continue;

      const typeStats = summary.byIndigentType.find(t => t.indigentTypeId === typeConfig.indigentTypeId);
      if (!typeStats || !typeStats.activeCount) continue;

      const intervalMonths = typeConfig.continuousWriteOffIntervalMonths || 12;
      const isSeniorType = !!typeConfig.exemptSeniorsFromRenewal;

      const nextDueDate = new Date(now);
      nextDueDate.setMonth(nextDueDate.getMonth() + intervalMonths);
      const dueStr = `${nextDueDate.getFullYear()}-${String(nextDueDate.getMonth() + 1).padStart(2, '0')}-${String(nextDueDate.getDate()).padStart(2, '0')}`;

      alerts.push({
        applicationId: 0,
        accountNo: '',
        accountHolderName: `${typeStats.activeCount} active beneficiaries`,
        indigentTypeId: typeConfig.indigentTypeId,
        indigentTypeName: typeConfig.indigentTypeName || typeStats.indigentTypeName,
        lastWriteOffDate: null,
        nextWriteOffDueDate: dueStr,
        outstandingDebt: 0,
        daysPastDue: 0,
        isSenior: isSeniorType,
        seniorAge: isSeniorType ? (typeConfig.seniorExemptionAge || 65) : null,
      });
    }

    this.writeOffNotifications.set(alerts);
  }

  get writeOffAlertCount(): number {
    return this.writeOffNotifications().length;
  }

  get seniorWriteOffAlerts(): WriteOffNotification[] {
    return this.writeOffNotifications().filter(n => n.isSenior);
  }

  get regularWriteOffAlerts(): WriteOffNotification[] {
    return this.writeOffNotifications().filter(n => !n.isSenior);
  }

  getWriteOffTypesConfigured(): IndigentType[] {
    return this.indigentTypes().filter(t => t.isActive && (t.enableWriteOffOnApproval || t.enableContinuousWriteOff));
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  getSubsidyCountEntries(): { label: string; value: number }[] {
    const counts = this.subsidyCounts();
    if (!counts) return [];
    return Object.entries(counts).map(([key, value]) => ({
      label: key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim(),
      value: typeof value === 'number' ? value : 0,
    }));
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
