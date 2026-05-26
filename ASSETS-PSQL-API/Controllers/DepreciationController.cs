using Microsoft.AspNetCore.Mvc;
using Dapper;
using AssetManagement.Data;
using AssetManagement.Filters;
using AssetManagement.Models;
using AssetManagement.Services;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/depreciation")]
public class DepreciationController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    private readonly TransactionService _txnService;
    private readonly LookupService _lookupService;
    private readonly EmailService _emailService;
    private record RebuildProgressEntry(int Done, int Total, bool Complete, List<int> FailedAssets, int Mismatched, int AutoCorrected);
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, RebuildProgressEntry> _rebuildProgress = new();

    public DepreciationController(DbConnectionFactory db, TransactionService txnService, LookupService lookupService, EmailService emailService)
    {
        _db = db;
        _txnService = txnService;
        _lookupService = lookupService;
        _emailService = emailService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? finYear, [FromQuery] int? monthId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT * FROM ""Asset_Depreciation"" WHERE 1=1";
        var parameters = new DynamicParameters();
        if (!string.IsNullOrEmpty(finYear))
        {
            sql += @" AND ""FinYear"" = @finYear";
            parameters.Add("finYear", finYear);
        }
        if (monthId.HasValue)
        {
            sql += @" AND ""MonthID"" = @monthId";
            parameters.Add("monthId", monthId.Value);
        }
        sql += @" ORDER BY ""Asset_Depreciation_ID"" DESC";
        var items = await conn.QueryAsync<AssetDepreciation>(sql, parameters);
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var item = await conn.QueryFirstOrDefaultAsync<AssetDepreciation>(
            @"SELECT * FROM ""Asset_Depreciation"" WHERE ""Asset_Depreciation_ID"" = @id", new { id });
        return item is null ? NotFound(new { error = "Depreciation record not found" }) : Ok(item);
    }

    [HttpGet("by-asset/{assetId:int}")]
    public async Task<IActionResult> GetByAsset(int assetId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var items = await conn.QueryAsync<AssetDepreciation>(
            @"SELECT * FROM ""Asset_Depreciation"" WHERE ""AssetRegisterItem_ID"" = @assetId ORDER BY ""DepreciationDate"" DESC",
            new { assetId });
        return Ok(items);
    }

    [HttpGet("schedules")]
    public async Task<IActionResult> GetSchedules([FromQuery] string? finYear)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT s.*, s.""Asset_DepreciationSchedule_ID"" AS ""DepreciationSchedule_ID"",
                       (SELECT MAX(si.""FinancialPeriod"") FROM ""Asset_DepreciationSchedule_Item"" si
                        WHERE si.""Asset_DepreciationSchedule_ID"" = s.""Asset_DepreciationSchedule_ID"") AS ""FinancialPeriod""
                   FROM ""Asset_DepreciationSchedule"" s
                   WHERE (s.""RunType_ID"" IS NULL OR s.""RunType_ID"" NOT IN (
                       SELECT ""RunType_ID"" FROM ""Const_Asset_Run_Type""
                       WHERE ""RunTypeDesc"" ILIKE '%Catch%'))";
        if (!string.IsNullOrEmpty(finYear))
            sql += @" AND s.""FinYear"" = @finYear";
        sql += @" ORDER BY s.""Asset_DepreciationSchedule_ID"" DESC";
        var items = await conn.QueryAsync<AssetDepreciationSchedule>(sql, new { finYear });
        return Ok(items);
    }

    [HttpGet("schedules/{id:int}")]
    public async Task<IActionResult> GetScheduleById(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var schedule = await conn.QueryFirstOrDefaultAsync<AssetDepreciationSchedule>(
            @"SELECT *, ""Asset_DepreciationSchedule_ID"" AS ""DepreciationSchedule_ID"" FROM ""Asset_DepreciationSchedule"" WHERE ""Asset_DepreciationSchedule_ID"" = @id", new { id });
        if (schedule is null) return NotFound(new { error = "Depreciation schedule not found" });

        var items = await conn.QueryAsync<dynamic>(
            @"SELECT dsi.*,
                     dsi.""Asset_DepreciationSchedule_Item_ID"" AS ""DepreciationScheduleItem_ID"",
                     t.""AssetTypeDesc"" AS ""AssetTypeName"",
                     cat.""AssetCategoryDesc"" AS ""CategoryName"",
                     sub.""Asset_SubCategoryDescription"" AS ""SubCategoryName"",
                     s.""AssetStatusDesc"" AS ""StatusName"",
                     m.""Name"" AS ""MeasurementTypeName"",
                     '' AS ""DepartmentName"",
                     '' AS ""DivisionName""
              FROM ""Asset_DepreciationSchedule_Item"" dsi
              LEFT JOIN ""Const_AssetType_Sys"" t ON COALESCE(dsi.""TypeID"", dsi.""AssetType_ID"") = t.""AssetType_ID""
              LEFT JOIN ""Const_AssetCategory_sys"" cat ON COALESCE(dsi.""CategoryID"", dsi.""AssetCategory_ID"") = cat.""AssetCategoryID""
              LEFT JOIN ""Const_Asset_SubCategory"" sub ON COALESCE(dsi.""SubCategoryID"", dsi.""Asset_SubCategory_ID"") = sub.""Asset_SubCategory_ID""
              LEFT JOIN ""Const_AssetStatus_Sys"" s ON COALESCE(dsi.""AssetStatusID"", dsi.""AssetStatus_ID"") = s.""AssetStatus_ID""
              LEFT JOIN ""AssetConfig_MeasurementType"" m ON COALESCE(dsi.""MeasurementTypeID"", dsi.""MeasurementType_ID"") = m.""AssetConfig_MeasurementType_ID""
              WHERE dsi.""Asset_DepreciationSchedule_ID"" = @id
              ORDER BY dsi.""Asset_DepreciationSchedule_Item_ID""",
            new { id });
        return Ok(new { schedule, items });
    }

    [HttpGet("schedule-items/{scheduleId:int}/details")]
    public async Task<IActionResult> GetScheduleItemDetails(int scheduleId, [FromQuery] string? ids, [FromQuery] int? itemId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var sql = BuildDetailSql(_db.IsSqlServer);
        var whereClause = @" WHERE dsi.""Asset_DepreciationSchedule_ID"" = @scheduleId";

        if (itemId.HasValue)
        {
            whereClause += @" AND dsi.""Asset_DepreciationSchedule_Item_ID"" = @itemId";
            sql += whereClause + @" ORDER BY dsi.""Asset_DepreciationSchedule_Item_ID"", d.""AssetRegisterItem_ID""";
            var details = await conn.QueryAsync<dynamic>(sql, new { scheduleId, itemId = itemId.Value });
            return Ok(details);
        }

        if (!string.IsNullOrEmpty(ids))
        {
            int[] itemIds;
            try { itemIds = ids.Split(',').Select(int.Parse).ToArray(); }
            catch { return BadRequest(new { error = "Invalid ids parameter — must be comma-separated integers" }); }
            whereClause += @" AND dsi.""Asset_DepreciationSchedule_Item_ID"" = ANY(@itemIds)";
            sql += whereClause + @" ORDER BY dsi.""Asset_DepreciationSchedule_Item_ID"", d.""AssetRegisterItem_ID""";
            var details = await conn.QueryAsync<dynamic>(sql, new { scheduleId, itemIds });
            return Ok(details);
        }

        sql += whereClause + @" ORDER BY dsi.""Asset_DepreciationSchedule_Item_ID"", d.""AssetRegisterItem_ID""";
        var results = await conn.QueryAsync<dynamic>(sql, new { scheduleId });
        return Ok(results);
    }

    [HttpGet("schedule-items/{scheduleId:int}/export")]
    public async Task<IActionResult> ExportScheduleItemDetails(int scheduleId, [FromQuery] int? itemId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var sql = BuildDetailSql(_db.IsSqlServer);
        var whereClause = @" WHERE dsi.""Asset_DepreciationSchedule_ID"" = @scheduleId";
        if (itemId.HasValue)
            whereClause += @" AND dsi.""Asset_DepreciationSchedule_Item_ID"" = @itemId";
        sql += whereClause + @" ORDER BY dsi.""Asset_DepreciationSchedule_Item_ID"", d.""AssetRegisterItem_ID""";

        var results = (await conn.QueryAsync<dynamic>(sql, new { scheduleId, itemId = itemId ?? 0 })).ToList();

        using var workbook = new ClosedXML.Excel.XLWorkbook();
        var ws = workbook.Worksheets.Add("Depreciation Run Details Report");

        var headers = new[] {
            "Asset DepreciationSchedule Item ID", "Scheduled Date", "AssetRegisterItem ID",
            "Asset Type", "Asset Category", "CategoryID", "Sub Category", "SubCategoryID",
            "Measurement Type", "Asset Status", "In Service Date",
            "Useful Life (Months)", "Useful Life (Days)",
            "Remaining Useful Life (Months)", "Remaining Useful Life (Days)",
            "Days From Last Run", "Cost/Purchase Amount", "Residual Value",
            "Depreciation for the Period", "CarryingAmountClosingBalance", "RemainingUsefulLife",
            "Accumulated Depreciation", "Carrying Amount",
            "AccumulatedRevaluationReserveClosingBalance",
            "DepreciationOffset Opening Balance", "DepreciationOffset", "DepreciationOffset Closing Balance",
            "TotalDepreciation", "TotalDepreciationOffset",
            "Depreciation Projects", "Depreciation SCOA Items"
        };
        for (int i = 0; i < headers.Length; i++)
            ws.Cell(1, i + 1).Value = headers[i];

        var headerRow = ws.Row(1);
        headerRow.Style.Font.Bold = true;
        headerRow.Style.Fill.BackgroundColor = ClosedXML.Excel.XLColor.FromHtml("#D9E1F2");

        int row = 2;
        foreach (var r in results)
        {
            var dict = (IDictionary<string, object?>)r;
            ws.Cell(row, 1).Value = Convert.ToInt32(dict["ScheduleItemId"] ?? 0);
            ws.Cell(row, 2).Value = dict["ScheduledDate"]?.ToString() ?? "";
            ws.Cell(row, 3).Value = Convert.ToInt32(dict["AssetRegisterItemId"] ?? 0);
            ws.Cell(row, 4).Value = dict["AssetType"]?.ToString() ?? "";
            ws.Cell(row, 5).Value = dict["AssetCategory"]?.ToString() ?? "";
            ws.Cell(row, 6).Value = Convert.ToInt32(dict["CategoryID"] ?? 0);
            ws.Cell(row, 7).Value = dict["SubCategory"]?.ToString() ?? "";
            ws.Cell(row, 8).Value = Convert.ToInt32(dict["SubCategoryID"] ?? 0);
            ws.Cell(row, 9).Value = dict["MeasurementType"]?.ToString() ?? "";
            ws.Cell(row, 10).Value = dict["AssetStatus"]?.ToString() ?? "";
            ws.Cell(row, 11).Value = dict["InServiceDate"]?.ToString() ?? "";
            ws.Cell(row, 12).Value = Convert.ToDecimal(dict["UsefulLifeMonths"] ?? 0m);
            ws.Cell(row, 13).Value = Convert.ToInt32(dict["UsefulLifeDays"] ?? 0);
            ws.Cell(row, 14).Value = Convert.ToDecimal(dict["RemainingUsefulLifeMonths"] ?? 0m);
            ws.Cell(row, 15).Value = Convert.ToInt32(dict["RemainingUsefulLifeDays"] ?? 0);
            ws.Cell(row, 16).Value = Convert.ToInt32(dict["DaysFromLastRun"] ?? 0);
            ws.Cell(row, 17).Value = Convert.ToDecimal(dict["CostPurchaseAmount"] ?? 0m);
            ws.Cell(row, 18).Value = Convert.ToDecimal(dict["ResidualValue"] ?? 0m);
            ws.Cell(row, 19).Value = Convert.ToDecimal(dict["DepreciationForPeriod"] ?? 0m);
            ws.Cell(row, 20).Value = Convert.ToDecimal(dict["CarryingAmount"] ?? 0m);
            ws.Cell(row, 21).Value = Convert.ToDecimal(dict["OriginalRemainingUsefulLife"] ?? 0m);
            ws.Cell(row, 22).Value = Convert.ToDecimal(dict["AccumulatedDepreciation"] ?? 0m);
            ws.Cell(row, 23).Value = Convert.ToDecimal(dict["CarryingAmount"] ?? 0m);
            ws.Cell(row, 24).Value = Convert.ToDecimal(dict["AccumulatedRevaluationReserveClosingBalance"] ?? 0m);
            ws.Cell(row, 25).Value = Convert.ToDecimal(dict["DepreciationOffsetOpeningBalance"] ?? 0m);
            ws.Cell(row, 26).Value = Convert.ToDecimal(dict["DepreciationOffset"] ?? 0m);
            ws.Cell(row, 27).Value = Convert.ToDecimal(dict["DepreciationOffsetClosingBalance"] ?? 0m);
            ws.Cell(row, 28).Value = Convert.ToDecimal(dict["TotalDepreciation"] ?? 0m);
            ws.Cell(row, 29).Value = Convert.ToDecimal(dict["TotalDepreciationOffset"] ?? 0m);
            ws.Cell(row, 30).Value = dict["DepreciationProject"]?.ToString() ?? "";
            ws.Cell(row, 31).Value = dict["DepreciationScoaItem"]?.ToString() ?? "";
            row++;
        }

        ws.Columns().AdjustToContents();
        using var stream = new System.IO.MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;
        return File(stream.ToArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"Depreciation_Run_Details_{scheduleId}.xlsx");
    }

    private static string BuildDetailSql(bool isSqlServer)
    {
        string atsJoin = isSqlServer
            ? @"OUTER APPLY (
                SELECT TOP 1 ""DepreciationOffset"" AS ""DepreciationOffsetClosingBalance"", ""RemainingUsefulLife""
                FROM ""Asset_Transaction_Summary""
                WHERE ""AssetRegisterItemID"" = d.""AssetRegisterItem_ID""
                ORDER BY ""ID"" DESC
            ) ats"
            : @"LEFT JOIN LATERAL (
                SELECT ""DepreciationOffset"" AS ""DepreciationOffsetClosingBalance"", ""RemainingUsefulLife""
                FROM ""Asset_Transaction_Summary""
                WHERE ""AssetRegisterItemID"" = d.""AssetRegisterItem_ID""
                ORDER BY ""ID"" DESC OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY
            ) ats ON true";
        return $@"
            SELECT
                dsi.""Asset_DepreciationSchedule_Item_ID"" AS ""ScheduleItemId"",
                CAST(dsi.""ScheduledDate"" AS DATE) AS ""ScheduledDate"",
                d.""AssetRegisterItem_ID"" AS ""AssetRegisterItemId"",
                ari.""Description"",
                t.""AssetTypeDesc"" AS ""AssetType"",
                cat.""AssetCategoryDesc"" AS ""AssetCategory"",
                COALESCE(dsi.""CategoryID"", dsi.""AssetCategory_ID"", 0) AS ""CategoryID"",
                sub.""Asset_SubCategoryDescription"" AS ""SubCategory"",
                COALESCE(dsi.""SubCategoryID"", dsi.""Asset_SubCategory_ID"", 0) AS ""SubCategoryID"",
                m.""Name"" AS ""MeasurementType"",
                s.""AssetStatusDesc"" AS ""AssetStatus"",
                ari.""InserviceDate"" AS ""InServiceDate"",
                ari.""UsefulLifeMonthComponent"" AS ""UsefulLifeMonths"",
                CAST(ROUND(COALESCE(ari.""UsefulLifeMonthComponent"", 0) / 12.0 * 365, 0) AS INTEGER) AS ""UsefulLifeDays"",
                d.""UsefullLife"" AS ""RemainingUsefulLifeMonths"",
                CAST(ROUND(COALESCE(d.""UsefullLife"", 0) / 12.0 * 365, 0) AS INTEGER) AS ""RemainingUsefulLifeDays"",
                COALESCE(ari.""RemainingUsefulLife"", d.""UsefullLife"", 0) AS ""OriginalRemainingUsefulLife"",
                d.""DaysFromLastRun"",
                ari.""PurchaseAmount"" AS ""CostPurchaseAmount"",
                d.""ResidualValue"",
                COALESCE(d.""DepreciationValue"", d.""DepreciationAmount"") AS ""DepreciationForPeriod"",
                COALESCE(ari.""AccumulatedDepreciationClosingBalance"", 0) + COALESCE(d.""DepreciationValue"", d.""DepreciationAmount"", 0) AS ""AccumulatedDepreciation"",
                d.""CarryingAmountClosingBalance"" AS ""CarryingAmount"",
                COALESCE(ari.""RevaluationReserveClosingBalance"", 0) AS ""AccumulatedRevaluationReserveClosingBalance"",
                COALESCE(ats.""DepreciationOffsetClosingBalance"", 0) AS ""DepreciationOffsetOpeningBalance"",
                CASE
                    WHEN COALESCE(ari.""RevaluationReserveClosingBalance"", 0) > 0 AND COALESCE(ari.""RemainingUsefulLife"", 0) > 0 THEN
                        CASE
                            WHEN COALESCE(ari.""RevaluationReserveClosingBalance"", 0) -
                                 (COALESCE(ari.""RevaluationReserveClosingBalance"", 0) / (COALESCE(ari.""RemainingUsefulLife"", 0) / 12.0 * 365) * d.""DaysFromLastRun"") < 0
                            THEN COALESCE(ari.""RevaluationReserveClosingBalance"", 0)
                            ELSE ROUND(CAST(COALESCE(ari.""RevaluationReserveClosingBalance"", 0) / (COALESCE(ari.""RemainingUsefulLife"", 0) / 12.0 * 365) * d.""DaysFromLastRun"" AS NUMERIC), 2)
                        END
                    ELSE 0
                END AS ""DepreciationOffset"",
                COALESCE(ats.""DepreciationOffsetClosingBalance"", 0) +
                CASE
                    WHEN COALESCE(ari.""RevaluationReserveClosingBalance"", 0) > 0 AND COALESCE(ari.""RemainingUsefulLife"", 0) > 0 THEN
                        CASE
                            WHEN COALESCE(ari.""RevaluationReserveClosingBalance"", 0) -
                                 (COALESCE(ari.""RevaluationReserveClosingBalance"", 0) / (COALESCE(ari.""RemainingUsefulLife"", 0) / 12.0 * 365) * d.""DaysFromLastRun"") < 0
                            THEN COALESCE(ari.""RevaluationReserveClosingBalance"", 0)
                            ELSE ROUND(CAST(COALESCE(ari.""RevaluationReserveClosingBalance"", 0) / (COALESCE(ari.""RemainingUsefulLife"", 0) / 12.0 * 365) * d.""DaysFromLastRun"" AS NUMERIC), 2)
                        END
                    ELSE 0
                END AS ""DepreciationOffsetClosingBalance"",
                COALESCE(d.""DepreciationValue"", d.""DepreciationAmount"", 0) AS ""TotalDepreciation"",
                CASE
                    WHEN COALESCE(ari.""RevaluationReserveClosingBalance"", 0) > 0 AND COALESCE(ari.""RemainingUsefulLife"", 0) > 0 THEN
                        CASE
                            WHEN COALESCE(ari.""RevaluationReserveClosingBalance"", 0) -
                                 (COALESCE(ari.""RevaluationReserveClosingBalance"", 0) / (COALESCE(ari.""RemainingUsefulLife"", 0) / 12.0 * 365) * d.""DaysFromLastRun"") < 0
                            THEN COALESCE(ari.""RevaluationReserveClosingBalance"", 0)
                            ELSE ROUND(CAST(COALESCE(ari.""RevaluationReserveClosingBalance"", 0) / (COALESCE(ari.""RemainingUsefulLife"", 0) / 12.0 * 365) * d.""DaysFromLastRun"" AS NUMERIC), 2)
                        END
                    ELSE 0
                END AS ""TotalDepreciationOffset"",
                CAST(NULL AS VARCHAR) AS ""DepreciationProject"",
                CAST(NULL AS VARCHAR) AS ""DepreciationScoaItem"",
                dsi.""FinancialPeriod"",
                dsi.""TotalAssets"" AS ""GroupTotalAssets"",
                dsi.""TotalDepreciation"" AS ""GroupTotalDepreciation"",
                d.""IsApproved""
            FROM ""Asset_DepreciationSchedule_Item"" dsi
            INNER JOIN ""Asset_Depreciation"" d ON dsi.""Asset_DepreciationSchedule_Item_ID"" = d.""Depreciation_ScheduledItemID""
            INNER JOIN ""Asset_Register_Items"" ari ON d.""AssetRegisterItem_ID"" = ari.""AssetRegisterItem_ID""
            LEFT JOIN ""Const_AssetType_Sys"" t ON COALESCE(dsi.""TypeID"", dsi.""AssetType_ID"") = t.""AssetType_ID""
            LEFT JOIN ""Const_AssetCategory_sys"" cat ON COALESCE(dsi.""CategoryID"", dsi.""AssetCategory_ID"") = cat.""AssetCategoryID""
            LEFT JOIN ""Const_Asset_SubCategory"" sub ON COALESCE(dsi.""SubCategoryID"", dsi.""Asset_SubCategory_ID"") = sub.""Asset_SubCategory_ID""
            LEFT JOIN ""Const_AssetStatus_Sys"" s ON COALESCE(dsi.""AssetStatusID"", dsi.""AssetStatus_ID"") = s.""AssetStatus_ID""
            LEFT JOIN ""AssetConfig_MeasurementType"" m ON COALESCE(dsi.""MeasurementTypeID"", dsi.""MeasurementType_ID"") = m.""AssetConfig_MeasurementType_ID""
            {atsJoin}";
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetDepreciationStatus([FromQuery] string? finYear)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var sql = @"SELECT * FROM ""Asset_DepreciationApproval""";
        if (!string.IsNullOrEmpty(finYear))
            sql += @" WHERE ""FinYear"" = @finYear";
        sql += @" ORDER BY ""DepreciationApproval_ID"" DESC";
        var items = await conn.QueryAsync<AssetDepreciationApproval>(sql, new { finYear });
        return Ok(items);
    }

    [HttpGet("calculate-days")]
    public async Task<IActionResult> CalculateDays([FromQuery] int assetId, [FromQuery] string? fromDate, [FromQuery] string? toDate)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var asset = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT a.""AssetRegisterItem_ID"", a.""PurchaseAmount"", a.""ResidualValue"",
                     a.""UsefulLifeMonthComponent"", a.""UsefulLifeYearComponent"", a.""InserviceDate"",
                     COALESCE(s.""RemainingUsefulLife"", a.""RemainingUsefulLife"", a.""UsefulLifeMonthComponent"") AS ""RemainingUsefulLife"",
                     COALESCE(s.""CarryingAmount"", a.""CurrentAmount"", a.""CarryingAmountClosingBalance"") AS ""CurrentAmount"",
                     COALESCE(s.""AccumulatedDepreciationClosingBalance"", a.""AccumulatedDepreciationClosingBalance"") AS ""AccumulatedDepreciationClosingBalance"",
                     COALESCE(s.""AccumulatedRevaluationClosingBalance"", a.""RevaluationReserveClosingBalance"", a.""RevaluationOpeningBalance"", 0) AS ""RevalReserve""
              FROM ""Asset_Register_Items"" a
              LEFT JOIN LATERAL (
                  SELECT ""CarryingAmount"", ""AccumulatedDepreciationClosingBalance"",
                         ""AccumulatedRevaluationClosingBalance"", ""RemainingUsefulLife""
                  FROM ""Asset_Transaction_Summary""
                  WHERE COALESCE(""AssetRegisterItemID"", ""AssetRegisterItem_ID"") = @assetId
                  ORDER BY CAST(LEFT(COALESCE(""FinancialYear"", '0000/0000'), 4) AS INTEGER) DESC,
                           ""FinancialPeriod"" DESC, ""ID"" DESC
                  LIMIT 1
              ) s ON true
              WHERE a.""AssetRegisterItem_ID"" = @assetId", new { assetId });

        if (asset is null) return NotFound(new { error = "Asset not found" });

        var lastDepDate = await conn.QueryFirstOrDefaultAsync<DateTime?>(
            @"SELECT MAX(latest) FROM (
                SELECT MAX(""DepreciationDate"") AS latest FROM ""Asset_Depreciation""
                  WHERE ""AssetRegisterItem_ID"" = @assetId
                UNION ALL
                SELECT MAX(""TransactionDate"") AS latest FROM ""Asset_Register_Transactions""
                  WHERE ""AssetRegisterItem_ID"" = @assetId
                    AND ""TransactionTypeID"" IN (
                      SELECT ""ReferenceData_ID"" FROM ""Const_ReferenceData_sys""
                      WHERE ""Description"" IN ('Depreciation', 'Impairment')
                    )
              ) sub", new { assetId });

        DateTime depFromDate;
        if (lastDepDate.HasValue)
            depFromDate = lastDepDate.Value;
        else if (asset.InserviceDate != null)
            depFromDate = (DateTime)asset.InserviceDate;
        else
            depFromDate = DateTime.Parse("2024-07-01");

        DateTime depToDate = string.IsNullOrEmpty(toDate) ? DateTime.Today : DateTime.Parse(toDate);

        decimal remainingUsefulLifeMonths = (decimal)(asset.RemainingUsefulLife ?? asset.UsefulLifeMonthComponent ?? (asset.UsefulLifeYearComponent != null ? asset.UsefulLifeYearComponent * 12m : 0m));

        if (remainingUsefulLifeMonths <= 0)
            return Ok(new { assetId, depreciationAmount = 0m, depreciationOffset = 0m, days = 0, dailyRate = 0m, fromDate = depFromDate.ToString("yyyy-MM-dd"), toDate = depToDate.ToString("yyyy-MM-dd"), error = "No useful life defined" });

        decimal currentValue = (decimal)(asset.CurrentAmount ?? asset.CarryingAmountClosingBalance ?? asset.PurchaseAmount ?? 0m);
        decimal residual = (decimal)(asset.ResidualValue ?? 0m);
        decimal cost = (decimal)(asset.PurchaseAmount ?? 0m);
        decimal depreciableAmount = currentValue - residual;
        if (depreciableAmount < 0) depreciableAmount = 0;

        decimal rulDaysCalc = remainingUsefulLifeMonths / 12m * 365m;
        int periodDays = (int)(depToDate - depFromDate).TotalDays;
        if (periodDays < 0) periodDays = 0;
        bool calcExceedsRul = (decimal)periodDays >= rulDaysCalc;
        int days = calcExceedsRul ? (int)Math.Ceiling(rulDaysCalc) : periodDays;

        decimal depreciationAmount = calcExceedsRul
            ? depreciableAmount
            : Math.Round(depreciableAmount / rulDaysCalc * days, 2);

        if (depreciationAmount > depreciableAmount) depreciationAmount = depreciableAmount;

        decimal revalReserve = (decimal)(asset.RevalReserve ?? 0m);
        decimal depreciationOffset = 0m;
        if (revalReserve > 0 && remainingUsefulLifeMonths > 0)
        {
            decimal totalRemainingDays = remainingUsefulLifeMonths / 12m * 365m;
            if (totalRemainingDays > 0)
            {
                depreciationOffset = Math.Round(revalReserve / totalRemainingDays * days, 2);
                if (depreciationOffset > revalReserve)
                    depreciationOffset = revalReserve;
            }
        }

        decimal currentAccDep = (decimal)(asset.AccumulatedDepreciationClosingBalance ?? 0m);
        decimal newAccumulatedDepreciation = currentAccDep + depreciationAmount;
        decimal newCarryingAmount = cost - newAccumulatedDepreciation;
        if (newCarryingAmount < residual) newCarryingAmount = residual;

        decimal dailyRate = remainingUsefulLifeMonths > 0 ? depreciableAmount * 12m / remainingUsefulLifeMonths / 365m : 0m;

        return Ok(new
        {
            assetId,
            depreciationAmount,
            depreciationOffset = Math.Round(depreciationOffset, 2),
            revaluationReserve = revalReserve,
            days,
            dailyRate = Math.Round(dailyRate, 4),
            fromDate = depFromDate.ToString("yyyy-MM-dd"),
            toDate = depToDate.ToString("yyyy-MM-dd"),
            cost,
            currentValue,
            residualValue = residual,
            remainingUsefulLifeMonths,
            currentAccumulatedDepreciation = currentAccDep,
            newAccumulatedDepreciation = Math.Round(newAccumulatedDepreciation, 2),
            newCarryingAmount = Math.Round(newCarryingAmount, 2),
            carryingAmountBefore = (decimal)(asset.CarryingAmountClosingBalance ?? 0m),
            carryingAmountAfter = Math.Round(newCarryingAmount, 2)
        });
    }

    [HttpGet("last-date")]
    public async Task<IActionResult> GetLastDepreciationDate()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var row = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT MAX(""DepreciationDate"") as ""lastDate"" FROM ""Asset_Depreciation""");
        var lastDate = row?.lastDate;
        return Ok(new { lastDepreciationDate = lastDate != null ? ((DateTime)lastDate).ToString("yyyy-MM-dd") : (string?)null });
    }

    [HttpPost("assets/{assetId:int}/calculate-depreciation")]
    public async Task<IActionResult> CalculateDepreciation(int assetId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var asset = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT ""AssetRegisterItem_ID"", ""PurchaseAmount"", ""ResidualValue"",
                     ""RemainingUsefulLife"", ""UsefulLifeMonthComponent"", ""UsefulLifeYearComponent"",
                     ""AccumulatedDepreciationClosingBalance"", ""CarryingAmountClosingBalance"", ""CurrentAmount"", ""InserviceDate""
             FROM ""Asset_Register_Items"" WHERE ""AssetRegisterItem_ID"" = @assetId", new { assetId });

        if (asset is null) return NotFound(new { error = "Asset not found" });

        decimal remainingUsefulLifeMonths = (decimal)(asset.RemainingUsefulLife ?? asset.UsefulLifeMonthComponent ?? (asset.UsefulLifeYearComponent != null ? asset.UsefulLifeYearComponent * 12m : 0m));

        if (remainingUsefulLifeMonths <= 0)
            return BadRequest(new { error = "Asset has no useful life defined" });

        decimal currentValue = (decimal)(asset.CurrentAmount ?? asset.CarryingAmountClosingBalance ?? asset.PurchaseAmount ?? 0m);
        decimal residual = (decimal)(asset.ResidualValue ?? 0m);
        decimal cost = (decimal)(asset.PurchaseAmount ?? 0m);
        decimal depreciableAmount = currentValue - residual;
        if (depreciableAmount < 0) depreciableAmount = 0;

        int days = (int)(remainingUsefulLifeMonths * 30.44m);
        decimal monthlyDepreciation = depreciableAmount * 12m / remainingUsefulLifeMonths / 365m * days;
        monthlyDepreciation = Math.Round(monthlyDepreciation, 2);
        if (monthlyDepreciation > depreciableAmount) monthlyDepreciation = depreciableAmount;

        decimal accumulatedDepreciation = (decimal)(asset.AccumulatedDepreciationClosingBalance ?? 0m);
        decimal newAccumulated = accumulatedDepreciation + monthlyDepreciation;
        decimal newCarryingAmount = cost - newAccumulated;
        if (newCarryingAmount < residual) newCarryingAmount = residual;

        return Ok(new
        {
            assetId,
            cost,
            currentValue,
            residualValue = residual,
            remainingUsefulLifeMonths,
            currentAccumulatedDepreciation = accumulatedDepreciation,
            calculatedMonthlyDepreciation = monthlyDepreciation,
            newAccumulatedDepreciation = newAccumulated,
            newCarryingAmount
        });
    }

    [HttpPost("assets/{assetId:int}/depreciate")]
    public async Task<IActionResult> Depreciate(int assetId, [FromBody] DepreciateRequest request)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var asset = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT ""AssetRegisterItem_ID"", ""PurchaseAmount"", ""ResidualValue"",
                     ""RemainingUsefulLife"", ""UsefulLifeMonthComponent"", ""UsefulLifeYearComponent"",
                     ""AccumulatedDepreciationClosingBalance"", ""CarryingAmountClosingBalance"", ""CurrentAmount""
             FROM ""Asset_Register_Items"" WHERE ""AssetRegisterItem_ID"" = @assetId", new { assetId });

        if (asset is null) return NotFound(new { error = "Asset not found" });

        decimal remainingUsefulLifeMonths = (decimal)(asset.RemainingUsefulLife ?? asset.UsefulLifeMonthComponent ?? (asset.UsefulLifeYearComponent != null ? asset.UsefulLifeYearComponent * 12m : 0m));

        if (remainingUsefulLifeMonths <= 0)
            return BadRequest(new { error = "Asset has no useful life defined" });

        decimal currentValue = (decimal)(asset.CurrentAmount ?? asset.CarryingAmountClosingBalance ?? asset.PurchaseAmount ?? 0m);
        decimal residual = (decimal)(asset.ResidualValue ?? 0m);
        decimal cost = (decimal)(asset.PurchaseAmount ?? 0m);
        decimal depreciableAmount = currentValue - residual;
        if (depreciableAmount < 0) depreciableAmount = 0;

        int days = (int)(remainingUsefulLifeMonths * 30.44m);
        decimal monthlyDepreciation = depreciableAmount * 12m / remainingUsefulLifeMonths / 365m * days;
        monthlyDepreciation = Math.Round(monthlyDepreciation, 2);
        if (monthlyDepreciation > depreciableAmount) monthlyDepreciation = depreciableAmount;

        decimal accumulatedDepreciation = (decimal)(asset.AccumulatedDepreciationClosingBalance ?? 0m);
        decimal newAccumulated = accumulatedDepreciation + monthlyDepreciation;
        decimal newCarryingAmount = cost - newAccumulated;
        if (newCarryingAmount < residual)
        {
            monthlyDepreciation = (decimal)(asset.CarryingAmountClosingBalance ?? 0m) - residual;
            if (monthlyDepreciation < 0) monthlyDepreciation = 0;
            newAccumulated = accumulatedDepreciation + monthlyDepreciation;
            newCarryingAmount = cost - newAccumulated;
        }

        await using var txn = await conn.BeginTransactionAsync();

        var depId = await conn.QuerySingleAsync<int>(@"
            INSERT INTO ""Asset_Depreciation"" (""AssetRegisterItem_ID"", ""DepreciationDate"",
                ""DepreciationAmount"", ""AccumulatedDepreciation"", ""CarryingAmount"",
                ""RunType_ID"", ""RunStatus_ID"", ""FinYear"", ""MonthID"", ""DateCaptured"", ""CapturerID"")
            VALUES (@assetId, NOW(), @monthlyDepreciation, @newAccumulated, @newCarryingAmount,
                @RunTypeId, 1, @FinYear, @MonthId, NOW(), 1)
            RETURNING ""Asset_Depreciation_ID""",
            new { assetId, monthlyDepreciation, newAccumulated, newCarryingAmount,
                  request.RunTypeId, request.FinYear, request.MonthId }, txn);

        await conn.ExecuteAsync(@"
            UPDATE ""Asset_Register_Items""
            SET ""AccumulatedDepreciationClosingBalance"" = @newAccumulated,
                ""CarryingAmountClosingBalance"" = @newCarryingAmount,
                ""DateModified"" = NOW()
            WHERE ""AssetRegisterItem_ID"" = @assetId",
            new { newAccumulated, newCarryingAmount, assetId }, txn);

        await txn.CommitAsync();

        return Ok(new
        {
            success = 1,
            depreciationId = depId,
            depreciationAmount = monthlyDepreciation,
            accumulatedDepreciation = newAccumulated,
            carryingAmount = newCarryingAmount
        });
    }

    [HttpPost("run")]
    public async Task<IActionResult> RunDepreciationBatch([FromBody] DepreciationRunRequest request)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var approvalMethod = await _txnService.GetApprovalMethod(conn);
        if (approvalMethod != "Automated")
        {
            var (pendingImp, pendingDisp, pendingReval) = await _txnService.GetAllPendingTransactionCounts(conn);
            if (pendingImp > 0 || pendingDisp > 0 || pendingReval > 0)
            {
                var parts = new List<string>();
                if (pendingImp > 0) parts.Add($"{pendingImp} unapproved impairment{(pendingImp == 1 ? "" : "s")}");
                if (pendingDisp > 0) parts.Add($"{pendingDisp} pending disposal{(pendingDisp == 1 ? "" : "s")}");
                if (pendingReval > 0) parts.Add($"{pendingReval} unapproved revaluation{(pendingReval == 1 ? "" : "s")}");
                return BadRequest(new { error = $"Cannot run depreciation: there {(parts.Count == 1 && (pendingImp + pendingDisp + pendingReval) == 1 ? "is" : "are")} {string.Join(", ", parts)} requiring approval. Please approve or reject all outstanding transactions before running the depreciation." });
            }
        }

        await using var txn = await conn.BeginTransactionAsync();

        try
        {
            string finYear = request.FinYear ?? _txnService.GetCurrentFinancialPeriod().year;
            DateTime scheduledDate = request.ScheduledDate ?? DateTime.Now;
            var (fyYear, fyPeriod) = _txnService.GetFinancialPeriodForDate(scheduledDate);
            int monthId = fyPeriod;

            bool alreadyApproved = await conn.ExecuteScalarAsync<bool>(@"
                SELECT COUNT(1) > 0
                FROM ""Asset_DepreciationSchedule"" s
                INNER JOIN ""Asset_DepreciationSchedule_Item"" si
                    ON si.""Asset_DepreciationSchedule_ID"" = s.""Asset_DepreciationSchedule_ID""
                WHERE s.""FinYear"" = @finYear
                  AND si.""Month_ID"" = @monthId
                  AND COALESCE(s.""IsApproved"", 0) = 1
                  AND (s.""RunType_ID"" IS NULL OR s.""RunType_ID"" NOT IN (
                      SELECT ""RunType_ID"" FROM ""Const_Asset_Run_Type""
                      WHERE ""RunTypeDesc"" ILIKE '%Catch%'))",
                new { finYear, monthId }, txn);

            if (alreadyApproved)
                return Conflict(new { error = $"Period {monthId} for financial year {finYear} has already been approved and cannot be re-run." });

            // Look up the first available run type — do NOT hardcode 1 (IDs vary per database)
            int? runTypeId = await conn.ExecuteScalarAsync<int?>(
                @"SELECT ""RunType_ID"" FROM ""Const_Asset_Run_Type"" ORDER BY ""RunType_ID"" LIMIT 1", transaction: txn);
            if (runTypeId is null)
                return BadRequest(new { success = 0, message = "No depreciation run types are configured. Please add at least one run type before running depreciation." });

            int scheduleId = await conn.QuerySingleAsync<int>(@"
                INSERT INTO ""Asset_DepreciationSchedule"" (""FinYear"", ""RunDate"", ""RunType_ID"", ""RunStatus_ID"", ""DateCaptured"", ""CapturerID"", ""ScheduledDate"", ""StatusID"", ""PendingApproval"")
                VALUES (@finYear, NOW(), @runTypeId, 1, NOW(), 1, @scheduledDate, 1, 1)
                RETURNING ""Asset_DepreciationSchedule_ID""",
                new { finYear, scheduledDate, runTypeId }, txn);

            var groupings = await conn.QueryAsync<dynamic>(@"
                SELECT DISTINCT COALESCE(""AssetType_ID"", 0) AS ""AssetType_ID"",
                       COALESCE(""AssetCategory_ID"", 0) AS ""AssetCategory_ID"",
                       COALESCE(""Asset_SubCategory_ID"", 0) AS ""Asset_SubCategory_ID"",
                       COALESCE(""MeasurementType_ID"", 0) AS ""MeasurementType_ID"",
                       COALESCE(""AssetStatus_ID"", 0) AS ""AssetStatus_ID"",
                       COALESCE(CAST(NULLIF(""MunicipalDepartment_ID"", '') AS INTEGER), 0) AS ""DepartmentID"",
                       COALESCE(""DivisionID"", 0) AS ""DivisionID""
                FROM ""Asset_Register_Items""
                WHERE COALESCE(""RemainingUsefulLife"", ""UsefulLifeMonthComponent"", 0) > 0
                AND NOT EXISTS (
                    SELECT 1 FROM ""Asset_Disposal"" ad
                    WHERE ad.""AssetItemID"" = ""Asset_Register_Items"".""AssetRegisterItem_ID""
                      AND COALESCE(ad.""Approved"", 0) = 1)
                AND COALESCE(
                    (SELECT ""CurrentValue"" FROM ""Asset_Transaction_Summary""
                     WHERE ""AssetRegisterItemID"" = ""Asset_Register_Items"".""AssetRegisterItem_ID""
                     ORDER BY ""ID"" DESC LIMIT 1),
                    ""CarryingAmountClosingBalance"", ""CurrentAmount"", ""PurchaseAmount"", 0) > COALESCE(""ResidualValue"", 0)", transaction: txn);

            var scheduleItemIds = new List<int>();
            int totalAssetsProcessed = 0;
            decimal totalDepreciationCharge = 0m;

            foreach (var group in groupings)
            {
                int assetTypeId = (int)(group.AssetType_ID ?? 0);
                int assetCategoryId = (int)(group.AssetCategory_ID ?? 0);
                int assetSubCategoryId = (int)(group.Asset_SubCategory_ID ?? 0);
                int measurementTypeId = (int)(group.MeasurementType_ID ?? 0);
                int assetStatusId = (int)(group.AssetStatus_ID ?? 0);
                int groupDeptId = (int)(group.DepartmentID ?? 0);
                int groupDivId = (int)(group.DivisionID ?? 0);

                int itemId = await conn.QuerySingleAsync<int>(@"
                    INSERT INTO ""Asset_DepreciationSchedule_Item""
                        (""Asset_DepreciationSchedule_ID"", ""ScheduledDate"",
                         ""AssetType_ID"", ""AssetCategory_ID"", ""Asset_SubCategory_ID"",
                         ""MeasurementType_ID"", ""AssetStatus_ID"", ""StatusID"", ""FinancialPeriod"", ""FinYear"",
                         ""TypeID"", ""CategoryID"", ""SubCategoryID"", ""MeasurementTypeID"", ""AssetStatusID"",
                         ""DepartmentID"", ""DivisionID"",
                         ""Month_ID"", ""RunType_ID"", ""Date_Captured"", ""Captured_By"")
                    VALUES (@scheduleId, @scheduledDate,
                            @assetTypeId, @assetCategoryId, @assetSubCategoryId,
                            @measurementTypeId, @assetStatusId, 0, @monthId, @finYear,
                            @assetTypeId, @assetCategoryId, @assetSubCategoryId,
                            @measurementTypeId, @assetStatusId,
                            @groupDeptId, @groupDivId,
                            @monthId, @runTypeId, NOW(), 1)
                    RETURNING ""Asset_DepreciationSchedule_Item_ID""",
                    new
                    {
                        scheduleId, scheduledDate,
                        assetTypeId, assetCategoryId, assetSubCategoryId,
                        measurementTypeId, assetStatusId, monthId, finYear,
                        groupDeptId, groupDivId, runTypeId
                    }, txn);
                scheduleItemIds.Add(itemId);

                var assets = await conn.QueryAsync<dynamic>(@"
                    SELECT ari.""AssetRegisterItem_ID"", ari.""PurchaseAmount"", ari.""ResidualValue"",
                           ari.""RemainingUsefulLife"", ari.""UsefulLifeMonthComponent"", ari.""UsefulLifeYearComponent"",
                           ari.""AccumulatedDepreciationClosingBalance"", ari.""CarryingAmountClosingBalance"",
                           ari.""CurrentAmount"", ari.""InserviceDate"",
                           ats.""CurrentValue""                          AS ""AtsCurrentValue"",
                           ats.""RemainingUsefulLife""                   AS ""AtsRemainingUsefulLife"",
                           ats.""AccumulatedDepreciationClosingBalance""  AS ""AtsAccDep"",
                           (SELECT MAX(sub.latest) FROM (
                               SELECT MAX(d2.""DepreciationDate"") AS latest FROM ""Asset_Depreciation"" d2 WHERE d2.""AssetRegisterItem_ID"" = ari.""AssetRegisterItem_ID""
                               UNION ALL
                               SELECT MAX(t2.""TransactionDate"") AS latest FROM ""Asset_Register_Transactions"" t2
                               WHERE t2.""AssetRegisterItem_ID"" = ari.""AssetRegisterItem_ID""
                                 AND t2.""TransactionTypeID"" IN (
                                   SELECT ""ReferenceData_ID"" FROM ""Const_ReferenceData_sys"" WHERE ""Description"" IN ('Depreciation','Impairment')
                                 )
                           ) sub) AS ""LastTransactionDate""
                    FROM ""Asset_Register_Items"" ari
                    LEFT JOIN LATERAL (
                        SELECT ""CurrentValue"", ""RemainingUsefulLife"", ""AccumulatedDepreciationClosingBalance""
                        FROM ""Asset_Transaction_Summary""
                        WHERE ""AssetRegisterItemID"" = ari.""AssetRegisterItem_ID""
                        ORDER BY ""ID"" DESC
                        LIMIT 1) ats ON true
                    WHERE COALESCE(ari.""AssetType_ID"", 0) = @assetTypeId
                    AND COALESCE(ari.""AssetCategory_ID"", 0) = @assetCategoryId
                    AND COALESCE(ari.""Asset_SubCategory_ID"", 0) = @assetSubCategoryId
                    AND COALESCE(ari.""MeasurementType_ID"", 0) = @measurementTypeId
                    AND COALESCE(ari.""AssetStatus_ID"", 0) = @assetStatusId
                    AND COALESCE(CAST(NULLIF(ari.""MunicipalDepartment_ID"", '') AS INTEGER), 0) = @groupDeptId
                    AND COALESCE(ari.""DivisionID"", 0) = @groupDivId
                    AND COALESCE(ari.""RemainingUsefulLife"", ari.""UsefulLifeMonthComponent"", 0) > 0
                    AND NOT EXISTS (
                        SELECT 1 FROM ""Asset_Disposal"" ad
                        WHERE ad.""AssetItemID"" = ari.""AssetRegisterItem_ID""
                          AND COALESCE(ad.""Approved"", 0) = 1)
                    AND COALESCE(ats.""CurrentValue"", ari.""CarryingAmountClosingBalance"", ari.""CurrentAmount"", ari.""PurchaseAmount"", 0) > COALESCE(ari.""ResidualValue"", 0)",
                    new { assetTypeId, assetCategoryId, assetSubCategoryId, measurementTypeId, assetStatusId, groupDeptId, groupDivId }, txn);

                int itemAssetCount = 0;
                decimal itemDepTotal = 0m;

                foreach (var asset in assets)
                {
                    DateTime? lastTxnDate = asset.LastTransactionDate != null ? (DateTime?)asset.LastTransactionDate : null;
                    DateTime? inServiceDate = asset.InserviceDate != null ? (DateTime?)asset.InserviceDate : null;
                    DateTime readyForUse = inServiceDate ?? DateTime.Parse("2024-07-01");

                    if (lastTxnDate.HasValue && lastTxnDate.Value >= scheduledDate)
                        continue;

                    DateTime fromDate = lastTxnDate ?? readyForUse;
                    if (fromDate >= scheduledDate) continue;

                    decimal remainingUsefulLifeMonths = (decimal)(asset.AtsRemainingUsefulLife
                                                           ?? asset.RemainingUsefulLife
                                                           ?? asset.UsefulLifeMonthComponent
                                                           ?? (asset.UsefulLifeYearComponent != null ? asset.UsefulLifeYearComponent * 12m : null)
                                                           ?? 0m);
                    if (remainingUsefulLifeMonths <= 0) continue;

                    int daysFromLastRun = (int)(scheduledDate - fromDate).TotalDays;
                    if (daysFromLastRun <= 0) continue;

                    decimal rulDays = remainingUsefulLifeMonths / 12m * 365m;
                    bool periodExceedsRul = (decimal)daysFromLastRun >= rulDays;
                    int daysForDepreciation = periodExceedsRul
                        ? (int)Math.Ceiling(rulDays)
                        : daysFromLastRun;

                    decimal currentValue = (decimal)(asset.AtsCurrentValue
                                             ?? asset.CarryingAmountClosingBalance
                                             ?? asset.CurrentAmount
                                             ?? asset.PurchaseAmount
                                             ?? 0m);
                    decimal residual = (decimal)(asset.ResidualValue ?? 0m);
                    decimal depreciableAmount = currentValue - residual;

                    decimal depreciationValue;
                    if (depreciableAmount <= 0)
                    {
                        depreciationValue = 0;
                    }
                    else if (periodExceedsRul)
                    {
                        depreciationValue = depreciableAmount;
                    }
                    else
                    {
                        decimal dailyRate = depreciableAmount / rulDays;
                        depreciationValue = dailyRate * daysForDepreciation;
                        if (depreciableAmount - depreciationValue <= 0)
                            depreciationValue = depreciableAmount;
                    }
                    depreciationValue = Math.Round(depreciationValue, 2);

                    decimal newUsefulLifeMonths = ((remainingUsefulLifeMonths / 12m * 365m) - daysFromLastRun) / 365m * 12m;
                    if (newUsefulLifeMonths < 0) newUsefulLifeMonths = 0;
                    newUsefulLifeMonths = Math.Round(newUsefulLifeMonths, 4);

                    decimal accDep = (decimal)(asset.AtsAccDep
                                       ?? asset.AccumulatedDepreciationClosingBalance
                                       ?? 0m);
                    decimal newAccDep = accDep + depreciationValue;
                    decimal newCarrying = currentValue - depreciationValue;

                    if (newCarrying < residual)
                    {
                        depreciationValue = currentValue - residual;
                        if (depreciationValue < 0) depreciationValue = 0;
                        newAccDep = accDep + depreciationValue;
                        newCarrying = currentValue - depreciationValue;
                    }

                    await conn.ExecuteAsync(@"
                        INSERT INTO ""Asset_Depreciation"" (""AssetRegisterItem_ID"", ""DepreciationDate"",
                            ""DepreciationAmount"", ""AccumulatedDepreciation"", ""CarryingAmount"",
                            ""RunType_ID"", ""RunStatus_ID"", ""FinYear"", ""MonthID"",
                            ""Depreciation_ScheduledItemID"", ""DaysFromLastRun"", ""DateCaptured"", ""CapturerID"",
                            ""ResidualValue"", ""ReadyForUse"", ""UsefullLife"", ""DepreciationValue"",
                            ""Depreciation_ScheduleID"", ""Depreciation_MonthID"", ""Depreciation_RunType"",
                            ""CarryingAmountClosingBalance"")
                        VALUES (@assetId, @scheduledDate, @depreciationValue, @newAccDep, @newCarrying,
                            1, 1, @finYear, @monthId, @itemId, @daysForDepreciation, NOW(), 1,
                            @residual, @readyForUse, @newUsefulLifeMonths, @depreciationValue,
                            @scheduleId, @monthId, 'Distinctive', @newCarrying)",
                        new
                        {
                            assetId = (int)asset.AssetRegisterItem_ID,
                            scheduledDate, depreciationValue, newAccDep, newCarrying,
                            finYear, monthId, itemId, daysForDepreciation,
                            residual, readyForUse, newUsefulLifeMonths, scheduleId
                        }, txn);

                    itemAssetCount++;
                    itemDepTotal += depreciationValue;
                }

                await conn.ExecuteAsync(@"
                    UPDATE ""Asset_DepreciationSchedule_Item""
                    SET ""TotalAssets"" = @itemAssetCount, ""TotalDepreciation"" = @itemDepTotal
                    WHERE ""Asset_DepreciationSchedule_Item_ID"" = @itemId",
                    new { itemAssetCount, itemDepTotal, itemId }, txn);

                totalAssetsProcessed += itemAssetCount;
                totalDepreciationCharge += itemDepTotal;
            }

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_DepreciationSchedule""
                SET ""TotalAssets"" = @totalAssetsProcessed, ""TotalDepreciation"" = @totalDepreciationCharge, ""StatusID"" = 12
                WHERE ""Asset_DepreciationSchedule_ID"" = @scheduleId",
                new { totalAssetsProcessed, totalDepreciationCharge, scheduleId }, txn);

            var defId = await conn.QueryFirstOrDefaultAsync<int?>(@"
                SELECT ""id"" FROM ""Asset_WorkflowDefinitions"" WHERE ""entity_type"" = 'depreciation' AND ""is_active"" = TRUE OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY", transaction: txn);
            if (defId.HasValue)
            {
                var wfData = System.Text.Json.JsonSerializer.Serialize(new { scheduleId, finYear, totalAssets = totalAssetsProcessed, totalDepreciation = totalDepreciationCharge, scheduledDate = scheduledDate.ToString("yyyy-MM-dd") });
                await conn.ExecuteAsync(@"
                    INSERT INTO ""Asset_WorkflowInstances"" (""definition_id"", ""entity_type"", ""entity_id"", ""current_step"", ""status"", ""initiated_by"", ""data"", ""mssql_reference_id"")
                    VALUES (@defId, 'depreciation', @entityId, 1, 'pending', 1, @wfData::jsonb, @refId)",
                    new { defId = defId.Value, entityId = scheduleId.ToString(), wfData, refId = scheduleId.ToString() }, txn);
            }

            await txn.CommitAsync();
            return Ok(new { success = 1, scheduleId, totalAssets = totalAssetsProcessed, totalDepreciation = totalDepreciationCharge, scheduleItemCount = scheduleItemIds.Count, finYear, scheduledDate = scheduledDate.ToString("yyyy-MM-dd") });
        }
        catch (Exception ex)
        {
            await txn.RollbackAsync();
            return StatusCode(500, new { error = "Depreciation run failed", details = ex.Message });
        }
    }

    [HttpPost("schedules/{id:int}/reject")]
    public async Task<IActionResult> RejectSchedule(int id)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var txn = await conn.BeginTransactionAsync();

        try
        {
            var pendingItemIds = (await conn.QueryAsync<int>(@"
                SELECT ""Asset_DepreciationSchedule_Item_ID""
                FROM ""Asset_DepreciationSchedule_Item""
                WHERE ""Asset_DepreciationSchedule_ID"" = @id
                AND COALESCE(""StatusID"", 0) = 0",
                new { id }, txn)).ToList();

            if (pendingItemIds.Count > 0)
            {
                await conn.ExecuteAsync(@"
                    DELETE FROM ""Asset_Depreciation""
                    WHERE ""Depreciation_ScheduledItemID"" = ANY(@itemIds)
                    OR (""Depreciation_ScheduleID"" = @scheduleId AND COALESCE(""IsApproved"", 0) = 0)",
                    new { itemIds = pendingItemIds.ToArray(), scheduleId = id }, txn);

                await conn.ExecuteAsync(@"
                    DELETE FROM ""Asset_DepreciationSchedule_Item""
                    WHERE ""Asset_DepreciationSchedule_ID"" = @id
                    AND COALESCE(""StatusID"", 0) = 0",
                    new { id }, txn);
            }

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_DepreciationSchedule""
                SET ""PendingApproval"" = 0, ""RunStatus_ID"" = 0, ""StatusID"" = 0
                WHERE ""Asset_DepreciationSchedule_ID"" = @id",
                new { id }, txn);

            await txn.CommitAsync();
            return Ok(new { success = true, deletedItems = pendingItemIds.Count });
        }
        catch (Exception ex)
        {
            await txn.RollbackAsync();
            return StatusCode(500, new { error = "Rejection failed: " + ex.Message });
        }
    }

    [HttpPost("approve")]
    public async Task<IActionResult> ApproveBatch([FromBody] DepreciationApproveRequest request)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var txn = await conn.BeginTransactionAsync();

        try
        {
            int scheduleId = request.ScheduleId;
            string finYear = request.FinYear ?? _txnService.GetCurrentFinancialPeriod().year;

            var depRecords = (await conn.QueryAsync<dynamic>(@"
                SELECT d.""Asset_Depreciation_ID"" AS ""AssetDepreciation_ID"", d.""AssetRegisterItem_ID"", d.""DepreciationAmount"",
                       d.""AccumulatedDepreciation"", d.""CarryingAmount"", d.""DepreciationDate"",
                       d.""Depreciation_ScheduledItemID"", d.""DaysFromLastRun"",
                       d.""UsefullLife""
                FROM ""Asset_Depreciation"" d
                WHERE COALESCE(d.""IsApproved"", 0) = 0
                AND d.""Depreciation_ScheduledItemID"" IN (
                    SELECT ""Asset_DepreciationSchedule_Item_ID"" FROM ""Asset_DepreciationSchedule_Item""
                    WHERE ""Asset_DepreciationSchedule_ID"" = @scheduleId
                )", new { scheduleId }, txn)).ToList();

            if (!depRecords.Any())
                return BadRequest(new { error = "No unapproved depreciation records found for this schedule" });

            int journalTransactionTypeId = await conn.QueryFirstOrDefaultAsync<int>(@"
                SELECT COALESCE(""AssetJournalTransactionType_ID"", 0) FROM ""Const_AssetJournalTransactionType_Sys""
                WHERE ""AssetJournalTransactionDesc"" = 'Asset Depreciation' OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY", transaction: txn);
            if (journalTransactionTypeId == 0) journalTransactionTypeId = 21;

            int documentTypeId = await _lookupService.GetDocumentTypeIdAsync(conn, "Asset Depreciation", txn);
            if (documentTypeId == 0) documentTypeId = 666;

            int depTransTypeId = await conn.QueryFirstOrDefaultAsync<int>(@"
                SELECT COALESCE(""ReferenceData_ID"", 0) FROM ""Const_ReferenceData_sys""
                WHERE ""Description"" = 'Depreciation' OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY", transaction: txn);
            if (depTransTypeId == 0) depTransTypeId = 1;

            decimal totalDepreciation = 0m;
            var processedAssets = new List<int>();
            var failedAssets = new List<object>();

            var usedScheduleItemIds = depRecords.Select(d => (int)(d.Depreciation_ScheduledItemID ?? 0)).Where(id => id > 0).Distinct().ToList();

            var scheduleItems = (await conn.QueryAsync<dynamic>(@"
                SELECT ""Asset_DepreciationSchedule_Item_ID"" AS ""DepreciationScheduleItem_ID"",
                       COALESCE(""TypeID"", ""AssetType_ID"", 0) AS ""TypeID"",
                       COALESCE(""CategoryID"", ""AssetCategory_ID"", 0) AS ""CategoryID"",
                       COALESCE(""SubCategoryID"", ""Asset_SubCategory_ID"", 0) AS ""SubCategoryID"",
                       COALESCE(""MeasurementTypeID"", ""MeasurementType_ID"", 0) AS ""MeasurementTypeID"",
                       COALESCE(""DepartmentID"", 0) AS ""DepartmentID"",
                       COALESCE(""DivisionID"", 0) AS ""DivisionID""
                FROM ""Asset_DepreciationSchedule_Item""
                WHERE ""Asset_DepreciationSchedule_Item_ID"" = ANY(@ids)",
                new { ids = usedScheduleItemIds.ToArray() }, txn)).ToList();

            var mscoaConfigCache = new Dictionary<int, MscoaLookupResult?>();
            var failedScheduleItems = new List<object>();

            foreach (var si in scheduleItems)
            {
                int siId = (int)(si.DepreciationScheduleItem_ID ?? 0);
                int typeId = (int)(si.TypeID ?? 0);
                int categoryId = (int)(si.CategoryID ?? 0);
                int subCategoryId = (int)(si.SubCategoryID ?? 0);
                int measurementTypeId = (int)(si.MeasurementTypeID ?? 0);
                int departmentId = (int)(si.DepartmentID ?? 0);
                int divisionId = (int)(si.DivisionID ?? 0);

                var config = await _txnService.LookupMscoaConfigByClassification(conn, typeId, categoryId, subCategoryId, measurementTypeId, "Depreciation", finYear, txn, departmentId, divisionId);
                var configErrors = _txnService.ValidateMscoaConfig(config, "Depreciation", siId);
                if (configErrors.Count > 0)
                {
                    failedScheduleItems.Add(new { scheduleItemId = siId, typeId, categoryId, subCategoryId, measurementTypeId, departmentId, divisionId, errors = configErrors });
                }
                mscoaConfigCache[siId] = config;
            }

            if (failedScheduleItems.Count > 0)
            {
                await txn.RollbackAsync();
                return BadRequest(new { error = "mSCOA configuration errors found for schedule items", failedItems = failedScheduleItems });
            }

            int processingMonth = await _txnService.GetProcessingMonth(conn, 1, txn);

            var assetIds = depRecords.Select(d => (int)(d.AssetRegisterItem_ID ?? 0)).Where(id => id > 0).Distinct().ToList();
            var assetLifeData = (await conn.QueryAsync<dynamic>(@"
                SELECT ""AssetRegisterItem_ID"",
                       ""UsefulLifeMonthComponent"",
                       ""RemainingUsefulLife"",
                       COALESCE(""RevaluationReserveClosingBalance"", COALESCE(""RevaluationOpeningBalance"", 0)) AS ""RevalReserve""
                FROM ""Asset_Register_Items""
                WHERE ""AssetRegisterItem_ID"" = ANY(@ids)",
                new { ids = assetIds.ToArray() }, txn)).ToDictionary(
                    x => (int)x.AssetRegisterItem_ID,
                    x => x);

            var scheduleItemTotals = new Dictionary<int, decimal>();
            var scheduleItemOffsetTotals = new Dictionary<int, decimal>();
            var scheduleItemDocNumbers = new Dictionary<int, string>();
            var scheduleItemJournalIds = new Dictionary<int, int>();
            var scheduleItemTransIds = new Dictionary<int, Guid>();
            var scheduleItemDates = new Dictionary<int, DateTime>();

            var batchAssetIds = new List<int>();
            var batchNewAccDeps = new List<decimal>();
            var batchDepAmounts = new List<decimal>();
            var batchNewCarryings = new List<decimal>();
            var batchNewRuls = new List<decimal?>();
            var batchPostedOffsets = new List<decimal>();
            var approvedDepIds = new List<int>();
            int minFinPeriod = 99;

            foreach (var dep in depRecords)
            {
                int assetRegId = (int)(dep.AssetRegisterItem_ID ?? 0);
                decimal depAmount = (decimal)(dep.DepreciationAmount ?? 0m);
                decimal newAccDep = (decimal)(dep.AccumulatedDepreciation ?? 0m);
                decimal newCarrying = (decimal)(dep.CarryingAmount ?? 0m);
                DateTime depDate = dep.DepreciationDate != null ? (DateTime)dep.DepreciationDate : DateTime.Now;

                if (depAmount <= 0) continue;

                totalDepreciation += depAmount;

                int scheduleItemId = (int)(dep.Depreciation_ScheduledItemID ?? 0);
                var mscoaConfig = mscoaConfigCache.ContainsKey(scheduleItemId) ? mscoaConfigCache[scheduleItemId] : null;
                if (mscoaConfig == null)
                {
                    failedAssets.Add(new { assetRegId, errors = new List<string> { $"No mSCOA configuration found for schedule item {scheduleItemId}" } });
                    continue;
                }

                if (!scheduleItemTransIds.ContainsKey(scheduleItemId))
                {
                    scheduleItemTransIds[scheduleItemId] = Guid.NewGuid();
                    string docNum = await _txnService.GenerateDocumentNumber(conn, documentTypeId, txn);
                    scheduleItemDocNumbers[scheduleItemId] = docNum;
                    scheduleItemDates[scheduleItemId] = depDate;
                    scheduleItemTotals[scheduleItemId] = 0m;
                    scheduleItemOffsetTotals[scheduleItemId] = 0m;
                }

                var transactionId = scheduleItemTransIds[scheduleItemId];
                string documentNumber = scheduleItemDocNumbers[scheduleItemId];
                int intDocNumber = int.TryParse(documentNumber.Split('/').LastOrDefault(), out var dn) ? dn : 1;
                var (fyYear, fyPeriod) = _txnService.GetFinancialPeriodForDate(depDate);
                if (fyPeriod < minFinPeriod) minFinPeriod = fyPeriod;

                scheduleItemTotals[scheduleItemId] += depAmount;

                int journalId = await _txnService.InsertJournalAsset(conn, txn,
                    finYear, processingMonth, transactionId, journalTransactionTypeId,
                    depDate, mscoaConfig?.DebitVoteId, mscoaConfig?.CreditVoteId,
                    depAmount, documentNumber, intDocNumber, assetRegId,
                    scoaFundsId: mscoaConfig?.DebitScoaFundId,
                    scoaRegionId: mscoaConfig?.DebitScoaRegionId,
                    scoaCostingId: mscoaConfig?.DebitScoaCostingId,
                    scoaFunctionId: mscoaConfig?.DebitScoaFunctionId,
                    scoaItemId: mscoaConfig?.DebitScoaItemId,
                    divisionId: mscoaConfig?.DebitDivisionId,
                    itemDescription: "Asset Depreciation",
                    depScheduleId: scheduleId,
                    depScheduleItemId: (int?)(dep.Depreciation_ScheduledItemID),
                    depScheduledDate: depDate,
                    depRunType: "Batch");

                if (!scheduleItemJournalIds.ContainsKey(scheduleItemId))
                    scheduleItemJournalIds[scheduleItemId] = journalId;

                var assetLife = assetLifeData.ContainsKey(assetRegId) ? assetLifeData[assetRegId] : null;
                decimal? origUsefulLife = assetLife?.UsefulLifeMonthComponent;
                decimal? currentRul = assetLife?.RemainingUsefulLife;
                decimal? newRul = (decimal?)(dep.UsefullLife);
                if (newRul == null) newRul = currentRul;
                decimal revalReserve = (decimal)(assetLife?.RevalReserve ?? 0m);

                decimal depreciationOffset = 0m;
                if (revalReserve > 0 && (currentRul ?? 0) > 0)
                {
                    decimal totalRemainingDays = (currentRul ?? 0m) / 12m * 365m;
                    int depDays = dep.DaysFromLastRun != null ? (int)dep.DaysFromLastRun : (int)((currentRul ?? 0m) * 30.44m);
                    if (totalRemainingDays > 0)
                    {
                        depreciationOffset = Math.Round(revalReserve / totalRemainingDays * depDays, 2);
                        if (revalReserve - depreciationOffset < 0)
                            depreciationOffset = revalReserve;
                    }
                }

                decimal postedOffset = 0m;
                if (depreciationOffset > 0 && mscoaConfig?.OffsetVoteId != null && mscoaConfig?.ReserveVoteId != null)
                {
                    postedOffset = depreciationOffset;
                    scheduleItemOffsetTotals[scheduleItemId] += postedOffset;
                }

                await _txnService.UpsertAssetRegisterTransaction(conn, txn,
                    assetRegId, depTransTypeId, depDate,
                    fyYear, fyPeriod, transactionId, documentTypeId,
                    depreciationValue: depAmount,
                    currentValue: newCarrying,
                    accumulatedDepreciation: newAccDep,
                    usefulLife: origUsefulLife,
                    remainingUsefulLife: newRul,
                    depreciationOffset: postedOffset > 0 ? postedOffset : (decimal?)null);

                batchAssetIds.Add(assetRegId);
                batchNewAccDeps.Add(newAccDep);
                batchDepAmounts.Add(depAmount);
                batchNewCarryings.Add(newCarrying);
                batchNewRuls.Add(newRul);
                batchPostedOffsets.Add(postedOffset);
                approvedDepIds.Add((int)dep.AssetDepreciation_ID);
                processedAssets.Add(assetRegId);
            }

            if (batchAssetIds.Count > 0)
            {
                await conn.ExecuteAsync(@"
                    UPDATE ""Asset_Register_Items"" ari
                    SET ""AccumulatedDepreciationClosingBalance"" = b.new_acc_dep,
                        ""AccumulatedDepreciationCurrentYear"" = COALESCE(ari.""AccumulatedDepreciationCurrentYear"", 0) + b.dep_amount,
                        ""CurrentAmount"" = b.new_carrying,
                        ""CarryingAmountClosingBalance"" = b.new_carrying,
                        ""RemainingUsefulLife"" = COALESCE(b.new_rul, ari.""RemainingUsefulLife""),
                        ""RevaluationReserveClosingBalance"" = COALESCE(ari.""RevaluationReserveClosingBalance"", 0) - b.posted_offset,
                        ""DateModified"" = NOW()
                    FROM unnest(@assetIds::int[], @newAccDeps::numeric[], @depAmounts::numeric[], @newCarryings::numeric[], @newRuls::numeric[], @postedOffsets::numeric[])
                        AS b(asset_id, new_acc_dep, dep_amount, new_carrying, new_rul, posted_offset)
                    WHERE ari.""AssetRegisterItem_ID"" = b.asset_id",
                    new
                    {
                        assetIds = batchAssetIds.ToArray(),
                        newAccDeps = batchNewAccDeps.ToArray(),
                        depAmounts = batchDepAmounts.ToArray(),
                        newCarryings = batchNewCarryings.ToArray(),
                        newRuls = batchNewRuls.ToArray(),
                        postedOffsets = batchPostedOffsets.ToArray()
                    }, txn);

                await conn.ExecuteAsync(@"
                    UPDATE ""Asset_Depreciation"" SET ""IsApproved"" = 1
                    WHERE ""Asset_Depreciation_ID"" = ANY(@ids)",
                    new { ids = approvedDepIds.ToArray() }, txn);
            }

            var depOutboxIds = new List<Guid>();
            foreach (var kvp in scheduleItemTotals)
            {
                int siId = kvp.Key;
                decimal siTotal = kvp.Value;
                if (siTotal <= 0) continue;

                var mscoaConfig = mscoaConfigCache.ContainsKey(siId) ? mscoaConfigCache[siId] : null;
                if (mscoaConfig == null) continue;

                var transactionId = scheduleItemTransIds[siId];
                string documentNumber = scheduleItemDocNumbers[siId];
                DateTime depDate = scheduleItemDates[siId];
                int journalId = scheduleItemJournalIds.ContainsKey(siId) ? scheduleItemJournalIds[siId] : 0;

                var (_, fyDepPeriod) = _txnService.GetFinancialPeriodForDate(depDate);
                var depOutboxId = await _txnService.CreateGlOutboxHeaderAsync(
                    conn, txn, "ASSET_DEPRECIATION", documentNumber);
                depOutboxIds.Add(depOutboxId);

                if (mscoaConfig.DebitVoteId != null)
                {
                    await _txnService.InsertGeneralLedgerEntry(conn, txn,
                        depDate, processingMonth, mscoaConfig.DebitVoteId, finYear,
                        documentTypeId, "Asset Depreciation", documentNumber,
                        debit: siTotal, credit: null, matchTranGuid: transactionId,
                        journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                        scoaFundsId: mscoaConfig.DebitScoaFundId, scoaRegionId: mscoaConfig.DebitScoaRegionId,
                        scoaCostingId: mscoaConfig.DebitScoaCostingId,
                        scoaProjectId: mscoaConfig.DebitPlanProjectId, scoaFunctionId: mscoaConfig.DebitScoaFunctionId,
                        scoaItemId: mscoaConfig.DebitScoaItemId ?? 0,
                        divisionId: mscoaConfig.DebitDivisionId,
                        projectId: mscoaConfig.DebitPlanProjectId, planProjectItemId: mscoaConfig.DebitPlanProjectItemId,
                            outboxId: depOutboxId);
                }

                if (mscoaConfig.CreditVoteId != null)
                {
                    await _txnService.InsertGeneralLedgerEntry(conn, txn,
                        depDate, processingMonth, mscoaConfig.CreditVoteId, finYear,
                        documentTypeId, "Asset Depreciation - Accumulated", documentNumber,
                        debit: null, credit: siTotal, matchTranGuid: transactionId,
                        journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                        scoaFundsId: mscoaConfig.CreditScoaFundId, scoaRegionId: mscoaConfig.CreditScoaRegionId,
                        scoaCostingId: mscoaConfig.CreditScoaCostingId,
                        scoaProjectId: mscoaConfig.CreditPlanProjectId, scoaFunctionId: mscoaConfig.CreditScoaFunctionId,
                        scoaItemId: mscoaConfig.CreditScoaItemId ?? 0,
                        divisionId: mscoaConfig.CreditDivisionId,
                        projectId: mscoaConfig.CreditPlanProjectId, planProjectItemId: mscoaConfig.CreditPlanProjectItemId,
                            outboxId: depOutboxId);
                }

                decimal siOffset = scheduleItemOffsetTotals.ContainsKey(siId) ? scheduleItemOffsetTotals[siId] : 0m;
                if (siOffset > 0 && mscoaConfig.OffsetVoteId != null && mscoaConfig.ReserveVoteId != null)
                {
                    await _txnService.InsertGeneralLedgerEntry(conn, txn,
                        depDate, processingMonth, mscoaConfig.ReserveVoteId, finYear,
                        documentTypeId, "Asset Depreciation Offset", documentNumber,
                        debit: siOffset, credit: null, matchTranGuid: transactionId,
                        journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                        scoaFundsId: mscoaConfig.ReserveScoaFundId, scoaRegionId: mscoaConfig.ReserveScoaRegionId,
                        scoaCostingId: mscoaConfig.ReserveScoaCostingId,
                        scoaProjectId: mscoaConfig.ReservePlanProjectId, scoaFunctionId: mscoaConfig.ReserveScoaFunctionId,
                        scoaItemId: mscoaConfig.ReserveScoaItemId ?? 0,
                        divisionId: mscoaConfig.ReserveDivisionId,
                        projectId: mscoaConfig.ReservePlanProjectId, planProjectItemId: mscoaConfig.ReservePlanProjectItemId,
                            outboxId: depOutboxId);

                    await _txnService.InsertGeneralLedgerEntry(conn, txn,
                        depDate, processingMonth, mscoaConfig.OffsetVoteId, finYear,
                        documentTypeId, "Asset Depreciation Offset", documentNumber,
                        debit: null, credit: siOffset, matchTranGuid: transactionId,
                        journalTransactionTypeId: journalTransactionTypeId, assetLinkId: journalId,
                        scoaFundsId: mscoaConfig.OffsetScoaFundId, scoaRegionId: mscoaConfig.OffsetScoaRegionId,
                        scoaCostingId: mscoaConfig.OffsetScoaCostingId,
                        scoaProjectId: mscoaConfig.OffsetPlanProjectId, scoaFunctionId: mscoaConfig.OffsetScoaFunctionId,
                        scoaItemId: mscoaConfig.OffsetScoaItemId ?? 0,
                        divisionId: mscoaConfig.OffsetDivisionId,
                        projectId: mscoaConfig.OffsetPlanProjectId, planProjectItemId: mscoaConfig.OffsetPlanProjectItemId,
                            outboxId: depOutboxId);
                }
            }

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_DepreciationSchedule_Item""
                SET ""StatusID"" = 13, ""RunDate"" = NOW(), ""ProcessedDate"" = NOW()
                WHERE ""Asset_DepreciationSchedule_ID"" = @scheduleId
                AND ""AssetRegisterItem_ID"" IS NULL",
                new { scheduleId }, txn);

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_DepreciationSchedule""
                SET ""RunStatus_ID"" = 3, ""TotalDepreciation"" = @totalDepreciation, ""StatusID"" = 13
                WHERE ""Asset_DepreciationSchedule_ID"" = @scheduleId",
                new { totalDepreciation, scheduleId }, txn);

            await txn.CommitAsync();

            if (depOutboxIds.Count > 0)
                await _txnService.SyncGlOutboxToSqlServerIfNeededAsync(depOutboxIds.ToArray());

            int rebuildPeriod = minFinPeriod < 99 ? minFinPeriod : 1;
            var distinctAssets = processedAssets.Distinct().ToList();

            await conn.ExecuteAsync(@"
                UPDATE ""Asset_WorkflowInstances""
                SET ""status"" = 'approved', ""completed_at"" = NOW()
                WHERE ""entity_type"" = 'depreciation' AND ""mssql_reference_id"" = @refId AND ""status"" IN ('pending', 'in_progress')",
                new { refId = scheduleId.ToString() });

            _ = _emailService.SendTransactionEmailsAsync("Depreciation", new Dictionary<string, string>
            {
                ["FinancialYear"]    = finYear ?? "",
                ["TotalDepreciation"] = totalDepreciation.ToString("N2"),
                ["ProcessedAssets"]  = processedAssets.Count.ToString(),
                ["ApprovalDate"]     = DateTime.Now.ToString("dd MMM yyyy")
            });
            return Ok(new { success = 1, scheduleId, totalDepreciation, assetsProcessed = processedAssets.Count, assetIdsToRebuild = distinctAssets, finYear, rebuildPeriod, approvedPeriod = processingMonth, progressKey = scheduleId.ToString(), failedAssets = failedAssets.Count > 0 ? failedAssets : null });
        }
        catch (Exception ex)
        {
            await txn.RollbackAsync();
            return StatusCode(500, new { error = "Depreciation approval failed", details = ex.Message });
        }
    }

    [HttpPost("rebuild-summaries")]
    public IActionResult RebuildSummaries([FromBody] RebuildSummariesRequest request)
    {
        var assetIds = request.AssetIds ?? new List<int>();
        var finYear = request.FinYear ?? _txnService.GetCurrentFinancialPeriod().year;
        var rebuildPeriod = request.RebuildPeriod > 0 ? request.RebuildPeriod : 1;
        var approvedPeriod = request.Period > 0 ? request.Period : rebuildPeriod;
        var key = request.ProgressKey ?? "rebuild";

        _rebuildProgress[key] = new RebuildProgressEntry(0, assetIds.Count, false, new List<int>(), 0, 0);

        var db = _db;
        var txnSvc = _txnService;
        _ = Task.Run(async () =>
        {
            int done = 0;
            var failedAssets = new List<int>();
            const int chunkSize = 2000;
            for (int i = 0; i < assetIds.Count; i += chunkSize)
            {
                var chunk = assetIds.GetRange(i, Math.Min(chunkSize, assetIds.Count - i));
                try
                {
                    await txnSvc.PopulateTransactionSummaryBulkRebuild(chunk, finYear, rebuildPeriod);
                    var d = System.Threading.Interlocked.Add(ref done, chunk.Count);
                    _rebuildProgress[key] = new RebuildProgressEntry(d, assetIds.Count, false, failedAssets, 0, 0);
                }
                catch (Exception atsEx)
                {
                    Console.WriteLine($"ATS bulk rebuild failed for chunk starting at {i}: {atsEx.Message}");
                    failedAssets.AddRange(chunk);
                    var d = System.Threading.Interlocked.Add(ref done, chunk.Count);
                    _rebuildProgress[key] = new RebuildProgressEntry(d, assetIds.Count, false, failedAssets, 0, 0);
                }
            }

            int mismatched = 0;
            int autoCorrected = 0;
            if (assetIds.Count > 0)
            {
                try
                {
                    await using var conn = db.CreateConnection();
                    await conn.OpenAsync();
                    var mismatchedIds = (await conn.QueryAsync<int>(@"
                        SELECT rt.""AssetRegisterItem_ID""
                        FROM ""Asset_Register_Transactions"" rt
                        LEFT JOIN ""Asset_Transaction_Summary"" ats
                            ON  ats.""AssetRegisterItemID"" = rt.""AssetRegisterItem_ID""
                            AND ats.""FinancialYear""        = rt.""FinancialYear""
                            AND ats.""FinancialPeriod""      = rt.""FinancialPeriod""
                        WHERE rt.""AssetRegisterItem_ID"" = ANY(@assetIds)
                          AND rt.""FinancialYear""        = @finYear
                          AND rt.""FinancialPeriod""      = @period
                        GROUP BY rt.""AssetRegisterItem_ID"", ats.""DepreciationValue""
                        HAVING ABS( COALESCE(SUM(COALESCE(rt.""DepreciationValue"",0)),0)
                                  - COALESCE(ats.""DepreciationValue"",0) ) > 0.01
                            OR ats.""DepreciationValue"" IS NULL",
                        new { assetIds = assetIds.ToArray(), finYear, period = approvedPeriod })).ToList();
                    mismatched = mismatchedIds.Count;
                    if (mismatched > 0)
                    {
                        for (int i = 0; i < mismatchedIds.Count; i += chunkSize)
                        {
                            var corrChunk = mismatchedIds.GetRange(i, Math.Min(chunkSize, mismatchedIds.Count - i));
                            try
                            {
                                await txnSvc.PopulateTransactionSummaryBulkRebuild(corrChunk, finYear, rebuildPeriod);
                                autoCorrected += corrChunk.Count;
                            }
                            catch (Exception corrEx)
                            {
                                Console.WriteLine($"ATS reconciliation auto-correct failed: {corrEx.Message}");
                            }
                        }
                    }
                }
                catch (Exception recEx)
                {
                    Console.WriteLine($"ATS reconciliation query failed: {recEx.Message}");
                }
            }

            _rebuildProgress[key] = new RebuildProgressEntry(assetIds.Count, assetIds.Count, true, failedAssets, mismatched, autoCorrected);
        });

        return Accepted(new { queued = true, total = assetIds.Count });
    }

    [HttpGet("rebuild-progress/{key}")]
    public IActionResult GetRebuildProgress(string key)
    {
        if (_rebuildProgress.TryGetValue(key, out var progress))
        {
            if (progress.Complete)
            {
                _rebuildProgress.TryRemove(key, out _);
                return Ok(new
                {
                    done = progress.Total, total = progress.Total, complete = true,
                    failedChunkAssets = progress.FailedAssets,
                    reconciliation = new { @checked = progress.Total, mismatched = progress.Mismatched, autoCorrected = progress.AutoCorrected }
                });
            }
            return Ok(new { done = progress.Done, total = progress.Total, complete = false, failedChunkAssets = new List<int>(), reconciliation = (object?)null });
        }
        return Ok(new { done = 0, total = 0, complete = true });
    }

    [AdminAuthorize]
    [HttpGet("orphaned-gl")]
    public async Task<IActionResult> GetOrphanedGl()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        var rows = await conn.QueryAsync<dynamic>(@"
            SELECT gl.""GenLedger_ID"" AS ""GlId"", gl.""AssetLinkID"",
                   NULL::integer AS ""AssetId"",
                   'Asset_GeneralLedger' AS ""SourceTable"",
                   'Journal entry not found in Led_Journal_Asset' AS ""Reason""
            FROM ""Asset_GeneralLedger"" gl
            WHERE gl.""AssetLinkID"" IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 FROM ""Led_Journal_Asset"" ja
                  WHERE ja.""AssetJournal_ID"" = gl.""AssetLinkID""
              )
            UNION ALL
            SELECT gl.""GenLedger_ID"" AS ""GlId"", gl.""AssetLinkID"",
                   ja.""AssetRegisterItem_ID"" AS ""AssetId"",
                   'Asset_GeneralLedger' AS ""SourceTable"",
                   'No approved depreciation for journal' AS ""Reason""
            FROM ""Asset_GeneralLedger"" gl
            INNER JOIN ""Led_Journal_Asset"" ja ON ja.""AssetJournal_ID"" = gl.""AssetLinkID""
            WHERE gl.""AssetLinkID"" IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 FROM ""Asset_Depreciation"" ad
                  WHERE ad.""Depreciation_ScheduleID"" = ja.""Deprecation_ScheduleID""
                    AND COALESCE(ad.""IsApproved"", 0) = 1
              )
            UNION ALL
            SELECT lgl.""GenLedger_ID"" AS ""GlId"", lgl.""AssetLinkID"",
                   NULL::integer AS ""AssetId"",
                   'Led_GeneralLedger' AS ""SourceTable"",
                   'Journal entry not found in Led_Journal_Asset' AS ""Reason""
            FROM ""Led_GeneralLedger"" lgl
            WHERE lgl.""AssetLinkID"" IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 FROM ""Led_Journal_Asset"" ja
                  WHERE ja.""AssetJournal_ID"" = lgl.""AssetLinkID""
              )
            UNION ALL
            SELECT lgl.""GenLedger_ID"" AS ""GlId"", lgl.""AssetLinkID"",
                   ja.""AssetRegisterItem_ID"" AS ""AssetId"",
                   'Led_GeneralLedger' AS ""SourceTable"",
                   'No approved depreciation for journal' AS ""Reason""
            FROM ""Led_GeneralLedger"" lgl
            INNER JOIN ""Led_Journal_Asset"" ja ON ja.""AssetJournal_ID"" = lgl.""AssetLinkID""
            WHERE lgl.""AssetLinkID"" IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1 FROM ""Asset_Depreciation"" ad
                  WHERE ad.""Depreciation_ScheduleID"" = ja.""Deprecation_ScheduleID""
                    AND COALESCE(ad.""IsApproved"", 0) = 1
              )");
        return Ok(rows);
    }

    [AdminAuthorize]
    [HttpDelete("orphaned-gl")]
    public async Task<IActionResult> DeleteOrphanedGl()
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await using var txn = await conn.BeginTransactionAsync();
        try
        {
            var deletedAssetGl = await conn.ExecuteAsync(@"
                DELETE FROM ""Asset_GeneralLedger""
                WHERE ""GenLedger_ID"" IN (
                    SELECT gl.""GenLedger_ID""
                    FROM ""Asset_GeneralLedger"" gl
                    WHERE gl.""AssetLinkID"" IS NOT NULL
                      AND NOT EXISTS (
                          SELECT 1 FROM ""Led_Journal_Asset"" ja
                          WHERE ja.""AssetJournal_ID"" = gl.""AssetLinkID""
                      )
                    UNION
                    SELECT gl.""GenLedger_ID""
                    FROM ""Asset_GeneralLedger"" gl
                    INNER JOIN ""Led_Journal_Asset"" ja ON ja.""AssetJournal_ID"" = gl.""AssetLinkID""
                    WHERE gl.""AssetLinkID"" IS NOT NULL
                      AND NOT EXISTS (
                          SELECT 1 FROM ""Asset_Depreciation"" ad
                          WHERE ad.""Depreciation_ScheduleID"" = ja.""Deprecation_ScheduleID""
                            AND COALESCE(ad.""IsApproved"", 0) = 1
                      )
                )", txn);
            var deletedLedGl = await conn.ExecuteAsync(@"
                DELETE FROM ""Led_GeneralLedger""
                WHERE ""GenLedger_ID"" IN (
                    SELECT lgl.""GenLedger_ID""
                    FROM ""Led_GeneralLedger"" lgl
                    WHERE lgl.""AssetLinkID"" IS NOT NULL
                      AND NOT EXISTS (
                          SELECT 1 FROM ""Led_Journal_Asset"" ja
                          WHERE ja.""AssetJournal_ID"" = lgl.""AssetLinkID""
                      )
                    UNION
                    SELECT lgl.""GenLedger_ID""
                    FROM ""Led_GeneralLedger"" lgl
                    INNER JOIN ""Led_Journal_Asset"" ja ON ja.""AssetJournal_ID"" = lgl.""AssetLinkID""
                    WHERE lgl.""AssetLinkID"" IS NOT NULL
                      AND NOT EXISTS (
                          SELECT 1 FROM ""Asset_Depreciation"" ad
                          WHERE ad.""Depreciation_ScheduleID"" = ja.""Deprecation_ScheduleID""
                            AND COALESCE(ad.""IsApproved"", 0) = 1
                      )
                )", txn);
            await txn.CommitAsync();
            return Ok(new { deletedAssetGl, deletedLedGl });
        }
        catch
        {
            await txn.RollbackAsync();
            throw;
        }
    }

    [HttpPost("complete-workflow/{scheduleId:int}")]
    public async Task<IActionResult> CompleteWorkflow(int scheduleId)
    {
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        await conn.ExecuteAsync(@"
            UPDATE ""Asset_WorkflowInstances""
            SET ""status"" = 'approved', ""completed_at"" = NOW()
            WHERE ""entity_type"" = 'depreciation'
              AND ""mssql_reference_id"" = @refId
              AND ""status"" IN ('pending', 'in_progress')",
            new { refId = scheduleId.ToString() });
        return Ok(new { success = 1 });
    }
}

public class RebuildSummariesRequest
{
    public List<int>? AssetIds { get; set; }
    public string? FinYear { get; set; }
    public int RebuildPeriod { get; set; }
    public int Period { get; set; }
    public string? ProgressKey { get; set; }
}

public class DepreciateRequest
{
    public int? RunTypeId { get; set; }
    public string? FinYear { get; set; }
    public int? MonthId { get; set; }
}

public class DepreciationRunRequest
{
    public string? FinYear { get; set; }
    public DateTime? ScheduledDate { get; set; }
}

public class DepreciationApproveRequest
{
    public int ScheduleId { get; set; }
    public string? FinYear { get; set; }
    public string? ApprovedBy { get; set; }
}
