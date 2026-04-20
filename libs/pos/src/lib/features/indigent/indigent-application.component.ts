import { Component, signal, computed, effect, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';
import { IndigentService } from '../../services/indigent.service';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import * as QRCode from 'qrcode';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { CardComponent } from '../../shared/components/card.component';
import { SpinnerComponent } from '../../shared/components/spinner.component';
import { BadgeComponent } from '../../shared/components/badge.component';
import { DialogComponent } from '../../shared/components/dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { DocumentManagerComponent } from './shared/document-manager.component';
import { SignatureCaptureComponent } from './shared/signature-capture.component';
import { IDVerificationComponent } from './shared/id-verification.component';
import { DateInputComponent } from '../../shared/components/date-input.component';
import type {
  IndigentType,
  QualificationCheck,
  ApplicationDetail,
  SaveApplicationRequest,
  SaveApplicationResponse,
  SaveOccupierRequest,
  SaveOccupierResponse,
  Occupier,
  SaveTenantRequest,
  SaveTenantResponse,
  Tenant,
  Employer,
  IncomeSourceItem,
  ExistingApplication,
  AccountSearchResult,
  SmartQualificationData,
  SmartCheckResult,
  PolicyValidationTest,
  RequiredDocumentConfig,
  OccupierTypeConfig,
  ATTPSignature,
} from '../../models/indigent.models';
import { STANDARD_QUALIFICATION_TESTS, MUNICIPAL_POLICY_TESTS } from '../../models/indigent.models';

type AppView = 'search' | 'qualification' | 'documents' | 'form' | 'occupiers' | 'tenant' | 'summary';

interface AccountResult {
  accountId: number;
  accountNo: string;
  fullName: string;
  idNo: string;
  physicalAddress: string;
  postalAddress: string;
  cellNo: string;
  email: string;
  balance: number;
  sgNumber: string;
  accountStatus: string;
  propertyId: string;
  accountTypeId: number | null;
  allPhones: string[];
  allEmails: string[];
}

@Component({
  selector: 'app-indigent-application',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, CardComponent, SpinnerComponent, BadgeComponent, DialogComponent, ConfirmDialogComponent, EmptyStateComponent, DocumentManagerComponent, SignatureCaptureComponent, IDVerificationComponent, DateInputComponent],
  templateUrl: './indigent-application.component.html',
  styleUrl: './indigent-application.component.css'
})
export class IndigentApplicationComponent implements OnInit, OnDestroy {
  private routeSub?: Subscription;
  currentView = signal<AppView>('search');
  loading = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  searchQuery = signal('');
  searchResults = signal<AccountResult[]>([]);
  searchPerformed = signal(false);
  searchLoading = signal(false);

  autocompleteResults = signal<{accountId: number, displayItem: string, accountName: string, address: string, balance: number | null, status: string}[]>([]);
  showDropdown = signal(false);
  acLoading = signal(false);
  private debounceTimer: any = null;

  showDeleteOccupierConfirm = signal(false);
  pendingDeleteOccupier = signal<Occupier | null>(null);

  selectedAccount = signal<AccountResult | null>(null);
  indigentTypes = signal<IndigentType[]>([]);
  selectedIndigentTypeId = signal<number | null>(null);

  qualificationCheck = signal<QualificationCheck | null>(null);
  qualCheckLoading = signal(false);
  smartQualData = signal<SmartQualificationData | null>(null);
  smartCheckResults = signal<SmartCheckResult[]>([]);
  smartCheckLoading = signal(false);
  smartCheckDone = signal(false);
  manualOverrides = signal<Record<string, boolean>>({});

  standardChecks = computed(() => {
    const qc = this.qualificationCheck();
    if (!qc) return [];
    if (qc.standardChecks && qc.standardChecks.length > 0) return qc.standardChecks;
    return (qc.checks || []).filter(c => c.category === 'standard');
  });
  municipalChecks = computed(() => {
    const qc = this.qualificationCheck();
    if (!qc) return [];
    if (qc.municipalChecks && qc.municipalChecks.length > 0) return qc.municipalChecks;
    return (qc.checks || []).filter(c => c.category === 'municipal');
  });

  autoCheckResults = computed(() => this.smartCheckResults().filter(r => r.method === 'auto'));
  manualCheckResults = computed(() => this.smartCheckResults().filter(r => r.method === 'manual'));
  bureauCheckResults = computed(() => this.smartCheckResults().filter(r => r.method === 'bureau'));
  bothCheckResults = computed(() => this.smartCheckResults().filter(r => r.method === 'both'));

  smartQualificationPassed = computed(() => {
    const results = this.smartCheckResults();
    if (results.length === 0) return null;
    const overrides = this.manualOverrides();
    return results.every(r => {
      if (r.severity === 'warning') return true;
      if (r.method === 'auto') return r.passed === true;
      if (r.method === 'manual') return overrides[r.testId] === true;
      if (r.method === 'both') return r.passed === true && overrides[r.testId] === true;
      if (r.method === 'bureau') return overrides[r.testId] === true;
      return true;
    });
  });

  existingApplications = signal<ExistingApplication[]>([]);
  existingAppDetail = signal<ApplicationDetail | null>(null);
  viewingExisting = signal(false);
  readOnly = signal(false);
  checkingExistingApps = signal(false);
  accountExistingApps = signal<ExistingApplication[]>([]);

  applicationDate = signal(this.todayIso());
  commencementDate = signal(this.todayIso());
  reApplicationDate = signal(this.defaultReApplicationDate());
  terminationDate = signal(this.defaultTerminationDate());
  householdIncome = signal<number>(0);
  qualifiedSubsidyPercentage = signal<number | null>(null);
  remarks = signal('');
  altContactPhone = signal('');
  altContactEmail = signal('');
  isTenantApplication = signal(false);
  savingApp = signal(false);
  savedApplication = signal<SaveApplicationResponse | null>(null);

  occupiers = signal<Occupier[]>([]);
  employers = signal<Employer[]>([]);
  incomeSources = signal<IncomeSourceItem[]>([]);
  showOccupierDialog = signal(false);
  editingOccupier = signal<Occupier | null>(null);
  occForm = signal<{ fullName: string; idNumber: string; passportNumber: string; employerId: number; incomeSourceId: number; incomeAmount: number; dwellingUnitNo: number | string; occupierTypeId: number; contactNumber: string; relationship: string; dateOfBirth: string; gender: string; remarks: string }>({
    fullName: '',
    idNumber: '',
    passportNumber: '',
    employerId: 0,
    incomeSourceId: 0,
    incomeAmount: 0,
    dwellingUnitNo: 1,
    occupierTypeId: 0,
    contactNumber: '',
    relationship: '',
    dateOfBirth: '',
    gender: '',
    remarks: '',
  });
  savingOccupier = signal(false);
  occupierTypeConfigs = signal<OccupierTypeConfig[]>([]);
  occupierTypeOptions: { id: number; name: string }[] = [];
  occupierTypesLoadFailed = signal(false);

  // Account-holder-as-occupier form (mirrors occForm — populated when account is loaded)
  holderForm = signal<{ dateOfBirth: string; gender: string; occupierTypeId: number; relationship: string; contactNumber: string; employerId: number; incomeSourceId: number; incomeAmount: number }>({
    dateOfBirth: '', gender: '', occupierTypeId: 0, relationship: 'Account Holder',
    contactNumber: '', employerId: 0, incomeSourceId: 0, incomeAmount: 0,
  });

  holderTitle = signal<string>('');
  holderInitials = signal<string>('');
  holderFirstNames = signal<string>('');
  holderSurname = signal<string>('');

  tenantDetail = signal<Tenant | null>(null);
  tenantForm = signal({
    fullName: '',
    idNumber: '',
    passportNumber: '',
    physicalAddress: '',
    postalAddress: '',
    cellPhone: '',
    email: '',
  });
  savingTenant = signal(false);

  declarationConfirmed = signal(false);
  signatureCount = signal(0);

  onSignatureSaved(): void {
    this.signatureCount.update(c => c + 1);
  }

  isSummaryComplete(): boolean {
    if (!this.declarationConfirmed()) return false;
    if (this.isSignatureRequired() && this.signatureCount() === 0) return false;
    return true;
  }

  isSignatureRequired(): boolean {
    const typeId = this.selectedIndigentTypeId();
    const selectedType = this.indigentTypes().find(t => t.indigentTypeId === typeId) as any;
    return !!(selectedType?.reportConfig?.requireApplicantSignature);
  }

  signatureCfg(): { methods: ('draw'|'type')[]; requireConsent: boolean; consentText: string; attachPdf: boolean } {
    const typeId = this.selectedIndigentTypeId();
    const selectedType = this.indigentTypes().find(t => t.indigentTypeId === typeId) as any;
    const rc = selectedType?.reportConfig || {};
    const methods = Array.isArray(rc.signatureMethods) && rc.signatureMethods.length ? rc.signatureMethods.filter((m: any) => m === 'draw' || m === 'type') : ['draw', 'type'];
    return {
      methods: methods.length ? methods : ['draw'],
      requireConsent: rc.requireSignatureConsent !== false,
      consentText: rc.signatureConsentText || 'I confirm that the information provided in this application is true and correct to the best of my knowledge. I understand that providing false information is a criminal offence.',
      attachPdf: rc.attachSignedDeclarationPdf !== false,
    };
  }

  isPdfOnQualificationEnabled(): boolean {
    const typeId = this.selectedIndigentTypeId();
    const selectedType = this.indigentTypes().find(t => t.indigentTypeId === typeId) as any;
    return selectedType?.reportConfig?.generatePdfOnQualification === true;
  }

  isRejectionLetterEnabled(): boolean {
    const typeId = this.selectedIndigentTypeId();
    const selectedType = this.indigentTypes().find(t => t.indigentTypeId === typeId) as any;
    return !!(selectedType?.reportConfig?.generateRejectionLetter);
  }

  isAutoSendEnabled(channel: 'email' | 'sms' | 'whatsapp'): boolean {
    const typeId = this.selectedIndigentTypeId();
    const selectedType = this.indigentTypes().find(t => t.indigentTypeId === typeId) as any;
    const cfg = selectedType?.reportConfig || {};
    if (channel === 'email') return !!cfg.autoEmailResult;
    if (channel === 'sms') return !!cfg.autoSmsResult;
    if (channel === 'whatsapp') return !!cfg.autoWhatsappResult;
    return false;
  }

  showTenantOption = computed(() => {
    const acct = this.selectedAccount();
    return acct?.accountTypeId === 2 || this.isTenantApplication();
  });

  platinumDocsForSelectedType = computed(() => {
    const typeId = this.selectedIndigentTypeId();
    if (!typeId) return [] as any[];
    return (this.documentTypes() || [])
      .filter((dt: any) => dt && dt.documentTypeId != null && (dt.isActive !== false) && Number(dt.indigentTypeId) === Number(typeId))
      .map((dt: any) => ({
        documentKey: `dt_${dt.documentTypeId}`,
        documentLabel: dt.documentTypeName,
        documentTypeId: dt.documentTypeId,
        isRequired: !!dt.isRequired,
      }));
  });

  hasRequiredDocuments = computed(() => this.platinumDocsForSelectedType().some(d => d.isRequired));

  getRequiredDocsForType(): any[] { return this.platinumDocsForSelectedType(); }

  allRequiredDocsUploaded = computed(() => {
    const required = this.platinumDocsForSelectedType().filter(d => d.isRequired);
    if (required.length === 0) return true;
    const uploads = this.requiredDocUploads();
    return required.every((d: any) => {
      const docUploads = uploads[d.documentKey];
      return docUploads && docUploads.some((u: any) => u.uploaded);
    });
  });

  steps = computed<{ key: AppView; label: string; icon: string; done: boolean; active: boolean }[]>(() => {
    const view = this.currentView();
    const hasAccount = !!this.selectedAccount();
    const qualPassed = this.qualificationCheck()?.qualifies === true || this.smartQualificationPassed() === true;
    const hasSaved = !!this.savedApplication();
    const showDocs = this.platinumDocsForSelectedType().length > 0;
    const requiredDocsUploaded = this.allRequiredDocsUploaded();
    const docsDone = hasSaved && showDocs && requiredDocsUploaded;
    const occupiersDone = hasSaved && this.occupiers().length > 0;
    const submitted = !!(this.savedApplication() as any)?.submittedForVerification
      || ((this.savedApplication() as any)?.applicationStatusId ?? 0) >= 152;

    const baseSteps: { key: AppView; label: string; icon: string; done: boolean; active: boolean }[] = [
      { key: 'search', label: 'Find Account', icon: 'search', done: hasAccount, active: view === 'search' },
      { key: 'qualification', label: 'Qualification', icon: 'checklist', done: qualPassed, active: view === 'qualification' },
      { key: 'form', label: 'Application', icon: 'assignment', done: hasSaved, active: view === 'form' },
      { key: 'occupiers', label: 'Occupiers', icon: 'people', done: occupiersDone, active: view === 'occupiers' },
    ];
    if (this.isTenantApplication() && this.showTenantOption()) {
      baseSteps.push({ key: 'tenant', label: 'Tenant Info', icon: 'person', done: hasSaved && !!this.tenantDetail(), active: view === 'tenant' });
    }
    if (showDocs) {
      baseSteps.push({ key: 'documents', label: 'Documents', icon: 'upload_file', done: docsDone, active: view === 'documents' });
    }
    baseSteps.push(
      { key: 'summary', label: 'Summary', icon: 'check_circle', done: submitted, active: view === 'summary' },
    );
    return baseSteps;
  });

  qrCodeDataUrl = signal<string>('');

  async generateApplicationQR(): Promise<void> {
    const app = this.savedApplication();
    const acct = this.selectedAccount();
    if (!app?.applicationId || !acct?.accountNo) { this.qrCodeDataUrl.set(''); return; }
    const origin = window.location.origin;
    const url = `${origin}/indigent/scan?account=${encodeURIComponent(acct.accountNo)}&app=${app.applicationId}&v=1`;
    try {
      const dataUrl = await QRCode.toDataURL(url, { errorCorrectionLevel: 'M', margin: 1, width: 220 });
      this.qrCodeDataUrl.set(dataUrl);
    } catch { this.qrCodeDataUrl.set(''); }
  }

  previousStep = computed<{ key: AppView; label: string } | null>(() => {
    const list = this.steps();
    const idx = list.findIndex(s => s.active);
    if (idx <= 0) return null;
    const prev = list[idx - 1];
    return { key: prev.key, label: prev.label };
  });

  goBack(): void {
    const prev = this.previousStep();
    if (!prev) return;
    this.currentView.set(prev.key);
    this.error.set(null);
    this.successMessage.set(null);
    if (prev.key === 'documents') this.loadSavedDocsForCurrentApp();
  }

  canNavigateTo = computed(() => {
    const hasAccount = !!this.selectedAccount();
    const qualPassed = this.qualificationCheck()?.qualifies === true || this.smartQualificationPassed() === true;
    const hasSaved = !!this.savedApplication();
    const isTenant = this.isTenantApplication();
    const tenantDone = !!this.tenantDetail();
    const showDocs = this.platinumDocsForSelectedType().length > 0;
    const requiredDocsUploaded = this.allRequiredDocsUploaded();
    const occupiersDone = hasSaved && this.occupiers().length > 0;
    return {
      search: true,
      qualification: hasAccount,
      form: hasAccount && (qualPassed || hasSaved),
      occupiers: hasSaved,
      tenant: hasSaved && isTenant,
      documents: occupiersDone && (!isTenant || tenantDone),
      summary: occupiersDone && (!isTenant || tenantDone) && (!showDocs || requiredDocsUploaded),
    };
  });

  constructor(
    private indigentService: IndigentService,
    private auth: AuthService,
    private route: ActivatedRoute,
    private api: ApiService,
    private router: Router,
    private toast: ToastService,
  ) {
    effect(() => {
      const types = this.indigentTypes();
      const occs = this.occupiers();
      const sources = this.incomeSources();
      const occCfgs = this.occupierTypeConfigs();
      const typeId = this.selectedIndigentTypeId();
      if (!typeId || !types.length) return;
      const cfg: any = types.find(t => t.indigentTypeId === typeId);
      if (!cfg) return;
      const slidingEnabled = !!cfg.enableIncomeSlidingScale && Array.isArray(cfg.incomeSlidingScale) && cfg.incomeSlidingScale.length > 0;
      const validatable = this.getValidatableIncome();
      if (slidingEnabled) {
        const brackets = [...cfg.incomeSlidingScale].sort((a: any, b: any) => a.maxIncome - b.maxIncome);
        const matched = brackets.find((b: any) => validatable <= b.maxIncome);
        this.qualifiedSubsidyPercentage.set(matched ? matched.subsidyPercent : 0);
      } else if ((cfg.incomeLimit || 0) > 0) {
        this.qualifiedSubsidyPercentage.set(validatable <= cfg.incomeLimit ? 100 : 0);
      }
    }, { allowSignalWrites: true });
  }

  goBackToDashboard(): void {
    this.router.navigate(['/pos/indigent/dashboard']);
  }

  private get userId(): number { return this.auth.user()?.user_ID || 0; }

