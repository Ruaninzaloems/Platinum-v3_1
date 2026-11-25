namespace PlatinumOvertime_API.Models.Domain;

/// <summary>
/// READ-ONLY projection of the legacy AAAA_ConfigSettings table.
/// Owned by Platinum Payroll in production; created and seeded in dev only.
///
/// Holds key/value system configuration entries (active financial year,
/// active tax year, etc.) consumed by the Platinum suite. The overtime
/// module will read selected keys (e.g. ActiveFinYear, TaxYear) without
/// writing to this table.
///
/// Production SQL Server column types (verified 2026-05-11):
///   ConfigSett_ID int, KeyName varchar, KeyValue varchar,
///   KeyDescription varchar, Module varchar, DateCaptured datetime,
///   CapturerID int, perMuni_SetupRequirements bit.
/// </summary>
public class AAAAConfigSettings
{
    public int ConfigSettId { get; set; }
    public string? KeyName { get; set; }
    public string? KeyValue { get; set; }
    public string? KeyDescription { get; set; }
    public string? Module { get; set; }
    public DateTime? DateCaptured { get; set; }
    public int? CapturerId { get; set; }
    public bool? PerMuniSetupRequirements { get; set; }
}
