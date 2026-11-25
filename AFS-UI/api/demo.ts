export const demoFinancialYears = [
  {
    id: 'fy-2025-2026',
    label: 'FY 2025/2026',
    status: 'active',
    isCurrent: true,
    startDate: '2025-07-01',
    endDate: '2026-06-30',
    isLocked: false,
  },
  {
    id: 'fy-2024-2025',
    label: 'FY 2024/2025',
    status: 'closed',
    isCurrent: false,
    startDate: '2024-07-01',
    endDate: '2025-06-30',
    isLocked: true,
  },
];

export const demoDashboard = {
  financialYear: { id: 'fy-2025-2026', label: 'FY 2025/2026', status: 'active' },
  kpis: {
    totalCompilations: 12,
    inProgress: 4,
    approved: 6,
    published: 2,
    openRfis: 18,
    overdueRfis: 3,
    unresolvedFindings: 9,
    totalFindings: 27,
    pendingAdjustments: 5,
    evidenceCount: 184,
    wpCompletion: 72,
    avgCompleteness: 68,
    tbEntryCount: 1342,
  },
  compilationsByStatus: { draft: 4, in_progress: 2, review: 1, approved: 6, published: 2 },
  findingsBySeverity: { critical: 2, high: 5, medium: 11, low: 9 },
  complianceScore: 78,
  recentActivity: [
    { type: 'compilation', action: 'updated', date: '2026-05-05T14:22:00Z' },
    { type: 'rfi', action: 'updated', date: '2026-05-05T11:08:00Z' },
    { type: 'finding', action: 'updated', date: '2026-05-04T16:45:00Z' },
    { type: 'afs_version', action: 'updated', date: '2026-05-04T09:12:00Z' },
    { type: 'compilation', action: 'updated', date: '2026-05-03T15:30:00Z' },
  ],
  adjustmentSummary: { total: 22, posted: 17, totalAmount: 4_280_500 },
  tbSummary: {
    debit: 1_245_300_000,
    credit: 1_245_300_000,
    net: 0,
    rows: 1342,
    totalRevenue: 866_400_000,
    totalExpenditure: 612_000_000,
    totalBudgetRevenue: 880_000_000,
    totalBudgetExpenditure: 595_000_000,
    totalAssets: 2_184_700_000,
    totalLiabilities: 612_300_000,
    netAssets: 1_572_400_000,
    surplus: 254_400_000,
    gainsLosses: 18_750_000,
  },
  tbCategoryBreakdown: [
    { category: 'Property Rates Revenue', amount: 285_400_000, items: 42 },
    { category: 'Service Charges - Electricity', amount: 412_800_000, items: 38 },
    { category: 'Service Charges - Water', amount: 168_200_000, items: 31 },
    { category: 'Employee Related Costs', amount: 218_600_000, items: 96 },
    { category: 'Bulk Purchases - Electricity', amount: 196_400_000, items: 24 },
    { category: 'Depreciation & Asset Impairment', amount: 84_300_000, items: 58 },
    { category: 'Contracted Services', amount: 64_900_000, items: 71 },
    { category: 'Other Expenditure', amount: 47_800_000, items: 112 },
  ],
  budgetVsActual: [
    { category: 'Property Rates Revenue', budget: 280_000_000, actual: 285_400_000, variance: 5_400_000 },
    { category: 'Service Charges - Electricity', budget: 425_000_000, actual: 412_800_000, variance: -12_200_000 },
    { category: 'Service Charges - Water', budget: 175_000_000, actual: 168_200_000, variance: -6_800_000 },
    { category: 'Employee Related Costs', budget: 210_000_000, actual: 218_600_000, variance: 8_600_000 },
    { category: 'Bulk Purchases - Electricity', budget: 200_000_000, actual: 196_400_000, variance: -3_600_000 },
    { category: 'Depreciation & Asset Impairment', budget: 80_000_000, actual: 84_300_000, variance: 4_300_000 },
  ],
  topRevenueItems: [
    { code: '0100-0100-0001-0000', description: 'Service Charges - Electricity Sales', amount: 412_800_000 },
    { code: '0200-0100-0001-0000', description: 'Property Rates - Residential', amount: 198_400_000 },
    { code: '0100-0200-0001-0000', description: 'Service Charges - Water Sales', amount: 168_200_000 },
    { code: '0200-0200-0001-0000', description: 'Property Rates - Commercial', amount: 87_000_000 },
    { code: '0300-0100-0001-0000', description: 'Government Grants - Equitable Share', amount: 156_300_000 },
  ],
  topExpenditureItems: [
    { code: '4100-0100-0001-0000', description: 'Salaries & Wages', amount: 218_600_000 },
    { code: '4200-0100-0001-0000', description: 'Bulk Electricity Purchases', amount: 196_400_000 },
    { code: '4300-0100-0001-0000', description: 'Depreciation Expense', amount: 84_300_000 },
    { code: '4400-0100-0001-0000', description: 'Repairs & Maintenance', amount: 72_100_000 },
    { code: '4500-0100-0001-0000', description: 'Contracted Services', amount: 64_900_000 },
  ],
  glSummary: {
    entries: 8472,
    debit: 1_245_300_000,
    credit: 1_245_300_000,
    totalEntries: 8472,
    grandTotal: 1_245_300_000,
    rawGrandTotal: 1_245_300_000,
    categories: [
      { category: 'Revenue', itemType: 'Revenue', total: 866_400_000, entries: 1284 },
      { category: 'Expenditure', itemType: 'Expenditure', total: 612_000_000, entries: 2156 },
      { category: 'Assets', itemType: 'Assets', total: 2_184_700_000, entries: 2840 },
      { category: 'Liabilities', itemType: 'Liabilities', total: 612_300_000, entries: 1402 },
      { category: 'Equity', itemType: 'Equity', total: 1_572_400_000, entries: 790 },
    ],
  },
};