  ngOnInit(): void {
    this.loadLookups();
    this.routeSub = this.route.queryParams.subscribe(params => {
      const appId = params['applicationId'] || params['ApplicationId'] || params['appId'] || params['AppId'];
      const source = params['source'] || params['Source'] || '';
      if (appId) {
        const isReadOnly = ['termination', 'register', 'authorization', 'verification', 'reapplication'].includes(source.toLowerCase());
        this.loadApplicationById(Number(appId), isReadOnly);
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  async loadApplicationById(appId: number, isReadOnly = false): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.readOnly.set(isReadOnly);
    try {
      const detail = await firstValueFrom(this.indigentService.getApplicationDetail(appId));
      if (detail?.application) {
        const app = detail.application;
        this.existingAppDetail.set(detail);
        this.viewingExisting.set(true);
        this.savedApplication.set({
          applicationId: app.applicationId,
          accountId: app.accountId,
          appStatusId: app.appStatusId,
          appStatusName: app.appStatusName,
          indigentTypeId: app.indigentTypeId,
          indigentTypeName: app.indigentTypeName,
          householdIncome: app.householdIncome,
          applicationDate: app.applicationDate,
          reApplicationDate: app.reApplicationDate,
          doNotCutDate: app.doNotCutDate || '',
          monthlySubsidy: app.monthlySubsidy,
          qualifyingUnits: app.qualifyingUnits,
          onceWriteOff: app.onceWriteOff,
        });
        this.qualifiedSubsidyPercentage.set(app.qualifiedSubsidyPercentage ?? null);
        const accountHolder: AccountResult = {
          accountId: app.accountId,
          accountNo: app.accountNumber || '',
          fullName: app.accountHolderName || app.fullName || '',
          idNo: app.idNumber || '',
          physicalAddress: app.physicalAddress || '',
          postalAddress: app.postalAddress || '',
          cellNo: app.cellNo || '',
          email: app.email || '',
          balance: app.balance || 0,
          sgNumber: '',
          accountStatus: (app as any).accountStatus || '',
          propertyId: (app as any).propertyID || '',
          accountTypeId: (app as any).accountTypeId ?? null,
          allPhones: [],
          allEmails: [],
        };
        this.selectedAccount.set(accountHolder);
        this.selectedIndigentTypeId.set(app.indigentTypeId);
        this.occupiers.set(detail.occupiers || []);
        this.syncHolderFormFromOccupiers();
        this.tenantDetail.set(detail.tenant || null);
        this.householdIncome.set(app.householdIncome);
        this.remarks.set(app.remarks || '');
        if (app.applicationDate) this.applicationDate.set(app.applicationDate);
        if (app.commencementDate) this.commencementDate.set(app.commencementDate);
        if (app.reApplicationDate) this.reApplicationDate.set(app.reApplicationDate);
        if (app.terminationDate) this.terminationDate.set(app.terminationDate);
        if ((app as any).altrContactNo) this.altContactPhone.set((app as any).altrContactNo);
        else if ((app as any).altContactPhone) this.altContactPhone.set((app as any).altContactPhone);
        if ((app as any).altContactEmail) this.altContactEmail.set((app as any).altContactEmail);
        if ((app as any).isTenantApplication) this.isTenantApplication.set(true);

        if (isReadOnly) {
          this.currentView.set('summary'); this.generateApplicationQR();
        } else {
          this.recalcDatesForSenior();
          this.currentView.set(this.determineResumeStep(detail));
        }

        this.enrichAccountFromApi(accountHolder);
      }
    } catch {
      this.error.set('Failed to load application details.');
    } finally {
      this.loading.set(false);
    }
  }

  private async enrichAccountFromApi(account: AccountResult): Promise<void> {
    try {
      const [detailsRes, nameRes, contactRes, balanceRes] = await Promise.allSettled([
        this.indigentService.getAccountDetails(account.accountId),
        firstValueFrom(this.api.get<any>('/api/platinum/billing-enquiry/name-info-by-account', { accountId: String(account.accountId) })),
        firstValueFrom(this.api.get<any>('/api/platinum/billing-account-management/get-contact-details', { accountId: String(account.accountId) })),
        firstValueFrom(this.api.get<any>(`/api/platinum/billing-enquiry/total-balance-debt-inquiry/${account.accountId}`)),
      ]);

      let enrichedName = account.fullName;
      let enrichedIdNo = account.idNo;
      let enrichedAddress = account.physicalAddress;
      let enrichedSgNumber = account.sgNumber;
      let enrichedBalance = account.balance;
      let enrichedCellNo = account.cellNo;
      let enrichedEmail = account.email;

      if (detailsRes.status === 'fulfilled' && detailsRes.value) {
        const d: any = detailsRes.value;
        enrichedName = d.fullNAME || enrichedName;
        enrichedIdNo = d.idRegistrationNumber || enrichedIdNo;
        enrichedAddress = d.fullAddress || enrichedAddress;
        enrichedSgNumber = d.sgNumber || enrichedSgNumber;
        enrichedCellNo = d.contactNo || enrichedCellNo;
        enrichedEmail = d.emailId || enrichedEmail;
      }

      if (nameRes.status === 'fulfilled' && nameRes.value && !(nameRes.value as any)._error) {
        const nr = Array.isArray(nameRes.value) ? nameRes.value[0] : nameRes.value;
        if (nr) {
          const title = (nr.title || '').toString().trim();
          const firstNames = (nr.firstNames || '').toString().trim();
          const surname = (nr.surname_Company || '').toString().trim();
          const initials = firstNames
            ? firstNames.split(/\s+/).map((p: string) => p.charAt(0).toUpperCase()).filter(Boolean).join('')
            : '';
          this.holderTitle.set(title);
          this.holderFirstNames.set(firstNames);
          this.holderSurname.set(surname);
          this.holderInitials.set(initials);
          if (!enrichedName) {
            const built = [firstNames, surname].filter(v => v).join(' ').trim();
            enrichedName = built || nr.fullName || nr.accountHolderName || nr.name || surname || '';
          }
          if (!enrichedIdNo) enrichedIdNo = nr.idNo_RegistrationNo || nr.idRegistrationNumber || nr.idNumber || nr.passportNo || '';
          if (!enrichedAddress) enrichedAddress = nr.physicalAddress || nr.address || '';
          if (!enrichedSgNumber) enrichedSgNumber = nr.sgNumber || nr.sGNumber || '';
          if (!enrichedCellNo) enrichedCellNo = nr.tel_Mobile || nr.cellNo || nr.cellPhone || nr.mobile || nr.tel_Home || '';
          if (!enrichedEmail) enrichedEmail = nr.email || nr.eMail || nr.emailAddress || '';
        }
      }

      if (contactRes.status === 'fulfilled' && contactRes.value && !(contactRes.value as any)._error) {
        const cr = Array.isArray(contactRes.value) ? contactRes.value[0] : contactRes.value;
        if (cr) {
          if (!enrichedCellNo) enrichedCellNo = cr.tel_Mobile || cr.cellphone || cr.cellPhone || cr.mobile || cr.mobileNumber || cr.cellNo || cr.contactNo || '';
          if (!enrichedEmail) enrichedEmail = cr.email || cr.eMail || cr.emailAddress || cr.Email || '';
          if (!enrichedAddress) enrichedAddress = cr.physicalAddress || cr.address || '';
        }
      }

      if (balanceRes.status === 'fulfilled' && balanceRes.value && !(balanceRes.value as any)._error) {
        const bal: any = balanceRes.value;
        if (Array.isArray(bal)) {
          enrichedBalance = bal.reduce((sum: number, b: any) => sum + (b.totalOutStanding || b.current || 0), 0);
        } else if (typeof bal === 'number') {
          enrichedBalance = bal;
        } else if (typeof bal?.balance === 'number') {
          enrichedBalance = bal.balance;
        } else if (typeof bal?.totalBalance === 'number') {
          enrichedBalance = bal.totalBalance;
        } else if (typeof bal?.totalOutStanding === 'number') {
          enrichedBalance = bal.totalOutStanding;
        }
      }

      const current = this.selectedAccount();
      if (current && current.accountId === account.accountId) {
        this.selectedAccount.set({
          ...current,
          fullName: enrichedName || current.fullName,
          idNo: enrichedIdNo || current.idNo,
          physicalAddress: enrichedAddress || current.physicalAddress,
          sgNumber: enrichedSgNumber || current.sgNumber,
          balance: enrichedBalance || current.balance,
          cellNo: enrichedCellNo || current.cellNo,
          email: enrichedEmail || current.email,
        });
        this.prefillHolderForm(this.selectedAccount()!);
      }

      this.enrichAccountContacts(this.selectedAccount()!);
      if (enrichedIdNo && enrichedIdNo !== account.idNo) {
        this.recalcDatesForSenior();
      }
    } catch { }
  }

  async loadLookups(): Promise<void> {
    const [types, employers, incomeSources, occTypes, docTypes] = await Promise.allSettled([
      firstValueFrom(this.indigentService.getIndigentTypes()),
      firstValueFrom(this.indigentService.getEmployers()),
      firstValueFrom(this.indigentService.getIncomeSources()),
      firstValueFrom(this.indigentService.getOccupierTypes()),
      firstValueFrom(this.indigentService.getDocumentTypes()),
    ]);
    if (docTypes.status === 'fulfilled') {
      this.documentTypes.set(docTypes.value || []);
    }
    if (types.status === 'fulfilled') {
      this.indigentTypes.set(types.value || []);
      if (types.value?.length && !this.selectedIndigentTypeId()) {
        this.selectedIndigentTypeId.set(types.value[0].indigentTypeId);
      }
    }
    if (employers.status === 'fulfilled') this.employers.set(employers.value || []);
    if (incomeSources.status === 'fulfilled') this.incomeSources.set(incomeSources.value || []);
    if (occTypes.status === 'fulfilled' && Array.isArray(occTypes.value) && occTypes.value.length > 0) {
      this.occupierTypeConfigs.set(occTypes.value);
      this.occupierTypeOptions = occTypes.value.filter(t => t.isActive).map(t => ({ id: t.occupierTypeId, name: t.name }));
      this.occupierTypesLoadFailed.set(false);
    } else {
      this.occupierTypeOptions = [];
      this.occupierTypeConfigs.set([]);
      this.occupierTypesLoadFailed.set(true);
      console.error('[occupier-types] Failed to load occupier types from Platinum API — no fallback');
    }
  }

  onInputChange(val: string): void {
    this.searchQuery.set(val);
    if (this.debounceTimer) { clearTimeout(this.debounceTimer); this.debounceTimer = null; }
    if (this.searchPerformed()) {
      this.searchPerformed.set(false);
      this.searchResults.set([]);
    }
    if (val.trim().length < 2) {
      this.autocompleteResults.set([]);
      this.showDropdown.set(false);
      return;
    }
    this.debounceTimer = setTimeout(() => this.runAutocomplete(val.trim()), 300);
  }

  async runAutocomplete(q: string): Promise<void> {
    this.acLoading.set(true);
    try {
      const items = await this.indigentService.getAccountAutocomplete(q);
      this.autocompleteResults.set(items);
      this.showDropdown.set(items.length > 0);
    } catch {
      this.autocompleteResults.set([]);
      this.showDropdown.set(false);
    } finally {
      this.acLoading.set(false);
    }
  }

  async selectFromDropdown(item: {accountId: number, displayItem: string, accountName: string, address: string, balance: number | null, status: string}): Promise<void> {
    this.showDropdown.set(false);
    this.autocompleteResults.set([]);
    this.searchQuery.set(item.displayItem);
    this.searchLoading.set(true);
    try {
      const [d, balanceData] = await Promise.all([
        this.indigentService.getAccountDetails(item.accountId),
        firstValueFrom(this.indigentService.getAccountBalance(item.accountId)).catch(() => []),
      ]);
      const totalBalance = Array.isArray(balanceData) ? balanceData.reduce((sum: number, b: any) => sum + (b.totalOutStanding || 0), 0) : 0;
      const result: AccountResult = {
        accountId: d.account_ID || item.accountId,
        accountNo: d.accountNumber || item.displayItem,
        fullName: d.fullNAME || item.accountName || '',
        idNo: d.idRegistrationNumber || '',
        physicalAddress: d.fullAddress || '',
        postalAddress: d.deliveryAddress || '',
        cellNo: d.contactNo || '',
        email: d.emailId || '',
        balance: totalBalance,
        sgNumber: d.sgNumber || '',
        accountStatus: d.accountStatus || '',
        propertyId: d.propertyID || '',
        accountTypeId: d.accountTypeId ?? d.accountTypeID ?? d.accountType_ID ?? null,
        allPhones: [],
        allEmails: [],
      };
      await this.selectAccount(result);
    } catch {
      this.error.set('Could not load account details. Try searching again.');
    } finally {
      this.searchLoading.set(false);
    }
  }

  closeDropdown(): void {
    setTimeout(() => this.showDropdown.set(false), 200);
  }

  async onSearch(): Promise<void> {
    const q = this.searchQuery().trim();
    if (q.length < 2) return;

    if (this.debounceTimer) { clearTimeout(this.debounceTimer); this.debounceTimer = null; }
    this.showDropdown.set(false);
    this.autocompleteResults.set([]);
    this.searchLoading.set(true);
    this.searchPerformed.set(true);
    this.error.set(null);

    try {
      const results = await this.indigentService.searchAccounts(q);
      const mapped: AccountResult[] = (results || []).map((r: any) => ({
        accountId: r.account_ID || r.accountID || 0,
        accountNo: r.accountNumber || '',
        fullName: ((r.name || '') + ' ' + (r.surname_Company || '')).trim() || r.fullNAME || '',
        idNo: r.idRegistrationNumber || '',
        physicalAddress: r.locationAddress || r.fullAddress || '',
        postalAddress: r.deliveryAddress || '',
        cellNo: r.cellNumber || r.cellNo || r.contactNo || '',
        email: r.emailAddress || r.email || r.emailId || '',
        balance: r.outStandingAmt || r.outStandingAmount || 0,
        sgNumber: r.sgNumber || '',
        accountStatus: r.accountStatus || r.statusDesc || '',
        propertyId: r.propertyID || '',
        accountTypeId: r.accountTypeId ?? r.accountTypeID ?? r.accountType_ID ?? null,
        allPhones: [],
        allEmails: [],
      }));
      this.searchResults.set(mapped);

      // Auto-load full detail when there is exactly one match OR when the
      // query is an exact account-number match — same flow as dropdown select
      // so contact info, balance and existing-application warnings populate.
      const exactMatch = mapped.find(m => m.accountNo === q);
      const auto = mapped.length === 1 ? mapped[0] : exactMatch;
      if (auto && auto.accountId) {
        await this.loadFullAccount(auto);
      }
    } catch {
      this.error.set('Search failed. Please try again.');
      this.searchResults.set([]);
    } finally {
      this.searchLoading.set(false);
    }
  }

  async selectFromSearchResult(account: AccountResult): Promise<void> {
    if (!account?.accountId) { await this.selectAccount(account); return; }
    this.searchLoading.set(true);
    try {
      await this.loadFullAccount(account);
    } finally {
      this.searchLoading.set(false);
    }
  }

  private async loadFullAccount(base: AccountResult): Promise<void> {
    try {
      const [d, balanceData] = await Promise.all([
        this.indigentService.getAccountDetails(base.accountId),
        firstValueFrom(this.indigentService.getAccountBalance(base.accountId)).catch(() => []),
      ]);
      const totalBalance = Array.isArray(balanceData)
        ? balanceData.reduce((sum: number, b: any) => sum + (b.totalOutStanding || 0), 0)
        : 0;
      const enriched: AccountResult = {
        accountId: d.account_ID || base.accountId,
        accountNo: d.accountNumber || base.accountNo,
        fullName: d.fullNAME || base.fullName || '',
        idNo: d.idRegistrationNumber || base.idNo || '',
        physicalAddress: d.fullAddress || base.physicalAddress || '',
        postalAddress: d.deliveryAddress || base.postalAddress || '',
        cellNo: d.contactNo || base.cellNo || '',
        email: d.emailId || base.email || '',
        balance: totalBalance,
        sgNumber: d.sgNumber || base.sgNumber || '',
        accountStatus: d.accountStatus || base.accountStatus || '',
        propertyId: d.propertyID || base.propertyId || '',
        accountTypeId: d.accountTypeId ?? d.accountTypeID ?? d.accountType_ID ?? base.accountTypeId ?? null,
        allPhones: [],
        allEmails: [],
      };
      await this.selectAccount(enriched);
    } catch {
      this.error.set('Could not load account details. Try searching again.');
    }
  }

  formatDobDisplay(iso: string | null | undefined): string {
    if (!iso) return '';
    const s = String(iso).split('T')[0];
    const parts = s.split('-');
    if (parts.length !== 3) return s;
    return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
  }

  private extractFromSAID(idNo: string | null | undefined): { dateOfBirth: string; gender: string } {
    const id = (idNo || '').replace(/\D/g, '');
    if (id.length !== 13) return { dateOfBirth: '', gender: '' };
    const yy = parseInt(id.slice(0, 2), 10);
    const mm = id.slice(2, 4);
    const dd = id.slice(4, 6);
    const seq = parseInt(id.slice(6, 10), 10);
    const currentYY = new Date().getFullYear() % 100;
    const fullYear = yy <= currentYY ? 2000 + yy : 1900 + yy;
    const dateOfBirth = `${fullYear}-${mm}-${dd}`;
    const gender = seq < 5000 ? 'Female' : 'Male';
    return { dateOfBirth, gender };
  }

  private prefillHolderForm(account: AccountResult): void {
    const { dateOfBirth, gender } = this.extractFromSAID(account.idNo);
    const holderType = this.occupierTypeOptions.find(t => /holder|self|primary|applicant/i.test(t.name))
      || this.occupierTypeOptions[0];
    const defaultIncomeSource = this.incomeSources().find(s => s.excludeFromValidation)
      || this.incomeSources()[0];
    const cur = this.holderForm();
    this.holderForm.set({
      dateOfBirth: cur.dateOfBirth || dateOfBirth,
      gender: cur.gender || gender,
      occupierTypeId: holderType?.id ?? 0,
      relationship: 'Account Holder',
      contactNumber: cur.contactNumber || account.cellNo || '',
      employerId: cur.employerId || 0,
      incomeSourceId: cur.incomeSourceId || (defaultIncomeSource?.incomeSourceId ?? 0),
      incomeAmount: cur.incomeAmount || 0,
    });
  }

  async selectAccount(account: AccountResult, autoProceed = false): Promise<void> {
    this.selectedAccount.set(account);
    this.prefillHolderForm(account);
    this.error.set(null);
    this.successMessage.set(null);
    this.qualificationCheck.set(null);
    this.smartCheckResults.set([]);
    this.qualifiedSubsidyPercentage.set(null);
    this.smartCheckDone.set(false);
    this.smartQualData.set(null);
    this.manualOverrides.set({});
    this.savedApplication.set(null);
    this.existingApplications.set([]);
    this.existingAppDetail.set(null);
    this.viewingExisting.set(false);
    this.occupiers.set([]);
    this.tenantDetail.set(null);
    this.householdIncome.set(0);
    this.remarks.set('');
    this.altContactPhone.set('');
    this.altContactEmail.set('');
    this.isTenantApplication.set(false);
    this.applicationDate.set(this.todayIso());
    this.uploadedDocs.set({});
    this.requiredDocUploads.set({});
    this.accountExistingApps.set([]);
    this.recalcDatesForSenior();
    if (autoProceed) {
      this.currentView.set('qualification');
    }
    this.enrichAccountContacts(account);
    this.checkForExistingApplications(account);
  }

  private async checkForExistingApplications(account: AccountResult): Promise<void> {
    this.checkingExistingApps.set(true);
    try {
      const params: Record<string, string> = { accountId: String(account.accountId) };
      if (account.accountNo) params['accountNumber'] = account.accountNo;
      const history = await firstValueFrom(
        this.api.get<any[]>('/api/platinum/billing-enquiry/attp-application-history', params)
      );
      if (Array.isArray(history) && history.length > 0) {
        const activeStatuses = ['active', 'application', 'pending', 'awaiting verification', 'awaiting authorization', 're-application', 'submitted', 'verified'];
        const activeApps = history.filter((a: any) => {
          const status = (a.attpStatus || a.status || '').toLowerCase();
          return activeStatuses.some(s => status.includes(s));
        }).map((a: any) => ({
          applicationId: a.applicationId || a.applicationNumber || a.id,
          attpStatus: a.attpStatus || a.status || '',
          applicationDate: a.applicationDate || '',
          reApplicationDate: a.reApplicationDate || '',
        }));
        this.accountExistingApps.set(activeApps);
      } else {
        this.accountExistingApps.set([]);
      }
    } catch {
      this.accountExistingApps.set([]);
    } finally {
      this.checkingExistingApps.set(false);
    }
  }

  private async enrichAccountContacts(account: AccountResult): Promise<void> {
    try {
      const acctId = String(account.accountId);
      const [contactRes, nameRes, addEmailRes, propertyRes] = await Promise.all([
        firstValueFrom(this.api.get<any>('/api/platinum/billing-account-management/get-contact-details', { accountId: acctId })).catch(() => null),
        firstValueFrom(this.api.get<any>('/api/platinum/billing-enquiry/name-info-by-account', { accountId: acctId })).catch(() => null),
        firstValueFrom(this.api.get<any>('/api/platinum/billing-account-management/get-additional-emails', { accountId: acctId })).catch(() => null),
        firstValueFrom(this.api.get<any>('/api/platinum/billing-enquiry/property-details-by-account', { accountId: acctId })).catch(() => null),
      ]);

      const emailSet = new Set<string>();
      const phoneSet = new Set<string>();
      const emailFields = ['email', 'eMail', 'emailAddress', 'Email', 'emailId', 'emailID'];
      const phoneFields = ['tel_Mobile', 'tel_Home', 'tel_Work', 'cellphone', 'cellPhone', 'mobile', 'mobileNumber', 'CellPhone', 'telephone', 'workPhone', 'homePhone', 'phone', 'Phone', 'telNo', 'contactNo', 'cellNo', 'cellNumber', 'landlineNumber', 'contactNumber'];

      const extractFromRecord = (rec: any) => {
        if (!rec || typeof rec !== 'object') return;
        for (const f of emailFields) {
          const v = rec[f];
          if (typeof v === 'string' && v.includes('@') && v.length > 3) emailSet.add(v.trim().toLowerCase());
        }
        for (const f of phoneFields) {
          const v = rec[f];
          if (typeof v === 'string' && v.replace(/[\s\-()]/g, '').length >= 7) phoneSet.add(v.trim());
        }
      };

      const unwrap = (res: any): any[] => {
        if (!res || res._error) return [];
        if (Array.isArray(res)) return res;
        if (Array.isArray(res?.value)) return res.value;
        if (typeof res === 'object') return [res];
        return [];
      };

      unwrap(contactRes).forEach(extractFromRecord);
      unwrap(nameRes).forEach(extractFromRecord);

      if (addEmailRes && !(addEmailRes as any)._error) {
        const emailList = Array.isArray(addEmailRes) ? addEmailRes : ((addEmailRes as any)?.value || (addEmailRes as any)?.emails || []);
        for (const e of emailList) {
          const addr = e?.emailAdress || e?.emailAddress || e?.email || e?.Email || (typeof e === 'string' ? e : '');
          if (typeof addr === 'string' && addr.includes('@') && addr.length > 3) emailSet.add(addr.trim().toLowerCase());
        }
      }

      if (account.email && account.email.includes('@')) emailSet.add(account.email.trim().toLowerCase());
      if (account.cellNo && account.cellNo.replace(/[\s\-()]/g, '').length >= 7) phoneSet.add(account.cellNo.trim());

      let sgNumber = account.sgNumber || '';
      if (!sgNumber && propertyRes && !(propertyRes as any)._error) {
        const propData = Array.isArray(propertyRes) ? propertyRes[0] : propertyRes;
        if (propData) {
          sgNumber = propData.sgNumber || propData.sg_Number || propData.SG_Number || propData.sgNo || propData.sG_Number || '';
          if (!sgNumber) {
            for (const key of Object.keys(propData)) {
              if (key.toLowerCase().includes('sg') && typeof propData[key] === 'string' && propData[key].includes('/')) {
                sgNumber = propData[key];
                break;
              }
            }
          }
        }
      }

      const current = this.selectedAccount();
      if (current && current.accountId === account.accountId) {
        const phoneArr = Array.from(phoneSet);
        const emailArr = Array.from(emailSet);
        this.selectedAccount.set({
          ...current,
          allPhones: phoneArr,
          allEmails: emailArr,
          sgNumber: sgNumber || current.sgNumber || '',
          cellNo: current.cellNo || phoneArr[0] || '',
          email: current.email || emailArr[0] || '',
        });
        this.prefillHolderForm(this.selectedAccount()!);
      }
    } catch { }
  }

  proceedWithSelectedAccount(): void {
    if (!this.selectedAccount()) return;
    if (this.accountExistingApps().length > 0) {
      alert('This account already has an active application. Only one application per account is allowed.');
      return;
    }
    this.currentView.set('qualification');
  }

  onIndigentTypeChange(typeId: number): void {
    this.selectedIndigentTypeId.set(typeId);
    this.smartCheckDone.set(false);
    this.smartCheckResults.set([]);
    this.qualifiedSubsidyPercentage.set(null);
    this.smartQualData.set(null);
    this.manualOverrides.set({});
    this.qualificationCheck.set(null);
    this.recalcDatesForType();
    this.recalcDatesForSenior();
  }

  recalcDatesForType(): void {
    const typeId = this.selectedIndigentTypeId();
    if (!typeId) return;
    const typeConfig = this.indigentTypes().find(t => t.indigentTypeId === typeId) as any;
    if (!typeConfig) return;
    const period = typeConfig.reApplicationPeriod || 12;
    if (typeConfig.reapplicationBaseDate === 'application') {
      const appDate = new Date(this.applicationDate() || this.todayIso());
      appDate.setMonth(appDate.getMonth() + period);
      const dateStr = appDate.toISOString().split('T')[0] + 'T00:00:00';
      this.reApplicationDate.set(dateStr);
      this.terminationDate.set(dateStr);
    } else {
      this.reApplicationDate.set(this.defaultReApplicationDate());
      this.terminationDate.set(this.defaultTerminationDate());
    }
  }

  uploadedDocs = signal<Record<string, { name: string; sizeLabel: string; uploaded: boolean; uploading: boolean; error: string; fileData?: string; testName?: string }[]>>({});
  requiredDocUploads = signal<Record<string, { name: string; sizeLabel: string; uploaded: boolean; uploading: boolean; error: string; fileData?: string; docLabel?: string; documentTypeId?: number }[]>>({});
  savedDocuments = signal<any[]>([]);
  documentTypes = signal<{ documentTypeId: number; documentTypeName: string }[]>([]);
  capturedIncome = signal<number>(0);
  capturedIncomeSourceId = signal<number>(0);

  toggleManualOverride(testId: string, value: boolean): void {
    const overrides = { ...this.manualOverrides() };
    overrides[testId] = value;
    this.manualOverrides.set(overrides);
  }

  onIncomeCaptured(value: number): void {
    this.capturedIncome.set(value);
    this.householdIncome.set(value);
  }

  getIncomeLimit(): number {
    const typeId = this.selectedIndigentTypeId();
    const selectedType = this.indigentTypes().find(t => t.indigentTypeId === typeId) as any;
    return selectedType?.incomeLimit || 0;
  }

  async onDocumentUpload(event: Event, testId: string, testName: string): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    const sizeLabel = file.size < 1024 ? `${file.size} B` : file.size < 1048576 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / 1048576).toFixed(1)} MB`;

    try {
      const fileData = await this.fileToBase64(file);
      const docEntry = { name: file.name, sizeLabel, uploaded: true, uploading: false, error: '', fileData, testName };
      const docs = { ...this.uploadedDocs() };
      if (!docs[testId]) docs[testId] = [];
      docs[testId] = [...docs[testId], docEntry];
      this.uploadedDocs.set(docs);
      this.toggleManualOverride(testId, true);
      console.log(`Document "${file.name}" staged locally — will upload after application save`);
    } catch {
      const docEntry = { name: file.name, sizeLabel, uploaded: false, uploading: false, error: 'Failed to read file' };
      const docs = { ...this.uploadedDocs() };
      if (!docs[testId]) docs[testId] = [];
      docs[testId] = [...docs[testId], docEntry];
      this.uploadedDocs.set(docs);
    }

    input.value = '';
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  getRequiredDocumentsForType(): RequiredDocumentConfig[] {
    const typeId = this.selectedIndigentTypeId();
    if (!typeId) return [];
    const selectedType = this.indigentTypes().find(t => t.indigentTypeId === typeId);
    if (!selectedType || !selectedType.requiredDocuments) return [];
    return selectedType.requiredDocuments;
  }

  getDocVerificationEnabled(): boolean {
    const typeId = this.selectedIndigentTypeId();
    if (!typeId) return false;
    const selectedType = this.indigentTypes().find(t => t.indigentTypeId === typeId);
    return !!(selectedType as any)?.enableDocumentVerification;
  }

  getSiteVerificationEnabled(): boolean {
    const typeId = this.selectedIndigentTypeId();
    if (!typeId) return false;
    const selectedType = this.indigentTypes().find(t => t.indigentTypeId === typeId);
    return !!(selectedType as any)?.enableSiteVerification;
  }

  getNextWorkflowStep(): { label: string; icon: string } {
    if (this.getSiteVerificationEnabled()) {
      return { label: 'Submit for Site Verification', icon: 'home_work' };
    }
    if (this.getDocVerificationEnabled()) {
      return { label: 'Submit for Document Verification', icon: 'verified_user' };
    }
    return { label: 'Submit for Authorization', icon: 'task_alt' };
  }

  isDocTypeMapped(docConfig: RequiredDocumentConfig): boolean {
    if (docConfig.documentTypeId && docConfig.documentTypeId > 0) return true;
    return this.resolveDocTypeId(docConfig.documentKey, docConfig.documentLabel) != null;
  }

  async onRequiredDocUpload(event: Event, docConfig: RequiredDocumentConfig): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    const sizeLabel = file.size < 1024 ? `${file.size} B` : file.size < 1048576 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / 1048576).toFixed(1)} MB`;

    try {
      const fileData = await this.fileToBase64(file);
      const docEntry = { name: file.name, sizeLabel, uploaded: true, uploading: false, error: '', fileData, docLabel: docConfig.documentLabel, documentTypeId: docConfig.documentTypeId };
      const docs = { ...this.requiredDocUploads() };
      if (!docs[docConfig.documentKey]) docs[docConfig.documentKey] = [];
      docs[docConfig.documentKey] = [...docs[docConfig.documentKey], docEntry];
      this.requiredDocUploads.set(docs);

      const existingAppId = this.savedApplication()?.applicationId;
      if (existingAppId) {
        await this.uploadOneRequiredDoc(existingAppId, docConfig, docEntry);
      } else {
        console.log(`Required doc "${file.name}" staged locally — will upload after application save`);
      }
    } catch {
      const docEntry = { name: file.name, sizeLabel, uploaded: false, uploading: false, error: 'Failed to read file' };
      const docs = { ...this.requiredDocUploads() };
      if (!docs[docConfig.documentKey]) docs[docConfig.documentKey] = [];
      docs[docConfig.documentKey] = [...docs[docConfig.documentKey], docEntry];
      this.requiredDocUploads.set(docs);
    }

    input.value = '';
  }

