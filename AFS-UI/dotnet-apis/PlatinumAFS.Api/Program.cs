using Microsoft.EntityFrameworkCore;
using PlatinumAFS.Api.Data;
using PlatinumAFS.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<PlatinumDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("PlatinumDb")));

builder.Services.AddScoped<TrialBalanceService>();
builder.Services.AddScoped<GeneralLedgerService>();
builder.Services.AddScoped<DocumentService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Platinum AFS - EMS Data API",
        Version = "v1",
        Description = "Unified API for accessing Trial Balance, General Ledger, and Document data from the " +
                      "Platinum EMS SQL Server database (EMS_GeorgeUAT). " +
                      "Queries Platinum tables DIRECTLY — NO SQL VIEWS. " +
                      "Trial Balance: Led_Vote, Led_Vote_OpeningBalance, Led_GeneralLedger (aggregated), " +
                      "Led_VoteBudgetOriginal_Header, Led_VoteBudgetAdjustment_Header, " +
                      "Const_SCOA_Structure (hierarchy for TB categories), and all 5 SCOA segment tables. " +
                      "General Ledger: Led_GeneralLedger, Led_Vote, Const_SCOA_Structure, and all 5 SCOA segment tables. " +
                      "Documents: Source document register, drill-down, related document tracing, " +
                      "audit sampling (MUS, random, stratified, top-N), and EMS schema discovery. " +
                      "Provides TB with opening balances, budgets, closing balances, and prior year comparatives; " +
                      "GL with full transaction detail and mSCOA segment resolution; " +
                      "Document API with audit sample selection for substantive testing."
    });
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader()
              .WithExposedHeaders("X-Total-Count", "X-Page", "X-Page-Size");
    });
});

var app = builder.Build();

app.UseDeveloperExceptionPage();
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Platinum AFS - EMS Data API v1");
    c.RoutePrefix = string.Empty;
    c.InjectStylesheet("/swagger-ui/dark-theme.css");
    c.DocumentTitle = "Platinum AFS - EMS Data API";
});

app.UseCors();

