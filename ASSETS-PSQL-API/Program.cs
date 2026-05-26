using AssetManagement.Data;
using AssetManagement.Middleware;
using System.Text.Json;
using System.Text.Json.Serialization;

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
builder.Services.AddScoped<AssetManagement.Services.EmailService>();
builder.Services.AddScoped<AssetManagement.Services.LocationService>();
builder.Services.AddHttpClient("internal", client => { client.BaseAddress = new Uri("http://localhost:3000"); client.Timeout = TimeSpan.FromMinutes(10); });
var mssqlApiBaseUrl = builder.Configuration["MssqlApi:BaseUrl"] ?? "http://localhost:3001";
builder.Services.AddHttpClient("mssql-api", client => { client.BaseAddress = new Uri(mssqlApiBaseUrl); client.Timeout = TimeSpan.FromMinutes(5); });
builder.Services.AddScoped<AssetManagement.Services.InternalApiClient>();
builder.Services.AddScoped<AssetManagement.Services.LedGeneralLedgerService>();

builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<Microsoft.AspNetCore.ResponseCompression.GzipCompressionProvider>();
});
builder.Services.Configure<Microsoft.AspNetCore.ResponseCompression.GzipCompressionProviderOptions>(options =>
{
    options.Level = System.IO.Compression.CompressionLevel.Fastest;
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
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

app.UseResponseCompression();
app.UseCors();
app.UseMiddleware<ErrorHandlerMiddleware>();
app.UseRouting();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DbConnectionFactory>();
    await db.InitializeAsync();
}



var port = Environment.GetEnvironmentVariable("PORT") ?? "3000";
app.Urls.Add($"http://0.0.0.0:{port}");

app.Run();
