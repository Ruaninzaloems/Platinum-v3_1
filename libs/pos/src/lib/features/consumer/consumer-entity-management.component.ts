import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent, CardComponent } from '../../shared/components';
import { ConsumerService } from '../../services/consumer.service';
import { firstValueFrom } from 'rxjs';

type EntityType = 'names' | 'units' | 'partitions' | 'owners' | 'accounts';

interface EntityTab {
  key: EntityType;
  label: string;
  icon: string;
  searchFields: { key: string; label: string; placeholder: string }[];
  idField: string;
}

const ENTITY_TABS: EntityTab[] = [
  { key: 'names', label: 'Names', icon: 'person', idField: 'nameId', searchFields: [
    { key: 'nameId', label: 'Name ID', placeholder: 'Search by name ID...' },
  ]},
  { key: 'units', label: 'Units (Properties)', icon: 'apartment', idField: 'unitId', searchFields: [
    { key: 'unitId', label: 'Unit ID', placeholder: 'Search by unit ID...' },
  ]},
  { key: 'partitions', label: 'Partitions', icon: 'grid_view', idField: 'unitPartitionId', searchFields: [
    { key: 'unitId', label: 'Unit ID', placeholder: 'List partitions by unit ID...' },
  ]},
  { key: 'owners', label: 'Partition Owners', icon: 'person_pin', idField: 'unitPartitionOwnerId', searchFields: [
    { key: 'unitPartitionId', label: 'Partition ID', placeholder: 'List owners by partition ID...' },
  ]},
  { key: 'accounts', label: 'Accounts', icon: 'account_balance_wallet', idField: 'accountId', searchFields: [
    { key: 'accountId', label: 'Account ID', placeholder: 'Search by account ID...' },
    { key: 'unitPartitionId', label: 'Partition ID', placeholder: 'Search by partition ID...' },
  ]},
];

@Component({
  selector: 'app-consumer-entity-management',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, CardComponent],
  templateUrl: './consumer-entity-management.component.html',
  styleUrl: './consumer-entity-management.component.css',
})
export class ConsumerEntityManagementComponent {
  private consumerService = inject(ConsumerService);

  tabs = ENTITY_TABS;
  activeTab = signal<EntityType>('names');
  searchParams = signal<Record<string, string>>({});
  searching = signal(false);
  results = signal<any[]>([]);
  selectedRecord = signal<any>(null);
  editing = signal(false);
  editData = signal<any>({});
  saving = signal(false);
  error = signal('');
  success = signal('');
  relatedData = signal<Record<string, any[]>>({});
  expandedRelated = signal<Set<string>>(new Set());
  loadingRelated = signal<Set<string>>(new Set());

  get activeTabDef(): EntityTab { return this.tabs.find(t => t.key === this.activeTab())!; }

  switchTab(key: EntityType): void {
    this.activeTab.set(key);
    this.results.set([]);
    this.selectedRecord.set(null);
    this.editing.set(false);
    this.error.set('');
    this.success.set('');
    this.searchParams.set({});
    this.relatedData.set({});
    this.expandedRelated.set(new Set());
  }

  updateSearchParam(key: string, value: string): void {
    this.searchParams.set({ ...this.searchParams(), [key]: value });
  }

  async search(): Promise<void> {
    const params = Object.fromEntries(Object.entries(this.searchParams()).filter(([, v]) => v.trim()));
    if (Object.keys(params).length === 0) { this.error.set('Enter at least one search field'); return; }
    this.searching.set(true);
    this.error.set('');
    this.selectedRecord.set(null);
    try {
      let data: any;
      switch (this.activeTab()) {
        case 'names': data = await firstValueFrom(this.consumerService.searchNames(params)); break;
        case 'units': data = await firstValueFrom(this.consumerService.searchUnits(params)); break;
        case 'partitions': data = await firstValueFrom(this.consumerService.searchPartitions(params)); break;
        case 'owners': data = await firstValueFrom(this.consumerService.searchOwners(params)); break;
        case 'accounts': data = await firstValueFrom(this.consumerService.searchAccounts(params)); break;
      }
      const arr = Array.isArray(data) ? data : data?.items || data?.data || [];
      this.results.set(arr);
      if (arr.length === 0) this.error.set('No results found');
    } catch (e: any) {
      this.error.set(e?.error?.message || e?.message || 'Search failed');
    } finally {
      this.searching.set(false);
    }
  }

  selectRecord(record: any): void {
    this.selectedRecord.set(record);
    this.editing.set(false);
    this.editData.set({ ...record });
    this.relatedData.set({});
    this.expandedRelated.set(new Set());
  }

  startEdit(): void {
    this.editData.set({ ...this.selectedRecord() });
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.editData.set({ ...this.selectedRecord() });
  }

  updateEditField(key: string, value: any): void {
    this.editData.set({ ...this.editData(), [key]: value });
  }

