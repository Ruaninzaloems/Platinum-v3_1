namespace SCM_API.Helpers;

public static class FinancialYearHelper
{
    public static string GetCurrentFinancialYear()
    {
        var now = DateTime.Now;
        var startYear = now.Month >= 7 ? now.Year : now.Year - 1;
        return $"{startYear}/{startYear + 1}";
    }

    public static (DateTime Start, DateTime End) GetFinancialYearDates(string financialYear)
    {
        var parts = financialYear.Split('/');
        if (parts.Length != 2 || !int.TryParse(parts[0], out var startYear))
        {
            startYear = DateTime.Now.Month >= 7 ? DateTime.Now.Year : DateTime.Now.Year - 1;
        }

        return (new DateTime(startYear, 7, 1), new DateTime(startYear + 1, 6, 30, 23, 59, 59));
    }

    public static bool IsValidFinancialYear(string? financialYear)
    {
        if (string.IsNullOrWhiteSpace(financialYear)) return false;
        var parts = financialYear.Split('/');
        return parts.Length == 2
               && int.TryParse(parts[0], out var y1)
               && int.TryParse(parts[1], out var y2)
               && y2 == y1 + 1;
    }
}
