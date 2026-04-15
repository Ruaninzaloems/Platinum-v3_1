import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { DisclosureTreeNode, DisclosureLineItemNode } from '../../core/models/interfaces';

@Component({
  selector: 'app-disclosure-tree',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule, MatProgressSpinnerModule],
  templateUrl: './disclosure-tree.component.html',
  styleUrl: './disclosure-tree.component.css',
})
export class DisclosureTreeComponent implements OnChanges {
  @Input() templateId: string = '';
  @Input() compilationId: string = '';
  @Input() editable: boolean = false;
  @Output() nodeSelected = new EventEmitter<{ lineItem: DisclosureLineItemNode; section: DisclosureTreeNode }>();
  @Output() treeChanged = new EventEmitter<void>();

  treeData: DisclosureTreeNode[] = [];
  filteredTreeData: DisclosureTreeNode[] = [];
  expandedSections = new Set<string>();
  selectedLineItemId: string = '';
  loading = false;
  editMode = false;
  showInactive = false;
  showSearch = false;
  searchQuery = '';
  sectionTypeFilter = '';

  addingItemForSection: string = '';
  newItemLabel = '';
  addingSectionFor: string = '';
  newSectionTitle = '';

  constructor(private api: ApiService) {}

  private currentLoadId = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['templateId'] || changes['compilationId']) && this.templateId) {
      this.editMode = false;
      this.expandedSections.clear();
      this.selectedLineItemId = '';
      this.treeData = [];
      this.loadTree();
    }
  }

  loadTree(): void {
    if (!this.templateId) return;
    this.loading = true;
    const loadId = ++this.currentLoadId;
    let url = `/mappings/disclosure-tree/${this.templateId}`;
    if (this.compilationId) {
      url += `?compilationId=${encodeURIComponent(this.compilationId)}`;
    }
    this.api.get<DisclosureTreeNode[]>(url).subscribe({
      next: (data) => {
        if (loadId !== this.currentLoadId) return;
        this.treeData = data;
        this.applyInactiveFilter();
        this.loading = false;
        if (this.filteredTreeData.length > 0 && this.expandedSections.size === 0) {
          this.expandedSections.add(this.filteredTreeData[0].id);
        }
      },
      error: () => {
        if (loadId !== this.currentLoadId) return;
        this.loading = false;
      },
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let nodes = this.treeData;
    if (!this.showInactive) {
      nodes = this.filterActiveNodes(nodes);
    }
    if (this.sectionTypeFilter) {
      nodes = nodes.filter(n => (n as any).sectionType === this.sectionTypeFilter);
    }
    if (this.searchQuery.trim()) {
      nodes = this.filterBySearch(nodes, this.searchQuery.trim().toLowerCase());
    }
    this.filteredTreeData = nodes;
  }

  applyInactiveFilter(): void {
    this.applyFilters();
  }

  private filterActiveNodes(nodes: DisclosureTreeNode[]): DisclosureTreeNode[] {
    return nodes
      .map(n => {
        const filteredChildren = this.filterActiveNodes(n.children || []);
        const filteredLineItems = (n.lineItems || []).filter(li => li.isActive !== false);
        return { ...n, children: filteredChildren, lineItems: filteredLineItems };
      })
      .filter(n => n.isActive !== false || n.children.length > 0 || n.lineItems.length > 0);
  }

  private filterBySearch(nodes: DisclosureTreeNode[], query: string): DisclosureTreeNode[] {
    return nodes
      .map(n => {
        const filteredChildren = this.filterBySearch(n.children || [], query);
        const filteredLineItems = (n.lineItems || []).filter(li =>
          li.label?.toLowerCase().includes(query) ||
          li.code?.toLowerCase().includes(query) ||
          li.noteReference?.toLowerCase().includes(query)
        );
        const titleMatch = n.title?.toLowerCase().includes(query) ||
          n.noteNumber?.toLowerCase().includes(query);
        return { ...n, children: filteredChildren, lineItems: titleMatch ? n.lineItems : filteredLineItems };
      })
      .filter(n => {
        const titleMatch = n.title?.toLowerCase().includes(query) ||
          n.noteNumber?.toLowerCase().includes(query);
        return titleMatch || n.children.length > 0 || n.lineItems.length > 0;
      });
  }

  toggleSection(id: string): void {
    if (this.expandedSections.has(id)) {
      this.expandedSections.delete(id);
    } else {
      this.expandedSections.add(id);
    }
  }

  selectLineItem(li: DisclosureLineItemNode, section: DisclosureTreeNode): void {
    this.selectedLineItemId = li.id;
    this.nodeSelected.emit({ lineItem: li, section });
  }

  selectLineItemById(lineItemId: string): boolean {
    const result = this.findLineItemRecursive(this.treeData, lineItemId, []);
    if (!result) return false;
    for (const ancestorId of result.ancestorIds) {
      this.expandedSections.add(ancestorId);
    }
    this.expandedSections.add(result.section.id);
    this.selectedLineItemId = result.lineItem.id;
    this.nodeSelected.emit({ lineItem: result.lineItem, section: result.section });
    return true;
  }

  private findLineItemRecursive(
    nodes: DisclosureTreeNode[],
    lineItemId: string,
    ancestorIds: string[]
  ): { lineItem: DisclosureLineItemNode; section: DisclosureTreeNode; ancestorIds: string[] } | null {
    for (const node of nodes) {
      const li = node.lineItems.find(item => item.id === lineItemId);
      if (li) {
        return { lineItem: li, section: node, ancestorIds };
      }
      if (node.children) {
        const found = this.findLineItemRecursive(node.children, lineItemId, [...ancestorIds, node.id]);
        if (found) return found;
      }
    }
    return null;
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'mapped': return 'Fully mapped';
      case 'partial': return 'Partially mapped';
      case 'unmapped': return 'Unmapped';
      case 'system_default': return 'System default mapping';
      case 'locked': return 'Approved / Locked';
      default: return status;
    }
  }

  startAddItem(sectionId: string): void {
    this.addingItemForSection = sectionId;
    this.newItemLabel = '';
  }

  cancelAddItem(): void {
    this.addingItemForSection = '';
    this.newItemLabel = '';
  }

  saveNewLineItem(section: DisclosureTreeNode): void {
    if (!this.newItemLabel.trim()) return;
    const maxSort = section.lineItems.reduce((max, li) => Math.max(max, li.sortOrder || 0), 0);
    const code = `CUSTOM-${Date.now().toString(36).toUpperCase()}`;

    this.api.post(`/templates/sections/${section.id}/line-items`, {
      label: this.newItemLabel.trim(),
      code,
      lineType: 'data',
      dataType: 'currency',
      sortOrder: maxSort + 1,
      indentLevel: 0,
    }).subscribe({
      next: () => {
        this.cancelAddItem();
        this.loadTree();
        this.treeChanged.emit();
      },
    });
  }

  deleteLineItem(li: DisclosureLineItemNode, section: DisclosureTreeNode, event: Event): void {
    event.stopPropagation();
    if (!confirm(`Remove "${li.label}" from this template?`)) return;

    this.api.delete(`/templates/line-items/${li.id}`).subscribe({
      next: () => {
        this.loadTree();
        this.treeChanged.emit();
        if (this.selectedLineItemId === li.id) {
          this.selectedLineItemId = '';
        }
      },
    });
  }

  startAddSection(): void {
    this.addingSectionFor = 'root';
    this.newSectionTitle = '';
  }

  cancelAddSection(): void {
    this.addingSectionFor = '';
    this.newSectionTitle = '';
  }

  saveNewSection(): void {
    if (!this.newSectionTitle.trim() || !this.templateId) return;
    const maxSort = this.treeData.reduce((max, s) => Math.max(max, s.sortOrder || 0), 0);

    this.api.post(`/templates/${this.templateId}/sections`, {
      title: this.newSectionTitle.trim(),
      sectionType: 'notes',
      sortOrder: maxSort + 1,
      depth: 0,
    }).subscribe({
      next: () => {
        this.cancelAddSection();
        this.loadTree();
        this.treeChanged.emit();
      },
    });
  }

  deleteSection(node: DisclosureTreeNode, event: Event): void {
    event.stopPropagation();
    const itemCount = node.lineItems?.length || 0;
    const msg = itemCount > 0
      ? `Remove "${node.title}" and its ${itemCount} line item(s)?`
      : `Remove empty section "${node.title}"?`;
    if (!confirm(msg)) return;

    this.api.delete(`/templates/sections/${node.id}`).subscribe({
      next: () => {
        this.loadTree();
        this.treeChanged.emit();
      },
    });
  }
}
