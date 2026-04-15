import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PeriodFilterService } from '../../core/services/period-filter.service';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { CfoDashboardComponent } from './cfo-dashboard.component';
import { AfsControlDashboardComponent } from './afs-control-dashboard.component';
import { AuditManagementDashboardComponent } from './audit-management-dashboard.component';
import { RfiDashboardComponent } from './rfi-dashboard.component';
import { FindingsDashboardComponent } from './findings-dashboard.component';
import { RatiosDashboardComponent } from './ratios-dashboard.component';
import { ExceptionRegisterDashboardComponent } from './exception-register-dashboard.component';
import { MappingAuditDashboardComponent } from './mapping-audit-dashboard.component';
import { AdjustmentsRegisterDashboardComponent } from './adjustments-register-dashboard.component';
import { EvidenceHeatmapDashboardComponent } from './evidence-heatmap-dashboard.component';
import { MfmaDashboardComponent } from './mfma-dashboard.component';
import { ComplianceDashboardComponent } from './compliance-dashboard.component';
import { GovernancePacksDashboardComponent } from './governance-packs-dashboard.component';
import { GlSyncDashboardComponent } from './gl-sync-dashboard.component';
import { FraudDetectionDashboardComponent } from './fraud-detection-dashboard.component';
import { ValidationRulesComponent } from '../admin/validation-rules.component';
import { RolledUpGlComponent } from './rolled-up-gl.component';
import { AuditSamplingComponent } from './audit-sampling.component';

interface DashboardTab {
  key: string;
  label: string;
  icon: string;
  group: string;
}

@Component({
  selector: 'app-dashboard-container',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    DashboardComponent,
    CfoDashboardComponent,
    AfsControlDashboardComponent,
    AuditManagementDashboardComponent,
    RfiDashboardComponent,
    FindingsDashboardComponent,
    RatiosDashboardComponent,
    ExceptionRegisterDashboardComponent,
    MappingAuditDashboardComponent,
    AdjustmentsRegisterDashboardComponent,
    EvidenceHeatmapDashboardComponent,
    MfmaDashboardComponent,
    ComplianceDashboardComponent,
    GovernancePacksDashboardComponent,
    GlSyncDashboardComponent,
    FraudDetectionDashboardComponent,
    ValidationRulesComponent,
    RolledUpGlComponent,
    AuditSamplingComponent,
  ],
  templateUrl: './dashboard-container.component.html',
  styleUrl: './dashboard-container.component.css',
})
export class DashboardContainerComponent implements OnInit {
  activeTab = signal('overview');
  private periodFilter = inject(PeriodFilterService);

  tabGroups = [
    {
      name: 'Executive',
      tabs: [
        { key: 'overview', label: 'Overview', icon: 'dashboard', group: 'executive' },
        { key: 'cfo', label: 'CFO', icon: 'account_balance', group: 'executive' },
        { key: 'afs-control', label: 'AFS Control', icon: 'assignment_turned_in', group: 'executive' },
      ]
    },
    {
      name: 'Financial',
      tabs: [
        { key: 'ratios', label: 'Ratios', icon: 'speed', group: 'financial' },
        { key: 'rolled-up-gl', label: 'Rolled-Up GL', icon: 'auto_stories', group: 'financial' },
        { key: 'mfma', label: 'MFMA S71/72', icon: 'gavel', group: 'financial' },
        { key: 'compliance', label: 'Compliance', icon: 'verified', group: 'financial' },
      ]
    },
    {
      name: 'Audit',
      tabs: [
        { key: 'audit', label: 'Audit Mgmt', icon: 'shield', group: 'audit' },
        { key: 'findings', label: 'Findings', icon: 'report_problem', group: 'audit' },
        { key: 'rfi', label: 'RFI', icon: 'question_answer', group: 'audit' },
        { key: 'adjustments', label: 'Adjustments', icon: 'swap_horiz', group: 'audit' },
        { key: 'audit-sampling', label: 'Sampling', icon: 'security', group: 'audit' },
      ]
    },
    {
      name: 'Quality',
      tabs: [
        { key: 'exceptions', label: 'Exceptions', icon: 'error_outline', group: 'quality' },
        { key: 'mapping-audit', label: 'Mappings', icon: 'account_tree', group: 'quality' },
        { key: 'evidence', label: 'Evidence', icon: 'fact_check', group: 'quality' },
      ]
    },
    {
      name: 'Governance',
      tabs: [
        { key: 'governance', label: 'Packs', icon: 'library_books', group: 'governance' },
        { key: 'gl-sync', label: 'Data Sync', icon: 'sync', group: 'governance' },
        { key: 'fraud', label: 'Fraud', icon: 'security', group: 'governance' },
        { key: 'rules-engine', label: 'Rules Engine', icon: 'rule', group: 'governance' },
      ]
    },
  ];

  todayFormatted = '';

  currentPeriod = computed(() => {
    const fyLabel = this.periodFilter.selectedFyLabel();
    if (fyLabel) {
      const now = new Date();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const saFyMonth = ((now.getMonth() + 6) % 12) + 1;
      return `${fyLabel} - Period ${saFyMonth} (${months[now.getMonth()]})`;
    }
    return '';
  });

  ngOnInit() {
    const now = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];
    this.todayFormatted = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  }

  onRefresh() {
    const current = this.activeTab();
    this.activeTab.set('');
    setTimeout(() => this.activeTab.set(current), 50);
  }
}
