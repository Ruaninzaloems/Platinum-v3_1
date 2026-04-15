export interface FinancialYear {
  id: number;
  yearCode: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface BudgetVersionSummary {
  id: number;
  financialYear: string;
  versionType: string;
  versionName: string;
  description: string;
  status: string;
  parentVersionId: number | null;
  councilAdoptionDate: string | null;
  lgdrsSubmissionRef: string | null;
  lockedBy: string | null;
  lockedOn: string | null;
  createdBy: string;
  createdOn: string;
  totalStrings: number;
  totalYear1: number;
  totalYear2: number;
  totalYear3: number;
}

export interface BudgetVersionDetail extends BudgetVersionSummary {
  financialYearId: number;
  parentVersionName: string | null;
  totalRevenue: number;
  totalExpenditure: number;
  totalCapital: number;
  approvals: Approval[];
}

export interface Approval {
  id: number;
  entityType: string;
  step: number;
  decision: string;
  comment: string | null;
  userId: string;
  userName: string;
  timestamp: string;
}

export interface BudgetStringList {
  id: number;
  budgetVersionId: number;
  projectId: number | null;
  projectCode: string | null;
  projectName: string | null;
  sourceModule: string;
  segmentString: string;
  itemCode: string;
  itemDescription: string;
  fundCode: string;
  fundDescription: string;
  functionCode: string;
  functionDescription: string;
  projectSegCode: string;
  projectSegDescription: string;
  regionCode: string;
  regionDescription: string;
  costingCode: string;
  costingDescription: string;
  mscCode: string;
  mscDescription: string;
  year1Amount: number;
  year2Amount: number;
  year3Amount: number;
  description: string | null;
  createdOn: string;
}

export interface ScoaSegment {
  id: number;
  code: string;
  description: string;
  parentId: number | null;
  level: number;
  isActive: boolean;
}

export interface ValidationRun {
  runId: string;
  budgetVersionId: number;
  totalStrings: number;
  passed: number;
  warnings: number;
  errors: number;
  results: ValidationResultItem[];
}

export interface ValidationResultItem {
  id: number;
  budgetStringId: number | null;
  segmentString: string | null;
  status: string;
  ruleCode: string;
  message: string;
  suggestedFix: string | null;
  timestamp: string;
}

export interface VirementListItem {
  id: number;
  virementNumber: string;
  budgetVersionId: number;
  budgetVersionName: string;
  status: string;
  fromSegmentString: string;
  toSegmentString: string;
  amount: number;
  motivation: string;
  thresholdExceeded: boolean;
  createdBy: string;
  createdOn: string;
  approvedBy: string | null;
  approvedOn: string | null;
}

export interface CfoDashboard {
  totalBudgetYear1: number;
  totalRevenueYear1: number;
  totalExpenditureYear1: number;
  totalCapitalYear1: number;
  operatingBudgetYear1: number;
  unfundedMandateCount: number;
  burnRatePercentage: number;
  activeVersions: number;
  pendingApprovals: number;
  validationErrors: number;
  byDepartment: DepartmentBudget[];
  byFunction: FunctionBudget[];
  monthlyTrend: MonthlyTrend[];
  versionStatuses: VersionStatus[];
}

export interface DepartmentBudget {
  department: string;
  revenue: number;
  expenditure: number;
  capital: number;
}

export interface FunctionBudget {
  function: string;
  year1: number;
  year2: number;
  year3: number;
}

export interface MonthlyTrend {
  month: string;
  budget: number;
  actual: number;
}

export interface VersionStatus {
  id: number;
  name: string;
  type: string;
  status: string;
  createdOn: string;
  stringCount: number;
}

export interface ProjectItem {
  id: number;
  projectCode: string;
  projectName: string;
  description: string | null;
  idpLink: string | null;
  idpPriorityArea: string | null;
  idpStrategicObjective: string | null;
  status: string;
  type: string;
  departmentId: number | null;
  departmentName: string | null;
  ward: string | null;
  gpsCoordinates: string | null;
  projectManager: string | null;
  contractorName: string | null;
  contractNumber: string | null;
  fundingSource: string | null;
  startDate: string | null;
  endDate: string | null;
  totalProjectCost: number | null;
  totalBudgetYear1: number;
  totalBudgetYear2: number;
  totalBudgetYear3: number;
  budgetLineCount: number;
  scoaLineCount: number;
  createdOn: string;
  budgetLines: ProjectBudgetLine[] | null;
}

export interface ProjectBudgetLine {
  id: number;
  projectId: number;
  scoaItemId: number;
  scoaItemCode: string | null;
  scoaItemDescription: string | null;
  scoaFundId: number;
  scoaFundCode: string | null;
  scoaFundDescription: string | null;
  scoaFunctionId: number;
  scoaFunctionCode: string | null;
  scoaFunctionDescription: string | null;
  scoaRegionId: number;
  scoaRegionCode: string | null;
  scoaRegionDescription: string | null;
  scoaCostingId: number;
  scoaCostingCode: string | null;
  scoaCostingDescription: string | null;
  departmentId: number | null;
  departmentName: string | null;
  year1Amount: number;
  year2Amount: number;
  year3Amount: number;
  month01: number; month02: number; month03: number; month04: number;
  month05: number; month06: number; month07: number; month08: number;
  month09: number; month10: number; month11: number; month12: number;
}

export interface ValidationDashboard {
  totalRuns: number;
  totalStringsValidated: number;
  passCount: number;
  warningCount: number;
  errorCount: number;
  passPercentage: number;
  topFailures: RuleFailure[];
  recentRuns: ValidationTrend[];
}

export interface RuleFailure {
  ruleCode: string;
  description: string;
  count: number;
  severity: string;
}

export interface ValidationTrend {
  runId: string;
  timestamp: string;
  passed: number;
  warnings: number;
  errors: number;
}

export interface BudgetOverview {
  versionId: number;
  versionName: string;
  versionType: string;
  status: string;
  totalRevenue: number;
  totalExpenditure: number;
  totalCapital: number;
  netSurplusDeficit: number;
  year1Total: number;
  year2Total: number;
  year3Total: number;
  byItem: SegmentBreakdown[];
  byFund: SegmentBreakdown[];
}

export interface SegmentBreakdown {
  code: string;
  description: string;
  year1: number;
  year2: number;
  year3: number;
}

export interface MtrefSummary {
  category: string;
  subCategory: string;
  year1: number;
  year2: number;
  year3: number;
  year1Variance: number;
  year2Variance: number;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  isEnabled: boolean;
}

export interface ServiceCategory {
  id: number;
  code: string;
  name: string;
  type: string;
  measurementUnit: string;
  isActive: boolean;
  tariffCount: number;
}

export interface Tariff {
  id: number;
  serviceCategoryId: number;
  serviceCategoryName: string;
  name: string;
  propertyCategory: string;
  tariffType: string;
  basicCharge: number;
  unitRate: number;
  blockStart: number | null;
  blockEnd: number | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  isApproved: boolean;
  financialYearId: number;
}

export interface TariffScenarioSummary {
  id: number;
  name: string;
  status: string;
  baseIncreasePercentage: number;
  totalCurrentRevenue: number;
  totalProjectedRevenue: number;
  totalVariance: number;
  lineCount: number;
  createdOn: string;
}

export interface TariffScenario {
  id: number;
  name: string;
  description: string | null;
  financialYearId: number;
  financialYear: string;
  status: string;
  baseIncreasePercentage: number;
  justification: string | null;
  createdBy: string;
  createdOn: string;
  approvedBy: string | null;
  approvedOn: string | null;
  lines: TariffScenarioLine[];
}

export interface TariffScenarioLine {
  id: number;
  serviceCategoryId: number;
  serviceCategoryName: string;
  serviceType: string;
  baseTariffId: number | null;
  currentUnitRate: number;
  currentBasicCharge: number;
  projectedUnitRate: number;
  projectedBasicCharge: number;
  increasePercent: number;
  currentRevenue: number;
  projectedRevenue: number;
  varianceAmount: number;
  variancePercent: number;
  isMaterialShift: boolean;
}

export interface ScenarioComparison {
  scenarios: ScenarioComparisonEntry[];
  serviceComparisons: ServiceComparisonRow[];
}

export interface ScenarioComparisonEntry {
  id: number;
  name: string;
  baseIncreasePercentage: number;
  totalCurrentRevenue: number;
  totalProjectedRevenue: number;
  totalVariance: number;
  totalVariancePercent: number;
}

export interface ServiceComparisonRow {
  serviceCategoryId: number;
  serviceCategoryName: string;
  currentRevenue: number;
  scenarioRevenues: ScenarioRevenueEntry[];
}

export interface ScenarioRevenueEntry {
  scenarioId: number;
  scenarioName: string;
  projectedRevenue: number;
  variance: number;
  variancePercent: number;
}

export interface ConsumerCategory {
  id: number;
  name: string;
  type: string;
  consumerCount: number;
  avgMonthlyConsumption: number;
  propertyValueMin: number | null;
  propertyValueMax: number | null;
  geographicArea: string | null;
  isActive: boolean;
  isFlagged: boolean;
  services: ConsumerService[];
}

export interface ConsumerService {
  id: number;
  serviceCategoryId: number;
  serviceCategoryName: string;
  avgConsumption: number;
  consumerCount: number;
}

export interface ProjectedBill {
  consumerCategoryId: number;
  consumerCategoryName: string;
  consumerType: string;
  billLines: ProjectedBillLine[];
  totalCurrentBill: number;
  totalProjectedBill: number;
  totalRebate: number;
  netBill: number;
}

export interface ProjectedBillLine {
  serviceCategoryId: number;
  serviceCategoryName: string;
  currentRate: number;
  projectedRate: number;
  consumption: number;
  currentAmount: number;
  projectedAmount: number;
  rebateAmount: number;
  netAmount: number;
}

export interface RevenueProjection {
  id: number;
  financialYearId: number;
  budgetVersionId: number | null;
  serviceCategoryId: number;
  serviceCategoryName: string;
  serviceType: string;
  consumerCategoryId: number | null;
  consumerCategoryName: string | null;
  tariffScenarioId: number | null;
  consumerCount: number;
  avgConsumption: number;
  tariffRate: number;
  grossRevenue: number;
  rebateAmount: number;
  netRevenue: number;
  year1Amount: number;
  year2Amount: number;
  year3Amount: number;
  month01: number; month02: number; month03: number; month04: number;
  month05: number; month06: number; month07: number; month08: number;
  month09: number; month10: number; month11: number; month12: number;
  status: string;
  scoaItemCode: string | null;
  scoaFundCode: string | null;
  scoaFunctionCode: string | null;
  scoaRegionCode: string | null;
  scoaCostingCode: string | null;
}

export interface RevenueProjectionSummary {
  totalGrossRevenue: number;
  totalRebateAmount: number;
  totalNetRevenue: number;
  year1Total: number;
  year2Total: number;
  year3Total: number;
  byService: RevenueByService[];
}

export interface RevenueByService {
  serviceCategoryId: number;
  serviceCategoryName: string;
  serviceType: string;
  grossRevenue: number;
  rebateAmount: number;
  netRevenue: number;
  year1Amount: number;
  year2Amount: number;
  year3Amount: number;
}

export interface RebateType {
  id: number;
  name: string;
  category: string;
  serviceCategoryId: number | null;
  serviceCategoryName: string | null;
  rebatePercent: number;
  fixedAmount: number | null;
  isActive: boolean;
}

export interface RebateProjection {
  id: number;
  financialYearId: number;
  rebateTypeId: number;
  rebateTypeName: string;
  rebateCategory: string;
  serviceCategoryId: number | null;
  serviceCategoryName: string | null;
  eligibleCount: number;
  projectedUptakePercent: number;
  totalRebateAmount: number;
  year1Amount: number;
  year2Amount: number;
  year3Amount: number;
  status: string;
}

export interface DraftRevenueBudget {
  totalGrossRevenue: number;
  totalRebates: number;
  totalNetRevenue: number;
  year1Total: number;
  year2Total: number;
  year3Total: number;
  lines: DraftRevenueLine[];
  budgetStringsGenerated: number;
}

export interface DraftRevenueLine {
  serviceCategoryId: number;
  serviceCategoryName: string;
  serviceType: string;
  scoaItemCode: string | null;
  scoaItemDescription: string | null;
  scoaFundCode: string | null;
  scoaFunctionCode: string | null;
  grossRevenue: number;
  rebates: number;
  netRevenue: number;
  year1Amount: number;
  year2Amount: number;
  year3Amount: number;
}

export interface BillingIntegrationStatus {
  status: string;
  projectionsApproved: number;
  projectionsPending: number;
  rebatesApproved: number;
  rebatesPending: number;
  budgetStringsGenerated: number;
  lastSyncOn: string | null;
}

export interface ExpenditureCategory {
  id: number;
  code: string;
  name: string;
  type: string;
  department: string | null;
  measurementUnit: string;
  isActive: boolean;
  costItemCount: number;
}

export interface CostItem {
  id: number;
  expenditureCategoryId: number;
  expenditureCategoryName: string;
  name: string;
  itemType: string;
  basicCost: number;
  unitRate: number;
  vatIndicator: string;
  blockStart: number | null;
  blockEnd: number | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  isApproved: boolean;
  financialYearId: number;
  supplierName: string | null;
  supplierVatNumber: string | null;
  contractReference: string | null;
  isVariabilityFlagged: boolean;
  variabilityType: string | null;
}

export interface ExpenditureScenarioSummary {
  id: number;
  name: string;
  status: string;
  baseInflationPercent: number;
  totalCurrentExpenditure: number;
  totalProjectedExpenditure: number;
  totalVariance: number;
  lineCount: number;
  createdOn: string;
}

export interface ExpenditureScenario {
  id: number;
  name: string;
  description: string | null;
  financialYearId: number;
  financialYear: string;
  status: string;
  baseInflationPercent: number;
  demandAdjustmentPercent: number | null;
  justification: string | null;
  createdBy: string;
  createdOn: string;
  approvedBy: string | null;
  approvedOn: string | null;
  lines: ExpenditureScenarioLine[];
}

export interface ExpenditureScenarioLine {
  id: number;
  expenditureCategoryId: number;
  expenditureCategoryName: string;
  expenditureCategoryType: string;
  baseCostItemId: number | null;
  currentUnitRate: number;
  currentBasicCost: number;
  projectedUnitRate: number;
  projectedBasicCost: number;
  inflationPercent: number;
  demandAdjustmentPercent: number;
  currentExpenditure: number;
  projectedExpenditure: number;
  varianceAmount: number;
  variancePercent: number;
  isMaterialShift: boolean;
}

export interface ExpenditureScenarioComparison {
  scenarios: ExpScenarioComparisonEntry[];
  categoryComparisons: CategoryComparisonRow[];
}

export interface ExpScenarioComparisonEntry {
  id: number;
  name: string;
  baseInflationPercent: number;
  totalCurrentExpenditure: number;
  totalProjectedExpenditure: number;
  totalVariance: number;
  totalVariancePercent: number;
}

export interface CategoryComparisonRow {
  expenditureCategoryId: number;
  expenditureCategoryName: string;
  currentExpenditure: number;
  scenarioExpenditures: ScenarioExpenditureEntry[];
}

export interface ScenarioExpenditureEntry {
  scenarioId: number;
  scenarioName: string;
  projectedExpenditure: number;
  variance: number;
  variancePercent: number;
}

export interface CreditorCategoryDetail {
  id: number;
  name: string;
  type: string;
  paymentTermDays: number;
  interestRate: number | null;
  chargesInterest: boolean;
  interestCalculationMethod: string | null;
  isActive: boolean;
  items: CreditorCategoryItem[];
}

export interface CreditorCategoryItem {
  id: number;
  creditorCategoryId: number;
  expenditureCategoryId: number;
  expenditureCategoryName: string;
  paymentRate30Days: number;
  paymentRate60Days: number;
  paymentRate90Days: number;
  paymentRateOver90Days: number;
}

export interface ExpenditureProjection {
  id: number;
  financialYearId: number;
  budgetVersionId: number | null;
  expenditureCategoryId: number;
  expenditureCategoryName: string;
  expenditureCategoryType: string;
  costItemId: number | null;
  costItemName: string | null;
  expenditureScenarioId: number | null;
  unitRate: number;
  basicCost: number;
  grossExpenditure: number;
  vatAmount: number;
  netExpenditure: number;
  year1Amount: number;
  year2Amount: number;
  year3Amount: number;
  month01: number; month02: number; month03: number; month04: number;
  month05: number; month06: number; month07: number; month08: number;
  month09: number; month10: number; month11: number; month12: number;
  status: string;
  scoaItemCode: string | null;
  scoaFundCode: string | null;
  scoaFunctionCode: string | null;
  scoaRegionCode: string | null;
  scoaCostingCode: string | null;
}

export interface ExpenditureProjectionSummary {
  totalGrossExpenditure: number;
  totalVatAmount: number;
  totalNetExpenditure: number;
  year1Total: number;
  year2Total: number;
  year3Total: number;
  byCategory: ExpenditureByCategoryItem[];
}

export interface ExpenditureByCategoryItem {
  expenditureCategoryId: number;
  expenditureCategoryName: string;
  expenditureCategoryType: string;
  grossExpenditure: number;
  vatAmount: number;
  netExpenditure: number;
  year1Amount: number;
  year2Amount: number;
  year3Amount: number;
}

export interface CreditorLiabilitySummary {
  totalOpeningBalance: number;
  totalProjectedExpenditure: number;
  totalProjectedPayments: number;
  totalClosingBalance: number;
  year1Total: number;
  year2Total: number;
  year3Total: number;
  liabilityCount: number;
  liabilities: CreditorLiabilityItem[];
}

export interface CreditorLiabilityItem {
  id: number;
  financialYearId: number;
  expenditureCategoryId: number;
  expenditureCategoryName: string;
  creditorCategoryId: number | null;
  creditorCategoryName: string | null;
  liabilityType: string;
  openingBalance: number;
  projectedExpenditure: number;
  projectedPayments: number;
  closingBalance: number;
  paymentRate: number;
  contraBankAccount: string | null;
  isPriorYearLiability: boolean;
  year1Amount: number;
  year2Amount: number;
  year3Amount: number;
  status: string;
  scoaItemCode: string | null;
  scoaFundCode: string | null;
  scoaFunctionCode: string | null;
  scoaRegionCode: string | null;
}

export interface CreditorPaymentArrangement {
  id: number;
  creditorName: string;
  referenceNumber: string;
  totalOutstanding: number;
  instalmentAmount: number;
  paymentIntervalDays: number;
  remainingBalance: number;
  interestRate: number | null;
  arrangementStatus: string;
  startDate: string;
  endDate: string | null;
  expenditureCategoryId: number | null;
  expenditureCategoryName: string | null;
}

export interface ForecastAssumption {
  id: number;
  name: string;
  assumptionType: string;
  financialYearId: number;
  year1Value: number;
  year2Value: number;
  year3Value: number;
  category: string | null;
  justification: string | null;
  version: number;
  isActive: boolean;
}

export interface DraftExpenditureBudget {
  totalGrossExpenditure: number;
  totalVat: number;
  totalNetExpenditure: number;
  year1Total: number;
  year2Total: number;
  year3Total: number;
  lines: DraftExpenditureLine[];
  budgetStringsGenerated: number;
}

export interface DraftExpenditureLine {
  expenditureCategoryId: number;
  expenditureCategoryName: string;
  expenditureCategoryType: string;
  scoaItemCode: string | null;
  scoaItemDescription: string | null;
  scoaFundCode: string | null;
  scoaFunctionCode: string | null;
  grossExpenditure: number;
  vat: number;
  netExpenditure: number;
  year1Amount: number;
  year2Amount: number;
  year3Amount: number;
}

export interface CreditorsIntegrationStatus {
  status: string;
  projectionsApproved: number;
  projectionsPending: number;
  liabilitiesApproved: number;
  liabilitiesPending: number;
  budgetStringsGenerated: number;
  lastSyncOn: string | null;
}

export interface AgeAnalysis {
  category: string;
  current: number;
  thirtyDay: number;
  sixtyDay: number;
  ninetyPlusDay: number;
  total: number;
}

export interface SensitivityAnalysis {
  parameterName: string;
  baseValue: number;
  lowValue: number;
  highValue: number;
  baseExpenditure: number;
  lowExpenditure: number;
  highExpenditure: number;
  sensitivity: number;
}

export interface PostEstablishment {
  id: number;
  postCode: string;
  title: string;
  department: string | null;
  jobLevel: string | null;
  salaryGrade: number | null;
  salaryNotch: number | null;
  employmentType: string;
  status: string;
  isFunded: boolean;
  isActive: boolean;
  fundingSource: string | null;
  plannedStartDate: string | null;
  rankingScore: number;
  priorityStatus: string;
  recruitmentStrategy: string | null;
  jobDescription: string | null;
  bargainingUnit: string | null;
  employeeCategory: string | null;
  annualSalary: number;
  totalCostToMunicipality: number;
  financialYearId: number;
  scoaItemCode: string | null;
  scoaFundCode: string | null;
  scoaFunctionCode: string | null;
  scoaRegionCode: string | null;
  scoaCostingCode: string | null;
  createdBy: string;
  createdOn: string;
  modifiedBy: string | null;
  modifiedOn: string | null;
}

export interface SalaryStructure {
  id: number;
  grade: number;
  notch: number;
  annualAmount: number;
  hourlyRate: number | null;
  effectiveDate: string;
  bargainingUnit: string | null;
  employeeCategory: string | null;
  jobLevel: string | null;
  isActive: boolean;
  createdBy: string;
  createdOn: string;
}

export interface SalaryIncrease {
  id: number;
  employeeCategory: string | null;
  bargainingUnit: string | null;
  postLevel: string | null;
  increasePercentage: number;
  effectiveDate: string;
  financialYearId: number;
  isNotchProgression: boolean;
  isLocked: boolean;
  approvedBy: string | null;
  approvedOn: string | null;
  createdBy: string;
  createdOn: string;
}

export interface TemporaryContract {
  id: number;
  employeeName: string;
  postCode: string | null;
  department: string | null;
  jobTitle: string | null;
  contractStartDate: string;
  contractEndDate: string;
  remunerationType: string;
  rate: number;
  calculatedBudget: number;
  contractStatus: string | null;
  financialYearId: number;
  scoaItemCode: string | null;
  scoaFundCode: string | null;
  scoaFunctionCode: string | null;
  createdBy: string;
  createdOn: string;
}

export interface CouncillorPosition {
  id: number;
  positionTitle: string;
  councillorType: string;
  numberOfPositions: number;
  basicSalary: number;
  travelAllowance: number;
  cellphoneAllowance: number;
  medicalContribution: number;
  otherBenefits: number;
  totalRemuneration: number;
  anticipatedIncreasePercent: number;
  adjustedTotalRemuneration: number;
  gazettedUpperLimit: number;
  exceedsUpperLimit: boolean;
  financialYearId: number;
  scoaItemCode: string | null;
  scoaFundCode: string | null;
  scoaFunctionCode: string | null;
  scoaRegionCode: string | null;
  createdBy: string;
  createdOn: string;
}

export interface WardCommitteeBudget {
  id: number;
  wardNumber: number;
  wardName: string | null;
  region: string | null;
  numberOfMembers: number;
  numberOfMeetings: number;
  ratePerMeeting: number;
  anticipatedRateIncreasePercent: number;
  adjustedRatePerMeeting: number;
  totalEstimatedCost: number;
  financialYearId: number;
  scoaItemCode: string | null;
  scoaFundCode: string | null;
  scoaFunctionCode: string | null;
  scoaRegionCode: string | null;
  createdBy: string;
  createdOn: string;
}

export interface VariableBenefitHours {
  id: number;
  department: string | null;
  benefitType: string;
  estimatedHours: number;
  averageRate: number;
  calculatedCost: number;
  historicalHours: number | null;
  historicalCost: number | null;
  variancePercent: number | null;
  financialYearId: number;
  scoaItemCode: string | null;
  scoaFundCode: string | null;
  scoaFunctionCode: string | null;
  createdBy: string;
  createdOn: string;
}

export interface TravelRequirement {
  id: number;
  department: string | null;
  projectReference: string | null;
  destination: string | null;
  purposeOfTravel: string | null;
  numberOfOfficials: number;
  numberOfTrips: number;
  estimatedKilometres: number;
  accommodationNights: number;
  travelDuration: number;
  transportMode: string;
  estimatedCost: number;
  financialYearId: number;
  scoaItemCode: string | null;
  scoaFundCode: string | null;
  scoaFunctionCode: string | null;
  scoaProjectCode: string | null;
  scoaRegionCode: string | null;
  createdBy: string;
  createdOn: string;
}

export interface TravelStandardRate {
  id: number;
  rateType: string;
  classification: string;
  employeeLevel: string | null;
  rateAmount: number;
  effectiveDate: string;
  policyReference: string | null;
  isActive: boolean;
  createdBy: string;
  createdOn: string;
}

export interface StatutoryDeduction {
  id: number;
  deductionType: string;
  calculationMethod: string;
  rate: number;
  threshold: number | null;
  employerContributionRate: number | null;
  description: string | null;
  isActive: boolean;
  createdBy: string;
  createdOn: string;
}

export interface PayrollLiability {
  id: number;
  liabilityType: string;
  department: string | null;
  employeeContribution: number;
  employerContribution: number;
  totalLiability: number;
  paymentPeriod: string | null;
  financialYearId: number;
  scoaItemCode: string | null;
  scoaFundCode: string | null;
  scoaFunctionCode: string | null;
  scoaRegionCode: string | null;
  createdBy: string;
  createdOn: string;
}

export interface DefinedBenefitObligation {
  id: number;
  benefitType: string;
  department: string | null;
  openingBalance: number;
  serviceCost: number;
  interestCost: number;
  benefitPayments: number;
  actuarialGainLoss: number;
  closingBalance: number;
  currentPortion: number;
  nonCurrentPortion: number;
  discountRate: number;
  inflationRate: number;
  salaryGrowthRate: number;
  mortalityRate: number | null;
  turnoverRate: number | null;
  financialYearId: number;
  scoaItemCode: string | null;
  scoaFundCode: string | null;
  scoaFunctionCode: string | null;
  scoaRegionCode: string | null;
  createdBy: string;
  createdOn: string;
}

export interface LongServiceAward {
  id: number;
  department: string | null;
  milestoneYears: number;
  benefitAmount: number;
  eligibleEmployees: number;
  estimatedPayments: number;
  currentPortion: number;
  nonCurrentPortion: number;
  financialYearId: number;
  scoaItemCode: string | null;
  scoaFundCode: string | null;
  scoaFunctionCode: string | null;
  createdBy: string;
  createdOn: string;
}

export interface PerformanceBonus {
  id: number;
  department: string | null;
  employeeCategory: string | null;
  bonusPercentage: number;
  qualifyingEmployees: number;
  averageSalary: number;
  estimatedTotalCost: number;
  financialYearId: number;
  scoaItemCode: string | null;
  scoaFundCode: string | null;
  scoaFunctionCode: string | null;
  createdBy: string;
  createdOn: string;
}

export interface PayrollScenario {
  id: number;
  name: string;
  description: string | null;
  salaryIncreasePercent: number;
  vacancyFillingPercent: number;
  benefitAdjustmentPercent: number;
  overtimeAdjustmentPercent: number | null;
  travelAdjustmentPercent: number | null;
  totalBaselineCost: number;
  totalScenarioCost: number;
  varianceAmount: number;
  variancePercent: number;
  status: string;
  financialYearId: number;
  createdBy: string;
  createdOn: string;
  approvedBy: string | null;
  approvedOn: string | null;
}

export interface PayrollBudgetLine {
  id: number;
  department: string | null;
  costCategory: string;
  subCategory: string | null;
  year1Amount: number;
  year2Amount: number;
  year3Amount: number;
  month01: number; month02: number; month03: number; month04: number;
  month05: number; month06: number; month07: number; month08: number;
  month09: number; month10: number; month11: number; month12: number;
  status: string;
  financialYearId: number;
  scoaItemCode: string | null;
  scoaFundCode: string | null;
  scoaFunctionCode: string | null;
  scoaRegionCode: string | null;
  scoaCostingCode: string | null;
  createdBy: string;
  createdOn: string;
}

export interface PayrollBudgetSummary {
  totalFixedCosts: number;
  totalVariableCosts: number;
  totalCouncillorCosts: number;
  totalWardCommitteeCosts: number;
  totalPayrollBudget: number;
  year1Total: number;
  year2Total: number;
  year3Total: number;
  budgetStringsGenerated: number;
  byDepartment: PayrollDepartmentBreakdown[];
  byCostCategory: PayrollCategoryBreakdown[];
}

export interface PayrollDepartmentBreakdown {
  department: string;
  fixedCosts: number;
  variableCosts: number;
  totalCost: number;
  year1Amount: number;
  year2Amount: number;
  year3Amount: number;
}

export interface PayrollCategoryBreakdown {
  costCategory: string;
  year1Amount: number;
  year2Amount: number;
  year3Amount: number;
}

export interface PostEstablishmentSummary {
  totalPosts: number;
  filledPosts: number;
  vacantPosts: number;
  fundedVacancies: number;
  unfundedVacancies: number;
  totalPostBudget: number;
  byDepartment: DepartmentPostSummary[];
}

export interface DepartmentPostSummary {
  department: string;
  totalPosts: number;
  filledPosts: number;
  vacantPosts: number;
  fundedVacancies: number;
  totalCost: number;
}

export interface DboSummary {
  totalDbo: number;
  currentPortion: number;
  nonCurrentPortion: number;
  totalLongServiceAwards: number;
  totalEstimatedPayments: number;
  byBenefitType: DboBenefitBreakdown[];
}

export interface DboBenefitBreakdown {
  benefitType: string;
  openingBalance: number;
  serviceCost: number;
  interestCost: number;
  benefitPayments: number;
  actuarialGainLoss: number;
  closingBalance: number;
  currentPortion: number;
  nonCurrentPortion: number;
}

export interface HrPayrollBudgetApproval {
  id: number;
  entityType: string;
  entityId: number;
  decision: string;
  comments: string | null;
  approvedBy: string;
  approvedAt: string;
}
