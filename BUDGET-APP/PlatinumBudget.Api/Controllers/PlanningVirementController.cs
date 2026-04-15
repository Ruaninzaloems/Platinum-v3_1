using Microsoft.AspNetCore.Mvc;
using PlatinumBudget.Api.DTOs.Planning;
using PlatinumBudget.Api.Services;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlanningVirementController : ControllerBase
{
    private readonly PlanningSpService _svc;
    public PlanningVirementController(PlanningSpService svc) { _svc = svc; }

    [HttpPost]
    [Route("plan-approvedvirementbycapturerid")]
    public async Task<IActionResult> PlanApprovedVirementByCapturerID([FromBody] PlanApprovedVirementByCapturerIDRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "CapturerId", request.CapturerId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_ApprovedVirementByCapturerID_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-checkuserislastapproverforvirement")]
    public async Task<IActionResult> PlanCheckUserIsLastApproverForVirement([FromQuery] PlanCheckUserIsLastApproverForVirementRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "VirementId", request.VirementId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_CheckUserIsLastApproverForVirement_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-createvirementpolicyversion")]
    public async Task<IActionResult> PlanCreateVirementPolicyVersion([FromBody] PlanCreateVirementPolicyVersionRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "VersionNumber", request.VersionNumber },
            { "VersionName", request.VersionName },
            { "Comments", request.Comments },
            { "IsCouncilApproved", request.IsCouncilApproved },
            { "FileName", request.FileName },
            { "userId", request.userId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_CreateVirementPolicyVersion_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getapprovedvirementbydate")]
    public async Task<IActionResult> PlanGetApprovedVirementByDate([FromQuery] PlanGetApprovedVirementByDateRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FromVirementDate", request.FromVirementDate },
            { "ToVirementDate", request.ToVirementDate }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetApprovedVirementByDate_SP", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getdetailsofvirementreport")]
    public async Task<IActionResult> PlanGetDetailsOfVirementReport([FromQuery] PlanGetDetailsOfVirementReportRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectId", request.ProjectId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetDetailsOfVirementReport_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getlatestvirementpolicyversionnumber")]
    public async Task<IActionResult> PlanGetLatestVirementPolicyVersionNumber([FromQuery] PlanGetLatestVirementPolicyVersionNumberRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetLatestVirementPolicyVersionNumber_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getlistprojectusedinvirement")]
    public async Task<IActionResult> PlanGetListProjectUsedInVirement([FromQuery] PlanGetListProjectUsedInVirementRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinancialYear", request.FinancialYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetListProjectUsedInVirement_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getnextvirementapprover")]
    public async Task<IActionResult> PlanGetNextVirementApprover([FromQuery] PlanGetNextVirementApproverRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "FromProjectId", request.FromProjectId },
            { "UserId", request.UserId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetNextVirementApprover_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectdetailsforvirementapproval")]
    public async Task<IActionResult> PlanGetProjectDetailsforVirementApproval([FromQuery] PlanGetProjectDetailsforVirementApprovalRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "VirementId", request.VirementId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectDetailsforVirementApproval_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectdetailsforvirementreport")]
    public async Task<IActionResult> PlanGetProjectDetailsforVirementReport([FromQuery] PlanGetProjectDetailsforVirementReportRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "Status", request.Status },
            { "FromProjectId", request.FromProjectId },
            { "ToProjectId", request.ToProjectId },
            { "VirementId", request.VirementId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectDetailsforVirementReport_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectdetailsforvirementreportapprovallevel")]
    public async Task<IActionResult> PlanGetProjectDetailsforVirementReportApprovalLevel([FromQuery] PlanGetProjectDetailsforVirementReportApprovalLevelRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "Status", request.Status },
            { "FromProjectId", request.FromProjectId },
            { "ToProjectId", request.ToProjectId },
            { "VirementId", request.VirementId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectDetailsforVirementReportApprovalLevel_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectforvirementapproval")]
    public async Task<IActionResult> PlanGetProjectforVirementApproval([FromQuery] PlanGetProjectforVirementApprovalRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "FromProjectId", request.FromProjectId },
            { "UserId", request.UserId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectforVirementApproval_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getvirementcountsbyvirementid")]
    public async Task<IActionResult> PlanGetVirementCountsByVirementId([FromQuery] PlanGetVirementCountsByVirementIdRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "VirementID", request.VirementID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetVirementCountsByVirementId_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getvirementdetailsbyid")]
    public async Task<IActionResult> PlanGetVirementDetailsById([FromQuery] PlanGetVirementDetailsByIdRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "VirementId", request.VirementId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetVirementDetailsById_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-pendingvirementbyapproverid")]
    public async Task<IActionResult> PlanPendingVirementByApproverID([FromBody] PlanPendingVirementByApproverIDRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "UserId", request.UserId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_PendingVirementByApproverID_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-pendingvirementbyapproveridperapprovallevel")]
    public async Task<IActionResult> PlanPendingVirementByApproverIDPerApprovalLevel([FromBody] PlanPendingVirementByApproverIDPerApprovalLevelRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "UserId", request.UserId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_PendingVirementByApproverIDPerApprovalLevel_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-rejectedvirementbycapturerid")]
    public async Task<IActionResult> PlanRejectedVirementByCapturerID([FromBody] PlanRejectedVirementByCapturerIDRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "CapturerId", request.CapturerId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_RejectedVirementByCapturerID_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-reportntvirementstring")]
    public async Task<IActionResult> PlanReportNTVirementString([FromQuery] PlanReportNTVirementStringRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "finYear", request.finYear },
            { "fromMonth", request.fromMonth },
            { "toMonth", request.toMonth }
        };
        var result = await _svc.ExecuteSpAsync("Plan_ReportNTVirementString_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-updateprojectfundanditemforvirement")]
    public async Task<IActionResult> PlanUpdateProjectFundAndItemForVirement([FromBody] PlanUpdateProjectFundAndItemForVirementRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "VirementId", request.VirementId },
            { "UserId", request.UserId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_UpdateProjectFundAndItemForVirement_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-virementhistorybyprojectid")]
    public async Task<IActionResult> PlanVirementHistoryByProjectID([FromBody] PlanVirementHistoryByProjectIDRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectId", request.ProjectId },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_VirementHistoryByProjectID_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-virementnewplanprojectitemscoasegment")]
    public async Task<IActionResult> PlanVirementNewPlanProjectItemScoaSegment([FromBody] PlanVirementNewPlanProjectItemScoaSegmentRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "projectID", request.projectID },
            { "divisionID", request.divisionID },
            { "scoaSegment", request.scoaSegment }
        };
        var result = await _svc.ExecuteSpAsync("Plan_VirementNewPlanProjectItemScoaSegment_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-virementplanprojectitem")]
    public async Task<IActionResult> PlanVirementPlanProjectItem([FromBody] PlanVirementPlanProjectItemRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "projectID", request.projectID },
            { "divisionID", request.divisionID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_VirementPlanProjectItem_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-virementplanprojectitemamount")]
    public async Task<IActionResult> PlanVirementPlanProjectItemAmount([FromBody] PlanVirementPlanProjectItemAmountRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "planProjectItemID", request.planProjectItemID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_VirementPlanProjectItemAmount_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-virementplanprojectitemscoasegment")]
    public async Task<IActionResult> PlanVirementPlanProjectItemScoaSegment([FromBody] PlanVirementPlanProjectItemScoaSegmentRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "planProjectItemID", request.planProjectItemID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_VirementPlanProjectItemScoaSegment_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-virementtrackchangesbyvirementid")]
    public async Task<IActionResult> PlanVirementTrackChangesByVirementId([FromBody] PlanVirementTrackChangesByVirementIdRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "VirementId", request.VirementId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_VirementTrackChangesByVirementId_sp", parameters);
        return Ok(result);
    }
}
