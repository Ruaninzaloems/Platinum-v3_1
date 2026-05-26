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
    private const string PdfContentType = "application/pdf";

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
        var me = _user.Current.UserId;
        var rows = await _db.OvertimeTransactions
            .Include(t => t.Documents)
            .Include(t => t.WorkflowHistory)
            .AsSplitQuery()
            .Where(t => t.Status != WorkflowStatus.Processed
                        && t.Status != WorkflowStatus.Rejected
                        && (t.CurrentAssigneeUserId == me || t.CapturedBy == me))
            .OrderByDescending(t => t.UpdatedAt)
            .ToListAsync(ct);
        var dto = rows.Select(ToDto).ToList();
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
        var dto = rows.Select(ToDto).ToList();
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
        var dto = rows.Select(ToDto).ToList();
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
        return ApiResponse<List<OvertimeTransactionDto>>.Success(rows.Select(ToDto).ToList());
    }

    public async Task<ApiResponse<OvertimeTransactionDto>> GetAsync(Guid id, CancellationToken ct = default)
    {
        var row = await LoadAsync(id, ct);
        return row is null
            ? ApiResponse<OvertimeTransactionDto>.Failure("Overtime transaction not found.")
            : ApiResponse<OvertimeTransactionDto>.Success(ToDto(row));
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

        if (!int.TryParse(request.EmployeeId, NumberStyles.Integer, CultureInfo.InvariantCulture, out var empNum))
            return ApiResponse<OvertimeTransactionDto>.Failure("EmployeeId is not numeric.");

        // Duplicate guard: warn (not hard-block) when a non-rejected transaction
        // already exists for the same employee + salary head + date.
        var requestedDate = DateTime.SpecifyKind(request.OvertimeDate.Date, DateTimeKind.Utc);
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
        var bundle = await _resolver.ResolveAsync(emp.PositionId, ct);

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
            PositionId = emp.PositionId,
            OvertimeDate = DateTime.SpecifyKind(request.OvertimeDate.Date, DateTimeKind.Utc),
            StartTime = ParseTime(request.StartTime),
            EndTime = ParseTime(request.EndTime),
            Hours = request.Hours,
            Reason = request.Reason,
            SalaryHeadId = request.SalaryHeadId,
            SalaryHeadName = calc.SalaryHeadName,
            FormulaSnapshot = calc.Formula,
            Amount = calc.Amount,
            HoursAlreadyCapturedThisMonth = hoursAlready,
            IsExcess = isExcess,
            Status = WorkflowStatus.Requested,
            RecommenderEmployeeId = bundle.Recommender?.EmployeeId,
            RecommenderEmployeeName = bundle.Recommender?.EmployeeName,
            ApproverEmployeeId = bundle.Approver?.EmployeeId,
            ApproverEmployeeName = bundle.Approver?.EmployeeName,
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
        return ApiResponse<OvertimeTransactionDto>.Success(ToDto(loaded!));
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

            var cfg = await _config.GetAsync(ct);
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
            tx.Amount         = calc.Amount;
            tx.HoursAlreadyCapturedThisMonth = hoursAlready;
            tx.IsExcess       = (hoursAlready + request.Hours) > monthlyMax;

            // If excess flag flipped, refresh the excess-approver snapshot so
            // downstream workflow routing stays consistent. Cheap: same
            // resolver call used at create-time.
            if (tx.IsExcess != wasExcess)
            {
                var bundle = await _resolver.ResolveAsync(tx.PositionId, ct);
                tx.ExcessApproverEmployeeId   = tx.IsExcess ? bundle.ExcessApprover?.EmployeeId   : null;
                tx.ExcessApproverEmployeeName = tx.IsExcess ? bundle.ExcessApprover?.EmployeeName : null;
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
        return ApiResponse<OvertimeTransactionDto>.Success(ToDto(loaded!));
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
            return ApiResponse<AmountPreviewDto>.Success(new AmountPreviewDto
            {
                Amount = calc.Amount,
                Formula = calc.Formula,
                SalaryHeadName = calc.SalaryHeadName,
                Inputs = calc.Inputs
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
        if (!string.Equals(file.ContentType, PdfContentType, StringComparison.OrdinalIgnoreCase)
            && !file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
            return ApiResponse<OvertimeDocumentDto>.Failure("Only PDF documents are supported.");

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
            ContentType = PdfContentType,
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

    private OvertimeTransactionDto ToDto(OvertimeTransaction t)
        => ToDto(t, _user);

    public static OvertimeTransactionDto ToDto(OvertimeTransaction t, ICurrentUserService? userSvc)
    {
        // For rows captured before CapturedByName was persisted, fall back to
        // the in-memory directory lookup (dev only; returns null in production).
        var capturer = string.IsNullOrWhiteSpace(t.CapturedByName)
                       && userSvc is not null
                       && !string.IsNullOrEmpty(t.CapturedBy)
            ? userSvc.FindByUserId(t.CapturedBy)
            : null;

        return new OvertimeTransactionDto
        {
        Id = t.Id,
        EmployeeId = t.EmployeeId,
        EmployeeName = t.EmployeeName,
        DepartmentId = t.DepartmentId,
        DepartmentName = t.DepartmentName,
        PositionId = t.PositionId,
        OvertimeDate = t.OvertimeDate,
        StartTime = t.StartTime?.ToString(@"hh\:mm"),
        EndTime = t.EndTime?.ToString(@"hh\:mm"),
        Hours = t.Hours,
        HoursAlreadyCapturedThisMonth = t.HoursAlreadyCapturedThisMonth,
        IsExcess = t.IsExcess,
        SalaryHeadId = t.SalaryHeadId,
        SalaryHeadName = t.SalaryHeadName,
        FormulaSnapshot = t.FormulaSnapshot,
        Amount = t.Amount,
        Reason = t.Reason,
        Status = t.Status,
        StatusLabel = t.Status.ToLabel(),
        RecommenderEmployeeName = t.RecommenderEmployeeName,
        RecommenderPositionDescription = string.IsNullOrWhiteSpace(t.RecommenderEmployeeId) ? null
            : userSvc?.FindByUserId(t.RecommenderEmployeeId)?.PositionDescription,
        ApproverEmployeeName = t.ApproverEmployeeName,
        ApproverPositionDescription = string.IsNullOrWhiteSpace(t.ApproverEmployeeId) ? null
            : userSvc?.FindByUserId(t.ApproverEmployeeId)?.PositionDescription,
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
                ActionedBy = w.ActionedBy, Comments = w.Comments, ActionedAt = w.ActionedAt
            }).ToList()
    };
    }
}
