using Microsoft.AspNetCore.Mvc;
using Dapper;
using System.Net.Http.Json;
using AssetManagement.Data;
using AssetManagement.Services;

namespace AssetManagement.Controllers;

[ApiController]
[Route("api/month-end")]
public class MonthEndController : ControllerBase
{
    private readonly DbConnectionFactory _db;
    private readonly TransactionService _txnService;
    private readonly IHttpClientFactory _httpClientFactory;

    public MonthEndController(DbConnectionFactory db, TransactionService txnService, IHttpClientFactory httpClientFactory)
    {
        _db = db;
        _txnService = txnService;
        _httpClientFactory = httpClientFactory;
    }

    private static int PeriodToMonth(int period) => period <= 6 ? period + 6 : period - 6;

    private static int GetTargetYear(string finYear, int month)
    {
        var parts = finYear.Split('/');
        if (parts.Length < 2) return DateTime.Now.Year;
        int startYear = int.TryParse(parts[0], out var y) ? y : DateTime.Now.Year;
        return month >= 7 ? startYear : startYear + 1;
    }

    [HttpGet("check")]
    public async Task<IActionResult> CheckStatus([FromQuery] string? finYear, [FromQuery] int period)
    {
        if (string.IsNullOrEmpty(finYear))
        {
            var now = DateTime.Now;
            finYear = now.Month >= 7 ? $"{now.Year}/{now.Year + 1}" : $"{now.Year - 1}/{now.Year}";
        }

        int targetMonth = PeriodToMonth(period);
        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var existing = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT ""Asset_DepreciationSchedule_ID"" AS ""DepreciationSchedule_ID"", ""StatusID"", ""ScheduledDate""
              FROM ""Asset_DepreciationSchedule""
              WHERE ""FinYear"" = @finYear
                AND MONTH(""ScheduledDate"") = @targetMonth
              OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY",
            new { finYear, targetMonth });

