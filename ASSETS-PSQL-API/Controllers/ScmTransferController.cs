using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/scm-transfers")]
public class ScmTransferController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    public ScmTransferController(DbConnectionFactory db) => _db = db;

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
                cls.""UsefulLifeInMonths""   AS ""classUsefulLifeMonths""
            FROM ""Asset_SCMTransfer"" s
            LEFT JOIN ""Const_AssetCategory_sys"" cat ON cat.""AssetCategoryID"" = s.""AssetCategory_ID""
            LEFT JOIN ""Const_AssetClass_sys""    cls ON cls.""AssetClass_ID""   = s.""AssetClass_ID""
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
        return rows == 0 ? NotFound(new { error = $"SCM transfer {id} not found" }) : Ok(new { success = true });
    }
}
