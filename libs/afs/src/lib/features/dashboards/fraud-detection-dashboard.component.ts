import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { ArtApiService, DuplicatePaymentCandidate, VendorBankingAnomaly, CashbookReversal } from '../../core/services/art-api.service';
import { KpiTileComponent } from '../../shared/components/kpi-tile.component';
import { TrafficLightComponent } from '../../shared/components/traffic-light.component';

interface AnomalyItem {
  id: number;
  reference: string;
  description: string;
  type: string;
  amount: number;
  riskLevel: 'high' | 'medium' | 'low';
  status: string;
  flagReason: string;
}

interface RiskCell {
  severity: string;
  likelihood: string;
  count: number;
  color: string;
}

interface FraudData {
  totalAnomalies: number;
  highRiskItems: number;
  itemsUnderReview: number;
  largeAdjustments: number;
  duplicateEntries: number;
  roundNumberTransactions: number;
  suspiciousItems: AnomalyItem[];
  riskMatrix: RiskCell[];
  severityLabels: string[];
  likelihoodLabels: string[];
  duplicatePayments: DuplicatePaymentCandidate[];
  vendorBankingAnomalies: VendorBankingAnomaly[];
  cashbookReversals: CashbookReversal[];
  emsDataAvailable: boolean;
}

@Component({
  selector: 'app-fraud-detection-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule,
    KpiTileComponent, TrafficLightComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './fraud-detection-dashboard.component.html',
  styleUrl: './fraud-detection-dashboard.component.css'
})
export class FraudDetectionDashboardComponent implements OnInit {
  loading = true;
  error = '';
  data: FraudData | null = null;

  expandedBankAccount: string | null = null;
  expandedInvoiceId: number | null = null;
  drillLoading = false;
  drillVendorDetails: any[] = [];
  drillPaymentDetails: any[] = [];

  private readonly severities = ['low', 'medium', 'high'];
  private readonly likelihoods = ['unlikely', 'possible', 'likely'];

