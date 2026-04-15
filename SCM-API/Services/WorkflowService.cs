using Microsoft.EntityFrameworkCore;
using SCM_API.Data;
using SCM_API.Helpers;
using SCM_API.Models.Domain;
using SCM_API.Services.Interfaces;

namespace SCM_API.Services;

public class WorkflowService : IWorkflowService
{
    private readonly ApplicationDbContext _context;
    private readonly DbAvailabilityChecker _dbChecker;
    private readonly ILogger<WorkflowService> _logger;
    private readonly IHttpContextAccessor _httpContextAccessor;

    private static readonly Dictionary<string, List<object>> _fallbackSteps = new()
    {
        ["Requisition"] = new List<object>
        {
            new { Step = 1, Name = "Draft", Description = "Initial creation", SectionId = "draft", Required = true },
            new { Step = 2, Name = "Submitted", Description = "Submitted for supervisor approval", SectionId = "submitted", Required = true },
            new { Step = 3, Name = "Supervisor Approved", Description = "Approved by supervisor", SectionId = "supervisor_approved", Required = true },
            new { Step = 4, Name = "HOD Approved", Description = "Approved by Head of Department", SectionId = "hod_approved", Required = true },
            new { Step = 5, Name = "SCM Routed", Description = "Routed to SCM for processing", SectionId = "scm_routed", Required = true },
            new { Step = 6, Name = "Completed", Description = "Requisition processing completed", SectionId = "completed", Required = true }
        },
        ["Order"] = new List<object>
        {
            new { Step = 1, Name = "Draft", Description = "Order created", SectionId = "draft", Required = true },
            new { Step = 2, Name = "Submitted", Description = "Submitted for approval", SectionId = "submitted", Required = true },
            new { Step = 3, Name = "Approved", Description = "Order approved", SectionId = "approved", Required = true },
            new { Step = 4, Name = "Dispatched", Description = "Dispatched to vendor", SectionId = "dispatched", Required = true },
            new { Step = 5, Name = "Completed", Description = "Order fulfilled", SectionId = "completed", Required = true }
        },
        ["Invoice"] = new List<object>
        {
            new { Step = 1, Name = "Draft", Description = "Invoice captured", SectionId = "draft", Required = true },
            new { Step = 2, Name = "Submitted", Description = "Submitted for 3-way match", SectionId = "submitted", Required = true },
            new { Step = 3, Name = "Verified", Description = "3-way match verified", SectionId = "verified", Required = true },
            new { Step = 4, Name = "Approved", Description = "Approved for payment", SectionId = "approved", Required = true },
            new { Step = 5, Name = "Paid", Description = "Payment processed", SectionId = "paid", Required = true }
        },
        ["Tender"] = new List<object>
        {
            new { Step = 1, Name = "Draft", Description = "Tender created", SectionId = "draft", Required = true },
            new { Step = 2, Name = "BSC Review", Description = "Bid Specification Committee review", SectionId = "bsc_review", Required = true },
            new { Step = 3, Name = "Published", Description = "Advertised publicly", SectionId = "published", Required = true },
            new { Step = 4, Name = "Closed", Description = "Bidding closed", SectionId = "closed", Required = true },
            new { Step = 5, Name = "BEC Evaluation", Description = "Bid Evaluation Committee scoring", SectionId = "bec_evaluation", Required = true },
            new { Step = 6, Name = "BAC Adjudication", Description = "Bid Adjudication Committee review", SectionId = "bac_adjudication", Required = true },
            new { Step = 7, Name = "AO Approval", Description = "Accounting Officer final approval", SectionId = "ao_approval", Required = true },
            new { Step = 8, Name = "Awarded", Description = "Tender awarded", SectionId = "awarded", Required = true }
        },
        ["Contract"] = new List<object>
        {
            new { Step = 1, Name = "Draft", Description = "Contract created", SectionId = "draft", Required = true },
            new { Step = 2, Name = "Submitted", Description = "Submitted for approval", SectionId = "submitted", Required = true },
            new { Step = 3, Name = "Approved", Description = "Contract approved", SectionId = "approved", Required = true },
            new { Step = 4, Name = "Active", Description = "Contract active", SectionId = "active", Required = true },
            new { Step = 5, Name = "Completed", Description = "Contract completed", SectionId = "completed", Required = true }
        },
        ["Payment"] = new List<object>
        {
            new { Step = 1, Name = "Draft", Description = "Payment batch created", SectionId = "draft", Required = true },
            new { Step = 2, Name = "Submitted", Description = "Submitted for approval", SectionId = "submitted", Required = true },
            new { Step = 3, Name = "Approved", Description = "Batch approved", SectionId = "approved", Required = true },
            new { Step = 4, Name = "Processed", Description = "EFT generated and processed", SectionId = "processed", Required = true }
        },
        ["GRN"] = new List<object>
        {
            new { Step = 1, Name = "Draft", Description = "GRN captured", SectionId = "draft", Required = true },
            new { Step = 2, Name = "Submitted", Description = "Submitted for approval", SectionId = "submitted", Required = true },
            new { Step = 3, Name = "Approved", Description = "GRN approved", SectionId = "approved", Required = true }
        },
        ["InformalTender"] = new List<object>
        {
            new { Step = 1, Name = "Draft", Description = "Informal tender created", SectionId = "draft", Required = true },
            new { Step = 2, Name = "Published", Description = "Sent to vendors", SectionId = "published", Required = true },
            new { Step = 3, Name = "Closed", Description = "Responses collected", SectionId = "closed", Required = true },
            new { Step = 4, Name = "Adjudicated", Description = "Evaluated and scored", SectionId = "adjudicated", Required = true },
            new { Step = 5, Name = "Awarded", Description = "Winner selected", SectionId = "awarded", Required = true },
            new { Step = 6, Name = "Completed", Description = "Process completed", SectionId = "completed", Required = true }
        }
    };

