using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;
using PlatinumOvertime_API.Models.Domain;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// Development-only seeder for the five legacy reference tables that the
/// overtime capture flow needs to read but doesn't write to:
///   Payroll_SalaryHead, Payroll_IRP5Code, Payroll_EmployeePayrollDefinition,
///   Const_MOC, Const_MOCDetail.
/// In production (SQL Server) these tables are owned by Platinum Payroll and
/// already populated, so this seeder no-ops on non-Postgres providers.
///
/// Const_MOC and Const_MOCDetail date columns (StartDate, EndDate) are
/// datetime in production. The JSON seed files export them as OADate serial
/// numbers (decimal). The private Raw DTOs capture those decimals, and the
/// mapping converts them via DateTime.FromOADate before inserting.
/// </summary>
public class SalaryHeadDataSeeder
{
    private readonly OvertimeDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<SalaryHeadDataSeeder> _log;

    public SalaryHeadDataSeeder(OvertimeDbContext db, IWebHostEnvironment env, ILogger<SalaryHeadDataSeeder> log)
    {
        _db = db; _env = env; _log = log;
    }

    public async Task SeedIfNeededAsync(CancellationToken ct = default)
    {
        if (!_env.IsDevelopment())
        {
            _log.LogInformation("SalaryHeadDataSeeder skipped (env={Env}); seeding only runs in Development.", _env.EnvironmentName);
            return;
        }
        var providerName = _db.Database.ProviderName ?? string.Empty;
        if (!providerName.Contains("Npgsql", StringComparison.OrdinalIgnoreCase))
        {
            _log.LogInformation("SalaryHeadDataSeeder skipped (provider={Provider}); legacy tables managed by Platinum Payroll.", providerName);
            return;
        }

        // Create tables with correct production-aligned column types (timestamp for dates).
        await _db.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""Payroll_SalaryHead"" (
                ""SalaryHead_ID""    integer PRIMARY KEY,
                ""SalaryHeadName""   varchar(500),
                ""SalaryHeadTitle""  varchar(500),
                ""CalculationFlag""  integer,
                ""IRP5CodeId""       integer,
                ""Enabled""          boolean
            );
            CREATE TABLE IF NOT EXISTS ""Payroll_IRP5Code"" (
                ""IRP5Code_ID""        integer PRIMARY KEY,
                ""IRP5CodeDesc""       varchar(500),
                ""Enabled""            boolean,
                ""IRP5Code""           integer,
                ""TransactionTypeID""  integer
            );
            CREATE TABLE IF NOT EXISTS ""Payroll_EmployeePayrollDefinition"" (
                ""EmployeePayrollDefinition_ID""  integer PRIMARY KEY,
                ""PayrollSalaryHeadID""           integer,
                ""EmployeeID""                    integer,
                ""Percentage""                    decimal(8,4),
                ""Enabled""                       boolean
            );
            CREATE INDEX IF NOT EXISTS ix_epd_emp_head
                ON ""Payroll_EmployeePayrollDefinition"" (""EmployeeID"", ""PayrollSalaryHeadID"");
            CREATE TABLE IF NOT EXISTS ""Const_MOC"" (
                ""MOC_ID""        integer PRIMARY KEY,
                ""SalaryHeadID""  integer,
                ""Enabled""       boolean,
                ""StartDate""     timestamp,
                ""EndDate""       timestamp
            );
            CREATE TABLE IF NOT EXISTS ""Const_MOCDetail"" (
                ""MOCDetail_ID""  integer PRIMARY KEY,
                ""MOCID""         integer,
                ""Enabled""       boolean,
                ""StartDate""     timestamp,
                ""EndDate""       timestamp,
                ""Formula""       varchar(2000)
            );", ct);

        // Migrate existing stale tables that were created with decimal(18,8) for date columns.
        await _db.Database.ExecuteSqlRawAsync(@"
            DO $$ BEGIN
                IF (SELECT data_type FROM information_schema.columns
                    WHERE table_name='Const_MOC' AND column_name='StartDate') = 'numeric' THEN
                    EXECUTE 'ALTER TABLE ""Const_MOC"" ALTER COLUMN ""StartDate"" TYPE timestamp USING NULL';
                    EXECUTE 'ALTER TABLE ""Const_MOC"" ALTER COLUMN ""EndDate""   TYPE timestamp USING NULL';
                    EXECUTE 'TRUNCATE TABLE ""Const_MOC""';
                END IF;
                IF (SELECT data_type FROM information_schema.columns
                    WHERE table_name='Const_MOCDetail' AND column_name='StartDate') = 'numeric' THEN
                    EXECUTE 'ALTER TABLE ""Const_MOCDetail"" ALTER COLUMN ""StartDate"" TYPE timestamp USING NULL';
                    EXECUTE 'ALTER TABLE ""Const_MOCDetail"" ALTER COLUMN ""EndDate""   TYPE timestamp USING NULL';
                    EXECUTE 'TRUNCATE TABLE ""Const_MOCDetail""';
                END IF;
            END $$;", ct);

        await SeedTableAsync<RawSalaryHead, PayrollSalaryHead>(
            "salary_heads.json", "Payroll_SalaryHead",
            r => new PayrollSalaryHead
            {
                SalaryHeadId = r.SalaryHead_ID,
                SalaryHeadName = r.SalaryHeadName,
                SalaryHeadTitle = r.SalaryHeadTitle,
                CalculationFlag = r.CalculationFlag,
                IRP5CodeId = r.IRP5CodeId,
                Enabled = r.Enabled == 1
            }, ct);

        await SeedTableAsync<RawIRP5, PayrollIRP5Code>(
            "irp5_codes.json", "Payroll_IRP5Code",
            r => new PayrollIRP5Code
            {
                IRP5CodeId = r.IRP5Code_ID,
                IRP5CodeDesc = r.IRP5CodeDesc,
                Enabled = r.Enabled == 1,
                IRP5Code = r.IRP5Code,
                TransactionTypeId = r.TransactionTypeID
            }, ct);

        await SeedTableAsync<RawEPD, PayrollEmployeePayrollDefinition>(
            "employee_payroll_definitions.json", "Payroll_EmployeePayrollDefinition",
            r => new PayrollEmployeePayrollDefinition
            {
                EmployeePayrollDefinitionId = r.EmployeePayrollDefinition_ID,
                PayrollSalaryHeadId = r.PayrollSalaryHeadID,
                EmployeeId = r.EmployeeID,
                Percentage = r.Percentage,
                Enabled = r.Enabled == 1
            }, ct);

        // MOC dates come from JSON as OADate serial numbers (e.g. 1, 2958465).
        // DateTime.FromOADate returns Kind=Unspecified; Npgsql 6+ requires Utc
        // for timestamptz columns, so we always SpecifyKind Utc after conversion.
        await SeedTableAsync<RawMOC, ConstMOC>(
            "moc.json", "Const_MOC",
            r => new ConstMOC
            {
                MOCId = r.MOC_ID,
                SalaryHeadId = r.SalaryHeadID,
                Enabled = r.Enabled == 1,
                StartDate = r.StartDate.HasValue
                    ? DateTime.SpecifyKind(DateTime.FromOADate((double)r.StartDate.Value), DateTimeKind.Utc)
                    : null,
                EndDate = r.EndDate.HasValue
                    ? DateTime.SpecifyKind(DateTime.FromOADate((double)r.EndDate.Value), DateTimeKind.Utc)
                    : null
            }, ct);

        await SeedTableAsync<RawMOCDetail, ConstMOCDetail>(
            "moc_detail.json", "Const_MOCDetail",
            r => new ConstMOCDetail
            {
                MOCDetailId = r.MOCDetail_ID,
                MOCId = r.MOCID,
                Enabled = r.Enabled == 1,
                StartDate = r.StartDate.HasValue
                    ? DateTime.SpecifyKind(DateTime.FromOADate((double)r.StartDate.Value), DateTimeKind.Utc)
                    : null,
                EndDate = r.EndDate.HasValue
                    ? DateTime.SpecifyKind(DateTime.FromOADate((double)r.EndDate.Value), DateTimeKind.Utc)
                    : null,
                Formula = r.Formula
            }, ct);
    }

    private async Task SeedTableAsync<TRaw, TEntity>(
        string fileName, string tableName,
        Func<TRaw, TEntity> map, CancellationToken ct)
        where TEntity : class
    {
        var path = Path.Combine(_env.ContentRootPath, "Data", "SeedData", fileName);
        if (!File.Exists(path))
        {
            _log.LogWarning("Seed file not found at {Path}; skipping {Table}.", path, tableName);
            return;
        }

        await using var fs = File.OpenRead(path);
        var rows = await JsonSerializer.DeserializeAsync<List<TRaw>>(fs,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }, ct)
            ?? new List<TRaw>();
        if (rows.Count == 0)
        {
            _log.LogWarning("Seed file {File} contained no rows.", fileName);
            return;
        }

        var entities = rows.Select(map).ToList();

        var existing = await _db.Set<TEntity>().CountAsync(ct);
        if (existing == entities.Count)
        {
            _log.LogInformation("{Table} already populated ({Count} rows).", tableName, existing);
            return;
        }
        if (existing > 0)
        {
            _log.LogWarning("{Table} has {Existing} rows but seed file has {Expected}; rebuilding.",
                tableName, existing, entities.Count);
            await _db.Database.ExecuteSqlRawAsync($"TRUNCATE TABLE \"{tableName}\";", ct);
        }

        _log.LogInformation("Seeding {Table} with {Count} rows...", tableName, entities.Count);
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            const int batchSize = 1000;
            for (var i = 0; i < entities.Count; i += batchSize)
            {
                var batch = entities.Skip(i).Take(batchSize).ToList();
                await _db.Set<TEntity>().AddRangeAsync(batch, ct);
                await _db.SaveChangesAsync(ct);
                _db.ChangeTracker.Clear();
            }

            var final = await _db.Set<TEntity>().CountAsync(ct);
            if (final != entities.Count)
                throw new InvalidOperationException(
                    $"{tableName} seed integrity check failed: inserted {final}, expected {entities.Count}.");
            await tx.CommitAsync(ct);
            _log.LogInformation("{Table} seed complete ({Count} rows).", tableName, entities.Count);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }

    // Raw DTOs match the JSON keys produced from the customer xlsx fixtures.
    // Keeping them private and column-named makes the JSON contract explicit
    // and avoids polluting the domain layer with denormalized shapes.
    private class RawSalaryHead
    {
        [JsonPropertyName("SalaryHead_ID")] public int SalaryHead_ID { get; set; }
        public string? SalaryHeadName { get; set; }
        public string? SalaryHeadTitle { get; set; }
        public int? CalculationFlag { get; set; }
        public int? IRP5CodeId { get; set; }
        public int? Enabled { get; set; }
    }
    private class RawIRP5
    {
        [JsonPropertyName("IRP5Code_ID")] public int IRP5Code_ID { get; set; }
        public string? IRP5CodeDesc { get; set; }
        public int? Enabled { get; set; }
        public int? IRP5Code { get; set; }
        public int? TransactionTypeID { get; set; }
    }
    private class RawEPD
    {
        [JsonPropertyName("EmployeePayrollDefinition_ID")] public int EmployeePayrollDefinition_ID { get; set; }
        public int PayrollSalaryHeadID { get; set; }
        public int EmployeeID { get; set; }
        public decimal? Percentage { get; set; }
        public int? Enabled { get; set; }
    }
    // StartDate/EndDate are OADate serial decimals in the JSON export.
    // Conversion to DateTime happens in the mapping lambda above.
    private class RawMOC
    {
        [JsonPropertyName("MOC_ID")] public int MOC_ID { get; set; }
        public int SalaryHeadID { get; set; }
        public int? Enabled { get; set; }
        public decimal? StartDate { get; set; }
        public decimal? EndDate { get; set; }
    }
    private class RawMOCDetail
    {
        [JsonPropertyName("MOCDetail_ID")] public int MOCDetail_ID { get; set; }
        public int MOCID { get; set; }
        public int? Enabled { get; set; }
        public decimal? StartDate { get; set; }
        public decimal? EndDate { get; set; }
        [JsonConverter(typeof(StringOrNumberConverter))]
        public string? Formula { get; set; }
    }

    private sealed class StringOrNumberConverter : System.Text.Json.Serialization.JsonConverter<string?>
    {
        public override string? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            return reader.TokenType switch
            {
                JsonTokenType.Null => null,
                JsonTokenType.String => reader.GetString(),
                JsonTokenType.Number => reader.TryGetInt64(out var i)
                    ? i.ToString(System.Globalization.CultureInfo.InvariantCulture)
                    : reader.GetDecimal().ToString(System.Globalization.CultureInfo.InvariantCulture),
                JsonTokenType.True => "true",
                JsonTokenType.False => "false",
                _ => reader.GetString()
            };
        }

        public override void Write(Utf8JsonWriter writer, string? value, JsonSerializerOptions options)
        {
            if (value is null) writer.WriteNullValue(); else writer.WriteStringValue(value);
        }
    }
}
