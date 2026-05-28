using Microsoft.EntityFrameworkCore;
using PlatinumBudget.Api.Data;
using PlatinumBudget.Api.Services;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Platinum Budget Management API", Version = "v1" });
});

var databaseUrl = Environment.GetEnvironmentVariable("AZURE_DATABASE_URL") ?? Environment.GetEnvironmentVariable("DATABASE_URL") ?? "";
string connectionString;
if (databaseUrl.StartsWith("postgresql://") || databaseUrl.StartsWith("postgres://"))
{
    var uri = new Uri(databaseUrl);
    var userInfo = uri.UserInfo.Split(':');
    var host = uri.Host;
    var port = uri.Port > 0 ? uri.Port : 5432;
    var database = uri.AbsolutePath.TrimStart('/');
    var query = System.Web.HttpUtility.ParseQueryString(uri.Query);
    var sslMode = query["sslmode"] ?? "disable";
    connectionString = $"Host={host};Port={port};Database={database};Username={Uri.UnescapeDataString(userInfo[0])};Password={Uri.UnescapeDataString(userInfo[1])};SSL Mode={sslMode switch { "disable" => "Disable", "require" => "Require", "prefer" => "Prefer", _ => "Disable" }};Trust Server Certificate=true";
}
else
{
    connectionString = databaseUrl;
}
builder.Services.AddDbContext<BudgetDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddScoped<AuditService>();
builder.Services.AddScoped<PlanningSpService>();
builder.Services.AddScoped<BudgetVersionService>();
builder.Services.AddScoped<BudgetStringService>();
builder.Services.AddScoped<ValidationService>();
builder.Services.AddScoped<VirementService>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddScoped<AiInsightsService>();
builder.Services.AddScoped<TariffModellingService>();
builder.Services.AddScoped<RevenueProjectionService>();
builder.Services.AddScoped<RebateProjectionService>();
builder.Services.AddScoped<BillingBudgetStringService>();
builder.Services.AddScoped<ExpenditureModellingService>();
builder.Services.AddScoped<ExpenditureProjectionService>();
builder.Services.AddScoped<CreditorLiabilityService>();
builder.Services.AddScoped<CreditorsBudgetStringService>();
builder.Services.AddScoped<HrPayrollCalculationService>();
builder.Services.AddScoped<StatutoryDeductionService>();
builder.Services.AddScoped<DefinedBenefitService>();
builder.Services.AddScoped<PayrollScenarioService>();
builder.Services.AddScoped<HrPayrollBudgetStringService>();
builder.Services.AddScoped<EmsProjectService>();
builder.Services.AddScoped<EmsBudgetVersionService>();
builder.Services.AddScoped<EmsBudgetConsumptionService>();
builder.Services.AddScoped<EmsVirementService>();
builder.Services.AddScoped<EmsNTValidationService>();
builder.Services.AddHttpClient();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BudgetDbContext>();
    await db.Database.EnsureCreatedAsync();
    await db.Database.ExecuteSqlRawAsync(@"ALTER TABLE ""Projects"" ADD COLUMN IF NOT EXISTS ""IsRegistered"" BOOLEAN NOT NULL DEFAULT FALSE;");

    var createCreditorsTablesSql = @"
        CREATE TABLE IF NOT EXISTS ""ExpenditureCategories"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""Code"" TEXT NOT NULL,
            ""Name"" TEXT NOT NULL,
            ""Type"" TEXT NOT NULL DEFAULT 'EmployeeCosts',
            ""Department"" TEXT,
            ""MeasurementUnit"" TEXT NOT NULL DEFAULT '',
            ""IsActive"" BOOLEAN NOT NULL DEFAULT TRUE,
            ""CreatedBy"" TEXT NOT NULL DEFAULT 'system',
            ""CreatedOn"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS ""IX_ExpenditureCategories_Code"" ON ""ExpenditureCategories"" (""Code"");
        CREATE TABLE IF NOT EXISTS ""CostItems"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""ExpenditureCategoryId"" INTEGER NOT NULL REFERENCES ""ExpenditureCategories""(""Id""),
            ""Name"" TEXT NOT NULL,
            ""ItemType"" TEXT NOT NULL DEFAULT 'Recurring',
            ""BasicCost"" NUMERIC NOT NULL DEFAULT 0,
            ""UnitRate"" NUMERIC NOT NULL DEFAULT 0,
            ""VatIndicator"" TEXT NOT NULL DEFAULT 'StandardRated',
            ""BlockStart"" NUMERIC,
            ""BlockEnd"" NUMERIC,
            ""EffectiveFrom"" TIMESTAMP WITH TIME ZONE NOT NULL,
            ""EffectiveTo"" TIMESTAMP WITH TIME ZONE,
            ""IsApproved"" BOOLEAN NOT NULL DEFAULT FALSE,
            ""FinancialYearId"" INTEGER NOT NULL REFERENCES ""FinancialYears""(""Id""),
            ""SupplierName"" TEXT,
            ""SupplierVatNumber"" TEXT,
            ""ContractReference"" TEXT,
            ""IsVariabilityFlagged"" BOOLEAN NOT NULL DEFAULT FALSE,
            ""VariabilityType"" TEXT,
            ""CreatedBy"" TEXT NOT NULL DEFAULT 'system',
            ""CreatedOn"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            ""ModifiedBy"" TEXT,
            ""ModifiedOn"" TIMESTAMP WITH TIME ZONE
        );
        CREATE TABLE IF NOT EXISTS ""ExpenditureScenarios"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""Name"" TEXT NOT NULL,
            ""Description"" TEXT,
            ""FinancialYearId"" INTEGER NOT NULL REFERENCES ""FinancialYears""(""Id""),
            ""Status"" TEXT NOT NULL DEFAULT 'Draft',
            ""BaseInflationPercent"" NUMERIC NOT NULL DEFAULT 0,
            ""DemandAdjustmentPercent"" NUMERIC,
            ""Justification"" TEXT,
            ""CreatedBy"" TEXT NOT NULL DEFAULT 'system',
            ""CreatedOn"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            ""ApprovedBy"" TEXT,
            ""ApprovedOn"" TIMESTAMP WITH TIME ZONE
        );
        CREATE TABLE IF NOT EXISTS ""ExpenditureScenarioLines"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""ExpenditureScenarioId"" INTEGER NOT NULL REFERENCES ""ExpenditureScenarios""(""Id"") ON DELETE CASCADE,
            ""ExpenditureCategoryId"" INTEGER NOT NULL REFERENCES ""ExpenditureCategories""(""Id"") ON DELETE RESTRICT,
            ""BaseCostItemId"" INTEGER REFERENCES ""CostItems""(""Id""),
            ""CurrentUnitRate"" NUMERIC NOT NULL DEFAULT 0,
            ""CurrentBasicCost"" NUMERIC NOT NULL DEFAULT 0,
            ""ProjectedUnitRate"" NUMERIC NOT NULL DEFAULT 0,
            ""ProjectedBasicCost"" NUMERIC NOT NULL DEFAULT 0,
            ""InflationPercent"" NUMERIC NOT NULL DEFAULT 0,
            ""DemandAdjustmentPercent"" NUMERIC NOT NULL DEFAULT 0,
            ""CurrentExpenditure"" NUMERIC NOT NULL DEFAULT 0,
            ""ProjectedExpenditure"" NUMERIC NOT NULL DEFAULT 0,
            ""VarianceAmount"" NUMERIC NOT NULL DEFAULT 0,
            ""VariancePercent"" NUMERIC NOT NULL DEFAULT 0,
            ""IsMaterialShift"" BOOLEAN NOT NULL DEFAULT FALSE
        );
        CREATE TABLE IF NOT EXISTS ""CreditorCategories"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""Name"" TEXT NOT NULL,
            ""Type"" TEXT NOT NULL DEFAULT 'Current',
            ""PaymentTermDays"" INTEGER NOT NULL DEFAULT 30,
            ""InterestRate"" NUMERIC,
            ""ChargesInterest"" BOOLEAN NOT NULL DEFAULT FALSE,
            ""InterestCalculationMethod"" TEXT,
            ""IsActive"" BOOLEAN NOT NULL DEFAULT TRUE,
            ""CreatedBy"" TEXT NOT NULL DEFAULT 'system',
            ""CreatedOn"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS ""CreditorCategoryItems"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""CreditorCategoryId"" INTEGER NOT NULL REFERENCES ""CreditorCategories""(""Id"") ON DELETE CASCADE,
            ""ExpenditureCategoryId"" INTEGER NOT NULL REFERENCES ""ExpenditureCategories""(""Id"") ON DELETE CASCADE,
            ""PaymentRate30Days"" NUMERIC NOT NULL DEFAULT 0,
            ""PaymentRate60Days"" NUMERIC NOT NULL DEFAULT 0,
            ""PaymentRate90Days"" NUMERIC NOT NULL DEFAULT 0,
            ""PaymentRateOver90Days"" NUMERIC NOT NULL DEFAULT 0,
            UNIQUE (""CreditorCategoryId"", ""ExpenditureCategoryId"")
        );
        CREATE TABLE IF NOT EXISTS ""ExpenditureProjections"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""FinancialYearId"" INTEGER NOT NULL REFERENCES ""FinancialYears""(""Id""),
            ""BudgetVersionId"" INTEGER REFERENCES ""BudgetVersions""(""Id""),
            ""ExpenditureCategoryId"" INTEGER NOT NULL REFERENCES ""ExpenditureCategories""(""Id"") ON DELETE RESTRICT,
            ""CostItemId"" INTEGER REFERENCES ""CostItems""(""Id""),
            ""ExpenditureScenarioId"" INTEGER REFERENCES ""ExpenditureScenarios""(""Id""),
            ""UnitRate"" NUMERIC NOT NULL DEFAULT 0,
            ""BasicCost"" NUMERIC NOT NULL DEFAULT 0,
            ""GrossExpenditure"" NUMERIC NOT NULL DEFAULT 0,
            ""VatAmount"" NUMERIC NOT NULL DEFAULT 0,
            ""NetExpenditure"" NUMERIC NOT NULL DEFAULT 0,
            ""Year1Amount"" NUMERIC NOT NULL DEFAULT 0,
            ""Year2Amount"" NUMERIC NOT NULL DEFAULT 0,
            ""Year3Amount"" NUMERIC NOT NULL DEFAULT 0,
            ""Month01"" NUMERIC NOT NULL DEFAULT 0, ""Month02"" NUMERIC NOT NULL DEFAULT 0,
            ""Month03"" NUMERIC NOT NULL DEFAULT 0, ""Month04"" NUMERIC NOT NULL DEFAULT 0,
            ""Month05"" NUMERIC NOT NULL DEFAULT 0, ""Month06"" NUMERIC NOT NULL DEFAULT 0,
            ""Month07"" NUMERIC NOT NULL DEFAULT 0, ""Month08"" NUMERIC NOT NULL DEFAULT 0,
            ""Month09"" NUMERIC NOT NULL DEFAULT 0, ""Month10"" NUMERIC NOT NULL DEFAULT 0,
            ""Month11"" NUMERIC NOT NULL DEFAULT 0, ""Month12"" NUMERIC NOT NULL DEFAULT 0,
            ""Status"" TEXT NOT NULL DEFAULT 'Draft',
            ""ScoaItemId"" INTEGER REFERENCES ""ScoaItems""(""Id""),
            ""ScoaFundId"" INTEGER REFERENCES ""ScoaFunds""(""Id""),
            ""ScoaFunctionId"" INTEGER REFERENCES ""ScoaFunctions""(""Id""),
            ""ScoaRegionId"" INTEGER REFERENCES ""ScoaRegions""(""Id""),
            ""ScoaCostingId"" INTEGER REFERENCES ""ScoaCostings""(""Id""),
            ""ApprovedBy"" TEXT,
            ""ApprovedOn"" TIMESTAMP WITH TIME ZONE,
            ""CreatedBy"" TEXT NOT NULL DEFAULT 'system',
            ""CreatedOn"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            ""ModifiedBy"" TEXT,
            ""ModifiedOn"" TIMESTAMP WITH TIME ZONE
        );
        CREATE TABLE IF NOT EXISTS ""CreditorLiabilities"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""FinancialYearId"" INTEGER NOT NULL REFERENCES ""FinancialYears""(""Id""),
            ""ExpenditureCategoryId"" INTEGER NOT NULL REFERENCES ""ExpenditureCategories""(""Id"") ON DELETE RESTRICT,
            ""CreditorCategoryId"" INTEGER REFERENCES ""CreditorCategories""(""Id""),
            ""LiabilityType"" TEXT NOT NULL DEFAULT '',
            ""OpeningBalance"" NUMERIC NOT NULL DEFAULT 0,
            ""ProjectedExpenditure"" NUMERIC NOT NULL DEFAULT 0,
            ""ProjectedPayments"" NUMERIC NOT NULL DEFAULT 0,
            ""ClosingBalance"" NUMERIC NOT NULL DEFAULT 0,
            ""PaymentRate"" NUMERIC NOT NULL DEFAULT 0,
            ""ContraBankAccount"" TEXT,
            ""IsPriorYearLiability"" BOOLEAN NOT NULL DEFAULT FALSE,
            ""Year1Amount"" NUMERIC NOT NULL DEFAULT 0,
            ""Year2Amount"" NUMERIC NOT NULL DEFAULT 0,
            ""Year3Amount"" NUMERIC NOT NULL DEFAULT 0,
            ""ScoaItemId"" INTEGER REFERENCES ""ScoaItems""(""Id""),
            ""ScoaFundId"" INTEGER REFERENCES ""ScoaFunds""(""Id""),
            ""ScoaFunctionId"" INTEGER REFERENCES ""ScoaFunctions""(""Id""),
            ""ScoaRegionId"" INTEGER REFERENCES ""ScoaRegions""(""Id""),
            ""Status"" TEXT NOT NULL DEFAULT 'Draft',
            ""CreatedBy"" TEXT NOT NULL DEFAULT 'system',
            ""CreatedOn"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS ""CreditorPaymentArrangements"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""CreditorName"" TEXT NOT NULL,
            ""ReferenceNumber"" TEXT NOT NULL,
            ""TotalOutstanding"" NUMERIC NOT NULL DEFAULT 0,
            ""InstalmentAmount"" NUMERIC NOT NULL DEFAULT 0,
            ""PaymentIntervalDays"" INTEGER NOT NULL DEFAULT 30,
            ""RemainingBalance"" NUMERIC NOT NULL DEFAULT 0,
            ""InterestRate"" NUMERIC,
            ""ArrangementStatus"" TEXT NOT NULL DEFAULT 'Active',
            ""StartDate"" TIMESTAMP WITH TIME ZONE NOT NULL,
            ""EndDate"" TIMESTAMP WITH TIME ZONE,
            ""ExpenditureCategoryId"" INTEGER REFERENCES ""ExpenditureCategories""(""Id""),
            ""ScoaItemId"" INTEGER REFERENCES ""ScoaItems""(""Id""),
            ""ScoaFunctionId"" INTEGER REFERENCES ""ScoaFunctions""(""Id""),
            ""CreatedBy"" TEXT NOT NULL DEFAULT 'system',
            ""CreatedOn"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS ""ForecastAssumptions"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""Name"" TEXT NOT NULL,
            ""AssumptionType"" TEXT NOT NULL DEFAULT 'CPI',
            ""FinancialYearId"" INTEGER NOT NULL REFERENCES ""FinancialYears""(""Id""),
            ""Year1Value"" NUMERIC NOT NULL DEFAULT 0,
            ""Year2Value"" NUMERIC NOT NULL DEFAULT 0,
            ""Year3Value"" NUMERIC NOT NULL DEFAULT 0,
            ""Category"" TEXT,
            ""Justification"" TEXT,
            ""Version"" INTEGER NOT NULL DEFAULT 1,
            ""IsActive"" BOOLEAN NOT NULL DEFAULT TRUE,
            ""CreatedBy"" TEXT NOT NULL DEFAULT 'system',
            ""CreatedOn"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            ""ModifiedBy"" TEXT,
            ""ModifiedOn"" TIMESTAMP WITH TIME ZONE
        );
        CREATE TABLE IF NOT EXISTS ""CreditorsBudgetApprovals"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""EntityType"" TEXT NOT NULL,
            ""EntityId"" INTEGER NOT NULL,
            ""ApprovalType"" TEXT NOT NULL DEFAULT 'Submit',
            ""Stage"" INTEGER NOT NULL DEFAULT 1,
            ""Decision"" TEXT NOT NULL DEFAULT 'Pending',
            ""Comment"" TEXT,
            ""DecidedBy"" TEXT NOT NULL DEFAULT '',
            ""DecidedOn"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
    ";
    await db.Database.ExecuteSqlRawAsync(createCreditorsTablesSql);

    var createHrPayrollTablesSql = @"
        CREATE TABLE IF NOT EXISTS ""PostEstablishments"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""PostCode"" TEXT NOT NULL,
            ""Title"" TEXT NOT NULL,
            ""Department"" TEXT,
            ""JobLevel"" TEXT,
            ""SalaryGrade"" INTEGER,
            ""SalaryNotch"" INTEGER,
            ""EmploymentType"" TEXT NOT NULL DEFAULT 'Permanent',
            ""Status"" TEXT NOT NULL DEFAULT 'Vacant',
            ""IsFunded"" BOOLEAN NOT NULL DEFAULT TRUE,
            ""IsActive"" BOOLEAN NOT NULL DEFAULT TRUE,
            ""FundingSource"" TEXT,
            ""PlannedStartDate"" TIMESTAMP WITH TIME ZONE,
            ""PriorityStatus"" TEXT NOT NULL DEFAULT 'NotRanked',
            ""RankingScore"" NUMERIC NOT NULL DEFAULT 0,
            ""RecruitmentStrategy"" TEXT,
            ""JobDescription"" TEXT,
            ""BargainingUnit"" TEXT,
            ""EmployeeCategory"" TEXT,
            ""AnnualSalary"" NUMERIC NOT NULL DEFAULT 0,
            ""TotalCostToMunicipality"" NUMERIC NOT NULL DEFAULT 0,
            ""FinancialYearId"" INTEGER NOT NULL REFERENCES ""FinancialYears""(""Id""),
            ""ScoaItemCode"" TEXT,
            ""ScoaFundCode"" TEXT,
            ""ScoaFunctionCode"" TEXT,
            ""ScoaRegionCode"" TEXT,
            ""ScoaCostingCode"" TEXT,
            ""ModifiedBy"" TEXT,
            ""ModifiedOn"" TIMESTAMP WITH TIME ZONE,
            ""CreatedBy"" TEXT NOT NULL DEFAULT 'system',
            ""CreatedOn"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS ""IX_PostEstablishments_PostCode"" ON ""PostEstablishments"" (""PostCode"");

        CREATE TABLE IF NOT EXISTS ""SalaryStructures"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""Grade"" INTEGER NOT NULL,
            ""Notch"" INTEGER NOT NULL,
            ""AnnualAmount"" NUMERIC NOT NULL DEFAULT 0,
            ""HourlyRate"" NUMERIC,
            ""EffectiveDate"" TIMESTAMP WITH TIME ZONE NOT NULL,
            ""BargainingUnit"" TEXT,
            ""EmployeeCategory"" TEXT,
            ""JobLevel"" TEXT,
            ""IsActive"" BOOLEAN NOT NULL DEFAULT TRUE,
            ""CreatedBy"" TEXT NOT NULL DEFAULT 'system',
            ""CreatedOn"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS ""IX_SalaryStructures_Grade_Notch"" ON ""SalaryStructures"" (""Grade"", ""Notch"");

        CREATE TABLE IF NOT EXISTS ""SalaryIncreases"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""EmployeeCategory"" TEXT,
            ""BargainingUnit"" TEXT,
            ""PostLevel"" TEXT,
            ""IncreasePercentage"" NUMERIC NOT NULL DEFAULT 0,
            ""EffectiveDate"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            ""FinancialYearId"" INTEGER NOT NULL REFERENCES ""FinancialYears""(""Id""),
            ""IsNotchProgression"" BOOLEAN NOT NULL DEFAULT FALSE,
            ""IsLocked"" BOOLEAN NOT NULL DEFAULT FALSE,
            ""ApprovedBy"" TEXT,
            ""ApprovedOn"" TIMESTAMP WITH TIME ZONE,
            ""CreatedBy"" TEXT NOT NULL DEFAULT 'system',
            ""CreatedOn"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS ""TemporaryContracts"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""EmployeeName"" TEXT NOT NULL,
            ""PostCode"" TEXT,
            ""Department"" TEXT,
            ""JobTitle"" TEXT,
            ""ContractStartDate"" TIMESTAMP WITH TIME ZONE NOT NULL,
            ""ContractEndDate"" TIMESTAMP WITH TIME ZONE NOT NULL,
            ""RemunerationType"" TEXT NOT NULL DEFAULT 'Monthly',
            ""Rate"" NUMERIC NOT NULL DEFAULT 0,
            ""CalculatedBudget"" NUMERIC NOT NULL DEFAULT 0,
            ""ContractStatus"" TEXT,
            ""FinancialYearId"" INTEGER NOT NULL REFERENCES ""FinancialYears""(""Id""),
            ""ScoaItemCode"" TEXT,
            ""ScoaFundCode"" TEXT,
            ""ScoaFunctionCode"" TEXT,
            ""CreatedBy"" TEXT NOT NULL DEFAULT 'system',
            ""CreatedOn"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS ""CouncillorPositions"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""PositionTitle"" TEXT NOT NULL,
            ""CouncillorType"" TEXT NOT NULL DEFAULT 'FullTime',
            ""NumberOfPositions"" INTEGER NOT NULL DEFAULT 1,
            ""BasicSalary"" NUMERIC NOT NULL DEFAULT 0,
            ""TravelAllowance"" NUMERIC NOT NULL DEFAULT 0,
            ""CellphoneAllowance"" NUMERIC NOT NULL DEFAULT 0,
            ""MedicalContribution"" NUMERIC NOT NULL DEFAULT 0,
            ""OtherBenefits"" NUMERIC NOT NULL DEFAULT 0,
            ""TotalRemuneration"" NUMERIC NOT NULL DEFAULT 0,
            ""AnticipatedIncreasePercent"" NUMERIC NOT NULL DEFAULT 0,
            ""AdjustedTotalRemuneration"" NUMERIC NOT NULL DEFAULT 0,
            ""GazettedUpperLimit"" NUMERIC NOT NULL DEFAULT 0,
            ""ExceedsUpperLimit"" BOOLEAN NOT NULL DEFAULT FALSE,
            ""FinancialYearId"" INTEGER NOT NULL REFERENCES ""FinancialYears""(""Id""),
            ""ScoaItemCode"" TEXT,
            ""ScoaFundCode"" TEXT,
            ""ScoaFunctionCode"" TEXT,
            ""ScoaRegionCode"" TEXT,
            ""CreatedBy"" TEXT NOT NULL DEFAULT 'system',
            ""CreatedOn"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS ""WardCommitteeBudgets"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""WardNumber"" INTEGER NOT NULL,
            ""WardName"" TEXT,
            ""Region"" TEXT,
            ""NumberOfMembers"" INTEGER NOT NULL DEFAULT 10,
            ""NumberOfMeetings"" INTEGER NOT NULL DEFAULT 12,
            ""RatePerMeeting"" NUMERIC NOT NULL DEFAULT 0,
            ""AnticipatedRateIncreasePercent"" NUMERIC NOT NULL DEFAULT 0,
            ""AdjustedRatePerMeeting"" NUMERIC NOT NULL DEFAULT 0,
            ""TotalEstimatedCost"" NUMERIC NOT NULL DEFAULT 0,
            ""FinancialYearId"" INTEGER NOT NULL REFERENCES ""FinancialYears""(""Id""),
            ""ScoaItemCode"" TEXT,
            ""ScoaFundCode"" TEXT,
            ""ScoaFunctionCode"" TEXT,
            ""ScoaRegionCode"" TEXT,
            ""CreatedBy"" TEXT NOT NULL DEFAULT 'system',
            ""CreatedOn"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS ""VariableBenefitHours"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""Department"" TEXT,
            ""BenefitType"" TEXT NOT NULL DEFAULT 'Overtime',
            ""EstimatedHours"" NUMERIC NOT NULL DEFAULT 0,
            ""AverageRate"" NUMERIC NOT NULL DEFAULT 0,
            ""CalculatedCost"" NUMERIC NOT NULL DEFAULT 0,
            ""HistoricalHours"" NUMERIC,
            ""HistoricalCost"" NUMERIC,
            ""VariancePercent"" NUMERIC,
            ""FinancialYearId"" INTEGER NOT NULL REFERENCES ""FinancialYears""(""Id""),
            ""ScoaItemCode"" TEXT,
            ""ScoaFundCode"" TEXT,
            ""ScoaFunctionCode"" TEXT,
            ""CreatedBy"" TEXT NOT NULL DEFAULT 'system',
            ""CreatedOn"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS ""TravelRequirements"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""Department"" TEXT,
            ""ProjectReference"" TEXT,
            ""Destination"" TEXT,
            ""PurposeOfTravel"" TEXT,
            ""NumberOfOfficials"" INTEGER NOT NULL DEFAULT 1,
            ""NumberOfTrips"" INTEGER NOT NULL DEFAULT 1,
            ""EstimatedKilometres"" NUMERIC NOT NULL DEFAULT 0,
            ""AccommodationNights"" INTEGER NOT NULL DEFAULT 0,
            ""TravelDuration"" INTEGER NOT NULL DEFAULT 0,
            ""TransportMode"" TEXT NOT NULL DEFAULT 'OwnVehicle',
            ""EstimatedCost"" NUMERIC NOT NULL DEFAULT 0,
            ""FinancialYearId"" INTEGER NOT NULL REFERENCES ""FinancialYears""(""Id""),
            ""ScoaItemCode"" TEXT,
            ""ScoaFundCode"" TEXT,
            ""ScoaFunctionCode"" TEXT,
            ""ScoaProjectCode"" TEXT,
            ""ScoaRegionCode"" TEXT,
            ""CreatedBy"" TEXT NOT NULL DEFAULT 'system',
            ""CreatedOn"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS ""TravelStandardRates"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""RateType"" TEXT NOT NULL,
            ""Classification"" TEXT NOT NULL DEFAULT 'Local',
            ""EmployeeLevel"" TEXT,
            ""RateAmount"" NUMERIC NOT NULL DEFAULT 0,
            ""EffectiveDate"" TIMESTAMP WITH TIME ZONE NOT NULL,
            ""PolicyReference"" TEXT,
            ""IsActive"" BOOLEAN NOT NULL DEFAULT TRUE,
            ""CreatedBy"" TEXT NOT NULL DEFAULT 'system',
            ""CreatedOn"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS ""StatutoryDeductions"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""DeductionType"" TEXT NOT NULL,
            ""CalculationMethod"" TEXT NOT NULL DEFAULT 'Percentage',
            ""Rate"" NUMERIC NOT NULL DEFAULT 0,
            ""Threshold"" NUMERIC,
            ""EmployerContributionRate"" NUMERIC,
            ""Description"" TEXT,
            ""IsActive"" BOOLEAN NOT NULL DEFAULT TRUE,
            ""CreatedBy"" TEXT NOT NULL DEFAULT 'system',
            ""CreatedOn"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS ""IX_StatutoryDeductions_DeductionType"" ON ""StatutoryDeductions"" (""DeductionType"");

        CREATE TABLE IF NOT EXISTS ""PayrollLiabilities"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""LiabilityType"" TEXT NOT NULL,
            ""Department"" TEXT,
            ""EmployeeContribution"" NUMERIC NOT NULL DEFAULT 0,
            ""EmployerContribution"" NUMERIC NOT NULL DEFAULT 0,
            ""TotalLiability"" NUMERIC NOT NULL DEFAULT 0,
            ""PaymentPeriod"" TEXT,
            ""FinancialYearId"" INTEGER NOT NULL REFERENCES ""FinancialYears""(""Id""),
            ""ScoaItemCode"" TEXT,
            ""ScoaFundCode"" TEXT,
            ""ScoaFunctionCode"" TEXT,
            ""ScoaRegionCode"" TEXT,
            ""CreatedBy"" TEXT NOT NULL DEFAULT 'system',
            ""CreatedOn"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS ""DefinedBenefitObligations"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""BenefitType"" TEXT NOT NULL DEFAULT 'PostRetirementMedical',
            ""Department"" TEXT,
            ""OpeningBalance"" NUMERIC NOT NULL DEFAULT 0,
            ""ServiceCost"" NUMERIC NOT NULL DEFAULT 0,
            ""InterestCost"" NUMERIC NOT NULL DEFAULT 0,
            ""BenefitPayments"" NUMERIC NOT NULL DEFAULT 0,
            ""ActuarialGainLoss"" NUMERIC NOT NULL DEFAULT 0,
            ""ClosingBalance"" NUMERIC NOT NULL DEFAULT 0,
            ""CurrentPortion"" NUMERIC NOT NULL DEFAULT 0,
            ""NonCurrentPortion"" NUMERIC NOT NULL DEFAULT 0,
            ""DiscountRate"" NUMERIC NOT NULL DEFAULT 0,
            ""InflationRate"" NUMERIC NOT NULL DEFAULT 0,
            ""SalaryGrowthRate"" NUMERIC NOT NULL DEFAULT 0,
            ""MortalityRate"" NUMERIC,
            ""TurnoverRate"" NUMERIC,
            ""FinancialYearId"" INTEGER NOT NULL REFERENCES ""FinancialYears""(""Id""),
            ""ScoaItemCode"" TEXT,
            ""ScoaFundCode"" TEXT,
            ""ScoaFunctionCode"" TEXT,
            ""ScoaRegionCode"" TEXT,
            ""CreatedBy"" TEXT NOT NULL DEFAULT 'system',
            ""CreatedOn"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS ""LongServiceAwards"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""Department"" TEXT,
            ""MilestoneYears"" INTEGER NOT NULL DEFAULT 10,
            ""BenefitAmount"" NUMERIC NOT NULL DEFAULT 0,
            ""EligibleEmployees"" INTEGER NOT NULL DEFAULT 0,
            ""EstimatedPayments"" NUMERIC NOT NULL DEFAULT 0,
            ""CurrentPortion"" NUMERIC NOT NULL DEFAULT 0,
            ""NonCurrentPortion"" NUMERIC NOT NULL DEFAULT 0,
            ""FinancialYearId"" INTEGER NOT NULL REFERENCES ""FinancialYears""(""Id""),
            ""ScoaItemCode"" TEXT,
            ""ScoaFundCode"" TEXT,
            ""ScoaFunctionCode"" TEXT,
            ""CreatedBy"" TEXT NOT NULL DEFAULT 'system',
            ""CreatedOn"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS ""PerformanceBonuses"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""Department"" TEXT,
            ""EmployeeCategory"" TEXT,
            ""BonusPercentage"" NUMERIC NOT NULL DEFAULT 0,
            ""QualifyingEmployees"" INTEGER NOT NULL DEFAULT 0,
            ""AverageSalary"" NUMERIC NOT NULL DEFAULT 0,
            ""EstimatedTotalCost"" NUMERIC NOT NULL DEFAULT 0,
            ""FinancialYearId"" INTEGER NOT NULL REFERENCES ""FinancialYears""(""Id""),
            ""ScoaItemCode"" TEXT,
            ""ScoaFundCode"" TEXT,
            ""ScoaFunctionCode"" TEXT,
            ""CreatedBy"" TEXT NOT NULL DEFAULT 'system',
            ""CreatedOn"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS ""PayrollScenarios"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""Name"" TEXT NOT NULL,
            ""Description"" TEXT,
            ""SalaryIncreasePercent"" NUMERIC NOT NULL DEFAULT 0,
            ""VacancyFillingPercent"" NUMERIC NOT NULL DEFAULT 0,
            ""BenefitAdjustmentPercent"" NUMERIC NOT NULL DEFAULT 0,
            ""OvertimeAdjustmentPercent"" NUMERIC,
            ""TravelAdjustmentPercent"" NUMERIC,
            ""TotalBaselineCost"" NUMERIC NOT NULL DEFAULT 0,
            ""TotalScenarioCost"" NUMERIC NOT NULL DEFAULT 0,
            ""VarianceAmount"" NUMERIC NOT NULL DEFAULT 0,
            ""VariancePercent"" NUMERIC NOT NULL DEFAULT 0,
            ""Status"" TEXT NOT NULL DEFAULT 'Draft',
            ""FinancialYearId"" INTEGER NOT NULL REFERENCES ""FinancialYears""(""Id""),
            ""CreatedBy"" TEXT NOT NULL DEFAULT 'system',
            ""CreatedOn"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            ""ApprovedBy"" TEXT,
            ""ApprovedOn"" TIMESTAMP WITH TIME ZONE
        );

        CREATE TABLE IF NOT EXISTS ""PayrollBudgetLines"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""Department"" TEXT,
            ""CostCategory"" TEXT NOT NULL DEFAULT 'BasicSalary',
            ""SubCategory"" TEXT,
            ""Year1Amount"" NUMERIC NOT NULL DEFAULT 0,
            ""Year2Amount"" NUMERIC NOT NULL DEFAULT 0,
            ""Year3Amount"" NUMERIC NOT NULL DEFAULT 0,
            ""Month01"" NUMERIC NOT NULL DEFAULT 0,
            ""Month02"" NUMERIC NOT NULL DEFAULT 0,
            ""Month03"" NUMERIC NOT NULL DEFAULT 0,
            ""Month04"" NUMERIC NOT NULL DEFAULT 0,
            ""Month05"" NUMERIC NOT NULL DEFAULT 0,
            ""Month06"" NUMERIC NOT NULL DEFAULT 0,
            ""Month07"" NUMERIC NOT NULL DEFAULT 0,
            ""Month08"" NUMERIC NOT NULL DEFAULT 0,
            ""Month09"" NUMERIC NOT NULL DEFAULT 0,
            ""Month10"" NUMERIC NOT NULL DEFAULT 0,
            ""Month11"" NUMERIC NOT NULL DEFAULT 0,
            ""Month12"" NUMERIC NOT NULL DEFAULT 0,
            ""Status"" TEXT NOT NULL DEFAULT 'Draft',
            ""FinancialYearId"" INTEGER NOT NULL REFERENCES ""FinancialYears""(""Id""),
            ""ScoaItemCode"" TEXT,
            ""ScoaFundCode"" TEXT,
            ""ScoaFunctionCode"" TEXT,
            ""ScoaRegionCode"" TEXT,
            ""ScoaCostingCode"" TEXT,
            ""CreatedBy"" TEXT NOT NULL DEFAULT 'system',
            ""CreatedOn"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS ""HrPayrollBudgetApprovals"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""EntityType"" TEXT NOT NULL,
            ""EntityId"" INTEGER NOT NULL,
            ""Decision"" TEXT NOT NULL DEFAULT 'Submitted',
            ""Comments"" TEXT,
            ""ApprovedBy"" TEXT NOT NULL DEFAULT '',
            ""ApprovedAt"" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
    ";
    await db.Database.ExecuteSqlRawAsync(createHrPayrollTablesSql);


      // ===== EMS Budget Database Tables (from Budget_DB_Table_Scheme_1772736315958.sql) =====
      var createEmsTablesSql = @"
          CREATE TABLE IF NOT EXISTS ""Const_BudgetAdjustmentType_Sys"" (
            ""AdjustmentType_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""AdjustmentTypeDesc"" VARCHAR(200) NOT NULL,
            ""Enabled"" BOOLEAN NOT NULL,
            ""DisplayOrder"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierId"" VARCHAR(10)
        );
        CREATE TABLE IF NOT EXISTS ""Const_BudgetConsumptionProcess_Sys"" (
            ""BudgetConsumptionProcess_ID"" INTEGER NOT NULL PRIMARY KEY,
            ""BudgetConsumptionProcessDesc"" VARCHAR(500) NOT NULL,
            ""BudgetConsumptionProcessEnabled"" BOOLEAN NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_BudgetLayout_Sys"" (
            ""BudgetLayout_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""BudgetLayoutDesc"" VARCHAR(100) NOT NULL,
            ""Enabled"" BOOLEAN NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_BudgetSplitOptions"" (
            ""BudgetSplit_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""BudgetSplitDesc"" VARCHAR(200) NOT NULL,
            ""DivideBy_ID"" INTEGER NOT NULL,
            ""Enabled"" BOOLEAN NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_BudgetTransactionType_sys"" (
            ""BudgetTransactionType_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""BudgetTransDesc"" VARCHAR(100),
            ""Enabled"" BOOLEAN,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS ""Const_BudgetValidationRule_Sys"" (
            ""BudgetValidationRule_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""BudgetValidationRuleDesc"" VARCHAR(255) NOT NULL,
            ""BudgetValidationRuleApplicableOverallBudget"" BOOLEAN NOT NULL,
            ""BudgetValidationRuleEnabled"" BOOLEAN NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_Department"" (
            ""Department_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""DepartmentDesc"" VARCHAR(200) NOT NULL,
            ""Enabled"" BOOLEAN NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""DepartmentCode"" VARCHAR(50),
            ""StartDate"" TIMESTAMP,
            ""EndDate"" TIMESTAMP,
            ""VatApportionment"" INTEGER,
            ""ManagerPositionID"" INTEGER,
            ""ManagerStartDate"" TIMESTAMP,
            ""ManagerEndDate"" TIMESTAMP,
            ""FinYear"" VARCHAR(9)
        );
        CREATE TABLE IF NOT EXISTS ""Const_Division"" (
            ""Division_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""DivisionDesc"" VARCHAR(200) NOT NULL,
            ""DivisionCode"" VARCHAR(50),
            ""DepartmentID"" INTEGER NOT NULL,
            ""DivisionParentID"" INTEGER,
            ""Enabled"" BOOLEAN NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""SCOAFunctionID"" INTEGER,
            ""HRPayrollSCOAFundID"" INTEGER,
            ""StartDate"" TIMESTAMP,
            ""EndDate"" TIMESTAMP,
            ""RegionID"" INTEGER,
            ""ProjectID"" INTEGER,
            ""ManagerPositionID"" INTEGER,
            ""ManagerStartDate"" TIMESTAMP,
            ""ManagerEndDate"" TIMESTAMP,
            ""ConditionOfServiceID"" INTEGER,
            ""DirectorateLevel"" BOOLEAN,
            ""FinYear"" VARCHAR(9)
        );
        CREATE TABLE IF NOT EXISTS ""Const_FunderType"" (
            ""Funder_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""FunderName"" VARCHAR(100),
            ""Enabled"" BOOLEAN NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_FundingSource"" (
            ""FundingSource_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""FundingSourceDesc"" VARCHAR(200) NOT NULL,
            ""Enabled"" BOOLEAN NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""FinYear"" VARCHAR(9),
            ""PreviousReferenceId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_FundManagement"" (
            ""DocumentType_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""DocumentTypeDesc"" VARCHAR(250) NOT NULL,
            ""FinancialYear"" VARCHAR(250) NOT NULL,
            ""Enabled"" BOOLEAN NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""IsEditable"" VARCHAR(50)
        );
        CREATE TABLE IF NOT EXISTS ""Const_FundSourceChange"" (
            ""FundSourceChange_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""FundSourceChangeDesc"" VARCHAR(500) NOT NULL,
            ""Enabled"" BOOLEAN NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""FinYear"" VARCHAR(9),
            ""PreviousReferenceId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_GrantType"" (
            ""GrantTypeID"" SERIAL NOT NULL PRIMARY KEY,
            ""Name"" VARCHAR(100) NOT NULL,
            ""Description"" VARCHAR(500)
        );
        CREATE TABLE IF NOT EXISTS ""Const_KPIGroup"" (
            ""KPIGroup_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""KPIGroupName"" VARCHAR(200) NOT NULL,
            ""Enabled"" BOOLEAN NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_KPIGroupDetail"" (
            ""KPIGroupDetail_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""KPIGroupID"" INTEGER NOT NULL,
            ""KPIGroupName"" VARCHAR(200) NOT NULL,
            ""Enabled"" BOOLEAN NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_NationalKPA_Sys"" (
            ""NKPA_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""NKPANumber"" INTEGER NOT NULL,
            ""NKPADesc"" VARCHAR(200) NOT NULL,
            ""FinancialYear"" VARCHAR(50) NOT NULL,
            ""Enabled"" BOOLEAN NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""PreviousReferenceId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_PlanAdjustmentReason_sys"" (
            ""AdjustmentReason_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""Number"" INTEGER NOT NULL,
            ""AdjustmentReason"" TEXT NOT NULL,
            ""Enabled"" BOOLEAN NOT NULL,
            ""Lockdown"" BOOLEAN NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""Reference"" VARCHAR(100) NOT NULL,
            ""FinYear"" VARCHAR(9),
            ""PreviousReferenceId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_PlanAdjustmentType_sys"" (
            ""AdjustmentType_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""Number"" INTEGER NOT NULL,
            ""AdjustmentType"" TEXT NOT NULL,
            ""Enabled"" BOOLEAN NOT NULL,
            ""Lockdown"" BOOLEAN NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""FinYear"" VARCHAR(9),
            ""PreviousReferenceId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_PlanCapitalOperationalTypes_sys"" (
            ""Type_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""TypeName"" VARCHAR(50),
            ""TypeValue"" INTEGER,
            ""Enabled"" BOOLEAN NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""SortOrder"" INTEGER,
            ""StatusID"" INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS ""Const_PlanNetAssetItems"" (
            ""NetAssetItems_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""NTSCOAID"" UUID,
            ""SCOADesc"" VARCHAR(600),
            ""CapturerID"" INTEGER,
            ""DateCaptured"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS ""Const_PlanNTValidations"" (
            ""NTValidation_Id"" SERIAL NOT NULL PRIMARY KEY,
            ""ScoaItemId"" INTEGER NOT NULL,
            ""ScoaFunctionId"" INTEGER,
            ""IsEnable"" BOOLEAN,
            ""BudgetType"" INTEGER,
            ""FinYear"" VARCHAR(9),
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS ""Const_PlanSCOAFundCapital"" (
            ""SCOAFundCapital_Id"" SERIAL NOT NULL PRIMARY KEY,
            ""ScoaFundId"" INTEGER NOT NULL,
            ""IsEnable"" BOOLEAN,
            ""BudgetType"" INTEGER,
            ""FinYear"" VARCHAR(9),
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS ""Const_PlanSCOAFundOperational"" (
            ""SCOAFundOperational_Id"" SERIAL NOT NULL PRIMARY KEY,
            ""ScoaFundId"" INTEGER NOT NULL,
            ""IsEnable"" BOOLEAN,
            ""BudgetType"" INTEGER,
            ""FinYear"" VARCHAR(9),
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS ""Const_PlanSCOAItemAssetFBS"" (
            ""SCOAItemAssetFBS_Id"" SERIAL NOT NULL PRIMARY KEY,
            ""ScoaItemId"" INTEGER NOT NULL,
            ""IsEnable"" BOOLEAN,
            ""BudgetType"" INTEGER,
            ""CreditDebit"" VARCHAR(6),
            ""FinYear"" VARCHAR(9),
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS ""Const_PlanSCOAItemGainOR"" (
            ""SCOAItemGainOR_Id"" SERIAL NOT NULL PRIMARY KEY,
            ""ScoaItemId"" INTEGER NOT NULL,
            ""IsEnable"" BOOLEAN,
            ""BudgetType"" INTEGER,
            ""CreditDebit"" VARCHAR(6),
            ""FinYear"" VARCHAR(9),
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS ""Const_PlanSCOAItemLossOE"" (
            ""SCOAItemLossOE_Id"" SERIAL NOT NULL PRIMARY KEY,
            ""ScoaItemId"" INTEGER NOT NULL,
            ""IsEnable"" BOOLEAN,
            ""BudgetType"" INTEGER,
            ""CreditDebit"" VARCHAR(6),
            ""FinYear"" VARCHAR(9),
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS ""Const_PlanSCOAItemRevenueFBS"" (
            ""SCOAItemRevenueFBS_Id"" SERIAL NOT NULL PRIMARY KEY,
            ""ScoaItemId"" INTEGER NOT NULL,
            ""IsEnable"" BOOLEAN,
            ""BudgetType"" INTEGER,
            ""CreditDebit"" VARCHAR(6),
            ""FinYear"" VARCHAR(9),
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS ""Const_PlanSCOAProjectFBS"" (
            ""SCOAProjectFBS_Id"" SERIAL NOT NULL PRIMARY KEY,
            ""ScoaId"" INTEGER NOT NULL,
            ""IsEnable"" BOOLEAN,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""FinYear"" VARCHAR(9)
        );
        CREATE TABLE IF NOT EXISTS ""Const_PlanVirementRules_sys"" (
            ""VirementRule_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""Priority"" INTEGER NOT NULL,
            ""VirementDesc"" VARCHAR(200) NOT NULL,
            ""VirementDefinition"" TEXT NOT NULL,
            ""VirementRuleDesc"" VARCHAR(500) NOT NULL,
            ""BusinessRule"" TEXT NOT NULL,
            ""Enabled"" BOOLEAN NOT NULL,
            ""Option"" BOOLEAN NOT NULL,
            ""Lockdown"" BOOLEAN NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""FinYear"" VARCHAR(9),
            ""PreviousReferenceId"" INTEGER,
            ""VirementPolicyVersionID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_PMSAnnualField_Detail"" (
            ""AnnualFieldDetail_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""AnnualFieldHeaderID"" INTEGER NOT NULL,
            ""DataTypeID"" INTEGER NOT NULL,
            ""AnnualFieldDesc"" VARCHAR(200) NOT NULL,
            ""AnnualFieldOrderID"" INTEGER NOT NULL,
            ""AnnualFieldEnabled"" BOOLEAN NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_PMSAnnualField_Header"" (
            ""AnnualFieldHeader_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""FinancialYear"" VARCHAR(10) NOT NULL,
            ""AnnualFieldSubmitted"" BOOLEAN NOT NULL,
            ""DataCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_PMSCoreCompetencyRequirement"" (
            ""CoreCompetencyRequirement_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""CoreCompetencyRequirementTypeID"" INTEGER NOT NULL,
            ""CoreCompetencyRequirementDesc"" VARCHAR(200) NOT NULL,
            ""Enabled"" BOOLEAN NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""CoreCompetencyRequirement"" VARCHAR(255)
        );
        CREATE TABLE IF NOT EXISTS ""Const_PMSCoreCompetencyRequirementType_sys"" (
            ""CoreCompetencyRequirementType_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""CoreCompetencyRequirementTypeDesc"" VARCHAR(200) NOT NULL,
            ""Enabled"" BOOLEAN NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_PMSDataType_Sys"" (
            ""DataType_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""DataTypeName"" VARCHAR(200) NOT NULL,
            ""DataTypeDesc"" VARCHAR(500) NOT NULL,
            ""DataTypeEnabled"" BOOLEAN NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_PMSDepartmentNKPAWeighting_Detail"" (
            ""DepartmentNKPAWeightingDetail_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""DepartmentNKPAWeightingHeaderID"" INTEGER NOT NULL,
            ""NationalKPADetailID"" INTEGER NOT NULL,
            ""Weighting"" DECIMAL(16, 2) NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_PMSDepartmentNKPAWeighting_Header"" (
            ""DepartmentNKPAWeightingHeader_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""FinancialYear"" VARCHAR(50) NOT NULL,
            ""DepartmentID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_PMSIndicatorCustomField_Detail"" (
            ""CustomFieldDetail_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""CustomFieldHeaderID"" INTEGER NOT NULL,
            ""DataTypeID"" INTEGER NOT NULL,
            ""CustomFieldDesc"" VARCHAR(200) NOT NULL,
            ""CustomFieldOrderID"" INTEGER NOT NULL,
            ""CustomFieldEnabled"" BOOLEAN NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_PMSIndicatorCustomField_Header"" (
            ""CustomFieldHeader_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""FinancialYear"" VARCHAR(10) NOT NULL,
            ""CustomFieldSubmitted"" BOOLEAN NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_PMSIndicatorProgress"" (
            ""Progress_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""ProgressDesc"" TEXT NOT NULL,
            ""ProgressEnabled"" BOOLEAN NOT NULL,
            ""ProgressDisplayOrder"" INTEGER NOT NULL,
            ""ProgressTargetExceeded"" BOOLEAN NOT NULL,
            ""ProgressTargetMet"" BOOLEAN NOT NULL,
            ""ProgressColourR"" INTEGER NOT NULL,
            ""ProgressColourG"" INTEGER NOT NULL,
            ""ProgressColourB"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""ProgressDescFull"" TEXT
        );
        CREATE TABLE IF NOT EXISTS ""Const_PMSIndicatorQuarterlySubmissionDeadline"" (
            ""KpiSubmissionDeadline_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""FinancialYear"" VARCHAR(50) NOT NULL,
            ""ResponsiblePostDeadlineQ1"" TIMESTAMP NOT NULL,
            ""ResponsiblePostDeadlineQ2"" TIMESTAMP NOT NULL,
            ""ResponsiblePostDeadlineQ3"" TIMESTAMP NOT NULL,
            ""ResponsiblePostDeadlineQ4"" TIMESTAMP NOT NULL,
            ""CustodianPostDeadlineQ1"" TIMESTAMP NOT NULL,
            ""CustodianPostDeadlineQ2"" TIMESTAMP NOT NULL,
            ""CustodianPostDeadlineQ3"" TIMESTAMP NOT NULL,
            ""CustodianPostDeadlineQ4"" TIMESTAMP NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_PMSIndicatorUnitMeasure"" (
            ""UnitMeasure_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""DataTypeID"" INTEGER NOT NULL,
            ""UnitMeasureDesc"" VARCHAR(200) NOT NULL,
            ""UnitMeasureEnabled"" BOOLEAN NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_PMSMidYearField_Detail"" (
            ""MidYearFieldDetail_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""MidYearFieldHeaderID"" INTEGER NOT NULL,
            ""DataTypeID"" INTEGER NOT NULL,
            ""MidYearFieldDesc"" VARCHAR(200) NOT NULL,
            ""MidYearFieldOrderID"" INTEGER NOT NULL,
            ""MidYearFieldEnabled"" BOOLEAN NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_PMSMidYearField_Header"" (
            ""MidYearFieldHeader_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""FinancialYear"" VARCHAR(10) NOT NULL,
            ""MidYearFieldSubmitted"" BOOLEAN NOT NULL,
            ""DataCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_PMSOrganisationNKPAWeighting_Detail"" (
            ""OrganisationNKPAWeightingDetail_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""OrganisationNKPAWeightingHeaderID"" INTEGER NOT NULL,
            ""NationalKPADetailID"" INTEGER NOT NULL,
            ""Weighting"" DECIMAL(16, 2) NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_PMSOrganisationNKPAWeighting_Header"" (
            ""OrganisationNKPAWeightingHeader_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""FinancialYear"" VARCHAR(50) NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_PMSPostCoreCompetencyRequirement_Detail"" (
            ""PostCoreCompetencyRequirementDetail_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""PostCoreCompetencyRequirementHeaderID"" INTEGER NOT NULL,
            ""CoreCompetencyRequirementID"" INTEGER NOT NULL,
            ""Weighting"" DECIMAL(16, 2) NOT NULL,
            ""Assigned"" BOOLEAN NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_PMSPostCoreCompetencyRequirement_Header"" (
            ""PostCoreCompetencyRequirementHeader_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""JobProfileID"" INTEGER NOT NULL,
            ""Submitted"" BOOLEAN NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_PMSScorecardType"" (
            ""ScorecardType_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""ScorecardTypeDesc"" VARCHAR(200) NOT NULL,
            ""ScorecardTypeEnabled"" BOOLEAN NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_SCOA_Costing_Structure"" (
            ""ScoaID"" SERIAL NOT NULL PRIMARY KEY,
            ""ScoaCode"" VARCHAR(100),
            ""LevelID"" INTEGER,
            ""PostingLevel"" VARCHAR(6),
            ""BreakDownAllowed"" VARCHAR(6),
            ""ScoaDesc"" VARCHAR(2000),
            ""ScoaShortDesc"" VARCHAR(400),
            ""ScoaParentID"" INTEGER,
            ""ParentID"" INTEGER,
            ""NTVatStatus"" VARCHAR(100),
            ""NTSCOAFile"" VARCHAR(200),
            ""NTScoaLevel"" VARCHAR(200),
            ""NTExcelRowNumber"" VARCHAR(100),
            ""NTPrinciple"" VARCHAR(1000),
            ""NTApplicableTo"" VARCHAR(1000),
            ""NTPostingLevelDescription"" VARCHAR(1000),
            ""NTScoaID"" UUID,
            ""NTParentScoaId"" UUID,
            ""Enabled"" BOOLEAN NOT NULL,
            ""Version"" VARCHAR(20) NOT NULL,
            ""NTGFSCode"" VARCHAR(50)
        );
        CREATE TABLE IF NOT EXISTS ""Const_SCOA_Function_Structure"" (
            ""ScoaID"" SERIAL NOT NULL PRIMARY KEY,
            ""ScoaCode"" VARCHAR(100),
            ""LevelID"" INTEGER,
            ""PostingLevel"" VARCHAR(6),
            ""BreakDownAllowed"" VARCHAR(6),
            ""ScoaDesc"" VARCHAR(2000),
            ""ScoaShortDesc"" VARCHAR(400),
            ""ScoaParentID"" INTEGER,
            ""ParentID"" INTEGER,
            ""NTVatStatus"" VARCHAR(200),
            ""NTSCOAFile"" VARCHAR(200),
            ""NTScoaLevel"" VARCHAR(200),
            ""NTExcelRowNumber"" VARCHAR(100),
            ""NTPrinciple"" VARCHAR(1000),
            ""NTApplicableTo"" VARCHAR(1000),
            ""NTPostingLevelDescription"" VARCHAR(1000),
            ""NTScoaID"" UUID,
            ""NTParentScoaId"" UUID,
            ""Enabled"" BOOLEAN NOT NULL,
            ""Version"" VARCHAR(20) NOT NULL,
            ""NTGFSCode"" VARCHAR(50)
        );
        CREATE TABLE IF NOT EXISTS ""Const_SCOA_Funds_Structure"" (
            ""ScoaID"" SERIAL NOT NULL PRIMARY KEY,
            ""ScoaCode"" VARCHAR(100),
            ""LevelID"" INTEGER,
            ""PostingLevel"" VARCHAR(6),
            ""BreakDownAllowed"" VARCHAR(6),
            ""ScoaDesc"" VARCHAR(2000),
            ""ScoaShortDesc"" VARCHAR(400),
            ""ScoaParentID"" INTEGER,
            ""ParentID"" INTEGER,
            ""NTVatStatus"" VARCHAR(200),
            ""NTSCOAFile"" VARCHAR(200),
            ""NTScoaLevel"" VARCHAR(100),
            ""NTExcelRowNumber"" VARCHAR(100),
            ""NTPrinciple"" VARCHAR(1000),
            ""NTApplicableTo"" VARCHAR(1000),
            ""NTPostingLevelDescription"" VARCHAR(1000),
            ""NTScoaID"" UUID,
            ""NTParentScoaId"" UUID,
            ""Enabled"" BOOLEAN NOT NULL,
            ""Version"" VARCHAR(20) NOT NULL,
            ""NTGFSCode"" VARCHAR(50)
        );
        CREATE TABLE IF NOT EXISTS ""Const_SCOA_Project_Structure"" (
            ""ScoaID"" SERIAL NOT NULL PRIMARY KEY,
            ""ScoaCode"" VARCHAR(100),
            ""LevelID"" INTEGER,
            ""PostingLevel"" VARCHAR(6),
            ""BreakDownAllowed"" VARCHAR(6),
            ""ScoaDesc"" VARCHAR(2000),
            ""ScoaShortDesc"" VARCHAR(400),
            ""ScoaParentID"" INTEGER,
            ""ParentID"" INTEGER,
            ""NTVatStatus"" VARCHAR(200),
            ""NTSCOAFile"" VARCHAR(200),
            ""NTScoaLevel"" VARCHAR(100),
            ""NTExcelRowNumber"" VARCHAR(100),
            ""NTPrinciple"" VARCHAR(1000),
            ""NTApplicableTo"" VARCHAR(1000),
            ""NTPostingLevelDescription"" VARCHAR(1000),
            ""NTScoaID"" UUID,
            ""NTParentScoaId"" UUID,
            ""Enabled"" BOOLEAN NOT NULL,
            ""Version"" VARCHAR(10) NOT NULL,
            ""NTGFSCode"" VARCHAR(50)
        );
        CREATE TABLE IF NOT EXISTS ""Const_SCOA_Regional_Structure"" (
            ""ScoaID"" SERIAL NOT NULL PRIMARY KEY,
            ""ScoaCode"" VARCHAR(100),
            ""LevelID"" INTEGER,
            ""PostingLevel"" VARCHAR(6),
            ""BreakDownAllowed"" VARCHAR(6),
            ""ScoaDesc"" VARCHAR(2000),
            ""ScoaShortDesc"" VARCHAR(400),
            ""ScoaParentID"" INTEGER,
            ""ParentID"" INTEGER,
            ""NTVatStatus"" VARCHAR(200),
            ""NTSCOAFile"" VARCHAR(200),
            ""NTScoaLevel"" VARCHAR(100),
            ""NTExcelRowNumber"" VARCHAR(100),
            ""NTPrinciple"" VARCHAR(1000),
            ""NTApplicableTo"" VARCHAR(1000),
            ""NTPostingLevelDescription"" VARCHAR(1000),
            ""NTScoaID"" UUID,
            ""NTParentScoaId"" UUID,
            ""Enabled"" BOOLEAN NOT NULL,
            ""Version"" VARCHAR(10) NOT NULL,
            ""NTGFSCode"" VARCHAR(50)
        );
        CREATE TABLE IF NOT EXISTS ""Const_SCOA_Structure"" (
            ""ScoaID"" SERIAL NOT NULL PRIMARY KEY,
            ""ScoaCode"" VARCHAR(100),
            ""LevelID"" INTEGER,
            ""TableID"" INTEGER,
            ""TableName"" VARCHAR(50),
            ""PostingLevel"" VARCHAR(6),
            ""BreakDownAllowed"" VARCHAR(6),
            ""ScoaDesc"" VARCHAR(2000),
            ""ScoaShortDesc"" VARCHAR(400),
            ""ScoaParentID"" INTEGER,
            ""VoteTypeID"" INTEGER,
            ""DebitCreditID"" INTEGER,
            ""VatIndicatorID"" INTEGER,
            ""VatApportionment"" INTEGER,
            ""CapitalTimePeriodID"" INTEGER,
            ""IsCapexVote"" BOOLEAN,
            ""IsControlVote"" BOOLEAN,
            ""ParentID"" INTEGER,
            ""NTVatStatus"" VARCHAR(100),
            ""NTSCOAFile"" VARCHAR(200),
            ""NTScoaLevel"" VARCHAR(200),
            ""NTExcelRowNumber"" VARCHAR(100),
            ""NTPrinciple"" VARCHAR(1000),
            ""NTApplicableTo"" VARCHAR(1000),
            ""NTPostingLevelDescription"" VARCHAR(1000),
            ""NTScoaID"" UUID,
            ""NTParentScoaId"" UUID,
            ""DefinitionDescription"" VARCHAR(3000),
            ""Enabled"" BOOLEAN NOT NULL,
            ""Version"" VARCHAR(20) NOT NULL,
            ""NTGFSCode"" VARCHAR(50)
        );
        CREATE TABLE IF NOT EXISTS ""Plan_Activity"" (
            ""Activity_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""IDPItemID"" INTEGER NOT NULL,
            ""ActivityDesc"" TEXT,
            ""ActivityStatusID"" INTEGER NOT NULL,
            ""ActivityStartDate"" TIMESTAMP NOT NULL,
            ""ActivityEndDate"" TIMESTAMP NOT NULL,
            ""ResponsiblePersonID"" INTEGER NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""ItemID"" INTEGER,
            ""DivisionID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_ActivityProgress"" (
            ""ActivityProgress_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""ActivityID"" INTEGER NOT NULL,
            ""ProgressPercent"" DECIMAL(16, 2) NOT NULL,
            ""ProgressComment"" VARCHAR(500) NOT NULL,
            ""ProgressCaptureDate"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS ""Plan_AdjBudgetTemp"" (
            ""IDCount"" INTEGER NOT NULL PRIMARY KEY,
            ""ProjectID"" INTEGER,
            ""DivisionID"" INTEGER,
            ""SingleMulti"" VARCHAR(10),
            ""DebitCredit"" VARCHAR(10),
            ""CapitalOperational"" INTEGER,
            ""ScoaItem"" VARCHAR(200),
            ""ScoaFund"" VARCHAR(200),
            ""ScoaFunction"" VARCHAR(200),
            ""ScoaCosting"" VARCHAR(200),
            ""ScoaProject"" VARCHAR(200),
            ""ScoaRegion"" VARCHAR(200),
            ""AdjustmentTypeID"" INTEGER,
            ""BudgetMonth1"" DECIMAL(18, 2),
            ""BudgetMonth2"" DECIMAL(18, 2),
            ""BudgetMonth3"" DECIMAL(18, 2),
            ""BudgetMonth4"" DECIMAL(18, 2),
            ""BudgetMonth5"" DECIMAL(18, 2),
            ""BudgetMonth6"" DECIMAL(18, 2),
            ""BudgetMonth7"" DECIMAL(18, 2),
            ""BudgetMonth8"" DECIMAL(18, 2),
            ""BudgetMonth9"" DECIMAL(18, 2),
            ""BudgetMonth10"" DECIMAL(18, 2),
            ""BudgetMonth11"" DECIMAL(18, 2),
            ""BudgetMonth12"" DECIMAL(18, 2),
            ""BudgetY1"" DECIMAL(18, 2),
            ""BudgetY2"" DECIMAL(18, 2),
            ""BudgetY3"" DECIMAL(18, 2),
            ""PlanProjectItemId"" INTEGER,
            ""ProjectName"" VARCHAR(500),
            ""IDCountItem"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_Adjustment"" (
            ""AdjustmentBudget_Id"" SERIAL NOT NULL PRIMARY KEY,
            ""FinYear"" VARCHAR(50) NOT NULL,
            ""FromProjectId"" INTEGER NOT NULL,
            ""ToProjectId"" INTEGER NOT NULL,
            ""FromSCOAProjectID"" INTEGER,
            ""ToSCOAProjectID"" INTEGER,
            ""FromSCOAFunctionId"" INTEGER,
            ""ToSCOAFunctionId"" INTEGER,
            ""FromDivisionId"" INTEGER,
            ""ToDivisionId"" INTEGER,
            ""FromSCOAFundID"" INTEGER,
            ""ToSCOAFundID"" INTEGER,
            ""FromSCOARegion"" INTEGER,
            ""ToSCOARegion"" INTEGER,
            ""FromSCOAItem"" INTEGER,
            ""ToSCOAItem"" INTEGER,
            ""ReasonForAdjustment"" INTEGER,
            ""TypeOfAdjustment"" INTEGER NOT NULL,
            ""FromAvailableFund"" DECIMAL(16, 2),
            ""FromAdjustmentAmount"" DECIMAL(16, 2),
            ""FromNewAvailableBudget"" DECIMAL(16, 2),
            ""ToAvailableFund"" DECIMAL(16, 2),
            ""ToAdjustmentAmount"" DECIMAL(16, 2),
            ""ToNewAvailableBudget"" DECIMAL(16, 2),
            ""AdjustmentReferenceNumber"" VARCHAR(20),
            ""VersionNumber"" INTEGER,
            ""Status"" INTEGER,
            ""TransferBy"" INTEGER NOT NULL,
            ""TransferOn"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""FromCapitalOperation"" INTEGER,
            ""ToCapitalOperation"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_AdjustmentApprovalRejections"" (
            ""AdjustmentApprovalRejectionId"" SERIAL NOT NULL PRIMARY KEY,
            ""AdjustmentBudgetId"" INTEGER,
            ""IsApproved"" BOOLEAN,
            ""ApprovedBy"" INTEGER,
            ""ApprovedOn"" TIMESTAMP,
            ""ApprovalRejectionFileName"" VARCHAR(500),
            ""IsRejected"" BOOLEAN,
            ""RejectReason"" TEXT,
            ""RejectedBy"" INTEGER,
            ""RejectedOn"" TIMESTAMP,
            ""CapturerID"" INTEGER,
            ""DateCaptured"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS ""Plan_AdjustmentBudgetApproval"" (
            ""AdjustmentBudgetApproval_Id"" SERIAL NOT NULL PRIMARY KEY,
            ""FinancialYear"" VARCHAR(9),
            ""IsInitializeAdjustmentBudget"" BOOLEAN,
            ""ApprovedAdjustmentBudgetFileName"" VARCHAR(500),
            ""ApprovedBy"" INTEGER NOT NULL,
            ""ApprovedDate"" TIMESTAMP NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""CouncilApprovedDate"" TIMESTAMP,
            ""AdjustmentVersionId"" INTEGER,
            ""AdjustmentFundingVersionId"" INTEGER,
            ""IsCouncilApproved"" BOOLEAN
        );
        CREATE TABLE IF NOT EXISTS ""Plan_AdjustmentBudgetPolicyApproval"" (
            ""AdjustmentBudgetPolicyApproval_Id"" SERIAL NOT NULL PRIMARY KEY,
            ""FinancialYear"" VARCHAR(9),
            ""IsApprovedAdjustmentBudgetPolicy"" BOOLEAN,
            ""ApprovedAdjustmentBudgetPolicyFileName"" VARCHAR(500),
            ""ApprovedBy"" INTEGER NOT NULL,
            ""ApprovedDate"" TIMESTAMP NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""AdjustmentVersionId"" INTEGER,
            ""AdjustmentFundingVersionId"" INTEGER,
            ""IsAdjustmentFinalApproved"" BOOLEAN
        );
        CREATE TABLE IF NOT EXISTS ""Plan_AdjustmentBudgetVersion"" (
            ""AdjustmentBudgetVersion_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""VersionNumber"" VARCHAR(20) NOT NULL,
            ""VersionName"" VARCHAR(500) NOT NULL,
            ""Comments"" VARCHAR(500) NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL
        );
        CREATE TABLE IF NOT EXISTS ""Plan_AdjustmentBudgetVersionDetail"" (
            ""AdjustmentBudgetVersionDetail_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""AdjustmentBudgetVersionID"" INTEGER NOT NULL,
            ""ProjectID"" INTEGER NOT NULL,
            ""FinYear"" VARCHAR(18),
            ""IDPItemID"" INTEGER NOT NULL,
            ""CapitalOperation"" INTEGER NOT NULL,
            ""ScoaProjectID"" INTEGER NOT NULL,
            ""SCOACostingID"" INTEGER NOT NULL,
            ""ProjectTypeID"" INTEGER,
            ""PlanProjectItemID"" INTEGER NOT NULL,
            ""ProjectItemID"" INTEGER,
            ""SCOAItemID"" INTEGER NOT NULL,
            ""SCOAFundId"" INTEGER NOT NULL,
            ""BudgetAmount"" DECIMAL(16, 2),
            ""BudgetAmountCurP1"" DECIMAL(16, 2),
            ""BudgetAmountCurP2"" DECIMAL(16, 2),
            ""SCOAFunctionId"" INTEGER NOT NULL,
            ""SCOARegionId"" INTEGER NOT NULL,
            ""DivisionId"" INTEGER NOT NULL,
            ""BudgetSplitID"" INTEGER,
            ""VirementId"" INTEGER,
            ""AdjustmentId"" INTEGER,
            ""ModificationNumber"" INTEGER,
            ""IsItemLocked"" BOOLEAN,
            ""CreditDebit"" VARCHAR(6),
            ""AdjutmentType"" INTEGER,
            ""LegislativeReasonAdjustment"" INTEGER,
            ""ReasonForAdjustment"" TEXT,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""GRAPClassification"" VARCHAR(4000),
            ""GRAPClassificationNote"" VARCHAR(4000),
            ""MainSegmentReporting"" VARCHAR(4000),
            ""SubSegmentReporting"" VARCHAR(4000),
            ""CostingProject"" BOOLEAN
        );
        CREATE TABLE IF NOT EXISTS ""Plan_AdjustmentBudgetVersionMonths"" (
            ""AdjustmentBudgetVersionMonth_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""AdjustmentBudgetVersionID"" INTEGER NOT NULL,
            ""AdjustmentProjectItemMonth_ID"" INTEGER,
            ""PlanAdjustmentProjectItemID"" INTEGER NOT NULL,
            ""MonthID"" INTEGER NOT NULL,
            ""UnitQuantity"" DECIMAL(16, 2) NOT NULL,
            ""UnitPrice"" DECIMAL(16, 2) NOT NULL,
            ""CaptureID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""VirementId"" INTEGER,
            ""AdjustmentId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_AdjustmentFundingBudgetVersion"" (
            ""AdjustmentFundingBudgetVersion_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""VersionNumber"" VARCHAR(20) NOT NULL,
            ""VersionName"" VARCHAR(500) NOT NULL,
            ""Comments"" VARCHAR(500) NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL
        );
        CREATE TABLE IF NOT EXISTS ""Plan_AdjustmentFundingBudgetVersionDetails"" (
            ""AdjustmentFundingBudgetVersionDetail_Id"" SERIAL NOT NULL PRIMARY KEY,
            ""AdjustmentFundingBudgetVersionId"" INTEGER NOT NULL,
            ""AdjustmentFundingSourceBudgetDetail_ID"" INTEGER NOT NULL,
            ""AdjustmentFundingSourceBudgetHeaderID"" INTEGER NOT NULL,
            ""FinancialYear"" VARCHAR(9),
            ""FundingSourceID"" INTEGER,
            ""ScoaID"" INTEGER NOT NULL,
            ""FundingSourceBudget"" DECIMAL(16, 2) NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""UploadedDocument"" VARCHAR(255)
        );
        CREATE TABLE IF NOT EXISTS ""Plan_AdjustmentFundingSourceBudget_Detail"" (
            ""AdjustmentFundingSourceBudgetDetail_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""AdjustmentFundingSourceBudgetHeaderID"" INTEGER NOT NULL,
            ""AdjustmentFundingSourceID"" INTEGER,
            ""ScoaID"" INTEGER NOT NULL,
            ""FundingSourceBudget"" DECIMAL(16, 2) NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""IsHidden"" BOOLEAN,
            ""UploadedDocument"" VARCHAR(255),
            ""RefFundingSourceDetailId"" INTEGER,
            ""AdjustmentFundingVersionId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_AdjustmentFundingSourceBudget_Header"" (
            ""AdjustmentFundingSourceBudgetHeader_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""FinancialYear"" VARCHAR(50) NOT NULL,
            ""Submitted"" BOOLEAN NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""RefFundingSourceHeaderId"" INTEGER,
            ""AdjustmentFundingVersionId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_AdjustmentFundingSourceChanges"" (
            ""PlanAdjustmentFundingSourceChange_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""AdjustmentFundingSourceDetailsID"" INTEGER NOT NULL,
            ""FundSourceChangeID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS ""Plan_AdjustmentFundingSourceDocs"" (
            ""AdjustmentFundingSourceDocs_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""SupportingDocsID"" INTEGER,
            ""AdjustmentFundingSourceBudgetDetailID"" INTEGER,
            ""ScoaID"" INTEGER,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""RefFundingSourceDocsID"" INTEGER,
            ""AdjustmentFundingVersionId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_AdjustmentPolicyApproval"" (
            ""AdjustmentPolicyApproval_Id"" SERIAL NOT NULL PRIMARY KEY,
            ""FinancialYear"" VARCHAR(9),
            ""IsApprovedAdjustmentPolicy"" BOOLEAN,
            ""ApprovedAdjustmentPolicyFileName"" VARCHAR(500),
            ""ApprovedBy"" INTEGER NOT NULL,
            ""ApprovedDate"" TIMESTAMP NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_AdjustmentProject"" (
            ""AdjustmentProject_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""ReferenceProject_ID"" INTEGER,
            ""AdjustmentProjectName"" VARCHAR(500) NOT NULL,
            ""AdjustmentProjectDesc"" VARCHAR(500) NOT NULL,
            ""ProjectManagerID"" INTEGER,
            ""SupplyChainOfficialID"" INTEGER,
            ""CapitalOperation"" INTEGER,
            ""CostEstimate"" DECIMAL(16, 2) NOT NULL,
            ""ScoaProjectID"" INTEGER NOT NULL,
            ""EstimatedStartDate"" TIMESTAMP,
            ""EstimatedEndDate"" TIMESTAMP,
            ""ProjectStatus"" INTEGER NOT NULL,
            ""CommencementDate"" TIMESTAMP,
            ""FinYear"" VARCHAR(9),
            ""ProjectDetailDesc"" VARCHAR(500),
            ""ProjectCategoryID"" INTEGER,
            ""ProjectImplementAgentID"" INTEGER,
            ""Longitude"" VARCHAR(200),
            ""Latitude"" VARCHAR(200),
            ""ProgrammeManagerID"" INTEGER,
            ""FinancialControllerID"" INTEGER,
            ""ProjectTypeID"" INTEGER,
            ""EstimatedDuration"" INTEGER,
            ""ProjectDistinctionID"" INTEGER,
            ""IsDeleted"" BOOLEAN,
            ""HistoricalProjectCode"" VARCHAR(100),
            ""ProjectParentID"" INTEGER,
            ""SingleMultiYear"" VARCHAR(5),
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""AdjustmentVersionId"" INTEGER,
            ""IsRecommended"" BOOLEAN,
            ""ProjectCode"" INTEGER,
            ""CostingProject"" BOOLEAN
        );
        CREATE TABLE IF NOT EXISTS ""Plan_AdjustmentProjectCosting"" (
            ""AdjustmentProjectCosting_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""ReferenceProjectCostingID"" INTEGER,
            ""AdjustmentProjectID"" INTEGER NOT NULL,
            ""ScoaCostingID"" INTEGER NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""AdjustmentVersionId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_AdjustmentProjectDivisions"" (
            ""AdjustmentProjectDivision_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""ReferenceProjectDivisionID"" INTEGER,
            ""AdjustmentProjectID"" INTEGER NOT NULL,
            ""DivisionID"" INTEGER NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""AdjustmentVersionId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_AdjustmentProjectFunctions"" (
            ""AdjustmentProjectFunction_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""ReferenceProjectFunctionID"" INTEGER,
            ""AdjustmentProjectID"" INTEGER NOT NULL,
            ""ScoaFunctionID"" INTEGER NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""AdjustmentVersionId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_AdjustmentProjectFund"" (
            ""AdjustmentProjectFund_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""ReferenceProjectFundID"" INTEGER,
            ""AdjustmentProjectID"" INTEGER NOT NULL,
            ""ScoaFundID"" INTEGER NOT NULL,
            ""FundAmount"" DECIMAL(16, 2),
            ""FundReference"" VARCHAR(200),
            ""VirementId"" INTEGER,
            ""AdjustmentId"" INTEGER,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""AdjustmentVersionId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_AdjustmentProjectFundYear"" (
            ""AdjustmentProjectFundYear_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""ReferenceProjectFundYearID"" INTEGER,
            ""AdjustmentProjectFundID"" INTEGER NOT NULL,
            ""FinYear"" VARCHAR(9) NOT NULL,
            ""YearFundAmount"" DECIMAL(16, 2) NOT NULL,
            ""VirementId"" INTEGER,
            ""AdjustmentId"" INTEGER,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""AdjustmentVersionId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_AdjustmentProjectIDP"" (
            ""AdjustmentProjectIDP_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""ReferenceProjectIDPID"" INTEGER,
            ""AdjustmentProjectID"" INTEGER NOT NULL,
            ""ParentIDPItemID"" INTEGER NOT NULL,
            ""AdjustmentProjectIDPItemID"" INTEGER NOT NULL,
            ""Percentage"" DECIMAL(5, 2) NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""Latitude"" DECIMAL(18, 8),
            ""Longitude"" DECIMAL(18, 8),
            ""AdjustmentVersionId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_AdjustmentProjectItem"" (
            ""PlanAdjustmentProjectItem_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""ReferencePlanProjectItem_ID"" INTEGER,
            ""AdjustmentProjectID"" INTEGER NOT NULL,
            ""ProjectItemID"" INTEGER,
            ""SCOAItemID"" INTEGER NOT NULL,
            ""FinYear"" VARCHAR(9) NOT NULL,
            ""ProjectFundYearID"" INTEGER,
            ""SCOAFundId"" INTEGER,
            ""BudgetAmount"" DECIMAL(16, 2),
            ""BudgetAmountCurP1"" DECIMAL(16, 2),
            ""BudgetAmountCurP2"" DECIMAL(16, 2),
            ""AdjustedBudgetAmount"" DECIMAL(16, 2),
            ""AdjustedBudgetAmountCurP1"" DECIMAL(16, 2),
            ""AdjustedBudgetAmountCurP2"" DECIMAL(16, 2),
            ""SCOAFunctionId"" INTEGER,
            ""SCOARegionId"" INTEGER,
            ""DivisionId"" INTEGER,
            ""BudgetSplitID"" INTEGER,
            ""VirementId"" INTEGER,
            ""HistoricalProjectCode"" VARCHAR(100),
            ""AdjustmentId"" INTEGER,
            ""ModificationNumber"" INTEGER,
            ""SCOACostingID"" INTEGER,
            ""IsItemLocked"" BOOLEAN,
            ""CreditDebit"" VARCHAR(6),
            ""AdjutmentType"" INTEGER,
            ""LegislativeReasonAdjustment"" INTEGER,
            ""ReasonForAdjustment"" TEXT,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""AdjustmentVersionId"" INTEGER,
            ""GRAPClassification"" VARCHAR(4000),
            ""GRAPClassificationNote"" VARCHAR(4000),
            ""MainSegmentReporting"" VARCHAR(4000),
            ""SubSegmentReporting"" VARCHAR(4000),
            ""IsActiveForSCM"" BOOLEAN
        );
        CREATE TABLE IF NOT EXISTS ""Plan_AdjustmentProjectItemDocs"" (
            ""AdjustmentProjectItemDocs_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""ReferenceProjectItemDocsID"" INTEGER,
            ""SupportingDocsID"" INTEGER,
            ""PlanAdjustmentProjectItemID"" INTEGER,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""AdjustmentVersionId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_AdjustmentProjectItemMonth"" (
            ""AdjustmentProjectItemMonth_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""ReferenceProjectItemMonthID"" INTEGER,
            ""PlanAdjustmentProjectItemID"" INTEGER NOT NULL,
            ""MonthID"" INTEGER NOT NULL,
            ""UnitQuantity"" DECIMAL(16, 2) NOT NULL,
            ""UnitPrice"" DECIMAL(16, 2) NOT NULL,
            ""CaptureID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""VirementId"" INTEGER,
            ""AdjustmentId"" INTEGER,
            ""AdjustmentVersionId"" INTEGER,
            ""AdjustedUnitPrice"" DECIMAL(16, 2)
        );
        CREATE TABLE IF NOT EXISTS ""Plan_AdjustmentProjectRecommendation"" (
            ""AdjustmentProjectRecommendation_Id"" SERIAL NOT NULL PRIMARY KEY,
            ""AdjustmentProjectId"" INTEGER,
            ""IsRecommend"" BOOLEAN,
            ""RecommendBy"" INTEGER,
            ""RecommendOn"" TIMESTAMP,
            ""IsRejected"" BOOLEAN,
            ""RejectReason"" TEXT,
            ""RejectedBy"" INTEGER,
            ""RejectedOn"" TIMESTAMP,
            ""CapturerID"" INTEGER,
            ""DateCaptured"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""AdjustmentVersionId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_AdjustmentProjectRecommendUsers"" (
            ""AdjustmentProjectRecommendUser_Id"" SERIAL NOT NULL PRIMARY KEY,
            ""AdjustmentProjectId"" INTEGER,
            ""UserId"" INTEGER,
            ""CapturerID"" INTEGER,
            ""DateCaptured"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""AdjustmentVersionId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_AdjustmentProjectRegions"" (
            ""AdjustmentProjectRegion_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""ReferenceProjectRegionID"" INTEGER,
            ""AdjustmentProjectID"" INTEGER NOT NULL,
            ""ScoaRegionID"" INTEGER NOT NULL,
            ""RegionPercent"" DECIMAL(16, 2),
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""AdjustmentVersionId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_AdjustmentTrackChanges"" (
            ""AdjustmentTrackChanges_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""AdjustmentPlanProjectItem_ID"" INTEGER,
            ""AdjustmentProjectID"" INTEGER NOT NULL,
            ""FinYear"" VARCHAR(9),
            ""ProjectItemID"" INTEGER,
            ""SCOAItemID"" INTEGER,
            ""SCOAFunctionId"" INTEGER,
            ""SCOAFundId"" INTEGER,
            ""SCOARegionId"" INTEGER,
            ""DivisionId"" INTEGER,
            ""OriginalBudgetAmount"" DECIMAL(16, 2),
            ""OriginalBudgetAmountCurP1"" DECIMAL(16, 2),
            ""OriginalBudgetAmountCurP2"" DECIMAL(16, 2),
            ""RevisedBudgetAmount"" DECIMAL(16, 2),
            ""RevisedBudgetAmountCurP1"" DECIMAL(16, 2),
            ""RevisedBudgetAmountCurP2"" DECIMAL(16, 2),
            ""Comment"" TEXT,
            ""CommentFor"" VARCHAR(50),
            ""IsProjectDeleted"" BOOLEAN,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS ""Plan_BudgetAdjustmentExportImportVersion_Header"" (
            ""BudgetAdjustmentExportImportVersionHeader_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""BudgetAdjustmentExportImportVersionFileName"" VARCHAR(200) NOT NULL,
            ""FinYear"" VARCHAR(50) NOT NULL,
            ""AdjustmentVersionID"" INTEGER NOT NULL,
            ""StatusID"" INTEGER NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""IsProjectRegistered"" BOOLEAN
        );
        CREATE TABLE IF NOT EXISTS ""Plan_BudgetAdjustmentExportVersion_Detail"" (
            ""BudgetAdjustmentExportVersionDetail_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""BudgetAdjustmentExportImportVersionHeaderID"" INTEGER NOT NULL,
            ""FinYear1"" VARCHAR(50) NOT NULL,
            ""FinYear2"" VARCHAR(50) NOT NULL,
            ""FinYear3"" VARCHAR(50) NOT NULL,
            ""AdjustmentVersionID"" INTEGER NOT NULL,
            ""AdjustmentProjectID"" INTEGER NOT NULL,
            ""IDPItem"" TEXT NOT NULL,
            ""ProjectID"" INTEGER,
            ""ProjectCode"" INTEGER,
            ""ProjectName"" VARCHAR(500),
            ""ProjectDesc"" VARCHAR(500) NOT NULL,
            ""SingleMultiYear"" VARCHAR(5),
            ""PlanProjectItemID"" INTEGER,
            ""BudgetType"" VARCHAR(50) NOT NULL,
            ""SCOAProjectCode"" VARCHAR(200) NOT NULL,
            ""SCOAProject"" VARCHAR(4000) NOT NULL,
            ""SCOAFunctionCode"" VARCHAR(200) NOT NULL,
            ""SCOAFunction"" VARCHAR(4000) NOT NULL,
            ""MSCDepartmentCode"" VARCHAR(50) NOT NULL,
            ""MSCDepartment"" VARCHAR(200) NOT NULL,
            ""MSCDivisionCode"" VARCHAR(50) NOT NULL,
            ""MSCDivision"" VARCHAR(200) NOT NULL,
            ""MunicipalClassification"" VARCHAR(600) NOT NULL,
            ""SCOAFundCode"" VARCHAR(200) NOT NULL,
            ""SCOAFund"" VARCHAR(4000) NOT NULL,
            ""SCOARegionCode"" VARCHAR(200) NOT NULL,
            ""SCOARegion"" VARCHAR(4000) NOT NULL,
            ""SCOACostingCode"" VARCHAR(200) NOT NULL,
            ""SCOACosting"" VARCHAR(4000) NOT NULL,
            ""SCOAItemCode"" VARCHAR(200) NOT NULL,
            ""SCOAItem"" VARCHAR(4000) NOT NULL,
            ""ItemDescription"" VARCHAR(500),
            ""CurrentBudgetFinYear1"" DECIMAL(16, 2) NOT NULL,
            ""CurrentBudgetFinYear2"" DECIMAL(16, 2) NOT NULL,
            ""CurrentBudgetFinYear3"" DECIMAL(16, 2) NOT NULL,
            ""AvailableBudgetFinYear1"" DECIMAL(16, 2) NOT NULL,
            ""SplitType"" VARCHAR(50) NOT NULL,
            ""M1"" DECIMAL(16, 2) NOT NULL,
            ""M2"" DECIMAL(16, 2) NOT NULL,
            ""M3"" DECIMAL(16, 2) NOT NULL,
            ""M4"" DECIMAL(16, 2) NOT NULL,
            ""M5"" DECIMAL(16, 2) NOT NULL,
            ""M6"" DECIMAL(16, 2) NOT NULL,
            ""M7"" DECIMAL(16, 2) NOT NULL,
            ""M8"" DECIMAL(16, 2) NOT NULL,
            ""M9"" DECIMAL(16, 2) NOT NULL,
            ""M10"" DECIMAL(16, 2) NOT NULL,
            ""M11"" DECIMAL(16, 2) NOT NULL,
            ""M12"" DECIMAL(16, 2) NOT NULL,
            ""CreditDebit"" VARCHAR(50) NOT NULL,
            ""AdjustmentType"" TEXT,
            ""LegislativeAdjustmentReason"" TEXT,
            ""ReasonForAdjustment"" TEXT,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""GRAPClassification"" VARCHAR(4000),
            ""GRAPClassificationNote"" VARCHAR(4000),
            ""MainSegmentReporting"" VARCHAR(4000),
            ""SubSegmentReporting"" VARCHAR(4000),
            ""CostingProject"" BOOLEAN
        );
        CREATE TABLE IF NOT EXISTS ""Plan_BudgetAdjustmentImportVersion_Detail"" (
            ""BudgetAdjustmentImportVersionDetail_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""BudgetAdjustmentExportImportVersionHeaderID"" INTEGER NOT NULL,
            ""BudgetAdjustmentImportVersionNumber"" INTEGER NOT NULL,
            ""FinYear1"" VARCHAR(50) NOT NULL,
            ""FinYear2"" VARCHAR(50) NOT NULL,
            ""FinYear3"" VARCHAR(50) NOT NULL,
            ""AdjustmentVersionID"" INTEGER NOT NULL,
            ""AdjustmentProjectID"" INTEGER NOT NULL,
            ""IDPItem"" TEXT NOT NULL,
            ""ProjectID"" INTEGER,
            ""ProjectCode"" INTEGER,
            ""ProjectName"" VARCHAR(500),
            ""ProjectDesc"" VARCHAR(500) NOT NULL,
            ""SingleMultiYear"" VARCHAR(5),
            ""PlanProjectItemID"" INTEGER,
            ""BudgetType"" VARCHAR(50) NOT NULL,
            ""SCOAProjectCode"" VARCHAR(200) NOT NULL,
            ""SCOAProject"" VARCHAR(4000) NOT NULL,
            ""SCOAFunctionCode"" VARCHAR(200) NOT NULL,
            ""SCOAFunction"" VARCHAR(4000) NOT NULL,
            ""MSCDepartmentCode"" VARCHAR(50) NOT NULL,
            ""MSCDepartment"" VARCHAR(200) NOT NULL,
            ""MSCDivisionCode"" VARCHAR(50) NOT NULL,
            ""MSCDivision"" VARCHAR(200) NOT NULL,
            ""MunicipalClassification"" VARCHAR(600) NOT NULL,
            ""SCOAFundCode"" VARCHAR(200) NOT NULL,
            ""SCOAFund"" VARCHAR(4000) NOT NULL,
            ""SCOARegionCode"" VARCHAR(200) NOT NULL,
            ""SCOARegion"" VARCHAR(4000) NOT NULL,
            ""SCOACostingCode"" VARCHAR(200) NOT NULL,
            ""SCOACosting"" VARCHAR(4000) NOT NULL,
            ""SCOAItemCode"" VARCHAR(200) NOT NULL,
            ""SCOAItem"" VARCHAR(4000) NOT NULL,
            ""ItemDescription"" VARCHAR(500),
            ""CurrentBudgetFinYear1"" DECIMAL(16, 2) NOT NULL,
            ""CurrentBudgetFinYear2"" DECIMAL(16, 2) NOT NULL,
            ""CurrentBudgetFinYear3"" DECIMAL(16, 2) NOT NULL,
            ""AvailableBudgetFinYear1"" DECIMAL(16, 2) NOT NULL,
            ""SplitType"" VARCHAR(50) NOT NULL,
            ""M1"" DECIMAL(16, 2) NOT NULL,
            ""M2"" DECIMAL(16, 2) NOT NULL,
            ""M3"" DECIMAL(16, 2) NOT NULL,
            ""M4"" DECIMAL(16, 2) NOT NULL,
            ""M5"" DECIMAL(16, 2) NOT NULL,
            ""M6"" DECIMAL(16, 2) NOT NULL,
            ""M7"" DECIMAL(16, 2) NOT NULL,
            ""M8"" DECIMAL(16, 2) NOT NULL,
            ""M9"" DECIMAL(16, 2) NOT NULL,
            ""M10"" DECIMAL(16, 2) NOT NULL,
            ""M11"" DECIMAL(16, 2) NOT NULL,
            ""M12"" DECIMAL(16, 2) NOT NULL,
            ""CreditDebit"" VARCHAR(50) NOT NULL,
            ""AdjustmentType"" TEXT,
            ""LegislativeAdjustmentReason"" TEXT,
            ""ReasonForAdjustment"" TEXT,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""GRAPClassification"" VARCHAR(4000),
            ""MainSegmentReporting"" VARCHAR(4000),
            ""SubSegmentReporting"" VARCHAR(4000),
            ""GRAPClassificationNote"" VARCHAR(4000),
            ""CostingProject"" BOOLEAN
        );
        CREATE TABLE IF NOT EXISTS ""Plan_BudgetAdjustmentImportVersion_DetailException"" (
            ""BudgetAdjustmentImportVersionException_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""BudgetAdjustmentImportVersionDetailID"" INTEGER NOT NULL,
            ""ExceptionDetail"" VARCHAR(1000) NOT NULL
        );
        CREATE TABLE IF NOT EXISTS ""Plan_BudgetAdjustmentImportVersion_File"" (
            ""BudgetAdjustmentImportVersionFile_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""BudgetAdjustmentExportImportVersionHeaderID"" INTEGER NOT NULL,
            ""BudgetAdjustmentImportVersionNumber"" INTEGER NOT NULL,
            ""BudgetAdjustmentImportVersionFileName"" VARCHAR(200) NOT NULL,
            ""BudgetAdjustmentImportVersionFileNameSaved"" VARCHAR(250) NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS ""Plan_BudgetAdjustmentImportVersion_OverallException"" (
            ""BudgetAdjustmentImportVersionException_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""BudgetAdjustmentExportImportVersionHeaderID"" INTEGER NOT NULL,
            ""BudgetAdjustmentImportVersionNumber"" INTEGER NOT NULL,
            ""ExceptionDetail"" VARCHAR(1000) NOT NULL
        );
        CREATE TABLE IF NOT EXISTS ""Plan_BudgetConsumption"" (
            ""BudgetConsumption_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""FinYear"" VARCHAR(9),
            ""PlanProjectItemID"" INTEGER,
            ""BudgetTransactionTypeID"" INTEGER,
            ""ModuleID"" INTEGER,
            ""PK_TransactionID"" INTEGER,
            ""TransactionTableName"" VARCHAR(100),
            ""ConsumingTransactionAmount"" DECIMAL(18, 2),
            ""ConsumingTransactionAmountMultiyear"" DECIMAL(18, 2),
            ""AdjustedTansactionAmount"" DECIMAL(18, 2),
            ""AvailableBudget"" DECIMAL(18, 2),
            ""AvailableBudgetMultiyear"" DECIMAL(18, 2),
            ""ProcessingMonth"" INTEGER,
            ""BudgetConsumptionProcessID"" INTEGER,
            ""OriginalBudgetToDate"" DECIMAL(18, 2),
            ""AdjustedBudgetToDate"" DECIMAL(18, 2),
            ""CapturedExpenditureToDate"" DECIMAL(18, 2),
            ""CapturedExpenditureToDateMultiyear"" DECIMAL(18, 2),
            ""ReserveToDate"" DECIMAL(18, 2),
            ""ReserveToDateMultiyear"" DECIMAL(18, 2),
            ""CommitToDate"" DECIMAL(18, 2),
            ""ActualToDate"" DECIMAL(18, 2),
            ""CurrentlyConsumedAmount"" DECIMAL(18, 2),
            ""CurrentlyConsumedAmountMultiyear"" DECIMAL(18, 2),
            ""InitialLine"" VARCHAR(100),
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS ""Plan_BudgetConsumption_Import"" (
            ""BudgetConsumption_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""FinYear"" VARCHAR(9),
            ""PlanProjectItemID"" INTEGER,
            ""BudgetTransactionTypeID"" INTEGER,
            ""ModuleID"" INTEGER,
            ""PK_TransactionID"" INTEGER,
            ""TransactionTableName"" VARCHAR(100),
            ""ConsumingTransactionAmount"" DECIMAL(18, 2),
            ""ConsumingTransactionAmountMultiyear"" DECIMAL(18, 2),
            ""AdjustedTansactionAmount"" DECIMAL(18, 2),
            ""AvailableBudget"" DECIMAL(18, 2),
            ""AvailableBudgetMultiyear"" DECIMAL(18, 2),
            ""ProcessingMonth"" INTEGER,
            ""BudgetConsumptionProcessID"" INTEGER,
            ""OriginalBudgetToDate"" DECIMAL(18, 2),
            ""AdjustedBudgetToDate"" DECIMAL(18, 2),
            ""CapturedExpenditureToDate"" DECIMAL(18, 2),
            ""CapturedExpenditureToDateMultiyear"" DECIMAL(18, 2),
            ""ReserveToDate"" DECIMAL(18, 2),
            ""ReserveToDateMultiyear"" DECIMAL(18, 2),
            ""CommitToDate"" DECIMAL(18, 2),
            ""ActualToDate"" DECIMAL(18, 2),
            ""CurrentlyConsumedAmount"" DECIMAL(18, 2),
            ""CurrentlyConsumedAmountMultiyear"" DECIMAL(18, 2),
            ""InitialLine"" VARCHAR(100),
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS ""Plan_BudgetMigration"" (
            ""BudgetMigration_Id"" SERIAL NOT NULL PRIMARY KEY,
            ""FromFinYear"" VARCHAR(9),
            ""ToFinYear"" VARCHAR(9),
            ""IsBudgetMigrated"" BOOLEAN,
            ""CapturerID"" INTEGER,
            ""DateCaptured"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS ""Plan_BudgetOriginalExportImportVersion_Header"" (
            ""BudgetOriginalExportImportVersionHeader_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""BudgetOriginalExportImportVersionFileName"" VARCHAR(200) NOT NULL,
            ""FinYear"" VARCHAR(50) NOT NULL,
            ""OriginalVersionID"" INTEGER NOT NULL,
            ""ProjectStatusID"" INTEGER NOT NULL,
            ""BudgetType"" VARCHAR(50) NOT NULL,
            ""StatusID"" INTEGER NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""IsProjectRegistered"" BOOLEAN,
            ""BudgetVersionID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_BudgetOriginalExportVersion_Detail"" (
            ""BudgetOriginalExportVersionDetail_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""BudgetOriginalExportImportVersionHeaderID"" INTEGER NOT NULL,
            ""FinYear1"" VARCHAR(50) NOT NULL,
            ""FinYear2"" VARCHAR(50) NOT NULL,
            ""FinYear3"" VARCHAR(50) NOT NULL,
            ""VersionID"" INTEGER NOT NULL,
            ""IDPItem"" TEXT NOT NULL,
            ""ProjectID"" INTEGER,
            ""ProjectCode"" INTEGER,
            ""ProjectName"" VARCHAR(500),
            ""ProjectDesc"" VARCHAR(500) NOT NULL,
            ""SingleMultiYear"" VARCHAR(5),
            ""PlanProjectItemID"" INTEGER,
            ""BudgetType"" VARCHAR(50) NOT NULL,
            ""SCOAProjectCode"" VARCHAR(200) NOT NULL,
            ""SCOAProject"" VARCHAR(4000) NOT NULL,
            ""SCOAFunctionCode"" VARCHAR(200) NOT NULL,
            ""SCOAFunction"" VARCHAR(4000) NOT NULL,
            ""MSCDepartmentCode"" VARCHAR(50) NOT NULL,
            ""MSCDepartment"" VARCHAR(200) NOT NULL,
            ""MSCDivisionCode"" VARCHAR(50) NOT NULL,
            ""MSCDivision"" VARCHAR(200) NOT NULL,
            ""MunicipalClassification"" VARCHAR(600) NOT NULL,
            ""SCOAFundCode"" VARCHAR(200) NOT NULL,
            ""SCOAFund"" VARCHAR(4000) NOT NULL,
            ""SCOARegionCode"" VARCHAR(200) NOT NULL,
            ""SCOARegion"" VARCHAR(4000) NOT NULL,
            ""SCOACostingCode"" VARCHAR(200) NOT NULL,
            ""SCOACosting"" VARCHAR(4000) NOT NULL,
            ""SCOAItemCode"" VARCHAR(200) NOT NULL,
            ""SCOAItem"" VARCHAR(4000) NOT NULL,
            ""ItemDescription"" VARCHAR(500),
            ""CurrentBudgetFinYear1"" DECIMAL(16, 2) NOT NULL,
            ""CurrentBudgetFinYear2"" DECIMAL(16, 2) NOT NULL,
            ""CurrentBudgetFinYear3"" DECIMAL(16, 2) NOT NULL,
            ""SplitType"" VARCHAR(50) NOT NULL,
            ""M1"" DECIMAL(16, 2) NOT NULL,
            ""M2"" DECIMAL(16, 2) NOT NULL,
            ""M3"" DECIMAL(16, 2) NOT NULL,
            ""M4"" DECIMAL(16, 2) NOT NULL,
            ""M5"" DECIMAL(16, 2) NOT NULL,
            ""M6"" DECIMAL(16, 2) NOT NULL,
            ""M7"" DECIMAL(16, 2) NOT NULL,
            ""M8"" DECIMAL(16, 2) NOT NULL,
            ""M9"" DECIMAL(16, 2) NOT NULL,
            ""M10"" DECIMAL(16, 2) NOT NULL,
            ""M11"" DECIMAL(16, 2) NOT NULL,
            ""M12"" DECIMAL(16, 2) NOT NULL,
            ""CreditDebit"" VARCHAR(50) NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""GRAPClassification"" VARCHAR(4000),
            ""GRAPClassificationNote"" VARCHAR(4000),
            ""MainSegmentReporting"" VARCHAR(4000),
            ""SubSegmentReporting"" VARCHAR(4000),
            ""CostingProject"" BOOLEAN,
            ""ActiveForSCM"" BOOLEAN
        );
        CREATE TABLE IF NOT EXISTS ""Plan_BudgetOriginalImportVersion_Detail"" (
            ""BudgetOriginalImportVersionDetail_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""BudgetOriginalExportImportVersionHeaderID"" INTEGER NOT NULL,
            ""BudgetOriginalImportVersionNumber"" INTEGER NOT NULL,
            ""FinYear1"" VARCHAR(50) NOT NULL,
            ""FinYear2"" VARCHAR(50) NOT NULL,
            ""FinYear3"" VARCHAR(50) NOT NULL,
            ""VersionID"" INTEGER NOT NULL,
            ""IDPItem"" TEXT NOT NULL,
            ""ProjectID"" INTEGER,
            ""ProjectCode"" INTEGER,
            ""ProjectName"" VARCHAR(500),
            ""ProjectDesc"" VARCHAR(500) NOT NULL,
            ""SingleMultiYear"" VARCHAR(5),
            ""PlanProjectItemID"" INTEGER,
            ""BudgetType"" VARCHAR(50) NOT NULL,
            ""SCOAProjectCode"" VARCHAR(200) NOT NULL,
            ""SCOAProject"" VARCHAR(4000) NOT NULL,
            ""SCOAFunctionCode"" VARCHAR(200) NOT NULL,
            ""SCOAFunction"" VARCHAR(4000) NOT NULL,
            ""MSCDepartmentCode"" VARCHAR(50) NOT NULL,
            ""MSCDepartment"" VARCHAR(200) NOT NULL,
            ""MSCDivisionCode"" VARCHAR(50) NOT NULL,
            ""MSCDivision"" VARCHAR(200) NOT NULL,
            ""MunicipalClassification"" VARCHAR(600) NOT NULL,
            ""SCOAFundCode"" VARCHAR(200) NOT NULL,
            ""SCOAFund"" VARCHAR(4000) NOT NULL,
            ""SCOARegionCode"" VARCHAR(200) NOT NULL,
            ""SCOARegion"" VARCHAR(4000) NOT NULL,
            ""SCOACostingCode"" VARCHAR(200) NOT NULL,
            ""SCOACosting"" VARCHAR(4000) NOT NULL,
            ""SCOAItemCode"" VARCHAR(200) NOT NULL,
            ""SCOAItem"" VARCHAR(4000) NOT NULL,
            ""ItemDescription"" VARCHAR(500),
            ""CurrentBudgetFinYear1"" DECIMAL(16, 2) NOT NULL,
            ""CurrentBudgetFinYear2"" DECIMAL(16, 2) NOT NULL,
            ""CurrentBudgetFinYear3"" DECIMAL(16, 2) NOT NULL,
            ""SplitType"" VARCHAR(50) NOT NULL,
            ""M1"" DECIMAL(16, 2) NOT NULL,
            ""M2"" DECIMAL(16, 2) NOT NULL,
            ""M3"" DECIMAL(16, 2) NOT NULL,
            ""M4"" DECIMAL(16, 2) NOT NULL,
            ""M5"" DECIMAL(16, 2) NOT NULL,
            ""M6"" DECIMAL(16, 2) NOT NULL,
            ""M7"" DECIMAL(16, 2) NOT NULL,
            ""M8"" DECIMAL(16, 2) NOT NULL,
            ""M9"" DECIMAL(16, 2) NOT NULL,
            ""M10"" DECIMAL(16, 2) NOT NULL,
            ""M11"" DECIMAL(16, 2) NOT NULL,
            ""M12"" DECIMAL(16, 2) NOT NULL,
            ""CreditDebit"" VARCHAR(50) NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""GRAPClassification"" VARCHAR(4000),
            ""MainSegmentReporting"" VARCHAR(4000),
            ""SubSegmentReporting"" VARCHAR(4000),
            ""GRAPClassificationNote"" VARCHAR(4000),
            ""CostingProject"" BOOLEAN,
            ""DeleteItem"" BOOLEAN,
            ""ActiveForSCM"" BOOLEAN
        );
        CREATE TABLE IF NOT EXISTS ""Plan_BudgetOriginalImportVersion_DetailException"" (
            ""BudgetOriginalImportVersionException_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""BudgetOriginalImportVersionDetailID"" INTEGER NOT NULL,
            ""ExceptionDetail"" VARCHAR(1000) NOT NULL
        );
        CREATE TABLE IF NOT EXISTS ""Plan_BudgetOriginalImportVersion_File"" (
            ""BudgetOriginalImportVersionFile_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""BudgetOriginalExportImportVersionHeaderID"" INTEGER NOT NULL,
            ""BudgetOriginalImportVersionNumber"" INTEGER NOT NULL,
            ""BudgetOriginalImportVersionFileName"" VARCHAR(200) NOT NULL,
            ""BudgetOriginalImportVersionFileNameSaved"" VARCHAR(250) NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS ""Plan_BudgetOriginalImportVersion_OverallException"" (
            ""BudgetOriginalImportVersionException_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""BudgetOriginalExportImportVersionHeaderID"" INTEGER NOT NULL,
            ""BudgetOriginalImportVersionNumber"" INTEGER NOT NULL,
            ""ExceptionDetail"" VARCHAR(1000) NOT NULL
        );
        CREATE TABLE IF NOT EXISTS ""Plan_BudgetRegister"" (
            ""BudgetRegister_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""PlanProjectItemID"" INTEGER,
            ""BudgetTransactionTypeID"" INTEGER,
            ""ModuleID"" INTEGER,
            ""PK_TransactionID"" INTEGER,
            ""TransactionTableName"" VARCHAR(100),
            ""TransactionAmount"" DECIMAL(18, 2),
            ""AvailableBudget"" DECIMAL(18, 2),
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""FinYear"" VARCHAR(9)
        );
        CREATE TABLE IF NOT EXISTS ""Plan_BudgetRegisterBackup"" (
            ""BudgetRegister_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""PlanProjectItemID"" INTEGER,
            ""BudgetTransactionTypeID"" INTEGER,
            ""ModuleID"" INTEGER,
            ""PK_TransactionID"" INTEGER,
            ""TransactionTableName"" VARCHAR(100),
            ""TransactionAmount"" DECIMAL(18, 2),
            ""AvailableBudget"" DECIMAL(18, 2),
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""FinYear"" VARCHAR(9)
        );
        CREATE TABLE IF NOT EXISTS ""Plan_BudgetRollover"" (
            ""BudgetRollOver_Id"" SERIAL NOT NULL PRIMARY KEY,
            ""FromFinYear"" VARCHAR(9),
            ""ToFinYear"" VARCHAR(9),
            ""IsBudgetRollover"" BOOLEAN,
            ""BudgetRolloverFileName"" VARCHAR(150),
            ""CapturerID"" INTEGER,
            ""DateCaptured"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS ""Plan_BudgetVersion"" (
            ""BudgetVersion_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""VersionNumber"" VARCHAR(20) NOT NULL,
            ""VersionName"" VARCHAR(500) NOT NULL,
            ""Comments"" VARCHAR(500) NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL
        );
        CREATE TABLE IF NOT EXISTS ""Plan_BudgetVersionDetail"" (
            ""BudgetVersionDetail_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""BudgetVersionID"" INTEGER NOT NULL,
            ""ProjectID"" INTEGER NOT NULL,
            ""FinYear"" VARCHAR(18),
            ""IDPItemID"" INTEGER NOT NULL,
            ""CapitalOperation"" INTEGER NOT NULL,
            ""ScoaProjectID"" INTEGER NOT NULL,
            ""SCOACostingID"" INTEGER NOT NULL,
            ""ProjectTypeID"" INTEGER,
            ""PlanProjectItemID"" INTEGER NOT NULL,
            ""ProjectItemID"" INTEGER,
            ""SCOAItemID"" INTEGER NOT NULL,
            ""SCOAFundId"" INTEGER NOT NULL,
            ""BudgetAmount"" DECIMAL(16, 2),
            ""BudgetAmountCurP1"" DECIMAL(16, 2),
            ""BudgetAmountCurP2"" DECIMAL(16, 2),
            ""SCOAFunctionId"" INTEGER NOT NULL,
            ""SCOARegionId"" INTEGER NOT NULL,
            ""DivisionId"" INTEGER NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CostingProject"" BOOLEAN
        );
        CREATE TABLE IF NOT EXISTS ""Plan_BudgetVersionMonths"" (
            ""BudgetVersionMonth_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""BudgetVersionID"" INTEGER NOT NULL,
            ""ProjectItemMonth_ID"" INTEGER,
            ""PlanProjectItemID"" INTEGER NOT NULL,
            ""MonthID"" INTEGER NOT NULL,
            ""UnitQuantity"" DECIMAL(16, 2) NOT NULL,
            ""UnitPrice"" DECIMAL(16, 2) NOT NULL,
            ""CaptureID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""VirementId"" INTEGER,
            ""AdjustmentId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_BudgetZeroExportImportVersion_Header"" (
            ""BudgetZeroExportImportVersionHeader_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""BudgetZeroExportImportVersionFileName"" VARCHAR(200) NOT NULL,
            ""FinYear"" VARCHAR(50) NOT NULL,
            ""ZeroVersionID"" INTEGER NOT NULL,
            ""ProjectStatusID"" INTEGER NOT NULL,
            ""BudgetType"" VARCHAR(50) NOT NULL,
            ""StatusID"" INTEGER NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""IsProjectRegistered"" BOOLEAN,
            ""BudgetVersionID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_BudgetZeroImportVersion_Detail"" (
            ""BudgetZeroImportVersionDetail_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""BudgetZeroExportImportVersionHeaderID"" INTEGER NOT NULL,
            ""BudgetZeroImportVersionNumber"" INTEGER NOT NULL,
            ""FinYear1"" VARCHAR(50) NOT NULL,
            ""FinYear2"" VARCHAR(50) NOT NULL,
            ""FinYear3"" VARCHAR(50) NOT NULL,
            ""VersionID"" INTEGER NOT NULL,
            ""IDPItem"" TEXT NOT NULL,
            ""ProjectID"" INTEGER,
            ""ProjectCode"" INTEGER,
            ""ProjectName"" VARCHAR(500),
            ""ProjectDesc"" VARCHAR(500) NOT NULL,
            ""SingleMultiYear"" VARCHAR(5),
            ""PlanProjectItemID"" INTEGER,
            ""BudgetType"" VARCHAR(50) NOT NULL,
            ""SCOAProjectCode"" VARCHAR(200) NOT NULL,
            ""SCOAProject"" VARCHAR(4000) NOT NULL,
            ""SCOAFunctionCode"" VARCHAR(200) NOT NULL,
            ""SCOAFunction"" VARCHAR(4000) NOT NULL,
            ""MSCDepartmentCode"" VARCHAR(50) NOT NULL,
            ""MSCDepartment"" VARCHAR(200) NOT NULL,
            ""MSCDivisionCode"" VARCHAR(50) NOT NULL,
            ""MSCDivision"" VARCHAR(200) NOT NULL,
            ""MunicipalClassification"" VARCHAR(600) NOT NULL,
            ""SCOAFundCode"" VARCHAR(200) NOT NULL,
            ""SCOAFund"" VARCHAR(4000) NOT NULL,
            ""SCOARegionCode"" VARCHAR(200) NOT NULL,
            ""SCOARegion"" VARCHAR(4000) NOT NULL,
            ""SCOACostingCode"" VARCHAR(200) NOT NULL,
            ""SCOACosting"" VARCHAR(4000) NOT NULL,
            ""SCOAItemCode"" VARCHAR(200) NOT NULL,
            ""SCOAItem"" VARCHAR(4000) NOT NULL,
            ""ItemDescription"" VARCHAR(500),
            ""CurrentBudgetFinYear1"" DECIMAL(16, 2) NOT NULL,
            ""CurrentBudgetFinYear2"" DECIMAL(16, 2) NOT NULL,
            ""CurrentBudgetFinYear3"" DECIMAL(16, 2) NOT NULL,
            ""SplitType"" VARCHAR(50) NOT NULL,
            ""M1"" DECIMAL(16, 2) NOT NULL,
            ""M2"" DECIMAL(16, 2) NOT NULL,
            ""M3"" DECIMAL(16, 2) NOT NULL,
            ""M4"" DECIMAL(16, 2) NOT NULL,
            ""M5"" DECIMAL(16, 2) NOT NULL,
            ""M6"" DECIMAL(16, 2) NOT NULL,
            ""M7"" DECIMAL(16, 2) NOT NULL,
            ""M8"" DECIMAL(16, 2) NOT NULL,
            ""M9"" DECIMAL(16, 2) NOT NULL,
            ""M10"" DECIMAL(16, 2) NOT NULL,
            ""M11"" DECIMAL(16, 2) NOT NULL,
            ""M12"" DECIMAL(16, 2) NOT NULL,
            ""CreditDebit"" VARCHAR(50) NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""GRAPClassification"" VARCHAR(4000),
            ""MainSegmentReporting"" VARCHAR(4000),
            ""SubSegmentReporting"" VARCHAR(4000),
            ""GRAPClassificationNote"" VARCHAR(4000),
            ""CostingProject"" BOOLEAN,
            ""ActiveForSCM"" BOOLEAN,
            ""ZeroBudgetItemReason"" TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS ""Plan_BudgetZeroImportVersion_DetailException"" (
            ""BudgetZeroImportVersionException_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""BudgetZeroImportVersionDetailID"" INTEGER NOT NULL,
            ""ExceptionDetail"" VARCHAR(1000) NOT NULL
        );
        CREATE TABLE IF NOT EXISTS ""Plan_BudgetZeroImportVersion_File"" (
            ""BudgetZeroImportVersionFile_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""BudgetZeroExportImportVersionHeaderID"" INTEGER NOT NULL,
            ""BudgetZeroImportVersionNumber"" INTEGER NOT NULL,
            ""BudgetZeroImportVersionFileName"" VARCHAR(200) NOT NULL,
            ""BudgetZeroImportVersionFileNameSaved"" VARCHAR(250) NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS ""Plan_FundingBudgetVersion"" (
            ""FundingBudgetVersion_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""VersionNumber"" VARCHAR(20) NOT NULL,
            ""VersionName"" VARCHAR(500) NOT NULL,
            ""Comments"" VARCHAR(500) NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL
        );
        CREATE TABLE IF NOT EXISTS ""Plan_FundingBudgetVersionDetails"" (
            ""FundingBudgetVersionDetail_Id"" SERIAL NOT NULL PRIMARY KEY,
            ""FundingBudgetVersionId"" INTEGER NOT NULL,
            ""FundingSourceBudgetDetail_ID"" INTEGER NOT NULL,
            ""FundingSourceBudgetHeaderID"" INTEGER NOT NULL,
            ""FinancialYear"" VARCHAR(9),
            ""FundingSourceID"" INTEGER,
            ""ScoaID"" INTEGER NOT NULL,
            ""FundingSourceBudget"" DECIMAL(16, 2) NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""UploadedDocument"" VARCHAR(255)
        );
        CREATE TABLE IF NOT EXISTS ""Plan_FundingSourceBudget_Detail"" (
            ""FundingSourceBudgetDetail_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""FundingSourceBudgetHeaderID"" INTEGER NOT NULL,
            ""FundingSourceID"" INTEGER,
            ""ScoaID"" INTEGER NOT NULL,
            ""FundingSourceBudget"" DECIMAL(16, 2) NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""IsHidden"" BOOLEAN,
            ""UploadedDocument"" VARCHAR(255),
            ""PreviousReferenceId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_FundingSourceBudget_Header"" (
            ""FundingSourceBudgetHeader_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""FinancialYear"" VARCHAR(50) NOT NULL,
            ""Submitted"" BOOLEAN NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""PreviousReferenceId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_FundingSourceChanges"" (
            ""PlanFundingSourceChange_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""FundingSourceDetailsID"" INTEGER NOT NULL,
            ""FundSourceChangeID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS ""Plan_FundingSourceDocs"" (
            ""FundingSourceDocs_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""SupportingDocsID"" INTEGER,
            ""FundingSourceBudgetDetailID"" INTEGER,
            ""ScoaID"" INTEGER,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_GetApprovedVirementFromSP_Temp"" (
            ""Rownumber"" INTEGER NOT NULL PRIMARY KEY,
            ""FinYear"" VARCHAR(9),
            ""VirementAmount"" DECIMAL(16, 2),
            ""ReasonForVirement"" TEXT,
            ""FirstApprover"" VARCHAR(200),
            ""SecondApprover"" VARCHAR(200),
            ""ThirdApprover"" VARCHAR(200),
            ""FileName"" VARCHAR(255),
            ""FromHistoricalProjectCode"" VARCHAR(100),
            ""FromProjectName"" VARCHAR(500),
            ""FromCapitalOperation"" INTEGER,
            ""FromScoaProjectID"" UUID,
            ""FromDivisionID"" INTEGER,
            ""FromSCOAFunctionID"" UUID,
            ""FromSCOARegionID"" UUID,
            ""FromSCOACostingID"" UUID,
            ""FromSCOAItemID"" UUID,
            ""FromScoaFundID"" UUID,
            ""FromProjectItemID"" INTEGER,
            ""ToHistoricalProjectCode"" VARCHAR(100),
            ""ToProjectName"" VARCHAR(500),
            ""ToCapitalOperation"" INTEGER,
            ""ToScoaProjectID"" UUID,
            ""ToDivisionID"" INTEGER,
            ""ToSCOAFunctionID"" UUID,
            ""ToSCOARegionID"" UUID,
            ""ToSCOACostingID"" UUID,
            ""ToSCOAItemID"" UUID,
            ""ToScoaFundID"" UUID,
            ""ToProjectItemID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_IDPMTREFApproval"" (
            ""IDPMTREFApproval_Id"" SERIAL NOT NULL PRIMARY KEY,
            ""FinancialYear"" VARCHAR(9),
            ""IsInitializeIDPMTREF"" BOOLEAN,
            ""ApprovedIDPFileName"" VARCHAR(500),
            ""ApprovedMTREFFileName"" VARCHAR(500),
            ""ApprovedBy"" INTEGER NOT NULL,
            ""ApprovedDate"" TIMESTAMP NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_MTREFApproval"" (
            ""IDPMTREFApproval_Id"" SERIAL NOT NULL PRIMARY KEY,
            ""FinancialYear"" VARCHAR(9),
            ""IsInitializeIDPMTREF"" BOOLEAN,
            ""ApprovedMTREFFileName"" VARCHAR(500),
            ""ApprovedBy"" INTEGER NOT NULL,
            ""ApprovedDate"" TIMESTAMP NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""CouncilApprovedDate"" TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS ""Plan_MTREFDraft"" (
            ""MTREFDarft_Id"" SERIAL NOT NULL PRIMARY KEY,
            ""FinancialYear"" VARCHAR(9),
            ""IsApprovedMTREFDraft"" BOOLEAN,
            ""ApprovedMTREFDraftFileName"" VARCHAR(500),
            ""ApprovedBy"" INTEGER NOT NULL,
            ""ApprovedDate"" TIMESTAMP NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_Project"" (
            ""Project_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""ProjectName"" VARCHAR(500) NOT NULL,
            ""ProjectDesc"" VARCHAR(500) NOT NULL,
            ""ProjectManagerID"" INTEGER,
            ""SupplyChainOfficialID"" INTEGER,
            ""CapitalOperation"" INTEGER,
            ""CostEstimate"" DECIMAL(16, 2) NOT NULL,
            ""ScoaProjectID"" INTEGER NOT NULL,
            ""EstimatedStartDate"" TIMESTAMP,
            ""EstimatedEndDate"" TIMESTAMP,
            ""ProjectStatus"" INTEGER NOT NULL,
            ""CommencementDate"" TIMESTAMP,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""FinYear"" VARCHAR(9),
            ""ProjectDetailDesc"" VARCHAR(500),
            ""ProjectCategoryID"" INTEGER,
            ""ProjectImplementAgentID"" INTEGER,
            ""Longitude"" VARCHAR(200),
            ""Latitude"" VARCHAR(200),
            ""ProgrammeManagerID"" INTEGER,
            ""FinancialControllerID"" INTEGER,
            ""ProjectTypeID"" INTEGER,
            ""EstimatedDuration"" INTEGER,
            ""ProjectDistinctionID"" INTEGER,
            ""IsDeleted"" BOOLEAN,
            ""HistoricalProjectCode"" VARCHAR(100),
            ""ProjectParentID"" INTEGER,
            ""SingleMultiYear"" VARCHAR(5),
            ""PreviousReferenceId"" INTEGER,
            ""ProjectCode"" INTEGER,
            ""CostingProject"" BOOLEAN
        );
        CREATE TABLE IF NOT EXISTS ""Plan_Project_Beneficiaries"" (
            ""PlanProjectBeneficiary_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""ProjectID"" INTEGER NOT NULL,
            ""PlanperHousehold"" INTEGER,
            ""ActperHousehold"" INTEGER,
            ""PlanperPeople"" INTEGER,
            ""ActperPeople"" INTEGER,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_Project_CashFlow"" (
            ""ProjectCashFlow_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""ProjectFundID"" INTEGER NOT NULL,
            ""ProjectID"" INTEGER NOT NULL,
            ""PeriodEnd"" TIMESTAMP NOT NULL,
            ""PlanDirect"" DECIMAL(16, 2),
            ""PlanIndirect"" DECIMAL(16, 2),
            ""RevDirect"" DECIMAL(16, 2),
            ""RevIndirect"" DECIMAL(16, 2),
            ""RevComment"" VARCHAR(200),
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS ""Plan_ProjectDivisions"" (
            ""ProjectDivision_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""ProjectID"" INTEGER NOT NULL,
            ""DivisionID"" INTEGER NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""PreviousReferenceId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_ProjectFunctions"" (
            ""ProjectFunction_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""ProjectID"" INTEGER NOT NULL,
            ""ScoaFunctionID"" INTEGER NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""PreviousReferenceId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_ProjectFund"" (
            ""ProjectFund_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""ProjectID"" INTEGER NOT NULL,
            ""ScoaFundID"" INTEGER NOT NULL,
            ""FundAmount"" DECIMAL(16, 2),
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""FundReference"" VARCHAR(200),
            ""VirementId"" INTEGER,
            ""AdjustmentId"" INTEGER,
            ""PreviousReferenceId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_ProjectFundYear"" (
            ""ProjectFundYear_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""ProjectFundID"" INTEGER NOT NULL,
            ""FinYear"" VARCHAR(9) NOT NULL,
            ""YearFundAmount"" DECIMAL(16, 2) NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""VirementId"" INTEGER,
            ""AdjustmentId"" INTEGER,
            ""PreviousReferenceId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_ProjectIDP"" (
            ""ProjectIDP_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""ProjectID"" INTEGER NOT NULL,
            ""ParentIDPItemID"" INTEGER NOT NULL,
            ""ProjectIDPItemID"" INTEGER NOT NULL,
            ""Percentage"" DECIMAL(5, 2) NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""Latitude"" DECIMAL(18, 8),
            ""Longitude"" DECIMAL(18, 8),
            ""PreviousReferenceId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_ProjectItem"" (
            ""PlanProjectItem_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""ProjectID"" INTEGER NOT NULL,
            ""ProjectItemID"" INTEGER,
            ""ProjectItemCode"" INTEGER,
            ""SCOAItemID"" INTEGER NOT NULL,
            ""FinYear"" VARCHAR(9) NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""ProjectFundYearID"" INTEGER,
            ""SCOAFundId"" INTEGER,
            ""BudgetAmount"" DECIMAL(16, 2),
            ""BudgetAmountCurP1"" DECIMAL(16, 2),
            ""BudgetAmountCurP2"" DECIMAL(16, 2),
            ""SCOAFunctionId"" INTEGER,
            ""SCOARegionId"" INTEGER,
            ""DivisionId"" INTEGER,
            ""BudgetSplitID"" INTEGER,
            ""VirementId"" INTEGER,
            ""HistoricalProjectCode"" VARCHAR(100),
            ""AdjustmentId"" INTEGER,
            ""ModificationNumber"" INTEGER,
            ""SCOACostingID"" INTEGER,
            ""IsItemLocked"" BOOLEAN,
            ""CreditDebit"" VARCHAR(6),
            ""PreviousReferenceId"" INTEGER,
            ""GRAPClassification"" VARCHAR(4000),
            ""GRAPClassificationNote"" VARCHAR(4000),
            ""MainSegmentReporting"" VARCHAR(4000),
            ""SubSegmentReporting"" VARCHAR(4000),
            ""IsActiveForSCM"" BOOLEAN,
            ""ZeroBudgetItem"" BOOLEAN,
            ""ZeroBudgetItemReason"" TEXT
        );
        CREATE TABLE IF NOT EXISTS ""Plan_ProjectItemDocs"" (
            ""ProjectItemDocs_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""SupportingDocsID"" INTEGER,
            ""PlanProjectItemID"" INTEGER,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""PreviousReferenceId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_ProjectItemMonth"" (
            ""ProjectItemMonth_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""PlanProjectItemID"" INTEGER NOT NULL,
            ""MonthID"" INTEGER NOT NULL,
            ""UnitQuantity"" DECIMAL(16, 2) NOT NULL,
            ""UnitPrice"" DECIMAL(16, 2) NOT NULL,
            ""CaptureID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""VirementId"" INTEGER,
            ""AdjustmentId"" INTEGER,
            ""PreviousReferenceId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_ProjectJustification"" (
            ""PlanProjectJustification_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""ProjectID"" INTEGER NOT NULL,
            ""ProjectJustificationID"" INTEGER NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS ""Plan_ProjectRegions"" (
            ""ProjectRegion_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""ProjectID"" INTEGER NOT NULL,
            ""ScoaRegionID"" INTEGER NOT NULL,
            ""RegionPercent"" DECIMAL(16, 2),
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""PreviousReferenceId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_SupplementaryAdjustment"" (
            ""SupplementaryAdjustment_Id"" SERIAL NOT NULL PRIMARY KEY,
            ""FinancialYear"" VARCHAR(9),
            ""AdjustmentVersionId"" INTEGER,
            ""AdjustmentFundingVersionId"" INTEGER,
            ""IsSupplementaryAdjustment"" BOOLEAN,
            ""SupplementaryAdjustmentFileName"" VARCHAR(500),
            ""IsAdjustmentFinalApproved"" BOOLEAN,
            ""FinalApprovedBy"" INTEGER NOT NULL,
            ""FinalApprovedDate"" TIMESTAMP NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_TrackChanges"" (
            ""TrackChanges_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""PlanProjectItem_ID"" INTEGER,
            ""ProjectID"" INTEGER NOT NULL,
            ""FinYear"" VARCHAR(9),
            ""ProjectItemID"" INTEGER,
            ""SCOAItemID"" INTEGER,
            ""SCOAFunctionId"" INTEGER,
            ""SCOAFundId"" INTEGER,
            ""SCOARegionId"" INTEGER,
            ""DivisionId"" INTEGER,
            ""OriginalBudgetAmount"" DECIMAL(16, 2),
            ""OriginalBudgetAmountCurP1"" DECIMAL(16, 2),
            ""OriginalBudgetAmountCurP2"" DECIMAL(16, 2),
            ""RevisedBudgetAmount"" DECIMAL(16, 2),
            ""RevisedBudgetAmountCurP1"" DECIMAL(16, 2),
            ""RevisedBudgetAmountCurP2"" DECIMAL(16, 2),
            ""Comment"" TEXT,
            ""CommentFor"" VARCHAR(50),
            ""IsProjectDeleted"" BOOLEAN,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS ""Plan_TrackChangesVirement"" (
            ""TrackChangesVirement_Id"" SERIAL NOT NULL PRIMARY KEY,
            ""VirementId"" INTEGER NOT NULL,
            ""FinYear"" VARCHAR(50) NOT NULL,
            ""FromProjectId"" INTEGER NOT NULL,
            ""ToProjectId"" INTEGER NOT NULL,
            ""FromSCOAProjectID"" INTEGER,
            ""ToSCOAProjectID"" INTEGER,
            ""FromSCOAFunctionId"" INTEGER,
            ""ToSCOAFunctionId"" INTEGER,
            ""FromDivisionId"" INTEGER,
            ""ToDivisionId"" INTEGER,
            ""FromSCOAFundID"" INTEGER,
            ""ToSCOAFundID"" INTEGER,
            ""FromSCOARegion"" INTEGER,
            ""ToSCOARegion"" INTEGER,
            ""FromSCOAItem"" INTEGER,
            ""ToSCOAItem"" INTEGER,
            ""ReasonForVirement"" TEXT,
            ""FromAvailableFund"" DECIMAL(16, 2),
            ""FromVirementAmount"" DECIMAL(16, 2),
            ""FromNewAvailableBudget"" DECIMAL(16, 2),
            ""ToAvailableFund"" DECIMAL(16, 2),
            ""ToVirementAmount"" DECIMAL(16, 2),
            ""ToNewAvailableBudget"" DECIMAL(16, 2),
            ""VirementReferenceNumber"" VARCHAR(20),
            ""FromCapitalOperation"" INTEGER,
            ""ToCapitalOperation"" INTEGER,
            ""UploadedVirementDoc"" VARCHAR(255),
            ""IsNewItemAdded"" BOOLEAN,
            ""FromSCOACostingId"" INTEGER,
            ""ToSCOACostingId"" INTEGER,
            ""VirementStatus"" INTEGER,
            ""FromProjectItemId"" INTEGER,
            ""ToProjectItemId"" INTEGER,
            ""OriginalVirementAmount"" DECIMAL(16, 2),
            ""RevisedVirementAmount"" DECIMAL(16, 2),
            ""TransferBy"" INTEGER NOT NULL,
            ""TransferOn"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS ""Plan_TrackExceptions"" (
            ""TrackException_Id"" SERIAL NOT NULL PRIMARY KEY,
            ""FinYear"" VARCHAR(9),
            ""IsSCOAProject"" BOOLEAN,
            ""IsSCOAFunction"" BOOLEAN,
            ""IsSCOARegion"" BOOLEAN,
            ""IsSCOACosting"" BOOLEAN,
            ""IsSCOAFunding"" BOOLEAN,
            ""IsSCOAItemIR"" BOOLEAN,
            ""IsSCOAItemIE"" BOOLEAN,
            ""IsSCOAItemIA"" BOOLEAN,
            ""IsSCOAItemIL"" BOOLEAN,
            ""IsSCOAItemIZ"" BOOLEAN,
            ""IsSCOAItemLN"" BOOLEAN,
            ""CapturerID"" INTEGER,
            ""DateCaptured"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS ""Plan_VirementApprovalRejections"" (
            ""VirementApprovalRejectionId"" SERIAL NOT NULL PRIMARY KEY,
            ""VirementId"" INTEGER,
            ""IsApproved"" BOOLEAN,
            ""ApprovedBy"" INTEGER,
            ""ApprovedOn"" TIMESTAMP,
            ""IsRejected"" BOOLEAN,
            ""RejectReason"" TEXT,
            ""RejectedBy"" INTEGER,
            ""RejectedOn"" TIMESTAMP,
            ""CapturerID"" INTEGER,
            ""DateCaptured"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS ""Plan_VirementApprovalUsers"" (
            ""VirementApprovalUserId"" SERIAL NOT NULL PRIMARY KEY,
            ""VirementId"" INTEGER,
            ""UserId"" INTEGER,
            ""CapturerID"" INTEGER,
            ""DateCaptured"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS ""Plan_VirementBudgetSplit"" (
            ""VirementBudgetSplit_Id"" SERIAL NOT NULL PRIMARY KEY,
            ""VirementId"" INTEGER,
            ""AdjustmentId"" INTEGER,
            ""BudgetSplitId"" INTEGER,
            ""Month1Price"" DECIMAL(16, 2),
            ""Month2Price"" DECIMAL(16, 2),
            ""Month3Price"" DECIMAL(16, 2),
            ""Month4Price"" DECIMAL(16, 2),
            ""Month5Price"" DECIMAL(16, 2),
            ""Month6Price"" DECIMAL(16, 2),
            ""Month7Price"" DECIMAL(16, 2),
            ""Month8Price"" DECIMAL(16, 2),
            ""Month9Price"" DECIMAL(16, 2),
            ""Month10Price"" DECIMAL(16, 2),
            ""Month11Price"" DECIMAL(16, 2),
            ""Month12Price"" DECIMAL(16, 2),
            ""Month13Price"" DECIMAL(16, 2),
            ""Month14Price"" DECIMAL(16, 2),
            ""CaptureID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""TransferFromTo"" VARCHAR(10)
        );
        CREATE TABLE IF NOT EXISTS ""Plan_VirementPolicyApproval"" (
            ""VirementPolicyApproval_Id"" SERIAL NOT NULL PRIMARY KEY,
            ""FinancialYear"" VARCHAR(9),
            ""IsApprovedVirementPolicy"" BOOLEAN,
            ""ApprovedVirementPolicyFileName"" VARCHAR(500),
            ""ApprovedBy"" INTEGER NOT NULL,
            ""ApprovedDate"" TIMESTAMP NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_VirementPolicyVersion"" (
            ""VirementPolicyVersion_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""FinancialYear"" VARCHAR(9) NOT NULL,
            ""VersionNumber"" VARCHAR(20) NOT NULL,
            ""VersionName"" VARCHAR(500) NOT NULL,
            ""Comments"" VARCHAR(500) NOT NULL,
            ""IsCouncilApprovedPolicy"" BOOLEAN,
            ""ApprovedVirementPolicyFileName"" VARCHAR(500),
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_VirementPolicyVersionDetail"" (
            ""VirementPolicyVersionDetail_ID"" SERIAL NOT NULL PRIMARY KEY,
            ""VirementPolicyVersionID"" INTEGER NOT NULL,
            ""VirementRule_ID"" INTEGER NOT NULL,
            ""Priority"" INTEGER NOT NULL,
            ""VirementDesc"" VARCHAR(200) NOT NULL,
            ""VirementDefinition"" TEXT NOT NULL,
            ""VirementRuleDesc"" VARCHAR(500) NOT NULL,
            ""BusinessRule"" TEXT NOT NULL,
            ""Enabled"" BOOLEAN NOT NULL,
            ""Option"" BOOLEAN NOT NULL,
            ""Lockdown"" BOOLEAN NOT NULL,
            ""FinYear"" VARCHAR(9),
            ""PreviousReferenceId"" INTEGER,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Plan_Virements"" (
            ""VirementId"" SERIAL NOT NULL PRIMARY KEY,
            ""FinYear"" VARCHAR(50) NOT NULL,
            ""FromProjectId"" INTEGER NOT NULL,
            ""ToProjectId"" INTEGER NOT NULL,
            ""FromSCOAProjectID"" INTEGER,
            ""ToSCOAProjectID"" INTEGER,
            ""FromSCOAFunctionId"" INTEGER,
            ""ToSCOAFunctionId"" INTEGER,
            ""FromDivisionId"" INTEGER,
            ""ToDivisionId"" INTEGER,
            ""FromSCOAFundID"" INTEGER,
            ""ToSCOAFundID"" INTEGER,
            ""FromSCOARegion"" INTEGER,
            ""ToSCOARegion"" INTEGER,
            ""FromSCOAItem"" INTEGER,
            ""ToSCOAItem"" INTEGER,
            ""ReasonForVirement"" TEXT,
            ""FromAvailableFund"" DECIMAL(16, 2),
            ""FromVirementAmount"" DECIMAL(16, 2),
            ""FromNewAvailableBudget"" DECIMAL(16, 2),
            ""ToAvailableFund"" DECIMAL(16, 2),
            ""ToVirementAmount"" DECIMAL(16, 2),
            ""ToNewAvailableBudget"" DECIMAL(16, 2),
            ""VirementReferenceNumber"" VARCHAR(20),
            ""TransferBy"" INTEGER NOT NULL,
            ""TransferOn"" TIMESTAMP NOT NULL,
            ""CapturerID"" INTEGER NOT NULL,
            ""DateCaptured"" TIMESTAMP NOT NULL,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""FromCapitalOperation"" INTEGER,
            ""ToCapitalOperation"" INTEGER,
            ""UploadedVirementDoc"" VARCHAR(255),
            ""IsNewItemAdded"" BOOLEAN,
            ""FromSCOACostingId"" INTEGER,
            ""ToSCOACostingId"" INTEGER,
            ""FromProjectItemId"" INTEGER,
            ""ToProjectItemId"" INTEGER,
            ""VirementStatus"" INTEGER,
            ""FromUkey"" VARCHAR(100),
            ""FromPlanProjectItemID"" INTEGER,
            ""ToUkey"" VARCHAR(100),
            ""ToPlanProjectItemID"" INTEGER
        );
      ";
      await db.Database.ExecuteSqlRawAsync(createEmsTablesSql);

    var createConstTablesSql = @"
        CREATE TABLE IF NOT EXISTS ""Const_BudgetConsumptionProcess_Sys"" (
            ""BudgetConsumptionProcess_ID"" INTEGER NOT NULL PRIMARY KEY,
            ""BudgetConsumptionProcessDesc"" TEXT,
            ""BudgetConsumptionProcessEnabled"" BOOLEAN NOT NULL DEFAULT FALSE,
            ""DateCaptured"" TIMESTAMP,
            ""CapturerID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_BudgetSplitOptions"" (
            ""BudgetSplit_ID"" INTEGER NOT NULL PRIMARY KEY,
            ""BudgetSplitDesc"" TEXT,
            ""DivideBy_ID"" INTEGER,
            ""Enabled"" BOOLEAN NOT NULL DEFAULT FALSE,
            ""DateCaptured"" TIMESTAMP,
            ""CapturerID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_BudgetTransactionType_sys"" (
            ""BudgetTransactionType_ID"" INTEGER NOT NULL PRIMARY KEY,
            ""BudgetTransDesc"" TEXT,
            ""Enabled"" BOOLEAN NOT NULL DEFAULT FALSE,
            ""CapturerID"" INTEGER,
            ""DateCaptured"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS ""Const_BudgetValidationRule_Sys"" (
            ""BudgetValidationRule_ID"" INTEGER NOT NULL PRIMARY KEY,
            ""BudgetValidationRuleDesc"" TEXT,
            ""BudgetValidationRuleApplicableOverallBudget"" BOOLEAN NOT NULL DEFAULT FALSE,
            ""BudgetValidationRuleEnabled"" BOOLEAN NOT NULL DEFAULT FALSE,
            ""DateCaptured"" TIMESTAMP,
            ""CapturerID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_PlanAdjustmentReason_sys"" (
            ""AdjustmentReason_ID"" INTEGER NOT NULL PRIMARY KEY,
            ""Number"" INTEGER,
            ""AdjustmentReason"" TEXT,
            ""Enabled"" BOOLEAN NOT NULL DEFAULT FALSE,
            ""Lockdown"" BOOLEAN NOT NULL DEFAULT FALSE,
            ""DateCaptured"" TIMESTAMP,
            ""CapturerID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""Reference"" TEXT,
            ""FinYear"" VARCHAR(20),
            ""PreviousReferenceId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_PlanAdjustmentType_sys"" (
            ""AdjustmentType_ID"" INTEGER NOT NULL PRIMARY KEY,
            ""Number"" INTEGER,
            ""AdjustmentType"" TEXT,
            ""Enabled"" BOOLEAN NOT NULL DEFAULT FALSE,
            ""Lockdown"" BOOLEAN NOT NULL DEFAULT FALSE,
            ""DateCaptured"" TIMESTAMP,
            ""CapturerID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""FinYear"" VARCHAR(20),
            ""PreviousReferenceId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_PlanCapitalOperationalTypes_sys"" (
            ""Type_ID"" INTEGER NOT NULL PRIMARY KEY,
            ""TypeName"" TEXT,
            ""TypeValue"" INTEGER,
            ""Enabled"" BOOLEAN NOT NULL DEFAULT FALSE,
            ""DateCaptured"" TIMESTAMP,
            ""CapturerID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""SortOrder"" INTEGER,
            ""StatusID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_PlanVirementRules_sys"" (
            ""VirementRule_ID"" INTEGER NOT NULL PRIMARY KEY,
            ""Priority"" INTEGER,
            ""VirementDesc"" TEXT,
            ""VirementDefinition"" TEXT,
            ""VirementRuleDesc"" TEXT,
            ""BusinessRule"" TEXT,
            ""Enabled"" BOOLEAN NOT NULL DEFAULT FALSE,
            ""Option"" BOOLEAN NOT NULL DEFAULT FALSE,
            ""Lockdown"" BOOLEAN NOT NULL DEFAULT FALSE,
            ""DateCaptured"" TIMESTAMP,
            ""CapturerID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""FinYear"" VARCHAR(20),
            ""PreviousReferenceId"" INTEGER,
            ""VirementPolicyVersionID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_Status"" (
            ""Status_ID"" INTEGER NOT NULL PRIMARY KEY,
            ""StatusDesc"" TEXT,
            ""UsedBy"" TEXT,
            ""Enabled"" BOOLEAN NOT NULL DEFAULT FALSE,
            ""DateCaptured"" TIMESTAMP,
            ""CapturerID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_IDPLevelDescription_Detail"" (
            ""IDPLevelDescDetail_ID"" INTEGER NOT NULL PRIMARY KEY,
            ""IDPLevelDescHeaderID"" INTEGER,
            ""IDPLevelNumber"" INTEGER,
            ""IDPLevelDesc"" TEXT,
            ""DateCaptured"" TIMESTAMP,
            ""CapturerID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""PreviousReferenceId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_IDPLevelDescription_Header"" (
            ""IDPLevelDescHeader_ID"" INTEGER NOT NULL PRIMARY KEY,
            ""FinancialYear"" VARCHAR(20),
            ""IDPNumLevel"" INTEGER,
            ""IDPLevelDescSubmitted"" INTEGER,
            ""DateCaptured"" TIMESTAMP,
            ""CapturerID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""PreviousReferenceId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_IDPNationalKPA_Detail"" (
            ""NationalKPADetail_ID"" INTEGER NOT NULL PRIMARY KEY,
            ""NationalKPAHeaderID"" INTEGER,
            ""NationalKPANumber"" INTEGER,
            ""NationalKPADesc"" TEXT,
            ""NationalKPAEnabled"" BOOLEAN,
            ""DateCaptured"" TIMESTAMP,
            ""CapturerID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""PreviousReferenceId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_IDPNationalKPA_Header"" (
            ""NationalKPAHeader_ID"" INTEGER NOT NULL PRIMARY KEY,
            ""FinancialYear"" VARCHAR(20),
            ""NationalKPASubmitted"" BOOLEAN,
            ""DateCaptured"" TIMESTAMP,
            ""CapturerID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""PreviousReferenceId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""IDP_Item"" (
            ""Item_ID"" INTEGER NOT NULL PRIMARY KEY,
            ""ItemDesc"" TEXT,
            ""FinancialYear"" VARCHAR(20),
            ""ItemParentID"" INTEGER,
            ""IDPLevelNumber"" INTEGER,
            ""ItemOrderID"" INTEGER,
            ""CapturerID"" INTEGER,
            ""DateCaptured"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""ActProjID"" INTEGER,
            ""isProj"" BOOLEAN,
            ""KpiID"" INTEGER,
            ""NationalKPADetailID"" INTEGER,
            ""IDPInitialized"" INTEGER,
            ""PreviousReferenceId"" INTEGER
        );
        CREATE TABLE IF NOT EXISTS ""Const_SCOA_Function_Structure_Consolidated"" (
            ""ScoaID"" INTEGER NOT NULL PRIMARY KEY,
            ""FinYear"" BIGINT,
            ""FinYearText"" VARCHAR(20),
            ""ScoaCode"" VARCHAR(100),
            ""LevelID"" INTEGER,
            ""PostingLevel"" VARCHAR(20),
            ""BreakDownAllowed"" VARCHAR(20),
            ""ScoaDesc"" TEXT,
            ""ScoaShortDesc"" TEXT,
            ""ScoaParentID"" INTEGER,
            ""ParentID"" BOOLEAN,
            ""NTGFSCode"" VARCHAR(100),
            ""NTVatStatus"" VARCHAR(50),
            ""NTSCOAFile"" VARCHAR(50),
            ""NTScoaLevel"" INTEGER,
            ""NTExcelRowNumber"" VARCHAR(50),
            ""NTPrinciple"" VARCHAR(100),
            ""NTApplicableTo"" VARCHAR(100),
            ""NTPostingLevelDescription"" TEXT,
            ""NTScoaID"" VARCHAR(50),
            ""NTParentScoaId"" VARCHAR(50),
            ""Enabled"" BOOLEAN,
            ""Version"" VARCHAR(20)
        );
        CREATE TABLE IF NOT EXISTS ""Const_SCOA_Funds_Structure_Consolidated"" (
            ""ScoaID"" INTEGER NOT NULL PRIMARY KEY,
            ""FinYear"" BIGINT,
            ""FinYearText"" VARCHAR(20),
            ""ScoaCode"" VARCHAR(100),
            ""LevelID"" INTEGER,
            ""PostingLevel"" VARCHAR(20),
            ""BreakDownAllowed"" VARCHAR(20),
            ""ScoaDesc"" TEXT,
            ""ScoaShortDesc"" TEXT,
            ""ScoaParentID"" INTEGER,
            ""ParentID"" BOOLEAN,
            ""NTGFSCode"" VARCHAR(100),
            ""NTVatStatus"" VARCHAR(50),
            ""NTSCOAFile"" VARCHAR(50),
            ""NTScoaLevel"" INTEGER,
            ""NTExcelRowNumber"" VARCHAR(50),
            ""NTPrinciple"" VARCHAR(100),
            ""NTApplicableTo"" VARCHAR(100),
            ""NTPostingLevelDescription"" TEXT,
            ""NTScoaID"" VARCHAR(50),
            ""NTParentScoaId"" VARCHAR(50),
            ""Enabled"" BOOLEAN,
            ""Version"" VARCHAR(20)
        );
        CREATE TABLE IF NOT EXISTS ""Const_SCOA_Project_Structure_Consolidated"" (
            ""ScoaID"" INTEGER NOT NULL PRIMARY KEY,
            ""FinYear"" BIGINT,
            ""FinYearText"" VARCHAR(20),
            ""ScoaCode"" VARCHAR(100),
            ""LevelID"" INTEGER,
            ""PostingLevel"" VARCHAR(20),
            ""BreakDownAllowed"" VARCHAR(20),
            ""ScoaDesc"" TEXT,
            ""ScoaShortDesc"" TEXT,
            ""ScoaParentID"" INTEGER,
            ""ParentID"" BOOLEAN,
            ""NTGFSCode"" VARCHAR(100),
            ""NTVatStatus"" VARCHAR(50),
            ""NTSCOAFile"" VARCHAR(50),
            ""NTScoaLevel"" INTEGER,
            ""NTExcelRowNumber"" VARCHAR(50),
            ""NTPrinciple"" VARCHAR(100),
            ""NTApplicableTo"" VARCHAR(100),
            ""NTPostingLevelDescription"" TEXT,
            ""NTScoaID"" VARCHAR(50),
            ""NTParentScoaId"" VARCHAR(50),
            ""Enabled"" BOOLEAN,
            ""Version"" VARCHAR(20)
        );
        CREATE TABLE IF NOT EXISTS ""Const_SCOA_Regional_Structure_Consolidated"" (
            ""ScoaID"" INTEGER NOT NULL PRIMARY KEY,
            ""FinYear"" BIGINT,
            ""FinYearText"" VARCHAR(20),
            ""ScoaCode"" VARCHAR(100),
            ""LevelID"" INTEGER,
            ""PostingLevel"" VARCHAR(20),
            ""BreakDownAllowed"" VARCHAR(20),
            ""ScoaDesc"" TEXT,
            ""ScoaShortDesc"" TEXT,
            ""ScoaParentID"" INTEGER,
            ""ParentID"" BOOLEAN,
            ""NTGFSCode"" VARCHAR(100),
            ""NTVatStatus"" VARCHAR(50),
            ""NTSCOAFile"" VARCHAR(50),
            ""NTScoaLevel"" INTEGER,
            ""NTExcelRowNumber"" VARCHAR(50),
            ""NTPrinciple"" VARCHAR(100),
            ""NTApplicableTo"" VARCHAR(100),
            ""NTPostingLevelDescription"" TEXT,
            ""NTScoaID"" VARCHAR(50),
            ""NTParentScoaId"" VARCHAR(50),
            ""Enabled"" BOOLEAN,
            ""Version"" VARCHAR(20)
        );
        CREATE TABLE IF NOT EXISTS ""Const_SCOA_Structure_Consolidated"" (
            ""ScoaID"" INTEGER NOT NULL PRIMARY KEY,
            ""FinYear"" BIGINT,
            ""FinYearText"" VARCHAR(20),
            ""ScoaCode"" VARCHAR(100),
            ""LevelID"" INTEGER,
            ""PostingLevel"" VARCHAR(20),
            ""BreakDownAllowed"" VARCHAR(20),
            ""ScoaDesc"" TEXT,
            ""ScoaShortDesc"" TEXT,
            ""ScoaParentID"" INTEGER,
            ""ParentID"" BOOLEAN,
            ""NTGFSCode"" VARCHAR(100),
            ""NTVatStatus"" VARCHAR(50),
            ""NTSCOAFile"" VARCHAR(50),
            ""NTScoaLevel"" INTEGER,
            ""NTExcelRowNumber"" VARCHAR(50),
            ""NTPrinciple"" VARCHAR(100),
            ""NTApplicableTo"" VARCHAR(100),
            ""NTPostingLevelDescription"" TEXT,
            ""NTScoaID"" VARCHAR(50),
            ""NTParentScoaId"" VARCHAR(50),
            ""Enabled"" BOOLEAN,
            ""Version"" VARCHAR(20),
            ""TableID"" INTEGER,
            ""TableName"" VARCHAR(100),
            ""VoteTypeID"" INTEGER,
            ""DebitCreditID"" BOOLEAN,
            ""VatIndicatorID"" INTEGER,
            ""VatApportionment"" BOOLEAN,
            ""CapitalTimePeriodID"" INTEGER,
            ""IsCapexVote"" BOOLEAN,
            ""IsControlVote"" BOOLEAN,
            ""DefinitionDescription"" TEXT
        );
        CREATE TABLE IF NOT EXISTS ""Const_SCOA_Costing_Structure_Consolidated"" (
            ""ScoaID"" INTEGER NOT NULL PRIMARY KEY,
            ""FinYear"" BIGINT,
            ""FinYearText"" VARCHAR(20),
            ""ScoaCode"" VARCHAR(100),
            ""LevelID"" INTEGER,
            ""PostingLevel"" VARCHAR(20),
            ""BreakDownAllowed"" VARCHAR(20),
            ""ScoaDesc"" TEXT,
            ""ScoaShortDesc"" TEXT,
            ""ScoaParentID"" INTEGER,
            ""ParentID"" BOOLEAN,
            ""NTGFSCode"" VARCHAR(100),
            ""NTVatStatus"" VARCHAR(50),
            ""NTSCOAFile"" VARCHAR(50),
            ""NTScoaLevel"" INTEGER,
            ""NTExcelRowNumber"" VARCHAR(50),
            ""NTPrinciple"" VARCHAR(100),
            ""NTApplicableTo"" VARCHAR(100),
            ""NTPostingLevelDescription"" TEXT,
            ""NTScoaID"" VARCHAR(50),
            ""NTParentScoaId"" VARCHAR(50),
            ""Enabled"" BOOLEAN,
            ""Version"" VARCHAR(20)
        );
    ";
    await db.Database.ExecuteSqlRawAsync(createConstTablesSql);

    await db.Database.ExecuteSqlRawAsync(@"
        CREATE TABLE IF NOT EXISTS ""Const_ProjectType"" (
            ""ProjectType_ID"" SERIAL PRIMARY KEY,
            ""ProjectTypeDescrip"" VARCHAR(200),
            ""Enabled"" BOOLEAN NOT NULL DEFAULT TRUE,
            ""DateCaptured"" TIMESTAMP,
            ""CapturerID"" INTEGER,
            ""DateModified"" TIMESTAMP,
            ""ModifierID"" INTEGER,
            ""FinYear"" VARCHAR(20),
            ""PreviousReferenceId"" INTEGER
        );
    ");

    var seedSqlPath = Path.Combine(AppContext.BaseDirectory, "Data", "SeedSystemConstants.sql");
    if (!File.Exists(seedSqlPath))
        seedSqlPath = Path.Combine(Directory.GetCurrentDirectory(), "Data", "SeedSystemConstants.sql");
    if (File.Exists(seedSqlPath))
    {
        var conn = (Npgsql.NpgsqlConnection)db.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open)
            await conn.OpenAsync();

        using var streamReader = new StreamReader(seedSqlPath);
        string? line;
        string? currentTable = null;
        var batch = new System.Text.StringBuilder();
        int batchCount = 0;
        const int BatchSize = 500;

        async Task FlushBatchAsync()
        {
            if (batch.Length == 0) return;
            using var cmd = conn.CreateCommand();
            cmd.CommandText = batch.ToString();
            cmd.CommandTimeout = 300;
            await cmd.ExecuteNonQueryAsync();
            batch.Clear();
            batchCount = 0;
        }

        async Task<bool> TableHasDataAsync(string tableName)
        {
            using var cmd = conn.CreateCommand();
            cmd.CommandText = $"SELECT EXISTS(SELECT 1 FROM \"{tableName}\" LIMIT 1)";
            var result = await cmd.ExecuteScalarAsync();
            return result is true;
        }

        bool skipCurrentTable = false;

        while ((line = await streamReader.ReadLineAsync()) != null)
        {
            var trimmed = line.Trim();
            if (trimmed.StartsWith("-- "))
            {
                await FlushBatchAsync();
                currentTable = trimmed.Substring(3).Trim();
                skipCurrentTable = currentTable != null && await TableHasDataAsync(currentTable);
                continue;
            }
            if (!trimmed.StartsWith("INSERT") || skipCurrentTable) continue;

            batch.AppendLine(trimmed);
            batchCount++;
            if (batchCount >= BatchSize)
                await FlushBatchAsync();
        }
        await FlushBatchAsync();
    }

    await SeedData.SeedAsync(db);
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();

var spaPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "platinum-budget-ui", "dist", "browser");
if (Directory.Exists(spaPath))
{
    app.UseDefaultFiles(new DefaultFilesOptions
    {
        FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(spaPath)
    });
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(spaPath),
        OnPrepareResponse = ctx =>
        {
            var path = ctx.File.Name;
            if (path == "index.html")
            {
                ctx.Context.Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
                ctx.Context.Response.Headers["Pragma"] = "no-cache";
                ctx.Context.Response.Headers["Expires"] = "0";
            }
        }
    });
}

app.MapControllers();

if (Directory.Exists(spaPath))
{
    app.MapFallbackToFile("index.html", new StaticFileOptions
    {
        FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(spaPath),
        OnPrepareResponse = ctx =>
        {
            ctx.Context.Response.Headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
            ctx.Context.Response.Headers["Pragma"] = "no-cache";
            ctx.Context.Response.Headers["Expires"] = "0";
        }
    });
}

app.Run("http://0.0.0.0:3001");
