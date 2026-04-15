import { Component, OnChanges, SimpleChanges, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { CIDMS_LEVEL_CONFIG, CidmsChainResult } from '../../core/cidms-level-config';

@Component({
  selector: 'app-cidms-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './cidms-picker.component.html',
  styleUrls: ['./cidms-picker.component.css']
})
export class CidmsPickerComponent implements OnChanges {
  @Input() isOpen = false;
  @Output() selected = new EventEmitter<CidmsChainResult>();
  @Output() closed = new EventEmitter<void>();

  loading = signal(true);
  filterText = signal('');

  l0 = signal<any[]>([]);
  l1 = signal<any[]>([]);
  l2 = signal<any[]>([]);
  l3 = signal<any[]>([]);
  l4 = signal<any[]>([]);
  l5 = signal<any[]>([]);
  l6 = signal<any[]>([]);

  expanded = signal<Set<string>>(new Set());

  selectedNodeKey = signal<string | null>(null);
  selectedItem: any = null;
  selectedLevelIdx = -1;
  selectedIsLeaf = false;

  levelConfig = CIDMS_LEVEL_CONFIG;

  private hasLoadedData = false;

  constructor(private api: ApiService) {}

  ngOnChanges(changes: SimpleChanges) {
    var self = this;
    if (changes['isOpen'] && self.isOpen && !self.hasLoadedData) {
      self.hasLoadedData = true;
      self.loading.set(true);
      forkJoin([
        self.api.getCidmsAccountingGroups(),
        self.api.getCidmsAccountingSubGroups(),
        self.api.getCidmsClasses(),
        self.api.getCidmsGroupTypes(),
        self.api.getCidmsAssetTypes(),
        self.api.getCidmsComponentTypes(),
        self.api.getCidmsSubComponentTypes()
      ]).subscribe({
        next: function(results: any[]) {
          self.l0.set(results[0] || []);
          self.l1.set(results[1] || []);
          self.l2.set(results[2] || []);
          self.l3.set(results[3] || []);
          self.l4.set(results[4] || []);
          self.l5.set(results[5] || []);
          self.l6.set(results[6] || []);
          self.loading.set(false);
        },
        error: function() {
          self.hasLoadedData = false;
          self.loading.set(false);
        }
      });
    }
    if (changes['isOpen'] && self.isOpen) {
      self.selectedItem = null;
      self.selectedLevelIdx = -1;
      self.selectedIsLeaf = false;
      self.selectedNodeKey.set(null);
      self.filterText.set('');
      self.expanded.set(new Set());
    }
  }

  visibleNodes = computed(function(this: CidmsPickerComponent) {
    var expandedSet = this.expanded();
    var data: any[][] = [
      this.l0(), this.l1(), this.l2(), this.l3(), this.l4(), this.l5(), this.l6()
    ];
    var result: any[] = [];
    var cfg = CIDMS_LEVEL_CONFIG;

    function hasChildrenAtLevel(levelIdx: number, parentId: number): boolean {
      if (levelIdx >= 7) { return false; }
      var arr = data[levelIdx];
      for (var j = 0; j < arr.length; j++) {
        if (arr[j][cfg[levelIdx].parentKey!] === parentId) { return true; }
      }
      return false;
    }

    function getChildren(levelIdx: number, parentId: number): any[] {
      if (levelIdx >= 7) { return []; }
      var arr = data[levelIdx];
      var children: any[] = [];
      for (var j = 0; j < arr.length; j++) {
        if (arr[j][cfg[levelIdx].parentKey!] === parentId) { children.push(arr[j]); }
      }
      return children;
    }

    function addItems(items: any[], levelIdx: number, depth: number): void {
      var isLastLevel = levelIdx === 6;
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var nodeKey = levelIdx + '_' + item[cfg[levelIdx].idKey];
        var isExpanded = expandedSet.has(nodeKey);
        var hasChildren = !isLastLevel && hasChildrenAtLevel(levelIdx + 1, item[cfg[levelIdx].idKey]);
        var childItems: any[] = [];
        if (hasChildren) { childItems = getChildren(levelIdx + 1, item[cfg[levelIdx].idKey]); }
        result.push({
          item: item,
          levelIdx: levelIdx,
          depth: depth,
          nodeKey: nodeKey,
          isExpanded: isExpanded,
          hasChildren: hasChildren,
          childCount: childItems.length,
          isLeaf: !hasChildren
        });
        if (isExpanded && hasChildren) { addItems(childItems, levelIdx + 1, depth + 1); }
      }
    }

    addItems(data[0], 0, 0);
    return result;
  }.bind(this));

  filteredNodes = computed(function(this: CidmsPickerComponent) {
    var q = this.filterText().toLowerCase().trim();
    if (!q) { return []; }
    var data: any[][] = [
      this.l0(), this.l1(), this.l2(), this.l3(), this.l4(), this.l5(), this.l6()
    ];
    var result: any[] = [];
    var cfg = CIDMS_LEVEL_CONFIG;
    for (var lvl = 0; lvl < 7; lvl++) {
      var arr = data[lvl];
      for (var i = 0; i < arr.length; i++) {
        var desc = (arr[i][cfg[lvl].descKey] || '').toLowerCase();
        if (desc.includes(q)) {
          result.push({
            item: arr[i],
            levelIdx: lvl,
            nodeKey: lvl + '_' + arr[i][cfg[lvl].idKey]
          });
        }
      }
    }
    return result;
  }.bind(this));

  isFiltering = computed(function(this: CidmsPickerComponent) {
    return this.filterText().trim().length > 0;
  }.bind(this));

  onTreeRowClick(node: any) {
    if (node.hasChildren) {
      this.toggleExpand(node.nodeKey);
    } else {
      this.selectNode(node.item, node.levelIdx, node.nodeKey, true);
      this.confirmSelection();
    }
  }

  onTreeRowDblClick(node: any) {
    if (!node.hasChildren) {
      this.selectNode(node.item, node.levelIdx, node.nodeKey, true);
      this.confirmSelection();
    }
  }

  onFilterRowClick(node: any) {
    var data: any[][] = [
      this.l0(), this.l1(), this.l2(), this.l3(), this.l4(), this.l5(), this.l6()
    ];
    var cfg = CIDMS_LEVEL_CONFIG;
    var lvl = node.levelIdx;
    var isLeaf = true;
    if (lvl < 6) {
      var nextArr = data[lvl + 1];
      var itemId = node.item[cfg[lvl].idKey];
      for (var i = 0; i < nextArr.length; i++) {
        if (nextArr[i][cfg[lvl + 1].parentKey!] === itemId) {
          isLeaf = false;
          break;
        }
      }
    }
    if (isLeaf) {
      this.selectNode(node.item, node.levelIdx, node.nodeKey, true);
      this.confirmSelection();
    }
  }

  toggleExpand(nodeKey: string) {
    var current = new Set(this.expanded());
    if (current.has(nodeKey)) {
      current.delete(nodeKey);
    } else {
      current.add(nodeKey);
    }
    this.expanded.set(current);
  }

  selectNode(item: any, levelIdx: number, nodeKey: string, isLeaf: boolean = false) {
    this.selectedItem = item;
    this.selectedLevelIdx = levelIdx;
    this.selectedIsLeaf = isLeaf;
    this.selectedNodeKey.set(nodeKey);
  }

  confirmSelection() {
    if (!this.selectedItem || this.selectedLevelIdx < 0 || !this.selectedIsLeaf) { return; }
    var chain = this.buildChain(this.selectedItem, this.selectedLevelIdx);
    this.selected.emit(chain);
    this.closed.emit();
  }

  cancel() {
    this.closed.emit();
  }

  private buildChain(selectedItem: any, selectedLevelIdx: number): CidmsChainResult {
    var data: any[][] = [
      this.l0(), this.l1(), this.l2(), this.l3(), this.l4(), this.l5(), this.l6()
    ];
    var cfg = CIDMS_LEVEL_CONFIG;
    var levelIds: Array<number | null> = [null, null, null, null, null, null, null];
    var levelDescs: string[] = ['', '', '', '', '', '', ''];

    levelIds[selectedLevelIdx] = selectedItem[cfg[selectedLevelIdx].idKey];
    levelDescs[selectedLevelIdx] = selectedItem[cfg[selectedLevelIdx].descKey] || '';

    var currentItem = selectedItem;
    var currentLvl = selectedLevelIdx;
    while (currentLvl > 0) {
      var parentKey = cfg[currentLvl].parentKey;
      if (!parentKey) { break; }
      var parentId = currentItem[parentKey];
      var parentData = data[currentLvl - 1];
      var parentItem: any = null;
      for (var i = 0; i < parentData.length; i++) {
        if (parentData[i][cfg[currentLvl - 1].idKey] === parentId) {
          parentItem = parentData[i];
          break;
        }
      }
      if (!parentItem) { break; }
      levelIds[currentLvl - 1] = parentItem[cfg[currentLvl - 1].idKey];
      levelDescs[currentLvl - 1] = parentItem[cfg[currentLvl - 1].descKey] || '';
      currentItem = parentItem;
      currentLvl--;
    }

    return {
      cidmsAccountingGroupId: levelIds[0],
      cidmsAccountingGroupDesc: levelDescs[0],
      cidmsAccountingSubGroupId: levelIds[1],
      cidmsAccountingSubGroupDesc: levelDescs[1],
      cidmsClassId: levelIds[2],
      cidmsClassDesc: levelDescs[2],
      cidmsGroupTypeId: levelIds[3],
      cidmsGroupTypeDesc: levelDescs[3],
      cidmsAssetTypeId: levelIds[4],
      cidmsAssetTypeDesc: levelDescs[4],
      cidmsComponentTypeId: levelIds[5],
      cidmsComponentTypeDesc: levelDescs[5],
      cidmsSubComponentTypeId: levelIds[6],
      cidmsSubComponentTypeDesc: levelDescs[6],
      selectedLevelIdx: selectedLevelIdx
    };
  }

  getLevelLabel(levelIdx: number): string {
    return CIDMS_LEVEL_CONFIG[levelIdx]?.label || '';
  }

  getLevelColor(levelIdx: number): string {
    return CIDMS_LEVEL_CONFIG[levelIdx]?.color || '#64748b';
  }

  getLevelBg(levelIdx: number): string {
    return CIDMS_LEVEL_CONFIG[levelIdx]?.bg || '#f8fafc';
  }

  getItemDesc(item: any, levelIdx: number): string {
    return item[CIDMS_LEVEL_CONFIG[levelIdx]?.descKey] || '';
  }
}
