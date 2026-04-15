using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.DTOs;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Services;

public class BudgetVersionService
{
    private readonly BudgetDbContext _db;
    private readonly AuditService _audit;

    public BudgetVersionService(BudgetDbContext db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<List<BudgetVersionSummaryDto>> GetAllAsync(int? financialYearId = null, BudgetVersionType? type = null, BudgetVersionStatus? status = null)
    {
        var query = _db.BudgetVersions
            .Include(v => v.FinancialYear)
            .Include(v => v.BudgetStrings)
            .AsQueryable();

        if (financialYearId.HasValue) query = query.Where(v => v.FinancialYearId == financialYearId.Value);
        if (type.HasValue) query = query.Where(v => v.VersionType == type.Value);
        if (status.HasValue) query = query.Where(v => v.Status == status.Value);

        return await query.OrderByDescending(v => v.CreatedOn).Select(v => new BudgetVersionSummaryDto(
            v.Id,
            v.FinancialYear.YearCode,
            v.VersionType.ToString(),
            v.VersionName,
            v.Description,
            v.Status.ToString(),
            v.ParentVersionId,
            v.CouncilAdoptionDate,
            v.LgdrsSubmissionRef,
            v.LockedBy,
            v.LockedOn,
            v.CreatedBy,
            v.CreatedOn,
            v.BudgetStrings.Count,
            v.BudgetStrings.Sum(s => s.Year1Amount),
            v.BudgetStrings.Sum(s => s.Year2Amount),
            v.BudgetStrings.Sum(s => s.Year3Amount)
        )).ToListAsync();
    }

    public async Task<BudgetVersionDetailDto?> GetByIdAsync(int id)
    {
        var v = await _db.BudgetVersions
            .Include(v => v.FinancialYear)
            .Include(v => v.BudgetStrings).ThenInclude(s => s.ScoaItem)
            .Include(v => v.Approvals)
            .Include(v => v.ParentVersion)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (v == null) return null;

        var revenueItems = new[] { "1100", "1200", "1300", "1400", "1500", "1600", "1700", "1800", "1900", "2000" };
        var capitalItems = new[] { "7000", "8000" };

        var revenue = v.BudgetStrings.Where(s => revenueItems.Contains(s.ScoaItem.Code)).Sum(s => s.Year1Amount);
        var capital = v.BudgetStrings.Where(s => capitalItems.Contains(s.ScoaItem.Code)).Sum(s => s.Year1Amount);
        var totalY1 = v.BudgetStrings.Sum(s => s.Year1Amount);
        var expenditure = totalY1 - revenue;

        return new BudgetVersionDetailDto(
            v.Id,
            v.FinancialYearId,
            v.FinancialYear.YearCode,
            v.VersionType.ToString(),
            v.VersionName,
            v.Description,
            v.Status.ToString(),
            v.ParentVersionId,
            v.ParentVersion?.VersionName,
            v.CouncilAdoptionDate,
            v.LgdrsSubmissionRef,
            v.LockedBy,
            v.LockedOn,
            v.CreatedBy,
            v.CreatedOn,
            v.BudgetStrings.Count,
            revenue,
            expenditure,
            capital,
            totalY1,
            v.BudgetStrings.Sum(s => s.Year2Amount),
            v.BudgetStrings.Sum(s => s.Year3Amount),
            v.Approvals.OrderBy(a => a.Timestamp).Select(a => new ApprovalDto(
                a.Id, a.EntityType.ToString(), a.Step, null, a.Decision.ToString(), a.Comment, a.UserId, a.UserName, a.Timestamp
            )).ToList()
        );
    }

    public async Task<BudgetVersion> CreateAsync(CreateBudgetVersionDto dto, string userId)
    {
        var version = new BudgetVersion
        {
            FinancialYearId = dto.FinancialYearId,
            VersionType = dto.VersionType,
            VersionName = dto.VersionName,
            Description = dto.Description ?? string.Empty,
            ParentVersionId = dto.ParentVersionId,
            Status = BudgetVersionStatus.Draft,
            CreatedBy = userId
        };
        _db.BudgetVersions.Add(version);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("BudgetVersion", version.Id, "Created", userId, null, $"Created {dto.VersionType} version: {dto.VersionName}");
        return version;
    }

    public async Task<BudgetVersion?> SubmitForApprovalAsync(int id, ApprovalActionDto dto)
    {
        var version = await _db.BudgetVersions.FindAsync(id);
        if (version == null || version.Status != BudgetVersionStatus.Draft) return null;

        version.Status = BudgetVersionStatus.Pending;
        version.ModifiedBy = dto.UserId;
        version.ModifiedOn = DateTime.UtcNow;

        _db.BudgetApprovals.Add(new BudgetApproval
        {
            EntityType = ApprovalEntityType.BudgetVersion,
            EntityId = id,
            BudgetVersionId = id,
            Step = 1,
            Decision = ApprovalDecision.Submitted,
            Comment = dto.Comment,
            UserId = dto.UserId,
            UserName = dto.UserName
        });

        await _db.SaveChangesAsync();
        await _audit.LogAsync("BudgetVersion", id, "SubmittedForApproval", dto.UserId, null, $"Submitted for approval by {dto.UserName}");
        return version;
    }

    public async Task<BudgetVersion?> ApproveAsync(int id, ApprovalActionDto dto)
    {
        var version = await _db.BudgetVersions.FindAsync(id);
        if (version == null || version.Status != BudgetVersionStatus.Pending) return null;

        version.Status = BudgetVersionStatus.Approved;
        version.ModifiedBy = dto.UserId;
        version.ModifiedOn = DateTime.UtcNow;

        var maxStep = await _db.BudgetApprovals.Where(a => a.EntityId == id && a.EntityType == ApprovalEntityType.BudgetVersion).MaxAsync(a => (int?)a.Step) ?? 0;
        _db.BudgetApprovals.Add(new BudgetApproval
        {
            EntityType = ApprovalEntityType.BudgetVersion,
            EntityId = id,
            BudgetVersionId = id,
            Step = maxStep + 1,
            Decision = ApprovalDecision.Approved,
            Comment = dto.Comment,
            UserId = dto.UserId,
            UserName = dto.UserName
        });

        await _db.SaveChangesAsync();
        await _audit.LogAsync("BudgetVersion", id, "Approved", dto.UserId, null, $"Approved by {dto.UserName}");
        return version;
    }

    public async Task<BudgetVersion?> RejectAsync(int id, ApprovalActionDto dto)
    {
        var version = await _db.BudgetVersions.FindAsync(id);
        if (version == null || version.Status != BudgetVersionStatus.Pending) return null;

        version.Status = BudgetVersionStatus.Rejected;
        version.ModifiedBy = dto.UserId;
        version.ModifiedOn = DateTime.UtcNow;

        var maxStep = await _db.BudgetApprovals.Where(a => a.EntityId == id && a.EntityType == ApprovalEntityType.BudgetVersion).MaxAsync(a => (int?)a.Step) ?? 0;
        _db.BudgetApprovals.Add(new BudgetApproval
        {
            EntityType = ApprovalEntityType.BudgetVersion,
            EntityId = id,
            BudgetVersionId = id,
            Step = maxStep + 1,
            Decision = ApprovalDecision.Rejected,
            Comment = dto.Comment,
            UserId = dto.UserId,
            UserName = dto.UserName
        });

        await _db.SaveChangesAsync();
        await _audit.LogAsync("BudgetVersion", id, "Rejected", dto.UserId, null, $"Rejected by {dto.UserName}: {dto.Comment}");
        return version;
    }

    public async Task<BudgetVersion?> LockAsync(int id, ApprovalActionDto dto)
    {
        var version = await _db.BudgetVersions.FindAsync(id);
        if (version == null || version.Status != BudgetVersionStatus.Approved) return null;

        version.Status = BudgetVersionStatus.Locked;
        version.LockedBy = dto.UserName;
        version.LockedOn = DateTime.UtcNow;
        version.ModifiedBy = dto.UserId;
        version.ModifiedOn = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await _audit.LogAsync("BudgetVersion", id, "Locked", dto.UserId, null, $"Locked by {dto.UserName}");
        return version;
    }

    public async Task<BudgetVersion?> UnlockRequestAsync(int id, ApprovalActionDto dto)
    {
        var version = await _db.BudgetVersions.FindAsync(id);
        if (version == null || version.Status != BudgetVersionStatus.Locked) return null;

        version.Status = BudgetVersionStatus.Approved;
        version.LockedBy = null;
        version.LockedOn = null;
        version.ModifiedBy = dto.UserId;
        version.ModifiedOn = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await _audit.LogAsync("BudgetVersion", id, "UnlockRequested", dto.UserId, null, $"Unlock requested by {dto.UserName}: {dto.Comment}");
        return version;
    }

    public async Task<BudgetVersion?> ActivateAsync(int id, ApprovalActionDto dto)
    {
        var version = await _db.BudgetVersions.FindAsync(id);
        if (version == null || version.Status != BudgetVersionStatus.Locked) return null;

        version.Status = BudgetVersionStatus.ActiveForImplementation;
        version.ModifiedBy = dto.UserId;
        version.ModifiedOn = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await _audit.LogAsync("BudgetVersion", id, "ActivatedForImplementation", dto.UserId, null, $"Activated for implementation by {dto.UserName}");
        return version;
    }

    public async Task<BudgetVersion?> CloneAsync(int id, CloneBudgetVersionDto dto, string userId)
    {
        var source = await _db.BudgetVersions.Include(v => v.BudgetStrings).FirstOrDefaultAsync(v => v.Id == id);
        if (source == null) return null;

        var clone = new BudgetVersion
        {
            FinancialYearId = source.FinancialYearId,
            VersionType = dto.TargetVersionType,
            VersionName = dto.VersionName,
            Description = dto.Description ?? $"Cloned from {source.VersionName}",
            ParentVersionId = source.Id,
            Status = BudgetVersionStatus.Draft,
            CreatedBy = userId
        };
        _db.BudgetVersions.Add(clone);
        await _db.SaveChangesAsync();

        foreach (var s in source.BudgetStrings)
        {
            _db.BudgetStrings.Add(new BudgetString
            {
                BudgetVersionId = clone.Id,
                ProjectId = s.ProjectId,
                SourceModule = s.SourceModule,
                ScoaItemId = s.ScoaItemId,
                ScoaFundId = s.ScoaFundId,
                ScoaFunctionId = s.ScoaFunctionId,
                ScoaProjectId = s.ScoaProjectId,
                ScoaRegionId = s.ScoaRegionId,
                ScoaCostingId = s.ScoaCostingId,
                ScoaMscId = s.ScoaMscId,
                Year1Amount = s.Year1Amount,
                Year2Amount = s.Year2Amount,
                Year3Amount = s.Year3Amount,
                Month01 = s.Month01, Month02 = s.Month02, Month03 = s.Month03,
                Month04 = s.Month04, Month05 = s.Month05, Month06 = s.Month06,
                Month07 = s.Month07, Month08 = s.Month08, Month09 = s.Month09,
                Month10 = s.Month10, Month11 = s.Month11, Month12 = s.Month12,
                Description = s.Description,
                OriginRefId = s.OriginRefId,
                AssumptionsRef = s.AssumptionsRef,
                CreatedBy = userId
            });
        }
        await _db.SaveChangesAsync();
        await _audit.LogAsync("BudgetVersion", clone.Id, "Cloned", userId, null, $"Cloned from version {source.VersionName} ({source.Id})");
        return clone;
    }

    public async Task<VersionDiffDto?> GetDiffAsync(int idA, int idB)
    {
        var vA = await _db.BudgetVersions.Include(v => v.BudgetStrings).ThenInclude(s => s.ScoaItem)
            .Include(v => v.BudgetStrings).ThenInclude(s => s.ScoaFund)
            .FirstOrDefaultAsync(v => v.Id == idA);
        var vB = await _db.BudgetVersions.Include(v => v.BudgetStrings).ThenInclude(s => s.ScoaItem)
            .Include(v => v.BudgetStrings).ThenInclude(s => s.ScoaFund)
            .FirstOrDefaultAsync(v => v.Id == idB);

        if (vA == null || vB == null) return null;

        string SegKey(BudgetString s) => $"{s.ScoaItemId}-{s.ScoaFundId}-{s.ScoaFunctionId}-{s.ScoaProjectId}-{s.ScoaRegionId}-{s.ScoaCostingId}-{s.ScoaMscId}";

        var aDict = vA.BudgetStrings.GroupBy(SegKey).ToDictionary(g => g.Key, g => g.First());
        var bDict = vB.BudgetStrings.GroupBy(SegKey).ToDictionary(g => g.Key, g => g.First());
        var allKeys = aDict.Keys.Union(bDict.Keys).ToList();

        var lines = new List<DiffLineDto>();
        int added = 0, removed = 0, modified = 0;

        foreach (var key in allKeys)
        {
            var inA = aDict.TryGetValue(key, out var sA);
            var inB = bDict.TryGetValue(key, out var sB);
            if (inA && inB)
            {
                if (sA!.Year1Amount != sB!.Year1Amount)
                {
                    modified++;
                    lines.Add(new DiffLineDto($"{sA.ScoaItem.Code}/{sA.ScoaFund.Code}", sA.Description, sA.Year1Amount, sB.Year1Amount, sB.Year1Amount - sA.Year1Amount, "Modified"));
                }
            }
            else if (inA)
            {
                removed++;
                lines.Add(new DiffLineDto($"{sA!.ScoaItem.Code}/{sA.ScoaFund.Code}", sA.Description, sA.Year1Amount, null, -sA.Year1Amount, "Removed"));
            }
            else
            {
                added++;
                lines.Add(new DiffLineDto($"{sB!.ScoaItem.Code}/{sB.ScoaFund.Code}", sB.Description, null, sB.Year1Amount, sB.Year1Amount, "Added"));
            }
        }

        return new VersionDiffDto(
            idA, vA.VersionName, idB, vB.VersionName,
            vA.BudgetStrings.Sum(s => s.Year1Amount),
            vB.BudgetStrings.Sum(s => s.Year1Amount),
            vB.BudgetStrings.Sum(s => s.Year1Amount) - vA.BudgetStrings.Sum(s => s.Year1Amount),
            added, removed, modified, lines
        );
    }
}
