using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/scm-transfers")]
public class ScmTransferController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    private readonly AssetManagement.Services.EmailService _emailService;
    public ScmTransferController(DbConnectionFactory db, AssetManagement.Services.EmailService emailService)
    {
        _db = db;
        _emailService = emailService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? finYear)
    {
        try
        {
            await using var conn = _db.CreateConnection();
            await conn.OpenAsync();
            var items = await conn.QueryAsync<dynamic>(@"SELECT * FROM ""Asset_SCMTransfer""");
            return Ok(items);
        }
        catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            await using var conn = _db.CreateConnection();
            await conn.OpenAsync();
            var item = await conn.QueryFirstOrDefaultAsync<dynamic>(
                @"SELECT * FROM ""Asset_SCMTransfer"" WHERE ""ID"" = @id", new { id });
            return item is null ? NotFound() : Ok(item);
        }
        catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
    }

    [HttpGet("pending")]
    public async Task<IActionResult> GetPending()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.QueryAsync<dynamic>(@"
            SELECT
                s.""ID""                       AS ""transferId"",
                s.""GRN_ID""                   AS ""grnId"",
                COALESCE(cat.""AssetCategoryDesc"", '') AS ""categoryDescription"",
                COALESCE(cls.""AssetClassDesc"", '')    AS ""classDescription"",
                s.""Description""              AS ""description"",
                s.""CurrentAmount""            AS ""currentAmount"",
                s.""AssetCategory_ID""         AS ""assetCategoryId"",
                s.""AssetClass_ID""            AS ""assetClassId"",
                s.""Asset_SubCategory_ID""     AS ""assetSubCategoryId"",
                s.""AssetType_ID""             AS ""assetTypeId"",
                s.""AssetStatus_ID""           AS ""assetStatusId"",
                s.""AssetCondition_ID""        AS ""assetConditionId"",
                s.""MunicipalDepartment_ID""   AS ""municipalDepartmentId"",
                s.""Custodian_ID""             AS ""custodianId"",
                s.""Town_ID""                  AS ""townId"",
                s.""Street_ID""               AS ""streetId"",
                s.""Building_ID""             AS ""buildingId"",
                s.""Ward_ID""                 AS ""wardId"",
                s.""Room_ID""                 AS ""roomId"",
                s.""Barcode""                 AS ""barcode"",
                s.""SerialNumber""            AS ""serialNumber"",
                s.""RegistrationNumber""      AS ""registrationNumber"",
                s.""Make""                    AS ""make"",
                s.""Model""                   AS ""model"",
                s.""SupplierName""            AS ""supplierName"",
                s.""SupplierCode""            AS ""supplierCode"",
                s.""InvoiceNumber""           AS ""invoiceNo"",
                s.""InvoiceDate""             AS ""invoiceDate"",
                s.""OrderNumber""             AS ""orderNumber"",
                s.""UsefulLifeYearComponent"" AS ""usefulLifeYears"",
                s.""UsefulLifeMonthComponent"" AS ""usefulLifeMonths"",
                s.""SCMItem_ID""             AS ""scmItemId"",
                s.""DateCaptured""           AS ""dateCaptured"",
                cls.""TypeID""               AS ""classTypeId"",
                cls.""AssetCategoryID""      AS ""classCategoryId"",
                cls.""Asset_SubCategory_ID"" AS ""classSubCategoryId"",
                cls.""AssetMeasurement_ID""  AS ""classMeasurementTypeId"",
                cls.""AssetStatus_ID""       AS ""classAssetStatusId"",
                cls.""UsefulLifeInMonths""   AS ""classUsefulLifeMonths"",
                ppi.""PlanProjectItem_ID""   AS ""projectItemId"",
                pp.""Project_ID""            AS ""projectId"",
                COALESCE(pp.""ProjectName"", '') AS ""projectName"",
                CASE WHEN ppi.""PlanProjectItem_ID"" IS NOT NULL
                     THEN CONCAT(ppi.""PlanProjectItem_ID"", ' | ', COALESCE(css.""ScoaCode"", ''), ' | ', COALESCE(css.""ScoaShortDesc"", ''))
                     ELSE '' END              AS ""scoaDesc""
            FROM ""Asset_SCMTransfer"" s
            LEFT JOIN ""Const_AssetCategory_sys"" cat ON cat.""AssetCategoryID"" = s.""AssetCategory_ID""
            LEFT JOIN ""Const_AssetClass_sys""    cls ON cls.""AssetClass_ID""   = s.""AssetClass_ID""
            LEFT JOIN ""Plan_ProjectItem""        ppi ON ppi.""PlanProjectItem_ID"" = s.""ProjectItem_ID""
            LEFT JOIN ""Plan_Project""            pp  ON pp.""Project_ID""  = ppi.""ProjectID""
            LEFT JOIN ""Const_SCOA_Structure""    css ON css.""ScoaID""     = ppi.""SCOAItemID""
            WHERE s.""CurrentAmount"" IS NOT NULL
              AND s.""AssetRegisterItem_ID"" IS NULL
            ORDER BY s.""ID"" ASC");
        return Ok(rows);
    }

    [HttpPatch("{id:int}/assign-asset")]
    public async Task<IActionResult> AssignAsset(int id, [FromBody] System.Text.Json.JsonElement body)
    {
        if (!body.TryGetProperty("assetRegisterItemId", out var assetProp) ||
            assetProp.ValueKind == System.Text.Json.JsonValueKind.Null)
            return BadRequest(new { error = "assetRegisterItemId is required" });

        int assetId = assetProp.GetInt32();
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(
            @"UPDATE ""Asset_SCMTransfer"" SET ""AssetRegisterItem_ID"" = @assetId WHERE ""ID"" = @id",
            new { assetId, id });
        if (rows == 0) return NotFound(new { error = $"SCM transfer {id} not found" });
        try
        {
            var tfrTokens = await _emailService.BuildAssetBaseTokensAsync(conn, assetId);
            var scmDept = await conn.QueryFirstOrDefaultAsync<dynamic>(
                @"SELECT COALESCE(""MunicipalDepartment_ID""::text, '') AS dept FROM ""Asset_SCMTransfer"" WHERE ""ID"" = @id",
                new { id });
            var assetDept = await conn.QueryFirstOrDefaultAsync<dynamic>(
                @"SELECT COALESCE(""MunicipalDepartment_ID""::text, '') AS dept FROM ""Asset_Register_Items"" WHERE ""AssetRegisterItem_ID"" = @assetId",
                new { assetId });
            tfrTokens["FromLocation"] = (string?)(scmDept?.dept) ?? "";
            tfrTokens["ToLocation"]   = (string?)(assetDept?.dept) ?? "";
            _ = _emailService.SendTransactionEmailsAsync("Transfer", tfrTokens);
        }
        catch (Exception ex) { Console.Error.WriteLine($"[ScmTransferController] Email dispatch failed for Transfer approval {id}: {ex.Message}"); }
        return Ok(new { success = true });
    }
}
