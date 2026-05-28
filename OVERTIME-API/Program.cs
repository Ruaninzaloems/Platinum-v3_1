using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
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

// Honour the PORT env var injected by Azure App Service (and Replit).
// Falls back to ASP.NET Core's default behaviour when not set.
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

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
    builder.Services.AddDbContext<OvertimeDbContextSqlServer>(opts => opts
        .UseSqlServer(connStr)
        .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));
    builder.Services.AddScoped<OvertimeDbContext>(sp => sp.GetRequiredService<OvertimeDbContextSqlServer>());
}

static string? ResolvePostgresConnectionString()
{
    var url = Environment.GetEnvironmentVariable("AZURE_DATABASE_URL") ?? Environment.GetEnvironmentVariable("DATABASE_URL");
    if (!string.IsNullOrWhiteSpace(url))
    {
        try
        {
            var u = new Uri(url);
            var userInfo = u.UserInfo.Split(':', 2);
            var user = Uri.UnescapeDataString(userInfo[0]);
            var pwd = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
            var q = System.Web.HttpUtility.ParseQueryString(u.Query);
            var ssl = q["sslmode"] switch { "require" => "Require", "prefer" => "Prefer", "disable" => "Disable", _ => "Prefer" };
            return $"Host={u.Host};Port={(u.Port > 0 ? u.Port : 5432)};Database={u.AbsolutePath.TrimStart('/')};Username={user};Password={pwd};SSL Mode={ssl};Trust Server Certificate=true";
        }
        catch { /* fall through to PG* vars */ }
    }
    var host = Environment.GetEnvironmentVariable("PGHOST");
    if (string.IsNullOrWhiteSpace(host)) return null;
    var port = Environment.GetEnvironmentVariable("PGPORT") ?? "5432";
    var db = Environment.GetEnvironmentVariable("PGDATABASE") ?? "postgres";
    var pgUser = Environment.GetEnvironmentVariable("PGUSER") ?? "postgres";
    var pgPwd = Environment.GetEnvironmentVariable("PGPASSWORD") ?? "";
    var pgSsl = Environment.GetEnvironmentVariable("PGSSLMODE") switch { "require" => "Require", "prefer" => "Prefer", "disable" => "Disable", _ => "Prefer" };
    return $"Host={host};Port={port};Database={db};Username={pgUser};Password={pgPwd};SSL Mode={pgSsl};Trust Server Certificate=true";
}

// ---------- In-memory cache (used by DbEmployeesPlatinumIntegrationService) ----------
builder.Services.AddMemoryCache();

// ---------- Data Protection (session cookie encryption keys) ----------
// On Azure App Service, %HOME%\site persists across restarts and is shared
// across all instances of the same app, so keys survive deployments and
// scale-out. Locally, HOME is not set and we fall back to a temp path.
var dpKeysPath = Path.Combine(
    Environment.GetEnvironmentVariable("HOME") ?? Path.GetTempPath(),
    "site", "dataprotection-keys");
Directory.CreateDirectory(dpKeysPath);
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(dpKeysPath))
    .SetApplicationName("PlatinumOvertime");

// ---------- Session (server-side auth cookie for Platinum credentials) ----------
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(opts =>
{
    opts.IdleTimeout = TimeSpan.FromHours(8);
    opts.Cookie.HttpOnly  = true;
    opts.Cookie.SameSite  = SameSiteMode.None;  // cross-origin (Angular on different Azure subdomain)
    opts.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    opts.Cookie.IsEssential = true;
    opts.Cookie.Name = ".PlatinumOT.Session";
});

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

// ---------- Current-user identity (session-cookie auth) ----------
builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton<DevUserDirectory>();
// Login bypassed for this deployment: the dev service always reports
// IsAuthenticated=true, so SessionAuthFilter lets every request through and
// no login page is required. The X-User-Id header (if present) selects the
// dev persona; otherwise DevUserDirectory.Default is used.
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

