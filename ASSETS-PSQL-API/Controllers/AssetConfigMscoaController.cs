using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Services;
using AssetManagement.Models;
using ClosedXML.Excel;

namespace AssetManagement.Controllers;

public class AssetConfigMscoaDto
{
    public string FinYear { get; set; } = "";
    public int? TypeId { get; set; }
    public int? CategoryId { get; set; }
    public int? SubCategoryId { get; set; }
    public int? MeasurementTypeId { get; set; }
    public int? StatusId { get; set; }
    public int? DepartmentId { get; set; }
    public int? DivisionId { get; set; }
    public int? Default { get; set; }
    public int? Enabled { get; set; }
    public int? CreatedById { get; set; }
    public int? ModifiedById { get; set; }
}

public class MscoaTransactionTypeDto
{
    public int TransactionTypeId { get; set; }
    public int? Project11 { get; set; }
    public int? DebitItem11_1 { get; set; }
    public string? DebitItem11_1Display { get; set; }
    public int? DebitItem11_2 { get; set; }
    public string? DebitItem11_2Display { get; set; }
    public int? CreditItem11_1 { get; set; }
    public string? CreditItem11_1Display { get; set; }
    public int? Project21 { get; set; }
    public int? DebitItem21_1 { get; set; }
    public string? DebitItem21_1Display { get; set; }
    public int? DebitItem21_2 { get; set; }
    public string? DebitItem21_2Display { get; set; }
    public int? CreditItem21_1 { get; set; }
    public string? CreditItem21_1Display { get; set; }
    public int? Project12 { get; set; }
    public int? DebitItem12_1 { get; set; }
    public string? DebitItem12_1Display { get; set; }
    public int? CreditItem12_1 { get; set; }
    public string? CreditItem12_1Display { get; set; }
    public int? Project22 { get; set; }
    public int? DebitItem22_1 { get; set; }
    public string? DebitItem22_1Display { get; set; }
    public int? Project13 { get; set; }
    public int? CreditItem13_1 { get; set; }
    public string? CreditItem13_1Display { get; set; }
    public int? Project23 { get; set; }
    public int? CreditItem23_1 { get; set; }
    public string? CreditItem23_1Display { get; set; }
    public int? Project14 { get; set; }
    public int? Project24 { get; set; }
    public int? Project15 { get; set; }
    public int? Project25 { get; set; }
}

