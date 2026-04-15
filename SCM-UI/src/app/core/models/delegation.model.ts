import { Money } from './shared.model';

export interface DelegationOfAuthority {
  id: string;
  delegationNumber: string;
  delegatedFrom: { id: string; name: string; role: string; };
  delegatedTo: { id: string; name: string; role: string; };
  type: 'permanent' | 'temporary' | 'acting';
  transactionTypes: string[];
  minAmount: Money;
  maxAmount: Money;
  startDate: string;
  endDate?: string;
  reason: string;
  conditions?: string;
  status: 'active' | 'inactive' | 'expired' | 'revoked';
  approvedBy?: { id: string; name: string; };
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthorityThreshold {
  id: string;
  role: string;
  roleLabel: string;
  transactionType: string;
  minAmount: Money;
  maxAmount: Money;
  requiresCoSignature: boolean;
  coSignatureRole?: string;
  effectiveFrom: string;
  effectiveTo?: string;
}
