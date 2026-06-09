// ────────────────────────────────────────────────────────────────────────────
// Financial Ratios endpoint.
//
// Faithful port of the AFS source NestJS service
//   server/src/modules/reports/ratios.service.ts  (RatiosService.calculateRatios)
// adapted to the monorepo's simplified Express API:
//   • TypeORM queryBuilder → raw SQL via db.ts `query()` on trial_balance_entries
//   • PlatinumArtApiService → the shared `art` client from art.ts (EMS enrichment)
//   • Controller @Get('ratios/:financialYearId') → /api/reports/ratios/:financialYearId
//
// Two-layer model (unchanged from source):
//   Layer 1 — Trial Balance baseline: aggregate trial_balance_entries, bucket by
//             keyword matching on sortDesc / scoaItemShortDesc.
//   Layer 2 — EMS enrichment: when the ART API is configured, real EMS figures
//             (payroll, assets, billing, budget) overwrite the TB-guessed values
//             and `emsEnriched` is set true (drives the green banner).
//
// Note: the monorepo AFS API is single-tenant (the AFS database), so — like the
// dashboard endpoint — we filter by financialYearId only (no tenantId from auth).
// ────────────────────────────────────────────────────────────────────────────
import { query } from './db';
import { art } from './art';

interface EmsEnrichmentData {
  employeeCosts: number | null;
  totalAssetBookValue: number | null;
  billingRevenue: number | null;
  budgetOriginalTotal: number | null;
  budgetAdjustedTotal: number | null;
  assetCount: number;
  employeeCount: number;
  vendorCount: number;
  source: 'ems';
}

interface RatioResult {
  id: number;
  name: string;
  category: string;
  formula: string;
  value: number | null;
  displayValue: string;
  norm: string;
  status: 'green' | 'amber' | 'red' | 'grey';
  description: string;
}

interface CategoryTotals {
  assets: number; currentAssets: number; nonCurrentAssets: number;
  liabilities: number; currentLiabilities: number; nonCurrentLiabilities: number;
  netAssets: number; revenue: number; expenditure: number; gainsLosses: number;
  ppe: number; investmentProperty: number; cash: number; shortTermInvestments: number;
  tradeDebtors: number; tradeCreditors: number; borrowings: number; unspentGrants: number; overdraft: number;
  employeeCosts: number; contractedServices: number; depreciation: number;
  repairsAndMaintenance: number; capitalExpenditure: number;
  grantRevenue: number; ownRevenue: number;
  electricityRevenue: number; electricityExpenditure: number;
  waterRevenue: number; waterExpenditure: number;
  refuseRevenue: number; refuseExpenditure: number;
  sanitationRevenue: number; sanitationExpenditure: number;
  electricityPurchased: number; electricitySold: number;
  waterPurchased: number; waterSold: number;
  irregularExpenditure: number; fruitlessExpenditure: number; unauthorisedExpenditure: number;
  badDebtsWrittenOff: number; badDebtProvision: number;
  billedRevenue: number; openingDebtors: number; closingDebtors: number;
  interestExpense: number; loanRedemption: number;
  budgetCapex: number; budgetOpex: number;
  totalAccounts: number; priorTotalAccounts: number;
  priorRevenue: number; priorOwnRevenue: number;
}

const cache = new Map<string, { data: any; expiry: number }>();

function rangeStatus(value: number | null, low: number, high: number, warnLow: number, warnHigh: number): RatioResult['status'] {
  if (value === null) return 'grey';
  if (value >= low && value <= high) return 'green';
  if (value >= warnLow && value <= warnHigh) return 'amber';
  return 'red';
}
function minStatus(value: number | null, good: number, warn: number): RatioResult['status'] {
  if (value === null) return 'grey';
  if (value >= good) return 'green';
  if (value >= warn) return 'amber';
  return 'red';
}
function maxStatus(value: number | null, good: number, warn: number): RatioResult['status'] {
  if (value === null) return 'grey';
  if (value <= good) return 'green';
  if (value <= warn) return 'amber';
  return 'red';
}

