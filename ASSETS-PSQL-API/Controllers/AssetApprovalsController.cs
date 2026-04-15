using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Services;
using System.Text.Json;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/asset-approvals")]
public class AssetApprovalsController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    private readonly ILogger<AssetApprovalsController> _logger;
    private readonly LookupService _lookup;
    private readonly InternalApiClient _internalApi;

    public AssetApprovalsController(DbConnectionFactory db, ILogger<AssetApprovalsController> logger, LookupService lookup, InternalApiClient internalApi)
    {
        _db = db;
        _logger = logger;
        _lookup = lookup;
        _internalApi = internalApi;
    }

    // -------------------------------------------------------------------------
    // GET /api/asset-approvals[?status=Pending&type=Acquisition]
    // -------------------------------------------------------------------------
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] string? type, [FromQuery] int? assetId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var where = new List<string>();
        var parameters = new DynamicParameters();

        if (!string.IsNullOrWhiteSpace(status))
        {
            where.Add(@"a.""Status"" = @status");
            parameters.Add("status", status);
        }
        if (!string.IsNullOrWhiteSpace(type))
        {
            where.Add(@"a.""ApprovalType"" = @type");
            parameters.Add("type", type);
        }
        if (assetId.HasValue)
        {
            where.Add(@"a.""AssetRegisterItem_ID"" = @assetId");
            parameters.Add("assetId", assetId.Value);
        }

        var whereClause = where.Count > 0 ? "WHERE " + string.Join(" AND ", where) : "";

        var rows = await conn.QueryAsync<dynamic>($@"
            SELECT
                a.""Approval_ID""            AS ""approvalId"",
                a.""ApprovalType""           AS ""approvalType"",
                a.""AcquisitionSubType""     AS ""acquisitionSubType"",
                a.""AssetRegisterItem_ID""   AS ""assetRegisterItemId"",
                a.""Status""                 AS ""status"",
                a.""SubmittedDate""          AS ""submittedDate"",
                a.""ApprovedDate""           AS ""approvedDate"",
                a.""RejectedDate""           AS ""rejectedDate"",
                a.""RejectionReason""        AS ""rejectionReason"",
                CASE
                    WHEN a.""ApprovalType"" = 'Edit'
                        THEN COALESCE(r.""Description"", a.""AssetData"" ->> 'Description', '')
                    ELSE COALESCE(a.""AssetData"" ->> 'Description', '')
                END                          AS ""description"",
                CASE
                    WHEN a.""ApprovalType"" = 'Edit'
                        THEN CAST(r.""PurchaseAmount"" AS TEXT)
                    ELSE a.""AssetData"" ->> 'PurchaseAmount'
                END                          AS ""cost"",
                COALESCE(cat.""AssetCategoryDesc"", '') AS ""categoryName"",
                COALESCE(at.""AssetTypeDesc"", '')      AS ""typeName""
            FROM ""Asset_Register_Item_Approval"" a
            LEFT JOIN ""Asset_Register_Items"" r
                ON a.""AssetRegisterItem_ID"" = r.""AssetRegisterItem_ID""
            LEFT JOIN ""Const_AssetCategory_sys"" cat
                ON CASE
                    WHEN a.""AssetData"" ->> 'AssetCategory_ID' ~ '^[0-9]+$'
                    THEN (a.""AssetData"" ->> 'AssetCategory_ID')::integer
                    ELSE r.""AssetCategory_ID""
                   END = cat.""AssetCategoryID""
            LEFT JOIN ""Const_AssetType_Sys"" at
                ON CASE
                    WHEN a.""AssetData"" ->> 'AssetType_ID' ~ '^[0-9]+$'
                    THEN (a.""AssetData"" ->> 'AssetType_ID')::integer
                    ELSE r.""AssetType_ID""
                   END = at.""AssetType_ID""
            {whereClause}
            ORDER BY a.""SubmittedDate"" DESC", parameters);

        return Ok(rows);
    }

    // -------------------------------------------------------------------------
    // GET /api/asset-approvals/{id}
    // -------------------------------------------------------------------------
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var row = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT
                a.""Approval_ID""            AS ""approvalId"",
                a.""ApprovalType""           AS ""approvalType"",
                a.""AcquisitionSubType""     AS ""acquisitionSubType"",
                a.""AssetRegisterItem_ID""   AS ""assetRegisterItemId"",
                a.""SCMTransfer_ID""         AS ""scmTransferId"",
                a.""InvTransfer_ID""         AS ""invTransferId"",
                a.""Status""                 AS ""status"",
                a.""AssetData""::text        AS ""assetDataRaw"",
                a.""ChangeSummary""::text    AS ""changeSummaryRaw"",
                a.""SubmittedBy""            AS ""submittedBy"",
                a.""SubmittedDate""          AS ""submittedDate"",
                a.""ApprovedBy""             AS ""approvedBy"",
                a.""ApprovedDate""           AS ""approvedDate"",
                a.""RejectedBy""             AS ""rejectedBy"",
                a.""RejectedDate""           AS ""rejectedDate"",
                a.""RejectionReason""        AS ""rejectionReason""
            FROM ""Asset_Register_Item_Approval"" a
            WHERE a.""Approval_ID"" = @id", new { id });

        if (row is null) return NotFound(new { error = "Approval record not found" });

        // Deserialise JSONB blobs so the response carries structured JSON, not strings
        var assetDataJson   = (string?)(row.assetDataRaw?.ToString());
        var changeSumJson    = (string?)(row.changeSummaryRaw?.ToString());
        object? assetData   = null;
        object? changeSummary = null;
        try { if (!string.IsNullOrEmpty(assetDataJson))
                assetData = JsonSerializer.Deserialize<JsonElement>(assetDataJson); }
        catch (JsonException ex)
        { _logger.LogWarning("Could not parse AssetData JSONB for approval {id}: {msg}", id, ex.Message); }
        List<JsonElement>? rawChanges = null;
        try { if (!string.IsNullOrEmpty(changeSumJson))
        {
            var el = JsonSerializer.Deserialize<JsonElement>(changeSumJson);
            if (el.ValueKind == JsonValueKind.Array)
            {
                rawChanges = new List<JsonElement>();
                foreach (var item in el.EnumerateArray()) rawChanges.Add(item);
                changeSummary = el;
            }
            else
                changeSummary = el;
        }}
        catch (JsonException ex)
        { _logger.LogWarning("Could not parse ChangeSummary JSONB for approval {id}: {msg}", id, ex.Message); }

        // Resolve human-readable descriptions for all ID fields in assetData
        var descriptions = new Dictionary<string, string>();
        if (assetData is JsonElement jsonEl && jsonEl.ValueKind == JsonValueKind.Object)
            descriptions = await ResolveDescriptions(conn, jsonEl);

        // Patch changeSummary: fill missing CIDMS descriptions from DB for existing stored approvals
        object? patchedChangeSummary = changeSummary;
        if (rawChanges != null)
        {
            var patched = new List<object>();
            foreach (var ch in rawChanges)
            {
                var field           = ch.TryGetProperty("field",               out var fp)  ? fp.GetString()  ?? "" : "";
                var label           = ch.TryGetProperty("label",               out var lp)  ? lp.GetString()  ?? "" : "";
                var prevVal         = ch.TryGetProperty("previousValue",       out var pvp) ? pvp.GetString() ?? "" : "";
                var newVal          = ch.TryGetProperty("newValue",            out var nvp) ? nvp.GetString() ?? "" : "";
                string? prevDesc    = ch.TryGetProperty("previousDescription", out var pdp) && pdp.ValueKind != JsonValueKind.Null ? pdp.GetString() : null;
                string? newDesc     = ch.TryGetProperty("newDescription",      out var ndp) && ndp.ValueKind != JsonValueKind.Null ? ndp.GetString() : null;

                // If descriptions are missing and the field is a known CIDMS lookup, resolve them now
                if ((prevDesc == null || newDesc == null) && CidmsLookupFields.TryGetValue(field, out var lkp))
                {
                    if (prevDesc == null && !string.IsNullOrWhiteSpace(prevVal) && int.TryParse(prevVal, out var prevId))
                    {
                        try { prevDesc = await conn.QueryFirstOrDefaultAsync<string>($@"SELECT ""{lkp.DescCol}"" FROM ""{lkp.Table}"" WHERE ""{lkp.IdCol}"" = @id", new { id = prevId }); }
                        catch { /* non-fatal */ }
                    }
                    if (newDesc == null && !string.IsNullOrWhiteSpace(newVal) && int.TryParse(newVal, out var newId))
                    {
                        try { newDesc = await conn.QueryFirstOrDefaultAsync<string>($@"SELECT ""{lkp.DescCol}"" FROM ""{lkp.Table}"" WHERE ""{lkp.IdCol}"" = @id", new { id = newId }); }
                        catch { /* non-fatal */ }
                    }
                }

                patched.Add(new { field, label, previousValue = prevVal, previousDescription = prevDesc, newValue = newVal, newDescription = newDesc });
            }
            patchedChangeSummary = patched;
        }

        return Ok(new
        {
            approvalId          = row.approvalId,
            approvalType        = row.approvalType,
            acquisitionSubType  = row.acquisitionSubType,
            assetRegisterItemId = row.assetRegisterItemId,
            scmTransferId       = row.scmTransferId,
            invTransferId       = row.invTransferId,
            status              = row.status,
            assetData,
            changeSummary       = patchedChangeSummary,
            descriptions,
            submittedBy         = row.submittedBy,
            submittedDate       = row.submittedDate,
            approvedBy          = row.approvedBy,
            approvedDate        = row.approvedDate,
            rejectedBy          = row.rejectedBy,
            rejectedDate        = row.rejectedDate,
            rejectionReason     = row.rejectionReason
        });
    }

    private static readonly Dictionary<string, (string Table, string IdCol, string DescCol)> CidmsLookupFields
        = new(StringComparer.OrdinalIgnoreCase)
    {
        { "CIDMSSubComponentTypeID", ("Const_Asset_CIDMS_SubComponent_Type",   "AssetCIDMSSubComponentTypeID", "AssetCIDMSSubComponentTypeDesc") },
        { "CIDMSComponentType",      ("Const_Asset_CIDMS_Component_Type",      "AssetCIDMSComponentTypeID",    "AssetCIDMSComponentTypeDesc") },
        { "CIDMSAssetType",          ("Const_Asset_CIDMS_Asset_Type",          "AssetCIDMSAssetTypeID",        "AssetCIDMSAssetTypeDesc") },
        { "CIDMSAssetGroupType",     ("Const_Asset_CIDMS_Group_Type",          "AssetCIDMSGroupTypeID",        "AssetCIDMSGroupTypeDesc") },
        { "CIDMSAssetClass",         ("Const_Asset_CIDMS_Class",               "AssetCIDMSClassID",            "AssetCIDMSClassDesc") },
        { "CIDMSSubAccountingGroup", ("Const_Asset_CIDMS_Accounting_Sub_Group","AssetAccountSubGroupID",       "AssetAccountSubGroupDesc") },
        { "CIDMSAccountingGroup",    ("Const_Asset_CIDMS_Accounting_Group",    "AssetAccountGroupID",          "AssetAccountGroupDesc") },
    };

    private static int? ExtractInt(JsonElement data, string key)
    {
        if (!data.TryGetProperty(key, out var val)) return null;
        if (val.ValueKind == JsonValueKind.Number && val.TryGetInt32(out var i)) return i;
        if (val.ValueKind == JsonValueKind.String && int.TryParse(val.GetString(), out var j)) return j;
        return null;
    }

    private async Task<Dictionary<string, string>> ResolveDescriptions(
        System.Data.Common.DbConnection conn, JsonElement data)
    {
        var desc = new Dictionary<string, string>();

        // Run all lookups sequentially — Npgsql does not support concurrent queries on one connection
        async Task Resolve(string field, string table, string idCol, string descCol)
        {
            var id = ExtractInt(data, field);
            if (!id.HasValue) return;
            try
            {
                var val = await conn.QuerySingleOrDefaultAsync<string>(
                    $@"SELECT ""{descCol}"" FROM ""{table}"" WHERE ""{idCol}"" = @id",
                    new { id = id.Value });
                if (!string.IsNullOrEmpty(val)) desc[field] = val;
            }
            catch { /* lookup failure is non-fatal */ }
        }

        await Resolve("AssetType_ID",          "Const_AssetType_Sys",                    "AssetType_ID",                "AssetTypeDesc");
        await Resolve("AssetCategory_ID",      "Const_AssetCategory_sys",                "AssetCategoryID",             "AssetCategoryDesc");
        await Resolve("Asset_SubCategory_ID",  "Const_Asset_SubCategory",                "Asset_SubCategory_ID",        "Asset_SubCategoryDescription");
        await Resolve("AssetClass_ID",         "Const_AssetClass_sys",                   "AssetClass_ID",               "AssetClassDesc");
        await Resolve("AssetStatus_ID",        "Const_AssetStatus_Sys",                  "AssetStatus_ID",              "AssetStatusDesc");
        await Resolve("AssetCondition_ID",     "Const_Asset_Condition",                  "Asset_Condition_ID",          "Description");
        // CIDMS fields
        await Resolve("CIDMSSubComponentTypeID", "Const_Asset_CIDMS_SubComponent_Type",  "AssetCIDMSSubComponentTypeID","AssetCIDMSSubComponentTypeDesc");
        await Resolve("CIDMSComponentType",      "Const_Asset_CIDMS_Component_Type",     "AssetCIDMSComponentTypeID",   "AssetCIDMSComponentTypeDesc");
        await Resolve("CIDMSAssetType",          "Const_Asset_CIDMS_Asset_Type",         "AssetCIDMSAssetTypeID",       "AssetCIDMSAssetTypeDesc");
        await Resolve("CIDMSAssetGroupType",     "Const_Asset_CIDMS_Group_Type",         "AssetCIDMSGroupTypeID",       "AssetCIDMSGroupTypeDesc");
        await Resolve("CIDMSAssetClass",         "Const_Asset_CIDMS_Class",              "AssetCIDMSClassID",           "AssetCIDMSClassDesc");
        await Resolve("CIDMSSubAccountingGroup", "Const_Asset_CIDMS_Accounting_Sub_Group","AssetAccountSubGroupID",     "AssetAccountSubGroupDesc");
        await Resolve("CIDMSAccountingGroup",    "Const_Asset_CIDMS_Accounting_Group",   "AssetAccountGroupID",         "AssetAccountGroupDesc");

        // Department
        var deptId = ExtractInt(data, "MunicipalDepartment_ID");
        if (deptId.HasValue)
        {
            try
            {
                var val = await _lookup.GetDepartmentDescAsync(conn, deptId.Value);
                if (!string.IsNullOrEmpty(val)) desc["MunicipalDepartment_ID"] = val;
            }
            catch { }
        }

        // Custodian — Employee_ID → FirstName + Surname
        var custId = ExtractInt(data, "Custodian_ID");
        if (custId.HasValue)
        {
            try
            {
                var val = await _lookup.GetEmployeeFullNameAsync(conn, custId.Value);
                if (!string.IsNullOrEmpty(val)) desc["Custodian_ID"] = val;
            }
            catch { }
        }

        return desc;
    }

    // -------------------------------------------------------------------------
    // POST /api/asset-approvals/{id}/approve
    // -------------------------------------------------------------------------
    [HttpPost("{id:int}/approve")]
    public async Task<IActionResult> Approve(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var approval = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
            SELECT
                ""Approval_ID""          AS ""approvalId"",
                ""ApprovalType""         AS ""approvalType"",
                ""AcquisitionSubType""   AS ""acquisitionSubType"",
                ""AssetRegisterItem_ID"" AS ""assetRegisterItemId"",
                ""SCMTransfer_ID""       AS ""scmTransferId"",
                ""InvTransfer_ID""       AS ""invTransferId"",
                ""Status""               AS ""status"",
                ""AssetData""::text      AS ""assetData""
            FROM ""Asset_Register_Item_Approval""
            WHERE ""Approval_ID"" = @id", new { id });

        if (approval is null)
            return NotFound(new { error = "Approval record not found" });

        if ((string)approval.status != "Pending")
            return BadRequest(new { error = $"Cannot approve a record with status '{approval.status}'." });

        var approvalType = (string)approval.approvalType;
        var assetDataJson = (string?)(approval.assetData?.ToString()) ?? "{}";
        var assetData = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(assetDataJson)
            ?? new Dictionary<string, JsonElement>();

        await using var txn = await conn.BeginTransactionAsync();
        try
        {
            int resultAssetId;

            // Extract transfer IDs from dynamic approval (must be done before calling static method)
            object? rawScmObj = approval.scmTransferId;
            object? rawInvObj = approval.invTransferId;
            int? postCommitScmTransferId = (rawScmObj is null || rawScmObj is DBNull) ? (int?)null : Convert.ToInt32(rawScmObj);
            int? postCommitInvTransferId = (rawInvObj is null || rawInvObj is DBNull) ? (int?)null : Convert.ToInt32(rawInvObj);

            if (approvalType == "Acquisition")
            {
                resultAssetId = await ApproveAcquisition(conn, txn, assetData);
            }
            else if (approvalType == "Edit")
            {
                var assetRegisterItemId = (int)approval.assetRegisterItemId;
                await ApproveEdit(conn, txn, assetRegisterItemId, assetData);
                resultAssetId = assetRegisterItemId;
            }
            else
            {
                await txn.RollbackAsync();
                return BadRequest(new { error = $"Unknown approval type: {approvalType}" });
            }

            // Mark approval as approved
            await conn.ExecuteAsync(@"
                UPDATE ""Asset_Register_Item_Approval""
                SET ""Status"" = 'Approved', ""ApprovedDate"" = NOW(), ""ApprovedBy"" = 1
                WHERE ""Approval_ID"" = @id", new { id }, transaction: txn);

            await txn.CommitAsync();

            // Post-commit write-backs — executed after the asset row is durable and visible
            if (postCommitScmTransferId.HasValue)
                await _internalApi.PatchAsync($"api/scm-transfers/{postCommitScmTransferId.Value}/assign-asset",
                    new { assetRegisterItemId = resultAssetId });
            else if (postCommitInvTransferId.HasValue)
                await _internalApi.PatchAsync($"api/inv-transfers/{postCommitInvTransferId.Value}/assign-asset",
                    new { assetRegisterItemId = resultAssetId });

            return Ok(new { success = true, assetId = resultAssetId, message = "Approved successfully." });
        }
        catch (Exception ex)
        {
            await txn.RollbackAsync();
            return BadRequest(new { error = ex.Message });
        }
    }

    // -------------------------------------------------------------------------
    // POST /api/asset-approvals/{id}/reject
    // -------------------------------------------------------------------------
    [HttpPost("{id:int}/reject")]
    public async Task<IActionResult> Reject(int id, [FromBody] RejectionRequest request)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var existingStatus = await conn.QueryFirstOrDefaultAsync<string?>(
            @"SELECT ""Status"" FROM ""Asset_Register_Item_Approval"" WHERE ""Approval_ID"" = @id", new { id });

        if (existingStatus is null)
            return NotFound(new { error = "Approval record not found" });

        if (existingStatus != "Pending")
            return BadRequest(new { error = $"Cannot reject a record with status '{existingStatus}'." });

        await conn.ExecuteAsync(@"
            UPDATE ""Asset_Register_Item_Approval""
            SET ""Status"" = 'Rejected',
                ""RejectedDate"" = NOW(),
                ""RejectedBy"" = 1,
                ""RejectionReason"" = @reason
            WHERE ""Approval_ID"" = @id AND ""Status"" = 'Pending'",
            new { id, reason = request?.Reason ?? "" });

        return Ok(new { success = true, message = "Rejected successfully." });
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

    private static readonly HashSet<string> DateColumns = new(StringComparer.OrdinalIgnoreCase)
    {
        "AcquisitionDate", "CommisioningDate", "InserviceDate", "DateOfDisposal",
        "Impairment_Date", "VerificationDate", "Date_Donated", "RevaluationDate",
        "DateCaptured", "ConditionCheckDate", "DateOfTransfer", "InvoiceDate",
        "LastRevaluationDate", "ReadyForUse"
    };

    private static object? UnwrapJsonElement(JsonElement je)
    {
        return je.ValueKind switch
        {
            JsonValueKind.String  => je.GetString(),
            JsonValueKind.Number  => je.TryGetInt64(out var l) ? (object)l : je.GetDecimal(),
            JsonValueKind.True    => true,
            JsonValueKind.False   => false,
            JsonValueKind.Null    => null,
            _                    => je.ToString()
        };
    }

    private static DynamicParameters BuildAssetParameters(Dictionary<string, JsonElement> assetData)
    {
        var parameters = new DynamicParameters();
        foreach (var kvp in assetData)
        {
            var rawVal = UnwrapJsonElement(kvp.Value);
            if (DateColumns.Contains(kvp.Key) && rawVal is string dateStr && !string.IsNullOrWhiteSpace(dateStr))
            {
                parameters.Add(kvp.Key, DateTime.TryParse(dateStr, out var dt) ? dt : (DateTime?)null);
            }
            else
            {
                parameters.Add(kvp.Key, rawVal);
            }
        }
        return parameters;
    }

    private static async Task<int> ApproveAcquisition(
        System.Data.Common.DbConnection conn,
        System.Data.Common.DbTransaction txn,
        Dictionary<string, JsonElement> assetData)
    {
        // Build INSERT from AssetData payload
        var columns   = new List<string>();
        var paramNames = new List<string>();

        foreach (var key in assetData.Keys)
        {
            if (string.Equals(key, "AssetRegisterItem_ID", StringComparison.OrdinalIgnoreCase)) continue;
            columns.Add($@"""{key}""");
            paramNames.Add($"@{key}");
        }

        var parameters = BuildAssetParameters(assetData);

        var insertSql = $@"
            INSERT INTO ""Asset_Register_Items"" ({string.Join(", ", columns)})
            VALUES ({string.Join(", ", paramNames)})
            RETURNING ""AssetRegisterItem_ID""";

        return await conn.QuerySingleAsync<int>(insertSql, parameters, transaction: txn);
    }

    private static async Task ApproveEdit(
        System.Data.Common.DbConnection conn,
        System.Data.Common.DbTransaction txn,
        int assetId,
        Dictionary<string, JsonElement> assetData)
    {
        if (assetData.Count == 0) return;

        var setClauses = new List<string>();
        foreach (var key in assetData.Keys)
        {
            if (string.Equals(key, "AssetRegisterItem_ID", StringComparison.OrdinalIgnoreCase)) continue;
            setClauses.Add($@"""{key}"" = @{key}");
        }

        if (setClauses.Count == 0) return;

        setClauses.Add(@"""DateModified"" = NOW()");

        var parameters = BuildAssetParameters(assetData);
        parameters.Add("assetId", assetId);

        var updateSql = $@"
            UPDATE ""Asset_Register_Items""
            SET {string.Join(", ", setClauses)}
            WHERE ""AssetRegisterItem_ID"" = @assetId";

        await conn.ExecuteAsync(updateSql, parameters, transaction: txn);
    }
}

public class RejectionRequest
{
    public string? Reason { get; set; }
}
