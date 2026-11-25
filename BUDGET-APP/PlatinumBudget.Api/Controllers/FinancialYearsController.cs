using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FinancialYearsController : ControllerBase
{
    private readonly BudgetDbContext _db;

    public FinancialYearsController(BudgetDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var activeYearCode = await GetActiveYearCodeFromConfig();
        var years = await _db.FinancialYears.AsNoTracking()
            .OrderByDescending(f => f.StartDate)
            .ToListAsync();

        if (!string.IsNullOrEmpty(activeYearCode))
            foreach (var y in years)
                y.IsActive = y.YearCode == activeYearCode;

        return Ok(years);
    }

    [HttpGet("active")]
    public async Task<IActionResult> GetActive()
    {
        var activeYearCode = await GetActiveYearCodeFromConfig();

        if (!string.IsNullOrEmpty(activeYearCode))
        {
            var fy = await _db.FinancialYears.AsNoTracking()
                .FirstOrDefaultAsync(f => f.YearCode == activeYearCode);
            if (fy != null) return Ok(fy);
        }

        return Ok(await _db.FinancialYears.AsNoTracking()
            .FirstOrDefaultAsync(f => f.IsActive));
    }

    private async Task<string?> GetActiveYearCodeFromConfig()
    {
        var results = await _db.Database
            .SqlQueryRaw<string>(@"SELECT ""KeyValue"" FROM ""AAAA_ConfigSettings"" WHERE ""KeyName"" = 'ActiveFinYear' LIMIT 1")
            .ToListAsync();
        return results.FirstOrDefault();
    }
}
