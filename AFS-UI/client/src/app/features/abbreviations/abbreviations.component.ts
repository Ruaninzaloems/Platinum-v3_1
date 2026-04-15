import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { PeriodFilterService } from '../../core/services/period-filter.service';

interface Abbreviation {
  id?: string;
  abbreviation: string;
  fullForm: string;
  isActive: boolean;
  sortOrder: number;
  financialYearId?: string;
  tenantId?: string;
  isEditing?: boolean;
  isNew?: boolean;
}

@Component({
  selector: 'app-abbreviations',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './abbreviations.component.html',
  styleUrl: './abbreviations.component.css',
})
export class AbbreviationsComponent implements OnInit {
  private api = inject(ApiService);
  private snackBar = inject(MatSnackBar);
  private periodFilter = inject(PeriodFilterService);

  items = signal<Abbreviation[]>([]);
  loading = signal(false);

  private get fyId(): string {
    return this.periodFilter.selectedFyId() || '';
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    if (!this.fyId) return;
    this.loading.set(true);
    this.api.get<Abbreviation[]>(`/abbreviations/${this.fyId}`).subscribe({
      next: data => {
        this.items.set(data || []);
        this.loading.set(false);
      },
      error: () => {
        this.items.set([]);
        this.loading.set(false);
      },
    });
  }

  addRow() {
    const current = this.items();
    this.items.set([
      { abbreviation: '', fullForm: '', isActive: true, sortOrder: current.length, isEditing: true, isNew: true, financialYearId: this.fyId },
      ...current,
    ]);
  }

  editItem(item: Abbreviation) {
    item.isEditing = true;
    this.items.set([...this.items()]);
  }

  cancelEdit(item: Abbreviation) {
    if (item.isNew) {
      this.items.set(this.items().filter(i => i !== item));
    } else {
      item.isEditing = false;
      this.loadData();
    }
  }

  saveItem(item: Abbreviation) {
    if (!item.abbreviation?.trim() || !item.fullForm?.trim()) {
      this.snackBar.open('Abbreviation and Full Form are required', 'OK', { duration: 3000 });
      return;
    }

    if (item.isNew) {
      this.api.post('/abbreviations', {
        abbreviation: item.abbreviation.trim(),
        fullForm: item.fullForm.trim(),
        isActive: item.isActive,
        financialYearId: this.fyId,
        sortOrder: item.sortOrder,
      }).subscribe({
        next: () => {
          this.snackBar.open('Abbreviation added', 'OK', { duration: 2000 });
          this.loadData();
        },
        error: () => this.snackBar.open('Failed to add abbreviation', 'OK', { duration: 3000 }),
      });
    } else {
      this.api.put(`/abbreviations/${item.id}`, {
        abbreviation: item.abbreviation.trim(),
        fullForm: item.fullForm.trim(),
        isActive: item.isActive,
      }).subscribe({
        next: () => {
          this.snackBar.open('Abbreviation updated', 'OK', { duration: 2000 });
          this.loadData();
        },
        error: () => this.snackBar.open('Failed to update abbreviation', 'OK', { duration: 3000 }),
      });
    }
  }

  toggleActive(item: Abbreviation) {
    this.api.put(`/abbreviations/${item.id}/toggle`, {}).subscribe({
      next: () => {
        item.isActive = !item.isActive;
        this.items.set([...this.items()]);
      },
      error: () => this.snackBar.open('Failed to toggle abbreviation', 'OK', { duration: 3000 }),
    });
  }

  deleteItem(item: Abbreviation) {
    if (!confirm(`Delete abbreviation "${item.abbreviation}"?`)) return;
    this.api.delete(`/abbreviations/${item.id}`).subscribe({
      next: () => {
        this.snackBar.open('Abbreviation deleted', 'OK', { duration: 2000 });
        this.loadData();
      },
      error: () => this.snackBar.open('Failed to delete abbreviation', 'OK', { duration: 3000 }),
    });
  }

  seedDefaults() {
    if (!this.fyId) {
      this.snackBar.open('Please select a financial year first', 'OK', { duration: 3000 });
      return;
    }
    this.loading.set(true);
    this.api.post(`/abbreviations/${this.fyId}/seed`, {}).subscribe({
      next: (data: any) => {
        this.items.set(data || []);
        this.loading.set(false);
        this.snackBar.open('Default abbreviations seeded', 'OK', { duration: 2000 });
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Failed to seed defaults', 'OK', { duration: 3000 });
      },
    });
  }
}
