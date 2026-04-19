import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { IndigentService } from '../../services/indigent.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import type {
  IndigentType, IndigentTypeRule, IndigentTypeSubRule, Contractor, AutomatedLetter, DeclineReason, Employer,
  VerificationProvider, ATTPDocumentType, SaveContractorRequest,
  SaveAutomatedLetterRequest, SaveVerificationProviderRequest, SaveDocumentTypeRequest,
  SaveDeclineReasonRequest, IncomeSourceItem, SaveIncomeSourceRequest, PolicyValidationTest,
  QualificationReportConfig, CcStakeholder, CommunicationTemplate, IndigentLifecycleEvent,
  OccupierTypeConfig
} from '../../models/indigent.models';
import { STANDARD_QUALIFICATION_TESTS, MUNICIPAL_POLICY_TESTS, DEFAULT_REPORT_CONFIG, DEFAULT_COMMUNICATION_TEMPLATES, LIFECYCLE_EVENT_LABELS } from '../../models/indigent.models';

type ConfigTab = 'types' | 'contractors' | 'letters' | 'reasons' | 'providers' | 'doctypes' | 'incomesources' | 'employers' | 'occupiertypes';

interface ContractorForm {
  contractorId: number;
  contractorName: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  isActive: boolean;
}

interface LetterForm {
  letterId: number;
  indigentTypeId: number;
  letterType: string;
  templateName: string;
  isActive: boolean;
  triggerEvent: string;
}

interface ProviderForm {
  providerId: number | null;
  providerName: string;
  providerType: string;
  apiEndpoint: string;
  apiCredentials: string;
  timeoutSeconds: number;
  fieldMapping: string;
  fallbackEnabled: boolean;
  offlineMode: boolean;
  isActive: boolean;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
}

interface DeclineReasonForm {
  declineReasonId: number | null;
  declineReasonName: string;
  isActive: boolean;
}

interface IncomeSourceForm {
  incomeSourceId: number | null;
  incomeSourceName: string;
  isActive: boolean;
  excludeFromValidation: boolean;
}

@Component({
  selector: 'app-indigent-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './indigent-config.component.html',
  styleUrl: './indigent-config.component.css'
})
export class IndigentConfigComponent implements OnInit {
  activeTab: ConfigTab = 'types';
  loading = signal(true);
  submitting = signal(false);
  seeding = signal(false);

  indigentTypes = signal<IndigentType[]>([]);
  contractors = signal<Contractor[]>([]);
  letters = signal<AutomatedLetter[]>([]);
  declineReasons = signal<DeclineReason[]>([]);
  providers = signal<VerificationProvider[]>([]);
  docTypes = signal<ATTPDocumentType[]>([]);
  incomeSources = signal<IncomeSourceItem[]>([]);
  employers = signal<Employer[]>([]);

  typeModalOpen = false;
  editType: IndigentTypeRule = this.emptyType();
  typeSubRules: { propertyCategoryId: number; nameTypeId: number; propertyCategoryName: string; nameTypeName: string; subRuleId?: number }[] = [];
  newSubRule = { propertyCategoryId: 0, nameTypeId: 0, propertyCategoryName: '', nameTypeName: '' };
  propertyCategories = signal<{ id: number; name: string }[]>([]);
  nameTypes = signal<{ id: number; name: string }[]>([]);

  typesLoadFailed = signal(false);
  contractorsLoadFailed = signal(false);
  reasonsLoadFailed = signal(false);
  providersLoadFailed = signal(false);
  incomeSourcesLoadFailed = signal(false);
  employersLoadFailed = signal(false);
  occupierTypesLoadFailed = signal(false);
  contractorModalOpen = false;
  editContractor: ContractorForm = this.emptyContractor();

  letterModalOpen = false;
  editLetter: LetterForm = this.emptyLetter();

  providerModalOpen = false;
  editProvider: ProviderForm = this.emptyProvider();

  docTypeModalOpen = false;
  editDocType: { documentTypeId: number | null; documentTypeName: string; isRequired: boolean; isActive: boolean; indigentTypeId: number | null } = this.emptyDocType();

  reasonModalOpen = false;
  editReason: DeclineReasonForm = this.emptyReason();

  incomeSourceModalOpen = false;
  editIncomeSource: IncomeSourceForm = this.emptyIncomeSource();

  employerModalOpen = false;
  editEmployer: { employerId: number | null; employerName: string; isActive: boolean } = this.emptyEmployer();

  occupierTypes = signal<OccupierTypeConfig[]>([]);
  occupierTypeModalOpen = false;
  editOccupierType: { occupierTypeId: number | null; name: string; includeInHouseholdIncome: boolean; isActive: boolean } = this.emptyOccupierType();

  constructor(
    private svc: IndigentService,
    private auth: AuthService,
    private toast: ToastService
  ) {}

  private get userId(): number { return this.auth.user()?.user_ID || 0; }

  ngOnInit(): void { this.loadData(); }

  async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      const [typesRes, contractorsRes, lettersRes, reasonsRes, providersRes, docTypesRes, incomeRes, employersRes, propCatRes, nameTypesRes, occTypesRes] = await Promise.allSettled([
        firstValueFrom(this.svc.getIndigentTypes()),
        firstValueFrom(this.svc.getContractors()),
        firstValueFrom(this.svc.getAutomatedLetters()),
        firstValueFrom(this.svc.getDeclineReasons()),
        firstValueFrom(this.svc.getVerificationProviders()),
        firstValueFrom(this.svc.getDocumentTypes()),
        firstValueFrom(this.svc.getIncomeSources()),
        firstValueFrom(this.svc.getEmployers()),
        firstValueFrom(this.svc.getPropertyCategories()),
        firstValueFrom(this.svc.getNameTypes()),
        firstValueFrom(this.svc.getOccupierTypes()),
      ]);
      if (typesRes.status === 'fulfilled') {
        this.indigentTypes.set(Array.isArray(typesRes.value) ? typesRes.value : []);
        this.typesLoadFailed.set(false);
      } else { this.typesLoadFailed.set(true); }

      if (contractorsRes.status === 'fulfilled') {
        this.contractors.set(Array.isArray(contractorsRes.value) ? contractorsRes.value : []);
        this.contractorsLoadFailed.set(false);
      } else { this.contractorsLoadFailed.set(true); }

      if (lettersRes.status === 'fulfilled') this.letters.set(Array.isArray(lettersRes.value) ? lettersRes.value : []);

      if (reasonsRes.status === 'fulfilled') {
        this.declineReasons.set(Array.isArray(reasonsRes.value) ? reasonsRes.value : []);
        this.reasonsLoadFailed.set(false);
      } else { this.reasonsLoadFailed.set(true); }

      if (providersRes.status === 'fulfilled') {
        this.providers.set(Array.isArray(providersRes.value) ? providersRes.value : []);
        this.providersLoadFailed.set(false);
      } else { this.providersLoadFailed.set(true); }

