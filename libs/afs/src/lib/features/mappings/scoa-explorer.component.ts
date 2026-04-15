import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatBadgeModule } from '@angular/material/badge';
import { DragDropModule, CdkDragStart } from '@angular/cdk/drag-drop';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';

interface ScoaTreeNode {
  id: string;
  accountNumber: string;
  description: string;
  shortDescription?: string;
  level: number;
  postingLevel: boolean;
  segment: string;
  children: ScoaTreeNode[];
  expanded: boolean;
  visible: boolean;
  selected: boolean;
}

@Component({
  selector: 'app-scoa-explorer',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatFormFieldModule, MatInputModule, MatTooltipModule, MatButtonModule, MatChipsModule, MatProgressSpinnerModule, MatCheckboxModule, MatBadgeModule, DragDropModule],
  templateUrl: './scoa-explorer.component.html',
  styleUrl: './scoa-explorer.component.css',
})
export class ScoaExplorerComponent implements OnInit, OnChanges {
  @Input() chartVersionId: string = '';
  @Input() mappedAccountCodes = new Set<string>();
  @Input() hideAlreadyMapped = false;
  @Input() showOnlyWithBalance = false;
  @Input() templateId: string = '';
  @Output() accountSelected = new EventEmitter<any>();
  @Output() batchSelected = new EventEmitter<any[]>();

  segments = [
    { code: 'IA', label: 'Assets' },
    { code: 'IE', label: 'Expenditure' },
    { code: 'IL', label: 'Liabilities' },
    { code: 'IR', label: 'Revenue' },
    { code: 'IZ', label: 'Gains & Losses' },
    { code: 'LN', label: 'Net Assets' },
  ];

  activeSegment = 'IA';
  searchQuery = '';
  loading = false;
  treeNodes: ScoaTreeNode[] = [];
  selectedNodes: ScoaTreeNode[] = [];
  private allTreeNodes: ScoaTreeNode[] = [];
  private searchSubject = new Subject<string>();

  availableAccounts: any[] = [];
  filteredAccounts: any[] = [];
  groupedAccounts: { category: string; accounts: any[]; expanded: boolean }[] = [];
  activeGrapCategory = '';

  constructor(private api: ApiService) {
    this.searchSubject.pipe(debounceTime(150)).subscribe(q => {
      if (this.showOnlyWithBalance) {
        this.filterAvailableAccounts(q);
      } else {
        this.filterTree(q);
      }
    });
  }

  get postingCount(): number {
    if (this.showOnlyWithBalance) return this.availableAccounts.length;
    return this.countPosting(this.allTreeNodes);
  }

  get mappedOfTotal(): string {
    const posting = this.postingCount;
    const mapped = this.showOnlyWithBalance ? 0 : this.countMapped(this.allTreeNodes);
    return `${mapped}/${posting}`;
  }

  ngOnInit(): void {
    if (this.showOnlyWithBalance && this.templateId) {
      this.loadAvailableAccounts();
    } else {
      this.loadCurrentVersion();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['templateId'] && this.showOnlyWithBalance && this.templateId) {
      this.loadAvailableAccounts();
    }
    if (changes['chartVersionId'] && this.chartVersionId && !this.showOnlyWithBalance) {
      this.loadSegment();
    }
    if (changes['mappedAccountCodes']) {
      if (this.showOnlyWithBalance) {
        this.loadAvailableAccounts();
      } else if (this.hideAlreadyMapped && this.treeNodes.length > 0) {
        this.applyMappedFilter(this.treeNodes);
        this.refreshSelectedNodes();
      }
    }
  }

