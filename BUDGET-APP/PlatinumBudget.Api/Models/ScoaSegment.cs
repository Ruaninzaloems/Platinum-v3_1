namespace PlatinumBudget.Api.Models;

public abstract class ScoaSegmentBase
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int? ParentId { get; set; }
    public int Level { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
}

public class ScoaItem : ScoaSegmentBase { }
public class ScoaFund : ScoaSegmentBase { }
public class ScoaFunction : ScoaSegmentBase { }
public class ScoaProject : ScoaSegmentBase { }
public class ScoaRegion : ScoaSegmentBase { }
public class ScoaCosting : ScoaSegmentBase { }
public class ScoaMsc : ScoaSegmentBase { }

public class ScoaValidCombination
{
    public int Id { get; set; }
    public int? ScoaItemId { get; set; }
    public int? ScoaFundId { get; set; }
    public int? ScoaFunctionId { get; set; }
    public int? ScoaProjectId { get; set; }
    public int? ScoaRegionId { get; set; }
    public int? ScoaCostingId { get; set; }
    public int? ScoaMscId { get; set; }
    public bool IsValid { get; set; } = true;
    public string? RuleCode { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
}
