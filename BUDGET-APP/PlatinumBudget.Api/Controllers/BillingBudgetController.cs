using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.DTOs;
using PlatinumBudget.Api.Models;
using PlatinumBudget.Api.Services;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/billing")]
public class BillingBudgetController : ControllerBase
{
    private readonly BudgetDbContext _db;
    private readonly TariffModellingService _tariffService;
    private readonly RevenueProjectionService _revenueService;
    private readonly RebateProjectionService _rebateService;
    private readonly BillingBudgetStringService _stringService;
    private readonly AuditService _audit;

    public BillingBudgetController(BudgetDbContext db, TariffModellingService tariffService, RevenueProjectionService revenueService, RebateProjectionService rebateService, BillingBudgetStringService stringService, AuditService audit)
    {
        _db = db;
        _tariffService = tariffService;
        _revenueService = revenueService;
        _rebateService = rebateService;
        _stringService = stringService;
        _audit = audit;
    }

    [HttpGet("service-categories")]
    public async Task<IActionResult> GetServiceCategories()
    {
        var categories = await _db.ServiceCategories
            .Include(s => s.Tariffs)
            .OrderBy(s => s.Code)
            .Select(s => new ServiceCategoryDto(s.Id, s.Code, s.Name, s.Type.ToString(), s.MeasurementUnit, s.IsActive, s.Tariffs.Count))
            .ToListAsync();
        return Ok(categories);
    }

    [HttpGet("tariffs")]
    public async Task<IActionResult> GetTariffs([FromQuery] int? serviceCategoryId, [FromQuery] string? propertyCategory, [FromQuery] int? financialYearId)
    {
        var query = _db.Tariffs.Include(t => t.ServiceCategory).AsQueryable();
        if (serviceCategoryId.HasValue) query = query.Where(t => t.ServiceCategoryId == serviceCategoryId);
        if (!string.IsNullOrEmpty(propertyCategory) && Enum.TryParse<PropertyCategory>(propertyCategory, true, out var pc)) query = query.Where(t => t.PropertyCategory == pc);
        if (financialYearId.HasValue) query = query.Where(t => t.FinancialYearId == financialYearId);

        var tariffs = await query.OrderBy(t => t.ServiceCategoryId).ThenBy(t => t.PropertyCategory)
            .Select(t => new TariffDto(t.Id, t.ServiceCategoryId, t.ServiceCategory.Name, t.Name, t.PropertyCategory.ToString(), t.TariffType.ToString(), t.BasicCharge, t.UnitRate, t.BlockStart, t.BlockEnd, t.EffectiveFrom, t.EffectiveTo, t.IsApproved, t.FinancialYearId))
            .ToListAsync();
        return Ok(tariffs);
    }

    [HttpPost("tariffs")]
    public async Task<IActionResult> CreateTariff([FromBody] CreateTariffDto dto)
    {
        if (!Enum.TryParse<PropertyCategory>(dto.PropertyCategory, true, out var pc)) return BadRequest("Invalid property category");
        if (!Enum.TryParse<TariffType>(dto.TariffType, true, out var tt)) return BadRequest("Invalid tariff type");

        var tariff = new Tariff
        {
            ServiceCategoryId = dto.ServiceCategoryId, Name = dto.Name,
            PropertyCategory = pc, TariffType = tt,
            BasicCharge = dto.BasicCharge, UnitRate = dto.UnitRate,
            BlockStart = dto.BlockStart, BlockEnd = dto.BlockEnd,
            EffectiveFrom = dto.EffectiveFrom, EffectiveTo = dto.EffectiveTo,
            FinancialYearId = dto.FinancialYearId, IsApproved = true
        };
        _db.Tariffs.Add(tariff);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("Tariff", tariff.Id, "Created", "system", $"Tariff '{dto.Name}' created");
        return Ok(tariff.Id);
    }

    [HttpPut("tariffs/{id}")]
    public async Task<IActionResult> UpdateTariff(int id, [FromBody] UpdateTariffDto dto)
    {
        var tariff = await _db.Tariffs.FindAsync(id);
        if (tariff == null) return NotFound();
        if (dto.Name != null) tariff.Name = dto.Name;
        if (dto.BasicCharge.HasValue) tariff.BasicCharge = dto.BasicCharge.Value;
        if (dto.UnitRate.HasValue) tariff.UnitRate = dto.UnitRate.Value;
        if (dto.BlockStart.HasValue) tariff.BlockStart = dto.BlockStart;
        if (dto.BlockEnd.HasValue) tariff.BlockEnd = dto.BlockEnd;
        if (dto.EffectiveFrom.HasValue) tariff.EffectiveFrom = dto.EffectiveFrom.Value;
        if (dto.EffectiveTo.HasValue) tariff.EffectiveTo = dto.EffectiveTo;
        if (dto.IsApproved.HasValue) tariff.IsApproved = dto.IsApproved.Value;
        if (dto.PropertyCategory != null && Enum.TryParse<PropertyCategory>(dto.PropertyCategory, true, out var pc)) tariff.PropertyCategory = pc;
        if (dto.TariffType != null && Enum.TryParse<TariffType>(dto.TariffType, true, out var tt)) tariff.TariffType = tt;
        tariff.ModifiedBy = "system"; tariff.ModifiedOn = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpGet("tariff-scenarios")]
    public async Task<IActionResult> GetTariffScenarios([FromQuery] int? financialYearId)
    {
        var query = _db.TariffScenarios.Include(s => s.Lines).Include(s => s.FinancialYear).AsQueryable();
        if (financialYearId.HasValue) query = query.Where(s => s.FinancialYearId == financialYearId);

        var rawScenarios = await query.OrderByDescending(s => s.CreatedOn).ToListAsync();

        // Pre-compute project budget Year1 totals per unique financial year text
        // using the same A4 SCOA chain as the detail tiles
        var a4Codes = new[] { "0300", "0400", "0500", "0600", "1800" };
        var uniqueFyTexts = rawScenarios.Select(s => s.FinancialYear.YearCode).Distinct().ToList();
        var fyBudgetMap = new Dictionary<string, decimal>();

        foreach (var fyText in uniqueFyTexts)
        {
            var startYear = fyText.Split('/')[0].Trim();
            var versionRow = await _db.Const_Section71_ScoaVersion_Sys
                .Where(v => v.ScoaVersionEnabled && v.ScoaVersionYearStart == startYear)
                .FirstOrDefaultAsync();
            if (versionRow == null) { fyBudgetMap[fyText] = 0; continue; }

            var scoaVersion = versionRow.ScoaVersionDesc!;
            var longCodes = await _db.Section71_NTMapping
                .Where(m => m.A1ScheduleSheet == "A4" && a4Codes.Contains(m.A1ScheduleCode) && m.ScoaVersion == scoaVersion)
                .Select(m => m.AccountNumberLongCode)
                .Distinct()
                .ToListAsync();

            if (!longCodes.Any()) { fyBudgetMap[fyText] = 0; continue; }

            var scoaIds = await _db.ConstScoaStructureConsolidated
                .Where(s => s.FinYearText == fyText && longCodes.Contains(s.ScoaCode))
                .Select(s => s.ScoaID)
                .Distinct()
                .ToListAsync();

            if (!scoaIds.Any()) { fyBudgetMap[fyText] = 0; continue; }

            var year1Total = await (
                from pi in _db.Plan_ProjectItem
                let effectiveId = _db.Plan_ProjectScoaItem
                    .Where(psi => psi.ProjectID == pi.ProjectID)
                    .Select(psi => (int?)psi.ScoaItemID)
                    .FirstOrDefault() ?? pi.SCOAItemID
                where scoaIds.Contains(effectiveId)
                select (decimal?)(pi.BudgetAmount ?? 0)
            ).SumAsync() ?? 0;

            fyBudgetMap[fyText] = Math.Abs(year1Total);
        }

        var scenarios = rawScenarios.Select(s =>
        {
            var currentRevenue = fyBudgetMap.GetValueOrDefault(s.FinancialYear.YearCode, 0);
            var projectedRevenue = currentRevenue * (1 + s.BaseIncreasePercentage / 100);
            var variance = projectedRevenue - currentRevenue;
            return new TariffScenarioSummaryDto(s.Id, s.Name, s.Status.ToString(), s.BaseIncreasePercentage,
                currentRevenue, projectedRevenue, variance, s.Lines.Count, s.CreatedOn, s.IsArchived);
        }).ToList();
        return Ok(scenarios);
    }