export const demoCompilations = [
  { id: 'cmp-001', name: 'AFS 2025/2026 Q1 Compilation', status: 'in_progress', financialYearId: 'fy-2025-2026', completenessPercentage: 65, preparedAt: null, reviewedAt: null, approvedAt: null, isActive: true, createdAt: '2026-01-15T08:00:00Z', updatedAt: '2026-05-05T14:22:00Z' },
  { id: 'cmp-002', name: 'AFS 2025/2026 Mid-Year Compilation', status: 'draft', financialYearId: 'fy-2025-2026', completenessPercentage: 28, preparedAt: null, reviewedAt: null, approvedAt: null, isActive: true, createdAt: '2026-02-10T08:00:00Z', updatedAt: '2026-04-22T11:18:00Z' },
  { id: 'cmp-003', name: 'AFS 2024/2025 Annual Compilation', status: 'approved', financialYearId: 'fy-2024-2025', completenessPercentage: 100, preparedAt: '2025-08-15T08:00:00Z', reviewedAt: '2025-09-20T08:00:00Z', approvedAt: '2025-10-30T08:00:00Z', isActive: true, createdAt: '2025-07-01T08:00:00Z', updatedAt: '2025-10-30T16:00:00Z' },
  { id: 'cmp-004', name: 'AFS 2024/2025 Audit Adjustments', status: 'published', financialYearId: 'fy-2024-2025', completenessPercentage: 100, preparedAt: '2025-11-01T08:00:00Z', reviewedAt: '2025-11-15T08:00:00Z', approvedAt: '2025-11-30T08:00:00Z', isActive: true, createdAt: '2025-10-31T08:00:00Z', updatedAt: '2025-12-05T10:00:00Z' },
];

export const demoFindingsDashboard = {
  total: 27,
  resolved: 11,
  highRisk: 7,
  repeatFindings: 4,
  avgDaysToResolution: 32,
  bySeverity: { material: 2, significant: 5, minor: 11, observation: 9 },
  byStatus: { open: 9, in_progress: 7, resolved: 8, closed: 3 },
  byCategory: { 'Asset Management': 8, 'Procurement': 6, 'Revenue': 5, 'Payroll': 4, 'Other': 4 },
  unresolvedList: [
    { id: 'F-2026-014', reference: 'F-2026-014', title: 'Asset register reconciliation gap', severity: 'high', status: 'in_progress', category: 'Asset Management', assignedTo: 'CFO Office', financialImpact: 1_240_000, ageDays: 18 },
    { id: 'F-2026-013', reference: 'F-2026-013', title: 'GRAP 17 disclosure incomplete', severity: 'medium', status: 'open', category: 'Asset Management', assignedTo: 'AFS Team', financialImpact: 0, ageDays: 12 },
    { id: 'F-2026-011', reference: 'F-2026-011', title: 'Procurement threshold breach – splitting of orders', severity: 'high', status: 'open', category: 'Procurement', assignedTo: 'SCM Manager', financialImpact: 845_000, ageDays: 24 },
    { id: 'F-2026-010', reference: 'F-2026-010', title: 'VAT reconciliation timing differences', severity: 'medium', status: 'in_progress', category: 'Revenue', assignedTo: 'Finance Manager', financialImpact: 320_000, ageDays: 41 },
    { id: 'F-2026-009', reference: 'F-2026-009', title: 'Payroll exception – overtime above policy cap', severity: 'low', status: 'open', category: 'Payroll', assignedTo: 'HR Director', financialImpact: 95_000, ageDays: 9 },
  ],
};

