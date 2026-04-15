import { Component, OnInit, OnDestroy, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { ApiService } from '../../core/services/api.service';
import { Compilation, CompilationSection, CompilationSectionLineItem, GlBreakdownEntry } from '../../core/models/interfaces';
import { DocumentManagementService, DmsDocument } from '../document-management/document-management.service';
import { DocumentUploadDialogComponent } from '../document-management/document-upload-dialog.component';
import { DrillThroughPanelComponent } from './drill-through-panel.component';
import { ReviewDashboardComponent } from '../review/review-dashboard.component';

@Component({
  selector: 'app-compilation-detail',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTabsModule, MatTableModule, MatExpansionModule, MatProgressBarModule, MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule, MatTooltipModule, MatMenuModule, MatSliderModule, MatButtonToggleModule, MatCheckboxModule, FormsModule, DrillThroughPanelComponent, ReviewDashboardComponent],
  styleUrl: './compilation-detail.component.css',
  templateUrl: './compilation-detail.component.html'
})
export class CompilationDetailComponent implements OnInit, OnDestroy {
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private loadProgressTimer: ReturnType<typeof setInterval> | null = null;
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private dms = inject(DocumentManagementService);

  compilation: Compilation | null = null;
  pageLoading = true;
  loadProgress = 0;
  loadStage = 'Loading compilation...';
  calculating = false;
  calcProgress = 0;
  calcStage = '';
  private calcProgressTimer: ReturnType<typeof setInterval> | null = null;
  generatingNotes = false;
  loadingInsights = false;
  currentYearLabel = 'Current Year';
  priorYearLabel = 'Prior Year';
  notes: any[] = [];
  aiInsights: any = null;
  compilationDocs: DmsDocument[] = [];
  drillPanelOpen = false;
  drillPanelEntries: GlBreakdownEntry[] = [];
  drillPanelLabel = '';
  validationErrors: { ruleId: string; ruleName: string; status: string; message: string }[] = [];
  validationPassCount = 0;
  validationFailCount = 0;
  validationWarnCount = 0;
  priorYearValidation: any = null;
  loadingPYV = false;
  exportingDoc = false;
  statusTransitioning = false;
  showPostCalculateBanner = false;
  calcError: string | null = null;

  showBudgetVariance = true;
  private autoCalcTriggered = false;

  hasTbData: boolean | null = null;
  integrityResult: any = null;
  integrityLoading = false;

  obStatus: string = '';
  obStatusLoading = true;

  generalInfo: any = null;
  generalInfoLoading = false;
  abbreviations: { id: string; abbreviation: string; definition: string; isActive: boolean }[] = [];
  preambleFormatMode = false;
  preambleFormatting = {
    titleFontSize: 24,
    bodyFontSize: 13,
    logoWidth: 120,
    logoHeight: 120,
  };
  printSections: { [key: string]: boolean } = {
    coverPage: true,
    index: true,
    generalInfo: true,
    abbreviations: true,
    aoResponsibilities: true,
    aoReport: true,
  };
  logoSizePreset: string = 'medium';
  logoAspectLocked = true;
  private logoAspectRatio = 1;
  giLogoUrl: string | null = null;
  accountingPolicies: any[] = [];
  accountingPoliciesLoading = false;
  get reportingFramework(): string {
    const templateName = this.compilation?.template?.name || '';
    if (templateName.toLowerCase().includes('ifrs')) return 'IFRS SME';
    return 'GRAP (NT Specimen AFS)';
  }

  workflowSteps = [
    { label: 'Draft', status: 'draft' },
    { label: 'In Review', status: 'in_review' },
    { label: 'Approved', status: 'approved' },
    { label: 'Published', status: 'published' },
    { label: 'Audited & Locked', status: 'audited_locked' }
  ];

  get isLocked(): boolean {
    return this.compilation?.status === 'audited_locked';
  }

  get preambleSections(): CompilationSection[] {
    if (!this.compilation?.sections) return [];
    return this.compilation.sections.filter(s =>
      s.sectionType === 'cover_page' || s.sectionType === 'front_matter'
    );
  }

  get preambleNonGiSections(): CompilationSection[] {
    const hardcodedTitles = new Set([
      'General Information',
      'Index',
      'Abbreviations',
      'Accounting Officer\'s Responsibilities and Approval',
      'Accounting Officer\'s Report',
    ]);
    return this.preambleSections.filter(s => !hardcodedTitles.has(s.title));
  }

  get financialStatementSections(): CompilationSection[] {
    if (!this.compilation?.sections) return [];
    return this.compilation.sections.filter(s =>
      s.sectionType === 'statement'
    );
  }

  get notesSections(): CompilationSection[] {
    if (!this.compilation?.sections) return [];
    return this.compilation.sections.filter(s =>
      s.sectionType === 'notes'
    );
  }

  isNtNoteLayout(section: CompilationSection): boolean {
    return section.metadata?.columnLayout === 'nt_notes';
  }

  isSubNoteLayout(section: CompilationSection): boolean {
    return section.metadata?.columnLayout === 'sub_note' || section.metadata?.columnLayout === 'sub_note_cashbook';
  }

  get hasConsolidatedEntities(): boolean {
    const entities = this.generalInfo?.consolidatedEntities;
    return Array.isArray(entities) && entities.length > 0;
  }

  get mainNotesSections(): CompilationSection[] {
    return this.notesSections.filter(s => !s.noteNumber?.includes('.'));
  }

  getSubNotes(noteNumber: string): CompilationSection[] {
    if (!noteNumber) return [];
    return this.notesSections.filter(s =>
      s.noteNumber?.startsWith(noteNumber + '.') && s.noteNumber !== noteNumber
    );
  }

  get accountingPolicySections(): CompilationSection[] {
    if (!this.compilation?.sections) return [];
    return this.compilation.sections.filter(s => s.sectionType === 'policies');
  }

