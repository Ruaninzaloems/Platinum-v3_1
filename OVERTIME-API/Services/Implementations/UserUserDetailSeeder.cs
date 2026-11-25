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
///
/// All date columns are datetime in production. JSON seed export contains
/// OADate serial numbers; OADateJsonConverter handles conversion to DateTime.
/// SignatureImage is varbinary in production; mapped as bytea in Postgres.
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
                ""LastLoginDate""              timestamp,
                ""sendSMS""                    boolean,
                ""SuperUser""                  boolean,
                ""DateCaptured""               timestamp,
                ""CapturerID""                 integer,
                ""PasswordNeverExpire""        boolean,
                ""PasswordLastChangedDate""    timestamp,
                ""ModifierID""                 integer,
                ""DateModified""               timestamp,
                ""TemporaryPassword""          boolean,
                ""CashFloat""                  decimal(18,2),
                ""StartDate""                  timestamp,
                ""EndDate""                    timestamp,
                ""HistoricUser""               varchar(100),
                ""TransactionPassword""        varchar(500),
                ""SignatureFilePath""          varchar(1000),
                ""SignatureUploadedOn""        timestamp,
                ""SignatureImage""             bytea,
                ""SignatureImageMimeType""     varchar(100)
            );
            CREATE INDEX IF NOT EXISTS ix_user_user_detail_emp
                ON ""User_UserDetail"" (""EmpID"");", ct);

        // Migrate existing table if columns were previously created with wrong types.
        // IMPORTANT: these migrations must NEVER truncate the table — existing rows
        // (including manually-set passwords) must always be preserved.
        await _db.Database.ExecuteSqlRawAsync(@"
            DO $$ BEGIN
                IF (SELECT data_type FROM information_schema.columns
                    WHERE table_name='User_UserDetail' AND column_name='LastLoginDate') = 'numeric' THEN
                    EXECUTE 'ALTER TABLE ""User_UserDetail"" ALTER COLUMN ""LastLoginDate""           TYPE timestamp USING NULL';
                    EXECUTE 'ALTER TABLE ""User_UserDetail"" ALTER COLUMN ""DateCaptured""            TYPE timestamp USING NULL';
                    EXECUTE 'ALTER TABLE ""User_UserDetail"" ALTER COLUMN ""PasswordLastChangedDate"" TYPE timestamp USING NULL';
                    EXECUTE 'ALTER TABLE ""User_UserDetail"" ALTER COLUMN ""DateModified""            TYPE timestamp USING NULL';
                    EXECUTE 'ALTER TABLE ""User_UserDetail"" ALTER COLUMN ""StartDate""               TYPE timestamp USING NULL';
                    EXECUTE 'ALTER TABLE ""User_UserDetail"" ALTER COLUMN ""EndDate""                 TYPE timestamp USING NULL';
                    EXECUTE 'ALTER TABLE ""User_UserDetail"" ALTER COLUMN ""SignatureUploadedOn""     TYPE timestamp USING NULL';
                END IF;
                IF (SELECT data_type FROM information_schema.columns
                    WHERE table_name='User_UserDetail' AND column_name='SignatureImage') = 'text' THEN
                    EXECUTE 'ALTER TABLE ""User_UserDetail"" DROP COLUMN ""SignatureImage""';
                    EXECUTE 'ALTER TABLE ""User_UserDetail"" ADD COLUMN ""SignatureImage"" bytea';
                END IF;
            END $$;", ct);

        var path = Path.Combine(_env.ContentRootPath, "Data", "SeedData", "user_user_detail.json");
        if (!File.Exists(path))
        {
            _log.LogWarning("User_UserDetail seed file not found at {Path}; nothing seeded.", path);
            return;
        }

        var opts = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            Converters = { new OADateJsonConverter() }
        };

        await using var fs = File.OpenRead(path);
        var rows = await JsonSerializer.DeserializeAsync<List<UserUserDetail>>(fs, opts, ct) ?? new List<UserUserDetail>();
        if (rows.Count == 0)
        {
            _log.LogWarning("User_UserDetail seed file at {Path} contained no rows.", path);
            return;
        }

        var existing = await _db.Set<UserUserDetail>().CountAsync(ct);
        if (existing > 0)
        {
            // Table already has rows — never wipe it. Passwords and any other
            // fields set manually in dev must be preserved across restarts.
            // Seeding only runs when the table is completely empty.
            _log.LogInformation("User_UserDetail already populated ({Existing} rows); skipping seed.", existing);
            return;
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
