using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.DTOs;
using PlatinumBudget.Api.Models;
using PlatinumBudget.Api.Services;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/creditors")]
public class CreditorsBudgetController : ControllerBase
{
    private readonly BudgetDbContext _db;
    private readonly ExpenditureModellingService _modellingService;
    private readonly ExpenditureProjectionService _projectionService;
    private readonly CreditorLiabilityService _liabilityService;
    private readonly CreditorsBudgetStringService _stringService;
    private readonly AuditService _audit;

    public CreditorsBudgetController(BudgetDbContext db, ExpenditureModellingService modellingService, ExpenditureProjectionService projectionService, CreditorLiabilityService liabilityService, CreditorsBudgetStringService stringService, AuditService audit)
    {
        _db = db;
        _modellingService = modellingService;
        _projectionService = projectionService;
        _liabilityService = liabilityService;
        _stringService = stringService;
        _audit = audit;
    }

    [HttpGet("expenditure-categories")]
    public async Task<IActionResult> GetExpenditureCategories()
    {
        var categories = await _db.ExpenditureCategories
            .Include(e => e.CostItems)
            .OrderBy(e => e.Code)
            .Select(e => new ExpenditureCategoryDto(e.Id, e.Code, e.Name, e.Type.ToString(), e.Department, e.MeasurementUnit, e.IsActive, e.CostItems.Count))
            .ToListAsync();
        return Ok(categories);
    }

    [HttpPost("expenditure-categories")]
    public async Task<IActionResult> CreateExpenditureCategory([FromBody] CreateExpenditureCategoryDto dto)
    {
        if (!Enum.TryParse<ExpenditureCategoryType>(dto.Type, true, out var t)) return BadRequest("Invalid expenditure category type");
        var cat = new ExpenditureCategory { Code = dto.Code, Name = dto.Name, Type = t, Department = dto.Department, MeasurementUnit = dto.MeasurementUnit };
        _db.ExpenditureCategories.Add(cat);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("ExpenditureCategory", cat.Id, "Created", "system", $"Category '{dto.Name}' created");
        return Ok(cat.Id);
    }

    [HttpGet("cost-items")]
    public async Task<IActionResult> GetCostItems([FromQuery] int? expenditureCategoryId, [FromQuery] string? itemType, [FromQuery] int? financialYearId)
    {
        var query = _db.CostItems.Include(ci => ci.ExpenditureCategory).AsQueryable();
        if (expenditureCategoryId.HasValue) query = query.Where(ci => ci.ExpenditureCategoryId == expenditureCategoryId);
        if (!string.IsNullOrEmpty(itemType) && Enum.TryParse<CostItemType>(itemType, true, out var cit)) query = query.Where(ci => ci.ItemType == cit);
        if (financialYearId.HasValue) query = query.Where(ci => ci.FinancialYearId == financialYearId);

        var items = await query.OrderBy(ci => ci.ExpenditureCategoryId).ThenBy(ci => ci.Name)
            .Select(ci => new CostItemDto(ci.Id, ci.ExpenditureCategoryId, ci.ExpenditureCategory.Name, ci.Name, ci.ItemType.ToString(), ci.BasicCost, ci.UnitRate, ci.VatIndicator.ToString(), ci.BlockStart, ci.BlockEnd, ci.EffectiveFrom, ci.EffectiveTo, ci.IsApproved, ci.FinancialYearId, ci.SupplierName, ci.SupplierVatNumber, ci.ContractReference, ci.IsVariabilityFlagged, ci.VariabilityType))
            .ToListAsync();
        return Ok(items);
    }

    [HttpPost("cost-items")]
    public async Task<IActionResult> CreateCostItem([FromBody] CreateCostItemDto dto)
    {
        if (!Enum.TryParse<CostItemType>(dto.ItemType, true, out var cit)) return BadRequest("Invalid cost item type");
        if (!Enum.TryParse<VatIndicator>(dto.VatIndicator, true, out var vi)) return BadRequest("Invalid VAT indicator");

        var item = new CostItem
        {
            ExpenditureCategoryId = dto.ExpenditureCategoryId, Name = dto.Name,
            ItemType = cit, BasicCost = dto.BasicCost, UnitRate = dto.UnitRate,
            VatIndicator = vi, BlockStart = dto.BlockStart, BlockEnd = dto.BlockEnd,
            EffectiveFrom = dto.EffectiveFrom, EffectiveTo = dto.EffectiveTo,
            FinancialYearId = dto.FinancialYearId, IsApproved = true,
            SupplierName = dto.SupplierName, SupplierVatNumber = dto.SupplierVatNumber,
            ContractReference = dto.ContractReference,
            IsVariabilityFlagged = dto.IsVariabilityFlagged, VariabilityType = dto.VariabilityType
        };
        _db.CostItems.Add(item);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("CostItem", item.Id, "Created", "system", $"Cost item '{dto.Name}' created");
        return Ok(item.Id);
    }