async function getCategoryTotals(financialYearId: string): Promise<CategoryTotals> {
  const rows = await query<any>(
    `SELECT "sortDesc" AS "sortDesc",
            "scoaItemShortDesc" AS itemdesc,
            SUM(COALESCE("openingBalance",0)) AS opening,
            SUM(COALESCE("closingBalance",0)) AS closing,
            SUM(COALESCE("budgetAdjusted",0)) AS budget,
            SUM(COALESCE("priorYear1Balance",0)) AS prior1
       FROM public.trial_balance_entries
      WHERE "financialYearId" = $1
      GROUP BY "sortDesc", "scoaItemShortDesc"`,
    [financialYearId],
  );

  const n = (v: any) => Number(v || 0);
  const bal = (r: any) => n(r.opening) + n(r.closing);

  const bySortDesc = new Map<string, number>();
  const byDesc = new Map<string, number>();
  const byDescBudget = new Map<string, number>();
  const byDescPrior = new Map<string, number>();

  for (const r of rows) {
    const key = (r.sortDesc || '').toLowerCase();
    bySortDesc.set(key, (bySortDesc.get(key) || 0) + bal(r));

    const dk = (r.itemdesc || '').toLowerCase();
    byDesc.set(dk, (byDesc.get(dk) || 0) + bal(r));
    byDescBudget.set(dk, (byDescBudget.get(dk) || 0) + n(r.budget));
    byDescPrior.set(dk, (byDescPrior.get(dk) || 0) + n(r.prior1));
  }

  const find = (keywords: string[], map = byDesc): number => {
    let total = 0;
    for (const [k, v] of map) {
      if (keywords.some(kw => k.includes(kw))) total += v;
    }
    return total;
  };

  const revenue = Math.abs(bySortDesc.get('revenue') || 0);
  const expenditure = Math.abs(bySortDesc.get('expenditure') || 0);
  const assets = Math.abs(bySortDesc.get('assets') || 0);
  const liabilities = Math.abs(bySortDesc.get('liabilities') || 0);
  const netAssetsVal = bySortDesc.get('net assets') || 0;

  const employeeCosts = Math.abs(find(['employee', 'salaries', 'wages', 'personnel']));
  const contractedServices = Math.abs(find(['contracted services', 'outsourced']));
  const depreciation = Math.abs(find(['depreciation', 'amortisation']));
  const rm = Math.abs(find(['repairs', 'maintenance', 'r&m']));
  const ppe = Math.abs(find(['property, plant', 'ppe', 'infrastructure']));
  const ip = Math.abs(find(['investment property']));
  const cash = Math.abs(find(['cash', 'bank']));
  const shortTerm = Math.abs(find(['short-term investment', 'short term investment']));
  const debtors = Math.abs(find(['trade debtor', 'receivable', 'consumer debtor']));
  const creditors = Math.abs(find(['trade creditor', 'payable', 'trade and other payable']));
  const borrowings = Math.abs(find(['borrowing', 'loan', 'long-term debt', 'external loan']));
  const unspentGrants = Math.abs(find(['unspent grant', 'conditional grant', 'unspent conditional']));
  const overdraft = Math.abs(find(['overdraft', 'bank overdraft']));
  const grantRev = Math.abs(find(['grant', 'subsid', 'transfer revenue']));
  const elecRev = Math.abs(find(['electricity revenue', 'electricity sale']));
  const elecExp = Math.abs(find(['electricity purchase', 'electricity cost', 'bulk electricity']));
  const waterRev = Math.abs(find(['water revenue', 'water sale']));
  const waterExp = Math.abs(find(['water purchase', 'water cost', 'bulk water']));
  const refuseRev = Math.abs(find(['refuse revenue', 'refuse sale', 'waste revenue']));
  const refuseExp = Math.abs(find(['refuse cost', 'refuse expenditure', 'waste cost']));
  const sanitationRev = Math.abs(find(['sanitation revenue', 'sewerage revenue']));
  const sanitationExp = Math.abs(find(['sanitation cost', 'sewerage cost']));
  const irregular = Math.abs(find(['irregular expenditure']));
  const fruitless = Math.abs(find(['fruitless', 'wasteful expenditure']));
  const unauthorised = Math.abs(find(['unauthorised expenditure']));
  const badDebtWo = Math.abs(find(['bad debt written off', 'write off', 'write-off']));
  const badDebtProv = Math.abs(find(['bad debt provision', 'provision for bad debt', 'impairment of receivable']));
  const interestExp = Math.abs(find(['interest paid', 'interest expense', 'finance cost']));
  const loanRedemption = Math.abs(find(['loan redemption', 'loan repayment']));

  const currentAssets = Math.abs(find(['current assets', 'current asset']));
  const nonCurrentAssets = assets - currentAssets;
  const currentLiabilities = Math.abs(find(['current liabilities', 'current liability']));
  const nonCurrentLiabilities = liabilities - currentLiabilities;

  const budgetCapex = Math.abs(find(['capital', 'capex'], byDescBudget));
  const budgetOpex = Math.abs(find(['expenditure', 'operating'], byDescBudget)) || Math.abs(byDescBudget.get('expenditure') || 0);

  const priorRevenue = Math.abs(byDescPrior.get('revenue') || find(['revenue'], byDescPrior));

  return {
    assets, currentAssets, nonCurrentAssets,
    liabilities, currentLiabilities, nonCurrentLiabilities,
    netAssets: netAssetsVal, revenue, expenditure,
    gainsLosses: Math.abs(bySortDesc.get('gains and losses') || 0),
    ppe, investmentProperty: ip, cash, shortTermInvestments: shortTerm,
    tradeDebtors: debtors, tradeCreditors: creditors,
    borrowings, unspentGrants, overdraft,
    employeeCosts, contractedServices, depreciation,
    repairsAndMaintenance: rm, capitalExpenditure: ppe * 0.1,
    grantRevenue: grantRev, ownRevenue: revenue - grantRev,
    electricityRevenue: elecRev, electricityExpenditure: elecExp,
    waterRevenue: waterRev, waterExpenditure: waterExp,
    refuseRevenue: refuseRev, refuseExpenditure: refuseExp,
    sanitationRevenue: sanitationRev, sanitationExpenditure: sanitationExp,
    electricityPurchased: elecExp, electricitySold: elecRev,
    waterPurchased: waterExp, waterSold: waterRev,
    irregularExpenditure: irregular, fruitlessExpenditure: fruitless,
    unauthorisedExpenditure: unauthorised,
    badDebtsWrittenOff: badDebtWo, badDebtProvision: badDebtProv,
    billedRevenue: revenue, openingDebtors: debtors * 1.1, closingDebtors: debtors,
    interestExpense: interestExp, loanRedemption,
    budgetCapex, budgetOpex: budgetOpex || expenditure,
    totalAccounts: 0, priorTotalAccounts: 0,
    priorRevenue, priorOwnRevenue: priorRevenue * 0.7,
  };
}

