using Microsoft.AspNetCore.Mvc;
using PlatinumBudget.Api.DTOs.Planning;
using PlatinumBudget.Api.Services;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlanningScoaController : ControllerBase
{
    private readonly PlanningSpService _svc;
    public PlanningScoaController(PlanningSpService svc) { _svc = svc; }

    [HttpGet]
    [Route("plan-checkscoacostingexceptions")]
    public async Task<IActionResult> PlanCheckSCOACostingExceptions([FromQuery] PlanCheckSCOACostingExceptionsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "UserId", request.UserId },
            { "currFinYear", request.currFinYear },
            { "nextFinYear", request.nextFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_CheckSCOACostingExceptions_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-checkscoafunctionexceptions")]
    public async Task<IActionResult> PlanCheckSCOAFunctionExceptions([FromQuery] PlanCheckSCOAFunctionExceptionsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "UserId", request.UserId },
            { "currFinYear", request.currFinYear },
            { "nextFinYear", request.nextFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_CheckSCOAFunctionExceptions_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-checkscoafundexceptions")]
    public async Task<IActionResult> PlanCheckSCOAFundExceptions([FromQuery] PlanCheckSCOAFundExceptionsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "UserId", request.UserId },
            { "currFinYear", request.currFinYear },
            { "nextFinYear", request.nextFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_CheckSCOAFundExceptions_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-checkscoaitemexceptions")]
    public async Task<IActionResult> PlanCheckSCOAItemExceptions([FromQuery] PlanCheckSCOAItemExceptionsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "UserId", request.UserId },
            { "currFinYear", request.currFinYear },
            { "nextFinYear", request.nextFinYear },
            { "Type", request.Type }
        };
        var result = await _svc.ExecuteSpAsync("Plan_CheckSCOAItemExceptions_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-checkscoaregionexceptions")]
    public async Task<IActionResult> PlanCheckSCOARegionExceptions([FromQuery] PlanCheckSCOARegionExceptionsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "UserId", request.UserId },
            { "currFinYear", request.currFinYear },
            { "nextFinYear", request.nextFinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_CheckSCOARegionExceptions_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getdepartmentdivisionsusingscoafunction")]
    public async Task<IActionResult> PlanGetDepartmentDivisionsUsingSCOAFunction([FromQuery] PlanGetDepartmentDivisionsUsingSCOAFunctionRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "DivisionID", request.DivisionID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetDepartmentDivisionsUsingSCOAFunction_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getdepartmentdivisionsusingscoafunction-sp-backup")]
    public async Task<IActionResult> PlanGetDepartmentDivisionsUsingSCOAFunctionspbackup([FromQuery] PlanGetDepartmentDivisionsUsingSCOAFunctionspbackupRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "DivisionID", request.DivisionID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetDepartmentDivisionsUsingSCOAFunction_sp_backup", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getmultiplescoasegments")]
    public async Task<IActionResult> PlanGetMultipleSCOASegments([FromQuery] PlanGetMultipleSCOASegmentsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SegmentType", request.SegmentType }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetMultipleSCOASegments_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getscoacostingexceptiondetails")]
    public async Task<IActionResult> PlanGetSCOACostingExceptionDetails([FromQuery] PlanGetSCOACostingExceptionDetailsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "CurrentFinyear", request.CurrentFinyear },
            { "NewFinyear", request.NewFinyear },
            { "ExceptionType", request.ExceptionType }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSCOACostingExceptionDetails_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getscoacostingexceptiondetailsbyid")]
    public async Task<IActionResult> PlanGetSCOACostingExceptionDetailsByID([FromQuery] PlanGetSCOACostingExceptionDetailsByIDRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ExceptionID", request.ExceptionID },
            { "CurrentFinyear", request.CurrentFinyear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSCOACostingExceptionDetailsByID_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getscoafunctionexceptiondetails")]
    public async Task<IActionResult> PlanGetSCOAFunctionExceptionDetails([FromQuery] PlanGetSCOAFunctionExceptionDetailsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "CurrentFinyear", request.CurrentFinyear },
            { "NewFinyear", request.NewFinyear },
            { "ExceptionType", request.ExceptionType }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSCOAFunctionExceptionDetails_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getscoafunctionexceptiondetailsbyid")]
    public async Task<IActionResult> PlanGetSCOAFunctionExceptionDetailsByID([FromQuery] PlanGetSCOAFunctionExceptionDetailsByIDRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ExceptionID", request.ExceptionID },
            { "CurrentFinyear", request.CurrentFinyear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSCOAFunctionExceptionDetailsByID_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getscoafundcapital")]
    public async Task<IActionResult> PlanGetSCOAFundCapital([FromQuery] PlanGetSCOAFundCapitalRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAFundCapitalID", request.SCOAFundCapitalID },
            { "SCOAId", request.SCOAId },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSCOAFundCapital_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getscoafundingexceptiondetails")]
    public async Task<IActionResult> PlanGetSCOAFundingExceptionDetails([FromQuery] PlanGetSCOAFundingExceptionDetailsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "CurrentFinyear", request.CurrentFinyear },
            { "NewFinyear", request.NewFinyear },
            { "ExceptionType", request.ExceptionType }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSCOAFundingExceptionDetails_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getscoafundingexceptiondetailsbyid")]
    public async Task<IActionResult> PlanGetSCOAFundingExceptionDetailsByID([FromQuery] PlanGetSCOAFundingExceptionDetailsByIDRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ExceptionID", request.ExceptionID },
            { "CurrentFinyear", request.CurrentFinyear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSCOAFundingExceptionDetailsByID_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getscoafundoperational")]
    public async Task<IActionResult> PlanGetSCOAFundOperational([FromQuery] PlanGetSCOAFundOperationalRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAFundOperationalID", request.SCOAFundOperationalID },
            { "SCOAId", request.SCOAId },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSCOAFundOperational_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getscoaid")]
    public async Task<IActionResult> PlanGetSCOAID()
    {
        var result = await _svc.ExecuteSpAsync("Plan_GetSCOAID", new Dictionary<string, object?>());
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getscoaitemassetfbs")]
    public async Task<IActionResult> PlanGetSCOAItemAssetFBS([FromQuery] PlanGetSCOAItemAssetFBSRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAItemAssetFBSID", request.SCOAItemAssetFBSID },
            { "SCOAId", request.SCOAId },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSCOAItemAssetFBS_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getscoaitemdescription")]
    public async Task<IActionResult> PlanGetSCOAItemDescription([FromQuery] PlanGetSCOAItemDescriptionRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAItemID", request.SCOAItemID }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSCOAItemDescription", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getscoaitemexceptiondetails")]
    public async Task<IActionResult> PlanGetSCOAItemExceptionDetails([FromQuery] PlanGetSCOAItemExceptionDetailsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "CurrentFinyear", request.CurrentFinyear },
            { "NewFinyear", request.NewFinyear },
            { "ExceptionType", request.ExceptionType },
            { "SCOAType", request.SCOAType }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSCOAItemExceptionDetails_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getscoaitemexceptiondetailsbyid")]
    public async Task<IActionResult> PlanGetSCOAItemExceptionDetailsByID([FromQuery] PlanGetSCOAItemExceptionDetailsByIDRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ExceptionID", request.ExceptionID },
            { "CurrentFinyear", request.CurrentFinyear },
            { "SCOAType", request.SCOAType }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSCOAItemExceptionDetailsByID_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getscoaitemfortrackchanges")]
    public async Task<IActionResult> PlanGetSCOAItemForTrackChanges()
    {
        var result = await _svc.ExecuteSpAsync("Plan_GetSCOAItemForTrackChanges_sp", new Dictionary<string, object?>());
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getscoaitemgainor")]
    public async Task<IActionResult> PlanGetSCOAItemGainOR([FromQuery] PlanGetSCOAItemGainORRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAItemGainORID", request.SCOAItemGainORID },
            { "SCOAId", request.SCOAId },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSCOAItemGainOR_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getscoaitemlossoe")]
    public async Task<IActionResult> PlanGetSCOAItemLossOE([FromQuery] PlanGetSCOAItemLossOERequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAItemLossOEID", request.SCOAItemLossOEID },
            { "SCOAId", request.SCOAId },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSCOAItemLossOE_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getscoaitemrevenuefbs")]
    public async Task<IActionResult> PlanGetSCOAItemRevenueFBS([FromQuery] PlanGetSCOAItemRevenueFBSRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAItemRevenueFBSID", request.SCOAItemRevenueFBSID },
            { "SCOAId", request.SCOAId },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSCOAItemRevenueFBS_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getscoaitemusingallscoafields")]
    public async Task<IActionResult> PlanGetSCOAItemUsingAllSCOAFields([FromQuery] PlanGetSCOAItemUsingAllSCOAFieldsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ProjectID", request.ProjectID },
            { "DivisionId", request.DivisionId },
            { "SCOAFunctionId", request.SCOAFunctionId },
            { "SCOAFundId", request.SCOAFundId },
            { "SCOARegionId", request.SCOARegionId },
            { "SCOACostingId", request.SCOACostingId },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSCOAItemUsingAllSCOAFields_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getscoaregionalexceptiondetails")]
    public async Task<IActionResult> PlanGetSCOARegionalExceptionDetails([FromQuery] PlanGetSCOARegionalExceptionDetailsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "CurrentFinyear", request.CurrentFinyear },
            { "NewFinyear", request.NewFinyear },
            { "ExceptionType", request.ExceptionType }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSCOARegionalExceptionDetails_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getscoaregionalexceptiondetailsbyid")]
    public async Task<IActionResult> PlanGetSCOARegionalExceptionDetailsByID([FromQuery] PlanGetSCOARegionalExceptionDetailsByIDRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ExceptionID", request.ExceptionID },
            { "CurrentFinyear", request.CurrentFinyear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSCOARegionalExceptionDetailsByID_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-getscoasegmentscreditdebitdetails")]
    public async Task<IActionResult> PlanGetSCOASegmentsCreditDebitDetails([FromQuery] PlanGetSCOASegmentsCreditDebitDetailsRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ScoaID", request.ScoaID },
            { "SegmentType", request.SegmentType },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_GetSCOASegmentsCreditDebitDetails_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-insertscoafundcapital")]
    public async Task<IActionResult> PlanInsertSCOAFundCapital([FromBody] PlanInsertSCOAFundCapitalRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAId", request.SCOAId },
            { "UserId", request.UserId },
            { "FinYear", request.FinYear },
            { "IsEnable", request.IsEnable },
            { "AuditUser", request.AuditUser },
            { "CurrDate", request.CurrDate }
        };
        var result = await _svc.ExecuteSpAsync("Plan_InsertSCOAFundCapital_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-insertscoafundoperational")]
    public async Task<IActionResult> PlanInsertSCOAFundOperational([FromBody] PlanInsertSCOAFundOperationalRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAId", request.SCOAId },
            { "UserId", request.UserId },
            { "FinYear", request.FinYear },
            { "IsEnable", request.IsEnable },
            { "AuditUser", request.AuditUser },
            { "CurrDate", request.CurrDate }
        };
        var result = await _svc.ExecuteSpAsync("Plan_InsertSCOAFundOperational_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-insertscoaitemassetfbs")]
    public async Task<IActionResult> PlanInsertSCOAItemAssetFBS([FromBody] PlanInsertSCOAItemAssetFBSRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAId", request.SCOAId },
            { "UserId", request.UserId },
            { "FinYear", request.FinYear },
            { "IsEnable", request.IsEnable },
            { "CreditDebit", request.CreditDebit },
            { "AuditUser", request.AuditUser }
        };
        var result = await _svc.ExecuteSpAsync("Plan_InsertSCOAItemAssetFBS_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-insertscoaitemgainor")]
    public async Task<IActionResult> PlanInsertSCOAItemGainOR([FromBody] PlanInsertSCOAItemGainORRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAId", request.SCOAId },
            { "UserId", request.UserId },
            { "FinYear", request.FinYear },
            { "IsEnable", request.IsEnable },
            { "CreditDebit", request.CreditDebit },
            { "AuditUser", request.AuditUser },
            { "CurrDate", request.CurrDate }
        };
        var result = await _svc.ExecuteSpAsync("Plan_InsertSCOAItemGainOR_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-insertscoaitemlossoe")]
    public async Task<IActionResult> PlanInsertSCOAItemLossOE([FromBody] PlanInsertSCOAItemLossOERequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAId", request.SCOAId },
            { "UserId", request.UserId },
            { "FinYear", request.FinYear },
            { "IsEnable", request.IsEnable },
            { "CreditDebit", request.CreditDebit },
            { "AuditUser", request.AuditUser },
            { "CurrDate", request.CurrDate }
        };
        var result = await _svc.ExecuteSpAsync("Plan_InsertSCOAItemLossOE_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-insertscoaitemrevenuefbs")]
    public async Task<IActionResult> PlanInsertSCOAItemRevenueFBS([FromBody] PlanInsertSCOAItemRevenueFBSRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAId", request.SCOAId },
            { "UserId", request.UserId },
            { "FinYear", request.FinYear },
            { "IsEnable", request.IsEnable },
            { "CreditDebit", request.CreditDebit },
            { "AuditUser", request.AuditUser },
            { "CurrDate", request.CurrDate }
        };
        var result = await _svc.ExecuteSpAsync("Plan_InsertSCOAItemRevenueFBS_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-reportntscoastring-rpt")]
    public async Task<IActionResult> PlanReportNTSCOAStringRpt([FromQuery] PlanReportNTSCOAStringRptRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinancialYear", request.FinancialYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_ReportNTSCOAString_Rpt_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-reportntscoastring-rpt-sp-backup")]
    public async Task<IActionResult> PlanReportNTSCOAStringRptspbackup([FromQuery] PlanReportNTSCOAStringRptspbackupRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinancialYear", request.FinancialYear },
            { "p2", request.p2 }
        };
        var result = await _svc.ExecuteSpAsync("Plan_ReportNTSCOAString_Rpt_sp_backup", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-reportntscoastringorgb-rpt")]
    public async Task<IActionResult> PlanReportNTSCOAStringORGBRpt([FromQuery] PlanReportNTSCOAStringORGBRptRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinancialYear", request.FinancialYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_ReportNTSCOAStringORGB_Rpt_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-reportscoasegment")]
    public async Task<IActionResult> PlanReportSCOASegment([FromQuery] PlanReportSCOASegmentRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "FinYear", request.FinYear },
            { "ProjectID", request.ProjectID },
            { "ScoaSegmentType", request.ScoaSegmentType },
            { "BudgetType", request.BudgetType }
        };
        var result = await _svc.ExecuteSpAsync("Plan_ReportSCOASegment_sp", parameters);
        return Ok(result);
    }

    [HttpGet]
    [Route("plan-scoasegmentsfilteredlist")]
    public async Task<IActionResult> PlanSCOASegmentsFilteredList([FromQuery] PlanSCOASegmentsFilteredListRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "ScoaID", request.ScoaID },
            { "Level", request.Level },
            { "SegmentType", request.SegmentType },
            { "FinYear", request.FinYear }
        };
        var result = await _svc.ExecuteSpAsync("Plan_SCOASegmentsFilteredList_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-updatescoafundcapital")]
    public async Task<IActionResult> PlanUpdateSCOAFundCapital([FromBody] PlanUpdateSCOAFundCapitalRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAId", request.SCOAId },
            { "UserId", request.UserId },
            { "FinYear", request.FinYear },
            { "IsEnable", request.IsEnable },
            { "FMSAuditDBName", request.FMSAuditDBName },
            { "AuditUser", request.AuditUser }
        };
        var result = await _svc.ExecuteSpAsync("Plan_UpdateSCOAFundCapital_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-updatescoafundoperational")]
    public async Task<IActionResult> PlanUpdateSCOAFundOperational([FromBody] PlanUpdateSCOAFundOperationalRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAId", request.SCOAId },
            { "UserId", request.UserId },
            { "FinYear", request.FinYear },
            { "IsEnable", request.IsEnable },
            { "FMSAuditDBName", request.FMSAuditDBName },
            { "AuditUser", request.AuditUser }
        };
        var result = await _svc.ExecuteSpAsync("Plan_UpdateSCOAFundOperational_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-updatescoaitemassetfbs")]
    public async Task<IActionResult> PlanUpdateSCOAItemAssetFBS([FromBody] PlanUpdateSCOAItemAssetFBSRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAId", request.SCOAId },
            { "UserId", request.UserId },
            { "FinYear", request.FinYear },
            { "IsEnable", request.IsEnable },
            { "CreditDebit", request.CreditDebit },
            { "FMSAuditDBName", request.FMSAuditDBName },
            { "AuditUser", request.AuditUser }
        };
        var result = await _svc.ExecuteSpAsync("Plan_UpdateSCOAItemAssetFBS_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-updatescoaitemgainor")]
    public async Task<IActionResult> PlanUpdateSCOAItemGainOR([FromBody] PlanUpdateSCOAItemGainORRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAId", request.SCOAId },
            { "UserId", request.UserId },
            { "FinYear", request.FinYear },
            { "IsEnable", request.IsEnable },
            { "CreditDebit", request.CreditDebit },
            { "FMSAuditDBName", request.FMSAuditDBName },
            { "AuditUser", request.AuditUser }
        };
        var result = await _svc.ExecuteSpAsync("Plan_UpdateSCOAItemGainOR_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-updatescoaitemlossoe")]
    public async Task<IActionResult> PlanUpdateSCOAItemLossOE([FromBody] PlanUpdateSCOAItemLossOERequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAId", request.SCOAId },
            { "UserId", request.UserId },
            { "FinYear", request.FinYear },
            { "IsEnable", request.IsEnable },
            { "CreditDebit", request.CreditDebit },
            { "FMSAuditDBName", request.FMSAuditDBName },
            { "AuditUser", request.AuditUser }
        };
        var result = await _svc.ExecuteSpAsync("Plan_UpdateSCOAItemLossOE_sp", parameters);
        return Ok(result);
    }

    [HttpPost]
    [Route("plan-updatescoaitemrevenuefbs")]
    public async Task<IActionResult> PlanUpdateSCOAItemRevenueFBS([FromBody] PlanUpdateSCOAItemRevenueFBSRequest request)
    {
        var parameters = new Dictionary<string, object?> {
            { "SCOAId", request.SCOAId },
            { "UserId", request.UserId },
            { "FinYear", request.FinYear },
            { "IsEnable", request.IsEnable },
            { "CreditDebit", request.CreditDebit },
            { "FMSAuditDBName", request.FMSAuditDBName },
            { "AuditUser", request.AuditUser }
        };
        var result = await _svc.ExecuteSpAsync("Plan_UpdateSCOAItemRevenueFBS_sp", parameters);
        return Ok(result);
    }
}
