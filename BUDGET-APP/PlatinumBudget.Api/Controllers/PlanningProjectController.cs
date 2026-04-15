using Microsoft.AspNetCore.Mvc;
using PlatinumBudget.Api.DTOs.Planning;
using PlatinumBudget.Api.Services;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlanningProjectController : ControllerBase
{
    private readonly PlanningSpService _svc;
    public PlanningProjectController(PlanningSpService svc) { _svc = svc; }

    [HttpPost]
    [Route("plan-autocreateactivationvotesbyproject")]
    public async Task<IActionResult> PlanAutoCreateActivationVotesByProject([FromBody] PlanAutoCreateActivationVotesByProjectRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_AutoCreateActivationVotesByProject_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-autocreateactivationvotesbyyear")]
    public async Task<IActionResult> PlanAutoCreateActivationVotesByYear([FromBody] PlanAutoCreateActivationVotesByYearRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_AutoCreateActivationVotesByYear_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-autocreateprocurementbyproject")]
    public async Task<IActionResult> PlanAutoCreateProcurementByProject([FromBody] PlanAutoCreateProcurementByProjectRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_AutoCreateProcurementByProject_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-autocreateprocurementbyproject-sp-bkp")]
    public async Task<IActionResult> PlanAutoCreateProcurementByProjectspbkp([FromBody] PlanAutoCreateProcurementByProjectspbkpRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_AutoCreateProcurementByProject_sp_bkp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-autocreateprocurementforvirtualproject")]
    public async Task<IActionResult> PlanAutoCreateProcurementForVirtualProject([FromBody] PlanAutoCreateProcurementForVirtualProjectRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_AutoCreateProcurementForVirtualProject_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-autocreateprocurementinitproject")]
    public async Task<IActionResult> PlanAutoCreateProcurementInitProject([FromBody] PlanAutoCreateProcurementInitProjectRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_AutoCreateProcurementInitProject_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-deleteproject")]
    public async Task<IActionResult> PlanDeleteProject([FromBody] PlanDeleteProjectRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_DeleteProject_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getactualamountbyplanprojectitemid")]
    public async Task<IActionResult> PlanGetActualAmountByPlanProjectItemID([FromQuery] PlanGetActualAmountByPlanProjectItemIDRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinancialYear", request.FinancialYear },
            { "PlanProjectItemID", request.PlanProjectItemID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetActualAmountByPlanProjectItemID_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getadjustmentprojectbydepartmentid")]
    public async Task<IActionResult> PlanGetAdjustmentProjectByDepartmentId([FromQuery] PlanGetAdjustmentProjectByDepartmentIdRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "DepartmentId", request.DepartmentId },
            { "FinYear", request.FinYear },
            { "UserFinYear", request.UserFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetAdjustmentProjectByDepartmentId_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getadjustmentprojectcosting")]
    public async Task<IActionResult> PlanGetAdjustmentProjectCosting([FromQuery] PlanGetAdjustmentProjectCostingRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "AdjustmentProjectID", request.AdjustmentProjectID },
            { "ScoaCostingID", request.ScoaCostingID },
            { "UserFinYear", request.UserFinYear },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetAdjustmentProjectCosting_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getadjustmentprojectdetailsfordashboard")]
    public async Task<IActionResult> PlanGetAdjustmentProjectDetailsForDashboard([FromQuery] PlanGetAdjustmentProjectDetailsForDashboardRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FYear", request.FYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetAdjustmentProjectDetailsForDashboard_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getadjustmentprojectdivisions")]
    public async Task<IActionResult> PlanGetAdjustmentProjectDivisions([FromQuery] PlanGetAdjustmentProjectDivisionsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "AdjustmentProjectID", request.AdjustmentProjectID },
            { "DivisionID", request.DivisionID },
            { "UserId", request.UserId },
            { "UserFinYear", request.UserFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetAdjustmentProjectDivisions_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getadjustmentprojectfunctions")]
    public async Task<IActionResult> PlanGetAdjustmentProjectFunctions([FromQuery] PlanGetAdjustmentProjectFunctionsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "AdjustmentProjectID", request.AdjustmentProjectID },
            { "ScoaFunctionID", request.ScoaFunctionID },
            { "UserFinYear", request.UserFinYear },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetAdjustmentProjectFunctions_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getadjustmentprojectidp")]
    public async Task<IActionResult> PlanGetAdjustmentProjectIDP([FromQuery] PlanGetAdjustmentProjectIDPRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "AdjustmentProjectID", request.AdjustmentProjectID },
            { "ParentIDPItemID", request.ParentIDPItemID },
            { "UserFinYear", request.UserFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetAdjustmentProjectIDP_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getadjustmentprojectitemfunds")]
    public async Task<IActionResult> PlanGetAdjustmentProjectItemFunds([FromQuery] PlanGetAdjustmentProjectItemFundsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "AdjustmentProjectID", request.AdjustmentProjectID },
            { "ScoaFundID", request.ScoaFundID },
            { "FinYear", request.FinYear },
            { "UserFinYear", request.UserFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetAdjustmentProjectItemFunds_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getadjustmentprojectregions")]
    public async Task<IActionResult> PlanGetAdjustmentProjectRegions([FromQuery] PlanGetAdjustmentProjectRegionsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "AdjustmentProjectID", request.AdjustmentProjectID },
            { "ScoaRegionID", request.ScoaRegionID },
            { "UserFinYear", request.UserFinYear },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetAdjustmentProjectRegions_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getadjustmentprojectscoaitems")]
    public async Task<IActionResult> PlanGetAdjustmentProjectSCOAItems([FromQuery] PlanGetAdjustmentProjectSCOAItemsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "AdjustmentProjectID", request.AdjustmentProjectID },
            { "ScoaItemID", request.ScoaItemID },
            { "UserFinYear", request.UserFinYear },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetAdjustmentProjectSCOAItems_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getadjustmentprojectsearch")]
    public async Task<IActionResult> PlanGetAdjustmentProjectSearch([FromQuery] PlanGetAdjustmentProjectSearchRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "IDPItemID", request.IDPItemID },
            { "AdjustmentProjectID", request.AdjustmentProjectID },
            { "FinYear", request.FinYear },
            { "ScoaFunctionID", request.ScoaFunctionID },
            { "ScoaCostingID", request.ScoaCostingID },
            { "ScoaAdjustmentProjectID", request.ScoaAdjustmentProjectID },
            { "ScoaRegionID", request.ScoaRegionID },
            { "DivisionID", request.DivisionID },
            { "SCOAItemID", request.SCOAItemID },
            { "SCOAFundID", request.SCOAFundID },
            { "StatusId", request.StatusId },
            { "DepartmentId", request.DepartmentId },
            { "UserFinYear", request.UserFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetAdjustmentProjectSearch_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getadjustmentprojectwithdeptdivisions")]
    public async Task<IActionResult> PlanGetAdjustmentProjectWithDeptDivisions([FromQuery] PlanGetAdjustmentProjectWithDeptDivisionsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "AdjustmentProjectID", request.AdjustmentProjectID },
            { "UserId", request.UserId },
            { "UserFinYear", request.UserFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetAdjustmentProjectWithDeptDivisions_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getalladjustmentprojectswithscoaproject")]
    public async Task<IActionResult> PlanGetAllAdjustmentProjectsWithScoaProject([FromQuery] PlanGetAllAdjustmentProjectsWithScoaProjectRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "UserFinYear", request.UserFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetAllAdjustmentProjectsWithScoaProject_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getallprojectswithscoaproject")]
    public async Task<IActionResult> PlanGetAllProjectsWithScoaProject([FromQuery] PlanGetAllProjectsWithScoaProjectRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetAllProjectsWithScoaProject_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getfundwidgetdetailsforadjustmentprojectitems")]
    public async Task<IActionResult> PlanGetFundWidgetDetailsForAdjustmentProjectItems([FromQuery] PlanGetFundWidgetDetailsForAdjustmentProjectItemsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "AdjustmentProjectID", request.AdjustmentProjectID },
            { "SCOAFundID", request.SCOAFundID },
            { "UserFinYear", request.UserFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetFundWidgetDetailsForAdjustmentProjectItems_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getfundwidgetdetailsforprojectitems")]
    public async Task<IActionResult> PlanGetFundWidgetDetailsForProjectItems([FromQuery] PlanGetFundWidgetDetailsForProjectItemsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "SCOAFundID", request.SCOAFundID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetFundWidgetDetailsForProjectItems_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getntstringscoaprojects")]
    public async Task<IActionResult> PlanGetNTStringSCOAProjects([FromQuery] PlanGetNTStringSCOAProjectsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "NTStringSCOAProjectID", request.NTStringSCOAProjectID },
            { "SCOAId", request.SCOAId },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetNTStringSCOAProjects_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getpendingadjustmentprojects")]
    public async Task<IActionResult> PlanGetPendingAdjustmentProjects([FromQuery] PlanGetPendingAdjustmentProjectsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "UserId", request.UserId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetPendingAdjustmentProjects_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectbydepartmentid")]
    public async Task<IActionResult> PlanGetProjectByDepartmentId([FromQuery] PlanGetProjectByDepartmentIdRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "DepartmentId", request.DepartmentId },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectByDepartmentId_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectcashflowbalances")]
    public async Task<IActionResult> PlanGetProjectCashflowBalances([FromQuery] PlanGetProjectCashflowBalancesRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "IDPID", request.IDPID },
            { "ResponsiblePersonID", request.ResponsiblePersonID },
            { "ProjectTypeID", request.ProjectTypeID },
            { "FunderID", request.FunderID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectCashflowBalances_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectcession")]
    public async Task<IActionResult> PlanGetProjectCession([FromQuery] PlanGetProjectCessionRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "PlanProjectServiceProviderID", request.PlanProjectServiceProviderID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectCession_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectcosting")]
    public async Task<IActionResult> PlanGetProjectCosting([FromQuery] PlanGetProjectCostingRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "ScoaCostingID", request.ScoaCostingID },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectCosting_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectdetailsearch")]
    public async Task<IActionResult> PlanGetProjectDetailSearch([FromQuery] PlanGetProjectDetailSearchRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectName", request.ProjectName },
            { "StatusID", request.StatusID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectDetailSearch_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectdetailsfordashboard")]
    public async Task<IActionResult> PlanGetProjectDetailsForDashboard([FromQuery] PlanGetProjectDetailsForDashboardRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FYear", request.FYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectDetailsForDashboard_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectdivisions")]
    public async Task<IActionResult> PlanGetProjectDivisions([FromQuery] PlanGetProjectDivisionsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "DivisionID", request.DivisionID },
            { "UserId", request.UserId },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectDivisions_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectforadjustmentprojectapproval")]
    public async Task<IActionResult> PlanGetProjectforAdjustmentProjectApproval([FromQuery] PlanGetProjectforAdjustmentProjectApprovalRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "UserId", request.UserId },
            { "UserFinYear", request.UserFinYear },
            { "ProjecId", request.ProjecId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectforAdjustmentProjectApproval_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectfunctions")]
    public async Task<IActionResult> PlanGetProjectFunctions([FromQuery] PlanGetProjectFunctionsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "ScoaFunctionID", request.ScoaFunctionID },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectFunctions_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectfundallocamtbyscoafundidyear")]
    public async Task<IActionResult> PlanGetProjectFundAllocAmtByScoaFundIDYear([FromQuery] PlanGetProjectFundAllocAmtByScoaFundIDYearRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ScoaFundID", request.ScoaFundID },
            { "FinYear", request.FinYear },
            { "CurrFinYear", request.CurrFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectFundAllocAmtByScoaFundIDYear_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectfundallocamtbyscoafundidyearforadjustment")]
    public async Task<IActionResult> PlanGetProjectFundAllocAmtByScoaFundIDYearForAdjustment([FromQuery] PlanGetProjectFundAllocAmtByScoaFundIDYearForAdjustmentRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ScoaFundID", request.ScoaFundID },
            { "FinYear", request.FinYear },
            { "CurrFinYear", request.CurrFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectFundAllocAmtByScoaFundIDYearForAdjustment_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectfundbyprojectidyear")]
    public async Task<IActionResult> PlanGetProjectFundByProjectIDYear([FromQuery] PlanGetProjectFundByProjectIDYearRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectFundByProjectIDYear_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectfundsbyadjustmentprojectid")]
    public async Task<IActionResult> PlanGetProjectFundsByAdjustmentProjectID([FromQuery] PlanGetProjectFundsByAdjustmentProjectIDRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "AdjustmentProjectID", request.AdjustmentProjectID },
            { "ScoaFundID", request.ScoaFundID },
            { "UserFinYear", request.UserFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectFundsByAdjustmentProjectID_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectfundsbyadjustmentprojectidfinyear")]
    public async Task<IActionResult> PlanGetProjectFundsByAdjustmentProjectIDFinYear([FromQuery] PlanGetProjectFundsByAdjustmentProjectIDFinYearRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "AdjustmentProjectID", request.AdjustmentProjectID },
            { "FinYear", request.FinYear },
            { "UserFinYear", request.UserFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectFundsByAdjustmentProjectIDFinYear_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectfundsbyprojectid")]
    public async Task<IActionResult> PlanGetProjectFundsByProjectID([FromQuery] PlanGetProjectFundsByProjectIDRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "ScoaFundID", request.ScoaFundID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectFundsByProjectID_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectfundsbyprojectidfinyear")]
    public async Task<IActionResult> PlanGetProjectFundsByProjectIDFinYear([FromQuery] PlanGetProjectFundsByProjectIDFinYearRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectFundsByProjectIDFinYear_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectfundyear")]
    public async Task<IActionResult> PlanGetProjectFundYear([FromQuery] PlanGetProjectFundYearRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "SCOAFundID", request.SCOAFundID },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectFundYear", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectidp")]
    public async Task<IActionResult> PlanGetProjectIDP([FromQuery] PlanGetProjectIDPRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "ParentIDPItemID", request.ParentIDPItemID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectIDP_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectinitialisationbyfilter")]
    public async Task<IActionResult> PlanGetProjectInitialisationbyFilter([FromQuery] PlanGetProjectInitialisationbyFilterRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "DepartmentID", request.DepartmentID },
            { "ProjectType", request.ProjectType },
            { "FunderID", request.FunderID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectInitialisationbyFilter_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectitemcostestimate")]
    public async Task<IActionResult> PlanGetProjectItemCostEstimate([FromQuery] PlanGetProjectItemCostEstimateRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectPlanID", request.ProjectPlanID },
            { "ReturnProjectItemCostEstimate", request.ReturnProjectItemCostEstimate }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectItemCostEstimate", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectitemfunds")]
    public async Task<IActionResult> PlanGetProjectItemFunds([FromQuery] PlanGetProjectItemFundsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "ScoaFundID", request.ScoaFundID },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectItemFunds_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectitemid")]
    public async Task<IActionResult> PlanGetProjectItemID([FromQuery] PlanGetProjectItemIDRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectItemDescription", request.ProjectItemDescription },
            { "CapturerID", request.CapturerID },
            { "ReturnProjectItemID", request.ReturnProjectItemID },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectItemID", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectitemsbyadjustmentprojectid")]
    public async Task<IActionResult> PlanGetProjectItemsByAdjustmentProjectID([FromQuery] PlanGetProjectItemsByAdjustmentProjectIDRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "AdjustmentProjectID", request.AdjustmentProjectID },
            { "FinYear", request.FinYear },
            { "AdjustmentProjectItemId", request.AdjustmentProjectItemId },
            { "UserFinYear", request.UserFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectItemsByAdjustmentProjectID_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectitemsbyfinyearstoupdate")]
    public async Task<IActionResult> PlanGetProjectItemsByFinYearsToUpdate([FromQuery] PlanGetProjectItemsByFinYearsToUpdateRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "ProjectItemID", request.ProjectItemID },
            { "FinYearToBeExcluded", request.FinYearToBeExcluded }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectItemsByFinYearsToUpdate", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectitemsbyprojectid")]
    public async Task<IActionResult> PlanGetProjectItemsByProjectID([FromQuery] PlanGetProjectItemsByProjectIDRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "FinYear", request.FinYear },
            { "ProjectItemId", request.ProjectItemId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectItemsByProjectID_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectitemsbyprojectidandkpiid")]
    public async Task<IActionResult> PlanGetProjectItemsByProjectIDAndKpiId([FromQuery] PlanGetProjectItemsByProjectIDAndKpiIdRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "KpiId", request.KpiId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectItemsByProjectIDAndKpiId_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectitemstotalallocperfund")]
    public async Task<IActionResult> PlanGetProjectItemsTotalAllocPerFund([FromQuery] PlanGetProjectItemsTotalAllocPerFundRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "ScoaFundID", request.ScoaFundID },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectItemsTotalAllocPerFund_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectmanagers")]
    public async Task<IActionResult> PlanGetProjectManagers()
    {
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectManagers_sp", new Dictionary<string, object?>());
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectpaymentframework")]
    public async Task<IActionResult> PlanGetProjectPaymentFramework([FromQuery] PlanGetProjectPaymentFrameworkRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectName", request.ProjectName }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectPaymentFramework_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectregions")]
    public async Task<IActionResult> PlanGetProjectRegions([FromQuery] PlanGetProjectRegionsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "ScoaRegionID", request.ScoaRegionID },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectRegions_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectscoafunds")]
    public async Task<IActionResult> PlanGetProjectSCOAFunds([FromQuery] PlanGetProjectSCOAFundsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "ScoaFundID", request.ScoaFundID },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectSCOAFunds_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectscoafundsfordropdown")]
    public async Task<IActionResult> PlanGetProjectSCOAFundsForDropdown([FromQuery] PlanGetProjectSCOAFundsForDropdownRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "ScoaFundID", request.ScoaFundID },
            { "Type", request.Type },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectSCOAFundsForDropdown_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectscoaitems")]
    public async Task<IActionResult> PlanGetProjectSCOAItems([FromQuery] PlanGetProjectSCOAItemsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "ScoaItemID", request.ScoaItemID },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectSCOAItems_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectsearch")]
    public async Task<IActionResult> PlanGetProjectSearch([FromQuery] PlanGetProjectSearchRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "IDPItemID", request.IDPItemID },
            { "ProjectID", request.ProjectID },
            { "FinYear", request.FinYear },
            { "ScoaFunctionID", request.ScoaFunctionID },
            { "ScoaCostingID", request.ScoaCostingID },
            { "ScoaProjectID", request.ScoaProjectID },
            { "ScoaRegionID", request.ScoaRegionID },
            { "DivisionID", request.DivisionID },
            { "SCOAItemID", request.SCOAItemID },
            { "SCOAFundID", request.SCOAFundID },
            { "StatusId", request.StatusId },
            { "DepartmentId", request.DepartmentId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectSearch_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectserviceprovider")]
    public async Task<IActionResult> PlanGetProjectServiceProvider([FromQuery] PlanGetProjectServiceProviderRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectServiceProvider_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectserviceprovidervariation")]
    public async Task<IActionResult> PlanGetProjectServiceProviderVariation([FromQuery] PlanGetProjectServiceProviderVariationRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "PaymentFrameworkID", request.PaymentFrameworkID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectServiceProviderVariation_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectstakeholderbyprojectid")]
    public async Task<IActionResult> PlanGetProjectStakeholderByProjectID([FromQuery] PlanGetProjectStakeholderByProjectIDRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectStakeholderByProjectID_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectstoinitialise")]
    public async Task<IActionResult> PlanGetProjectsToInitialise([FromQuery] PlanGetProjectsToInitialiseRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectName", request.ProjectName },
            { "ProjectID", request.ProjectID },
            { "DepartmentID", request.DepartmentID },
            { "ProjectType", request.ProjectType },
            { "FunderID", request.FunderID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectsToInitialise_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectwithdeptdivisions")]
    public async Task<IActionResult> PlanGetProjectWithDeptDivisions([FromQuery] PlanGetProjectWithDeptDivisionsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "UserId", request.UserId },
            { "UserFinYear", request.UserFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectWithDeptDivisions_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectwithlockedscoaitem")]
    public async Task<IActionResult> PlanGetProjectWithLockedSCOAItem([FromQuery] PlanGetProjectWithLockedSCOAItemRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "FinYear", request.FinYear },
            { "ScoaFunctionID", request.ScoaFunctionID },
            { "ScoaRegionID", request.ScoaRegionID },
            { "DivisionID", request.DivisionID },
            { "SCOAItemID", request.SCOAItemID },
            { "SCOAFundId", request.SCOAFundId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectWithLockedSCOAItem_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectworkorderdetails")]
    public async Task<IActionResult> PlanGetProjectWorkOrderDetails([FromQuery] PlanGetProjectWorkOrderDetailsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "ProjectStatus", request.ProjectStatus },
            { "SearchText", request.SearchText }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectWorkOrderDetails_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getrecentadjustmentprojectbyuserid")]
    public async Task<IActionResult> PlanGetRecentAdjustmentProjectByUserId([FromQuery] PlanGetRecentAdjustmentProjectByUserIdRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "loggedInUserId", request.loggedInUserId },
            { "UserFinYear", request.UserFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetRecentAdjustmentProjectByUserId_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getrecentprojectbyuserid")]
    public async Task<IActionResult> PlanGetRecentProjectByUserId([FromQuery] PlanGetRecentProjectByUserIdRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "loggedInUserId", request.loggedInUserId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetRecentProjectByUserId_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getrejectedadjustmentprojects")]
    public async Task<IActionResult> PlanGetRejectedAdjustmentProjects([FromQuery] PlanGetRejectedAdjustmentProjectsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetRejectedAdjustmentProjects_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getremainingfundsbyprojectid")]
    public async Task<IActionResult> PlanGetRemainingFundsByProjectID([FromQuery] PlanGetRemainingFundsByProjectIDRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetRemainingFundsByProjectID_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getscoaadjustmentproject")]
    public async Task<IActionResult> PlanGetSCOAAdjustmentProject([FromQuery] PlanGetSCOAAdjustmentProjectRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "AdjustmentProjectID", request.AdjustmentProjectID },
            { "ScoaAdjustmentProjectID", request.ScoaAdjustmentProjectID },
            { "UserFinYear", request.UserFinYear },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSCOAAdjustmentProject_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getscoaprojectdescription")]
    public async Task<IActionResult> PlanGetSCOAProjectDescription([FromQuery] PlanGetSCOAProjectDescriptionRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAID", request.SCOAID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSCOAProjectDescription", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getscoaprojectexceptiondetails")]
    public async Task<IActionResult> PlanGetSCOAProjectExceptionDetails([FromQuery] PlanGetSCOAProjectExceptionDetailsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "CurrentFinyear", request.CurrentFinyear },
            { "NewFinyear", request.NewFinyear },
            { "ExceptionType", request.ExceptionType }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSCOAProjectExceptionDetails_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getscoaprojectexceptiondetailsbyid")]
    public async Task<IActionResult> PlanGetSCOAProjectExceptionDetailsByID([FromQuery] PlanGetSCOAProjectExceptionDetailsByIDRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ExceptionID", request.ExceptionID },
            { "CurrentFinyear", request.CurrentFinyear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSCOAProjectExceptionDetailsByID_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getscoaprojects")]
    public async Task<IActionResult> PlanGetSCOAProjects([FromQuery] PlanGetSCOAProjectsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "ScoaProjectID", request.ScoaProjectID },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSCOAProjects_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getscoaprojectsfbs")]
    public async Task<IActionResult> PlanGetSCOAProjectsFBS([FromQuery] PlanGetSCOAProjectsFBSRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAProjectFBSID", request.SCOAProjectFBSID },
            { "SCOAId", request.SCOAId },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSCOAProjectsFBS_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getscoasegmentcountsbyadjustmentprojectid")]
    public async Task<IActionResult> PlanGetSCOASegmentCountsByAdjustmentProjectId([FromQuery] PlanGetSCOASegmentCountsByAdjustmentProjectIdRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "AdjustmentProjectID", request.AdjustmentProjectID },
            { "UserFinYear", request.UserFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSCOASegmentCountsByAdjustmentProjectId_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getscoasegmentcountsbyprojectid")]
    public async Task<IActionResult> PlanGetSCOASegmentCountsByProjectId([FromQuery] PlanGetSCOASegmentCountsByProjectIdRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSCOASegmentCountsByProjectId_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getsupportingdocumentsforadjustmentprojectitems")]
    public async Task<IActionResult> PlanGetSupportingDocumentsForAdjustmentProjectItems([FromQuery] PlanGetSupportingDocumentsForAdjustmentProjectItemsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "PlanAdjustmentProjectItemID", request.PlanAdjustmentProjectItemID },
            { "SupportingDocID", request.SupportingDocID },
            { "UserFinYear", request.UserFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSupportingDocumentsForAdjustmentProjectItems_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getsupportingdocumentsforprojectitems")]
    public async Task<IActionResult> PlanGetSupportingDocumentsForProjectItems([FromQuery] PlanGetSupportingDocumentsForProjectItemsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "PlanProjectItemID", request.PlanProjectItemID },
            { "SupportingDocID", request.SupportingDocID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSupportingDocumentsForProjectItems_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-gettrackchangesforadjustmentprojectitems")]
    public async Task<IActionResult> PlanGetTrackChangesForAdjustmentProjectItems([FromQuery] PlanGetTrackChangesForAdjustmentProjectItemsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "AdjustmentProjectId", request.AdjustmentProjectId },
            { "UserFinYear", request.UserFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetTrackChangesForAdjustmentProjectItems_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-gettrackchangesforprojectitems")]
    public async Task<IActionResult> PlanGetTrackChangesForProjectItems([FromQuery] PlanGetTrackChangesForProjectItemsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectId", request.ProjectId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetTrackChangesForProjectItems_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-insertnewprojectitem")]
    public async Task<IActionResult> PlanInsertNewProjectItem([FromBody] PlanInsertNewProjectItemRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectItemDescription", request.ProjectItemDescription },
            { "CapturerID", request.CapturerID },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_InsertNewProjectItem", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-insertscoaprojectfbs")]
    public async Task<IActionResult> PlanInsertSCOAProjectFBS([FromBody] PlanInsertSCOAProjectFBSRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAId", request.SCOAId },
            { "UserId", request.UserId },
            { "FinYear", request.FinYear },
            { "AuditUser", request.AuditUser },
            { "IsEnable", request.IsEnable },
            { "CurrDate", request.CurrDate }
        };
        var result = await _svc.ExecuteSpAsync("Plan_InsertSCOAProjectFBS_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-project-cashflow")]
    public async Task<IActionResult> PlanProjectCashFlow([FromBody] PlanProjectCashFlowRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "UserID", request.UserID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_Project_CashFlow_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-project-cashflowdelete")]
    public async Task<IActionResult> PlanProjectCashFlowDelete([FromBody] PlanProjectCashFlowDeleteRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectCashFlow_ID", request.ProjectCashFlow_ID },
            { "UserID", request.UserID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_Project_CashFlowDelete_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-project-cashflowdeleteaudit")]
    public async Task<IActionResult> PlanProjectCashFlowDeleteAudit([FromBody] PlanProjectCashFlowDeleteAuditRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectCashFlowID", request.ProjectCashFlowID },
            { "UserID", request.UserID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_Project_CashFlowDeleteAudit_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-project-employment-create")]
    public async Task<IActionResult> PlanProjectEmploymentCreate([FromBody] PlanProjectEmploymentCreateRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "UserID", request.UserID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_Project_Employment_Create_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-project-employment")]
    public async Task<IActionResult> PlanProjectEmployment([FromBody] PlanProjectEmploymentRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_Project_Employment_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-project-milestones")]
    public async Task<IActionResult> PlanProjectMilestones([FromBody] PlanProjectMilestonesRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "UserID", request.UserID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_Project_Milestones_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-project-progress")]
    public async Task<IActionResult> PlanProjectProgress([FromBody] PlanProjectProgressRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_Project_Progress_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-project-training-create")]
    public async Task<IActionResult> PlanProjectTrainingCreate([FromBody] PlanProjectTrainingCreateRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "UserID", request.UserID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_Project_Training_Create_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-project-training")]
    public async Task<IActionResult> PlanProjectTraining([FromBody] PlanProjectTrainingRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_Project_Training_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-project-workorderbreakdowns")]
    public async Task<IActionResult> PlanProjectWorkOrderBreakdowns([FromBody] PlanProjectWorkOrderBreakdownsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_Project_WorkOrderBreakdowns_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-projectitembyprojectid")]
    public async Task<IActionResult> PlanProjectItembyProjectID([FromBody] PlanProjectItembyProjectIDRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_ProjectItembyProjectID_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-projectitemukey")]
    public async Task<IActionResult> PlanProjectItemUkey([FromBody] PlanProjectItemUkeyRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "finYear", request.finYear },
            { "userID", request.userID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_ProjectItemUkey_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-projectsbehindschedule")]
    public async Task<IActionResult> PlanProjectsBehindSchedule([FromBody] PlanProjectsBehindScheduleRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "ProjectTypeID", request.ProjectTypeID },
            { "WeeksBehind", request.WeeksBehind },
            { "PercentBehind", request.PercentBehind }
        };
        var result = await _svc.ExecuteSpAsync("Plan_ProjectsBehindSchedule_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-rejectadjustmentproject")]
    public async Task<IActionResult> PlanRejectAdjustmentProject([FromBody] PlanRejectAdjustmentProjectRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "UserId", request.UserId },
            { "AdjustmentProjectId", request.AdjustmentProjectId },
            { "RejectReason", request.RejectReason }
        };
        var result = await _svc.ExecuteSpAsync("Plan_RejectAdjustmentProject_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-updateadjustmentprojectcode")]
    public async Task<IActionResult> PlanUpdateAdjustmentProjectCode([FromBody] PlanUpdateAdjustmentProjectCodeRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectId", request.ProjectId },
            { "UserId", request.UserId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_UpdateAdjustmentProjectCode_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-updateadjustmentprojectitems")]
    public async Task<IActionResult> PlanUpdateAdjustmentProjectItems([FromBody] PlanUpdateAdjustmentProjectItemsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "PlanAdjustmentProjectItemID", request.PlanAdjustmentProjectItemID },
            { "SCOAItemID", request.SCOAItemID },
            { "ModifierID", request.ModifierID },
            { "ProjectFundYearID", request.ProjectFundYearID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_UpdateAdjustmentProjectItems_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-updateadjustmentprojectplan")]
    public async Task<IActionResult> PlanUpdateAdjustmentProjectPlan([FromBody] PlanUpdateAdjustmentProjectPlanRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "AdjustmentProjectID", request.AdjustmentProjectID },
            { "ModifierID", request.ModifierID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_UpdateAdjustmentProjectPlan_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-updateprojectcode")]
    public async Task<IActionResult> PlanUpdateProjectCode([FromBody] PlanUpdateProjectCodeRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectId", request.ProjectId },
            { "UserId", request.UserId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_UpdateProjectCode_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-updateprojectfundanditemforadjustment")]
    public async Task<IActionResult> PlanUpdateProjectFundAndItemForAdjustment([FromBody] PlanUpdateProjectFundAndItemForAdjustmentRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "AdjustmentId", request.AdjustmentId },
            { "UserId", request.UserId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_UpdateProjectFundAndItemForAdjustment_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-updateprojectitems")]
    public async Task<IActionResult> PlanUpdateProjectItems([FromBody] PlanUpdateProjectItemsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "PlanProjectItemID", request.PlanProjectItemID },
            { "SCOAItemID", request.SCOAItemID },
            { "ModifierID", request.ModifierID },
            { "ProjectFundYearID", request.ProjectFundYearID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_UpdateProjectItems", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-updateprojectplan")]
    public async Task<IActionResult> PlanUpdateProjectPlan([FromBody] PlanUpdateProjectPlanRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "ModifierID", request.ModifierID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_UpdateProjectPlan", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-updatescoaprojectfbs")]
    public async Task<IActionResult> PlanUpdateSCOAProjectFBS([FromBody] PlanUpdateSCOAProjectFBSRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAId", request.SCOAId },
            { "UserId", request.UserId },
            { "FinYear", request.FinYear },
            { "FMSAuditDBName", request.FMSAuditDBName },
            { "AuditUser", request.AuditUser },
            { "IsEnable", request.IsEnable },
            { "CurrDate", request.CurrDate }
        };
        var result = await _svc.ExecuteSpAsync("Plan_UpdateSCOAProjectFBS_sp", parameters);
        return Ok(result);
    }
}
