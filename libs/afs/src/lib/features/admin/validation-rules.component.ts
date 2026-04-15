import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatExpansionModule } from '@angular/material/expansion';
import { ApiService } from '../../core/services/api.service';

interface ValidationRule {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description: string;
  category: string;
  ruleType: string;
  severity: string;
  parameters: Record<string, any>;
  expression: string;
  appliesTo: string[];
  isActive: boolean;
  isSystemRule: boolean;
  sortOrder: number;
  lastRunAt: string | null;
  lastResult: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

interface ValidationRuleResult {
  id: string;
  ruleId: string;
  tenantId: string;
  financialYearId: string;
  period: number | null;
  status: string;
  message: string;
  details: Record<string, any> | null;
  runAt: string;
  rule?: ValidationRule;
}

interface RuleSummary {
  total: number;
  pass: number;
  fail: number;
  warning: number;
  skipped: number;
  bySeverity: Record<string, number>;
}

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'data_integrity', label: 'Data Integrity' },
  { value: 'nt_s71', label: 'NT S71' },
  { value: 'nt_s72', label: 'NT S72' },
  { value: 'mscoa_compliance', label: 'mSCOA Compliance' },
  { value: 'gl_classification', label: 'GL Classification' },
  { value: 'submission_readiness', label: 'Submission Readiness' },
];

const RULE_TYPES = [
  { value: 'threshold', label: 'Threshold' },
  { value: 'balance_check', label: 'Balance Check' },
  { value: 'completeness', label: 'Completeness' },
  { value: 'cross_reference', label: 'Cross Reference' },
  { value: 'classification', label: 'Classification' },
  { value: 'formula', label: 'Formula' },
];

const SEVERITIES = [
  { value: 'critical', label: 'Critical' },
  { value: 'error', label: 'Error' },
  { value: 'warning', label: 'Warning' },
  { value: 'info', label: 'Info' },
];

const CONTEXTS = [
  { value: 'all', label: 'All' },
  { value: 's71_submission', label: 'S71 Submission' },
  { value: 's72_submission', label: 'S72 Submission' },
  { value: 'compilation', label: 'Compilation' },
  { value: 'string_generation', label: 'String Generation' },
  { value: 'gl_sync', label: 'GL Sync' },
  { value: 'data_integrity', label: 'Data Integrity' },
];

@Component({
  selector: 'app-validation-rules',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatMenuModule,
    MatBadgeModule,
    MatExpansionModule,
  ],
  templateUrl: './validation-rules.component.html',
  styleUrl: './validation-rules.component.css',
})
export class ValidationRulesComponent implements OnInit {
  private api = inject(ApiService);

  rules = signal<ValidationRule[]>([]);
  financialYears = signal<any[]>([]);
  showCreateForm = signal(false);
  editingRule = signal<ValidationRule | null>(null);
  saving = signal(false);
  running = signal(false);
  runResults = signal<ValidationRuleResult[]>([]);
  historyRule = signal<ValidationRule | null>(null);
  historyResults = signal<ValidationRuleResult[]>([]);
  expandedResults = signal<Set<string>>(new Set());

  categories = CATEGORIES;
  ruleTypes = RULE_TYPES;
  severities = SEVERITIES;
  contexts = CONTEXTS;
  months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  filterCategory = '';
  filterSeverity = '';
  filterActive = '';
  filterType = '';
  searchTerm = '';

  runFinancialYearId = '';
  runContext = '';
  runPeriod: number | null = null;

  formRule = this.emptyFormRule();
  formParametersJson = '{}';

  activeCount = computed(() => this.rules().filter(r => r.isActive).length);
  systemCount = computed(() => this.rules().filter(r => r.isSystemRule).length);
  customCount = computed(() => this.rules().filter(r => !r.isSystemRule).length);