  removeRequiredDoc(docKey: string, fileName: string): void {
    const docs = { ...this.requiredDocUploads() };
    if (docs[docKey]) {
      docs[docKey] = docs[docKey].filter(d => d.name !== fileName);
      if (docs[docKey].length === 0) delete docs[docKey];
    }
    this.requiredDocUploads.set(docs);
  }

  getRequiredDocUploadCount(docKey: string): number {
    const uploads = this.requiredDocUploads();
    return (uploads[docKey] || []).filter(u => u.uploaded).length;
  }

  async loadSavedDocsForCurrentApp(): Promise<void> {
    const appId = this.savedApplication()?.applicationId;
    if (!appId) { this.savedDocuments.set([]); return; }
    try {
      if (this.documentTypes().length === 0) {
        const types = await firstValueFrom(this.indigentService.getDocumentTypes());
        this.documentTypes.set(types || []);
      }
      const docs = await firstValueFrom(this.indigentService.getDocuments(appId));
      this.savedDocuments.set(Array.isArray(docs) ? docs : []);
    } catch (err: any) {
      const msg = err?.error?.message || err?.message || 'Failed to load saved documents';
      this.toast.show(msg, 'error');
    }
  }

  getSavedDocsFor(docConfig: { documentKey: string; documentLabel: string }): any[] {
    if (!this.savedDocuments().length) return [];
    const wantedTypeId = this.resolveDocTypeId(docConfig.documentKey, docConfig.documentLabel);
    if (!wantedTypeId) return [];
    return this.savedDocuments().filter((d: any) => d.documentTypeId === wantedTypeId);
  }

  private readonly ALLOWED_VIEW_MIMES = new Set([
    'application/pdf', 'image/jpeg', 'image/png', 'image/gif',
  ]);

