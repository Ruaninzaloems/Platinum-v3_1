import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../../core/api.service';
import { CIDMS_LEVEL_CONFIG } from '../../../../core/cidms-level-config';

const LEVEL_CONFIG = CIDMS_LEVEL_CONFIG;

@Component({
  selector: 'app-cidms-hierarchy',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './cidms-hierarchy.component.html',
  styleUrls: ['./cidms-hierarchy.component.css']
})
export class CidmsHierarchyComponent implements OnInit {
  levelConfig = LEVEL_CONFIG;

  l0 = signal<any[]>([]);
  l1 = signal<any[]>([]);
  l2 = signal<any[]>([]);
  l3 = signal<any[]>([]);
  l4 = signal<any[]>([]);
  l5 = signal<any[]>([]);
  l6 = signal<any[]>([]);

  loading = signal(true);
  expanded = signal<Set<string>>(new Set());

  showModal = signal(false);
  modalMode = signal<'add' | 'edit'>('add');
  modalLevelIdx = signal(0);
  modalEditId = signal<number | null>(null);
  modalParentDesc = signal('');
  modalItemDesc = signal('');
  saving = signal(false);

  modalForm: any = { desc: '', parentId: null, nature: 0, infrastructure: 0 };

  natureOptions = [
    { value: 0, label: 'None' },
    { value: 1, label: 'Movable' },
    { value: 2, label: 'Immovable' },
    { value: 3, label: 'Intangible' }
  ];

