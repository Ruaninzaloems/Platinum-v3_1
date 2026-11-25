using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;
using Serilog;
using SCM_API.Data;
using SCM_API.Middleware;
using SCM_API.Services;
using SCM_API.Extensions;

// ---------- Global App Settings (../.env) ----------
// Loads the monorepo-root .env (see .env.example) into this process's
// environment before configuration binds, so connection strings and the
// shared PLATINUM_JWT_SECRET live in one file instead of duplicated across
// every module's own config. A real environment variable (Azure App
// Setting, CI, an explicit export) always wins — this only fills in what
// isn't already set. No-ops in production/publish, where no .env exists.
static void LoadRootEnv()
{
    var envPath = Path.Combine(Directory.GetCurrentDirectory(), "..", ".env");
    if (!File.Exists(envPath)) return;
    foreach (var line in File.ReadAllLines(envPath))
    {
        var trimmed = line.Trim();
        if (trimmed.Length == 0 || trimmed.StartsWith('#')) continue;
        var idx = trimmed.IndexOf('=');
        if (idx <= 0) continue;
        var key = trimmed[..idx].Trim();
        var value = trimmed[(idx + 1)..].Trim();
        if (Environment.GetEnvironmentVariable(key) is null)
            Environment.SetEnvironmentVariable(key, value);
    }
}
LoadRootEnv();

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .Enrich.WithMachineName()
        .Enrich.WithThreadId());

    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
            options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
            options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        });

    builder.Services.AddDbContext<ApplicationDbContext>(options =>
    {
        var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
        if (!string.IsNullOrEmpty(connectionString) && !connectionString.Contains("Connection Timeout", StringComparison.OrdinalIgnoreCase))
            connectionString += ";Connection Timeout=5";
        options.UseSqlServer(connectionString, sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(1, TimeSpan.FromSeconds(3), null);
            sqlOptions.CommandTimeout(10);
        });
        if (builder.Environment.IsDevelopment())
        {
            options.EnableSensitiveDataLogging();
            options.EnableDetailedErrors();
        }
    });

    // Dual-accept, transitional (platform-wide "POS-API as global auth" rollout,
    // SCM migrates last): SCM keeps validating its own existing JWT (own issuer/
    // audience/key, own /auth/login) AND now also accepts POS-API's global JWT
    // (issuer PlatinumPOS / audience Platinum-Suite, shared PLATINUM_JWT_SECRET)
    // — either signature is accepted, matched against either key. SCM keeps
    // resolving scm_perms itself from the verified NameIdentifier claim via its
    // own SecurityRepository/DB lookup (both token shapes carry a NameIdentifier
    // for the same real EMS_GeorgeUAT user, so this needs no change here).
    // Retiring SCM's own /auth/login + the shell's bridgeScmAuth() in favour of
    // POS-API's token exclusively is a separate, later cleanup milestone — not
    // part of this rollout.
    var scmJwtKey = builder.Configuration["Jwt:Key"] ?? "PlatinumSCM-Default-Key-Minimum-32-Characters-Long";
    // Outside Development, a missing PLATINUM_JWT_SECRET means the global key is
    // simply NOT accepted (SCM keeps working on its own JWT) — never fall back
    // to the public dev literal, which would let anyone forge a global token.
    var globalJwtKey = Environment.GetEnvironmentVariable("PLATINUM_JWT_SECRET")
        ?? (builder.Environment.IsDevelopment() ? "platinum-local-dev-jwt-secret-change-in-production" : null);
    var signingKeys = new List<SecurityKey> { new SymmetricSecurityKey(Encoding.UTF8.GetBytes(scmJwtKey)) };
    if (!string.IsNullOrEmpty(globalJwtKey))
        signingKeys.Add(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(globalJwtKey)));
    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.MapInboundClaims = true; // standard "sub"/"name"/... JWT claims -> ClaimTypes.*
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuers = new[] { builder.Configuration["Jwt:Issuer"], "PlatinumPOS" },
                ValidAudiences = new[] { builder.Configuration["Jwt:Audience"], "Platinum-Suite" },
                IssuerSigningKeys = signingKeys,
            };
        });
    builder.Services.AddAuthorization();

    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
        var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
        if (File.Exists(xmlPath)) c.IncludeXmlComments(xmlPath);
    });

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAll", policy =>
        {
            policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()
                .WithExposedHeaders("X-Correlation-Id");
        });
    });

    builder.Services.AddSingleton<PerformanceMetricsService>();
    builder.Services.AddApplicationServices();

    builder.Services.AddHealthChecks();

    var app = builder.Build();

    app.UseMiddleware<CorrelationIdMiddleware>();
    app.UseMiddleware<ExceptionHandlingMiddleware>();
    app.UseMiddleware<RequestLoggingMiddleware>();
    app.UseMiddleware<PerformanceMonitoringMiddleware>();

    app.UseCors("AllowAll");

    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Platinum SCM API v1");
        c.RoutePrefix = "swagger";
    });

    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();

    Log.Information("Platinum SCM API starting on port 3001");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
