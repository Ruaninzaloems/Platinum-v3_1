using System.Text.Json;
using System.Text.Json.Serialization;
using System.Globalization;
using System.Diagnostics;
using AssetManagement.Data;
using AssetManagement.Middleware;

void StartBackgroundService(string workDir, string cmd, string args2)
{
    try
    {
        var psi = new ProcessStartInfo
        {
            FileName = cmd,
            Arguments = args2,
            WorkingDirectory = workDir,
            UseShellExecute = false,
            RedirectStandardOutput = false,
            RedirectStandardError = false,
            CreateNoWindow = true
        };
        Process.Start(psi);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[StartBackgroundService] Failed to start {cmd} {args2}: {ex.Message}");
    }
}

// Dev-only: spawn sibling services so a single Replit workflow boots the
// whole local stack. In production (Azure App Service) each service runs
// in its own Web App, so we must NOT spawn child processes here.
var spawnSiblings = string.Equals(
    Environment.GetEnvironmentVariable("SPAWN_SIBLING_SERVICES"),
    "true",
    StringComparison.OrdinalIgnoreCase);

if (spawnSiblings)
{
    var workspace = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    StartBackgroundService(workspace, "/bin/bash", "-c \"PORT=3004 AFS-UI/api/node_modules/.bin/tsx AFS-UI/api/index.ts\"");
    StartBackgroundService(workspace, "/bin/bash", "-c \"cd POS-API && PORT=3003 npx tsx index.ts\"");
    StartBackgroundService(workspace, "/bin/bash", "-c \"cd PAYROLL-APP && PORT=6000 node src/server/index.js\"");
    StartBackgroundService(workspace, "/bin/bash", "-c \"cd IDP-UI/PlatinumIDP && dotnet run\"");
    StartBackgroundService(workspace, "/bin/bash", "-c \"cd SCM-UI && NG_CLI_ANALYTICS=false npx ng serve --host 0.0.0.0 --port 4200 --proxy-config proxy.conf.json --serve-path /scm-app/\"");
    StartBackgroundService(workspace, "/bin/bash", "-c \"cd AFS-UI/client && NG_CLI_ANALYTICS=false npx ng serve --host 0.0.0.0 --port 8000 --proxy-config proxy.conf.json --serve-path /afs-app/\"");
    StartBackgroundService(workspace, "/bin/bash", "-c \"cd ASSETS-UI && NG_CLI_ANALYTICS=false npx ng serve --host 0.0.0.0 --port 5000 --proxy-config proxy.conf.json\"");

    Console.WriteLine("[Backend API] Background sibling services launched (SPAWN_SIBLING_SERVICES=true).");
}
else
{
    Console.WriteLine("[Backend API] Sibling spawning disabled (set SPAWN_SIBLING_SERVICES=true to enable for local dev).");
}

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(10);
    options.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(10);
});

builder.Services.AddControllers(options =>
    {
        options.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true;
    })
    .ConfigureApiBehaviorOptions(options =>
    {
        options.SuppressModelStateInvalidFilter = true;
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.Converters.Add(new FlexibleDateTimeConverter());
        options.JsonSerializerOptions.Converters.Add(new FlexibleNullableDateTimeConverter());
    });

builder.Services.AddSingleton<DbConnectionFactory>();
builder.Services.AddSingleton<AssetManagement.Services.TransactionService>();
builder.Services.AddSingleton<AssetManagement.Services.PriorYearCalculationService>();
builder.Services.AddTransient<AssetManagement.Services.BulkUploadValidationService>();
builder.Services.AddScoped<AssetManagement.Services.LookupService>();
builder.Services.AddScoped<AssetManagement.Services.ScmInvoiceService>();
builder.Services.AddScoped<AssetManagement.Services.ScmUnbundlingService>();
builder.Services.AddScoped<AssetManagement.Services.LocationService>();
builder.Services.AddHttpClient("internal", client => { client.BaseAddress = new Uri("http://localhost:3000"); client.Timeout = TimeSpan.FromMinutes(10); });
var mssqlApiBaseUrl = builder.Configuration["MssqlApi:BaseUrl"] ?? "http://localhost:3001";
builder.Services.AddHttpClient("mssql-api", client => { client.BaseAddress = new Uri(mssqlApiBaseUrl); client.Timeout = TimeSpan.FromMinutes(5); });
builder.Services.AddScoped<AssetManagement.Services.InternalApiClient>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var corsOrigins = (Environment.GetEnvironmentVariable("CORS_ORIGINS") ?? "")
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (corsOrigins.Length > 0)
        {
            policy.WithOrigins(corsOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
        else
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Mnquma Asset Management API", Version = "v1" });
    c.CustomSchemaIds(type => type.FullName);
});

var app = builder.Build();

app.Use(async (context, next) =>
{
    context.Request.EnableBuffering();
    if (context.Request.Path.Value != null &&
        context.Request.Path.Value.Contains("asset-impairment", StringComparison.OrdinalIgnoreCase) &&
        context.Request.Method == "POST")
    {
        using var reader = new StreamReader(context.Request.Body, leaveOpen: true);
        var body = await reader.ReadToEndAsync();
        context.Request.Body.Position = 0;
        var logger = context.RequestServices.GetRequiredService<ILoggerFactory>().CreateLogger("RequestDebug");
        logger.LogWarning("POST asset-impairments raw body: {Body}", body);
        logger.LogWarning("Content-Type: {ContentType}", context.Request.ContentType);
    }
    await next();
});

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Mnquma Asset Management API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors();
app.UseMiddleware<ErrorHandlerMiddleware>();
app.UseRouting();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DbConnectionFactory>();
    await db.InitializeAsync();
}

// Bind URL: prefer ASPNETCORE_URLS (Azure-friendly), then PORT env var,
// finally fall back to the legacy local dev port 3000.
var aspUrls = Environment.GetEnvironmentVariable("ASPNETCORE_URLS");
if (string.IsNullOrWhiteSpace(aspUrls))
{
    var portEnv = Environment.GetEnvironmentVariable("PORT");
    var bindPort = !string.IsNullOrWhiteSpace(portEnv) ? portEnv : "3000";
    app.Urls.Add($"http://0.0.0.0:{bindPort}");
}

app.Run();
