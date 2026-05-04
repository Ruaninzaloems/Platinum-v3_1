using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;
using PlatinumOvertime_API.DTOs.Responses;
using PlatinumOvertime_API.Models.Common;

namespace PlatinumOvertime_API.Controllers;

/// <summary>
/// Read-only lookup endpoints over the legacy Const_/Payroll_ projections
/// imported from Platinum Payroll's master data. These back the dropdowns
/// in the overtime capture form so captured rows reference the same IDs
/// the payroll system uses.
///
/// The route prefix intentionally avoids the existing <c>/api/departments</c>
/// (which serves the integration-shaped <see cref="DepartmentDto"/>) so the
/// two surfaces can evolve independently without name collisions.
/// </summary>
[ApiController]
[Route("api/payroll-lookups")]
public class PayrollLookupsController : ControllerBase
{
    private readonly OvertimeDbContext _db;
    public PayrollLookupsController(OvertimeDbContext db) => _db = db;

    /// <summary>
    /// All enabled Const_Department rows, ordered by description so the
    /// dropdown is stable and human-friendly.
    /// </summary>
    [HttpGet("departments")]
    public async Task<ActionResult<ApiResponse<List<ConstDepartmentDto>>>> GetDepartments(CancellationToken ct)
    {
        var rows = await _db.ConstDepartments.AsNoTracking()
            .Where(d => d.Enabled == true)
            .OrderBy(d => d.DepartmentDesc)
            .Select(d => new ConstDepartmentDto
            {
                DepartmentId = d.DepartmentId,
                DepartmentDesc = d.DepartmentDesc ?? string.Empty,
                DepartmentCode = d.DepartmentCode
            })
            .ToListAsync(ct);
        return Ok(ApiResponse<List<ConstDepartmentDto>>.Success(rows));
    }

    /// <summary>
    /// Enabled Const_Division rows, optionally narrowed to a parent
    /// <paramref name="departmentId"/>. Without the filter the full set
    /// is returned so the picker can still operate on a flat list when
    /// the department is unknown.
    /// </summary>
    [HttpGet("divisions")]
    public async Task<ActionResult<ApiResponse<List<ConstDivisionDto>>>> GetDivisions(
        [FromQuery] int? departmentId, CancellationToken ct)
    {
        var q = _db.ConstDivisions.AsNoTracking().Where(d => d.Enabled == true);
        if (departmentId.HasValue)
            q = q.Where(d => d.DepartmentId == departmentId.Value);

        var rows = await q
            .OrderBy(d => d.DivisionDesc)
            .Select(d => new ConstDivisionDto
            {
                DivisionId = d.DivisionId,
                DivisionDesc = d.DivisionDesc ?? string.Empty,
                DivisionCode = d.DivisionCode,
                DepartmentId = d.DepartmentId
            })
            .ToListAsync(ct);
        return Ok(ApiResponse<List<ConstDivisionDto>>.Success(rows));
    }

    /// <summary>
    /// All enabled Const_Cycle rows. The cycle is the grouping key the
    /// period dropdown filters on.
    /// </summary>
    [HttpGet("cycles")]
    public async Task<ActionResult<ApiResponse<List<ConstCycleDto>>>> GetCycles(CancellationToken ct)
    {
        var rows = await _db.ConstCycles.AsNoTracking()
            .Where(c => c.Enabled == true)
            .OrderBy(c => c.CycleDesc)
            .Select(c => new ConstCycleDto
            {
                CycleId = c.CycleId,
                CycleDesc = c.CycleDesc ?? string.Empty
            })
            .ToListAsync(ct);
        return Ok(ApiResponse<List<ConstCycleDto>>.Success(rows));
    }

    /// <summary>
    /// Enabled Payroll_CyclePeriodDetails rows, optionally narrowed to a
    /// <paramref name="cycleId"/>. Ordered most-recent-first by period
    /// (TaxYear desc, PeriodInTaxYear desc) so the active payroll month
    /// surfaces at the top of the dropdown.
    /// </summary>
    [HttpGet("cycle-periods")]
    public async Task<ActionResult<ApiResponse<List<PayrollCyclePeriodDto>>>> GetCyclePeriods(
        [FromQuery] int? cycleId, CancellationToken ct)
    {
        var q = _db.PayrollCyclePeriodDetails.AsNoTracking().Where(p => p.Enabled == true);
        if (cycleId.HasValue)
            q = q.Where(p => p.CycleId == cycleId.Value);

        var rows = await q
            .OrderByDescending(p => p.TaxYear)
            .ThenByDescending(p => p.PeriodInTaxYear)
            .Select(p => new
            {
                p.PeriodId,
                p.PeriodInTaxYear,
                p.ProcessingMonth,
                p.FinancialYear,
                p.TaxYear,
                p.CycleId,
                p.CycleModeId
            })
            .ToListAsync(ct);

        var dtos = rows.Select(p => new PayrollCyclePeriodDto
        {
            PeriodId        = p.PeriodId,
            PeriodInTaxYear = p.PeriodInTaxYear,
            ProcessingMonth = p.ProcessingMonth,
            FinancialYear   = p.FinancialYear,
            TaxYear         = p.TaxYear,
            CycleId         = p.CycleId,
            CycleModeId     = p.CycleModeId,
            DisplayName     = BuildPeriodDisplay(p.ProcessingMonth, p.TaxYear ?? p.FinancialYear, p.CycleModeId)
        }).ToList();

        return Ok(ApiResponse<List<PayrollCyclePeriodDto>>.Success(dtos));
    }

