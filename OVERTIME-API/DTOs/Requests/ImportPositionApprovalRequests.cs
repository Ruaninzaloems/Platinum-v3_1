namespace PlatinumOvertime_API.DTOs.Requests;

public class PositionConfigChangeRequest
{
    public string PositionId { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsRecommender { get; set; }
    public bool IsApprover { get; set; }
    public bool IsDeptExcessApprover { get; set; }
}

public class ReportingRelationshipChangeRequest
{
    public string PositionId { get; set; } = string.Empty;
    public string ReportsToPositionId { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class ActingAppointmentChangeRequest
{
    public string ActingEmployeeId { get; set; } = string.Empty;
    public string ActingInPositionId { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}

public class ConfirmPositionApprovalImportRequest
{
    public List<PositionConfigChangeRequest> PositionConfigChanges { get; set; } = new();
    public List<ReportingRelationshipChangeRequest> ReportingRelationshipChanges { get; set; } = new();
    public List<ActingAppointmentChangeRequest> ActingAppointmentChanges { get; set; } = new();
}