    [HttpPut("cost-items/{id}")]
    public async Task<IActionResult> UpdateCostItem(int id, [FromBody] UpdateCostItemDto dto)
    {
        var item = await _db.CostItems.FindAsync(id);
        if (item == null) return NotFound();
        if (dto.Name != null) item.Name = dto.Name;
        if (dto.BasicCost.HasValue) item.BasicCost = dto.BasicCost.Value;
        if (dto.UnitRate.HasValue) item.UnitRate = dto.UnitRate.Value;
        if (dto.IsApproved.HasValue) item.IsApproved = dto.IsApproved.Value;
        if (dto.SupplierName != null) item.SupplierName = dto.SupplierName;
        if (dto.ContractReference != null) item.ContractReference = dto.ContractReference;
        if (dto.IsVariabilityFlagged.HasValue) item.IsVariabilityFlagged = dto.IsVariabilityFlagged.Value;
        if (dto.VariabilityType != null) item.VariabilityType = dto.VariabilityType;
        if (dto.ItemType != null && Enum.TryParse<CostItemType>(dto.ItemType, true, out var cit)) item.ItemType = cit;
        if (dto.VatIndicator != null && Enum.TryParse<VatIndicator>(dto.VatIndicator, true, out var vi)) item.VatIndicator = vi;
        if (dto.EffectiveFrom.HasValue) item.EffectiveFrom = dto.EffectiveFrom.Value;
        if (dto.EffectiveTo.HasValue) item.EffectiveTo = dto.EffectiveTo;
        item.ModifiedBy = "system"; item.ModifiedOn = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpGet("expenditure-scenarios")]
    public async Task<IActionResult> GetExpenditureScenarios([FromQuery] int? financialYearId)
    {
        var query = _db.ExpenditureScenarios.Include(s => s.Lines).Include(s => s.FinancialYear).AsQueryable();
        if (financialYearId.HasValue) query = query.Where(s => s.FinancialYearId == financialYearId);

        var scenarios = await query.OrderByDescending(s => s.CreatedOn)
            .Select(s => new ExpenditureScenarioSummaryDto(s.Id, s.Name, s.Status.ToString(), s.BaseInflationPercent,
                s.Lines.Sum(l => l.CurrentExpenditure), s.Lines.Sum(l => l.ProjectedExpenditure),
                s.Lines.Sum(l => l.VarianceAmount), s.Lines.Count, s.CreatedOn))
            .ToListAsync();
        return Ok(scenarios);
    }

    [HttpPost("expenditure-scenarios")]
    public async Task<IActionResult> CreateExpenditureScenario([FromBody] CreateExpenditureScenarioDto dto)
    {
        var scenario = await _modellingService.CreateScenarioWithLines(dto.Name, dto.Description, dto.FinancialYearId, dto.BaseInflationPercent, dto.DemandAdjustmentPercent, dto.Justification, dto.ExpenditureCategoryIds);
        return Ok(scenario.Id);
    }

    [HttpGet("expenditure-scenarios/{id}")]
    public async Task<IActionResult> GetExpenditureScenario(int id)
    {
        var s = await _db.ExpenditureScenarios
            .Include(s => s.Lines).ThenInclude(l => l.ExpenditureCategory)
            .Include(s => s.FinancialYear)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (s == null) return NotFound();

        var dto = new ExpenditureScenarioDto(s.Id, s.Name, s.Description, s.FinancialYearId, s.FinancialYear.YearCode, s.Status.ToString(), s.BaseInflationPercent, s.DemandAdjustmentPercent, s.Justification, s.CreatedBy, s.CreatedOn, s.ApprovedBy, s.ApprovedOn,
            s.Lines.Select(l => new ExpenditureScenarioLineDto(l.Id, l.ExpenditureCategoryId, l.ExpenditureCategory.Name, l.ExpenditureCategory.Type.ToString(), l.BaseCostItemId, l.CurrentUnitRate, l.CurrentBasicCost, l.ProjectedUnitRate, l.ProjectedBasicCost, l.InflationPercent, l.DemandAdjustmentPercent, l.CurrentExpenditure, l.ProjectedExpenditure, l.VarianceAmount, l.VariancePercent, l.IsMaterialShift)).ToList());
        return Ok(dto);
    }

