using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/verification-plans")]
public class VerificationPlanController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public VerificationPlanController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"
            SELECT
                p.""VerificationPlan_ID"" AS ""verificationPlanId"",
                p.""PlanName""           AS ""planName"",
                p.""PlannedStartDate""   AS ""plannedStartDate"",
                p.""PlannedEndDate""     AS ""plannedEndDate"",
                p.""AssetTypes""         AS ""assetTypes"",
                p.""AssetCategories""    AS ""assetCategories"",
                p.""Town_ID""           AS ""townId"",
                '' AS ""townDesc"",
                p.""Suburb_ID""         AS ""suburbId"",
                '' AS ""suburbDesc"",
                p.""Building_ID""       AS ""buildingId"",
                '' AS ""buildingDesc"",
                p.""ScopeOfWork""       AS ""scopeOfWork"",
                p.""LinkedRegisterId""  AS ""linkedRegisterId"",
                COALESCE(vr.""RegisterName"", '') AS ""linkedRegisterName"",
                p.""DashboardURL""      AS ""dashboardUrl"",
                p.""Status""            AS ""status"",
                p.""Version""           AS ""version"",
                p.""DateCaptured""      AS ""dateCaptured"",
                p.""CapturerID""        AS ""capturerId"",
                p.""DateModified""      AS ""dateModified"",
                p.""ModifierID""        AS ""modifierId"",
                (SELECT COUNT(*) FROM ""Asset_VerificationPlanTeamMember"" tm WHERE tm.""VerificationPlan_ID"" = p.""VerificationPlan_ID"") AS ""teamMemberCount"",
                (SELECT COUNT(*) FROM ""Asset_VerificationPlanApproval"" ap WHERE ap.""VerificationPlan_ID"" = p.""VerificationPlan_ID"") AS ""approvalCount""
            FROM ""Asset_VerificationPlan"" p
            LEFT JOIN ""Asset_VerificationRegister"" vr ON p.""LinkedRegisterId"" = vr.""VerificationRegister_ID""
            WHERE 1=1";
        var p2 = new DynamicParameters();
        if (!string.IsNullOrWhiteSpace(status))
        {
            sql += @" AND p.""Status"" = @status";
            p2.Add("status", status);
        }
        sql += @" ORDER BY p.""VerificationPlan_ID"" DESC";
        var items = await conn.QueryAsync<dynamic>(sql, p2);
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT
                p.""VerificationPlan_ID"" AS ""verificationPlanId"",
                p.""PlanName""           AS ""planName"",
                p.""PlannedStartDate""   AS ""plannedStartDate"",
                p.""PlannedEndDate""     AS ""plannedEndDate"",
                p.""AssetTypes""         AS ""assetTypes"",
                p.""AssetCategories""    AS ""assetCategories"",
                p.""Town_ID""           AS ""townId"",
                '' AS ""townDesc"",
                p.""Suburb_ID""         AS ""suburbId"",
                '' AS ""suburbDesc"",
                p.""Building_ID""       AS ""buildingId"",
                '' AS ""buildingDesc"",
                p.""ScopeOfWork""       AS ""scopeOfWork"",
                p.""LinkedRegisterId""  AS ""linkedRegisterId"",
                COALESCE(vr.""RegisterName"", '') AS ""linkedRegisterName"",
                p.""DashboardURL""      AS ""dashboardUrl"",
                p.""Status""            AS ""status"",
                p.""Version""           AS ""version"",
                p.""DateCaptured""      AS ""dateCaptured"",
                p.""CapturerID""        AS ""capturerId"",
                p.""DateModified""      AS ""dateModified"",
                p.""ModifierID""        AS ""modifierId""
            FROM ""Asset_VerificationPlan"" p
            LEFT JOIN ""Asset_VerificationRegister"" vr ON p.""LinkedRegisterId"" = vr.""VerificationRegister_ID""
            WHERE p.""VerificationPlan_ID"" = @id", new { id });
        if (item is null) return NotFound(new { error = "Verification plan not found" });
        return Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Dictionary<string, object?> model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var planName = GetStr(model, "planName");
        if (string.IsNullOrWhiteSpace(planName)) return BadRequest(new { error = "Plan name is required" });

        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_VerificationPlan"" (
                ""PlanName"", ""PlannedStartDate"", ""PlannedEndDate"",
                ""AssetTypes"", ""AssetCategories"",
                ""Town_ID"", ""Suburb_ID"", ""Building_ID"",
                ""ScopeOfWork"", ""LinkedRegisterId"", ""DashboardURL"",
                ""Status"", ""Version"", ""DateCaptured"", ""CapturerID"")
            VALUES (
                @planName, @startDate::TIMESTAMP, @endDate::TIMESTAMP,
                @assetTypes::JSONB, @assetCategories::JSONB,
                @townId, @suburbId, @buildingId,
                @scopeOfWork, @linkedRegisterId, @dashboardUrl,
                'Draft', 1, NOW(), 1)
            RETURNING ""VerificationPlan_ID""",
            new {
                planName,
                startDate = GetStr(model, "plannedStartDate"),
                endDate = GetStr(model, "plannedEndDate"),
                assetTypes = GetStr(model, "assetTypes") ?? "[]",
                assetCategories = GetStr(model, "assetCategories") ?? "[]",
                townId = GetNullInt(model, "townId"),
                suburbId = GetNullInt(model, "suburbId"),
                buildingId = GetNullInt(model, "buildingId"),
                scopeOfWork = GetStr(model, "scopeOfWork"),
                linkedRegisterId = GetNullInt(model, "linkedRegisterId"),
                dashboardUrl = GetStr(model, "dashboardUrl")
            });

        if (model.ContainsKey("teamMembers") && model["teamMembers"] is System.Text.Json.JsonElement teamArr && teamArr.ValueKind == System.Text.Json.JsonValueKind.Array)
        {
            foreach (var tm in teamArr.EnumerateArray())
            {
                await InsertTeamMember(conn, id, tm);
            }
        }

        return Ok(new { verificationPlanId = id });
    }

    [HttpPut("{id:int}/amend")]
    public async Task<IActionResult> Amend(int id, [FromBody] Dictionary<string, object?> model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var existing = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""VerificationPlan_ID"", ""Status"", ""Version"",
                   ""PlanName"", ""PlannedStartDate"", ""PlannedEndDate"",
                   ""AssetTypes""::TEXT AS ""AssetTypes"", ""AssetCategories""::TEXT AS ""AssetCategories"",
                   ""Town_ID"", ""Suburb_ID"", ""Building_ID"",
                   ""ScopeOfWork"", ""LinkedRegisterId"", ""DashboardURL""
            FROM ""Asset_VerificationPlan""
            WHERE ""VerificationPlan_ID"" = @id", new { id });
        if (existing is null) return NotFound(new { error = "Plan not found" });

        var oldStatus = (string)existing.Status;
        var newStatus = oldStatus;
        if (oldStatus == "Approved" || oldStatus == "Amended (Approved)")
            newStatus = "Amended";

        IDictionary<string, object?> ex = (IDictionary<string, object?>)existing;
        var changes = new Dictionary<string, object?>();
        var planName = GetStr(model, "planName");
        if (planName != null && planName != (string?)ex["PlanName"]) changes["PlanName"] = new { from = (string?)ex["PlanName"], to = planName };
        var startDate = GetStr(model, "plannedStartDate");
        if (startDate != null) { var oldVal = ex["PlannedStartDate"]?.ToString() ?? ""; if (startDate != oldVal) changes["PlannedStartDate"] = new { from = oldVal, to = startDate }; }
        var endDate = GetStr(model, "plannedEndDate");
        if (endDate != null) { var oldVal = ex["PlannedEndDate"]?.ToString() ?? ""; if (endDate != oldVal) changes["PlannedEndDate"] = new { from = oldVal, to = endDate }; }
        var scopeOfWork = GetStr(model, "scopeOfWork");
        if (scopeOfWork != null && scopeOfWork != (string?)ex["ScopeOfWork"]) changes["ScopeOfWork"] = new { from = (string?)ex["ScopeOfWork"], to = scopeOfWork };
        var assetTypesStr = GetStr(model, "assetTypes");
        if (assetTypesStr != null) { var oldVal = ex["AssetTypes"]?.ToString() ?? "[]"; if (assetTypesStr != oldVal) changes["AssetTypes"] = new { from = oldVal, to = assetTypesStr }; }
        var assetCategoriesStr = GetStr(model, "assetCategories");
        if (assetCategoriesStr != null) { var oldVal = ex["AssetCategories"]?.ToString() ?? "[]"; if (assetCategoriesStr != oldVal) changes["AssetCategories"] = new { from = oldVal, to = assetCategoriesStr }; }
        var townId = GetNullInt(model, "townId");
        if (townId != null && townId != (int?)ex["Town_ID"]) changes["Town_ID"] = new { from = ex["Town_ID"], to = townId };
        var suburbId = GetNullInt(model, "suburbId");
        if (suburbId != null && suburbId != (int?)ex["Suburb_ID"]) changes["Suburb_ID"] = new { from = ex["Suburb_ID"], to = suburbId };
        var buildingId = GetNullInt(model, "buildingId");
        if (buildingId != null && buildingId != (int?)ex["Building_ID"]) changes["Building_ID"] = new { from = ex["Building_ID"], to = buildingId };
        var linkedRegisterId = GetNullInt(model, "linkedRegisterId");
        if (linkedRegisterId != null && linkedRegisterId != (int?)ex["LinkedRegisterId"]) changes["LinkedRegisterId"] = new { from = ex["LinkedRegisterId"], to = linkedRegisterId };
        var dashboardUrl = GetStr(model, "dashboardUrl");
        if (dashboardUrl != null && dashboardUrl != (string?)ex["DashboardURL"]) changes["DashboardURL"] = new { from = (string?)ex["DashboardURL"], to = dashboardUrl };
        if (newStatus != oldStatus) changes["Status"] = new { from = oldStatus, to = newStatus };

        var newVersion = (int)existing.Version + 1;

        await conn.ExecuteAsync(@"
            UPDATE ""Asset_VerificationPlan""
            SET ""PlanName"" = COALESCE(@planName::VARCHAR, ""PlanName""),
                ""PlannedStartDate"" = CASE WHEN @startDate IS NOT NULL THEN @startDate::TIMESTAMP ELSE ""PlannedStartDate"" END,
                ""PlannedEndDate"" = CASE WHEN @endDate IS NOT NULL THEN @endDate::TIMESTAMP ELSE ""PlannedEndDate"" END,
                ""AssetTypes"" = CASE WHEN @assetTypes IS NOT NULL THEN @assetTypes::JSONB ELSE ""AssetTypes"" END,
                ""AssetCategories"" = CASE WHEN @assetCategories IS NOT NULL THEN @assetCategories::JSONB ELSE ""AssetCategories"" END,
                ""Town_ID"" = COALESCE(@townId, ""Town_ID""),
                ""Suburb_ID"" = COALESCE(@suburbId, ""Suburb_ID""),
                ""Building_ID"" = COALESCE(@buildingId, ""Building_ID""),
                ""ScopeOfWork"" = COALESCE(@scopeOfWork::VARCHAR, ""ScopeOfWork""),
                ""LinkedRegisterId"" = COALESCE(@linkedRegisterId, ""LinkedRegisterId""),
                ""DashboardURL"" = COALESCE(@dashboardUrl::VARCHAR, ""DashboardURL""),
                ""Status"" = @newStatus,
                ""Version"" = @newVersion,
                ""DateModified"" = NOW(),
                ""ModifierID"" = 1
            WHERE ""VerificationPlan_ID"" = @id",
            new {
                id,
                planName,
                startDate,
                endDate,
                assetTypes = assetTypesStr,
                assetCategories = assetCategoriesStr,
                townId,
                suburbId,
                buildingId,
                scopeOfWork,
                linkedRegisterId,
                dashboardUrl,
                newStatus,
                newVersion
            });

        var changesJson = System.Text.Json.JsonSerializer.Serialize(changes);
        await conn.ExecuteAsync(@"
            INSERT INTO ""Asset_VerificationPlanAuditTrail""
                (""VerificationPlan_ID"", ""Version"", ""ChangedByID"", ""ChangedByName"", ""ChangedAt"", ""ChangesSummary"")
            VALUES (@id, @newVersion, 1, 'System User', NOW(), @changesJson::JSONB)",
            new { id, newVersion, changesJson });

        return Ok(new { status = newStatus, version = newVersion });
    }

    [HttpPost("{id:int}/approve")]
    public async Task<IActionResult> Approve(int id, [FromBody] Dictionary<string, object?> model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var existing = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""VerificationPlan_ID"", ""Status"", ""Version""
            FROM ""Asset_VerificationPlan""
            WHERE ""VerificationPlan_ID"" = @id", new { id });
        if (existing is null) return NotFound(new { error = "Plan not found" });

        var approvedByName = GetStr(model, "approvedByName");
        if (string.IsNullOrWhiteSpace(approvedByName))
            return BadRequest(new { error = "Approver name is required" });

        var approvalDate = GetStr(model, "approvalDate");
        if (string.IsNullOrWhiteSpace(approvalDate))
            return BadRequest(new { error = "Approval date is required" });

        var oldStatus = (string)existing.Status;
        if (oldStatus != "Draft" && oldStatus != "Amended")
            return BadRequest(new { error = "Only plans with status 'Draft' or 'Amended' can be approved. Current status: " + oldStatus });

        var documentId = GetNullInt(model, "documentId");
        if (documentId == null)
            return BadRequest(new { error = "A signed approval document is required. Please upload a document before approving." });

        var newStatus = (oldStatus == "Amended") ? "Amended (Approved)" : "Approved";

        await conn.ExecuteAsync(@"
            INSERT INTO ""Asset_VerificationPlanApproval""
                (""VerificationPlan_ID"", ""Version"", ""ApprovedBy"", ""ApprovedByName"", ""IsExternal"", ""ApprovalDate"", ""DocumentId"")
            VALUES (@id, @version, @approvedBy, @approvedByName, @isExternal, @approvalDate::TIMESTAMP, @documentId)",
            new {
                id,
                version = (int)existing.Version,
                approvedBy = GetNullInt(model, "approvedBy"),
                approvedByName,
                isExternal = GetNullInt(model, "isExternal") ?? 0,
                approvalDate,
                documentId
            });

        await conn.ExecuteAsync(@"
            UPDATE ""Asset_VerificationPlan""
            SET ""Status"" = @newStatus, ""DateModified"" = NOW(), ""ModifierID"" = 1
            WHERE ""VerificationPlan_ID"" = @id",
            new { id, newStatus });

        return Ok(new { status = newStatus });
    }

    [HttpGet("{id:int}/team-members")]
    public async Task<IActionResult> GetTeamMembers(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"
            SELECT
                tm.""TeamMember_ID"" AS ""teamMemberId"",
                tm.""VerificationPlan_ID"" AS ""verificationPlanId"",
                tm.""Role"" AS ""role"",
                tm.""Employee_ID"" AS ""employeeId"",
                tm.""EmployeeName"" AS ""employeeName"",
                tm.""IsExternal"" AS ""isExternal"",
                tm.""ContactNumber"" AS ""contactNumber"",
                COALESCE(tm.""EmployeeName"", '') AS ""employeeFullName""
            FROM ""Asset_VerificationPlanTeamMember"" tm
            WHERE tm.""VerificationPlan_ID"" = @id
            ORDER BY tm.""Role"", tm.""EmployeeName""", new { id });
        return Ok(items);
    }

    [HttpPost("{id:int}/team-members")]
    public async Task<IActionResult> AddTeamMember(int id, [FromBody] Dictionary<string, object?> model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var role = GetStr(model, "role");
        if (string.IsNullOrWhiteSpace(role)) return BadRequest(new { error = "Role is required" });

        if (role == "Team Leader")
        {
            var existingLeader = await conn.ExecuteScalarAsync<int>(@"
                SELECT COUNT(*) FROM ""Asset_VerificationPlanTeamMember""
                WHERE ""VerificationPlan_ID"" = @id AND ""Role"" = 'Team Leader'", new { id });
            if (existingLeader > 0)
                return BadRequest(new { error = "A Team Leader already exists. Remove the existing one first." });
        }

        var memberId = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_VerificationPlanTeamMember""
                (""VerificationPlan_ID"", ""Role"", ""Employee_ID"", ""EmployeeName"", ""IsExternal"", ""ContactNumber"")
            VALUES (@id, @role, @employeeId, @employeeName, @isExternal, @contactNumber)
            RETURNING ""TeamMember_ID""",
            new {
                id,
                role,
                employeeId = GetNullInt(model, "employeeId"),
                employeeName = GetStr(model, "employeeName"),
                isExternal = GetNullInt(model, "isExternal") ?? 0,
                contactNumber = GetStr(model, "contactNumber")
            });

        return Ok(new { teamMemberId = memberId });
    }

    [HttpDelete("{planId:int}/team-members/{memberId:int}")]
    public async Task<IActionResult> RemoveTeamMember(int planId, int memberId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(@"
            DELETE FROM ""Asset_VerificationPlanTeamMember""
            WHERE ""TeamMember_ID"" = @memberId AND ""VerificationPlan_ID"" = @planId",
            new { planId, memberId });
        return Ok(new { message = "Team member removed" });
    }

    [HttpGet("{id:int}/approvals")]
    public async Task<IActionResult> GetApprovals(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"
            SELECT
                a.""Approval_ID"" AS ""approvalId"",
                a.""Version"" AS ""version"",
                a.""ApprovedByName"" AS ""approvedByName"",
                a.""IsExternal"" AS ""isExternal"",
                a.""ApprovalDate"" AS ""approvalDate"",
                a.""DocumentId"" AS ""documentId"",
                a.""CreatedAt"" AS ""createdAt"",
                COALESCE(d.""file_name"", '') AS ""documentName""
            FROM ""Asset_VerificationPlanApproval"" a
            LEFT JOIN ""Asset_Documents"" d ON a.""DocumentId"" = d.""id""
            WHERE a.""VerificationPlan_ID"" = @id
            ORDER BY a.""CreatedAt"" DESC", new { id });
        return Ok(items);
    }

    [HttpGet("{id:int}/audit-trail")]
    public async Task<IActionResult> GetAuditTrail(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"
            SELECT
                at.""AuditTrail_ID"" AS ""auditTrailId"",
                at.""Version"" AS ""version"",
                at.""ChangedByName"" AS ""changedByName"",
                at.""ChangedAt"" AS ""changedAt"",
                at.""ChangesSummary"" AS ""changesSummary""
            FROM ""Asset_VerificationPlanAuditTrail"" at
            WHERE at.""VerificationPlan_ID"" = @id
            ORDER BY at.""ChangedAt"" DESC", new { id });
        return Ok(items);
    }

    [HttpGet("{id:int}/export")]
    public async Task<IActionResult> ExportPlan(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var plan = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT p.*, '' AS ""TownDesc"", '' AS ""SuburbDesc"", '' AS ""BuildingDesc"",
                   COALESCE(vr.""RegisterName"", '') AS ""RegisterName""
            FROM ""Asset_VerificationPlan"" p
            LEFT JOIN ""Asset_VerificationRegister"" vr ON p.""LinkedRegisterId"" = vr.""VerificationRegister_ID""
            WHERE p.""VerificationPlan_ID"" = @id", new { id });
        if (plan is null) return NotFound(new { error = "Plan not found" });

        var team = await conn.QueryAsync<dynamic>(@"
            SELECT tm.""Role"", tm.""EmployeeName"", tm.""IsExternal"", tm.""ContactNumber"",
                   COALESCE(tm.""EmployeeName"", '') AS ""FullName""
            FROM ""Asset_VerificationPlanTeamMember"" tm
            WHERE tm.""VerificationPlan_ID"" = @id
            ORDER BY tm.""Role""", new { id });

        var approvals = await conn.QueryAsync<dynamic>(@"
            SELECT ""Version"", ""ApprovedByName"", ""ApprovalDate"", ""IsExternal""
            FROM ""Asset_VerificationPlanApproval""
            WHERE ""VerificationPlan_ID"" = @id
            ORDER BY ""CreatedAt"" DESC", new { id });

        IDictionary<string, object?> d = (IDictionary<string, object?>)plan;

        return Ok(new {
            plan = new {
                planName = d["PlanName"],
                plannedStartDate = d["PlannedStartDate"],
                plannedEndDate = d["PlannedEndDate"],
                assetTypes = d["AssetTypes"],
                assetCategories = d["AssetCategories"],
                townDesc = d["TownDesc"],
                suburbDesc = d["SuburbDesc"],
                buildingDesc = d["BuildingDesc"],
                scopeOfWork = d["ScopeOfWork"],
                linkedRegisterName = d["RegisterName"],
                dashboardUrl = d["DashboardURL"],
                status = d["Status"],
                version = d["Version"],
                dateCaptured = d["DateCaptured"]
            },
            teamMembers = team,
            approvals
        });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(@"DELETE FROM ""Asset_VerificationPlan"" WHERE ""VerificationPlan_ID"" = @id", new { id });
        return Ok(new { message = "Plan deleted" });
    }

    private async Task InsertTeamMember(System.Data.Common.DbConnection conn, int planId, System.Text.Json.JsonElement tm)
    {
        var role = tm.TryGetProperty("role", out var r) ? r.GetString() ?? "" : "";
        var employeeName = tm.TryGetProperty("employeeName", out var en) ? en.GetString() ?? "" : "";
        var contactNumber = tm.TryGetProperty("contactNumber", out var cn) ? cn.GetString() ?? "" : "";
        int? employeeId = tm.TryGetProperty("employeeId", out var eid) && eid.ValueKind == System.Text.Json.JsonValueKind.Number ? eid.GetInt32() : null;
        var isExternal = tm.TryGetProperty("isExternal", out var ie) && ie.ValueKind == System.Text.Json.JsonValueKind.Number ? ie.GetInt32() : 0;

        await conn.ExecuteAsync(@"
            INSERT INTO ""Asset_VerificationPlanTeamMember""
                (""VerificationPlan_ID"", ""Role"", ""Employee_ID"", ""EmployeeName"", ""IsExternal"", ""ContactNumber"")
            VALUES (@planId, @role, @employeeId, @employeeName, @isExternal, @contactNumber)",
            new { planId, role, employeeId, employeeName, isExternal, contactNumber });
    }

    private static string? GetStr(Dictionary<string, object?> m, string key)
    {
        if (!m.TryGetValue(key, out var v) || v is null) return null;
        if (v is System.Text.Json.JsonElement je)
        {
            if (je.ValueKind == System.Text.Json.JsonValueKind.Null) return null;
            if (je.ValueKind == System.Text.Json.JsonValueKind.Array || je.ValueKind == System.Text.Json.JsonValueKind.Object) return je.GetRawText();
            return je.ToString();
        }
        return v.ToString();
    }

    private static int? GetNullInt(Dictionary<string, object?> m, string key)
    {
        var s = GetStr(m, key);
        if (string.IsNullOrWhiteSpace(s)) return null;
        return int.TryParse(s, out var n) ? n : null;
    }
}
