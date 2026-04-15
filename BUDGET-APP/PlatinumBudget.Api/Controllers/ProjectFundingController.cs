using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/projects/{projectId}/funding")]
public class ProjectFundingController : ControllerBase
{
    private readonly BudgetDbContext _db;
    public ProjectFundingController(BudgetDbContext db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> GetFunding(int projectId)
    {
        var funds = await _db.Plan_ProjectFund
            .Where(x => x.ProjectID == projectId)
            .OrderBy(x => x.ProjectFund_ID)
            .ToListAsync();

        var fundIds = funds.Select(f => f.ProjectFund_ID).ToList();
        var yearAmounts = await _db.Plan_ProjectFundYear
            .Where(x => fundIds.Contains(x.ProjectFundID))
            .ToListAsync();

        var scoaIds = funds.Select(f => f.ScoaFundID).Distinct().ToList();
        var scoaFunds = await _db.ConstScoaFundsStructureConsolidated
            .Where(x => scoaIds.Contains(x.ScoaID))
            .ToListAsync();
        var scoaMap = scoaFunds.ToDictionary(s => s.ScoaID);

        var result = funds.Select(f =>
        {
            var years = yearAmounts.Where(y => y.ProjectFundID == f.ProjectFund_ID).ToList();
            var scoa = scoaMap.ContainsKey(f.ScoaFundID) ? scoaMap[f.ScoaFundID] : null;
            return new
            {
                id = f.ProjectFund_ID,
                projectId = f.ProjectID,
                scoaFundId = f.ScoaFundID,
                fundCode = scoa?.ScoaCode ?? "",
                fundDescription = scoa?.ScoaDesc ?? "",
                fundAmount = f.FundAmount ?? 0,
                years = years.Select(y => new { y.FinYear, y.YearFundAmount, y.ProjectFundYear_ID })
            };
        }).ToList();

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> AddFunding(int projectId, [FromBody] ProjectFundingDto dto)
    {
        var totalAmount = dto.YearAmounts?.Sum(y => y.Amount) ?? 0;

        var fund = new Plan_ProjectFund
        {
            ProjectID = projectId,
            ScoaFundID = dto.ScoaFundId,
            FundAmount = totalAmount,
            CapturerID = 1,
            DateCaptured = DateTime.UtcNow
        };
        _db.Plan_ProjectFund.Add(fund);
        await _db.SaveChangesAsync();

        foreach (var ya in dto.YearAmounts ?? [])
        {
            _db.Plan_ProjectFundYear.Add(new Plan_ProjectFundYear
            {
                ProjectFundID = fund.ProjectFund_ID,
                FinYear = ya.FinYear,
                YearFundAmount = ya.Amount,
                CapturerID = 1,
                DateCaptured = DateTime.UtcNow
            });
        }
        await _db.SaveChangesAsync();
        return Ok(new { id = fund.ProjectFund_ID });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateFunding(int projectId, int id, [FromBody] ProjectFundingDto dto)
    {
        var fund = await _db.Plan_ProjectFund
            .FirstOrDefaultAsync(x => x.ProjectFund_ID == id && x.ProjectID == projectId);
        if (fund == null) return NotFound();

        var totalAmount = dto.YearAmounts?.Sum(y => y.Amount) ?? 0;
        fund.ScoaFundID = dto.ScoaFundId;
        fund.FundAmount = totalAmount;
        fund.ModifierID = 1;
        fund.DateModified = DateTime.UtcNow;

        var existingYears = await _db.Plan_ProjectFundYear
            .Where(y => y.ProjectFundID == id).ToListAsync();
        _db.Plan_ProjectFundYear.RemoveRange(existingYears);

        foreach (var ya in dto.YearAmounts ?? [])
        {
            _db.Plan_ProjectFundYear.Add(new Plan_ProjectFundYear
            {
                ProjectFundID = id,
                FinYear = ya.FinYear,
                YearFundAmount = ya.Amount,
                CapturerID = 1,
                DateCaptured = DateTime.UtcNow
            });
        }
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteFunding(int projectId, int id)
    {
        var fund = await _db.Plan_ProjectFund
            .FirstOrDefaultAsync(x => x.ProjectFund_ID == id && x.ProjectID == projectId);
        if (fund == null) return NotFound();

        var years = await _db.Plan_ProjectFundYear
            .Where(y => y.ProjectFundID == id).ToListAsync();
        _db.Plan_ProjectFundYear.RemoveRange(years);
        _db.Plan_ProjectFund.Remove(fund);
        await _db.SaveChangesAsync();
        return Ok();
    }
}

public class ProjectFundingDto
{
    public int ScoaFundId { get; set; }
    public List<YearAmountDto>? YearAmounts { get; set; }
}

public class YearAmountDto
{
    public string FinYear { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}
