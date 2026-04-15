using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.DTOs;
using PlatinumBudget.Api.Models;
using PlatinumBudget.Api.Services;

namespace PlatinumBudget.Api.Controllers;

[ApiController]
[Route("api/hr-payroll")]
public class HrPayrollBudgetController : ControllerBase
{
    private readonly BudgetDbContext _db;
    private readonly HrPayrollCalculationService _calcService;
    private readonly StatutoryDeductionService _deductionService;
    private readonly DefinedBenefitService _dboService;
    private readonly PayrollScenarioService _scenarioService;
    private readonly HrPayrollBudgetStringService _stringService;
    private readonly AuditService _audit;

    public HrPayrollBudgetController(BudgetDbContext db, HrPayrollCalculationService calcService, StatutoryDeductionService deductionService, DefinedBenefitService dboService, PayrollScenarioService scenarioService, HrPayrollBudgetStringService stringService, AuditService audit)
    {
        _db = db;
        _calcService = calcService;
        _deductionService = deductionService;
        _dboService = dboService;
        _scenarioService = scenarioService;
        _stringService = stringService;
        _audit = audit;
    }

    [HttpGet("post-establishments")]
    public async Task<IActionResult> GetPostEstablishments([FromQuery] int? financialYearId, [FromQuery] string? department, [FromQuery] string? status)
    {
        var query = _db.PostEstablishments.AsQueryable();
        if (financialYearId.HasValue) query = query.Where(p => p.FinancialYearId == financialYearId);
        if (!string.IsNullOrEmpty(department)) query = query.Where(p => p.Department == department);
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<PostStatus>(status, true, out var s)) query = query.Where(p => p.Status == s);
        var posts = await query.OrderBy(p => p.Department).ThenBy(p => p.PostCode).Select(p => new PostEstablishmentResponseDto(p.Id, p.PostCode, p.Title, p.Department, p.JobLevel, p.SalaryGrade, p.SalaryNotch, p.EmploymentType.ToString(), p.Status.ToString(), p.IsFunded, p.IsActive, p.FundingSource, p.PlannedStartDate, p.RankingScore, p.PriorityStatus.ToString(), p.RecruitmentStrategy, p.JobDescription, p.BargainingUnit, p.EmployeeCategory, p.AnnualSalary, p.TotalCostToMunicipality, p.FinancialYearId, p.ScoaItemCode, p.ScoaFundCode, p.ScoaFunctionCode, p.ScoaRegionCode, p.ScoaCostingCode, p.CreatedBy, p.CreatedOn)).ToListAsync();
        return Ok(posts);
    }

    [HttpPost("post-establishments")]
    public async Task<IActionResult> CreatePostEstablishment([FromBody] CreatePostEstablishmentDto dto)
    {
        if (!Enum.TryParse<PostEmploymentType>(dto.EmploymentType, true, out var empType)) return BadRequest("Invalid employment type");
        var salary = await _db.SalaryStructures.FirstOrDefaultAsync(s => s.Grade == dto.SalaryGrade && s.Notch == dto.SalaryNotch && s.IsActive);
        var annualSalary = salary?.AnnualAmount ?? 0;
        var post = new PostEstablishment
        {
            PostCode = dto.PostCode, Title = dto.Title, Department = dto.Department, JobLevel = dto.JobLevel,
            SalaryGrade = dto.SalaryGrade, SalaryNotch = dto.SalaryNotch, EmploymentType = empType, Status = PostStatus.Vacant,
            IsFunded = dto.IsFunded, IsActive = true, FundingSource = dto.FundingSource, PlannedStartDate = dto.PlannedStartDate,
            RecruitmentStrategy = dto.RecruitmentStrategy, JobDescription = dto.JobDescription,
            BargainingUnit = dto.BargainingUnit, EmployeeCategory = dto.EmployeeCategory,
            AnnualSalary = annualSalary, TotalCostToMunicipality = Math.Round(annualSalary * 1.35m, 2),
            FinancialYearId = dto.FinancialYearId,
            ScoaItemCode = dto.ScoaItemCode, ScoaFundCode = dto.ScoaFundCode, ScoaFunctionCode = dto.ScoaFunctionCode,
            ScoaRegionCode = dto.ScoaRegionCode, ScoaCostingCode = dto.ScoaCostingCode
        };
        _db.PostEstablishments.Add(post);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("PostEstablishment", post.Id, "Created", "system", $"Post '{dto.Title}' created");
        return Ok(new PostEstablishmentResponseDto(post.Id, post.PostCode, post.Title, post.Department, post.JobLevel, post.SalaryGrade, post.SalaryNotch, post.EmploymentType.ToString(), post.Status.ToString(), post.IsFunded, post.IsActive, post.FundingSource, post.PlannedStartDate, post.RankingScore, post.PriorityStatus.ToString(), post.RecruitmentStrategy, post.JobDescription, post.BargainingUnit, post.EmployeeCategory, post.AnnualSalary, post.TotalCostToMunicipality, post.FinancialYearId, post.ScoaItemCode, post.ScoaFundCode, post.ScoaFunctionCode, post.ScoaRegionCode, post.ScoaCostingCode, post.CreatedBy, post.CreatedOn));
    }

    [HttpPut("post-establishments/{id}")]
    public async Task<IActionResult> UpdatePostEstablishment(int id, [FromBody] UpdatePostEstablishmentDto dto)
    {
        var post = await _db.PostEstablishments.FindAsync(id);
        if (post == null) return NotFound();
        if (dto.Title != null) post.Title = dto.Title;
        if (dto.Department != null) post.Department = dto.Department;
        if (dto.JobLevel != null) post.JobLevel = dto.JobLevel;
        if (dto.SalaryGrade.HasValue) post.SalaryGrade = dto.SalaryGrade;
        if (dto.SalaryNotch.HasValue) post.SalaryNotch = dto.SalaryNotch;
        if (dto.EmploymentType != null && Enum.TryParse<PostEmploymentType>(dto.EmploymentType, true, out var et)) post.EmploymentType = et;
        if (dto.Status != null && Enum.TryParse<PostStatus>(dto.Status, true, out var st)) post.Status = st;
        if (dto.IsFunded.HasValue) post.IsFunded = dto.IsFunded.Value;
        if (dto.IsActive.HasValue) post.IsActive = dto.IsActive.Value;
        if (dto.FundingSource != null) post.FundingSource = dto.FundingSource;
        if (dto.PlannedStartDate.HasValue) post.PlannedStartDate = dto.PlannedStartDate;
        if (dto.RankingScore.HasValue) post.RankingScore = dto.RankingScore.Value;
        if (dto.PriorityStatus != null && Enum.TryParse<PostPriorityStatus>(dto.PriorityStatus, true, out var ps)) post.PriorityStatus = ps;
        if (dto.RecruitmentStrategy != null) post.RecruitmentStrategy = dto.RecruitmentStrategy;
        if (dto.JobDescription != null) post.JobDescription = dto.JobDescription;
        if (dto.BargainingUnit != null) post.BargainingUnit = dto.BargainingUnit;
        if (dto.EmployeeCategory != null) post.EmployeeCategory = dto.EmployeeCategory;
        if (dto.ScoaItemCode != null) post.ScoaItemCode = dto.ScoaItemCode;
        if (dto.ScoaFundCode != null) post.ScoaFundCode = dto.ScoaFundCode;
        if (dto.ScoaFunctionCode != null) post.ScoaFunctionCode = dto.ScoaFunctionCode;
        if (dto.ScoaRegionCode != null) post.ScoaRegionCode = dto.ScoaRegionCode;
        if (dto.ScoaCostingCode != null) post.ScoaCostingCode = dto.ScoaCostingCode;
        if (dto.SalaryGrade.HasValue || dto.SalaryNotch.HasValue)
        {
            var salary = await _db.SalaryStructures.FirstOrDefaultAsync(s => s.Grade == post.SalaryGrade && s.Notch == post.SalaryNotch && s.IsActive);
            if (salary != null) { post.AnnualSalary = salary.AnnualAmount; post.TotalCostToMunicipality = Math.Round(salary.AnnualAmount * 1.35m, 2); }
        }
        await _db.SaveChangesAsync();
        await _audit.LogAsync("PostEstablishment", id, "Updated", "system", $"Post '{post.Title}' updated");
        return Ok();
    }

    [HttpPost("post-establishments/flag-active-posts")]
    public async Task<IActionResult> FlagActivePosts([FromQuery] int financialYearId)
    {
        var result = await _calcService.CalculatePostBudget(financialYearId);
        await _audit.LogAsync("PostEstablishment", 0, "FlagActivePosts", "system", $"Flagged {result.Count} active posts");
        return Ok(result.Select(p => new PostEstablishmentResponseDto(p.Id, p.PostCode, p.Title, p.Department, p.JobLevel, p.SalaryGrade, p.SalaryNotch, p.EmploymentType.ToString(), p.Status.ToString(), p.IsFunded, p.IsActive, p.FundingSource, p.PlannedStartDate, p.RankingScore, p.PriorityStatus.ToString(), p.RecruitmentStrategy, p.JobDescription, p.BargainingUnit, p.EmployeeCategory, p.AnnualSalary, p.TotalCostToMunicipality, p.FinancialYearId, p.ScoaItemCode, p.ScoaFundCode, p.ScoaFunctionCode, p.ScoaRegionCode, p.ScoaCostingCode, p.CreatedBy, p.CreatedOn)));
    }

    [HttpGet("post-establishments/organogram-summary")]
    public async Task<IActionResult> GetOrganogramSummary([FromQuery] int? financialYearId)
    {
        var query = _db.PostEstablishments.AsQueryable();
        if (financialYearId.HasValue) query = query.Where(p => p.FinancialYearId == financialYearId);
        var posts = await query.ToListAsync();
        var byDepartment = posts.GroupBy(p => p.Department ?? "Unassigned").Select(g => new DepartmentPostSummaryDto(
            g.Key, g.Count(), g.Count(p => p.Status == PostStatus.Filled), g.Count(p => p.Status == PostStatus.Vacant),
            g.Count(p => p.Status == PostStatus.Vacant && p.IsFunded), g.Sum(p => p.TotalCostToMunicipality)
        )).OrderBy(d => d.Department).ToList();
        var summary = new PostEstablishmentSummaryDto(
            posts.Count, posts.Count(p => p.Status == PostStatus.Filled), posts.Count(p => p.Status == PostStatus.Vacant),
            posts.Count(p => p.Status == PostStatus.Vacant && p.IsFunded), posts.Count(p => p.Status == PostStatus.Vacant && !p.IsFunded),
            posts.Sum(p => p.TotalCostToMunicipality), posts.Where(p => p.Status == PostStatus.Filled).Sum(p => p.TotalCostToMunicipality),
            posts.Where(p => p.Status == PostStatus.Vacant).Sum(p => p.TotalCostToMunicipality),
            posts.Select(p => new PostEstablishmentResponseDto(p.Id, p.PostCode, p.Title, p.Department, p.JobLevel, p.SalaryGrade, p.SalaryNotch, p.EmploymentType.ToString(), p.Status.ToString(), p.IsFunded, p.IsActive, p.FundingSource, p.PlannedStartDate, p.RankingScore, p.PriorityStatus.ToString(), p.RecruitmentStrategy, p.JobDescription, p.BargainingUnit, p.EmployeeCategory, p.AnnualSalary, p.TotalCostToMunicipality, p.FinancialYearId, p.ScoaItemCode, p.ScoaFundCode, p.ScoaFunctionCode, p.ScoaRegionCode, p.ScoaCostingCode, p.CreatedBy, p.CreatedOn)).ToList(),
            byDepartment
        );
        return Ok(summary);
    }

    [HttpGet("post-establishments/vacant-posts")]
    public async Task<IActionResult> GetVacantPosts([FromQuery] int? financialYearId)
    {
        var query = _db.PostEstablishments.Where(p => p.Status == PostStatus.Vacant);
        if (financialYearId.HasValue) query = query.Where(p => p.FinancialYearId == financialYearId);
        var posts = await query.OrderByDescending(p => p.RankingScore).Select(p => new PostEstablishmentResponseDto(p.Id, p.PostCode, p.Title, p.Department, p.JobLevel, p.SalaryGrade, p.SalaryNotch, p.EmploymentType.ToString(), p.Status.ToString(), p.IsFunded, p.IsActive, p.FundingSource, p.PlannedStartDate, p.RankingScore, p.PriorityStatus.ToString(), p.RecruitmentStrategy, p.JobDescription, p.BargainingUnit, p.EmployeeCategory, p.AnnualSalary, p.TotalCostToMunicipality, p.FinancialYearId, p.ScoaItemCode, p.ScoaFundCode, p.ScoaFunctionCode, p.ScoaRegionCode, p.ScoaCostingCode, p.CreatedBy, p.CreatedOn)).ToListAsync();
        return Ok(posts);
    }

    [HttpGet("post-establishments/unprioritised-posts")]
    public async Task<IActionResult> GetUnprioritisedPosts([FromQuery] int? financialYearId)
    {
        var query = _db.PostEstablishments.Where(p => p.Status == PostStatus.Vacant && p.PriorityStatus == PostPriorityStatus.NotRanked);
        if (financialYearId.HasValue) query = query.Where(p => p.FinancialYearId == financialYearId);
        var posts = await query.OrderBy(p => p.Department).Select(p => new PostEstablishmentResponseDto(p.Id, p.PostCode, p.Title, p.Department, p.JobLevel, p.SalaryGrade, p.SalaryNotch, p.EmploymentType.ToString(), p.Status.ToString(), p.IsFunded, p.IsActive, p.FundingSource, p.PlannedStartDate, p.RankingScore, p.PriorityStatus.ToString(), p.RecruitmentStrategy, p.JobDescription, p.BargainingUnit, p.EmployeeCategory, p.AnnualSalary, p.TotalCostToMunicipality, p.FinancialYearId, p.ScoaItemCode, p.ScoaFundCode, p.ScoaFunctionCode, p.ScoaRegionCode, p.ScoaCostingCode, p.CreatedBy, p.CreatedOn)).ToListAsync();
        return Ok(posts);
    }

    [HttpGet("salary-structures")]
    public async Task<IActionResult> GetSalaryStructures()
    {
        var structures = await _db.SalaryStructures.Where(s => s.IsActive).OrderBy(s => s.Grade).ThenBy(s => s.Notch)
            .Select(s => new SalaryStructureDto(s.Id, s.Grade, s.Notch, s.AnnualAmount, s.HourlyRate, s.EffectiveDate, s.BargainingUnit, s.EmployeeCategory, s.JobLevel, s.IsActive)).ToListAsync();
        return Ok(structures);
    }

    [HttpPost("salary-structures")]
    public async Task<IActionResult> CreateSalaryStructure([FromBody] CreateSalaryStructureDto dto)
    {
        var structure = new SalaryStructure
        {
            Grade = dto.Grade, Notch = dto.Notch, AnnualAmount = dto.AnnualAmount, HourlyRate = dto.HourlyRate,
            EffectiveDate = dto.EffectiveDate, BargainingUnit = dto.BargainingUnit, EmployeeCategory = dto.EmployeeCategory, JobLevel = dto.JobLevel
        };
        _db.SalaryStructures.Add(structure);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("SalaryStructure", structure.Id, "Created", "system", $"Grade {dto.Grade} Notch {dto.Notch} created");
        return Ok(new SalaryStructureDto(structure.Id, structure.Grade, structure.Notch, structure.AnnualAmount, structure.HourlyRate, structure.EffectiveDate, structure.BargainingUnit, structure.EmployeeCategory, structure.JobLevel, structure.IsActive));
    }

    [HttpGet("salary-increases")]
    public async Task<IActionResult> GetSalaryIncreases([FromQuery] int? financialYearId)
    {
        var query = _db.SalaryIncreases.AsQueryable();
        if (financialYearId.HasValue) query = query.Where(i => i.FinancialYearId == financialYearId);
        var increases = await query.OrderBy(i => i.EmployeeCategory).Select(i => new SalaryIncreaseDto(i.Id, i.EmployeeCategory, i.BargainingUnit, i.PostLevel, i.IncreasePercentage, i.EffectiveDate, i.FinancialYearId, i.IsNotchProgression, i.IsLocked, i.ApprovedBy, i.ApprovedOn)).ToListAsync();
        return Ok(increases);
    }

    [HttpPost("salary-increases")]
    public async Task<IActionResult> CreateSalaryIncrease([FromBody] CreateSalaryIncreaseDto dto)
    {
        var increase = new SalaryIncrease
        {
            EmployeeCategory = dto.EmployeeCategory, BargainingUnit = dto.BargainingUnit, PostLevel = dto.PostLevel,
            IncreasePercentage = dto.IncreasePercentage, EffectiveDate = dto.EffectiveDate,
            FinancialYearId = dto.FinancialYearId, IsNotchProgression = dto.IsNotchProgression
        };
        _db.SalaryIncreases.Add(increase);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("SalaryIncrease", increase.Id, "Created", "system", $"Increase {dto.IncreasePercentage}% for {dto.EmployeeCategory}");
        return Ok(new SalaryIncreaseDto(increase.Id, increase.EmployeeCategory, increase.BargainingUnit, increase.PostLevel, increase.IncreasePercentage, increase.EffectiveDate, increase.FinancialYearId, increase.IsNotchProgression, increase.IsLocked, increase.ApprovedBy, increase.ApprovedOn));
    }

    [HttpPost("calculate-notch-progression")]
    public async Task<IActionResult> CalculateNotchProgression([FromQuery] int financialYearId)
    {
        var result = await _calcService.CalculateNotchProgression(financialYearId, null);
        return Ok(result.Select(p => new PostEstablishmentResponseDto(p.Id, p.PostCode, p.Title, p.Department, p.JobLevel, p.SalaryGrade, p.SalaryNotch, p.EmploymentType.ToString(), p.Status.ToString(), p.IsFunded, p.IsActive, p.FundingSource, p.PlannedStartDate, p.RankingScore, p.PriorityStatus.ToString(), p.RecruitmentStrategy, p.JobDescription, p.BargainingUnit, p.EmployeeCategory, p.AnnualSalary, p.TotalCostToMunicipality, p.FinancialYearId, p.ScoaItemCode, p.ScoaFundCode, p.ScoaFunctionCode, p.ScoaRegionCode, p.ScoaCostingCode, p.CreatedBy, p.CreatedOn)));
    }

    [HttpPost("calculate-percentage-increase")]
    public async Task<IActionResult> CalculatePercentageIncrease([FromQuery] int financialYearId)
    {
        var increases = await _db.SalaryIncreases.Where(i => i.FinancialYearId == financialYearId && !i.IsLocked).ToListAsync();
        var allResults = new List<PostEstablishment>();
        foreach (var inc in increases)
        {
            var result = await _calcService.CalculateSalaryIncrease(financialYearId, inc.EmployeeCategory, inc.BargainingUnit, inc.IncreasePercentage);
            allResults.AddRange(result);
        }
        return Ok(allResults.Select(p => new PostEstablishmentResponseDto(p.Id, p.PostCode, p.Title, p.Department, p.JobLevel, p.SalaryGrade, p.SalaryNotch, p.EmploymentType.ToString(), p.Status.ToString(), p.IsFunded, p.IsActive, p.FundingSource, p.PlannedStartDate, p.RankingScore, p.PriorityStatus.ToString(), p.RecruitmentStrategy, p.JobDescription, p.BargainingUnit, p.EmployeeCategory, p.AnnualSalary, p.TotalCostToMunicipality, p.FinancialYearId, p.ScoaItemCode, p.ScoaFundCode, p.ScoaFunctionCode, p.ScoaRegionCode, p.ScoaCostingCode, p.CreatedBy, p.CreatedOn)));
    }

    [HttpGet("temporary-contracts")]
    public async Task<IActionResult> GetTemporaryContracts([FromQuery] int? financialYearId)
    {
        var query = _db.TemporaryContracts.AsQueryable();
        if (financialYearId.HasValue) query = query.Where(c => c.FinancialYearId == financialYearId);
        var contracts = await query.OrderBy(c => c.Department).Select(c => new TemporaryContractDto(c.Id, c.EmployeeName, c.PostCode, c.Department, c.JobTitle, c.ContractStartDate, c.ContractEndDate, c.RemunerationType.ToString(), c.Rate, c.CalculatedBudget, c.ContractStatus, c.FinancialYearId, c.ScoaItemCode, c.ScoaFundCode, c.ScoaFunctionCode)).ToListAsync();
        return Ok(contracts);
    }

    [HttpPost("temporary-contracts")]
    public async Task<IActionResult> CreateTemporaryContract([FromBody] CreateTemporaryContractDto dto)
    {
        if (!Enum.TryParse<RemunerationType>(dto.RemunerationType, true, out var rt)) return BadRequest("Invalid remuneration type");
        var contract = new TemporaryContract
        {
            EmployeeName = dto.EmployeeName, PostCode = dto.PostCode, Department = dto.Department, JobTitle = dto.JobTitle,
            ContractStartDate = dto.ContractStartDate, ContractEndDate = dto.ContractEndDate,
            RemunerationType = rt, Rate = dto.Rate, FinancialYearId = dto.FinancialYearId,
            ScoaItemCode = dto.ScoaItemCode, ScoaFundCode = dto.ScoaFundCode, ScoaFunctionCode = dto.ScoaFunctionCode
        };
        _db.TemporaryContracts.Add(contract);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("TemporaryContract", contract.Id, "Created", "system", $"Contract for '{dto.EmployeeName}' created");
        return Ok(new TemporaryContractDto(contract.Id, contract.EmployeeName, contract.PostCode, contract.Department, contract.JobTitle, contract.ContractStartDate, contract.ContractEndDate, contract.RemunerationType.ToString(), contract.Rate, contract.CalculatedBudget, contract.ContractStatus, contract.FinancialYearId, contract.ScoaItemCode, contract.ScoaFundCode, contract.ScoaFunctionCode));
    }

    [HttpPost("temporary-contracts/calculate-contract-budgets")]
    public async Task<IActionResult> CalculateContractBudgets([FromQuery] int financialYearId)
    {
        var result = await _calcService.CalculateTemporaryContractBudget(financialYearId);
        return Ok(result.Select(c => new TemporaryContractDto(c.Id, c.EmployeeName, c.PostCode, c.Department, c.JobTitle, c.ContractStartDate, c.ContractEndDate, c.RemunerationType.ToString(), c.Rate, c.CalculatedBudget, c.ContractStatus, c.FinancialYearId, c.ScoaItemCode, c.ScoaFundCode, c.ScoaFunctionCode)));
    }

    [HttpGet("councillor-positions")]
    public async Task<IActionResult> GetCouncillorPositions([FromQuery] int? financialYearId)
    {
        var query = _db.CouncillorPositions.AsQueryable();
        if (financialYearId.HasValue) query = query.Where(c => c.FinancialYearId == financialYearId);
        var positions = await query.OrderBy(c => c.PositionTitle).Select(c => new CouncillorPositionDto(c.Id, c.PositionTitle, c.CouncillorType.ToString(), c.NumberOfPositions, c.BasicSalary, c.TravelAllowance, c.CellphoneAllowance, c.MedicalContribution, c.OtherBenefits, c.TotalRemuneration, c.AnticipatedIncreasePercent, c.AdjustedTotalRemuneration, c.GazettedUpperLimit, c.AdjustedTotalRemuneration > c.GazettedUpperLimit, c.FinancialYearId, c.ScoaItemCode, c.ScoaFundCode, c.ScoaFunctionCode, c.ScoaRegionCode)).ToListAsync();
        return Ok(positions);
    }

    [HttpPost("councillor-positions")]
    public async Task<IActionResult> CreateCouncillorPosition([FromBody] CreateCouncillorPositionDto dto)
    {
        if (!Enum.TryParse<CouncillorType>(dto.CouncillorType, true, out var ct)) return BadRequest("Invalid councillor type");
        var totalRem = dto.BasicSalary + dto.TravelAllowance + dto.CellphoneAllowance + dto.MedicalContribution + dto.OtherBenefits;
        var adjustedRem = Math.Round(totalRem * (1 + dto.AnticipatedIncreasePercent / 100), 2);
        var position = new CouncillorPosition
        {
            PositionTitle = dto.PositionTitle, CouncillorType = ct, NumberOfPositions = dto.NumberOfPositions,
            BasicSalary = dto.BasicSalary, TravelAllowance = dto.TravelAllowance, CellphoneAllowance = dto.CellphoneAllowance,
            MedicalContribution = dto.MedicalContribution, OtherBenefits = dto.OtherBenefits,
            TotalRemuneration = totalRem, AnticipatedIncreasePercent = dto.AnticipatedIncreasePercent,
            AdjustedTotalRemuneration = adjustedRem, GazettedUpperLimit = dto.GazettedUpperLimit,
            FinancialYearId = dto.FinancialYearId,
            ScoaItemCode = dto.ScoaItemCode, ScoaFundCode = dto.ScoaFundCode, ScoaFunctionCode = dto.ScoaFunctionCode, ScoaRegionCode = dto.ScoaRegionCode
        };
        _db.CouncillorPositions.Add(position);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("CouncillorPosition", position.Id, "Created", "system", $"Position '{dto.PositionTitle}' created");
        return Ok(new CouncillorPositionDto(position.Id, position.PositionTitle, position.CouncillorType.ToString(), position.NumberOfPositions, position.BasicSalary, position.TravelAllowance, position.CellphoneAllowance, position.MedicalContribution, position.OtherBenefits, position.TotalRemuneration, position.AnticipatedIncreasePercent, position.AdjustedTotalRemuneration, position.GazettedUpperLimit, position.AdjustedTotalRemuneration > position.GazettedUpperLimit, position.FinancialYearId, position.ScoaItemCode, position.ScoaFundCode, position.ScoaFunctionCode, position.ScoaRegionCode));
    }

    [HttpPost("councillor-positions/calculate-councillor-budget")]
    public async Task<IActionResult> CalculateCouncillorBudget([FromQuery] int financialYearId)
    {
        var result = await _calcService.CalculateCouncillorBudget(financialYearId, 4.5m);
        return Ok(result.Select(c => new CouncillorPositionDto(c.Id, c.PositionTitle, c.CouncillorType.ToString(), c.NumberOfPositions, c.BasicSalary, c.TravelAllowance, c.CellphoneAllowance, c.MedicalContribution, c.OtherBenefits, c.TotalRemuneration, c.AnticipatedIncreasePercent, c.AdjustedTotalRemuneration, c.GazettedUpperLimit, c.AdjustedTotalRemuneration > c.GazettedUpperLimit, c.FinancialYearId, c.ScoaItemCode, c.ScoaFundCode, c.ScoaFunctionCode, c.ScoaRegionCode)));
    }

    [HttpPost("councillor-positions/councillor-increase")]
    public async Task<IActionResult> ApplyCouncillorIncrease([FromBody] dynamic dto)
    {
        int financialYearId = (int)dto.financialYearId;
        decimal increasePercent = (decimal)dto.increasePercent;
        var result = await _calcService.CalculateCouncillorBudget(financialYearId, increasePercent);
        return Ok(result.Select(c => new CouncillorPositionDto(c.Id, c.PositionTitle, c.CouncillorType.ToString(), c.NumberOfPositions, c.BasicSalary, c.TravelAllowance, c.CellphoneAllowance, c.MedicalContribution, c.OtherBenefits, c.TotalRemuneration, c.AnticipatedIncreasePercent, c.AdjustedTotalRemuneration, c.GazettedUpperLimit, c.AdjustedTotalRemuneration > c.GazettedUpperLimit, c.FinancialYearId, c.ScoaItemCode, c.ScoaFundCode, c.ScoaFunctionCode, c.ScoaRegionCode)));
    }

    [HttpGet("ward-committee-budgets")]
    public async Task<IActionResult> GetWardCommitteeBudgets([FromQuery] int? financialYearId)
    {
        var query = _db.WardCommitteeBudgets.AsQueryable();
        if (financialYearId.HasValue) query = query.Where(w => w.FinancialYearId == financialYearId);
        var wards = await query.OrderBy(w => w.WardNumber).Select(w => new WardCommitteeBudgetDto(w.Id, w.WardNumber, w.WardName, w.Region, w.NumberOfMembers, w.NumberOfMeetings, w.RatePerMeeting, w.AnticipatedRateIncreasePercent, w.AdjustedRatePerMeeting, w.TotalEstimatedCost, w.FinancialYearId, w.ScoaItemCode, w.ScoaFundCode, w.ScoaFunctionCode, w.ScoaRegionCode)).ToListAsync();
        return Ok(wards);
    }

    [HttpPost("ward-committee-budgets")]
    public async Task<IActionResult> CreateWardCommitteeBudget([FromBody] CreateWardCommitteeBudgetDto dto)
    {
        var adjustedRate = Math.Round(dto.RatePerMeeting * (1 + dto.AnticipatedRateIncreasePercent / 100), 2);
        var totalCost = adjustedRate * dto.NumberOfMembers * dto.NumberOfMeetings;
        var ward = new WardCommitteeBudget
        {
            WardNumber = dto.WardNumber, WardName = dto.WardName, Region = dto.Region,
            NumberOfMembers = dto.NumberOfMembers, NumberOfMeetings = dto.NumberOfMeetings,
            RatePerMeeting = dto.RatePerMeeting, AnticipatedRateIncreasePercent = dto.AnticipatedRateIncreasePercent,
            AdjustedRatePerMeeting = adjustedRate, TotalEstimatedCost = totalCost,
            FinancialYearId = dto.FinancialYearId,
            ScoaItemCode = dto.ScoaItemCode, ScoaFundCode = dto.ScoaFundCode, ScoaFunctionCode = dto.ScoaFunctionCode, ScoaRegionCode = dto.ScoaRegionCode
        };
        _db.WardCommitteeBudgets.Add(ward);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("WardCommitteeBudget", ward.Id, "Created", "system", $"Ward {dto.WardNumber} budget created");
        return Ok(new WardCommitteeBudgetDto(ward.Id, ward.WardNumber, ward.WardName, ward.Region, ward.NumberOfMembers, ward.NumberOfMeetings, ward.RatePerMeeting, ward.AnticipatedRateIncreasePercent, ward.AdjustedRatePerMeeting, ward.TotalEstimatedCost, ward.FinancialYearId, ward.ScoaItemCode, ward.ScoaFundCode, ward.ScoaFunctionCode, ward.ScoaRegionCode));
    }

    [HttpPost("ward-committee-budgets/calculate-ward-budget")]
    public async Task<IActionResult> CalculateWardBudget([FromQuery] int financialYearId)
    {
        var result = await _calcService.CalculateWardCommitteeBudget(financialYearId, 5m);
        return Ok(result.Select(w => new WardCommitteeBudgetDto(w.Id, w.WardNumber, w.WardName, w.Region, w.NumberOfMembers, w.NumberOfMeetings, w.RatePerMeeting, w.AnticipatedRateIncreasePercent, w.AdjustedRatePerMeeting, w.TotalEstimatedCost, w.FinancialYearId, w.ScoaItemCode, w.ScoaFundCode, w.ScoaFunctionCode, w.ScoaRegionCode)));
    }

    [HttpGet("variable-benefit-hours")]
    public async Task<IActionResult> GetVariableBenefitHours([FromQuery] int? financialYearId, [FromQuery] string? department)
    {
        var query = _db.VariableBenefitHours.AsQueryable();
        if (financialYearId.HasValue) query = query.Where(v => v.FinancialYearId == financialYearId);
        if (!string.IsNullOrEmpty(department)) query = query.Where(v => v.Department == department);
        var hours = await query.OrderBy(v => v.Department).ThenBy(v => v.BenefitType).Select(v => new VariableBenefitHoursDto(v.Id, v.Department, v.BenefitType.ToString(), v.EstimatedHours, v.AverageRate, v.CalculatedCost, v.HistoricalHours, v.HistoricalCost, v.VariancePercent, v.FinancialYearId, v.ScoaItemCode, v.ScoaFundCode, v.ScoaFunctionCode)).ToListAsync();
        return Ok(hours);
    }

    [HttpPost("variable-benefit-hours")]
    public async Task<IActionResult> CreateVariableBenefitHours([FromBody] CreateVariableBenefitHoursDto dto)
    {
        if (!Enum.TryParse<VariableBenefitType>(dto.BenefitType, true, out var bt)) return BadRequest("Invalid benefit type");
        var calculatedCost = dto.EstimatedHours * dto.AverageRate;
        var variancePercent = dto.HistoricalCost > 0 ? Math.Round((calculatedCost - dto.HistoricalCost.Value) / dto.HistoricalCost.Value * 100, 2) : 0;
        var hours = new VariableBenefitHours
        {
            Department = dto.Department, BenefitType = bt, EstimatedHours = dto.EstimatedHours,
            AverageRate = dto.AverageRate, CalculatedCost = calculatedCost,
            HistoricalHours = dto.HistoricalHours, HistoricalCost = dto.HistoricalCost, VariancePercent = variancePercent,
            FinancialYearId = dto.FinancialYearId,
            ScoaItemCode = dto.ScoaItemCode, ScoaFundCode = dto.ScoaFundCode, ScoaFunctionCode = dto.ScoaFunctionCode
        };
        _db.VariableBenefitHours.Add(hours);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("VariableBenefitHours", hours.Id, "Created", "system", $"Variable benefit hours for {dto.Department} created");
        return Ok(new VariableBenefitHoursDto(hours.Id, hours.Department, hours.BenefitType.ToString(), hours.EstimatedHours, hours.AverageRate, hours.CalculatedCost, hours.HistoricalHours, hours.HistoricalCost, hours.VariancePercent, hours.FinancialYearId, hours.ScoaItemCode, hours.ScoaFundCode, hours.ScoaFunctionCode));
    }

    [HttpPost("variable-benefit-hours/calculate-variable-benefits")]
    public async Task<IActionResult> CalculateVariableBenefits([FromQuery] int financialYearId)
    {
        var result = await _calcService.CalculateVariableBenefits(financialYearId);
        return Ok(result.Select(v => new VariableBenefitHoursDto(v.Id, v.Department, v.BenefitType.ToString(), v.EstimatedHours, v.AverageRate, v.CalculatedCost, v.HistoricalHours, v.HistoricalCost, v.VariancePercent, v.FinancialYearId, v.ScoaItemCode, v.ScoaFundCode, v.ScoaFunctionCode)));
    }

    [HttpGet("variable-benefit-hours/hours-history")]
    public async Task<IActionResult> GetHoursHistory([FromQuery] int? financialYearId, [FromQuery] string? department)
    {
        var query = _db.VariableBenefitHours.AsQueryable();
        if (financialYearId.HasValue) query = query.Where(v => v.FinancialYearId == financialYearId);
        if (!string.IsNullOrEmpty(department)) query = query.Where(v => v.Department == department);
        var history = await query.Where(v => v.HistoricalHours.HasValue).OrderBy(v => v.Department).Select(v => new VariableBenefitHoursDto(v.Id, v.Department, v.BenefitType.ToString(), v.EstimatedHours, v.AverageRate, v.CalculatedCost, v.HistoricalHours, v.HistoricalCost, v.VariancePercent, v.FinancialYearId, v.ScoaItemCode, v.ScoaFundCode, v.ScoaFunctionCode)).ToListAsync();
        return Ok(history);
    }

    [HttpGet("travel-requirements")]
    public async Task<IActionResult> GetTravelRequirements([FromQuery] int? financialYearId, [FromQuery] string? department)
    {
        var query = _db.TravelRequirements.AsQueryable();
        if (financialYearId.HasValue) query = query.Where(t => t.FinancialYearId == financialYearId);
        if (!string.IsNullOrEmpty(department)) query = query.Where(t => t.Department == department);
        var requirements = await query.OrderBy(t => t.Department).Select(t => new TravelRequirementDto(t.Id, t.Department, t.ProjectReference, t.Destination, t.PurposeOfTravel, t.NumberOfOfficials, t.NumberOfTrips, t.EstimatedKilometres, t.AccommodationNights, t.TravelDuration, t.TransportMode.ToString(), t.EstimatedCost, t.FinancialYearId, t.ScoaItemCode, t.ScoaFundCode, t.ScoaFunctionCode, t.ScoaProjectCode, t.ScoaRegionCode)).ToListAsync();
        return Ok(requirements);
    }

    [HttpPost("travel-requirements")]
    public async Task<IActionResult> CreateTravelRequirement([FromBody] CreateTravelRequirementDto dto)
    {
        if (!Enum.TryParse<TransportMode>(dto.TransportMode, true, out var tm)) return BadRequest("Invalid transport mode");
        var requirement = new TravelRequirement
        {
            Department = dto.Department, ProjectReference = dto.ProjectReference, Destination = dto.Destination,
            PurposeOfTravel = dto.PurposeOfTravel, NumberOfOfficials = dto.NumberOfOfficials, NumberOfTrips = dto.NumberOfTrips,
            EstimatedKilometres = dto.EstimatedKilometres, AccommodationNights = dto.AccommodationNights,
            TravelDuration = dto.TravelDuration, TransportMode = tm, FinancialYearId = dto.FinancialYearId,
            ScoaItemCode = dto.ScoaItemCode, ScoaFundCode = dto.ScoaFundCode, ScoaFunctionCode = dto.ScoaFunctionCode,
            ScoaProjectCode = dto.ScoaProjectCode, ScoaRegionCode = dto.ScoaRegionCode
        };
        _db.TravelRequirements.Add(requirement);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("TravelRequirement", requirement.Id, "Created", "system", $"Travel to '{dto.Destination}' created");
        return Ok(new TravelRequirementDto(requirement.Id, requirement.Department, requirement.ProjectReference, requirement.Destination, requirement.PurposeOfTravel, requirement.NumberOfOfficials, requirement.NumberOfTrips, requirement.EstimatedKilometres, requirement.AccommodationNights, requirement.TravelDuration, requirement.TransportMode.ToString(), requirement.EstimatedCost, requirement.FinancialYearId, requirement.ScoaItemCode, requirement.ScoaFundCode, requirement.ScoaFunctionCode, requirement.ScoaProjectCode, requirement.ScoaRegionCode));
    }

    [HttpGet("travel-standard-rates")]
    public async Task<IActionResult> GetTravelStandardRates()
    {
        var rates = await _db.TravelStandardRates.Where(r => r.IsActive).OrderBy(r => r.RateType).ThenBy(r => r.Classification)
            .Select(r => new TravelStandardRateDto(r.Id, r.RateType, r.Classification.ToString(), r.EmployeeLevel, r.RateAmount, r.EffectiveDate, r.PolicyReference, r.IsActive)).ToListAsync();
        return Ok(rates);
    }

    [HttpPost("travel-standard-rates")]
    public async Task<IActionResult> CreateTravelStandardRate([FromBody] CreateTravelStandardRateDto dto)
    {
        if (!Enum.TryParse<TravelClassification>(dto.Classification, true, out var tc)) return BadRequest("Invalid classification");
        var rate = new TravelStandardRate
        {
            RateType = dto.RateType, Classification = tc, EmployeeLevel = dto.EmployeeLevel,
            RateAmount = dto.RateAmount, EffectiveDate = dto.EffectiveDate, PolicyReference = dto.PolicyReference
        };
        _db.TravelStandardRates.Add(rate);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("TravelStandardRate", rate.Id, "Created", "system", $"Rate '{dto.RateType}' created");
        return Ok(new TravelStandardRateDto(rate.Id, rate.RateType, rate.Classification.ToString(), rate.EmployeeLevel, rate.RateAmount, rate.EffectiveDate, rate.PolicyReference, rate.IsActive));
    }

    [HttpPost("travel-requirements/calculate-travel-budget")]
    public async Task<IActionResult> CalculateTravelBudget([FromQuery] int financialYearId)
    {
        var result = await _calcService.CalculateTravelBudget(financialYearId);
        return Ok(result.Select(t => new TravelRequirementDto(t.Id, t.Department, t.ProjectReference, t.Destination, t.PurposeOfTravel, t.NumberOfOfficials, t.NumberOfTrips, t.EstimatedKilometres, t.AccommodationNights, t.TravelDuration, t.TransportMode.ToString(), t.EstimatedCost, t.FinancialYearId, t.ScoaItemCode, t.ScoaFundCode, t.ScoaFunctionCode, t.ScoaProjectCode, t.ScoaRegionCode)));
    }

    [HttpGet("travel-requirements/travel-trends")]
    public async Task<IActionResult> GetTravelTrends([FromQuery] int? financialYearId)
    {
        var query = _db.TravelRequirements.AsQueryable();
        if (financialYearId.HasValue) query = query.Where(t => t.FinancialYearId == financialYearId);
        var trends = await query.GroupBy(t => t.Destination).Select(g => new { Destination = g.Key, TotalTrips = g.Sum(t => t.NumberOfTrips), TotalCost = g.Sum(t => t.EstimatedCost), AverageCost = g.Average(t => t.EstimatedCost), Frequency = g.Count() }).OrderByDescending(t => t.TotalCost).ToListAsync();
        return Ok(trends);
    }

    [HttpGet("performance-bonuses")]
    public async Task<IActionResult> GetPerformanceBonuses([FromQuery] int? financialYearId)
    {
        var query = _db.PerformanceBonuses.AsQueryable();
        if (financialYearId.HasValue) query = query.Where(b => b.FinancialYearId == financialYearId);
        var bonuses = await query.OrderBy(b => b.Department).Select(b => new PerformanceBonusDto(b.Id, b.Department, b.EmployeeCategory, b.BonusPercentage, b.QualifyingEmployees, b.AverageSalary, b.EstimatedTotalCost, b.FinancialYearId, b.ScoaItemCode, b.ScoaFundCode, b.ScoaFunctionCode)).ToListAsync();
        return Ok(bonuses);
    }

    [HttpPost("performance-bonuses")]
    public async Task<IActionResult> CreatePerformanceBonus([FromBody] CreatePerformanceBonusDto dto)
    {
        var estimatedCost = Math.Round(dto.QualifyingEmployees * dto.AverageSalary * dto.BonusPercentage / 100, 2);
        var bonus = new PerformanceBonus
        {
            Department = dto.Department, EmployeeCategory = dto.EmployeeCategory, BonusPercentage = dto.BonusPercentage,
            QualifyingEmployees = dto.QualifyingEmployees, AverageSalary = dto.AverageSalary, EstimatedTotalCost = estimatedCost,
            FinancialYearId = dto.FinancialYearId,
            ScoaItemCode = dto.ScoaItemCode, ScoaFundCode = dto.ScoaFundCode, ScoaFunctionCode = dto.ScoaFunctionCode
        };
        _db.PerformanceBonuses.Add(bonus);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("PerformanceBonus", bonus.Id, "Created", "system", $"Bonus for {dto.Department} created");
        return Ok(new PerformanceBonusDto(bonus.Id, bonus.Department, bonus.EmployeeCategory, bonus.BonusPercentage, bonus.QualifyingEmployees, bonus.AverageSalary, bonus.EstimatedTotalCost, bonus.FinancialYearId, bonus.ScoaItemCode, bonus.ScoaFundCode, bonus.ScoaFunctionCode));
    }

    [HttpPost("performance-bonuses/calculate-bonus-budget")]
    public async Task<IActionResult> CalculateBonusBudget([FromQuery] int financialYearId)
    {
        var result = await _calcService.CalculatePerformanceBonus(financialYearId);
        return Ok(result.Select(b => new PerformanceBonusDto(b.Id, b.Department, b.EmployeeCategory, b.BonusPercentage, b.QualifyingEmployees, b.AverageSalary, b.EstimatedTotalCost, b.FinancialYearId, b.ScoaItemCode, b.ScoaFundCode, b.ScoaFunctionCode)));
    }

    [HttpGet("statutory-deductions")]
    public async Task<IActionResult> GetStatutoryDeductions()
    {
        var deductions = await _db.StatutoryDeductions.OrderBy(d => d.DeductionType)
            .Select(d => new StatutoryDeductionDto(d.Id, d.DeductionType, d.CalculationMethod.ToString(), d.Rate, d.Threshold, d.EmployerContributionRate, d.Description, d.IsActive)).ToListAsync();
        return Ok(deductions);
    }

    [HttpPost("statutory-deductions")]
    public async Task<IActionResult> CreateStatutoryDeduction([FromBody] CreateStatutoryDeductionDto dto)
    {
        if (!Enum.TryParse<DeductionCalculationMethod>(dto.CalculationMethod, true, out var cm)) return BadRequest("Invalid calculation method");
        var deduction = new StatutoryDeduction
        {
            DeductionType = dto.DeductionType, CalculationMethod = cm, Rate = dto.Rate,
            Threshold = dto.Threshold, EmployerContributionRate = dto.EmployerContributionRate, Description = dto.Description
        };
        _db.StatutoryDeductions.Add(deduction);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("StatutoryDeduction", deduction.Id, "Created", "system", $"Deduction '{dto.DeductionType}' created");
        return Ok(new StatutoryDeductionDto(deduction.Id, deduction.DeductionType, deduction.CalculationMethod.ToString(), deduction.Rate, deduction.Threshold, deduction.EmployerContributionRate, deduction.Description, deduction.IsActive));
    }

    [HttpPost("statutory-deductions/calculate-paye")]
    public async Task<IActionResult> CalculatePaye([FromQuery] int financialYearId)
    {
        var totalRemuneration = await _db.PostEstablishments.Where(p => p.FinancialYearId == financialYearId && p.Status == PostStatus.Filled && p.IsActive).SumAsync(p => p.AnnualSalary);
        var avgSalary = totalRemuneration / Math.Max(1, await _db.PostEstablishments.Where(p => p.FinancialYearId == financialYearId && p.Status == PostStatus.Filled && p.IsActive).CountAsync());
        var result = _deductionService.CalculatePAYE(avgSalary);
        return Ok(result);
    }

    [HttpPost("statutory-deductions/calculate-uif")]
    public async Task<IActionResult> CalculateUif([FromQuery] int financialYearId)
    {
        var totalRemuneration = await _db.PostEstablishments.Where(p => p.FinancialYearId == financialYearId && p.Status == PostStatus.Filled && p.IsActive).SumAsync(p => p.AnnualSalary);
        var monthlyRem = totalRemuneration / 12;
        var result = _deductionService.CalculateUIF(monthlyRem);
        return Ok(result);
    }

    [HttpPost("statutory-deductions/calculate-sdl")]
    public async Task<IActionResult> CalculateSdl([FromQuery] int financialYearId)
    {
        var totalRemuneration = await _db.PostEstablishments.Where(p => p.FinancialYearId == financialYearId && p.Status == PostStatus.Filled && p.IsActive).SumAsync(p => p.AnnualSalary);
        var result = _deductionService.CalculateSDL(totalRemuneration);
        return Ok(result);
    }

    [HttpPost("statutory-deductions/calculate-all-deductions")]
    public async Task<IActionResult> CalculateAllDeductions([FromQuery] int financialYearId)
    {
        var totalRemuneration = await _db.PostEstablishments.Where(p => p.FinancialYearId == financialYearId && p.Status == PostStatus.Filled && p.IsActive).SumAsync(p => p.AnnualSalary);
        var result = await _deductionService.CalculateAllDeductions(financialYearId, totalRemuneration);
        return Ok(result);
    }

    [HttpGet("payroll-liabilities")]
    public async Task<IActionResult> GetPayrollLiabilities([FromQuery] int? financialYearId)
    {
        var query = _db.PayrollLiabilities.AsQueryable();
        if (financialYearId.HasValue) query = query.Where(l => l.FinancialYearId == financialYearId);
        var liabilities = await query.OrderBy(l => l.LiabilityType).ThenBy(l => l.Department).Select(l => new PayrollLiabilityDto(l.Id, l.LiabilityType, l.Department, l.EmployeeContribution, l.EmployerContribution, l.TotalLiability, l.PaymentPeriod, l.FinancialYearId, l.ScoaItemCode, l.ScoaFundCode, l.ScoaFunctionCode, l.ScoaRegionCode)).ToListAsync();
        return Ok(liabilities);
    }

    [HttpPost("payroll-liabilities/calculate-liabilities")]
    public async Task<IActionResult> CalculateLiabilities([FromQuery] int financialYearId)
    {
        var result = await _deductionService.CalculatePayrollLiabilities(financialYearId);
        return Ok(result.Select(l => new PayrollLiabilityDto(l.Id, l.LiabilityType, l.Department, l.EmployeeContribution, l.EmployerContribution, l.TotalLiability, l.PaymentPeriod, l.FinancialYearId, l.ScoaItemCode, l.ScoaFundCode, l.ScoaFunctionCode, l.ScoaRegionCode)));
    }

    [HttpGet("dbo-entries")]
    public async Task<IActionResult> GetDboEntries([FromQuery] int? financialYearId)
    {
        var query = _db.DefinedBenefitObligations.AsQueryable();
        if (financialYearId.HasValue) query = query.Where(d => d.FinancialYearId == financialYearId);
        var entries = await query.OrderBy(d => d.BenefitType).Select(d => new DefinedBenefitObligationDto(d.Id, d.BenefitType.ToString(), d.Department, d.OpeningBalance, d.ServiceCost, d.InterestCost, d.BenefitPayments, d.ActuarialGainLoss, d.ClosingBalance, d.CurrentPortion, d.NonCurrentPortion, d.DiscountRate, d.InflationRate, d.SalaryGrowthRate, d.MortalityRate, d.TurnoverRate, d.FinancialYearId, d.ScoaItemCode, d.ScoaFundCode, d.ScoaFunctionCode, d.ScoaRegionCode)).ToListAsync();
        return Ok(entries);
    }

    [HttpPost("dbo-entries")]
    public async Task<IActionResult> CreateDboEntry([FromBody] CreateDefinedBenefitObligationDto dto)
    {
        if (!Enum.TryParse<DboBenefitType>(dto.BenefitType, true, out var bt)) return BadRequest("Invalid benefit type");
        var closingBalance = dto.OpeningBalance + dto.ServiceCost + dto.InterestCost - dto.BenefitPayments + dto.ActuarialGainLoss;
        var dbo = new DefinedBenefitObligation
        {
            BenefitType = bt, Department = dto.Department, OpeningBalance = dto.OpeningBalance,
            ServiceCost = dto.ServiceCost, InterestCost = dto.InterestCost, BenefitPayments = dto.BenefitPayments,
            ActuarialGainLoss = dto.ActuarialGainLoss, ClosingBalance = closingBalance,
            CurrentPortion = dto.BenefitPayments, NonCurrentPortion = closingBalance - dto.BenefitPayments,
            DiscountRate = dto.DiscountRate, InflationRate = dto.InflationRate, SalaryGrowthRate = dto.SalaryGrowthRate,
            MortalityRate = dto.MortalityRate, TurnoverRate = dto.TurnoverRate, FinancialYearId = dto.FinancialYearId,
            ScoaItemCode = dto.ScoaItemCode, ScoaFundCode = dto.ScoaFundCode, ScoaFunctionCode = dto.ScoaFunctionCode, ScoaRegionCode = dto.ScoaRegionCode
        };
        _db.DefinedBenefitObligations.Add(dbo);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("DefinedBenefitObligation", dbo.Id, "Created", "system", $"DBO '{dto.BenefitType}' created");
        return Ok(new DefinedBenefitObligationDto(dbo.Id, dbo.BenefitType.ToString(), dbo.Department, dbo.OpeningBalance, dbo.ServiceCost, dbo.InterestCost, dbo.BenefitPayments, dbo.ActuarialGainLoss, dbo.ClosingBalance, dbo.CurrentPortion, dbo.NonCurrentPortion, dbo.DiscountRate, dbo.InflationRate, dbo.SalaryGrowthRate, dbo.MortalityRate, dbo.TurnoverRate, dbo.FinancialYearId, dbo.ScoaItemCode, dbo.ScoaFundCode, dbo.ScoaFunctionCode, dbo.ScoaRegionCode));
    }

    [HttpPost("dbo-entries/calculate-dbo")]
    public async Task<IActionResult> CalculateDbo([FromQuery] int financialYearId)
    {
        var result = await _dboService.CalculateDboMovements(financialYearId, 0.098m, 0.052m, 0.06m);
        return Ok(result.Select(d => new DefinedBenefitObligationDto(d.Id, d.BenefitType.ToString(), d.Department, d.OpeningBalance, d.ServiceCost, d.InterestCost, d.BenefitPayments, d.ActuarialGainLoss, d.ClosingBalance, d.CurrentPortion, d.NonCurrentPortion, d.DiscountRate, d.InflationRate, d.SalaryGrowthRate, d.MortalityRate, d.TurnoverRate, d.FinancialYearId, d.ScoaItemCode, d.ScoaFundCode, d.ScoaFunctionCode, d.ScoaRegionCode)));
    }

    [HttpPost("dbo-entries/allocate-current-noncurrent")]
    public async Task<IActionResult> AllocateCurrentNonCurrent([FromQuery] int financialYearId)
    {
        var result = await _dboService.AllocateCurrentNonCurrent(financialYearId);
        return Ok(result.Select(d => new DefinedBenefitObligationDto(d.Id, d.BenefitType.ToString(), d.Department, d.OpeningBalance, d.ServiceCost, d.InterestCost, d.BenefitPayments, d.ActuarialGainLoss, d.ClosingBalance, d.CurrentPortion, d.NonCurrentPortion, d.DiscountRate, d.InflationRate, d.SalaryGrowthRate, d.MortalityRate, d.TurnoverRate, d.FinancialYearId, d.ScoaItemCode, d.ScoaFundCode, d.ScoaFunctionCode, d.ScoaRegionCode)));
    }

    [HttpGet("dbo-entries/dbo-summary")]
    public async Task<IActionResult> GetDboSummary([FromQuery] int? financialYearId)
    {
        var fyId = financialYearId ?? (await _db.FinancialYears.FirstAsync(f => f.IsActive)).Id;
        var result = await _dboService.GetDboSummary(fyId);
        return Ok(result);
    }

    [HttpGet("long-service-awards")]
    public async Task<IActionResult> GetLongServiceAwards([FromQuery] int? financialYearId)
    {
        var query = _db.LongServiceAwards.AsQueryable();
        if (financialYearId.HasValue) query = query.Where(l => l.FinancialYearId == financialYearId);
        var awards = await query.OrderBy(l => l.Department).ThenBy(l => l.MilestoneYears).Select(l => new LongServiceAwardDto(l.Id, l.Department, l.MilestoneYears, l.BenefitAmount, l.EligibleEmployees, l.EstimatedPayments, l.CurrentPortion, l.NonCurrentPortion, l.FinancialYearId, l.ScoaItemCode, l.ScoaFundCode, l.ScoaFunctionCode)).ToListAsync();
        return Ok(awards);
    }

    [HttpPost("long-service-awards")]
    public async Task<IActionResult> CreateLongServiceAward([FromBody] CreateLongServiceAwardDto dto)
    {
        var estimatedPayments = dto.BenefitAmount * dto.EligibleEmployees;
        var award = new LongServiceAward
        {
            Department = dto.Department, MilestoneYears = dto.MilestoneYears, BenefitAmount = dto.BenefitAmount,
            EligibleEmployees = dto.EligibleEmployees, EstimatedPayments = estimatedPayments,
            CurrentPortion = estimatedPayments, NonCurrentPortion = 0,
            FinancialYearId = dto.FinancialYearId,
            ScoaItemCode = dto.ScoaItemCode, ScoaFundCode = dto.ScoaFundCode, ScoaFunctionCode = dto.ScoaFunctionCode
        };
        _db.LongServiceAwards.Add(award);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("LongServiceAward", award.Id, "Created", "system", $"LSA for {dto.Department} {dto.MilestoneYears}yr created");
        return Ok(new LongServiceAwardDto(award.Id, award.Department, award.MilestoneYears, award.BenefitAmount, award.EligibleEmployees, award.EstimatedPayments, award.CurrentPortion, award.NonCurrentPortion, award.FinancialYearId, award.ScoaItemCode, award.ScoaFundCode, award.ScoaFunctionCode));
    }

    [HttpPost("long-service-awards/calculate-lsa-payments")]
    public async Task<IActionResult> CalculateLsaPayments([FromQuery] int financialYearId)
    {
        var result = await _dboService.CalculateLongServiceAwards(financialYearId);
        return Ok(result.Select(l => new LongServiceAwardDto(l.Id, l.Department, l.MilestoneYears, l.BenefitAmount, l.EligibleEmployees, l.EstimatedPayments, l.CurrentPortion, l.NonCurrentPortion, l.FinancialYearId, l.ScoaItemCode, l.ScoaFundCode, l.ScoaFunctionCode)));
    }

    [HttpGet("scenarios")]
    public async Task<IActionResult> GetScenarios([FromQuery] int? financialYearId)
    {
        var query = _db.PayrollScenarios.AsQueryable();
        if (financialYearId.HasValue) query = query.Where(s => s.FinancialYearId == financialYearId);
        var scenarios = await query.OrderBy(s => s.Name).Select(s => new PayrollScenarioDto(s.Id, s.Name, s.Description, s.SalaryIncreasePercent, s.VacancyFillingPercent, s.BenefitAdjustmentPercent, s.OvertimeAdjustmentPercent, s.TravelAdjustmentPercent, s.TotalBaselineCost, s.TotalScenarioCost, s.VarianceAmount, s.VariancePercent, s.Status.ToString(), s.FinancialYearId, s.CreatedBy, s.CreatedOn, s.ApprovedBy, s.ApprovedOn)).ToListAsync();
        return Ok(scenarios);
    }

    [HttpPost("scenarios")]
    public async Task<IActionResult> CreateScenario([FromBody] CreatePayrollScenarioDto dto)
    {
        var scenario = await _scenarioService.CreateScenario(dto);
        return Ok(new PayrollScenarioDto(scenario.Id, scenario.Name, scenario.Description, scenario.SalaryIncreasePercent, scenario.VacancyFillingPercent, scenario.BenefitAdjustmentPercent, scenario.OvertimeAdjustmentPercent, scenario.TravelAdjustmentPercent, scenario.TotalBaselineCost, scenario.TotalScenarioCost, scenario.VarianceAmount, scenario.VariancePercent, scenario.Status.ToString(), scenario.FinancialYearId, scenario.CreatedBy, scenario.CreatedOn, scenario.ApprovedBy, scenario.ApprovedOn));
    }

    [HttpPost("scenarios/{id}/calculate")]
    public async Task<IActionResult> CalculateScenario(int id)
    {
        var scenario = await _scenarioService.CalculateScenario(id);
        return Ok(new PayrollScenarioDto(scenario.Id, scenario.Name, scenario.Description, scenario.SalaryIncreasePercent, scenario.VacancyFillingPercent, scenario.BenefitAdjustmentPercent, scenario.OvertimeAdjustmentPercent, scenario.TravelAdjustmentPercent, scenario.TotalBaselineCost, scenario.TotalScenarioCost, scenario.VarianceAmount, scenario.VariancePercent, scenario.Status.ToString(), scenario.FinancialYearId, scenario.CreatedBy, scenario.CreatedOn, scenario.ApprovedBy, scenario.ApprovedOn));
    }

    [HttpGet("scenarios/compare")]
    public async Task<IActionResult> CompareScenarios([FromQuery] string ids)
    {
        var fyId = (await _db.FinancialYears.FirstAsync(f => f.IsActive)).Id;
        var result = await _scenarioService.CompareScenarios(fyId);
        return Ok(result);
    }

    [HttpGet("payroll-budget-lines")]
    public async Task<IActionResult> GetPayrollBudgetLines([FromQuery] int? financialYearId, [FromQuery] string? department)
    {
        var query = _db.PayrollBudgetLines.AsQueryable();
        if (financialYearId.HasValue) query = query.Where(l => l.FinancialYearId == financialYearId);
        if (!string.IsNullOrEmpty(department)) query = query.Where(l => l.Department == department);
        var lines = await query.OrderBy(l => l.Department).ThenBy(l => l.CostCategory).Select(l => new PayrollBudgetLineDto(l.Id, l.Department, l.CostCategory.ToString(), l.SubCategory, l.Year1Amount, l.Year2Amount, l.Year3Amount, l.Month01, l.Month02, l.Month03, l.Month04, l.Month05, l.Month06, l.Month07, l.Month08, l.Month09, l.Month10, l.Month11, l.Month12, l.Status.ToString(), l.FinancialYearId, l.ScoaItemCode, l.ScoaFundCode, l.ScoaFunctionCode, l.ScoaRegionCode, l.ScoaCostingCode)).ToListAsync();
        return Ok(lines);
    }

    [HttpPost("payroll-budget-lines/calculate-payroll-budget")]
    public async Task<IActionResult> CalculatePayrollBudget([FromQuery] int financialYearId)
    {
        await _calcService.CalculatePostBudget(financialYearId);
        var posts = await _db.PostEstablishments.Where(p => p.FinancialYearId == financialYearId && p.IsActive).ToListAsync();
        var variableBenefits = await _db.VariableBenefitHours.Where(v => v.FinancialYearId == financialYearId).ToListAsync();
        var councillors = await _db.CouncillorPositions.Where(c => c.FinancialYearId == financialYearId).ToListAsync();
        var wards = await _db.WardCommitteeBudgets.Where(w => w.FinancialYearId == financialYearId).ToListAsync();

        _db.PayrollBudgetLines.RemoveRange(_db.PayrollBudgetLines.Where(l => l.FinancialYearId == financialYearId));
        await _db.SaveChangesAsync();

        var groupedPosts = posts.GroupBy(p => p.Department ?? "Unknown");
        foreach (var group in groupedPosts)
        {
            var totalSalary = group.Sum(p => p.AnnualSalary);
            var totalCost = group.Sum(p => p.TotalCostToMunicipality);
            var monthly = Math.Round(totalSalary / 12, 2);
            var line = new PayrollBudgetLine
            {
                Department = group.Key, CostCategory = PayrollCostCategory.BasicSalary, SubCategory = "Salaries & Wages",
                Year1Amount = totalSalary, Year2Amount = Math.Round(totalSalary * 1.052m, 2), Year3Amount = Math.Round(totalSalary * 1.052m * 1.048m, 2),
                Month01 = monthly, Month02 = monthly, Month03 = monthly, Month04 = monthly, Month05 = monthly, Month06 = monthly,
                Month07 = monthly, Month08 = monthly, Month09 = monthly, Month10 = monthly, Month11 = monthly, Month12 = monthly,
                Status = HrBudgetStatus.Draft, FinancialYearId = financialYearId, ScoaItemCode = "3000", ScoaFundCode = "CF"
            };
            _db.PayrollBudgetLines.Add(line);
        }

        var totalVariableBenefits = variableBenefits.Sum(v => v.CalculatedCost);
        if (totalVariableBenefits > 0)
        {
            var vbMonthly = Math.Round(totalVariableBenefits / 12, 2);
            _db.PayrollBudgetLines.Add(new PayrollBudgetLine
            {
                Department = "All Departments", CostCategory = PayrollCostCategory.VariableBenefits, SubCategory = "Overtime & Standby",
                Year1Amount = totalVariableBenefits, Year2Amount = Math.Round(totalVariableBenefits * 1.052m, 2), Year3Amount = Math.Round(totalVariableBenefits * 1.052m * 1.048m, 2),
                Month01 = vbMonthly, Month02 = vbMonthly, Month03 = vbMonthly, Month04 = vbMonthly, Month05 = vbMonthly, Month06 = vbMonthly,
                Month07 = vbMonthly, Month08 = vbMonthly, Month09 = vbMonthly, Month10 = vbMonthly, Month11 = vbMonthly, Month12 = vbMonthly,
                Status = HrBudgetStatus.Draft, FinancialYearId = financialYearId, ScoaItemCode = "3000", ScoaFundCode = "CF"
            });
        }

        var totalCouncillorCost = councillors.Sum(c => c.AdjustedTotalRemuneration * c.NumberOfPositions);
        if (totalCouncillorCost > 0)
        {
            var cMonthly = Math.Round(totalCouncillorCost / 12, 2);
            _db.PayrollBudgetLines.Add(new PayrollBudgetLine
            {
                Department = "Councillors", CostCategory = PayrollCostCategory.CouncillorRemuneration, SubCategory = "Councillor Costs",
                Year1Amount = totalCouncillorCost, Year2Amount = Math.Round(totalCouncillorCost * 1.045m, 2), Year3Amount = Math.Round(totalCouncillorCost * 1.045m * 1.045m, 2),
                Month01 = cMonthly, Month02 = cMonthly, Month03 = cMonthly, Month04 = cMonthly, Month05 = cMonthly, Month06 = cMonthly,
                Month07 = cMonthly, Month08 = cMonthly, Month09 = cMonthly, Month10 = cMonthly, Month11 = cMonthly, Month12 = cMonthly,
                Status = HrBudgetStatus.Draft, FinancialYearId = financialYearId, ScoaItemCode = "3100", ScoaFundCode = "CF"
            });
        }

        var totalWardCost = wards.Sum(w => w.TotalEstimatedCost);
        if (totalWardCost > 0)
        {
            var wMonthly = Math.Round(totalWardCost / 12, 2);
            _db.PayrollBudgetLines.Add(new PayrollBudgetLine
            {
                Department = "Ward Committees", CostCategory = PayrollCostCategory.WardCommittee, SubCategory = "Ward Committee Stipends",
                Year1Amount = totalWardCost, Year2Amount = Math.Round(totalWardCost * 1.05m, 2), Year3Amount = Math.Round(totalWardCost * 1.05m * 1.05m, 2),
                Month01 = wMonthly, Month02 = wMonthly, Month03 = wMonthly, Month04 = wMonthly, Month05 = wMonthly, Month06 = wMonthly,
                Month07 = wMonthly, Month08 = wMonthly, Month09 = wMonthly, Month10 = wMonthly, Month11 = wMonthly, Month12 = wMonthly,
                Status = HrBudgetStatus.Draft, FinancialYearId = financialYearId, ScoaItemCode = "3100", ScoaFundCode = "CF"
            });
        }

        await _db.SaveChangesAsync();
        await _audit.LogAsync("PayrollBudgetLine", 0, "CalculateBudget", "system", $"Calculated payroll budget for FY {financialYearId}");
        return Ok(await _db.PayrollBudgetLines.Where(l => l.FinancialYearId == financialYearId).Select(l => new PayrollBudgetLineDto(l.Id, l.Department, l.CostCategory.ToString(), l.SubCategory, l.Year1Amount, l.Year2Amount, l.Year3Amount, l.Month01, l.Month02, l.Month03, l.Month04, l.Month05, l.Month06, l.Month07, l.Month08, l.Month09, l.Month10, l.Month11, l.Month12, l.Status.ToString(), l.FinancialYearId, l.ScoaItemCode, l.ScoaFundCode, l.ScoaFunctionCode, l.ScoaRegionCode, l.ScoaCostingCode)).ToListAsync());
    }

    [HttpPost("payroll-budget-lines/generate-budget-strings")]
    public async Task<IActionResult> GenerateBudgetStrings([FromBody] CalculatePayrollBudgetDto dto)
    {
        var version = await _db.BudgetVersions.FirstOrDefaultAsync(v => v.FinancialYearId == dto.FinancialYearId && v.Status == BudgetVersionStatus.Draft);
        if (version == null) return BadRequest("No active budget version found");
        var result = await _stringService.GenerateBudgetStrings(version.Id, dto.FinancialYearId);
        return Ok(result);
    }

    [HttpPost("payroll-budget-lines/validate-mscoa")]
    public async Task<IActionResult> ValidateMscoa([FromQuery] int financialYearId)
    {
        var result = await _stringService.ValidateMscoaStrings(financialYearId);
        return Ok(result);
    }

    [HttpPost("payroll-budget-lines/submit-all")]
    public async Task<IActionResult> SubmitAll([FromQuery] int financialYearId)
    {
        var lines = await _db.PayrollBudgetLines.Where(l => l.FinancialYearId == financialYearId && l.Status == HrBudgetStatus.Draft).ToListAsync();
        foreach (var line in lines) line.Status = HrBudgetStatus.Submitted;
        await _db.SaveChangesAsync();
        await _audit.LogAsync("PayrollBudgetLine", 0, "SubmitAll", "system", $"Submitted {lines.Count} budget lines");
        return Ok(new { submitted = lines.Count });
    }

    [HttpPost("payroll-budget-lines/approve/{id}")]
    public async Task<IActionResult> ApproveBudgetLine(int id, [FromBody] CreateHrPayrollBudgetApprovalDto dto)
    {
        if (!Enum.TryParse<ApprovalDecision>(dto.Decision, true, out var decision)) return BadRequest("Invalid decision");
        var approval = new HrPayrollBudgetApproval
        {
            EntityType = dto.EntityType, EntityId = dto.EntityId, Decision = decision,
            Comments = dto.Comments, ApprovedBy = "system", ApprovedAt = DateTime.UtcNow
        };
        _db.HrPayrollBudgetApprovals.Add(approval);

        if (dto.EntityType == "PayrollBudgetLine")
        {
            var line = await _db.PayrollBudgetLines.FindAsync(dto.EntityId);
            if (line != null) line.Status = decision == ApprovalDecision.Approved ? HrBudgetStatus.Approved : decision == ApprovalDecision.Rejected ? HrBudgetStatus.Rejected : HrBudgetStatus.Draft;
        }

        await _db.SaveChangesAsync();
        await _audit.LogAsync("HrPayrollBudgetApproval", approval.Id, dto.Decision, "system", dto.Comments ?? "");
        return Ok(new HrPayrollBudgetApprovalDto(approval.Id, approval.EntityType, approval.EntityId, approval.Decision.ToString(), approval.Comments, approval.ApprovedBy, approval.ApprovedAt));
    }

    [HttpGet("payroll-budget-lines/summary")]
    public async Task<IActionResult> GetPayrollBudgetSummary([FromQuery] int? financialYearId)
    {
        var fyId = financialYearId ?? (await _db.FinancialYears.FirstAsync(f => f.IsActive)).Id;
        var lines = await _db.PayrollBudgetLines.Where(l => l.FinancialYearId == fyId).ToListAsync();
        var posts = await _db.PostEstablishments.Where(p => p.FinancialYearId == fyId).ToListAsync();

        var summary = new PayrollBudgetSummaryDto(
            lines.Where(l => l.CostCategory == PayrollCostCategory.BasicSalary || l.CostCategory == PayrollCostCategory.EmployerContributions).Sum(l => l.Year1Amount),
            lines.Where(l => l.CostCategory == PayrollCostCategory.VariableBenefits || l.CostCategory == PayrollCostCategory.Travel || l.CostCategory == PayrollCostCategory.Provisions).Sum(l => l.Year1Amount),
            lines.Where(l => l.CostCategory == PayrollCostCategory.CouncillorRemuneration).Sum(l => l.Year1Amount),
            lines.Where(l => l.CostCategory == PayrollCostCategory.WardCommittee).Sum(l => l.Year1Amount),
            lines.Sum(l => l.Year1Amount),
            lines.Sum(l => l.Year1Amount),
            lines.Sum(l => l.Year2Amount),
            lines.Sum(l => l.Year3Amount),
            posts.Count, posts.Count(p => p.Status == PostStatus.Filled), posts.Count(p => p.Status == PostStatus.Vacant),
            posts.Count(p => p.Status == PostStatus.Vacant && p.IsFunded),
            lines.Select(l => new PayrollBudgetLineDto(l.Id, l.Department, l.CostCategory.ToString(), l.SubCategory, l.Year1Amount, l.Year2Amount, l.Year3Amount, l.Month01, l.Month02, l.Month03, l.Month04, l.Month05, l.Month06, l.Month07, l.Month08, l.Month09, l.Month10, l.Month11, l.Month12, l.Status.ToString(), l.FinancialYearId, l.ScoaItemCode, l.ScoaFundCode, l.ScoaFunctionCode, l.ScoaRegionCode, l.ScoaCostingCode)).ToList()
        );
        return Ok(summary);
    }

    [HttpPost("amend-budget")]
    public async Task<IActionResult> AmendBudget([FromBody] AmendBudgetDto dto)
    {
        var lines = await _db.PayrollBudgetLines.Where(l => l.FinancialYearId == dto.FinancialYearId).ToListAsync();
        if (!string.IsNullOrEmpty(dto.Department)) lines = lines.Where(l => l.Department == dto.Department).ToList();
        if (!string.IsNullOrEmpty(dto.CostCategory)) lines = lines.Where(l => l.CostCategory.ToString() == dto.CostCategory).ToList();
        foreach (var line in lines) { line.Year1Amount += dto.AdjustmentAmount; line.Status = HrBudgetStatus.Draft; }
        await _db.SaveChangesAsync();
        await _audit.LogAsync("PayrollBudgetLine", 0, "AmendBudget", "system", dto.Reason ?? $"Adjustment of {dto.AdjustmentAmount}");
        return Ok(new { amended = lines.Count });
    }

    [HttpPost("amend-dbo-estimates")]
    public async Task<IActionResult> AmendDboEstimates([FromBody] AmendDboEstimatesDto dto)
    {
        if (!Enum.TryParse<DboBenefitType>(dto.BenefitType, true, out var bt)) return BadRequest("Invalid benefit type");
        var dbos = await _db.DefinedBenefitObligations.Where(d => d.FinancialYearId == dto.FinancialYearId && d.BenefitType == bt).ToListAsync();
        foreach (var dbo in dbos)
        {
            if (dto.ServiceCost.HasValue) dbo.ServiceCost = dto.ServiceCost.Value;
            if (dto.InterestCost.HasValue) dbo.InterestCost = dto.InterestCost.Value;
            if (dto.BenefitPayments.HasValue) dbo.BenefitPayments = dto.BenefitPayments.Value;
            if (dto.ActuarialGainLoss.HasValue) dbo.ActuarialGainLoss = dto.ActuarialGainLoss.Value;
            dbo.ClosingBalance = dbo.OpeningBalance + dbo.ServiceCost + dbo.InterestCost - dbo.BenefitPayments + dbo.ActuarialGainLoss;
        }
        await _db.SaveChangesAsync();
        await _audit.LogAsync("DefinedBenefitObligation", 0, "AmendEstimates", "system", dto.Reason ?? "DBO estimates amended");
        return Ok(new { amended = dbos.Count });
    }

    [HttpPost("amend-mscoa-linkage")]
    public async Task<IActionResult> AmendMscoaLinkage([FromBody] AmendMscoaLinkageDto dto)
    {
        switch (dto.EntityType)
        {
            case "PostEstablishment":
                var post = await _db.PostEstablishments.FindAsync(dto.EntityId);
                if (post == null) return NotFound();
                if (dto.ScoaItemCode != null) post.ScoaItemCode = dto.ScoaItemCode;
                if (dto.ScoaFundCode != null) post.ScoaFundCode = dto.ScoaFundCode;
                if (dto.ScoaFunctionCode != null) post.ScoaFunctionCode = dto.ScoaFunctionCode;
                if (dto.ScoaRegionCode != null) post.ScoaRegionCode = dto.ScoaRegionCode;
                if (dto.ScoaCostingCode != null) post.ScoaCostingCode = dto.ScoaCostingCode;
                break;
            case "PayrollBudgetLine":
                var line = await _db.PayrollBudgetLines.FindAsync(dto.EntityId);
                if (line == null) return NotFound();
                if (dto.ScoaItemCode != null) line.ScoaItemCode = dto.ScoaItemCode;
                if (dto.ScoaFundCode != null) line.ScoaFundCode = dto.ScoaFundCode;
                if (dto.ScoaFunctionCode != null) line.ScoaFunctionCode = dto.ScoaFunctionCode;
                if (dto.ScoaRegionCode != null) line.ScoaRegionCode = dto.ScoaRegionCode;
                if (dto.ScoaCostingCode != null) line.ScoaCostingCode = dto.ScoaCostingCode;
                break;
            default: return BadRequest("Invalid entity type");
        }
        await _db.SaveChangesAsync();
        await _audit.LogAsync(dto.EntityType, dto.EntityId, "AmendMscoa", "system", $"mSCOA linkage updated");
        return Ok();
    }

    [HttpPost("amend-variable-hours")]
    public async Task<IActionResult> AmendVariableHours([FromBody] AmendVariableHoursDto dto)
    {
        var hours = await _db.VariableBenefitHours.FindAsync(dto.Id);
        if (hours == null) return NotFound();
        hours.EstimatedHours = dto.EstimatedHours;
        hours.AverageRate = dto.AverageRate;
        hours.CalculatedCost = dto.EstimatedHours * dto.AverageRate;
        if (hours.HistoricalCost > 0) hours.VariancePercent = Math.Round((hours.CalculatedCost - hours.HistoricalCost!.Value) / hours.HistoricalCost.Value * 100, 2);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("VariableBenefitHours", dto.Id, "AmendHours", "system", dto.Reason ?? "Hours amended");
        return Ok();
    }

    [HttpPost("amend-payment-percentages")]
    public async Task<IActionResult> AmendPaymentPercentages([FromBody] AmendPaymentPercentagesDto dto)
    {
        var lines = await _db.PayrollBudgetLines.Where(l => l.FinancialYearId == dto.FinancialYearId).ToListAsync();
        if (!string.IsNullOrEmpty(dto.Department)) lines = lines.Where(l => l.Department == dto.Department).ToList();
        foreach (var line in lines)
        {
            var total = line.Year1Amount;
            line.Month01 = Math.Round(total * dto.Month01 / 100, 2);
            line.Month02 = Math.Round(total * dto.Month02 / 100, 2);
            line.Month03 = Math.Round(total * dto.Month03 / 100, 2);
            line.Month04 = Math.Round(total * dto.Month04 / 100, 2);
            line.Month05 = Math.Round(total * dto.Month05 / 100, 2);
            line.Month06 = Math.Round(total * dto.Month06 / 100, 2);
            line.Month07 = Math.Round(total * dto.Month07 / 100, 2);
            line.Month08 = Math.Round(total * dto.Month08 / 100, 2);
            line.Month09 = Math.Round(total * dto.Month09 / 100, 2);
            line.Month10 = Math.Round(total * dto.Month10 / 100, 2);
            line.Month11 = Math.Round(total * dto.Month11 / 100, 2);
            line.Month12 = Math.Round(total * dto.Month12 / 100, 2);
        }
        await _db.SaveChangesAsync();
        await _audit.LogAsync("PayrollBudgetLine", 0, "AmendPaymentPercentages", "system", "Payment percentages amended");
        return Ok(new { amended = lines.Count });
    }
}