[ApiController]
[Route("api/asset-config-mscoa")]
public class AssetConfigMscoaController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    private readonly LookupService _lookup;
    private readonly InternalApiClient _internalApi;

    public AssetConfigMscoaController(DbConnectionFactory db, LookupService lookup, InternalApiClient internalApi)
    {
        _db = db;
        _lookup = lookup;
        _internalApi = internalApi;
    }

    [HttpGet("fin-years")]
    public async Task<IActionResult> GetFinYears()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var years = await conn.QueryAsync<string>(@"SELECT DISTINCT ""FinYear"" FROM ""AssetConfig_mSCOA"" ORDER BY ""FinYear""");
        return Ok(years);
    }

    [HttpGet("transaction-type-defs")]
    public async Task<IActionResult> GetTransactionTypeDefs()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.QueryAsync(@"
            SELECT ""AssetConfig_TransactionType_ID"" as ""id"",
                   ""Name"" as ""name"",
                   ""SubType1"" as ""subType1"",
                   ""SubType2"" as ""subType2"",
                   ""DRDisplayName11"" as ""drDisplayName11"",
                   ""DRDisplayName12"" as ""drDisplayName12"",
                   ""DRDisplayName13"" as ""drDisplayName13"",
                   ""DRDisplayName14"" as ""drDisplayName14"",
                   ""CRDisplayName11"" as ""crDisplayName11"",
                   ""DRDisplayName21"" as ""drDisplayName21"",
                   ""DRDisplayName22"" as ""drDisplayName22"",
                   ""DRDisplayName23"" as ""drDisplayName23"",
                   ""CRDisplayName21"" as ""crDisplayName21"",
                   ""CRDisplayName22"" as ""crDisplayName22"",
                   ""DRProjectType11"" as ""drProjectType11"",
                   ""DRProjectType12"" as ""drProjectType12"",
                   ""DRProjectType13"" as ""drProjectType13"",
                   ""DRProjectType14"" as ""drProjectType14"",
                   ""DRProjectType21"" as ""drProjectType21"",
                   ""DRProjectType22"" as ""drProjectType22"",
                   ""CRProjectType11"" as ""crProjectType11"",
                   ""CRProjectType21"" as ""crProjectType21"",
                   ""CRProjectType22"" as ""crProjectType22"",
                   ""DRPositionStatementType11"" as ""drPositionStatementType11"",
                   ""DRPositionStatementType12"" as ""drPositionStatementType12"",
                   ""DRPositionStatementType13"" as ""drPositionStatementType13"",
                   ""DRPositionStatementType14"" as ""drPositionStatementType14"",
                   ""CRPositionStatementType11"" as ""crPositionStatementType11"",
                   ""DRPositionStatementType21"" as ""drPositionStatementType21"",
                   ""DRPositionStatementType22"" as ""drPositionStatementType22"",
                   ""DRPositionStatementType23"" as ""drPositionStatementType23"",
                   ""CRPositionStatementType21"" as ""crPositionStatementType21"",
                   ""CRPositionStatementType22"" as ""crPositionStatementType22""
            FROM ""AssetConfig_TransactionType""
            WHERE ""Enabled"" = 1
            ORDER BY ""AssetConfig_TransactionType_ID""");
        return Ok(rows);
    }

    [HttpGet("votes")]
    public async Task<IActionResult> GetVotes([FromQuery] string? finYear = null)
    {
        var path = string.IsNullOrWhiteSpace(finYear)
            ? "api/led-votes"
            : $"api/led-votes?finYear={Uri.EscapeDataString(finYear)}";
        var rows = await _internalApi.GetAsync<List<object>>(path);
        return Ok(rows ?? new List<object>());
    }

    [HttpGet("projects")]
    public async Task<IActionResult> GetProjects([FromQuery] string? finYear = null)
    {
        var path = string.IsNullOrWhiteSpace(finYear)
            ? "api/plan-projects"
            : $"api/plan-projects?finYear={Uri.EscapeDataString(finYear)}";
        var rows = await _internalApi.GetAsync<List<object>>(path);
        return Ok(rows ?? new List<object>());
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? finYear = null, [FromQuery] int? typeId = null,
        [FromQuery] int? categoryId = null, [FromQuery] int? subCategoryId = null,
        [FromQuery] int? departmentId = null, [FromQuery] int? divisionId = null)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT m.""AssetConfig_mSCOA_ID"" as ""assetConfigMscoaId"",
                           m.""FinYear"" as ""finYear"",
                           m.""TypeID"" as ""typeId"",
                           m.""CategoryID"" as ""categoryId"",
                           m.""SubCategoryID"" as ""subCategoryId"",
                           m.""MeasurementTypeID"" as ""measurementTypeId"",
                           m.""StatusID"" as ""statusId"",
                           m.""DepartmentID"" as ""departmentId"",
                           m.""DivisionID"" as ""divisionId"",
                           m.""Default"" as ""default"",
                           m.""Enabled"" as ""enabled"",
                           m.""UpLoadFile"" as ""uploadFile"",
                           m.""CreatedDate"" as ""createdDate"",
                           t.""AssetTypeDesc"" as ""typeDesc"",
                           c.""AssetCategoryDesc"" as ""categoryDesc"",
                           sc.""Asset_SubCategoryDescription"" as ""subCategoryDesc"",
                           mt.""Name"" as ""measurementTypeName"",
                           st.""AssetStatusDesc"" as ""statusDesc"",
                           '' AS ""departmentDesc"",
                           '' AS ""divisionDesc""
                    FROM ""AssetConfig_mSCOA"" m
                    LEFT JOIN ""Const_AssetType_Sys"" t ON m.""TypeID"" = t.""AssetType_ID""
                    LEFT JOIN ""Const_AssetCategory_sys"" c ON m.""CategoryID"" = c.""AssetCategoryID""
                    LEFT JOIN ""Const_Asset_SubCategory"" sc ON m.""SubCategoryID"" = sc.""Asset_SubCategory_ID""
                    LEFT JOIN ""AssetConfig_MeasurementType"" mt ON m.""MeasurementTypeID"" = mt.""AssetConfig_MeasurementType_ID""
                    LEFT JOIN ""Const_AssetStatus_Sys"" st ON m.""StatusID"" = st.""AssetStatus_ID""
                    WHERE 1=1";
        if (!string.IsNullOrEmpty(finYear)) sql += @" AND m.""FinYear"" = @finYear";
        if (typeId.HasValue) sql += @" AND m.""TypeID"" = @typeId";
        if (categoryId.HasValue) sql += @" AND m.""CategoryID"" = @categoryId";
        if (subCategoryId.HasValue) sql += @" AND m.""SubCategoryID"" = @subCategoryId";
        if (departmentId.HasValue) sql += @" AND m.""DepartmentID"" = @departmentId";
        if (divisionId.HasValue) sql += @" AND m.""DivisionID"" = @divisionId";
        sql += @" ORDER BY m.""AssetConfig_mSCOA_ID""";
        var items = await conn.QueryAsync(sql, new { finYear, typeId, categoryId, subCategoryId, departmentId, divisionId });
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync(@"
            SELECT m.""AssetConfig_mSCOA_ID"" as ""assetConfigMscoaId"",
                   m.""FinYear"" as ""finYear"",
                   m.""TypeID"" as ""typeId"",
                   m.""CategoryID"" as ""categoryId"",
                   m.""SubCategoryID"" as ""subCategoryId"",
                   m.""MeasurementTypeID"" as ""measurementTypeId"",
                   m.""StatusID"" as ""statusId"",
                   m.""DepartmentID"" as ""departmentId"",
                   m.""DivisionID"" as ""divisionId"",
                   t.""AssetTypeDesc"" as ""typeDesc"",
                   c.""AssetCategoryDesc"" as ""categoryDesc"",
                   sc.""Asset_SubCategoryDescription"" as ""subCategoryDesc"",
                   mt.""Name"" as ""measurementTypeName"",
                   st.""AssetStatusDesc"" as ""statusDesc"",
                   '' AS ""departmentDesc"",
                   '' AS ""divisionDesc""
            FROM ""AssetConfig_mSCOA"" m
            LEFT JOIN ""Const_AssetType_Sys"" t ON m.""TypeID"" = t.""AssetType_ID""
            LEFT JOIN ""Const_AssetCategory_sys"" c ON m.""CategoryID"" = c.""AssetCategoryID""
            LEFT JOIN ""Const_Asset_SubCategory"" sc ON m.""SubCategoryID"" = sc.""Asset_SubCategory_ID""
            LEFT JOIN ""AssetConfig_MeasurementType"" mt ON m.""MeasurementTypeID"" = mt.""AssetConfig_MeasurementType_ID""
            LEFT JOIN ""Const_AssetStatus_Sys"" st ON m.""StatusID"" = st.""AssetStatus_ID""
            WHERE m.""AssetConfig_mSCOA_ID"" = @id", new { id });
        return item is null ? NotFound(new { error = "mSCOA config not found" }) : Ok(item);
    }

    private async Task<bool> GetUseDeptDivision()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        return await conn.ExecuteScalarAsync<bool>(@"
            SELECT COALESCE(""mscoa_use_dept_division"", true)
            FROM ""Asset_OrganisationSettings"" LIMIT 1");
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AssetConfigMscoaDto model)
    {
        bool useDeptDivision = await GetUseDeptDivision();
        if (useDeptDivision && (model.DepartmentId == null || model.DepartmentId == 0))
            return BadRequest(new { error = "Department is required for mSCOA configuration." });
        if (useDeptDivision && (model.DivisionId == null || model.DivisionId == 0))
            return BadRequest(new { error = "Division is required for mSCOA configuration." });
        int? deptWrite = useDeptDivision ? model.DepartmentId : null;
        int? divWrite  = useDeptDivision ? model.DivisionId  : null;
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""AssetConfig_mSCOA"" (""FinYear"", ""TypeID"", ""CategoryID"", ""SubCategoryID"", ""MeasurementTypeID"", ""StatusID"", ""DepartmentID"", ""DivisionID"", ""Default"", ""Enabled"", ""CreatedByID"", ""CreatedDate"")
            VALUES (@FinYear, @TypeID, @CategoryID, @SubCategoryID, @MeasurementTypeID, @StatusID, @DepartmentID, @DivisionID, 1, 1, 1, NOW())
            RETURNING ""AssetConfig_mSCOA_ID""",
            new { model.FinYear, TypeID = model.TypeId, CategoryID = model.CategoryId, SubCategoryID = model.SubCategoryId, MeasurementTypeID = model.MeasurementTypeId, StatusID = model.StatusId, DepartmentID = deptWrite, DivisionID = divWrite });
        return Ok(new { id });
    }

    [HttpPost("{sourceId:int}/copy")]
    public async Task<IActionResult> Copy(int sourceId, [FromBody] AssetConfigMscoaDto model)
    {
        bool useDeptDivision = await GetUseDeptDivision();
        if (useDeptDivision && (model.DepartmentId == null || model.DepartmentId == 0))
            return BadRequest(new { error = "Department is required for mSCOA configuration." });
        if (useDeptDivision && (model.DivisionId == null || model.DivisionId == 0))
            return BadRequest(new { error = "Division is required for mSCOA configuration." });
        int? deptWrite = useDeptDivision ? model.DepartmentId : null;
        int? divWrite  = useDeptDivision ? model.DivisionId  : null;
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sourceExists = await conn.QueryFirstOrDefaultAsync<int?>(@"
            SELECT ""AssetConfig_mSCOA_ID"" FROM ""AssetConfig_mSCOA""
            WHERE ""AssetConfig_mSCOA_ID"" = @sourceId LIMIT 1",
            new { sourceId });
        if (!sourceExists.HasValue)
            return NotFound(new { error = "Source mSCOA configuration not found." });
        await using var tx = await conn.BeginTransactionAsync();
        var copyDeptDiv = useDeptDivision
            ? @"AND (""DepartmentID"" IS NOT DISTINCT FROM @DepartmentID)
              AND (""DivisionID"" IS NOT DISTINCT FROM @DivisionID)"
            : "";
        var dup = await conn.QueryFirstOrDefaultAsync<int?>($@"
            SELECT ""AssetConfig_mSCOA_ID"" FROM ""AssetConfig_mSCOA""
            WHERE ""FinYear"" = @FinYear
              AND (""TypeID"" IS NOT DISTINCT FROM @TypeID)
              AND (""CategoryID"" IS NOT DISTINCT FROM @CategoryID)
              AND (""SubCategoryID"" IS NOT DISTINCT FROM @SubCategoryID)
              AND (""MeasurementTypeID"" IS NOT DISTINCT FROM @MeasurementTypeID)
              AND (""StatusID"" IS NOT DISTINCT FROM @StatusID)
              {copyDeptDiv}
            LIMIT 1",
            new { model.FinYear, TypeID = model.TypeId, CategoryID = model.CategoryId,
                  SubCategoryID = model.SubCategoryId, MeasurementTypeID = model.MeasurementTypeId,
                  StatusID = model.StatusId, DepartmentID = deptWrite, DivisionID = divWrite },
            transaction: tx);
        if (dup.HasValue)
        {
            await tx.RollbackAsync();
            return Conflict(new { error = "An mSCOA configuration already exists for the selected Year / Type / Category / Sub Category / Measurement Type / Status combination." });
        }
        var newId = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""AssetConfig_mSCOA"" (""FinYear"", ""TypeID"", ""CategoryID"", ""SubCategoryID"", ""MeasurementTypeID"", ""StatusID"", ""DepartmentID"", ""DivisionID"", ""Default"", ""Enabled"", ""CreatedByID"", ""CreatedDate"")
            VALUES (@FinYear, @TypeID, @CategoryID, @SubCategoryID, @MeasurementTypeID, @StatusID, @DepartmentID, @DivisionID, 1, 1, 1, NOW())
            RETURNING ""AssetConfig_mSCOA_ID""",
            new { model.FinYear, TypeID = model.TypeId, CategoryID = model.CategoryId,
                  SubCategoryID = model.SubCategoryId, MeasurementTypeID = model.MeasurementTypeId,
                  StatusID = model.StatusId, DepartmentID = deptWrite, DivisionID = divWrite },
            transaction: tx);
        await conn.ExecuteAsync(@"
            INSERT INTO ""AssetConfig_mSCOA_TransactionType""
            (""AssetConfig_mSCOA_ID"", ""TransactionTypeID"",
             ""Project11"", ""DebitItem11_1"", ""DebitItem11_2"", ""CreditItem11_1"",
             ""Project21"", ""DebitItem21_1"", ""DebitItem21_2"", ""CreditItem21_1"",
             ""Project12"", ""DebitItem12_1"", ""CreditItem12_1"",
             ""Project22"", ""DebitItem22_1"",
             ""Project13"", ""CreditItem13_1"",
             ""Project23"", ""CreditItem23_1"",
             ""Project14"", ""Project24"", ""Project15"", ""Project25"",
             ""CreatedByID"", ""CreatedDate"")
            SELECT @newId, ""TransactionTypeID"",
                   ""Project11"", ""DebitItem11_1"", ""DebitItem11_2"", ""CreditItem11_1"",
                   ""Project21"", ""DebitItem21_1"", ""DebitItem21_2"", ""CreditItem21_1"",
                   ""Project12"", ""DebitItem12_1"", ""CreditItem12_1"",
                   ""Project22"", ""DebitItem22_1"",
                   ""Project13"", ""CreditItem13_1"",
                   ""Project23"", ""CreditItem23_1"",
                   ""Project14"", ""Project24"", ""Project15"", ""Project25"",
                   1, NOW()
            FROM ""AssetConfig_mSCOA_TransactionType""
            WHERE ""AssetConfig_mSCOA_ID"" = @sourceId",
            new { newId, sourceId }, transaction: tx);
        await tx.CommitAsync();
        return Ok(new { id = newId });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] AssetConfigMscoaDto model)
    {
        bool useDeptDivision = await GetUseDeptDivision();
        if (useDeptDivision && (model.DepartmentId == null || model.DepartmentId == 0))
            return BadRequest(new { error = "Department is required for mSCOA configuration." });
        if (useDeptDivision && (model.DivisionId == null || model.DivisionId == 0))
            return BadRequest(new { error = "Division is required for mSCOA configuration." });
        int? deptWrite = useDeptDivision ? model.DepartmentId : null;
        int? divWrite  = useDeptDivision ? model.DivisionId  : null;
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""AssetConfig_mSCOA""
            SET ""FinYear"" = @FinYear, ""TypeID"" = @TypeID, ""CategoryID"" = @CategoryID, ""SubCategoryID"" = @SubCategoryID,
                ""MeasurementTypeID"" = @MeasurementTypeID, ""StatusID"" = @StatusID,
                ""DepartmentID"" = @DepartmentID, ""DivisionID"" = @DivisionID,
                ""ModifiedByID"" = 1, ""ModiefiedDate"" = NOW()
            WHERE ""AssetConfig_mSCOA_ID"" = @id",
            new { model.FinYear, TypeID = model.TypeId, CategoryID = model.CategoryId, SubCategoryID = model.SubCategoryId, MeasurementTypeID = model.MeasurementTypeId, StatusID = model.StatusId, DepartmentID = deptWrite, DivisionID = divWrite, id });
        return rows == 0 ? NotFound(new { error = "mSCOA config not found" }) : Ok(new { success = 1 });
    }

    [HttpGet("departments")]
    public async Task<IActionResult> GetDepartments()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.QueryAsync<dynamic>(@"
            SELECT ""Department_ID""   AS ""departmentId"",
                   ""DepartmentDesc""  AS ""departmentDesc"",
                   ""DepartmentCode""  AS ""departmentCode""
            FROM ""Asset_Department""
            WHERE COALESCE(""Enabled"", 1) = 1
            ORDER BY ""DepartmentDesc""");
        return Ok(rows);
    }

    [HttpGet("divisions")]
    public async Task<IActionResult> GetDivisions([FromQuery] int? departmentId = null)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT ""Division_ID""   AS ""divisionId"",
                           ""DivisionDesc""  AS ""divisionDesc"",
                           ""DivisionCode""  AS ""divisionCode"",
                           ""DepartmentID""  AS ""departmentId""
                    FROM ""Asset_Division""
                    WHERE COALESCE(""Enabled"", 1) = 1";
        var parameters = new Dapper.DynamicParameters();
        if (departmentId.HasValue)
        {
            sql += @" AND ""DepartmentID"" = @departmentId";
            parameters.Add("departmentId", departmentId.Value);
        }
        sql += @" ORDER BY ""DivisionDesc""";
        var rows = await conn.QueryAsync<dynamic>(sql, parameters);
        return Ok(rows);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(@"DELETE FROM ""AssetConfig_mSCOA_TransactionType"" WHERE ""AssetConfig_mSCOA_ID"" = @id", new { id });
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""AssetConfig_mSCOA"" WHERE ""AssetConfig_mSCOA_ID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "mSCOA config not found" }) : Ok(new { success = 1 });
    }

    [HttpGet("{id:int}/transaction-types")]
    public async Task<IActionResult> GetTransactionTypes(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.QueryAsync(@"
            SELECT tt.""AssetConfig_mSCOA_TransactionType_ID"" as ""id"",
                   tt.""AssetConfig_mSCOA_ID"" as ""assetConfigMscoaId"",
                   tt.""TransactionTypeID"" as ""transactionTypeId"",
                   tdef.""Name"" as ""transactionTypeName"",
                   tt.""Project11"" as ""project11"", tt.""DebitItem11_1"" as ""debitItem11_1"",
                   tt.""DebitItem11_2"" as ""debitItem11_2"", (CASE WHEN TRIM(COALESCE(tt.""CreditItem11_1"", '')) ~ '^[0-9]+$' THEN CAST(TRIM(tt.""CreditItem11_1"") AS INTEGER) END) as ""creditItem11_1"",
                   tt.""Project21"" as ""project21"", tt.""DebitItem21_1"" as ""debitItem21_1"",
                   tt.""DebitItem21_2"" as ""debitItem21_2"", CAST(NULLIF(tt.""CreditItem21_1"", '') AS INTEGER) as ""creditItem21_1"",
                   tt.""Project12"" as ""project12"", tt.""DebitItem12_1"" as ""debitItem12_1"",
                   tt.""CreditItem12_1"" as ""creditItem12_1"",
                   tt.""Project22"" as ""project22"", tt.""DebitItem22_1"" as ""debitItem22_1"",
                   tt.""Project13"" as ""project13"", tt.""CreditItem13_1"" as ""creditItem13_1"",
                   tt.""Project23"" as ""project23"", tt.""CreditItem23_1"" as ""creditItem23_1"",
                   tt.""Project14"" as ""project14"", tt.""Project24"" as ""project24"",
                   tt.""Project15"" as ""project15"", tt.""Project25"" as ""project25"",
                   COALESCE(pp11.""ProjectCode""::text, '') AS ""project11Display"",
                   COALESCE(pp12.""ProjectCode""::text, '') AS ""project12Display"",
                   COALESCE(pp13.""ProjectCode""::text, '') AS ""project13Display"",
                   COALESCE(pp14.""ProjectCode""::text, '') AS ""project14Display"",
                   COALESCE(pp15.""ProjectCode""::text, '') AS ""project15Display"",
                   COALESCE(pp21.""ProjectCode""::text, '') AS ""project21Display"",
                   COALESCE(pp22.""ProjectCode""::text, '') AS ""project22Display"",
                   COALESCE(pp23.""ProjectCode""::text, '') AS ""project23Display"",
                   COALESCE(pp24.""ProjectCode""::text, '') AS ""project24Display"",
                   COALESCE(pp25.""ProjectCode""::text, '') AS ""project25Display"",
                   COALESCE(tt.""DebitItem11_1DisplayName"", '') AS ""debitItem11_1Display"",
                   COALESCE(tt.""DebitItem11_2DisplayName"", '') AS ""debitItem11_2Display"",
                   COALESCE(tt.""CreditItem11_1DisplayName"", '') AS ""creditItem11_1Display"",
                   COALESCE(tt.""DebitItem21_1DisplayName"", '') AS ""debitItem21_1Display"",
                   COALESCE(tt.""DebitItem21_2DisplayName"", '') AS ""debitItem21_2Display"",
                   COALESCE(tt.""CreditItem21_1DisplayName"", '') AS ""creditItem21_1Display"",
                   COALESCE(tt.""DebitItem12_1DisplayName"", '') AS ""debitItem12_1Display"",
                   COALESCE(tt.""CreditItem12_1DisplayName"", '') AS ""creditItem12_1Display"",
                   COALESCE(tt.""DebitItem22_1DisplayName"", '') AS ""debitItem22_1Display"",
                   COALESCE(tt.""CreditItem13_1DisplayName"", '') AS ""creditItem13_1Display"",
                   COALESCE(tt.""CreditItem23_1DisplayName"", '') AS ""creditItem23_1Display""
            FROM ""AssetConfig_mSCOA_TransactionType"" tt
            LEFT JOIN ""AssetConfig_TransactionType"" tdef ON tdef.""AssetConfig_TransactionType_ID"" = tt.""TransactionTypeID""
            LEFT JOIN ""Plan_Project"" pp11 ON pp11.""Project_ID"" = tt.""Project11""
            LEFT JOIN ""Plan_Project"" pp12 ON pp12.""Project_ID"" = tt.""Project12""
            LEFT JOIN ""Plan_Project"" pp13 ON pp13.""Project_ID"" = tt.""Project13""
            LEFT JOIN ""Plan_Project"" pp14 ON pp14.""Project_ID"" = tt.""Project14""
            LEFT JOIN ""Plan_Project"" pp15 ON pp15.""Project_ID"" = tt.""Project15""
            LEFT JOIN ""Plan_Project"" pp21 ON pp21.""Project_ID"" = tt.""Project21""
            LEFT JOIN ""Plan_Project"" pp22 ON pp22.""Project_ID"" = tt.""Project22""
            LEFT JOIN ""Plan_Project"" pp23 ON pp23.""Project_ID"" = tt.""Project23""
            LEFT JOIN ""Plan_Project"" pp24 ON pp24.""Project_ID"" = tt.""Project24""
            LEFT JOIN ""Plan_Project"" pp25 ON pp25.""Project_ID"" = tt.""Project25""
            WHERE tt.""AssetConfig_mSCOA_ID"" = @id", new { id });
        return Ok(rows);
    }

    [HttpPost("{id:int}/transaction-types")]
    public async Task<IActionResult> UpsertTransactionType(int id, [FromBody] MscoaTransactionTypeDto model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var existing = await conn.QueryFirstOrDefaultAsync<int?>(@"
            SELECT ""AssetConfig_mSCOA_TransactionType_ID"" FROM ""AssetConfig_mSCOA_TransactionType""
            WHERE ""AssetConfig_mSCOA_ID"" = @id AND ""TransactionTypeID"" = @TransactionTypeId",
            new { id, model.TransactionTypeId });
        if (existing.HasValue)
        {
            await conn.ExecuteAsync(@"
                UPDATE ""AssetConfig_mSCOA_TransactionType""
                SET ""Project11""=@Project11,
                    ""DebitItem11_1""=@DebitItem11_1, ""DebitItem11_1DisplayName""=@DebitItem11_1Display,
                    ""DebitItem11_2""=@DebitItem11_2, ""DebitItem11_2DisplayName""=@DebitItem11_2Display,
                    ""CreditItem11_1""=@CreditItem11_1, ""CreditItem11_1DisplayName""=@CreditItem11_1Display,
                    ""Project21""=@Project21,
                    ""DebitItem21_1""=@DebitItem21_1, ""DebitItem21_1DisplayName""=@DebitItem21_1Display,
                    ""DebitItem21_2""=@DebitItem21_2, ""DebitItem21_2DisplayName""=@DebitItem21_2Display,
                    ""CreditItem21_1""=@CreditItem21_1, ""CreditItem21_1DisplayName""=@CreditItem21_1Display,
                    ""Project12""=@Project12,
                    ""DebitItem12_1""=@DebitItem12_1, ""DebitItem12_1DisplayName""=@DebitItem12_1Display,
                    ""CreditItem12_1""=@CreditItem12_1, ""CreditItem12_1DisplayName""=@CreditItem12_1Display,
                    ""Project22""=@Project22,
                    ""DebitItem22_1""=@DebitItem22_1, ""DebitItem22_1DisplayName""=@DebitItem22_1Display,
                    ""Project13""=@Project13,
                    ""CreditItem13_1""=@CreditItem13_1, ""CreditItem13_1DisplayName""=@CreditItem13_1Display,
                    ""Project23""=@Project23,
                    ""CreditItem23_1""=@CreditItem23_1, ""CreditItem23_1DisplayName""=@CreditItem23_1Display,
                    ""Project14""=@Project14, ""Project24""=@Project24,
                    ""Project15""=@Project15, ""Project25""=@Project25,
                    ""ModifiedByID""=1, ""ModiefiedDate""=CURRENT_TIMESTAMP
                WHERE ""AssetConfig_mSCOA_TransactionType_ID"" = @existingId",
                new { existingId = existing.Value,
                    model.Project11,
                    model.DebitItem11_1, model.DebitItem11_1Display,
                    model.DebitItem11_2, model.DebitItem11_2Display,
                    CreditItem11_1 = model.CreditItem11_1?.ToString(), model.CreditItem11_1Display,
                    model.Project21,
                    model.DebitItem21_1, model.DebitItem21_1Display,
                    model.DebitItem21_2, model.DebitItem21_2Display,
                    CreditItem21_1 = model.CreditItem21_1?.ToString(), model.CreditItem21_1Display,
                    model.Project12,
                    model.DebitItem12_1, model.DebitItem12_1Display,
                    model.CreditItem12_1, model.CreditItem12_1Display,
                    model.Project22,
                    model.DebitItem22_1, model.DebitItem22_1Display,
                    model.Project13,
                    model.CreditItem13_1, model.CreditItem13_1Display,
                    model.Project23,
                    model.CreditItem23_1, model.CreditItem23_1Display,
                    model.Project14, model.Project24, model.Project15, model.Project25 });
            return Ok(new { id = existing.Value });
        }
        else
        {
            var newId = await conn.QuerySingleAsync<int>(@"
                INSERT INTO ""AssetConfig_mSCOA_TransactionType""
                (""AssetConfig_mSCOA_ID"", ""TransactionTypeID"",
                 ""Project11"",
                 ""DebitItem11_1"", ""DebitItem11_1DisplayName"",
                 ""DebitItem11_2"", ""DebitItem11_2DisplayName"",
                 ""CreditItem11_1"", ""CreditItem11_1DisplayName"",
                 ""Project21"",
                 ""DebitItem21_1"", ""DebitItem21_1DisplayName"",
                 ""DebitItem21_2"", ""DebitItem21_2DisplayName"",
                 ""CreditItem21_1"", ""CreditItem21_1DisplayName"",
                 ""Project12"",
                 ""DebitItem12_1"", ""DebitItem12_1DisplayName"",
                 ""CreditItem12_1"", ""CreditItem12_1DisplayName"",
                 ""Project22"",
                 ""DebitItem22_1"", ""DebitItem22_1DisplayName"",
                 ""Project13"",
                 ""CreditItem13_1"", ""CreditItem13_1DisplayName"",
                 ""Project23"",
                 ""CreditItem23_1"", ""CreditItem23_1DisplayName"",
                 ""Project14"", ""Project24"", ""Project15"", ""Project25"",
                 ""CreatedByID"", ""CreatedDate"")
                VALUES (@MscoaId, @TransactionTypeId,
                        @Project11,
                        @DebitItem11_1, @DebitItem11_1Display,
                        @DebitItem11_2, @DebitItem11_2Display,
                        @CreditItem11_1, @CreditItem11_1Display,
                        @Project21,
                        @DebitItem21_1, @DebitItem21_1Display,
                        @DebitItem21_2, @DebitItem21_2Display,
                        @CreditItem21_1, @CreditItem21_1Display,
                        @Project12,
                        @DebitItem12_1, @DebitItem12_1Display,
                        @CreditItem12_1, @CreditItem12_1Display,
                        @Project22,
                        @DebitItem22_1, @DebitItem22_1Display,
                        @Project13,
                        @CreditItem13_1, @CreditItem13_1Display,
                        @Project23,
                        @CreditItem23_1, @CreditItem23_1Display,
                        @Project14, @Project24, @Project15, @Project25,
                        1, CURRENT_TIMESTAMP)
                RETURNING ""AssetConfig_mSCOA_TransactionType_ID""",
                new { MscoaId = id, model.TransactionTypeId,
                    model.Project11,
                    model.DebitItem11_1, model.DebitItem11_1Display,
                    model.DebitItem11_2, model.DebitItem11_2Display,
                    CreditItem11_1 = model.CreditItem11_1?.ToString(), model.CreditItem11_1Display,
                    model.Project21,
                    model.DebitItem21_1, model.DebitItem21_1Display,
                    model.DebitItem21_2, model.DebitItem21_2Display,
                    CreditItem21_1 = model.CreditItem21_1?.ToString(), model.CreditItem21_1Display,
                    model.Project12,
                    model.DebitItem12_1, model.DebitItem12_1Display,
                    model.CreditItem12_1, model.CreditItem12_1Display,
                    model.Project22,
                    model.DebitItem22_1, model.DebitItem22_1Display,
                    model.Project13,
                    model.CreditItem13_1, model.CreditItem13_1Display,
                    model.Project23,
                    model.CreditItem23_1, model.CreditItem23_1Display,
                    model.Project14, model.Project24, model.Project15, model.Project25 });
            return Ok(new { id = newId });
        }
    }

    [HttpDelete("transaction-types/{ttId:int}")]
    public async Task<IActionResult> DeleteTransactionType(int ttId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""AssetConfig_mSCOA_TransactionType"" WHERE ""AssetConfig_mSCOA_TransactionType_ID"" = @ttId", new { ttId });
        return rows == 0 ? NotFound(new { error = "Transaction type mapping not found" }) : Ok(new { success = 1 });
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.QueryAsync<dynamic>(@"
            SELECT m.""AssetConfig_mSCOA_ID"" AS ""mid"",
                   m.""FinYear"" AS ""finYear"",
                   t.""AssetTypeDesc"" AS ""typeDesc"",
                   c.""AssetCategoryDesc"" AS ""categoryDesc"",
                   sc.""Asset_SubCategoryDescription"" AS ""subCategoryDesc"",
                   mt.""Name"" AS ""measurementType"",
                   st.""AssetStatusDesc"" AS ""statusDesc"",
                   COALESCE(m.""Enabled"", 0) AS ""enabled""
            FROM ""AssetConfig_mSCOA"" m
            LEFT JOIN ""Const_AssetType_Sys"" t ON m.""TypeID"" = t.""AssetType_ID""
            LEFT JOIN ""Const_AssetCategory_sys"" c ON m.""CategoryID"" = c.""AssetCategoryID""
            LEFT JOIN ""Const_Asset_SubCategory"" sc ON m.""SubCategoryID"" = sc.""Asset_SubCategory_ID""
            LEFT JOIN ""AssetConfig_MeasurementType"" mt ON m.""MeasurementTypeID"" = mt.""AssetConfig_MeasurementType_ID""
            LEFT JOIN ""Const_AssetStatus_Sys"" st ON m.""StatusID"" = st.""AssetStatus_ID""
            ORDER BY m.""AssetConfig_mSCOA_ID""");
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("mSCOA Config");
        ws.Cell(1, 1).Value = "ID";
        ws.Cell(1, 2).Value = "Financial Year";
        ws.Cell(1, 3).Value = "Asset Type";
        ws.Cell(1, 4).Value = "Category";
        ws.Cell(1, 5).Value = "Sub Category";
        ws.Cell(1, 6).Value = "Measurement Type";
        ws.Cell(1, 7).Value = "Status";
        ws.Cell(1, 8).Value = "Enabled";
        ws.Row(1).Style.Font.Bold = true;
        int r = 2;
        foreach (var row in rows)
        {
            ws.Cell(r, 1).Value = (int)row.mid;
            ws.Cell(r, 2).Value = (string?)row.finYear ?? "";
            ws.Cell(r, 3).Value = (string?)row.typeDesc ?? "";
            ws.Cell(r, 4).Value = (string?)row.categoryDesc ?? "";
            ws.Cell(r, 5).Value = (string?)row.subCategoryDesc ?? "";
            ws.Cell(r, 6).Value = (string?)row.measurementType ?? "";
            ws.Cell(r, 7).Value = (string?)row.statusDesc ?? "";
            ws.Cell(r, 8).Value = (int)row.enabled == 1 ? "Yes" : "No";
            r++;
        }
        ws.Columns().AdjustToContents();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "mSCOA_Export.xlsx");
    }

    // ── Import / Template ─────────────────────────────────────────────────────

    private sealed class ParsedMscoaRow
    {
        public int RowNum { get; set; }
        public string FinYear { get; set; } = "";
        public int TxnTypeId { get; set; }
        public int? AssetTypeId { get; set; }
        public int? CatId { get; set; }
        public int? SubCatId { get; set; }
        public int? MeasId { get; set; }
        public int? StatusId { get; set; }
        public int DeptId { get; set; }
        public int DivId { get; set; }
        public Dictionary<string, int?> ScoaMap { get; set; } = new();
    }

    private static readonly string[] MscoaFixedHeaders = new[]
    {
        "Financial Year", "Transaction Type", "Asset Type", "Asset Category",
        "Asset SubCategory", "Measurement Type", "Asset Status", "Department", "Division"
    };

    private static readonly Dictionary<string, List<(string Label, string ProjectKey, string VoteKey)>> MscoaTxnFieldMap =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["Depreciation"] = new()
            {
                ("Dt SCOA Item – Depreciation (IE)", "Project11", "DebitItem11_1"),
                ("Ct SCOA Item – Depreciation Offset", "Project13", "CreditItem13_1"),
                ("Dt SCOA Item – Revaluation Reserve", "Project12", "CreditItem12_1"),
                ("Ct SCOA Item – Accumulated Depreciation (IA)", "Project14", "CreditItem11_1"),
            },
            ["Impairment"] = new()
            {
                ("Dt SCOA Item – Impairment Loss (Gains & Losses) (IZ)", "Project11", "DebitItem11_1"),
                ("Dt SCOA Item – Revaluation Reserve", "Project13", "CreditItem13_1"),
                ("Ct SCOA Item – Accumulated Impairment (IA)", "Project14", "CreditItem11_1"),
            },
            ["Impairment Reversal"] = new()
            {
                ("Dt SCOA Item – Accumulated Impairment (IA)", "Project11", "DebitItem11_1"),
                ("Ct SCOA Item – Revaluation Reserve", "Project13", "CreditItem13_1"),
                ("Ct SCOA Item – Reversal of Impairment (Gains & Losses) (IZ)", "Project14", "CreditItem11_1"),
            },
            ["Fair Value"] = new()
            {
                ("Dt SCOA Item – Asset Account (IA)", "Project11", "DebitItem11_1"),
                ("Ct SCOA Item – Gains: Fair Value Adjustment (IZ)", "Project14", "CreditItem11_1"),
                ("Dt SCOA Item – Losses: Fair Value Adjustment (IZ)", "Project21", "DebitItem21_1"),
                ("Ct SCOA Item – Asset Account (IA) [Credit]", "Project24", "CreditItem21_1"),
            },
            ["Revaluation"] = new()
            {
                ("Dt SCOA Item – Asset Revaluation", "Project11", "DebitItem11_1"),
                ("Ct SCOA Item – Accumulated Revaluation Disposal", "Project12", "DebitItem12_1"),
                ("Dt SCOA Item – Accumulated Depreciation", "Project13", "CreditItem13_1"),
                ("Ct SCOA Item – Accumulated Surplus for Disposal", "Project14", "DebitItem11_2"),
                ("Ct SCOA Item – Revaluation Reserve", "Project15", "CreditItem11_1"),
                ("Dt SCOA Item – Asset Revaluation [Reverse]", "Project21", "DebitItem21_1"),
                ("Ct SCOA Item – Accumulated Revaluation Disposal [Reverse]", "Project22", "DebitItem22_1"),
                ("Dt SCOA Item – Accumulated Depreciation [Reverse]", "Project23", "CreditItem23_1"),
                ("Ct SCOA Item – Revaluation Reserve [Reverse]", "Project24", "DebitItem21_2"),
                ("Ct SCOA Item – Accumulated Surplus for Disposal [Reverse]", "Project25", "CreditItem21_1"),
            },
            ["Disposal"] = new()
            {
                ("Dt SCOA Item – Accumulated Depreciation (IA)", "Project11", "DebitItem11_1"),
                ("Dt SCOA Item – Accumulated Impairment (IA)", "Project12", "DebitItem12_1"),
                ("Dt SCOA Item – Loss on Disposal (IZ)", "Project13", "CreditItem13_1"),
                ("Dt SCOA Item – Disposal Clearing Account (IL)", "Project14", "DebitItem11_2"),
                ("Ct SCOA Item – Asset Disposal Account (IA)", "Project15", "CreditItem11_1"),
                ("Dt SCOA Item – Accumulated Depreciation (IA) [Gain]", "Project21", "DebitItem21_1"),
                ("Dt SCOA Item – Accumulated Impairment (IA) [Gain]", "Project22", "DebitItem22_1"),
                ("Dt SCOA Item – Gain on Disposal of Asset (IZ)", "Project23", "CreditItem23_1"),
                ("Ct SCOA Item – Disposal Clearing Account (IL) [Gain]", "Project24", "DebitItem21_2"),
                ("Ct SCOA Item – Asset Disposal Account (Cost) (IA)", "Project25", "CreditItem21_1"),
            },
            ["Asset Unbundling"] = new()
            {
                ("Dt SCOA Item – Debit Asset Acquisition Account (IA)", "Project11", "DebitItem11_1"),
                ("Ct SCOA Item – Credit Work in Progress Account (IA)", "Project14", "CreditItem11_1"),
            },
        };

    private static readonly Dictionary<string, string> VoteKeyToPrefixColumn =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["DebitItem11_1"]  = "DRPositionStatementType11",
            ["DebitItem12_1"]  = "DRPositionStatementType12",
            ["CreditItem13_1"] = "DRPositionStatementType13",
            ["DebitItem11_2"]  = "DRPositionStatementType14",
            ["CreditItem11_1"] = "CRPositionStatementType11",
            ["DebitItem21_1"]  = "DRPositionStatementType21",
            ["DebitItem22_1"]  = "DRPositionStatementType22",
            ["CreditItem23_1"] = "DRPositionStatementType23",
            ["CreditItem21_1"] = "CRPositionStatementType22",
            ["DebitItem21_2"]  = "CRPositionStatementType21",
        };

    [HttpGet("import-template/{txnType}")]
    public IActionResult DownloadTemplate(string txnType)
    {
        if (!MscoaTxnFieldMap.TryGetValue(txnType, out var fields))
            return BadRequest(new { error = $"Unknown transaction type: '{txnType}'. Valid: Depreciation, Impairment, Impairment Reversal, Fair Value, Revaluation, Disposal, Asset Unbundling" });

        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Template");

        var col = 1;
        foreach (var h in MscoaFixedHeaders) { ws.Cell(1, col).Value = h; col++; }
        foreach (var f in fields) { ws.Cell(1, col).Value = f.Label; col++; }

        var headerRange = ws.Range(1, 1, 1, MscoaFixedHeaders.Length + fields.Count);
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Fill.BackgroundColor = XLColor.FromArgb(30, 58, 95);
        headerRange.Style.Font.FontColor = XLColor.White;

        ws.Cell(2, 1).Value = "2025/2026";
        ws.Cell(2, 2).Value = txnType;
        ws.Cell(2, 3).Value = "Infrastructure";
        ws.Cell(2, 4).Value = "Roads";
        ws.Cell(2, 5).Value = "Gravel Roads";
        ws.Cell(2, 6).Value = "Cost Module";
        ws.Cell(2, 7).Value = "Active";
        ws.Cell(2, 8).Value = "Technical Services";
        ws.Cell(2, 9).Value = "Roads Division";
        for (var c = MscoaFixedHeaders.Length + 1; c <= MscoaFixedHeaders.Length + fields.Count; c++)
            ws.Cell(2, c).Value = 1001;

        ws.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        var safeType = txnType.Replace(" ", "-").ToLower();
        return File(ms.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"mscoa-template-{safeType}.xlsx");
    }

    [HttpPost("import/{txnType}")]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> Import(string txnType, IFormFile file, [FromQuery] bool overwriteDuplicates = false)
    {
        if (!MscoaTxnFieldMap.TryGetValue(txnType, out var scoaFields))
            return BadRequest(new { error = $"Unknown transaction type: '{txnType}'" });
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file uploaded" });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        bool useDeptDivisionImport = await conn.ExecuteScalarAsync<bool>(@"
            SELECT COALESCE(""mscoa_use_dept_division"", true) FROM ""Asset_OrganisationSettings"" LIMIT 1");

        var txnTypes = (await conn.QueryAsync<(string Name, int Id)>(@"
            SELECT ""Name"" AS ""Name"", ""AssetConfig_TransactionType_ID"" AS ""Id"" FROM ""AssetConfig_TransactionType"""))
            .ToDictionary(x => x.Name.Trim().ToLower(), x => x.Id);
        var assetTypes = (await conn.QueryAsync<(string Desc, int Id)>(@"
            SELECT ""AssetTypeDesc"" AS ""Desc"", ""AssetType_ID"" AS ""Id"" FROM ""Const_AssetType_Sys"""))
            .ToDictionary(x => x.Desc.Trim().ToLower(), x => x.Id);
        var allCats = (await conn.QueryAsync<(string Desc, int Id, int TypeId)>(@"
            SELECT ""AssetCategoryDesc"" AS ""Desc"", ""AssetCategoryID"" AS ""Id"", ""AssetTypeID"" AS ""TypeId"" FROM ""Const_AssetCategory_sys""")).ToList();
        var allSubCats = (await conn.QueryAsync<(string Desc, int Id, int CatId)>(@"
            SELECT ""Asset_SubCategoryDescription"" AS ""Desc"", ""Asset_SubCategory_ID"" AS ""Id"", ""Asset_CategoryID"" AS ""CatId"" FROM ""Const_Asset_SubCategory""")).ToList();
        var measTypes = (await conn.QueryAsync<(string Name, int Id)>(@"
            SELECT ""Name"" AS ""Name"", ""AssetConfig_MeasurementType_ID"" AS ""Id"" FROM ""AssetConfig_MeasurementType"""))
            .ToDictionary(x => x.Name.Trim().ToLower(), x => x.Id);
        var statuses = (await conn.QueryAsync<(string Desc, int Id)>(@"
            SELECT ""AssetStatusDesc"" AS ""Desc"", ""AssetStatus_ID"" AS ""Id"" FROM ""Const_AssetStatus_Sys"""))
            .ToDictionary(x => x.Desc.Trim().ToLower(), x => x.Id);
        var depts = (await conn.QueryAsync<(string Desc, int Id)>(@"
            SELECT ""DepartmentDesc"" AS ""Desc"", ""Department_ID"" AS ""Id"" FROM ""Asset_Department"" WHERE COALESCE(""Enabled"", 1) = 1"))
            .ToDictionary(x => x.Desc.Trim().ToLower(), x => x.Id);
        var allDivs = (await conn.QueryAsync<(string Desc, int Id, int DeptId)>(@"
            SELECT ""DivisionDesc"" AS ""Desc"", ""Division_ID"" AS ""Id"", ""DepartmentID"" AS ""DeptId"" FROM ""Asset_Division"" WHERE COALESCE(""Enabled"", 1) = 1")).ToList();

        var prefixRules = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""DRPositionStatementType11"", ""DRPositionStatementType12"",
                   ""DRPositionStatementType13"", ""DRPositionStatementType14"",
                   ""CRPositionStatementType11"", ""DRPositionStatementType21"",
                   ""DRPositionStatementType22"", ""DRPositionStatementType23"",
                   ""CRPositionStatementType21"", ""CRPositionStatementType22""
            FROM ""AssetConfig_TransactionType""
            WHERE LOWER(""Name"") = @name", new { name = txnType.Trim().ToLower() });
        var prefixDict = prefixRules == null
            ? new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase)
            : ((IDictionary<string, object?>)prefixRules).ToDictionary(
                kv => kv.Key, kv => kv.Value as string, StringComparer.OrdinalIgnoreCase);

        using var stream = file.OpenReadStream();
        using var wb2 = new XLWorkbook(stream);
        var ws2 = wb2.Worksheets.First();
        var lastRow = ws2.LastRowUsed()?.RowNumber() ?? 1;

        var errors = new List<ImportError>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var parsedRows = new List<ParsedMscoaRow>();

        for (var r = 2; r <= lastRow; r++)
        {
            var row = ws2.Row(r);
            if (row.IsEmpty()) continue;
            string Cell(int c) => row.Cell(c).GetString().Trim();

            var finYear = Cell(1);
            var txnTypeName = Cell(2);
            var typeName = Cell(3);
            var catName = Cell(4);
            var subCatName = Cell(5);
            var measName = Cell(6);
            var statusName = Cell(7);
            var deptName = Cell(8);
            var divName = Cell(9);

            if (string.IsNullOrWhiteSpace(finYear))
            { errors.Add(new ImportError { Row = r, Column = "Financial Year", Value = "", Message = "Financial Year is required" }); continue; }
            if (useDeptDivisionImport && string.IsNullOrWhiteSpace(deptName))
            { errors.Add(new ImportError { Row = r, Column = "Department", Value = "", Message = "Department is required" }); continue; }
            if (useDeptDivisionImport && string.IsNullOrWhiteSpace(divName))
            { errors.Add(new ImportError { Row = r, Column = "Division", Value = "", Message = "Division is required" }); continue; }

            if (!txnTypes.TryGetValue(txnTypeName.ToLower(), out var txnTypeId))
            { errors.Add(new ImportError { Row = r, Column = "Transaction Type", Value = txnTypeName, Message = $"Transaction type '{txnTypeName}' not found" }); continue; }
            if (!txnTypeName.Equals(txnType, StringComparison.OrdinalIgnoreCase))
            { errors.Add(new ImportError { Row = r, Column = "Transaction Type", Value = txnTypeName, Message = $"Row transaction type '{txnTypeName}' does not match the import endpoint type '{txnType}'" }); continue; }

            int? assetTypeId = null;
            if (!string.IsNullOrWhiteSpace(typeName))
            {
                if (!assetTypes.TryGetValue(typeName.ToLower(), out var atId))
                { errors.Add(new ImportError { Row = r, Column = "Asset Type", Value = typeName, Message = $"Asset type '{typeName}' not found" }); continue; }
                assetTypeId = atId;
            }

            int? catId = null;
            if (!string.IsNullOrWhiteSpace(catName))
            {
                var mc = allCats.FirstOrDefault(c => string.Equals(c.Desc, catName, StringComparison.OrdinalIgnoreCase)
                    && (assetTypeId == null || c.TypeId == assetTypeId));
                if (mc.Id == 0) { errors.Add(new ImportError { Row = r, Column = "Asset Category", Value = catName, Message = $"Category '{catName}' not found" }); continue; }
                catId = mc.Id;
            }

            int? subCatId = null;
            if (!string.IsNullOrWhiteSpace(subCatName))
            {
                var ms2 = allSubCats.FirstOrDefault(s => string.Equals(s.Desc, subCatName, StringComparison.OrdinalIgnoreCase)
                    && (catId == null || s.CatId == catId));
                if (ms2.Id == 0) { errors.Add(new ImportError { Row = r, Column = "Asset SubCategory", Value = subCatName, Message = $"SubCategory '{subCatName}' not found" }); continue; }
                subCatId = ms2.Id;
            }

            int? measId = null;
            if (!string.IsNullOrWhiteSpace(measName))
            {
                if (!measTypes.TryGetValue(measName.ToLower(), out var mId))
                { errors.Add(new ImportError { Row = r, Column = "Measurement Type", Value = measName, Message = $"Measurement type '{measName}' not found" }); continue; }
                measId = mId;
            }

            int? statusId = null;
            if (!string.IsNullOrWhiteSpace(statusName))
            {
                if (!statuses.TryGetValue(statusName.ToLower(), out var sId))
                { errors.Add(new ImportError { Row = r, Column = "Asset Status", Value = statusName, Message = $"Status '{statusName}' not found" }); continue; }
                statusId = sId;
            }

            int? deptId = null;
            int? divId = null;
            if (useDeptDivisionImport)
            {
                if (!depts.TryGetValue(deptName.ToLower(), out var deptIdParsed))
                { errors.Add(new ImportError { Row = r, Column = "Department", Value = deptName, Message = $"Department '{deptName}' not found" }); continue; }
                deptId = deptIdParsed;
                var divMatch = allDivs.FirstOrDefault(d => string.Equals(d.Desc, divName, StringComparison.OrdinalIgnoreCase) && d.DeptId == deptId.Value);
                if (divMatch.Id == 0) { errors.Add(new ImportError { Row = r, Column = "Division", Value = divName, Message = $"Division '{divName}' not found in department" }); continue; }
                divId = divMatch.Id;
            }

            var dupKey = $"{finYear}|{assetTypeId}|{catId}|{subCatId}|{measId}|{statusId}|{deptId}|{divId}";
            if (!seen.Add(dupKey))
            { errors.Add(new ImportError { Row = r, Column = "Row", Value = finYear, Message = $"Duplicate: row {r} duplicates an earlier row in this file" }); continue; }

            var scoaMap = new Dictionary<string, int?>(StringComparer.OrdinalIgnoreCase);
            var rowHasScoaError = false;
            for (var fi = 0; fi < scoaFields.Count; fi++)
            {
                var (label, projKey, voteKey) = scoaFields[fi];
                var raw = Cell(MscoaFixedHeaders.Length + fi + 1);
                if (string.IsNullOrWhiteSpace(raw)) continue;
                if (!int.TryParse(raw, out var itemId))
                {
                    errors.Add(new ImportError { Row = r, Column = label, Value = raw, Message = $"Expected integer PlanProjectItem_ID, got '{raw}'" });
                    rowHasScoaError = true; continue;
                }
                var itemRow = await conn.QueryFirstOrDefaultAsync<(int? ProjectId, string? ScoaCode)>(@"
                    SELECT ppi.""ProjectID"" AS ""ProjectId"", css.""ScoaCode"" AS ""ScoaCode""
                    FROM ""Plan_ProjectItem"" ppi
                    LEFT JOIN ""Const_SCOA_Structure"" css ON css.""ScoaID"" = ppi.""SCOAItemID""
                    WHERE ppi.""PlanProjectItem_ID"" = @id", new { id = itemId });
                if (!itemRow.ProjectId.HasValue)
                {
                    errors.Add(new ImportError { Row = r, Column = label, Value = raw, Message = $"PlanProjectItem_ID {itemId} not found" });
                    rowHasScoaError = true; continue;
                }
                if (VoteKeyToPrefixColumn.TryGetValue(voteKey, out var prefColName)
                    && prefixDict.TryGetValue(prefColName, out var requiredPrefix)
                    && !string.IsNullOrWhiteSpace(requiredPrefix)
                    && !string.IsNullOrWhiteSpace(itemRow.ScoaCode)
                    && !itemRow.ScoaCode.StartsWith(requiredPrefix, StringComparison.OrdinalIgnoreCase))
                {
                    errors.Add(new ImportError { Row = r, Column = label, Value = raw,
                        Message = $"SCOA item '{itemRow.ScoaCode}' has prefix '{itemRow.ScoaCode[..Math.Min(2, itemRow.ScoaCode.Length)]}' — required prefix for this field is '{requiredPrefix}'" });
                    rowHasScoaError = true; continue;
                }
                scoaMap[projKey] = itemRow.ProjectId.Value;
                scoaMap[voteKey] = itemId;
            }
            if (rowHasScoaError) continue;

            parsedRows.Add(new ParsedMscoaRow { RowNum = r, FinYear = finYear, TxnTypeId = txnTypeId, AssetTypeId = assetTypeId, CatId = catId, SubCatId = subCatId, MeasId = measId, StatusId = statusId, DeptId = deptId ?? 0, DivId = divId ?? 0, ScoaMap = scoaMap });
        }

        if (errors.Count > 0)
            return BadRequest(new ImportResult { Success = false, Errors = errors });

        var duplicateRowToId = new Dictionary<int, int>();
        foreach (var pr in parsedRows)
        {
            var importDeptDiv = useDeptDivisionImport
                ? @"AND (""DepartmentID"" IS NOT DISTINCT FROM NULLIF(@d, 0))
                  AND (""DivisionID"" IS NOT DISTINCT FROM NULLIF(@dv, 0))"
                : "";
            var existingId = await conn.ExecuteScalarAsync<int?>($@"
                SELECT ""AssetConfig_mSCOA_ID"" FROM ""AssetConfig_mSCOA""
                WHERE ""FinYear"" = @fy
                  AND (""TypeID"" IS NOT DISTINCT FROM @t)
                  AND (""CategoryID"" IS NOT DISTINCT FROM @c)
                  AND (""SubCategoryID"" IS NOT DISTINCT FROM @sc)
                  AND (""MeasurementTypeID"" IS NOT DISTINCT FROM @m)
                  AND (""StatusID"" IS NOT DISTINCT FROM @s)
                  {importDeptDiv}
                LIMIT 1",
                new { fy = pr.FinYear, t = pr.AssetTypeId, c = pr.CatId, sc = pr.SubCatId, m = pr.MeasId, s = pr.StatusId, d = pr.DeptId, dv = pr.DivId });
            if (existingId.HasValue)
                duplicateRowToId[pr.RowNum] = existingId.Value;
        }
        if (duplicateRowToId.Count > 0 && !overwriteDuplicates)
        {
            var dupErrors = parsedRows
                .Where(pr => duplicateRowToId.ContainsKey(pr.RowNum))
                .Select(pr => new ImportError { Row = pr.RowNum, Column = "Row", Value = pr.FinYear, Message = "Duplicate: mSCOA config for this combination already exists in the database" })
                .ToList();
            return Conflict(new { duplicateCount = duplicateRowToId.Count, errors = dupErrors });
        }

        await using var tx = await conn.BeginTransactionAsync();
        var imported = 0;
        var updated = 0;
        foreach (var pr in parsedRows)
        {
            int? V(string key) => pr.ScoaMap.TryGetValue(key, out var v) ? v : null;
            if (duplicateRowToId.TryGetValue(pr.RowNum, out var existingMscoaId))
            {
                var rowsAffected = await conn.ExecuteAsync(@"
                    UPDATE ""AssetConfig_mSCOA_TransactionType"" SET
                        ""Project11"" = @p11, ""DebitItem11_1"" = @di11_1, ""DebitItem11_2"" = @di11_2, ""CreditItem11_1"" = @ci11_1,
                        ""Project21"" = @p21, ""DebitItem21_1"" = @di21_1, ""DebitItem21_2"" = @di21_2, ""CreditItem21_1"" = @ci21_1,
                        ""Project12"" = @p12, ""DebitItem12_1"" = @di12_1, ""CreditItem12_1"" = @ci12_1,
                        ""Project22"" = @p22, ""DebitItem22_1"" = @di22_1,
                        ""Project13"" = @p13, ""CreditItem13_1"" = @ci13_1,
                        ""Project23"" = @p23, ""CreditItem23_1"" = @ci23_1,
                        ""Project14"" = @p14, ""Project24"" = @p24, ""Project15"" = @p15, ""Project25"" = @p25
                    WHERE ""AssetConfig_mSCOA_ID"" = @mscoaId AND ""TransactionTypeID"" = @txnTypeId",
                    new {
                        mscoaId = existingMscoaId, txnTypeId = pr.TxnTypeId,
                        p11 = V("Project11"), di11_1 = V("DebitItem11_1"), di11_2 = V("DebitItem11_2"), ci11_1 = V("CreditItem11_1")?.ToString(),
                        p21 = V("Project21"), di21_1 = V("DebitItem21_1"), di21_2 = V("DebitItem21_2"), ci21_1 = V("CreditItem21_1")?.ToString(),
                        p12 = V("Project12"), di12_1 = V("DebitItem12_1"), ci12_1 = V("CreditItem12_1"),
                        p22 = V("Project22"), di22_1 = V("DebitItem22_1"),
                        p13 = V("Project13"), ci13_1 = V("CreditItem13_1"),
                        p23 = V("Project23"), ci23_1 = V("CreditItem23_1"),
                        p14 = V("Project14"), p24 = V("Project24"), p15 = V("Project15"), p25 = V("Project25")
                    }, tx);
                if (rowsAffected == 0)
                {
                    await conn.ExecuteAsync(@"
                        INSERT INTO ""AssetConfig_mSCOA_TransactionType""
                        (""AssetConfig_mSCOA_ID"", ""TransactionTypeID"",
                         ""Project11"", ""DebitItem11_1"", ""DebitItem11_2"", ""CreditItem11_1"",
                         ""Project21"", ""DebitItem21_1"", ""DebitItem21_2"", ""CreditItem21_1"",
                         ""Project12"", ""DebitItem12_1"", ""CreditItem12_1"",
                         ""Project22"", ""DebitItem22_1"",
                         ""Project13"", ""CreditItem13_1"",
                         ""Project23"", ""CreditItem23_1"",
                         ""Project14"", ""Project24"", ""Project15"", ""Project25"",
                         ""CreatedByID"", ""CreatedDate"")
                        VALUES (@mscoaId, @txnTypeId,
                                @p11, @di11_1, @di11_2, @ci11_1,
                                @p21, @di21_1, @di21_2, @ci21_1,
                                @p12, @di12_1, @ci12_1,
                                @p22, @di22_1,
                                @p13, @ci13_1,
                                @p23, @ci23_1,
                                @p14, @p24, @p15, @p25,
                                1, NOW())",
                        new {
                            mscoaId = existingMscoaId, txnTypeId = pr.TxnTypeId,
                            p11 = V("Project11"), di11_1 = V("DebitItem11_1"), di11_2 = V("DebitItem11_2"), ci11_1 = V("CreditItem11_1")?.ToString(),
                            p21 = V("Project21"), di21_1 = V("DebitItem21_1"), di21_2 = V("DebitItem21_2"), ci21_1 = V("CreditItem21_1")?.ToString(),
                            p12 = V("Project12"), di12_1 = V("DebitItem12_1"), ci12_1 = V("CreditItem12_1"),
                            p22 = V("Project22"), di22_1 = V("DebitItem22_1"),
                            p13 = V("Project13"), ci13_1 = V("CreditItem13_1"),
                            p23 = V("Project23"), ci23_1 = V("CreditItem23_1"),
                            p14 = V("Project14"), p24 = V("Project24"), p15 = V("Project15"), p25 = V("Project25")
                        }, tx);
                    imported++;
                }
                else
                {
                    updated++;
                }
            }
            else
            {
                var newId = await conn.QuerySingleAsync<int>(@"
                    INSERT INTO ""AssetConfig_mSCOA"" (""FinYear"", ""TypeID"", ""CategoryID"", ""SubCategoryID"", ""MeasurementTypeID"", ""StatusID"", ""DepartmentID"", ""DivisionID"", ""Default"", ""Enabled"", ""CreatedByID"", ""CreatedDate"")
                    VALUES (@fy, @t, @c, @sc, @m, @s, NULLIF(@d, 0), NULLIF(@dv, 0), 1, 1, 1, NOW())
                    RETURNING ""AssetConfig_mSCOA_ID""",
                    new { fy = pr.FinYear, t = pr.AssetTypeId, c = pr.CatId, sc = pr.SubCatId, m = pr.MeasId, s = pr.StatusId, d = pr.DeptId, dv = pr.DivId }, tx);
                await conn.ExecuteAsync(@"
                    INSERT INTO ""AssetConfig_mSCOA_TransactionType""
                    (""AssetConfig_mSCOA_ID"", ""TransactionTypeID"",
                     ""Project11"", ""DebitItem11_1"", ""DebitItem11_2"", ""CreditItem11_1"",
                     ""Project21"", ""DebitItem21_1"", ""DebitItem21_2"", ""CreditItem21_1"",
                     ""Project12"", ""DebitItem12_1"", ""CreditItem12_1"",
                     ""Project22"", ""DebitItem22_1"",
                     ""Project13"", ""CreditItem13_1"",
                     ""Project23"", ""CreditItem23_1"",
                     ""Project14"", ""Project24"", ""Project15"", ""Project25"",
                     ""CreatedByID"", ""CreatedDate"")
                    VALUES (@mscoaId, @txnTypeId,
                            @p11, @di11_1, @di11_2, @ci11_1,
                            @p21, @di21_1, @di21_2, @ci21_1,
                            @p12, @di12_1, @ci12_1,
                            @p22, @di22_1,
                            @p13, @ci13_1,
                            @p23, @ci23_1,
                            @p14, @p24, @p15, @p25,
                            1, NOW())",
                    new {
                        mscoaId = newId, txnTypeId = pr.TxnTypeId,
                        p11 = V("Project11"), di11_1 = V("DebitItem11_1"), di11_2 = V("DebitItem11_2"), ci11_1 = V("CreditItem11_1")?.ToString(),
                        p21 = V("Project21"), di21_1 = V("DebitItem21_1"), di21_2 = V("DebitItem21_2"), ci21_1 = V("CreditItem21_1")?.ToString(),
                        p12 = V("Project12"), di12_1 = V("DebitItem12_1"), ci12_1 = V("CreditItem12_1"),
                        p22 = V("Project22"), di22_1 = V("DebitItem22_1"),
                        p13 = V("Project13"), ci13_1 = V("CreditItem13_1"),
                        p23 = V("Project23"), ci23_1 = V("CreditItem23_1"),
                        p14 = V("Project14"), p24 = V("Project24"), p15 = V("Project15"), p25 = V("Project25")
                    }, tx);
                imported++;
            }
        }
        await tx.CommitAsync();
        return Ok(new ImportResult { Success = true, Imported = imported, Updated = updated });
    }

    [HttpGet("prefix-violations")]
    public async Task<IActionResult> GetPrefixViolations()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        const string joinBlock = @"
            JOIN ""AssetConfig_mSCOA"" m ON m.""AssetConfig_mSCOA_ID"" = tt.""AssetConfig_mSCOA_ID""
            JOIN ""AssetConfig_TransactionType"" tdef ON tdef.""AssetConfig_TransactionType_ID"" = tt.""TransactionTypeID""
            LEFT JOIN ""Const_AssetType_Sys"" t ON t.""AssetType_ID"" = m.""TypeID""
            LEFT JOIN ""Const_AssetCategory_sys"" c ON c.""AssetCategoryID"" = m.""CategoryID""
            LEFT JOIN ""Const_Asset_SubCategory"" sc ON sc.""Asset_SubCategory_ID"" = m.""SubCategoryID""
            LEFT JOIN ""Const_Department"" d ON d.""Department_ID"" = m.""DepartmentID""
            LEFT JOIN ""Const_Division"" dv ON dv.""Division_ID"" = m.""DivisionID""";

        static string ViolationBlock(string voteCol, string displayNameCol, string prefixCol) => $@"
            SELECT m.""FinYear"" AS ""finYear"", tdef.""Name"" AS ""transactionTypeName"",
                   t.""AssetTypeDesc"" AS ""assetTypeName"", c.""AssetCategoryDesc"" AS ""categoryName"",
                   sc.""Asset_SubCategoryDescription"" AS ""subCategoryName"",
                   d.""DepartmentDesc"" AS ""departmentName"", dv.""DivisionDesc"" AS ""divisionName"",
                   '{voteCol}' AS ""voteKey"", tdef.""{displayNameCol}"" AS ""fieldLabel"",
                   css.""ScoaCode"" AS ""actualScoaCode"", tdef.""{prefixCol}"" AS ""requiredPrefix""
            FROM ""AssetConfig_mSCOA_TransactionType"" tt
            {joinBlock}
            LEFT JOIN ""Plan_ProjectItem"" ppi ON ppi.""PlanProjectItem_ID""::text = tt.""{voteCol}""::text
            LEFT JOIN ""Const_SCOA_Structure"" css ON css.""ScoaID"" = ppi.""SCOAItemID""
            WHERE tt.""{voteCol}"" IS NOT NULL
              AND tdef.""{prefixCol}"" IS NOT NULL AND tdef.""{prefixCol}"" != ''
              AND (css.""ScoaCode"" IS NULL OR LEFT(css.""ScoaCode"", 2) != tdef.""{prefixCol}"")";

        var sql = $@"SELECT * FROM (
            {ViolationBlock("DebitItem11_1", "DRDisplayName11", "DRPositionStatementType11")}
            UNION ALL
            {ViolationBlock("DebitItem12_1", "DRDisplayName12", "DRPositionStatementType12")}
            UNION ALL
            {ViolationBlock("CreditItem13_1", "DRDisplayName13", "DRPositionStatementType13")}
            UNION ALL
            {ViolationBlock("DebitItem11_2", "DRDisplayName14", "DRPositionStatementType14")}
            UNION ALL
            {ViolationBlock("CreditItem11_1", "CRDisplayName11", "CRPositionStatementType11")}
            UNION ALL
            {ViolationBlock("DebitItem21_1", "DRDisplayName21", "DRPositionStatementType21")}
            UNION ALL
            {ViolationBlock("DebitItem22_1", "DRDisplayName22", "DRPositionStatementType22")}
            UNION ALL
            {ViolationBlock("CreditItem23_1", "DRDisplayName23", "DRPositionStatementType23")}
            UNION ALL
            {ViolationBlock("CreditItem21_1", "CRDisplayName21", "CRPositionStatementType21")}
            UNION ALL
            {ViolationBlock("DebitItem21_2", "CRDisplayName22", "CRPositionStatementType22")}
        ) v
        ORDER BY ""finYear"", ""transactionTypeName"", ""voteKey""";

        var rows = await conn.QueryAsync<dynamic>(sql);
        return Ok(rows);
    }

    [HttpGet("missing-settings")]
    public async Task<IActionResult> GetMissingSettings(
        [FromQuery] string finYear,
        [FromQuery] int transactionTypeId)
    {
        if (string.IsNullOrWhiteSpace(finYear) || transactionTypeId <= 0)
            return BadRequest(new { error = "finYear and transactionTypeId are required." });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        bool useDeptDiv = await GetUseDeptDivision();

        var deptJoins = useDeptDiv
            ? @"LEFT JOIN ""Const_Department"" d  ON d.""Department_ID"" = COALESCE(CAST(NULLIF(i.""MunicipalDepartment_ID"", '') AS INTEGER), 0)
                LEFT JOIN ""Const_Division""   dv ON dv.""Division_ID""  = COALESCE(i.""DivisionID"", 0)"
            : "";
        var deptSelectSql  = useDeptDiv ? @"d.""DepartmentDesc""" : "NULL";
        var divSelectSql   = useDeptDiv ? @"dv.""DivisionDesc"""  : "NULL";
        var deptGroupBySql = useDeptDiv
            ? @", COALESCE(CAST(NULLIF(i.""MunicipalDepartment_ID"", '') AS INTEGER), 0), d.""DepartmentDesc"",
                  COALESCE(i.""DivisionID"", 0), dv.""DivisionDesc"""
            : "";
        var deptDivMatchSql = useDeptDiv
            ? @"AND COALESCE(CAST(NULLIF(i.""MunicipalDepartment_ID"", '') AS INTEGER), 0) = COALESCE(m.""DepartmentID"", 0)
                AND COALESCE(i.""DivisionID"", 0) = COALESCE(m.""DivisionID"", 0)"
            : "";

        var sql = $@"
            SELECT
                t.""AssetTypeDesc""                              AS ""assetTypeName"",
                c.""AssetCategoryDesc""                          AS ""categoryName"",
                sc.""Asset_SubCategoryDescription""              AS ""subCategoryName"",
                mt.""Name""                                      AS ""measurementTypeName"",
                {deptSelectSql}                                  AS ""departmentName"",
                {divSelectSql}                                   AS ""divisionName"",
                COUNT(*)                                         AS ""assetCount""
            FROM ""Asset_Register_Items"" i
            LEFT JOIN ""Const_AssetType_Sys""        t  ON t.""AssetType_ID""                    = i.""AssetType_ID""
            LEFT JOIN ""Const_AssetCategory_sys""    c  ON c.""AssetCategoryID""                 = i.""AssetCategory_ID""
            LEFT JOIN ""Const_Asset_SubCategory""    sc ON sc.""Asset_SubCategory_ID""            = i.""Asset_SubCategory_ID""
            LEFT JOIN ""AssetConfig_MeasurementType"" mt ON mt.""AssetConfig_MeasurementType_ID"" = i.""MeasurementType_ID""
            {deptJoins}
            WHERE i.""AssetDisposal_ID"" IS NULL
              AND (@transactionTypeId != 1 OR ({TransactionService.DepreciationOnlyFilters("i")}))
              AND NOT EXISTS (
                  SELECT 1
                  FROM ""AssetConfig_mSCOA"" m
                  INNER JOIN ""AssetConfig_mSCOA_TransactionType"" tt
                      ON tt.""AssetConfig_mSCOA_ID"" = m.""AssetConfig_mSCOA_ID""
                     AND tt.""TransactionTypeID""    = @transactionTypeId
                  WHERE m.""FinYear""                           = @finYear
                    AND COALESCE(m.""TypeID"",           0)     = COALESCE(i.""AssetType_ID"",        0)
                    AND COALESCE(m.""CategoryID"",       0)     = COALESCE(i.""AssetCategory_ID"",    0)
                    AND COALESCE(m.""SubCategoryID"",    0)     = COALESCE(i.""Asset_SubCategory_ID"",0)
                    AND COALESCE(m.""MeasurementTypeID"",0)     = COALESCE(i.""MeasurementType_ID"",  0)
                    {deptDivMatchSql}
              )
            GROUP BY
                COALESCE(i.""AssetType_ID"", 0),        t.""AssetTypeDesc"",
                COALESCE(i.""AssetCategory_ID"", 0),    c.""AssetCategoryDesc"",
                COALESCE(i.""Asset_SubCategory_ID"", 0), sc.""Asset_SubCategoryDescription"",
                COALESCE(i.""MeasurementType_ID"", 0),  mt.""Name""
                {deptGroupBySql}
            ORDER BY t.""AssetTypeDesc"", c.""AssetCategoryDesc"", sc.""Asset_SubCategoryDescription""";

        var rows2 = await conn.QueryAsync<dynamic>(sql, new { finYear, transactionTypeId });

        var incompleteSql = $@"
            SELECT
                t.""AssetTypeDesc""                              AS ""assetTypeName"",
                c.""AssetCategoryDesc""                          AS ""categoryName"",
                sc.""Asset_SubCategoryDescription""              AS ""subCategoryName"",
                mt.""Name""                                      AS ""measurementTypeName"",
                st.""AssetStatusDesc""                           AS ""statusName"",
                {deptSelectSql}                                  AS ""departmentName"",
                {divSelectSql}                                   AS ""divisionName"",
                COUNT(*)                                         AS ""assetCount"",
                CASE
                    WHEN tt.""DebitItem11_1"" IS NULL
                        THEN 'Debit leg not mapped'
                    WHEN NOT EXISTS (
                        SELECT 1 FROM ""Plan_ProjectItem"" ppidx
                        WHERE ppidx.""PlanProjectItem_ID"" = tt.""DebitItem11_1""
                    ) THEN 'Debit Plan_ProjectItem not found (ID: ' || tt.""DebitItem11_1""::text || ')'
                    WHEN NOT EXISTS (
                        SELECT 1 FROM ""Plan_ProjectItem"" ppidx2
                        JOIN ""Led_Vote"" lvdx ON lvdx.""SCOAItemID"" = ppidx2.""SCOAItemID"" AND lvdx.""FinYear"" = @finYear
                        WHERE ppidx2.""PlanProjectItem_ID"" = tt.""DebitItem11_1""
                    ) THEN 'Debit vote not loaded for FY ' || @finYear
                    WHEN NULLIF(tt.""CreditItem11_1"", '') IS NULL
                        THEN 'Credit leg not mapped'
                    WHEN NOT EXISTS (
                        SELECT 1 FROM ""Plan_ProjectItem"" ppicx
                        WHERE ppicx.""PlanProjectItem_ID"" = (CASE WHEN TRIM(COALESCE(tt.""CreditItem11_1"", '')) ~ '^[0-9]+$' THEN CAST(TRIM(tt.""CreditItem11_1"") AS INTEGER) END)
                    ) THEN 'Credit Plan_ProjectItem not found (ID: ' || tt.""CreditItem11_1"" || ')'
                    WHEN NOT EXISTS (
                        SELECT 1 FROM ""Plan_ProjectItem"" ppicx2
                        JOIN ""Led_Vote"" lvcx ON lvcx.""SCOAItemID"" = ppicx2.""SCOAItemID"" AND lvcx.""FinYear"" = @finYear
                        WHERE ppicx2.""PlanProjectItem_ID"" = (CASE WHEN TRIM(COALESCE(tt.""CreditItem11_1"", '')) ~ '^[0-9]+$' THEN CAST(TRIM(tt.""CreditItem11_1"") AS INTEGER) END)
                    ) THEN 'Credit vote not loaded for FY ' || @finYear
                END AS ""incompleteReason""
            FROM ""Asset_Register_Items"" i
            LEFT JOIN ""Const_AssetType_Sys""        t  ON t.""AssetType_ID""                    = i.""AssetType_ID""
            LEFT JOIN ""Const_AssetCategory_sys""    c  ON c.""AssetCategoryID""                 = i.""AssetCategory_ID""
            LEFT JOIN ""Const_Asset_SubCategory""    sc ON sc.""Asset_SubCategory_ID""            = i.""Asset_SubCategory_ID""
            LEFT JOIN ""AssetConfig_MeasurementType"" mt ON mt.""AssetConfig_MeasurementType_ID"" = i.""MeasurementType_ID""
            LEFT JOIN ""Const_AssetStatus_Sys""      st ON st.""AssetStatus_ID""                  = i.""AssetStatus_ID""
            {deptJoins}
            INNER JOIN ""AssetConfig_mSCOA"" m
                ON  m.""FinYear""                               = @finYear
                AND COALESCE(m.""TypeID"",           0)         = COALESCE(i.""AssetType_ID"",        0)
                AND COALESCE(m.""CategoryID"",       0)         = COALESCE(i.""AssetCategory_ID"",    0)
                AND COALESCE(m.""SubCategoryID"",    0)         = COALESCE(i.""Asset_SubCategory_ID"",0)
                AND COALESCE(m.""MeasurementTypeID"",0)         = COALESCE(i.""MeasurementType_ID"",  0)
                {deptDivMatchSql}
            INNER JOIN ""AssetConfig_mSCOA_TransactionType"" tt
                ON  tt.""AssetConfig_mSCOA_ID""                 = m.""AssetConfig_mSCOA_ID""
                AND tt.""TransactionTypeID""                    = @transactionTypeId
            WHERE i.""AssetDisposal_ID"" IS NULL
              AND (@transactionTypeId != 1 OR ({TransactionService.DepreciationOnlyFilters("i")}))
              AND {TransactionService.VoteLegIncompletePredicate("tt")}
            GROUP BY
                COALESCE(i.""AssetType_ID"", 0),        t.""AssetTypeDesc"",
                COALESCE(i.""AssetCategory_ID"", 0),    c.""AssetCategoryDesc"",
                COALESCE(i.""Asset_SubCategory_ID"", 0), sc.""Asset_SubCategoryDescription"",
                COALESCE(i.""MeasurementType_ID"", 0),  mt.""Name"",
                COALESCE(i.""AssetStatus_ID"", 0),      st.""AssetStatusDesc"",
                tt.""DebitItem11_1"",
                tt.""CreditItem11_1""
                {deptGroupBySql}
            ORDER BY t.""AssetTypeDesc"", c.""AssetCategoryDesc"", sc.""Asset_SubCategoryDescription""";

        var incompleteRows = await conn.QueryAsync<dynamic>(incompleteSql, new { finYear, transactionTypeId });
        return Ok(new { rows = rows2, incompleteRows, useDeptDivision = useDeptDiv });
    }
}