async function enrichWithEmsData(finYear?: string): Promise<EmsEnrichmentData | null> {
  if (!art.isConfigured()) return null;

  try {
    const [payrollSummary, assetSummary, billingSummary, budgetData] = await Promise.all([
      art.getPayrollSummary(finYear).catch(() => null),
      art.getAssetSummary(finYear).catch(() => null),
      art.getBillingSummary(finYear).catch(() => null),
      art.getBudgetDetail(finYear).catch(() => null),
    ]);

    const employeeCosts = payrollSummary ? Number(payrollSummary.totalPayrollCost || 0) : null;
    const totalAssetBookValue = assetSummary ? Number(assetSummary.totalBookValue || 0) : null;
    const billingRevenue = billingSummary ? Number(billingSummary.totalBilled || 0) : null;

    let budgetOriginalTotal: number | null = null;
    let budgetAdjustedTotal: number | null = null;
    if (budgetData) {
      const origRows = budgetData.originalBudget || [];
      const adjRows = budgetData.adjustedBudget || [];
      if (origRows.length > 0) {
        budgetOriginalTotal = origRows.reduce((sum: number, r: any) => sum + Number(r.Amount || r.BudgetAmount || 0), 0);
      }
      if (adjRows.length > 0) {
        budgetAdjustedTotal = adjRows.reduce((sum: number, r: any) => sum + Number(r.Amount || r.BudgetAmount || 0), 0);
      }
    }

    const [assetCount, employeeCount, vendorCount] = await Promise.all([
      art.getAssetCount(finYear),
      art.getActiveEmployeeCount(finYear),
      art.getScmVendorCount(finYear),
    ]);

    return {
      employeeCosts, totalAssetBookValue, billingRevenue,
      budgetOriginalTotal, budgetAdjustedTotal,
      assetCount, employeeCount, vendorCount, source: 'ems',
    };
  } catch {
    return null;
  }
}

