using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PlatinumOvertime_API.Data;
using PlatinumOvertime_API.Models.Domain;

namespace PlatinumOvertime_API.Services.Implementations;

/// <summary>
/// Development-only seeder. Ensures the legacy User_UserDetail table exists
/// in the dev Postgres database and is populated from the supplied
/// spreadsheet. In production (SQL Server) this seeder is a no-op because
/// the real table is owned by Platinum Payroll.
///
/// Sensitive columns (Password, TransactionPassword, SignatureImage) are
/// preserved as null in the seed data.
/// </summary>
public class UserUserDetailSeeder
{
    private readonly OvertimeDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<UserUserDetailSeeder> _log;

    public UserUserDetailSeeder(OvertimeDbContext db, IWebHostEnvironment env, ILogger<UserUserDetailSeeder> log)
    {
        _db = db; _env = env; _log = log;
    }

    public async Task SeedIfNeededAsync(CancellationToken ct = default)
    {
        if (!_env.IsDevelopment())
        {
            _log.LogInformation("UserUserDetailSeeder skipped (env={Env}); seeding only runs in Development.", _env.EnvironmentName);
            return;
        }
        var providerName = _db.Database.ProviderName ?? string.Empty;
        if (!providerName.Contains("Npgsql", StringComparison.OrdinalIgnoreCase))
        {
            _log.LogInformation("UserUserDetailSeeder skipped (provider={Provider}); legacy table managed by Platinum Payroll.", providerName);
            return;
        }

        await _db.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""User_UserDetail"" (
                ""User_id""                    integer PRIMARY KEY,
                ""UserName""                   varchar(200),
                ""Password""                   varchar(500),
                ""Company""                    varchar(500),
                ""TelNo""                      varchar(64),
                ""eMail""                      varchar(320),
                ""FirstName""                  varchar(200),
                ""LastName""                   varchar(200),
                ""EmpID""                      integer,
                ""DepartmentID""               integer,
                ""Enabled""                    boolean,
                ""TotalLogin""                 integer,
                ""LastLoginDate""              decimal(18,8),
                ""sendSMS""                    boolean,
                ""SuperUser""                  boolean,
                ""DateCaptured""               decimal(18,8),
                ""CapturerID""                 integer,
                ""PasswordNeverExpire""        boolean,
                ""PasswordLastChangedDate""    decimal(18,8),
                ""ModifierID""                 integer,
                ""DateModified""               decimal(18,8),
                ""TemporaryPassword""          boolean,
                ""CashFloat""                  decimal(18,2),
                ""StartDate""                  decimal(18,8),
                ""EndDate""                    decimal(18,8),
                ""HistoricUser""               boolean,
                ""TransactionPassword""        varchar(500),
                ""SignatureFilePath""          varchar(1000),
                ""SignatureUploadedOn""        decimal(18,8),
                ""SignatureImage""             text,
                ""SignatureImageMimeType""     varchar(100)
            );
            CREATE INDEX IF NOT EXISTS ix_user_user_detail_emp
                ON ""User_UserDetail"" (""EmpID"");", ct);

        var path = Path.Combine(_env.ContentRootPath, "Data", "SeedData", "user_user_detail.json");
        if (!File.Exists(path))
        {
            _log.LogWarning("User_UserDetail seed file not found at {Path}; nothing seeded.", path);
            return;
        }

        await using var fs = File.OpenRead(path);
        var rows = await JsonSerializer.DeserializeAsync<List<UserUserDetail>>(fs,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }, ct) ?? new List<UserUserDetail>();
        if (rows.Count == 0)
        {
            _log.LogWarning("User_UserDetail seed file at {Path} contained no rows.", path);
            return;
        }

        var existing = await _db.Set<UserUserDetail>().CountAsync(ct);
        if (existing == rows.Count)
        {
            _log.LogInformation("User_UserDetail already fully populated ({Count} rows); skipping seed.", existing);
            return;
        }
        if (existing > 0)
        {
            _log.LogWarning("User_UserDetail has {Existing} rows but seed file has {Expected}; rebuilding.",
                existing, rows.Count);
            await _db.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"User_UserDetail\";", ct);
        }

        _log.LogInformation("Seeding User_UserDetail with {Count} rows...", rows.Count);
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            const int batchSize = 500;
            for (var i = 0; i < rows.Count; i += batchSize)
            {
                var batch = rows.Skip(i).Take(batchSize).ToList();
                await _db.Set<UserUserDetail>().AddRangeAsync(batch, ct);
                await _db.SaveChangesAsync(ct);
                _db.ChangeTracker.Clear();
            }

            var final = await _db.Set<UserUserDetail>().CountAsync(ct);
            if (final != rows.Count)
                throw new InvalidOperationException(
                    $"User_UserDetail seed integrity check failed: inserted {final}, expected {rows.Count}.");
            await tx.CommitAsync(ct);
            _log.LogInformation("User_UserDetail seed complete ({Count} rows).", rows.Count);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }
}