  constructor(private api: ApiService, private artApi: ArtApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    this.api.get<any>('/reports/dashboard').subscribe({
      next: (dashboard) => {
        forkJoin({
          adjustments: this.api.get<any>('/reports/adjustments-register'),
          findings: this.api.get<any>('/reports/findings-extended'),
          duplicatePayments: this.artApi.getDuplicatePayments().pipe(catchError(() => of([]))),
          vendorBankingAnomalies: this.artApi.getVendorBankingAnomalies().pipe(catchError(() => of([]))),
          cashbookReversals: this.artApi.getCashbookReversals().pipe(catchError(() => of([]))),
          artStatus: this.artApi.getStatus().pipe(catchError(() => of({ connected: false, configured: false }))),
        }).subscribe({
          next: ({ adjustments, findings, duplicatePayments, vendorBankingAnomalies, cashbookReversals, artStatus }) => {
            this.data = this.buildFraudData(
              dashboard, adjustments, findings,
              duplicatePayments as DuplicatePaymentCandidate[],
              vendorBankingAnomalies as VendorBankingAnomaly[],
              cashbookReversals as CashbookReversal[],
              (artStatus as any).connected === true,
            );
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: (err) => {
            this.loading = false;
            this.error = err?.error?.message || 'Failed to load fraud detection data';
            this.cdr.markForCheck();
          }
        });
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load dashboard data';
        this.cdr.markForCheck();
      }
    });
  }

  private buildFraudData(
    dashboard: any, adjustments: any, findings: any,
    duplicatePayments: DuplicatePaymentCandidate[],
    vendorBankingAnomalies: VendorBankingAnomaly[],
    cashbookReversals: CashbookReversal[],
    emsConnected: boolean,
  ): FraudData {
    const adjList = Array.isArray(adjustments) ? adjustments : adjustments?.items || adjustments?.data || [];
    const findList = Array.isArray(findings) ? findings : findings?.items || findings?.data || [];

    const largeThreshold = 1000000;
    const largeAdj = adjList.filter((a: any) => Math.abs(a.amount || a.totalAmount || 0) > largeThreshold);
    const roundNum = adjList.filter((a: any) => {
      const amt = Math.abs(a.amount || a.totalAmount || 0);
      return amt > 0 && amt % 10000 === 0;
    });

    const seen = new Set<string>();
    const duplicates: any[] = [];
    for (const a of adjList) {
      const key = `${a.amount || a.totalAmount}|${a.accountCode || a.account}|${a.date || a.transactionDate}`;
      if (seen.has(key)) {
        duplicates.push(a);
      }
      seen.add(key);
    }

    const anomalies: AnomalyItem[] = [];
    let id = 1;

    for (const a of largeAdj.slice(0, 5)) {
      anomalies.push({
        id: id++,
        reference: a.reference || a.adjustmentNumber || `ADJ-${id}`,
        description: a.description || a.narration || 'Large adjustment',
        type: 'Large Adjustment',
        amount: Math.abs(a.amount || a.totalAmount || 0),
        riskLevel: Math.abs(a.amount || a.totalAmount || 0) > largeThreshold * 5 ? 'high' : 'medium',
        status: a.status || 'flagged',
        flagReason: 'Exceeds materiality threshold'
      });
    }

    for (const d of duplicates.slice(0, 3)) {
      anomalies.push({
        id: id++,
        reference: d.reference || d.adjustmentNumber || `DUP-${id}`,
        description: d.description || d.narration || 'Duplicate entry',
        type: 'Duplicate',
        amount: Math.abs(d.amount || d.totalAmount || 0),
        riskLevel: 'high',
        status: 'flagged',
        flagReason: 'Matching amount, account and date'
      });
    }

    for (const r of roundNum.slice(0, 3)) {
      anomalies.push({
        id: id++,
        reference: r.reference || r.adjustmentNumber || `RND-${id}`,
        description: r.description || r.narration || 'Round number transaction',
        type: 'Round Number',
        amount: Math.abs(r.amount || r.totalAmount || 0),
        riskLevel: 'low',
        status: 'under_review',
        flagReason: 'Suspiciously round amount'
      });
    }

    const safeDupPayments = Array.isArray(duplicatePayments) ? duplicatePayments : [];
    const safeBankingAnomalies = Array.isArray(vendorBankingAnomalies) ? vendorBankingAnomalies : [];
    const safeCashbookReversals = Array.isArray(cashbookReversals) ? cashbookReversals : [];

    const emsHighRiskDupPayments = safeDupPayments.filter(dp => dp.TotalPaid > dp.InvoiceAmount).length;
    const emsHighRiskBanking = safeBankingAnomalies.filter(ba => ba.VendorCount > 3).length;
    const emsUnauthReversals = safeCashbookReversals.filter(cr => !cr.ReversalAuthorised).length;

    const jlHighRisk = anomalies.filter(a => a.riskLevel === 'high').length;
    const totalHighRisk = jlHighRisk + emsHighRiskDupPayments + emsHighRiskBanking + emsUnauthReversals;

    const totalAnomalies = anomalies.length + safeDupPayments.length + safeBankingAnomalies.length + safeCashbookReversals.length;

    const underReview = anomalies.filter(a => a.status === 'under_review' || a.status === 'reviewing').length;

    const riskMatrix: RiskCell[] = [];
    for (const lik of this.likelihoods) {
      for (const sev of this.severities) {
        let count = 0;
        if (sev === 'high' && lik === 'likely') count = emsHighRiskBanking + jlHighRisk;
        else if (sev === 'high' && lik === 'possible') count = safeDupPayments.length;
        else if (sev === 'medium' && lik === 'likely') count = safeBankingAnomalies.length - emsHighRiskBanking;
        else if (sev === 'medium' && lik === 'possible') count = safeCashbookReversals.length + (largeAdj.length > jlHighRisk ? largeAdj.length - jlHighRisk : 0);
        else if (sev === 'low' && lik === 'unlikely') count = roundNum.length;

        riskMatrix.push({
          severity: sev,
          likelihood: lik,
          count,
          color: this.getRiskColor(sev, lik)
        });
      }
    }

    return {
      totalAnomalies,
      highRiskItems: totalHighRisk,
      itemsUnderReview: underReview,
      largeAdjustments: largeAdj.length,
      duplicateEntries: duplicates.length + safeDupPayments.length,
      roundNumberTransactions: roundNum.length,
      suspiciousItems: anomalies.slice(0, 10),
      riskMatrix,
      severityLabels: this.severities,
      likelihoodLabels: this.likelihoods,
      duplicatePayments: safeDupPayments,
      vendorBankingAnomalies: safeBankingAnomalies,
      cashbookReversals: safeCashbookReversals,
      emsDataAvailable: emsConnected,
    };
  }

  private getRiskColor(severity: string, likelihood: string): string {
    const sevIdx = this.severities.indexOf(severity);
    const likIdx = this.likelihoods.indexOf(likelihood);
    const score = sevIdx + likIdx;
    if (score >= 3) return '#ef5350';
    if (score >= 2) return '#ff9800';
    if (score >= 1) return '#f59e0b';
    return '#4caf50';
  }

  getCellColor(severity: string, likelihood: string): string {
    return this.getRiskColor(severity, likelihood);
  }

  getCellCount(severity: string, likelihood: string): number {
    const cell = this.data?.riskMatrix.find(c => c.severity === severity && c.likelihood === likelihood);
    return cell?.count || 0;
  }

  getIndicatorWidth(count: number, total: number): number {
    if (total <= 0) return count > 0 ? 100 : 5;
    return Math.max(Math.min((count / total) * 100, 100), 5);
  }

  getRiskStatus(level: string): 'green' | 'amber' | 'red' {
    if (level === 'high') return 'red';
    if (level === 'medium') return 'amber';
    return 'green';
  }

  formatCurrency(value: number): string {
    if (value == null || isNaN(value)) return 'R 0';
    const abs = Math.abs(value);
    let formatted: string;
    if (abs >= 1e9) formatted = (abs / 1e9).toFixed(2) + 'B';
    else if (abs >= 1e6) formatted = (abs / 1e6).toFixed(1) + 'M';
    else if (abs >= 1e3) formatted = (abs / 1e3).toFixed(0) + 'K';
    else formatted = abs.toFixed(0);
    return (value < 0 ? '(R ' : 'R ') + formatted + (value < 0 ? ')' : '');
  }

  formatStatus(status: string): string {
    if (!status) return '—';
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  maskBankAccount(account: string): string {
    if (!account || account.length < 6) return account || '—';
    return '****' + account.slice(-4);
  }

  drillVendorBanking(ba: VendorBankingAnomaly) {
    if (this.expandedBankAccount === ba.BankAccountNo) {
      this.expandedBankAccount = null;
      this.drillVendorDetails = [];
      this.cdr.markForCheck();
      return;
    }
    this.expandedBankAccount = ba.BankAccountNo;
    this.expandedInvoiceId = null;
    this.drillLoading = true;
    this.drillVendorDetails = [];
    this.drillPaymentDetails = [];
    this.cdr.markForCheck();

    this.artApi.getVendorsByBankAccount(ba.BankAccountNo).subscribe({
      next: (vendors) => {
        this.drillVendorDetails = Array.isArray(vendors) ? vendors : [];
        this.drillLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.drillVendorDetails = [];
        this.drillLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  drillDuplicatePayment(dp: DuplicatePaymentCandidate) {
    if (this.expandedInvoiceId === dp.InvoiceID) {
      this.expandedInvoiceId = null;
      this.drillPaymentDetails = [];
      this.cdr.markForCheck();
      return;
    }
    this.expandedInvoiceId = dp.InvoiceID;
    this.expandedBankAccount = null;
    this.drillLoading = true;
    this.drillPaymentDetails = [];
    this.drillVendorDetails = [];
    this.cdr.markForCheck();

    this.artApi.getDuplicatePaymentDetails(dp.InvoiceID).subscribe({
      next: (details) => {
        this.drillPaymentDetails = Array.isArray(details) ? details : [];
        this.drillLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.drillPaymentDetails = [];
        this.drillLoading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
