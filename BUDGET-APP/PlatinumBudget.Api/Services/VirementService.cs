using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.DTOs;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Services;

public class VirementService
{
    private readonly BudgetDbContext _db;
    private readonly AuditService _audit;

    private static readonly Dictionary<int, string> ApprovalLevelNames = new()
    {
        { 1, "Department Head" },
        { 2, "Budget Office" },
        { 3, "Chief Financial Officer" },
        { 4, "Municipal Manager" },
        { 5, "Council" }
    };

    public VirementService(BudgetDbContext db, AuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<List<VirementListDto>> GetAllAsync(int? versionId = null, VirementStatus? status = null)
    {
        var query = _db.VirementRequests
            .Include(v => v.BudgetVersion)
            .AsQueryable();
        if (versionId.HasValue) query = query.Where(v => v.BudgetVersionId == versionId.Value);
        if (status.HasValue) query = query.Where(v => v.Status == status.Value);

        var virements = await query.OrderByDescending(v => v.CreatedOn).ToListAsync();
        var result = new List<VirementListDto>();

        foreach (var v in virements)
        {
            var fromItem = await _db.ScoaItems.FindAsync(v.FromScoaItemId);
            var fromFund = await _db.ScoaFunds.FindAsync(v.FromScoaFundId);
            var fromFunc = await _db.ScoaFunctions.FindAsync(v.FromScoaFunctionId);
            var toItem = await _db.ScoaItems.FindAsync(v.ToScoaItemId);
            var toFund = await _db.ScoaFunds.FindAsync(v.ToScoaFundId);
            var toFunc = await _db.ScoaFunctions.FindAsync(v.ToScoaFunctionId);

            var approvals = await _db.BudgetApprovals
                .Where(a => a.EntityType == ApprovalEntityType.Virement && a.EntityId == v.Id)
                .OrderBy(a => a.Step).ThenBy(a => a.Timestamp)
                .ToListAsync();

            result.Add(new VirementListDto(
                v.Id, v.VirementNumber, v.BudgetVersionId, v.BudgetVersion.VersionName, v.Status.ToString(),
                v.BudgetType, v.CurrentApprovalLevel, v.RequiresCouncilApproval,
                $"{fromItem?.Code}/{fromFund?.Code}/{fromFunc?.Code}",
                $"{toItem?.Code}/{toFund?.Code}/{toFunc?.Code}",
                v.Amount, v.Motivation, v.ThresholdExceeded, v.ThresholdPercentage,
                v.CreatedBy, v.CreatedOn, v.ApprovedBy, v.ApprovedOn,
                v.RejectedBy, v.RejectedOn, v.RejectionReason,
                approvals.Select(a => new ApprovalDto(
                    a.Id, "Virement", a.Step, ApprovalLevelNames.GetValueOrDefault(a.Step, $"Level {a.Step}"),
                    a.Decision.ToString(), a.Comment, a.UserId, a.UserName, a.Timestamp
                )).ToList()
            ));
        }
        return result;
    }

    public async Task<VirementDetailDto?> GetDetailAsync(int id)
    {
        var v = await _db.VirementRequests
            .Include(x => x.BudgetVersion)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (v == null) return null;

        var fromItem = await _db.ScoaItems.FindAsync(v.FromScoaItemId);
        var fromFund = await _db.ScoaFunds.FindAsync(v.FromScoaFundId);
        var fromFunc = await _db.ScoaFunctions.FindAsync(v.FromScoaFunctionId);
        var fromProj = await _db.ScoaProjects.FindAsync(v.FromScoaProjectId);
        var fromReg = await _db.ScoaRegions.FindAsync(v.FromScoaRegionId);
        var fromCost = await _db.ScoaCostings.FindAsync(v.FromScoaCostingId);
        var fromMsc = await _db.ScoaMscs.FindAsync(v.FromScoaMscId);

        var toItem = await _db.ScoaItems.FindAsync(v.ToScoaItemId);
        var toFund = await _db.ScoaFunds.FindAsync(v.ToScoaFundId);
        var toFunc = await _db.ScoaFunctions.FindAsync(v.ToScoaFunctionId);
        var toProj = await _db.ScoaProjects.FindAsync(v.ToScoaProjectId);
        var toReg = await _db.ScoaRegions.FindAsync(v.ToScoaRegionId);
        var toCost = await _db.ScoaCostings.FindAsync(v.ToScoaCostingId);
        var toMsc = await _db.ScoaMscs.FindAsync(v.ToScoaMscId);

        var approvals = await _db.BudgetApprovals
            .Where(a => a.EntityType == ApprovalEntityType.Virement && a.EntityId == v.Id)
            .OrderBy(a => a.Step).ThenBy(a => a.Timestamp)
            .ToListAsync();

        var fromSummary = new BudgetSummaryDto(
            v.FromOriginalBudget, v.FromPriorVirements, v.FromAdjustments, v.FromCurrentBudget,
            0, 0, v.FromCurrentBudget * 0.42m, v.FromAvailableBudget, v.FromAvailableBudget - v.Amount
        );
        var toSummary = new BudgetSummaryDto(
            v.ToOriginalBudget, v.ToPriorVirements, v.ToAdjustments, v.ToCurrentBudget,
            0, 0, v.ToCurrentBudget * 0.42m, v.ToAvailableBudget, v.ToAvailableBudget + v.Amount
        );

        return new VirementDetailDto(
            v.Id, v.VirementNumber, v.BudgetVersionId, v.BudgetVersion.VersionName, v.Status.ToString(),
            v.BudgetType, v.CurrentApprovalLevel, v.RequiresCouncilApproval,
            v.FromScoaItemId, fromItem?.Code ?? "", fromItem?.Description ?? "",
            v.FromScoaFundId, fromFund?.Code ?? "", fromFund?.Description ?? "",
            v.FromScoaFunctionId, fromFunc?.Code ?? "", fromFunc?.Description ?? "",
            v.FromScoaProjectId, fromProj?.Code ?? "", fromProj?.Description ?? "",
            v.FromScoaRegionId, fromReg?.Code ?? "", fromReg?.Description ?? "",
            v.FromScoaCostingId, fromCost?.Code ?? "", fromCost?.Description ?? "",
            v.FromScoaMscId, fromMsc?.Code ?? "", fromMsc?.Description ?? "",
            v.ToScoaItemId, toItem?.Code ?? "", toItem?.Description ?? "",
            v.ToScoaFundId, toFund?.Code ?? "", toFund?.Description ?? "",
            v.ToScoaFunctionId, toFunc?.Code ?? "", toFunc?.Description ?? "",
            v.ToScoaProjectId, toProj?.Code ?? "", toProj?.Description ?? "",
            v.ToScoaRegionId, toReg?.Code ?? "", toReg?.Description ?? "",
            v.ToScoaCostingId, toCost?.Code ?? "", toCost?.Description ?? "",
            v.ToScoaMscId, toMsc?.Code ?? "", toMsc?.Description ?? "",
            v.Amount, v.Motivation, v.PolicyReference, v.ThresholdPercentage, v.ThresholdExceeded,
            fromSummary, toSummary,
            v.CreatedBy, v.CreatedOn, v.ApprovedBy, v.ApprovedOn,
            v.RejectedBy, v.RejectedOn, v.RejectionReason,
            approvals.Select(a => new ApprovalDto(
                a.Id, "Virement", a.Step, ApprovalLevelNames.GetValueOrDefault(a.Step, $"Level {a.Step}"),
                a.Decision.ToString(), a.Comment, a.UserId, a.UserName, a.Timestamp
            )).ToList()
        );
    }

    public async Task<BudgetSummaryDto> GetBudgetSummaryAsync(int budgetVersionId, int itemId, int fundId, int functionId, int projectId, int regionId, int costingId, int mscId)
    {
        var budgetString = await _db.BudgetStrings.FirstOrDefaultAsync(s =>
            s.BudgetVersionId == budgetVersionId &&
            s.ScoaItemId == itemId && s.ScoaFundId == fundId &&
            s.ScoaFunctionId == functionId && s.ScoaProjectId == projectId &&
            s.ScoaRegionId == regionId && s.ScoaCostingId == costingId && s.ScoaMscId == mscId);

        if (budgetString == null)
        {
            budgetString = await _db.BudgetStrings.FirstOrDefaultAsync(s =>
                s.BudgetVersionId == budgetVersionId &&
                s.ScoaItemId == itemId && s.ScoaFundId == fundId &&
                s.ScoaFunctionId == functionId && s.ScoaProjectId == projectId);
        }

        if (budgetString == null)
            return new BudgetSummaryDto(0, 0, 0, 0, 0, 0, 0, 0, 0);

        var priorVirements = await _db.VirementRequests
            .Where(v => v.BudgetVersionId == budgetVersionId &&
                       (v.Status == VirementStatus.Posted || v.Status == VirementStatus.Approved) &&
                       ((v.FromScoaItemId == itemId && v.FromScoaFundId == fundId) ||
                        (v.ToScoaItemId == itemId && v.ToScoaFundId == fundId)))
            .ToListAsync();

        decimal priorVirementsAmount = 0;
        foreach (var pv in priorVirements)
        {
            if (pv.FromScoaItemId == itemId && pv.FromScoaFundId == fundId)
                priorVirementsAmount -= pv.Amount;
            if (pv.ToScoaItemId == itemId && pv.ToScoaFundId == fundId)
                priorVirementsAmount += pv.Amount;
        }

        var originalBudget = budgetString.Year1Amount;
        var currentBudget = originalBudget + priorVirementsAmount;
        var actual = currentBudget * 0.42m;
        var available = currentBudget - actual;

        return new BudgetSummaryDto(originalBudget, priorVirementsAmount, 0, currentBudget, 0, 0, actual, available, available);
    }

    public async Task<VirementApprovalChainDto> GetApprovalChainAsync(int id)
    {
        var v = await _db.VirementRequests.FindAsync(id);
        if (v == null) return new VirementApprovalChainDto(new List<VirementApprovalStepDto>());

        var approvals = await _db.BudgetApprovals
            .Where(a => a.EntityType == ApprovalEntityType.Virement && a.EntityId == id)
            .OrderBy(a => a.Step).ThenBy(a => a.Timestamp)
            .ToListAsync();

        var maxLevel = v.RequiresCouncilApproval ? 5 : 4;
        var steps = new List<VirementApprovalStepDto>();

        for (int level = 1; level <= maxLevel; level++)
        {
            var approval = approvals.LastOrDefault(a => a.Step == level);
            string status;
            if (approval != null)
                status = approval.Decision.ToString();
            else if (level == v.CurrentApprovalLevel && v.Status != VirementStatus.Draft && v.Status != VirementStatus.Rejected)
                status = "Pending";
            else if (level < v.CurrentApprovalLevel)
                status = "Skipped";
            else
                status = "Waiting";

            steps.Add(new VirementApprovalStepDto(
                level,
                ApprovalLevelNames.GetValueOrDefault(level, $"Level {level}"),
                status,
                approval?.UserName,
                approval?.Timestamp,
                approval?.Comment,
                level == v.CurrentApprovalLevel && v.Status != VirementStatus.Draft && v.Status != VirementStatus.Rejected && v.Status != VirementStatus.Posted
            ));
        }

        return new VirementApprovalChainDto(steps);
    }

    public async Task<VirementValidationResultDto> ValidateAgainstPolicyAsync(CreateVirementDto dto)
    {
        var violations = new List<VirementRuleViolationDto>();

        var version = await _db.BudgetVersions.Include(v => v.FinancialYear).FirstOrDefaultAsync(v => v.Id == dto.BudgetVersionId);
        if (version == null) return new VirementValidationResultDto(false, new List<VirementRuleViolationDto> { new("System", "Budget version not found", "Error", "Budget version does not exist") });

        var policy = await _db.VirementPolicies
            .Include(p => p.Rules)
            .FirstOrDefaultAsync(p => p.FinancialYearId == version.FinancialYearId && p.IsActive);

        if (policy == null) return new VirementValidationResultDto(true, new List<VirementRuleViolationDto>());

        var fromItem = await _db.ScoaItems.FindAsync(dto.FromScoaItemId);
        var toItem = await _db.ScoaItems.FindAsync(dto.ToScoaItemId);
        var fromFund = await _db.ScoaFunds.FindAsync(dto.FromScoaFundId);
        var toFund = await _db.ScoaFunds.FindAsync(dto.ToScoaFundId);
        var fromFunction = await _db.ScoaFunctions.FindAsync(dto.FromScoaFunctionId);
        var toFunction = await _db.ScoaFunctions.FindAsync(dto.ToScoaFunctionId);
        var fromProject = await _db.ScoaProjects.FindAsync(dto.FromScoaProjectId);
        var toProject = await _db.ScoaProjects.FindAsync(dto.ToScoaProjectId);

        var fromBudgetString = await _db.BudgetStrings.FirstOrDefaultAsync(s =>
            s.BudgetVersionId == dto.BudgetVersionId &&
            s.ScoaItemId == dto.FromScoaItemId && s.ScoaFundId == dto.FromScoaFundId &&
            s.ScoaFunctionId == dto.FromScoaFunctionId && s.ScoaProjectId == dto.FromScoaProjectId);

        foreach (var rule in policy.Rules.Where(r => r.IsEnabled).OrderBy(r => r.SortOrder))
        {
            if (rule.SegmentType == "Item" && !string.IsNullOrEmpty(rule.FromSegmentFilter) && !string.IsNullOrEmpty(rule.ToSegmentFilter))
            {
                var fromCodes = rule.FromSegmentFilter.Split(',').Select(c => c.Trim()).ToHashSet();
                var toCodes = rule.ToSegmentFilter.Split(',').Select(c => c.Trim()).ToHashSet();
                if (fromItem != null && toItem != null && fromCodes.Contains(fromItem.Code) && toCodes.Contains(toItem.Code))
                {
                    violations.Add(new VirementRuleViolationDto(rule.Principle, rule.Description, rule.Severity,
                        $"Transfer from {fromItem.Code} ({fromItem.Description}) to {toItem.Code} ({toItem.Description}) violates: {rule.ValidationRule}"));
                }
            }
            else if (rule.SegmentType == "Item" && string.IsNullOrEmpty(rule.FromSegmentFilter) && !string.IsNullOrEmpty(rule.ToSegmentFilter))
            {
                var toCodes = rule.ToSegmentFilter.Split(',').Select(c => c.Trim()).ToHashSet();
                if (toItem != null && toCodes.Contains(toItem.Code))
                {
                    violations.Add(new VirementRuleViolationDto(rule.Principle, rule.Description, rule.Severity,
                        $"Transfer to {toItem.Code} ({toItem.Description}): {rule.ValidationRule}"));
                }
            }
            else if (rule.SegmentType == "Fund")
            {
                if (fromFund != null && toFund != null && fromFund.Code.StartsWith("GF") && fromFund.Id != toFund.Id)
                {
                    violations.Add(new VirementRuleViolationDto(rule.Principle, rule.Description, rule.Severity,
                        $"Conditional grant fund {fromFund.Code} cannot transfer to different fund {toFund.Code}"));
                }
            }
            else if (rule.SegmentType == "Function")
            {
                if (fromFunction != null && toFunction != null && fromFunction.Id != toFunction.Id && rule.Severity == "Error")
                {
                    violations.Add(new VirementRuleViolationDto(rule.Principle, rule.Description, rule.Severity,
                        $"Function mismatch: from {fromFunction.Code} to {toFunction.Code}. {rule.ValidationRule}"));
                }
            }
            else if (rule.SegmentType == "Project")
            {
                if (fromProject != null && toProject != null && fromProject.Id != toProject.Id)
                {
                    violations.Add(new VirementRuleViolationDto(rule.Principle, rule.Description, rule.Severity,
                        $"Project mismatch: from {fromProject.Code} to {toProject.Code}. {rule.ValidationRule}"));
                }
            }
            else if (rule.ThresholdPercent.HasValue && fromBudgetString != null && fromBudgetString.Year1Amount > 0)
            {
                var pct = dto.Amount / fromBudgetString.Year1Amount * 100;
                if (pct > rule.ThresholdPercent.Value)
                {
                    violations.Add(new VirementRuleViolationDto(rule.Principle, rule.Description, rule.Severity,
                        $"Virement of R {dto.Amount:N0} is {pct:F1}% of source budget (R {fromBudgetString.Year1Amount:N0}), exceeding {rule.ThresholdPercent.Value}% threshold. Council approval required."));
                }
            }
            else if (rule.MaxAmount.HasValue && dto.Amount > rule.MaxAmount.Value)
            {
                violations.Add(new VirementRuleViolationDto(rule.Principle, rule.Description, rule.Severity,
                    $"Virement amount R {dto.Amount:N0} exceeds maximum allowed R {rule.MaxAmount.Value:N0}. Council resolution required."));
            }
        }

        var hasErrors = violations.Any(v => v.Severity == "Error");
        return new VirementValidationResultDto(!hasErrors, violations);
    }

    public async Task<VirementRequest> CreateAsync(CreateVirementDto dto, string userId)
    {
        var count = await _db.VirementRequests.CountAsync(v => v.BudgetVersionId == dto.BudgetVersionId);

        var fromSummary = await GetBudgetSummaryAsync(dto.BudgetVersionId,
            dto.FromScoaItemId, dto.FromScoaFundId, dto.FromScoaFunctionId,
            dto.FromScoaProjectId, dto.FromScoaRegionId, dto.FromScoaCostingId, dto.FromScoaMscId);
        var toSummary = await GetBudgetSummaryAsync(dto.BudgetVersionId,
            dto.ToScoaItemId, dto.ToScoaFundId, dto.ToScoaFunctionId,
            dto.ToScoaProjectId, dto.ToScoaRegionId, dto.ToScoaCostingId, dto.ToScoaMscId);

        var virement = new VirementRequest
        {
            VirementNumber = $"VIR-{DateTime.UtcNow:yyyyMMdd}-{count + 1:D4}",
            BudgetVersionId = dto.BudgetVersionId,
            BudgetType = dto.BudgetType ?? "Operational",
            FromScoaItemId = dto.FromScoaItemId, FromScoaFundId = dto.FromScoaFundId,
            FromScoaFunctionId = dto.FromScoaFunctionId, FromScoaProjectId = dto.FromScoaProjectId,
            FromScoaRegionId = dto.FromScoaRegionId, FromScoaCostingId = dto.FromScoaCostingId, FromScoaMscId = dto.FromScoaMscId,
            ToScoaItemId = dto.ToScoaItemId, ToScoaFundId = dto.ToScoaFundId,
            ToScoaFunctionId = dto.ToScoaFunctionId, ToScoaProjectId = dto.ToScoaProjectId,
            ToScoaRegionId = dto.ToScoaRegionId, ToScoaCostingId = dto.ToScoaCostingId, ToScoaMscId = dto.ToScoaMscId,
            Amount = dto.Amount,
            Motivation = dto.Motivation,
            PolicyReference = dto.PolicyReference,
            Status = VirementStatus.Draft,
            CurrentApprovalLevel = 0,
            CreatedBy = userId,
            FromOriginalBudget = fromSummary.OriginalBudget,
            FromPriorVirements = fromSummary.PriorVirements,
            FromAdjustments = fromSummary.Adjustments,
            FromCurrentBudget = fromSummary.CurrentBudget,
            FromAvailableBudget = fromSummary.AvailableBudget,
            ToOriginalBudget = toSummary.OriginalBudget,
            ToPriorVirements = toSummary.PriorVirements,
            ToAdjustments = toSummary.Adjustments,
            ToCurrentBudget = toSummary.CurrentBudget,
            ToAvailableBudget = toSummary.AvailableBudget
        };

        var fromString = await _db.BudgetStrings.FirstOrDefaultAsync(s =>
            s.BudgetVersionId == dto.BudgetVersionId &&
            s.ScoaItemId == dto.FromScoaItemId && s.ScoaFundId == dto.FromScoaFundId &&
            s.ScoaFunctionId == dto.FromScoaFunctionId && s.ScoaProjectId == dto.FromScoaProjectId);

        if (fromString != null && fromString.Year1Amount > 0)
        {
            virement.ThresholdPercentage = dto.Amount / fromString.Year1Amount * 100;
            virement.ThresholdExceeded = virement.ThresholdPercentage > 20;
            virement.RequiresCouncilApproval = virement.ThresholdExceeded;
        }

        var validation = await ValidateAgainstPolicyAsync(dto);
        if (validation.Violations.Any(v => v.Severity == "Error"))
        {
            virement.PolicyReference = string.Join("; ", validation.Violations.Where(v => v.Severity == "Error").Select(v => v.RulePrinciple));
        }

        var version = await _db.BudgetVersions.Include(bv => bv.FinancialYear).FirstOrDefaultAsync(bv => bv.Id == dto.BudgetVersionId);
        if (version != null)
        {
            var councilRuleExists = await _db.VirementPolicies
                .Include(p => p.Rules)
                .Where(p => p.FinancialYearId == version.FinancialYearId && p.IsActive)
                .SelectMany(p => p.Rules)
                .AnyAsync(r => r.IsEnabled && r.RequiresCouncilApproval);

            if (councilRuleExists && (virement.ThresholdExceeded || validation.Violations.Any(v => v.Severity == "Error")))
            {
                virement.RequiresCouncilApproval = true;
            }
        }

        _db.VirementRequests.Add(virement);
        await _db.SaveChangesAsync();
        await _audit.LogAsync("Virement", virement.Id, "Created", userId, null, $"Virement {virement.VirementNumber} created for R{dto.Amount:N2}");
        return virement;
    }

    public async Task<VirementRequest?> SubmitAsync(int id, ApprovalActionDto dto)
    {
        var v = await _db.VirementRequests.FindAsync(id);
        if (v == null || v.Status != VirementStatus.Draft) return null;
        v.Status = VirementStatus.Submitted;
        v.CurrentApprovalLevel = 1;

        _db.BudgetApprovals.Add(new BudgetApproval
        {
            EntityType = ApprovalEntityType.Virement, EntityId = id, Step = 1,
            Decision = ApprovalDecision.Submitted, Comment = dto.Comment,
            UserId = dto.UserId, UserName = dto.UserName
        });

        await _db.SaveChangesAsync();
        await _audit.LogAsync("Virement", id, "Submitted", dto.UserId, null, $"Submitted for approval. Next: Department Head");
        return v;
    }

    public async Task<VirementRequest?> ApproveAtLevelAsync(int id, ApprovalActionDto dto)
    {
        var v = await _db.VirementRequests.FindAsync(id);
        if (v == null) return null;

        if (v.Status == VirementStatus.Draft || v.Status == VirementStatus.Rejected || v.Status == VirementStatus.Posted)
            return null;

        var currentLevel = v.CurrentApprovalLevel;
        var levelName = ApprovalLevelNames.GetValueOrDefault(currentLevel, $"Level {currentLevel}");

        _db.BudgetApprovals.Add(new BudgetApproval
        {
            EntityType = ApprovalEntityType.Virement, EntityId = id, Step = currentLevel,
            Decision = ApprovalDecision.Approved, Comment = dto.Comment,
            UserId = dto.UserId, UserName = dto.UserName
        });

        var maxLevel = v.RequiresCouncilApproval ? 5 : 4;

        if (currentLevel >= maxLevel)
        {
            if (currentLevel == 5)
                v.Status = VirementStatus.CouncilApproved;
            else
                v.Status = VirementStatus.Approved;

            v.ApprovedBy = dto.UserName;
            v.ApprovedOn = DateTime.UtcNow;

            await PostVirementAsync(v, dto);
        }
        else
        {
            v.CurrentApprovalLevel = currentLevel + 1;
            v.Status = currentLevel switch
            {
                1 => VirementStatus.DeptHeadApproved,
                2 => VirementStatus.BudgetOfficeApproved,
                3 => VirementStatus.CFOApproved,
                4 => VirementStatus.MMApproved,
                5 => VirementStatus.CouncilApproved,
                _ => VirementStatus.Approved
            };
        }

        await _db.SaveChangesAsync();
        var nextLevelName = ApprovalLevelNames.GetValueOrDefault(v.CurrentApprovalLevel, "Final");
        await _audit.LogAsync("Virement", id, $"Approved by {levelName}", dto.UserId, null,
            $"Approved by {dto.UserName} ({levelName}). Next: {(currentLevel >= maxLevel ? "Posted" : nextLevelName)}");
        return v;
    }

    private async Task PostVirementAsync(VirementRequest v, ApprovalActionDto dto)
    {
        var fromString = await _db.BudgetStrings.FirstOrDefaultAsync(s =>
            s.BudgetVersionId == v.BudgetVersionId &&
            s.ScoaItemId == v.FromScoaItemId && s.ScoaFundId == v.FromScoaFundId &&
            s.ScoaFunctionId == v.FromScoaFunctionId && s.ScoaProjectId == v.FromScoaProjectId &&
            s.ScoaRegionId == v.FromScoaRegionId && s.ScoaCostingId == v.FromScoaCostingId && s.ScoaMscId == v.FromScoaMscId);

        var toStr = await _db.BudgetStrings.FirstOrDefaultAsync(s =>
            s.BudgetVersionId == v.BudgetVersionId &&
            s.ScoaItemId == v.ToScoaItemId && s.ScoaFundId == v.ToScoaFundId &&
            s.ScoaFunctionId == v.ToScoaFunctionId && s.ScoaProjectId == v.ToScoaProjectId &&
            s.ScoaRegionId == v.ToScoaRegionId && s.ScoaCostingId == v.ToScoaCostingId && s.ScoaMscId == v.ToScoaMscId);

        if (fromString != null)
        {
            fromString.Year1Amount -= v.Amount;
            fromString.ModifiedBy = dto.UserId;
            fromString.ModifiedOn = DateTime.UtcNow;
        }

        if (toStr != null)
        {
            toStr.Year1Amount += v.Amount;
            toStr.ModifiedBy = dto.UserId;
            toStr.ModifiedOn = DateTime.UtcNow;
        }

        v.Status = VirementStatus.Posted;
    }

    public async Task<VirementRequest?> ApproveAsync(int id, ApprovalActionDto dto)
    {
        return await ApproveAtLevelAsync(id, dto);
    }

    public async Task<VirementRequest?> RejectAsync(int id, ApprovalActionDto dto)
    {
        var v = await _db.VirementRequests.FindAsync(id);
        if (v == null || v.Status == VirementStatus.Draft || v.Status == VirementStatus.Rejected || v.Status == VirementStatus.Posted) return null;

        var currentLevel = v.CurrentApprovalLevel;
        var levelName = ApprovalLevelNames.GetValueOrDefault(currentLevel, $"Level {currentLevel}");

        v.Status = VirementStatus.Rejected;
        v.RejectedBy = dto.UserName;
        v.RejectedOn = DateTime.UtcNow;
        v.RejectionReason = dto.Comment;

        _db.BudgetApprovals.Add(new BudgetApproval
        {
            EntityType = ApprovalEntityType.Virement, EntityId = id, Step = currentLevel,
            Decision = ApprovalDecision.Rejected, Comment = dto.Comment,
            UserId = dto.UserId, UserName = dto.UserName
        });

        await _db.SaveChangesAsync();
        await _audit.LogAsync("Virement", id, $"Rejected by {levelName}", dto.UserId, null, $"Rejected by {dto.UserName}: {dto.Comment}");
        return v;
    }

    public async Task<VirementRequest?> ReturnAsync(int id, ApprovalActionDto dto)
    {
        var v = await _db.VirementRequests.FindAsync(id);
        if (v == null || v.Status == VirementStatus.Draft || v.Status == VirementStatus.Posted || v.Status == VirementStatus.Rejected) return null;

        var currentLevel = v.CurrentApprovalLevel;
        v.Status = VirementStatus.Returned;
        v.CurrentApprovalLevel = Math.Max(1, currentLevel - 1);

        _db.BudgetApprovals.Add(new BudgetApproval
        {
            EntityType = ApprovalEntityType.Virement, EntityId = id, Step = currentLevel,
            Decision = ApprovalDecision.Returned, Comment = dto.Comment,
            UserId = dto.UserId, UserName = dto.UserName
        });

        await _db.SaveChangesAsync();
        await _audit.LogAsync("Virement", id, "Returned", dto.UserId, null, $"Returned by {dto.UserName}: {dto.Comment}");
        return v;
    }
}
