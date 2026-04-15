using Microsoft.AspNetCore.Mvc;
  using PlatinumBudget.Api.DTOs.Planning;
  using PlatinumBudget.Api.Services;

  namespace PlatinumBudget.Api.Controllers;

  [ApiController]
  [Route("api/[controller]")]
  public class PlanningFunctionsController : ControllerBase
  {
      private readonly PlanningSpService _svc;
      public PlanningFunctionsController(PlanningSpService svc) { _svc = svc; }

      [HttpGet]
    [Route("plan-adjustmentfundingsourcebudgetperyear")]
    public async Task<IActionResult> PlanAdjustmentFundingSourceBudgetPerYear([FromQuery] PlanAdjustmentFundingSourceBudgetPerYearRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "CurFinYear", request.CurFinYear },
            { "BudgetType", request.BudgetType },
            { "AdjustmentVersionId", request.AdjustmentVersionId },
            { "AdjustmentFundingVersionId", request.AdjustmentFundingVersionId }
        };
        var result = await _svc.ExecuteFunctionAsync("Plan_AdjustmentFundingSourceBudgetPerYear_fxn", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetconsumptiondetail")]
    public async Task<IActionResult> PlanBudgetConsumptionDetail([FromQuery] PlanBudgetConsumptionDetailFnRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "PlanProjectItemID", request.PlanProjectItemID },
            { "StartMonth", request.StartMonth },
            { "EndMonth", request.EndMonth },
            { "IsDetailRpt", request.IsDetailRpt }
        };
        var result = await _svc.ExecuteFunctionAsync("Plan_BudgetConsumptionDetail_fxn", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-fundingsourcebudgetavailableamtperyear")]
    public async Task<IActionResult> PlanFundingSourceBudgetAvailableAmtPerYear([FromQuery] PlanFundingSourceBudgetAvailableAmtPerYearRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteFunctionAsync("Plan_FundingSourceBudgetAvailableAmtPerYear_fxn", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-fundingsourcebudgetperyear")]
    public async Task<IActionResult> PlanFundingSourceBudgetPerYear([FromQuery] PlanFundingSourceBudgetPerYearRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "CurFinYear", request.CurFinYear },
            { "BudgetType", request.BudgetType }
        };
        var result = await _svc.ExecuteFunctionAsync("Plan_FundingSourceBudgetPerYear_fxn", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getbudgetamountsbyprojectitemid")]
    public async Task<IActionResult> PlanGetBudgetAmountsByProjectItemID([FromQuery] PlanGetBudgetAmountsByProjectItemIDRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "PlanProjectItemID", request.PlanProjectItemID }
        };
        var result = await _svc.ExecuteFunctionAsync("Plan_GetBudgetAmountsByProjectItemID_fxn", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getbudgetdocumentdetail")]
    public async Task<IActionResult> PlanGetBudgetDocumentDetail([FromQuery] PlanGetBudgetDocumentDetailRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "TableName", request.TableName },
            { "PK", request.PK }
        };
        var result = await _svc.ExecuteFunctionAsync("Plan_GetBudgetDocumentDetail", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-projectamountrequired")]
    public async Task<IActionResult> PlanProjectAmountRequired([FromQuery] PlanProjectAmountRequiredRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteFunctionAsync("Plan_ProjectAmountRequired_fxn", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("planning-getquarterstartenddate")]
    public async Task<IActionResult> PlanningGetQuarterStartEndDate([FromQuery] PlanningGetQuarterStartEndDateRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinStartYear", request.FinStartYear },
            { "QuarterNo", request.QuarterNo }
        };
        var result = await _svc.ExecuteFunctionAsync("Planning_GetQuarterStartEndDate_fxn", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("section71-auditedoutcome")]
    public async Task<IActionResult> Section71AuditedOutcome([FromQuery] Section71AuditedOutcomeRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteFunctionAsync("Section71_AuditedOutcome_fxn", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("section71-budget")]
    public async Task<IActionResult> Section71Budget([FromQuery] Section71BudgetRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteFunctionAsync("Section71_Budget_fxn", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("section71-versionauditedoutcome")]
    public async Task<IActionResult> Section71VersionAuditedOutcome([FromQuery] Section71VersionAuditedOutcomeRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "VersionFinYear", request.VersionFinYear }
        };
        var result = await _svc.ExecuteFunctionAsync("Section71_VersionAuditedOutcome_fxn", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("section71-virement")]
    public async Task<IActionResult> Section71Virement([FromQuery] Section71VirementRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "StartDate", request.StartDate },
            { "EndDate", request.EndDate }
        };
        var result = await _svc.ExecuteFunctionAsync("Section71_Virement_fxn", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("section71-virementmonth")]
    public async Task<IActionResult> Section71VirementMonth([FromQuery] Section71VirementMonthRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "StartDate", request.StartDate },
            { "EndDate", request.EndDate }
        };
        var result = await _svc.ExecuteFunctionAsync("Section71_VirementMonth_fxn", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("split")]
    public async Task<IActionResult> Split([FromQuery] SplitRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "String", request.String },
            { "Delimiter", request.Delimiter }
        };
        var result = await _svc.ExecuteFunctionAsync("Split_fxn", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("yearstartingatmonth")]
    public async Task<IActionResult> YearStartingAtMonth([FromQuery] YearStartingAtMonthRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "StartMonth", request.StartMonth }
        };
        var result = await _svc.ExecuteFunctionAsync("YearStartingAtMonth_fxn", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("idp-getitemparentid")]
    public async Task<IActionResult> IDPGetItemParentID([FromQuery] IDPGetItemParentIDRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "itemID", request.itemID }
        };
        var result = await _svc.ExecuteFunctionAsync("IDP_GetItemParentID", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("idp-getitempath")]
    public async Task<IActionResult> IDPGetItemPath([FromQuery] IDPGetItemPathRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "itemID", request.itemID },
            { "path", request.path }
        };
        var result = await _svc.ExecuteFunctionAsync("IDP_GetItemPath", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetsign")]
    public async Task<IActionResult> PlanBudgetSign([FromQuery] PlanBudgetSignRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "scoaItemCode", request.scoaItemCode },
            { "capitalOperational", request.capitalOperational },
            { "creditDebit", request.creditDebit },
            { "scoaItemShortDesc", request.scoaItemShortDesc },
            { "finYear", request.finYear }
        };
        var result = await _svc.ExecuteFunctionAsync("Plan_BudgetSign_fxn", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getadjustmentfundallocatedamount")]
    public async Task<IActionResult> PlanGetAdjustmentFundAllocatedAmount([FromQuery] PlanGetAdjustmentFundAllocatedAmountRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAId", request.SCOAId },
            { "FynYear", request.FynYear },
            { "CurFinYear", request.CurFinYear },
            { "AdjustmentVersionId", request.AdjustmentVersionId }
        };
        var result = await _svc.ExecuteFunctionAsync("Plan_GetAdjustmentFundAllocatedAmount_fxn", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getadjustmentfundavailableamount")]
    public async Task<IActionResult> PlanGetAdjustmentFundAvailableAmount([FromQuery] PlanGetAdjustmentFundAvailableAmountRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAId", request.SCOAId },
            { "FynYear", request.FynYear },
            { "AdjustmentFundingVersionId", request.AdjustmentFundingVersionId }
        };
        var result = await _svc.ExecuteFunctionAsync("Plan_GetAdjustmentFundAvailableAmount_fxn", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getbudgetdocumentdetaillink")]
    public async Task<IActionResult> PlanGetBudgetDocumentDetailLink([FromQuery] PlanGetBudgetDocumentDetailLinkRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "TableName", request.TableName },
            { "PK", request.PK }
        };
        var result = await _svc.ExecuteFunctionAsync("Plan_GetBudgetDocumentDetailLink_fxn", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getbudgettransactionoutstandingamount")]
    public async Task<IActionResult> PlanGetBudgetTransactionOutstandingAmount([FromQuery] PlanGetBudgetTransactionOutstandingAmountRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "TableName", request.TableName },
            { "PK", request.PK }
        };
        var result = await _svc.ExecuteFunctionAsync("Plan_GetBudgetTransactionOutstandingAmount_fxn", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getbudgettransactiontypedesc")]
    public async Task<IActionResult> PlanGetBudgetTransactionTypeDesc([FromQuery] PlanGetBudgetTransactionTypeDescRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "BudgetConsumptionProcessID", request.BudgetConsumptionProcessID },
            { "BudgetTransactionTypeID", request.BudgetTransactionTypeID }
        };
        var result = await _svc.ExecuteFunctionAsync("Plan_GetBudgetTransactionTypeDesc", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectdivisionbydivisionid")]
    public async Task<IActionResult> PlanGetProjectDivisionByDivisionId([FromQuery] PlanGetProjectDivisionByDivisionIdRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "DivisionID", request.DivisionID }
        };
        var result = await _svc.ExecuteFunctionAsync("Plan_GetProjectDivisionByDivisionId_fxn", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-projectdaysbehind")]
    public async Task<IActionResult> PlanProjectDaysBehind([FromQuery] PlanProjectDaysBehindRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID }
        };
        var result = await _svc.ExecuteFunctionAsync("Plan_ProjectDaysBehind_fn", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("planing-getfundallocatedamount")]
    public async Task<IActionResult> PlaningGetFundAllocatedAmount([FromQuery] PlaningGetFundAllocatedAmountRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAId", request.SCOAId },
            { "FynYear", request.FynYear },
            { "CurFinYear", request.CurFinYear }
        };
        var result = await _svc.ExecuteFunctionAsync("Planing_GetFundAllocatedAmount", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("planing-getfundavailableamount")]
    public async Task<IActionResult> PlaningGetFundAvailableAmount([FromQuery] PlaningGetFundAvailableAmountRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAId", request.SCOAId },
            { "FynYear", request.FynYear }
        };
        var result = await _svc.ExecuteFunctionAsync("Planing_GetFundAvailableAmount", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("planing-getfundavailabletotalamount")]
    public async Task<IActionResult> PlaningGetFundAvailableTotalAmount([FromQuery] PlaningGetFundAvailableTotalAmountRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FynYear", request.FynYear }
        };
        var result = await _svc.ExecuteFunctionAsync("Planing_GetFundAvailableTotalAmount", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("planing-getprojectrevenueamount")]
    public async Task<IActionResult> PlaningGetProjectRevenueAmount([FromQuery] PlaningGetProjectRevenueAmountRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FynYear", request.FynYear }
        };
        var result = await _svc.ExecuteFunctionAsync("Planing_GetProjectRevenueAmount", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("section71-budgetadjustmentcouncilapprovedversionid")]
    public async Task<IActionResult> Section71BudgetAdjustmentCouncilApprovedVersionID([FromQuery] Section71BudgetAdjustmentCouncilApprovedVersionIDRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "finYear", request.finYear }
        };
        var result = await _svc.ExecuteFunctionAsync("Section71_BudgetAdjustmentCouncilApprovedVersionID_fxn", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("section71-budgetadjustmentmonthid")]
    public async Task<IActionResult> Section71BudgetAdjustmentMonthID([FromQuery] Section71BudgetAdjustmentMonthIDRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "budgetAdjustmentVersionID", request.budgetAdjustmentVersionID }
        };
        var result = await _svc.ExecuteFunctionAsync("Section71_BudgetAdjustmentMonthID_fxn", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("section71-budgetadjustmentversioncount")]
    public async Task<IActionResult> Section71BudgetAdjustmentVersionCount([FromQuery] Section71BudgetAdjustmentVersionCountRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "finYear", request.finYear }
        };
        var result = await _svc.ExecuteFunctionAsync("Section71_BudgetAdjustmentVersionCount_fxn", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("section71-budgetadjustmentversionid")]
    public async Task<IActionResult> Section71BudgetAdjustmentVersionID([FromQuery] Section71BudgetAdjustmentVersionIDRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "finYear", request.finYear },
            { "monthID", request.monthID }
        };
        var result = await _svc.ExecuteFunctionAsync("Section71_BudgetAdjustmentVersionID_fxn", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("section71-budgetadjustmentversionpreviousid")]
    public async Task<IActionResult> Section71BudgetAdjustmentVersionPreviousID([FromQuery] Section71BudgetAdjustmentVersionPreviousIDRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "finYear", request.finYear },
            { "maxAdjustmentVersionID", request.maxAdjustmentVersionID },
            { "monthID", request.monthID }
        };
        var result = await _svc.ExecuteFunctionAsync("Section71_BudgetAdjustmentVersionPreviousID_fxn", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("section71-budgetoriginalversionid")]
    public async Task<IActionResult> Section71BudgetOriginalVersionID([FromQuery] Section71BudgetOriginalVersionIDRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "finYear", request.finYear }
        };
        var result = await _svc.ExecuteFunctionAsync("Section71_BudgetOriginalVersionID_fxn", parameters);
        return Ok(result);
    }
  }
  