  ngOnDestroy() {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.loadProgressTimer) {
      clearInterval(this.loadProgressTimer);
      this.loadProgressTimer = null;
    }
    this.stopProgressPolling();
  }

  ngOnInit() {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.loadCompilation(params['id']);
    });
  }

  private get formattingStorageKey(): string {
    return `preambleFormat_${this.compilation?.id || 'default'}`;
  }

  private loadFormattingFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.formattingStorageKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.formatting) {
          this.preambleFormatting = { ...this.preambleFormatting, ...saved.formatting };
        } else {
          const { printSections: _ps, logoSizePreset: _lsp, logoAspectLocked: _lal, ...fmt } = saved;
          if (fmt.titleFontSize) this.preambleFormatting = { ...this.preambleFormatting, ...fmt };
        }
        if (saved.printSections) {
          this.printSections = { ...this.printSections, ...saved.printSections };
        }
        if (saved.logoSizePreset) this.logoSizePreset = saved.logoSizePreset;
        if (saved.logoAspectLocked !== undefined) this.logoAspectLocked = saved.logoAspectLocked;
        if (this.preambleFormatting.logoHeight > 0) {
          this.logoAspectRatio = this.preambleFormatting.logoWidth / this.preambleFormatting.logoHeight;
        }
      }
    } catch { /* ignore */ }
  }

  savePreambleFormatting(): void {
    try {
      const data = {
        formatting: this.preambleFormatting,
        printSections: this.printSections,
        logoSizePreset: this.logoSizePreset,
        logoAspectLocked: this.logoAspectLocked,
      };
      localStorage.setItem(this.formattingStorageKey, JSON.stringify(data));
      this.snackBar.open('Formatting saved', 'Close', { duration: 2000, panelClass: 'snack-success' });
    } catch { /* ignore */ }
  }

  resetPreambleFormatting(): void {
    this.preambleFormatting = { titleFontSize: 24, bodyFontSize: 13, logoWidth: 120, logoHeight: 120 };
    this.printSections = { coverPage: true, index: true, generalInfo: true, abbreviations: true, aoResponsibilities: true, aoReport: true };
    this.logoSizePreset = 'medium';
    this.logoAspectLocked = true;
    this.logoAspectRatio = 1;
  }

  onLogoSizePresetChange(preset: string): void {
    this.logoSizePreset = preset;
    const sizes: { [key: string]: number } = { small: 80, medium: 120, large: 200 };
    if (sizes[preset]) {
      const w = sizes[preset];
      this.preambleFormatting.logoWidth = w;
      this.preambleFormatting.logoHeight = this.logoAspectLocked ? Math.round(w / this.logoAspectRatio) : w;
    }
  }

  onLogoWidthChange(width: number): void {
    this.preambleFormatting.logoWidth = width;
    if (this.logoAspectLocked && this.logoAspectRatio > 0) {
      this.preambleFormatting.logoHeight = Math.round(width / this.logoAspectRatio);
    }
    this.logoSizePreset = 'custom';
  }

  onLogoHeightChange(height: number): void {
    this.preambleFormatting.logoHeight = height;
    if (this.logoAspectLocked && this.logoAspectRatio > 0) {
      this.preambleFormatting.logoWidth = Math.round(height * this.logoAspectRatio);
    }
    this.logoSizePreset = 'custom';
  }

  toggleAspectLock(): void {
    this.logoAspectLocked = !this.logoAspectLocked;
    if (this.logoAspectLocked && this.preambleFormatting.logoHeight > 0) {
      this.logoAspectRatio = this.preambleFormatting.logoWidth / this.preambleFormatting.logoHeight;
    }
  }

  get titleSizeLabel(): string {
    const s = this.preambleFormatting.titleFontSize;
    if (s <= 18) return 'Small';
    if (s <= 24) return 'Medium';
    if (s <= 32) return 'Large';
    return 'Extra Large';
  }

  get bodySizeLabel(): string {
    const s = this.preambleFormatting.bodyFontSize;
    if (s <= 10) return 'Small';
    if (s <= 13) return 'Medium';
    if (s <= 16) return 'Large';
    return 'Extra Large';
  }

  loadCompilation(id: string) {
    this.autoCalcTriggered = false;
    this.pageLoading = true;
    this.loadProgress = 5;
    this.loadStage = 'Connecting...';
    if (this.loadProgressTimer) clearInterval(this.loadProgressTimer);
    this.loadProgressTimer = setInterval(() => {
      if (this.loadProgress < 25) {
        this.loadProgress += 3;
      }
    }, 120);

    this.api.get<any>(`/compilations/${id}?lite=true`).subscribe({
      next: data => {
        if (this.loadProgressTimer) { clearInterval(this.loadProgressTimer); this.loadProgressTimer = null; }
        this.compilation = data;
        this.loadProgress = 30;
        this.loadStage = 'Loading supporting data...';
        this.loadFormattingFromStorage();
        this.updateYearLabels();
        this.extractValidationErrors(data);

        let completedCalls = 0;
        const totalCalls = 6;
        const markCallDone = (stage?: string) => {
          completedCalls++;
          this.loadProgress = 30 + Math.round((completedCalls / totalCalls) * 65);
          if (stage) this.loadStage = stage;
          if (completedCalls >= totalCalls) {
            this.loadProgress = 95;
            this.loadStage = 'Finalizing...';
            setTimeout(() => {
              this.loadProgress = 100;
              this.pageLoading = false;
              this.loadStage = '';
            }, 300);
          }
        };

        this.loadNotes();
        this.loadCompilationDocs(id);

        this.checkTbData(markCallDone);
        this.checkIntegrity(markCallDone);
        this.loadObStatus(markCallDone);
        this.loadGeneralInfo(markCallDone);
        this.loadAbbreviations(markCallDone);
        this.loadAccountingPolicies(markCallDone);
      },
      error: err => {
        if (this.loadProgressTimer) { clearInterval(this.loadProgressTimer); this.loadProgressTimer = null; }
        void err;
        this.compilation = null;
        this.pageLoading = false;
        this.loadProgress = 0;
      }
    });
  }

  private checkTbData(onDone?: (stage?: string) => void): void {
    if (!this.compilation?.financialYearId) {
      this.hasTbData = false;
      onDone?.('Checking data sources...');
      return;
    }
    this.api.get<any[]>(`/platinum/tb-import-batches/history/${this.compilation.financialYearId}`).subscribe({
      next: (batches) => {
        this.hasTbData = Array.isArray(batches) && batches.some(b => b.status === 'committed');
        this.tryAutoCalculate();
        onDone?.('Data sources checked');
      },
      error: () => {
        this.hasTbData = null;
        onDone?.();
      }
    });
  }

  private checkIntegrity(onDone?: (stage?: string) => void): void {
    if (!this.compilation?.financialYearId) {
      this.integrityResult = null;
      this.integrityLoading = false;
      onDone?.();
      return;
    }
    this.integrityLoading = true;
    this.api.get<any>(`/reports/integrity-checks/${this.compilation.financialYearId}?summary=true`).subscribe({
      next: (result) => {
        this.integrityResult = result;
        this.integrityLoading = false;
        onDone?.('Integrity checks loaded');
      },
      error: () => {
        this.integrityResult = null;
        this.integrityLoading = false;
        onDone?.();
      }
    });
  }

  private loadObStatus(onDone?: (stage?: string) => void): void {
    if (!this.compilation?.id) {
      this.obStatus = 'not_established';
      this.obStatusLoading = false;
      onDone?.();
      return;
    }
    this.obStatusLoading = true;
    this.api.get<any>(`/opening-balance/${this.compilation.id}/status`).subscribe({
      next: (result) => {
        this.obStatus = result?.status || 'not_established';
        this.obStatusLoading = false;
        onDone?.('Opening balance checked');
      },
      error: () => {
        this.obStatus = 'unknown';
        this.obStatusLoading = false;
        onDone?.();
      }
    });
  }

  private loadGeneralInfo(onDone?: (stage?: string) => void): void {
    if (!this.compilation?.financialYearId) {
      this.generalInfo = null;
      this.generalInfoLoading = false;
      onDone?.();
      return;
    }
    this.generalInfoLoading = true;
    this.api.get<any>(`/general-information/${this.compilation.financialYearId}`).subscribe({
      next: (data) => {
        this.generalInfo = data;
        this.generalInfoLoading = false;
        if (data?.logoStorageKey) {
          this.giLogoUrl = `/api/general-information/${this.compilation!.financialYearId}/logo`;
        } else {
          this.giLogoUrl = null;
        }
        onDone?.('General info loaded');
      },
      error: () => {
        this.generalInfo = null;
        this.generalInfoLoading = false;
        this.giLogoUrl = null;
        onDone?.();
      }
    });
  }

  private loadAbbreviations(onDone?: (stage?: string) => void): void {
    if (!this.compilation?.financialYearId) {
      this.abbreviations = [];
      onDone?.();
      return;
    }
    this.api.get<any[]>(`/abbreviations/${this.compilation.financialYearId}`).subscribe({
      next: (data) => {
        this.abbreviations = (data || []).filter((a: any) => a.isActive);
        onDone?.('Abbreviations loaded');
      },
      error: () => {
        this.abbreviations = [];
        onDone?.();
      }
    });
  }

  saveGeneralInfo(): void {
    if (!this.generalInfo || !this.compilation?.financialYearId) return;
    this.api.put<any>(`/general-information/${this.compilation.financialYearId}`, this.generalInfo).subscribe({
      next: (data) => {
        this.generalInfo = data;
        this.snackBar.open('General information saved', 'Close', { duration: 2000, panelClass: 'snack-success' });
      },
      error: () => {
        this.snackBar.open('Failed to save general information', 'Close', { duration: 3000, panelClass: 'snack-error' });
      }
    });
  }

  private escHtml(str: string | null | undefined): string {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  printPreamblePreview(): void {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;
    const gi = this.generalInfo;
    const esc = (v: any) => this.escHtml(v);
    const reportDate = gi?.reportingPeriodEnd ? new Date(gi.reportingPeriodEnd).toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
    const fmt = this.preambleFormatting;
    const ps = this.printSections;
    const logoHtml = this.giLogoUrl ? `<img src="${esc(this.giLogoUrl)}" style="max-width:${fmt.logoWidth}px;max-height:${fmt.logoHeight}px;margin-bottom:24px" />` : '';

    const td = (v: string) => `<td style="padding:6px 12px;border:1px solid #94a3b8">${esc(v)}</td>`;
    const mayoralRows = (gi?.mayoralCommittee || []).map((m: any) => `<tr>${td(m.position)}${td(m.name)}</tr>`).join('');
    const councilRows = (gi?.councilMembers || []).map((m: any, i: number) => `<tr>${td(String(i + 1))}${td(m.name)}${td(m.ward)}</tr>`).join('');
    const execRows = (gi?.executiveManagement || []).map((m: any) => `<tr>${td(m.position)}${td(m.name)}</tr>`).join('');
    const auditRows = (gi?.auditCommittee || []).map((m: any) => `<tr>${td(m.position)}${td(m.name)}</tr>`).join('');
    const detailRow = (label: string, value: string) => `<tr><td style="padding:6px 12px;width:40%;font-weight:500;vertical-align:top;border:1px solid #94a3b8">${esc(label)}</td><td style="padding:2px 8px;width:5%;text-align:center;border:1px solid #94a3b8">:</td><td style="padding:6px 12px;border:1px solid #94a3b8;white-space:pre-line">${esc(value) || '—'}</td></tr>`;

    const sections: string[] = [];

    if (ps['coverPage']) {
      sections.push(`<div class="section-page cover-page">${logoHtml}<h1>${esc(gi?.municipalityName) || 'Municipality Name'}</h1><h2>Annual Financial Statements</h2><h3>for the year ended ${esc(reportDate)}</h3></div>`);
    }

    if (ps['index']) {
      const indexEntries: { title: string }[] = [];
      if (ps['generalInfo']) indexEntries.push({ title: 'General Information' });
      if (ps['abbreviations']) indexEntries.push({ title: 'Abbreviations' });
      if (ps['aoResponsibilities']) indexEntries.push({ title: "Accounting Officer's Responsibilities and Approval" });
      if (ps['aoReport']) indexEntries.push({ title: "Accounting Officer's Report" });
      (this.financialStatementSections || []).forEach((s: any) => {
        indexEntries.push({ title: s.title });
      });
      indexEntries.push({ title: 'Notes to the Annual Financial Statements' });
      const idxTd = (content: string, align: string = 'left') => `<td style="padding:6px 12px;border-bottom:1px solid #cbd5e1;text-align:${align}">${content}</td>`;
      const indexRows = indexEntries.map((entry, i) => {
        const pageNum = entry.title === 'Notes to the Annual Financial Statements' ? '—' : String(i + 1);
        return `<tr>${idxTd(esc(entry.title))}${idxTd(pageNum, 'right')}</tr>`;
      }).join('');
      sections.push(`<div class="section-page content-page"><h2 class="page-title">Index</h2><table><thead><tr><th style="text-align:left">Content</th><th style="text-align:right;width:60px">Page</th></tr></thead><tbody>${indexRows}</tbody></table></div>`);
    }

    if (ps['generalInfo']) {
      sections.push(`<div class="section-page content-page">
        <h2 class="page-title">General Information</h2>
        <h3>Details</h3>
        <table>
          ${detailRow('Country of incorporation and domicile', gi?.country)}
          ${detailRow('Legal form of entity', gi?.legalStatus)}
          ${detailRow('Nature of business and principal activities', gi?.natureOfBusiness)}
          ${detailRow('Municipal Category', gi?.municipalCategory)}
        </table>
        <h3>Legislation</h3>
        <table>${detailRow('Legislation governing operations', gi?.legislation)}</table>
        ${mayoralRows ? `<h3>Executive / Mayoral Committee</h3><table><thead><tr><th>Portfolio</th><th>Councillor</th></tr></thead><tbody>${mayoralRows}</tbody></table>` : ''}
        ${councilRows ? `<h3>Council Members</h3><table><thead><tr><th>Nr</th><th>Surname</th><th>Ward</th></tr></thead><tbody>${councilRows}</tbody></table>` : ''}
        ${execRows ? `<h3>Executive Management</h3><table><thead><tr><th>Position</th><th>Name</th></tr></thead><tbody>${execRows}</tbody></table>` : ''}
        ${auditRows ? `<h3>Members of the Audit Committee</h3><table><thead><tr><th>Role</th><th>Name</th></tr></thead><tbody>${auditRows}</tbody></table>` : ''}
        <h3>Administrative Details</h3>
        <table>
          ${detailRow('Grading of local authority', gi?.grading)}
          ${detailRow('Demarcation Code', gi?.demarcationCode)}
          ${detailRow('Registered office', gi?.registeredOffice)}
          ${detailRow('Postal address', gi?.postalAddress)}
          ${detailRow('Telephone Number', gi?.telephone)}
          ${detailRow('Fax Number', gi?.fax)}
          ${detailRow('E-mail address', gi?.email)}
          ${detailRow('Municipal Website', gi?.website)}
        </table>
        <h3>Professional Advisors</h3>
        <table>
          ${detailRow('Bankers', gi?.banker)}
          ${detailRow('Auditors', gi?.auditor)}
          ${detailRow('Attorneys / Legal representative', gi?.attorneys)}
          ${detailRow('Accounting Officer', gi?.accountingOfficer)}
          ${detailRow('Chief Financial Officer', gi?.cfo)}
        </table>
      </div>`);
    }

    if (ps['abbreviations']) {
      const abbrRows = (this.abbreviations || []).map((a: any) => `<tr><td style="padding:6px 12px;border-bottom:1px solid #cbd5e1;font-weight:600;width:160px">${esc(a.abbreviation)}</td><td style="padding:6px 12px;border-bottom:1px solid #cbd5e1">${esc(a.definition)}</td></tr>`).join('');
      const abbrContent = abbrRows ? `<table>${abbrRows}</table>` : `<p style="color:#94a3b8;font-style:italic">No abbreviations captured.</p>`;
      sections.push(`<div class="section-page content-page"><h2 class="page-title">Abbreviations</h2>${abbrContent}</div>`);
    }

    if (ps['aoResponsibilities']) {
      const aoRespText = gi?.aoResponsibilitiesContent || '';
      const aoRespHtml = aoRespText ? `<div style="white-space:pre-line;line-height:1.8">${esc(aoRespText)}</div>` : `<p style="color:#94a3b8;font-style:italic">No AO Responsibilities content captured.</p>`;
      const aoSigLine = `<div style="margin-top:36px"><div style="width:220px;border-top:1px solid #1e293b;padding-top:4px;font-size:${Math.round(fmt.bodyFontSize * 0.9)}px;color:#475569">${esc(gi?.accountingOfficer) || 'Accounting Officer'}</div></div>`;
      sections.push(`<div class="section-page content-page"><h2 class="page-title">Accounting Officer's Responsibilities and Approval</h2>${aoRespHtml}${aoSigLine}</div>`);
    }

    if (ps['aoReport']) {
      const aoRepText = gi?.aoReportContent || '';
      const aoRepHtml = aoRepText ? `<div style="white-space:pre-line;line-height:1.8">${esc(aoRepText)}</div>` : `<p style="color:#94a3b8;font-style:italic">No AO Report content captured.</p>`;
      const aoSigLine2 = `<div style="margin-top:36px"><div style="width:220px;border-top:1px solid #1e293b;padding-top:4px;font-size:${Math.round(fmt.bodyFontSize * 0.9)}px;color:#475569">${esc(gi?.accountingOfficer) || 'Accounting Officer'}</div></div>`;
      sections.push(`<div class="section-page content-page"><h2 class="page-title">Accounting Officer's Report</h2>${aoRepHtml}${aoSigLine2}</div>`);
    }

    if (sections.length === 0) {
      this.snackBar.open('No sections selected for printing', 'Close', { duration: 3000, panelClass: 'snack-error' });
      printWindow.close();
      return;
    }

    printWindow.document.write(`<!DOCTYPE html><html><head><title>AFS Preamble - ${esc(gi?.municipalityName) || 'Print Preview'}</title>
      <style>
        body { font-family: 'Times New Roman', serif; color: #1e293b; margin: 0; padding: 0; font-size: ${fmt.bodyFontSize}px; }
        .section-page { page-break-after: always; }
        .section-page:last-child { page-break-after: auto; }
        .cover-page { text-align: center; padding: 120px 60px; }
        .cover-page h1 { font-size: ${fmt.titleFontSize}px; font-weight: bold; text-transform: uppercase; margin-bottom: 24px; }
        .cover-page h2 { font-size: ${Math.round(fmt.titleFontSize * 0.72)}px; font-weight: normal; margin-bottom: 12px; }
        .cover-page h3 { font-size: ${Math.round(fmt.titleFontSize * 0.58)}px; font-weight: normal; font-style: italic; }
        .content-page { padding: 40px 60px; }
        .page-title { font-size: ${Math.round(fmt.bodyFontSize * 1.38)}px; font-weight: bold; border-bottom: 2px solid #1a5276; padding-bottom: 6px; margin-bottom: 16px; color: #1a5276; }
        .content-page h3 { font-size: ${Math.round(fmt.bodyFontSize * 1.08)}px; font-weight: bold; color: #1a5276; margin: 16px 0 8px; background: #f1f5f9; padding: 6px 12px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: ${Math.round(fmt.bodyFontSize * 0.92)}px; }
        th { background: #1a5276; color: white; padding: 6px 12px; text-align: left; font-size: ${Math.round(fmt.bodyFontSize * 0.92)}px; }
        @media print { .no-print { display: none; } }
      </style>
    </head><body>
      <div class="no-print" style="padding:12px;background:#f1f5f9;text-align:center">
        <button onclick="window.print()" style="padding:8px 24px;font-size:14px;cursor:pointer;border:1px solid #94a3b8;border-radius:4px;background:#1a5276;color:white">Print</button>
        <button onclick="window.close()" style="padding:8px 24px;font-size:14px;cursor:pointer;border:1px solid #94a3b8;border-radius:4px;background:white;margin-left:8px">Close</button>
      </div>
      ${sections.join('\n')}
    </body></html>`);
    printWindow.document.close();
  }

  private loadAccountingPolicies(onDone?: (stage?: string) => void): void {
    if (!this.compilation?.financialYearId) {
      this.accountingPolicies = [];
      this.accountingPoliciesLoading = false;
      onDone?.();
      return;
    }
    this.accountingPoliciesLoading = true;
    this.api.get<any[]>(`/accounting-policies/${this.compilation.financialYearId}`).subscribe({
      next: (data) => {
        this.accountingPolicies = Array.isArray(data) ? data : [];
        this.accountingPoliciesLoading = false;
        onDone?.('Policies loaded');
      },
      error: () => {
        this.accountingPolicies = [];
        this.accountingPoliciesLoading = false;
        onDone?.();
      }
    });
  }

  get generalInfoMinFieldsMet(): boolean {
    if (!this.generalInfo) return false;
    const g = this.generalInfo;
    return !!(g.municipalityName && g.demarcationCode && g.accountingOfficer && g.cfo && g.reportingPeriodStart && g.reportingPeriodEnd);
  }

  get generalInfoComplete(): boolean {
    if (!this.generalInfo) return false;
    const g = this.generalInfo;
    return !!(g.municipalityName && g.demarcationCode && g.accountingOfficer && g.cfo && g.reportingPeriodStart && g.reportingPeriodEnd && g.registeredOffice && g.postalAddress && g.telephone && g.email && g.auditor);
  }

  get accountingPoliciesApproved(): boolean {
    if (this.accountingPolicies.length === 0) return false;
    const active = this.accountingPolicies.filter((p: any) => p.isActive !== false);
    return active.length > 0 && active.every((p: any) => p.approvalStatus === 'approved' || p.approvalStatus === 'published');
  }

  get readinessStages(): { label: string; icon: string; status: string; detail: string; action?: string; route?: string }[] {
    const stages: { label: string; icon: string; status: string; detail: string; action?: string; route?: string }[] = [];

    if (this.generalInfoLoading) {
      stages.push({ label: 'General Information', icon: 'info', status: 'loading', detail: 'Checking...' });
    } else if (this.generalInfoComplete) {
      stages.push({ label: 'General Information', icon: 'info', status: 'complete', detail: 'Complete' });
    } else if (this.generalInfoMinFieldsMet) {
      stages.push({ label: 'General Information', icon: 'info', status: 'partial', detail: 'Minimum fields met — full completion required for final AFS', action: 'Complete', route: '/general-information' });
    } else {
      stages.push({ label: 'General Information', icon: 'info', status: 'blocked', detail: 'Minimum required fields missing', action: 'Complete', route: '/general-information' });
    }

    if (this.accountingPoliciesLoading) {
      stages.push({ label: 'Accounting Policies', icon: 'policy', status: 'loading', detail: 'Checking...' });
    } else if (this.accountingPoliciesApproved) {
      stages.push({ label: 'Accounting Policies', icon: 'policy', status: 'complete', detail: 'Approved' });
    } else if (this.accountingPolicies.length > 0) {
      stages.push({ label: 'Accounting Policies', icon: 'policy', status: 'partial', detail: 'Pending approval — required for final AFS export', action: 'Review', route: '/accounting-policies' });
    } else {
      stages.push({ label: 'Accounting Policies', icon: 'policy', status: 'not_started', detail: 'Not configured', action: 'Set Up', route: '/accounting-policies' });
    }

    stages.push({ label: 'Compilation', icon: 'calculate', status: this.deriveCompilationStageStatus(), detail: this.deriveCompilationStageDetail() });

    if (this.hasTbData === null) {
      stages.push({ label: 'Data Sources (TB)', icon: 'table_chart', status: 'loading', detail: 'Checking...' });
    } else if (this.hasTbData) {
      stages.push({ label: 'Data Sources (TB)', icon: 'table_chart', status: 'complete', detail: 'TB data loaded' });
    } else {
      stages.push({ label: 'Data Sources (TB)', icon: 'table_chart', status: 'blocked', detail: 'No committed TB data', action: 'Import TB', route: '/tb-import-workbench' });
    }

    if (this.obStatusLoading) {
      stages.push({ label: 'Opening Balance', icon: 'balance', status: 'loading', detail: 'Checking...' });
    } else if (this.obStatus === 'continuity_matched_confirmed' || this.obStatus === 'confirmed_with_exception') {
      stages.push({ label: 'Opening Balance', icon: 'balance', status: 'complete', detail: 'Confirmed' });
    } else if (this.obStatus === 'superseded') {
      stages.push({ label: 'Opening Balance', icon: 'balance', status: 'blocked', detail: 'Baseline superseded \u2014 regenerate', action: 'Fix', route: '/opening-balance-control' });
    } else if (this.obStatus === 'baseline_selected' || this.obStatus === 'continuity_matched_unconfirmed' || this.obStatus === 'continuity_exception') {
      stages.push({ label: 'Opening Balance', icon: 'balance', status: 'partial', detail: 'Baseline pending confirmation', action: 'Review', route: '/opening-balance-control' });
    } else if (this.obStatus === 'unknown') {
      stages.push({ label: 'Opening Balance', icon: 'balance', status: 'blocked', detail: 'Status unavailable — verify before proceeding', action: 'Check', route: '/opening-balance-control' });
    } else {
      stages.push({ label: 'Opening Balance', icon: 'balance', status: 'not_started', detail: 'Not yet established', action: 'Set Up', route: '/opening-balance-control' });
    }

    if (!this.hasTbData) {
      stages.push({ label: 'Mapping', icon: 'map', status: 'not_started', detail: 'Awaiting Data Sources' });
    } else if ((this.compilation?.mappingCount ?? 0) > 0) {
      stages.push({ label: 'Mapping', icon: 'map', status: 'complete', detail: `${this.compilation?.mappingCount} mappings`, action: 'Review', route: '/mapping-workbench' });
    } else {
      stages.push({ label: 'Mapping', icon: 'map', status: 'blocked', detail: 'No mappings configured', action: 'Set Up', route: '/mapping-workbench' });
    }

    if (this.integrityLoading) {
      stages.push({ label: 'Integrity Checks', icon: 'fact_check', status: 'loading', detail: 'Running...' });
    } else if (this.integrityResult) {
      const checks = this.integrityResult.checks || this.integrityResult.results || [];
      const hasFailure = Array.isArray(checks) && checks.some((c: any) => c.status === 'FAIL' || c.status === 'fail' || c.status === 'ERROR');
      if (hasFailure) {
        stages.push({ label: 'Integrity Checks', icon: 'fact_check', status: 'blocked', detail: 'Failures detected', action: 'Review', route: '/integrity' });
      } else {
        stages.push({ label: 'Integrity Checks', icon: 'fact_check', status: 'complete', detail: 'All checks passed' });
      }
    } else if (!this.compilation?.lastCalculatedAt) {
      stages.push({ label: 'Integrity Checks', icon: 'fact_check', status: 'not_started', detail: 'Awaiting calculation' });
    } else {
      stages.push({ label: 'Integrity Checks', icon: 'fact_check', status: 'not_started', detail: 'Not yet run', action: 'Run', route: '/integrity' });
    }

    if (!this.compilation?.lastCalculatedAt) {
      stages.push({ label: 'Adjustments', icon: 'tune', status: 'not_started', detail: 'Awaiting calculation' });
    } else {
      stages.push({ label: 'Adjustments', icon: 'tune', status: 'partial', detail: 'Available', action: 'Review', route: '/adjustments' });
    }

    const exportReady = this.generalInfoComplete && this.accountingPoliciesApproved && this.hasTbData && (this.compilation?.mappingCount ?? 0) > 0 && this.compilation?.lastCalculatedAt;
    if (exportReady) {
      stages.push({ label: 'Preview & Export', icon: 'download', status: 'complete', detail: 'Ready', action: 'Export', route: '/exports' });
    } else {
      stages.push({ label: 'Preview & Export', icon: 'download', status: 'not_started', detail: 'Prerequisites not met' });
    }

    return stages;
  }

  navigateTo(route: string): void {
    if (route === '/mapping-workbench' && this.compilation?.id) {
      this.router.navigate([route], { queryParams: { compilationId: this.compilation.id } });
    } else {
      this.router.navigate([route]);
    }
  }

  private updateYearLabels() {
    if (!this.compilation?.financialYear) return;
    const fyLabel = this.compilation.financialYear.label;
    if (fyLabel) {
      this.currentYearLabel = fyLabel;
      const match = fyLabel.match(/(\d{4})\/(\d{2,4})/);
      if (match) {
        const startYear = parseInt(match[1], 10) - 1;
        const endYear = match[2].length === 4 ? parseInt(match[2], 10) - 1 : parseInt(match[1].slice(0, 2) + match[2], 10) - 1;
        this.priorYearLabel = `${startYear}/${String(endYear).slice(-2)}`;
      } else {
        this.priorYearLabel = 'Prior Year';
      }
    }
  }

  private tryAutoCalculate(): void {
    if (this.autoCalcTriggered || this.calculating || this.isLocked) return;
    if (!this.compilation || !this.hasTbData) return;
    if ((this.compilation.mappingCount ?? 0) === 0) return;
    const hasStaleItems = this.compilation.sections?.some(
      (s: any) => s.lineItems?.some((li: any) => li.isStale)
    );
    if (!this.compilation.lastCalculatedAt || hasStaleItems) {
      this.autoCalcTriggered = true;
      this.calculate();
    }
  }

  goBack() {
    this.router.navigate(['/compilations']);
  }

  calculate() {
    if (!this.compilation) return;
    this.calculating = true;
    this.calcError = null;
    this.calcProgress = 0;
    this.calcStage = 'Starting calculation...';
    this.startProgressPolling();
    this.api.post<Compilation>(`/compilations/${this.compilation.id}/calculate`, null, { timeout: 300000 }).subscribe({
      next: data => {
        this.stopProgressPolling();
        this.calcProgress = 100;
        this.calcStage = 'Calculation complete';
        this.compilation = data;
        this._drillThroughCache = null;
        this.updateYearLabels();
        this.extractValidationErrors(data);
        setTimeout(() => { this.calculating = false; }, 600);
        this.showPostCalculateBanner = true;
        this.checkIntegrity();
        this.snackBar.open('Calculation completed successfully', 'Close', { duration: 4000, panelClass: 'snack-success' });
      },
      error: (err) => {
        this.stopProgressPolling();
        this.calculating = false;
        this.autoCalcTriggered = false;
        this.calcProgress = 0;
        this.calcStage = '';
        const msg = err?.error?.message || err?.message || 'An unexpected error occurred during calculation';
        this.calcError = msg;
      }
    });
  }

  private startProgressPolling() {
    this.stopProgressPolling();
    if (!this.compilation) return;
    const id = this.compilation.id;
    this.calcProgressTimer = setInterval(() => {
      this.api.get<{ stage: string; percentage: number }>(`/compilations/${id}/calculate-progress`).subscribe({
        next: (p) => {
          if (p.percentage > this.calcProgress) {
            this.calcProgress = p.percentage;
          }
          if (p.stage && p.stage !== 'idle') {
            this.calcStage = p.stage;
          }
        },
        error: () => {}
      });
    }, 500);
  }

  private stopProgressPolling() {
    if (this.calcProgressTimer) {
      clearInterval(this.calcProgressTimer);
      this.calcProgressTimer = null;
    }
  }

  private deriveCompilationStageStatus(): string {
    if (!this.compilation) return 'loading';
    if (this.compilation.status === 'audited_locked') return 'complete';
    if (!this.compilation.lastCalculatedAt) return 'not_started';
    const hasStaleItems = this.compilation.sections?.some(
      (s: any) => s.lineItems?.some((li: any) => li.isStale)
    );
    if (hasStaleItems) return 'blocked';
    if (this.compilation.status === 'compiled_with_exceptions') return 'partial';
    return 'complete';
  }

  private deriveCompilationStageDetail(): string {
    if (!this.compilation) return 'Checking...';
    if (this.compilation.status === 'audited_locked') return 'Audited & Locked';
    if (!this.compilation.lastCalculatedAt) return 'Not yet calculated';
    const hasStaleItems = this.compilation.sections?.some(
      (s: any) => s.lineItems?.some((li: any) => li.isStale)
    );
    if (hasStaleItems) return 'Recalculation required — data has changed';
    if (this.compilation.status === 'compiled_with_exceptions') return 'Calculated with exceptions';
    return this.formatStatus(this.compilation.status);
  }

  formatStatus(status: string): string {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '';
  }

  isStepCompleted(index: number): boolean {
    if (!this.compilation) return false;
    const statusOrder = ['draft', 'in_review', 'approved', 'published'];
    const currentIndex = statusOrder.indexOf(this.compilation.status);
    return index < currentIndex;
  }

  formatAmount(value: number): string {
    if (value == null) return '—';
    const abs = Math.abs(value / 1000);
    const formatted = abs.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return value < 0 ? `(R ${formatted})` : `R ${formatted}`;
  }

  isZeroRow(item: any): boolean {
    const lt = item.templateLineItem?.lineType || item.lineType;
    if (lt === 'header' || lt === 'sub_header' || lt === 'spacer') return false;
    const cy = item.currentYearAmount ?? 0;
    const py = item.priorYearAmount ?? 0;
    return cy === 0 && py === 0;
  }

  openPreview() {
    if (!this.compilation) return;
    this.router.navigate(['/compilations', this.compilation.id, 'preview']);
  }

  openSectionIndex() {
    if (!this.compilation) return;
    this.router.navigate(['/compilations', this.compilation.id, 'index']);
  }

  scrollToNote(noteRef: string) {
    const notePanel = document.querySelector(`[data-note-number="${noteRef}"]`) as HTMLElement;
    if (notePanel) {
      notePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const header = notePanel.querySelector('mat-expansion-panel-header') as HTMLElement;
      if (header) {
        const isExpanded = notePanel.classList.contains('mat-expanded');
        if (!isExpanded) {
          setTimeout(() => header.click(), 400);
        }
      }
    }
  }

  scrollToFaceSection(noteNumber: string) {
    for (const fs of this.financialStatementSections) {
      const t = fs.title?.toLowerCase() || '';
      if (!t.includes('financial position') && !t.includes('financial performance')) continue;
      for (const li of fs.lineItems || []) {
        if (li.templateLineItem?.noteReference === noteNumber) {
          const el = document.getElementById('section-' + fs.id);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const isExpanded = el.classList.contains('mat-expanded');
            if (!isExpanded) {
              const header = el.querySelector('mat-expansion-panel-header') as HTMLElement;
              if (header) setTimeout(() => header.click(), 400);
            }
          }
          return;
        }
      }
    }
  }

  getNoteReconciliation(section: CompilationSection): { noteTotal: number; faceAmount: number; difference: number; noteTotalPY: number; faceAmountPY: number; differencePY: number } | null {
    if (!section.noteNumber || !section.lineItems?.length) return null;
    const totalRow = section.lineItems.find(li =>
      li.templateLineItem?.isTotal && li.templateLineItem?.lineType === 'total'
    );
    if (!totalRow) {
      const lastItem = section.lineItems[section.lineItems.length - 1];
      if (!lastItem?.templateLineItem?.isTotal && !lastItem?.templateLineItem?.isSubTotal) return null;
    }
    const noteTotal = totalRow ? totalRow.currentYearAmount : section.lineItems[section.lineItems.length - 1]?.currentYearAmount || 0;
    const noteTotalPY = totalRow ? totalRow.priorYearAmount : section.lineItems[section.lineItems.length - 1]?.priorYearAmount || 0;

    let faceAmount = 0;
    let faceAmountPY = 0;
    let faceFound = false;
    const fsSections = this.financialStatementSections.filter(fs => {
      const t = fs.title?.toLowerCase() || '';
      return t.includes('financial position') || t.includes('financial performance');
    });
    for (const fs of fsSections) {
      for (const li of fs.lineItems || []) {
        if (li.templateLineItem?.noteReference === section.noteNumber) {
          faceAmount = li.currentYearAmount || 0;
          faceAmountPY = li.priorYearAmount || 0;
          faceFound = true;
          break;
        }
      }
      if (faceFound) break;
    }
    if (!faceFound) return null;

    const difference = noteTotal - faceAmount;
    const differencePY = noteTotalPY - faceAmountPY;
    return { noteTotal, faceAmount, difference, noteTotalPY, faceAmountPY, differencePY };
  }

  scrollToSection(sectionId: string) {
    const el = document.getElementById('section-' + sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  getSectionAbbrev(title: string): string {
    if (!title) return '';
    const lower = title.toLowerCase();
    if (lower.includes('financial position')) return 'SOFP';
    if (lower.includes('financial performance')) return 'SOFPer';
    if (lower.includes('cash flow') || lower.includes('cashflow')) return 'CFS';
    if (lower.includes('net assets') || lower.includes('changes in net')) return 'SOCNA';
    if (lower.includes('comparison') || lower.includes('budget')) return 'Budget';
    if (title.length > 20) return title.substring(0, 18) + '...';
    return title;
  }

  openDrillThrough(item: CompilationSectionLineItem) {
    this.drillPanelLabel = item.templateLineItem?.label || 'Line Item';
    if (item.glBreakdown && item.glBreakdown.length > 0) {
      this.drillPanelEntries = item.glBreakdown;
      this.drillPanelOpen = true;
    } else if (item.glBreakdownCount && this.compilation) {
      this.drillPanelEntries = [];
      this.drillPanelOpen = true;
      this.api.get<any>(`/compilations/${this.compilation.id}/drill-through/${item.templateLineItem.id}`).subscribe({
        next: (data) => {
          item.glBreakdown = data.glBreakdown || [];
          this.drillPanelEntries = item.glBreakdown;
        },
        error: () => {
          this.snackBar.open('Failed to load GL breakdown', 'OK', { duration: 3000 });
        }
      });
    } else {
      this.drillPanelEntries = [];
      this.drillPanelOpen = true;
    }
  }

  openNoteDrillThrough(entries: any[], label: string) {
    this.drillPanelEntries = entries || [];
    this.drillPanelLabel = label;
    this.drillPanelOpen = true;
  }

  overrideDialogItem: CompilationSectionLineItem | null = null;
  overrideDialogAmount: number | null = null;
  overrideDialogReason = '';

  openOverrideDialog(item: CompilationSectionLineItem) {
    this.overrideDialogItem = item;
    this.overrideDialogAmount = item.currentYearAmount;
    this.overrideDialogReason = '';
  }

  cancelOverrideDialog() {
    this.overrideDialogItem = null;
  }

  submitOverride() {
    if (!this.overrideDialogItem || !this.compilation) return;
    if (this.overrideDialogAmount === null || this.overrideDialogAmount === undefined || isNaN(Number(this.overrideDialogAmount))) {
      this.snackBar.open('Please enter a valid numeric amount', 'OK', { duration: 3000 });
      return;
    }
    if (!this.overrideDialogReason.trim()) {
      this.snackBar.open('Please provide a reason for the override', 'OK', { duration: 3000 });
      return;
    }
    const lineItemId = this.overrideDialogItem.templateLineItem.id;
    this.api.put(`/compilations/${this.compilation.id}/line-items/${lineItemId}/override`, {
      amount: this.overrideDialogAmount,
      reason: this.overrideDialogReason
    }).subscribe({
      next: () => {
        this.snackBar.open('Override applied', 'OK', { duration: 3000 });
        this.overrideDialogItem = null;
        this.loadCompilation(this.compilation!.id);
      },
      error: () => this.snackBar.open('Failed to apply override', 'OK', { duration: 3000 })
    });
  }

  resetOverride(item: CompilationSectionLineItem) {
    if (!this.compilation) return;
    const lineItemId = item.templateLineItem.id;
    this.api.delete(`/compilations/${this.compilation.id}/line-items/${lineItemId}/override`).subscribe({
      next: () => {
        this.snackBar.open('Override removed — reverted to calculated amount', 'OK', { duration: 3000 });
        this.loadCompilation(this.compilation!.id);
      },
      error: () => this.snackBar.open('Failed to reset override', 'OK', { duration: 3000 })
    });
  }

  private _drillThroughCache: any[] | null = null;
  private _drillThroughCompId: string | null = null;

  getDrillThroughItems(): any[] {
    const compId = this.compilation?.id || null;
    if (this._drillThroughCompId === compId && this._drillThroughCache) {
      return this._drillThroughCache;
    }
    this._drillThroughCompId = compId;
    if (!this.compilation?.sections) {
      this._drillThroughCache = [];
      return [];
    }
    const items: any[] = [];
    let idx = 0;
    for (const section of this.compilation.sections) {
      for (const li of section.lineItems || []) {
        if (li.glBreakdown && li.glBreakdown.length > 0) {
          items.push({
            lineItemId: li.templateLineItem?.id || li.compilationLineItem?.id || idx++,
            label: li.templateLineItem?.label || 'Line Item',
            amount: li.currentYearAmount,
            priorYear: li.priorYearAmount,
            budget: li.budgetAmount,
            glEntries: li.glBreakdown,
          });
        }
      }
    }
    this._drillThroughCache = items;
    return items;
  }

  private buildExportRows(): Array<Record<string, string | number | null>> {
    if (!this.compilation?.sections) return [];
    const rows: Array<Record<string, string | number | null>> = [];
    for (const section of this.compilation.sections) {
      rows.push({
        'Section': section.title,
        'Note': '',
        'Label': '',
        [this.currentYearLabel]: null,
        [this.priorYearLabel]: null,
        'Budget': null,
        'Variance': null,
        'Variance %': null,
      });
      for (const item of section.lineItems || []) {
        const lt = item.templateLineItem?.lineType;
        if (lt === 'header' || lt === 'spacer') {
          rows.push({
            'Section': '',
            'Note': '',
            'Label': item.templateLineItem?.label || '',
            [this.currentYearLabel]: null,
            [this.priorYearLabel]: null,
            'Budget': null,
            'Variance': null,
            'Variance %': null,
          });
        } else {
          rows.push({
            'Section': '',
            'Note': item.templateLineItem?.noteReference || '',
            'Label': item.templateLineItem?.label || '',
            [this.currentYearLabel]: item.currentYearAmount != null ? item.currentYearAmount / 1000 : null,
            [this.priorYearLabel]: item.priorYearAmount != null ? item.priorYearAmount / 1000 : null,
            'Budget': item.budgetAmount != null ? item.budgetAmount / 1000 : null,
            'Variance': item.varianceAmount != null ? item.varianceAmount / 1000 : null,
            'Variance %': item.variancePercentage != null ? Math.round(item.variancePercentage * 10) / 10 : null,
          });
        }
      }
    }
    return rows;
  }

  startDocExport(format: 'pdf' | 'docx') {
    if (!this.compilation || this.exportingDoc) return;
    this.exportingDoc = true;
    this.api.post<{ id: string }>('/exports', {
      compilationId: this.compilation.id,
      format,
      options: { mode: (this.compilation.status === 'published' || this.compilation.status === 'approved') ? 'final' : 'draft' },
    }).subscribe({
      next: (job) => this.pollDocExport(job.id),
      error: () => { this.exportingDoc = false; },
    });
  }

  private pollDocExport(jobId: string) {
    const poll = () => {
      this.api.get<{ status: string; progress: number; fileName: string }>(`/exports/${jobId}/progress`).subscribe({
        next: (p) => {
          if (p.status === 'completed') {
            this.exportingDoc = false;
            this.api.getBlob(`/exports/${jobId}/download`).subscribe({
              next: (blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = p.fileName || 'export';
                link.click();
                URL.revokeObjectURL(url);
              },
            });
          } else if (p.status === 'failed') {
            this.exportingDoc = false;
          } else {
            this.pollTimer = setTimeout(poll, 1000);
          }
        },
        error: () => { this.exportingDoc = false; },
      });
    };
    this.pollTimer = setTimeout(poll, 500);
  }

  exportToCsv(): void {
    const rows = this.buildExportRows();
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row =>
        headers.map(h => {
          const val = row[h];
          if (val == null) return '';
          if (typeof val === 'number') return String(val);
          let str = String(val).replace(/"/g, '""');
          if (/^[=+\-@\t\r]/.test(str)) str = "'" + str;
          return `"${str}"`;
        }).join(',')
      )
    ];
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8' });
    this.downloadBlob(blob, `${this.compilation?.name || 'compilation'}.csv`);
  }

  exportToExcel(): void {
    if (!this.compilation?.sections) return;
    const wb = XLSX.utils.book_new();
    const allRows = this.buildExportRows();
    if (allRows.length > 0) {
      const ws = XLSX.utils.json_to_sheet(allRows);
      this.autoFitColumns(ws, allRows);
      XLSX.utils.book_append_sheet(wb, ws, 'All Sections');
    }
    for (const section of this.compilation.sections) {
      const sectionRows: Array<Record<string, string | number | null>> = [];
      for (const item of section.lineItems || []) {
        const lt = item.templateLineItem?.lineType;
        if (lt === 'header' || lt === 'spacer') {
          sectionRows.push({
            'Note': '',
            'Label': item.templateLineItem?.label || '',
            [this.currentYearLabel]: null,
            [this.priorYearLabel]: null,
            'Budget': null,
            'Variance': null,
            'Variance %': null,
          });
        } else {
          sectionRows.push({
            'Note': item.templateLineItem?.noteReference || '',
            'Label': item.templateLineItem?.label || '',
            [this.currentYearLabel]: item.currentYearAmount != null ? item.currentYearAmount / 1000 : null,
            [this.priorYearLabel]: item.priorYearAmount != null ? item.priorYearAmount / 1000 : null,
            'Budget': item.budgetAmount != null ? item.budgetAmount / 1000 : null,
            'Variance': item.varianceAmount != null ? item.varianceAmount / 1000 : null,
            'Variance %': item.variancePercentage != null ? Math.round(item.variancePercentage * 10) / 10 : null,
          });
        }
      }
      if (sectionRows.length > 0) {
        const sheetName = (section.title || 'Section').substring(0, 31).replace(/[[\]*?/\\]/g, '_');
        const ws = XLSX.utils.json_to_sheet(sectionRows);
        this.autoFitColumns(ws, sectionRows);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }
    }
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    this.downloadBlob(blob, `${this.compilation?.name || 'compilation'}.xlsx`);
  }

  private autoFitColumns(ws: XLSX.WorkSheet, data: Array<Record<string, any>>): void {
    if (data.length === 0) return;
    const keys = Object.keys(data[0]);
    ws['!cols'] = keys.map(key => {
      let maxWidth = key.length;
      for (const row of data) {
        const val = row[key];
        if (val != null) {
          maxWidth = Math.max(maxWidth, String(val).length);
        }
      }
      return { wch: Math.min(maxWidth + 2, 50) };
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  loadNotes() {
    if (!this.compilation) return;
    this.api.get<any[]>(`/compilations/${this.compilation.id}/notes`).subscribe({
      next: data => this.notes = data || [],
      error: () => this.notes = []
    });
  }

  generateNotes() {
    if (!this.compilation) return;
    this.generatingNotes = true;
    this.api.post<any>(`/compilations/${this.compilation.id}/generate-notes`).subscribe({
      next: () => {
        this.loadNotes();
        this.generatingNotes = false;
      },
      error: () => this.generatingNotes = false
    });
  }

  deleteNote(lineItemId: string) {
    if (!this.compilation) return;
    this.api.delete(`/compilations/${this.compilation.id}/notes/${lineItemId}`).subscribe({
      next: () => {
        this.notes = this.notes.filter(n => n.lineItemId !== lineItemId);
      }
    });
  }

  getAiInsights() {
    if (!this.compilation) return;
    this.loadingInsights = true;
    this.api.post<any>(`/compilations/${this.compilation.id}/ai-insights`).subscribe({
      next: data => {
        this.aiInsights = data;
        this.loadingInsights = false;
      },
      error: () => this.loadingInsights = false
    });
  }

  loadCompilationDocs(compilationId: string) {
    this.dms.getByContext('compilation', compilationId).subscribe({
      next: docs => this.compilationDocs = docs || [],
      error: () => this.compilationDocs = [],
    });
  }

  uploadCompilationDoc() {
    if (!this.compilation) return;
    const ref = this.dialog.open(DocumentUploadDialogComponent, {
      width: '600px',
      data: { contextType: 'compilation', contextId: this.compilation.id, preselectedType: 'afs_draft' },
    });
    ref.afterClosed().subscribe((result) => {
      if (result && this.compilation) this.loadCompilationDocs(this.compilation.id);
    });
  }

  downloadCompilationDoc(docId: string) {
    window.open(`/api/documents/${docId}/download`, '_blank');
  }

  formatDocSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  loadPriorYearValidation() {
    if (!this.compilation) return;
    this.loadingPYV = true;
    this.api.get<any>(`/compilations/${this.compilation.id}/prior-year-validation`).subscribe({
      next: data => {
        this.priorYearValidation = data;
        this.loadingPYV = false;
      },
      error: () => this.loadingPYV = false
    });
  }

  private extractValidationErrors(data: any) {
    const errors = data?.validationErrors || [];
    this.validationErrors = errors.map((e: any) => ({
      ruleId: e.ruleId || e.id || '',
      ruleName: e.ruleName || e.rule?.name || e.code || 'Rule',
      status: e.status || 'pass',
      message: e.message || '',
    }));
    this.validationPassCount = this.validationErrors.filter(e => e.status === 'pass').length;
    this.validationFailCount = this.validationErrors.filter(e => e.status === 'fail').length;
    this.validationWarnCount = this.validationErrors.filter(e => e.status === 'warning').length;
  }

  get landingState(): string {
    if (!this.compilation) return 'NONE';

    if (this.hasTbData === null) {
      return 'NONE';
    }

    if (this.hasTbData === false) {
      return 'NO_TB_DATA';
    }

    if ((this.compilation.mappingCount ?? 0) === 0) {
      return 'NO_MAPPINGS';
    }

    if (!this.compilation.lastCalculatedAt) {
      return 'READY_TO_CALCULATE';
    }

    if (this.integrityResult && !this.integrityLoading) {
      const checks = this.integrityResult.checks || this.integrityResult.results || [];
      const hasFailure = Array.isArray(checks) && checks.some(
        (c: any) => c.status === 'FAIL' || c.status === 'fail' || c.status === 'ERROR'
      );
      if (hasFailure) {
        return 'INTEGRITY_PENDING_OR_FAILING';
      }
    }
    if (this.integrityResult === null && !this.integrityLoading && this.compilation.lastCalculatedAt) {
      return 'INTEGRITY_PENDING_OR_FAILING';
    }

    if (this.compilation.status === 'draft' && this.compilation.lastCalculatedAt) {
      return 'READY_FOR_REVIEW';
    }

    return 'NONE';
  }

  transitionStatus(newStatus: string): void {
    if (!this.compilation || this.statusTransitioning) return;
    this.statusTransitioning = true;
    this.api.put<Compilation>(`/compilations/${this.compilation.id}/status`, {
      status: newStatus,
      userId: 'current',
    }).subscribe({
      next: (updated) => {
        this.compilation = { ...this.compilation!, status: updated.status || newStatus };
        this.statusTransitioning = false;
        this.snackBar.open(`Status updated to ${this.formatStatus(newStatus)}`, 'Close', { duration: 4000, panelClass: 'snack-success' });
      },
      error: (err) => {
        this.statusTransitioning = false;
        const msg = err?.error?.message || 'Status transition failed';
        this.snackBar.open(msg, 'Close', { duration: 6000, panelClass: 'snack-error' });
      }
    });
  }

  submitForReview(): void {
    this.transitionStatus('in_review');
  }

  approveCompilation(): void {
    this.transitionStatus('approved');
  }

  publishCompilation(): void {
    this.transitionStatus('published');
  }

  goToMappingWorkbench(): void {
    this.router.navigate(['/mapping-workbench'], {
      queryParams: { compilationId: this.compilation?.id },
    });
  }

  goToTbImport(): void {
    this.router.navigate(['/tb-import-workbench']);
  }

  goToIntegrity(): void {
    this.router.navigate(['/integrity']);
  }
}