    public WorkflowService(ApplicationDbContext context, DbAvailabilityChecker dbChecker, ILogger<WorkflowService> logger, IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _dbChecker = dbChecker;
        _logger = logger;
        _httpContextAccessor = httpContextAccessor;
    }

    private bool UseDb => _dbChecker.IsDbAvailable;

    private int GetCurrentUserId()
    {
        var claim = _httpContextAccessor.HttpContext?.User?.FindFirst(
            System.Security.Claims.ClaimTypes.NameIdentifier);
        return claim != null && int.TryParse(claim.Value, out var id) ? id : 1;
    }

    private async Task<SysWorkFlow?> FindWorkflowForEntityAsync(string entityType)
    {
        return await _context.SysWorkFlows
            .Include(w => w.Sections)
            .Where(w => w.Area.ToLower().Contains(entityType.ToLower()) ||
                        w.PageName.ToLower().Contains(entityType.ToLower()))
            .FirstOrDefaultAsync();
    }

    public async Task<object> GetWorkflowStepsAsync(string entityType)
    {
        if (UseDb)
        {
            try
            {
                var workflow = await FindWorkflowForEntityAsync(entityType);

                if (workflow != null)
                {
                    return workflow.Sections
                        .OrderBy(s => s.SectionOrder)
                        .Select(s => new
                        {
                            Step = s.SectionOrder,
                            Name = s.SectionHeader,
                            Description = s.PermissionDescription ?? s.SectionHeader,
                            SectionId = s.SectionId,
                            Required = s.Required
                        })
                        .ToList<object>();
                }

                _logger.LogInformation("No workflow definition found in DB for entity type '{EntityType}', using fallback", entityType);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load workflow steps from DB for {EntityType}, using fallback", entityType);
                _dbChecker.MarkUnavailable();
            }
        }

        return GetFallbackSteps(entityType);
    }

    public async Task<object> GetApprovalChainAsync(string entityType, int entityId)
    {
        if (UseDb)
        {
            try
            {
                var workflow = await FindWorkflowForEntityAsync(entityType);
                var query = _context.SysWorkFlowSectionAudits
                    .Where(a => a.RecordId == entityId);

                if (workflow != null)
                    query = query.Where(a => a.WorkFlowId == workflow.WorkFlowId);

                var audits = await query.OrderBy(a => a.DateCaptured).ToListAsync();

                var userIds = audits.Select(a => a.CapturerId).Distinct().ToList();
                var users = await _context.Users
                    .Where(u => userIds.Contains(u.UserId))
                    .ToListAsync();
                var userMap = users.ToDictionary(u => u.UserId, u => $"{u.FirstName} {u.LastName}".Trim());

                return audits.Select(a => new
                {
                    SectionId = a.WorkFlowSectionId,
                    ApprovedBy = userMap.GetValueOrDefault(a.CapturerId, $"User #{a.CapturerId}"),
                    ApprovedById = a.CapturerId,
                    ApprovedDate = a.DateCaptured,
                    Completed = a.Completed,
                    WorkFlowId = a.WorkFlowId
                }).ToList<object>();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load approval chain from DB for {EntityType}/{EntityId}", entityType, entityId);
                _dbChecker.MarkUnavailable();
            }
        }

        return new List<object>();
    }