// Serve the dark theme CSS as a static file via a minimal API endpoint
app.MapGet("/swagger-ui/dark-theme.css", () =>
{
    const string css = """
        /* ── Base & background ── */
        body, .swagger-ui { background-color: #1a1a2e !important; color: #e0e0e0 !important; }
        .swagger-ui .topbar { background-color: #0f0f1a !important; border-bottom: 1px solid #3a3a5c; }
        .swagger-ui .topbar .download-url-wrapper input[type=text] {
            background: #2a2a4a; border-color: #4a4a7a; color: #e0e0e0;
        }
        .swagger-ui .topbar a { color: #a0c4ff !important; }

        /* ── Info block ── */
        .swagger-ui .info { background: #16213e; padding: 20px; border-radius: 8px; border: 1px solid #2a2a5a; }
        .swagger-ui .info .title,
        .swagger-ui .info h1, .swagger-ui .info h2, .swagger-ui .info h3 { color: #a0c4ff !important; }
        .swagger-ui .info p, .swagger-ui .info li, .swagger-ui .info table { color: #c0c0e0 !important; }

        /* ── Operation blocks ── */
        .swagger-ui .opblock { background: #16213e !important; border-color: #2a2a5a !important; border-radius: 6px; margin-bottom: 8px; }
        .swagger-ui .opblock .opblock-summary { border-color: #2a2a5a !important; }
        .swagger-ui .opblock .opblock-summary-description { color: #c0c0e0 !important; }
        .swagger-ui .opblock .opblock-body { background: #1e1e3a !important; }
        .swagger-ui .opblock-section-header { background: #222244 !important; border-color: #3a3a6a !important; }
        .swagger-ui .opblock-section-header label,
        .swagger-ui .opblock-section-header h4 { color: #a0c4ff !important; }

        /* ── HTTP method verb colours ── */
        .swagger-ui .opblock.opblock-get    { border-left: 3px solid #61affe !important; background: #0d1b2a !important; }
        .swagger-ui .opblock.opblock-post   { border-left: 3px solid #49cc90 !important; background #0d2a1b !important; }
        .swagger-ui .opblock.opblock-put    { border-left: 3px solid #fca130 !important; background: #2a1a0d !important; }
        .swagger-ui .opblock.opblock-delete { border-left: 3px solid #f93e3e !important; background: #2a0d0d !important; }
        .swagger-ui .opblock.opblock-patch  { border-left: 3px solid #50e3c2 !important; background: #0d2a25 !important; }

        .swagger-ui .opblock-get    .opblock-summary-method { background: #1e4a7a !important; }
        .swagger-ui .opblock-post   .opblock-summary-method { background: #1a5c3a !important; }
        .swagger-ui .opblock-put    .opblock-summary-method { background: #5c3a0d !important; }
        .swagger-ui .opblock-delete .opblock-summary-method { background: #5c0d0d !important; }
        .swagger-ui .opblock-patch  .opblock-summary-method { background: #0d4a3a !important; }

        /* ── Tags / group headers ── */
        .swagger-ui .opblock-tag { border-color: #2a2a5a !important; color: #a0c4ff !important; }
        .swagger-ui .opblock-tag:hover { background: #1e1e3a !important; }
        .swagger-ui .opblock-tag small { color: #8080c0 !important; }

        /* ── Models / schemas ── */
        .swagger-ui section.models { background: #16213e; border: 1px solid #2a2a5a; border-radius: 6px; }
        .swagger-ui section.models h4 { color: #a0c4ff !important; }
        .swagger-ui .model-box { background: #1e1e3a !important; }
        .swagger-ui .model .property.primitive { color: #c0c0e0 !important; }
        .swagger-ui .model-title { color: #a0c4ff !important; }
        .swagger-ui .prop-type { color: #49cc90 !important; }
        .swagger-ui .prop-format { color: #fca130 !important; }

        /* ── Tables ── */
        .swagger-ui table thead tr td, .swagger-ui table thead tr th { color: #a0c4ff !important; border-color: #2a2a5a !important; }
        .swagger-ui table tbody tr td { color: #c0c0e0 !important; border-color: #2a2a5a !important; }

        /* ── Parameters & inputs ── */
        .swagger-ui .parameters-col_description p { color: #c0c0e0 !important; }
        .swagger-ui .parameter__name { color: #a0c4ff !important; }
        .swagger-ui .parameter__type  { color: #49cc90 !important; }
        .swagger-ui input[type=text], .swagger-ui textarea, .swagger-ui select {
            background: #2a2a4a !important; color: #e0e0e0 !important;
            border-color: #4a4a7a !important; border-radius: 4px;
        }
        .swagger-ui input[type=text]::placeholder, .swagger-ui textarea::placeholder { color: #6060a0 !important; }

        /* ── Buttons ── */
        .swagger-ui .btn { border-radius: 4px !important; }
        .swagger-ui .btn.execute { background: #3a5a9a !important; border-color: #5a7aba !important; color: #fff !important; }
        .swagger-ui .btn.execute:hover { background: #4a6aaa !important; }
        .swagger-ui .btn.cancel { background: #5c2a2a !important; border-color: #7a4a4a !important; color: #fff !important; }
        .swagger-ui .btn.authorize { background: #1a4a2a !important; border-color: #2a6a3a !important; color: #49cc90 !important; }
        .swagger-ui .btn.try-out__btn { background: #2a2a5a !important; border-color: #4a4a8a !important; color: #a0c4ff !important; }

        /* ── Response / code blocks ── */
        .swagger-ui .responses-inner { background: #1a1a3a !important; }
        .swagger-ui .response-col_status { color: #a0c4ff !important; }
        .swagger-ui .response-col_description p { color: #c0c0e0 !important; }
        .swagger-ui .highlight-code { background: #0d0d1a !important; border-radius: 4px; }
        .swagger-ui .microlight { background: #0d0d1a !important; color: #c0c0e0 !important; }

        /* ── Scheme / server selector ── */
        .swagger-ui .scheme-container { background: #16213e !important; border-color: #2a2a5a !important; box-shadow: none !important; }
        .swagger-ui .schemes > label { color: #a0c4ff !important; }

        /* ── Scrollbar ── */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #1a1a2e; }
        ::-webkit-scrollbar-thumb { background: #3a3a6a; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #5a5a8a; }
    """;

    return Results.Content(css, "text/css");
});

app.MapControllers();
app.Run();
