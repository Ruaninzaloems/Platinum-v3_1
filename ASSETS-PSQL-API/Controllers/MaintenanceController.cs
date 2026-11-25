using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Helpers;
using System.Text.Json;
using ClosedXML.Excel;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/maintenance-requests")]
public class MaintenanceRequestController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public MaintenanceRequestController(DbConnectionFactory db) => _db = db;

    private static string BaseSelect => @"
        SELECT
            r.""RequestID""               AS ""requestId"",
            r.""AssetServiceGroupID""     AS ""assetServiceGroupId"",
            COALESCE(sg.""AssetServiceGroupDesc"", '') AS ""serviceGroupDesc"",
            r.""AssetType_ID""            AS ""assetTypeId"",
            COALESCE(at.""AssetTypeDesc"", '') AS ""assetTypeDesc"",
            r.""AssetCategoryID""         AS ""assetCategoryId"",
            COALESCE(ac.""AssetCategoryDesc"", '') AS ""assetCategoryDesc"",
            r.""Asset_SubCategory_ID""    AS ""assetSubCategoryId"",
            COALESCE(asc2.""Asset_SubCategoryDescription"", '') AS ""assetSubCategoryDesc"",
            r.""RequestDate""            AS ""requestDate"",
            r.""LeadTimeID""             AS ""leadTimeId"",
            COALESCE(lt.""MaintenanceDesc"", '') AS ""leadTimeDesc"",
            COALESCE(lt.""LeadTimeDays"", 0)     AS ""leadTimeDays"",
            r.""ProposedClosingTime""    AS ""proposedClosingTime"",
            r.""MaintenanceDescription"" AS ""maintenanceDescription"",
            r.""PlanProjectItem_ID""     AS ""planProjectItemId"",
            r.""IsApproved""             AS ""isApproved"",
            r.""DateCaptured""           AS ""dateCaptured"",
            r.""CapturerID""             AS ""capturerId"",
            r.""DateModified""           AS ""dateModified"",
            r.""ModifierID""             AS ""modifierId"",
            r.""AssetID""               AS ""assetId"",
            COALESCE(ar.""Description"", '') AS ""assetDescription"",
            ar.""Barcode""              AS ""assetBarcode""
        FROM ""Asset_MaintenanceRequest"" r
        LEFT JOIN ""Const_Asset_ServiceGroup"" sg ON r.""AssetServiceGroupID"" = sg.""AssetServiceGroupID""
        LEFT JOIN ""Const_AssetType_Sys"" at ON r.""AssetType_ID"" = at.""AssetType_ID""
        LEFT JOIN ""Const_AssetCategory_sys"" ac ON r.""AssetCategoryID"" = ac.""AssetCategoryID""
        LEFT JOIN ""Const_Asset_SubCategory"" asc2 ON r.""Asset_SubCategory_ID"" = asc2.""Asset_SubCategory_ID""
        LEFT JOIN ""Const_AssetMaintenanceLeadTime"" lt ON r.""LeadTimeID"" = lt.""LeadTimeID""
        LEFT JOIN ""Asset_Register_Items"" ar ON ar.""AssetRegisterItem_ID"" = r.""AssetID""";

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? serviceGroupId,
        [FromQuery] bool? isApproved,
        [FromQuery] string? dateFrom,
        [FromQuery] string? dateTo)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = BaseSelect + " WHERE 1=1";
        var p = new DynamicParameters();
        if (serviceGroupId.HasValue) { sql += @" AND r.""AssetServiceGroupID"" = @serviceGroupId"; p.Add("serviceGroupId", serviceGroupId.Value); }
        if (isApproved.HasValue) { sql += @" AND r.""IsApproved"" = @isApproved"; p.Add("isApproved", isApproved.Value); }
        if (!string.IsNullOrEmpty(dateFrom)) { sql += @" AND r.""RequestDate"" >= @dateFrom::timestamp"; p.Add("dateFrom", dateFrom); }
        if (!string.IsNullOrEmpty(dateTo)) { sql += @" AND r.""RequestDate"" <= @dateTo::timestamp"; p.Add("dateTo", dateTo); }
        sql += @" ORDER BY r.""RequestID"" DESC";
        var items = await conn.QueryAsync<dynamic>(sql, p);
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(
            BaseSelect + @" WHERE r.""RequestID"" = @id", new { id });
        return item is null ? NotFound(new { error = "Maintenance request not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Dictionary<string, object?> model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var p = BuildParams(model);

        var leadTimeDays = await conn.QueryFirstOrDefaultAsync<int?>(
            @"SELECT ""LeadTimeDays"" FROM ""Const_AssetMaintenanceLeadTime"" WHERE ""LeadTimeID"" = @leadTimeId",
            new { leadTimeId = p.Get<int?>("leadTimeId") });

        var requestDate = p.Get<DateTime?>("requestDate") ?? DateTime.UtcNow;
        var proposedClosing = requestDate.AddDays(leadTimeDays ?? 14);
        p.Add("proposedClosingTime", proposedClosing);
        p.Add("requestDateFinal", requestDate);

        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_MaintenanceRequest"" (
                ""AssetServiceGroupID"", ""AssetType_ID"", ""AssetCategoryID"", ""Asset_SubCategory_ID"",
                ""RequestDate"", ""LeadTimeID"", ""ProposedClosingTime"",
                ""MaintenanceDescription"", ""PlanProjectItem_ID"", ""IsApproved"",
                ""DateCaptured"", ""CapturerID"")
            VALUES (
                @assetServiceGroupId, @assetTypeId, @assetCategoryId, @assetSubCategoryId,
                @requestDateFinal, @leadTimeId, @proposedClosingTime,
                @maintenanceDescription, COALESCE(@planProjectItemId, 0), COALESCE(@isApproved, false),
                NOW(), 1)
            RETURNING ""RequestID""", p);

        var created = await conn.QueryFirstOrDefaultAsync<dynamic>(
            BaseSelect + @" WHERE r.""RequestID"" = @id", new { id });
        return CreatedAtAction(nameof(GetById), new { id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Dictionary<string, object?> model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var p = BuildParams(model);
        p.Add("id", id);

        var leadTimeDays = await conn.QueryFirstOrDefaultAsync<int?>(
            @"SELECT ""LeadTimeDays"" FROM ""Const_AssetMaintenanceLeadTime"" WHERE ""LeadTimeID"" = @leadTimeId",
            new { leadTimeId = p.Get<int?>("leadTimeId") });

        var requestDate = p.Get<DateTime?>("requestDate") ?? DateTime.UtcNow;
        var proposedClosing = requestDate.AddDays(leadTimeDays ?? 14);
        p.Add("proposedClosingTime", proposedClosing);
        p.Add("requestDateFinal", requestDate);
        p.Add("modifierId", this.GetCapturerId());

        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Asset_MaintenanceRequest"" SET
                ""AssetServiceGroupID""     = @assetServiceGroupId,
                ""AssetType_ID""            = @assetTypeId,
                ""AssetCategoryID""         = @assetCategoryId,
                ""Asset_SubCategory_ID""    = @assetSubCategoryId,
                ""RequestDate""            = @requestDateFinal,
                ""LeadTimeID""             = @leadTimeId,
                ""ProposedClosingTime""    = @proposedClosingTime,
                ""MaintenanceDescription"" = @maintenanceDescription,
                ""PlanProjectItem_ID""     = COALESCE(@planProjectItemId, 0),
                ""IsApproved""             = COALESCE(@isApproved, false),
                ""AssetID""               = @assetId,
                ""DateModified""           = NOW(),
                ""ModifierID""             = @modifierId
            WHERE ""RequestID"" = @id", p);
        if (rows == 0) return NotFound(new { error = "Maintenance request not found" });
        var updated = await conn.QueryFirstOrDefaultAsync<dynamic>(
            BaseSelect + @" WHERE r.""RequestID"" = @id", new { id });
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(@"DELETE FROM ""Asset_MaintenanceWorkOrderDetails"" WHERE ""MaintenanceWorksOrderID"" IN (SELECT ""MaintenanceWorksOrderID"" FROM ""Asset_MaintenanceWorkOrder"" WHERE ""RequestID"" = @id)", new { id });
        await conn.ExecuteAsync(@"DELETE FROM ""Asset_MaintenanceWorkOrder"" WHERE ""RequestID"" = @id", new { id });
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Asset_MaintenanceRequest"" WHERE ""RequestID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Maintenance request not found" }) : Ok(new { success = 1 });
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
        p.Add("assetServiceGroupId", Get<int?>("assetServiceGroupId"));
        p.Add("assetTypeId", Get<int?>("assetTypeId"));
        p.Add("assetCategoryId", Get<int?>("assetCategoryId"));
        p.Add("assetSubCategoryId", Get<int?>("assetSubCategoryId"));
        p.Add("requestDate", Get<DateTime?>("requestDate"));
        p.Add("leadTimeId", Get<int?>("leadTimeId"));
        p.Add("maintenanceDescription", Get<string>("maintenanceDescription"));
        p.Add("planProjectItemId", Get<int?>("planProjectItemId"));
        p.Add("isApproved", Get<bool?>("isApproved"));
        p.Add("assetId", Get<int?>("assetId"));
        return p;
    }
}

