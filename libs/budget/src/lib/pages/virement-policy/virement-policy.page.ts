import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { FinancialYear } from '../../core/models/budget.models';

@Component({
  selector: 'app-virement-policy',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatSelectModule, MatFormFieldModule, MatInputModule, MatTooltipModule],
  template: `
    <!-- ── Page header ── -->
    <div class="page-header">
      <div>
        <h1>Virement Policy</h1>
        <p class="subtitle">Configure virement validation rules per financial year</p>
      </div>
      <div class="header-controls">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="fy-field">
          <mat-label>Financial Year</mat-label>
          <mat-select [(ngModel)]="selectedFyId" (ngModelChange)="onFyChange($event)">
            <mat-option *ngFor="let fy of financialYears" [value]="fy.id">{{ fy.yearCode }}</mat-option>
          </mat-select>
        </mat-form-field>

        @if (versions.length > 0) {
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="fy-field">
            <mat-label>Version</mat-label>
            <mat-select [(ngModel)]="selectedVersionId" (ngModelChange)="onVersionChange($event)">
              <mat-option *ngFor="let v of versions" [value]="v.id">{{ v.versionNumber }}</mat-option>
            </mat-select>
          </mat-form-field>
        }
      </div>
    </div>

    <!-- ── Loading ── -->
    @if (loading) {
      <div class="loading-state">
        <mat-icon class="spin">sync</mat-icon>
        <span>Loading...</span>
      </div>
    }

    <!-- ── Version header (existing version selected) ── -->
    @if (!loading && selectedVersion) {
      <div class="version-header-card">
        <div class="version-info">
          <div class="version-meta">
            <span class="version-number">{{ selectedVersion.versionNumber }}</span>
            @if (selectedVersion.versionName && selectedVersion.versionName !== selectedVersion.versionNumber) {
              <span class="version-name">{{ selectedVersion.versionName }}</span>
            }
            <span class="status-chip" [class.locked]="selectedVersion.isLocked" [class.unlocked]="!selectedVersion.isLocked">
              <mat-icon class="chip-icon">{{ selectedVersion.isLocked ? 'lock' : 'lock_open' }}</mat-icon>
              {{ selectedVersion.isLocked ? 'Locked' : 'Unlocked' }}
            </span>
            @if (selectedVersion.isCouncilApprovedPolicy) {
              <span class="status-chip council">
                <mat-icon class="chip-icon">verified</mat-icon>
                Council Approved
              </span>
            }
          </div>
          @if (selectedVersion.comments) {
            <p class="version-comments">{{ selectedVersion.comments }}</p>
          }
          @if (selectedVersion.approvedVirementPolicyFileName) {
            <div class="file-ref">
              <mat-icon>attach_file</mat-icon>
              <span>{{ selectedVersion.approvedVirementPolicyFileName }}</span>
            </div>
          }
        </div>
        <div class="version-actions">
          @if (selectedVersion.isLocked) {
            <button class="btn-outline" (click)="unlockVersion()">
              <mat-icon>lock_open</mat-icon> Unlock Configuration
            </button>
          } @else {
            <button class="btn-primary" (click)="openLockDialog()">
              <mat-icon>lock</mat-icon> Lock Configuration
            </button>
          }
        </div>
      </div>
    }

    <!-- ── No versions banner (draft from sys rules) ── -->
    @if (!loading && versions.length === 0 && selectedFyId) {
      <div class="draft-banner">
        <div class="draft-info">
          <mat-icon>info</mat-icon>
          <div>
            <strong>No policy version exists for {{ selectedFyCode }}</strong>
            <p>Showing system virement rules. Review the rules below then lock to create a new policy version.</p>
          </div>
        </div>
        <button class="btn-primary" (click)="openLockDialog()">
          <mat-icon>lock</mat-icon> Lock Configuration
        </button>
      </div>
    }

    <!-- ── Rules table ── -->
    @if (!loading && rules.length > 0) {
      <div class="table-card">
        <div class="table-header">
          <h2>
            @if (selectedVersion) { Policy Rules }
            @else { System Virement Rules }
            <span class="rule-count">{{ rules.length }}</span>
          </h2>
        </div>
        <div class="table-scroll">
          <table class="rules-table">
            <thead>
              <tr>
                <th class="col-option">Option</th>
                <th class="col-principle">Virement Principle</th>
                <th class="col-rule">Validation Rule</th>
                <th class="col-desc">Description</th>
              </tr>
            </thead>
            <tbody>
              @for (rule of rules; track rule.id) {
                <tr>
                  <td class="col-option">
                    @if (isOptionEditable) {
                      <div class="option-toggle">
                        <button class="opt-chip" [class.opt-yes]="!rule.option" (click)="setOption(rule, false)">Yes</button>
                        <button class="opt-chip" [class.opt-no]="rule.option" (click)="setOption(rule, true)">No</button>
                      </div>
                    } @else {
                      <span class="option-badge" [class.opt-yes]="!rule.option" [class.opt-no]="rule.option">
                        {{ rule.option ? 'No' : 'Yes' }}
                      </span>
                    }
                  </td>
                  <td class="col-principle">{{ rule.virementDesc }}</td>
                  <td class="col-rule">{{ rule.virementRuleDesc }}</td>
                  <td class="col-desc">{{ rule.virementDefinition }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- ── Empty state ── -->
    @if (!loading && rules.length === 0 && selectedFyId) {
      <div class="empty-state">
        <mat-icon class="empty-icon">policy</mat-icon>
        <h3>No rules found</h3>
        <p>No enabled virement rules are configured for {{ selectedFyCode }}.</p>
      </div>
    }

    <!-- ── Lock dialog overlay (new version only) ── -->
    @if (showLockDialog) {
      <div class="overlay-backdrop" (click)="closeLockDialog()">
        <div class="overlay-card" (click)="$event.stopPropagation()">
          <div class="overlay-header">
            <div>
              <h3>Lock Policy Configuration</h3>
              <p>This will create a new virement policy version for {{ selectedFyCode }}</p>
            </div>
            <button class="icon-btn" (click)="closeLockDialog()">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <div class="overlay-body">
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Version Number</mat-label>
                <input matInput [value]="nextVersionNumber" readonly>
                <mat-icon matSuffix>tag</mat-icon>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Version Name</mat-label>
                <input matInput [(ngModel)]="lockForm.versionName" placeholder="e.g. Adopted Budget 2025/2026">
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Comments</mat-label>
                <textarea matInput [(ngModel)]="lockForm.comments" rows="3" placeholder="Add notes about this policy version..."></textarea>
              </mat-form-field>
            </div>

            <div class="radio-group">
              <label class="radio-group-label">New Council Approved Virement Policy</label>
              <div class="radio-options">
                <label class="radio-opt" [class.selected]="lockForm.isCouncilApprovedPolicy === true">
                  <input type="radio" [(ngModel)]="lockForm.isCouncilApprovedPolicy" [value]="true">
                  <span>Yes</span>
                </label>
                <label class="radio-opt" [class.selected]="lockForm.isCouncilApprovedPolicy === false">
                  <input type="radio" [(ngModel)]="lockForm.isCouncilApprovedPolicy" [value]="false">
                  <span>No</span>
                </label>
              </div>
            </div>

            @if (lockForm.isCouncilApprovedPolicy) {
              <div class="file-upload-section">
                <label class="file-upload-label">Upload Council Approved Virement Policy</label>
                <div class="file-drop-zone" [class.has-file]="lockForm.policyFile">
                  <input type="file" id="policy-file" (change)="onFileSelected($event)" accept=".pdf,.doc,.docx" class="file-input">
                  @if (!lockForm.policyFile) {
                    <label for="policy-file" class="file-drop-content">
                      <mat-icon>upload_file</mat-icon>
                      <span>Click to upload PDF or Word document</span>
                    </label>
                  } @else {
                    <div class="file-selected">
                      <mat-icon>description</mat-icon>
                      <span class="file-name">{{ lockForm.policyFile.name }}</span>
                      <button class="icon-btn small" (click)="clearFile($event)">
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <div class="overlay-footer">
            <button class="btn-outline" (click)="closeLockDialog()" [disabled]="locking">Cancel</button>
            <button class="btn-primary" (click)="lockConfiguration()" [disabled]="locking || !lockForm.versionName">
              @if (locking) {
                <mat-icon class="spin">sync</mat-icon> Locking...
              } @else {
                <mat-icon>lock</mat-icon> Lock Configuration
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; padding: 24px; }

    /* ── Header ── */
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { font-size: 24px; font-weight: 600; color: #0f2b46; margin: 0 0 4px; }
    .subtitle { color: #64748b; font-size: 14px; margin: 0; }
    .header-controls { display: flex; gap: 12px; align-items: center; }
    .fy-field { min-width: 180px; }

    /* ── Buttons ── */
    .btn-primary { display: inline-flex; align-items: center; gap: 6px; padding: 9px 20px; background: #0f2b46; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background .2s; white-space: nowrap; }
    .btn-primary:hover { background: #1a3d5c; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-primary mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .btn-outline { display: inline-flex; align-items: center; gap: 6px; padding: 9px 20px; background: #fff; color: #0f2b46; border: 1.5px solid #d1d5db; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all .2s; white-space: nowrap; }
    .btn-outline:hover { border-color: #0f2b46; background: #f8fafc; }
    .btn-outline:disabled { opacity: .5; cursor: not-allowed; }
    .btn-outline mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .icon-btn { background: none; border: none; padding: 6px; border-radius: 6px; cursor: pointer; color: #64748b; transition: all .2s; display: inline-flex; align-items: center; }
    .icon-btn:hover { background: #f1f5f9; color: #0f2b46; }
    .icon-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .icon-btn.small mat-icon { font-size: 16px; width: 16px; height: 16px; }

    /* ── Loading ── */
    .loading-state { display: flex; align-items: center; gap: 12px; justify-content: center; padding: 60px; color: #64748b; font-size: 16px; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    /* ── Version header card ── */
    .version-header-card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 20px 24px; display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; gap: 16px; }
    .version-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 8px; }
    .version-number { font-size: 17px; font-weight: 700; color: #0f2b46; font-family: 'JetBrains Mono', monospace; }
    .version-name { font-size: 15px; color: #475569; font-weight: 500; }
    .version-comments { font-size: 13px; color: #64748b; margin: 4px 0 6px; }
    .file-ref { display: flex; align-items: center; gap: 4px; font-size: 13px; color: #3b82f6; margin-top: 4px; }
    .file-ref mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .version-actions { flex-shrink: 0; }

    /* ── Status chips ── */
    .status-chip { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-chip.locked { background: #fef3c7; color: #92400e; }
    .status-chip.unlocked { background: #dcfce7; color: #166534; }
    .status-chip.council { background: #e0f2fe; color: #075985; }
    .chip-icon { font-size: 14px !important; width: 14px !important; height: 14px !important; }

    /* ── Draft banner ── */
    .draft-banner { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 16px; }
    .draft-info { display: flex; align-items: flex-start; gap: 12px; color: #0369a1; }
    .draft-info mat-icon { flex-shrink: 0; margin-top: 2px; }
    .draft-info strong { display: block; font-size: 14px; font-weight: 600; margin-bottom: 2px; }
    .draft-info p { margin: 0; font-size: 13px; color: #0c4a6e; }

    /* ── Rules table ── */
    .table-card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .table-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #e2e8f0; }
    .table-header h2 { font-size: 16px; font-weight: 600; color: #0f2b46; margin: 0; display: flex; align-items: center; gap: 10px; }
    .rule-count { background: #e2e8f0; color: #475569; font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 10px; }
    .table-scroll { overflow-x: auto; }
    .rules-table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .rules-table thead th { background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 16px; text-align: left; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
    .rules-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: background .15s; }
    .rules-table tbody tr:hover { background: #f8fafc; }
    .rules-table tbody tr:last-child { border-bottom: none; }
    .rules-table td { padding: 12px 16px; vertical-align: top; color: #1e293b; line-height: 1.5; }
    .col-option { width: 80px; text-align: center; }
    .col-principle { width: 220px; font-weight: 500; }
    .col-rule { width: 280px; }
    .col-desc { }

    /* ── Option badge (read-only) ── */
    .option-badge { display: inline-flex; align-items: center; justify-content: center; padding: 3px 12px; border-radius: 12px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .opt-yes { background: #dcfce7; color: #166534; }
    .opt-no { background: #fee2e2; color: #991b1b; }

    /* ── Option toggle (editable) ── */
    .option-toggle { display: inline-flex; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
    .opt-chip { padding: 4px 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border: none; cursor: pointer; background: #f8fafc; color: #94a3b8; transition: all .15s; white-space: nowrap; }
    .opt-chip:first-child { border-right: 1px solid #e2e8f0; }
    .opt-chip.opt-yes { background: #dcfce7; color: #166534; }
    .opt-chip.opt-no { background: #fee2e2; color: #991b1b; }

    /* ── Empty state ── */
    .empty-state { text-align: center; padding: 80px 40px; }
    .empty-icon { font-size: 56px; width: 56px; height: 56px; color: #cbd5e1; margin-bottom: 16px; }
    .empty-state h3 { font-size: 18px; font-weight: 600; color: #0f2b46; margin: 0 0 8px; }
    .empty-state p { color: #64748b; font-size: 14px; margin: 0; }

    /* ── Lock dialog overlay ── */
    .overlay-backdrop { position: fixed; inset: 0; background: rgba(15,43,70,.35); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .overlay-card { background: #fff; border-radius: 16px; width: 100%; max-width: 540px; box-shadow: 0 20px 60px rgba(0,0,0,.25); display: flex; flex-direction: column; max-height: 90vh; overflow: hidden; }
    .overlay-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 20px 24px 16px; border-bottom: 1px solid #e2e8f0; }
    .overlay-header h3 { font-size: 18px; font-weight: 600; color: #0f2b46; margin: 0 0 4px; }
    .overlay-header p { font-size: 13px; color: #64748b; margin: 0; }
    .overlay-body { padding: 20px 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
    .overlay-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid #e2e8f0; }
    .form-row { width: 100%; }
    .form-row .mat-mdc-form-field { width: 100%; }
    .form-row .mat-mdc-form-field-subscript-wrapper { display: none; }

    /* ── Radio group ── */
    .radio-group { margin: 8px 0 4px; }
    .radio-group-label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 10px; }
    .radio-options { display: flex; gap: 12px; }
    .radio-opt { display: flex; align-items: center; gap: 8px; padding: 10px 18px; border: 1.5px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; color: #374151; transition: all .2s; }
    .radio-opt:hover { border-color: #0f2b46; background: #f8fafc; }
    .radio-opt.selected { border-color: #0f2b46; background: #eff6ff; color: #0f2b46; }
    .radio-opt input[type="radio"] { accent-color: #0f2b46; }

    /* ── File upload ── */
    .file-upload-section { margin-top: 8px; }
    .file-upload-label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 8px; }
    .file-drop-zone { border: 2px dashed #d1d5db; border-radius: 10px; overflow: hidden; transition: border-color .2s; }
    .file-drop-zone:hover { border-color: #0f2b46; }
    .file-drop-zone.has-file { border-style: solid; border-color: #0f2b46; background: #f0f9ff; }
    .file-input { display: none; }
    .file-drop-content { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px; cursor: pointer; color: #64748b; }
    .file-drop-content mat-icon { font-size: 32px; width: 32px; height: 32px; color: #94a3b8; }
    .file-drop-content span { font-size: 13px; }
    .file-selected { display: flex; align-items: center; gap: 10px; padding: 12px 16px; }
    .file-selected mat-icon { font-size: 24px; width: 24px; height: 24px; color: #0f2b46; }
    .file-name { flex: 1; font-size: 13px; font-weight: 500; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .mat-mdc-form-field { width: 100%; }
  `]
})
export class VirementPolicyPage implements OnInit {
  financialYears: FinancialYear[] = [];
  selectedFyId: number | null = null;
  selectedFyCode = '';

