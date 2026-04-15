import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';

@Component({
  selector: 'app-data-conversion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-conversion.component.html',
  styleUrl: './data-conversion.component.css'
})
export class DataConversionComponent implements OnInit {
  conversionTypes: any[] = [];
  history: any[] = [];
  loading = true;
  step: 'list' | 'upload' | 'preview' | 'result' = 'list';
  selectedType: any = null;
  selectedFile: File | null = null;
  uploading = false;
  executing = false;
  previewData: any = null;
  importResult: any = null;
  totalImports = 0;

  constructor(private api: ApiService, private ui: UiService, public cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.loadTypes(); }

  loadTypes(): void {
    this.loading = true;
    let typesLoaded = false;
    let historyLoaded = false;

    this.api.get<any[]>('/conversion/types').subscribe({
      next: (data) => {
        this.conversionTypes = data || [];
        typesLoaded = true;
        if (historyLoaded) { this.loading = false; this.cdr.detectChanges(); }
      },
      error: () => {
        this.conversionTypes = [];
        typesLoaded = true;
        if (historyLoaded) { this.loading = false; this.cdr.detectChanges(); }
      }
    });

    this.api.get<any[]>('/conversion/history').subscribe({
      next: (data) => {
        this.history = data || [];
        this.totalImports = this.history.filter(h => h.status === 'success').length;
        historyLoaded = true;
        if (typesLoaded) { this.loading = false; this.cdr.detectChanges(); }
      },
      error: () => {
        this.history = [];
        historyLoaded = true;
        if (typesLoaded) { this.loading = false; this.cdr.detectChanges(); }
      }
    });
  }

  selectType(ct: any): void {
    this.selectedType = ct;
    this.selectedFile = null;
    this.previewData = null;
    this.importResult = null;
    this.step = 'upload';
    this.cdr.detectChanges();
  }

  goBack(): void {
    this.step = 'list';
    this.selectedType = null;
    this.selectedFile = null;
    this.previewData = null;
    this.importResult = null;
    this.loadTypes();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File): void {
    if (!file.name.match(/\.xlsx?$/i)) {
      this.ui.toast('error', 'Invalid File', 'Please upload an Excel file (.xlsx)');
      return;
    }
    this.selectedFile = file;
    this.uploading = true;
    this.cdr.detectChanges();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', this.selectedType.key);

    this.api.postFormData<any>('/conversion/preview', formData).subscribe({
      next: (data) => {
        this.previewData = data;
        this.uploading = false;
        this.step = 'preview';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.uploading = false;
        this.ui.toast('error', 'Preview Failed', err?.error?.error || 'Failed to analyze file');
        this.cdr.detectChanges();
      }
    });
  }

  executeConversion(): void {
    if (!this.selectedFile || !this.selectedType) return;
    this.executing = true;
    this.cdr.detectChanges();

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('type', this.selectedType.key);

    this.api.postFormData<any>('/conversion/execute', formData).subscribe({
      next: (data) => {
        this.importResult = data;
        this.executing = false;
        this.step = 'result';
        if (data.success) {
          this.ui.toast('success', 'Import Complete', `${data.inserted} records imported successfully`);
        } else {
          this.ui.toast('error', 'Import Failed', `No records were imported. ${data.skipped?.length || 0} rows skipped.`);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.executing = false;
        this.importResult = { success: false, inserted: 0, skipped: [], total: 0, error: err?.error?.error || 'Import failed' };
        this.step = 'result';
        this.ui.toast('error', 'Import Failed', err?.error?.error || 'Import failed');
        this.cdr.detectChanges();
      }
    });
  }

  getTabEntries(): [string, number][] {
    if (!this.previewData?.tabs) return [];
    return Object.entries(this.previewData.tabs) as [string, number][];
  }

  getMappingEntries(): [string, string][] {
    if (!this.previewData?.columnMapping) return [];
    return Object.entries(this.previewData.columnMapping) as [string, string][];
  }

  getSampleColumns(): string[] {
    if (!this.previewData?.sampleRows?.length) return [];
    return Object.keys(this.previewData.sampleRows[0]);
  }

  formatCell(value: any): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') {
      if (Number.isInteger(value)) return value.toString();
      return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
    return String(value);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' }) + ' ' +
           d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  }

  getTypeName(typeKey: string): string {
    const ct = this.conversionTypes.find(t => t.key === typeKey);
    return ct?.name || typeKey;
  }
}