    [HttpPost("expenditure-scenarios/{id}/calculate")]
    public async Task<IActionResult> CalculateScenario(int id)
    {
        var scenario = await _db.ExpenditureScenarios.Include(s => s.Lines).FirstOrDefaultAsync(s => s.Id == id);
        if (scenario == null) return NotFound();
        await _modellingService.CalculateScenarioLines(scenario);
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("expenditure-scenarios/{id}/submit")]
    public async Task<IActionResult> SubmitScenario(int id)
    {
        var scenario = await _db.ExpenditureScenarios.FindAsync(id);
        if (scenario == null) return NotFound();
        scenario.Status = CreditorApprovalStatus.Submitted;
        _db.CreditorsBudgetApprovals.Add(new CreditorsBudgetApproval { EntityType = "ExpenditureScenario", EntityId = id, ApprovalType = CreditorApprovalType.Submit, Decision = ApprovalDecision.Submitted, DecidedBy = "system" });
        await _db.SaveChangesAsync();
        await _audit.LogAsync("ExpenditureScenario", id, "Submitted", "system", "Scenario submitted for approval");
        return Ok();
    }

    [HttpPost("expenditure-scenarios/{id}/approve")]
    public async Task<IActionResult> ApproveScenario(int id, [FromBody] ApproveDto? dto)
    {
        var scenario = await _db.ExpenditureScenarios.FindAsync(id);
        if (scenario == null) return NotFound();
        scenario.Status = CreditorApprovalStatus.Approved;
        scenario.ApprovedBy = "CFO"; scenario.ApprovedOn = DateTime.UtcNow;
        _db.CreditorsBudgetApprovals.Add(new CreditorsBudgetApproval { EntityType = "ExpenditureScenario", EntityId = id, ApprovalType = CreditorApprovalType.Approve, Decision = ApprovalDecision.Approved, Comment = dto?.Comment, DecidedBy = "CFO" });
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpGet("expenditure-scenarios/compare")]
    public async Task<IActionResult> CompareScenarios([FromQuery] string ids)
    {
        var idList = ids.Split(',').Select(int.Parse).ToList();
        var scenarios = await _db.ExpenditureScenarios.Include(s => s.Lines).ThenInclude(l => l.ExpenditureCategory).Where(s => idList.Contains(s.Id)).ToListAsync();

        var entries = scenarios.Select(s => new ExpScenarioComparisonEntry(s.Id, s.Name, s.BaseInflationPercent,
            s.Lines.Sum(l => l.CurrentExpenditure), s.Lines.Sum(l => l.ProjectedExpenditure), s.Lines.Sum(l => l.VarianceAmount),
            s.Lines.Sum(l => l.CurrentExpenditure) != 0 ? s.Lines.Sum(l => l.VarianceAmount) / s.Lines.Sum(l => l.CurrentExpenditure) * 100 : 0)).ToList();

        var allCategoryIds = scenarios.SelectMany(s => s.Lines).Select(l => l.ExpenditureCategoryId).Distinct();
        var categoryRows = allCategoryIds.Select(catId =>
        {
            var catName = scenarios.SelectMany(s => s.Lines).First(l => l.ExpenditureCategoryId == catId).ExpenditureCategory.Name;
            var current = scenarios.First().Lines.FirstOrDefault(l => l.ExpenditureCategoryId == catId)?.CurrentExpenditure ?? 0;
            var scenarioExpenditures = scenarios.Select(s =>
            {
                var line = s.Lines.FirstOrDefault(l => l.ExpenditureCategoryId == catId);
                return new ScenarioExpenditureEntry(s.Id, s.Name, line?.ProjectedExpenditure ?? 0, line?.VarianceAmount ?? 0, line?.VariancePercent ?? 0);
            }).ToList();
            return new CategoryComparisonRow(catId, catName, current, scenarioExpenditures);
        }).ToList();

        return Ok(new ExpenditureScenarioComparisonDto(entries, categoryRows));
    }

