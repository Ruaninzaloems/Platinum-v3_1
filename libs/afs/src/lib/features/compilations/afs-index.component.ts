import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-afs-index',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule, DragDropModule],
  templateUrl: './afs-index.component.html',
  styleUrl: './afs-index.component.css'
})
export class AfsIndexComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  compilationId = '';
  compilation: any = null;
  sections: any[] = [];
  loading = true;
  saving = false;
  expandedSectionId: string | null = null;

  ngOnInit() {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.compilationId = params['id'];
      this.loadData();
    });
  }

  loadData() {
    this.loading = true;
    this.api.get<any>(`/compilations/${this.compilationId}`).subscribe({
      next: data => {
        this.compilation = data;
        this.sections = (data.sections || [])
          .filter((s: any) => s.isActive !== false)
          .map((s: any) => ({
            ...s,
            lineItems: (s.lineItems || []).filter((li: any) => li.templateLineItem?.isActive !== false),
          }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  toggleExpand(sectionId: string) {
    this.expandedSectionId = this.expandedSectionId === sectionId ? null : sectionId;
  }

  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.sections, event.previousIndex, event.currentIndex);
  }

  saveOrder() {
    this.saving = true;
    const sectionIds = this.sections.map(s => s.id);
    this.api.patch<any>(`/compilations/${this.compilationId}/section-order`, { sectionIds }).subscribe({
      next: () => {
        this.saving = false;
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  goToPreview() {
    this.router.navigate(['/compilations', this.compilationId, 'preview']);
  }

  goBack() {
    this.router.navigate(['/compilations', this.compilationId]);
  }

  getSectionIcon(sectionType: string): string {
    switch (sectionType) {
      case 'front_matter': return 'article';
      case 'statement': return 'table_chart';
      case 'policies': return 'policy';
      case 'notes': return 'note';
      default: return 'description';
    }
  }

  getSectionTypeBadge(sectionType: string): string {
    switch (sectionType) {
      case 'front_matter': return 'Front Matter';
      case 'statement': return 'Financial Statement';
      case 'policies': return 'Accounting Policies';
      case 'notes': return 'Notes';
      default: return sectionType;
    }
  }

  estimatePages(section: any): number {
    const lineCount = section.lineItems?.length || 0;
    const type = section.sectionType;
    if (type === 'front_matter' || type === 'policies') {
      return Math.max(1, Math.ceil(lineCount / 25));
    }
    return Math.max(1, Math.ceil(lineCount / 35));
  }

  formatAmount(value: number): string {
    if (value == null || value === 0) return '-';
    const thousands = value / 1000;
    const abs = Math.abs(thousands);
    const formatted = abs.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return thousands < 0 ? `(${formatted})` : formatted;
  }
}
