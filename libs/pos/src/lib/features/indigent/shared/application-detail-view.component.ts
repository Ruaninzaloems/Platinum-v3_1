import { Component, Input, OnInit, OnChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { IndigentService } from '../../../services/indigent.service';
import { ApiService } from '../../../core/services/api.service';
import { formatDate } from '../../../services/format.service';
import { getStatusBadgeClass } from './status-badge.util';
import type { ApplicationDetail } from '../../../models/indigent.models';

@Component({
  selector: 'app-application-detail-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (loading()) {
      <div class="detail-loading" data-testid="detail-loading">
        <span class="spinner spinner-lg"></span>
        <p>Loading application details...</p>
      </div>
    } @else if (error()) {
      <div class="detail-error" data-testid="detail-error">
        <p>{{ error() }}</p>
      </div>
    } @else if (detail()) {
      <div class="detail-view" data-testid="detail-view">
        <div class="detail-actions" style="position:relative;display:inline-flex;gap:8px;align-items:center">
          @if (canSubmitForVerification) {
            <button class="btn-download" (click)="submitForVerification()" [disabled]="submittingForVerification()" data-testid="button-submit-for-verification" style="background:var(--platinum-primary);color:#fff;border-color:var(--platinum-primary)">
              @if (submittingForVerification()) {
                <span class="spinner spinner-sm"></span> Submitting…
              } @else {
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                Submit for Verification
              }
            </button>
          }
          @if (submitMessage()) {
            <span [attr.data-testid]="'submit-message-' + submitMessage()!.type" [style.color]="submitMessage()!.type === 'success' ? '#166534' : '#991b1b'" [style.background]="submitMessage()!.type === 'success' ? '#f0fdf4' : '#fef2f2'" [style.border]="submitMessage()!.type === 'success' ? '1px solid #86efac' : '1px solid #fca5a5'" style="padding:4px 10px;border-radius:6px;font-size:12px;font-weight:500">{{ submitMessage()!.text }}</span>
          }
          <button class="btn-download" (click)="toggleDownloadMenu()" [disabled]="downloading()" data-testid="btn-download-pdf-menu">
            @if (downloading()) {
              <span class="spinner spinner-sm"></span> Generating PDF...
            } @else {
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Downloads
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-left:4px"><polyline points="6 9 12 15 18 9"/></svg>
            }
          </button>
          @if (downloadMenuOpen()) {
            <div (click)="closeDownloadMenu()" style="position:fixed;inset:0;z-index:99"></div>
            <div style="position:absolute;top:100%;left:0;margin-top:6px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;box-shadow:0 8px 24px rgba(15,43,70,0.18);min-width:260px;z-index:100;overflow:hidden" data-testid="menu-downloads">
              <button (click)="downloadPdfType('application')" [disabled]="!!downloadingType()" data-testid="btn-download-application" style="display:flex;align-items:center;gap:10px;width:100%;padding:10px 14px;border:none;background:none;text-align:left;font-size:13px;color:var(--platinum-primary);cursor:pointer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;color:var(--platinum-accent)"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span>Application PDF</span>
                @if (downloadingType() === 'application') { <span class="spinner spinner-sm" style="margin-left:auto"></span> }
              </button>
              <button (click)="downloadPdfType('site-verification')" [disabled]="!!downloadingType()" data-testid="btn-download-site-verification" style="display:flex;align-items:center;gap:10px;width:100%;padding:10px 14px;border:none;background:none;text-align:left;font-size:13px;color:var(--platinum-primary);cursor:pointer;border-top:1px solid #f1f5f9">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;color:var(--platinum-accent)"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                <span>Site Verification PDF</span>
                @if (downloadingType() === 'site-verification') { <span class="spinner spinner-sm" style="margin-left:auto"></span> }
              </button>
              <button (click)="downloadPdfType('doc-verification')" [disabled]="!!downloadingType()" data-testid="btn-download-doc-verification" style="display:flex;align-items:center;gap:10px;width:100%;padding:10px 14px;border:none;background:none;text-align:left;font-size:13px;color:var(--platinum-primary);cursor:pointer;border-top:1px solid #f1f5f9">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;color:var(--platinum-accent)"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                <span>Document Verification PDF</span>
                @if (downloadingType() === 'doc-verification') { <span class="spinner spinner-sm" style="margin-left:auto"></span> }
              </button>
              <button (click)="downloadPdfType('authorization')" [disabled]="!!downloadingType()" data-testid="btn-download-authorization" style="display:flex;align-items:center;gap:10px;width:100%;padding:10px 14px;border:none;background:none;text-align:left;font-size:13px;color:var(--platinum-primary);cursor:pointer;border-top:1px solid #f1f5f9">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;color:#16a34a"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span>Authorization Letter</span>
                @if (downloadingType() === 'authorization') { <span class="spinner spinner-sm" style="margin-left:auto"></span> }
              </button>
              <button (click)="downloadPdfType('termination')" [disabled]="!!downloadingType()" data-testid="btn-download-termination" style="display:flex;align-items:center;gap:10px;width:100%;padding:10px 14px;border:none;background:none;text-align:left;font-size:13px;color:var(--platinum-primary);cursor:pointer;border-top:1px solid #f1f5f9">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;color:#dc2626"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <span>Termination Letter</span>
                @if (downloadingType() === 'termination') { <span class="spinner spinner-sm" style="margin-left:auto"></span> }
              </button>
            </div>
          }
        </div>

        <div class="detail-section">
          <h4 class="section-title">Application Information</h4>
          <div class="detail-grid">
            <div class="detail-item"><span class="label">Application ID</span><span class="value font-mono">{{ detail()!.application.applicationId }}</span></div>
            <div class="detail-item"><span class="label">Account Number</span><span class="value font-mono">{{ detail()!.application.accountNumber || '—' }}</span></div>
            <div class="detail-item"><span class="label">ID Number</span><span class="value font-mono">{{ detail()!.application.idNumber || '—' }}</span></div>
            <div class="detail-item detail-full" data-testid="section-parallel-tracks" style="display:flex;gap:12px;flex-wrap:wrap;padding:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
              <div style="flex:1;min-width:200px;display:flex;flex-direction:column;gap:6px">
                <span class="label">Status</span>
                <span class="badge" [class]="getStatusClass(detail()!.application.appStatusName)" data-testid="badge-status" style="align-self:flex-start">{{ detail()!.application.appStatusName }}</span>
              </div>
              <div style="flex:1;min-width:200px;display:flex;flex-direction:column;gap:6px;border-left:1px solid #e2e8f0;padding-left:12px">
                <span class="label">Site Verification Track</span>
                <span class="badge" [class]="siteTrackBadge.cssClass" data-testid="badge-site-track" style="align-self:flex-start">{{ siteTrackBadge.label }}</span>
              </div>
              <div style="flex:1;min-width:200px;display:flex;flex-direction:column;gap:6px;border-left:1px solid #e2e8f0;padding-left:12px">
                <span class="label">Document Verification Track</span>
                <span class="badge" [class]="docTrackBadge.cssClass" data-testid="badge-doc-track" style="align-self:flex-start">{{ docTrackBadge.label }}</span>
              </div>
            </div>
            <div class="detail-item"><span class="label">Indigent Type</span><span class="value">{{ detail()!.application.indigentTypeName }}</span></div>
            <div class="detail-item"><span class="label">Application Date</span><span class="value">{{ fmtDate(detail()!.application.applicationDate) }}</span></div>
            <div class="detail-item"><span class="label">Reapplication Date</span><span class="value">{{ fmtDate(detail()!.application.reApplicationDate) }}</span></div>
            <div class="detail-item"><span class="label">Do-Not-Cut Date</span><span class="value">{{ fmtDate(detail()!.application.doNotCutDate) }}</span></div>
            <div class="detail-item"><span class="label">Household Income</span><span class="value font-mono">{{ fmtCurrency(detail()!.application.householdIncome) }}</span></div>
            <div class="detail-item"><span class="label">Monthly Subsidy</span><span class="value font-mono">{{ fmtCurrency(detail()!.application.monthlySubsidy) }}</span></div>
            @if (detail()!.application.qualifiedSubsidyPercentage != null) {
              <div class="detail-item"><span class="label">Subsidy %</span><span class="value"><span [style.background]="detail()!.application.qualifiedSubsidyPercentage! > 0 ? '#e8f5e9' : '#fce4ec'" [style.color]="detail()!.application.qualifiedSubsidyPercentage! > 0 ? '#1b5e20' : '#c62828'" style="padding: 2px 8px; border-radius: 4px; font-weight: 600;">{{ detail()!.application.qualifiedSubsidyPercentage }}%</span></span></div>
            }
            <div class="detail-item"><span class="label">Qualifying Units</span><span class="value">{{ detail()!.application.qualifyingUnits }}</span></div>
            <div class="detail-item"><span class="label">Write-Off</span><span class="value font-mono">{{ fmtCurrency(detail()!.application.onceWriteOff) }}</span></div>
            <div class="detail-item"><span class="label">Commencement Date</span><span class="value">{{ fmtDate(detail()!.application.commencementDate) }}</span></div>
            <div class="detail-item"><span class="label">Termination Date</span><span class="value">{{ fmtDate(detail()!.application.terminationDate) }}</span></div>

            <div class="detail-item"><span class="label">Date Captured</span><span class="value">{{ fmtDate(detail()!.application.dateCaptured) }}</span></div>
            <div class="detail-item"><span class="label">Review Date</span><span class="value">{{ fmtDate(detail()!.application.reviewDate) }}</span></div>
            <div class="detail-item"><span class="label">Contractor</span><span class="value">{{ detail()!.application.contractorName || '—' }}</span></div>
            @if (detail()!.application.remarks) {
              <div class="detail-item detail-full"><span class="label">Remarks</span><span class="value">{{ detail()!.application.remarks }}</span></div>
            }
          </div>
        </div>

        @if (detail()!.occupiers.length > 0) {
          <div class="detail-section">
            <h4 class="section-title">Occupiers ({{ detail()!.occupiers.length }})</h4>
            <div class="occupier-cards">
              @for (occ of detail()!.occupiers; track occ.occupierId) {
                <div class="occupier-card" [attr.data-testid]="'occupier-card-' + occ.occupierId">
                  <div class="occ-header">
                    <span class="occ-name">{{ occ.fullName || '—' }}</span>
                    @if (occ.occupierTypeName) {
                      <span class="occ-type-badge">{{ occ.occupierTypeName }}</span>
                    }
                    @if (occ.dwellingUnitNo) {
                      <span class="occ-unit-badge">Unit {{ occ.dwellingUnitNo }}</span>
                    }
                  </div>
                  <div class="occ-details">
                    <div class="occ-field"><span class="occ-label">ID Number</span><span class="occ-value font-mono">{{ occ.idNumber || occ.passportNumber || '—' }}</span></div>
                    @if (occ.passportNumber && occ.idNumber) {
                      <div class="occ-field"><span class="occ-label">Passport</span><span class="occ-value font-mono">{{ occ.passportNumber }}</span></div>
                    }
                    <div class="occ-field"><span class="occ-label">Contact</span><span class="occ-value">{{ occ.contactNumber || '—' }}</span></div>
                    <div class="occ-field"><span class="occ-label">Employer</span><span class="occ-value">{{ occ.employerName || '—' }}</span></div>
                    <div class="occ-field"><span class="occ-label">Income Source</span><span class="occ-value">{{ occ.incomeSourceName || '—' }}</span></div>
                    <div class="occ-field"><span class="occ-label">Income</span><span class="occ-value font-mono">{{ fmtCurrency(occ.incomeAmount) }}</span></div>
                  </div>
                  @if (occ.remarks) {
                    <div class="occ-remarks"><span class="occ-label">Remarks</span><span class="occ-value">{{ occ.remarks }}</span></div>
                  }
                </div>
              }
            </div>
          </div>
        }

        @if (detail()!.tenant) {
          <div class="detail-section">
            <h4 class="section-title">Tenant Information</h4>
            <div class="detail-grid">
              <div class="detail-item"><span class="label">Name</span><span class="value">{{ detail()!.tenant!.fullName || '—' }}</span></div>
              <div class="detail-item"><span class="label">ID Number</span><span class="value font-mono">{{ detail()!.tenant!.idNumber || '—' }}</span></div>
              <div class="detail-item"><span class="label">Phone</span><span class="value">{{ detail()!.tenant!.cellPhone || '—' }}</span></div>
              <div class="detail-item"><span class="label">Email</span><span class="value">{{ detail()!.tenant!.email || '—' }}</span></div>
            </div>
          </div>
        }

        @if (documentsError()) {
          <div class="detail-section" data-testid="docs-error-inline">
            <h4 class="section-title">Documents</h4>
            <div style="border:1px solid #fecaca;background:#fef2f2;color:#991b1b;padding:12px;border-radius:8px;font-size:13px">
              <strong>Could not load documents from Platinum API.</strong>
              <div style="margin-top:4px">{{ documentsError() }}</div>
              <button class="btn-doc-download" (click)="loadDetail()" style="margin-top:8px" data-testid="btn-retry-docs-inline">Retry</button>
            </div>
          </div>
        }
        @if (documents().length > 0) {
          <div class="detail-section">
            <h4 class="section-title">Documents ({{ documents().length }})</h4>
            <table class="mini-table">
              <thead>
                <tr>
                  <th>Document Name</th>
                  <th>Type</th>
                  <th>Date Uploaded</th>
                  <th class="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (doc of documents(); track doc.docId) {
                  <tr>
                    <td>{{ doc.fileName || doc.documentName || '—' }}</td>
                    <td>{{ doc.documentTypeName || '—' }}</td>
                    <td>{{ fmtDate(doc.dateCaptured) }}</td>
                    <td class="text-center">
                      <button class="btn-doc-download" (click)="downloadDocument(doc)" [disabled]="doc._downloading" [attr.data-testid]="'btn-download-doc-' + doc.docId">
                        @if (doc._downloading) {
                          <span class="spinner spinner-sm"></span>
                        } @else {
                          <span class="material-icons" style="font-size:16px">download</span>
                        }
                        Download
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        @if (detail()!.verifications.length > 0) {
          <div class="detail-section">
            <h4 class="section-title">Verifications ({{ detail()!.verifications.length }})</h4>
            <table class="mini-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Officer</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                @for (v of detail()!.verifications; track v.verificationId) {
                  <tr>
                    <td>{{ fmtDate(v.homeVisitDate) }}</td>
                    <td>{{ v.verificationOfficer }}</td>
                    <td>{{ v.verificationOutcomeName }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .detail-loading, .detail-error { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 2rem; color: var(--platinum-text-secondary); }
    .detail-error { color: #991b1b; }
    .detail-view { display: flex; flex-direction: column; gap: 1.5rem; }
    .detail-actions { display: flex; justify-content: flex-end; }
    .btn-download {
      display: inline-flex; align-items: center; gap: 6px; padding: 7px 16px; border-radius: 6px;
      font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid var(--platinum-accent);
      background: linear-gradient(135deg, var(--platinum-primary), #1a3a5c); color: #fff;
      transition: all 0.2s;
    }
    .btn-download:hover:not(:disabled) { opacity: 0.9; box-shadow: 0 2px 8px rgba(15,43,70,0.3); }
    .btn-download:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-download svg { flex-shrink: 0; }
    .detail-section { }
    .section-title { font-size: 14px; font-weight: 600; color: var(--platinum-text); margin: 0 0 0.75rem 0; padding-bottom: 0.5rem; border-bottom: 1px solid var(--platinum-border); }
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem; }
    .detail-full { grid-column: 1 / -1; }
    .detail-item { display: flex; flex-direction: column; gap: 2px; }
    .label { font-size: 10px; color: var(--platinum-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .value { font-size: 13px; color: var(--platinum-text); font-weight: 500; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .mini-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .mini-table th { text-align: left; font-size: 10px; font-weight: 600; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
    .mini-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
    .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; border: 1px solid; white-space: nowrap; }
    .badge-info { background: #eff6ff; color: #1e40af; border-color: #bfdbfe; }
    .badge-success { background: #f0fdf4; color: #166534; border-color: #86efac; }
    .badge-warning { background: #fffbeb; color: #92400e; border-color: #fcd34d; }
    .badge-danger { background: #fef2f2; color: #991b1b; border-color: #fca5a5; }
    .badge-orange { background: #fff7ed; color: #9a3412; border-color: #fdba74; }
    .badge-grey { background: #f1f5f9; color: #475569; border-color: #cbd5e1; }
    .badge-default { background: #f1f5f9; color: #475569; border-color: #cbd5e1; }
    .spinner-sm { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .occupier-cards { display: flex; flex-direction: column; gap: 10px; }
    .occupier-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; background: #fafbfc; }
    .occ-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
    .occ-name { font-size: 13px; font-weight: 600; color: var(--platinum-text); }
    .occ-type-badge { font-size: 10px; padding: 2px 8px; border-radius: 12px; background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; font-weight: 600; }
    .occ-unit-badge { font-size: 10px; padding: 2px 8px; border-radius: 12px; background: #f0fdf4; color: #166534; border: 1px solid #86efac; font-weight: 600; }
    .occ-details { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 6px 16px; }
    .occ-field { display: flex; flex-direction: column; gap: 1px; }
    .occ-label { font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
    .occ-value { font-size: 12px; color: var(--platinum-text); font-weight: 500; }
    .occ-remarks { margin-top: 6px; padding-top: 6px; border-top: 1px dashed #e2e8f0; }

    .btn-doc-download {
      display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 4px;
      font-size: 11px; font-weight: 500; cursor: pointer; border: 1px solid #cbd5e1;
      background: #fff; color: var(--platinum-primary); transition: all 0.2s;
    }
    .btn-doc-download:hover:not(:disabled) { background: #f1f5f9; border-color: var(--platinum-primary); }
    .btn-doc-download:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class ApplicationDetailViewComponent implements OnInit, OnChanges {
  @Input() applicationId!: number;

  detail = signal<ApplicationDetail | null>(null);
  documents = signal<any[]>([]);
  documentsError = signal<string | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  downloading = signal(false);
  downloadMenuOpen = signal(false);
  downloadingType = signal<string | null>(null);
  submittingForVerification = signal(false);
  submitMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  @Input() userId?: number;

  constructor(private svc: IndigentService, private api: ApiService) {}

  get latestVerification(): any | null {
    const list = this.detail()?.verifications || [];
    if (list.length === 0) return null;
    return [...list].sort((a: any, b: any) => {
      const da = new Date(a.homeVisitDate || 0).getTime();
      const db = new Date(b.homeVisitDate || 0).getTime();
      return db - da;
    })[0];
  }

  get siteTrackBadge(): { label: string; cssClass: string } {
    const v = this.latestVerification;
    if (!v) return { label: 'Site: Not Started', cssClass: 'badge-grey' };
    const outcome = (v.verificationOutcomeName || '').trim();
    const home = (v.homeVisitOutcomeName || '').trim();
    if (outcome.toLowerCase() === 'qualify') return { label: 'Site: Qualified', cssClass: 'badge-success' };
    if (outcome.toLowerCase() === 'disqualify') return { label: 'Site: Disqualified', cssClass: 'badge-danger' };
    if (home) return { label: `Site: ${home}`, cssClass: 'badge-warning' };
    return { label: 'Site: In Progress', cssClass: 'badge-info' };
  }

  get docTrackBadge(): { label: string; cssClass: string } {
    const docs = this.documents();
    if (this.documentsError()) return { label: 'Docs: Error', cssClass: 'badge-danger' };
    if (docs.length === 0) return { label: 'Docs: Not Started', cssClass: 'badge-grey' };
    const anyRejected = docs.some((d: any) => {
      const s = (d.verificationStatus || d.verificationOutcomeName || d.status || '').toLowerCase();
      return s === 'rejected' || s === 'disqualify';
    });
    if (anyRejected) return { label: 'Docs: Rejected', cssClass: 'badge-danger' };
    const allVerified = docs.length > 0 && docs.every((d: any) => {
      const s = (d.verificationStatus || d.verificationOutcomeName || d.status || '').toLowerCase();
      return s === 'verified' || s === 'approved' || s === 'qualify';
    });
    if (allVerified) return { label: 'Docs: Verified', cssClass: 'badge-success' };
    return { label: `Docs: ${docs.length} Awaiting Verification`, cssClass: 'badge-info' };
  }

  get canSubmitForVerification(): boolean {
    const a = this.detail()?.application;
    if (!a) return false;
    if (this.submittingForVerification()) return false;
    const id = (a as any).appStatusId;
    const name = (a.appStatusName || '').toLowerCase();
    return id === 134 || id === 135 || name === 'application' || name === 're-application';
  }

  async submitForVerification(): Promise<void> {
    if (!this.applicationId || !this.canSubmitForVerification) return;
    this.submittingForVerification.set(true);
    this.submitMessage.set(null);
    try {
      const res: any = await firstValueFrom(this.svc.submitForVerification({
        applicationId: this.applicationId,
        capturerId: this.userId,
        modifierId: this.userId,
      }));
      if (res?.isSuccess === false) {
        this.submitMessage.set({ type: 'error', text: res?.message || 'Failed to submit for verification' });
        return;
      }
      this.submitMessage.set({ type: 'success', text: 'Application submitted for verification.' });
      await this.loadDetail();
    } catch (e: any) {
      const msg = e?.error?.message || e?.message || 'Failed to submit for verification.';
      this.submitMessage.set({ type: 'error', text: msg });
    } finally {
      this.submittingForVerification.set(false);
    }
  }

  toggleDownloadMenu(): void { this.downloadMenuOpen.update(v => !v); }
  closeDownloadMenu(): void { this.downloadMenuOpen.set(false); }

  async downloadPdfType(type: 'application' | 'site-verification' | 'doc-verification' | 'authorization' | 'termination'): Promise<void> {
    if (!this.applicationId || this.downloadingType()) return;
    this.downloadingType.set(type);
    this.downloading.set(true);
    this.closeDownloadMenu();
    const filenames: Record<string, string> = {
      'application': `Indigent_Application_${this.applicationId}.pdf`,
      'site-verification': `Site_Verification_${this.applicationId}.pdf`,
      'doc-verification': `Document_Verification_${this.applicationId}.pdf`,
      'authorization': `Authorization_Letter_${this.applicationId}.pdf`,
      'termination': `Termination_Letter_${this.applicationId}.pdf`,
    };
    const callers: Record<string, () => any> = {
      'application': () => this.svc.downloadApplicationPdf(this.applicationId!),
      'site-verification': () => this.svc.downloadSiteVerificationPdf(this.applicationId!),
      'doc-verification': () => this.svc.downloadDocVerificationPdf(this.applicationId!),
      'authorization': () => this.svc.downloadAuthorizationLetter(this.applicationId!),
      'termination': () => this.svc.downloadTerminationLetter(this.applicationId!),
    };
    try {
      const blob = await firstValueFrom(callers[type]());
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filenames[type];
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      const msg = e?.status === 404
        ? 'This document is not yet available for this application.'
        : 'Failed to generate PDF. Please try again.';
      alert(msg);
    } finally {
      this.downloadingType.set(null);
      this.downloading.set(false);
    }
  }

  ngOnInit(): void { this.loadDetail(); }
  ngOnChanges(): void { this.loadDetail(); }

  async loadDetail(): Promise<void> {
    if (!this.applicationId) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const [detail, docs] = await Promise.allSettled([
        firstValueFrom(this.svc.getApplicationDetail(this.applicationId)),
        firstValueFrom(this.api.get('/api/platinum/billing-attp/documents', { applicationId: String(this.applicationId) })) as Promise<any>,
      ]);
      if (detail.status === 'fulfilled') {
        this.detail.set(detail.value);
      } else {
        this.error.set('Failed to load application details.');
      }
      if (docs.status === 'fulfilled') {
        const v: any = docs.value;
        const docList = Array.isArray(v) ? v : (Array.isArray(v?.items) ? v.items : (Array.isArray(v?.data) ? v.data : null));
        if (docList === null) {
          this.documentsError.set('Unexpected response shape from documents endpoint.');
          this.documents.set([]);
        } else {
          this.documentsError.set(null);
          this.documents.set(docList.map((d: any) => ({
            docId: d.docId ?? d.documentId ?? d.id ?? 0,
            documentTypeId: d.documentTypeId ?? d.docTypeId ?? null,
            fileName: d.fileName ?? d.documentName ?? d.name ?? '',
            documentTypeName: d.documentTypeName ?? d.documentType ?? d.typeName ?? '',
            dateCaptured: d.dateCaptured ?? d.uploadDate ?? d.dateCreated ?? '',
            verificationStatus: d.verificationStatus ?? d.verificationOutcomeName ?? d.status ?? '',
            verificationOutcomeName: d.verificationOutcomeName ?? '',
            status: d.status ?? '',
            _downloading: false,
          })));
        }
      } else {
        const reason: any = (docs as PromiseRejectedResult).reason;
        const msg = reason?.error?.message || reason?.message || 'Failed to load documents from Platinum API.';
        this.documentsError.set(msg);
        this.documents.set([]);
      }
    } catch {
      this.error.set('Failed to load application details.');
    } finally {
      this.loading.set(false);
    }
  }

  async downloadDocument(doc: any): Promise<void> {
    if (doc._downloading) return;
    doc._downloading = true;
    this.documents.update(d => [...d]);
    try {
      const data: any = await firstValueFrom(this.api.get<any>('/api/platinum/billing-attp/download-document', { docId: String(doc.docId) }));
      if (data?.fileContent || data?.fileData) {
        const base64 = data.fileContent || data.fileData;
        const contentType = data.contentType || data.mimeType || 'application/octet-stream';
        const byteChars = atob(base64);
        const byteArr = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
        const blob = new Blob([byteArr], { type: contentType });
        const url = URL.createObjectURL(blob as Blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName || `document_${doc.docId}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert('Document content not available.');
      }
    } catch {
      alert('Failed to download document.');
    } finally {
      doc._downloading = false;
      this.documents.update(d => [...d]);
    }
  }

  async downloadPdf(): Promise<void> {
    if (!this.applicationId || this.downloading()) return;
    this.downloading.set(true);
    try {
      const blob = await firstValueFrom(this.svc.downloadApplicationPdf(this.applicationId));
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Indigent_Application_${this.applicationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to generate PDF. Please try again.');
    } finally {
      this.downloading.set(false);
    }
  }

  fmtDate(val: string | null | undefined): string { return formatDate(val); }
  fmtCurrency(val: number): string { return 'R ' + (val ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  getStatusClass(status: string): string { return getStatusBadgeClass(status); }
}
