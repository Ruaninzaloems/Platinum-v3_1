import { Component, OnInit, OnDestroy, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { ApiService } from '../../core/services/api.service';
import { Compilation, CompilationSection, CompilationSectionLineItem, GlBreakdownEntry } from '../../core/models/interfaces';
import { DrillThroughPanelComponent } from './drill-through-panel.component';

@Component({
  selector: 'app-afs-preview',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule, MatMenuModule, DrillThroughPanelComponent],
  templateUrl: './afs-preview.component.html',
  styleUrl: './afs-preview.component.css'
})
export class AfsPreviewComponent implements OnInit, OnDestroy {
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  compilation: any = null;
  genInfo: any = null;
  notes: any[] = [];
  abbreviations: any[] = [];
  accountingPolicies: any[] = [];
  groupedPolicies: { area: string; policies: any[] }[] = [];
  previewMode: 'draft' | 'final' = 'draft';

  presets: { key: string; label: string; description: string }[] = [];
  activePreset = 'nt_specimen';
  applyingPreset = false;

  exporting = false;
  exportJobId = '';

  drillPanelOpen = false;
  drillPanelEntries: GlBreakdownEntry[] = [];
  drillPanelLabel = '';

  obStatus = '';
  obStatusLoading = true;

  get isObUnresolved(): boolean {
    if (this.obStatusLoading) return false;
    return this.obStatus !== 'continuity_matched_confirmed'
      && this.obStatus !== 'confirmed_with_exception'
      && this.obStatus !== '';
  }

  sectionOrder: string[] = [];
  compilationSectionOrder: string[] = [];

  get activeSections(): any[] {
    if (!this.compilation?.sections) return [];
    return this.compilation.sections
      .filter((s: any) => s.isActive !== false && s.sectionType === 'statement')
      .map((s: any) => ({
        ...s,
        lineItems: (s.lineItems || []).filter((li: any) => li.templateLineItem?.isActive !== false),
      }));
  }

  get orderedBlocks(): string[] {
    const order = (this.compilationSectionOrder && this.compilationSectionOrder.length > 0)
      ? this.compilationSectionOrder
      : this.sectionOrder;

    if (!order || order.length === 0) {
      return ['index', 'general_info', 'abbreviations', 'policies', 'mandate_approval', 'ao_report', 'statements', 'notes'];
    }
    const blocks: string[] = [];
    const seen = new Set<string>();
    for (const entry of order) {
      const key = this.mapSectionToBlockKey(entry);
      if (key && !seen.has(key)) {
        seen.add(key);
        blocks.push(key);
      }
    }
    if (!seen.has('notes')) blocks.push('notes');
    return blocks;
  }

  private mapSectionToBlockKey(entry: string): string {
    const lower = entry.toLowerCase();
    if (lower === 'general information') return 'general_info';
    if (lower === 'abbreviations') return 'abbreviations';
    if (lower === 'accounting policies') return 'policies';
    if (lower === 'notes') return 'notes';
    if (lower === 'index') return 'index';
    if (lower === 'annexures') return 'annexures';
    if (lower.includes('reporting entity') && lower.includes('mandate')) return 'reporting_entity_mandate';
    if (lower.includes('approval') || lower.includes('responsibilities')) return 'mandate_approval';
    if (lower.includes('accounting officer') && lower.includes('report')) return 'ao_report';
    if (lower.includes('accounting officer')) return 'mandate_approval';
    return 'statements';
  }

  get activeNotes(): any[] {
    if (!this.notes) return [];
    const activeSectionIds = new Set(
      (this.compilation?.sections || [])
        .filter((s: any) => s.isActive !== false)
        .map((s: any) => s.id)
    );
    return this.notes.filter((note: any) => {
      if (note.sectionId && !activeSectionIds.has(note.sectionId)) return false;
      if (note.templateLineItem?.isActive === false) return false;
      const cyAmt = note.noteData?.currentYearAmount ?? note.currentYearAmount ?? 0;
      const pyAmt = note.noteData?.priorYearAmount ?? note.priorYearAmount ?? 0;
      const hasAmounts = Math.abs(cyAmt) > 0 || Math.abs(pyAmt) > 0;
      const hasContent = !!note.noteData?.disclosure || !!note.noteData?.accountingPolicy;
      const isMandatory = !!note.noteData?.isMandatory;
      return hasAmounts || hasContent || isMandatory;
    });
  }
  currentYearLabel = '';
  priorYearLabel = '';
  fyEndDate = '';
  isNTSpecimen = false;
  templateLabel = '';
  loading = true;
  loadError = '';

