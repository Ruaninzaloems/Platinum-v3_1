using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.Models;

namespace PlatinumBudget.Api.Services;

public class EmsVirementListDto
{
    public int VirementId { get; set; }
    public string? FinYear { get; set; }
    public string? VirementReferenceNumber { get; set; }
    public int FromProjectId { get; set; }
    public int? FromProjectCode { get; set; }
    public string? FromProjectName { get; set; }
    public int ToProjectId { get; set; }
    public int? ToProjectCode { get; set; }
    public string? ToProjectName { get; set; }
    public decimal? FromVirementAmount { get; set; }
    public decimal? ToVirementAmount { get; set; }
    public string? Status { get; set; }
    public string? NextApproverName { get; set; }
    public int? NextApproverUserId { get; set; }
    public DateTime DateCaptured { get; set; }
    public int ApproverCount { get; set; }
    public int ApprovedCount { get; set; }
}

public class EmsVirementDetailDto : EmsVirementListDto
{
    public string? ReasonForVirement { get; set; }
    public int? FromSCOAItem { get; set; }
    public string? FromScoaItemCode { get; set; }
    public int? ToSCOAItem { get; set; }
    public string? ToScoaItemCode { get; set; }
    public List<EmsApprovalStepDto> ApprovalChain { get; set; } = [];
}

public class EmsApprovalStepDto
{
    public int Order { get; set; }
    public int? UserId { get; set; }
    public string? UserDisplay { get; set; }
    public string? Status { get; set; }
    public DateTime? ActionDate { get; set; }
    public string? Reason { get; set; }
}

public class EmsCreateVirementRequest
{
    public string FinYear { get; set; } = "";
    public int FromProjectId { get; set; }
    public int ToProjectId { get; set; }
    public int? FromPlanProjectItemId { get; set; }
    public int? ToPlanProjectItemId { get; set; }
    public int? FromSCOAItem { get; set; }
    public int? ToSCOAItem { get; set; }
    public int? FromSCOAFund { get; set; }
    public int? ToSCOAFund { get; set; }
    public int? FromSCOAFunction { get; set; }
    public int? ToSCOAFunction { get; set; }
    public int? FromSCOARegion { get; set; }
    public int? ToSCOARegion { get; set; }
    public decimal FromVirementAmount { get; set; }
    public decimal ToVirementAmount { get; set; }
    public string? ReasonForVirement { get; set; }
    public List<int> ApproverUserIds { get; set; } = [];
    public int CreatedByUserId { get; set; } = 1;
}

public class EmsVirementService
{
    private readonly BudgetDbContext _db;
    private readonly EmsBudgetConsumptionService _consumptionSvc;

    public EmsVirementService(BudgetDbContext db, EmsBudgetConsumptionService consumptionSvc)
    {
        _db = db;
        _consumptionSvc = consumptionSvc;
    }

    private async Task<string> GetVirementStatusAsync(int virementId)
    {
        var approverCount = await _db.Set<Plan_VirementApprovalUsers>()
            .CountAsync(v => v.VirementId == virementId);

        if (approverCount == 0) return "Draft";

        var rejected = await _db.Set<Plan_VirementApprovalRejections>()
            .AnyAsync(r => r.VirementId == virementId && r.IsRejected == true);
        if (rejected) return "Rejected";

        var approvedCount = await _db.Set<Plan_VirementApprovalRejections>()
            .CountAsync(r => r.VirementId == virementId && r.IsApproved == true);

        if (approvedCount >= approverCount) return "Approved";
        if (approvedCount > 0) return "Pending";
        return "Pending";
    }

