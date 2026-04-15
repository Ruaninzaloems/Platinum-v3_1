using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/projects/{projectId}/items")]
public class ProjectItemsController : ControllerBase
{
    private readonly BudgetDbContext _db;
    public ProjectItemsController(BudgetDbContext db) { _db = db; }

    [HttpGet]
    public async Task<IActionResult> GetItems(int projectId)
    {
        var items = await _db.Plan_ProjectItem
            .Where(x => x.ProjectID == projectId)
            .OrderBy(x => x.PlanProjectItem_ID)
            .ToListAsync();

        var itemIds = items.Select(i => i.PlanProjectItem_ID).ToList();
        var monthRows = await _db.Plan_ProjectItemMonth
            .Where(m => itemIds.Contains(m.PlanProjectItemID))
            .ToListAsync();

        var scoaIds = items.Select(i => i.SCOAItemID).Distinct().ToList();
        var fundIds = items.Where(i => i.SCOAFundId.HasValue).Select(i => i.SCOAFundId!.Value).Distinct().ToList();
        var fnIds = items.Where(i => i.SCOAFunctionId.HasValue).Select(i => i.SCOAFunctionId!.Value).Distinct().ToList();
        var regIds = items.Where(i => i.SCOARegionId.HasValue).Select(i => i.SCOARegionId!.Value).Distinct().ToList();
        var costIds = items.Where(i => i.SCOACostingID.HasValue).Select(i => i.SCOACostingID!.Value).Distinct().ToList();

        var scoaMap = scoaIds.Any() ? await _db.ConstScoaStructureConsolidated.Where(x => scoaIds.Contains(x.ScoaID)).ToDictionaryAsync(x => x.ScoaID) : new();
        var fundMap = fundIds.Any() ? await _db.ConstScoaFundsStructureConsolidated.Where(x => fundIds.Contains(x.ScoaID)).ToDictionaryAsync(x => x.ScoaID) : new();
        var fnMap = fnIds.Any() ? await _db.ConstScoaFunctionStructureConsolidated.Where(x => fnIds.Contains(x.ScoaID)).ToDictionaryAsync(x => x.ScoaID) : new();
        var regMap = regIds.Any() ? await _db.ConstScoaRegionalStructureConsolidated.Where(x => regIds.Contains(x.ScoaID)).ToDictionaryAsync(x => x.ScoaID) : new();
        var costMap = costIds.Any() ? await _db.ConstScoaCostingStructureConsolidated.Where(x => costIds.Contains(x.ScoaID)).ToDictionaryAsync(x => x.ScoaID) : new();

        var result = items.Select(i => new
        {
            id = i.PlanProjectItem_ID,
            projectId = i.ProjectID,
            projectItem = i.HistoricalProjectCode,
            scoaItemId = i.SCOAItemID,
            scoaItemCode = scoaMap.ContainsKey(i.SCOAItemID) ? scoaMap[i.SCOAItemID].ScoaCode : "",
            scoaItemDesc = scoaMap.ContainsKey(i.SCOAItemID) ? scoaMap[i.SCOAItemID].ScoaShortDesc ?? scoaMap[i.SCOAItemID].ScoaDesc : "",
            scoaItemPath = scoaMap.ContainsKey(i.SCOAItemID) ? scoaMap[i.SCOAItemID].ScoaDesc ?? "" : "",
            scoaFundId = i.SCOAFundId,
            scoaFundCode = i.SCOAFundId.HasValue && fundMap.ContainsKey(i.SCOAFundId.Value) ? fundMap[i.SCOAFundId.Value].ScoaCode : "",
            scoaFundDesc = i.SCOAFundId.HasValue && fundMap.ContainsKey(i.SCOAFundId.Value) ? fundMap[i.SCOAFundId.Value].ScoaDesc ?? fundMap[i.SCOAFundId.Value].ScoaShortDesc ?? "" : "",
            scoaFunctionId = i.SCOAFunctionId,
            scoaFunctionDesc = i.SCOAFunctionId.HasValue && fnMap.ContainsKey(i.SCOAFunctionId.Value) ? fnMap[i.SCOAFunctionId.Value].ScoaShortDesc ?? "" : "",
            scoaRegionId = i.SCOARegionId,
            scoaRegionDesc = i.SCOARegionId.HasValue && regMap.ContainsKey(i.SCOARegionId.Value) ? regMap[i.SCOARegionId.Value].ScoaShortDesc ?? "" : "",
            scoaCostingId = i.SCOACostingID,
            scoaCostingDesc = i.SCOACostingID.HasValue && costMap.ContainsKey(i.SCOACostingID.Value) ? costMap[i.SCOACostingID.Value].ScoaDesc ?? "" : "",
            budgetAmount = i.BudgetAmount,
            budgetAmountP1 = i.BudgetAmountCurP1,
            budgetAmountP2 = i.BudgetAmountCurP2,
            finYear = i.FinYear,
            grapClassification = i.GRAPClassification,
            grapNoteClassification = i.GRAPClassificationNote,
            mainSegmentReporting = i.MainSegmentReporting,
            subSegmentReporting = i.SubSegmentReporting,
            isActiveForScm = i.IsActiveForSCM,
            municipalClassification = i.GRAPClassification != null ? i.HistoricalProjectCode : i.HistoricalProjectCode,
            monthlyAmounts = monthRows
                .Where(m => m.PlanProjectItemID == i.PlanProjectItem_ID)
                .OrderBy(m => m.MonthID)
                .Select(m => new { monthId = m.MonthID, amount = m.UnitQuantity * m.UnitPrice })
                .ToList()
        }).ToList();

        return Ok(result);
    }

