using Microsoft.AspNetCore.Mvc;
using PlatinumBudget.Api.DTOs.Planning;
using PlatinumBudget.Api.Services;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlanningValidationController : ControllerBase
{
    private readonly PlanningSpService _svc;
    public PlanningValidationController(PlanningSpService svc) { _svc = svc; }

    [HttpGet]
    [Route("plan-budgetadjustmentntvalidation")]
    public async Task<IActionResult> PlanBudgetAdjustmentNTValidation([FromQuery] PlanBudgetAdjustmentNTValidationRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "BudgetAdjustmentExportImportVersionHeaderID", request.BudgetAdjustmentExportImportVersionHeaderID },
            { "BudgetAdjustmentImportVersionNumber", request.BudgetAdjustmentImportVersionNumber }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetAdjustmentNTValidation_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetoriginalntvalidation")]
    public async Task<IActionResult> PlanBudgetOriginalNTValidation([FromQuery] PlanBudgetOriginalNTValidationRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "BudgetOriginalExportImportVersionHeaderID", request.BudgetOriginalExportImportVersionHeaderID },
            { "BudgetOriginalImportVersionNumber", request.BudgetOriginalImportVersionNumber }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetOriginalNTValidation_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetzerontvalidation")]
    public async Task<IActionResult> PlanBudgetZeroNTValidation([FromQuery] PlanBudgetZeroNTValidationRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "BudgetZeroExportImportVersionHeaderID", request.BudgetZeroExportImportVersionHeaderID },
            { "BudgetZeroImportVersionNumber", request.BudgetZeroImportVersionNumber }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetZeroNTValidation_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-checkcategorybalance")]
    public async Task<IActionResult> PlanCheckCategoryBalance([FromQuery] PlanCheckCategoryBalanceRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "FileName", request.FileName }
        };
        var result = await _svc.ExecuteSpAsync("Plan_CheckCategoryBalance_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-checkcostingbalance")]
    public async Task<IActionResult> PlanCheckCostingBalance([FromQuery] PlanCheckCostingBalanceRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "FileName", request.FileName }
        };
        var result = await _svc.ExecuteSpAsync("Plan_CheckCostingBalance_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-checkfieldslength")]
    public async Task<IActionResult> PlanCheckFieldsLength([FromQuery] PlanCheckFieldsLengthRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "TableName", request.TableName },
            { "columnName", request.columnName }
        };
        var result = await _svc.ExecuteSpAsync("Plan_CheckFieldsLength_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-checkfunctionbalance")]
    public async Task<IActionResult> PlanCheckFunctionBalance([FromQuery] PlanCheckFunctionBalanceRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "FileName", request.FileName }
        };
        var result = await _svc.ExecuteSpAsync("Plan_CheckFunctionBalance_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-checkfundavailableamount")]
    public async Task<IActionResult> PlanCheckFundAvailableAmount([FromQuery] PlanCheckFundAvailableAmountRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_CheckFundAvailableAmount_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-checkfundbalance")]
    public async Task<IActionResult> PlanCheckFundBalance([FromQuery] PlanCheckFundBalanceRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "FileName", request.FileName }
        };
        var result = await _svc.ExecuteSpAsync("Plan_CheckFundBalance_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-checkmendatoryfields")]
    public async Task<IActionResult> PlanCheckMendatoryFields([FromQuery] PlanCheckMendatoryFieldsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "TableName", request.TableName },
            { "columnName", request.columnName }
        };
        var result = await _svc.ExecuteSpAsync("Plan_CheckMendatoryFields_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-checkntvalidations")]
    public async Task<IActionResult> PlanCheckNTValidations([FromQuery] PlanCheckNTValidationsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "ScoaItemId", request.ScoaItemId },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_CheckNTValidations", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-checkntvalidationsforadjustment")]
    public async Task<IActionResult> PlanCheckNTValidationsForAdjustment([FromQuery] PlanCheckNTValidationsForAdjustmentRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "AdjustmentProjectID", request.AdjustmentProjectID },
            { "ScoaItemId", request.ScoaItemId },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_CheckNTValidationsForAdjustment_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-checkpendingadjudstmentapproval")]
    public async Task<IActionResult> PlanCheckPendingAdjudstmentApproval([FromQuery] PlanCheckPendingAdjudstmentApprovalRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "Finyear", request.Finyear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_CheckPendingAdjudstmentApproval_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-checkprojectbalance")]
    public async Task<IActionResult> PlanCheckProjectBalance([FromQuery] PlanCheckProjectBalanceRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "FileName", request.FileName }
        };
        var result = await _svc.ExecuteSpAsync("Plan_CheckProjectBalance_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-checkreferancefields")]
    public async Task<IActionResult> PlanCheckReferanceFields([FromQuery] PlanCheckReferanceFieldsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "TableName", request.TableName },
            { "columnName", request.columnName },
            { "RefTableName", request.RefTableName },
            { "RefColumnName", request.RefColumnName },
            { "whereCondition", request.whereCondition },
            { "OuterWhereQuery", request.OuterWhereQuery }
        };
        var result = await _svc.ExecuteSpAsync("Plan_CheckReferanceFields_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-checkscoaprojectexceptions")]
    public async Task<IActionResult> PlanCheckSCOAProjectExceptions([FromQuery] PlanCheckSCOAProjectExceptionsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "UserId", request.UserId },
            { "currFinYear", request.currFinYear },
            { "nextFinYear", request.nextFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_CheckSCOAProjectExceptions_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-checkuserislastapproverforadjustmentproject")]
    public async Task<IActionResult> PlanCheckUserIsLastApproverForAdjustmentProject([FromQuery] PlanCheckUserIsLastApproverForAdjustmentProjectRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "AdjustmentProjectId", request.AdjustmentProjectId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_CheckUserIsLastApproverForAdjustmentProject_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getntvalidations")]
    public async Task<IActionResult> PlanGetNTValidations([FromQuery] PlanGetNTValidationsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAFundOperationalID", request.SCOAFundOperationalID },
            { "SCOAItemId", request.SCOAItemId },
            { "SCOAFunctionId", request.SCOAFunctionId },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetNTValidations_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-importbudgetamountvalidation")]
    public async Task<IActionResult> PlanImportBudgetAmountValidation([FromQuery] PlanImportBudgetAmountValidationRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "TableName", request.TableName },
            { "TableNameExp", request.TableNameExp },
            { "RunBy", request.RunBy }
        };
        var result = await _svc.ExecuteSpAsync("Plan_ImportBudgetAmountValidation_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-insertntvalidations")]
    public async Task<IActionResult> PlanInsertNTValidations([FromBody] PlanInsertNTValidationsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAItemId", request.SCOAItemId },
            { "SCOAFunctionId", request.SCOAFunctionId },
            { "UserId", request.UserId },
            { "FinYear", request.FinYear },
            { "IsEnable", request.IsEnable },
            { "AuditUser", request.AuditUser }
        };
        var result = await _svc.ExecuteSpAsync("Plan_InsertNTValidations_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-projectitemntvalidation")]
    public async Task<IActionResult> PlanProjectItemNTValidation([FromBody] PlanProjectItemNTValidationRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "finYear", request.finYear },
            { "scoaProjectID", request.scoaProjectID },
            { "scoaItemID", request.scoaItemID },
            { "scoaFunctionID", request.scoaFunctionID },
            { "scoaRegionID", request.scoaRegionID },
            { "scoaCostingID", request.scoaCostingID },
            { "scoaFundID", request.scoaFundID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_ProjectItemNTValidation_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-updatentvalidations")]
    public async Task<IActionResult> PlanUpdateNTValidations([FromBody] PlanUpdateNTValidationsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAItemId", request.SCOAItemId },
            { "SCOAFunctionId", request.SCOAFunctionId },
            { "UserId", request.UserId },
            { "FinYear", request.FinYear },
            { "IsEnable", request.IsEnable },
            { "FMSAuditDBName", request.FMSAuditDBName },
            { "AuditUser", request.AuditUser }
        };
        var result = await _svc.ExecuteSpAsync("Plan_UpdateNTValidations_sp", parameters);
        return Ok(result);
    }
}
