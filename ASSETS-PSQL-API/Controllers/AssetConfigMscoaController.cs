using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Services;

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
    public int? DebitItem11_2 { get; set; }
    public int? CreditItem11_1 { get; set; }
    public int? Project21 { get; set; }
    public int? DebitItem21_1 { get; set; }
    public int? DebitItem21_2 { get; set; }
    public int? CreditItem21_1 { get; set; }
    public int? Project12 { get; set; }
    public int? DebitItem12_1 { get; set; }
    public int? CreditItem12_1 { get; set; }
    public int? Project22 { get; set; }
    public int? DebitItem22_1 { get; set; }
    public int? Project13 { get; set; }
    public int? CreditItem13_1 { get; set; }
    public int? Project23 { get; set; }
    public int? CreditItem23_1 { get; set; }
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
                   ""CRProjectType22"" as ""crProjectType22""
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

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AssetConfigMscoaDto model)
    {
        if (model.DepartmentId == null || model.DepartmentId == 0)
            return BadRequest(new { error = "Department is required for mSCOA configuration." });
        if (model.DivisionId == null || model.DivisionId == 0)
            return BadRequest(new { error = "Division is required for mSCOA configuration." });
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""AssetConfig_mSCOA"" (""FinYear"", ""TypeID"", ""CategoryID"", ""SubCategoryID"", ""MeasurementTypeID"", ""StatusID"", ""DepartmentID"", ""DivisionID"", ""Default"", ""Enabled"", ""CreatedByID"", ""CreatedDate"")
            VALUES (@FinYear, @TypeID, @CategoryID, @SubCategoryID, @MeasurementTypeID, @StatusID, @DepartmentID, @DivisionID, 1, 1, 1, NOW())
            RETURNING ""AssetConfig_mSCOA_ID""",
            new { model.FinYear, TypeID = model.TypeId, CategoryID = model.CategoryId, SubCategoryID = model.SubCategoryId, MeasurementTypeID = model.MeasurementTypeId, StatusID = model.StatusId, DepartmentID = model.DepartmentId, DivisionID = model.DivisionId });
        return Ok(new { id });
    }

    [HttpPost("{sourceId:int}/copy")]
    public async Task<IActionResult> Copy(int sourceId, [FromBody] AssetConfigMscoaDto model)
    {
        if (model.DepartmentId == null || model.DepartmentId == 0)
            return BadRequest(new { error = "Department is required for mSCOA configuration." });
        if (model.DivisionId == null || model.DivisionId == 0)
            return BadRequest(new { error = "Division is required for mSCOA configuration." });
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sourceExists = await conn.QueryFirstOrDefaultAsync<int?>(@"
            SELECT ""AssetConfig_mSCOA_ID"" FROM ""AssetConfig_mSCOA""
            WHERE ""AssetConfig_mSCOA_ID"" = @sourceId LIMIT 1",
            new { sourceId });
        if (!sourceExists.HasValue)
            return NotFound(new { error = "Source mSCOA configuration not found." });
        await using var tx = await conn.BeginTransactionAsync();
        var dup = await conn.QueryFirstOrDefaultAsync<int?>(@"
            SELECT ""AssetConfig_mSCOA_ID"" FROM ""AssetConfig_mSCOA""
            WHERE ""FinYear"" = @FinYear
              AND (""TypeID"" IS NOT DISTINCT FROM @TypeID)
              AND (""CategoryID"" IS NOT DISTINCT FROM @CategoryID)
              AND (""SubCategoryID"" IS NOT DISTINCT FROM @SubCategoryID)
              AND (""MeasurementTypeID"" IS NOT DISTINCT FROM @MeasurementTypeID)
              AND (""StatusID"" IS NOT DISTINCT FROM @StatusID)
              AND (""DepartmentID"" IS NOT DISTINCT FROM @DepartmentID)
              AND (""DivisionID"" IS NOT DISTINCT FROM @DivisionID)
            LIMIT 1",
            new { model.FinYear, TypeID = model.TypeId, CategoryID = model.CategoryId,
                  SubCategoryID = model.SubCategoryId, MeasurementTypeID = model.MeasurementTypeId,
                  StatusID = model.StatusId, DepartmentID = model.DepartmentId, DivisionID = model.DivisionId },
            transaction: tx);
        if (dup.HasValue)
        {
            await tx.RollbackAsync();
            return Conflict(new { error = "An mSCOA configuration already exists for the selected Year / Type / Category / Sub Category / Measurement Type / Status / Department / Division combination." });
        }
        var newId = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""AssetConfig_mSCOA"" (""FinYear"", ""TypeID"", ""CategoryID"", ""SubCategoryID"", ""MeasurementTypeID"", ""StatusID"", ""DepartmentID"", ""DivisionID"", ""Default"", ""Enabled"", ""CreatedByID"", ""CreatedDate"")
            VALUES (@FinYear, @TypeID, @CategoryID, @SubCategoryID, @MeasurementTypeID, @StatusID, @DepartmentID, @DivisionID, 1, 1, 1, NOW())
            RETURNING ""AssetConfig_mSCOA_ID""",
            new { model.FinYear, TypeID = model.TypeId, CategoryID = model.CategoryId,
                  SubCategoryID = model.SubCategoryId, MeasurementTypeID = model.MeasurementTypeId,
                  StatusID = model.StatusId, DepartmentID = model.DepartmentId, DivisionID = model.DivisionId },
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
        if (model.DepartmentId == null || model.DepartmentId == 0)
            return BadRequest(new { error = "Department is required for mSCOA configuration." });
        if (model.DivisionId == null || model.DivisionId == 0)
            return BadRequest(new { error = "Division is required for mSCOA configuration." });
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""AssetConfig_mSCOA""
            SET ""FinYear"" = @FinYear, ""TypeID"" = @TypeID, ""CategoryID"" = @CategoryID, ""SubCategoryID"" = @SubCategoryID,
                ""MeasurementTypeID"" = @MeasurementTypeID, ""StatusID"" = @StatusID,
                ""DepartmentID"" = @DepartmentID, ""DivisionID"" = @DivisionID,
                ""ModifiedByID"" = 1, ""ModiefiedDate"" = NOW()
            WHERE ""AssetConfig_mSCOA_ID"" = @id",
            new { model.FinYear, TypeID = model.TypeId, CategoryID = model.CategoryId, SubCategoryID = model.SubCategoryId, MeasurementTypeID = model.MeasurementTypeId, StatusID = model.StatusId, DepartmentID = model.DepartmentId, DivisionID = model.DivisionId, id });
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
                   tt.""DebitItem11_2"" as ""debitItem11_2"", CAST(tt.""CreditItem11_1"" AS INTEGER) as ""creditItem11_1"",
                   tt.""Project21"" as ""project21"", tt.""DebitItem21_1"" as ""debitItem21_1"",
                   tt.""DebitItem21_2"" as ""debitItem21_2"", CAST(tt.""CreditItem21_1"" AS INTEGER) as ""creditItem21_1"",
                   tt.""Project12"" as ""project12"", tt.""DebitItem12_1"" as ""debitItem12_1"",
                   tt.""CreditItem12_1"" as ""creditItem12_1"",
                   tt.""Project22"" as ""project22"", tt.""DebitItem22_1"" as ""debitItem22_1"",
                   tt.""Project13"" as ""project13"", tt.""CreditItem13_1"" as ""creditItem13_1"",
                   tt.""Project23"" as ""project23"", tt.""CreditItem23_1"" as ""creditItem23_1"",
                   tt.""Project14"" as ""project14"", tt.""Project24"" as ""project24"",
                   tt.""Project15"" as ""project15"", tt.""Project25"" as ""project25"",
                   '' AS ""project11Display"", '' AS ""project12Display"",
                   '' AS ""project13Display"", '' AS ""project14Display"", '' AS ""project15Display"",
                   '' AS ""project21Display"", '' AS ""project22Display"",
                   '' AS ""project23Display"", '' AS ""project24Display"", '' AS ""project25Display"",
                   '' AS ""debitItem11_1Display"", '' AS ""debitItem11_2Display"",
                   '' AS ""creditItem11_1Display"", '' AS ""debitItem21_1Display"",
                   '' AS ""debitItem21_2Display"", '' AS ""creditItem21_1Display"",
                   '' AS ""debitItem12_1Display"", '' AS ""creditItem12_1Display"",
                   '' AS ""debitItem22_1Display"", '' AS ""creditItem13_1Display"",
                   '' AS ""creditItem23_1Display""
            FROM ""AssetConfig_mSCOA_TransactionType"" tt
            INNER JOIN ""AssetConfig_TransactionType"" tdef ON tdef.""AssetConfig_TransactionType_ID"" = tt.""TransactionTypeID""
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
                SET ""Project11""=@Project11, ""DebitItem11_1""=@DebitItem11_1, ""DebitItem11_2""=@DebitItem11_2,
                    ""CreditItem11_1""=@CreditItem11_1,
                    ""Project21""=@Project21, ""DebitItem21_1""=@DebitItem21_1, ""DebitItem21_2""=@DebitItem21_2,
                    ""CreditItem21_1""=@CreditItem21_1,
                    ""Project12""=@Project12, ""DebitItem12_1""=@DebitItem12_1, ""CreditItem12_1""=@CreditItem12_1,
                    ""Project22""=@Project22, ""DebitItem22_1""=@DebitItem22_1,
                    ""Project13""=@Project13, ""CreditItem13_1""=@CreditItem13_1,
                    ""Project23""=@Project23, ""CreditItem23_1""=@CreditItem23_1,
                    ""Project14""=@Project14, ""Project24""=@Project24,
                    ""Project15""=@Project15, ""Project25""=@Project25,
                    ""ModifiedByID""=1, ""ModiefiedDate""=GETDATE()
                WHERE ""AssetConfig_mSCOA_TransactionType_ID"" = @existingId",
                new { existing.Value, existingId = existing.Value,
                    model.Project11, model.DebitItem11_1, model.DebitItem11_2, CreditItem11_1 = model.CreditItem11_1?.ToString(),
                    model.Project21, model.DebitItem21_1, model.DebitItem21_2, CreditItem21_1 = model.CreditItem21_1?.ToString(),
                    model.Project12, model.DebitItem12_1, model.CreditItem12_1,
                    model.Project22, model.DebitItem22_1,
                    model.Project13, model.CreditItem13_1,
                    model.Project23, model.CreditItem23_1,
                    model.Project14, model.Project24, model.Project15, model.Project25 });
            return Ok(new { id = existing.Value });
        }
        else
        {
            var newId = await conn.QuerySingleAsync<int>(@"
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
                VALUES (@MscoaId, @TransactionTypeId,
                        @Project11, @DebitItem11_1, @DebitItem11_2, @CreditItem11_1,
                        @Project21, @DebitItem21_1, @DebitItem21_2, @CreditItem21_1,
                        @Project12, @DebitItem12_1, @CreditItem12_1,
                        @Project22, @DebitItem22_1,
                        @Project13, @CreditItem13_1,
                        @Project23, @CreditItem23_1,
                        @Project14, @Project24, @Project15, @Project25,
                        1, GETDATE())
                RETURNING ""AssetConfig_mSCOA_TransactionType_ID""",
                new { MscoaId = id, model.TransactionTypeId,
                    model.Project11, model.DebitItem11_1, model.DebitItem11_2, CreditItem11_1 = model.CreditItem11_1?.ToString(),
                    model.Project21, model.DebitItem21_1, model.DebitItem21_2, CreditItem21_1 = model.CreditItem21_1?.ToString(),
                    model.Project12, model.DebitItem12_1, model.CreditItem12_1,
                    model.Project22, model.DebitItem22_1,
                    model.Project13, model.CreditItem13_1,
                    model.Project23, model.CreditItem23_1,
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
}