    [HttpPost("tariff-scenarios")]
    public async Task<IActionResult> CreateTariffScenario([FromBody] CreateTariffScenarioDto dto)
    {
        var scenario = await _tariffService.CreateScenarioWithLines(dto.Name, dto.Description, dto.FinancialYearId, dto.BaseIncreasePercentage, dto.Justification, dto.ServiceCategoryIds);
        if (dto.ServiceIncreases?.Any() == true)
        {
            foreach (var si in dto.ServiceIncreases)
                _db.TariffScenarioServiceIncreases.Add(new TariffScenarioServiceIncrease
                {
                    TariffScenarioId = scenario.Id,
                    ServiceType = si.ServiceType,
                    ConsumerType = si.ConsumerType,
                    IncreasePercentage = si.IncreasePercentage
                });
            await _db.SaveChangesAsync();
        }
        return Ok(scenario.Id);
    }

    [HttpGet("tariff-scenarios/{id}")]
    public async Task<IActionResult> GetTariffScenario(int id)
    {
        var s = await _db.TariffScenarios
            .Include(s => s.Lines).ThenInclude(l => l.ServiceCategory)
            .Include(s => s.FinancialYear)
            .Include(s => s.ServiceIncreases)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (s == null) return NotFound();

        var dto = new TariffScenarioDto(s.Id, s.Name, s.Description, s.FinancialYearId, s.FinancialYear.YearCode, s.Status.ToString(), s.BaseIncreasePercentage, s.Justification, s.CreatedBy, s.CreatedOn, s.ApprovedBy, s.ApprovedOn,
            s.Lines.Select(l => new TariffScenarioLineDto(l.Id, l.ServiceCategoryId, l.ServiceCategory.Name, l.ServiceCategory.Type.ToString(), l.BaseTariffId, l.CurrentUnitRate, l.CurrentBasicCharge, l.ProjectedUnitRate, l.ProjectedBasicCharge, l.IncreasePercent, l.CurrentRevenue, l.ProjectedRevenue, l.VarianceAmount, l.VariancePercent, l.IsMaterialShift)).ToList(),
            s.ServiceIncreases.Select(si => new ServiceTypeIncreaseDto(si.ServiceType, si.ConsumerType, si.IncreasePercentage)).ToList());
        return Ok(dto);
    }

    [HttpPut("tariff-scenarios/{id}")]
    public async Task<IActionResult> UpdateTariffScenario(int id, [FromBody] UpdateTariffScenarioDto dto)
    {
        var scenario = await _db.TariffScenarios.Include(s => s.ServiceIncreases).FirstOrDefaultAsync(s => s.Id == id);
        if (scenario == null) return NotFound();
        if (dto.Name != null) scenario.Name = dto.Name;
        if (dto.Description != null) scenario.Description = dto.Description;
        if (dto.BaseIncreasePercentage.HasValue) scenario.BaseIncreasePercentage = dto.BaseIncreasePercentage.Value;
        if (dto.Justification != null) scenario.Justification = dto.Justification;
        if (dto.ServiceIncreases != null)
        {
            _db.TariffScenarioServiceIncreases.RemoveRange(scenario.ServiceIncreases);
            foreach (var si in dto.ServiceIncreases)
                _db.TariffScenarioServiceIncreases.Add(new TariffScenarioServiceIncrease { TariffScenarioId = id, ServiceType = si.ServiceType, ConsumerType = si.ConsumerType, IncreasePercentage = si.IncreasePercentage });
        }
        await _db.SaveChangesAsync();
        await _audit.LogAsync("TariffScenario", id, "Updated", "system", $"Scenario '{scenario.Name}' updated");
        return Ok();
    }

    [HttpDelete("tariff-scenarios/{id}")]
    public async Task<IActionResult> DeleteTariffScenario(int id)
    {
        var scenario = await _db.TariffScenarios.FindAsync(id);
        if (scenario == null) return NotFound();
        _db.TariffScenarios.Remove(scenario);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("TariffScenario", id, "Deleted", "system", $"Scenario '{scenario.Name}' permanently deleted");
        return NoContent();
    }

    [HttpPatch("tariff-scenarios/{id}/archive")]
    public async Task<IActionResult> ArchiveTariffScenario(int id)
    {
        var scenario = await _db.TariffScenarios.FindAsync(id);
        if (scenario == null) return NotFound();
        scenario.IsArchived = true;
        await _db.SaveChangesAsync();
        await _audit.LogAsync("TariffScenario", id, "Archived", "system", $"Scenario '{scenario.Name}' archived");
        return Ok();
    }

    [HttpPatch("tariff-scenarios/{id}/unarchive")]
    public async Task<IActionResult> UnarchiveTariffScenario(int id)
    {
        var scenario = await _db.TariffScenarios.FindAsync(id);
        if (scenario == null) return NotFound();
        scenario.IsArchived = false;
        await _db.SaveChangesAsync();
        await _audit.LogAsync("TariffScenario", id, "Unarchived", "system", $"Scenario '{scenario.Name}' unarchived");
        return Ok();
    }

    [HttpPost("tariff-scenarios/{id}/calculate")]
    public async Task<IActionResult> CalculateScenario(int id)
    {
        var scenario = await _db.TariffScenarios.Include(s => s.Lines).FirstOrDefaultAsync(s => s.Id == id);
        if (scenario == null) return NotFound();
        await _tariffService.CalculateScenarioLines(scenario);
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("tariff-scenarios/{id}/submit")]
    public async Task<IActionResult> SubmitScenario(int id)
    {
        var scenario = await _db.TariffScenarios.FindAsync(id);
        if (scenario == null) return NotFound();
        scenario.Status = BillingApprovalStatus.Submitted;
        _db.BillingBudgetApprovals.Add(new BillingBudgetApproval { EntityType = "TariffScenario", EntityId = id, ApprovalType = BillingApprovalType.ScenarioReport, Decision = ApprovalDecision.Submitted, DecidedBy = "system" });
        await _db.SaveChangesAsync();
        await _audit.LogAsync("TariffScenario", id, "Submitted", "system", "Scenario submitted for approval");
        return Ok();
    }

