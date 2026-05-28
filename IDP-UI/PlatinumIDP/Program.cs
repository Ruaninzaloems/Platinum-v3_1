using Microsoft.EntityFrameworkCore;
using PlatinumIDP.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

var databaseUrl = Environment.GetEnvironmentVariable("AZURE_DATABASE_URL") ?? Environment.GetEnvironmentVariable("DATABASE_URL");
if (string.IsNullOrEmpty(databaseUrl))
{
    throw new InvalidOperationException("Neither AZURE_DATABASE_URL nor DATABASE_URL environment variable is set");
}

var dbProvider = Environment.GetEnvironmentVariable("DB_PROVIDER")?.ToLower() ?? "auto";

string connectionString;
bool useSqlServer;

if (dbProvider == "sqlserver")
{
    connectionString = databaseUrl;
    useSqlServer = true;
}
else if (dbProvider == "postgres" || databaseUrl.StartsWith("postgresql://") || databaseUrl.StartsWith("postgres://"))
{
    if (databaseUrl.StartsWith("postgresql://") || databaseUrl.StartsWith("postgres://"))
    {
        var uri = new Uri(databaseUrl);
        var userInfo = uri.UserInfo.Split(':');
        var host = uri.Host;
        var port = uri.Port > 0 ? uri.Port : 5432;
        var database = uri.AbsolutePath.TrimStart('/');
        var query = System.Web.HttpUtility.ParseQueryString(uri.Query);
        var sslMode = query["sslmode"] ?? "Prefer";
        connectionString = $"Host={host};Port={port};Database={database};Username={Uri.UnescapeDataString(userInfo[0])};Password={Uri.UnescapeDataString(userInfo[1])};SSL Mode={sslMode};Trust Server Certificate=true";
    }
    else
    {
        connectionString = databaseUrl;
    }
    useSqlServer = false;
}
else if (databaseUrl.Contains("Server=") || databaseUrl.Contains("Data Source=") || databaseUrl.Contains("Initial Catalog="))
{
    connectionString = databaseUrl;
    useSqlServer = true;
}
else
{
    connectionString = databaseUrl;
    useSqlServer = false;
}

builder.Services.AddDbContext<IdpDbContext>((serviceProvider, options) =>
{
    if (useSqlServer)
    {
        options.UseSqlServer(connectionString);
    }
    else
    {
        options.UseNpgsql(connectionString);
    }
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "Platinum ERP - IDP Management API",
        Version = "v1",
        Description = "MSCOA-compliant IDP Management Module API for George Municipality"
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<IdpDbContext>();
    await db.Database.EnsureCreatedAsync();
    await SeedData.Initialize(db);
}

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Platinum ERP - IDP API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("AllowAngular");
app.MapControllers();

var idpPort = Environment.GetEnvironmentVariable("PORT") ?? "8008";
app.Run($"http://0.0.0.0:{idpPort}");
