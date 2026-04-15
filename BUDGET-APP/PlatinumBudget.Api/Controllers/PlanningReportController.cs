using Microsoft.AspNetCore.Mvc;
using PlatinumBudget.Api.DTOs.Planning;
using PlatinumBudget.Api.Services;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlanningReportController : ControllerBase
{
    private readonly PlanningSpService _svc;
    public PlanningReportController(PlanningSpService svc) { _svc = svc; }

    [HttpGet]
    [Route("plan-actualprocurementplanvsbudgetrpt")]
    public async Task<IActionResult> PlanActualProcurementPlanVsBudgetRpt([FromQuery] PlanActualProcurementPlanVsBudgetRptRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "ProcurementPlanNumber", request.ProcurementPlanNumber },
            { "ProjectNumber", request.ProjectNumber },
            { "StatusID", request.StatusID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_ActualProcurementPlanVsBudgetRpt_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-budgetzeroitemreport")]
    public async Task<IActionResult> PlanBudgetZeroItemReport([FromQuery] PlanBudgetZeroItemReportRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "finYear", request.finYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_BudgetZeroItemReport_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-dailybudgetreport")]
    public async Task<IActionResult> PlanDailyBudgetReport([FromQuery] PlanDailyBudgetReportRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "finYear", request.finYear },
            { "fromMonth", request.fromMonth },
            { "toMonth", request.toMonth },
            { "department", request.department }
        };
        var result = await _svc.ExecuteSpAsync("Plan_DailyBudgetReport", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-fundavailablityreport")]
    public async Task<IActionResult> PlanFundAvailablityReport([FromQuery] PlanFundAvailablityReportRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinancialYear", request.FinancialYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_FundAvailablityReport", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-fundingsourcechangereport")]
    public async Task<IActionResult> PlanFundingSourceChangeReport([FromQuery] PlanFundingSourceChangeReportRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_FundingSourceChangeReport_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getadjustmentbudgetsplitdetailsreport")]
    public async Task<IActionResult> PlanGetAdjustmentBudgetSplitDetailsReport([FromQuery] PlanGetAdjustmentBudgetSplitDetailsReportRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "AdjustmentProjectItemId", request.AdjustmentProjectItemId },
            { "ReferenceProjectItemId", request.ReferenceProjectItemId },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetAdjustmentBudgetSplitDetailsReport_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getbtoreport")]
    public async Task<IActionResult> PlanGetBTOReport([FromQuery] PlanGetBTOReportRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "VendorID", request.VendorID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetBTOReport_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getbudgetactualcomparisonhistoricalcurrentreport")]
    public async Task<IActionResult> PlanGetBudgetActualComparisonHistoricalCurrentReport([FromQuery] PlanGetBudgetActualComparisonHistoricalCurrentReportRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "Div", request.Div },
            { "Func", request.Func }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetBudgetActualComparisonHistoricalCurrentReport_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getbudgetcapitaloperatingbywardreport")]
    public async Task<IActionResult> PlanGetBudgetCapitalOperatingByWardReport([FromQuery] PlanGetBudgetCapitalOperatingByWardReportRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "BudgetVersionID", request.BudgetVersionID },
            { "SCOARegionID", request.SCOARegionID },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetBudgetCapitalOperatingByWardReport_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getbudgetcapitalworksplanreport")]
    public async Task<IActionResult> PlanGetBudgetCapitalWorksPlanReport([FromQuery] PlanGetBudgetCapitalWorksPlanReportRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "DivisionID", request.DivisionID },
            { "IDPItem", request.IDPItem },
            { "FinYear", request.FinYear },
            { "BudgetVersionID", request.BudgetVersionID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetBudgetCapitalWorksPlanReport_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getbudgetconsumptionreconreport")]
    public async Task<IActionResult> PlanGetBudgetConsumptionReconReport([FromQuery] PlanGetBudgetConsumptionReconReportRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "DivisionID", request.DivisionID },
            { "ProjectID", request.ProjectID },
            { "ScoaItemID", request.ScoaItemID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetBudgetConsumptionReconReport_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getbudgetdraftcapitalreport")]
    public async Task<IActionResult> PlanGetBudgetDraftCapitalReport([FromQuery] PlanGetBudgetDraftCapitalReportRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "BudgetVersionID", request.BudgetVersionID },
            { "DivisionID", request.DivisionID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetBudgetDraftCapitalReport_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getdraftmtrefrpt")]
    public async Task<IActionResult> PlanGetDraftMTREFRpt([FromQuery] PlanGetDraftMTREFRptRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetDraftMTREFRpt_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getvirementbudgetsplitdetailsreport")]
    public async Task<IActionResult> PlanGetVirementBudgetSplitDetailsReport([FromQuery] PlanGetVirementBudgetSplitDetailsReportRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "VirementId", request.VirementId },
            { "TransferFromto", request.TransferFromto }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetVirementBudgetSplitDetailsReport_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-importassetbudgetreportresults")]
    public async Task<IActionResult> PlanImportAssetBudgetReportResults([FromQuery] PlanImportAssetBudgetReportResultsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "Type", request.Type }
        };
        var result = await _svc.ExecuteSpAsync("Plan_ImportAssetBudgetReportResults_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-importhrbudgetreportresults")]
    public async Task<IActionResult> PlanImportHRBudgetReportResults()
    {
        var result = await _svc.ExecuteSpAsync("Plan_ImportHRBudgetReportResults_sp", new Dictionary<string, object?>());
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-projectdetailrpt-1")]
    public async Task<IActionResult> PlanProjectDetailRpt1([FromQuery] PlanProjectDetailRpt1Request request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_ProjectDetailRpt_1_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-projectrpt")]
    public async Task<IActionResult> PlanProjectRpt([FromQuery] PlanProjectRptRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjCode", request.ProjCode },
            { "ProjName", request.ProjName },
            { "StatusID", request.StatusID },
            { "IDPItemID", request.IDPItemID },
            { "ProjectTypeID", request.ProjectTypeID },
            { "ProjectCategoryID", request.ProjectCategoryID },
            { "ProjectID", request.ProjectID },
            { "FinancialYear", request.FinancialYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_ProjectRpt_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-reportadjustmentbudgetstring-rpt")]
    public async Task<IActionResult> PlanReportAdjustmentBudgetStringRpt([FromQuery] PlanReportAdjustmentBudgetStringRptRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinancialYear", request.FinancialYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_ReportAdjustmentBudgetString_Rpt_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-reportntidpstring-rpt")]
    public async Task<IActionResult> PlanReportNTIDPStringRpt([FromQuery] PlanReportNTIDPStringRptRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "finyear", request.finyear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_ReportNTIDPString_Rpt_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-reportntidpstring-rpt-sp-backend")]
    public async Task<IActionResult> PlanReportNTIDPStringRptspBackend([FromQuery] PlanReportNTIDPStringRptspBackendRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "finyear", request.finyear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_ReportNTIDPString_Rpt_sp_Backend", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-reportntidpstringorgb-rpt")]
    public async Task<IActionResult> PlanReportNTIDPStringORGBRpt([FromQuery] PlanReportNTIDPStringORGBRptRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "finyear", request.finyear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_ReportNTIDPStringORGB_Rpt_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-reportntidpstringorgb-rpt-sp-backend")]
    public async Task<IActionResult> PlanReportNTIDPStringORGBRptspBackend([FromQuery] PlanReportNTIDPStringORGBRptspBackendRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "finyear", request.finyear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_ReportNTIDPStringORGB_Rpt_sp_Backend", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-reportntpradadjustmentidpstring-rpt")]
    public async Task<IActionResult> PlanReportNTPRADAdjustmentIDPStringRpt([FromQuery] PlanReportNTPRADAdjustmentIDPStringRptRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "finyear", request.finyear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_ReportNTPRADAdjustmentIDPString_Rpt_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-revenuereconciliationreport")]
    public async Task<IActionResult> PlanRevenueReconciliationReport([FromQuery] PlanRevenueReconciliationReportRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinancialYear", request.FinancialYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_RevenueReconciliationReport", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-sdbipprogressrpt")]
    public async Task<IActionResult> PlanSDBIPProgressRpt([FromQuery] PlanSDBIPProgressRptRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "Quater", request.Quater },
            { "Department", request.Department },
            { "ResponsiblePost", request.ResponsiblePost }
        };
        var result = await _svc.ExecuteSpAsync("Plan_SDBIPProgressRpt_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-virementbudgetdetailsreport")]
    public async Task<IActionResult> PlanVirementBudgetDetailsReport([FromQuery] PlanVirementBudgetDetailsReportRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "Budget", request.Budget },
            { "Information", request.Information },
            { "ProjectStatusId", request.ProjectStatusId },
            { "ProjectId", request.ProjectId },
            { "ScoaProjectID", request.ScoaProjectID },
            { "ScoaFunctionID", request.ScoaFunctionID },
            { "ScoaRegionID", request.ScoaRegionID },
            { "strDivisionID", request.strDivisionID },
            { "DepartmentID", request.DepartmentID },
            { "ScoaCostingID", request.ScoaCostingID },
            { "ScoaFundID", request.ScoaFundID },
            { "ScoaItemID", request.ScoaItemID },
            { "SingleMultiYear", request.SingleMultiYear },
            { "BudgetType", request.BudgetType }
        };
        var result = await _svc.ExecuteSpAsync("Plan_VirementBudgetDetailsReport_sp", parameters);
        return Ok(result);
    }
}
