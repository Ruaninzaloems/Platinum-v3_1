using System.Text.Json;
using System.Text.Json.Serialization;
using Dapper;
using MssqlApi.Data;
using MssqlApi.Repositories;
using MssqlApi.Services;

SqlMapper.AddTypeHandler(new DateOnlyTypeHandler());
SqlMapper.AddTypeHandler(new NullableDateOnlyTypeHandler());

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
        options.JsonSerializerOptions.Converters.Add(new MssqlApi.Data.NullableBoolJsonConverter());
        options.JsonSerializerOptions.Converters.Add(new MssqlApi.Data.BoolJsonConverter());
    });

builder.Services.AddSingleton<DbConnectionFactory>();

builder.Services.AddScoped<IConstFundingSourceRepository, ConstFundingSourceRepository>();
builder.Services.AddScoped<IConstFundingSourceService, ConstFundingSourceService>();
builder.Services.AddScoped<IConsVendorRepository, ConsVendorRepository>();
builder.Services.AddScoped<IConsVendorService, ConsVendorService>();
builder.Services.AddScoped<IDepartmentRepository, DepartmentRepository>();
builder.Services.AddScoped<IDepartmentService, DepartmentService>();
builder.Services.AddScoped<IDivisionRepository, DivisionRepository>();
builder.Services.AddScoped<IDivisionService, DivisionService>();
builder.Services.AddScoped<IEmployeeRepository, EmployeeRepository>();
builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddScoped<IFundingSourceRepository, FundingSourceRepository>();
builder.Services.AddScoped<IFundingSourceService, FundingSourceService>();
builder.Services.AddScoped<IMonthRepository, MonthRepository>();
builder.Services.AddScoped<IMonthService, MonthService>();
builder.Services.AddScoped<IPlanProjectRepository, PlanProjectRepository>();
builder.Services.AddScoped<IPlanProjectService, PlanProjectService>();
builder.Services.AddScoped<IScmContractDetailItemsRepository, ScmContractDetailItemsRepository>();
builder.Services.AddScoped<IScmContractDetailItemsService, ScmContractDetailItemsService>();
builder.Services.AddScoped<IScmContractDetailsRepository, ScmContractDetailsRepository>();
builder.Services.AddScoped<IScmContractDetailsService, ScmContractDetailsService>();
builder.Services.AddScoped<IScmContractRepository, ScmContractRepository>();
builder.Services.AddScoped<IScmContractService, ScmContractService>();
builder.Services.AddScoped<IScmUnbundlingDetailRepository, ScmUnbundlingDetailRepository>();
builder.Services.AddScoped<IScmUnbundlingDetailService, ScmUnbundlingDetailService>();
builder.Services.AddScoped<IScmUnbundlingHeaderRepository, ScmUnbundlingHeaderRepository>();
builder.Services.AddScoped<IScmUnbundlingHeaderService, ScmUnbundlingHeaderService>();
builder.Services.AddScoped<ITownRepository, TownRepository>();
builder.Services.AddScoped<ITownService, TownService>();
builder.Services.AddScoped<IUnitOfIssueRepository, UnitOfIssueRepository>();
builder.Services.AddScoped<IUnitOfIssueService, UnitOfIssueService>();

builder.Services.AddScoped<IBuildingService, BuildingService>();
builder.Services.AddScoped<ICommodityService, CommodityService>();
builder.Services.AddScoped<IDocumentTypeService, DocumentTypeService>();
builder.Services.AddScoped<IFinYearService, FinYearService>();
builder.Services.AddScoped<IFloorService, FloorService>();
builder.Services.AddScoped<IInvTransferService, InvTransferService>();
builder.Services.AddScoped<ILedVoteService, LedVoteService>();
builder.Services.AddScoped<IPropertyTypeOfUseService, PropertyTypeOfUseService>();
builder.Services.AddScoped<IRoomService, RoomService>();
builder.Services.AddScoped<IScoaStructureService, ScoaStructureService>();
builder.Services.AddScoped<IScmInvoiceService, ScmInvoiceService>();
builder.Services.AddScoped<IScmInvoiceDetailService, ScmInvoiceDetailService>();
builder.Services.AddScoped<IScmTransferService, ScmTransferService>();
builder.Services.AddScoped<IStreetService, StreetService>();
builder.Services.AddScoped<ISuburbService, SuburbService>();
builder.Services.AddScoped<IUserProcessingMonthService, UserProcessingMonthService>();
builder.Services.AddScoped<IWardService, WardService>();
builder.Services.AddScoped<IGlOutboxService, GlOutboxService>();
builder.Services.AddScoped<IGlOutboxLineService, GlOutboxLineService>();
builder.Services.AddScoped<IAssetConfigEventTypeService, AssetConfigEventTypeService>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Mnquma Asset Management SQL Server Bridge API", Version = "v1" });
    c.CustomSchemaIds(type => type.FullName);
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Mnquma Asset Management SQL Server Bridge API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors();
app.UseRouting();
app.MapControllers();

app.Urls.Add("http://0.0.0.0:3001");

app.Run();
