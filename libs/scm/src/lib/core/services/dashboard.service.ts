import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

export interface KpiCard {
  id: string;
  label: string;
  value: number;
  count?: number;
  total?: number;
  percentage?: number;
  trend: number;
  trendDirection: 'up' | 'down';
  breakdown: Record<string, number>;
}

export interface PipelineStage {
  stage: string;
  count: number;
  avgDays: number;
  targetDays: number;
  items: PipelineItem[];
}

export interface PipelineItem {
  id: string;
  ref: string;
  title: string;
  days: number;
  status: 'on_track' | 'near_target' | 'exceeding';
}

export interface TurnaroundMetric {
  label: string;
  actual: number;
  target: number;
  status: 'within_target' | 'near_target' | 'exceeding_target';
}

export interface ComplianceComponent {
  label: string;
  score: number;
  weight: number;
  detail: string;
}

export interface ComplianceScore {
  overall: number;
  trend: number;
  components: ComplianceComponent[];
}

export interface RecentTransaction {
  date: string;
  ref: string;
  description: string;
  type: string;
  typeClass: string;
  amount: string;
  status: string;
  statusClass: string;
  route: string;
  params: Record<string, string>;
}

export interface ExecutiveDashboard {
  kpiCards: KpiCard[];
  lifecyclePipeline: PipelineStage[];
  turnaroundTimes: TurnaroundMetric[];
  complianceScore: ComplianceScore;
  recentTransactions: RecentTransaction[];
}

export interface UifwCategory {
  amount: number;
  count: number;
  status: string;
  items?: Array<{
    ref: string;
    description: string;
    amount: number;
    status: string;
    reportedDate: string;
    responsible: string;
  }>;
}

export interface ComplianceGate {
  regulation: string;
  description: string;
  status: 'compliant' | 'partial' | 'non_compliant';
  detail: string;
  actionRequired?: number;
}

export interface SodRule {
  rule: string;
  violations: number;
  status: 'clean' | 'violation';
  detail?: string;
}

export interface FraudRiskIndicator {
  indicator: string;
  severity: 'low' | 'medium' | 'high' | 'info' | 'critical';
  detail: string;
  recommendation: string;
}

export interface ComplianceDashboard {
  uifw: {
    unauthorized: UifwCategory;
    irregular: UifwCategory;
    fruitless: UifwCategory;
    cumulative: { amount: number; priorYears: boolean };
  };
  complianceGates: ComplianceGate[];
  segregationOfDuties: SodRule[];
  fraudRiskIndicators: FraudRiskIndicator[];
}

export interface WorkloadItem {
  type: string;
  ref: string;
  title: string;
  days: number;
  priority: 'low' | 'medium' | 'high';
  route: string;
  params: Record<string, string>;
}

export interface Bottleneck {
  stage: string;
  itemCount: number;
  avgDays: number;
  targetDays: number;
  severity: 'on_track' | 'warning' | 'critical';
  route: string;
  params: Record<string, string>;
}

export interface SupplierScore {
  name: string;
  score: number;
  delivery: number;
  quality: number;
  invoiceAccuracy: number;
  bbbeeLevel: number;
}

export interface BudgetCommitment {
  vote: string;
  budget: number;
  committed: number;
  actual: number;
  available: number;
  utilisation: number;
}

export interface SpendCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface OperationalDashboard {
  myWorkload: {
    pendingApprovals: number;
    myRequisitions: number;
    grnToProcess: number;
    invoicesToMatch: number;
    contractsExpiring: number;
    overdueItems: number;
    items: WorkloadItem[];
  };
  bottlenecks: Bottleneck[];
  supplierScorecard: {
    top5: SupplierScore[];
    bottom5: SupplierScore[];
  };
  budgetCommitments: BudgetCommitment[];
  spendAnalytics: {
    byCategory: SpendCategory[];
    byBbbeeLevel: Array<{ level: string; amount: number; percentage: number }>;
    localVsNational: { local: number; national: number };
    monthlyTrend: Array<{ month: string; amount: number }>;
  };
}

