using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using System.Text.Json;
using ClosedXML.Excel;

namespace AssetManagement.Controllers;

// ---------------------------------------------------------------------------
// Lookup: Maintenance Types
// ---------------------------------------------------------------------------
[ApiController]
[Route("api/maint-types")]
public class MaintTypeController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    public MaintTypeController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool includeDisabled = false)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var where = includeDisabled ? "" : @" WHERE ""Enabled"" = TRUE";
        var items = await conn.QueryAsync<dynamic>($@"
            SELECT ""MaintTypeID""   AS ""maintTypeId"",
                   ""MaintTypeDesc"" AS ""maintTypeDesc"",
                   ""IsCapex""       AS ""isCapex"",
                   ""Enabled""       AS ""enabled"",
                   ""SortOrder""     AS ""sortOrder""
            FROM ""Const_Maint_Type""{where}
            ORDER BY ""SortOrder"", ""MaintTypeID""");
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] MaintTypeDto body)
    {
        if (string.IsNullOrWhiteSpace(body.MaintTypeDesc))
            return BadRequest(new { error = "maintTypeDesc is required" });
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        int sortOrder;
        if (body.SortOrder.HasValue)
            sortOrder = Math.Max(0, body.SortOrder.Value);
        else
        {
            var maxOrder = await conn.QueryFirstOrDefaultAsync<int?>(@"SELECT MAX(""SortOrder"") FROM ""Const_Maint_Type""");
            sortOrder = (maxOrder ?? 0) + 10;
        }
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Const_Maint_Type"" (""MaintTypeDesc"", ""IsCapex"", ""Enabled"", ""SortOrder"")
            VALUES (@desc, @isCapex, @enabled, @sortOrder)
            RETURNING ""MaintTypeID""",
            new
            {
                desc = body.MaintTypeDesc.Trim(),
                isCapex = body.IsCapex ?? false,
                enabled = body.Enabled ?? true,
                sortOrder
            });
        var created = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""MaintTypeID"" AS ""maintTypeId"", ""MaintTypeDesc"" AS ""maintTypeDesc"",
                   ""IsCapex"" AS ""isCapex"", ""Enabled"" AS ""enabled"", ""SortOrder"" AS ""sortOrder""
            FROM ""Const_Maint_Type"" WHERE ""MaintTypeID"" = @id", new { id });
        return CreatedAtAction(nameof(GetAll), new { id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] MaintTypeDto body)
    {
        if (string.IsNullOrWhiteSpace(body.MaintTypeDesc))
            return BadRequest(new { error = "maintTypeDesc is required" });
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Const_Maint_Type"" SET
                ""MaintTypeDesc"" = @desc,
                ""IsCapex""       = @isCapex,
                ""Enabled""       = @enabled,
                ""SortOrder""     = @sortOrder
            WHERE ""MaintTypeID"" = @id",
            new
            {
                id,
                desc = body.MaintTypeDesc.Trim(),
                isCapex = body.IsCapex ?? false,
                enabled = body.Enabled ?? true,
                sortOrder = Math.Max(0, body.SortOrder ?? 0)
            });
        if (rows == 0) return NotFound(new { error = "Maintenance type not found" });
        var updated = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""MaintTypeID"" AS ""maintTypeId"", ""MaintTypeDesc"" AS ""maintTypeDesc"",
                   ""IsCapex"" AS ""isCapex"", ""Enabled"" AS ""enabled"", ""SortOrder"" AS ""sortOrder""
            FROM ""Const_Maint_Type"" WHERE ""MaintTypeID"" = @id", new { id });
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var inUse = await conn.QueryFirstOrDefaultAsync<int?>(@"SELECT 1 FROM ""Planned_Maint_Plan"" WHERE ""MaintenanceTypeID"" = @id LIMIT 1", new { id });
        if (inUse != null) return Conflict(new { error = "This maintenance type is referenced by existing plans and cannot be deleted. Disable it instead." });
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Const_Maint_Type"" WHERE ""MaintTypeID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Maintenance type not found" }) : Ok(new { success = 1 });
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.QueryAsync<dynamic>(@"SELECT ""MaintTypeID"", ""MaintTypeDesc"", ""IsCapex"", ""SortOrder"", ""Enabled"" FROM ""Const_Maint_Type"" ORDER BY ""SortOrder"", ""MaintTypeID""");
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Maintenance Types");
        ws.Cell(1, 1).Value = "ID";
        ws.Cell(1, 2).Value = "Description";
        ws.Cell(1, 3).Value = "Is Capex";
        ws.Cell(1, 4).Value = "Sort Order";
        ws.Cell(1, 5).Value = "Enabled";
        ws.Row(1).Style.Font.Bold = true;
        int r = 2;
        foreach (var row in rows)
        {
            ws.Cell(r, 1).Value = (int)row.MaintTypeID;
            ws.Cell(r, 2).Value = (string?)row.MaintTypeDesc ?? "";
            ws.Cell(r, 3).Value = (bool)row.IsCapex ? "Yes" : "No";
            ws.Cell(r, 4).Value = (int?)row.SortOrder ?? 0;
            ws.Cell(r, 5).Value = (bool)row.Enabled ? "Yes" : "No";
            r++;
        }
        ws.Columns().AdjustToContents();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "MaintenanceTypes_Export.xlsx");
    }
}

// ---------------------------------------------------------------------------
// Lookup: Maintenance Frequencies
// ---------------------------------------------------------------------------
[ApiController]
[Route("api/maint-frequencies")]
public class MaintFrequencyController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    public MaintFrequencyController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool includeDisabled = false)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var where = includeDisabled ? "" : @" WHERE ""Enabled"" = TRUE";
        var items = await conn.QueryAsync<dynamic>($@"
            SELECT ""FrequencyID""   AS ""frequencyId"",
                   ""FrequencyDesc"" AS ""frequencyDesc"",
                   ""IntervalDays""  AS ""intervalDays"",
                   ""Enabled""       AS ""enabled"",
                   ""SortOrder""     AS ""sortOrder""
            FROM ""Const_Maint_Frequency""{where}
            ORDER BY ""SortOrder"", ""FrequencyID""");
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] MaintFrequencyDto body)
    {
        if (string.IsNullOrWhiteSpace(body.FrequencyDesc))
            return BadRequest(new { error = "frequencyDesc is required" });
        var rawIntervalDays = body.IntervalDays ?? 0;
        if (rawIntervalDays < 0) return BadRequest(new { error = "intervalDays must be 0 or greater" });
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        int sortOrder;
        if (body.SortOrder.HasValue)
            sortOrder = Math.Max(0, body.SortOrder.Value);
        else
        {
            var maxOrder = await conn.QueryFirstOrDefaultAsync<int?>(@"SELECT MAX(""SortOrder"") FROM ""Const_Maint_Frequency""");
            sortOrder = (maxOrder ?? 0) + 10;
        }
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Const_Maint_Frequency"" (""FrequencyDesc"", ""IntervalDays"", ""Enabled"", ""SortOrder"")
            VALUES (@desc, @intervalDays, @enabled, @sortOrder)
            RETURNING ""FrequencyID""",
            new
            {
                desc = body.FrequencyDesc.Trim(),
                intervalDays = rawIntervalDays,
                enabled = body.Enabled ?? true,
                sortOrder
            });
        var created = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""FrequencyID"" AS ""frequencyId"", ""FrequencyDesc"" AS ""frequencyDesc"",
                   ""IntervalDays"" AS ""intervalDays"", ""Enabled"" AS ""enabled"", ""SortOrder"" AS ""sortOrder""
            FROM ""Const_Maint_Frequency"" WHERE ""FrequencyID"" = @id", new { id });
        return CreatedAtAction(nameof(GetAll), new { id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] MaintFrequencyDto body)
    {
        if (string.IsNullOrWhiteSpace(body.FrequencyDesc))
            return BadRequest(new { error = "frequencyDesc is required" });
        var rawIntervalDays = body.IntervalDays ?? 0;
        if (rawIntervalDays < 0) return BadRequest(new { error = "intervalDays must be 0 or greater" });
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Const_Maint_Frequency"" SET
                ""FrequencyDesc"" = @desc,
                ""IntervalDays""  = @intervalDays,
                ""Enabled""       = @enabled,
                ""SortOrder""     = @sortOrder
            WHERE ""FrequencyID"" = @id",
            new
            {
                id,
                desc = body.FrequencyDesc.Trim(),
                intervalDays = rawIntervalDays,
                enabled = body.Enabled ?? true,
                sortOrder = Math.Max(0, body.SortOrder ?? 0)
            });
        if (rows == 0) return NotFound(new { error = "Maintenance frequency not found" });
        var updated = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""FrequencyID"" AS ""frequencyId"", ""FrequencyDesc"" AS ""frequencyDesc"",
                   ""IntervalDays"" AS ""intervalDays"", ""Enabled"" AS ""enabled"", ""SortOrder"" AS ""sortOrder""
            FROM ""Const_Maint_Frequency"" WHERE ""FrequencyID"" = @id", new { id });
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var inUse = await conn.QueryFirstOrDefaultAsync<int?>(@"SELECT 1 FROM ""Planned_Maint_Plan"" WHERE ""FrequencyID"" = @id LIMIT 1", new { id });
        if (inUse != null) return Conflict(new { error = "This frequency is referenced by existing plans and cannot be deleted. Disable it instead." });
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Const_Maint_Frequency"" WHERE ""FrequencyID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Maintenance frequency not found" }) : Ok(new { success = 1 });
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.QueryAsync<dynamic>(@"SELECT ""FrequencyID"", ""FrequencyDesc"", ""IntervalDays"", ""SortOrder"", ""Enabled"" FROM ""Const_Maint_Frequency"" ORDER BY ""SortOrder"", ""FrequencyID""");
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Maintenance Frequencies");
        ws.Cell(1, 1).Value = "ID";
        ws.Cell(1, 2).Value = "Description";
        ws.Cell(1, 3).Value = "Interval (Days)";
        ws.Cell(1, 4).Value = "Sort Order";
        ws.Cell(1, 5).Value = "Enabled";
        ws.Row(1).Style.Font.Bold = true;
        int r = 2;
        foreach (var row in rows)
        {
            ws.Cell(r, 1).Value = (int)row.FrequencyID;
            ws.Cell(r, 2).Value = (string?)row.FrequencyDesc ?? "";
            ws.Cell(r, 3).Value = (int?)row.IntervalDays ?? 0;
            ws.Cell(r, 4).Value = (int?)row.SortOrder ?? 0;
            ws.Cell(r, 5).Value = (bool)row.Enabled ? "Yes" : "No";
            r++;
        }
        ws.Columns().AdjustToContents();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "MaintenanceFrequencies_Export.xlsx");
    }
}