    [HttpPost("tariff-scenarios/{id}/approve")]
    public async Task<IActionResult> ApproveScenario(int id, [FromBody] ApproveDto? dto)
    {
        var scenario = await _db.TariffScenarios.FindAsync(id);
        if (scenario == null) return NotFound();
        scenario.Status = BillingApprovalStatus.Approved;
        scenario.ApprovedBy = "CFO"; scenario.ApprovedOn = DateTime.UtcNow;
        _db.BillingBudgetApprovals.Add(new BillingBudgetApproval { EntityType = "TariffScenario", EntityId = id, ApprovalType = BillingApprovalType.ScenarioReport, Decision = ApprovalDecision.Approved, Comment = dto?.Comment, DecidedBy = "CFO" });
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("tariff-scenarios/{id}/push-to-draft")]
    public async Task<IActionResult> PushToDraft(int id)
    {
        var scenario = await _db.TariffScenarios.Include(s => s.FinancialYear).FirstOrDefaultAsync(s => s.Id == id);
        if (scenario == null) return NotFound();

        var fyText = scenario.FinancialYear.YearCode;
        var startYear = fyText.Split('/')[0].Trim();
        var pct = scenario.BaseIncreasePercentage / 100m;

        var versionRow = await _db.Const_Section71_ScoaVersion_Sys
            .Where(v => v.ScoaVersionEnabled && v.ScoaVersionYearStart == startYear)
            .FirstOrDefaultAsync();
        if (versionRow == null) return BadRequest("No SCOA version found for financial year.");

        var scoaVersion = versionRow.ScoaVersionDesc!;
        var a4Codes = new[] { "0300", "0400", "0500", "0600", "1800" };

        var longCodes = await _db.Section71_NTMapping
            .Where(m => m.A1ScheduleSheet == "A4" && a4Codes.Contains(m.A1ScheduleCode) && m.ScoaVersion == scoaVersion)
            .Select(m => m.AccountNumberLongCode)
            .Distinct()
            .ToListAsync();
        if (!longCodes.Any()) return BadRequest("No SCOA long codes found for A4 services.");

        var scoaIds = await _db.ConstScoaStructureConsolidated
            .Where(s => s.FinYearText == fyText && longCodes.Contains(s.ScoaCode))
            .Select(s => s.ScoaID)
            .Distinct()
            .ToListAsync();
        if (!scoaIds.Any()) return BadRequest("No SCOA IDs resolved from long codes.");

        // Resolve via Plan_ProjectScoaItem join first, fall back to direct SCOAItemID
        var scoaItemProjectMap = await _db.Plan_ProjectScoaItem
            .Where(psi => scoaIds.Contains(psi.ScoaItemID))
            .Select(psi => psi.ProjectID)
            .Distinct()
            .ToListAsync();

        var items = await _db.Plan_ProjectItem
            .Where(pi => scoaIds.Contains(pi.SCOAItemID) || scoaItemProjectMap.Contains(pi.ProjectID))
            .ToListAsync();

        if (!items.Any()) return Ok(new { updated = 0, message = "No Plan_ProjectItem records matched." });

        foreach (var item in items)
        {
            var newYear1 = (item.BudgetAmount ?? 0) * (1 + pct);
            var newYear2 = (item.BudgetAmountCurP1 ?? 0) * (1 + pct);
            var newYear3 = (item.BudgetAmountCurP2 ?? 0) * (1 + pct);
            var monthly = newYear1 / 12m;

            item.BudgetAmount = newYear1;
            item.BudgetAmountCurP1 = newYear2;
            item.BudgetAmountCurP2 = newYear3;
            item.Month01 = monthly;
            item.Month02 = monthly;
            item.Month03 = monthly;
            item.Month04 = monthly;
            item.Month05 = monthly;
            item.Month06 = monthly;
            item.Month07 = monthly;
            item.Month08 = monthly;
            item.Month09 = monthly;
            item.Month10 = monthly;
            item.Month11 = monthly;
            item.Month12 = monthly;
            item.DateModified = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        await _audit.LogAsync("TariffScenario", id, "PushedToDraft", "system",
            $"Pushed {items.Count} Plan_ProjectItem records with {scenario.BaseIncreasePercentage}% increase");
        return Ok(new { updated = items.Count });
    }

    [HttpGet("tariff-scenarios/compare")]
    public async Task<IActionResult> CompareScenarios([FromQuery] string ids)
    {
        var idList = ids.Split(',').Select(int.Parse).ToList();
        var scenarios = await _db.TariffScenarios.Include(s => s.FinancialYear)
            .Where(s => idList.Contains(s.Id)).ToListAsync();

        var serviceCodeNames = new (string Code, string Name)[]
        {
            ("0300", "Electricity"), ("0400", "Water"), ("0500", "Sanitation"),
            ("0600", "Refuse"), ("1800", "Property Rates")
        };
        var a4Codes = serviceCodeNames.Select(x => x.Code).ToArray();

        // Per-FY, per-A4-code Year1 absolute total from Plan_ProjectItem
        var uniqueFyTexts = scenarios.Select(s => s.FinancialYear.YearCode).Distinct().ToList();
        var fyServiceMap = new Dictionary<string, Dictionary<string, decimal>>();

        foreach (var fyText in uniqueFyTexts)
        {
            fyServiceMap[fyText] = new Dictionary<string, decimal>();
            var startYear = fyText.Split('/')[0].Trim();
            var versionRow = await _db.Const_Section71_ScoaVersion_Sys
                .Where(v => v.ScoaVersionEnabled && v.ScoaVersionYearStart == startYear)
                .FirstOrDefaultAsync();
            if (versionRow == null) { foreach (var c in a4Codes) fyServiceMap[fyText][c] = 0; continue; }

            var scoaVersion = versionRow.ScoaVersionDesc!;
            foreach (var a4Code in a4Codes)
            {
                var longCodes = await _db.Section71_NTMapping
                    .Where(m => m.A1ScheduleSheet == "A4" && m.A1ScheduleCode == a4Code && m.ScoaVersion == scoaVersion)
                    .Select(m => m.AccountNumberLongCode).Distinct().ToListAsync();

                if (!longCodes.Any()) { fyServiceMap[fyText][a4Code] = 0; continue; }

                var scoaIds = await _db.ConstScoaStructureConsolidated
                    .Where(s => s.FinYearText == fyText && longCodes.Contains(s.ScoaCode))
                    .Select(s => s.ScoaID).Distinct().ToListAsync();

                if (!scoaIds.Any()) { fyServiceMap[fyText][a4Code] = 0; continue; }

                var year1 = await (
                    from pi in _db.Plan_ProjectItem
                    let effectiveId = _db.Plan_ProjectScoaItem
                        .Where(psi => psi.ProjectID == pi.ProjectID)
                        .Select(psi => (int?)psi.ScoaItemID).FirstOrDefault() ?? pi.SCOAItemID
                    where scoaIds.Contains(effectiveId)
                    select (decimal?)(pi.BudgetAmount ?? 0)
                ).SumAsync() ?? 0;

                fyServiceMap[fyText][a4Code] = Math.Abs(year1);
            }
        }

        var entries = scenarios.Select(s =>
        {
            var sMap = fyServiceMap.GetValueOrDefault(s.FinancialYear.YearCode, new Dictionary<string, decimal>());
            var current = sMap.Values.Sum();
            var projected = current * (1 + s.BaseIncreasePercentage / 100);
            var variance = projected - current;
            return new ScenarioComparisonEntry(s.Id, s.Name, s.BaseIncreasePercentage, current, projected, variance,
                current != 0 ? variance / current * 100 : 0);
        }).ToList();

        var firstFyMap = fyServiceMap.GetValueOrDefault(scenarios.First().FinancialYear.YearCode, new Dictionary<string, decimal>());
        var serviceRows = serviceCodeNames.Select((svc, idx) =>
        {
            var current = firstFyMap.GetValueOrDefault(svc.Code, 0);
            var scenarioRevenues = scenarios.Select(s =>
            {
                var sMap = fyServiceMap.GetValueOrDefault(s.FinancialYear.YearCode, new Dictionary<string, decimal>());
                var svcCurrent = sMap.GetValueOrDefault(svc.Code, 0);
                var projected = svcCurrent * (1 + s.BaseIncreasePercentage / 100);
                var variance = projected - svcCurrent;
                return new ScenarioRevenueEntry(s.Id, s.Name, projected, variance,
                    svcCurrent != 0 ? variance / svcCurrent * 100 : 0);
            }).ToList();
            return new ServiceComparisonRow(idx + 1, svc.Name, current, scenarioRevenues);
        }).ToList();

        return Ok(new ScenarioComparisonDto(entries, serviceRows));
    }

    [HttpGet("consumer-categories")]
    public async Task<IActionResult> GetConsumerCategories()
    {
        var categories = await _db.ConsumerCategories
            .Include(c => c.ConsumerServices).ThenInclude(cs => cs.ServiceCategory)
            .OrderBy(c => c.Name)
            .ToListAsync();

        var dtos = categories.Select(c => new ConsumerCategoryDto(c.Id, c.Name, c.Type.ToString(), c.ConsumerCount, c.AvgMonthlyConsumption, c.PropertyValueMin, c.PropertyValueMax, c.GeographicArea, c.IsActive, c.IsFlagged,
            c.ConsumerServices.Select(cs => new ConsumerServiceDto(cs.Id, cs.ServiceCategoryId, cs.ServiceCategory.Name, cs.AvgConsumption, cs.ConsumerCount)).ToList())).ToList();
        return Ok(dtos);
    }

    [HttpPost("consumer-categories")]
    public async Task<IActionResult> CreateConsumerCategory([FromBody] CreateConsumerCategoryDto dto)
    {
        if (!Enum.TryParse<ConsumerType>(dto.Type, true, out var ct)) return BadRequest("Invalid consumer type");
        var category = new ConsumerCategory
        {
            Name = dto.Name, Type = ct, ConsumerCount = dto.ConsumerCount,
            AvgMonthlyConsumption = dto.AvgMonthlyConsumption,
            PropertyValueMin = dto.PropertyValueMin, PropertyValueMax = dto.PropertyValueMax,
            GeographicArea = dto.GeographicArea, IsFlagged = dto.IsFlagged
        };
        _db.ConsumerCategories.Add(category);
        await _db.SaveChangesAsync();

        if (dto.Services != null)
        {
            foreach (var svc in dto.Services)
            {
                _db.ConsumerCategoryServices.Add(new ConsumerCategoryService { ConsumerCategoryId = category.Id, ServiceCategoryId = svc.ServiceCategoryId, AvgConsumption = svc.AvgConsumption, ConsumerCount = svc.ConsumerCount });
            }
            await _db.SaveChangesAsync();
        }
        return Ok(category.Id);
    }

    [HttpPut("consumer-categories/{id}")]
    public async Task<IActionResult> UpdateConsumerCategory(int id, [FromBody] UpdateConsumerCategoryDto dto)
    {
        var cat = await _db.ConsumerCategories.FindAsync(id);
        if (cat == null) return NotFound();
        if (dto.Name != null) cat.Name = dto.Name;
        if (dto.ConsumerCount.HasValue) cat.ConsumerCount = dto.ConsumerCount.Value;
        if (dto.AvgMonthlyConsumption.HasValue) cat.AvgMonthlyConsumption = dto.AvgMonthlyConsumption.Value;
        if (dto.PropertyValueMin.HasValue) cat.PropertyValueMin = dto.PropertyValueMin;
        if (dto.PropertyValueMax.HasValue) cat.PropertyValueMax = dto.PropertyValueMax;
        if (dto.GeographicArea != null) cat.GeographicArea = dto.GeographicArea;
        if (dto.IsFlagged.HasValue) cat.IsFlagged = dto.IsFlagged.Value;
        if (dto.Type != null && Enum.TryParse<ConsumerType>(dto.Type, true, out var ct)) cat.Type = ct;
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpGet("consumer-categories/{id}/projected-bills")]
    public async Task<IActionResult> GetProjectedBills(int id, [FromQuery] int? tariffScenarioId)
    {
        var cat = await _db.ConsumerCategories.Include(c => c.ConsumerServices).ThenInclude(cs => cs.ServiceCategory).FirstOrDefaultAsync(c => c.Id == id);
        if (cat == null) return NotFound();

        var fy = await _db.FinancialYears.FirstOrDefaultAsync(f => f.IsActive);
        if (fy == null) return BadRequest("No active financial year");

        var tariffs = await _db.Tariffs.Where(t => t.FinancialYearId == fy.Id && t.IsApproved).ToListAsync();

        TariffScenario? scenario = null;
        if (tariffScenarioId.HasValue) scenario = await _db.TariffScenarios.Include(s => s.Lines).FirstOrDefaultAsync(s => s.Id == tariffScenarioId);

        var rebateTypes = await _db.RebateTypes.Where(r => r.IsActive).ToListAsync();

        var billLines = new List<ProjectedBillLineDto>();
        foreach (var cs in cat.ConsumerServices)
        {
            var tariff = tariffs.FirstOrDefault(t => t.ServiceCategoryId == cs.ServiceCategoryId);
            var scenarioLine = scenario?.Lines.FirstOrDefault(l => l.ServiceCategoryId == cs.ServiceCategoryId);
            var currentRate = tariff?.UnitRate ?? 0;
            var projectedRate = scenarioLine?.ProjectedUnitRate ?? currentRate;
            var currentAmount = (currentRate * cs.AvgConsumption + (tariff?.BasicCharge ?? 0)) * 12;
            var projectedAmount = (projectedRate * cs.AvgConsumption + (scenarioLine?.ProjectedBasicCharge ?? tariff?.BasicCharge ?? 0)) * 12;
            var rebate = rebateTypes.Where(r => r.ServiceCategoryId == cs.ServiceCategoryId || r.ServiceCategoryId == null).Sum(r => r.FixedAmount ?? (projectedAmount * r.RebatePercent / 100));
            var applicableRebate = cat.Type == ConsumerType.Household ? rebate * 0.15m : 0;

            billLines.Add(new ProjectedBillLineDto(cs.ServiceCategoryId, cs.ServiceCategory.Name, currentRate, projectedRate, cs.AvgConsumption, Math.Round(currentAmount, 2), Math.Round(projectedAmount, 2), Math.Round(applicableRebate, 2), Math.Round(projectedAmount - applicableRebate, 2)));
        }

        var bill = new ProjectedBillDto(cat.Id, cat.Name, cat.Type.ToString(), billLines, billLines.Sum(l => l.CurrentAmount), billLines.Sum(l => l.ProjectedAmount), billLines.Sum(l => l.RebateAmount), billLines.Sum(l => l.NetAmount));
        return Ok(bill);
    }

    [HttpGet("revenue-projections")]
    public async Task<IActionResult> GetRevenueProjections([FromQuery] int? financialYearId, [FromQuery] string? status)
    {
        var query = _db.RevenueProjections
            .Include(r => r.ServiceCategory)
            .Include(r => r.ConsumerCategory)
            .Include(r => r.ScoaItem)
            .Include(r => r.ScoaFund)
            .Include(r => r.ScoaFunction)
            .Include(r => r.ScoaRegion)
            .Include(r => r.ScoaCosting)
            .AsQueryable();

        if (financialYearId.HasValue) query = query.Where(r => r.FinancialYearId == financialYearId);
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<BillingApprovalStatus>(status, true, out var s)) query = query.Where(r => r.Status == s);

        var projections = await query.OrderBy(r => r.ServiceCategoryId).ToListAsync();
        var dtos = projections.Select(r => new RevenueProjectionDto(r.Id, r.FinancialYearId, r.BudgetVersionId, r.ServiceCategoryId, r.ServiceCategory.Name, r.ServiceCategory.Type.ToString(), r.ConsumerCategoryId, r.ConsumerCategory?.Name, r.TariffScenarioId, r.ConsumerCount, r.AvgConsumption, r.TariffRate, r.GrossRevenue, r.RebateAmount, r.NetRevenue, r.Year1Amount, r.Year2Amount, r.Year3Amount, r.Month01, r.Month02, r.Month03, r.Month04, r.Month05, r.Month06, r.Month07, r.Month08, r.Month09, r.Month10, r.Month11, r.Month12, r.Status.ToString(), r.ScoaItem?.Code, r.ScoaFund?.Code, r.ScoaFunction?.Code, r.ScoaRegion?.Code, r.ScoaCosting?.Code)).ToList();
        return Ok(dtos);
    }