  filteredRules = computed(() => {
    let result = this.rules();
    if (this.filterCategory) {
      result = result.filter(r => r.category === this.filterCategory);
    }
    if (this.filterSeverity) {
      result = result.filter(r => r.severity === this.filterSeverity);
    }
    if (this.filterActive) {
      const active = this.filterActive === 'true';
      result = result.filter(r => r.isActive === active);
    }
    if (this.filterType) {
      result = result.filter(r => r.ruleType === this.filterType);
    }
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(r =>
        r.code.toLowerCase().includes(term) ||
        r.name.toLowerCase().includes(term) ||
        (r.description && r.description.toLowerCase().includes(term))
      );
    }
    return result;
  });

  runResultCounts = computed(() => {
    const results = this.runResults();
    return {
      pass: results.filter(r => r.status === 'pass').length,
      fail: results.filter(r => r.status === 'fail').length,
      warning: results.filter(r => r.status === 'warning').length,
      skipped: results.filter(r => r.status === 'skipped').length,
    };
  });

  ngOnInit() {
    this.loadRules();
    this.loadFinancialYears();
  }

  loadRules() {
    this.api.get<ValidationRule[]>('/validation-rules').subscribe({
      next: (data) => this.rules.set(data || []),
    });
  }

  loadFinancialYears() {
    this.api.get<any[]>('/admin/financial-years').subscribe({
      next: (data) => {
        this.financialYears.set(data || []);
        const current = data?.find((fy: any) => fy.isCurrent);
        if (current && !this.runFinancialYearId) {
          this.runFinancialYearId = current.id;
        }
      },
    });
  }

  getCategoryCount(category: string): number {
    return this.rules().filter(r => r.category === category).length;
  }

  formatCategory(cat: string): string {
    const found = CATEGORIES.find(c => c.value === cat);
    return found ? found.label : cat;
  }

  applyFilters() {
    this.rules.update(r => [...r]);
  }

  toggleActive(rule: ValidationRule) {
    this.api.post<ValidationRule>(`/validation-rules/${rule.id}/toggle`).subscribe({
      next: (updated) => {
        this.rules.update(rules => rules.map(r => r.id === updated.id ? updated : r));
      },
    });
  }

  openCreateForm() {
    this.editingRule.set(null);
    this.formRule = this.emptyFormRule();
    this.formParametersJson = '{}';
    this.showCreateForm.set(true);
  }

  editRule(rule: ValidationRule) {
    this.editingRule.set(rule);
    this.formRule = {
      code: rule.code,
      name: rule.name,
      description: rule.description || '',
      category: rule.category,
      ruleType: rule.ruleType,
      severity: rule.severity,
      expression: rule.expression || '',
      appliesTo: [...(rule.appliesTo || [])],
      parameters: rule.parameters || {},
    };
    this.formParametersJson = JSON.stringify(rule.parameters || {}, null, 2);
    this.showCreateForm.set(true);
  }

  cancelForm() {
    this.showCreateForm.set(false);
    this.editingRule.set(null);
    this.formRule = this.emptyFormRule();
    this.formParametersJson = '{}';
  }

  saveRule() {
    this.saving.set(true);
    let params: Record<string, any> = {};
    try {
      params = JSON.parse(this.formParametersJson || '{}');
    } catch {
      params = {};
    }

    const body: any = {
      ...this.formRule,
      parameters: params,
    };

    const editing = this.editingRule();
    if (editing) {
      if (editing.isSystemRule) {
        const systemBody = {
          parameters: params,
          severity: this.formRule.severity,
          isActive: editing.isActive,
        };
        this.api.put<ValidationRule>(`/validation-rules/${editing.id}`, systemBody).subscribe({
          next: (updated) => {
            this.rules.update(rules => rules.map(r => r.id === updated.id ? updated : r));
            this.saving.set(false);
            this.cancelForm();
          },
          error: () => this.saving.set(false),
        });
      } else {
        this.api.put<ValidationRule>(`/validation-rules/${editing.id}`, body).subscribe({
          next: (updated) => {
            this.rules.update(rules => rules.map(r => r.id === updated.id ? updated : r));
            this.saving.set(false);
            this.cancelForm();
          },
          error: () => this.saving.set(false),
        });
      }
    } else {
      this.api.post<ValidationRule>('/validation-rules', body).subscribe({
        next: (created) => {
          this.rules.update(rules => [...rules, created]);
          this.saving.set(false);
          this.cancelForm();
        },
        error: () => this.saving.set(false),
      });
    }
  }

  deleteRule(rule: ValidationRule) {
    if (rule.isSystemRule) return;
    if (!confirm(`Delete rule "${rule.name}"? This action cannot be undone.`)) return;
    this.api.delete(`/validation-rules/${rule.id}`).subscribe({
      next: () => {
        this.rules.update(rules => rules.filter(r => r.id !== rule.id));
      },
    });
  }

  runRules() {
    this.running.set(true);
    this.runResults.set([]);
    this.api.post<ValidationRuleResult[]>('/validation-rules/run', {
      financialYearId: this.runFinancialYearId,
      context: this.runContext,
      period: this.runPeriod,
    }).subscribe({
      next: (results) => {
        this.runResults.set(results || []);
        this.running.set(false);
        this.loadRules();
      },
      error: () => this.running.set(false),
    });
  }

  viewHistory(rule: ValidationRule) {
    this.historyRule.set(rule);
    if (this.runFinancialYearId) {
      this.api.get<ValidationRuleResult[]>('/validation-rules/results', {
        financialYearId: this.runFinancialYearId,
        ruleId: rule.id,
      }).subscribe({
        next: (results) => this.historyResults.set(results || []),
      });
    } else if (this.financialYears().length > 0) {
      const fy = this.financialYears().find((f: any) => f.isCurrent) || this.financialYears()[0];
      this.api.get<ValidationRuleResult[]>('/validation-rules/results', {
        financialYearId: fy.id,
        ruleId: rule.id,
      }).subscribe({
        next: (results) => this.historyResults.set(results || []),
      });
    }
  }

  toggleResultExpand(id: string) {
    this.expandedResults.update(set => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  toggleAppliesTo(ctx: string) {
    const idx = this.formRule.appliesTo.indexOf(ctx);
    if (idx >= 0) {
      this.formRule.appliesTo.splice(idx, 1);
    } else {
      this.formRule.appliesTo.push(ctx);
    }
  }

  private emptyFormRule() {
    return {
      code: '',
      name: '',
      description: '',
      category: 'data_integrity',
      ruleType: 'threshold',
      severity: 'warning',
      expression: '',
      appliesTo: [] as string[],
      parameters: {} as Record<string, any>,
    };
  }
}