  loadAvailableAccounts(): void {
    if (!this.templateId) return;
    this.loading = true;
    this.api.get<any[]>(`/mappings/available-accounts/${this.templateId}`).subscribe({
      next: (accounts) => {
        this.availableAccounts = accounts;
        this.filterAvailableAccounts(this.searchQuery);
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  private filterAvailableAccounts(query: string): void {
    const q = (query || '').toLowerCase().trim();
    let filtered = this.availableAccounts;
    if (q) {
      filtered = filtered.filter(a =>
        (a.accountNumber || '').toLowerCase().includes(q) ||
        (a.description || '').toLowerCase().includes(q) ||
        (a.shortDescription || '').toLowerCase().includes(q) ||
        (a.voteDescription || '').toLowerCase().includes(q)
      );
    }
    if (this.activeGrapCategory) {
      filtered = filtered.filter(a => a.grapCategory === this.activeGrapCategory);
    }
    this.filteredAccounts = filtered;
    this.buildGroups();
  }

  private buildGroups(): void {
    const catMap = new Map<string, any[]>();
    for (const a of this.filteredAccounts) {
      const cat = a.grapCategory || 'Unclassified';
      if (!catMap.has(cat)) catMap.set(cat, []);
      catMap.get(cat)!.push(a);
    }
    const order = ['Assets', 'Liabilities', 'Net Assets', 'Revenue', 'Expenditure', 'Gains and Losses', 'Unclassified'];
    this.groupedAccounts = order
      .filter(c => catMap.has(c))
      .map(c => ({ category: c, accounts: catMap.get(c)!, expanded: true }));
    for (const [c, accs] of catMap) {
      if (!order.includes(c)) {
        this.groupedAccounts.push({ category: c, accounts: accs, expanded: true });
      }
    }
  }

  selectGrapCategory(cat: string): void {
    this.activeGrapCategory = this.activeGrapCategory === cat ? '' : cat;
    this.filterAvailableAccounts(this.searchQuery);
  }

  formatRand(value: number): string {
    if (value == null) return '—';
    const abs = Math.abs(value);
    const formatted = abs >= 1_000_000
      ? 'R ' + (abs / 1_000_000).toFixed(2) + 'M'
      : abs >= 1_000
      ? 'R ' + (abs / 1_000).toFixed(1) + 'K'
      : 'R ' + abs.toFixed(2);
    return value < 0 ? '(' + formatted + ')' : formatted;
  }

  toggleGroup(group: any): void {
    group.expanded = !group.expanded;
  }

  onAvailableAccountClick(account: any): void {
    account._selected = !account._selected;
    this.refreshSelectedAvailable();
  }

  private refreshSelectedAvailable(): void {
    this.selectedNodes = [];
    for (const a of this.availableAccounts) {
      if (a._selected) {
        this.selectedNodes.push({
          id: a.accountNumber,
          accountNumber: a.accountNumber,
          description: a.description,
          shortDescription: a.shortDescription || a.description,
          level: 1,
          postingLevel: true,
          segment: a.segment || '',
          children: [],
          expanded: false,
          visible: true,
          selected: true,
        });
      }
    }
  }

  clearAvailableSelection(): void {
    for (const a of this.availableAccounts) { a._selected = false; }
    this.selectedNodes = [];
  }

  getSelectedAvailableDragData(): any {
    return {
      __batch: true,
      items: this.availableAccounts.filter(a => a._selected).map(a => ({
        id: a.accountNumber,
        accountNumber: a.accountNumber,
        description: a.description,
        shortDescription: a.shortDescription || a.description,
        segment: a.segment || '',
        postingLevel: true,
      })),
    };
  }

  addSelectedAvailableToWorkspace(): void {
    const items = this.availableAccounts.filter(a => a._selected).map(a => ({
      id: a.accountNumber,
      accountNumber: a.accountNumber,
      description: a.description || a.shortDescription,
      shortDescription: a.shortDescription || a.description,
      segment: a.segment || '',
      postingLevel: true,
    }));
    if (items.length > 0) {
      this.batchSelected.emit(items);
      for (const a of this.availableAccounts) { a._selected = false; }
      this.selectedNodes = [];
    }
  }

  loadCurrentVersion(): void {
    if (this.chartVersionId) {
      this.loadSegment();
      return;
    }
    this.api.get<any>('/mscoa/versions/current').subscribe({
      next: (v) => {
        if (v?.id) {
          this.chartVersionId = v.id;
          this.loadSegment();
        }
      },
    });
  }

  selectSegment(code: string): void {
    this.activeSegment = code;
    this.clearSelection();
    this.loadSegment();
  }

  loadSegment(): void {
    if (!this.chartVersionId) return;
    this.loading = true;
    this.api.get<any[]>(`/mscoa/chart/${this.chartVersionId}/tree/${this.activeSegment}`, {
      maxLevel: '8',
    }).subscribe({
      next: (tree) => {
        this.allTreeNodes = this.mapTree(tree);
        this.treeNodes = this.allTreeNodes;
        if (this.treeNodes.length > 0) {
          this.treeNodes[0].expanded = true;
        }
        this.applyMappedFilter(this.treeNodes);
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  private mapTree(nodes: any[]): ScoaTreeNode[] {
    return nodes.map(n => ({
      id: n.id,
      accountNumber: n.accountNumber || '',
      description: n.description || '',
      shortDescription: n.shortDescription || n.description || '',
      level: n.level || 1,
      postingLevel: n.postingLevel || false,
      segment: n.segment || this.activeSegment,
      children: this.mapTree(n.children || []),
      expanded: false,
      visible: true,
      selected: false,
    }));
  }

  toggleNode(node: ScoaTreeNode, event: Event): void {
    event.stopPropagation();
    node.expanded = !node.expanded;
  }

  onNodeClick(node: ScoaTreeNode): void {
    if (node.postingLevel) {
      if (!this.mappedAccountCodes.has(node.accountNumber)) {
        this.toggleNodeSelection(node, !node.selected);
      }
    } else {
      node.expanded = !node.expanded;
    }
  }

  toggleNodeSelection(node: ScoaTreeNode, checked: boolean): void {
    node.selected = checked;
    this.refreshSelectedNodes();
  }

  clearSelection(): void {
    const clearNodes = (nodes: ScoaTreeNode[]) => {
      for (const n of nodes) {
        n.selected = false;
        clearNodes(n.children);
      }
    };
    clearNodes(this.treeNodes);
    this.selectedNodes = [];
  }

  private refreshSelectedNodes(): void {
    this.selectedNodes = [];
    const collect = (nodes: ScoaTreeNode[]) => {
      for (const n of nodes) {
        if (n.selected && n.postingLevel && !this.mappedAccountCodes.has(n.accountNumber)) {
          this.selectedNodes.push(n);
        }
        collect(n.children);
      }
    };
    collect(this.treeNodes);
  }

  getSelectedDragData(): any {
    return {
      __batch: true,
      items: this.selectedNodes.map(n => ({
        id: n.id,
        accountNumber: n.accountNumber,
        description: n.description,
        shortDescription: n.shortDescription,
        segment: n.segment,
        postingLevel: n.postingLevel,
      })),
    };
  }

  addSelectedToWorkspace(): void {
    if (this.selectedNodes.length === 0) return;
    const items = this.selectedNodes.map(n => ({
      id: n.id,
      accountNumber: n.accountNumber,
      description: n.description,
      shortDescription: n.shortDescription,
      segment: n.segment,
      postingLevel: n.postingLevel,
    }));
    this.batchSelected.emit(items);
    this.clearSelection();
  }

  onSearch(query: string): void {
    this.searchSubject.next(query);
  }

  clearSearch(): void {
    this.searchQuery = '';
    if (this.showOnlyWithBalance) {
      this.filterAvailableAccounts('');
    } else {
      this.filterTree('');
    }
  }

  private filterTree(query: string): void {
    const q = query.toLowerCase().trim();
    const markVisible = (nodes: ScoaTreeNode[]): boolean => {
      let anyVisible = false;
      for (const n of nodes) {
        const matches = !q ||
          n.accountNumber.toLowerCase().includes(q) ||
          (n.description || '').toLowerCase().includes(q) ||
          (n.shortDescription || '').toLowerCase().includes(q);
        const childVisible = markVisible(n.children);
        n.visible = matches || childVisible;
        if (n.visible && q) n.expanded = true;
        if (n.visible) anyVisible = true;
      }
      return anyVisible;
    };
    markVisible(this.treeNodes);
    if (!q) {
      const resetExpanded = (nodes: ScoaTreeNode[], depth: number) => {
        for (const n of nodes) {
          n.visible = true;
          n.expanded = depth === 0;
          resetExpanded(n.children, depth + 1);
        }
      };
      resetExpanded(this.treeNodes, 0);
    }
  }

  noReturnPredicate(): boolean {
    return false;
  }

  onDragStart(event: CdkDragStart, node: ScoaTreeNode): void {
  }

  onMultiDragStart(event: CdkDragStart): void {
  }

  private countPosting(nodes: ScoaTreeNode[]): number {
    let c = 0;
    for (const n of nodes) {
      if (n.postingLevel) c++;
      c += this.countPosting(n.children);
    }
    return c;
  }

  private countMapped(nodes: ScoaTreeNode[]): number {
    let c = 0;
    for (const n of nodes) {
      if (n.postingLevel && this.mappedAccountCodes.has(n.accountNumber)) c++;
      c += this.countMapped(n.children);
    }
    return c;
  }

  private applyMappedFilter(nodes: ScoaTreeNode[]): void {
    if (!this.hideAlreadyMapped) return;
    const hideIfMapped = (list: ScoaTreeNode[]): boolean => {
      let anyVisible = false;
      for (const n of list) {
        if (n.postingLevel && this.mappedAccountCodes.has(n.accountNumber)) {
          n.visible = false;
        } else {
          const childrenVisible = hideIfMapped(n.children);
          n.visible = n.postingLevel || childrenVisible;
        }
        if (n.visible) anyVisible = true;
      }
      return anyVisible;
    };
    hideIfMapped(nodes);
  }
}