    [HttpPost("revenue-projections/calculate")]
    public async Task<IActionResult> CalculateRevenueProjections([FromBody] CalculateRevenueDto dto)
    {
        var projections = await _revenueService.CalculateProjections(dto.FinancialYearId, dto.TariffScenarioId, dto.GrowthRateY2, dto.GrowthRateY3);
        return Ok(new { count = projections.Count, totalRevenue = projections.Sum(p => p.Year1Amount) });
    }

    [HttpGet("revenue-projections/summary")]
    public async Task<IActionResult> GetRevenueProjectionSummary([FromQuery] int? financialYearId)
    {
        var fyId = financialYearId ?? (await _db.FinancialYears.FirstOrDefaultAsync(f => f.IsActive))?.Id ?? 0;
        var projections = await _db.RevenueProjections.Include(r => r.ServiceCategory).Where(r => r.FinancialYearId == fyId).ToListAsync();

        var byService = projections.GroupBy(p => p.ServiceCategoryId).Select(g =>
        {
            var svc = g.First().ServiceCategory;
            return new RevenueByServiceDto(svc.Id, svc.Name, svc.Type.ToString(), g.Sum(p => p.GrossRevenue), g.Sum(p => p.RebateAmount), g.Sum(p => p.NetRevenue), g.Sum(p => p.Year1Amount), g.Sum(p => p.Year2Amount), g.Sum(p => p.Year3Amount));
        }).ToList();

        var summary = new RevenueProjectionSummaryDto(projections.Sum(p => p.GrossRevenue), projections.Sum(p => p.RebateAmount), projections.Sum(p => p.NetRevenue), projections.Sum(p => p.Year1Amount), projections.Sum(p => p.Year2Amount), projections.Sum(p => p.Year3Amount), byService);
        return Ok(summary);
    }

