import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { AfsTemplate, Compilation, DisclosureLineItemNode, DisclosureTreeNode, MappingCoverageReport, MappingRule } from '../../core/models/interfaces';
import { DisclosureTreeComponent } from './disclosure-tree.component';
import { ScoaExplorerComponent } from './scoa-explorer.component';
import { MappingWorkspaceComponent } from './mapping-workspace.component';

interface UnmatchedTbEntry {
  id: string;
  scoaItemCode: string;
  scoaItemDescription: string;
  closingBalance: number;
  priorYear1Balance: number;
  budgetAdjusted: number;
  sortDesc: string;
  scoaFunctionCode?: string;
  scoaFundsCode?: string;
  scoaProjectCode?: string;
  scoaCostingCode?: string;
  voteDescription?: string;
}

interface UnmatchedTbResponse {
  compilationId: string;
  totalTbEntries: number;
  matchedCount: number;
  unmatchedCount: number;
  unmatchedEntries: UnmatchedTbEntry[];
}

interface ValidationReport {
  totalLineItems: number;
  mappedCount: number;
  unmappedCount: number;
  totalMappings: number;
  coveragePercentage: number;
  validationPassed: boolean;
  unapprovedCount: number;
  unmappedLineItems: Array<{ id: string; label: string; code: string; sectionTitle: string }>;
  duplicateMappings: Array<{ accountCode: string; count: number }>;
  checks: Array<{ name: string; passed: boolean; message: string }>;
}

interface AutoSuggestResult {
  suggestions: AutoSuggestion[];
  totalFound: number;
  message: string;
}

interface AutoSuggestion {
  id: string;
  lineItemId: string;
  lineItemLabel: string;
  lineItemCode: string;
  scoaAccountNumber: string;
  scoaDescription: string;
  scoaSegment: string;
  confidence: number;
  reason: string;
  selected?: boolean;
}

@Component({
  selector: 'app-mappings',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatSelectModule, MatInputModule, MatChipsModule, MatTooltipModule,
    MatProgressSpinnerModule, MatBadgeModule, MatDialogModule, MatCheckboxModule,
    MatMenuModule, MatSnackBarModule, DragDropModule,
    DisclosureTreeComponent, ScoaExplorerComponent, MappingWorkspaceComponent,
  ],
  templateUrl: './mappings.component.html',
  styleUrl: './mappings.component.css',
})
export class MappingsComponent implements OnInit, OnDestroy {
  templates: AfsTemplate[] = [];
  selectedTemplateId = '';
  workflowFilter = '';
  tenantId = '';
  coverage: MappingCoverageReport | null = null;
  mappedAccountCodes = new Set<string>();

  @ViewChild(MappingWorkspaceComponent) workspaceRef!: MappingWorkspaceComponent;
  @ViewChild(DisclosureTreeComponent) disclosureTreeRef!: DisclosureTreeComponent;

  selectedLineItem: DisclosureLineItemNode | null = null;
  selectedSection: DisclosureTreeNode | null = null;

  leftPanelWidth = 320;
  rightPanelWidth = 320;
  centerTopFlex = '1 1 55%';
  centerBottomFlex = '1 1 45%';

  validating = false;
  showValidationOverlay = false;
  validationReport: ValidationReport | null = null;
  validationFilter: string = '';
  unmappedSearchQuery: string = '';

  suggesting = false;
  showSuggestOverlay = false;
  suggestResult: AutoSuggestResult | null = null;
  acceptingSuggestions = false;

  showInactiveItems = false;

  compilations: Compilation[] = [];
  allCompilations: Compilation[] = [];
  selectedCompilationId = '';
  activeCompilation: Compilation | null = null;

  savingMapping = false;
  showCopyPriorOverlay = false;
  copyPriorSourceId = '';
  copyingPrior = false;
  priorCompilations: Compilation[] = [];
  resettingDefault = false;

  showUnmatchedPanel = false;
  unmatchedTbRows: UnmatchedTbEntry[] = [];
  unmatchedTbSummary: { total: number; matched: number; unmatched: number } = { total: 0, matched: 0, unmatched: 0 };
  loadingUnmatched = false;