export interface AiInsight {
  id: number;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  icon: string;
  title: string;
  message: string;
  timestamp: string;
  category?: string;
  legislationRef?: string;
  legislationDetail?: string;
  actionRoute?: string;
  actionParams?: Record<string, string>;
  recommendation?: string;
  financialImpact?: string;
  impact?: string;
  confidence?: number;
  aiGenerated?: boolean;
}

export interface AttentionTile {
  stage: string;
  count: number;
  value: number;
  oldestAge: number;
  slaBreaches: number;
  trend: 'up' | 'down' | 'stable';
  route: string;
}

export interface AgingHeatmap {
  stages: string[];
  buckets: string[];
  data: number[][];
}

export interface BlockingEntry {
  user: string;
  role: string;
  stage: string;
  itemsPending: number;
  totalValue: number;
  avgAge: number;
  oldestAge: number;
  slaBreaches: number;
  escalated: boolean;
}

export interface FunnelStage {
  stage: string;
  count: number;
  value: number;
  avgDaysInStage: number;
  targetDays: number;
  overSla: number;
  valueStuck: number;
}

export interface Escalation {
  id: string;
  ref: string;
  description: string;
  stage: string;
  daysOverSla: number;
  value: number;
  escalatedTo: string;
  escalationLevel: 'user' | 'manager' | 'cfo';
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

export interface ControlTowerDashboard {
  attentionTiles: AttentionTile[];
  agingHeatmap: AgingHeatmap;
  blockingLeaderboard: BlockingEntry[];
  bottleneckFunnel: FunnelStage[];
  escalationPanel: Escalation[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private api = inject(BaseApiService);

  getExecutiveDashboard(): Observable<ExecutiveDashboard> {
    return this.api.apiGet<ExecutiveDashboard>('/dashboard/executive');
  }

  getComplianceDashboard(): Observable<ComplianceDashboard> {
    return this.api.apiGet<ComplianceDashboard>('/dashboard/compliance');
  }

  getOperationalDashboard(): Observable<OperationalDashboard> {
    return this.api.apiGet<OperationalDashboard>('/dashboard/operational');
  }

  getAiInsights(): Observable<{ insights: AiInsight[] }> {
    return this.api.apiGet<{ insights: AiInsight[] }>('/dashboard/ai-insights');
  }

  getComplianceAiInsights(): Observable<{ insights: AiInsight[] }> {
    return this.api.apiGet<{ insights: AiInsight[] }>('/ai/insights/compliance');
  }

  getOperationalAiInsights(): Observable<{ insights: AiInsight[] }> {
    return this.api.apiGet<{ insights: AiInsight[] }>('/ai/insights/operational');
  }

  getControlTowerAiInsights(): Observable<{ insights: AiInsight[] }> {
    return this.api.apiGet<{ insights: AiInsight[] }>('/ai/insights/control-tower');
  }

  getInvoicePaymentAiInsights(): Observable<{ insights: AiInsight[] }> {
    return this.api.apiGet<{ insights: AiInsight[] }>('/ai/insights/invoice-payment');
  }

  getControlTowerDashboard(): Observable<ControlTowerDashboard> {
    return this.api.apiGet<ControlTowerDashboard>('/dashboard/control-tower');
  }

  getRequisitionAiInsights(): Observable<{ insights: AiInsight[] }> {
    return this.api.apiGet<{ insights: AiInsight[] }>('/ai/insights/requisitions');
  }

  getQuotationAiInsights(): Observable<{ insights: AiInsight[] }> {
    return this.api.apiGet<{ insights: AiInsight[] }>('/ai/insights/quotations');
  }

  getOrderAiInsights(): Observable<{ insights: AiInsight[] }> {
    return this.api.apiGet<{ insights: AiInsight[] }>('/ai/insights/orders');
  }

  getInformalTenderAiInsights(): Observable<{ insights: AiInsight[] }> {
    return this.api.apiGet<{ insights: AiInsight[] }>('/ai/insights/informal-tenders');
  }

  getFormalTenderAiInsights(): Observable<{ insights: AiInsight[] }> {
    return this.api.apiGet<{ insights: AiInsight[] }>('/ai/insights/formal-tenders');
  }
}