    [HttpGet("fund-budget/{scoaFundId}")]
    public async Task<IActionResult> GetFundBudget(int projectId, int scoaFundId)
    {
        var projectFunds = await _db.Plan_ProjectFund
            .Where(x => x.ProjectID == projectId && x.ScoaFundID == scoaFundId)
            .ToListAsync();

        var fundIds = projectFunds.Select(f => f.ProjectFund_ID).ToList();
        var yearAmounts = await _db.Plan_ProjectFundYear
            .Where(y => fundIds.Contains(y.ProjectFundID))
            .ToListAsync();

        var allocatedByYear = await _db.Plan_ProjectItem
            .Where(x => x.ProjectID == projectId && x.SCOAFundId == scoaFundId)
            .GroupBy(x => x.FinYear)
            .Select(g => new { FinYear = g.Key, Total = g.Sum(x => x.BudgetAmount ?? 0) })
            .ToListAsync();

        var years = yearAmounts.Select(y => y.FinYear ?? "").Distinct().OrderBy(y => y).ToList();
        if (!years.Any())
        {
            var finYears = await _db.FinancialYears.OrderByDescending(y => y.YearCode).Take(3).ToListAsync();
            years = finYears.Select(y => y.YearCode ?? "").ToList();
        }

        var rows = years.Select(yr =>
        {
            var available = yearAmounts.Where(y => y.FinYear == yr).Sum(y => y.YearFundAmount);
            var allocated = allocatedByYear.FirstOrDefault(a => a.FinYear == yr)?.Total ?? 0;
            return new { finYear = yr, available, allocated, remaining = available - allocated };
        }).ToList();

        return Ok(rows);
    }

