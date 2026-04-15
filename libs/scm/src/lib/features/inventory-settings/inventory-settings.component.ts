import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { environment } from '../../environment';

interface SettingTab {
  key: string;
  label: string;
  icon: string;
  columns: { field: string; header: string }[];
}

@Component({
  selector: 'app-inventory-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatTabsModule, MatSlideToggleModule, MatTooltipModule],
  templateUrl: './inventory-settings.component.html',
  styleUrl: './inventory-settings.component.scss'
})
export class InventorySettingsComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  activeTab = signal<string>('classifications');
  items = signal<any[]>([]);
  loading = signal(false);
  showForm = signal(false);
  editingItem = signal<any>(null);
  formData = signal<any>({});
  notification = signal<string>('');

  tabs: SettingTab[] = [
    { key: 'classifications', label: 'Classification', icon: 'category', columns: [{ field: 'commodityClassificationDesc', header: 'Description' }] },
    { key: 'commodity-types', label: 'Commodity Type', icon: 'inventory_2', columns: [{ field: 'commodityTypeDesc', header: 'Description' }] },
    { key: 'commodity-sub-types', label: 'Sub Type', icon: 'subdirectory_arrow_right', columns: [{ field: 'commoditySubTypeDesc', header: 'Description' }, { field: 'commodityTypeId', header: 'Type ID' }] },
    { key: 'type-subtype-mappings', label: 'Type-SubType Map', icon: 'link', columns: [{ field: 'commodityTypeId', header: 'Type ID' }, { field: 'commoditySubTypeId', header: 'Sub Type ID' }] },
    { key: 'units-of-issue', label: 'Unit of Issue', icon: 'straighten', columns: [{ field: 'unitOfIssueDesc', header: 'Description' }, { field: 'uomCode', header: 'UOM Code' }] },
    { key: 'measure-groups', label: 'Measure Group', icon: 'scale', columns: [{ field: 'measureGroupCategoryDesc', header: 'Description' }] },
    { key: 'bin-codes', label: 'Bin Code Setup', icon: 'qr_code', columns: [{ field: 'binPrefix', header: 'Prefix' }, { field: 'binSuffix', header: 'Suffix' }, { field: 'binLength', header: 'Length' }, { field: 'nextNumber', header: 'Next #' }] },
    { key: 'scoa-item-setup', label: 'SCOA Item Setup', icon: 'account_tree', columns: [{ field: 'scoaItemDesc', header: 'SCOA Item' }, { field: 'commodityClassificationId', header: 'Classification ID' }] },
    { key: 'classification-scoa', label: 'Classification SCOA', icon: 'account_balance', columns: [{ field: 'commodityClassificationId', header: 'Classification ID' }, { field: 'scoaItemId', header: 'SCOA Item ID' }] },
    { key: 'classification-expense', label: 'Expense Mapping', icon: 'receipt_long', columns: [{ field: 'commodityClassificationId', header: 'Classification ID' }, { field: 'expenseTypeId', header: 'Expense Type ID' }] },
    { key: 'cost-formula', label: 'Cost Formula', icon: 'calculate', columns: [{ field: 'costFormulaDesc', header: 'Formula' }, { field: 'commodityClassificationId', header: 'Classification ID' }] },
    { key: 'store-permissions', label: 'Store Permissions', icon: 'security', columns: [{ field: 'userId', header: 'User ID' }, { field: 'storeId', header: 'Store ID' }, { field: 'canCapture', header: 'Capture' }, { field: 'canApprove', header: 'Approve' }, { field: 'canView', header: 'View' }] },
    { key: 'month-end', label: 'Month End', icon: 'calendar_month', columns: [{ field: 'finYear', header: 'Fin Year' }, { field: 'month', header: 'Month' }, { field: 'monthName', header: 'Name' }, { field: 'isClosed', header: 'Closed' }] },
    { key: 'take-on-settings', label: 'Take-On Settings', icon: 'upload_file', columns: [{ field: 'storeId', header: 'Store ID' }, { field: 'allowTakeOn', header: 'Allow Take-On' }, { field: 'takeOnFinYear', header: 'Fin Year' }] },
    { key: 'water-route-names', label: 'Water Routes', icon: 'water', columns: [{ field: 'routeName', header: 'Route Name' }, { field: 'routeDescription', header: 'Description' }] },
    { key: 'water-routes', label: 'Water Route Setup', icon: 'route', columns: [{ field: 'routeCode', header: 'Code' }, { field: 'routeNameId', header: 'Route Name ID' }, { field: 'distanceKm', header: 'Distance (km)' }] },
    { key: 'water-route-nodes', label: 'Route Nodes', icon: 'place', columns: [{ field: 'nodeName', header: 'Node Name' }, { field: 'nodeType', header: 'Type' }] },
    { key: 'reporting', label: 'Reporting', icon: 'assessment', columns: [{ field: 'reportName', header: 'Report Name' }, { field: 'reportCategory', header: 'Category' }] }
  ];

  ngOnInit() {
    this.loadSettings(this.activeTab());
  }

  switchTab(tabKey: string) {
    this.activeTab.set(tabKey);
    this.showForm.set(false);
    this.editingItem.set(null);
    this.loadSettings(tabKey);
  }

  getActiveTab(): SettingTab {
    return this.tabs.find(t => t.key === this.activeTab()) || this.tabs[0];
  }

  loadSettings(type: string) {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/api/inventory-settings/${type}`).subscribe({
      next: (res) => { this.items.set(res?.data || []); this.loading.set(false); },
      error: () => { this.items.set([]); this.loading.set(false); }
    });
  }

  openAdd() {
    this.editingItem.set(null);
    this.formData.set({ enabled: true });
    this.showForm.set(true);
  }

  openEdit(item: any) {
    this.editingItem.set(item);
    this.formData.set({ ...item });
    this.showForm.set(true);
  }

  updateFormDataField(field: string, value: any) {
    this.formData.update(d => ({ ...d, [field]: value }));
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingItem.set(null);
    this.formData.set({});
  }

  saveForm() {
    const tab = this.activeTab();
    const editing = this.editingItem();
    const data = this.formData();

    if (editing) {
      const id = this.getItemId(editing);
      this.http.put(`${this.apiUrl}/api/inventory-settings/${tab}/${id}`, data).subscribe({
        next: () => { this.notify('Setting updated'); this.cancelForm(); this.loadSettings(tab); },
        error: () => this.notify('Update failed')
      });
    } else {
      this.http.post(`${this.apiUrl}/api/inventory-settings/${tab}`, data).subscribe({
        next: () => { this.notify('Setting created'); this.cancelForm(); this.loadSettings(tab); },
        error: () => this.notify('Create failed')
      });
    }
  }

  toggleEnabled(item: any) {
    const id = this.getItemId(item);
    const enabled = !(item.enabled ?? true);
    this.http.put(`${this.apiUrl}/api/inventory-settings/${this.activeTab()}/${id}/toggle?enabled=${enabled}`, {}).subscribe({
      next: () => { item.enabled = enabled; this.notify(enabled ? 'Enabled' : 'Disabled'); this.loadSettings(this.activeTab()); },
      error: () => this.notify('Toggle failed')
    });
  }

  getItemId(item: any): number {
    const keys = Object.keys(item).filter(k => k.toLowerCase().endsWith('id') && typeof item[k] === 'number');
    return item[keys[0]] || 0;
  }

  getCellValue(item: any, field: string): string {
    const val = item[field];
    if (val === null || val === undefined) return '-';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    return String(val);
  }

  getFormFields(): string[] {
    const tab = this.getActiveTab();
    return tab.columns.map(c => c.field);
  }

  notify(msg: string) {
    this.notification.set(msg);
    setTimeout(() => this.notification.set(''), 3000);
  }
}
