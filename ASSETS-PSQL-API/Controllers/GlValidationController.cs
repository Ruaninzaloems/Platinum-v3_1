using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Services;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/gl-validation")]
public class GlValidationController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    private readonly TransactionService _txnService;

    public GlValidationController(DbConnectionFactory db, TransactionService txnService)
    {
        _db = db;
        _txnService = txnService;
    }

    [HttpPost("validate")]
    public async Task<IActionResult> ValidateGlPosting([FromBody] GlValidationRequest request)
    {
        if (request.AssetIds == null || request.AssetIds.Count == 0)
            return BadRequest(new { error = "At least one asset ID is required" });

        if (string.IsNullOrEmpty(request.TransactionType))
            return BadRequest(new { error = "Transaction type is required" });

        string finYear = request.FinYear ?? _txnService.GetCurrentFinancialPeriod().year;

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var results = new List<GlValidationResult>();
        var allValid = 1;

        foreach (var assetId in request.AssetIds)
        {
            var mscoaConfig = await _txnService.LookupMscoaConfig(conn, assetId, request.TransactionType, finYear);

            bool checkOffsetReserve = false;
            if (request.TransactionType == "Depreciation" || request.CheckOffsetReserve)
            {
                var assetInfo = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
                    SELECT ""MeasurementModel_ID"", COALESCE(""RevaluationReserveClosingBalance"", 0) AS RevalReserve
                    FROM ""Asset_Register_Items"" WHERE ""AssetRegisterItem_ID"" = @assetId",
                    new { assetId });
                bool isRevaluationModel = assetInfo != null && Convert.ToInt32(assetInfo.MeasurementModel_ID ?? 0) == 2;
                checkOffsetReserve = isRevaluationModel && Convert.ToDecimal(assetInfo?.RevalReserve ?? 0) > 0;
            }

            var validation = _txnService.ValidateGlPosting(mscoaConfig, request.TransactionType, assetId, checkOffsetReserve);

            var descr = await conn.QueryFirstOrDefaultAsync<string>(@"
                SELECT ""Description"" FROM ""Asset_Register_Items"" WHERE ""AssetRegisterItem_ID"" = @assetId",
                new { assetId });
            if (descr != null) validation.AssetDescription = descr;

            if (!validation.IsValid)
                allValid = 0;

            results.Add(validation);
        }

        return Ok(new
        {
            valid = allValid,
            transactionType = request.TransactionType,
            finYear,
            assetCount = request.AssetIds.Count,
            failedCount = results.Count(r => !r.IsValid),
            results = results.Where(r => !r.IsValid).ToList()
        });
    }

    [HttpPost("validate-pre-run")]
    public async Task<IActionResult> ValidatePreRun([FromBody] PreRunValidationRequest request)
    {
        string finYear = request.FinYear ?? _txnService.GetCurrentFinancialPeriod().year;

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var groupings = (await conn.QueryAsync<dynamic>(@"
            SELECT DISTINCT
                   COALESCE(""AssetType_ID"", 0) AS ""AssetType_ID"",
                   COALESCE(""AssetCategory_ID"", 0) AS ""AssetCategory_ID"",
                   COALESCE(""Asset_SubCategory_ID"", 0) AS ""Asset_SubCategory_ID"",
                   COALESCE(""MeasurementType_ID"", 0) AS ""MeasurementType_ID"",
                   COALESCE(""AssetStatus_ID"", 0) AS ""AssetStatus_ID"",
                   COALESCE(CAST(NULLIF(""MunicipalDepartment_ID"", '') AS INTEGER), 0) AS ""DepartmentID"",
                   COALESCE(""DivisionID"", 0) AS ""DivisionID""
            FROM ""Asset_Register_Items""
            WHERE COALESCE(""RemainingUsefulLife"", ""UsefulLifeMonthComponent"", 0) > 0
            AND COALESCE(""DateOfDisposal"", '9999-12-31') > GETDATE()
            AND COALESCE(""CarryingAmountClosingBalance"", 0) > COALESCE(""ResidualValue"", 0)")).ToList();

        if (groupings.Count == 0)
            return Ok(new { valid = 1, transactionType = "Depreciation", finYear, groupCount = 0, failedCount = 0, results = new List<object>() });

        var results = new List<GlValidationResult>();
        var allValid = 1;

        foreach (var group in groupings)
        {
            int typeId = (int)(group.AssetType_ID ?? 0);
            int categoryId = (int)(group.AssetCategory_ID ?? 0);
            int subCategoryId = (int)(group.Asset_SubCategory_ID ?? 0);
            int measurementTypeId = (int)(group.MeasurementType_ID ?? 0);
            int assetStatusId = (int)(group.AssetStatus_ID ?? 0);
            int deptId = (int)(group.DepartmentID ?? 0);
            int divId = (int)(group.DivisionID ?? 0);

            var mscoaConfig = await _txnService.LookupMscoaConfigByClassification(conn, typeId, categoryId, subCategoryId, measurementTypeId, "Depreciation", finYear, departmentId: deptId, divisionId: divId);

            bool hasRevalAssets = await conn.ExecuteScalarAsync<int>(@"
                SELECT COUNT(*) FROM ""Asset_Register_Items""
                WHERE COALESCE(""AssetType_ID"", 0) = @typeId
                AND COALESCE(""AssetCategory_ID"", 0) = @categoryId
                AND COALESCE(""Asset_SubCategory_ID"", 0) = @subCategoryId
                AND COALESCE(""MeasurementType_ID"", 0) = @measurementTypeId
                AND COALESCE(""AssetStatus_ID"", 0) = @assetStatusId
                AND COALESCE(CAST(NULLIF(""MunicipalDepartment_ID"", '') AS INTEGER), 0) = @deptId
                AND COALESCE(""DivisionID"", 0) = @divId
                AND COALESCE(""MeasurementModel_ID"", 0) = 2
                AND COALESCE(""RevaluationReserveClosingBalance"", 0) > 0
                AND COALESCE(""RemainingUsefulLife"", ""UsefulLifeMonthComponent"", 0) > 0
                AND COALESCE(""DateOfDisposal"", '9999-12-31') > GETDATE()
                AND COALESCE(""CarryingAmountClosingBalance"", 0) > COALESCE(""ResidualValue"", 0)",
                new { typeId, categoryId, subCategoryId, measurementTypeId, assetStatusId, deptId, divId }) > 0;

            var typeName = await conn.QueryFirstOrDefaultAsync<string>(@"SELECT ""AssetTypeDesc"" FROM ""Const_AssetType_Sys"" WHERE ""AssetType_ID"" = @typeId", new { typeId }) ?? $"Type {typeId}";
            var catName = await conn.QueryFirstOrDefaultAsync<string>(@"SELECT ""AssetCategoryDesc"" FROM ""Const_AssetCategory_sys"" WHERE ""AssetCategoryID"" = @categoryId", new { categoryId }) ?? $"Category {categoryId}";

            var validation = _txnService.ValidateGlPosting(mscoaConfig, "Depreciation", 0, hasRevalAssets);
            validation.AssetDescription = $"{typeName} / {catName}";

            if (!validation.IsValid)
                allValid = 0;

            results.Add(validation);
        }

        return Ok(new
        {
            valid = allValid,
            transactionType = "Depreciation",
            finYear,
            groupCount = groupings.Count,
            failedCount = results.Count(r => !r.IsValid),
            results = results.Where(r => !r.IsValid).ToList()
        });
    }

    [HttpPost("validate-schedule")]
    public async Task<IActionResult> ValidateDepreciationSchedule([FromBody] ScheduleValidationRequest request)
    {
        if (request.ScheduleId <= 0)
            return BadRequest(new { error = "Schedule ID is required" });

        string finYear = request.FinYear ?? _txnService.GetCurrentFinancialPeriod().year;

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var scheduleItems = (await conn.QueryAsync<dynamic>(@"
            SELECT dsi.""Asset_DepreciationSchedule_Item_ID"" AS ""ScheduleItemId"",
                   COALESCE(dsi.""TypeID"", dsi.""AssetType_ID"", 0) AS ""TypeID"",
                   COALESCE(dsi.""CategoryID"", dsi.""AssetCategory_ID"", 0) AS ""CategoryID"",
                   COALESCE(dsi.""SubCategoryID"", dsi.""Asset_SubCategory_ID"", 0) AS ""SubCategoryID"",
                   COALESCE(dsi.""MeasurementTypeID"", dsi.""MeasurementType_ID"", 0) AS ""MeasurementTypeID"",
                   COALESCE(dsi.""DepartmentID"", 0) AS ""DepartmentID"",
                   COALESCE(dsi.""DivisionID"", 0) AS ""DivisionID"",
                   t.""AssetTypeDesc"" AS ""TypeName"",
                   cat.""AssetCategoryDesc"" AS ""CategoryName""
            FROM ""Asset_DepreciationSchedule_Item"" dsi
            LEFT JOIN ""Const_AssetType_Sys"" t ON COALESCE(dsi.""TypeID"", dsi.""AssetType_ID"") = t.""AssetType_ID""
            LEFT JOIN ""Const_AssetCategory_sys"" cat ON COALESCE(dsi.""CategoryID"", dsi.""AssetCategory_ID"") = cat.""AssetCategoryID""
            WHERE dsi.""Asset_DepreciationSchedule_ID"" = @scheduleId
            AND EXISTS (
                SELECT 1 FROM ""Asset_Depreciation"" d
                WHERE COALESCE(d.""IsApproved"", 0) = 0
                AND d.""Depreciation_ScheduledItemID"" = dsi.""Asset_DepreciationSchedule_Item_ID""
            )", new { scheduleId = request.ScheduleId })).ToList();

        if (scheduleItems.Count == 0)
            return Ok(new { valid = 1, transactionType = "Depreciation", itemCount = 0, failedCount = 0, results = new List<object>() });

        var results = new List<GlValidationResult>();
        var allValid = 1;

        foreach (var si in scheduleItems)
        {
            int siId = (int)(si.ScheduleItemId ?? 0);
            int typeId = (int)(si.TypeID ?? 0);
            int categoryId = (int)(si.CategoryID ?? 0);
            int subCategoryId = (int)(si.SubCategoryID ?? 0);
            int measurementTypeId = (int)(si.MeasurementTypeID ?? 0);
            int siDeptId = (int)(si.DepartmentID ?? 0);
            int siDivId = (int)(si.DivisionID ?? 0);

            var mscoaConfig = await _txnService.LookupMscoaConfigByClassification(conn, typeId, categoryId, subCategoryId, measurementTypeId, "Depreciation", finYear, departmentId: siDeptId, divisionId: siDivId);

            bool hasRevalAssets = await conn.ExecuteScalarAsync<int>(@"
                SELECT COUNT(*) FROM ""Asset_Register_Items"" ari
                INNER JOIN ""Asset_Depreciation"" d ON d.""AssetRegisterItem_ID"" = ari.""AssetRegisterItem_ID""
                WHERE COALESCE(ari.""MeasurementModel_ID"", 0) = 2
                AND COALESCE(ari.""RevaluationReserveClosingBalance"", 0) > 0
                AND COALESCE(d.""IsApproved"", 0) = 0
                AND d.""Depreciation_ScheduledItemID"" = @siId",
                new { siId }) > 0;

            var validation = _txnService.ValidateGlPosting(mscoaConfig, "Depreciation", siId, hasRevalAssets);
            var typeName = si.TypeName?.ToString() ?? $"Type {typeId}";
            var catName = si.CategoryName?.ToString() ?? $"Category {categoryId}";
            validation.AssetDescription = $"Schedule Item #{siId} — {typeName} / {catName}";

            if (!validation.IsValid)
                allValid = 0;

            results.Add(validation);
        }

        return Ok(new
        {
            valid = allValid,
            transactionType = "Depreciation",
            finYear,
            scheduleId = request.ScheduleId,
            itemCount = scheduleItems.Count,
            assetCount = scheduleItems.Count,
            failedCount = results.Count(r => !r.IsValid),
            results = results.Where(r => !r.IsValid).ToList()
        });
    }
}

public class GlValidationRequest
{
    public List<int> AssetIds { get; set; } = new();
    public string TransactionType { get; set; } = "";
    public string? FinYear { get; set; }
    public bool CheckOffsetReserve { get; set; }
}

public class ScheduleValidationRequest
{
    public int ScheduleId { get; set; }
    public string? FinYear { get; set; }
}

public class PreRunValidationRequest
{
    public string? FinYear { get; set; }
}