// ---------------------------------------------------------------------------
// Plans CRUD + preview-assets + plan-asset CRUD
// ---------------------------------------------------------------------------
[ApiController]
[Route("api/planned-maint-plans")]
public class PlannedMaintPlanController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    public PlannedMaintPlanController(DbConnectionFactory db) => _db = db;

    // PlanSelect: joins the junction table for assetCount; the legacy
    // AssetRegisterItemID single-asset columns are kept for backward-compat
    // but asset filtering uses EXISTS via the junction table.
    private const string PlanSelect = @"
        SELECT p.""PlanID""              AS ""planId"",
               p.""AssetRegisterItemID"" AS ""assetRegisterItemId"",
               COALESCE(ar_leg.""Description"", '') AS ""assetDescription"",
               COALESCE(ar_leg.""Barcode"", '')      AS ""assetBarcode"",
               p.""MaintenanceTypeID""  AS ""maintenanceTypeId"",
               COALESCE(mt.""MaintTypeDesc"", '') AS ""maintenanceTypeDesc"",
               mt.""IsCapex""           AS ""isCapex"",
               p.""FrequencyID""        AS ""frequencyId"",
               COALESCE(mf.""FrequencyDesc"", '') AS ""frequencyDesc"",
               COALESCE(mf.""IntervalDays"", 0)   AS ""intervalDays"",
               p.""PlanName""           AS ""planName"",
               p.""Description""        AS ""description"",
               p.""EstimatedCost""      AS ""estimatedCost"",
               p.""PlanProjectItemID""  AS ""planProjectItemId"",
               (SELECT ppi.""ProjectID"" FROM ""Plan_ProjectItem"" ppi
                WHERE ppi.""PlanProjectItem_ID"" = p.""PlanProjectItemID"") AS ""debitProjectId"",
               p.""IsActive""           AS ""isActive"",
               p.""StartDate""          AS ""startDate"",
               p.""CreatedDate""        AS ""createdDate"",
               p.""CreatedBy""          AS ""createdBy"",
               p.""ModifiedDate""       AS ""modifiedDate"",
               p.""ModifiedBy""         AS ""modifiedBy"",
               (SELECT COUNT(*)::int FROM ""Planned_Maint_Plan_Asset"" pa2
                WHERE pa2.""PlanID"" = p.""PlanID"") AS ""assetCount"",
               (SELECT s.""ScheduledDate""
                FROM ""Planned_Maint_Schedule"" s
                WHERE s.""PlanID"" = p.""PlanID""
                  AND s.""Status"" IN ('Scheduled','Overdue')
                ORDER BY s.""ScheduledDate""
                LIMIT 1) AS ""nextScheduledDate""
        FROM ""Planned_Maint_Plan"" p
        LEFT JOIN ""Asset_Register_Items"" ar_leg ON ar_leg.""AssetRegisterItem_ID"" = p.""AssetRegisterItemID""
        LEFT JOIN ""Const_Maint_Type"" mt ON mt.""MaintTypeID"" = p.""MaintenanceTypeID""
        LEFT JOIN ""Const_Maint_Frequency"" mf ON mf.""FrequencyID"" = p.""FrequencyID""";

    // Asset columns returned from the junction table (for GetById assets list)
    private const string PlanAssetSelect = @"
        SELECT pa.""PlanAssetID""       AS ""planAssetId"",
               pa.""PlanID""            AS ""planId"",
               pa.""AssetRegisterItemID"" AS ""assetRegisterItemId"",
               pa.""SortOrder""         AS ""sortOrder"",
               COALESCE(ar.""MunicipalAssetID"", '') AS ""municipalAssetId"",
               COALESCE(ar.""Description"", '') AS ""description"",
               COALESCE(ar.""Barcode"", '')      AS ""barcode"",
               COALESCE(ac.""AssetClassDesc"", '') AS ""assetClassDesc"",
               COALESCE(dep.""DepartmentDesc"", '')   AS ""department""
        FROM ""Planned_Maint_Plan_Asset"" pa
        JOIN ""Asset_Register_Items"" ar ON ar.""AssetRegisterItem_ID"" = pa.""AssetRegisterItemID""
        LEFT JOIN ""Const_AssetClass_sys"" ac ON ac.""AssetClass_ID"" = ar.""AssetClass_ID""
        LEFT JOIN ""Const_Department"" dep ON dep.""Department_ID"" = NULLIF(ar.""MunicipalDepartment_ID"", '')::integer";

    // -----------------------------------------------------------------------
    // Preview assets — for the create wizard asset-selection step.
    // Same columns as Verification Register preview-items, but WITHOUT the
    // "not already in active verification register" exclusion clause.
    // Accepts: search, assetTypeId, categoryId (to match verification UX).
    // -----------------------------------------------------------------------
    [HttpGet("preview-assets")]
    public async Task<IActionResult> PreviewAssets(
        [FromQuery] string? search,
        [FromQuery] int? assetTypeId,
        [FromQuery] int? categoryId,
        [FromQuery] int pageSize = 200)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var p = new DynamicParameters();
        var sql = @"
            SELECT
                a.""AssetRegisterItem_ID"" AS ""assetRegisterItemId"",
                a.""MunicipalAssetID""     AS ""municipalAssetId"",
                a.""Description""          AS ""description"",
                a.""Barcode""              AS ""barcode"",
                a.""OldBarCode""           AS ""oldBarCode"",
                a.""SerialNumber""         AS ""serialNumber"",
                a.""RegistrationNumber""   AS ""registrationNumber"",
                a.""ParentAssetRegisterItem_ID"" AS ""parentAssetRegisterItemId"",
                a.""MainAssetDescription"" AS ""mainAssetDescription"",
                a.""Make""                 AS ""make"",
                a.""Model""               AS ""model"",
                a.""MainAssetID""         AS ""mainAssetId"",
                a.""ImageRef""            AS ""imageRef"",
                a.""AssetType_ID""         AS ""assetTypeId"",
                COALESCE(at.""AssetTypeDesc"", '') AS ""assetTypeDesc"",
                a.""AssetCategory_ID""     AS ""assetCategoryId"",
                COALESCE(ac.""AssetCategoryDesc"", '') AS ""assetCategoryDesc"",
                a.""Asset_SubCategory_ID"" AS ""assetSubCategoryId"",
                COALESCE(asc2.""Asset_SubCategoryDescription"", '') AS ""assetSubCategoryDesc"",
                a.""AssetClass_ID""        AS ""assetClassId"",
                COALESCE(cls.""AssetClassDesc"", '') AS ""assetClassDesc"",
                a.""InfrastructurOrNonInfrastructure"" AS ""infraOrNonInfra"",
                a.""MeasurementType_ID""   AS ""measurementTypeId"",
                COALESCE(mtype.""Name"", '') AS ""measurementTypeDesc"",
                a.""MunicipalDepartment_ID"" AS ""municipalDepartmentId"",
                '' AS ""departmentDesc"",
                a.""PurchaseAmount""       AS ""purchaseAmount"",
                a.""CarryingAmountClosingBalance"" AS ""carryingAmount"",
                a.""Custodian_ID""         AS ""custodianId"",
                '' AS ""custodianName"",
                a.""AssetCondition_ID""    AS ""assetConditionId"",
                COALESCE(cond.""Description"", '') AS ""conditionDesc"",
                a.""AssetStatus_ID""       AS ""assetStatusId"",
                COALESCE(st.""AssetStatusDesc"", '') AS ""statusDesc"",
                a.""Town_ID""             AS ""townId"",
                a.""Building_ID""         AS ""buildingId"",
                a.""FloorID""             AS ""floorId"",
                a.""Room_ID""             AS ""roomId"",
                a.""Ward_ID""             AS ""wardId"",
                a.""SuburbID""            AS ""suburbId"",
                a.""Street_ID""           AS ""streetId"",
                a.""DivisionID""          AS ""divisionId"",
                '' AS ""divisionName"",
                a.""Zoning_ID""           AS ""zoningId"",
                a.""Floor_Area""          AS ""floorArea"",
                a.""ErfNumber""           AS ""erfNumber"",
                a.""ErfSizeM2""           AS ""erfSizeM2"",
                a.""PortionNumber""       AS ""portionNumber"",
                a.""UnitNumber""          AS ""unitNumber"",
                a.""latitude""             AS ""latitude"",
                a.""longitude""            AS ""longitude""
            FROM ""Asset_Register_Items"" a
            LEFT JOIN ""Const_AssetType_Sys"" at ON a.""AssetType_ID"" = at.""AssetType_ID""
            LEFT JOIN ""Const_AssetCategory_sys"" ac ON a.""AssetCategory_ID"" = ac.""AssetCategoryID""
            LEFT JOIN ""Const_Asset_SubCategory"" asc2 ON a.""Asset_SubCategory_ID"" = asc2.""Asset_SubCategory_ID""
            LEFT JOIN ""Const_AssetClass_sys"" cls ON a.""AssetClass_ID"" = cls.""AssetClass_ID""
            LEFT JOIN ""Const_Asset_Condition"" cond ON a.""AssetCondition_ID"" = cond.""Asset_Condition_ID""
            LEFT JOIN ""Const_AssetStatus_Sys"" st ON a.""AssetStatus_ID"" = st.""AssetStatus_ID""
            LEFT JOIN ""AssetConfig_MeasurementType"" mtype ON a.""MeasurementType_ID"" = mtype.""AssetConfig_MeasurementType_ID""
            WHERE 1=1";
        if (!string.IsNullOrWhiteSpace(search))
        {
            sql += @" AND (a.""Description"" ILIKE @search OR a.""Barcode"" ILIKE @search OR a.""SerialNumber"" ILIKE @search)";
            p.Add("search", "%" + search.Trim() + "%");
        }
        if (assetTypeId.HasValue) { sql += @" AND a.""AssetType_ID"" = @assetTypeId"; p.Add("assetTypeId", assetTypeId.Value); }
        if (categoryId.HasValue) { sql += @" AND a.""AssetCategory_ID"" = @categoryId"; p.Add("categoryId", categoryId.Value); }
        sql += @" ORDER BY a.""AssetRegisterItem_ID""";
        if (pageSize > 0)
        {
            var cap = pageSize > 500 ? 500 : pageSize;
            sql += $" LIMIT {cap}";
        }
        var rows = await conn.QueryAsync<dynamic>(sql, p);
        return Ok(rows);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool? isActive, [FromQuery] int? maintTypeId,
        [FromQuery] int? assetClassId, [FromQuery] int? departmentId, [FromQuery] int? finYear)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = PlanSelect + " WHERE 1=1";
        var p = new DynamicParameters();
        if (isActive.HasValue)    { sql += @" AND p.""IsActive"" = @isActive"; p.Add("isActive", isActive.Value); }
        if (maintTypeId.HasValue) { sql += @" AND p.""MaintenanceTypeID"" = @maintTypeId"; p.Add("maintTypeId", maintTypeId.Value); }
        if (assetClassId.HasValue)
        {
            // Match plan if ANY linked asset in junction table has the requested class
            sql += @" AND EXISTS (
                SELECT 1 FROM ""Planned_Maint_Plan_Asset"" pa
                JOIN ""Asset_Register_Items"" ar ON ar.""AssetRegisterItem_ID"" = pa.""AssetRegisterItemID""
                WHERE pa.""PlanID"" = p.""PlanID"" AND ar.""AssetClass_ID"" = @assetClassId)";
            p.Add("assetClassId", assetClassId.Value);
        }
        if (departmentId.HasValue)
        {
            sql += @" AND EXISTS (
                SELECT 1 FROM ""Planned_Maint_Plan_Asset"" pa
                JOIN ""Asset_Register_Items"" ar ON ar.""AssetRegisterItem_ID"" = pa.""AssetRegisterItemID""
                WHERE pa.""PlanID"" = p.""PlanID""
                  AND NULLIF(ar.""MunicipalDepartment_ID"", '')::integer = @departmentId)";
            p.Add("departmentId", departmentId.Value);
        }
        if (finYear.HasValue)
        {
            var (fyStart, fyEnd) = GetFinancialYearDates(finYear.Value, DateTime.Today);
            sql += @" AND EXISTS (SELECT 1 FROM ""Planned_Maint_Schedule"" s2 WHERE s2.""PlanID"" = p.""PlanID"" AND s2.""ScheduledDate"" BETWEEN @fyStart AND @fyEnd)";
            p.Add("fyStart", fyStart); p.Add("fyEnd", fyEnd);
        }
        sql += @" ORDER BY p.""PlanID"" DESC";
        var items = await conn.QueryAsync<dynamic>(sql, p);
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var plan = await conn.QueryFirstOrDefaultAsync<dynamic>(
            PlanSelect + @" WHERE p.""PlanID"" = @id", new { id });
        if (plan is null) return NotFound(new { error = "Plan not found" });

        var activities = await conn.QueryAsync<dynamic>(@"
            SELECT ""ActivityID""          AS ""activityId"",
                   ""PlanID""              AS ""planId"",
                   ""ActivityName""        AS ""activityName"",
                   ""ActivityDescription"" AS ""activityDescription"",
                   ""EstimatedDuration""   AS ""estimatedDuration"",
                   ""SortOrder""           AS ""sortOrder""
            FROM ""Planned_Maint_Activity""
            WHERE ""PlanID"" = @id
            ORDER BY ""SortOrder"", ""ActivityID""", new { id });

        var schedule = await conn.QueryAsync<dynamic>(@"
            SELECT ""ScheduleID""    AS ""scheduleId"",
                   ""PlanID""        AS ""planId"",
                   ""ScheduledDate"" AS ""scheduledDate"",
                   ""Status""        AS ""status"",
                   ""ActualDate""    AS ""actualDate"",
                   ""ActualCost""    AS ""actualCost"",
                   ""Notes""         AS ""notes"",
                   ""CompletedBy""   AS ""completedBy"",
                   ""CreatedDate""   AS ""createdDate""
            FROM ""Planned_Maint_Schedule""
            WHERE ""PlanID"" = @id
            ORDER BY ""ScheduledDate""
            LIMIT 20", new { id });

        var assets = await conn.QueryAsync<dynamic>(
            PlanAssetSelect + @" WHERE pa.""PlanID"" = @id ORDER BY pa.""SortOrder"", pa.""PlanAssetID""",
            new { id });

        return Ok(new { plan, activities, schedule, assets });
    }

    [HttpGet("by-asset/{assetId:int}")]
    public async Task<IActionResult> GetByAsset(int assetId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        // Match plans where the asset is in the junction table
        var items = await conn.QueryAsync<dynamic>(
            PlanSelect + @"
            WHERE EXISTS (
                SELECT 1 FROM ""Planned_Maint_Plan_Asset"" pa
                WHERE pa.""PlanID"" = p.""PlanID""
                  AND pa.""AssetRegisterItemID"" = @assetId)
            ORDER BY p.""PlanID"" DESC",
            new { assetId });
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] JsonElement body)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        List<int>? assetIds = null;
        if (body.TryGetProperty("assetIds", out var assetIdsEl) && assetIdsEl.ValueKind == JsonValueKind.Array)
        {
            assetIds = new List<int>();
            foreach (var el in assetIdsEl.EnumerateArray())
            {
                if (el.TryGetInt32(out var aid)) assetIds.Add(aid);
            }
        }

        if (assetIds == null || assetIds.Count == 0)
            return BadRequest(new { error = "At least one asset must be linked to the plan." });

        var p = BuildParamsFromJson(body);
        await using var tx = await conn.BeginTransactionAsync();
        int id;
        try
        {
            id = await conn.QuerySingleAsync<int>(@"
                INSERT INTO ""Planned_Maint_Plan"" (
                    ""AssetRegisterItemID"", ""MaintenanceTypeID"", ""FrequencyID"",
                    ""PlanName"", ""Description"", ""EstimatedCost"",
                    ""PlanProjectItemID"", ""IsActive"", ""StartDate"",
                    ""CreatedDate"", ""CreatedBy"")
                VALUES (
                    @assetRegisterItemId, @maintenanceTypeId, @frequencyId,
                    @planName, @description, @estimatedCost,
                    @planProjectItemId, COALESCE(@isActive, TRUE), COALESCE(@startDate, CURRENT_DATE),
                    NOW(), 1)
                RETURNING ""PlanID""", p, tx);

            for (int i = 0; i < assetIds.Count; i++)
            {
                await conn.ExecuteAsync(@"
                    INSERT INTO ""Planned_Maint_Plan_Asset"" (""PlanID"", ""AssetRegisterItemID"", ""SortOrder"")
                    VALUES (@planId, @assetId, @sortOrder)
                    ON CONFLICT (""PlanID"", ""AssetRegisterItemID"") DO NOTHING",
                    new { planId = id, assetId = assetIds[i], sortOrder = i * 10 }, tx);
            }

            await tx.CommitAsync();
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }

        var created = await conn.QueryFirstOrDefaultAsync<dynamic>(
            PlanSelect + @" WHERE p.""PlanID"" = @id", new { id });
        return CreatedAtAction(nameof(GetById), new { id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Dictionary<string, object?> model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var p = BuildParams(model);
        p.Add("id", id);
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Planned_Maint_Plan"" SET
                ""AssetRegisterItemID"" = @assetRegisterItemId,
                ""MaintenanceTypeID""   = @maintenanceTypeId,
                ""FrequencyID""         = @frequencyId,
                ""PlanName""            = @planName,
                ""Description""         = @description,
                ""EstimatedCost""       = @estimatedCost,
                ""PlanProjectItemID""   = @planProjectItemId,
                ""IsActive""            = COALESCE(@isActive, TRUE),
                ""StartDate""           = COALESCE(@startDate, CURRENT_DATE),
                ""ModifiedDate""        = NOW(),
                ""ModifiedBy""          = 1
            WHERE ""PlanID"" = @id", p);
        if (rows == 0) return NotFound(new { error = "Plan not found" });
        var updated = await conn.QueryFirstOrDefaultAsync<dynamic>(
            PlanSelect + @" WHERE p.""PlanID"" = @id", new { id });
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(@"
            UPDATE ""Asset_MaintenanceWorkOrder"" SET ""PlannedScheduleID"" = NULL
            WHERE ""PlannedScheduleID"" IN (
                SELECT ""ScheduleID"" FROM ""Planned_Maint_Schedule"" WHERE ""PlanID"" = @id
            )", new { id });
        await conn.ExecuteAsync(@"DELETE FROM ""Planned_Maint_Schedule"" WHERE ""PlanID"" = @id", new { id });
        await conn.ExecuteAsync(@"DELETE FROM ""Planned_Maint_Activity"" WHERE ""PlanID"" = @id", new { id });
        await conn.ExecuteAsync(@"DELETE FROM ""Planned_Maint_Plan_Asset"" WHERE ""PlanID"" = @id", new { id });
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Planned_Maint_Plan"" WHERE ""PlanID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Plan not found" }) : Ok(new { success = 1 });
    }

    // -----------------------------------------------------------------------
    // Plan-Asset CRUD (junction table)
    // -----------------------------------------------------------------------

    [HttpGet("{id:int}/assets")]
    public async Task<IActionResult> GetPlanAssets(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var assets = await conn.QueryAsync<dynamic>(
            PlanAssetSelect + @" WHERE pa.""PlanID"" = @id ORDER BY pa.""SortOrder"", pa.""PlanAssetID""",
            new { id });
        return Ok(assets);
    }

    [HttpPut("{id:int}/assets")]
    public async Task<IActionResult> SetPlanAssets(int id, [FromBody] List<int>? assetIds)
    {
        if (assetIds == null || assetIds.Count == 0)
            return BadRequest(new { error = "At least one asset is required." });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var planExists = await conn.QueryFirstOrDefaultAsync<int?>(
            @"SELECT 1 FROM ""Planned_Maint_Plan"" WHERE ""PlanID"" = @id", new { id });
        if (planExists == null) return NotFound(new { error = "Plan not found" });

        await using var tx = await conn.BeginTransactionAsync();
        try
        {
            // Delete removed assets
            await conn.ExecuteAsync(@"
                DELETE FROM ""Planned_Maint_Plan_Asset""
                WHERE ""PlanID"" = @id
                  AND ""AssetRegisterItemID"" <> ALL(@ids)",
                new { id, ids = assetIds.ToArray() }, tx);

            // Insert / re-order new ones
            for (int i = 0; i < assetIds.Count; i++)
            {
                await conn.ExecuteAsync(@"
                    INSERT INTO ""Planned_Maint_Plan_Asset"" (""PlanID"", ""AssetRegisterItemID"", ""SortOrder"")
                    VALUES (@planId, @assetId, @sortOrder)
                    ON CONFLICT (""PlanID"", ""AssetRegisterItemID"") DO UPDATE SET ""SortOrder"" = @sortOrder",
                    new { planId = id, assetId = assetIds[i], sortOrder = i * 10 }, tx);
            }

            await tx.CommitAsync();
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }

        var assets = await conn.QueryAsync<dynamic>(
            PlanAssetSelect + @" WHERE pa.""PlanID"" = @id ORDER BY pa.""SortOrder"", pa.""PlanAssetID""",
            new { id });
        return Ok(assets);
    }

    [HttpPost("{id:int}/assets/{assetId:int}")]
    public async Task<IActionResult> AddPlanAsset(int id, int assetId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var planExists = await conn.QueryFirstOrDefaultAsync<int?>(
            @"SELECT 1 FROM ""Planned_Maint_Plan"" WHERE ""PlanID"" = @id", new { id });
        if (planExists == null) return NotFound(new { error = "Plan not found" });
        var maxOrder = await conn.QueryFirstOrDefaultAsync<int?>(@"
            SELECT MAX(""SortOrder"") FROM ""Planned_Maint_Plan_Asset"" WHERE ""PlanID"" = @id",
            new { id });
        await conn.ExecuteAsync(@"
            INSERT INTO ""Planned_Maint_Plan_Asset"" (""PlanID"", ""AssetRegisterItemID"", ""SortOrder"")
            VALUES (@planId, @assetId, @sortOrder)
            ON CONFLICT (""PlanID"", ""AssetRegisterItemID"") DO NOTHING",
            new { planId = id, assetId, sortOrder = (maxOrder ?? 0) + 10 });
        return Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}/assets/{assetId:int}")]
    public async Task<IActionResult> RemovePlanAsset(int id, int assetId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            DELETE FROM ""Planned_Maint_Plan_Asset""
            WHERE ""PlanID"" = @id AND ""AssetRegisterItemID"" = @assetId",
            new { id, assetId });
        return rows == 0 ? NotFound(new { error = "Asset not linked to this plan" }) : Ok(new { success = 1 });
    }

    // -----------------------------------------------------------------------
    // KPI Summary
    // -----------------------------------------------------------------------
    private static (DateTime fyStart, DateTime fyEnd) GetFinancialYearDates(int? finYear, DateTime today)
    {
        int fy = finYear ?? (today.Month >= 7 ? today.Year + 1 : today.Year);
        return (new DateTime(fy - 1, 7, 1), new DateTime(fy, 6, 30));
    }

    [HttpGet("kpi-summary")]
    public async Task<IActionResult> GetKpiSummary(
        [FromQuery] int? maintTypeId, [FromQuery] int? assetClassId,
        [FromQuery] int? departmentId, [FromQuery] int? finYear)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var p = new DynamicParameters();

        var today = DateTime.Today;
        var monthStart = new DateTime(today.Year, today.Month, 1);
        var monthEnd = monthStart.AddMonths(1).AddDays(-1);
        var (fyStart, fyEnd) = GetFinancialYearDates(finYear, today);
        p.Add("today", today);
        p.Add("monthStart", monthStart);
        p.Add("monthEnd", monthEnd);
        p.Add("fyStart", fyStart);
        p.Add("fyEnd", fyEnd);

        var type2Clause = maintTypeId.HasValue  ? @" AND p2.""MaintenanceTypeID"" = @maintTypeId" : "";
        var typeClause  = maintTypeId.HasValue  ? @" AND p.""MaintenanceTypeID""  = @maintTypeId" : "";
        if (maintTypeId.HasValue)  p.Add("maintTypeId", maintTypeId.Value);

        // Asset class / department filtering via junction table EXISTS clauses
        var classClauseP = "";
        var classClause2 = "";
        if (assetClassId.HasValue)
        {
            classClauseP = @" AND EXISTS (SELECT 1 FROM ""Planned_Maint_Plan_Asset"" pa JOIN ""Asset_Register_Items"" ar ON ar.""AssetRegisterItem_ID"" = pa.""AssetRegisterItemID"" WHERE pa.""PlanID"" = p.""PlanID"" AND ar.""AssetClass_ID"" = @assetClassId)";
            classClause2 = @" AND EXISTS (SELECT 1 FROM ""Planned_Maint_Plan_Asset"" pa JOIN ""Asset_Register_Items"" ar ON ar.""AssetRegisterItem_ID"" = pa.""AssetRegisterItemID"" WHERE pa.""PlanID"" = p2.""PlanID"" AND ar.""AssetClass_ID"" = @assetClassId)";
            p.Add("assetClassId", assetClassId.Value);
        }

        var deptClauseP = "";
        var deptClause2 = "";
        if (departmentId.HasValue)
        {
            deptClauseP = @" AND EXISTS (SELECT 1 FROM ""Planned_Maint_Plan_Asset"" pa JOIN ""Asset_Register_Items"" ar ON ar.""AssetRegisterItem_ID"" = pa.""AssetRegisterItemID"" WHERE pa.""PlanID"" = p.""PlanID"" AND NULLIF(ar.""MunicipalDepartment_ID"", '')::integer = @departmentId)";
            deptClause2 = @" AND EXISTS (SELECT 1 FROM ""Planned_Maint_Plan_Asset"" pa JOIN ""Asset_Register_Items"" ar ON ar.""AssetRegisterItem_ID"" = pa.""AssetRegisterItemID"" WHERE pa.""PlanID"" = p2.""PlanID"" AND NULLIF(ar.""MunicipalDepartment_ID"", '')::integer = @departmentId)";
            p.Add("departmentId", departmentId.Value);
        }

        var fyExistsClause = @" AND EXISTS (SELECT 1 FROM ""Planned_Maint_Schedule"" s3
                WHERE s3.""PlanID"" = p.""PlanID"" AND s3.""ScheduledDate"" BETWEEN @fyStart AND @fyEnd)";

        var kpi = await conn.QueryFirstOrDefaultAsync<dynamic>($@"
            SELECT
                COUNT(DISTINCT p.""PlanID"")   AS ""totalPlans"",
                COUNT(DISTINCT p.""PlanID"") FILTER (WHERE p.""IsActive"" = true) AS ""activePlans"",
                COALESCE(SUM(p.""EstimatedCost""), 0) AS ""totalEstimatedCost"",
                (SELECT COUNT(s.""ScheduleID"")
                 FROM ""Planned_Maint_Schedule"" s
                 JOIN ""Planned_Maint_Plan"" p2 ON p2.""PlanID"" = s.""PlanID""
                 WHERE s.""Status"" NOT IN ('Completed','Skipped')
                   AND s.""ScheduledDate"" < @today
                   AND s.""ScheduledDate"" BETWEEN @fyStart AND @fyEnd{type2Clause}{classClause2}{deptClause2}
                ) AS ""overdueEntries"",
                (SELECT COUNT(s.""ScheduleID"")
                 FROM ""Planned_Maint_Schedule"" s
                 JOIN ""Planned_Maint_Plan"" p2 ON p2.""PlanID"" = s.""PlanID""
                 WHERE s.""ScheduledDate"" BETWEEN @monthStart AND @monthEnd{type2Clause}{classClause2}{deptClause2}
                ) AS ""scheduledThisMonth"",
                (SELECT COUNT(s.""ScheduleID"")
                 FROM ""Planned_Maint_Schedule"" s
                 JOIN ""Planned_Maint_Plan"" p2 ON p2.""PlanID"" = s.""PlanID""
                 WHERE s.""Status"" = 'Completed'
                   AND s.""ActualDate"" BETWEEN @monthStart AND @monthEnd{type2Clause}{classClause2}{deptClause2}
                ) AS ""completedThisMonth"",
                (SELECT COALESCE(SUM(COALESCE(s.""ActualCost"", 0)), 0)
                 FROM ""Planned_Maint_Schedule"" s
                 JOIN ""Planned_Maint_Plan"" p2 ON p2.""PlanID"" = s.""PlanID""
                 WHERE s.""Status"" = 'Completed'
                   AND s.""ActualDate"" BETWEEN @fyStart AND @fyEnd{type2Clause}{classClause2}{deptClause2}
                ) AS ""totalActualCost"",
                COUNT(DISTINCT p.""PlanID"") FILTER (WHERE p.""IsActive"" = true
                    AND NOT EXISTS (SELECT 1 FROM ""Planned_Maint_Schedule"" s2
                                   WHERE s2.""PlanID"" = p.""PlanID""
                                     AND s2.""Status"" NOT IN ('Completed','Skipped')
                                     AND s2.""ScheduledDate"" < @today
                                     AND s2.""ScheduledDate"" BETWEEN @fyStart AND @fyEnd)) AS ""compliantPlans""
            FROM ""Planned_Maint_Plan"" p
            WHERE 1=1{fyExistsClause}{typeClause}{classClauseP}{deptClauseP}", p);

        int totalPlans     = (int)(long)(kpi?.totalPlans     ?? 0L);
        int activePlans    = (int)(long)(kpi?.activePlans    ?? 0L);
        int compliantPlans = (int)(long)(kpi?.compliantPlans ?? 0L);
        int overdueEntries = (int)(long)(kpi?.overdueEntries ?? 0L);
        int compliancePct  = activePlans > 0 ? (int)(compliantPlans * 100 / activePlans) : 100;

        decimal totalEstimated     = Math.Round((decimal)(kpi?.totalEstimatedCost ?? 0m), 2);
        decimal totalActual        = Math.Round((decimal)(kpi?.totalActualCost    ?? 0m), 2);
        decimal plannedVsActualPct = totalEstimated > 0 ? Math.Round(totalActual / totalEstimated * 100, 1) : 0m;

        return Ok(new
        {
            totalPlans,
            activePlans,
            overdueEntries,
            scheduledThisMonth  = (int)(long)(kpi?.scheduledThisMonth  ?? 0L),
            completedThisMonth  = (int)(long)(kpi?.completedThisMonth  ?? 0L),
            totalEstimatedCost  = totalEstimated,
            totalActualCost     = totalActual,
            plannedVsActualPct,
            compliancePct,
            finYear             = finYear ?? (today.Month >= 7 ? today.Year + 1 : today.Year)
        });
    }

    // -----------------------------------------------------------------------
    // Compliance report — filters via junction table
    // -----------------------------------------------------------------------
    [HttpGet("compliance")]
    public async Task<IActionResult> GetCompliance(
        [FromQuery] int? maintTypeId, [FromQuery] int? assetClassId,
        [FromQuery] int? departmentId, [FromQuery] int? finYear)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var p = new DynamicParameters();
        var today = DateTime.Today;
        var (fyStart, fyEnd) = GetFinancialYearDates(finYear, today);
        p.Add("today", today);
        p.Add("fyStart", fyStart);
        p.Add("fyEnd", fyEnd);

        var typeFilter   = maintTypeId.HasValue ? @" AND p.""MaintenanceTypeID"" = @maintTypeId" : "";
        var typeFilterP2 = maintTypeId.HasValue ? @" AND p2.""MaintenanceTypeID"" = @maintTypeId" : "";
        if (maintTypeId.HasValue) p.Add("maintTypeId", maintTypeId.Value);

        // Direct asset-level filter for the per-asset first leg
        var assetClassFilter = assetClassId.HasValue
            ? @" AND ar.""AssetClass_ID"" = @assetClassId" : "";
        if (assetClassId.HasValue) p.Add("assetClassId", assetClassId.Value);
        var assetDeptFilter = departmentId.HasValue
            ? @" AND NULLIF(ar.""MunicipalDepartment_ID"", '')::integer = @departmentId" : "";
        if (departmentId.HasValue) p.Add("departmentId", departmentId.Value);

        var rows = await conn.QueryAsync<dynamic>($@"
            -- One row per (asset × plan): hasPlan = true
            SELECT
                ar.""AssetRegisterItem_ID""          AS ""assetId"",
                COALESCE(ar.""MunicipalAssetID"", '') AS ""municipalAssetId"",
                COALESCE(ar.""Description"", '')      AS ""assetDescription"",
                COALESCE(ar.""Barcode"", '')          AS ""assetBarcode"",
                COALESCE(ac.""AssetClassDesc"", '')   AS ""assetClassDesc"",
                p.""PlanID""                          AS ""planId"",
                COALESCE(p.""PlanName"", '')           AS ""planName"",
                COALESCE(mt.""MaintTypeDesc"", '')    AS ""maintenanceTypeDesc"",
                COALESCE(mf.""FrequencyDesc"", '')    AS ""frequencyDesc"",
                p.""IsActive""                        AS ""isActive"",
                true                                  AS ""hasPlan"",
                (SELECT s.""ActualDate""
                 FROM ""Planned_Maint_Schedule"" s
                 WHERE s.""PlanID"" = p.""PlanID"" AND s.""Status"" = 'Completed'
                   AND s.""ActualDate"" BETWEEN @fyStart AND @fyEnd
                 ORDER BY s.""ActualDate"" DESC LIMIT 1) AS ""lastCompletionDate"",
                (SELECT s.""ScheduledDate""
                 FROM ""Planned_Maint_Schedule"" s
                 WHERE s.""PlanID"" = p.""PlanID""
                   AND s.""Status"" IN ('Scheduled','Overdue')
                   AND s.""ScheduledDate"" BETWEEN @fyStart AND @fyEnd
                 ORDER BY s.""ScheduledDate"" ASC LIMIT 1) AS ""nextDueDate"",
                (SELECT COUNT(*)::int FROM ""Planned_Maint_Schedule"" s
                 WHERE s.""PlanID"" = p.""PlanID""
                   AND s.""Status"" NOT IN ('Completed','Skipped')
                   AND s.""ScheduledDate"" < @today
                   AND s.""ScheduledDate"" BETWEEN @fyStart AND @fyEnd) AS ""overdueCount""
            FROM ""Planned_Maint_Plan"" p
            JOIN ""Planned_Maint_Plan_Asset"" pa ON pa.""PlanID"" = p.""PlanID""
            JOIN ""Asset_Register_Items"" ar ON ar.""AssetRegisterItem_ID"" = pa.""AssetRegisterItemID""
            LEFT JOIN ""Const_AssetClass_sys"" ac ON ac.""AssetClass_ID"" = ar.""AssetClass_ID""
            LEFT JOIN ""Const_Maint_Type"" mt ON mt.""MaintTypeID"" = p.""MaintenanceTypeID""
            LEFT JOIN ""Const_Maint_Frequency"" mf ON mf.""FrequencyID"" = p.""FrequencyID""
            WHERE 1=1{typeFilter}{assetClassFilter}{assetDeptFilter}

            UNION ALL

            -- Assets in register that have NO planned maintenance plan at all: hasPlan = false
            SELECT
                ar.""AssetRegisterItem_ID""          AS ""assetId"",
                COALESCE(ar.""MunicipalAssetID"", '') AS ""municipalAssetId"",
                COALESCE(ar.""Description"", '')      AS ""assetDescription"",
                COALESCE(ar.""Barcode"", '')          AS ""assetBarcode"",
                COALESCE(ac.""AssetClassDesc"", '')   AS ""assetClassDesc"",
                NULL::integer                        AS ""planId"",
                ''                                   AS ""planName"",
                ''                                   AS ""maintenanceTypeDesc"",
                ''                                   AS ""frequencyDesc"",
                false                                AS ""isActive"",
                false                                AS ""hasPlan"",
                NULL                                 AS ""lastCompletionDate"",
                NULL                                 AS ""nextDueDate"",
                0                                    AS ""overdueCount""
            FROM ""Asset_Register_Items"" ar
            LEFT JOIN ""Const_AssetClass_sys"" ac ON ac.""AssetClass_ID"" = ar.""AssetClass_ID""
            WHERE NOT EXISTS (
                SELECT 1 FROM ""Planned_Maint_Plan"" p2
                JOIN ""Planned_Maint_Plan_Asset"" pa2 ON pa2.""PlanID"" = p2.""PlanID""
                WHERE pa2.""AssetRegisterItemID"" = ar.""AssetRegisterItem_ID""{typeFilterP2}
            ){assetClassFilter}{assetDeptFilter}

            ORDER BY ""hasPlan"" ASC, ""overdueCount"" DESC, ""assetDescription""", p);

        var result = rows.Select(r =>
        {
            int oc    = r.overdueCount is int oci ? oci : (int)(long)(r.overdueCount ?? 0L);
            bool hp   = (bool)(r.hasPlan ?? false);
            bool act  = (bool)(r.isActive ?? false);
            string rag = !hp ? "red" : !act ? "red" : oc == 0 ? "green" : oc == 1 ? "amber" : "red";
            return new
            {
                assetId             = r.assetId != null ? (int?)(int)(r.assetId) : null,
                municipalAssetId    = (string)(r.municipalAssetId ?? ""),
                assetDescription    = (string)(r.assetDescription ?? ""),
                assetBarcode        = (string)(r.assetBarcode ?? ""),
                assetClassDesc      = (string)(r.assetClassDesc ?? ""),
                planId              = r.planId != null ? (int?)(int)(r.planId) : null,
                planName            = (string)(r.planName ?? ""),
                maintenanceTypeDesc = (string)(r.maintenanceTypeDesc ?? ""),
                frequencyDesc       = (string)(r.frequencyDesc ?? ""),
                isActive            = act,
                hasPlan             = hp,
                lastCompletionDate  = r.lastCompletionDate is DateOnly dlc ? (DateTime?)dlc.ToDateTime(TimeOnly.MinValue)
                                    : r.lastCompletionDate is DateTime dtlc ? (DateTime?)dtlc : null,
                nextDueDate         = r.nextDueDate is DateOnly dnd ? (DateTime?)dnd.ToDateTime(TimeOnly.MinValue)
                                    : r.nextDueDate is DateTime dtnd ? (DateTime?)dtnd : null,
                overdueCount        = oc,
                ragStatus           = rag
            };
        }).ToList();

        return Ok(result);
    }

    // -----------------------------------------------------------------------
    // Deferred maintenance report — filters via junction table
    // -----------------------------------------------------------------------
    [HttpGet("deferred-maintenance")]
    public async Task<IActionResult> GetDeferredMaintenance(
        [FromQuery] int? maintTypeId, [FromQuery] int? assetClassId,
        [FromQuery] int? departmentId, [FromQuery] int? finYear)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var p = new DynamicParameters();
        var today = DateTime.Today;
        var (fyStart, fyEnd) = GetFinancialYearDates(finYear, today);
        p.Add("today", today);
        p.Add("fyStart", fyStart);
        p.Add("fyEnd", fyEnd);

        var typeFilter  = maintTypeId.HasValue  ? @" AND p.""MaintenanceTypeID"" = @maintTypeId"  : "";
        if (maintTypeId.HasValue)  p.Add("maintTypeId",  maintTypeId.Value);

        var classFilter = assetClassId.HasValue
            ? @" AND EXISTS (SELECT 1 FROM ""Planned_Maint_Plan_Asset"" paf JOIN ""Asset_Register_Items"" arf ON arf.""AssetRegisterItem_ID"" = paf.""AssetRegisterItemID"" WHERE paf.""PlanID"" = p.""PlanID"" AND arf.""AssetClass_ID"" = @assetClassId)"
            : "";
        if (assetClassId.HasValue) p.Add("assetClassId", assetClassId.Value);

        var deptFilter = departmentId.HasValue
            ? @" AND EXISTS (SELECT 1 FROM ""Planned_Maint_Plan_Asset"" paf JOIN ""Asset_Register_Items"" arf ON arf.""AssetRegisterItem_ID"" = paf.""AssetRegisterItemID"" WHERE paf.""PlanID"" = p.""PlanID"" AND NULLIF(arf.""MunicipalDepartment_ID"", '')::integer = @departmentId)"
            : "";
        if (departmentId.HasValue) p.Add("departmentId", departmentId.Value);

        var rows = await conn.QueryAsync<dynamic>($@"
            SELECT
                s.""ScheduleID""         AS ""scheduleId"",
                s.""PlanID""             AS ""planId"",
                p.""PlanName""           AS ""planName"",
                COALESCE(NULLIF(COALESCE(ar_leg.""Description"", ''), ''), COALESCE(ar_jct.""Description"", '')) AS ""assetDescription"",
                COALESCE(NULLIF(COALESCE(ar_leg.""Barcode"", ''), ''), COALESCE(ar_jct.""Barcode"", '')) AS ""assetBarcode"",
                COALESCE(NULLIF(COALESCE(ac_leg.""AssetClassDesc"", ''), ''), COALESCE(ac_jct.""AssetClassDesc"", '')) AS ""assetClassDesc"",
                COALESCE(mt.""MaintTypeDesc"", '') AS ""maintenanceTypeDesc"",
                COALESCE(mf.""FrequencyDesc"", '') AS ""frequencyDesc"",
                s.""ScheduledDate""      AS ""scheduledDate"",
                s.""Status""            AS ""status"",
                p.""EstimatedCost""      AS ""estimatedCost"",
                s.""Notes""             AS ""notes"",
                (@today::date - s.""ScheduledDate""::date) AS ""daysOverdue""
            FROM ""Planned_Maint_Schedule"" s
            JOIN ""Planned_Maint_Plan"" p ON p.""PlanID"" = s.""PlanID""
            LEFT JOIN ""Asset_Register_Items"" ar_leg ON ar_leg.""AssetRegisterItem_ID"" = p.""AssetRegisterItemID""
            LEFT JOIN ""Const_AssetClass_sys"" ac_leg ON ac_leg.""AssetClass_ID"" = ar_leg.""AssetClass_ID""
            LEFT JOIN LATERAL (
                SELECT ar2.""Description"", ar2.""Barcode"", ar2.""AssetClass_ID""
                FROM ""Planned_Maint_Plan_Asset"" pa2
                JOIN ""Asset_Register_Items"" ar2 ON ar2.""AssetRegisterItem_ID"" = pa2.""AssetRegisterItemID""
                WHERE pa2.""PlanID"" = p.""PlanID""
                ORDER BY pa2.""SortOrder"", pa2.""PlanAssetID""
                LIMIT 1
            ) ar_jct ON p.""AssetRegisterItemID"" IS NULL
            LEFT JOIN ""Const_AssetClass_sys"" ac_jct ON ac_jct.""AssetClass_ID"" = ar_jct.""AssetClass_ID""
            LEFT JOIN ""Const_Maint_Type"" mt ON mt.""MaintTypeID"" = p.""MaintenanceTypeID""
            LEFT JOIN ""Const_Maint_Frequency"" mf ON mf.""FrequencyID"" = p.""FrequencyID""
            WHERE s.""Status"" NOT IN ('Completed', 'Skipped')
              AND s.""ScheduledDate"" < @today
              AND s.""ScheduledDate"" BETWEEN @fyStart AND @fyEnd{typeFilter}{classFilter}{deptFilter}
            ORDER BY s.""ScheduledDate"" ASC", p);

        var result = rows.Select(r => new
        {
            scheduleId          = (int)(r.scheduleId ?? 0),
            planId              = (int)(r.planId ?? 0),
            planName            = (string)(r.planName ?? ""),
            assetDescription    = (string)(r.assetDescription ?? ""),
            assetBarcode        = (string)(r.assetBarcode ?? ""),
            assetClassDesc      = (string)(r.assetClassDesc ?? ""),
            maintenanceTypeDesc = (string)(r.maintenanceTypeDesc ?? ""),
            frequencyDesc       = (string)(r.frequencyDesc ?? ""),
            scheduledDate       = r.scheduledDate is DateOnly dsd ? dsd.ToDateTime(TimeOnly.MinValue)
                                : r.scheduledDate is DateTime dtsd ? dtsd : (DateTime?)null,
            status              = (string)(r.status ?? ""),
            estimatedCost       = r.estimatedCost is decimal ec ? (decimal?)Math.Round(ec, 2) : null,
            notes               = r.notes is string n ? n : null,
            daysOverdue         = r.daysOverdue is int di ? di : r.daysOverdue is long dl ? (int)dl : 0
        }).ToList();

        return Ok(result);
    }

    // -----------------------------------------------------------------------
    // Budget vs Actual — filters via junction table
    // -----------------------------------------------------------------------
    [HttpGet("budget-vs-actual")]
    public async Task<IActionResult> GetBudgetVsActual(
        [FromQuery] int? maintTypeId, [FromQuery] int? assetClassId,
        [FromQuery] int? departmentId, [FromQuery] int? finYear)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var p = new DynamicParameters();
        var today = DateTime.Today;
        var (fyStart, fyEnd) = GetFinancialYearDates(finYear, today);
        p.Add("fyStart", fyStart);
        p.Add("fyEnd", fyEnd);

        var typeFilter  = maintTypeId.HasValue  ? @" AND p.""MaintenanceTypeID"" = @maintTypeId"  : "";
        if (maintTypeId.HasValue)  p.Add("maintTypeId",  maintTypeId.Value);

        var classFilter = assetClassId.HasValue
            ? @" AND EXISTS (SELECT 1 FROM ""Planned_Maint_Plan_Asset"" paf JOIN ""Asset_Register_Items"" arf ON arf.""AssetRegisterItem_ID"" = paf.""AssetRegisterItemID"" WHERE paf.""PlanID"" = p.""PlanID"" AND arf.""AssetClass_ID"" = @assetClassId)"
            : "";
        if (assetClassId.HasValue) p.Add("assetClassId", assetClassId.Value);

        var deptFilter = departmentId.HasValue
            ? @" AND EXISTS (SELECT 1 FROM ""Planned_Maint_Plan_Asset"" paf JOIN ""Asset_Register_Items"" arf ON arf.""AssetRegisterItem_ID"" = paf.""AssetRegisterItemID"" WHERE paf.""PlanID"" = p.""PlanID"" AND NULLIF(arf.""MunicipalDepartment_ID"", '')::integer = @departmentId)"
            : "";
        if (departmentId.HasValue) p.Add("departmentId", departmentId.Value);

        var rows = await conn.QueryAsync<dynamic>($@"
            SELECT
                p.""PlanID""             AS ""planId"",
                p.""PlanName""           AS ""planName"",
                COALESCE(NULLIF(COALESCE(ar_leg.""Description"", ''), ''), COALESCE(ar_jct.""Description"", '')) AS ""assetDescription"",
                COALESCE(NULLIF(COALESCE(ar_leg.""Barcode"", ''), ''), COALESCE(ar_jct.""Barcode"", '')) AS ""assetBarcode"",
                COALESCE(NULLIF(COALESCE(ac_leg.""AssetClassDesc"", ''), ''), COALESCE(ac_jct.""AssetClassDesc"", '')) AS ""assetClassDesc"",
                COALESCE(mt.""MaintTypeDesc"", '') AS ""maintenanceTypeDesc"",
                COALESCE(p.""EstimatedCost"", 0) AS ""estimatedCost"",
                COALESCE((SELECT SUM(COALESCE(s.""ActualCost"", 0))
                          FROM ""Planned_Maint_Schedule"" s
                          WHERE s.""PlanID"" = p.""PlanID"" AND s.""Status"" = 'Completed'
                            AND s.""ActualDate"" BETWEEN @fyStart AND @fyEnd), 0) AS ""actualCost"",
                (SELECT COUNT(*)::int FROM ""Planned_Maint_Schedule"" s
                 WHERE s.""PlanID"" = p.""PlanID"" AND s.""ScheduledDate"" BETWEEN @fyStart AND @fyEnd) AS ""totalEntries"",
                (SELECT COUNT(*)::int FROM ""Planned_Maint_Schedule"" s
                 WHERE s.""PlanID"" = p.""PlanID"" AND s.""Status"" = 'Completed'
                   AND s.""ActualDate"" BETWEEN @fyStart AND @fyEnd) AS ""completedEntries""
            FROM ""Planned_Maint_Plan"" p
            LEFT JOIN ""Asset_Register_Items"" ar_leg ON ar_leg.""AssetRegisterItem_ID"" = p.""AssetRegisterItemID""
            LEFT JOIN ""Const_AssetClass_sys"" ac_leg ON ac_leg.""AssetClass_ID"" = ar_leg.""AssetClass_ID""
            LEFT JOIN LATERAL (
                SELECT ar2.""Description"", ar2.""Barcode"", ar2.""AssetClass_ID""
                FROM ""Planned_Maint_Plan_Asset"" pa2
                JOIN ""Asset_Register_Items"" ar2 ON ar2.""AssetRegisterItem_ID"" = pa2.""AssetRegisterItemID""
                WHERE pa2.""PlanID"" = p.""PlanID""
                ORDER BY pa2.""SortOrder"", pa2.""PlanAssetID""
                LIMIT 1
            ) ar_jct ON p.""AssetRegisterItemID"" IS NULL
            LEFT JOIN ""Const_AssetClass_sys"" ac_jct ON ac_jct.""AssetClass_ID"" = ar_jct.""AssetClass_ID""
            LEFT JOIN ""Const_Maint_Type"" mt ON mt.""MaintTypeID"" = p.""MaintenanceTypeID""
            WHERE 1=1{typeFilter}{classFilter}{deptFilter}
            ORDER BY mt.""MaintTypeDesc"", p.""PlanName""", p);

        var planRows = rows.Select(r =>
        {
            decimal estimated   = r.estimatedCost is decimal ec ? Math.Round(ec, 2) : 0m;
            decimal actual      = r.actualCost is decimal ac ? Math.Round(ac, 2) : 0m;
            decimal variance    = actual - estimated;
            decimal variancePct = estimated != 0 ? Math.Round(variance / estimated * 100, 1) : 0m;
            return new
            {
                planId              = (int)(r.planId ?? 0),
                planName            = (string)(r.planName ?? ""),
                assetDescription    = (string)(r.assetDescription ?? ""),
                assetBarcode        = (string)(r.assetBarcode ?? ""),
                assetClassDesc      = (string)(r.assetClassDesc ?? ""),
                maintenanceTypeDesc = (string)(r.maintenanceTypeDesc ?? ""),
                estimatedCost       = estimated,
                actualCost          = actual,
                variance,
                variancePct,
                totalEntries        = r.totalEntries is int te ? te : (int)(long)(r.totalEntries ?? 0L),
                completedEntries    = r.completedEntries is int ce ? ce : (int)(long)(r.completedEntries ?? 0L)
            };
        }).ToList();

        var byType = planRows
            .GroupBy(r => r.maintenanceTypeDesc)
            .Select(g => new
            {
                groupKey       = g.Key,
                estimatedCost  = g.Sum(r => r.estimatedCost),
                actualCost     = g.Sum(r => r.actualCost),
                variance       = g.Sum(r => r.variance),
                planCount      = g.Count(),
                completedEntries = g.Sum(r => r.completedEntries),
                totalEntries   = g.Sum(r => r.totalEntries)
            })
            .OrderBy(g => g.groupKey)
            .ToList();

        var byAssetClass = planRows
            .GroupBy(r => string.IsNullOrEmpty(r.assetClassDesc) ? "(No Asset Class)" : r.assetClassDesc)
            .Select(g => new
            {
                groupKey       = g.Key,
                estimatedCost  = g.Sum(r => r.estimatedCost),
                actualCost     = g.Sum(r => r.actualCost),
                variance       = g.Sum(r => r.variance),
                planCount      = g.Count(),
                completedEntries = g.Sum(r => r.completedEntries),
                totalEntries   = g.Sum(r => r.totalEntries)
            })
            .OrderBy(g => g.groupKey)
            .ToList();

        return Ok(new { plans = planRows, byType, byAssetClass });
    }

    private static DynamicParameters BuildParamsFromJson(JsonElement body)
    {
        T? BodyVal<T>(string key)
        {
            if (!body.TryGetProperty(key, out var el)) return default;
            if (el.ValueKind == JsonValueKind.Null || el.ValueKind == JsonValueKind.Undefined) return default;
            try
            {
                var underlying = Nullable.GetUnderlyingType(typeof(T)) ?? typeof(T);
                if (underlying == typeof(string)) return (T)(object)el.GetString()!;
                return (T)Convert.ChangeType(el.ToString(), underlying);
            }
            catch { return default; }
        }
        var p = new DynamicParameters();
        p.Add("assetRegisterItemId", BodyVal<int?>("assetRegisterItemId"));
        p.Add("maintenanceTypeId", BodyVal<int?>("maintenanceTypeId"));
        p.Add("frequencyId", BodyVal<int?>("frequencyId"));
        p.Add("planName", BodyVal<string>("planName"));
        p.Add("description", BodyVal<string>("description"));
        p.Add("estimatedCost", BodyVal<decimal?>("estimatedCost"));
        p.Add("planProjectItemId", BodyVal<int?>("planProjectItemId"));
        p.Add("isActive", BodyVal<bool?>("isActive"));
        p.Add("startDate", BodyVal<DateTime?>("startDate"));
        return p;
    }

    private static DynamicParameters BuildParams(Dictionary<string, object?> m)
    {
        T? Get<T>(string key)
        {
            if (!m.TryGetValue(key, out var v) || v is null) return default;
            var s = v.ToString();
            if (string.IsNullOrWhiteSpace(s)) return default;
            try
            {
                var underlying = Nullable.GetUnderlyingType(typeof(T)) ?? typeof(T);
                return (T)Convert.ChangeType(s, underlying);
            }
            catch { return default; }
        }
        var p = new DynamicParameters();
        p.Add("assetRegisterItemId", Get<int?>("assetRegisterItemId"));
        p.Add("maintenanceTypeId", Get<int?>("maintenanceTypeId"));
        p.Add("frequencyId", Get<int?>("frequencyId"));
        p.Add("planName", Get<string>("planName"));
        p.Add("description", Get<string>("description"));
        p.Add("estimatedCost", Get<decimal?>("estimatedCost"));
        p.Add("planProjectItemId", Get<int?>("planProjectItemId"));
        p.Add("isActive", Get<bool?>("isActive"));
        p.Add("startDate", Get<DateTime?>("startDate"));
        return p;
    }
}

