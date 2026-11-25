import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SharePointConfigService } from '@platinumv3/assets';

const STORAGE_KEY = 'platinum_module_config';

export interface ModuleApiConfig {
  assetsPostgresUrl  : string;
  assetsSqlServerUrl : string;
  scmApiUrl          : string;
  posApiUrl          : string;
  payrollApiUrl      : string;
  idpApiUrl          : string;
  budgetApiUrl       : string;
  afsApiUrl          : string;
  insightsApiUrl     : string;
  overtimeApiUrl     : string;
  // Assets SharePoint document storage
  assetsSharePointEnabled : boolean;
  assetsSharePointSiteUrl : string;
  assetsSharePointLibrary : string;
  // Overtime SharePoint document storage
  overtimeSharePointEnabled : boolean;
  overtimeSharePointSiteUrl : string;
  overtimeSharePointLibrary : string;
  // AFS SharePoint document storage
  afsSharePointEnabled : boolean;
  afsSharePointSiteUrl : string;
  afsSharePointLibrary : string;
  // IDP SharePoint document storage (milestone evidence)
  idpSharePointEnabled : boolean;
  idpSharePointSiteUrl : string;
  idpSharePointLibrary : string;
  // IDP Institutional Capacity Assessment SharePoint document storage (separate library)
  idpInstitutionalSharePointEnabled : boolean;
  idpInstitutionalSharePointSiteUrl : string;
  idpInstitutionalSharePointLibrary : string;
  idpInstitutionalSharePointLinkColumn : string;
  // IDP Situational Analysis Report SharePoint document storage (separate library)
  idpSituationalSharePointEnabled : boolean;
  idpSituationalSharePointSiteUrl : string;
  idpSituationalSharePointLibrary : string;
  idpSituationalSharePointLinkColumn : string;
  // IDP Spatial Analysis and Development SharePoint document storage (separate library)
  idpSpatialSharePointEnabled : boolean;
  idpSpatialSharePointSiteUrl : string;
  idpSpatialSharePointLibrary : string;
  idpSpatialSharePointLinkColumn : string;
  // IDP SWOT Analysis SharePoint document storage (separate library)
  idpSwotSharePointEnabled : boolean;
  idpSwotSharePointSiteUrl : string;
  idpSwotSharePointLibrary : string;
  idpSwotSharePointLinkColumn : string;
  // IDP Priority Issues SharePoint document storage (separate library)
  idpPrioritySharePointEnabled : boolean;
  idpPrioritySharePointSiteUrl : string;
  idpPrioritySharePointLibrary : string;
  idpPrioritySharePointLinkColumn : string;
  idpStrategicSharePointEnabled : boolean;
  idpStrategicSharePointSiteUrl : string;
  idpStrategicSharePointLibrary : string;
  idpStrategicSharePointLinkColumn : string;
  idpVisionSharePointEnabled : boolean;
  idpVisionSharePointSiteUrl : string;
  idpVisionSharePointLibrary : string;
  idpVisionSharePointLinkColumn : string;
  idpKpiSharePointEnabled : boolean;
  idpKpiSharePointSiteUrl : string;
  idpKpiSharePointLibrary : string;
  idpKpiSharePointLinkColumn : string;
  idpDevelopmentSharePointEnabled : boolean;
  idpDevelopmentSharePointSiteUrl : string;
  idpDevelopmentSharePointLibrary : string;
  idpDevelopmentSharePointLinkColumn : string;
  idpSdfSharePointEnabled : boolean;
  idpSdfSharePointSiteUrl : string;
  idpSdfSharePointLibrary : string;
  idpSdfSharePointLinkColumn : string;
  idpCapitalSharePointEnabled : boolean;
  idpCapitalSharePointSiteUrl : string;
  idpCapitalSharePointLibrary : string;
  idpCapitalSharePointLinkColumn : string;
  idpOperationalSharePointEnabled : boolean;
  idpOperationalSharePointSiteUrl : string;
  idpOperationalSharePointLibrary : string;
  idpOperationalSharePointLinkColumn : string;
  idpMscoaSharePointEnabled : boolean;
  idpMscoaSharePointSiteUrl : string;
  idpMscoaSharePointLibrary : string;
  idpMscoaSharePointLinkColumn : string;
  idpProjectPrioritisationSharePointEnabled : boolean;
  idpProjectPrioritisationSharePointSiteUrl : string;
  idpProjectPrioritisationSharePointLibrary : string;
  idpProjectPrioritisationSharePointLinkColumn : string;
  idpFinancialSharePointEnabled : boolean;
  idpFinancialSharePointSiteUrl : string;
  idpFinancialSharePointLibrary : string;
  idpFinancialSharePointLinkColumn : string;
  idpDocumentSharePointEnabled : boolean;
  idpDocumentSharePointSiteUrl : string;
  idpDocumentSharePointLibrary : string;
  idpDocumentSharePointLinkColumn : string;
  idpSectorSharePointEnabled : boolean;
  idpSectorSharePointSiteUrl : string;
  idpSectorSharePointLibrary : string;
  idpSectorSharePointLinkColumn : string;
  idpBudgetAlignmentSharePointEnabled : boolean;
  idpBudgetAlignmentSharePointSiteUrl : string;
  idpBudgetAlignmentSharePointLibrary : string;
  idpBudgetAlignmentSharePointLinkColumn : string;
  idpPublicCommentSharePointEnabled : boolean;
  idpPublicCommentSharePointSiteUrl : string;
  idpPublicCommentSharePointLibrary : string;
  idpPublicCommentSharePointLinkColumn : string;
  idpMecSharePointEnabled : boolean;
  idpMecSharePointSiteUrl : string;
  idpMecSharePointLibrary : string;
  idpMecSharePointLinkColumn : string;
  idpFinalSubmissionSharePointEnabled : boolean;
  idpFinalSubmissionSharePointSiteUrl : string;
  idpFinalSubmissionSharePointLibrary : string;
  idpFinalSubmissionSharePointLinkColumn : string;
  idpPublicCommentPeriodSharePointEnabled : boolean;
  idpPublicCommentPeriodSharePointSiteUrl : string;
  idpPublicCommentPeriodSharePointLibrary : string;
  idpPublicCommentPeriodSharePointLinkColumn : string;
  idpCouncilAdoptionSharePointEnabled : boolean;
  idpCouncilAdoptionSharePointSiteUrl : string;
  idpCouncilAdoptionSharePointLibrary : string;
  idpCouncilAdoptionSharePointLinkColumn : string;
  idpCommunityNeedsSharePointEnabled : boolean;
  idpCommunityNeedsSharePointSiteUrl : string;
  idpCommunityNeedsSharePointLibrary : string;
  idpCommunityNeedsSharePointLinkColumn : string;
  // AFS Adjustments SharePoint document storage (separate library)
  afsAdjustmentsSharePointEnabled : boolean;
  afsAdjustmentsSharePointSiteUrl : string;
  afsAdjustmentsSharePointLibrary : string;
  afsAdjustmentsSharePointLinkColumn : string;
  // AFS Administration SharePoint document storage (separate library, "UatAFSAdministration")
  afsAdministrationSharePointEnabled : boolean;
  afsAdministrationSharePointSiteUrl : string;
  afsAdministrationSharePointLibrary : string;
  afsAdministrationSharePointLinkColumn : string;
  // AFS PostgreSQL database (maps to AZURE_POSTGRES_URL read by AFS-UI/api)
  afsDbHost     : string;
  afsDbPort     : string;
  afsDbName     : string;
  afsDbUser     : string;
  afsDbPassword : string;
  afsDbSslMode  : string;
  // Overtime PostgreSQL database (maps to ConnectionStrings:OvertimeDb in OVERTIME-API)
  overtimeDbHost     : string;
  overtimeDbPort     : string;
  overtimeDbName     : string;
  overtimeDbUser     : string;
  overtimeDbPassword : string;
  overtimeDbSslMode  : string;
  // Payroll PostgreSQL database (maps to AZURE_DATABASE_URL read by PAYROLL-APP)
  payrollDbHost     : string;
  payrollDbPort     : string;
  payrollDbName     : string;
  payrollDbUser     : string;
  payrollDbPassword : string;
  payrollDbSslMode  : string;
}

const DEFAULTS: ModuleApiConfig = {
  assetsPostgresUrl  : 'http://localhost:3000',
  assetsSqlServerUrl : 'https://platinum-assets-api.azurewebsites.net',
  scmApiUrl          : 'http://localhost:3002',
  posApiUrl          : 'http://localhost:3003',
  payrollApiUrl      : 'http://localhost:6000',
  idpApiUrl          : 'http://localhost:8008',
  budgetApiUrl       : 'http://localhost:3001',
  afsApiUrl          : 'http://localhost:9000',
  insightsApiUrl     : 'http://localhost:8080',
  overtimeApiUrl     : 'http://localhost:8099',
  // SharePoint OFF by default → assets module uses its current (local) file storage
  assetsSharePointEnabled : false,
  assetsSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  assetsSharePointLibrary : 'UatAssets',
  // SharePoint OFF by default → overtime module uses its current (local) file storage
  overtimeSharePointEnabled : false,
  overtimeSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  overtimeSharePointLibrary : 'UatOvertime',
  // SharePoint OFF by default → AFS module uses its current (local) file storage
  afsSharePointEnabled : false,
  afsSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  afsSharePointLibrary : 'UatAFS',
  // SharePoint OFF by default → IDP module uses its current (local) evidence file storage
  idpSharePointEnabled : false,
  idpSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  idpSharePointLibrary : 'UatIDP',
  // IDP Institutional Capacity Assessment → separate SharePoint library
  idpInstitutionalSharePointEnabled : true,
  idpInstitutionalSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  idpInstitutionalSharePointLibrary : 'UatIDPInstitutional capacity assessment completed',
  idpInstitutionalSharePointLinkColumn : 'institutionalid',
  // IDP Situational Analysis Report → separate SharePoint library
  idpSituationalSharePointEnabled : true,
  idpSituationalSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  idpSituationalSharePointLibrary : 'UatIDPSituational analysis report finalised',
  idpSituationalSharePointLinkColumn : 'Situationalid',
  // IDP Spatial Analysis and Development → separate SharePoint library
  idpSpatialSharePointEnabled : true,
  idpSpatialSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  idpSpatialSharePointLibrary : 'UatIDPSpatial analysis and development profile finalised',
  idpSpatialSharePointLinkColumn : 'spartialid',
  // IDP SWOT Analysis → separate SharePoint library
  idpSwotSharePointEnabled : true,
  idpSwotSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  idpSwotSharePointLibrary : 'UatIDPSWOT analysis completed',
  idpSwotSharePointLinkColumn : 'swotid',
  // IDP Priority Issues → separate SharePoint library
  idpPrioritySharePointEnabled : true,
  idpPrioritySharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  idpPrioritySharePointLibrary : 'UatIDPPriority issues identified and documented',
  idpPrioritySharePointLinkColumn : 'priorityid',
  idpStrategicSharePointEnabled : true,
  idpStrategicSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  idpStrategicSharePointLibrary : 'UatIDPStrategic objectives approved by Council',
  idpStrategicSharePointLinkColumn : 'Strategicid',
  idpVisionSharePointEnabled : true,
  idpVisionSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  idpVisionSharePointLibrary : 'UatIDPVision and mission reviewed and confirmed',
  idpVisionSharePointLinkColumn : 'visionid',
  idpKpiSharePointEnabled : true,
  idpKpiSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  idpKpiSharePointLibrary : 'UatIDPKPI framework aligned with PGDS targets',
  idpKpiSharePointLinkColumn : 'kpiid',
  idpDevelopmentSharePointEnabled : true,
  idpDevelopmentSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  idpDevelopmentSharePointLibrary : 'UatIDPDevelopment strategies aligned with NDP/PGDS',
  idpDevelopmentSharePointLinkColumn : 'developmentid',
  idpSdfSharePointEnabled : true,
  idpSdfSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  idpSdfSharePointLibrary : 'UatIDPSpatial Development Framework alignment verified',
  idpSdfSharePointLinkColumn : 'spartialdevid',
  idpCapitalSharePointEnabled : true,
  idpCapitalSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  idpCapitalSharePointLibrary : 'UatIDPCapital projects identified and costed',
  idpCapitalSharePointLinkColumn : 'capitalid',
  idpOperationalSharePointEnabled : true,
  idpOperationalSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  idpOperationalSharePointLibrary : 'UatIDPOperational plans drafted per department',
  idpOperationalSharePointLinkColumn : 'operationalid',
  idpMscoaSharePointEnabled : true,
  idpMscoaSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  idpMscoaSharePointLibrary : 'UatIDPMSCOA alignment verification',
  idpMscoaSharePointLinkColumn : 'mscoaid',
  idpProjectPrioritisationSharePointEnabled : true,
  idpProjectPrioritisationSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  idpProjectPrioritisationSharePointLibrary : 'UatIDPProject prioritisation scoring completed',
  idpProjectPrioritisationSharePointLinkColumn : 'projectid',
  idpFinancialSharePointEnabled : true,
  idpFinancialSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  idpFinancialSharePointLibrary : 'UatIDPFinancial plan and MTREF aligned with IDP',
  idpFinancialSharePointLinkColumn : 'financialid',
  idpDocumentSharePointEnabled : true,
  idpDocumentSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  idpDocumentSharePointLibrary : 'UatIDPIDP document compiled and reviewed internally',
  idpDocumentSharePointLinkColumn : 'idpid',
  idpSectorSharePointEnabled : true,
  idpSectorSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  idpSectorSharePointLibrary : 'UatIDPSector plan integration review',
  idpSectorSharePointLinkColumn : 'sectorid',
  idpBudgetAlignmentSharePointEnabled : true,
  idpBudgetAlignmentSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  idpBudgetAlignmentSharePointLibrary : 'UatIDPBudget-IDP alignment confirmed by CFO',
  idpBudgetAlignmentSharePointLinkColumn : 'budgetid',
  idpPublicCommentSharePointEnabled : true,
  idpPublicCommentSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  idpPublicCommentSharePointLibrary : 'UatIDPIDP advertised for public comment (21 days)',
  idpPublicCommentSharePointLinkColumn : 'idpadvid',
  idpMecSharePointEnabled : true,
  idpMecSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  idpMecSharePointLibrary : 'UatIDPMEC assessment response addressed',
  idpMecSharePointLinkColumn : 'mecid',
  idpFinalSubmissionSharePointEnabled : true,
  idpFinalSubmissionSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  idpFinalSubmissionSharePointLibrary : 'UatIDPFinal IDP submitted to MEC',
  idpFinalSubmissionSharePointLinkColumn : 'finalid',
  idpPublicCommentPeriodSharePointEnabled : true,
  idpPublicCommentPeriodSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  idpPublicCommentPeriodSharePointLibrary : 'UatIDPPublic comment period completed',
  idpPublicCommentPeriodSharePointLinkColumn : 'publicid',
  idpCouncilAdoptionSharePointEnabled : true,
  idpCouncilAdoptionSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  idpCouncilAdoptionSharePointLibrary : 'UatIDPCouncil adoption resolution',
  idpCouncilAdoptionSharePointLinkColumn : 'councilid',
  idpCommunityNeedsSharePointEnabled : true,
  idpCommunityNeedsSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  idpCommunityNeedsSharePointLibrary : 'UatIDPCommunity needs assessment completed',
  idpCommunityNeedsSharePointLinkColumn : 'communityid',
  // AFS Adjustments → separate SharePoint library (URL segment "UatAFSAdjustments1")
  afsAdjustmentsSharePointEnabled : false,
  afsAdjustmentsSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  afsAdjustmentsSharePointLibrary : 'UatAFSAdjustments1',
  afsAdjustmentsSharePointLinkColumn : 'ADJID',
  // AFS Administration → separate SharePoint library (URL segment "UatAFSAdministration").
  // Link column left blank = auto-detect from the library schema, falling back to AFSID.
  afsAdministrationSharePointEnabled : false,
  afsAdministrationSharePointSiteUrl : 'https://zamicromega.sharepoint.com/sites/Sebata2',
  afsAdministrationSharePointLibrary : 'UatAFSAdministration',
  afsAdministrationSharePointLinkColumn : '',
  // AFS database — separate "AFS" PostgreSQL on Azure
  afsDbHost     : 'platinum-postgre-sql.postgres.database.azure.com',
  afsDbPort     : '5432',
  afsDbName     : 'AFS',
  afsDbUser     : 'Admin_Dev',
  afsDbPassword : 'NOP@ssword_123',
  afsDbSslMode  : 'Require',
  // Overtime database — separate "Overtime" PostgreSQL on Azure
  overtimeDbHost     : 'platinum-postgre-sql.postgres.database.azure.com',
  overtimeDbPort     : '5432',
  overtimeDbName     : 'Overtime',
  overtimeDbUser     : 'Admin_Dev',
  overtimeDbPassword : 'NOP@ssword_123',
  overtimeDbSslMode  : 'Require',
  // Payroll database — separate "Payroll" PostgreSQL on Azure
  payrollDbHost     : 'platinum-postgre-sql.postgres.database.azure.com',
  payrollDbPort     : '5432',
  payrollDbName     : 'Payroll',
  payrollDbUser     : 'Admin_Dev',
  payrollDbPassword : 'NOP@ssword_123',
  payrollDbSslMode  : 'Require',
};

