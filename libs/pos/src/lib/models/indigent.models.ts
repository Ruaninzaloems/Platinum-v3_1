export interface DashboardSummary {
  activeIndigentCount: number;
  pendingApplications: number;
  pendingVerification: number;
  pendingAuthorization: number;
  pendingTermination: number;
  expiringIn30Days: number;
  expiringIn60Days: number;
  disqualifiedThisMonth: number;
  totalSubsidyCost: number;
  totalWriteOffs: number;
  doNotCutActive: number;
  applicationsThisMonth: number;
  terminationsThisMonth: number;
  reapplicationsThisMonth: number;
  byIndigentType: IndigentTypeSummary[];
}

export interface SubsidyItemCounts {
  [key: string]: number;
}

export interface IndigentTypeSummary {
  indigentTypeId: number;
  indigentTypeName: string;
  activeCount: number;
  pendingCount: number;
  subsidyCost: number;
}

export interface IncomeBracket {
  maxIncome: number;
  subsidyPercent: number;
  category: string;
}

export interface IndigentType {
  indigentTypeId: number;
  indigentTypeName: string;
  marketValueQualification: number;
  incomeLimit: number;
  enableIncomeSlidingScale: boolean;
  incomeSlidingScale: IncomeBracket[];
  reApplicationPeriod: number;
  reapplicationBaseDate: 'application' | 'approval';
  reApplicationReminderDays: number[];
  reApplicationReminderEmail: boolean;
  reApplicationReminderSms: boolean;
  reApplicationReminderWhatsapp: boolean;
  autoTerminateOnExpiry: boolean;
  autoTerminationTrigger: 'reapply_expiry' | 'financial_year_end' | 'both';
  autoTerminateGraceDays: number;
  autoTerminateNotifyEmail: boolean;
  autoTerminateNotifySms: boolean;
  autoTerminateNotifyWhatsapp: boolean;
  applicationPeriod: number;
  isMultipleProperty: boolean;
  isStaffMember: boolean;
  isSupplierToMunicipality: boolean;
  isCompanyDirector: boolean;
  isGovernmentEmployee: boolean;
  isBusinessProperty: boolean;
  isDeceasedEstate: boolean;
  vehicleValueLimit: number;
  propertySizeLimit: number;
  minAge: number;
  maxAge: number;
  minDependants: number;
  isPensioner: boolean;
  arrearsToleranceAmount: number;
  requireDhaVerification: boolean;
  requireCreditBureauCheck: boolean;
  requireSarsIncomeCheck: boolean;
  requireBiometricVerification: boolean;
  requireSaCitizenship: boolean;
  allowRefugeeStatus: boolean;
  subsidyPercentage: number;
  incomeBandUpper: number;
  autoQualifyChildHeaded: boolean;
  autoQualifyNoInfrastructure: boolean;
  exemptSeniorsFromRenewal: boolean;
  seniorExemptionAge: number;
  seniorExtendedPeriod: number;
  enableDwellingUnits: boolean;
  excludeAdditionalDwellingIncome: boolean;
  enableSiteVerification: boolean;
  verificationRequired: boolean;
  maxVerificationAttempts: number;
  verificationSLADays: number;
  allocationMethod: 'manual' | 'round_robin' | 'load_balanced';
  enableDocumentVerification: boolean;
  requiredDocuments?: RequiredDocumentConfig[];
  referralWorkflow: ReferralWorkflowConfig;
  writeOffCycleMonths: number;
  enableWriteOffOnApproval: boolean;
  writeOffApprovalMode: 'disabled' | 'first_application' | 'per_financial_year';
  writeOffMaxFinancialYears: number | null;
  writeOffScope: 'all_debits' | 'all_services' | 'monthly_debits' | 'ageing_bracket';
  writeOffAgeingMinDays: number | null;
  writeOffAgeingMaxDays: number | null;
  enableFinancialYearEndWriteOff: boolean;
  enableContinuousWriteOff: boolean;
  continuousWriteOffIntervalMonths: number;
  writeOffDocumentTypeId: number | null;
  writeOffNotifyEmail: boolean;
  writeOffNotifySms: boolean;
  writeOffNotifyWhatsapp: boolean;
  writeOffHandoverDebt: boolean;
  terminateHandoverOnApproval: boolean;
  terminateRepaymentPlanOnApproval: boolean;
  isActive: boolean;
  enableIndigentCommunications: boolean;
  applicationSlaTargetDays: number;
  ccStakeholders: CcStakeholder[];
  communicationTemplates: CommunicationTemplate[];
  standardQualificationTests?: PolicyValidationTest[];
  municipalPolicyTests?: PolicyValidationTest[];
  reportConfig?: QualificationReportConfig;
}

export interface RequiredDocumentConfig {
  documentKey: string;
  documentLabel: string;
  description: string;
  isRequired: boolean;
  maxFileSizeMB: number;
  allowedFormats: string[];
  documentTypeId?: number;
}

export type DocumentVerificationStatus = 'pending' | 'verified' | 'rejected' | 'resubmit_required';

export interface DocumentVerificationResult {
  documentKey: string;
  documentLabel: string;
  status: DocumentVerificationStatus;
  verifiedBy: string;
  verifiedDate: string | null;
  rejectionReason: string | null;
  fileName: string | null;
  fileSize: number | null;
}

export type ReferralTarget = 'capturer' | 'contractor' | 'supervisor' | 'document_verifier' | 'steering_committee';

export const REFERRAL_TARGET_LABELS: Record<ReferralTarget, string> = {
  capturer: 'Capturer',
  contractor: 'Contractor (Site Inspection)',
  supervisor: 'Supervisor',
  document_verifier: 'Document Verifier',
  steering_committee: 'Steering Committee',
};

export const REFERRAL_TARGET_ICONS: Record<ReferralTarget, string> = {
  capturer: 'person',
  contractor: 'engineering',
  supervisor: 'admin_panel_settings',
  document_verifier: 'verified_user',
  steering_committee: 'groups',
};

