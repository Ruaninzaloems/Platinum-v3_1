import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-constants',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './constants.component.html',
  styleUrl: './constants.component.css'
})
export class ConstantsComponent implements OnInit {
  tables: { table: string; label: string }[] = [];
  selectedTable = '';
  columns: string[] = [];
  rows: any[] = [];
  loading = true;
  loadingData = false;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.api.get<any>('/settings/constants').subscribe({
      next: (data) => {
        this.tables = data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onTableChange(): void {
    if (!this.selectedTable) {
      this.columns = [];
      this.rows = [];
      this.cdr.detectChanges();
      return;
    }
    this.loadingData = true;
    this.cdr.detectChanges();
    this.api.get<any>(`/settings/constants/${this.selectedTable}`).subscribe({
      next: (data) => {
        this.rows = data || [];
        this.columns = this.rows.length > 0 ? Object.keys(this.rows[0]) : [];
        this.loadingData = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.rows = [];
        this.columns = [];
        this.loadingData = false;
        this.cdr.detectChanges();
      }
    });
  }

  formatHeader(col: string): string {
    return col.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  formatCell(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  }
}
