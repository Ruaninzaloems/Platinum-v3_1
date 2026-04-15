using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.DTOs;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Services;

public class BudgetStringService
{
    private readonly BudgetDbContext _db;
    private readonly AuditService _audit;

    public BudgetStringService(BudgetDbContext db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<List<BudgetStringListDto>> GetAllAsync(int? versionId = null, string? module = null, int? itemId = null, int? fundId = null, int? functionId = null, int? projectId = null)
    {
        var query = _db.BudgetStrings
            .Include(s => s.ScoaItem)
            .Include(s => s.ScoaFund)
            .Include(s => s.ScoaFunction)
            .Include(s => s.ScoaProjectNav)
            .Include(s => s.ScoaRegion)
            .Include(s => s.ScoaCosting)
            .Include(s => s.ScoaMsc)
            .Include(s => s.Project)
            .AsQueryable();

        if (versionId.HasValue) query = query.Where(s => s.BudgetVersionId == versionId.Value);
        if (!string.IsNullOrEmpty(module) && Enum.TryParse<SourceModule>(module, true, out var sm)) query = query.Where(s => s.SourceModule == sm);
        if (itemId.HasValue) query = query.Where(s => s.ScoaItemId == itemId.Value);
        if (fundId.HasValue) query = query.Where(s => s.ScoaFundId == fundId.Value);
        if (functionId.HasValue) query = query.Where(s => s.ScoaFunctionId == functionId.Value);
        if (projectId.HasValue) query = query.Where(s => s.ProjectId == projectId.Value);

        return await query.OrderBy(s => s.ScoaItem.Code).ThenBy(s => s.ScoaFund.Code).Select(s => new BudgetStringListDto(
            s.Id, s.BudgetVersionId, s.ProjectId, s.Project != null ? s.Project.ProjectCode : null, s.Project != null ? s.Project.ProjectName : null,
            s.SourceModule.ToString(),
            $"{s.ScoaItem.Code}/{s.ScoaFund.Code}/{s.ScoaFunction.Code}/{s.ScoaProjectNav.Code}/{s.ScoaRegion.Code}/{s.ScoaCosting.Code}/{s.ScoaMsc.Code}",
            s.ScoaItem.Code, s.ScoaItem.Description,
            s.ScoaFund.Code, s.ScoaFund.Description,
            s.ScoaFunction.Code, s.ScoaFunction.Description,
            s.ScoaProjectNav.Code, s.ScoaProjectNav.Description,
            s.ScoaRegion.Code, s.ScoaRegion.Description,
            s.ScoaCosting.Code, s.ScoaCosting.Description,
            s.ScoaMsc.Code, s.ScoaMsc.Description,
            s.Year1Amount, s.Year2Amount, s.Year3Amount,
            s.Description, s.CreatedOn
        )).ToListAsync();
    }

    public async Task<BudgetStringDetailDto?> GetByIdAsync(int id)
    {
        var s = await _db.BudgetStrings
            .Include(s => s.ScoaItem).Include(s => s.ScoaFund).Include(s => s.ScoaFunction)
            .Include(s => s.ScoaProjectNav).Include(s => s.ScoaRegion).Include(s => s.ScoaCosting)
            .Include(s => s.ScoaMsc).Include(s => s.Project)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (s == null) return null;

        return new BudgetStringDetailDto(
            s.Id, s.BudgetVersionId, s.ProjectId, s.Project?.ProjectCode, s.SourceModule.ToString(),
            s.ScoaItemId, s.ScoaItem.Code, s.ScoaItem.Description,
            s.ScoaFundId, s.ScoaFund.Code, s.ScoaFund.Description,
            s.ScoaFunctionId, s.ScoaFunction.Code, s.ScoaFunction.Description,
            s.ScoaProjectId, s.ScoaProjectNav.Code, s.ScoaProjectNav.Description,
            s.ScoaRegionId, s.ScoaRegion.Code, s.ScoaRegion.Description,
            s.ScoaCostingId, s.ScoaCosting.Code, s.ScoaCosting.Description,
            s.ScoaMscId, s.ScoaMsc.Code, s.ScoaMsc.Description,
            s.Year1Amount, s.Year2Amount, s.Year3Amount,
            new[] { s.Month01, s.Month02, s.Month03, s.Month04, s.Month05, s.Month06, s.Month07, s.Month08, s.Month09, s.Month10, s.Month11, s.Month12 },
            s.Description, s.OriginRefId, s.AssumptionsRef, s.CreatedBy, s.CreatedOn
        );
    }

    public async Task<BudgetString> CreateAsync(CreateBudgetStringDto dto, string userId)
    {
        var bs = new BudgetString
        {
            BudgetVersionId = dto.BudgetVersionId,
            ProjectId = dto.ProjectId,
            SourceModule = dto.SourceModule,
            ScoaItemId = dto.ScoaItemId,
            ScoaFundId = dto.ScoaFundId,
            ScoaFunctionId = dto.ScoaFunctionId,
            ScoaProjectId = dto.ScoaProjectId,
            ScoaRegionId = dto.ScoaRegionId,
            ScoaCostingId = dto.ScoaCostingId,
            ScoaMscId = dto.ScoaMscId,
            Year1Amount = dto.Year1Amount,
            Year2Amount = dto.Year2Amount,
            Year3Amount = dto.Year3Amount,
            Description = dto.Description,
            OriginRefId = dto.OriginRefId,
            AssumptionsRef = dto.AssumptionsRef,
            CreatedBy = userId
        };

        if (dto.MonthlySplit is { Length: 12 })
        {
            bs.Month01 = dto.MonthlySplit[0]; bs.Month02 = dto.MonthlySplit[1]; bs.Month03 = dto.MonthlySplit[2];
            bs.Month04 = dto.MonthlySplit[3]; bs.Month05 = dto.MonthlySplit[4]; bs.Month06 = dto.MonthlySplit[5];
            bs.Month07 = dto.MonthlySplit[6]; bs.Month08 = dto.MonthlySplit[7]; bs.Month09 = dto.MonthlySplit[8];
            bs.Month10 = dto.MonthlySplit[9]; bs.Month11 = dto.MonthlySplit[10]; bs.Month12 = dto.MonthlySplit[11];
        }

        _db.BudgetStrings.Add(bs);
        await _db.SaveChangesAsync();
        return bs;
    }

    public async Task<BudgetString?> UpdateAsync(int id, UpdateBudgetStringDto dto, string userId)
    {
        var bs = await _db.BudgetStrings.FindAsync(id);
        if (bs == null) return null;

        if (dto.Year1Amount.HasValue) bs.Year1Amount = dto.Year1Amount.Value;
        if (dto.Year2Amount.HasValue) bs.Year2Amount = dto.Year2Amount.Value;
        if (dto.Year3Amount.HasValue) bs.Year3Amount = dto.Year3Amount.Value;
        if (dto.Description != null) bs.Description = dto.Description;
        if (dto.MonthlySplit is { Length: 12 })
        {
            bs.Month01 = dto.MonthlySplit[0]; bs.Month02 = dto.MonthlySplit[1]; bs.Month03 = dto.MonthlySplit[2];
            bs.Month04 = dto.MonthlySplit[3]; bs.Month05 = dto.MonthlySplit[4]; bs.Month06 = dto.MonthlySplit[5];
            bs.Month07 = dto.MonthlySplit[6]; bs.Month08 = dto.MonthlySplit[7]; bs.Month09 = dto.MonthlySplit[8];
            bs.Month10 = dto.MonthlySplit[9]; bs.Month11 = dto.MonthlySplit[10]; bs.Month12 = dto.MonthlySplit[11];
        }
        bs.ModifiedBy = userId;
        bs.ModifiedOn = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return bs;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var bs = await _db.BudgetStrings.FindAsync(id);
        if (bs == null) return false;
        _db.BudgetStrings.Remove(bs);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<List<BudgetStringSummaryDto>> GetSummaryAsync(int versionId, string groupBy = "item")
    {
        var data = await _db.BudgetStrings
            .Include(s => s.ScoaItem).Include(s => s.ScoaFund).Include(s => s.ScoaFunction)
            .Where(s => s.BudgetVersionId == versionId)
            .ToListAsync();

        var grouped = groupBy.ToLower() switch
        {
            "fund" => data.GroupBy(s => new { Code = s.ScoaFund?.Code ?? "", Description = s.ScoaFund?.Description ?? "" }),
            "function" => data.GroupBy(s => new { Code = s.ScoaFunction?.Code ?? "", Description = s.ScoaFunction?.Description ?? "" }),
            _ => data.GroupBy(s => new { Code = s.ScoaItem?.Code ?? "", Description = s.ScoaItem?.Description ?? "" })
        };

        return grouped.Select(g => new BudgetStringSummaryDto(
            g.Key.Code, g.Key.Description, g.Count(),
            g.Sum(s => s.Year1Amount), g.Sum(s => s.Year2Amount), g.Sum(s => s.Year3Amount)
        )).OrderBy(s => s.GroupKey).ToList();
    }
}