  templateStyle: any = {
    logoPath: null,
    logoPosition: 'left',
    logoMaxHeight: 80,
    secondaryLogoPath: null,
    secondaryLogoPosition: 'right',
    primaryColor: '#0f2b46',
    secondaryColor: '#c9a84c',
    headerBgColor: '#0f2b46',
    headerTextColor: '#ffffff',
    footerBgColor: '#0f2b46',
    footerTextColor: '#ffffff',
    tableBorderColor: '#dee2e6',
    tableHeaderBgColor: '#f8f9fa',
    totalRowBgColor: '#f0f4f8',
    fontFamily: 'Inter, sans-serif',
    headingFontFamily: 'Inter, sans-serif',
    baseFontSize: 10,
    headingFontSize: 14,
    lineHeight: 1.4,
    coverLayout: 'centered',
    coverBgColor: '#0f2b46',
    coverTextColor: '#ffffff',
    coverAccentColor: '#c9a84c',
    showCoverBorder: true,
    coverBorderStyle: 'double',
    coverSubtitleText: 'Annual Financial Statements',
    headerLayout: 'standard',
    footerLayout: 'standard',
    showPageNumbers: true,
    headerLeftText: null,
    headerRightText: null,
    footerLeftText: null,
    footerRightText: null,
    draftWatermarkText: 'DRAFT',
    draftWatermarkOpacity: 0.06,
    showWatermark: true,
    pageMarginTop: 40,
    pageMarginBottom: 40,
    pageMarginSides: 48,
  };

  get styleVars(): Record<string, string> {
    const s = this.templateStyle;
    return {
      '--afs-primary-color': s.primaryColor,
      '--afs-secondary-color': s.secondaryColor,
      '--afs-header-bg-color': s.headerLayout === 'standard' ? 'transparent' : s.headerBgColor,
      '--afs-header-text-color': s.headerLayout === 'standard' ? s.primaryColor : s.headerTextColor,
      '--afs-footer-bg-color': s.footerLayout === 'standard' ? 'transparent' : s.footerBgColor,
      '--afs-footer-text-color': s.footerLayout === 'standard' ? '#999' : s.footerTextColor,
      '--afs-table-border-color': s.tableBorderColor,
      '--afs-table-header-bg-color': s.tableHeaderBgColor,
      '--afs-total-row-bg-color': s.totalRowBgColor,
      '--afs-font-family': s.fontFamily,
      '--afs-heading-font-family': s.headingFontFamily,
      '--afs-base-font-size': s.baseFontSize + 'pt',
      '--afs-heading-font-size': s.headingFontSize + 'px',
      '--afs-line-height': String(s.lineHeight),
      '--afs-cover-bg-color': s.coverBgColor,
      '--afs-cover-text-color': s.coverTextColor,
      '--afs-cover-accent-color': s.coverAccentColor,
      '--afs-page-margin-top': s.pageMarginTop + 'px',
      '--afs-page-margin-bottom': s.pageMarginBottom + 'px',
      '--afs-page-margin-sides': s.pageMarginSides + 'px',
    };
  }