  visibleNodes = computed(() => {
    var expandedSet = this.expanded();
    var data: any[][] = [
      this.l0(), this.l1(), this.l2(), this.l3(), this.l4(), this.l5(), this.l6()
    ];
    var result: any[] = [];

    function getChildren(levelIdx: number, parentId: number): any[] {
      if (levelIdx >= 7) { return []; }
      var cfg = LEVEL_CONFIG[levelIdx];
      var arr = data[levelIdx];
      var children: any[] = [];
      for (var j = 0; j < arr.length; j++) {
        if (arr[j][cfg.parentKey!] === parentId) { children.push(arr[j]); }
      }
      return children;
    }

    function addItems(items: any[], levelIdx: number, depth: number): void {
      var cfg = LEVEL_CONFIG[levelIdx];
      var isLeaf = levelIdx === 6;
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var nodeKey = levelIdx + '_' + item[cfg.idKey];
        var isExpanded = expandedSet.has(nodeKey);
        var children: any[] = [];
        if (!isLeaf) { children = getChildren(levelIdx + 1, item[cfg.idKey]); }
        result.push({
          item: item,
          levelIdx: levelIdx,
          depth: depth,
          nodeKey: nodeKey,
          isExpanded: isExpanded,
          hasChildren: !isLeaf && children.length > 0,
          childCount: children.length
        });
        if (isExpanded && !isLeaf) { addItems(children, levelIdx + 1, depth + 1); }
      }
    }

    addItems(data[0], 0, 0);
    return result;
  });

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    var self = this;
    this.loading.set(true);
    forkJoin([
      this.api.getCidmsAccountingGroups(),
      this.api.getCidmsAccountingSubGroups(),
      this.api.getCidmsClasses(),
      this.api.getCidmsGroupTypes(),
      this.api.getCidmsAssetTypes(),
      this.api.getCidmsComponentTypes(),
      this.api.getCidmsSubComponentTypes()
    ]).subscribe({
      next: function(results: any[][]) {
        self.l0.set(results[0]);
        self.l1.set(results[1]);
        self.l2.set(results[2]);
        self.l3.set(results[3]);
        self.l4.set(results[4]);
        self.l5.set(results[5]);
        self.l6.set(results[6]);
        self.loading.set(false);
      },
      error: function() {
        self.loading.set(false);
        self.snackBar.open('Failed to load CIDMS hierarchy data', 'OK', { duration: 5000 });
      }
    });
  }

  reloadLevel(levelIdx: number): void {
    var self = this;
    this.getLoadObs(levelIdx).subscribe({
      next: function(data: any[]) {
        if (levelIdx === 0) { self.l0.set(data); }
        else if (levelIdx === 1) { self.l1.set(data); }
        else if (levelIdx === 2) { self.l2.set(data); }
        else if (levelIdx === 3) { self.l3.set(data); }
        else if (levelIdx === 4) { self.l4.set(data); }
        else if (levelIdx === 5) { self.l5.set(data); }
        else { self.l6.set(data); }
      },
      error: function() {
        self.snackBar.open('Failed to refresh hierarchy — please reload the page', 'OK', { duration: 6000 });
      }
    });
  }

  getLoadObs(levelIdx: number): any {
    if (levelIdx === 0) { return this.api.getCidmsAccountingGroups(); }
    if (levelIdx === 1) { return this.api.getCidmsAccountingSubGroups(); }
    if (levelIdx === 2) { return this.api.getCidmsClasses(); }
    if (levelIdx === 3) { return this.api.getCidmsGroupTypes(); }
    if (levelIdx === 4) { return this.api.getCidmsAssetTypes(); }
    if (levelIdx === 5) { return this.api.getCidmsComponentTypes(); }
    return this.api.getCidmsSubComponentTypes();
  }

  toggleNode(nodeKey: string): void {
    var s = new Set(this.expanded());
    if (s.has(nodeKey)) { s.delete(nodeKey); } else { s.add(nodeKey); }
    this.expanded.set(s);
  }

  getModalTitle(): string {
    var mode = this.modalMode();
    var lvlIdx = this.modalLevelIdx();
    var cfg = LEVEL_CONFIG[lvlIdx];
    if (mode === 'add') {
      var parentDesc = this.modalParentDesc();
      return 'Add ' + cfg.label + (parentDesc ? ' under ' + parentDesc : '');
    }
    var itemDesc = this.modalItemDesc();
    return 'Edit ' + cfg.label + (itemDesc ? ': ' + itemDesc : '');
  }

  openAddRoot(): void {
    this.modalForm = { desc: '', parentId: null, nature: 0, infrastructure: 0 };
    this.modalMode.set('add');
    this.modalLevelIdx.set(0);
    this.modalEditId.set(null);
    this.modalParentDesc.set('');
    this.showModal.set(true);
  }

  openAddChild(n: any): void {
    var childLevel = n.levelIdx + 1;
    var cfg = LEVEL_CONFIG[n.levelIdx];
    this.modalForm = { desc: '', parentId: n.item[cfg.idKey], nature: 0, infrastructure: 0 };
    this.modalMode.set('add');
    this.modalLevelIdx.set(childLevel);
    this.modalEditId.set(null);
    this.modalParentDesc.set(n.item[cfg.descKey]);
    this.showModal.set(true);
  }

  openEdit(n: any): void {
    var cfg = LEVEL_CONFIG[n.levelIdx];
    this.modalForm = {
      desc: n.item[cfg.descKey],
      parentId: cfg.parentKey ? n.item[cfg.parentKey] : null,
      nature: n.item.nature || 0,
      infrastructure: n.item.infrastructure || 0
    };
    this.modalMode.set('edit');
    this.modalLevelIdx.set(n.levelIdx);
    this.modalEditId.set(n.item[cfg.idKey]);
    this.modalParentDesc.set('');
    this.modalItemDesc.set(n.item[cfg.descKey]);
    this.showModal.set(true);
  }

  cancelModal(): void { this.showModal.set(false); }

  getParentItems(): { id: number; desc: string }[] {
    var lvl = this.modalLevelIdx();
    if (lvl === 0) { return []; }
    var parentLvl = lvl - 1;
    var cfg = LEVEL_CONFIG[parentLvl];
    var data: any[] = [];
    if (parentLvl === 0) { data = this.l0(); }
    else if (parentLvl === 1) { data = this.l1(); }
    else if (parentLvl === 2) { data = this.l2(); }
    else if (parentLvl === 3) { data = this.l3(); }
    else if (parentLvl === 4) { data = this.l4(); }
    else { data = this.l5(); }
    var result: { id: number; desc: string }[] = [];
    for (var i = 0; i < data.length; i++) {
      result.push({ id: data[i][cfg.idKey], desc: data[i][cfg.descKey] });
    }
    return result;
  }

  buildPayload(levelIdx: number, parentId: number | null, desc: string, nature: number, infrastructure: number): any {
    if (levelIdx === 0) { return { assetAccountGroupDesc: desc }; }
    if (levelIdx === 1) { return { assetAccountSubGroupDesc: desc, assetAccountGroupID: parentId }; }
    if (levelIdx === 2) { return { assetCIDMSClassDesc: desc, assetAccountSubGroupID: parentId }; }
    if (levelIdx === 3) { return { assetCIDMSGroupTypeDesc: desc, assetCIDMSClassID: parentId }; }
    if (levelIdx === 4) { return { assetCIDMSAssetTypeDesc: desc, assetCIDMSGroupTypeID: parentId }; }
    if (levelIdx === 5) { return { assetCIDMSComponentTypeDesc: desc, assetCIDMSAssetTypeID: parentId }; }
    return { assetCIDMSSubComponentTypeDesc: desc, assetCIDMSComponentTypeID: parentId, nature: nature, infrastructure: infrastructure };
  }

  getCreateObs(levelIdx: number, payload: any): any {
    if (levelIdx === 0) { return this.api.createCidmsAccountingGroup(payload); }
    if (levelIdx === 1) { return this.api.createCidmsAccountingSubGroup(payload); }
    if (levelIdx === 2) { return this.api.createCidmsClass(payload); }
    if (levelIdx === 3) { return this.api.createCidmsGroupType(payload); }
    if (levelIdx === 4) { return this.api.createCidmsAssetType(payload); }
    if (levelIdx === 5) { return this.api.createCidmsComponentType(payload); }
    return this.api.createCidmsSubComponentType(payload);
  }

  getUpdateObs(levelIdx: number, id: number, payload: any): any {
    if (levelIdx === 0) { return this.api.updateCidmsAccountingGroup(id, payload); }
    if (levelIdx === 1) { return this.api.updateCidmsAccountingSubGroup(id, payload); }
    if (levelIdx === 2) { return this.api.updateCidmsClass(id, payload); }
    if (levelIdx === 3) { return this.api.updateCidmsGroupType(id, payload); }
    if (levelIdx === 4) { return this.api.updateCidmsAssetType(id, payload); }
    if (levelIdx === 5) { return this.api.updateCidmsComponentType(id, payload); }
    return this.api.updateCidmsSubComponentType(id, payload);
  }

  save(): void {
    if (!this.modalForm.desc) { return; }
    var self = this;
    var levelIdx = this.modalLevelIdx();
    var mode = this.modalMode();
    var editId = this.modalEditId();
    var parentId = this.modalForm.parentId ? Number(this.modalForm.parentId) : null;
    var nature = this.modalForm.nature ? Number(this.modalForm.nature) : 0;
    var infrastructure = this.modalForm.infrastructure || 0;
    var payload = this.buildPayload(levelIdx, parentId, this.modalForm.desc, nature, infrastructure);
    this.saving.set(true);
    var obs = (mode === 'edit' && editId !== null) ? this.getUpdateObs(levelIdx, editId, payload) : this.getCreateObs(levelIdx, payload);
    obs.subscribe({
      next: function() {
        self.saving.set(false);
        self.showModal.set(false);
        self.reloadLevel(levelIdx);
        self.snackBar.open(mode === 'edit' ? 'Updated' : 'Created', 'OK', { duration: 3000 });
      },
      error: function(err: any) {
        self.saving.set(false);
        self.snackBar.open(err.error?.error || 'Save failed', 'OK', { duration: 4000 });
      }
    });
  }

  onInfrastructureChange(event: Event): void {
    var input = event.target as HTMLInputElement;
    this.modalForm.infrastructure = input.checked ? 1 : 0;
  }

  getDeleteObs(levelIdx: number, id: number): any {
    if (levelIdx === 0) { return this.api.deleteCidmsAccountingGroup(id); }
    if (levelIdx === 1) { return this.api.deleteCidmsAccountingSubGroup(id); }
    if (levelIdx === 2) { return this.api.deleteCidmsClass(id); }
    if (levelIdx === 3) { return this.api.deleteCidmsGroupType(id); }
    if (levelIdx === 4) { return this.api.deleteCidmsAssetType(id); }
    if (levelIdx === 5) { return this.api.deleteCidmsComponentType(id); }
    return this.api.deleteCidmsSubComponentType(id);
  }

  confirmDelete(n: any): void {
    var cfg = LEVEL_CONFIG[n.levelIdx];
    var desc = n.item[cfg.descKey];
    var id = n.item[cfg.idKey];
    if (!confirm('Delete "' + desc + '"? This will also remove all child items.')) { return; }
    var self = this;
    var levelIdx = n.levelIdx;
    var nodeKey = n.nodeKey;
    this.getDeleteObs(levelIdx, id).subscribe({
      next: function() {
        var s = new Set(self.expanded());
        s.delete(nodeKey);
        self.expanded.set(s);
        self.reloadLevel(levelIdx);
        for (var cl = levelIdx + 1; cl <= 6; cl++) { self.reloadLevel(cl); }
        self.snackBar.open('Deleted', 'OK', { duration: 3000 });
      },
      error: function(err: any) {
        self.snackBar.open(err.error?.error || 'Delete failed', 'OK', { duration: 4000 });
      }
    });
  }

}
