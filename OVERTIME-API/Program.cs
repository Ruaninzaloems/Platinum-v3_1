using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using PlatinumOvertime_API.Configuration;
using PlatinumOvertime_API.Data;
using PlatinumOvertime_API.Mappings;
using PlatinumOvertime_API.Middleware;
using PlatinumOvertime_API.Models.Common;
using PlatinumOvertime_API.Repositories.Implementations;
using PlatinumOvertime_API.Repositories.Interfaces;
using PlatinumOvertime_API.Services.Implementations;
using PlatinumOvertime_API.Services.Interfaces;
using PlatinumOvertime_API.Validators;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// ---------- Serilog ----------
builder.Host.UseSerilog((ctx, cfg) => cfg
    .ReadFrom.Configuration(ctx.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console());

// ---------- DbContext ----------
// Production target: SQL Server (schema delivered as database/sqlserver/001_initial.sql).
// Development:       Postgres, EF migrations are the source of truth.
//
// Resolution order for the dev connection string:
//   1. ConnectionStrings:OvertimeDb (appsettings)
//   2. DATABASE_URL env var (postgres://user:pass@host:port/db) — converted to Npgsql
//   3. PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD env vars
var dbProvider = builder.Configuration.GetValue<string>("Database:Provider") ?? "SqlServer";
var connStr = builder.Configuration.GetConnectionString("OvertimeDb");

if (string.Equals(dbProvider, "Postgres", StringComparison.OrdinalIgnoreCase) && string.IsNullOrWhiteSpace(connStr))
    connStr = ResolvePostgresConnectionString();

if (string.IsNullOrWhiteSpace(connStr))
    throw new InvalidOperationException("Database connection string is not configured.");

if (string.Equals(dbProvider, "Postgres", StringComparison.OrdinalIgnoreCase))
{
    builder.Services.AddDbContext<OvertimeDbContextPostgres>(opts => opts
        .UseNpgsql(connStr)
        .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));
    builder.Services.AddScoped<OvertimeDbContext>(sp => sp.GetRequiredService<OvertimeDbContextPostgres>());
}
else
{
    builder.Services.AddDbContext<OvertimeDbContextSqlServer>(opts => opts.UseSqlServer(connStr));
    builder.Services.AddScoped<OvertimeDbContext>(sp => sp.GetRequiredService<OvertimeDbContextSqlServer>());
}

static string? ResolvePostgresConnectionString()
{
    var url = Environment.GetEnvironmentVariable("DATABASE_URL");
    if (!string.IsNullOrWhiteSpace(url))
    {
        try
        {
            var u = new Uri(url);
            var userInfo = u.UserInfo.Split(':', 2);
            var user = Uri.UnescapeDataString(userInfo[0]);
            var pwd = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
            var qs = System.Web.HttpUtility.ParseQueryString(u.Query);
            var sslMode = (qs["sslmode"] ?? "prefer") switch
            {
                "disable"     => "Disable",
                "require"     => "Require",
                "prefer"      => "Prefer",
                "verify-full" => "Require",   // Azure: Require is sufficient; VerifyFull needs DigiCert CA
                "verify-ca"   => "Require",
                _             => "Prefer"
            };
            return $"Host={u.Host};Port={(u.Port > 0 ? u.Port : 5432)};Database={u.AbsolutePath.TrimStart('/')};Username={user};Password={pwd};SSL Mode={sslMode};Trust Server Certificate=true";
        }
        catch { /* fall through to PG* vars */ }
    }
    var host = Environment.GetEnvironmentVariable("PGHOST");
    if (string.IsNullOrWhiteSpace(host)) return null;
    var port = Environment.GetEnvironmentVariable("PGPORT") ?? "5432";
    var db = Environment.GetEnvironmentVariable("PGDATABASE") ?? "postgres";
    var pgUser = Environment.GetEnvironmentVariable("PGUSER") ?? "postgres";
    var pgPwd = Environment.GetEnvironmentVariable("PGPASSWORD") ?? "";
    return $"Host={host};Port={port};Database={db};Username={pgUser};Password={pgPwd};SSL Mode=Prefer;Trust Server Certificate=false";
}

// ---------- Integration boundary ----------
// Mock implementation today; swap for a typed HttpClient once Platinum API URLs are supplied.
// ---------- Platinum integration ----------
builder.Services.Configure<PlatinumIntegrationOptions>(
    builder.Configuration.GetSection(PlatinumIntegrationOptions.SectionName));
var integrationOptions = builder.Configuration
    .GetSection(PlatinumIntegrationOptions.SectionName)
    .Get<PlatinumIntegrationOptions>() ?? new PlatinumIntegrationOptions();