export const demoRfiDashboard = {
  total: 42,
  open: 18,
  overdue: 3,
  avgResponseDays: 4,
  slaCompliance: 87,
  byStatus: { open: 18, in_progress: 6, responded: 14, under_review: 2, closed: 10, reopened: 0 },
  byPriority: { critical: 2, high: 9, medium: 21, low: 10 },
  pipeline: { open: 18, in_progress: 6, responded: 14, under_review: 2, closed: 10, reopened: 0 },
  monthlyTrend: [
    { month: '2025-11', count: 4 },
    { month: '2025-12', count: 6 },
    { month: '2026-01', count: 9 },
    { month: '2026-02', count: 7 },
    { month: '2026-03', count: 8 },
    { month: '2026-04', count: 6 },
    { month: '2026-05', count: 2 },
  ],
  overdueList: [
    { id: 'RFI-2026-031', reference: 'RFI-2026-031', subject: 'Asset disposal supporting documents', priority: 'high', dueDate: '2026-05-01', status: 'open', assignedTo: 'Asset Manager', daysOverdue: 5 },
    { id: 'RFI-2026-029', reference: 'RFI-2026-029', subject: 'Q3 expenditure variance explanations', priority: 'medium', dueDate: '2026-04-28', status: 'in_progress', assignedTo: 'CFO Office', daysOverdue: 8 },
    { id: 'RFI-2026-027', reference: 'RFI-2026-027', subject: 'Bank reconciliation evidence', priority: 'high', dueDate: '2026-04-25', status: 'open', assignedTo: 'Finance Manager', daysOverdue: 11 },
  ],
};

export const demoMfmaCommentary: any[] = [];

export const demoMfmaSubmissions = [
  { id: 'sub-001', period: 11, reportType: 'section71', submittedAt: '2026-04-25T15:00:00Z', status: 'submitted', submittedBy: 'CFO Office' },
  { id: 'sub-002', period: 6, reportType: 'section72', submittedAt: '2026-01-25T14:00:00Z', status: 'submitted', submittedBy: 'CFO Office' },
];

const _monthly = (i: number, label: string, br: number, ar: number, be: number, ae: number) => ({
  period: i + 1,
  label,
  revenue: { budgetOriginal: br, budgetAdjusted: br, actual: ar, variance: ar - br, variancePercent: br ? Math.round(((ar - br) / br) * 1000) / 10 : 0 },
  expenditure: { budgetOriginal: be, budgetAdjusted: be, actual: ae, variance: be - ae, variancePercent: be ? Math.round(((be - ae) / be) * 1000) / 10 : 0 },
  surplus: ar - ae,
  ytdRevenue: 0,
  ytdExpenditure: 0,
  status: 'green' as const,
});