export const REFERRAL_TARGET_COLORS: Record<ReferralTarget, string> = {
  capturer: '#f59e0b',
  contractor: '#3b82f6',
  supervisor: '#8b5cf6',
  document_verifier: '#22c55e',
  steering_committee: '#ef4444',
};

export interface ReferralWorkflowConfig {
  enableReferToContractor: boolean;
  enableReferToCapturer: boolean;
  enableReferToSupervisor: boolean;
  enableReferToSteeringCommittee: boolean;
  supervisorCanReferToContractor: boolean;
  supervisorCanReferToCapturer: boolean;
  supervisorCanReferToDocVerifier: boolean;
  supervisorCanReferToSteeringCommittee: boolean;
}

export interface WriteOffNotification {
  applicationId: number;
  accountNo: string;
  accountHolderName: string;
  indigentTypeId: number;
  indigentTypeName: string;
  lastWriteOffDate: string | null;
  nextWriteOffDueDate: string;
  outstandingDebt: number;
  daysPastDue: number;
  isSenior: boolean;
  seniorAge: number | null;
}

export interface WriteOffHistoryItem {
  writeOffId: number;
  applicationId: number;
  accountNo: string;
  accountHolderName: string;
  indigentTypeName: string;
  writeOffAmount: number;
  writeOffDate: string;
  writeOffType: 'approval' | 'continuous' | 'senior_periodic' | 'handover_debt';
  documentTypeUsed: string;
  processedBy: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface IndigentTypeSubRule {
  subRuleId: number;
  indigentTypeId: number;
  propertyCategoryId: number;
  propertyCategoryName: string;
  nameTypeId: number;
  nameTypeName: string;
}

export interface QualificationCheckResult {
  rule: string;
  passed: boolean;
  detail: string;
  category?: 'standard' | 'municipal';
}

export type QualificationRule = QualificationCheckResult;

export interface ExistingApplication {
  applicationId: number;
  attpStatus: string;
  applicationDate: string;
  reApplicationDate: string;
}

export interface QualificationCheck {
  accountId: number;
  indigentTypeId: number;
  qualifies: boolean;
  checks: QualificationCheckResult[];
  standardChecks?: QualificationCheckResult[];
  municipalChecks?: QualificationCheckResult[];
  existingApplication: ExistingApplication | null;
  qualificationUnavailable?: boolean;
}

export interface SmartQualificationData {
  accountTypeId: number | null;
  property: {
    marketValue: number | null;
    standSize: number | null;
    typeOfUse: string | null;
    usedAsBusiness: string | null;
    propertyCategory: string | null;
    ratesTariff: string | null;
  } | null;
  nameInfo: {
    idNumber: string | null;
    dateOfBirth: string | null;
    age: number | null;
    citizenship: string | null;
    employmentStatus: string | null;
    employer: string | null;
    deceasedStatus: string | null;
  } | null;
  linkedAccountCount: number;
  linkedAccounts: {
    accountID: number | null;
    accountNumber: string | null;
    accountTypeId: number | null;
    statusDesc: string | null;
    name: string | null;
    deliveryAddress: string | null;
  }[];
  arrearsAmount: number | null;
  activeApplications: { applicationId: number; status: string; applicationDate: string }[];
  hasActiveApplication: boolean;
}

export interface SmartCheckResult {
  testId: string;
  testName: string;
  description: string;
  passed: boolean | null;
  detail: string;
  method: 'auto' | 'manual' | 'bureau' | 'both';
  dataSource: string;
  severity: 'blocking' | 'warning';
  manualConfirmed?: boolean;
}

export interface PolicyValidationTest {
  testId: string;
  testName: string;
  description: string;
  enabled: boolean;
  category: 'standard' | 'municipal';
  severity: 'blocking' | 'warning';
  validationMode: 'manual' | 'api' | 'both';
  configValue?: number;
  configValueMax?: number;
  configUnit?: string;
}

export interface QualificationReportConfig {
  generatePdfOnQualification: boolean;
  generateRejectionLetter: boolean;
  autoEmailResult: boolean;
  autoSmsResult: boolean;
  autoWhatsappResult: boolean;
  includesBureauReport: boolean;
  allowBulkQualification: boolean;
  bulkMaxBatchSize: number;
  reportHeaderText: string;
  rejectionLetterTemplate: string;
  requireApplicantSignature: boolean;
  signatureMethods?: ('draw' | 'type')[];
  requireSignatureConsent?: boolean;
  signatureConsentText?: string;
  attachSignedDeclarationPdf?: boolean;
}

export const STANDARD_QUALIFICATION_TESTS: PolicyValidationTest[] = [
  { testId: 'income_limit', testName: 'Household Income Limit', description: 'Maximum combined household income allowed', enabled: true, category: 'standard', severity: 'blocking', validationMode: 'api', configValue: 0, configUnit: 'R' },
  { testId: 'property_value', testName: 'Property Market Value', description: 'Maximum property market value for qualification', enabled: true, category: 'standard', severity: 'blocking', validationMode: 'api', configValue: 0, configUnit: 'R' },
  { testId: 'multiple_properties', testName: 'Multiple Property Ownership', description: 'Disqualify if applicant owns more than one property', enabled: true, category: 'standard', severity: 'blocking', validationMode: 'api' },
  { testId: 'citizenship', testName: 'SA Citizenship / Residency', description: 'Require South African citizenship or recognized refugee status', enabled: true, category: 'standard', severity: 'blocking', validationMode: 'api' },
  { testId: 'age_requirement', testName: 'Age Requirement', description: 'Minimum and maximum age for applicant', enabled: true, category: 'standard', severity: 'blocking', validationMode: 'api', configValue: 0, configValueMax: 0, configUnit: 'years' },
  { testId: 'existing_application', testName: 'Existing Application Check', description: 'Check for active or pending applications on the same account', enabled: true, category: 'standard', severity: 'blocking', validationMode: 'api' },
  { testId: 'property_category', testName: 'Property Category Match', description: 'Property must match configured category and name type sub-rules', enabled: true, category: 'standard', severity: 'blocking', validationMode: 'api' },
  { testId: 'dependants', testName: 'Minimum Dependants', description: 'Minimum number of household dependants required', enabled: false, category: 'standard', severity: 'blocking', validationMode: 'manual', configValue: 0 },
  { testId: 'pensioner_status', testName: 'Pensioner Status', description: 'Restrict to pensioners only (when enabled)', enabled: false, category: 'standard', severity: 'blocking', validationMode: 'manual' },
];

export const MUNICIPAL_POLICY_TESTS: PolicyValidationTest[] = [
  { testId: 'staff_member', testName: 'Municipal Staff Member', description: 'Disqualify municipal employees from indigent registration', enabled: false, category: 'municipal', severity: 'blocking', validationMode: 'manual' },
  { testId: 'govt_employee', testName: 'Government Employee', description: 'Disqualify national/provincial government employees', enabled: false, category: 'municipal', severity: 'blocking', validationMode: 'manual' },
  { testId: 'company_director', testName: 'Company Director (CIPC)', description: 'Disqualify registered company directors via CIPC check', enabled: false, category: 'municipal', severity: 'blocking', validationMode: 'api' },
  { testId: 'municipal_supplier', testName: 'Municipal Supplier', description: 'Disqualify registered suppliers to the municipality', enabled: false, category: 'municipal', severity: 'blocking', validationMode: 'manual' },
  { testId: 'business_property', testName: 'Business-Use Property', description: 'Disqualify properties used for commercial/business purposes', enabled: false, category: 'municipal', severity: 'blocking', validationMode: 'api' },
  { testId: 'deceased_estate', testName: 'Deceased Estate', description: 'Disqualify deceased estate properties', enabled: false, category: 'municipal', severity: 'blocking', validationMode: 'api' },
  { testId: 'vehicle_value', testName: 'Vehicle Value Limit', description: 'Maximum total vehicle value allowed', enabled: false, category: 'municipal', severity: 'blocking', validationMode: 'manual', configValue: 0, configUnit: 'R' },
  { testId: 'property_size', testName: 'Property Size Limit', description: 'Maximum property size (stand area) allowed', enabled: false, category: 'municipal', severity: 'blocking', validationMode: 'manual', configValue: 0, configUnit: 'm²' },
  { testId: 'arrears_tolerance', testName: 'Arrears Tolerance', description: 'Maximum arrears amount before disqualification', enabled: false, category: 'municipal', severity: 'warning', validationMode: 'api', configValue: 0, configUnit: 'R' },
  { testId: 'dha_verification', testName: 'DHA ID Verification', description: 'Verify identity via Department of Home Affairs', enabled: false, category: 'municipal', severity: 'blocking', validationMode: 'api' },
  { testId: 'credit_bureau', testName: 'Credit Bureau Check (XDS)', description: 'Perform credit bureau check via Third Party Bureau / XDS', enabled: false, category: 'municipal', severity: 'warning', validationMode: 'api' },
  { testId: 'sars_income', testName: 'SARS Income Verification', description: 'Verify declared income against SARS records', enabled: false, category: 'municipal', severity: 'blocking', validationMode: 'api' },
  { testId: 'biometric', testName: 'Biometric Verification (IDECO)', description: 'Require biometric fingerprint or facial recognition', enabled: false, category: 'municipal', severity: 'blocking', validationMode: 'api' },
  { testId: 'child_headed_auto', testName: 'Auto-Qualify Child-Headed', description: 'Automatically qualify child-headed households regardless of income', enabled: false, category: 'municipal', severity: 'blocking', validationMode: 'manual' },
  { testId: 'no_infrastructure_auto', testName: 'Auto-Qualify No FBS Infrastructure', description: 'Automatically qualify households without basic services infrastructure', enabled: false, category: 'municipal', severity: 'blocking', validationMode: 'manual' },
];

export const DEFAULT_REPORT_CONFIG: QualificationReportConfig = {
  generatePdfOnQualification: false,
  generateRejectionLetter: false,
  autoEmailResult: false,
  autoSmsResult: false,
  autoWhatsappResult: false,
  includesBureauReport: false,
  allowBulkQualification: false,
  bulkMaxBatchSize: 0,
  reportHeaderText: '',
  rejectionLetterTemplate: '',
  requireApplicantSignature: false,
  signatureMethods: ['draw', 'type'],
  requireSignatureConsent: true,
  signatureConsentText: 'I confirm that the information provided in this application is true and correct to the best of my knowledge. I understand that providing false information is a criminal offence and may result in disqualification, repayment of subsidies received, and criminal prosecution.',
  attachSignedDeclarationPdf: true,
};

export interface Occupier {
  occupierId: number;
  applicationId: number;
  fullName: string;
  idNumber: string | null;
  passportNumber: string | null;
  employerId: number;
  employerName: string;
  incomeSourceId: number;
  incomeSourceName: string;
  incomeAmount: number;
  dwellingUnitNo?: number | string;
  contactNumber?: string;
  remarks?: string;
  relationship?: string;
  dateOfBirth?: string;
  gender?: string;
  occupierTypeName?: string;
  occupierTypeId?: number;
}

export interface Tenant {
  tenantId: number;
  applicationId: number;
  fullName: string | null;
  idNumber: string | null;
  passportNumber: string | null;
  physicalAddress: string | null;
  postalAddress: string | null;
  cellPhone: string | null;
  email: string | null;
  isTenant: boolean;
}

export interface Verification {
  verificationId: number;
  applicationId: number;
  homeVisitDate: string;
  verificationOfficer: string;
  contractorId: number;
  contractorName: string;
  homeVisitOutcomeId: number;
  homeVisitOutcomeName: string;
  verificationOutcomeId: number;
  verificationOutcomeName: string;
  doNotCutExtDate: string | null;
  doNotCutExtReason: string | null;
  remarks: string;
}

export interface QualifyingUnit {
  qualifyingUnitDetailId: number;
  applicationId: number;
  occupantNumber: number;
  unitId: number;
  unitName: string;
  householdIncome: number;
  subsidy: number;
}

export interface Application {
  applicationId: number;
  accountId: number;
  appStatusId: number;
  appStatusName: string;
  indigentTypeId: number;
  indigentTypeName: string;
  householdIncome: number;
  applicationDate: string;
  reApplicationDate: string;
  doNotCutDate: string | null;
  disqualificationDate: string | null;
  cancellationDate: string | null;
  terminationDate: string | null;
  declineDate: string | null;
  monthlySubsidy: number;
  qualifyingUnits: number;
  onceWriteOff: number;
  qualifiedSubsidyPercentage: number | null;
  socialGrantNumber: string | null;
  remarks: string | null;
  capturerID: number;
  dateCaptured: string;
  modifierID: number;
  dateModified: string;
  reviewerID: number | null;
  reviewDate: string | null;
  accountNumber?: string;
  accountHolderName?: string;
  idNumber?: string;
  physicalAddress?: string;
  postalAddress?: string;
  cellNo?: string;
  email?: string;
  balance?: number;
  commencementDate?: string | null;
  contractorName?: string | null;
  socialGrantNo?: string | null;
  fullName?: string;
}

export interface ApplicationDetail {
  application: Application;
  occupiers: Occupier[];
  tenant: Tenant | null;
  verifications: Verification[];
  qualifyingUnits: QualifyingUnit[];
}

export interface SaveApplicationRequest {
  applicationId: number;
  accountId: number;
  indigentTypeId: number;
  appStatusId: number;
  householdIncome: number;
  applicationDate: string;
  commencementDate: string;
  reApplicationDate: string;
  terminationDate: string;
  socialGrantNumber: string;
  remarks: string;
  reviewerId: number;
  reviewDate: string;
  capturerId: number;
  modifierId: number;
  qualifiedSubsidyPercentage: number;
  isTenantApplication: boolean;
  altContactPhone: string;
  altContactEmail: string;
  assignedContractorId: number;
  verificationDueDate: string;
  altrContactNo: string;
}

export interface SaveApplicationResponse {
  applicationId: number;
  accountId: number;
  appStatusId: number;
  appStatusName: string;
  indigentTypeId: number;
  indigentTypeName: string;
  householdIncome: number;
  applicationDate: string;
  reApplicationDate: string;
  doNotCutDate: string;
  monthlySubsidy: number;
  qualifyingUnits: number;
  onceWriteOff: number;
}

export interface SaveOccupierRequest {
  occupierId: number | null;
  applicationId: number;
  fullName: string;
  idNumber: string | null;
  passportNumber: string | null;
  employerId: number;
  incomeSourceId: number;
  incomeAmount: number;
  dwellingUnitNo?: number | string;
  occupierTypeId?: number;
  contactNumber: string | null;
  remarks: string | null;
  relationship: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  capturerID: number;
  dateCaptured: string;
  modifierID: number;
  dateModified: string;
}

export interface SaveOccupierResponse {
  occupierId: number;
  applicationId: number;
  atTPAppId?: number;
  fullName: string;
  idNumber: string | null;
  passportNumber: string | null;
  countryId: number | null;
  contactNumber: string | null;
  employerId: number;
  atTPEmployerId?: number;
  employerName: string;
  incomeSourceId: number;
  atTPIncomeSourceId?: number;
  incomeSourceName: string;
  incomeAmount: number;
  atTPOccupierDescId?: number;
  remarks: string | null;
  inactive?: boolean;
  occupierTypeId: number | null;
  occupierTypeName: string | null;
  relationship: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  dwellingUnitNo?: number | string;
}

export interface SaveTenantRequest {
  tenantId: number | null;
  applicationId: number;
  fullName: string | null;
  idNumber: string | null;
  passportNumber: string | null;
  physicalAddress: string | null;
  postalAddress: string | null;
  cellPhone: string | null;
  email: string | null;
  isTenant: boolean;
  capturerID: number;
  dateCaptured: string;
  modifierID: number;
  dateModified: string;
}

export interface SaveTenantResponse {
  tenantId: number;
  applicationId: number;
  fullName: string | null;
  idNumber: string | null;
  passportNumber: string | null;
  physicalAddress: string | null;
  postalAddress: string | null;
  cellPhone: string | null;
  email: string | null;
  isTenant: boolean;
}

export interface VerificationQueueItem {
  applicationId: number;
  accountId: number;
  accountNumber: string;
  accountHolderName: string;
  indigentTypeId: number;
  indigentTypeName: string;
  applicationDate: string;
  householdIncome: number;
  propertyAddress: string;
  lastVerificationDate: string | null;
  verificationAttempts: number;
  maxVerificationAttempts: number;
  assignedContractorId: number | null;
  assignedContractorName: string | null;
  assignedFieldWorkerId: number | null;
  assignedFieldWorkerName: string | null;
  doNotCutDate: string;
  verificationDueDate: string | null;
  referralTarget: ReferralTarget | null;
  email?: string | null;
  cellPhone?: string | null;
  qualifiedSubsidyPercentage?: number | null;
}

export interface SaveVerificationRequest {
  verificationId: number | null;
  applicationId: number;
  homeVisitDate: string;
  verificationOfficer: string;
  contractorId: number;
  fieldWorkerId?: number;
  fieldWorkerName?: string;
  homeVisitOutcomeId: number;
  verificationOutcomeId: number;
  doNotCutExtDate: string | null;
  doNotCutExtReason: string | null;
  remarks: string;
  referralTarget?: ReferralTarget | null;
  capturerID: number;
  dateCaptured: string;
  modifierID: number;
  dateModified: string;
}

export interface FieldWorker {
  fieldWorkerId: number;
  contractorId: number;
  fieldWorkerName: string;
  idNumber?: string | null;
  contactNumber: string | null;
  contactEmail?: string | null;
  isActive: boolean;
}

export interface SteercomReferralItem {
  applicationId: number;
  accountNumber: string;
  accountHolderName: string;
  indigentTypeId?: number;
  indigentTypeName: string;
  referralDate: string;
  referralReason: string;
  referredBy: string;
  status: string;
  docVerificationSummary?: string;
  applicationDate?: string;
}

export interface DocVerificationQueueItem {
  applicationId: number;
  accountId: number;
  accountNumber: string;
  accountHolderName: string;
  indigentTypeId: number;
  indigentTypeName: string;
  applicationDate: string;
  householdIncome: number;
  propertyAddress: string;
  appStatusId: number;
  appStatusName: string;
  totalDocuments: number;
  verifiedDocuments: number;
  rejectedDocuments: number;
  pendingDocuments: number;
  lastDocUploadDate: string | null;
  referralTarget: ReferralTarget | null;
  referralNote: string | null;
  referredBy: string | null;
  referralDate: string | null;
  siteVerificationComplete: boolean;
  email?: string | null;
  cellPhone?: string | null;
}

export interface ContractorAllocationRequest {
  applicationIds: number[];
  indigentTypeId: number;
  allocationMethod: 'round_robin' | 'load_balanced';
  verificationSLADays?: number;
  capturerID: number;
  dateModified: string;
}

export interface ContractorAllocationResponse {
  allocations: { applicationId: number; contractorId: number; contractorName: string; verificationDueDate?: string }[];
  persistedCount?: number;
  message: string;
}

export interface SaveVerificationResponse {
  verificationId: number;
  applicationId: number;
  homeVisitDate: string;
  verificationOfficer: string;
  contractorId: number;
  contractorName: string;
  homeVisitOutcomeId: number;
  homeVisitOutcomeName: string;
  verificationOutcomeId: number;
  verificationOutcomeName: string;
  doNotCutExtDate: string | null;
  doNotCutExtReason: string | null;
  remarks: string;
}

export interface AuthorizationQueueItem {
  applicationId: number;
  accountId: number;
  accountNumber: string;
  accountHolderName: string;
  idNumber: string;
  indigentTypeId: number;
  indigentTypeName: string;
  applicationDate: string;
  householdIncome: number;
  marketValue: number;
  propertyAddress: string;
  occupierCount: number;
  verificationDate: string;
  verificationOutcome: string;
  verificationOfficer: string;
  qualificationChecks: Record<string, boolean>;
  requestType: string;
  email?: string | null;
  cellPhone?: string | null;
  qualifiedSubsidyPercentage?: number | null;
}

export interface AuthorizeRequest {
  applicationId: number;
  appStatusId: number;
  monthlySubsidy: number;
  qualifyingUnits: number;
  onceWriteOff: number;
  commencementDate: string;
  reApplicationDate: string;
  terminationDate: string;
  qualifyingUnitDetails: { unitId: number; subsidy: number }[];
  remarks: string;
  reviewerID: number;
  reviewDate: string;
  modifierID: number;
  dateModified: string;
}

export interface DeclineRequest {
  applicationId: number;
  appStatusId: number;
  declineReasonId: number;
  remarks: string;
  reviewerId: number;
  reviewDate: string;
  capturerId: number;
  modifierId: number;
}

export interface IndigentRegisterItem {
  applicationId: number;
  accountId: number;
  accountNumber: string;
  accountHolderName: string;
  idNumber: string;
  indigentTypeId: number;
  indigentTypeName: string;
  appStatusId: number;
  appStatusName: string;
  applicationDate: string;
  reApplicationDate: string;
  doNotCutDate: string | null;
  householdIncome: number;
  monthlySubsidy: number;
  totalWriteOff: number;
  propertyAddress: string;
  town: string;
  lastVerificationDate: string | null;
  occupierCount: number;
  email?: string | null;
  cellPhone?: string | null;
  qualifiedSubsidyPercentage?: number | null;
}

export interface ReapplicationDueItem {
  applicationId: number;
  accountId: number;
  accountNumber: string;
  accountHolderName: string;
  indigentTypeName: string;
  applicationDate: string;
  reApplicationDate: string;
  daysUntilExpiry: number;
  monthlySubsidy: number;
  householdIncome: number;
  cellPhone: string | null;
  email: string | null;
  reapplicationSubmitted: boolean;
  qualifiedSubsidyPercentage?: number | null;
}

export interface TerminateRequest {
  applicationId: number;
  appStatusId: number;
  terminationReasonId: number;
  terminationDate: string;
  remarks: string;
  reviewerID: number;
  reviewDate: string;
  modifierID: number;
  dateModified: string;
  writeOffOnTermination?: boolean;
  writeOffAmount?: number;
  accountNo?: string;
  indigentTypeId?: number;
}

export interface BatchTerminateRequest {
  applicationIds: number[];
  appStatusId: number;
  terminationReasonId: number;
  terminationDate: string;
  remarks: string;
  reviewerID: number;
  reviewDate: string;
  modifierID: number;
  dateModified: string;
}

export interface BatchTerminateResponse {
  success: boolean;
  totalRequested: number;
  totalTerminated: number;
  totalFailed: number;
  results: { applicationId: number; success: boolean; message: string }[];
}

export interface OverrideDisqualificationRequest {
  applicationId: number;
  overrideReason: string;
  newStatusId: number;
  reviewerID: number;
  reviewDate: string;
  modifierID: number;
  dateModified: string;
}

export interface Contractor {
  contractorId: number;
  contractorName: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  isActive: boolean;
}

export interface DeclineReason {
  declineReasonId: number;
  declineReasonName: string;
  isActive: boolean;
}

export interface IncomeSource {
  incomeSourceId: number;
  incomeSourceName: string;
}

export interface Employer {
  employerId: number;
  employerCode?: string;
  employerName: string;
  isActive?: boolean;
}

export interface IndigentTypeRule {
  indigentTypeId: number | null;
  indigentTypeName: string;
  marketValueQualification: number;
  incomeLimit: number;
  enableIncomeSlidingScale: boolean;
  incomeSlidingScale: IncomeBracket[];
  reApplicationPeriod: number;
  reapplicationBaseDate: 'application' | 'approval';
  reApplicationReminderDays: number[];
  reApplicationReminderEmail: boolean;
  reApplicationReminderSms: boolean;
  reApplicationReminderWhatsapp: boolean;
  autoTerminateOnExpiry: boolean;
  autoTerminationTrigger: 'reapply_expiry' | 'financial_year_end' | 'both';
  autoTerminateGraceDays: number;
  autoTerminateNotifyEmail: boolean;
  autoTerminateNotifySms: boolean;
  autoTerminateNotifyWhatsapp: boolean;
  applicationPeriod: number;
  isMultipleProperty: boolean;
  isStaffMember: boolean;
  isSupplierToMunicipality: boolean;
  isCompanyDirector: boolean;
  isGovernmentEmployee: boolean;
  isBusinessProperty: boolean;
  isDeceasedEstate: boolean;
  vehicleValueLimit: number;
  propertySizeLimit: number;
  minAge: number;
  maxAge: number;
  minDependants: number;
  isPensioner: boolean;
  arrearsToleranceAmount: number;
  requireDhaVerification: boolean;
  requireCreditBureauCheck: boolean;
  requireSarsIncomeCheck: boolean;
  requireBiometricVerification: boolean;
  requireSaCitizenship: boolean;
  allowRefugeeStatus: boolean;
  subsidyPercentage: number;
  incomeBandUpper: number;
  autoQualifyChildHeaded: boolean;
  autoQualifyNoInfrastructure: boolean;
  exemptSeniorsFromRenewal: boolean;
  seniorExemptionAge: number;
  seniorExtendedPeriod: number;
  enableDwellingUnits: boolean;
  excludeAdditionalDwellingIncome: boolean;
  enableSiteVerification: boolean;
  verificationRequired: boolean;
  maxVerificationAttempts: number;
  verificationSLADays: number;
  allocationMethod: 'manual' | 'round_robin' | 'load_balanced';
  enableDocumentVerification: boolean;
  requiredDocuments?: RequiredDocumentConfig[];
  referralWorkflow: ReferralWorkflowConfig;
  writeOffCycleMonths: number;
  enableWriteOffOnApproval: boolean;
  writeOffApprovalMode: 'disabled' | 'first_application' | 'per_financial_year';
  writeOffMaxFinancialYears: number | null;
  writeOffScope: 'all_debits' | 'all_services' | 'monthly_debits' | 'ageing_bracket';
  writeOffAgeingMinDays: number | null;
  writeOffAgeingMaxDays: number | null;
  enableFinancialYearEndWriteOff: boolean;
  enableContinuousWriteOff: boolean;
  continuousWriteOffIntervalMonths: number;
  writeOffDocumentTypeId: number | null;
  writeOffNotifyEmail: boolean;
  writeOffNotifySms: boolean;
  writeOffNotifyWhatsapp: boolean;
  writeOffHandoverDebt: boolean;
  terminateHandoverOnApproval: boolean;
  terminateRepaymentPlanOnApproval: boolean;
  isActive: boolean;
  enableIndigentCommunications: boolean;
  ccStakeholders: CcStakeholder[];
  communicationTemplates: CommunicationTemplate[];
  applicationSlaTargetDays: number;
  standardQualificationTests?: PolicyValidationTest[];
  municipalPolicyTests?: PolicyValidationTest[];
  reportConfig?: QualificationReportConfig;
  subRules?: { propertyCategoryId: number; nameTypeId: number; propertyCategoryName?: string; nameTypeName?: string; subRuleId?: number }[];
  capturerID?: number;
  dateCaptured?: string;
  modifierID?: number;
  dateModified?: string;
}

export interface AutomatedLetter {
  letterId: number;
  indigentTypeId: number;
  letterType: string;
  templateName: string;
  isActive: boolean;
  triggerEvent: string;
}

export interface ApplicationStats {
  finYear: string;
  totalApplications: number;
  totalApproved: number;
  totalDeclined: number;
  totalTerminated: number;
  totalDisqualified: number;
  totalPending: number;
  totalReapplications: number;
  verificationCompletionRate: number;
  averageProcessingDays: number;
  totalSubsidyCost: number;
  totalWriteOffs: number;
  byMonth: ApplicationStatsByMonth[];
  byIndigentType: ApplicationStatsByType[];
}

export interface ApplicationStatsByMonth {
  month: number;
  monthName: string;
  applications: number;
  approved: number;
  declined: number;
  terminated: number;
  subsidyCost: number;
}

export interface ApplicationStatsByType {
  indigentTypeId: number;
  indigentTypeName: string;
  applications: number;
  approved: number;
  subsidyCost: number;
}

export interface DoNotCutUpdateRequest {
  applicationId: number;
  doNotCutDate: string | null;
  doNotCutExtReason: string;
  modifierID: number;
  dateModified: string;
}

export interface PaginatedResponse<T> {
  data?: T[];
  items?: T[];
  totalCount: number;
  page?: number;
  pageSize?: number;
}

export interface ActionResponse {
  success: boolean;
  applicationId: number;
  appStatusId: number;
  appStatusName: string;
  message: string;
}

export interface AuthorizeResponse extends ActionResponse {
}

export interface DeclineResponse extends ActionResponse {
}

export interface TerminateResponse extends ActionResponse {
  terminationDate: string;
  impactSummary?: {
    monthlySubsidyLost: number;
    qualifyingUnitsRemoved: number;
    doNotCutRemoved: boolean;
  };
}

export interface ReapplicationResponse extends ActionResponse {
  newReApplicationDate: string;
}

export interface OverrideResponse {
  success: boolean;
  applicationId: number;
  previousStatusId: number;
  previousStatusName: string;
  newStatusId: number;
  newStatusName: string;
  message: string;
}

export interface DoNotCutUpdateResponse {
  success: boolean;
  applicationId: number;
  doNotCutDate: string | null;
  message: string;
}

export interface SaveContractorRequest {
  contractorId: number | null;
  contractorName: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  isActive: boolean;
  capturerID: number;
  dateCaptured: string;
  modifierID: number;
  dateModified: string;
}

export interface SaveAutomatedLetterRequest {
  letterId: number | null;
  indigentTypeId: number;
  letterType: string;
  templateName: string;
  isActive: boolean;
  triggerEvent: string;
  capturerID: number;
  dateCaptured: string;
  modifierID: number;
  dateModified: string;
}

export interface SubmitReapplicationRequest {
  applicationId: number;
  appStatusId: number;
  householdIncome: number;
  reApplicationDate: string;
  terminationDate: string;
  remarks: string;
  capturerID: number;
  dateCaptured: string;
  modifierID: number;
  dateModified: string;
}

export interface BulkActivateRequest {
  accountNumbers: string[];
  indigentTypeId: number;
  appStatusId: number;
  applicationDate: string;
  commencementDate: string;
  reApplicationDate: string;
  terminationDate: string;
  financialYear: string;
  remarks: string;
  capturerID: number;
  dateCaptured: string;
  modifierID: number;
  dateModified: string;
}

export interface BulkActivateResponse {
  success: boolean;
  totalRequested: number;
  totalActivated: number;
  totalFailed: number;
  results: { accountNumber: string; accountId: number | null; applicationId: number | null; success: boolean; message: string }[];
}

export interface ATTPDocument {
  documentId: number;
  applicationId: number;
  documentTypeId: number;
  documentTypeName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedDate: string;
  remarks: string | null;
}

export interface ATTPDocumentType {
  documentTypeId: number;
  documentTypeName: string;
  isRequired: boolean;
  isActive: boolean;
  indigentTypeId: number | null;
}

export interface SaveDocumentTypeRequest {
  documentTypeId: number | null;
  documentTypeName: string;
  isRequired: boolean;
  isActive: boolean;
  indigentTypeId: number | null;
  capturerID: number;
  dateCaptured: string;
  modifierID: number;
  dateModified: string;
}

export interface ATTPSignature {
  signatureId: number;
  applicationId: number;
  signerName: string;
  signerRole: string;
  signatureData: string;
  signedDate: string;
  ipAddress: string | null;
}

export interface VerificationProvider {
  providerId: number;
  providerName: string;
  providerType: string;
  apiEndpoint: string | null;
  apiCredentials: string | null;
  timeoutSeconds: number | null;
  fieldMapping: string | null;
  fallbackEnabled: boolean;
  offlineMode: boolean;
  isActive: boolean;
  contactPerson: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
}

export interface IDVerificationResult {
  verificationLogId: number;
  applicationId: number;
  idNumber: string;
  providerId: number;
  providerName: string;
  verificationDate: string;
  status: string;
  matchScore: number | null;
  responseData: string | null;
  verifiedBy: string;
}

export interface UploadDocumentRequest {
  applicationId: number;
  documentTypeId: number;
  documentName: string;
  fileData: string;
  fileName: string;
  capturerId: number;
  dateCaptured: string;
}

export interface SaveSignatureRequest {
  signatureId: number | null;
  appId: number;
  signerName: string;
  signerRole: string;
  signatureData: string;
  signedDate: string;
  capturerID: number;
  dateCaptured: string;
  signatureMethod?: 'draw' | 'type';
  consentAccepted?: boolean;
  consentText?: string;
  signerIp?: string;
  signerUserAgent?: string;
}

export interface SaveVerificationProviderRequest {
  providerId: number | null;
  providerName: string;
  providerType: string;
  apiEndpoint: string | null;
  apiCredentials: string | null;
  timeoutSeconds: number | null;
  fieldMapping: string | null;
  fallbackEnabled: boolean;
  offlineMode: boolean;
  isActive: boolean;
  contactPerson: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  capturerID: number;
  dateCaptured: string;
  modifierID: number;
  dateModified: string;
}

export interface SaveDeclineReasonRequest {
  declineReasonId: number | null;
  declineReasonName: string;
  isActive: boolean;
  capturerID: number;
  dateCaptured: string;
  modifierID: number;
  dateModified: string;
}

export interface OccupierTypeConfig {
  occupierTypeId: number;
  name: string;
  includeInHouseholdIncome: boolean;
  isActive: boolean;
}

export interface IncomeSourceItem {
  incomeSourceId: number;
  incomeSourceName: string;
  isActive: boolean;
  excludeFromValidation?: boolean;
}

export interface SaveIncomeSourceRequest {
  incomeSourceId: number | null;
  incomeSourceName: string;
  isActive: boolean;
  excludeFromValidation?: boolean;
  capturerID: number;
  dateCaptured: string;
  modifierID: number;
  dateModified: string;
}

export interface TerminationQueueItem {
  applicationId: number;
  accountId: number;
  accountNumber: string;
  accountHolderName: string;
  indigentTypeName: string;
  applicationDate: string;
  terminationDate: string | null;
  terminationReason: string;
  status: string;
  monthlySubsidy: number;
  householdIncome: number;
}

export interface AccountSearchResult {
  account_ID: number;
  accountID: number;
  accountNumber: string;
  name: string;
  surname_Company: string;
  initials: string;
  idRegistrationNumber: string;
  deliveryAddress: string;
  locationAddress: string;
  statusDesc: string;
  outStandingAmt: number;
  outStandingAmount: number;
  cellNumber?: string;
  cellNo?: string;
  emailAddress?: string;
  email?: string;
}

export interface AccountSummary {
  accountId: number;
  accountNumber: string;
  holderName: string;
  address: string;
  outstandingBalance: number;
  status: string;
  idNumber: string;
  currentIndigentStatus: string | null;
  currentApplicationId: number | null;
}

export interface ApplicationHistoryItem {
  applicationId: number;
  appStatusName: string;
  indigentTypeName: string;
  applicationDate: string;
  reApplicationDate: string;
}

export type IndigentLifecycleEvent =
  | 'application_received'
  | 'documents_outstanding'
  | 'verification_scheduled'
  | 'verification_completed'
  | 'doc_verification_approved'
  | 'doc_verification_rejected'
  | 'authorization_approved'
  | 'authorization_declined'
  | 'reapplication_reminder'
  | 'reapplication_received'
  | 'termination_notice';

export const LIFECYCLE_EVENT_LABELS: Record<IndigentLifecycleEvent, string> = {
  application_received: 'Application Received',
  documents_outstanding: 'Documents Outstanding',
  verification_scheduled: 'Verification Scheduled',
  verification_completed: 'Verification Completed',
  doc_verification_approved: 'Document Verification Approved',
  doc_verification_rejected: 'Document Verification Rejected',
  authorization_approved: 'Authorization Approved',
  authorization_declined: 'Authorization Declined',
  reapplication_reminder: 'Reapplication Reminder',
  reapplication_received: 'Reapplication Received',
  termination_notice: 'Termination Notice',
};

export interface CommunicationTemplate {
  eventType: IndigentLifecycleEvent;
  emailEnabled: boolean;
  smsEnabled: boolean;
  subject: string;
  body: string;
}

export interface CcStakeholder {
  name: string;
  email: string;
}

export const DEFAULT_COMMUNICATION_TEMPLATES: CommunicationTemplate[] = [
  {
    eventType: 'application_received',
    emailEnabled: true,
    smsEnabled: true,
    subject: 'Indigent Application Received — {{accountNumber}}',
    body: 'Dear {{applicantName}},\n\nYour indigent application for account {{accountNumber}} has been received on {{applicationDate}}.\n\nApplication Reference: #{{applicationId}}\nIndigent Type: {{indigentTypeName}}\n\nYour application will be processed within 30 days. You will be notified of the outcome.\n\nRegards,\nMunicipality Indigent Office',
  },
  {
    eventType: 'documents_outstanding',
    emailEnabled: true,
    smsEnabled: true,
    subject: 'Outstanding Documents Required — {{accountNumber}}',
    body: 'Dear {{applicantName}},\n\nThe following documents are still required for your indigent application #{{applicationId}} on account {{accountNumber}}:\n\n{{missingDocuments}}\n\nPlease submit the outstanding documents by {{deadline}}.\n\nFailure to provide these documents may result in your application being declined.\n\nRegards,\nMunicipality Indigent Office',
  },
  {
    eventType: 'verification_scheduled',
    emailEnabled: true,
    smsEnabled: true,
    subject: 'Site Verification Scheduled — {{accountNumber}}',
    body: 'Dear {{applicantName}},\n\nA site verification visit has been scheduled for your indigent application #{{applicationId}} on account {{accountNumber}}.\n\nPlease ensure that someone is available at the property address during working hours.\n\nRegards,\nMunicipality Indigent Office',
  },
  {
    eventType: 'verification_completed',
    emailEnabled: true,
    smsEnabled: true,
    subject: 'Site Verification Completed — {{accountNumber}}',
    body: 'Dear {{applicantName}},\n\nThe site verification for your indigent application #{{applicationId}} on account {{accountNumber}} has been completed.\n\nOutcome: {{verificationOutcome}}\n\nYour application will now proceed to the authorization stage.\n\nRegards,\nMunicipality Indigent Office',
  },
  {
    eventType: 'authorization_approved',
    emailEnabled: true,
    smsEnabled: true,
    subject: 'Indigent Application Approved — {{accountNumber}}',
    body: 'Dear {{applicantName}},\n\nCongratulations! Your indigent application #{{applicationId}} for account {{accountNumber}} has been approved.\n\nIndigent Type: {{indigentTypeName}}\nMonthly Subsidy: {{monthlySubsidy}}\nValid Until: {{reApplicationDate}}\n\nPlease note that you will need to reapply before the expiry date to continue receiving benefits.\n\nRegards,\nMunicipality Indigent Office',
  },
  {
    eventType: 'authorization_declined',
    emailEnabled: true,
    smsEnabled: true,
    subject: 'Indigent Application Declined — {{accountNumber}}',
    body: 'Dear {{applicantName}},\n\nWe regret to inform you that your indigent application #{{applicationId}} for account {{accountNumber}} has been declined.\n\nReason: {{declineReason}}\n\nYou may appeal this decision within 30 days by contacting the Indigent Office.\n\nRegards,\nMunicipality Indigent Office',
  },
  {
    eventType: 'reapplication_reminder',
    emailEnabled: true,
    smsEnabled: true,
    subject: 'Indigent Reapplication Reminder — {{accountNumber}}',
    body: 'Dear {{applicantName}},\n\nYour indigent registration for account {{accountNumber}} is due for renewal on {{reApplicationDate}}.\n\nDays remaining: {{daysRemaining}}\n\nPlease visit the municipal offices to submit your reapplication with updated documentation.\n\nFailure to reapply may result in termination of your indigent benefits.\n\nRegards,\nMunicipality Indigent Office',
  },
  {
    eventType: 'reapplication_received',
    emailEnabled: true,
    smsEnabled: true,
    subject: 'Indigent Reapplication Received — {{accountNumber}}',
    body: 'Dear {{applicantName}},\n\nYour indigent reapplication for account {{accountNumber}} has been received.\n\nApplication Reference: #{{applicationId}}\n\nYour reapplication will be processed accordingly.\n\nRegards,\nMunicipality Indigent Office',
  },
  {
    eventType: 'termination_notice',
    emailEnabled: true,
    smsEnabled: true,
    subject: 'Indigent Status Terminated — {{accountNumber}}',
    body: 'Dear {{applicantName}},\n\nThis is to inform you that your indigent status for account {{accountNumber}} has been terminated.\n\nApplication Reference: #{{applicationId}}\nReason: {{terminationReason}}\n\nIf you believe this is in error, please contact the Indigent Office within 14 days.\n\nRegards,\nMunicipality Indigent Office',
  },
];

export type SlaBallWith = 'municipality' | 'applicant';

export interface SlaInfo {
  applicationDate: string;
  daysElapsed: number;
  ballWith: SlaBallWith;
  lastMunicipalityAction: string | null;
  lastApplicantResponse: string | null;
  ragStatus: 'green' | 'amber' | 'red';
  slaTargetDays: number;
}

export interface CommunicationLogEntry {
  id: number;
  accountId: string;
  accountNumber: string;
  accountHolder: string;
  method: string;
  recipients: string;
  subject: string;
  messageBody: string;
  status: string;
  sentBy: string;
  sentByName: string;
  statementType: string;
  eventType: string | null;
  indigentTypeName: string | null;
  applicationId: string | null;
  createdAt: string;
}
