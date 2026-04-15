namespace PlatinumBudget.Api.DTOs.Planning;

public class IDPGetIDPLowestLevelItemsRequest
{
    public string? FinYear { get; set; }
}

public class IDPGetItemPathFromRootRequest
{
    public int? itemID { get; set; }
}

public class IDPStructureRequest
{
    public string? financialYear { get; set; }
}
