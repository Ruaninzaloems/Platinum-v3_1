using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using System.Text.Json;

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
                ""ModifierID""             = 1
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
                ""DateModified"" = NOW(), ""ModifierID"" = 1
            WHERE ""LeadTimeID"" = @id", new { desc, days, enabled, id });
        return Ok();
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
                ""DateModified"" = NOW(), ""ModifierID"" = 1
            WHERE ""AssetServiceGroupID"" = @id", new { desc, enabled, id });
        return Ok();
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
                   NULL::TEXT AS ""debitProjectName"",
                   NULL::TEXT AS ""debitScoaDesc"",
                   NULL::TEXT AS ""creditProjectName"",
                   NULL::TEXT AS ""creditScoaDesc""
            FROM ""Asset_MaintenanceWorkOrder"" wo";

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
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_MaintenanceWorkOrder"" (
                ""RequestID"", ""WorkOrderDesc"", ""AssetRegisterItemID"", ""WorkOrderDate"",
                ""RequisitionNumber"", ""Amount"", ""DebitProjectId"", ""DebitPlanProjectItemId"",
                ""CreditProjectId"", ""CreditPlanProjectItemId"", ""MaintainerID"",
                ""WorkOrderTypeID"", ""WorkOrderStatusID"")
            VALUES (
                @requestId, @workOrderDesc, COALESCE(@assetRegisterItemId, 0), COALESCE(@workOrderDate, NOW()),
                @requisitionNumber, @amount, @debitProjectId, @debitPlanProjectItemId,
                @creditProjectId, @creditPlanProjectItemId, @maintainerId,
                @workOrderTypeId, @workOrderStatusId)
            RETURNING ""MaintenanceWorksOrderID""", p);
        var created = await conn.QueryFirstOrDefaultAsync<dynamic>(
            WorkOrderSelect + @" WHERE wo.""MaintenanceWorksOrderID"" = @id", new { id });
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
                ""WorkOrderStatusID""       = @workOrderStatusId
            WHERE ""MaintenanceWorksOrderID"" = @id", p);
        return rows == 0 ? NotFound(new { error = "Work order not found" }) : Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(@"DELETE FROM ""Asset_MaintenanceWorkOrderDetails"" WHERE ""MaintenanceWorksOrderID"" = @id", new { id });
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Asset_MaintenanceWorkOrder"" WHERE ""MaintenanceWorksOrderID"" = @id", new { id });
        return rows == 0 ? NotFound(new { error = "Work order not found" }) : Ok(new { success = 1 });
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
        return p;
    }
}

[ApiController]
[Route("api/maintenance-work-order-details")]
public class MaintenanceWorkOrderDetailsController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public MaintenanceWorkOrderDetailsController(DbConnectionFactory db) => _db = db;

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
                   d.""Value""                          AS ""value""
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
                ""ItemType"", ""CommodityID"", ""QuantityOrdered"", ""QuantityReceived"", ""Value"")
            VALUES (
                @maintenanceWorksOrderId, @technicianNumber, @lineItemNumber,
                @itemType, @commodityId, @quantityOrdered, @quantityReceived, @value)
            RETURNING ""MaintenanceWorksOrderDetailsID""", p);
        return Ok(new { maintenanceWorksOrderDetailsId = id, success = 1 });
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
                ""Value""             = @value
            WHERE ""MaintenanceWorksOrderDetailsID"" = @id", p);
        return rows == 0 ? NotFound(new { error = "Detail not found" }) : Ok(new { success = 1 });
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