function computeAllRatios(t: CategoryTotals): RatioResult[] {
  const ratios: RatioResult[] = [];
  const safe = (num: number, den: number) => den !== 0 ? num / den : null;
  const pct = (num: number, den: number) => { const r = safe(num, den); return r !== null ? r * 100 : null; };
  const safePct = (v: number | null, maxAbs = 1000): number | null => {
    if (v === null) return null;
    if (Math.abs(v) > maxAbs) return null;
    return v;
  };
  const safeVal = (v: number | null, maxAbs = 10000): number | null => {
    if (v === null) return null;
    if (Math.abs(v) > maxAbs) return null;
    return v;
  };
  const fmt = (v: number | null, suffix = '%') => v !== null ? `${v.toFixed(1)}${suffix}` : 'N/A';
  const fmtR = (v: number | null) => v !== null ? v.toFixed(2) : 'N/A';
  const fmtD = (v: number | null) => v !== null ? `${v.toFixed(0)} days` : 'N/A';
  const fmtM = (v: number | null) => v !== null ? `${v.toFixed(1)} months` : 'N/A';

  const totalSpend = t.expenditure + t.capitalExpenditure;

  ratios.push({
    id: 1, name: 'CAPEX as % of Total Spend', category: 'Capital & Asset Management',
    formula: 'Capital Expenditure / (Total Expenditure + CAPEX) × 100',
    value: pct(t.capitalExpenditure, totalSpend), displayValue: fmt(pct(t.capitalExpenditure, totalSpend)),
    norm: '10-20%', status: rangeStatus(pct(t.capitalExpenditure, totalSpend), 10, 20, 5, 25),
    description: 'Proportion of total spending allocated to capital investment',
  });

  ratios.push({
    id: 2, name: 'Asset Impairment %', category: 'Capital & Asset Management',
    formula: 'Total Impairments / Total Assets × 100',
    value: 0, displayValue: '0.0%',
    norm: '0% (lower is better)', status: 'green',
    description: 'Percentage of assets that have been impaired',
  });

  const rmPct = safePct(pct(t.repairsAndMaintenance, t.ppe + t.investmentProperty));
  ratios.push({
    id: 3, name: 'Repairs & Maintenance as % of PPE', category: 'Capital & Asset Management',
    formula: 'R&M Expenditure / (PPE + Investment Property) × 100',
    value: rmPct, displayValue: fmt(rmPct),
    norm: '> 8%', status: minStatus(rmPct, 8, 5),
    description: 'Adequacy of maintenance spending relative to asset base',
  });

  const collectionNum = t.openingDebtors + t.billedRevenue - t.closingDebtors;
  const collectionDen = t.openingDebtors + t.billedRevenue;
  ratios.push({
    id: 4, name: 'Debt Collection Rate', category: 'Revenue & Debtors',
    formula: '(Opening Debtors + Billed - Closing Debtors) / (Opening + Billed) × 100',
    value: pct(collectionNum, collectionDen), displayValue: fmt(pct(collectionNum, collectionDen)),
    norm: '> 95%', status: minStatus(pct(collectionNum, collectionDen), 95, 85),
    description: 'Effectiveness of revenue collection',
  });

  ratios.push({
    id: 5, name: 'Bad Debt Write-Off %', category: 'Revenue & Debtors',
    formula: 'Bad Debts Written Off / Bad Debt Provision × 100',
    value: pct(t.badDebtsWrittenOff, t.badDebtProvision),
    displayValue: fmt(pct(t.badDebtsWrittenOff, t.badDebtProvision)),
    norm: 'Lower is better', status: maxStatus(pct(t.badDebtsWrittenOff, t.badDebtProvision), 50, 80),
    description: 'Bad debts written off relative to provision',
  });

  const netDebtorDays = safe((t.tradeDebtors - t.badDebtProvision), t.billedRevenue / 365);
  ratios.push({
    id: 6, name: 'Net Debtor Days', category: 'Revenue & Debtors',
    formula: '((Gross Debtors - Bad Debt Provision) / Billed Revenue) × 365',
    value: netDebtorDays, displayValue: fmtD(netDebtorDays),
    norm: '< 30 days', status: maxStatus(netDebtorDays, 30, 60),
    description: 'Average days to collect from debtors',
  });

  const monthlyOpex = t.expenditure / 12;
  const cashCover = safe(t.cash - t.unspentGrants - t.overdraft, monthlyOpex);
  ratios.push({
    id: 7, name: 'Cash Coverage (Months)', category: 'Liquidity',
    formula: '(Cash - Unspent Grants - Overdraft) / Monthly Operating Expenditure',
    value: cashCover, displayValue: fmtM(cashCover),
    norm: '> 3 months', status: minStatus(cashCover, 3, 1),
    description: 'Months of operating expenditure covered by available cash',
  });

  const currentRatio = t.currentAssets > 0 && t.currentLiabilities > 0 ? safeVal(safe(t.currentAssets, t.currentLiabilities)) : null;
  ratios.push({
    id: 8, name: 'Current Ratio', category: 'Liquidity',
    formula: 'Current Assets / Current Liabilities',
    value: currentRatio, displayValue: fmtR(currentRatio),
    norm: '1.5 - 2.0', status: rangeStatus(currentRatio, 1.5, 2.0, 1.0, 3.0),
    description: 'Ability to meet short-term obligations',
  });

  const liquidityRatio = t.currentLiabilities > 0 ? safeVal(safe(t.cash + t.shortTermInvestments, t.currentLiabilities)) : null;
  ratios.push({
    id: 9, name: 'Liquidity Ratio', category: 'Liquidity',
    formula: '(Cash + Short-term Investments) / Current Liabilities',
    value: liquidityRatio, displayValue: fmtR(liquidityRatio),
    norm: '> 1.0', status: minStatus(liquidityRatio, 1.0, 0.5),
    description: 'Liquid assets available to cover current liabilities',
  });

  const capitalCost = pct(t.interestExpense + t.loanRedemption, t.revenue);
  ratios.push({
    id: 10, name: 'Capital Cost %', category: 'Debt Management',
    formula: '(Interest + Redemption) / Total Operating Revenue × 100',
    value: capitalCost, displayValue: fmt(capitalCost),
    norm: '< 6%', status: maxStatus(capitalCost, 6, 10),
    description: 'Debt servicing cost as percentage of revenue',
  });

  const debtToRev = pct(t.borrowings, t.revenue);
  ratios.push({
    id: 11, name: 'Debt-to-Revenue Ratio', category: 'Debt Management',
    formula: 'Total Borrowings / Total Operating Revenue × 100',
    value: debtToRev, displayValue: fmt(debtToRev),
    norm: '< 45%', status: maxStatus(debtToRev, 45, 60),
    description: 'Total debt relative to annual revenue',
  });

  const cashBackedDenom = t.netAssets - t.ppe;
  const cashBacked = Math.abs(cashBackedDenom) < 1000 ? null : pct(t.cash - t.overdraft + t.shortTermInvestments - t.unspentGrants, cashBackedDenom);
  const cashBackedSafe = safePct(cashBacked);
  ratios.push({
    id: 12, name: 'Cash-Backed Reserves %', category: 'Debt Management',
    formula: '(Cash - Overdraft + Investments - Unspent Grants) / (Net Assets - PPE) × 100',
    value: cashBackedSafe, displayValue: fmt(cashBackedSafe),
    norm: '> 100%', status: minStatus(cashBackedSafe, 100, 50),
    description: 'Cash backing of non-PPE net assets',
  });

  const netSurplus = pct(t.revenue - t.expenditure, t.revenue);
  ratios.push({
    id: 13, name: 'Net Surplus/Deficit Margin', category: 'Operating Performance',
    formula: '(Total OpRev - Total OpEx) / Total OpRev × 100',
    value: netSurplus, displayValue: fmt(netSurplus),
    norm: '> 0%', status: minStatus(netSurplus, 0, -5),
    description: 'Operating surplus or deficit as percentage of revenue',
  });

  const svcSurplus = (name: string, rev: number, exp: number, id: number): RatioResult => ({
    id, name: `${name} Surplus %`, category: 'Service Delivery',
    formula: `(${name} Revenue - Expenditure) / Revenue × 100`,
    value: pct(rev - exp, rev), displayValue: fmt(pct(rev - exp, rev)),
    norm: '> 0%', status: minStatus(pct(rev - exp, rev), 0, -10),
    description: `${name} service financial sustainability`,
  });

  ratios.push(svcSurplus('Electricity', t.electricityRevenue, t.electricityExpenditure, 14));
  ratios.push(svcSurplus('Water', t.waterRevenue, t.waterExpenditure, 15));
  ratios.push(svcSurplus('Refuse', t.refuseRevenue, t.refuseExpenditure, 16));
  ratios.push(svcSurplus('Sanitation', t.sanitationRevenue, t.sanitationExpenditure, 17));

  const totalSvcRev = t.electricityRevenue + t.waterRevenue + t.refuseRevenue + t.sanitationRevenue;
  const totalSvcExp = t.electricityExpenditure + t.waterExpenditure + t.refuseExpenditure + t.sanitationExpenditure;
  ratios.push({
    id: 18, name: 'Overall Service Surplus %', category: 'Service Delivery',
    formula: '(Total Service Revenue - Expenditure) / Revenue × 100',
    value: pct(totalSvcRev - totalSvcExp, totalSvcRev),
    displayValue: fmt(pct(totalSvcRev - totalSvcExp, totalSvcRev)),
    norm: '> 0%', status: minStatus(pct(totalSvcRev - totalSvcExp, totalSvcRev), 0, -10),
    description: 'Combined service delivery financial sustainability',
  });

  const elecLoss = pct(t.electricityPurchased - t.electricitySold, t.electricityPurchased);
  ratios.push({
    id: 19, name: 'Electricity Distribution Losses', category: 'Service Delivery',
    formula: '(Purchased - Sold) / Purchased × 100',
    value: elecLoss, displayValue: fmt(elecLoss),
    norm: '< 10%', status: maxStatus(elecLoss, 10, 15),
    description: 'Electricity lost in distribution network',
  });

  const waterLoss = pct(t.waterPurchased - t.waterSold, t.waterPurchased);
  ratios.push({
    id: 20, name: 'Water Distribution Losses', category: 'Service Delivery',
    formula: '(Purchased - Sold) / Purchased × 100',
    value: waterLoss, displayValue: fmt(waterLoss),
    norm: '< 30%', status: maxStatus(waterLoss, 30, 40),
    description: 'Water lost in distribution network',
  });

  ratios.push({
    id: 21, name: 'Consumer Account Growth', category: 'Growth',
    formula: '(Current Accounts - Prior Accounts) / Prior Accounts × 100',
    value: null, displayValue: 'N/A',
    norm: '> 0%', status: 'grey',
    description: 'Growth in consumer account base (requires account register data)',
  });

  const revGrowth = pct(t.revenue - Math.abs(t.priorRevenue), Math.abs(t.priorRevenue));
  ratios.push({
    id: 22, name: 'Total Revenue Growth', category: 'Growth',
    formula: '(Current Revenue - Prior Revenue) / Prior Revenue × 100',
    value: revGrowth, displayValue: fmt(revGrowth),
    norm: '> CPI (typically 5-7%)', status: minStatus(revGrowth, 5, 0),
    description: 'Year-on-year revenue growth rate',
  });

  const ownRevGrowth = pct(t.ownRevenue - Math.abs(t.priorOwnRevenue), Math.abs(t.priorOwnRevenue));
  ratios.push({
    id: 23, name: 'Own Revenue Growth', category: 'Growth',
    formula: '(Current Own Revenue - Prior Own Revenue) / Prior Own Revenue × 100',
    value: ownRevGrowth, displayValue: fmt(ownRevGrowth),
    norm: '> CPI', status: minStatus(ownRevGrowth, 5, 0),
    description: 'Growth in municipality-generated revenue',
  });

  const creditorDays = safe(t.tradeCreditors, t.expenditure / 365);
  ratios.push({
    id: 24, name: 'Creditor Payment Days', category: 'Creditors & Compliance',
    formula: 'Trade Creditors / (Credit Purchases / 365)',
    value: creditorDays, displayValue: fmtD(creditorDays),
    norm: '< 30 days', status: maxStatus(creditorDays, 30, 60),
    description: 'Average days to pay creditors',
  });

  const ifwPct = pct(t.irregularExpenditure + t.fruitlessExpenditure + t.unauthorisedExpenditure, t.expenditure);
  ratios.push({
    id: 25, name: 'IFW Expenditure %', category: 'Creditors & Compliance',
    formula: '(Irregular + Fruitless + Unauthorised) / Total OpEx × 100',
    value: ifwPct, displayValue: fmt(ifwPct),
    norm: '0%', status: ifwPct !== null && ifwPct <= 0.1 ? 'green' : ifwPct !== null && ifwPct <= 2 ? 'amber' : ifwPct !== null ? 'red' : 'grey',
    description: 'Non-compliant expenditure as percentage of total',
  });

  const salaryPct = pct(t.employeeCosts, t.expenditure);
  ratios.push({
    id: 26, name: 'Salaries & Wages %', category: 'Cost Structure',
    formula: 'Employee Costs / Total OpEx × 100',
    value: salaryPct, displayValue: fmt(salaryPct),
    norm: '< 35%', status: maxStatus(salaryPct, 35, 40),
    description: 'Employee costs as proportion of total expenditure',
  });

  const contractPct = pct(t.contractedServices, t.expenditure);
  ratios.push({
    id: 27, name: 'Contracted Services %', category: 'Cost Structure',
    formula: 'Contracted Services / Total OpEx × 100',
    value: contractPct, displayValue: fmt(contractPct),
    norm: 'Monitor (< 20%)', status: maxStatus(contractPct, 20, 30),
    description: 'Outsourced services as proportion of total expenditure',
  });

  const ownFundedCapex = t.capitalExpenditure - (t.grantRevenue * 0.3);
  const ownCapexPct = pct(Math.max(ownFundedCapex, 0), t.capitalExpenditure);
  ratios.push({
    id: 28, name: 'Own-Funded CAPEX %', category: 'Capital Funding',
    formula: 'Own-Funded CAPEX / Total CAPEX × 100',
    value: ownCapexPct, displayValue: fmt(ownCapexPct),
    norm: '> 20%', status: minStatus(ownCapexPct, 20, 10),
    description: 'Capital expenditure funded from own resources',
  });

  const grantCapexPct = pct(t.grantRevenue * 0.3, t.capitalExpenditure);
  ratios.push({
    id: 29, name: 'Grant-Funded CAPEX %', category: 'Capital Funding',
    formula: 'Grant-Funded CAPEX / Total CAPEX × 100',
    value: grantCapexPct, displayValue: fmt(grantCapexPct),
    norm: 'Monitoring', status: 'green',
    description: 'Capital expenditure funded from government grants',
  });

  const ownRevPct = pct(t.ownRevenue, t.revenue);
  ratios.push({
    id: 30, name: 'Own Revenue %', category: 'Capital Funding',
    formula: 'Own Revenue / Total Revenue × 100',
    value: ownRevPct, displayValue: fmt(ownRevPct),
    norm: '> 60%', status: minStatus(ownRevPct, 60, 40),
    description: 'Financial independence — revenue from own sources',
  });

  const capexImpl = pct(t.capitalExpenditure, t.budgetCapex);
  ratios.push({
    id: 31, name: 'CAPEX Budget Implementation', category: 'Budget Implementation',
    formula: 'Actual CAPEX / Budget CAPEX × 100',
    value: capexImpl, displayValue: fmt(capexImpl),
    norm: '90-100%', status: rangeStatus(capexImpl, 90, 100, 70, 110),
    description: 'Capital budget execution rate',
  });

  const opexImpl = pct(t.expenditure, t.budgetOpex);
  ratios.push({
    id: 32, name: 'OPEX Budget Implementation', category: 'Budget Implementation',
    formula: 'Actual OpEx / Budget OpEx × 100',
    value: opexImpl, displayValue: fmt(opexImpl),
    norm: '95-100%', status: rangeStatus(opexImpl, 95, 100, 85, 105),
    description: 'Operating budget execution rate',
  });

  return ratios;
}

