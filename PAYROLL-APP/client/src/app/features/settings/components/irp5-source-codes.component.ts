import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-irp5-source-codes',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './irp5-source-codes.component.html',
  styleUrl: './irp5-source-codes.component.css'
})
export class Irp5SourceCodesComponent implements OnInit {
  codes: any[] = [];
  filteredCodes: any[] = [];
  searchTerm = '';
  loading = true;
  typeFilter = '';

  typeLabels: Record<number, string> = {
    0: 'Not Specified',
    1: 'Income',
    2: 'Deductions',
    3: 'Employer Contributions',
    4: 'Fringe Benefits'
  };

  get types(): number[] {
    const set = new Set(this.codes.map(c => c.type));
    return Array.from(set).sort((a, b) => a - b);
  }

  get totalCount(): number { return this.codes.length; }
  get activeCount(): number { return this.codes.filter(c => c.enabled).length; }

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadCodes();
  }

  loadCodes(): void {
    this.loading = true;
    this.api.get<any[]>('/salary-transactions/irp5-codes?all=true').subscribe({
      next: (res: any) => {
        const data = res.data || res;
        this.codes = Array.isArray(data) ? data : [];
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.codes = [];
        this.filteredCodes = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    let list = this.codes;
    if (this.typeFilter !== '') {
      list = list.filter(c => c.type === +this.typeFilter);
    }
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(c =>
        c.code?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
      );
    }
    this.filteredCodes = list;
    this.cdr.detectChanges();
  }

  getTypeLabel(type: number): string {
    return this.typeLabels[type] || `Type ${type}`;
  }

  formatDate(d: string): string {
    if (!d) return '-';
    const dt = new Date(d);
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  formatPct(val: number): string {
    if (val == null) return '-';
    return val + '%';
  }
}