  versions: any[] = [];
  selectedVersionId: number | null = null;
  selectedVersion: any = null;

  rules: any[] = [];
  loading = false;

  showLockDialog = false;
  locking = false;
  nextVersionNumber = '';

  lockForm = {
    versionName: '',
    comments: '',
    isCouncilApprovedPolicy: false as boolean,
    policyFile: null as File | null
  };

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.api.getFinancialYears().subscribe(fys => {
      this.financialYears = fys;
      const active = fys.find(f => f.isActive);
      if (active) {
        this.selectedFyId = active.id;
        this.selectedFyCode = active.yearCode;
        this.loadVersions();
      }
      this.cdr.markForCheck();
    });
  }

  onFyChange(fyId: number) {
    const fy = this.financialYears.find(f => f.id === fyId);
    this.selectedFyCode = fy?.yearCode ?? '';
    this.versions = [];
    this.selectedVersionId = null;
    this.selectedVersion = null;
    this.rules = [];
    if (this.selectedFyCode) this.loadVersions();
  }

  onVersionChange(versionId: number) {
    const v = this.versions.find(v => v.id === versionId);
    this.selectedVersion = v ?? null;
    if (v) this.loadVersionDetails(v.id);
  }

  loadVersions() {
    if (!this.selectedFyCode) return;
    this.loading = true;
    this.rules = [];
    this.api.getVirementPolicyVersions(this.selectedFyCode).subscribe({
      next: (versions) => {
        this.versions = versions;
        if (versions.length > 0) {
          const latest = versions[0];
          this.selectedVersionId = latest.id;
          this.selectedVersion = latest;
          this.loadVersionDetails(latest.id);
        } else {
          this.loadSysRules();
        }
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  loadVersionDetails(versionId: number) {
    this.loading = true;
    this.rules = [];
    this.api.getVirementPolicyVersionDetails(versionId).subscribe({
      next: (details) => { this.rules = details; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  loadSysRules() {
    this.loading = true;
    this.rules = [];
    this.api.getVirementSysRules(this.selectedFyCode).subscribe({
      next: (rules) => { this.rules = rules; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  openLockDialog() {
    this.api.getVirementNextVersionNumber(this.selectedFyCode).subscribe(r => {
      this.nextVersionNumber = r.versionNumber;
      this.cdr.markForCheck();
    });
    this.resetLockForm();
    this.showLockDialog = true;
  }

  closeLockDialog() {
    if (!this.locking) {
      this.showLockDialog = false;
      this.resetLockForm();
    }
  }

  resetLockForm() {
    this.lockForm = { versionName: '', comments: '', isCouncilApprovedPolicy: false, policyFile: null };
  }

  lockConfiguration() {
    if (!this.selectedFyCode || !this.lockForm.versionName) return;
    this.locking = true;
    const fd = new FormData();
    fd.append('FyCode', this.selectedFyCode);
    fd.append('VersionName', this.lockForm.versionName);
    fd.append('Comments', this.lockForm.comments);
    fd.append('IsCouncilApprovedPolicy', String(this.lockForm.isCouncilApprovedPolicy));
    if (this.lockForm.policyFile) fd.append('PolicyFile', this.lockForm.policyFile);

    this.api.lockVirementPolicyVersion(fd).subscribe({
      next: () => {
        this.locking = false;
        this.showLockDialog = false;
        this.resetLockForm();
        this.loadVersions();
      },
      error: () => { this.locking = false; }
    });
  }

  get isOptionEditable(): boolean {
    if (this.versions.length === 0) return true;
    return !!this.selectedVersion && !this.selectedVersion.isLocked;
  }

  setOption(rule: any, newOption: boolean) {
    if (rule.option === newOption) return;
    rule.option = newOption;
    if (this.versions.length === 0) {
      this.api.updateVirementSysRuleOption(rule.id, newOption).subscribe();
    } else {
      this.api.updateVirementDetailOption(rule.id, newOption).subscribe();
    }
  }

  unlockVersion() {
    if (!this.selectedVersionId) return;
    this.api.unlockVirementPolicyVersion(this.selectedVersionId).subscribe(() => this.loadVersions());
  }

  relockVersion() {
    if (!this.selectedVersionId) return;
    this.api.relockVirementPolicyVersion(this.selectedVersionId).subscribe(() => this.loadVersions());
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.lockForm.policyFile = input.files?.[0] ?? null;
  }

  clearFile(event: Event) {
    event.stopPropagation();
    this.lockForm.policyFile = null;
    const input = document.getElementById('policy-file') as HTMLInputElement;
    if (input) input.value = '';
  }
}