    /// <summary>
    /// Returns open (unprocessed) periods for a given cycle using the same
    /// logic as the Payroll module:
    /// <list type="bullet">
    ///   <item>Normal cycle (CycleModeId=1) — only the single most-recent
    ///   unprocessed period in the current tax year.</item>
    ///   <item>Adhoc / scheduled cycle (CycleModeId=2) — all unprocessed
    ///   enabled periods in the current tax year.</item>
    /// </list>
    /// Returns 400 when <paramref name="cycleId"/> is not supplied.
    /// </summary>
    [HttpGet("cycle-periods-open")]
    public async Task<ActionResult<ApiResponse<List<PayrollCyclePeriodDto>>>> GetOpenCyclePeriods(
        [FromQuery] int? cycleId, CancellationToken ct)
    {
        if (!cycleId.HasValue)
            return BadRequest(ApiResponse<List<PayrollCyclePeriodDto>>.Failure("cycleId is required."));

        // Resolve the current tax year from AAAA_ConfigSettings.
        var taxYear = await _db.AAAAConfigSettings.AsNoTracking()
            .Where(c => c.KeyName == "TaxYear")
            .Select(c => c.KeyValue)
            .FirstOrDefaultAsync(ct);

        // Fallback: derive from today if the config row is missing.
        taxYear ??= DeriveDefaultTaxYear();

        // Normal-cycle periods (CycleModeId=1): earliest unprocessed period (ASC).
        var normalPeriod = await _db.PayrollCyclePeriodDetails.AsNoTracking()
            .Where(p => p.TaxYear == taxYear
                     && p.CycleId == cycleId.Value
                     && p.Processed == false
                     && p.Enabled == true
                     && p.CycleModeId == 1)
            .OrderBy(p => p.PeriodStartDate)
            .Take(1)
            .ToListAsync(ct);

        // Adhoc / scheduled periods (CycleModeId=2): all unprocessed.
        var adhocPeriods = await _db.PayrollCyclePeriodDetails.AsNoTracking()
            .Where(p => p.TaxYear == taxYear
                     && p.CycleId == cycleId.Value
                     && p.Processed == false
                     && p.Enabled == true
                     && p.CycleModeId == 2)
            .OrderByDescending(p => p.PeriodStartDate)
            .ToListAsync(ct);

        var combined = normalPeriod.Concat(adhocPeriods)
            .Select(p => new PayrollCyclePeriodDto
            {
                PeriodId        = p.PeriodId,
                PeriodInTaxYear = p.PeriodInTaxYear,
                ProcessingMonth = p.ProcessingMonth,
                FinancialYear   = p.FinancialYear,
                TaxYear         = p.TaxYear,
                CycleId         = p.CycleId,
                CycleModeId     = p.CycleModeId,
                DisplayName     = BuildPeriodDisplay(p.ProcessingMonth, p.TaxYear ?? p.FinancialYear, p.CycleModeId)
            })
            .ToList();

        return Ok(ApiResponse<List<PayrollCyclePeriodDto>>.Success(combined));
    }

    /// <summary>
    /// Derives "YYYY/YYYY+1" based on the South-African tax year
    /// (starts 1 March). Used only when AAAA_ConfigSettings has no TaxYear row.
    /// </summary>
    private static string DeriveDefaultTaxYear()
    {
        var now  = DateTime.Today;
        var from = now.Month >= 3 ? now.Year : now.Year - 1;
        return $"{from}/{from + 1}";
    }

    private static string BuildPeriodDisplay(string? month, string? year, int? cycleModeId)
    {
        var parts = new List<string>();
        if (!string.IsNullOrWhiteSpace(month)) parts.Add(month);
        if (!string.IsNullOrWhiteSpace(year)) parts.Add(year);
        var head = parts.Count > 0 ? string.Join(' ', parts) : "Period";
        return cycleModeId == 2 ? $"{head} (Ad Hoc)" : head;
    }
}
