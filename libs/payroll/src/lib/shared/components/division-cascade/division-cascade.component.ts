import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Division {
  id: number;
  name: string;
  code?: string | null;
  department_id: number;
  parent_id: number | null;
}

@Component({
  selector: 'app-division-cascade',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './division-cascade.component.html',
  styleUrl: './division-cascade.component.css'
})
export class DivisionCascadeComponent implements OnChanges {
  @Input() divisions: Division[] = [];
  @Input() departmentId: number | null = null;
  @Input() value: number | null = null;
  @Input() placeholder = '-- Select Division --';
  @Input() subPlaceholder = '-- Select Sub Division --';

  @Output() valueChange = new EventEmitter<number | null>();
  @Output() leafSelected = new EventEmitter<number | null>();

  breadcrumbs: Division[] = [];
  finalizedItem: Division | null = null;
  dropdownValue = '';

  @ViewChild('cascadeSelect') cascadeSelect?: ElementRef<HTMLSelectElement>;

  constructor(private cdr: ChangeDetectorRef) {}

  // Force the native <select> to display the placeholder option as selected.
  // Because our explicit (ngModelChange) overrides [(ngModel)]'s implicit
  // writeback, NgModel never sees the user's pick — so a reset to '' looks
  // like no change and never reaches the DOM. We first assign the picked
  // value into dropdownValue (so NgModel's tracked value matches the user's
  // pick), let Angular reconcile, then reset to '' so NgModel sees a real
  // change and writes '' back to the DOM. ViewChild fallback covers any
  // edge case where the directive still skips the write.
  private resetNativeSelect(pickedValue: string): void {
    this.dropdownValue = pickedValue;
    this.cdr.detectChanges();
    this.dropdownValue = '';
    this.cdr.detectChanges();
    Promise.resolve().then(() => {
      const el = this.cascadeSelect?.nativeElement;
      if (el && el.value !== '') {
        el.value = '';
        if (el.value !== '' && el.options.length > 0) {
          el.selectedIndex = 0;
        }
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] || changes['divisions'] || changes['departmentId']) {
      this.rebuildFromValue();
    }
  }

  private rebuildFromValue(): void {
    this.dropdownValue = '';
    if (!this.value) {
      this.breadcrumbs = [];
      this.finalizedItem = null;
      this.cdr.detectChanges();
      return;
    }
    const leaf = this.divisions.find(d => d.id === this.value);
    if (!leaf) {
      this.breadcrumbs = [];
      this.finalizedItem = null;
      this.cdr.detectChanges();
      return;
    }
    if (this.departmentId != null && leaf.department_id !== this.departmentId) {
      this.breadcrumbs = [];
      this.finalizedItem = null;
      this.value = null;
      this.valueChange.emit(null);
      this.cdr.detectChanges();
      return;
    }
    const trail: Division[] = [];
    const seen = new Set<number>();
    let cur: Division | undefined = leaf;
    while (cur && cur.parent_id != null && !seen.has(cur.id)) {
      seen.add(cur.id);
      const parent = this.divisions.find(d => d.id === cur!.parent_id);
      if (!parent) {
        console.warn(`[division-cascade] Orphan parent_id ${cur.parent_id} on division ${cur.id}; treating as top level.`);
        break;
      }
      trail.unshift(parent);
      cur = parent;
    }
    this.breadcrumbs = trail;
    this.finalizedItem = leaf;
    this.cdr.detectChanges();
  }

  get currentOptions(): Division[] {
    const parentId = this.breadcrumbs.length > 0
      ? this.breadcrumbs[this.breadcrumbs.length - 1].id
      : null;
    return this.divisions.filter(d => {
      if (this.departmentId != null && d.department_id !== this.departmentId) return false;
      if (parentId == null) {
        if (d.parent_id == null) return true;
        const orphan = !this.divisions.some(x => x.id === d.parent_id);
        return orphan;
      }
      return d.parent_id === parentId;
    });
  }

  hasChildren(div: Division): boolean {
    return this.divisions.some(d =>
      d.parent_id === div.id &&
      (this.departmentId == null || d.department_id === this.departmentId)
    );
  }

  formatDiv(d: Division): string {
    const code = d.code ? `${d.code} - ` : '';
    return `${code}${d.name}`;
  }

  onSelect(idStr: string): void {
    if (!idStr) return;
    const id = Number(idStr);
    const div = this.divisions.find(d => d.id === id);
    if (!div) return;
    if (this.hasChildren(div)) {
      this.breadcrumbs = [...this.breadcrumbs, div];
      this.finalizedItem = null;
      if (this.value != null) {
        this.value = null;
        this.valueChange.emit(null);
      }
      this.resetNativeSelect(idStr);
    } else {
      this.finalizedItem = div;
      this.value = div.id;
      this.valueChange.emit(div.id);
      this.leafSelected.emit(div.id);
      this.resetNativeSelect(idStr);
    }
  }

  onBreadcrumbClick(index: number): void {
    this.breadcrumbs = this.breadcrumbs.slice(0, index + 1);
    this.finalizedItem = null;
    if (this.value != null) {
      this.value = null;
      this.valueChange.emit(null);
    }
    this.resetNativeSelect('');
  }

  resetToRoot(): void {
    this.breadcrumbs = [];
    this.finalizedItem = null;
    if (this.value != null) {
      this.value = null;
      this.valueChange.emit(null);
    }
    this.resetNativeSelect('');
  }
}