function groupByCategory(ratios: RatioResult[]) {
  const groups: Record<string, RatioResult[]> = {};
  for (const r of ratios) {
    if (!groups[r.category]) groups[r.category] = [];
    groups[r.category].push(r);
  }
  return Object.entries(groups).map(([name, items]) => ({
    name,
    ratios: items,
    green: items.filter(r => r.status === 'green').length,
    amber: items.filter(r => r.status === 'amber').length,
    red: items.filter(r => r.status === 'red').length,
  }));
}

export async function calculateRatios(financialYearId: string) {
  const cacheKey = financialYearId;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) return cached.data;

  const totals = await getCategoryTotals(financialYearId);

  let emsEnriched = false;
  try {
    const emsData = await enrichWithEmsData(financialYearId);
    if (emsData) {
      if (emsData.employeeCosts !== null && emsData.employeeCosts > 0) totals.employeeCosts = emsData.employeeCosts;
      if (emsData.totalAssetBookValue !== null && emsData.totalAssetBookValue > 0) totals.ppe = emsData.totalAssetBookValue;
      if (emsData.billingRevenue !== null && emsData.billingRevenue > 0) totals.billedRevenue = emsData.billingRevenue;
      if (emsData.budgetAdjustedTotal !== null && emsData.budgetAdjustedTotal > 0) totals.budgetOpex = emsData.budgetAdjustedTotal;
      emsEnriched = true;
    }
  } catch {
    /* EMS enrichment is best-effort — fall back to the TB baseline */
  }

  const ratios = computeAllRatios(totals);

  const greenCount = ratios.filter(r => r.status === 'green').length;
  const amberCount = ratios.filter(r => r.status === 'amber').length;
  const redCount = ratios.filter(r => r.status === 'red').length;
  const scored = ratios.filter(r => r.status !== 'grey');
  const overallScore = scored.length > 0
    ? Math.round((greenCount * 100 + amberCount * 50) / scored.length)
    : 0;

  const result = {
    financialYearId,
    overallScore,
    totalRatios: ratios.length,
    green: greenCount,
    amber: amberCount,
    red: redCount,
    grey: ratios.length - scored.length,
    ratios,
    categories: groupByCategory(ratios),
    emsEnriched,
  };

  cache.set(cacheKey, { data: result, expiry: Date.now() + 60000 });
  return result;
}