export const demoMfmaReport = {
  summary: {
    totalRevenue: { budgetOriginal: 880_000_000, budgetAdjusted: 880_000_000, actual: 866_400_000, variance: -13_600_000, collectionRate: 98 },
    totalExpenditure: { budgetOriginal: 595_000_000, budgetAdjusted: 595_000_000, actual: 612_000_000, variance: -17_000_000, spendingRate: 103 },
    surplus: 254_400_000,
  },
  monthlyBreakdown: [
    _monthly(0, 'Jul', 73_300_000, 71_200_000, 49_500_000, 48_900_000),
    _monthly(1, 'Aug', 73_300_000, 72_800_000, 49_500_000, 50_100_000),
    _monthly(2, 'Sep', 73_300_000, 74_100_000, 49_500_000, 51_400_000),
    _monthly(3, 'Oct', 73_300_000, 73_900_000, 49_500_000, 52_000_000),
    _monthly(4, 'Nov', 73_300_000, 72_400_000, 49_500_000, 50_800_000),
    _monthly(5, 'Dec', 73_300_000, 71_800_000, 49_500_000, 49_700_000),
    _monthly(6, 'Jan', 73_300_000, 70_900_000, 49_500_000, 51_200_000),
    _monthly(7, 'Feb', 73_300_000, 72_100_000, 49_500_000, 52_300_000),
    _monthly(8, 'Mar', 73_300_000, 73_400_000, 49_500_000, 51_900_000),
    _monthly(9, 'Apr', 73_300_000, 72_900_000, 49_500_000, 51_600_000),
    _monthly(10, 'May', 73_300_000, 70_500_000, 49_500_000, 51_100_000),
    _monthly(11, 'Jun', 73_300_000, 70_400_000, 49_500_000, 51_000_000),
  ],
  quarterlyBreakdown: [
    { quarter: 'Q1', revenueBudget: 220_000_000, revenueActual: 218_100_000, expenditureBudget: 148_500_000, expenditureActual: 150_400_000 },
    { quarter: 'Q2', revenueBudget: 220_000_000, revenueActual: 218_100_000, expenditureBudget: 148_500_000, expenditureActual: 152_500_000 },
    { quarter: 'Q3', revenueBudget: 220_000_000, revenueActual: 216_400_000, expenditureBudget: 148_500_000, expenditureActual: 155_400_000 },
    { quarter: 'Q4', revenueBudget: 220_000_000, revenueActual: 213_800_000, expenditureBudget: 148_500_000, expenditureActual: 153_700_000 },
  ],
  revenueCategories: [
    { category: 'Property Rates', budgetOriginal: 280_000_000, budgetAdjusted: 280_000_000, actual: 285_400_000, variance: 5_400_000, collectionRate: 102 },
    { category: 'Service Charges - Electricity', budgetOriginal: 425_000_000, budgetAdjusted: 425_000_000, actual: 412_800_000, variance: -12_200_000, collectionRate: 97 },
    { category: 'Service Charges - Water', budgetOriginal: 175_000_000, budgetAdjusted: 175_000_000, actual: 168_200_000, variance: -6_800_000, collectionRate: 96 },
  ],
  expenditureCategories: [
    { category: 'Employee Related Costs', budgetOriginal: 210_000_000, budgetAdjusted: 210_000_000, actual: 218_600_000, variance: 8_600_000, spendingRate: 104 },
    { category: 'Bulk Purchases - Electricity', budgetOriginal: 200_000_000, budgetAdjusted: 200_000_000, actual: 196_400_000, variance: -3_600_000, spendingRate: 98 },
    { category: 'Depreciation & Asset Impairment', budgetOriginal: 80_000_000, budgetAdjusted: 80_000_000, actual: 84_300_000, variance: 4_300_000, spendingRate: 105 },
  ],
};

export const demoExceptionRegister = {
  totalExceptions: 14,
  materialCount: 4,
  bySeverity: { critical: 1, high: 3, medium: 6, low: 4 },
  byStatus: { open: 8, in_progress: 4, resolved: 2 },
  exceptions: [
    { id: 'EX-001', statement: 'Statement of Financial Position', note: 'Note 12 – PPE', description: 'Unmapped mSCOA item code 0100-9999-0001-0000', severity: 'medium', materiality: 'immaterial', status: 'open' },
    { id: 'EX-002', statement: 'Statement of Financial Performance', note: 'Note 4 – Revenue', description: 'TB does not balance for FY 2025/2026', severity: 'high', materiality: 'material', status: 'in_progress' },
    { id: 'EX-003', statement: 'Cash Flow Statement', note: 'Note 28', description: 'Missing supporting documents for 12 adjustments', severity: 'low', materiality: 'immaterial', status: 'open' },
    { id: 'EX-004', statement: 'Statement of Financial Position', note: 'Note 18 – Receivables', description: 'Aged debtors over 12 months not impaired', severity: 'high', materiality: 'material', status: 'open' },
    { id: 'EX-005', statement: 'Notes', note: 'Note 35 – Related parties', description: 'Related party disclosure incomplete', severity: 'critical', materiality: 'material', status: 'in_progress' },
  ],
};

