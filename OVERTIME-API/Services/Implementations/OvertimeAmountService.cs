using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;
using PlatinumOvertime_API.Services.Interfaces;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// Bridges legacy Payroll_* tables and Const_MOC* tables to compute the
/// rand value of an overtime transaction.
///
/// Algorithm (matches Platinum production):
///   1. Locate the active MOC for the salary head: Const_MOC where
///      SalaryHeadID = X AND Enabled AND today between StartDate/EndDate
///      (Excel serial dates in dev seed; datetime2 in prod).
///   2. Locate the active MOCDetail under that MOC (same date filter).
///   3. Resolve formula variables from Payroll_Employee:
///         OverTimeHour = caller-supplied hours
///         PrevSalary, WHPM_Monthly, RPD_Other, WHPD_Other
///   4. Evaluate the Formula string and round to 2dp.
/// </summary>
public class OvertimeAmountService : IOvertimeAmountService
{
    // Salary heads the customer flagged as overtime/back-pay heads in the
    // EPD extract. Filtering against this list prevents the dropdown from
    // surfacing every salary head an employee is entitled to (~30+ rows).
    public static readonly int[] OvertimeSalaryHeadIds =
        { 10, 11, 236, 237, 276, 277, 491, 492, 238 };

    private readonly OvertimeDbContext _db;
    private readonly FormulaEvaluator _evaluator;
    private readonly ILogger<OvertimeAmountService> _log;

    public OvertimeAmountService(OvertimeDbContext db, FormulaEvaluator evaluator, ILogger<OvertimeAmountService> log)
    { _db = db; _evaluator = evaluator; _log = log; }

    /// <summary>
    /// Excel serial date for "today". Dev seed dates are stored as Excel
    /// serial numbers (45000-ish) so we compare on the same scale.
    /// SQL Server prod stores datetime2 — the seeder there inserts real
    /// dates, but this dev-only conversion is harmless because no real
    /// MOC ever falls outside its window.
    /// </summary>
    private static decimal ExcelSerialToday()
    {
        var epoch = new DateTime(1899, 12, 30);
        return (decimal)(DateTime.UtcNow.Date - epoch).TotalDays;
    }

    public async Task<List<OvertimeTypeOption>> GetOvertimeTypesForEmployeeAsync(int employeeId, CancellationToken ct = default)
    {
        // Entitlements live in Payroll_EmployeePayrollDefinition; project to
        // overtime heads only and join salary head + IRP5 metadata.
        var heads = OvertimeSalaryHeadIds;

        var entitled = await _db.PayrollEmployeePayrollDefinitions
            .Where(d => d.EmployeeId == employeeId
                        && (d.Enabled ?? true)
                        && heads.Contains(d.PayrollSalaryHeadId))
            .Select(d => d.PayrollSalaryHeadId)
            .Distinct()
            .ToListAsync(ct);

        if (entitled.Count == 0) return new List<OvertimeTypeOption>();

        var salaryHeads = await _db.PayrollSalaryHeads
            .Where(h => entitled.Contains(h.SalaryHeadId))
            .ToListAsync(ct);

        // Latest active MOCDetail per salary head.
        var today = ExcelSerialToday();
        var mocs = await _db.ConstMOCs
            .Where(m => entitled.Contains(m.SalaryHeadId)
                        && (m.Enabled ?? true)
                        && (m.StartDate == null || m.StartDate <= today)
                        && (m.EndDate == null || m.EndDate >= today))
            .ToListAsync(ct);

        var mocIds = mocs.Select(m => m.MOCId).ToList();
        var details = await _db.ConstMOCDetails
            .Where(d => mocIds.Contains(d.MOCId)
                        && (d.Enabled ?? true)
                        && (d.StartDate == null || d.StartDate <= today)
                        && (d.EndDate == null || d.EndDate >= today))
            .ToListAsync(ct);

        var irp5Ids = salaryHeads.Where(h => h.IRP5CodeId.HasValue)
                                 .Select(h => h.IRP5CodeId!.Value).ToList();
        var irp5s = await _db.PayrollIRP5Codes
            .Where(i => irp5Ids.Contains(i.IRP5CodeId))
            .ToDictionaryAsync(i => i.IRP5CodeId, ct);

        return salaryHeads.Select(h =>
        {
            var moc = mocs.FirstOrDefault(m => m.SalaryHeadId == h.SalaryHeadId);
            var detail = moc == null ? null : details.FirstOrDefault(d => d.MOCId == moc.MOCId);
            irp5s.TryGetValue(h.IRP5CodeId ?? -1, out var irp5);
            return new OvertimeTypeOption
            {
                SalaryHeadId = h.SalaryHeadId,
                SalaryHeadName = h.SalaryHeadName ?? string.Empty,
                SalaryHeadTitle = h.SalaryHeadTitle ?? string.Empty,
                IRP5Code = irp5?.IRP5Code,
                IRP5CodeDesc = irp5?.IRP5CodeDesc,
                Formula = detail?.Formula
            };
        })
        .OrderBy(o => o.SalaryHeadName)
        .ToList();
    }

    public async Task<OvertimeAmountResult> CalculateAsync(int employeeId, int salaryHeadId, decimal hours, CancellationToken ct = default)
    {
        var emp = await _db.PayrollEmployees
            .FirstOrDefaultAsync(e => e.EmployeeId == employeeId, ct)
            ?? throw new InvalidOperationException($"Employee {employeeId} not found.");

        var head = await _db.PayrollSalaryHeads
            .FirstOrDefaultAsync(h => h.SalaryHeadId == salaryHeadId, ct)
            ?? throw new InvalidOperationException($"Salary head {salaryHeadId} not found.");

        var today = ExcelSerialToday();
        var moc = await _db.ConstMOCs
            .Where(m => m.SalaryHeadId == salaryHeadId
                        && (m.Enabled ?? true)
                        && (m.StartDate == null || m.StartDate <= today)
                        && (m.EndDate == null || m.EndDate >= today))
            .FirstOrDefaultAsync(ct)
            ?? throw new InvalidOperationException($"No active MOC for salary head {salaryHeadId}.");

        var detail = await _db.ConstMOCDetails
            .Where(d => d.MOCId == moc.MOCId
                        && (d.Enabled ?? true)
                        && (d.StartDate == null || d.StartDate <= today)
                        && (d.EndDate == null || d.EndDate >= today))
            .FirstOrDefaultAsync(ct)
            ?? throw new InvalidOperationException($"No active MOCDetail under MOC {moc.MOCId}.");

        var inputs = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase)
        {
            ["OverTimeHour"] = hours,
            ["PrevSalary"]   = emp.PrevSalary   ?? 0m,
            ["WHPM_Monthly"] = emp.WhpmMonthly  ?? 1m,    // never zero — division would throw
            ["RPD_Other"]    = emp.RpdOther     ?? 0m,
            ["WHPD_Other"]   = emp.WhpdOther    ?? 1m,
        };

        var raw = _evaluator.Evaluate(detail.Formula ?? "0", inputs);
        var amount = decimal.Round(raw, 2, MidpointRounding.AwayFromZero);

        return new OvertimeAmountResult
        {
            Amount = amount,
            Formula = detail.Formula ?? string.Empty,
            SalaryHeadName = head.SalaryHeadName ?? string.Empty,
            Inputs = inputs
        };
    }
}