    [HttpPost("revenue-projections/{id}/submit")]
    public async Task<IActionResult> SubmitRevenueProjection(int id)
    {
        var proj = await _db.RevenueProjections.FindAsync(id);
        if (proj == null) return NotFound();
        proj.Status = BillingApprovalStatus.Submitted;
        _db.BillingBudgetApprovals.Add(new BillingBudgetApproval { EntityType = "RevenueProjection", EntityId = id, ApprovalType = BillingApprovalType.RevenueProjection, Decision = ApprovalDecision.Submitted, DecidedBy = "system" });
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("revenue-projections/{id}/approve")]
    public async Task<IActionResult> ApproveRevenueProjection(int id, [FromBody] ApproveDto? dto)
    {
        var proj = await _db.RevenueProjections.FindAsync(id);
        if (proj == null) return NotFound();
        proj.Status = BillingApprovalStatus.Approved;
        proj.ApprovedBy = "CFO"; proj.ApprovedOn = DateTime.UtcNow;
        _db.BillingBudgetApprovals.Add(new BillingBudgetApproval { EntityType = "RevenueProjection", EntityId = id, ApprovalType = BillingApprovalType.RevenueProjection, Decision = ApprovalDecision.Approved, Comment = dto?.Comment, DecidedBy = "CFO" });
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("revenue-projections/submit-all")]
    public async Task<IActionResult> SubmitAllRevenueProjections([FromQuery] int financialYearId)
    {
        var projs = await _db.RevenueProjections.Where(r => r.FinancialYearId == financialYearId && r.Status == BillingApprovalStatus.Draft).ToListAsync();
        foreach (var p in projs) p.Status = BillingApprovalStatus.Submitted;
        await _db.SaveChangesAsync();
        return Ok(new { updated = projs.Count });
    }

    [HttpPost("revenue-projections/approve-all")]
    public async Task<IActionResult> ApproveAllRevenueProjections([FromQuery] int financialYearId)
    {
        var projs = await _db.RevenueProjections.Where(r => r.FinancialYearId == financialYearId && r.Status == BillingApprovalStatus.Submitted).ToListAsync();
        foreach (var p in projs) { p.Status = BillingApprovalStatus.Approved; p.ApprovedBy = "CFO"; p.ApprovedOn = DateTime.UtcNow; }
        await _db.SaveChangesAsync();
        return Ok(new { updated = projs.Count });
    }

    [HttpGet("rebate-types")]
    public async Task<IActionResult> GetRebateTypes()
    {
        var types = await _db.RebateTypes.Include(r => r.ServiceCategory).OrderBy(r => r.Category).ToListAsync();
        var dtos = types.Select(r => new RebateTypeDto(r.Id, r.Name, r.Category.ToString(), r.ServiceCategoryId, r.ServiceCategory?.Name, r.RebatePercent, r.FixedAmount, r.IsActive)).ToList();
        return Ok(dtos);
    }

    [HttpPost("rebate-types")]
    public async Task<IActionResult> CreateRebateType([FromBody] CreateRebateTypeDto dto)
    {
        if (!Enum.TryParse<RebateCategory>(dto.Category, true, out var rc)) return BadRequest("Invalid rebate category");
        var rebate = new RebateType { Name = dto.Name, Category = rc, ServiceCategoryId = dto.ServiceCategoryId, RebatePercent = dto.RebatePercent, FixedAmount = dto.FixedAmount };
        _db.RebateTypes.Add(rebate);
        await _db.SaveChangesAsync();
        return Ok(rebate.Id);
    }

    [HttpGet("rebate-projections")]
    public async Task<IActionResult> GetRebateProjections([FromQuery] int? financialYearId)
    {
        var query = _db.RebateProjections.Include(r => r.RebateType).Include(r => r.ServiceCategory).AsQueryable();
        if (financialYearId.HasValue) query = query.Where(r => r.FinancialYearId == financialYearId);

        var projections = await query.OrderBy(r => r.RebateTypeId).ToListAsync();
        var dtos = projections.Select(r => new RebateProjectionDto(r.Id, r.FinancialYearId, r.RebateTypeId, r.RebateType.Name, r.RebateType.Category.ToString(), r.ServiceCategoryId, r.ServiceCategory?.Name, r.EligibleCount, r.ProjectedUptakePercent, r.TotalRebateAmount, r.Year1Amount, r.Year2Amount, r.Year3Amount, r.Status.ToString())).ToList();
        return Ok(dtos);
    }

    [HttpPost("rebate-projections/calculate")]
    public async Task<IActionResult> CalculateRebateProjections([FromBody] CalculateRebateDto dto)
    {
        var projections = await _rebateService.CalculateProjections(dto.FinancialYearId, dto.GrowthRateY2, dto.GrowthRateY3);
        return Ok(new { count = projections.Count, totalRebates = projections.Sum(p => p.Year1Amount) });
    }

    [HttpPost("rebate-projections/{id}/submit")]
    public async Task<IActionResult> SubmitRebateProjection(int id)
    {
        var proj = await _db.RebateProjections.FindAsync(id);
        if (proj == null) return NotFound();
        proj.Status = BillingApprovalStatus.Submitted;
        _db.BillingBudgetApprovals.Add(new BillingBudgetApproval { EntityType = "RebateProjection", EntityId = id, ApprovalType = BillingApprovalType.RebateProjection, Decision = ApprovalDecision.Submitted, DecidedBy = "system" });
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("rebate-projections/{id}/approve")]
    public async Task<IActionResult> ApproveRebateProjection(int id, [FromBody] ApproveDto? dto)
    {
        var proj = await _db.RebateProjections.FindAsync(id);
        if (proj == null) return NotFound();
        proj.Status = BillingApprovalStatus.Approved;
        proj.ApprovedBy = "CFO"; proj.ApprovedOn = DateTime.UtcNow;
        _db.BillingBudgetApprovals.Add(new BillingBudgetApproval { EntityType = "RebateProjection", EntityId = id, ApprovalType = BillingApprovalType.RebateProjection, Decision = ApprovalDecision.Approved, DecidedBy = "CFO", Comment = dto?.Comment });
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("generate-budget-strings")]
    public async Task<IActionResult> GenerateBudgetStrings([FromBody] GenerateBudgetStringsDto dto)
    {
        var result = await _stringService.GenerateBudgetStrings(dto.BudgetVersionId, dto.FinancialYearId);
        return Ok(result);
    }

