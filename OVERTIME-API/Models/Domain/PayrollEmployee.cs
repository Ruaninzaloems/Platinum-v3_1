namespace PlatinumOvertime_API.Models.Domain;

/// <summary>
/// READ-ONLY projection of the legacy Payroll_Employee table.
/// This table is owned by the existing Platinum Payroll system and is NOT
/// managed by this module's migrations (see ExcludeFromMigrations in the
/// DbContext). In production (SQL Server) it already exists; in development
/// (Postgres) it is created and seeded at startup by EmployeeDataSeeder so
/// the same EF queries work end-to-end.
///
/// Only the columns required by the overtime module are mapped here; the real
/// legacy table has ~190 columns (banking, addresses, dependants, payroll
/// cycle, etc.). Adding a column means: add a property here, add the
/// HasColumnName mapping in OvertimeDbContext, add the column to the
/// CREATE TABLE in EmployeeDataSeeder, and (if needed) add it to the seed
/// JSON regeneration.
/// </summary>
public class PayrollEmployee
{
    public int EmployeeId { get; set; }
    public string? EmpCode { get; set; }
    public string? IdNo { get; set; }
    public string? FirstName { get; set; }
    public string? SecondName { get; set; }
    public string? Surname { get; set; }
    public string? KnownAsName { get; set; }
    public string? EmailAddress { get; set; }
    public int? PositionId { get; set; }
    public bool? Enabled { get; set; }
    public bool? AllowOverTime { get; set; }
    public DateTime? JoiningDate { get; set; }
    public DateTime? EndDate { get; set; }

    /// <summary>
    /// SA passport number (alternative to ID number). Real Platinum exposes
    /// this column; in dev it's synthesized for a small subset of employees.
    /// </summary>
    public string? PassportNumber { get; set; }

    // ---------- Salary fields used by overtime formulas ----------
    // The legacy Payroll_Employee row carries the per-employee inputs that
    // overtime salary-head formulas evaluate against. They are populated by
    // the production payroll engine; in dev EmployeeDataSeeder synthesizes
    // plausible deterministic values per EmployeeId.

    /// <summary>Previous-month salary used as the formula's PrevSalary variable.</summary>
    public decimal? PrevSalary { get; set; }

    /// <summary>Working hours per month — formula variable WHPM_Monthly.</summary>
    public decimal? WhpmMonthly { get; set; }

    /// <summary>Rate per day "other" — formula variable RPD_Other.</summary>
    public decimal? RpdOther { get; set; }

    /// <summary>Working hours per day "other" — formula variable WHPD_Other.</summary>
    public decimal? WhpdOther { get; set; }

    /// <summary>
    /// Payroll cycle the employee belongs to (FK to Const_Cycle.Cycle_ID).
    /// Used by the Payroll Processing search to resolve which transactions
    /// belong to a selected cycle — cycle is NOT stored on the transaction.
    /// </summary>
    public int? CycleId { get; set; }
}