    public async Task<List<EmsVirementListDto>> GetVirementsAsync(string? finYear)
    {
        var virementsQuery = _db.Set<Plan_Virements>().AsQueryable();
        if (!string.IsNullOrEmpty(finYear))
            virementsQuery = virementsQuery.Where(v => v.FinYear == finYear);

        var virements = await virementsQuery.OrderByDescending(v => v.DateCaptured).ToListAsync();
        var projectIds = virements.SelectMany(v => new[] { v.FromProjectId, v.ToProjectId }).Distinct().ToList();
        var projects = await _db.Set<Plan_Project>()
            .Where(p => projectIds.Contains(p.Project_ID))
            .ToDictionaryAsync(p => p.Project_ID);

        var virementIds = virements.Select(v => v.VirementId).ToList();
        var approvalUsers = await _db.Set<Plan_VirementApprovalUsers>()
            .Where(u => u.VirementId.HasValue && virementIds.Contains(u.VirementId!.Value))
            .ToListAsync();
        var approvalRejections = await _db.Set<Plan_VirementApprovalRejections>()
            .Where(r => r.VirementId.HasValue && virementIds.Contains(r.VirementId!.Value))
            .ToListAsync();

        var result = new List<EmsVirementListDto>();

        foreach (var v in virements)
        {
            projects.TryGetValue(v.FromProjectId, out var fromProj);
            projects.TryGetValue(v.ToProjectId, out var toProj);

            var approvers = approvalUsers.Where(u => u.VirementId == v.VirementId)
                .OrderBy(u => u.DateCaptured).ToList();
            var approverCount = approvers.Count;
            var approved = approvalRejections.Where(r => r.VirementId == v.VirementId && r.IsApproved == true).ToList();
            var rejected = approvalRejections.Any(r => r.VirementId == v.VirementId && r.IsRejected == true);

            string status = approverCount == 0 ? "Draft"
                : rejected ? "Rejected"
                : approved.Count >= approverCount ? "Posted"
                : approved.Count > 0 ? "Pending" : "Pending";

            var actedUserIds = approvalRejections.Where(r => r.VirementId == v.VirementId)
                .Select(r => r.IsApproved == true ? r.ApprovedBy : r.RejectedBy).ToHashSet();
            var nextApprover = approvers.FirstOrDefault(u => !actedUserIds.Contains(u.UserId));

            result.Add(new EmsVirementListDto
            {
                VirementId = v.VirementId,
                FinYear = v.FinYear,
                VirementReferenceNumber = v.VirementReferenceNumber,
                FromProjectId = v.FromProjectId,
                FromProjectCode = fromProj?.ProjectCode,
                FromProjectName = fromProj?.ProjectName,
                ToProjectId = v.ToProjectId,
                ToProjectCode = toProj?.ProjectCode,
                ToProjectName = toProj?.ProjectName,
                FromVirementAmount = v.FromVirementAmount,
                ToVirementAmount = v.ToVirementAmount,
                Status = status,
                NextApproverUserId = nextApprover?.UserId,
                NextApproverName = nextApprover != null ? $"User {nextApprover.UserId}" : null,
                DateCaptured = v.DateCaptured,
                ApproverCount = approverCount,
                ApprovedCount = approved.Count
            });
        }

        return result;
    }

    public async Task<EmsVirementDetailDto?> GetVirementDetailAsync(int virementId)
    {
        var v = await _db.Set<Plan_Virements>().FindAsync(virementId);
        if (v == null) return null;

        var fromProj = await _db.Set<Plan_Project>().FindAsync(v.FromProjectId);
        var toProj = await _db.Set<Plan_Project>().FindAsync(v.ToProjectId);

        var approvers = await _db.Set<Plan_VirementApprovalUsers>()
            .Where(u => u.VirementId == virementId)
            .OrderBy(u => u.DateCaptured)
            .ToListAsync();

        var rejections = await _db.Set<Plan_VirementApprovalRejections>()
            .Where(r => r.VirementId == virementId)
            .ToListAsync();

        var chain = approvers.Select((u, idx) =>
        {
            var action = rejections.FirstOrDefault(r =>
                (r.IsApproved == true && r.ApprovedBy == u.UserId) ||
                (r.IsRejected == true && r.RejectedBy == u.UserId));

            return new EmsApprovalStepDto
            {
                Order = idx + 1,
                UserId = u.UserId,
                UserDisplay = $"User {u.UserId}",
                Status = action == null ? "Pending" : action.IsApproved == true ? "Approved" : "Rejected",
                ActionDate = action?.ApprovedOn ?? action?.RejectedOn,
                Reason = action?.RejectReason
            };
        }).ToList();

        var approvedCount = chain.Count(s => s.Status == "Approved");
        var isRejected = chain.Any(s => s.Status == "Rejected");
        var status = approvers.Count == 0 ? "Draft"
            : isRejected ? "Rejected"
            : approvedCount >= approvers.Count ? "Posted"
            : approvedCount > 0 ? "Pending" : "Pending";

        var nextApprover = chain.FirstOrDefault(s => s.Status == "Pending");

        return new EmsVirementDetailDto
        {
            VirementId = v.VirementId,
            FinYear = v.FinYear,
            VirementReferenceNumber = v.VirementReferenceNumber,
            FromProjectId = v.FromProjectId,
            FromProjectCode = fromProj?.ProjectCode,
            FromProjectName = fromProj?.ProjectName,
            ToProjectId = v.ToProjectId,
            ToProjectCode = toProj?.ProjectCode,
            ToProjectName = toProj?.ProjectName,
            FromVirementAmount = v.FromVirementAmount,
            ToVirementAmount = v.ToVirementAmount,
            ReasonForVirement = v.ReasonForVirement,
            FromSCOAItem = v.FromSCOAItem,
            ToSCOAItem = v.ToSCOAItem,
            Status = status,
            NextApproverUserId = nextApprover?.UserId,
            DateCaptured = v.DateCaptured,
            ApproverCount = approvers.Count,
            ApprovedCount = approvedCount,
            ApprovalChain = chain
        };
    }