      if (docTypesRes.status === 'fulfilled') this.docTypes.set(Array.isArray(docTypesRes.value) ? docTypesRes.value : []);

      if (incomeRes.status === 'fulfilled') {
        this.incomeSources.set(Array.isArray(incomeRes.value) ? incomeRes.value : []);
        this.incomeSourcesLoadFailed.set(false);
      } else { this.incomeSourcesLoadFailed.set(true); }

      if (employersRes.status === 'fulfilled') {
        this.employers.set(Array.isArray(employersRes.value) ? employersRes.value : []);
        this.employersLoadFailed.set(false);
      } else { this.employersLoadFailed.set(true); }

      if (propCatRes.status === 'fulfilled') this.propertyCategories.set(Array.isArray(propCatRes.value) ? propCatRes.value : []);
      if (nameTypesRes.status === 'fulfilled') this.nameTypes.set(Array.isArray(nameTypesRes.value) ? nameTypesRes.value : []);

      if (occTypesRes.status === 'fulfilled') {
        this.occupierTypes.set(Array.isArray(occTypesRes.value) ? occTypesRes.value : []);
        this.occupierTypesLoadFailed.set(false);
      } else { this.occupierTypesLoadFailed.set(true); }

      const failCount = [typesRes, contractorsRes, reasonsRes, providersRes, incomeRes, employersRes, occTypesRes].filter(r => r.status === 'rejected').length;
      if (failCount > 0) {
        this.toast.show(`${failCount} configuration section(s) failed to load from Platinum API`, 'warning');
      }
    } catch {
      this.toast.show('Failed to load configuration', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  setTab(tab: ConfigTab): void { this.activeTab = tab; }

  emptyType(): IndigentTypeRule {
    return {
      indigentTypeId: null, indigentTypeName: '', marketValueQualification: 0, incomeLimit: 0, enableIncomeSlidingScale: false, incomeSlidingScale: [],
      reApplicationPeriod: 12, reapplicationBaseDate: 'application' as const, reApplicationReminderDays: [],
      reApplicationReminderEmail: false, reApplicationReminderSms: false, reApplicationReminderWhatsapp: false,
      autoTerminateOnExpiry: false, autoTerminationTrigger: 'reapply_expiry' as any, autoTerminateGraceDays: 0,
      autoTerminateNotifyEmail: false, autoTerminateNotifySms: false, autoTerminateNotifyWhatsapp: false,
      applicationPeriod: 12, isMultipleProperty: false, isStaffMember: false,
      isSupplierToMunicipality: false, isCompanyDirector: false, isGovernmentEmployee: false,
      isBusinessProperty: false, isDeceasedEstate: false, vehicleValueLimit: 0, propertySizeLimit: 0,
      minAge: 0, maxAge: 0, minDependants: 0, isPensioner: false, arrearsToleranceAmount: 0,
      requireDhaVerification: false, requireCreditBureauCheck: false, requireSarsIncomeCheck: false,
      requireBiometricVerification: false, requireSaCitizenship: false, allowRefugeeStatus: false,
      subsidyPercentage: 0, incomeBandUpper: 0, autoQualifyChildHeaded: false,
      autoQualifyNoInfrastructure: false, exemptSeniorsFromRenewal: false, seniorExemptionAge: 0, seniorExtendedPeriod: 0,
      enableDwellingUnits: false, excludeAdditionalDwellingIncome: true,
      enableSiteVerification: true, verificationRequired: false, maxVerificationAttempts: 0,
      verificationSLADays: 14, allocationMethod: 'manual' as const,
      enableDocumentVerification: false,
      referralWorkflow: { enableReferToContractor: true, enableReferToCapturer: true, enableReferToSupervisor: true, enableReferToSteeringCommittee: true, supervisorCanReferToContractor: true, supervisorCanReferToCapturer: true, supervisorCanReferToDocVerifier: true, supervisorCanReferToSteeringCommittee: true },
      writeOffCycleMonths: 12,
      enableWriteOffOnApproval: true, enableContinuousWriteOff: false,
      writeOffApprovalMode: 'first_application' as 'disabled' | 'first_application' | 'per_financial_year',
      writeOffMaxFinancialYears: null as number | null,
      writeOffScope: 'all_debits' as 'all_debits' | 'all_services' | 'monthly_debits' | 'ageing_bracket',
      writeOffAgeingMinDays: null as number | null,
      writeOffAgeingMaxDays: null as number | null,
      enableFinancialYearEndWriteOff: false,
      continuousWriteOffIntervalMonths: 12, writeOffDocumentTypeId: null,
      writeOffNotifyEmail: false, writeOffNotifySms: false, writeOffNotifyWhatsapp: false,
      writeOffHandoverDebt: true, terminateHandoverOnApproval: true, terminateRepaymentPlanOnApproval: true,
      isActive: true,
      enableIndigentCommunications: false,
      ccStakeholders: [],
      communicationTemplates: JSON.parse(JSON.stringify(DEFAULT_COMMUNICATION_TEMPLATES)),
      applicationSlaTargetDays: 30,
      standardQualificationTests: JSON.parse(JSON.stringify(STANDARD_QUALIFICATION_TESTS)),
      municipalPolicyTests: JSON.parse(JSON.stringify(MUNICIPAL_POLICY_TESTS)),
      reportConfig: JSON.parse(JSON.stringify(DEFAULT_REPORT_CONFIG)),
      subRules: []
    };
  }

  emptyContractor(): ContractorForm {
    return { contractorId: 0, contractorName: '', contactPerson: '', contactPhone: '', contactEmail: '', isActive: true };
  }

  emptyLetter(): LetterForm {
    return { letterId: 0, indigentTypeId: 0, letterType: '', templateName: '', isActive: true, triggerEvent: '' };
  }

  emptyProvider(): ProviderForm {
    return {
      providerId: null, providerName: '', providerType: '', apiEndpoint: '', apiCredentials: '',
      timeoutSeconds: 0, fieldMapping: '', fallbackEnabled: false, offlineMode: false,
      isActive: true, contactPerson: '', contactEmail: '', contactPhone: ''
    };
  }

  emptyDocType(): { documentTypeId: number | null; documentTypeName: string; isRequired: boolean; isActive: boolean; indigentTypeId: number | null } {
    return { documentTypeId: null, documentTypeName: '', isRequired: false, isActive: true, indigentTypeId: null };
  }

  emptyReason(): DeclineReasonForm {
    return { declineReasonId: null, declineReasonName: '', isActive: true };
  }

  emptyIncomeSource(): IncomeSourceForm {
    return { incomeSourceId: null, incomeSourceName: '', isActive: true, excludeFromValidation: false };
  }

  emptyEmployer(): { employerId: number | null; employerName: string; isActive: boolean } {
    return { employerId: null, employerName: '', isActive: true };
  }

  emptyOccupierType(): { occupierTypeId: number | null; name: string; includeInHouseholdIncome: boolean; isActive: boolean } {
    return { occupierTypeId: null, name: '', includeInHouseholdIncome: true, isActive: true };
  }

  togglingTypeId = signal<number | null>(null);
  toggleConfirmType = signal<IndigentType | null>(null);

  requestToggleTypeActive(type: IndigentType): void {
    if (this.togglingTypeId() != null) return;
    this.toggleConfirmType.set(type);
  }

  cancelToggleConfirm(): void {
    this.toggleConfirmType.set(null);
  }

  async confirmToggleTypeActive(): Promise<void> {
    const type = this.toggleConfirmType();
    if (!type) return;
    const nextActive = !type.isActive;
    const verb = nextActive ? 'activated' : 'deactivated';
    this.togglingTypeId.set(type.indigentTypeId);
    this.toggleConfirmType.set(null);
    try {
      const now = new Date().toISOString();
      const payload = { ...type, isActive: nextActive, modifierID: this.userId, dateModified: now } as any;
      await firstValueFrom(this.svc.saveIndigentTypeRules(payload));
      this.toast.show(`"${type.indigentTypeName}" has been ${verb}.`, 'success');
      await this.loadData();
    } catch (e: any) {
      this.toast.show(`Unable to update status: ${e?.error?.message || e?.message || 'unknown error'}`, 'error');
    } finally {
      this.togglingTypeId.set(null);
    }
  }

  openTypeModal(type?: IndigentType): void {
    if (type) {
      this.editType = {
        indigentTypeId: type.indigentTypeId, indigentTypeName: type.indigentTypeName,
        marketValueQualification: type.marketValueQualification, incomeLimit: type.incomeLimit,
        enableIncomeSlidingScale: !!type.enableIncomeSlidingScale,
        incomeSlidingScale: Array.isArray(type.incomeSlidingScale) ? type.incomeSlidingScale.map((b: any) => ({ maxIncome: b.maxIncome || 0, subsidyPercent: b.subsidyPercent || 0, category: b.category || '' })) : [],
        reApplicationPeriod: type.reApplicationPeriod,
        reapplicationBaseDate: type.reapplicationBaseDate || 'application',
        reApplicationReminderDays: type.reApplicationReminderDays || [],
        reApplicationReminderEmail: !!type.reApplicationReminderEmail,
        reApplicationReminderSms: !!type.reApplicationReminderSms,
        reApplicationReminderWhatsapp: !!type.reApplicationReminderWhatsapp,
        autoTerminateOnExpiry: !!type.autoTerminateOnExpiry,
        autoTerminationTrigger: type.autoTerminationTrigger || 'reapply_expiry',
        autoTerminateGraceDays: type.autoTerminateGraceDays || 0,
        autoTerminateNotifyEmail: !!type.autoTerminateNotifyEmail,
        autoTerminateNotifySms: !!type.autoTerminateNotifySms,
        autoTerminateNotifyWhatsapp: !!type.autoTerminateNotifyWhatsapp,
        applicationPeriod: type.applicationPeriod,
        isMultipleProperty: type.isMultipleProperty, isStaffMember: type.isStaffMember,
        isSupplierToMunicipality: type.isSupplierToMunicipality,
        isCompanyDirector: !!type.isCompanyDirector,
        isGovernmentEmployee: !!type.isGovernmentEmployee,
        isBusinessProperty: !!type.isBusinessProperty,
        isDeceasedEstate: !!type.isDeceasedEstate,
        vehicleValueLimit: type.vehicleValueLimit || 0,
        propertySizeLimit: type.propertySizeLimit || 0,
        minAge: type.minAge || 0, maxAge: type.maxAge || 0,
        minDependants: type.minDependants || 0,
        isPensioner: !!type.isPensioner,
        arrearsToleranceAmount: type.arrearsToleranceAmount || 0,
        requireDhaVerification: !!type.requireDhaVerification,
        requireCreditBureauCheck: !!type.requireCreditBureauCheck,
        requireSarsIncomeCheck: !!type.requireSarsIncomeCheck,
        requireBiometricVerification: !!type.requireBiometricVerification,
        requireSaCitizenship: !!type.requireSaCitizenship,
        allowRefugeeStatus: !!type.allowRefugeeStatus,
        subsidyPercentage: type.subsidyPercentage || 0,
        incomeBandUpper: type.incomeBandUpper || 0,
        autoQualifyChildHeaded: !!type.autoQualifyChildHeaded,
        autoQualifyNoInfrastructure: !!type.autoQualifyNoInfrastructure,
        exemptSeniorsFromRenewal: !!type.exemptSeniorsFromRenewal,
        seniorExemptionAge: type.seniorExemptionAge || 0,
        seniorExtendedPeriod: type.seniorExtendedPeriod || 0,
        enableDwellingUnits: !!type.enableDwellingUnits,
        excludeAdditionalDwellingIncome: type.excludeAdditionalDwellingIncome !== false,
        enableSiteVerification: type.enableSiteVerification !== false,
        verificationRequired: type.verificationRequired,
        maxVerificationAttempts: type.maxVerificationAttempts,
        verificationSLADays: type.verificationSLADays || 14,
        allocationMethod: type.allocationMethod || 'manual',
        enableDocumentVerification: !!type.enableDocumentVerification,
        referralWorkflow: { enableReferToContractor: true, enableReferToCapturer: true, enableReferToSupervisor: true, enableReferToSteeringCommittee: true, supervisorCanReferToContractor: true, supervisorCanReferToCapturer: true, supervisorCanReferToDocVerifier: true, supervisorCanReferToSteeringCommittee: true, ...(type.referralWorkflow ? JSON.parse(JSON.stringify(type.referralWorkflow)) : {}) },
        writeOffCycleMonths: type.writeOffCycleMonths,
        enableWriteOffOnApproval: type.enableWriteOffOnApproval !== false,
        writeOffApprovalMode: type.writeOffApprovalMode || (type.enableWriteOffOnApproval !== false ? 'first_application' : 'disabled'),
        writeOffMaxFinancialYears: type.writeOffMaxFinancialYears ?? null,
        writeOffScope: (type as any).writeOffScope || 'all_debits',
        writeOffAgeingMinDays: (type as any).writeOffAgeingMinDays ?? null,
        writeOffAgeingMaxDays: (type as any).writeOffAgeingMaxDays ?? null,
        enableFinancialYearEndWriteOff: !!(type as any).enableFinancialYearEndWriteOff,
        enableContinuousWriteOff: !!type.enableContinuousWriteOff,
        continuousWriteOffIntervalMonths: type.continuousWriteOffIntervalMonths || 12,
        writeOffDocumentTypeId: type.writeOffDocumentTypeId || null,
        writeOffNotifyEmail: !!type.writeOffNotifyEmail,
        writeOffNotifySms: !!type.writeOffNotifySms,
        writeOffNotifyWhatsapp: !!type.writeOffNotifyWhatsapp,
        writeOffHandoverDebt: type.writeOffHandoverDebt !== false,
        terminateHandoverOnApproval: type.terminateHandoverOnApproval !== false,
        terminateRepaymentPlanOnApproval: type.terminateRepaymentPlanOnApproval !== false,
        isActive: type.isActive,
        enableIndigentCommunications: !!type.enableIndigentCommunications,
        ccStakeholders: Array.isArray(type.ccStakeholders) && type.ccStakeholders.length ? JSON.parse(JSON.stringify(type.ccStakeholders)) : [],
        communicationTemplates: Array.isArray(type.communicationTemplates) && type.communicationTemplates.length ? JSON.parse(JSON.stringify(type.communicationTemplates)) : JSON.parse(JSON.stringify(DEFAULT_COMMUNICATION_TEMPLATES)),
        applicationSlaTargetDays: type.applicationSlaTargetDays || 30,
        standardQualificationTests: this.mergeTests(type.standardQualificationTests, STANDARD_QUALIFICATION_TESTS),
        municipalPolicyTests: this.mergeTests(type.municipalPolicyTests, MUNICIPAL_POLICY_TESTS),
        reportConfig: { ...JSON.parse(JSON.stringify(DEFAULT_REPORT_CONFIG)), ...(type.reportConfig || {}) },
      };
      if (!type.standardQualificationTests?.length) {
        const applyLegacy = (testId: string, flag: boolean) => {
          const t = this.editType.standardQualificationTests?.find(x => x.testId === testId);
          if (t) t.enabled = flag;
        };
        applyLegacy('multiple_properties', !!type.isMultipleProperty);
        applyLegacy('pensioner_status', !!type.isPensioner);
        applyLegacy('citizenship', !!type.requireSaCitizenship);
        if (type.minDependants > 0) applyLegacy('dependants', true);
      }
      if (!type.municipalPolicyTests?.length) {
        const applyLegacy = (testId: string, flag: boolean) => {
          const t = this.editType.municipalPolicyTests?.find(x => x.testId === testId);
          if (t) t.enabled = flag;
        };
        applyLegacy('staff_member', !!type.isStaffMember);
        applyLegacy('govt_employee', !!type.isGovernmentEmployee);
        applyLegacy('company_director', !!type.isCompanyDirector);
        applyLegacy('municipal_supplier', !!type.isSupplierToMunicipality);
        applyLegacy('business_property', !!type.isBusinessProperty);
        applyLegacy('deceased_estate', !!type.isDeceasedEstate);
        applyLegacy('dha_verification', !!type.requireDhaVerification);
        applyLegacy('credit_bureau', !!type.requireCreditBureauCheck);
        applyLegacy('sars_income', !!type.requireSarsIncomeCheck);
        applyLegacy('biometric', !!type.requireBiometricVerification);
        applyLegacy('child_headed_auto', !!type.autoQualifyChildHeaded);
        applyLegacy('no_infrastructure_auto', !!type.autoQualifyNoInfrastructure);
      }
      this.typeSubRules = [];
      firstValueFrom(this.svc.getIndigentTypeSubRules(type.indigentTypeId)).then(subRules => {
        const cats = this.propertyCategories();
        this.typeSubRules = (subRules || []).map((sr: any) => {
          const catId = sr.ntPropertyCategoryId ?? sr.propertyCategoryId ?? 0;
          const catMatch = cats.find(c => c.id === catId);
          return {
            propertyCategoryId: catId,
            nameTypeId: sr.nameTypeId,
            propertyCategoryName: catMatch?.name || sr.propertyCategoryName || '',
            nameTypeName: sr.nameTypeName || '',
            subRuleId: sr.subRuleId ?? sr.id
          };
        });
      }).catch(() => { this.typeSubRules = []; });
    } else {
      this.editType = this.emptyType();
      this.typeSubRules = [];
    }
    this.newSubRule = { propertyCategoryId: 0, nameTypeId: 0, propertyCategoryName: '', nameTypeName: '' };
    this.syncTestFieldsBeforeSave();
    this.typeModalOpen = true;
  }

  onCategorySelect(catId: any): void {
    const id = Number(catId);
    this.newSubRule.propertyCategoryId = id;
    const cat = this.propertyCategories().find(c => c.id === id);
    this.newSubRule.propertyCategoryName = cat?.name || '';
  }

  onNameTypeSelect(ntId: any): void {
    const id = Number(ntId);
    this.newSubRule.nameTypeId = id;
    const nt = this.nameTypes().find(n => n.id === id);
    this.newSubRule.nameTypeName = nt?.name || '';
  }

  getNameTypeName(id: number): string {
    const nt = this.nameTypes().find(n => n.id === id);
    return nt?.name || '';
  }

  addSubRule(): void {
    if (!this.newSubRule.propertyCategoryId || !this.newSubRule.nameTypeId) {
      this.toast.show('Property category and name type are required', 'error');
      return;
    }
    const exists = this.typeSubRules.some(
      sr => sr.propertyCategoryId === this.newSubRule.propertyCategoryId && sr.nameTypeId === this.newSubRule.nameTypeId
    );
    if (exists) { this.toast.show('This sub-rule already exists', 'error'); return; }
    const cat = this.propertyCategories().find(c => c.id === this.newSubRule.propertyCategoryId);
    const nt = this.nameTypes().find(n => n.id === this.newSubRule.nameTypeId);
    this.typeSubRules.push({
      propertyCategoryId: this.newSubRule.propertyCategoryId,
      nameTypeId: this.newSubRule.nameTypeId,
      propertyCategoryName: cat?.name || this.newSubRule.propertyCategoryName || `Category ${this.newSubRule.propertyCategoryId}`,
      nameTypeName: nt?.name || this.newSubRule.nameTypeName || `Type ${this.newSubRule.nameTypeId}`,
    });
    this.newSubRule = { propertyCategoryId: 0, nameTypeId: 0, propertyCategoryName: '', nameTypeName: '' };
  }

  removeSubRule(index: number): void { this.typeSubRules.splice(index, 1); }

  newReminderDay = 0;

  addReminderDay(): void {
    if (!this.newReminderDay || this.newReminderDay <= 0) {
      this.toast.show('Enter a positive number of days', 'error');
      return;
    }
    if (this.editType.reApplicationReminderDays.includes(this.newReminderDay)) {
      this.toast.show('This reminder interval already exists', 'error');
      return;
    }
    this.editType.reApplicationReminderDays.push(this.newReminderDay);
    this.editType.reApplicationReminderDays.sort((a, b) => b - a);
    this.newReminderDay = 0;
  }

  removeReminderDay(index: number): void {
    this.editType.reApplicationReminderDays.splice(index, 1);
  }

  addIncomeBracket(): void {
    this.editType.incomeSlidingScale.push({ maxIncome: 0, subsidyPercent: 100, category: '' });
  }

  removeIncomeBracket(index: number): void {
    this.editType.incomeSlidingScale.splice(index, 1);
  }

  sortIncomeBrackets(): void {
    this.editType.incomeSlidingScale.sort((a, b) => a.maxIncome - b.maxIncome);
  }

  private mergeTests(saved: PolicyValidationTest[] | undefined, defaults: PolicyValidationTest[]): PolicyValidationTest[] {
    const savedMap = new Map((saved || []).map(t => [t.testId, t]));
    return defaults.map(d => {
      const s = savedMap.get(d.testId);
      return s ? { ...d, enabled: s.enabled, configValue: s.configValue ?? d.configValue, severity: s.severity ?? d.severity, validationMode: s.validationMode ?? d.validationMode } : { ...d };
    });
  }

  getEnabledCount(tests: PolicyValidationTest[] | undefined): number {
    return (tests || []).filter(t => t.enabled).length;
  }

  toggleAllTests(tests: PolicyValidationTest[] | undefined, enabled: boolean): void {
    (tests || []).forEach(t => t.enabled = enabled);
  }

  syncLegacyToTest(legacyField: string): void {
    const fieldMap: Record<string, { list: 'standard' | 'municipal'; testId: string }> = {
      incomeLimit: { list: 'standard', testId: 'income_limit' },
      marketValueQualification: { list: 'standard', testId: 'property_value' },
      minDependants: { list: 'standard', testId: 'dependants' },
      vehicleValueLimit: { list: 'municipal', testId: 'vehicle_value' },
      propertySizeLimit: { list: 'municipal', testId: 'property_size' },
      arrearsToleranceAmount: { list: 'municipal', testId: 'arrears_tolerance' },
    };
    const mapping = fieldMap[legacyField];
    if (!mapping) return;
    const tests = mapping.list === 'standard' ? this.editType.standardQualificationTests : this.editType.municipalPolicyTests;
    const test = (tests || []).find(t => t.testId === mapping.testId);
    if (test) test.configValue = (this.editType as any)[legacyField];
  }

  syncTestToLegacy(testId: string, list: 'standard' | 'municipal'): void {
    const reverseMap: Record<string, string> = {
      income_limit: 'incomeLimit',
      property_value: 'marketValueQualification',
      dependants: 'minDependants',
      vehicle_value: 'vehicleValueLimit',
      property_size: 'propertySizeLimit',
      arrears_tolerance: 'arrearsToleranceAmount',
    };
    const tests = list === 'standard' ? this.editType.standardQualificationTests : this.editType.municipalPolicyTests;
    const test = (tests || []).find(t => t.testId === testId);
    if (testId === 'age_requirement' && test) {
      if (test.configValue !== undefined) this.editType.minAge = test.configValue;
      if (test.configValueMax !== undefined) this.editType.maxAge = test.configValueMax;
      return;
    }
    const legacyField = reverseMap[testId];
    if (!legacyField) return;
    if (test && test.configValue !== undefined) (this.editType as any)[legacyField] = test.configValue;
  }

  closeTypeModal(): void { this.typeModalOpen = false; }
  scrollToSection(id: string): void {
    const scrollArea = document.getElementById('type-modal-scroll');
    const el = document.getElementById(id);
    if (scrollArea && el) {
      scrollArea.scrollTo({ top: el.offsetTop - 16, behavior: 'smooth' });
    }
  }

  toggleSignatureMethod(method: 'draw' | 'type', enabled: boolean): void {
    if (!this.editType.reportConfig) return;
    const list: ('draw'|'type')[] = Array.isArray(this.editType.reportConfig.signatureMethods)
      ? [...this.editType.reportConfig.signatureMethods] : [];
    const idx = list.indexOf(method);
    if (enabled && idx === -1) list.push(method);
    if (!enabled && idx !== -1) list.splice(idx, 1);
    if (list.length === 0) list.push(method);
    this.editType.reportConfig.signatureMethods = list;
  }

  docsLinkedToEditingType = computed(() => {
    const typeId = this.editType?.indigentTypeId;
    if (!typeId) return [] as ATTPDocumentType[];
    return (this.docTypes() || []).filter(dt => Number(dt.indigentTypeId) === Number(typeId));
  });

  private syncTestFieldsBeforeSave(): void {
    const std = this.editType.standardQualificationTests || [];
    const mun = this.editType.municipalPolicyTests || [];
    const findTest = (tests: any[], id: string) => tests.find((t: any) => t.testId === id);

    const incomeTest = findTest(std, 'income_limit');
    if (incomeTest && incomeTest.configValue !== undefined) {
      this.editType.incomeLimit = incomeTest.configValue;
    }
    const propTest = findTest(std, 'property_value');
    if (propTest && propTest.configValue !== undefined) {
      this.editType.marketValueQualification = propTest.configValue;
    }
    const depTest = findTest(std, 'dependants');
    if (depTest && depTest.configValue !== undefined) {
      this.editType.minDependants = depTest.configValue;
    }
    const ageTest = findTest(std, 'age_requirement');
    if (ageTest) {
      if (ageTest.configValue !== undefined) this.editType.minAge = ageTest.configValue;
      if (ageTest.configValueMax !== undefined) this.editType.maxAge = ageTest.configValueMax;
    }
    const multiTest = findTest(std, 'multiple_properties');
    if (multiTest) this.editType.isMultipleProperty = multiTest.enabled;
    const pensTest = findTest(std, 'pensioner_status');
    if (pensTest) this.editType.isPensioner = pensTest.enabled;
    const citizenTest = findTest(std, 'citizenship');
    if (citizenTest) this.editType.requireSaCitizenship = citizenTest.enabled;

    const vehTest = findTest(mun, 'vehicle_value');
    if (vehTest && vehTest.configValue !== undefined) {
      this.editType.vehicleValueLimit = vehTest.configValue;
    }
    const sizeTest = findTest(mun, 'property_size');
    if (sizeTest && sizeTest.configValue !== undefined) {
      this.editType.propertySizeLimit = sizeTest.configValue;
    }
    const arrTest = findTest(mun, 'arrears_tolerance');
    if (arrTest && arrTest.configValue !== undefined) {
      this.editType.arrearsToleranceAmount = arrTest.configValue;
    }
    const staffTest = findTest(mun, 'staff_member');
    if (staffTest) this.editType.isStaffMember = staffTest.enabled;
    const govtTest = findTest(mun, 'govt_employee');
    if (govtTest) this.editType.isGovernmentEmployee = govtTest.enabled;
    const dirTest = findTest(mun, 'company_director');
    if (dirTest) this.editType.isCompanyDirector = dirTest.enabled;
    const suppTest = findTest(mun, 'municipal_supplier');
    if (suppTest) this.editType.isSupplierToMunicipality = suppTest.enabled;
    const bizTest = findTest(mun, 'business_property');
    if (bizTest) this.editType.isBusinessProperty = bizTest.enabled;
    const decTest = findTest(mun, 'deceased_estate');
    if (decTest) this.editType.isDeceasedEstate = decTest.enabled;
    const dhaTest = findTest(mun, 'dha_verification');
    if (dhaTest) this.editType.requireDhaVerification = dhaTest.enabled;
    const creditTest = findTest(mun, 'credit_bureau');
    if (creditTest) this.editType.requireCreditBureauCheck = creditTest.enabled;
    const sarsTest = findTest(mun, 'sars_income');
    if (sarsTest) this.editType.requireSarsIncomeCheck = sarsTest.enabled;
    const bioTest = findTest(mun, 'biometric');
    if (bioTest) this.editType.requireBiometricVerification = bioTest.enabled;
    const childTest = findTest(mun, 'child_headed_auto');
    if (childTest) this.editType.autoQualifyChildHeaded = childTest.enabled;
    const noInfraTest = findTest(mun, 'no_infrastructure_auto');
    if (noInfraTest) this.editType.autoQualifyNoInfrastructure = noInfraTest.enabled;
  }

  saveFailedFields = signal<{ field: string; label: string; sent: any; received: any }[]>([]);
  saveFailedDetail = signal<string>('');
  saveFailedRecommendation = signal<string>('');

  async saveType(): Promise<void> {
    if (this.submitting()) return;
    if (!this.editType.indigentTypeName) { this.toast.show('Type name is required', 'error'); return; }
    this.submitting.set(true);
    this.saveFailedFields.set([]);
    this.saveFailedDetail.set('');
    this.saveFailedRecommendation.set('');
    try {
      const now = new Date().toISOString();
      this.syncTestFieldsBeforeSave();
      this.editType.enableWriteOffOnApproval = this.editType.writeOffApprovalMode !== 'disabled';
      this.editType.verificationRequired = !!this.editType.enableSiteVerification;
      if (!this.editType.enableSiteVerification) { this.editType.maxVerificationAttempts = 0; }
      this.editType.writeOffCycleMonths = this.editType.enableContinuousWriteOff
        ? (this.editType.continuousWriteOffIntervalMonths || 0)
        : 0;
      if (this.editType.writeOffApprovalMode !== 'per_financial_year') {
        this.editType.writeOffMaxFinancialYears = null;
      }
      if (this.editType.writeOffScope !== 'ageing_bracket') {
        this.editType.writeOffAgeingMinDays = null;
        this.editType.writeOffAgeingMaxDays = null;
      } else {
        if (this.editType.writeOffAgeingMinDays != null && this.editType.writeOffAgeingMinDays < 0) this.editType.writeOffAgeingMinDays = 0;
        if (this.editType.writeOffAgeingMaxDays != null && this.editType.writeOffAgeingMaxDays < 0) this.editType.writeOffAgeingMaxDays = null;
        if (this.editType.writeOffAgeingMinDays != null && this.editType.writeOffAgeingMaxDays != null && this.editType.writeOffAgeingMaxDays < this.editType.writeOffAgeingMinDays) {
          this.editType.writeOffAgeingMaxDays = this.editType.writeOffAgeingMinDays;
        }
      }
      this.editType.subRules = this.typeSubRules.map(sr => ({
        propertyCategoryId: sr.propertyCategoryId, nameTypeId: sr.nameTypeId,
        propertyCategoryName: sr.propertyCategoryName, nameTypeName: sr.nameTypeName,
        subRuleId: sr.subRuleId,
      }));
      this.editType.capturerID = this.userId;
      this.editType.dateCaptured = now;
      this.editType.modifierID = this.userId;
      this.editType.dateModified = now;
      const savedType = await firstValueFrom(this.svc.saveIndigentTypeRules(this.editType));
      const resolvedTypeId = savedType?.indigentTypeId ?? this.editType.indigentTypeId;
      if (resolvedTypeId) {
        await firstValueFrom(this.svc.saveCommConfig({
          indigentTypeId: resolvedTypeId,
          enableIndigentCommunications: this.editType.enableIndigentCommunications,
          applicationSlaTargetDays: this.editType.applicationSlaTargetDays,
          ccStakeholders: this.editType.ccStakeholders,
          communicationTemplates: this.editType.communicationTemplates,
        })).catch(err => console.warn('[comm-config] Save failed (non-blocking):', err));
      }
      this.toast.show('Indigent type saved — all settings persisted', 'success');
      this.closeTypeModal();
      await this.loadData();
    } catch (e: any) {
      const status = e?.status;
      const errBody = e?.error;
      if (status === 422 && errBody?.failedFields?.length) {
        this.saveFailedFields.set(errBody.failedFields);
        this.saveFailedDetail.set(errBody.detail || '');
        this.saveFailedRecommendation.set(errBody.recommendation || '');
        this.toast.show(`Save failed — ${errBody.failedFields.length} setting(s) not persisted by Platinum API`, 'error');
      } else if (status === 207) {
        this.toast.show(errBody?.message || 'Save sent but could not verify', 'warning');
        this.closeTypeModal();
        await this.loadData();
      } else {
        this.toast.show(errBody?.message || 'Failed to save type', 'error');
      }
    } finally {
      this.submitting.set(false);
    }
  }

  openContractorModal(c?: Contractor): void {
    if (c) {
      this.editContractor = {
        contractorId: c.contractorId, contractorName: c.contractorName,
        contactPerson: c.contactPerson || '', contactPhone: c.contactPhone || '',
        contactEmail: c.contactEmail || '', isActive: c.isActive
      };
    } else {
      this.editContractor = this.emptyContractor();
    }
    this.contractorModalOpen = true;
  }

  closeContractorModal(): void { this.contractorModalOpen = false; }

  async saveContractor(): Promise<void> {
    if (this.submitting()) return;
    if (!this.editContractor.contractorName) { this.toast.show('Name is required', 'error'); return; }
    this.submitting.set(true);
    try {
      const now = new Date().toISOString();
      const request: SaveContractorRequest = {
        contractorId: this.editContractor.contractorId || null,
        contractorName: this.editContractor.contractorName,
        contactPerson: this.editContractor.contactPerson,
        contactPhone: this.editContractor.contactPhone,
        contactEmail: this.editContractor.contactEmail,
        isActive: this.editContractor.isActive,
        capturerID: this.userId, dateCaptured: now, modifierID: this.userId, dateModified: now,
      };
      await firstValueFrom(this.svc.saveContractor(request));
      this.toast.show('Contractor saved', 'success');
      this.closeContractorModal();
      await this.loadData();
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.toast.show(err?.error?.message || 'Failed to save contractor', 'error');
    } finally {
      this.submitting.set(false);
    }
  }

  openLetterModal(l?: AutomatedLetter): void {
    if (l) {
      this.editLetter = {
        letterId: l.letterId, indigentTypeId: l.indigentTypeId,
        letterType: l.letterType, templateName: l.templateName,
        isActive: l.isActive, triggerEvent: l.triggerEvent
      };
    } else {
      this.editLetter = this.emptyLetter();
    }
    this.letterModalOpen = true;
  }

  closeLetterModal(): void { this.letterModalOpen = false; }

  async saveLetter(): Promise<void> {
    if (this.submitting()) return;
    if (!this.editLetter.templateName) { this.toast.show('Template name required', 'error'); return; }
    this.submitting.set(true);
    try {
      const now = new Date().toISOString();
      const request: SaveAutomatedLetterRequest = {
        letterId: this.editLetter.letterId || null,
        indigentTypeId: this.editLetter.indigentTypeId,
        letterType: this.editLetter.letterType,
        templateName: this.editLetter.templateName,
        isActive: this.editLetter.isActive,
        triggerEvent: this.editLetter.triggerEvent,
        capturerID: this.userId, dateCaptured: now, modifierID: this.userId, dateModified: now,
      };
      await firstValueFrom(this.svc.saveAutomatedLetter(request));
      this.toast.show('Letter template saved', 'success');
      this.closeLetterModal();
      await this.loadData();
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.toast.show(err?.error?.message || 'Failed to save letter', 'error');
    } finally {
      this.submitting.set(false);
    }
  }

  providerCredentialsChanged = false;

  openProviderModal(p?: VerificationProvider): void {
    this.providerCredentialsChanged = false;
    if (p) {
      this.editProvider = {
        providerId: p.providerId, providerName: p.providerName,
        providerType: p.providerType, apiEndpoint: p.apiEndpoint || '',
        apiCredentials: '',
        timeoutSeconds: p.timeoutSeconds || 0,
        fieldMapping: p.fieldMapping || '',
        fallbackEnabled: !!p.fallbackEnabled,
        offlineMode: !!p.offlineMode,
        isActive: p.isActive, contactPerson: p.contactPerson || '',
        contactEmail: p.contactEmail || '', contactPhone: p.contactPhone || ''
      };
    } else {
      this.editProvider = this.emptyProvider();
    }
    this.providerModalOpen = true;
  }

  closeProviderModal(): void { this.providerModalOpen = false; }

  async saveProvider(): Promise<void> {
    if (this.submitting()) return;
    if (!this.editProvider.providerName) { this.toast.show('Provider name required', 'error'); return; }
    this.submitting.set(true);
    try {
      const now = new Date().toISOString();
      const request: SaveVerificationProviderRequest = {
        providerId: this.editProvider.providerId,
        providerName: this.editProvider.providerName,
        providerType: this.editProvider.providerType,
        apiEndpoint: this.editProvider.apiEndpoint || null,
        apiCredentials: this.providerCredentialsChanged ? (this.editProvider.apiCredentials || null) : null,
        timeoutSeconds: this.editProvider.timeoutSeconds || null,
        fieldMapping: this.editProvider.fieldMapping || null,
        fallbackEnabled: this.editProvider.fallbackEnabled,
        offlineMode: this.editProvider.offlineMode,
        isActive: this.editProvider.isActive,
        contactPerson: this.editProvider.contactPerson || null,
        contactEmail: this.editProvider.contactEmail || null,
        contactPhone: this.editProvider.contactPhone || null,
        capturerID: this.userId, dateCaptured: now, modifierID: this.userId, dateModified: now,
      };
      await firstValueFrom(this.svc.saveVerificationProvider(request));
      this.toast.show('Provider saved', 'success');
      this.closeProviderModal();
      await this.loadData();
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.toast.show(err?.error?.message || 'Failed to save provider', 'error');
    } finally {
      this.submitting.set(false);
    }
  }

  openAddDocTypeForEditingType(): void {
    const typeId = this.editType?.indigentTypeId ?? null;
    this.editDocType = { ...this.emptyDocType(), indigentTypeId: typeId };
    this.docTypeModalOpen = true;
  }

  openDocTypeModal(dt?: ATTPDocumentType): void {
    if (dt) {
      this.editDocType = {
        documentTypeId: dt.documentTypeId, documentTypeName: dt.documentTypeName,
        isRequired: dt.isRequired, isActive: dt.isActive,
        indigentTypeId: dt.indigentTypeId ?? null
      };
    } else {
      this.editDocType = this.emptyDocType();
    }
    this.docTypeModalOpen = true;
  }

  closeDocTypeModal(): void { this.docTypeModalOpen = false; }

  async saveDocType(): Promise<void> {
    if (this.submitting()) return;
    if (!this.editDocType.documentTypeName) { this.toast.show('Document type name required', 'error'); return; }
    this.submitting.set(true);
    try {
      const now = new Date().toISOString();
      const request: SaveDocumentTypeRequest = {
        documentTypeId: this.editDocType.documentTypeId,
        documentTypeName: this.editDocType.documentTypeName,
        isRequired: this.editDocType.isRequired,
        isActive: this.editDocType.isActive,
        indigentTypeId: this.editDocType.indigentTypeId,
        capturerID: this.userId, dateCaptured: now, modifierID: this.userId, dateModified: now,
      };
      await firstValueFrom(this.svc.saveDocumentType(request));
      this.toast.show('Document type saved', 'success');
      this.closeDocTypeModal();
      await this.loadData();
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.toast.show(err?.error?.message || 'Failed to save document type', 'error');
    } finally {
      this.submitting.set(false);
    }
  }

  openReasonModal(r?: DeclineReason): void {
    if (r) {
      this.editReason = {
        declineReasonId: r.declineReasonId,
        declineReasonName: r.declineReasonName,
        isActive: r.isActive
      };
    } else {
      this.editReason = this.emptyReason();
    }
    this.reasonModalOpen = true;
  }

  closeReasonModal(): void { this.reasonModalOpen = false; }

  async saveReason(): Promise<void> {
    if (this.submitting()) return;
    if (!this.editReason.declineReasonName) { this.toast.show('Reason name required', 'error'); return; }
    this.submitting.set(true);
    try {
      const now = new Date().toISOString();
      const request: SaveDeclineReasonRequest = {
        declineReasonId: this.editReason.declineReasonId,
        declineReasonName: this.editReason.declineReasonName,
        isActive: this.editReason.isActive,
        capturerID: this.userId, dateCaptured: now, modifierID: this.userId, dateModified: now,
      };
      await firstValueFrom(this.svc.saveDeclineReason(request));
      this.toast.show('Decline reason saved', 'success');
      this.closeReasonModal();
      await this.loadData();
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.toast.show(err?.error?.message || 'Failed to save decline reason', 'error');
    } finally {
      this.submitting.set(false);
    }
  }

  openIncomeSourceModal(is?: IncomeSourceItem): void {
    if (is) {
      this.editIncomeSource = {
        incomeSourceId: is.incomeSourceId,
        incomeSourceName: is.incomeSourceName,
        isActive: is.isActive,
        excludeFromValidation: is.excludeFromValidation || false
      };
    } else {
      this.editIncomeSource = this.emptyIncomeSource();
    }
    this.incomeSourceModalOpen = true;
  }

  closeIncomeSourceModal(): void { this.incomeSourceModalOpen = false; }

  openEmployerModal(e?: any): void {
    this.editEmployer = e
      ? { employerId: e.employerId, employerName: e.employerName, isActive: !!(e.isActive ?? true) }
      : this.emptyEmployer();
    this.employerModalOpen = true;
  }

  closeEmployerModal(): void { this.employerModalOpen = false; }

  async saveEmployer(): Promise<void> {
    if (this.submitting()) return;
    if (!this.editEmployer.employerName.trim()) { this.toast.show('Employer name is required', 'error'); return; }
    this.submitting.set(true);
    try {
      const now = new Date().toISOString();
      await firstValueFrom(this.svc.saveEmployer({
        employerId: this.editEmployer.employerId,
        employerName: this.editEmployer.employerName.trim(),
        isActive: this.editEmployer.isActive,
        capturerID: this.userId, dateCaptured: now,
        modifierID: this.userId, dateModified: now,
      }));
      this.toast.show('Employer saved', 'success');
      this.closeEmployerModal();
      await this.loadData();
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.toast.show(err?.error?.message || 'Failed to save employer', 'error');
    } finally {
      this.submitting.set(false);
    }
  }

  async saveIncomeSource(): Promise<void> {
    if (this.submitting()) return;
    if (!this.editIncomeSource.incomeSourceName) { this.toast.show('Income source name required', 'error'); return; }
    this.submitting.set(true);
    try {
      const now = new Date().toISOString();
      const request: SaveIncomeSourceRequest = {
        incomeSourceId: this.editIncomeSource.incomeSourceId,
        incomeSourceName: this.editIncomeSource.incomeSourceName,
        isActive: this.editIncomeSource.isActive,
        excludeFromValidation: this.editIncomeSource.excludeFromValidation,
        capturerID: this.userId, dateCaptured: now, modifierID: this.userId, dateModified: now,
      };
      await firstValueFrom(this.svc.saveIncomeSource(request));
      const savedId = this.editIncomeSource.incomeSourceId;
      const savedSnapshot = {
        incomeSourceName: this.editIncomeSource.incomeSourceName,
        isActive: this.editIncomeSource.isActive,
        excludeFromValidation: this.editIncomeSource.excludeFromValidation,
      };
      if (savedId != null) {
        this.incomeSources.update(list => list.map(it =>
          it.incomeSourceId === savedId ? { ...it, ...savedSnapshot } : it
        ));
      }
      this.toast.show('Income source saved', 'success');
      this.closeIncomeSourceModal();
      await this.loadData();
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.toast.show(err?.error?.message || 'Failed to save income source', 'error');
    } finally {
      this.submitting.set(false);
    }
  }

  async seedDefaultIncomeSources(): Promise<void> {
    if (this.seeding()) return;
    this.seeding.set(true);
    try {
      const result = await firstValueFrom(this.svc.seedIncomeSources());
      this.toast.show(`Created ${result.created} income sources`, 'success');
      if (result.errors?.length) {
        this.toast.show(`${result.errors.length} source(s) had issues`, 'warning');
      }
      await this.loadData();
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.toast.show(err?.error?.message || 'Failed to seed income sources', 'error');
    } finally {
      this.seeding.set(false);
    }
  }

  fmtCurrency(val: number): string { return 'R ' + (val ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  newCcName = '';
  newCcEmail = '';
  editingTemplateEvent: IndigentLifecycleEvent | null = null;

  get lifecycleEventLabels(): Record<string, string> { return LIFECYCLE_EVENT_LABELS; }

  addCcStakeholder(): void {
    if (!this.newCcName || !this.newCcEmail) { this.toast.show('Name and email are required', 'error'); return; }
    this.editType.ccStakeholders = [...(this.editType.ccStakeholders || []), { name: this.newCcName, email: this.newCcEmail }];
    this.newCcName = '';
    this.newCcEmail = '';
  }

  removeCcStakeholder(idx: number): void {
    this.editType.ccStakeholders = (this.editType.ccStakeholders || []).filter((_, i) => i !== idx);
  }

  getTemplate(event: IndigentLifecycleEvent): CommunicationTemplate {
    const templates = this.editType.communicationTemplates || [];
    let tpl = templates.find(t => t.eventType === event);
    if (!tpl) {
      const def = DEFAULT_COMMUNICATION_TEMPLATES.find(d => d.eventType === event);
      tpl = def ? JSON.parse(JSON.stringify(def)) : { eventType: event, emailEnabled: false, smsEnabled: false, subject: '', body: '' };
      this.editType.communicationTemplates = [...templates, tpl!];
    }
    return tpl!;
  }

  toggleTemplateChannel(event: IndigentLifecycleEvent, channel: 'emailEnabled' | 'smsEnabled'): void {
    const tpl = this.getTemplate(event);
    tpl[channel] = !tpl[channel];
  }

  openTemplateEditor(event: IndigentLifecycleEvent): void {
    this.editingTemplateEvent = event;
  }

  closeTemplateEditor(): void {
    this.editingTemplateEvent = null;
  }

  getEnabledCommCount(): number {
    return (this.editType.communicationTemplates || []).filter(t => t.emailEnabled || t.smsEnabled).length;
  }

  openOccupierTypeModal(ot?: OccupierTypeConfig): void {
    if (ot) {
      this.editOccupierType = { occupierTypeId: ot.occupierTypeId, name: ot.name, includeInHouseholdIncome: ot.includeInHouseholdIncome, isActive: ot.isActive };
    } else {
      this.editOccupierType = this.emptyOccupierType();
    }
    this.occupierTypeModalOpen = true;
  }

  closeOccupierTypeModal(): void { this.occupierTypeModalOpen = false; }

  async saveOccupierType(): Promise<void> {
    if (this.submitting()) return;
    if (!this.editOccupierType.name) { this.toast.show('Occupier type name required', 'error'); return; }
    this.submitting.set(true);
    try {
      await firstValueFrom(this.svc.saveOccupierType(this.editOccupierType));
      this.toast.show('Occupier type saved', 'success');
      this.closeOccupierTypeModal();
      await this.loadData();
    } catch (e: unknown) {
      const err = e as { error?: { message?: string } };
      this.toast.show(err?.error?.message || 'Failed to save occupier type', 'error');
    } finally {
      this.submitting.set(false);
    }
  }

  async deleteOccupierType(id: number): Promise<void> {
    if (!confirm('Deactivate this occupier type?')) return;
    try {
      await firstValueFrom(this.svc.deleteOccupierType(id));
      this.toast.show('Occupier type deactivated', 'success');
      await this.loadData();
    } catch {
      this.toast.show('Failed to deactivate occupier type', 'error');
    }
  }
}