    public async Task<bool> AdvanceWorkflowAsync(int entityId, string entityType, object approvalDto)
    {
        var currentUserId = GetCurrentUserId();

        if (UseDb)
        {
            try
            {
                var workflow = await FindWorkflowForEntityAsync(entityType);

                if (workflow != null)
                {
                    var completedSections = await _context.SysWorkFlowSectionAudits
                        .Where(a => a.RecordId == entityId && a.WorkFlowId == workflow.WorkFlowId && a.Completed)
                        .Select(a => a.WorkFlowSectionId)
                        .ToListAsync();

                    var nextSection = workflow.Sections
                        .OrderBy(s => s.SectionOrder)
                        .FirstOrDefault(s => !completedSections.Contains(s.SectionId));

                    if (nextSection != null)
                    {
                        var audit = new SysWorkFlowSectionAudit
                        {
                            RecordId = entityId,
                            WorkFlowId = workflow.WorkFlowId,
                            WorkFlowSectionId = nextSection.SectionId,
                            CapturerId = currentUserId,
                            DateCaptured = DateTime.UtcNow,
                            Completed = true
                        };
                        await _context.SysWorkFlowSectionAudits.AddAsync(audit);
                        await _context.SaveChangesAsync();
                        _logger.LogInformation("User {UserId} advanced workflow for {EntityType}/{EntityId} to section '{Section}'", currentUserId, entityType, entityId, nextSection.SectionHeader);
                        return true;
                    }

                    _logger.LogInformation("No more workflow sections to advance for {EntityType}/{EntityId}", entityType, entityId);
                    return true;
                }

                _logger.LogInformation("No workflow definition found for {EntityType}, allowing advance", entityType);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to advance workflow for {EntityType}/{EntityId}", entityType, entityId);
                _dbChecker.MarkUnavailable();
            }
        }

        return true;
    }