builder.Services.AddMemoryCache();
builder.Services.AddControllers(opts =>
{
    // Enforce session authentication on every controller action globally.
    // Opt out on specific actions with [SkipSessionAuth].
    opts.Filters.Add<SessionAuthFilter>();
});

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
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<OvertimeDbContext>();
    // Migrations are only the source of truth for Postgres. SQL Server schema
    // is delivered via database/sqlserver/001_initial.sql and the DB user
    // typically lacks DDL permissions, so skip migrations on SQL Server.
    if (!string.Equals(dbProvider, "SqlServer", StringComparison.OrdinalIgnoreCase))
        db.Database.Migrate();

    var skipSeeding = builder.Configuration.GetValue<bool>("Seeding:SkipOnStartup");
    if (!app.Environment.IsDevelopment() || skipSeeding)
    {
        if (skipSeeding)
            Console.WriteLine("[Seeding] SkipOnStartup=true — skipping all dev data seeders.");
    }
    else
    {
        // Dev-only: ensure the legacy Payroll_* tables exist in Postgres and are
        // populated with the supplied datasets. No-op on SQL Server.
        var positionSeeder = scope.ServiceProvider.GetRequiredService<PositionDataSeeder>();
        await positionSeeder.SeedIfNeededAsync();

        var employeeSeeder = scope.ServiceProvider.GetRequiredService<EmployeeDataSeeder>();
        await employeeSeeder.SeedIfNeededAsync();


        // Legacy salary-head reference tables (Payroll_SalaryHead etc.) — dev only.
        var salaryHeadSeeder = scope.ServiceProvider.GetRequiredService<SalaryHeadDataSeeder>();
        await salaryHeadSeeder.SeedIfNeededAsync();

        // Legacy AAAA / Const_* / cycle-period / user reference tables — dev only.
        // Order respects logical FK ordering: Departments before Divisions,
        // Cycles before CyclePeriodDetails. No real DB FKs are added because
        // these are read-only projections.
        await scope.ServiceProvider.GetRequiredService<AAAAConfigSettingsSeeder>().SeedIfNeededAsync();
        await scope.ServiceProvider.GetRequiredService<ConstCycleSeeder>().SeedIfNeededAsync();
        await scope.ServiceProvider.GetRequiredService<ConstDepartmentSeeder>().SeedIfNeededAsync();
        await scope.ServiceProvider.GetRequiredService<ConstDivisionSeeder>().SeedIfNeededAsync();
        await scope.ServiceProvider.GetRequiredService<PayrollCyclePeriodDetailsSeeder>().SeedIfNeededAsync();
        await scope.ServiceProvider.GetRequiredService<UserUserDetailSeeder>().SeedIfNeededAsync();
        await scope.ServiceProvider.GetRequiredService<UserUserRoleSeeder>().SeedIfNeededAsync();
        await scope.ServiceProvider.GetRequiredService<SysRolePermissionSeeder>().SeedIfNeededAsync();
        await scope.ServiceProvider.GetRequiredService<PayrollEmployeeOvertimeSeeder>().SeedIfNeededAsync();
    }

    // Idempotent ALTER TABLE for OvertimeTransaction's new columns. Runs in
    // both dev (Postgres) and prod (SqlServer) so the schema upgrade ships
    // without an EF migration.
    var schemaUpgrader = scope.ServiceProvider.GetRequiredService<OvertimeCaptureSchemaUpgrader>();
    await schemaUpgrader.UpgradeAsync();
}

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseSerilogRequestLogging();
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors();
app.UseSession();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthorization();
app.MapControllers();

// Warm up the DevUserDirectory in the background so the first /api/me
// request after startup doesn't pay the ~200ms initialisation cost.
_ = Task.Run(() =>
{
    try { app.Services.GetRequiredService<DevUserDirectory>().All.Count.ToString(); }
    catch { /* non-critical — directory will still load lazily on first request */ }
});

app.Run();

/// <summary>Exposes the generated <c>Program</c> class so integration-test projects can reference it.</summary>
public partial class Program { }