  ngOnDestroy() {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  ngOnInit() {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.loadCompilation(params['id']);
    });
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(qp => {
      if (qp['mode'] === 'final') this.previewMode = 'final';
    });
  }

  loadCompilation(id: string) {
    this.loading = true;
    this.loadError = '';
    this.api.get<any>(`/compilations/${id}`).subscribe({
      next: data => {
        this.compilation = data;
        this.loading = false;
        if (Array.isArray(data.sectionOrder) && data.sectionOrder.length > 0) {
          this.compilationSectionOrder = data.sectionOrder;
        }
        this.updateLabels();
        this.loadNotes(id);
        this.loadAbbreviations();
        this.loadGeneralInfo();
        this.loadAccountingPolicies();
        this.loadTemplateStyle();
        this.loadObStatus(id);
      },
      error: err => {
        void err;
        this.loading = false;
        this.loadError = err?.error?.message || 'Could not load compilation data. Please try again.';
      }
    });
  }

  loadGeneralInfo() {
    const fyId = this.compilation?.financialYear?.id;
    if (!fyId) return;
    this.api.get<any>(`/general-information/${fyId}`).subscribe({
      next: data => this.genInfo = data && data.id ? data : null,
      error: () => this.genInfo = null,
    });
  }

  loadAccountingPolicies() {
    const fyId = this.compilation?.financialYear?.id;
    if (!fyId) return;
    this.api.get<any[]>(`/accounting-policies/${fyId}`).subscribe({
      next: data => {
        this.accountingPolicies = (data || []).filter((p: any) => p.isActive && (p.approvalStatus === 'approved' || p.approvalStatus === 'published')).sort((a: any, b: any) => a.sortOrder - b.sortOrder);
        const areaMap = new Map<string, any[]>();
        for (const p of this.accountingPolicies) {
          if (!areaMap.has(p.policyArea)) areaMap.set(p.policyArea, []);
          areaMap.get(p.policyArea)!.push(p);
        }
        this.groupedPolicies = Array.from(areaMap.entries()).map(([area, policies]) => ({ area, policies }));
      },
      error: () => {
        this.accountingPolicies = [];
        this.groupedPolicies = [];
      },
    });
  }

  loadTemplateStyle() {
    const templateId = this.compilation?.template?.id;
    if (!templateId) return;
    this.api.get<any>(`/template-styles/${templateId}`).subscribe({
      next: data => {
        if (data && data.id) {
          const defaults = { ...this.templateStyle };
          this.templateStyle = { ...defaults, ...data };
          this.activePreset = data.layoutPreset || 'nt_specimen';
          if (Array.isArray(data.sectionOrder)) {
            this.sectionOrder = data.sectionOrder;
          }
        }
      },
      error: () => {},
    });
    this.loadPresets();
  }

  loadPresets() {
    this.api.get<any[]>('/template-styles/presets/list').subscribe({
      next: data => this.presets = data || [],
      error: () => this.presets = [],
    });
  }

  applyPreset(presetKey: string) {
    const templateId = this.compilation?.template?.id;
    if (!templateId || this.applyingPreset) return;
    this.applyingPreset = true;
    this.api.post<any>(`/template-styles/${templateId}/apply-preset/${presetKey}`, {}).subscribe({
      next: data => {
        if (data && data.id) {
          const defaults = { ...this.templateStyle };
          this.templateStyle = { ...defaults, ...data };
          this.activePreset = presetKey;
        }
        this.applyingPreset = false;
        if (this.compilation?.id) this.loadCompilation(this.compilation.id);
      },
      error: () => {
        this.applyingPreset = false;
      },
    });
  }

  printPreview() {
    window.print();
  }

  openIndex() {
    if (this.compilation) {
      this.router.navigate(['/compilations', this.compilation.id, 'index']);
    }
  }

  loadAbbreviations() {
    const fyId = this.compilation?.financialYear?.id;
    if (!fyId) return;
    this.api.get<any[]>(`/abbreviations/${fyId}`).subscribe({
      next: data => this.abbreviations = (data || []).filter((a: any) => a.isActive).sort((a: any, b: any) => a.abbreviation.localeCompare(b.abbreviation)),
      error: () => this.abbreviations = [],
    });
  }

  loadNotes(id: string) {
    this.api.get<any[]>(`/compilations/${id}/notes`).subscribe({
      next: data => this.notes = data || [],
      error: () => this.notes = []
    });
  }

  private loadObStatus(compilationId: string): void {
    this.obStatusLoading = true;
    this.api.get<any>(`/opening-balance/${compilationId}/status`).subscribe({
      next: (result) => {
        this.obStatus = result?.status || 'not_established';
        this.obStatusLoading = false;
      },
      error: () => {
        this.obStatus = 'unknown';
        this.obStatusLoading = false;
      }
    });
  }

  retry() {
    const id = this.route.snapshot.params['id'];
    if (id) this.loadCompilation(id);
  }

  private updateLabels() {
    if (!this.compilation?.financialYear) return;
    const label = this.compilation.financialYear.label;
    this.currentYearLabel = label || 'Current Year';
    const match = label?.match(/(\d{4})\/(\d{4})/);
    if (match) {
      const priorStart = parseInt(match[1]) - 1;
      const priorEnd = parseInt(match[2]) - 1;
      this.priorYearLabel = `${priorStart}/${String(priorEnd).slice(-2)} (PY)`;
      this.currentYearLabel = `${match[1]}/${match[2].slice(-2)}`;
      this.fyEndDate = `30 June ${match[2]}`;
    } else {
      this.priorYearLabel = 'Prior Year';
      this.fyEndDate = '';
    }
    if (this.compilation.status === 'approved' || this.compilation.status === 'published') {
      this.previewMode = 'final';
    }
    const tName = (this.compilation.template?.name || '').toLowerCase();
    const tType = (this.compilation.template?.type || '').toLowerCase();
    this.isNTSpecimen = /\bnt\b/.test(tName) || tName.includes('national treasury') || tType === 'consolidated';
    this.templateLabel = this.isNTSpecimen ? 'National Treasury Specimen Format' : 'GRAP-Compliant Format';
  }

  goBack() {
    if (this.compilation) {
      this.router.navigate(['/compilations', this.compilation.id]);
    } else {
      this.router.navigate(['/compilations']);
    }
  }

  toggleMode() {
    this.previewMode = this.previewMode === 'draft' ? 'final' : 'draft';
  }

  startExport(format: 'pdf' | 'docx', mode: 'draft' | 'final') {
    if (!this.compilation || this.exporting) return;
    this.exporting = true;
    this.api.post<{ id: string }>('/exports', {
      compilationId: this.compilation.id,
      format,
      options: { mode },
    }).subscribe({
      next: (job) => {
        this.exportJobId = job.id;
        this.pollExportProgress(job.id);
      },
      error: () => {
        this.exporting = false;
      },
    });
  }

  private pollExportProgress(jobId: string) {
    const poll = () => {
      this.api.get<{ status: string; progress: number; fileName: string }>(`/exports/${jobId}/progress`).subscribe({
        next: (progress) => {
          if (progress.status === 'completed') {
            this.exporting = false;
            this.downloadExport(jobId, progress.fileName);
          } else if (progress.status === 'failed') {
            this.exporting = false;
          } else {
            this.pollTimer = setTimeout(poll, 1000);
          }
        },
        error: () => {
          this.exporting = false;
        },
      });
    };
    this.pollTimer = setTimeout(poll, 500);
  }

  private downloadExport(jobId: string, fileName: string) {
    this.api.getBlob(`/exports/${jobId}/download`).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName || 'export';
        link.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.exporting = false;
      },
    });
  }

  scrollToNote(noteRef: string) {
    const el = document.getElementById('note-' + noteRef);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.style.background = '#fffbeb';
      setTimeout(() => { el.style.background = ''; }, 2000);
    } else {
      const notesSection = document.getElementById('notes-section');
      if (notesSection) {
        notesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  openDrillThrough(item: any) {
    this.drillPanelEntries = item.glBreakdown || [];
    this.drillPanelLabel = item.templateLineItem?.label || item.noteData?.title || item.label || 'Line Item';
    this.drillPanelOpen = true;
  }

  formatAmount(value: number): string {
    if (value == null || value === 0) return '-';
    const thousands = value / 1000;
    const abs = Math.abs(thousands);
    const formatted = abs.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return thousands < 0 ? `(${formatted})` : formatted;
  }
}