// ---------------------------------------------------------------------------
// Activities CRUD
// ---------------------------------------------------------------------------
[ApiController]
[Route("api/planned-maint-activities")]
public class PlannedMaintActivityController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    public PlannedMaintActivityController(DbConnectionFactory db) => _db = db;

    private const string ActivitySelect = @"
        SELECT ""ActivityID""          AS ""activityId"",
               ""PlanID""              AS ""planId"",
               ""ActivityName""        AS ""activityName"",
               ""ActivityDescription"" AS ""activityDescription"",
               ""EstimatedDuration""   AS ""estimatedDuration"",
               ""SortOrder""           AS ""sortOrder""
        FROM ""Planned_Maint_Activity""";

    [HttpGet("by-plan/{planId:int}")]
    public async Task<IActionResult> GetByPlan(int planId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(
            ActivitySelect + @" WHERE ""PlanID"" = @planId ORDER BY ""SortOrder"", ""ActivityID""",
            new { planId });
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Dictionary<string, object?> model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var p = BuildParams(model);
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Planned_Maint_Activity"" (
                ""PlanID"", ""ActivityName"", ""ActivityDescription"", ""EstimatedDuration"", ""SortOrder"")
            VALUES (@planId, @activityName, @activityDescription, @estimatedDuration, COALESCE(@sortOrder, 0))
            RETURNING ""ActivityID""", p);
        var created = await conn.QueryFirstOrDefaultAsync<dynamic>(
            ActivitySelect + @" WHERE ""ActivityID"" = @id", new { id });
        return CreatedAtAction(nameof(GetByPlan), new { planId = p.Get<int>("planId") }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Dictionary<string, object?> model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var p = BuildParams(model);
        p.Add("id", id);
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Planned_Maint_Activity"" SET
                ""ActivityName""        = @activityName,
                ""ActivityDescription"" = @activityDescription,
                ""EstimatedDuration""   = @estimatedDuration,
                ""SortOrder""           = COALESCE(@sortOrder, 0)
            WHERE ""ActivityID"" = @id", p);
        if (rows == 0) return NotFound(new { error = "Activity not found" });
        var updated = await conn.QueryFirstOrDefaultAsync<dynamic>(
            ActivitySelect + @" WHERE ""ActivityID"" = @id", new { id });
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(
            @"DELETE FROM ""Planned_Maint_Activity"" WHERE ""ActivityID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Activity not found" }) : Ok(new { success = 1 });
    }

    private static DynamicParameters BuildParams(Dictionary<string, object?> m)
    {
        T? Get<T>(string key)
        {
            if (!m.TryGetValue(key, out var v) || v is null) return default;
            var s = v.ToString();
            if (string.IsNullOrWhiteSpace(s)) return default;
            try
            {
                var underlying = Nullable.GetUnderlyingType(typeof(T)) ?? typeof(T);
                return (T)Convert.ChangeType(s, underlying);
            }
            catch { return default; }
        }
        var p = new DynamicParameters();
        p.Add("planId", Get<int?>("planId"));
        p.Add("activityName", Get<string>("activityName"));
        p.Add("activityDescription", Get<string>("activityDescription"));
        p.Add("estimatedDuration", Get<string>("estimatedDuration"));
        p.Add("sortOrder", Get<int?>("sortOrder"));
        return p;
    }
}

// ---------------------------------------------------------------------------
// Schedule endpoints
// ---------------------------------------------------------------------------
[ApiController]
[Route("api/planned-maint-schedule")]
public class PlannedMaintScheduleController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    public PlannedMaintScheduleController(DbConnectionFactory db) => _db = db;

    private const string ScheduleSelect = @"
        SELECT s.""ScheduleID""    AS ""scheduleId"",
               s.""PlanID""        AS ""planId"",
               p.""PlanName""      AS ""planName"",
               p.""AssetRegisterItemID"" AS ""assetRegisterItemId"",
               COALESCE(ar.""Description"", '') AS ""assetDescription"",
               COALESCE(ar.""Barcode"", '')      AS ""assetBarcode"",
               s.""ScheduledDate"" AS ""scheduledDate"",
               s.""Status""        AS ""status"",
               s.""ActualDate""    AS ""actualDate"",
               s.""ActualCost""    AS ""actualCost"",
               s.""Notes""         AS ""notes"",
               s.""CompletedBy""   AS ""completedBy"",
               s.""CreatedDate""   AS ""createdDate"",
               (SELECT COUNT(*)::int FROM ""Asset_MaintenanceWorkOrder"" wo2
                WHERE wo2.""PlannedScheduleID"" = s.""ScheduleID"") AS ""workOrderCount""
        FROM ""Planned_Maint_Schedule"" s
        JOIN ""Planned_Maint_Plan"" p ON p.""PlanID"" = s.""PlanID""
        LEFT JOIN ""Asset_Register_Items"" ar ON ar.""AssetRegisterItem_ID"" = p.""AssetRegisterItemID""";

    [HttpGet("by-plan/{planId:int}")]
    public async Task<IActionResult> GetByPlan(int planId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(
            ScheduleSelect + @" WHERE s.""PlanID"" = @planId ORDER BY s.""ScheduledDate""",
            new { planId });
        return Ok(items);
    }

    [HttpGet("upcoming")]
    public async Task<IActionResult> GetUpcoming(
        [FromQuery] int days = 90,
        [FromQuery] bool includeOverdue = true)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = ScheduleSelect + @"
            WHERE (
                (s.""Status"" = 'Scheduled' AND s.""ScheduledDate"" <= CURRENT_DATE + @days::integer)";
        if (includeOverdue)
            sql += @" OR (s.""Status"" = 'Overdue')";
        sql += @") ORDER BY s.""ScheduledDate""";
        var items = await conn.QueryAsync<dynamic>(sql, new { days });
        return Ok(items);
    }

    [HttpPost("generate/{planId:int}")]
    public async Task<IActionResult> Generate(int planId, [FromQuery] int count = 12)
    {
        if (count < 1 || count > 60) return BadRequest(new { error = "count must be between 1 and 60" });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var plan = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT p.""PlanID""          AS ""planId"",
                   p.""StartDate""       AS ""startDate"",
                   mf.""IntervalDays""   AS ""intervalDays""
            FROM ""Planned_Maint_Plan"" p
            JOIN ""Const_Maint_Frequency"" mf ON mf.""FrequencyID"" = p.""FrequencyID""
            WHERE p.""PlanID"" = @planId", new { planId });

        if (plan is null) return NotFound(new { error = "Plan not found" });

        int intervalDays = Convert.ToInt32(plan.intervalDays);
        if (intervalDays <= 0) return BadRequest(new { error = "Plan frequency has an invalid interval" });

        var lastDate = await conn.QueryFirstOrDefaultAsync<DateTime?>(@"
            SELECT MAX(""ScheduledDate"")::timestamp FROM ""Planned_Maint_Schedule"" WHERE ""PlanID"" = @planId",
            new { planId });

        DateTime planStart;
        var rawStart = plan.startDate;
        if (rawStart is DateTime dtStart) planStart = dtStart;
        else if (rawStart is DateOnly doStart) planStart = doStart.ToDateTime(TimeOnly.MinValue);
        else planStart = DateTime.Today;

        DateTime startDate = lastDate.HasValue
            ? lastDate.Value.AddDays(intervalDays)
            : planStart;

        var generated = new List<object>();
        var current = startDate;
        for (int i = 0; i < count; i++)
        {
            var scheduleId = await conn.QuerySingleAsync<int>(@"
                INSERT INTO ""Planned_Maint_Schedule"" (""PlanID"", ""ScheduledDate"", ""Status"", ""CreatedDate"")
                VALUES (@planId, @scheduledDate, 'Scheduled', NOW())
                RETURNING ""ScheduleID""",
                new { planId, scheduledDate = current.Date });
            generated.Add(new { scheduleId, planId, scheduledDate = current.Date, status = "Scheduled" });
            current = current.AddDays(intervalDays);
        }

        return Ok(generated);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Dictionary<string, object?> model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var p = BuildUpdateParams(model);
        p.Add("id", id);
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Planned_Maint_Schedule"" SET
                ""Status""      = COALESCE(@status, ""Status""),
                ""ActualDate""  = @actualDate,
                ""ActualCost""  = @actualCost,
                ""Notes""       = @notes,
                ""CompletedBy"" = @completedBy
            WHERE ""ScheduleID"" = @id", p);
        if (rows == 0) return NotFound(new { error = "Schedule entry not found" });
        var updated = await conn.QueryFirstOrDefaultAsync<dynamic>(
            ScheduleSelect + @" WHERE s.""ScheduleID"" = @id", new { id });
        return Ok(updated);
    }

    [HttpPost("{id:int}/raise-work-order")]
    public async Task<IActionResult> RaiseWorkOrder(int id, [FromBody] JsonElement? body)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var schedule = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT s.""ScheduleID"", s.""PlanID"", s.""ScheduledDate"", s.""Status"",
                   p.""PlanName"", p.""AssetRegisterItemID"", p.""EstimatedCost""
            FROM ""Planned_Maint_Schedule"" s
            JOIN ""Planned_Maint_Plan"" p ON p.""PlanID"" = s.""PlanID""
            WHERE s.""ScheduleID"" = @id", new { id });

        if (schedule is null) return NotFound(new { error = "Schedule entry not found" });

        T? BodyVal<T>(string key)
        {
            if (!body.HasValue || body.Value.ValueKind != JsonValueKind.Object) return default;
            if (!body.Value.TryGetProperty(key, out var el)) return default;
            if (el.ValueKind == JsonValueKind.Null || el.ValueKind == JsonValueKind.Undefined) return default;
            try
            {
                var underlying = Nullable.GetUnderlyingType(typeof(T)) ?? typeof(T);
                if (underlying == typeof(string)) return (T)(object)el.GetString()!;
                return (T)Convert.ChangeType(el.ToString(), underlying);
            }
            catch { return default; }
        }

        string planName = (string)schedule.planName;
        string desc = BodyVal<string>("workOrderDesc") ?? planName;

        int? bodyAssetId = BodyVal<int?>("assetRegisterItemId");
        int assetId = bodyAssetId ?? (schedule.assetRegisterItemId is int aid ? aid : 0);
        decimal? amount = BodyVal<decimal?>("amount") ?? (schedule.estimatedCost is decimal ec ? ec : null);
        int? maintainerId = BodyVal<int?>("maintainerId");
        int? debitProjectId = BodyVal<int?>("debitProjectId");
        int? debitPlanProjectItemId = BodyVal<int?>("debitPlanProjectItemId");

        DateTime workOrderDate;
        var rawBodyDate = BodyVal<string>("workOrderDate");
        if (!string.IsNullOrEmpty(rawBodyDate) && DateTime.TryParse(rawBodyDate, out var parsedDate))
            workOrderDate = parsedDate;
        else
        {
            var rawSchedDate = schedule.scheduledDate;
            if (rawSchedDate is DateTime dtSched) workOrderDate = dtSched;
            else if (rawSchedDate is DateOnly doSched) workOrderDate = doSched.ToDateTime(TimeOnly.MinValue);
            else workOrderDate = DateTime.Today;
        }

        // WorkOrderTypeID=1 (Planned), WorkOrderStatusID=1 (Open)
        var workOrderId = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_MaintenanceWorkOrder"" (
                ""WorkOrderDesc"", ""AssetRegisterItemID"", ""WorkOrderDate"",
                ""Amount"", ""PlannedScheduleID"",
                ""WorkOrderTypeID"", ""WorkOrderStatusID"",
                ""MaintainerID"", ""DebitProjectId"", ""DebitPlanProjectItemId"")
            VALUES (@desc, @assetId, @workOrderDate, @amount, @scheduleId, 1, 1,
                    @maintainerId, @debitProjectId, @debitPlanProjectItemId)
            RETURNING ""MaintenanceWorksOrderID""",
            new { desc, assetId, workOrderDate, amount, scheduleId = id,
                  maintainerId, debitProjectId, debitPlanProjectItemId });

        return Ok(new { workOrderId, scheduleId = id, message = "Work order created and linked to schedule entry" });
    }

    private static DynamicParameters BuildUpdateParams(Dictionary<string, object?> m)
    {
        T? Get<T>(string key)
        {
            if (!m.TryGetValue(key, out var v) || v is null) return default;
            var s = v.ToString();
            if (string.IsNullOrWhiteSpace(s)) return default;
            try
            {
                var underlying = Nullable.GetUnderlyingType(typeof(T)) ?? typeof(T);
                return (T)Convert.ChangeType(s, underlying);
            }
            catch { return default; }
        }
        var p = new DynamicParameters();
        p.Add("status", Get<string>("status"));
        p.Add("actualDate", Get<DateTime?>("actualDate"));
        p.Add("actualCost", Get<decimal?>("actualCost"));
        p.Add("notes", Get<string>("notes"));
        p.Add("completedBy", Get<int?>("completedBy"));
        return p;
    }
}

public record MaintTypeDto(
    string MaintTypeDesc,
    bool? IsCapex,
    bool? Enabled,
    int? SortOrder
);

public record MaintFrequencyDto(
    string FrequencyDesc,
    int? IntervalDays,
    bool? Enabled,
    int? SortOrder
);
