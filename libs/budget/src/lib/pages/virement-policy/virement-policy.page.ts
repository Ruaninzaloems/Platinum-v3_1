import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ApiService } from '../../core/services/api.service';
import { FinancialYear } from '../../core/models/budget.models';

@Component({
  selector: 'app-virement-policy',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatSelectModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Virement Policy</h1>
        <p class="subtitle">Configure virement validation rules and thresholds per financial year</p>
      </div>
      <div class="header-actions">
        <mat-form-field appearance="outline" class="fy-select">
          <mat-label>Financial Year</mat-label>
          <mat-select [(ngModel)]="selectedFyId" (selectionChange)="loadPolicy()">
            @for (fy of financialYears; track fy.id) {
              <mat-option [value]="fy.id">{{ fy.yearCode }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        @if (!policy) {
          <button class="btn-primary" (click)="createPolicy()" [disabled]="!selectedFyId">
            <mat-icon>add</mat-icon> Create Policy
          </button>
        }
      </div>
    </div>

    @if (loading) {
      <div class="loading-state">
        <mat-icon class="spin">sync</mat-icon>
        <span>Loading policy...</span>
      </div>
    }

    @if (!loading && policy) {
      <div class="policy-header-card">
        <div class="policy-info">
          <div class="policy-meta">
            <span class="policy-version">{{ policy.policyVersion }}</span>
            <span class="status-badge" [class.active]="policy.isActive" [class.inactive]="!policy.isActive">
              {{ policy.isActive ? 'Active' : 'Inactive' }}
            </span>
            @if (policy.isLocked) {
              <span class="status-badge locked">
                <mat-icon class="badge-icon">lock</mat-icon> Locked
              </span>
            }
          </div>
          <div class="policy-detail-row">
            <span class="detail-label">Financial Year:</span>
            <span>{{ policy.financialYear }}</span>
          </div>
          @if (policy.lockedBy) {
            <div class="policy-detail-row">
              <span class="detail-label">Locked by:</span>
              <span>{{ policy.lockedBy }} on {{ policy.lockedOn | date:'medium' }}</span>
            </div>
          }
        </div>
        <div class="policy-actions">
          @if (!policy.isLocked) {
            <button class="btn-outline" (click)="lockPolicy()">
              <mat-icon>lock</mat-icon> Lock Policy
            </button>
            <button class="btn-primary" (click)="showAddRule = true">
              <mat-icon>add</mat-icon> Add Rule
            </button>
          } @else {
            <button class="btn-outline" (click)="unlockPolicy()">
              <mat-icon>lock_open</mat-icon> Unlock Policy
            </button>
          }
        </div>
      </div>

      @if (showAddRule) {
        <div class="card rule-form-card">
          <h3>Add New Rule</h3>
          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Principle</mat-label>
              <input matInput [(ngModel)]="newRule.principle" placeholder="e.g. SCOA Function">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Severity</mat-label>
              <mat-select [(ngModel)]="newRule.severity">
                <mat-option value="Error">Error (Block)</mat-option>
                <mat-option value="Warning">Warning</mat-option>
                <mat-option value="Info">Info</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="span-2">
              <mat-label>Description</mat-label>
              <textarea matInput [(ngModel)]="newRule.description" rows="2"></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline" class="span-2">
              <mat-label>Validation Rule</mat-label>
              <input matInput [(ngModel)]="newRule.validationRule">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Segment Type</mat-label>
              <mat-select [(ngModel)]="newRule.segmentType">
                <mat-option [value]="null">None (Amount-based)</mat-option>
                <mat-option value="Item">Item</mat-option>
                <mat-option value="Fund">Fund</mat-option>
                <mat-option value="Function">Function</mat-option>
                <mat-option value="Project">Project</mat-option>
                <mat-option value="Region">Region</mat-option>
                <mat-option value="Costing">Costing</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>From Segment Filter</mat-label>
              <input matInput [(ngModel)]="newRule.fromSegmentFilter" placeholder="e.g. 7000,8000">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>To Segment Filter</mat-label>
              <input matInput [(ngModel)]="newRule.toSegmentFilter" placeholder="e.g. 3000,4000">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Threshold %</mat-label>
              <input matInput type="number" [(ngModel)]="newRule.thresholdPercent">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Max Amount (R)</mat-label>
              <input matInput type="number" [(ngModel)]="newRule.maxAmount">
            </mat-form-field>
            <div class="toggle-row">
              <mat-slide-toggle [(ngModel)]="newRule.requiresCouncilApproval">Requires Council Approval</mat-slide-toggle>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn-outline" (click)="showAddRule = false">Cancel</button>
            <button class="btn-primary" (click)="addRule()">
              <mat-icon>add</mat-icon> Add Rule
            </button>
          </div>
        </div>
      }

      <div class="rules-section">
        <h2>Policy Rules ({{ policy.rules?.length || 0 }})</h2>
        @for (rule of policy.rules; track rule.id) {
          <div class="rule-card" [class.disabled-rule]="!rule.isEnabled">
            <div class="rule-header">
              <div class="rule-left">
                <span class="rule-order">#{{ rule.sortOrder }}</span>
                <span class="severity-badge" [class]="'severity-' + rule.severity.toLowerCase()">{{ rule.severity }}</span>
                <span class="rule-principle">{{ rule.principle }}</span>
              </div>
              <div class="rule-right">
                @if (!policy.isLocked) {
                  <mat-slide-toggle [checked]="rule.isEnabled" (change)="toggleRule(rule)" class="rule-toggle"></mat-slide-toggle>
                  <button class="icon-btn" (click)="editingRuleId = editingRuleId === rule.id ? null : rule.id" title="Edit">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button class="icon-btn danger" (click)="deleteRule(rule.id)" title="Delete">
                    <mat-icon>delete</mat-icon>
                  </button>
                } @else {
                  @if (rule.isEnabled) {
                    <span class="enabled-indicator">Enabled</span>
                  } @else {
                    <span class="disabled-indicator">Disabled</span>
                  }
                }
              </div>
            </div>
            <div class="rule-body">
              <p class="rule-validation">{{ rule.validationRule }}</p>
              <p class="rule-description">{{ rule.description }}</p>
              <div class="rule-tags">
                @if (rule.segmentType) {
                  <span class="tag">Segment: {{ rule.segmentType }}</span>
                }
                @if (rule.fromSegmentFilter) {
                  <span class="tag">From: {{ rule.fromSegmentFilter }}</span>
                }
                @if (rule.toSegmentFilter) {
                  <span class="tag">To: {{ rule.toSegmentFilter }}</span>
                }
                @if (rule.thresholdPercent) {
                  <span class="tag threshold">Threshold: {{ rule.thresholdPercent }}%</span>
                }
                @if (rule.maxAmount) {
                  <span class="tag amount">Max: R {{ rule.maxAmount | number:'1.0-0' }}</span>
                }
                @if (rule.requiresCouncilApproval) {
                  <span class="tag council">Council Approval</span>
                }
              </div>
            </div>

            @if (editingRuleId === rule.id) {
              <div class="rule-edit-form">
                <div class="form-grid">
                  <mat-form-field appearance="outline">
                    <mat-label>Principle</mat-label>
                    <input matInput [(ngModel)]="rule.principle">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Severity</mat-label>
                    <mat-select [(ngModel)]="rule.severity">
                      <mat-option value="Error">Error</mat-option>
                      <mat-option value="Warning">Warning</mat-option>
                      <mat-option value="Info">Info</mat-option>
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="span-2">
                    <mat-label>Validation Rule</mat-label>
                    <input matInput [(ngModel)]="rule.validationRule">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Threshold %</mat-label>
                    <input matInput type="number" [(ngModel)]="rule.thresholdPercent">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Max Amount (R)</mat-label>
                    <input matInput type="number" [(ngModel)]="rule.maxAmount">
                  </mat-form-field>
                </div>
                <div class="form-actions">
                  <button class="btn-outline" (click)="editingRuleId = null">Cancel</button>
                  <button class="btn-primary" (click)="saveRule(rule)">
                    <mat-icon>save</mat-icon> Save Changes
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    }

    @if (!loading && !policy && selectedFyId) {
      <div class="empty-state">
        <mat-icon class="empty-icon">policy</mat-icon>
        <h3>No Virement Policy</h3>
        <p>No virement policy exists for the selected financial year. Create one to define validation rules for budget transfers.</p>
        <button class="btn-primary" (click)="createPolicy()">
          <mat-icon>add</mat-icon> Create Policy
        </button>
      </div>
    }
  `,
  styles: [`
    :host { display: block; padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { font-size: 24px; font-weight: 600; color: #0f2b46; margin: 0 0 4px 0; }
    .subtitle { color: #64748b; font-size: 14px; margin: 0; }
    .header-actions { display: flex; gap: 12px; align-items: center; }
    .fy-select { width: 180px; }
    .fy-select .mat-mdc-form-field-subscript-wrapper { display: none; }

    .btn-primary { display: inline-flex; align-items: center; gap: 6px; padding: 8px 20px; background: #0f2b46; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.2s; }
    .btn-primary:hover { background: #1a3d5c; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .btn-outline { display: inline-flex; align-items: center; gap: 6px; padding: 8px 20px; background: white; color: #0f2b46; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
    .btn-outline:hover { border-color: #0f2b46; background: #f8fafc; }
    .btn-outline mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .loading-state { display: flex; align-items: center; gap: 12px; justify-content: center; padding: 60px; color: #64748b; font-size: 16px; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    .policy-header-card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .policy-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .policy-version { font-size: 18px; font-weight: 600; color: #0f2b46; font-family: 'JetBrains Mono', monospace; }
    .status-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .status-badge.active { background: #dcfce7; color: #166534; }
    .status-badge.inactive { background: #f1f5f9; color: #64748b; }
    .status-badge.locked { background: #fef3c7; color: #92400e; }
    .badge-icon { font-size: 14px; width: 14px; height: 14px; }
    .policy-detail-row { font-size: 13px; color: #475569; margin-bottom: 4px; }
    .detail-label { font-weight: 600; margin-right: 6px; }
    .policy-actions { display: flex; gap: 10px; }

    .card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 20px 24px; margin-bottom: 24px; }
    .rule-form-card h3 { font-size: 16px; font-weight: 600; color: #0f2b46; margin: 0 0 16px 0; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; }
    .form-grid .span-2 { grid-column: span 2; }
    .toggle-row { display: flex; align-items: center; padding: 8px 0; }
    .form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0; }

    .rules-section h2 { font-size: 18px; font-weight: 600; color: #0f2b46; margin: 0 0 16px 0; }

    .rule-card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px 20px; margin-bottom: 12px; transition: all 0.2s; }
    .rule-card:hover { border-color: #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .rule-card.disabled-rule { opacity: 0.55; }
    .rule-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .rule-left { display: flex; align-items: center; gap: 10px; }
    .rule-order { font-size: 13px; font-weight: 700; color: #94a3b8; font-family: 'JetBrains Mono', monospace; min-width: 28px; }
    .rule-principle { font-size: 15px; font-weight: 600; color: #0f2b46; }
    .rule-right { display: flex; align-items: center; gap: 8px; }
    .rule-toggle { transform: scale(0.85); }

    .severity-badge { padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .severity-error { background: #fee2e2; color: #991b1b; }
    .severity-warning { background: #fef3c7; color: #92400e; }
    .severity-info { background: #e0f2fe; color: #075985; }

    .rule-body { padding-left: 38px; }
    .rule-validation { font-size: 14px; color: #1e293b; font-weight: 500; margin: 0 0 4px 0; }
    .rule-description { font-size: 13px; color: #64748b; margin: 0 0 10px 0; line-height: 1.5; }
    .rule-tags { display: flex; flex-wrap: wrap; gap: 6px; }
    .tag { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; background: #e3f2fd; color: #1565c0; font-family: 'JetBrains Mono', monospace; }
    .tag.threshold { background: #fef3c7; color: #92400e; }
    .tag.amount { background: #f0fdf4; color: #166534; }
    .tag.council { background: #fae8ff; color: #86198f; }

    .icon-btn { background: none; border: none; padding: 6px; border-radius: 6px; cursor: pointer; color: #64748b; transition: all 0.2s; display: inline-flex; align-items: center; }
    .icon-btn:hover { background: #f1f5f9; color: #0f2b46; }
    .icon-btn.danger:hover { background: #fee2e2; color: #991b1b; }
    .icon-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .enabled-indicator { font-size: 12px; font-weight: 600; color: #16a34a; }
    .disabled-indicator { font-size: 12px; font-weight: 600; color: #94a3b8; }

    .rule-edit-form { margin-top: 16px; padding-top: 16px; border-top: 1px dashed #e2e8f0; }

    .empty-state { text-align: center; padding: 80px 40px; }
    .empty-icon { font-size: 64px; width: 64px; height: 64px; color: #cbd5e1; margin-bottom: 16px; }
    .empty-state h3 { font-size: 20px; font-weight: 600; color: #0f2b46; margin: 0 0 8px 0; }
    .empty-state p { color: #64748b; font-size: 14px; margin: 0 0 24px 0; max-width: 480px; margin-left: auto; margin-right: auto; }

    .mat-mdc-form-field { width: 100%; }
  `]
})
export class VirementPolicyPage implements OnInit {
  financialYears: FinancialYear[] = [];
  selectedFyId: number | null = null;
  policy: any = null;
  loading = false;
  showAddRule = false;
  editingRuleId: number | null = null;
  newRule: any = {
    principle: '', description: '', validationRule: '', severity: 'Error',
    segmentType: null, fromSegmentFilter: '', toSegmentFilter: '',
    thresholdPercent: null, maxAmount: null, requiresCouncilApproval: false
  };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getFinancialYears().subscribe(fys => {
      this.financialYears = fys;
      const active = fys.find(f => f.isActive);
      if (active) {
        this.selectedFyId = active.id;
        this.loadPolicy();
      }
    });
  }

  loadPolicy() {
    if (!this.selectedFyId) return;
    this.loading = true;
    this.policy = null;
    this.api.getActiveVirementPolicy(this.selectedFyId).subscribe({
      next: (p) => { this.policy = p; this.loading = false; },
      error: () => { this.policy = null; this.loading = false; }
    });
  }

  createPolicy() {
    if (!this.selectedFyId) return;
    this.api.createVirementPolicy({ financialYearId: this.selectedFyId }).subscribe(() => {
      this.loadPolicy();
    });
  }

  lockPolicy() {
    if (!this.policy) return;
    this.api.lockVirementPolicy(this.policy.id).subscribe(() => this.loadPolicy());
  }

  unlockPolicy() {
    if (!this.policy) return;
    this.api.unlockVirementPolicy(this.policy.id).subscribe(() => this.loadPolicy());
  }

  addRule() {
    if (!this.policy) return;
    this.api.addVirementPolicyRule(this.policy.id, {
      ...this.newRule,
      virementPolicyId: this.policy.id
    }).subscribe(() => {
      this.showAddRule = false;
      this.newRule = {
        principle: '', description: '', validationRule: '', severity: 'Error',
        segmentType: null, fromSegmentFilter: '', toSegmentFilter: '',
        thresholdPercent: null, maxAmount: null, requiresCouncilApproval: false
      };
      this.loadPolicy();
    });
  }

  toggleRule(rule: any) {
    rule.isEnabled = !rule.isEnabled;
    this.api.updateVirementPolicyRule(rule.id, rule).subscribe();
  }

  saveRule(rule: any) {
    this.api.updateVirementPolicyRule(rule.id, rule).subscribe(() => {
      this.editingRuleId = null;
      this.loadPolicy();
    });
  }

  deleteRule(ruleId: number) {
    this.api.deleteVirementPolicyRule(ruleId).subscribe(() => this.loadPolicy());
  }
}
