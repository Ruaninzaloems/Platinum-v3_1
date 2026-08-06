namespace PlatinumOvertime_API.DTOs.Responses;

public class OrgChartDto
{
    public List<OrgChartNodeDto> Nodes { get; set; } = [];

    /// <summary>
    /// Total counts across the full dataset (not affected by gapsOnly filtering).
    /// The client uses these to populate summary statistics even in gaps-only view.
    /// </summary>
    public int TotalPacCount  { get; set; }
    public int TotalLeafCount { get; set; }
    public int TotalGapCount  { get; set; }
}

public class OrgChartNodeDto
{
    /// <summary>Position ID from the Platinum system.</summary>
    public string PositionId { get; set; } = string.Empty;

    public string PositionDescription { get; set; } = string.Empty;

    public bool IsRecommender { get; set; }
    public bool IsApprover { get; set; }
    public bool IsExcessApprover { get; set; }

    /// <summary>
    /// PositionId of the parent PAC node in the reporting chain.
    /// Null for root nodes (not listed as a subordinate of any other PAC).
    /// </summary>
    public string? ParentPositionId { get; set; }

    /// <summary>
    /// True for positions that have a PositionApprovalConfig entry (the
    /// "management" nodes in the tree). False for leaf subordinate positions
    /// that appear in reporting relationships but have no PAC entry of their own.
    /// </summary>
    public bool IsPacNode { get; set; }

    /// <summary>
    /// True when walking the ancestor chain from this position finds no PAC
    /// with IsOvertimeRecommender = true. Any employee occupying this position
    /// would be blocked from submitting an overtime claim.
    /// </summary>
    public bool HasRecommenderGap { get; set; }

    /// <summary>Employee currently occupying this position (null = vacant).</summary>
    public string? EmployeeId   { get; set; }
    public string? EmployeeName { get; set; }
}
