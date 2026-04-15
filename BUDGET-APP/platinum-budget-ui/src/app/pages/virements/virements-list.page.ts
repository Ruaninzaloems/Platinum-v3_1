import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatStepperModule } from '@angular/material/stepper';
import { ApiService } from '../../services/api.service';
import { BudgetVersionSummary, ScoaSegment } from '../../models/budget.models';

@Component({
  selector: 'app-virements-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatSelectModule, MatFormFieldModule, MatInputModule, MatRadioModule, MatStepperModule],
  templateUrl: './virements-list.page.html',
  styleUrl: './virements-list.page.scss'
})
export class VirementsListPage implements OnInit {
  virements: any[] = [];
  versions: BudgetVersionSummary[] = [];
  filterStatus = '';
  showCreateDialog = false;
  showDetailDialog = false;
  selectedVirement: any = null;
  approvalChain: any = null;
  createStep = 0;

  scoaItems: ScoaSegment[] = [];
  scoaFunds: ScoaSegment[] = [];
  scoaFunctions: ScoaSegment[] = [];
  scoaProjects: ScoaSegment[] = [];
  scoaRegions: ScoaSegment[] = [];
  scoaCostings: ScoaSegment[] = [];
  scoaMscs: ScoaSegment[] = [];

  newVirement: any = {
    budgetVersionId: null, budgetType: 'Operational', amount: 0, motivation: '',
    fromScoaItemId: null, fromScoaFundId: null, fromScoaFunctionId: null,
    fromScoaProjectId: null, fromScoaRegionId: null, fromScoaCostingId: null, fromScoaMscId: null,
    toScoaItemId: null, toScoaFundId: null, toScoaFunctionId: null,
    toScoaProjectId: null, toScoaRegionId: null, toScoaCostingId: null, toScoaMscId: null,
  };

  fromBudgetSummary: any = null;
  toBudgetSummary: any = null;
  policyValidation: any = null;
  approvalComment = '';
  rejectComment = '';
  showRejectDialog = false;
  rejectingVirement: any = null;

