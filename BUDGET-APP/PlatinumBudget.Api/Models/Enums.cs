namespace PlatinumBudget.Api.Models;

public enum BudgetVersionType
{
    TABB = 1,
    ORGB = 2,
    ADJB = 3
}

public enum BudgetVersionStatus
{
    Draft = 1,
    Pending = 2,
    Approved = 3,
    Locked = 4,
    ActiveForImplementation = 5,
    Rejected = 6,
    Returned = 7
}

public enum ProjectType
{
    Capital = 1,
    Operational = 2,
    Revenue = 3,
    Mixed = 4
}

public enum ProjectStatus
{
    Draft = 1,
    Active = 2,
    Completed = 3,
    OnHold = 4,
    Cancelled = 5
}

public enum SourceModule
{
    Direct = 0,
    HRPB = 1,
    CRB = 2,
    REVB = 3,
    EB = 4,
    Billing = 5,
    BillingBudget = 6,
    CreditorsBudget = 7
}

public enum ServiceType
{
    Water = 1,
    Electricity = 2,
    Sanitation = 3,
    Refuse = 4,
    PropertyRates = 5,
    Other = 6
}

public enum PropertyCategory
{
    Residential = 1,
    Commercial = 2,
    Industrial = 3,
    Agricultural = 4,
    NGO = 5,
    Government = 6
}

public enum TariffType
{
    Fixed = 1,
    Tiered = 2,
    Inclining = 3
}

public enum ConsumerType
{
    Household = 1,
    Business = 2,
    Industrial = 3,
    NGO = 4
}

public enum RebateCategory
{
    Indigent = 1,
    EarlyPayment = 2,
    SeniorCitizen = 3,
    Other = 4
}

public enum BillingApprovalStatus
{
    Draft = 1,
    Submitted = 2,
    UnderReview = 3,
    Approved = 4,
    Rejected = 5,
    ReturnedForCorrection = 6
}

public enum BillingApprovalType
{
    RevenueProjection = 1,
    RebateProjection = 2,
    ScenarioReport = 3,
    BudgetStringSubmission = 4
}

public enum ValidationStatus
{
    Pass = 1,
    Warning = 2,
    Error = 3
}

public enum ApprovalEntityType
{
    BudgetVersion = 1,
    BudgetStringBatch = 2,
    Virement = 3,
    Adjustment = 4
}

public enum ApprovalDecision
{
    Submitted = 1,
    Approved = 2,
    Rejected = 3,
    Returned = 4
}

public enum VirementStatus
{
    Draft = 1,
    Submitted = 2,
    DeptHeadApproved = 3,
    BudgetOfficeApproved = 4,
    CFOApproved = 5,
    MMApproved = 6,
    CouncilApproved = 7,
    Approved = 8,
    Rejected = 9,
    Posted = 10,
    Returned = 11
}

public enum VirementApprovalLevel
{
    DepartmentHead = 1,
    BudgetOffice = 2,
    CFO = 3,
    MunicipalManager = 4,
    Council = 5
}

public enum DispatchStatus
{
    Pending = 1,
    Dispatched = 2,
    Acknowledged = 3,
    Failed = 4
}