    public async Task<Plan_Virements> CreateVirementAsync(EmsCreateVirementRequest req)
    {
        var now = DateTime.UtcNow;
        var refNumber = $"VIR-{now:yyyyMMddHHmmss}";

        var virement = new Plan_Virements
        {
            FinYear = req.FinYear,
            FromProjectId = req.FromProjectId,
            ToProjectId = req.ToProjectId,
            FromProjectItemId = req.FromPlanProjectItemId,
            ToProjectItemId = req.ToPlanProjectItemId,
            FromSCOAItem = req.FromSCOAItem,
            ToSCOAItem = req.ToSCOAItem,
            FromSCOAFundID = req.FromSCOAFund,
            ToSCOAFundID = req.ToSCOAFund,
            FromSCOAFunctionId = req.FromSCOAFunction,
            ToSCOAFunctionId = req.ToSCOAFunction,
            FromSCOARegion = req.FromSCOARegion,
            ToSCOARegion = req.ToSCOARegion,
            FromVirementAmount = req.FromVirementAmount,
            ToVirementAmount = req.ToVirementAmount,
            ReasonForVirement = req.ReasonForVirement,
            VirementReferenceNumber = refNumber,
            TransferBy = req.CreatedByUserId,
            TransferOn = now,
            CapturerID = req.CreatedByUserId,
            DateCaptured = now
        };

        _db.Set<Plan_Virements>().Add(virement);
        await _db.SaveChangesAsync();

        foreach (var (userId, idx) in req.ApproverUserIds.Select((u, i) => (u, i)))
        {
            _db.Set<Plan_VirementApprovalUsers>().Add(new Plan_VirementApprovalUsers
            {
                VirementId = virement.VirementId,
                UserId = userId,
                CapturerID = req.CreatedByUserId,
                DateCaptured = now.AddSeconds(idx)
            });
        }

        await _db.SaveChangesAsync();
        return virement;
    }