export const demoEvidenceHeatmap = {
  totalSections: 8,
  coveredSections: 6,
  gapSections: 2,
  coveragePercent: 79,
  totalEvidence: 144,
  sections: [
    { id: 'sec-01', name: 'Property, Plant & Equipment', evidenceCount: 38, status: 'covered' },
    { id: 'sec-02', name: 'Investment Property', evidenceCount: 11, status: 'covered' },
    { id: 'sec-03', name: 'Trade & Other Receivables', evidenceCount: 19, status: 'partial' },
    { id: 'sec-04', name: 'Cash & Cash Equivalents', evidenceCount: 8, status: 'covered' },
    { id: 'sec-05', name: 'Trade & Other Payables', evidenceCount: 16, status: 'covered' },
    { id: 'sec-06', name: 'Provisions', evidenceCount: 7, status: 'covered' },
    { id: 'sec-07', name: 'Revenue', evidenceCount: 28, status: 'covered' },
    { id: 'sec-08', name: 'Expenditure', evidenceCount: 17, status: 'gap' },
  ],
};

export const demoMappingAudit = {
  totalRules: 1247,
  coveragePercent: 88,
  confirmedMappings: 1102,
  pendingConfirmation: 56,
  unmappedAccounts: 89,
  byType: { auto: 720, manual: 382, override: 145 },
  byStatus: { confirmed: 1102, pending: 56, conflict: 12, unmapped: 77 },
  rules: [
    { id: 'm-001', glAccountCode: 'GL-4001', glAccountName: 'Property Rates – Residential', lineItemId: 'li-rev-01', lineItemLabel: 'Property Rates Revenue', mappingType: 'auto', status: 'confirmed', mscoaItemCode: '0100-0100-0001-0000', isAutoSuggested: true, confirmedBy: 'Admin' },
    { id: 'm-002', glAccountCode: 'GL-5101', glAccountName: 'Employee Salaries', lineItemId: 'li-exp-04', lineItemLabel: 'Employee Related Costs', mappingType: 'manual', status: 'confirmed', mscoaItemCode: '4200-0100-0001-0000', isAutoSuggested: false, confirmedBy: 'CFO' },
    { id: 'm-003', glAccountCode: 'GL-9999', glAccountName: 'Suspense Account', lineItemId: '', lineItemLabel: '', mappingType: 'auto', status: 'pending', mscoaItemCode: '', isAutoSuggested: true, confirmedBy: null },
    { id: 'm-004', glAccountCode: 'GL-3500', glAccountName: 'Bulk Electricity Purchases', lineItemId: 'li-exp-08', lineItemLabel: 'Bulk Purchases', mappingType: 'override', status: 'conflict', mscoaItemCode: '4500-0100-0001-0000', isAutoSuggested: false, confirmedBy: null },
  ],
};

export const demoAdjustmentsRegister = {
  total: 22,
  posted: 17,
  unposted: 5,
  netEffectOnSurplus: 184_300,
  netEffectOnNetAssets: 920_500,
  totalDebitPosted: 3_240_000,
  totalCreditPosted: 3_055_700,
  totalDebitUnposted: 612_400,
  totalCreditUnposted: 612_400,
  entries: [
    { id: 'ADJ-001', reference: 'AJE-2026-001', description: 'Reclassification of capital WIP to PPE', type: 'reclassification', status: 'posted', totalDebit: 1_240_000, totalCredit: 1_240_000 },
    { id: 'ADJ-002', reference: 'AJE-2026-002', description: 'Year-end accrual for outstanding invoices', type: 'accrual', status: 'posted', totalDebit: 845_000, totalCredit: 845_000 },
    { id: 'ADJ-003', reference: 'AJE-2026-003', description: 'Depreciation correction for FY 2024/2025', type: 'correction', status: 'unposted', totalDebit: 320_000, totalCredit: 320_000 },
    { id: 'ADJ-004', reference: 'AJE-2026-004', description: 'Provision for doubtful debts uplift', type: 'provision', status: 'posted', totalDebit: 480_000, totalCredit: 480_000 },
    { id: 'ADJ-005', reference: 'AJE-2026-005', description: 'VAT reclass between input and output', type: 'reclassification', status: 'unposted', totalDebit: 92_400, totalCredit: 92_400 },
  ],
};

export const demoIntegrityChecks = {
  checks: [
    { name: 'Trial Balance equilibrium', status: 'passed', detail: 'Debits equal credits' },
    { name: 'mSCOA mapping completeness', status: 'warning', detail: '89 unmapped items' },
    { name: 'GL → AFS reconciliation', status: 'passed', detail: 'All control totals match' },
    { name: 'Asset register vs GL', status: 'failed', detail: 'R 124,500 variance detected' },
    { name: 'Bank reconciliations', status: 'passed', detail: 'All accounts reconciled' },
  ],
};
