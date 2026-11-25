namespace PlatinumOvertime_API.DTOs.Requests;

public class UploadDocumentRequest
{
    public IFormFile File { get; set; } = null!;
}

public class CreateOvertimeTransactionRequest
{
    public string EmployeeId { get; set; } = string.Empty;
    public DateTime OvertimeDate { get; set; }
    public string? StartTime { get; set; }   // "HH:mm"
    public string? EndTime { get; set; }     // "HH:mm"
    public decimal Hours { get; set; }
    public int SalaryHeadId { get; set; }
    public string? Reason { get; set; }

    // Optional legacy payroll classification picked from the Const_*/Payroll_*
    // department/division dropdowns. Names are resolved server-side from the
    // IDs so the client cannot drift from the master data.
    // NOTE: CycleId and PeriodId have been removed — they are resolved from
    // the employee master and must not be stored on the transaction.
    public int? LegacyDepartmentId { get; set; }
    public int? LegacyDivisionId { get; set; }

    /// <summary>
    /// When true the same-date duplicate check is skipped.
    /// The UI sets this after the user confirms the warning dialog.
    /// </summary>
    public bool SkipDuplicateDateCheck { get; set; }
}

public class UpdateOvertimeTransactionRequest
{
    public DateTime OvertimeDate { get; set; }
    public string? StartTime { get; set; }   // "HH:mm"
    public string? EndTime { get; set; }     // "HH:mm"
    public decimal Hours { get; set; }
    public int SalaryHeadId { get; set; }
    public string? Reason { get; set; }

    public int? LegacyDepartmentId { get; set; }
    public int? LegacyDivisionId { get; set; }

    /// <summary>
    /// When true the same-date duplicate check is skipped.
    /// The UI sets this after the user confirms the warning dialog.
    /// </summary>
    public bool SkipDuplicateDateCheck { get; set; }
}

public class WorkflowActionRequest
{
    public string? Comments { get; set; }
}

public class AmountPreviewRequest
{
    public string EmployeeId { get; set; } = string.Empty;
    public int SalaryHeadId { get; set; }
    public decimal Hours { get; set; }
}