if (integrationOptions.UseMock || string.IsNullOrWhiteSpace(integrationOptions.BaseUrl))
{
    // Mock is always registered (concrete) so the Db-backed wrappers can decorate it.
    builder.Services.AddSingleton<MockPlatinumIntegrationService>();

    // Positions decorator (over the mock) — always built so we can chain Employees on top of it.
    builder.Services.AddSingleton<DbPositionsPlatinumIntegrationService>();

    var positionsFromDb = string.Equals(integrationOptions.PositionsSource, "Db", StringComparison.OrdinalIgnoreCase);
    var employeesFromDb = string.Equals(integrationOptions.EmployeesSource, "Db", StringComparison.OrdinalIgnoreCase);

    builder.Services.AddSingleton<IPlatinumIntegrationService>(sp =>
    {
        // Build the chain: [Employees decorator?] → [Positions decorator?] → Mock.
        IPlatinumIntegrationService inner = positionsFromDb
            ? sp.GetRequiredService<DbPositionsPlatinumIntegrationService>()
            : sp.GetRequiredService<MockPlatinumIntegrationService>();

        if (employeesFromDb)
        {
            inner = new DbEmployeesPlatinumIntegrationService(
                inner,
                sp.GetRequiredService<IServiceScopeFactory>(),
                sp.GetRequiredService<IMemoryCache>());
        }
        return inner;
    });
}
else
{
    // Real HTTP-backed Platinum integration is implemented in a follow-up task.
    // Fail fast so misconfiguration is obvious instead of silently mocking in production.
    throw new InvalidOperationException(
        "PlatinumIntegration.UseMock is false but no real HttpPlatinumIntegrationService is registered yet. " +
        "Set UseMock=true in appsettings until the real client ships.");
}

// ---------- Dev seeders for legacy Payroll_* tables ----------
builder.Services.AddMemoryCache();
builder.Services.AddScoped<PositionDataSeeder>();
builder.Services.AddScoped<EmployeeDataSeeder>();
builder.Services.AddScoped<SalaryHeadDataSeeder>();
builder.Services.AddScoped<AAAAConfigSettingsSeeder>();
builder.Services.AddScoped<ConstCycleSeeder>();
builder.Services.AddScoped<ConstDepartmentSeeder>();
builder.Services.AddScoped<ConstDivisionSeeder>();
builder.Services.AddScoped<PayrollCyclePeriodDetailsSeeder>();
builder.Services.AddScoped<UserUserDetailSeeder>();
builder.Services.AddScoped<UserUserRoleSeeder>();
builder.Services.AddScoped<SysRolePermissionSeeder>();
builder.Services.AddScoped<PayrollEmployeeOvertimeSeeder>();

// ---------- Schema upgrader for OvertimeTransaction (idempotent ALTERs) ----------
builder.Services.AddScoped<OvertimeCaptureSchemaUpgrader>();

// ---------- Current-user shim (X-User-Id header → DevUserDirectory) ----------
builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton<DevUserDirectory>();
builder.Services.AddScoped<ICurrentUserService, DevCurrentUserService>();

// ---------- Overtime amount + formula + assignee resolver ----------
builder.Services.AddSingleton<FormulaEvaluator>();
builder.Services.AddScoped<IOvertimeAmountService, OvertimeAmountService>();
builder.Services.AddScoped<IAssigneeResolverService, AssigneeResolverService>();

// ---------- Stub services (transactions / workflow / payroll write-back) ----------
// Wired now so the layering contract is satisfied; concrete behaviour ships
// in follow-up tasks.
builder.Services.AddScoped<IOvertimeTransactionsService, OvertimeTransactionsService>();
builder.Services.AddScoped<IWorkflowService, WorkflowService>();
builder.Services.AddScoped<IPayrollProcessingService, PayrollProcessingService>();

// ---------- Repositories ----------
builder.Services.AddScoped<IOvertimeConfigRepository, OvertimeConfigRepository>();
builder.Services.AddScoped<IPositionApprovalRepository, PositionApprovalRepository>();

// ---------- Services ----------
builder.Services.AddScoped<IOvertimeConfigService, OvertimeConfigService>();
builder.Services.AddScoped<IPositionApprovalService, PositionApprovalService>();

// ---------- AutoMapper ----------
builder.Services.AddAutoMapper(cfg => cfg.AddProfile<MappingProfile>());

// ---------- FluentValidation ----------
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<UpdateOvertimeConfigValidator>();