[ApiController]
[Route("api/maintenance-lead-times")]
public class MaintenanceLeadTimeController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public MaintenanceLeadTimeController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool includeDisabled = false)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = includeDisabled
            ? @"SELECT ""LeadTimeID"" AS ""leadTimeId"",
                       ""MaintenanceDesc"" AS ""maintenanceDesc"",
                       ""LeadTimeDays"" AS ""leadTimeDays"",
                       ""Enabled"" AS ""enabled""
                FROM ""Const_AssetMaintenanceLeadTime""
                ORDER BY ""LeadTimeDays"""
            : @"SELECT ""LeadTimeID"" AS ""leadTimeId"",
                       ""MaintenanceDesc"" AS ""maintenanceDesc"",
                       ""LeadTimeDays"" AS ""leadTimeDays"",
                       ""Enabled"" AS ""enabled""
                FROM ""Const_AssetMaintenanceLeadTime""
                WHERE ""Enabled"" = true
                ORDER BY ""LeadTimeDays""";
        var items = await conn.QueryAsync<dynamic>(sql);
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] JsonElement body)
    {
        var desc = body.GetProperty("maintenanceDesc").GetString();
        var days = body.GetProperty("leadTimeDays").GetInt32();
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var id = await conn.ExecuteScalarAsync<int>(@"
            INSERT INTO ""Const_AssetMaintenanceLeadTime"" (""MaintenanceDesc"", ""LeadTimeDays"", ""Enabled"", ""DateCaptured"", ""CapturerID"")
            VALUES (@desc, @days, true, NOW(), 1)
            RETURNING ""LeadTimeID""", new { desc, days });
        return Ok(new { leadTimeId = id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] JsonElement body)
    {
        var desc = body.GetProperty("maintenanceDesc").GetString();
        var days = body.GetProperty("leadTimeDays").GetInt32();
        var enabled = body.GetProperty("enabled").GetBoolean();
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(@"
            UPDATE ""Const_AssetMaintenanceLeadTime""
            SET ""MaintenanceDesc"" = @desc, ""LeadTimeDays"" = @days, ""Enabled"" = @enabled,
                ""DateModified"" = NOW(), ""ModifierID"" = @modifierId
            WHERE ""LeadTimeID"" = @id", new { desc, days, enabled, id, modifierId = this.GetCapturerId() });
        return Ok();
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.QueryAsync<dynamic>(@"SELECT ""LeadTimeID"", ""MaintenanceDesc"", ""LeadTimeDays"", ""Enabled"" FROM ""Const_AssetMaintenanceLeadTime"" ORDER BY ""LeadTimeDays""");
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Lead Times");
        ws.Cell(1, 1).Value = "ID";
        ws.Cell(1, 2).Value = "Description";
        ws.Cell(1, 3).Value = "Lead Time (Days)";
        ws.Cell(1, 4).Value = "Enabled";
        ws.Row(1).Style.Font.Bold = true;
        int r = 2;
        foreach (var row in rows)
        {
            ws.Cell(r, 1).Value = (int)row.LeadTimeID;
            ws.Cell(r, 2).Value = (string?)row.MaintenanceDesc ?? "";
            ws.Cell(r, 3).Value = (int)row.LeadTimeDays;
            ws.Cell(r, 4).Value = (bool)row.Enabled ? "Yes" : "No";
            r++;
        }
        ws.Columns().AdjustToContents();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "LeadTimes_Export.xlsx");
    }
}

[ApiController]
[Route("api/maintenance-service-groups")]
public class MaintenanceServiceGroupController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public MaintenanceServiceGroupController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool includeDisabled = false)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = includeDisabled
            ? @"SELECT ""AssetServiceGroupID"" AS ""assetServiceGroupId"",
                       ""AssetServiceGroupDesc"" AS ""assetServiceGroupDesc"",
                       ""Enabled"" AS ""enabled""
                FROM ""Const_Asset_ServiceGroup""
                ORDER BY ""AssetServiceGroupDesc"""
            : @"SELECT ""AssetServiceGroupID"" AS ""assetServiceGroupId"",
                       ""AssetServiceGroupDesc"" AS ""assetServiceGroupDesc"",
                       ""Enabled"" AS ""enabled""
                FROM ""Const_Asset_ServiceGroup""
                WHERE ""Enabled"" = true
                ORDER BY ""AssetServiceGroupDesc""";
        var items = await conn.QueryAsync<dynamic>(sql);
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] JsonElement body)
    {
        var desc = body.GetProperty("assetServiceGroupDesc").GetString();
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var id = await conn.ExecuteScalarAsync<int>(@"
            INSERT INTO ""Const_Asset_ServiceGroup"" (""AssetServiceGroupDesc"", ""Enabled"", ""DateCaptured"", ""CapturerID"")
            VALUES (@desc, true, NOW(), 1)
            RETURNING ""AssetServiceGroupID""", new { desc });
        return Ok(new { assetServiceGroupId = id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] JsonElement body)
    {
        var desc = body.GetProperty("assetServiceGroupDesc").GetString();
        var enabled = body.GetProperty("enabled").GetBoolean();
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(@"
            UPDATE ""Const_Asset_ServiceGroup""
            SET ""AssetServiceGroupDesc"" = @desc, ""Enabled"" = @enabled,
                ""DateModified"" = NOW(), ""ModifierID"" = @modifierId
            WHERE ""AssetServiceGroupID"" = @id", new { desc, enabled, id, modifierId = this.GetCapturerId() });
        return Ok();
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.QueryAsync<dynamic>(@"SELECT ""AssetServiceGroupID"", ""AssetServiceGroupDesc"", ""Enabled"" FROM ""Const_Asset_ServiceGroup"" ORDER BY ""AssetServiceGroupDesc""");
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Service Groups");
        ws.Cell(1, 1).Value = "ID";
        ws.Cell(1, 2).Value = "Service Group Description";
        ws.Cell(1, 3).Value = "Enabled";
        ws.Row(1).Style.Font.Bold = true;
        int r = 2;
        foreach (var row in rows)
        {
            ws.Cell(r, 1).Value = (int)row.AssetServiceGroupID;
            ws.Cell(r, 2).Value = (string?)row.AssetServiceGroupDesc ?? "";
            ws.Cell(r, 3).Value = (bool)row.Enabled ? "Yes" : "No";
            r++;
        }
        ws.Columns().AdjustToContents();
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "ServiceGroups_Export.xlsx");
    }
}

