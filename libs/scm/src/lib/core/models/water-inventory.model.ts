export interface WaterInventoryItem {
  id: number;
  storagePointId: number;
  storagePointName: string;
  routeId: number;
  routeName: string;
  assetTypeId?: number;
  assetTypeName?: string;
  capacityKl: number;
  currentVolumeKl: number;
  previousVolumeKl?: number;
  weightedAverageCostPerKl: number;
  totalValue: number;
  lastReadingDate?: string;
  status: string;
  enabled: boolean;
}

export interface WaterMeterReading {
  id: number;
  storagePointId: number;
  storagePointName: string;
  routeId: number;
  routeName: string;
  readingDate: string;
  previousReading: number;
  currentReading: number;
  consumptionKl: number;
  variancePercent?: number;
  varianceFlagged: boolean;
  amendedBy?: string;
  amendedDate?: string;
  amendReason?: string;
  status: string;
  approvedBy?: string;
  approvedDate?: string;
}

export interface WaterStocktake {
  id: number;
  referenceNumber: string;
  stocktakeDate: string;
  routeId?: number;
  routeName?: string;
  status: string;
  countedBy?: string;
  verifiedBy?: string;
  approvedBy?: string;
  totalPoints: number;
  countedPoints: number;
  varianceCount: number;
  varianceValueZar: number;
  details: WaterStocktakeDetail[];
}

export interface WaterStocktakeDetail {
  id: number;
  stocktakeId: number;
  storagePointId: number;
  storagePointName: string;
  systemVolumeKl: number;
  physicalVolumeKl: number;
  varianceKl: number;
  variancePercent: number;
  varianceFlagged: boolean;
  explanation?: string;
}

export interface WaterTreated {
  id: number;
  treatmentPlantId: number;
  treatmentPlantName: string;
  periodMonth: number;
  periodYear: number;
  rawWaterVolumeKl: number;
  treatedVolumeKl: number;
  outputVolumeKl: number;
  processLossKl: number;
  processLossPercent: number;
  chemicalCostZar: number;
  energyCostZar: number;
  labourCostZar: number;
  totalCostZar: number;
  costPerKlZar: number;
}

export interface WaterAssetType {
  id: number;
  description: string;
  category: string;
  enabled: boolean;
}

export interface WaterRoute {
  id: number;
  routeName: string;
  description: string;
  extendedDescription?: string;
  enabled: boolean;
  nodeCount: number;
}

export interface WaterRouteName {
  id: number;
  name: string;
  routeId: number;
}

export interface WaterRouteNode {
  id: number;
  routeId: number;
  routeName: string;
  nodeName: string;
  nodeType: string;
  assetTypeId?: number;
  assetTypeName?: string;
  capacityKl: number;
  inflowMeterNumber?: string;
  outflowMeterNumber?: string;
  latitude?: number;
  longitude?: number;
  enabled: boolean;
}

export interface WaterAcquisition {
  id: number;
  referenceNumber: string;
  acquisitionDate: string;
  sourceType: string;
  sourceName: string;
  volumeKl: number;
  unitCostZar: number;
  totalCostZar: number;
  transportCostZar: number;
  treatmentCostZar: number;
  totalAcquisitionCostZar: number;
  wacBefore: number;
  wacAfter: number;
  status: string;
  approvedBy?: string;
  approvedDate?: string;
}

export interface WaterPurificationCost {
  id: number;
  treatmentPlantId: number;
  treatmentPlantName: string;
  periodMonth: number;
  periodYear: number;
  chemicalsCost: number;
  energyCost: number;
  labourCost: number;
  maintenanceCost: number;
  depreciationCost: number;
  otherCost: number;
  totalCost: number;
  volumeTreatedKl: number;
  costPerKlZar: number;
}

export interface WaterDistribution {
  id: number;
  referenceNumber: string;
  distributionDate: string;
  fromStoragePoint: string;
  toConsumer: string;
  consumerType: string;
  volumeKl: number;
  wacPerKl: number;
  totalValueZar: number;
  tariffPerKl: number;
  revenueZar: number;
  status: string;
}

export interface WaterLoss {
  id: number;
  periodMonth: number;
  periodYear: number;
  routeId?: number;
  routeName?: string;
  totalProducedKl: number;
  totalDistributedKl: number;
  totalBilledKl: number;
  physicalLossKl: number;
  commercialLossKl: number;
  unbilledAuthorisedKl: number;
  totalLossKl: number;
  lossPercentage: number;
  nrwPercentage: number;
  valueLostZar: number;
  status: string;
}

export interface WaterLossFormula {
  id: number;
  formulaName: string;
  formulaType: string;
  expression: string;
  description: string;
  status: string;
  approvedBy?: string;
  approvedDate?: string;
}