  cloning = false;
  showCloneOverlay = false;
  cloneName = '';
  isFullscreen = false;

  private route = inject(ActivatedRoute);
  private resizing: 'left' | 'right' | 'center' | null = null;
  private resizeStartX = 0;
  private resizeStartWidth = 0;
  private destroy$ = new Subject<void>();

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.isFullscreen = this.route.snapshot.data['fullscreen'] === true;
    this.loadAllCompilations();
    this.loadTemplates();
    this.bindResizeEvents();
    const qCompId = this.route.snapshot.queryParamMap.get('compilationId');
    if (qCompId) {
      this.loadCompilationById(qCompId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTemplates(): void {
    this.api.get<AfsTemplate[]>('/templates').subscribe({
      next: (data) => { this.templates = data; },
      error: () => {},
    });
  }

  loadAllCompilations(): void {
    this.api.get<Compilation[]>('/compilations').subscribe({
      next: (data) => { this.allCompilations = data; },
      error: () => { this.allCompilations = []; },
    });
  }

  loadCompilationById(compilationId: string): void {
    this.api.get<Compilation>(`/compilations/${compilationId}`).subscribe({
      next: (comp) => {
        this.activeCompilation = comp;
        this.selectedCompilationId = comp.id;
        if (comp.templateId) {
          this.selectedTemplateId = comp.templateId;
          this.loadCoverage();
          this.loadMappedAccounts();
          this.loadUnmatchedTb();
        }
        if (this.workspaceRef) {
          this.workspaceRef.compilationId = comp.id;
        }
      },
      error: () => {
        this.snackBar.open('Failed to load compilation', 'OK', { duration: 4000 });
      },
    });
  }

  onCompilationChange(): void {
    if (this.selectedCompilationId) {
      this.loadCompilationById(this.selectedCompilationId);
    } else {
      this.activeCompilation = null;
      this.selectedTemplateId = '';
      this.unmatchedTbRows = [];
    }
  }

  isSystemDefaultTemplate(): boolean {
    if (!this.selectedTemplateId) return false;
    const t = this.templates.find(tpl => tpl.id === this.selectedTemplateId);
    return !!t?.isSystemDefault;
  }

  formatPeriod(period: string | undefined): string {
    if (!period) return '';
    const [year, month] = period.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const idx = parseInt(month, 10) - 1;
    return idx >= 0 && idx < 12 ? `${monthNames[idx]} ${year}` : period;
  }

  saveMapping(): void {
    if (!this.selectedCompilationId) return;
    this.savingMapping = true;
    this.api.post(`/compilations/${this.selectedCompilationId}/calculate`, {}).subscribe({
      next: () => {
        this.savingMapping = false;
        this.snackBar.open('Compilation recalculated successfully', 'OK', { duration: 3000 });
        this.loadCoverage();
        this.loadUnmatchedTb();
      },
      error: () => {
        this.savingMapping = false;
        this.snackBar.open('Calculation failed', 'OK', { duration: 4000 });
      },
    });
  }

  executeCopyPrior(): void {
    if (!this.selectedCompilationId || !this.copyPriorSourceId) return;
    this.copyingPrior = true;
    this.api.post(`/compilations/${this.selectedCompilationId}/copy-mapping/${this.copyPriorSourceId}`, {}).subscribe({
      next: () => {
        this.copyingPrior = false;
        this.showCopyPriorOverlay = false;
        this.snackBar.open('Mapping copied from prior compilation', 'OK', { duration: 3000 });
        this.loadCoverage();
        this.loadMappedAccounts();
        this.loadUnmatchedTb();
        if (this.disclosureTreeRef) this.disclosureTreeRef.loadTree();
      },
      error: () => {
        this.copyingPrior = false;
        this.snackBar.open('Failed to copy mapping', 'OK', { duration: 4000 });
      },
    });
  }

  confirmResetToDefault(): void {
    if (!this.selectedCompilationId) return;
    if (!confirm('Reset all mapping rules to NT Specimen defaults? This will replace any custom mappings.')) return;
    this.resettingDefault = true;
    this.api.post(`/compilations/${this.selectedCompilationId}/reset-mapping`, {}).subscribe({
      next: () => {
        this.resettingDefault = false;
        this.snackBar.open('Mapping reset to defaults', 'OK', { duration: 3000 });
        this.loadCoverage();
        this.loadMappedAccounts();
        this.loadUnmatchedTb();
        if (this.disclosureTreeRef) this.disclosureTreeRef.loadTree();
      },
      error: () => {
        this.resettingDefault = false;
        this.snackBar.open('Failed to reset mapping', 'OK', { duration: 4000 });
      },
    });
  }

  loadUnmatchedTb(): void {
    if (!this.selectedCompilationId) { this.unmatchedTbRows = []; return; }
    this.loadingUnmatched = true;
    this.api.get<UnmatchedTbResponse>(`/compilations/${this.selectedCompilationId}/unmatched-tb`).subscribe({
      next: (data) => {
        this.unmatchedTbRows = data.unmatchedEntries || [];
        this.unmatchedTbSummary = { total: data.totalTbEntries, matched: data.matchedCount, unmatched: data.unmatchedCount };
        this.loadingUnmatched = false;
      },
      error: () => {
        this.unmatchedTbRows = [];
        this.loadingUnmatched = false;
      },
    });
  }

  loadPriorCompilations(): void {
    this.api.get<Compilation[]>('/compilations').subscribe({
      next: (data) => {
        this.priorCompilations = data.filter(c => c.id !== this.selectedCompilationId);
      },
      error: () => { this.priorCompilations = []; },
    });
  }

  openCopyPriorDialog(): void {
    this.copyPriorSourceId = '';
    this.loadPriorCompilations();
    this.showCopyPriorOverlay = true;
  }

  toggleShowInactive(): void {
    this.showInactiveItems = !this.showInactiveItems;
    if (this.disclosureTreeRef) {
      this.disclosureTreeRef.showInactive = this.showInactiveItems;
      this.disclosureTreeRef.applyInactiveFilter();
    }
  }

  isTemplateEditable(): boolean {
    if (!this.selectedTemplateId) return false;
    const t = this.templates.find(tpl => tpl.id === this.selectedTemplateId);
    return !!t && t.status === 'draft' && !t.isSystemDefault;
  }

  onTreeChanged(): void {
    this.loadCoverage();
  }

  onWorkflowFilterChange(): void {
  }

  loadCoverage(): void {
    if (!this.selectedTemplateId || !this.selectedCompilationId) return;
    let url = `/mappings/coverage/${this.selectedTemplateId}`;
    if (this.selectedCompilationId) {
      url += `?compilationId=${encodeURIComponent(this.selectedCompilationId)}`;
    }
    this.api.get<MappingCoverageReport>(url).subscribe({
      next: (data) => { this.coverage = data; },
      error: (err: any) => {
        this.snackBar.open(err?.error?.message || 'Failed to load coverage data', 'OK', { duration: 4000 });
      },
    });
  }

  loadMappedAccounts(): void {
    if (!this.selectedTemplateId || !this.selectedCompilationId) return;
    const params: Record<string, string> = { templateId: this.selectedTemplateId };
    if (this.selectedCompilationId) {
      params['compilationId'] = this.selectedCompilationId;
    }
    this.api.get<MappingRule[]>('/mappings', params).subscribe({
      next: (data) => {
        this.mappedAccountCodes = new Set(
          data.filter(m => m.lineItemId).map(m => m.scoaAccountNumber || m.glAccountCode),
        );
      },
      error: (err: any) => {
        this.snackBar.open(err?.error?.message || 'Failed to load mapped accounts', 'OK', { duration: 4000 });
      },
    });
  }

  onNodeSelected(event: { lineItem: DisclosureLineItemNode; section: DisclosureTreeNode }): void {
    this.selectedLineItem = event.lineItem;
    this.selectedSection = event.section;
  }

  onScoaAccountSelected(account: any): void {
  }

  onScoaBatchSelected(items: any[]): void {
    if (!this.selectedLineItem) return;
    if (this.workspaceRef) {
      this.workspaceRef.addBatchMappings(items);
    }
  }

  onMappingChanged(): void {
    this.loadCoverage();
    this.loadMappedAccounts();
    if (this.selectedCompilationId) {
      this.api.post(`/compilations/${this.selectedCompilationId}/calculate`, {}).subscribe();
    }
  }

  onDefaultsLoaded(allCodes: string[]): void {
    const existing = new Set(this.mappedAccountCodes);
    allCodes.forEach(c => existing.add(c));
    this.mappedAccountCodes = existing;
  }

  onDefaultMappingRemoved(event: { scoaAccountNumber: string }): void {
    const template = this.templates.find(t => t.id === this.selectedTemplateId);
    if (!template) return;

    if (template.status !== 'draft') {
      this.autoCloneTemplate();
      return;
    }

    const updated = new Set(this.mappedAccountCodes);
    updated.delete(event.scoaAccountNumber);
    this.mappedAccountCodes = updated;
  }

  onRequireCloneBeforeEdit(): void {
    this.snackBar.open("This template is locked. Click 'Customize Template' to create an editable copy.", 'OK', { duration: 5000 });
    this.autoCloneTemplate();
  }

  private autoCloneTemplate(): void {
    const template = this.templates.find(t => t.id === this.selectedTemplateId);
    if (!template) return;
    const cloneName = `Custom - ${template.name}`;
    this.cloning = true;
    this.api.post<AfsTemplate>(`/templates/${this.selectedTemplateId}/clone`, { name: cloneName }).subscribe({
      next: (cloned) => {
        this.cloning = false;
        this.loadTemplates();
        this.loadAllCompilations();
      },
      error: () => { this.cloning = false; },
    });
  }

  validateAll(): void {
    if (!this.selectedTemplateId) return;
    this.validating = true;
    this.validationFilter = '';
    this.unmappedSearchQuery = '';
    this.api.get<ValidationReport>(`/mappings/validation/${this.selectedTemplateId}`).subscribe({
      next: (data) => {
        this.validationReport = data;
        this.showValidationOverlay = true;
        this.validating = false;
      },
      error: () => { this.validating = false; },
    });
  }

  toggleValidationFilter(filter: string): void {
    this.validationFilter = this.validationFilter === filter ? '' : filter;
  }

  filteredUnmappedItems(): Array<{ id: string; code: string; label: string; sectionTitle: string }> {
    if (!this.validationReport) return [];
    const items = this.validationReport.unmappedLineItems;
    if (!this.unmappedSearchQuery) return items;
    const q = this.unmappedSearchQuery.toLowerCase();
    return items.filter(item =>
      (item.code || '').toLowerCase().includes(q) ||
      item.label.toLowerCase().includes(q) ||
      item.sectionTitle.toLowerCase().includes(q)
    );
  }

  navigateToUnmappedItem(item: { id: string; code: string; label: string; sectionTitle: string }): void {
    this.showValidationOverlay = false;
    if (this.disclosureTreeRef) {
      this.disclosureTreeRef.selectLineItemById(item.id);
    }
  }

  navigateToFirstUnmapped(): void {
    if (!this.validationReport || this.validationReport.unmappedLineItems.length === 0) return;
    this.navigateToUnmappedItem(this.validationReport.unmappedLineItems[0]);
  }

  autoSuggest(): void {
    if (!this.selectedTemplateId) return;
    this.suggesting = true;
    this.api.get<AutoSuggestResult>(`/mappings/auto-suggest/${this.selectedTemplateId}`).subscribe({
      next: (data) => {
        if (data.suggestions) {
          data.suggestions.forEach(s => s.selected = true);
        }
        this.suggestResult = data;
        this.showSuggestOverlay = true;
        this.suggesting = false;
      },
      error: () => { this.suggesting = false; },
    });
  }

  toggleSelectAll(): void {
    if (!this.suggestResult) return;
    const allSelected = this.allSuggestionsSelected();
    this.suggestResult.suggestions.forEach(s => s.selected = !allSelected);
  }

  allSuggestionsSelected(): boolean {
    return !!this.suggestResult && this.suggestResult.suggestions.length > 0 && this.suggestResult.suggestions.every(s => s.selected);
  }

  getSelectedCount(): number {
    return this.suggestResult?.suggestions.filter(s => s.selected).length || 0;
  }

  acceptSelectedSuggestions(): void {
    if (!this.suggestResult || !this.selectedTemplateId) return;
    const selected = this.suggestResult.suggestions.filter(s => s.selected);
    if (selected.length === 0) return;

    this.acceptingSuggestions = true;
    const accepted = selected.map(s => ({
      lineItemId: s.lineItemId,
      scoaAccountNumber: s.scoaAccountNumber,
      scoaDescription: s.scoaDescription,
      scoaSegment: s.scoaSegment,
    }));

    this.api.post(`/mappings/accept-suggestions/${this.selectedTemplateId}`, { accepted }).subscribe({
      next: () => {
        this.showSuggestOverlay = false;
        this.suggestResult = null;
        this.acceptingSuggestions = false;
        this.onMappingChanged();
        if (this.disclosureTreeRef) {
          this.disclosureTreeRef.loadTree();
        }
      },
      error: () => { this.acceptingSuggestions = false; },
    });
  }

  openFullScreen(): void {
    window.open('/mappings/fullscreen', '_blank');
  }

  closeFullScreen(): void {
    window.close();
  }

  exportMappings(format: string): void {
    if (!this.selectedTemplateId) return;
    const token = localStorage.getItem('token');
    const url = `/api/mappings/export/${this.selectedTemplateId}?format=${format}`;
    const ext = format === 'pdf' ? 'pdf' : 'csv';
    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    }).then(res => {
      if (!res.ok) throw new Error('Export failed');
      return res.blob();
    }).then(blob => {
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = `mapping-lead-schedule.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
    }).catch(() => {
      this.snackBar.open('Export failed. Please try again.', 'OK', { duration: 4000 });
    });
  }

  showCloneDialog(): void {
    if (!this.selectedTemplateId) return;
    const currentTemplate = this.templates.find(t => t.id === this.selectedTemplateId);
    this.cloneName = currentTemplate ? `Custom - ${currentTemplate.name}` : 'Custom Template';
    this.showCloneOverlay = true;
  }

  cloneTemplate(): void {
    if (!this.selectedTemplateId || !this.cloneName.trim()) return;
    this.cloning = true;
    this.api.post<AfsTemplate>(`/templates/${this.selectedTemplateId}/clone`, { name: this.cloneName.trim() }).subscribe({
      next: (cloned) => {
        this.cloning = false;
        this.showCloneOverlay = false;
        this.loadTemplates();
        this.loadAllCompilations();
      },
      error: () => { this.cloning = false; },
    });
  }

  startResize(event: MouseEvent, panel: 'left' | 'right' | 'center'): void {
    this.resizing = panel;
    this.resizeStartX = event.clientX;
    this.resizeStartY = event.clientY;
    this.resizeStartWidth = panel === 'left' ? this.leftPanelWidth : this.rightPanelWidth;
    event.preventDefault();
  }

  private resizeStartY = 0;

  private bindResizeEvents(): void {
    const onMouseMove = (e: MouseEvent) => {
      if (!this.resizing) return;
      if (this.resizing === 'center') {
        const deltaY = e.clientY - this.resizeStartY;
        const topPct = Math.max(25, Math.min(75, 55 + (deltaY / 5)));
        this.centerTopFlex = `1 1 ${topPct}%`;
        this.centerBottomFlex = `1 1 ${100 - topPct}%`;
      } else {
        const delta = e.clientX - this.resizeStartX;
        if (this.resizing === 'left') {
          this.leftPanelWidth = Math.max(200, Math.min(500, this.resizeStartWidth + delta));
        } else {
          this.rightPanelWidth = Math.max(200, Math.min(500, this.resizeStartWidth - delta));
        }
      }
    };
    const onMouseUp = () => { this.resizing = null; };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    this.destroy$.subscribe(() => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    });
  }
}