    [HttpGet("creditor-categories")]
    public async Task<IActionResult> GetCreditorCategories()
    {
        var categories = await _db.CreditorCategories
            .Include(c => c.CreditorItems).ThenInclude(ci => ci.ExpenditureCategory)
            .OrderBy(c => c.Name)
            .ToListAsync();

        var dtos = categories.Select(c => new CreditorCategoryDto(c.Id, c.Name, c.Type.ToString(), c.PaymentTermDays, c.InterestRate, c.ChargesInterest, c.InterestCalculationMethod, c.IsActive,
            c.CreditorItems.Select(ci => new CreditorCategoryItemDto(ci.Id, ci.CreditorCategoryId, ci.ExpenditureCategoryId, ci.ExpenditureCategory.Name, ci.PaymentRate30Days, ci.PaymentRate60Days, ci.PaymentRate90Days, ci.PaymentRateOver90Days)).ToList())).ToList();
        return Ok(dtos);
    }

    [HttpPost("creditor-categories")]
    public async Task<IActionResult> CreateCreditorCategory([FromBody] CreateCreditorCategoryDto dto)
    {
        if (!Enum.TryParse<CreditorCategoryType>(dto.Type, true, out var t)) return BadRequest("Invalid creditor category type");
        var cat = new CreditorCategory { Name = dto.Name, Type = t, PaymentTermDays = dto.PaymentTermDays, InterestRate = dto.InterestRate, ChargesInterest = dto.ChargesInterest, InterestCalculationMethod = dto.InterestCalculationMethod };
        _db.CreditorCategories.Add(cat);
        await _db.SaveChangesAsync();
        return Ok(cat.Id);
    }

    [HttpPost("creditor-category-items")]
    public async Task<IActionResult> CreateCreditorCategoryItem([FromBody] CreateCreditorCategoryItemDto dto)
    {
        var item = new CreditorCategoryItem { CreditorCategoryId = dto.CreditorCategoryId, ExpenditureCategoryId = dto.ExpenditureCategoryId, PaymentRate30Days = dto.PaymentRate30Days, PaymentRate60Days = dto.PaymentRate60Days, PaymentRate90Days = dto.PaymentRate90Days, PaymentRateOver90Days = dto.PaymentRateOver90Days };
        _db.CreditorCategoryItems.Add(item);
        await _db.SaveChangesAsync();
        return Ok(item.Id);
    }

    [HttpGet("payment-arrangements")]
    public async Task<IActionResult> GetPaymentArrangements()
    {
        var arrangements = await _db.CreditorPaymentArrangements
            .Include(pa => pa.ExpenditureCategory)
            .OrderBy(pa => pa.CreditorName)
            .Select(pa => new CreditorPaymentArrangementDto(pa.Id, pa.CreditorName, pa.ReferenceNumber, pa.TotalOutstanding, pa.InstalmentAmount, pa.PaymentIntervalDays, pa.RemainingBalance, pa.InterestRate, pa.ArrangementStatus.ToString(), pa.StartDate, pa.EndDate, pa.ExpenditureCategoryId, pa.ExpenditureCategory != null ? pa.ExpenditureCategory.Name : null))
            .ToListAsync();
        return Ok(arrangements);
    }

    [HttpGet("age-analysis")]
    public async Task<IActionResult> GetAgeAnalysis()
    {
        var categories = await _db.CreditorCategories
            .Include(c => c.CreditorItems).ThenInclude(ci => ci.ExpenditureCategory)
            .ToListAsync();

        var liabilities = await _db.CreditorLiabilities.ToListAsync();

        var analysis = categories.SelectMany(c => c.CreditorItems).GroupBy(ci => ci.ExpenditureCategory.Name).Select(g =>
        {
            var totalLiab = liabilities.Where(l => l.ExpenditureCategoryId == g.First().ExpenditureCategoryId).Sum(l => l.ClosingBalance);
            var rates = g.First();
            return new AgeAnalysisDto(g.Key,
                totalLiab * rates.PaymentRate30Days / 100,
                totalLiab * rates.PaymentRate60Days / 100,
                totalLiab * rates.PaymentRate90Days / 100,
                totalLiab * rates.PaymentRateOver90Days / 100,
                totalLiab);
        }).ToList();
        return Ok(analysis);
    }

