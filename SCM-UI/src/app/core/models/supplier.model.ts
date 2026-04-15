import { Address, Attachment } from './shared.model';

export type SupplierStatus = 'active' | 'inactive' | 'suspended' | 'blacklisted' | 'pending_verification';
export type BBBEELevel = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | 'non-compliant' | 'exempt';

export interface BankingDetails {
  bankName: string;
  branchCode: string;
  accountNumber: string;
  accountType: 'current' | 'savings' | 'transmission';
  accountHolder: string;
  verified: boolean;
  verifiedDate?: string;
}

export interface BBBEECertificate {
  level: BBBEELevel;
  certificateNumber: string;
  issuedBy: string;
  issueDate: string;
  expiryDate: string;
  verified: boolean;
  blackEconomicEmpowerment: number;
  managementControl: number;
  skillsDevelopment: number;
  enterpriseDevelopment: number;
  socioEconomicDevelopment: number;
}

export interface TaxCompliance {
  taxNumber: string;
  taxClearancePin: string;
  status: 'compliant' | 'non-compliant' | 'pending' | 'expired';
  validFrom: string;
  validTo: string;
  verifiedWithSars: boolean;
  lastVerified?: string;
}

export interface CsdRegistration {
  csdNumber: string;
  registeredName: string;
  tradingName?: string;
  registrationDate: string;
  lastVerified: string;
  status: 'active' | 'inactive' | 'suspended';
  maaa: string; // Master Administration, Assessment & Allocation
}

export interface CipcRegistration {
  registrationNumber: string;
  companyType: string;
  registrationDate: string;
  status: 'active' | 'deregistered' | 'in_process';
  directors: { name: string; idNumber: string; nationality: string; }[];
}

export interface SupplierPerformance {
  overallScore: number;
  deliveryOnTime: number;
  qualityRating: number;
  priceCompetitiveness: number;
  responsiveness: number;
  totalOrders: number;
  completedOrders: number;
  lateDeliveries: number;
  rejectedDeliveries: number;
  lastAssessmentDate: string;
}

export interface Supplier {
  id: string;
  supplierNumber: string;
  registeredName: string;
  tradingName: string;
  contactPerson: string;
  email: string;
  phone: string;
  fax?: string;
  website?: string;
  physicalAddress: Address;
  postalAddress?: Address;
  status: SupplierStatus;
  csdRegistration: CsdRegistration;
  cipcRegistration?: CipcRegistration;
  taxCompliance: TaxCompliance;
  bbbee: BBBEECertificate;
  bankingDetails: BankingDetails;
  performance: SupplierPerformance;
  commodities: string[];
  unspscCodes: string[];
  isLocalSupplier: boolean;
  province: string;
  municipality: string;
  createdAt: string;
  updatedAt: string;
  attachments?: Attachment[];
  notes?: string;
}