[ApiController]
[Route("api/maintenance-work-orders")]
public class MaintenanceWorkOrderController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public MaintenanceWorkOrderController(DbConnectionFactory db) => _db = db;

    private const string WorkOrderSelect = @"
            SELECT wo.""MaintenanceWorksOrderID""  AS ""maintenanceWorksOrderId"",
                   wo.""RequestID""               AS ""requestId"",
                   wo.""WorkOrderDesc""            AS ""workOrderDesc"",
                   wo.""AssetRegisterItemID""      AS ""assetRegisterItemId"",
                   wo.""WorkOrderDate""            AS ""workOrderDate"",
                   wo.""RequisitionNumber""        AS ""requisitionNumber"",
                   wo.""Amount""                   AS ""amount"",
                   wo.""DebitProjectId""           AS ""debitProjectId"",
                   wo.""DebitPlanProjectItemId""   AS ""debitPlanProjectItemId"",
                   wo.""CreditProjectId""          AS ""creditProjectId"",
                   wo.""CreditPlanProjectItemId""  AS ""creditPlanProjectItemId"",
                   wo.""MaintainerID""             AS ""maintainerId"",
                   wo.""WorkOrderTypeID""          AS ""workOrderTypeId"",
                   wo.""WorkOrderStatusID""        AS ""workOrderStatusId"",
                   wo.""WorkOrderNumber""          AS ""workOrderNumber"",
                   wo.""Priority""                AS ""priority"",
                   wo.""PlannedStartDate""         AS ""plannedStartDate"",
                   wo.""PlannedEndDate""           AS ""plannedEndDate"",
                   wo.""ActualStartDate""          AS ""actualStartDate"",
                   wo.""ActualEndDate""            AS ""actualEndDate"",
                   wo.""RiskLevel""               AS ""riskLevel"",
                   wo.""SafetyRequirements""       AS ""safetyRequirements"",
                   wo.""EnvironmentalImpact""      AS ""environmentalImpact"",
                   wo.""CompletionNotes""          AS ""completionNotes"",
                   wo.""RootCause""               AS ""rootCause"",
                   wo.""Recommendations""          AS ""recommendations"",
                   wo.""FollowUpRequired""         AS ""followUpRequired"",
                   wo.""RequestedById""            AS ""requestedById"",
                   wo.""CompletedById""            AS ""completedById"",
                   wo.""FundingSegment""           AS ""fundingSegment"",
                   wo.""CostCentre""              AS ""costCentre"",
                   wo.""CancelledReason""          AS ""cancelledReason"",
                   wo.""ActualCost""              AS ""actualCost"",
                   ws.""WorkOrderStatusDesc""      AS ""workOrderStatusDesc"",
                   wt.""WorkOrderTypeDesc""        AS ""workOrderTypeDesc"",
                   NULL::TEXT AS ""debitProjectName"",
                   NULL::TEXT AS ""debitScoaDesc"",
                   NULL::TEXT AS ""creditProjectName"",
                   NULL::TEXT AS ""creditScoaDesc"",
                   COALESCE(ar.""Description"", '') AS ""assetDescription"",
                   ar.""Barcode""                  AS ""assetBarcode"",
                   wo.""PlannedScheduleID""         AS ""plannedScheduleId"",
                   (SELECT s.""ScheduledDate""::text FROM ""Planned_Maint_Schedule"" s
                    WHERE s.""ScheduleID"" = wo.""PlannedScheduleID"") AS ""scheduledDate"",
                   (SELECT s.""PlanID"" FROM ""Planned_Maint_Schedule"" s
                    WHERE s.""ScheduleID"" = wo.""PlannedScheduleID"") AS ""linkedPlanId""
            FROM ""Asset_MaintenanceWorkOrder"" wo
            LEFT JOIN ""Const_WorkOrderStatus"" ws ON ws.""WorkOrderStatusID"" = wo.""WorkOrderStatusID""
            LEFT JOIN ""Const_WorkOrderType"" wt ON wt.""WorkOrderTypeID"" = wo.""WorkOrderTypeID""
            LEFT JOIN ""Asset_Register_Items"" ar ON ar.""AssetRegisterItem_ID"" = wo.""AssetRegisterItemID""";

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? statusId,
        [FromQuery] int? typeId,
        [FromQuery] string? priority,
        [FromQuery] int? requestId,
        [FromQuery] int? planId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = WorkOrderSelect + " WHERE 1=1";
        var p = new DynamicParameters();
        if (statusId.HasValue) { sql += @" AND wo.""WorkOrderStatusID"" = @statusId"; p.Add("statusId", statusId.Value); }
        if (typeId.HasValue) { sql += @" AND wo.""WorkOrderTypeID"" = @typeId"; p.Add("typeId", typeId.Value); }
        if (!string.IsNullOrEmpty(priority)) { sql += @" AND wo.""Priority"" = @priority"; p.Add("priority", priority); }
        if (requestId.HasValue) { sql += @" AND wo.""RequestID"" = @requestId"; p.Add("requestId", requestId.Value); }
        if (planId.HasValue)
        {
            sql += @" AND EXISTS (SELECT 1 FROM ""Planned_Maint_Schedule"" s WHERE s.""ScheduleID"" = wo.""PlannedScheduleID"" AND s.""PlanID"" = @planId)";
            p.Add("planId", planId.Value);
        }
        sql += @" ORDER BY wo.""MaintenanceWorksOrderID"" DESC";
        var items = await conn.QueryAsync<dynamic>(sql, p);
        return Ok(items);
    }

    [HttpGet("by-request/{requestId:int}")]
    public async Task<IActionResult> GetByRequest(int requestId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(
            WorkOrderSelect + @" WHERE wo.""RequestID"" = @requestId ORDER BY wo.""MaintenanceWorksOrderID"" DESC",
            new { requestId });
        return Ok(items);
    }

    [HttpGet("by-plan/{planId:int}")]
    public async Task<IActionResult> GetByPlan(int planId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(
            WorkOrderSelect + @"
            JOIN ""Planned_Maint_Schedule"" s ON s.""ScheduleID"" = wo.""PlannedScheduleID""
            WHERE s.""PlanID"" = @planId
            ORDER BY wo.""MaintenanceWorksOrderID"" DESC",
            new { planId });
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(
            WorkOrderSelect + @" WHERE wo.""MaintenanceWorksOrderID"" = @id",
            new { id });
        return item is null ? NotFound(new { error = "Work order not found" }) : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Dictionary<string, object?> model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var p = BuildParams(model);
        var now = DateTime.UtcNow;
        var priority = p.Get<string?>("priority");
        if (string.IsNullOrWhiteSpace(priority))
            return BadRequest(new { error = "Priority is required." });
        string[] validPriorities = { "Low", "Medium", "High", "Critical" };
        if (!validPriorities.Contains(priority, StringComparer.OrdinalIgnoreCase))
            return BadRequest(new { error = $"Priority must be one of: {string.Join(", ", validPriorities)}." });
        var woTypeId = p.Get<int?>("workOrderTypeId");
        if (woTypeId is null || woTypeId < 1 || woTypeId > 5)
            return BadRequest(new { error = "WorkOrderTypeID must be between 1 and 5." });
        await using var tx = await conn.BeginTransactionAsync();
        var woNum = await GenerateWorkOrderNumber(conn, now);
        p.Add("workOrderNumber", woNum);
        p.Add("workOrderStatusId", 1);
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_MaintenanceWorkOrder"" (
                ""RequestID"", ""WorkOrderDesc"", ""AssetRegisterItemID"", ""WorkOrderDate"",
                ""RequisitionNumber"", ""Amount"", ""DebitProjectId"", ""DebitPlanProjectItemId"",
                ""CreditProjectId"", ""CreditPlanProjectItemId"", ""MaintainerID"",
                ""WorkOrderTypeID"", ""WorkOrderStatusID"", ""WorkOrderNumber"",
                ""Priority"", ""PlannedStartDate"", ""PlannedEndDate"",
                ""ActualStartDate"", ""ActualEndDate"",
                ""RiskLevel"", ""SafetyRequirements"", ""EnvironmentalImpact"",
                ""CompletionNotes"", ""RootCause"", ""Recommendations"",
                ""FollowUpRequired"", ""RequestedById"", ""CompletedById"",
                ""FundingSegment"", ""CostCentre"", ""CancelledReason"", ""ActualCost"")
            VALUES (
                @requestId, @workOrderDesc, COALESCE(@assetRegisterItemId, 0), COALESCE(@workOrderDate, NOW()),
                @requisitionNumber, @amount, @debitProjectId, @debitPlanProjectItemId,
                @creditProjectId, @creditPlanProjectItemId, @maintainerId,
                @workOrderTypeId, @workOrderStatusId, @workOrderNumber,
                @priority, @plannedStartDate, @plannedEndDate,
                @actualStartDate, @actualEndDate,
                @riskLevel, @safetyRequirements, @environmentalImpact,
                @completionNotes, @rootCause, @recommendations,
                COALESCE(@followUpRequired, false), @requestedById, @completedById,
                @fundingSegment, @costCentre, @cancelledReason, @actualCost)
            RETURNING ""MaintenanceWorksOrderID""", p);
        await AddAudit(conn, id, "Created", null, null, "Draft", 1);
        await tx.CommitAsync();
        var created = await conn.QueryFirstOrDefaultAsync<dynamic>(
            WorkOrderSelect + @" WHERE wo.""MaintenanceWorksOrderID"" = @id", new { id });
        return CreatedAtAction(nameof(GetById), new { id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Dictionary<string, object?> model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var before = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""WorkOrderDesc"" AS ""d"", ""Priority"" AS ""pr"", ""AssetRegisterItemID"" AS ""ar"",
                   ""WorkOrderTypeID"" AS ""wt"", ""RiskLevel"" AS ""rl"", ""PlannedStartDate"" AS ""ps"",
                   ""PlannedEndDate"" AS ""pe"", ""FundingSegment"" AS ""fs"", ""CostCentre"" AS ""cc"",
                   ""SafetyRequirements"" AS ""sr"", ""EnvironmentalImpact"" AS ""ei"",
                   ""ActualStartDate"" AS ""actualS"", ""ActualEndDate"" AS ""ae"",
                   ""CompletionNotes"" AS ""cn"", ""RootCause"" AS ""rc"", ""Recommendations"" AS ""recom"",
                   ""FollowUpRequired"" AS ""fu"", ""RequestedById"" AS ""reqB"", ""CompletedById"" AS ""cb"",
                   ""MaintainerID"" AS ""maint"",
                   ""CancelledReason"" AS ""cancelR"", ""ActualCost"" AS ""ac""
            FROM ""Asset_MaintenanceWorkOrder"" WHERE ""MaintenanceWorksOrderID"" = @id", new { id });
        if (before is null) return NotFound(new { error = "Work order not found" });
        var p = BuildParams(model);
        p.Add("id", id);
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Asset_MaintenanceWorkOrder"" SET
                ""WorkOrderDesc""           = @workOrderDesc,
                ""AssetRegisterItemID""     = COALESCE(@assetRegisterItemId, 0),
                ""WorkOrderDate""           = COALESCE(@workOrderDate, NOW()),
                ""RequisitionNumber""       = @requisitionNumber,
                ""Amount""                  = @amount,
                ""DebitProjectId""          = @debitProjectId,
                ""DebitPlanProjectItemId""  = @debitPlanProjectItemId,
                ""CreditProjectId""         = @creditProjectId,
                ""CreditPlanProjectItemId"" = @creditPlanProjectItemId,
                ""MaintainerID""            = @maintainerId,
                ""WorkOrderTypeID""         = @workOrderTypeId,
                ""Priority""               = @priority,
                ""PlannedStartDate""        = @plannedStartDate,
                ""PlannedEndDate""          = @plannedEndDate,
                ""ActualStartDate""         = @actualStartDate,
                ""ActualEndDate""           = @actualEndDate,
                ""RiskLevel""              = @riskLevel,
                ""SafetyRequirements""      = @safetyRequirements,
                ""EnvironmentalImpact""     = @environmentalImpact,
                ""CompletionNotes""         = @completionNotes,
                ""RootCause""              = @rootCause,
                ""Recommendations""         = @recommendations,
                ""FollowUpRequired""        = COALESCE(@followUpRequired, ""FollowUpRequired""),
                ""RequestedById""           = @requestedById,
                ""CompletedById""           = @completedById,
                ""FundingSegment""          = @fundingSegment,
                ""CostCentre""             = @costCentre,
                ""CancelledReason""         = @cancelledReason,
                ""ActualCost""             = @actualCost
            WHERE ""MaintenanceWorksOrderID"" = @id", p);
        if (rows == 0) return NotFound(new { error = "Work order not found" });
        var fieldMap = new Dictionary<string, (object? OldVal, string NewKey)>
        {
            ["WorkOrderDesc"]       = (before.d,     "workOrderDesc"),
            ["Priority"]            = (before.pr,    "priority"),
            ["WorkOrderTypeID"]     = (before.wt,    "workOrderTypeId"),
            ["RiskLevel"]           = (before.rl,    "riskLevel"),
            ["PlannedStartDate"]    = (before.ps,    "plannedStartDate"),
            ["PlannedEndDate"]      = (before.pe,    "plannedEndDate"),
            ["ActualStartDate"]     = (before.actualS, "actualStartDate"),
            ["ActualEndDate"]       = (before.ae,      "actualEndDate"),
            ["FundingSegment"]      = (before.fs,    "fundingSegment"),
            ["CostCentre"]          = (before.cc,    "costCentre"),
            ["SafetyRequirements"]  = (before.sr,    "safetyRequirements"),
            ["EnvironmentalImpact"] = (before.ei,    "environmentalImpact"),
            ["CompletionNotes"]     = (before.cn,    "completionNotes"),
            ["RootCause"]           = (before.rc,    "rootCause"),
            ["Recommendations"]     = (before.recom, "recommendations"),
            ["AssetRegisterItemID"]  = (before.ar,    "assetRegisterItemId"),
            ["MaintainerID"]        = (before.maint, "maintainerId"),
            ["FollowUpRequired"]    = (before.fu,    "followUpRequired"),
            ["RequestedById"]       = (before.reqB,  "requestedById"),
            ["CompletedById"]       = (before.cb,    "completedById"),
            ["CancelledReason"]     = (before.cancelR, "cancelledReason"),
            ["ActualCost"]          = (before.ac,    "actualCost"),
        };
        foreach (var (field, (oldVal, newKey)) in fieldMap)
        {
            if (!model.TryGetValue(newKey, out var newValRaw)) continue;
            var oldStr = oldVal?.ToString() ?? "";
            var newStr = newValRaw?.ToString() ?? "";
            if (oldStr != newStr)
                await AddAudit(conn, id, "Modified", field, oldStr, newStr, 1);
        }
        return Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        return StatusCode(405, new { error = "Work orders cannot be deleted. Use the cancel endpoint to cancel a work order." });
    }

    // ─── Lifecycle Endpoints ──────────────────────────────────────────────────

    [HttpPost("{id:int}/submit")]
    public async Task<IActionResult> Submit(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var wo = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT ""WorkOrderStatusID"" AS ""s"", ""WorkOrderDesc"" AS ""d"", ""AssetRegisterItemID"" AS ""a"" FROM ""Asset_MaintenanceWorkOrder"" WHERE ""MaintenanceWorksOrderID"" = @id", new { id });
        if (wo is null) return NotFound(new { error = "Work order not found" });
        int statusId = (int)(wo.s ?? 0);
        if (statusId != 1) return BadRequest(new { error = "Only Draft work orders can be submitted." });
        string desc = (string?)wo.d ?? "";
        if (string.IsNullOrWhiteSpace(desc)) return BadRequest(new { error = "Work order description is required before submitting." });
        int assetId = (int)(wo.a ?? 0);
        if (assetId <= 0) return BadRequest(new { error = "A linked asset is required before submitting. Please select an asset." });
        await using var txS = await conn.BeginTransactionAsync();
        await conn.ExecuteAsync(@"UPDATE ""Asset_MaintenanceWorkOrder"" SET ""WorkOrderStatusID"" = 2 WHERE ""MaintenanceWorksOrderID"" = @id", new { id });
        await AddAudit(conn, id, "StatusChanged", "WorkOrderStatusID", "Draft", "Submitted", 1);
        await txS.CommitAsync();
        return Ok(new { success = 1, status = "Submitted" });
    }

    [HttpPost("{id:int}/approve")]
    public async Task<IActionResult> Approve(int id, [FromBody] JsonElement body)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var wo = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT ""WorkOrderStatusID"" AS ""s"" FROM ""Asset_MaintenanceWorkOrder"" WHERE ""MaintenanceWorksOrderID"" = @id", new { id });
        if (wo is null) return NotFound(new { error = "Work order not found" });
        int statusId = (int)(wo.s ?? 0);
        if (statusId != 2) return BadRequest(new { error = "Only Submitted work orders can be approved." });
        int approvalLevel = body.TryGetProperty("approvalLevel", out var al) ? al.GetInt32() : 1;
        if (approvalLevel < 1 || approvalLevel > 3)
            return BadRequest(new { error = "ApprovalLevel must be between 1 and 3." });
        string comments = body.TryGetProperty("comments", out var c) ? (c.GetString() ?? "") : "";
        await using var txA = await conn.BeginTransactionAsync();
        await conn.ExecuteAsync(@"
            INSERT INTO ""Asset_MaintenanceWorkOrderApproval""
                (""MaintenanceWorksOrderID"", ""ApprovalLevel"", ""ApprovedById"", ""ApprovalStatus"", ""ApprovalDate"", ""Comments"")
            VALUES (@id, @approvalLevel, 1, 'Approved', NOW(), @comments)", new { id, approvalLevel, comments });
        await conn.ExecuteAsync(@"UPDATE ""Asset_MaintenanceWorkOrder"" SET ""WorkOrderStatusID"" = 3 WHERE ""MaintenanceWorksOrderID"" = @id", new { id });
        await AddAudit(conn, id, "Approved", "WorkOrderStatusID", "Submitted", "Approved", 1);
        await txA.CommitAsync();
        return Ok(new { success = 1, status = "Approved" });
    }

    [HttpPost("{id:int}/reject")]
    public async Task<IActionResult> Reject(int id, [FromBody] JsonElement body)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var wo = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT ""WorkOrderStatusID"" AS ""s"" FROM ""Asset_MaintenanceWorkOrder"" WHERE ""MaintenanceWorksOrderID"" = @id", new { id });
        if (wo is null) return NotFound(new { error = "Work order not found" });
        int statusId = (int)(wo.s ?? 0);
        if (statusId != 2) return BadRequest(new { error = "Only Submitted work orders can be rejected." });
        string comments = body.TryGetProperty("comments", out var c) ? (c.GetString() ?? "") : "";
        await using var txR = await conn.BeginTransactionAsync();
        await conn.ExecuteAsync(@"
            INSERT INTO ""Asset_MaintenanceWorkOrderApproval""
                (""MaintenanceWorksOrderID"", ""ApprovalLevel"", ""ApprovedById"", ""ApprovalStatus"", ""ApprovalDate"", ""Comments"")
            VALUES (@id, 1, 1, 'Rejected', NOW(), @comments)", new { id, comments });
        await conn.ExecuteAsync(@"UPDATE ""Asset_MaintenanceWorkOrder"" SET ""WorkOrderStatusID"" = 1 WHERE ""MaintenanceWorksOrderID"" = @id", new { id });
        await AddAudit(conn, id, "StatusChanged", "WorkOrderStatusID", "Submitted", "Draft (Rejected)", 1);
        await txR.CommitAsync();
        return Ok(new { success = 1, status = "Draft" });
    }

    [HttpPost("{id:int}/start")]
    public async Task<IActionResult> Start(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var wo = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT ""WorkOrderStatusID"" AS ""s"" FROM ""Asset_MaintenanceWorkOrder"" WHERE ""MaintenanceWorksOrderID"" = @id", new { id });
        if (wo is null) return NotFound(new { error = "Work order not found" });
        int statusId = (int)(wo.s ?? 0);
        if (statusId != 3 && statusId != 4) return BadRequest(new { error = "Only Approved or Scheduled work orders can be started." });
        await using var txSt = await conn.BeginTransactionAsync();
        await conn.ExecuteAsync(@"UPDATE ""Asset_MaintenanceWorkOrder"" SET ""WorkOrderStatusID"" = 5, ""ActualStartDate"" = NOW() WHERE ""MaintenanceWorksOrderID"" = @id", new { id });
        await AddAudit(conn, id, "StatusChanged", "WorkOrderStatusID", statusId == 4 ? "Scheduled" : "Approved", "In Progress", 1);
        await txSt.CommitAsync();
        return Ok(new { success = 1, status = "In Progress" });
    }

    [HttpPost("{id:int}/complete")]
    public async Task<IActionResult> Complete(int id, [FromBody] JsonElement body)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var wo = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT ""WorkOrderStatusID"" AS ""s"" FROM ""Asset_MaintenanceWorkOrder"" WHERE ""MaintenanceWorksOrderID"" = @id", new { id });
        if (wo is null) return NotFound(new { error = "Work order not found" });
        int statusId = (int)(wo.s ?? 0);
        if (statusId != 5) return BadRequest(new { error = "Only In Progress work orders can be completed." });
        string completionNotes = body.TryGetProperty("completionNotes", out var cn) ? (cn.GetString() ?? "") : "";
        if (string.IsNullOrWhiteSpace(completionNotes)) return BadRequest(new { error = "Completion notes are required." });
        decimal? actualCost = body.TryGetProperty("actualCost", out var ac) && ac.ValueKind != JsonValueKind.Null ? (decimal?)ac.GetDecimal() : null;
        string rootCause = body.TryGetProperty("rootCause", out var rc) ? (rc.GetString() ?? "") : "";
        string recommendations = body.TryGetProperty("recommendations", out var rec) ? (rec.GetString() ?? "") : "";
        bool followUp = body.TryGetProperty("followUpRequired", out var fu) && fu.GetBoolean();
        int completedById = body.TryGetProperty("completedById", out var cb) ? cb.GetInt32() : 1;
        DateTime? completionDate = null;
        if (body.TryGetProperty("completionDate", out var cd) && cd.ValueKind != JsonValueKind.Null)
            completionDate = cd.TryGetDateTime(out var cdVal) ? cdVal : null;
        await using var txC = await conn.BeginTransactionAsync();
        await conn.ExecuteAsync(@"
            UPDATE ""Asset_MaintenanceWorkOrder"" SET
                ""WorkOrderStatusID"" = 6,
                ""ActualEndDate""    = COALESCE(@completionDate, NOW()),
                ""CompletionNotes""  = @completionNotes,
                ""ActualCost""       = @actualCost,
                ""RootCause""        = @rootCause,
                ""Recommendations""  = @recommendations,
                ""FollowUpRequired"" = @followUp,
                ""CompletedById""    = @completedById
            WHERE ""MaintenanceWorksOrderID"" = @id",
            new { id, completionDate, completionNotes, actualCost, rootCause, recommendations, followUp, completedById });
        await AddAudit(conn, id, "Completed", "WorkOrderStatusID", "In Progress", "Completed", completedById);
        await txC.CommitAsync();
        return Ok(new { success = 1, status = "Completed" });
    }

    [HttpPost("{id:int}/close")]
    public async Task<IActionResult> Close(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var wo = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""WorkOrderStatusID"" AS ""s"",
                   ""PlannedScheduleID"" AS ""schedId"",
                   ""ActualCost""        AS ""actualCost"",
                   ""ActualEndDate""     AS ""actualEndDate""
            FROM ""Asset_MaintenanceWorkOrder"" WHERE ""MaintenanceWorksOrderID"" = @id", new { id });
        if (wo is null) return NotFound(new { error = "Work order not found" });
        int statusId = (int)(wo.s ?? 0);
        if (statusId != 6) return BadRequest(new { error = "Only Completed work orders can be closed." });
        await using var txCl = await conn.BeginTransactionAsync();
        await conn.ExecuteAsync(@"UPDATE ""Asset_MaintenanceWorkOrder"" SET ""WorkOrderStatusID"" = 7 WHERE ""MaintenanceWorksOrderID"" = @id", new { id });
        await AddAudit(conn, id, "StatusChanged", "WorkOrderStatusID", "Completed", "Closed", 1);

        // Roll actual cost up to linked planned maintenance schedule entry
        int? schedId = wo.schedId is int sid ? sid : (wo.schedId is long lsid ? (int)lsid : (int?)null);
        if (schedId.HasValue && schedId.Value > 0)
        {
            decimal? actualCost = wo.actualCost is decimal ac ? ac : null;
            DateTime actualDate = wo.actualEndDate is DateTime aed ? aed : DateTime.Today;
            await conn.ExecuteAsync(@"
                UPDATE ""Planned_Maint_Schedule"" SET
                    ""Status""     = 'Completed',
                    ""ActualCost"" = COALESCE(@actualCost, ""ActualCost""),
                    ""ActualDate"" = COALESCE(@actualDate, NOW())
                WHERE ""ScheduleID"" = @schedId",
                new { schedId = schedId.Value, actualCost, actualDate });
        }

        await txCl.CommitAsync();
        return Ok(new { success = 1, status = "Closed" });
    }

    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id, [FromBody] JsonElement body)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var wo = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT ""WorkOrderStatusID"" AS ""s"", ""WorkOrderStatusID"" AS ""statusId"" FROM ""Asset_MaintenanceWorkOrder"" WHERE ""MaintenanceWorksOrderID"" = @id", new { id });
        if (wo is null) return NotFound(new { error = "Work order not found" });
        int statusId = (int)(wo.s ?? 0);
        if (statusId == 8) return BadRequest(new { error = "Work order is already cancelled." });
        string[] statusNames = { "", "Draft", "Submitted", "Approved", "Scheduled", "In Progress", "Completed", "Closed", "Cancelled" };
        string priorStatusName = statusId >= 1 && statusId < statusNames.Length ? statusNames[statusId] : statusId.ToString();
        string reason = body.TryGetProperty("cancelledReason", out var cr) ? (cr.GetString() ?? "") : "";
        if (string.IsNullOrWhiteSpace(reason))
            return BadRequest(new { error = "A cancellation reason is required." });
        await using var txCan = await conn.BeginTransactionAsync();
        await conn.ExecuteAsync(@"
            UPDATE ""Asset_MaintenanceWorkOrder"" SET ""WorkOrderStatusID"" = 8, ""CancelledReason"" = @reason
            WHERE ""MaintenanceWorksOrderID"" = @id", new { id, reason });
        await AddAudit(conn, id, "Cancelled", "WorkOrderStatusID", priorStatusName, "Cancelled", 1);
        await txCan.CommitAsync();
        return Ok(new { success = 1, status = "Cancelled" });
    }

    // ─── Assignments Sub-resource ─────────────────────────────────────────────

    [HttpGet("{id:int}/assignments")]
    public async Task<IActionResult> GetAssignments(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"
            SELECT ""AssignmentId""           AS ""assignmentId"",
                   ""MaintenanceWorksOrderID"" AS ""maintenanceWorksOrderId"",
                   ""EmployeeId""             AS ""employeeId"",
                   ""VendorId""               AS ""vendorId"",
                   ""VendorName""             AS ""vendorName"",
                   ""Role""                   AS ""role"",
                   ""HoursAssigned""          AS ""hoursAssigned"",
                   ""HoursWorked""            AS ""hoursWorked"",
                   ""ContractReference""      AS ""contractReference"",
                   ""CreatedAt""              AS ""createdAt""
            FROM ""Asset_MaintenanceWorkOrderAssignment""
            WHERE ""MaintenanceWorksOrderID"" = @id
            ORDER BY ""AssignmentId""", new { id });
        return Ok(items);
    }

    [HttpPost("{id:int}/assignments")]
    public async Task<IActionResult> AddAssignment(int id, [FromBody] JsonElement body)
    {
        int? employeeId = body.TryGetProperty("employeeId", out var ei) && ei.ValueKind != JsonValueKind.Null ? ei.GetInt32() : null;
        int? vendorId = body.TryGetProperty("vendorId", out var vi) && vi.ValueKind != JsonValueKind.Null ? vi.GetInt32() : null;
        if (employeeId is null && vendorId is null)
            return BadRequest(new { error = "An assignment must have either an employeeId or a vendorId." });
        string vendorName = body.TryGetProperty("vendorName", out var vn) ? (vn.GetString() ?? "") : "";
        string role = body.TryGetProperty("role", out var r) ? (r.GetString() ?? "") : "";
        decimal? hoursAssigned = body.TryGetProperty("hoursAssigned", out var ha) && ha.ValueKind != JsonValueKind.Null ? ha.GetDecimal() : null;
        string contractRef = body.TryGetProperty("contractReference", out var cr) ? (cr.GetString() ?? "") : "";
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var assignmentId = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_MaintenanceWorkOrderAssignment""
                (""MaintenanceWorksOrderID"", ""EmployeeId"", ""VendorId"", ""VendorName"", ""Role"", ""HoursAssigned"", ""ContractReference"")
            VALUES (@id, @employeeId, @vendorId, @vendorName, @role, @hoursAssigned, @contractRef)
            RETURNING ""AssignmentId""",
            new { id, employeeId, vendorId, vendorName, role, hoursAssigned, contractRef });
        return Ok(new { assignmentId, success = 1 });
    }

    [HttpPut("{id:int}/assignments/{assignmentId:int}")]
    public async Task<IActionResult> UpdateAssignment(int id, int assignmentId, [FromBody] JsonElement body)
    {
        decimal? hoursWorked = body.TryGetProperty("hoursWorked", out var hw) && hw.ValueKind != JsonValueKind.Null ? hw.GetDecimal() : null;
        decimal? hoursAssigned = body.TryGetProperty("hoursAssigned", out var ha) && ha.ValueKind != JsonValueKind.Null ? ha.GetDecimal() : null;
        string role = body.TryGetProperty("role", out var r) ? (r.GetString() ?? "") : "";
        string contractRef = body.TryGetProperty("contractReference", out var cr) ? (cr.GetString() ?? "") : "";
        string vendorName = body.TryGetProperty("vendorName", out var vn) ? (vn.GetString() ?? "") : "";
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Asset_MaintenanceWorkOrderAssignment"" SET
                ""HoursWorked""       = COALESCE(@hoursWorked, ""HoursWorked""),
                ""HoursAssigned""     = COALESCE(@hoursAssigned, ""HoursAssigned""),
                ""Role""              = CASE WHEN @role = '' THEN ""Role"" ELSE @role END,
                ""ContractReference"" = CASE WHEN @contractRef = '' THEN ""ContractReference"" ELSE @contractRef END,
                ""VendorName""        = CASE WHEN @vendorName = '' THEN ""VendorName"" ELSE @vendorName END
            WHERE ""AssignmentId"" = @assignmentId AND ""MaintenanceWorksOrderID"" = @id",
            new { hoursWorked, hoursAssigned, role, contractRef, vendorName, assignmentId, id });
        return rows == 0 ? NotFound(new { error = "Assignment not found" }) : Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}/assignments/{assignmentId:int}")]
    public async Task<IActionResult> RemoveAssignment(int id, int assignmentId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            DELETE FROM ""Asset_MaintenanceWorkOrderAssignment""
            WHERE ""AssignmentId"" = @assignmentId AND ""MaintenanceWorksOrderID"" = @id",
            new { assignmentId, id });
        return rows == 0 ? NotFound(new { error = "Assignment not found" }) : Ok(new { success = 1 });
    }

    // ─── Approvals Sub-resource ───────────────────────────────────────────────

    [HttpGet("{id:int}/approvals")]
    public async Task<IActionResult> GetApprovals(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"
            SELECT ""ApprovalId""              AS ""approvalId"",
                   ""MaintenanceWorksOrderID"" AS ""maintenanceWorksOrderId"",
                   ""ApprovalLevel""           AS ""approvalLevel"",
                   ""ApprovedById""            AS ""approvedById"",
                   ""ApprovalStatus""          AS ""approvalStatus"",
                   ""ApprovalDate""            AS ""approvalDate"",
                   ""Comments""               AS ""comments"",
                   ""CreatedAt""              AS ""createdAt""
            FROM ""Asset_MaintenanceWorkOrderApproval""
            WHERE ""MaintenanceWorksOrderID"" = @id
            ORDER BY ""ApprovalId""", new { id });
        return Ok(items);
    }

    // ─── Audit Trail Sub-resource ─────────────────────────────────────────────

    [HttpGet("{id:int}/audit-trail")]
    public async Task<IActionResult> GetAuditTrail(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"
            SELECT ""AuditId""                AS ""auditId"",
                   ""MaintenanceWorksOrderID"" AS ""maintenanceWorksOrderId"",
                   ""Action""                 AS ""action"",
                   ""FieldName""              AS ""fieldName"",
                   ""OldValue""               AS ""oldValue"",
                   ""NewValue""               AS ""newValue"",
                   ""ChangedById""            AS ""changedById"",
                   ""ChangedAt""              AS ""changedAt""
            FROM ""Asset_MaintenanceWorkOrderAuditTrail""
            WHERE ""MaintenanceWorksOrderID"" = @id
            ORDER BY ""AuditId"" DESC", new { id });
        return Ok(items);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private static async Task<string> GenerateWorkOrderNumber(System.Data.Common.DbConnection conn, DateTime now)
    {
        var prefix = $"WO-{now:yyyyMM}-";
        await conn.ExecuteAsync("SELECT pg_advisory_xact_lock(hashtext('wo_number_gen'))");
        var seq = await conn.QuerySingleAsync<long>(@"
            SELECT COALESCE(MAX(CAST(SPLIT_PART(""WorkOrderNumber"", '-', 3) AS INTEGER)), 0) + 1
            FROM ""Asset_MaintenanceWorkOrder""
            WHERE ""WorkOrderNumber"" LIKE @likePattern",
            new { likePattern = prefix + "%" });
        return $"{prefix}{seq:D4}";
    }

    private static async Task AddAudit(System.Data.Common.DbConnection conn, int woId, string action,
        string? fieldName, string? oldValue, string? newValue, int changedById)
    {
        await conn.ExecuteAsync(@"
            INSERT INTO ""Asset_MaintenanceWorkOrderAuditTrail""
                (""MaintenanceWorksOrderID"", ""Action"", ""FieldName"", ""OldValue"", ""NewValue"", ""ChangedById"", ""ChangedAt"")
            VALUES (@woId, @action, @fieldName, @oldValue, @newValue, @changedById, NOW())",
            new { woId, action, fieldName, oldValue, newValue, changedById });
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
        p.Add("requestId", Get<int?>("requestId"));
        p.Add("workOrderDesc", Get<string>("workOrderDesc"));
        p.Add("assetRegisterItemId", Get<int?>("assetRegisterItemId"));
        p.Add("workOrderDate", Get<DateTime?>("workOrderDate"));
        p.Add("requisitionNumber", Get<int?>("requisitionNumber"));
        p.Add("amount", Get<decimal?>("amount"));
        p.Add("debitProjectId", Get<int?>("debitProjectId"));
        p.Add("debitPlanProjectItemId", Get<int?>("debitPlanProjectItemId"));
        p.Add("creditProjectId", Get<int?>("creditProjectId"));
        p.Add("creditPlanProjectItemId", Get<int?>("creditPlanProjectItemId"));
        p.Add("maintainerId", Get<int?>("maintainerId"));
        p.Add("workOrderTypeId", Get<int?>("workOrderTypeId"));
        p.Add("workOrderStatusId", Get<int?>("workOrderStatusId"));
        p.Add("priority", Get<string>("priority"));
        p.Add("plannedStartDate", Get<DateTime?>("plannedStartDate"));
        p.Add("plannedEndDate", Get<DateTime?>("plannedEndDate"));
        p.Add("actualStartDate", Get<DateTime?>("actualStartDate"));
        p.Add("actualEndDate", Get<DateTime?>("actualEndDate"));
        p.Add("riskLevel", Get<string>("riskLevel"));
        p.Add("safetyRequirements", Get<string>("safetyRequirements"));
        p.Add("environmentalImpact", Get<string>("environmentalImpact"));
        p.Add("completionNotes", Get<string>("completionNotes"));
        p.Add("rootCause", Get<string>("rootCause"));
        p.Add("recommendations", Get<string>("recommendations"));
        p.Add("followUpRequired", Get<bool?>("followUpRequired"));
        p.Add("requestedById", Get<int?>("requestedById"));
        p.Add("completedById", Get<int?>("completedById"));
        p.Add("fundingSegment", Get<string>("fundingSegment"));
        p.Add("costCentre", Get<string>("costCentre"));
        p.Add("cancelledReason", Get<string>("cancelledReason"));
        p.Add("actualCost", Get<decimal?>("actualCost"));
        return p;
    }
}

[ApiController]
[Route("api/maintenance-work-order-details")]
public class MaintenanceWorkOrderDetailsController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public MaintenanceWorkOrderDetailsController(DbConnectionFactory db) => _db = db;

    private const string DetailSelect = @"
        SELECT d.""MaintenanceWorksOrderDetailsID"" AS ""maintenanceWorksOrderDetailsId"",
               d.""MaintenanceWorksOrderID""        AS ""maintenanceWorksOrderId"",
               d.""TechnicianNumber""               AS ""technicianNumber"",
               d.""LineItemNumber""                 AS ""lineItemNumber"",
               d.""ItemType""                       AS ""itemType"",
               d.""CommodityID""                    AS ""commodityId"",
               d.""QuantityOrdered""                AS ""quantityOrdered"",
               d.""QuantityReceived""               AS ""quantityReceived"",
               d.""Value""                          AS ""value"",
               d.""Description""                   AS ""description"",
               d.""UnitCost""                      AS ""unitCost"",
               CASE WHEN d.""UnitCost"" IS NOT NULL AND d.""QuantityOrdered"" IS NOT NULL
                    THEN d.""UnitCost"" * d.""QuantityOrdered"" ELSE d.""Value"" END AS ""totalCost"",
               d.""AssetComponentId""              AS ""assetComponentId""
        FROM ""Asset_MaintenanceWorkOrderDetails"" d
        WHERE d.""MaintenanceWorksOrderDetailsID"" = @id";

    [HttpGet("by-work-order/{workOrderId:int}")]
    public async Task<IActionResult> GetByWorkOrder(int workOrderId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"
            SELECT d.""MaintenanceWorksOrderDetailsID"" AS ""maintenanceWorksOrderDetailsId"",
                   d.""MaintenanceWorksOrderID""        AS ""maintenanceWorksOrderId"",
                   d.""TechnicianNumber""               AS ""technicianNumber"",
                   d.""LineItemNumber""                 AS ""lineItemNumber"",
                   d.""ItemType""                       AS ""itemType"",
                   d.""CommodityID""                    AS ""commodityId"",
                   d.""QuantityOrdered""                AS ""quantityOrdered"",
                   d.""QuantityReceived""               AS ""quantityReceived"",
                   d.""Value""                          AS ""value"",
                   d.""Description""                   AS ""description"",
                   d.""UnitCost""                      AS ""unitCost"",
                   CASE WHEN d.""UnitCost"" IS NOT NULL AND d.""QuantityOrdered"" IS NOT NULL
                        THEN d.""UnitCost"" * d.""QuantityOrdered"" ELSE d.""Value"" END AS ""totalCost"",
                   d.""AssetComponentId""              AS ""assetComponentId""
            FROM ""Asset_MaintenanceWorkOrderDetails"" d
            WHERE d.""MaintenanceWorksOrderID"" = @workOrderId
            ORDER BY d.""MaintenanceWorksOrderDetailsID""", new { workOrderId });
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Dictionary<string, object?> m)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var p = BuildParams(m);
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_MaintenanceWorkOrderDetails"" (
                ""MaintenanceWorksOrderID"", ""TechnicianNumber"", ""LineItemNumber"",
                ""ItemType"", ""CommodityID"", ""QuantityOrdered"", ""QuantityReceived"", ""Value"",
                ""Description"", ""UnitCost"", ""AssetComponentId"")
            VALUES (
                @maintenanceWorksOrderId, @technicianNumber, @lineItemNumber,
                @itemType, @commodityId, @quantityOrdered, @quantityReceived,
                COALESCE(@value, @unitCost * NULLIF(@quantityOrdered, 0)),
                @description, @unitCost, @assetComponentId)
            RETURNING ""MaintenanceWorksOrderDetailsID""", p);
        var created = await conn.QueryFirstOrDefaultAsync<dynamic>(DetailSelect, new { id });
        return Ok(created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Dictionary<string, object?> m)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var p = BuildParams(m);
        p.Add("id", id);
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Asset_MaintenanceWorkOrderDetails"" SET
                ""TechnicianNumber""  = @technicianNumber,
                ""LineItemNumber""    = @lineItemNumber,
                ""ItemType""          = @itemType,
                ""CommodityID""       = @commodityId,
                ""QuantityOrdered""   = @quantityOrdered,
                ""QuantityReceived""  = @quantityReceived,
                ""Value""             = COALESCE(@value, @unitCost * NULLIF(@quantityOrdered, 0), ""Value""),
                ""Description""       = @description,
                ""UnitCost""          = @unitCost,
                ""AssetComponentId""  = @assetComponentId
            WHERE ""MaintenanceWorksOrderDetailsID"" = @id", p);
        if (rows == 0) return NotFound(new { error = "Detail not found" });
        var updated = await conn.QueryFirstOrDefaultAsync<dynamic>(DetailSelect, new { id });
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Asset_MaintenanceWorkOrderDetails"" WHERE ""MaintenanceWorksOrderDetailsID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Detail not found" }) : Ok(new { success = 1 });
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
        p.Add("maintenanceWorksOrderId", Get<int?>("maintenanceWorksOrderId"));
        p.Add("technicianNumber", Get<string>("technicianNumber"));
        p.Add("lineItemNumber", Get<string>("lineItemNumber"));
        p.Add("itemType", Get<string>("itemType"));
        p.Add("commodityId", Get<int?>("commodityId"));
        p.Add("quantityOrdered", Get<int?>("quantityOrdered"));
        p.Add("quantityReceived", Get<int?>("quantityReceived"));
        p.Add("value", Get<decimal?>("value"));
        p.Add("description", Get<string>("description"));
        p.Add("unitCost", Get<decimal?>("unitCost"));
        p.Add("assetComponentId", Get<int?>("assetComponentId"));
        return p;
    }
}

[ApiController]
[Route("api/inventory-commodities")]
public class InventoryCommodityController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public InventoryCommodityController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"
            SELECT ""Commodity_ID""           AS ""commodityId"",
                   ""CommodityDesc""          AS ""commodityDesc"",
                   ""CommodityExtendedDesc""  AS ""commodityExtendedDesc"",
                   ""CommodityIDUnique""      AS ""commodityIdUnique""
            FROM ""Inven_Commodity""
            ORDER BY ""CommodityDesc""");
        return Ok(items);
    }
}

[ApiController]
[Route("api/work-order-statuses")]
public class WorkOrderStatusController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public WorkOrderStatusController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"
            SELECT ""WorkOrderStatusID""   AS ""workOrderStatusId"",
                   ""WorkOrderStatusDesc"" AS ""workOrderStatusDesc"",
                   ""SortOrder""          AS ""sortOrder"",
                   ""Enabled""            AS ""enabled""
            FROM ""Const_WorkOrderStatus""
            WHERE ""Enabled"" = true
            ORDER BY ""SortOrder""");
        return Ok(items);
    }
}

[ApiController]
[Route("api/work-order-types")]
public class WorkOrderTypeController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public WorkOrderTypeController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"
            SELECT ""WorkOrderTypeID""   AS ""workOrderTypeId"",
                   ""WorkOrderTypeDesc"" AS ""workOrderTypeDesc"",
                   ""IsCapex""          AS ""isCapex"",
                   ""SortOrder""        AS ""sortOrder"",
                   ""Enabled""          AS ""enabled""
            FROM ""Const_WorkOrderType""
            WHERE ""Enabled"" = true
            ORDER BY ""SortOrder""");
        return Ok(items);
    }
}