  private getEntityId(data: any): number {
    switch (this.activeTab()) {
      case 'names': return data.nameId || data.id;
      case 'units': return data.unitId || data.id;
      case 'partitions': return data.unitPartitionId || data.id;
      case 'owners': return data.unitPartitionOwnerId || data.id;
      case 'accounts': return data.accountId || data.id;
      default: return data.id;
    }
  }

  async saveEdit(): Promise<void> {
    this.saving.set(true);
    this.error.set('');
    try {
      const id = this.getEntityId(this.editData());
      if (!id) { this.error.set('Cannot determine record ID for update'); this.saving.set(false); return; }
      let result: any;
      switch (this.activeTab()) {
        case 'names': result = await firstValueFrom(this.consumerService.updateName(id, this.editData())); break;
        case 'units': result = await firstValueFrom(this.consumerService.updateUnit(id, this.editData())); break;
        case 'partitions': result = await firstValueFrom(this.consumerService.updatePartition(id, this.editData())); break;
        case 'owners': result = await firstValueFrom(this.consumerService.updateOwner(id, this.editData())); break;
        case 'accounts': result = await firstValueFrom(this.consumerService.updateAccount(id, this.editData())); break;
      }
      this.selectedRecord.set(this.editData());
      this.editing.set(false);
      this.success.set('Record updated successfully');
    } catch (e: any) {
      this.error.set(e?.error?.message || e?.message || 'Update failed');
    } finally {
      this.saving.set(false);
    }
  }

  async loadRelated(key: string): Promise<void> {
    const exp = new Set(this.expandedRelated());
    if (exp.has(key)) { exp.delete(key); this.expandedRelated.set(exp); return; }
    const loading = new Set(this.loadingRelated());
    loading.add(key);
    this.loadingRelated.set(loading);
    try {
      const record = this.selectedRecord();
      let data: any;
      switch (key) {
        case 'partitions': data = await firstValueFrom(this.consumerService.getPartitionsByUnit(record.unitId)); break;
        case 'owners': data = await firstValueFrom(this.consumerService.getOwnersByPartition(record.unitPartitionId)); break;
        case 'accounts': data = await firstValueFrom(this.consumerService.getAccountsByPartition(record.unitPartitionId)); break;
        case 'contacts': data = await firstValueFrom(this.consumerService.getContactDetailsByAccount(record.accountId)); break;
        case 'services': data = await firstValueFrom(this.consumerService.getServicesByAccount(record.accountId)); break;
        case 'billing': data = await firstValueFrom(this.consumerService.getAdditionalBillingByAccount(record.accountId)); break;
      }
      const arr = Array.isArray(data) ? data : data?.items || data?.data || [];
      this.relatedData.set({ ...this.relatedData(), [key]: arr });
      exp.add(key);
      this.expandedRelated.set(exp);
    } catch (e: any) {
      this.error.set(`Failed to load ${key}: ${e?.error?.message || e?.message || 'API error'}`);
    } finally {
      const l = new Set(this.loadingRelated());
      l.delete(key);
      this.loadingRelated.set(l);
    }
  }

  getRelatedPanels(): { key: string; label: string; icon: string }[] {
    switch (this.activeTab()) {
      case 'units': return [{ key: 'partitions', label: 'Partitions', icon: 'grid_view' }];
      case 'partitions': return [
        { key: 'owners', label: 'Owners', icon: 'person_pin' },
      ];
      case 'accounts': return [
        { key: 'contacts', label: 'Contact Details', icon: 'contact_phone' },
        { key: 'services', label: 'Services', icon: 'build' },
        { key: 'billing', label: 'Additional Billing', icon: 'receipt_long' },
      ];
      default: return [];
    }
  }

  getRecordTitle(record: any): string {
    switch (this.activeTab()) {
      case 'names': return `${record.surnameCompany || ''} ${record.firstNames || ''}`.trim() || 'Unknown';
      case 'units': return record.description || `Unit ${record.unitId}`;
      case 'partitions': return record.description || `Partition ${record.unitPartitionId}`;
      case 'owners': return `Owner ${record.unitPartitionOwnerId || record.nameId || 'N/A'}`;
      case 'accounts': return `Account ${record.accountId}`;
      default: return `${record.id || 'N/A'}`;
    }
  }

  getRecordSubtitle(record: any): string {
    switch (this.activeTab()) {
      case 'names': return record.idNoRegistrationNo || `Name ID: ${record.nameId || 'N/A'}`;
      case 'units': return [record.erfNumber ? `ERF: ${record.erfNumber}` : '', record.sgNumber ? `SG: ${record.sgNumber}` : ''].filter(Boolean).join(', ') || `Unit ID: ${record.unitId || 'N/A'}`;
      case 'partitions': return `Unit ID: ${record.unitId || 'N/A'}`;
      case 'owners': return `Partition: ${record.unitPartitionId || 'N/A'}, Name: ${record.nameId || 'N/A'}`;
      case 'accounts': return `Partition: ${record.unitPartitionId || 'N/A'}`;
      default: return '';
    }
  }

  getFieldEntries(record: any): { key: string; value: any }[] {
    return Object.entries(record || {})
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([key, value]) => ({ key, value }));
  }
}
