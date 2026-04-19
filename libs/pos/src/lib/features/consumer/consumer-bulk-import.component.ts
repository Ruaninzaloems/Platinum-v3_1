import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../shared/components';
import { ConsumerService } from '../../services/consumer.service';
import { firstValueFrom } from 'rxjs';

interface EntityTemplate {
  key: string;
  label: string;
  headers: string[];
  required: string[];
  descriptions: Record<string, string>;
  example: Record<string, string>;
  dependsOn: string[];
  order: number;
}

const ENTITY_TEMPLATES: EntityTemplate[] = [
  {
    key: 'cons-name', label: 'Names (People/Entities)', order: 1, dependsOn: [],
    headers: ['idNumber', 'surname', 'firstName', 'initials', 'title'],
    required: ['surname'],
    descriptions: { idNumber: 'SA ID (13 digits) or passport', surname: 'Last name (required)', firstName: 'First name', initials: 'Initials', title: 'Title (Mr/Mrs/Ms)' },
    example: { idNumber: '8001015009087', surname: 'Smith', firstName: 'John', initials: 'JM', title: 'Mr' },
  },
  {
    key: 'cons-unit', label: 'Units (Properties)', order: 1, dependsOn: [],
    headers: ['unitNumber', 'description', 'address', 'suburb', 'town', 'postalCode', 'erfNumber', 'sgNumber', 'propertyType'],
    required: ['unitNumber'],
    descriptions: { unitNumber: 'Unique unit number (required)', description: 'Description', address: 'Street address', suburb: 'Suburb', town: 'Town', postalCode: 'Postal code', erfNumber: 'ERF number', sgNumber: 'SG number', propertyType: 'Property type' },
    example: { unitNumber: 'UNIT001', description: 'Residential', address: '123 Main St', suburb: 'Greenfields', town: 'Cape Town', postalCode: '7500', erfNumber: 'ERF1234', sgNumber: 'SG5678', propertyType: 'Residential' },
  },
  {
    key: 'cons-unitpartition', label: 'Partitions', order: 2, dependsOn: ['cons-unit'],
    headers: ['unitId', 'partitionNumber', 'description', 'partitionType'],
    required: ['unitId', 'partitionNumber'],
    descriptions: { unitId: 'Unit ID from import (required)', partitionNumber: 'Partition number (required)', description: 'Description', partitionType: 'Type' },
    example: { unitId: '101', partitionNumber: 'P001', description: 'Main', partitionType: 'Main' },
  },
  {
    key: 'cons-unitpartitionowner', label: 'Partition Owners', order: 3, dependsOn: ['cons-unitpartition', 'cons-name'],
    headers: ['unitPartitionId', 'nameId', 'ownerType'],
    required: ['unitPartitionId', 'nameId'],
    descriptions: { unitPartitionId: 'Partition ID (required)', nameId: 'Name ID (required)', ownerType: 'Owner type' },
    example: { unitPartitionId: '201', nameId: '301', ownerType: 'Primary' },
  },
  {
    key: 'cons-account', label: 'Accounts', order: 3, dependsOn: ['cons-unitpartition', 'cons-name'],
    headers: ['unitPartitionId', 'nameId', 'accountNumber', 'accountType', 'status'],
    required: ['unitPartitionId', 'nameId'],
    descriptions: { unitPartitionId: 'Partition ID (required)', nameId: 'Name ID (required)', accountNumber: 'Account number', accountType: 'Type', status: 'Status' },
    example: { unitPartitionId: '201', nameId: '301', accountNumber: 'ACC001', accountType: 'Domestic', status: 'Active' },
  },
  {
    key: 'cons-account-contactdetails', label: 'Contact Details', order: 4, dependsOn: ['cons-account'],
    headers: ['accountId', 'contactType', 'contactValue', 'isPrimary'],
    required: ['accountId', 'contactType', 'contactValue'],
    descriptions: { accountId: 'Account ID (required)', contactType: 'Email/Phone/Mobile/Fax', contactValue: 'Value (required)', isPrimary: 'true/false' },
    example: { accountId: '401', contactType: 'Email', contactValue: 'john@example.com', isPrimary: 'true' },
  },
  {
    key: 'cons-services', label: 'Services', order: 4, dependsOn: ['cons-account'],
    headers: ['accountId', 'serviceType', 'serviceDescription', 'meterNumber', 'readingType'],
    required: ['accountId', 'serviceType'],
    descriptions: { accountId: 'Account ID (required)', serviceType: 'Water/Electricity/etc (required)', serviceDescription: 'Description', meterNumber: 'Meter number', readingType: 'Reading type' },
    example: { accountId: '401', serviceType: 'Water', serviceDescription: 'Domestic water', meterNumber: 'WM001', readingType: 'Actual' },
  },
  {
    key: 'cons-additionalbilling', label: 'Additional Billing', order: 4, dependsOn: ['cons-account'],
    headers: ['accountId', 'billingType', 'amount', 'description', 'frequency'],
    required: ['accountId', 'billingType', 'amount'],
    descriptions: { accountId: 'Account ID (required)', billingType: 'Levy/Surcharge/etc (required)', amount: 'Amount (required)', description: 'Description', frequency: 'Monthly/Quarterly/etc' },
    example: { accountId: '401', billingType: 'Levy', amount: '150.00', description: 'Monthly levy', frequency: 'Monthly' },
  },
];