    [HttpGet("budget-strings")]
    public async Task<IActionResult> GetBillingBudgetStrings([FromQuery] int? versionId)
    {
        var query = _db.BudgetStrings.Where(bs => bs.SourceModule == SourceModule.BillingBudget);
        if (versionId.HasValue) query = query.Where(bs => bs.BudgetVersionId == versionId);
        var strings = await query.Include(bs => bs.ScoaItem).Include(bs => bs.ScoaFund).Include(bs => bs.ScoaFunction).Include(bs => bs.ScoaRegion).Include(bs => bs.ScoaCosting).Include(bs => bs.ScoaMsc).OrderBy(bs => bs.ScoaItemId).ToListAsync();
        return Ok(strings.Select(bs => new { bs.Id, bs.BudgetVersionId, ScoaItemCode = bs.ScoaItem.Code, ScoaItemDesc = bs.ScoaItem.Description, ScoaFundCode = bs.ScoaFund.Code, ScoaFunctionCode = bs.ScoaFunction.Code, ScoaRegionCode = bs.ScoaRegion.Code, bs.Year1Amount, bs.Year2Amount, bs.Year3Amount, bs.Description, bs.SourceModule }));
    }

    [HttpGet("draft-revenue-budget")]
    public async Task<IActionResult> GetDraftRevenueBudget([FromQuery] int? financialYearId)
    {
        var fyId = financialYearId ?? (await _db.FinancialYears.FirstOrDefaultAsync(f => f.IsActive))?.Id ?? 0;
        var projections = await _db.RevenueProjections.Include(r => r.ServiceCategory).Include(r => r.ScoaItem).Include(r => r.ScoaFund).Include(r => r.ScoaFunction).Where(r => r.FinancialYearId == fyId).ToListAsync();
        var rebateProjections = await _db.RebateProjections.Include(r => r.ServiceCategory).Where(r => r.FinancialYearId == fyId).ToListAsync();
        var billingStrings = await _db.BudgetStrings.Where(bs => bs.SourceModule == SourceModule.BillingBudget).CountAsync();

        var lines = projections.GroupBy(p => p.ServiceCategoryId).Select(g =>
        {
            var svc = g.First().ServiceCategory;
            var rebates = rebateProjections.Where(r => r.ServiceCategoryId == svc.Id).Sum(r => r.Year1Amount);
            var gross = g.Sum(p => p.GrossRevenue);
            return new DraftRevenueLineDto(svc.Id, svc.Name, svc.Type.ToString(), g.First().ScoaItem?.Code, g.First().ScoaItem?.Description, g.First().ScoaFund?.Code, g.First().ScoaFunction?.Code, gross, rebates, gross - rebates, g.Sum(p => p.Year1Amount), g.Sum(p => p.Year2Amount), g.Sum(p => p.Year3Amount));
        }).ToList();

        var totalRebates = rebateProjections.Sum(r => r.Year1Amount);
        var draft = new DraftRevenueBudgetDto(lines.Sum(l => l.GrossRevenue), totalRebates, lines.Sum(l => l.GrossRevenue) - totalRebates, lines.Sum(l => l.Year1Amount), lines.Sum(l => l.Year2Amount), lines.Sum(l => l.Year3Amount), lines, billingStrings);
        return Ok(draft);
    }

    [HttpGet("integration-status")]
    public async Task<IActionResult> GetIntegrationStatus([FromQuery] int? financialYearId)
    {
        var fyId = financialYearId ?? (await _db.FinancialYears.FirstOrDefaultAsync(f => f.IsActive))?.Id ?? 0;
        var projections = await _db.RevenueProjections.Where(r => r.FinancialYearId == fyId).ToListAsync();
        var rebates = await _db.RebateProjections.Where(r => r.FinancialYearId == fyId).ToListAsync();
        var strings = await _db.BudgetStrings.Where(bs => bs.SourceModule == SourceModule.BillingBudget).CountAsync();

        var status = new BillingIntegrationStatusDto(
            strings > 0 ? "Integrated" : projections.Any(p => p.Status == BillingApprovalStatus.Approved) ? "Ready" : "Pending",
            projections.Count(p => p.Status == BillingApprovalStatus.Approved),
            projections.Count(p => p.Status != BillingApprovalStatus.Approved),
            rebates.Count(r => r.Status == BillingApprovalStatus.Approved),
            rebates.Count(r => r.Status != BillingApprovalStatus.Approved),
            strings, strings > 0 ? DateTime.UtcNow : null);
        return Ok(status);
    }

    [HttpGet("tariff-scenarios/{id}/water-project-budget")]
    public async Task<IActionResult> GetWaterProjectBudget(int id)
    {
        // 1. Get scenario + financial year
        var scenario = await _db.TariffScenarios
            .Include(s => s.FinancialYear)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (scenario == null) return NotFound();

        var fyText = scenario.FinancialYear.YearCode; // e.g. "2025/2026"
        var startYear = fyText.Split('/')[0].Trim();   // e.g. "2025"

        // 2. Resolve correct ScoaVersion for this financial year
        var versionRow = await _db.Const_Section71_ScoaVersion_Sys
            .Where(v => v.ScoaVersionEnabled && v.ScoaVersionYearStart == startYear)
            .FirstOrDefaultAsync();
        if (versionRow == null)
            return Ok(new WaterProjectBudgetDto(fyText, "N/A", 0, 0, 0, 0, 0, new()));

        var scoaVersion = versionRow.ScoaVersionDesc!;

        // 3. Get AccountNumberLongCodes from Section71_NTMapping (Water = A4/0400)
        var longCodes = await _db.Section71_NTMapping
            .Where(m => m.A1ScheduleSheet == "A4" && m.A1ScheduleCode == "0400" && m.ScoaVersion == scoaVersion)
            .Select(m => m.AccountNumberLongCode)
            .Distinct()
            .ToListAsync();

        if (!longCodes.Any())
            return Ok(new WaterProjectBudgetDto(fyText, scoaVersion, 0, 0, 0, 0, 0, new()));

        // 4. Get ScoaIDs from Const_SCOA_Structure_Consolidated (existing entity: ConstScoaStructureConsolidated)
        var scoaRows = await _db.ConstScoaStructureConsolidated
            .Where(s => s.FinYearText == fyText && longCodes.Contains(s.ScoaCode))
            .Select(s => new { s.ScoaID, s.ScoaCode, s.ScoaDesc })
            .ToListAsync();

        var scoaIds = scoaRows.Select(s => s.ScoaID).ToList();

        if (!scoaIds.Any())
            return Ok(new WaterProjectBudgetDto(fyText, scoaVersion, longCodes.Count, 0, 0, 0, 0, new()));

        // 5. Sum budgets from Plan_ProjectItem joined with Plan_Project.
        // Prefer Plan_ProjectScoaItem.ScoaItemID (grid-editable) over Plan_ProjectItem.SCOAItemID (same logic as ProjectsController).
        var itemsRaw = await (
            from pi in _db.Plan_ProjectItem
            join pp in _db.Plan_Project on pi.ProjectID equals pp.Project_ID
            let effectiveScoaItemId = _db.Plan_ProjectScoaItem
                .Where(psi => psi.ProjectID == pi.ProjectID)
                .Select(psi => (int?)psi.ScoaItemID)
                .FirstOrDefault() ?? pi.SCOAItemID
            where scoaIds.Contains(effectiveScoaItemId)
            select new
            {
                pp.ProjectName,
                EffectiveScoaItemId = effectiveScoaItemId,
                pi.BudgetAmount,
                pi.BudgetAmountCurP1,
                pi.BudgetAmountCurP2
            }
        ).ToListAsync();

        var scoaMap = scoaRows.ToDictionary(s => s.ScoaID, s => new { s.ScoaCode, s.ScoaDesc });

        var items = itemsRaw.Select(i =>
        {
            var scoa = scoaMap.GetValueOrDefault(i.EffectiveScoaItemId);
            return new WaterProjectBudgetItemDto(
                i.ProjectName ?? "",
                scoa?.ScoaCode ?? "",
                scoa?.ScoaDesc ?? "",
                i.BudgetAmount ?? 0,
                i.BudgetAmountCurP1 ?? 0,
                i.BudgetAmountCurP2 ?? 0
            );
        }).ToList();

        var y1 = items.Sum(i => i.Year1);
        var y2 = items.Sum(i => i.Year2);
        var y3 = items.Sum(i => i.Year3);

        return Ok(new WaterProjectBudgetDto(fyText, scoaVersion, scoaIds.Count, items.Count, y1, y2, y3, items));
    }

