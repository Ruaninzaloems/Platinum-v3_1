export interface NtCategory {
  code: string;
  name: string;
  subcategories: string[];
}

export interface MunicipalGrouping {
  code: string;
  name: string;
  description: string;
}

export interface VendorDocumentType {
  code: string;
  name: string;
  mandatory: boolean;
  hasExpiry: boolean;
}

export interface RegistrationType {
  code: string;
  name: string;
}

export interface AnnualTurnoverRange {
  code: string;
  name: string;
  min: number;
  max: number | null;
}

export interface AccreditationType {
  code: string;
  name: string;
  grades: string[];
}

export interface ProfessionalRegistrationBody {
  code: string;
  name: string;
}

export interface VendorManagementConfig {
  ntCategories: NtCategory[];
  municipalGroupings: MunicipalGrouping[];
  documentTypes: VendorDocumentType[];
  registrationTypes: RegistrationType[];
  annualTurnoverRanges: AnnualTurnoverRange[];
  approvalStatuses: string[];
  accreditationTypes: AccreditationType[];
  professionalRegistrationBodies: ProfessionalRegistrationBody[];
}

export interface VendorDocument {
  id: string;
  supplierId: string;
  documentType: string;
  documentNumber: string;
  fileName: string;
  fileSize: number;
  received: boolean;
  receivedDate: string;
  expiryDate: string | null;
  uploadedBy: string;
  uploadedAt: string;
  status: 'pending_verification' | 'verified' | 'expired' | 'rejected';
  verifiedBy: string | null;
  verifiedAt: string | null;
}

export interface DocumentChecklist {
  supplierId: string;
  mandatoryChecklist: DocumentChecklistItem[];
  mandatoryComplete: boolean;
  expiredDocuments: DocumentChecklistItem[];
  expiringWithin30Days: DocumentChecklistItem[];
  optionalDocuments: VendorDocument[];
  totalDocuments: number;
}

export interface DocumentChecklistItem {
  documentType: string;
  name: string;
  mandatory: boolean;
  hasExpiry: boolean;
  received: boolean;
  document: VendorDocument | null;
  isExpired: boolean;
  daysUntilExpiry: number | null;
}

export interface VendorDirector {
  id: string;
  supplierId: string;
  fullName: string;
  idNumber: string;
  nationality: string;
  gender: 'Male' | 'Female';
  hdi: boolean;
  disability: boolean;
  appointmentDate: string;
  percentageOwned: number;
  isActive: boolean;
}

export interface OwnershipAnalysis {
  totalOwnership: number;
  hdiOwnership: number;
  womenOwnership: number;
  youthOwnership: number;
  disabilityOwnership: number;
  isHdiOwned: boolean;
  isWomenOwned: boolean;
  isYouthOwned: boolean;
  isDisabilityOwned: boolean;
}

export interface DirectorResponse {
  supplierId: string;
  directors: VendorDirector[];
  totalDirectors: number;
  ownershipAnalysis: OwnershipAnalysis;
}

export interface VendorAccreditation {
  id: string;
  supplierId: string;
  type: string;
  grade: string;
  registrationNumber: string;
  issueDate: string;
  expiryDate: string;
  verificationNumber: string | null;
  verified: boolean;
  verifiedDate: string | null;
}

export interface VendorProfessionalRegistration {
  id: string;
  supplierId: string;
  body: string;
  registrationNumber: string;
  memberName: string;
  designation: string;
  issueDate: string;
  expiryDate: string;
  verified: boolean;
  verifiedDate: string | null;
}

export interface VendorDiscountDetail {
  id: string;
  supplierId: string;
  discountRate: number;
  qualifyingDays: number;
  description: string;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
}

export interface VendorRegistrationWizard {
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  pendingSteps: string[];
}

export interface VendorRegistration {
  id: string;
  supplierId: string;
  registrationSource: 'csd_import' | 'manual';
  registrationType: string;
  ntCategory: string | null;
  municipalGrouping: string | null;
  annualTurnover: string | null;
  compensationCommissionerNumber: string | null;
  cidbVerificationNumber: string | null;
  wizard: VendorRegistrationWizard;
  status: string;
  capturedBy: string;
  capturedByName: string;
  capturedDate: string;
  supervisorId: string | null;
  supervisorName: string | null;
  supervisorAction: string | null;
  supervisorDate: string | null;
  supervisorComments: string | null;
  offlineMode: boolean;
  syncStatus: 'synced' | 'pending_sync' | 'sync_error';
  lastSyncDate: string | null;
}

export interface VendorStatusChange {
  id: string;
  supplierId: string;
  fromStatus: string;
  toStatus: string;
  reason: string;
  changedBy: string;
  changedByName: string;
  changedDate: string;
  approvedBy: string | null;
  approvedByName: string | null;
  approvedDate: string | null;
}

export interface CsdSearchResult {
  csdNumber: string;
  registeredName: string;
  tradingName: string;
  registrationNumber: string;
  vatNumber: string;
  taxClearancePin: string;
  taxClearanceExpiry: string;
  taxClearanceValid: boolean;
  bbbeeLevel: number | string;
  bbbeeExpiry: string;
  contactPerson: string;
  email: string;
  phone: string;
  source: string;
  lastVerified: string;
}

export interface DiversitySummary {
  totalSuppliers: number;
  activeSuppliers: number;
  hdiOwnedCount: number;
  womenOwnedCount: number;
  youthOwnedCount: number;
  disabilityOwnedCount: number;
  bbbeeDistribution: Record<string, number>;
}

export interface DocumentExpiryAlert {
  id: string;
  supplierId: string;
  supplierName: string;
  documentType: string;
  documentTypeName: string;
  expiryDate: string;
  alertType: 'expired' | 'expiring_soon';
  daysRemaining?: number;
}