        bool alreadyRun = existing != null;
        return Ok(new { alreadyRun, finYear, period, targetMonth, scheduleId = existing?.DepreciationSchedule_ID });
    }

    [HttpPost("run")]
    public async Task<IActionResult> RunMonthEnd([FromBody] MonthEndRunRequest request)
    {
        var finYear = request.FinYear;
        if (string.IsNullOrEmpty(finYear))
        {
            var now = DateTime.Now;
            finYear = now.Month >= 7 ? $"{now.Year}/{now.Year + 1}" : $"{now.Year - 1}/{now.Year}";
        }
        int period = request.Period;
        int targetMonth = PeriodToMonth(period);
        int targetYear = GetTargetYear(finYear, targetMonth);
        var targetDate = new DateTime(targetYear, targetMonth, DateTime.DaysInMonth(targetYear, targetMonth));

        await using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        var approvalMethod = await _txnService.GetApprovalMethod(conn);
        if (approvalMethod != "Automated")
            return BadRequest(new { error = "Month-End process is only available in Automated mode" });

        var existing = await conn.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT ""Asset_DepreciationSchedule_ID"" AS ""DepreciationSchedule_ID"" FROM ""Asset_DepreciationSchedule""
              WHERE ""FinYear"" = @finYear AND MONTH(""ScheduledDate"") = @targetMonth OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY",
            new { finYear, targetMonth });
        if (existing != null)
            return BadRequest(new { error = $"Month-End for {finYear} Period {period} has already been run (Schedule ID {existing.DepreciationSchedule_ID})" });

        var client = _httpClientFactory.CreateClient("internal");
        var errors = new List<string>();
        var results = new Dictionary<string, int>
        {
            ["revaluations"] = 0, ["impairments"] = 0,
            ["reversals"] = 0, ["disposals"] = 0
        };

        var pendingRevals = await conn.QueryAsync<dynamic>(
            @"SELECT ""Asset_RevaluationsID""
              FROM ""Asset_Revaluations""
              WHERE (""Approved"" IS NULL OR ""Approved"" = FALSE)
                AND ""PostDateTime"" IS NULL
                AND (""RejectedDate"" IS NULL)
                AND MONTH(""RevalutionDate"") = @targetMonth
                AND YEAR(""RevalutionDate"") = @targetYear
              ORDER BY ""RevalutionDate"" ASC",
            new { targetMonth, targetYear });

        foreach (var r in pendingRevals)
        {
            int id = (int)r.Asset_RevaluationsID;
            try
            {
                var resp = await client.PostAsJsonAsync($"/api/asset-revaluations/{id}/approve", new { ApprovedBy = 1 });
                if (resp.IsSuccessStatusCode) results["revaluations"]++;
                else errors.Add($"Revaluation {id}: {resp.StatusCode}");
            }
            catch (Exception ex) { errors.Add($"Revaluation {id}: {ex.Message}"); }
        }

        var pendingImpairments = await conn.QueryAsync<dynamic>(
            @"SELECT ""Impairment_ID"" AS ""AssetImpairment_ID""
              FROM ""Asset_Impairment""
              WHERE COALESCE(""Approved"", 0) = 0
                AND COALESCE(""IsRejected"", 0) = 0
                AND COALESCE(""IsReversal"", 0) = 0
                AND MONTH(""ImpairmentDate"") = @targetMonth
                AND YEAR(""ImpairmentDate"") = @targetYear
              ORDER BY ""ImpairmentDate"" ASC",
            new { targetMonth, targetYear });

        foreach (var imp in pendingImpairments)
        {
            int id = (int)imp.AssetImpairment_ID;
            try
            {
                var resp = await client.PostAsJsonAsync($"/api/asset-impairments/{id}/approve", new { ApprovedBy = 1 });
                if (resp.IsSuccessStatusCode) results["impairments"]++;
                else errors.Add($"Impairment {id}: {resp.StatusCode}");
            }
            catch (Exception ex) { errors.Add($"Impairment {id}: {ex.Message}"); }
        }

        var pendingReversals = await conn.QueryAsync<dynamic>(
            @"SELECT ""Impairment_ID"" AS ""AssetImpairment_ID""
              FROM ""Asset_Impairment""
              WHERE COALESCE(""Approved"", 0) = 0
                AND COALESCE(""IsRejected"", 0) = 0
                AND COALESCE(""IsReversal"", 0) = 1
                AND MONTH(""ImpairmentDate"") = @targetMonth
                AND YEAR(""ImpairmentDate"") = @targetYear
              ORDER BY ""ImpairmentDate"" ASC",
            new { targetMonth, targetYear });

        foreach (var rev in pendingReversals)
        {
            int id = (int)rev.AssetImpairment_ID;
            try
            {
                var resp = await client.PostAsJsonAsync($"/api/asset-impairments/{id}/approve-reversal", new { ApprovedBy = 1 });
                if (resp.IsSuccessStatusCode) results["reversals"]++;
                else errors.Add($"Reversal {id}: {resp.StatusCode}");
            }
            catch (Exception ex) { errors.Add($"Reversal {id}: {ex.Message}"); }
        }

        var pendingDisposals = await conn.QueryAsync<dynamic>(
            @"SELECT ""AssetDisposal_ID""
              FROM ""Asset_Disposal""
              WHERE ""Status"" = 'Pending'
                AND MONTH(""DisposalDate"") = @targetMonth
                AND YEAR(""DisposalDate"") = @targetYear
              ORDER BY ""DisposalDate"" ASC",
            new { targetMonth, targetYear });

        foreach (var d in pendingDisposals)
        {
            int id = (int)d.AssetDisposal_ID;
            try
            {
                var resp = await client.PostAsJsonAsync($"/api/disposals/{id}/approve", new { ApprovedBy = 1 });
                if (resp.IsSuccessStatusCode) results["disposals"]++;
                else errors.Add($"Disposal {id}: {resp.StatusCode}");
            }
            catch (Exception ex) { errors.Add($"Disposal {id}: {ex.Message}"); }
        }

        int? depScheduleId = null;
        try
        {
            var runResp = await client.PostAsJsonAsync("/api/depreciation/run", new
            {
                FinYear = finYear,
                ScheduledDate = targetDate.ToString("yyyy-MM-dd"),
                RunBy = 1
            });

            if (runResp.IsSuccessStatusCode)
            {
                var runResult = await runResp.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
                if (runResult.TryGetProperty("scheduleId", out var schedIdEl) && schedIdEl.ValueKind == System.Text.Json.JsonValueKind.Number)
                {
                    depScheduleId = schedIdEl.GetInt32();
                }
                else if (runResult.TryGetProperty("ScheduleId", out var schedIdEl2) && schedIdEl2.ValueKind == System.Text.Json.JsonValueKind.Number)
                {
                    depScheduleId = schedIdEl2.GetInt32();
                }

                if (depScheduleId.HasValue)
                {
                    var approveResp = await client.PostAsJsonAsync("/api/depreciation/approve", new
                    {
                        ScheduleId = depScheduleId.Value,
                        FinYear = finYear,
                        ApprovedBy = "Month-End Process"
                    });
                    if (!approveResp.IsSuccessStatusCode)
                        errors.Add($"Depreciation approval failed: {approveResp.StatusCode}");
                }
                else
                {
                    errors.Add("Depreciation run did not return a schedule ID");
                }
            }
            else
            {
                errors.Add($"Depreciation run failed: {runResp.StatusCode}");
            }
        }
        catch (Exception ex) { errors.Add($"Depreciation: {ex.Message}"); }

        return Ok(new
        {
            success = errors.Count == 0,
            finYear,
            period,
            targetMonth,
            results,
            depreciationScheduleId = depScheduleId,
            errors
        });
    }
}

public class MonthEndRunRequest
{
    public string? FinYear { get; set; }
    public int Period { get; set; }
}