export interface WaterLossImplementationPlan {
  id: number;
  planName: string;
  description: string;
  targetReductionPercent: number;
  startDate: string;
  endDate: string;
  estimatedCostZar: number;
  actualCostZar?: number;
  status: string;
  actions: string[];
  progressPercent: number;
}

export interface WaterValuation {
  id: number;
  referenceNumber: string;
  valuationDate: string;
  periodMonth: number;
  periodYear: number;
  totalVolumeKl: number;
  wacPerKl: number;
  carryingValueZar: number;
  nrvPerKl: number;
  nrvTotalZar: number;
  writeDownRequiredZar: number;
  grapCompliant: boolean;
  status: string;
  approvedBy?: string;
  approvedDate?: string;
}

export interface WaterNrvFormula {
  id: number;
  formulaName: string;
  formulaType: string;
  expression: string;
  estimatedSellingPrice?: number;
  estimatedCompletionCost?: number;
  estimatedSellingCost?: number;
  nrvResult?: number;
  status: string;
  approvedBy?: string;
}

export interface WaterReconciliation {
  id: number;
  referenceNumber: string;
  periodMonth: number;
  periodYear: number;
  openingBalanceKl: number;
  openingValueZar: number;
  acquisitionsKl: number;
  acquisitionsZar: number;
  distributionsKl: number;
  distributionsZar: number;
  lossesKl: number;
  lossesZar: number;
  adjustmentsKl: number;
  adjustmentsZar: number;
  closingBalanceKl: number;
  closingValueZar: number;
  varianceKl: number;
  varianceZar: number;
  isBalanced: boolean;
  status: string;
  approvedBy?: string;
  approvedDate?: string;
}

export interface WaterQualityCompliance {
  id: number;
  complianceType: string;
  assessmentDate: string;
  overallScore: number;
  drinkingWaterScore?: number;
  wastewaterScore?: number;
  microbiologicalCompliance?: number;
  chemicalCompliance?: number;
  status: string;
  findings: string;
  correctiveActions?: string;
  nextAssessmentDate?: string;
}

export interface WaterWorkingPaper {
  id: number;
  referenceNumber: string;
  paperType: string;
  title: string;
  description: string;
  periodMonth: number;
  periodYear: number;
  preparedBy: string;
  preparedDate: string;
  reviewedBy?: string;
  reviewedDate?: string;
  status: string;
  notes?: string;
}

export interface WaterAdjustingEntry {
  id: number;
  referenceNumber: string;
  entryDate: string;
  entryType: string;
  description: string;
  debitAccountCode: string;
  creditAccountCode: string;
  amountZar: number;
  volumeKl?: number;
  reason: string;
  status: string;
  approvedBy?: string;
  approvedDate?: string;
}

export interface WaterConfiguration {
  id: number;
  parameterName: string;
  parameterValue: string;
  description: string;
  category: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
  status: string;
  approvedBy?: string;
}

export interface WaterPolicyReview {
  id: number;
  policyName: string;
  reviewDate: string;
  currentVersion: string;
  proposedChanges: string;
  reviewedBy: string;
  status: string;
  approvedBy?: string;
  approvedDate?: string;
  effectiveDate?: string;
  nextReviewDate?: string;
}

export interface WaterMonthlyReport {
  id: number;
  referenceNumber: string;
  reportType: string;
  periodMonth: number;
  periodYear: number;
  generatedDate: string;
  generatedBy: string;
  status: string;
  approvedBy?: string;
  approvedDate?: string;
  submittedDate?: string;
  submittedTo?: string;
}

export interface WaterDashboard {
  totalStoragePoints: number;
  totalCapacityKl: number;
  currentVolumeKl: number;
  utilisationPercent: number;
  totalValueZar: number;
  wacPerKl: number;
  pendingReadings: number;
  pendingStocktakes: number;
  nrwPercentage: number;
  blueDropScore: number;
  greenDropScore: number;
  activeAlerts: number;
  meterReadingsThisMonth: number;
  acquisitionsThisMonth: number;
  distributionsThisMonth: number;
  lossesThisMonthKl: number;
}

export interface NrwAnalytics {
  totalProducedMl: number;
  totalBilledMl: number;
  totalLostMl: number;
  nrwPercentage: number;
  physicalLossMl: number;
  commercialLossMl: number;
  unbilledAuthorisedMl: number;
  blueDropTarget: number;
  nationalAverage: number;
  trendData: { month: string; nrw: number; target: number }[];
  routeBreakdown: { route: string; nrw: number; volume: number }[];
}

export interface TreatmentSummary {
  totalPlants: number;
  totalTreatedKl: number;
  averageCostPerKl: number;
  totalCostZar: number;
  plantData: { name: string; treatedKl: number; costPerKl: number; efficiency: number }[];
}
