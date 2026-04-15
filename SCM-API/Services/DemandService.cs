using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;
using SCM_API.Data;
using SCM_API.Helpers;
using SCM_API.Models.Common;
using SCM_API.Models.Domain;
using SCM_API.Models.DTOs;
using SCM_API.Services.Interfaces;

namespace SCM_API.Services;

public class DemandService : IDemandService
{
    private readonly ILogger<DemandService> _logger;
    private readonly ApplicationDbContext _context;
    private readonly DbAvailabilityChecker _dbChecker;
    private readonly IHttpContextAccessor _httpContextAccessor;

    private static readonly ConcurrentDictionary<int, DemandPlanDto> _plans = new();
    private static readonly ConcurrentDictionary<int, DemandPlanItemDto> _items = new();
    private static readonly ConcurrentDictionary<int, NeedsAssessmentDto> _needs = new();
    private static readonly ConcurrentDictionary<int, SpecificationDto> _specs = new();
    private static readonly ConcurrentDictionary<int, MarketAnalysisDto> _marketAnalyses = new();
    private static readonly ConcurrentDictionary<int, AggregationDto> _aggregations = new();
    private static int _nextPlanId = 100;
    private static int _nextItemId = 1000;
    private static int _nextNeedId = 200;
    private static int _nextSpecId = 300;
    private static int _nextMarketId = 400;
    private static int _nextAggId = 500;
    private static bool _seeded = false;
    private static readonly object _seedLock = new();

    private static readonly ConcurrentDictionary<int, string> _departmentNames = new();

    private static readonly Dictionary<int, string> _departments = new()
    {
        { 1, "Corporate Services" },
        { 2, "Financial Services" },
        { 3, "Community Services" },
        { 4, "Technical Services" },
        { 5, "Infrastructure Development" },
        { 6, "Planning & Development" },
        { 7, "Electro-Technical Services" },
        { 8, "Public Safety" },
        { 9, "Water & Sanitation" },
        { 10, "Environmental Management" }
    };

    private static readonly Dictionary<int, string> _statusNames = new()
    {
        { 1, "Draft" }, { 2, "Submitted" }, { 3, "Reviewed" }, { 4, "Approved" }, { 5, "Rejected" }
    };

    private bool UseDb => _dbChecker.IsDbAvailable;

    public DemandService(
        ILogger<DemandService> logger,
        ApplicationDbContext context,
        DbAvailabilityChecker dbChecker,
        IHttpContextAccessor httpContextAccessor)
    {
        _logger = logger;
        _context = context;
        _dbChecker = dbChecker;
        _httpContextAccessor = httpContextAccessor;
        EnsureSeeded();
        LoadDepartmentNames();
    }

    private void LoadDepartmentNames()
    {
        if (_departmentNames.Count > 0 || !UseDb) return;
        try
        {
            var depts = _context.Departments.Where(d => d.Enabled == true).ToList();
            foreach (var d in depts)
                _departmentNames.TryAdd(d.DepartmentId, d.DepartmentDesc ?? $"Department {d.DepartmentId}");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to load department names from DB");
        }
    }

    private string GetDepartmentName(int? deptId)
    {
        if (!deptId.HasValue) return "Unassigned";
        if (_departmentNames.TryGetValue(deptId.Value, out var name)) return name;
        if (_departments.TryGetValue(deptId.Value, out var staticName)) return staticName;
        return $"Department {deptId}";
    }

    private string GetCurrentUser()
    {
        var user = _httpContextAccessor.HttpContext?.User;
        return user?.Identity?.Name ?? user?.FindFirst("name")?.Value ?? "System";
    }

    private static bool ShouldSeedMockData =>
        string.Equals(Environment.GetEnvironmentVariable("USE_MOCK_DATA"), "true", StringComparison.OrdinalIgnoreCase);

    private void EnsureSeeded()
    {
        if (_seeded) return;
        lock (_seedLock)
        {
            if (_seeded) return;
            if (ShouldSeedMockData || !UseDb)
                SeedData();
            _seeded = true;
        }
    }

    private DemandPlanDto EntityToDto(DemandPlan entity)
    {
        var deptName = GetDepartmentName(entity.DepartmentId);
        var planItems = entity.Items?.Select(ItemEntityToDto).ToList() ?? new List<DemandPlanItemDto>();
        var totalDemand = entity.TotalDemand ?? planItems.Sum(i => i.EstimatedValue);
        var totalBudget = entity.TotalBudget ?? 0;

        var dto = new DemandPlanDto
        {
            Id = entity.DemandPlanId,
            ReferenceNumber = entity.ReferenceNumber ?? $"DP-{entity.DateCaptured?.Year ?? DateTime.UtcNow.Year}-{entity.DemandPlanId:D3}",
            Title = entity.Title ?? entity.Description ?? "",
            DepartmentId = entity.DepartmentId,
            DepartmentName = deptName,
            DepartmentCode = deptName.Length >= 2 ? deptName[..2].ToUpper() : "XX",
            FinancialYear = entity.FinancialYear ?? "",
            Vote = entity.Vote ?? "",
            Description = entity.Description ?? "",
            StatusId = entity.StatusId ?? 1,
            Status = _statusNames.GetValueOrDefault(entity.StatusId ?? 1, "Draft"),
            TotalBudget = totalBudget,
            TotalDemand = totalDemand,
            IdpReference = entity.IdpReference ?? "",
            IdpObjective = entity.IdpObjective ?? "",
            SdbipReference = entity.SdbipReference ?? "",
            SdbipIndicator = entity.SdbipIndicator ?? "",
            Priority = entity.Priority ?? "Medium",
            RiskLevel = entity.RiskLevel ?? "low",
            Notes = entity.Notes ?? "",
            CreatedBy = entity.CreatedBy ?? "",
            CreatedByName = entity.CreatedByName ?? "",
            CreatedDate = entity.DateCaptured ?? DateTime.UtcNow,
            ReviewedByName = entity.ReviewedByName,
            ReviewedDate = entity.ReviewedDate,
            ApprovedByName = entity.ApprovedByName,
            ApprovedDate = entity.ApprovedDate,
            RejectionReason = entity.RejectionReason,
            Enabled = entity.Enabled ?? true,
            Items = planItems,
            BudgetUtilisation = totalBudget > 0 ? (int)Math.Round(totalDemand / totalBudget * 100) : 0,
            BudgetVariance = new DemandBudgetVariance { Amount = totalBudget - totalDemand },
            ComplianceScore = CalculateComplianceFromEntity(entity, planItems.Count)
        };

        dto.PriorityBreakdown = new DemandPriorityBreakdown
        {
            Critical = planItems.Count(i => string.Equals(i.Priority, "Critical", StringComparison.OrdinalIgnoreCase)),
            High = planItems.Count(i => string.Equals(i.Priority, "High", StringComparison.OrdinalIgnoreCase)),
            Medium = planItems.Count(i => string.Equals(i.Priority, "Medium", StringComparison.OrdinalIgnoreCase)),
            Low = planItems.Count(i => string.Equals(i.Priority, "Low", StringComparison.OrdinalIgnoreCase))
        };
        dto.ProcurementMethodSummary = planItems.GroupBy(i => i.ProcurementMethod ?? "Unspecified").ToDictionary(g => g.Key, g => g.Count());

        return dto;
    }

    private static DemandPlanItemDto ItemEntityToDto(DemandPlanItem entity)
    {
        return new DemandPlanItemDto
        {
            Id = entity.DemandPlanItemId,
            DemandPlanId = entity.DemandPlanId,
            Description = entity.Description ?? "",
            Quantity = entity.Quantity ?? 1,
            UnitOfMeasure = entity.UnitOfMeasure ?? "Each",
            UnitPrice = entity.UnitPrice ?? 0,
            EstimatedValue = entity.EstimatedValue ?? (entity.UnitPrice ?? 0) * (entity.Quantity ?? 1),
            Category = entity.Category ?? "",
            ProcurementMethod = entity.ProcurementMethod ?? "RFQ",
            Priority = entity.Priority ?? "Medium",
            DeliveryQuarter = entity.DeliveryQuarter ?? "Q1",
            Status = entity.Status ?? "Planned",
            MscoaSegment = entity.MscoaSegment,
            NeedsAssessmentId = entity.NeedsAssessmentId,
            SpecificationId = entity.SpecificationId
        };
    }

    private static NeedsAssessmentDto NeedEntityToDto(NeedsAssessment entity, string deptName)
    {
        return new NeedsAssessmentDto
        {
            Id = entity.NeedsAssessmentId,
            ReferenceNumber = entity.ReferenceNumber ?? $"NA-{entity.DateCaptured?.Year ?? DateTime.UtcNow.Year}-{entity.NeedsAssessmentId:D3}",
            Title = entity.Title ?? "",
            DepartmentId = entity.DepartmentId,
            DepartmentName = deptName,
            Priority = entity.Priority ?? "Medium",
            Justification = entity.Justification ?? "",
            CurrentSituation = entity.CurrentSituation ?? "",
            ProposedSolution = entity.ProposedSolution ?? "",
            EstimatedCost = entity.EstimatedCost ?? 0,
            Status = entity.Status ?? "draft",
            RiskFactors = entity.RiskFactors ?? "",
            CreatedBy = entity.CreatedBy ?? "",
            CreatedByName = entity.CreatedByName ?? "",
            CreatedDate = entity.DateCaptured ?? DateTime.UtcNow,
            Category = entity.Category ?? "",
            LinkedPlanId = entity.LinkedPlanId
        };
    }

    private int CalculateComplianceFromEntity(DemandPlan entity, int itemCount)
    {
        int score = 0;
        if (!string.IsNullOrEmpty(entity.IdpReference)) score += 20;
        if (!string.IsNullOrEmpty(entity.SdbipReference)) score += 20;
        if ((entity.TotalBudget ?? 0) > 0) score += 20;
        if (itemCount > 0) score += 20;
        if (!string.IsNullOrEmpty(entity.Vote)) score += 10;
        if (!string.IsNullOrEmpty(entity.Description)) score += 10;
        return score;
    }

    public async Task<DemandDashboardDto> GetDashboardAsync()
    {
        if (UseDb)
        {
            try
            {
                var plans = await _context.DemandPlans
                    .Where(p => p.Enabled == true)
                    .Include(p => p.Items.Where(i => i.Enabled != false))
                    .ToListAsync();

                var needsCount = await _context.NeedsAssessments.Where(n => n.Enabled != false).CountAsync();
                var completedNeeds = await _context.NeedsAssessments
                    .Where(n => n.Enabled != false && (n.Status == "completed" || n.Status == "approved"))
                    .CountAsync();

                var allItems = plans.SelectMany(p => p.Items).ToList();
                var totalDemand = plans.Sum(p => p.TotalDemand ?? allItems.Where(i => i.DemandPlanId == p.DemandPlanId).Sum(i => i.EstimatedValue ?? 0));
                var totalBudget = plans.Sum(p => p.TotalBudget ?? 0);

                return BuildDashboard(plans, allItems, needsCount, completedNeeds, totalDemand, totalBudget);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB dashboard query failed, falling back to in-memory");
                _dbChecker.MarkUnavailable();
            }
        }

        return BuildDashboardFromMemory();
    }