// ---------- CORS ----------
// Permissive in development for the Angular dev server; explicit allow-list in production.
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                     ?? new[] { "http://localhost:4200" };
builder.Services.AddCors(opts =>
{
    opts.AddDefaultPolicy(p =>
    {
        if (builder.Environment.IsDevelopment())
        {
            p.WithOrigins("http://localhost:4200", "http://localhost:4300")
             .AllowAnyHeader().AllowAnyMethod().AllowCredentials();
        }
        else
        {
            p.WithOrigins(allowedOrigins)
             .AllowAnyHeader().AllowAnyMethod().AllowCredentials();
        }
    });
});

builder.Services.AddControllers();

// Wrap model-validation failures in ApiResponse<T> instead of ProblemDetails.
builder.Services.Configure<ApiBehaviorOptions>(opts =>
{
    opts.InvalidModelStateResponseFactory = ctx =>
    {
        var errors = ctx.ModelState
            .Where(kv => kv.Value?.Errors.Count > 0)
            .SelectMany(kv => kv.Value!.Errors.Select(e =>
                string.IsNullOrWhiteSpace(e.ErrorMessage) ? kv.Key : $"{kv.Key}: {e.ErrorMessage}"))
            .ToList();
        var body = ApiResponse<object>.Failure("Validation failed.", errors);
        return new BadRequestObjectResult(body);
    };
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// ---------- Bootstrap schema ----------
// Both providers carry their own EF migration set:
//   Data/Migrations/Postgres/  — applied at runtime in dev
//   Data/Migrations/SqlServer/ — applied at runtime in prod, also exported as
//                                database/sqlserver/001_initial.sql for DBA use.
// Fail fast on startup if schema migration or required dev seeding fails:
// it is much safer to refuse to serve than to silently run with a broken DB.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<OvertimeDbContext>();
    db.Database.Migrate();

    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var skipSeeding = app.Configuration.GetValue<bool>("Seeding:SkipOnStartup");

    async Task RunSeeder(string name, Func<Task> action)
    {
        try { await action(); }
        catch (Exception ex) { logger.LogWarning(ex, "Seeder {Name} failed (non-fatal); API will continue without this seed data.", name); }
    }

    if (skipSeeding)
    {
        logger.LogInformation("Seeding:SkipOnStartup=true — skipping all dev data seeders.");
        await RunSeeder("OvertimeCaptureSchema", () => scope.ServiceProvider.GetRequiredService<OvertimeCaptureSchemaUpgrader>().UpgradeAsync());
    }
    else
    {
        await RunSeeder("PositionData", () => scope.ServiceProvider.GetRequiredService<PositionDataSeeder>().SeedIfNeededAsync());
        await RunSeeder("EmployeeData", () => scope.ServiceProvider.GetRequiredService<EmployeeDataSeeder>().SeedIfNeededAsync());
        await RunSeeder("SalaryHead", () => scope.ServiceProvider.GetRequiredService<SalaryHeadDataSeeder>().SeedIfNeededAsync());
        await RunSeeder("AAAAConfigSettings", () => scope.ServiceProvider.GetRequiredService<AAAAConfigSettingsSeeder>().SeedIfNeededAsync());
        await RunSeeder("ConstCycle", () => scope.ServiceProvider.GetRequiredService<ConstCycleSeeder>().SeedIfNeededAsync());
        await RunSeeder("ConstDepartment", () => scope.ServiceProvider.GetRequiredService<ConstDepartmentSeeder>().SeedIfNeededAsync());
        await RunSeeder("ConstDivision", () => scope.ServiceProvider.GetRequiredService<ConstDivisionSeeder>().SeedIfNeededAsync());
        await RunSeeder("PayrollCyclePeriodDetails", () => scope.ServiceProvider.GetRequiredService<PayrollCyclePeriodDetailsSeeder>().SeedIfNeededAsync());
        await RunSeeder("UserUserDetail", () => scope.ServiceProvider.GetRequiredService<UserUserDetailSeeder>().SeedIfNeededAsync());
        await RunSeeder("UserUserRole", () => scope.ServiceProvider.GetRequiredService<UserUserRoleSeeder>().SeedIfNeededAsync());
        await RunSeeder("SysRolePermission", () => scope.ServiceProvider.GetRequiredService<SysRolePermissionSeeder>().SeedIfNeededAsync());
        await RunSeeder("PayrollEmployeeOvertime", () => scope.ServiceProvider.GetRequiredService<PayrollEmployeeOvertimeSeeder>().SeedIfNeededAsync());
        await RunSeeder("OvertimeCaptureSchema", () => scope.ServiceProvider.GetRequiredService<OvertimeCaptureSchemaUpgrader>().UpgradeAsync());
    }
}

app.UseMiddleware<CorrelationIdMiddleware>();
app.UseSerilogRequestLogging();
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthorization();
app.MapControllers();

app.Run();

/// <summary>Exposes the generated <c>Program</c> class so integration-test projects can reference it.</summary>
public partial class Program { }
