using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/verification-registers")]
public class VerificationRegisterController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public VerificationRegisterController(DbConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? isHistory)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"
            SELECT
                vr.""VerificationRegister_ID"" AS ""verificationRegisterId"",
                vr.""RegisterName""           AS ""registerName"",
                vr.""RegisterType""           AS ""registerType"",
                vr.""Description""            AS ""description"",
                vr.""StartDate""              AS ""startDate"",
                vr.""EndDate""                AS ""endDate"",
                vr.""DashboardURL""           AS ""dashboardUrl"",
                vr.""TeamMembers""            AS ""teamMembers"",
                vr.""IsHistory""              AS ""isHistory"",
                vr.""DateCaptured""           AS ""dateCaptured"",
                vr.""CapturerID""             AS ""capturerId"",
                vr.""DateModified""           AS ""dateModified"",
                vr.""ModifierID""             AS ""modifierId"",
                (SELECT COUNT(*) FROM ""Asset_VerificationRegisterItem"" vi WHERE vi.""VerificationRegister_ID"" = vr.""VerificationRegister_ID"") AS ""totalItems"",
                (SELECT COUNT(*) FROM ""Asset_VerificationRegisterItem"" vi WHERE vi.""VerificationRegister_ID"" = vr.""VerificationRegister_ID"" AND vi.""Verification_Flag"" = 'Approved') AS ""approvedItems"",
                (SELECT COUNT(*) FROM ""Asset_VerificationRegisterItem"" vi WHERE vi.""VerificationRegister_ID"" = vr.""VerificationRegister_ID"" AND vi.""Verification_Flag"" = 'Submitted for Approval') AS ""submittedItems""
            FROM ""Asset_VerificationRegister"" vr
            WHERE 1=1";
        var p = new DynamicParameters();
        if (isHistory.HasValue) { sql += @" AND vr.""IsHistory"" = @isHistory"; p.Add("isHistory", isHistory.Value); }
        sql += @" ORDER BY vr.""VerificationRegister_ID"" DESC";
        var items = await conn.QueryAsync<dynamic>(sql, p);
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT
                vr.""VerificationRegister_ID"" AS ""verificationRegisterId"",
                vr.""RegisterName""           AS ""registerName"",
                vr.""RegisterType""           AS ""registerType"",
                vr.""Description""            AS ""description"",
                vr.""StartDate""              AS ""startDate"",
                vr.""EndDate""                AS ""endDate"",
                vr.""DashboardURL""           AS ""dashboardUrl"",
                vr.""TeamMembers""            AS ""teamMembers"",
                vr.""IsHistory""              AS ""isHistory"",
                vr.""DateCaptured""           AS ""dateCaptured"",
                vr.""CapturerID""             AS ""capturerId"",
                (SELECT COUNT(*) FROM ""Asset_VerificationRegisterItem"" vi WHERE vi.""VerificationRegister_ID"" = vr.""VerificationRegister_ID"") AS ""totalItems"",
                (SELECT COUNT(*) FROM ""Asset_VerificationRegisterItem"" vi WHERE vi.""VerificationRegister_ID"" = vr.""VerificationRegister_ID"" AND vi.""Verification_Flag"" = 'Approved') AS ""approvedItems"",
                (SELECT COUNT(*) FROM ""Asset_VerificationRegisterItem"" vi WHERE vi.""VerificationRegister_ID"" = vr.""VerificationRegister_ID"" AND vi.""Verification_Flag"" = 'Submitted for Approval') AS ""submittedItems""
            FROM ""Asset_VerificationRegister"" vr
            WHERE vr.""VerificationRegister_ID"" = @id", new { id });
        return item is null ? NotFound(new { error = "Verification register not found" }) : Ok(item);
    }

    [HttpGet("generate-name")]
    public async Task<IActionResult> GenerateName([FromQuery] string registerType)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var count = await conn.ExecuteScalarAsync<int>(@"
            SELECT COUNT(*) FROM ""Asset_VerificationRegister"" WHERE ""RegisterType"" = @registerType", new { registerType });
        var now = DateTime.Now;
        var name = $"{registerType}_Verification_{now:yyyy}_{(count + 1):D3}";
        return Ok(new { name });
    }

    [HttpGet("preview-items")]
    public async Task<IActionResult> PreviewItems(
        [FromQuery] string registerType,
        [FromQuery] int? assetTypeId,
        [FromQuery] int? categoryId,
        [FromQuery] int? subCategoryId,
        [FromQuery] int? departmentId,
        [FromQuery] string? search)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
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
                COALESCE(mt.""Name"", '') AS ""measurementTypeDesc"",
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
            LEFT JOIN ""AssetConfig_MeasurementType"" mt ON a.""MeasurementType_ID"" = mt.""AssetConfig_MeasurementType_ID""
            WHERE 1=1
            AND a.""AssetRegisterItem_ID"" NOT IN (
                SELECT vi.""AssetRegisterItem_ID""
                FROM ""Asset_VerificationRegisterItem"" vi
                JOIN ""Asset_VerificationRegister"" vr ON vi.""VerificationRegister_ID"" = vr.""VerificationRegister_ID""
                WHERE COALESCE(vr.""IsHistory"", 0) = 0
            )";
        var p = new DynamicParameters();

        if (registerType == "Infrastructure")
        {
            sql += @" AND a.""InfrastructurOrNonInfrastructure"" = 'Infrastructure'";
        }
        else if (registerType == "Non-Infrastructure")
        {
            sql += @" AND (a.""InfrastructurOrNonInfrastructure"" = 'Non-Infrastructure' OR a.""InfrastructurOrNonInfrastructure"" IS NULL)";
        }

        if (assetTypeId.HasValue) { sql += @" AND a.""AssetType_ID"" = @assetTypeId"; p.Add("assetTypeId", assetTypeId.Value); }
        if (categoryId.HasValue) { sql += @" AND a.""AssetCategory_ID"" = @categoryId"; p.Add("categoryId", categoryId.Value); }
        if (subCategoryId.HasValue) { sql += @" AND a.""Asset_SubCategory_ID"" = @subCategoryId"; p.Add("subCategoryId", subCategoryId.Value); }
        if (departmentId.HasValue) { sql += @" AND CAST(NULLIF(a.""MunicipalDepartment_ID"", '') AS INTEGER) = @departmentId"; p.Add("departmentId", departmentId.Value); }
        if (!string.IsNullOrWhiteSpace(search))
        {
            sql += @" AND (a.""Description"" ILIKE @search OR a.""Barcode"" ILIKE @search OR a.""SerialNumber"" ILIKE @search)";
            p.Add("search", "%" + search + "%");
        }
        sql += @" ORDER BY a.""AssetRegisterItem_ID""";
        var items = await conn.QueryAsync<dynamic>(sql, p);
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Dictionary<string, object?> model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var p = BuildParams(model);
        var id = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_VerificationRegister"" (
                ""RegisterName"", ""RegisterType"", ""Description"",
                ""StartDate"", ""EndDate"", ""DashboardURL"", ""TeamMembers"",
                ""IsHistory"", ""DateCaptured"", ""CapturerID"")
            VALUES (
                @registerName, @registerType, @description,
                @startDate, @endDate, @dashboardUrl, @teamMembers,
                0, NOW(), 1)
            RETURNING ""VerificationRegister_ID""", p);
        return Ok(new { verificationRegisterId = id });
    }

    [HttpPost("match-csv-assets")]
    public async Task<IActionResult> MatchCsvAssets([FromBody] List<string> values)
    {
        if (values == null || values.Count == 0) return Ok(new List<object>());
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var ids = new List<int>();
        var barcodes = new List<string>();
        foreach (var v in values)
        {
            var s = (v ?? "").Trim();
            if (string.IsNullOrWhiteSpace(s)) continue;
            if (int.TryParse(s, out var n)) ids.Add(n);
            else barcodes.Add(s);
        }
        var sql = @"
            SELECT a.""AssetRegisterItem_ID"" AS ""assetRegisterItemId"",
                   a.""MunicipalAssetID"" AS ""municipalAssetId"",
                   a.""Description"" AS ""description"",
                   a.""Barcode"" AS ""barcode"",
                   COALESCE(at.""AssetTypeDesc"", '') AS ""assetTypeDesc"",
                   COALESCE(ac.""AssetCategoryDesc"", '') AS ""assetCategoryDesc"",
                   COALESCE(st.""AssetStatusDesc"", '') AS ""statusDesc"",
                   a.""PurchaseAmount"" AS ""purchaseAmount""
            FROM ""Asset_Register_Items"" a
            LEFT JOIN ""Const_AssetType_Sys"" at ON a.""AssetType_ID"" = at.""AssetType_ID""
            LEFT JOIN ""Const_AssetCategory_sys"" ac ON a.""AssetCategory_ID"" = ac.""AssetCategoryID""
            LEFT JOIN ""Const_AssetStatus_Sys"" st ON a.""AssetStatus_ID"" = st.""AssetStatus_ID""
            WHERE (
                (@hasIds AND a.""AssetRegisterItem_ID"" = ANY(@ids))
                OR (@hasBarcodes AND a.""Barcode"" = ANY(@barcodes))
            )
            AND a.""AssetRegisterItem_ID"" NOT IN (
                SELECT vi.""AssetRegisterItem_ID""
                FROM ""Asset_VerificationRegisterItem"" vi
                JOIN ""Asset_VerificationRegister"" vr ON vi.""VerificationRegister_ID"" = vr.""VerificationRegister_ID""
                WHERE COALESCE(vr.""IsHistory"", 0) = 0
            )
            ORDER BY a.""AssetRegisterItem_ID""";
        var p = new DynamicParameters();
        p.Add("hasIds", ids.Count > 0);
        p.Add("ids", ids.Count > 0 ? ids.ToArray() : new int[0]);
        p.Add("hasBarcodes", barcodes.Count > 0);
        p.Add("barcodes", barcodes.Count > 0 ? barcodes.ToArray() : new string[0]);
        var items = await conn.QueryAsync<dynamic>(sql, p);
        return Ok(items);
    }

    [HttpPost("{id:int}/create-items")]
    public async Task<IActionResult> CreateItems(int id, [FromBody] List<int> assetIds)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        using var txn = conn.BeginTransaction();
        var count = 0;
        foreach (var assetId in assetIds)
        {
            var rows = await conn.ExecuteAsync(@"
                INSERT INTO ""Asset_VerificationRegisterItem"" (
                    ""VerificationRegister_ID"", ""AssetRegisterItem_ID"",
                    ""MunicipalAssetID"", ""Description"", ""Barcode"", ""SerialNumber"",
                    ""AssetType_ID"", ""AssetCategory_ID"", ""Asset_SubCategory_ID"", ""AssetClass_ID"",
                    ""Town_ID"", ""MunicipalDepartment_ID"", ""Building_ID"", ""FloorID"", ""Room_ID"",
                    ""PurchaseAmount"", ""CarryingAmountClosingBalance"",
                    ""Custodian_ID"", ""AssetCondition_ID"", ""AssetStatus_ID"",
                    ""latitude"", ""longitude"", ""GPSCoordinates"",
                    ""VerificationDate"", ""Temp_VerificationDate"",
                    ""ParentAssetRegisterItem_ID"", ""MainAssetDescription"", ""MainAssetID"",
                    ""OldBarCode"", ""ImageRef"", ""MeasurementType_ID"",
                    ""InfrastructurOrNonInfrastructure"", ""VerificationDoneBy"",
                    ""UoM"", ""Dim1"", ""Dim2"", ""Dim3"", ""Quantity"", ""Diameter"", ""Capacity"",
                    ""ErfNumber"", ""ErfSizeM2"", ""PortionNumber"", ""UnitNumber"", ""RegistrationNumber"",
                    ""CustodianIdNumber"", ""BasicMunicipalityService"", ""AssetOwnership_ID"",
                    ""DivisionID"", ""Street_ID"", ""Ward_ID"", ""Zoning_ID"", ""Floor_Area"", ""SuburbID"",
                    ""Make"", ""Model"")
                SELECT
                    @registerId, a.""AssetRegisterItem_ID"",
                    a.""MunicipalAssetID"", a.""Description"", a.""Barcode"", a.""SerialNumber"",
                    a.""AssetType_ID"", a.""AssetCategory_ID"", a.""Asset_SubCategory_ID"", a.""AssetClass_ID"",
                    a.""Town_ID"", a.""MunicipalDepartment_ID"", a.""Building_ID"", a.""FloorID"", a.""Room_ID"",
                    a.""PurchaseAmount"", a.""CarryingAmountClosingBalance"",
                    a.""Custodian_ID"", a.""AssetCondition_ID"", a.""AssetStatus_ID"",
                    a.""latitude"", a.""longitude"", a.""GPSCoordinates"",
                    a.""VerificationDate"", a.""VerificationDate"",
                    a.""ParentAssetRegisterItem_ID"", a.""MainAssetDescription"", a.""MainAssetID"",
                    a.""OldBarCode"", a.""ImageRef"", a.""MeasurementType_ID"",
                    a.""InfrastructurOrNonInfrastructure"", NULL,
                    a.""UoM"", a.""Dim1"", a.""Dim2"", a.""Dim3"", a.""Quantity"", a.""Diameter"", a.""Capacity"",
                    a.""ErfNumber"", a.""ErfSizeM2"", a.""PortionNumber"", a.""UnitNumber"", a.""RegistrationNumber"",
                    a.""CustodianIdNumber"", a.""BasicMunicipalityService"", a.""AssetOwnership_ID"",
                    a.""DivisionID"", a.""Street_ID"", a.""Ward_ID"", a.""Zoning_ID"", a.""Floor_Area"", a.""SuburbID"",
                    a.""Make"", a.""Model""
                FROM ""Asset_Register_Items"" a
                WHERE a.""AssetRegisterItem_ID"" = @assetId
                AND NOT EXISTS (
                    SELECT 1 FROM ""Asset_VerificationRegisterItem"" vi
                    WHERE vi.""VerificationRegister_ID"" = @registerId AND vi.""AssetRegisterItem_ID"" = @assetId
                )", new { registerId = id, assetId }, txn);
            count += rows;
        }
        txn.Commit();
        return Ok(new { created = count });
    }

    [HttpPost("{id:int}/move-to-history")]
    public async Task<IActionResult> MoveToHistory(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Asset_VerificationRegister"" SET ""IsHistory"" = 1, ""DateModified"" = NOW(), ""ModifierID"" = 1
            WHERE ""VerificationRegister_ID"" = @id AND ""IsHistory"" = 0", new { id });
        return rows == 0 ? NotFound(new { error = "Register not found or already in history" }) : Ok(new { success = 1 });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        using var txn = conn.BeginTransaction();
        await conn.ExecuteAsync(@"DELETE FROM ""Asset_VerificationAuditTrail"" WHERE ""VerificationItem_ID"" IN (SELECT ""VerificationItem_ID"" FROM ""Asset_VerificationRegisterItem"" WHERE ""VerificationRegister_ID"" = @id)", new { id }, txn);
        await conn.ExecuteAsync(@"DELETE FROM ""Asset_VerificationRegisterItem"" WHERE ""VerificationRegister_ID"" = @id", new { id }, txn);
        var rows = await conn.ExecuteAsync(@"DELETE FROM ""Asset_VerificationRegister"" WHERE ""VerificationRegister_ID"" = @id", new { id }, txn);
        if (rows == 0) { txn.Rollback(); return NotFound(new { error = "Register not found" }); }
        txn.Commit();
        return Ok(new { success = 1 });
    }

    [HttpGet("{id:int}/team-members")]
    public async Task<IActionResult> GetRegisterTeamMembers(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"
            SELECT
                tm.""RegisterTeamMember_ID"" AS ""registerTeamMemberId"",
                tm.""VerificationRegister_ID"" AS ""verificationRegisterId"",
                tm.""Employee_ID"" AS ""employeeId"",
                COALESCE(tm.""EmployeeName"", '') AS ""employeeFullName"",
                tm.""EmployeeName"" AS ""employeeName"",
                tm.""IsExternal"" AS ""isExternal""
            FROM ""Asset_VerificationRegisterTeamMember"" tm
            WHERE tm.""VerificationRegister_ID"" = @id
            ORDER BY tm.""RegisterTeamMember_ID""", new { id });
        return Ok(items);
    }

    [HttpPost("{id:int}/team-members")]
    public async Task<IActionResult> AddRegisterTeamMember(int id, [FromBody] Dictionary<string, object?> model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var isExternal = model.ContainsKey("isExternal") && model["isExternal"] is System.Text.Json.JsonElement je && je.GetInt32() == 1 ? 1 : 0;
        var employeeId = (model.ContainsKey("employeeId") && model["employeeId"] is System.Text.Json.JsonElement eid && eid.ValueKind != System.Text.Json.JsonValueKind.Null)
            ? (int?)eid.GetInt32() : null;
        var employeeName = (model.ContainsKey("employeeName") && model["employeeName"] is System.Text.Json.JsonElement ename && ename.ValueKind == System.Text.Json.JsonValueKind.String)
            ? ename.GetString() : null;
        if (isExternal == 0 && employeeId != null) {
            var dup = await conn.ExecuteScalarAsync<int>(@"
                SELECT COUNT(*) FROM ""Asset_VerificationRegisterTeamMember""
                WHERE ""VerificationRegister_ID"" = @id AND ""Employee_ID"" = @employeeId", new { id, employeeId });
            if (dup > 0) return Conflict(new { error = "Team member already exists" });
        }
        var newId = await conn.ExecuteScalarAsync<int>(@"
            INSERT INTO ""Asset_VerificationRegisterTeamMember""
                (""VerificationRegister_ID"", ""Employee_ID"", ""EmployeeName"", ""IsExternal"")
            VALUES (@id, @employeeId, @employeeName, @isExternal)
            RETURNING ""RegisterTeamMember_ID""", new { id, employeeId, employeeName, isExternal });
        return Ok(new { registerTeamMemberId = newId });
    }

    [HttpDelete("{registerId:int}/team-members/{memberId:int}")]
    public async Task<IActionResult> RemoveRegisterTeamMember(int registerId, int memberId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.ExecuteAsync(@"
            DELETE FROM ""Asset_VerificationRegisterTeamMember""
            WHERE ""RegisterTeamMember_ID"" = @memberId AND ""VerificationRegister_ID"" = @registerId",
            new { memberId, registerId });
        return rows == 0 ? NotFound(new { error = "Team member not found" }) : Ok(new { success = 1 });
    }

    [HttpPost("{registerId:int}/sync-plan-team/{planId:int}")]
    public async Task<IActionResult> SyncPlanTeam(int registerId, int planId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        using var txn = conn.BeginTransaction();
        // Register team members → Plan as Verification Officers (no dups by Employee_ID or EmployeeName)
        var regMembers = (await conn.QueryAsync<dynamic>(@"
            SELECT ""Employee_ID"" AS ""employeeId"", ""EmployeeName"" AS ""employeeName"", ""IsExternal"" AS ""isExternal""
            FROM ""Asset_VerificationRegisterTeamMember"" WHERE ""VerificationRegister_ID"" = @registerId", new { registerId }, txn)).AsList();
        foreach (var rm in regMembers)
        {
            int? empId = rm.employeeId;
            string? empName = rm.employeeName;
            int isExt = rm.isExternal;
            int dup;
            if (empId != null) {
                dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(*) FROM ""Asset_VerificationPlanTeamMember"" WHERE ""VerificationPlan_ID"" = @planId AND ""Employee_ID"" = @empId", new { planId, empId }, txn);
            } else {
                dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(*) FROM ""Asset_VerificationPlanTeamMember"" WHERE ""VerificationPlan_ID"" = @planId AND ""EmployeeName"" = @empName", new { planId, empName }, txn);
            }
            if (dup == 0) {
                await conn.ExecuteAsync(@"INSERT INTO ""Asset_VerificationPlanTeamMember"" (""VerificationPlan_ID"", ""Role"", ""Employee_ID"", ""EmployeeName"", ""IsExternal"") VALUES (@planId, 'Verification Officers', @empId, @empName, @isExt)", new { planId, empId, empName, isExt }, txn);
            }
        }
        // Plan team members → Register (no dups by Employee_ID or EmployeeName)
        var planMembers = (await conn.QueryAsync<dynamic>(@"
            SELECT ""Employee_ID"" AS ""employeeId"", ""EmployeeName"" AS ""employeeName"", ""IsExternal"" AS ""isExternal""
            FROM ""Asset_VerificationPlanTeamMember"" WHERE ""VerificationPlan_ID"" = @planId", new { planId }, txn)).AsList();
        foreach (var pm in planMembers)
        {
            int? empId = pm.employeeId;
            string? empName = pm.employeeName;
            int isExt = pm.isExternal;
            int dup;
            if (empId != null) {
                dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(*) FROM ""Asset_VerificationRegisterTeamMember"" WHERE ""VerificationRegister_ID"" = @registerId AND ""Employee_ID"" = @empId", new { registerId, empId }, txn);
            } else {
                dup = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(*) FROM ""Asset_VerificationRegisterTeamMember"" WHERE ""VerificationRegister_ID"" = @registerId AND ""EmployeeName"" = @empName", new { registerId, empName }, txn);
            }
            if (dup == 0) {
                await conn.ExecuteAsync(@"INSERT INTO ""Asset_VerificationRegisterTeamMember"" (""VerificationRegister_ID"", ""Employee_ID"", ""EmployeeName"", ""IsExternal"") VALUES (@registerId, @empId, @empName, @isExt)", new { registerId, empId, empName, isExt }, txn);
            }
        }
        txn.Commit();
        return Ok(new { success = 1 });
    }

    [HttpGet("{id:int}/dashboard-stats")]
    public async Task<IActionResult> GetDashboardStats(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        // Register date range
        var regDates = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT ""StartDate"" AS ""startDate"", ""EndDate"" AS ""endDate""
            FROM ""Asset_VerificationRegister"" WHERE ""VerificationRegister_ID"" = @id", new { id });
        // Per asset type: total items, verified count per team member, keep/dispose/not-found counts
        var byType = await conn.QueryAsync<dynamic>(@"
            SELECT
                vi.""AssetType_ID"" AS ""assetTypeId"",
                COALESCE(at.""AssetTypeDesc"", 'Unknown') AS ""assetTypeDesc"",
                COUNT(*) AS ""totalItems"",
                COUNT(CASE WHEN vi.""VerificationDoneBy"" IS NOT NULL THEN 1 END) AS ""verifiedItems"",
                COUNT(CASE WHEN vi.""Keep_on_Register_Dispose"" = 'Keep' THEN 1 END) AS ""keepItems"",
                COUNT(CASE WHEN vi.""Keep_on_Register_Dispose"" = 'Dispose' THEN 1 END) AS ""disposeItems"",
                COUNT(CASE WHEN vi.""Asset_Found"" = 'Asset Not Found' THEN 1 END) AS ""notFoundItems""
            FROM ""Asset_VerificationRegisterItem"" vi
            LEFT JOIN ""Const_AssetType_Sys"" at ON vi.""AssetType_ID"" = at.""AssetType_ID""
            WHERE vi.""VerificationRegister_ID"" = @id
            GROUP BY vi.""AssetType_ID"", at.""AssetTypeDesc""
            ORDER BY vi.""AssetType_ID""", new { id });
        // Per team member per asset type: how many verified
        var byMemberType = await conn.QueryAsync<dynamic>(@"
            SELECT
                vi.""AssetType_ID"" AS ""assetTypeId"",
                vi.""VerificationDoneBy"" AS ""teamMemberId"",
                COALESCE(tm.""EmployeeName"", vi.""VerificationDoneBy""::TEXT) AS ""memberName"",
                COUNT(*) AS ""verifiedCount""
            FROM ""Asset_VerificationRegisterItem"" vi
            LEFT JOIN ""Asset_VerificationRegisterTeamMember"" tm ON tm.""RegisterTeamMember_ID"" = vi.""VerificationDoneBy""
            WHERE vi.""VerificationRegister_ID"" = @id AND vi.""VerificationDoneBy"" IS NOT NULL
            GROUP BY vi.""AssetType_ID"", vi.""VerificationDoneBy"", tm.""EmployeeName""
            ORDER BY vi.""AssetType_ID"", ""verifiedCount"" DESC", new { id });
        // Daily progress per team member
        var dailyProgress = await conn.QueryAsync<dynamic>(@"
            SELECT
                DATE(vi.""Temp_VerificationDate"") AS ""date"",
                vi.""VerificationDoneBy"" AS ""teamMemberId"",
                COALESCE(tm.""EmployeeName"", vi.""VerificationDoneBy""::TEXT) AS ""memberName"",
                COUNT(*) AS ""verifiedCount""
            FROM ""Asset_VerificationRegisterItem"" vi
            LEFT JOIN ""Asset_VerificationRegisterTeamMember"" tm ON tm.""RegisterTeamMember_ID"" = vi.""VerificationDoneBy""
            WHERE vi.""VerificationRegister_ID"" = @id AND vi.""VerificationDoneBy"" IS NOT NULL AND vi.""Temp_VerificationDate"" IS NOT NULL
            GROUP BY DATE(vi.""Temp_VerificationDate""), vi.""VerificationDoneBy"", tm.""EmployeeName""
            ORDER BY ""date"", ""memberName""", new { id });
        return Ok(new { byType, byMemberType, dailyProgress, registerStartDate = regDates?.startDate, registerEndDate = regDates?.endDate });
    }

    [HttpGet("/api/assets/{assetId:int}/verification-audit-trail")]
    public async Task<IActionResult> GetAssetVerificationAuditTrail(int assetId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var fieldLabelCase = @"
            CASE at.""FieldName""
                WHEN 'AssetCondition_ID' THEN 'Condition'
                WHEN 'AssetStatus_ID' THEN 'Asset Status'
                WHEN 'MeasurementType_ID' THEN 'Measurement Type'
                WHEN 'UoM' THEN 'Unit of Measure'
                WHEN 'Town_ID' THEN 'Town'
                WHEN 'SuburbID' THEN 'Suburb'
                WHEN 'Ward_ID' THEN 'Ward'
                WHEN 'Street_ID' THEN 'Street'
                WHEN 'Building_ID' THEN 'Building'
                WHEN 'FloorID' THEN 'Floor'
                WHEN 'Room_ID' THEN 'Room'
                WHEN 'Zoning_ID' THEN 'Zoning'
                WHEN 'MunicipalDepartment_ID' THEN 'Department'
                WHEN 'DivisionID' THEN 'Division'
                WHEN 'Custodian_ID' THEN 'Custodian'
                WHEN 'CustodianIdNumber' THEN 'Custodian ID Number'
                WHEN 'VerificationDoneBy' THEN 'Verified By'
                WHEN 'AssetOwnership_ID' THEN 'Ownership'
                WHEN 'BasicMunicipalityService' THEN 'Municipal Service'
                WHEN 'Quantity' THEN 'Quantity'
                WHEN 'Dim1' THEN 'Dimension 1'
                WHEN 'Dim2' THEN 'Dimension 2'
                WHEN 'Dim3' THEN 'Dimension 3'
                WHEN 'Diameter' THEN 'Diameter'
                WHEN 'Capacity' THEN 'Capacity'
                WHEN 'ErfNumber' THEN 'Erf Number'
                WHEN 'ErfSizeM2' THEN 'Erf Size (m²)'
                WHEN 'PortionNumber' THEN 'Portion Number'
                WHEN 'UnitNumber' THEN 'Unit Number'
                WHEN 'Floor_Area' THEN 'Floor Area'
                WHEN 'latitude' THEN 'Latitude'
                WHEN 'longitude' THEN 'Longitude'
                WHEN 'Temp_VerificationDate' THEN 'Verification Date'
                WHEN 'Verification_Comments' THEN 'Comments'
                WHEN 'Asset_Found' THEN 'Asset Found'
                WHEN 'Keep_on_Register_Dispose' THEN 'Keep/Dispose'
                WHEN 'Verification_Flag' THEN 'Verification Status'
                ELSE at.""FieldName""
            END";

        var resolveValueSql = @"
            CASE at.""FieldName""
                WHEN 'AssetCondition_ID' THEN (SELECT c.""Description"" FROM ""Const_Asset_Condition"" c WHERE c.""Asset_Condition_ID"" = CAST(NULLIF({0},'') AS INTEGER))
                WHEN 'AssetStatus_ID' THEN (SELECT s.""AssetStatusDesc"" FROM ""Const_AssetStatus_Sys"" s WHERE s.""AssetStatus_ID"" = CAST(NULLIF({0},'') AS INTEGER))
                WHEN 'MeasurementType_ID' THEN (SELECT m.""Name"" FROM ""AssetConfig_MeasurementType"" m WHERE m.""AssetConfig_MeasurementType_ID"" = CAST(NULLIF({0},'') AS INTEGER))
                WHEN 'UoM' THEN {0}
                WHEN 'Town_ID' THEN {0}
                WHEN 'SuburbID' THEN {0}
                WHEN 'Ward_ID' THEN {0}
                WHEN 'Street_ID' THEN {0}
                WHEN 'Building_ID' THEN {0}
                WHEN 'FloorID' THEN {0}
                WHEN 'Room_ID' THEN {0}
                WHEN 'MunicipalDepartment_ID' THEN {0}
                WHEN 'DivisionID' THEN {0}
                WHEN 'Custodian_ID' THEN {0}
                WHEN 'VerificationDoneBy' THEN (SELECT COALESCE(tm2.""EmployeeName"", {0}) FROM ""Asset_VerificationRegisterTeamMember"" tm2 WHERE tm2.""RegisterTeamMember_ID"" = CAST(NULLIF({0},'') AS INTEGER) LIMIT 1)
                WHEN 'AssetOwnership_ID' THEN (SELECT o.""AssetOwnershipDesc"" FROM ""Const_AssetOwnership"" o WHERE o.""AssetOwnership_ID"" = CAST(NULLIF({0},'') AS INTEGER))
                WHEN 'BasicMunicipalityService' THEN (SELECT ms.""AssetMunicipalServicesDesc"" FROM ""Const_Asset_CIDMS_Municipal_Services"" ms WHERE ms.""AssetMunicipalServicesID"" = CAST(NULLIF({0},'') AS INTEGER))
                ELSE {0}
            END";

        var oldValueResolved = string.Format(resolveValueSql, @"at.""OldValue""");
        var newValueResolved = string.Format(resolveValueSql, @"at.""NewValue""");

        var sql = $@"
            SELECT
                at.""AuditTrail_ID""       AS ""auditTrailId"",
                at.""VerificationItem_ID""  AS ""verificationItemId"",
                {fieldLabelCase}            AS ""fieldName"",
                {oldValueResolved}          AS ""oldValue"",
                {newValueResolved}          AS ""newValue"",
                at.""ChangedByID""          AS ""changedById"",
                at.""ChangedByName""        AS ""changedByName"",
                at.""ChangedAt""            AS ""changedAt"",
                vr.""RegisterName""         AS ""registerName"",
                vr.""StartDate""            AS ""startDate"",
                vr.""EndDate""              AS ""endDate"",
                vr.""VerificationRegister_ID"" AS ""verificationRegisterId""
            FROM ""Asset_VerificationAuditTrail"" at
            INNER JOIN ""Asset_VerificationRegisterItem"" vi ON at.""VerificationItem_ID"" = vi.""VerificationItem_ID""
            INNER JOIN ""Asset_VerificationRegister"" vr ON vi.""VerificationRegister_ID"" = vr.""VerificationRegister_ID""
            WHERE vi.""AssetRegisterItem_ID"" = @assetId
              AND vi.""Verification_Flag"" = 'Approved'
            ORDER BY at.""ChangedAt"" DESC, at.""AuditTrail_ID"" DESC";
        var items = await conn.QueryAsync<dynamic>(sql, new { assetId });
        return Ok(items);
    }

    [HttpGet("report")]
    public async Task<IActionResult> GetReport(
        [FromQuery] int registerId,
        [FromQuery] string reportType,
        [FromQuery] string? assetClassIds)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var sql = @"
            SELECT
                vi.""VerificationItem_ID""              AS ""verificationItemId"",
                vi.""VerificationRegister_ID""          AS ""verificationRegisterId"",
                vi.""AssetRegisterItem_ID""             AS ""assetRegisterItemId"",
                vi.""MunicipalAssetID""                 AS ""municipalAssetId"",
                vi.""Description""                      AS ""description"",
                vi.""Barcode""                          AS ""barcode"",
                vi.""OldBarCode""                       AS ""oldBarCode"",
                vi.""SerialNumber""                     AS ""serialNumber"",
                vi.""RegistrationNumber""               AS ""registrationNumber"",
                vi.""ParentAssetRegisterItem_ID""       AS ""parentAssetRegisterItemId"",
                vi.""MainAssetID""                      AS ""mainAssetId"",
                vi.""MainAssetDescription""             AS ""mainAssetDescription"",
                vi.""Make""                             AS ""make"",
                vi.""Model""                            AS ""model"",
                vi.""ImageRef""                         AS ""imageRef"",
                vi.""AssetType_ID""                     AS ""assetTypeId"",
                COALESCE(at2.""AssetTypeDesc"", '')     AS ""assetTypeDesc"",
                vi.""AssetCategory_ID""                 AS ""assetCategoryId"",
                COALESCE(ac.""AssetCategoryDesc"", '')  AS ""assetCategoryDesc"",
                vi.""Asset_SubCategory_ID""             AS ""assetSubCategoryId"",
                COALESCE(asc2.""Asset_SubCategoryDescription"", '') AS ""assetSubCategoryDesc"",
                vi.""AssetClass_ID""                    AS ""assetClassId"",
                COALESCE(acl.""AssetClassDesc"", '')    AS ""assetClassDesc"",
                vi.""InfrastructurOrNonInfrastructure"" AS ""infraOrNonInfra"",
                vi.""MeasurementType_ID""               AS ""measurementTypeId"",
                COALESCE(mt.""Name"", '')               AS ""measurementTypeDesc"",
                vi.""UoM""                              AS ""uom"",
                vi.""Dim1""                             AS ""dim1"",
                vi.""Dim2""                             AS ""dim2"",
                vi.""Dim3""                             AS ""dim3"",
                vi.""Quantity""                         AS ""quantity"",
                vi.""Diameter""                         AS ""diameter"",
                vi.""Capacity""                         AS ""capacity"",
                vi.""AssetCondition_ID""                AS ""assetConditionId"",
                COALESCE(cond.""Description"", '')      AS ""conditionDesc"",
                vi.""AssetStatus_ID""                   AS ""assetStatusId"",
                COALESCE(st.""AssetStatusDesc"", '')    AS ""statusDesc"",
                vi.""Town_ID""                          AS ""townId"",
                vi.""SuburbID""                         AS ""suburbId"",
                vi.""Ward_ID""                          AS ""wardId"",
                vi.""Street_ID""                        AS ""streetId"",
                vi.""Building_ID""                      AS ""buildingId"",
                vi.""FloorID""                          AS ""floorId"",
                vi.""Room_ID""                          AS ""roomId"",
                vi.""Zoning_ID""                        AS ""zoningId"",
                vi.""ErfNumber""                        AS ""erfNumber"",
                vi.""ErfSizeM2""                        AS ""erfSizeM2"",
                vi.""PortionNumber""                    AS ""portionNumber"",
                vi.""UnitNumber""                       AS ""unitNumber"",
                vi.""Floor_Area""                       AS ""floorArea"",
                vi.""latitude""                         AS ""latitude"",
                vi.""longitude""                        AS ""longitude"",
                vi.""GPSCoordinates""                   AS ""gpsCoordinates"",
                vi.""MunicipalDepartment_ID""           AS ""municipalDepartmentId"",
                '' AS ""departmentDesc"",
                vi.""DivisionID""                       AS ""divisionId"",
                '' AS ""divisionName"",
                vi.""Custodian_ID""                     AS ""custodianId"",
                '' AS ""custodianName"",
                vi.""CustodianIdNumber""                AS ""custodianIdNumber"",
                vi.""AssetOwnership_ID""                AS ""assetOwnershipId"",
                COALESCE(ao.""AssetOwnershipDesc"", '') AS ""assetOwnershipDesc"",
                vi.""BasicMunicipalityService""         AS ""basicMunicipalityService"",
                COALESCE(bms.""AssetMunicipalServicesDesc"", '') AS ""basicMunicipalityServiceDesc"",
                vi.""PurchaseAmount""                   AS ""purchaseAmount"",
                vi.""CarryingAmountClosingBalance""     AS ""carryingAmount"",
                vi.""Verification_Flag""                AS ""verificationFlag"",
                vi.""VerificationDoneBy""               AS ""verificationDoneBy"",
                COALESCE(vdbtm.""EmployeeName"", '') AS ""verificationDoneByName"",
                vi.""VerificationDate""                 AS ""verificationDate"",
                vi.""Verification_Comments""            AS ""verificationComments"",
                vi.""Asset_Found""                      AS ""assetFound"",
                vi.""Keep_on_Register_Dispose""         AS ""keepOnRegisterDispose"",
                vi.""Revisit""                          AS ""revisit"",
                vi.""Reason_for_Revisit""               AS ""reasonForRevisit""
            FROM ""Asset_VerificationRegisterItem"" vi
            LEFT JOIN ""Const_AssetType_Sys"" at2 ON vi.""AssetType_ID"" = at2.""AssetType_ID""
            LEFT JOIN ""Const_AssetCategory_sys"" ac ON vi.""AssetCategory_ID"" = ac.""AssetCategoryID""
            LEFT JOIN ""Const_Asset_SubCategory"" asc2 ON vi.""Asset_SubCategory_ID"" = asc2.""Asset_SubCategory_ID""
            LEFT JOIN ""Const_AssetClass_sys"" acl ON vi.""AssetClass_ID"" = acl.""AssetClass_ID""
            LEFT JOIN ""Const_Asset_Condition"" cond ON vi.""AssetCondition_ID"" = cond.""Asset_Condition_ID""
            LEFT JOIN ""Const_AssetStatus_Sys"" st ON vi.""AssetStatus_ID"" = st.""AssetStatus_ID""
            LEFT JOIN ""AssetConfig_MeasurementType"" mt ON vi.""MeasurementType_ID"" = mt.""AssetConfig_MeasurementType_ID""
            LEFT JOIN ""Const_AssetOwnership"" ao ON vi.""AssetOwnership_ID"" = ao.""AssetOwnership_ID""
            LEFT JOIN ""Const_Asset_CIDMS_Municipal_Services"" bms ON vi.""BasicMunicipalityService"" = bms.""AssetMunicipalServicesID""
            LEFT JOIN ""Asset_VerificationRegisterTeamMember"" vdbtm ON vi.""VerificationDoneBy"" = vdbtm.""RegisterTeamMember_ID""
            WHERE vi.""VerificationRegister_ID"" = @registerId";

        var p = new DynamicParameters();
        p.Add("registerId", registerId);

        switch (reportType)
        {
            case "verified":
                sql += @" AND vi.""VerificationDate"" IS NOT NULL";
                break;
            case "unverified":
                sql += @" AND vi.""VerificationDate"" IS NULL";
                break;
            case "newly-added":
                sql += @" AND vi.""VerificationDate"" IS NOT NULL AND vi.""Asset_Found"" = 'Newly Added Asset'";
                break;
            case "not-found":
                sql += @" AND vi.""VerificationDate"" IS NOT NULL AND vi.""Asset_Found"" = 'Asset Not Found'";
                break;
            case "completed-projects":
                sql += @" AND vi.""VerificationDate"" IS NOT NULL AND vi.""Asset_Found"" = 'Completed Projects'";
                break;
            case "asset-removed":
                sql += @" AND vi.""VerificationDate"" IS NOT NULL AND vi.""Asset_Found"" = 'Asset Removed'";
                break;
            case "flagged-revisit":
                sql += @" AND vi.""VerificationDate"" IS NOT NULL AND vi.""Revisit"" = 1";
                break;
            default:
                return BadRequest(new { error = "Unknown reportType: " + reportType });
        }

        if (!string.IsNullOrWhiteSpace(assetClassIds))
        {
            var classIdList = assetClassIds.Split(',')
                .Select(s => int.TryParse(s.Trim(), out var n) ? (int?)n : null)
                .Where(n => n.HasValue).Select(n => n!.Value).ToArray();
            if (classIdList.Length > 0)
            {
                sql += @" AND vi.""AssetClass_ID"" = ANY(@classIds)";
                p.Add("classIds", classIdList);
            }
        }

        sql += @" ORDER BY vi.""VerificationItem_ID""";
        var items = await conn.QueryAsync<dynamic>(sql, p);
        return Ok(items);
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
        p.Add("registerName", Get<string>("registerName"));
        p.Add("registerType", Get<string>("registerType"));
        p.Add("description", Get<string>("description"));
        p.Add("startDate", Get<DateTime?>("startDate"));
        p.Add("endDate", Get<DateTime?>("endDate"));
        p.Add("dashboardUrl", Get<string>("dashboardUrl"));
        p.Add("teamMembers", Get<string>("teamMembers"));
        return p;
    }
}

[ApiController]
[Route("api/verification-items")]
public class VerificationRegisterItemController : ControllerBase
{
    private readonly DbConnectionFactory _db;

    public VerificationRegisterItemController(DbConnectionFactory db) => _db = db;

    private static string ItemSelect => @"
        SELECT
            vi.""VerificationItem_ID""          AS ""verificationItemId"",
            vi.""VerificationRegister_ID""      AS ""verificationRegisterId"",
            vi.""AssetRegisterItem_ID""         AS ""assetRegisterItemId"",
            vi.""MunicipalAssetID""             AS ""municipalAssetId"",
            vi.""Description""                  AS ""description"",
            vi.""Barcode""                      AS ""barcode"",
            vi.""SerialNumber""                 AS ""serialNumber"",
            vi.""AssetType_ID""                 AS ""assetTypeId"",
            COALESCE(at.""AssetTypeDesc"", '')  AS ""assetTypeDesc"",
            vi.""AssetCategory_ID""             AS ""assetCategoryId"",
            COALESCE(ac.""AssetCategoryDesc"", '') AS ""assetCategoryDesc"",
            vi.""Asset_SubCategory_ID""         AS ""assetSubCategoryId"",
            COALESCE(asc2.""Asset_SubCategoryDescription"", '') AS ""assetSubCategoryDesc"",
            vi.""AssetClass_ID""                AS ""assetClassId"",
            COALESCE(acl.""AssetClassDesc"", '') AS ""assetClassDesc"",
            vi.""MunicipalDepartment_ID""       AS ""municipalDepartmentId"",
            '' AS ""departmentDesc"",
            vi.""PurchaseAmount""               AS ""purchaseAmount"",
            vi.""CarryingAmountClosingBalance""  AS ""carryingAmount"",
            vi.""Custodian_ID""                 AS ""custodianId"",
            '' AS ""custodianName"",
            vi.""AssetCondition_ID""            AS ""assetConditionId"",
            COALESCE(cond.""Description"", '')  AS ""conditionDesc"",
            vi.""AssetStatus_ID""               AS ""assetStatusId"",
            COALESCE(st.""AssetStatusDesc"", '') AS ""statusDesc"",
            vi.""latitude""                     AS ""latitude"",
            vi.""longitude""                    AS ""longitude"",
            vi.""GPSCoordinates""               AS ""gpsCoordinates"",
            vi.""VerificationDate""             AS ""verificationDate"",
            vi.""Temp_VerificationDate""        AS ""tempVerificationDate"",
            vi.""Verification_Flag""            AS ""verificationFlag"",
            vi.""Verification_Comments""        AS ""verificationComments"",
            vi.""Asset_Found""                  AS ""assetFound"",
            vi.""Keep_on_Register_Dispose""     AS ""keepOnRegisterDispose"",
            vi.""Revisit""                      AS ""revisit"",
            vi.""Reason_for_Revisit""           AS ""reasonForRevisit"",
            vi.""ParentAssetRegisterItem_ID""   AS ""parentAssetRegisterItemId"",
            vi.""MainAssetDescription""         AS ""mainAssetDescription"",
            vi.""MainAssetID""                  AS ""mainAssetId"",
            vi.""OldBarCode""                   AS ""oldBarCode"",
            vi.""ImageRef""                     AS ""imageRef"",
            vi.""MeasurementType_ID""           AS ""measurementTypeId"",
            COALESCE(mt.""Name"", '') AS ""measurementTypeDesc"",
            vi.""InfrastructurOrNonInfrastructure"" AS ""infraOrNonInfra"",
            vi.""VerificationDoneBy""           AS ""verificationDoneBy"",
            COALESCE(vdbtm.""EmployeeName"", '') AS ""verificationDoneByName"",
            vi.""UoM""                          AS ""uom"",
            vi.""Dim1""                         AS ""dim1"",
            vi.""Dim2""                         AS ""dim2"",
            vi.""Dim3""                         AS ""dim3"",
            vi.""Quantity""                     AS ""quantity"",
            vi.""Diameter""                     AS ""diameter"",
            vi.""Capacity""                     AS ""capacity"",
            vi.""ErfNumber""                    AS ""erfNumber"",
            vi.""ErfSizeM2""                    AS ""erfSizeM2"",
            vi.""PortionNumber""                AS ""portionNumber"",
            vi.""UnitNumber""                   AS ""unitNumber"",
            vi.""RegistrationNumber""           AS ""registrationNumber"",
            vi.""CustodianIdNumber""            AS ""custodianIdNumber"",
            vi.""BasicMunicipalityService""     AS ""basicMunicipalityService"",
            COALESCE(bms.""AssetMunicipalServicesDesc"", '') AS ""basicMunicipalityServiceDesc"",
            vi.""AssetOwnership_ID""            AS ""assetOwnershipId"",
            COALESCE(ao.""AssetOwnershipDesc"", '') AS ""assetOwnershipDesc"",
            vi.""DivisionID""                   AS ""divisionId"",
            '' AS ""divisionName"",
            vi.""Town_ID""                      AS ""townId"",
            vi.""Street_ID""                    AS ""streetId"",
            vi.""Building_ID""                  AS ""buildingId"",
            vi.""FloorID""                      AS ""floorId"",
            vi.""Room_ID""                      AS ""roomId"",
            vi.""Ward_ID""                      AS ""wardId"",
            vi.""SuburbID""                     AS ""suburbId"",
            vi.""Zoning_ID""                    AS ""zoningId"",
            vi.""Floor_Area""                   AS ""floorArea"",
            vi.""Make""                         AS ""make"",
            vi.""Model""                        AS ""model""
        FROM ""Asset_VerificationRegisterItem"" vi
        LEFT JOIN ""Const_AssetType_Sys"" at ON vi.""AssetType_ID"" = at.""AssetType_ID""
        LEFT JOIN ""Const_AssetCategory_sys"" ac ON vi.""AssetCategory_ID"" = ac.""AssetCategoryID""
        LEFT JOIN ""Const_Asset_SubCategory"" asc2 ON vi.""Asset_SubCategory_ID"" = asc2.""Asset_SubCategory_ID""
        LEFT JOIN ""Const_AssetClass_sys"" acl ON vi.""AssetClass_ID"" = acl.""AssetClass_ID""
        LEFT JOIN ""Const_Asset_Condition"" cond ON vi.""AssetCondition_ID"" = cond.""Asset_Condition_ID""
        LEFT JOIN ""Const_AssetStatus_Sys"" st ON vi.""AssetStatus_ID"" = st.""AssetStatus_ID""
        LEFT JOIN ""AssetConfig_MeasurementType"" mt ON vi.""MeasurementType_ID"" = mt.""AssetConfig_MeasurementType_ID""
        LEFT JOIN ""Const_AssetOwnership"" ao ON vi.""AssetOwnership_ID"" = ao.""AssetOwnership_ID""
        LEFT JOIN ""Asset_VerificationRegisterTeamMember"" vdbtm ON vi.""VerificationDoneBy"" = vdbtm.""RegisterTeamMember_ID""
        LEFT JOIN ""Const_Asset_CIDMS_Municipal_Services"" bms ON vi.""BasicMunicipalityService"" = bms.""AssetMunicipalServicesID""";

    [HttpGet("by-register/{registerId:int}")]
    public async Task<IActionResult> GetByRegister(int registerId, [FromQuery] string? tab, [FromQuery] string? search)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = ItemSelect + @" WHERE vi.""VerificationRegister_ID"" = @registerId";
        var p = new DynamicParameters();
        p.Add("registerId", registerId);

        if (tab == "manage")
        {
            sql += @" AND (vi.""Verification_Flag"" IS NULL OR vi.""Verification_Flag"" = 'Revisit – Not Approved' OR vi.""Verification_Flag"" = 'Revisited')";
        }
        else if (tab == "approve")
        {
            sql += @" AND vi.""Verification_Flag"" = 'Submitted for Approval'";
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            sql += @" AND (vi.""Description"" ILIKE @search OR vi.""Barcode"" ILIKE @search OR vi.""SerialNumber"" ILIKE @search OR vi.""MunicipalAssetID"" ILIKE @search)";
            p.Add("search", "%" + search + "%");
        }
        sql += @" ORDER BY vi.""VerificationItem_ID""";
        var items = await conn.QueryAsync<dynamic>(sql, p);
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<dynamic>(
            ItemSelect + @" WHERE vi.""VerificationItem_ID"" = @id", new { id });
        return item is null ? NotFound(new { error = "Verification item not found" }) : Ok(item);
    }

    private static readonly (string Header, string Field, string Type)[] CsvColumns = new[]
    {
        ("AssetRegisterItem_ID",       "assetRegisterItemId",        "INTEGER"),
        ("Description",                "description",                "TEXT"),
        ("MunicipalAssetID",           "municipalAssetId",           "TEXT"),
        ("Barcode",                    "barcode",                    "TEXT"),
        ("OldBarCode",                 "oldBarCode",                 "TEXT"),
        ("SerialNumber",               "serialNumber",               "TEXT"),
        ("RegistrationNumber",         "registrationNumber",         "TEXT"),
        ("ParentAssetRegisterItem_ID", "parentAssetRegisterItemId",  "TEXT"),
        ("MainAssetID",                "mainAssetId",                "TEXT"),
        ("MainAssetDescription",       "mainAssetDescription",       "TEXT"),
        ("Make",                       "make",                       "TEXT"),
        ("Model",                      "model",                      "TEXT"),
        ("ImageRef",                   "imageRef",                   "TEXT"),
        ("AssetType_ID",               "assetTypeId",                "INTEGER"),
        ("AssetCategory_ID",           "assetCategoryId",            "INTEGER"),
        ("Asset_SubCategory_ID",       "assetSubCategoryId",         "INTEGER"),
        ("AssetClass_ID",              "assetClassId",               "INTEGER"),
        ("InfrastructurOrNonInfrastructure", "infraOrNonInfra",     "TEXT"),
        ("MeasurementType_ID",         "measurementTypeId",          "INTEGER"),
        ("UoM",                        "uom",                        "INTEGER"),
        ("Dim1",                       "dim1",                       "NUMERIC"),
        ("Dim2",                       "dim2",                       "NUMERIC"),
        ("Dim3",                       "dim3",                       "NUMERIC"),
        ("Quantity",                   "quantity",                   "NUMERIC"),
        ("Diameter",                   "diameter",                   "NUMERIC"),
        ("Capacity",                   "capacity",                   "NUMERIC"),
        ("AssetCondition_ID",          "assetConditionId",           "INTEGER"),
        ("AssetStatus_ID",             "assetStatusId",              "INTEGER"),
        ("Town_ID",                    "townId",                     "INTEGER"),
        ("SuburbID",                   "suburbId",                   "INTEGER"),
        ("Ward_ID",                    "wardId",                     "INTEGER"),
        ("Street_ID",                  "streetId",                   "INTEGER"),
        ("Building_ID",                "buildingId",                 "INTEGER"),
        ("FloorID",                    "floorId",                    "INTEGER"),
        ("Room_ID",                    "roomId",                     "INTEGER"),
        ("Zoning_ID",                  "zoningId",                   "INTEGER"),
        ("ErfNumber",                  "erfNumber",                  "TEXT"),
        ("ErfSizeM2",                  "erfSizeM2",                  "NUMERIC"),
        ("PortionNumber",              "portionNumber",              "TEXT"),
        ("UnitNumber",                 "unitNumber",                 "TEXT"),
        ("Floor_Area",                 "floorArea",                  "NUMERIC"),
        ("latitude",                   "latitude",                   "NUMERIC"),
        ("longitude",                  "longitude",                  "NUMERIC"),
        ("MunicipalDepartment_ID",     "municipalDepartmentId",      "TEXT"),
        ("DivisionID",                 "divisionId",                 "INTEGER"),
        ("Custodian_ID",               "custodianId",                "INTEGER"),
        ("CustodianIdNumber",          "custodianIdNumber",          "TEXT"),
        ("AssetOwnership_ID",          "assetOwnershipId",           "INTEGER"),
        ("BasicMunicipalityService",   "basicMunicipalityService",   "INTEGER"),
        ("PurchaseAmount",             "purchaseAmount",             "NUMERIC"),
        ("CarryingAmount",             "carryingAmount",             "NUMERIC"),
        ("Verification_Flag",          "verificationFlag",           "TEXT"),
        ("VerificationDoneBy",         "verificationDoneBy",         "INTEGER"),
        ("VerificationDate",           "verificationDate",           "DATE"),
        ("Temp_VerificationDate",      "tempVerificationDate",       "DATE"),
        ("Asset_Found",                "assetFound",                 "TEXT"),
        ("Keep_on_Register_Dispose",   "keepOnRegisterDispose",      "TEXT"),
        ("Revisit",                    "revisit",                    "INTEGER"),
        ("Reason_for_Revisit",         "reasonForRevisit",           "TEXT"),
        ("Verification_Comments",      "verificationComments",       "TEXT"),
    };

    [HttpGet("by-register/{registerId:int}/export-csv")]
    public async Task<IActionResult> ExportCsv(int registerId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(
            ItemSelect + @" WHERE vi.""VerificationRegister_ID"" = @registerId ORDER BY vi.""VerificationItem_ID""",
            new { registerId });

        var sb = new System.Text.StringBuilder();
        sb.AppendLine(string.Join(",", CsvColumns.Select(c => "\"" + c.Header + "\"")));

        IDictionary<string, object?> AsDict(dynamic d) => (IDictionary<string, object?>)d;

        foreach (var row in items)
        {
            var d = AsDict(row);
            var cells = CsvColumns.Select(c =>
            {
                d.TryGetValue(c.Field, out var val);
                var s = val == null ? "" : Convert.ToString(val) ?? "";
                s = s.Replace("\"", "\"\"");
                return "\"" + s + "\"";
            });
            sb.AppendLine(string.Join(",", cells));
        }

        var bytes = System.Text.Encoding.UTF8.GetBytes(sb.ToString());
        return File(bytes, "text/csv", $"VerificationRegister_{registerId}.csv");
    }

    [HttpPost("by-register/{registerId:int}/import-csv")]
    public async Task<IActionResult> ImportCsv(int registerId, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file uploaded" });

        string content;
        using (var reader = new System.IO.StreamReader(file.OpenReadStream()))
            content = await reader.ReadToEndAsync();

        var lines = content.Split('\n').Select(l => l.TrimEnd('\r')).ToList();
        if (lines.Count < 2)
            return BadRequest(new { error = "File must have a header row and at least one data row" });

        var headers = ParseCsvLine(lines[0]);
        if (headers.Count != CsvColumns.Length)
            return BadRequest(new { error = $"Expected {CsvColumns.Length} columns, got {headers.Count}" });

        for (int i = 0; i < CsvColumns.Length; i++)
        {
            if (!string.Equals(headers[i], CsvColumns[i].Header, StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { error = $"Column {i + 1} expected '{CsvColumns[i].Header}', got '{headers[i]}'" });
        }

        var typeErrors = new List<string>();
        var dataRows = new List<List<string>>();
        for (int r = 1; r < lines.Count; r++)
        {
            var line = lines[r];
            if (string.IsNullOrWhiteSpace(line)) continue;
            var cells = ParseCsvLine(line);
            if (cells.Count != CsvColumns.Length)
            {
                typeErrors.Add($"Row {r}: expected {CsvColumns.Length} columns, got {cells.Count}");
                continue;
            }
            for (int c = 0; c < CsvColumns.Length; c++)
            {
                var val = cells[c];
                if (string.IsNullOrWhiteSpace(val)) continue;
                var t = CsvColumns[c].Type;
                if (t == "INTEGER" && !long.TryParse(val, out _))
                    typeErrors.Add(CsvColumns[c].Header);
                else if (t == "NUMERIC" && !double.TryParse(val, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out _))
                    typeErrors.Add(CsvColumns[c].Header);
                else if (t == "DATE" && !DateTime.TryParse(val, out _))
                    typeErrors.Add(CsvColumns[c].Header);
            }
            dataRows.Add(cells);
        }

        var uniqueErrors = typeErrors.Distinct().ToList();
        if (uniqueErrors.Count > 0)
            return BadRequest(new { error = "Data type errors in columns", columns = uniqueErrors });

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var existingItems = await conn.QueryAsync<dynamic>(
            @"SELECT ""VerificationItem_ID"", ""AssetRegisterItem_ID"", ""Verification_Flag""
              FROM ""Asset_VerificationRegisterItem""
              WHERE ""VerificationRegister_ID"" = @registerId", new { registerId });
        var itemMap = existingItems.ToDictionary(
            x => (int)(x.AssetRegisterItem_ID ?? 0),
            x => ((int)(x.VerificationItem_ID ?? 0), (string?)(x.Verification_Flag)));

        int imported = 0, skipped = 0;
        var idxMap = CsvColumns.Select((c, i) => (c, i)).ToDictionary(t => t.c.Field, t => t.i);

        string Cell(List<string> row, string field) { var idx = idxMap[field]; return row[idx]; }
        int? IntCell(List<string> row, string field) { var v = Cell(row, field); return string.IsNullOrWhiteSpace(v) ? null : int.Parse(v); }
        decimal? DecCell(List<string> row, string field) { var v = Cell(row, field); return string.IsNullOrWhiteSpace(v) ? null : decimal.Parse(v, System.Globalization.CultureInfo.InvariantCulture); }
        DateTime? DateCell(List<string> row, string field) { var v = Cell(row, field); return string.IsNullOrWhiteSpace(v) ? null : DateTime.Parse(v); }
        string? StrCell(List<string> row, string field) { var v = Cell(row, field); return string.IsNullOrWhiteSpace(v) ? null : v; }

        foreach (var row in dataRows)
        {
            var assetId = IntCell(row, "assetRegisterItemId");
            if (assetId == null || !itemMap.TryGetValue(assetId.Value, out var entry)) { skipped++; continue; }
            var (viId, flag) = entry;
            if (flag == "Approved") { skipped++; continue; }

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_VerificationRegisterItem"" SET
                    ""MeasurementType_ID"" = @measurementTypeId, ""UoM"" = @uom,
                    ""Dim1"" = @dim1, ""Dim2"" = @dim2, ""Dim3"" = @dim3,
                    ""Quantity"" = @quantity, ""Diameter"" = @diameter, ""Capacity"" = @capacity,
                    ""AssetCondition_ID"" = @assetConditionId, ""AssetStatus_ID"" = @assetStatusId,
                    ""Town_ID"" = @townId, ""SuburbID"" = @suburbId, ""Ward_ID"" = @wardId,
                    ""Street_ID"" = @streetId, ""Building_ID"" = @buildingId, ""FloorID"" = @floorId,
                    ""Room_ID"" = @roomId, ""Zoning_ID"" = @zoningId, ""ErfNumber"" = @erfNumber,
                    ""ErfSizeM2"" = @erfSizeM2, ""PortionNumber"" = @portionNumber, ""UnitNumber"" = @unitNumber,
                    ""Floor_Area"" = @floorArea, ""latitude"" = @latitude, ""longitude"" = @longitude,
                    ""MunicipalDepartment_ID"" = @municipalDepartmentId, ""DivisionID"" = @divisionId,
                    ""Custodian_ID"" = @custodianId, ""CustodianIdNumber"" = @custodianIdNumber,
                    ""AssetOwnership_ID"" = @assetOwnershipId, ""BasicMunicipalityService"" = @basicMunicipalityService,
                    ""Temp_VerificationDate"" = @tempVerificationDate,
                    ""VerificationDoneBy"" = @verificationDoneBy, ""Asset_Found"" = @assetFound,
                    ""Keep_on_Register_Dispose"" = @keepOnRegisterDispose, ""Revisit"" = @revisit,
                    ""Reason_for_Revisit"" = @reasonForRevisit, ""Verification_Comments"" = @verificationComments,
                    ""Verification_Flag"" = @verificationFlag
                WHERE ""VerificationItem_ID"" = @viId",
                new {
                    viId,
                    measurementTypeId = IntCell(row, "measurementTypeId"),
                    uom = IntCell(row, "uom"),
                    dim1 = DecCell(row, "dim1"), dim2 = DecCell(row, "dim2"), dim3 = DecCell(row, "dim3"),
                    quantity = DecCell(row, "quantity"),
                    diameter = DecCell(row, "diameter"), capacity = DecCell(row, "capacity"),
                    assetConditionId = IntCell(row, "assetConditionId"),
                    assetStatusId = IntCell(row, "assetStatusId"),
                    townId = IntCell(row, "townId"), suburbId = IntCell(row, "suburbId"),
                    wardId = IntCell(row, "wardId"), streetId = IntCell(row, "streetId"),
                    buildingId = IntCell(row, "buildingId"), floorId = IntCell(row, "floorId"),
                    roomId = IntCell(row, "roomId"), zoningId = IntCell(row, "zoningId"),
                    erfNumber = StrCell(row, "erfNumber"), erfSizeM2 = DecCell(row, "erfSizeM2"),
                    portionNumber = StrCell(row, "portionNumber"), unitNumber = StrCell(row, "unitNumber"),
                    floorArea = DecCell(row, "floorArea"),
                    latitude = StrCell(row, "latitude"), longitude = StrCell(row, "longitude"),
                    municipalDepartmentId = StrCell(row, "municipalDepartmentId"),
                    divisionId = IntCell(row, "divisionId"), custodianId = IntCell(row, "custodianId"),
                    custodianIdNumber = StrCell(row, "custodianIdNumber"),
                    assetOwnershipId = IntCell(row, "assetOwnershipId"),
                    basicMunicipalityService = IntCell(row, "basicMunicipalityService"),
                    tempVerificationDate = DateCell(row, "tempVerificationDate"),
                    verificationDoneBy = IntCell(row, "verificationDoneBy"),
                    assetFound = StrCell(row, "assetFound"),
                    keepOnRegisterDispose = StrCell(row, "keepOnRegisterDispose"),
                    revisit = IntCell(row, "revisit"),
                    reasonForRevisit = StrCell(row, "reasonForRevisit"),
                    verificationComments = StrCell(row, "verificationComments"),
                    verificationFlag = StrCell(row, "verificationFlag")
                });
            imported++;
        }

        return Ok(new { imported, skipped });
    }

    private static List<string> ParseCsvLine(string line)
    {
        var result = new List<string>();
        var i = 0;
        while (i < line.Length)
        {
            if (line[i] == '"')
            {
                i++;
                var sb = new System.Text.StringBuilder();
                while (i < line.Length)
                {
                    if (line[i] == '"')
                    {
                        i++;
                        if (i < line.Length && line[i] == '"') { sb.Append('"'); i++; }
                        else break;
                    }
                    else { sb.Append(line[i]); i++; }
                }
                result.Add(sb.ToString());
                if (i < line.Length && line[i] == ',') i++;
            }
            else
            {
                var start = i;
                while (i < line.Length && line[i] != ',') i++;
                result.Add(line.Substring(start, i - start));
                if (i < line.Length) i++;
            }
        }
        if (line.Length > 0 && line[line.Length - 1] == ',')
            result.Add("");
        return result;
    }

    [HttpGet("by-register/{registerId:int}/map-items")]
    public async Task<IActionResult> GetMapItems(int registerId, [FromQuery] string? statusFilter)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"
            SELECT
                vi.""VerificationItem_ID""     AS ""verificationItemId"",
                vi.""AssetRegisterItem_ID""    AS ""assetRegisterItemId"",
                vi.""Description""             AS ""description"",
                vi.""Barcode""                 AS ""barcode"",
                vi.""latitude""                AS ""latitude"",
                vi.""longitude""               AS ""longitude"",
                vi.""Verification_Flag""       AS ""verificationFlag"",
                COALESCE(cond.""Description"", '') AS ""conditionDesc"",
                CASE
                    WHEN vi.""Verification_Flag"" = 'Approved' THEN 'Approved'
                    WHEN vi.""Verification_Flag"" = 'Submitted for Approval' THEN 'Waiting Approval'
                    WHEN vi.""Verification_Flag"" IS NULL THEN 'Pending'
                    ELSE 'Verified'
                END AS ""displayStatus""
            FROM ""Asset_VerificationRegisterItem"" vi
            LEFT JOIN ""Const_Asset_Condition"" cond ON vi.""AssetCondition_ID"" = cond.""Asset_Condition_ID""
            WHERE vi.""VerificationRegister_ID"" = @registerId
              AND vi.""latitude"" IS NOT NULL
              AND vi.""longitude"" IS NOT NULL";

        var p = new DynamicParameters();
        p.Add("registerId", registerId);

        if (!string.IsNullOrWhiteSpace(statusFilter) && statusFilter != "All")
        {
            sql += @"
              AND CASE
                WHEN vi.""Verification_Flag"" = 'Approved' THEN 'Approved'
                WHEN vi.""Verification_Flag"" = 'Submitted for Approval' THEN 'Waiting Approval'
                WHEN vi.""Verification_Flag"" IS NULL THEN 'Pending'
                ELSE 'Verified'
              END = @statusFilter";
            p.Add("statusFilter", statusFilter);
        }

        sql += @" ORDER BY vi.""VerificationItem_ID""";
        var items = await conn.QueryAsync<dynamic>(sql, p);
        return Ok(items);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Dictionary<string, object?> model)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var existing = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT vi.""VerificationDate"", vi.""Temp_VerificationDate"", vi.""Verification_Flag"",
                   vi.""Verification_Comments"", vi.""Asset_Found"", vi.""Keep_on_Register_Dispose"",
                   vi.""AssetCondition_ID"", vi.""latitude"", vi.""longitude"", vi.""GPSCoordinates"",
                   vi.""VerificationDoneBy"",
                   vi.""MeasurementType_ID"", vi.""UoM"", vi.""Dim1"", vi.""Dim2"", vi.""Dim3"",
                   vi.""Quantity"", vi.""Diameter"", vi.""Capacity"", vi.""AssetStatus_ID"",
                   vi.""Town_ID"", vi.""SuburbID"", vi.""Ward_ID"", vi.""Street_ID"",
                   vi.""Building_ID"", vi.""FloorID"", vi.""Room_ID"", vi.""Zoning_ID"",
                   vi.""ErfNumber"", vi.""ErfSizeM2"", vi.""PortionNumber"", vi.""UnitNumber"",
                   vi.""Floor_Area"", vi.""MunicipalDepartment_ID"", vi.""DivisionID"",
                   vi.""Custodian_ID"", vi.""CustodianIdNumber"", vi.""AssetOwnership_ID"",
                   vi.""BasicMunicipalityService"",
                   vr.""IsHistory""
            FROM ""Asset_VerificationRegisterItem"" vi
            JOIN ""Asset_VerificationRegister"" vr ON vi.""VerificationRegister_ID"" = vr.""VerificationRegister_ID""
            WHERE vi.""VerificationItem_ID"" = @id", new { id });
        if (existing is null) return NotFound(new { error = "Verification item not found" });

        var dict0 = (IDictionary<string, object>)existing;
        if (dict0.ContainsKey("IsHistory") && Convert.ToInt32(dict0["IsHistory"]) == 1)
            return BadRequest(new { error = "Cannot modify items in a history register" });

        var existingFlag = dict0["Verification_Flag"]?.ToString();
        if (existingFlag == "Approved" || existingFlag == "Submitted for Approval")
            return BadRequest(new { error = $"Cannot edit item with status '{existingFlag}'" });

        var p = BuildItemParams(model);
        p.Add("id", id);

        var newTempDate = p.Get<DateTime?>("tempVerificationDate");
        var oldVerDate = (DateTime?)((IDictionary<string, object>)existing)["VerificationDate"];
        var currentFlag = p.Get<string>("verificationFlag");

        if (newTempDate != null && newTempDate != oldVerDate && string.IsNullOrEmpty(currentFlag))
        {
            p.Add("verificationFlag", "Revisited");
        }

        var d = (IDictionary<string, object>)existing;
        var auditFields = new Dictionary<string, (string dbCol, object? oldVal)>
        {
            { "tempVerificationDate", ("Temp_VerificationDate", d["Temp_VerificationDate"]) },
            { "verificationComments", ("Verification_Comments", d["Verification_Comments"]) },
            { "assetFound", ("Asset_Found", d["Asset_Found"]) },
            { "keepOnRegisterDispose", ("Keep_on_Register_Dispose", d["Keep_on_Register_Dispose"]) },
            { "assetConditionId", ("AssetCondition_ID", d["AssetCondition_ID"]) },
            { "latitude", ("latitude", d["latitude"]) },
            { "longitude", ("longitude", d["longitude"]) },
            { "verificationDoneBy", ("VerificationDoneBy", d["VerificationDoneBy"]) },
            { "measurementTypeId", ("MeasurementType_ID", d["MeasurementType_ID"]) },
            { "uom", ("UoM", d["UoM"]) },
            { "dim1", ("Dim1", d["Dim1"]) },
            { "dim2", ("Dim2", d["Dim2"]) },
            { "dim3", ("Dim3", d["Dim3"]) },
            { "quantity", ("Quantity", d["Quantity"]) },
            { "diameter", ("Diameter", d["Diameter"]) },
            { "capacity", ("Capacity", d["Capacity"]) },
            { "assetStatusId", ("AssetStatus_ID", d["AssetStatus_ID"]) },
            { "townId", ("Town_ID", d["Town_ID"]) },
            { "suburbId", ("SuburbID", d["SuburbID"]) },
            { "wardId", ("Ward_ID", d["Ward_ID"]) },
            { "streetId", ("Street_ID", d["Street_ID"]) },
            { "buildingId", ("Building_ID", d["Building_ID"]) },
            { "floorId", ("FloorID", d["FloorID"]) },
            { "roomId", ("Room_ID", d["Room_ID"]) },
            { "zoningId", ("Zoning_ID", d["Zoning_ID"]) },
            { "erfNumber", ("ErfNumber", d["ErfNumber"]) },
            { "erfSizeM2", ("ErfSizeM2", d["ErfSizeM2"]) },
            { "portionNumber", ("PortionNumber", d["PortionNumber"]) },
            { "unitNumber", ("UnitNumber", d["UnitNumber"]) },
            { "floorArea", ("Floor_Area", d["Floor_Area"]) },
            { "municipalDepartmentId", ("MunicipalDepartment_ID", d["MunicipalDepartment_ID"]) },
            { "divisionId", ("DivisionID", d["DivisionID"]) },
            { "custodianId", ("Custodian_ID", d["Custodian_ID"]) },
            { "custodianIdNumber", ("CustodianIdNumber", d["CustodianIdNumber"]) },
            { "assetOwnershipId", ("AssetOwnership_ID", d["AssetOwnership_ID"]) },
            { "basicMunicipalityService", ("BasicMunicipalityService", d["BasicMunicipalityService"]) }
        };

        await conn.ExecuteAsync(@"
            UPDATE ""Asset_VerificationRegisterItem"" SET
                ""Temp_VerificationDate""    = @tempVerificationDate,
                ""Verification_Flag""        = @verificationFlag,
                ""Verification_Comments""    = @verificationComments,
                ""Asset_Found""              = @assetFound,
                ""Keep_on_Register_Dispose"" = @keepOnRegisterDispose,
                ""AssetCondition_ID""        = @assetConditionId,
                ""latitude""                 = @latitude,
                ""longitude""                = @longitude,
                ""GPSCoordinates""           = @gpsCoordinates,
                ""VerificationDoneBy""       = @verificationDoneBy,
                ""MeasurementType_ID""       = @measurementTypeId,
                ""UoM""                      = @uom,
                ""Dim1""                     = @dim1,
                ""Dim2""                     = @dim2,
                ""Dim3""                     = @dim3,
                ""Quantity""                 = @quantity,
                ""Diameter""                 = @diameter,
                ""Capacity""                 = @capacity,
                ""AssetStatus_ID""           = @assetStatusId,
                ""Town_ID""                  = @townId,
                ""SuburbID""                 = @suburbId,
                ""Ward_ID""                  = @wardId,
                ""Street_ID""               = @streetId,
                ""Building_ID""             = @buildingId,
                ""FloorID""                 = @floorId,
                ""Room_ID""                 = @roomId,
                ""Zoning_ID""               = @zoningId,
                ""ErfNumber""               = @erfNumber,
                ""ErfSizeM2""               = @erfSizeM2,
                ""PortionNumber""            = @portionNumber,
                ""UnitNumber""              = @unitNumber,
                ""Floor_Area""              = @floorArea,
                ""MunicipalDepartment_ID""   = @municipalDepartmentId,
                ""DivisionID""              = @divisionId,
                ""Custodian_ID""            = @custodianId,
                ""CustodianIdNumber""        = @custodianIdNumber,
                ""AssetOwnership_ID""        = @assetOwnershipId,
                ""BasicMunicipalityService"" = @basicMunicipalityService
            WHERE ""VerificationItem_ID"" = @id", p);

        foreach (var af in auditFields)
        {
            var newVal = GetParamValue(p, af.Key);
            var oldValStr = af.Value.oldVal?.ToString() ?? "";
            var newValStr = newVal?.ToString() ?? "";
            if (oldValStr != newValStr)
            {
                await conn.ExecuteAsync(@"
                    INSERT INTO ""Asset_VerificationAuditTrail"" (""VerificationItem_ID"", ""FieldName"", ""OldValue"", ""NewValue"", ""ChangedByID"", ""ChangedAt"")
                    VALUES (@id, @field, @oldVal, @newVal, 1, NOW())",
                    new { id, field = af.Value.dbCol, oldVal = oldValStr, newVal = newValStr });
            }
        }

        var updated = await conn.QueryFirstOrDefaultAsync<dynamic>(
            ItemSelect + @" WHERE vi.""VerificationItem_ID"" = @id", new { id });
        return Ok(updated);
    }

    [HttpPost("submit")]
    public async Task<IActionResult> Submit([FromBody] List<int> itemIds)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var historyCount = await conn.ExecuteScalarAsync<int>(@"
            SELECT COUNT(*) FROM ""Asset_VerificationRegisterItem"" vi
            JOIN ""Asset_VerificationRegister"" vr ON vi.""VerificationRegister_ID"" = vr.""VerificationRegister_ID""
            WHERE vi.""VerificationItem_ID"" = ANY(@ids) AND vr.""IsHistory"" = 1",
            new { ids = itemIds.ToArray() });
        if (historyCount > 0) return BadRequest(new { error = "Cannot submit items from a history register" });

        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Asset_VerificationRegisterItem""
            SET ""Verification_Flag"" = 'Submitted for Approval'
            WHERE ""VerificationItem_ID"" = ANY(@ids)
            AND (""Verification_Flag"" IS NULL OR ""Verification_Flag"" IN ('Revisit – Not Approved', 'Revisited'))",
            new { ids = itemIds.ToArray() });
        return Ok(new { updated = rows });
    }

    [HttpPost("approve")]
    public async Task<IActionResult> Approve([FromBody] List<int> itemIds)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var historyCount = await conn.ExecuteScalarAsync<int>(@"
            SELECT COUNT(*) FROM ""Asset_VerificationRegisterItem"" vi
            JOIN ""Asset_VerificationRegister"" vr ON vi.""VerificationRegister_ID"" = vr.""VerificationRegister_ID""
            WHERE vi.""VerificationItem_ID"" = ANY(@ids) AND vr.""IsHistory"" = 1",
            new { ids = itemIds.ToArray() });
        if (historyCount > 0) return BadRequest(new { error = "Cannot approve items from a history register" });

        using var txn = conn.BeginTransaction();
        var approved = 0;

        foreach (var itemId in itemIds)
        {
            var item = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT * FROM ""Asset_VerificationRegisterItem"" WHERE ""VerificationItem_ID"" = @itemId",
                new { itemId }, txn);
            if (item is null) continue;
            var dict = (IDictionary<string, object>)item;

            var flag = dict["Verification_Flag"]?.ToString();
            if (flag != "Submitted for Approval") continue;

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_VerificationRegisterItem""
                SET ""Verification_Flag"" = 'Approved', ""VerificationDate"" = ""Temp_VerificationDate""
                WHERE ""VerificationItem_ID"" = @itemId", new { itemId }, txn);

            var assetId = dict["AssetRegisterItem_ID"];
            if (assetId != null)
            {
                int? IntVal(string key) => dict.TryGetValue(key, out var v) && v is not null ? Convert.ToInt32(v) : (int?)null;
                decimal? DecVal(string key) => dict.TryGetValue(key, out var v) && v is not null ? Convert.ToDecimal(v) : (decimal?)null;
                string? StrVal(string key) => dict.TryGetValue(key, out var v) && v is not null ? v.ToString() : (string?)null;
                DateTime? DateVal(string key) => dict.TryGetValue(key, out var v) && v is not null ? Convert.ToDateTime(v) : (DateTime?)null;

                await conn.ExecuteAsync(@"
                    UPDATE ""Asset_Register_Items"" SET
                        ""VerificationDate"" = @vDate,
                        ""AssetCondition_ID"" = COALESCE(@condId::INTEGER, ""AssetCondition_ID""),
                        ""AssetStatus_ID"" = COALESCE(@statusId::INTEGER, ""AssetStatus_ID""),
                        ""Town_ID"" = COALESCE(@townId::INTEGER, ""Town_ID""),
                        ""Ward_ID"" = COALESCE(@wardId::INTEGER, ""Ward_ID""),
                        ""Building_ID"" = COALESCE(@buildingId::INTEGER, ""Building_ID""),
                        ""FloorID"" = COALESCE(@floorId::INTEGER, ""FloorID""),
                        ""Room_ID"" = COALESCE(@roomId::INTEGER, ""Room_ID""),
                        ""SuburbID"" = COALESCE(@suburbId::INTEGER, ""SuburbID""),
                        ""Street_ID"" = COALESCE(@streetId::INTEGER, ""Street_ID""),
                        ""MunicipalDepartment_ID"" = COALESCE(@deptId::TEXT, ""MunicipalDepartment_ID""),
                        ""DivisionID"" = COALESCE(@divisionId::INTEGER, ""DivisionID""),
                        ""Zoning_ID"" = COALESCE(@zoningId::INTEGER, ""Zoning_ID""),
                        ""Custodian_ID"" = COALESCE(@custodianId::INTEGER, ""Custodian_ID""),
                        ""CustodianIdNumber"" = COALESCE(@custodianIdNum::TEXT, ""CustodianIdNumber""),
                        ""AssetOwnership_ID"" = COALESCE(@ownershipId::INTEGER, ""AssetOwnership_ID""),
                        ""BasicMunicipalityService"" = COALESCE(@basicService::INTEGER, ""BasicMunicipalityService""),
                        ""MeasurementType_ID"" = COALESCE(@measureTypeId::INTEGER, ""MeasurementType_ID""),
                        ""UoM"" = COALESCE(@uom::INTEGER, ""UoM""),
                        ""Dim1"" = COALESCE(@dim1::NUMERIC, ""Dim1""),
                        ""Dim2"" = COALESCE(@dim2::NUMERIC, ""Dim2""),
                        ""Dim3"" = COALESCE(@dim3::NUMERIC, ""Dim3""),
                        ""Diameter"" = COALESCE(@diameter::NUMERIC, ""Diameter""),
                        ""Capacity"" = COALESCE(@capacity::NUMERIC, ""Capacity""),
                        ""Quantity"" = COALESCE(@quantity::NUMERIC, ""Quantity""),
                        ""Floor_Area"" = COALESCE(@floorArea::NUMERIC, ""Floor_Area""),
                        ""ErfNumber"" = COALESCE(@erfNumber::TEXT, ""ErfNumber""),
                        ""ErfSizeM2"" = COALESCE(@erfSize::NUMERIC, ""ErfSizeM2""),
                        ""PortionNumber"" = COALESCE(@portionNumber::TEXT, ""PortionNumber""),
                        ""UnitNumber"" = COALESCE(@unitNumber::TEXT, ""UnitNumber""),
                        ""RegistrationNumber"" = COALESCE(@regNumber::TEXT, ""RegistrationNumber""),
                        ""Make"" = COALESCE(@make::TEXT, ""Make""),
                        ""Model"" = COALESCE(@model::TEXT, ""Model""),
                        ""Barcode"" = COALESCE(@barcode::TEXT, ""Barcode""),
                        ""SerialNumber"" = COALESCE(@serialNumber::TEXT, ""SerialNumber""),
                        ""latitude"" = CASE WHEN @lat IS NOT NULL AND TRIM(@lat) <> '' THEN CAST(@lat AS DECIMAL(18,8)) ELSE ""latitude"" END,
                        ""longitude"" = CASE WHEN @lng IS NOT NULL AND TRIM(@lng) <> '' THEN CAST(@lng AS DECIMAL(18,8)) ELSE ""longitude"" END,
                        ""DateModified"" = NOW()
                    WHERE ""AssetRegisterItem_ID"" = @assetId",
                    new {
                        assetId,
                        vDate = DateVal("Temp_VerificationDate"),
                        condId = IntVal("AssetCondition_ID"),
                        statusId = IntVal("AssetStatus_ID"),
                        townId = IntVal("Town_ID"),
                        wardId = IntVal("Ward_ID"),
                        buildingId = IntVal("Building_ID"),
                        floorId = IntVal("FloorID"),
                        roomId = IntVal("Room_ID"),
                        suburbId = IntVal("SuburbID"),
                        streetId = IntVal("Street_ID"),
                        deptId = StrVal("MunicipalDepartment_ID"),
                        divisionId = IntVal("DivisionID"),
                        zoningId = IntVal("Zoning_ID"),
                        custodianId = IntVal("Custodian_ID"),
                        custodianIdNum = StrVal("CustodianIdNumber"),
                        ownershipId = IntVal("AssetOwnership_ID"),
                        basicService = IntVal("BasicMunicipalityService"),
                        measureTypeId = IntVal("MeasurementType_ID"),
                        uom = IntVal("UoM"),
                        dim1 = DecVal("Dim1"),
                        dim2 = DecVal("Dim2"),
                        dim3 = DecVal("Dim3"),
                        diameter = DecVal("Diameter"),
                        capacity = DecVal("Capacity"),
                        quantity = DecVal("Quantity"),
                        floorArea = DecVal("Floor_Area"),
                        erfNumber = StrVal("ErfNumber"),
                        erfSize = DecVal("ErfSizeM2"),
                        portionNumber = StrVal("PortionNumber"),
                        unitNumber = StrVal("UnitNumber"),
                        regNumber = StrVal("RegistrationNumber"),
                        make = StrVal("Make"),
                        model = StrVal("Model"),
                        barcode = StrVal("Barcode"),
                        serialNumber = StrVal("SerialNumber"),
                        lat = decimal.TryParse(StrVal("latitude"), out var latVal) ? latVal.ToString(System.Globalization.CultureInfo.InvariantCulture) : (string?)null,
                        lng = decimal.TryParse(StrVal("longitude"), out var lngVal) ? lngVal.ToString(System.Globalization.CultureInfo.InvariantCulture) : (string?)null
                    }, txn);
            }
            approved++;
        }
        txn.Commit();
        return Ok(new { approved });
    }

    [HttpPost("back-to-manage")]
    public async Task<IActionResult> BackToManage([FromBody] Dictionary<string, object?> body)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        T? Get<T>(string key)
        {
            if (!body.TryGetValue(key, out var v) || v is null) return default;
            var s = v.ToString();
            if (string.IsNullOrWhiteSpace(s)) return default;
            try { var underlying = Nullable.GetUnderlyingType(typeof(T)) ?? typeof(T); return (T)Convert.ChangeType(s, underlying); } catch { return default; }
        }
        var itemIds = new List<int>();
        if (body.TryGetValue("itemIds", out var idsVal) && idsVal is System.Text.Json.JsonElement je && je.ValueKind == System.Text.Json.JsonValueKind.Array)
        {
            foreach (var el in je.EnumerateArray()) { if (el.TryGetInt32(out var i)) itemIds.Add(i); }
        }
        var reason = Get<string>("reason") ?? "";

        var historyCount = await conn.ExecuteScalarAsync<int>(@"
            SELECT COUNT(*) FROM ""Asset_VerificationRegisterItem"" vi
            JOIN ""Asset_VerificationRegister"" vr ON vi.""VerificationRegister_ID"" = vr.""VerificationRegister_ID""
            WHERE vi.""VerificationItem_ID"" = ANY(@ids) AND vr.""IsHistory"" = 1",
            new { ids = itemIds.ToArray() });
        if (historyCount > 0) return BadRequest(new { error = "Cannot return items from a history register" });

        var rows = await conn.ExecuteAsync(@"
            UPDATE ""Asset_VerificationRegisterItem""
            SET ""Verification_Flag"" = 'Revisit – Not Approved', ""Reason_for_Revisit"" = @reason, ""Revisit"" = 1
            WHERE ""VerificationItem_ID"" = ANY(@ids)
            AND ""Verification_Flag"" = 'Submitted for Approval'",
            new { ids = itemIds.ToArray(), reason });
        return Ok(new { updated = rows });
    }

    [HttpGet("{id:int}/audit-trail")]
    public async Task<IActionResult> GetAuditTrail(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<dynamic>(@"
            SELECT ""AuditTrail_ID"" AS ""auditTrailId"",
                   ""VerificationItem_ID"" AS ""verificationItemId"",
                   ""FieldName"" AS ""fieldName"",
                   ""OldValue"" AS ""oldValue"",
                   ""NewValue"" AS ""newValue"",
                   ""ChangedByID"" AS ""changedById"",
                   ""ChangedByName"" AS ""changedByName"",
                   ""ChangedAt"" AS ""changedAt""
            FROM ""Asset_VerificationAuditTrail""
            WHERE ""VerificationItem_ID"" = @id
            ORDER BY ""ChangedAt"" DESC", new { id });
        return Ok(items);
    }

    private static object? GetParamValue(DynamicParameters p, string name)
    {
        try { return p.Get<object>(name); } catch { return null; }
    }

    private static DynamicParameters BuildItemParams(Dictionary<string, object?> m)
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
        p.Add("tempVerificationDate", Get<DateTime?>("tempVerificationDate"));
        p.Add("verificationFlag", Get<string>("verificationFlag"));
        p.Add("verificationComments", Get<string>("verificationComments"));
        p.Add("assetFound", Get<string?>("assetFound"));
        p.Add("keepOnRegisterDispose", Get<string>("keepOnRegisterDispose"));
        p.Add("assetConditionId", Get<int?>("assetConditionId"));
        p.Add("latitude", Get<string>("latitude"));
        p.Add("longitude", Get<string>("longitude"));
        p.Add("gpsCoordinates", Get<string>("gpsCoordinates"));
        p.Add("verificationDoneBy", Get<int?>("verificationDoneBy"));
        p.Add("measurementTypeId", Get<int?>("measurementTypeId"));
        p.Add("uom", Get<int?>("uom"));
        p.Add("dim1", Get<decimal?>("dim1"));
        p.Add("dim2", Get<decimal?>("dim2"));
        p.Add("dim3", Get<decimal?>("dim3"));
        p.Add("quantity", Get<decimal?>("quantity"));
        p.Add("diameter", Get<decimal?>("diameter"));
        p.Add("capacity", Get<decimal?>("capacity"));
        p.Add("assetStatusId", Get<int?>("assetStatusId"));
        p.Add("townId", Get<int?>("townId"));
        p.Add("suburbId", Get<int?>("suburbId"));
        p.Add("wardId", Get<int?>("wardId"));
        p.Add("streetId", Get<int?>("streetId"));
        p.Add("buildingId", Get<int?>("buildingId"));
        p.Add("floorId", Get<int?>("floorId"));
        p.Add("roomId", Get<int?>("roomId"));
        p.Add("zoningId", Get<int?>("zoningId"));
        p.Add("erfNumber", Get<string>("erfNumber"));
        p.Add("erfSizeM2", Get<decimal?>("erfSizeM2"));
        p.Add("portionNumber", Get<string>("portionNumber"));
        p.Add("unitNumber", Get<string>("unitNumber"));
        p.Add("floorArea", Get<decimal?>("floorArea"));
        p.Add("municipalDepartmentId", Get<string>("municipalDepartmentId"));
        p.Add("divisionId", Get<int?>("divisionId"));
        p.Add("custodianId", Get<int?>("custodianId"));
        p.Add("custodianIdNumber", Get<string>("custodianIdNumber"));
        p.Add("assetOwnershipId", Get<int?>("assetOwnershipId"));
        p.Add("basicMunicipalityService", Get<int?>("basicMunicipalityService"));
        return p;
    }
}