    private DemandDashboardDto BuildDashboard(List<DemandPlan> plans, List<DemandPlanItem> allItems,
        int needsCount, int completedNeeds, decimal totalDemand, decimal totalBudget)
    {
        var itemDtos = allItems.Select(ItemEntityToDto).ToList();
        return new DemandDashboardDto
        {
            TotalPlans = plans.Count,
            DraftPlans = plans.Count(p => p.StatusId == 1),
            SubmittedPlans = plans.Count(p => p.StatusId == 2),
            ReviewedPlans = plans.Count(p => p.StatusId == 3),
            ApprovedPlans = plans.Count(p => p.StatusId == 4),
            RejectedPlans = plans.Count(p => p.StatusId == 5),
            TotalDemandValue = totalDemand,
            TotalBudgetValue = totalBudget,
            BudgetCoverage = totalDemand > 0 ? Math.Round(totalBudget / totalDemand * 100, 0) : 0,
            TotalItems = allItems.Count,
            CompletedAssessments = completedNeeds,
            TotalAssessments = needsCount,
            CurrentFinancialYear = $"{DateTime.UtcNow.Year}/{DateTime.UtcNow.Year + 1}",
            OverdueItems = allItems.Count(i => i.DeliveryQuarter == "Q1" || i.DeliveryQuarter == "Q2"),
            ComplianceScore = plans.Any() ? Math.Round(plans.Average(p => (decimal)CalculateComplianceFromEntity(p, p.Items.Count)), 0) : 0,
            ConversionRate = allItems.Count > 0 ? Math.Round((decimal)allItems.Count(i => i.Status != "Planned") / allItems.Count * 100) : 0,
            SpecificationsReady = allItems.Count(i => !string.IsNullOrEmpty(i.MscoaSegment)),
            SpecificationsTotal = allItems.Count,
            AggregationSavings = Math.Round(allItems.GroupBy(i => i.Category).Where(g => g.Count() > 1).Sum(g => g.Sum(i => i.EstimatedValue ?? 0) * 0.05m)),
            AggregationGroups = allItems.GroupBy(i => i.Category).Count(g => g.Count() > 1),
            CategoryBreakdown = BuildCategoryBreakdown(itemDtos),
            ProcurementMethodBreakdown = BuildProcurementMethodBreakdown(itemDtos),
            QuarterlyPipeline = BuildQuarterlyPipelineFromItems(itemDtos),
            RiskSummary = new
            {
                high = plans.Count(p => string.Equals(p.RiskLevel, "high", StringComparison.OrdinalIgnoreCase)),
                medium = plans.Count(p => string.Equals(p.RiskLevel, "medium", StringComparison.OrdinalIgnoreCase)),
                low = plans.Count(p => string.Equals(p.RiskLevel, "low", StringComparison.OrdinalIgnoreCase))
            },
            StatusDistribution = new Dictionary<string, int>
            {
                { "draft", plans.Count(p => p.StatusId == 1) },
                { "submitted", plans.Count(p => p.StatusId == 2) },
                { "reviewed", plans.Count(p => p.StatusId == 3) },
                { "approved", plans.Count(p => p.StatusId == 4) },
                { "rejected", plans.Count(p => p.StatusId == 5) }
            },
            ByDepartment = plans.GroupBy(p => GetDepartmentName(p.DepartmentId)).Select(g => new DepartmentBreakdownDto
            {
                Department = g.Key,
                Plans = g.Count(),
                Value = g.Sum(p => p.TotalDemand ?? 0),
                Items = g.SelectMany(p => p.Items).Count(),
                Compliance = Math.Round(g.Average(p => (decimal)CalculateComplianceFromEntity(p, p.Items.Count)), 0),
                BudgetUtil = g.Average(p => p.TotalBudget > 0 ? Math.Round((p.TotalDemand ?? 0) / (p.TotalBudget ?? 1) * 100, 0) : 0),
                Status = g.All(p => CalculateComplianceFromEntity(p, p.Items.Count) >= 90) ? "compliant" : "attention"
            }).ToList()
        };
    }

    private DemandDashboardDto BuildDashboardFromMemory()
    {
        var plans = _plans.Values.ToList();
        var items = _items.Values.ToList();
        var needs = _needs.Values.ToList();
        var totalDemand = plans.Sum(p => p.TotalDemand);
        var totalBudget = plans.Sum(p => p.TotalBudget);

        return new DemandDashboardDto
        {
            TotalPlans = plans.Count,
            DraftPlans = plans.Count(p => p.StatusId == 1),
            SubmittedPlans = plans.Count(p => p.StatusId == 2),
            ReviewedPlans = plans.Count(p => p.StatusId == 3),
            ApprovedPlans = plans.Count(p => p.StatusId == 4),
            RejectedPlans = plans.Count(p => p.StatusId == 5),
            TotalDemandValue = totalDemand,
            TotalBudgetValue = totalBudget,
            BudgetCoverage = totalDemand > 0 ? Math.Round(totalBudget / totalDemand * 100, 0) : 0,
            TotalItems = items.Count,
            CompletedAssessments = needs.Count(n => n.Status == "completed" || n.Status == "approved"),
            TotalAssessments = needs.Count,
            CurrentFinancialYear = $"{DateTime.UtcNow.Year}/{DateTime.UtcNow.Year + 1}",
            OverdueItems = items.Count(i => string.Equals(i.DeliveryQuarter, "Q1", StringComparison.OrdinalIgnoreCase) || string.Equals(i.DeliveryQuarter, "Q2", StringComparison.OrdinalIgnoreCase)),
            ComplianceScore = plans.Any() ? Math.Round(plans.Average(p => (decimal)p.ComplianceScore), 0) : 0,
            ConversionRate = items.Count > 0 ? Math.Round((decimal)items.Count(i => i.Status != "Planned") / items.Count * 100) : 0,
            SpecificationsReady = items.Count(i => !string.IsNullOrEmpty(i.MscoaSegment)),
            SpecificationsTotal = items.Count,
            AggregationSavings = Math.Round(items.GroupBy(i => i.Category).Where(g => g.Count() > 1).Sum(g => g.Sum(i => i.EstimatedValue) * 0.05m)),
            AggregationGroups = items.GroupBy(i => i.Category).Count(g => g.Count() > 1),
            CategoryBreakdown = BuildCategoryBreakdown(items),
            ProcurementMethodBreakdown = BuildProcurementMethodBreakdown(items),
            QuarterlyPipeline = BuildQuarterlyPipelineFromItems(items),
            RiskSummary = new { high = plans.Count(p => string.Equals(p.RiskLevel, "high", StringComparison.OrdinalIgnoreCase)), medium = plans.Count(p => string.Equals(p.RiskLevel, "medium", StringComparison.OrdinalIgnoreCase)), low = plans.Count(p => string.Equals(p.RiskLevel, "low", StringComparison.OrdinalIgnoreCase)) },
            StatusDistribution = new Dictionary<string, int>
            {
                { "draft", plans.Count(p => p.StatusId == 1) },
                { "submitted", plans.Count(p => p.StatusId == 2) },
                { "reviewed", plans.Count(p => p.StatusId == 3) },
                { "approved", plans.Count(p => p.StatusId == 4) },
                { "rejected", plans.Count(p => p.StatusId == 5) }
            },
            ByDepartment = plans.GroupBy(p => p.DepartmentName).Select(g => new DepartmentBreakdownDto
            {
                Department = g.Key,
                Plans = g.Count(),
                Value = g.Sum(p => p.TotalDemand),
                Items = items.Count(i => g.Any(p => p.Id == i.DemandPlanId)),
                Compliance = Math.Round(g.Average(p => (decimal)p.ComplianceScore), 0),
                BudgetUtil = Math.Round(g.Average(p => (decimal)p.BudgetUtilisation), 0),
                Status = g.All(p => p.ComplianceScore >= 90) ? "compliant" : "attention"
            }).ToList()
        };
    }

    public async Task<PagedResult<DemandPlanDto>> GetAllPlansAsync(string? financialYear, int? departmentId, string? department, string? status, string? search, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var query = _context.DemandPlans
                    .Where(p => p.Enabled == true)
                    .Include(p => p.Items.Where(i => i.Enabled != false))
                    .AsQueryable();

                if (!string.IsNullOrEmpty(financialYear))
                    query = query.Where(p => p.FinancialYear == financialYear);
                if (departmentId.HasValue)
                    query = query.Where(p => p.DepartmentId == departmentId.Value);
                if (!string.IsNullOrEmpty(status))
                {
                    var statusId = _statusNames.FirstOrDefault(s => string.Equals(s.Value, status, StringComparison.OrdinalIgnoreCase)).Key;
                    if (statusId > 0) query = query.Where(p => p.StatusId == statusId);
                }
                if (!string.IsNullOrEmpty(search))
                    query = query.Where(p =>
                        (p.Title != null && p.Title.Contains(search)) ||
                        (p.ReferenceNumber != null && p.ReferenceNumber.Contains(search)) ||
                        (p.Description != null && p.Description.Contains(search)));

                var totalCount = await query.CountAsync();
                var entities = await query
                    .OrderByDescending(p => p.DateCaptured)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return new PagedResult<DemandPlanDto>
                {
                    Items = entities.Select(EntityToDto),
                    Page = page,
                    PageSize = pageSize,
                    TotalCount = totalCount
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB query failed for demand plans, falling back to in-memory");
                _dbChecker.MarkUnavailable();
            }
        }