interface ImportState {
  status: 'pending' | 'validating' | 'processing' | 'done' | 'error';
  fileName: string;
  parsedRows: Record<string, string>[];
  validationErrors: { row: number; field: string; message: string }[];
  results: any[];
  successCount: number;
  failCount: number;
}

@Component({
  selector: 'app-consumer-bulk-import',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  templateUrl: './consumer-bulk-import.component.html',
  styleUrl: './consumer-bulk-import.component.css',
})
export class ConsumerBulkImportComponent {
  private consumerService = inject(ConsumerService);

  templates = ENTITY_TEMPLATES;
  importStates = signal<Record<string, ImportState>>(
    Object.fromEntries(ENTITY_TEMPLATES.map(t => [t.key, { status: 'pending' as const, fileName: '', parsedRows: [], validationErrors: [], results: [], successCount: 0, failCount: 0 }]))
  );
  expandedCards = signal<Set<string>>(new Set());

  toggleCard(key: string): void {
    const s = new Set(this.expandedCards());
    s.has(key) ? s.delete(key) : s.add(key);
    this.expandedCards.set(s);
  }

  downloadTemplate(template: EntityTemplate): void {
    const lines = [template.headers.join(','), template.headers.map(h => template.example[h] || '').join(',')];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.key}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  onFileSelect(templateKey: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const template = this.templates.find(t => t.key === templateKey)!;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { rows } = this.parseCSV(text);
      const errors = this.validateRows(rows, template);
      const states = { ...this.importStates() };
      states[templateKey] = { ...states[templateKey], fileName: file.name, parsedRows: rows, validationErrors: errors, status: 'validating' };
      this.importStates.set(states);
    };
    reader.readAsText(file);
  }

  canProcess(templateKey: string): { allowed: boolean; reason?: string } {
    const template = this.templates.find(t => t.key === templateKey)!;
    for (const dep of template.dependsOn) {
      const depState = this.importStates()[dep];
      if (!depState || depState.status !== 'done') {
        const depTmpl = this.templates.find(t => t.key === dep);
        return { allowed: false, reason: `"${depTmpl?.label || dep}" must be processed first` };
      }
    }
    return { allowed: true };
  }

  async processImport(templateKey: string): Promise<void> {
    const check = this.canProcess(templateKey);
    if (!check.allowed) return;
    const state = this.importStates()[templateKey];
    const validRows = state.parsedRows.filter((_, i) => !state.validationErrors.some(e => e.row === i + 2));
    if (validRows.length === 0) return;
    const states = { ...this.importStates() };
    states[templateKey] = { ...states[templateKey], status: 'processing' };
    this.importStates.set(states);
    try {
      let result: any;
      switch (templateKey) {
        case 'cons-name': result = await firstValueFrom(this.consumerService.bulkCreateNames(validRows)); break;
        case 'cons-unit': result = await firstValueFrom(this.consumerService.bulkCreateUnits(validRows)); break;
        case 'cons-unitpartition': result = await firstValueFrom(this.consumerService.bulkCreatePartitions(validRows)); break;
        case 'cons-unitpartitionowner': result = await firstValueFrom(this.consumerService.bulkCreateOwners(validRows)); break;
        case 'cons-account': result = await firstValueFrom(this.consumerService.bulkCreateAccounts(validRows)); break;
        case 'cons-account-contactdetails': result = await firstValueFrom(this.consumerService.bulkCreateContactDetails(validRows)); break;
        case 'cons-services': result = await firstValueFrom(this.consumerService.bulkCreateServices(validRows)); break;
        case 'cons-additionalbilling': result = await firstValueFrom(this.consumerService.bulkCreateAdditionalBilling(validRows)); break;
      }
      const arr = Array.isArray(result) ? result : [result];
      let s = 0, f = 0;
      for (const r of arr) { r.success !== false ? s++ : f++; }
      const states2 = { ...this.importStates() };
      states2[templateKey] = { ...states2[templateKey], status: 'done', results: arr, successCount: s, failCount: f };
      this.importStates.set(states2);
    } catch (e: any) {
      const states2 = { ...this.importStates() };
      states2[templateKey] = { ...states2[templateKey], status: 'error', results: [{ success: false, error: e?.error?.message || e?.message }], failCount: validRows.length };
      this.importStates.set(states2);
    }
  }

  private parseCSV(text: string): { rows: Record<string, string>[] } {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) return { rows: [] };
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return {
      rows: lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = values[i] || ''; });
        return row;
      })
    };
  }

  private validateRows(rows: Record<string, string>[], template: EntityTemplate): { row: number; field: string; message: string }[] {
    const errors: { row: number; field: string; message: string }[] = [];
    rows.forEach((row, idx) => {
      for (const field of template.required) {
        if (!row[field]?.trim()) errors.push({ row: idx + 2, field, message: `${field} is required` });
      }
    });
    return errors;
  }

  getValidRowCount(templateKey: string): number {
    const state = this.importStates()[templateKey];
    return state.parsedRows.length - state.validationErrors.length;
  }
}
