import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DocumentManagementService, DmsDocument } from './document-management.service';

export interface PickerDialogData {
  multiple?: boolean;
  documentType?: string;
  contextType?: string;
  contextId?: string;
}

@Component({
  selector: 'app-document-picker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTooltipModule,
  ],
  templateUrl: './document-picker.component.html',
})
export class DocumentPickerComponent implements OnInit {
  dialogRef = inject(MatDialogRef<DocumentPickerComponent>);
  data: PickerDialogData = inject(MAT_DIALOG_DATA, { optional: true }) || {};
  private dms = inject(DocumentManagementService);

  documents = signal<DmsDocument[]>([]);
  selectedDocs = signal<DmsDocument[]>([]);
  loading = signal(false);
  loadError = signal<string>('');
  searchQuery = '';
  typeFilter = '';

  ngOnInit() {
    if (this.data.documentType) this.typeFilter = this.data.documentType;
    this.doSearch();
  }

  doSearch() {
    this.loading.set(true);
    this.loadError.set('');
    // When AFS SharePoint storage is active (either the working-paper or the adjustments
    // toggle), "Working Paper" documents live in the UatAFS library — list them from there
    // (filtered client-side by the search box).
    const spActive = this.dms.isSharePointActive('afs') || this.dms.isSharePointActive('adjustments');
    console.log('[DocumentPicker] doSearch — SharePoint active?', spActive);
    if (spActive) {
      this.dms.listAllSpDocuments('afs').subscribe({
        next: (docs) => {
          const q = (this.searchQuery || '').toLowerCase().trim();
          this.documents.set(
            q ? docs.filter(d => (d.originalName || d.fileName || '').toLowerCase().includes(q)) : docs
          );
          this.loading.set(false);
        },
        error: (err) => {
          console.error('[DocumentPicker] SharePoint listing failed:', err);
          this.loadError.set(err?.message || 'Could not load documents from SharePoint. Make sure you are signed in to Microsoft.');
          this.documents.set([]);
          this.loading.set(false);
        },
      });
      return;
    }
    this.dms.search({
      search: this.searchQuery || undefined,
      documentType: this.typeFilter || undefined,
      limit: 50,
    }).subscribe({
      next: (res) => {
        this.documents.set(res.items || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  isSelected(doc: DmsDocument): boolean {
    return this.selectedDocs().some(d => d.id === doc.id);
  }

  toggleSelection(doc: DmsDocument) {
    if (this.data.multiple) {
      const current = this.selectedDocs();
      if (this.isSelected(doc)) {
        this.selectedDocs.set(current.filter(d => d.id !== doc.id));
      } else {
        this.selectedDocs.set([...current, doc]);
      }
    } else {
      this.selectedDocs.set([doc]);
    }
  }

  formatSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  confirm() {
    const sel = this.selectedDocs();
    this.dialogRef.close(this.data.multiple ? sel : sel[0]);
  }
}
