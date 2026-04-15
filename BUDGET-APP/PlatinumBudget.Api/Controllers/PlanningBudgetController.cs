using Microsoft.AspNetCore.Mvc;
using PlatinumBudget.Api.DTOs.Planning;
using PlatinumBudget.Api.Services;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlanningBudgetController : ControllerBase
{
    private readonly PlanningSpService _svc;
    public PlanningBudgetController(PlanningSpService svc) { _svc = svc; }

    [HttpGet]
    [Route("plan-adjustmentfundingsourcebudget")]
    public async Task<IActionResult> PlanAdjustmentFundingSourceBudget([FromQuery] PlanAdjustmentFundingSourceBudgetRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "financialYear", request.financialYear },
            { "UserFinYear", request.UserFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_AdjustmentFundingSourceBudget_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-adjustmentfundingsourcebudgetmultiyear")]
    public async Task<IActionResult> PlanAdjustmentFundingSourceBudgetMultiYear([FromQuery] PlanAdjustmentFundingSourceBudgetMultiYearRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "ShowOnlyZerovaluedFunds", request.ShowOnlyZerovaluedFunds },
            { "UserFinYear", request.UserFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_AdjustmentFundingSourceBudgetMultiYear_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-adjustmentprojectbudgetingexport")]
    public async Task<IActionResult> PlanAdjustmentProjectBudgetingExport([FromQuery] PlanAdjustmentProjectBudgetingExportRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "strDivisionID", request.strDivisionID },
            { "ProjectID", request.ProjectID },
            { "ScoaFunctionID", request.ScoaFunctionID },
            { "FinYear", request.FinYear },
            { "BudgetType", request.BudgetType },
            { "DepartmentID", request.DepartmentID },
            { "ProjectTypeID", request.ProjectTypeID },
            { "ScoaRegionID", request.ScoaRegionID },
            { "ScoaFundID", request.ScoaFundID },
            { "ScoaItemID", request.ScoaItemID },
            { "ProjectStatusId", request.ProjectStatusId },
            { "VersionId", request.VersionId },
            { "SingleMultiYear", request.SingleMultiYear },
            { "Information", request.Information }
        };
        var result = await _svc.ExecuteSpAsync("Plan_AdjustmentProjectBudgetingExport_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-autocreateactivationvotesbyprojectforadjustmentbudget")]
    public async Task<IActionResult> PlanAutoCreateActivationVotesByProjectForAdjustmentBudget([FromQuery] PlanAutoCreateActivationVotesByProjectForAdjustmentBudgetRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_AutoCreateActivationVotesByProjectForAdjustmentBudget_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-autocreateprocurementbyprojectforadjustmentbudget")]
    public async Task<IActionResult> PlanAutoCreateProcurementByProjectForAdjustmentBudget([FromQuery] PlanAutoCreateProcurementByProjectForAdjustmentBudgetRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_AutoCreateProcurementByProjectForAdjustmentBudget_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetadjustmentexportversion-detail")]
    public async Task<IActionResult> PlanBudgetAdjustmentExportVersionDetail([FromQuery] PlanBudgetAdjustmentExportVersionDetailRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "adjustmentVersionID", request.adjustmentVersionID },
            { "finYear", request.finYear },
            { "budgetAdjustmentExportImportVersionHeaderID", request.budgetAdjustmentExportImportVersionHeaderID },
            { "userID", request.userID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetAdjustmentExportVersion_Detail_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetadjustmentexportversion")]
    public async Task<IActionResult> PlanBudgetAdjustmentExportVersion([FromQuery] PlanBudgetAdjustmentExportVersionRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetAdjustmentExportVersion_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetadjustmentfieldvalidation")]
    public async Task<IActionResult> PlanBudgetAdjustmentFieldValidation([FromQuery] PlanBudgetAdjustmentFieldValidationRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "BudgetAdjustmentExportImportVersionHeaderID", request.BudgetAdjustmentExportImportVersionHeaderID },
            { "BudgetAdjustmentImportVersionNumber", request.BudgetAdjustmentImportVersionNumber }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetAdjustmentFieldValidation_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetadjustmentimportresult")]
    public async Task<IActionResult> PlanBudgetAdjustmentImportResult([FromQuery] PlanBudgetAdjustmentImportResultRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "budgetAdjustmentExportImportVersionHeaderID", request.budgetAdjustmentExportImportVersionHeaderID },
            { "budgetAdjustmentImportVersionNumber", request.budgetAdjustmentImportVersionNumber }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetAdjustmentImportResult_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetadjustmentimportversion-exception")]
    public async Task<IActionResult> PlanBudgetAdjustmentImportVersionException([FromQuery] PlanBudgetAdjustmentImportVersionExceptionRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "budgetAdjustmentExportImportVersionHeaderID", request.budgetAdjustmentExportImportVersionHeaderID },
            { "budgetAdjustmentImportVersionNumber", request.budgetAdjustmentImportVersionNumber }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetAdjustmentImportVersion_Exception_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetadjustmentimportversion")]
    public async Task<IActionResult> PlanBudgetAdjustmentImportVersion([FromQuery] PlanBudgetAdjustmentImportVersionRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "budgetAdjustmentExportImportVersionHeaderID", request.budgetAdjustmentExportImportVersionHeaderID },
            { "budgetAdjustmentImportVersionNumber", request.budgetAdjustmentImportVersionNumber },
            { "userID", request.userID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetAdjustmentImportVersion_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetadjustmentprojectregister")]
    public async Task<IActionResult> PlanBudgetAdjustmentProjectRegister([FromQuery] PlanBudgetAdjustmentProjectRegisterRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "budgetAdjustmentExportImportVersionHeaderID", request.budgetAdjustmentExportImportVersionHeaderID },
            { "budgetAdjustmentImportVersionNumber", request.budgetAdjustmentImportVersionNumber },
            { "userId", request.userId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetAdjustmentProjectRegister_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetapproval")]
    public async Task<IActionResult> PlanBudgetApproval([FromQuery] PlanBudgetApprovalRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "UserID", request.UserID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetApproval_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetconsumption")]
    public async Task<IActionResult> PlanBudgetConsumption([FromQuery] PlanBudgetConsumptionRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "StartMonth", request.StartMonth },
            { "EndMonth", request.EndMonth },
            { "strDivisionID", request.strDivisionID },
            { "ProjectID", request.ProjectID },
            { "DepartmentID", request.DepartmentID },
            { "ScoaFunctionID", request.ScoaFunctionID },
            { "ScoaRegionID", request.ScoaRegionID },
            { "ScoaFundID", request.ScoaFundID },
            { "ScoaItemID", request.ScoaItemID },
            { "ScoaProjectId", request.ScoaProjectId },
            { "ScoaCostingId", request.ScoaCostingId },
            { "SingleMultiYear", request.SingleMultiYear },
            { "CapitalOperational", request.CapitalOperational },
            { "ShowScoaFunction", request.ShowScoaFunction },
            { "ShowScoaRegion", request.ShowScoaRegion },
            { "ShowDivision", request.ShowDivision },
            { "ShowScoaCosting", request.ShowScoaCosting },
            { "ShowScoaFund", request.ShowScoaFund },
            { "IsDetailRpt", request.IsDetailRpt }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetConsumption_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetconsumptioncommitmentdetail")]
    public async Task<IActionResult> PlanBudgetConsumptionCommitmentDetail([FromQuery] PlanBudgetConsumptionCommitmentDetailRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "BudgetTransDesc", request.BudgetTransDesc }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetConsumptionCommitmentDetail_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetconsumptiondetail")]
    public async Task<IActionResult> PlanBudgetConsumptionDetail([FromQuery] PlanBudgetConsumptionDetailRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "PlanProjectItemID", request.PlanProjectItemID },
            { "StartMonth", request.StartMonth },
            { "EndMonth", request.EndMonth },
            { "IsDetailRpt", request.IsDetailRpt }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetConsumptionDetail_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetconsumptionexportcsv")]
    public async Task<IActionResult> PlanBudgetConsumptionExportCSV([FromQuery] PlanBudgetConsumptionExportCSVRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "StartMonth", request.StartMonth },
            { "EndMonth", request.EndMonth },
            { "strDivisionID", request.strDivisionID },
            { "ProjectID", request.ProjectID },
            { "DepartmentID", request.DepartmentID },
            { "ScoaFunctionID", request.ScoaFunctionID },
            { "ScoaRegionID", request.ScoaRegionID },
            { "ScoaFundID", request.ScoaFundID },
            { "ScoaItemID", request.ScoaItemID },
            { "ScoaProjectId", request.ScoaProjectId },
            { "ScoaCostingId", request.ScoaCostingId },
            { "SingleMultiYear", request.SingleMultiYear },
            { "CapitalOperational", request.CapitalOperational },
            { "ShowScoaFunction", request.ShowScoaFunction },
            { "ShowScoaRegion", request.ShowScoaRegion },
            { "ShowDivision", request.ShowDivision },
            { "ShowScoaCosting", request.ShowScoaCosting },
            { "ShowScoaFund", request.ShowScoaFund },
            { "IsDetailRpt", request.IsDetailRpt }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetConsumptionExportCSV_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetconsumptioninsert")]
    public async Task<IActionResult> PlanBudgetConsumptionInsert([FromQuery] PlanBudgetConsumptionInsertRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "PlanProjectItemId", request.PlanProjectItemId },
            { "TransactionTypeId", request.TransactionTypeId },
            { "ModuleId", request.ModuleId },
            { "ProcessId", request.ProcessId },
            { "TransactionId", request.TransactionId },
            { "TransactionTable", request.TransactionTable },
            { "CapturerId", request.CapturerId },
            { "TransactionAmount", request.TransactionAmount },
            { "AvailableBudgetDiff", request.AvailableBudgetDiff },
            { "ReserveToDateDiff", request.ReserveToDateDiff },
            { "CapturedExpenditureToDateDiff", request.CapturedExpenditureToDateDiff },
            { "CommitToDateDiff", request.CommitToDateDiff },
            { "InitialLine", request.InitialLine },
            { "CurrentlyConsumedAmount", request.CurrentlyConsumedAmount },
            { "TransactionAmountMultiyear", request.TransactionAmountMultiyear },
            { "AvailableBudgetMultiyearDiff", request.AvailableBudgetMultiyearDiff },
            { "ReserveToDateMultiyearDiff", request.ReserveToDateMultiyearDiff },
            { "CapturedExpenditureToDateMultiyearDiff", request.CapturedExpenditureToDateMultiyearDiff }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetConsumptionInsert_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetconsumptionupdate")]
    public async Task<IActionResult> PlanBudgetConsumptionUpdate([FromQuery] PlanBudgetConsumptionUpdateRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "finYear", request.finYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetConsumptionUpdate_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetcurrentdata")]
    public async Task<IActionResult> PlanBudgetCurrentData([FromQuery] PlanBudgetCurrentDataRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "budgetOriginalExportImportVersionHeaderID", request.budgetOriginalExportImportVersionHeaderID },
            { "budgetOriginalImportVersionNumber", request.budgetOriginalImportVersionNumber },
            { "userID", request.userID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetCurrentData_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetimportprojectregisterexception")]
    public async Task<IActionResult> PlanBudgetImportProjectRegisterException([FromQuery] PlanBudgetImportProjectRegisterExceptionRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "finYear", request.finYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetImportProjectRegisterException_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetmigrationofreservationcommitments")]
    public async Task<IActionResult> PlanBudgetMigrationOfReservationCommitments([FromQuery] PlanBudgetMigrationOfReservationCommitmentsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FromFinyear", request.FromFinyear },
            { "MigrationFinyear", request.MigrationFinyear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetMigrationOfReservationCommitments_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetoriginalbulkinitiate")]
    public async Task<IActionResult> PlanBudgetOriginalBulkInitiate([FromQuery] PlanBudgetOriginalBulkInitiateRequest request)
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
            { "DepartmentId", request.DepartmentId },
            { "UserID", request.UserID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetOriginalBulkInitiate_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetoriginalexportversion-detail")]
    public async Task<IActionResult> PlanBudgetOriginalExportVersionDetail([FromQuery] PlanBudgetOriginalExportVersionDetailRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "versionID", request.versionID },
            { "finYear", request.finYear },
            { "projectStatusID", request.projectStatusID },
            { "budgetType", request.budgetType },
            { "budgetOriginalExportImportVersionHeaderID", request.budgetOriginalExportImportVersionHeaderID },
            { "userID", request.userID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetOriginalExportVersion_Detail_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetoriginalfieldvalidation")]
    public async Task<IActionResult> PlanBudgetOriginalFieldValidation([FromQuery] PlanBudgetOriginalFieldValidationRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "BudgetOriginalExportImportVersionHeaderID", request.BudgetOriginalExportImportVersionHeaderID },
            { "BudgetOriginalImportVersionNumber", request.BudgetOriginalImportVersionNumber }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetOriginalFieldValidation_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetoriginalimportresult")]
    public async Task<IActionResult> PlanBudgetOriginalImportResult([FromQuery] PlanBudgetOriginalImportResultRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "budgetOriginalExportImportVersionHeaderID", request.budgetOriginalExportImportVersionHeaderID },
            { "budgetOriginalImportVersionNumber", request.budgetOriginalImportVersionNumber }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetOriginalImportResult_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetoriginalimportversion-exception")]
    public async Task<IActionResult> PlanBudgetOriginalImportVersionException([FromQuery] PlanBudgetOriginalImportVersionExceptionRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "budgetOriginalExportImportVersionHeaderID", request.budgetOriginalExportImportVersionHeaderID },
            { "budgetOriginalImportVersionNumber", request.budgetOriginalImportVersionNumber }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetOriginalImportVersion_Exception_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetoriginalimportversion")]
    public async Task<IActionResult> PlanBudgetOriginalImportVersion([FromQuery] PlanBudgetOriginalImportVersionRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "budgetOriginalExportImportVersionHeaderID", request.budgetOriginalExportImportVersionHeaderID },
            { "budgetOriginalImportVersionNumber", request.budgetOriginalImportVersionNumber },
            { "userID", request.userID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetOriginalImportVersion_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetoriginalprojectregister")]
    public async Task<IActionResult> PlanBudgetOriginalProjectRegister([FromQuery] PlanBudgetOriginalProjectRegisterRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "versionNumber", request.versionNumber },
            { "versionName", request.versionName },
            { "comments", request.comments },
            { "budgetOriginalExportImportVersionHeaderID", request.budgetOriginalExportImportVersionHeaderID },
            { "budgetOriginalImportVersionNumber", request.budgetOriginalImportVersionNumber },
            { "userId", request.userId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetOriginalProjectRegister_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetrolloverbyfinyear")]
    public async Task<IActionResult> PlanBudgetRolloverByFinYear([FromQuery] PlanBudgetRolloverByFinYearRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "UserID", request.UserID },
            { "BudgetRolloverFileName", request.BudgetRolloverFileName }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetRolloverByFinYear_Sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetrolloverforconstants")]
    public async Task<IActionResult> PlanBudgetRolloverForConstants([FromQuery] PlanBudgetRolloverForConstantsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "UserID", request.UserID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetRolloverForConstants_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetrolloverforplantables")]
    public async Task<IActionResult> PlanBudgetRolloverForPlanTables([FromQuery] PlanBudgetRolloverForPlanTablesRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "UserID", request.UserID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetRolloverForPlanTables_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetzerobudgetconsumptionentry")]
    public async Task<IActionResult> PlanBudgetZeroBudgetConsumptionEntry([FromQuery] PlanBudgetZeroBudgetConsumptionEntryRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "finYear", request.finYear },
            { "userID", request.userID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetZeroBudgetConsumptionEntry_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetzerofieldvalidation")]
    public async Task<IActionResult> PlanBudgetZeroFieldValidation([FromQuery] PlanBudgetZeroFieldValidationRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "BudgetZeroExportImportVersionHeaderID", request.BudgetZeroExportImportVersionHeaderID },
            { "BudgetZeroImportVersionNumber", request.BudgetZeroImportVersionNumber }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetZeroFieldValidation_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetzeroimportresult")]
    public async Task<IActionResult> PlanBudgetZeroImportResult([FromQuery] PlanBudgetZeroImportResultRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "budgetZeroExportImportVersionHeaderID", request.budgetZeroExportImportVersionHeaderID },
            { "budgetZeroImportVersionNumber", request.budgetZeroImportVersionNumber }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetZeroImportResult_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetzeroimportversion-exception")]
    public async Task<IActionResult> PlanBudgetZeroImportVersionException([FromQuery] PlanBudgetZeroImportVersionExceptionRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "budgetZeroExportImportVersionHeaderID", request.budgetZeroExportImportVersionHeaderID },
            { "budgetZeroImportVersionNumber", request.budgetZeroImportVersionNumber }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetZeroImportVersion_Exception_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetzeroimportversion")]
    public async Task<IActionResult> PlanBudgetZeroImportVersion([FromQuery] PlanBudgetZeroImportVersionRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "budgetZeroExportImportVersionHeaderID", request.budgetZeroExportImportVersionHeaderID },
            { "budgetZeroImportVersionNumber", request.budgetZeroImportVersionNumber },
            { "userID", request.userID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetZeroImportVersion_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetzeroinitiateproject")]
    public async Task<IActionResult> PlanBudgetZeroInitiateProject([FromQuery] PlanBudgetZeroInitiateProjectRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "UserID", request.UserID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetZeroInitiateProject_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetzeroitemwithactual")]
    public async Task<IActionResult> PlanBudgetZeroItemWithActual([FromQuery] PlanBudgetZeroItemWithActualRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "finYear", request.finYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetZeroItemWithActual_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-createadjustmentbudgetversion")]
    public async Task<IActionResult> PlanCreateAdjustmentBudgetVersion([FromQuery] PlanCreateAdjustmentBudgetVersionRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "VersionNumber", request.VersionNumber },
            { "VersionName", request.VersionName },
            { "Comments", request.Comments },
            { "FinYear", request.FinYear },
            { "userId", request.userId },
            { "CreateAdjustmentBudgetVersionResult", request.CreateAdjustmentBudgetVersionResult }
        };
        var result = await _svc.ExecuteSpAsync("Plan_CreateAdjustmentBudgetVersion_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-createadjustmentfundingbudgetversion")]
    public async Task<IActionResult> PlanCreateAdjustmentFundingBudgetVersion([FromQuery] PlanCreateAdjustmentFundingBudgetVersionRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "VersionNumber", request.VersionNumber },
            { "VersionName", request.VersionName },
            { "Comments", request.Comments },
            { "FinYear", request.FinYear },
            { "userId", request.userId },
            { "CreateAdjustmentBudgetVersionResult", request.CreateAdjustmentBudgetVersionResult }
        };
        var result = await _svc.ExecuteSpAsync("Plan_CreateAdjustmentFundingBudgetVersion_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-createbudgetversion")]
    public async Task<IActionResult> PlanCreateBudgetVersion([FromQuery] PlanCreateBudgetVersionRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "VersionNumber", request.VersionNumber },
            { "VersionName", request.VersionName },
            { "Comments", request.Comments },
            { "FinYear", request.FinYear },
            { "userId", request.userId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_CreateBudgetVersion_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-createfundingbudgetversion")]
    public async Task<IActionResult> PlanCreateFundingBudgetVersion([FromQuery] PlanCreateFundingBudgetVersionRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "VersionNumber", request.VersionNumber },
            { "VersionName", request.VersionName },
            { "Comments", request.Comments },
            { "FinYear", request.FinYear },
            { "userId", request.userId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_CreateFundingBudgetVersion_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-dailybudgetconsumption")]
    public async Task<IActionResult> PlanDailyBudgetConsumption()
    {
        var result = await _svc.ExecuteSpAsync("Plan_DailyBudgetConsumption_sp", new Dictionary<string, object?>());
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-fundingsourcebudget")]
    public async Task<IActionResult> PlanFundingSourceBudget([FromQuery] PlanFundingSourceBudgetRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "financialYear", request.financialYear },
            { "strActiveFinyear", request.strActiveFinyear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_FundingSourceBudget_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-fundingsourcebudgetmultiyear")]
    public async Task<IActionResult> PlanFundingSourceBudgetMultiYear([FromQuery] PlanFundingSourceBudgetMultiYearRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "ShowOnlyZerovaluedFunds", request.ShowOnlyZerovaluedFunds }
        };
        var result = await _svc.ExecuteSpAsync("Plan_FundingSourceBudgetMultiYear_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getadjustmentbudgetamountbyfinyear")]
    public async Task<IActionResult> PlanGetAdjustmentBudgetAmountByFinYear([FromQuery] PlanGetAdjustmentBudgetAmountByFinYearRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "CurrYear", request.CurrYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetAdjustmentBudgetAmountByFinYear_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getadjustmentbudgets")]
    public async Task<IActionResult> PlanGetAdjustmentBudgets([FromQuery] PlanGetAdjustmentBudgetsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetAdjustmentBudgets_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getadjustmentfundingbudgetscoafundbyfinyears")]
    public async Task<IActionResult> PlanGetAdjustmentFundingBudgetSCOAFundByFinYears([FromQuery] PlanGetAdjustmentFundingBudgetSCOAFundByFinYearsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYearlst", request.FinYearlst },
            { "BudgetType", request.BudgetType },
            { "UserFinYear", request.UserFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetAdjustmentFundingBudgetSCOAFundByFinYears_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getadjustmentprojectbudgetingreport")]
    public async Task<IActionResult> PlanGetAdjustmentProjectBudgetingReport([FromQuery] PlanGetAdjustmentProjectBudgetingReportRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "strDivisionID", request.strDivisionID },
            { "ProjectID", request.ProjectID },
            { "ScoaFunctionID", request.ScoaFunctionID },
            { "FinYear", request.FinYear },
            { "BudgetType", request.BudgetType },
            { "DepartmentID", request.DepartmentID },
            { "ProjectTypeID", request.ProjectTypeID },
            { "ScoaRegionID", request.ScoaRegionID },
            { "ScoaFundID", request.ScoaFundID },
            { "ScoaItemID", request.ScoaItemID },
            { "ProjectStatusId", request.ProjectStatusId },
            { "SingleMultiYear", request.SingleMultiYear },
            { "Information", request.Information },
            { "ScoaCostingID", request.ScoaCostingID },
            { "ScoaProjectID", request.ScoaProjectID },
            { "ShowCostingProject", request.ShowCostingProject }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetAdjustmentProjectBudgetingReport_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getadjustmentprojectbudgetingreportbyversion")]
    public async Task<IActionResult> PlanGetAdjustmentProjectBudgetingReportByVersion([FromQuery] PlanGetAdjustmentProjectBudgetingReportByVersionRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "strDivisionID", request.strDivisionID },
            { "ProjectID", request.ProjectID },
            { "ScoaFunctionID", request.ScoaFunctionID },
            { "FinYear", request.FinYear },
            { "BudgetType", request.BudgetType },
            { "DepartmentID", request.DepartmentID },
            { "ProjectTypeID", request.ProjectTypeID },
            { "ScoaRegionID", request.ScoaRegionID },
            { "ScoaFundID", request.ScoaFundID },
            { "ScoaItemID", request.ScoaItemID },
            { "ProjectStatusId", request.ProjectStatusId },
            { "VersionId", request.VersionId },
            { "SingleMultiYear", request.SingleMultiYear },
            { "Information", request.Information },
            { "ScoaCostingID", request.ScoaCostingID },
            { "ScoaProjectID", request.ScoaProjectID },
            { "ShowCostingProject", request.ShowCostingProject }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetAdjustmentProjectBudgetingReportByVersion_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getalladjustmentfundingbudgetsbyfinyears")]
    public async Task<IActionResult> PlanGetAllAdjustmentFundingBudgetsByFinYears([FromQuery] PlanGetAllAdjustmentFundingBudgetsByFinYearsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinancialYear", request.FinancialYear },
            { "UserFinYear", request.UserFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetAllAdjustmentFundingBudgetsByFinYears_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getallfundingbudgetsbyfinyears")]
    public async Task<IActionResult> PlanGetAllFundingBudgetsByFinYears([FromQuery] PlanGetAllFundingBudgetsByFinYearsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinancialYear", request.FinancialYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetAllFundingBudgetsByFinYears_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getapprovedadjustmentbudgetversions")]
    public async Task<IActionResult> PlanGetApprovedAdjustmentBudgetVersions([FromQuery] PlanGetApprovedAdjustmentBudgetVersionsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetApprovedAdjustmentBudgetVersions_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getbudgetamountbyfinyear")]
    public async Task<IActionResult> PlanGetBudgetAmountByFinYear([FromQuery] PlanGetBudgetAmountByFinYearRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "CurrYear", request.CurrYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetBudgetAmountByFinYear_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getbudgetedprojectitemsbyproject")]
    public async Task<IActionResult> PlanGetBudgetedProjectItemsByProject([FromQuery] PlanGetBudgetedProjectItemsByProjectRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetBudgetedProjectItemsByProject_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getbudgetprojectedcashflowreport")]
    public async Task<IActionResult> PlanGetBudgetProjectedCashflowReport([FromQuery] PlanGetBudgetProjectedCashflowReportRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "BudgetVersionID", request.BudgetVersionID },
            { "DivisionID", request.DivisionID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetBudgetProjectedCashflowReport_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getfundingbudgetscoafundbyfinyears")]
    public async Task<IActionResult> PlanGetFundingBudgetSCOAFundByFinYears([FromQuery] PlanGetFundingBudgetSCOAFundByFinYearsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYearlst", request.FinYearlst },
            { "BudgetType", request.BudgetType }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetFundingBudgetSCOAFundByFinYears_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getlatestadjustmentbudgetversionnumber")]
    public async Task<IActionResult> PlanGetLatestAdjustmentBudgetVersionNumber([FromQuery] PlanGetLatestAdjustmentBudgetVersionNumberRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetLatestAdjustmentBudgetVersionNumber_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getlatestadjustmentfundingbudgetversionnumber")]
    public async Task<IActionResult> PlanGetLatestAdjustmentFundingBudgetVersionNumber([FromQuery] PlanGetLatestAdjustmentFundingBudgetVersionNumberRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetLatestAdjustmentFundingBudgetVersionNumber_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getlatestbudgetversionnumber")]
    public async Task<IActionResult> PlanGetLatestBudgetVersionNumber([FromQuery] PlanGetLatestBudgetVersionNumberRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetLatestBudgetVersionNumber_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getpartialavailablebudgetbyadjustmentprojectid")]
    public async Task<IActionResult> PlanGetPartialAvailableBudgetByAdjustmentProjectId([FromQuery] PlanGetPartialAvailableBudgetByAdjustmentProjectIdRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "UserFinYear", request.UserFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetPartialAvailableBudgetByAdjustmentProjectId_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getpartialavailablebudgetbyprojectid")]
    public async Task<IActionResult> PlanGetPartialAvailableBudgetByProjectId([FromQuery] PlanGetPartialAvailableBudgetByProjectIdRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetPartialAvailableBudgetByProjectId_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectbudgetingreport")]
    public async Task<IActionResult> PlanGetProjectBudgetingReport([FromQuery] PlanGetProjectBudgetingReportRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "strDivisionID", request.strDivisionID },
            { "ProjectID", request.ProjectID },
            { "ScoaFunctionID", request.ScoaFunctionID },
            { "FinYear", request.FinYear },
            { "CapitalOperational", request.CapitalOperational },
            { "DepartmentID", request.DepartmentID },
            { "ProjectTypeID", request.ProjectTypeID },
            { "ScoaRegionID", request.ScoaRegionID },
            { "ScoaFundID", request.ScoaFundID },
            { "ScoaItemID", request.ScoaItemID },
            { "ProjectStatusId", request.ProjectStatusId },
            { "SingleMultiYear", request.SingleMultiYear },
            { "ShowCostingProject", request.ShowCostingProject }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectBudgetingReport_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectbudgetingreportbyversion")]
    public async Task<IActionResult> PlanGetProjectBudgetingReportByVersion([FromQuery] PlanGetProjectBudgetingReportByVersionRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "strDivisionID", request.strDivisionID },
            { "ProjectID", request.ProjectID },
            { "ScoaFunctionID", request.ScoaFunctionID },
            { "FinYear", request.FinYear },
            { "CapitalOperational", request.CapitalOperational },
            { "DepartmentID", request.DepartmentID },
            { "ProjectTypeID", request.ProjectTypeID },
            { "ScoaRegionID", request.ScoaRegionID },
            { "ScoaFundID", request.ScoaFundID },
            { "ScoaItemID", request.ScoaItemID },
            { "ProjectStatusId", request.ProjectStatusId },
            { "VersionId", request.VersionId },
            { "SingleMultiYear", request.SingleMultiYear },
            { "ShowCostingProject", request.ShowCostingProject }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectBudgetingReportByVersion_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectitembudgetbyprojectid")]
    public async Task<IActionResult> PlanGetProjectItemBudgetByProjectID([FromQuery] PlanGetProjectItemBudgetByProjectIDRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectItemBudgetByProjectID_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getprojectrolloverdataforexport")]
    public async Task<IActionResult> PlanGetProjectRollOverDataForExport([FromQuery] PlanGetProjectRollOverDataForExportRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetProjectRollOverDataForExport_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getsupportingdocumentsforadjustmentfundingsource")]
    public async Task<IActionResult> PlanGetSupportingDocumentsForAdjustmentFundingSource([FromQuery] PlanGetSupportingDocumentsForAdjustmentFundingSourceRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FundingSourceBudgetDetailID", request.FundingSourceBudgetDetailID },
            { "SupportingDocID", request.SupportingDocID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSupportingDocumentsForAdjustmentFundingSource_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getsupportingdocumentsforfundingsource")]
    public async Task<IActionResult> PlanGetSupportingDocumentsForFundingSource([FromQuery] PlanGetSupportingDocumentsForFundingSourceRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FundingSourceBudgetDetailID", request.FundingSourceBudgetDetailID },
            { "SupportingDocID", request.SupportingDocID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSupportingDocumentsForFundingSource_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getupdatebudgetmigrationofreservationcommitments")]
    public async Task<IActionResult> PlanGetUpdateBudgetMigrationOfReservationCommitments([FromQuery] PlanGetUpdateBudgetMigrationOfReservationCommitmentsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FromFinyear", request.FromFinyear },
            { "MigrationFinyear", request.MigrationFinyear },
            { "UpdateMigrationOnly", request.UpdateMigrationOnly }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetUpdateBudgetMigrationOfReservationCommitments_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-importbudgetamountintoplanbudgetregister")]
    public async Task<IActionResult> PlanImportBudgetAmountIntoPlanBudgetRegister([FromQuery] PlanImportBudgetAmountIntoPlanBudgetRegisterRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "TableName", request.TableName },
            { "TableNameExp", request.TableNameExp }
        };
        var result = await _svc.ExecuteSpAsync("Plan_ImportBudgetAmountIntoPlanBudgetRegister_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-ntbudgetvalidations")]
    public async Task<IActionResult> PlanNTBudgetValidations([FromQuery] PlanNTBudgetValidationsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "finYear", request.finYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_NTBudgetValidations", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-ntorgbudgetvalidations")]
    public async Task<IActionResult> PlanNTORGBudgetValidations([FromQuery] PlanNTORGBudgetValidationsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "finYear", request.finYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_NTORGBudgetValidations", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-projectbudgetingexport")]
    public async Task<IActionResult> PlanProjectBudgetingExport([FromQuery] PlanProjectBudgetingExportRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "strDivisionID", request.strDivisionID },
            { "ProjectID", request.ProjectID },
            { "ScoaFunctionID", request.ScoaFunctionID },
            { "FinYear", request.FinYear },
            { "CapitalOperational", request.CapitalOperational },
            { "DepartmentID", request.DepartmentID },
            { "ProjectTypeID", request.ProjectTypeID },
            { "ScoaRegionID", request.ScoaRegionID },
            { "ScoaFundID", request.ScoaFundID },
            { "ScoaItemID", request.ScoaItemID },
            { "ProjectStatusId", request.ProjectStatusId },
            { "VersionId", request.VersionId },
            { "SingleMultiYear", request.SingleMultiYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_ProjectBudgetingExport_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-projectrollover")]
    public async Task<IActionResult> PlanProjectRollover([FromBody] PlanProjectRolloverRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "ProjectStatusID", request.ProjectStatusID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_ProjectRollover_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-projectrolloverdataimport")]
    public async Task<IActionResult> PlanProjectRollOverDataImport()
    {
        var result = await _svc.ExecuteSpAsync("Plan_ProjectRollOverDataImport_SP", new Dictionary<string, object?>());
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-recalcbudgetregister")]
    public async Task<IActionResult> PlanRecalcBudgetRegister()
    {
        var result = await _svc.ExecuteSpAsync("Plan_RecalcBudgetRegister_sp", new Dictionary<string, object?>());
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-saveadjustmentbudgetapprovalrejection")]
    public async Task<IActionResult> PlanSaveAdjustmentBudgetApprovalRejection([FromQuery] PlanSaveAdjustmentBudgetApprovalRejectionRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "VersionNumber", request.VersionNumber },
            { "FileName", request.FileName },
            { "RejectReason", request.RejectReason },
            { "Approved", request.Approved },
            { "Rejected", request.Rejected },
            { "UserId", request.UserId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_SaveAdjustmentBudgetApprovalRejection_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-submitadjustmentbudget")]
    public async Task<IActionResult> PlanSubmitAdjustmentBudget([FromQuery] PlanSubmitAdjustmentBudgetRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinancialYear", request.FinancialYear },
            { "UserId", request.UserId },
            { "ApprovedAdjustmentBudgetFileName", request.ApprovedAdjustmentBudgetFileName },
            { "CouncilApprovedDate", request.CouncilApprovedDate },
            { "VersionNumber", request.VersionNumber },
            { "VersionName", request.VersionName },
            { "Comments", request.Comments }
        };
        var result = await _svc.ExecuteSpAsync("Plan_SubmitAdjustmentBudget_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-submitadjustmentbudgetpolicy")]
    public async Task<IActionResult> PlanSubmitAdjustmentBudgetPolicy([FromQuery] PlanSubmitAdjustmentBudgetPolicyRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "UserId", request.UserId },
            { "ApprovedAdjustmentBudgetPolicyFileName", request.ApprovedAdjustmentBudgetPolicyFileName }
        };
        var result = await _svc.ExecuteSpAsync("Plan_SubmitAdjustmentBudgetPolicy_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-submitadjustmentbudgetpolicytemppart1")]
    public async Task<IActionResult> PlanSubmitAdjustmentBudgetPolicyTempPart1([FromQuery] PlanSubmitAdjustmentBudgetPolicyTempPart1Request request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "UserId", request.UserId }
        };
        var result = await _svc.ExecuteSpAsync("Plan_SubmitAdjustmentBudgetPolicyTempPart1_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-updatefundingsourceforadjustedprojects")]
    public async Task<IActionResult> PlanUpdateFundingSourceForAdjustedProjects([FromBody] PlanUpdateFundingSourceForAdjustedProjectsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "AdjustmentProjectId", request.AdjustmentProjectId },
            { "UserId", request.UserId },
            { "FinYear", request.FinYear },
            { "UserFinYear", request.UserFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_UpdateFundingSourceForAdjustedProjects_sp", parameters);
        return Ok(result);
    }
}
