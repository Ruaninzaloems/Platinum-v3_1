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

        var scenarios = await query.OrderByDescending(s => s.CreatedOn)
            .Select(s => new TariffScenarioSummaryDto(s.Id, s.Name, s.Status.ToString(), s.BaseIncreasePercentage,
                s.Lines.Sum(l => l.CurrentRevenue), s.Lines.Sum(l => l.ProjectedRevenue),
                s.Lines.Sum(l => l.VarianceAmount), s.Lines.Count, s.CreatedOn))
            .ToListAsync();
        return Ok(scenarios);
    }

    [HttpPost("tariff-scenarios")]
    public async Task<IActionResult> CreateTariffScenario([FromBody] CreateTariffScenarioDto dto)
    {
        var scenario = await _tariffService.CreateScenarioWithLines(dto.Name, dto.Description, dto.FinancialYearId, dto.BaseIncreasePercentage, dto.Justification, dto.ServiceCategoryIds);
        return Ok(scenario.Id);
    }

    [HttpGet("tariff-scenarios/{id}")]
    public async Task<IActionResult> GetTariffScenario(int id)
    {
        var s = await _db.TariffScenarios
            .Include(s => s.Lines).ThenInclude(l => l.ServiceCategory)
            .Include(s => s.FinancialYear)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (s == null) return NotFound();

        var dto = new TariffScenarioDto(s.Id, s.Name, s.Description, s.FinancialYearId, s.FinancialYear.YearCode, s.Status.ToString(), s.BaseIncreasePercentage, s.Justification, s.CreatedBy, s.CreatedOn, s.ApprovedBy, s.ApprovedOn,
            s.Lines.Select(l => new TariffScenarioLineDto(l.Id, l.ServiceCategoryId, l.ServiceCategory.Name, l.ServiceCategory.Type.ToString(), l.BaseTariffId, l.CurrentUnitRate, l.CurrentBasicCharge, l.ProjectedUnitRate, l.ProjectedBasicCharge, l.IncreasePercent, l.CurrentRevenue, l.ProjectedRevenue, l.VarianceAmount, l.VariancePercent, l.IsMaterialShift)).ToList());
        return Ok(dto);
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

    [HttpGet("tariff-scenarios/compare")]
    public async Task<IActionResult> CompareScenarios([FromQuery] string ids)
    {
        var idList = ids.Split(',').Select(int.Parse).ToList();
        var scenarios = await _db.TariffScenarios.Include(s => s.Lines).ThenInclude(l => l.ServiceCategory).Where(s => idList.Contains(s.Id)).ToListAsync();

        var entries = scenarios.Select(s => new ScenarioComparisonEntry(s.Id, s.Name, s.BaseIncreasePercentage,
            s.Lines.Sum(l => l.CurrentRevenue), s.Lines.Sum(l => l.ProjectedRevenue), s.Lines.Sum(l => l.VarianceAmount),
            s.Lines.Sum(l => l.CurrentRevenue) != 0 ? s.Lines.Sum(l => l.VarianceAmount) / s.Lines.Sum(l => l.CurrentRevenue) * 100 : 0)).ToList();

        var allServiceIds = scenarios.SelectMany(s => s.Lines).Select(l => l.ServiceCategoryId).Distinct();
        var serviceRows = allServiceIds.Select(svcId =>
        {
            var svcName = scenarios.SelectMany(s => s.Lines).First(l => l.ServiceCategoryId == svcId).ServiceCategory.Name;
            var current = scenarios.First().Lines.FirstOrDefault(l => l.ServiceCategoryId == svcId)?.CurrentRevenue ?? 0;
            var scenarioRevenues = scenarios.Select(s =>
            {
                var line = s.Lines.FirstOrDefault(l => l.ServiceCategoryId == svcId);
                return new ScenarioRevenueEntry(s.Id, s.Name, line?.ProjectedRevenue ?? 0, line?.VarianceAmount ?? 0, line?.VariancePercent ?? 0);
            }).ToList();
            return new ServiceComparisonRow(svcId, svcName, current, scenarioRevenues);
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
}

public record ApproveDto(string? Comment);
