// Read-only projections returned by /api/payroll-lookups/*. These mirror
// the API DTOs (ConstDepartmentDto / ConstDivisionDto / ConstCycleDto /
// PayrollCyclePeriodDto) and back the dropdowns on the overtime capture
// form so captured rows reference the same IDs the payroll system uses.

export interface ConstDepartmentLookup {
  departmentId: number;
  departmentDesc: string;
  departmentCode?: string | null;
}

export interface ConstDivisionLookup {
  divisionId: number;
  divisionDesc: string;
  divisionCode?: string | null;
  // Parent department — the capture form uses this to keep the division
  // dropdown in sync with the department selection.
  departmentId?: number | null;
}

export interface ConstCycleLookup {
  cycleId: number;
  cycleDesc: string;
}

export interface PayrollCyclePeriodLookup {
  periodId: number;
  periodInTaxYear?: number | null;
  processingMonth?: string | null;
  financialYear?: string | null;
  taxYear?: string | null;
  cycleId?: number | null;
  // Pre-built "March 2026/2027 (P1)" label so the dropdown doesn't have
  // to compose its own display string.
  displayName: string;
}
