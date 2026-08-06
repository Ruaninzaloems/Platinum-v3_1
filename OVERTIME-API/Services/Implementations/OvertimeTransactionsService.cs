using System.Globalization;
using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;
using PlatinumOvertime_API.DTOs.Requests;
using PlatinumOvertime_API.DTOs.Responses;
using PlatinumOvertime_API.Models.Common;
using PlatinumOvertime_API.Models.Domain;
using PlatinumOvertime_API.Repositories.Interfaces;
using PlatinumOvertime_API.Services.Interfaces;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// Real implementation of the overtime transaction lifecycle:
///   - List/Get/Create/Delete
///   - Amount preview + overtime-type lookup
///   - PDF document upload/download (≤5 MB, single per transaction)
/// Workflow transitions live in WorkflowService; this service only creates
/// the transaction in Requested state and delegates the first Submit step
/// to the workflow service.
/// </summary>
public class OvertimeTransactionsService : IOvertimeTransactionsService
{
    private const long MaxDocumentBytes = 5 * 1024 * 1024;

    private static readonly HashSet<string> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "image/jpeg",
        "image/png",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",   // .xlsx
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        "application/vnd.ms-outlook",   // .msg
        "application/octet-stream",     // .msg fallback (some mail clients use this)
    };

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".jpg", ".jpeg", ".png", ".xlsx", ".docx", ".msg"
    };

    private readonly OvertimeDbContext _db;
    private readonly IPlatinumIntegrationService _platinum;
    private readonly IOvertimeAmountService _amount;
    private readonly IAssigneeResolverService _resolver;
    private readonly IOvertimeConfigRepository _config;
    private readonly ICurrentUserService _user;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<OvertimeTransactionsService> _log;

    public OvertimeTransactionsService(
        OvertimeDbContext db,
        IPlatinumIntegrationService platinum,
        IOvertimeAmountService amount,
        IAssigneeResolverService resolver,
        IOvertimeConfigRepository config,
        ICurrentUserService user,
        IWebHostEnvironment env,
        ILogger<OvertimeTransactionsService> log)
    {
        _db = db; _platinum = platinum; _amount = amount; _resolver = resolver;
        _config = config; _user = user; _env = env; _log = log;
    }

    // ---------- Listing ----------

    public async Task<ApiResponse<PaginatedResponse<OvertimeTransactionDto>>> ListCurrentForUserAsync(int page, int pageSize, CancellationToken ct = default)
    {
        // "Current" = anything still in flight assigned to me OR captured by me
        // and not yet terminal. Lets capturers see what they've submitted.
        var me = _user.Current;
        var meId = me.UserId;

        // Extend the assignee match to cover positions the current user is
        // actively deputising for via a TemporaryActingAppointment.
        var actingForUserIds = new List<string>();
        if (!string.IsNullOrWhiteSpace(me.EmployeeId))
        {
            var nowUtc = DateTime.UtcNow;
            var actingConfigs = await _db.PositionApprovalConfigs
                .Include(c => c.ActingAppointments)
                .Where(c => c.ActingAppointments.Any(a =>
                    a.ActingEmployeeId == me.EmployeeId
                    && a.StartDate <= nowUtc && a.EndDate >= nowUtc))
                .AsNoTracking()
                .ToListAsync(ct);

            actingForUserIds = actingConfigs
                .Select(cfg => _user.AllUsers.FirstOrDefault(u =>
                    string.Equals(u.PositionId, cfg.PositionId, StringComparison.OrdinalIgnoreCase))?.UserId)
                .Where(uid => !string.IsNullOrWhiteSpace(uid))
                .Select(uid => uid!)
                .ToList();
        }

        var myUserIds = new[] { meId }.Concat(actingForUserIds).ToList();

        // Determine whether the current user holds the configured override position.
        // Override users see every in-flight transaction, not just their own queue.
        var cfg = await _db.OvertimeConfig.AsNoTracking().FirstOrDefaultAsync(ct);
        var isOverrideUser = !string.IsNullOrWhiteSpace(cfg?.OverridePositionId)
            && !string.IsNullOrWhiteSpace(me.PositionId)
            && string.Equals(me.PositionId, cfg.OverridePositionId, StringComparison.OrdinalIgnoreCase);

        var rows = await _db.OvertimeTransactions
            .Include(t => t.Documents)
            .Include(t => t.WorkflowHistory)
            .AsSplitQuery()
            .Where(t => t.Status != WorkflowStatus.Processed
                        && t.Status != WorkflowStatus.Rejected
                        && (isOverrideUser
                            || myUserIds.Contains(t.CurrentAssigneeUserId)
                            || t.CapturedBy == meId))
            .OrderByDescending(t => t.UpdatedAt)
            .ToListAsync(ct);
        var actingLookup = await LoadActiveActingLookupAsync(ct);
        var dto = rows.Select(r => ToDto(r, actingLookup)).ToList();
        return ApiResponse<PaginatedResponse<OvertimeTransactionDto>>.Success(
            PaginatedResponse<OvertimeTransactionDto>.Create(dto, page, pageSize));
    }

    public async Task<ApiResponse<PaginatedResponse<OvertimeTransactionDto>>> ListProcessedAsync(int page, int pageSize, CancellationToken ct = default)
    {
        // "Processed" = terminal state, visible to everyone (audit view).
        var rows = await _db.OvertimeTransactions
            .Include(t => t.Documents)
            .Include(t => t.WorkflowHistory)
            .AsSplitQuery()
            .Where(t => t.Status == WorkflowStatus.Processed
                        || t.Status == WorkflowStatus.Rejected)
            .OrderByDescending(t => t.UpdatedAt)
            .ToListAsync(ct);
        var actingLookup = await LoadActiveActingLookupAsync(ct);
        var dto = rows.Select(r => ToDto(r, actingLookup)).ToList();
        return ApiResponse<PaginatedResponse<OvertimeTransactionDto>>.Success(
            PaginatedResponse<OvertimeTransactionDto>.Create(dto, page, pageSize));
    }

    public async Task<ApiResponse<PaginatedResponse<OvertimeTransactionDto>>> ListEnquiryAsync(
        int? status, string? departmentId, string? employeeSearch, string? salaryHeadName,
        DateTime? fromDate, DateTime? toDate,
        int page, int pageSize, CancellationToken ct = default)
    {
        var q = _db.OvertimeTransactions
            .AsNoTracking()
            .Include(t => t.Documents)
            .Include(t => t.WorkflowHistory)
            .AsSplitQuery()
            .AsQueryable();

        if (status.HasValue)
            q = q.Where(t => (int)t.Status == status.Value);
        if (!string.IsNullOrWhiteSpace(departmentId))
            q = q.Where(t => t.DepartmentId == departmentId);
        if (!string.IsNullOrWhiteSpace(employeeSearch))
        {
            var s = employeeSearch.Trim().ToLower();
            q = q.Where(t => t.EmployeeId.ToLower().Contains(s)
                           || t.EmployeeName.ToLower().Contains(s));
        }
        if (!string.IsNullOrWhiteSpace(salaryHeadName))
            q = q.Where(t => t.SalaryHeadName == salaryHeadName);
        if (fromDate.HasValue)
            q = q.Where(t => t.OvertimeDate >= fromDate.Value.Date);
        if (toDate.HasValue)
            q = q.Where(t => t.OvertimeDate <= toDate.Value.Date);

        var ordered = q.OrderByDescending(t => t.UpdatedAt);
        var total   = await ordered.CountAsync(ct);
        var rows    = await ordered
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);
        var actingLookup = await LoadActiveActingLookupAsync(ct);
        var dto = rows.Select(r => ToDto(r, actingLookup)).ToList();
        return ApiResponse<PaginatedResponse<OvertimeTransactionDto>>.Success(
            new PaginatedResponse<OvertimeTransactionDto>
            {
                Items    = dto,
                Total    = total,
                Page     = page,
                PageSize = pageSize
            });
    }

    public async Task<ApiResponse<List<OvertimeTransactionDto>>> ListForEmployeeAsync(string employeeId, CancellationToken ct = default)
    {
        var rows = await _db.OvertimeTransactions
            .Include(t => t.Documents)
            .Include(t => t.WorkflowHistory)
            .AsSplitQuery()
            .Where(t => t.EmployeeId == employeeId)
            .OrderByDescending(t => t.OvertimeDate)
            .ToListAsync(ct);
        var actingLookup = await LoadActiveActingLookupAsync(ct);
        return ApiResponse<List<OvertimeTransactionDto>>.Success(rows.Select(r => ToDto(r, actingLookup)).ToList());
    }

    public async Task<ApiResponse<OvertimeTransactionDto>> GetAsync(Guid id, CancellationToken ct = default)
    {
        var row = await LoadAsync(id, ct);
        if (row is null) return ApiResponse<OvertimeTransactionDto>.Failure("Overtime transaction not found.");
        var actingLookup = await LoadActiveActingLookupAsync(ct);
        return ApiResponse<OvertimeTransactionDto>.Success(ToDto(row, actingLookup));
    }

    // ---------- Create ----------

    public async Task<ApiResponse<OvertimeTransactionDto>> CreateAsync(CreateOvertimeTransactionRequest request, CancellationToken ct = default)
    {
        // Validate inputs.
        if (string.IsNullOrWhiteSpace(request.EmployeeId))
            return ApiResponse<OvertimeTransactionDto>.Failure("EmployeeId is required.");
        if (request.SalaryHeadId <= 0)
            return ApiResponse<OvertimeTransactionDto>.Failure("SalaryHeadId is required.");
        if (request.Hours <= 0)
            return ApiResponse<OvertimeTransactionDto>.Failure("Hours must be greater than zero.");

        // Resolve employee snapshot via integration boundary so the same code
        // path works in both mock and real-Platinum environments.
        var emp = (await _platinum.GetEmployeesAsync(ct: ct))
            .FirstOrDefault(e => string.Equals(e.Id, request.EmployeeId, StringComparison.OrdinalIgnoreCase));
        if (emp is null)
            return ApiResponse<OvertimeTransactionDto>.Failure($"Employee {request.EmployeeId} not found.");

        if (!emp.AllowOverTime)
            return ApiResponse<OvertimeTransactionDto>.Failure(
                $"{emp.FullName} is not authorised to claim overtime (AllowOverTime = false).");

        if (!int.TryParse(request.EmployeeId, NumberStyles.Integer, CultureInfo.InvariantCulture, out var empNum))
            return ApiResponse<OvertimeTransactionDto>.Failure("EmployeeId is not numeric.");

        // Duplicate guard: warn (not hard-block) when a non-rejected transaction
        // already exists for the same employee + salary head + date.
        var requestedDate = DateTime.SpecifyKind(request.OvertimeDate.Date, DateTimeKind.Utc);

        // Hard-block: overlapping (or identical) time range on the same date.
        // Not bypassable by SkipDuplicateDateCheck.
        var reqStart = ParseTime(request.StartTime);
        var reqEnd   = ParseTime(request.EndTime);
        if (reqStart.HasValue && reqEnd.HasValue)
        {
            var candidates = await _db.OvertimeTransactions
                .Where(t => t.EmployeeId == request.EmployeeId
                         && t.SalaryHeadId == request.SalaryHeadId
                         && t.OvertimeDate == requestedDate
                         && t.Status != WorkflowStatus.Rejected)
                .Select(t => new { t.StartTime, t.EndTime })
                .ToListAsync(ct);

            bool overlaps = candidates.Any(c =>
                c.StartTime.HasValue && c.EndTime.HasValue &&
                reqStart.Value < c.EndTime.Value &&
                reqEnd.Value   > c.StartTime.Value);

            if (overlaps)
                return ApiResponse<OvertimeTransactionDto>.Failure(
                    "DUPLICATE_DATETIME_ERROR: An overtime claim for this employee and type " +
                    "already exists on this date with an overlapping time range. " +
                    "Overlapping claims cannot be submitted.");
        }

        if (!request.SkipDuplicateDateCheck)
        {
            var duplicate = await _db.OvertimeTransactions
                .AnyAsync(t => t.EmployeeId == request.EmployeeId
                               && t.SalaryHeadId == request.SalaryHeadId
                               && t.OvertimeDate == requestedDate
                               && t.Status != WorkflowStatus.Rejected, ct);
            if (duplicate)
                return ApiResponse<OvertimeTransactionDto>.Failure(
                    "DUPLICATE_DATE_WARNING: A claim for this employee, overtime type, and date already exists. " +
                    "Are you sure you want to submit another claim for the same date?");
        }

        // Calculate amount (snapshot formula + amount onto the row).
        OvertimeAmountResult calc;
        try { calc = await _amount.CalculateAsync(empNum, request.SalaryHeadId, request.Hours, ct); }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "Failed to calculate overtime amount for emp={Emp} head={Head}.", empNum, request.SalaryHeadId);
            return ApiResponse<OvertimeTransactionDto>.Failure(ex.Message);
        }

        // Determine excess by counting hours captured for the same employee
        // in the active counting window from OvertimeConfig.
        var cfg = await _config.GetAsync(ct);

        // Oldest-date guard: reject captures older than 2 months before the current period open.
        var cutoff = ComputeOldestAllowedDate(cfg, DateTime.UtcNow.Date);
        if (requestedDate < cutoff)
            return ApiResponse<OvertimeTransactionDto>.Failure(
                $"Overtime date {requestedDate:dd/MM/yyyy} is too old to capture. " +
                $"The earliest allowed date is {cutoff:dd/MM/yyyy} " +
                $"(2 months before the current period opening).");

        var (windowStart, windowEnd) = ComputeCountingWindow(cfg, request.OvertimeDate.Date);
        var hoursAlready = await _db.OvertimeTransactions
            .Where(t => t.EmployeeId == request.EmployeeId
                        && t.Status != WorkflowStatus.Rejected
                        && t.OvertimeDate >= windowStart && t.OvertimeDate <= windowEnd)
            .SumAsync(t => (decimal?)t.Hours, ct) ?? 0m;
        var monthlyMax = cfg?.MaximumMonthlyOvertimeHours ?? 40m;
        var isExcess = (hoursAlready + request.Hours) > monthlyMax;

        // Hard-reject if adding these hours would push the employee's monthly
        // total beyond the exceptional maximum ceiling.
        var exceptionalMax = cfg?.ExceptionalMaximumOvertimeHours ?? 60m;
        _log.LogInformation(
            "ExceptionalMax check: emp={Emp} date={Date} window=[{Start},{End}] hoursAlready={Already} requested={Req} max={Max} total={Total}",
            request.EmployeeId, request.OvertimeDate.Date.ToString("yyyy-MM-dd"),
            windowStart.ToString("yyyy-MM-dd"), windowEnd.ToString("yyyy-MM-dd HH:mm:ss"),
            hoursAlready, request.Hours, exceptionalMax, hoursAlready + request.Hours);
        if ((hoursAlready + request.Hours) > exceptionalMax)
            return ApiResponse<OvertimeTransactionDto>.Failure(
                $"{emp.FullName} already has {hoursAlready:0.##} hour{(hoursAlready == 1m ? "" : "s")} captured this month. " +
                $"Adding {request.Hours:0.##} hour{(request.Hours == 1m ? "" : "s")} would exceed the maximum allowed of {exceptionalMax:0.##} hours.");

        // Resolve the workflow chain for snapshotting.
        // Reject immediately when the chain is incomplete — no transaction should be
        // created with a missing recommender or approver.
        var bundle = await _resolver.ResolveAsync(emp.PositionId,
            asOf: DateTime.SpecifyKind(request.OvertimeDate.Date, DateTimeKind.Utc), ct);
        if (bundle.ChainError is not null)
            return ApiResponse<OvertimeTransactionDto>.Failure(bundle.ChainError);

        // Resolve the optional payroll classification dropdowns. Bad IDs are
        // rejected up-front so a bogus client payload doesn't get persisted
        // alongside otherwise-valid data.
        var classification = await ResolveClassificationAsync(
            request.LegacyDepartmentId, request.LegacyDivisionId, ct);
        if (!classification.IsSuccess)
            return ApiResponse<OvertimeTransactionDto>.Failure(classification.Message ?? "Invalid payroll classification.");

        var tx = new OvertimeTransaction
        {
            EmployeeId = emp.Id,
            EmployeeName = emp.FullName,
            DepartmentId = emp.DepartmentId,
            DepartmentName = emp.DepartmentName,
            DivisionName = int.TryParse(emp.PositionId, out var _empPosId)
                ? await (from pos in _db.PayrollPositions
                         join div in _db.ConstDivisions on pos.DivisionId equals div.DivisionId
                         where pos.PositionId == _empPosId
                         select div.DivisionDesc).FirstOrDefaultAsync(ct)
                : null,
            PositionId = emp.PositionId,
            OvertimeDate = DateTime.SpecifyKind(request.OvertimeDate.Date, DateTimeKind.Utc),
            StartTime = ParseTime(request.StartTime),
            EndTime = ParseTime(request.EndTime),
            Hours = request.Hours,
            Reason = request.Reason,
            SalaryHeadId = request.SalaryHeadId,
            SalaryHeadName = calc.SalaryHeadName,
            FormulaSnapshot = calc.Formula,
            FormulaWithValuesSnapshot = BuildFormulaWithValues(calc.Formula, calc.Inputs),
            Amount = calc.Amount,
            HoursAlreadyCapturedThisMonth = hoursAlready,
            IsExcess = isExcess,
            Status = WorkflowStatus.Requested,
            RecommenderEmployeeId        = bundle.Recommender?.EmployeeId,
            RecommenderEmployeeName      = bundle.Recommender?.EmployeeName,
            RecommenderChainPositionId   = bundle.RecommenderPositionId,
            RecommenderChainPositionName = bundle.RecommenderPositionDescription,
            ApproverEmployeeId           = bundle.Approver?.EmployeeId,
            ApproverEmployeeName         = bundle.Approver?.EmployeeName,
            ApproverChainPositionId      = bundle.ApproverPositionId,
            ApproverChainPositionName    = bundle.ApproverPositionDescription,
            ExcessApproverEmployeeId = isExcess ? bundle.ExcessApprover?.EmployeeId : null,
            ExcessApproverEmployeeName = isExcess ? bundle.ExcessApprover?.EmployeeName : null,
            PayrollCapturerEmployeeId = bundle.PayrollCapturer?.EmployeeId,
            PayrollCapturerEmployeeName = bundle.PayrollCapturer?.EmployeeName,
            PayrollApproverEmployeeId = bundle.PayrollApprover?.EmployeeId,
            PayrollApproverEmployeeName = bundle.PayrollApprover?.EmployeeName,
            CurrentAssigneeUserId = bundle.Recommender?.UserId,
            LegacyDepartmentId = classification.Data!.LegacyDepartmentId,
            LegacyDepartmentName = classification.Data!.LegacyDepartmentName,
            LegacyDivisionId = classification.Data!.LegacyDivisionId,
            LegacyDivisionName = classification.Data!.LegacyDivisionName,
            CapturedBy = _user.Current.UserId,
            CapturedByName = _user.Current.DisplayName,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _db.OvertimeTransactions.Add(tx);
        _db.OvertimeAuditTrails.Add(new OvertimeAuditTrail
        {
            EntityName = nameof(OvertimeTransaction),
            EntityId = tx.Id.ToString(),
            Action = "Create",
            PerformedBy = _user.Current.UserId,
            Details = $"Hours={tx.Hours}; Amount={tx.Amount}; Excess={tx.IsExcess}"
        });
        await _db.SaveChangesAsync(ct);

        var loaded = await LoadAsync(tx.Id, ct);
        var actingLookup = await LoadActiveActingLookupAsync(ct);
        return ApiResponse<OvertimeTransactionDto>.Success(ToDto(loaded!, actingLookup));
    }

    // ---------- Update ----------

    public async Task<ApiResponse<OvertimeTransactionDto>> UpdateAsync(
        Guid id, UpdateOvertimeTransactionRequest request, CancellationToken ct = default)
    {
        if (request.SalaryHeadId <= 0)
            return ApiResponse<OvertimeTransactionDto>.Failure("SalaryHeadId is required.");
        if (request.Hours <= 0)
            return ApiResponse<OvertimeTransactionDto>.Failure("Hours must be greater than zero.");

        var tx = await _db.OvertimeTransactions
            .Include(t => t.Documents)
            .Include(t => t.WorkflowHistory)
            .AsSplitQuery()
            .FirstOrDefaultAsync(t => t.Id == id, ct);
        if (tx is null)
            return ApiResponse<OvertimeTransactionDto>.Failure("Overtime transaction not found.");

        // Only editable by the original capturer while the transaction has not
        // yet been acted upon by anyone else:
        //   Requested  — draft, not yet submitted
        //   Returned   — kicked back for corrections
        //   Recommended — submitted but awaiting recommender action (capturer
        //                 may recall it; saving resets status to Requested so
        //                 the recommender must re-approve)
        var me = _user.Current.UserId;
        var isCapturer = !string.IsNullOrEmpty(tx.CapturedBy) && tx.CapturedBy == me;

        if (tx.Status != WorkflowStatus.Requested
            && tx.Status != WorkflowStatus.Returned
            && !(tx.Status == WorkflowStatus.Recommended && isCapturer))
        {
            return ApiResponse<OvertimeTransactionDto>.Failure(
                "Only Requested, Returned, or Recommended (own) transactions can be edited.");
        }

        // Authorisation: only the original capturer may edit. Prevents IDOR
        // where any authenticated user with a known GUID could overwrite
        // someone else's draft. Matches the visibility rule in
        // ListCurrentForUserAsync.
        if (!string.IsNullOrEmpty(tx.CapturedBy) && !isCapturer)
            return ApiResponse<OvertimeTransactionDto>.Failure(
                "You are not allowed to edit this overtime transaction.");

        if (!int.TryParse(tx.EmployeeId, NumberStyles.Integer, CultureInfo.InvariantCulture, out var empNum))
            return ApiResponse<OvertimeTransactionDto>.Failure("EmployeeId on the transaction is not numeric.");

        // Duplicate guard: warn (not hard-block) when the new date/head combination
        // is already occupied by another non-rejected transaction.
        var newDate = DateTime.SpecifyKind(request.OvertimeDate.Date, DateTimeKind.Utc);
        var newHead = request.SalaryHeadId;

        // Hard-block: overlapping (or identical) time range on the same date.
        // Not bypassable by SkipDuplicateDateCheck.
        var updReqStart = ParseTime(request.StartTime);
        var updReqEnd   = ParseTime(request.EndTime);
        if (updReqStart.HasValue && updReqEnd.HasValue)
        {
            var candidates = await _db.OvertimeTransactions
                .Where(t => t.Id != id
                         && t.EmployeeId == tx.EmployeeId
                         && t.SalaryHeadId == newHead
                         && t.OvertimeDate == newDate
                         && t.Status != WorkflowStatus.Rejected)
                .Select(t => new { t.StartTime, t.EndTime })
                .ToListAsync(ct);

            bool overlaps = candidates.Any(c =>
                c.StartTime.HasValue && c.EndTime.HasValue &&
                updReqStart.Value < c.EndTime.Value &&
                updReqEnd.Value   > c.StartTime.Value);

            if (overlaps)
                return ApiResponse<OvertimeTransactionDto>.Failure(
                    "DUPLICATE_DATETIME_ERROR: An overtime claim for this employee and type " +
                    "already exists on this date with an overlapping time range. " +
                    "Overlapping claims cannot be submitted.");
        }

        if (!request.SkipDuplicateDateCheck && (newDate != tx.OvertimeDate.Date || newHead != tx.SalaryHeadId))
        {
            var duplicate = await _db.OvertimeTransactions
                .AnyAsync(t => t.Id != id
                               && t.EmployeeId == tx.EmployeeId
                               && t.SalaryHeadId == newHead
                               && t.OvertimeDate == newDate
                               && t.Status != WorkflowStatus.Rejected, ct);
            if (duplicate)
                return ApiResponse<OvertimeTransactionDto>.Failure(
                    "DUPLICATE_DATE_WARNING: A claim for this employee, overtime type, and date already exists. " +
                    "Are you sure you want to submit another claim for the same date?");
        }

        // Oldest-date guard: always reject when the effective overtime date is
        // older than the cutoff, regardless of which fields changed.
        var updCfg    = await _config.GetAsync(ct);
        var updCutoff = ComputeOldestAllowedDate(updCfg, DateTime.UtcNow.Date);
        if (newDate < updCutoff)
            return ApiResponse<OvertimeTransactionDto>.Failure(
                $"Overtime date {newDate:dd/MM/yyyy} is too old to capture. " +
                $"The earliest allowed date is {updCutoff:dd/MM/yyyy} " +
                $"(2 months before the current period opening).");

        // Recalculate amount + isExcess only if the inputs changed (cheap to
        // recalc unconditionally, but skipping a roundtrip when nothing
        // changed keeps audit trails quieter).
        var dateChanged   = tx.OvertimeDate.Date != request.OvertimeDate.Date;
        var hoursChanged  = tx.Hours          != request.Hours;
        var headChanged   = tx.SalaryHeadId   != request.SalaryHeadId;
        var anyCalcInput  = dateChanged || hoursChanged || headChanged;
        var wasExcess     = tx.IsExcess;

        if (anyCalcInput)
        {
            OvertimeAmountResult calc;
            try { calc = await _amount.CalculateAsync(empNum, request.SalaryHeadId, request.Hours, ct); }
            catch (Exception ex)
            {
                _log.LogWarning(ex, "Failed to recalc overtime amount on update for tx={Id}.", id);
                return ApiResponse<OvertimeTransactionDto>.Failure(ex.Message);
            }

            var cfg = updCfg;
            var (windowStart, windowEnd) = ComputeCountingWindow(cfg, request.OvertimeDate.Date);
            var hoursAlready = await _db.OvertimeTransactions
                .Where(t => t.EmployeeId == tx.EmployeeId
                            && t.Id != tx.Id
                            && t.Status != WorkflowStatus.Rejected
                            && t.OvertimeDate >= windowStart && t.OvertimeDate <= windowEnd)
                .SumAsync(t => (decimal?)t.Hours, ct) ?? 0m;
            var monthlyMax = cfg?.MaximumMonthlyOvertimeHours ?? 40m;

            // Hard-reject on update only when hours are increasing beyond the
            // exceptional maximum. Reducing hours is always allowed.
            if (request.Hours > tx.Hours)
            {
                var exceptionalMax = cfg?.ExceptionalMaximumOvertimeHours ?? 60m;
                if ((hoursAlready + request.Hours) > exceptionalMax)
                    return ApiResponse<OvertimeTransactionDto>.Failure(
                        $"{tx.EmployeeName} already has {hoursAlready:0.##} hour{(hoursAlready == 1m ? "" : "s")} captured this month. " +
                        $"Adding {request.Hours:0.##} hour{(request.Hours == 1m ? "" : "s")} would exceed the maximum allowed of {exceptionalMax:0.##} hours.");
            }

            tx.SalaryHeadId   = request.SalaryHeadId;
            tx.SalaryHeadName = calc.SalaryHeadName;
            tx.FormulaSnapshot = calc.Formula;
            tx.FormulaWithValuesSnapshot = BuildFormulaWithValues(calc.Formula, calc.Inputs);
            tx.Amount         = calc.Amount;
            tx.HoursAlreadyCapturedThisMonth = hoursAlready;
            tx.IsExcess       = (hoursAlready + request.Hours) > monthlyMax;

            // If excess flag flipped, refresh the excess-approver snapshot so
            // downstream workflow routing stays consistent. Cheap: same
            // resolver call used at create-time.
            if (tx.IsExcess != wasExcess)
            {
                var bundle = await _resolver.ResolveAsync(tx.PositionId,
                    asOf: DateTime.SpecifyKind(request.OvertimeDate.Date, DateTimeKind.Utc), ct);
                tx.ExcessApproverEmployeeId   = tx.IsExcess ? bundle.ExcessApprover?.EmployeeId   : null;
                tx.ExcessApproverEmployeeName = tx.IsExcess ? bundle.ExcessApprover?.EmployeeName : null;
            }
        }

        // Re-resolve the primary approval chain using the (potentially updated) overtime
        // date so any reporting-config changes backdated to before the claim date are
        // picked up on Save Changes without requiring a full reject-and-recapture cycle.
        // When the newly resolved chain is incomplete (ChainError set) we intentionally
        // skip the update — preserving existing assignees is safer than writing nulls.
        // The submit guard in WorkflowService will still block submission if the
        // snapshotted recommender/approver is absent when the user tries to submit.
        {
            var chainAsOf  = DateTime.SpecifyKind(request.OvertimeDate.Date, DateTimeKind.Utc);
            var chainBundle = await _resolver.ResolveAsync(tx.PositionId, chainAsOf, ct);
            var chainChanged = chainBundle.ChainError is null && (
                tx.RecommenderEmployeeId      != chainBundle.Recommender?.EmployeeId      ||
                tx.RecommenderChainPositionId != chainBundle.RecommenderPositionId        ||
                tx.ApproverEmployeeId         != chainBundle.Approver?.EmployeeId         ||
                tx.ApproverChainPositionId    != chainBundle.ApproverPositionId);

            if (chainChanged)
            {
                tx.RecommenderEmployeeId        = chainBundle.Recommender?.EmployeeId;
                tx.RecommenderEmployeeName      = chainBundle.Recommender?.EmployeeName;
                tx.RecommenderChainPositionId   = chainBundle.RecommenderPositionId;
                tx.RecommenderChainPositionName = chainBundle.RecommenderPositionDescription;
                tx.ApproverEmployeeId           = chainBundle.Approver?.EmployeeId;
                tx.ApproverEmployeeName         = chainBundle.Approver?.EmployeeName;
                tx.ApproverChainPositionId      = chainBundle.ApproverPositionId;
                tx.ApproverChainPositionName    = chainBundle.ApproverPositionDescription;

                // Always re-point the current assignee to the newly-resolved recommender.
                // For Recommended transactions the recall block below will set Status→Requested,
                // so the effective outcome is always: Status=Requested, Assignee=newRecommender.
                tx.CurrentAssigneeUserId = chainBundle.Recommender?.UserId;

                var chainEntry = new OvertimeWorkflowState
                {
                    OvertimeTransactionId = tx.Id,
                    FromStatus  = tx.Status,
                    ToStatus    = tx.Status,
                    ActionedBy  = me,
                    Comments    = "Approval chain updated due to reporting configuration change.",
                    ActionedAt  = DateTime.UtcNow
                };
                _db.OvertimeWorkflowStates.Add(chainEntry);
                tx.WorkflowHistory.Add(chainEntry);
            }
        }

        // Resolve any payroll classification updates before persisting so a
        // bad ID doesn't half-mutate the row.
        var classification = await ResolveClassificationAsync(
            request.LegacyDepartmentId, request.LegacyDivisionId, ct);
        if (!classification.IsSuccess)
            return ApiResponse<OvertimeTransactionDto>.Failure(classification.Message ?? "Invalid payroll classification.");

        tx.OvertimeDate = DateTime.SpecifyKind(request.OvertimeDate.Date, DateTimeKind.Utc);
        tx.StartTime    = ParseTime(request.StartTime);
        tx.EndTime      = ParseTime(request.EndTime);
        tx.Hours        = request.Hours;
        tx.Reason       = request.Reason;
        tx.LegacyDepartmentId   = classification.Data!.LegacyDepartmentId;
        tx.LegacyDepartmentName = classification.Data!.LegacyDepartmentName;
        tx.LegacyDivisionId     = classification.Data!.LegacyDivisionId;
        tx.LegacyDivisionName   = classification.Data!.LegacyDivisionName;
        tx.UpdatedAt    = DateTime.UtcNow;

        // If the capturer is recalling a Recommended transaction, reset it
        // to Requested so the recommender must re-approve.
        // NOTE: add via DbSet first so EF marks the row as Added, not
        // Modified (same pattern as WorkflowService.RecordTransition).
        if (tx.Status == WorkflowStatus.Recommended)
        {
            var recallEntry = new OvertimeWorkflowState
            {
                OvertimeTransactionId = tx.Id,
                FromStatus  = WorkflowStatus.Recommended,
                ToStatus    = WorkflowStatus.Requested,
                ActionedBy  = me,
                Comments    = "Recalled by capturer for editing.",
                ActionedAt  = DateTime.UtcNow
            };
            _db.OvertimeWorkflowStates.Add(recallEntry);
            tx.WorkflowHistory.Add(recallEntry);
            tx.Status = WorkflowStatus.Requested;
        }

        _db.OvertimeAuditTrails.Add(new OvertimeAuditTrail
        {
            EntityName = nameof(OvertimeTransaction),
            EntityId = tx.Id.ToString(),
            Action = "Update",
            PerformedBy = _user.Current.UserId,
            Details = $"Hours={tx.Hours}; Amount={tx.Amount}; Excess={tx.IsExcess}"
        });
        await _db.SaveChangesAsync(ct);

        var loaded = await LoadAsync(tx.Id, ct);
        var actingLookup = await LoadActiveActingLookupAsync(ct);
        return ApiResponse<OvertimeTransactionDto>.Success(ToDto(loaded!, actingLookup));
    }

    public async Task<ApiResponse<bool>> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var row = await _db.OvertimeTransactions
            .Include(t => t.Documents)
            .FirstOrDefaultAsync(t => t.Id == id, ct);
        if (row is null) return ApiResponse<bool>.Failure("Overtime transaction not found.");
        if (row.Status != WorkflowStatus.Requested && row.Status != WorkflowStatus.Returned)
            return ApiResponse<bool>.Failure("Only Requested or Returned transactions can be deleted.");

        // Best-effort cleanup of any uploaded files; the row cascade-deletes
        // the document records via the FK.
        var folder = Path.Combine(_env.ContentRootPath, "App_Data", "overtime", id.ToString());
        if (Directory.Exists(folder))
        {
            try { Directory.Delete(folder, recursive: true); }
            catch (Exception ex) { _log.LogWarning(ex, "Failed to clean up document folder {Folder}.", folder); }
        }

        _db.OvertimeTransactions.Remove(row);
        _db.OvertimeAuditTrails.Add(new OvertimeAuditTrail
        {
            EntityName = nameof(OvertimeTransaction), EntityId = id.ToString(),
            Action = "Delete", PerformedBy = _user.Current.UserId
        });
        await _db.SaveChangesAsync(ct);
        return ApiResponse<bool>.Success(true);
    }

    // ---------- Lookups ----------

    public async Task<ApiResponse<AmountPreviewDto>> PreviewAmountAsync(AmountPreviewRequest request, CancellationToken ct = default)
    {
        if (!int.TryParse(request.EmployeeId, NumberStyles.Integer, CultureInfo.InvariantCulture, out var empNum))
            return ApiResponse<AmountPreviewDto>.Failure("EmployeeId is not numeric.");
        if (request.SalaryHeadId <= 0)
            return ApiResponse<AmountPreviewDto>.Failure("SalaryHeadId is required.");
        if (request.Hours <= 0)
            return ApiResponse<AmountPreviewDto>.Failure("Hours must be greater than zero.");
        try
        {
            var calc = await _amount.CalculateAsync(empNum, request.SalaryHeadId, request.Hours, ct);

            // Strip all salary-derived data for capture-only users.
            // Recommenders and any approver/payroll role retain the full response.
            // Both Amount and Inputs are zeroed/nulled: the UI gates display on the
            // same flags, but zeroing here ensures no salary data leaks via the wire.
            var u = _user.Current;
            // Gate on position-level approval flags only — same rule as ToDto.
            var canSeeFinancials = u.IsApprover || u.IsExcessApprover;

            return ApiResponse<AmountPreviewDto>.Success(new AmountPreviewDto
            {
                Amount = canSeeFinancials ? calc.Amount : 0m,
                Formula = calc.Formula,
                SalaryHeadName = calc.SalaryHeadName,
                Inputs = canSeeFinancials ? calc.Inputs : null
            });
        }
        catch (Exception ex)
        {
            return ApiResponse<AmountPreviewDto>.Failure(ex.Message);
        }
    }

    public async Task<ApiResponse<List<OvertimeTypeOption>>> GetOvertimeTypesForEmployeeAsync(string employeeId, CancellationToken ct = default)
    {
        if (!int.TryParse(employeeId, NumberStyles.Integer, CultureInfo.InvariantCulture, out var empNum))
            return ApiResponse<List<OvertimeTypeOption>>.Failure("EmployeeId is not numeric.");
        var list = await _amount.GetOvertimeTypesForEmployeeAsync(empNum, ct);
        return ApiResponse<List<OvertimeTypeOption>>.Success(list);
    }

    // ---------- Documents ----------

    public async Task<ApiResponse<OvertimeDocumentDto>> UploadDocumentAsync(Guid transactionId, IFormFile file, CancellationToken ct = default)
    {
        if (file is null || file.Length == 0)
            return ApiResponse<OvertimeDocumentDto>.Failure("No file uploaded.");
        if (file.Length > MaxDocumentBytes)
            return ApiResponse<OvertimeDocumentDto>.Failure("Document must be 5 MB or smaller.");
        var ext = Path.GetExtension(file.FileName);
        if (!AllowedMimeTypes.Contains(file.ContentType) && !AllowedExtensions.Contains(ext))
            return ApiResponse<OvertimeDocumentDto>.Failure(
                "Only PDF, JPG, PNG, XLSX, DOCX and MSG files are supported.");

        var tx = await _db.OvertimeTransactions
            .Include(t => t.Documents)
            .FirstOrDefaultAsync(t => t.Id == transactionId, ct);
        if (tx is null) return ApiResponse<OvertimeDocumentDto>.Failure("Overtime transaction not found.");

        // Spec: single supporting document per transaction. Reject overwrite
        // explicitly so the UI gets a clear error rather than silent drop.
        if (tx.Documents.Any())
            return ApiResponse<OvertimeDocumentDto>.Failure("This transaction already has a supporting document; remove it first.");

        var folder = Path.Combine(_env.ContentRootPath, "App_Data", "overtime", transactionId.ToString());
        Directory.CreateDirectory(folder);
        var safeName = Path.GetFileName(file.FileName);
        var path = Path.Combine(folder, safeName);
        await using (var fs = File.Create(path))
            await file.CopyToAsync(fs, ct);

        var doc = new OvertimeTransactionDocument
        {
            OvertimeTransactionId = transactionId,
            FileName = safeName,
            ContentType = file.ContentType,
            SizeBytes = file.Length,
            StoragePath = path,
            UploadedBy = _user.Current.UserId,
            UploadedAt = DateTime.UtcNow,
        };
        _db.OvertimeTransactionDocuments.Add(doc);
        await _db.SaveChangesAsync(ct);

        return ApiResponse<OvertimeDocumentDto>.Success(new OvertimeDocumentDto
        {
            Id = doc.Id,
            FileName = doc.FileName,
            ContentType = doc.ContentType,
            SizeBytes = doc.SizeBytes,
            UploadedBy = doc.UploadedBy,
            UploadedAt = doc.UploadedAt,
        });
    }

    public async Task<(byte[] Bytes, string ContentType, string FileName)?> DownloadDocumentAsync(Guid transactionId, Guid documentId, CancellationToken ct = default)
    {
        var doc = await _db.OvertimeTransactionDocuments
            .FirstOrDefaultAsync(d => d.Id == documentId && d.OvertimeTransactionId == transactionId, ct);
        if (doc is null || !File.Exists(doc.StoragePath)) return null;
        var bytes = await File.ReadAllBytesAsync(doc.StoragePath, ct);
        return (bytes, doc.ContentType, doc.FileName);
    }

    public async Task<ApiResponse<bool>> DeleteDocumentAsync(Guid transactionId, Guid documentId, CancellationToken ct = default)
    {
        var doc = await _db.OvertimeTransactionDocuments
            .FirstOrDefaultAsync(d => d.Id == documentId && d.OvertimeTransactionId == transactionId, ct);
        if (doc is null)
            return ApiResponse<bool>.Failure("Document not found.");

        _db.OvertimeTransactionDocuments.Remove(doc);
        await _db.SaveChangesAsync(ct);

        // Best-effort file cleanup — don't fail the request if the file is already gone.
        try { if (File.Exists(doc.StoragePath)) File.Delete(doc.StoragePath); }
        catch (Exception ex) { _log.LogWarning(ex, "Could not delete document file {Path}.", doc.StoragePath); }

        return ApiResponse<bool>.Success(true);
    }

    // ---------- Helpers ----------

    /// <summary>
    /// Snapshot of the payroll-classification IDs the capture form may supply,
    /// plus the human-readable names resolved from the Const_*/Payroll_* lookup
    /// tables. Cycle and Period are intentionally excluded — they are resolved
    /// from the employee master and must not be stored on the transaction.
    /// </summary>
    private sealed record PayrollClassificationSnapshot(
        int? LegacyDepartmentId, string? LegacyDepartmentName,
        int? LegacyDivisionId, string? LegacyDivisionName)
    {
        public static PayrollClassificationSnapshot Empty { get; } =
            new(null, null, null, null);
    }

    /// <summary>
    /// Validate the optional classification IDs sent from the capture form
    /// and resolve their display names from the master tables. Names are
    /// snapshotted onto the transaction so historical reads stay stable
    /// even if the source rows are later renamed or disabled.
    /// Cycle and Period are intentionally excluded — they are resolved from
    /// the employee master and must not be written by the capture form.
    /// </summary>
    private async Task<ApiResponse<PayrollClassificationSnapshot>> ResolveClassificationAsync(
        int? legacyDepartmentId, int? legacyDivisionId, CancellationToken ct)
    {
        if (legacyDepartmentId is null && legacyDivisionId is null)
            return ApiResponse<PayrollClassificationSnapshot>.Success(PayrollClassificationSnapshot.Empty);

        string? deptName = null, divName = null;

        if (legacyDepartmentId.HasValue)
        {
            var d = await _db.ConstDepartments.AsNoTracking()
                .Where(x => x.DepartmentId == legacyDepartmentId.Value && x.Enabled == true)
                .Select(x => x.DepartmentDesc)
                .FirstOrDefaultAsync(ct);
            if (d is null)
                return ApiResponse<PayrollClassificationSnapshot>.Failure(
                    $"Department {legacyDepartmentId.Value} not found or disabled.");
            deptName = d;
        }

        if (legacyDivisionId.HasValue)
        {
            var row = await _db.ConstDivisions.AsNoTracking()
                .Where(x => x.DivisionId == legacyDivisionId.Value && x.Enabled == true)
                .Select(x => new { x.DivisionDesc, x.DepartmentId })
                .FirstOrDefaultAsync(ct);
            if (row is null)
                return ApiResponse<PayrollClassificationSnapshot>.Failure(
                    $"Division {legacyDivisionId.Value} not found or disabled.");
            // If both are picked the division must roll up to the chosen
            // department — otherwise the snapshot is internally inconsistent.
            if (legacyDepartmentId.HasValue && row.DepartmentId.HasValue
                && row.DepartmentId.Value != legacyDepartmentId.Value)
                return ApiResponse<PayrollClassificationSnapshot>.Failure(
                    "Selected division does not belong to the selected department.");
            divName = row.DivisionDesc;
        }

        return ApiResponse<PayrollClassificationSnapshot>.Success(new PayrollClassificationSnapshot(
            legacyDepartmentId, deptName,
            legacyDivisionId, divName));
    }

    /// <summary>
    /// Pre-loads all active TemporaryActingAppointments for today and returns a
    /// lookup keyed by the ActingInPositionId. When multiple appointments share
    /// a position only the first encountered is kept (edge case).
    /// The dictionary is empty — never null — when there are no active appointments.
    /// </summary>
    private async Task<Dictionary<string, (string Id, string Name)>> LoadActiveActingLookupAsync(CancellationToken ct)
    {
        var nowUtc = DateTime.UtcNow;
        var result = new Dictionary<string, (string, string)>(StringComparer.OrdinalIgnoreCase);

        var configs = await _db.PositionApprovalConfigs
            .Include(c => c.ActingAppointments)
            .Where(c => c.ActingAppointments.Any(a => a.StartDate <= nowUtc && a.EndDate >= nowUtc))
            .AsNoTracking()
            .ToListAsync(ct);

        foreach (var cfg in configs)
        {
            var appt = cfg.ActingAppointments
                .FirstOrDefault(a => a.StartDate <= nowUtc && a.EndDate >= nowUtc);
            if (appt == null) continue;

            // ActingInPositionId is the authoritative chain position being covered and is
            // stored directly on the appointment row.  Using it as the key means the lookup
            // is correct even when PositionApprovalConfigId points to the wrong config record.
            // Fall back to cfg.PositionId for older rows where ActingInPositionId may be empty.
            var primaryKey = !string.IsNullOrEmpty(appt.ActingInPositionId)
                ? appt.ActingInPositionId
                : cfg.PositionId;

            if (!result.ContainsKey(primaryKey))
                result[primaryKey] = (appt.ActingEmployeeId, appt.ActingEmployeeName);

            // Also index by cfg.PositionId so that appointments whose FK is correct
            // (primaryKey == cfg.PositionId) continue to work without a second pass,
            // and so that any direct cfg.PositionId lookups elsewhere still resolve.
            if (!string.Equals(primaryKey, cfg.PositionId, StringComparison.OrdinalIgnoreCase)
                && !result.ContainsKey(cfg.PositionId))
                result[cfg.PositionId] = (appt.ActingEmployeeId, appt.ActingEmployeeName);
        }
        return result;
    }

    private async Task<OvertimeTransaction?> LoadAsync(Guid id, CancellationToken ct) =>
        await _db.OvertimeTransactions
            .Include(t => t.Documents)
            .Include(t => t.WorkflowHistory)
            .AsSplitQuery()
            .FirstOrDefaultAsync(t => t.Id == id, ct);

    private static TimeSpan? ParseTime(string? hhmm)
        => string.IsNullOrWhiteSpace(hhmm)
            ? null
            : TimeSpan.TryParseExact(hhmm, new[] { @"h\:mm", @"hh\:mm" }, CultureInfo.InvariantCulture, out var t)
                ? t
                : TimeSpan.TryParse(hhmm, CultureInfo.InvariantCulture, out var t2) ? t2 : (TimeSpan?)null;

    /// <summary>
    /// Compute the [start,end] range (UTC, inclusive) for the counting period
    /// containing <paramref name="anchor"/> per OvertimeConfig.
    /// Defaults to a calendar month when no config exists.
    /// </summary>
    /// <summary>
    /// Returns the earliest OvertimeDate that may be captured.
    /// Cutoff = first day of the current open period minus 2 full months.
    /// Example: today = 18 Jun, startDay = 1 → period opens 1 Jun → cutoff = 1 Apr.
    /// </summary>
    private static DateTime ComputeOldestAllowedDate(
        Models.Domain.OvertimeConfig? cfg, DateTime today)
    {
        var startDay = Math.Clamp(cfg?.CountingPeriodStartDay ?? 1, 1, 28);
        var periodAnchor = today.Day >= startDay ? today : today.AddMonths(-1);
        var dim = DateTime.DaysInMonth(periodAnchor.Year, periodAnchor.Month);
        var periodOpen = new DateTime(
            periodAnchor.Year, periodAnchor.Month,
            Math.Min(startDay, dim), 0, 0, 0, DateTimeKind.Utc);
        return periodOpen.AddMonths(-2);
    }

    private static (DateTime Start, DateTime End) ComputeCountingWindow(
        Models.Domain.OvertimeConfig? cfg, DateTime anchor)
    {
        var startDay = Math.Clamp(cfg?.CountingPeriodStartDay ?? 1, 1, 28);
        var endDay = Math.Clamp(cfg?.CountingPeriodEndDay ?? 31, startDay, 31);

        var year = anchor.Year; var month = anchor.Month;
        var dim = DateTime.DaysInMonth(year, month);
        var winStart = new DateTime(year, month, Math.Min(startDay, dim), 0, 0, 0, DateTimeKind.Utc);
        var winEnd = new DateTime(year, month, Math.Min(endDay, dim), 23, 59, 59, DateTimeKind.Utc);

        // Anchor below the start day rolls back one month.
        if (anchor.Day < startDay)
        {
            var prev = anchor.AddMonths(-1);
            var pdim = DateTime.DaysInMonth(prev.Year, prev.Month);
            winStart = new DateTime(prev.Year, prev.Month, Math.Min(startDay, pdim), 0, 0, 0, DateTimeKind.Utc);
            winEnd = new DateTime(prev.Year, prev.Month, Math.Min(endDay, pdim), 23, 59, 59, DateTimeKind.Utc);
        }
        return (winStart, winEnd);
    }

    private OvertimeTransactionDto ToDto(OvertimeTransaction t,
        Dictionary<string, (string Id, string Name)>? actingByPositionId = null)
        => ToDto(t, _user, actingByPositionId);

    public static OvertimeTransactionDto ToDto(OvertimeTransaction t, ICurrentUserService? userSvc,
        Dictionary<string, (string Id, string Name)>? actingByPositionId = null)
    {
        // Financial fields (Amount, formula strings) are salary-derived and must only be
        // visible to roles that need them for approval/processing decisions.
        // Recommenders are explicitly excluded — they assess requests on hours/justification,
        // not on cost. Approvers (direct, excess, and payroll-side) retain visibility.
        // When userSvc is null (no request context) we default to hidden.
        // Only position-level approvers may see salary-derived fields.
        // IsPayrollCapturer / IsPayrollApprover gate Payroll Processing page access,
        // not financial data visibility — those users may have permission 3202 without
        // being overtime approvers, so including them here would leak salary figures.
        var canSeeFinancials = userSvc is not null
            && (userSvc.Current.IsApprover
             || userSvc.Current.IsExcessApprover);

        // For rows captured before CapturedByName was persisted, fall back to
        // the in-memory directory lookup (dev only; returns null in production).
        var capturer = string.IsNullOrWhiteSpace(t.CapturedByName)
                       && userSvc is not null
                       && !string.IsNullOrEmpty(t.CapturedBy)
            ? userSvc.FindByUserId(t.CapturedBy)
            : null;

        // Resolve current acting employees for the recommender and approver positions.
        // Two distinct scenarios are handled:
        //
        //   A) The snapshotted assignee IS an acting appointee: they were assigned
        //      because they hold an active TemporaryActingAppointment in the chain
        //      position.  Their home position differs from the chain position, so we
        //      must use the snapshotted RecommenderChainPositionName / ApproverChainPositionName
        //      for the role label and flag them as acting (RecommenderIsActing / ApproverIsActing).
        //
        //   B) The snapshotted assignee is the primary holder and someone ELSE is
        //      currently standing in for them via a TemporaryActingAppointment.  In
        //      that case we surface the covering person via RecommenderActingEmployee*.
        //
        // The actingByPositionId lookup (keyed by chain PositionId → (actingEmpId, actingEmpName))
        // covers both: if the acting employee's ID matches the snapshotted assignee this is
        // scenario A; otherwise it is scenario B.

        string? recommenderActingId = null, recommenderActingName = null;
        bool recommenderIsActing = false;
        string? recommenderPrimaryHolderName = null;

        string? approverActingId = null, approverActingName = null;
        bool approverIsActing = false;
        string? approverPrimaryHolderName = null;

        if (actingByPositionId != null)
        {
            // --- Recommender ---
            // Prefer the snapshotted chain position; fall back to the employee's home position
            // for legacy rows that pre-date the chain-position snapshot.
            var recChainPosId = t.RecommenderChainPositionId
                             ?? userSvc?.FindByUserId(t.RecommenderEmployeeId ?? string.Empty)?.PositionId;
            if (!string.IsNullOrEmpty(recChainPosId)
                && actingByPositionId.TryGetValue(recChainPosId, out var recActing))
            {
                if (string.Equals(recActing.Id, t.RecommenderEmployeeId, StringComparison.OrdinalIgnoreCase))
                {
                    // Scenario A: the snapshotted recommender IS the acting appointee.
                    recommenderIsActing = true;
                    // The primary holder is whoever normally occupies the chain position
                    // (any user whose home PositionId matches the chain position, excluding the acting person).
                    recommenderPrimaryHolderName = userSvc?.AllUsers
                        .FirstOrDefault(u => string.Equals(u.PositionId, recChainPosId, StringComparison.OrdinalIgnoreCase)
                                          && !string.Equals(u.EmployeeId, t.RecommenderEmployeeId, StringComparison.OrdinalIgnoreCase))
                        ?.EmployeeName;
                }
                else
                {
                    // Scenario B: primary holder is assigned; someone else is covering them.
                    recommenderActingId   = recActing.Id;
                    recommenderActingName = recActing.Name;
                }
            }

            // --- Approver ---
            var appChainPosId = t.ApproverChainPositionId
                             ?? userSvc?.FindByUserId(t.ApproverEmployeeId ?? string.Empty)?.PositionId;
            if (!string.IsNullOrEmpty(appChainPosId)
                && actingByPositionId.TryGetValue(appChainPosId, out var appActing))
            {
                if (string.Equals(appActing.Id, t.ApproverEmployeeId, StringComparison.OrdinalIgnoreCase))
                {
                    // Scenario A: the snapshotted approver IS the acting appointee.
                    approverIsActing = true;
                    approverPrimaryHolderName = userSvc?.AllUsers
                        .FirstOrDefault(u => string.Equals(u.PositionId, appChainPosId, StringComparison.OrdinalIgnoreCase)
                                          && !string.Equals(u.EmployeeId, t.ApproverEmployeeId, StringComparison.OrdinalIgnoreCase))
                        ?.EmployeeName;
                }
                else
                {
                    // Scenario B: primary holder is assigned; someone else is covering them.
                    approverActingId   = appActing.Id;
                    approverActingName = appActing.Name;
                }
            }
        }

        return new OvertimeTransactionDto
        {
        Id = t.Id,
        EmployeeId = t.EmployeeId,
        EmployeeName = t.EmployeeName,
        DepartmentId = t.DepartmentId,
        DepartmentName = t.DepartmentName,
        DivisionName = t.DivisionName,
        PositionId = t.PositionId,
        OvertimeDate = t.OvertimeDate,
        StartTime = t.StartTime?.ToString(@"hh\:mm"),
        EndTime = t.EndTime?.ToString(@"hh\:mm"),
        Hours = t.Hours,
        HoursAlreadyCapturedThisMonth = t.HoursAlreadyCapturedThisMonth,
        IsExcess = t.IsExcess,
        SalaryHeadId = t.SalaryHeadId,
        SalaryHeadName = t.SalaryHeadName,
        FormulaSnapshot = canSeeFinancials ? t.FormulaSnapshot : string.Empty,
        FormulaWithValuesSnapshot = canSeeFinancials ? t.FormulaWithValuesSnapshot : null,
        Amount = canSeeFinancials ? t.Amount : 0m,
        Reason = t.Reason,
        Status = t.Status,
        StatusLabel = t.Status.ToLabel(),
        RecommenderEmployeeName = t.RecommenderEmployeeName,
        // Use the snapshotted chain position name (which equals the PositionApprovalConfig
        // position, not the employee's home position).  Fall back to the employee's home
        // position description for legacy rows that pre-date the chain-position snapshot.
        RecommenderPositionDescription = !string.IsNullOrWhiteSpace(t.RecommenderChainPositionName)
            ? t.RecommenderChainPositionName
            : (string.IsNullOrWhiteSpace(t.RecommenderEmployeeId) ? null
                : userSvc?.FindByUserId(t.RecommenderEmployeeId)?.PositionDescription),
        RecommenderIsActing           = recommenderIsActing,
        RecommenderPrimaryHolderName  = recommenderPrimaryHolderName,
        RecommenderActingEmployeeId   = recommenderActingId,
        RecommenderActingEmployeeName = recommenderActingName,
        ApproverEmployeeName = t.ApproverEmployeeName,
        // Same as above for the approver.
        ApproverPositionDescription = !string.IsNullOrWhiteSpace(t.ApproverChainPositionName)
            ? t.ApproverChainPositionName
            : (string.IsNullOrWhiteSpace(t.ApproverEmployeeId) ? null
                : userSvc?.FindByUserId(t.ApproverEmployeeId)?.PositionDescription),
        ApproverIsActing           = approverIsActing,
        ApproverPrimaryHolderName  = approverPrimaryHolderName,
        ApproverActingEmployeeId   = approverActingId,
        ApproverActingEmployeeName = approverActingName,
        ExcessApproverEmployeeId = t.ExcessApproverEmployeeId,
        ExcessApproverEmployeeName = t.ExcessApproverEmployeeName,
        ExcessApproverPositionDescription = string.IsNullOrWhiteSpace(t.ExcessApproverEmployeeId) ? null
            : userSvc?.FindByUserId(t.ExcessApproverEmployeeId)?.PositionDescription,
        PayrollCapturerEmployeeName = t.PayrollCapturerEmployeeName,
        PayrollApproverEmployeeName = t.PayrollApproverEmployeeName,
        CurrentAssigneeUserId = t.CurrentAssigneeUserId,
        LegacyDepartmentId = t.LegacyDepartmentId,
        LegacyDepartmentName = t.LegacyDepartmentName,
        LegacyDivisionId = t.LegacyDivisionId,
        LegacyDivisionName = t.LegacyDivisionName,
        CapturedBy = t.CapturedBy,
        CapturedByName = !string.IsNullOrWhiteSpace(t.CapturedByName) ? t.CapturedByName : capturer?.DisplayName,
        CapturedByEmployeeName = capturer?.EmployeeName,
        CapturedByEmployeeId = capturer?.EmployeeId,
        CreatedAt = t.CreatedAt,
        UpdatedAt = t.UpdatedAt,
        Documents = t.Documents.Select(d => new OvertimeDocumentDto
        {
            Id = d.Id, FileName = d.FileName, ContentType = d.ContentType,
            SizeBytes = d.SizeBytes, UploadedBy = d.UploadedBy, UploadedAt = d.UploadedAt
        }).ToList(),
        WorkflowHistory = t.WorkflowHistory
            .OrderBy(w => w.ActionedAt)
            .Select(w => new WorkflowEventDto
            {
                Id = w.Id, FromStatus = w.FromStatus, ToStatus = w.ToStatus,
                ActionedBy = w.ActionedBy,
                ActionedByEmployeeName = string.IsNullOrEmpty(w.ActionedBy) ? null
                    : userSvc?.FindByUserId(w.ActionedBy)?.EmployeeName,
                Comments = w.Comments, ActionedAt = w.ActionedAt
            }).ToList()
    };
    }

    /// <summary>
    /// Substitutes variable names in <paramref name="formula"/> with their formatted
    /// numeric values, producing a string like "4 * ((45 650,00 / 160,00) * 1.5)".
    /// Keys are replaced longest-first to avoid partial substitution (e.g. WHPM
    /// being substituted inside WHPM_Monthly).
    /// </summary>
    private static string? BuildFormulaWithValues(string? formula, Dictionary<string, decimal> inputs)
    {
        if (string.IsNullOrWhiteSpace(formula) || inputs.Count == 0) return null;

        var enZa = new System.Globalization.CultureInfo("en-ZA");
        var expr  = formula;

        foreach (var (key, val) in inputs.OrderByDescending(kv => kv.Key.Length))
        {
            string fmt;
            if (val >= 1000m)
                fmt = val.ToString("N2", enZa);
            else if (val == Math.Floor(val))
                fmt = ((long)val).ToString();
            else
                fmt = val.ToString("0.00", System.Globalization.CultureInfo.InvariantCulture);

            // Escape only the search key (it is a regex pattern); the replacement
            // string is treated as a literal by Regex.Replace only when no special
            // characters appear, so use a MatchEvaluator to return the raw fmt value.
            var pattern = System.Text.RegularExpressions.Regex.Escape(key);
            var replacement = fmt; // captured for the lambda
            expr = System.Text.RegularExpressions.Regex.Replace(
                expr,
                pattern,
                _ => replacement,
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        }

        return expr;
    }
}
