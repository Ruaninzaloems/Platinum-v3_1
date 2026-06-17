import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  HostListener,
  ViewChild,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-searchable-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './searchable-picker.component.html',
  styleUrl: './searchable-picker.component.css'
})
export class SearchablePickerComponent implements OnChanges {
  @Input() items: any[] = [];
  @Input() value: string | number = '';
  @Input() idField = 'id';
  @Input() primaryText: (item: any) => string = (i) => String(i?.[this.idField] ?? '');
  @Input() secondaryText: (item: any) => string = () => '';
  @Input() searchableFields: string[] = [];
  @Input() loading = false;
  @Input() disabled = false;
  @Input() placeholder = '-- Select --';
  @Input() searchPlaceholder = 'Type to filter...';
  @Input() emptyText = 'No items available';
  @Input() noMatchText = 'No matches';
  @Input() allowClear = true;
  @Input() clearText = 'Clear selection';
  @Input() showCount = false;
  @Input() countNoun = 'items';

  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  open = false;
  search = '';
  highlightIndex = -1;

  constructor(private host: ElementRef, private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items'] || changes['value']) {
      this.highlightIndex = -1;
    }
  }

  get selectedItem(): any {
    if (this.value === '' || this.value == null) return null;
    return this.items.find(i => String(i?.[this.idField]) === String(this.value)) || null;
  }

  get triggerLabel(): string {
    const sel = this.selectedItem;
    return sel ? this.primaryText(sel) : this.placeholder;
  }

  get totalCount(): number {
    return this.items?.length ?? 0;
  }

  get filteredCount(): number {
    return this.filteredItems.length;
  }

  get triggerCountLabel(): string {
    if (!this.showCount || this.loading || this.selectedItem) return '';
    return `${this.totalCount} ${this.countNoun}`;
  }

  get popoverCountLabel(): string {
    if (!this.showCount) return '';
    if (this.loading) return '';
    const total = this.totalCount;
    const filtered = this.filteredCount;
    if (this.search.trim() && filtered !== total) {
      return `${filtered} of ${total} ${this.countNoun}`;
    }
    return `${total} ${this.countNoun}`;
  }

  get filteredItems(): any[] {
    const term = this.search.trim().toLowerCase();
    if (!term) return this.items;
    return this.items.filter(item => this.matchesSearch(item, term));
  }

  private matchesSearch(item: any, term: string): boolean {
    if (this.searchableFields.length > 0) {
      for (const field of this.searchableFields) {
        const v = item?.[field];
        if (v != null && String(v).toLowerCase().includes(term)) return true;
      }
    }
    const primary = this.primaryText(item);
    if (primary && primary.toLowerCase().includes(term)) return true;
    const secondary = this.secondaryText(item);
    if (secondary && secondary.toLowerCase().includes(term)) return true;
    return false;
  }

  toggleOpen(): void {
    if (this.disabled) return;
    this.open = !this.open;
    if (this.open) {
      this.search = '';
      this.highlightIndex = this.computeInitialHighlight();
      setTimeout(() => this.searchInput?.nativeElement.focus(), 0);
    }
    this.cdr.detectChanges();
  }

  close(): void {
    if (!this.open) return;
    this.open = false;
    this.search = '';
    this.highlightIndex = -1;
    this.cdr.detectChanges();
  }

  private computeInitialHighlight(): number {
    if (this.value === '' || this.value == null) return -1;
    return this.items.findIndex(i => String(i?.[this.idField]) === String(this.value));
  }

  selectItem(item: any): void {
    if (!item) return;
    const id = item[this.idField];
    this.valueChange.emit(id == null ? '' : String(id));
    this.close();
  }

  clearSelection(event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.valueChange.emit('');
    this.close();
  }

  get canClear(): boolean {
    return this.allowClear && this.value !== '' && this.value != null;
  }

  isSelected(item: any): boolean {
    return this.value !== '' && this.value != null && String(item?.[this.idField]) === String(this.value);
  }

  trackById = (_: number, item: any): any => item?.[this.idField];

  onSearchKeydown(event: KeyboardEvent): void {
    const list = this.filteredItems;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (list.length === 0) return;
      this.highlightIndex = (this.highlightIndex + 1) % list.length;
      this.scrollHighlightIntoView();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (list.length === 0) return;
      this.highlightIndex = this.highlightIndex <= 0 ? list.length - 1 : this.highlightIndex - 1;
      this.scrollHighlightIntoView();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (this.highlightIndex >= 0 && this.highlightIndex < list.length) {
        this.selectItem(list[this.highlightIndex]);
      } else if (list.length === 1) {
        this.selectItem(list[0]);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }

  onSearchChange(): void {
    this.highlightIndex = this.filteredItems.length > 0 ? 0 : -1;
  }

  private scrollHighlightIntoView(): void {
    setTimeout(() => {
      const el = this.host.nativeElement.querySelector('.sp-option.is-highlighted');
      if (el) el.scrollIntoView({ block: 'nearest' });
    }, 0);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open) return;
    if (!this.host.nativeElement.contains(event.target)) {
      this.close();
    }
  }
}