    public async Task<(bool Success, string Message)> ApproveVirementAsync(int virementId, int userId, string? comment)
    {
        var virement = await _db.Set<Plan_Virements>().FindAsync(virementId);
        if (virement == null) return (false, "Virement not found");

        var isApprover = await _db.Set<Plan_VirementApprovalUsers>()
            .AnyAsync(u => u.VirementId == virementId && u.UserId == userId);
        if (!isApprover) return (false, "User is not an approver for this virement");

        var alreadyActed = await _db.Set<Plan_VirementApprovalRejections>()
            .AnyAsync(r => r.VirementId == virementId
                && (r.ApprovedBy == userId || r.RejectedBy == userId));
        if (alreadyActed) return (false, "User has already acted on this virement");

        _db.Set<Plan_VirementApprovalRejections>().Add(new Plan_VirementApprovalRejections
        {
            VirementId = virementId,
            IsApproved = true,
            ApprovedBy = userId,
            ApprovedOn = DateTime.UtcNow,
            CapturerID = userId,
            DateCaptured = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();

        var isLast = await IsLastApproverAsync(virementId, userId);
        if (isLast)
        {
            await PostVirementAsync(virementId, userId);
            return (true, "Virement approved and posted");
        }

        return (true, "Virement approved, awaiting further approval");
    }

    public async Task<(bool Success, string Message)> RejectVirementAsync(int virementId, int userId, string rejectReason)
    {
        var virement = await _db.Set<Plan_Virements>().FindAsync(virementId);
        if (virement == null) return (false, "Virement not found");

        _db.Set<Plan_VirementApprovalRejections>().Add(new Plan_VirementApprovalRejections
        {
            VirementId = virementId,
            IsRejected = true,
            RejectedBy = userId,
            RejectedOn = DateTime.UtcNow,
            RejectReason = rejectReason,
            CapturerID = userId,
            DateCaptured = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
        return (true, "Virement rejected");
    }

    public async Task<bool> IsLastApproverAsync(int virementId, int userId)
    {
        var anyRejected = await _db.Set<Plan_VirementApprovalRejections>()
            .AnyAsync(r => r.VirementId == virementId && r.IsRejected == true);
        if (anyRejected) return false;

        var approverCount = await _db.Set<Plan_VirementApprovalUsers>()
            .CountAsync(u => u.VirementId == virementId);

        var approvedUserIds = await _db.Set<Plan_VirementApprovalRejections>()
            .Where(r => r.VirementId == virementId && r.IsApproved == true)
            .Select(r => r.ApprovedBy)
            .ToListAsync();

        var unapprovedApprovers = await _db.Set<Plan_VirementApprovalUsers>()
            .Where(u => u.VirementId == virementId && !approvedUserIds.Contains(u.UserId))
            .CountAsync();

        return unapprovedApprovers == 1;
    }

    public async Task PostVirementAsync(int virementId, int userId)
    {
        var virement = await _db.Set<Plan_Virements>().FindAsync(virementId);
        if (virement == null) return;

        var fromAmount = virement.FromVirementAmount ?? 0;
        var toAmount = virement.ToVirementAmount ?? 0;

        if (virement.FromProjectItemId.HasValue)
        {
            var fromItem = await _db.Set<Plan_ProjectItem>().FindAsync(virement.FromProjectItemId.Value);
            if (fromItem != null)
            {
                fromItem.BudgetAmount = (fromItem.BudgetAmount ?? 0) - fromAmount;
                fromItem.DateModified = DateTime.UtcNow;
                fromItem.ModifierID = userId;

                await _consumptionSvc.InsertConsumptionAsync(new EmsConsumptionInsertRequest
                {
                    FinYear = virement.FinYear ?? fromItem.FinYear ?? "",
                    PlanProjectItemId = fromItem.PlanProjectItem_ID,
                    TransactionTypeId = 3,
                    ModuleId = 10,
                    ProcessId = 201,
                    TransactionId = virementId,
                    TransactionTable = "Plan_Virements",
                    CapturerId = userId,
                    TransactionAmount = -fromAmount,
                    AvailableBudgetDiff = -fromAmount,
                    ReserveToDateDiff = 0,
                    CapturedExpenditureToDateDiff = 0,
                    CommitToDateDiff = 0,
                    InitialLine = $"Plan_Virements_{virementId}_From",
                    CurrentlyConsumedAmount = fromAmount
                });
            }
        }

        if (virement.ToProjectItemId.HasValue)
        {
            var toItem = await _db.Set<Plan_ProjectItem>().FindAsync(virement.ToProjectItemId.Value);
            if (toItem != null)
            {
                toItem.BudgetAmount = (toItem.BudgetAmount ?? 0) + toAmount;
                toItem.DateModified = DateTime.UtcNow;
                toItem.ModifierID = userId;

                await _consumptionSvc.InsertConsumptionAsync(new EmsConsumptionInsertRequest
                {
                    FinYear = virement.FinYear ?? toItem.FinYear ?? "",
                    PlanProjectItemId = toItem.PlanProjectItem_ID,
                    TransactionTypeId = 3,
                    ModuleId = 10,
                    ProcessId = 201,
                    TransactionId = virementId,
                    TransactionTable = "Plan_Virements",
                    CapturerId = userId,
                    TransactionAmount = toAmount,
                    AvailableBudgetDiff = toAmount,
                    ReserveToDateDiff = 0,
                    CapturedExpenditureToDateDiff = 0,
                    CommitToDateDiff = 0,
                    InitialLine = $"Plan_Virements_{virementId}_To",
                    CurrentlyConsumedAmount = 0
                });
            }
        }

        virement.FromNewAvailableBudget = (virement.FromAvailableFund ?? 0) - fromAmount;
        virement.ToNewAvailableBudget = (virement.ToAvailableFund ?? 0) + toAmount;
        virement.ModifierID = userId;
        virement.DateModified = DateTime.UtcNow;

        await _db.SaveChangesAsync();
    }
}
