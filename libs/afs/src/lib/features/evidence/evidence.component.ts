import { Component, OnInit, signal, computed, inject, ElementRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { EvidenceDocument } from '../../core/models/interfaces';

@Component({
  selector: 'app-evidence',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './evidence.component.html',
  styleUrl: './evidence.component.css',
})
export class EvidenceComponent implements OnInit {
  private api = inject(ApiService);

  documents = signal<EvidenceDocument[]>([]);
  filteredDocuments = signal<EvidenceDocument[]>([]);
  loading = signal(false);
  isDragOver = signal(false);
  searchQuery = '';
  categoryFilter = '';

  uniqueCategories = computed(() => {
    const cats = this.documents()
      .map(d => d.category)
      .filter((c): c is string => !!c);
    return [...new Set(cats)];
  });

  totalSizeFormatted = computed(() => {
    const total = this.documents().reduce((sum, d) => sum + (d.fileSize || 0), 0);
    return this.formatSize(total);
  });

  ngOnInit() {
    this.loadDocuments();
  }

  loadDocuments() {
    this.loading.set(true);
    this.api.get<EvidenceDocument[]>('/evidence').subscribe({
      next: (data) => {
        this.documents.set(data);
        this.applyFilters();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  applyFilters() {
    let list = this.documents();
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(d =>
        (d.originalName || d.fileName || '').toLowerCase().includes(q) ||
        (d.category || '').toLowerCase().includes(q)
      );
    }
    if (this.categoryFilter) {
      list = list.filter(d => d.category === this.categoryFilter);
    }
    this.filteredDocuments.set(list);
  }

  formatSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const files = event.dataTransfer?.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        this.uploadFile(files[i]);
      }
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      for (let i = 0; i < input.files.length; i++) {
        this.uploadFile(input.files[i]);
      }
      input.value = '';
    }
  }

  uploadFile(file: File) {
    this.api.upload<EvidenceDocument>('/evidence/upload', file).subscribe({
      next: () => this.loadDocuments(),
    });
  }

  verifyDocument(id: string) {
    this.api.post(`/evidence/${id}/verify`).subscribe({
      next: () => this.loadDocuments(),
    });
  }
}
