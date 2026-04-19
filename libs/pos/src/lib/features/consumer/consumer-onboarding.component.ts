import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PageHeaderComponent, CardComponent } from '../../shared/components';
import { ConsumerService } from '../../services/consumer.service';
import { firstValueFrom } from 'rxjs';

interface StepDef {
  key: string;
  label: string;
  icon: string;
  description: string;
}

const ALL_STEPS: StepDef[] = [
  { key: 'property', label: 'Property (Unit)', icon: 'apartment', description: 'Create the property/unit record' },
  { key: 'partition', label: 'Partitions', icon: 'grid_view', description: 'Add partitions to the property' },
  { key: 'owner', label: 'Partition Owner', icon: 'person_pin', description: 'Assign an owner to the partition' },
  { key: 'account', label: 'Account', icon: 'account_balance_wallet', description: 'Create an account linked to the partition' },
  { key: 'contact', label: 'Contact Details', icon: 'contact_phone', description: 'Add contact information' },
  { key: 'services', label: 'Services', icon: 'build', description: 'Link services to the account' },
  { key: 'billing', label: 'Additional Billing', icon: 'receipt_long', description: 'Add additional billing items' },
];

function luhnCheck(id: string): boolean {
  if (!id || id.length !== 13 || !/^\d{13}$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    let d = parseInt(id[i]);
    if (i % 2 !== 0) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0;
}

@Component({
  selector: 'app-consumer-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, CardComponent],
  templateUrl: './consumer-onboarding.component.html',
  styleUrl: './consumer-onboarding.component.css',
})
export class ConsumerOnboardingComponent implements OnInit {
  private consumerService = inject(ConsumerService);
  private http = inject(HttpClient);

  steps = ALL_STEPS;
  currentStep = signal(0);
  submitting = signal(false);
  error = signal('');
  success = signal('');

  unitId = signal<number | null>(null);
  partitionId = signal<number | null>(null);
  accountId = signal<number | null>(null);
  selectedAccountTypeId = signal<number>(0);
  selectedName = signal<any>(null);
  completedSteps = signal<Set<string>>(new Set());

  nameSearchQuery = signal('');
  nameSearchResults = signal<any[]>([]);
  nameSearching = signal(false);
  nameSearchPerformed = signal(false);
  showCreateNameForm = signal(false);
  newName = signal({ idNumber: '', surname: '', firstName: '', initials: '', title: '' });
  nameContext = signal<'owner' | 'account'>('owner');
  idValidationError = signal('');

  propertyForm = signal({ description: '', address: '', townId: '', suburbId: '', postalCode: '', erfNumber: '', sgNumber: '', propertyTypeId: '' });
  towns = signal<any[]>([]);
  suburbs = signal<any[]>([]);
  propertyTypes = signal<any[]>([]);
  accountTypes = signal<any[]>([]);
  serviceModes = signal<any[]>([]);
  tariffTypes = signal<any[]>([]);
  tariffs = signal<any[]>([]);
  lookupsLoaded = signal(false);
  partitionForm = signal({ partitionNumber: '', description: '', partitionType: '' });
  ownerType = signal('Primary');
  accountForm = signal({ accountNumber: '', accountTypeId: '', status: 'Active' });
  accountName = signal<any>(null);
  contactForm = signal({ contactType: 'Email', contactValue: '', isPrimary: true });
  serviceForm = signal({
    tariffTypeId: '',
    tariffId: '',
    serviceModeId: '',
    meterNumber: '',
    serviceRequestedDate: '',
    description: ''
  });
  billingForm = signal({ billingType: '', amount: '', description: '', frequency: 'Monthly' });

  isSundryDebtor = computed(() => {
    const typeId = parseInt(this.accountForm().accountTypeId);
    return typeId === 6;
  });

  selectedTariffType = computed(() => {
    const id = parseInt(this.serviceForm().tariffTypeId);
    return this.tariffTypes().find((t: any) => (t.tariffTypeId || t.id) === id);
  });

  selectedServiceMode = computed(() => {
    const id = parseInt(this.serviceForm().serviceModeId);
    return this.serviceModes().find((m: any) => (m.serviceModeId || m.id) === id);
  });

  isMeteredService = computed(() => {
    const modeId = parseInt(this.serviceForm().serviceModeId);
    return modeId === 2 || modeId === 4;
  });

  filteredTariffs = computed(() => {
    const ttId = this.serviceForm().tariffTypeId;
    if (!ttId) return [];
    return this.tariffs().filter((t: any) => String(t.tariffTypeId) === ttId);
  });

  selectedAccountType = computed(() => {
    const id = parseInt(this.accountForm().accountTypeId);
    return this.accountTypes().find((t: any) => (t.accountTypeId || t.id) === id);
  });

  get currentStepDef(): StepDef { return this.steps[this.currentStep()]; }

  async ngOnInit(): Promise<void> {
    const failedLookups: string[] = [];
    try {
      const results = await Promise.allSettled([
        firstValueFrom(this.http.get<any[]>('/api/platinum/consumer-lookups/towns')),
        firstValueFrom(this.consumerService.getPropertyTypes()),
        firstValueFrom(this.consumerService.getAccountTypes()),
        firstValueFrom(this.consumerService.getServiceModes()),
        firstValueFrom(this.consumerService.getTariffTypes()),
        firstValueFrom(this.consumerService.getTariffs()),
      ]);

      const extract = (r: PromiseSettledResult<any[]>, label: string): any[] => {
        if (r.status === 'fulfilled') {
          return Array.isArray(r.value) ? r.value : [];
        }
        failedLookups.push(label);
        return [];
      };

      this.towns.set(extract(results[0], 'Towns'));
      this.propertyTypes.set(extract(results[1], 'Property Types'));
      this.accountTypes.set(extract(results[2], 'Account Types'));
      this.serviceModes.set(extract(results[3], 'Service Modes'));
      this.tariffTypes.set(extract(results[4], 'Tariff Types'));
      this.tariffs.set(extract(results[5], 'Tariffs'));

      if (this.towns().length > 0) {
        this.propertyForm.set({ ...this.propertyForm(), townId: String(this.towns()[0].id) });
        await this.loadSuburbs(this.towns()[0].id);
      }
      if (this.propertyTypes().length > 0) {
        const firstPt = this.propertyTypes()[0];
        this.propertyForm.set({ ...this.propertyForm(), propertyTypeId: String(firstPt.propertyTypeId || firstPt.id || 1) });
      }
      if (failedLookups.length > 0) {
        this.error.set(`Failed to load from Platinum: ${failedLookups.join(', ')}. Those fields may not be available as dropdowns.`);
      }
      this.lookupsLoaded.set(true);
    } catch {
      this.error.set('Failed to load reference data from Platinum');
    }
  }

  async loadSuburbs(townId: number): Promise<void> {
    try {
      const data = await firstValueFrom(this.http.get<any[]>(`/api/platinum/consumer-lookups/suburbs?townId=${townId}`));
      this.suburbs.set(Array.isArray(data) ? data : []);
      if (this.suburbs().length > 0) {
        this.propertyForm.set({ ...this.propertyForm(), suburbId: String(this.suburbs()[0].id) });
      }
    } catch {
      this.suburbs.set([]);
      this.error.set('Failed to load suburbs from Platinum');
    }
  }

  async onTownChange(townId: string): Promise<void> {
    this.propertyForm.set({ ...this.propertyForm(), townId, suburbId: '' });
    if (townId) {
      await this.loadSuburbs(parseInt(townId));
    }
  }

  onTariffTypeChange(tariffTypeId: string): void {
    this.serviceForm.set({ ...this.serviceForm(), tariffTypeId, tariffId: '' });
  }

  validateSaId(idNumber: string): void {
    this.idValidationError.set('');
    if (!idNumber || idNumber.length < 13) return;
    if (!/^\d{13}$/.test(idNumber)) {
      this.idValidationError.set('SA ID must be exactly 13 digits');
      return;
    }
    if (!luhnCheck(idNumber)) {
      this.idValidationError.set('Invalid SA ID number (Luhn check failed)');
    }
  }

  getPropertyTypeName(id: string): string {
    const pt = this.propertyTypes().find((t: any) => String(t.propertyTypeId || t.id) === id);
    return pt ? (pt.description || pt.name || `Type ${id}`) : `Type ${id}`;
  }

  getAccountTypeName(id: string): string {
    const at = this.accountTypes().find((t: any) => String(t.accountTypeId || t.id) === id);
    return at ? (at.description || at.name || `Type ${id}`) : `Type ${id}`;
  }

  async searchNames(): Promise<void> {
    const q = this.nameSearchQuery().trim();
    if (!q) return;
    this.nameSearching.set(true);
    this.error.set('');
    this.nameSearchPerformed.set(true);
    this.showCreateNameForm.set(false);
    try {
      const params: Record<string, string> = /^\d+$/.test(q) ? { idNoRegistrationNo: q } : { surnameCompany: q };
      const data = await firstValueFrom(this.consumerService.searchNames(params));
      const arr = Array.isArray(data) ? data : data?.items || data?.data || [];
      this.nameSearchResults.set(arr);
      if (arr.length === 0) {
        this.error.set('No existing names found. You may create a new name.');
      }
    } catch (e: any) {
      this.error.set(e?.error?.message || e?.message || 'Search failed');
    } finally {
      this.nameSearching.set(false);
    }
  }

  selectName(name: any): void {
    this.selectedName.set(name);
    this.nameSearchResults.set([]);
    this.error.set('');
  }

  selectNameForContext(name: any, forOwner: boolean): void {
    if (forOwner) {
      this.selectedName.set(name);
    } else {
      this.accountName.set(name);
    }
    this.nameSearchResults.set([]);
    this.error.set('');
  }

  clearSelectedName(): void {
    this.selectedName.set(null);
    this.nameSearchQuery.set('');
    this.nameSearchResults.set([]);
    this.nameSearchPerformed.set(false);
    this.showCreateNameForm.set(false);
    this.idValidationError.set('');
  }

  async createNewName(): Promise<void> {
    const n = this.newName();
    if (!n.surname.trim()) { this.error.set('Surname is required'); return; }
    if (n.idNumber.trim()) {
      if (!/^\d{13}$/.test(n.idNumber.trim())) {
        this.error.set('SA ID must be exactly 13 digits');
        return;
      }
      if (!luhnCheck(n.idNumber.trim())) {
        this.error.set('Invalid SA ID number (Luhn check failed)');
        return;
      }
    }
    this.submitting.set(true);
    this.error.set('');
    try {
      const dupParams: Record<string, string> = n.idNumber.trim()
        ? { idNoRegistrationNo: n.idNumber.trim() }
        : { surnameCompany: n.surname.trim() };
      const dupData = await firstValueFrom(this.consumerService.searchNames(dupParams));
      const dups = Array.isArray(dupData) ? dupData : dupData?.items || dupData?.data || [];
      const exact = dups.find((d: any) =>
        (d.surname || d.surnameCompany || '').toLowerCase() === n.surname.trim().toLowerCase() &&
        (n.firstName.trim() ? (d.firstName || '').toLowerCase() === n.firstName.trim().toLowerCase() : true) &&
        (n.idNumber.trim() ? String(d.idNumber || d.idNoRegistrationNo) === n.idNumber.trim() : true)
      );
      if (exact) {
        this.error.set(`Exact match exists: ${exact.surname || exact.surnameCompany} ${exact.firstName || ''} (ID: ${exact.idNumber || exact.idNoRegistrationNo || 'N/A'}). Select existing name.`);
        this.nameSearchResults.set(dups);
        this.showCreateNameForm.set(false);
        return;
      }
      const result = await firstValueFrom(this.consumerService.createName(n));
      if (this.nameContext() === 'owner') {
        this.selectedName.set(result);
      } else {
        this.accountName.set(result);
      }
      this.showCreateNameForm.set(false);
      this.success.set('Name created successfully');
    } catch (e: any) {
      this.error.set(e?.error?.message || e?.message || 'Failed to create name');
    } finally {
      this.submitting.set(false);
    }
  }

  async submitProperty(): Promise<void> {
    const f = this.propertyForm();
    if (!f.propertyTypeId) { this.error.set('Property type is required'); return; }
    this.submitting.set(true);
    this.error.set('');
    try {
      const payload: Record<string, any> = {};
      if (f.description) payload['description'] = f.description;
      if (f.address) payload['additionalInformation'] = f.address;
      if (f.townId) payload['townId'] = parseInt(f.townId);
      if (f.suburbId) payload['suburbId'] = parseInt(f.suburbId);
      if (f.erfNumber) payload['erfNumber'] = f.erfNumber;
      if (f.sgNumber) payload['sgNumber'] = f.sgNumber;
      if (f.propertyTypeId) payload['propertyTypeId'] = parseInt(f.propertyTypeId);
      if (f.postalCode) payload['postalCode'] = f.postalCode;
      payload['unitStatusId'] = 1;
      const result = await firstValueFrom(this.consumerService.createUnit(payload));
      const id = result?.id || result?.unitId;
      this.unitId.set(id);
      this.markComplete('property');
      this.success.set(`Property created (Unit ID: ${id})`);
      this.nextStep();
    } catch (e: any) {
      this.error.set(e?.error?.message || e?.message || 'Failed to create property');
    } finally {
      this.submitting.set(false);
    }
  }

  async submitPartition(): Promise<void> {
    const f = this.partitionForm();
    if (!f.partitionNumber.trim()) { this.error.set('Partition number is required'); return; }
    this.submitting.set(true);
    this.error.set('');
    try {
      const result = await firstValueFrom(this.consumerService.createPartition({ ...f, unitId: this.unitId() }));
      const id = result?.id || result?.unitPartitionId;
      this.partitionId.set(id);
      this.markComplete('partition');
      this.success.set(`Partition created (ID: ${id})`);
      this.nextStep();
    } catch (e: any) {
      this.error.set(e?.error?.message || e?.message || 'Failed to create partition');
    } finally {
      this.submitting.set(false);
    }
  }

  async submitOwner(): Promise<void> {
    if (!this.selectedName()) { this.error.set('Please select or create a name first'); return; }
    this.submitting.set(true);
    this.error.set('');
    try {
      const nameId = this.selectedName()?.id || this.selectedName()?.nameId;
      const result = await firstValueFrom(this.consumerService.createOwner({
        unitPartitionId: this.partitionId(),
        nameId,
        ownerType: this.ownerType()
      }));
      this.markComplete('owner');
      this.success.set('Owner assigned successfully');
      this.clearSelectedName();
      this.nextStep();
    } catch (e: any) {
      this.error.set(e?.error?.message || e?.message || 'Failed to assign owner');
    } finally {
      this.submitting.set(false);
    }
  }

  async submitAccount(): Promise<void> {
    if (!this.accountName()) { this.error.set('Please select or create an account holder name'); return; }
    if (!this.accountForm().accountTypeId) { this.error.set('Account type is required'); return; }
    this.submitting.set(true);
    this.error.set('');
    try {
      const nameId = this.accountName()?.id || this.accountName()?.nameId;
      const f = this.accountForm();
      const accountTypeId = parseInt(f.accountTypeId);
      this.selectedAccountTypeId.set(accountTypeId);
      const result = await firstValueFrom(this.consumerService.createAccount({
        accountNumber: f.accountNumber || undefined,
        accountTypeId,
        unitPartitionId: this.partitionId(),
        unitId: this.unitId(),
        nameId
      }));
      const id = result?.id || result?.accountId;
      this.accountId.set(id);
      this.markComplete('account');
      this.success.set(`Account created (ID: ${id})`);
      this.nextStep();
    } catch (e: any) {
      this.error.set(e?.error?.message || e?.message || 'Failed to create account');
    } finally {
      this.submitting.set(false);
    }
  }

  async submitContact(): Promise<void> {
    const f = this.contactForm();
    if (!f.contactValue.trim()) { this.error.set('Contact value is required'); return; }
    this.submitting.set(true);
    this.error.set('');
    try {
      await firstValueFrom(this.consumerService.createContactDetails({ ...f, accountId: this.accountId() }));
      this.markComplete('contact');
      this.success.set('Contact details saved');
      this.nextStep();
    } catch (e: any) {
      this.error.set(e?.error?.message || e?.message || 'Failed to save contact');
    } finally {
      this.submitting.set(false);
    }
  }

  async submitService(): Promise<void> {
    const f = this.serviceForm();
    if (this.isSundryDebtor()) {
      this.error.set('Sundry Debtor accounts (Type 6) cannot have services');
      return;
    }
    if (!f.tariffTypeId) { this.error.set('Tariff type is required'); return; }
    if (!f.tariffId) { this.error.set('Tariff is required'); return; }
    if (!f.serviceRequestedDate) { this.error.set('Service requested date is required'); return; }
    if (this.isMeteredService() && !f.meterNumber.trim()) {
      this.error.set('Metered services require a meter number');
      return;
    }
    this.submitting.set(true);
    this.error.set('');
    try {
      const tariffTypeId = parseInt(f.tariffTypeId);
      const tariffId = parseInt(f.tariffId);
      const serviceModeId = f.serviceModeId ? parseInt(f.serviceModeId) : undefined;
      const reqDate = new Date(f.serviceRequestedDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const statusId = reqDate > today ? 15 : 1;

      const payload: Record<string, any> = {
        accountId: this.accountId(),
        unitId: this.unitId(),
        tariffTypeId,
        tariffId,
        serviceRequestedDate: f.serviceRequestedDate,
        serviceStatusId: statusId,
        noOfInstallmentMonths: 12,
        frequency: 12,
      };
      if (serviceModeId) payload['serviceModeId'] = serviceModeId;
      if (f.description) payload['description'] = f.description;
      if (f.meterNumber.trim()) {
        if (tariffTypeId === 1 || tariffTypeId === 5) {
          payload['connectionSizeMeterId'] = f.meterNumber.trim();
        } else {
          payload['meterId'] = f.meterNumber.trim();
        }
      }

      await firstValueFrom(this.consumerService.createService(payload));
      this.markComplete('services');
      const statusLabel = statusId === 15 ? 'Pending (future date)' : 'Active';
      this.success.set(`Service linked (Status: ${statusLabel})`);
      this.nextStep();
    } catch (e: any) {
      this.error.set(e?.error?.message || e?.message || 'Failed to save service');
    } finally {
      this.submitting.set(false);
    }
  }

  async submitBilling(): Promise<void> {
    const f = this.billingForm();
    if (!f.billingType.trim() || !f.amount) { this.error.set('Billing type and amount are required'); return; }
    this.submitting.set(true);
    this.error.set('');
    try {
      await firstValueFrom(this.consumerService.createAdditionalBilling({ ...f, accountId: this.accountId() }));
      this.markComplete('billing');
      this.success.set('Additional billing item saved. Onboarding complete!');
    } catch (e: any) {
      this.error.set(e?.error?.message || e?.message || 'Failed to save billing');
    } finally {
      this.submitting.set(false);
    }
  }

  markComplete(key: string): void {
    const s = new Set(this.completedSteps());
    s.add(key);
    this.completedSteps.set(s);
  }

  nextStep(): void {
    if (this.currentStep() < this.steps.length - 1) {
      this.currentStep.set(this.currentStep() + 1);
      this.error.set('');
    }
  }

  prevStep(): void {
    if (this.currentStep() > 0) {
      this.currentStep.set(this.currentStep() - 1);
      this.error.set('');
    }
  }

  goToStep(idx: number): void {
    if (idx <= this.currentStep() || this.completedSteps().has(this.steps[idx - 1]?.key)) {
      this.currentStep.set(idx);
      this.error.set('');
    }
  }

  resetWizard(): void {
    this.currentStep.set(0);
    this.unitId.set(null);
    this.partitionId.set(null);
    this.accountId.set(null);
    this.selectedAccountTypeId.set(0);
    this.selectedName.set(null);
    this.accountName.set(null);
    this.completedSteps.set(new Set());
    this.error.set('');
    this.success.set('');
    this.idValidationError.set('');
    const defaultTownId = this.towns().length ? String(this.towns()[0].id) : '';
    const defaultPtId = this.propertyTypes().length ? String(this.propertyTypes()[0].propertyTypeId || this.propertyTypes()[0].id || '') : '';
    this.propertyForm.set({ description: '', address: '', townId: defaultTownId, suburbId: '', postalCode: '', erfNumber: '', sgNumber: '', propertyTypeId: defaultPtId });
    if (defaultTownId) { this.loadSuburbs(parseInt(defaultTownId)); }
    this.partitionForm.set({ partitionNumber: '', description: '', partitionType: '' });
    this.accountForm.set({ accountNumber: '', accountTypeId: '', status: 'Active' });
    this.contactForm.set({ contactType: 'Email', contactValue: '', isPrimary: true });
    this.serviceForm.set({ tariffTypeId: '', tariffId: '', serviceModeId: '', meterNumber: '', serviceRequestedDate: '', description: '' });
    this.billingForm.set({ billingType: '', amount: '', description: '', frequency: 'Monthly' });
  }
}
