namespace PlatinumBudget.Api.DTOs.Planning;

public class ConstGetScoaVersionByFinYearRequest
{
    public string? FinYear { get; set; }
    public string? TablenameActual { get; set; }
    public string? StructureName { get; set; }
}

public class ConstIDPLevelDescriptionSearchRequest
{
    public string? financialYear { get; set; }
}

public class ConstIDPLevelHeaderSearchRequest
{
    public string? financialYear { get; set; }
}

public class ConstIDPNationalKPASearchRequest
{
    public string? financialYear { get; set; }
}
