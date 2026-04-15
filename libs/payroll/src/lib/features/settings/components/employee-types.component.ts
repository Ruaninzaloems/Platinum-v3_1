import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-employee-types',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './employee-types.component.html',
  styleUrl: './employee-types.component.css'
})
export class EmployeeTypesComponent implements OnInit {
  types: any[] = [];
  subtypes: any[] = [];
  filteredTypes: any[] = [];
  searchTerm = '';
  loading = true;
  showSubtypeModal = false;
  editSubtype: any = {};
  showTypeModal = false;
  editType: any = {};

  constructor(private api: ApiService, private ui: UiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    Promise.all([
      new Promise<any[]>((resolve) => {
        this.api.get<any[]>('/settings/employee-types').subscribe({
          next: (data) => resolve(data || []),
          error: () => resolve([])
        });
      }),
      new Promise<any[]>((resolve) => {
        this.api.get<any[]>('/settings/employee-subtypes').subscribe({
          next: (data) => resolve(data || []),
          error: () => resolve([])
        });
      })
    ]).then(([types, subtypes]) => {
      this.types = types;
      this.subtypes = subtypes;
      this.subtypeCountMap = {};
      for (const s of subtypes) {
        this.subtypeCountMap[s.employee_type_id] = (this.subtypeCountMap[s.employee_type_id] || 0) + 1;
      }
      this.applyFilter();
      this.loading = false; this.cdr.detectChanges();
    });
  }

  applyFilter(): void {
    const s = this.searchTerm.toLowerCase();
    if (!s) {
      this.filteredTypes = [...this.types];
    } else {
      this.filteredTypes = this.types.filter(t => {
        const typeMatch = (t.code || '').toLowerCase().includes(s) || (t.name || '').toLowerCase().includes(s);
        const subtypeMatch = this.getSubtypesForType(t.id).some(sub =>
          (sub.name || '').toLowerCase().includes(s) || (sub.code || '').toLowerCase().includes(s)
        );
        return typeMatch || subtypeMatch;
      });
    }
    this.cdr.detectChanges();
  }

  subtypeCountMap: Record<number, number> = {};

  getSubtypesForType(typeId: number): any[] {
    return this.subtypes.filter(s => s.employee_type_id === typeId);
  }

  getFilteredSubtypesForType(typeId: number): any[] {
    const subs = this.getSubtypesForType(typeId);
    if (!this.searchTerm) return subs;
    const s = this.searchTerm.toLowerCase();
    const type = this.types.find(t => t.id === typeId);
    const typeMatches = type && (
      (type.code || '').toLowerCase().includes(s) ||
      (type.name || '').toLowerCase().includes(s)
    );
    if (typeMatches) return subs;
    return subs.filter(sub =>
      (sub.name || '').toLowerCase().includes(s) || (sub.code || '').toLowerCase().includes(s)
    );
  }

  getSubtypeCount(typeId: number): number {
    return this.subtypeCountMap[typeId] || 0;
  }

  get activeSubtypeCount(): number {
    return this.subtypes.filter(s => s.enabled !== false).length;
  }

  get disabledSubtypeCount(): number {
    return this.subtypes.filter(s => s.enabled === false).length;
  }

  openTypeModal(item: any): void {
    this.editType = { ...item };
    this.showTypeModal = true;
    this.cdr.detectChanges();
  }

  saveType(): void {
    if (!this.editType.working_hours_per_month || Number(this.editType.working_hours_per_month) <= 0) {
      this.ui.toast('error', 'Validation', 'Working Hours Per Month must be greater than zero');
      return;
    }
    if (!this.editType.working_days_per_month || Number(this.editType.working_days_per_month) <= 0) {
      this.ui.toast('error', 'Validation', 'Working Days Per Month must be greater than zero');
      return;
    }
    this.api.put(`/settings/employee-types/${this.editType.id}`, this.editType).subscribe({
      next: () => {
        this.ui.toast('success', 'Saved', `${this.editType.name} updated`);
        this.showTypeModal = false;
        this.load();
      },
      error: (err: any) => this.ui.toast('error', 'Error', err?.error?.error?.message || 'Failed to save')
    });
  }

  openSubtypeModal(item?: any): void {
    this.editSubtype = item ? { ...item } : {
      employee_type_id: this.types.length > 0 ? this.types[0].id : null,
      code: '', name: '', description: '', enabled: true,
      exclude_uif: false, exclude_sdl: false, enable_bonus: false
    };
    this.showSubtypeModal = true;
  }

  saveSubtype(): void {
    if (!this.editSubtype.employee_type_id || !this.editSubtype.code || !this.editSubtype.name) {
      this.ui.toast('error', 'Validation', 'Type, code and name are required');
      return;
    }
    const obs = this.editSubtype.id
      ? this.api.put(`/settings/employee-subtypes/${this.editSubtype.id}`, this.editSubtype)
      : this.api.post('/settings/employee-subtypes', this.editSubtype);
    obs.subscribe({
      next: () => { this.ui.toast('success', 'Saved', `Sub type ${this.editSubtype.name} saved`); this.showSubtypeModal = false; this.load(); },
      error: () => this.ui.toast('error', 'Error', 'Failed to save')
    });
  }

  async deleteSubtype(item: any): Promise<void> {
    const confirmed = await this.ui.confirm({ title: 'Delete Sub Type', message: `Delete ${item.name} (${item.code})? This cannot be undone.`, danger: true });
    if (confirmed) {
      this.api.delete(`/settings/employee-subtypes/${item.id}`).subscribe({
        next: () => { this.ui.toast('success', 'Deleted', `${item.name} removed`); this.load(); },
        error: () => this.ui.toast('error', 'Error', 'Failed to delete')
      });
    }
  }
}