  get pendingCount() { return this.virements.filter(v => !['Posted','Rejected','Draft'].includes(v.status)).length; }
  get approvedCount() { return this.virements.filter(v => v.status === 'Posted').length; }
  get rejectedCount() { return this.virements.filter(v => v.status === 'Rejected').length; }
  get draftCount() { return this.virements.filter(v => v.status === 'Draft').length; }
  get totalAmount() { return this.virements.filter(v => v.status === 'Posted').reduce((s: number, v: any) => s + v.amount, 0); }

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadVirements();
    this.api.getBudgetVersions().subscribe(v => this.versions = v);
    this.api.getScoaItems().subscribe(d => this.scoaItems = d);
    this.api.getScoaFunds().subscribe(d => this.scoaFunds = d);
    this.api.getScoaFunctions().subscribe(d => this.scoaFunctions = d);
    this.api.getScoaProjects().subscribe(d => this.scoaProjects = d);
    this.api.getScoaRegions().subscribe(d => this.scoaRegions = d);
    this.api.getScoaCostings().subscribe(d => this.scoaCostings = d);
    this.api.getScoaMscs().subscribe(d => this.scoaMscs = d);
  }

  loadVirements() {
    this.api.getVirements(undefined, this.filterStatus || undefined).subscribe(v => this.virements = v);
  }

  formatCurrency(v: number): string {
    if (!v) return 'R 0';
    return 'R ' + v.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  getStatusLabel(status: string): string {
    const map: any = {
      'Draft': 'Draft', 'Submitted': 'Submitted', 'DeptHeadApproved': 'Dept Head Approved',
      'BudgetOfficeApproved': 'Budget Office Approved', 'CFOApproved': 'CFO Approved',
      'MMApproved': 'MM Approved', 'CouncilApproved': 'Council Approved',
      'Approved': 'Approved', 'Rejected': 'Rejected', 'Posted': 'Posted', 'Returned': 'Returned'
    };
    return map[status] || status;
  }

  getApprovalLevelLabel(level: number): string {
    const map: any = { 1: 'Department Head', 2: 'Budget Office', 3: 'CFO', 4: 'Municipal Manager', 5: 'Council' };
    return map[level] || `Level ${level}`;
  }

  openCreateDialog() {
    this.showCreateDialog = true;
    this.createStep = 0;
    this.fromBudgetSummary = null;
    this.toBudgetSummary = null;
    this.policyValidation = null;
    this.newVirement = {
      budgetVersionId: this.versions.length > 0 ? this.versions[0].id : null,
      budgetType: 'Operational', amount: 0, motivation: '',
      fromScoaItemId: null, fromScoaFundId: null, fromScoaFunctionId: null,
      fromScoaProjectId: null, fromScoaRegionId: null, fromScoaCostingId: null, fromScoaMscId: null,
      toScoaItemId: null, toScoaFundId: null, toScoaFunctionId: null,
      toScoaProjectId: null, toScoaRegionId: null, toScoaCostingId: null, toScoaMscId: null,
    };
  }

  loadFromBudget() {
    const v = this.newVirement;
    if (v.budgetVersionId && v.fromScoaItemId && v.fromScoaFundId && v.fromScoaFunctionId && v.fromScoaProjectId && v.fromScoaRegionId && v.fromScoaCostingId && v.fromScoaMscId) {
      this.api.getBudgetSummary(v.budgetVersionId, v.fromScoaItemId, v.fromScoaFundId, v.fromScoaFunctionId, v.fromScoaProjectId, v.fromScoaRegionId, v.fromScoaCostingId, v.fromScoaMscId)
        .subscribe(s => this.fromBudgetSummary = s);
    }
  }

  loadToBudget() {
    const v = this.newVirement;
    if (v.budgetVersionId && v.toScoaItemId && v.toScoaFundId && v.toScoaFunctionId && v.toScoaProjectId && v.toScoaRegionId && v.toScoaCostingId && v.toScoaMscId) {
      this.api.getBudgetSummary(v.budgetVersionId, v.toScoaItemId, v.toScoaFundId, v.toScoaFunctionId, v.toScoaProjectId, v.toScoaRegionId, v.toScoaCostingId, v.toScoaMscId)
        .subscribe(s => this.toBudgetSummary = s);
    }
  }

  validatePolicy() {
    this.api.validateVirement(this.newVirement).subscribe(r => this.policyValidation = r);
  }

  nextStep() {
    if (this.createStep === 0) {
      this.loadFromBudget();
      this.loadToBudget();
    }
    if (this.createStep === 1) {
      this.validatePolicy();
    }
    this.createStep = Math.min(3, this.createStep + 1);
  }

  prevStep() { this.createStep = Math.max(0, this.createStep - 1); }

  createVirement() {
    this.api.createVirement(this.newVirement).subscribe(() => {
      this.showCreateDialog = false;
      this.loadVirements();
    });
  }

  viewDetail(v: any) {
    this.api.getVirementDetail(v.id).subscribe(detail => {
      this.selectedVirement = detail;
      this.showDetailDialog = true;
    });
    this.api.getVirementApprovalChain(v.id).subscribe(chain => {
      this.approvalChain = chain;
    });
  }

  submitVirement(v: any) {
    this.api.submitVirement(v.id, { userId: 'user', userName: 'Budget Officer', comment: 'Submitted for approval' }).subscribe(() => this.loadVirements());
  }

  approveVirement(v: any) {
    const level = v.currentApprovalLevel || 1;
    const userName = this.getApprovalLevelLabel(level);
    this.api.approveVirement(v.id, { userId: 'approver', userName, comment: this.approvalComment || `Approved by ${userName}` }).subscribe(() => {
      this.approvalComment = '';
      this.loadVirements();
      if (this.showDetailDialog && this.selectedVirement?.id === v.id) {
        this.viewDetail(v);
      }
    });
  }

  openRejectDialog(v: any) {
    this.rejectingVirement = v;
    this.rejectComment = '';
    this.showRejectDialog = true;
  }

  confirmReject() {
    if (!this.rejectingVirement) return;
    const level = this.rejectingVirement.currentApprovalLevel || 1;
    this.api.rejectVirement(this.rejectingVirement.id, {
      userId: 'approver', userName: this.getApprovalLevelLabel(level), comment: this.rejectComment
    }).subscribe(() => {
      this.showRejectDialog = false;
      this.rejectingVirement = null;
      this.loadVirements();
      if (this.showDetailDialog) this.showDetailDialog = false;
    });
  }

  getSegmentDesc(id: number, list: ScoaSegment[]): string {
    const s = list.find(x => x.id === id);
    return s ? `${s.code} - ${s.description}` : '';
  }

  canApprove(v: any): boolean {
    return v.status !== 'Draft' && v.status !== 'Rejected' && v.status !== 'Posted' && v.status !== 'Approved';
  }
}
