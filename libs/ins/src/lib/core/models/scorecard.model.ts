export type ScorecardStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface Scorecard {
  id: number;
  name: string;
  cycleId: number;
  ownerId: number;
  status: ScorecardStatus;
  totalWeight: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalKpis: number;
  achieved: number;
  atRisk: number;
  pendingEvidence: number;
  cycleCode?: string;
  cycleStatus?: string;
}
