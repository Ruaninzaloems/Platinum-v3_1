using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;
using PlatinumOvertime_API.Models.Domain;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// Development-only seeder. Ensures the legacy Const_Department table
/// exists in the dev Postgres database and is populated from the supplied
/// spreadsheet. In production (SQL Server) this seeder is a no-op because
/// the real table is owned by Platinum Payroll.
/// </summary>
public class ConstDepartmentSeeder
{
    private readonly OvertimeDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<ConstDepartmentSeeder> _log;

    public ConstDepartmentSeeder(OvertimeDbContext db, IWebHostEnvironment env, ILogger<ConstDepartmentSeeder> log)
    {
        _db = db; _env = env; _log = log;
    }

    public async Task SeedIfNeededAsync(CancellationToken ct = default)
    {
        if (!_env.IsDevelopment())
        {
            _log.LogInformation("ConstDepartmentSeeder skipped (env={Env}); seeding only runs in Development.", _env.EnvironmentName);
            return;
        }
        var providerName = _db.Database.ProviderName ?? string.Empty;
        if (!providerName.Contains("Npgsql", StringComparison.OrdinalIgnoreCase))
        {
            _log.LogInformation("ConstDepartmentSeeder skipped (provider={Provider}); legacy table managed by Platinum Payroll.", providerName);
            return;
        }

        await _db.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""Const_Department"" (
                ""Department_ID""        integer PRIMARY KEY,
                ""DepartmentDesc""       varchar(500),
                ""Enabled""              boolean,
                ""DateCaptured""         decimal(18,8),
                ""CapturerID""           integer,
                ""DateModified""         decimal(18,8),
                ""ModifierID""           integer,
                ""DepartmentCode""       varchar(64),
                ""StartDate""            decimal(18,8),
                ""EndDate""              decimal(18,8),
                ""VatApportionment""     decimal(18,4),
                ""ManagerPositionID""    integer,
                ""ManagerStartDate""     decimal(18,8),
                ""ManagerEndDate""       decimal(18,8),
                ""FinYear""              varchar(32)
            );", ct);

        var path = Path.Combine(_env.ContentRootPath, "Data", "SeedData", "const_department.json");
        if (!File.Exists(path))
        {
            _log.LogWarning("Const_Department seed file not found at {Path}; nothing seeded.", path);
            return;
        }

        await using var fs = File.OpenRead(path);
        var rows = await JsonSerializer.DeserializeAsync<List<ConstDepartment>>(fs,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }, ct) ?? new List<ConstDepartment>();
        if (rows.Count == 0)
        {
            _log.LogWarning("Const_Department seed file at {Path} contained no rows.", path);
            return;
        }

        var existing = await _db.Set<ConstDepartment>().CountAsync(ct);
        if (existing == rows.Count)
        {
            _log.LogInformation("Const_Department already fully populated ({Count} rows); skipping seed.", existing);
            return;
        }
        if (existing > 0)
        {
            _log.LogWarning("Const_Department has {Existing} rows but seed file has {Expected}; rebuilding.",
                existing, rows.Count);
            await _db.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"Const_Department\";", ct);
        }

        _log.LogInformation("Seeding Const_Department with {Count} rows...", rows.Count);
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            const int batchSize = 500;
            for (var i = 0; i < rows.Count; i += batchSize)
            {
                var batch = rows.Skip(i).Take(batchSize).ToList();
                await _db.Set<ConstDepartment>().AddRangeAsync(batch, ct);
                await _db.SaveChangesAsync(ct);
                _db.ChangeTracker.Clear();
            }

            var final = await _db.Set<ConstDepartment>().CountAsync(ct);
            if (final != rows.Count)
                throw new InvalidOperationException(
                    $"Const_Department seed integrity check failed: inserted {final}, expected {rows.Count}.");
            await tx.CommitAsync(ct);
            _log.LogInformation("Const_Department seed complete ({Count} rows).", rows.Count);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }
}
