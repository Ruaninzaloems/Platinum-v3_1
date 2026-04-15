import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { PeriodFilterService } from '../../core/services/period-filter.service';
import { Adjustment, AdjustmentLine, ScoaLookupItem, PpidLookupItem } from '../../core/models/interfaces';
import { DocumentManagementService, DmsDocument } from '../document-management/document-management.service';
import { DocumentUploadDialogComponent } from '../document-management/document-upload-dialog.component';
import { DocumentPickerComponent } from '../document-management/document-picker.component';

@Component({
  selector: 'app-adjustments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatAutocompleteModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './adjustments.component.html',
  styleUrl: './adjustments.component.css',
})
export class AdjustmentsComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private dms = inject(DocumentManagementService);
  private router = inject(Router);
  private periodFilter = inject(PeriodFilterService);

  adjustments = signal<Adjustment[]>([]);
  selectedAdjustment = signal<Adjustment | null>(null);
  impactPreview = signal<any>(null);
  showCreateForm = signal(false);
  adjDocuments = signal<DmsDocument[]>([]);
  scoaResults = signal<ScoaLookupItem[]>([]);
  ppidResults = signal<PpidLookupItem[]>([]);

  hasCompilationContext = signal(false);
  compilationContextLoading = signal(true);

  private scoaSearch$ = new Subject<{ term: string; index: number }>();
  private ppidSearch$ = new Subject<{ term: string; index: number }>();
  private activeScoaIndex = 0;
  private activePpidIndex = 0;

  newAdjustment = { description: '', adjustmentType: 'pre-audit', effectiveDate: new Date() };
  newLines: Array<{ glAccountCode: string; description: string; debitAmount: number; creditAmount: number; ppid?: string; scoaShortDesc?: string; scoaSegment?: string; ppidDesc?: string }> = [
    { glAccountCode: '', description: '', debitAmount: 0, creditAmount: 0 },
    { glAccountCode: '', description: '', debitAmount: 0, creditAmount: 0 },
  ];

  ngOnInit() {
    this.checkCompilationContext();
    this.loadAdjustments();
    this.initScoaSearch();
    this.initPpidSearch();
  }

  private checkCompilationContext(): void {
    this.compilationContextLoading.set(true);
    const fyId = this.periodFilter.selectedFyId();
    this.api.get<any[]>('/compilations').subscribe({
      next: (compilations) => {
        this.hasCompilationContext.set(Array.isArray(compilations) && compilations.some(c =>
          (c.financialYearId === fyId || c.financialYear?.id === fyId) && c.status !== 'inactive'
        ));
        this.compilationContextLoading.set(false);
      },
      error: () => {
        this.hasCompilationContext.set(false);
        this.compilationContextLoading.set(false);
      }
    });
  }

  goToCompilations(): void {
    this.router.navigate(['/compilations']);
  }

  private initScoaSearch() {
    this.scoaSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged((a, b) => a.term === b.term),
      switchMap(({ term }) => this.api.get<ScoaLookupItem[]>(`/adjustments/lookup/scoa?search=${encodeURIComponent(term)}`)),
    ).subscribe({
      next: (results) => this.scoaResults.set(results),
      error: () => this.scoaResults.set([]),
    });
  }

  private initPpidSearch() {
    this.ppidSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged((a, b) => a.term === b.term),
      switchMap(({ term }) => this.api.get<PpidLookupItem[]>(`/adjustments/lookup/ppid?search=${encodeURIComponent(term)}`)),
    ).subscribe({
      next: (results) => this.ppidResults.set(results),
      error: () => this.ppidResults.set([]),
    });
  }

  onScoaSearch(event: Event, index: number) {
    const term = (event.target as HTMLInputElement).value;
    this.newLines[index].glAccountCode = term;
    this.activeScoaIndex = index;
    if (term.length >= 1) {
      this.scoaSearch$.next({ term, index });
    } else {
      this.scoaResults.set([]);
    }
  }

  onScoaSelected(event: any, index: number) {
    const itemCode = event.option.value;
    const item = this.scoaResults().find(r => r.itemCode === itemCode);
    if (item) {
      this.newLines[index].glAccountCode = item.itemCode;
      this.newLines[index].description = this.newLines[index].description || item.shortDescription;
      this.newLines[index].scoaShortDesc = item.shortDescription;
      this.newLines[index].scoaSegment = item.segment;
    }
  }

  onPpidSearch(event: Event, index: number) {
    const term = (event.target as HTMLInputElement).value;
    this.newLines[index].ppid = term;
    this.activePpidIndex = index;
    if (term.length >= 1) {
      this.ppidSearch$.next({ term, index });
    } else {
      this.ppidResults.set([]);
    }
  }

  onPpidSelected(event: any, index: number) {
    const ppid = event.option.value;
    const item = this.ppidResults().find(r => String(r.ppid) === String(ppid));
    if (item) {
      this.newLines[index].ppid = String(item.ppid);
      this.newLines[index].ppidDesc = item.projectName || item.description;
    }
  }

  loadAdjustments() {
    this.api.get<Adjustment[]>('/adjustments').subscribe({
      next: (data) => this.adjustments.set(data),
    });
  }

  countByStatus(status: string): number {
    return this.adjustments().filter(a => a.status === status).length;
  }

  calcDebitTotal(): number {
    return this.newLines.reduce((sum, l) => sum + (Number(l.debitAmount) || 0), 0);
  }

  calcCreditTotal(): number {
    return this.newLines.reduce((sum, l) => sum + (Number(l.creditAmount) || 0), 0);
  }

  isNewBalanced(): boolean {
    return Math.abs(this.calcDebitTotal() - this.calcCreditTotal()) < 0.01 && this.calcDebitTotal() > 0;
  }

  addLine() {
    this.newLines.push({ glAccountCode: '', description: '', debitAmount: 0, creditAmount: 0, ppid: '', scoaShortDesc: '', scoaSegment: '', ppidDesc: '' });
  }

  removeLine(index: number) {
    if (this.newLines.length > 2) {
      this.newLines.splice(index, 1);
    }
  }

  createAdjustment() {
    const body = {
      description: this.newAdjustment.description,
      adjustmentType: this.newAdjustment.adjustmentType,
      effectiveDate: this.newAdjustment.effectiveDate,
      lines: this.newLines.filter(l => l.glAccountCode).map(l => ({
        glAccountCode: l.glAccountCode,
        description: l.description,
        debitAmount: l.debitAmount,
        creditAmount: l.creditAmount,
        ppid: l.ppid || undefined,
      })),
    };
    this.api.post('/adjustments', body).subscribe({
      next: () => {
        this.showCreateForm.set(false);
        this.resetForm();
        this.loadAdjustments();
      },
    });
  }

  resetForm() {
    this.newAdjustment = { description: '', adjustmentType: 'pre-audit', effectiveDate: new Date() };
    this.newLines = [
      { glAccountCode: '', description: '', debitAmount: 0, creditAmount: 0 },
      { glAccountCode: '', description: '', debitAmount: 0, creditAmount: 0 },
    ];
  }

  selectAdjustment(adj: Adjustment) {
    this.api.get<Adjustment>(`/adjustments/${adj.id}`).subscribe({
      next: (data) => {
        this.selectedAdjustment.set(data);
        this.loadImpact(data.id);
        this.loadAdjDocuments(data.id);
      },
    });
  }

  loadImpact(id: string) {
    this.api.get(`/adjustments/${id}/impact`).subscribe({
      next: (data) => this.impactPreview.set(data),
      error: () => this.impactPreview.set(null),
    });
  }

  loadAdjDocuments(adjId: string) {
    this.dms.getByContext('adjustment', adjId).subscribe({
      next: (docs) => this.adjDocuments.set(docs),
      error: () => this.adjDocuments.set([]),
    });
  }

  uploadDocForAdj(adjId: string) {
    const ref = this.dialog.open(DocumentUploadDialogComponent, {
      width: '600px',
      data: { contextType: 'adjustment', contextId: adjId, preselectedType: 'adjustment_support' },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadAdjDocuments(adjId);
    });
  }

  linkDocToAdj(adjId: string) {
    const ref = this.dialog.open(DocumentPickerComponent, {
      width: '640px',
      data: { multiple: true, documentType: 'adjustment_support' },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadAdjDocuments(adjId);
    });
  }

  downloadDoc(docId: string) {
    window.open(`/api/documents/${docId}/download`, '_blank');
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  submitAdjustment(id: string) {
    this.api.post(`/adjustments/${id}/submit`).subscribe({ next: () => { this.selectedAdjustment.set(null); this.loadAdjustments(); } });
  }

  approveAdjustment(id: string) {
    this.api.post(`/adjustments/${id}/approve`).subscribe({ next: () => { this.selectedAdjustment.set(null); this.loadAdjustments(); } });
  }

  rejectAdjustment(id: string) {
    this.api.post(`/adjustments/${id}/reject`, { reason: 'Rejected' }).subscribe({ next: () => { this.selectedAdjustment.set(null); this.loadAdjustments(); } });
  }

  postAdjustment(id: string) {
    this.api.post(`/adjustments/${id}/post`).subscribe({ next: () => { this.selectedAdjustment.set(null); this.loadAdjustments(); } });
  }
}
