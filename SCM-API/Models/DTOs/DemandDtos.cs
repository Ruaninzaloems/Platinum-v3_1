namespace SCM_API.Models.DTOs;

public class DemandPlanDto
{
    public int Id { get; set; }
    public string ReferenceNumber { get; set; } = "";
    public string Title { get; set; } = "";
    public int? DepartmentId { get; set; }
    public string DepartmentName { get; set; } = "";
    public string FinancialYear { get; set; } = "";
    public string Vote { get; set; } = "";
    public string Description { get; set; } = "";
    public int StatusId { get; set; } = 1;
    public string Status { get; set; } = "Draft";
    public decimal TotalBudget { get; set; }
    public decimal TotalDemand { get; set; }
    public string IdpReference { get; set; } = "";
    public string IdpObjective { get; set; } = "";
    public string SdbipReference { get; set; } = "";
    public string SdbipIndicator { get; set; } = "";
    public string Priority { get; set; } = "Medium";
    public string RiskLevel { get; set; } = "low";
    public int ComplianceScore { get; set; }
    public string Notes { get; set; } = "";
    public string CreatedBy { get; set; } = "";
    public string CreatedByName { get; set; } = "";
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    public string? ReviewedByName { get; set; }
    public DateTime? ReviewedDate { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public string? RejectionReason { get; set; }
    public bool Enabled { get; set; } = true;
    public List<DemandPlanItemDto> Items { get; set; } = new();
    public List<DemandAuditEntryDto> AuditTrail { get; set; } = new();
    public DemandPriorityBreakdown PriorityBreakdown { get; set; } = new();
    public Dictionary<string, int> ProcurementMethodSummary { get; set; } = new();
    public DemandQuarterlySpend QuarterlySpendPlan { get; set; } = new();
    public decimal BudgetUtilisation { get; set; }
    public DemandBudgetVariance BudgetVariance { get; set; } = new();
    public string DepartmentCode { get; set; } = "";
}

public class DemandPlanItemDto
{
    public int Id { get; set; }
    public int DemandPlanId { get; set; }
    public string Description { get; set; } = "";
    public int Quantity { get; set; } = 1;
    public string UnitOfMeasure { get; set; } = "Each";
    public decimal UnitPrice { get; set; }
    public decimal EstimatedValue { get; set; }
    public string Category { get; set; } = "";
    public string ProcurementMethod { get; set; } = "RFQ";
    public string Priority { get; set; } = "Medium";
    public string DeliveryQuarter { get; set; } = "Q1";
    public string Status { get; set; } = "Planned";
    public string? NeedsAssessmentId { get; set; }
    public string? SpecificationId { get; set; }
    public string? MscoaSegment { get; set; }
    public List<int>? LinkedRequisitionIds { get; set; }
}

public class NeedsAssessmentDto
{
    public int Id { get; set; }
    public string ReferenceNumber { get; set; } = "";
    public string Title { get; set; } = "";
    public int? DepartmentId { get; set; }
    public string DepartmentName { get; set; } = "";
    public string Priority { get; set; } = "Medium";
    public string Justification { get; set; } = "";
    public string CurrentSituation { get; set; } = "";
    public string ProposedSolution { get; set; } = "";
    public decimal EstimatedCost { get; set; }
    public string Status { get; set; } = "Draft";
    public string RiskFactors { get; set; } = "";
    public string CreatedBy { get; set; } = "";
    public string CreatedByName { get; set; } = "";
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    public string Category { get; set; } = "";
    public string? LinkedPlanId { get; set; }
}

public class CreateDemandPlanRequest
{
    public string Title { get; set; } = "";
    public int? DepartmentId { get; set; }
    public string FinancialYear { get; set; } = "";
    public string Vote { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal TotalBudget { get; set; }
    public string IdpReference { get; set; } = "";
    public string IdpObjective { get; set; } = "";
    public string SdbipReference { get; set; } = "";
    public string SdbipIndicator { get; set; } = "";
    public string Priority { get; set; } = "Medium";
    public string Notes { get; set; } = "";
}

public class UpdateDemandPlanRequest
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public decimal? TotalBudget { get; set; }
    public string? Vote { get; set; }
    public string? IdpReference { get; set; }
    public string? IdpObjective { get; set; }
    public string? SdbipReference { get; set; }
    public string? SdbipIndicator { get; set; }
    public string? Priority { get; set; }
    public string? Notes { get; set; }
}

public class CreateDemandItemRequest
{
    public string Description { get; set; } = "";
    public int Quantity { get; set; } = 1;
    public string UnitOfMeasure { get; set; } = "Each";
    public decimal UnitPrice { get; set; }
    public string Category { get; set; } = "";
    public string ProcurementMethod { get; set; } = "RFQ";
    public string Priority { get; set; } = "Medium";
    public string DeliveryQuarter { get; set; } = "Q1";
    public string? MscoaSegment { get; set; }
}

public class CreateNeedsAssessmentRequest
{
    public string Title { get; set; } = "";
    public int? DepartmentId { get; set; }
    public string Priority { get; set; } = "Medium";
    public string Justification { get; set; } = "";
    public string CurrentSituation { get; set; } = "";
    public string ProposedSolution { get; set; } = "";
    public decimal EstimatedCost { get; set; }
    public string RiskFactors { get; set; } = "";
    public string Category { get; set; } = "";
}

public class WorkflowActionRequest
{
    public string? Reason { get; set; }
    public string? Comments { get; set; }
}

public class DemandDashboardDto
{
    public int TotalPlans { get; set; }
    public int DraftPlans { get; set; }
    public int SubmittedPlans { get; set; }
    public int ReviewedPlans { get; set; }
    public int ApprovedPlans { get; set; }
    public int RejectedPlans { get; set; }
    public decimal TotalDemandValue { get; set; }
    public decimal TotalBudgetValue { get; set; }
    public decimal BudgetCoverage { get; set; }
    public int TotalItems { get; set; }
    public int CompletedAssessments { get; set; }
    public int TotalAssessments { get; set; }
    public string CurrentFinancialYear { get; set; } = "";
    public List<DepartmentBreakdownDto> ByDepartment { get; set; } = new();
    public Dictionary<string, int> StatusDistribution { get; set; } = new();
    public int OverdueItems { get; set; }
    public decimal ComplianceScore { get; set; }
    public decimal ConversionRate { get; set; }
    public int SpecificationsReady { get; set; }
    public int SpecificationsTotal { get; set; }
    public decimal AggregationSavings { get; set; }
    public int AggregationGroups { get; set; }
    public List<object> CategoryBreakdown { get; set; } = new();
    public List<object> ProcurementMethodBreakdown { get; set; } = new();
    public List<object> QuarterlyPipeline { get; set; } = new();
    public object RiskSummary { get; set; } = new { high = 0, medium = 0, low = 0 };
}

public class DepartmentBreakdownDto
{
    public string Department { get; set; } = "";
    public int Plans { get; set; }
    public decimal Value { get; set; }
    public int Items { get; set; }
    public decimal Compliance { get; set; }
    public decimal BudgetUtil { get; set; }
    public string Status { get; set; } = "";
}

public class DemandAuditEntryDto
{
    public string Action { get; set; } = "";
    public string By { get; set; } = "";
    public string Date { get; set; } = "";
    public string Notes { get; set; } = "";
}

public class DemandPriorityBreakdown
{
    public int Critical { get; set; }
    public int High { get; set; }
    public int Medium { get; set; }
    public int Low { get; set; }
}

public class DemandQuarterlySpend
{
    public QuarterData Q1 { get; set; } = new();
    public QuarterData Q2 { get; set; } = new();
    public QuarterData Q3 { get; set; } = new();
    public QuarterData Q4 { get; set; } = new();
}

public class QuarterData
{
    public decimal Planned { get; set; }
    public decimal Actual { get; set; }
    public decimal Committed { get; set; }
}

public class DemandBudgetVariance
{
    public decimal Amount { get; set; }
}

public class SpecificationDto
{
    public int Id { get; set; }
    public string ReferenceNumber { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public int? DemandItemId { get; set; }
    public string Category { get; set; } = "";
    public string Status { get; set; } = "draft";
    public string CreatedBy { get; set; } = "";
    public DateTime CreatedDate { get; set; }
    public List<SpecificationRequirement> Requirements { get; set; } = new();
    public string TechnicalDetails { get; set; } = "";
    public string QualityCriteria { get; set; } = "";
}

public class SpecificationRequirement
{
    public string Description { get; set; } = "";
    public bool Mandatory { get; set; }
}

public class CreateSpecificationRequest
{
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public int? DemandItemId { get; set; }
    public string Category { get; set; } = "";
    public string TechnicalDetails { get; set; } = "";
    public string QualityCriteria { get; set; } = "";
}

public class CommodityGroupDto
{
    public int Id { get; set; }
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Category { get; set; } = "";
    public int ItemCount { get; set; }
    public decimal TotalValue { get; set; }
}

public class MarketAnalysisDto
{
    public int Id { get; set; }
    public string ReferenceNumber { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Category { get; set; } = "";
    public string Status { get; set; } = "in_progress";
    public decimal EstimatedMarketValue { get; set; }
    public int SupplierCount { get; set; }
    public string Findings { get; set; } = "";
    public string Recommendation { get; set; } = "";
    public DateTime CreatedDate { get; set; }
    public DateTime? CompletedDate { get; set; }
}

public class CreateMarketAnalysisRequest
{
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Category { get; set; } = "";
    public decimal EstimatedMarketValue { get; set; }
    public int SupplierCount { get; set; }
    public string Findings { get; set; } = "";
    public string Recommendation { get; set; } = "";
}

public class AggregationDto
{
    public int Id { get; set; }
    public string ReferenceNumber { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Category { get; set; } = "";
    public string Status { get; set; } = "draft";
    public int ItemCount { get; set; }
    public decimal TotalValue { get; set; }
    public decimal EstimatedSavings { get; set; }
    public List<int> DemandItemIds { get; set; } = new();
    public DateTime CreatedDate { get; set; }
}

public class CreateAggregationRequest
{
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Category { get; set; } = "";
    public List<int> DemandItemIds { get; set; } = new();
}