    [HttpGet("tariff-scenarios/{id}/electricity-project-budget")]
    public async Task<IActionResult> GetElectricityProjectBudget(int id)
    {
        // 1. Get scenario + financial year
        var scenario = await _db.TariffScenarios
            .Include(s => s.FinancialYear)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (scenario == null) return NotFound();

        var fyText = scenario.FinancialYear.YearCode;
        var startYear = fyText.Split('/')[0].Trim();

        // 2. Resolve correct ScoaVersion for this financial year
        var versionRow = await _db.Const_Section71_ScoaVersion_Sys
            .Where(v => v.ScoaVersionEnabled && v.ScoaVersionYearStart == startYear)
            .FirstOrDefaultAsync();
        if (versionRow == null)
            return Ok(new ElectricityProjectBudgetDto(fyText, "N/A", 0, 0, 0, 0, 0, new()));

        var scoaVersion = versionRow.ScoaVersionDesc!;

        // 3. Get AccountNumberLongCodes from Section71_NTMapping (Electricity = A4/0300)
        var longCodes = await _db.Section71_NTMapping
            .Where(m => m.A1ScheduleSheet == "A4" && m.A1ScheduleCode == "0300" && m.ScoaVersion == scoaVersion)
            .Select(m => m.AccountNumberLongCode)
            .Distinct()
            .ToListAsync();

        if (!longCodes.Any())
            return Ok(new ElectricityProjectBudgetDto(fyText, scoaVersion, 0, 0, 0, 0, 0, new()));

        // 4. Get ScoaIDs from Const_SCOA_Structure_Consolidated
        var scoaRows = await _db.ConstScoaStructureConsolidated
            .Where(s => s.FinYearText == fyText && longCodes.Contains(s.ScoaCode))
            .Select(s => new { s.ScoaID, s.ScoaCode, s.ScoaDesc })
            .Distinct()
            .ToListAsync();

        var scoaIds = scoaRows.Select(s => s.ScoaID).Distinct().ToList();

        if (!scoaIds.Any())
            return Ok(new ElectricityProjectBudgetDto(fyText, scoaVersion, longCodes.Count, 0, 0, 0, 0, new()));

        // 5. Sum budgets — prefer Plan_ProjectScoaItem.ScoaItemID over Plan_ProjectItem.SCOAItemID
        var itemsRaw = await (
            from pi in _db.Plan_ProjectItem
            join pp in _db.Plan_Project on pi.ProjectID equals pp.Project_ID
            let effectiveScoaItemId = _db.Plan_ProjectScoaItem
                .Where(psi => psi.ProjectID == pi.ProjectID)
                .Select(psi => (int?)psi.ScoaItemID)
                .FirstOrDefault() ?? pi.SCOAItemID
            where scoaIds.Contains(effectiveScoaItemId)
            select new
            {
                pp.ProjectName,
                EffectiveScoaItemId = effectiveScoaItemId,
                pi.BudgetAmount,
                pi.BudgetAmountCurP1,
                pi.BudgetAmountCurP2
            }
        ).ToListAsync();

        var scoaMap = scoaRows
            .GroupBy(s => s.ScoaID)
            .ToDictionary(g => g.Key, g => new { g.First().ScoaCode, g.First().ScoaDesc });

        var items = itemsRaw.Select(i =>
        {
            var scoa = scoaMap.GetValueOrDefault(i.EffectiveScoaItemId);
            return new ElectricityProjectBudgetItemDto(
                i.ProjectName ?? "",
                scoa?.ScoaCode ?? "",
                scoa?.ScoaDesc ?? "",
                i.BudgetAmount ?? 0,
                i.BudgetAmountCurP1 ?? 0,
                i.BudgetAmountCurP2 ?? 0
            );
        }).ToList();

        var y1 = items.Sum(i => i.Year1);
        var y2 = items.Sum(i => i.Year2);
        var y3 = items.Sum(i => i.Year3);

        return Ok(new ElectricityProjectBudgetDto(fyText, scoaVersion, scoaIds.Count, items.Count, y1, y2, y3, items));
    }

    [HttpGet("tariff-scenarios/{id}/sanitation-project-budget")]
    public async Task<IActionResult> GetSanitationProjectBudget(int id)
    {
        var scenario = await _db.TariffScenarios
            .Include(s => s.FinancialYear)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (scenario == null) return NotFound();

        var fyText = scenario.FinancialYear.YearCode;
        var startYear = fyText.Split('/')[0].Trim();

        var versionRow = await _db.Const_Section71_ScoaVersion_Sys
            .Where(v => v.ScoaVersionEnabled && v.ScoaVersionYearStart == startYear)
            .FirstOrDefaultAsync();
        if (versionRow == null)
            return Ok(new SanitationProjectBudgetDto(fyText, "N/A", 0, 0, 0, 0, 0, new()));

        var scoaVersion = versionRow.ScoaVersionDesc!;

        // Sanitation = A4/0500
        var longCodes = await _db.Section71_NTMapping
            .Where(m => m.A1ScheduleSheet == "A4" && m.A1ScheduleCode == "0500" && m.ScoaVersion == scoaVersion)
            .Select(m => m.AccountNumberLongCode)
            .Distinct()
            .ToListAsync();

        if (!longCodes.Any())
            return Ok(new SanitationProjectBudgetDto(fyText, scoaVersion, 0, 0, 0, 0, 0, new()));

        var scoaRows = await _db.ConstScoaStructureConsolidated
            .Where(s => s.FinYearText == fyText && longCodes.Contains(s.ScoaCode))
            .Select(s => new { s.ScoaID, s.ScoaCode, s.ScoaDesc })
            .Distinct()
            .ToListAsync();

        var scoaIds = scoaRows.Select(s => s.ScoaID).Distinct().ToList();

        if (!scoaIds.Any())
            return Ok(new SanitationProjectBudgetDto(fyText, scoaVersion, longCodes.Count, 0, 0, 0, 0, new()));

        var itemsRaw = await (
            from pi in _db.Plan_ProjectItem
            join pp in _db.Plan_Project on pi.ProjectID equals pp.Project_ID
            let effectiveScoaItemId = _db.Plan_ProjectScoaItem
                .Where(psi => psi.ProjectID == pi.ProjectID)
                .Select(psi => (int?)psi.ScoaItemID)
                .FirstOrDefault() ?? pi.SCOAItemID
            where scoaIds.Contains(effectiveScoaItemId)
            select new
            {
                pp.ProjectName,
                EffectiveScoaItemId = effectiveScoaItemId,
                pi.BudgetAmount,
                pi.BudgetAmountCurP1,
                pi.BudgetAmountCurP2
            }
        ).ToListAsync();

        var scoaMap = scoaRows
            .GroupBy(s => s.ScoaID)
            .ToDictionary(g => g.Key, g => new { g.First().ScoaCode, g.First().ScoaDesc });

        var items = itemsRaw.Select(i =>
        {
            var scoa = scoaMap.GetValueOrDefault(i.EffectiveScoaItemId);
            return new SanitationProjectBudgetItemDto(
                i.ProjectName ?? "",
                scoa?.ScoaCode ?? "",
                scoa?.ScoaDesc ?? "",
                i.BudgetAmount ?? 0,
                i.BudgetAmountCurP1 ?? 0,
                i.BudgetAmountCurP2 ?? 0
            );
        }).ToList();

        var y1 = items.Sum(i => i.Year1);
        var y2 = items.Sum(i => i.Year2);
        var y3 = items.Sum(i => i.Year3);

        return Ok(new SanitationProjectBudgetDto(fyText, scoaVersion, scoaIds.Count, items.Count, y1, y2, y3, items));
    }