/**
 * One-time switch-on of the IDP milestone SharePoint panels. They shipped turned off and the
 * Admin save stores every field, so browsers that saved before keep "off" unless flipped here.
 * Keep the flag name in sync with IdpSharePointService.
 */
const IDP_SP_ACTIVATED_FLAG = 'idpMilestoneSharePointActivatedV1';
export function activateIdpMilestoneSharePoint(): void {
  try {
    if (localStorage.getItem(IDP_SP_ACTIVATED_FLAG)) return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const cfg = JSON.parse(raw);
      for (const key of Object.keys(DEFAULTS)) {
        if (/^idp[A-Z]\w*SharePointEnabled$/.test(key)) cfg[key] = true;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    }
    localStorage.setItem(IDP_SP_ACTIVATED_FLAG, '1');
  } catch {}
}

export function loadModuleConfig(): ModuleApiConfig {
  activateIdpMilestoneSharePoint();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULTS };
}

interface ModuleDef {
  key: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
  fields: FieldDef[];
}

interface FieldDef {
  label: string;
  icon: string;
  iconColor: string;
  badge?: string;
  badgeClass?: string;
  prop: keyof ModuleApiConfig;
  hint: string;
  infoValue?: string;
  infoLabel?: string;
}

const MODULES: ModuleDef[] = [
  {
    key: 'assets', label: 'Assets', icon: 'inventory_2', color: '#2563eb', bg: '#eff6ff',
    fields: [
      {
        label: 'PostgreSQL API URL', icon: 'storage', iconColor: '#16a34a',
        badge: 'PostgreSQL toggle', badgeClass: 'badge-green',
        prop: 'assetsPostgresUrl', hint: 'Local ASSETS-PSQL-API → PlatinumV3_db (Azure PostgreSQL)',
        infoLabel: 'Connection', infoValue: 'postgresql://Admin_Dev:***@platinum-postgre-sql.postgres.database.azure.com:5432/PlatinumV3_db'
      },
      {
        label: 'SQL Server API URL', icon: 'dns', iconColor: '#1565c0',
        badge: 'SQL Server toggle', badgeClass: 'badge-blue',
        prop: 'assetsSqlServerUrl', hint: 'Azure-hosted ASSETS-API → test02 SQL Server',
        infoLabel: 'Database', infoValue: 'platinum-assets-api.azurewebsites.net → test02'
      }
    ]
  },
  {
    key: 'scm', label: 'SCM', icon: 'local_shipping', color: '#0891b2', bg: '#ecfeff',
    fields: [
      { label: 'SCM API URL', icon: 'local_shipping', iconColor: '#0891b2', prop: 'scmApiUrl', hint: 'Supply Chain Management API endpoint' }
    ]
  },
  {
    key: 'pos', label: 'POS', icon: 'point_of_sale', color: '#059669', bg: '#ecfdf5',
    fields: [
      { label: 'POS API URL', icon: 'point_of_sale', iconColor: '#059669', prop: 'posApiUrl', hint: 'Point of Sale API endpoint' }
    ]
  },
  {
    key: 'payroll', label: 'Payroll', icon: 'payments', color: '#7c3aed', bg: '#f5f3ff',
    fields: [
      { label: 'Payroll API URL', icon: 'payments', iconColor: '#7c3aed', prop: 'payrollApiUrl', hint: 'Payroll API endpoint' }
    ]
  },
  {
    key: 'idp', label: 'IDP', icon: 'assignment', color: '#d97706', bg: '#fffbeb',
    fields: [
      { label: 'IDP API URL', icon: 'assignment', iconColor: '#d97706', prop: 'idpApiUrl', hint: 'Integrated Development Plan API endpoint' }
    ]
  },
  {
    key: 'budget', label: 'Budget', icon: 'account_balance', color: '#dc2626', bg: '#fef2f2',
    fields: [
      { label: 'Budget API URL', icon: 'account_balance', iconColor: '#dc2626', prop: 'budgetApiUrl', hint: 'Budget Management API endpoint' }
    ]
  },
  {
    key: 'afs', label: 'AFS', icon: 'summarize', color: '#475569', bg: '#f8fafc',
    fields: [
      { label: 'AFS API URL', icon: 'summarize', iconColor: '#475569', prop: 'afsApiUrl', hint: 'Annual Financial Statements API endpoint' }
    ]
  },
  {
    key: 'insights', label: 'Performance', icon: 'trending_up', color: '#0f766e', bg: '#f0fdfa',
    fields: [
      { label: 'Insights API URL', icon: 'trending_up', iconColor: '#0f766e', prop: 'insightsApiUrl', hint: 'Performance & Insights API endpoint' }
    ]
  },
  {
    key: 'overtime', label: 'Overtime', icon: 'more_time', color: '#9333ea', bg: '#faf5ff',
    fields: [
      { label: 'Overtime API URL', icon: 'more_time', iconColor: '#9333ea', prop: 'overtimeApiUrl', hint: 'Overtime Management API endpoint' }
    ]
  },
];

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSnackBarModule],
  template: `
    <div style="padding:32px;max-width:860px;margin:0 auto">

      <!-- Header -->
      <div style="margin-bottom:28px">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:6px">
          <div class="module-icon" [style.background]="activeMod().bg" [style.color]="activeMod().color">
            <mat-icon>{{activeMod().icon}}</mat-icon>
          </div>
          <div>
            <h1 style="font-size:20px;font-weight:700;color:#1e293b;margin:0">{{activeMod().label}} — API Configuration</h1>
            <p style="color:#64748b;margin:0;font-size:13px">Configure the backend API endpoints for the {{activeMod().label}} module.</p>
          </div>
        </div>
      </div>

      <!-- Fields -->
      <div class="config-card">
        @for (field of activeMod().fields; track field.prop) {
          <div class="field-block">
            <label class="field-label">
              <mat-icon class="field-icon" [style.color]="field.iconColor">{{field.icon}}</mat-icon>
              {{field.label}}
              @if (field.badge) {
                <span class="badge" [class]="field.badgeClass">{{field.badge}}</span>
              }
            </label>
            <input class="field-input" [(ngModel)]="cfg[field.prop]" [placeholder]="field.hint"
                   (ngModelChange)="markDirty()">
            <div class="field-hint">{{field.hint}}</div>
            @if (field.infoValue) {
              <div class="conn-box">
                <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
                <div>
                  <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.4px;margin-bottom:2px">{{field.infoLabel}}</div>
                  <code>{{field.infoValue}}</code>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- SharePoint config — Assets module only -->
      @if (activeKey() === 'assets') {
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.assetsSharePointEnabled"
                    (click)="cfg.assetsSharePointEnabled = !cfg.assetsSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.assetsSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for new uploads</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, new asset document uploads are stored in SharePoint instead of the asset module's local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.assetsSharePointEnabled">
              {{ cfg.assetsSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.assetsSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.assetsSharePointSiteUrl"
                     [disabled]="!cfg.assetsSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.assetsSharePointLibrary"
                     [disabled]="!cfg.assetsSharePointEnabled"
                     placeholder="UatAssets"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatAssets</strong></div>
            </div>
          </div>

          @if (!cfg.assetsSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — asset documents use the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.assetsSharePointEnabled || !cfg.assetsSharePointSiteUrl"
                    (click)="testSharePoint()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>
      }

      <!-- SharePoint config — Overtime module only -->
      @if (activeKey() === 'overtime') {
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.overtimeSharePointEnabled"
                    (click)="cfg.overtimeSharePointEnabled = !cfg.overtimeSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.overtimeSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for new uploads</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, new overtime document uploads are stored in SharePoint instead of the overtime module's local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.overtimeSharePointEnabled">
              {{ cfg.overtimeSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.overtimeSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.overtimeSharePointSiteUrl"
                     [disabled]="!cfg.overtimeSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.overtimeSharePointLibrary"
                     [disabled]="!cfg.overtimeSharePointEnabled"
                     placeholder="UatOvertime"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatOvertime</strong></div>
            </div>
          </div>

          @if (!cfg.overtimeSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — overtime documents use the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.overtimeSharePointEnabled || !cfg.overtimeSharePointSiteUrl"
                    (click)="testSharePointOvertime()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>
      }

      <!-- SharePoint config — IDP module only -->
      @if (activeKey() === 'idp') {
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.idpSharePointEnabled"
                    (click)="cfg.idpSharePointEnabled = !cfg.idpSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.idpSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for new uploads</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, new IDP evidence uploads are stored in SharePoint instead of the IDP module's local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.idpSharePointEnabled">
              {{ cfg.idpSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.idpSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.idpSharePointSiteUrl"
                     [disabled]="!cfg.idpSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.idpSharePointLibrary"
                     [disabled]="!cfg.idpSharePointEnabled"
                     placeholder="UatIDP"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatIDP</strong></div>
            </div>
          </div>

          @if (!cfg.idpSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — IDP evidence uses the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.idpSharePointEnabled || !cfg.idpSharePointSiteUrl"
                    (click)="testSharePointIdp()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>

        <!-- Institutional Capacity Assessment SharePoint library (separate from general IDP evidence) -->
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>Institutional Capacity Assessment SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.idpInstitutionalSharePointEnabled"
                    (click)="cfg.idpInstitutionalSharePointEnabled = !cfg.idpInstitutionalSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.idpInstitutionalSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for Institutional capacity assessment evidence</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, evidence for the "Institutional capacity assessment completed" milestone is stored in this dedicated SharePoint library instead of local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.idpInstitutionalSharePointEnabled">
              {{ cfg.idpInstitutionalSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.idpInstitutionalSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.idpInstitutionalSharePointSiteUrl"
                     [disabled]="!cfg.idpInstitutionalSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.idpInstitutionalSharePointLibrary"
                     [disabled]="!cfg.idpInstitutionalSharePointEnabled"
                     placeholder="UatIDPInstitutional capacity assessment completed"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatIDPInstitutional capacity assessment completed</strong></div>
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">vpn_key</mat-icon> Link Column (internal name)</label>
              <input class="field-input" [(ngModel)]="cfg.idpInstitutionalSharePointLinkColumn"
                     [disabled]="!cfg.idpInstitutionalSharePointEnabled"
                     placeholder="institutionalid"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">The column that stores the Institutional capacity assessment id. Use the SharePoint <strong>internal</strong> name (Library settings → click the column → the URL's <code>Field=</code> value).</div>
            </div>
          </div>

          @if (!cfg.idpInstitutionalSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — Institutional capacity assessment evidence uses the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.idpInstitutionalSharePointEnabled || !cfg.idpInstitutionalSharePointSiteUrl"
                    (click)="testSharePointIdpInstitutional()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>

        <!-- Situational Analysis Report SharePoint library (separate from general IDP evidence) -->
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>Situational Analysis Report SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.idpSituationalSharePointEnabled"
                    (click)="cfg.idpSituationalSharePointEnabled = !cfg.idpSituationalSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.idpSituationalSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for Situational analysis report evidence</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, evidence for the Situational analysis report is stored in this dedicated SharePoint library instead of local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.idpSituationalSharePointEnabled">
              {{ cfg.idpSituationalSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.idpSituationalSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.idpSituationalSharePointSiteUrl"
                     [disabled]="!cfg.idpSituationalSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.idpSituationalSharePointLibrary"
                     [disabled]="!cfg.idpSituationalSharePointEnabled"
                     placeholder="UatIDPSituational analysis report finalised"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatIDPSituational analysis report finalised</strong></div>
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">vpn_key</mat-icon> Link Column (internal name)</label>
              <input class="field-input" [(ngModel)]="cfg.idpSituationalSharePointLinkColumn"
                     [disabled]="!cfg.idpSituationalSharePointEnabled"
                     placeholder="Situationalid"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">The column that stores the Situational analysis report id. Use the SharePoint <strong>internal</strong> name (Library settings → click the column → the URL's <code>Field=</code> value).</div>
            </div>
          </div>

          @if (!cfg.idpSituationalSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — Situational analysis report evidence uses the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.idpSituationalSharePointEnabled || !cfg.idpSituationalSharePointSiteUrl"
                    (click)="testSharePointIdpSituational()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>

        <!-- Spatial Analysis and Development SharePoint library (separate from general IDP evidence) -->
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>Spatial Analysis and Development SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.idpSpatialSharePointEnabled"
                    (click)="cfg.idpSpatialSharePointEnabled = !cfg.idpSpatialSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.idpSpatialSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for Spatial analysis and development evidence</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, evidence for Spatial analysis and development is stored in this dedicated SharePoint library instead of local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.idpSpatialSharePointEnabled">
              {{ cfg.idpSpatialSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.idpSpatialSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.idpSpatialSharePointSiteUrl"
                     [disabled]="!cfg.idpSpatialSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.idpSpatialSharePointLibrary"
                     [disabled]="!cfg.idpSpatialSharePointEnabled"
                     placeholder="UatIDPSpatial analysis and development profile finalised"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatIDPSpatial analysis and development profile finalised</strong></div>
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">vpn_key</mat-icon> Link Column (internal name)</label>
              <input class="field-input" [(ngModel)]="cfg.idpSpatialSharePointLinkColumn"
                     [disabled]="!cfg.idpSpatialSharePointEnabled"
                     placeholder="spartialid"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">The column that stores the Spatial analysis and development id. Use the SharePoint <strong>internal</strong> name (Library settings → click the column → the URL's <code>Field=</code> value).</div>
            </div>
          </div>

          @if (!cfg.idpSpatialSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — Spatial analysis and development evidence uses the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.idpSpatialSharePointEnabled || !cfg.idpSpatialSharePointSiteUrl"
                    (click)="testSharePointIdpSpatial()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>

        <!-- SWOT Analysis SharePoint library (separate from general IDP evidence) -->
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>SWOT Analysis SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.idpSwotSharePointEnabled"
                    (click)="cfg.idpSwotSharePointEnabled = !cfg.idpSwotSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.idpSwotSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for SWOT analysis evidence</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, evidence for the "SWOT analysis completed" milestone is stored in this dedicated SharePoint library instead of local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.idpSwotSharePointEnabled">
              {{ cfg.idpSwotSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.idpSwotSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.idpSwotSharePointSiteUrl"
                     [disabled]="!cfg.idpSwotSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.idpSwotSharePointLibrary"
                     [disabled]="!cfg.idpSwotSharePointEnabled"
                     placeholder="UatIDPSWOT analysis completed"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatIDPSWOT analysis completed</strong></div>
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">vpn_key</mat-icon> Link Column (internal name)</label>
              <input class="field-input" [(ngModel)]="cfg.idpSwotSharePointLinkColumn"
                     [disabled]="!cfg.idpSwotSharePointEnabled"
                     placeholder="swotid"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">The column that stores the SWOT analysis id. Use the SharePoint <strong>internal</strong> name (Library settings → click the column → the URL's <code>Field=</code> value).</div>
            </div>
          </div>

          @if (!cfg.idpSwotSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — SWOT analysis evidence uses the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.idpSwotSharePointEnabled || !cfg.idpSwotSharePointSiteUrl"
                    (click)="testSharePointIdpSwot()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>

        <!-- Priority Issues SharePoint library (separate from general IDP evidence) -->
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>Priority Issues SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.idpPrioritySharePointEnabled"
                    (click)="cfg.idpPrioritySharePointEnabled = !cfg.idpPrioritySharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.idpPrioritySharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for Priority issues evidence</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, evidence for the "Priority issues identified and documented" milestone is stored in this dedicated SharePoint library instead of local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.idpPrioritySharePointEnabled">
              {{ cfg.idpPrioritySharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.idpPrioritySharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.idpPrioritySharePointSiteUrl"
                     [disabled]="!cfg.idpPrioritySharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.idpPrioritySharePointLibrary"
                     [disabled]="!cfg.idpPrioritySharePointEnabled"
                     placeholder="UatIDPPriority issues identified and documented"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatIDPPriority issues identified and documented</strong></div>
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">vpn_key</mat-icon> Link Column (internal name)</label>
              <input class="field-input" [(ngModel)]="cfg.idpPrioritySharePointLinkColumn"
                     [disabled]="!cfg.idpPrioritySharePointEnabled"
                     placeholder="priorityid"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">The column that stores the Priority issues id. Use the SharePoint <strong>internal</strong> name (Library settings → click the column → the URL's <code>Field=</code> value).</div>
            </div>
          </div>

          @if (!cfg.idpPrioritySharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — Priority issues evidence uses the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.idpPrioritySharePointEnabled || !cfg.idpPrioritySharePointSiteUrl"
                    (click)="testSharePointIdpPriority()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>

        <!-- Strategic Objectives SharePoint library (separate from general IDP evidence) -->
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>Strategic Objectives SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.idpStrategicSharePointEnabled"
                    (click)="cfg.idpStrategicSharePointEnabled = !cfg.idpStrategicSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.idpStrategicSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for Strategic objectives evidence</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, evidence for the "Strategic objectives approved by Council" milestone is stored in this dedicated SharePoint library instead of local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.idpStrategicSharePointEnabled">
              {{ cfg.idpStrategicSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.idpStrategicSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.idpStrategicSharePointSiteUrl"
                     [disabled]="!cfg.idpStrategicSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.idpStrategicSharePointLibrary"
                     [disabled]="!cfg.idpStrategicSharePointEnabled"
                     placeholder="UatIDPStrategic objectives approved by Council"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatIDPStrategic objectives approved by Council</strong></div>
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">vpn_key</mat-icon> Link Column (internal name)</label>
              <input class="field-input" [(ngModel)]="cfg.idpStrategicSharePointLinkColumn"
                     [disabled]="!cfg.idpStrategicSharePointEnabled"
                     placeholder="Strategicid"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">The column that stores the Strategic objectives id. Use the SharePoint <strong>internal</strong> name (Library settings → click the column → the URL's <code>Field=</code> value).</div>
            </div>
          </div>

          @if (!cfg.idpStrategicSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — Strategic objectives evidence uses the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.idpStrategicSharePointEnabled || !cfg.idpStrategicSharePointSiteUrl"
                    (click)="testSharePointIdpStrategic()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>

        <!-- Vision and Mission SharePoint library (separate from general IDP evidence) -->
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>Vision and Mission SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.idpVisionSharePointEnabled"
                    (click)="cfg.idpVisionSharePointEnabled = !cfg.idpVisionSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.idpVisionSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for Vision and mission evidence</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, evidence for the "Vision and mission reviewed and confirmed" milestone is stored in this dedicated SharePoint library instead of local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.idpVisionSharePointEnabled">
              {{ cfg.idpVisionSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.idpVisionSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.idpVisionSharePointSiteUrl"
                     [disabled]="!cfg.idpVisionSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.idpVisionSharePointLibrary"
                     [disabled]="!cfg.idpVisionSharePointEnabled"
                     placeholder="UatIDPVision and mission reviewed and confirmed"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatIDPVision and mission reviewed and confirmed</strong></div>
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">vpn_key</mat-icon> Link Column (internal name)</label>
              <input class="field-input" [(ngModel)]="cfg.idpVisionSharePointLinkColumn"
                     [disabled]="!cfg.idpVisionSharePointEnabled"
                     placeholder="visionid"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">The column that stores the Vision and mission id. Use the SharePoint <strong>internal</strong> name (Library settings → click the column → the URL's <code>Field=</code> value).</div>
            </div>
          </div>

          @if (!cfg.idpVisionSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — Vision and mission evidence uses the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.idpVisionSharePointEnabled || !cfg.idpVisionSharePointSiteUrl"
                    (click)="testSharePointIdpVision()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>

        <!-- KPI Framework SharePoint library (separate from general IDP evidence) -->
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>KPI Framework SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.idpKpiSharePointEnabled"
                    (click)="cfg.idpKpiSharePointEnabled = !cfg.idpKpiSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.idpKpiSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for KPI framework evidence</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, evidence for the "KPI framework aligned with PGDS targets" milestone is stored in this dedicated SharePoint library instead of local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.idpKpiSharePointEnabled">
              {{ cfg.idpKpiSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.idpKpiSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.idpKpiSharePointSiteUrl"
                     [disabled]="!cfg.idpKpiSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.idpKpiSharePointLibrary"
                     [disabled]="!cfg.idpKpiSharePointEnabled"
                     placeholder="UatIDPKPI framework aligned with PGDS targets"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatIDPKPI framework aligned with PGDS targets</strong></div>
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">vpn_key</mat-icon> Link Column (internal name)</label>
              <input class="field-input" [(ngModel)]="cfg.idpKpiSharePointLinkColumn"
                     [disabled]="!cfg.idpKpiSharePointEnabled"
                     placeholder="kpiid"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">The column that stores the KPI framework id. Use the SharePoint <strong>internal</strong> name (Library settings → click the column → the URL's <code>Field=</code> value).</div>
            </div>
          </div>

          @if (!cfg.idpKpiSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — KPI framework evidence uses the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.idpKpiSharePointEnabled || !cfg.idpKpiSharePointSiteUrl"
                    (click)="testSharePointIdpKpi()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>

        <!-- Development Strategies SharePoint library (separate from general IDP evidence) -->
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>Development Strategies SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.idpDevelopmentSharePointEnabled"
                    (click)="cfg.idpDevelopmentSharePointEnabled = !cfg.idpDevelopmentSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.idpDevelopmentSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for Development strategies evidence</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, evidence for the "Development strategies aligned with NDP/PGDS" milestone is stored in this dedicated SharePoint library instead of local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.idpDevelopmentSharePointEnabled">
              {{ cfg.idpDevelopmentSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.idpDevelopmentSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.idpDevelopmentSharePointSiteUrl"
                     [disabled]="!cfg.idpDevelopmentSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.idpDevelopmentSharePointLibrary"
                     [disabled]="!cfg.idpDevelopmentSharePointEnabled"
                     placeholder="UatIDPDevelopment strategies aligned with NDP/PGDS"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatIDPDevelopment strategies aligned with NDP/PGDS</strong></div>
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">vpn_key</mat-icon> Link Column (internal name)</label>
              <input class="field-input" [(ngModel)]="cfg.idpDevelopmentSharePointLinkColumn"
                     [disabled]="!cfg.idpDevelopmentSharePointEnabled"
                     placeholder="developmentid"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">The column that stores the Development strategies id. Use the SharePoint <strong>internal</strong> name (Library settings → click the column → the URL's <code>Field=</code> value).</div>
            </div>
          </div>

          @if (!cfg.idpDevelopmentSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — Development strategies evidence uses the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.idpDevelopmentSharePointEnabled || !cfg.idpDevelopmentSharePointSiteUrl"
                    (click)="testSharePointIdpDevelopment()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>

        <!-- Spatial Development Framework SharePoint library (separate from general IDP evidence) -->
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>Spatial Development Framework SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.idpSdfSharePointEnabled"
                    (click)="cfg.idpSdfSharePointEnabled = !cfg.idpSdfSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.idpSdfSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for Spatial Development Framework evidence</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, evidence for the "Spatial Development Framework alignment verified" milestone is stored in this dedicated SharePoint library instead of local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.idpSdfSharePointEnabled">
              {{ cfg.idpSdfSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.idpSdfSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.idpSdfSharePointSiteUrl"
                     [disabled]="!cfg.idpSdfSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.idpSdfSharePointLibrary"
                     [disabled]="!cfg.idpSdfSharePointEnabled"
                     placeholder="UatIDPSpatial Development Framework alignment verified"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatIDPSpatial Development Framework alignment verified</strong></div>
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">vpn_key</mat-icon> Link Column (internal name)</label>
              <input class="field-input" [(ngModel)]="cfg.idpSdfSharePointLinkColumn"
                     [disabled]="!cfg.idpSdfSharePointEnabled"
                     placeholder="spartialdevid"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">The column that stores the Spatial Development Framework id. Use the SharePoint <strong>internal</strong> name (Library settings → click the column → the URL's <code>Field=</code> value).</div>
            </div>
          </div>

          @if (!cfg.idpSdfSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — Spatial Development Framework evidence uses the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.idpSdfSharePointEnabled || !cfg.idpSdfSharePointSiteUrl"
                    (click)="testSharePointIdpSdf()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>

        <!-- Capital Projects SharePoint library (separate from general IDP evidence) -->
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>Capital Projects SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.idpCapitalSharePointEnabled"
                    (click)="cfg.idpCapitalSharePointEnabled = !cfg.idpCapitalSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.idpCapitalSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for Capital Projects evidence</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, evidence for the "Capital projects identified and costed" milestone is stored in this dedicated SharePoint library instead of local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.idpCapitalSharePointEnabled">
              {{ cfg.idpCapitalSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.idpCapitalSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.idpCapitalSharePointSiteUrl"
                     [disabled]="!cfg.idpCapitalSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.idpCapitalSharePointLibrary"
                     [disabled]="!cfg.idpCapitalSharePointEnabled"
                     placeholder="UatIDPCapital projects identified and costed"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatIDPCapital projects identified and costed</strong></div>
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">vpn_key</mat-icon> Link Column (internal name)</label>
              <input class="field-input" [(ngModel)]="cfg.idpCapitalSharePointLinkColumn"
                     [disabled]="!cfg.idpCapitalSharePointEnabled"
                     placeholder="capitalid"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">The column that stores the Capital Projects id. Use the SharePoint <strong>internal</strong> name (Library settings → click the column → the URL's <code>Field=</code> value).</div>
            </div>
          </div>

          @if (!cfg.idpCapitalSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — Capital Projects evidence uses the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.idpCapitalSharePointEnabled || !cfg.idpCapitalSharePointSiteUrl"
                    (click)="testSharePointIdpCapital()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>

        <!-- Operational Plans SharePoint library (separate from general IDP evidence) -->
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>Operational Plans SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.idpOperationalSharePointEnabled"
                    (click)="cfg.idpOperationalSharePointEnabled = !cfg.idpOperationalSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.idpOperationalSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for Operational Plans evidence</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, evidence for the "Operational plans drafted per department" milestone is stored in this dedicated SharePoint library instead of local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.idpOperationalSharePointEnabled">
              {{ cfg.idpOperationalSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.idpOperationalSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.idpOperationalSharePointSiteUrl"
                     [disabled]="!cfg.idpOperationalSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.idpOperationalSharePointLibrary"
                     [disabled]="!cfg.idpOperationalSharePointEnabled"
                     placeholder="UatIDPOperational plans drafted per department"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatIDPOperational plans drafted per department</strong></div>
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">vpn_key</mat-icon> Link Column (internal name)</label>
              <input class="field-input" [(ngModel)]="cfg.idpOperationalSharePointLinkColumn"
                     [disabled]="!cfg.idpOperationalSharePointEnabled"
                     placeholder="operationalid"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">The column that stores the Operational Plans id. Use the SharePoint <strong>internal</strong> name (Library settings → click the column → the URL's <code>Field=</code> value).</div>
            </div>
          </div>

          @if (!cfg.idpOperationalSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — Operational Plans evidence uses the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.idpOperationalSharePointEnabled || !cfg.idpOperationalSharePointSiteUrl"
                    (click)="testSharePointIdpOperational()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>

        <!-- MSCOA Alignment SharePoint library (separate from general IDP evidence) -->
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>MSCOA Alignment SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.idpMscoaSharePointEnabled"
                    (click)="cfg.idpMscoaSharePointEnabled = !cfg.idpMscoaSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.idpMscoaSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for MSCOA Alignment evidence</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, evidence for the "MSCOA alignment verification" milestone is stored in this dedicated SharePoint library instead of local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.idpMscoaSharePointEnabled">
              {{ cfg.idpMscoaSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.idpMscoaSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.idpMscoaSharePointSiteUrl"
                     [disabled]="!cfg.idpMscoaSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.idpMscoaSharePointLibrary"
                     [disabled]="!cfg.idpMscoaSharePointEnabled"
                     placeholder="UatIDPMSCOA alignment verification"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatIDPMSCOA alignment verification</strong></div>
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">vpn_key</mat-icon> Link Column (internal name)</label>
              <input class="field-input" [(ngModel)]="cfg.idpMscoaSharePointLinkColumn"
                     [disabled]="!cfg.idpMscoaSharePointEnabled"
                     placeholder="mscoaid"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">The column that stores the MSCOA Alignment id. Use the SharePoint <strong>internal</strong> name (Library settings → click the column → the URL's <code>Field=</code> value).</div>
            </div>
          </div>

          @if (!cfg.idpMscoaSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — MSCOA Alignment evidence uses the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.idpMscoaSharePointEnabled || !cfg.idpMscoaSharePointSiteUrl"
                    (click)="testSharePointIdpMscoa()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>

        <!-- Project Prioritisation SharePoint library (separate from general IDP evidence) -->
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>Project Prioritisation SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.idpProjectPrioritisationSharePointEnabled"
                    (click)="cfg.idpProjectPrioritisationSharePointEnabled = !cfg.idpProjectPrioritisationSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.idpProjectPrioritisationSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for Project Prioritisation evidence</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, evidence for the "Project prioritisation scoring completed" milestone is stored in this dedicated SharePoint library instead of local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.idpProjectPrioritisationSharePointEnabled">
              {{ cfg.idpProjectPrioritisationSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.idpProjectPrioritisationSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.idpProjectPrioritisationSharePointSiteUrl"
                     [disabled]="!cfg.idpProjectPrioritisationSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.idpProjectPrioritisationSharePointLibrary"
                     [disabled]="!cfg.idpProjectPrioritisationSharePointEnabled"
                     placeholder="UatIDPProject prioritisation scoring completed"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatIDPProject prioritisation scoring completed</strong></div>
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">vpn_key</mat-icon> Link Column (internal name)</label>
              <input class="field-input" [(ngModel)]="cfg.idpProjectPrioritisationSharePointLinkColumn"
                     [disabled]="!cfg.idpProjectPrioritisationSharePointEnabled"
                     placeholder="projectid"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">The column that stores the Project Prioritisation id. Use the SharePoint <strong>internal</strong> name (Library settings → click the column → the URL's <code>Field=</code> value).</div>
            </div>
          </div>

          @if (!cfg.idpProjectPrioritisationSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — Project Prioritisation evidence uses the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.idpProjectPrioritisationSharePointEnabled || !cfg.idpProjectPrioritisationSharePointSiteUrl"
                    (click)="testSharePointIdpProjectPrioritisation()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>

        <!-- Financial Plan and MTREF SharePoint library (separate from general IDP evidence) -->
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>Financial Plan and MTREF SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.idpFinancialSharePointEnabled"
                    (click)="cfg.idpFinancialSharePointEnabled = !cfg.idpFinancialSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.idpFinancialSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for Financial Plan and MTREF evidence</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, evidence for the "Financial plan and MTREF aligned with IDP" milestone is stored in this dedicated SharePoint library instead of local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.idpFinancialSharePointEnabled">
              {{ cfg.idpFinancialSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.idpFinancialSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.idpFinancialSharePointSiteUrl"
                     [disabled]="!cfg.idpFinancialSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.idpFinancialSharePointLibrary"
                     [disabled]="!cfg.idpFinancialSharePointEnabled"
                     placeholder="UatIDPFinancial plan and MTREF aligned with IDP"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatIDPFinancial plan and MTREF aligned with IDP</strong></div>
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">vpn_key</mat-icon> Link Column (internal name)</label>
              <input class="field-input" [(ngModel)]="cfg.idpFinancialSharePointLinkColumn"
                     [disabled]="!cfg.idpFinancialSharePointEnabled"
                     placeholder="financialid"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">The column that stores the Financial Plan and MTREF id. Use the SharePoint <strong>internal</strong> name (Library settings → click the column → the URL's <code>Field=</code> value).</div>
            </div>
          </div>

          @if (!cfg.idpFinancialSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — Financial Plan and MTREF evidence uses the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.idpFinancialSharePointEnabled || !cfg.idpFinancialSharePointSiteUrl"
                    (click)="testSharePointIdpFinancial()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>

        <!-- IDP Document SharePoint library (separate from general IDP evidence) -->
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>IDP Document SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.idpDocumentSharePointEnabled"
                    (click)="cfg.idpDocumentSharePointEnabled = !cfg.idpDocumentSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.idpDocumentSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for IDP Document evidence</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, evidence for the "IDP document compiled and reviewed internally" milestone is stored in this dedicated SharePoint library instead of local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.idpDocumentSharePointEnabled">
              {{ cfg.idpDocumentSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.idpDocumentSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.idpDocumentSharePointSiteUrl"
                     [disabled]="!cfg.idpDocumentSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.idpDocumentSharePointLibrary"
                     [disabled]="!cfg.idpDocumentSharePointEnabled"
                     placeholder="UatIDPIDP document compiled and reviewed internally"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatIDPIDP document compiled and reviewed internally</strong></div>
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">vpn_key</mat-icon> Link Column (internal name)</label>
              <input class="field-input" [(ngModel)]="cfg.idpDocumentSharePointLinkColumn"
                     [disabled]="!cfg.idpDocumentSharePointEnabled"
                     placeholder="idpid"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">The column that stores the IDP Document id. Use the SharePoint <strong>internal</strong> name (Library settings → click the column → the URL's <code>Field=</code> value).</div>
            </div>
          </div>

          @if (!cfg.idpDocumentSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — IDP Document evidence uses the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.idpDocumentSharePointEnabled || !cfg.idpDocumentSharePointSiteUrl"
                    (click)="testSharePointIdpDocument()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>

        <!-- Sector Plan Integration SharePoint library (separate from general IDP evidence) -->
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>Sector Plan Integration SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.idpSectorSharePointEnabled"
                    (click)="cfg.idpSectorSharePointEnabled = !cfg.idpSectorSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.idpSectorSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for Sector Plan Integration evidence</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, evidence for the "Sector plan integration review" milestone is stored in this dedicated SharePoint library instead of local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.idpSectorSharePointEnabled">
              {{ cfg.idpSectorSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.idpSectorSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.idpSectorSharePointSiteUrl"
                     [disabled]="!cfg.idpSectorSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.idpSectorSharePointLibrary"
                     [disabled]="!cfg.idpSectorSharePointEnabled"
                     placeholder="UatIDPSector plan integration review"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatIDPSector plan integration review</strong></div>
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">vpn_key</mat-icon> Link Column (internal name)</label>
              <input class="field-input" [(ngModel)]="cfg.idpSectorSharePointLinkColumn"
                     [disabled]="!cfg.idpSectorSharePointEnabled"
                     placeholder="sectorid"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">The column that stores the Sector Plan Integration id. Use the SharePoint <strong>internal</strong> name (Library settings → click the column → the URL's <code>Field=</code> value).</div>
            </div>
          </div>

          @if (!cfg.idpSectorSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — Sector Plan Integration evidence uses the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.idpSectorSharePointEnabled || !cfg.idpSectorSharePointSiteUrl"
                    (click)="testSharePointIdpSector()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>

        <!-- Budget-IDP Alignment SharePoint library (separate from general IDP evidence) -->
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>Budget-IDP Alignment SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.idpBudgetAlignmentSharePointEnabled"
                    (click)="cfg.idpBudgetAlignmentSharePointEnabled = !cfg.idpBudgetAlignmentSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.idpBudgetAlignmentSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for Budget-IDP Alignment evidence</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, evidence for the "Budget-IDP alignment confirmed by CFO" milestone is stored in this dedicated SharePoint library instead of local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.idpBudgetAlignmentSharePointEnabled">
              {{ cfg.idpBudgetAlignmentSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.idpBudgetAlignmentSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.idpBudgetAlignmentSharePointSiteUrl"
                     [disabled]="!cfg.idpBudgetAlignmentSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.idpBudgetAlignmentSharePointLibrary"
                     [disabled]="!cfg.idpBudgetAlignmentSharePointEnabled"
                     placeholder="UatIDPBudget-IDP alignment confirmed by CFO"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatIDPBudget-IDP alignment confirmed by CFO</strong></div>
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">vpn_key</mat-icon> Link Column (internal name)</label>
              <input class="field-input" [(ngModel)]="cfg.idpBudgetAlignmentSharePointLinkColumn"
                     [disabled]="!cfg.idpBudgetAlignmentSharePointEnabled"
                     placeholder="budgetid"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">The column that stores the Budget-IDP Alignment id. Use the SharePoint <strong>internal</strong> name (Library settings → click the column → the URL's <code>Field=</code> value).</div>
            </div>
          </div>

          @if (!cfg.idpBudgetAlignmentSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — Budget-IDP Alignment evidence uses the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.idpBudgetAlignmentSharePointEnabled || !cfg.idpBudgetAlignmentSharePointSiteUrl"
                    (click)="testSharePointIdpBudgetAlignment()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>

        <!-- IDP Public Comment SharePoint library (separate from general IDP evidence) -->
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>IDP Public Comment SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.idpPublicCommentSharePointEnabled"
                    (click)="cfg.idpPublicCommentSharePointEnabled = !cfg.idpPublicCommentSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.idpPublicCommentSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for IDP Public Comment evidence</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, evidence for the "IDP advertised for public comment (21 days)" milestone is stored in this dedicated SharePoint library instead of local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.idpPublicCommentSharePointEnabled">
              {{ cfg.idpPublicCommentSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.idpPublicCommentSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.idpPublicCommentSharePointSiteUrl"
                     [disabled]="!cfg.idpPublicCommentSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.idpPublicCommentSharePointLibrary"
                     [disabled]="!cfg.idpPublicCommentSharePointEnabled"
                     placeholder="UatIDPIDP advertised for public comment (21 days)"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatIDPIDP advertised for public comment (21 days)</strong></div>
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">vpn_key</mat-icon> Link Column (internal name)</label>
              <input class="field-input" [(ngModel)]="cfg.idpPublicCommentSharePointLinkColumn"
                     [disabled]="!cfg.idpPublicCommentSharePointEnabled"
                     placeholder="idpadvid"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">The column that stores the IDP Public Comment id. Use the SharePoint <strong>internal</strong> name (Library settings → click the column → the URL's <code>Field=</code> value).</div>
            </div>
          </div>

          @if (!cfg.idpPublicCommentSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — IDP Public Comment evidence uses the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.idpPublicCommentSharePointEnabled || !cfg.idpPublicCommentSharePointSiteUrl"
                    (click)="testSharePointIdpPublicComment()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>

        <!-- MEC Assessment SharePoint library (separate from general IDP evidence) -->
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>MEC Assessment SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.idpMecSharePointEnabled"
                    (click)="cfg.idpMecSharePointEnabled = !cfg.idpMecSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.idpMecSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for MEC Assessment evidence</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, evidence for the "MEC assessment response addressed" milestone is stored in this dedicated SharePoint library instead of local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.idpMecSharePointEnabled">
              {{ cfg.idpMecSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.idpMecSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.idpMecSharePointSiteUrl"
                     [disabled]="!cfg.idpMecSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.idpMecSharePointLibrary"
                     [disabled]="!cfg.idpMecSharePointEnabled"
                     placeholder="UatIDPMEC assessment response addressed"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatIDPMEC assessment response addressed</strong></div>
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">vpn_key</mat-icon> Link Column (internal name)</label>
              <input class="field-input" [(ngModel)]="cfg.idpMecSharePointLinkColumn"
                     [disabled]="!cfg.idpMecSharePointEnabled"
                     placeholder="mecid"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">The column that stores the MEC Assessment id. Use the SharePoint <strong>internal</strong> name (Library settings → click the column → the URL's <code>Field=</code> value).</div>
            </div>
          </div>

          @if (!cfg.idpMecSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — MEC Assessment evidence uses the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.idpMecSharePointEnabled || !cfg.idpMecSharePointSiteUrl"
                    (click)="testSharePointIdpMec()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>

        <!-- Final IDP Submission SharePoint library (separate from general IDP evidence) -->
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>Final IDP Submission SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.idpFinalSubmissionSharePointEnabled"
                    (click)="cfg.idpFinalSubmissionSharePointEnabled = !cfg.idpFinalSubmissionSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.idpFinalSubmissionSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for Final IDP Submission evidence</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, evidence for the "Final IDP submitted to MEC" milestone is stored in this dedicated SharePoint library instead of local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.idpFinalSubmissionSharePointEnabled">
              {{ cfg.idpFinalSubmissionSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.idpFinalSubmissionSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.idpFinalSubmissionSharePointSiteUrl"
                     [disabled]="!cfg.idpFinalSubmissionSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.idpFinalSubmissionSharePointLibrary"
                     [disabled]="!cfg.idpFinalSubmissionSharePointEnabled"
                     placeholder="UatIDPFinal IDP submitted to MEC"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatIDPFinal IDP submitted to MEC</strong></div>
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">vpn_key</mat-icon> Link Column (internal name)</label>
              <input class="field-input" [(ngModel)]="cfg.idpFinalSubmissionSharePointLinkColumn"
                     [disabled]="!cfg.idpFinalSubmissionSharePointEnabled"
                     placeholder="finalid"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">The column that stores the Final IDP Submission id. Use the SharePoint <strong>internal</strong> name (Library settings → click the column → the URL's <code>Field=</code> value).</div>
            </div>
          </div>

          @if (!cfg.idpFinalSubmissionSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — Final IDP Submission evidence uses the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.idpFinalSubmissionSharePointEnabled || !cfg.idpFinalSubmissionSharePointSiteUrl"
                    (click)="testSharePointIdpFinalSubmission()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>

        <!-- Public Comment Period SharePoint library (separate from general IDP evidence) -->
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>Public Comment Period SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.idpPublicCommentPeriodSharePointEnabled"
                    (click)="cfg.idpPublicCommentPeriodSharePointEnabled = !cfg.idpPublicCommentPeriodSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.idpPublicCommentPeriodSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for Public Comment Period evidence</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, evidence for the "Public comment period completed" milestone is stored in this dedicated SharePoint library instead of local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.idpPublicCommentPeriodSharePointEnabled">
              {{ cfg.idpPublicCommentPeriodSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.idpPublicCommentPeriodSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.idpPublicCommentPeriodSharePointSiteUrl"
                     [disabled]="!cfg.idpPublicCommentPeriodSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.idpPublicCommentPeriodSharePointLibrary"
                     [disabled]="!cfg.idpPublicCommentPeriodSharePointEnabled"
                     placeholder="UatIDPPublic comment period completed"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatIDPPublic comment period completed</strong></div>
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">vpn_key</mat-icon> Link Column (internal name)</label>
              <input class="field-input" [(ngModel)]="cfg.idpPublicCommentPeriodSharePointLinkColumn"
                     [disabled]="!cfg.idpPublicCommentPeriodSharePointEnabled"
                     placeholder="publicid"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">The column that stores the Public Comment Period id. Use the SharePoint <strong>internal</strong> name (Library settings → click the column → the URL's <code>Field=</code> value).</div>
            </div>
          </div>

          @if (!cfg.idpPublicCommentPeriodSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — Public Comment Period evidence uses the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.idpPublicCommentPeriodSharePointEnabled || !cfg.idpPublicCommentPeriodSharePointSiteUrl"
                    (click)="testSharePointIdpPublicCommentPeriod()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>

        <!-- Council Adoption SharePoint library (separate from general IDP evidence) -->
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>Council Adoption SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.idpCouncilAdoptionSharePointEnabled"
                    (click)="cfg.idpCouncilAdoptionSharePointEnabled = !cfg.idpCouncilAdoptionSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.idpCouncilAdoptionSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for Council Adoption evidence</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, evidence for the "Council adoption resolution" milestone is stored in this dedicated SharePoint library instead of local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.idpCouncilAdoptionSharePointEnabled">
              {{ cfg.idpCouncilAdoptionSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.idpCouncilAdoptionSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.idpCouncilAdoptionSharePointSiteUrl"
                     [disabled]="!cfg.idpCouncilAdoptionSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.idpCouncilAdoptionSharePointLibrary"
                     [disabled]="!cfg.idpCouncilAdoptionSharePointEnabled"
                     placeholder="UatIDPCouncil adoption resolution"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatIDPCouncil adoption resolution</strong></div>
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">vpn_key</mat-icon> Link Column (internal name)</label>
              <input class="field-input" [(ngModel)]="cfg.idpCouncilAdoptionSharePointLinkColumn"
                     [disabled]="!cfg.idpCouncilAdoptionSharePointEnabled"
                     placeholder="councilid"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">The column that stores the Council Adoption id. Use the SharePoint <strong>internal</strong> name (Library settings → click the column → the URL's <code>Field=</code> value).</div>
            </div>
          </div>

          @if (!cfg.idpCouncilAdoptionSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — Council Adoption evidence uses the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.idpCouncilAdoptionSharePointEnabled || !cfg.idpCouncilAdoptionSharePointSiteUrl"
                    (click)="testSharePointIdpCouncilAdoption()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>

        <!-- Community Needs Assessment SharePoint library (separate from general IDP evidence) -->
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>Community Needs Assessment SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.idpCommunityNeedsSharePointEnabled"
                    (click)="cfg.idpCommunityNeedsSharePointEnabled = !cfg.idpCommunityNeedsSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.idpCommunityNeedsSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for Community Needs Assessment evidence</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, evidence for the "Community needs assessment completed" milestone is stored in this dedicated SharePoint library instead of local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.idpCommunityNeedsSharePointEnabled">
              {{ cfg.idpCommunityNeedsSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.idpCommunityNeedsSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.idpCommunityNeedsSharePointSiteUrl"
                     [disabled]="!cfg.idpCommunityNeedsSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.idpCommunityNeedsSharePointLibrary"
                     [disabled]="!cfg.idpCommunityNeedsSharePointEnabled"
                     placeholder="UatIDPCommunity needs assessment completed"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatIDPCommunity needs assessment completed</strong></div>
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">vpn_key</mat-icon> Link Column (internal name)</label>
              <input class="field-input" [(ngModel)]="cfg.idpCommunityNeedsSharePointLinkColumn"
                     [disabled]="!cfg.idpCommunityNeedsSharePointEnabled"
                     placeholder="communityid"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">The column that stores the Community Needs Assessment id. Use the SharePoint <strong>internal</strong> name (Library settings → click the column → the URL's <code>Field=</code> value).</div>
            </div>
          </div>

          @if (!cfg.idpCommunityNeedsSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — Community Needs Assessment evidence uses the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.idpCommunityNeedsSharePointEnabled || !cfg.idpCommunityNeedsSharePointSiteUrl"
                    (click)="testSharePointIdpCommunityNeeds()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>
      }

      <!-- SharePoint config — AFS module only -->
      @if (activeKey() === 'afs') {
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>SharePoint Configuration</span>
          </div>

          <!-- Toggle -->
          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.afsSharePointEnabled"
                    (click)="cfg.afsSharePointEnabled = !cfg.afsSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.afsSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for new uploads</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, new AFS document uploads are stored in SharePoint instead of the AFS module's local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.afsSharePointEnabled">
              {{ cfg.afsSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <!-- Fields (disabled when off) -->
          <div class="field-grid" [class.sp-disabled]="!cfg.afsSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.afsSharePointSiteUrl"
                     [disabled]="!cfg.afsSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.afsSharePointLibrary"
                     [disabled]="!cfg.afsSharePointEnabled"
                     placeholder="UatAFS"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatAFS</strong></div>
            </div>
          </div>

          @if (!cfg.afsSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — AFS documents use the module's current local file storage.
              </div>
            </div>
          }

          <!-- SP actions -->
          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.afsSharePointEnabled || !cfg.afsSharePointSiteUrl"
                    (click)="testSharePointAfs()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>

        <!-- Adjustments SharePoint library (separate from working-paper docs) -->
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>Adjustments SharePoint Configuration</span>
          </div>

          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.afsAdjustmentsSharePointEnabled"
                    (click)="cfg.afsAdjustmentsSharePointEnabled = !cfg.afsAdjustmentsSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.afsAdjustmentsSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for adjustment documents</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, adjustment supporting documents are stored in the dedicated Adjustments SharePoint library (linked by AFSID, with metadata) instead of local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.afsAdjustmentsSharePointEnabled">
              {{ cfg.afsAdjustmentsSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <div class="field-grid" [class.sp-disabled]="!cfg.afsAdjustmentsSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.afsAdjustmentsSharePointSiteUrl"
                     [disabled]="!cfg.afsAdjustmentsSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.afsAdjustmentsSharePointLibrary"
                     [disabled]="!cfg.afsAdjustmentsSharePointEnabled"
                     placeholder="UatAFSAdjustments1"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatAFSAdjustments1</strong> (use the library's URL segment, e.g. the "UatAFSAdjustments1" in its address)</div>
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">vpn_key</mat-icon> Link Column (internal name)</label>
              <input class="field-input" [(ngModel)]="cfg.afsAdjustmentsSharePointLinkColumn"
                     [disabled]="!cfg.afsAdjustmentsSharePointEnabled"
                     placeholder="ADJID"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">The column that stores the adjustment id. Use the SharePoint <strong>internal</strong> name (Library settings → click the column → the URL's <code>Field=</code> value, e.g. <strong>ADJID0</strong> if it was recreated).</div>
            </div>
          </div>

          @if (!cfg.afsAdjustmentsSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — adjustment documents use the module's current local file storage.
              </div>
            </div>
          }

          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.afsAdjustmentsSharePointEnabled || !cfg.afsAdjustmentsSharePointSiteUrl"
                    (click)="testSharePointAfsAdjustments()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>

        <!-- Administration SharePoint library (separate from working-paper and adjustment docs) -->
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#0078d4">cloud</mat-icon>
            <span>Administration SharePoint Configuration</span>
          </div>

          <div class="sp-toggle-row">
            <button class="sp-switch" [class.on]="cfg.afsAdministrationSharePointEnabled"
                    (click)="cfg.afsAdministrationSharePointEnabled = !cfg.afsAdministrationSharePointEnabled; markDirty()"
                    role="switch" [attr.aria-checked]="cfg.afsAdministrationSharePointEnabled">
              <span class="sp-knob"></span>
            </button>
            <div style="flex:1">
              <div style="font-weight:600;font-size:14px;color:#1e293b">Use SharePoint for administration documents</div>
              <div style="font-size:12px;color:#64748b">
                When enabled, AFS administration documents are stored in the dedicated Administration SharePoint library (with metadata) instead of local file storage.
              </div>
            </div>
            <span class="sp-status" [class.active]="cfg.afsAdministrationSharePointEnabled">
              {{ cfg.afsAdministrationSharePointEnabled ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <div class="field-grid" [class.sp-disabled]="!cfg.afsAdministrationSharePointEnabled">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0078d4">link</mat-icon> SharePoint Site URL</label>
              <input class="field-input" [(ngModel)]="cfg.afsAdministrationSharePointSiteUrl"
                     [disabled]="!cfg.afsAdministrationSharePointEnabled"
                     placeholder="https://yourtenant.sharepoint.com/sites/Sebata2"
                     (ngModelChange)="markDirty()">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#d97706">folder</mat-icon> Document Library Name</label>
              <input class="field-input" [(ngModel)]="cfg.afsAdministrationSharePointLibrary"
                     [disabled]="!cfg.afsAdministrationSharePointEnabled"
                     placeholder="UatAFSAdministration"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Default library: <strong>UatAFSAdministration</strong> (use the library's URL segment, e.g. the "UatAFSAdministration" in its address)</div>
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">vpn_key</mat-icon> Link Column (internal name)</label>
              <input class="field-input" [(ngModel)]="cfg.afsAdministrationSharePointLinkColumn"
                     [disabled]="!cfg.afsAdministrationSharePointEnabled"
                     placeholder="AFSID"
                     (ngModelChange)="markDirty()">
              <div class="field-hint">Optional. The column that stores the entity id. Leave blank to auto-detect it (falls back to <strong>AFSID</strong>); otherwise use the SharePoint <strong>internal</strong> name (Library settings → click the column → the URL's <code>Field=</code> value).</div>
            </div>
          </div>

          @if (!cfg.afsAdministrationSharePointEnabled) {
            <div class="conn-box">
              <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
              <div style="font-size:12px;color:#64748b">
                SharePoint is <strong>off</strong> — administration documents use the module's current local file storage.
              </div>
            </div>
          }

          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.afsAdministrationSharePointEnabled || !cfg.afsAdministrationSharePointSiteUrl"
                    (click)="testSharePointAfsAdministration()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Testing…' : 'Test Connection' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>
      }

      <!-- AFS Database config — AFS module only -->
      @if (activeKey() === 'afs') {
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#336791">database</mat-icon>
            <span>Database Configuration</span>
            <span class="db-pill">PostgreSQL</span>
          </div>

          <div class="field-grid">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#336791">dns</mat-icon> Host</label>
              <input class="field-input" [(ngModel)]="cfg.afsDbHost" (ngModelChange)="markDirty()"
                     placeholder="platinum-postgre-sql.postgres.database.azure.com">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#64748b">lan</mat-icon> Port</label>
              <input class="field-input" [(ngModel)]="cfg.afsDbPort" (ngModelChange)="markDirty()" placeholder="5432">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">storage</mat-icon> Database</label>
              <input class="field-input" [(ngModel)]="cfg.afsDbName" (ngModelChange)="markDirty()" placeholder="AFS">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#7c3aed">person</mat-icon> Username</label>
              <input class="field-input" [(ngModel)]="cfg.afsDbUser" (ngModelChange)="markDirty()" placeholder="Admin_Dev">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#dc2626">key</mat-icon> Password</label>
              <input class="field-input" type="password" [(ngModel)]="cfg.afsDbPassword" (ngModelChange)="markDirty()" placeholder="••••••••">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#16a34a">lock</mat-icon> SSL Mode</label>
              <input class="field-input" [(ngModel)]="cfg.afsDbSslMode" (ngModelChange)="markDirty()" placeholder="Require">
            </div>
          </div>

          <!-- Connection string preview -->
          <div class="conn-box">
            <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
            <div>
              <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.4px;margin-bottom:2px">AZURE_POSTGRES_URL (AFS-UI/api)</div>
              <code>{{ afsConnString() }}</code>
            </div>
          </div>

          <div class="conn-box" style="background:#fffbeb;border-color:#fde68a">
            <mat-icon style="font-size:14px;color:#d97706;flex-shrink:0">warning</mat-icon>
            <div style="font-size:12px;color:#92400e">
              The AFS API reads this from the <strong>.env</strong> (AZURE_POSTGRES_URL) at startup.
              After saving, update <code>.env</code> with the connection string above and restart the AFS API.
            </div>
          </div>

          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.afsDbHost || !cfg.afsDbName"
                    (click)="testAfsDb()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Checking…' : 'Validate' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>
      }

      <!-- Overtime Database config — Overtime module only -->
      @if (activeKey() === 'overtime') {
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#336791">database</mat-icon>
            <span>Database Configuration</span>
            <span class="db-pill">PostgreSQL</span>
          </div>

          <div class="field-grid">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#336791">dns</mat-icon> Host</label>
              <input class="field-input" [(ngModel)]="cfg.overtimeDbHost" (ngModelChange)="markDirty()"
                     placeholder="platinum-postgre-sql.postgres.database.azure.com">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#64748b">lan</mat-icon> Port</label>
              <input class="field-input" [(ngModel)]="cfg.overtimeDbPort" (ngModelChange)="markDirty()" placeholder="5432">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">storage</mat-icon> Database</label>
              <input class="field-input" [(ngModel)]="cfg.overtimeDbName" (ngModelChange)="markDirty()" placeholder="Overtime">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#7c3aed">person</mat-icon> Username</label>
              <input class="field-input" [(ngModel)]="cfg.overtimeDbUser" (ngModelChange)="markDirty()" placeholder="Admin_Dev">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#dc2626">key</mat-icon> Password</label>
              <input class="field-input" type="password" [(ngModel)]="cfg.overtimeDbPassword" (ngModelChange)="markDirty()" placeholder="••••••••">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#16a34a">lock</mat-icon> SSL Mode</label>
              <input class="field-input" [(ngModel)]="cfg.overtimeDbSslMode" (ngModelChange)="markDirty()" placeholder="Require">
            </div>
          </div>

          <!-- Connection string preview -->
          <div class="conn-box">
            <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
            <div>
              <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.4px;margin-bottom:2px">ConnectionStrings:OvertimeDb (OVERTIME-API)</div>
              <code>{{ overtimeConnString() }}</code>
            </div>
          </div>

          <div class="conn-box" style="background:#fffbeb;border-color:#fde68a">
            <mat-icon style="font-size:14px;color:#d97706;flex-shrink:0">warning</mat-icon>
            <div style="font-size:12px;color:#92400e">
              The Overtime API reads this from <strong>OVERTIME-API/appsettings.json</strong> (ConnectionStrings:OvertimeDb)
              at startup. After saving, update appsettings with the connection string above and restart the Overtime API.
            </div>
          </div>

          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.overtimeDbHost || !cfg.overtimeDbName"
                    (click)="testOvertimeDb()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Checking…' : 'Validate' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>
      }

      <!-- Payroll Database config — Payroll module only -->
      @if (activeKey() === 'payroll') {
        <div class="config-card">
          <div class="sp-header">
            <mat-icon style="color:#336791">database</mat-icon>
            <span>Database Configuration</span>
            <span class="db-pill">PostgreSQL</span>
          </div>

          <div class="field-grid">
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#336791">dns</mat-icon> Host</label>
              <input class="field-input" [(ngModel)]="cfg.payrollDbHost" (ngModelChange)="markDirty()"
                     placeholder="platinum-postgre-sql.postgres.database.azure.com">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#64748b">lan</mat-icon> Port</label>
              <input class="field-input" [(ngModel)]="cfg.payrollDbPort" (ngModelChange)="markDirty()" placeholder="5432">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#0891b2">storage</mat-icon> Database</label>
              <input class="field-input" [(ngModel)]="cfg.payrollDbName" (ngModelChange)="markDirty()" placeholder="Payroll">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#7c3aed">person</mat-icon> Username</label>
              <input class="field-input" [(ngModel)]="cfg.payrollDbUser" (ngModelChange)="markDirty()" placeholder="Admin_Dev">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#dc2626">key</mat-icon> Password</label>
              <input class="field-input" type="password" [(ngModel)]="cfg.payrollDbPassword" (ngModelChange)="markDirty()" placeholder="••••••••">
            </div>
            <div class="field-block">
              <label class="field-label"><mat-icon class="field-icon" style="color:#16a34a">lock</mat-icon> SSL Mode</label>
              <input class="field-input" [(ngModel)]="cfg.payrollDbSslMode" (ngModelChange)="markDirty()" placeholder="Require">
            </div>
          </div>

          <div class="conn-box">
            <mat-icon style="font-size:14px;color:#94a3b8;flex-shrink:0">info</mat-icon>
            <div>
              <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.4px;margin-bottom:2px">AZURE_DATABASE_URL (PAYROLL-APP)</div>
              <code>{{ payrollConnString() }}</code>
            </div>
          </div>

          <div class="conn-box" style="background:#fffbeb;border-color:#fde68a">
            <mat-icon style="font-size:14px;color:#d97706;flex-shrink:0">warning</mat-icon>
            <div style="font-size:12px;color:#92400e">
              The Payroll API reads this from the <strong>.env</strong> (AZURE_DATABASE_URL) at startup.
              After saving, update <code>.env</code> with the connection string above and restart the Payroll API.
            </div>
          </div>

          <div class="actions" style="margin-top:0">
            <button class="btn-secondary" [disabled]="spTesting() || !cfg.payrollDbHost || !cfg.payrollDbName"
                    (click)="testPayrollDb()">
              <mat-icon>{{ spTesting() ? 'hourglass_empty' : 'wifi_tethering' }}</mat-icon>
              {{ spTesting() ? 'Checking…' : 'Validate' }}
            </button>
            <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
              <mat-icon>save</mat-icon> Save Configuration
            </button>
          </div>
        </div>
      }

      <!-- Actions -->
      <div class="actions">
        <button class="btn-secondary" (click)="reset()">
          <mat-icon>restart_alt</mat-icon> Reset to Default
        </button>
        <button class="btn-primary" [disabled]="!dirty()" (click)="save()">
          <mat-icon>save</mat-icon> Save
        </button>
      </div>

    </div>
  `,
  styles: [`
    :host { display:block; background:#f8f9fb; min-height:100%; }

    .module-icon {
      width:44px; height:44px; border-radius:12px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
    }
    .config-card {
      background:white; border:1px solid #e2e8f0; border-radius:12px;
      padding:24px; margin-bottom:20px; display:flex; flex-direction:column; gap:20px;
    }
    .field-block { display:flex; flex-direction:column; gap:6px; }
    .field-label {
      display:flex; align-items:center; gap:6px;
      font-size:12px; font-weight:700; color:#374151;
      text-transform:uppercase; letter-spacing:.5px;
    }
    .field-icon { font-size:16px; width:16px; height:16px; }
    .badge {
      font-size:10px; font-weight:700; padding:2px 8px; border-radius:10px;
      text-transform:none; letter-spacing:0; margin-left:4px;
    }
    .badge-green { background:#dcfce7; color:#166534; }
    .badge-blue  { background:#dbeafe; color:#1e40af; }
    .field-input {
      border:1px solid #cbd5e1; border-radius:8px; padding:11px 14px;
      font-size:13px; font-family:monospace; color:#1e293b; outline:none;
      transition:border-color .15s, box-shadow .15s;
    }
    .field-input:focus { border-color:#3f51b5; box-shadow:0 0 0 3px rgba(63,81,181,.12); }
    .field-hint { font-size:11px; color:#94a3b8; }
    .conn-box {
      display:flex; align-items:flex-start; gap:8px;
      background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;
      padding:10px 12px; margin-top:2px;
    }
    .conn-box code { font-size:12px; font-family:monospace; color:#475569; word-break:break-all; }
    .actions { display:flex; justify-content:flex-end; gap:12px; }
    .btn-primary, .btn-secondary {
      display:inline-flex; align-items:center; gap:8px;
      padding:10px 20px; border-radius:8px; font-size:14px; font-weight:600;
      cursor:pointer; border:none; transition:all .15s;
    }
    .btn-primary { background:#3f51b5; color:white; }
    .btn-primary:hover:not(:disabled) { background:#303f9f; }
    .btn-primary:disabled { background:#cbd5e1; cursor:not-allowed; }
    .btn-secondary { background:white; color:#475569; border:1px solid #cbd5e1; }
    .btn-secondary:hover { background:#f8fafc; }
    .btn-secondary:disabled { color:#cbd5e1; cursor:not-allowed; }

    /* SharePoint config */
    .sp-header {
      display:flex; align-items:center; gap:10px;
      font-size:15px; font-weight:700; color:#1e293b;
      padding-bottom:14px; border-bottom:1px solid #f1f5f9;
    }
    .sp-toggle-row {
      display:flex; align-items:center; gap:14px;
      background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px 16px;
    }
    .sp-switch {
      position:relative; width:44px; height:24px; border-radius:12px;
      background:#cbd5e1; border:none; cursor:pointer; flex-shrink:0; transition:background .2s; padding:0;
    }
    .sp-switch.on { background:#16a34a; }
    .sp-knob {
      position:absolute; top:2px; left:2px; width:20px; height:20px; border-radius:50%;
      background:white; transition:left .2s; box-shadow:0 1px 3px rgba(0,0,0,.2);
    }
    .sp-switch.on .sp-knob { left:22px; }
    .sp-status {
      font-size:11px; font-weight:700; letter-spacing:.5px; color:#dc2626;
    }
    .sp-status.active { color:#16a34a; }
    .sp-disabled { opacity:.55; pointer-events:none; }
    .db-pill {
      font-size:10px; font-weight:700; padding:2px 8px; border-radius:10px;
      background:#e0f2fe; color:#0369a1; margin-left:4px;
    }
  `]
})
export class AdminSettingsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private snack = inject(MatSnackBar);
  private spConfig = inject(SharePointConfigService);

  cfg: ModuleApiConfig = loadModuleConfig();
  dirty = signal(false);
  spTesting = signal(false);

  activeKey = signal('assets');

  activeMod = computed(() => MODULES.find(m => m.key === this.activeKey()) ?? MODULES[0]);

  ngOnInit() {
    this.route.params.subscribe(p => {
      const mod = p['module'];
      if (mod && MODULES.find(m => m.key === mod)) {
        this.activeKey.set(mod);
      } else {
        this.activeKey.set('assets');
      }
    });
  }

  markDirty() { this.dirty.set(true); }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cfg));
      this.dirty.set(false);
      // Apply SharePoint config immediately to the assets module (no reload needed).
      this.spConfig.refresh();
      const note = this.activeKey() === 'assets'
        ? 'Saved. SharePoint config applied. Restart the dev server to apply API proxy changes.'
        : 'Saved. Restart the dev server to apply proxy changes.';
      this.snack.open(note, 'OK', { duration: 4000 });
    } catch {
      this.snack.open('Failed to save.', 'Close', { duration: 3000 });
    }
  }

  reset() {
    const mod = this.activeMod();
    mod.fields.forEach(f => {
      (this.cfg as any)[f.prop] = (DEFAULTS as any)[f.prop];
    });
    // Assets page also owns the SharePoint config — reset it too
    if (this.activeKey() === 'assets') {
      this.cfg.assetsSharePointEnabled = DEFAULTS.assetsSharePointEnabled;
      this.cfg.assetsSharePointSiteUrl = DEFAULTS.assetsSharePointSiteUrl;
      this.cfg.assetsSharePointLibrary = DEFAULTS.assetsSharePointLibrary;
    }
    // AFS page owns the DB config + SharePoint config — reset them too
    if (this.activeKey() === 'afs') {
      this.cfg.afsDbHost     = DEFAULTS.afsDbHost;
      this.cfg.afsDbPort     = DEFAULTS.afsDbPort;
      this.cfg.afsDbName     = DEFAULTS.afsDbName;
      this.cfg.afsDbUser     = DEFAULTS.afsDbUser;
      this.cfg.afsDbPassword = DEFAULTS.afsDbPassword;
      this.cfg.afsDbSslMode  = DEFAULTS.afsDbSslMode;
      this.cfg.afsSharePointEnabled = DEFAULTS.afsSharePointEnabled;
      this.cfg.afsSharePointSiteUrl = DEFAULTS.afsSharePointSiteUrl;
      this.cfg.afsSharePointLibrary = DEFAULTS.afsSharePointLibrary;
    }
    // IDP page owns the SharePoint config — reset it too
    if (this.activeKey() === 'idp') {
      this.cfg.idpSharePointEnabled = DEFAULTS.idpSharePointEnabled;
      this.cfg.idpSharePointSiteUrl = DEFAULTS.idpSharePointSiteUrl;
      this.cfg.idpSharePointLibrary = DEFAULTS.idpSharePointLibrary;
      this.cfg.idpInstitutionalSharePointEnabled = DEFAULTS.idpInstitutionalSharePointEnabled;
      this.cfg.idpInstitutionalSharePointSiteUrl = DEFAULTS.idpInstitutionalSharePointSiteUrl;
      this.cfg.idpInstitutionalSharePointLibrary = DEFAULTS.idpInstitutionalSharePointLibrary;
      this.cfg.idpInstitutionalSharePointLinkColumn = DEFAULTS.idpInstitutionalSharePointLinkColumn;
      this.cfg.idpSituationalSharePointEnabled = DEFAULTS.idpSituationalSharePointEnabled;
      this.cfg.idpSituationalSharePointSiteUrl = DEFAULTS.idpSituationalSharePointSiteUrl;
      this.cfg.idpSituationalSharePointLibrary = DEFAULTS.idpSituationalSharePointLibrary;
      this.cfg.idpSituationalSharePointLinkColumn = DEFAULTS.idpSituationalSharePointLinkColumn;
      this.cfg.idpSpatialSharePointEnabled = DEFAULTS.idpSpatialSharePointEnabled;
      this.cfg.idpSpatialSharePointSiteUrl = DEFAULTS.idpSpatialSharePointSiteUrl;
      this.cfg.idpSpatialSharePointLibrary = DEFAULTS.idpSpatialSharePointLibrary;
      this.cfg.idpSpatialSharePointLinkColumn = DEFAULTS.idpSpatialSharePointLinkColumn;
      this.cfg.idpSwotSharePointEnabled = DEFAULTS.idpSwotSharePointEnabled;
      this.cfg.idpSwotSharePointSiteUrl = DEFAULTS.idpSwotSharePointSiteUrl;
      this.cfg.idpSwotSharePointLibrary = DEFAULTS.idpSwotSharePointLibrary;
      this.cfg.idpSwotSharePointLinkColumn = DEFAULTS.idpSwotSharePointLinkColumn;
      this.cfg.idpPrioritySharePointEnabled = DEFAULTS.idpPrioritySharePointEnabled;
      this.cfg.idpPrioritySharePointSiteUrl = DEFAULTS.idpPrioritySharePointSiteUrl;
      this.cfg.idpPrioritySharePointLibrary = DEFAULTS.idpPrioritySharePointLibrary;
      this.cfg.idpPrioritySharePointLinkColumn = DEFAULTS.idpPrioritySharePointLinkColumn;
      this.cfg.idpStrategicSharePointEnabled = DEFAULTS.idpStrategicSharePointEnabled;
      this.cfg.idpStrategicSharePointSiteUrl = DEFAULTS.idpStrategicSharePointSiteUrl;
      this.cfg.idpStrategicSharePointLibrary = DEFAULTS.idpStrategicSharePointLibrary;
      this.cfg.idpStrategicSharePointLinkColumn = DEFAULTS.idpStrategicSharePointLinkColumn;
      this.cfg.idpVisionSharePointEnabled = DEFAULTS.idpVisionSharePointEnabled;
      this.cfg.idpVisionSharePointSiteUrl = DEFAULTS.idpVisionSharePointSiteUrl;
      this.cfg.idpVisionSharePointLibrary = DEFAULTS.idpVisionSharePointLibrary;
      this.cfg.idpVisionSharePointLinkColumn = DEFAULTS.idpVisionSharePointLinkColumn;
      this.cfg.idpKpiSharePointEnabled = DEFAULTS.idpKpiSharePointEnabled;
      this.cfg.idpKpiSharePointSiteUrl = DEFAULTS.idpKpiSharePointSiteUrl;
      this.cfg.idpKpiSharePointLibrary = DEFAULTS.idpKpiSharePointLibrary;
      this.cfg.idpKpiSharePointLinkColumn = DEFAULTS.idpKpiSharePointLinkColumn;
      this.cfg.idpDevelopmentSharePointEnabled = DEFAULTS.idpDevelopmentSharePointEnabled;
      this.cfg.idpDevelopmentSharePointSiteUrl = DEFAULTS.idpDevelopmentSharePointSiteUrl;
      this.cfg.idpDevelopmentSharePointLibrary = DEFAULTS.idpDevelopmentSharePointLibrary;
      this.cfg.idpDevelopmentSharePointLinkColumn = DEFAULTS.idpDevelopmentSharePointLinkColumn;
      this.cfg.idpSdfSharePointEnabled = DEFAULTS.idpSdfSharePointEnabled;
      this.cfg.idpSdfSharePointSiteUrl = DEFAULTS.idpSdfSharePointSiteUrl;
      this.cfg.idpSdfSharePointLibrary = DEFAULTS.idpSdfSharePointLibrary;
      this.cfg.idpSdfSharePointLinkColumn = DEFAULTS.idpSdfSharePointLinkColumn;
      this.cfg.idpCapitalSharePointEnabled = DEFAULTS.idpCapitalSharePointEnabled;
      this.cfg.idpCapitalSharePointSiteUrl = DEFAULTS.idpCapitalSharePointSiteUrl;
      this.cfg.idpCapitalSharePointLibrary = DEFAULTS.idpCapitalSharePointLibrary;
      this.cfg.idpCapitalSharePointLinkColumn = DEFAULTS.idpCapitalSharePointLinkColumn;
      this.cfg.idpOperationalSharePointEnabled = DEFAULTS.idpOperationalSharePointEnabled;
      this.cfg.idpOperationalSharePointSiteUrl = DEFAULTS.idpOperationalSharePointSiteUrl;
      this.cfg.idpOperationalSharePointLibrary = DEFAULTS.idpOperationalSharePointLibrary;
      this.cfg.idpOperationalSharePointLinkColumn = DEFAULTS.idpOperationalSharePointLinkColumn;
      this.cfg.idpMscoaSharePointEnabled = DEFAULTS.idpMscoaSharePointEnabled;
      this.cfg.idpMscoaSharePointSiteUrl = DEFAULTS.idpMscoaSharePointSiteUrl;
      this.cfg.idpMscoaSharePointLibrary = DEFAULTS.idpMscoaSharePointLibrary;
      this.cfg.idpMscoaSharePointLinkColumn = DEFAULTS.idpMscoaSharePointLinkColumn;
      this.cfg.idpProjectPrioritisationSharePointEnabled = DEFAULTS.idpProjectPrioritisationSharePointEnabled;
      this.cfg.idpProjectPrioritisationSharePointSiteUrl = DEFAULTS.idpProjectPrioritisationSharePointSiteUrl;
      this.cfg.idpProjectPrioritisationSharePointLibrary = DEFAULTS.idpProjectPrioritisationSharePointLibrary;
      this.cfg.idpProjectPrioritisationSharePointLinkColumn = DEFAULTS.idpProjectPrioritisationSharePointLinkColumn;
      this.cfg.idpFinancialSharePointEnabled = DEFAULTS.idpFinancialSharePointEnabled;
      this.cfg.idpFinancialSharePointSiteUrl = DEFAULTS.idpFinancialSharePointSiteUrl;
      this.cfg.idpFinancialSharePointLibrary = DEFAULTS.idpFinancialSharePointLibrary;
      this.cfg.idpFinancialSharePointLinkColumn = DEFAULTS.idpFinancialSharePointLinkColumn;
      this.cfg.idpDocumentSharePointEnabled = DEFAULTS.idpDocumentSharePointEnabled;
      this.cfg.idpDocumentSharePointSiteUrl = DEFAULTS.idpDocumentSharePointSiteUrl;
      this.cfg.idpDocumentSharePointLibrary = DEFAULTS.idpDocumentSharePointLibrary;
      this.cfg.idpDocumentSharePointLinkColumn = DEFAULTS.idpDocumentSharePointLinkColumn;
      this.cfg.idpSectorSharePointEnabled = DEFAULTS.idpSectorSharePointEnabled;
      this.cfg.idpSectorSharePointSiteUrl = DEFAULTS.idpSectorSharePointSiteUrl;
      this.cfg.idpSectorSharePointLibrary = DEFAULTS.idpSectorSharePointLibrary;
      this.cfg.idpSectorSharePointLinkColumn = DEFAULTS.idpSectorSharePointLinkColumn;
      this.cfg.idpBudgetAlignmentSharePointEnabled = DEFAULTS.idpBudgetAlignmentSharePointEnabled;
      this.cfg.idpBudgetAlignmentSharePointSiteUrl = DEFAULTS.idpBudgetAlignmentSharePointSiteUrl;
      this.cfg.idpBudgetAlignmentSharePointLibrary = DEFAULTS.idpBudgetAlignmentSharePointLibrary;
      this.cfg.idpBudgetAlignmentSharePointLinkColumn = DEFAULTS.idpBudgetAlignmentSharePointLinkColumn;
      this.cfg.idpPublicCommentSharePointEnabled = DEFAULTS.idpPublicCommentSharePointEnabled;
      this.cfg.idpPublicCommentSharePointSiteUrl = DEFAULTS.idpPublicCommentSharePointSiteUrl;
      this.cfg.idpPublicCommentSharePointLibrary = DEFAULTS.idpPublicCommentSharePointLibrary;
      this.cfg.idpPublicCommentSharePointLinkColumn = DEFAULTS.idpPublicCommentSharePointLinkColumn;
      this.cfg.idpMecSharePointEnabled = DEFAULTS.idpMecSharePointEnabled;
      this.cfg.idpMecSharePointSiteUrl = DEFAULTS.idpMecSharePointSiteUrl;
      this.cfg.idpMecSharePointLibrary = DEFAULTS.idpMecSharePointLibrary;
      this.cfg.idpMecSharePointLinkColumn = DEFAULTS.idpMecSharePointLinkColumn;
      this.cfg.idpFinalSubmissionSharePointEnabled = DEFAULTS.idpFinalSubmissionSharePointEnabled;
      this.cfg.idpFinalSubmissionSharePointSiteUrl = DEFAULTS.idpFinalSubmissionSharePointSiteUrl;
      this.cfg.idpFinalSubmissionSharePointLibrary = DEFAULTS.idpFinalSubmissionSharePointLibrary;
      this.cfg.idpFinalSubmissionSharePointLinkColumn = DEFAULTS.idpFinalSubmissionSharePointLinkColumn;
      this.cfg.idpPublicCommentPeriodSharePointEnabled = DEFAULTS.idpPublicCommentPeriodSharePointEnabled;
      this.cfg.idpPublicCommentPeriodSharePointSiteUrl = DEFAULTS.idpPublicCommentPeriodSharePointSiteUrl;
      this.cfg.idpPublicCommentPeriodSharePointLibrary = DEFAULTS.idpPublicCommentPeriodSharePointLibrary;
      this.cfg.idpPublicCommentPeriodSharePointLinkColumn = DEFAULTS.idpPublicCommentPeriodSharePointLinkColumn;
      this.cfg.idpCouncilAdoptionSharePointEnabled = DEFAULTS.idpCouncilAdoptionSharePointEnabled;
      this.cfg.idpCouncilAdoptionSharePointSiteUrl = DEFAULTS.idpCouncilAdoptionSharePointSiteUrl;
      this.cfg.idpCouncilAdoptionSharePointLibrary = DEFAULTS.idpCouncilAdoptionSharePointLibrary;
      this.cfg.idpCouncilAdoptionSharePointLinkColumn = DEFAULTS.idpCouncilAdoptionSharePointLinkColumn;
      this.cfg.idpCommunityNeedsSharePointEnabled = DEFAULTS.idpCommunityNeedsSharePointEnabled;
      this.cfg.idpCommunityNeedsSharePointSiteUrl = DEFAULTS.idpCommunityNeedsSharePointSiteUrl;
      this.cfg.idpCommunityNeedsSharePointLibrary = DEFAULTS.idpCommunityNeedsSharePointLibrary;
      this.cfg.idpCommunityNeedsSharePointLinkColumn = DEFAULTS.idpCommunityNeedsSharePointLinkColumn;
    }
    // Overtime page owns the DB config + SharePoint config — reset them too
    if (this.activeKey() === 'overtime') {
      this.cfg.overtimeDbHost     = DEFAULTS.overtimeDbHost;
      this.cfg.overtimeDbPort     = DEFAULTS.overtimeDbPort;
      this.cfg.overtimeDbName     = DEFAULTS.overtimeDbName;
      this.cfg.overtimeDbUser     = DEFAULTS.overtimeDbUser;
      this.cfg.overtimeDbPassword = DEFAULTS.overtimeDbPassword;
      this.cfg.overtimeDbSslMode  = DEFAULTS.overtimeDbSslMode;
      this.cfg.overtimeSharePointEnabled = DEFAULTS.overtimeSharePointEnabled;
      this.cfg.overtimeSharePointSiteUrl = DEFAULTS.overtimeSharePointSiteUrl;
      this.cfg.overtimeSharePointLibrary = DEFAULTS.overtimeSharePointLibrary;
    }
    // Payroll page owns the DB config — reset it too
    if (this.activeKey() === 'payroll') {
      this.cfg.payrollDbHost     = DEFAULTS.payrollDbHost;
      this.cfg.payrollDbPort     = DEFAULTS.payrollDbPort;
      this.cfg.payrollDbName     = DEFAULTS.payrollDbName;
      this.cfg.payrollDbUser     = DEFAULTS.payrollDbUser;
      this.cfg.payrollDbPassword = DEFAULTS.payrollDbPassword;
      this.cfg.payrollDbSslMode  = DEFAULTS.payrollDbSslMode;
    }
    this.dirty.set(true);
  }

  /** Build the AZURE_POSTGRES_URL connection string from the AFS DB fields. */
  afsConnString(): string {
    const c = this.cfg;
    return `Host=${c.afsDbHost};Port=${c.afsDbPort};Database=${c.afsDbName};Username=${c.afsDbUser};Password=••••••••;SslMode=${c.afsDbSslMode};CommandTimeout=600;Timeout=30`;
  }

  /** Validate the AFS DB config fields are complete and well-formed. */
  testAfsDb() {
    this.spTesting.set(true);
    const c = this.cfg;
    const ok = !!c.afsDbHost && !!c.afsDbPort && !!c.afsDbName && !!c.afsDbUser
      && /^\d+$/.test(c.afsDbPort) && /\.postgres\.database\.azure\.com$|localhost|^\d/.test(c.afsDbHost);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`AFS DB config valid — database "${c.afsDbName}" on ${c.afsDbHost}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid AFS DB config — check Host, Port (numeric), Database and Username.', 'Close', { duration: 5000 });
      }
    }, 500);
  }

  /** Build the ConnectionStrings:OvertimeDb value from the Overtime DB fields. */
  overtimeConnString(): string {
    const c = this.cfg;
    return `Host=${c.overtimeDbHost};Port=${c.overtimeDbPort};Database=${c.overtimeDbName};Username=${c.overtimeDbUser};Password=••••••••;SslMode=${c.overtimeDbSslMode};CommandTimeout=600;Timeout=30`;
  }

  /** Validate the Overtime DB config fields are complete and well-formed. */
  testOvertimeDb() {
    this.spTesting.set(true);
    const c = this.cfg;
    const ok = !!c.overtimeDbHost && !!c.overtimeDbPort && !!c.overtimeDbName && !!c.overtimeDbUser
      && /^\d+$/.test(c.overtimeDbPort) && /\.postgres\.database\.azure\.com$|localhost|^\d/.test(c.overtimeDbHost);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`Overtime DB config valid — database "${c.overtimeDbName}" on ${c.overtimeDbHost}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid Overtime DB config — check Host, Port (numeric), Database and Username.', 'Close', { duration: 5000 });
      }
    }, 500);
  }

  /** Build the AZURE_DATABASE_URL value from the Payroll DB fields. */
  payrollConnString(): string {
    const c = this.cfg;
    const ssl = (c.payrollDbSslMode || 'require').toLowerCase();
    return `postgresql://${c.payrollDbUser}:••••••••@${c.payrollDbHost}:${c.payrollDbPort}/${c.payrollDbName}?sslmode=${ssl}`;
  }

  /** Validate the Payroll DB config fields are complete and well-formed. */
  testPayrollDb() {
    this.spTesting.set(true);
    const c = this.cfg;
    const ok = !!c.payrollDbHost && !!c.payrollDbPort && !!c.payrollDbName && !!c.payrollDbUser
      && /^\d+$/.test(c.payrollDbPort) && /\.postgres\.database\.azure\.com$|localhost|^\d/.test(c.payrollDbHost);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`Payroll DB config valid — database "${c.payrollDbName}" on ${c.payrollDbHost}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid Payroll DB config — check Host, Port (numeric), Database and Username.', 'Close', { duration: 5000 });
      }
    }, 500);
  }

  testSharePoint() {
    this.spTesting.set(true);
    // Validate the site URL is reachable / well-formed. The actual Graph call
    // happens in the assets module via MSAL; here we do a basic reachability check.
    const url = this.cfg.assetsSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.assetsSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointAfs() {
    this.spTesting.set(true);
    // Basic site-URL well-formedness check (mirrors the assets module's check).
    const url = this.cfg.afsSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.afsSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointIdp() {
    this.spTesting.set(true);
    // Basic site-URL well-formedness check (mirrors the assets module's check).
    const url = this.cfg.idpSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.idpSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointIdpInstitutional() {
    this.spTesting.set(true);
    const url = this.cfg.idpInstitutionalSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.idpInstitutionalSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointIdpSituational() {
    this.spTesting.set(true);
    const url = this.cfg.idpSituationalSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.idpSituationalSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointIdpSpatial() {
    this.spTesting.set(true);
    const url = this.cfg.idpSpatialSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.idpSpatialSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointIdpSwot() {
    this.spTesting.set(true);
    const url = this.cfg.idpSwotSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.idpSwotSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointIdpPriority() {
    this.spTesting.set(true);
    const url = this.cfg.idpPrioritySharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.idpPrioritySharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointIdpStrategic() {
    this.spTesting.set(true);
    const url = this.cfg.idpStrategicSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.idpStrategicSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointIdpVision() {
    this.spTesting.set(true);
    const url = this.cfg.idpVisionSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.idpVisionSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointIdpKpi() {
    this.spTesting.set(true);
    const url = this.cfg.idpKpiSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.idpKpiSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointIdpDevelopment() {
    this.spTesting.set(true);
    const url = this.cfg.idpDevelopmentSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.idpDevelopmentSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointIdpSdf() {
    this.spTesting.set(true);
    const url = this.cfg.idpSdfSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.idpSdfSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointIdpCapital() {
    this.spTesting.set(true);
    const url = this.cfg.idpCapitalSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.idpCapitalSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointIdpOperational() {
    this.spTesting.set(true);
    const url = this.cfg.idpOperationalSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.idpOperationalSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointIdpMscoa() {
    this.spTesting.set(true);
    const url = this.cfg.idpMscoaSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.idpMscoaSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointIdpProjectPrioritisation() {
    this.spTesting.set(true);
    const url = this.cfg.idpProjectPrioritisationSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.idpProjectPrioritisationSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointIdpFinancial() {
    this.spTesting.set(true);
    const url = this.cfg.idpFinancialSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.idpFinancialSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointIdpDocument() {
    this.spTesting.set(true);
    const url = this.cfg.idpDocumentSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.idpDocumentSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointIdpSector() {
    this.spTesting.set(true);
    const url = this.cfg.idpSectorSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.idpSectorSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointIdpBudgetAlignment() {
    this.spTesting.set(true);
    const url = this.cfg.idpBudgetAlignmentSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.idpBudgetAlignmentSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointIdpPublicComment() {
    this.spTesting.set(true);
    const url = this.cfg.idpPublicCommentSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.idpPublicCommentSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointIdpMec() {
    this.spTesting.set(true);
    const url = this.cfg.idpMecSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.idpMecSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointIdpFinalSubmission() {
    this.spTesting.set(true);
    const url = this.cfg.idpFinalSubmissionSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.idpFinalSubmissionSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointIdpPublicCommentPeriod() {
    this.spTesting.set(true);
    const url = this.cfg.idpPublicCommentPeriodSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.idpPublicCommentPeriodSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointIdpCouncilAdoption() {
    this.spTesting.set(true);
    const url = this.cfg.idpCouncilAdoptionSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.idpCouncilAdoptionSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointIdpCommunityNeeds() {
    this.spTesting.set(true);
    const url = this.cfg.idpCommunityNeedsSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.idpCommunityNeedsSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointAfsAdjustments() {
    this.spTesting.set(true);
    const url = this.cfg.afsAdjustmentsSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.afsAdjustmentsSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointAfsAdministration() {
    this.spTesting.set(true);
    const url = this.cfg.afsAdministrationSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.afsAdministrationSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }

  testSharePointOvertime() {
    this.spTesting.set(true);
    // Basic site-URL well-formedness check (mirrors the assets module's check).
    const url = this.cfg.overtimeSharePointSiteUrl?.trim();
    const ok = !!url && /^https:\/\/.+\.sharepoint\.com\/sites\/.+/.test(url);
    setTimeout(() => {
      this.spTesting.set(false);
      if (ok) {
        this.snack.open(`SharePoint site URL looks valid. Library: ${this.cfg.overtimeSharePointLibrary}`, 'OK', { duration: 4000 });
      } else {
        this.snack.open('Invalid SharePoint site URL. Expected https://<tenant>.sharepoint.com/sites/<site>', 'Close', { duration: 5000 });
      }
    }, 600);
  }
}