    [HttpGet("expenditure-projections")]
    public async Task<IActionResult> GetExpenditureProjections([FromQuery] int? financialYearId, [FromQuery] string? status)
    {
        var query = _db.ExpenditureProjections
            .Include(p => p.ExpenditureCategory)
            .Include(p => p.CostItem)
            .Include(p => p.ScoaItem)
            .Include(p => p.ScoaFund)
            .Include(p => p.ScoaFunction)
            .Include(p => p.ScoaRegion)
            .Include(p => p.ScoaCosting)
            .AsQueryable();

        if (financialYearId.HasValue) query = query.Where(p => p.FinancialYearId == financialYearId);
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<CreditorApprovalStatus>(status, true, out var s)) query = query.Where(p => p.Status == s);

        var projections = await query.OrderBy(p => p.ExpenditureCategoryId).ToListAsync();
        var dtos = projections.Select(p => new ExpenditureProjectionDto(p.Id, p.FinancialYearId, p.BudgetVersionId, p.ExpenditureCategoryId, p.ExpenditureCategory.Name, p.ExpenditureCategory.Type.ToString(), p.CostItemId, p.CostItem?.Name, p.ExpenditureScenarioId, p.UnitRate, p.BasicCost, p.GrossExpenditure, p.VatAmount, p.NetExpenditure, p.Year1Amount, p.Year2Amount, p.Year3Amount, p.Month01, p.Month02, p.Month03, p.Month04, p.Month05, p.Month06, p.Month07, p.Month08, p.Month09, p.Month10, p.Month11, p.Month12, p.Status.ToString(), p.ScoaItem?.Code, p.ScoaFund?.Code, p.ScoaFunction?.Code, p.ScoaRegion?.Code, p.ScoaCosting?.Code)).ToList();
        return Ok(dtos);
    }

    [HttpPost("expenditure-projections/calculate")]
    public async Task<IActionResult> CalculateExpenditureProjections([FromBody] CalculateExpenditureDto dto)
    {
        var projections = await _projectionService.CalculateProjections(dto.FinancialYearId, dto.ExpenditureScenarioId, dto.GrowthRateY2, dto.GrowthRateY3);
        return Ok(new { count = projections.Count, totalExpenditure = projections.Sum(p => p.Year1Amount) });
    }

    [HttpGet("expenditure-projections/summary")]
    public async Task<IActionResult> GetExpenditureProjectionSummary([FromQuery] int? financialYearId)
    {
        var fyId = financialYearId ?? (await _db.FinancialYears.FirstOrDefaultAsync(f => f.IsActive))?.Id ?? 0;
        var projections = await _db.ExpenditureProjections.Include(p => p.ExpenditureCategory).Where(p => p.FinancialYearId == fyId).ToListAsync();

        var byCategory = projections.GroupBy(p => p.ExpenditureCategoryId).Select(g =>
        {
            var cat = g.First().ExpenditureCategory;
            return new ExpenditureByCategoryDto(cat.Id, cat.Name, cat.Type.ToString(), g.Sum(p => p.GrossExpenditure), g.Sum(p => p.VatAmount), g.Sum(p => p.NetExpenditure), g.Sum(p => p.Year1Amount), g.Sum(p => p.Year2Amount), g.Sum(p => p.Year3Amount));
        }).ToList();

        var summary = new ExpenditureProjectionSummaryDto(projections.Sum(p => p.GrossExpenditure), projections.Sum(p => p.VatAmount), projections.Sum(p => p.NetExpenditure), projections.Sum(p => p.Year1Amount), projections.Sum(p => p.Year2Amount), projections.Sum(p => p.Year3Amount), byCategory);
        return Ok(summary);
    }

    [HttpPost("expenditure-projections/{id}/submit")]
    public async Task<IActionResult> SubmitExpenditureProjection(int id)
    {
        var proj = await _db.ExpenditureProjections.FindAsync(id);
        if (proj == null) return NotFound();
        proj.Status = CreditorApprovalStatus.Submitted;
        _db.CreditorsBudgetApprovals.Add(new CreditorsBudgetApproval { EntityType = "ExpenditureProjection", EntityId = id, ApprovalType = CreditorApprovalType.Submit, Decision = ApprovalDecision.Submitted, DecidedBy = "system" });
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("expenditure-projections/{id}/approve")]
    public async Task<IActionResult> ApproveExpenditureProjection(int id, [FromBody] ApproveDto? dto)
    {
        var proj = await _db.ExpenditureProjections.FindAsync(id);
        if (proj == null) return NotFound();
        proj.Status = CreditorApprovalStatus.Approved;
        proj.ApprovedBy = "CFO"; proj.ApprovedOn = DateTime.UtcNow;
        _db.CreditorsBudgetApprovals.Add(new CreditorsBudgetApproval { EntityType = "ExpenditureProjection", EntityId = id, ApprovalType = CreditorApprovalType.Approve, Decision = ApprovalDecision.Approved, Comment = dto?.Comment, DecidedBy = "CFO" });
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("expenditure-projections/submit-all")]
    public async Task<IActionResult> SubmitAllExpenditureProjections([FromQuery] int financialYearId)
    {
        var projs = await _db.ExpenditureProjections.Where(p => p.FinancialYearId == financialYearId && p.Status == CreditorApprovalStatus.Draft).ToListAsync();
        foreach (var p in projs)
        {
            p.Status = CreditorApprovalStatus.Submitted;
            _db.CreditorsBudgetApprovals.Add(new CreditorsBudgetApproval { EntityType = "ExpenditureProjection", EntityId = p.Id, ApprovalType = CreditorApprovalType.Submit, Decision = ApprovalDecision.Submitted, DecidedBy = "system" });
        }
        await _db.SaveChangesAsync();
        await _audit.LogAsync("ExpenditureProjection", 0, "BulkSubmitted", "system", $"Submitted {projs.Count} projections for FY {financialYearId}");
        return Ok(new { updated = projs.Count });
    }

    [HttpPost("expenditure-projections/approve-all")]
    public async Task<IActionResult> ApproveAllExpenditureProjections([FromQuery] int financialYearId)
    {
        var projs = await _db.ExpenditureProjections.Where(p => p.FinancialYearId == financialYearId && p.Status == CreditorApprovalStatus.Submitted).ToListAsync();
        foreach (var p in projs)
        {
            p.Status = CreditorApprovalStatus.Approved; p.ApprovedBy = "CFO"; p.ApprovedOn = DateTime.UtcNow;
            _db.CreditorsBudgetApprovals.Add(new CreditorsBudgetApproval { EntityType = "ExpenditureProjection", EntityId = p.Id, ApprovalType = CreditorApprovalType.Approve, Decision = ApprovalDecision.Approved, Comment = "Bulk approved", DecidedBy = "CFO" });
        }
        await _db.SaveChangesAsync();
        await _audit.LogAsync("ExpenditureProjection", 0, "BulkApproved", "CFO", $"Approved {projs.Count} projections for FY {financialYearId}");
        return Ok(new { updated = projs.Count });
    }

    [HttpGet("liabilities")]
    public async Task<IActionResult> GetLiabilities([FromQuery] int? financialYearId)
    {
        var fyId = financialYearId ?? (await _db.FinancialYears.FirstOrDefaultAsync(f => f.IsActive))?.Id ?? 0;
        var liabilities = await _db.CreditorLiabilities
            .Include(l => l.ExpenditureCategory)
            .Include(l => l.CreditorCategory)
            .Include(l => l.ScoaItem)
            .Include(l => l.ScoaFund)
            .Include(l => l.ScoaFunction)
            .Include(l => l.ScoaRegion)
            .Where(l => l.FinancialYearId == fyId)
            .ToListAsync();

        var dtos = liabilities.Select(l => new CreditorLiabilityDto(l.Id, l.FinancialYearId, l.ExpenditureCategoryId, l.ExpenditureCategory.Name, l.CreditorCategoryId, l.CreditorCategory?.Name, l.LiabilityType, l.OpeningBalance, l.ProjectedExpenditure, l.ProjectedPayments, l.ClosingBalance, l.PaymentRate, l.ContraBankAccount, l.IsPriorYearLiability, l.Year1Amount, l.Year2Amount, l.Year3Amount, l.Status.ToString(), l.ScoaItem?.Code, l.ScoaFund?.Code, l.ScoaFunction?.Code, l.ScoaRegion?.Code)).ToList();

        var summary = new CreditorLiabilitySummaryDto(dtos.Sum(d => d.OpeningBalance), dtos.Sum(d => d.ProjectedExpenditure), dtos.Sum(d => d.ProjectedPayments), dtos.Sum(d => d.ClosingBalance), dtos.Sum(d => d.Year1Amount), dtos.Sum(d => d.Year2Amount), dtos.Sum(d => d.Year3Amount), dtos.Count, dtos);
        return Ok(summary);
    }

    [HttpPost("liabilities/generate")]
    public async Task<IActionResult> GenerateLiabilities([FromQuery] int financialYearId)
    {
        var liabilities = await _liabilityService.GenerateLiabilities(financialYearId);
        return Ok(new { count = liabilities.Count, totalClosingBalance = liabilities.Sum(l => l.ClosingBalance) });
    }

    [HttpGet("forecast-assumptions")]
    public async Task<IActionResult> GetForecastAssumptions([FromQuery] int? financialYearId)
    {
        var query = _db.ForecastAssumptions.AsQueryable();
        if (financialYearId.HasValue) query = query.Where(a => a.FinancialYearId == financialYearId);

        var assumptions = await query.OrderBy(a => a.AssumptionType).ToListAsync();
        var dtos = assumptions.Select(a => new ForecastAssumptionDto(a.Id, a.Name, a.AssumptionType.ToString(), a.FinancialYearId, a.Year1Value, a.Year2Value, a.Year3Value, a.Category, a.Justification, a.Version, a.IsActive)).ToList();
        return Ok(dtos);
    }

    [HttpPost("forecast-assumptions")]
    public async Task<IActionResult> CreateForecastAssumption([FromBody] CreateForecastAssumptionDto dto)
    {
        if (!Enum.TryParse<ForecastAssumptionType>(dto.AssumptionType, true, out var at)) return BadRequest("Invalid assumption type");
        var assumption = new ForecastAssumption { Name = dto.Name, AssumptionType = at, FinancialYearId = dto.FinancialYearId, Year1Value = dto.Year1Value, Year2Value = dto.Year2Value, Year3Value = dto.Year3Value, Category = dto.Category, Justification = dto.Justification };
        _db.ForecastAssumptions.Add(assumption);
        await _db.SaveChangesAsync();
        return Ok(assumption.Id);
    }

    [HttpPut("forecast-assumptions/{id}")]
    public async Task<IActionResult> UpdateForecastAssumption(int id, [FromBody] UpdateForecastAssumptionDto dto)
    {
        var assumption = await _db.ForecastAssumptions.FindAsync(id);
        if (assumption == null) return NotFound();
        if (dto.Name != null) assumption.Name = dto.Name;
        if (dto.Year1Value.HasValue) assumption.Year1Value = dto.Year1Value.Value;
        if (dto.Year2Value.HasValue) assumption.Year2Value = dto.Year2Value.Value;
        if (dto.Year3Value.HasValue) assumption.Year3Value = dto.Year3Value.Value;
        if (dto.Category != null) assumption.Category = dto.Category;
        if (dto.Justification != null) assumption.Justification = dto.Justification;
        assumption.ModifiedBy = "system"; assumption.ModifiedOn = DateTime.UtcNow;
        assumption.Version++;
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpGet("sensitivity-analysis")]
    public async Task<IActionResult> GetSensitivityAnalysis([FromQuery] int? financialYearId)
    {
        var fyId = financialYearId ?? (await _db.FinancialYears.FirstOrDefaultAsync(f => f.IsActive))?.Id ?? 0;
        var assumptions = await _db.ForecastAssumptions.Where(a => a.FinancialYearId == fyId && a.IsActive).ToListAsync();
        var totalExpenditure = await _db.ExpenditureProjections.Where(p => p.FinancialYearId == fyId).SumAsync(p => p.GrossExpenditure);

        var analysis = assumptions.Select(a =>
        {
            var lowValue = a.Year1Value * 0.8m;
            var highValue = a.Year1Value * 1.2m;
            var baseFactor = 1 + a.Year1Value / 100;
            var lowFactor = 1 + lowValue / 100;
            var highFactor = 1 + highValue / 100;

            return new SensitivityAnalysisDto(a.Name, a.Year1Value, lowValue, highValue,
                Math.Round(totalExpenditure * baseFactor, 2),
                Math.Round(totalExpenditure * lowFactor, 2),
                Math.Round(totalExpenditure * highFactor, 2),
                Math.Round((highFactor - lowFactor) / baseFactor * 100, 2));
        }).ToList();
        return Ok(analysis);
    }

    [HttpPost("generate-budget-strings")]
    public async Task<IActionResult> GenerateBudgetStrings([FromBody] GenerateBudgetStringsDto dto)
    {
        var result = await _stringService.GenerateBudgetStrings(dto.BudgetVersionId, dto.FinancialYearId);
        return Ok(result);
    }

    [HttpGet("budget-strings")]
    public async Task<IActionResult> GetCreditorsBudgetStrings([FromQuery] int? versionId)
    {
        var query = _db.BudgetStrings.Where(bs => bs.SourceModule == SourceModule.CreditorsBudget);
        if (versionId.HasValue) query = query.Where(bs => bs.BudgetVersionId == versionId);
        var strings = await query.Include(bs => bs.ScoaItem).Include(bs => bs.ScoaFund).Include(bs => bs.ScoaFunction).Include(bs => bs.ScoaRegion).Include(bs => bs.ScoaCosting).Include(bs => bs.ScoaMsc).OrderBy(bs => bs.ScoaItemId).ToListAsync();
        return Ok(strings.Select(bs => new { bs.Id, bs.BudgetVersionId, ScoaItemCode = bs.ScoaItem.Code, ScoaItemDesc = bs.ScoaItem.Description, ScoaFundCode = bs.ScoaFund.Code, ScoaFunctionCode = bs.ScoaFunction.Code, ScoaRegionCode = bs.ScoaRegion.Code, bs.Year1Amount, bs.Year2Amount, bs.Year3Amount, bs.Description, bs.SourceModule }));
    }

    [HttpGet("draft-expenditure-budget")]
    public async Task<IActionResult> GetDraftExpenditureBudget([FromQuery] int? financialYearId)
    {
        var fyId = financialYearId ?? (await _db.FinancialYears.FirstOrDefaultAsync(f => f.IsActive))?.Id ?? 0;
        var projections = await _db.ExpenditureProjections.Include(p => p.ExpenditureCategory).Include(p => p.ScoaItem).Include(p => p.ScoaFund).Include(p => p.ScoaFunction).Where(p => p.FinancialYearId == fyId).ToListAsync();
        var creditorStrings = await _db.BudgetStrings.Where(bs => bs.SourceModule == SourceModule.CreditorsBudget).CountAsync();

        var lines = projections.GroupBy(p => p.ExpenditureCategoryId).Select(g =>
        {
            var cat = g.First().ExpenditureCategory;
            var gross = g.Sum(p => p.GrossExpenditure);
            var vat = g.Sum(p => p.VatAmount);
            return new DraftExpenditureLineDto(cat.Id, cat.Name, cat.Type.ToString(), g.First().ScoaItem?.Code, g.First().ScoaItem?.Description, g.First().ScoaFund?.Code, g.First().ScoaFunction?.Code, gross, vat, gross + vat, g.Sum(p => p.Year1Amount), g.Sum(p => p.Year2Amount), g.Sum(p => p.Year3Amount));
        }).ToList();

        var draft = new DraftExpenditureBudgetDto(lines.Sum(l => l.GrossExpenditure), lines.Sum(l => l.Vat), lines.Sum(l => l.NetExpenditure), lines.Sum(l => l.Year1Amount), lines.Sum(l => l.Year2Amount), lines.Sum(l => l.Year3Amount), lines, creditorStrings);
        return Ok(draft);
    }

    [HttpGet("integration-status")]
    public async Task<IActionResult> GetIntegrationStatus([FromQuery] int? financialYearId)
    {
        var fyId = financialYearId ?? (await _db.FinancialYears.FirstOrDefaultAsync(f => f.IsActive))?.Id ?? 0;
        var projections = await _db.ExpenditureProjections.Where(p => p.FinancialYearId == fyId).ToListAsync();
        var liabilities = await _db.CreditorLiabilities.Where(l => l.FinancialYearId == fyId).ToListAsync();
        var strings = await _db.BudgetStrings.Where(bs => bs.SourceModule == SourceModule.CreditorsBudget).CountAsync();

        var status = new CreditorsIntegrationStatusDto(
            strings > 0 ? "Integrated" : projections.Any(p => p.Status == CreditorApprovalStatus.Approved) ? "Ready" : "Pending",
            projections.Count(p => p.Status == CreditorApprovalStatus.Approved),
            projections.Count(p => p.Status != CreditorApprovalStatus.Approved),
            liabilities.Count(l => l.Status == CreditorApprovalStatus.Approved),
            liabilities.Count(l => l.Status != CreditorApprovalStatus.Approved),
            strings, strings > 0 ? DateTime.UtcNow : null);
        return Ok(status);
    }
}