        return GetAllPlansFromMemory(financialYear, departmentId, department, status, search, page, pageSize);
    }

    private PagedResult<DemandPlanDto> GetAllPlansFromMemory(string? financialYear, int? departmentId, string? department, string? status, string? search, int page, int pageSize)
    {
        var query = _plans.Values.AsEnumerable();
        if (!string.IsNullOrEmpty(financialYear))
            query = query.Where(p => p.FinancialYear == financialYear);
        if (departmentId.HasValue)
            query = query.Where(p => p.DepartmentId == departmentId.Value);
        else if (!string.IsNullOrEmpty(department))
            query = query.Where(p => string.Equals(p.DepartmentName, department, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrEmpty(status))
            query = query.Where(p => string.Equals(p.Status, status, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrEmpty(search))
            query = query.Where(p =>
                (p.Title?.Contains(search, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (p.ReferenceNumber?.Contains(search, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (p.DepartmentName?.Contains(search, StringComparison.OrdinalIgnoreCase) ?? false));

        var total = query.Count();
        var items = query.OrderByDescending(p => p.CreatedDate).Skip((page - 1) * pageSize).Take(pageSize).ToList();
        foreach (var plan in items)
            plan.Items = _items.Values.Where(i => i.DemandPlanId == plan.Id).ToList();

        return new PagedResult<DemandPlanDto> { Items = items, Page = page, PageSize = pageSize, TotalCount = total };
    }

    public async Task<DemandPlanDto?> GetPlanByIdAsync(int id)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _context.DemandPlans
                    .Include(p => p.Items.Where(i => i.Enabled != false))
                    .FirstOrDefaultAsync(p => p.DemandPlanId == id && p.Enabled == true);
                if (entity != null) return EntityToDto(entity);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB read failed for demand plan {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_plans.TryGetValue(id, out var plan)) return null;
        plan.Items = _items.Values.Where(i => i.DemandPlanId == id).ToList();
        return plan;
    }

    public async Task<DemandPlanDto> CreatePlanAsync(CreateDemandPlanRequest request)
    {
        var userName = GetCurrentUser();
        var deptName = GetDepartmentName(request.DepartmentId);

        if (UseDb)
        {
            try
            {
                var entity = new DemandPlan
                {
                    DepartmentId = request.DepartmentId,
                    FinancialYear = request.FinancialYear,
                    Description = request.Description,
                    Title = request.Title,
                    Vote = request.Vote,
                    TotalBudget = request.TotalBudget,
                    IdpReference = request.IdpReference,
                    IdpObjective = request.IdpObjective,
                    SdbipReference = request.SdbipReference,
                    SdbipIndicator = request.SdbipIndicator,
                    Priority = request.Priority,
                    Notes = request.Notes,
                    StatusId = 1,
                    Enabled = true,
                    DateCaptured = DateTime.UtcNow,
                    CreatedBy = userName,
                    CreatedByName = userName
                };

                await _context.DemandPlans.AddAsync(entity);
                await _context.SaveChangesAsync();

                entity.ReferenceNumber = $"DP-{DateTime.UtcNow.Year}-{entity.DemandPlanId:D3}";
                await _context.SaveChangesAsync();

                _logger.LogInformation("Created demand plan {Id} in DB", entity.DemandPlanId);
                return EntityToDto(entity);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB create failed for demand plan, falling back to in-memory");
                _dbChecker.MarkUnavailable();
            }
        }

        return CreatePlanInMemory(request, userName, deptName);
    }

    private DemandPlanDto CreatePlanInMemory(CreateDemandPlanRequest request, string userName, string deptName)
    {
        var id = Interlocked.Increment(ref _nextPlanId);
        var plan = new DemandPlanDto
        {
            Id = id,
            ReferenceNumber = $"DP-{DateTime.UtcNow.Year}-{id:D3}",
            Title = request.Title,
            DepartmentId = request.DepartmentId,
            DepartmentName = deptName,
            DepartmentCode = deptName.Length >= 2 ? deptName[..2].ToUpper() : "XX",
            FinancialYear = request.FinancialYear,
            Vote = request.Vote,
            Description = request.Description,
            StatusId = 1,
            Status = "Draft",
            TotalBudget = request.TotalBudget,
            TotalDemand = 0,
            IdpReference = request.IdpReference,
            IdpObjective = request.IdpObjective,
            SdbipReference = request.SdbipReference,
            SdbipIndicator = request.SdbipIndicator,
            Priority = request.Priority,
            Notes = request.Notes,
            CreatedBy = userName,
            CreatedByName = userName,
            CreatedDate = DateTime.UtcNow,
            BudgetVariance = new DemandBudgetVariance { Amount = request.TotalBudget },
            AuditTrail = new List<DemandAuditEntryDto>
            {
                new() { Action = "Created", By = userName, Date = DateTime.UtcNow.ToString("yyyy-MM-dd"), Notes = "Demand plan created" }
            }
        };
        plan.ComplianceScore = CalculateCompliance(plan);
        _plans[id] = plan;
        return plan;
    }

    public async Task<DemandPlanDto?> UpdatePlanAsync(int id, UpdateDemandPlanRequest request)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _context.DemandPlans
                    .Include(p => p.Items.Where(i => i.Enabled != false))
                    .FirstOrDefaultAsync(p => p.DemandPlanId == id && p.Enabled == true);
                if (entity == null) return null;

                if (request.Title != null) entity.Title = request.Title;
                if (request.Description != null) entity.Description = request.Description;
                if (request.TotalBudget.HasValue) entity.TotalBudget = request.TotalBudget;
                if (request.Vote != null) entity.Vote = request.Vote;
                if (request.IdpReference != null) entity.IdpReference = request.IdpReference;
                if (request.IdpObjective != null) entity.IdpObjective = request.IdpObjective;
                if (request.SdbipReference != null) entity.SdbipReference = request.SdbipReference;
                if (request.SdbipIndicator != null) entity.SdbipIndicator = request.SdbipIndicator;
                if (request.Priority != null) entity.Priority = request.Priority;
                if (request.Notes != null) entity.Notes = request.Notes;
                entity.DateModified = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return EntityToDto(entity);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB update failed for demand plan {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        return UpdatePlanInMemory(id, request);
    }

    private DemandPlanDto? UpdatePlanInMemory(int id, UpdateDemandPlanRequest request)
    {
        if (!_plans.TryGetValue(id, out var plan)) return null;
        if (request.Title != null) plan.Title = request.Title;
        if (request.Description != null) plan.Description = request.Description;
        if (request.TotalBudget.HasValue) plan.TotalBudget = request.TotalBudget.Value;
        if (request.Vote != null) plan.Vote = request.Vote;
        if (request.IdpReference != null) plan.IdpReference = request.IdpReference;
        if (request.IdpObjective != null) plan.IdpObjective = request.IdpObjective;
        if (request.SdbipReference != null) plan.SdbipReference = request.SdbipReference;
        if (request.SdbipIndicator != null) plan.SdbipIndicator = request.SdbipIndicator;
        if (request.Priority != null) plan.Priority = request.Priority;
        if (request.Notes != null) plan.Notes = request.Notes;
        plan.ComplianceScore = CalculateCompliance(plan);
        plan.AuditTrail.Add(new DemandAuditEntryDto { Action = "Updated", By = GetCurrentUser(), Date = DateTime.UtcNow.ToString("yyyy-MM-dd"), Notes = "Plan updated" });
        return plan;
    }

    public async Task<bool> DeletePlanAsync(int id)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _context.DemandPlans.FirstOrDefaultAsync(p => p.DemandPlanId == id);
                if (entity == null) return false;
                entity.Enabled = false;
                entity.DateModified = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                _logger.LogInformation("Soft-deleted demand plan {Id} in DB", id);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB delete failed for demand plan {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        return _plans.TryRemove(id, out _);
    }

    public async Task<DemandPlanDto?> SubmitPlanAsync(int id)
    {
        return await TransitionPlanStatusAsync(id, 1, 2, "Submitted", "Submitted for review");
    }

    public async Task<DemandPlanDto?> ReviewPlanAsync(int id, WorkflowActionRequest? request)
    {
        return await TransitionPlanStatusAsync(id, 2, 3, "Reviewed", request?.Comments ?? "Plan reviewed");
    }

    public async Task<DemandPlanDto?> ApprovePlanAsync(int id, WorkflowActionRequest? request)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _context.DemandPlans
                    .Include(p => p.Items.Where(i => i.Enabled != false))
                    .FirstOrDefaultAsync(p => p.DemandPlanId == id && p.Enabled == true);
                if (entity == null || entity.StatusId != 3) return null;

                entity.StatusId = 4;
                entity.ApprovedByName = GetCurrentUser();
                entity.ApprovedDate = DateTime.UtcNow;
                entity.DateModified = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                _logger.LogInformation("Approved demand plan {Id} in DB", id);
                return EntityToDto(entity);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB approve failed for demand plan {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_plans.TryGetValue(id, out var plan) || plan.StatusId != 3) return null;
        plan.StatusId = 4;
        plan.Status = "Approved";
        plan.ApprovedByName = GetCurrentUser();
        plan.ApprovedDate = DateTime.UtcNow;
        plan.AuditTrail.Add(new DemandAuditEntryDto { Action = "Approved", By = GetCurrentUser(), Date = DateTime.UtcNow.ToString("yyyy-MM-dd"), Notes = request?.Comments ?? "Plan approved" });
        return plan;
    }

    public async Task<DemandPlanDto?> RejectPlanAsync(int id, WorkflowActionRequest request)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _context.DemandPlans
                    .Include(p => p.Items.Where(i => i.Enabled != false))
                    .FirstOrDefaultAsync(p => p.DemandPlanId == id && p.Enabled == true);
                if (entity == null || entity.StatusId < 2) return null;

                entity.StatusId = 5;
                entity.RejectionReason = request.Reason ?? request.Comments;
                entity.DateModified = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                _logger.LogInformation("Rejected demand plan {Id} in DB", id);
                return EntityToDto(entity);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB reject failed for demand plan {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_plans.TryGetValue(id, out var plan) || plan.StatusId < 2) return null;
        plan.StatusId = 5;
        plan.Status = "Rejected";
        plan.RejectionReason = request.Reason ?? request.Comments;
        plan.AuditTrail.Add(new DemandAuditEntryDto { Action = "Rejected", By = GetCurrentUser(), Date = DateTime.UtcNow.ToString("yyyy-MM-dd"), Notes = request.Reason ?? "Plan rejected" });
        return plan;
    }

    public async Task<DemandPlanDto?> ReturnPlanAsync(int id, WorkflowActionRequest request)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _context.DemandPlans
                    .Include(p => p.Items.Where(i => i.Enabled != false))
                    .FirstOrDefaultAsync(p => p.DemandPlanId == id && p.Enabled == true);
                if (entity == null || entity.StatusId < 2 || entity.StatusId > 3) return null;

                entity.StatusId = 1;
                entity.DateModified = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                _logger.LogInformation("Returned demand plan {Id} to draft in DB", id);
                return EntityToDto(entity);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB return failed for demand plan {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_plans.TryGetValue(id, out var plan) || plan.StatusId < 2 || plan.StatusId > 3) return null;
        plan.StatusId = 1;
        plan.Status = "Draft";
        plan.AuditTrail.Add(new DemandAuditEntryDto { Action = "Returned", By = GetCurrentUser(), Date = DateTime.UtcNow.ToString("yyyy-MM-dd"), Notes = request.Reason ?? "Returned for corrections" });
        return plan;
    }

    private async Task<DemandPlanDto?> TransitionPlanStatusAsync(int id, int fromStatus, int toStatus, string toStatusName, string auditNote)
    {
        var userName = GetCurrentUser();

        if (UseDb)
        {
            try
            {
                var entity = await _context.DemandPlans
                    .Include(p => p.Items.Where(i => i.Enabled != false))
                    .FirstOrDefaultAsync(p => p.DemandPlanId == id && p.Enabled == true);
                if (entity == null || entity.StatusId != fromStatus) return null;

                entity.StatusId = toStatus;
                entity.DateModified = DateTime.UtcNow;
                if (toStatus == 3)
                {
                    entity.ReviewedByName = userName;
                    entity.ReviewedDate = DateTime.UtcNow;
                }
                await _context.SaveChangesAsync();
                _logger.LogInformation("Transitioned demand plan {Id} to {Status} in DB", id, toStatusName);
                return EntityToDto(entity);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB status transition failed for demand plan {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_plans.TryGetValue(id, out var plan) || plan.StatusId != fromStatus) return null;
        plan.StatusId = toStatus;
        plan.Status = toStatusName;
        if (toStatus == 3)
        {
            plan.ReviewedByName = userName;
            plan.ReviewedDate = DateTime.UtcNow;
        }
        plan.AuditTrail.Add(new DemandAuditEntryDto { Action = toStatusName, By = userName, Date = DateTime.UtcNow.ToString("yyyy-MM-dd"), Notes = auditNote });
        return plan;
    }

    public async Task<List<DemandPlanItemDto>> GetPlanItemsAsync(int planId)
    {
        if (UseDb)
        {
            try
            {
                var planEnabled = await _context.DemandPlans.AnyAsync(p => p.DemandPlanId == planId && p.Enabled == true);
                if (!planEnabled) return new List<DemandPlanItemDto>();

                var items = await _context.DemandPlanItems
                    .Where(i => i.DemandPlanId == planId && i.Enabled != false)
                    .OrderBy(i => i.DemandPlanItemId)
                    .ToListAsync();
                return items.Select(ItemEntityToDto).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB query failed for plan items {PlanId}, falling back", planId);
                _dbChecker.MarkUnavailable();
            }
        }

        return _items.Values.Where(i => i.DemandPlanId == planId).ToList();
    }

    public async Task<DemandPlanItemDto?> AddPlanItemAsync(int planId, CreateDemandItemRequest request)
    {
        if (UseDb)
        {
            try
            {
                var planExists = await _context.DemandPlans.AnyAsync(p => p.DemandPlanId == planId && p.Enabled == true);
                if (!planExists) return null;

                var entity = new DemandPlanItem
                {
                    DemandPlanId = planId,
                    Description = request.Description,
                    Quantity = request.Quantity,
                    UnitOfMeasure = request.UnitOfMeasure,
                    UnitPrice = request.UnitPrice,
                    EstimatedValue = request.Quantity * request.UnitPrice,
                    Category = request.Category,
                    ProcurementMethod = request.ProcurementMethod,
                    Priority = request.Priority,
                    DeliveryQuarter = request.DeliveryQuarter,
                    MscoaSegment = request.MscoaSegment,
                    Status = "Planned",
                    Enabled = true,
                    DateCaptured = DateTime.UtcNow
                };

                await _context.DemandPlanItems.AddAsync(entity);
                await _context.SaveChangesAsync();
                await RecalculatePlanTotalInDb(planId);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Added item {ItemId} to demand plan {PlanId} in DB", entity.DemandPlanItemId, planId);
                return ItemEntityToDto(entity);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB add item failed for plan {PlanId}, falling back", planId);
                _dbChecker.MarkUnavailable();
            }
        }

        return AddPlanItemInMemory(planId, request);
    }

    private DemandPlanItemDto? AddPlanItemInMemory(int planId, CreateDemandItemRequest request)
    {
        if (!_plans.ContainsKey(planId)) return null;
        var id = Interlocked.Increment(ref _nextItemId);
        var item = new DemandPlanItemDto
        {
            Id = id,
            DemandPlanId = planId,
            Description = request.Description,
            Quantity = request.Quantity,
            UnitOfMeasure = request.UnitOfMeasure,
            UnitPrice = request.UnitPrice,
            EstimatedValue = request.Quantity * request.UnitPrice,
            Category = request.Category,
            ProcurementMethod = request.ProcurementMethod,
            Priority = request.Priority,
            DeliveryQuarter = request.DeliveryQuarter,
            MscoaSegment = request.MscoaSegment,
            Status = "Planned"
        };
        _items[id] = item;
        if (_plans.TryGetValue(planId, out var plan))
        {
            RecalculatePlan(plan);
            plan.AuditTrail.Add(new DemandAuditEntryDto { Action = "Item Added", By = GetCurrentUser(), Date = DateTime.UtcNow.ToString("yyyy-MM-dd"), Notes = $"Added: {request.Description}" });
        }
        return item;
    }

    public async Task<DemandPlanItemDto?> UpdatePlanItemAsync(int planId, int itemId, CreateDemandItemRequest request)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _context.DemandPlanItems
                    .FirstOrDefaultAsync(i => i.DemandPlanItemId == itemId && i.DemandPlanId == planId && i.Enabled != false);
                if (entity == null) return null;

                entity.Description = request.Description;
                entity.Quantity = request.Quantity;
                entity.UnitOfMeasure = request.UnitOfMeasure;
                entity.UnitPrice = request.UnitPrice;
                entity.EstimatedValue = request.Quantity * request.UnitPrice;
                entity.Category = request.Category;
                entity.ProcurementMethod = request.ProcurementMethod;
                entity.Priority = request.Priority;
                entity.DeliveryQuarter = request.DeliveryQuarter;
                entity.MscoaSegment = request.MscoaSegment;

                await _context.SaveChangesAsync();
                await RecalculatePlanTotalInDb(planId);
                await _context.SaveChangesAsync();
                return ItemEntityToDto(entity);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB update item failed for plan {PlanId} item {ItemId}, falling back", planId, itemId);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_items.TryGetValue(itemId, out var item) || item.DemandPlanId != planId) return null;
        item.Description = request.Description;
        item.Quantity = request.Quantity;
        item.UnitOfMeasure = request.UnitOfMeasure;
        item.UnitPrice = request.UnitPrice;
        item.EstimatedValue = request.Quantity * request.UnitPrice;
        item.Category = request.Category;
        item.ProcurementMethod = request.ProcurementMethod;
        item.Priority = request.Priority;
        item.DeliveryQuarter = request.DeliveryQuarter;
        item.MscoaSegment = request.MscoaSegment;
        if (_plans.TryGetValue(planId, out var plan)) RecalculatePlan(plan);
        return item;
    }

    public async Task<bool> DeletePlanItemAsync(int planId, int itemId)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _context.DemandPlanItems
                    .FirstOrDefaultAsync(i => i.DemandPlanItemId == itemId && i.DemandPlanId == planId);
                if (entity == null) return false;
                entity.Enabled = false;
                await _context.SaveChangesAsync();
                await RecalculatePlanTotalInDb(planId);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Soft-deleted demand plan item {ItemId} from plan {PlanId}", itemId, planId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB delete item failed for plan {PlanId} item {ItemId}, falling back", planId, itemId);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_items.TryGetValue(itemId, out var item) || item.DemandPlanId != planId) return false;
        _items.TryRemove(itemId, out _);
        if (_plans.TryGetValue(planId, out var plan)) RecalculatePlan(plan);
        return true;
    }

    private async Task RecalculatePlanTotalInDb(int planId)
    {
        var plan = await _context.DemandPlans.FindAsync(planId);
        if (plan == null) return;
        var total = await _context.DemandPlanItems
            .Where(i => i.DemandPlanId == planId && i.Enabled != false)
            .SumAsync(i => i.EstimatedValue ?? 0);
        plan.TotalDemand = total;
        plan.DateModified = DateTime.UtcNow;
    }

    public async Task<PagedResult<NeedsAssessmentDto>> GetNeedsAssessmentsAsync(string? financialYear, string? search, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var query = _context.NeedsAssessments.Where(n => n.Enabled != false).AsQueryable();

                if (!string.IsNullOrEmpty(search))
                    query = query.Where(n =>
                        (n.Title != null && n.Title.Contains(search)) ||
                        (n.ReferenceNumber != null && n.ReferenceNumber.Contains(search)));

                var totalCount = await query.CountAsync();
                var entities = await query
                    .OrderByDescending(n => n.DateCaptured)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                return new PagedResult<NeedsAssessmentDto>
                {
                    Items = entities.Select(e => NeedEntityToDto(e, GetDepartmentName(e.DepartmentId))),
                    Page = page,
                    PageSize = pageSize,
                    TotalCount = totalCount
                };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB query failed for needs assessments, falling back to in-memory");
                _dbChecker.MarkUnavailable();
            }
        }

        return GetNeedsFromMemory(search, page, pageSize);
    }

    private PagedResult<NeedsAssessmentDto> GetNeedsFromMemory(string? search, int page, int pageSize)
    {
        var query = _needs.Values.AsEnumerable();
        if (!string.IsNullOrEmpty(search))
            query = query.Where(n =>
                (n.Title?.Contains(search, StringComparison.OrdinalIgnoreCase) ?? false) ||
                (n.ReferenceNumber?.Contains(search, StringComparison.OrdinalIgnoreCase) ?? false));
        var total = query.Count();
        var items = query.OrderByDescending(n => n.CreatedDate).Skip((page - 1) * pageSize).Take(pageSize).ToList();
        return new PagedResult<NeedsAssessmentDto> { Items = items, Page = page, PageSize = pageSize, TotalCount = total };
    }

    public async Task<NeedsAssessmentDto> CreateNeedsAssessmentAsync(CreateNeedsAssessmentRequest request)
    {
        var userName = GetCurrentUser();
        var deptName = GetDepartmentName(request.DepartmentId);

        if (UseDb)
        {
            try
            {
                var entity = new NeedsAssessment
                {
                    Title = request.Title,
                    DepartmentId = request.DepartmentId,
                    Priority = request.Priority,
                    Justification = request.Justification,
                    CurrentSituation = request.CurrentSituation,
                    ProposedSolution = request.ProposedSolution,
                    EstimatedCost = request.EstimatedCost,
                    Status = "draft",
                    RiskFactors = request.RiskFactors,
                    Category = request.Category,
                    CreatedBy = userName,
                    CreatedByName = userName,
                    DateCaptured = DateTime.UtcNow,
                    Enabled = true
                };

                await _context.NeedsAssessments.AddAsync(entity);
                await _context.SaveChangesAsync();

                entity.ReferenceNumber = $"NA-{DateTime.UtcNow.Year}-{entity.NeedsAssessmentId:D3}";
                await _context.SaveChangesAsync();

                _logger.LogInformation("Created needs assessment {Id} in DB", entity.NeedsAssessmentId);
                return NeedEntityToDto(entity, deptName);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB create failed for needs assessment, falling back to in-memory");
                _dbChecker.MarkUnavailable();
            }
        }

        return CreateNeedInMemory(request, userName, deptName);
    }

    private NeedsAssessmentDto CreateNeedInMemory(CreateNeedsAssessmentRequest request, string userName, string deptName)
    {
        var id = Interlocked.Increment(ref _nextNeedId);
        var need = new NeedsAssessmentDto
        {
            Id = id,
            ReferenceNumber = $"NA-{DateTime.UtcNow.Year}-{id:D3}",
            Title = request.Title,
            DepartmentId = request.DepartmentId,
            DepartmentName = deptName,
            Priority = request.Priority,
            Justification = request.Justification,
            CurrentSituation = request.CurrentSituation,
            ProposedSolution = request.ProposedSolution,
            EstimatedCost = request.EstimatedCost,
            Status = "draft",
            RiskFactors = request.RiskFactors,
            CreatedBy = userName,
            CreatedByName = userName,
            CreatedDate = DateTime.UtcNow,
            Category = request.Category
        };
        _needs[id] = need;
        return need;
    }

    public async Task<NeedsAssessmentDto?> GetNeedsAssessmentByIdAsync(int id)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _context.NeedsAssessments.FirstOrDefaultAsync(n => n.NeedsAssessmentId == id && n.Enabled != false);
                if (entity != null) return NeedEntityToDto(entity, GetDepartmentName(entity.DepartmentId));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB read failed for needs assessment {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        _needs.TryGetValue(id, out var need);
        return need;
    }

    public async Task<NeedsAssessmentDto?> UpdateNeedsAssessmentAsync(int id, CreateNeedsAssessmentRequest request)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _context.NeedsAssessments.FirstOrDefaultAsync(n => n.NeedsAssessmentId == id && n.Enabled != false);
                if (entity == null || entity.Status != "draft") return null;

                entity.Title = request.Title;
                if (request.DepartmentId.HasValue) entity.DepartmentId = request.DepartmentId;
                entity.Priority = request.Priority;
                entity.Justification = request.Justification;
                entity.CurrentSituation = request.CurrentSituation;
                entity.ProposedSolution = request.ProposedSolution;
                entity.EstimatedCost = request.EstimatedCost;
                entity.RiskFactors = request.RiskFactors;
                entity.Category = request.Category;

                await _context.SaveChangesAsync();
                return NeedEntityToDto(entity, GetDepartmentName(entity.DepartmentId));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB update failed for needs assessment {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_needs.TryGetValue(id, out var need) || need.Status != "draft") return null;
        need.Title = request.Title;
        if (request.DepartmentId.HasValue)
        {
            need.DepartmentId = request.DepartmentId;
            need.DepartmentName = GetDepartmentName(request.DepartmentId);
        }
        need.Priority = request.Priority;
        need.Justification = request.Justification;
        need.CurrentSituation = request.CurrentSituation;
        need.ProposedSolution = request.ProposedSolution;
        need.EstimatedCost = request.EstimatedCost;
        need.RiskFactors = request.RiskFactors;
        need.Category = request.Category;
        return need;
    }

    public async Task<bool> DeleteNeedsAssessmentAsync(int id)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _context.NeedsAssessments.FirstOrDefaultAsync(n => n.NeedsAssessmentId == id && n.Enabled != false);
                if (entity == null || entity.Status != "draft") return false;
                entity.Enabled = false;
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB delete failed for needs assessment {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_needs.TryGetValue(id, out var need) || need.Status != "draft") return false;
        return _needs.TryRemove(id, out _);
    }

    public async Task<NeedsAssessmentDto?> SubmitNeedsAssessmentAsync(int id)
    {
        return await TransitionNeedStatusAsync(id, "draft", "in_progress");
    }

    public async Task<NeedsAssessmentDto?> ApproveNeedsAssessmentAsync(int id, WorkflowActionRequest? request)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _context.NeedsAssessments.FirstOrDefaultAsync(n => n.NeedsAssessmentId == id && n.Enabled != false);
                if (entity == null || (entity.Status != "in_progress" && entity.Status != "completed")) return null;
                entity.Status = "approved";
                await _context.SaveChangesAsync();
                return NeedEntityToDto(entity, GetDepartmentName(entity.DepartmentId));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB approve failed for needs assessment {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_needs.TryGetValue(id, out var need) || (need.Status != "in_progress" && need.Status != "completed")) return null;
        need.Status = "approved";
        return need;
    }

    public async Task<NeedsAssessmentDto?> RejectNeedsAssessmentAsync(int id, WorkflowActionRequest request)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _context.NeedsAssessments.FirstOrDefaultAsync(n => n.NeedsAssessmentId == id && n.Enabled != false);
                if (entity == null || entity.Status == "draft" || entity.Status == "approved") return null;
                entity.Status = "rejected";
                await _context.SaveChangesAsync();
                return NeedEntityToDto(entity, GetDepartmentName(entity.DepartmentId));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB reject failed for needs assessment {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_needs.TryGetValue(id, out var need) || need.Status == "draft" || need.Status == "approved") return null;
        need.Status = "rejected";
        return need;
    }

    private async Task<NeedsAssessmentDto?> TransitionNeedStatusAsync(int id, string fromStatus, string toStatus)
    {
        if (UseDb)
        {
            try
            {
                var entity = await _context.NeedsAssessments.FirstOrDefaultAsync(n => n.NeedsAssessmentId == id && n.Enabled != false);
                if (entity == null || entity.Status != fromStatus) return null;
                entity.Status = toStatus;
                await _context.SaveChangesAsync();
                return NeedEntityToDto(entity, GetDepartmentName(entity.DepartmentId));
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DB status transition failed for needs assessment {Id}, falling back", id);
                _dbChecker.MarkUnavailable();
            }
        }

        if (!_needs.TryGetValue(id, out var need) || need.Status != fromStatus) return null;
        need.Status = toStatus;
        return need;
    }

    public Task<List<SpecificationDto>> GetSpecificationsAsync()
        => Task.FromResult(_specs.Values.OrderByDescending(s => s.CreatedDate).ToList());

    public Task<SpecificationDto?> GetSpecificationByIdAsync(int id)
    {
        _specs.TryGetValue(id, out var spec);
        return Task.FromResult(spec);
    }

    public Task<SpecificationDto> CreateSpecificationAsync(CreateSpecificationRequest request)
    {
        var id = Interlocked.Increment(ref _nextSpecId);
        var spec = new SpecificationDto
        {
            Id = id, ReferenceNumber = $"SP-{DateTime.UtcNow.Year}-{id:D3}", Title = request.Title,
            Description = request.Description, DemandItemId = request.DemandItemId, Category = request.Category,
            Status = "draft", CreatedBy = GetCurrentUser(), CreatedDate = DateTime.UtcNow,
            TechnicalDetails = request.TechnicalDetails, QualityCriteria = request.QualityCriteria
        };
        _specs[id] = spec;
        return Task.FromResult(spec);
    }

    public Task<SpecificationDto?> UpdateSpecificationAsync(int id, CreateSpecificationRequest request)
    {
        if (!_specs.TryGetValue(id, out var spec)) return Task.FromResult<SpecificationDto?>(null);
        spec.Title = request.Title; spec.Description = request.Description;
        spec.Category = request.Category; spec.TechnicalDetails = request.TechnicalDetails;
        spec.QualityCriteria = request.QualityCriteria; spec.DemandItemId = request.DemandItemId;
        return Task.FromResult<SpecificationDto?>(spec);
    }

    public Task<bool> DeleteSpecificationAsync(int id)
        => Task.FromResult(_specs.TryRemove(id, out _));

    public Task<SpecificationDto?> SubmitSpecificationAsync(int id)
    {
        if (!_specs.TryGetValue(id, out var spec) || spec.Status != "draft") return Task.FromResult<SpecificationDto?>(null);
        spec.Status = "submitted";
        return Task.FromResult<SpecificationDto?>(spec);
    }

    public Task<SpecificationDto?> ApproveSpecificationAsync(int id)
    {
        if (!_specs.TryGetValue(id, out var spec) || spec.Status != "submitted") return Task.FromResult<SpecificationDto?>(null);
        spec.Status = "approved";
        return Task.FromResult<SpecificationDto?>(spec);
    }

    public Task<SpecificationDto?> RejectSpecificationAsync(int id, string? reason)
    {
        if (!_specs.TryGetValue(id, out var spec) || spec.Status != "submitted") return Task.FromResult<SpecificationDto?>(null);
        spec.Status = "rejected";
        return Task.FromResult<SpecificationDto?>(spec);
    }

    public async Task<List<CommodityGroupDto>> GetCommodityGroupsAsync()
    {
        var itemSource = UseDb ? await GetAllItemsForAggregation() : _items.Values.ToList();
        var groups = itemSource.GroupBy(i => i.Category ?? "uncategorised").Select(g => new CommodityGroupDto
        {
            Id = g.Key.GetHashCode() & 0x7FFFFFFF,
            Code = g.Key.ToUpper().Replace(" ", "_"),
            Name = g.Key,
            Description = $"Commodity group for {g.Key}",
            Category = g.Key,
            ItemCount = g.Count(),
            TotalValue = g.Sum(i => i.EstimatedValue)
        }).ToList();
        return groups;
    }

    public async Task<CommodityGroupDto?> GetCommodityGroupByIdAsync(int id)
    {
        var itemSource = UseDb ? await GetAllItemsForAggregation() : _items.Values.ToList();
        var group = itemSource.GroupBy(i => i.Category ?? "uncategorised").Select(g => new CommodityGroupDto
        {
            Id = g.Key.GetHashCode() & 0x7FFFFFFF, Code = g.Key.ToUpper().Replace(" ", "_"),
            Name = g.Key, Description = $"Commodity group for {g.Key}", Category = g.Key,
            ItemCount = g.Count(), TotalValue = g.Sum(i => i.EstimatedValue)
        }).FirstOrDefault(g => g.Id == id);
        return group;
    }

    private async Task<List<DemandPlanItemDto>> GetAllItemsForAggregation()
    {
        try
        {
            var items = await _context.DemandPlanItems.Where(i => i.Enabled != false).ToListAsync();
            return items.Select(ItemEntityToDto).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "DB query failed for aggregation items, falling back");
            _dbChecker.MarkUnavailable();
            return _items.Values.ToList();
        }
    }

    public Task<List<MarketAnalysisDto>> GetMarketAnalysesAsync()
        => Task.FromResult(_marketAnalyses.Values.OrderByDescending(m => m.CreatedDate).ToList());

    public Task<MarketAnalysisDto?> GetMarketAnalysisByIdAsync(int id)
    {
        _marketAnalyses.TryGetValue(id, out var analysis);
        return Task.FromResult(analysis);
    }

    public Task<MarketAnalysisDto> CreateMarketAnalysisAsync(CreateMarketAnalysisRequest request)
    {
        var id = Interlocked.Increment(ref _nextMarketId);
        var analysis = new MarketAnalysisDto
        {
            Id = id, ReferenceNumber = $"MA-{DateTime.UtcNow.Year}-{id:D3}", Title = request.Title,
            Description = request.Description, Category = request.Category, Status = "in_progress",
            EstimatedMarketValue = request.EstimatedMarketValue, SupplierCount = request.SupplierCount,
            Findings = request.Findings, Recommendation = request.Recommendation, CreatedDate = DateTime.UtcNow
        };
        _marketAnalyses[id] = analysis;
        return Task.FromResult(analysis);
    }

    public Task<MarketAnalysisDto?> UpdateMarketAnalysisAsync(int id, CreateMarketAnalysisRequest request)
    {
        if (!_marketAnalyses.TryGetValue(id, out var analysis)) return Task.FromResult<MarketAnalysisDto?>(null);
        analysis.Title = request.Title; analysis.Description = request.Description;
        analysis.Category = request.Category; analysis.EstimatedMarketValue = request.EstimatedMarketValue;
        analysis.SupplierCount = request.SupplierCount; analysis.Findings = request.Findings;
        analysis.Recommendation = request.Recommendation;
        return Task.FromResult<MarketAnalysisDto?>(analysis);
    }

    public Task<MarketAnalysisDto?> CompleteMarketAnalysisAsync(int id)
    {
        if (!_marketAnalyses.TryGetValue(id, out var analysis) || analysis.Status != "in_progress") return Task.FromResult<MarketAnalysisDto?>(null);
        analysis.Status = "completed";
        analysis.CompletedDate = DateTime.UtcNow;
        return Task.FromResult<MarketAnalysisDto?>(analysis);
    }

    public Task<List<AggregationDto>> GetAggregationsAsync()
        => Task.FromResult(_aggregations.Values.OrderByDescending(a => a.CreatedDate).ToList());

    public Task<AggregationDto?> GetAggregationByIdAsync(int id)
    {
        _aggregations.TryGetValue(id, out var agg);
        return Task.FromResult(agg);
    }

    public async Task<AggregationDto> CreateAggregationAsync(CreateAggregationRequest request)
    {
        var id = Interlocked.Increment(ref _nextAggId);
        var itemSource = UseDb ? await GetAllItemsForAggregation() : _items.Values.ToList();
        var matchingItems = itemSource.Where(i => request.DemandItemIds.Contains(i.Id)).ToList();
        var totalVal = matchingItems.Sum(i => i.EstimatedValue);
        var agg = new AggregationDto
        {
            Id = id, ReferenceNumber = $"AG-{DateTime.UtcNow.Year}-{id:D3}", Title = request.Title,
            Description = request.Description, Category = request.Category, Status = "draft",
            ItemCount = matchingItems.Count, TotalValue = totalVal,
            EstimatedSavings = Math.Round(totalVal * 0.12m),
            DemandItemIds = request.DemandItemIds, CreatedDate = DateTime.UtcNow
        };
        _aggregations[id] = agg;
        return agg;
    }

    public async Task<AggregationDto?> UpdateAggregationAsync(int id, CreateAggregationRequest request)
    {
        if (!_aggregations.TryGetValue(id, out var agg)) return null;
        agg.Title = request.Title; agg.Description = request.Description; agg.Category = request.Category;
        agg.DemandItemIds = request.DemandItemIds;
        var itemSource = UseDb ? await GetAllItemsForAggregation() : _items.Values.ToList();
        var matchingItems = itemSource.Where(i => request.DemandItemIds.Contains(i.Id)).ToList();
        agg.ItemCount = matchingItems.Count; agg.TotalValue = matchingItems.Sum(i => i.EstimatedValue);
        agg.EstimatedSavings = Math.Round(agg.TotalValue * 0.12m);
        return agg;
    }

    public Task<AggregationDto?> ApproveAggregationAsync(int id)
    {
        if (!_aggregations.TryGetValue(id, out var agg) || agg.Status == "approved") return Task.FromResult<AggregationDto?>(null);
        agg.Status = "approved";
        return Task.FromResult<AggregationDto?>(agg);
    }

    public Task<AggregationDto?> RejectAggregationAsync(int id, string? reason)
    {
        if (!_aggregations.TryGetValue(id, out var agg) || agg.Status == "rejected") return Task.FromResult<AggregationDto?>(null);
        agg.Status = "rejected";
        return Task.FromResult<AggregationDto?>(agg);
    }

    private static List<object> BuildCategoryBreakdown(List<DemandPlanItemDto> items)
    {
        var groups = items.GroupBy(i => i.Category ?? "uncategorised").ToList();
        var total = items.Count;
        return groups.Select(g => (object)new
        {
            category = g.Key,
            count = g.Count(),
            value = g.Sum(i => i.EstimatedValue),
            percentage = total > 0 ? (int)Math.Round((decimal)g.Count() / total * 100) : 0
        }).ToList();
    }

    private static List<object> BuildProcurementMethodBreakdown(List<DemandPlanItemDto> items)
    {
        var groups = items.GroupBy(i => i.ProcurementMethod ?? "Unspecified").ToList();
        var total = items.Count;
        return groups.Select(g => (object)new
        {
            method = g.Key,
            count = g.Count(),
            value = g.Sum(i => i.EstimatedValue),
            percentage = total > 0 ? (int)Math.Round((decimal)g.Count() / total * 100) : 0
        }).ToList();
    }

    private static List<object> BuildQuarterlyPipelineFromItems(List<DemandPlanItemDto> items)
    {
        var quarters = new[] { "Q1", "Q2", "Q3", "Q4" };
        return quarters.Select(q =>
        {
            var qItems = items.Where(i => string.Equals(i.DeliveryQuarter, q, StringComparison.OrdinalIgnoreCase)).ToList();
            var plannedValue = qItems.Sum(i => i.EstimatedValue);
            var committed = plannedValue * 0.92m;
            var actual = q == "Q1" || q == "Q2" ? plannedValue * 0.85m : 0m;
            return (object)new
            {
                quarter = q,
                plannedValue = Math.Round(plannedValue),
                actualValue = Math.Round(actual),
                committed = Math.Round(committed),
                items = qItems.Count
            };
        }).ToList();
    }

    private void RecalculatePlan(DemandPlanDto plan)
    {
        var planItems = _items.Values.Where(i => i.DemandPlanId == plan.Id).ToList();
        plan.TotalDemand = planItems.Sum(i => i.EstimatedValue);
        plan.Items = planItems;
        plan.BudgetVariance = new DemandBudgetVariance { Amount = plan.TotalBudget - plan.TotalDemand };
        plan.BudgetUtilisation = plan.TotalBudget > 0 ? (int)Math.Round(plan.TotalDemand / plan.TotalBudget * 100) : 0;
        plan.ComplianceScore = CalculateCompliance(plan);
        plan.PriorityBreakdown = new DemandPriorityBreakdown
        {
            Critical = planItems.Count(i => string.Equals(i.Priority, "Critical", StringComparison.OrdinalIgnoreCase)),
            High = planItems.Count(i => string.Equals(i.Priority, "High", StringComparison.OrdinalIgnoreCase)),
            Medium = planItems.Count(i => string.Equals(i.Priority, "Medium", StringComparison.OrdinalIgnoreCase)),
            Low = planItems.Count(i => string.Equals(i.Priority, "Low", StringComparison.OrdinalIgnoreCase))
        };
        plan.ProcurementMethodSummary = planItems.GroupBy(i => i.ProcurementMethod).ToDictionary(g => g.Key, g => g.Count());
    }

    private int CalculateCompliance(DemandPlanDto plan)
    {
        int score = 0;
        if (!string.IsNullOrEmpty(plan.IdpReference)) score += 20;
        if (!string.IsNullOrEmpty(plan.SdbipReference)) score += 20;
        if (plan.TotalBudget > 0) score += 20;
        if (plan.Items.Count > 0) score += 20;
        if (!string.IsNullOrEmpty(plan.Vote)) score += 10;
        if (!string.IsNullOrEmpty(plan.Description)) score += 10;
        return score;
    }

    private void SeedData()
    {
        var plan1 = new DemandPlanDto
        {
            Id = 1, ReferenceNumber = "DP-2025-001", Title = "Infrastructure Capital Programme 2025/26",
            DepartmentId = 5, DepartmentName = "Infrastructure Development", DepartmentCode = "ID",
            FinancialYear = "2025/26", Vote = "Vote 8", Description = "Annual capital infrastructure demand plan",
            StatusId = 4, Status = "Approved", TotalBudget = 52000000, TotalDemand = 45200000,
            IdpReference = "IDP-2025-001", IdpObjective = "Improve municipal infrastructure",
            SdbipReference = "SDBIP-2025-IE-001", SdbipIndicator = "KPI 4.1",
            Priority = "High", RiskLevel = "low", ComplianceScore = 92,
            CreatedBy = "admin", CreatedByName = "J. Molefe", CreatedDate = new DateTime(2025, 1, 15),
            ReviewedByName = "S. Nkosi", ReviewedDate = new DateTime(2025, 2, 10),
            ApprovedByName = "T. Dlamini", ApprovedDate = new DateTime(2025, 2, 15),
            Notes = "Annual capital infrastructure demand plan",
            BudgetUtilisation = 87, BudgetVariance = new DemandBudgetVariance { Amount = 6800000 },
            PriorityBreakdown = new DemandPriorityBreakdown { Critical = 2, High = 4, Medium = 4, Low = 2 },
            ProcurementMethodSummary = new Dictionary<string, int> { { "Open Tender", 5 }, { "RFQ", 4 }, { "Limited Bidding", 3 } },
            QuarterlySpendPlan = new DemandQuarterlySpend
            {
                Q1 = new QuarterData { Planned = 12000000, Actual = 10500000, Committed = 11800000 },
                Q2 = new QuarterData { Planned = 14000000, Actual = 12200000, Committed = 13500000 },
                Q3 = new QuarterData { Planned = 11000000, Actual = 8800000, Committed = 10200000 },
                Q4 = new QuarterData { Planned = 8200000, Actual = 0, Committed = 6500000 }
            },
            AuditTrail = new List<DemandAuditEntryDto>
            {
                new() { Action = "Created", By = "J. Molefe", Date = "2025-01-15", Notes = "Initial demand plan created" },
                new() { Action = "Submitted", By = "J. Molefe", Date = "2025-02-01", Notes = "Submitted for SCM review" },
                new() { Action = "Reviewed", By = "S. Nkosi", Date = "2025-02-10", Notes = "Reviewed and recommended for approval" },
                new() { Action = "Approved", By = "T. Dlamini", Date = "2025-02-15", Notes = "Approved by CFO" }
            }
        };

        var plan2 = new DemandPlanDto
        {
            Id = 2, ReferenceNumber = "DP-2025-002", Title = "Community Services Operational Needs",
            DepartmentId = 3, DepartmentName = "Community Services", DepartmentCode = "CS",
            FinancialYear = "2025/26", Vote = "Vote 5", Description = "Operational demand plan for community services",
            StatusId = 2, Status = "Submitted", TotalBudget = 22000000, TotalDemand = 18900000,
            IdpReference = "IDP-2025-003", IdpObjective = "Enhance community services delivery",
            SdbipReference = "SDBIP-2025-CS-001", SdbipIndicator = "KPI 2.3",
            Priority = "Medium", RiskLevel = "medium", ComplianceScore = 88,
            CreatedBy = "admin", CreatedByName = "P. Maseko", CreatedDate = new DateTime(2025, 1, 20),
            Notes = "", BudgetUtilisation = 86, BudgetVariance = new DemandBudgetVariance { Amount = 3100000 },
            PriorityBreakdown = new DemandPriorityBreakdown { Critical = 1, High = 3, Medium = 2, Low = 2 },
            ProcurementMethodSummary = new Dictionary<string, int> { { "Open Tender", 2 }, { "RFQ", 4 }, { "Single Source", 2 } },
            QuarterlySpendPlan = new DemandQuarterlySpend
            {
                Q1 = new QuarterData { Planned = 5200000, Actual = 4800000, Committed = 5100000 },
                Q2 = new QuarterData { Planned = 5800000, Actual = 0, Committed = 4200000 },
                Q3 = new QuarterData { Planned = 4200000, Actual = 0, Committed = 0 },
                Q4 = new QuarterData { Planned = 3700000, Actual = 0, Committed = 0 }
            },
            AuditTrail = new List<DemandAuditEntryDto>
            {
                new() { Action = "Created", By = "P. Maseko", Date = "2025-01-20", Notes = "Operational demand plan created" },
                new() { Action = "Submitted", By = "P. Maseko", Date = "2025-02-05", Notes = "Submitted for review" }
            }
        };

        var plan3 = new DemandPlanDto
        {
            Id = 3, ReferenceNumber = "DP-2025-003", Title = "Water & Sanitation Maintenance Plan",
            DepartmentId = 9, DepartmentName = "Water & Sanitation", DepartmentCode = "WS",
            FinancialYear = "2025/26", Vote = "Vote 9", Description = "Maintenance demand plan including emergency pipeline repairs",
            StatusId = 1, Status = "Draft", TotalBudget = 38000000, TotalDemand = 35600000,
            IdpReference = "IDP-2025-005", IdpObjective = "Ensure sustainable water services",
            SdbipReference = "SDBIP-2025-WS-001", SdbipIndicator = "KPI 5.2",
            Priority = "Critical", RiskLevel = "high", ComplianceScore = 79,
            CreatedBy = "admin", CreatedByName = "K. van Wyk", CreatedDate = new DateTime(2025, 2, 1),
            Notes = "Includes emergency pipeline repairs", BudgetUtilisation = 94,
            BudgetVariance = new DemandBudgetVariance { Amount = 2400000 },
            PriorityBreakdown = new DemandPriorityBreakdown { Critical = 4, High = 5, Medium = 4, Low = 2 },
            ProcurementMethodSummary = new Dictionary<string, int> { { "Open Tender", 6 }, { "RFQ", 5 }, { "Emergency", 3 }, { "Limited Bidding", 1 } },
            QuarterlySpendPlan = new DemandQuarterlySpend
            {
                Q1 = new QuarterData { Planned = 9500000 },
                Q2 = new QuarterData { Planned = 10200000 },
                Q3 = new QuarterData { Planned = 8800000 },
                Q4 = new QuarterData { Planned = 7100000 }
            },
            AuditTrail = new List<DemandAuditEntryDto>
            {
                new() { Action = "Created", By = "K. van Wyk", Date = "2025-02-01", Notes = "Maintenance demand plan drafted" }
            }
        };

        var plan4 = new DemandPlanDto
        {
            Id = 4, ReferenceNumber = "DP-2025-004", Title = "Corporate ICT Modernisation",
            DepartmentId = 1, DepartmentName = "Corporate Services", DepartmentCode = "CS",
            FinancialYear = "2025/26", Vote = "Vote 3", Description = "ICT modernisation demand plan",
            StatusId = 3, Status = "Reviewed", TotalBudget = 15000000, TotalDemand = 12800000,
            IdpReference = "IDP-2025-002", IdpObjective = "Digital transformation",
            SdbipReference = "SDBIP-2025-CS-002", SdbipIndicator = "KPI 3.1",
            Priority = "Medium", RiskLevel = "low", ComplianceScore = 95,
            CreatedBy = "admin", CreatedByName = "L. Tshabalala", CreatedDate = new DateTime(2025, 1, 10),
            ReviewedByName = "S. Nkosi", ReviewedDate = new DateTime(2025, 2, 8),
            Notes = "", BudgetUtilisation = 85, BudgetVariance = new DemandBudgetVariance { Amount = 2200000 },
            PriorityBreakdown = new DemandPriorityBreakdown { Critical = 0, High = 2, Medium = 3, Low = 1 },
            ProcurementMethodSummary = new Dictionary<string, int> { { "Open Tender", 2 }, { "RFQ", 3 }, { "Single Source", 1 } },
            QuarterlySpendPlan = new DemandQuarterlySpend
            {
                Q1 = new QuarterData { Planned = 3200000, Actual = 2800000, Committed = 3100000 },
                Q2 = new QuarterData { Planned = 3800000, Actual = 3200000, Committed = 3600000 },
                Q3 = new QuarterData { Planned = 3200000, Actual = 0, Committed = 2800000 },
                Q4 = new QuarterData { Planned = 2600000, Actual = 0, Committed = 0 }
            },
            AuditTrail = new List<DemandAuditEntryDto>
            {
                new() { Action = "Created", By = "L. Tshabalala", Date = "2025-01-10", Notes = "ICT demand plan created" },
                new() { Action = "Submitted", By = "L. Tshabalala", Date = "2025-01-25", Notes = "Submitted for SCM review" },
                new() { Action = "Reviewed", By = "S. Nkosi", Date = "2025-02-08", Notes = "Specification clarity recommended" }
            }
        };

        _plans[1] = plan1;
        _plans[2] = plan2;
        _plans[3] = plan3;
        _plans[4] = plan4;
        _nextPlanId = 5;

        var items1 = new List<DemandPlanItemDto>
        {
            new() { Id = 1, DemandPlanId = 1, Description = "Road rehabilitation - Main Street", Quantity = 1, UnitOfMeasure = "Project", UnitPrice = 8500000, EstimatedValue = 8500000, Category = "capital_works", ProcurementMethod = "Open Tender", Priority = "Critical", DeliveryQuarter = "Q1", Status = "Approved" },
            new() { Id = 2, DemandPlanId = 1, Description = "Storm water drainage upgrade", Quantity = 1, UnitOfMeasure = "Project", UnitPrice = 6200000, EstimatedValue = 6200000, Category = "capital_works", ProcurementMethod = "Open Tender", Priority = "High", DeliveryQuarter = "Q1", Status = "Approved" },
            new() { Id = 3, DemandPlanId = 1, Description = "Bridge repair and maintenance", Quantity = 3, UnitOfMeasure = "Each", UnitPrice = 2100000, EstimatedValue = 6300000, Category = "maintenance", ProcurementMethod = "RFQ", Priority = "High", DeliveryQuarter = "Q2", Status = "Planned" },
            new() { Id = 4, DemandPlanId = 1, Description = "Traffic light installation", Quantity = 8, UnitOfMeasure = "Each", UnitPrice = 350000, EstimatedValue = 2800000, Category = "capital_works", ProcurementMethod = "RFQ", Priority = "Medium", DeliveryQuarter = "Q2", Status = "Planned" },
            new() { Id = 5, DemandPlanId = 1, Description = "Pavement rehabilitation programme", Quantity = 1, UnitOfMeasure = "Project", UnitPrice = 12500000, EstimatedValue = 12500000, Category = "capital_works", ProcurementMethod = "Open Tender", Priority = "Critical", DeliveryQuarter = "Q1", Status = "Approved" },
            new() { Id = 6, DemandPlanId = 1, Description = "Engineering consulting services", Quantity = 1, UnitOfMeasure = "Contract", UnitPrice = 4200000, EstimatedValue = 4200000, Category = "services", ProcurementMethod = "Limited Bidding", Priority = "Medium", DeliveryQuarter = "Q3", Status = "Planned" },
        };

        var items2 = new List<DemandPlanItemDto>
        {
            new() { Id = 7, DemandPlanId = 2, Description = "Community hall equipment", Quantity = 12, UnitOfMeasure = "Each", UnitPrice = 250000, EstimatedValue = 3000000, Category = "goods", ProcurementMethod = "RFQ", Priority = "Medium", DeliveryQuarter = "Q1", Status = "Planned" },
            new() { Id = 8, DemandPlanId = 2, Description = "Parks maintenance equipment", Quantity = 5, UnitOfMeasure = "Set", UnitPrice = 180000, EstimatedValue = 900000, Category = "goods", ProcurementMethod = "RFQ", Priority = "Low", DeliveryQuarter = "Q2", Status = "Planned" },
            new() { Id = 9, DemandPlanId = 2, Description = "Refuse collection vehicles", Quantity = 3, UnitOfMeasure = "Each", UnitPrice = 2800000, EstimatedValue = 8400000, Category = "goods", ProcurementMethod = "Open Tender", Priority = "High", DeliveryQuarter = "Q1", Status = "Planned" },
            new() { Id = 10, DemandPlanId = 2, Description = "Security services contract", Quantity = 1, UnitOfMeasure = "Contract", UnitPrice = 3200000, EstimatedValue = 3200000, Category = "services", ProcurementMethod = "Single Source", Priority = "High", DeliveryQuarter = "Q1", Status = "Planned" },
        };

        var items3 = new List<DemandPlanItemDto>
        {
            new() { Id = 11, DemandPlanId = 3, Description = "Bulk water pipeline replacement", Quantity = 1, UnitOfMeasure = "Project", UnitPrice = 18200000, EstimatedValue = 18200000, Category = "capital_works", ProcurementMethod = "Open Tender", Priority = "Critical", DeliveryQuarter = "Q1", Status = "Planned" },
            new() { Id = 12, DemandPlanId = 3, Description = "Water treatment plant upgrade", Quantity = 1, UnitOfMeasure = "Project", UnitPrice = 8500000, EstimatedValue = 8500000, Category = "capital_works", ProcurementMethod = "Open Tender", Priority = "Critical", DeliveryQuarter = "Q2", Status = "Planned" },
            new() { Id = 13, DemandPlanId = 3, Description = "Sewer pump station maintenance", Quantity = 4, UnitOfMeasure = "Each", UnitPrice = 850000, EstimatedValue = 3400000, Category = "maintenance", ProcurementMethod = "RFQ", Priority = "High", DeliveryQuarter = "Q2", Status = "Planned" },
        };

        var items4 = new List<DemandPlanItemDto>
        {
            new() { Id = 14, DemandPlanId = 4, Description = "Server infrastructure upgrade", Quantity = 1, UnitOfMeasure = "Project", UnitPrice = 4500000, EstimatedValue = 4500000, Category = "goods", ProcurementMethod = "Open Tender", Priority = "High", DeliveryQuarter = "Q2", Status = "Planned" },
            new() { Id = 15, DemandPlanId = 4, Description = "Network equipment procurement", Quantity = 1, UnitOfMeasure = "Lot", UnitPrice = 2800000, EstimatedValue = 2800000, Category = "goods", ProcurementMethod = "RFQ", Priority = "High", DeliveryQuarter = "Q2", Status = "Planned" },
            new() { Id = 16, DemandPlanId = 4, Description = "Software licensing renewal", Quantity = 1, UnitOfMeasure = "Contract", UnitPrice = 3200000, EstimatedValue = 3200000, Category = "services", ProcurementMethod = "Single Source", Priority = "Medium", DeliveryQuarter = "Q1", Status = "Planned" },
            new() { Id = 17, DemandPlanId = 4, Description = "Cybersecurity assessment", Quantity = 1, UnitOfMeasure = "Contract", UnitPrice = 1500000, EstimatedValue = 1500000, Category = "services", ProcurementMethod = "RFQ", Priority = "Medium", DeliveryQuarter = "Q3", Status = "Planned" },
        };

        foreach (var item in items1.Concat(items2).Concat(items3).Concat(items4))
            _items[item.Id] = item;
        _nextItemId = 18;

        foreach (var plan in _plans.Values)
            plan.Items = _items.Values.Where(i => i.DemandPlanId == plan.Id).ToList();

        _needs[1] = new NeedsAssessmentDto { Id = 1, ReferenceNumber = "NA-2025-001", Title = "Road Rehabilitation Needs Assessment", DepartmentId = 5, DepartmentName = "Infrastructure Development", Priority = "critical", Justification = "Municipal road network deteriorating due to deferred maintenance", CurrentSituation = "42% of municipal roads below acceptable PCI rating", ProposedSolution = "Comprehensive road rehabilitation programme", EstimatedCost = 28500000, Status = "approved", RiskFactors = "Budget constraints, weather delays", CreatedBy = "admin", CreatedByName = "J. Molefe", CreatedDate = new DateTime(2025, 1, 10), Category = "capital_works" };
        _needs[2] = new NeedsAssessmentDto { Id = 2, ReferenceNumber = "NA-2025-002", Title = "Community Hall Equipment Needs", DepartmentId = 3, DepartmentName = "Community Services", Priority = "medium", Justification = "Equipment in community halls is outdated and non-functional", CurrentSituation = "12 community halls with ageing equipment", ProposedSolution = "Equipment replacement programme", EstimatedCost = 4200000, Status = "completed", RiskFactors = "Supply chain delays", CreatedBy = "admin", CreatedByName = "P. Maseko", CreatedDate = new DateTime(2025, 1, 15), Category = "goods" };
        _needs[3] = new NeedsAssessmentDto { Id = 3, ReferenceNumber = "NA-2025-003", Title = "Water Infrastructure Assessment", DepartmentId = 9, DepartmentName = "Water & Sanitation", Priority = "high", Justification = "Bulk water infrastructure at capacity", CurrentSituation = "Current infrastructure serving 85% of demand", ProposedSolution = "Pipeline replacement and capacity upgrade", EstimatedCost = 18200000, Status = "in_progress", RiskFactors = "Service delivery interruptions", CreatedBy = "admin", CreatedByName = "K. van Wyk", CreatedDate = new DateTime(2025, 1, 20), Category = "capital_works" };
        _needs[4] = new NeedsAssessmentDto { Id = 4, ReferenceNumber = "NA-2025-004", Title = "ICT Infrastructure Assessment", DepartmentId = 1, DepartmentName = "Corporate Services", Priority = "high", Justification = "ICT infrastructure requiring modernisation", CurrentSituation = "Legacy systems impacting efficiency", ProposedSolution = "Server and network infrastructure upgrade", EstimatedCost = 8500000, Status = "approved", RiskFactors = "Vendor availability, skills shortage", CreatedBy = "admin", CreatedByName = "L. Tshabalala", CreatedDate = new DateTime(2025, 1, 25), Category = "goods" };
        _needs[5] = new NeedsAssessmentDto { Id = 5, ReferenceNumber = "NA-2025-005", Title = "Fleet Replacement Needs", DepartmentId = 3, DepartmentName = "Community Services", Priority = "medium", Justification = "Fleet vehicles beyond economic lifespan", CurrentSituation = "60% of fleet over 10 years old", ProposedSolution = "Phased fleet replacement programme", EstimatedCost = 12800000, Status = "draft", RiskFactors = "Import restrictions, exchange rate", CreatedBy = "admin", CreatedByName = "M. Khumalo", CreatedDate = new DateTime(2025, 2, 1), Category = "goods" };
        _needs[6] = new NeedsAssessmentDto { Id = 6, ReferenceNumber = "NA-2025-006", Title = "Electrical Network Expansion", DepartmentId = 7, DepartmentName = "Electro-Technical Services", Priority = "critical", Justification = "New development areas require electrical connections", CurrentSituation = "2500 pending electrical connections", ProposedSolution = "Network expansion to new developments", EstimatedCost = 22000000, Status = "completed", RiskFactors = "Eskom supply constraints", CreatedBy = "admin", CreatedByName = "R. Pillay", CreatedDate = new DateTime(2025, 2, 5), Category = "capital_works" };
        _nextNeedId = 7;

        _specs[1] = new SpecificationDto { Id = 1, ReferenceNumber = "SP-2025-001", Title = "Road Rehabilitation Materials Specification", Description = "Technical specifications for bituminous surfacing and base materials", DemandItemId = 1001, Category = "capital_works", Status = "approved", CreatedBy = "admin", CreatedDate = new DateTime(2025, 1, 20), TechnicalDetails = "SANS 3001 compliant materials required", QualityCriteria = "ISO 9001 certified suppliers", Requirements = new List<SpecificationRequirement> { new() { Description = "SANS 3001 compliance", Mandatory = true }, new() { Description = "5-year warranty", Mandatory = true } } };
        _specs[2] = new SpecificationDto { Id = 2, ReferenceNumber = "SP-2025-002", Title = "Water Pipeline Technical Specification", Description = "Specifications for HDPE pipes and fittings", DemandItemId = 1002, Category = "capital_works", Status = "submitted", CreatedBy = "admin", CreatedDate = new DateTime(2025, 1, 25), TechnicalDetails = "SANS 966 HDPE pipes, minimum PE100 grade", QualityCriteria = "SABS Mark approved", Requirements = new List<SpecificationRequirement> { new() { Description = "SANS 966 compliance", Mandatory = true } } };
        _specs[3] = new SpecificationDto { Id = 3, ReferenceNumber = "SP-2025-003", Title = "ICT Server Infrastructure Specification", Description = "Server and networking equipment specifications", DemandItemId = 1005, Category = "goods", Status = "draft", CreatedBy = "admin", CreatedDate = new DateTime(2025, 2, 1), TechnicalDetails = "Enterprise-grade servers with redundancy", QualityCriteria = "OEM certified hardware", Requirements = new List<SpecificationRequirement> { new() { Description = "3-year on-site warranty", Mandatory = true }, new() { Description = "24/7 support SLA", Mandatory = false } } };
        _nextSpecId = 4;

        _marketAnalyses[1] = new MarketAnalysisDto { Id = 1, ReferenceNumber = "MA-2025-001", Title = "Road Construction Market Analysis", Description = "Analysis of road construction service providers in the region", Category = "capital_works", Status = "completed", EstimatedMarketValue = 32000000, SupplierCount = 8, Findings = "Competitive market with 8 qualifying contractors", Recommendation = "Open tender recommended", CreatedDate = new DateTime(2025, 1, 18), CompletedDate = new DateTime(2025, 2, 5) };
        _marketAnalyses[2] = new MarketAnalysisDto { Id = 2, ReferenceNumber = "MA-2025-002", Title = "ICT Equipment Market Survey", Description = "Survey of IT hardware suppliers and pricing", Category = "goods", Status = "in_progress", EstimatedMarketValue = 9500000, SupplierCount = 12, Findings = "Multiple suppliers available with competitive pricing", Recommendation = "RFQ recommended for items under R500K threshold", CreatedDate = new DateTime(2025, 2, 1) };
        _nextMarketId = 3;

        _aggregations[1] = new AggregationDto { Id = 1, ReferenceNumber = "AG-2025-001", Title = "ICT Equipment Consolidation", Description = "Consolidating ICT equipment across departments", Category = "goods", Status = "approved", ItemCount = 8, TotalValue = 12500000, EstimatedSavings = 1800000, DemandItemIds = new List<int> { 1005, 1010 }, CreatedDate = new DateTime(2025, 2, 10) };
        _aggregations[2] = new AggregationDto { Id = 2, ReferenceNumber = "AG-2025-002", Title = "Vehicle Fleet Procurement Bundle", Description = "Combining vehicle requirements from multiple departments", Category = "goods", Status = "draft", ItemCount = 5, TotalValue = 8200000, EstimatedSavings = 950000, DemandItemIds = new List<int> { 1008, 1012 }, CreatedDate = new DateTime(2025, 2, 15) };
        _nextAggId = 3;
    }
}