    public async Task<bool> RejectAsync(int entityId, string entityType, object rejectionDto)
    {
        var currentUserId = GetCurrentUserId();

        if (UseDb)
        {
            try
            {
                var workflow = await FindWorkflowForEntityAsync(entityType);

                if (workflow != null)
                {
                    var audit = new SysWorkFlowSectionAudit
                    {
                        RecordId = entityId,
                        WorkFlowId = workflow.WorkFlowId,
                        WorkFlowSectionId = "rejected",
                        CapturerId = currentUserId,
                        DateCaptured = DateTime.UtcNow,
                        Completed = true
                    };
                    await _context.SysWorkFlowSectionAudits.AddAsync(audit);
                    await _context.SaveChangesAsync();
                }

                _logger.LogInformation("User {UserId} rejected workflow for {EntityType}/{EntityId}", currentUserId, entityType, entityId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to reject workflow for {EntityType}/{EntityId}", entityType, entityId);
                _dbChecker.MarkUnavailable();
            }
        }

        return true;
    }

    public async Task<bool> ReturnAsync(int entityId, string entityType, object returnDto)
    {
        var currentUserId = GetCurrentUserId();

        if (UseDb)
        {
            try
            {
                var workflow = await FindWorkflowForEntityAsync(entityType);
                var query = _context.SysWorkFlowSectionAudits
                    .Where(a => a.RecordId == entityId && a.Completed);

                if (workflow != null)
                    query = query.Where(a => a.WorkFlowId == workflow.WorkFlowId);

                var lastAudit = await query
                    .OrderByDescending(a => a.DateCaptured)
                    .FirstOrDefaultAsync();

                if (lastAudit != null)
                {
                    lastAudit.Completed = false;
                    _context.SysWorkFlowSectionAudits.Update(lastAudit);
                    await _context.SaveChangesAsync();
                }

                _logger.LogInformation("User {UserId} returned workflow for {EntityType}/{EntityId} to previous step", currentUserId, entityType, entityId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to return workflow for {EntityType}/{EntityId}", entityType, entityId);
                _dbChecker.MarkUnavailable();
            }
        }

        return true;
    }

    public async Task<object> GetPendingApprovalsAsync(int userId, int page, int pageSize)
    {
        if (UseDb)
        {
            try
            {
                var userRoleIds = await _context.UserRoles
                    .Where(ur => ur.UserId == userId)
                    .Select(ur => ur.RoleId)
                    .ToListAsync();

                var authorizedSectionIds = await _context.SysRolePermissionSections
                    .Where(rps => userRoleIds.Contains(rps.RoleId))
                    .Select(rps => rps.WorkFlowSectionId)
                    .Distinct()
                    .ToListAsync();

                var workflows = await _context.SysWorkFlows
                    .Include(w => w.Sections)
                    .ToListAsync();

                var allAudits = await _context.SysWorkFlowSectionAudits
                    .OrderByDescending(a => a.DateCaptured)
                    .ToListAsync();

                var pending = new List<object>();
                var recordGroups = allAudits.GroupBy(a => new { a.RecordId, a.WorkFlowId });

                foreach (var group in recordGroups)
                {
                    var wf = workflows.FirstOrDefault(w => w.WorkFlowId == group.Key.WorkFlowId);
                    if (wf == null) continue;

                    var sections = wf.Sections.OrderBy(s => s.SectionOrder).ToList();
                    var completedIds = group
                        .Where(a => a.Completed)
                        .Select(a => a.WorkFlowSectionId)
                        .ToHashSet();

                    var nextSection = sections.FirstOrDefault(s => !completedIds.Contains(s.SectionId));
                    if (nextSection == null) continue;

                    if (authorizedSectionIds.Any() && !authorizedSectionIds.Contains(nextSection.WorkFlowSectionId))
                        continue;

                    var lastDate = group.Max(a => a.DateCaptured);
                    pending.Add(new
                    {
                        RecordId = group.Key.RecordId,
                        EntityType = wf.Area,
                        WorkFlowId = group.Key.WorkFlowId,
                        PendingStep = nextSection.SectionHeader,
                        PendingSectionId = nextSection.SectionId,
                        LastUpdated = lastDate
                    });
                }

                var paged = pending
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                return new { items = paged, total = pending.Count, page, pageSize };
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load pending approvals from DB");
                _dbChecker.MarkUnavailable();
            }
        }

        return new { items = new List<object>(), total = 0, page, pageSize };
    }

    public async Task<object> GetApprovalHistoryAsync(string entityType, int entityId)
    {
        if (UseDb)
        {
            try
            {
                var workflow = await FindWorkflowForEntityAsync(entityType);
                var query = _context.SysWorkFlowSectionAudits
                    .Where(a => a.RecordId == entityId);

                if (workflow != null)
                    query = query.Where(a => a.WorkFlowId == workflow.WorkFlowId);

                var audits = await query.OrderBy(a => a.DateCaptured).ToListAsync();

                var userIds = audits.Select(a => a.CapturerId).Distinct().ToList();
                var users = await _context.Users
                    .Where(u => userIds.Contains(u.UserId))
                    .ToListAsync();
                var userMap = users.ToDictionary(u => u.UserId, u => $"{u.FirstName} {u.LastName}".Trim());

                return audits.Select(a => new
                {
                    Section = a.WorkFlowSectionId,
                    Action = a.Completed ? "Completed" : "Pending",
                    PerformedBy = userMap.GetValueOrDefault(a.CapturerId, $"User #{a.CapturerId}"),
                    PerformedById = a.CapturerId,
                    Date = a.DateCaptured,
                    Completed = a.Completed
                }).ToList<object>();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load approval history from DB for {EntityType}/{EntityId}", entityType, entityId);
                _dbChecker.MarkUnavailable();
            }
        }

        return new List<object>();
    }

    private static List<object> GetFallbackSteps(string entityType)
    {
        var key = _fallbackSteps.Keys.FirstOrDefault(k => k.Equals(entityType, StringComparison.OrdinalIgnoreCase));
        if (key != null) return _fallbackSteps[key];

        return new List<object>
        {
            new { Step = 1, Name = "Draft", Description = "Initial creation", SectionId = "draft", Required = true },
            new { Step = 2, Name = "Submitted", Description = "Submitted for approval", SectionId = "submitted", Required = true },
            new { Step = 3, Name = "Approved", Description = "Approved by authority", SectionId = "approved", Required = true },
            new { Step = 4, Name = "Completed", Description = "Process completed", SectionId = "completed", Required = true }
        };
    }
}
