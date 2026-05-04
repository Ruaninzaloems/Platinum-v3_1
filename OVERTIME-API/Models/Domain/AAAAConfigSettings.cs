namespace PlatinumOvertime_API.Models.Domain;

/// <summary>
/// READ-ONLY projection of the legacy AAAA_ConfigSettings table.
/// Owned by Platinum Payroll in production; created and seeded in dev only.
///
/// Holds key/value system configuration entries (active financial year,
/// active tax year, etc.) consumed by the Platinum suite. The overtime
/// module will read selected keys (e.g. ActiveFinYear, TaxYear) without
/// writing to this table.
/// </summary>
public class AAAAConfigSettings
{
    public int ConfigSettId { get; set; }
    public string? KeyName { get; set; }
    public string? KeyValue { get; set; }
    public string? KeyDescription { get; set; }
    public string? Module { get; set; }

    /// <summary>Excel-serial date in dev; real datetime2 in prod.</summary>
    public decimal? DateCaptured { get; set; }

    public int? CapturerId { get; set; }
    public int? PerMuniSetupRequirements { get; set; }
}