    [HttpGet("tariff-scenarios/{id}/refuse-project-budget")]
    public async Task<IActionResult> GetRefuseProjectBudget(int id)
    {
        var scenario = await _db.TariffScenarios
            .Include(s => s.FinancialYear)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (scenario == null) return NotFound();

        var fyText = scenario.FinancialYear.YearCode;
        var startYear = fyText.Split('/')[0].Trim();

        var versionRow = await _db.Const_Section71_ScoaVersion_Sys
            .Where(v => v.ScoaVersionEnabled && v.ScoaVersionYearStart == startYear)
            .FirstOrDefaultAsync();
        if (versionRow == null)
            return Ok(new RefuseProjectBudgetDto(fyText, "N/A", 0, 0, 0, 0, 0, new()));

        var scoaVersion = versionRow.ScoaVersionDesc!;

        // Refuse = A4/0600
        var longCodes = await _db.Section71_NTMapping
            .Where(m => m.A1ScheduleSheet == "A4" && m.A1ScheduleCode == "0600" && m.ScoaVersion == scoaVersion)
            .Select(m => m.AccountNumberLongCode)
            .Distinct()
            .ToListAsync();

        if (!longCodes.Any())
            return Ok(new RefuseProjectBudgetDto(fyText, scoaVersion, 0, 0, 0, 0, 0, new()));

        var scoaRows = await _db.ConstScoaStructureConsolidated
            .Where(s => s.FinYearText == fyText && longCodes.Contains(s.ScoaCode))
            .Select(s => new { s.ScoaID, s.ScoaCode, s.ScoaDesc })
            .Distinct()
            .ToListAsync();

        var scoaIds = scoaRows.Select(s => s.ScoaID).Distinct().ToList();

        if (!scoaIds.Any())
            return Ok(new RefuseProjectBudgetDto(fyText, scoaVersion, longCodes.Count, 0, 0, 0, 0, new()));

        var itemsRaw = await (
            from pi in _db.Plan_ProjectItem
            join pp in _db.Plan_Project on pi.ProjectID equals pp.Project_ID
            let effectiveScoaItemId = _db.Plan_ProjectScoaItem
                .Where(psi => psi.ProjectID == pi.ProjectID)
                .Select(psi => (int?)psi.ScoaItemID)
                .FirstOrDefault() ?? pi.SCOAItemID
            where scoaIds.Contains(effectiveScoaItemId)
            select new
            {
                pp.ProjectName,
                EffectiveScoaItemId = effectiveScoaItemId,
                pi.BudgetAmount,
                pi.BudgetAmountCurP1,
                pi.BudgetAmountCurP2
            }
        ).ToListAsync();

        var scoaMap = scoaRows
            .GroupBy(s => s.ScoaID)
            .ToDictionary(g => g.Key, g => new { g.First().ScoaCode, g.First().ScoaDesc });

        var items = itemsRaw.Select(i =>
        {
            var scoa = scoaMap.GetValueOrDefault(i.EffectiveScoaItemId);
            return new RefuseProjectBudgetItemDto(
                i.ProjectName ?? "",
                scoa?.ScoaCode ?? "",
                scoa?.ScoaDesc ?? "",
                i.BudgetAmount ?? 0,
                i.BudgetAmountCurP1 ?? 0,
                i.BudgetAmountCurP2 ?? 0
            );
        }).ToList();

        var y1 = items.Sum(i => i.Year1);
        var y2 = items.Sum(i => i.Year2);
        var y3 = items.Sum(i => i.Year3);

        return Ok(new RefuseProjectBudgetDto(fyText, scoaVersion, scoaIds.Count, items.Count, y1, y2, y3, items));
    }

    [HttpGet("tariff-scenarios/{id}/property-rates-project-budget")]
    public async Task<IActionResult> GetPropertyRatesProjectBudget(int id)
    {
        var scenario = await _db.TariffScenarios
            .Include(s => s.FinancialYear)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (scenario == null) return NotFound();

        var fyText = scenario.FinancialYear.YearCode;
        var startYear = fyText.Split('/')[0].Trim();

        var versionRow = await _db.Const_Section71_ScoaVersion_Sys
            .Where(v => v.ScoaVersionEnabled && v.ScoaVersionYearStart == startYear)
            .FirstOrDefaultAsync();
        if (versionRow == null)
            return Ok(new PropertyRatesProjectBudgetDto(fyText, "N/A", 0, 0, 0, 0, 0, new()));

        var scoaVersion = versionRow.ScoaVersionDesc!;

        // Property Rates = A4/1800
        var longCodes = await _db.Section71_NTMapping
            .Where(m => m.A1ScheduleSheet == "A4" && m.A1ScheduleCode == "1800" && m.ScoaVersion == scoaVersion)
            .Select(m => m.AccountNumberLongCode)
            .Distinct()
            .ToListAsync();

        if (!longCodes.Any())
            return Ok(new PropertyRatesProjectBudgetDto(fyText, scoaVersion, 0, 0, 0, 0, 0, new()));

        var scoaRows = await _db.ConstScoaStructureConsolidated
            .Where(s => s.FinYearText == fyText && longCodes.Contains(s.ScoaCode))
            .Select(s => new { s.ScoaID, s.ScoaCode, s.ScoaDesc })
            .Distinct()
            .ToListAsync();

        var scoaIds = scoaRows.Select(s => s.ScoaID).Distinct().ToList();

        if (!scoaIds.Any())
            return Ok(new PropertyRatesProjectBudgetDto(fyText, scoaVersion, longCodes.Count, 0, 0, 0, 0, new()));

        var itemsRaw = await (
            from pi in _db.Plan_ProjectItem
            join pp in _db.Plan_Project on pi.ProjectID equals pp.Project_ID
            let effectiveScoaItemId = _db.Plan_ProjectScoaItem
                .Where(psi => psi.ProjectID == pi.ProjectID)
                .Select(psi => (int?)psi.ScoaItemID)
                .FirstOrDefault() ?? pi.SCOAItemID
            where scoaIds.Contains(effectiveScoaItemId)
            select new
            {
                pp.ProjectName,
                EffectiveScoaItemId = effectiveScoaItemId,
                pi.BudgetAmount,
                pi.BudgetAmountCurP1,
                pi.BudgetAmountCurP2
            }
        ).ToListAsync();

        var scoaMap = scoaRows
            .GroupBy(s => s.ScoaID)
            .ToDictionary(g => g.Key, g => new { g.First().ScoaCode, g.First().ScoaDesc });

        var items = itemsRaw.Select(i =>
        {
            var scoa = scoaMap.GetValueOrDefault(i.EffectiveScoaItemId);
            return new PropertyRatesProjectBudgetItemDto(
                i.ProjectName ?? "",
                scoa?.ScoaCode ?? "",
                scoa?.ScoaDesc ?? "",
                i.BudgetAmount ?? 0,
                i.BudgetAmountCurP1 ?? 0,
                i.BudgetAmountCurP2 ?? 0
            );
        }).ToList();

        var y1 = items.Sum(i => i.Year1);
        var y2 = items.Sum(i => i.Year2);
        var y3 = items.Sum(i => i.Year3);

        return Ok(new PropertyRatesProjectBudgetDto(fyText, scoaVersion, scoaIds.Count, items.Count, y1, y2, y3, items));
    }
}

public record ApproveDto(string? Comment);