  private inferMimeFromName(name: string): string {
    const ext = (name.split('.').pop() || '').toLowerCase();
    return ext === 'pdf' ? 'application/pdf'
      : (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg'
      : ext === 'png' ? 'image/png'
      : ext === 'gif' ? 'image/gif'
      : 'application/octet-stream';
  }

  private base64ToBlob(b64: string, mime: string): Blob {
    const cleaned = b64.includes(',') ? b64.split(',').pop() || '' : b64;
    const bin = atob(cleaned);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  private openBlobInNewTab(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    if (!w) {
      URL.revokeObjectURL(url);
      this.toast.show('Popup blocked. Allow popups to view documents.', 'error');
      return;
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  viewStagedDoc(file: { fileData?: string; name: string }): void {
    if (!file.fileData) return;
    const mime = this.inferMimeFromName(file.name);
    if (!this.ALLOWED_VIEW_MIMES.has(mime)) {
      this.toast.show('In-browser preview not supported for this file type. Use Download.', 'error');
      return;
    }
    try { this.openBlobInNewTab(this.base64ToBlob(file.fileData, mime)); }
    catch { this.toast.show('Failed to open document', 'error'); }
  }

  downloadStagedDoc(file: { fileData?: string; name: string }): void {
    if (!file.fileData) return;
    const mime = this.inferMimeFromName(file.name);
    try { this.downloadBlob(this.base64ToBlob(file.fileData, mime), file.name); }
    catch { this.toast.show('Failed to download document', 'error'); }
  }

  async viewSavedDoc(documentId: number): Promise<void> {
    try {
      const r = await firstValueFrom(this.indigentService.downloadDocument(documentId));
      const mime = (r.contentType && this.ALLOWED_VIEW_MIMES.has(r.contentType))
        ? r.contentType
        : this.inferMimeFromName(r.fileName || '');
      if (!this.ALLOWED_VIEW_MIMES.has(mime)) {
        this.toast.show('In-browser preview not supported for this file type. Use Download.', 'error');
        return;
      }
      this.openBlobInNewTab(this.base64ToBlob(r.fileData, mime));
    } catch { this.toast.show('Failed to load document', 'error'); }
  }

  async downloadSavedDoc(documentId: number): Promise<void> {
    try {
      const r = await firstValueFrom(this.indigentService.downloadDocument(documentId));
      const mime = r.contentType || this.inferMimeFromName(r.fileName || '') || 'application/octet-stream';
      this.downloadBlob(this.base64ToBlob(r.fileData, mime), r.fileName || `document-${documentId}`);
    } catch { this.toast.show('Failed to download document', 'error'); }
  }

  proceedToFormFromDocs(): void {
    if (this.allRequiredDocsUploaded()) {
      this.currentView.set('form');
    }
  }

  getEnabledTests(): PolicyValidationTest[] {
    const typeId = this.selectedIndigentTypeId();
    const selectedType = this.indigentTypes().find(t => t.indigentTypeId === typeId) as any;

    const mergeTests = (saved: PolicyValidationTest[] | undefined, defaults: PolicyValidationTest[]): PolicyValidationTest[] => {
      const savedMap = new Map((saved || []).map(t => [t.testId, t]));
      return defaults.map(d => {
        const s = savedMap.get(d.testId);
        return s ? { ...d, enabled: s.enabled, configValue: s.configValue ?? d.configValue, severity: s.severity ?? d.severity, validationMode: s.validationMode ?? d.validationMode } : { ...d };
      });
    };

    const hasSavedStdTests = !!(selectedType?.standardQualificationTests?.length);
    const hasSavedMunTests = !!(selectedType?.municipalPolicyTests?.length);

    let standardTests = mergeTests(selectedType?.standardQualificationTests, STANDARD_QUALIFICATION_TESTS);
    let municipalTests = mergeTests(selectedType?.municipalPolicyTests, MUNICIPAL_POLICY_TESTS);

    if (selectedType) {
      const applyNumericOverride = (tests: PolicyValidationTest[], testId: string, legacyValue: number | undefined, hasSaved: boolean) => {
        const test = tests.find(t => t.testId === testId);
        if (!test) return;
        if (hasSaved) return;
        if (legacyValue !== undefined && legacyValue > 0 && (!test.configValue || test.configValue === 0)) {
          test.configValue = legacyValue;
        }
      };

      const applyLegacyEnabledFlag = (tests: PolicyValidationTest[], testId: string, enabledFlag: boolean, hasSavedTests: boolean) => {
        if (hasSavedTests) return;
        const test = tests.find(t => t.testId === testId);
        if (test) test.enabled = enabledFlag;
      };

      applyNumericOverride(standardTests, 'property_value', selectedType.marketValueQualification, hasSavedStdTests);
      applyNumericOverride(standardTests, 'income_limit', selectedType.incomeLimit, hasSavedStdTests);
      applyNumericOverride(standardTests, 'dependants', selectedType.minDependants, hasSavedStdTests);

      applyLegacyEnabledFlag(standardTests, 'multiple_properties', !!selectedType.isMultipleProperty, hasSavedStdTests);
      applyLegacyEnabledFlag(standardTests, 'pensioner_status', !!selectedType.isPensioner, hasSavedStdTests);
      applyLegacyEnabledFlag(standardTests, 'citizenship', !!selectedType.requireSaCitizenship, hasSavedStdTests);
      if (!hasSavedStdTests && selectedType.minDependants > 0) {
        const depTest = standardTests.find(t => t.testId === 'dependants');
        if (depTest) depTest.enabled = true;
      }

      applyNumericOverride(municipalTests, 'vehicle_value', selectedType.vehicleValueLimit, hasSavedMunTests);
      applyNumericOverride(municipalTests, 'property_size', selectedType.propertySizeLimit, hasSavedMunTests);
      applyNumericOverride(municipalTests, 'arrears_tolerance', selectedType.arrearsToleranceAmount, hasSavedMunTests);

      applyLegacyEnabledFlag(municipalTests, 'staff_member', !!selectedType.isStaffMember, hasSavedMunTests);
      applyLegacyEnabledFlag(municipalTests, 'govt_employee', !!selectedType.isGovernmentEmployee, hasSavedMunTests);
      applyLegacyEnabledFlag(municipalTests, 'company_director', !!selectedType.isCompanyDirector, hasSavedMunTests);
      applyLegacyEnabledFlag(municipalTests, 'municipal_supplier', !!selectedType.isSupplierToMunicipality, hasSavedMunTests);
      applyLegacyEnabledFlag(municipalTests, 'business_property', !!selectedType.isBusinessProperty, hasSavedMunTests);
      applyLegacyEnabledFlag(municipalTests, 'deceased_estate', !!selectedType.isDeceasedEstate, hasSavedMunTests);
      applyLegacyEnabledFlag(municipalTests, 'dha_verification', !!selectedType.requireDhaVerification, hasSavedMunTests);
      applyLegacyEnabledFlag(municipalTests, 'credit_bureau', !!selectedType.requireCreditBureauCheck, hasSavedMunTests);
      applyLegacyEnabledFlag(municipalTests, 'sars_income', !!selectedType.requireSarsIncomeCheck, hasSavedMunTests);
      applyLegacyEnabledFlag(municipalTests, 'biometric', !!selectedType.requireBiometricVerification, hasSavedMunTests);
      applyLegacyEnabledFlag(municipalTests, 'child_headed_auto', !!selectedType.autoQualifyChildHeaded, hasSavedMunTests);
      applyLegacyEnabledFlag(municipalTests, 'no_infrastructure_auto', !!selectedType.autoQualifyNoInfrastructure, hasSavedMunTests);
    }

    return [...standardTests, ...municipalTests].filter(t => t.enabled);
  }

  private runAutoCheck(test: PolicyValidationTest, data: SmartQualificationData, configType: IndigentType | null): SmartCheckResult {
    const base: SmartCheckResult = {
      testId: test.testId,
      testName: test.testName,
      description: test.description,
      passed: null,
      detail: '',
      method: test.validationMode === 'api' ? 'auto' : test.validationMode === 'both' ? 'both' : 'manual',
      dataSource: '',
      severity: test.severity,
    };

    const wasBoth = base.method === 'both';

    const isBureau = ['credit_bureau', 'dha_verification', 'sars_income', 'biometric'].includes(test.testId);
    if (isBureau) {
      base.method = 'bureau';
      base.detail = 'Verified externally by bureau service';
      base.dataSource = 'External Bureau (MBA/XDS)';
      return base;
    }

    const configLimit = test.configValue || 0;
    const typeLimit = configType ? this.getTypeLimitForTest(test.testId, configType) : configLimit;
    const limit = typeLimit || configLimit;

    switch (test.testId) {
      case 'property_value': {
        const mv = data.property?.marketValue;
        if (mv !== null && mv !== undefined && limit > 0) {
          base.method = 'auto';
          base.passed = mv <= limit;
          base.detail = base.passed
            ? `Market value R${mv.toLocaleString()} is within the R${limit.toLocaleString()} limit`
            : `Market value R${mv.toLocaleString()} exceeds the R${limit.toLocaleString()} limit`;
          base.dataSource = 'Property register (Platinum)';
        } else if (mv !== null && mv !== undefined) {
          base.method = 'auto';
          base.passed = true;
          base.detail = `Market value R${mv.toLocaleString()} (no limit configured)`;
          base.dataSource = 'Property register (Platinum)';
        } else {
          base.method = 'manual';
          base.detail = 'Property data unavailable — verify manually';
          base.dataSource = 'Manual verification required';
        }
        break;
      }
      case 'property_size': {
        const size = data.property?.standSize;
        if (size !== null && size !== undefined && limit > 0) {
          base.method = 'auto';
          base.passed = size <= limit;
          base.detail = base.passed
            ? `Stand size ${size.toLocaleString()}m² is within the ${limit.toLocaleString()}m² limit`
            : `Stand size ${size.toLocaleString()}m² exceeds the ${limit.toLocaleString()}m² limit`;
          base.dataSource = 'Property register (Platinum)';
        } else if (size !== null && size !== undefined) {
          base.method = 'auto';
          base.passed = true;
          base.detail = `Stand size ${size.toLocaleString()}m² (no limit configured)`;
          base.dataSource = 'Property register (Platinum)';
        } else {
          base.method = 'manual';
          base.detail = 'Property size data unavailable — verify manually';
          base.dataSource = 'Manual verification required';
        }
        break;
      }
      case 'age_requirement': {
        const age = data.nameInfo?.age;
        const minAge = configType?.minAge ?? 18;
        const maxAge = configType?.maxAge ?? 120;
        if (age !== null && age !== undefined) {
          base.method = 'auto';
          base.passed = age >= minAge && age <= maxAge;
          base.detail = base.passed
            ? `Age ${age} is within the ${minAge}–${maxAge} range`
            : `Age ${age} is outside the ${minAge}–${maxAge} range`;
          base.dataSource = 'ID number (Platinum name register)';
        } else {
          base.method = 'manual';
          base.detail = 'Age could not be determined — verify ID document manually';
          base.dataSource = 'Manual verification required';
        }
        break;
      }
      case 'multiple_properties': {
        const count = data.linkedAccountCount;
        base.method = 'auto';
        if (count > 1) {
          base.passed = false;
          base.detail = `Applicant is linked to ${count} qualifying accounts (type 1/3, active) — multiple property ownership detected`;
        } else if (count === 1) {
          base.passed = true;
          base.detail = 'Applicant is linked to 1 qualifying account only — no multiple ownership';
        } else {
          base.passed = true;
          base.detail = 'No qualifying linked accounts found';
        }
        base.dataSource = 'Account register (Platinum)';
        break;
      }
      case 'existing_application': {
        base.method = 'auto';
        if (data.hasActiveApplication) {
          base.passed = false;
          const apps = data.activeApplications.map(a => `#${a.applicationId} (${a.status})`).join(', ');
          base.detail = `Active/pending applications found: ${apps}. Only one application allowed until terminated.`;
        } else {
          base.passed = true;
          base.detail = 'No active or pending applications found on this account';
        }
        base.dataSource = 'Application history (Platinum)';
        break;
      }
      case 'business_property': {
        const use = data.property?.typeOfUse;
        const asBusiness = data.property?.usedAsBusiness;
        if (use) {
          base.method = 'auto';
          const isResidential = use.toUpperCase().startsWith('RES');
          base.passed = isResidential && asBusiness !== 'Yes';
          base.detail = base.passed
            ? `Property type: ${use} — residential use confirmed`
            : `Property type: ${use} — commercial/business use detected`;
          base.dataSource = 'Property register (Platinum)';
        } else {
          base.method = 'manual';
          base.detail = 'Property use type unavailable — verify manually';
          base.dataSource = 'Manual verification required';
        }
        break;
      }
      case 'citizenship': {
        const country = data.nameInfo?.citizenship;
        const allowRefugee = configType?.allowRefugeeStatus === true;
        if (country) {
          base.method = 'auto';
          const isSA = country.toLowerCase().includes('south africa');
          base.passed = isSA;
          if (isSA) {
            base.detail = `Citizenship: ${country} — SA citizen confirmed`;
          } else if (allowRefugee) {
            base.passed = null;
            base.method = 'manual';
            base.detail = `Citizenship: ${country} — not SA citizen, but refugee status is accepted. Verify refugee documentation.`;
          } else {
            base.detail = `Citizenship: ${country} — not a South African citizen. Supporting documents required.`;
            base.method = 'manual';
          }
          base.dataSource = 'Name register (Platinum)';
        } else {
          base.method = 'manual';
          base.detail = 'Citizenship data unavailable — verify ID document manually';
          base.dataSource = 'Manual verification required';
        }
        break;
      }
      case 'income_limit': {
        const validatableIncome = this.getValidatableIncome();
        const totalIncome = this.getTotalOccupierIncome();
        const captured = this.capturedIncome();
        const hasOccupierData = this.occupiers().length > 0;
        const incomeToCheck = hasOccupierData ? validatableIncome : captured;
        const excluded = this.getExcludedIncomeSourceNames();
        const dwellingExcluded = this.getDwellingExcludedOccupiers();

        const slidingEnabled = configType?.enableIncomeSlidingScale && Array.isArray(configType?.incomeSlidingScale) && configType.incomeSlidingScale.length > 0;
        const brackets = slidingEnabled ? [...configType!.incomeSlidingScale].sort((a, b) => a.maxIncome - b.maxIncome) : [];

        let detail = limit > 0
          ? `Household income must not exceed R${limit.toLocaleString()}.`
          : 'Verify household income with supporting documents.';

        if (slidingEnabled) {
          detail = `Income sliding scale active. Brackets: ${brackets.map(b => `≤R${b.maxIncome.toLocaleString()}→${b.subsidyPercent}%${b.category ? ' (' + b.category + ')' : ''}`).join(', ')}.`;
        }

        detail += ' Verify with payslips or bank statements.';

        if (excluded.length > 0 && totalIncome !== validatableIncome) {
          detail += ` Validatable income: R${validatableIncome.toLocaleString()} (excluded: ${excluded.join(', ')}).`;
        }
        if (dwellingExcluded.length > 0 && totalIncome !== validatableIncome) {
          detail += ` ${dwellingExcluded.length} additional dwelling occupier(s) excluded.`;
        }
        const occTypeExcluded = this.getOccupierTypeExcludedNames();
        if (occTypeExcluded.length > 0) {
          detail += ` Occupier type excluded: ${occTypeExcluded.join(', ')}.`;
        }

        const incomeKnown = hasOccupierData || captured > 0;
        const effectiveIncome = hasOccupierData ? incomeToCheck : captured;

        if (incomeKnown && slidingEnabled) {
          base.method = 'both';
          const matchedBracket = brackets.find(b => effectiveIncome <= b.maxIncome);
          if (matchedBracket) {
            base.passed = true;
            this.qualifiedSubsidyPercentage.set(matchedBracket.subsidyPercent);
            const catLabel = matchedBracket.category ? ` [${matchedBracket.category}]` : '';
            detail += ` R${effectiveIncome.toLocaleString()} falls within the ≤R${matchedBracket.maxIncome.toLocaleString()} bracket — qualifies for ${matchedBracket.subsidyPercent}% subsidy${catLabel}.`;
          } else {
            base.passed = false;
            this.qualifiedSubsidyPercentage.set(0);
            const maxBracket = brackets[brackets.length - 1];
            detail += ` R${effectiveIncome.toLocaleString()} exceeds all income brackets (maximum: R${maxBracket.maxIncome.toLocaleString()}) — subsidy is 0%. Does not qualify.`;
          }
        } else if (incomeKnown && limit > 0) {
          base.method = 'both';
          base.passed = effectiveIncome <= limit;
          if (base.passed) {
            this.qualifiedSubsidyPercentage.set(100);
            detail += ` R${effectiveIncome.toLocaleString()} is within the R${limit.toLocaleString()} limit — qualifies for 100% subsidy.`;
          } else {
            this.qualifiedSubsidyPercentage.set(0);
            detail += ` R${effectiveIncome.toLocaleString()} exceeds the R${limit.toLocaleString()} income limit — subsidy is 0%. Does not qualify.`;
          }
        } else {
          base.method = 'manual';
          this.qualifiedSubsidyPercentage.set(null);
        }
        base.detail = detail;
        base.dataSource = 'Manual — payslips, bank statements, SASSA letter';
        break;
      }
      case 'staff_member': {
        const emp = data.nameInfo?.employmentStatus;
        const employer = data.nameInfo?.employer;
        if (emp && employer) {
          const isMunicipal = employer.toLowerCase().includes('municip') || employer.toLowerCase().includes('george');
          if (isMunicipal) {
            base.method = 'auto';
            base.passed = false;
            base.detail = `Employer "${employer}" appears to be a municipal entity`;
            base.dataSource = 'Name register (Platinum)';
            break;
          }
        }
        base.method = 'manual';
        base.detail = 'Verify applicant is not a municipal staff member';
        base.dataSource = 'Manual — check against HR/payroll records';
        break;
      }
      case 'property_category': {
        const tariff = data.property?.ratesTariff;
        if (tariff) {
          base.method = 'auto';
          const isResidential = tariff.toLowerCase().includes('residen');
          base.passed = isResidential;
          base.detail = `Property tariff: ${tariff}`;
          base.dataSource = 'Property register (Platinum)';
        } else {
          base.method = 'manual';
          base.detail = 'Property category unavailable — verify manually';
          base.dataSource = 'Manual verification required';
        }
        break;
      }
      case 'vehicle_value': {
        if (limit > 0) {
          base.method = 'manual';
          base.detail = `Vehicle value must not exceed R${limit.toLocaleString()}. Verify with vehicle registration documents.`;
          base.dataSource = 'Manual — vehicle registration / licence documents';
        } else {
          base.method = 'manual';
          base.passed = true;
          base.detail = 'No vehicle value limit configured';
          base.dataSource = 'Not applicable';
        }
        break;
      }
      case 'arrears_tolerance': {
        const arrears = data.arrearsAmount;
        if (arrears !== null && arrears !== undefined && limit > 0) {
          base.method = 'auto';
          base.passed = arrears <= limit;
          base.detail = base.passed
            ? `Arrears R${arrears.toLocaleString()} is within the R${limit.toLocaleString()} tolerance`
            : `Arrears R${arrears.toLocaleString()} exceeds the R${limit.toLocaleString()} tolerance`;
          base.dataSource = 'Account balance (Platinum)';
        } else if (limit > 0) {
          base.method = 'manual';
          base.detail = `Arrears data unavailable — tolerance limit is R${limit.toLocaleString()}. Verify manually.`;
          base.dataSource = 'Manual verification required';
        } else {
          base.method = 'manual';
          base.passed = true;
          base.detail = 'No arrears tolerance configured';
          base.dataSource = 'Not applicable';
        }
        break;
      }
      case 'deceased_estate': {
        const nameStatus = data.nameInfo?.deceasedStatus;
        if (nameStatus) {
          base.method = 'auto';
          const isDeceased = nameStatus.toLowerCase().includes('deceased') || nameStatus.toLowerCase().includes('estate');
          base.passed = !isDeceased;
          base.detail = isDeceased
            ? `Name register status: "${nameStatus}" — deceased estate detected`
            : `Name register status: "${nameStatus}" — not a deceased estate`;
          base.dataSource = 'Name register (Platinum)';
        } else {
          base.method = 'manual';
          base.detail = 'Verify the property is not a deceased estate';
          base.dataSource = 'Manual — death certificate / estate records';
        }
        break;
      }
      case 'child_headed_auto': {
        base.method = 'auto';
        base.passed = true;
        base.detail = 'Auto-qualify enabled: Child-headed households automatically qualify regardless of income';
        base.dataSource = 'Policy override — auto-qualification';
        break;
      }
      case 'no_infrastructure_auto': {
        base.method = 'auto';
        base.passed = true;
        base.detail = 'Auto-qualify enabled: Households without basic services infrastructure automatically qualify';
        base.dataSource = 'Policy override — auto-qualification';
        break;
      }
      case 'dependants': {
        const minDeps = configType?.minDependants || limit || 0;
        if (minDeps > 0) {
          base.method = 'manual';
          base.detail = `Minimum ${minDeps} dependant(s) required. Verify with household composition affidavit.`;
          base.dataSource = 'Manual — household affidavit / supporting documents';
        } else {
          base.method = 'manual';
          base.passed = true;
          base.detail = 'No minimum dependants requirement configured';
          base.dataSource = 'Not applicable';
        }
        break;
      }
      case 'pensioner_status': {
        const pAge = data.nameInfo?.age;
        if (pAge !== null && pAge !== undefined) {
          base.method = 'both';
          const isPensionAge = pAge >= 60;
          base.passed = isPensionAge;
          base.detail = isPensionAge
            ? `Applicant age ${pAge} — pension age. Verify with SASSA grant letter.`
            : `Applicant age ${pAge} — not pension age. Verify pensioner status with supporting documents.`;
          base.dataSource = 'ID number (Platinum) + Manual verification';
        } else {
          base.method = 'manual';
          base.detail = 'Verify pensioner status with SASSA grant letter or pension documentation';
          base.dataSource = 'Manual — SASSA letter / pension documents';
        }
        break;
      }
      default: {
        if (test.validationMode === 'api') {
          base.method = 'bureau';
          base.detail = 'External verification required';
          base.dataSource = 'External service';
        } else {
          base.method = 'manual';
          base.detail = test.description;
          base.dataSource = 'Manual verification — supporting documents required';
        }
      }
    }

    if (wasBoth && base.method === 'auto') {
      base.method = 'both';
      base.detail = base.detail + ' — manual confirmation also required';
    }

    return base;
  }

  private getTypeLimitForTest(testId: string, configType: IndigentType): number {
    const t = configType as any;
    const allTests = [
      ...(t.standardQualificationTests || []),
      ...(t.municipalPolicyTests || []),
    ];
    const savedTest = allTests.find((st: any) => st.testId === testId);
    if (savedTest && savedTest.configValue !== undefined && savedTest.configValue !== null) {
      return savedTest.configValue;
    }
    switch (testId) {
      case 'property_value': return t.marketValueQualification || t.marketValueLimit || 0;
      case 'income_limit': return t.incomeLimit || 0;
      case 'property_size': return t.propertySizeLimit || 0;
      case 'vehicle_value': return t.vehicleValueLimit || 0;
      case 'arrears_tolerance': return t.arrearsToleranceAmount || t.arrearsTolerance || 0;
      default: return 0;
    }
  }

  async runSmartQualification(): Promise<void> {
    const account = this.selectedAccount();
    const typeId = this.selectedIndigentTypeId();
    if (!account || !typeId) return;

    this.smartCheckLoading.set(true);
    this.error.set(null);
    this.smartCheckDone.set(false);

    try {
      const data = await firstValueFrom(
        this.indigentService.getSmartQualificationData(account.accountId)
      );
      this.smartQualData.set(data);

      this.isTenantApplication.set(data.accountTypeId === 2);
      const acct = this.selectedAccount();
      if (acct) {
        const updates: Partial<AccountResult> = {};
        if (data.accountTypeId && !acct.accountTypeId) updates.accountTypeId = data.accountTypeId;
        if (data.nameInfo?.idNumber && !acct.idNo) updates.idNo = data.nameInfo.idNumber;
        if (Object.keys(updates).length) {
          this.selectedAccount.set({ ...acct, ...updates } as AccountResult);
        }
      }

      const enabledTests = this.getEnabledTests();
      const selectedType = this.indigentTypes().find(t => t.indigentTypeId === typeId) || null;
      const results = enabledTests.map(test => this.runAutoCheck(test, data, selectedType));

      this.smartCheckResults.set(results);
      this.smartCheckDone.set(true);

      if (data.hasActiveApplication) {
        this.existingApplications.set(data.activeApplications.map(a => ({
          applicationId: a.applicationId,
          attpStatus: a.status,
          applicationDate: a.applicationDate,
          reApplicationDate: '',
        })));
      }

      this.recalcDatesForSenior();
    } catch (err: unknown) {
      const e = err as { error?: { message?: string; detail?: string }; message?: string; status?: number };
      const detail = e?.error?.message || e?.error?.detail || '';
      const statusCode = e?.status || 0;
      let msg = 'Could not fetch qualification data';
      if (statusCode === 502 || detail.includes('unreachable') || detail.includes('timeout')) {
        msg += ': Platinum API is temporarily unavailable. Please try again in a moment.';
      } else if (detail) {
        msg += ': ' + detail;
      }
      this.error.set(msg);
    } finally {
      this.smartCheckLoading.set(false);
    }
  }

  clearSelectedAccount(): void {
    this.selectedAccount.set(null);
    this.searchResults.set([]);
    this.searchPerformed.set(false);
    this.searchQuery.set('');
    this.qualificationCheck.set(null);
    this.smartCheckResults.set([]);
    this.qualifiedSubsidyPercentage.set(null);
    this.smartCheckDone.set(false);
    this.smartQualData.set(null);
    this.manualOverrides.set({});
    this.savedApplication.set(null);
    this.existingApplications.set([]);
    this.existingAppDetail.set(null);
    this.viewingExisting.set(false);
    this.readOnly.set(false);
    this.occupiers.set([]);
    this.tenantDetail.set(null);
    this.householdIncome.set(0);
    this.remarks.set('');
    this.altContactPhone.set('');
    this.altContactEmail.set('');
    this.isTenantApplication.set(false);
    this.applicationDate.set(this.todayIso());
    this.commencementDate.set(this.todayIso());
    this.reApplicationDate.set(this.defaultReApplicationDate());
    this.terminationDate.set(this.defaultTerminationDate());
    this.declarationConfirmed.set(false);
    this.signatureCount.set(0);
    this.uploadedDocs.set({});
    this.requiredDocUploads.set({});
    this.accountExistingApps.set([]);
    this.checkingExistingApps.set(false);
    this.selectedIndigentTypeId.set(null);
    this.currentView.set('search');
  }

  async runQualificationCheck(): Promise<void> {
    const account = this.selectedAccount();
    const typeId = this.selectedIndigentTypeId();
    if (!account || !typeId) return;

    this.qualCheckLoading.set(true);
    this.error.set(null);

    try {
      const result = await firstValueFrom(
        this.indigentService.getQualificationCheck(account.accountId, typeId)
      );
      this.qualificationCheck.set(result);
      this.existingApplications.set(result?.existingApplication ? [result.existingApplication] : []);
    } catch (err: unknown) {
      this.qualificationCheck.set({
        accountId: account.accountId,
        indigentTypeId: typeId,
        qualifies: false,
        checks: [],
        standardChecks: [],
        municipalChecks: [],
        existingApplication: null,
        qualificationUnavailable: true,
      });
      this.error.set('Qualification check is currently unavailable from the server. You may still proceed with the application.');
    } finally {
      this.qualCheckLoading.set(false);
    }
  }

  async viewExistingApplication(appId: number): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.successMessage.set(null);
    try {
      const detail = await firstValueFrom(this.indigentService.getApplicationDetail(appId));
      this.existingAppDetail.set(detail);
      this.viewingExisting.set(true);
      if (detail?.application) {
        this.savedApplication.set({
          applicationId: detail.application.applicationId,
          accountId: detail.application.accountId,
          appStatusId: detail.application.appStatusId,
          appStatusName: detail.application.appStatusName,
          indigentTypeId: detail.application.indigentTypeId,
          indigentTypeName: detail.application.indigentTypeName,
          householdIncome: detail.application.householdIncome,
          applicationDate: detail.application.applicationDate,
          reApplicationDate: detail.application.reApplicationDate,
          doNotCutDate: detail.application.doNotCutDate || '',
          monthlySubsidy: detail.application.monthlySubsidy,
          qualifyingUnits: detail.application.qualifyingUnits,
          onceWriteOff: detail.application.onceWriteOff,
        });
        this.qualifiedSubsidyPercentage.set(detail.application.qualifiedSubsidyPercentage ?? null);
        this.selectedIndigentTypeId.set(detail.application.indigentTypeId);
        this.occupiers.set(detail.occupiers || []);
        this.syncHolderFormFromOccupiers();
        this.tenantDetail.set(detail.tenant || null);
        this.householdIncome.set(detail.application.householdIncome);
        this.remarks.set(detail.application.remarks || '');
        if (detail.application.accountId) {
          this.selectedAccount.set({
            accountId: detail.application.accountId,
            accountNo: detail.application.accountNumber || '',
            fullName: (detail.application as any).accountHolderName || (detail.application as any).fullName || '',
            idNo: (detail.application as any).idNumber || '',
            physicalAddress: (detail.application as any).physicalAddress || '',
            postalAddress: (detail.application as any).postalAddress || '',
            cellNo: (detail.application as any).cellNo || '',
            email: (detail.application as any).email || '',
            balance: (detail.application as any).balance || 0,
            sgNumber: '',
            accountStatus: (detail.application as any).accountStatus || '',
            accountTypeId: (detail.application as any).accountTypeId ?? null,
            allPhones: [],
            allEmails: [],
          } as any);
        }
        if ((detail.application as any).altrContactNo) this.altContactPhone.set((detail.application as any).altrContactNo);
        if ((detail.application as any).altContactEmail) this.altContactEmail.set((detail.application as any).altContactEmail);
        if ((detail.application as any).isTenantApplication) this.isTenantApplication.set(true);
        this.currentView.set('summary'); this.generateApplicationQR();
      }
    } catch {
      this.error.set('Failed to load application details.');
    } finally {
      this.loading.set(false);
    }
  }

  private determineResumeStep(detail: any): AppView {
    return 'form';
  }

  async continueExistingApplication(appId: number): Promise<void> {
    this.loadApplicationById(appId, false);
  }

  proceedToForm(): void {
    if (this.existingApplications().length > 0) {
      alert('This account already has an active application. Only one application per account is allowed.');
      return;
    }
    this.currentView.set('form');
    this.error.set(null);
  }

  cancelApplication(): void {
    if (!confirm('Are you sure you want to cancel? All unsaved progress will be lost.')) return;
    this.clearSelectedAccount();
  }

  private getSelectedTypeConfig(): any {
    const typeId = this.selectedIndigentTypeId();
    const types = this.indigentTypes();
    return types.find(t => t.indigentTypeId === typeId) || null;
  }

  private buildReportHtml(isRejection: boolean = false): string {
    const account = this.selectedAccount();
    if (!account) return '';

    const smartResults = this.smartCheckResults();
    const qc = this.qualificationCheck();
    const hasSmartResults = smartResults.length > 0;

    if (!hasSmartResults && !qc) return '';

    const selectedType = this.getSelectedTypeConfig();
    const reportCfg = (selectedType as any)?.reportConfig || {};
    const headerText = reportCfg.reportHeaderText || 'Indigent Qualification Report';
    const includesBureau = reportCfg.includesBureauReport !== false;
    const d = new Date();
    const dateStr = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    const timeStr = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    const title = isRejection ? 'Rejection Notice' : headerText;
    const typeName = selectedType?.indigentTypeName || '';
    const smartData = this.smartQualData();
    const overrides = this.manualOverrides();
    const refNo = `IQR-${account.accountNo.replace(/^0+/, '')}-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;

    let qualifies: boolean;
    let allResults: { testName: string; detail: string; passed: boolean | null; method: string; severity: string; dataSource: string }[] = [];

    if (hasSmartResults) {
      allResults = smartResults.map(r => ({
        testName: r.testName,
        detail: r.detail || r.description,
        passed: r.method === 'manual' ? (overrides[r.testId] === true) :
                r.method === 'both' ? (r.passed === true && overrides[r.testId] === true) :
                r.method === 'bureau' ? null : r.passed,
        method: r.method,
        severity: r.severity,
        dataSource: r.dataSource
      }));
      qualifies = this.smartQualificationPassed() === true;
    } else {
      const std = this.standardChecks();
      const mun = this.municipalChecks();
      const checks = std.length > 0 || mun.length > 0 ? [...std, ...mun] : (qc?.checks || []);
      allResults = checks.map((c: any) => ({
        testName: c.rule || c.testName || '',
        detail: c.detail || '',
        passed: c.passed,
        method: 'auto',
        severity: 'blocking',
        dataSource: ''
      }));
      qualifies = qc?.qualifies === true;
    }

    const passCount = allResults.filter(r => r.passed === true).length;
    const failCount = allResults.filter(r => r.passed === false).length;
    const pendingCount = allResults.filter(r => r.passed === null).length;
    const totalCount = allResults.length;

    const statusText = qualifies ? 'QUALIFIES' : 'DOES NOT QUALIFY';

    const renderTestTable = (checks: typeof allResults, label: string, sectionIcon: string) => {
      if (checks.length === 0) return '';
      const passed = checks.filter(c => c.passed === true).length;
      let h = `<div class="section-block">
        <div class="section-title"><span class="section-icon">${sectionIcon}</span>${label}<span class="section-count">${passed}/${checks.length} passed</span></div>
        <table><thead><tr><th style="width:25%">TEST</th><th style="width:35%">DETAIL</th><th style="width:22%">SOURCE</th><th style="width:18%;text-align:center">RESULT</th></tr></thead><tbody>`;
      for (const c of checks) {
        let resultBadge: string;
        if (c.passed === true) {
          resultBadge = '<span class="badge badge-pass">PASS</span>';
        } else if (c.passed === false) {
          resultBadge = '<span class="badge badge-fail">FAIL</span>';
        } else {
          resultBadge = '<span class="badge badge-pending">PENDING</span>';
        }
        const methodLabel = c.method === 'auto' ? 'System' : c.method === 'manual' ? 'Manual' : c.method === 'both' ? 'Auto+Manual' : c.method === 'bureau' ? 'Bureau' : '';
        h += `<tr><td class="cell-name">${this.escHtml(c.testName)}</td><td class="cell-detail">${this.escHtml(c.detail)}</td><td class="cell-source">${this.escHtml(c.dataSource)}${methodLabel ? `<span class="method-tag">${methodLabel}</span>` : ''}</td><td style="text-align:center">${resultBadge}</td></tr>`;
      }
      h += '</tbody></table></div>';
      return h;
    };

    let checksHtml = '';
    if (hasSmartResults) {
      const autoChecks = allResults.filter(r => r.method === 'auto');
      const bothChecks = allResults.filter(r => r.method === 'both');
      const manualChecks = allResults.filter(r => r.method === 'manual');
      const bureauChecks = allResults.filter(r => r.method === 'bureau');
      if (autoChecks.length > 0) checksHtml += renderTestTable(autoChecks, 'Auto-Verified (System Data)', '&#9881;');
      if (bothChecks.length > 0) checksHtml += renderTestTable(bothChecks, 'Auto-Verified + Manual Confirmation', '&#128269;');
      if (manualChecks.length > 0) checksHtml += renderTestTable(manualChecks, 'Manual Verification (Documents)', '&#128203;');
      if (bureauChecks.length > 0) checksHtml += renderTestTable(bureauChecks, 'Bureau / External Verification', '&#128225;');
    } else {
      const std = this.standardChecks();
      const mun = this.municipalChecks();
      if (std.length > 0) checksHtml += renderTestTable(std.map((c: any) => ({ testName: c.rule, detail: c.detail, passed: c.passed, method: 'auto', severity: 'blocking', dataSource: '' })), 'Standard Qualification Tests', '&#9881;');
      if (mun.length > 0) checksHtml += renderTestTable(mun.map((c: any) => ({ testName: c.rule, detail: c.detail, passed: c.passed, method: 'auto', severity: 'blocking', dataSource: '' })), 'Municipal Policy Tests', '&#128220;');
    }

    let applicantSection = '';
    if (smartData?.nameInfo) {
      const n = smartData.nameInfo;
      const fields = [
        n.idNumber ? ['ID Number', n.idNumber] : null,
        n.dateOfBirth ? ['Date of Birth', n.dateOfBirth] : null,
        n.age != null ? ['Age', String(n.age)] : null,
        n.citizenship ? ['Citizenship', n.citizenship] : null,
        n.employmentStatus ? ['Employment', n.employmentStatus] : null,
        n.employer ? ['Employer', n.employer] : null,
      ].filter(Boolean) as string[][];
      applicantSection = `<div class="info-card">
        <div class="info-card-title">Applicant Details</div>
        <div class="info-grid">${fields.map(f => `<div class="info-item"><span class="info-label">${f[0]}</span><span class="info-value">${this.escHtml(f[1])}</span></div>`).join('')}</div>
      </div>`;
    }

    let propertySection = '';
    if (smartData?.property) {
      const p = smartData.property;
      const fields = [
        p.marketValue != null ? ['Market Value', `R ${p.marketValue.toLocaleString()}`] : null,
        p.standSize != null ? ['Stand Size', `${p.standSize.toLocaleString()} m\u00B2`] : null,
        p.ratesTariff ? ['Tariff', p.ratesTariff] : null,
        (p as any).physicalAddress ? ['Address', (p as any).physicalAddress] : null,
      ].filter(Boolean) as string[][];
      propertySection = `<div class="info-card">
        <div class="info-card-title">Property Details</div>
        <div class="info-grid">${fields.map(f => `<div class="info-item"><span class="info-label">${f[0]}</span><span class="info-value">${this.escHtml(f[1])}</span></div>`).join('')}</div>
      </div>`;
    }

    let linkedAccountsSection = '';
    if ((smartData as any)?.linkedAccounts && (smartData as any).linkedAccounts.length > 0) {
      const accts = (smartData as any).linkedAccounts;
      linkedAccountsSection = `<div class="section-block">
        <div class="section-title"><span class="section-icon">&#128279;</span>Linked Accounts (${accts.length})</div>
        <table><thead><tr><th>Account</th><th>Name</th><th>Address</th></tr></thead><tbody>
        ${accts.map((a: any) => `<tr><td>${this.escHtml(a.accountNumber || a.accountNo || '')}</td><td>${this.escHtml(a.name || a.fullName || a.accountHolderName || '')}</td><td>${this.escHtml(a.deliveryAddress || a.address || a.physicalAddress || '')}</td></tr>`).join('')}
        </tbody></table></div>`;
    }

    let docsSection = '';
    const docs = this.uploadedDocs();
    const allDocs = Object.entries(docs).flatMap(([testId, files]) => files.map(f => ({ testId, ...f })));
    if (allDocs.length > 0) {
      docsSection = `<div class="section-block">
        <div class="section-title"><span class="section-icon">&#128206;</span>Supporting Documents (${allDocs.length})</div>
        <table><thead><tr><th>File</th><th>Size</th><th>Status</th></tr></thead><tbody>
        ${allDocs.map(dd => `<tr><td>${this.escHtml(dd.name)}</td><td>${dd.sizeLabel}</td><td>${dd.uploaded ? '<span class="badge badge-pass">Uploaded</span>' : `<span class="badge badge-pending">${dd.error || 'Pending'}</span>`}</td></tr>`).join('')}
        </tbody></table></div>`;
    }

    let rejectionSection = '';
    if (isRejection && !qualifies) {
      const failedChecks = allResults.filter(c => c.passed === false);
      const templateText = (reportCfg.rejectionLetterTemplate || '')
        .replace(/\{applicantName\}/g, this.escHtml(account.fullName))
        .replace(/\{accountNo\}/g, this.escHtml(account.accountNo))
        .replace(/\{qualificationDate\}/g, dateStr)
        .replace(/\{indigentType\}/g, this.escHtml(typeName));
      rejectionSection = `
        <div class="rejection-block">
          <div class="rejection-title">Reason for Rejection</div>
          ${templateText ? `<p class="rejection-text">${this.escHtml(templateText)}</p>` : ''}
          <p style="font-size:10px;color:#555;margin:0 0 6px;font-weight:600;">Failed Tests:</p>
          <ul class="rejection-list">
            ${failedChecks.map(c => `<li><strong>${this.escHtml(c.testName)}:</strong> ${this.escHtml(c.detail)}</li>`).join('')}
          </ul>
        </div>`;
    }

    const assessorName = this.escHtml(((this.auth.user()?.firstName || '') + ' ' + (this.auth.user()?.lastName || '')).trim());
    const fileName = `${isRejection ? 'Rejection' : 'Qualification'}_Report_${account.accountNo}_${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;

    return `<!DOCTYPE html><html><head><title>George Municipality - ${title}</title>
<style>
@page { size: A4 portrait; margin: 18mm 16mm 20mm 16mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', -apple-system, 'Helvetica Neue', Arial, sans-serif; font-size: 10.5px; color: #1e293b; line-height: 1.5; background: #f1f5f9; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; padding: 0; position: relative; }
.page-inner { padding: 28px 32px 80px 32px; }
.toolbar { background: #0f2b46; color: #fff; padding: 10px 24px; display: flex; align-items: center; justify-content: space-between; font-size: 12px; }
.toolbar-title { font-weight: 600; letter-spacing: 0.3px; }
.toolbar-actions { display: flex; gap: 8px; }
.toolbar-btn { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); color: #fff; padding: 6px 16px; border-radius: 6px; font-size: 11px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s; font-family: inherit; }
.toolbar-btn:hover { background: rgba(255,255,255,0.25); }
.toolbar-btn-primary { background: #c9a84c; border-color: #c9a84c; color: #0f2b46; font-weight: 600; }
.toolbar-btn-primary:hover { background: #d4b55e; }

.letterhead { text-align: center; padding: 24px 0 20px; border-bottom: 3px solid #0f2b46; position: relative; }
.letterhead::after { content: ''; position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 80px; height: 3px; background: #c9a84c; }
.muni-name { font-size: 22px; font-weight: 700; color: #0f2b46; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 2px; }
.report-subtitle { font-size: 12px; color: #c9a84c; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; }

.meta-bar { display: flex; justify-content: space-between; align-items: flex-start; margin: 16px 0; padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; }
.meta-col { display: flex; flex-direction: column; gap: 3px; }
.meta-item { font-size: 10px; color: #64748b; }
.meta-item strong { color: #334155; font-weight: 600; }
.meta-ref { font-family: 'Courier New', monospace; font-size: 9px; color: #94a3b8; }

.outcome-banner { margin: 16px 0; padding: 14px 20px; border-radius: 6px; display: flex; align-items: center; gap: 14px; }
.outcome-pass { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #86efac; }
.outcome-fail { background: linear-gradient(135deg, #fef2f2, #fee2e2); border: 1px solid #fca5a5; }
.outcome-icon { font-size: 28px; flex-shrink: 0; }
.outcome-text { font-size: 16px; font-weight: 700; letter-spacing: 0.5px; }
.outcome-pass .outcome-text { color: #166534; }
.outcome-fail .outcome-text { color: #991b1b; }
.outcome-detail { font-size: 10px; color: #64748b; margin-top: 2px; }

.info-card { margin: 14px 0; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
.info-card-title { font-size: 11px; font-weight: 700; color: #0f2b46; padding: 8px 14px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; letter-spacing: 0.5px; }
.info-grid { display: grid; grid-template-columns: repeat(3, 1fr); padding: 10px 14px; gap: 8px 16px; }
.info-item { display: flex; flex-direction: column; }
.info-label { font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.3px; font-weight: 600; }
.info-value { font-size: 10.5px; color: #1e293b; font-weight: 500; }

.section-block { margin: 16px 0; }
.section-title { font-size: 11px; font-weight: 700; color: #0f2b46; padding: 8px 0 6px; border-bottom: 2px solid #0f2b46; margin-bottom: 0; display: flex; align-items: center; gap: 6px; text-transform: uppercase; letter-spacing: 0.4px; }
.section-icon { font-size: 13px; }
.section-count { font-size: 9px; color: #94a3b8; font-weight: 500; margin-left: auto; text-transform: none; letter-spacing: 0; }
table { width: 100%; border-collapse: collapse; font-size: 10px; }
thead tr { background: #f8fafc; }
th { text-align: left; padding: 7px 10px; font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
tr:hover { background: #fafbfc; }
.cell-name { font-weight: 600; color: #1e293b; }
.cell-detail { color: #475569; }
.cell-source { color: #94a3b8; font-size: 9px; }
.method-tag { display: inline-block; background: #e2e8f0; color: #475569; padding: 1px 6px; border-radius: 3px; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; margin-left: 4px; vertical-align: middle; }
.badge { display: inline-block; padding: 2px 10px; border-radius: 3px; font-size: 9px; font-weight: 700; letter-spacing: 0.3px; text-transform: uppercase; }
.badge-pass { background: #dcfce7; color: #166534; }
.badge-fail { background: #fee2e2; color: #991b1b; }
.badge-pending { background: #f1f5f9; color: #64748b; }

.rejection-block { margin: 16px 0; padding: 16px; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 6px; }
.rejection-title { font-size: 13px; font-weight: 700; color: #991b1b; margin-bottom: 8px; }
.rejection-text { font-size: 10.5px; color: #333; margin-bottom: 12px; white-space: pre-line; }
.rejection-list { margin: 0; padding-left: 18px; font-size: 10px; color: #555; }
.rejection-list li { margin-bottom: 3px; }

.signature-section { margin-top: 28px; padding-top: 20px; border-top: 2px solid #0f2b46; page-break-inside: avoid; }
.sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 12px; }
.sig-block { }
.sig-line { border-bottom: 1px solid #94a3b8; height: 32px; margin-bottom: 4px; }
.sig-label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; }

.footer { position: absolute; bottom: 0; left: 0; right: 0; padding: 12px 32px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; font-size: 8px; color: #94a3b8; background: #fafbfc; }
.footer-left { display: flex; flex-direction: column; gap: 1px; }
.footer-right { text-align: right; display: flex; flex-direction: column; gap: 1px; }

.watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-35deg); font-size: 90px; font-weight: 900; color: rgba(15,43,70,0.03); letter-spacing: 8px; pointer-events: none; text-transform: uppercase; white-space: nowrap; z-index: 0; }

@media print {
  body { background: #fff; }
  .toolbar { display: none !important; }
  .page { width: auto; margin: 0; box-shadow: none; }
  .page-inner { padding: 0 0 60px 0; }
}
@media screen {
  body { padding: 20px; }
  .page { box-shadow: 0 4px 24px rgba(0,0,0,0.12); border-radius: 2px; }
}
</style>
</head><body>
<div class="toolbar no-print">
  <span class="toolbar-title">George Municipality &mdash; ${this.escHtml(title)}</span>
  <div class="toolbar-actions">
    <button class="toolbar-btn" onclick="window.print()">&#128424; Print</button>
    <button class="toolbar-btn toolbar-btn-primary" onclick="window.print()">&#128190; Download PDF</button>
  </div>
</div>
<div class="page">
  <div class="watermark">${isRejection ? 'REJECTED' : (qualifies ? 'APPROVED' : 'NOT QUALIFIED')}</div>
  <div class="page-inner">
    <div class="letterhead">
      <div class="muni-name">George Municipality</div>
      <div class="report-subtitle">${this.escHtml(title)}</div>
    </div>
    <div class="meta-bar">
      <div class="meta-col">
        <span class="meta-item"><strong>Account:</strong> ${this.escHtml(account.accountNo)}</span>
        <span class="meta-item"><strong>Account Holder:</strong> ${this.escHtml(account.fullName)}</span>
        <span class="meta-item"><strong>ID Number:</strong> ${this.escHtml(account.idNo || 'N/A')}</span>
      </div>
      <div class="meta-col">
        ${typeName ? `<span class="meta-item"><strong>Indigent Type:</strong> ${this.escHtml(typeName)}</span>` : ''}
        <span class="meta-item"><strong>Date:</strong> ${dateStr} at ${timeStr}</span>
        <span class="meta-item"><strong>Assessor:</strong> ${assessorName}</span>
      </div>
      <div class="meta-col" style="align-items:flex-end;">
        <span class="meta-ref">Ref: ${refNo}</span>
        ${this.qrCodeDataUrl() ? `<img src="${this.qrCodeDataUrl()}" alt="QR" style="width:88px;height:88px;border:1px solid #e2e8f0;padding:3px;background:white;margin-top:6px" /><div style="font-size:8px;color:#64748b;margin-top:2px;font-family:'Courier New',monospace">Scan to open</div>` : ''}
      </div>
    </div>
    <div class="outcome-banner ${qualifies ? 'outcome-pass' : 'outcome-fail'}">
      <span class="outcome-icon">${qualifies ? '&#9989;' : '&#10060;'}</span>
      <div>
        <div class="outcome-text">OUTCOME: ${statusText}</div>
        <div class="outcome-detail">${passCount} passed, ${failCount} failed${pendingCount > 0 ? `, ${pendingCount} pending` : ''} out of ${totalCount} qualification tests</div>
      </div>
    </div>
    ${applicantSection}
    ${propertySection}
    ${checksHtml}
    ${docsSection}
    ${linkedAccountsSection}
    ${rejectionSection}
    <div class="signature-section">
      <div class="sig-grid">
        <div class="sig-block">
          <div class="sig-line"></div>
          <div class="sig-label">Assessor Signature &amp; Date</div>
        </div>
        <div class="sig-block">
          <div class="sig-line"></div>
          <div class="sig-label">Supervisor Signature &amp; Date</div>
        </div>
      </div>
    </div>
  </div>
  <div class="footer">
    <div class="footer-left">
      ${includesBureau ? '<span>Bureau verification data sourced via Third Party Bureau (NCRCB62)</span>' : ''}
      <span>This is an official document of George Municipality</span>
    </div>
    <div class="footer-right">
      <span>Generated: ${dateStr} ${timeStr}</span>
      <span>George Municipality POS System</span>
      <span style="font-family:'Courier New',monospace;">Ref: ${refNo}</span>
    </div>
  </div>
</div>
<script>
document.title = '${fileName}';
</script>
</body></html>`;
  }

  private escHtml(s: string): string {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  printQualificationReport(): void {
    const html = this.buildReportHtml(false);
    if (!html) return;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 400); }
  }

  printRejectionLetter(): void {
    const html = this.buildReportHtml(true);
    if (!html) return;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 400); }
  }

  private getQualificationOutcome(): string {
    const qc = this.qualificationCheck();
    if (qc) return qc.qualifies ? 'QUALIFIES' : 'DOES NOT QUALIFY';
    const smartPassed = this.smartQualificationPassed();
    if (smartPassed === true) return 'QUALIFIES';
    if (smartPassed === false) return 'DOES NOT QUALIFY';
    return 'PENDING';
  }

  sendResultViaEmail(): void {
    const account = this.selectedAccount();
    const outcome = this.getQualificationOutcome();
    if (!account || outcome === 'PENDING') return;
    if (!account.email) {
      this.error.set('No email address on file for this account. Please update the account contact details first.');
      return;
    }
    const subject = encodeURIComponent(`Indigent Qualification Result - Account ${account.accountNo}`);
    const body = encodeURIComponent(`Dear ${account.fullName},\n\nYour indigent qualification assessment for account ${account.accountNo} has been completed.\n\nOutcome: ${outcome}\n\nPlease contact George Municipality for the full qualification report.\n\nRegards,\nGeorge Municipality`);
    window.open(`mailto:${account.email}?subject=${subject}&body=${body}`, '_self');
  }

  sendResultViaSms(): void {
    const account = this.selectedAccount();
    const outcome = this.getQualificationOutcome();
    if (!account || outcome === 'PENDING') return;
    if (!account.cellNo) {
      this.error.set('No cellphone number on file for this account. Please update the account contact details first.');
      return;
    }
    const msg = encodeURIComponent(`George Municipality: Indigent qualification result for acc ${account.accountNo}: ${outcome}. Contact municipality for full report.`);
    window.open(`sms:${account.cellNo}?body=${msg}`, '_self');
  }

  sendResultViaWhatsapp(): void {
    const account = this.selectedAccount();
    const outcome = this.getQualificationOutcome();
    if (!account || outcome === 'PENDING') return;
    if (!account.cellNo) {
      this.error.set('No cellphone number on file for this account. Please update the account contact details first.');
      return;
    }
    const msg = encodeURIComponent(`George Municipality: Indigent qualification result for account ${account.accountNo}\n\nOutcome: ${outcome}\n\nPlease contact the municipality for the full qualification report and bureau verification details.`);
    const phone = account.cellNo.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  }

  async saveApplication(): Promise<void> {
    if (this.savingApp()) return;
    if (this.existingApplications().length > 0 && !this.savedApplication()) {
      alert('This account already has an active application. Only one application per account is allowed.');
      return;
    }
    const account = this.selectedAccount();
    const typeId = this.selectedIndigentTypeId();
    if (!account) {
      this.error.set('No account selected. Please go back and select an account first.');
      return;
    }
    if (!typeId) {
      this.error.set('No indigent type selected. Please go back and select an indigent type first.');
      return;
    }

    this.savingApp.set(true);
    this.error.set(null);

    const existing = this.savedApplication();
    const now = this.todayIso();
    const payload: SaveApplicationRequest = {
      applicationId: existing?.applicationId ?? 0,
      accountId: account.accountId,
      indigentTypeId: typeId,
      appStatusId: existing?.appStatusId || 134,
      householdIncome: this.householdIncome(),
      applicationDate: this.applicationDate(),
      commencementDate: this.commencementDate(),
      reApplicationDate: this.reApplicationDate(),
      terminationDate: this.terminationDate(),
      socialGrantNumber: '',
      remarks: this.remarks() || '',
      reviewerId: 0,
      reviewDate: now,
      capturerId: this.userId,
      modifierId: this.userId,
      qualifiedSubsidyPercentage: this.qualifiedSubsidyPercentage() ?? 0,
      isTenantApplication: this.isTenantApplication(),
      altContactPhone: this.altContactPhone() || '',
      altContactEmail: this.altContactEmail() || '',
      assignedContractorId: 0,
      verificationDueDate: now,
      altrContactNo: this.altContactPhone() || '',
    };

    try {
      const result = await firstValueFrom(this.indigentService.saveApplication(payload));
      const iTypeForSave = this.indigentTypes().find(t => t.indigentTypeId === typeId) as any;
      const monthlySubsidy = iTypeForSave?.monthlySubsidy ?? iTypeForSave?.subsidyAmount ?? 0;
      const qualifyingUnits = iTypeForSave?.qualifyingUnits ?? iTypeForSave?.unitsLimit ?? 0;
      const subsidyPct = this.qualifiedSubsidyPercentage() ?? 100;
      const effectiveSubsidy = Math.round((monthlySubsidy * subsidyPct) / 100 * 100) / 100;
      this.savedApplication.set({
        applicationId: result.applicationId,
        accountId: account.accountId,
        appStatusId: payload.appStatusId,
        appStatusName: result.appStatusName || existing?.appStatusName || 'Pending',
        indigentTypeId: typeId,
        indigentTypeName: iTypeForSave?.indigentTypeName || '',
        householdIncome: this.householdIncome(),
        applicationDate: this.applicationDate(),
        reApplicationDate: this.reApplicationDate(),
        doNotCutDate: result.doNotCutDate || existing?.doNotCutDate || '',
        monthlySubsidy: effectiveSubsidy,
        qualifyingUnits: qualifyingUnits,
        onceWriteOff: result.onceWriteOff ?? existing?.onceWriteOff ?? 0,
      });
      this.successMessage.set(`Application ${existing ? 'updated' : 'saved'} successfully (ID: ${result.applicationId})`);
      if (!existing) {
        const iType = this.indigentTypes().find(t => t.indigentTypeId === typeId);
        if (iType) {
          const acct = this.selectedAccount();
          this.indigentService.fireLifecycleNotification({
            indigentType: iType,
            eventType: 'application_received',
            mergeData: {
              applicantName: acct?.fullName || (account as any).holderName || '',
              accountNumber: acct?.accountNo || '',
              applicationDate: this.applicationDate(),
              applicationId: String(result.applicationId),
              indigentTypeName: iType.indigentTypeName,
            },
            recipientEmail: acct?.email || '',
            recipientPhone: acct?.cellNo || '',
            accountId: String(account.accountId),
            accountNumber: acct?.accountNo || '',
            accountHolder: acct?.fullName || '',
          });
        }
      }
      await this.uploadStagedDocuments(result.applicationId);
      await this.autoAddAccountHolderAsOccupier(result.applicationId);
      this.currentView.set('occupiers');
    } catch (err: unknown) {
      const e = err as { error?: { message?: string; detail?: string }; message?: string };
      const detail = e?.error?.detail ? ` (${e.error.detail})` : '';
      this.error.set('Failed to save application: ' + (e?.error?.message || e?.message || 'Unknown error') + detail);
    } finally {
      this.savingApp.set(false);
    }
  }

  private async uploadOneRequiredDoc(appId: number, docConfig: RequiredDocumentConfig, doc: { name: string; fileData?: string; docLabel?: string; documentTypeId?: number }): Promise<void> {
    if (!doc.fileData) return;
    if (this.documentTypes().length === 0) {
      try {
        const types = await firstValueFrom(this.indigentService.getDocumentTypes());
        this.documentTypes.set(types || []);
      } catch { }
    }
    const typeId = doc.documentTypeId ?? docConfig.documentTypeId ?? this.resolveDocTypeId(docConfig.documentKey, docConfig.documentLabel);
    if (!typeId) {
      this.toast.show(`Cannot save "${doc.name}" — no Platinum document type mapped for "${docConfig.documentLabel}". Open Configuration → Indigent Type → Documents and pick a type.`, 'error');
      return;
    }
    try {
      await firstValueFrom(this.indigentService.uploadDocument({
        applicationId: appId,
        documentTypeId: typeId,
        documentName: `${docConfig.documentLabel || docConfig.documentKey} - ${doc.name}`,
        fileData: doc.fileData,
        fileName: doc.name,
        capturerId: this.auth.user()?.user_ID || 0,
        dateCaptured: new Date().toISOString(),
      }));
      this.toast.show(`"${doc.name}" saved.`, 'success');
      const docs = { ...this.requiredDocUploads() };
      if (docs[docConfig.documentKey]) {
        docs[docConfig.documentKey] = docs[docConfig.documentKey].filter(d => d.name !== doc.name);
        if (docs[docConfig.documentKey].length === 0) delete docs[docConfig.documentKey];
      }
      this.requiredDocUploads.set(docs);
      await this.loadSavedDocsForCurrentApp();
    } catch (err: any) {
      this.toast.show(err?.error?.message || `Failed to save "${doc.name}"`, 'error');
    }
  }

  private resolveDocTypeId(rawKey: string, label?: string): number | null {
    const types = this.documentTypes();
    if (!types.length) return null;
    const norm = (s: string) => (s || '').toLowerCase().replace(/[_\-\s]+/g, ' ').trim();
    const labelN = norm(label || '');
    const keyN = norm(rawKey);
    if (labelN) {
      let m = types.find(dt => norm(dt.documentTypeName) === labelN);
      if (m) return m.documentTypeId;
    }
    let m = types.find(dt => norm(dt.documentTypeName) === keyN);
    if (m) return m.documentTypeId;
    if (labelN) {
      m = types.find(dt => norm(dt.documentTypeName).includes(labelN) || labelN.includes(norm(dt.documentTypeName)));
      if (m) return m.documentTypeId;
    }
    m = types.find(dt => norm(dt.documentTypeName).includes(keyN) || keyN.includes(norm(dt.documentTypeName)));
    if (m) return m.documentTypeId;
    return null;
  }

  private async uploadStagedDocuments(appId: number): Promise<void> {
    if (this.documentTypes().length === 0) {
      try {
        const types = await firstValueFrom(this.indigentService.getDocumentTypes());
        this.documentTypes.set(types || []);
      } catch { }
    }

    const failedNames: string[] = [];
    let uploadCount = 0;

    const qualDocs = this.uploadedDocs();
    for (const [testId, docs] of Object.entries(qualDocs)) {
      for (const doc of docs) {
        if (!doc.fileData) continue;
        const typeId = this.resolveDocTypeId(testId, doc.testName);
        if (!typeId) {
          failedNames.push(`${doc.name} — no document type matches "${doc.testName || testId}". Add it under Configuration → Document Types.`);
          continue;
        }
        try {
          await firstValueFrom(this.indigentService.uploadDocument({
            applicationId: appId,
            documentTypeId: typeId,
            documentName: `${doc.testName || testId} - ${doc.name}`,
            fileData: doc.fileData,
            fileName: doc.name,
            capturerId: this.auth.user()?.user_ID || 0,
            dateCaptured: new Date().toISOString()
          }));
          uploadCount++;
        } catch {
          failedNames.push(doc.name);
        }
      }
    }

    const reqDocs = this.requiredDocUploads();
    for (const [docKey, docs] of Object.entries(reqDocs)) {
      for (const doc of docs) {
        if (!doc.fileData) continue;
        const typeId = doc.documentTypeId ?? this.resolveDocTypeId(docKey, doc.docLabel);
        if (!typeId) {
          failedNames.push(`${doc.name} — no document type mapped for "${doc.docLabel || docKey}". Open Configuration → Indigent Type → Documents and pick a Platinum document type.`);
          continue;
        }
        try {
          await firstValueFrom(this.indigentService.uploadDocument({
            applicationId: appId,
            documentTypeId: typeId,
            documentName: `${doc.docLabel || docKey} - ${doc.name}`,
            fileData: doc.fileData,
            fileName: doc.name,
            capturerId: this.auth.user()?.user_ID || 0,
            dateCaptured: new Date().toISOString()
          }));
          uploadCount++;
        } catch {
          failedNames.push(doc.name);
        }
      }
    }

    this.uploadedDocs.set({});
    this.requiredDocUploads.set({});

    if (failedNames.length > 0) {
      const msg = uploadCount > 0
        ? `${uploadCount} document(s) uploaded. ${failedNames.length} failed: ${failedNames.join(', ')}. You can re-upload from the application detail screen.`
        : `Document upload failed for: ${failedNames.join(', ')}. The application was saved. You can re-upload from the application detail screen.`;
      this.error.set(msg);
    } else if (uploadCount > 0) {
      const prev = this.successMessage() || 'Application saved.';
      this.successMessage.set(`${prev} ${uploadCount} document(s) uploaded.`);
    }
  }

  openAddOccupier(): void {
    this.editingOccupier.set(null);
    this.occForm.set({
      fullName: '',
      idNumber: '',
      passportNumber: '',
      employerId: this.employers().length ? this.employers()[0].employerId : 0,
      incomeSourceId: this.incomeSources().length ? this.incomeSources()[0].incomeSourceId : 0,
      incomeAmount: 0,
      dwellingUnitNo: 1,
      occupierTypeId: 0,
      contactNumber: '',
      relationship: '',
      dateOfBirth: '',
      gender: '',
      remarks: '',
    });
    this.showOccupierDialog.set(true);
  }

  openEditOccupier(occ: Occupier): void {
    this.editingOccupier.set(occ);
    this.occForm.set({
      fullName: occ.fullName,
      idNumber: occ.idNumber || '',
      passportNumber: occ.passportNumber || '',
      employerId: occ.employerId,
      incomeSourceId: occ.incomeSourceId,
      incomeAmount: occ.incomeAmount,
      dwellingUnitNo: occ.dwellingUnitNo || 1,
      occupierTypeId: occ.occupierTypeId || 0,
      contactNumber: occ.contactNumber || '',
      relationship: occ.relationship || '',
      dateOfBirth: occ.dateOfBirth || '',
      gender: occ.gender || '',
      remarks: occ.remarks || '',
    });
    this.showOccupierDialog.set(true);
  }

  private syncHolderFormFromOccupiers(): void {
    const acct = this.selectedAccount();
    if (!acct) return;
    const occs = this.occupiers();
    if (!occs.length) return;
    const holderId = (acct.idNo || '').trim();
    const holderName = (acct.fullName || '').trim().toLowerCase();
    const holder = occs.find(o =>
      (holderId && (o.idNumber || '').trim() === holderId) ||
      (!holderId && holderName && (o.fullName || '').trim().toLowerCase() === holderName)
    );
    if (!holder) return;
    this.holderForm.set({
      dateOfBirth: holder.dateOfBirth || '',
      gender: holder.gender || '',
      occupierTypeId: holder.occupierTypeId || 0,
      relationship: holder.relationship || 'Account Holder',
      contactNumber: holder.contactNumber || acct.cellNo || '',
      employerId: holder.employerId || 0,
      incomeSourceId: holder.incomeSourceId || 0,
      incomeAmount: holder.incomeAmount || 0,
    });
  }

  private async autoAddAccountHolderAsOccupier(applicationId: number): Promise<void> {
    try {
      const acct = this.selectedAccount();
      if (!acct || !applicationId) return;

      const existing = this.occupiers();
      const holderId = (acct.idNo || '').trim();
      const holderName = (acct.fullName || '').trim().toLowerCase();
      // Find the existing holder occupier (so re-saves UPDATE rather than skip)
      const existingHolder = existing.find(o =>
        (holderId && (o.idNumber || '').trim() === holderId) ||
        (!holderId && holderName && (o.fullName || '').trim().toLowerCase() === holderName)
      );

      const hf = this.holderForm();
      const holderType = this.occupierTypeOptions.find(t => t.id === hf.occupierTypeId)
        || this.occupierTypeOptions.find(t => /holder|self|primary|applicant/i.test(t.name))
        || this.occupierTypeOptions[0];
      const incomeSource = this.incomeSources().find(s => s.incomeSourceId === hf.incomeSourceId)
        || this.incomeSources().find(s => s.excludeFromValidation)
        || this.incomeSources()[0];
      if (!holderType || !incomeSource) return;

      // Income for the holder occupier mirrors the Application's Household Income
      // (the holder represents the household income on a single-occupier application).
      const incomeAmount = this.householdIncome() || hf.incomeAmount || 0;

      const today = this.todayIso();
      const payload: SaveOccupierRequest = {
        occupierId: existingHolder?.occupierId ?? null,
        applicationId,
        fullName: acct.fullName || existingHolder?.fullName || 'Account Holder',
        idNumber: holderId || existingHolder?.idNumber || null,
        passportNumber: existingHolder?.passportNumber || null,
        employerId: hf.employerId || 0,
        incomeSourceId: incomeSource.incomeSourceId,
        incomeAmount,
        dwellingUnitNo: this.isDwellingUnitsEnabled() ? (existingHolder?.dwellingUnitNo ?? 1) : undefined,
        occupierTypeId: holderType.id,
        contactNumber: hf.contactNumber || acct.cellNo || existingHolder?.contactNumber || null,
        relationship: hf.relationship || 'Account Holder',
        dateOfBirth: hf.dateOfBirth || existingHolder?.dateOfBirth || null,
        gender: hf.gender || existingHolder?.gender || null,
        remarks: existingHolder ? (existingHolder.remarks || 'Auto-synced from account holder details') : 'Auto-added from account holder details',
        capturerID: (existingHolder as any)?.capturerID ?? this.userId,
        dateCaptured: (existingHolder as any)?.dateCaptured || today,
        modifierID: this.userId,
        dateModified: today,
      };
      await firstValueFrom(this.indigentService.saveOccupier(payload));
      await this.refreshOccupiersFromPlatinum(applicationId);
    } catch (e) {
      console.warn('[autoAddAccountHolderAsOccupier] could not sync holder occupier:', e);
    }
  }

  occIdNumberError = signal<string | null>(null);

  private validateSaIdNumber(id: string): { valid: boolean; error?: string; dob?: string; gender?: 'Male' | 'Female' } {
    if (!id) return { valid: false, error: 'ID Number is required.' };
    const cleaned = id.replace(/\s+/g, '');
    if (!/^\d{13}$/.test(cleaned)) return { valid: false, error: 'ID Number must be exactly 13 digits.' };
    const yy = parseInt(cleaned.substring(0, 2), 10);
    const mm = parseInt(cleaned.substring(2, 4), 10);
    const dd = parseInt(cleaned.substring(4, 6), 10);
    if (mm < 1 || mm > 12) return { valid: false, error: 'ID Number contains an invalid month.' };
    if (dd < 1 || dd > 31) return { valid: false, error: 'ID Number contains an invalid day.' };
    const currentYY = new Date().getFullYear() % 100;
    const fullYear = yy <= currentYY ? 2000 + yy : 1900 + yy;
    const dobDate = new Date(fullYear, mm - 1, dd);
    if (dobDate.getFullYear() !== fullYear || dobDate.getMonth() !== mm - 1 || dobDate.getDate() !== dd) {
      return { valid: false, error: 'ID Number contains an invalid date of birth.' };
    }
    let sum = 0;
    for (let i = 0; i < 13; i++) {
      let d = parseInt(cleaned[i], 10);
      if (i % 2 === 1) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
    }
    if (sum % 10 !== 0) return { valid: false, error: 'ID Number is invalid (checksum failed).' };
    const genderDigits = parseInt(cleaned.substring(6, 10), 10);
    const gender: 'Male' | 'Female' = genderDigits >= 5000 ? 'Male' : 'Female';
    const dob = `${fullYear}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}T00:00:00`;
    return { valid: true, dob, gender };
  }

  onOccIdNumberChange(value: string): void {
    const cleaned = (value || '').replace(/\D/g, '').substring(0, 13);
    this.occForm.update(f => ({ ...f, idNumber: cleaned }));
    if (!cleaned) {
      this.occIdNumberError.set(null);
      return;
    }
    if (cleaned.length < 13) {
      this.occIdNumberError.set(null);
      return;
    }
    const result = this.validateSaIdNumber(cleaned);
    if (!result.valid) {
      this.occIdNumberError.set(result.error || 'Invalid ID Number.');
      return;
    }
    this.occIdNumberError.set(null);
    this.occForm.update(f => ({ ...f, dateOfBirth: result.dob || f.dateOfBirth, gender: result.gender || f.gender }));
  }

  async saveOccupier(): Promise<void> {
    if (this.savingOccupier()) return;
    const appId = this.savedApplication()?.applicationId;
    if (!appId) return;

    const idCheck = this.validateSaIdNumber(this.occForm().idNumber);
    if (!idCheck.valid) {
      this.occIdNumberError.set(idCheck.error || 'Invalid ID Number.');
      this.error.set(idCheck.error || 'Invalid ID Number.');
      return;
    }
    this.occIdNumberError.set(null);

    this.savingOccupier.set(true);
    this.error.set(null);

    const form = this.occForm();
    const editing = this.editingOccupier();
    const payload: SaveOccupierRequest = {
      occupierId: editing?.occupierId ?? null,
      applicationId: appId,
      fullName: form.fullName || editing?.fullName || '',
      idNumber: form.idNumber || editing?.idNumber || null,
      passportNumber: form.passportNumber || editing?.passportNumber || null,
      employerId: form.employerId || editing?.employerId || 0,
      incomeSourceId: form.incomeSourceId || editing?.incomeSourceId || 0,
      incomeAmount: form.incomeAmount !== undefined && form.incomeAmount !== null
        ? form.incomeAmount
        : (editing?.incomeAmount ?? 0),
      dwellingUnitNo: this.isDwellingUnitsEnabled()
        ? (form.dwellingUnitNo || editing?.dwellingUnitNo || 1)
        : undefined,
      occupierTypeId: form.occupierTypeId || editing?.occupierTypeId || undefined,
      contactNumber: form.contactNumber || editing?.contactNumber || null,
      relationship: form.relationship || editing?.relationship || null,
      dateOfBirth: form.dateOfBirth || editing?.dateOfBirth || null,
      gender: form.gender || editing?.gender || null,
      remarks: form.remarks || editing?.remarks || null,
      capturerID: this.userId,
      dateCaptured: editing ? (editing as any).dateCaptured || this.todayIso() : this.todayIso(),
      modifierID: this.userId,
      dateModified: this.todayIso(),
    };

    try {
      const result = await firstValueFrom(this.indigentService.saveOccupier(payload));
      this.showOccupierDialog.set(false);
      this.successMessage.set(`Occupier ${editing ? 'updated' : 'added'} successfully`);
      const refreshed = await this.refreshOccupiersFromPlatinum(appId);
      if (!refreshed) {
        const empName = this.employers().find(e => e.employerId === form.employerId)?.employerName || '';
        const srcName = this.incomeSources().find(s => s.incomeSourceId === form.incomeSourceId)?.incomeSourceName || '';
        const occTypeName = form.occupierTypeId ? (this.occupierTypeOptions.find(t => t.id === form.occupierTypeId)?.name || '') : '';
        const merged: Occupier = {
          occupierId: result.occupierId ?? editing?.occupierId ?? 0,
          applicationId: result.applicationId ?? result.atTPAppId ?? appId,
          fullName: result.fullName || form.fullName,
          idNumber: result.idNumber ?? (form.idNumber || null),
          passportNumber: result.passportNumber ?? (form.passportNumber || null),
          employerId: result.employerId ?? result.atTPEmployerId ?? form.employerId,
          employerName: result.employerName || empName,
          incomeSourceId: result.incomeSourceId ?? result.atTPIncomeSourceId ?? form.incomeSourceId,
          incomeSourceName: result.incomeSourceName || srcName,
          incomeAmount: result.incomeAmount ?? form.incomeAmount,
          dwellingUnitNo: result.dwellingUnitNo ?? form.dwellingUnitNo,
          contactNumber: result.contactNumber || form.contactNumber || '',
          remarks: result.remarks || form.remarks || '',
          relationship: result.relationship || form.relationship || '',
          dateOfBirth: result.dateOfBirth || form.dateOfBirth || '',
          gender: result.gender || form.gender || '',
          occupierTypeId: result.occupierTypeId ?? form.occupierTypeId ?? 0,
          occupierTypeName: result.occupierTypeName || occTypeName,
        };
        if (editing) {
          this.occupiers.set(this.occupiers().map(o => o.occupierId === editing.occupierId ? merged : o));
        } else {
          this.occupiers.set([...this.occupiers(), merged]);
        }
      }
      this.revalidateSubsidyPercentage();
    } catch (err: unknown) {
      const e = err as { error?: { message?: string }; message?: string };
      this.error.set('Failed to save occupier: ' + (e?.error?.message || e?.message || 'Unknown error'));
    } finally {
      this.savingOccupier.set(false);
    }
  }

  requestDeleteOccupier(occ: Occupier): void {
    this.pendingDeleteOccupier.set(occ);
    this.showDeleteOccupierConfirm.set(true);
  }

  cancelDeleteOccupier(): void {
    this.showDeleteOccupierConfirm.set(false);
    this.pendingDeleteOccupier.set(null);
  }

  async confirmDeleteOccupier(): Promise<void> {
    const occ = this.pendingDeleteOccupier();
    if (!occ) return;
    this.showDeleteOccupierConfirm.set(false);
    this.pendingDeleteOccupier.set(null);
    const appId = this.savedApplication()?.applicationId;
    this.error.set(null);
    try {
      const result = await firstValueFrom(this.indigentService.deleteOccupier(occ.occupierId, appId));
      if (result && (result as any).isSuccess === false) {
        this.error.set((result as any).message || 'Failed to remove occupier.');
        return;
      }
      this.successMessage.set('Occupier removed successfully.');
      if (appId) {
        await this.refreshOccupiersFromPlatinum(appId);
      } else {
        this.occupiers.set(this.occupiers().filter(o => o.occupierId !== occ.occupierId));
      }
      this.revalidateSubsidyPercentage();
    } catch {
      this.error.set('Failed to remove occupier.');
    }
  }

  private async refreshOccupiersFromPlatinum(appId: number): Promise<boolean> {
    try {
      const detail = await firstValueFrom(this.indigentService.getApplicationDetail(appId));
      if (detail?.occupiers) {
        this.occupiers.set(detail.occupiers);
        if (detail.application) {
          this.householdIncome.set(detail.application.householdIncome);
        }
        return true;
      }
      return false;
    } catch {
      console.error('[refreshOccupiers] Could not re-fetch occupiers from Platinum API');
      return false;
    }
  }

  async saveTenant(): Promise<void> {
    if (this.savingTenant()) return;
    const appId = this.savedApplication()?.applicationId;
    if (!appId) return;

    this.savingTenant.set(true);
    this.error.set(null);

    const form = this.tenantForm();
    const existing = this.tenantDetail();
    const payload: SaveTenantRequest = {
      tenantId: existing?.tenantId ?? null,
      applicationId: appId,
      fullName: form.fullName || null,
      idNumber: form.idNumber || null,
      passportNumber: form.passportNumber || null,
      physicalAddress: form.physicalAddress || null,
      postalAddress: form.postalAddress || null,
      cellPhone: form.cellPhone || null,
      email: form.email || null,
      isTenant: true,
      capturerID: this.userId,
      dateCaptured: this.todayIso(),
      modifierID: this.userId,
      dateModified: this.todayIso(),
    };

    try {
      const result = await firstValueFrom(this.indigentService.saveTenant(payload));
      this.tenantDetail.set({
        tenantId: result.tenantId,
        applicationId: result.applicationId,
        fullName: result.fullName,
        idNumber: result.idNumber,
        passportNumber: result.passportNumber,
        physicalAddress: result.physicalAddress,
        postalAddress: result.postalAddress,
        cellPhone: result.cellPhone,
        email: result.email,
        isTenant: result.isTenant,
      });
      this.successMessage.set('Tenant information saved');
      this.currentView.set('summary'); this.generateApplicationQR();
    } catch (err: unknown) {
      const e = err as { error?: { message?: string }; message?: string };
      this.error.set('Failed to save tenant info: ' + (e?.error?.message || e?.message || 'Unknown error'));
    } finally {
      this.savingTenant.set(false);
    }
  }

  goToStep(step: AppView): void {
    if (this.readOnly()) return;
    if (this.canNavigateTo()[step]) {
      if (step === 'summary') { this.revalidateSubsidyPercentage(); this.generateApplicationQR(); }
      if (step === 'documents') this.loadSavedDocsForCurrentApp();
      this.currentView.set(step);
      this.error.set(null);
      this.successMessage.set(null);
    }
  }

  private getMunicipalityInfo(): { name: string; tagline: string; address: string; phone: string; email: string; web: string; regNo: string; logoUrl: string; municipalCode: string } {
    const site = this.auth.site();
    const isSite02 = site?.id === 'site02';
    if (isSite02) {
      return {
        name: 'Inzalo EMS — Site 02',
        tagline: 'Municipal Revenue & Indigent Management',
        address: 'Inzalo EMS Test Environment',
        phone: '—',
        email: 'support@inzaloems.co.za',
        web: 'www.inzaloems.co.za',
        regNo: 'SITE02',
        logoUrl: site?.logo || '',
        municipalCode: 'SITE02',
      };
    }
    return {
      name: 'George Municipality',
      tagline: 'Together Building a Better George',
      address: '71 York Street, George, 6529 · PO Box 19, George, 6530',
      phone: '044 801 9111',
      email: 'george@george.gov.za',
      web: 'www.george.gov.za',
      regNo: 'WC044',
      logoUrl: site?.logo || '',
      municipalCode: 'WC044',
    };
  }

  async downloadSummaryPdf(): Promise<void> {
    const app = this.savedApplication();
    const acct = this.selectedAccount();
    const occs = this.occupiers();
    const appId = app?.applicationId || 0;
    const accountName = acct?.fullName || 'Applicant';
    const muni = this.getMunicipalityInfo();
    const user = this.auth.user();
    const finYear = user?.finYear || '';
    const indigentType = this.indigentTypes().find(t => t.indigentTypeId === app?.indigentTypeId) as any;
    const reportCfg = indigentType?.reportConfig || {};
    const headerLine: string = (reportCfg.reportHeaderText || '').toString().trim();

    let savedSigs: ATTPSignature[] = [];
    if (appId) {
      try { savedSigs = await firstValueFrom(this.indigentService.getSignatures(appId)); } catch { savedSigs = []; }
    }

    const printWindow = window.open('', '_blank', 'width=1100,height=900');
    if (!printWindow) return;

    const fmtDate = (d: string | undefined | null) => {
      if (!d) return '—';
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return '—';
      return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
    };
    const fmtDateTime = (d: string | undefined | null) => {
      if (!d) return '—';
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return '—';
      return `${fmtDate(d)} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
    };
    const fmtCurr = (v: number | undefined | null) => v != null ? `R ${Number(v).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'R 0.00';
    const esc = (s: any) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

    const totalOccIncome = this.getTotalOccupierIncome();
    const householdSize = occs.length + 1;
    const perCapita = (app?.householdIncome || 0) / householdSize;
    const subsidyPct = this.qualifiedSubsidyPercentage();

    const statusName = app?.appStatusName || 'Pending';
    const statusColor = (() => {
      const s = (app?.appStatusId || 0);
      if (s === 140) return { bg: '#dcfce7', fg: '#166534', border: '#16a34a' };
      if (s === 137 || s === 139) return { bg: '#fef9c3', fg: '#854d0e', border: '#ca8a04' };
      if (s >= 141 && s <= 145) return { bg: '#fee2e2', fg: '#991b1b', border: '#dc2626' };
      return { bg: '#dbeafe', fg: '#1e40af', border: '#2563eb' };
    })();

    const smartChecks = this.smartCheckResults();
    const passedChecks = smartChecks.filter(c => c.passed === true).length;
    const failedChecks = smartChecks.filter(c => c.passed === false).length;

    const qrSrc = this.qrCodeDataUrl();

    const consentText: string = (reportCfg.signatureConsentText ||
      `I, the undersigned, declare that the information provided in this indigent support application is true and correct to the best of my knowledge. I understand that providing false information may result in the cancellation of my indigent benefits and may lead to legal action. I authorise ${muni.name} to verify the information supplied and to share it with relevant departments for the purposes of administering this application.`).toString();

    const requireApplicantSig = reportCfg.requireApplicantSignature === true;

    const sigByRole = (role: string) => savedSigs.find(s => (s.signerRole || '').toLowerCase().includes(role.toLowerCase()));
    const renderSigBox = (role: string, fallbackName: string, sig?: ATTPSignature) => {
      const hasImg = sig?.signatureData && /^data:image|^iVBOR|^\/9j\//.test(sig.signatureData);
      const imgSrc = hasImg ? (sig!.signatureData.startsWith('data:') ? sig!.signatureData : `data:image/png;base64,${sig!.signatureData}`) : '';
      return `
        <div class="sig-box">
          <div class="sig-role">${esc(role)}</div>
          <div class="sig-pad">
            ${imgSrc ? `<img src="${imgSrc}" class="sig-img" alt="signature" />` : `<div class="sig-empty">[ Awaiting signature ]</div>`}
          </div>
          <div class="sig-line"></div>
          <div class="sig-meta">
            <div class="sig-name">${esc(sig?.signerName || fallbackName)}</div>
            <div class="sig-date">Date: ${sig?.signedDate ? fmtDate(sig.signedDate) : '_______________'}</div>
          </div>
        </div>`;
    };

    const sigBoxes: string[] = [];
    sigBoxes.push(renderSigBox('Applicant', accountName, sigByRole('applicant') || sigByRole('holder') || sigByRole('client')));
    sigBoxes.push(renderSigBox('Capturer / Cashier', user ? `${user.firstName} ${user.lastName}` : '—', sigByRole('capturer') || sigByRole('cashier') || sigByRole('officer')));
    sigBoxes.push(renderSigBox('Authorising Official', '—', sigByRole('authoris') || sigByRole('supervisor') || sigByRole('manager')));

    const styles = `
      * { margin:0; padding:0; box-sizing:border-box; }
      @page { size: A4 portrait; margin: 14mm 12mm; }
      body { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color:#0f172a; font-size: 11px; line-height:1.4; background:#fff; }
      .doc-header { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; padding-bottom:14px; border-bottom:3px solid #0f2b46; margin-bottom:14px; }
      .doc-header .brand { display:flex; gap:14px; align-items:flex-start; flex:1; }
      .doc-header .crest { width:64px; height:64px; border-radius:8px; background:linear-gradient(135deg,#0f2b46,#1e4976); color:#c9a84c; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:800; letter-spacing:1px; flex-shrink:0; box-shadow:0 2px 6px rgba(15,43,70,0.18); overflow:hidden; }
      .doc-header .crest img { width:100%; height:100%; object-fit:contain; background:#fff; }
      .doc-header .muni-name { font-size:18px; font-weight:800; color:#0f2b46; line-height:1.1; }
      .doc-header .muni-tag { font-size:10px; color:#64748b; font-style:italic; margin-top:2px; }
      .doc-header .muni-meta { font-size:9.5px; color:#475569; margin-top:6px; line-height:1.5; }
      .doc-header .muni-meta strong { color:#0f2b46; }
      .doc-header .right { text-align:right; min-width:170px; }
      .doc-title { font-size:14px; font-weight:700; color:#0f2b46; text-transform:uppercase; letter-spacing:0.6px; }
      .doc-sub { font-size:10px; color:#64748b; margin-top:2px; }
      .doc-meta { font-size:10px; color:#475569; margin-top:6px; line-height:1.5; }
      .doc-meta strong { color:#0f2b46; font-weight:700; }
      .qr-block { display:inline-block; text-align:center; margin-top:6px; }
      .qr-block img { width:78px; height:78px; border:1px solid #e2e8f0; padding:3px; background:#fff; display:block; }
      .qr-block .qr-cap { font-size:7.5px; color:#94a3b8; margin-top:2px; letter-spacing:0.4px; }
      .header-banner { background:linear-gradient(90deg,#0f2b46,#1e4976); color:#fff; padding:6px 12px; font-size:10.5px; letter-spacing:0.5px; border-radius:4px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; }
      .header-banner .pill { background:rgba(255,255,255,0.18); padding:2px 8px; border-radius:10px; font-weight:600; font-size:9.5px; }
      .status-banner { padding:8px 14px; border-radius:6px; border:1.5px solid; display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
      .status-banner .label { font-size:9.5px; text-transform:uppercase; letter-spacing:0.8px; opacity:0.85; font-weight:600; }
      .status-banner .value { font-size:14px; font-weight:800; }
      .info-grid { display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; margin-bottom:14px; }
      .info-card { border:1px solid #e2e8f0; border-radius:6px; overflow:hidden; }
      .info-card .head { background:#0f2b46; color:#fff; font-size:10px; font-weight:700; padding:6px 10px; letter-spacing:0.4px; text-transform:uppercase; display:flex; align-items:center; gap:6px; }
      .info-card .head .icon { width:14px; height:14px; background:#c9a84c; border-radius:50%; display:inline-block; flex-shrink:0; }
      .info-card .body { padding:8px 10px; }
      .row { display:flex; justify-content:space-between; gap:8px; padding:3px 0; border-bottom:1px dashed #f1f5f9; font-size:10.5px; }
      .row:last-child { border-bottom:none; }
      .row .lbl { color:#64748b; flex-shrink:0; }
      .row .val { font-weight:600; text-align:right; color:#0f172a; word-break:break-word; }
      .metric-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:14px; }
      .metric { border:1px solid #e2e8f0; border-radius:6px; padding:10px 12px; background:#f8fafc; }
      .metric .m-label { font-size:9px; text-transform:uppercase; letter-spacing:0.6px; color:#64748b; font-weight:600; }
      .metric .m-value { font-size:16px; font-weight:800; color:#0f2b46; margin-top:4px; }
      .metric .m-sub { font-size:9px; color:#94a3b8; margin-top:2px; }
      .metric.gold { background:linear-gradient(135deg,#fef3c7,#fde68a); border-color:#c9a84c; }
      .metric.gold .m-value { color:#854d0e; }
      .section { margin-bottom:14px; border:1px solid #e2e8f0; border-radius:6px; overflow:hidden; }
      .section .s-head { background:#f1f5f9; padding:6px 12px; font-size:10.5px; font-weight:700; color:#0f2b46; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid #e2e8f0; }
      .section .s-body { padding:10px 12px; }
      .occ-table { width:100%; border-collapse:collapse; font-size:10px; }
      .occ-table th { background:#0f2b46; color:#fff; padding:6px 8px; text-align:left; font-weight:600; font-size:9.5px; text-transform:uppercase; letter-spacing:0.4px; }
      .occ-table td { padding:5px 8px; border-bottom:1px solid #e2e8f0; }
      .occ-table tbody tr:nth-child(even) td { background:#f8fafc; }
      .occ-table tfoot td { background:#fef3c7; font-weight:700; color:#854d0e; padding:7px 8px; border-top:2px solid #c9a84c; }
      .checks-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
      .check-row { display:flex; align-items:center; gap:8px; padding:5px 8px; border:1px solid #e2e8f0; border-radius:4px; font-size:10px; background:#fff; }
      .check-row .c-icon { width:18px; height:18px; border-radius:50%; flex-shrink:0; display:inline-flex; align-items:center; justify-content:center; font-weight:700; font-size:11px; color:#fff; }
      .check-row.pass .c-icon { background:#16a34a; }
      .check-row.fail .c-icon { background:#dc2626; }
      .check-row.skip .c-icon { background:#94a3b8; }
      .check-row .c-label { flex:1; font-weight:600; color:#0f172a; }
      .check-row .c-detail { color:#64748b; font-size:9.5px; }
      .declaration { background:#fffbeb; border:1px solid #fde68a; border-left:4px solid #c9a84c; padding:10px 12px; margin-bottom:14px; border-radius:4px; }
      .declaration .d-title { font-size:10px; font-weight:700; color:#854d0e; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px; }
      .declaration .d-text { font-size:9.5px; color:#451a03; line-height:1.55; }
      .sig-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
      .sig-box { border:1px solid #cbd5e1; border-radius:6px; padding:10px; background:#fff; display:flex; flex-direction:column; min-height:130px; }
      .sig-role { font-size:9.5px; font-weight:700; color:#0f2b46; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; }
      .sig-pad { flex:1; display:flex; align-items:center; justify-content:center; min-height:60px; background:#f8fafc; border-radius:4px; padding:4px; }
      .sig-img { max-height:55px; max-width:100%; object-fit:contain; }
      .sig-empty { color:#cbd5e1; font-size:10px; font-style:italic; }
      .sig-line { border-top:1.5px solid #0f172a; margin-top:8px; }
      .sig-meta { margin-top:4px; }
      .sig-name { font-size:10px; font-weight:600; color:#0f172a; }
      .sig-date { font-size:9px; color:#64748b; margin-top:1px; }
      .doc-footer { margin-top:18px; padding-top:10px; border-top:1px solid #e2e8f0; font-size:8.5px; color:#94a3b8; display:flex; justify-content:space-between; gap:12px; }
      .doc-footer strong { color:#475569; }
      .empty-note { font-size:10px; color:#94a3b8; font-style:italic; padding:6px 0; }
      @media print {
        .no-print { display:none !important; }
        body { background:#fff; }
      }
    `;

    const indigentTypeName = app?.indigentTypeName || indigentType?.indigentTypeName || '—';

    let html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" />
      <title>Indigent Application #${appId} — ${esc(accountName)}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>${styles}</style></head><body>`;

    html += `
      <div class="doc-header">
        <div class="brand">
          <div class="crest">${muni.logoUrl ? `<img src="${esc(muni.logoUrl)}" alt="${esc(muni.name)}" />` : esc(muni.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase())}</div>
          <div>
            <div class="muni-name">${esc(muni.name)}</div>
            <div class="muni-tag">${esc(muni.tagline)}</div>
            <div class="muni-meta">
              <strong>${esc(muni.address)}</strong><br />
              Tel: ${esc(muni.phone)} &middot; Email: ${esc(muni.email)} &middot; Web: ${esc(muni.web)}<br />
              Municipal Code: <strong>${esc(muni.regNo)}</strong>${finYear ? ` &middot; Financial Year: <strong>${esc(finYear)}</strong>` : ''}
            </div>
          </div>
        </div>
        <div class="right">
          <div class="doc-title">Indigent Application Summary</div>
          <div class="doc-sub">Confidential — Official Use Only</div>
          <div class="doc-meta">
            App ID: <strong>#${appId}</strong><br />
            Printed: <strong>${fmtDate(new Date().toISOString())}</strong><br />
            Account: <strong>${esc(acct?.accountNo || '—')}</strong>
          </div>
          ${qrSrc ? `<div class="qr-block"><img src="${qrSrc}" alt="QR" /><div class="qr-cap">SCAN TO OPEN</div></div>` : ''}
        </div>
      </div>`;

    if (headerLine) {
      html += `<div class="header-banner"><span>${esc(headerLine)}</span><span class="pill">${esc(indigentTypeName)}</span></div>`;
    }

    html += `
      <div class="status-banner" style="background:${statusColor.bg};border-color:${statusColor.border};color:${statusColor.fg};">
        <div>
          <div class="label">Application Status</div>
          <div class="value">${esc(statusName)}</div>
        </div>
        <div style="text-align:right;">
          <div class="label">Indigent Type</div>
          <div class="value" style="font-size:13px;">${esc(indigentTypeName)}</div>
        </div>
      </div>`;

    html += `
      <div class="info-grid">
        <div class="info-card">
          <div class="head"><span class="icon"></span>Account Holder</div>
          <div class="body">
            <div class="row"><span class="lbl">Account No</span><span class="val">${esc(acct?.accountNo || '—')}</span></div>
            <div class="row"><span class="lbl">Full Name</span><span class="val">${esc(acct?.fullName || '—')}</span></div>
            <div class="row"><span class="lbl">ID Number</span><span class="val">${esc(acct?.idNo || '—')}</span></div>
            <div class="row"><span class="lbl">Cell</span><span class="val">${esc(acct?.cellNo || '—')}</span></div>
            <div class="row"><span class="lbl">Email</span><span class="val">${esc(acct?.email || '—')}</span></div>
            ${acct?.sgNumber ? `<div class="row"><span class="lbl">Social Grant No</span><span class="val">${esc(acct.sgNumber)}</span></div>` : ''}
          </div>
        </div>
        <div class="info-card">
          <div class="head"><span class="icon"></span>Property &amp; Address</div>
          <div class="body">
            <div class="row"><span class="lbl">Physical</span><span class="val">${esc(acct?.physicalAddress || '—')}</span></div>
            <div class="row"><span class="lbl">Postal</span><span class="val">${esc(acct?.postalAddress || acct?.physicalAddress || '—')}</span></div>
            <div class="row"><span class="lbl">Property ID</span><span class="val">${esc(acct?.propertyId || '—')}</span></div>
            <div class="row"><span class="lbl">Account Status</span><span class="val">${esc(acct?.accountStatus || '—')}</span></div>
            <div class="row"><span class="lbl">Current Balance</span><span class="val">${fmtCurr(acct?.balance)}</span></div>
          </div>
        </div>
        <div class="info-card">
          <div class="head"><span class="icon"></span>Application Details</div>
          <div class="body">
            <div class="row"><span class="lbl">Application ID</span><span class="val">#${appId}</span></div>
            <div class="row"><span class="lbl">Status</span><span class="val">${esc(statusName)}</span></div>
            <div class="row"><span class="lbl">Indigent Type</span><span class="val">${esc(indigentTypeName)}</span></div>
            <div class="row"><span class="lbl">Applied</span><span class="val">${fmtDate(app?.applicationDate)}</span></div>
            <div class="row"><span class="lbl">Reapply By</span><span class="val">${fmtDate(app?.reApplicationDate)}</span></div>
            <div class="row"><span class="lbl">Do-Not-Cut</span><span class="val">${fmtDate(app?.doNotCutDate)}</span></div>
            <div class="row"><span class="lbl">Captured By</span><span class="val">${esc(user ? `${user.firstName} ${user.lastName}` : '—')}</span></div>
          </div>
        </div>
      </div>`;

    html += `
      <div class="metric-grid">
        <div class="metric">
          <div class="m-label">Household Income</div>
          <div class="m-value">${fmtCurr(app?.householdIncome)}</div>
          <div class="m-sub">per month</div>
        </div>
        <div class="metric gold">
          <div class="m-label">Monthly Subsidy</div>
          <div class="m-value">${fmtCurr(app?.monthlySubsidy)}</div>
          <div class="m-sub">${subsidyPct != null ? `at ${subsidyPct}% qualification` : 'awarded'}</div>
        </div>
        <div class="metric">
          <div class="m-label">Qualifying Units</div>
          <div class="m-value">${app?.qualifyingUnits ?? '—'}</div>
          <div class="m-sub">unit(s)</div>
        </div>
        <div class="metric">
          <div class="m-label">Once-Off Write-Off</div>
          <div class="m-value">${fmtCurr(app?.onceWriteOff)}</div>
          <div class="m-sub">at activation</div>
        </div>
      </div>`;

    if (occs.length > 0) {
      const occRows = occs.map(o => `
        <tr>
          <td>${esc(o.fullName)}</td>
          <td>${esc(o.idNumber || '—')}</td>
          <td>${esc((o as any).relationship || '—')}</td>
          <td>${esc((o as any).gender || '—')}</td>
          <td>${esc(o.contactNumber || '—')}</td>
          <td>${esc(o.employerName || '—')}</td>
          <td>${esc(o.incomeSourceName || '—')}</td>
          <td style="text-align:right;">${fmtCurr(o.incomeAmount)}</td>
        </tr>`).join('');
      html += `
        <div class="section">
          <div class="s-head">Household Occupiers (${occs.length}) — Per-Capita Income: ${fmtCurr(perCapita)}</div>
          <div class="s-body" style="padding:0;">
            <table class="occ-table">
              <thead><tr>
                <th>Name</th><th>ID Number</th><th>Relationship</th><th>Gender</th>
                <th>Contact</th><th>Employer</th><th>Income Source</th><th style="text-align:right;">Income</th>
              </tr></thead>
              <tbody>${occRows}</tbody>
              <tfoot>
                <tr>
                  <td colspan="7" style="text-align:right;">Total Occupier Income</td>
                  <td style="text-align:right;">${fmtCurr(totalOccIncome)}</td>
                </tr>
                <tr>
                  <td colspan="7" style="text-align:right;">Recorded Household Income (incl. applicant)</td>
                  <td style="text-align:right;">${fmtCurr(app?.householdIncome)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>`;
    } else {
      html += `<div class="section"><div class="s-head">Household Occupiers</div><div class="s-body"><div class="empty-note">No occupiers captured.</div></div></div>`;
    }

    if (smartChecks.length > 0) {
      const checkRows = smartChecks.map(c => {
        const cls = c.passed === true ? 'pass' : c.passed === false ? 'fail' : 'skip';
        const icon = c.passed === true ? '✓' : c.passed === false ? '✕' : '–';
        return `<div class="check-row ${cls}">
          <span class="c-icon">${icon}</span>
          <div style="flex:1;">
            <div class="c-label">${esc(c.testName)}</div>
            ${c.detail ? `<div class="c-detail">${esc(c.detail)}</div>` : ''}
          </div>
        </div>`;
      }).join('');
      html += `
        <div class="section">
          <div class="s-head">Qualification Validation — ${passedChecks} passed · ${failedChecks} failed · ${smartChecks.length} total</div>
          <div class="s-body"><div class="checks-grid">${checkRows}</div></div>
        </div>`;
    }

    html += `
      <div class="declaration">
        <div class="d-title">Declaration &amp; Consent</div>
        <div class="d-text">${esc(consentText)}</div>
      </div>`;

    html += `
      <div class="section">
        <div class="s-head">Signatures${requireApplicantSig ? ' — Applicant signature required by policy' : ''}</div>
        <div class="s-body">
          <div class="sig-grid">${sigBoxes.join('')}</div>
        </div>
      </div>`;

    html += `
      <div class="doc-footer">
        <div>
          <strong>${esc(muni.name)}</strong> — Indigent Support Programme<br />
          Generated by <strong>${esc(user ? user.userName : 'system')}</strong> on ${fmtDateTime(new Date().toISOString())}
        </div>
        <div style="text-align:right;">
          Document Ref: <strong>IND-${appId}-${new Date().getTime().toString(36).toUpperCase()}</strong><br />
          Confidential — protect under POPIA &amp; Section 14 of the Constitution
        </div>
      </div>`;

    html += `</body></html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => { try { printWindow.print(); } catch {} }, 600);
  }

  startNewApplication(): void {
    this.selectedAccount.set(null);
    this.qualificationCheck.set(null);
    this.smartCheckResults.set([]);
    this.qualifiedSubsidyPercentage.set(null);
    this.smartCheckDone.set(false);
    this.smartQualData.set(null);
    this.manualOverrides.set({});
    this.savedApplication.set(null);
    this.existingApplications.set([]);
    this.existingAppDetail.set(null);
    this.viewingExisting.set(false);
    this.readOnly.set(false);
    this.occupiers.set([]);
    this.tenantDetail.set(null);
    this.householdIncome.set(0);
    this.remarks.set('');
    this.isTenantApplication.set(false);
    this.applicationDate.set(this.todayIso());
    this.commencementDate.set(this.todayIso());
    this.reApplicationDate.set(this.defaultReApplicationDate());
    this.terminationDate.set(this.defaultTerminationDate());
    this.altContactPhone.set('');
    this.altContactEmail.set('');
    this.declarationConfirmed.set(false);
    this.signatureCount.set(0);
    this.successMessage.set(null);
    this.error.set(null);
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.searchPerformed.set(false);
    this.uploadedDocs.set({});
    this.requiredDocUploads.set({});
    this.currentView.set('search');
  }

  goToOccupiers(): void {
    this.currentView.set('occupiers');
    this.error.set(null);
    this.successMessage.set(null);
  }

  skipToSummary(): void {
    this.revalidateSubsidyPercentage();
    this.currentView.set('summary'); this.generateApplicationQR();
    this.error.set(null);
    this.successMessage.set(null);
  }

  goToTenant(): void {
    const existing = this.tenantDetail();
    if (existing) {
      this.tenantForm.set({
        fullName: existing.fullName || '',
        idNumber: existing.idNumber || '',
        passportNumber: existing.passportNumber || '',
        physicalAddress: existing.physicalAddress || '',
        postalAddress: existing.postalAddress || '',
        cellPhone: existing.cellPhone || '',
        email: existing.email || '',
      });
    }
    this.currentView.set('tenant');
    this.error.set(null);
    this.successMessage.set(null);
  }

  formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  formatCurrency(value: number | null | undefined): string {
    if (value == null) return 'R 0.00';
    return 'R ' + value.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  revalidateSubsidyPercentage(): void {
    const typeId = this.selectedIndigentTypeId();
    if (!typeId) return;
    const configType = this.indigentTypes().find(t => t.indigentTypeId === typeId) as any;
    if (!configType) return;

    const hasOccupiers = this.occupiers().length > 0;
    const captured = this.capturedIncome();
    const validatableOccupier = hasOccupiers ? this.getValidatableIncome() : 0;

    const income = captured + validatableOccupier;

    this.householdIncome.set(income);

    const slidingEnabled = configType.enableIncomeSlidingScale && Array.isArray(configType.incomeSlidingScale) && configType.incomeSlidingScale.length > 0;

    if (income <= 0) {
      return;
    }

    if (slidingEnabled) {
      const brackets = [...configType.incomeSlidingScale].sort((a: any, b: any) => a.maxIncome - b.maxIncome);
      const matched = brackets.find((b: any) => income <= b.maxIncome);
      this.qualifiedSubsidyPercentage.set(matched ? matched.subsidyPercent : 0);
    } else {
      const limit = configType.incomeLimit || 0;
      this.qualifiedSubsidyPercentage.set(limit > 0 && income <= limit ? 100 : 0);
    }
  }

  getTotalOccupierIncome(): number {
    return this.occupiers().reduce((sum, o) => sum + (o.incomeAmount || 0), 0);
  }

  isDwellingUnitsEnabled(): boolean {
    const typeId = this.selectedIndigentTypeId();
    if (!typeId) return false;
    const t = this.indigentTypes().find(t => t.indigentTypeId === typeId);
    return !!t?.enableDwellingUnits;
  }

  isExcludeAdditionalDwellingIncome(): boolean {
    const typeId = this.selectedIndigentTypeId();
    if (!typeId) return false;
    const t = this.indigentTypes().find(t => t.indigentTypeId === typeId);
    return !!t?.enableDwellingUnits && t?.excludeAdditionalDwellingIncome === true;
  }

  getValidatableIncome(): number {
    const excludedIds = new Set(
      this.incomeSources().filter(s => s.excludeFromValidation).map(s => s.incomeSourceId)
    );
    const excludeDwelling = this.isExcludeAdditionalDwellingIncome();
    const occConfigs = this.occupierTypeConfigs();
    const excludedOccTypeIds = new Set(
      occConfigs.filter(c => !c.includeInHouseholdIncome).map(c => c.occupierTypeId)
    );
    return this.occupiers().reduce((sum, o) => {
      if (o.incomeSourceId && excludedIds.has(o.incomeSourceId)) return sum;
      if (excludeDwelling && (Number(o.dwellingUnitNo) || 1) > 1) return sum;
      if (o.occupierTypeId && excludedOccTypeIds.has(o.occupierTypeId)) return sum;
      return sum + (o.incomeAmount || 0);
    }, 0);
  }

  getExcludedIncomeSourceNames(): string[] {
    const excludedIds = new Set(
      this.incomeSources().filter(s => s.excludeFromValidation).map(s => s.incomeSourceId)
    );
    return this.occupiers()
      .filter(o => o.incomeSourceId && excludedIds.has(o.incomeSourceId) && (o.incomeAmount || 0) > 0)
      .map(o => o.incomeSourceName || 'Unknown');
  }

  getOccupierTypeExcludedNames(): string[] {
    const occConfigs = this.occupierTypeConfigs();
    const excludedOccTypeIds = new Set(
      occConfigs.filter(c => !c.includeInHouseholdIncome).map(c => c.occupierTypeId)
    );
    if (excludedOccTypeIds.size === 0) return [];
    return this.occupiers()
      .filter(o => o.occupierTypeId && excludedOccTypeIds.has(o.occupierTypeId) && (o.incomeAmount || 0) > 0)
      .map(o => o.occupierTypeName || occConfigs.find(c => c.occupierTypeId === o.occupierTypeId)?.name || 'Unknown');
  }

  getDwellingExcludedOccupiers(): Occupier[] {
    if (!this.isExcludeAdditionalDwellingIncome()) return [];
    return this.occupiers().filter(o => (Number(o.dwellingUnitNo) || 1) > 1 && (o.incomeAmount || 0) > 0);
  }

  getDwellingExcludedTotal(): number {
    return this.getDwellingExcludedOccupiers().reduce((sum, o) => sum + (o.incomeAmount || 0), 0);
  }

  private todayIso(): string {
    return new Date().toISOString().split('T')[0] + 'T00:00:00';
  }

  private currentFinancialYear(): { start: string; end: string } {
    const now = new Date();
    const year = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    return {
      start: `${year}-07-01T00:00:00`,
      end: `${year + 1}-06-30T00:00:00`,
    };
  }

  private defaultReApplicationDate(): string {
    const fy = this.currentFinancialYear();
    const end = new Date(fy.end);
    end.setDate(end.getDate() + 30);
    return end.toISOString().split('T')[0] + 'T00:00:00';
  }

  private defaultTerminationDate(): string {
    return this.defaultReApplicationDate();
  }

  getAgeFromIdNumber(idNo: string): number | null {
    if (!idNo || !/^\d{13}$/.test(idNo.trim())) return null;
    const yy = parseInt(idNo.substring(0, 2), 10);
    const mm = parseInt(idNo.substring(2, 4), 10);
    const dd = parseInt(idNo.substring(4, 6), 10);
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
    const currentYear = new Date().getFullYear();
    const currentCenturyCutoff = currentYear % 100;
    const century = yy <= currentCenturyCutoff ? 2000 : 1900;
    const fullYear = century + yy;
    const birthDate = new Date(fullYear, mm - 1, dd);
    if (birthDate.getFullYear() !== fullYear || birthDate.getMonth() !== mm - 1 || birthDate.getDate() !== dd) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    return age >= 0 ? age : null;
  }

  getSeniorConfig(): { enabled: boolean; ageThreshold: number; extendedMonths: number } {
    const typeId = this.selectedIndigentTypeId();
    const selectedType = this.indigentTypes().find(t => t.indigentTypeId === typeId) as any;
    if (!selectedType?.exemptSeniorsFromRenewal) return { enabled: false, ageThreshold: 65, extendedMonths: 0 };
    return {
      enabled: true,
      ageThreshold: selectedType.seniorExemptionAge || 65,
      extendedMonths: selectedType.seniorExtendedPeriod || 0,
    };
  }

  recalcDatesForSenior(): void {
    const cfg = this.getSeniorConfig();
    const account = this.selectedAccount();
    if (!cfg.enabled || !cfg.extendedMonths || !account?.idNo) {
      this.recalcDatesForType();
      return;
    }
    const age = this.getAgeFromIdNumber(account.idNo);
    if (age !== null && age >= cfg.ageThreshold) {
      const typeId = this.selectedIndigentTypeId();
      const typeConfig = typeId ? this.indigentTypes().find(t => t.indigentTypeId === typeId) as any : null;
      let baseDate: Date;
      if (typeConfig?.reapplicationBaseDate === 'application') {
        baseDate = new Date(this.applicationDate() || this.todayIso());
      } else {
        baseDate = new Date(this.commencementDate() || this.todayIso());
      }
      baseDate.setMonth(baseDate.getMonth() + cfg.extendedMonths);
      const extended = baseDate.toISOString().split('T')[0] + 'T00:00:00';
      this.reApplicationDate.set(extended);
      this.terminationDate.set(extended);
    } else {
      this.recalcDatesForType();
    }
  }

  get applicantAge(): number | null {
    return this.getAgeFromIdNumber(this.selectedAccount()?.idNo || '');
  }

  get isSeniorExtended(): boolean {
    const cfg = this.getSeniorConfig();
    if (!cfg.enabled || !cfg.extendedMonths) return false;
    const age = this.applicantAge;
    return age !== null && age >= cfg.ageThreshold;
  }
}