    [HttpPost]
    public async Task<IActionResult> AddItem(int projectId, [FromBody] ProjectItemDto dto)
    {
        var item = new Plan_ProjectItem
        {
            ProjectID = projectId,
            SCOAItemID = dto.ScoaItemId,
            SCOAFundId = dto.ScoaFundId,
            SCOAFunctionId = dto.ScoaFunctionId,
            SCOARegionId = dto.ScoaRegionId,
            SCOACostingID = dto.ScoaCostingId,
            BudgetAmount = dto.BudgetAmount,
            BudgetAmountCurP1 = dto.BudgetAmountP1,
            BudgetAmountCurP2 = dto.BudgetAmountP2,
            FinYear = dto.FinYear,
            GRAPClassification = dto.GrapClassification,
            GRAPClassificationNote = dto.GrapNoteClassification,
            MainSegmentReporting = dto.MainSegmentReporting,
            SubSegmentReporting = dto.SubSegmentReporting,
            IsActiveForSCM = dto.IsActiveForScm,
            HistoricalProjectCode = dto.MunicipalClassification,
            CapturerID = 1,
            DateCaptured = DateTime.UtcNow
        };
        _db.Plan_ProjectItem.Add(item);
        await _db.SaveChangesAsync();

        if (dto.MonthlyAmounts != null && dto.MonthlyAmounts.Any())
            await SaveMonthlyAmounts(item.PlanProjectItem_ID, dto.MonthlyAmounts);

        return Ok(new { id = item.PlanProjectItem_ID });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateItem(int projectId, int id, [FromBody] ProjectItemDto dto)
    {
        var item = await _db.Plan_ProjectItem
            .FirstOrDefaultAsync(x => x.PlanProjectItem_ID == id && x.ProjectID == projectId);
        if (item == null) return NotFound();

        item.SCOAItemID = dto.ScoaItemId;
        item.SCOAFundId = dto.ScoaFundId;
        item.SCOAFunctionId = dto.ScoaFunctionId;
        item.SCOARegionId = dto.ScoaRegionId;
        item.SCOACostingID = dto.ScoaCostingId;
        item.BudgetAmount = dto.BudgetAmount;
        item.BudgetAmountCurP1 = dto.BudgetAmountP1;
        item.BudgetAmountCurP2 = dto.BudgetAmountP2;
        item.FinYear = dto.FinYear;
        item.GRAPClassification = dto.GrapClassification;
        item.GRAPClassificationNote = dto.GrapNoteClassification;
        item.MainSegmentReporting = dto.MainSegmentReporting;
        item.SubSegmentReporting = dto.SubSegmentReporting;
        item.IsActiveForSCM = dto.IsActiveForScm;
        item.HistoricalProjectCode = dto.MunicipalClassification;
        item.ModifierID = 1;
        item.DateModified = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        if (dto.MonthlyAmounts != null)
            await SaveMonthlyAmounts(id, dto.MonthlyAmounts);

        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteItem(int projectId, int id)
    {
        var item = await _db.Plan_ProjectItem
            .FirstOrDefaultAsync(x => x.PlanProjectItem_ID == id && x.ProjectID == projectId);
        if (item == null) return NotFound();
        var months = await _db.Plan_ProjectItemMonth.Where(m => m.PlanProjectItemID == id).ToListAsync();
        _db.Plan_ProjectItemMonth.RemoveRange(months);
        _db.Plan_ProjectItem.Remove(item);
        await _db.SaveChangesAsync();
        return Ok();
    }

    private async Task SaveMonthlyAmounts(int itemId, List<MonthAmountDto> amounts)
    {
        var existing = await _db.Plan_ProjectItemMonth
            .Where(m => m.PlanProjectItemID == itemId)
            .ToListAsync();
        _db.Plan_ProjectItemMonth.RemoveRange(existing);

        foreach (var m in amounts.Where(a => a.Amount != 0))
        {
            _db.Plan_ProjectItemMonth.Add(new Plan_ProjectItemMonth
            {
                PlanProjectItemID = itemId,
                MonthID = m.MonthId,
                UnitQuantity = m.Amount,
                UnitPrice = 1,
                CaptureID = 1,
                DateCaptured = DateTime.UtcNow
            });
        }
        await _db.SaveChangesAsync();
    }
}

public class MonthAmountDto
{
    public int MonthId { get; set; }
    public decimal Amount { get; set; }
}

public class ProjectItemDto
{
    public int ScoaItemId { get; set; }
    public int? ScoaFundId { get; set; }
    public int? ScoaFunctionId { get; set; }
    public int? ScoaRegionId { get; set; }
    public int? ScoaCostingId { get; set; }
    public decimal? BudgetAmount { get; set; }
    public decimal? BudgetAmountP1 { get; set; }
    public decimal? BudgetAmountP2 { get; set; }
    public string? FinYear { get; set; }
    public string? GrapClassification { get; set; }
    public string? GrapNoteClassification { get; set; }
    public string? MainSegmentReporting { get; set; }
    public string? SubSegmentReporting { get; set; }
    public bool? IsActiveForScm { get; set; }
    public string? MunicipalClassification { get; set; }
    public List<MonthAmountDto>? MonthlyAmounts { get; set; }
}
