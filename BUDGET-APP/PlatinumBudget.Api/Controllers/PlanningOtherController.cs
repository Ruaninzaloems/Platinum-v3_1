using Microsoft.AspNetCore.Mvc;
using PlatinumBudget.Api.DTOs.Planning;
using PlatinumBudget.Api.Services;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlanningOtherController : ControllerBase
{
    private readonly PlanningSpService _svc;
    public PlanningOtherController(PlanningSpService svc) { _svc = svc; }

    [HttpGet]
    [Route("plan-buddgetregister")]
    public async Task<IActionResult> PlanBuddgetRegister([FromQuery] PlanBuddgetRegisterRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectId", request.ProjectId },
            { "ShowDetail", request.ShowDetail },
            { "RecalcBudget", request.RecalcBudget },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BuddgetRegister_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getadjustmentfundwidgetdetails")]
    public async Task<IActionResult> PlanGetAdjustmentFundWidgetDetails([FromQuery] PlanGetAdjustmentFundWidgetDetailsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "SCOAID", request.SCOAID },
            { "FundingSource", request.FundingSource },
            { "UserFinYear", request.UserFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetAdjustmentFundWidgetDetails_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getapprovedadjustment")]
    public async Task<IActionResult> PlanGetApprovedAdjustment([FromQuery] PlanGetApprovedAdjustmentRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetApprovedAdjustment_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getdepartmentdivisions")]
    public async Task<IActionResult> PlanGetDepartmentDivisions([FromQuery] PlanGetDepartmentDivisionsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "DivisionId", request.DivisionId },
            { "DivisionType", request.DivisionType },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetDepartmentDivisions_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getdepartmentdivisionswithpermissions")]
    public async Task<IActionResult> PlanGetDepartmentDivisionsWithPermissions([FromQuery] PlanGetDepartmentDivisionsWithPermissionsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "DivisionId", request.DivisionId },
            { "DivisionType", request.DivisionType },
            { "UserId", request.UserId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetDepartmentDivisionsWithPermissions_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getdepartmentwithdivisions")]
    public async Task<IActionResult> PlanGetDepartmentWithDivisions([FromQuery] PlanGetDepartmentWithDivisionsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "IsDepartment", request.IsDepartment },
            { "DepartmentId", request.DepartmentId },
            { "DivisionId", request.DivisionId },
            { "DivisionType", request.DivisionType },
            { "FinYear", request.FinYear },
            { "UserId", request.UserId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetDepartmentWithDivisions_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getdivisionsfortrackchanges")]
    public async Task<IActionResult> PlanGetDivisionsForTrackChanges()
    {
        var result = await _svc.ExecuteSpAsync("Plan_GetDivisionsForTrackChanges_sp", new Dictionary<string, object?>());
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getfundwidgetdetails")]
    public async Task<IActionResult> PlanGetFundWidgetDetails([FromQuery] PlanGetFundWidgetDetailsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "SCOAID", request.SCOAID },
            { "FundingSource", request.FundingSource }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetFundWidgetDetails_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getidpfulldescription")]
    public async Task<IActionResult> PlanGetIDPFullDescription([FromQuery] PlanGetIDPFullDescriptionRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "IDPLevelNumber", request.IDPLevelNumber },
            { "FinancialYear", request.FinancialYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetIDPFullDescription_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getkpiperdepartment")]
    public async Task<IActionResult> PlanGetKpiPerDepartment([FromQuery] PlanGetKpiPerDepartmentRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ScoreCardType", request.ScoreCardType },
            { "Quarter", request.Quarter },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetKpiPerDepartment_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getkpiperemployee")]
    public async Task<IActionResult> PlanGetKpiPerEmployee([FromQuery] PlanGetKpiPerEmployeeRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ScoreCardType", request.ScoreCardType },
            { "Quarter", request.Quarter },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetKpiPerEmployee_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getkpiperkpa")]
    public async Task<IActionResult> PlanGetKpiPerKpa([FromQuery] PlanGetKpiPerKpaRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ScoreCardType", request.ScoreCardType },
            { "Quarter", request.Quarter },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetKpiPerKpa_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getnetassetitemsforadjustment")]
    public async Task<IActionResult> PlanGetNetAssetItemsForAdjustment([FromQuery] PlanGetNetAssetItemsForAdjustmentRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAId", request.SCOAId },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetNetAssetItemsForAdjustment_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getpaymentframeworkapproval")]
    public async Task<IActionResult> PlanGetPaymentFrameworkApproval([FromQuery] PlanGetPaymentFrameworkApprovalRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectName", request.ProjectName }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetPaymentFrameworkApproval_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getpendingadjustment")]
    public async Task<IActionResult> PlanGetPendingAdjustment([FromQuery] PlanGetPendingAdjustmentRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "ProjectId", request.ProjectId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetPendingAdjustment_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getrecommendedadjustment")]
    public async Task<IActionResult> PlanGetRecommendedAdjustment([FromQuery] PlanGetRecommendedAdjustmentRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetRecommendedAdjustment_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getrejectedadjustment")]
    public async Task<IActionResult> PlanGetRejectedAdjustment([FromQuery] PlanGetRejectedAdjustmentRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetRejectedAdjustment_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-ntledgertvalidations")]
    public async Task<IActionResult> PlanNTLedgertValidations([FromBody] PlanNTLedgertValidationsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "finYear", request.finYear },
            { "fromMonth", request.fromMonth },
            { "toMonth", request.toMonth }
        };
        var result = await _svc.ExecuteSpAsync("Plan_NTLedgertValidations", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-submitsupplementaryadjustment")]
    public async Task<IActionResult> PlanSubmitSupplementaryAdjustment([FromBody] PlanSubmitSupplementaryAdjustmentRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "UserId", request.UserId },
            { "SupplementaryAdjustmentFileName", request.SupplementaryAdjustmentFileName }
        };
        var result = await _svc.ExecuteSpAsync("Plan_SubmitSupplementaryAdjustment_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-tariffsearchbyservicedesc")]
    public async Task<IActionResult> PlanTariffSearchByServiceDesc([FromQuery] PlanTariffSearchByServiceDescRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ServiceDesc", request.ServiceDesc },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_TariffSearchByServiceDesc_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-updateadjustmentstatus")]
    public async Task<IActionResult> PlanUpdateAdjustmentStatus([FromBody] PlanUpdateAdjustmentStatusRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FMSAuditDBName", request.FMSAuditDBName },
            { "AuditUserID", request.AuditUserID },
            { "AuditDate", request.AuditDate },
            { "AuditUser", request.AuditUser },
            { "ActivFinYear", request.ActivFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_UpdateAdjustmentStatus_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-updateidpiteminitialization")]
    public async Task<IActionResult> PlanUpdateIDPItemInitialization([FromBody] PlanUpdateIDPItemInitializationRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FMSAuditDBName", request.FMSAuditDBName },
            { "AuditUserID", request.AuditUserID },
            { "AuditDate", request.AuditDate },
            { "AuditUser", request.AuditUser },
            { "ActivFinYear", request.ActivFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_UpdateIDPItemInitialization_sp", parameters);
        return Ok(result);
    }
}
